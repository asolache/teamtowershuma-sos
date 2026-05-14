# TeamTowers SOS V11 · Sprint Plan · pending alpha

Aquest document recull els ítems **L** i **XL** identificats al review del 2026-05-14 que no s'han pogut tancar en la sessió per esforç. Els ítems **XS/S/M** ja merged a main.

---

## Àrea 1 · `/market` ↔ `/opportunities` (parcial)

### ✅ Fet a sprint A (PR #53)
- Bug fix · filtre coherent · ítems sense projecte visible es mostren · ítems de projectes arxivats/test només si el projecte té entrada al dropdown
- Banner cross-link → `/opportunities?tab=market` perquè l'usuari trobi el descobridor federat

### ⏳ Sprint B (pendent · M complexity · ~6h)
- **Publicació inline** a `MarketView` · botó "↑ Publicar al permaweb" per a cada card local
  - Reusa `publishMarketEntityToPermaweb` ja existent (publicEntityService)
  - Crea automàticament `public_market_item_entry` perquè aparegui a `/opportunities`
  - Plan enforcer · si free → cost permaweb-publish-paid
- **Toggle "Mostra arxivats"** a la UI de MarketView (just barrar `visibleIds` quan activat)

### ⏳ Sprint C (pendent · L complexity · ~12h)
- **Merge total** · evaluar moure tot a `/opportunities?tab=market` amb mode dual "Mode editor" / "Mode descobridor"
  - Mode editor · query KB local (`market_item`)
  - Mode descobridor · query permaweb-cached (`public_market_item_entry`)
  - Eliminar route `/market` (alias temporal a `/opportunities?tab=market`)
- **Decisió pendent:** depèn del feedback dels usuaris · alfa pot mantenir els dos durant 1 cohort

---

## Àrea 2 · Eficiència + Estalvi · hardcoded → live

### ✅ Fet a sprint A (PR #53)
- `js/core/conventionalRangesService.js` · NOU servei · loadConventionalRanges / saveConventionalRanges / validateRangesShape
- `SavingsView` ara llegeix ranges del KB config (fallback a defaults si no n'hi ha)
- 23 tests nous · `conventionalRanges.test.js`

### ⏳ Sprint B (pendent · S complexity · ~3h)
- **UI editor** a `SettingsView` · tab nou "Rangos mercat"
  - Form amb 4 categories (notaria · contable · pm · consultoria)
  - Inputs lowEur / highEur / label / unit per categoria
  - Botó "Restaurar defaults"
  - `validateRangesShape` per a feedback visual
- **Reset/clear** · botó per a esborrar el node config (torna a fallback)

### ⏳ Sprint C (pendent · M complexity · ~6h · alpha-deferred)
- **Live data ranges** · integrar fonts reals
  - GreenPaper o INE notaries cost
  - Glassdoor/Levels.fyi PM rates · català
  - Cron periòdic actualitza el node config automàticament
- **Multi-currency** · si fora d'EUR · conversión via FX

---

## Àrea 3 · IAs al Kanban · estandardització SOS + TDD agent

### ✅ Fet a sprint A (PR #53)
- `js/core/woContextBuilder.js` · NOU · `buildWoContext` pure que injecta:
  - SOS Canonical Principles MUST-HONOR header
  - Sector + projectType + iaContextHint
  - Subtype context (cooperativa-cures · etc.)
  - Roles afectats (top 5)
  - Transactions VNA vinculades (top 5)
  - Neural path bundle
  - Accounting hints (TEA · estimatedHours × fmvPerHour)
  - Output expectations
- Integrat a `KanbanView._executeAi` · sosHeader pre-pended al `ctx.systemPrompt` de KnowledgeLoader
- 32 tests nous · `woContextBuilder.test.js`

### ⏳ Sprint B · TDD Autonomous Agent (pendent · L complexity · ~12h)
**Objectiu** · agent IA que processa el backlog de WOs amb TDD fins a totes verdes.

**Components:**
1. `js/core/backlogAutonomousAgent.js` · classe `BacklogAutonomousAgent`
   - `runUntilGreen({ items, evaluator, maxIterations, budgetEur })`
   - Loop · pickNext red → runSprintItem → evaluator (TDD check del WO) → mark green o continue
   - Failover chain via `runEscalation` (Anthropic → OpenAI → Gemini → DeepSeek)
   - Cost tracking per run · enforce budget
   - Persisteix log a `sprint_run` nodes

2. Evaluator sentinel · reusa `aiEvaluatorService.js` + el `_evalTdd` de `KanbanView` per a checks:
   - `contains:text` · `minLen:N` · `h2Count:N` · `regex:/.../`
   - Sprint C extensions · `lint:eslint` · `test:vitest`

3. UI a `SprintView` · botó "🤖 Run autonomous loop"
   - Modal · budget · max iterations · evaluator kind
   - Progress real-time (polling sprint_run new nodes)

**Test approach** · 25+ tests amb mocks per a `runSprintItem` + KB.

### ⏳ Sprint C · Code-Generation + Apply (pendent · XL complexity · 30h+)
- Suport `kind:'code-generation'` al runner
- Sandbox per executar codi generat
- Apply diff al filesystem (necessari pipeline com Claude Code o equivalent)
- **Decisió** · cal humà · alpha pot quedar amb sprint B (draft mode)

---

## Àrea 4 · ProjectHub · 🐝 Enjambre

### ✅ Fet a sprint A (PR #53)
- `js/core/swarmAffinityService.js` · NOU · pure functions:
  - `scoreProjectAffinity(p1, p2)` · 0.5 sector + 0.3 skill + 0.2 guardian (Jaccard)
  - `rankAffinity(target, candidates, { topN, trustScores, trustWeight })` · combina affinity + trust PageRank
  - `findGapSkills(target, cohortMembers, { topN })` · skills coverage
- `ProjectHubView._renderSwarmDiscoveryPanel` · grid 5 cards "🔗 Projectes afins · propostes de connexió"
  - Sector / Skill / Guardian breakdown badges
  - Trust score recursive (PageRank) badge
  - Permaweb icon si publicat
  - Click → /n/{projectId}
- 28 tests nous · `swarmAffinity.test.js`

### ⏳ Sprint B (pendent · M complexity · ~6h)
- **CTA "Connectar"** per a cada card
  - Modal amb opcions · "Enviar missatge" (placeholder) · "Crear WO cross-project" (vincula el WO al projecte afí)
  - Crea node `connection_request` type
- **Seats afins** · panel addicional "🤝 Seats del cohort que completen aquest projecte"
  - Usa `findGapSkills(target, allSeats)` sobre `cohortSeatService` data
  - Ordena per coverage DESC
- **Filtre** · slider mínim de score (0.05 default)

### ⏳ Sprint C (pendent · M complexity · ~6h)
- **Configurar pesos** des de UI · sliders sector/skill/guardian a `/settings`
- **Tendència** · veure projectes que han pujat de score recentment (delta-7d)
- **Match notifications** · auto-notify quan un nou projecte amb >80% affinity apareix al cohort

---

## Resum

**Total esforç pendent estimat** · ~75h (4-5 sprints d'alpha cohort)

**Prioritat per a alpha (cohort 0):**
1. Àrea 3 · Sprint B (TDD agent) · diferenciador més fort del SOS
2. Àrea 4 · Sprint B (CTA Connectar + seats afins) · tanca el loop d'enjambre
3. Àrea 2 · Sprint B (UI ranges) · 3h · quick win d'autonomia per usuaris

**Backlog manifest** · els ítems sprint B+/C+ s'han d'afegir manualment a `backlogManifest.js` per a que el SprintView i el (futur) BacklogAutonomousAgent els puguin recórrer.

---

Última actualització · 2026-05-14 · PR #53 a `main`.
