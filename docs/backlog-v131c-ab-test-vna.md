# Backlog · A/B test prompt VNA · cas "Sugerir con IA" a /map (@alvaro)

## Context · què cal aprendre

@alvaro va observar que el botó **"Sugerir con IA"** a `/map?project=...` (que obre una finestra de context contextual mid-modal) **genera output de molt bona qualitat** ·
- Crea rols i transaccions "superinteresantes"
- Concís però amb sentit
- Adapta al projecte sense excés de boilerplate

Mentre que el flux actual de **creació de projecte expert chain** (8 fases · `runExpertChain` · v121) potser **ofereix massa context** a la IA i això pot diluir la qualitat.

**Hipòtesi a validar** · "menys context ben enfocat > més context exhaustiu"

## Què hem de construir · sprint v132 (backlog · no inclós a v131c)

### A · Agent A/B comparator · `js/core/promptABTestService.js`

Pure async helper que ·

1. Pren `{ projectId, projectContext }` com a entrada
2. Genera 2 prompts en paral·lel ·
   - **Variant A** · prompt complet actual `vnaExpertPrompts.design-value-map-rich` (system 3500+ chars · context inflat · domainDetection + sectorContext)
   - **Variant B** · prompt minimalista estil "Sugerir con IA" (system curt · només name+description+sector+vna_zoom · sense few-shot)
3. Crida la mateixa IA amb ambdós (preferentment small-tier per a baix cost)
4. Calcula mètriques · tokens out · cost · diversitat rol kinds · % transaccions intangibles · alineació a domain pack (si match)
5. Persisteix resultat al KB tipus `prompt_ab_test_result` per a anàlisi posterior

### B · UI · panel "A/B Lab" a `/prompts-debug`

Nova pestanya al `/prompts-debug` (v127) ·
- Selector projecte de mostra (o entrada manual name/description/sector)
- Botó "Run A/B test"
- Resultat costat per costat · 2 outputs JSON · 2 mètriques · 2 costos
- Toggle "veure prompts complets"
- Save · "Aquest cas amb guanyador B → registra al benchmark dataset"

### C · Inspeccionar el codi del botó "Sugerir con IA"

Investigar a `js/views/ValueMapView.js` quin prompt usa exactament el botó "Sugerir con IA". Hipòtesi · usa un prompt molt més curt + temperature alta + cap few-shot. Documentar a `docs/PROMPT-EFFICIENCY-LESSONS.md`.

### D · Benchmark dataset · 20 casos seed

Crear `knowledge/benchmarks/vna-quality-cases.json` amb 20 casos reals (futbol · cooperativa cures · maker space · etc.) i expected output qualitatiu. Servir com a regression suite per a iteracions futures de prompts.

### E · Tests + dashboard mètriques

- `promptABTest.test.js` · valida que el comparator no llança · genera mètriques · persisteix KB
- Dashboard simple a `/prompts-debug?tab=ab-lab` amb historial dels últims 30 tests (win rate per variant)

## Lliçons que volem extreure

| Pregunta | Mètrica per a validar |
|---|---|
| Massa context contamina? | Variant B (curt) ≥ Variant A (llarg) en ≥60% casos |
| Few-shot ajuda o satura? | Eliminar few-shot ⇄ canvi diversitat output |
| Domain pack injection val la pena? | Casos amb domain pack vs sense · qualitat percebuda |
| Sector context (v131b) val la pena? | Casos sectors canonical vs altres · score rubric |
| Temperature alta = més creativitat útil? | T=0.4 vs T=0.7 vs T=0.9 · score humà |

## Pla d'execució v132 (next sprint · ~2 dies)

1. Inspeccionar codi "Sugerir con IA" → entendre el prompt exacte
2. Construir `promptABTestService.js` amb 2 variants
3. Generar 5 casos test ràpids
4. UI panel "A/B Lab" a `/prompts-debug`
5. Documentar findings → ajustar `vnaExpertPrompts.js` segons evidencia

## KISS principle

NO hem d'optimitzar el prompt actual abans de tenir mètriques. Primer mesurar · després iterar. El cas "Sugerir con IA" funciona bé · per què? Cal mesurar-ho per saber-ho · no especular.
