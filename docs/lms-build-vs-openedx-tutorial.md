# LMS · build vs OpenEdX vs Moodle · tutorial educatiu per @alvaro

> Doc educatiu · ajuda @alvaro a tenir criteri sobre LMS build vs integration.
> Constraint clau · ha de funcionar al **Mac mid-2012 · macOS 10.15.8 · 1GHz Intel i7 4-core · 6GB RAM · GeForce GT 650M 512MB**

## TL;DR · 3 opcions amb pros/contras

| Opció | Stack | Pros | Contras | Mac compat |
|---|---|---|---|---|
| **A · Build minimal core SOS** | JS pur · KB · permaweb | Local-first · zero infra · alineació total amb SOS | Reinventar molt · feedback lent | ✓✓✓ |
| **B · Headless OpenEdX** | OpenEdX backend + SOS UI | Molt contingut existent · Scorm/xAPI · LTI | Backend pesat · cal servidor · cost cloud | ✗ (massa pesat) |
| **C · Headless Moodle + integration** | Moodle backend + SOS UI | Madur · plugins · gratuit | LMS antic UX · PHP backend pesat | △ (Docker complicat) |
| **D · Hybrid · core + Scorm/xAPI player open** | JS + scorm-again player | Mix bo · player open · contingut estàndard | Cal mantenir el core | ✓✓✓ |

## Q1 · Què és un LMS?

LMS = **Learning Management System**. Gestiona ·
1. Cursos (contingut estructurat)
2. Estudiants (matriculació · progrés)
3. Avaluacions (quizzes · exàmens · certificats)
4. Reporting (qui ha fet què)
5. API (per a integrar)

Exemples · **Moodle** (1999 · PHP · antic UX) · **OpenEdX** (2012 MIT/Harvard · Python · MOOC pesat) · **Canvas LMS** (Ruby · UX millor) · **TalentLMS/Docebo** (comercials cloud) · **LearnDash** (plugin WordPress).

## Q2 · Scorm vs xAPI

### SCORM (Shareable Content Object Reference Model)
- Creat 2001 (US dept defensa) · antic però universal
- Format · `.zip` amb manifest XML + HTML/JS
- Cada LMS pot importar SCORM
- **Limitacions** · només dins LMS · poc detall progrés

### xAPI (Experience API · Tin Can)
- Creat 2013 com a successor de SCORM · API REST modern
- Trackea **qualsevol experiència** (no només cursos · also "ha llegit article" · "ha completat exercici")
- Format · statements `{ actor, verb, object }` (ex: "@alvaro · completed · Curs VNA bàsic")
- **És el que SOS V11 hauria d'usar** · més flexible · alineat amb node-graph

## Q3 · Per què el hardware importa?

El teu Mac mid-2012 · 6GB RAM · GT 650M ·
- **Docker** funciona lent · contenidors > 2GB cadascun = problemes
- **OpenEdX** necessita ~16GB RAM mínim · NO encaixa local · ha de córrer cloud
- **Moodle Docker** ~4GB RAM · marginal a 6GB
- **WordPress + LearnDash** viable però lent
- **Build minimal JS al navegador** · zero servidor · funciona sense problema

**Conclusió** · per al teu hardware, **build minimal core** és l'única opció que funciona LOCAL sense cloud.

## Q4 · Què tenim ja a SOS que serveix de LMS?

Sorprenentment, molt ·

| Funció LMS | Existeix? | On |
|---|---|---|
| Contingut estructurat | ✅ | `knowledge/sectors/*.md` + `knowledge/vision/*.md` (GitHub-versioned) |
| Estudiants/usuaris | ✅ | identity + SBT skills a `/identity` |
| Trackeig progrés | ✅ | neural path (visit · edit · ai-fill) a `neuralPathService.js` |
| Certificats | 🟡 | attestation system · cal extendre |
| Skills/competències | ✅ | skill_levels + canonical SOPs per sector (v131b/c) |
| API tracking | 🟡 | KB query existeix · falta API pública exposada |
| Quizzes | ❌ | falta implementar |
| Player contingut | 🟡 | markdown renderer existeix · falta video/interactive |

**~70% del LMS ja està construït** com a sub-producte de SOS. Falta · player + quizzes + API pública.

## Q5 · Decisió recomanada · OPCIÓ D · Hybrid

**Build minimal core SOS + integrar player Scorm/xAPI open source.**

Per què ·
1. ✅ Funciona al teu Mac (sense Docker/cloud heavy)
2. ✅ Aprofita el 70% existent
3. ✅ Compatibilitat amb contingut SCORM/xAPI extern
4. ✅ Alineació node-graph SOS (curs = node KB · lesson = sub-node)
5. ✅ Permaweb publishable (cursos versionats descentralitzats)

### Stack proposat

| Component | Eina | Llicència |
|---|---|---|
| **Player SCORM** | [scorm-again](https://github.com/jcputney/scorm-again) | MIT |
| **xAPI client** | [tincan.js](https://github.com/RusticiSoftware/TinCanJS) | Apache 2.0 |
| **Quiz engine** | Custom · JSON schema · viu al KB | propi |
| **Video player** | `<video>` HTML5 nadiu | nadiu |
| **Progress tracking** | `neuralPathService.appendStep` (existent) | propi |
| **Certificats** | `attestationService` (extensible) | propi |
| **API pública** | Netlify Edge Functions `/api/lms/*` | gratuit free tier |

### Quan SÍ OpenEdX/Moodle

- Si voleu **importar cursos SCORM tercers** (educació superior)
- Autopagament/comerç integrat (ja tens Stripe a SOS)
- **Proctoring** (vigilància exàmens) o **gamification** complex
- 2-3 anys més · quan SOS sigui gros · afegir Moodle headless com a "import gateway"

## Q6 · Timeline implementació LMS minimal

| Sprint | What | Effort |
|---|---|---:|
| v132 | wo-research-lms · doc estratègic + API spec v0.1 | L |
| v141 | wo-lms-content-engine · scorm-again + xAPI + quiz engine | XL |
| v142 | wo-lms-content-bootstrap · 5 cursos seed | XL |
| v143 | wo-lms-api-market · API pública `/api/lms/*` SBT-auth | L |
| v144 | wo-knowledge-permaweb-publish · cursos seleccionats | M |

## Q7 · LMS UX moderna per inspiració

- **Khan Academy** · progress bar · gamification suau
- **Coursera** · course → module → lesson · quizzes embebed
- **Notion + Loom** · "no és LMS" però creators ho usen lightweight
- **Maven** · cohort-based courses · alineat amb cohort model SOS

## Q8 · Costos reals

| Stack | Cost mensual | Notes |
|---|---:|---|
| Build minimal SOS | **0€** | Local · permaweb gratis llegir |
| Moodle Cloud · 100 users | ~30-100€ | + manteniment |
| OpenEdX Cloud · 100 users | ~150-400€ | Servidor pesat |
| TalentLMS · 100 users | ~89€/mes | Comercial cloud |
| LearnDash WP | ~199€/any plugin | + hosting WP |

**Build minimal SOS · cost zero a alfa · cost mínim a scale** (Netlify Edge Functions free tier ample).

## Conclusió per a @alvaro

**Recomanació final** ·
1. **Build minimal core SOS LMS** (opció D híbrida)
2. **Sprint v132** · només research + doc estratègic (sense codi)
3. **Sprint v141+** · execució LMS quan tinguem alfa estabilitzada

**Què aprendre per a tenir criteri** ·
- Llegir 1h doc de **scorm-again** · saps com funciona un player
- Provar **Khan Academy** com a estudiant · UX bona
- Llegir [xAPI spec](https://github.com/adlnet/xAPI-Spec) (30 min · Actor·Verb·Object és el core)

## Recursos

- [scorm-again wiki](https://github.com/jcputney/scorm-again/wiki) · 30 min
- [xAPI essentials](https://xapi.com/overview/) · 20 min
- [OpenEdX vs Moodle 2024](https://elearningindustry.com/) · comparatives

---

*Doc educatiu · creat 2026-05-19 per @alvaro com a base de decisió LMS post-v132.*
