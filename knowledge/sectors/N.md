---
sector_id: N
sector_name: "Actividades Profesionales, Científicas y Técnicas"
cnae: N
sector_name_en: "Consulting / Professional Services"
version: "v11.1"
tags: [consultoría, B2B, I+D, diseño, marketing, arquitectura, legal, auditoría, estrategia]

roles:
  - id: generador-demanda
    name: Generador de demanda
    description: Activa interés en los servicios de la firma y abre conversaciones con potenciales clientes. Convierte reputación e intangibles de red en oportunidades concretas.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "socio comercial, account manager, founder"
    tags: [ventas, prospección, relación, pipeline]

  - id: definidor-problema
    name: Definidor de problema
    description: Diagnostica y articula con precisión el problema del cliente. Convierte síntomas difusos en un encuadre accionable que orienta toda la intervención.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "consultor senior, partner, director de proyecto"
    tags: [diagnóstico, briefing, encuadre, discovery]

  - id: productor-conocimiento
    name: Productor de conocimiento
    description: Genera los entregables intelectuales centrales de la firma: análisis, metodologías, frameworks, investigación, diseño. Es el núcleo de la conversión de conocimiento en valor tangible.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "consultor, investigador, diseñador, arquitecto, analista"
    tags: [entregables, análisis, metodología, I+D, diseño]

  - id: integrador-cliente
    name: Integrador con el cliente
    description: Gestiona la relación continua con el cliente durante el proyecto. Traduce entre el lenguaje de la firma y el lenguaje del cliente. Garantiza que el conocimiento producido sea adoptado.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "project manager, engagement manager, consultor de cuenta"
    tags: [gestión, relación, adopción, comunicación]

  - id: validador-calidad
    name: Validador de calidad
    description: Revisa y certifica que los entregables cumplen los estándares técnicos y metodológicos de la firma antes de ser entregados al cliente.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "socio revisor, director técnico, QA lead"
    tags: [revisión, calidad, metodología, auditoría]

  - id: custodio-conocimiento
    name: Custodio del conocimiento
    description: Captura, organiza y hace accesible el conocimiento generado en proyectos anteriores. Evita que el aprendizaje organizacional se pierda cuando la gente rota.
    castell_level: pinya
    fmv_usd_h: null
    typical_actor: "knowledge manager, bibliotecario corporativo, ops"
    tags: [knowledge management, documentación, reutilización]

  - id: habilitador-operaciones
    name: Habilitador de operaciones
    description: Garantiza que la infraestructura administrativa, legal y financiera funcione. Facturación, contratos, espacios, herramientas. Activo invisible que hace posible el trabajo intelectual.
    castell_level: pinya
    fmv_usd_h: null
    typical_actor: "office manager, finance, legal, ops"
    tags: [administración, finanzas, legal, infraestructura]

  - id: amplificador-reputacion
    name: Amplificador de reputación
    description: Transforma los resultados de proyectos en contenido público, casos de éxito, publicaciones, ponencias y presencia de marca. Convierte valor interno en capital de reputación externo.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "marketing, comunicación, thought leadership"
    tags: [marketing, contenido, reputación, thought-leadership]

  - id: cliente-organizacion
    name: Cliente / Organización contratante
    description: El actor externo que encarga y financia el trabajo. Aporta contexto, acceso a información interna y validación de resultados. Su adopción del conocimiento producido determina el valor real generado.
    castell_level: pom_de_dalt
    fmv_usd_h: null
    typical_actor: "directivo, equipo interno del cliente, sponsor del proyecto"
    tags: [cliente, externo, sponsor, validación]

  - id: red-expertos
    name: Red de expertos externos
    description: Especialistas, subcontratistas, colaboradores freelance o socios que aportan conocimiento o capacidad que la firma no tiene internamente.
    castell_level: pinya
    fmv_usd_h: null
    typical_actor: "freelance, partner externo, experto sectorial, universidad"
    tags: [red, expertos, freelance, subcontratación, ecosistema]

transactions:
  - id: tx-propuesta-economica
    from: generador-demanda
    to: cliente-organizacion
    deliverable: "Propuesta económica y metodológica"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Si no hay propuestas saliendo, el pipeline está seco. Revisar actividad del generador de demanda."

  - id: tx-briefing-problema
    from: cliente-organizacion
    to: definidor-problema
    deliverable: "Briefing del problema / encargo"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Un briefing vago produce diagnósticos vagos. El definidor debe activar sesiones de clarificación."

  - id: tx-diagnostico
    from: definidor-problema
    to: productor-conocimiento
    deliverable: "Diagnóstico estructurado del problema"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Sin diagnóstico sólido, el productor de conocimiento trabaja en el aire."

  - id: tx-entregable-principal
    from: productor-conocimiento
    to: validador-calidad
    deliverable: "Entregable intelectual (análisis, diseño, framework, informe)"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Cuello de botella clásico: el validador no tiene capacidad y los entregables se acumulan."

  - id: tx-entregable-validado
    from: validador-calidad
    to: integrador-cliente
    deliverable: "Entregable revisado y aprobado"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Si el validador cambia mucho, revisar alineamiento metodológico con el productor."

  - id: tx-presentacion-cliente
    from: integrador-cliente
    to: cliente-organizacion
    deliverable: "Presentación / entrega de resultados"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "La calidad de la presentación determina la adopción. No es solo un trámite."

  - id: tx-pago
    from: cliente-organizacion
    to: habilitador-operaciones
    deliverable: "Pago por servicios"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Retraso en pagos = tensión en la firma. Indicador de salud financiera del cliente."

  - id: tx-contrato
    from: habilitador-operaciones
    to: cliente-organizacion
    deliverable: "Contrato de servicios"
    type: tangible
    is_must: true
    frequency: baja
    health_hint: "Contratos mal redactados generan disputas sobre alcance. Invertir en plantillas sólidas."

  - id: tx-conocimiento-experto
    from: red-expertos
    to: productor-conocimiento
    deliverable: "Conocimiento especializado / capacidad adicional"
    type: tangible
    is_must: false
    frequency: media
    health_hint: "Dependencia excesiva de la red externa es un riesgo. Equilibrar con internalización gradual."

  - id: tx-caso-exito
    from: integrador-cliente
    to: amplificador-reputacion
    deliverable: "Caso de éxito documentado"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "Si los casos de éxito no fluyen hacia marketing, la reputación se estanca. Proceso sistemático."

  - id: tx-reputacion-mercado
    from: amplificador-reputacion
    to: generador-demanda
    deliverable: "Contenido de marca, artículos, ponencias, presencia en medios"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "El thought leadership alimenta el pipeline. Si no hay contenido, la prospección es más difícil y costosa."

  - id: tx-feedback-proyecto
    from: cliente-organizacion
    to: integrador-cliente
    deliverable: "Feedback sobre el proceso y los resultados"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "Sin feedback del cliente el equipo opera en el vacío. El integrador debe activarlo activamente."

  - id: tx-aprendizaje-proyecto
    from: productor-conocimiento
    to: custodio-conocimiento
    deliverable: "Lecciones aprendidas, metodologías nuevas, plantillas reutilizables"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Si el conocimiento generado no se captura, se pierde con la rotación. Es la hemorragia silenciosa de las firmas."

  - id: tx-contexto-interno
    from: cliente-organizacion
    to: productor-conocimiento
    deliverable: "Acceso a datos internos, entrevistas, contexto organizacional"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "Sin acceso real al contexto del cliente, el conocimiento producido es genérico. Gestionar activamente."

  - id: tx-conocimiento-reutilizable
    from: custodio-conocimiento
    to: productor-conocimiento
    deliverable: "Metodologías previas, plantillas, casos de proyectos anteriores"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "Si el productor no usa el conocimiento almacenado, la firma reinventa la rueda en cada proyecto."

  - id: tx-confianza-red
    from: generador-demanda
    to: red-expertos
    deliverable: "Inclusión en proyectos, reputación como socio de trabajo"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "La red externa se mantiene con reciprocidad. Si solo se extrae sin aportar, se degrada."

  - id: tx-recomendacion
    from: cliente-organizacion
    to: generador-demanda
    deliverable: "Recomendación a otro cliente potencial"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "La recomendación es el intangible más valioso del sector. Indicador de salud real de la relación."

patterns:
  - name: "Cuello de botella en validación"
    description: "El validador de calidad es el nodo con más transacciones entrantes y menor capacidad. Síntoma: entregables retrasados aunque el productor trabaja bien."
    signal: "Muchas tx entrantes al validador, pocas salientes en el mismo periodo."

  - name: "Hemorragia de conocimiento"
    description: "El custodio de conocimiento recibe pocas transacciones desde el productor. El aprendizaje organizacional no se captura. Cada proyecto empieza desde cero."
    signal: "tx-aprendizaje-proyecto con frecuencia baja o ausente."

  - name: "Pipeline desconectado de reputación"
    description: "El amplificador de reputación no recibe casos de éxito del integrador. El generador de demanda opera sin apoyo de contenido."
    signal: "tx-caso-exito ausente o con frecuencia muy baja."

  - name: "Cliente pasivo"
    description: "El cliente no aporta contexto interno ni feedback. El conocimiento producido es genérico y la adopción será baja."
    signal: "tx-contexto-interno y tx-feedback-proyecto con health scores bajos."

  - name: "Red externa sin reciprocidad"
    description: "La firma extrae conocimiento de la red de expertos pero no aporta reputación ni inclusión en proyectos. La red se degrada con el tiempo."
    signal: "tx-conocimiento-experto alta, tx-confianza-red baja."
---

## Contexto narrativo del sector

El sector N engloba todas las organizaciones cuyo producto principal es el **conocimiento aplicado**: consultoras estratégicas, firmas de diseño, agencias de marketing, despachos de arquitectura, empresas de I+D, firmas legales, auditoras y cualquier organización que convierte expertise humano en valor para terceros.

### Dinámica central del VNA en este sector

La tensión fundamental de una firma de conocimiento es la **paradoja del custodio**: el conocimiento más valioso vive en las personas, no en los sistemas. Cuando alguien se va, se lleva una parte de la red de valor. El VNA hace visible esta hemorragia silenciosa que los organigramas no pueden capturar.

Los intangibles dominan el sector. Una firma consultora típica genera el 70-80% de su pipeline a través de recomendaciones (intangible) y thought leadership (intangible), no a través de ventas directas. El mapa VNA revela si estos flujos intangibles están activos y son recíprocos.

### Patrones VNA frecuentes

**Red en estrella alrededor del integrador:** En firmas pequeñas, el integrador con el cliente centraliza demasiadas transacciones y se convierte en cuello de botella y punto único de fallo. El VNA lo hace visible antes de que cause un problema.

**Desconexión entre producción y reputación:** El conocimiento generado en proyectos raramente se convierte en capital de reputación. El flujo `productor → custodio → amplificador` está roto en la mayoría de firmas. Cada proyecto genera valor para el cliente pero no para el pipeline futuro de la firma.

**Asimetría en la red de expertos:** Las firmas dependen de redes de freelances y expertos externos pero invierten poco en mantenerlas. Los intangibles de reciprocidad (dar acceso, dar crédito, dar referencia) son los que sostienen estas redes.

### Aplicación VNA para equipos TeamTowers (sector propio)

Este sector es el sector de operación de TeamTowers. El mapa VNA de la propia firma es el primer prototipo que demuestra la metodología. Los roles `generador-demanda`, `definidor-problema` y `productor-conocimiento` son los más críticos para analizar en un taller inicial.

La pregunta de Kaikaku para este sector: ¿qué parte del conocimiento que hoy producimos de forma artesanal para cada cliente podemos sistematizar como knowledge base reutilizable, sin perder la personalización que da valor?

### Indicadores de salud del sector N

| Indicador | Red saludable | Señal de alerta |
|---|---|---|
| Ratio intangibles/tangibles | 40-60% intangibles | <20% indica firma transaccional sin relaciones profundas |
| Flujo de recomendaciones | Regular desde múltiples clientes | Dependencia de 1-2 clientes para todo el pipeline |
| Captura de conocimiento | Flujo activo hacia custodio | Proyectos sin lecciones aprendidas documentadas |
| Reciprocidad con red externa | Intercambio bidireccional | Solo extracción: la red se degrada |
| Tiempo entre encargo y diagnóstico | Corto y estructurado | Largos periodos de discovery no estructurado = cliente pierde confianza |
