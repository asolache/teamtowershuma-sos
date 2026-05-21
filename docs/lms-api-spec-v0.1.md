# SOS LMS · API Spec v0.1 (wo-research-lms entregable v132)

> Especificació API pública per al **SOS LMS minimal** · base per als sprints
> v141-v144 (engine · content · API market · permaweb publishing).
> Stack canonical · build hybrid · scorm-again + xAPI client + Netlify Edge Fns.

## TL;DR · 12 endpoints REST + xAPI standard

Tots auth via **SBT identity** (no API key tradicional). 3 grups d'endpoints ·
1. **Catàleg** (5 endpoints) · cursos · mòduls · lessons · skills · sectors
2. **Enrollment & progress** (4 endpoints) · enroll · status · complete · certificate
3. **xAPI standard** (3 endpoints) · statements · agents · activities

## Endpoints catàleg

### GET `/api/lms/courses`
Llista cursos públics + cohort-restricted accessibles.

```json
Response 200 · {
  "courses": [
    {
      "id": "course-vna-basics",
      "title": "VNA · Verna Allee Value Network Analysis · Fonaments",
      "slug": "vna-basics",
      "description": "...",
      "duration_minutes": 240,
      "level": "junior|mid|senior|principal",
      "sectors": ["M", "Q", "R"],
      "skills_taught": ["vna", "casteller-model", "soc-design"],
      "lessons_count": 12,
      "enrollments_count": 87,
      "completion_rate": 0.73,
      "scorm_compatible": true,
      "xapi_compatible": true,
      "cohort_restricted": null,
      "price_eur": 0,
      "permaweb_tx": "abc123..."
    }
  ],
  "pagination": { "page": 1, "per_page": 20, "total": 47 }
}
```

### GET `/api/lms/courses/:id`
Detall d'un curs amb llista de lessons.

### GET `/api/lms/courses/:id/lessons`
Llista lessons (capítols) ordenades.

### GET `/api/lms/skills`
Catàleg skills (reutilitza `skillsMarketplaceService.skillsTaxonomySummary()`).

### GET `/api/lms/sectors`
Catàleg sectors (reutilitza `sectorAgentLoader.listSectorAgents()`).

## Endpoints enrollment & progress

### POST `/api/lms/enroll`
Matricula un usuari a un curs.
```json
Request · { "course_id": "course-vna-basics" }
Headers · X-SOS-Identity: <SBT-token>
Response 201 · { "enrollment_id": "...", "course_id": "...", "started_at": "..." }
```

### GET `/api/lms/enrollments/me`
Tots els cursos matriculats per a l'identitat actual.

### POST `/api/lms/progress`
Reporta progress (compatible Scorm cmi.* i xAPI).
```json
Request · {
  "enrollment_id": "...",
  "lesson_id": "...",
  "status": "in-progress|completed",
  "score": 0-100,
  "duration_seconds": 1240
}
```

### POST `/api/lms/certificate`
Genera certificat (attestation signat) quan curs completat.
```json
Request · { "enrollment_id": "..." }
Response 201 · {
  "certificate_id": "...",
  "attestation_node": { ... · type='attestation' subtype='lms_certificate' },
  "permaweb_publish_optional": true
}
```

## Endpoints xAPI standard

### POST `/api/lms/xapi/statements`
xAPI Tin Can compatible · enviar statement.
```json
Request · {
  "actor": { "mbox": "mailto:user@example.com", "name": "Alice" },
  "verb": { "id": "http://adlnet.gov/expapi/verbs/completed", "display": { "en": "completed" } },
  "object": {
    "id": "https://sos.teamtowershuma.com/lms/courses/vna-basics",
    "definition": { "name": { "en": "VNA Basics" }, "type": "http://adlnet.gov/expapi/activities/course" }
  },
  "result": { "completion": true, "success": true, "score": { "scaled": 0.85 } },
  "timestamp": "2026-05-19T10:30:00Z"
}
```

### GET `/api/lms/xapi/statements?agent=mailto:user@example.com`
Llista statements per a un agent.

### GET `/api/lms/xapi/activities/:id`
Detall d'una activitat (lesson · curs · exercici).

## Schema KB · LMS Content Node

```yaml
type: lms_content
content:
  kind: course|lesson|quiz|video|article|interactive
  id: course-vna-basics                # canonical slug
  parent_id: null                       # course no té · lesson sí
  title: "VNA · Fonaments"
  description: "..."
  level: mid                            # junior|mid|senior|principal
  sectors: [M, Q, R]                    # CNAE sectors aplicables
  skills_taught: [vna, casteller-model] # skill slugs
  prerequisites: []                     # course/lesson ids requerits abans
  duration_minutes: 240
  body_md: "..."                        # markdown contingut
  scorm_package_url: null               # opcional · path zip SCORM
  xapi_activity_id: "https://..."       # canonical xAPI id
  quiz_schema: null                     # JSON schema quiz embebed
  video_url: null                       # YouTube/Vimeo/permaweb
  cohort_restricted: null               # cohort_id si privat
  price_eur: 0                          # 0=gratuit · >0 paid
  author_did: "did:sos:@alvaro"
  permaweb_tx: null                     # arweave tx si publicat
  signature: "..."                      # ECDSA signature
  created_at: 1700000000
  updated_at: 1700000000
```

## Auth · SBT identity (no API key)

```
Header · X-SOS-Identity: <signed-token>
```

On `signed-token` és el `identity_id` + `expires_at` signat ECDSA pel par de
claus de l'usuari (mateix sistema que `projectIO.signSnapshot`).

Edge function valida ·
1. Parse token (base64 JSON)
2. Verify signature against `public_registry_entry` per a identity_id
3. Check `expires_at` no expirat (TTL 15 min · refresh automàtic)
4. Retorna user context (cohorts · plans actius · attestations)

## Monetització · Slicing Pie compatible

- **Cursos gratuïts** (price_eur=0) · accessibles a tothom autenticat
- **Cursos paid** (price_eur>0) · stripe payment + auto-enroll
- **Cohort-restricted** · només membres del cohort · pagat via cohort membership
- **Royalties al author** · 70% al `author_did` · 30% al SOS network (auto-distribuït slicing pie)
- **Free trial** · primer lesson sempre gratuita per a permetre preview

## Endpoints futurs (v143+)

- `/api/lms/quiz/submit` · submetre respostes quiz · scoring server-side
- `/api/lms/recommendations` · cursos recomanats basant-se en skill gap
- `/api/lms/leaderboard` · ranking cohort per skill
- `/api/lms/api-keys` · external partners
- `/api/lms/webhooks` · notify-on-enrollment per a integracions

## Compatibilitat estàndards

| Estàndard | Suport | Notes |
|---|---|---|
| **SCORM 1.2** | Sí · import via scorm-again | Player JS al navegador |
| **SCORM 2004** | Sí · import via scorm-again | Player JS al navegador |
| **xAPI (Tin Can)** | Native · statements al KB | `type=xapi_statement` |
| **LTI 1.3** | No (v143+ candidat) | Per a integració LMS tercers |
| **OpenBadges 3.0** | Roadmap · certificats podran ser badges | `attestation` extensible |

## Casos d'ús API externs (partners)

1. **Acceleradora externa** · llistar cohort members + progress · API + webhooks
2. **Coach freelance** · enroll students en curs SOS + cobrar via stripe + rebre 70%
3. **Empresa formació** · publicar cursos SCORM al SOS · cobrar segons enrollments
4. **Investigador acadèmic** · accés a xAPI statements anonimitzats per a recerca aprenentatge

## Timeline implementació (3 sprints)

| Sprint | What | Effort |
|---|---|---:|
| v141 | LMS content engine · scorm-again + xAPI client + quiz engine + 5 endpoints catàleg | XL |
| v142 | LMS content bootstrap · 5 cursos seed (VNA · Pact · Wallet · LMS basics · Skills) | XL |
| v143 | LMS API market public · enrollment/progress/cert + xAPI 3 endpoints + auth SBT | L |
| v144 | LMS permaweb publishing · cursos signats + arweave tx + revisable comunitat | M |

## Decisions arquitectòniques

1. **No 3rd-party LMS** · zero dependència Moodle/OpenEdX (constraint hardware @alvaro)
2. **Storage** · cursos viuen al KB local · publicables al permaweb opcional
3. **Auth** · SBT identity (decentralized) · no API keys tradicional
4. **Royalties** · auto-distribució via Slicing Pie (no manual)
5. **xAPI first** · més flexible que SCORM · alineat amb node-graph SOS

---

*API spec v0.1 · creat 2026-05-19 com a entregable de wo-research-lms.
Doc viu · evolucionar amb feedback v141 implementation.*
