---
sector_id: H
sector_name: "Transporte y Almacenamiento"
sector_name_en: "Transport & Storage"
cnae: "49-53"
version: "v11.1"
tags: ["transporte", "logistica", "almacen", "distribucion", "supply-chain", "last-mile"]

roles:
  - id: logistics_director
    name: "Director de Logística"
    name_en: "Logistics Director"
    description: "Define la estrategia de red logística: modos de transporte, red de almacenes y niveles de servicio al cliente."
    description_en: "Defines the logistics network strategy: transport modes, warehouse network and customer service levels."
    castell_level: pom_de_dalt
    fmv_usd_h: 90
    typical_actor: "Supply chain director con visión multimodal y gestión de P&L logístico"
    typical_actor_en: "Supply chain director with multimodal vision and logistics P&L management"
    tags: ["estrategia", "red-logistica", "P&L"]

  - id: fleet_manager
    name: "Jefe de Flota"
    name_en: "Fleet Manager"
    description: "Gestiona la flota de vehículos: mantenimiento, costes, cumplimiento normativo y renovación del parque."
    description_en: "Manages the vehicle fleet: maintenance, costs, regulatory compliance and fleet renewal."
    castell_level: tronc
    fmv_usd_h: 52
    typical_actor: "Técnico con certificado de aptitud profesional en transporte"
    typical_actor_en: "Technician with professional transport competence certificate"
    tags: ["flota", "vehiculos", "normativa"]

  - id: driver
    name: "Conductor / Repartidor"
    name_en: "Driver / Delivery Operative"
    description: "Ejecuta la entrega o recogida. Primer contacto físico con el cliente receptor y último punto de control de la cadena."
    description_en: "Executes delivery or collection. First physical contact with receiving customer and last quality control point."
    castell_level: pinya
    fmv_usd_h: 20
    typical_actor: "Conductor profesional con carné C o CE según necesidad"
    typical_actor_en: "Professional driver with C or CE licence as required"
    tags: ["entrega", "last-mile", "cliente"]

  - id: warehouse_manager
    name: "Jefe de Almacén"
    name_en: "Warehouse Manager"
    description: "Dirige las operaciones de recepción, almacenaje, preparación y expedición. Responsable de exactitud de inventario."
    description_en: "Leads inbound, storage, picking and outbound operations. Responsible for inventory accuracy."
    castell_level: tronc
    fmv_usd_h: 48
    typical_actor: "Responsable de operaciones con experiencia en WMS y gestión de personal"
    typical_actor_en: "Operations manager with WMS and staff management experience"
    tags: ["almacen", "inventario", "WMS"]

  - id: transport_planner
    name: "Planificador de Rutas y Cargas"
    name_en: "Route & Load Planner"
    description: "Optimiza rutas, agrupa cargas y asigna vehículos para maximizar la eficiencia del coste por envío."
    description_en: "Optimises routes, consolidates loads and assigns vehicles to maximise cost-per-shipment efficiency."
    castell_level: tronc
    fmv_usd_h: 38
    typical_actor: "Técnico de planificación con TMS y herramientas de optimización"
    typical_actor_en: "Planning technician with TMS and optimisation tools"
    tags: ["rutas", "optimizacion", "TMS"]

  - id: customs_agent
    name: "Agente de Aduanas / Transitario"
    name_en: "Customs Agent / Freight Forwarder"
    description: "Gestiona documentación aduanera, aranceles e incoterms para operaciones de comercio internacional."
    description_en: "Manages customs documentation, tariffs and incoterms for international trade operations."
    castell_level: tronc
    fmv_usd_h: 55
    typical_actor: "Especialista en comercio exterior con licencia de representante aduanero"
    typical_actor_en: "Foreign trade specialist with customs representative licence"
    tags: ["aduanas", "internacional", "incoterms"]

  - id: ops_controller
    name: "Controller de Operaciones"
    name_en: "Operations Controller"
    description: "Monitoriza KPIs logísticos en tiempo real: OTIF, coste por envío, productividad de almacén y nivel de servicio."
    description_en: "Monitors logistics KPIs in real time: OTIF, cost per shipment, warehouse productivity and service level."
    castell_level: tronc
    fmv_usd_h: 45
    typical_actor: "Analista de datos con perfil logístico y dominio de herramientas BI"
    typical_actor_en: "Data analyst with logistics profile and BI tools proficiency"
    tags: ["control", "KPIs", "BI"]

  - id: last_mile_coordinator
    name: "Coordinador de Última Milla"
    name_en: "Last Mile Coordinator"
    description: "Gestiona la red de reparto capilar: subcontratistas, incidencias de entrega y experiencia del destinatario final."
    description_en: "Manages capillary delivery network: subcontractors, delivery incidents and final recipient experience."
    castell_level: tronc
    fmv_usd_h: 34
    typical_actor: "Coordinador operativo con alta tolerancia a la gestión de incidencias"
    typical_actor_en: "Operational coordinator with high tolerance for incident management"
    tags: ["ultima-milla", "ecommerce", "incidencias"]

transactions:
  - id: tx_h01
    from: transport_planner
    to: driver
    deliverable: "Hoja de ruta con paradas, horarios y documentación de entrega"
    deliverable_en: "Route sheet with stops, schedules and delivery documentation"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Rutas mal optimizadas elevan el coste de transporte un 15-25% respecto al óptimo"

  - id: tx_h02
    from: driver
    to: ops_controller
    deliverable: "Pruebas de entrega (POD) y alertas de incidencia en ruta"
    deliverable_en: "Proof of delivery (POD) and in-route incident alerts"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Los POD sin captura digital crean disputas con cliente que cuestan más de resolver que la entrega"

  - id: tx_h03
    from: warehouse_manager
    to: transport_planner
    deliverable: "Mercancía preparada, pesada y consolidada para expedición"
    deliverable_en: "Merchandise prepared, weighed and consolidated for dispatch"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Los retrasos en expedición generan efecto dominó en todas las rutas del día"

  - id: tx_h04
    from: fleet_manager
    to: driver
    deliverable: "Vehículo en condiciones: revisado, equipado y con tacógrafo actualizado"
    deliverable_en: "Vehicle in condition: serviced, equipped and with updated tachograph"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "La inmovilización de un vehículo por avería evitable es el síntoma más caro del mantenimiento reactivo"

  - id: tx_h05
    from: ops_controller
    to: logistics_director
    deliverable: "Dashboard logístico: OTIF, coste por envío, incidencias y tendencias"
    deliverable_en: "Logistics dashboard: OTIF, cost per shipment, incidents and trends"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Si los KPIs se ven pero no generan decisiones, el sistema de control es decorativo"

  - id: tx_h06
    from: customs_agent
    to: logistics_director
    deliverable: "Alertas de cambio normativo aduanero y optimización arancelaria"
    deliverable_en: "Customs regulatory change alerts and tariff optimisation"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "Los cambios regulatorios ignorados generan retenciones y multas evitables"

  - id: tx_h07
    from: last_mile_coordinator
    to: ops_controller
    deliverable: "Tasa de primer intento de entrega y causas de fallo"
    deliverable_en: "First delivery attempt rate and failure root causes"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "Primera entrega fallida duplica el coste logístico y destruye la experiencia de cliente ecommerce"

  - id: tx_h08
    from: logistics_director
    to: warehouse_manager
    deliverable: "Estándares de productividad y objetivos de inventario por almacén"
    deliverable_en: "Productivity standards and inventory targets per warehouse"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "Sin targets claros el almacén optimiza espacio a costa de velocidad de preparación"

  - id: tx_h09
    from: driver
    to: last_mile_coordinator
    deliverable: "Feedback de ruta: dificultades de acceso, hábitos del cliente y anomalías"
    deliverable_en: "Route feedback: access difficulties, customer habits and anomalies"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "El conductor conoce mejor la última milla que cualquier algoritmo; raramente se le pregunta"

  - id: tx_h10
    from: transport_planner
    to: fleet_manager
    deliverable: "Previsión de necesidad de flota por ventana horaria y zona"
    deliverable_en: "Fleet demand forecast by time window and zone"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Sin previsión, la flota se subdimensiona en picos y se sobredimensiona el resto del tiempo"

  - id: tx_h11
    from: warehouse_manager
    to: ops_controller
    deliverable: "Productividad de almacén: líneas por hora, exactitud de inventario y incidencias"
    deliverable_en: "Warehouse productivity: lines per hour, inventory accuracy and incidents"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Exactitud de inventario < 98% hace imposible comprometer plazos de entrega fiables"

  - id: tx_h12
    from: customs_agent
    to: warehouse_manager
    deliverable: "Documentación de importación liberada y clasificación arancelaria"
    deliverable_en: "Released import documentation and tariff classification"
    type: tangible
    is_must: false
    frequency: media
    health_hint: "Mercancía retenida en aduana por documentación incorrecta puede paralizar una línea de producción cliente"

  - id: tx_h13
    from: logistics_director
    to: transport_planner
    deliverable: "Política de niveles de servicio por tipo de cliente y urgencia"
    deliverable_en: "Service level policy by customer type and urgency"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "Tratar todos los envíos como urgentes cuando no lo son es el derroche más común en logística"

  - id: tx_h14
    from: ops_controller
    to: last_mile_coordinator
    deliverable: "Análisis de zonas con mayor tasa de incidencia y propuestas de mejora"
    deliverable_en: "Analysis of zones with highest incident rate and improvement proposals"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Sin análisis geográfico, las mismas incidencias se repiten indefinidamente"

  - id: tx_h15
    from: fleet_manager
    to: ops_controller
    deliverable: "Coste por kilómetro y disponibilidad real de flota"
    deliverable_en: "Cost per kilometre and actual fleet availability"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Sin coste real por km el modelo de precios de transporte es una estimación ciega"

patterns:
  - name: "El Conductor Invisible"
    description: "El conductor es el único nodo que tiene contacto directo con el cliente final pero no existe canal formal para que su conocimiento retroalimente planificación, servicio al cliente o diseño de rutas."
    signal: "Alta tasa de incidencias repetidas en las mismas zonas que ningún algoritmo ha corregido"

  - name: "OTIF Falso"
    description: "Se declara OTIF alto porque se mide la salida del almacén, no la recepción real por el cliente. El indicador no refleja la experiencia del destinatario."
    signal: "Discrepancia entre OTIF interno y satisfacción del cliente mayor al 15%"

  - name: "Última Milla como Coste Residual"
    description: "La última milla se trata como un coste a minimizar en lugar de como una ventaja competitiva. Se subcontrata al mínimo precio sin estándares de servicio, degradando la experiencia de cliente."
    signal: "Tasa de primer intento fallido > 20%, NPS de entrega negativo"

  - name: "Almacén y Transporte Desconectados"
    description: "El almacén prepara pedidos sin visibilidad de las rutas del día. Transporte planifica rutas sin saber qué mercancía estará lista y cuándo. El resultado son esperas, colas y vehículos que salen medio cargados."
    signal: "Tiempo medio de espera de conductor en muelle > 45 minutos"

  - name: "Gestión de Flota Reactiva"
    description: "Las incidencias de flota (averías, inmovilizaciones por inspección) se gestionan como emergencias en lugar de como eventos predecibles. El mantenimiento preventivo es el gran sacrificado cuando la operativa aprieta."
    signal: "Tasa de inmovilización por avería > 8% del parque disponible"

---

## Transporte y Almacenamiento — Contexto VNA

El transporte y la logística (CNAE 49-53) son sectores donde la red de valor tiene una dimensión temporal crítica que no aparece en los organigramas: **cada nodo opera en ventanas de tiempo estrechas y el fallo de sincronización genera costes exponenciales**, no lineales.

### Dinámicas de Red de Valor

La paradoja central del sector es que sus **activos físicos** (camiones, almacenes, muelles) son los más visibles pero su **ventaja competitiva** reside en los flujos intangibles — información de demanda, conocimiento de ruta, fiabilidad de datos de stock — que raramente están formalizados.

Los operadores logísticos que compiten en precio sin mapa de red de valor no pueden identificar qué flujos intangibles generan su diferencial de servicio. Los que tienen VNA clara saben qué relaciones defender y qué costes de transacción reducir.

### La Última Milla como Red de Valor Compleja

El segmento de última milla (ecommerce especialmente) ha creado una red de valor nueva donde el destinatario final es un nodo activo — puede redirigir, reprogramar, puntuar y amplificar en redes sociales. Esta bidireccionalidad del flujo cliente→operador raramente está mapeada en la VNA de los operadores logísticos.

### Bilingüe / Bilingual

Transport VNA maps consistently surface the "invisible driver" pattern: the delivery operative holds the richest real-time knowledge about the last mile — access constraints, customer preferences, recurring obstacles — yet has no formalised channel to feed this intelligence back into route planning or service design. Organisations that formalise this flow reduce first-attempt failure rates by 8-12% within two quarters.
