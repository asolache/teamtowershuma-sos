---
id: soc-lifecycle-idea
type: soc
phase: idea
version: v1
status: live
purpose: "Concepto canónico de la fase IDEA del ciclo de vida de un proyecto SOS. Roles mínimos · transacciones mínimas · output esperado · qué NO hacer."
keywords: [lifecycle, idea, mvp-prep, soc-seed, fase-1]
sos_context: foundational

outcomes:
  - "Founder ha articulado el problema (1 frase) + propuesta de valor (1 frase)"
  - "Validador externo (mentor · investor · primer cliente) ha confirmado interés (1 entrevista mínima)"
  - "Decisión clara · seguir a MVP o pivotar"

principles:
  - "Cap codi · cap diseño · només conversa"
  - "1 problema · 1 hipótesis · 1 test"
  - "Tiempo · 1-4 semanas · si pasa de 1 mes sin validador externo · revisa motivación"
  - "Output deliverable · canvas + pitch v1 (1 página cada uno)"

typical_roles:
  - id: founder
    castell_level: pom_de_dalt
    role: "Articula problema + hipótesis"
  - id: validator
    castell_level: laterals
    role: "Confirma o niega · mentor o primer cliente potencial"

typical_transactions:
  - from: founder
    to: validator
    deliverable: "Pitch v1 · 1 página o conversación 30min"
    type: tangible
    is_must: true
  - from: validator
    to: founder
    deliverable: "Feedback honesto · confirma o niega"
    type: intangible
    is_must: true

related_socs:
  - soc-lifecycle-mvp
  - soc-vna-network
---
