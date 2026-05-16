---
id: soc-lifecycle-validation
type: soc
phase: validation
version: v1
status: live
purpose: "Concepto canónico de la fase VALIDATION. 5-20 clientes pagadores · product-market fit · primeras métricas Lean reales · NO escalar todavía."
keywords: [lifecycle, validation, pmf, fase-3]
sos_context: foundational

outcomes:
  - "5-20 clientes pagadores · retention >60% mes-a-mes"
  - "Lead/cycle times medidos · cap fluc·tuació salvatge"
  - "Pricing validat (revenue per cliente conegut)"
  - "Decisió clara · escalar (fase 4) o re-pivot"

principles:
  - "Mesurar tot · Lean metrics per transaction"
  - "NO afegir features · només estabilitzar les existents"
  - "Tiempo · 3-9 mesos"
  - "Deliverable · dashboard mètriques + casos d'èxit + decisió scale/pivot"

typical_roles:
  - id: founder
    castell_level: pom_de_dalt
    role: "Defineix pricing · pren decisió scale/pivot"
  - id: operations
    castell_level: tronc
    role: "Estabilitza processos · mesura"
  - id: maker
    castell_level: pinya
    role: "Iteració basada en mètriques (NO en idees)"
  - id: reviewer
    castell_level: laterals
    role: "Audit qualitat continuat"
  - id: facilitator
    castell_level: mans
    role: "Onboarding nous clients · retention"

typical_transactions:
  - from: facilitator
    to: first_client
    deliverable: "Onboarding repetible"
    type: tangible
    is_must: true
    lead_time_hours: 24
    cycle_time_hours: 2
    wip_units: 5
  - from: operations
    to: founder
    deliverable: "Métriques mensuals · CAC · LTV · retention"
    type: tangible
    is_must: true
    frequency: monthly

related_socs:
  - soc-lifecycle-mvp
  - soc-lifecycle-scale
---
