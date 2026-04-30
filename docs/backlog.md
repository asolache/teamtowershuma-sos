# SOS V11 · Backlog vivo

> Tesis raíz de TeamTowers SOS — *Swarm Operative System*:
> un sistema operativo de configurar y orquestar agentes (humanos + IA)
> bajo el contrato **SOC + SOP + DTD (Deliverable Test Driven)**, donde cada
> entregable verificable permite que una IA decida `true/false` y siga
> automatizando, hasta tender al máximo de automatización al menor coste
> de tokens posible.
>
> Visión operativa: **"Antigravity"** — soberanía total de datos (todo
> en navegador, local-first), descentralización en lugar de cloud, máxima
> capacidad de automatización al mínimo coste, valor de los humanos en
> los intangibles que las IAs no pueden replicar (memoria cuántica
> contextual, presencia, sentido).

---

## Estado de avance

### Ola 1 · Fent Pinya Ops + Mind-as-Graph (✅ CERRADA en `main` · `6a630d5`)

| ID | Historia | Tests |
|---|---|---|
| H1.1 | KB Mind-as-Graph schema (KB_UPSERT/KB_DELETE) | ✅ 11 asserts |
| H1.3 | Export/Import firmado ECDSA P-256 | ✅ 10 asserts |
| H1.4 | Estructura `knowledge/socs/` + `knowledge/sops/` | ✅ |
| H1.5 | KnowledgeLoader carga SOCs/SOPs + projectId | ✅ 24 asserts |
| H1.6 | Catálogo TeamTowers 2026 (3 SOCs · 3 SOPs) | ✅ |
| H1.7 | SOC+SOP "La Colla" (proceso VNA) + stubs | ✅ |
| H2.1 | Vista `/workshops` CRUD + estados | ✅ 8 asserts |
| H2.3 | Propuesta IA Context-First | ✅ 10 asserts |
| H2.5 | Informe post-taller IA Context-First | ✅ 12 asserts |
| H2.6 | Selector tipo de servicio (6 formatos) | ✅ 15 asserts |
| BUG-001 | Scroll en Dashboard y otras vistas | ✅ |

**90 asserts en 7 suites** · Tag local `v11.1.0-ola1`.

---

### Ola 2 · Antigravity Engine (✅ CERRADA en `main` · `8cdae10` · tag `v11.2.0-ola2`)

| ID | Historia | Tests |
|---|---|---|
| H7.1 | Vista `/kanban` Work Orders → Ledger (cierra lazo SOP→WO→Ledger) | ✅ 16 asserts |
| H7.2 | Auto-ejecución de WO por agente IA con captura tokens reales | ✅ 20 asserts |
| H1.8 | Auditoría TDD del Knowledge Base · readiness dinámico por sector | ✅ 10 asserts |
| H7.3 | Auto-generación de WO desde un SOP con `steps:` estructurado | ✅ 24 asserts |
| H1.8.1 | Fix criterio readiness · bilingualRoles opcional | ✅ |

**160+ asserts en 11 suites** · Tag local `v11.2.0-ola2`.

---

### Ola 3 · Cliente como ciudadano de primera (🟢 EN CURSO en `claude/value-map-tool-8ovUP`)

| ID | Historia | Estado |
|---|---|---|
| H1.6.1 | Charla teatralizada v1 (pre-trabajo + arte vivo) + Custom 5 variantes v1 | ✅ verde |
| H1.10.1 | Clonación sector → cliente con LLM (Dashboard + sectorCloner + tests) | ✅ verde end-to-end con LLM real (cliente IKEA Madrid generado correctamente) |
| **BUG-002** | extractJsonFromLlmOutput robusto a fences markdown | ✅ fixed (13 asserts regression test) |
| **BUG-003** | Dynamic import Orchestrator con cache-bust en 3 puntos LLM | ✅ fixed |
| **BUG-004** | max_tokens 4096→8192 (clonación de sectores grandes truncaba JSON) | ✅ fixed |
| **BUG-005** | Scroll en `/kanban` (y `/workshops`): patrón shell fija + main scroll | ✅ fixed |
| **BUG-006** | Flechas ValueMap sin punta visible (refX fuera de viewBox + fill:none) | ✅ fixed v3 (recortar path al borde del nodo en tick + marker refX=10) |
| **H7.5** | Filtro por proyecto en `/kanban` (selector + URL persistente + WO creada hereda projectId) | ✅ verde |
| **OPS-001** | ⚠ Purga de caché del navegador BORRA TAMBIÉN IndexedDB → se pierden proyectos. Documentar protocolo: SIEMPRE Export firmado antes de purgar. Futuro: persistir snapshot diario automático. | 🟡 documentar |
| H1.10.2 | Fase 2 · evolución VNA cliente → SOPs específicos por rol. Botón en inspector ValueMap "📋 Generar SOP del rol con IA" cuando hay projectId. SOP generado por rol con steps[] auto-WO. Persistido como nodo `type:'sop'` con `projectId` y `kind:'project-role-sop'`. | ✅ verde (botón inspector + roleSopGenerator + persistencia) |
| H1.10.3 | Modal "📋 Desde SOP" del Kanban adaptativo · si filtro proyecto activo → SOPs propios del proyecto (KB.query) · sin filtro → SOPs públicos TT. Empty state con CTA a `/sops?project=...` cuando no hay SOPs del proyecto. WOs generadas heredan projectId. Input @alvaro 2026-04-30: "estos deberían salir cuando no hay proyecto seleccionado o estamos en todos los proyectos". | ✅ verde |
| H1.10.4 | Vista `/sops?project={id}` con lista, edición inline (nombre, summary, steps con label/role_kind/duration/priority) y regeneración con feedback. Acceso desde topbar del ValueMap cuando hay projectId. | ✅ verde |
| H1.10.5 | Generación bulk secuencial de SOPs para todos los roles del proyecto + indicador "🧠 IA pensando" con dots animados + mensaje rotativo de fase + barra de progreso + skip de existentes + cancelación cooperativa. Input @alvaro 2026-04-30. | ✅ verde |
| **BUG-007** | Botón "Crear N WOs en Backlog" del modal "📋 Desde SOP" no hace nada al pulsar. Fix defensivo: alert si `pendingWOs` vacío + try/catch + console.log para diagnóstico. Input @alvaro 2026-04-30. | ✅ fixed |
| H1.10.6 | Modal "+Nueva WO" · campo "SOP de referencia" pasa de input texto a `<select>` con SOPs del proyecto activo (preselección automática vía `projectFilter`). Sin proyecto activo → input texto libre con hint. Input @alvaro 2026-04-30. | ✅ verde |
| **BACK-008** | **Añadir MiniMax como proveedor IA** (https://platform.minimax.io). Añadir entrada en `BASE_PRICING` del Orchestrator + branch en `callLLM` con su API + selector en `/settings`. Posible fallback más barato según BACK-011 (cascada de providers). | 🟡 |
| **H_ANIM_001** | **Visualizar flujo de valor con orden secuencial · multi-modelo** — animación + vistas alternativas (BPMN, swimlanes, Sankey, service blueprint, secuencia lineal) + ordenación manual o IA del flujo. Ver sección dedicada abajo. Input @alvaro 2026-04-30. | 🟡 |
| H1.9 | Completar sectores borderline F · Q · R hasta umbral 'ready' | 🟡 |
| H8.1 | Mind-Graph total · vista `/mind` con anidación SOC/SOP/role/skill | 🟡 |
| H9.x | Skills + CoPs online (matchmaking, validación SOPs por comunidad) | 🟡 |
| BACK-007 | Modelo tokenómico al crear proyecto cliente | 🟡 |
| H7.4 | TDD-auto: ampliar sandbox de `tddCheck` más allá de los 4 tipos básicos | 🟡 |
| H3.1 | Ledger viewer dedicado | 🟡 |

---

## Backlog priorizado · "Antigravity"

### A · Soberanía y descentralización (foco visión)

| ID | Visión | Notas técnicas |
|---|---|---|
| **BACK-003** | **Triple-entry accounting · ledger en blockchain** | Cada `ledger_entry` se ancla con hash en una blockchain (Gnosis preferida por estable + bajo coste, alternativa Polygon). Una entrada de ledger = (debe + haber + firma blockchain). Adapter PersistenceAdapter sobre el ECDSA actual. |
| **BACK-004** | **Permaweb (Arweave) para skills + APIs reventa** | Cada skill/SOP firmado se sube a Arweave como artefacto inmutable. SOS expone API gateway para consumir esos skills via HTTP con margen sobre el coste IA real. Modelo de negocio: **margen de reventa de APIs propias**. |
| BACK-005 | Tokenización de activos intra-proyecto (NFT/SBT) | Roles VNA, deliverables firmados, contribuciones de cada participante. Permite distribución de valor automatizada según pactos Slicing Pie en blockchain. |
| BACK-001 | Testeo offline total · workflow exports periódicos | Confirmar que SOS funciona sin conexión y sin Netlify dev. Recordatorios automáticos de export firmado como backup defensivo. |

### B · Modelos de negocio · Exit y Tokenomics

| ID | Visión | Notas |
|---|---|---|
| **BACK-007** | **Definir 3 modelos tokenómicos al crear proyecto** | Al crear un proyecto, el operador elige modelo de exit: `consolidada` (empresa madura, repartos por equity tradicional), `startup` (vesting + Slicing Pie dinámico, **foco actual** porque vas a ayudar a jóvenes), `fundacion` (sin reparto, todo a propósito). Cada modelo configura los multiplicadores del ledger y la lógica de exit. |
| BACK-008 | Plan de "exit" del proyecto | Hito que dispara cierre: equity sale, IPO, donación a fundación, fork pública, liquidación. Genera artefacto firmado con el reparto final. |
| BACK-009 | Modelo de reventa de APIs SOS | API gateway con margen propio. Plan free/pro/enterprise. KPIs de uso por skill. |

### C · Coste IA / Antigravity Engine

| ID | Visión | Notas |
|---|---|---|
| **BACK-006** | **Tracking coste IA en ledger via Kanban** (ya cubierto parcial en H7.1) | Cada WO ejecutada por IA registra tokens reales y coste calculado vs. el coste humano que se habría requerido (ahorro tangible de la automatización). Output: dashboard "ahorro acumulado" del proyecto. |
| BACK-010 | Optimizador de tokens (context pruning, chunk prio) | Reusar `skill_antifragile_compressor` ya semilla en KB. Reducir tokens de cada llamada manteniendo calidad de output. |
| BACK-011 | Fallback automático provider más barato si la calidad lo permite | Anthropic→DeepSeek/Gemini para tareas de clasificación simple. Conservar Anthropic para diseño estratégico. |

### D · UX y robustez

| ID | Visión | Notas |
|---|---|---|
| H1.6.1 | Enriquecer `proyecto-custom` y `charla-conferencia` con info real | Esperando input @alvaro |
| H1.7.1 | Plantilla informe ejecutivo MD descargable post-La Colla | Aprovechar el caso IKEA como referencia |
| H2.2 | Ficha detalle de taller con agenda Fent Pinya pre-cargada | UX |
| H2.4 | Check-list digital durante el taller en sala (mobile-friendly) | UX |
| BACK-002 | Revisar legacy SOS automatización (`teamtowershuma.com/dev/ia` `/10` `/v9`) | Recuperar patrones del Kanban viejo |

---

### E · Knowledge Base · criterio TDD de excelencia (H1.8 vivo)

**Auditoría 28-abr-2026** — el bug "todos los sectores parecen tier 2" venía
de un `Set(['N','K','Q','F','R'])` hardcoded en `DashboardView.js:854`. La
realidad: 22 sectores con 8-10 roles, 12-17 transactions, 3-5 patterns,
todos con `sector_name_en` y bilingüe en roles.

**Criterio TDD formalizado** (`KnowledgeLoader._computeSectorReadiness`):

| Nivel | Umbral | Significado |
|---|---|---|
| `ready` | ≥10 roles · ≥14 tx · ≥4 patterns · `sector_name_en` | Vendible directo como mapa VNA inicial sin retoques |
| `solid` | ≥6 roles · ≥10 tx · ≥2 patterns | Cobertura suficiente para construir propuesta tras enriquecer con cliente |
| `tier 2` | por debajo del mínimo | Inferir desde conocimiento general del LLM o pedir input al cliente |

**Bonus opcional (futura categoría `ready+`)**: bilingüe a nivel de cada
rol — campos `name_en`, `description_en`, `typical_actor_en`. Hoy sólo
G y L lo tienen. Pendiente para K, N y otros cuando interese llevarlos
al máximo de calidad bilingüe.

**Estado actual del catálogo (verificado 2026-04-28 con criterio H1.8.1):**

- **`ready`** (3 sectores): C (10/17/5), K (10/17/4), N (10/17/5).
- **`solid`** (la mayoría · ~18 sectores): A, B, D, E, F, G, H, I, J, L, M, O, P, Q, R, S, T, UV.
- **Pendientes para `ready`**:
  - F (Construction): +2 tx, +1 pattern
  - Q (Higher Ed): +1 rol, +1 pattern (tiene 9/14/4)
  - R (Health): +1 rol, +2 tx (tiene 9/12/4)
- **Pendiente bilingüe role-level (`ready+`)**: K, N, A-F, H, I, J, M, O, P, Q, R, S, T, UV (sólo G y L lo tienen hoy).

**Mecanismo de adaptación a cliente** (H1.10):

Hoy `KnowledgeLoader.getClientSeed(clientId)` carga `clients/{id}/vna-model.md`
manualmente. Falta:

1. Función `cloneSectorForClient(sectorId, clientId, clientDescription)` que
   instancia la plantilla y la guarda en `clients/{id}/`.
2. Enriquecimiento por LLM con descripción del cliente (parametriza roles
   genéricos a roles específicos: "Vendedor" → "Vendedor de servicios B2B
   IKEA Madrid").
3. Validación TDD del mapa generado (mismo criterio readiness aplicado al
   mapa cliente).
4. Almacenamiento automático en `clients/{id}/vna-model.md` para
   reutilización (sedes, franquicias, sucesivas iteraciones).

---

## Filosofía operativa de SOS

1. **Mind-as-Graph**: un proyecto es **un único grafo de conocimiento**.
   ValueMap, Kanban, Ledger, página pública son vistas distintas sobre
   el mismo grafo.
2. **Context-First sobre Multi-Agent**: la calidad de la IA (Buddhi)
   depende de la riqueza de la memoria (Chitta). Mejor 1 llamada bien
   construida con SOC+SOP+estado del proyecto que 20 agentes con
   contexto vacío.
3. **DTD (Deliverable Test Driven)**: cada entregable tiene un test
   booleano. Si IA → `true/false` automatiza; si humano → revisión
   manual. La aprobación es parte del SOP.
4. **Humano = intangibles**: los humanos aportan contexto avanzado,
   memoria cuántica contextual, presencia, sentido. Las IAs hacen
   lo automatizable. El VNA tangibiliza los intangibles humanos.
5. **Local-first absoluto**: todo en el navegador. Persistencia local
   (IndexedDB) firmada (ECDSA). Descentralización opcional via
   blockchain/permaweb. Cero dependencia de cloud propietario.

---

## H_ANIM_001 · Visualizar flujo de valor con orden secuencial (input @alvaro 2026-04-30)

> El grafo VNA actual (D3 force-directed) muestra **quién se relaciona con quién**
> pero no **en qué orden circula el valor**. Para que un cliente entienda
> el ciclo completo necesita ver la **secuencia temporal** del flujo, no
> sólo la topología. Objetivo: vistas múltiples sobre el mismo grafo
> (Mind-as-Graph) con UX brutal y universal.

### Modelos de visualización empresarial considerados

| Modelo | Cuándo brilla | Encaje en SOS |
|---|---|---|
| **Force-directed actual** | Ver topología, clusters, centralidad | Vista por defecto. Sigue siendo home. |
| **Animación de partículas/pulsos sobre aristas** | Mostrar dirección + ritmo del flujo de valor | Capa **encima** del force-directed: pulsos viajan por las aristas en orden secuencial; modo "play / pause / step". Coste: bajo (solo CSS animation o D3 transition). |
| **Secuencia lineal (paso a paso)** | Onboarding cliente · explicar el ciclo end-to-end | Lista numerada vertical: 1. Cliente solicita → 2. Comercial captura → 3. Operario produce → 4. Logística entrega → 5. Cliente paga. Cada paso = nodo + arista resaltada. **Esencial para narrar a un CEO no técnico.** |
| **Swimlanes (carriles por rol)** | Ver responsabilidades cruzadas · handoffs entre roles | Eje X = tiempo, eje Y = rol. Cada paso es una caja en su carril, con flechas entre carriles. Estándar en consultoría operacional. |
| **BPMN 2.0** | Lenguaje universal corporativo · auditable | Más formal: gateways, eventos, sub-procesos. Subset mínimo (start/task/end + sequence flow). Útil cuando el cliente ya usa Bizagi/Camunda. |
| **Sankey diagram** | Cuantificar volumen del flujo (€, horas, tokens, deliverables/mes) | Anchura de aristas = volumen. Muy potente para "este rol acumula 60% del valor producido". Encaja con el ledger (cantidades reales). |
| **Service blueprint** | Distinguir "frontstage" (visible al cliente) vs "backstage" (interno) + "line of visibility" | Capas horizontales: Customer actions / Frontstage / Backstage / Support processes. Muy aplicable en VNA cuando hay roles invisibles que sostienen el valor (BACK-006 "intangibles humanos"). |
| **Customer journey map** | Foco emocional en el cliente final | Eje X = etapas del cliente, eje Y = touchpoints + emociones. Complemento del service blueprint. |
| **Gantt** | Plazos y dependencias temporales reales | Útil cuando el flujo tiene durations[] (ya tenemos `step.duration_minutes`). Genera planning ejecutable. |
| **Kanban (ya lo tenemos)** | Ejecución, no diseño del flujo | Ya cubierto en `/kanban`. |

### Ordenación del flujo · manual vs IA

El grafo VNA actual no tiene **`sequence_order` por arista**. Para activar
las vistas secuenciales hay que añadir orden a las transactions. Dos modos:

1. **Manual (UX brutal)** — drag-and-drop vertical en una vista "📜 Ordenar
   flujo": el operador arrastra los pasos al orden correcto, asigna
   "fase" (descubrimiento / propuesta / producción / entrega / cobro / cierre)
   y guarda. Las aristas heredan `sequence_order` y `phase`.
2. **IA (auto)** — botón "🤖 Inferir orden con IA" usa el SOC del sector + los
   roles cliente + las descripciones de roles para proponer un orden
   secuencial razonable. El operador valida/edita.

Persistencia: añadir a cada `transaction` (arista) los campos:
- `sequence_order: number` (1, 2, 3, … en el ciclo principal)
- `phase: string` (etiqueta de fase para agrupar swimlanes/timeline)
- `volume?: number` (para Sankey · opcional · bind al ledger cuando exista)

### Roadmap propuesto · 3 sprints incrementales

| Sprint | Entregable | Coste | Dependencias |
|---|---|---|---|
| **A** · Orden + animación | Schema `sequence_order`/`phase` en transactions + drag-to-order modal + animación pulsos sobre aristas en `/map` | Bajo (D3 + IndexedDB upgrade) | Ninguna |
| **B** · Vistas alternativas | Toggle en topbar `/map`: Force / Lineal / Swimlanes / Sankey | Medio (3 layouts D3) | Sprint A (necesita orden) |
| **C** · BPMN + Service blueprint | Vista BPMN 2.0 subset + service blueprint con line of visibility | Alto (símbolos BPMN + capas) | Sprint B |

### Criterio de "brutal y universal"

- **Brutal** = un cliente CEO sin formación técnica entiende el flujo en
  <30 segundos viendo la vista lineal animada.
- **Universal** = el operador puede mostrar el mismo grafo en el formato
  que el cliente ya conoce (BPMN si viene de Bizagi, swimlanes si viene
  de Lean, Sankey si viene de finanzas).

Una sola fuente de verdad (Mind-as-Graph) → N vistas. Sin duplicar datos.

---

*Documento vivo · actualizar al cierre de cada Ola.*
