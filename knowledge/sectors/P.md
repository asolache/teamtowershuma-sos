---
sector_id: P
sector_name: "Educación Reglada (K-12)"
sector_name_en: "Formal Education (K-12)"
cnae: "85"
version: "v11.1"
tags: ["educacion", "escuela", "instituto", "docentes", "familia", "aprendizaje", "k12", "centro-educativo"]

roles:
  - id: school_director
    name: "Director / Directora del Centro"
    name_en: "School Principal"
    description: "Lidera el proyecto educativo del centro, gestiona el equipo docente y es el interlocutor con la administración educativa y las familias."
    description_en: "Leads the school's educational project, manages the teaching team and is the interlocutor with the education authority and families."
    castell_level: pom_de_dalt
    fmv_usd_h: 52
    typical_actor: "Docente con acreditación directiva y experiencia en gestión de centros educativos"
    typical_actor_en: "Teacher with management accreditation and school leadership experience"
    tags: ["liderazgo", "proyecto-educativo", "gestion"]

  - id: teacher
    name: "Docente / Tutor"
    name_en: "Teacher / Class Tutor"
    description: "Diseña y ejecuta el proceso de enseñanza-aprendizaje. Tutoriza al alumno de forma integral: académica, emocional y social."
    description_en: "Designs and executes the teaching-learning process. Provides holistic tutoring to the student: academic, emotional and social."
    castell_level: tronc
    fmv_usd_h: 32
    typical_actor: "Docente con habilitación en su especialidad y formación pedagógica"
    typical_actor_en: "Teacher with subject-matter qualification and pedagogical training"
    tags: ["enseñanza", "tutoria", "aprendizaje"]

  - id: school_counselor
    name: "Orientador / Psicopedagogo"
    name_en: "School Counsellor / Educational Psychologist"
    description: "Detecta necesidades educativas especiales, diseña adaptaciones curriculares y apoya el bienestar emocional del alumnado."
    description_en: "Identifies special educational needs, designs curricular adaptations and supports student emotional wellbeing."
    castell_level: tronc
    fmv_usd_h: 38
    typical_actor: "Psicólogo o pedagogo con especialización en orientación educativa"
    typical_actor_en: "Psychologist or educationalist specialised in school counselling"
    tags: ["orientacion", "NEE", "bienestar"]

  - id: families_community
    name: "Familias / AMPA"
    name_en: "Families / Parent Association (PTA)"
    description: "Participan en la comunidad educativa: apoyo al aprendizaje en casa, comunicación con el centro y representación en órganos de gobierno."
    description_en: "Participate in the educational community: home learning support, communication with the school and representation in governing bodies."
    castell_level: pinya
    fmv_usd_h: null
    typical_actor: "Padre o madre del alumnado con implicación variable en la vida del centro"
    typical_actor_en: "Parent or guardian with variable involvement in school life"
    tags: ["familia", "AMPA", "comunidad"]

  - id: educational_admin
    name: "Administración Educativa (Inspección)"
    name_en: "Education Authority (Inspection)"
    description: "Supervisa el cumplimiento del currículo, evalúa la calidad del centro y apoya la mejora educativa mediante inspección y asesoramiento."
    description_en: "Supervises curriculum compliance, evaluates school quality and supports educational improvement through inspection and advisory."
    castell_level: pom_de_dalt
    fmv_usd_h: 55
    typical_actor: "Inspector de educación con experiencia docente y formación en evaluación de sistemas educativos"
    typical_actor_en: "Education inspector with teaching experience and educational systems evaluation training"
    tags: ["inspeccion", "calidad", "normativa"]

  - id: support_staff
    name: "Personal de Apoyo y Auxiliar"
    name_en: "Support & Auxiliary Staff"
    description: "Gestiona administración, mantenimiento, comedor y transporte escolar. Infraestructura invisible que sostiene el funcionamiento diario del centro."
    description_en: "Manages administration, maintenance, cafeteria and school transport. Invisible infrastructure sustaining daily school operations."
    castell_level: pinya
    fmv_usd_h: 16
    typical_actor: "Personal administrativo, de mantenimiento o de servicios con conocimiento del centro"
    typical_actor_en: "Administrative, maintenance or services staff with school knowledge"
    tags: ["apoyo", "administracion", "servicios"]

  - id: ed_tech_coordinator
    name: "Coordinador TIC / Innovación Educativa"
    name_en: "EdTech / Educational Innovation Coordinator"
    description: "Integra tecnología en el proceso de enseñanza-aprendizaje, forma al claustro en herramientas digitales y gestiona la infraestructura tecnológica del centro."
    description_en: "Integrates technology into the teaching-learning process, trains staff on digital tools and manages school technology infrastructure."
    castell_level: tronc
    fmv_usd_h: 34
    typical_actor: "Docente con formación en tecnología educativa y gestión de proyectos de innovación"
    typical_actor_en: "Teacher with educational technology training and innovation project management"
    tags: ["TIC", "innovacion", "digital"]

  - id: special_needs_educator
    name: "Especialista en Educación Especial / PT"
    name_en: "Special Education Teacher / Learning Support"
    description: "Atiende al alumnado con necesidades educativas especiales mediante apoyos individualizados, adaptaciones y coordinación con familias y servicios externos."
    description_en: "Supports students with special educational needs through individualised interventions, adaptations and coordination with families and external services."
    castell_level: tronc
    fmv_usd_h: 30
    typical_actor: "Maestro de pedagogía terapéutica o especialista en audición y lenguaje"
    typical_actor_en: "Therapeutic pedagogy teacher or speech and language specialist"
    tags: ["educacion-especial", "NEE", "inclusion"]

transactions:
  - id: tx_p01
    from: teacher
    to: school_counselor
    deliverable: "Derivación de alumnado con señales de dificultad académica, emocional o social"
    deliverable_en: "Referral of students showing academic, emotional or social difficulty signals"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "La derivación tardía del docente al orientador retrasa la intervención en meses críticos del desarrollo"

  - id: tx_p02
    from: school_counselor
    to: teacher
    deliverable: "Pautas de intervención en aula y adaptaciones curriculares para alumnado con NEE"
    deliverable_en: "Classroom intervention guidelines and curricular adaptations for students with SEN"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Las pautas del orientador que no llegan al docente de forma operativa no se implementan en el aula"

  - id: tx_p03
    from: teacher
    to: families_community
    deliverable: "Información sobre progreso académico, comportamiento y bienestar del alumno"
    deliverable_en: "Information on student academic progress, behaviour and wellbeing"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "La familia que solo recibe información negativa en momentos de crisis no puede ser aliada del aprendizaje"

  - id: tx_p04
    from: families_community
    to: teacher
    deliverable: "Contexto familiar relevante para entender el comportamiento y rendimiento del alumno"
    deliverable_en: "Relevant family context for understanding student behaviour and academic performance"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "El docente que desconoce el contexto familiar interpreta síntomas sin comprender sus causas"

  - id: tx_p05
    from: school_director
    to: teacher
    deliverable: "Proyecto educativo del centro, criterios pedagógicos y objetivos del curso"
    deliverable_en: "School educational project, pedagogical criteria and course objectives"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "El claustro que no comparte un proyecto educativo coherente produce experiencias fragmentadas al alumno"

  - id: tx_p06
    from: teacher
    to: school_director
    deliverable: "Resultados de aula, dificultades detectadas y necesidades de recursos o formación"
    deliverable_en: "Classroom results, detected difficulties and resource or training needs"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "El director que no recibe feedback del aula gestiona el centro con datos de resultados, no de procesos"

  - id: tx_p07
    from: educational_admin
    to: school_director
    deliverable: "Directrices curriculares, resultados de la inspección y recursos disponibles"
    deliverable_en: "Curriculum guidelines, inspection results and available resources"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Las directrices que llegan sin contexto de aplicación generan cumplimiento formal pero no mejora real"

  - id: tx_p08
    from: school_director
    to: educational_admin
    deliverable: "Memoria anual del centro: logros, dificultades, propuestas de mejora y necesidades"
    deliverable_en: "Annual school report: achievements, challenges, improvement proposals and needs"
    type: tangible
    is_must: true
    frequency: baja
    health_hint: "La memoria que se redacta para cumplir el trámite sin reflexión genuina es burocracia, no aprendizaje institucional"

  - id: tx_p09
    from: special_needs_educator
    to: school_counselor
    deliverable: "Evolución del alumnado con NEE y ajustes recomendados en el plan de atención"
    deliverable_en: "Progress of students with SEN and recommended adjustments to the support plan"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Sin coordinación PT-orientador el plan individualizado se desactualiza y pierde efectividad"

  - id: tx_p10
    from: ed_tech_coordinator
    to: teacher
    deliverable: "Formación en herramientas digitales y recursos educativos digitales adaptados a la etapa"
    deliverable_en: "Training on digital tools and digital educational resources adapted to the school stage"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "La tecnología en el aula sin formación docente produce distracción, no aprendizaje"

  - id: tx_p11
    from: teacher
    to: special_needs_educator
    deliverable: "Observaciones de aula sobre respuesta del alumno con NEE a las adaptaciones curriculares"
    deliverable_en: "Classroom observations on SEN student response to curricular adaptations"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "El especialista que no recibe feedback del aula no puede ajustar su intervención a la realidad diaria"

  - id: tx_p12
    from: families_community
    to: school_director
    deliverable: "Propuestas de la comunidad educativa y alertas sobre necesidades no cubiertas"
    deliverable_en: "Educational community proposals and alerts on unmet needs"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "La familia que no tiene canal de participación real percibe el centro como una caja negra"

  - id: tx_p13
    from: support_staff
    to: school_director
    deliverable: "Incidencias de infraestructura, comedor, transporte y administración que afectan al funcionamiento"
    deliverable_en: "Infrastructure, cafeteria, transport and administrative incidents affecting school operations"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "Un problema de comedor o transporte no resuelto impacta en el bienestar del alumnado más que muchas decisiones pedagógicas"

  - id: tx_p14
    from: school_counselor
    to: families_community
    deliverable: "Orientación sobre apoyos externos, recursos comunitarios y pautas de acompañamiento en casa"
    deliverable_en: "Guidance on external support, community resources and home support guidelines"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "La familia que no conoce los recursos disponibles no puede complementar la intervención del centro"

  - id: tx_p15
    from: ed_tech_coordinator
    to: school_director
    deliverable: "Estado de la infraestructura TIC del centro y plan de necesidades tecnológicas"
    deliverable_en: "ICT infrastructure status and technology needs plan"
    type: tangible
    is_must: false
    frequency: baja
    health_hint: "Sin plan TIC actualizado el centro reactiva parchea sin estrategia digital coherente"

patterns:
  - name: "El Aula como Isla"
    description: "Cada docente opera con alto grado de autonomía pero sin mecanismos para compartir lo que funciona con el resto del claustro. El conocimiento pedagógico efectivo muere con el traslado o la jubilación del docente."
    signal: "Alta variabilidad en resultados entre grupos con perfiles similares; falta de práctica docente compartida"

  - name: "Familia como Destinataria, no como Aliada"
    description: "La comunicación con las familias fluye en una sola dirección: el centro informa de problemas cuando ya son graves. Las familias no tienen canal para aportar contexto relevante ni participar en el proceso de aprendizaje."
    signal: "Alta asistencia a reuniones de malos resultados; baja participación en órganos de gobierno del centro"

  - name: "Orientación Desbordada"
    description: "El orientador tiene más derivaciones de las que puede atender. Prioriza los casos más urgentes y los preventivos no se abordan. El resultado es intervención tardía sistemática."
    signal: "Ratio orientador/alumnado > 1/600; tiempo de espera para primera atención > 3 semanas"

  - name: "Innovación sin Transferencia"
    description: "Existe un coordinador TIC o un grupo de docentes innovadores pero sus proyectos no se escalan al resto del claustro. La innovación educativa es un endemismo de algunos docentes, no una práctica institucional."
    signal: "Proyectos de innovación reconocidos externamente sin impacto en los resultados generales del centro"

  - name: "Burocracia Pedagógica"
    description: "Los docentes dedican un porcentaje creciente de su tiempo a documentación administrativa (programaciones, memorias, informes) que no mejora directamente su práctica de aula ni el aprendizaje del alumnado."
    signal: "Horas de carga administrativa docente > 25% del total; percepción de que los informes se generan para cumplir, no para mejorar"

---

## Educación Reglada K-12 — Contexto VNA

La educación reglada (CNAE 85) opera en una red de valor donde el **resultado principal — el aprendizaje y desarrollo del alumno — es co-producido** por múltiples actores simultáneamente: docentes, familias, orientadores, especialistas y la propia administración. Ninguno de estos actores puede producir el resultado solo, pero raramente existe un mapa claro de cómo sus flujos de valor se interconectan.

### Dinámicas de Red de Valor

La paradoja central de la educación es la **brecha entre el tiempo del aprendizaje y el tiempo de la intervención**: los problemas se detectan semanas o meses después de que empiezan a desarrollarse. La calidad de los flujos de información entre docente, orientador, familia y especialista determina si la intervención llega a tiempo o tarde.

El **docente tutor** (tronc) es el nodo de mayor densidad en la red educativa — conecta con el alumno, la familia, el orientador, el especialista y la dirección simultáneamente. Cuando los flujos hacia y desde este nodo son de baja calidad, toda la red se degrada.

### La Familia como Nodo de Red

En educación, la familia no es solo un receptor de información: es un nodo activo que produce valor (contexto, apoyo al aprendizaje en casa, refuerzo de normas) o que destruye valor (desconexión, mensajes contradictorios, sobreprotección). La VNA hace visible esta bidireccionalidad y los flujos que la activan.

### Bilingüe / Bilingual

K-12 education VNA maps consistently reveal that the most critical information gap is between the classroom teacher and the rest of the network. Teachers observe early signals of academic, emotional and social difficulty that rarely reach the counsellor, specialist or family in a structured and timely way. Organisations that formalise these early referral flows reduce late interventions by 30-40% and improve both academic outcomes and staff wellbeing indicators.
