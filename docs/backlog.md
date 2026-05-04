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

### Olas 3-7 · CERRADAS en `main` · tags `v11.3.0…v11.7.0`

> Sección histórica de las olas 3-7 que se desarrollaron en la rama
> `claude/value-map-tool-8ovUP` y se mergearon a `main` con tags
> `v11.3.0-ola3 · v11.4.0-ola4 · v11.5.0-ola5 · v11.6.0-ola6 · v11.7.0-ola7`.

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
| **MKT-001** | **`/workshops` → Mercado SOS de productos y servicios** — convertir la vista actual en un mercado con: (1) buscador AJAX por **CNAE** + filtros por sector/tipo, (2) productos/servicios asociables a cualquier proyecto cliente como **outputs finales** de su red de valor (intercambio con stakeholders de la red macro tipo SOS Matriu Launch), (3) **carga de saldo** prepago para uso de APIs IA y operaciones blockchain (ancla pactos, FICE rounds), (4) cuadro comparativo de **ahorro vs alternativas convencionales** (notaría · contabilidad · project management · consultoría). Ver sección dedicada abajo. Input @alvaro 2026-04-30. | 🟢 sprint A verde · resto 🟡 |
| **MKT-001 sprint A** | **Catálogo `market_item` + buscador CNAE + grid** — Vista nueva `/market` (paralela a /workshops · sprint posterior reclasifica workshops como sub-tipo). Schema `type='market_item'` con `content.{title,kind,cnae,sectorTT,priceEur,fmvHumanEquivalentEur,providerProjectId,deliverables,tags,visibility,sku,savingsCompareTo}` · 6 kinds (product/service/workshop/skill/template/subscription) · 4 visibilidades (public/red-macro/client/internal). Módulo puro `js/core/marketService.js` con `validateMarketItem · buildMarketItem · searchMarketItems · groupBy{Kind,SectorTT} · computeSaving`. Semilla CNAE 2009 reducida en `js/core/cnaeSeed.js` (~50 códigos relevantes mapeados a sectores TT) + `searchCnae(q)` con prefix matching. UI: buscador AJAX con debounce 250ms · 4 filtros estructurados (kind/visibility/sectorTT/proyecto) · grid masonry de cards con badge de ahorro · modal de detalle con FMV equiv + entregables + tags · modal "+Nueva oferta" con autocomplete CNAE que auto-rellena sector TT. UX-002: cada oferta nace con tags taxonómicos (kind:market-item · kind:service · cnae:7022 · sector:n · scope:public · project:...). Tests · 30 asserts puros. | ✅ verde |
| **UX-001** | **Hipertexto folksonómico universal · todo nodo es enlazable** — UX donde TODA entidad del Mind-as-Graph es un nodo navegable + enlazable a otros vía hipertexto folksonómico. Cada nodo `type='project'` expone su propio dashboard de herramientas: Pacto · Constitución · Plan tokenómico · Contabilidad · Pools liquidez · Llançadora + 5 vistas operativas (Mapa · Kanban · Ledger · Landing · Mercado del proyecto). Ver sección dedicada abajo. Input @alvaro 2026-04-30. | 🟢 sprint A+B+C verde · sprint D 🟡 |
| **UX-001 sprint C** | **Panel del proyecto · `/project/{id}`** — vista nueva que confluye 5 vistas operativas (Mapa·Kanban·SOPs·Mercado·Tags) + 6 herramientas de gobernanza (Pacto·Constitución·Tokenómica·Contabilidad·Pools·Llançadora · 5 stub "🚧 próximamente · MAT-001 / sprint D" + 1 wired a /kanban). Helper puro `js/core/projectHubService.js` con `aggregateProjectStats({projectId,nodes})` (cuenta SOPs · WOs por status · ofertas · ledger · ahorro acumulado · split AI/human) + `PROJECT_TOOLS` y `PROJECT_VIEWS` Object.freeze + `projectViewUrls(projectId)`. Vista hero con stats grid (6 KPIs) + 2 secciones de tiles (operativas y herramientas) + 2 listas opcionales (ofertas publicadas y SOPs del proyecto). Router prefix dinámico `/project/{id}` (igual que `/n/`). NodeView ahora redirige `type='project'` a `/project/{id}` (era `/map?project=`). Topbar del ValueMap añade botón "🎛 Panel" cuando hay proyecto activo. Tests · 16 asserts puros. | ✅ verde |
| **UX-001 sprint A** | **Direccionabilidad universal + folksonomía base** — Ruta `/n/{nodeId}` (NodeView resuelve por `node.type`: project/sop/work_order/workshop redirigen a vistas especializadas; tipos genéricos muestran fallback con metadatos + JSON dump). Ruta `/tags` con cloud (tamaño según frecuencia) + lista filtrable de nodos por tag, sincronizada con query param `?tag=`. Módulo puro `js/core/tagsService.js` con `normalizeTag`/`aggregateTags`/`nodesWithTag`/`relatedEdgesByTag`/`addTagToNode`/`removeTagFromNode` + helpers async `persistTagAdd`/`persistTagRemove` (sincronizan `content.tags` ↔ `keywords` para que `KB.query({keyword})` funcione). Editor inline reusable `renderTagsEditor()`. Tests · 28 asserts puros. | ✅ verde |
| **UX-001 sprint B** | **Hipertexto `[[node-id]]` + linkificación automática** — módulo puro `js/core/linkifyService.js` con `linkifyNodeRefs(text)` y `linkifyMultiline(text)`. Sintaxis: `[[nodeId]]` → link a `/n/{id}`, `[[nodeId\|alias]]` → link con texto custom, `#tag` → link a `/tags?tag={tag}`. Escapado HTML defensivo (XSS-safe). Validación estricta de IDs (`[A-Za-z0-9_.-]+`) y tags (kebab-case). Integrado en NodeView (descripción/summary del fallback genérico) y KanbanView (descripción de la WO en el modal de detalle). Tests · 27 asserts puros (vacío, escape, 1 ref, alias, múltiples mezclados, ID inválido, tag inválido, XSS, multiline). | ✅ verde |
| **UX-002** | **Auto-tagging semántico al crear mapa, SOPs y WOs** — `js/core/semanticTagger.js` con catálogo cerrado de 17 prefijos taxonómicos + integrado en `generateWosFromSop`, modal "+Nueva WO", `_persistRoleSop`, `client_vna_model`. Fase 2: el LLM devuelve `folksonomy[]` en `roleSopGenerator` (sopRol), `regenerateSopWithFeedback` (regen) y `sectorCloner` (proyecto + tags por rol). Mergeo automático con `mergeTags(taxonomy, folksonomy)` antes de persistir. Tests · prompt builders verifican presencia de `folksonomy` y prohibición explícita de prefijos `:` para folksonómicos. UI: chips azul claro inmutables (taxonomy) vs índigo eliminables (folksonomy). | ✅ verde fase 1+2 |
| **KM-001** | **Knowledge Management · folders inteligentes + optimización de tokens** — visión a medio plazo @alvaro 2026-04-30: que la AI experience del operador sea legendaria · cuando abre un proyecto, el sistema le sirve sólo el contexto relevante (no el KB entero). Dos vectores entrelazados: (1) **Carpetas inteligentes**: queries persistentes sobre el KB (combinación de tags taxonómicos + folksonómicos + node.type + projectId + recencia) que actúan como vistas vivas tipo Smart Mailbox · ej. `Carpeta "Mis WOs urgentes"` = `kind:work-order + status:doing + priority:high + assignee:@alvaro`. Cada operador tiene su set, exportable. (2) **Optimización de tokens**: pipeline de pre-procesado del contexto que inyecta sólo los nodos con weight ≥ threshold según relevancia al task (similarity sobre tags + grafo + recencia) · BACK-010 ya esboza esto · KM-001 lo formaliza con criterio TDD ("la respuesta del LLM con contexto pruned debe pasar el mismo DTD que con contexto entero"). Conexión directa con la calidad de matchmaking de MAT-001 y la rentabilidad real de BILL-001. Ver bloque dedicado abajo. | 🟡 |
| **H_ANIM_001** | **Visualizar flujo de valor con orden secuencial · multi-modelo** — animación + vistas alternativas (BPMN, swimlanes, Sankey, service blueprint, secuencia lineal) + ordenación manual o IA del flujo. Ver sección dedicada abajo. Input @alvaro 2026-04-30. | 🟡 |
| H1.9 | Completar sectores borderline F · Q · R hasta umbral 'ready' | 🟡 |
| H8.1 | Mind-Graph total · vista `/mind` con anidación SOC/SOP/role/skill | 🟡 |
| H9.x | Skills + CoPs online (matchmaking, validación SOPs por comunidad) | 🟡 |
| BACK-007 | Modelo tokenómico al crear proyecto cliente | 🟡 |
| H7.4 | TDD-auto: ampliar sandbox de `tddCheck` más allá de los 4 tipos básicos | 🟡 |
| H3.1 | Ledger viewer dedicado | 🟡 |

---

### Ola 8 · UX brutal + Auth (🟢 EN CURSO en `claude/value-map-tool-8ovUP`)

> Foco @alvaro 2026-04-30: la calidad del producto se mide en la
> primera sesión de un nuevo usuario. SOS es potente pero la UX no
> autoexplica el valor · necesita arquitectura de información de
> nivel experto. Más pre-requisito de identidad para conectar con
> Matriu y otras apps del ecosistema.

| ID | Historia | Estado |
|---|---|---|
| **UX-FIX-001** | **Selector de sectores en `/market` muestra letra + nombre** — el desplegable actual sólo muestra `A · B · C…` (la letra del sector TT). Cargar `KnowledgeLoader.listSectors()` en `afterRender` y poblar el `<select>` con `{letra} · {nombre}` (ej. `K · Tech / Software / IA`). Aplicar el mismo patrón a otros selectores de sector que sólo muestren letra. Input @alvaro 2026-04-30. | 🟡 |
| **UX-NAV-001** | **Audit de navegación entre vistas creadas** — revisar topbars de TODAS las vistas (Dashboard, Map, Kanban, SOPs, Workshops, Settings, Tags, Market, NodeView, ProjectHub) para garantizar acceso bidireccional · cualquier vista debe ofrecer links a las principales (Dashboard · Mercado · Tags · Mapa · Kanban del proyecto activo) sin necesidad de teclear URL. Crear barra de navegación unificada o componente reusable. Input @alvaro 2026-04-30. | 🟡 |
| **UX-FUSE-001** | **Fusionar "Crear proyecto" + "Clonar sector" en un solo wizard** — el botón "🧬 Clonar sector" del topbar se ha eliminado y absorbido en "+ Nuevo proyecto", que ahora es el único entry point. Modal con 3 caminos según lo que rellenes: (1) **Vacío** · sólo nombre → proyecto sin roles. (2) **Plantilla del sector** · nombre + sector → clona roles+transactions+patterns del sector base sin gastar tokens IA. (3) **Cliente personalizado IA** · nombre + sector + descripción → llama a `cloneSectorForClient` con LLM (flujo previo). Hint dinámico bajo el formulario que reflecta el camino elegido en cada momento (color + texto). `_executeClone` ahora monta su propio overlay de progreso si se invoca sin el modal viejo presente, para que el feedback visual funcione desde el wizard nuevo. Input @alvaro 2026-04-30. | ✅ verde |
| **UX-DASH-001** | **Rediseño del Dashboard como home autoexplicativo** — la primera vista cuenta SOS sin leer docs. Estructura entregada: (1) Hero con título + sub + tagline. (2) **¿Cómo funciona SOS? · 4 pasos** · grid de 4 tiles del flujo (1 Crea/clona proyecto → 2 Diseña red de valor → 3 Genera SOPs IA → 4 Ejecuta y contabiliza) · cada tile auto-explicativo + link directo · "Paso 1" abre el wizard fusionado UX-FUSE-001. (3) **Áreas del sistema** · grid de 6 tiles (Mapa · Kanban · Mercado · Tags · Workshops · Settings) con icon + label + hint. (4) Stats globales originales preservados. (5) Lista de proyectos al final preservada. Aplicados criterios Nielsen (clear primary action · navegación visible · feedback en estado) + Tufte (densidad ajustada · sin chrome innecesario). Input @alvaro 2026-04-30. | ✅ verde MVP |
| **AUTH-001** | **Identidad del usuario operador** — 3 caminos compatibles (local-first / wallet / OAuth). Ver sección dedicada. Input @alvaro 2026-04-30. | 🟢 sprint A verde · B+C 🟡 |
| **AUTH-001 sprint A** | **Identidad local-first** — `js/core/identityService.js` puro: `validateIdentity` · `buildIdentityNode` · `stampNode(node, identity)` (createdBy/lastEditedBy/lastEditedAt no-mutación, acepta string id) · `deriveDidFromJwk` (SHA-256 → `did:sos:{32hex}`) · helpers async sobre KB (`getCurrentIdentity` · `getOrCreateIdentity` · `updateIdentityProfile` · `touchIdentity`). Reusa el keypair ECDSA P-256 que `projectIO` ya genera (1 sola clave por dispositivo · sin nuevas dependencias · compat Safari 13). Schema `type='user_identity'` con `primaryDid · publicKeys.signing · wallets[] · oauthProviders[] · hatTokens[] · isPrimary`. Vista `/identity` con perfil editable (displayName · handle · avatar) + DID copiable + cards stub para wallet (sprint B) y OAuth (sprint C). Tests · 19 asserts puros. | ✅ verde |
| **AUTH-001 sprint B (manual)** | **Wallet binding manual sin librería externa** — `isValidEvmAddress(addr)` (regex `^0x[0-9a-fA-F]{40}$` · sin checksum keccak256, eso requiere WalletConnect real). `addWalletToIdentity(identity, {address, chain, label})` puro · normaliza address a lowercase · idempotente (case-insensitive dedupe) · marca `verifiedAt: null` (firma se delega a sprint C/MAT-001 con WalletConnect). `removeWalletFromIdentity` puro. Helpers async `linkWallet/unlinkWallet`. UI `/identity`: form con input address + chain selector (gnosis/ethereum/polygon/base/optimism/arbitrum/other) + label opcional + botón Vincular. Lista de wallets con badge `manual`/`verified` + botón Desvincular. Tests · 11 asserts puros adicionales en suite identityService. | ✅ verde · sprint C delegará a MAT-001 con firma EIP-191 real |
| **KM-001** | **Knowledge Management · folders inteligentes + optimización tokens** — ver sección dedicada. | 🟢 sprint A verde · B+C+D 🟡 |
| **KM-001 sprint A** | **Smart folders + 5 carpetas predefinidas** — `js/core/smartFolderService.js` puro: `validateFolder · buildFolder · executeFolderQuery` con filtros types · projectId · tagsAll/Any/None · keywords · ownerEquals · recentDays · sortBy (updatedAt/createdAt/name/priority) · sortDir · limit. `DEFAULT_FOLDERS` Object.freeze con 5 carpetas del sistema (🚨 WOs urgentes · 🤖 WOs IA en marcha · 📜 SOPs ready · 🛒 Mercado público · 💶 Ledger 7d). Vista `/folders` con sidebar (system + user) + contenido con header de query hints + lista con links a `/n/{id}` + auto-seed la primera vez + soporte `?focus={id}` para deep-link. Tests · 19 asserts puros. | ✅ verde |
| **KM-001 sprint C** | **Context pruner · scorer + telemetría base** — `js/core/contextPruner.js` puro: scorer combina 4 señales (tagOverlap 50% · recency 20% · typeBoost 20% · priority 10%) con pesos suman ~1.0 · catálogo `DEFAULT_TYPE_BOOSTS` con 13 tipos (sop 1.4 · soc 1.2 · project 1.2 · role 1.1 · work_order 1.0 · transaction 0.9 · market_item 0.7 · workshop 0.6 · ledger_entry 0.5 · user_identity 0.4 · smart_folder 0.3 · config 0.0 (excluido) · default 0.7). `extractTaskTags(task)` deriva taxonómicos del descriptor del task (projectId/sectorId/roleId/types/extraTags). `scoreNode(node, task, options)` puro · clamp [0,1] · `requireProjectId` excluye nodos huérfanos. `estimateNodeTokens(node)` aprox 4 chars/token sobre title+name+description+summary+body+tags+steps. `pruneContextNodes(candidates, task, options)` ordena por score desc + filtra `minScore` + respeta `tokenBudget` y `maxNodes` + devuelve `{selected, skipped, stats}` con razón del skip. Soft-norm preserva `:` de taxonómicos en task tags y node tags. Tests · 27 asserts puros. | ✅ verde |
| **KM-001 sprint D (helpers)** | **Format + similarity baseline para futuro TDD-gate** — `formatNodesForPrompt(selected, options)` serializa nodos pruned a markdown compacto listo para system prompt (header + por nodo: type/id/título/projectId/tags taxonómicos vs folksonómicos separados/body truncado a `maxBodyChars`/steps SOP resumidos). `jaccardSimilarity(textA, textB)` métrica baseline para gate (lowercase + alfanuméricos + tokens ≥3 chars + STOP_WORDS ES/EN básicos). `passesContextGate({baseline, candidate, threshold=0.92})` devuelve `{passes, score, threshold}`. Tests · 16 asserts puros (vacíos · format con SOP completo · stopwords no afectan jaccard · gate con identicos vs dispares). Sin tocar Orchestrator todavía · la integración real con flag `enableContextPruning` queda como sprint E cuando @alvaro decida activar el pruning en producción tras validar con sus llamadas reales. | ✅ verde helpers · 🟡 sprint E integración Orchestrator |
| **H8.1** | **Mind-Graph total · vista `/mind` con TODOS los nodos del KB** — `js/core/mindGraphService.js` puro: `buildGraphFromKb(allNodes, options)` construye grafo con 3 capas de aristas (parent: nodo → su proyecto · relation: refs canónicos sopRef/role_ref/soc_ref/project_ref/workshopId/providerProjectId/createdBy · tag: aristas implícitas via `relatedEdgesByTag` con `minTagWeight` configurable). Paleta canónica `MIND_TYPE_COLORS` Object.freeze para 14 tipos de nodo (project morado · role índigo · transaction cyan · sop verde · work_order amarillo · workshop naranja · market_item rosa · ledger_entry dorado · user_identity azul claro · smart_folder gris · etc.). `graphStats(graph)` · counts por tipo y por kind de arista. Vista `/mind` con D3 force-directed (CDN cdnjs · igual que ValueMap), zoom + pan, drag de nodos (fija al soltar · doble-click canvas para liberar todos), tooltip al hover, click navega a `/n/{id}`. Sidebar con leyenda de tipos visibles + counts de aristas por capa + filtros (proyecto · tag edges on/off · min tag weight). Marker arrowheads para aristas relation. Input @alvaro 2026-04-30. | ✅ verde |

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

## KM-001 · Knowledge Management · folders inteligentes + optimización de tokens

> Visión @alvaro 2026-04-30: la AI experience tiene que ser **legendaria**
> · cuando abro un proyecto, el sistema sabe qué necesito ver/preguntar
> sin que se lo diga · cuando llamo al LLM, el contexto inyectado es el
> mínimo viable de máxima señal (sin pagar tokens por SOPs irrelevantes
> o nodos viejos). Esto convierte SOS en un OS de conocimiento, no en
> una colección de vistas.

### Vector 1 · Carpetas inteligentes (Smart Folders)

Vista nueva `/folders` (o sub-tab del dashboard) con la lista de
carpetas del operador. Cada carpeta es una **query persistente** sobre
el KB que se evalúa al abrir, mostrando sus nodos como una vista viva.

**Schema** · nodo `type='smart_folder'`:

```json
{
  "id": "folder-mis-wo-urgentes",
  "type": "smart_folder",
  "content": {
    "name": "Mis WOs urgentes",
    "icon": "🚨",
    "owner": "@alvaro",
    "query": {
      "type": ["work_order"],
      "tagsAll":  ["status:doing", "priority:high"],
      "tagsAny":  ["role-kind:human", "role-kind:ai"],
      "projectId": null,
      "recentDays": 30,
      "sortBy": "updatedAt",
      "sortDir": "desc"
    },
    "view": "list",          // list · grid · timeline · graph
    "preview": ["title", "tags:role-kind", "tags:priority", "updatedAt"]
  }
}
```

**Ejemplos de carpetas predefinidas** que el sistema crea automáticamente
al instalar:

- 🚨 `kind:work-order + priority:high + status:!=ledgered` · backlog crítico
- 🤖 `kind:work-order + role-kind:ai + status:doing` · en marcha por IA
- 📋 `kind:project-role-sop + readiness:ready` · SOPs de cliente listos
- 🌍 `scope:public + kind:project-role-sop` · catálogo TT vendible
- 🔥 `kind:trade + last7d` · intercambios recientes en el Mercado SOS

El operador crea las suyas desde un wizard sobre `/tags` · puede
exportar/importar el set como JSON firmado.

### Vector 2 · Optimización de tokens (Context Pruning)

Hoy `KnowledgeLoader.buildContext` inyecta SOC + SOP completos al
system prompt. KM-001 introduce un **pipeline de relevancia** entre
los nodos candidatos y la task:

```
1. Candidatos: nodos del KB filtrados por projectId + tipos relevantes.
2. Score por nodo:
   score(node, task) =
       w_tag * tag_overlap(node.tags, task.derivedTags)         // 0..1
     + w_freq * inverseRecency(node.updatedAt)                  // 0..1
     + w_graph * pageRank(node, KB-as-graph, related_to)        // 0..1
     + w_priority * (taxonomic priority:high boost)             // 0/1
3. Threshold dinámico: tomar nodos hasta llenar el budget de tokens
   asignado (default 60% de max_tokens · ajustable).
4. Compresión: por cada nodo, si su body > N tokens, resumir con
   skill_antifragile_compressor (BACK-010).
5. TDD-gate: la llamada con contexto pruned se valida contra
   un golden output con contexto entero. Si la similitud cae por
   debajo del 92%, el sistema sube el threshold automáticamente.
```

Telemetría · cada llamada `Orchestrator.callLLM` registra:
- `tokensIfFullContext` vs `tokensActual`
- `qualityDrift` vs golden (cuando aplique)
- `costSavedUSD`

Dashboard `/efficiency` con curva de ahorro acumulado.

### Vector 3 · Knowledge Management UX

- **Search-as-you-type** en topbar global (Cmd+K) · busca por título,
  tags taxonómicos y folksonómicos, contenido (con índice ligero in-memory).
- **Recommendation feed** en el dashboard del proyecto · "🧠 Sugerencias"
  con nodos relevantes que el operador no ha tocado en 7+ días.
- **Auto-folders por sector** · al clonar un sector, se crea una
  smart_folder por proyecto con su query base.
- **Ínclude/exclude semántico** en el Mind-Graph (H8.1 cuando llegue) ·
  mostrar sólo los nodos de una carpeta para reducir ruido visual.

### Roadmap propuesto · 4 sprints

| Sprint | Entregable | Coste |
|---|---|---|
| **A** Schema smart_folder + ejecutor de queries | nodo `type='smart_folder'` + función `executeFolderQuery(folder, KB)` pura testeable + 5 carpetas predefinidas | Medio |
| **B** Vista `/folders` + wizard de creación | UI list + wizard con autocompletado de tags conocidos + import/export JSON firmado | Medio |
| **C** Context pruning (BACK-010 evolved) | scorer + threshold dinámico + telemetría + TDD gate · empezamos por SOPs porque es donde más tokens consumimos | Alto |
| **D** Search-as-you-type Cmd+K + recommendations feed | índice in-memory + ranking + UI overlay | Medio |

### Conexión con otras historias

- **UX-001** (folksonomía) y **UX-002** (taxonomía) son la materia prima
  del scorer · sin tags ricos, KM-001 no tiene señal.
- **BACK-010** (optimizador tokens) ya estaba en backlog · KM-001 lo
  absorbe y le da forma TDD.
- **BACK-011** (cascada de providers) se complementa: KM-001 reduce
  tokens por llamada, BACK-011 abarata el modelo cuando la task lo
  permita.
- **MAT-001** (matchmaking) consume las smart_folders compartidas para
  sugerir colaboraciones cross-proyecto.
- **BILL-001** se beneficia: el ahorro de tokens es ROI directo del SOS
  para el cliente · argumento de venta cuantificable.

---

## REL-001 · Release roadmap · pre-alfa → alfa → beta → v1

> Tesis @alvaro 2026-04-30: estamos en **pre-alfa** (cliente cero · @alvaro
> iterando consigo mismo · sin facturación). Cuando el sistema tenga
> consistencia operativa entramos en **alfa** y queremos poder **facturar
> como testeo** a los primeros clientes piloto · cobro real con disclaimer
> de "alfa · sin SLA · acuerdo de feedback". Sirve para 4 cosas:
>
> 1. Validar willingness-to-pay (la métrica de verdad de un producto).
> 2. Generar primeras `LedgerEntry` reales con triple-entry verificable.
> 3. Probar la pasarela de pagos antes de escalar.
> 4. Calibrar el cuadro comparativo de ahorro (MKT-001) con datos reales.

### Fases

| Fase | Estado | Quién | Facturación | Disclaimer |
|---|---|---|---|---|
| **pre-alfa** | 🟢 actual | @alvaro + IAs | ❌ | "no facturar · iteración rápida" |
| **alfa privada** | 🟡 próxima | 3-5 clientes piloto invitados | ✅ como testeo | "alfa · sin SLA · feedback obligatorio" |
| **beta pública** | 🟡 | Cualquiera con código de invitación | ✅ con SLA reducido | "beta · feedback bienvenido · refund-friendly" |
| **v1** | 🟡 | Abierto + Mercado SOS público | ✅ completo | T&C estándar |

### BILL-001 · Facturación de alfa privada (sub-historia)

Necesario para entrar en alfa privada:

1. **Pasarela de pagos · 2 caminos**:
   - **Stripe Checkout** (€/USD · tarjeta · Apple/Google Pay · SEPA) ·
     setup en 1h con clave test/live · webhook a `/api/stripe-webhook`.
   - **Cripto · USDC en Gnosis** (preview de MAT-001) · QR + dirección
     de Safe del proyecto · confirmación on-chain via viem.
2. **Modelo de facturación** · 3 productos iniciales para alfa:
   - Recarga saldo APIs IA (tramos €10/€25/€50/€100)
   - Servicio "Mapa de valor IKEA-style" (precio fijo €495)
   - Servicio "Cosecha VNA + propuesta IA Context-First" (precio fijo €750)
3. **Generación de factura firmada** (PDF + JSON canónico ECDSA) · usa
   la firma del proyecto (H1.3 export firmado) · attestation EAS triple-
   entry cuando MAT-001 esté en marcha.
4. **Conexión a wallet prepago** (MKT-001 fase C) · cada cobro Stripe se
   convierte automáticamente en créditos del proyecto cliente · saldo
   visible en topbar.
5. **Disclaimer alfa visible** en checkout y email post-pago · "Versión
   alfa · sin SLA · feedback obligatorio en 7 días para mantener acceso".
6. **Modo "test billing"** en `/settings` · flag local para alternar
   entre modo Stripe-test y modo Stripe-live sin redeploy.
7. **Panel admin de facturas** (vista `/admin/billing`) · lista de
   transacciones con estado · descarga PDF · re-firma · refund.
8. **Métricas alfa** · dashboard con MRR, conversión free→pago, ahorro
   acumulado del cliente, NPS de feedback.

### Criterios de salida pre-alfa → alfa privada

Antes de aceptar el primer pago real, validar:

- [ ] Tests · ALL GREEN sostenido durante ≥ 2 semanas en main.
- [ ] Export/Import firmado E2E con un proyecto piloto real (sin pérdida).
- [ ] Cuadro comparativo de ahorro (MKT-001) con al menos 3 servicios reales.
- [ ] Wallet prepago + decremento automático en cada `Orchestrator.callLLM` · saldo visible.
- [ ] Pasarela Stripe configurada en test · 5 transacciones simuladas exitosas.
- [ ] Plantilla de factura firmada validada por asesor fiscal (1 hora de revisión).
- [ ] Pacto base de "alfa privada" redactado (cláusula de feedback obligatorio · refund 30 días).
- [ ] H7.6 (asistencia IA con contexto) · usado en al menos 5 WOs reales para validar plantilla SOS.

### Conexión con otras historias del backlog

- **MKT-001 sprint C** (wallet prepago) es prerequisito directo de BILL-001.
- **MAT-001 fase 4** (Pact.sol + EAS attestations) refuerza la facturación con triple-entry on-chain.
- **H1.3** (export firmado ECDSA) ya cubre la firma de facturas a corto plazo.
- **OPS-001** (auto-export) garantiza que ningún cobro se pierde por purga de caché.

---

## UX-002 · Auto-tagging semántico (taxonómico + folksonómico) en la creación

> Tesis @alvaro 2026-04-30: para que el Mind-as-Graph sea **realmente
> conectable** (Matriu necesita matchmaking de personas por sector / rol
> / skill / entregable), los nodos deben llegar al KB con **dos capas de
> tags** ya pegadas en el momento de creación. La folksonomía libre
> (UX-001) sigue siendo válida, pero por sí sola no basta: el operador
> no añade a mano las claves taxonómicas que un buscador necesita.

### Las dos capas

| Capa | Origen | Forma | Ejemplo | Para qué |
|---|---|---|---|---|
| **Taxonómica** | Campos canónicos del nodo (no IA) | `prefijo:valor` con prefijos cerrados | `sector:K · cnae:4321 · role:atencion-cliente · castell:tronc · deliverable:propuesta · kind:project-role-sop · step-kind:ai · priority:high · soc-ref:soc-fent-pinya` | Filtros precisos (Mercado SOS · matchmaking) · weights altos en aristas · sin ambigüedad |
| **Folksonómica** | LLM durante la generación + usuario | Tags libres normalizados (UX-001) | `urgencia · cliente-corporativo · colaborativo · creativo · repetitivo · b2b · madrid · 2026q2` | Discoverability humana · cloud `/tags` · sentido común |

Ambas viven en el mismo `content.tags[]` (un único array de strings); el prefijo `:` es la única diferencia visible. Se sincronizan a `node.keywords[]` para que `KB.query({keyword:'sector:K'})` funcione directamente.

### Puntos de inserción · qué tag genera cada generador

| Generador | Taxonómicos (siempre) | Folksonómicos (LLM opcional) |
|---|---|---|
| **`sectorCloner`** (clona sector → proyecto cliente) | `sector:{id} · cnae:{code} · kind:project · scope:client · client:{slug}` en el proyecto. En cada rol: `role:{id} · castell:{level}`. En cada transaction: `tx-type:{tangible\|intangible} · is-must:{yes\|no}` | El propio LLM ya genera nombres y descripciones. Tras generación, una **segunda llamada barata** (DeepSeek/Gemini) extrae 3-5 folksonómicos por rol del cliente. |
| **`roleSopGenerator`** | `kind:project-role-sop · role:{role-id} · project:{project-id} · soc-ref:{slug}`. En cada step: `step-kind:{ai\|human} · priority:{low\|med\|high} · approval:{manual\|tdd-auto}` | El LLM, en la misma llamada, devuelve un campo `folksonomy: string[]` con 3-7 tags libres del SOP completo. |
| **`generateWosFromSop`** | `kind:work-order · sop-ref:{slug} · role-kind:{ai\|human} · priority:{level} · status:{backlog} · approval:{rule}` | Heredados del SOP padre (sin nueva llamada IA · son baratos y consistentes). |
| **Inspector ValueMap** (manual) | (no aplica · entrada manual del operador) | El usuario pone los que quiera (UX-001). |

### Catálogo de prefijos taxonómicos canónicos (vocabulario controlado)

| Prefijo | Dominio de valor | Notas |
|---|---|---|
| `sector:` | A-Z (los 22 sectores ABC del KB de TT) | Heredado del catálogo TeamTowers 2026 |
| `cnae:` | 4 dígitos (CNAE 2009 europeo) | Bridge con MKT-001 buscador CNAE |
| `kind:` | `project · sop · work-order · workshop · ledger-entry · market-item · stakeholder · cop · pact · soc-seed · sop-seed · project-role-sop` | Cierra el set para distinguir subtipos dentro del mismo `node.type` |
| `role:` | `{role-id}` del proyecto/sector | Para matchmaking |
| `castell:` | `tronc · dosos · pinya · acotxador · enxaneta` | Niveles VNA |
| `deliverable:` | `propuesta · informe · diagnostico · plan · auditoria · landing · pacto · constitucion · ledger-snapshot · video · workshop-recap` | Vocabulario común de outputs |
| `priority:` | `low · med · high · urgent` | |
| `step-kind:` / `role-kind:` | `human · ai` | |
| `approval:` | `manual · tdd-auto` | |
| `status:` | `backlog · doing · done · ledgered · cancelled` | |
| `scope:` | `public · client · internal · cop` | Visibilidad |
| `soc-ref:` / `sop-ref:` | slug del SOC/SOP referenciado | |

Cualquier prefijo NO listado se trata como folksonómico (sin warning).

### Implementación técnica (orden recomendado)

1. **Helper puro** `js/core/semanticTagger.js` con funciones:
   - `taxonomicTagsForProject(project, sector)` → `[]`
   - `taxonomicTagsForRole(role, project)` → `[]`
   - `taxonomicTagsForSop(sop, project, role)` → `[]`
   - `taxonomicTagsForWo(wo, sop, step)` → `[]`
   - `validateTaxonomyTag(tag)` → `{ ok: bool, prefix, value, knownPrefix: bool }`
   - Tests puros (sin IA · sin KB).
2. **Integración en generadores** existentes:
   - `sectorCloner.persistClonedSector` añade tags taxonómicos al `KB_UPSERT` del proyecto y de cada rol.
   - `roleSopGenerator.generateRoleSop` extiende el JSON output schema con `folksonomy: string[]` y tras parsear los mete en `content.tags`.
   - `generateWosFromSop` (en KanbanView) añade tags taxonómicos heredados del SOP.
3. **UI**: en el editor inline de `tagsService` (UX-001), distinguir visualmente los chips taxonómicos (color azul claro · NO eliminables · son contrato del sistema) de los folksonómicos (color índigo · eliminables).
4. **Cloud `/tags`** (UX-001): añadir filtros "Sólo taxonómicos · Sólo folksonómicos · Todos" en topbar.
5. **Matchmaking** (preview de Matriu): página `/match?tag=role:atencion-cliente&tag=sector:K` que devuelve nodos cruzados — mostrar 3 listas: Personas (placeholder hasta MAT-001) · Proyectos · SOPs.

### Conexión con Matriu (MAT-001)

- Las personas tendrán tags taxonómicos derivados de sus hats: `hat:tw · hat:tuc` y de sus skills validados por la CoP.
- El matchmaking de Matriu consulta el grafo de tags taxonómicos para sugerir colaboraciones (ej. "Buscamos un `role:diseñador-grafico` para `project:matriu-launch` `sector:R`").
- En la `Llançadora` (Mercado SOS), los productos se descubren por `cnae:` + `deliverable:`.

### Coste IA estimado (folksonómicos)

- **`roleSopGenerator`** ya hace la llamada · añadir el campo `folksonomy[]` al schema **es coste cero adicional** (sólo 30-50 tokens más en output).
- **`sectorCloner`** ya hace la llamada principal · ídem cero adicional para folksonómicos del proyecto.
- **Folksonómicos por rol** del cliente: una segunda llamada **opcional** con DeepSeek/Gemini (BACK-011 fallback más barato) · ~0,001€ por rol. Configurable on/off.

### Tests propuestos

- `taxonomicTagsForProject` produce el set correcto para un proyecto IKEA Madrid sector K (validar prefijos, no duplicados).
- `taxonomicTagsForSop` incluye `kind:project-role-sop` + `role:` + `soc-ref:`.
- `validateTaxonomyTag` reconoce los 12 prefijos del catálogo y marca como folksonómico cualquier no-listado.
- Integration smoke: tras `generateRoleSop` simulado con LLM stub, el SOP devuelto trae `content.tags` con al menos 4 taxonómicos + N folksonómicos.

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

## AUTH-001 · Identidad del operador · 3 caminos compatibles

> Tesis @alvaro 2026-04-30: SOS hoy no sabe quién está usando la app.
> Para conectar con Matriu (matchmaking · hats · pactos firmados) y
> con futuras apps del ecosistema, necesitamos una capa de identidad
> que NO sea bloqueante (cumple local-first) pero permita escalar
> hacia on-chain cuando el usuario lo decida.

### Tres caminos · compatibles entre sí

| Camino | Cuándo usar | Coste de onboarding | Capacidades |
|---|---|---|---|
| **Local-first identity** (default) | Primera sesión de cualquier usuario · operación offline | Cero · clave generada al primer arranque | Firmar exports + nodos del KB · trazabilidad de creador en cada `KB_UPSERT` |
| **Wallet connect** (WalletConnect / RainbowKit / Safe) | Usuario que ya tiene wallet · va a operar con FICE / pactos / Mercado on-chain | Medio · UX wallet popup | Firmar tx en Gnosis · recibir hats SBT · participar en votaciones FICE · recibir pagos en USDC |
| **OAuth** (GitHub / Google / email magic-link) | Onboarding rápido sin cripto · usuarios CoP que sólo consumen | Bajo · 1 click | Identificación entre miembros del proyecto · vincular avatar/nombre · NO firma cripto sin upgrade |

Los tres son **compatibles**: el usuario empieza con local-first, conecta wallet más adelante, añade OAuth para que otros le encuentren.

### Schema propuesto · nodo `type='user_identity'`

```json
{
  "id": "user-{stableId}",
  "type": "user_identity",
  "content": {
    "displayName": "Alvaro Solache",
    "handle": "@alvaro",
    "avatar": "data:image/...|url",
    "primaryDid": "did:key:zQ3..." ,
    "publicKeys": {
      "signing":    "0x04...",
      "encryption": "0x04..."
    },
    "wallets": [
      { "address": "0xabc...", "chain": "gnosis", "verifiedAt": 1714... }
    ],
    "oauthProviders": [
      { "provider": "github", "username": "asolache", "verifiedAt": 1714... }
    ],
    "hatTokens": [],
    "isPrimary": true,
    "createdAt": 1714...,
    "lastActiveAt": 1714...,
    "tags": ["kind:user-identity", "scope:internal"]
  },
  "keywords": ["user_identity", "@alvaro", "local-first"]
}
```

### Comportamiento sistémico

- Al crear/editar un nodo del KB se inyecta `node.createdBy` y `node.lastEditedBy` con el `user_identity.id` activo.
- Export firmado (`H1.3`) ya usa la clave local · ahora queda asociada al `user_identity` (1:1 con `primaryDid`).
- En `/settings → Identity` se ve el perfil · se hace upgrade a wallet o OAuth con un click.
- En las vistas de proyecto/Map/Kanban: cada nodo tiene un mini-avatar del autor · click → `/n/{userIdentityId}`.

### Implementación · 3 sprints

| Sprint | Entregable | Coste |
|---|---|---|
| **A** Local-first identity | Generación clave secp256k1 al primer arranque · `js/core/identityService.js` puro · vista `/settings → Identity` · stamping `createdBy/lastEditedBy` en `KB_UPSERT` | Medio |
| **B** Wallet connect | Integración WalletConnect/viem · vinculación address → user_identity · firma transacciones · botón "Connect wallet" en topbar | Alto · introduce dependencia external |
| **C** OAuth providers | GitHub OAuth · Google OAuth · email magic-link via Netlify Functions · vinculación username → user_identity | Medio |

### Conexión con otras historias

- **MAT-001 fase 1** · mint SBT identidad → escribe `hatTokens[]` en `user_identity` y queda enlazado.
- **UX-001 sprint C** · panel del proyecto muestra los miembros como `user_identity` cards.
- **H1.10.8** · el campo "Assignee · ID" para humanos pasa de input texto a selector de `user_identity` del proyecto.
- **MKT-001 sprint C** · el wallet prepago se asocia al `user_identity` activo.
- **BILL-001** · las facturas se firman con la `user_identity` del proveedor.

### Decisiones técnicas pendientes

- ¿DID method? (`did:key` simple vs `did:pkh` para wallet).
- ¿Soportar múltiples identidades por dispositivo? (sí, con flag `isPrimary` para la activa).
- ¿Cómo se sincroniza la identidad entre dispositivos del mismo usuario? (export/import firmado de identidad · futura integración con Automerge según MAT-001).
- ¿Cifrar la clave privada con passphrase obligatoria desde el principio o lazy?

---

*Documento vivo · actualizar al cierre de cada Ola.*
