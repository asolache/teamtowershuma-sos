# Audit · creació de projecte · "que parezca magia"

Sessió audit · 2026-05-16 · respon al feedback de l'usuari ·
> "que el crear projecte sigui un mapa de valor i uns continguts que
> semblin màgia · reflectir la realitat del flux de valor si
> l'organització existeix · o definir el flux de valor dels processos
> per poder automatitzar la generació i execució de work orders amb
> sistema antigravity de màxima qualitat amb cost òptim de tokens."

## 1 · Estat actual del flow (post-v95)

| Etapa | Servei | Output garantit |
| --- | --- | --- |
| Classify | `projectClassifierService` (IA) | type · stage · scale · dependency_type |
| Seed | `projectTemplateCatalog.pickTemplate` | 1 dels 2 templates MVP (founder-coop · default-balanced) amb 100/100 rubric sense IA |
| Personalize | `applyContext` + opcional IA via `vnaExpertPrompts` | placeholders resolts amb name/sector/problem |
| Validate | `valueFlowRubricService` (12 criteris) + `valueFlowIntegrityService` (7 regles) | score ≥85 garantit + 0 errors cross-layer |
| Persist | KB.upsert + store.dispatch | project + roles + sops + socs nodes |

## 2 · Què té de "magia" ja

✅ **score 100/100 rubric mesurable** · cada projecte arriba a gold
✅ **0 errors integrity** · cross-layer validat (R1-R7)
✅ **6 nivells casteller** als rols (post-v92)
✅ **SOC sequencing automàtic** · agrupa transactions en processos amb checklist (post-v93)
✅ **Mètriques Lean** · lead_time · cycle_time · WIP per transaction (template default)
✅ **Mix tangible/intangible** · cicles recíprocs · cap rol orfe
✅ **Templates ja tenen** · canvas (vision · mission · values · stakeholders · north-star) · pitch (6 seccions) · workshops · SOPs amb steps estructurats

## 3 · Què FALTA per a "màgia plena"

### 3.1 · Manifest IA com a "Agent SOS V11" (post-v96 · aquesta sessió)
- ✅ Manifest expandit · 4 missions · 6 principis · context CNAE · output esperat clar
- ⏳ Pendent · few-shot examples més rics (3-5 casos canònics enlloc de 2)

### 3.2 · Adaptació CNAE als rols
- 🔍 Tenim · `js/core/cnaeSeed.js` (CNAE_SEED · searchCnae · getCnae) + `sectorSubtypes.js`
- ⏳ Pendent · al pas `personalize` · si projecte té sector amb CNAE conegut · usa nomenclatura oficial per als roles. Ex · sector "agricultura" → CNAE 01 → rols "agrícola" enlloc de "creator"
- 🔧 WO · `wo-cnae-role-adaptation-001` · M · 3€

### 3.3 · Mapa de valor per FASE del projecte
- 🔍 Tenim · 1 mapa global (roles · transactions · processos)
- ⏳ Pendent · mapa per FASE del cicle de vida (idea · MVP · validation · scale)
  - Fase "idea" · roles light (founder · validator) · poques transactions
  - Fase "MVP" · afegeix maker · reviewer · primeres transactions tangibles
  - Fase "scale" · afegeix cohort manager · facilitator · transactions Lean completes
- 🔧 WO · `wo-phase-aware-value-map-001` · L · 6€

### 3.4 · TDD per a SOP automatitzable
- 🔍 Tenim · SOP amb `steps[].deliverable_kind` + `approval_rule`
- ⏳ Pendent · cada step amb `tdd_test` (booleà · "si retorna true · automatitzable per IA"). Si tots steps tdd_test=true · SOP es pot executar com a WO autònom.
- 🔧 WO · `wo-sop-tdd-automation-001` · M · 4€

### 3.5 · Cost tracking automàtic a contabilitat SOS
- 🔍 Tenim · `iaContextAuditor` (post-v94 · audit ledger en memòria)
- ⏳ Pendent · cada `audit()` també escriu al `ledger_entry` del KB · `to=projectId` · `category='ia-cost'` · amount = costActualEur. Així cada cost IA va a la contabilitat del projecte o persona.
- 🔧 WO · `wo-ia-cost-to-ledger-001` · S · 2€

### 3.6 · Audit mode UI · "veure què fa la IA"
- ⏳ Pendent · vista `/audit-ia` o tab a SettingsV2 que mostra:
  - Llistat última N crides IA (timestamp · source · prompt size · cost · cache hit)
  - Top sources amb més cost setmanal
  - Cache miss rate per source (alerta si <50%)
  - Duplicats detectats (oportunitat de cache)
- 🔧 WO · `wo-audit-ia-view-001` · M · 4€

### 3.7 · Output del personalize amb camps rics
- 🔍 Tenim · canvas + pitch al template (estructura mínima)
- ⏳ Pendent · al pas IA personalize · enriqueix:
  - Canvas · descripció rica de vision/mission · roadmap 3 mesos
  - Pitch · narrativa storytelling · diferencial vs competència · TAM/SAM/SOM
  - Landing · "presentation_narrative_v1" més detallat (300-500 paraules)
- 🔧 WO · `wo-personalize-rich-output-001` · L · 5€

## 4 · Pla d'execució recomanat (camí màgia)

| Ordre | WO | Cost | Impacte |
| --- | --- | ---: | --- |
| 1 | `wo-ia-cost-to-ledger-001` | 2€ | Cost tracking automatic · visibilitat usuari |
| 2 | `wo-cnae-role-adaptation-001` | 3€ | Roles amb nomenclatura sectorial oficial |
| 3 | `wo-sop-tdd-automation-001` | 4€ | SOP automatitzables · Antigravity ready |
| 4 | `wo-audit-ia-view-001` | 4€ | Vista observabilitat IA |
| 5 | `wo-phase-aware-value-map-001` | 6€ | Mapa de valor per fase projecte |
| 6 | `wo-personalize-rich-output-001` | 5€ | Output IA enriquit (canvas · pitch · landing) |
| **Total** | | **24€** | **camí complet "màgia plena"** |

## 5 · Mètrica d'èxit "magia"

Un projecte creat al `/create` ha de tenir, sense intervenció humana addicional:
- ✅ Score rubric ≥85 (gold) · garantit per templates
- ✅ Integrity 0 errors · garantit per templates
- 🆕 Roles amb nomenclatura CNAE quan aplicable
- 🆕 Canvas + pitch + landing amb >300 paraules d'output IA
- 🆕 SOPs amb tdd_test marcats · ≥50% automatitzables
- 🆕 SOC per cada fase del cicle · checklist sop_refs
- 🆕 Cost IA total <0.05€ per ambition=max · auditable a `/audit-ia`
- 🆕 Costos IA llegits al ledger del projecte automàticament

Quan l'usuari vegi el seu projecte recém creat · ha de pensar · "wow · això reflecteix la realitat del meu cas · i puc executar work orders demà mateix".

---
**Status sessió actual** · v96 (manifest IA · default provider selector · audit doc) afegeix les bases. WOs concretes anteriors al backlog per a sessions properes.
