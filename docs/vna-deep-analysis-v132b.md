# Anàlisi profund · model VNA actual · diagnòstic + millores + conclusions alfa (v132b)

> Anàlisi estàtic comparatiu del sistema de generació de **mapa de valor**
> (roles + transactions + deliverables) amb **SOCs + SOPs + roles ordenats** ·
> diagnòstic de què tenim · què funciona · què millorar · conclusions per a alfa.

## TL;DR · descobertes clau

1. **El prompt REAL del SOS V11 és 13.5x més gran que el "Sugerir con IA"** ·
   2477 tokens vs 184 tokens · 93% més car per call.
2. **El prompt REAL és tècnicament excel·lent** · 8 capes de context · però **probablement satura** el model en casos simples.
3. **La cadena de 8 fases és correcte arquitectònicament** · però **no s'usa al `/map`** (que fa una sola crida ràpida).
4. **No tenim test empíric** de qualitat output A vs B (cal correr 20 casos amb LLM real).
5. **Hi ha gap entre `/map · Sugerir con IA`** (curt, ràpid, qualitat percebuda alta) i **`createLive · expert-chain`** (llarg, pesat, qualitat percebuda variable).

## Mesures objectives · tokens per cas (sense LLM real)

Comparació generada amb el comparator real (`promptABTestService.js`) sobre 5 casos reals ·

| Cas | A simplificat | B minimal | Saving B vs A |
|---|---:|---:|---:|
| FC Lleida (sector R) | 263 | 176 | **33%** |
| Cooperativa Cures (Q) | 265 | 178 | **33%** |
| CodeCorp (J) | 263 | 176 | **33%** |
| Forn Vall (C) | 268 | 181 | **32%** |
| Som Energia (D) | 271 | 184 | **32%** |

Però comparant amb el **prompt REAL** (`vnaExpertPrompts.buildPrompt({ taskKind: 'design-value-map-rich', context: {...} })`) ·

| Prompt | Tokens | Cost small-tier estimat |
|---|---:|---:|
| **REAL vnaExpertPrompts (cas FC Lleida)** | **2477** | ~0.0012€ |
| Variant A comparator (simplificat) | 271 | ~0.00014€ |
| **Variant B minimal (estil Sugerir con IA)** | **184** | **~0.00009€** |

**Δ REAL vs MINIMAL · 2293 tokens estalviats · 93% més barat amb el minimal.**

## Diagnòstic · què tenim avui

### A · La cadena expert (`expertChainOrchestrator` v121 · `vnaExpertPrompts`)

**8 fases canòniques** ·
1. `define-product-service` → identifica el què
2. `personalize-canvas` → IKIGAI
3. `personalize-pitch` → pitch deck
4. `personalize-landing` → narrative pública
5. `design-value-map-rich` → **rols + transactions + deliverables (la fase clau)**
6. `generate-socs-from-value-map` → derivar SOCs (què + per què)
7. `generate-sops-with-skills` → expandir cada SOC a SOPs amb skills
8. `generate-wos-from-sop` → WOs executables

**Strengths** ·
- Cadena lineal lògica · fase N usa output fase N-1
- 8 capes de context al `design-value-map-rich` · `SYSTEM_BASE` (3500+ chars) + `domainDetection` + `sectorContext` + `canvas` + `pitch` + `product_service` + few-shot + user task
- Skip flags per fase · `runExpertChain({ skip: { product, canvas, ... } })`
- Budget guard · `maxCostEur` atura si total > límit
- Events streaming · `onEvent({ step, status, ... })` per a UX
- Per-item phases · phases 7-8 iteren per cada SOC/SOP en paral·lel
- Tier router · cada fase usa el model òptim (reasoner per a map · mid per a la resta · small per a landing)

**Weaknesses identificats** ·
- 🔴 **El system prompt és inflat** · `SYSTEM_BASE` 3500+ chars amb principis · methodologia VNA · model casteller · marc d'anàlisi · contracte sortida + many bullets. El model gasta ~875 tokens només llegint el setup abans de pensar.
- 🔴 **Context redundant** · si tenim `domainDetection.archetypes`, `sectorContext` injecta novament rols per nivell castell · *duplicació* en molts casos.
- 🔴 **THINK STEP-BY-STEP no es valida** · l'output diu "thinking" però no auditem si realment l'ha seguit · podria ser placeholder.
- 🟡 **Schema output molt detallat** · fixa moltes restriccions sobre IDs · castell_level enum · transactions amb reciprocates_with · etc. Bo per consistència, però limita creativitat.
- 🟡 **NO usa `runEscalation` qualitat-audit** per a `design-value-map-rich` · només `sop-structured` o `creative-narrative` (mirar `promptTierRouter`).

### B · El "Sugerir con IA" del `/map` (codi descobert via codeReview)

`ValueMapView._runAISuggestion()` · localització · línia 2529.

**System prompt** (162 chars · ultra-curt) ·
```
Eres un experto en Value Network Analysis (metodología Verna Allee).
Genera un mapa VNA en formato JSON estricto.

RULES:
- Roles = value flow activities, NOT job titles
- Respond ONLY with valid JSON, no markdown blocks
- fmv_usd_h always null
- open_question always null
- ids in kebab-case, unique
- ALL role names, descriptions, deliverables and health_hints MUST be written in ${lang}
- DO NOT repeat existing roles: [ids]
```

**User prompt** · "Organización: <freeText> + projectMeta".

Total · ~180-250 tokens segons context.

**Strengths del minimal** ·
- ✅ Concís · permet al model usar els 1800 output tokens per pensament i no per parse setup
- ✅ Rules explicites i operacionals (NO ideològiques)
- ✅ Avoids "do not repeat existing roles" · evita duplicació real
- ✅ Adapta language dinàmicament (es/en)
- ✅ Mode "completar" si ja hi ha rols (NO regenerar tot)

**Weaknesses del minimal** ·
- ❌ NO injecta sector context · pot generar rols genèrics
- ❌ NO injecta domain pack (sports-team · etc) · perd context valuós
- ❌ NO obliga 60-70/30-40% tangibles/intangibles · pot generar tot tangible
- ❌ NO obliga castell_level · pot saltar nivells
- ❌ NO obliga ≥1 cicle recíproc · pot ser unidireccional

### C · Domain detector (v126/127) + sector agents (v131b/c)

**Strengths** ·
- 24 packs canonical (sports-team · arts-performance · coop-cares · health-clinic · etc) amb arquetip rich per nivell castell
- Detect via keyword + LLM fallback + multi-domain support
- 21 sectors CNAE canonical · skill_levels + sops_canonical per cada un
- Loader anti-contaminació (no injecta legacy-mismatch)

**Weaknesses** ·
- 🟡 El `buildSectorContextBlock` afegeix 200-500 chars al prompt · contribueix a inflació
- 🟡 NO tot prompt usa el sector agent (només `design-value-map-rich` v131b wire-up)
- 🟡 El bloc DOMINI DETECTAT i el CONTEXT SECTORIAL poden ser redundants si packs i sector mapegen al mateix domini

## Anàlisi · per què "Sugerir con IA" sembla millor a l'usuari

@alvaro va observar que el botó del `/map` genera output "superinteresant". Hipòtesi ·

### Factor 1 · Atenció del model
El model té un context window finit. Si dones 3500 chars system + 2000 chars context, en el moment de generar el JSON output ja ha "consumit" atenció en interpretar restriccions enlloc d'aplicar coneixement domini. **Less is more**.

### Factor 2 · Latency
Menys tokens input = resposta més ràpida = millor UX percebuda · l'usuari pensa "ha pensat menys i ha encertat" en comptes de "ha trigat 8s i ha donat un output llarg amb invariants".

### Factor 3 · Mode completar vs generar
El botó `/map · Sugerir con IA` té **mode CONTEXT-AWARE** · si ja hi ha rols, demana "afegeix els que falten" · evita repetir. La cadena expert NO té aquest mode (sempre regenera des de zero).

### Factor 4 · Less constraints = més creativitat
Quan dius al model "60-70% tangibles · 30-40% intangibles · ≥1 cicle recíproc · sense rols orfes", el model assigna recursos a satisfer aquestes restriccions enlloc de a aplicar la millor solució per al cas. Restriccions ben dosificades > restriccions exhaustives.

## Conclusions per a SOS V11 a alfa de creació de mapes de valor

### Què tenim sòlid (ja ALFA-ready)

✅ **Arquitectura** · expertChainOrchestrator + vnaExpertPrompts + domainDetector + sectorAgentLoader són solid · cap refactor major necessari
✅ **Knowledge canonical** · 21 sectors CNAE + 24 domain packs + skills marketplace + quality rubric
✅ **Output schema strict** · JSON parsejable · vàlid · compatible amb la cadena
✅ **Test harness** · `promptABTestService` permet validar empíricament millores

### Què falta per ser alfa-ready (gap analysis)

🟡 **Gap 1 · No tenim mesura empírica de qualitat A vs B** (20 casos benchmark amb LLM real)
🟡 **Gap 2 · El prompt REAL és inflat** (2477 tokens) · proposta · simplificar SYSTEM_BASE a ~1500 chars + mantenir invariants només a la verificació post-IA, no al prompt
🟡 **Gap 3 · El botó "Sugerir con IA" /map NO usa la cadena expert** · té el seu propi prompt curt · cal alinear-los (mateix backend, diferent UI mode)
🟡 **Gap 4 · No hi ha "mode completar"** a `runExpertChain` · si ja hi ha output parcial, hauria d'enriquir, no regenerar
🟡 **Gap 5 · No hi ha rubric output** post-IA · cal sumar al runExpertChain una crida `validateMapQuality(output)` que recompti % intangibles, cicles recíprocs, castell coverage · si <X, refà
🟡 **Gap 6 · No hi ha "creative-narrative" tier per a domain inference** · cas Forn Vall pot beneficiar-se d'un primer pas creatiu abans del rigorós

### Millores concretes proposades

#### v132c · Hybrid prompt strategy (TOP PRIORITAT)
1. **Simplificar `SYSTEM_BASE`** de 3500 a ~1500 chars · eliminar redundància entre principis i metodologia
2. **Treure invariants del prompt** (60-70% tangibles · etc) · validar-los **post-IA** amb `scoreOutput(output)` · si <70 score, refer amb prompt enriquit (escalation)
3. **Afegir "mode completar"** a `design-value-map-rich` · accepta `existingMap` · si present, prompt diu "afegeix EL QUE FALTA, no repeteixis"
4. **Alinear "Sugerir con IA" amb la cadena** · mateix backend, dos modes UX (quick vs deep)

#### v133 · Empirical validation
- Executar 20 casos benchmark amb LLM real
- Documentar findings a `docs/PROMPT-EFFICIENCY-LESSONS.md`
- Iterar SYSTEM_BASE segons evidence

#### v134 · UI A/B Lab a `/prompts-debug`
- Panel per a córrer A/B en viu
- Veure outputs costat a costat amb scores

## Recomanació estratègica per @alvaro

**Per a alfa pública v150 · necessitem ·**

1. ✅ **Mantenir l'arquitectura actual** (cadena 8 fases · packs · sectors)
2. 🔴 **Simplificar el SYSTEM_BASE** segons hipòtesi "menys context > més" (v132c)
3. 🔴 **Validació empírica** amb 20 casos (v133)
4. 🟡 **Mode completar** al `design-value-map-rich` (v132c)
5. 🟡 **Rubric post-IA** automàtic (v132c)
6. 🟢 **Continuar amb workstreams Stripe + crypto + LMS + UX** (no bloca creació mapes)

**Si v132c · v133 surten bé** (Variant B ≥ Variant A en ≥60% casos), el SOS V11 podrà declarar-se ALFA en creació de mapes de valor amb confiança ·
- Cost per mapa · ~0.0005€ (small-tier)
- Latency · <5s
- Qualitat · ≥75/100 score rubric automàtic
- Cobertura · 24 domain packs + 21 sectors CNAE

## Roadmap incremental v132c → v140

| Sprint | WO | Effort | Gain esperat |
|---|---|---:|---|
| v132c | wo-vna-prompt-slim · SYSTEM_BASE 3500→1500 chars + remove invariants from prompt + add scoreOutput post-IA escalation | L | ~50% cost reduction · qualitat ≥ actual |
| v132d | wo-vna-mode-completar · `design-value-map-rich` accepta `existingMap` · mode enrich vs generate | M | UX `/map · Sugerir con IA` viu a la cadena expert |
| v133 | wo-vna-benchmark-real · 20 casos benchmark amb LLM real · documentar findings | L | Evidència empírica per decisió final |
| v134 | wo-ab-lab-ui · panel /prompts-debug per a córrer A/B en viu | M | Power-users poden iterar prompts |
| v135 | wo-vna-rubric-auto · si scoreOutput < 70, escalation amb prompt enriquit | M | Garantia de qualitat mínima |

## Què falta analitzar i integrar (per a beta · post-alfa)

1. **Pre-thinking phase** · abans del `design-value-map-rich`, una crida small-tier que digui "què preguntaries a l'usuari per millorar el mapa?" · clarification questions
2. **Multi-turn conversational** · si la primera generació té gaps, segona crida per fer-los
3. **Embedding-based similarity** · si dos rols són massa similars (>0.85 cosine), fusionar-los
4. **Real-time co-creation** · l'usuari pot acceptar/rebutjar rol per rol · més control
5. **Cross-project pattern mining** · si 10 projectes sector M tenen tots un rol X, recomanar-lo en projecte 11 nou
6. **xAPI tracking de quality** · cada output mapeable a un xAPI statement · acumulem evidència
7. **Wiki community moderation** · arquetip "Doctor IA" arquetip publicable al permaweb · revisable

---

*Anàlisi v132b · creat 2026-05-19 com a base de criteri per a millorar la generació de mapes de valor abans de v150 alfa pública.*
