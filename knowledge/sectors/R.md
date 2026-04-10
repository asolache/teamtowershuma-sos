---
sector_id: R
sector_name: "Actividades Sanitarias y de Servicios Sociales"
cnae: R
sector_name_en: "Health & Social Services"
version: "v11.1"
tags: [salud, sanidad, hospital, clínica, biotech, healthtech, servicios sociales, bienestar, farmacia]

roles:
  - id: paciente-receptor
    name: Paciente / Receptor de cuidado
    description: El actor central del ecosistema sanitario. Su estado de salud es tanto el input (problema) como el output (resultado) del sistema. Su participación activa en el proceso determina en gran parte el resultado.
    castell_level: pom_de_dalt
    fmv_usd_h: null
    typical_actor: "paciente, usuario de servicios sociales, persona en cuidado"
    tags: [paciente, usuario, cuidado, salud, resultado clínico]

  - id: diagnosticador
    name: Diagnosticador
    description: Evalúa el estado del paciente y determina qué necesita. La calidad de este rol determina toda la cadena de valor posterior. Un diagnóstico errado multiplica el coste y el daño.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "médico, especialista, psicólogo clínico, trabajador social evaluador"
    tags: [diagnóstico, evaluación, especialista, medicina]

  - id: proveedor-tratamiento
    name: Proveedor de tratamiento
    description: Ejecuta la intervención terapéutica o de cuidado. Convierte protocolo clínico en acción concreta sobre el paciente. La continuidad y calidad de este rol determina el resultado.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "médico, enfermero, terapeuta, cuidador, farmacéutico"
    tags: [tratamiento, terapia, cuidado, protocolo, enfermería]

  - id: coordinador-ruta-clinica
    name: Coordinador de ruta clínica
    description: Garantiza que el paciente recorre el sistema de forma eficiente y sin pérdidas de información entre actores. El rol que convierte episodios aislados en atención continua.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "gestor de casos, coordinador de cuidados, enfermero gestor, médico de familia"
    tags: [coordinación, continuidad, gestión de casos, ruta asistencial]

  - id: proveedor-recursos-clinicos
    name: Proveedor de recursos clínicos
    description: Suministra los materiales, tecnología y medicamentos que hacen posible el tratamiento. La disponibilidad y calidad de estos recursos determina las opciones terapéuticas.
    castell_level: pinya
    fmv_usd_h: null
    typical_actor: "farmacéutica, proveedor de material sanitario, laboratorio, tecnología médica"
    tags: [farmacia, material sanitario, laboratorio, equipamiento]

  - id: guardian-calidad-etica
    name: Guardián de calidad y ética
    description: Garantiza que la práctica clínica cumple estándares de calidad, seguridad y ética. Protege al paciente y al sistema de errores y malas prácticas.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "comité de ética, dirección médica, auditor clínico, inspección sanitaria"
    tags: [calidad, ética, protocolos, seguridad del paciente, auditoría]

  - id: financiador-sistema
    name: Financiador del sistema
    description: Financia el acceso al cuidado, ya sea mediante sistema público, seguro privado o pago directo. Sus reglas determinan qué tratamientos son accesibles y para quién.
    castell_level: pom_de_dalt
    fmv_usd_h: null
    typical_actor: "sistema público de salud, mutua, seguro médico privado, paciente pagador"
    tags: [financiación, seguro, sistema público, reembolso]

  - id: generador-conocimiento-clinico
    name: Generador de conocimiento clínico
    description: Investiga, genera evidencia y traduce el avance científico en práctica clínica. El rol que asegura que el sistema mejora con el tiempo.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "investigador clínico, universidad, centro de I+D, unidad de innovación"
    tags: [investigación, evidencia clínica, I+D, innovación, protocolos]

  - id: cuidador-informal
    name: Cuidador informal
    description: Familiar o persona cercana que provee cuidado no profesional pero crítico para la recuperación y bienestar del paciente. Un actor invisible en los sistemas formales pero que sostiene el 60-70% del cuidado real.
    castell_level: pinya
    fmv_usd_h: null
    typical_actor: "familiar cuidador, red de apoyo, voluntario, vecino"
    tags: [cuidado informal, familia, red de apoyo, bienestar]

transactions:
  - id: tx-episodio-clinico
    from: paciente-receptor
    to: diagnosticador
    deliverable: "Consulta, síntomas, historial, demanda de atención"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "La accesibilidad al sistema determina si este flujo ocurre a tiempo o cuando ya es tarde."

  - id: tx-diagnostico-clinico
    from: diagnosticador
    to: proveedor-tratamiento
    deliverable: "Diagnóstico, plan terapéutico, prescripción"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Un diagnóstico tardío o incorrecto multiplica el coste del tratamiento y empeora el pronóstico."

  - id: tx-tratamiento
    from: proveedor-tratamiento
    to: paciente-receptor
    deliverable: "Intervención terapéutica, medicación, cuidado continuado"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "La continuidad del tratamiento es crítica. Abandono temprano = resultado pobre y reingreso."

  - id: tx-recursos-terapeuticos
    from: proveedor-recursos-clinicos
    to: proveedor-tratamiento
    deliverable: "Medicamentos, material sanitario, tecnología diagnóstica"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "La rotura de stock de material crítico compromete directamente la atención al paciente."

  - id: tx-financiacion-atencion
    from: financiador-sistema
    to: coordinador-ruta-clinica
    deliverable: "Cobertura del episodio, autorización de tratamiento, reembolso"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Las demoras en autorización crean gaps en la ruta clínica que deterioran el resultado."

  - id: tx-pago-prestacion
    from: paciente-receptor
    to: financiador-sistema
    deliverable: "Copago, prima de seguro, pago directo"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Barreras económicas al acceso son el mayor factor de inequidad en salud."

  - id: tx-continuidad-informacion
    from: diagnosticador
    to: coordinador-ruta-clinica
    deliverable: "Historia clínica compartida, derivación, informe de alta"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "La pérdida de información entre episodios es la causa más frecuente de errores clínicos."

  - id: tx-evidencia-clinica
    from: generador-conocimiento-clinico
    to: diagnosticador
    deliverable: "Protocolos clínicos actualizados, guías de práctica, nuevos tratamientos"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Sin actualización continua basada en evidencia, la práctica clínica se estanca."

  - id: tx-cuidado-informal
    from: cuidador-informal
    to: paciente-receptor
    deliverable: "Apoyo emocional, cuidado en domicilio, acompañamiento"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "El cuidador informal es el actor más crítico y más invisible. Su agotamiento colapsa la red."

  - id: tx-datos-clinicos
    from: proveedor-tratamiento
    to: generador-conocimiento-clinico
    deliverable: "Datos clínicos anonimizados, resultados de tratamiento, casos"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Sin datos reales de práctica clínica, la investigación pierde conexión con la realidad."

  - id: tx-feedback-paciente
    from: paciente-receptor
    to: coordinador-ruta-clinica
    deliverable: "Experiencia vivida, satisfacción, adherencia al tratamiento"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "La experiencia del paciente es el indicador de calidad más ignorado. PRMs y encuestas reales."

  - id: tx-apoyo-cuidador
    from: coordinador-ruta-clinica
    to: cuidador-informal
    deliverable: "Formación, apoyo psicológico, recursos para el cuidador"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "El síndrome del cuidador es una crisis silenciosa. Cuando el cuidador cae, el paciente también."

patterns:
  - name: "Silos clínicos"
    description: "Cada especialidad opera de forma independiente sin compartir información. El paciente repite su historia en cada episodio. El coordinador de ruta clínica no recibe información para hacer su trabajo."
    signal: "tx-continuidad-informacion con frecuencia baja. Múltiples diagnósticos sin conexión entre sí."

  - name: "Cuidador invisible"
    description: "El cuidador informal aporta un volumen enorme de cuidado pero no recibe apoyo del sistema. Cuando llega al agotamiento, la red de cuidado colapsa."
    signal: "tx-cuidado-informal muy alta, tx-apoyo-cuidador ausente."

  - name: "Investigación desconectada"
    description: "El generador de conocimiento clínico no recibe datos reales de práctica clínica. Investiga sobre cohortes controladas que no representan la casuística real."
    signal: "tx-datos-clinicos baja frecuencia. Brecha academia-práctica."

  - name: "Barrera financiera"
    description: "Las autorizaciones del financiador crean demoras en la ruta clínica. El tratamiento óptimo no es el tratamiento cubierto."
    signal: "tx-financiacion-atencion con health scores bajos o frecuencia irregular."
---

## Contexto narrativo del sector

El sector sanitario es el más crítico en términos de consecuencias de un mapa VNA deficiente: cuando los flujos de valor están rotos en salud, las personas sufren consecuencias directas en su bienestar. Al mismo tiempo, es uno de los sectores donde el VNA puede generar mayor impacto porque los intangibles (confianza, comunicación, continuidad de información) son determinantes para el resultado clínico.

### Dinámica central del VNA en salud

El sistema sanitario es una red de redes. Cada episodio clínico activa una subred específica de actores. La coordinación entre subredes es el mayor reto del sector.

La paradoja central: el paciente es el actor más importante del ecosistema pero el menos empoderado. El VNA hace visible cuándo el sistema está optimizando sus propios procesos en lugar de optimizar el resultado para el paciente.

### Aplicación VNA en automatización con IA sanitaria

Las transacciones tangibles repetibles (triaje inicial, clasificación de imágenes, alertas de interacciones farmacológicas) son candidatas a automatización. Las transacciones intangibles (diagnóstico con incertidumbre alta, comunicación de pronóstico, acompañamiento emocional) requieren presencia humana. El VNA es el mapa que permite tomar esta decisión de forma explícita y ética.

### Indicadores de salud del sector R

| Indicador | Red saludable | Señal de alerta |
|---|---|---|
| Reingresos en 30 días | Bajo | Alto indica fallo en coordinación de ruta o en cuidado post-alta |
| Tiempo diagnóstico-tratamiento | Corto | Largo indica silos o barreras de autorización |
| Adherencia al tratamiento | Alta | Baja indica fallo en comunicación o en apoyo al paciente |
| Burnout del cuidador informal | Bajo | Alto indica ausencia de soporte al cuidador |
| Datos clínicos hacia investigación | Flujo activo | Ausente indica brecha academia-práctica |
