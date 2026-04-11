---
sector_id: UV
sector_name: "Organismos Extraterritoriales e Internacionales"
sector_name_en: "Extraterritorial & International Organisations"
cnae: "99"
version: "v11.1"
tags: ["organismos-internacionales", "ONG", "diplomacia", "cooperacion-internacional", "multilateral", "ayuda-humanitaria"]

roles:
  - id: programme_director
    name: "Director de Programa / Misión"
    name_en: "Programme / Mission Director"
    description: "Lidera la estrategia y la ejecución del mandato de la organización en un territorio o área temática. Interlocutor con gobiernos, donantes y socios."
    description_en: "Leads the strategy and execution of the organisation's mandate in a territory or thematic area. Interlocutor with governments, donors and partners."
    castell_level: pom_de_dalt
    fmv_usd_h: 95
    typical_actor: "Profesional senior de cooperación internacional, diplomacia o gestión de ayuda humanitaria"
    typical_actor_en: "Senior international cooperation, diplomacy or humanitarian aid management professional"
    tags: ["programa", "mandato", "liderazgo"]

  - id: field_coordinator
    name: "Coordinador de Campo / Terreno"
    name_en: "Field Coordinator"
    description: "Opera directamente en el terreno: coordina equipos locales, gestiona la seguridad y asegura la entrega del programa a los beneficiarios."
    description_en: "Operates directly in the field: coordinates local teams, manages security and ensures programme delivery to beneficiaries."
    castell_level: tronc
    fmv_usd_h: 52
    typical_actor: "Profesional de campo con experiencia en contextos de crisis, desarrollo o emergencia humanitaria"
    typical_actor_en: "Field professional with crisis, development or humanitarian emergency context experience"
    tags: ["campo", "coordinacion", "seguridad"]

  - id: donor_relations
    name: "Responsable de Relaciones con Donantes"
    name_en: "Donor Relations Manager"
    description: "Gestiona la relación con donantes institucionales (UE, USAID, AECID, Naciones Unidas) y privados. Asegura el reporting y la renovación de financiación."
    description_en: "Manages relationships with institutional donors (EU, USAID, AECID, UN) and private donors. Ensures reporting and funding renewal."
    castell_level: tronc
    fmv_usd_h: 65
    typical_actor: "Especialista en fundraising institucional con conocimiento de ciclos de proyectos y requisitos de donantes"
    typical_actor_en: "Institutional fundraising specialist with project cycle and donor requirement knowledge"
    tags: ["donantes", "financiacion", "reporting"]

  - id: monitoring_evaluation
    name: "Responsable de Seguimiento y Evaluación (M&E)"
    name_en: "Monitoring & Evaluation Officer (M&E)"
    description: "Diseña e implementa los sistemas de medición de impacto del programa. Asegura que los datos de campo informan las decisiones estratégicas."
    description_en: "Designs and implements programme impact measurement systems. Ensures field data informs strategic decisions."
    castell_level: tronc
    fmv_usd_h: 58
    typical_actor: "Especialista en evaluación de programas de desarrollo con métodos cuantitativos y cualitativos"
    typical_actor_en: "Development programme evaluation specialist with quantitative and qualitative methods"
    tags: ["M&E", "impacto", "evaluacion"]

  - id: local_partner
    name: "Socio Local / Contraparte Nacional"
    name_en: "Local Partner / National Counterpart"
    description: "Organización local que ejecuta el programa con la organización internacional. Tiene el conocimiento del contexto y la legitimidad comunitaria que el actor externo no puede tener."
    description_en: "Local organisation that executes the programme with the international organisation. Holds the context knowledge and community legitimacy the external actor cannot have."
    castell_level: tronc
    fmv_usd_h: 22
    typical_actor: "ONG, asociación comunitaria o institución pública local con presencia en el área de intervención"
    typical_actor_en: "NGO, community association or local public institution with presence in the intervention area"
    tags: ["local", "contraparte", "comunidad"]

  - id: diplomat_liaison
    name: "Enlace Diplomático / Político"
    name_en: "Diplomatic / Political Liaison"
    description: "Gestiona la relación con las autoridades del país anfitrión, negocia el acceso humanitario y asegura la protección jurídica del personal."
    description_en: "Manages the relationship with host country authorities, negotiates humanitarian access and ensures the legal protection of staff."
    castell_level: tronc
    fmv_usd_h: 78
    typical_actor: "Diplomático, oficial político o legal con experiencia en negociación con autoridades en contextos frágiles"
    typical_actor_en: "Diplomat, political or legal officer with authority negotiation experience in fragile contexts"
    tags: ["diplomacia", "acceso", "proteccion"]

  - id: logistics_humanitarian
    name: "Coordinador de Logística Humanitaria"
    name_en: "Humanitarian Logistics Coordinator"
    description: "Gestiona la cadena de suministro en contextos de crisis: adquisición, transporte, almacenamiento y distribución de ayuda en condiciones adversas."
    description_en: "Manages the supply chain in crisis contexts: procurement, transport, storage and aid distribution in adverse conditions."
    castell_level: tronc
    fmv_usd_h: 48
    typical_actor: "Especialista en logística humanitaria con experiencia en zonas de conflicto o desastres"
    typical_actor_en: "Humanitarian logistics specialist with conflict zone or disaster experience"
    tags: ["logistica", "cadena-suministro", "humanitaria"]

  - id: beneficiary_community
    name: "Comunidad Beneficiaria"
    name_en: "Beneficiary Community"
    description: "Receptor final del programa pero también fuente de conocimiento sobre sus propias necesidades, prioridades y capacidades. Nodo activo, no pasivo."
    description_en: "Final recipient of the programme but also source of knowledge about their own needs, priorities and capacities. Active node, not passive."
    castell_level: pinya
    fmv_usd_h: null
    typical_actor: "Población objetivo del programa: comunidad rural, desplazados, refugiados, grupo vulnerable específico"
    typical_actor_en: "Programme target population: rural community, displaced persons, refugees, specific vulnerable group"
    tags: ["beneficiarios", "comunidad", "participacion"]

transactions:
  - id: tx_uv01
    from: monitoring_evaluation
    to: programme_director
    deliverable: "Datos de progreso del programa: indicadores de resultado e impacto con análisis de desviaciones"
    deliverable_en: "Programme progress data: outcome and impact indicators with deviation analysis"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "El director que no consume datos M&E en tiempo real toma decisiones estratégicas con información de hace 6 meses"

  - id: tx_uv02
    from: field_coordinator
    to: programme_director
    deliverable: "Informe de situación en terreno: avances, obstáculos, riesgos de seguridad y cambios de contexto"
    deliverable_en: "Field situation report: progress, obstacles, security risks and context changes"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "El contexto de una operación humanitaria puede cambiar en horas; el reporte de campo es la línea de vida de la estrategia"

  - id: tx_uv03
    from: local_partner
    to: field_coordinator
    deliverable: "Conocimiento del contexto local: dinámicas comunitarias, actores clave y riesgos no documentados"
    deliverable_en: "Local context knowledge: community dynamics, key actors and undocumented risks"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "El programa diseñado sin el conocimiento del socio local fracasa en la implementación aunque sea técnicamente perfecto"

  - id: tx_uv04
    from: donor_relations
    to: programme_director
    deliverable: "Condiciones del donante: prioridades estratégicas, restricciones de uso de fondos y plazos de reporte"
    deliverable_en: "Donor conditions: strategic priorities, fund use restrictions and reporting deadlines"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "El programa que no conoce las restricciones del donante produce resultados no elegibles y pierde financiación"

  - id: tx_uv05
    from: programme_director
    to: donor_relations
    deliverable: "Resultados del programa y narrativa de impacto para reporting a donantes"
    deliverable_en: "Programme results and impact narrative for donor reporting"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Un informe a donante que no conecta resultados con el impacto esperado compromete la renovación de financiación"

  - id: tx_uv06
    from: beneficiary_community
    to: field_coordinator
    deliverable: "Feedback sobre la relevancia y calidad de los servicios recibidos y necesidades no cubiertas"
    deliverable_en: "Feedback on the relevance and quality of services received and unmet needs"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "El programa que no escucha a sus beneficiarios entrega lo que planificó, no lo que se necesita"

  - id: tx_uv07
    from: diplomat_liaison
    to: programme_director
    deliverable: "Análisis político y de acceso: qué áreas son accesibles, qué autoridades deben consultarse y qué riesgos políticos gestionar"
    deliverable_en: "Political and access analysis: which areas are accessible, which authorities to consult and what political risks to manage"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Operar sin análisis político en contextos frágiles puede poner en riesgo al personal y a los beneficiarios"

  - id: tx_uv08
    from: logistics_humanitarian
    to: field_coordinator
    deliverable: "Estado de la cadena de suministro: disponibilidad de ayuda, restricciones de acceso y tiempos de entrega"
    deliverable_en: "Supply chain status: aid availability, access restrictions and delivery timelines"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "El coordinador que planifica distribuciones sin información logística genera promesas a la comunidad que no puede cumplir"

  - id: tx_uv09
    from: monitoring_evaluation
    to: local_partner
    deliverable: "Herramientas de recolección de datos adaptadas al contexto local y formación en su uso"
    deliverable_en: "Data collection tools adapted to the local context and training in their use"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "Las herramientas de M&E diseñadas sin considerar la capacidad del socio local generan datos de baja calidad"

  - id: tx_uv10
    from: local_partner
    to: monitoring_evaluation
    deliverable: "Datos de campo recolectados con las herramientas del programa y alertas sobre inconsistencias"
    deliverable_en: "Field data collected with programme tools and alerts on inconsistencies"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Los datos de M&E que no pasan por el socio local tienen sesgos de observación que ningún análisis puede corregir"

  - id: tx_uv11
    from: diplomat_liaison
    to: logistics_humanitarian
    deliverable: "Permisos de movimiento y acceso negociados con autoridades para operaciones logísticas"
    deliverable_en: "Movement and access permits negotiated with authorities for logistics operations"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Un convoy sin permiso en vigor en zona de conflicto es un riesgo de seguridad y un incidente diplomático"

  - id: tx_uv12
    from: beneficiary_community
    to: local_partner
    deliverable: "Participación en el diseño y adaptación del programa desde las necesidades reales de la comunidad"
    deliverable_en: "Participation in programme design and adaptation based on real community needs"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "La comunidad que participa en el diseño de su propio programa tiene tasas de adopción 3 veces superiores"

  - id: tx_uv13
    from: field_coordinator
    to: monitoring_evaluation
    deliverable: "Observaciones cualitativas de campo que los indicadores cuantitativos no capturan"
    deliverable_en: "Qualitative field observations that quantitative indicators do not capture"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Los datos cuantitativos muestran qué está pasando; las observaciones cualitativas explican por qué"

  - id: tx_uv14
    from: logistics_humanitarian
    to: programme_director
    deliverable: "Restricciones logísticas que condicionan el alcance y la velocidad de implementación del programa"
    deliverable_en: "Logistics constraints conditioning the scope and implementation speed of the programme"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "El programa diseñado sin restricciones logísticas crea compromisos ante donantes que la operación no puede cumplir"

  - id: tx_uv15
    from: donor_relations
    to: monitoring_evaluation
    deliverable: "Marco lógico y indicadores comprometidos ante el donante para calibración del sistema M&E"
    deliverable_en: "Logical framework and indicators committed to the donor for M&E system calibration"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "Un sistema M&E que no mide los indicadores comprometidos ante el donante produce informes inútiles para la rendición de cuentas"

patterns:
  - name: "Programa sin Beneficiario"
    description: "La organización diseña y ejecuta el programa según su mandato y las condiciones del donante, pero el mecanismo de feedback de la comunidad beneficiaria es consultivo y simbólico. El programa entrega lo planificado aunque ya no responda a las necesidades reales."
    signal: "Alta ejecución de presupuesto con baja satisfacción de beneficiarios en evaluaciones externas"

  - name: "Socio Local como Subcontratista"
    description: "El socio local ejecuta actividades definidas por la organización internacional sin poder influir en el diseño, la priorización ni la adaptación del programa. Su conocimiento del contexto no alimenta la estrategia; solo ejecuta."
    signal: "Conflictos recurrentes entre organización internacional y socio local sobre pertinencia de actividades; rotación alta de socios locales"

  - name: "M&E para el Donante, no para el Aprendizaje"
    description: "El sistema de seguimiento y evaluación está diseñado para producir los informes que el donante requiere, no para generar aprendizaje interno. Los datos se recolectan, se reportan y se archivan sin modificar la implementación."
    signal: "Informes de M&E sin sección de lecciones aprendidas accionadas; mismos errores de implementación en programas consecutivos"

  - name: "Sede Central vs. Terreno"
    description: "La sede central diseña la estrategia con información de segunda mano mientras el equipo de campo opera con restricciones de contexto que la sede no comprende. Las decisiones estratégicas llegan al terreno desconectadas de la realidad operativa."
    signal: "Alta tensión entre equipos de campo y sede central; decisiones de sede que el campo debe reinterpretar para ser implementables"

  - name: "Dependencia de Financiador Único"
    description: "El programa —o la organización completa— depende de un único donante o de una única fuente de financiación. Cuando cambian las prioridades del donante o se reduce el presupuesto, la organización entra en crisis sin capacidad de reacción."
    signal: "Un solo donante representa > 60% del presupuesto; ausencia de estrategia de diversificación de financiación"

---

## Organismos Extraterritoriales e Internacionales — Contexto VNA

Los organismos extraterritoriales (CNAE 99) — organizaciones internacionales, misiones diplomáticas, ONGs internacionales y agencias de cooperación — operan en redes de valor con una complejidad única: **múltiples cadenas de rendición de cuentas simultáneas** (hacia donantes, hacia beneficiarios, hacia el gobierno anfitrión, hacia la sede central) que a menudo tienen objetivos parcialmente contradictorios.

### Dinámicas de Red de Valor

La paradoja central de las organizaciones internacionales es la **brecha entre el mandato (diseñado en sede o en negociación con donantes) y la realidad del terreno** (vivida por los equipos de campo y los beneficiarios). Esta brecha se gestiona o se amplía a través de los flujos de información entre terreno y sede, entre socio local y coordinador internacional.

El **socio local** (tronc) y la **comunidad beneficiaria** (pinya) son los nodos con el conocimiento más valioso — entienden el contexto, hablan el idioma, conocen las dinámicas de poder local — pero raramente tienen poder para modificar el diseño del programa. La VNA hace visible esta asimetría y los flujos que podrían corregirla.

### Rendición de Cuentas como Red

En el sector, la rendición de cuentas fluye casi exclusivamente hacia arriba (hacia donantes y sede) y raramente hacia abajo (hacia beneficiarios y socios locales). La VNA aplicada a organizaciones internacionales propone formalizar los flujos de accountability descendente como mecanismo de mejora de impacto.

### Bilingüe / Bilingual

International organisation VNA maps consistently reveal a structural accountability gap: information flows upward to donors and headquarters with high fidelity, while feedback from beneficiaries and local partners rarely reaches programme designers with enough weight to change decisions. Organisations that formalise downward accountability flows — treating beneficiary feedback as a strategic input rather than a compliance exercise — consistently achieve higher programme adoption rates and better development outcomes.
