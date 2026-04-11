---
sector_id: L
sector_name: "Actividades Financieras y de Seguros"
sector_name_en: "Financial & Insurance Activities"
cnae: "64-66"
version: "v11.1"
tags: ["finanzas", "banca", "seguros", "fintech", "inversion", "riesgo", "credito"]

roles:
  - id: cfo_finance_director
    name: "Director Financiero / CFO"
    name_en: "Chief Financial Officer / Finance Director"
    description: "Define la estrategia financiera, gestiona el riesgo estructural y responde ante reguladores y consejo. Custodio de la solvencia."
    description_en: "Defines financial strategy, manages structural risk and reports to regulators and board. Guardian of solvency."
    castell_level: pom_de_dalt
    fmv_usd_h: 110
    typical_actor: "Director financiero con experiencia en entidades reguladas y comités de riesgo"
    typical_actor_en: "Finance director with experience in regulated entities and risk committees"
    tags: ["estrategia", "riesgo", "regulacion"]

  - id: risk_analyst
    name: "Analista de Riesgo"
    name_en: "Risk Analyst"
    description: "Evalúa, modela y monitoriza el riesgo crediticio, de mercado y operacional. Produce los inputs para decisiones de crédito y pricing."
    description_en: "Assesses, models and monitors credit, market and operational risk. Produces inputs for credit and pricing decisions."
    castell_level: tronc
    fmv_usd_h: 65
    typical_actor: "Economista o matemático con modelos cuantitativos y conocimiento regulatorio (Basel, Solvencia II)"
    typical_actor_en: "Economist or mathematician with quantitative models and regulatory knowledge (Basel, Solvency II)"
    tags: ["riesgo", "credito", "modelos"]

  - id: relationship_manager
    name: "Gestor de Relaciones / Banca Personal"
    name_en: "Relationship Manager / Personal Banking"
    description: "Gestiona la cartera de clientes: capta, fideliza y asesora en productos financieros. Interface principal entre cliente y entidad."
    description_en: "Manages client portfolio: acquires, retains and advises on financial products. Main interface between client and institution."
    castell_level: tronc
    fmv_usd_h: 50
    typical_actor: "Asesor financiero con MIFID II o certificación similar"
    typical_actor_en: "Financial advisor with MiFID II or equivalent certification"
    tags: ["cliente", "cartera", "asesoramiento"]

  - id: compliance_officer
    name: "Responsable de Cumplimiento (Compliance)"
    name_en: "Compliance Officer"
    description: "Asegura que la entidad opera dentro del marco normativo: AML, GDPR, MiFID II, PSD2. Nexo con reguladores."
    description_en: "Ensures the entity operates within the regulatory framework: AML, GDPR, MiFID II, PSD2. Link with regulators."
    castell_level: tronc
    fmv_usd_h: 72
    typical_actor: "Jurista o economista especializado en regulación financiera y prevención de blanqueo"
    typical_actor_en: "Lawyer or economist specialised in financial regulation and anti-money laundering"
    tags: ["cumplimiento", "regulacion", "AML"]

  - id: underwriter
    name: "Suscriptor / Underwriter"
    name_en: "Underwriter"
    description: "Evalúa y acepta riesgos en seguros o en estructuración de crédito. Define condiciones, primas y exclusiones."
    description_en: "Evaluates and accepts risks in insurance or credit structuring. Defines terms, premiums and exclusions."
    castell_level: tronc
    fmv_usd_h: 68
    typical_actor: "Actuario o especialista en suscripción con experiencia en ramos específicos"
    typical_actor_en: "Actuary or underwriting specialist with experience in specific lines of business"
    tags: ["suscripcion", "seguros", "pricing"]

  - id: investment_analyst
    name: "Analista de Inversiones"
    name_en: "Investment Analyst"
    description: "Analiza activos, sectores y oportunidades de inversión. Produce research y recomendaciones para gestores de cartera."
    description_en: "Analyses assets, sectors and investment opportunities. Produces research and recommendations for portfolio managers."
    castell_level: tronc
    fmv_usd_h: 75
    typical_actor: "CFA o economista con experiencia en mercados de capitales"
    typical_actor_en: "CFA or economist with capital markets experience"
    tags: ["inversiones", "research", "mercados"]

  - id: claims_handler
    name: "Gestor de Siniestros"
    name_en: "Claims Handler"
    description: "Tramita siniestros de seguros: verificación, valoración del daño, peritaje y liquidación. Cara humana en el momento de la verdad del seguro."
    description_en: "Processes insurance claims: verification, damage assessment, appraisal and settlement. Human face at the insurance moment of truth."
    castell_level: pinya
    fmv_usd_h: 30
    typical_actor: "Técnico de siniestros con conocimiento del ramo y habilidades de gestión de cliente en situación de estrés"
    typical_actor_en: "Claims technician with line-of-business knowledge and client management skills in stressful situations"
    tags: ["siniestros", "seguros", "cliente"]

  - id: fintech_product
    name: "Product Manager de Producto Digital"
    name_en: "Digital Product Manager"
    description: "Define y evoluciona los productos financieros digitales: apps, APIs bancarias, wallets y productos embedded finance."
    description_en: "Defines and evolves digital financial products: apps, banking APIs, wallets and embedded finance products."
    castell_level: tronc
    fmv_usd_h: 80
    typical_actor: "Product manager con experiencia en fintech, open banking o pagos digitales"
    typical_actor_en: "Product manager with fintech, open banking or digital payments experience"
    tags: ["digital", "producto", "fintech"]

  - id: treasury_ops
    name: "Operaciones de Tesorería"
    name_en: "Treasury Operations"
    description: "Gestiona la liquidez diaria, los flujos de caja y las operaciones de mercado monetario. Asegura que la entidad nunca tenga problemas de liquidez operativa."
    description_en: "Manages daily liquidity, cash flows and money market operations. Ensures the entity never faces operational liquidity issues."
    castell_level: pinya
    fmv_usd_h: 38
    typical_actor: "Técnico de tesorería con experiencia en sistemas de pagos y mercado interbancario"
    typical_actor_en: "Treasury technician with payment systems and interbank market experience"
    tags: ["tesoreria", "liquidez", "pagos"]

transactions:
  - id: tx_l01
    from: risk_analyst
    to: cfo_finance_director
    deliverable: "Informe de exposición al riesgo y límites recomendados por cartera"
    deliverable_en: "Risk exposure report and recommended limits by portfolio"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Si el CFO toma decisiones sin el informe de riesgo actualizado, la entidad opera a ciegas"

  - id: tx_l02
    from: compliance_officer
    to: cfo_finance_director
    deliverable: "Alertas regulatorias y estado de cumplimiento normativo"
    deliverable_en: "Regulatory alerts and compliance status report"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Las multas regulatorias no avisan — la alerta temprana de compliance es el activo más barato de la entidad"

  - id: tx_l03
    from: relationship_manager
    to: risk_analyst
    deliverable: "Solicitudes de crédito con perfil financiero del cliente"
    deliverable_en: "Credit applications with client financial profile"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Solicitudes incompletas alargan el ciclo de crédito y frustran al cliente"

  - id: tx_l04
    from: risk_analyst
    to: relationship_manager
    deliverable: "Decisión crediticia con condiciones, límite y justificación"
    deliverable_en: "Credit decision with terms, limit and rationale"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "Las decisiones crediticias sin justificación impiden al gestor defender el producto ante el cliente"

  - id: tx_l05
    from: underwriter
    to: relationship_manager
    deliverable: "Cotización y condiciones de póliza para el cliente"
    deliverable_en: "Policy quote and terms for the client"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "El tiempo de respuesta del underwriter es el factor número 1 en conversión de seguros B2B"

  - id: tx_l06
    from: claims_handler
    to: relationship_manager
    deliverable: "Estado de tramitación del siniestro del cliente y fecha estimada de resolución"
    deliverable_en: "Client claim processing status and estimated resolution date"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "El cliente que no sabe qué pasa con su siniestro no cancela la póliza — da un 1 en Google"

  - id: tx_l07
    from: investment_analyst
    to: relationship_manager
    deliverable: "Research de producto y argumentario actualizado para asesoramiento a cliente"
    deliverable_en: "Product research and updated advisory rationale for client advice"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Un gestor de relaciones sin research actualizado asesora desde la intuición, no desde el dato"

  - id: tx_l08
    from: fintech_product
    to: relationship_manager
    deliverable: "Nuevas funcionalidades del canal digital y formación para comunicar al cliente"
    deliverable_en: "New digital channel features and training to communicate to clients"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "El gestor que no conoce el canal digital pierde al cliente que quiere hacer todo desde el móvil"

  - id: tx_l09
    from: treasury_ops
    to: cfo_finance_director
    deliverable: "Posición de liquidez diaria y proyección de cash flow a 30 días"
    deliverable_en: "Daily liquidity position and 30-day cash flow projection"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "La posición de liquidez es el electrocardiograma de la entidad; debe leerse a diario"

  - id: tx_l10
    from: compliance_officer
    to: claims_handler
    deliverable: "Protocolo actualizado de gestión de siniestros sensibles (fraude, datos personales)"
    deliverable_en: "Updated protocol for sensitive claim handling (fraud, personal data)"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "Un siniestro mal tramitado por desconocimiento normativo puede convertirse en litigio"

  - id: tx_l11
    from: relationship_manager
    to: fintech_product
    deliverable: "Feedback de cliente sobre usabilidad del canal digital y funcionalidades demandadas"
    deliverable_en: "Client feedback on digital channel usability and demanded features"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "El product manager que no habla con gestores de relaciones diseña para usuarios imaginarios"

  - id: tx_l12
    from: risk_analyst
    to: underwriter
    deliverable: "Modelos de scoring y tablas actuariales actualizadas"
    deliverable_en: "Updated scoring models and actuarial tables"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "Suscribir riesgos con modelos desactualizados es tasar a ciegas"

  - id: tx_l13
    from: investment_analyst
    to: cfo_finance_director
    deliverable: "Recomendaciones de asignación de activos y alertas de riesgo de mercado"
    deliverable_en: "Asset allocation recommendations and market risk alerts"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "El CFO que no consume research interno toma decisiones de inversión más lentas y peor fundamentadas"

  - id: tx_l14
    from: cfo_finance_director
    to: compliance_officer
    deliverable: "Aprobación de nuevos productos y apertura de líneas de negocio con revisión previa"
    deliverable_en: "Approval of new products and business lines with prior compliance review"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "Lanzar un producto sin revisión de compliance puede suponer su retirada forzosa meses después"

  - id: tx_l15
    from: treasury_ops
    to: risk_analyst
    deliverable: "Datos de flujo de caja real para calibrar modelos de riesgo de liquidez"
    deliverable_en: "Actual cash flow data for liquidity risk model calibration"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Los modelos de riesgo de liquidez construidos sin datos reales de tesorería son teoría pura"

  - id: tx_l16
    from: claims_handler
    to: underwriter
    deliverable: "Estadísticas de siniestralidad real por ramo y perfil de asegurado"
    deliverable_en: "Actual claims statistics by line of business and insured profile"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "El feedback siniestros→suscripción es el ciclo de aprendizaje más importante del seguro; raramente ocurre"

patterns:
  - name: "Compliance como Freno"
    description: "El departamento de compliance se percibe como el que dice 'no' a todo. No participa en el diseño de productos sino que los recibe ya terminados para validar. El resultado son retrasos, rediseños costosos y una relación adversarial con el negocio."
    signal: "Tiempo medio de validación compliance de nuevos productos > 6 semanas; quejas internas frecuentes"

  - name: "El Gestor de Relaciones sin Red"
    description: "El relationship manager es el nodo central de la red de valor pero opera sin acceso ágil al análisis de riesgo, al producto digital y al estado de siniestros. Improvisa con el cliente porque los flujos internos son lentos o inexistentes."
    signal: "NPS de cliente bajo a pesar de satisfacción con el gestor; cliente que abandona cuando cambia de gestor"

  - name: "Ciclo Siniestros-Suscripción Roto"
    description: "Los datos reales de siniestralidad no retroalimentan al suscriptor. Las primas se calculan con modelos que no aprenden de la experiencia real. El resultado es selección adversa progresiva."
    signal: "Ratio combinado deteriorándose año a año sin cambios en la política de suscripción"

  - name: "Riesgo y Negocio en Guerra"
    description: "El equipo de riesgo rechaza operaciones que negocio considera aceptables. No existe un lenguaje común ni un proceso de apelación transparente. Los mejores clientes se van a la competencia que sí les financia."
    signal: "Tasa de rechazo crediticio > 35% con baja tasa de default posterior; quejas de clientes solventes rechazados"

  - name: "Digitalización sin Transformación"
    description: "La entidad tiene app y banca online pero los procesos internos siguen siendo analógicos. El cliente puede ver su saldo en el móvil pero necesita ir a la oficina para cualquier operación no trivial."
    signal: "Alta adopción de app pero NPS de canal digital negativo; operaciones digitales completadas < 40% del total"

---

## Actividades Financieras y Seguros — Contexto VNA

El sector financiero (CNAE 64-66) es donde la **confianza es el activo principal** y la red de valor tiene una dimensión regulatoria única: existen nodos externos obligatorios (reguladores, supervisores) que moldean todos los flujos internos.

### Dinámicas de Red de Valor

La paradoja central del sector es que sus flujos más críticos son **intangibles y bidireccionales**: la información de riesgo que permite prestar, la confianza que permite captar depósitos, el conocimiento actuarial que permite suscribir seguros. Ninguno de estos flujos aparece en el balance pero todos determinan la sostenibilidad del negocio.

El **relationship manager** es el nodo de mayor densidad de conexiones en la red — recibe y transmite hacia cliente, riesgo, producto y compliance simultáneamente. Cuando este nodo no tiene flujos de calidad desde los demás, la experiencia de cliente se degrada aunque los productos sean excelentes.

### El Regulador como Nodo de Red

A diferencia de otros sectores, en finanzas el regulador (BCE, CNMV, DGS) es un nodo activo de la red de valor que emite flujos normativos con fecha y consecuencias legales. La VNA aplicada a entidades financieras debe incluir estos nodos externos y los flujos de compliance como transacciones de primer orden.

### Bilingüe / Bilingual

Financial services VNA consistently reveals that the most critical intangible flow — risk assessment feeding the client-facing relationship manager in real time — is the one most often broken. When credit decisions arrive late or without rationale, the relationship manager loses the client not to a competitor product but to a competitor service experience. Fixing this single flow has measurable impact on conversion and retention within one quarter.
