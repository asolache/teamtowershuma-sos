---
sector_id: A
sector_name: "Agricultura, Ganadería, Silvicultura y Pesca"
sector_name_en: "Agriculture, Forestry & Fishing"
cnae: "01-03"
version: "v11.1"
tags: ["agricultura", "ganaderia", "pesca", "agro", "alimentacion", "campo", "silvicultura", "cooperativa"]

roles:
  - id: farm_owner_manager
    name: "Titular / Gerente de Explotación"
    name_en: "Farm Owner / Manager"
    description: "Toma las decisiones estratégicas de la explotación: qué producir, cuándo, con qué inversión y a qué mercado. Asume el riesgo climático, de precio y de mercado."
    description_en: "Makes strategic decisions for the holding: what to produce, when, with what investment and for which market. Bears climate, price and market risk."
    castell_level: pom_de_dalt
    fmv_usd_h: 45
    typical_actor: "Agricultor o ganadero profesional, muchas veces también propietario del suelo o arrendatario estable"
    typical_actor_en: "Professional farmer or livestock farmer, often also landowner or stable tenant"
    tags: ["gestion", "decision", "riesgo"]

  - id: agronomist
    name: "Técnico Agrónomo / Asesor de Campo"
    name_en: "Agronomist / Field Advisor"
    description: "Asesora sobre variedades, fitosanitarios, fertilización y técnicas de cultivo. Nexo entre la ciencia agronómica y la decisión del agricultor."
    description_en: "Advises on varieties, crop protection, fertilisation and cultivation techniques. Bridge between agronomic science and farmer decisions."
    castell_level: tronc
    fmv_usd_h: 42
    typical_actor: "Ingeniero agrónomo o técnico agrícola vinculado a cooperativa, casa comercial o servicio de extensión"
    typical_actor_en: "Agricultural engineer or technician linked to a cooperative, commercial house or extension service"
    tags: ["agronomia", "asesoramiento", "cultivo"]

  - id: field_worker
    name: "Trabajador de Campo / Temporero"
    name_en: "Field Worker / Seasonal Worker"
    description: "Ejecuta las labores agrícolas o ganaderas: siembra, recolección, poda, ordeño, alimentación de animales. Conocimiento táctico del terreno insustituible."
    description_en: "Executes agricultural or livestock tasks: sowing, harvesting, pruning, milking, animal feeding. Irreplaceable tactical field knowledge."
    castell_level: pinya
    fmv_usd_h: 14
    typical_actor: "Trabajador agrícola local o estacional con experiencia en el cultivo o especie específica"
    typical_actor_en: "Local or seasonal agricultural worker with experience in the specific crop or species"
    tags: ["campo", "recoleccion", "ganaderia"]

  - id: cooperative_manager
    name: "Gerente de Cooperativa Agrícola"
    name_en: "Agricultural Cooperative Manager"
    description: "Agrega la producción de socios para comercializar con mayor poder de negociación. Gestiona almacenamiento, transformación básica y acceso a mercados."
    description_en: "Aggregates member production to commercialise with greater negotiating power. Manages storage, basic processing and market access."
    castell_level: tronc
    fmv_usd_h: 52
    typical_actor: "Gestor con experiencia en dirección de cooperativas y conocimiento de mercados agroalimentarios"
    typical_actor_en: "Manager with cooperative leadership experience and agrifood market knowledge"
    tags: ["cooperativa", "comercializacion", "socios"]

  - id: agri_tech_specialist
    name: "Especialista en Agricultura de Precisión / AgriTech"
    name_en: "Precision Agriculture / AgriTech Specialist"
    description: "Implanta sensores, drones, sistemas de riego inteligente y analítica de datos para optimizar el rendimiento y reducir insumos."
    description_en: "Deploys sensors, drones, smart irrigation and data analytics to optimise yield and reduce inputs."
    castell_level: tronc
    fmv_usd_h: 55
    typical_actor: "Ingeniero agrónomo o de sistemas con especialización en tecnología aplicada al campo"
    typical_actor_en: "Agricultural or systems engineer specialised in field-applied technology"
    tags: ["agritech", "precision", "datos", "sensores"]

  - id: veterinarian
    name: "Veterinario de Campo / de Producción"
    name_en: "Field / Production Veterinarian"
    description: "Garantiza la sanidad animal, aplica protocolos de bioseguridad y gestiona el bienestar animal en explotaciones ganaderas."
    description_en: "Ensures animal health, applies biosecurity protocols and manages animal welfare on livestock holdings."
    castell_level: tronc
    fmv_usd_h: 48
    typical_actor: "Veterinario con especialización en producción animal y conocimiento de normativa de bienestar"
    typical_actor_en: "Veterinarian specialised in animal production with welfare regulation knowledge"
    tags: ["sanidad-animal", "bioseguridad", "ganaderia"]

  - id: logistics_agri
    name: "Responsable de Logística y Acopio"
    name_en: "Logistics & Collection Manager"
    description: "Coordina la recogida, clasificación, almacenamiento y transporte del producto hasta el punto de transformación o venta. Gestiona la trazabilidad."
    description_en: "Coordinates collection, grading, storage and transport of produce to processing or sales point. Manages traceability."
    castell_level: tronc
    fmv_usd_h: 36
    typical_actor: "Técnico logístico con conocimiento de cadena de frío, trazabilidad y normativa agroalimentaria"
    typical_actor_en: "Logistics technician with cold chain, traceability and agrifood regulation knowledge"
    tags: ["logistica", "acopio", "trazabilidad"]

  - id: subsidy_admin
    name: "Gestor de Ayudas y PAC"
    name_en: "Subsidies & CAP Administrator"
    description: "Tramita las ayudas de la Política Agraria Común, derechos de pago básico y subvenciones autonómicas. Asegura el cumplimiento de condicionalidad."
    description_en: "Processes Common Agricultural Policy aid, basic payment entitlements and regional subsidies. Ensures conditionality compliance."
    castell_level: pinya
    fmv_usd_h: 28
    typical_actor: "Técnico administrativo de cooperativa, OPA o asesoría agraria con conocimiento de la PAC"
    typical_actor_en: "Administrative technician at a cooperative, farmers' organisation or advisory firm with CAP knowledge"
    tags: ["PAC", "subvenciones", "ayudas"]

transactions:
  - id: tx_a01
    from: agronomist
    to: farm_owner_manager
    deliverable: "Recomendación técnica de campaña: variedad, calendario de tratamientos y fertilización"
    deliverable_en: "Technical campaign recommendation: variety, treatment calendar and fertilisation plan"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "El agricultor que ignora el asesoramiento técnico toma decisiones con el conocimiento del año anterior en un clima que ya no es el mismo"

  - id: tx_a02
    from: field_worker
    to: farm_owner_manager
    deliverable: "Estado del cultivo observado en campo: plagas emergentes, daños y anomalías"
    deliverable_en: "Crop status observed in the field: emerging pests, damage and anomalies"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "El trabajador de campo ve la plaga 2 semanas antes que cualquier sensor; si no hay canal de comunicación el agricultor actúa tarde"

  - id: tx_a03
    from: farm_owner_manager
    to: cooperative_manager
    deliverable: "Previsión de volumen y calidad de producción para planificación de acopio"
    deliverable_en: "Production volume and quality forecast for collection planning"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "La cooperativa que no tiene previsión de sus socios no puede negociar contratos con la industria ni con la distribución"

  - id: tx_a04
    from: cooperative_manager
    to: farm_owner_manager
    deliverable: "Precio de mercado, condiciones de entrega y estándares de calidad del comprador"
    deliverable_en: "Market price, delivery conditions and buyer quality standards"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "El agricultor que no conoce el precio de mercado hasta el momento de vender no puede planificar su campaña"

  - id: tx_a05
    from: veterinarian
    to: farm_owner_manager
    deliverable: "Protocolo sanitario, calendario de vacunaciones y alertas epidemiológicas"
    deliverable_en: "Sanitary protocol, vaccination calendar and epidemiological alerts"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Un brote epidémico en ganadería no contenido a tiempo puede destruir la explotación entera"

  - id: tx_a06
    from: agri_tech_specialist
    to: agronomist
    deliverable: "Datos de sensores de campo: humedad, temperatura, índices vegetativos y estrés hídrico"
    deliverable_en: "Field sensor data: moisture, temperature, vegetation indices and water stress"
    type: tangible
    is_must: false
    frequency: alta
    health_hint: "El agrónom que trabaja con datos de campo en tiempo real multiplica la precisión de sus recomendaciones"

  - id: tx_a07
    from: agronomist
    to: agri_tech_specialist
    deliverable: "Umbrales agronómicos y modelos de decisión para configurar alertas automáticas"
    deliverable_en: "Agronomic thresholds and decision models for configuring automatic alerts"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "La tecnología de precisión sin criterio agronómico genera datos sin interpretación"

  - id: tx_a08
    from: logistics_agri
    to: cooperative_manager
    deliverable: "Disponibilidad de almacén, estado de la cadena de frío y capacidad de transporte"
    deliverable_en: "Warehouse availability, cold chain status and transport capacity"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Un producto perecedero sin cadena de frío garantizada pierde valor en horas"

  - id: tx_a09
    from: subsidy_admin
    to: farm_owner_manager
    deliverable: "Estado de tramitación de ayudas PAC y documentación necesaria para cumplir condicionalidad"
    deliverable_en: "CAP aid processing status and documentation required for conditionality compliance"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Una incidencia de condicionalidad no detectada puede suponer la pérdida del 100% de la ayuda del ejercicio"

  - id: tx_a10
    from: farm_owner_manager
    to: agronomist
    deliverable: "Resultados reales de campaña: rendimiento, calidad y coste por hectárea"
    deliverable_en: "Actual campaign results: yield, quality and cost per hectare"
    type: tangible
    is_must: false
    frequency: baja
    health_hint: "Sin datos reales de resultado el agrónomo no puede mejorar sus recomendaciones para la campaña siguiente"

  - id: tx_a11
    from: cooperative_manager
    to: logistics_agri
    deliverable: "Calendario de entregas pactado con compradores y prioridades de acopio por variedad"
    deliverable_en: "Agreed delivery schedule with buyers and collection priorities by variety"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Logística que no conoce el calendario de compradores prioriza por conveniencia propia y pierde contratos"

  - id: tx_a12
    from: veterinarian
    to: cooperative_manager
    deliverable: "Certificados sanitarios y documentación de trazabilidad animal para venta"
    deliverable_en: "Health certificates and animal traceability documentation for sale"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Sin certificación sanitaria en orden el producto ganadero no puede comercializarse en mercados exigentes"

  - id: tx_a13
    from: agri_tech_specialist
    to: farm_owner_manager
    deliverable: "Informe de rendimiento por parcela y recomendación de insumos variables por zona"
    deliverable_en: "Per-plot performance report and variable input recommendation by zone"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "La agricultura de precisión sin informe accionable es tecnología cara sin ROI"

  - id: tx_a14
    from: field_worker
    to: logistics_agri
    deliverable: "Volumen y calidad real recolectada por parcela y fecha"
    deliverable_en: "Actual harvested volume and quality by plot and date"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Sin dato de recolección real la logística planifica con estimaciones que generan colas o vacíos en almacén"

  - id: tx_a15
    from: subsidy_admin
    to: agronomist
    deliverable: "Requisitos medioambientales y de buenas prácticas agrícolas exigidos por la PAC"
    deliverable_en: "Environmental and good agricultural practice requirements imposed by the CAP"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "Las recomendaciones técnicas que ignoran los condicionantes de la PAC pueden costar al agricultor sus ayudas"

patterns:
  - name: "Precio como Destino, no como Señal"
    description: "El agricultor acepta el precio que le ofrece la cooperativa o el intermediario sin información de mercado propia. La asimetría de información entre productor y distribuidor es estructural y raramente se cuestiona."
    signal: "Margen bruto del agricultor < 15% del precio final al consumidor en productos frescos sin transformación"

  - name: "El Temporero Invisible"
    description: "El trabajador de campo tiene el conocimiento más preciso sobre el estado real del cultivo pero no existe canal formal para que esa información llegue al técnico o al propietario. El saber táctico del campo muere con cada campaña."
    signal: "Plagas o problemas fitosanitarios detectados tarde de forma recurrente a pesar de la presencia diaria de trabajadores en parcela"

  - name: "Cooperativa sin Mercado"
    description: "La cooperativa agrega producción y negocia precios pero no tiene estrategia de desarrollo de mercado ni capacidad de transformación. Vende commodity a granel y no captura valor añadido."
    signal: "Precio de venta de la cooperativa consistentemente por debajo del precio de mercado; sin productos con marca o denominación propia"

  - name: "AgriTech sin Agronomía"
    description: "La explotación invierte en tecnología de precisión (sensores, drones, software) pero sin integrar el criterio agronómico en la configuración y uso de los datos. La tecnología genera información que nadie sabe interpretar."
    signal: "Inversión en agritech sin reducción medible de insumos ni mejora de rendimiento en las primeras dos campañas"

  - name: "PAC como Fin, no como Medio"
    description: "Las decisiones de cultivo se toman para maximizar ayudas PAC en lugar de para maximizar rentabilidad de mercado. La explotación se optimiza para el regulador, no para el mercado."
    signal: "Rotaciones de cultivo diseñadas para cumplir condicionalidad sin análisis de rentabilidad; dependencia de ayudas > 60% del margen total"

---

## Agricultura, Ganadería, Silvicultura y Pesca — Contexto VNA

El sector primario (CNAE 01-03) opera en la red de valor más antigua y fundamental: la que convierte recursos naturales en alimentos. Su paradoja central es que **produce el bien más esencial pero captura la menor proporción del valor en la cadena alimentaria**. La VNA aplicada al sector primario hace visible dónde se genera y dónde se transfiere ese valor.

### Dinámicas de Red de Valor

La red de valor agrícola tiene una característica temporal única: está gobernada por ciclos biológicos (la campaña, la lactación, el ciclo de cría) que no pueden comprimirse. Esto hace que la calidad de la información en las fases de planificación sea crítica — los errores de decisión en la siembra se pagan en la cosecha, meses después.

El **trabajador de campo** (pinya) es el nodo más subvalorado de la red agrícola. Su observación diaria de la parcela — el color de la hoja, el comportamiento de la plaga, el estado del suelo — es la información más valiosa y de menor latencia disponible, pero raramente existe un canal formal que lleve ese conocimiento tácito hasta el técnico o el propietario.

### Cooperativismo como Red de Valor

La cooperativa agrícola es una de las estructuras de red de valor más antiguas y eficaces para agricultores pequeños y medianos. La VNA aplicada a cooperativas hace visible qué flujos entre socios y gestión crean valor compartido y cuáles generan desconfianza y desafección.

### Bilingüe / Bilingual

Agricultural VNA maps reveal a consistent value transfer problem: farmers produce the most essential goods but capture the smallest share of the final price. The information asymmetry between producers and distributors is structural. Cooperatives that formalise market intelligence flows back to their member farmers — what buyers actually want, what quality standards are evolving, what prices competing regions are achieving — consistently improve both farm-gate prices and member loyalty.
