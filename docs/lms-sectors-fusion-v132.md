# LMS + Sectors fusion + Dynamic KB index · v132+ plan (analysis @alvaro)

## TL;DR · què entreguem

Tres workstreams paral·lels que conflueixen ·

1. **`wo-research-lms`** · primer d'una sèrie · esqueleto del LMS de SOS (research what · com · integració API)
2. **`wo-sectors-fusion`** · unir `/learn?tab=sectors` + `/sectors` page (KnowledgeLoader.js) + sector-agents v131b/c
3. **`wo-dynamic-kb-index`** · indexador automàtic que detecta novetats al repo GitHub + KB local + permaweb

## Diagnòstic actual · què tenim

### 3 vistes que s'han d'unificar
| Lloc | Què mostra | Font dades | Estat |
|---|---|---|---|
| `/sectors` (`SectorsView.js`) | Catàleg 19 sectors A-S amb readiness + roles + transaccions | `KnowledgeLoader.getSectorSeed()` parseja `knowledge/sectors/*.md` | Solid · 197 LOC · roles predefinits valuosos |
| `/learn?tab=sectors` (`LearnView._renderSectorsTab`) | Grid sectors molt més compact · less drill-down | `loadIndex` + `stats` de `knowledgeIndexService` | OK però redundant amb /sectors |
| `/prompts-debug` panel domini (v127) | Override manual + detect domain | `domainDetector.js` packs + `sectorAgentLoader` | Per a IA experts |

### Capes de coneixement sobre sectors (evolució acumulada)

| Capa | Què té | Versió |
|---|---|---|
| `knowledge/sectors/*.md` frontmatter | sector_name + cnae + tags | v11.1 origen |
| Roles bilingüe (es/en) al frontmatter | nom + descripció + castell_level + fmv_usd_h | v11.1 |
| `domainDetector.js` packs | 24 sub-domain packs amb arquetip rich | v126/127 |
| `sectorAgentLoader.js` | parser canonical + validate + buildContextBlock | v131 |
| `skill_levels` per role | junior/mid/senior/principal amb skills concretes | v131b/c |
| `sops_canonical` per sector | 5 SOPs típics adaptats al castell pattern | v131b/c |
| `skillsMarketplaceService.js` | agregació + match candidates + cross-sector | v131c |
| `sectorQualityRubric.js` | evaluateProjectAgainstSector + score | v131c |

**TOT això viu en silos** · no hi ha vista única que fusioni les 8 capes. El /sectors actual mostra capa 1+2 (frontmatter + roles bilingüe). El user vol fusió completa.

## Pla v132 · 3 workstreams

### Workstream 1 · `wo-research-lms` (primer de la sèrie)

**Què** · esquelet de research per al LMS de SOS. Aquesta WO és la BASE per a una sèrie de WOs futurs (wo-lms-content-engine · wo-lms-api-market · wo-lms-permaweb-publishing · etc).

**Sub-tasques** ·
- [ ] Research · top 5 LMS open source (Moodle · OpenEdX · Canvas LMS · LearnDash · Chamilo) · pros/contras per a SOS
- [ ] Research · LMS comercials moderns (TalentLMS · Docebo · LearnUpon · Absorb) · API capabilities
- [ ] Estratègia · build vs buy · headless LMS vs full-stack vs custom
- [ ] Spec · API pública SOS LMS · endpoints mínims (courses · enrollments · progress · certifications)
- [ ] Auth · qui pot consumir l'API (SBT identity · cohort members · external partners)
- [ ] Monetització · model freemium · subscriptors · pay-per-course · royalties als sectors-agents
- [ ] Esquema dades · LMS Content Node (KB type='lms_content') amb format compatible Scorm + xAPI
- [ ] Doc · `knowledge/vision/lms-strategy.md`

**Entregable** · doc estratègic + diagrama arquitectural + API spec v0.1 + 3-5 user stories.

**Effort** · L · 2-3 dies de research + 1 dia drafting

### Workstream 2 · `wo-sectors-fusion`

**Què** · fusionar les 3 vistes (`/sectors` · `/learn?tab=sectors` · panel /prompts-debug) en una vista unificada potent.

**Disseny** · nou view `SectorAgentExplorerView.js` (ruta `/sectors/agents/:id`) ·

```
┌── /sectors (Catàleg) ──────────────────────────────────┐
│  Grid · 21 sectors A-U · cada card mostra ·             │
│    - sector_name + CNAE oficial                         │
│    - status canonical (✓ verd · partial groc · etc)     │
│    - roles count · skill_levels count · sops canonical  │
│    - cross-sector skill connections (cap a altres)      │
│  Click card → /sectors/agents/M                         │
└─────────────────────────────────────────────────────────┘

┌── /sectors/agents/M (Sector Agent Explorer) ──────────┐
│ Tabs ·                                                 │
│   📋 Identity      · CNAE + descripció + tags           │
│   👥 Roles (8)     · per casteller level · drill-down  │
│   📚 Skills        · level taxonomy + per-role + market │
│   ⚙ SOPs          · canonical 5 · castell_level        │
│   🎯 Patterns      · intangibles + cicles recíprocs    │
│   🤖 Agent prompt  · how IA usa aquest sector (preview)│
│   📊 Used in       · projectes existents amb sector=M  │
└────────────────────────────────────────────────────────┘
```

**Migració** ·
- `/sectors` segueix funcionant amb millores
- `/learn?tab=sectors` redirigeix a `/sectors` (o l'absorbeix com a sub-vista compacta)
- Els roles bilingüe NO es perden · es mostren al tab Roles
- Els sectors v131b/c canonical mostren TOTES les 8 capes

**Effort** · XL · ~5-7 dies (analysis + design + implementation + tests + migració)

### Workstream 3 · `wo-dynamic-kb-index`

**Què** · indexador que detecta novetats automàticament · sense haver de mantenir `_index.md` manualment.

**Fonts** ·
1. **GitHub repo** · poll últims commits a `knowledge/` (via API GitHub o webhook) · detecta fitxers nous/modificats
2. **KB local** · query `KB.getAllNodes({ since: lastIndexTs })` · nodes nous després d'última indexació
3. **Permaweb** · GraphQL gateway query · transactions amb tag `App-Name=SOS-V11` posteriors al cursor

**Output** ·
- `knowledge/_index.json` auto-generat (no més edició manual)
- Diff report · "què hi ha de nou des de la setmana passada"
- Notificació al feed neural-path · "afegit knowledge/sectors/X.md per @alvaro"
- API endpoint `/api/kb-index/latest` per a consum extern

**Effort** · L · ~2-3 dies

## Sprint plan estimats

| Sprint | Workstream | Effort | Resultat |
|---|---|---:|---|
| v132 | wo-research-lms | L | Doc estratègic + API spec v0.1 (RESEARCH only) |
| v133 | wo-dynamic-kb-index | L | indexador automatitzat + API endpoint |
| v134-135 | wo-sectors-fusion | XL | Vista nova + migració /sectors + /learn |
| v136+ | wo-lms-* series | XL × N | LMS engine real + content + API public |

## Principis · KISS · DRY · evolutiu

- **NO refactoritzar** els 3 vistes actuals fins tenir el disseny acordat
- **No perdre** cap dada existent (roles bilingüe · readiness · CNAE seeds)
- **API first** · cada vista nova ha de tenir un endpoint public corresponent (per a LMS api fiability)
- **Permaweb friendly** · cada content node ha de ser publicable individualment
- **Local-first** · l'usuari pot operar sense KB extern (offline mode)

## Decisions a prendre abans de començar v132

| Pregunta | Recomanació |
|---|---|
| Build LMS o usar OpenEdX/Moodle headless? | **Build minimal core · integrar Scorm/xAPI players** (no reinventar la roda completa) |
| Sectors v131b/c skill_levels manuals o auto-generats? | **Manuals amb regla** (qualitat > quantitat) · auto-gen per a casos no canonical |
| Dynamic KB index polling o webhook? | **Webhook GitHub** (gratis · real-time) + fallback polling 1×/hora |

---

*Doc viu · creat 2026-05-18 com a resposta a la request @alvaro post-v131c · evolución sectors → agents → LMS.*
