---
sector_id: M
sector_name: "Actividades Inmobiliarias"
sector_name_en: "Real Estate Activities"
cnae: "68"
version: "v11.1"
tags: ["inmobiliaria", "promotora", "gestion-patrimonial", "alquiler", "tasacion", "proptech"]

roles:
  - id: promotor_developer
    name: "Promotor Inmobiliario"
    name_en: "Property Developer"
    description: "Origina y lidera proyectos de desarrollo inmobiliario: suelo, financiación, proyecto, construcción y comercialización."
    description_en: "Originates and leads property development projects: land, financing, design, construction and sales."
    castell_level: pom_de_dalt
    fmv_usd_h: 95
    typical_actor: "Empresario inmobiliario o director de promoción con visión de ciclo completo"
    typical_actor_en: "Real estate entrepreneur or development director with full-cycle vision"
    tags: ["promocion", "desarrollo", "suelo"]

  - id: property_manager
    name: "Gestor de Patrimonio / Property Manager"
    name_en: "Property Manager"
    description: "Gestiona activos inmobiliarios en alquiler: contratos, mantenimiento, relación con inquilinos y optimización de la rentabilidad."
    description_en: "Manages rental real estate assets: contracts, maintenance, tenant relations and yield optimisation."
    castell_level: tronc
    fmv_usd_h: 52
    typical_actor: "Gestor de activos con conocimiento jurídico básico y habilidades de relación con inquilinos"
    typical_actor_en: "Asset manager with basic legal knowledge and tenant relationship skills"
    tags: ["gestion", "alquiler", "activos"]

  - id: real_estate_agent
    name: "Agente Inmobiliario"
    name_en: "Real Estate Agent"
    description: "Intermedia en compraventa y alquiler de inmuebles. Gestiona la captación, visitas y negociación entre partes."
    description_en: "Intermediates in property sales and rentals. Manages acquisition, viewings and negotiation between parties."
    castell_level: tronc
    fmv_usd_h: 35
    typical_actor: "Agente con conocimiento del mercado local, habilidades de negociación y certificación API"
    typical_actor_en: "Agent with local market knowledge, negotiation skills and professional certification"
    tags: ["agente", "intermediacion", "negociacion"]

  - id: valuation_expert
    name: "Tasador / Valorador"
    name_en: "Valuation Expert / Appraiser"
    description: "Determina el valor de mercado de activos inmobiliarios. Su informe es la base de operaciones financieras y transacciones."
    description_en: "Determines the market value of real estate assets. Their report is the basis for financial transactions and deals."
    castell_level: tronc
    fmv_usd_h: 60
    typical_actor: "Arquitecto técnico o titulado con habilitación como tasador homologado (ECO/805/2003)"
    typical_actor_en: "Technical architect or qualified professional with certified appraiser accreditation"
    tags: ["tasacion", "valoracion", "mercado"]

  - id: technical_director
    name: "Director Técnico / de Obra"
    name_en: "Technical Director / Site Manager"
    description: "Supervisa la construcción o rehabilitación del activo: calidades, plazos, coste y recepción técnica."
    description_en: "Supervises the construction or refurbishment of the asset: quality, timelines, cost and technical handover."
    castell_level: tronc
    fmv_usd_h: 68
    typical_actor: "Arquitecto o ingeniero de edificación con experiencia en dirección de obra"
    typical_actor_en: "Architect or building engineer with site management experience"
    tags: ["obra", "tecnico", "calidad"]

  - id: commercial_sales
    name: "Director Comercial de Ventas"
    name_en: "Sales Director"
    description: "Lidera la comercialización de la promoción o del portfolio de activos. Gestiona el equipo de ventas y los canales."
    description_en: "Leads the commercialisation of the development or asset portfolio. Manages the sales team and channels."
    castell_level: tronc
    fmv_usd_h: 58
    typical_actor: "Director de ventas inmobiliarias con experiencia en obra nueva o activos singulares"
    typical_actor_en: "Real estate sales director with new build or special assets experience"
    tags: ["ventas", "comercializacion", "portfolio"]

  - id: legal_urban_planner
    name: "Jurídico Urbanístico"
    name_en: "Legal & Urban Planning Specialist"
    description: "Gestiona licencias, permisos urbanísticos, due diligence jurídica y contratos. Convierte suelo en proyecto construible."
    description_en: "Manages licences, planning permissions, legal due diligence and contracts. Converts land into buildable project."
    castell_level: tronc
    fmv_usd_h: 72
    typical_actor: "Abogado urbanista o consultor de planeamiento con experiencia en gestión de suelo"
    typical_actor_en: "Planning lawyer or consultant with land management experience"
    tags: ["juridico", "urbanismo", "licencias"]

  - id: proptech_analyst
    name: "Analista Proptech / Datos de Mercado"
    name_en: "Proptech / Market Data Analyst"
    description: "Analiza datos de mercado inmobiliario, tendencias de precios y oportunidades de inversión mediante herramientas digitales."
    description_en: "Analyses real estate market data, price trends and investment opportunities using digital tools."
    castell_level: pinya
    fmv_usd_h: 42
    typical_actor: "Analista de datos con conocimiento de herramientas proptech y mercado inmobiliario"
    typical_actor_en: "Data analyst with proptech tools knowledge and real estate market understanding"
    tags: ["datos", "mercado", "proptech"]

transactions:
  - id: tx_m01
    from: valuation_expert
    to: promotor_developer
    deliverable: "Informe de tasación del suelo o activo con valor de mercado y análisis residual"
    deliverable_en: "Land or asset appraisal report with market value and residual analysis"
    type: tangible
    is_must: true
    frequency: baja
    health_hint: "Una tasación optimista de suelo es la semilla del mayor riesgo en promoción inmobiliaria"

  - id: tx_m02
    from: legal_urban_planner
    to: promotor_developer
    deliverable: "Due diligence jurídico-urbanística: cargas, edificabilidad y riesgos del suelo"
    deliverable_en: "Legal and planning due diligence: encumbrances, buildability and land risks"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "Comprar suelo sin due diligence completa es la decisión más cara del ciclo promotor"

  - id: tx_m03
    from: technical_director
    to: promotor_developer
    deliverable: "Informe de avance de obra: coste ejecutado, desviaciones y riesgos técnicos"
    deliverable_en: "Construction progress report: executed cost, deviations and technical risks"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Las desviaciones de obra detectadas tarde se multiplican; el informe semanal es mínimo viable"

  - id: tx_m04
    from: commercial_sales
    to: promotor_developer
    deliverable: "Ritmo de ventas, reservas y feedback de cliente sobre producto"
    deliverable_en: "Sales pace, reservations and client product feedback"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Un promotor sin datos de ventas en tiempo real no puede ajustar producto ni precio hasta que es tarde"

  - id: tx_m05
    from: proptech_analyst
    to: promotor_developer
    deliverable: "Análisis de mercado: absorción, precios competidores y perfil de demanda por zona"
    deliverable_en: "Market analysis: absorption rate, competitor pricing and demand profile by area"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Lanzar precio sin análisis de mercado es apostar; con análisis es inversión"

  - id: tx_m06
    from: promotor_developer
    to: technical_director
    deliverable: "Presupuesto objetivo, plazos inamovibles y estándares de calidad del producto"
    deliverable_en: "Target budget, fixed deadlines and product quality standards"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "El director técnico que no tiene límites claros optimiza calidad a costa de plazo y coste"

  - id: tx_m07
    from: real_estate_agent
    to: commercial_sales
    deliverable: "Pipeline de compradores cualificados y feedback sobre objeciones del mercado"
    deliverable_en: "Qualified buyer pipeline and market objection feedback"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "Las objeciones del agente al cliente son el market research más barato y más ignorado"

  - id: tx_m08
    from: property_manager
    to: promotor_developer
    deliverable: "Experiencia de uso del activo: defectos postventa, demandas de inquilinos y costes de mantenimiento"
    deliverable_en: "Asset use experience: post-sale defects, tenant demands and maintenance costs"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "El promotor que no aprende de la vida útil de sus activos repite los mismos errores de diseño"

  - id: tx_m09
    from: legal_urban_planner
    to: technical_director
    deliverable: "Licencia de obras concedida y condicionantes técnicos de la normativa urbanística"
    deliverable_en: "Granted building permit and technical conditions from planning regulations"
    type: tangible
    is_must: true
    frequency: baja
    health_hint: "Comenzar obra sin licencia en firme es el riesgo legal más frecuente y más evitable"

  - id: tx_m10
    from: valuation_expert
    to: property_manager
    deliverable: "Valoración actualizada del portfolio para reporting a inversores o refinanciación"
    deliverable_en: "Updated portfolio valuation for investor reporting or refinancing"
    type: tangible
    is_must: false
    frequency: baja
    health_hint: "Un portfolio sin valoración actualizada no puede refinanciarse ni atraer nuevos inversores"

  - id: tx_m11
    from: proptech_analyst
    to: real_estate_agent
    deliverable: "Datos de precio por metro cuadrado, tiempo en mercado y comparables recientes"
    deliverable_en: "Price per square metre data, time on market and recent comparables"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "El agente que trabaja sin datos de mercado sistematizados pierde credibilidad ante el comprador informado"

  - id: tx_m12
    from: commercial_sales
    to: proptech_analyst
    deliverable: "Datos de conversión por tipología, precio y zona para calibrar modelos de demanda"
    deliverable_en: "Conversion data by unit type, price and area to calibrate demand models"
    type: tangible
    is_must: false
    frequency: media
    health_hint: "Los modelos de demanda construidos sin datos reales de conversión predicen el pasado, no el futuro"

  - id: tx_m13
    from: technical_director
    to: commercial_sales
    deliverable: "Fechas de entrega comprometidas y estado real de avance por fase"
    deliverable_en: "Committed delivery dates and actual progress status by phase"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Vender sin fecha de entrega fiable genera litigios y daño reputacional en la siguiente promoción"

  - id: tx_m14
    from: property_manager
    to: legal_urban_planner
    deliverable: "Incidencias contractuales con inquilinos que requieren revisión jurídica"
    deliverable_en: "Contractual incidents with tenants requiring legal review"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "El conflicto con inquilino que no llega a juridico en tiempo puede convertirse en ocupación ilegal"

  - id: tx_m15
    from: promotor_developer
    to: legal_urban_planner
    deliverable: "Mandato para negociación con administración, propietarios de suelo o socios"
    deliverable_en: "Mandate for negotiation with administration, landowners or partners"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "El jurídico que negocia sin mandato claro puede comprometer posiciones que el promotor no quería ceder"

patterns:
  - name: "El Ciclo de la Información Tardía"
    description: "El promotor recibe los datos críticos (desviación de costes, caída del ritmo de ventas, problema urbanístico) cuando ya no hay margen de maniobra. Cada nodo de la red retiene información hasta que ya no puede ocultarla."
    signal: "Desviaciones de coste o plazo detectadas en fases avanzadas de obra; ventas que frenan sin alerta previa"

  - name: "Agente como Canal, no como Red"
    description: "Los agentes inmobiliarios se gestionan como canal de ventas transaccional. No existe flujo de retorno de su conocimiento de mercado hacia el promotor o el analista de datos."
    signal: "El promotor conoce su producto mejor que el mercado; precios lanzados que no absorbe el mercado en 6 meses"

  - name: "Postventa Desconectada del Diseño"
    description: "Los defectos que reporta el property manager o el inquilino no retroalimentan nunca al director técnico ni al promotor. Cada promoción repite los mismos errores constructivos."
    signal: "Reclamaciones de postventa con tipologías de defecto idénticas en promociones sucesivas"

  - name: "Due Diligence Comprimida"
    description: "En mercados alcistas, la presión por cerrar operaciones rápido comprime la due diligence jurídico-urbanística. Se compra suelo con riesgos conocidos que luego se materializan en bloqueos."
    signal: "Proyectos paralizados por problemas urbanísticos detectados después del cierre de la operación"

  - name: "Proptech sin Decisión"
    description: "La empresa tiene acceso a datos de mercado pero las decisiones de precio, producto y timing siguen tomándose por experiencia e intuición del promotor. El analista de datos produce informes que nadie usa."
    signal: "Informes de mercado generados regularmente pero no referenciados en actas de comité de inversión"

---

## Actividades Inmobiliarias — Contexto VNA

El sector inmobiliario (CNAE 68) opera en **ciclos largos con decisiones de alta irreversibilidad**: comprar suelo, obtener una licencia o construir un edificio son compromisos de capital que no se pueden deshacer en semanas. Esto hace que la calidad de los flujos de información en las fases tempranas sea crítica — los errores de información en la fase de análisis se pagan en la fase de venta.

### Dinámicas de Red de Valor

La red de valor inmobiliaria tiene una característica única: **el producto tarda entre 3 y 5 años en materializarse** desde que se origina la idea. En ese tiempo, la red de nodos (promotor, técnico, jurídico, comercial, agente) debe mantener flujos de información coherentes a través de cambios de mercado, regulatorios y de demanda. La VNA hace visible cuándo estos flujos se rompen antes de que el daño sea irreparable.

El nodo del **agente inmobiliario** acumula conocimiento de mercado de altísimo valor — qué busca el comprador hoy, qué objeciones tiene, qué compara — pero raramente existe un flujo formal hacia el promotor o hacia el analista de datos. Este conocimiento se pierde con cada operación.

### Bilingüe / Bilingual

Real estate VNA maps reveal a structural information asymmetry: developers have deep knowledge of their product but limited real-time knowledge of buyer behaviour and market shifts. The agent and the property manager hold this knowledge but have no formalised channel to feed it back. When this reverse flow is established, projects are adapted faster to demand, reducing time-to-sell by 20-30% in soft markets.
