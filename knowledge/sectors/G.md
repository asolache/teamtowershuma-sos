---
sector_id: G
sector_name: "Comercio al por Mayor y Menor"
sector_name_en: "Wholesale & Retail Trade"
cnae: "45-47"
version: "v11.1"
tags: ["comercio", "retail", "wholesale", "tienda", "ecommerce", "distribucion"]

roles:
  - id: retail_director
    name: "Director Comercial / de Tienda"
    name_en: "Commercial / Store Director"
    description: "Maximiza ventas y experiencia de cliente. Gestiona el P&L del punto de venta o del canal."
    description_en: "Maximizes sales and customer experience. Manages the P&L of the point of sale or channel."
    castell_level: pom_de_dalt
    fmv_usd_h: 70
    typical_actor: "Retail manager con experiencia en gestión de equipos y KPIs comerciales"
    typical_actor_en: "Retail manager with team management and commercial KPIs experience"
    tags: ["liderazgo", "ventas", "P&L"]

  - id: buyer
    name: "Comprador / Category Manager"
    name_en: "Buyer / Category Manager"
    description: "Selecciona y negocia el surtido de productos. Define márgenes, condiciones de compra y estrategia de categoría."
    description_en: "Selects and negotiates product assortment. Defines margins, purchasing terms and category strategy."
    castell_level: tronc
    fmv_usd_h: 58
    typical_actor: "Especialista en negociación con proveedores y análisis de categoría"
    typical_actor_en: "Specialist in supplier negotiation and category analysis"
    tags: ["compras", "categoria", "margen"]

  - id: store_associate
    name: "Dependiente / Asesor de Ventas"
    name_en: "Store Associate / Sales Advisor"
    description: "Atiende al cliente, gestiona el lineal y ejecuta la operativa diaria de punto de venta."
    description_en: "Serves customers, manages shelf space and executes daily point-of-sale operations."
    castell_level: pinya
    fmv_usd_h: 16
    typical_actor: "Perfil joven con habilidades de comunicación y conocimiento del producto"
    typical_actor_en: "Young profile with communication skills and product knowledge"
    tags: ["cliente", "venta", "tienda"]

  - id: logistics_coordinator
    name: "Coordinador de Logística y Almacén"
    name_en: "Logistics & Warehouse Coordinator"
    description: "Gestiona recepciones, almacenaje y preparación de pedidos. Reduce merma y asegura disponibilidad."
    description_en: "Manages inbound, storage and order picking. Reduces shrinkage and ensures availability."
    castell_level: tronc
    fmv_usd_h: 32
    typical_actor: "Responsable de almacén con experiencia en ERP y gestión de stocks"
    typical_actor_en: "Warehouse manager with ERP and stock management experience"
    tags: ["logistica", "almacen", "stock"]

  - id: ecommerce_manager
    name: "Responsable de eCommerce"
    name_en: "eCommerce Manager"
    description: "Opera el canal digital: catálogo online, conversión, fulfillment y experiencia digital del cliente."
    description_en: "Operates the digital channel: online catalogue, conversion, fulfilment and digital customer experience."
    castell_level: tronc
    fmv_usd_h: 52
    typical_actor: "Especialista en marketplace, SEO de producto y UX de tienda online"
    typical_actor_en: "Marketplace, product SEO and online store UX specialist"
    tags: ["digital", "ecommerce", "conversion"]

  - id: crm_analyst
    name: "Analista CRM y Fidelización"
    name_en: "CRM & Loyalty Analyst"
    description: "Analiza datos de cliente para mejorar retención, ticket medio y frecuencia de compra."
    description_en: "Analyses customer data to improve retention, average ticket and purchase frequency."
    castell_level: tronc
    fmv_usd_h: 44
    typical_actor: "Analista de datos con perfil de marketing relacional"
    typical_actor_en: "Data analyst with relational marketing profile"
    tags: ["CRM", "datos", "fidelizacion"]

  - id: visual_merchandiser
    name: "Visual Merchandiser"
    name_en: "Visual Merchandiser"
    description: "Diseña la experiencia física del punto de venta para maximizar conversión: layout, señalética y exposición."
    description_en: "Designs the physical point-of-sale experience to maximise conversion: layout, signage and display."
    castell_level: pinya
    fmv_usd_h: 26
    typical_actor: "Perfil creativo con formación en diseño de espacios comerciales"
    typical_actor_en: "Creative profile with training in retail space design"
    tags: ["visual", "experiencia", "layout"]

  - id: supply_planner
    name: "Planificador de Aprovisionamiento"
    name_en: "Supply Planner"
    description: "Calcula necesidades de reposición según ventas, rotación y fechas de caducidad. Evita quiebres y excesos."
    description_en: "Calculates replenishment needs based on sales, turnover and expiry dates. Prevents stockouts and overstock."
    castell_level: tronc
    fmv_usd_h: 38
    typical_actor: "Técnico de planificación con herramientas de demand planning"
    typical_actor_en: "Planning technician with demand planning tools"
    tags: ["aprovisionamiento", "rotacion", "reposicion"]

transactions:
  - id: tx_g01
    from: buyer
    to: logistics_coordinator
    deliverable: "Órdenes de compra y especificaciones de recepción"
    deliverable_en: "Purchase orders and goods receipt specifications"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Pedidos sin especificación generan recepciones incorrectas y discrepancias de factura"

  - id: tx_g02
    from: logistics_coordinator
    to: store_associate
    deliverable: "Producto disponible en lineal o listo para envío"
    deliverable_en: "Product available on shelf or ready to ship"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "La rotura de lineal es pérdida de venta directa e inmediata"

  - id: tx_g03
    from: store_associate
    to: crm_analyst
    deliverable: "Datos de venta, ticket y comportamiento en punto de venta"
    deliverable_en: "Sales data, ticket size and point-of-sale behaviour"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Sin captura de datos el CRM opera en el vacío"

  - id: tx_g04
    from: crm_analyst
    to: retail_director
    deliverable: "Insights de cliente: segmentación, churn y oportunidades de upsell"
    deliverable_en: "Customer insights: segmentation, churn and upsell opportunities"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Insights no accionados por dirección son burocracia disfrazada de analítica"

  - id: tx_g05
    from: buyer
    to: visual_merchandiser
    deliverable: "Brief de producto: posicionamiento, temporada y prioridades de surtido"
    deliverable_en: "Product brief: positioning, season and assortment priorities"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Sin brief el visual merchandiser trabaja por estética, no por estrategia comercial"

  - id: tx_g06
    from: visual_merchandiser
    to: store_associate
    deliverable: "Planograma y guía de montaje de expositor"
    deliverable_en: "Planogram and display assembly guide"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "Planogramas ignorados en tienda anulan la inversión en merchandising"

  - id: tx_g07
    from: supply_planner
    to: buyer
    deliverable: "Alerta de quiebre potencial o sobrestock por referencia"
    deliverable_en: "Potential stockout or overstock alert by SKU"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "Esta alerta preventiva vale más que cualquier promoción reactiva"

  - id: tx_g08
    from: ecommerce_manager
    to: logistics_coordinator
    deliverable: "Pedidos online y prioridades de fulfillment"
    deliverable_en: "Online orders and fulfilment priorities"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "El canal online y el físico compiten por el mismo stock sin coordinación"

  - id: tx_g09
    from: logistics_coordinator
    to: ecommerce_manager
    deliverable: "Stock disponible en tiempo real para el catálogo digital"
    deliverable_en: "Real-time available stock for digital catalogue"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "Vender online producto sin stock real destruye la experiencia de cliente"

  - id: tx_g10
    from: retail_director
    to: buyer
    deliverable: "Objetivos de margen bruto por categoría y temporada"
    deliverable_en: "Gross margin targets by category and season"
    type: intangible
    is_must: true
    frequency: baja
    health_hint: "Sin objetivos claros, el comprador optimiza volumen a costa de margen"

  - id: tx_g11
    from: store_associate
    to: retail_director
    deliverable: "Feedback de cliente: quejas, demandas no satisfechas, tendencias observadas"
    deliverable_en: "Customer feedback: complaints, unmet needs, observed trends"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "El dependiente es el mejor sensor de mercado y el menos escuchado"

  - id: tx_g12
    from: crm_analyst
    to: ecommerce_manager
    deliverable: "Segmentos de cliente para personalización de campañas digitales"
    deliverable_en: "Customer segments for digital campaign personalisation"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Sin segmentación el email marketing se convierte en spam costoso"

  - id: tx_g13
    from: supply_planner
    to: logistics_coordinator
    deliverable: "Plan de reposición semanal por referencia y ubicación"
    deliverable_en: "Weekly replenishment plan by SKU and location"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "El plan de reposición es el contrato interno más importante del retail"

  - id: tx_g14
    from: buyer
    to: store_associate
    deliverable: "Formación de producto: argumentario, características y comparativa competidora"
    deliverable_en: "Product training: sales pitch, features and competitive comparison"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Un vendedor sin conocimiento de producto pierde ventas a favor del ecommerce"

  - id: tx_g15
    from: ecommerce_manager
    to: crm_analyst
    deliverable: "Datos de comportamiento digital: carritos abandonados, búsquedas y tasa de conversión"
    deliverable_en: "Digital behaviour data: abandoned carts, searches and conversion rate"
    type: tangible
    is_must: false
    frequency: media
    health_hint: "El canal digital genera datos de intención que el físico no puede capturar"

patterns:
  - name: "Canal Online vs. Canal Físico"
    description: "El canal digital y las tiendas físicas compiten internamente por stock, presupuesto y atención de dirección. El cliente recibe mensajes y precios contradictorios según el canal."
    signal: "Diferencia de precio entre web y tienda > 5%, o tiempos de entrega omnicanal inconsistentes"

  - name: "El Comprador Aislado"
    description: "El category manager negocia con proveedores sin datos de cliente ni feedback de tienda. El surtido se decide por volumen y margen de compra, no por preferencia real del consumidor."
    signal: "Tasa de rotura en referencias más vendidas > 3% con stock elevado en otras referencias"

  - name: "CRM Decorativo"
    description: "Existe un sistema CRM sofisticado pero los insights que genera no llegan ni a dirección ni a tienda. Los datos se acumulan sin acción."
    signal: "Los informes de CRM se generan mensualmente pero nadie modifica precios, surtido ni acciones comerciales en base a ellos"

  - name: "Planograma Fantasma"
    description: "Los planogramas se diseñan centralmente pero se ejecutan de forma inconsistente en tienda. El visual merchandising vive en un PowerPoint, no en el lineal."
    signal: "Auditoria de tienda revela > 40% de incumplimiento de planograma"

---

## Comercio — Contexto VNA

El comercio minorista y mayorista (CNAE 45-47) es la red de valor más orientada al **flujo de información de demanda**. La cadena física de producto (proveedor → almacén → lineal → cliente) es visible. La cadena intangible — conocimiento del cliente, feedback de tendencia, inteligencia de categoría — es la que determina el éxito pero raramente está mapeada.

### Dinámicas de Red de Valor

La tensión fundamental del retail es que opera en **dos tiempos simultáneos**: el tiempo del cliente (decisión en segundos, expectativa de disponibilidad inmediata) y el tiempo del comprador (negociaciones estacionales, lead times de proveedor de semanas). La VNA hace visible esta brecha y los flujos que la gestionan.

El rol de **store associate** (dependiente) es el nodo más subvalorado de la red. Tiene acceso directo al conocimiento más valioso — qué busca el cliente que no encuentra, qué objeciones tiene, qué compara — pero raramente existe un flujo formal que lleve ese conocimiento a categorías o dirección.

### Omnicanalidad como Problema de Red

La transformación omnicanal falla cuando se gestiona como problema tecnológico (integrar sistemas) en lugar de como problema de red de valor (sincronizar flujos de información entre canal online, tienda, almacén y proveedor). La VNA aplicada a retail digital-físico integrado tiene un ROI probado.

### Bilingüe / Bilingual

Retail VNA analyses consistently reveal the same hidden pattern: the store associate — the person with the richest real-time customer knowledge — has no formal channel to influence buying decisions. Formalising this intangible flow (observed demand → buyer) typically unlocks a 3-5% improvement in assortment efficiency within one season.
