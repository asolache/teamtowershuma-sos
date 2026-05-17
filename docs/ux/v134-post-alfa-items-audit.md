# v134 · Auditoria · 7 items post-alfa del deep analysis v132b

> Status report de què hi ha realment implementat al codebase per a cada un
> dels 7 items que el doc `docs/vna-deep-analysis-v132b.md` (sectio
> "Per analitzar/integrar post-alfa") va llistar com a candidats per a
> millorar la generació del mapa de valor.

| # | Item | Status | Evidència codebase |
|---|---|---|---|
| 1 | **Pre-thinking phase** · clarification questions | ✅ **Sí v135** | `js/core/vnaClarify.js` · async `vnaClarify({context,provider})` retorna {questions:[]} + helper `enrichContextWithAnswers` |
| 2 | **Multi-turn conversational** · 2a crida si gaps | ✅ **Sí v135** | `js/core/vnaGapDetector.js` · `detectGaps()` pure + `runGapFillTurn()` 2a crida targeted + `mergeGapFill()` dedupe |
| 3 | **Embedding similarity** · fusionar rols similars | ✅ **Sí v136** | `js/core/roleDedup.js` · `cosineSimilarity` + `detectDuplicateRoles({embedder, threshold})` + `mergeDuplicates` (transitive · remap txs · self-loop filter · dedupe) · `dedupRoles` composite · 2 embedder factories (OpenAI · Mock test) |
| 4 | **Real-time co-creation** · accept/reject per rol | ✅ Sí | `ValueMapView` `_aiProposals` sistema funcional · botons "✓ Aceptar / ✕" · CSS `.vmap-proposal-card.accepted/rejected` · v131+ |
| 5 | **Cross-project pattern mining** | 🟡 Estàtic | 24 domain packs + 21 sectors CNAE canonical pre-curats · **no runtime mining** (no aprèn de projectes reals) |
| 6 | **xAPI tracking quality** | ✅ **Sí v136** | `js/core/xapiService.js` · Tin Can compatible (verbs canonical adl.gov + SOS extension namespace · activity types) · `recordStatement` + 4 helpers SOS (`recordMapGenerated/Accepted/ClarifyAnswered/GapFilled`) + `listStatements` filter + `summarizeStatements` agg · KB persistent type='xapi_statement' |
| 7 | **Wiki community moderation** · arquetip publicable | ❌ No | `permaweb-skills-share` existeix per a skills · NO per a arquetip · `domainDetector` és source-of-truth tancat |

## Detall per item

### 1 · Pre-thinking phase · clarification questions
**Què seria** · abans del `design-value-map-rich`, una crida small-tier que
digui "què preguntaries a l'usuari per millorar el mapa?" i retorni N
preguntes que rebés l'usuari abans d'invocar el prompt principal.

**Què hi ha** ·
- `iaContextService.js` · munta context · però NO genera preguntes
- `KnowledgeLoader.buildContext` · injecta sector + domain detection
- Cap funció anomenada `clarify` · `preThink` · `askUser`

**Cost implementació** · S · 1 nova funció `vnaClarify({ context })` retorna
`{ questions: [...] }` · 1 crida small-tier · UI a `ValueMapView` per a
mostrar preguntes abans de generar.

### 2 · Multi-turn conversational · gaps
**Què seria** · si la primera generació deixa gaps detectats (ex · sense rol
"scout" tot i ser equip de futbol), una 2a crida injectada amb "afegeix el
que falta".

**Què hi ha (parcial)** ·
- `runEscalation` a `aiProviderService.js` · multi-call fallback existeix
- v132c · `expertChainOrchestrator` ja fa escalation `slim→FULL` si score < 70
- v132d · `quickSuggestMap` accepta `existingMap` (mode completar transparent)

**Què falta** · detecció de gaps **semàntica** (no només score numèric) que
formuli un "feedback" estructurat al model · ex · "sector=esport · rols
detectats = 5 · expected_role_kinds inclou scout però manca → completa".

**Cost** · M · `vnaDetectGaps(map, expectedPattern)` + integració al loop
de escalation existent.

### 3 · Embedding-based similarity · fusionar rols
**Què seria** · si dos rols generats tenen `cosine(embed(r1), embed(r2)) >
0.85`, fusionar-los (mateix concepte amb noms diferents).

**Què hi ha** · res operatiu.
- `contextPruner.js:272` · només un comentari "Métricas más finas (cosine
  sobre embeddings, similarity threshold) → futuro"
- Sense embedding service · sense vector store local · sense providers
  amb embeddings configurats

**Cost** · L · cal ·
1. Embedding provider (OpenAI text-embedding-3-small · ~0.00002€/k tokens)
2. Vector store local (in-memory · IndexedDB · o senzill flat array al KB)
3. `mergeSimilarRoles(roles, threshold=0.85)` · pure function
4. Integració al post-process del mapa generat

### 4 · Real-time co-creation · accept/reject per rol ✅
**Què seria** · usuari veu rols proposats un a un i pot acceptar/rebutjar.

**Què hi ha (operatiu)** ·
- `js/views/ValueMapView.js` · `_aiProposals` state
- UI · botons "✓ Aceptar" + "✕" per rol (línies 2796·2858)
- `_markProposal(id, 'accepted'/'rejected')` · `_proposalState` map
- Apply only accepted al final · línia 2914

**Què falta (millora)** · accept/reject per **transaction** també (avui sí ·
verificar) · Edit inline del rol abans d'accept (suggerit en review).

### 5 · Cross-project pattern mining
**Què seria** · si 10 projectes sector M tenen tots un rol "X", recomanar-lo
en projecte 11 nou.

**Què hi ha (estàtic · no aprenent)** ·
- `knowledge/sectors/A.md...T.md` · 21 SOCs CNAE canonical · cada un té
  `skill_levels` + `sops_canonical` curats per @alvaro
- `knowledge/domains/*.md` · 24 domain packs amb arquetip pre-curats
- `sectorRoleCatalog.js` · taula de rols base per sector

Aquests són **patterns curats manualment** · NO mining d'usage real.

**Cost runtime mining** · L · cal ·
1. Telemetria de quins rols accepta/rebutja l'usuari per sector
2. Aggregator que sumi freqüència per (sector, role.kind)
3. Threshold (ex · ≥7 de 10 projectes → recomanar)
4. Injecció al prompt context com a "rol freqüent en sector X"

### 6 · xAPI tracking de quality
**Què seria** · cada output mapejable a un xAPI statement (`{ actor,
verb: "generated", object: { id: "vna-map-fc-lleida" }, result: { score: 78 } }`)
acumulant evidència audit-trail.

**Què hi ha** ·
- `docs/lms-api-spec-v0.1.md` · spec dels 12 endpoints inclosos 3 xAPI ·
  `POST /v1/statements` · `GET /v1/statements` · `GET /v1/agents`
- `type=xapi_statement` previst com a node KB
- Schema TinCan compatible documentat

**Què falta** · implementació en JS · cap arxiu `xapiService.js` existeix.

**Cost** · M · `xapiService.js` amb `recordStatement(actor, verb, obj, result)`
+ guarda al KB · 3 endpoints REST si calen externs.

### 7 · Wiki community moderation · arquetip publicable
**Què seria** · arquetip "Doctor IA" publicable al permaweb · revisable per
la comunitat · "Doctor IA v1" → millora → "Doctor IA v2 (recomanat)".

**Què hi ha (parcial)** ·
- `wo-permaweb-skills-share` backlog · skills publicables (no arquetip)
- `js/core/publicRegistry.js` · projects publishables al permaweb
- `domainDetector.js` · arquetip pre-curats tancats · no editables runtime

**Què falta** · model de publicació + moderació per a domain packs ·
versioning + voting + merge.

**Cost** · L+ · cal ·
1. Schema d'arquetip publicable (extension de domain pack format actual)
2. UI a `/learn?tab=sectors` per a fork+edit+publish
3. Moderació · upvote/downvote · spam filter · semantic dedup
4. Resolver al detector · "si community version té > N upvotes, usa-la"

## Resum prioritari per a alfa+

| Prioritat | Item | Quina millora real porta |
|---|---|---|
| ✅ DONE v135 | #1 Pre-thinking clarify | Redueix ambigüitat de description abans de costar tokens |
| ✅ DONE v135 | #2 Multi-turn gaps | Resol bug "futbol sense scout" amb 2a crida targeted |
| ✅ DONE v131+ | #4 Co-creation | Operatiu · ValueMapView · iterar UX només si feedback |
| ✅ DONE v136 | #6 xAPI quality tracking | Audit trail · evidència empírica de quality per benchmark |
| ✅ DONE v136 | #3 Embedding similarity | Resol duplicate roles (cas comú · 6 rols generats · 2 idèntics) |
| 🟢 BAIX | #5 Pattern mining | Té estàtic ja · runtime és complexitat sense alfa-blocker |
| 🟢 BAIX | #7 Wiki community | Post-tracció comunitat (no abans de tenir 50+ usuaris) |

## Estat post-v136 · 5/7 items DONE · ALFA-READY

Items que falten · #5 (pattern mining runtime · estàtic ja existeix) · #7
(wiki community · post-tracció 50+ usuaris). **Cap és alfa-blocker.**

Veredicte · SOS V11 pot declarar-se **ALFA en creació de mapes de valor**.

## Pròxims WOs proposats al backlog (si confirmes)

- `wo-vna-clarify-prethink` · item #1 · S · 5€ · v135
- `wo-vna-gap-detection-multi-turn` · item #2 · M · 8€ · v135
- `wo-embedding-role-dedup` · item #3 · L · 12€ · v140+
- `wo-xapi-quality-tracker` · item #6 · M · 7€ · v138 (alineat amb LMS sprint)
- `wo-pattern-mining-telemetry` · item #5 · L · 14€ · post-alfa
- `wo-archetype-community-publish` · item #7 · XL · 20€ · post-100-usuaris

---

*Auditoria v134 · 2026-05-17 · basat en exploració codebase real (grep · file
audit). Cap d'aquests 7 items és **alfa-blocker** · però #1 i #2 podrien
millorar la qualitat percebuda de la generació amb cost baix.*
