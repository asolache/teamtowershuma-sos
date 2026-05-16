# Estudi · creació de projecte · estat dual i evolució a un sol flow legendari

Sessió del 2026-05-15 (post-merge PR #115) · objectiu · auditar els dos flows
de creació de projecte que conviuen al codi · mesurar la qualitat del mapa
de valor que generen · proposar evolució que en deixi **un sol guanyador**
amb el millor de cadascú i un pla TDD que ho validi.

---

## 1 · Inventari dels flows actuals

| # | Ruta | Vista | Servei IA / Generador | LOC | Edat |
| - | --- | --- | --- | --- | --- |
| 1 | `/create` | `ProjectCreationV2View` | `unifiedProjectCreationService` + `aiRouterService` | 391 | Recent · arquitectura plan/fan-out/reduce |
| 2 | `/dashboard` (botó "Crear MAX") | `DashboardView` (línies 2256-2299) | `maxProjectBootstrap.buildMaxQualityProject()` | 2.629 (vista) + 292 (servei) | Antiga · cas demo "Castellers/Founder" |
| 3 | `/canvas?project={id}` | `ProjectCanvasView` | `aiRouterService.runEscalation` | 294 | Post-creació · 5-step wizard de refinament |

Hi ha també:
- `DashboardV2View` · botó "🎭 Carregar demo Castellers" · invoca el mateix `maxProjectBootstrap` (és el seed instantani per a empty state · no és pròpiament un "flow de creació").
- `ProjectCanvasView` no és creació primària · queda fora del veredicte.

**Els dos flows en disputa són #1 i #2.**

---

## 2 · Anatomia comparada · què fa exactament cada flow

### 2.1 `ProjectCreationV2View` (`/create`)

**Pipeline · plan → fan-out → reduce** ([`unifiedProjectCreationService.js`](js/core/unifiedProjectCreationService.js))
```
input  (name · description · sector · ambition: light|standard|max)
   │
   ▼
buildCreationPlan(ambition)
   │  · classifica project_type via projectClassifierService (~0.002€)
   │  · selecciona stepsToRun ∈ {canvas · vna · sops · tokenomics · workshops}
   ▼
Promise.all(stepsToRun.map(runStep))
   │  · cada step crida aiRouterService.runPrompt amb template per step
   │  · cost per step · light 0.002€ · standard 0.005€ · max 0.005€×5
   ▼
reduce → project node amb drafts text dins content.creationDrafts
```

**Output al KB** (mesurat al codi · sense executar IA):
- ✅ `project` × 1 amb `content.creationDrafts = { canvas, vna, sops, … }` (text)
- ❌ `role` × **0**
- ❌ `sop` × **0** (només draft text dins `creationDrafts.sops`)
- ❌ `deliverable` × **0**
- ❌ `work_order` × **0**
- ❌ `ledger_entry` · `invoice` · `proposal` · `transaction` × **0**

→ **Mapa de valor operacional · ~10%** (sols ideació textual).

### 2.2 `DashboardView` botó "Crear MAX" (`/dashboard`)

**Pipeline · pure deterministic** ([`maxProjectBootstrap.js`](js/core/maxProjectBootstrap.js))
```
input  (name · creatorHandle)
   │
   ▼
buildMaxQualityProject() · 100% pure · zero IA
   │  · expandeix FOUNDER_ROLES → role nodes
   │  · expandeix FOUNDER_SOPS → sop nodes
   │  · expandeix FOUNDER_TRANSACTIONS → ledger entries
   │  · genera CANVAS_DRAFTS · PITCH_DRAFTS hardcoded
   │  · poble learn_role × 108 (TARGET_COHORT_MANAGERS)
   ▼
result.nodes[] · ~150-180 nodes
```

**Output al KB** (verificat amb 67 asserts a `maxProjectBootstrap.test.js`):
- ✅ `project` × 1
- ✅ `role` × **9** (operatives) + `learn_role` × **108** (cohort)
- ✅ `sop` × **5-8** (lligats a roleId)
- ✅ `workshop` × **4** · `pitch` × 1 · `tokenomics` × 1
- ✅ `ledger_entry` × **3+** (balanced)
- ✅ `invoice` × **2** (1 pagada · 1 pendent)
- ✅ `proposal` × **2** (acceptats)
- ✅ `market_item` × **2**
- ❌ `deliverable` explícit (implícit dins SOPs)
- ❌ `work_order` × **0**
- ❌ Cap personalització segons input · sempre el mateix cas Founder/Castellers

→ **Mapa de valor operacional · ~85%** (cicle complet · però clónic).

---

## 3 · Mètrica de qualitat del mapa de valor

Construïm un **score 0-100** per dimensió canònica:

| Dimensió | Pes | V2 (`/create`) | MAX (`/dashboard`) | Comentari |
| --- | ---: | ---: | ---: | --- |
| **Personalització** (es basa en l'input?) | 20 | **18** | 0 | V2 fa servir nom+descripció · MAX ignora |
| **Canvas / VNA** (vision · mission · stakeholders) | 10 | 6 (draft) | **9** (complet) | MAX té 5/5 · V2 text-only |
| **Pitch** (síntesi inversor) | 5 | 0 | **5** | MAX genera 6/6 · V2 zero |
| **Roles operatius** (≥3 amb responsabilitats) | 10 | 0 | **10** | MAX · 9 roles · V2 cap |
| **SOPs lligades a roles** | 10 | 1 (text) | **9** | MAX · 5-8 sops · V2 draft global |
| **Deliverables explícits** | 5 | 0 | 2 | MAX implícit · V2 zero |
| **Work orders inicials** | 5 | 0 | 0 | **CAP DELS DOS** ho fa |
| **Transaccions / ledger** | 10 | 0 | **10** | MAX balanced · V2 zero |
| **Invoices · proposals (revenue surface)** | 5 | 0 | **5** | MAX 4 entitats · V2 zero |
| **Tokenomics** | 5 | 4 (draft) | **5** | MAX hardcoded · V2 text |
| **Cohort / capacitat** (skills · learn roles) | 5 | 0 | **5** | MAX 108 · V2 zero |
| **Cost de generació** (invers · més barat = millor) | 5 | 3 (0.008-0.022€) | **5** (0€) | V2 paga IA |
| **Temps generació** (invers) | 5 | 2 (20-45s) | **5** (0.5-2s) | MAX instant |
| **TOTAL** | **100** | **34** | **80** | MAX guanya per estructura · perd per genericitat |

**Lectura clau:** MAX és **el doble de complet** però **zero personalitzat** ·
V2 és **personalitzat però buit** d'estructura operacional.

Ni un ni l'altre estan per a alfa de 108 operadors.

---

## 4 · Diagnòstic · per què hi ha dos i per què ha de quedar un

### 4.1 Per què van néixer separats
- MAX va sortir per **demos** (necessitat: aparèixer "ple" sense IA · sense
  API key · sense esperar).
- V2 va sortir per **producció** (necessitat: usuari real defineix el seu
  projecte i la IA li dona estructura).
- Mai s'han fusionat perquè la fusió implica que la IA produeixi
  **nodes estructurats** (no només text) · pas que requereix prompt
  engineering seriós i validació TDD.

### 4.2 Per què hi ha d'haver un sol guanyador
- Confusió UX · l'operadora veu dues entrades · no sap quina triar.
- Doble manteniment · cada fix l'has de fer 2 cops.
- Drift conceptual · MAX evoluciona pel seu costat (founder template) · V2
  pel seu (ambition levels) · l'usuari paga el preu de la divergència.
- Tests dispersos · 67 asserts a MAX · 32 a V2 · cap test de mapa de valor
  comparable.

### 4.3 Què hereta el guanyador
Del **V2**:
- Pipeline `plan → fan-out → reduce` (escalable).
- `aiRouterService` + `aiCacheService` + `aiBudgetService` (cost control).
- `projectClassifierService` (project type/stage detection).
- `ambition` 3-tier (light · standard · max).
- UX d'entrada flexible amb form simple.
- Hooks per a fallback gracios.

Del **MAX**:
- L'estructura completa del mapa de valor (roles · sops · ledger · …).
- Els templates `FOUNDER_*` com a **catàleg** de plantilles per
  project_type.
- Les **assertions** del test (`maxProjectBootstrap.test.js`) com a
  contract del que un projecte "ben format" ha de tenir.

---

## 5 · Proposta d'evolució · **un sol flow legendari**

### 5.1 Arquitectura objectiu

```
                  /create  (única ruta)
                       │
                       ▼
   ┌───────────────────────────────────────────────────┐
   │  ProjectCreationLegendaryView                     │
   │  inputs · name · description · sector · ambition  │
   └───────────────────┬───────────────────────────────┘
                       ▼
   ┌───────────────────────────────────────────────────┐
   │  projectCreationOrchestrator (nou · DRY)          │
   │                                                   │
   │  1. classify  · projectClassifierService          │
   │     → { type, stage, recommendedTemplate }        │
   │                                                   │
   │  2. seed     · projectTemplateCatalog.pick(type)  │
   │     → { roles[], sops[], canvas, pitch,           │
   │         ledgerSeeds[], invoiceSeeds[], … }        │
   │                                                   │
   │  3. personalize · iaRouterService.runFanOut       │
   │     → reemplaça {{placeholders}} dels templates   │
   │       amb la descripció · sector · ambicions      │
   │     → cost light=0€ (skip IA) · std=0.005€        │
   │       · max=0.022€ (full personalize all)         │
   │                                                   │
   │  4. validate · projectQualityValidator (existent) │
   │     → score 0-100 contra el barem § 3             │
   │     → si <60 · regenera step que falla            │
   │                                                   │
   │  5. persist · store.dispatch(KB_UPSERT) batched   │
   │     → emite 'project:created' amb { id, score }   │
   └───────────────────┬───────────────────────────────┘
                       ▼
                 /hub/{id}
```

### 5.2 Camps i estats per ambition

| Ambition | IA invocada? | Personalització | Cost típic | Temps | Qualitat esperada |
| --- | --- | --- | ---: | ---: | ---: |
| `light` | NO · template pur amb find/replace básic | només noms i sector | 0€ | <1s | 65-70 |
| `standard` | sí · 2 steps (canvas + sops) | meitat del template | 0.005-0.010€ | 5-12s | 75-85 |
| `max` | sí · 5 steps (canvas+vna+sops+pitch+tokenomics) | tot personalitzat | 0.018-0.025€ | 25-45s | 85-95 |

**Tots tres ambitions retornen el mateix mapa de nodes** (roles · sops ·
ledger · invoices · proposals · …) · només varia la **qualitat de personalització**.

### 5.3 Catàleg de templates · `projectTemplateCatalog.js`

```
projectTemplateCatalog
├── founder-coop-tradicional   (FOUNDER_* de MAX actuals)
├── solo-creator
├── startup-saas-b2b
├── event-cultural
├── workshop-educatiu
└── default-balanced
```

Cada template és un objecte amb la mateixa forma · `projectClassifierService`
diu quin agafar.

### 5.4 Què s'esborra (deute eliminat)
- `DashboardView` · botó "Crear MAX" + handler (línies 2256-2299).
- `maxProjectBootstrap.js` queda **internal** (el catàleg el conserva) ·
  l'export públic desapareix.
- `DashboardV2View` · botó "Carrega demo Castellers" passa a invocar
  `projectCreationOrchestrator.seedFromTemplate('founder-coop-tradicional', { quick: true })`.
- `ProjectCreationV2View` es **renombra** a
  `ProjectCreationLegendaryView` i absorbeix tot el pipeline nou.

### 5.5 Inventari de canvis

| Element | Acció |
| --- | --- |
| `unifiedProjectCreationService.js` | Refactor a `projectCreationOrchestrator.js` |
| `maxProjectBootstrap.js` | Mou contingut a `templates/founder-coop-tradicional.js` |
| `projectTemplateService.js` | Estén a catàleg multi-template |
| `projectQualityValidator` | Nou · score 0-100 contra § 3 |
| `DashboardView` (MAX btn) | Esborra |
| `ProjectCreationV2View` | Rename → `ProjectCreationLegendaryView` |
| `/create` | Únic punt d'entrada |

---

## 6 · Pla TDD que ho valida (extensió de l'audit AUDIT-2026-05-15.md §4)

### 6.1 Cobertura mínima per acceptar la consolidació

**`js/tests/projectCreationLegendary.test.js`** · suite nova · ≥60 asserts.

| Bloc | Asserts | Comprova |
| --- | ---: | --- |
| A · classify | 8 | 5 casos canònics + 2 edge + 1 fallback |
| B · template pick | 6 | type→template determinístic + default |
| C · seed shape | 12 | per template · ≥3 roles · ≥3 sops · ≥1 ledger · ≥1 invoice · ≥1 proposal · canvas 5/5 · pitch 6/6 |
| D · personalize | 10 | placeholders reemplaçats · noms · sector · descripció a tots els nodes |
| E · ambition gating | 6 | light=0 IA calls · standard=2 · max=5 |
| F · quality score | 8 | score≥60 light · ≥75 std · ≥85 max |
| G · cost budget | 6 | dins límits per ambition · `aiBudgetService` respectat |
| H · KB upsert | 6 | nodes batched · IDs únics · projectId coherent |
| I · idempotència | 4 | crear amb mateix nom no duplica seeds |
| J · failure modes | 6 | IA timeout · API down · KB ple · cap excepció escapa |

### 6.2 Fixtures determinístiques (mocks d'IA)

```
js/tests/_fixtures/iaResponses.js
  ├── castellers/    (cas cooperatiu tradicional)
  ├── saas/          (cas startup tecnològic)
  ├── event/         (cas event cultural)
  ├── formacio/      (cas workshop educatiu)
  └── degenerats/    (timeout · JSON invàlid · API key error)
```

Cada fixture inclou la resposta IA esperada i el conjunt de nodes
canònic resultant · el test compara byte a byte (excepte timestamps i IDs).

### 6.3 Smoke E2E (`scripts/smoke-create.sh`)

1. `node js/tests/projectCreationLegendary.test.js` · ha de passar 100%
2. `node scripts/simulate-create.js` (headless · 5 casos del fixture)
3. Valida que `/hub/{id}` renderitza sense errors
4. Mesura `qualityScore` per cas · ha d'estar ≥ baseline per ambition

### 6.4 Bucle de millora

- Cada execució real (no test) registra `creation_run` al KB amb
  `{ projectId · ambition · qualityScore · cost · ms · fallbacksUsed }`.
- Dashboard `/sprint` (post-merge) mostra evolució setmanal.
- Si `qualityScore` mitjà baixa de l'objectiu · obre WO automàtic.

---

## 7 · Cost estimat de la consolidació

| Fase | Tasques | LOC delta | Temps |
| --- | --- | ---: | ---: |
| F1 · TDD scaffold | fixtures + estructura suite + stubs | +500 | 2h |
| F2 · template catàleg | extracció `FOUNDER_*` + 2 templates més (saas · event) | +400 / -250 | 3h |
| F3 · orchestrator | refactor `unifiedProjectCreationService` + personalize | +300 / -150 | 3h |
| F4 · quality validator | scoring contra barem § 3 | +200 | 1.5h |
| F5 · UI consolidation | rename + esborrar MAX btn + update Dashboard hero | -120 | 1h |
| F6 · backlog wo · `wo-tdd-ia-project-flow-001` queda done | docs | +30 | 0.5h |
| **Total** | | **+1.110 net** | **~11h** |

Estalvi futur · -1 vista que mantenir · 1 sol prompt-loop on iterar · cost
de IA ajustable per ambition · qualitat mesurable amb una sola mètrica.

---

## 8 · Decisions preses (alvaro · 2026-05-15)

1. **Templates inicials al MVP** · **2** · `founder-coop-tradicional` +
   `default-balanced` · més templates en sprints posteriors quan ja
   estiguem en alfa.
2. **Mode `light`** · **mínim IA** · 1 call cheap (~0.002€) per personalitzar
   el nom · sector i descripció als nodes seed. Manté cost gairebé 0 però
   amb un toc IA mínim. No serà mai 0€ estricte.
3. **Empty state "Carregar demo Castellers"** · passa a ser un cas del nou
   `/create` invocat com `?ambition=light&template=founder&skip-prompt`.
   Un sol path conceptual.
4. **Timing** · **pre-alfa privada · demà** · abans del primer cohort
   estable · entrar a alfa amb un sol flow ja validat per TDD i evitar
   haver de migrar projectes ja creats.

---

## 9 · Següents passos concrets (demà)

Branch nova · `claude/project-creation-legendary` (creada avui · sense PR).

**Ordre d'execució (revisat amb decisions §8):**
1. **AM · F1 (TDD scaffold) + F4 (quality validator)** · xarxa de seguretat
   primer · fixtures determinístiques amb 2 casos (founder+default).
2. **AM tarda · F2 (catàleg MVP-2)** · extracció `FOUNDER_*` →
   `templates/founder-coop-tradicional.js` + creació
   `templates/default-balanced.js` (versió neutra ·
   "projecte cooperatiu genèric").
3. **PM · baseline** · córrer suite TDD nova contra MAX existent ·
   confirmar score baseline (esperem ~80/100 per founder · ~0 per default).
4. **PM tarda · F3 (orchestrator)** · refactor
   `unifiedProjectCreationService` → `projectCreationOrchestrator` ·
   afegir `personalize` step amb mínim IA per ambition `light`.
5. **EOD · F5 (UI cleanup)** · esborrar MAX btn del DashboardView ·
   reapuntar DashboardV2 hero "Carregar demo Castellers" a
   `/create?ambition=light&template=founder&skip-prompt`.
6. **EOD · F6 (backlog)** · tancar `wo-tdd-ia-project-flow-001` ·
   `wo-project-creation-legendary-001` (nou) i bump BUILD_STAMP → v81.
7. **PR consolidat** · `claude/project-creation-legendary` · només quan
   tu ho diguis explícitament.

---

**TL;DR** · V2 té cervell IA però no cos · MAX té cos però no cervell ·
ens cal un orchestrator que classifica via IA + agafa template + personalitza
amb IA segons ambition + valida amb score. Resultat: un sol flow `/create`
amb 3 nivells (light/standard/max) i mapa de valor de 80+/100 garantit
per TDD.
