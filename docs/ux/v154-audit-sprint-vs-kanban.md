# Audit comparatiu · /sprint vs /kanban · prompts + execució IA + output

> Investigació arrel @alvaro · "/sprint generar pla IA fa bons entregables ·
> /kanban execució WO IA · què diferència els dos · on viuen els prompts ·
> on es guarda l'output del sprint?"

## TL;DR · 4 diferències clau

| Aspecte | `/sprint` "Generar pla IA" | `/kanban` "Ejecutar con IA" |
|---|---|---|
| **Prompt builder** | `sprintOrchestrator.buildItemPrompt` · 1 sol fitxer · ~80 lines | `KanbanView.buildExecutionPrompt` + `KnowledgeLoader.buildContext` + `woContextBuilder.buildWoContext` · 3 fonts combinades |
| **LLM call** | `runEscalation` · chain 5 providers (Anthropic→OpenAI→Gemini→DeepSeek→Minimax) amb fallback automàtic si quota | `Orchestrator.callLLM` directe · preferredEngine sense escalation chain |
| **Output destí** | KB node `type='sprint_run'` · audit log per run · NO vinculat a cap WO concreta | `aiOutput` field DINS de la WO mateixa · vinculat a project/SOP/step |
| **Validació automàtica** | Cap · output a humà via modal + Copiar | TDD-auto · si `approvalRule='tdd-auto'` + check booleà passa → auto-ledger (deliverable comptabilitzat) |

## Per què "no se guarda si no se copia" (parcialment cert)

**SÍ es guarda** · cada Sprint run crea un node KB amb · itemId · kind · output · tokens · modelKey · attempts · timestamps. Accessible al panel lateral "📜 Historial IA" + click obre detall (`_openHistoryDetail`).

**Però** · el run NO està VINCULAT a una WO concreta del backlog d'un projecte. És un "drafting tool" genèric · l'output ha de copiar-se manualment al lloc productiu (WO al kanban · doc del projecte · etc).

A `/kanban` en canvi · el output s'instal·la com a `aiOutput` directament a la WO + `tokensIn/Out` + `aiLatencyMs` + `aiSources` · queda lligat al projecte i ja sap d'on ve.

## On viu cada prompt · file:line

### Sprint (`/sprint`)

`js/core/sprintOrchestrator.js:24-102` · **`buildItemPrompt({ item, kind, principlesContext })`** ·
- **System** · "Ets un agent operatiu SOS" + 4 principis canònics + format markdown · ~12 lines hardcoded
- **User** · ítem backlog (id · title · priority · complexity · principles · dependencies · description · test requirements · suggested files · principles context · tasca per kind)
- **Kinds** · `draft` (6 seccions de plan) · `audit` (4 seccions de gap analysis) · `research` (4 seccions de biblioteques)

`js/views/SprintView.js:413` · `_handleRun(itemId, kind)` → `runSprintItem` → `persistSprintRun` al KB.

### Kanban (`/kanban`)

3 fonts combinades · stack profund ·

1. `js/views/KanbanView.js:124` · **`buildExecutionPrompt(wo)`** · user prompt · WO context + 5 regles "irrenunciables" (no inventis · cita SOP · tdd-test si aplica)

2. `js/core/knowledgeLoaderService.js` · **`KnowledgeLoader.buildContext({socs, sops, projectId, taskContext})`** · injecta `socs/teamtowers-brand.md` + SOPs canonical + project metadata + sector context als principis del system

3. `js/core/woContextBuilder.js` · **`buildWoContext({wo, project, roles, transactions})`** · SOS-branded header amb principis canònics · sector + subtype + roles + transactions + accounting hints

`js/views/KanbanView.js:482` · `_executeAi(woId)` → combina els 3 prompts → `Orchestrator.callLLM` → `aiOutput` field a la WO.

## Comparativa tècnica · resum

| Vector | Sprint | Kanban |
|---|---|---|
| Lines de prompt builder | ~80 | ~30 (own) + ~150 (KnowledgeLoader) + ~100 (woContextBuilder) |
| Context vinculat al projecte | NO (genèric backlog dev SOS) | SÍ (project · SOCs · SOPs · roles · txs) |
| Escalation provider fallback | SÍ (5 providers · runEscalation) | NO (preferredEngine direct) |
| Cost estimation real-time | SÍ (`totalCostEur` retornat) | SÍ (via `tokensIn/Out` × pricing) |
| Telemetria output | `attempts[]` per failover trace | `aiLatencyMs` + `aiSources` |
| TDD auto-execution | NO | SÍ (`approvalRule='tdd-auto'` + check booleà → ledger) |
| Persist target | `sprint_run` node (audit log) | WO field `aiOutput` (vinculat) |
| Reusability output | Manual copy/paste · revisió humana | Auto via TDD check · pot saltar a ledger sense humà |

## Diagnosi · per què `/sprint` "parece que va mejor"

3 factors probables ·

1. **Escalation chain** · Sprint prova 5 providers · si Anthropic té credit balance baix passa a OpenAI · etc. Kanban només prova el `preferredEngine` · si falla és error.

2. **Prompt builder més centrat** · Sprint demana 6 seccions estructurades (Resum · Pla fitxers · API surface · Test plan · Riscos · PR description). Kanban demana "output autocontenido en menos de 5 min revisió" · més obert · més depenent del context KnowledgeLoader.

3. **No té TDD validation** · Sprint accepta qualsevol output decent · Kanban exigeix `tddCheck` booleà · si falla torna a backlog amb `tddFailed: true` (UX pot semblar més estricta).

## Propostes v155+ · cross-pollination

| Proposta | De → A | Impacte |
|---|---|---|
| Wire `runEscalation` (Sprint) → Kanban `_executeAi` | Sprint → Kanban | Robustesa fallback · -50% errors per quota |
| "Apply to WO" botó al Sprint modal | Sprint → Kanban | Sprint output esdevé `aiOutput` d'una WO seleccionada (drop-down) |
| `linkedWoId` field al `sprint_run` | Sprint | Trace bidireccional WO ↔ sprint_run |
| Sections estructurades (6) al Kanban prompt | Sprint → Kanban | Outputs Kanban més consistents |
| TDD auto-check al Sprint | Kanban → Sprint | Sprint pot auto-ledger plans validats |

## Recomanació immediata

**v155 · Bridge Sprint ↔ Kanban** · 2 movim ·
1. Sprint modal · afegir botó "→ Applicar a WO" que llisti WOs pending del projecte actiu i pegui `aiOutput` + `tokensIn/Out` + `linkedWoId`
2. Kanban `_executeAi` · usar `runEscalation` en lloc de `Orchestrator.callLLM` directe · per a fallback automàtic providers

Cost · S · 4-6h codi + tests. Impacte · alta unificació · output Sprint deixa de ser "draft volàtil" · esdevé entrada productiva al kanban.

---

*Audit v154 · 2026-05-21. Fitxers analitzats · sprintOrchestrator.js · SprintView.js · KanbanView.js · knowledgeLoaderService.js · woContextBuilder.js.*
