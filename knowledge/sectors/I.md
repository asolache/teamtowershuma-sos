---
sector_id: I
sector_name: "Hostelería y Turismo"
sector_name_en: "Accommodation & Food Services"
cnae: "55-56"
version: "v11.1"
tags: ["hosteleria", "turismo", "hotel", "restaurante", "experiencia", "hospitalidad"]

roles:
  - id: general_manager_hotel
    name: "Director / Gerente de Establecimiento"
    name_en: "Hotel / Venue General Manager"
    description: "Responsable de la experiencia global del huésped o comensal, la rentabilidad y la reputación del establecimiento."
    description_en: "Responsible for overall guest or diner experience, profitability and establishment reputation."
    castell_level: pom_de_dalt
    fmv_usd_h: 65
    typical_actor: "Hostelero con formación en gestión hotelera o F&B y P&L propio"
    typical_actor_en: "Hospitality professional with hotel management or F&B training and own P&L"
    tags: ["liderazgo", "experiencia", "reputacion"]

  - id: revenue_manager
    name: "Revenue Manager"
    name_en: "Revenue Manager"
    description: "Optimiza precios y ocupación mediante gestión de tarifas dinámicas, canales de distribución y forecasting de demanda."
    description_en: "Optimises prices and occupancy through dynamic rate management, distribution channels and demand forecasting."
    castell_level: tronc
    fmv_usd_h: 55
    typical_actor: "Especialista en revenue management con dominio de OTAs y channel manager"
    typical_actor_en: "Revenue management specialist with OTA and channel manager expertise"
    tags: ["revenue", "precios", "ocupacion"]

  - id: front_desk
    name: "Recepción / Host"
    name_en: "Front Desk / Host"
    description: "Primer y último contacto del huésped. Gestiona check-in, check-out, solicitudes especiales y resolución de incidencias."
    description_en: "First and last guest contact. Manages check-in, check-out, special requests and incident resolution."
    castell_level: pinya
    fmv_usd_h: 18
    typical_actor: "Perfil comunicativo, multilingüe, con alta orientación al cliente"
    typical_actor_en: "Communicative, multilingual profile with strong customer orientation"
    tags: ["recepcion", "huesped", "check-in"]

  - id: chef_kitchen
    name: "Chef / Jefe de Cocina"
    name_en: "Chef / Head of Kitchen"
    description: "Diseña la propuesta gastronómica, gestiona el equipo de cocina y controla la calidad y el coste de materia prima."
    description_en: "Designs the culinary offer, manages the kitchen team and controls quality and raw material cost."
    castell_level: tronc
    fmv_usd_h: 48
    typical_actor: "Cocinero con formación culinaria y experiencia en gestión de brigada"
    typical_actor_en: "Cook with culinary training and brigade management experience"
    tags: ["gastronomia", "cocina", "brigada"]

  - id: floor_staff
    name: "Camarero / Personal de Sala"
    name_en: "Waiter / Floor Staff"
    description: "Atiende al cliente en sala, ejecuta el servicio y es el embajador directo de la experiencia gastronómica."
    description_en: "Serves customers in the dining room, executes service and is the direct ambassador of the culinary experience."
    castell_level: pinya
    fmv_usd_h: 16
    typical_actor: "Profesional de sala con formación en protocolo y conocimiento de carta"
    typical_actor_en: "Front-of-house professional with protocol training and menu knowledge"
    tags: ["sala", "servicio", "cliente"]

  - id: housekeeping
    name: "Responsable de Pisos / Housekeeping"
    name_en: "Housekeeping Manager"
    description: "Coordina la limpieza y preparación de habitaciones. Responsable de la calidad percibida más silenciosa pero más valorada por el huésped."
    description_en: "Coordinates room cleaning and preparation. Responsible for the most silent yet most valued quality dimension perceived by guests."
    castell_level: tronc
    fmv_usd_h: 28
    typical_actor: "Gobernanta con experiencia en gestión de turnos y estándares de limpieza"
    typical_actor_en: "Head housekeeper with shift management and cleaning standards experience"
    tags: ["pisos", "limpieza", "estandares"]

  - id: events_coordinator
    name: "Coordinador de Eventos y Grupos"
    name_en: "Events & Groups Coordinator"
    description: "Planifica y ejecuta eventos (bodas, congresos, teambuildings). Gestiona la relación con el cliente B2B de alto valor."
    description_en: "Plans and executes events (weddings, conferences, team-buildings). Manages high-value B2B client relationships."
    castell_level: tronc
    fmv_usd_h: 38
    typical_actor: "Event planner con experiencia en logística de grandes grupos"
    typical_actor_en: "Event planner with large group logistics experience"
    tags: ["eventos", "grupos", "B2B"]

  - id: purchasing_food
    name: "Responsable de Compras de Alimentos"
    name_en: "Food Purchasing Manager"
    description: "Negocia y gestiona los proveedores de alimentos y bebidas. Equilibra calidad, frescura, coste y fiabilidad de suministro."
    description_en: "Negotiates and manages food and beverage suppliers. Balances quality, freshness, cost and supply reliability."
    castell_level: tronc
    fmv_usd_h: 36
    typical_actor: "Especialista en F&B con conocimiento de mercado de producto fresco y temporalidad"
    typical_actor_en: "F&B specialist with fresh produce market knowledge and seasonality awareness"
    tags: ["compras", "F&B", "proveedores"]

  - id: digital_reputation
    name: "Gestor de Reputación Digital"
    name_en: "Digital Reputation Manager"
    description: "Gestiona la presencia online del establecimiento: OTAs, redes sociales, reviews y posicionamiento en buscadores."
    description_en: "Manages the establishment's online presence: OTAs, social media, reviews and search engine positioning."
    castell_level: tronc
    fmv_usd_h: 34
    typical_actor: "Community manager especializado en hospitality con perfil de marketing digital"
    typical_actor_en: "Community manager specialised in hospitality with digital marketing profile"
    tags: ["reputacion", "OTA", "reviews"]

transactions:
  - id: tx_i01
    from: revenue_manager
    to: general_manager_hotel
    deliverable: "Forecast de ocupación, tarifa media y RevPAR con recomendación de pricing"
    deliverable_en: "Occupancy forecast, ADR and RevPAR with pricing recommendation"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "Sin revenue management activo el establecimiento pierde entre 8-15% de ingreso potencial"

  - id: tx_i02
    from: front_desk
    to: general_manager_hotel
    deliverable: "Registro de quejas, peticiones especiales y feedback del huésped"
    deliverable_en: "Guest complaints, special requests and feedback log"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "La queja no registrada es la oportunidad de mejora más cara: el cliente se va y no vuelve"

  - id: tx_i03
    from: housekeeping
    to: front_desk
    deliverable: "Estado de habitaciones: limpias, bloqueadas e incidencias de mantenimiento"
    deliverable_en: "Room status: clean, blocked and maintenance incidents"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "El retraso en comunicar habitaciones listas genera esperas en recepción que el huésped no olvida"

  - id: tx_i04
    from: chef_kitchen
    to: purchasing_food
    deliverable: "Necesidad de materia prima, especificaciones de calidad y calendario de menú"
    deliverable_en: "Raw material requirements, quality specifications and menu calendar"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "La comunicación tardía de necesidades fuerza compras de urgencia a precios elevados"

  - id: tx_i05
    from: purchasing_food
    to: chef_kitchen
    deliverable: "Albaranes de recepción y alertas de producto no disponible o fuera de especificación"
    deliverable_en: "Delivery notes and alerts for unavailable or out-of-spec products"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "El chef que se entera de la falta de producto al empezar el servicio es el chef que improvisa mal"

  - id: tx_i06
    from: floor_staff
    to: chef_kitchen
    deliverable: "Comandas, especificaciones de alérgenos y feedback de cliente sobre plato"
    deliverable_en: "Orders, allergen specifications and customer dish feedback"
    type: tangible
    is_must: true
    frequency: alta
    health_hint: "El error de alérgenos tiene consecuencias legales y sanitarias; la cadena debe ser perfecta"

  - id: tx_i07
    from: digital_reputation
    to: general_manager_hotel
    deliverable: "Análisis semanal de reviews: temas recurrentes, score y comparativa competidores"
    deliverable_en: "Weekly review analysis: recurring themes, score and competitor benchmarking"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Un punto de bajada en Booking o TripAdvisor reduce la ocupación directa un 5-8%"

  - id: tx_i08
    from: events_coordinator
    to: chef_kitchen
    deliverable: "Briefing de evento: menú pactado, número de comensales, horarios y restricciones"
    deliverable_en: "Event brief: agreed menu, diner count, timings and dietary restrictions"
    type: tangible
    is_must: true
    frequency: media
    health_hint: "El brief incompleto es el origen del 80% de los fallos en servicio de eventos"

  - id: tx_i09
    from: revenue_manager
    to: digital_reputation
    deliverable: "Estrategia de canales: qué OTAs priorizar, cuotas y restricciones de precio"
    deliverable_en: "Channel strategy: which OTAs to prioritise, quotas and rate restrictions"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "Sin coordinación revenue-reputación digital, las OTAs controlan el precio y la imagen"

  - id: tx_i10
    from: front_desk
    to: housekeeping
    deliverable: "Previsión de llegadas, salidas anticipadas y solicitudes especiales de habitación"
    deliverable_en: "Arrival forecast, early departures and special room requests"
    type: intangible
    is_must: true
    frequency: alta
    health_hint: "Housekeeping planifica turnos con 0 visibilidad de ocupación real cuando esta comunicación falla"

  - id: tx_i11
    from: general_manager_hotel
    to: events_coordinator
    deliverable: "Autorización de tarifas, espacios disponibles y dotación de recursos para eventos"
    deliverable_en: "Rate authorisation, available spaces and resource allocation for events"
    type: intangible
    is_must: true
    frequency: media
    health_hint: "El coordinador que vende sin autorización compromete recursos que otros departamentos ya tienen asignados"

  - id: tx_i12
    from: floor_staff
    to: digital_reputation
    deliverable: "Historias de cliente positivas y momentos de servicio excepcional (contenido auténtico)"
    deliverable_en: "Positive customer stories and exceptional service moments (authentic content)"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "El mejor contenido de redes sociales para hostelería es el que genera el equipo de sala, nunca el community manager"

  - id: tx_i13
    from: purchasing_food
    to: chef_kitchen
    deliverable: "Oportunidades de mercado: producto de temporada, precio especial y producto local emergente"
    deliverable_en: "Market opportunities: seasonal produce, special pricing and emerging local products"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "La cocina de kilómetro cero requiere que compras sea un socio creativo, no solo un proveedor de pedidos"

  - id: tx_i14
    from: housekeeping
    to: general_manager_hotel
    deliverable: "Necesidades de inversión en equipamiento, materiales y mejoras de habitación"
    deliverable_en: "Investment needs for equipment, materials and room improvements"
    type: intangible
    is_must: false
    frequency: baja
    health_hint: "Housekeeping ve el estado real del producto antes que ninguna auditoría de calidad"

  - id: tx_i15
    from: digital_reputation
    to: revenue_manager
    deliverable: "Señales de demanda: búsquedas crecientes, fechas de alta intención y segmentos de viajero activos"
    deliverable_en: "Demand signals: growing searches, high-intent dates and active traveller segments"
    type: intangible
    is_must: false
    frequency: media
    health_hint: "Los datos de demanda online anticipan la ocupación 4-6 semanas antes que los canales tradicionales"

patterns:
  - name: "La Queja Invisible"
    description: "El huésped insatisfecho no se queja en el establecimiento — puntúa mal en la OTA al llegar a casa. El ciclo de feedback es tan lento que el daño reputacional ya está hecho cuando se detecta el problema."
    signal: "Score en Booking o Google cayendo sin incidencias registradas en recepción"

  - name: "Revenue y Reputación Desconectados"
    description: "Revenue management baja tarifas para rellenar ocupación sin analizar qué segmento de cliente entra. Un segmento de baja calidad llena el hotel pero destruye el score en 2 temporadas."
    signal: "Ocupación alta con puntuación de reviews cayendo; mezcla de cliente incoherente con el posicionamiento"

  - name: "Cocina como Isla"
    description: "El chef opera con autonomía total pero sin feedback de sala, sin datos de rentabilidad por plato y sin coordinación con compras sobre temporalidad. El menú es artístico pero financieramente insostenible."
    signal: "Food cost > 38% sin explicación de dirección, platos con alta merma no retirados de carta"

  - name: "Eventos como Caos Organizado"
    description: "Cada evento se gestiona desde cero sin proceso estandarizado. El coordinador es el héroe que resuelve lo que no se planificó, pero cada evento agota al equipo y no genera aprendizaje."
    signal: "Satisfacción de cliente en eventos alta pero NPS interno del equipo bajo; rotación elevada en el departamento"

  - name: "Housekeeping Invisible"
    description: "El departamento que más impacta en la satisfacción del huésped (limpieza, orden, detalles de habitación) es el menos representado en las reuniones de dirección y el primero en recibir recortes."
    signal: "Score de limpieza en reviews 0.5 puntos por debajo del score global del establecimiento"

---

## Hostelería y Turismo — Contexto VNA

La hostelería (CNAE 55-56) es el sector donde **la experiencia del cliente es el producto** y ese producto se crea en tiempo real, de forma simultánea entre múltiples roles que raramente tienen un mapa claro de cómo sus flujos de valor se interconectan.

### Dinámicas de Red de Valor

La paradoja central de la hostelería es la **simultaneidad de producción y consumo**: el servicio de restaurante o la experiencia hotelera se producen y consumen al mismo tiempo, sin posibilidad de corrección una vez entregados. Esto hace que los flujos de información internos (estado de habitaciones, disponibilidad de producto, briefing de eventos) tengan un valor temporal único: si llegan tarde, son inútiles.

El **personal de sala y recepción** (pinya) opera en la interfaz más crítica de la red pero raramente recibe los flujos de información que necesita para tomar buenas decisiones en tiempo real. Un camarero que no sabe qué plato se ha acabado, o una recepcionista que no sabe qué habitaciones están listas, genera experiencias de cliente deficientes que ninguna tecnología puede compensar.

### Reputación Digital como Flujo de Valor

En hostelería, la reputación online no es un canal de marketing: es el principal activo de la red de valor. Cada interacción del huésped puede generar un flujo tangible (reserva directa futura) o intangible (recomendación, review positiva) que alimenta o destruye el RevPAR de las temporadas siguientes. La VNA aplicada a reputación digital tiene un ROI directo y medible.

### Bilingüe / Bilingual

Hospitality VNA reveals that the establishment's most valuable knowledge — what guests truly value, what creates delight vs. disappointment — resides with floor staff and housekeeping, not with management. Formalising upward intangible flows from these roles to revenue management and the chef typically improves review scores by 0.3-0.5 points within one season, which translates directly into occupancy gains and higher ADR.
