---
sector_id: K
sector_name: "Telecomunicaciones, Programación Informática y Servicios de Información"
cnae: K
sector_name_en: "Tech / Software / AI"
version: "v11.1"
tags: [tech, software, SaaS, IA, ciberseguridad, digital, plataforma, datos]

roles:
  - id: generador-problema-usuario
    name: Generador de problema / usuario
    description: El actor externo cuyo problema no resuelto es la razón de existencia del producto. Define con su comportamiento qué funcionalidades tienen valor real y cuáles son suposiciones del equipo.
    castell_level: pom_de_dalt
    fmv_usd_h: null
    typical_actor: "usuario final, cliente B2B, beta tester, early adopter"
    tags: [usuario, cliente, problema, demanda, feedback]

  - id: descubridor-oportunidad
    name: Descubridor de oportunidad
    description: Identifica problemas no resueltos con potencial de mercado. Convierte señales débiles del entorno (tendencias, competidores, conversaciones con usuarios) en hipótesis de producto accionables.
    castell_level: pom_de_dalt
    fmv_usd_h: null
    typical_actor: "founder, product manager, head of product"
    tags: [producto, estrategia, oportunidad, discovery]

  - id: arquitecto-sistema
    name: Arquitecto del sistema
    description: Diseña la estructura técnica que hace posible el producto. Define los cimientos sobre los que todo lo demás se construye. Sus decisiones tienen un horizonte de años.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "CTO, arquitecto de software, tech lead senior"
    tags: [arquitectura, infraestructura, stack, decisiones técnicas]

  - id: constructor-producto
    name: Constructor del producto
    description: Transforma especificaciones en código funcional. El rol que convierte directamente conocimiento técnico en valor tangible entregable. Ciclos cortos de producción e iteración.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "desarrollador, ingeniero de software, full stack, ML engineer"
    tags: [desarrollo, código, sprint, entregable técnico]

  - id: guardian-experiencia
    name: Guardián de la experiencia
    description: Asegura que el producto sea usable, comprensible y deseable para el usuario final. Traduce necesidades humanas en interfaces y flujos de interacción. El puente entre el problema del usuario y la solución técnica.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "diseñador UX/UI, product designer, researcher"
    tags: [UX, diseño, usabilidad, experiencia de usuario]

  - id: validador-confianza
    name: Validador de confianza
    description: Garantiza que el sistema funciona como se espera antes de que llegue al usuario. Detecta fallos antes de que se conviertan en problemas de reputación o seguridad.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "QA engineer, tester, security analyst"
    tags: [calidad, testing, seguridad, confianza]

  - id: activador-adopcion
    name: Activador de adopción
    description: Convierte usuarios potenciales en usuarios activos y activos en retenidos. El rol que cierra la brecha entre "el producto existe" y "el producto genera valor real para alguien".
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "growth, marketing, customer success, sales"
    tags: [adopción, activación, retención, crecimiento]

  - id: interprete-datos
    name: Intérprete de datos
    description: Extrae señales accionables del comportamiento del sistema y de los usuarios. Convierte datos crudos en decisiones de producto, negocio y operaciones.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "data analyst, data scientist, BI, analytics"
    tags: [datos, analytics, métricas, decisiones]

  - id: sustentador-infraestructura
    name: Sustentador de infraestructura
    description: Mantiene el sistema vivo, disponible y seguro. Su trabajo es invisible cuando funciona bien y crítico cuando falla. El rol que convierte código en servicio continuo.
    castell_level: pinya
    fmv_usd_h: null
    typical_actor: "DevOps, SRE, sysadmin, cloud engineer"
    tags: [infraestructura, DevOps, disponibilidad, operaciones]

  - id: orquestador-recursos
    name: Orquestador de recursos
    description: Gestiona la inversión, el equipo y las prioridades para que el sistema de producción funcione. Traduce visión estratégica en capacidad de ejecución real.
    castell_level: pom_de_dalt
    fmv_usd_h: null
    typical_actor: "CEO, COO, engineering manager, scrum master"
    tags: [gestión, priorización, recursos, inversión]

transactions:
  - id: tx-problema-validado
    from: generador-problema-usuario
    to: descubridor-oportunidad
    deliverable: "Señal de problema validado (feedback, entrevista, uso real)"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "Si el equipo de producto no habla regularmente con usuarios, está construyendo suposiciones, no valor."

  - id: tx-hipotesis-producto
    from: descubridor-oportunidad
    to: arquitecto-sistema
    deliverable: "Hipótesis de producto con criterios de validación"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Sin hipótesis claras, el arquitecto sobrediseña. La complejidad técnica crece más rápido que el valor."

  - id: tx-especificacion-tecnica
    from: arquitecto-sistema
    to: constructor-producto
    deliverable: "Especificación técnica / decisiones de arquitectura"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Especificaciones ambiguas generan retrabajos. El coste de la ambigüedad crece exponencialmente."

  - id: tx-requisito-ux
    from: guardian-experiencia
    to: constructor-producto
    deliverable: "Diseño de interfaz y flujos de usuario"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Sin diseño antes del código, el UX se hace encima de decisiones técnicas ya tomadas. Difícil y costoso."

  - id: tx-incremento-producto
    from: constructor-producto
    to: validador-confianza
    deliverable: "Incremento de producto (feature, fix, release)"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Si nada pasa por validación antes de producción, los fallos llegan al usuario. El coste de reputación es alto."

  - id: tx-producto-validado
    from: validador-confianza
    to: sustentador-infraestructura
    deliverable: "Build aprobado para despliegue"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Deployments sin validación = ruleta rusa. Indicador: número de rollbacks por sprint."

  - id: tx-servicio-en-produccion
    from: sustentador-infraestructura
    to: generador-problema-usuario
    deliverable: "Servicio disponible, estable y seguro"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "La disponibilidad del servicio es la promesa básica. Por debajo del 99% hay problema serio."

  - id: tx-pago-suscripcion
    from: generador-problema-usuario
    to: orquestador-recursos
    deliverable: "Pago / suscripción / licencia"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "El churn es el indicador de salud más honesto. Si la gente se va, algo del flujo de valor está roto."

  - id: tx-prioridad-recursos
    from: orquestador-recursos
    to: constructor-producto
    deliverable: "Priorización del backlog y asignación de capacidad"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Sin priorización clara el equipo trabaja en paralelo en demasiadas cosas. Velocidad percibida alta, valor real bajo."

  - id: tx-datos-comportamiento
    from: generador-problema-usuario
    to: interprete-datos
    deliverable: "Datos de uso, comportamiento y eventos del sistema"
    type: tangible
    is_must: false
    frequency: alta
    health_hint: "Sin datos de uso, las decisiones de producto son intuición. Con demasiados datos sin interpretación, también."

  - id: tx-insight-producto
    from: interprete-datos
    to: descubridor-oportunidad
    deliverable: "Insight accionable sobre comportamiento del usuario o del sistema"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Si el dato no genera cambio en la hoja de ruta, el equipo de datos no tiene conexión real con el producto."

  - id: tx-feedback-experiencia
    from: generador-problema-usuario
    to: guardian-experiencia
    deliverable: "Feedback sobre usabilidad, confusión, fricción"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "El silencio del usuario no es aprobación. Métricas de abandono y sesiones de testing revelan lo que no dicen."

  - id: tx-conocimiento-tecnico
    from: arquitecto-sistema
    to: constructor-producto
    deliverable: "Mentoring técnico, pair programming, revisión de código"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "Sin transferencia de conocimiento técnico, el equipo junior no crece y el arquitecto se convierte en cuello de botella."

  - id: tx-contexto-estrategico
    from: orquestador-recursos
    to: descubridor-oportunidad
    deliverable: "Contexto de negocio, restricciones, horizonte estratégico"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Un product manager sin contexto estratégico optimiza métricas de producto que no mueven el negocio."

  - id: tx-alerta-seguridad
    from: validador-confianza
    to: arquitecto-sistema
    deliverable: "Vulnerabilidad detectada, deuda técnica crítica"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "Las alertas de seguridad que no llegan a arquitectura se acumulan. El coste de ignorarlas crece exponencialmente."

  - id: tx-activacion-usuario
    from: activador-adopcion
    to: generador-problema-usuario
    deliverable: "Onboarding, formación, soporte de adopción"
    type: tangible
    is_must: false
    frequency: alta
    health_hint: "Un producto que la gente no sabe usar no tiene valor. El churn en los primeros 30 días lo revela."

  - id: tx-seal-mercado
    from: activador-adopcion
    to: descubridor-oportunidad
    deliverable: "Señales del mercado: qué mensajes funcionan, qué segmentos convierten"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Growth y producto no hablan = se descubren los mismos problemas dos veces por separado."

patterns:
  - name: "Death star architecture"
    description: "El arquitecto del sistema es el único nodo que comprende el sistema completo. Todo pasa por él. Cuando no está disponible, el equipo se paraliza."
    signal: "Muchas tx intangibles entrantes al arquitecto, ningún otro nodo recibe tx de conocimiento técnico."

  - name: "Build trap"
    description: "El constructor de producto está en el ciclo construir-desplegar pero recibe pocas transacciones de problema validado. Se construye rápido, pero no necesariamente lo que genera valor."
    signal: "Velocidad de entrega alta, tx-problema-validado baja frecuencia."

  - name: "Data graveyard"
    description: "El intérprete de datos recibe muchos datos pero sus insights no llegan al descubridor de oportunidad. Los dashboards existen pero no cambian decisiones."
    signal: "tx-datos-comportamiento alta, tx-insight-producto baja."

  - name: "Adoption gap"
    description: "El producto existe y funciona, pero el activador de adopción está desconectado del guardián de experiencia. El onboarding es confuso y el churn es alto."
    signal: "tx-activacion-usuario activa, tx-feedback-experiencia baja o ausente."
---

## Contexto narrativo del sector

El sector K engloba organizaciones cuyo producto central es software, datos, plataformas o servicios digitales. La particularidad de este sector en VNA es que el producto en sí es un mecanismo de transacción — cada uso del software es una transacción de valor entre el sistema y el usuario.

### Dinámica central del VNA en este sector

La tensión fundamental de una empresa tech es la **distancia entre construcción y uso**. Las personas que construyen el producto raramente son las que lo usan. Esta distancia genera un campo de suposiciones que el VNA hace visible: los intangibles de feedback, señales de problema y contexto de usuario son los que cierran esa brecha.

En SaaS, el modelo de negocio añade otra capa: el cliente paga recurrentemente, lo que significa que el valor debe regenerarse en cada ciclo. Un mapa VNA de una empresa SaaS revela si el flujo de valor es sostenible (el cliente recibe valor continuo) o extractor (el cliente paga por inercia hasta que cancela).

### El VNA en contextos de IA y automatización

En organizaciones que desarrollan o despliegan IA, el VNA tiene una aplicación específica: mapear exactamente qué transacciones tangibles son candidatas a automatización (flujo de datos estructurado, proceso repetible, criterio de calidad medible) y cuáles deben permanecer humanas (contexto ambiguo, confianza relacional, decisiones con impacto ético).

**El principio clave:** no puedes automatizar lo que no has mapeado. El VNA es el paso previo obligatorio a cualquier proyecto de automatización con IA.

### Indicadores de salud del sector K

| Indicador | Red saludable | Señal de alerta |
|---|---|---|
| Frecuencia de tx usuario → equipo | Semanal o más | Menos de mensual = producto construido en el vacío |
| Ratio features nuevas / bugs | Equilibrado | Solo features = deuda técnica creciente |
| Flujo insight → hoja de ruta | Directo y rápido | Insights que tardan meses en cambiar prioridades |
| Cobertura del activador | Todos los segmentos de usuario | Adopción solo en early adopters, no en mayoría |
| Autonomía del equipo de infraestructura | Alta | Deployments que requieren coordinación manual de múltiples equipos |
