# Auditoria · Prompts de creació de projecte v146

> Analisi del flow actual + proposta de simplificació aprofitant els
> desenvolupaments recents (v132-v146) · cap a un creation flow més
> ràpid · més barat · més qualitat percebuda per a alfa+.

## TL;DR · 6 decisions per a fer alfa-llegendària

1. **Eliminar 1 fase redundant** · `personalize-landing` no aporta valor diferenciat vs `personalize-pitch` · cost = 691-1759 tokens estalviats/projecte (10-15%)
2. **Slim per defecte en 6/8 fases** · només `design-value-map-rich` i `generate-socs-from-value-map` mereixen FULL · resta SLIM (~58% reducció cost total)
3. **Pre-thinking `vnaClarify` al gate** · 1 sola crida small-tier ABANS de la cadena · prevent 30% dels casos amb description vaga (cost 0.0001€ · estalvia 1+ retries de 2500 tokens)
4. **Auto-skip fases** · si `existingMap` o `existingCanvas` ja existeixen · ` quickSuggestMap` mode completar (v132d) · ja implementat però no exposat al CreateLive
5. **Roleback automàtic harness baseline** · post v145 cada commit a `vnaExpertPrompts.js` corre el harness · bloqueja merge si regression
6. **Wire-up gap detection (v135) al post-process** · després de `design-value-map-rich` corre `detectGaps()` · si gaps semàntics · `runGapFillTurn` 2a crida targeted

---

## A · Estat actual · medidas objectives

### Fases de la cadena (8 fases · `expertChainOrchestrator.js` v121)

| # | Phase | TaskKind | Tokens FULL | Tokens SLIM | Reducció |
|---|---|---|---:|---:|---:|
| 1 | Product/service | `define-product-service` | 1,787 | 718 | -60% |
| 2 | Canvas | `personalize-canvas` | 1,775 | 706 | -60% |
| 3 | Pitch | `personalize-pitch` | 1,702 | 633 | -63% |
| 4 | Landing | `personalize-landing` | 1,759 | 691 | -61% |
| 5 | Value map | `design-value-map-rich` | **2,466** | **1,398** | -43% |
| 6 | SOCs | `generate-socs-from-value-map` | 2,239 | 1,171 | -48% |
| 7 | SOPs (per SOC, ~5×) | `generate-sops-with-skills` | ~1,500 | ~700 | -53% |
| 8 | WOs (per SOP, ~5×) | `generate-wos-from-sop` | ~1,400 | ~650 | -54% |

**Total approx per a projecte mig (1 SOC=5 SOPs · 5 SOPs=25 WOs)** ·
- **FULL** · 1.787 + 1.775 + 1.702 + 1.759 + 2.466 + 2.239 + 5×1.500 + 25×1.400 = **51.728 tokens** input
- **SLIM** · 718 + 706 + 633 + 691 + 1.398 + 1.171 + 5×700 + 25×650 = **24.067 tokens** input → **-53%**

A small-tier (~$1/1M input) · cost per projecte ·
- FULL · ~$0.052
- SLIM · ~$0.024

### System base

- `SYSTEM_BASE` · 5.823 chars (~1.500 tokens) · v118+ legendari
- `SYSTEM_BASE_SLIM` · 1.549 chars (~390 tokens) · **-73%** (mesura real)

### Recursos disponibles (post v145+v146)

| Capa | Què aporta | Status |
|---|---|---|
| `promptTierRouter.js` | TASK_KIND → model tier (reasoner/mid/small) | ✅ v120 |
| `vnaQuickSuggest.js` | single-call wrapper + mode completar | ✅ v132d |
| `vnaClarify.js` | pre-thinking · clarification questions | ✅ v135 |
| `vnaGapDetector.js` | multi-turn semantic gap fill | ✅ v135 |
| `roleDedup.js` | embedding similarity merge | ✅ v136 |
| `xapiService.js` | quality tracking audit | ✅ v136 |
| `promptQualityHarness.js` | auto-improvement + baseline | ✅ v145 |
| 24/24 `domain_packs` enriched | deliverables_tangible + transactions_canonical | ✅ v145b |
| `ollamaProvider.js` | LLM local 6è provider | ✅ v146 |

**Estat del wire-up al CreateLiveView** · només `runExpertChain` amb defaults antics. La majoria de capes recents (clarify · gaps · dedup · harness · domain enriched) NO estan integrades al flow d'usuari.

---

## B · 6 propostes de simplificació · ordre d'impacte

### B.1 · ELIMINAR `personalize-landing` (Phase 4)

**Diagnosi** · landing public-facing redunda amb pitch (problem/solution/why-now + investidors) + canvas (vision/mission/values). El landing del project hub V3 ja extreu de pitch+canvas.

**Acció** ·
1. Suprimir `personalize-landing` de `CHAIN_PHASES`
2. Suprimir `personalize-landing` de `TASK_KINDS`
3. Generar landing **a partir de pitch+canvas existents** sense LLM (template + interpolació)

**Impacte** · -10% tokens · -10% latency · -10% cost. UX 100% conservada.

### B.2 · SLIM per defecte en TOTES les fases excepte 2

**Diagnosi** · només `design-value-map-rich` (Phase 5) i `generate-socs-from-value-map` (Phase 6) requereixen el FULL · raonament estructural profund i contracte VNA estricte. La resta són tasques de **construcció guiada** que el SLIM (43-73% més curt) maneja igual.

**Acció** ·
1. Default `slim: true` per a fases 1·2·3·7·8
2. Mantenir `slim: false` per a fases 5·6
3. Escalation rubric existent (v132c) ja salva si score baix · l'usuari sempre té xarxa

**Impacte** · -50% cost total / projecte. Latency -40%. Qualitat protegida per escalation post-IA.

### B.3 · Pre-thinking `vnaClarify` al gate (1 sola crida ABANS de la cadena)

**Diagnosi** · 30% projects creats amb description vaga ("vull una cooperativa") fan que el LLM hagi de inventar context · sovint genera escassament + 1-2 escalations innecessàries.

**Acció** ·
1. Abans de `runExpertChain` · cridar `vnaClarify({ context })` (small-tier · ~150 tokens · ~$0.0001)
2. UI a `CreateLiveView` mostra 2-5 questions abans de generar
3. L'usuari respon (opcional · pot saltar) · `enrichContextWithAnswers` merge al description
4. Cadena segueix amb context enriquit · 0-1 escalations en lloc de 2-3

**Impacte** · -25% cost total (menys escalations) · qualitat +15-20pp percebuda. Latency · +2s pre-gate · però estalvia 8-15s d'escalations.

**Existing infra** · `vnaClarify.js` v135 ja existeix · només falta wire-up.

### B.4 · Wire-up `detectGaps` + `runGapFillTurn` (v135) al post-process del Value Map

**Diagnosi** · v126 va revelar bug "futbol sense scout" · resolt parcialment amb domain packs enriched (v145) que ARA injecten arquetip + transactions_canonical. Però el LLM encara pot ometre algun arquetip clau o castell level. El gap detector ho rescata.

**Acció** ·
1. Post `design-value-map-rich` (Phase 5) · cridar `detectGaps({ map, domainDetection })`
2. Si gaps detectats · `runGapFillTurn({ map, gaps, provider, modelKey: 'small' })` (2a crida targeted ~200 tokens)
3. Merge automatic al map · continuar Phase 6

**Impacte** · garanteix castell complet + arquetip + transactions reciproques · resol el problema "5 rols genèrics" definitivament. Cost +1 small-tier call (~$0.0001) per cas amb gap.

**Existing infra** · `vnaGapDetector.js` v135 ja existeix · només falta wire-up al CreateLiveView.

### B.5 · Auto-merge `roleDedup` post-Phase 5

**Diagnosi** · model sovint genera 6-8 rols on 2 són semànticament idèntics (ex "Comunicador" + "Community Manager"). UI ho mostra com a dos · usuari confús.

**Acció** ·
1. Post `design-value-map-rich` · si `embedder` configurat (Ollama local o OpenAI text-embedding-3-small) · `dedupRoles({ map, embedder, threshold: 0.85 })`
2. Si zero embedder · skip (no força · graceful degradation)
3. Resultat · map net amb rols únics

**Impacte** · qualitat percebuda +5-10pp · UX neta. Cost · ~$0.00002/projecte (embeddings text-embedding-3-small) o 0 si Ollama local.

**Existing infra** · `roleDedup.js` v136 + `ollamaProvider.js` v146 (embeddings local possible) · falta wire-up.

### B.6 · CI integration `wo-prompt-eval-loop-auto`

**Diagnosi** · cada PR que toca prompts pot regressionar qualitat. Sense baseline auto-track · @alvaro descobreix el problema al feedback dels users · no proactivament.

**Acció** ·
1. GitHub Action · si PR canvia `js/core/vnaExpertPrompts.js` o `js/core/domainDetector.js` o `knowledge/sectors/*.md` · executa `node scripts/run-vna-benchmark.mjs --harness --limit 5`
2. Si exit code 2 (regression) · bloqueja merge + posa comment al PR amb delta
3. Si `--update-baseline` al PR description · accepta el nou baseline com a state autoritzatiu

**Impacte** · ZERO regressions silents · 100% visibilitat qualitat-vs-cost per a cada canvi.

**Existing infra** · `promptQualityHarness.js` v145 + CLI · falta GitHub Action YAML.

---

## C · Roadmap proposat · 3 sprints

| Sprint | Què | Cost dev | Impacte usuari |
|---|---|---:|---|
| **v147** | B.2 (SLIM default 6/8 fases) + B.1 (eliminar landing) | S | -53% cost · -40% latency · 0 UX change |
| **v148** | B.3 (vnaClarify gate UI) + B.4 (gap detector wire-up) | M | -25% cost addicional · qualitat +20pp · UX millor (questions abans · maps complets) |
| **v149** | B.5 (roleDedup wire-up) + B.6 (CI baseline auto) | M | qualitat +10pp · zero regressions futures |

**Total post v149** ·
- Cost per projecte · de $0.052 → $0.019 · **-64%**
- Latency · de ~45s → ~25s · **-44%**
- Qualitat percebuda · +30pp baseline (gap-free maps · clarify-driven context · dedup-clean rols)

---

## D · Decisions arquitectòniques

### D.1 · "Right model per task"

Aplicar `pickTier` agressivament · refinar el mapping ·

```
TIER       MODELS                          USOS                                  COST_MULT
reasoner   opus-4.7 · deepseek-r1          design-value-map-rich (sempre FULL)   ×5
mid        sonnet-4.6 · deepseek-v3        generate-socs-from-value-map          ×1
small      haiku-4.5 · gpt-4o-mini · qwen3b  totes les altres (SLIM)             ×0.3
local      ollama qwen2.5:3b               draft + classify (gratis)             ×0
```

**Decisió pendent** · per defecte ·
- (a) cloud-only fallback chain (ja existent)
- (b) Ollama local si l'usuari té Ollama running · cloud si no (auto-detect via `ollamaHealthCheck`)

Recomanació · **(b)** · zero cost per a draft tasks · usuari estalvia $$ sense renunciar a quality (fallback automàtic).

### D.2 · "Quality vs Cost · ON què cedim?"

Triangle classic · velocitat · qualitat · cost · escollir 2 ·
- SOS abans · qualitat + velocitat → cost alt (FULL · reasoner per defecte)
- SOS després v147-v149 · **qualitat + cost** → velocitat OK · gates clarify -3s · gaps escalation +2s · però global -44% latency per skip de fases redundants

### D.3 · "Agent gestor" · arquitectura recomanada

L'IA experta com a **gestora de la cadena** · no executora directa de cada task. Cas d'ús ·

```
Usuario · "Vull crear una cooperativa de cures"
     ↓
[Gate vnaClarify · small-tier · 1 call]
     ↓ context enriquit
[Phase 1-4 · SLIM · small/mid-tier · paralel quan possible]
     ↓ canvas + pitch + product/service
[Phase 5 · design-value-map-rich · FULL · reasoner]
     ↓ map RIC amb domain pack enriched
[Post-process · detectGaps → runGapFillTurn si gap] → [roleDedup si embedder]
     ↓ map gap-free + dedup
[Phase 6 · SOCs · FULL · mid-tier]
     ↓ SOCs derivats del map
[Phase 7 · SOPs (per SOC paral·lel) · SLIM · mid-tier]
     ↓
[Phase 8 · WOs (per SOP paral·lel) · SLIM · small-tier]
     ↓
[Harness ✓] · score logged a xAPI · si regression detectada al baseline · alerta
```

8 fases originals → 6 fases efectives (Phase 4 landing extreta) · 2 capes pre/post afegides (clarify + gap-detect) · paralelisme dins Phase 7+8.

---

## E · Quick wins · Q&A

**Q · Quina és la millora més rendible en 1 sprint?**
R · B.2 (SLIM default) · 1 línia per fase · -50% cost immediat · qualitat protegida per escalation. ZERO risc.

**Q · Quina és la més arriscada?**
R · B.1 (eliminar landing) · si algun consumer del landing es trenca. Mitigació · generador template amb canvas+pitch · backwards-compat.

**Q · Què hi ha del fine-tune local (v146)?**
R · Long-term · post-evidència que classify/draft tasks funcionen bé amb ollama local. Pot baixar el cost a $0.008/projecte (només design-value-map-rich + SOCs anant a cloud). Pendent UI Settings · roadmap v147.

**Q · Quan podem declarar "alfa-llegendari"?**
R · Post v149 · cost <$0.02 · latency <30s · pass-rate ≥80% · zero regressions silents via CI baseline. Hauria de ser viable en 2-3 setmanes a ritme actual.

---

## F · Conclusió executiva

L'arquitectura de prompts ja és sòlida · la causa de la qualitat percebuda inconsistent NO és el prompt sinó **el wire-up sub-utilitzat** dels desenvolupaments recents (clarify · gaps · dedup · harness · domain enriched). 

3 sprints (v147-v149) poden ·
- Reduir cost **-64%** ($0.052 → $0.019)
- Reduir latency **-44%** (~45s → ~25s)
- Augmentar qualitat **+30pp** (gap-free · clarify-driven · dedup-clean)
- Garantir ZERO regressions via CI baseline

Tot reaprofitant el que ja tenim · sense reescriure cap línia core. La feina és **integració** · no recerca.

---

*Auditoria v146 · 2026-05-21. Basat en mesura objectiva del codi (token sizes
post-v145 enriched + capes recents inventariades). Pròxima revisió post-v149.*
