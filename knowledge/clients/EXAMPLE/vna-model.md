---
project_name: "EXAMPLE Client · Cooperativa demo"
client_id: example
sector_id: N
sector_name: "Consultoría / Actividades Profesionales"
cnae: N
version: v0.1
status: fixture
keywords: [example, fixture, demo, cooperativa]

roles:
  - id: founder
    name: "Founder · Director ejecutivo"
    description: "Sostiene la responsabilidad ética y estratégica del proyecto"
    castell_level: pom_de_dalt
    typical_actor: "founder humano"
    tags: [founder, strategy]
  - id: operations
    name: "Operations · PM"
    description: "Coordina ejecución diaria · prioriza · resuelve bloqueos"
    castell_level: tronc
    typical_actor: "PM o jefe operativo"
    tags: [pm, execution]
  - id: creator
    name: "Creator · Maker"
    description: "Produce los entregables operativos del cliente"
    castell_level: pinya
    typical_actor: "técnico junior/senior"
    tags: [maker, delivery]

transactions:
  - id: tx-strategy
    from: founder
    to: operations
    deliverable: "Strategy + prioridades trimestrales"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Si falla · operations sin norte · derrames presupuesto"
  - id: tx-plan
    from: operations
    to: creator
    deliverable: "Plan semanal con tareas asignadas"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Si falla · creator sin claridad · re-trabajo"

socs:
  - "soc-vna-network"
  - "soc-teamtowers-brand"

notes: |
  Este es un fixture de referencia. Para crear un cliente real:
  1. Copia esta carpeta a `clients/{tu-client-id}/`
  2. Edita el frontmatter con el sector + roles del cliente
  3. Añade SOCs/SOPs específicos a `socs/` y `sops/`
  4. Si el cliente acumula skills · `skills/{handle}.md`
---
