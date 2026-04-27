---
id: sop-la-colla
type: sop
soc_ref: soc-la-colla
brand_ref: soc-teamtowers-brand
version: v1
status: draft
author: "@alvaro"
duration_minutes: 240   # 1 sesión de mapeo (4 h). Procesos completos: multi-sesión.
session_count_typical: 3
session_duration_minutes: [180, 240]   # 3-4 horas por sesión
audience: ["empresas", "ayuntamientos", "startups", "fundaciones", "matrices incubadoras", "comunidades de práctica"]
group_size_min: 8
group_size_max: 30   # >30 → dividir en sub-grupos paralelos
languages: ["castellano", "catalán", "inglés"]
prerequisites:
  - "Sponsor ejecutivo del cliente con capacidad de aprobar acciones derivadas."
  - "Acuerdo explícito de que el VNA puede revelar disfunciones del organigrama actual."
  - "Sala con pared o espacio amplio + post-its + rotuladores + pegatinas (azul/amarillo) + papel grande (estraza)."
  - "Alternativa digital: Miro / Draw.io / SOS ValueMap."
  - "Lista preliminar de 10-30 participantes acordada con sponsor."
materials:
  - "Post-its (varios colores: principal, MUST verde, EXTRA fucsia)"
  - "Rotuladores gruesos"
  - "Pegatinas redondas: azul (satisfecho), amarillo (insatisfecho)"
  - "Papel grande de estraza o papelógrafo unido"
  - "Cámara para captura del mapa físico"
  - "Acceso a Miro / Draw.io / SOS para digitalización"
deliverables:
  - "Mapa VNA digitalizado del ámbito acordado (8-12 roles, 15-30 transacciones)"
  - "Lista de retos identificados por el equipo"
  - "Propuestas de mejora priorizadas (formato ejecutivo)"
  - "Lista de roles pendientes para próximas sesiones / entrevistas individuales"
  - "Informe final consolidado tras todas las sesiones"
keywords: [la-colla, vna, value-network-analysis, mapeo, roles, transacciones, MUST, EXTRA, pulso, retos, kaizen, kaikaku, ikea, pantheon]
fmv_eur_h: null   # Tarifa por sesión + análisis posterior. NO incluir en outputs MD.
geographic_scope: "Estándar Barcelona/Madrid <2h; resto España/Europa con suplementos; remoto vía Miro disponible"
---

# La Colla · SOP v1

> Procedimiento estándar para acompañar a un cliente en la
> construcción de su Value Network Analysis. Basado en Verna Allee
> y la guía de Pantheon Work / Value Network Lab.

---

## Estructura general (multi-sesión)

Un proceso La Colla completo dura típicamente **3-12 semanas** según
alcance y se divide en 3 fases:

| Fase | Sesiones | Duración total |
|---|---|---|
| **A · Preparación** | 1 reunión sponsor + diseño | 1-2 semanas |
| **B · Mapeo y análisis** | 1-3 sesiones grupales + entrevistas | 2-6 semanas |
| **C · Síntesis y entrega** | 1 sesión ejecutiva + informe | 1-3 semanas |

La sesión-tipo grupal dura **3-4 horas** y sigue los 7 pasos del
método Allee/Pantheon + la "bola extra" (insights). Procesos grandes
suelen requerir **2-3 sesiones** + entrevistas individuales a roles
pendientes (típicamente Dirección, IT, Proveedores, etc.).

---

## Fase A · Preparación (off-site, 1-2 semanas)

### A.1 Reunión con sponsor (60-90 min)

Confirmaciones obligatorias:

1. **Ámbito del análisis**: ¿toda la organización? ¿un área? ¿un
   servicio? ¿un proceso transversal? Más acotado = más profundidad.
2. **Objetivo del análisis**: diagnóstico estratégico, preparación de
   transformación digital, integración IA, resolución de cuello de
   botella, post-fusión, pre-franquicia, etc.
3. **Permisos y red flags**: ¿qué temas pueden tocarse abiertamente?
   ¿cuáles requieren tacto? ¿hay asimetrías de poder en la sala?
4. **Lista preliminar de invitados** (10-30 personas): mix de
   internos diversos (operativos + estratégicos + soporte) + externos
   relevantes (clientes clave, proveedores, partners).
5. **Calendario**: fechas tentativas de las 1-3 sesiones grupales +
   ventana para entrevistas.
6. **Sponsor activo**: ¿quién recibe el informe final? ¿quién aprueba
   las acciones derivadas?

Output: **encuadre firmado por sponsor** (correo o documento).

### A.2 Diseño operativo (offline, 3-5 días)

- Diseño del facilitador: sub-ámbitos a cubrir si el alcance es
  amplio (cómo distribuir grupos paralelos si >30 pax).
- Material logístico (sala, post-its, rotuladores, pegatinas).
- Configuración del proyecto en SOS (con `kind: 'la-colla'`) listo
  para digitalizar el mapa en Miro o el ValueMap nativo del SOS.
- Plantilla de captura de notas para el facilitador.

---

## Fase B · Mapeo y análisis (sesiones grupales)

Cada sesión grupal sigue los 7 pasos del método Allee / Pantheon
Work. La primera sesión es la más completa; sesiones posteriores
profundizan, validan o expanden.

### Sesión 1 (3-4 h) · Mapa inicial

**Paso 1 · Decidir participantes (off-site, ya hecho en Fase A)**

Repaso rápido al inicio de la sesión: ¿quién está aquí? ¿quién
falta? Anotar pendientes para próximas sesiones.

**Paso 2 · Definir el alcance (10 min)**

El facilitador escribe en la cabecera del papel grande:
- Ámbito (ej. "Servicios y Devoluciones · IKEA España · Madrid")
- Fecha
- Nombres de los participantes
- Versión del mapa (v1.0)

**Paso 3 · Listar 10-15 personas clave (15 min)**

Cada participante escribe en post-its los nombres de las 10-15
personas (internas o externas) con las que más se ha relacionado
en los últimos 12-18 meses dentro del ámbito.

**Paso 4 · Agrupar en roles reales (30-45 min)**

El grupo agrupa los post-its por **contribución real**, no por
cargo. Si una persona contribuye a varios roles, se replica.

Idealmente **8-10 roles finales** (máximo 12). Ejemplos del caso
IKEA Ventas y Devoluciones (oct 2021):

1. Cliente
2. Vendedor
3. Atención al Cliente
4. Coordinación de Servicios
5. Contratación de Proveedores
6. Logística
7. Proveedor
8. Pago de Proveedores
9. Diseño de Cartera de Servicios
10. Dirección

> Otros roles que podrían emerger: clientes de e-commerce,
> comunidad de redes sociales, medios. Nombrarlos como pendientes
> aunque no se mapeen en la primera sesión.

**Paso 5 · Mapear transacciones y entregables (60-75 min)**

- Rol más central en el medio del papel; los demás alrededor según
  proximidad de transacciones.
- Una flecha por dirección entre roles que intercambian valor.
- **Entregables MUST (verde)**: contractuales, esperables, exigibles
  (pedido, factura, contrato firmado, prestación de servicio,
  cartera de servicios). Línea continua.
- **Entregables EXTRA (fucsia)**: no contractuales, "pegamento"
  (consejo, confianza, voz de alarma, conciliación informal,
  reporting motivos de incidencia). Línea discontinua.
- Etiquetar cada flecha con el nombre del entregable (sustantivo,
  no verbo: "Pedido", "Cartera de Servicios", "Solución",
  "Distribución de ventas por flujo").

Ejemplos del caso IKEA (entregables satisfactorios):

| De | Para | Entregable |
|---|---|---|
| Cliente | Vendedor | Pedido |
| Cliente | Vendedor | € (pago) |
| Vendedor | Cliente | Cartera de Servicios |
| Atención al Cliente | Cliente | Solución |
| Logística | Proveedor | Pedido Preparado |
| Logística | Diseño Cartera Servicios | Distribución de ventas por flujo |
| Coordinación Servicios | Logística | Reunión de Operación |
| Proveedor | Cliente | Prestación de Servicio |

Ejemplos de entregables insatisfactorios (mismo caso):

| De | Para | Entregable | Por qué insatisfactorio |
|---|---|---|---|
| Cliente | Vendedor | Pedido (IT) | El sistema informático actual genera fricción |
| Vendedor | Logística | Pedido del Cliente | Crítico, fallos de comunicación |
| Vendedor | Coord Servicios | Creación extras capacidad (IT) | Sistema rígido |
| Atención Cliente | Diseño Cartera Servicios | Reporting motivos incidencia | Falta granularidad |
| Atención Cliente | Coord Servicios | Resolución Causa Raíz | Tarda demasiado |
| Proveedor | Cliente | Prestación de Servicio | Crítico, comunicación al cliente fragmentada |

**Paso 6 · Indicar pulso de satisfacción (30 min)**

Para los 10-15 entregables más críticos, los participantes colocan
pegatinas:

- **Azul** = satisfecho / adecuado.
- **Amarillo** = insatisfecho / problemas / mejora urgente.

Vale poner varias pegatinas en la misma flecha si hay opiniones
distintas. Si hay azul + amarillo a la vez en un entregable,
indica inconsistencia entre quien lo da y quien lo recibe — eso
es un insight valioso.

**Paso 7 · Secuenciar para validar el mapa (20-30 min)**

El facilitador propone un escenario típico ("un nuevo cliente entra
y solicita un servicio") y el grupo recorre el mapa en orden
narrativo. Objetivo: confirmar que el mapa refleja la realidad
dinámica, detectar caminos múltiples y bucles de feedback.

**Bola extra · Generar insights (30-45 min)**

Preguntas disparadoras (Pantheon Work):

1. ¿Quién es el nodo más activo? ¿Y el menos?
2. ¿Quién debería aparecer y no está?
3. ¿Qué relaciones se deberían iniciar / fortalecer / retomar?
4. ¿Hay saturación en algún rol? ¿Desequilibrios dar/recibir?
5. ¿Algún entregable en riesgo o débil?
6. ¿Oportunidades de expansión, co-creación o disrupción (Kaikaku)?
7. ¿Cómo impacta esto en tiempos, calidad, innovación, modelos de
   negocio?

Output de la Sesión 1:
- **Mapa físico** (foto + digitalización en SOS / Miro).
- **Lista de retos** (no propuestas todavía — sólo el dolor).
- **Lista de roles pendientes** para próximas sesiones / entrevistas.
- **Lista de entregables a investigar** (insatisfactorios o
  controvertidos).

---

### Sesión 2 · Profundización y análisis (3-4 h)

Trabajo del facilitador entre Sesión 1 y 2: digitalizar el mapa,
identificar patrones, preparar preguntas de profundización.

Estructura típica:

1. **Repaso del mapa digitalizado** (15 min): proyectar el v2 limpio
   y validar con el grupo.
2. **Profundización en zonas críticas** (60 min): los entregables
   amarillos del pulso se discuten en sub-grupos.
3. **Identificación de retos** (45 min): el grupo formula los
   problemas estructurales que el mapa revela. Ejemplos del caso
   IKEA:
   - "Cuando cancelas un pedido, previamente hay que cancelar el
     servicio (no lo hace automáticamente). Las cancelaciones
     automáticas no liberan capacidad."
   - "Los servicios bloqueados y no ejecutados se pagan."
   - "Las condiciones pactadas con el proveedor no siempre
     corresponden a las pactadas con el cliente."
   - "Los KPIs de performance no tienen suficiente granularidad."
   - "La información al cliente durante la entrega es fragmentada."
4. **Propuestas de mejora** (60 min): por cada reto, el grupo
   propone solución. Formato: **Diagnóstico → Solución → Rol
   emergente (si aplica)**.

   Ejemplos del caso IKEA (7 propuestas):
   1. Simplificación y revisión semántica de cartera de servicios.
   2. Comunicación del servicio integrado al comprador.
   3. Acompañamiento personalizado al comprador.
   4. Nueva herramienta de pedidos (rol emergente: Product Owner).
   5. Cartera de Servicios en negociación con proveedores.
   6. Ajustar contratos cliente a negociado con proveedor.
   7. Clarificar y formalizar resolución de incidencias.

5. **Roles para próxima sesión / entrevistas** (15 min): definir
   pendientes. En el caso IKEA fueron: Dirección de Tienda,
   Servicios IT, Proveedor, Negociación con Proveedores. Las
   entrevistas pueden ser breves (~45 min cada una).

---

### Sesión 3+ (opcional) · Validación con roles pendientes

Si quedan roles que no estuvieron en Sesión 1-2, el facilitador
realiza **entrevistas breves (45-60 min)** individuales o en
grupos pequeños y vuelca los hallazgos al mapa. Esto puede
hacerse de forma compartida con el equipo en una sesión
adicional (más eficiente) o asíncrona.

---

## Fase C · Síntesis y entrega ejecutiva

### C.1 Sesión ejecutiva con sponsor + dirección (60-90 min)

Estructura recomendada (alineada con SOP-Brand):

1. Contexto en 1 frase.
2. Mapa de Red simplificado (1 slide con saturaciones marcadas).
3. 3-5 insights clave con impacto estimado.
4. 3-6 recomendaciones priorizadas: qué, quién, cuándo, beneficio.
5. Próximos pasos (piloto, validación, sponsor para implementación).

Lenguaje **de negocio**, no de metodología. Evitar términos
"nodos / transacciones / MUST / EXTRA" salvo que pregunten.
Dar protagonismo al **mapa visual**, que ocupe ≥50% del tiempo.

### C.2 Informe final (entrega 5-10 días después)

Documento de 10-15 páginas que incluye:

1. Portada ejecutiva.
2. Contexto y problema.
3. Mapa VNA en alta resolución.
4. Lista de retos identificados (con citas reales si autorizado).
5. Propuestas de mejora con diagnóstico/solución/responsable/plazo.
6. Lecciones aprendidas / voces de participantes.
7. Hoja de ruta de seguimiento.
8. Anexos: roles pendientes, sesiones futuras sugeridas.

Persistencia en SOS: cada propuesta como `deliverable`
kind=`improvement-proposal`. El informe completo como
`deliverable` kind=`vna-final-report` firmado.

---

## Reglas de división por tamaño

| Total participantes | Composición |
|---|---|
| **8-15** | Un solo grupo, 1 facilitador |
| **16-30** | Un solo grupo, 1 facilitador + 1 ayudante de captura |
| **31-50** | 2 grupos paralelos (mismo ámbito), 2 facilitadores, sesión común al final |
| **>50** | Dividir por sub-ámbitos (áreas, servicios) con un facilitador cada uno; sesión maestra de integración |

---

## Variantes operativas

| Variante | Modulación |
|---|---|
| **VNA estratégico (toda la organización)** | 3-4 sesiones, 6-12 sem, sponsor C-level obligatorio |
| **VNA táctico (un proceso)** | 2 sesiones + entrevistas, 3-6 sem |
| **VNA por sede / franquicia** | Una sesión por sede + integración cross-sede |
| **VNA preparatorio para IA** | Énfasis en entregables intangibles que la IA no puede sustituir |
| **VNA post-fusión** | Énfasis en huecos, duplicidades y roles emergentes |
| **Remoto / híbrido** | Miro como tablero, breakout rooms, captura digital nativa |
| **Continuación de Fent Pinya** | Aprovechar la cohesión y el vocabulario casteller ya instalado |

---

## Indicadores de éxito

| Dimensión | Verde | Ámbar | Rojo |
|---|---|---|---|
| Mapa con calidad | ≥8 roles, ≥15 tx, ≥30% intangibles | 5-7 roles | <5 roles |
| Retos identificados | 3-7 retos consensuados | 1-2 | 0 |
| Propuestas accionables | ≥5 con responsable y plazo | 2-4 | <2 |
| Voces emergentes ("el valor fluye", etc.) | Sí, espontáneas | 1-2 frases | Ninguna |
| Compromiso del sponsor con seguimiento | Acuerdo de implementación firmado | Aprobación verbal | Sin acción |
| NPS post-proceso (1 mes) | ≥9 | 7-8 | <7 |

---

## Conexión con SOS · Mind-as-Graph

| Output del proceso | Tipo de nodo | Cuándo |
|---|---|---|
| Workshop registrado kind=la-colla | `workshop` | Inicio |
| Roles VNA detectados | `vna_role` | Sesión 1, paso 4 |
| Transacciones MUST | `vna_transaction` (tangible) | Sesión 1, paso 5 |
| Transacciones EXTRA | `vna_transaction` (intangible) | Sesión 1, paso 5 |
| Pulso (satisfacción) | atributo de la tx | Sesión 1, paso 6 |
| Retos | `pattern` | Sesión 2 |
| Propuestas de mejora | `deliverable` kind=improvement-proposal | Sesión 2 |
| Citas de participantes | `skill_node` | Cualquier sesión |
| Entrevistas a roles pendientes | sub-`workshop` o nota | Entre sesiones |
| Mapa final | `signed_artifact` | Fase C |
| Informe ejecutivo | `deliverable` kind=vna-final-report | Fase C |

Esto convierte el proceso La Colla en un **proyecto SOS vivo** que
el cliente puede continuar usando, exportar firmado, y reutilizar
para sedes / franquicias mediante la función de export/import.

---

## Citas clave para usar en propuestas e informes

> "El objetivo ya no es encontrar y optimizar un único proceso óptimo.
> El objetivo es optimizar múltiples vías y lograr resultados
> consistentes, permitiendo la variación necesaria para la innovación,
> la resiliencia y la agilidad de la red."  
> — **Verna Allee**

> "Cualquier pieza de software refleja la estructura organizacional
> que la produjo."  
> — **Melvin Conway, 1967**

> "Cambiar la mentalidad a roles en lugar de cargos abre un mundo de
> posibilidades."  
> — **Verna Allee**

---

## TODOs vivos

- [ ] Plantilla específica de informe ejecutivo en MD para descarga.
- [ ] Adaptación del SOP para sectores específicos (retail, banca,
      sanidad, educación) cuando @alvaro pase casos.
- [ ] Integración con módulos LMS si la franquicia de formación VNA
      avanza.
- [ ] Conectar con SOC `soc-colla-castellera-vna-model` (modelo VNA
      de la propia colla castellera, ya existe en
      `clients/colla-castellera-vna-model.md`).

---

*SOP draft v1 · TeamTowers / Value Network Lab · alineado con SOC*
*`soc-la-colla` y SOC raíz `soc-teamtowers-brand`. Basado en Verna*
*Allee (2008) y Pantheon Work (Blanco-Gracia & Astiz, 2018).*
