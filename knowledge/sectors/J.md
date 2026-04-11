---
sector_id: J
sector_name: "Información y Comunicaciones"
sector_name_en: "Information & Communication"
cnae: "58-63"
version: "v11.1"
tags: ["media", "editorial", "comunicacion", "telecomunicaciones", "plataformas", "contenidos", "publicidad"]

roles:
  - id: editorial_director
    name: "Director Editorial / de Contenidos"
    name_en: "Editorial / Content Director"
    description: "Define la línea editorial, la estrategia de contenidos y los estándares de calidad informativa o creativa. Voz y criterio de la organización."
    description_en: "Defines editorial line, content strategy and quality standards for news or creative output. Voice and judgment of the organisation."
    castell_level: pom_de_dalt
    fmv_usd_h: 85
    typical_actor: "Periodista o creador de contenidos senior con experiencia en gestión de equipos y medición de audiencias"
    typical_actor_en: "Senior journalist or content creator with team management and audience measurement experience"
    tags: ["editorial", "contenidos", "estrategia"]

  - id: journalist_creator
    name: "Periodista / Creador de Contenido"
    name_en: "Journalist / Content Creator"
    description: "Investiga, produce y publica contenidos informativos o de entretenimiento. Nodo creativo central de la red de valor mediática."
    description_en: "Researches, produces and publishes news or entertainment content. Central creative node of the media value network."
    castell_level: tronc
    fmv_usd_h: 38
    typical_actor: "Periodista o creador con especialización temática y audiencia propia"
    typical_actor_en: "Journalist or creator with thematic specialisation and own audience"
    tags: ["contenido", "periodismo", "creacion"]

  - id: audience_analyst
    name: "Analista de Audiencia y Datos"
    name_en: "Audience & Data Analyst"
    description: "Mide, interpreta y comunica el comportamiento de la audiencia: engagement, retención, conversión y tendencias de consumo."
    description_en: "Measures, interprets and communicates audience behaviour: engagement, retention, conversion and consumption trends."
    castell_level: tronc
    fmv_usd_h: 52
    typical_actor: "Analista de datos con experiencia en medios digitales y herramientas de web analytics"
    typical_actor_en: "Data analyst with digital media experience and web analytics tools proficiency"
    tags: ["audiencia", "datos", "engagement"]

  - id: ad_sales_manager
    name: "Director de Publicidad y Patrocinios"
    name_en: "Advertising & Sponsorship Director"
    description: "Monetiza la audiencia a través de publicidad, branded content y patrocinios. Gestiona la relación con agencias y anunciantes directos."
    description_en: "Monetises audience through advertising, branded content and sponsorships. Manages agency and direct advertiser relationships."
    castell_level: tronc
    fmv_usd_h: 65
    typical_actor: "Comercial de medios con experiencia en programmatic, branded content y negociación con agencias"
    typical_actor_en: "Media sales professional with programmatic, branded content and agency negotiation experience"
    tags: ["publicidad", "monetizacion", "patrocinios"]

  - id: product_digital_media
    name: "Product Manager de Plataforma Digital"
    name_en: "Digital Platform Product Manager"
    description: "Define y evoluciona la experiencia de usuario en las plataformas digitales del medio: web, app, newsletter, podcast."
    description_en: "Defines and evolves user experience on the media's digital platforms: web, app, newsletter, podcast."
    castell_level: tronc
    fmv_usd_h: 68
    typical_actor: "Product manager con experiencia en medios digitales, UX y modelos de suscripción"
    typical_actor_en: "Product manager with digital media, UX and subscription model experience"
    tags: ["producto", "plataforma", "UX"]

  - id: subscription_manager
    name: "Responsable de Suscripciones y Retención"
    name_en: "Subscriptions & Retention Manager"
    description: "Gestiona el ciclo de vida del suscriptor: adquisición, activación, retención y win-back. Responsable del MRR del medio."
    description_en: "Manages the subscriber lifecycle: acquisition, activation, retention and win-back. Responsible for media MRR."
    castell_level: tronc
    fmv_usd_h: 55
    typical_actor: "Especialista en CRM, lifecycle marketing y modelos de suscripción de medios"
    typical_actor_en: "Specialist in CRM, lifecycle marketing and media subscription models"
    tags: ["suscripciones", "retencion", "MRR"]

  - id: tech_infrastructure
    name: "Responsable de Infraestructura Tecnológica"
    name_en: "Technology Infrastructure Manager"
    description: "Opera y escala la infraestructura digital: servidores, CDN, CMS y herramientas de distribución de contenido. Garantiza disponibilidad y velocidad."
    description_en: "Operates and scales digital infrastructure: servers, CDN, CMS and content distribution tools. Ensures availability and speed."
    castell_level: tronc
    fmv_usd_h: 62
    typical_actor: "Ingeniero de sistemas o DevOps con experiencia en plataformas de medios de alto tráfico"
    typical_actor_en: "Systems engineer or DevOps with high-traffic media platform experience"
    tags: ["tecnologia", "infraestructura", "CMS"]

  - id: community_moderator
    name: "Gestor de Comunidad y Moderación"
    name_en: "Community Manager & Moderator"
    description: "Cultiva la relación con la audiencia en redes sociales y plataformas propias. Modera contenido, responde menciones y activa la comunidad."
    description_en: "Cultivates audience relationships on social media and owned platforms. Moderates content, responds to mentions and activates community."
    castell_level: pinya
    fmv_usd_h: 24
    typical_actor: "Perfil joven con dominio de redes sociales, redacción rápida y alta tolerancia al conflicto online"
    typical_actor_en: "Young profile with social media proficiency, fast copywriting and high tolerance for online conflict"
    tags: ["comunidad", "redes-sociales", "moderacion"]

transactions:
  - id: tx_j01
    from: audience_analyst
    to: editorial_director
    deliverable: "Informe de rendimiento editorial: qué contenidos funcionan, con quién y cuándo"
    deliverable_en: "Editorial performance report: which content works, with whom and when"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "La editorial que ignora los datos de audiencia produce para sí misma, no para su lectora"

  - id: tx_j02
    from: journalist_creator
    to: editorial_director
    deliverable: "Propuestas de contenido, exclusivas e investigaciones en curso"
    deliverable_en: "Content proposals, exclusives and ongoing investigations"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "Sin pipeline creativo visible la dirección planifica en el vacío"

  - id: tx_j03
    from: editorial_director
    to: journalist_creator
    deliverable: "Línea editorial, prioridades de cobertura y estándares de calidad"
    deliverable_en: "Editorial line, coverage priorities and quality standards"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Sin criterio editorial explícito cada periodista optimiza para su propia audiencia, fragmentando la marca"

  - id: tx_j04
    from: audience_analyst
    to: subscription_manager
    deliverable: "Segmentos de audiencia con mayor propensión a suscribirse y patrones de conversión"
    deliverable_en: "Audience segments with highest subscription propensity and conversion patterns"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Campañas de suscripción sin segmentación de propensión tienen un CAC 3x mayor"

  - id: tx_j05
    from: subscription_manager
    to: editorial_director
    deliverable: "Temas y formatos que retienen mejor a los suscriptores de pago"
    deliverable_en: "Topics and formats that best retain paying subscribers"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "La editorial que no sabe qué contenidos retienen suscriptores produce para visitas únicas, no para leales"

  - id: tx_j06
    from: ad_sales_manager
    to: editorial_director
    deliverable: "Restricciones comerciales: contenidos que afectan a anunciantes clave"
    deliverable_en: "Commercial constraints: content that affects key advertisers"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Cuando la publicidad condiciona la editorial sin transparencia interna se pierde la credibilidad del medio"

  - id: tx_j07
    from: editorial_director
    to: ad_sales_manager
    deliverable: "Calendario editorial y contextos premium para activaciones publicitarias"
    deliverable_en: "Editorial calendar and premium contexts for advertising activations"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "El anunciante paga más por contexto relevante; sin calendario editorial el comercial vende a ciegas"

  - id: tx_j08
    from: product_digital_media
    to: audience_analyst
    deliverable: "Datos de comportamiento de usuario en plataforma: rutas, abandono y funcionalidades usadas"
    deliverable_en: "User behaviour data on platform: journeys, drop-off and feature usage"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Sin datos de producto el analista mide resultados pero no entiende por qué"

  - id: tx_j09
    from: tech_infrastructure
    to: product_digital_media
    deliverable: "Capacidad técnica disponible, deuda técnica y restricciones de implementación"
    deliverable_en: "Available technical capacity, tech debt and implementation constraints"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "El product manager que desconoce las restricciones técnicas promete fechas imposibles"

  - id: tx_j10
    from: community_moderator
    to: audience_analyst
    deliverable: "Señales cualitativas de la audiencia: temas que generan debate, frustraciones y demandas"
    deliverable_en: "Qualitative audience signals: topics generating debate, frustrations and demands"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Los comentarios de la audiencia anticipan tendencias que los datos cuantitativos detectan semanas después"

  - id: tx_j11
    from: subscription_manager
    to: product_digital_media
    deliverable: "Puntos de fricción en el embudo de suscripción y propuestas de mejora UX"
    deliverable_en: "Friction points in the subscription funnel and UX improvement proposals"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Cada punto de fricción en el checkout de suscripción cuesta entre un 5-10% de conversión"

  - id: tx_j12
    from: journalist_creator
    to: community_moderator
    deliverable: "Contexto del contenido publicado para gestión de comentarios y preguntas"
    deliverable_en: "Context of published content for comment and question management"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "El moderador que no tiene contexto editorial modera en el vacío y comete errores de tono"

  - id: tx_j13
    from: audience_analyst
    to: product_digital_media
    deliverable: "Análisis de retención por canal de adquisición y formato de contenido"
    deliverable_en: "Retention analysis by acquisition channel and content format"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Sin datos de retención por canal el producto optimiza para cantidad de usuarios, no para calidad"

  - id: tx_j14
    from: ad_sales_manager
    to: audience_analyst
    deliverable: "Datos de CTR y viewability por segmento para optimización de inventario publicitario"
    deliverable_en: "CTR and viewability data by segment for advertising inventory optimisation"
    type: tangible
    is_must: false
    frequency: media
    health_hint: "Sin datos de rendimiento publicitario por segmento el inventario se vende a precio de comodity"

  - id: tx_j15
    from: tech_infrastructure
    to: editorial_director
    deliverable: "Alertas de caída de plataforma o degradación que impacta en publicación"
    deliverable_en: "Platform outage or degradation alerts impacting content publication"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Un CMS caído durante un evento de alta audiencia es la crisis técnica más cara del medio"

patterns:
  - name: "Editorial vs. Datos"
    description: "La redacción considera que los datos de audiencia reducen el periodismo a clickbait. El equipo de datos considera que la editorial ignora la evidencia. No existe un proceso de diálogo estructurado entre ambas lógicas."
    signal: "Contenidos con alto valor periodístico y audiencia marginal conviviendo indefinidamente con contenidos de bajo valor y alta audiencia sin conversación sobre la tensión"

  - name: "Publicidad que Condiciona Editorial"
    description: "Las restricciones comerciales sobre contenidos que afectan a anunciantes no se gestionan con transparencia. El periodista descubre la restricción cuando su artículo desaparece o no se publica."
    signal: "Autocensura implícita documentada en temas relacionados con anunciantes clave; salidas de periodistas por conflicto editorial-comercial"

  - name: "Suscriptor Captado y Olvidado"
    description: "La organización invierte en campañas de adquisición de suscriptores pero no tiene un programa de onboarding y retención. El churn se acepta como inevitable y se compensó captando más."
    signal: "Churn mensual > 5% con CAC elevado; relación LTV/CAC < 3"

  - name: "Audiencia Anónima"
    description: "El medio tiene millones de lectores pero sabe muy poco de quiénes son, qué valoran y por qué se quedan o se van. La analítica mide páginas vistas pero no construye un modelo de audiencia."
    signal: "Datos de audiencia limitados a métricas de tráfico; sin segmentación de lectores por valor, engagement o perfil"

  - name: "Tecnología como Obstáculo"
    description: "El equipo editorial percibe la plataforma tecnológica como un freno permanente. Cada mejora editorial requiere un proyecto técnico de meses. La deuda técnica acumulada hace al medio menos ágil que sus competidores nativos digitales."
    signal: "Tiempo de publicación de nuevos formatos editoriales > 3 meses; dependencia de un CMS inflexible"

---

## Información y Comunicaciones — Contexto VNA

Los medios de comunicación y las plataformas de contenidos (CNAE 58-63) operan en una red de valor con una **dualidad estructural**: sirven simultáneamente a dos mercados distintos — la audiencia (que consume contenido) y los anunciantes o suscriptores (que pagan por acceder a esa audiencia). Cuando estas dos lógicas de red entran en conflicto, el medio pierde en ambos frentes.

### Dinámicas de Red de Valor

La paradoja central del sector es que su **activo principal — la atención de la audiencia — es el resultado de flujos intangibles** (credibilidad editorial, confianza acumulada, relevancia percibida) que se construyen durante años y se destruyen en horas. La VNA mapea estos flujos intangibles que no aparecen en ningún balance pero que son el único origen sostenible de valor del medio.

El **periodista o creador** (tronc) y el **gestor de comunidad** (pinya) son los nodos que más directamente producen y mantienen el activo de atención, pero raramente reciben flujos de retorno formalizados de los datos de audiencia ni de las necesidades del suscriptor. Cuando estos flujos se establecen, la calidad editorial y la retención mejoran simultáneamente.

### Bilingüe / Bilingual

Media VNA maps surface the same structural tension across markets: the newsroom believes data degrades journalism; the analytics team believes the newsroom ignores evidence. The solution is not to choose sides but to formalise the bidirectional flow between both — editorial feeding audience analysis with context, and audience data feeding editorial with signal. Organisations that institutionalise this dialogue typically see a 15-25% improvement in subscriber retention within two quarters.
