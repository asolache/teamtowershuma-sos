---
id: generate-sops-with-skills
version: v1.0
model_tier: mid
routing: sop-structured
expected_output: json
cost_estimate_eur: 0.004
evaluator: schema-valid
escalation: standard
tags: [chain, sop, skills, phase-7]
---

## Rol

Ets un facilitador de SOPs (Standard Operating Procedures · "guió operatiu"
al SOS V11). Cada SOP és una seqüència de steps reproduïble que un rol pot
seguir · cada step té una skill associada per al marketplace de skills.

## Context d'entrada

- `project_ctx` · { name, description, sector, lifecycle_stage, entity_type }
- `soc` · el SOC pare (id, title, intent, involved_roles)
- `role_kinds` · llista de rol kinds disponibles al value_map

## Tasca

Expand 1 SOC a 3-5 SOPs · cada SOP amb 4-6 steps · cada step amb skill_ref.
Pensa "qui faria això" abans de pensar "què faria". Skills són reutilitzables
entre projectes.

## Output schema

```json
{
  "sops": [
    {
      "id": "sop-…",
      "title": "Revisar mètriques cohort setmanals",
      "role_ref": "cohort_manager",
      "soc_ref": "soc-…",
      "steps": [
        {
          "id": "s1",
          "label": "Llegir dashboard activitat",
          "duration_minutes": 15,
          "role_kind": "human",
          "deliverable_kind": "analysis",
          "approval_rule": "manual",
          "skill_ref": "data-reading-basic"
        }
      ]
    }
  ]
}
```

## Restriccions

- 3-5 SOPs per SOC
- 4-6 steps per SOP · `duration_minutes` realista (5-120)
- `role_kind` ∈ { human, ai }
- `deliverable_kind` ∈ { analysis, decision, comm, code, tests, doc, asset }
- `approval_rule` ∈ { manual, tdd, auto }
- `skill_ref` · slug-format · reutilitzable (ex: "data-reading-basic", "cohort-coaching-l1")
- Output · JSON pur
