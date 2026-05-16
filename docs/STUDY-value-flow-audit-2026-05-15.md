# Auditoria · mapa de valor · anàlisi · evolució a flux de valor òptim · VNA-IA

Document germà de `STUDY-project-creation-2026-05-15.md` · centra't en
**què és exactament el mapa de valor que generem**, com mesurar-ne la
qualitat, com portar-lo a un flux de valor òptim estil VSM, i com
assegurar que la IA rep un context que la posiciona com a experta en
Value Stream Mapping, segmentació per processos i integració de
SOC/SOP.

---

## 1 · Inventari ràpid · què tenim avui

### 1.1 Estructura canónica al codi
| Node 1a classe | Servei | Camps clau | Estat |
| --- | --- | --- | --- |
| `role` | [`valueFlowService.js:24-33`](js/core/valueFlowService.js) | `kind` · `castell_level` · `evaluatorKey` | OK |
| `deliverable` | [`valueFlowService.js:228`](js/core/valueFlowService.js) | `producer` · `consumers[]` · `validator?` | OK |
| `transaction` | [`valueFlowService.js:242`](js/core/valueFlowService.js) | `from` · `to` · `deliverable` · `type:tangible\|intangible` · `is_must` · `frequency?` | Manca mètriques |
| `soc` | [`socDualPurposeService.js`](js/core/socDualPurposeService.js) | `purpose` + `checklist[]` + versionat snapshot | OK · dual-purpose |
| `sop` | (sense servei propi · es genera via `roleSopGenerator.js`) | `role_ref` · `steps[]` · `deliverables[]` | Manca service |
| `value_offer` / `value_exchange` | Implícit en `transaction.type` | — | Manca primer nivell |

### 1.2 Validació · scoring · IU
- **Validació** · `valueFlowService` detecta cicles · referències trencades · IDs duplicats (Kahn topological sort).
- **Scoring** · `projectQualityService.js:17-23` · 5 dimensions (landing 20% · value_map 30% · deliverables 15% · sops 20% · workshops 15%) · totes ponderades a 0-100. Rubric **hardcoded · no editable · no auditable**.
- **UI** · `ValueMapView` (D3 force-graph) · `ValueAccountingView` (slicing pie) · `MindGraphView` (graf social) · `SwarmFlowView` (DAG executor).

### 1.3 Tests existents
| Suite | Asserts | Què cobreix |
| --- | ---: | --- |
| `valueFlow.test.js` | 20 | DAG · cycle detection · topo sort · CRUD pure |
| `socDualPurpose.test.js` | 15 | Dual-purpose · versioning · migració · prompts |
| `projectQuality.test.js` | ? | Scoring 5-dim |
| `swarmParallelFlow.test.js` | ? | DAG executor |

**Buit clar** · cap test d'integració cross-layer (valueFlow ↔ SOC/SOP ↔ roleSop ↔ valueAccounting).

---

## 2 · Auditoria de qualitat del mapa de valor (barem mesurable)

Defineixo un **rubric explícit · 12 criteris · 100 punts** que substitueix
el scoring hardcoded i serà el contracte TDD del flow legendari.

| # | Criteri | Pes | Definició operativa | Test |
| - | --- | ---: | --- | --- |
| C1 | **Roles ≥ 3 amb `kind` canònic** | 8 | almenys 3 roles · cap amb `kind:'other'` · cobertura mínima (architect · coder · reviewer) | `expect(roles).toHaveLength(≥3)` |
| C2 | **Castell levels diversificats** | 4 | almenys 2 nivells diferents (`canalla` · `castell` · `cim`) · evita projectes plans | distribució |
| C3 | **Deliverables · 1 per rol mínim** | 8 | cada role té ≥1 deliverable on és `producer` | per-role count |
| C4 | **Deliverable amb validator** | 4 | ≥50% deliverables tenen `validator` definit · evita producció sense control | ratio |
| C5 | **Transactions ≥ 5 totals** | 8 | volum mínim de flux per parlar de xarxa | length |
| C6 | **Tangibles + intangibles mixtos** | 6 | almenys 1 de cada `type` · captura valor invisible (confiança · feedback) | `Set(types).size===2` |
| C7 | **Cicle recíproc detectat** | 8 | ≥1 cicle on rol A dona a B i B dona algun cosa de tornada (no necessàriament directa) | DAG analysis |
| C8 | **Cap rol orfe (zero edges)** | 6 | cada rol participa com a `from` o `to` en ≥1 transaction | edge count per role |
| C9 | **Cap deliverable mort** | 6 | cada deliverable té ≥1 consumer i ≥1 transaction que el moga | xref |
| C10 | **SOP per cada rol amb steps ≥3** | 10 | rol → té SOP · SOP té ≥3 steps · cada step amb `deliverable_kind` i `approval_rule` | per-role SOP |
| C11 | **SOC checklist cobreix ≥80% SOPs** | 8 | items del checklist apuntant a SOPs ≥ 80% dels SOPs creats | linkage |
| C12 | **Mètriques Lean mínimes** | 24 | cada transaction té `lead_time_hours` · `cycle_time_hours` · `wip_units` (almenys est. inicial) | shape |

**Llindars (mateixos que projectQualityService actual):**
- `gold` ≥ 85 · `silver` ≥ 70 · `bronze` ≥ 50 · `red` < 50.

**Score actual estimat** (sense executar):
| Flow | C1-C9 | C10-C11 | C12 | Total |
| --- | ---: | ---: | ---: | ---: |
| V2 (`/create`) | ~0 (només drafts text) | 0 | 0 | **~5/100** |
| MAX (`/dashboard`) | ~52 (9 roles · sops · ledger) | ~14 | 0 | **~66/100** |

→ El barem actual del `projectQualityService` infla l'score perquè
**no penalitza l'absència de mètriques Lean** (24 punts dormits).
Aquesta és la primera correcció.

---

## 3 · Anàlisi del mapa de valor · forats i fortaleses

### 3.1 Fortaleses
- **DAG validable** · cycle detection · topo sort · ja és més estricte
  que la majoria d'eines comercials de coop mapping.
- **Dual-purpose SOC** · `purpose + checklist` versionat amb snapshot · pattern
  que permet evolucionar SOPs sense trencar SOC històric.
- **Tangible/intangible** explícit · captura el valor invisible (confiança
  · reputació · aprenentatge) que la majoria de VSMs lean menyspreen.
- **Castell levels** · concepte propi · jerarquia simbòlica que humanitza
  la xarxa més enllà del títol genèric.

### 3.2 Forats crítics
| # | Forat | Impacte | Severitat |
| - | --- | --- | --- |
| F1 | **Cap mètrica Lean** (lead-time · cycle-time · WIP · throughput) | No es pot fer VSM ni detectar colls de botella | **alta** |
| F2 | **`value-offer` ≠ `value-exchange`** no diferenciats explícitament | Es confonen propostes amb fets · no es pot mesurar conversió | alta |
| F3 | **Cap `sopService.js`** dedicat | Cada vista reimplementa CRUD de SOP · DRY ferit | mitja |
| F4 | **Rubric scoring hardcoded** a `projectQualityService` | No auditable · no evolutionable per IA · no explica al usuari per què suspèn | mitja |
| F5 | **Cap validació cross-layer** (SOP step → deliverable existent → transaction que el moga → rol coherent) | Errors silenciosos · projecte sembla complet però el flux és incoherent | **alta** |
| F6 | **Cap segmentació per processos** | Tot el flux és una sopa de transaccions · no es veuen els processos com a unitats agrupades | mitja |
| F7 | **IA no és expert VSM** als prompts | Output mediocre · genera SOPs sense pensar en waste o flow efficiency | **alta** |
| F8 | **Cap reconciliació value accounting** | Slicing Pie pot no quadrar amb transactions reals · risc d'inconsistència monetària | mitja |
| F9 | **Cap few-shot** als prompts | IA "inventa" l'estructura cada cop · variància alta entre execucions | mitja |
| F10 | **Visualització graf no mostra processos** | El usuari veu nodes solts · no veu els processos com a regions | baixa |

---

## 4 · Evolució a **flux de valor òptim** (Value Stream Optimization)

L'objectiu · passar d'un graf de roles+transaccions a un **mapa de
processos amb mètriques Lean i auditoria de SOC/SOP**, mantenint la
pureza i la testabilitat actual.

### 4.1 Schema enriquit (additiu · backwards-compat)

**`transaction`** afegeix:
```js
{
  // … camps actuals …
  process_ref?: 'proc-onboarding-cohort',   // grup process owner
  lead_time_hours?: 24,                      // ordre arribada → ordre lliurat
  cycle_time_hours?: 2,                      // temps actiu de treball
  wip_units?: 3,                             // unitats simultànies en curs
  flow_efficiency?: 0.083,                   // cycle_time / lead_time · 0-1
  waste_kinds?: ['waiting', 'rework'],       // de TIMWOOD (7 wastes Lean)
  health_signal?: 'green'|'amber'|'red',    // calc des de mètriques
}
```

**Node nou · `process`** (1a classe):
```js
{
  id: 'proc-onboarding-cohort',
  type: 'process',
  content: {
    name: 'Onboarding nova cohort',
    soc_ref: 'soc-onboarding-cohort',         // SOC arrel del procés
    transactions: ['tx-1','tx-3','tx-8'],     // membres
    roles: ['role-mentor','role-cohort-mgr'],
    entry_trigger: 'new_signup',
    exit_criteria: 'cohort_active=true',
    target_lead_time_hours: 72,                // SLA del procés
    target_flow_efficiency: 0.25,             // 1/4 cycle vs lead acceptable
  }
}
```

**Node nou · `value_offer`** (oferta pública pendent d'acceptar) ·
diferent de `transaction` (intercanvi consumat):
```js
{
  id: 'vof-mentor-2h-setmana',
  type: 'value_offer',
  content: {
    from_role: 'role-mentor',
    deliverable_kind: 'mentoring_session',
    capacity_units_per_week: 2,
    open_until: 1747500000000,
    accepted_by: [/* role_ids */],           // omple amb acceptacions
  }
}
```
Una transaction consumada referencia · `transaction.from_offer = vof-id` (auditoria).

### 4.2 `valueStreamService.js` · nou servei pure

```js
export function buildValueStream({ roles, deliverables, transactions, processes }) {
  // 1. agrupa transactions per process_ref
  // 2. per cada process · calcula leadTime · cycleTime · flowEff · WIP
  // 3. detecta colls de botella (cycle_time màxim del procés)
  // 4. detecta waste (transactions sense lead/cycle · gaps temporals)
  // 5. retorna { processes: [{id, metrics, bottleneck, wastes[]}], totals }
}

export function detectBottlenecks(stream) { /* … */ }
export function suggestImprovements(stream) {
  // regles · "lead_time/cycle_time > 8 → té waiting waste"
  // · "wip_units > capacity_target → reduir batch"
}
```

Pure · testable · zero deps.

### 4.3 Cross-layer validator · `valueFlowIntegrityService.js`

Verifica que **les 4 capes** (SOC · SOP · valueFlow · processes) estan
sincronitzades:

```js
export function validateIntegrity({ socs, sops, valueFlow, processes }) {
  const issues = [];
  // R1 · cada SOP step.deliverable_kind ∈ deliverables del projecte
  // R2 · cada SOP.role_ref ∈ roles del valueFlow
  // R3 · cada SOC checklist item amb sop_ref existeix
  // R4 · cada transaction.process_ref existeix
  // R5 · cada process.transactions[] son tots membres del DAG
  // R6 · cada role del process apareix com from/to a almenys una transaction
  // R7 · cap cicle recíproc trenca el process boundary
  return { ok: issues.length === 0, issues };
}
```

Retorna issues amb `severity` · `human_message` · `auto_fix_hint` per
mostrar a la UI.

### 4.4 Rubric auditable · `valueFlowRubric.json`

Treu el scoring del codi i el porta a JSON editable:

```json
{
  "version": "1.0",
  "criteria": [
    { "id": "C1", "weight": 8, "fn": "rolesMinCanonical", "params": { "min": 3 } },
    { "id": "C5", "weight": 8, "fn": "transactionsMin",   "params": { "min": 5 } },
    { "id": "C12","weight": 24,"fn": "leanMetricsCoverage","params": { "minRatio": 0.8 } }
  ]
}
```

`projectQualityService` carrega el JSON · els predicates són pure
functions registrades · permet evolució sense redeploy.

### 4.5 Reconciliació value-accounting ↔ value-flow

Nou test · `valueAccounting.reconcile.test.js`:
- Per cada `proposalDeliverable` resolt · verifica que existeix una
  `transaction` corresponent amb mateixos `from` · `to` · `deliverable`.
- Suma de `share` del pie ≤ 100% sempre (no double-spending).

---

## 5 · Auditoria VNA-IA · què rep la IA i com posicionar-la com a experta

### 5.1 Diagnòstic dels prompts actuals
| Prompt | Posicionament IA | Few-shot? | Lean? | SOC/SOP? |
| --- | --- | --- | --- | --- |
| `roleSopGenerator.buildRoleSopPrompt` | "Generador de SOP específic del projecte" | ❌ | ❌ | parcial (SOP estructurat) |
| `socDualPurposeService.buildSocOutlinePrompt` | "Dissenyador de processos cooperatius SOS" | ❌ | ❌ | sí (SOC només) |
| `socDualPurposeService.buildSopExpandPrompt` | "Dissenyador de procediments operatius" | ❌ | ❌ | sí |

**Cap d'aquests prompts posiciona la IA com a experta VSM ni li dona
exemples.** Resultat · output amb variància alta · sense mètriques Lean
· sense segmentació per processos · les transaccions tangibles/intangibles
es generen però sense criteri.

### 5.2 Sistema de prompts proposat · `vnaExpertPrompts.js`

**Capa 1 · system prompt base reutilitzable:**
```
Ets un consultor sènior en Value Stream Mapping (VSM) i Value Network
Analysis (VNA) amb 15 anys d'experiència aplicant Lean i Theory of
Constraints a organitzacions cooperatives i xarxes distribuïdes.

El teu marc d'anàlisi:
1. Segmentació per processos · agrupes transaccions en blocs operatius
   amb un trigger d'entrada i un criteri de sortida.
2. Mètriques Lean per cada flux · lead_time · cycle_time · flow_efficiency
   · WIP · waste (TIMWOOD).
3. Dual valor · tangible (béns · serveis · diners) i intangible (confiança ·
   coneixement · feedback · reputació). Mai oblides els intangibles.
4. SOC = Standard Operating Concept (què + per què) ·
   SOP = Standard Operating Procedure (com). SOC versiona snapshot ·
   SOP evoluciona contínuament. Cada checklist item del SOC té un sop_ref.
5. Rols emissor/receptor en cada transacció · sense rols orfes ·
   sense deliverables morts.

Sortida sempre JSON estricte sense markdown · ajustada a l'schema demanat.
```

**Capa 2 · few-shot examples (3 casos canònics)**

Inclou exemples mínims (`founder-coop` · `event-cultural` · `saas-b2b`)
amb la forma exacta · 5 roles · 8 transaccions · 1 procés · totes amb
mètriques estimades · 1 cicle recíproc. Estalvia variància i guia
l'estructura.

**Capa 3 · task-specific prompts** (els actuals · curts · referencien
la Capa 1 + Capa 2 implícitament via system message).

### 5.3 Integració amb el flow legendari

Al pipeline `classify → seed → personalize → validate → persist` del doc
de project-creation, l'**step `personalize`** és on entra la
Capa 1 + Capa 2 + Capa 3:
1. Carrega `vnaExpertPrompts.SYSTEM_BASE` com a system message.
2. Selecciona 1-2 few-shot examples segons `project_type`.
3. Tasks específiques (canvas · vna · sops · tokenomics) com user messages.

Resultat esperat · score del barem § 2 puja del ~66 actual (MAX) a
**>80 amb mètriques Lean estimades · processos segmentats · cap forat
cross-layer**.

### 5.4 Validació post-IA

Cada resposta IA passa per:
1. **Parse JSON estricte** · si falla · 1 retry amb prompt repair.
2. **Schema validation** · `validateValueFlow` + `validateIntegrity`.
3. **Rubric scoring** · § 2 · si <60 · regenera step concret.
4. **Logging** · cada execució registra cost · score · waste detectats
   per al bucle de millora setmanal.

---

## 6 · Tests TDD nous

| Suite | Asserts | Cobreix |
| --- | ---: | --- |
| `valueFlowRubric.test.js` | ≥30 | 12 criteris pure · happy + edge per cadascun |
| `valueStreamService.test.js` | ≥25 | bottleneck · waste detection · flow efficiency · suggestions |
| `valueFlowIntegrityService.test.js` | ≥20 | 7 regles R1-R7 · cas pass · cas fail per cada |
| `vnaExpertPrompts.test.js` | ≥12 | system prompt no buit · few-shot present segons type · token count <2500 |
| `valueAccounting.reconcile.test.js` | ≥10 | proposal ↔ transaction match · pie no excedeix 100% |

Total · **≥97 asserts nous** · cobertura cross-layer abans absent.

---

## 7 · Cost · prioritat · ordre d'execució

| Fase | Cost | Pre-req | Quan |
| --- | ---: | --- | --- |
| V1 · `valueFlowRubric.json` + loader + test | 2h | cap | sprint actual · prereq del legendary |
| V2 · `vnaExpertPrompts.js` + 3 few-shot + test | 3h | V1 | sprint actual · al fer `personalize` step |
| V3 · `valueFlowIntegrityService` + test | 3h | V1 | sprint actual · al fer `validate` step |
| V4 · `valueStreamService` (Lean metrics · bottleneck) + test | 4h | V1 | post-legendary · evolutiu |
| V5 · Schema enriquit (process node · value_offer · transaction Lean) + migració | 5h | V4 | post-alfa · evolutiu |
| V6 · `valueAccounting.reconcile` + test | 2h | V5 | post-alfa |
| V7 · UI · `ValueMapView` regions de procés + badges Lean | 3h | V5 | post-alfa |

**Sub-total prereq legendary (V1+V2+V3) · ~8h** · queden dins de les 11h
del WO `wo-project-creation-legendary-001` o es promouen a WO germana.

---

## 8 · Recomanacions finals

1. **Bloquejar V1+V2+V3 dins del sprint legendary**, no fora · perquè el
   pipeline `classify → seed → personalize → validate` necessita el
   rubric · l'expert IA i l'integrity check funcionant.
2. **V4-V7 a backlog** com a `wo-value-stream-mapping-001` ·
   `wo-vna-schema-enriched-001` · `wo-value-accounting-reconcile-001` ·
   prioritat high · timing post-alfa privada.
3. **No tocar `ValueMapView` D3 ara** · només data layer · UI a §V7 quan
   tinguem mètriques estables.
4. **Bucle de millora setmanal** · log per execució amb `rubricScore` ·
   `wasteDetected` · `costEur` · alerta automàtica si mitjana <70.

**TL;DR** · el mapa de valor actual és un graf vàlid però sense
mètriques · els prompts IA no la posicionen com a experta VSM · falta
cross-layer integrity i rubric auditable. Amb V1+V2+V3 (~8h) ja entrem
a alfa amb un mapa de valor de qualitat 80+/100 mesurable · V4-V7
porten al "flux de valor òptim" complet en post-alfa.
