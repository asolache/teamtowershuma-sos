---
id: prompts-chain-plan
type: vision
version: v1
status: live
author: "@alvaro + claude · 2026-05-17"
purpose: "Pla canonical de la cadena de prompts IA del SOS V11 · ordre · responsabilitats · context · outputs · cost · per a anar de la fase idea al MVP automatitzat al Kanban en <90 segons · alfa-ready."
keywords: [prompts, ia, vna, verna-allee, automation, kanban, antigravity, kiss, dry]
sos_context: critical
scope: universal
---

# Cadena de prompts SOS V11 · pla expert

> **Context** · sessió 2026-05-17 (v118+v119) · @alvaro · "ahora esta fase de los prompts y llegar a la eficiencia top es mi maxima prioridad · si hacemos magia aqui lo siguiente es mas facil".
>
> **Objectiu** · transformar descripció vaga ("vull cooperativa cures") → projecte llest per executar al Kanban · en <90 segons · qualitat ≥85/100 · cost mínim per token.

---

## Filosofia · KISS · DRY · Antigravity

- **KISS** · cada prompt fa UNA cosa molt bé · output mínim que respon
- **DRY** · SYSTEM_BASE conté els principis · els task-prompts NO els repeteixen
- **Antigravity** · cada SOP step convertible a WO · IA fa el que pot · humans NOMÉS intangibles

---

## La cadena · 7 fases de la creació legendària

```
[USER INPUT vague]
      │
      ▼
┌────────────────────────────────────────────────────────────┐
│ 1 · define-product-service                                 │
│   identifica el producte/servei central                    │
│   output · { name, kind, audience, valueProposition,       │
│            differentiator, revenueModel, deliveryRhythm }  │
│   cost · 1 IA call · ~0.001€                               │
└────────────────────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────────────┐
│ 2 · personalize-canvas (IKIGAI)                            │
│   loves · goodAt · worldNeeds · paidFor + productService    │
│   output · { ikigai{4 dims}, vision, mission, values,      │
│              stakeholders, northStar, productService }     │
│   cost · 1 IA call · ~0.002€                               │
└────────────────────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────────────┐
│ 3 · personalize-pitch                                       │
│   business plan + MVP focus per fase                       │
│   output · { headline, problem, solution, market,          │
│              business, team }                              │
│   cost · 1 IA call · ~0.002€                               │
└────────────────────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────────────┐
│ 4 · personalize-landing                                     │
│   narrativa pública · diferencial · roadmap                │
│   output · { hero, differentiator, howItWorks,             │
│              socialProof, roadmap{now/next/later}, faq }   │
│   cost · 1 IA call · ~0.003€                               │
└────────────────────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────────────┐
│ 5 · design-value-map-RICH ★★★                              │
│   pensar profundament (THINK STEP-BY-STEP)                 │
│   input ric · canvas + pitch + product + sector + zoom     │
│   output · {                                               │
│     roles[] amb level macro/meso/micro,                    │
│     deliverables[] amb nom de domini,                      │
│     transactions[] amb 60-70% tangibles + 30-40% intang,   │
│     ≥1 cicle recíproc, patterns_detected[]                 │
│   }                                                         │
│   cost · 1 IA call · ~0.008€ · MÉS LLARG · usar reasoner   │
└────────────────────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────────────┐
│ 6 · generate-socs-from-value-map                           │
│   SOCs derivats del mapa (no del knowledge prefab)         │
│   input · value_map del pas 5                              │
│   output · socs[] amb { name, purpose, phase, level,       │
│            outcomes, checklist[{ verification_kind }] }    │
│   cost · 1 IA call · ~0.003€                               │
└────────────────────────────────────────────────────────────┘
      │
      ▼ (paral·lel · 1 call per SOC)
┌────────────────────────────────────────────────────────────┐
│ 7 · generate-sops-with-skills                              │
│   SOPs amb SKILLS associades per cada step (clau SOS)      │
│   input · soc + role_kinds + sector_role_examples + skills │
│   output · sops[] amb {                                    │
│     title, role_ref, soc_item_ref,                         │
│     steps[{ label, deliverable_kind, approval_rule,        │
│             role_kind, duration_minutes, skills[] }]       │
│   }                                                         │
│   cost · 0.002€ per SOC × N SOCs                           │
└────────────────────────────────────────────────────────────┘
      │
      ▼ (paral·lel · 1 call per SOP)
┌────────────────────────────────────────────────────────────┐
│ 8 · generate-wos-from-sop                                   │
│   Work Orders executables ARA mateix al Kanban             │
│   output · wos[] amb { title, dtd_test, estimated_hours,   │
│            assignee_role, sop_ref, step_refs }             │
│   cost · 0.001€ per SOP × N SOPs                           │
└────────────────────────────────────────────────────────────┘
      │
      ▼
[KANBAN AMB WOs LLESTS PER EXECUTAR]
[CANVAS + PITCH + LANDING PUBLICATS]
[MAPA DE VALOR + SOCs + SOPs AL KB]
```

## Cost total estimat

| Ambition | Calls | Cost (~) | Temps |
|---|---|---|---|
| light | 4-5 calls (skip landing + WOs) | ~0.010€ | 8-15s |
| standard | 6-7 calls (skip WOs) | ~0.018€ | 15-30s |
| max | 8-10 calls (tot) | ~0.030€ | 30-60s |

---

## Vocabulary canonical (la IA HA D'ENTENDRE-HO)

### SOC · Standard Operating CONCEPT
**Què** · l'INVARIANT del procés. Què cal i per què.
**No és** · una llista de tasques · ni una descripció d'un departament.
**És** · un snapshot versionat dels OUTCOMES desitjats + checklist d'ESTATS verificables.
**Exemple** · "Cicle setmanal cohort-coordinadora" amb checklist:
- "Acta sessió signada per tots els socis presents"
- "KPIs cohort actualitzats a /quality"
- "Pròxima sessió convocada amb ≥3 dies d'antelació"

### SOP · Standard Operating PROCEDURE
**Què** · el COM concret. Els passos ordenats per aconseguir un outcome del SOC.
**No és** · un work order (és la plantilla · no la instància).
**És** · seqüència de steps · cada step és convertible a Work Order.
**Format** · cada step té · {label, deliverable_kind, approval_rule, role_kind, duration_minutes, skills[]}

### WO · Work Order
**Què** · la INSTÀNCIA executable ARA mateix · una tasca concreta al Kanban.
**Inclou** · DTD test booleà · assignee role · estimated hours · creat per algú · resolt per algú.
**Cicle** · pending → claimed → in-progress → done (verifier signs) → ledgered (cost recorded).

---

## Decisions de disseny

### Per què SOCs DERIVATS del value_map (pas 6) en lloc de pickSocs del knowledge?

El knowledge té SOCs prefabricats útils (lifecycle/idea.md · sectors/M.md · etc.) però **són genèrics per sector** · no específics del projecte.

Quan tenim un value_map ric del PROJECTE concret · derivar els SOCs d'aquí dóna processos més precisos. El knowledge SOC pickup queda com a fallback (`classify-and-pick-socs`) per a projectes light o sense IA.

### Per què SKILLS associades als SOPs (pas 7)?

@alvaro · "clau per mejorar el uso de skills en SOS".

Cada step de SOP ha de dir QUINES skills necessita (de `/skills` catàleg). Això permet ·
- **Matchmaking** · al Kanban · suggeriment d'assignee basat en skills declarades a /me
- **Learning paths** · l'usuari veu què li falta aprendre per fer un WO
- **Skills market** · monetitzar skills · permet swarm matchmaking

### Per què DEEP THINKING al pas 5?

El mapa de valor és el cor de tot. Si surt mediocre · tot el demés és mediocre. Per això ·
- THINK STEP-BY-STEP guidance al prompt (sense mostrar el procés · només output)
- Usar model `reasoner` quan possible (deepseek/r1 · anthropic/opus-4.7)
- 1 call DENSA en lloc de 5 calls superficials
- Input ric · canvas + pitch + product + sector + zoom · ja precomputats

---

## Implementació actual (status)

| Task | Estat | TDD |
|---|---|---|
| `enrich-value-map` (legacy) | ✅ live | ✅ |
| `personalize-canvas` | ✅ live · ikigai + productService (v118+) | ✅ |
| `personalize-pitch` | ✅ live · adapta per fase | ✅ |
| `personalize-landing` | ✅ live · NOU (v119) | ✅ |
| `expand-sop` | ✅ live · legacy | ✅ |
| `generate-soc` | ✅ live · legacy | ✅ |
| `classify-and-pick-socs` | ✅ live · knowledge pickup (v100) | ✅ |
| `generate-sops-from-soc` | ✅ live · sector aware (v116) | ✅ |
| `generate-wos-from-sop` | ✅ live · DTD test (v100) | ✅ |
| `define-product-service` | ✅ live · NOU (v119) | ✅ |
| `design-value-map-rich` | ✅ live · NOU (v119) · deep thinking | ✅ |
| `generate-socs-from-value-map` | ✅ live · NOU (v119) | ✅ |
| `generate-sops-with-skills` | ✅ live · NOU (v119) | ✅ |

## Pendents (no en aquest PR)

- `wo-orchestrator-expert-chain` · orchestrator que encadeni tots 8 passos en lloc del flow actual (que salta el pas 1-4 si es ai-driven)
- `wo-prompt-router-by-tier` · usar `reasoner` per design-value-map · `mid` per la resta · `small` per landing
- `wo-skills-catalog-link` · enriquir skill catalog SOS perquè generate-sops-with-skills tingui millor input
- `wo-prompt-eval-loop` · evaluador automàtic post-call · re-intent si rejected

---

## Per a properes iteracions

Cada vegada que iteris els prompts ·
1. **Llegeix aquest doc** abans de canviar res
2. **Mira `/prompts-debug`** · veu el prompt en viu amb context editable
3. **Mantén KISS · DRY · Antigravity** com a checklist
4. **Updata aquest doc** si afegeixes una nova fase a la cadena

> "Si fem màgia aquí · el següent és més fàcil." — @alvaro
