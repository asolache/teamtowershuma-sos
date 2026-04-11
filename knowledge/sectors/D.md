---
sector_id: D
sector_name: "Suministro de Energía Eléctrica, Gas y Vapor"
sector_name_en: "Electricity, Gas & Steam Supply"
cnae: "35"
version: "v11.1"
tags: ["energia", "electricidad", "gas", "renovables", "red-electrica", "utilities", "transicion-energetica"]

roles:
  - id: energy_director
    name: "Director de Operaciones Energéticas"
    name_en: "Energy Operations Director"
    description: "Garantiza la continuidad del suministro, la seguridad de la red y el cumplimiento regulatorio ante el operador del sistema."
    description_en: "Guarantees supply continuity, grid security and regulatory compliance with the system operator."
    castell_level: pom_de_dalt
    fmv_usd_h: 100
    typical_actor: "Ingeniero industrial o eléctrico con experiencia en gestión de sistemas de potencia y regulación energética"
    typical_actor_en: "Industrial or electrical engineer with power systems management and energy regulation experience"
    tags: ["operaciones", "red", "regulacion"]

  - id: grid_engineer
    name: "Ingeniero de Red / Sistemas de Potencia"
    name_en: "Grid / Power Systems Engineer"
    description: "Diseña, opera y mantiene la red de transporte o distribución. Gestiona flujos eléctricos y estabilidad del sistema."
    description_en: "Designs, operates and maintains the transmission or distribution network. Manages power flows and system stability."
    castell_level: tronc
    fmv_usd_h: 72
    typical_actor: "Ingeniero eléctrico con especialización en sistemas de potencia y protecciones"
    typical_actor_en: "Electrical engineer specialised in power systems and protection schemes"
    tags: ["red", "potencia", "estabilidad"]

  - id: renewables_developer
    name: "Desarrollador de Proyectos Renovables"
    name_en: "Renewables Project Developer"
    description: "Lidera el ciclo completo de un proyecto de generación renovable: prospección, permisos, financiación, construcción y puesta en marcha."
    description_en: "Leads the full cycle of a renewable generation project: prospecting, permits, financing, construction and commissioning."
    castell_level: tronc
    fmv_usd_h: 78
    typical_actor: "Ingeniero de proyectos con experiencia en solar fotovoltaico, eólico o almacenamiento"
    typical_actor_en: "Project engineer with solar PV, wind or storage experience"
    tags: ["renovables", "proyectos", "solar", "eolico"]

  - id: energy_trader
    name: "Trader de Energía / Gestor de Cartera"
    name_en: "Energy Trader / Portfolio Manager"
    description: "Opera en mercados mayoristas de electricidad y gas: spot, futuros y gestión del riesgo de precio. Maximiza el margen de la cartera de generación."
    description_en: "Operates in wholesale electricity and gas markets: spot, futures and price risk management. Maximises the generation portfolio margin."
    castell_level: tronc
    fmv_usd_h: 85
    typical_actor: "Especialista en mercados energéticos con experiencia en OMIE, MIBGAS y gestión de riesgo"
    typical_actor_en: "Energy markets specialist with OMIE, MIBGAS and risk management experience"
    tags: ["trading", "mercados", "riesgo-precio"]

  - id: demand_forecaster
    name: "Analista de Previsión de Demanda"
    name_en: "Demand Forecasting Analyst"
    description: "Modela y predice la demanda energética a corto y largo plazo para planificación de la red y optimización del despacho."
    description_en: "Models and predicts short- and long-term energy demand for network planning and dispatch optimisation."
    castell_level: tronc
    fmv_usd_h: 62
    typical_actor: "Estadístico o ingeniero con modelos de series temporales y conocimiento meteorológico"
    typical_actor_en: "Statistician or engineer with time series models and meteorological knowledge"
    tags: ["prevision", "demanda", "modelos"]

  - id: maintenance_engineer_energy
    name: "Ingeniero de Mantenimiento de Planta"
    name_en: "Plant Maintenance Engineer"
    description: "Gestiona el mantenimiento preventivo y correctivo de activos de generación o transformación. Minimiza paradas no programadas."
    description_en: "Manages preventive and corrective maintenance of generation or transformation assets. Minimises unplanned outages."
    castell_level: tronc
    fmv_usd_h: 58
    typical_actor: "Ingeniero industrial o eléctrico con experiencia en activos de alta tensión"
    typical_actor_en: "Industrial or electrical engineer with high-voltage asset experience"
    tags: ["mantenimiento", "planta", "disponibilidad"]

  - id: regulatory_affairs
    name: "Responsable de Asuntos Regulatorios"
    name_en: "Regulatory Affairs Manager"
    description: "Gestiona la relación con CNMC, REE y administraciones. Obtiene permisos, responde a consultas y monitoriza cambios normativos."
    description_en: "Manages relations with CNMC, REE and administrations. Obtains permits, responds to enquiries and monitors regulatory changes."
    castell_level: tronc
    fmv_usd_h: 75
    typical_actor: "Jurista o ingeniero especializado en regulación energética y mercado eléctrico"
    typical_actor_en: "Lawyer or engineer specialised in energy regulation and electricity market"
    tags: ["regulacion", "permisos", "CNMC"]

  - id: customer_ops_energy
    name: "Operaciones de Cliente / Comercializadora"
    name_en: "Customer Operations / Retailer"
    description: "Gestiona la cartera de clientes finales: facturación, cambios de contrato, incidencias de suministro y retención."
    description_en: "Manages end-client portfolio: billing, contract changes, supply incidents and retention."
    castell_level: pinya
    fmv_usd_h: 25
    typical_actor: "Técnico de atención al cliente con conocimiento de tarifas reguladas y mercado libre"
    typical_actor_en: "Customer service technician with knowledge of regulated tariffs and free market"
    tags: ["cliente", "facturacion", "comercializadora"]

transactions:
  - id: tx_d01
    from: demand_forecaster
    to: energy_trader
    deliverable: "Previsión de demanda horaria para posicionamiento en mercado diario e intradiario"
    deliverable_en: "Hourly demand forecast for day-ahead and intraday market positioning"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "El trader que opera sin previsión de demanda asume riesgo de desbalance innecesario"

  - id: tx_d02
    from: grid_engineer
    to: energy_director
    deliverable: "Estado de la red: saturaciones, restricciones técnicas y riesgos de continuidad"
    deliverable_en: "Grid status: congestion, technical constraints and continuity risks"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "Una restricción técnica no comunicada puede convertirse en un corte de suministro evitable"

  - id: tx_d03
    from: maintenance_engineer_energy
    to: grid_engineer
    deliverable: "Ventanas de mantenimiento programadas y disponibilidad de activos"
    deliverable_en: "Scheduled maintenance windows and asset availability"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "El mantenimiento no coordinado con la operación de red genera restricciones imprevistas"

  - id: tx_d04
    from: renewables_developer
    to: regulatory_affairs
    deliverable: "Documentación técnica para obtención de permisos de acceso y conexión"
    deliverable_en: "Technical documentation for access and connection permit applications"
    type: tangible
    is_must: true
    frequency: baja
    health_hint: "La documentación técnica incompleta es la causa más frecuente de retrasos en permisos renovables"

  - id: tx_d05
    from: regulatory_affairs
    to: energy_director
    deliverable: "Alertas de cambio regulatorio con impacto en ingresos regulados o permisos"
    deliverable_en: "Regulatory change alerts with impact on regulated revenues or permits"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "En el sector energético, un cambio regulatorio puede alterar el modelo de negocio en 90 días"

  - id: tx_d06
    from: energy_trader
    to: energy_director
    deliverable: "Posición de mercado, exposición al precio y resultado de la cartera de generación"
    deliverable_en: "Market position, price exposure and generation portfolio results"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "La posición de mercado sin visibilidad del director expone a la empresa a riesgos no autorizados"

  - id: tx_d07
    from: demand_forecaster
    to: renewables_developer
    deliverable: "Análisis de curvas de demanda y huecos de generación para dimensionar nuevos proyectos"
    deliverable_en: "Demand curve analysis and generation gaps for sizing new projects"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "Un proyecto renovable bien dimensionado para el hueco real del sistema maximiza el retorno del activo"

  - id: tx_d08
    from: customer_ops_energy
    to: energy_director
    deliverable: "Incidencias de suministro reportadas por clientes y patrones de reclamación"
    deliverable_en: "Supply incidents reported by clients and complaint patterns"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Las reclamaciones de clientes son el sensor más temprano de problemas de red que aún no han llegado al SCADA"

  - id: tx_d09
    from: grid_engineer
    to: renewables_developer
    deliverable: "Condiciones técnicas de conexión y capacidad de evacuación disponible por zona"
    deliverable_en: "Technical connection conditions and available evacuation capacity by area"
    type: tangible
    is_must: true
    frequency: baja
    health_hint: "Desarrollar un proyecto renovable sin verificar capacidad de evacuación es el error más costoso del sector"

  - id: tx_d10
    from: maintenance_engineer_energy
    to: energy_trader
    deliverable: "Disponibilidad real de cada activo de generación para el despacho del día siguiente"
    deliverable_en: "Actual availability of each generation asset for next-day dispatch"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Ofertar en el mercado diario un activo que no va a estar disponible es una penalización garantizada"

  - id: tx_d11
    from: regulatory_affairs
    to: renewables_developer
    deliverable: "Hoja de ruta de permisos, plazos estimados y riesgos de denegación"
    deliverable_en: "Permit roadmap, estimated timelines and denial risks"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "Sin roadmap de permisos claro, el developer no puede comprometer fechas a inversores ni bancos"

  - id: tx_d12
    from: energy_trader
    to: demand_forecaster
    deliverable: "Señales de precio de mercado que impactan en comportamiento de demanda"
    deliverable_en: "Market price signals impacting demand behaviour"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Los precios extremos de mercado modifican la demanda industrial; el forecaster que no los conoce se equivoca en picos"

  - id: tx_d13
    from: customer_ops_energy
    to: energy_trader
    deliverable: "Volumen de contratos a precio fijo y plazo de vencimiento para cobertura de cartera"
    deliverable_en: "Fixed-price contract volume and maturity schedule for portfolio hedging"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "El trader que no conoce la cartera de contratos minoristas no puede cubrir correctamente el riesgo de precio"

  - id: tx_d14
    from: renewables_developer
    to: maintenance_engineer_energy
    deliverable: "Manual de operación y mantenimiento del nuevo activo y plan de puesta en servicio"
    deliverable_en: "Operation and maintenance manual for new asset and commissioning plan"
    type: tangible
    is_must: true
    frequency: baja
    health_hint: "Un activo entregado sin O&M manual obliga a mantenimiento a aprenderlo en producción a coste elevado"

  - id: tx_d15
    from: energy_director
    to: grid_engineer
    deliverable: "Prioridades de inversión en red y activos a mantener o retirar"
    deliverable_en: "Network investment priorities and assets to maintain or decommission"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "Sin prioridades claras de inversión el ingeniero de red parchea lo urgente y pospone lo importante"

patterns:
  - name: "Silos de Mercado y Red"
    description: "El trader optimiza la posición de mercado sin conocer las restricciones técnicas de la red. El ingeniero de red gestiona restricciones sin visibilidad de la posición de mercado. El resultado son desbalances costosos y restricciones sorpresa."
    signal: "Costes de restricciones técnicas elevados; penalizaciones por desbalance frecuentes"

  - name: "El Cuello de Botella de Permisos"
    description: "Los proyectos renovables se bloquean sistemáticamente en la fase de permisos porque la documentación técnica y la estrategia regulatoria no están coordinadas desde el inicio del desarrollo."
    signal: "Tiempo medio de obtención de permisos > 3 años; proyectos paralizados en espera de resolución administrativa"

  - name: "Mantenimiento vs. Disponibilidad"
    description: "El ingeniero de mantenimiento programa paradas sin coordinación con el trader y el ingeniero de red. Las ventanas de mantenimiento se eligen por comodidad operativa, no por minimizar impacto en el despacho."
    signal: "Paradas de mantenimiento coincidentes con precios de mercado elevados; pérdida de ingresos evitable"

  - name: "Forecast de Demanda Decorativo"
    description: "El área de previsión produce modelos sofisticados que el trading usa informalmente y el developer ignora. Las decisiones de inversión en nueva capacidad siguen basándose en intuición del director."
    signal: "Proyectos desarrollados en zonas con baja demanda o alta congestión detectables con los modelos disponibles"

  - name: "Cliente Final Invisible para la Red"
    description: "Las incidencias de suministro que reportan los clientes finales se gestionan como problema de atención al cliente pero no retroalimentan a ingeniería de red. El patrón de reclamaciones contiene información de red valiosa que se pierde."
    signal: "Reclamaciones repetidas en la misma zona geográfica sin acción de refuerzo de red"

---

## Suministro de Energía — Contexto VNA

El sector energético (CNAE 35) opera en la intersección de tres redes simultáneas: la **red física** (cables, transformadores, turbinas), la **red de mercado** (precios, posiciones, coberturas) y la **red regulatoria** (permisos, retribuciones, obligaciones). La VNA aplicada a este sector hace visible cómo estas tres redes se interconectan a través de flujos de información que raramente están formalizados.

### Dinámicas de Red de Valor

La paradoja central del sector energético es la **simultaneidad de producción y consumo**: la electricidad no se puede almacenar a gran escala (todavía), lo que convierte cada decisión de despacho, mantenimiento o trading en una decisión de red con consecuencias en tiempo real. Un flujo de información roto entre mantenimiento y trading puede costar más en una hora que en un mes de operación normal.

La **transición energética** está creando una capa nueva de complejidad en la red de valor: los proyectos renovables implican un ciclo de desarrollo de 4-7 años con múltiples nodos (developer, regulatorio, financiero, técnico) que deben mantener flujos coherentes a través del tiempo.

### Bilingüe / Bilingual

Energy sector VNA maps consistently reveal that the most expensive information gap is between trading and grid operations. When a trader positions assets without knowing real-time technical constraints, and a grid engineer manages congestion without visibility of trading positions, the result is systematic value destruction that appears on the P&L as "market costs" but is actually a coordination failure. Formalising this single bidirectional flow typically reduces balancing costs by 10-15%.
