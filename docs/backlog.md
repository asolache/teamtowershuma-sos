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
| **BACK-008** | **Añadir MiniMax como proveedor IA** (platform.minimax.io). Entrada en `BASE_PRICING` (0.20/1.10 USD per 1M) + branch en `callLLM` (endpoint `https://api.minimax.io/v1/text/chatcompletion_v2`, modelo `MiniMax-Text-01`) + selector + key input en `/settings` + add a la chain de fallback. Pendiente: probar con clave real y validar respuesta JSON. | ✅ implementado · pendiente test E2E |
| **H1.10.7** | **Inspector ValueMap muestra estado del SOP por rol** — cuando un rol del mapa ya tiene SOP generado (`KB.query type='sop' projectId=… role_ref=role.id`), el inspector muestra badge "✅ SOP generado · N steps" + botones "📂 Ver SOP" (abre `/sops?project=…&focus=sopId` con el detalle directo) + "🔁 Regenerar SOP con IA". Sin SOP → "📋 Generar SOP del rol con IA". `_state.sopByRole` cachea `Map(roleId → sopNode)`, refrescado en `afterRender` y tras `_persistRoleSop` (re-pinta inspector sin recargar). Input @alvaro 2026-04-30. | ✅ verde |
| **H7.6** | **Asistencia IA con contexto exacto a una WO humana** — botón "🤖 Pedir asistencia IA" en cada WO `assignee.kind='human'`. Modal donde el humano pega/adjunta los datos brutos del trabajo. La IA recibe via `assembleWoContext`: SOC(s) + SOP referenciado + estado del proyecto + rol del assignee + datos pegados. System prompt: "estándar de comunicaciones interno SOS" — output como informe MD con arquitectura semántica explícita de 8 secciones (ver bloque dedicado abajo). Persiste en `content.aiAssistDraft` + `content.aiAssistMeta`. Acciones: Copiar · Descargar .md · Regenerar. Input @alvaro 2026-04-30. | ✅ verde (fase A core+tests · fase B UI+persistencia) |
| **H1.10.8** | **Dropdown de engines IA en "+Nueva WO" cuando assignee=IA** — el campo "Assignee · ID / engine" alterna dinámicamente: `kind='human'` → input texto libre (placeholder `@alvaro`); `kind='ai'` → `<select>` con `anthropic / openai / deepseek / gemini / minimax / custom`, preselección = `Orchestrator.getDefaultProvider()` con sufijo "(por defecto)". Para humanos: pendiente capa "miembros del proyecto" (delegada a MAT-001 con la matriz incubadora y la app móvil). Input @alvaro 2026-04-30. | ✅ verde |
| **MKT-001** | **`/workshops` → Mercado SOS de productos y servicios** — convertir la vista actual en un mercado con: (1) buscador AJAX por **CNAE** + filtros por sector/tipo, (2) productos/servicios asociables a cualquier proyecto cliente como **outputs finales** de su red de valor (intercambio con stakeholders de la red macro tipo SOS Matriu Launch), (3) **carga de saldo** prepago para uso de APIs IA y operaciones blockchain (ancla pactos, FICE rounds), (4) cuadro comparativo de **ahorro vs alternativas convencionales** (notaría · contabilidad · project management · consultoría). Ver sección dedicada abajo. Input @alvaro 2026-04-30. | 🟡 |
| **UX-001** | **Hipertexto folksonómico universal · todo nodo es enlazable** — UX donde TODA entidad del Mind-as-Graph es un nodo navegable + enlazable a otros vía hipertexto folksonómico (tags libres del usuario que crean aristas tipo `related_to` con weight según frecuencia). Cada nodo `type='project'` con propósito empresarial/cooperativo/startup expone su propio dashboard de herramientas: Pacto de socios · Documento de constitución · Plan tokenómico · Contabilidad de valor · Pools de liquidez para exit · acceso a su Mapa de valor · Kanban · Ledger con cláusula de exit · Landing pública · Mercado de productos. Ver sección dedicada abajo. Input @alvaro 2026-04-30. | 🟡 |
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

## MKT-001 · `/workshops` → Mercado SOS de productos y servicios

> Tesis @alvaro 2026-04-30: el entregable final de cada red de valor con
> propósito **es un producto o un servicio** que se intercambia con otros
> stakeholders de la red macro (tipo SOS Matriu Launch). Por tanto la
> vista `/workshops` actual debe evolucionar de "agenda de talleres" a
> **Mercado SOS** — el lugar donde:
>
> 1. Cada proyecto cliente publica los productos/servicios que su red
>    de valor genera (outputs del VNA).
> 2. Cualquier proyecto puede consumir productos/servicios de otros
>    proyectos del ecosistema (red macro).
> 3. Se carga saldo prepago para usar APIs IA y operaciones blockchain.
> 4. Se cuantifica el ahorro vs vías convencionales (notaría · contable ·
>    project manager · consultor).

### 1 · Catálogo · productos/servicios por sector CNAE

- **Backend**: nodo `type='market_item'` en KB con `content = { sku, title,
  description, sectorCNAE, tags[], priceEur, priceUSD, priceTokens,
  fmvHumanEquivalent, providerProjectId, deliverables[], stockMode,
  visibility, revenueShare }`.
- **UI**: grid masonry con buscador AJAX (debounce 250ms) sobre
  `title + tags + sectorCNAE`. Filtros: sector CNAE (selector multi),
  tipo (producto · servicio · skill · workshop · template), rango precio,
  scope (mi proyecto · público · red macro).
- **Asociación a proyecto**: cada item tiene un toggle "📌 Asociar a
  proyecto X" que crea una relación `KB_UPSERT type='market_link' from=
  projectId to=marketItemId role=consumer|producer`.
- **CNAE seed**: catálogo CNAE 2009 europeo (4 dígitos) precargado en
  `knowledge/taxonomy/cnae.json`. Buscador asistido (autocomplete).
- **Migración** desde `/workshops` actual: los workshops se convierten en
  un sub-tipo de `market_item` con `kind='workshop'`. Se preserva la
  agenda existente sin pérdida de datos.

### 2 · Saldo prepago para APIs IA + blockchain

- **Wallet local** del proyecto: nodo `type='wallet' projectId=…` con
  `content = { balanceEur, balanceCredits, ledger[], topUpHistory[] }`.
- **Top-up flows**:
  - Stripe / SumUp checkout (€) → conversión a créditos internos.
  - Crypto (USDC en Gnosis) → conversión vía Safe del proyecto (MAT-001).
- **Consumo automático**: cada llamada `Orchestrator.callLLM` decrementa
  saldo por el `costUSD` real (ya tenemos telemetría · sólo falta
  enganche). Cada operación blockchain (anchor pacto, attestation EAS)
  decrementa por el gas estimado.
- **Alertas**: badge en topbar cuando `balanceEur < threshold`. Email
  opcional. Bloqueo suave: si saldo=0 → callLLM lanza error con CTA
  "Recargar saldo".

### 3 · Cuadro comparativo de ahorro

Sobre cada producto/servicio que se ofrece desde una red de valor SOS,
calcular y mostrar el **delta vs vía convencional**:

| Concepto | Vía convencional (€) | SOS (€) | Ahorro |
|---|---|---|---|
| **Notaría** (pacto socios, constitución) | 800-2.500€ por escritura | 0€ (Pact.sol + EIP-712 + Arweave snapshot) + gas Gnosis (~0,02€) | ~99% |
| **Contabilidad** (mensual, asesor) | 80-300€/mes | LedgerEntry firmado + EAS attestation triple-entry · auto-generado por WO ledgered | ~95% |
| **Project Management** (PM externo) | 40-90€/h × N horas | WOs auto-orquestadas por SOP→Kanban→Ledger · coste real = horas humanas + IA tokens | 60-80% |
| **Consultoría estratégica** | 200-600€/h | 1 sesión Charla teatralizada + La Colla + IA con contexto · coste = 1 propuesta + 1 informe | 70-90% |

Cálculo **por proyecto**: se muestra como widget en su dashboard ("Ahorro
acumulado · X €"). Los precios convencionales son rangos editables en
`/settings → Mercado · ranges` para que cada operador los ajuste a su
mercado local.

### 4 · Stakeholders de la red macro

Cada proyecto tiene una lista de stakeholders externos
(`type='stakeholder'`) que pueden ser:
- **Otros proyectos SOS** (red macro · matchmaking automático por
  complementariedad de productos/servicios).
- **Proyectos no-SOS** (clientes finales convencionales).
- **Comunidades de práctica (CoPs)** que validan la calidad de los
  outputs (BACK-004 sk).

El Mercado SOS es la **plaza** donde estos stakeholders se cruzan. Cada
intercambio que se cierra dispara un nodo `type='trade'` con las dos WOs
asociadas (una de salida, una de entrada) → ledger ↔ EAS attestation.

### 5 · Roadmap propuesto · 4 sprints

| Sprint | Entregable | Coste |
|---|---|---|
| **A** Catálogo + buscador AJAX | `market_item` schema + grid + filtros + CNAE seed | Medio |
| **B** Asociación a proyecto + Mercado por proyecto | `market_link` schema + dashboard del proyecto | Medio |
| **C** Wallet prepago + consumo automático | `wallet` schema + integración Stripe + decrement en callLLM | Alto (integración pago real) |
| **D** Cuadro de ahorro + ranges editables | widget comparativo + `/settings` ranges | Bajo |

### Conexión con MAT-001 (Matriu)

- El Mercado SOS es el embrión del **Llançadora** de Matriu (vector 6 de
  los 6 propósitos · landing + modelo de negocio operativo).
- En MAT-001 se publican los productos a Arweave como manifests inmutables.
- Los pagos en cripto pasan por el Safe del proyecto.
- Los stakeholders se autentican por SBT identidad.

---

## UX-001 · Hipertexto folksonómico universal · todo nodo es enlazable

> Tesis @alvaro 2026-04-30: el Mind-as-Graph debe ser **navegable
> universalmente** — cualquier entidad del KB (proyecto, rol, SOP, WO,
> skill, ledger entry, market item, stakeholder, CoP, pacto, …) es un
> nodo con dirección estable, que puede enlazarse a cualquier otro nodo
> mediante **tags folksonómicos libres** que el usuario asigna a mano.
> Esos tags generan aristas implícitas tipo `related_to` con weight =
> frecuencia · convirtiendo el grafo en una memoria colectiva viva.

### 1 · Direccionabilidad universal

- Toda entidad del KB tiene una URL canónica `/n/{nodeId}` (ruta nueva).
- El router resuelve por `node.type` → vista correspondiente:
  `project → /map?project=…`, `sop → /sops?focus=…`, `wo → /kanban?wo=…`,
  `market_item → /workshops?focus=…`, etc.
- Cualquier campo de texto en la app soporta sintaxis `[[node-id]]` o
  `@nodeId` que se renderiza como link al nodo destino.

### 2 · Folksonomy · tags libres como aristas implícitas

- Cada nodo expone un `content.tags: string[]` editable inline.
- Cuando dos nodos comparten un tag → arista virtual `related_to` con
  `weight = N` donde N = nº de tags compartidos.
- El operador puede promover una folksonomía a **taxonomía**: convertir
  un tag en una `relation` explícita (`type='kb_relation' source target
  predicate`) que aparece como arista visible en el Mind-Graph.
- Cloud de tags global (vista `/tags`) con frecuencia + saltos a nodos.

### 3 · Dashboard por proyecto · herramientas de gobernanza y exit

Cada nodo `type='project'` con propósito empresarial/cooperativo/startup/
fundación expone un **panel de control completo**, organizado en 6
herramientas + 5 vistas operativas:

#### Herramientas de constitución y gobernanza

| Herramienta | Qué genera | Persistencia |
|---|---|---|
| **📜 Pacto de socios** | Documento JSON canónico con cláusulas (objeto · participación · vesting · exit · resolución conflictos) firmado EIP-712 por todos los nodos | KB → Arweave hash → Gnosis Pact.sol (MAT-001) |
| **📋 Documento de constitución** | Acta fundacional (forma jurídica · capital · órganos de gobierno · domicilio) generado por IA desde plantillas por jurisdicción | KB + export PDF firmado |
| **🪙 Plan tokenómico** | Modelo de tokens del proyecto (utility · governance · revenue) · supply · curva emisión · vesting · whitelist · liquidity. BACK-007 ya pendiente | KB + (futuro) deploy ERC-20 en Gnosis |
| **📊 Contabilidad de valor** | Triple-entry ledger (econ + social + ambiental) con attestations EAS · ya parcialmente cubierto por H7.1 | LedgerEntry + EAS attestation |
| **💧 Pools de liquidez para exit** | Mecanismo de salida de socios sin disolver el proyecto: AMM cooperativo (Curve fork) o subasta interna · respeta el `exit_clause` del pacto | Smart contract Gnosis (MAT-001) |
| **🚀 Llançadora pública** | Landing del proyecto con sus productos/servicios del Mercado · subdominio `<slug>.matriu.coop` o similar | Arweave estático + Netlify |

#### Vistas operativas (ya existentes · linkadas desde el dashboard)

- 🗺 **Mapa de valor** (ValueMap) → `/map?project=…`
- 📋 **Kanban** (WOs ejecutables) → `/kanban?project=…`
- 📒 **Ledger** con cláusula de exit visible → `/ledger?project=…` (H3.1 pendiente)
- 🌐 **Landing pública** del proyecto → `/p/{slug}` (público, indexable)
- 🛒 **Mercado** del proyecto (productos publicados + asociaciones) → `/market?project=…`

### 4 · Implementación · sprints

| Sprint | Entregable | Coste |
|---|---|---|
| **A** Direccionabilidad + tags inline | Ruta `/n/{id}` + tags editor en cada vista + cloud `/tags` | Medio |
| **B** Hipertexto `[[…]]` + link rendering | Parser de campos texto + linkificación automática | Medio |
| **C** Dashboard de proyecto + 6 herramientas (sin blockchain) | Plantillas pacto + constitución + plan tokenómico + ledger view + landing generator | Alto |
| **D** Pools de liquidez + Pact.sol + integración Gnosis | Smart contracts + on-chain anchor | Alto · delegado a MAT-001 |

### Principio rector

**Todo es nodo · todo es enlazable · todo es exportable.**
La folksonomía emerge de los usuarios; la taxonomía la consolida el
operador cuando una folksonomía se vuelve suficientemente densa.
El proyecto es una **carpeta viva** que tiene su propia
constitución, contabilidad, mercado y vía de exit · todo accesible
desde un dashboard único.

---

## MAT-001 · Matriu Incoopadora (proyecto paralelo · app móvil + on-chain)

> Documento técnico de handoff aportado por @alvaro 2026-04-30. Es un
> producto **paralelo** (no sustituye SOS V11), que hereda el kernel de
> esta rama y lo amplía con identidad on-chain, multi-proyecto, gobernanza
> y triple comptabilidad verificable. La app móvil de Matriu será el
> entorno donde resolveremos la capa "humanos como miembros del proyecto"
> que hoy SOS V11 deja en input texto libre (ver H1.10.8).

### Visión

Matriu es **6 cosas a la vez**:

1. **Formación** · cohort intensiva 10 semanas
2. **Comunidad de Práctica (CoP)** · espacios vivos de conocimiento
3. **Junior empresa** · prototipamos contigo
4. **Incubadora** · método SOS + IA integrada
5. **Aceleradora** · capital cooperativo via FICE
6. **Llançadora** · landing + modelo de negocio operativo

La app es el OS de esta experiencia. Hereda el kernel de
`asolache/teamtowershuma-sos@claude/value-map-tool-8ovUP` y lo amplía con
identidad ERC-721 SBT, hats ERC-1155 (TW/TUC/TI/TF), governance ECO
ERC-20Votes, attestations EAS triple-entry, pactos firmados EIP-712,
FICE rounds quadratic voting.

### Arquitectura objetivo

```
UI · React + Vite + TypeScript (paleta Earth · Instrument Serif · Inter Tight)
  ├─ LOCAL-FIRST · IndexedDB + Dexie + Automerge CRDT (WebRTC peer sync)
  ├─ PERMAWEB    · Arweave via Turbo SDK (manifests · pactos · ledger snapshots · CoP docs)
  └─ BLOCKCHAIN  · Gnosis Chain · Safe wallets · ERC-721 SBT · ERC-1155 hats
                   · ERC-20Votes ECO · EAS attestations · Pact.sol · FICE.sol
```

Patrón sync: **event sourcing** con outbox local que propaga a:
- WebRTC peer broadcast (colaboradores activos)
- Arweave checkpoint (cada N events o intervalo)
- On-chain commit (sólo eventos con requisito legal: pacto, voto, validación de hat)

### Stack técnico

```
Front:    React 18 + Vite + TypeScript + Vanilla CSS tokens (heredados de SOS)
Estado:   Zustand + Automerge para docs colaborativos
Local DB: Dexie.js
Crypto:   viem + ethers + noble-secp256k1
Permaweb: @ardrive/turbo-sdk
On-chain: viem + wagmi + RainbowKit + WalletConnect + Safe SDK
Build:    Vite + PWA plugin (off-line shell)
i18n:     i18next (ca · es · en)
Tests:    Vitest + Playwright
CI:       GitHub Actions → Netlify
```

### Roadmap (16 semanas · 1 cohort y media)

| Fase | Semanas | Entregable |
|---|---|---|
| **0** Fundaciones | 2 | Migrar repo a TS+React+Vite preservando Dashboard/ValueMap/Kanban/Workshops · Dexie schema · Automerge repo · PWA shell · i18n |
| **1** Identidad/hats | 2 | WalletConnect login · Mint SBT identidad · Profile con 4 hats · validación social TW |
| **2** Multi-proyecto + CoP | 2 | Pantallas Home/Cohort/Proyectos/Detall/Comunitats · CRDT sharing |
| **3** Mapa Valor + Kanban | 2 | Pantallas 15-16 · IA detecta gaps · Knowledge artifacts → Arweave |
| **4** Pactos + Triple comptabilidad | 3 | Pantalla 09 con EIP-712 · Pact.sol en Gnosis · Pantalla 17 Ledger con EAS · Merkle snapshot 24h |
| **5** Wallet/FICE/lanzamiento | 3 | Pantallas 10/11 · ECO ERC-20Votes · Snapshot space · Pantalla 08 generador landing |
| **6** Polish + pilot | 2 | Import/export Arweave bundle · passkey signin · Cohort 0 piloto 3 proyectos |

### Modelo de datos (entidades vs storage)

| Entidad | Storage primario | Replicación |
|---|---|---|
| User | IndexedDB | Arweave manifest público |
| Hat (TW/TUC/TI/TF) | Gnosis ERC-1155 | mirror IndexedDB |
| Project | IndexedDB + CRDT | Arweave manifest + Safe |
| ValueMap | CRDT (Automerge) | snapshot Arweave |
| KanbanCard | CRDT | local-only hasta sealing |
| Pact | IndexedDB → Arweave → Gnosis | los tres |
| LedgerEntry | IndexedDB → Arweave | EAS attestation por entry |
| CoP | CRDT shared doc | Arweave + ar.io gateway |
| FICEProposal | Gnosis Snapshot | mirror IndexedDB |

### Decisiones de persistencia

- **IndexedDB** · todo. App 100% off-line es invariante.
- **Arweave** · pactos, snapshots ledger, manifests proyecto, CoP docs. Nunca datos sensibles sin xifrar (Lit Protocol o ECIES).
- **Blockchain** · mints identidad/hats, hash arrels pactos/ledger, votos FICE, custodia ECO. **Nunca** datos brutos on-chain — siempre hash + Arweave pointer.

### Conexión con SOS V11 (kernel actual)

- El kernel `claude/value-map-tool-8ovUP` (esta rama) es el **punto de partida** del Fase 0.
- Todo lo que estamos construyendo aquí (Mind-as-Graph KB, Antigravity Engine, KnowledgeLoader, Orchestrator multi-provider, woAssistant, roleSopGenerator, sectorCloner) **se reusa** en TS.
- La estructura `knowledge/socs/` + `knowledge/sops/` se mantiene y se firma por Arweave.
- Cada `LedgerEntry` actual genera attestations EAS triple-entry (econ + social + ambiental).
- La capa `assignee.kind='human'` (hoy texto libre) pasa a tener identidad SBT real, con hats que validan permisos por proyecto.

### Inputs que hay que preparar antes de Fase 0

- [ ] Decisión deploy: Netlify edge functions ↔ Cloudflare Workers ↔ Vercel
- [ ] Wallet del proyecto Matriu en Gnosis (Safe multisig)
- [ ] Compra de crédits Turbo (Arweave) inicial
- [ ] Diseño visual completo (`Matriu App.html` + `Matriu Incoopadora.html`)
- [ ] Smart contracts review (`Pact.sol`, `FICE.sol`) por auditor

### Estado actual

🟡 **No iniciado.** Backlog reservado · arrancar tras cierre de Olas 6-7 de SOS V11 (Antigravity completo + UI movile-friendly + persistencia consolidada).

---

## H7.6 · Estándar de comunicaciones SOS para informes IA con contexto

> Cuando una WO humana invoca "🤖 Pedir asistencia IA", la IA debe responder
> con un informe que cumpla los principios de SOS: Mind-as-Graph,
> Context-First, DTD, intangibles humanos. Arquitectura semántica explícita.

### Plantilla del informe (output esperado)

```md
# {wo.content.title}
> WO `{wo.id}` · proyecto `{projectId}` · SOP `{sopRef}` · rol `{role}`
> Generado por IA · {provider}/{model} · {timestamp}

## 0 · Contexto inyectado (Chitta)
- SOC(s): {socRefs}
- SOP de referencia: {sopRef} · steps relevantes: {step.id list}
- Datos aportados por humano: {n} bloques · {totalChars} chars

## 1 · Síntesis (Buddhi · 3 frases máx)
{Qué pide la WO · qué entrega · qué bloqueo principal resuelve}

## 2 · Diagnóstico estructurado
- Hechos verificables: …
- Inferencias (con grado de confianza): …
- Lagunas de información (preguntas para el humano): …

## 3 · Propuesta operativa
{Plan accionable. 1 sección por step del SOP o por entregable.}

## 4 · DTD · test de aprobación
- Criterio booleano 1: …
- Criterio booleano 2: …
- (mínimo 3, máximo 7. Se evalúan en `/kanban` al pasar a "Finalizadas".)

## 5 · Intangibles humanos requeridos
{Qué NO puede aportar la IA: presencia, juicio, decisión política,
relación con el cliente. Lista explícita para que el humano sepa
qué tiene que añadir él/ella.}

## 6 · Mind-as-Graph · nodos a crear/actualizar
{Lista de propuestas de KB_UPSERT — el humano valida y dispatcha
manualmente. Formato: `- type='X' id='Y' content={…}`.}

## 7 · Tokens y coste
- Input: N tokens · Output: M tokens · Coste: € X
- Comparado con coste humano FMV: {ahorro %}
```

### Principios SOS que la plantilla materializa

| Principio | Cómo aparece en la plantilla |
|---|---|
| **Mind-as-Graph** | Sección 6 propone nodos KB explícitos, nada queda en texto suelto. |
| **Context-First** | Sección 0 audita el contexto inyectado para que el humano vea qué sabía la IA. |
| **DTD** | Sección 4 obliga a tests booleanos · sin esto no se aprueba la WO. |
| **Intangibles humanos** | Sección 5 explicita qué decide el humano · evita dependencia ciega. |
| **Antigravity** | Sección 7 mide ahorro vs FMV humano · dato real al ledger. |

### Implementación técnica (orden recomendado)

1. **Helper** `KnowledgeLoader.assembleWoContext(woId)` que devuelve
   `{ socs, sop, projectState, role, dtdHints }` listo para system prompt.
2. **Prompt builder** `buildWoAssistPrompt(woContext, humanInput)` →
   string con la plantilla anterior como instrucción de output.
3. **Modal en KanbanView** abierto por botón "🤖 Asistencia IA" sólo en
   WOs `assignee.kind === 'human'`. Textarea grande + botón "Generar
   informe IA" + área de output editable + botón "Guardar como
   `content.aiAssistDraft`" + botón "Copiar / Descargar MD".
4. **Persistencia**: el draft se guarda en el propio WO (`content.aiAssistDraft`,
   `content.aiAssistMeta = {provider, model, tokens, costUSD, ts}`).
   Reutilizable, regenerable, exportable en el snapshot firmado.
5. **Tests**: builder puro testeable (igual patrón que `roleSopGenerator`),
   sin gastar tokens.

### Por qué este estándar es "alto" técnicamente

- **Trazabilidad**: cada informe lleva su contexto explícito (sección 0)
  → reproducible, auditable, no es magia opaca.
- **Composabilidad**: las propuestas de KB_UPSERT (sección 6) se pueden
  feedear a otros agentes IA sin reparseo manual.
- **DTD nativo**: la sección 4 conecta directamente con la lógica de
  aprobación del Kanban (manual o tdd-auto).
- **Bilingüe-ready**: la plantilla puede traducirse a EN para clientes
  internacionales sin rehacer arquitectura.

---

*Documento vivo · actualizar al cierre de cada Ola.*
