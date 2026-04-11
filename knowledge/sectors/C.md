---
sector_id: C
sector_name: "Industria Manufacturera"
sector_name_en: "Manufacturing"
cnae: "10-33"
version: "v11.1"
tags: ["manufactura", "produccion", "industria", "fabrica", "operaciones"]

roles:
  - id: plant_director
    name: "Director de Planta"
    name_en: "Plant Director"
    description: "Responsable máximo de producción, costes y seguridad de la instalación fabril."
    description_en: "Overall responsible for production output, costs, and plant safety."
    castell_level: pom_de_dalt
    fmv_usd_h: 85
    typical_actor: "Ingeniero industrial senior con P&L propio"
    typical_actor_en: "Senior industrial engineer with own P&L"
    tags: ["liderazgo", "operaciones", "planta"]

  - id: production_manager
    name: "Jefe de Producción"
    name_en: "Production Manager"
    description: "Planifica y supervisa líneas de producción, turnos y OEE. Nexo entre planta y dirección."
    description_en: "Plans and supervises production lines, shifts and OEE. Bridge between shop floor and management."
    castell_level: tronc
    fmv_usd_h: 55
    typical_actor: "Técnico de operaciones con experiencia en lean"
    typical_actor_en: "Operations technician with lean experience"
    tags: ["produccion", "lean", "turnos"]

  - id: quality_manager
    name: "Responsable de Calidad"
    name_en: "Quality Manager"
    description: "Gestiona el sistema de calidad (ISO 9001), auditorías y no conformidades. Voz del cliente en planta."
    description_en: "Manages the quality system (ISO 9001), audits and non-conformities. Customer voice on the floor."
    castell_level: tronc
    fmv_usd_h: 52
    typical_actor: "Ingeniero con certificación Six Sigma o similar"
    typical_actor_en: "Engineer with Six Sigma certification or equivalent"
    tags: ["calidad", "ISO", "no-conformidades"]

  - id: maintenance_tech
    name: "Técnico de Mantenimiento"
    name_en: "Maintenance Technician"
    description: "Ejecuta mantenimiento preventivo y correctivo de maquinaria. Clave para minimizar paradas no planificadas."
    description_en: "Executes preventive and corrective machinery maintenance. Key to minimizing unplanned downtime."
    castell_level: pinya
    fmv_usd_h: 28
    typical_actor: "FP II electromecánica o mecatrónica"
    typical_actor_en: "Vocational diploma in electromechanics or mechatronics"
    tags: ["mantenimiento", "maquinaria", "paradas"]

  - id: process_engineer
    name: "Ingeniero de Procesos"
    name_en: "Process Engineer"
    description: "Optimiza procesos productivos, reduce desperdicios y lidera proyectos de mejora continua (Kaizen, SMED)."
    description_en: "Optimizes production processes, reduces waste and leads continuous improvement projects (Kaizen, SMED)."
    castell_level: tronc
    fmv_usd_h: 58
    typical_actor: "Ingeniero industrial o químico con perfil analítico"
    typical_actor_en: "Industrial or chemical engineer with analytical profile"
    tags: ["procesos", "mejora-continua", "kaizen"]

  - id: supply_chain
    name: "Responsable de Cadena de Suministro"
    name_en: "Supply Chain Manager"
    description: "Gestiona aprovisionamiento, relación con proveedores y planificación de materiales (MRP)."
    description_en: "Manages procurement, supplier relationships and materials planning (MRP)."
    castell_level: tronc
    fmv_usd_h: 54
    typical_actor: "Especialista en logística y compras industriales"
    typical_actor_en: "Logistics and industrial procurement specialist"
    tags: ["suministro", "MRP", "proveedores"]

  - id: operator
    name: "Operario de Producción"
    name_en: "Production Operator"
    description: "Ejecuta las operaciones de fabricación según instrucciones de trabajo. Columna vertebral del proceso productivo."
    description_en: "Executes manufacturing operations per work instructions. Backbone of the production process."
    castell_level: pinya
    fmv_usd_h: 18
    typical_actor: "Operario polivalente formado en puesto"
    typical_actor_en: "Multi-skilled operator trained on the job"
    tags: ["produccion", "operaciones", "linea"]

  - id: hse_officer
    name: "Técnico de PRL y Medio Ambiente"
    name_en: "HSE Officer"
    description: "Asegura el cumplimiento normativo en prevención de riesgos laborales y gestión ambiental (ISO 14001)."
    description_en: "Ensures regulatory compliance in occupational risk prevention and environmental management (ISO 14001)."
    castell_level: tronc
    fmv_usd_h: 42
    typical_actor: "Técnico superior PRL con máster en medioambiente"
    typical_actor_en: "Senior HSE technician with environmental management master's"
    tags: ["PRL", "seguridad", "medioambiente"]

  - id: r_and_d
    name: "I+D / Desarrollo de Producto"
    name_en: "R&D / Product Development"
    description: "Diseña y valida nuevos productos o mejoras de producto existente. Conecta mercado con capacidad fabril."
    description_en: "Designs and validates new products or improvements to existing ones. Bridges market needs with factory capabilities."
    castell_level: tronc
    fmv_usd_h: 62
    typical_actor: "Ingeniero de diseño o laboratorio de ensayos"
    typical_actor_en: "Design engineer or testing laboratory professional"
    tags: ["innovacion", "producto", "desarrollo"]

  - id: customer_service_b2b
    name: "Atención al Cliente B2B"
    name_en: "B2B Customer Service"
    description: "Gestiona pedidos, incidencias y comunicación con clientes industriales. Interface entre planta y cliente final."
    description_en: "Manages orders, incidents and communication with industrial customers. Interface between plant and end customer."
    castell_level: pinya
    fmv_usd_h: 24
    typical_actor: "Comercial interno o técnico de back-office industrial"
    typical_actor_en: "Inside sales or industrial back-office technician"
    tags: ["cliente", "pedidos", "B2B"]

transactions:
  - id: tx_c01
    from: supply_chain
    to: operator
    deliverable: "Materias primas y componentes en línea"
    deliverable_en: "Raw materials and components at line"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Si hay roturas de stock frecuentes, revisar MRP y fiabilidad de proveedores"

  - id: tx_c02
    from: operator
    to: production_manager
    deliverable: "Partes diarios de producción y registro de incidencias"
    deliverable_en: "Daily production reports and incident log"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Los partes incompletos son señal de falta de cultura de datos en planta"

  - id: tx_c03
    from: production_manager
    to: plant_director
    deliverable: "KPIs OEE, merma y cumplimiento de plan"
    deliverable_en: "OEE, waste and production plan compliance KPIs"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "OEE < 65% indica urgencia en mejora de mantenimiento o procesos"

  - id: tx_c04
    from: quality_manager
    to: production_manager
    deliverable: "Órdenes de retrabajo y no conformidades detectadas"
    deliverable_en: "Rework orders and detected non-conformities"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Alta frecuencia de retrabajos indica problema de proceso, no de personas"

  - id: tx_c05
    from: maintenance_tech
    to: production_manager
    deliverable: "Estado de equipos y registro de intervenciones"
    deliverable_en: "Equipment status and maintenance intervention log"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "MTTR elevado indica falta de repuestos críticos o documentación de máquina"

  - id: tx_c06
    from: process_engineer
    to: operator
    deliverable: "Instrucciones de trabajo actualizadas (SOP)"
    deliverable_en: "Updated work instructions (SOP)"
    type: tangible
    is_must: true
    frequency: baja
    health_hint: "SOPs desactualizados generan variabilidad y accidentes"

  - id: tx_c07
    from: process_engineer
    to: production_manager
    deliverable: "Proyectos de mejora con impacto en OEE o coste"
    deliverable_en: "Improvement projects with OEE or cost impact"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "Sin pipeline de mejora la planta pierde competitividad año a año"

  - id: tx_c08
    from: r_and_d
    to: production_manager
    deliverable: "Especificaciones técnicas de nuevo producto para producción piloto"
    deliverable_en: "Technical specifications of new product for pilot production"
    type: tangible
    is_must: false
    frequency: baja
    health_hint: "Si I+D no involucra a planta en diseño se generan productos difíciles de fabricar"

  - id: tx_c09
    from: plant_director
    to: r_and_d
    deliverable: "Restricciones de capacidad y coste objetivo de fabricación"
    deliverable_en: "Capacity constraints and target manufacturing cost"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "Sin esta retroalimentación I+D diseña en el vacío"

  - id: tx_c10
    from: quality_manager
    to: supply_chain
    deliverable: "Homologación y seguimiento de proveedores críticos"
    deliverable_en: "Approval and follow-up of critical suppliers"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Proveedores sin homologar son el origen del 40% de las reclamaciones de calidad"

  - id: tx_c11
    from: hse_officer
    to: operator
    deliverable: "Formación en PRL, EPIs y gestión de residuos"
    deliverable_en: "HSE training, PPE instructions and waste management"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Formación anual insuficiente correlaciona con aumento de accidentalidad"

  - id: tx_c12
    from: customer_service_b2b
    to: production_manager
    deliverable: "Previsión de demanda y pedidos en firme del cliente"
    deliverable_en: "Demand forecast and firm customer orders"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Sin visibilidad de demanda la planta opera en modo reactivo y eleva stocks"

  - id: tx_c13
    from: production_manager
    to: customer_service_b2b
    deliverable: "Confirmación de fechas de entrega y capacidad disponible"
    deliverable_en: "Order delivery date confirmation and available capacity"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "Compromisos de entrega poco realistas destruyen la confianza del cliente B2B"

  - id: tx_c14
    from: plant_director
    to: hse_officer
    deliverable: "Presupuesto e inversión en seguridad y medioambiente"
    deliverable_en: "Safety and environmental investment budget"
    type: tangible
    is_must: true
    frequency: baja
    health_hint: "Recortar PRL es el pasivo oculto más caro a largo plazo"

  - id: tx_c15
    from: operator
    to: quality_manager
    deliverable: "Alertas de defecto detectadas en línea (autocontrol)"
    deliverable_en: "In-line defect alerts detected by operator (self-control)"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "Sin cultura de autocontrol, el defecto llega al cliente"

  - id: tx_c16
    from: supply_chain
    to: plant_director
    deliverable: "Análisis de riesgo de suministro y alternativas de proveedor"
    deliverable_en: "Supply risk analysis and alternative supplier options"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "Dependencia de proveedor único es el talón de Aquiles de muchas plantas"

  - id: tx_c17
    from: r_and_d
    to: quality_manager
    deliverable: "Protocolos de validación y criterios de aceptación de producto"
    deliverable_en: "Validation protocols and product acceptance criteria"
    type: tangible
    is_must: true
    frequency: baja
    health_hint: "Sin criterios definidos, calidad y producción entran en conflicto permanente"

patterns:
  - name: "Silo de Calidad vs. Producción"
    description: "Calidad y producción operan como facciones enfrentadas. El operario aprende a ocultar defectos para no parar la línea."
    signal: "Alto volumen de no conformidades detectadas fuera de planta (en cliente)"

  - name: "Mantenimiento Reactivo Crónico"
    description: "La planta funciona en modo extinción de incendios. No hay plan de mantenimiento preventivo real, solo reparaciones urgentes que consumen el 80% del tiempo del técnico."
    signal: "MTBF < 200h en equipos críticos, OEE por debajo del 60%"

  - name: "I+D en Órbita"
    description: "El equipo de desarrollo de producto diseña sin visitar planta ni hablar con operarios. Los nuevos productos llegan a producción con tolerancias imposibles de cumplir."
    signal: "Más del 30% de los proyectos NPI requieren rediseño tras la producción piloto"

  - name: "Cuello de Botella Invisible"
    description: "Una operación o máquina limita toda la capacidad de la planta pero nadie la ha identificado formalmente. Los esfuerzos de mejora se aplican en el lugar equivocado."
    signal: "WIP acumulado antes de una estación específica, plazos de entrega impredecibles"

  - name: "Forecast Desconectado"
    description: "Comercial promete lo que no puede fabricarse. Planta planifica sin datos reales de demanda. El resultado son stocks de producto terminado erróneo y roturas de lo que el cliente necesita."
    signal: "OTIF < 80%, quejas de cliente por incumplimiento de entrega simultáneas a exceso de stock"

---

## Manufactura — Contexto VNA

La industria manufacturera (CNAE 10-33) es el sector donde la red de valor tiene consecuencias físicas e inmediatas: un flujo de información roto para la producción en horas, no semanas. La paradoja central es que la **fábrica produce objetos pero su competitividad se gana o pierde en flujos intangibles** — conocimiento tácito del operario, confianza entre calidad y producción, visibilidad de demanda.

### Dinámicas de Red de Valor

En manufactura, la cadena de transacciones más crítica es la que une **cliente → planificación → producción → suministro** — cualquier ruptura en esta secuencia genera el efecto bullwhip: amplificación de variabilidad que se traduce en sobrestock o rotura. La VNA hace visible esta cadena oculta.

Los roles de **pinya** (operarios, técnicos de mantenimiento, atención cliente B2B) son los que más sufren cuando los flujos de información del **tronc** son de baja calidad. Un operario sin SOP actualizado o sin feedback de calidad toma decisiones subóptimas que el sistema culpa al individuo pero que son sistémicas.

### Indicadores de Salud de Red

- **OEE > 75%**: red operativa saludable entre producción y mantenimiento
- **OTIF > 90%**: coordinación efectiva entre supply chain, producción y comercial
- **PPM clientes < 500**: calidad en red funciona como sistema preventivo
- **% retrabajo < 2%**: procesos estables y SOPs respetados

### Bilingüe / Bilingual

Manufacturing is the sector where VNA delivers the fastest ROI. When the network between production planning, maintenance, and quality is made visible, plants typically find 2-3 hidden bottlenecks that account for 60-70% of delivery failures. The "Quality vs. Production silo" pattern is almost universal and resolves quickly once the mutual intangible flows (knowledge sharing, shared improvement goals) are formalised in the network map.
