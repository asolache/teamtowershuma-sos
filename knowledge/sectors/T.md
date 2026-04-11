---
sector_id: T
sector_name: "Actividades de los Hogares como Empleadores"
sector_name_en: "Households as Employers"
cnae: "97-98"
version: "v11.1"
tags: ["hogar", "cuidados", "empleada-hogar", "cuidador", "dependencia", "conciliacion", "servicios-domésticos"]

roles:
  - id: household_employer
    name: "Empleador del Hogar (Familia)"
    name_en: "Household Employer (Family)"
    description: "Contrata y gestiona trabajadores domésticos o de cuidados. Define necesidades, condiciones laborales y expectativas. Único empleador sin formación en gestión de personas."
    description_en: "Hires and manages domestic or care workers. Defines needs, working conditions and expectations. Unique employer with no people management training."
    castell_level: pom_de_dalt
    fmv_usd_h: null
    typical_actor: "Familia con necesidad de cuidados de dependientes, limpieza, cocina o gestión del hogar"
    typical_actor_en: "Family with need for dependent care, cleaning, cooking or household management"
    tags: ["empleador", "hogar", "familia"]

  - id: domestic_worker
    name: "Empleada / Empleado del Hogar"
    name_en: "Domestic Worker"
    description: "Presta servicios de limpieza, cocina, plancha y gestión doméstica general. A menudo gestiona también la logística invisible del hogar."
    description_en: "Provides cleaning, cooking, ironing and general household management services. Often also manages the invisible logistics of the home."
    castell_level: pinya
    fmv_usd_h: 12
    typical_actor: "Trabajadora con experiencia doméstica, frecuentemente en situación de empleo informal o parcial"
    typical_actor_en: "Worker with domestic experience, often in informal or part-time employment situation"
    tags: ["limpieza", "hogar", "domestic"]

  - id: care_worker_elderly
    name: "Cuidador / Cuidadora de Personas Mayores"
    name_en: "Elderly Care Worker"
    description: "Asiste en actividades de la vida diaria a personas mayores o con dependencia: higiene, movilidad, alimentación, acompañamiento y estimulación cognitiva."
    description_en: "Assists elderly or dependent persons with daily living activities: hygiene, mobility, nutrition, companionship and cognitive stimulation."
    castell_level: pinya
    fmv_usd_h: 14
    typical_actor: "Trabajadora con certificado de atención sociosanitaria o experiencia familiar en cuidados"
    typical_actor_en: "Worker with social care certificate or family caregiving experience"
    tags: ["cuidados", "mayores", "dependencia"]

  - id: child_caregiver
    name: "Cuidador / Cuidadora de Menores (Au Pair / Niñera)"
    name_en: "Child Caregiver (Au Pair / Nanny)"
    description: "Cuida, educa y acompaña a menores en el hogar. Puede incluir transporte escolar, apoyo educativo y actividades de ocio."
    description_en: "Cares for, educates and accompanies children at home. May include school transport, educational support and leisure activities."
    castell_level: pinya
    fmv_usd_h: 13
    typical_actor: "Perfil joven con experiencia en cuidado de niños o au pair internacional con conocimiento de idiomas"
    typical_actor_en: "Young profile with childcare experience or international au pair with language skills"
    tags: ["menores", "niñera", "au-pair"]

  - id: home_manager
    name: "Gestora del Hogar / Personal Assistant Doméstico"
    name_en: "Home Manager / Domestic Personal Assistant"
    description: "Coordina todos los servicios y proveedores del hogar: mantenimiento, limpieza, compras y agenda familiar. Perfil profesional de alto valor en hogares complejos."
    description_en: "Coordinates all household services and providers: maintenance, cleaning, shopping and family schedule. High-value professional profile in complex households."
    castell_level: tronc
    fmv_usd_h: 28
    typical_actor: "Profesional con experiencia en gestión doméstica compleja, frecuentemente en hogares de alto nivel adquisitivo"
    typical_actor_en: "Professional with complex household management experience, frequently in high-net-worth homes"
    tags: ["gestion", "coordinacion", "PA"]

  - id: social_worker_care
    name: "Trabajador Social / Coordinador de Cuidados"
    name_en: "Social Worker / Care Coordinator"
    description: "Evalúa las necesidades de cuidado del hogar, accede a recursos públicos (SAAD, dependencia) y coordina el plan de atención con la familia y los profesionales."
    description_en: "Assesses household care needs, accesses public resources (dependency system) and coordinates the care plan with family and professionals."
    castell_level: tronc
    fmv_usd_h: 32
    typical_actor: "Trabajador social con conocimiento del sistema de dependencia y recursos comunitarios locales"
    typical_actor_en: "Social worker with dependency system and local community resource knowledge"
    tags: ["social", "dependencia", "SAAD"]

  - id: medical_specialist_home
    name: "Especialista Médico / Enfermería a Domicilio"
    name_en: "Medical Specialist / Home Nursing"
    description: "Presta atención sanitaria en el domicilio: curas, medicación, control de constantes y enlace con el sistema sanitario."
    description_en: "Provides health care at home: wound care, medication management, vital sign monitoring and liaison with the healthcare system."
    castell_level: tronc
    fmv_usd_h: 45
    typical_actor: "Enfermero o auxiliar de enfermería con experiencia en atención domiciliaria"
    typical_actor_en: "Nurse or nursing auxiliary with home care experience"
    tags: ["salud", "domicilio", "enfermeria"]

  - id: labor_advisor_home
    name: "Asesor Laboral / Gestoría del Hogar"
    name_en: "Employment Advisor / Household Payroll"
    description: "Gestiona la relación laboral con los trabajadores del hogar: contrato, nómina, cotización al SEPE y cumplimiento del régimen especial de empleadas del hogar."
    description_en: "Manages the employment relationship with household workers: contract, payroll, social security contributions and compliance with the domestic workers special regime."
    castell_level: tronc
    fmv_usd_h: 38
    typical_actor: "Gestor laboral o asesoría con experiencia en el régimen especial del sistema especial de empleadas de hogar"
    typical_actor_en: "Labour advisor or consultancy with domestic workers special social security regime experience"
    tags: ["laboral", "nomina", "contrato"]

transactions:
  - id: tx_t01
    from: household_employer
    to: domestic_worker
    deliverable: "Instrucciones claras sobre tareas, estándares de limpieza y rutinas esperadas"
    deliverable_en: "Clear instructions on tasks, cleaning standards and expected routines"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "Las expectativas no explicitadas generan el conflicto más frecuente en el empleo doméstico"

  - id: tx_t02
    from: domestic_worker
    to: household_employer
    deliverable: "Feedback sobre el estado del hogar, necesidades detectadas y limitaciones físicas del trabajo"
    deliverable_en: "Feedback on household status, detected needs and physical work limitations"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "La empleada del hogar que no puede comunicar problemas los acumula hasta la dimisión o el conflicto"

  - id: tx_t03
    from: care_worker_elderly
    to: household_employer
    deliverable: "Evolución diaria del estado de la persona cuidada: alimentación, movilidad, ánimo y alertas de salud"
    deliverable_en: "Daily progress of the cared-for person: nutrition, mobility, mood and health alerts"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "El deterioro del mayor cuidado que no llega a la familia puede derivar en urgencias hospitalarias evitables"

  - id: tx_t04
    from: medical_specialist_home
    to: care_worker_elderly
    deliverable: "Protocolo de cuidados médicos: medicación, movilizaciones y señales de alerta que requieren llamada médica"
    deliverable_en: "Medical care protocol: medication, mobilisation and alert signals requiring medical call"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Un cuidador sin protocolo médico claro administra medicación por inercia y no sabe cuándo llamar al médico"

  - id: tx_t05
    from: social_worker_care
    to: household_employer
    deliverable: "Plan de cuidados, acceso a prestaciones públicas y red de apoyos disponibles"
    deliverable_en: "Care plan, access to public benefits and available support network"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "Las familias que no conocen sus derechos de dependencia asumen solos costes que el sistema podría cubrir"

  - id: tx_t06
    from: household_employer
    to: labor_advisor_home
    deliverable: "Datos del trabajador contratado y condiciones laborales para gestión de alta y nómina"
    deliverable_en: "Hired worker data and working conditions for registration and payroll management"
    type: tangible
    is_must: true
    frequency: baja
    health_hint: "El empleo doméstico sin regularización laboral es precario para el trabajador y un riesgo legal para el empleador"

  - id: tx_t07
    from: labor_advisor_home
    to: household_employer
    deliverable: "Obligaciones laborales vigentes: salario mínimo, cotizaciones y derechos del empleado del hogar"
    deliverable_en: "Current employment obligations: minimum wage, social security contributions and domestic worker rights"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "El desconocimiento de las obligaciones laborales no exime al empleador de hogar de las sanciones por incumplimiento"

  - id: tx_t08
    from: care_worker_elderly
    to: medical_specialist_home
    deliverable: "Observaciones de cambio en el estado del mayor que requieren valoración médica"
    deliverable_en: "Observations of changes in the elderly person's condition requiring medical assessment"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "El cuidador ve al mayor 8 horas al día; su observación es el sistema de alerta temprana más efectivo disponible"

  - id: tx_t09
    from: home_manager
    to: household_employer
    deliverable: "Informe semanal de gestión: proveedores coordinados, incidencias resueltas y agenda de mantenimiento"
    deliverable_en: "Weekly management report: coordinated providers, resolved incidents and maintenance schedule"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "El gestor del hogar sin canal de reporte pierde visibilidad y el empleador no sabe si el servicio está funcionando"

  - id: tx_t10
    from: child_caregiver
    to: household_employer
    deliverable: "Resumen diario del menor: actividades, alimentación, comportamiento y cualquier incidencia"
    deliverable_en: "Daily summary of the child: activities, nutrition, behaviour and any incident"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "El padre o madre que no recibe información diaria no puede hacer seguimiento del desarrollo ni detectar problemas a tiempo"

  - id: tx_t11
    from: social_worker_care
    to: care_worker_elderly
    deliverable: "Formación básica en movilizaciones, prevención de úlceras y protocolo de emergencias"
    deliverable_en: "Basic training on mobilisation, pressure ulcer prevention and emergency protocol"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "El cuidador sin formación básica en cuidados puede hacer daño con la mejor intención"

  - id: tx_t12
    from: medical_specialist_home
    to: household_employer
    deliverable: "Informe de valoración del estado de salud y recomendaciones para la adaptación del domicilio"
    deliverable_en: "Health status assessment report and home adaptation recommendations"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "Un domicilio no adaptado a la movilidad del dependiente genera caídas y rehospitalizaciones evitables"

  - id: tx_t13
    from: household_employer
    to: care_worker_elderly
    deliverable: "Historia de vida y preferencias de la persona cuidada para personalizar la atención"
    deliverable_en: "Life history and preferences of the cared-for person for personalised care"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "El cuidado despersonalizado genera malestar en el mayor aunque sea técnicamente correcto"

  - id: tx_t14
    from: labor_advisor_home
    to: domestic_worker
    deliverable: "Información sobre sus derechos laborales: vacaciones, baja, finiquito y régimen especial"
    deliverable_en: "Information on their employment rights: holidays, sick leave, severance and special regime"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "La trabajadora del hogar que desconoce sus derechos no puede ejercerlos; la informalidad la perpetúa"

  - id: tx_t15
    from: home_manager
    to: domestic_worker
    deliverable: "Coordinación de tareas, prioridades del día y acceso a los proveedores necesarios"
    deliverable_en: "Task coordination, daily priorities and access to necessary providers"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "Sin coordinación clara entre el gestor del hogar y el personal doméstico se generan duplicidades y omisiones"

patterns:
  - name: "Empleador Involuntario"
    description: "La familia contrata trabajadores del hogar sin conocimiento de sus obligaciones como empleador: contrato, cotizaciones, vacaciones, baja. Opera de buena fe pero fuera de la ley, exponiendo a ambas partes a riesgos laborales y sancionadores."
    signal: "Empleo sin contrato escrito; ausencia de alta en régimen especial de empleadas del hogar"

  - name: "Cuidados sin Red"
    description: "La familia gestiona la situación de dependencia de un mayor de forma aislada, sin conocer los recursos públicos disponibles, sin coordinación médico-social y sin formación en cuidados. El cuidador principal (frecuentemente una mujer de la familia) asume una carga que destruye su salud y su vida laboral."
    signal: "Síndrome del cuidador quemado en familiar principal; ausencia de respiro y recursos de apoyo externos"

  - name: "Expectativas No Habladas"
    description: "El empleador del hogar tiene expectativas claras sobre cómo deben hacerse las cosas pero no las comunica explícitamente. La trabajadora adivina, interpreta y finalmente no cumple lo que nunca se le dijo. El conflicto se atribuye a la persona en lugar de al proceso."
    signal: "Alta rotación de personal doméstico; conflictos al finalizar la relación laboral por causas que nunca se verbalizaron durante la misma"

  - name: "Informalidad Estructural"
    description: "El sector del empleo doméstico opera mayoritariamente en la economía informal no por malicia sino por desconocimiento y por la fricción administrativa de la regularización. La informalidad perjudica a la trabajadora (sin derechos) y al empleador (sin protección legal)."
    signal: "Proporción de empleo doméstico sin regularizar > 40% en el entorno; uso de pagos en efectivo sin registro"

  - name: "Cuidado como Commodity"
    description: "El cuidado de personas mayores o menores se contrata por precio sin valorar la calidad de la relación, la continuidad y la personalización. La rotación de cuidadores se acepta como normal a pesar del daño que genera en la persona cuidada."
    signal: "Más de 3 cambios de cuidador en un año para la misma persona dependiente; sin protocolo de transición entre cuidadores"

---

## Actividades de los Hogares como Empleadores — Contexto VNA

Los hogares como empleadores (CNAE 97-98) constituyen el sector más invisible de la economía pero el que más directamente afecta al bienestar cotidiano de millones de personas. Su red de valor tiene características únicas: **el espacio de trabajo es el hogar privado**, el empleador no tiene formación en gestión de personas y las relaciones de poder son asimétricas y emocionalmente cargadas.

### Dinámicas de Red de Valor

La paradoja central de este sector es que **sus transacciones más críticas son las más intangibles** — la confianza entre el cuidador y el mayor, la comunicación entre la familia y la trabajadora, el conocimiento compartido sobre las necesidades del menor. Estas transacciones raramente se formalizan porque ocurren en el espacio doméstico donde los contratos parecen fuera de lugar.

El **cuidador de mayores** y la **empleada del hogar** (pinya) operan con alto nivel de autonomía en un espacio privado donde el empleador no está presente. Su conocimiento sobre el estado real de la persona cuidada o del hogar es el activo más valioso de la red, pero los canales para transmitirlo son informales y dependen de la iniciativa personal de cada parte.

### VNA en el Sector del Cuidado

La aplicación de VNA en este sector es especialmente valiosa para organizaciones que gestionan redes de cuidadores (agencias, cooperativas de cuidados, servicios de dependencia): hace visible qué flujos entre cuidador, familia, médico y coordinador social crean valor real para la persona cuidada y cuáles son ruido o burocracia.

### Bilingüe / Bilingual

Household employment VNA maps reveal that the highest-value information flow in elder care — the carer's daily observation of the dependent person's physical and emotional state — is the most informal and fragile. When care organisations formalise this upward flow through simple structured reporting, families detect health deterioration earlier, hospitalisation rates fall and carer satisfaction improves because their professional observations are finally recognised and acted upon.
