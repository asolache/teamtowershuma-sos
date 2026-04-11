---
sector_id: O
sector_name: "Administración Pública y Defensa"
sector_name_en: "Public Administration & Defence"
cnae: "84"
version: "v11.1"
tags: ["administracion-publica", "gobierno", "sector-publico", "ayuntamiento", "politica-publica", "transparencia"]

roles:
  - id: political_authority
    name: "Autoridad Política (Alcalde / Consejero / Ministro)"
    name_en: "Political Authority (Mayor / Regional Minister / Minister)"
    description: "Define las prioridades políticas, asigna el presupuesto y rinde cuentas ante la ciudadanía y los órganos de control. Nodo de legitimación de la red."
    description_en: "Defines political priorities, allocates budget and is accountable to citizens and oversight bodies. Legitimisation node of the network."
    castell_level: pom_de_dalt
    fmv_usd_h: null
    typical_actor: "Cargo electo o nombrado por el ejecutivo con mandato democrático"
    typical_actor_en: "Elected or executive-appointed official with democratic mandate"
    tags: ["politica", "liderazgo", "presupuesto"]

  - id: senior_civil_servant
    name: "Alto Funcionario / Director General"
    name_en: "Senior Civil Servant / Director General"
    description: "Traduce la voluntad política en programas, normativas y estructuras operativas. Garantiza la continuidad institucional entre mandatos."
    description_en: "Translates political will into programmes, regulations and operational structures. Ensures institutional continuity across mandates."
    castell_level: pom_de_dalt
    fmv_usd_h: 75
    typical_actor: "Funcionario de cuerpo superior con experiencia en gestión pública y derecho administrativo"
    typical_actor_en: "Senior civil service professional with public management and administrative law experience"
    tags: ["funcionario", "normativa", "continuidad"]

  - id: public_service_manager
    name: "Responsable de Servicio Público"
    name_en: "Public Service Manager"
    description: "Opera un servicio concreto (padrón, licencias, asistencia social, empleo público). Interfaz directa con el ciudadano."
    description_en: "Operates a specific public service (registry, licences, social assistance, public employment). Direct interface with citizens."
    castell_level: tronc
    fmv_usd_h: 42
    typical_actor: "Funcionario de carrera o laboral con experiencia en el servicio concreto"
    typical_actor_en: "Career or contracted civil servant with experience in the specific service"
    tags: ["servicio", "ciudadano", "gestion"]

  - id: budget_controller
    name: "Interventor / Controller de Presupuesto"
    name_en: "Budget Controller / Comptroller"
    description: "Fiscaliza la legalidad del gasto público, controla la ejecución presupuestaria y emite informes de auditoría interna."
    description_en: "Audits the legality of public expenditure, controls budget execution and issues internal audit reports."
    castell_level: tronc
    fmv_usd_h: 62
    typical_actor: "Interventor habilitado nacional o técnico de control financiero con formación jurídico-económica"
    typical_actor_en: "Nationally qualified comptroller or financial control technician with legal-economic background"
    tags: ["control", "presupuesto", "auditoria"]

  - id: legal_advisor_public
    name: "Asesor Jurídico / Secretario General"
    name_en: "Legal Advisor / General Secretary"
    description: "Garantiza la legalidad de los actos administrativos. En corporaciones locales, da fe de los acuerdos del pleno."
    description_en: "Ensures the legality of administrative acts. In local corporations, certifies plenary agreements."
    castell_level: tronc
    fmv_usd_h: 68
    typical_actor: "Secretario-interventor o letrado de la administración con habilitación nacional"
    typical_actor_en: "Secretary-comptroller or administrative lawyer with national qualification"
    tags: ["juridico", "legalidad", "secretario"]

  - id: digital_transformation_officer
    name: "Responsable de Transformación Digital"
    name_en: "Digital Transformation Officer"
    description: "Lidera la digitalización de trámites, la interoperabilidad entre administraciones y la implantación de servicios electrónicos ciudadanos."
    description_en: "Leads the digitisation of procedures, interoperability between administrations and implementation of digital citizen services."
    castell_level: tronc
    fmv_usd_h: 58
    typical_actor: "Técnico de sistemas o gestor público con experiencia en administración electrónica y Ley 39/2015"
    typical_actor_en: "Systems technician or public manager with electronic administration and digital government experience"
    tags: ["digital", "tramites", "interoperabilidad"]

  - id: citizen_relations
    name: "Técnico de Atención Ciudadana"
    name_en: "Citizen Relations Officer"
    description: "Atiende al ciudadano en ventanilla, por teléfono y por sede electrónica. Resuelve dudas, registra solicitudes y gestiona reclamaciones."
    description_en: "Serves citizens at the counter, by phone and via the electronic office. Resolves queries, registers applications and manages complaints."
    castell_level: pinya
    fmv_usd_h: 22
    typical_actor: "Funcionario de escala administrativa con vocación de servicio y conocimiento de procedimientos"
    typical_actor_en: "Administrative scale civil servant with public service vocation and procedure knowledge"
    tags: ["ciudadano", "ventanilla", "atencion"]

  - id: policy_analyst
    name: "Analista de Políticas Públicas / Evaluador"
    name_en: "Public Policy Analyst / Evaluator"
    description: "Diseña, evalúa y mejora las políticas públicas usando evidencia y datos. Nexo entre investigación académica y decisión política."
    description_en: "Designs, evaluates and improves public policies using evidence and data. Bridge between academic research and political decision."
    castell_level: tronc
    fmv_usd_h: 52
    typical_actor: "Economista, sociólogo o politólogo con experiencia en evaluación de impacto y gestión pública"
    typical_actor_en: "Economist, sociologist or political scientist with impact evaluation and public management experience"
    tags: ["politica-publica", "evaluacion", "evidencia"]

transactions:
  - id: tx_o01
    from: political_authority
    to: senior_civil_servant
    deliverable: "Prioridades políticas del mandato traducidas en objetivos de programa y asignación presupuestaria"
    deliverable_en: "Mandate political priorities translated into programme objectives and budget allocation"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "Sin prioridades explícitas el funcionario senior optimiza la continuidad, no el cambio prometido"

  - id: tx_o02
    from: senior_civil_servant
    to: political_authority
    deliverable: "Informes de viabilidad, riesgos técnicos y consecuencias no previstas de la agenda política"
    deliverable_en: "Feasibility reports, technical risks and unforeseen consequences of the political agenda"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "El político que no recibe contraste técnico toma decisiones con consecuencias que no anticipó"

  - id: tx_o03
    from: budget_controller
    to: senior_civil_servant
    deliverable: "Estado de ejecución presupuestaria, desviaciones y alertas de gasto no autorizado"
    deliverable_en: "Budget execution status, deviations and unauthorised expenditure alerts"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "La desviación presupuestaria detectada tarde compromete el ejercicio siguiente"

  - id: tx_o04
    from: legal_advisor_public
    to: senior_civil_servant
    deliverable: "Informe jurídico previo sobre legalidad de actos, convenios y contratos"
    deliverable_en: "Prior legal opinion on the legality of administrative acts, agreements and contracts"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "El acto administrativo sin informe jurídico previo es recurrible y genera inseguridad jurídica"

  - id: tx_o05
    from: citizen_relations
    to: public_service_manager
    deliverable: "Registro de consultas ciudadanas, cuellos de botella en trámites y reclamaciones frecuentes"
    deliverable_en: "Log of citizen enquiries, procedural bottlenecks and frequent complaints"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "El técnico de ventanilla conoce mejor que nadie qué trámites generan sufrimiento al ciudadano"

  - id: tx_o06
    from: public_service_manager
    to: digital_transformation_officer
    deliverable: "Mapa de trámites candidatos a digitalización con volumen, complejidad y impacto ciudadano"
    deliverable_en: "Map of procedures candidates for digitisation with volume, complexity and citizen impact"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "Digitalizar trámites de bajo impacto antes que los de alta demanda es el error más frecuente en modernización"

  - id: tx_o07
    from: digital_transformation_officer
    to: citizen_relations
    deliverable: "Formación en nuevos trámites electrónicos y guías de acompañamiento al ciudadano digital"
    deliverable_en: "Training on new electronic procedures and guides for accompanying digitally excluded citizens"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Un trámite digitalizado sin formación al personal de ventanilla genera exclusión digital del ciudadano mayor"

  - id: tx_o08
    from: policy_analyst
    to: political_authority
    deliverable: "Evaluación de impacto de políticas en curso con recomendaciones basadas en evidencia"
    deliverable_en: "Impact evaluation of current policies with evidence-based recommendations"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "La política pública que no se evalúa se convierte en gasto permanente sin justificación de impacto"

  - id: tx_o09
    from: political_authority
    to: policy_analyst
    deliverable: "Preguntas de evaluación prioritarias y acceso a datos administrativos para análisis"
    deliverable_en: "Priority evaluation questions and access to administrative data for analysis"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "Sin acceso a datos reales el evaluador trabaja con proxies que no miden lo que importa"

  - id: tx_o10
    from: senior_civil_servant
    to: public_service_manager
    deliverable: "Objetivos de servicio, indicadores de calidad y recursos asignados para el ejercicio"
    deliverable_en: "Service objectives, quality indicators and allocated resources for the period"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "Sin objetivos claros y medibles el servicio público opera por inercia, no por misión"

  - id: tx_o11
    from: public_service_manager
    to: senior_civil_servant
    deliverable: "Informe de rendimiento del servicio: tiempos de respuesta, satisfacción ciudadana e incidencias"
    deliverable_en: "Service performance report: response times, citizen satisfaction and incidents"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Sin datos de rendimiento el directivo defiende el servicio ante el político con argumentos cualitativos"

  - id: tx_o12
    from: budget_controller
    to: political_authority
    deliverable: "Informe de fiscalización con reparos a actos de gasto que superan límites o carecen de cobertura"
    deliverable_en: "Audit report with objections to expenditure acts exceeding limits or lacking coverage"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "El reparo del interventor ignorado es el origen del expediente de responsabilidad contable"

  - id: tx_o13
    from: digital_transformation_officer
    to: policy_analyst
    deliverable: "Datos administrativos estructurados y accesibles para evaluación de políticas"
    deliverable_en: "Structured and accessible administrative data for policy evaluation"
    type: tangible
    is_must: false
    frequency: baja
    health_hint: "Los datos administrativos de calidad son la mayor fuente de evaluación de política pública y raramente están accesibles"

  - id: tx_o14
    from: citizen_relations
    to: digital_transformation_officer
    deliverable: "Barreras de uso digital identificadas en contacto con ciudadano: qué trámites no se completan y por qué"
    deliverable_en: "Digital usage barriers identified in citizen contact: which procedures are not completed and why"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "El diseño de la sede electrónica desde despacho sin feedback de ventanilla produce formularios que nadie completa"

  - id: tx_o15
    from: legal_advisor_public
    to: digital_transformation_officer
    deliverable: "Marco jurídico de la administración electrónica: requisitos de firma, notificación y archivo digital"
    deliverable_en: "Legal framework for electronic administration: signature, notification and digital archiving requirements"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "La digitalización sin validez jurídica de los actos produce procedimientos que luego hay que repetir en papel"

patterns:
  - name: "Política sin Técnica"
    description: "La autoridad política toma decisiones de programa sin contrastarlas con la viabilidad técnica, jurídica y presupuestaria. El funcionario senior aprende a no dar malas noticias. Las promesas electorales se convierten en expedientes bloqueados."
    signal: "Alta tasa de proyectos aprobados políticamente que no llegan a licitación o ejecución en el mandato"

  - name: "El Funcionario de Ventanilla sin Voz"
    description: "El técnico de atención ciudadana conoce con precisión quirúrgica qué trámites generan sufrimiento, cuáles son redundantes y qué preguntas se repiten cada día. Esta información raramente llega al responsable del servicio de forma estructurada."
    signal: "Colas y tiempos de espera crónicos en los mismos trámites año tras año sin cambios"

  - name: "Evaluación de Política Decorativa"
    description: "Existe una unidad de evaluación o análisis de políticas públicas pero sus informes no modifican las decisiones políticas. La evaluación se encarga para cumplir un requisito normativo, no para aprender."
    signal: "Informes de evaluación publicados sin cambios en los programas evaluados; mismas intervenciones repetidas sin revisión"

  - name: "Digitalización sin Inclusión"
    description: "La transformación digital de la administración avanza con rapidez en trámites online pero sin estrategia de acompañamiento para ciudadanos con baja competencia digital. El ahorro de ventanilla se convierte en exclusión del ciudadano mayor o vulnerable."
    signal: "Incremento de tramitación electrónica simultáneo al aumento de reclamaciones de ciudadanos que no pueden completar trámites"

  - name: "Continuidad vs. Mandato"
    description: "Cada cambio de gobierno introduce una agenda política que el aparato funcionarial absorbe sin modificar su ritmo. El resultado es que los compromisos del programa de gobierno raramente se traducen en cambios operativos reales durante el mandato."
    signal: "Programas de gobierno con baja ejecución al final del mandato; continuidad de programas del mandato anterior sin evaluación"

---

## Administración Pública — Contexto VNA

La administración pública (CNAE 84) opera en una red de valor con una peculiaridad estructural única: **el cliente (ciudadano) y el financiador (contribuyente) son la misma persona**, pero las decisiones de qué servicios prestar y cómo se toman en un proceso político que no responde directamente a señales de mercado. Esto crea tensiones específicas en los flujos de valor que la VNA hace visibles.

### Dinámicas de Red de Valor

La paradoja central de la administración es la **brecha entre mandato político y capacidad operativa**: la autoridad política define qué debe hacerse en un plazo de semanas (programa de gobierno, presupuesto) pero la administración tarda entre 18 meses y 3 años en convertir esa decisión en un servicio operativo. La VNA mapea los flujos que aceleran o bloquean esta traducción.

El nodo más subvalorado de la red pública es el **técnico de atención ciudadana** (pinya): tiene el conocimiento más actualizado sobre qué servicios funcionan, qué trámites generan sufrimiento y qué necesidades no están cubiertas. Sin flujo formal hacia el responsable del servicio, este conocimiento se pierde con cada rotación de plantilla.

### VNA en Sector Público

Aplicar VNA en administración pública requiere adaptar el concepto de "valor" más allá del precio: los flujos de valor incluyen legitimidad democrática, confianza institucional, datos administrativos compartidos y capacidad de coordinación interadministrativa. Estos flujos intangibles son los que determinan la efectividad real de la política pública.

### Bilingüe / Bilingual

Public administration VNA consistently reveals the same structural gap: front-line staff who interact daily with citizens hold precise knowledge of which services work, which create unnecessary friction, and what citizens actually need. This knowledge never reaches service designers or policymakers through formal channels. Organisations that formalise this upward flow redesign procedures faster, reduce complaint rates and improve citizen satisfaction scores with no additional budget.
