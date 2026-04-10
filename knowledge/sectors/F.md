---
sector_id: F
sector_name: "Construcción"
cnae: F
sector_name_en: "Construction"
version: "v11.1"
tags: [construcción, edificación, obra civil, reformas, promotora, residencial, infraestructuras, proptech]

roles:
  - id: promotor-vision
    name: Promotor de visión
    description: Define qué se construye, para quién y con qué propósito. Convierte capital financiero en intención constructiva y asume el riesgo global del proyecto.
    castell_level: pom_de_dalt
    fmv_usd_h: null
    typical_actor: "promotor inmobiliario, developer, inversor, administración pública"
    tags: [promoción, visión, riesgo, financiación, cliente final]

  - id: traductor-tecnico
    name: Traductor técnico
    description: Convierte la visión del promotor en planos, especificaciones y documentación técnica ejecutable. El rol que hace que una idea se pueda construir físicamente.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "arquitecto, ingeniero de proyecto, project designer"
    tags: [diseño, arquitectura, ingeniería, planos, licencias]

  - id: coordinador-ejecucion
    name: Coordinador de ejecución
    description: Orquesta todos los recursos, proveedores y tiempos para que la construcción avance según plan. Gestiona la complejidad de múltiples actores simultáneos en obra.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "jefe de obra, construction manager, project manager"
    tags: [obra, coordinación, planificación, gestión de proyecto]

  - id: ejecutor-especialista
    name: Ejecutor especialista
    description: Realiza el trabajo físico especializado de construcción. Convierte materiales y planos en estructura real. Cada especialidad aporta un tipo específico de valor tangible.
    castell_level: pinya
    fmv_usd_h: null
    typical_actor: "contratista, subcontratista, instalador, gremio especializado"
    tags: [construcción, ejecución, especialista, subcontrata]

  - id: proveedor-materiales
    name: Proveedor de materiales
    description: Suministra los insumos físicos que hacen posible la construcción. La cadena de suministro es crítica para el plazo y el coste del proyecto.
    castell_level: pinya
    fmv_usd_h: null
    typical_actor: "proveedor de materiales, fabricante, distribuidor"
    tags: [materiales, suministro, logística, cadena de valor]

  - id: guardian-legal-tecnico
    name: Guardián legal y técnico
    description: Verifica que el proyecto cumple normativa, calidad y seguridad. Su aprobación es requisito para avanzar en fases críticas. Protege a todos los actores del riesgo legal.
    castell_level: tronc
    fmv_usd_h: null
    typical_actor: "director de obra, aparejador, inspector técnico, seguridad y salud"
    tags: [calidad, normativa, seguridad, inspección, licencias]

  - id: financiador-proyecto
    name: Financiador del proyecto
    description: Aporta el capital necesario para que el proyecto avance. Sus condiciones y plazos determinan la velocidad y posibilidades del proyecto.
    castell_level: pom_de_dalt
    fmv_usd_h: null
    typical_actor: "banco, fondo de inversión, administración pública, inversor privado"
    tags: [financiación, crédito, inversión, capital]

  - id: usuario-final
    name: Usuario / Comprador final
    description: El actor para quien se construye en última instancia. Su satisfacción determina el valor real del proyecto y la reputación del promotor para proyectos futuros.
    castell_level: pom_de_dalt
    fmv_usd_h: null
    typical_actor: "comprador de vivienda, inquilino, usuario de infraestructura, administración"
    tags: [usuario, comprador, ocupante, satisfacción final]

transactions:
  - id: tx-encargo-proyecto
    from: promotor-vision
    to: traductor-tecnico
    deliverable: "Brief del proyecto: programa, presupuesto, plazos, visión"
    type: tangible
    is_must: true
    frequency: baja
    health_hint: "Un brief vago genera diseños que no cumplen las expectativas. El coste de rediseñar es enorme."

  - id: tx-proyecto-ejecutivo
    from: traductor-tecnico
    to: coordinador-ejecucion
    deliverable: "Planos ejecutivos, especificaciones técnicas, documentación de obra"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Planos incompletos o contradictorios generan parones en obra y disputas entre actores."

  - id: tx-adjudicacion-obra
    from: coordinador-ejecucion
    to: ejecutor-especialista
    deliverable: "Contrato de ejecución, alcance, plazos y condiciones"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Contratos ambiguos con subcontratistas son la fuente principal de conflictos en obra."

  - id: tx-suministro-materiales
    from: proveedor-materiales
    to: ejecutor-especialista
    deliverable: "Materiales, componentes, equipamiento según especificación"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Un retraso en suministro para toda la obra. La cadena de subcontratistas es el cuello de botella más frecuente."

  - id: tx-inspeccion-certificacion
    from: guardian-legal-tecnico
    to: coordinador-ejecucion
    deliverable: "Certificación de fase, acta de inspección, aprobación técnica"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Sin certificaciones en plazo, el promotor no puede acreditar avance ante el financiador."

  - id: tx-financiacion-tramos
    from: financiador-proyecto
    to: promotor-vision
    deliverable: "Disposición de tramos de financiación según avance de obra"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Un retraso en la disposición de fondos paraliza la obra. El cashflow es la arteria del proyecto."

  - id: tx-pago-final
    from: usuario-final
    to: promotor-vision
    deliverable: "Pago de compraventa o alquiler"
    type: tangible
    is_must: true
    frequency: baja
    health_hint: "El aplazamiento del pago final estresa el cashflow del promotor y puede comprometer proyectos en curso."

  - id: tx-entrega-inmueble
    from: coordinador-ejecucion
    to: usuario-final
    deliverable: "Inmueble terminado, llaves, documentación técnica"
    type: tangible
    is_must: true
    frequency: baja
    health_hint: "La calidad de la entrega determina la satisfacción y la reputación para proyectos futuros."

  - id: tx-conocimiento-mercado
    name: Conocimiento del mercado y feedback de usuario
    from: usuario-final
    to: promotor-vision
    deliverable: "Feedback sobre expectativas, uso real, satisfacción"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "Los promotores que no escuchan al usuario final repiten los mismos errores en cada promoción."

  - id: tx-know-how-constructivo
    from: ejecutor-especialista
    to: coordinador-ejecucion
    deliverable: "Propuestas técnicas, soluciones de obra, lecciones aprendidas"
    type: intangible
    is_must: false
    frequency: alta
    health_hint: "El conocimiento práctico del especialista es el activo intangible más infrautilizado del sector."

  - id: tx-contexto-normativo
    from: guardian-legal-tecnico
    to: traductor-tecnico
    deliverable: "Interpretación normativa, precedentes, orientación técnica"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Sin diálogo temprano con el guardián legal, el diseño puede necesitar revisiones costosas."

  - id: tx-reputacion-promotor
    from: usuario-final
    to: promotor-vision
    deliverable: "Recomendación, reseña, referencia para futuros compradores"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "La reputación del promotor es su activo más valioso a largo plazo. Difícil de construir, fácil de destruir."

patterns:
  - name: "Triángulo de tensión"
    description: "El promotor presiona por plazo, el financiador por coste, el usuario pide calidad. El coordinador de ejecución queda atrapado entre tres vectores opuestos. Sin un VNA claro, esta tensión se gestiona de forma implícita y genera conflictos."
    signal: "Alta densidad de transacciones entrantes al coordinador desde tres roles con intereses divergentes."

  - name: "Conocimiento que no asciende"
    description: "El ejecutor especialista acumula know-how práctico de obra que no llega al traductor técnico ni al coordinador. Cada proyecto empieza desde cero con los mismos errores."
    signal: "tx-know-how-constructivo con frecuencia baja o ausente."

  - name: "Financiador como cuello de botella"
    description: "Los tramos de financiación van retrasados respecto al avance real de obra. El promotor tiene que financiar con recursos propios períodos que deberían estar cubiertos."
    signal: "tx-inspeccion-certificacion activa pero tx-financiacion-tramos retrasada."
---

## Contexto narrativo del sector

La construcción es uno de los sectores con mayor densidad de actores simultáneos en un proyecto y, paradójicamente, uno de los más dependientes de la coordinación informal e intangible. Los proyectos se ganan y se pierden por relaciones, reputación y confianza — exactamente los elementos que el VNA hace visibles.

### La paradoja del sector

Es un sector altamente tangible en su output (edificios, infraestructuras, obras físicas) pero profundamente dependiente de intangibles para funcionar: la confianza entre promotor y contratista, el know-how tácito del especialista, la reputación del arquitecto, la relación con el inspector técnico.

### Indicadores de salud del sector F

| Indicador | Red saludable | Señal de alerta |
|---|---|---|
| Ratio desviación plazo/coste | <10% sobre planificado | >20% indica coordinación deficiente o brief vago |
| Repetición de subcontratistas | Alta recurrencia | Cambio constante indica problemas relacionales |
| Satisfacción usuario final | Alta y documentada | Sin medición = sin aprendizaje |
| Tiempo entre certificación y disposición de fondos | Corto | Largo indica tensión financiadora-promotor |
