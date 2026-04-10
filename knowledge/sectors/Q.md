---
sector_id: Q
sector_name: "Educación"
cnae: Q
version: "v11.1"
tags: [educación, universidad, formación, edtech, reskilling, postgrado, escuela, colegios]

roles:
  - id: proveedor-conocimiento-academico
    name: Proveedor de conocimiento académico
    description: Genera, actualiza y transmite el saber central de la institución. Convierte su expertise en experiencias de aprendizaje. El rol más visible externamente pero que depende de múltiples intangibles para funcionar bien.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "profesor, docente, investigador, facilitador, ponente"
    tags: [docencia, conocimiento, contenido académico, investigación]

  - id: aprendiz-activo
    name: Aprendiz activo
    description: El actor central del ecosistema educativo. Transforma inputs de conocimiento en competencias propias. Su motivación, contexto y red de contactos determinan en gran parte el valor real que extrae de la institución.
    castell_level: pom_de_dalt
    fmv_usd_h: null
    typical_actor: "estudiante, alumno, participante, profesional en formación"
    tags: [alumno, aprendizaje, competencias, transformación]

  - id: activador-mercado
    name: Activador de mercado
    description: Convierte la propuesta educativa en demanda real. Identifica los perfiles con mayor potencial y los conecta con la oferta formativa adecuada. Traduce valor académico en lenguaje de mercado.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "marketing, admisiones, comercial, advisor de programas"
    tags: [marketing, admisiones, conversión, demanda]

  - id: disenador-experiencia-aprendizaje
    name: Diseñador de experiencia de aprendizaje
    description: Estructura la experiencia formativa para maximizar la transferencia de conocimiento y la transformación del aprendiz. Va más allá del contenido: diseña el recorrido completo.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "coordinador académico, instructional designer, director de programa"
    tags: [diseño curricular, experiencia, programa, metodología]

  - id: vinculador-industria
    name: Vinculador con la industria
    description: Conecta el ecosistema educativo con el mundo profesional real. Activa prácticas, proyectos reales, mentorías y oportunidades de empleo. El nodo que hace que el aprendizaje sea relevante para el mercado.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "career services, relaciones con empresas, alumni manager"
    tags: [empleo, prácticas, empresas, red profesional, alumni]

  - id: empresa-empleadora
    name: Empresa / Empleadora
    description: Actor externo que busca talento formado, colabora con proyectos reales y en algunos casos cofinancia o diseña contenidos. Su participación eleva la relevancia de la formación.
    castell_level: pom_de_dalt
    fmv_usd_h: null
    typical_actor: "empresa colaboradora, empresa de prácticas, cliente de proyectos formativos"
    tags: [empresa, empleabilidad, proyectos reales, mercado laboral]

  - id: alumni-prescriptor
    name: Alumni prescriptor
    description: Ex-aprendiz que se convierte en embajador de la institución. Aporta reputación, recomendaciones y en muchos casos vuelve como docente o colaborador. Cierra el ciclo de valor del ecosistema educativo.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "alumni activo, ex-alumno referenciador, mentor voluntario"
    tags: [alumni, recomendación, reputación, embajador, red]

  - id: habilitador-logistico
    name: Habilitador logístico
    description: Garantiza que la experiencia de aprendizaje tiene la infraestructura necesaria: espacios, plataformas, herramientas, administración, servicios de apoyo.
    castell_level: pinya
    fmv_usd_h: null
    typical_actor: "servicios TIC, administración académica, facilities, plataforma LMS"
    tags: [administración, TIC, plataforma, logística, infraestructura]

  - id: custodio-estrategia
    name: Custodio de estrategia
    description: Define el rumbo de la institución, asigna recursos y garantiza que la misión educativa sea sostenible. Convierte visión en capacidad operativa.
    castell_level: pom_de_dalt
    fmv_usd_h: null
    typical_actor: "dirección, decanato, consejo académico, board"
    tags: [estrategia, dirección, recursos, misión, sostenibilidad]

transactions:
  - id: tx-contenido-formativo
    from: proveedor-conocimiento-academico
    to: aprendiz-activo
    deliverable: "Contenido académico, clases, materiales, experiencias de aprendizaje"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "La calidad del contenido determina la reputación. Contenido desactualizado = alumni que no recomiendan."

  - id: tx-presencia-medios
    from: proveedor-conocimiento-academico
    to: activador-mercado
    deliverable: "Contenido publicable, artículos, ponencias, presencia en medios"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "El thought leadership del claustro alimenta el marketing. Sin él, la institución compite solo por precio."

  - id: tx-pago-matricula
    from: aprendiz-activo
    to: habilitador-logistico
    deliverable: "Matrícula, tasas, pago del programa"
    type: tangible
    is_must: true
    frequency: baja
    health_hint: "El ratio de conversión admisiones → matrícula es el indicador de salud del activador de mercado."

  - id: tx-escucha-activa
    from: activador-mercado
    to: proveedor-conocimiento-academico
    deliverable: "Señales del mercado: qué demanda el mercado laboral, tendencias de perfil"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Sin retroalimentación del mercado, el claustro diseña programas para el pasado."

  - id: tx-experiencia-real
    from: empresa-empleadora
    to: aprendiz-activo
    deliverable: "Prácticas, proyectos reales, mentorías, visitas"
    type: tangible
    is_must: false
    frequency: media
    health_hint: "La empleabilidad real depende de este flujo. Sin contacto con empresas reales, el aprendizaje es abstracto."

  - id: tx-talento-formado
    from: aprendiz-activo
    to: empresa-empleadora
    deliverable: "Incorporación laboral, proyecto entregado, talento disponible"
    type: tangible
    is_must: false
    frequency: media
    health_hint: "La empresa que no incorpora talento de la institución no tiene incentivo para colaborar. Ciclo que se rompe."

  - id: tx-feedback-empresa
    from: empresa-empleadora
    to: disenador-experiencia-aprendizaje
    deliverable: "Feedback sobre competencias reales que necesita el mercado"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "Sin este flujo, el diseño curricular es académico pero no relevante. Gap formación-empleo."

  - id: tx-recomendacion-alumni
    from: alumni-prescriptor
    to: activador-mercado
    deliverable: "Recomendación a potenciales nuevos alumnos"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "El NPS de alumni es el indicador más honesto de la calidad real del programa."

  - id: tx-actualizacion-alumni
    from: vinculador-industria
    to: alumni-prescriptor
    deliverable: "Oportunidades de networking, eventos, actualización de formación"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Los alumni que no reciben valor post-formación no recomiendan. La relación debe ser bidireccional."

  - id: tx-conocimiento-cliente
    from: activador-mercado
    to: proveedor-conocimiento-academico
    deliverable: "Conocimiento del perfil del alumno y sus expectativas"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "El docente que no conoce el perfil del alumno no puede adaptar el nivel ni el enfoque."

  - id: tx-programa-formativo
    from: disenador-experiencia-aprendizaje
    to: aprendiz-activo
    deliverable: "Estructura del programa, secuencia de aprendizaje, metodología"
    type: tangible
    is_must: true
    frequency: baja
    health_hint: "Un programa mal estructurado genera frustración incluso con buenos docentes."

  - id: tx-lineas-estrategicas
    from: custodio-estrategia
    to: disenador-experiencia-aprendizaje
    deliverable: "Líneas estratégicas, recursos asignados, prioridades de desarrollo"
    type: tangible
    is_must: true
    frequency: baja
    health_hint: "Sin dirección estratégica clara, cada programa optimiza sus propias métricas sin coherencia de institución."

  - id: tx-desarrollo-profesional
    from: vinculador-industria
    to: aprendiz-activo
    deliverable: "Apoyo a carreras, oportunidades de empleo, red de contactos"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "La empleabilidad es el intangible más valorado por el aprendiz. Si no llega, la satisfacción cae."

  - id: tx-informacion-programa
    from: activador-mercado
    to: aprendiz-activo
    deliverable: "Información del programa, proceso de admisión, orientación"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "La fricción en admisiones reduce la conversión. Proceso complejo = candidatos que desisten."

patterns:
  - name: "Gap formación-mercado"
    description: "El proveedor de conocimiento no recibe señales del mercado a través del activador ni del vinculador. Los programas se actualizan por criterio académico interno, no por demanda real."
    signal: "tx-escucha-activa y tx-feedback-empresa con frecuencia baja o ausente."

  - name: "Alumni dormidos"
    description: "La institución no mantiene relación activa con alumni una vez terminan el programa. El capital de reputación y recomendación se pierde."
    signal: "tx-actualizacion-alumni baja, tx-recomendacion-alumni baja."

  - name: "Empresa extractora"
    description: "La empresa colaboradora recibe talento formado pero no aporta experiencia real ni feedback. Relación asimétrica que a largo plazo no es sostenible."
    signal: "tx-talento-formado activa, tx-experiencia-real y tx-feedback-empresa bajas."

  - name: "Docente aislado"
    description: "El proveedor de conocimiento académico no recibe información del mercado ni del perfil real del alumno. Produce conocimiento de alta calidad académica pero desconectado de las necesidades reales."
    signal: "tx-escucha-activa y tx-conocimiento-cliente ausentes."
---

## Contexto narrativo del sector

El sector educativo es uno de los más ricos en intangibles del VNA. La imagen de la escuela de postgrado adjunta ilustra perfectamente este punto: el rol "Marketing y venta" está en el centro no como nodo jerárquico sino como el nodo con más transacciones, porque es el que conecta todos los flujos internos con la demanda externa.

### Dinámica central del VNA en educación

La tensión fundamental del sector educativo es la **distancia temporal entre inversión y valor percibido**. El aprendiz paga hoy pero el valor real — empleabilidad, red de contactos, transformación profesional — se materializa meses o años después. Esta distancia hace que los intangibles (reputación, recomendación de alumni, presencia del claustro en medios) sean determinantes en la decisión de compra.

### Aplicación directa: mapa de la escuela de postgrado

El mapa VNA de la imagen muestra claramente:
- **Marketing y venta** como nodo con más conexiones (no jerárquico, sino central por flujo)
- **Relación y servicios a alumni** como el nodo que cierra el ciclo de valor
- **Alumni prescriptores** como fuente de intangibles críticos (recomendaciones, feedback)
- **Empresas y profesionales** como actores externos que aportan y reciben tangibles e intangibles

### Indicadores de salud del sector Q

| Indicador | Red saludable | Señal de alerta |
|---|---|---|
| NPS de alumni | Alto y creciente | Caída indica deterioro del valor percibido |
| % admisiones por recomendación | >40% | <20% indica dependencia de marketing pagado |
| Tiempo hasta primer empleo post-programa | Corto | Largo indica gap formación-mercado |
| Frecuencia de actualización curricular | Anual | >3 años sin revisión es señal de aislamiento |
| Empresas colaboradoras activas | Red diversa y recurrente | Pocas empresas o baja renovación |
