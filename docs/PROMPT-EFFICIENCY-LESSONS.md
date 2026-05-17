# Prompt Efficiency Lessons · evidència empírica VNA (v132d+)

> Doc viu · acumula learnings reals de benchmark amb LLM live.
> Template inicial · v132d. Updated cada vegada que @alvaro corri test real.

## Resum executiu (omplir post-evidence)

| Mètrica | Valor observat | Target | Notes |
|---|---:|---:|---|
| Win rate Variant B (SLIM/MINIMAL) vs A (FULL) | TBD | ≥ 60% | de 20 casos benchmark |
| Token savings B vs A | TBD | ≥ 40% | mitjana |
| Cost mitjà per mapa (slim) | TBD | ≤ 0.0005€ | small-tier |
| Cost mitjà per mapa (full) | TBD | ≤ 0.0015€ | reasoner-tier |
| Latency mitjana slim | TBD | ≤ 5s | UX percebuda |
| Latency mitjana full | TBD | ≤ 15s | acceptable per a chain expert |
| Casos amb escalation (slim → full) | TBD | ≤ 20% | si > 30%, slim no és prou bo |
| Score rubric mitjà · slim | TBD | ≥ 70 | scoreOutput |
| Score rubric mitjà · full | TBD | ≥ 80 | scoreOutput |

## Casos benchmark · resultats (omplir per execució)

Casos a `knowledge/benchmarks/vna-quality-cases.json` · 20 casos canonical.

| Cas | Variant winner | Score A | Score B | Tokens A | Tokens B | Saving | Notes |
|---|---|---:|---:|---:|---:|---:|---|
| case-sports-football | TBD | TBD | TBD | 2477 | 184 | 93% | El cas crític · ha de generar rols esportius reals |
| case-arts-theatre | TBD | TBD | TBD | TBD | TBD | TBD | |
| case-coop-cares | TBD | TBD | TBD | TBD | TBD | TBD | |
| case-edu-school | TBD | TBD | TBD | TBD | TBD | TBD | |
| case-saas-startup | TBD | TBD | TBD | TBD | TBD | TBD | |
| case-bakery-coop | TBD | TBD | TBD | TBD | TBD | TBD | |
| case-energy-coop | TBD | TBD | TBD | TBD | TBD | TBD | |
| case-religious-parish | TBD | TBD | TBD | TBD | TBD | TBD | |
| case-political-movement | TBD | TBD | TBD | TBD | TBD | TBD | |
| case-art-collective | TBD | TBD | TBD | TBD | TBD | TBD | |
| case-worker-coop | TBD | TBD | TBD | TBD | TBD | TBD | |
| case-research-lab | TBD | TBD | TBD | TBD | TBD | TBD | |
| case-fablab | TBD | TBD | TBD | TBD | TBD | TBD | |
| case-health-clinic | TBD | TBD | TBD | TBD | TBD | TBD | |
| case-hotel | TBD | TBD | TBD | TBD | TBD | TBD | |
| case-construction | TBD | TBD | TBD | TBD | TBD | TBD | |
| case-coworking | TBD | TBD | TBD | TBD | TBD | TBD | |
| case-ecommerce | TBD | TBD | TBD | TBD | TBD | TBD | |
| case-radio-comm | TBD | TBD | TBD | TBD | TBD | TBD | |
| case-housing-coop | TBD | TBD | TBD | TBD | TBD | TBD | |

## Hipòtesi a validar

### H1 · "Menys context > més context"
- Variant B (MINIMAL · 184 tokens) genera mapes ≥ qualitat que Variant A (FULL · 2477 tokens) en ≥ 60% casos
- Si confirmat → `slim:true` per defecte a `runExpertChain` v133+

### H2 · "Mode completar evita duplicació"
- Quan `existingMap` injectat · model NO repeteix rols ja presents en > 90% casos
- Cas test · regenerar el mateix mapa 3 vegades · tots 3 outputs distints en mode complete

### H3 · "Escalation rubric salva els casos pobres"
- Quan slim output té score < 70 · escalation a FULL incrementa score en ≥ 15 punts mitjana
- Si confirmat → escalation default ON

### H4 · "Domain detection té impacte directe a qualitat"
- Casos amb `domainDetection` injectat · score mitjà ≥ 10 punts > sense
- Bug v126 · "futbol = rols d'Arts" no torna a passar amb 24 packs canonical

### H5 · "Sector agent context redueix output genèric"
- Casos amb `sectorContext` (knowledge/sectors/*.md) · % intangibles_named ≥ 60% vs 30% sense

## Procediment per a executar benchmark real

### Prerequisites
- API key Anthropic / OpenAI / Gemini configurada a `/settings`
- Saldo wallet ≥ 0.10€ (~20 casos × 0.005€ promig)

### Execució (CLI · v132f · disponible)
```bash
# Dry-run (sense LLM · validació pipeline)
node scripts/run-vna-benchmark.mjs --dry-run --limit 3

# Live (Anthropic Haiku 4.5 per defecte · més barat)
ANTHROPIC_API_KEY=sk-ant-... node scripts/run-vna-benchmark.mjs

# Subset (iterar ràpid abans del full 20)
ANTHROPIC_API_KEY=sk-ant-... node scripts/run-vna-benchmark.mjs --limit 5

# OpenAI alternative
OPENAI_API_KEY=sk-... node scripts/run-vna-benchmark.mjs --provider openai

# Custom model
ANTHROPIC_API_KEY=sk-ant-... node scripts/run-vna-benchmark.mjs --model claude-sonnet-4-6
```
Output · escriu `docs/benchmarks/results-<timestamp>.md` amb taula resultats + resum agregat + verdict H1.

### Execució (UI · v132f · /prompts-debug)
- Obrir `/prompts-debug` · sidebar dret · secció **🧪 A/B Lab**
- (v132f) Seleccionar cas del **dropdown Cas benchmark** · auto-omple name/description/sector
- Click **▶ Compara prompts (estàtic · sense LLM)** per veure els tokens FULL vs SLIM vs MINIMAL
- Click **⚡ Run live A/B (LLM real)** per a comparació amb provider real (API key a `/settings`)
- Resultat · winner + scores + tokens reals · còpia manual a la taula d'aquest doc
- Save al KB · `type='prompt_ab_test_result'` (auto via `recordABTestResult`)

### Procediment manual (alternativa simple ara)
```js
// A consola del navegador a /prompts-debug
import('./js/core/promptABTestService.js').then(async m => {
    const cases = await fetch('/knowledge/benchmarks/vna-quality-cases.json').then(r => r.json());
    const { generateWithProvider } = await import('./js/core/aiProviderService.js');
    const results = [];
    for (const c of cases.cases) {
        const r = await m.runABTest({
            context: { name: c.name, description: c.description, sector: c.sector, vna_zoom: 'mid' },
            provider: generateWithProvider,
        });
        results.push({ case: c.id, ...r.comparison });
    }
    console.log(m.summarizeABTests(results.map(r => ({ content: r }))));
});
```

## Findings · observacions empíriques (omplir post-benchmark)

### Patterns que funcionen
- TBD

### Patterns que NO funcionen
- TBD

### Sorpreses
- TBD

### Anti-patterns descoberts
- TBD

## Decisions a prendre post-benchmark

| Decisió | Default proposat | Confirmar |
|---|---|---|
| `slim:true` per defecte a `runExpertChain`? | Sí si H1 confirmat | post v133 |
| `qualityThreshold` per a escalation? | 70 (default actual) | post-evidence |
| Eliminar few-shot examples del system? | Pendent · pot ajudar però infla | post v133 |
| Reduir més SYSTEM_BASE_SLIM (1549→1200 chars)? | Pendent · si H1 fort | post v133 |
| Activar slim a phases 6-8 (socs · sops · wos)? | NO per defecte · només map | mantenir |

## Aprenentatges generals (acumulats)

### v132b (anàlisi estàtic)
- REAL prompt 2477 tokens · MINIMAL 184 tokens · 13.5x diff
- SYSTEM_BASE_SLIM 43% reducció mantenint principis VNA + castell + contract
- Hipòtesi "menys context > més" plausible · pendent validació empírica

### v132c (wire-up)
- Mode completar · prompt header canvia · llista rols/txs existents
- Escalation rubric · score<70 refà amb FULL · transparent al user via events
- Benchmark dataset 20 casos · cobertura sectors + domains

### v132d (unificació /map ↔ chain)
- `vnaQuickSuggest.quickSuggestMap()` · single-call wrapper · slim default
- `determineMode()` · helper UI · auto-elegeix quick vs full
- Pendent · migrar `ValueMapView._runAISuggestion` a usar `quickSuggestMap` (no breaking · refactor intern)

### v132e (ValueMapView migrat)
- `ValueMapView._runAISuggestion` ara enruta · default `_runAISuggestionQuickSuggest` (nou) · feature flag `?vmap_ui=legacy` preservat
- Adapter Orchestrator.callLLM → generateWithProvider({system, user}) retorna { text, usage }
- `existingMap` injectat quan hi ha roles existents (mode completar transparent)
- UI escalation hint quan score < 60 → "⚡ Escalant a prompt complet (qualitat baixa)…"
- Backwards-compat verificat · API `_runAISuggestion()` sense args manté

### v132f (benchmark CLI + UI dropdown)
- CLI `scripts/run-vna-benchmark.mjs` executable · dry-run / limit / provider / model · output markdown
- UI `/prompts-debug` · dropdown 20 casos benchmark · auto-omple ctx · botó "Run live A/B (LLM real)"
- Provider adapter mínim a CLI (anthropic + openai) · llegeix env vars · no depèn de KB
- Verdict H1 auto-calculat al markdown · win rate B ≥ 60% → CONFIRMAT

## Roadmap d'iteració (post-benchmark)

| Sprint | What | Conditional on |
|---|---|---|
| v133 | Executar 20 casos · omplir aquesta taula | API key configurada |
| v133 | Doc lessons learned + decisions | benchmark complet |
| v134 | Ajustar SLIM segons evidence (1549→1200 si H1 fort) | findings positius |
| v135 | Migrar /map al `quickSuggestMap` (no breaking) | unificació backend |
| v136+ | Si confirmat slim+rubric · activar per defecte tot el ecosystem | confidence alta |

---

*Doc viu · template inicial v132d · 2026-05-19. Actualitzar cada execució benchmark.*
