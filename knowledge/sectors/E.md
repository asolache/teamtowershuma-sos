---
sector_id: E
sector_name: "Suministro de Agua, Saneamiento y Gestión de Residuos"
sector_name_en: "Water Supply, Sewerage & Waste Management"
cnae: "36-39"
version: "v11.1"
tags: ["agua", "saneamiento", "residuos", "medioambiente", "ciclo-del-agua", "economia-circular"]

roles:
  - id: operations_director_water
    name: "Director de Operaciones del Ciclo del Agua"
    name_en: "Water Cycle Operations Director"
    description: "Garantiza la continuidad del servicio de abastecimiento, saneamiento y depuración. Responde ante administraciones concedentes."
    description_en: "Guarantees continuity of supply, sewerage and treatment services. Accountable to concession-granting administrations."
    castell_level: pom_de_dalt
    fmv_usd_h: 88
    typical_actor: "Ingeniero de caminos o industrial con experiencia en gestión de servicios públicos en concesión"
    typical_actor_en: "Civil or industrial engineer with experience in public service management under concession"
    tags: ["operaciones", "ciclo-agua", "concesion"]

  - id: network_technician_water
    name: "Técnico de Red de Distribución"
    name_en: "Water Distribution Network Technician"
    description: "Opera y mantiene la red de tuberías, bombeos y depósitos. Detecta y repara fugas, gestiona presiones y calidades."
    description_en: "Operates and maintains pipe networks, pumping stations and reservoirs. Detects and repairs leaks, manages pressures and water quality."
    castell_level: pinya
    fmv_usd_h: 26
    typical_actor: "Técnico de obras y servicios con habilitación para trabajos en red de distribución"
    typical_actor_en: "Works and services technician with network distribution qualification"
    tags: ["red", "fugas", "presion"]

  - id: wastewater_plant_operator
    name: "Operador de EDAR / Planta de Tratamiento"
    name_en: "Wastewater Treatment Plant Operator"
    description: "Opera la estación depuradora: controla el proceso biológico, analiza parámetros de calidad y asegura el vertido conforme a normativa."
    description_en: "Operates the wastewater treatment plant: controls the biological process, analyses quality parameters and ensures discharge compliance."
    castell_level: pinya
    fmv_usd_h: 28
    typical_actor: "Técnico de laboratorio o de procesos con formación en tratamiento de aguas residuales"
    typical_actor_en: "Lab or process technician with wastewater treatment training"
    tags: ["EDAR", "depuracion", "vertido"]

  - id: quality_lab_water
    name: "Responsable de Laboratorio y Calidad del Agua"
    name_en: "Water Quality & Laboratory Manager"
    description: "Analiza la calidad del agua en todos los puntos del ciclo. Asegura el cumplimiento del Real Decreto de Aguas Potables y la normativa de vertidos."
    description_en: "Analyses water quality at all points in the cycle. Ensures compliance with drinking water regulations and discharge standards."
    castell_level: tronc
    fmv_usd_h: 48
    typical_actor: "Químico o biólogo con experiencia en análisis de aguas y acreditación de laboratorio"
    typical_actor_en: "Chemist or biologist with water analysis experience and laboratory accreditation"
    tags: ["calidad", "laboratorio", "normativa"]

  - id: waste_collection_coordinator
    name: "Coordinador de Recogida de Residuos"
    name_en: "Waste Collection Coordinator"
    description: "Planifica y supervisa las rutas de recogida de residuos urbanos o industriales. Optimiza frecuencias, vehículos y puntos de recogida."
    description_en: "Plans and supervises urban or industrial waste collection routes. Optimises frequencies, vehicles and collection points."
    castell_level: tronc
    fmv_usd_h: 38
    typical_actor: "Técnico de logística con experiencia en gestión de flotas de residuos y coordinación con ayuntamientos"
    typical_actor_en: "Logistics technician with waste fleet management and municipal coordination experience"
    tags: ["residuos", "recogida", "rutas"]

  - id: environmental_engineer
    name: "Ingeniero Ambiental / Técnico de Medio Ambiente"
    name_en: "Environmental Engineer"
    description: "Gestiona permisos ambientales, evaluaciones de impacto y programas de mejora. Nexo entre la operación y las obligaciones legales ambientales."
    description_en: "Manages environmental permits, impact assessments and improvement programmes. Bridge between operations and legal environmental obligations."
    castell_level: tronc
    fmv_usd_h: 52
    typical_actor: "Ingeniero de medio ambiente o ciencias ambientales con conocimiento de legislación autonómica y europea"
    typical_actor_en: "Environmental engineer or scientist with regional and EU environmental legislation knowledge"
    tags: ["medioambiente", "permisos", "impacto"]

  - id: circular_economy_manager
    name: "Responsable de Economía Circular / Valorización"
    name_en: "Circular Economy / Valorisation Manager"
    description: "Transforma residuos en recursos: valorización energética, compostaje, reciclaje industrial. Maximiza el valor de los flujos de salida."
    description_en: "Transforms waste into resources: energy recovery, composting, industrial recycling. Maximises the value of output streams."
    castell_level: tronc
    fmv_usd_h: 55
    typical_actor: "Especialista en valorización de residuos con experiencia en mercados de materias primas secundarias"
    typical_actor_en: "Waste valorisation specialist with secondary raw materials market experience"
    tags: ["economia-circular", "valorizacion", "reciclaje"]

  - id: concession_manager
    name: "Gestor de Concesión / Relación Institucional"
    name_en: "Concession Manager / Institutional Relations"
    description: "Gestiona el contrato de concesión con la administración pública: reporting, renegociación de tarifas y relación política con el ayuntamiento o mancomunidad."
    description_en: "Manages the concession contract with the public administration: reporting, tariff renegotiation and political relationship with the municipality."
    castell_level: pom_de_dalt
    fmv_usd_h: 82
    typical_actor: "Directivo con experiencia en servicios públicos concesionados y habilidades de relación institucional"
    typical_actor_en: "Executive with concession-based public services experience and institutional relations skills"
    tags: ["concesion", "ayuntamiento", "tarifas"]

transactions:
  - id: tx_e01
    from: quality_lab_water
    to: operations_director_water
    deliverable: "Informes analíticos de calidad del agua en puntos de control y alertas de incumplimiento"
    deliverable_en: "Water quality analytical reports at control points and non-compliance alerts"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Un incumplimiento de calidad del agua potable tiene consecuencias sanitarias y legales inmediatas"

  - id: tx_e02
    from: network_technician_water
    to: operations_director_water
    deliverable: "Registro de fugas detectadas, reparaciones ejecutadas e incidencias de presión"
    deliverable_en: "Log of detected leaks, completed repairs and pressure incidents"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "El agua no facturada por pérdidas en red supone entre el 15-30% del volumen bombeado en redes antiguas"

  - id: tx_e03
    from: wastewater_plant_operator
    to: quality_lab_water
    deliverable: "Muestras de efluente y datos de proceso para análisis de cumplimiento de vertido"
    deliverable_en: "Effluent samples and process data for discharge compliance analysis"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Un vertido fuera de parámetros sin detección en laboratorio puede generar sanción ambiental grave"

  - id: tx_e04
    from: environmental_engineer
    to: operations_director_water
    deliverable: "Estado de permisos ambientales vigentes y alertas de vencimiento o cambio normativo"
    deliverable_en: "Status of current environmental permits and alerts for expiry or regulatory changes"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Operar con permiso ambiental vencido es infracción grave; la alerta debe llegar con 6 meses de antelación"

  - id: tx_e05
    from: waste_collection_coordinator
    to: circular_economy_manager
    deliverable: "Composición y volumen de flujos de residuos recogidos por fracción y zona"
    deliverable_en: "Composition and volume of collected waste streams by fraction and area"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Sin datos de composición de residuos no se puede diseñar un plan de valorización realista"

  - id: tx_e06
    from: circular_economy_manager
    to: concession_manager
    deliverable: "Ingresos de valorización y reducción de coste de eliminación por economía circular"
    deliverable_en: "Valorisation revenues and elimination cost reduction from circular economy"
    type: tangible
    is_must: false
    frequency: media
    health_hint: "Los ingresos de valorización bien documentados son el argumento más sólido para renegociar tarifas al alza"

  - id: tx_e07
    from: concession_manager
    to: operations_director_water
    deliverable: "Compromisos contractuales de nivel de servicio y penalizaciones vigentes"
    deliverable_en: "Contractual service level commitments and applicable penalties"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "El director de operaciones que no conoce los KPIs contractuales puede incumplirlos sin saberlo"

  - id: tx_e08
    from: quality_lab_water
    to: wastewater_plant_operator
    deliverable: "Resultados analíticos con recomendaciones de ajuste de proceso"
    deliverable_en: "Analytical results with process adjustment recommendations"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "El operador que recibe solo el dato sin la interpretación no puede corregir el proceso a tiempo"

  - id: tx_e09
    from: environmental_engineer
    to: circular_economy_manager
    deliverable: "Marco normativo para valorización: qué fracciones pueden tratarse como subproducto y qué como residuo"
    deliverable_en: "Regulatory framework for valorisation: which fractions qualify as by-product vs. waste"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "La distinción jurídica residuo/subproducto determina si la valorización es un negocio o una obligación"

  - id: tx_e10
    from: network_technician_water
    to: quality_lab_water
    deliverable: "Alertas de contaminación potencial por incidencia en red (rotura, cruce de flujos)"
    deliverable_en: "Potential contamination alerts from network incidents (burst, cross-contamination)"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Una contaminación de red no comunicada al laboratorio puede llegar al consumidor"

  - id: tx_e11
    from: concession_manager
    to: environmental_engineer
    deliverable: "Plan de inversiones en mejora ambiental comprometido con la administración"
    deliverable_en: "Environmental improvement investment plan committed to the administration"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "Las inversiones comprometidas que no se ejecutan generan conflicto con la administración y riesgo de rescisión"

  - id: tx_e12
    from: waste_collection_coordinator
    to: operations_director_water
    deliverable: "Incidencias de servicio: contenedores desbordados, rutas no ejecutadas y reclamaciones ciudadanas"
    deliverable_en: "Service incidents: overflowing containers, unexecuted routes and citizen complaints"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "Las reclamaciones ciudadanas sobre residuos llegan al alcalde antes que al director de operaciones"

  - id: tx_e13
    from: circular_economy_manager
    to: waste_collection_coordinator
    deliverable: "Especificaciones de pureza requerida por fracción para maximizar precio de venta"
    deliverable_en: "Required purity specifications by fraction to maximise sale price"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "El reciclador que recibe fracción contaminada rechaza el lote; la recogida selectiva de calidad empieza en la ruta"

  - id: tx_e14
    from: operations_director_water
    to: concession_manager
    deliverable: "Propuestas de inversión en renovación de red e infraestructura con justificación técnica"
    deliverable_en: "Network and infrastructure renewal investment proposals with technical justification"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "Sin justificación técnica sólida la administración rechaza la revisión tarifaria que financia la renovación"

  - id: tx_e15
    from: environmental_engineer
    to: quality_lab_water
    deliverable: "Nuevos parámetros de control exigidos por cambios en normativa de agua potable o vertidos"
    deliverable_en: "New control parameters required by changes in drinking water or discharge regulations"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "La normativa de agua evoluciona; el laboratorio que no actualiza sus protocolos analíticos no detecta los nuevos riesgos"

patterns:
  - name: "Agua No Facturada Tolerada"
    description: "Las pérdidas en red (fugas reales y pérdidas aparentes) se asumen como dato estructural y no se gestionan activamente. El técnico de red repara averías reactivamente pero no existe programa de detección de fugas con objetivos."
    signal: "Índice de agua no facturada > 20% sin plan de reducción activo; tendencia estable o creciente"

  - name: "Laboratorio-Operación Desconectados"
    description: "El laboratorio analiza y reporta cumplimiento pero no tiene relación fluida con los operadores de planta. Los datos analíticos se archivan sin generar ajustes de proceso. La EDAR funciona por inercia, no por datos."
    signal: "Resultados analíticos fuera de rango repetidos sin cambio de parámetros de proceso"

  - name: "Concesión sin Operación"
    description: "El gestor de concesión y el director de operaciones viven en mundos separados. Los compromisos contractuales con la administración se negocian sin evaluar la viabilidad operativa. Las promesas se incumplen porque nadie verificó si eran alcanzables."
    signal: "Penalizaciones contractuales recurrentes en los mismos KPIs; renegociación reactiva en lugar de proactiva"

  - name: "Residuos como Coste, no como Recurso"
    description: "La organización gestiona los residuos como un problema de eliminación. El responsable de economía circular existe pero no tiene mandato real ni presupuesto. La valorización es un proyecto piloto permanente."
    signal: "Porcentaje de valorización < 30% en fracciones con mercado maduro; ingresos de valorización marginales"

  - name: "Alerta Ambiental Tardía"
    description: "Los permisos ambientales se monitorizan de forma reactiva. El ingeniero ambiental descubre vencimientos o cambios normativos cuando ya generan riesgo. La administración notifica antes de que la empresa lo detecte internamente."
    signal: "Notificaciones administrativas recibidas antes de que el equipo interno haya identificado el riesgo"

---

## Agua, Saneamiento y Residuos — Contexto VNA

El sector de agua y residuos (CNAE 36-39) es donde el **servicio público y la gestión empresarial se fusionan bajo contrato de concesión**. La red de valor tiene una dualidad única: sirve a ciudadanos (que exigen continuidad y calidad) y rinde cuentas a administraciones (que exigen cumplimiento contractual y ambiental), mientras opera como empresa que necesita rentabilidad para financiar sus inversiones.

### Dinámicas de Red de Valor

La paradoja central del sector es que sus activos más críticos son **invisibles**: redes enterradas, procesos biológicos en depuradoras, cadenas de custodia de residuos. La mayor parte del valor se destruye o se crea por debajo del suelo o dentro de plantas que el ciudadano nunca ve. Esto hace que los flujos de información sean el único mecanismo de gestión disponible.

El nodo del **técnico de red** (pinya) es el que más conocimiento tiene sobre el estado real de la infraestructura, pero raramente existe un sistema que convierta su conocimiento tácito (este tramo de tubería vibra de forma extraña, este caudal lleva semanas disminuyendo) en información formal que llegue a la dirección antes de la avería.

### Economía Circular como Red de Valor

La transición hacia la economía circular convierte los flujos de salida (residuos) en potenciales flujos de entrada (recursos). La VNA es especialmente útil en este sector para mapear qué flujos de salida tienen mercado real como subproductos y qué nodos de la red deben conectarse para activarlos.

### Bilingüe / Bilingual

Water and waste VNA maps reveal a universal pattern: the technical staff operating underground networks and treatment plants hold the most precise real-time knowledge of system health, but this knowledge rarely reaches management in a structured form. When organisations formalise these upward flows — from network technician and plant operator to operations director — unplanned service interruptions typically fall by 25-40% within the first year.
