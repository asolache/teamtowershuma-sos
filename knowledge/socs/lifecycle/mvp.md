---
id: soc-lifecycle-mvp
type: soc
phase: mvp
version: v1
status: live
purpose: "Concepto canónico de la fase MVP del ciclo de vida. Producto mínimo · 1 cliente real pagador (o equivalente intangible) · primera transacción tangible cerrada."
keywords: [lifecycle, mvp, fase-2, validation-prep]
sos_context: foundational

outcomes:
  - "MVP entregable a un cliente real (no demo)"
  - "≥1 transacción tangible completada (pago · entrega · uso)"
  - "Feedback documentado · 3 mejoras priorizadas"

principles:
  - "Mínimo viable · NO mínimo viable + 10%"
  - "1 problema bien resuelto > 5 problemas malament resolts"
  - "Tiempo · 2-3 meses · si pasa de 6 sin cliente · pivote forzoso"
  - "Deliverable · prototipo + 1 caso de uso real + ledger entry"

typical_roles:
  - id: founder
    castell_level: pom_de_dalt
    role: "Mantiene visión · prioriza"
  - id: maker
    castell_level: pinya
    role: "Construye MVP · iteración rápida"
  - id: reviewer
    castell_level: laterals
    role: "Valida calidad · feedback inmediato"
  - id: first_client
    castell_level: mans
    role: "Externalo · valida en real"

typical_transactions:
  - from: maker
    to: first_client
    deliverable: "MVP entregable usable"
    type: tangible
    is_must: true
  - from: first_client
    to: maker
    deliverable: "Pago o equivalente · feedback estructurado"
    type: tangible
    is_must: true
  - from: reviewer
    to: founder
    deliverable: "Reporte calidad + 3 mejoras priorizadas"
    type: intangible
    is_must: true

related_socs:
  - soc-lifecycle-idea
  - soc-lifecycle-validation
---
