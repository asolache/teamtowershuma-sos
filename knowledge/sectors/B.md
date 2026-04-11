---
sector_id: B
sector_name: "Industrias Extractivas"
sector_name_en: "Mining & Quarrying"
cnae: "05-09"
version: "v11.1"
tags: ["mineria", "extraccion", "canteras", "petroleo", "gas", "minerales", "industria-extractiva"]

roles:
  - id: mine_director
    name: "Director de Mina / Yacimiento"
    name_en: "Mine / Site Director"
    description: "Responsable de la operación total del yacimiento: producción, seguridad, medio ambiente y rentabilidad. Interlocutor con la administración minera."
    description_en: "Responsible for the total operation of the site: production, safety, environment and profitability. Interlocutor with the mining authority."
    castell_level: pom_de_dalt
    fmv_usd_h: 105
    typical_actor: "Ingeniero de minas con experiencia en gestión de operaciones extractivas y permisos"
    typical_actor_en: "Mining engineer with extractive operations management and permits experience"
    tags: ["liderazgo", "produccion", "seguridad"]

  - id: geologist
    name: "Geólogo / Geofísico de Exploración"
    name_en: "Exploration Geologist / Geophysicist"
    description: "Caracteriza el yacimiento, modela los recursos y reservas, y guía las decisiones de perforación y extracción con base científica."
    description_en: "Characterises the deposit, models resources and reserves, and guides drilling and extraction decisions on a scientific basis."
    castell_level: tronc
    fmv_usd_h: 78
    typical_actor: "Geólogo con especialización en recursos minerales o hidrocarburos y modelado de yacimientos"
    typical_actor_en: "Geologist specialised in mineral resources or hydrocarbons and deposit modelling"
    tags: ["geologia", "exploracion", "reservas"]

  - id: mining_engineer_ops
    name: "Ingeniero de Operaciones Mineras"
    name_en: "Mining Operations Engineer"
    description: "Diseña y optimiza los métodos de extracción, voladuras y transporte interno. Maximiza la recuperación minimizando el coste y el riesgo geomecánico."
    description_en: "Designs and optimises extraction methods, blasting and internal transport. Maximises recovery while minimising cost and geomechanical risk."
    castell_level: tronc
    fmv_usd_h: 72
    typical_actor: "Ingeniero de minas con experiencia en minería a cielo abierto o subterránea según el yacimiento"
    typical_actor_en: "Mining engineer with open-pit or underground mining experience depending on the deposit"
    tags: ["operaciones", "voladura", "extraccion"]

  - id: hse_mine
    name: "Técnico de Seguridad Minera y Medio Ambiente"
    name_en: "Mine Safety & Environmental Technician"
    description: "Gestiona la prevención de riesgos laborales mineros (ITC vigentes), el plan de restauración ambiental y el monitoreo de impactos."
    description_en: "Manages mining occupational risk prevention (current ITCs), the environmental restoration plan and impact monitoring."
    castell_level: tronc
    fmv_usd_h: 58
    typical_actor: "Técnico PRL especializado en minería y técnico ambiental con conocimiento de legislación extractiva"
    typical_actor_en: "HSE specialist with mining focus and environmental technician with extractive regulation knowledge"
    tags: ["seguridad", "PRL", "medioambiente", "restauracion"]

  - id: metallurgist
    name: "Metalurgista / Técnico de Proceso"
    name_en: "Metallurgist / Process Technician"
    description: "Optimiza el proceso de beneficio del mineral: trituración, flotación, lixiviación o fundición para maximizar la recuperación del metal o mineral útil."
    description_en: "Optimises the mineral processing: crushing, flotation, leaching or smelting to maximise recovery of the useful metal or mineral."
    castell_level: tronc
    fmv_usd_h: 68
    typical_actor: "Ingeniero metalúrgico o de procesos con especialización en el tipo de mineral del yacimiento"
    typical_actor_en: "Metallurgical or process engineer specialised in the deposit mineral type"
    tags: ["proceso", "beneficio", "recuperacion"]

  - id: drilling_operator
    name: "Operador de Perforación / Maquinista"
    name_en: "Drilling Operator / Machine Operator"
    description: "Opera los equipos de perforación, carga y transporte en la mina. Ejecuta el plan de extracción con precisión y seguridad."
    description_en: "Operates drilling, loading and transport equipment in the mine. Executes the extraction plan with precision and safety."
    castell_level: pinya
    fmv_usd_h: 30
    typical_actor: "Operador certificado con experiencia en maquinaria pesada minera y protocolos de seguridad"
    typical_actor_en: "Certified operator with heavy mining equipment and safety protocol experience"
    tags: ["perforacion", "maquinaria", "extraccion"]

  - id: community_relations
    name: "Responsable de Relaciones con la Comunidad"
    name_en: "Community Relations Manager"
    description: "Gestiona el impacto social de la operación minera: diálogo con comunidades locales, administraciones y grupos de interés. Licencia social para operar."
    description_en: "Manages the social impact of the mining operation: dialogue with local communities, administrations and stakeholders. Social licence to operate."
    castell_level: tronc
    fmv_usd_h: 62
    typical_actor: "Profesional en relaciones institucionales, RSC o comunicación con experiencia en contextos extractivos"
    typical_actor_en: "Professional in institutional relations, CSR or communications with extractive sector experience"
    tags: ["comunidad", "licencia-social", "RSC"]

  - id: mineral_economist
    name: "Economista de Recursos / Analista de Commodities"
    name_en: "Resource Economist / Commodities Analyst"
    description: "Modela la viabilidad económica del yacimiento bajo distintos escenarios de precio de commodities. Informa las decisiones de inversión y cierre."
    description_en: "Models the economic viability of the deposit under different commodity price scenarios. Informs investment and closure decisions."
    castell_level: tronc
    fmv_usd_h: 75
    typical_actor: "Economista o ingeniero con especialización en valoración de activos mineros y mercados de commodities"
    typical_actor_en: "Economist or engineer specialised in mining asset valuation and commodities markets"
    tags: ["economia", "commodities", "valoracion"]

transactions:
  - id: tx_b01
    from: geologist
    to: mine_director
    deliverable: "Actualización del modelo de recursos y reservas con implicaciones para el plan de minado"
    deliverable_en: "Resources and reserves model update with implications for the mine plan"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Las decisiones de inversión en mina basadas en un modelo de reservas desactualizado pueden comprometer la vida útil del yacimiento"

  - id: tx_b02
    from: mining_engineer_ops
    to: mine_director
    deliverable: "Plan de producción mensual: tonelaje, ley media y coste unitario estimado"
    deliverable_en: "Monthly production plan: tonnage, average grade and estimated unit cost"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Sin plan de producción formal el director no puede comprometer volumen a la fundición o al mercado"

  - id: tx_b03
    from: hse_mine
    to: mine_director
    deliverable: "Informe de seguridad: incidentes, near misses e indicadores de riesgo geomecánico"
    deliverable_en: "Safety report: incidents, near misses and geomechanical risk indicators"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "Un near miss no investigado es el precursor estadístico de un accidente grave en minería"

  - id: tx_b04
    from: drilling_operator
    to: mining_engineer_ops
    deliverable: "Datos de perforación real: velocidades, consumos y anomalías detectadas en frente"
    deliverable_en: "Actual drilling data: rates, consumption and anomalies detected at the face"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "El operador detecta cambios litológicos que el modelo geológico no anticipó; ignorarlos puede generar colapso"

  - id: tx_b05
    from: metallurgist
    to: mine_director
    deliverable: "Recuperación metalúrgica real y ajustes recomendados en el plan de extracción"
    deliverable_en: "Actual metallurgical recovery and recommended adjustments to the extraction plan"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Una caída de recuperación metalúrgica no comunicada al director transforma una mina rentable en deficitaria"

  - id: tx_b06
    from: geologist
    to: mining_engineer_ops
    deliverable: "Modelo geológico actualizado del frente de explotación para diseño de voladuras"
    deliverable_en: "Updated geological model of the exploitation face for blast design"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Las voladuras diseñadas sin modelo geológico actualizado generan fragmentación deficiente y riesgo de proyecciones"

  - id: tx_b07
    from: community_relations
    to: mine_director
    deliverable: "Estado de la licencia social: tensiones emergentes, compromisos pendientes y riesgos de conflicto"
    deliverable_en: "Social licence status: emerging tensions, pending commitments and conflict risks"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Una operación minera que pierde la licencia social puede ser paralizada legalmente aunque sea técnicamente correcta"

  - id: tx_b08
    from: mineral_economist
    to: mine_director
    deliverable: "Análisis de sensibilidad económica ante cambios de precio del commodity y tipo de cambio"
    deliverable_en: "Economic sensitivity analysis for commodity price and exchange rate changes"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Una mina que no modela escenarios de precio bajo puede encontrarse sin liquidez cuando el ciclo del commodity baja"

  - id: tx_b09
    from: hse_mine
    to: drilling_operator
    deliverable: "Permisos de trabajo y protocolos de seguridad para cada frente activo"
    deliverable_en: "Work permits and safety protocols for each active working face"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Operar sin permiso de trabajo en vigor en minería es la infracción de seguridad más frecuente y más costosa"

  - id: tx_b10
    from: mine_director
    to: community_relations
    deliverable: "Compromisos de la empresa con la comunidad: empleo local, inversión social e impactos a gestionar"
    deliverable_en: "Company commitments to the community: local employment, social investment and impacts to manage"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "Los compromisos no documentados ni comunicados son promesas que el tiempo convierte en conflictos"

  - id: tx_b11
    from: metallurgist
    to: geologist
    deliverable: "Datos de variabilidad metalúrgica por zona del yacimiento para refinar el modelo de recursos"
    deliverable_en: "Metallurgical variability data by deposit zone to refine the resource model"
    type: tangible
    is_must: false
    frequency: media
    health_hint: "El modelo de recursos que no incorpora la variabilidad metalúrgica sobreestima el valor económico del yacimiento"

  - id: tx_b12
    from: mineral_economist
    to: geologist
    deliverable: "Precio de corte económico actualizado para reclasificación de recursos en reservas"
    deliverable_en: "Updated economic cut-off grade for resource-to-reserve reclassification"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Las reservas calculadas con un precio de corte desactualizado dan una imagen falsa de la viabilidad del proyecto"

  - id: tx_b13
    from: hse_mine
    to: community_relations
    deliverable: "Datos de monitoreo ambiental: calidad del aire, agua y ruido en el perímetro de la operación"
    deliverable_en: "Environmental monitoring data: air, water and noise quality at the operation perimeter"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Los datos ambientales compartidos proactivamente con la comunidad generan más confianza que cualquier campaña de comunicación"

  - id: tx_b14
    from: drilling_operator
    to: geologist
    deliverable: "Muestras de sondeo y registros de perforación para actualización del modelo"
    deliverable_en: "Drill samples and drilling logs for model update"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Las muestras mal etiquetadas o perdidas en campo anulan semanas de trabajo geológico"

  - id: tx_b15
    from: mining_engineer_ops
    to: metallurgist
    deliverable: "Características del material extraído: granulometría, ley y contaminantes para ajuste de proceso"
    deliverable_en: "Characteristics of extracted material: particle size, grade and contaminants for process adjustment"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "El proceso metalúrgico calibrado para un tipo de mineral que ya no llega pierde recuperación silenciosamente"

patterns:
  - name: "Geología vs. Producción"
    description: "El equipo de geología actualiza el modelo de yacimiento a su ritmo científico mientras producción avanza según el plan original. Cuando la realidad geológica difiere del modelo, producción ya está comprometida con volúmenes que no puede cumplir."
    signal: "Desviaciones de ley o tonelaje > 15% respecto al plan trimestral de forma recurrente"

  - name: "La Licencia Social como Trámite"
    description: "La relación con la comunidad se gestiona como obligación regulatoria — reuniones informativas anuales y algunos compromisos de empleo local — en lugar de como construcción de confianza continua. El conflicto social estalla sin aviso porque nadie escuchaba las señales."
    signal: "Protestas o bloqueos comunitarios que sorprenden a la dirección; nula presencia del responsable de relaciones en reuniones de comunidad fuera de los períodos de conflicto"

  - name: "Seguridad vs. Producción"
    description: "Bajo presión de producción, los estándares de seguridad se erosionan gradualmente. Los permisos de trabajo se firman sin inspección real, los near misses no se reportan por miedo a paradas y los indicadores de seguridad se gestionan para parecer buenos, no para serlo."
    signal: "Reducción de near misses reportados simultánea a aumento de días perdidos por accidente; cultura de culpa individual ante incidentes"

  - name: "Commodity Price como Fuerza Mayor"
    description: "La empresa trata el precio del commodity como una variable exógena no gestionable. No existen coberturas de precio, no se modelan escenarios de precio bajo y las decisiones de inversión se toman en precio alto sin análisis de sostenibilidad en precio bajo."
    signal: "Decisiones de expansión tomadas en ciclo alto seguidas de recortes abruptos en ciclo bajo; sin programa de hedging"

  - name: "Cierre como Tabú"
    description: "La planificación del cierre de mina se pospone sistemáticamente porque reconocer la vida útil finita del yacimiento genera malestar político y social. El resultado es un cierre improvisado con costes de restauración ambiental impagables."
    signal: "Ausencia de fondo de provisión para cierre en balance; plan de restauración no actualizado en 5+ años"

---

## Industrias Extractivas — Contexto VNA

Las industrias extractivas (CNAE 05-09) operan en la intersección de tres tipos de riesgo simultáneos: **geológico** (el yacimiento no se comporta como el modelo), **de mercado** (el precio del commodity determina si la operación es viable) y **social** (la licencia para operar depende de la aceptación de la comunidad local). La VNA hace visible cómo estos tres tipos de riesgo se gestionan — o no — a través de flujos de información entre roles.

### Dinámicas de Red de Valor

La paradoja central de la minería es que **su principal activo — el yacimiento — es irreversiblemente finito**. Cada tonelada extraída reduce el activo. Esto hace que las decisiones de ritmo de extracción, recuperación metalúrgica y gestión del cierre tengan consecuencias que no se pueden revertir. La calidad de los flujos de información entre geología, operaciones, proceso y economía determina si ese activo finito se transforma en valor máximo o se destruye por errores de coordinación.

El **operador de perforación** (pinya) es el nodo con más información en tiempo real sobre el estado real del yacimiento — detecta cambios litológicos, variaciones en la dureza, humedad anómala — pero raramente existe un canal formal que lleve esa observación al geólogo antes de que el problema se materialice en producción.

### Bilingüe / Bilingual

Mining VNA maps consistently reveal a dangerous information gap between the drill operator — who observes real-time geological changes at the face — and the geologist whose model guides the extraction plan. When this upward feedback channel is formalised, mines detect geological variability early enough to adjust blast designs and extraction rates, reducing both safety incidents and production shortfalls.
