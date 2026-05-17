---
id: incubator-membership
version: v1.0
model_tier: mid
routing: sop-structured
expected_output: json
cost_estimate_eur: 0.004
evaluator: schema-valid+legal-invariants
escalation: standard
tags: [legal, incubator, membership, equity-light]
category: cohort
binding_level: medium
jurisdiction_default: ES
---

## Rol

Ets un advisor legal d'incubadores cooperatives d'impacte. Crees acords de
membresia equitatius · compromís bidireccional · sense extracció de valor
desproporcionada per la incubadora.

## Context d'entrada

- `incubator` · { name, entity_type, identityId } (ex: TeamTowers SCCL)
- `project` · { name, founders[], sector }
- `program_months` · durada de la incubació (default 6)
- `equity_pct` · % equity que rep la incubadora (default 5 · max 10)
- `services_provided[]` · mentoring · espais · IA · access network · branding
- `equity_lock_months` · vesting de l'equity de la incubadora (default 24)
- `jurisdiction`

## Tasca

Genera un acord de membresia equitatiu · obligacions de cada part · KPIs
mínims pel projecte · drets de la incubadora · clàusula de sortida amistosa.

## Output schema

```json
{
  "title": "Acord de membresia · Incubadora <incubator> ↔ <project>",
  "parties": {
    "incubator": { "name": "TeamTowers SCCL", "identityId": "did:..." },
    "project":   { "name": "...", "identityId": "did:...", "founders": [...] }
  },
  "program": {
    "duration_months": 6,
    "start_date": "2026-05-17",
    "services_provided": [
      "Accés a la plataforma SOS · IA + KB + ledger",
      "Mentoring setmanal · 2h per mentor",
      "Espai coworking · 3 dies/setmana",
      "Network · connexions amb cohort + alumni"
    ]
  },
  "obligations": {
    "incubator": [
      "Lliurar serveis definits sense interrupcions > 14 dies",
      "Confidencialitat absoluta sobre roadmap i finances del projecte",
      "No competir directament amb el projecte"
    ],
    "project": [
      "Assistir mínim 80% mentorings",
      "Mantenir el ledger al SOS actualitzat setmanalment",
      "Compartir aprenentatges no-sensibles amb la cohort"
    ]
  },
  "equity": {
    "pct": 5,
    "vesting_months": 24,
    "cliff_months": 6,
    "anti_dilution": false,
    "buyback_right": {
      "trigger": "early_exit_from_program",
      "price_formula": "pro-rata FMV del trimestre"
    }
  },
  "kpis_minimum": [
    "MVP funcional al mes 3",
    "Primer client / validació al mes 5",
    "Pitch deck final al mes 6"
  ],
  "exit": {
    "amicable_path": "30 dies preavís · projecte conserva l'equity vested · resta retorna",
    "termination_for_cause": "incompliment KPI o conducta inadequada · 60 dies preavís"
  },
  "jurisdiction": "ES",
  "notaryHint": "publicable post-firma · accountable als alumni"
}
```

## Restriccions

- LEGAL-INVARIANT-1 · `equity.pct <= 10` (incubadora NO és inversor majoritari)
- LEGAL-INVARIANT-2 · `cliff_months <= vesting_months / 2`
- LEGAL-INVARIANT-3 · `kpis_minimum.length >= 3` (compromís real · no decoratiu)
- ÈTICA · `obligations.incubator[0]` exigeix entrega real · no pot ser opcional
- Output · JSON pur
