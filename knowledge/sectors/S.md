---
sector_id: S
sector_name: "Otros Servicios (Arte, Deporte, Cultura y Servicios Personales)"
sector_name_en: "Other Services (Arts, Sport, Culture & Personal Services)"
cnae: "90-96"
version: "v11.1"
tags: ["deporte", "cultura", "arte", "entretenimiento", "servicios-personales", "eventos", "economia-creativa"]

roles:
  - id: artistic_director
    name: "Director Artístico / Cultural"
    name_en: "Artistic / Cultural Director"
    description: "Define la visión artística o cultural de la organización, selecciona la programación y establece los estándares creativos."
    description_en: "Defines the artistic or cultural vision of the organisation, selects the programme and sets creative standards."
    castell_level: pom_de_dalt
    fmv_usd_h: 72
    typical_actor: "Artista, curador o gestor cultural con trayectoria reconocida en el sector"
    typical_actor_en: "Artist, curator or cultural manager with recognised sector trajectory"
    tags: ["vision", "programacion", "creatividad"]

  - id: sports_coach
    name: "Entrenador / Director Técnico Deportivo"
    name_en: "Coach / Sports Technical Director"
    description: "Diseña y ejecuta el plan de entrenamiento, gestiona el rendimiento deportivo del equipo o del deportista individual."
    description_en: "Designs and executes the training plan, manages the sporting performance of the team or individual athlete."
    castell_level: tronc
    fmv_usd_h: 45
    typical_actor: "Técnico deportivo con titulación federativa o universitaria en ciencias del deporte"
    typical_actor_en: "Sports technician with federation or university sports science qualification"
    tags: ["entrenamiento", "rendimiento", "equipo"]

  - id: athlete_artist
    name: "Deportista / Artista Profesional"
    name_en: "Professional Athlete / Artist"
    description: "Ejecuta la propuesta de valor central de la organización deportiva o cultural. Su rendimiento o creatividad es el producto que la audiencia consume."
    description_en: "Executes the central value proposition of the sports or cultural organisation. Their performance or creativity is the product the audience consumes."
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "Profesional con carrera activa en su disciplina deportiva o artística"
    typical_actor_en: "Active professional in their sport or artistic discipline"
    tags: ["rendimiento", "creacion", "talento"]

  - id: events_production
    name: "Productor / Jefe de Producción de Eventos"
    name_en: "Events Producer / Production Manager"
    description: "Coordina todos los elementos técnicos, logísticos y creativos para que el espectáculo o competición llegue al público con la calidad comprometida."
    description_en: "Coordinates all technical, logistical and creative elements so that the show or competition reaches the audience at the committed quality level."
    castell_level: tronc
    fmv_usd_h: 52
    typical_actor: "Productor con experiencia en gestión de grandes eventos en vivo"
    typical_actor_en: "Producer with large live event management experience"
    tags: ["produccion", "eventos", "logistica"]

  - id: sponsorship_manager
    name: "Responsable de Patrocinios e Imagen de Marca"
    name_en: "Sponsorship & Brand Image Manager"
    description: "Desarrolla y gestiona los acuerdos de patrocinio, naming rights y brand partnerships. Monetiza el activo de audiencia y visibilidad."
    description_en: "Develops and manages sponsorship agreements, naming rights and brand partnerships. Monetises the audience and visibility asset."
    castell_level: tronc
    fmv_usd_h: 55
    typical_actor: "Comercial con experiencia en marketing deportivo o cultural y negociación de derechos"
    typical_actor_en: "Sales professional with sports or cultural marketing and rights negotiation experience"
    tags: ["patrocinios", "marca", "derechos"]

  - id: audience_engagement
    name: "Responsable de Audiencia y Experiencia del Fan"
    name_en: "Audience & Fan Experience Manager"
    description: "Diseña y gestiona la experiencia del espectador o fan: acreditaciones, programas de fidelización, acceso y experiencia en el recinto."
    description_en: "Designs and manages the spectator or fan experience: accreditations, loyalty programmes, access and on-site experience."
    castell_level: tronc
    fmv_usd_h: 38
    typical_actor: "Especialista en experiencia de cliente con conocimiento del sector cultural o deportivo"
    typical_actor_en: "Customer experience specialist with cultural or sports sector knowledge"
    tags: ["audiencia", "fan", "experiencia"]

  - id: personal_trainer_therapist
    name: "Entrenador Personal / Terapeuta"
    name_en: "Personal Trainer / Therapist"
    description: "Presta servicios de entrenamiento, salud o bienestar de forma individualizada. Nodo de alta confianza en la red de servicios personales."
    description_en: "Provides individualised training, health or wellbeing services. High-trust node in the personal services network."
    castell_level: pinya
    fmv_usd_h: 35
    typical_actor: "Profesional certificado en su especialidad (TAFAD, fisioterapia, nutrición, coaching)"
    typical_actor_en: "Certified professional in their specialty (fitness, physiotherapy, nutrition, coaching)"
    tags: ["personal", "salud", "bienestar"]

  - id: content_rights_manager
    name: "Gestor de Derechos y Contenidos Digitales"
    name_en: "Rights & Digital Content Manager"
    description: "Gestiona los derechos de retransmisión, streaming y distribución de contenido. Maximiza los ingresos de derechos en mercados nacionales e internacionales."
    description_en: "Manages broadcasting, streaming and content distribution rights. Maximises rights income in national and international markets."
    castell_level: tronc
    fmv_usd_h: 62
    typical_actor: "Especialista en derechos audiovisuales con experiencia en negociación de contratos de distribución"
    typical_actor_en: "Audiovisual rights specialist with content distribution contract negotiation experience"
    tags: ["derechos", "streaming", "distribucion"]

transactions:
  - id: tx_s01
    from: sports_coach
    to: athlete_artist
    deliverable: "Plan de entrenamiento individualizado, feedback técnico y gestión de carga"
    deliverable_en: "Individualised training plan, technical feedback and load management"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "Sin feedback técnico individualizado el deportista o artista no puede mejorar de forma sostenida"

  - id: tx_s02
    from: athlete_artist
    to: sports_coach
    deliverable: "Feedback subjetivo de rendimiento, sensaciones físicas y estado emocional"
    deliverable_en: "Subjective performance feedback, physical sensations and emotional state"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "El entrenador que no escucha al deportista sobreentrenar o infraentrena; los datos objetivos sin feedback subjetivo son insuficientes"

  - id: tx_s03
    from: artistic_director
    to: events_production
    deliverable: "Concepto artístico, rider técnico y estándares de producción del espectáculo"
    deliverable_en: "Artistic concept, technical rider and show production standards"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Una producción que no entiende el concepto artístico produce espectáculos técnicamente correctos pero artísticamente vacíos"

  - id: tx_s04
    from: events_production
    to: artistic_director
    deliverable: "Restricciones técnicas y presupuestarias que condicionan la producción del concepto"
    deliverable_en: "Technical and budget constraints shaping the production of the concept"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "El director artístico que desconoce los límites de producción diseña conceptos irrealizables"

  - id: tx_s05
    from: audience_engagement
    to: artistic_director
    deliverable: "Datos de satisfacción del público, preferencias de programación y tendencias de asistencia"
    deliverable_en: "Audience satisfaction data, programming preferences and attendance trends"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "La programación puramente artística sin señal de audiencia puede ser excelente y vaciar la sala"

  - id: tx_s06
    from: sponsorship_manager
    to: artistic_director
    deliverable: "Restricciones y oportunidades comerciales que afectan a la programación y la imagen"
    deliverable_en: "Commercial constraints and opportunities affecting programming and image"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "El patrocinio que no se integra con la visión artística produce activaciones que degradan la marca cultural"

  - id: tx_s07
    from: artistic_director
    to: sponsorship_manager
    deliverable: "Propuesta de valor artística y datos de audiencia para argumentario de patrocinio"
    deliverable_en: "Artistic value proposition and audience data for sponsorship pitch"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "El comercial de patrocinios sin argumentario artístico vende visibilidad como cualquier soporte publicitario convencional"

  - id: tx_s08
    from: content_rights_manager
    to: artistic_director
    deliverable: "Oportunidades de distribución digital y condiciones de derechos para nuevas producciones"
    deliverable_en: "Digital distribution opportunities and rights conditions for new productions"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "Las producciones diseñadas sin considerar los derechos digitales pierden ingresos de distribución evitables"

  - id: tx_s09
    from: personal_trainer_therapist
    to: audience_engagement
    deliverable: "Programas de bienestar y actividad para miembros o fans en plataformas del club"
    deliverable_en: "Wellbeing and activity programmes for members or fans on club platforms"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Los servicios de bienestar integrados en la propuesta de valor aumentan la retención de socios y fans"

  - id: tx_s10
    from: audience_engagement
    to: sponsorship_manager
    deliverable: "Datos de perfil de audiencia y engagement para propuestas de patrocinio segmentadas"
    deliverable_en: "Audience profile and engagement data for targeted sponsorship proposals"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "El patrocinador paga más por acceso a audiencia definida; sin datos de perfil se vende impacto genérico"

  - id: tx_s11
    from: events_production
    to: audience_engagement
    deliverable: "Plan de aforos, accesos, logística de entrada y experiencias especiales en el recinto"
    deliverable_en: "Capacity plan, access, venue entry logistics and special in-venue experiences"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "La experiencia del fan en el recinto se decide en producción; si no hay coordinación con audience se pierde la oportunidad"

  - id: tx_s12
    from: athlete_artist
    to: audience_engagement
    deliverable: "Contenido auténtico para redes sociales y activaciones de comunidad de fans"
    deliverable_en: "Authentic content for social media and fan community activations"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "El contenido generado por el propio deportista o artista tiene un engagement 5x superior al producido por el equipo de comunicación"

  - id: tx_s13
    from: content_rights_manager
    to: events_production
    deliverable: "Requisitos técnicos de las plataformas de retransmisión para el evento en vivo"
    deliverable_en: "Technical requirements from broadcast platforms for the live event"
    type: tangible
    is_must: false
    frequency: media
    health_hint: "Producir un evento sin cumplir los requisitos técnicos del broadcaster impide la retransmisión o reduce la calidad"

  - id: tx_s14
    from: sponsorship_manager
    to: audience_engagement
    deliverable: "Activaciones de patrocinio integradas en la experiencia del fan que aporten valor real"
    deliverable_en: "Sponsorship activations integrated into the fan experience that deliver real value"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "La activación de patrocinio que interrumpe en lugar de enriquecer la experiencia del fan daña ambas marcas"

  - id: tx_s15
    from: personal_trainer_therapist
    to: sports_coach
    deliverable: "Estado físico del deportista, limitaciones de carga y progreso en recuperación de lesión"
    deliverable_en: "Athlete physical status, load limitations and injury recovery progress"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "El entrenador que no conoce el estado físico real del deportista asigna carga que genera lesión o recaída"

patterns:
  - name: "Arte vs. Comercio"
    description: "La dirección artística y el área comercial operan con lógicas irreconciliables sin un proceso de diálogo estructurado. Los patrocinios se rechazan por incompatibilidad con la visión artística sin análisis de alternativas; o se aceptan compromisos que degradan la propuesta artística sin consultarla."
    signal: "Conflictos recurrentes entre dirección artística y patrocinios; decisiones comerciales que sorprenden al área artística"

  - name: "El Deportista como Recurso, no como Nodo"
    description: "El deportista o artista es tratado como un activo a optimizar, no como un nodo con conocimiento y feedback valioso. Sus señales de sobreentrenamiento, motivación o disconformidad no tienen canal formal de expresión antes de convertirse en lesión, rendimiento caído o salida."
    signal: "Alta tasa de lesiones musculares; rendimiento irregular sin causa técnica aparente; abandono del deportista"

  - name: "Producción y Experiencia de Fan Desconectadas"
    description: "El equipo de producción del evento y el responsable de experiencia del fan no se coordinan. La producción optimiza la ejecución técnica del espectáculo; la experiencia del fan optimiza la satisfacción del espectador. Cuando no se hablan, el resultado es un evento técnicamente impecable con una experiencia de asistencia frustrante."
    signal: "Alta satisfacción con el espectáculo / contenido y baja satisfacción con la experiencia de asistencia al recinto"

  - name: "Derechos Digitales como Ocurrencia Tardía"
    description: "Las producciones culturales o deportivas se planifican sin considerar la distribución digital hasta que ya están ejecutadas. Los derechos se ceden en condiciones desfavorables por falta de negociación anticipada."
    signal: "Ingresos de derechos digitales < 15% del total de ingresos en producciones con audiencia digital significativa"

  - name: "Fidelización sin Programa"
    description: "La organización acumula fans y seguidores pero no tiene un programa de fidelización estructurado. La relación con el fan es transaccional (entrada por entrada) sin construcción de vínculo a largo plazo."
    signal: "Alta asistencia puntual con baja renovación de abonos; engagement en redes alto pero conversión a producto de pago baja"

---

## Arte, Deporte, Cultura y Servicios Personales — Contexto VNA

El sector de otros servicios (CNAE 90-96) agrupa organizaciones cuyo **producto es la experiencia, el rendimiento o el bienestar**, dimensiones que no pueden estandarizarse completamente y que dependen críticamente de la calidad de los flujos de valor entre sus nodos.

### Dinámicas de Red de Valor

La paradoja central del sector es que su **activo más valioso — el talento del deportista, la visión del artista, la confianza del cliente de servicios personales — es simultáneamente el más difícil de gestionar**. Los flujos que mantienen y desarrollan este talento son mayoritariamente intangibles (feedback técnico, autonomía creativa, reconocimiento, seguridad emocional) y raramente aparecen en ningún contrato o proceso formal.

El **deportista o artista** (tronc) no es solo ejecutor sino nodo con información crítica sobre su propio rendimiento, limitaciones y potencial. Cuando las organizaciones fuerzan una relación unidireccional (coach→deportista sin flujo de retorno) pierden la señal más valiosa que tienen para prevenir lesiones, gestionar la motivación y optimizar el rendimiento.

### Economía Creativa y Derechos Digitales

La transición digital ha creado una nueva capa de valor en la economía creativa: los derechos de distribución, streaming y contenido digital. La VNA aplicada a organizaciones culturales y deportivas hace visible cuándo estos derechos se gestionan de forma desconectada de la producción y la audiencia, generando ingresos subóptimos y pérdida de activos estratégicos.

### Bilingüe / Bilingual

Sports and arts VNA maps share a universal pattern across cultures: the performer — athlete, musician, actor — holds real-time knowledge about their own physical and creative state that is more predictive of future performance than any external metric. Organisations that formalise upward feedback flows from performers to coaches and artistic directors consistently show lower injury rates, lower talent turnover and higher creative output quality.
