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
| **MKT-001** | **`/workshops` → Mercado SOS de productos y servicios** — convertir la vista actual en un mercado con: (1) buscador AJAX por **CNAE** + filtros por sector/tipo, (2) productos/servicios asociables a cualquier proyecto cliente como **outputs finales** de su red de valor (intercambio con stakeholders de la red macro tipo SOS Matriu Launch), (3) **carga de saldo** prepago para uso de APIs IA y operaciones blockchain (ancla pactos, FICE rounds), (4) cuadro comparativo de **ahorro vs alternativas convencionales** (notaría · contabilidad · project management · consultoría). Ver sección dedicada abajo. Input @alvaro 2026-04-30. | 🟢 sprint A+B parcial+C1 verde · C2/D 🟡 |
| **MKT-001 sprint C1** | **Wallet prepago por proyecto · schema + ledger + UI sin pasarela** — `js/core/walletService.js` puro: schema `type='wallet'` con `content = { projectId, balanceEur, currency, movements[] }` · cada movimiento con `id · ts · kind · amountEur · ref · source · note · balanceAfter`. 4 kinds (`topup`/`consume`/`refund`/`adjustment`). Helpers puros · pureza no-mutación · `topUpWallet` · `consumeFromWallet` con código `INSUFFICIENT_FUNDS` y flag `allowNegative` · `refundWallet` · `adjustWallet` (preserva signo del delta) · `walletStats` agregadas. Helpers async · `getOrCreateWalletForProject` · `topUpAndPersist` · `consumeAndPersist`. Vista `/wallet?project={id}` con hero + saldo grande + 4 KPIs + 4 tramos preset (`TOPUP_PRESETS = [10,25,50,100]`) + custom topup + ajuste manual con confirm + tabla de últimos 200 movimientos. NavService · 12 destinos canónicos (+ 💶 Wallet · global=false sólo aparece con projectId). | ✅ verde |
| **MKT-001 sprint C3** | **Cargo automático del coste IA al wallet del proyecto** — `computeChargeFromTelemetry(telemetry, options)` puro · convierte costUSD del telemetry a costEur con `DEFAULT_USD_TO_EUR=0.92` (configurable via `eurRate`) · si no hay `costUSD` explícito, lo deriva de `tokens × pricing`. `chargeWalletForLlmCall({projectId, telemetry, costUSD?, eurRate?, allowNegative?, refPrefix?})` async · cobra y persiste con manejo defensivo (skipped: 'no-projectId' / 'no-telemetry' / 'zero-cost'). `Orchestrator.callLLM` acepta param opcional `chargeWallet: {enabled, projectId?, eurRate?}` · si no, lee toggle global y deriva projectId de `contextPruning.projectId`. Tras éxito, descuenta del wallet con `kind='consume'`, `source='orchestrator'`, `ref='llm-{provider}-{ts}'`, `note='{N} tokens · {provider}/{model}'`. Saldo insuficiente → `allowNegative=true` + warning console + `telemetry.walletCharge.sufficient=false` (NO bloquea el flujo IA). Toggle global `setWalletChargingEnabled / isWalletChargingEnabled` + card "💶 Cargo automático" en `/settings`. Tests · 10 asserts puros adicionales. Sprint C2 (Stripe Checkout real) sigue 🟡 cuando @alvaro dé claves. | ✅ verde |
| **MKT-001 sprint D** | **Cuadro comparativo de ahorro acumulado vs convencional** — `js/core/savingsService.js` puro: `computeWoHumanCost` (estimated + real con actualHours) · `computeWoAiCost` (tokens × pricing del provider) · `sumWalletConsumption` · `sumEfficiencyLogs` con filtro projectId via `pruning.taskTags` · `compareToConventional({category, sosEur, ranges})` con clamp [0, mid] sobre `savingEur` · `computeProjectSavings({projectId, wallet, efficiencyLogs, workOrders})` agregado · `buildSavingsTable` (4 cards: notaria · contable · pm · consultoria) · `accumulateAllProjects` totales globales. Vista `/savings` con dos modos: **modo proyecto** (`?project=`) con hero + 4 KPIs (IA real · humano real · SOS total · WOs ledger) + 4 cards comparativas + tabla detalle de cálculo · **modo global** (sin query) con totales acumulados + tabla por proyecto con link a su detalle. NavService · 13 destinos canónicos (+ 📊 Ahorro · global=true). Tests · 33 asserts puros · sanity 33/33 verde en node antes del push. | ✅ verde |
| **MKT-001 sprint A** | **Catálogo `market_item` + buscador CNAE + grid** — Vista nueva `/market` (paralela a /workshops · sprint posterior reclasifica workshops como sub-tipo). Schema `type='market_item'` con `content.{title,kind,cnae,sectorTT,priceEur,fmvHumanEquivalentEur,providerProjectId,deliverables,tags,visibility,sku,savingsCompareTo}` · 6 kinds (product/service/workshop/skill/template/subscription) · 4 visibilidades (public/red-macro/client/internal). Módulo puro `js/core/marketService.js` con `validateMarketItem · buildMarketItem · searchMarketItems · groupBy{Kind,SectorTT} · computeSaving`. Semilla CNAE 2009 reducida en `js/core/cnaeSeed.js` (~50 códigos relevantes mapeados a sectores TT) + `searchCnae(q)` con prefix matching. UI: buscador AJAX con debounce 250ms · 4 filtros estructurados (kind/visibility/sectorTT/proyecto) · grid masonry de cards con badge de ahorro · modal de detalle con FMV equiv + entregables + tags · modal "+Nueva oferta" con autocomplete CNAE que auto-rellena sector TT. UX-002: cada oferta nace con tags taxonómicos (kind:market-item · kind:service · cnae:7022 · sector:n · scope:public · project:...). Tests · 30 asserts puros. | ✅ verde |
| **UX-001** | **Hipertexto folksonómico universal · todo nodo es enlazable** — UX donde TODA entidad del Mind-as-Graph es un nodo navegable + enlazable a otros vía hipertexto folksonómico. Cada nodo `type='project'` expone su propio dashboard de herramientas: Pacto · Constitución · Plan tokenómico · Contabilidad · Pools liquidez · Llançadora + 5 vistas operativas (Mapa · Kanban · Ledger · Landing · Mercado del proyecto). Ver sección dedicada abajo. Input @alvaro 2026-04-30. | 🟢 sprint A+B+C verde · sprint D 🟡 |
| **UX-001 sprint C** | **Panel del proyecto · `/project/{id}`** — vista nueva que confluye 5 vistas operativas (Mapa·Kanban·SOPs·Mercado·Tags) + 6 herramientas de gobernanza (Pacto·Constitución·Tokenómica·Contabilidad·Pools·Llançadora · 5 stub "🚧 próximamente · MAT-001 / sprint D" + 1 wired a /kanban). Helper puro `js/core/projectHubService.js` con `aggregateProjectStats({projectId,nodes})` (cuenta SOPs · WOs por status · ofertas · ledger · ahorro acumulado · split AI/human) + `PROJECT_TOOLS` y `PROJECT_VIEWS` Object.freeze + `projectViewUrls(projectId)`. Vista hero con stats grid (6 KPIs) + 2 secciones de tiles (operativas y herramientas) + 2 listas opcionales (ofertas publicadas y SOPs del proyecto). Router prefix dinámico `/project/{id}` (igual que `/n/`). NodeView ahora redirige `type='project'` a `/project/{id}` (era `/map?project=`). Topbar del ValueMap añade botón "🎛 Panel" cuando hay proyecto activo. Tests · 16 asserts puros. | ✅ verde |
| **UX-001 sprint A** | **Direccionabilidad universal + folksonomía base** — Ruta `/n/{nodeId}` (NodeView resuelve por `node.type`: project/sop/work_order/workshop redirigen a vistas especializadas; tipos genéricos muestran fallback con metadatos + JSON dump). Ruta `/tags` con cloud (tamaño según frecuencia) + lista filtrable de nodos por tag, sincronizada con query param `?tag=`. Módulo puro `js/core/tagsService.js` con `normalizeTag`/`aggregateTags`/`nodesWithTag`/`relatedEdgesByTag`/`addTagToNode`/`removeTagFromNode` + helpers async `persistTagAdd`/`persistTagRemove` (sincronizan `content.tags` ↔ `keywords` para que `KB.query({keyword})` funcione). Editor inline reusable `renderTagsEditor()`. Tests · 28 asserts puros. | ✅ verde |
| **UX-001 sprint B** | **Hipertexto `[[node-id]]` + linkificación automática** — módulo puro `js/core/linkifyService.js` con `linkifyNodeRefs(text)` y `linkifyMultiline(text)`. Sintaxis: `[[nodeId]]` → link a `/n/{id}`, `[[nodeId\|alias]]` → link con texto custom, `#tag` → link a `/tags?tag={tag}`. Escapado HTML defensivo (XSS-safe). Validación estricta de IDs (`[A-Za-z0-9_.-]+`) y tags (kebab-case). Integrado en NodeView (descripción/summary del fallback genérico) y KanbanView (descripción de la WO en el modal de detalle). Tests · 27 asserts puros (vacío, escape, 1 ref, alias, múltiples mezclados, ID inválido, tag inválido, XSS, multiline). | ✅ verde |
| **UX-002** | **Auto-tagging semántico al crear mapa, SOPs y WOs** — `js/core/semanticTagger.js` con catálogo cerrado de 17 prefijos taxonómicos + integrado en `generateWosFromSop`, modal "+Nueva WO", `_persistRoleSop`, `client_vna_model`. Fase 2: el LLM devuelve `folksonomy[]` en `roleSopGenerator` (sopRol), `regenerateSopWithFeedback` (regen) y `sectorCloner` (proyecto + tags por rol). Mergeo automático con `mergeTags(taxonomy, folksonomy)` antes de persistir. Tests · prompt builders verifican presencia de `folksonomy` y prohibición explícita de prefijos `:` para folksonómicos. UI: chips azul claro inmutables (taxonomy) vs índigo eliminables (folksonomy). | ✅ verde fase 1+2 |
| **KM-001** | **Knowledge Management · folders inteligentes + optimización de tokens** — visión a medio plazo @alvaro 2026-04-30: que la AI experience del operador sea legendaria · cuando abre un proyecto, el sistema le sirve sólo el contexto relevante (no el KB entero). Dos vectores entrelazados: (1) **Carpetas inteligentes**: queries persistentes sobre el KB (combinación de tags taxonómicos + folksonómicos + node.type + projectId + recencia) que actúan como vistas vivas tipo Smart Mailbox · ej. `Carpeta "Mis WOs urgentes"` = `kind:work-order + status:doing + priority:high + assignee:@alvaro`. Cada operador tiene su set, exportable. (2) **Optimización de tokens**: pipeline de pre-procesado del contexto que inyecta sólo los nodos con weight ≥ threshold según relevancia al task (similarity sobre tags + grafo + recencia) · BACK-010 ya esboza esto · KM-001 lo formaliza con criterio TDD ("la respuesta del LLM con contexto pruned debe pasar el mismo DTD que con contexto entero"). Conexión directa con la calidad de matchmaking de MAT-001 y la rentabilidad real de BILL-001. Ver bloque dedicado abajo. | 🟡 |
| **H_ANIM_001** | **Visualizar flujo de valor con orden secuencial · multi-modelo** — animación + vistas alternativas (BPMN, swimlanes, Sankey, service blueprint, secuencia lineal) + ordenación manual o IA del flujo. Ver sección dedicada abajo. Input @alvaro 2026-04-30. | 🟢 sprint A verde · B+C 🟡 |
| **H_ANIM_001 sprint A** | **Orden secuencial + animación de pulsos en `/map`** — `js/core/flowAnimationService.js` puro: `normalizeTransactionsOrder` (ordena por sequence_order asc · sin orden al final · estable) · `groupTransactionsByPhase` · `computeAnimationCycles` con dos modos (`sequential` default · `parallel-by-phase`) · `validateFlowOrder` (warnings de sin orden · duplicados · gaps) · `autoFillSequenceOrder` (rellena desde max+1) · `ANIMATION_MODES` Object.freeze. Inspector de transaction añade campos editables `sequence_order` (number) y `phase` (string libre) con bind blur+enter para guardar inline. Topbar nuevo botón "▶ Animar flujo" que toggle on/off · si ninguna tx tiene orden ofrece auto-fill con confirm · loop infinito de pulsos D3 (círculos índigo con drop-shadow) que viajan del nodo `from` al `to` con `cubicInOut`. Cleanup en `destroy()` para SPA teardown. Tests · 23 asserts puros. | ✅ verde |
| **H_ANIM_001 sprint B (mínimo)** | **Vista lineal del flujo como overlay** — botón "📜 Vista lineal" en topbar de `/map` abre un modal con timeline secuencial (grid responsivo 280px+ por card). Cada card: badge con `sequence_order` · pill MUST · color por type (índigo tangible · naranja intangible) · deliverable · `from → to` con nombres de roles. Separadores visuales por phase · usan `normalizeTransactionsOrder` (sprint A). Sin tocar el grafo D3 · es overlay puro. Pensado para mostrar a un cliente CEO el ciclo en <30s (criterio "brutal y universal" del backlog). | ✅ verde |
| **H_ANIM_001 sprint C** | **IA infiere `sequence_order` y `phase` de todas las transactions** — `buildFlowOrderPrompt({roles, transactions, projectName})` puro · prompt con catálogo de roles+txs+ids+deliverables+MUST flags · instrucciones explícitas (orden 1..N · ciclo descubrimiento→cobro · MUST tangibles antes · phase kebab-case 1-2 palabras) · output schema JSON `{ordered:[{id,sequence_order,phase}], rationale}`. `applyOrderToTransactions(transactions, ordered)` puro · ignora ids no existentes y sequence_order inválidos. `inferFlowOrder({roles, transactions, projectName, projectId, preferredEngine})` async · llama `Orchestrator.callLLM` con responseFormat='json_object' · respeta toggles de pruning + walletCharge cuando hay projectId. UI: botón "🤖 Inferir orden IA" en topbar · loading "🧠 Pensando…" · modal de revisión con tabla ordenada (#·phase·from→to·deliverable) + rationale del LLM + footer con tokens/provider/latencyMs · botones Cancelar / "✓ Aplicar y guardar" (solo aplica al state · pulsar "💾 Guardar" del topbar persiste). Tests · 14 asserts puros adicionales. | ✅ verde |
| **H_ANIM_001 sprint D** | **BPMN 2.0 subset + Sankey + service blueprint** — vistas alternativas más complejas. BPMN con gateways/eventos/sub-procesos. Sankey con anchura de aristas según volumen (necesita campo `volume` opcional en transactions · bind a ledger entries). Service blueprint con "line of visibility" separando frontstage/backstage. Pensado para clientes que ya usan Bizagi/Camunda o consultoría BPM. Coste alto · requiere bibliotecas nuevas (sankey via d3-sankey · BPMN via bpmn-js). En cola · cuando MAT-001 fase 1 esté lista para no duplicar trabajo de TS migration. | 🟡 |
| **UX-NAV-002 sprint A** | **Topbar agrupada por categorías · 5 cats + dropdowns** — input @alvaro 2026-04-30: la topbar tenía 13 botones planos · saturada. Sprint A entregado: catálogo `NAV_CATEGORIES` Object.freeze de 5 grupos canónicos (🏠 Inicio · ⚙ Operaciones · 📚 Conocimiento · 🛒 Mercado & ROI · 👤 Cuenta) · cada `NAV_DESTINATIONS` lleva ahora `category`. `groupNavByCategory({active, projectId})` puro · devuelve los grupos visibles según contexto. `renderNavGroupedHtml({active, projectId, className, activeClass, groupClass, menuClass})` · home y categorías con 1 link como anchor directo · resto como botón + `<div role="menu" hidden>` con aria-haspopup. `bindNavGroupDropdowns(rootEl)` activa toggle on click · cierra al click fuera + Escape. `ensureNavGroupStyle()` inyecta CSS único en `<head>` (idempotente). Router llama ambos automáticamente tras cada render → las 16 vistas migran transparentemente de `renderNavLinksHtml` a `renderNavGroupedHtml` sin tocar cada una. Tests · 33 asserts puros (estructura HTML · agrupación por contexto · home directo · operations sin proj=2 · con proj=4 · aria attrs · exports). | ✅ verde |
| **UX-NAV-002 sprint B** | **Sidebar lateral colapsable + búsqueda Cmd+K** — sprint pendiente · evolución del sprint A: barra lateral con icon-only por defecto · expand on hover · búsqueda global Cmd+K (KM-001 sprint D backlog) integrada con autocompletado de los 13 destinos + nodos del KB recientes. Decisión tras feedback de @alvaro sobre el sprint A. | 🟡 |
| **MAT-002** | **Matriu Incoopadora · análisis del modelo + integración SOS como sistema operativo** — input @alvaro 2026-04-30 con Matriu_Landing_standalone.html · análisis completo de la propuesta cooperativa en producción. Ver bloque dedicado abajo. Conexión: SOS V11 es el OS operativo de la Cohort 0 (24/100 plazas) · cada place fundacional usa el mapa de valor + kanban + walletes prepagos para aprender el método y aplicarlo a su propio proyecto. Sub-historias: MAT-002-A · plantilla "proyecto SOS Matriu" pre-configurada con SOC + SOPs específicos · MAT-002-B · UI alineada con el branding Matriu (Instrument Serif + Inter Tight + paleta `#f1ebde`/`#1a1f1a` de la landing). | 🟢 sprint A verde · B/C/D/E 🟡 |
| **MAT-002-A** | **Plantilla "proyecto SOS Matriu Cohort 0" preconfigurada** — `js/core/matriuTemplate.js` puro: catálogos `MATRIU_COHORT_0` (cohort=0 · capacity=100 · multiplier=1.5 · initialCredits=2000 · cohortWeeks=10 · sectorTT='Q'), `MATRIU_PERKS` (6 perks fundacionales), `MATRIU_FAIR_FRACTAL_RULES` (4 reglas), `MATRIU_VALUE_KINDS` (4 tipos de valor) Object.freeze · alineados con Matriu_Landing_standalone.html. `buildMatriuCohortProject({operatorName, operatorHandle, projectIdea})` puro · genera `{project, kbNodes, navigateTo}` · 1 project (sector Q, scope:internal, cohort:0 tags) + 1 SOC matriu-tokenomic con 4 reglas + 6 SOPs (uno por perk · cohort-10sem con 10 steps semanales · resto con 3) + 1 wallet con 2.000 crèdits seed. Botón "🎓 Cohort 0 Matriu" en topbar Dashboard · modal con identidad visual Matriu (`#f1ebde` fondo · Instrument Serif italic · `#1a1f1a` CTAs) · campos operatorName + handle + projectIdea + lista de los 6 perks · CTA "Reservar seient · 0 € →" persiste vía CREATE_PROJECT + KB_UPSERT en cadena · navega a `/project/{id}`. Tests · 65 asserts puros · sanity 65/65 verde en node antes del push. | ✅ verde |
| **VISION-001** | **Visión integral @alvaro · perfil + estrategia + fondo descentralizado catalán** — bloque maestro al final del documento. Recoge perfil de @alvaro Solache (psicología social UB · postgrado redes cooperación · 30 años en internet · TimeFounder · cryptomarketing · UOC.edu RRHH · foro RRHH Catalunya Foment · 10 versiones SOS) · 4 pilares operativos · modelo de negocio "free + saldo prepago" · visión a largo plazo "fondo de inversión descentralizado catalán" · system prompt operativo canonical SOS · 7 sprints derivados (UX-NAV-003 · MAT-002-F · MAT-002-G · I18N-001 · PACT-001 · CONTR-001 · NET-100). Documento maestro estratégico a leer antes de cada decisión arquitectónica. | 🟢 anotado · 7 sprints derivados 🟡 |
| **UX-NAV-003** | **Breadcrumb + indicador de fase del proyecto** — input @alvaro 2026-04-30: "quiero que la UX de SOS me ayude a saber dónde estoy en todo momento". Sprint A: helper puro `buildBreadcrumb({pathname, search, projects, nodeId?})` + `renderBreadcrumbHtml(items, options)` + banner auto-inyectado por router (zero changes en vistas). Detecta proyecto activo via query · nodeId via URL · rutas conocidas. Indicador de fase del proyecto · pill con 🎨 DESIGN · 🛠 BUILD · ⚙ OPERATE · 💶 LEDGER según heurística sobre SOPs y WOs del proyecto. Sprint B: override manual con tag `phase:X`. Sprint C: vista `/journey` con recorrido del operador en Cohort 0. | 🟢 sprint A verde · B+C 🟡 |
| **UX-NAV-003 sprint A** | **Breadcrumb dinámico + phase pill** — `js/core/navService.js` extendido: `ROUTE_LABELS` mapping de las 13 rutas globales · `PHASE_META` Object.freeze con 4 fases (design morado · build amarillo · operate cyan · ledger verde). `buildBreadcrumb({pathname, search, projects})` puro · 6 casos cubiertos (`/`, `/dashboard`, ruta global con/sin projectId, `/n/{id}`, `/project/{id}`, fallback ruta desconocida) · trunca node IDs largos con `…`. `detectProjectPhase(project, stats?)` · respeta tag override `phase:X` · heurística sobre stats (woLedgered → ledger · woDoing → operate · sops>0 → build · default design). `renderBreadcrumbHtml({items, phase, className})` · current con aria-current="page" · phase pill con icono+label+color. `ensureBreadcrumbStyle()` inyecta CSS único en `<head>` (idempotente · responsive <720px). `paintBreadcrumb({targetEl, pathname, search, projects, projectStats})` async · helper alto nivel para el router. Router ahora crea `<div id="sos-breadcrumb-slot">` antes del `#app` y lo repinta tras cada navegación · query SOPs+WOs del proyecto activo para detectar fase. Tests · 26 asserts puros · sanity 26/26 verde en node antes del push. | ✅ verde |
| **MAT-002-F** | **Matriu strip al Dashboard · "El teu seient a Matriu"** — entregat. Quan hi ha ≥1 projecte amb `matriuCohort === 0`, el Dashboard mostra una secció skin Matriu (crema `#f1ebde` + Instrument Serif italic + acent terracota `#c25a3a`) just sota del hero. Estructura: header amb títol italic "El teu seient a Matriu" + subtitle + counter `seatsTaken/108 places` (pulse animation) · grid responsive auto-fill 220px de "seats" (1 per projecte cohort 0) amb · Instrument Serif nom del projecte · projectIdea truncada · pill `×1.5 fundacional` (terracota) · pill `projectType` si està declarat. Cards són anchors SPA `data-link` cap a `/project/{id}` amb hover `translateY(-2px)` + border terracota. CTAs · "Tornar a Matriu →" (botó negre `#1a1f1a` cap a `/matriu`) + "Aprendre més ↗" (cap a `/learn`). Connecta amb MAT-002-H+ · quan reserves amb typeId, `project.matriuProjectType` el persistim i el strip el mostra com a pill. ZERO impact si no hi ha cohort 0 (`innerHTML = ''`). Tot embedded dins `DashboardView.js` · sense tocar la resta del Dashboard. | ✅ verde |
| **MAT-002-G** | **System prompt SOS canónico · manifesto persistido + UI editable (NO inyección automática en callLLM)** — input @alvaro 2026-05-08 reframe: la visión VISION-001 vive en la memoria del desarrollador y en el documento maestro · NO debe inflar tokens en cada llamada LLM porque eso degrada calidad/coste, que son valores añadidos centrales de SOS. Decisión arquitectónica: persistir el manifesto como nodo KB `type='system_prompt' kind='canonical-manifesto' id='sos-system-prompt-canonical'` · UI editable en `/settings → System Prompt SOS` (read/edit/restaurar default) · **ZERO impacto en `Orchestrator.callLLM` por defecto**. El manifesto es referencia consultable · no premisa inyectada. Sprints derivados: A · persistencia + UI editable. B (opt-in muy específico) · si el operador activa expresamente "Inyectar manifesto en LLM" en `/settings`, los flujos de cloning de sector / generación de SOC pueden incluirlo · jamás los flujos críticos de generación de SOPs ni woAssistant donde el coste por token es crítico. C · audit cuantificado pre-merge · medir delta tokens/coste con muestra real antes de habilitar B en producción. | 🟡 fase A próxima |
| **UX-EDU-001** | **Capas UX didácticas · aprender haciendo VNA + contabilidad valor + triple-entry + smart contracts + econom-IA** — input @alvaro 2026-05-08: "el programa Matriu se aprenderá haciendo · cada vista de SOS debe incorporar capas didácticas que enseñen los conceptos teóricos sin que el operador tenga que leer un libro". `js/core/didacticService.js` puro: catálogo `EDU_CONCEPTS` Object.freeze con 17 conceptos canónicos · `renderExplainerBadge` accesible · `bindExplainerBadges` con hover/focus/click + Escape + click-outside · `ensureExplainerStyle` CSS único. Sprint A · service + integración /map (vna) /savings (triple-entry). Sprint B · 6 vistas restantes (/kanban antigravity · /wallet econom-ia · /folders folksonomy+taxonomy · /identity did+sbt · /efficiency context-pruning · /market slicing-pie). Sprint C · vista `/learn` glosario navegable con sidebar concepts + búsqueda + progress bar (✓ ya leído persistente en KB `type='didactic_seen'`) + back-references a vistas donde aparece cada concepto. Sprint D · enlaces cruzados a SOPs/SOCs reales del proyecto activo. ZERO consumo tokens. | 🟢 A+B+C verde · D 🟡 |
| **MAT-002-H** | **Landing pública Matriu Incoopadora en `/matriu`** — input @alvaro 2026-05-08 con `Matriu_Landing_standalone.html` adjunto: la página de venta de Matriu vive dentro de SOS, no en una página estática externa · refleja la "incubadora cooperativa que reparteix valor en temps real" en catalán fiel al HTML adjunto. `js/views/MatriuLandingView.js` reusa `MATRIU_COHORT_0`, `MATRIU_PERKS`, `MATRIU_FAIR_FRACTAL_RULES`, `MATRIU_VALUE_KINDS` de `matriuTemplate.js` (single source of truth). Secciones · hero "Sigues / dels primers / en el nucli" + pill "Cohort 0 oberta · 24/100" + CTA "Reservar el teu seient" · stats row (100/24/∞/0s) · "Per què ara" 4 cards (multiplicador ×1.5 · governança ECO · crèdits · llinatge) · "Tokenomic Fair Fractal" 4 reglas FF · "Value mapping engine" 4 ejemplos JT/NB/AR/ML · "Exit model" 4 fases (trigger · snapshot · càlcul · liquidació) + 3 invariantes · "Cohort 0 · 100 places" 6 perks completos · footer CTA "Reservar seient · 0 €" + whitepaper · footer cooperativa con enlaces (Producte · Comunitat · Recursos). Skin Matriu: `#f1ebde` crema · `#2a3a2a` verd fosc · `#c25a3a` terracota · Instrument Serif italic + Inter. Modal de reserva integrado · usa `buildMatriuCohortProject` + CREATE_PROJECT + KB_UPSERT · navega a `/project/{id}` tras reservar. Badges UX-EDU-001 inline (fair-fractal-tokenomics · vna · triple-entry · smart-contract · cohort-0) · refuerzo didáctico durante la lectura. Ruta `/matriu` registrada en router · destino global en navService categoría `home`. | ✅ verde |
| **MAT-003** | **Matriz inicial multidisciplinar · 108 plazas (96 op + 12 guardians) Cohort 0** — sprints A/B/C/E/F entregats. Sprint D pendent (time banking inverso). | 🟢 5 sprints verde |
| **VAL-001** | **Contabilidad de valor · Slicing Pie + FairShares 4 pies de stakeholders** — input @alvaro 2026-05-09: "el primer contrato debe alimentarse de la contabilidad de valor · falta una vista por proyecto donde se vea la tarta de cómo se reparte entre el equipo de personas/stakeholders · esta vista no la tenemos en V11". Es el **cimiento operativo del slicing pie** que SOS V11 promete pero hasta ahora no materializa formalmente. Concepto: cada proyecto tiene una **contabilidad de valor viva** que mide aportaciones reales (tiempo, dinero, ideas, activos, relaciones) con multiplicadores de riesgo · genera "slices" · y los reparte en 4 pies separados (founders, team, users, investors) según el modelo FairShares + un pie opcional de comunidad. Sprints · A `valueAccountingService` puro (multiplicadores · calculateSlices · calculatePieDistribution · 4 pies stakeholders · tests) · B vista nueva `/value-accounting?project={id}` con D3 pie chart · C integración con WOs ledgered (cada hora trabajada genera slices automáticamente) · D conexión con PACT-001 (el pacto firmado define los multiplicadores y el pie target del proyecto). Ver bloque dedicado abajo. | 🟡 sprint A próximo |
| **MAT-002-I** | **Matriu reframe · personas, no proyectos** — sprints A+B+C+D entregat. **Sprint C** · ProjectHubView nova secció "👥 Membres del projecte" entre hero i strip Enjambre · cards 260px responsive amb avatar colorat per guardian · displayName italic · handle mono · pill ⚡ guardian · bio · skills (top 4 + count) · star ★ owner si project.ownerMemberId match · fit % si hi ha swarm_assignment · empty state amb hint per activar enjambre o assignar manualment. Resol membres del projecte combinant · swarm_assignment + WO assignedToSeatId + project.ownerMemberId · accept tant cohort_seat com matriu_member. Link "🌐 Veure tota la xarxa →" cap a /matriu/network. **Sprint D** · toggle public/network més visible · landing /matriu ara té al hero un botó "🌐 Veure els membres del nucli →" al costat del pill cohort · MatriuNetworkView té "📜 Veure el manifest →" destacat al topbar · navegació fluida entre les dues vistes. **Sprint B** · matriuMemberService.js puro · schema unificat type='matriu_member' fusiona cohort_seat + user_identity. Helpers buildMatriuMember + migrate{CohortSeat,Identity}ToMember + mergeIdentityIntoMember + migrateAllToMatriuMembers (dryRun). UI banner migració al network view. **Sprint A** · MatriuNetworkView.js ruta /matriu/network · directori 108 amb cards + 4 filtres + 4 stat-cards. **Refactor 2-step modal /matriu** (input @alvaro 2026-05-09): step 1 obligatori (perfil membre amb skills+guardian, crea matriu_member) · step 2 opcional (projecte amb tipus). **Bug fixes** · timing dispatch await (project visible immediatament tras navegació) · stats coherence (vna_roles/transactions poblats al project alhora que al KB). | ✅ A+B+C+D verde |
| **WO-ASSIGN-001** | **Asignación de WOs a plazas Matriu** — sprint A entregat. KanbanView ara carga cohort_seat al `_load()` (KB query type='cohort_seat'). Modal de detall del WO té un selector nou "🐝 Assignat a (plaza Matriu / DID)" amb llista de plazas disponibles + opció "(sense assignar)" que mostra l'assignee legacy. Persisteix `c.assignedToSeatId` quan es clica "Iniciar/Finalitzar/Aprovar". `_cardHtml` prioritza el badge de plaza Matriu (estil morado terracota amb 🐝 + nom) sobre l'assignee legacy quan existeix. Cierre del cicle · WO passa a 'ledgered' → /value-accounting "Importar des de WOs" llegeix `assignedToSeatId` (via `partyIdForWo` de woContributionService) i genera contribution time per al party. Sprint B pendent · auto-sugerencia IA basada en swarmMatchmaker. Sprint C pendent · feedback visual amb foto/icon del miembro. | 🟢 sprint A verde · B/C 🟡 |
| **I18N-001** | **Trilingüe ES · CA · EN real · SOS ENTERO (no solo Matriu)** — input @alvaro 2026-04-30 + clarificación 2026-05-09: "cuando hablo de trilingüe hablo de SOS y no solo de la Matriu". Cobertura · TODAS las vistas (Dashboard · Map · Sops · Kanban · Wallet · Savings · Settings · Identity · Folders · Mind · Efficiency · Market · Tags · Workshops · ProjectHub · NodeView · LearnView · MatriuLandingView). i18next con detect navigator + override en /settings → idioma. Nodos KB con campos `name_en/ca/es` cuando aplique. Sprints · A: i18next setup + extractor de strings + selector visible · B: 3-4 vistas más usadas (Dashboard · ProjectHub · Settings · Map) · C: resto de vistas + nodos KB · D: bilingüe en LLM prompts (system prompt en idioma del operador). Catalán estratégico · base del fondo descentralizado catalán VISION-001 · pero EN crítico para ampliar red de fundadores fuera de Catalunya. | 🟡 |
| **PACT-001** | **Pacto de socios dinámicos · primer contrato del Mètode SOS** — sprints A+B+C verdes. Sprint C · firma ECDSA P-256 real (browser WebCrypto) sustituye la simbòlica. Helpers nous a pactService · `pactSnapshotForSigning(pact)` puro genera JSON canònic (projectId + version + clauses + parties · SENSE signatures perquè cada signatura cobreixi el mateix contingut) · `signPactWithKey({pact, keypair})` async · `verifyPactSignature({pact, signatureEntry})` async (detecta tampering). `addSignature` extés amb `algorithm` ('symbolic' default · 'ecdsa-p256-sha256' real) + `publicJwk` opcional. PactBuilderView · `_handleSign` ara crida `getOrCreateSigningKey()` de projectIO (la mateixa clau que els snapshots) + signPactWithKey + sanity verify abans de persistir. Badge a la taula de socis mostra 🔐 quan és ECDSA real. 15 asserts puros nous (snapshot canònic · backwards compat algorithm symbolic · ecdsa con publicJwk · sign+verify happy path · tampering detection). Sprint D pendent · export PDF + JSON canònic per a Pact.sol (MAT-001 fase 4 · EIP-712). Suite global · 40 (afegit dins testPactService). | 🟢 A+B+C verde · D 🟡 |
| **CONTR-001** | **Contratos de plataforma · suscripción + saldo acumulable** — input @alvaro 2026-04-30: "planes de subscripción con saldo acumulable para uso de APIs y registros". Tipos de plan: free (local-first · no APIs IA propias · API key del usuario) · pro (saldo prepago Stripe · descuento automático MKT-001 sprint C3 ✅) · cooperative (saldo USDC en Gnosis vía MAT-001 fase 4) · enterprise (custom). Onboarding de plan en `/settings → Plan`. Tests del builder. | 🟡 |
| **NET-100** | **Red de 100 personas dunbar-friendly · matchmaking** — input @alvaro 2026-04-30: "como psicólogo comunitario me interesa facilitar el proceso de crear redes de unas 100 personas preparadas para trabajar con este modelo". Cohort = 100 plazas (Matriu C0 ya). Matchmaking entre miembros por skills · folksonomy · sectores · MATRIU_VALUE_KINDS · WO open-call broadcast a la red · slicing pie automático al participar. Necesita MAT-001 fase 1 (SBT identidad) para identificar miembros entre dispositivos. | 🟡 |
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
| **KM-001 sprint D (helpers)** | **Format + similarity baseline para futuro TDD-gate** — `formatNodesForPrompt(selected, options)` serializa nodos pruned a markdown compacto listo para system prompt (header + por nodo: type/id/título/projectId/tags taxonómicos vs folksonómicos separados/body truncado a `maxBodyChars`/steps SOP resumidos). `jaccardSimilarity(textA, textB)` métrica baseline para gate (lowercase + alfanuméricos + tokens ≥3 chars + STOP_WORDS ES/EN básicos). `passesContextGate({baseline, candidate, threshold=0.92})` devuelve `{passes, score, threshold}`. Tests · 16 asserts puros (vacíos · format con SOP completo · stopwords no afectan jaccard · gate con identicos vs dispares). | ✅ verde |
| **KM-001 sprint E1** | **Integración pruner en `Orchestrator.callLLM` (opt-in)** — `pruneFromKb({KB, projectId, task, options, formatOptions})` async helper que carga candidatos del KB (proyecto + nodos públicos sop/soc/market_item) y aplica `pruneContextNodes` + `formatNodesForPrompt`. `Orchestrator.callLLM` acepta `contextPruning: {enabled, projectId, task, options, formatOptions}` · si enabled=true prefija formatted al systemPrompt y emite telemetría con tokens before/after/delta. Toggle global `setContextPruningEnabled / isContextPruningEnabled` persistente en KB. Vista `/settings` con checkbox "🧠 Context pruning". Tests · 8 asserts puros adicionales (mock KB). | ✅ verde |
| **KM-001 sprint E2** | **Enganche automático + dashboard `/efficiency`** — sectorCloner/roleSopGenerator (gen+regen)/woAssistant ahora leen `Orchestrator.isContextPruningEnabled()` antes de cada `callLLM` y, si está ON, pasan `contextPruning: {enabled, projectId, task: derivado del role/sector}` automáticamente. Cada llamada con pruning persiste un nodo `type='efficiency_log'` con `provider · promptTokens · completionTokens · totalTokens · costUSD · pruning telemetry · timestamp · latencyMs` (fire-and-forget · no bloquea el return). Vista nueva `/efficiency` con hero + 5 KPIs (tokens totales · coste USD · nodos seleccionados · nodos descartados · Δ tokens prompt avg) + tabla de las últimas 100 llamadas con timestamp/provider/tokens/cost/nodos · botón "Borrar logs" para purgar histórico. Ruta y entrada en `navService` (⚡ Eficiencia · 11 destinos canónicos). Argumento de venta cuantificable para BILL-001 alfa privada. Tests del navService actualizados a 11 destinos. | ✅ verde |
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

#### ✅ Hito · Sprint Creació Llegendari (16-17 mai 2026 · 13 PRs · #135-#147)

Sessió marató · va portar la creació de projecte al nivell alfa-ready. Resultats:
- **v99 · MANIFEST-DTD** · 94 asserts blindant manifest Agent SOS ↔ createProject
- **v100-104 · AI-DRIVEN trilogia** · socMatcher + 3 task prompts + streaming + /create-live UI + wizard pre-form
- **v105 · NAVBAR única V3** · 5 grups imperatius · bottom-nav deprecated · Cmd+K search
- **v106 · /learn subhub** · 7 tabs absorbeixen sectors/mind/folders/tags
- **v107 · CRITICAL FIXES** · A1 sessionStorage redirect · A2 pre-flight API key · B1 SOC fallback · C2 Cmd+K no acumulació
- **v108 · brand-specific scope** · teamtowers-brand/merchandising fora del catàleg genèric
- **v109 · prod bugs batch** · avatar dropdown · ESC search · navigateTo SPA · IA fallback log · sync draft · IA quality prompts
- **v110 · LEGENDARY CREATION** · skeletons + celebració gold + jerarquia CTA + hero revamped
- **v111 · NODE-VIEW MARKDOWN** · /n/{id} carrega knowledge/.md parsejat + GitHub link
- **v112 · SECTOR ROLE NAMING** · 17 CNAE × 5 rols (CTO Founder · Cap d'Obra · Managing Partner...) zero cost IA
- **v113 · IA DEFAULT ALL MODES** · light/standard/max sempre ai-driven · vna_zoom auto-mapping
- **v114 · LEGENDARY ALL AMBITIONS** · banner + narrativa + budget + hint WOs adaptat per cada ambition
- **v115 · IKIGAI FIX DEFINITIU + HUB legendary** · verify+retry+await render + zone 0 stats clau
- **v116 · VNA PROMPTS QUALITY** · Verna Allee methodology explícita als prompts · sector_role_examples

Bones pràctiques destil·lades · veure `knowledge/vision/best-practices-2026-05.md`.

#### Pendents

| ID | Visión | Notas |
|---|---|---|
| **wo-knowledge-index-scope-002** | **Revisar `knowledge/_index.md` · separar contenido brand-specific TeamTowers de universal** (S · 3€) | Mismo problema que con `teamtowers-brand.md` (resuelto en v102 con `scope: brand-specific`) aplica a SOPs y a otros bloques. NO PERDER ningún SOC/SOP — solo asociarlos al proyecto `teamtowers.eu` (brand_owner). Frontmatter `scope: brand-specific` + `brand_owner: teamtowers` a los SOPs operativos TT (fent-pinya, castellers-demo, la-colla operativa, merchandising, etc.). Update `socMatcher`/`sopMatcher` para filtrar. `_index.md` debe ser **guía completa de TODO knowledge que aporte valor a IA + usuarios** con tablas separadas Universal vs Brand-specific. Verificar también roles/clients/vision por si tienen el mismo issue. Tests: brand-specific NO aparece en proyectos genéricos · SÍ en proyectos TT auto-detected. |
| **wo-mobile-mini-apps-PR-D** | **Mobile mini-app launcher** (L · 10€) · vista mobile separada (`@media max-width:768px`) amb bottom-nav de 5 mini-apps (📸 capturar · 🎯 check-in ikigai · 🐝 swarm · 🛒 mercat · 👤 identitat). Cada mini-app cobra crèdit per microacció (0.005-0.05€). Encaixa amb el ledger triple-entry. **Palanca de model de negoci recurrent**. |
| **wo-hub-tabs-integration** | **Hub `/hub/{id}` mode tabs** (L · 8€) · igual que `/learn` · 7 tabs · overview (zone 0 actual) · mapa · sops · kanban · qualitat · ledger · lifecycle. Cada tab embed inline (no full separate view). Resol "DRY integrant altres vistes" feedback @alvaro. |
| **wo-vna-prompts-evidence-loop** | **IA cita el sector role example al output** (S · 3€) · després de v116 · verificar que els SOPs/WOs generats realment usen el nomenclatura del sector_role_examples · si no · re-intent amb prompt reforçat. |
| **wo-prompts-sector-deeper** | **Sub-sectors CNAE 2 dígits** (M · 5€) · J62 software vs J63 dades vs J60 broadcast tenen rols diferents · enriquir sectorRoleCatalog amb 2on nivell. |
| **wo-quality-board-realtime** | **Quality board cross-projects** (M · 5€) · al hub orgwide veure tots els projectes amb rubric scores + tendència · prioritzar quins enriquir amb IA. |
| **wo-design-tokens-refactor** | **PR-C postposat** (M · 7€) · escala typography centralitzada (`--text-xs`/`-sm`/`-md`...) + refactor SwarmFlowView + NeuralPathView + AccountingView (estils antics hardcoded). |
| **wo-onboarding-momentum** | **Primer projecte amb tutorial inline** (M · 6€) · l'usuari nou veu tooltip a `/create-live` · "això és la IA seleccionant SOCs del knowledge real" · educa mentre crea. |

#### 🆕 Sprint v120 · WOs estratègics (gen 2026-05-17 @alvaro)

| ID | Visión | Notes |
|---|---|---|
| **wo-agent-md-pattern** | **Refactor TASK_PROMPTS → fitxers `agents/*.md` (AGENT.md convention + MCP standard)** (L · 12€) · cada task = 1 fitxer .md amb frontmatter YAML (model · tools · output_schema) + body markdown (system + user templates). Compatible amb qualsevol IA (passa el .md com a system prompt). Anthropic MCP per a tools agnostic. Resol "somos agnosticos de IA". Permet també editar prompts sense tocar codi JS. Plan · 1) docs/AGENTS-pattern.md · 2) carpeta agents/ amb 13 fitxers · 3) parser agents/{task}.md → struct · 4) vnaExpertPrompts.js delega a agents · 5) /prompts-debug llegeix .md. |
| **wo-skills-ecosystem** | **Skills page rediseny + ecosistema complet** (L · 15€) · /skills nova UI integrada · skills assignades a WOs (ja generades v119) · plantilles offline (CSV/MD descarregables per a usuari sense connexió) · entrenament LLM local SOS (skills declarades pelo usuari per fine-tune) · permaweb-shared skills (broadcast skill profile a la xarxa per a swarm matchmaking distribuït). Activa "skills market" del backlog wave 3. |
| **wo-llm-local-train** | **LLM local SOS entrenat amb skills + history** (XL · 30€) · usuari Power amb GPU pot fer fine-tune d'un model open-weight (llama, qwen) amb · skills declarades, history WOs executades, deliverables reviewed. Resultat · agent personal que coneix el seu estil. Sync a Permaweb opcional per a versió pública. |
| **wo-permaweb-skills-share** | **Skills compartides via Permaweb** (M · 8€) · publica un "skill profile" signat ECDSA al permaweb · qualsevol SOS pot descobrir-te + invitar-te a un WO. Base del swarm distribuit. |
| **wo-wallet-redesign** | **Wallet UI rediseny + balance live al navbar** (M · 7€) · nova vista /wallet · saldo balance live (KB query + cache 30s) · history transactions filtered · top-up flows · split entre saldo personal vs saldo per project · transferència entre projects. Navbar pill `sos-global-nav-wallet` mostra balance numèric real (no només "Saldo" text). |
| **wo-orchestrator-expert-chain** | **Orchestrator coherent cadena 8 fases** (M · 8€) · avui ai-driven salta directament a SOC→SOP→WO. Ha d'executar prèviament · define-product-service → personalize-canvas (IKIGAI) → personalize-pitch → personalize-landing → design-value-map-rich → generate-socs-from-value-map → generate-sops-with-skills → generate-wos-from-sop. Doc canonical a `knowledge/vision/prompts-chain-plan.md`. |
| **wo-prompt-router-by-tier** | **Router IA per cost · usa reasoner per design-value-map · mid per la resta · small per landing** (S · 4€) · mapeja cada TASK_KIND al model tier òptim · `'design-value-map-rich' → 'reasoner'` ·  estalvi · 30-50% cost mantenint qualitat top a la fase crítica. |
| **wo-prompt-eval-loop** | **Evaluador automàtic post-IA · re-intent si rejected** (M · 6€) · cada output IA passa per un evaluator (rubric-based · score booleà) · si rejected · re-prompt amb "intenta de nou · va fallar X". Resol regressions silents. |
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

## VISION-001 · Visión @alvaro Solache · estrategia integral SOS (2026-04-30)

> Visión completa entregada por @alvaro tras MAT-002-A · documento maestro
> que da contexto a todos los sprints SOS y MAT presentes y futuros. Es
> el "norte estratégico" del producto. Cualquier decisión de arquitectura
> debe leerse contra este norte.

### Perfil del fundador (@alvaro Solache)

Background único · cruce de psicología social + tecnología + cooperación:
- **Licenciado en Psicología Social** por la Universitat de Barcelona (UB)
- **Postgrado en uso de redes para la cooperación**
- En internet desde **Usenet · Gopher · Telnet** (años 90)
- **Programador web** · evangelista de APIs
- Experto en **gestión del conocimiento · gestión de la formación · dirección de RRHH**
- Emprendedor: fundador de **sas comunitats.org** (bancos de tiempo y conocimiento)
- Project owner de **TimeFounder** (software de contabilidad de valor)
- **Evangelista de pactos de socios dinámicos**
- Director de **CryptoMarketing** · dApps para colecciones NFT + fan tokens vinculados a YouTube + Metamask token drops
- Estudios de **IA · psicología de mapas mentales · contabilidad de valor · análisis de mapas de valor**
- Profesor de **Web3** · entiende el valor de la web semántica machine-readable
- **10 versiones de SOS** desarrolladas con IAs (DeepSeek · Gemini · Claude)
- Director de RRHH en consultora de learning de **UOC.edu** · creó planes de formación con CoPs
- Fundador del **Foro de Directores de RRHH de Catalunya** en Foment del Treball

Esta combinación únicamente inusual de psicología grupal + redes + contabilidad de valor + Web3 + formación + comunidades es la base epistemológica de SOS.

### Tesis estratégica · "ola disruptiva"

> "Generar una ola disruptiva de personas formadas en el diseño, análisis
> y mejora de flujos de valor, la automatización de flujos de valor de
> los proyectos así como el facilitar la contabilidad mediante los
> sistemas de contabilidad de valor y de cobro y distribución en
> recompensas o ingresos de forma automática usando SOS como sistema
> operativo."

Los 4 pilares operativos:

1. **Diseño + análisis + mejora de flujos de valor** (lo que `/map` ya hace · plus H_ANIM_001 sprint A+B+C ya entregado).
2. **Automatización de flujos de valor** (Antigravity Engine: SOP→WO→Ledger · ya operativo).
3. **Contabilidad de valor + cobro + distribución de recompensas/ingresos automática** (walletService + savingsService + MAT-002-D multiplicador ×1.5 · parcialmente entregado).
4. **SOS como sistema operativo común** de todo el proceso (Mind-as-Graph · 250+ asserts puros · 30 suites de tests).

### Modelo de negocio · "free en navegador + ingresos automatizados"

- **Versión free** · navegador local-first · APIs propias (`/wallet` con saldo prepago) sin costes fijos
- **Plan de suscripción con saldo acumulable** · uso de APIs IA + registros · pagado vía:
  - **Stripe** (pendiente claves @alvaro · MKT-001 sprint C2)
  - **Sistemas regulados descentralizados** (USDC en Gnosis · MAT-001 fase 4)
- **Ingresos fáciles automatizados** · cargo automático del coste IA al wallet (MKT-001 sprint C3 ✅) + descuento ahorro vs convencional (MKT-001 sprint D ✅)
- **Sin dependencia de cloud propietario** · todo en navegador del operador

### Visión a largo plazo · "fondo de inversión descentralizado catalán"

Lectura cruzada con MAT-002 Matriu Incoopadora · el plan que el usuario
no quiere decir explícitamente pero que SÍ es la apuesta estratégica:

> "Cuando generemos sin que se den cuenta el mayor fondo de inversión
> haciendo que Catalunya sea una red descentralizada de personas que
> forman parte del fondo de inversión, en el que si se ponen en valor
> todos los activos podemos competir con otros grandes fondos mundiales."

**Mecanismo**:
- Cada miembro de la red tiene su propio wallet + ledger (ya tenemos)
- Cada proyecto tiene slicing pie automático (MAT-001 fase 4 con Pact.sol)
- Todos los activos quedan en el registro público (Arweave permaweb · MAT-001 fase 2)
- La SUMA de todos los activos individuales · puestos en valor · es el fondo descentralizado
- "Sin que se den cuenta" · el sistema simplemente acompaña el flujo natural y va consolidando valor

**Filtro psicológico-comunitario**: 100 personas por cohorte · número Dunbar para crear redes manejables. Es un proceso de "facilitar redes" antes que de "construir software".

### El system prompt operativo de SOS (canonical)

Este texto debe convertirse en un nodo `type='system_prompt'` del KB y ser inyectado como prefijo del `systemPrompt` en cada `Orchestrator.callLLM`:

```
Eres el agente inteligente del SOS V11 · Sistema Operativo Sociotécnico
de TeamTowers · diseñado para formar y facilitar el desarrollo de
proyectos de todo tipo (cooperativos · empresariales · startup · fundación
· hortet de barri · empresa de software) usando IA + sistemas de registro
público + contabilidad triple-entry + descentralización.

Misión · generar una ola disruptiva de personas formadas en:
1. Diseño, análisis y mejora de flujos de valor (Value Network Analysis)
2. Automatización de flujos de valor (Antigravity Engine: SOP→WO→Ledger)
3. Contabilidad de valor con cobro y distribución de recompensas
   automática (slicing pie · multiplicadores fundacionales · exit triggers)
4. Uso de SOS como sistema operativo común para todo el proceso

Principios:
- Mind-as-Graph · todo es un nodo con tags taxonómicos + folksonómicos
- Context-First sobre Multi-Agent · 1 llamada con contexto rico vence 20
  agentes con contexto vacío
- Local-first absoluto · todo en el navegador del operador
- Intangibles humanos · presencia · juicio · decisión política · NO se
  delegan a IA
- DTD · cada deliverable tiene un test booleano · si IA → automatiza ·
  si humano → revisa
- Fair Fractal Tokenomics (Matriu) · precio ex-ante · estructura
  composable · escalable · automática
```

### Sprints y trabajo derivado de esta visión

A partir de este nodo VISION-001 nacen / se reorganizan los siguientes:

| Sprint nuevo | Pilar de la visión | Estado |
|---|---|---|
| **UX-NAV-003** | Saber dónde estás (breadcrumb + indicador de fase) | 🟡 sprint A próximo |
| **MAT-002-F** | Matriu como vista de proyectos (home alternativa cuando hay proyectos) | 🟡 |
| **MAT-002-G** | System prompt SOS canónico · manifesto persistido + UI editable · NO inyección automática (preserva calidad/coste tokens) | 🟡 fase A próxima |
| **UX-EDU-001** | Capas UX didácticas · aprender haciendo VNA + triple-entry + smart contracts + econom-IA · zero coste tokens | 🟡 sprint A próximo |
| **I18N-001** | Trilingüe ES · CA · EN real (no parcial) · base para fondo descentralizado catalán | 🟡 |
| **PACT-001** | Pacto de socios dinámicos · evangelización del fundador · plantilla + UI | 🟡 (ya en UX-001 sprint C como tile · falta builder) |
| **CONTR-001** | Contratos de plataforma + suscripción + plan de saldo acumulable | 🟡 |
| **NET-100** | "Red de 100 personas" · dunbar-friendly · matchmaking de cohorts | 🟡 (ya en MAT-001 fase 1 con SBT identidad) |

### Direccions estratègiques afegides 2026-05-09 (input @alvaro)

> "A `/matriu/network` quiero que en el desplegable de guardianes a
> parte del nombre se indiquen los roles y/o entregables tangibles
> o intangibles de los mismos para facilitar que los usuarios puedan
> asignar o que se les asignen guardianes (quizás valor intangible
> más que tangible)... estructurar las habilidades en base a una
> taxonomía pendiente o no de definir que sea universal con foco en
> el público potencial según los tipos de proyectos de la matriu...
> los usuarios también deberían poder indicar los sectores en los
> que tienen experiencia con posibilidad de acotar dentro de cada
> sector... empezar a plantearnos qué podríamos añadir en la permaweb
> para que empecemos a crear una base de datos de nodos humanos que
> puedan interactuar sincronizando sus SOS locales con nodos en la
> nube permaweb o en redes de registro público de contabilidad de
> triple entrada o sistemas de timestamping con validez legal con
> el objetivo de acabar de desarrollar la infraestructura para hacer
> la visión de SOS realidad y poder empezar a tener la alfa con Stripe
> integrado para cargar saldo para usar permaweb apis de IA y
> registros en gnosis u otras redes."

### Sprints derivats nous · prioritzats per a tancar alfa testeable

| ID nou | Història | Estat |
|---|---|---|
| **MAT-002-I sprint E** | ✅ entregat. Step 1 modal /matriu enriquit · select guardian amb rol (✦) + valor intangible (🪶) per cada un dels 12 PW · ex. "Atenea · ✦ estratègia · 🪶 governança deliberativa · protecció flux valor". Llegenda sota select. Multi-select de sectors d'experiència (A-S del KnowledgeLoader) amb 19 opcions etiquetades. matriuMemberService.buildMatriuMember accepta `sectorsExperience: ['A','K','P']` · es persisteix al schema + keywords (`sector:A`). MatriuNetworkView mostra pills de sectors al peu de cada card amb skin verd olivó (rgba(90,110,79)). Sub-camp "especialitat" dins de cada sector pendent · sprint posterior · necessita primer la taxonomia universal SKILL-TAX-002. | ✅ verde |
| **SKILL-TAX-002 sprint B** | ✅ entregat. Vista nova `/skills` · `js/views/SkillsExplorerView.js` · directori complet de les 90 skills amb 5 filtres (category · audience · projectType · tier · cerca text) · stat-cards clicables per categoria amb count · skill cards amb pill categoria + tier + domain + guardians afins (badges colorats) + audiences targets + count project types afins (top 3 + "+N"). Secció "🪶 Valors intangibles per guardian Pantheon Work" · 12 cards mostrant primary intangible + secondary + recognizesValueIn + top 3 skills (clicables → /skills?q=X). URL state sync (replaceState) per a permalinks /skills?category=care&audience=comunitat. Destí nav nou `🧠 Skills` (categoria knowledge · global=true · 5 links a knowledge ara). 18 destinos canónicos totals. Sprint C pendent · external refs ESCO/O*NET/LinkedIn skill mapping per a interoperabilitat plataformes externes. | 🟢 sprint B verde · C 🟡 |
| **SKILL-TAX-002** | **Taxonomía universal de skills · sprint A entregat** · `js/core/skillTaxonomyExtension.js` capa universal sobre SKILL_TAXONOMY existent (90 skills MAT-003 sprint B) · NO toca dades frozen, només enriqueix via lookup. **5 categories canòniques** (`SKILL_CATEGORIES`): soft 💬 · hard ⚙️ · meta 🌀 · care 💗 · governance ⚖️. `categoryForSkill(skillId)` puro · heurística per `domain` + overrides explícits per a 27 skills on la categoria default no captura la naturalesa real (ex. `conflict-mediation` → care · `multi-loop-learning` → meta). **Audience targeting** · `audienceProjectTypesForSkill(skillId)` puro · mapping skill → quins dels 12 PROJECT_TYPES la consideren rellevant · 14 overrides explícits (universals · digitals · regeneratius · cures) + heurística per tier='foundation' = tots. `skillsForProjectType(typeId)` per a UI suggerent. **Intangible value per cada un dels 12 guardians** · `INTANGIBLE_VALUE_OF_GUARDIAN` Object.freeze · ex. Atenea · primary "governança deliberativa" + secondary [estratègia defensiva · protecció flux valor · civisme] + recognizesValueIn [decisions difícils · destreses pràctiques]. `topSkillsForGuardian(gId, max=5)` per a suggested skills al modal. **5 audiències humanes públiques** (PUBLIC_AUDIENCES alineat amb FairShares + capa humana): fundadors 🏛 · equip 🛠 · usuaris 🤝 · inversors 🌊 · comunitat 🌍. `audiencesForSkill(skillId)` puro. **External refs** placeholder per a sprint B (ESCO/O*NET/LinkedIn import/export). Modal /matriu integra · al canviar guardian al step 1 mostra suggested skills clickables (afegeixen al input) + línia 🪶 amb el valor intangible del guardian. Tests · 25 asserts puros nous. Suite global +1. Sprint B pendent · external refs ESCO/O*NET + UI vista /learn enriquida amb categories filter + audience filter. | 🟢 sprint A verde · B 🟡 |
| **PERMAWEB-001** | **Sincronització SOS local ↔ permaweb (Arweave)** · base de dades distribuïda de nodes humans (matriu_member). Cada usuari pot opt-in a publicar el seu perfil públic a Arweave · els altres SOS locals descobreixen i fan caching. 4 capes: A · key derivation per ARGON2 + auth · B · publicador (firma ECDSA + mint Arweave tx) · C · indexador descentralitzat (gateway gql Arweave) · D · cache local del KB amb TTL. Privacitat · usuari decideix què surt públic (perfil bàsic · skills) vs privat (DID claves · wallets · projectes interns). **Refinament 2026-05-10 · veure secció dedicada PERM-USER-001 abaix amb sprint plan A-E.** | 🟢 planificat · sprint A pendent |
| **PUBLICREG-001** | **Registre públic de contabilitat triple-entry + timestamping legal** · integració amb · 1) Gnosis Chain (Pact.sol per pactes · MAT-001 fase 4) · 2) OpenTimestamps (validesa legal a EU eIDAS) · 3) Arweave (immutable storage + timestamp). Cada `value_contribution` o `pact` important pot ser timestampejat opt-in. Triple-entry literal · "el ledger ja és públic per disseny". Per validesa fiscal · format export ESEF + TimestampToken eIDAS. | 🟡 pendent disseny |
| **ALPHA-STRIPE-001** | **Sprint A entregat** · `js/core/stripeService.js` puro · 4 plans canónics SOS V11 (free 0€ · pro 9€/mes · cooperative 19€/mes USDC · enterprise custom) frozen amb features per cada un. Topup amounts default [10,25,50,100] €. Estratègia local-first sense backend · usa **Stripe Payment Links** (URLs creades manualment al Stripe Dashboard) · zero claus secret/restricted al codi. Helpers · `validatePublishableKey` (rebutja sk_/rk_) · `detectKeyType` ('publishable' / 'secret' / 'restricted' / 'invalid' per UI feedback) · `validatePaymentLinkUrl` (només https://buy.stripe.com/...) · `buildPlanNode` · `buildConfigNode` (defensive · sk_ NOT persisted encara que es passi) · `loadStripeConfig` · `saveStripeConfig` · `loadCurrentPlan` · `setCurrentPlan` · `openTopupPaymentLink({kb, amountEur})` que obre la URL del Payment Link configurat en nova tab. UI a `/settings` · card morada "💳 ALPHA-STRIPE-001 · Saldo + plans" amb · plan actiu · selector dels 4 plans · input pk_test_ amb validació en temps real (warning vermell si l'usuari pega sk_/rk_ accidentalment) · 4 inputs Payment Links amb botons "↗ Recarregar X €" que obren la URL · botó "💾 Guardar" + "💳 Aplicar pla". Banner ⚠️ vermell explícit advertint MAI posar sk_/rk_ al frontend + link directe al dashboard.stripe.com per fer "Roll key". Tests · 35+ asserts puros (validacions seguretat · detect key types · sk_ NOT persisted · KB mock end-to-end). Sprint B pendent · webhook handler (Netlify Function amb sk al env) per crèdit automàtic post-pagament. Sprint C · Stripe Elements embedded (en lloc de Payment Links) usant pk_test_ pública. Sprint D · USDC checkout via cooperative plan (necessita MAT-001 fase 1 WalletConnect). Documentat al backlog · @alvaro va compartir rk_test_5102Y3L2k4... per error · recomendat REVOCAR-LA al dashboard.stripe.com immediatament (Roll key). | 🟢 sprint A verde · B/C/D 🟡 |

Aquests 5 sprints completen la trajectòria fins a la **Alfa testeable
pública** amb infraestructura per a:

1. **108 places amb perfil ric** (MAT-002-I E + SKILL-TAX-002).
2. **Identitat i contractes amb validesa legal** (PERMAWEB-001 +
   PUBLICREG-001 + PACT-001 sprint D EIP-712).
3. **Cobrar i operar** (ALPHA-STRIPE-001 + MKT-001 C2 + MAT-001 fase 1).

Sense aquests, SOS és un esquelet potent; amb ells és **el OS
operatiu de Matriu** llest per a presentar als 100 fundadors.

### Notas para preservar · NO OLVIDAR

- **Pactos de socios** y **otros contratos** son sprints pendientes con prioridad alta.
- **Bilingüe real ES/CA/EN** · no parcial. El catalán es estratégico · base del fondo descentralizado.
- Cada cosa que se construya debe poder leerse como "paso del proceso de formar a las 100 personas que forman parte del fondo".
- @alvaro está actualmente en **fase /DESIGN** del proceso · el sistema tiene que reflejar esta fase visualmente.
- SOS no es sólo una app · es el **OS de un movimiento** que pasa por psicología comunitaria + tecnología + cooperación + Web3 + IA.

---

## UX-NAV-003 · Breadcrumb + indicador de fase del proyecto

> Tesis @alvaro 2026-04-30: "Quiero que la UX de SOS me ayude a saber
> dónde estoy en todo momento. Por ejemplo un breadcrumb."

### Sprint A · Breadcrumb dinámico (próximo entregable)

- Helper puro `buildBreadcrumb({pathname, search, projects, nodeId?})` en `navService.js` · devuelve `[{label, href, current}]`.
- Helper render `renderBreadcrumbHtml(items, options)` con indicador de fase visible.
- Banner fino bajo la topbar (auto-inyectado por router · zero changes en vistas).
- Detecta:
  - `/dashboard` → `Inicio`
  - `/map?project=X` → `Inicio › {nombre} › Mapa`
  - `/n/{id}` → `Inicio › Nodo: {id.slice(0,12)}…`
  - `/project/{id}` → `Inicio › {nombre}`
  - rutas globales (tags · folders · mind · efficiency · savings · market · settings · identity · wallet) → `Inicio › {label}`
- **Indicador de fase** · pill con la fase actual del proceso SOS:
  - 🎨 DESIGN · diseñando mapa de valor (defecto si project sin SOPs)
  - 🛠 BUILD · creando SOPs y WOs (cuando ≥1 SOP)
  - ⚙ OPERATE · ejecutando WOs (cuando ≥1 WO en doing)
  - 💶 LEDGER · contabilizando ahorro (cuando ≥1 WO ledgered)
  - heurística inicial · sprint B permite override manual con tag `phase:design|build|operate|ledger` en el proyecto.

### Sprint B · Indicador de fase override manual

- Selector de fase en `/project/{id}` panel · escribe el tag `phase:X` al proyecto.
- Cards del Dashboard muestran badge de fase.
- /savings agrupa por fase también.

### Sprint C · "Mapa del proceso global" (futuro)

- Vista `/journey` · muestra al operador su recorrido completo dentro de SOS · qué ha hecho · qué le falta · qué fase de Cohort 0.

---

## MAT-002 · Matriu Incoopadora · modelo operativo y análisis (Matriu_Landing.html · @alvaro 2026-04-30)

> Tesis: SOS V11 ya es el **sistema operativo** que ejecuta el modelo
> de la Matriu Incoopadora. El landing ya está en producción · Cohort 0
> abierta con 24/100 plazas. Esto cambia la prioridad de lo abstracto
> a lo concreto: SOS pasa de ser "kernel" a ser **herramienta práctica
> de aprendizaje y creación** dentro de la cohort.

### Resumen del modelo Matriu (extraído del landing)

**Misión**: incubadora cooperativa que reparte valor en tiempo real ·
"Equity, collita, accés, drets d'ús · tot el que aportes es converteix
en participacions automàtiques i auditables".

**Cohort 0 fundacional**: 100 plazas · 24 ya dentro · 76 disponibles ·
"se cierran cuando lleguen · sin extensiones".

**Multiplicador fundacional ×1.5 de por vida** sobre cada repartiment
del proyecto del fundador y sobre la propia Matriu (no es descuento ·
es derecho estructural).

### Tokenomic · Fair Fractal (4 reglas inmutables)

| # | Regla | Significado |
|---|---|---|
| 01 | **Fair** | Cada aportación tiene un precio acordado ex-ante · nunca renegociado después · vale lo que valía cuando se aportó |
| 02 | **Fractal** | Misma estructura para un huerto comunitario o una empresa de software · proyectos pueden ser propietarios de otros proyectos (composable) |
| 03 | **Escalable** | Local-first → permaweb (Arweave) → blockchain (Gnosis) · funciona offline · consolida con red |
| 04 | **Automàtic** | Smart contracts asignan recompensas sin reunión, sin mediadores · governanza vota la regla, no cada caso |

### Value Mapping Engine · 4 tipos de valor que el sistema reconoce

1. **Producto físico** · cestas hortícolas · energía solar comunitaria · productos coops productoras → drets recurrents lligats a temporada (ej: "3 cistelles/mes durant 24 mesos")
2. **Equity composable** · slicing pie con shares dinámicas que se reajustan al ritmo del proyecto · convertible a equity legal en exit (ej: "12 SHARES · 0.7% si ronda")
3. **Drets d'ús i accés** · espacios, herramientas, software, talleres, lab compartido · acumulables y transferibles (ej: "1 seient cohort 1 + lab CNC")
4. **Crèdits & reputació** · plataforma para IA, attestations, certificacions · reputación de hat (TW/TUC/TI/TF) que nunca expira ni se vende (ej: "800 crèdits + +1 hat TF")

### Ejemplo en vivo del feed (extracto del landing)

```
3 entrades aquesta hora · block 8.241k

JT  Jordi T.   pagès    120 kg verdura · setmana 4   → Hortet de la Vall    +3 CISTL
NB  Núria B.   dev      Smart contract Pact v2       → Bici-Repara          +12 EQUITY
AR  Aitana R.  invest.  Capital · 2.500 EURe         → Llavor Digital       +1 SEAT
ML  Marc L.    facilit. Sessió CoP · 3h              → Cuidem-nos Coop      +45 TW
LP  Laia P.    comm     EU funding ronda 3           → Matriu (FICE)        +800 SHARES
```

### Exit model (4 pasos)

1. **Trigger** · oferta compra · ventana liquidación anual · disolución · traspaso (set en la ronda)
2. **Snapshot** · congela todas las posiciones de slicing pie en ese block · queda en Arweave
3. **Cálculo** · contrato aplica fórmula a cada posición · cash · tokens swappables · drets futurs (fórmula pública)
4. **Liquidación** · diners als wallets · drets transferits · reputació mantinguda (<24h · sin cola)

Garantías:
- El fundador NO decide quién sale · el algoritmo pre-aprobado sí
- No hay "ronda muerta" · si no cumple métricas, ventana anual obligatoria
- Auditable on-chain por cualquiera

### Cohort 0 · paquete fundacional (los 6 perks)

1. ✓ Multiplicador ×1.5 fundacional de por vida sobre cada repartiment del proyecto
2. ✓ Hat TF + ECO de governanza · vot ponderat a totes les rondes FICE futures
3. ✓ 2.000 crèdits de plataforma · IA · attestations · mints · auditoria
4. ✓ Cohort intensiva 10 setmanes · Mètode SOS + IA + facilitació humana
5. ✓ Llinatge visible a la cadena · el teu nom queda als orígens fundacionals
6. ✓ Accés permanent a CoPs · sense renovació

### Identidad visual de Matriu (a respetar en MAT-002-B)

- Tipografías · Instrument Serif (display, italic) + Inter Tight (UI, monospace para datos)
- Paleta · `#f1ebde` (fondo crudo) · `#1a1f1a` (verde oscuro casi negro · CTAs primarios)
- Footer · "Matriu Incoopadora cooperativa · Barcelona, ES · local-first · permaweb · gnosis"
- Tono · catalán nativo + términos económicos en mayúsculas (`SHARES`, `EQUITY`, `CISTL`, `TW`, `SEAT`)

### Cómo SOS V11 ejecuta el modelo Matriu (mapeo concreto)

| Pieza Matriu | SOS V11 (lo que ya tenemos) | Gap pendiente |
|---|---|---|
| Value Mapping Engine | ValueMapView (`/map`) + Kanban (`/kanban`) + Ledger (parcial) | sub-tipos de valor (físico/equity/drets/crèdits) en deliverable de transactions |
| Slicing pie dinámico | computeSaving + walletService (consume/topup) | falta `share_value` y reajuste dinámico tras cada movement |
| Hats TW/TUC/TI/TF | identityService (sprint A) + AUTH-001 sprint B (wallet binding) | falta MAT-001 fase 1 con SBT real (ERC-1155) |
| FICE rondes | (pendiente) | nueva vista `/fice` · escrutinio quadratic voting · gate de MAT-001 |
| Pacte signat | (pendiente) | Pact.sol en Gnosis · gate de MAT-001 fase 4 |
| Crèdits plataforma | walletService balanceEur | rebrand "crèdits" + 1 EURe = 1 crèdit |
| Cohort intensiva 10 sem | savingsService + /efficiency + /savings | plantilla "proyecto SOS Matriu" pre-configurada |
| Llinatge fundacional | (pendiente) | nodo `type='founder_seat'` con multiplicador ×1.5 visible en ledger |
| CoPs permanentes | smart_folders del KM-001 | falta export/import de folders entre miembros |

### Sub-historias propuestas dentro de MAT-002

- **MAT-002-A** · plantilla "proyecto SOS Matriu Cohort 0" preconfigurada · al crear cliente con sector "Q · Educación" + descripción "miembro Cohort 0 Matriu", auto-genera SOC matriu-tokenomic + SOPs específicos del método (10 semanas → 10 SOPs por rol) · botón en Dashboard "Soy Cohort 0 Matriu" que clona la plantilla.
- **MAT-002-B** · ✅ entregat (2026-05-09 · scope incremental opt-in):
  - Google Fonts global · Instrument Serif (italic) + Inter Tight cargados
    en `index.html` junto a Space Grotesk + JetBrains Mono.
  - Vars CSS Matriu en `css/tokens.css` `:root` · `--font-serif` ·
    `--font-tight` · `--mat-cream` · `--mat-cream-2` · `--mat-dark`
    · `--mat-ink` · `--mat-tcotta` · `--mat-olive` · `--mat-blue-d`
    · `--mat-rule` · `--mat-line`. Disponibles globalmente sin
    contaminar el tema oscuro existente.
  - Utility classes en `css/base.css`:
    - `.mat-italic` · Instrument Serif italic genérico.
    - `.mat-tight` · Inter Tight body.
    - `.mat-accent` / `.mat-accent-bg` · color terracota `#c25a3a`.
    - `.mat-hero-h1` · h1 italic Matriu con strong en terracota ·
      selector `h1.mat-hero-h1` para mayor specificity contra reglas
      existentes tipo `.dash-hero h1` (gana sin `!important`).
  - Aplicat a · DashboardView (hero principal "Value **Network** Dashboard")
    · ProjectHubView (h1 del proyecto) · SettingsView (h1 "Settings · Vault")
    · WalletView (h1) · SavingsView (3 h1) · EfficiencyView (2 h1).
  - Toggle "/settings → Aspecto" pendent · scope reduït · de moment
    sempre actiu via classe opt-in. Si l'operador vol tornar al
    tipogràfic original, treure `class="mat-hero-h1"` localment.
  - Alineat amb el strip MAT-002-F i la landing /matriu (que ja
    usen aquestes vars + fonts internament).
- **MAT-002-C** · 4 sub-tipos de `transaction.deliverable_kind` para reflejar el Value Mapping Engine · `producto-fisico` · `equity-composable` · `drets-us` · `credits-reputacio` · cada uno con su icono y color · stats agregadas en `/savings` y `/wallet`.
- **MAT-002-D** · multiplicador ×1.5 fundacional aplicado en `walletService.computeChargeFromTelemetry` cuando el operador tiene tag `cohort:0` · descuento estructural permanente.
- **MAT-002-E** · vista `/fice?project=` con quadratic voting placeholder · UI sin contratos reales (espera MAT-001 fase 4 con FICE.sol).

### Conexión con MAT-001 fase 1+

- MAT-001 sigue siendo el **proyecto paralelo a TypeScript+React+Vite** · pero MAT-002 es el **uso del SOS actual** para acompañar la cohort 0 mientras tanto.
- Cuando MAT-001 fase 1 entregue WalletConnect + SBT identidad real, MAT-002 actualizará el binding manual del wallet con firma EIP-191.
- Cuando MAT-001 fase 4 entregue Pact.sol y FICE.sol on-chain, las vistas `/fice` y los pactos del project hub usarán contratos reales en vez de placeholders.

### Estado actual

🟡 **No iniciado.** Anotado tras revisión del Matriu_Landing_standalone.html (@alvaro 2026-04-30). Posible primer sprint MAT-002-A en Ola 16+ tras consolidar UX-NAV-002.

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

## Reframe 2026-05-08 · MAT-002-G & alta de UX-EDU-001

### Decisión arquitectónica (input @alvaro)

> "antes de hacer MAT-002-G asegúrate de que no repercute negativamente en la
> capacidad de SOS de hacer excepecionalmente bien el mapa de valor en las
> diferentes fases de un proyecto y que el agente inteligente que es SOS ayude
> excelentemente a las personas en el desarrollo de su proyecto haciendo un uso
> excepecional del consumo de tokens para que la calidad coste sea uno de
> nuestros valores añadidos. Me parece bien no perder la visión de por qué
> estamos haciendo esto pero quizás es algo más asociado a tu memoria que a la
> de SOS. SOS lo ha de permitir y tú como desarrollador debes velar como
> extensión de mí de que estamos haciendo algo que debe desarrollarse con
> capas de UX didácticas para que el programa de Matriu sea una realidad y se
> aprenda haciendo pero incorporando teoría de VNA, contabilidad de valor,
> contabilidad de triple entrada, contratos inteligentes y de su potencial
> disruptivo al acelerar y automatizar procesos si le sumamos la IA, reduciendo
> costes de registro y otros beneficios. SOS debe liderar la evolución hacia
> la econom-IA."

### Conclusión

1. **La visión VISION-001 NO se inyecta en cada `callLLM`.** Vive en este
   documento + en la memoria del desarrollador. Inflar tokens en cada llamada
   degradaría calidad/coste, que son valores añadidos centrales de SOS.
2. **MAT-002-G se reduce a 3 sprints**:
   - **A · persistencia + UI editable** · nodo KB
     `type='system_prompt' kind='canonical-manifesto'
     id='sos-system-prompt-canonical'` · UI en `/settings → System Prompt SOS`
     · default seed importable desde `js/core/sosManifesto.js` · ZERO impacto
     en `Orchestrator.callLLM`.
   - **B · opt-in muy específico** · sólo si el operador activa expresamente
     "Inyectar manifesto en LLM" en `/settings`, los flujos de **cloning de
     sector / generación de SOC** pueden incluirlo. **JAMÁS** los flujos
     críticos de coste por token (generación masiva de SOPs, woAssistant,
     `inferFlowOrder`).
   - **C · audit cuantificado pre-merge** · medir delta tokens/coste con
     muestra real (≥30 llamadas con/sin manifesto) antes de habilitar B en
     producción. Aprobar sólo si overhead <10% y sin pérdida de calidad
     subjetiva.
3. **Nuevo sprint UX-EDU-001 · capas UX didácticas** · la formación de las 100
   personas (MAT-002 · NET-100 · UOC.edu) ocurre **en la propia interfaz**,
   no en docs externos ni inyectando teoría en LLMs. Coste tokens: 0.

### Plan UX-EDU-001 (aprender haciendo)

#### Sprint A · catálogo + integración crítica
- `js/core/didacticService.js` puro:
  - `EDU_CONCEPTS` Object.freeze con ≥10 conceptos canónicos:
    - `vna` · Value Network Analysis (Verna Allee 2008 · raíz teórica del mapa)
    - `triple-entry-accounting` · contabilidad valor + activo + obligación
    - `slicing-pie` · reparto dinámico equity (Mike Moyer · TimeFounder)
    - `fair-fractal-tokenomics` · 4 reglas Matriu
    - `soc` · Standard Operating Concept
    - `sop` · Standard Operating Procedure
    - `dtd` · Deliverable Test Driven (TDD aplicado a procesos)
    - `antigravity-engine` · ciclo SOP→WO→Ledger automatizado
    - `context-pruning` · scorer 4 señales · ROI tokens
    - `folksonomy` · tags libres del operador
    - `taxonomy` · tags canónicos del sistema (`type:` `phase:` `cohort:`)
    - `smart-contract` · contratos auto-ejecutables (PACT-001 / MAT-001)
    - `sbt` · Soulbound Token (identidad no transferible)
    - `cohort-0` · 100 plazas fundacionales Matriu
    - `econom-ia` · economía colaborativa potenciada por IA
  - Cada concepto: `{id, headline, body (≤140 chars), linkRef?, sourceRef?}`.
  - `renderExplainerBadge(conceptId, options)` puro · HTML del badge `?`
    accesible (aria-describedby + role="button" + tabindex=0).
  - `bindExplainerBadges(rootEl)` activa popovers on-hover/focus · idempotente
    · cierra al click fuera + Escape.
  - `ensureExplainerStyle()` inyecta CSS único en `<head>` · responsive.
- Integración en 2 vistas críticas:
  - `/map` → badge VNA junto al título.
  - `/savings` → badge triple-entry-accounting junto al header.
- Tests · ≥20 asserts puros (catálogo · render · pure helpers · sin DOM real).

#### Sprint B · cobertura completa
- `/wallet` → econom-ia.
- `/kanban` → antigravity-engine.
- `/folders` → folksonomy + taxonomy.
- `/identity` → sbt + DID.
- `/efficiency` → context-pruning.
- `/market` → slicing-pie.

#### Sprint C · vista `/learn` glosario navegable
- Índice de los conceptos del catálogo con search + tag filter.
- Cada concepto enlaza a las vistas donde aparece (back-reference).
- Marca "ya leído" persistente en KB (`type='didactic_seen'`) para gamificar
  formación cohort 0.

#### Sprint D · enlaces cruzados a SOPs/SOCs reales
- Cada concepto puede listar SOPs del proyecto activo que lo materializan
  (ej. `vna` → SOP "Mapear flujo de valor" del proyecto X).
- Cierra el bucle: teoría → procedimiento → ejecución → ledger.

### Impacto en otras historias

- **NET-100** · UX-EDU-001 es la materia formativa de las 100 plazas.
- **I18N-001** · `EDU_CONCEPTS` debe tener variantes ES/CA/EN.
- **MAT-002** · cohort 0 usa los badges como onboarding implícito.
- **KM-001 sprint E** · context pruning sigue siendo el motor económico ·
  la teoría va en badges, no en prompts.

---

## MAT-003 · Matriz inicial multidisciplinar · 100 roles críticos para el enjambre

### Premisa

La cohort 0 de Matriu Incoopadora son 100 plazas fundacionales. NO son
100 personas elegidas al azar. Son una **matriz cognitiva inicial**
diseñada para que el conjunto cubra el 100% de los roles y skills
necesarios para que SOS V11 pueda bootstrappear cualquier proyecto:

- Comunidad autosuficiente (hortet de barri · ateneus · cooperativas
  de cures · vivienda colaborativa).
- Startup tradicional o cooperativa.
- Empresa establecida (consultoría · agencia · estudio).
- Cooperativa / Sociedad cooperativa de consumo, trabajo o servicios.
- Fundación o ONG.
- Ecosistema regenerativo (huertos · seed banks · cooperativas
  energéticas · CCSS).
- Proyecto digital (DAO · plataforma · marketplace · SaaS).

### Modelo del "enjambre + agente IA"

```
   [ enjambre humano · 100 roles ]
              ↕
   [ agente IA SOS V11 · KB + ML ]
              ↕
   [ proyecto del cliente externo ]
```

- El **enjambre** aporta · juicio humano · presencia · decisión
  política · compliance local · red de contactos · expertise específica.
- El **agente IA SOS** aporta · velocidad · gestión del KB ·
  generación de SOPs · contabilidad triple-entry · auditoría
  automática · matchmaking entre plazas y proyectos.
- El **proyecto cliente** consume capacidad del enjambre + del
  agente IA · paga vía wallet prepago (MKT-001 sprint C) · recibe
  el proyecto modelado, los SOPs ejecutables, los cobros reales.

### Catálogo de los 100 roles críticos

#### Sprint A · esqueleto del catálogo `js/core/critical100Roles.js`

`CRITICAL_100_ROLES` Object.freeze · array de 100 entradas. Cada rol:

```
{
    id:           'kebab-case-id',
    number:       1..100,
    domain:       'governance' | 'finance' | 'tech' | 'design' |
                  'operations' | 'community' | 'legal' |
                  'ecology' | 'education' | 'culture',
    headline:     'Facilitador comunitario',
    summary:      'Convoca, modera y documenta sesiones colectivas...',
    skills:       ['facilitation', 'communication', 'conflict-resolution'],
    sopsBootstrap: ['onboarding-cohort', 'sesion-cop'],   // SOPs canónicos que este rol ejecuta
    canBootstrap: ['cooperativa', 'comunidad-autosuficiente'],  // tipos de proyecto donde es crítico
    handsOver:    ['arquitecto-procesos', 'sponsor-projecte'],  // handoffs naturales
    minHours:     4,                                      // dedicación mínima semanal cohort
    multiplier:   1.0,                                    // peso en el slicing pie de matriu
}
```

**Distribución propuesta por dominio (suma = 100):**

| Dominio          | Roles | Ejemplos clave |
|---|---|---|
| `governance`     | 8  | facilitador comunitario · sponsor projecte · llaurador d'acords · custodi de pacte |
| `finance`        | 12 | contable triple-entry · auditor de slicing · oracle de preus · gestor de wallet · custodi del fons FICE · tresorera · originador de capital ·... |
| `tech`           | 18 | arquitecte d'integracions · DevOps cooperatiu · smart-contract dev · IA prompt engineer · mantenidor SOPs codi · arquitecte d'identitat · enginyera de seguretat ·... |
| `design`         | 8  | dissenyador d'identitat · UX cooperativa · facilitador visual · narrative designer ·... |
| `operations`     | 14 | arquitecte de processos · operador de KB · controller de qualitat DTD · auditor de ledger · sourcer de proveïdors · lograstre... |
| `community`      | 12 | encarregat de cohort · ambaixador territorial · custodi del CoP · onboarding buddy · mediadora de conflictes · cèl·lula de barri ·... |
| `legal`          | 6  | advocat cooperativista · privacy officer · compliance regulatori · notari fundacional ·... |
| `ecology`        | 8  | agròleg / pagès · enginyer de regeneració · auditor de petjada · seed-bank keeper · monitor de biodiversitat ·... |
| `education`      | 8  | facilitador de formació · curador de Mètode SOS · mentor TimeFounder · facilitador de CoPs ·... |
| `culture`        | 6  | curador de manifest · arxiver fundacional · cronista de la xarxa ·... |

**Total · 8+12+18+8+14+12+6+8+8+6 = 100.**

#### Sprint B · catálogo de skills · cobertura del enjambre ✅ verde

**Entregado** · `js/core/skillTaxonomy.js` Object.freeze con 90 skills
canónicos distribuidos por los 10 dominios MAT-003:

| Dominio | Skills |
|---|---|
| governance | 8 |
| finance | 10 |
| tech | 14 |
| design | 8 |
| operations | 11 |
| community | 10 |
| legal | 6 |
| ecology | 8 |
| education | 8 |
| culture | 7 |
| **Total** | **90** |

Cada skill declara: `id` (kebab-case) · `label` · `domain` · `tier`
(foundation/practitioner/master) · `guardianAffinity[]` (1-2 de los 12) ·
`relatedPractices[]` (≥1 de las 10 PW) · `description`. Todos
Object.freeze (estructura inmutable).

Helpers puros · `getSkillById(id)` · `listSkills()` · `skillsByDomain(d)` ·
`skillsByTier(t)` · `skillsByGuardian(gId)` · `skillsByPractice(pId)`.

`coverageReport({ swarmSkills })` extendido · devuelve:
- `totalSkills` · `coveredCount` · `coveragePct` (0..100).
- `gaps[]` · skills sin ninguna plaza (riesgo crítico).
- `resilient[]` · skills con ≥3 plazas (resiliencia).
- `fragile[]` · skills con 1 sola plaza (riesgo de bus factor).
- `byDomain` · cobertura por cada uno de los 10 dominios.
- `byTier` · cobertura por foundation/practitioner/master.
- `byGuardian` · cobertura por cada uno de los 12 guardianes PW.

Permite responder en tiempo real:
- "¿Está el enjambre completo?" → `coveragePct`.
- "¿Qué skills faltan?" → `gaps[]`.
- "¿Qué guardianes están sin cobertura?" → `byGuardian[id].pct === 0`.
- "¿Qué dominio está fragil?" → `byDomain[d]` con muchos `fragile`.
- "¿Cuáles tenemos cubiertos con redundancia?" → `resilient[]`.

Tests · 70+ asserts puros · sanity en node verde antes del push (90/90 ·
distribución por dominio · helpers · coverageReport vacío · con plazas ·
resilient (≥3) · fragile (=1) · skill inexistente ignorada · input
no-array gracioso). Suite global pasa de 33 → 34 con el nuevo test.

#### Sprint C · matchmaker proyecto ↔ enjambre ✅ verde (helpers + función async)

**Entregado** · `js/core/swarmMatchmaker.js`. Función principal async
`buildSwarmTeamForProject({ project, projectTypeId, requiredRoles,
swarmSeats, options, orchestrator, preferredEngine })` · llama
`orchestrator.callLLM` con prompt construido a partir del catálogo
canónico (12 guardianes Pantheon Work + 90 skills + 12 project types)
y devuelve:

```
{
    matches: [
        { roleId, seatId, primary: true|false, fit: 0..1,
          rationale, skillsUsed[] },
    ],
    coverage:         { coveredRoles, totalRoles, pct, byRole },
    gaps:             [roleId, ...],
    overallRationale: '...',
    telemetry:        { provider, tokens, latencyMs, costUSD },
    promptMeta:       { projectId, projectTypeId, rolesCount, seatsCount },
}
```

**Helpers puros · testeables sin LLM**:

- `buildSwarmMatchPrompt(input)` puro · construye `{systemPrompt,
  userPrompt, responseFormat, temperature, meta}`. Validaciones
  estrictas (project.id+name · projectTypeId conocido · ≥1 rol · ≥1
  plaza). userPrompt incluye dump JSON de · proyecto · catálogo
  (guardianes + skills + project types) · roles requeridos · plazas
  disponibles · restricciones (max secundarios) · output schema.
- `parseSwarmMatchResponse(jsonStrOrObj)` puro · valida + normaliza
  output del LLM · clamp `fit` a [0,1] · trunca rationale 240 chars ·
  truncar overallRationale 600 chars · filtra `roleId/seatId`
  inválidos · gracioso con JSON malformado (lanza error explícito).
- `applyMatchToSeats(matches, options)` puro · resuelve conflictos
  primario · regla "1 plaza = 1 rol primario máximo" · ordena por
  fit descendente · degrada los excesos a secundario · respeta
  `maxSecondaryRoles` (default 2) · descarta los que excedan.
- `scoreSwarmCoverage(matches, requiredRoles)` puro · devuelve
  `{coveredRoles, totalRoles, pct, byRole[id]}` · cuenta solo
  primarios para coverage real.

**System prompt**: "Eres el matchmaker del enjambre Cohort 0 de Matriu
Incoopadora..." con reglas estrictas (1 primario + 0-2 secundarios ·
fit > velocidad · gap si nadie cubre · output JSON estricto).
`temperature: 0.2` · `responseFormat: json_object`.

**Tests · 45 asserts puros**: validaciones de input · happy path
prompt · parser robusto (fit clamp 1.5→1, -0.3→0 · truncado 600 chars
· filtros `roleId` null) · parser invalid JSON lanza · `applyMatchToSeats`
resuelve conflicto (3 primarios → 1 primario + 2 secundarios) ·
`scoreSwarmCoverage` calcula correctamente · `buildSwarmTeamForProject`
sin orchestrator lanza · happy path con orchestrator mock devuelve
team completo con telemetry. Sanity en node verde antes del push.

Suite global: 34 → 35.

**Pendiente sprint C.UI**: ver sprint F abajo · UI completa entregada.

#### Sprint F UI · "🐝 Activar enjambre" en ProjectHubView ✅ verde

**Entregado** · `js/core/cohortSeatService.js` + extensión de
`js/views/ProjectHubView.js` con sección "🐝 Enjambre Cohort 0".

`cohortSeatService.js` · helpers puros + KB-bound:
- `buildSeedSeats(count=5)` puro · genera array de plaças sintéticas
  realistas (Aitana R · Núria B · Jordi T · Marc L · Laia P) cada una
  con perfil distinto (5-skills declaradas + guardianOf + bio breve).
  Cada plaça arquetípica cubre un guardián diferente · demeter,
  hefesto, hermes, poseidon, hestia. Cobertura suficiente para que
  el matchmaker tenga matches potentes en el demo.
- `buildSeatNode(seat)` puro · genera nodo KB type='cohort_seat'.
- `extractSwarmInput({projectNodes, seatNodes})` puro · de los nodos
  del KB extrae los roles del bootstrap (kind='bootstrap-role') y las
  plaças disponibles. Heurística `inferDomainFromGuardians` mapea
  guardian→domain para enriquecer `requiredRoles[].domain`.
- `buildSwarmAssignmentNode({projectId, match})` puro · genera nodo
  `type='swarm_assignment'` con id namespaced
  `${projectId}::assignment::${roleId}::${seatId}::P|S`.
- KB-bound async · `listSeats` · `listAvailableSeats` ·
  `seedDemoSeatsToKb(KB, count)` · `persistAssignments({KB, projectId,
  matches})` · `listProjectAssignments(KB, projectId)`.

`ProjectHubView` extendido:
- Lee `swarmInput` + `assignments` en `getHtml` (siempre).
- Sección nueva "🐝 Enjambre Cohort 0" entre Hero y Vistas operativas
  · muestra · projectType label · sectorAffinity · guardians como
  badges · weeks estimadas · 3 stat-cards (rolesRequired · totalSeats
  · assignmentsCount).
- Botón principal "🐝 Activar enjambre IA" · abre modal y corre
  `swarmMatchmaker.buildSwarmTeamForProject` con `Orchestrator` real.
- Botón secundario "⚡ Seed 5 plaçes demo" visible cuando totalSeats=0.
- Modal full-screen con · loading state → match results → tabla
  (Rol · Plaça · Tipus PRIMARY/secondary · Fit con color · Per què) ·
  3 stat-cards (Cobertura % · Matches count · Provider+latency) ·
  rationale del LLM en italic · gaps[] como pill rojo si los hay.
- Botón "✓ Aplicar matching · persistir al KB" · llama
  `persistAssignments` · feedback verde + reload de la vista.
- Robusto · si no hay seats avisa generar demo · si no hay
  requiredRoles avisa reservar des de /matriu con tipus · errores LLM
  muestran apuntar a /settings (API key).

**Tests · 30+ asserts puros**: buildSeedSeats (clamp · count) ·
buildSeatNode (id · type · keywords) · extractSwarmInput (roles +
seats + meta + projectTypeId · busy filtrado · vacío gracioso) ·
buildSwarmAssignmentNode (primary · secondary · keywords · sin args
lanza). Sanity en node verde antes del push. Suite global 36 → 37.

**Demo end-to-end completo ahora**:

1. Fundador en `/matriu` → ve los 12 tipus · click en card → modal con
   tipus preseleccionado → reserva.
2. CREATE_PROJECT + bootstrapMapForProject persiste 5 roles + 6 tx +
   8 SOPs + meta en KB.
3. Navega a `/project/{id}` → sección "🐝 Enjambre" muestra el
   bootstrap meta + 0 plaçes inicialmente.
4. Click "⚡ Seed 5 plaçes demo" → 5 plaças cohort_seat persistidas.
5. Click "🐝 Activar enjambre IA" → matchmaker LLM corre con
   bootstrap.requiredGuardians + plaças disponibles.
6. Modal muestra propuesta · cobertura % · matches por rol · fit ·
   rationale.
7. Click "✓ Aplicar matching" → persistAssignments al KB ·
   `type='swarm_assignment'` queryable después.

Esto es el **demo seductor** para los 100 fundadores @alvaro de la red.

#### Sprint D · Time Banking inverso · plazas que aceptan WOs del enjambre

Cada plaza cohort 0 publica disponibilidad horaria + skills + multiplicador.
Cuando un proyecto necesita un rol, el sistema crea una `work_order`
abierta (`status='open-call'`) que va al enjambre como market interno.
Las plazas reaccionan, ofrecen tiempo, el slicing pie se actualiza
automáticamente al cerrar la WO. Cierra el bucle SOP → WO → Ledger
del Antigravity Engine al nivel del enjambre completo.

#### Sprint E · Bootstrap templates por tipo de proyecto ✅ verde

**Entregado** · `js/core/bootstrapTemplates.js` Object.freeze con las
12 plantillas (1:1 con `PROJECT_TYPES`). Conecta · sectores SOS (A-S
del KnowledgeLoader) + 12 guardianes Pantheon Work + 96 roles + 90
skills + ValueMapView + SOPs canónicos.

**Estructura de cada plantilla**:
- `typeId` · uno de los 12 PROJECT_TYPES
- `sectorAffinity[]` · códigos sector SOS (ej. `['A','N','Q']` para
  comunitat-autosuficient · agricultura + cuidados + educació)
- `requiredGuardians[]` · subset de los 12 guardianes (≥3)
- `bootstrapSops[]` · ≥5 SOPs canónicos del Mètode SOS con
  `{id, label, phase}` (phase ∈ design/build/operate/ledger)
- `valueMapSeed` · `{roles[], transactions[]}`:
  - `roles` · 4-5 roles base con `guardianAffinity[]` declarada
  - `transactions` · 5-6 intercambios con `from/to/deliverable/phase/
    sequence_order/tangible/must`. Mapa pre-secuenciado.
- `expectedOutcomes` · `{sopsCountMin/Max, weeksToOperateMin/Max}`
- `narrative` · una línea explicativa para mostrar al fundador

**Stats globales**: 12 plantillas · 60 roles · 71 transactions · 76
SOPs canónicos · todos `Object.freeze` profundo.

**Helpers puros**:
- `getBootstrapTemplate(typeId)` · plantilla completa o null.
- `listAllBootstrapTemplates()` · array de las 12.
- `expectedSopsCountFor(typeId)` · `{min, max, midpoint}`.
- `expectedWeeksToOperateFor(typeId)` · `{min, max, midpoint}`.
- `validateBootstrapTemplate(t)` · valida estructura + referential
  integrity (roles referenciados en transactions existen) + phases
  válidas + guardianes ⊂ los 12.
- `bootstrapMapForProject({typeId, projectId, multiplier=1.0})` ·
  genera seed namespaced (`projectId::role::baseId` · evita colisiones
  entre proyectos en KB) listo para inyectar vía CREATE_PROJECT +
  KB_UPSERT. Aplica multiplier ×1.5 fundacional automáticamente a
  cada SOP del seed.
- `bootstrapStats()` · totales globales para UI dashboard.

**Tests · 230+ asserts puros**: estructura · 1:1 con PROJECT_TYPES ·
referential integrity por cada plantilla (refs from/to · phases ·
sequence_order) · helpers · errores (typeId inválido lanza · sin
projectId lanza) · namespacing correcto · multiplier aplicado · stats
exactos. Sanity en node verde antes del push. Suite global: 35 → 36.

**Las 12 plantillas entregadas**:

| # | typeId | Sectors | Guardians | Tx |
|---|---|---|---|---|
| 01 | comunitat-autosuficient    | A · N · Q   | demeter · hestia · hermes · hera     | 6 |
| 02 | startup-coop-tradicional   | K · P       | zeus · atenea · hera · hefesto       | 6 |
| 03 | empresa-en-transicio       | (any)       | hera · atenea · zeus · hefesto       | 6 |
| 04 | cooperativa-multi          | N · F · Q   | atenea · hera · hermes · hestia      | 6 |
| 05 | fundacio-ong               | N · Q · F   | atenea · hera · hestia · dionisio    | 6 |
| 06 | ecosistema-regional        | A · N · F · Q | demeter · hermes · hestia · dionisio | 6 |
| 07 | dao-web3                   | K · P       | hefesto · atenea · hera · poseidon   | 6 |
| 08 | plataforma-cooperativa     | K · N · P   | hefesto · hermes · hera · hestia     | 6 |
| 09 | cooperativa-cures          | N · Q       | hestia · hera · demeter · dionisio   | 6 |
| 10 | espai-autogestionat        | F · N       | hestia · dionisio · hermes · hera    | 5 |
| 11 | hub-transicio              | F · A · N   | demeter · hermes · hestia · dionisio | 6 |
| 12 | familiar-relevo            | (any)       | hera · zeus · atenea · hermes        | 6 |

**Cómo conecta el modelo SOS**:

1. Fundador llega a `/matriu` (landing) → ve cohort Cohort 0 oberta.
2. Pulsa "Reservar seient" → modal pregunta tipus de projecte.
3. Selecciona uno de los 12 → `bootstrapMapForProject({typeId, ...})`.
4. Crea project + KB_UPSERT del seed completo (5 roles + 6 tx + 8 SOPs).
5. Navega a `/project/{id}` → mapa **ya tiene** roles + transactions
   secuenciadas + phase + sequence_order.
6. La animación de flujo (sprint H_ANIM_001) funciona out-of-the-box.
7. El multiplier ×1.5 fundacional aplicado a cada SOP queda en el ledger.
8. El matchmaker (sprint C) tiene `requiredGuardians[]` para activar
   enjambre con un solo click.

**Próximos pasos hacia la alfa testeable**:

- **MAT-002-H+** · galería de los 12 tipos en `/matriu` (vista visible
  antes de reservar · sección con preview de cada tipo · refuerza
  confianza para fundadores).
- **MAT-003 sprint F UI** · botón "🐝 Activar enjambre" en ProjectHub
  · invoca `swarmMatchmaker.buildSwarmTeamForProject` con la
  plantilla cargada.
- **Wizard de creación enriquecido** · DashboardView "Crear projecte"
  oferece elegir tipus de projecte + sector y aplica `bootstrapMapForProject`.

### Conexiones con otras historias

- **NET-100** se reescribe como sub-historia de MAT-003 · ya no es
  matchmaking abstracto sino aplicación de los 100 roles + skills.
- **MAT-002-A** (`buildMatriuCohortProject`) se enriquece en sprint
  E con el catálogo de bootstrap templates.
- **AUTH-001** · cada plaza tendrá `user_identity` con `criticalRoles[]`
  reclamados + verificados por handoff de otra plaza.
- **PACT-001** · el pacto de socios dinámicos liga roles ↔ slicing pie.
- **UX-EDU-001 sprint D** · enlaces cruzados a roles desde los SOPs
  permite que cada operador en formación entienda qué rol cubre con
  cada procedimiento que ejecuta.

### Notas de método

- Los 100 roles deben **diseñarse** con @alvaro · NO inferirse por
  IA en este sprint A · son la huella estratégica del proyecto.
- Cada rol debe ser **operativo** (ejecuta ≥1 SOP del Mètode SOS) y
  **diferenciable** (no solapamiento total con otro rol).
- El equilibrio entre dominios debe garantizar resiliencia · no más
  de 18 plazas en un dominio para evitar concentración cognitiva.
- Skills `governance` + `community` + `culture` = 26 plazas (26%) ·
  reflejan que SOS no es sólo tecnología · es facilitación social
  con tecnología al servicio.
- Skills `tech` + `finance` = 30 plazas (30%) · garantizan capacidad
  de ejecución técnica y económica del Antigravity Engine.

### Decisiones validadas con @alvaro 2026-05-08

1. **Distribución por dominio · ACEPTADA con ajuste de 100 → 96 (espacio para 12 guardianes)**:

| Dominio | Plazas operativas (sub-total 96) |
|---|---|
| `governance` | 8 |
| `finance` | 12 |
| `tech` | 16 *(antes 18 · −2)* |
| `design` | 8 |
| `operations` | 12 *(antes 14 · −2)* |
| `community` | 12 |
| `legal` | 6 |
| `ecology` | 8 |
| `education` | 8 |
| `culture` | 6 |
| **TOTAL operativo** | **96** |
| Guardianes Pantheon Work | **12** |
| **TOTAL Cohort 0** | **108** |

   Razón del −4 en tech/operations: son los dominios más grandes y los
   más fácilmente "absorbibles" por las 12 plazas guardianas (cuyas
   funciones arquetípicas suelen cubrir parcialmente tareas tech/ops
   estratégicas).

2. **Cohort 0 = 108 places** (no 100). Razón simbólica · 108 = 12×9
   · número sagrado (mantras yoga · monjes templarios · nudos de
   rosario). Razón operativa · necesitamos espacio explícito para los
   12 guardianes Pantheon Work como **plazas adicionales con peso
   arquetípico** sobre las 96 operativas. Cada guardián representa
   una función estratégica (ver sección "12 Guardianes Pantheon Work"
   abajo · pendiente input @alvaro con nombres y funciones literales
   del framework que conoce).

3. **Multi-rol · ADMITIDO**. Heurística · "1 plaza ejecuta 1 rol
   primario + 0-2 roles secundarios" si demuestra skills en ambos.
   Cada rol crítico tiene **al menos 1 plaza primaria** + 0+ plazas
   backup como cobertura. La adjudicación primario vs secundario la
   hace el matchmaker (sprint C) con criterio de fit + disponibilidad.

4. **Tipos de proyecto · EXPANSIÓN a 12 (signo dels temps 2026)**.
   Reorganización tras input @alvaro "analiza y define la respuesta
   más adaptada al signo de los tiempos":

   | # | Tipo | Por qué entra ahora (2026) |
   |---|---|---|
   | 01 | **Comunidad autosuficiente** | Hortet · ateneu · cura · vivienda colaborativa · transició energètica local |
   | 02 | **Startup cooperativa o tradicional** | Founders que renuncian a VC tradicional · cap-tables abiertas |
   | 03 | **Empresa establecida en transición** | Conversión a SCCL · slicing pie aplicado a equipos existentes |
   | 04 | **Cooperativa multi-stakeholder** | Consum · treball · serveis · habitatge (modelo COCETA) |
   | 05 | **Fundació / Associació / ONG** | Proyectos sin reparto pero con governance compleja · operativa SOP |
   | 06 | **Ecosistema regional regenerativo** | Comarcal · biorregional · cooperatives federades (modelo Coopdevs) |
   | 07 | **DAO / Web3 descentralitzat** | RegenDAO · ReFi · DAO con proyectos físicos (separat del 02 per la seva natura cripto-nativa) |
   | 08 | **Plataforma cooperativa digital** | Alternativa a Uber/Airbnb (Smart · Eva · CoopCycle · Loconomics) |
   | 09 | **Cooperativa de cures** | Cura mental · diversitat funcional · majors · acompanyament a final de vida |
   | 10 | **Espai autogestionat / coliving** | CSO · ateneu de barri · co-housing · espais culturals |
   | 11 | **Hub de transició sectorial** | Alimentari · energètic · cultural · digital sostenible (modelo Transition Network) |
   | 12 | **Empresa familiar en relevo intergeneracional** | Successió ordenada amb slicing pie · capital paternofamiliar a coperatiu |

   12 tipos · simetría con los 12 guardianes Pantheon Work. Cada
   guardián tendrá afinidad natural con un sub-conjunto de tipos
   (ej. el guardián de ecología hace match con tipos 01/06/09 por
   tradición; el guardián de tecnología con 02/07/08).

### 12 Guardianes Pantheon Work · 8 codificados literal · 4 pendientes

@alvaro pasó la "Guía del Ejercicio de Reconocimiento de Competencias
y Habilidades · Versión 1.0 · 7 sept 2022" de Pantheon Work
(www.pantheon.work · CC BY 4.0 · autores Toni Mascaró + Sergio Marrero
· **co-creadores originales del ejercicio Íngrid Astiz + @alvaro
Solache** · cita literal pág. 16). 26 páginas leídas integralmente.

Catálogo Pantheon Work codificado en `js/core/critical108Roles.js`:

| # | Guardián | Dominio SOS | Trivalente | Keywords (PDF figs 5-6 + diapo Hermes pág 21) |
|---|---|---|---|---|
| 01 | **Afrodita**  | design     | relacionar | estética · belleza · atracción · seducción · transgresión · creatividad |
| 02 | **Apolo**     | education  | distinguir | conocimiento teórico · análisis · estructuración · depuración · predicción |
| 03 | **Atenea**    | governance | distinguir | conocimiento práctico · estrategia defensiva y ofensiva · destreza · civismo |
| 04 | **Demeter**   | ecology    | fusionar   | generación · regeneración · replicación · polinización |
| 05 | **Dionisio**  | culture    | fusionar   | socialización · celebración · juego · hedonismo · invención · conquista |
| 06 | **Hebe**      | operations | distinguir | apoyo logístico · aprovisionamiento · intendencia · rejuvenecimiento |
| 07 | **Hefesto**   | tech       | fusionar   | ⚠ pending input @alvaro · cuestionario oficial pantheon.work |
| 08 | **Hera**      | legal      | fusionar   | ⚠ pending input @alvaro · cuestionario oficial pantheon.work |
| 09 | **Hermes**    | community  | relacionar | comunicación · intercambio · guía · invención · argucia · transgresión |
| 10 | **Hestia**    | community  | relacionar | espacios · encuentros · conversación · centro · alma |
| 11 | **Poseidón**  | finance    | distinguir | ⚠ pending input @alvaro · cuestionario oficial pantheon.work |
| 12 | **Zeus**      | governance | relacionar | ⚠ pending input @alvaro · cuestionario oficial pantheon.work |

**Lógica trivalente** (PDF figura 4 · validada literal):
- Distinguir y separar · Apolo + Atenea + Hebe + Poseidón
- Mezclar y confundir (fusionar) · Demeter + Dionisio + Hefesto + Hera
- Relacionar y sintetizar · Afrodita + Hermes + Hestia + Zeus

**Mapeo dominio ↔ guardián** (12 guardianes en 10 dominios):
- 8 dominios con 1 guardián cada uno
- 2 dominios con 2 guardianes (governance: Atenea+Zeus · community: Hermes+Hestia)
- Todos los 10 dominios MAT-003 quedan custodiados por al menos 1 guardián
- governance lleva 2 (Atenea estrategia operativa + Zeus visión soberana)
- community lleva 2 (Hermes red externa + Hestia hogar interno)

**10 prácticas nativas digitales Pantheon Work** (PDF figura 2 ·
codificadas en `PANTHEON_NATIVE_PRACTICES`):
flujo-valor · redes-nodos · gestion-conocimiento · voz-alta ·
ecosistema · reconocer-competencias · empoderar-mutuamente · beta ·
netiqueta-estricta · memes-campanas. Cada guardián vehicula 1-2 de
ellas según declaración en `nativePractices[]`.

### Tabla de equivalencias SOS V11 ≡ Pantheon Work

Decidido @alvaro 2026-05-08: **las 10 prácticas nativas digitales son
la espina dorsal de SOS V11**. SOS materializa lo que Pantheon Work
formula como prácticas. Cada práctica tiene una vista/módulo que la
hace operativa.

| Práctica Pantheon Work | Materialización SOS V11 |
|---|---|
| Ver todo como un **flujo de valor**       | Vista `/map` (ValueMapView · D3 · `flowAnimationService`) · roles + transactions + tangibles vs intangibles |
| Ver todo como **redes y nodos**           | Vista `/mind` (MindGraphView) · KB completo como grafo D3 · 14 tipos de nodos |
| Sistematizar la **gestión de conocimiento** | Vista `/folders` (FoldersView · `smartFolderService`) · Mind-as-Graph · `KnowledgeLoader` |
| **Trabajar en voz alta**                  | Vista `/sops` + `/kanban` · cada SOP/WO publicado · ledger triple-entry público |
| **Devolver al ecosistema**                | Vista `/market` (MarketService) + Mercado SOS · MAT-001 fase 4 redistribución cooperativa |
| **Reconocer competencias y contribuciones** | MAT-003 · cuestionario Pantheon Work nativo en SOS · ledger de aportaciones por rol/guardián |
| **Empoderar mutuamente**                  | UX-EDU-001 (`didacticService` · vista `/learn` · 17 conceptos didácticos) · CoPs (KM-001 sprint A) |
| **Producir en beta**                      | Workflow CI · pre-Alfa · iteración + DTD (Deliverable Test Driven) · Antigravity Engine |
| **Cumplir netiqueta estricta**            | PACT-001 (builder pacto socios) + identidad firmada ECDSA P-256 (`identityService`) |
| **Crear memes y campañas**                | MAT-002-H landing `/matriu` · branding cooperativo · narrativa Cohort 0 |

Esta tabla certifica que **SOS V11 implementa Pantheon Work** como
sistema operativo. No son frameworks paralelos · son el mismo proyecto
en dos capas · Pantheon Work formula la teoría, SOS la ejecuta.

@alvaro como co-creador original del ejercicio (cita literal pág.16
del PDF) está en posición única para liderar esta convergencia.

**12 tipos de proyecto cliente** (signo dels temps 2026 · validados
@alvaro · codificados en `PROJECT_TYPES`):
01 comunitat-autosuficient · 02 startup-coop-tradicional · 03
empresa-en-transicio · 04 cooperativa-multi · 05 fundacio-ong · 06
ecosistema-regional · 07 dao-web3 · 08 plataforma-cooperativa · 09
cooperativa-cures · 10 espai-autogestionat · 11 hub-transicio · 12
familiar-relevo.

### Próximo input @alvaro · 4 cuestionarios pendientes

Los cuestionarios oficiales individuales de Pantheon Work (no incluidos
en la guía v1.0 que pasaste) contienen las palabras clave de Hefesto ·
Hera · Poseidón · Zeus. Pásamelos en el siguiente mensaje (PDF · Word ·
texto pegado · captura) y los codifico literal en cuestión de minutos.

Mientras tanto, el módulo está operativo con 8/12 guardianes completos
+ 4 marcados `pendingFromPantheonWork: true` para que el sprint B
(catálogo skills) pueda arrancar contra la estructura completa.

### Sprint A actualizado tras estas decisiones

`js/core/critical108Roles.js` (renombrado de `critical100Roles.js`):

- `CRITICAL_ROLES_OPERATIVES` Object.freeze · 96 entradas distribuidas
  por los 10 dominios según la tabla ajustada.
- `PANTHEON_GUARDIANS` Object.freeze · 12 entradas (cuando @alvaro
  pase los nombres).
- `COHORT_0_TOTAL = 108` constante.
- `PROJECT_TYPES` Object.freeze · 12 tipos canónicos con descripción
  multilingüe (ES/CA/EN cuando llegue I18N-001).
- Tests · validan totales · cobertura por dominio · IDs únicos · cada
  guardián tiene `pantheonNum` 1..12 sin duplicados · cada tipo de
  proyecto declara `requiredRoles ⊂ catálogo` y `requiredGuardians ⊂
  los 12`.

### Sprint A NO arrancará hasta:

1. Recibir los 12 guardianes literales de Pantheon Work (input
   @alvaro · próximo mensaje).
2. Validar la lista nominal de los 96 roles operativos · @alvaro
   debe revisar al menos los nombres por dominio antes de codificar.
3. Validar los 12 tipos de proyecto · @alvaro confirma o ajusta.

### Conexiones con otras historias

- **NET-100** se reescribe como sub-historia de MAT-003 · ya no es
  matchmaking abstracto sino aplicación de los 96+12 roles + skills.
- **MAT-002-A** (`buildMatriuCohortProject`) se enriquece en sprint
  E con el catálogo de bootstrap templates por tipo de proyecto.
- **AUTH-001** · cada plaza tendrá `user_identity` con `criticalRoles[]`
  reclamados (1 primario + 0-2 secundarios) + `guardianOf` opcional
  (1 de los 12) + verificados por handoff de otra plaza.
- **PACT-001** · el pacto de socios dinámicos liga roles ↔ slicing pie ·
  los guardianes pueden tener `multiplier` extra (×1.5..2.0).
- **UX-EDU-001 sprint D** · enlaces cruzados entre SOPs y roles ·
  cada operador en formación entiende qué rol cubre con cada SOP que
  ejecuta.
- **MAT-002-H** (landing) · contador "24/108" en lugar de "24/100"
  cuando pasemos a producción Cohort 0.

### Notas de método

- Los 12 guardianes Pantheon Work · NO son reemplazables · son una
  abstracción del framework que @alvaro lleva años trabajando.
- Los 96 roles operativos · NO se inferirán por IA · se diseñan con
  @alvaro y se versionan en `critical108Roles.js`.
- Cada rol debe ser **operativo** (ejecuta ≥1 SOP del Mètode SOS) y
  **diferenciable** (no solapamiento total con otro rol).
- El equilibrio entre dominios garantiza resiliencia · ningún
  dominio supera el 17% (16/96 · tech).
- Skills `governance` + `community` + `culture` + `legal` = 32
  plazas (33%) · reflejan que SOS no es sólo tecnología · es
  facilitación social con tecnología al servicio.
- Skills `tech` + `finance` = 28 plazas (29%) · garantizan capacidad
  de ejecución técnica y económica del Antigravity Engine.
- Skills `ecology` + `education` = 16 plazas (17%) · tessitura
  regenerativa y formativa, base de la "ola disruptiva" VISION-001.

---

## VAL-001 · Contabilidad de valor + Slicing Pie + FairShares (input @alvaro 2026-05-09)

### Por qué ahora

@alvaro detectó un hueco arquitectónico: **SOS V11 habla constantemente
de slicing pie pero NO tiene una vista donde el operador pueda ver la
tarta repartida en su proyecto**. PACT-001 (primer contrato) referencia
`participation: 'slicing-pie'` pero no hay motor que lo calcule.
VAL-001 cierra el bucle.

### Modelos integrados

#### A) Slicing Pie (Mike Moyer · TimeFounder)

Multiplicadores de riesgo por tipo de aportación:

| Tipo aportación | Multiplicador | Razón |
|---|---|---|
| **Cash** (dinero líquido aportado) | **×4** | Riesgo máximo · pérdida total posible |
| **Time** (horas humanas) | **×2** | Coste de oportunidad de salario no cobrado |
| **Assets** (equipos · facilities · vehículos) | **×2** | Riesgo de depreciación · inmovilizado |
| **Ideas / IP** | **×1** | Apreciación independiente · subjetiva |
| **Vendor / supply** (proveedor sin pago) | **×1** | Crédito comercial diferido |
| **Relationships** (cliente clave · contacto) | **×1** | Difícil de objetivar |

Fórmula canónica:
```
slices = (fair_market_value × risk_multiplier)
```
Donde `fair_market_value` es el valor justo de mercado de la
aportación (ej. para tiempo · `2 × salario_anual_mercado / 2000h`).

#### B) FairShares (Rory Ridley-Duff · 4 pies de stakeholders)

| Pie | Stakeholder | Naturaleza |
|---|---|---|
| **Founders** | Fundadores | Capital fundacional + visión + liderazgo inicial |
| **Team** | Equipo | Aportaciones operativas continuadas |
| **Users** | Clientes/usuarios | Generan ingresos · co-crean producto |
| **Investors** | Inversores externos | Capital líquido posterior · sin trabajo operativo |
| (opt) **Community** | Comunidad/territorio | Impacto social · ecosistema regenerativo |

Cada pie tiene su propia regla de distribución y derechos de voto
diferenciados. Un proyecto puede activar 2-5 pies según su tipus.
Los 12 PROJECT_TYPES de MAT-003 declaran qué pies son obligatorios:

| Project type | Pies activos por defecto |
|---|---|
| `comunitat-autosuficient` | founders + team + users + community |
| `startup-coop-tradicional` | founders + team + investors |
| `cooperativa-multi` | founders + team + users + community |
| `fundacio-ong` | founders + team + community |
| `dao-web3` | founders + team + investors + community |
| `cooperativa-cures` | founders + team + users + community |
| (resto) | founders + team (por defecto · expandir per projecte) |

### Reframe KIS @alvaro 2026-05-09 · una tarta · varios pies acotados

> "Cada grupo tiene un total de la tarta del proyecto y este total se
> puede acotar. KIS · keep it simple."

Modelo definitivo:

```
Proyecto = 100% (una sola tarta)
   ├─ Founders pie (target % del proyecto · ej. 50%)
   │     └─ Miembros founders se reparten proporcional a sus slices
   ├─ Team pie (target % · ej. 30%)
   │     └─ Miembros team se reparten proporcional a sus slices
   ├─ Users pie (target % · ej. 15%)
   ├─ Investors pie (target % · ej. 5%)
   └─ (Community pie · opcional)
```

Cada miembro recibe `sharePctInProject = (slicesEnPie /
totalSlicesPie) × pieTarget`. Si un pie está sin contribuciones,
su % queda **unallocated** (no se distribuye automáticamente · es
una alerta visible para el operador).

`pieTargets` por defecto según los 12 PROJECT_TYPES de MAT-003:

| Project type | Founders | Team | Users | Investors | Community |
|---|---|---|---|---|---|
| comunitat-autosuficient | 35 | 35 | 20 | — | 10 |
| startup-coop-tradicional | 50 | 35 | — | 15 | — |
| empresa-en-transicio | 45 | 40 | — | 15 | — |
| cooperativa-multi | 25 | 35 | 25 | — | 15 |
| fundacio-ong | 30 | 50 | — | — | 20 |
| ecosistema-regional | 25 | 40 | — | — | 35 |
| dao-web3 | 35 | 30 | — | 25 | 10 |
| plataforma-cooperativa | 30 | 40 | 30 | — | — |
| cooperativa-cures | 25 | 50 | 15 | — | 10 |
| espai-autogestionat | 25 | 40 | — | — | 35 |
| hub-transicio | 30 | 35 | — | — | 35 |
| familiar-relevo | 60 | 40 | — | — | — |

Suma siempre 100. El operador puede sobrescribir vía `overrideTargets`
y SOS valida (`validatePieTargets`) antes de aceptar (suma = 100 ±
0.5 tolerancia · keys ⊂ FAIRSHARES_PIE_TYPES · valores ≥ 0).

### Sprint A · valueAccountingService puro

`js/core/valueAccountingService.js` Object.freeze:

- `SLICING_PIE_MULTIPLIERS` · `{cash:4, time:2, assets:2, ideas:1, vendor:1, relationships:1}`
- `FAIRSHARES_PIE_TYPES` · `['founders', 'team', 'users', 'investors', 'community']`
- `DEFAULT_PIES_BY_PROJECT_TYPE` · mapping arriba
- `calculateSlices(contributions)` puro · suma slices por partyId
- `calculatePieDistribution({slices})` puro · `[{partyId, slices, sharePct}]`
- `calculateStakeholderPies({contributions, partyTypeMap, activePies})` puro · 4-5 pies separados
- `buildContribution({partyId, type, fairValueEur, riskMultiplierOverride?, evidenceRef?})` puro
- `summarizePieDistribution(slices)` para UI
- `valueAccountingNode({projectId, contributions, pies})` genera nodo KB
  `type='value_accounting'` listo para upsert

Tests · 50+ asserts puros · multiplicadores aplicados correctamente ·
sums coherentes · 4 pies separados con stakeholders correctamente
clasificados · edge cases (ningún slice · party inexistente · etc).

### Sprint B · vista `/value-accounting` ✅ verde

Entregat · `js/views/ValueAccountingView.js` registrat al router amb
ruta `/value-accounting?project={id}` + nou destí nav `🥧 Tarta`
(category market · global=false · requereix projectId).

Estructura:
- **Hero** skin Matriu · `mat-hero-h1` "Tarta del **projecte** · {nom}"
  · subtitle explicatiu · 4 stat-cards (Membres · Slices total ·
  Assignat % · Sense assignar %) amb color condicional verd/groc/
  vermell segons llindar.
- **Grid 2 col** ·
  - Esquerra · "🥧 Tarta del projecte" · D3 donut chart 320px ·
    cada party amb el seu color de pie · sectors `unallocated` en
    gris translúcid per a pies buits o gap visual del 100% · text
    central `100%` italic + `TARTA DEL PROJECTE` mono. Llegenda
    sota amb dot color + nom party + pieType + sharePctInProject.
  - Dreta · "🍰 Pies (target % del projecte)" · llista de tots els
    `FAIRSHARES_PIE_TYPES` actius · barra de progress (used / target)
    · target italic gran · status pill "✓ actiu · X% del projecte"
    o "— buit" en groc dashed.
- **Editor de targets** · botó "Editar targets ↗" desplega un editor
  amb sliders + inputs numèrics per a cada pie (founders / team /
  users / investors / community) · contador de suma en temps real
  amb estat valid/invalid (=100 ±0.5) · botó "💾 Guardar targets"
  només actiu si validatePieTargets passa · persisteix com a nodo
  KB `value_pie_targets`.
- **Taula de membres** · party · pie (color) · slices al pie · % al
  pie · % al projecte (italic gran terracota). Empty state si no hi
  ha cap aportació encara.
- **Form afegir aportació** · party + pie + tipus (×4 cash · ×2 time
  · etc.) + valor (€) · "+ Afegir" persisteix com a nodo KB
  `value_contribution` + actualitza `value_party_map`. Hint
  metodològic sota explicant càlcul slices.
- **Secció didàctica** · 4 punts numerats explicant el flux Slicing
  Pie + FairShares (aportes valor → generes slices → reps el teu %
  · pies sense aportacions queden sense assignar).

Tot consumeix VAL-001 sprint A.5 · `calculateProjectPie` ·
`summarizeProjectPie` · `buildContribution` · `validatePieTargets` ·
`buildValueContributionNode` · `extractContributionsFromKb`.

Persistència en KB:
- `value_contribution` · una per aportació amb id namespaced
- `value_party_map` · `{projectId}::value-party-map` · classifica
  cada party com pieType
- `value_pie_targets` · `{projectId}::value-pie-targets` · override
  dels targets default per projectType

D3 reutilitza la càrrega de ValueMapView (CDN). Si l'usuari arriba a
`/value-accounting` sense haver passat per `/map`, mostra fallback
amb missatge informatiu.

Sense tests específics (UI · validar manualment al navegador). Tests
del backend (calculateProjectPie etc.) ja en VAL-001 sprint A.5.

Suite global · 39 tests sense canvi · navService updated 15→16
destinos amb 2 asserts ajustats (linksGlobal sigue 13 · value es no-global).

### Sprint C · integración con WOs ✅ verde

Entregat · `js/core/woContributionService.js` puro · cierra el bucle
SOP → WO → Ledger → Slice del Antigravity Engine.

Filosofía @alvaro 2026-05-09: "las contributions deberían ser las
WOs contabilizadas". Implementación literal · cada WO en
`status='ledgered'` con `actualHours > 0` + party identificado
(via `assignedToSeatId` u `assignee.id` ≠ pending/agente_*) genera
automáticamente una `value_contribution` type='time'.

Helpers puros:
- `partyIdForWo(wo)` · resuelve party con priority order
  · `assignedToSeatId` (futuro WO-ASSIGN-001) → `assignee.id` válido
  → null. Blacklist · pending · unknown · agente_anthropic ·
  agente_openai · etc.
- `woHasContributableLedger(wo)` · 3 condiciones · ledgered + horas
  + party. Retorna bool.
- `woFairValueEur(wo, options)` · si WO declara `fmvPerHour`, prevalece;
  si no, fórmula Slicing Pie default `2 × annualSalary / 2000h × hours`.
  `DEFAULT_ANNUAL_SALARY_EUR = 36000` (≈ 18 €/h · ajustable per
  party con `salaryByPartyId`).
- `woToContribution(wo, options)` · genera contribution válida via
  `valueAccountingService.buildContribution` · `evidenceRef = wo.id`
  · description = "WO ledgered · {title} · {hours}h" · timestamp
  del `wo.updatedAt`.
- `importWosToContributions({wos, projectId, options})` · filtra
  WOs por proyecto + bulk transform · devuelve `{contributions[],
  skipped[] (con motivos), partyTypeMapInferred}`. Heurística ·
  todos los parties WO-derived van por defecto a 'team' (operador
  ajusta luego).
- `importStats({contributions, skipped})` · resumen para UI ·
  imported · skipped · parties · totalSlices · totalEur · razones.

UI · botón "🔄 Escanejar WOs i importar" en `/value-accounting` ·
sección antes del form manual:
1. Click → KB.query work_order del proyecto
2. importWosToContributions filtra y transforma
3. Si 0 contribs · mostrar diagnóstico con razones de skip
4. Si ≥1 · `confirm(...)` con stats (X membres · Y € · Z slices)
5. Persistir cada contribution + actualizar `value_party_map`
   (preservando overrides existentes del operador)
6. Reload vista → tarta actualizada

Tests · 32 asserts puros · partyId resolution con todos los edge
cases (pending · agente IA · DID · seat ID · override) · contributable
con todos los estados · fairValue con/sin fmvPerHour · import bulk
con filter projeto · stats. Sanity en node verde.

Suite global · 39 → 40.

División clara · contributions tipo `time` vienen del Kanban · todo
el resto (cash, assets, ideas, vendor, relationships) sigue en form
manual. Aclarado en UI · sub-texto del form `+ Afegir aportació
manual` · "per a aportacions que NO vénen del Kanban".

### Sprint D · integración con PACT-001

Cuando un pacto firmado declara `participation: 'slicing-pie'`, SOS
puede aplicar automáticamente las reglas del pacto al contribution
(multiplicadores específicos negociados · vesting que retiene slices ·
exit window que congela el snapshot). El pacto define el "cómo" · el
valueAccountingService ejecuta el "cuánto" en tiempo real.

### Conexiones con otras historias

- **MAT-003** · cada plaza Cohort 0 puede aparecer como party en
  cualquier proyecto del enjambre · aporta tiempo + skills.
- **WO-ASSIGN-001** · vincula WOs con plazas · genera contributions
  automáticas.
- **MAT-002-I** · cuando Matriu = personas, cada miembro tiene perfil
  con su slice agregado en todos sus proyectos (vista de patrimonio).
- **PACT-001** · pacto firmado vive en KB · valueAccountingService
  consulta sus reglas para aplicar multiplicadores.
- **MKT-001 sprint D · savings** · ahorro acumulado por proyecto se
  cruza con slices fundacionales para ver "valor real generado".

### Filosofía operativa (input @alvaro)

> "El primer contrato debe alimentarse de la contabilidad de valor.
> No es un contrato de notaría · es un acuerdo vivo donde cada hora,
> cada euro, cada idea queda registrado y reparte tarta automáticamente.
> SOS es el sistema operativo que hace esto posible sin abogados."

---

---

## UX-AUDIT-001 · Revisió integral UX/colors/textos (input @alvaro 2026-05-09)

> "fes una revisió de tota la UX i colors per millorar la UX un 100% ·
> millora textos · integració SOS · millora del flux de treball · auditoria
> de creació de projecte amb sector + preselecció de subtipus per millorar
> la petició a la IA · revisa per què no va l'animació de seqüència ·
> millora el dashboard per què l'enfoque matriu sigui més integrat al
> flux · revisa que es vegin bé tots els textos dels menús · fes que SOS
> pugui veure's en blanc o en negre · prepara't per al multidioma · revisa
> els textos que ara surten en 3 idiomes."

### Sprint A entregat 2026-05-09

| Fix | Detall |
|---|---|
| **Bug seq order auto-save** | `_inferFlowOrderIA` modal "✓ Aplicar i guardar" ara crida `await this._saveMap()` automàticament + re-render del SVG · toast verd no-blocking en lloc d'`alert`. Solucionava: l'usuari aplicava l'ordre però havia d'anar manualment al "💾 Guardar" del topbar (gairebé invisible). |
| **Light/Dark theme toggle** | `js/core/themeService.js` puro · KB nodo `sos-ui-theme` · `body.theme-light` class · `applyThemeToDocument` idempotent · `bootTheme` cridat des del router cada navegació (abans del primer render). Tokens `body.theme-light { --bg-dark: #f8f8fb · --text-main: #1a1a22 · etc }`. UI a `/settings → 🎨 Aspecte` · 2 botons "🌙 Fosc / ☀️ Clar". Aplica globalment · vistes amb skin propi (Matriu landing · network) mantenen el seu skin. |

### Sprint A2 entregat 2026-05-09 (estabilització + presentació + mobile mockup)

| Fix | Detall |
|---|---|
| **Bug "papallugues" + redirect a /settings** | Causa real identificada: `setTimeout(() => navigateTo('/settings'), 1500-1800)` en `SettingsView` (svSave/svProvider/svPlanSave/svManifestoSave/svManifestoRestore/svTheme) i `ValueMapView._runAISuggestion` quan no hi ha API key. Si l'usuari clicava "Save" o un botó i després marxava de la vista, el timer disparava després i el tornava a `/settings`. **Fix**: tots els handlers fan ara refresh in-place (DOM updates) en lloc de `navigateTo()` · zero races amb la navegació de l'usuari. Afegit també un fix paral·lel al `router.js` · removed el listener `[data-link]` per element redundant (el delegate global a `document` ja en cobreix tots) · evita doble pushState + doble render. |
| **Quitat el botó "🎓 Cohort 0 Matriu" del topbar Dashboard** | Era un duplicat (el flux Matriu ja és al wizard de New Project + al menú "Matriu" del topbar + a `/matriu/network`). Saturava visualment. El mètode `_openMatriuCohortModal()` segueix disponible per CTAs interns. |
| **Cobertura tema clar massiva** | Bloc nou a `css/tokens.css` amb selectors d'atribut `body.theme-light *[style*="background:#0a0a0f"]` (etc.) que sobreescriuen els colors hardcodejats inline a moltes vistes (Dashboard, Settings, Kanban, Efficiency, ProjectHub, etc.). També overrides per `.dash-topbar`, `.kb-topbar`, `.sv-card`, `.sv-input`, `.sos-breadcrumb`, `.sos-nav-group [role="menu"]`, scrollbar. Resultat: tema clar funcional sense refactor de 30+ vistes. |
| **`/presentation` view nova** | `js/views/PresentationView.js` · landing read-only del projecte adaptada al `projectType` (12 hero texts personalitzats per Matriu) · stats strip · llista de rols amb tx IN/OUT (entregables tangibles + intangibles) · SOPs vinculats · WO counters · SOC del projecte si n'hi ha · CTAs cap a /map, /pact, /value-accounting · `window.print()` per generar PDF. Accessible des del topbar de `/map` amb el botó "🎤 Presentació". Registrat com a destí nav en categoria "market" (project-aware · `?project=`). |
| **`/mobile` mockup** | `js/views/MobileMockupView.js` · 4 pantalles (Home · WO Detail · Wallet · Activity) en frame iPhone 14 Pro · mostra el cicle complet del operador mobile (claim WO → timer → evidència → IA tokens · saldo prepagat o pay-as-you-go · esdeveniments Arweave/Gnosis/OpenTimestamps). Inclou bloc de notes amb decisions de disseny + tech stack proposat (PWA, WebCrypto, WalletConnect, Stripe Payment Links) + roadmap 8 setmanes. Sprint A2: només mockup estàtic · implementació real a sprint posterior. |

### Sprint pendents

| Sprint | Detall |
|---|---|
| **UX-AUDIT-001 sprint B · Wizard creació projecte enriquit** | Modal "+ Nou projecte" · obligatori sector A-S del KnowledgeLoader · selector secundari de subtipus dins del sector (ex. K → "K-startup" · "K-platform" · "K-DAO") · selector de PROJECT_TYPE (12 Matriu) · checkbox "Aplicar bootstrap seed". Millora petició IA · prompt amb sector + subtipus + projectType context-rich. Sub-tipus dataset nou (10-20 per cada un dels 19 sectors) com a `js/core/sectorSubtypes.js`. |
| **UX-AUDIT-001 sprint C · Dashboard Matriu integrat** | El strip MAT-002-F passa a ser ara una secció més visible · cards d'acció centrals · "El meu perfil membre" amb editor inline (skills · sectors · disponibilitat) · "Els meus projectes" amb filter per phase (DESIGN/BUILD/OPERATE/LEDGER) · "El meu impacte" amb stats agregats de slices generats. Reframe · Dashboard com a panell del membre, no del codi tècnic SOS. |
| **UX-AUDIT-001 sprint D · Multidioma real i18n** | Auditoria completa textos · ara hi ha barreja castellà/català/anglès. Setup i18next + selector idioma a `/settings → 🌐 Idioma`. 3 idiomes: ES (default actual) · CA (Matriu cohort 0) · EN (red ampliada). Marcar ALL strings amb `t('key')` · extraure a `js/i18n/{locale}.json`. Sprint llarg · 2-4 olas per a cobrir totes les 17 vistes. |
| **UX-AUDIT-001 sprint E · Revisió tipográfica menús** | Auditoria textos dropdowns nav (ara els labels truncats o mal alineats en algunes vistes) · tooltips coherents · iconografia unificada · contrast WCAG AA verificat per tot SOS. |
| **UX-AUDIT-001 sprint F · Auditoria d'arquitectura d'informació** | (Input @alvaro 2026-05-09 · "auditoria de arquitectura de informacion para mejorar el flujo de trabajo añadiendo un sistema inteligente para elaborar la presentacion del proyecto"). Mapejar tots els punts d'entrada del usuari · catalogar destinacions (ja 19 ara) per intent (descobrir, dissenyar, executar, contabilitzar, presentar, configurar) · simplificar la navegació superior a 5 categories canòniques · proposar una "barra inferior" tipus app per mòbil · proposar Information Scent (etiquetes que prediuen què trobarà l'usuari). El sistema intel·ligent de presentació: a `/presentation` afegir un mode "auto-narrativa IA" que genera el text del hero + descripcions dels rols a partir del KB, adaptat al PROJECT_TYPE i a una audiència seleccionable (founders/equip/usuaris/inversors/comunitat) · cost ~150 tokens per generació · cache al KB. |
| **UX-AUDIT-001 sprint G · Mobile PWA implementation** | Implementar les 4 pantalles del mockup `/mobile` com a PWA real · service worker + manifest + install prompt · WebCrypto signing per evidències · IndexedDB sync amb el desktop SOS via export firmat · Stripe Payment Links per top-up · Arweave-js + WalletConnect + OpenTimestamps. Roadmap 8 setmanes · 5 sprints documentat al mockup mateix. |

### Sprint B entregat 2026-05-09 · Wizard enriquit + dataset subtipus

| Fix | Detall |
|---|---|
| **`js/core/sectorSubtypes.js` nou** | Dataset `SECTOR_SUBTYPES` Object.frozen amb 2-5 subtipus per cada un dels 19 sectors A-S (49 subtipus total). Cada subtipus té `id` · `label` · `hint` · `iaContextHint` (text que enriqueix el system prompt de la IA). Helper `getSubtypesForSector(sectorId)` · `getSubtypeById(sectorId, subtypeId)` · `buildIaContextHint({sectorId, subtypeId, projectType, clientDescription})` · zero side effects. |
| **Wizard New Project enriquit** | DashboardView modal "+ Nou projecte" · 2 nous selectors revelats segons sector seleccionat: `<select>` subtipus dins del sector (es revela quan canvies sector si n'hi ha subtipus) i `<select>` dels 12 PROJECT_TYPES Matriu. Hints dinàmics sota cada select. Tots els camps opcionals · cap regressió en el flux actual buit/plantilla. |
| **CREATE_PROJECT augmentat** | Persisteix `subtypeId` · `projectType` · `ia_context_hint` als nous projectes. Camí 3 (sector + descripció · IA): el `_executeClone` reb subtype + projectType i els injecta a la `clientDescription` que rep el `sectorCloner` (zero refactor del cloner) · prompt context-rich per a la IA. |

### Sprint F entregat 2026-05-09 · IA narrativa per /presentation (parcial)

| Fix | Detall |
|---|---|
| **Bloc 🤖 Narrativa IA a PresentationView** | A `/presentation?project=...` · panell sobre el hero amb selector d'audiència (5 PUBLIC_AUDIENCES · fundadors/equip/usuaris/inversors/comunitat) + botó "🤖 Generar". Crida `Orchestrator.callLLM({preferredEngine:'anthropic', responseFormat:'json_object', maxTokens:2048})` · ~150-300 tokens consumits per generació. Persistit a `project.presentation_narrative_v1 = {heroTag, heroTitle, heroMantra, roleDescriptions: {roleId: '...'}, audienceId, generatedAt}` via `UPDATE_PROJECT_INFO` action. |
| **Hero + role descs adaptables** | Si hi ha narrativa IA, el hero (tag + title + mantra) i les descripcions dels rols es renderitzen amb la versió IA · badge "🤖 IA · ${audience}" al meta del hero · icona 🤖 al costat de cada role-desc generada. Botó "↻ Regenerar" (canvia audiència o regenera) i "✕ Esborrar" (torna als textos default per projectType). Tots els textos cap-curts (slice 80/120/240 chars) per garantir hero llegible. |
| **Sense races** | Refresca in-place reemplaçant `app.innerHTML` + cridant `afterRender()` · idèntic patró sprint A2 · zero `navigateTo()` que pugui sortir per timeout. |

### Sprint H entregat 2026-05-10 · Linear/Vercel refactor tokens + 5 vistes top

| Fix | Detall |
|---|---|
| **tokens.css refactor (Linear/Vercel style)** | Nou sistema · contrast WCAG AA en ambdós temes. `--text-main` `#f3f3f7` dark / `#0f172a` light. `--text-secondary` `#c4c4ce` / `#334155`. `--text-muted` `#8a8a9a` / `#64748b` (slate-500, 5:1 contrast). Nous semantic tokens: `--surface-1/2/3` · `--border-subtle/default/strong` · `--shadow-sm/md/lg` · `--shadow-focus`. Type scale bumped per llegibilitat: `--text-xs:13px` · `--text-sm:15px` · `--text-base:16px` · `--text-md:17px`. Font base canviada a **Inter Tight** (Linear/Vercel feel); Space Grotesk → `--font-display`. Radius més tight (`--radius-xl:1rem` era 1.5rem). Cobertura agressiva del theme-light ampliada a 15+ patrons de hex foscos inline + gradients típics + rgba whites + greys. Light bg ara off-white `#f6f7f9` (no tot blanc) per separar visualment del panel `#ffffff`. |
| **SettingsView migrat** | `<style>` block · `.sv-card` ara `var(--bg-panel)` + `var(--border-default)` + `box-shadow:var(--shadow-sm)` · zero gradient hardcoded. Inputs amb `:focus { box-shadow:var(--shadow-focus) }` (3px indigo ring estil Vercel). Labels letter-spacing 0.06em refinat. |
| **DashboardView migrat** | `color:white` → `var(--text-main)` (replace_all) · topbar `rgba(10,10,15,0.97)` → `var(--bg-panel)` · `.dash-card` gradient → flat `var(--bg-panel)` amb `box-shadow:var(--shadow-sm)` · onboard/area/stat/kb-panel/card-action-btn tots migrats a vars semantics. |
| **KanbanView migrat** | Style block sencer reescrit · `#050507`/`#08080c`/`#0e0e14`/`#1a1a22` → `var(--bg-dark/panel/elevated)` · borders `var(--border-default/subtle)` · text `var(--text-main/secondary/muted)` · badges amb noves accent colors (green `#10b981` · red `#ef4444`). Modal amb `:focus` ring i `box-shadow:var(--shadow-lg)`. |
| **ProjectHubView migrat** | Style block sencer reescrit · hero/stat/tile/item/member-card tots amb vars + `box-shadow:var(--shadow-sm)` · hover refinat amb `transform:translateY(-1px)`. |
| **ValueMapView parcial** | Topbar + side panels migrats a `var(--bg-panel)` + `var(--border-default)` · sed batch de `color:white` → `var(--text-main)`. Modal sub-styles encara inline (no crítics, cobertura per atribut). |
| **Sprint H · pass 2 batch · 19 vistes restants** | Migració en bloc de Market · Sops · Workshops · Wallet · ValueAccounting · Skills · Savings · Folders · Tags · Efficiency · MindGraph · PactBuilder · Identity · Node · MatriuNetwork · MobileMockup · Learn · Presentation · Home (i revisades Dashboard/Kanban/ProjectHub/ValueMap/Settings pas 2). Patrons substituïts via sed: hex foscos `#050507/#08080c/#0a0a0f/#0a0a10/#0e0e14/#13131a/#1a1a22/#22222d` → `var(--bg-*)`. rgba foscos `rgba(10,10,15,X)/rgba(8,8,12,X)/rgba(25,25,32,X)/rgba(20,20,28,X)` → vars. rgba whites baixa opacitat (0.02-0.15) → `var(--glass-hover)`. rgba blacks (0.2-0.5) per inputs → `var(--bg-elevated)`. Borders `#1a1a22/#2a2a35/rgba(255,255,255,X)` → `var(--border-default/subtle)`. Text `#fff/white/#e6e6e6` → `var(--text-main)` · `#aaa/#bbb` → `var(--text-secondary)` · `#888/#666/#999` → `var(--text-muted)`. Alias `var(--glass-border)` → `var(--border-default)` global. `.va-stat` i `.se-card` reescrits a flat panel + shadow. 21 fitxers · ~414 línies modificades · syntax check OK. Tota la cobertura legacy via attribute selectors es manté com a safety net per estils inline. |

Pendent Sprint H+: refinaments puntuals si apareixen regressions (Matriu skin views mantenen el seu skin propi · NO migrats per disseny).

### Sprint C entregat 2026-05-10 · Dashboard com a panell del membre

| Fix | Detall |
|---|---|
| **`js/core/memberPanelService.js` nou** | Helpers purs · `resolveCurrentMember(kbNodes, preferredHandle)` cerca el `matriu_member` node del operador (prioritza `content.handle === '@alvaro'`, fallback al primer membre del KB). `summarizeMemberIdentity(member)` extreu display-ready: displayName, handle, bio, availability, skillsCount, sectorsCount, guardianOf, cohortNumber. `computeMemberImpact({projects, kbNodes})` agrega: activeProjects, totalSlices (sumant `content.slices` de value_contribution), totalContributions, totalLedgerEntries, totalWorkOrders · només sobre projectes visibles (no test). `groupProjectsByPhase(projects, statsResolver)` agrupa per `detectProjectPhase` amb stats opcionals. `PHASE_ORDER` const · `AVAILABILITY_META` per UI badges. |
| **DashboardView · panell del membre** | `_renderMemberPanel(projects)` async · renderitza `#dashMemberPanel` damunt del Matriu strip · avatar amb inicials + gradient indigo→purple · nom + handle + meta (disponibilitat amb badge color · guardian · cohort · skills count · sectors count) · 3 stat cards (Projectes / Slices / Contribucions) · 3 quick actions (Editar perfil · Xarxa Matriu · Catàleg skills). Si no hi ha member node → empty state amb CTA a `/identity`. |
| **Phase filter chips** | Sota el panell del membre · 5 chips (Tots · 🎨 DESIGN · 🛠 BUILD · ⚙ OPERATE · 💶 LEDGER) amb count per fase. Click → re-render in-place del project list filtrat per fase. `this._phaseFilter` persisteix dins l'instància. Default = 'all'. Empty state per fase si no hi ha projectes en aquesta fase. Sector grouping es manté DINS la fase seleccionada (no se substitueix · es complementa). |
| **Reframe enfoque** | Dashboard ara obre amb identitat → impacte → projectes (com a "panell del membre", no com a "lista de projectes técnica"). Coherent amb input @alvaro "la Matriu son las personas". |

### Sprint H+ pass 4 2026-05-10 · 2 bugs reportats per @alvaro

| Fix | Detall |
|---|---|
| **Bug · `/mind` no veu projectes nous · roles · transactions** | Els nodes `project` · `role` · `transaction` viuen al `state.projects[]` (legacy V11 pre-Mind-as-Graph schema) i NO al KB. `MindGraphView._load()` només llegia `KB.getAllNodes()` · els SOPs/WOs creats apareixien al graph però sense node arrel del projecte, sense roles, i les arestes `role_ref` / `sopRef` es perdien (idSet no els tenia). Fix · `_load` ara injecta nodes sintètics `{type:'project'}` · `{type:'role'}` · `{type:'transaction'}` per cada projecte i els seus `roles[]` + `vna_transactions[]` que no estiguin ja al KB. mindGraphService · afegit handling de `tx.from` i `tx.to` per dibuixar arestes role → tx → role (flux de valor). Resultat al `/mind`: project hub al centre · roles orbitant · transactions com a edges enriquides · SOPs enllaçats per `role_ref`. |
| **Bug · botons navbar surten "blancs"** | `<button>` sense reset hereta user-agent defaults (gris-blanc amb text negre Helvetica). La majoria de buttons SOS tenen className explícita amb bg/color/font, però les `*-link` classnames usades per `renderNavGroupedHtml` només defineixen color + padding · els nav-group buttons sortien amb el style nadiu del navegador a la topbar fosca (caixa blanca sobre fons fosc · "salgan en blanco"). Fix · afegit reset `button { background:transparent; color:inherit; font:inherit; border:0; cursor:pointer; }` a `base.css` · specificity 0,0,1 · qualsevol className (0,1,0) segueix overridejant. |

### Sprint H+ pass 3 2026-05-10 · Auditoria sistemàtica · 10 vistes topbars + btns

| Fix | Detall |
|---|---|
| **Patrons antics detectats i corregits a 10 vistes** | Audit automàtic detectava: (a) `topbar { padding:1rem 1.5rem }` no-responsive · (b) topbars sense `flex-wrap` (overflow en mòbil/zoom) · (c) `color:#6366f1` hardcoded en lloc de `var(--accent-indigo)` · (d) `var(--bg-0,#050507)` fallback legacy · (e) `var(--font-base,sans-serif)` fallback legacy · (f) `btn-primary background:#6366f1` hardcoded. Sed batch a Wallet · Workshops · Identity · Market · Efficiency · Savings · MindGraph · Folders · Tags · Node + SopsView (fix lot 2 ja inclòs). |
| **Topbars Linear-style** | `padding:1rem 1.5rem` → `padding:8px 16px` · afegit `flex-wrap:wrap` + `min-height:48px` + `box-sizing:border-box` · gap reduït de 1rem a 10px. Botons ja no fan overflow horitzontal en zoom o mòbil. |
| **`*-link` className upgrade · btn-style** | Cada vista té el seu `.X-link` que rep `renderNavGroupedHtml` com className. Abans: `color:#6366f1; text-decoration:none; font-size:0.85rem;` (text simple). Ara: `display:inline-flex` · `padding:6px 10px` · `font-weight:600` · `:hover { background:var(--glass-hover); color:var(--text-main); }` · `:focus-visible` outline indigo · `white-space:nowrap`. Resultat: els nav-grouped buttons al topbar es veuen com a botons consistents amb hover bg, no com a text-links. Aplicat a 10 vistes via Python regex batch. |
| **`*-btn` className upgrade · Linear feel** | A 5 vistes (Efficiency · Identity · Market · Workshops · Wallet) reescrit el base button class · `padding:6px 12px` (era 0.5rem 1rem · alçada inconsistent amb la nav grouped) · `font-weight:600` · `line-height:1.3` · `display:inline-flex` per alinear icones · `:hover { background:var(--glass-hover); border-color:var(--accent-indigo); }` · `:focus-visible` outline indigo · `transition:all var(--dur-fast)`. |

### Sprint H+ fix lot 2 2026-05-10 · /map topbar polit + pastel colors fix global

| Fix | Detall |
|---|---|
| **/map topbar reescrit Linear-style** | `.vmap-shell` grid-template-rows `48px → auto` (era altura fixa que tallava si topbar wrap). `.vmap-topbar` `flex-wrap:wrap` · `min-height:48px` · padding `8px 16px` (era `0 16px`). `.vmap-topbar-actions` `flex-wrap:wrap` + `justify-content:flex-end` · 10+ botons del topbar ja no fan overflow horitzontal. `.vmap-btn` redissenyat · bg `var(--bg-elevated)` (era transparent · feia que es veiessin "blancs" en light per herència del topbar bg `var(--bg-panel)` blanc), padding `6px 12px`, `display:inline-flex` + `align-items:center` per alinear icones, `:focus-visible` outline indigo, `line-height:1.3`. |
| **`.vmap-btn-primary` text fix** | Color text `var(--text-main)` → `#fff` · bug crític en tema clar (text-main era negre → invisible sobre bg indigo). |
| **`.vmap-btn-save` polit** | Gradient `var(--accent-green)→#059669` (era `→#00b248`) · text `#fff` (era `#000` que es veia agressiu sobre verd brillant) · `border:1px solid transparent` per coherent alçada amb altres btns · `font-weight:700` (era 900 · massa pesat). |
| **Inline pastel colors fix global** | Sed batch a 22 fitxers · `color:#86efac` (green-300) → `var(--accent-green)` · `color:#a5b4fc` (indigo-300) → `var(--accent-indigo)` · `color:#fca5a5` (red-300) → `var(--accent-red)` · `color:#c084fc` (purple-400) → `var(--accent-purple)` · `color:#facc15` (yellow-400) → `var(--accent-orange)` (les pastel-300/400 fallaven WCAG AA sobre bg blanc · accents canonics passen). Afectades vistes Wallet · Tags · Sops · Kanban · Node · Skills · Savings · Learn · Dashboard · Settings · MindGraph · Folders · ValueAccounting · ValueMap · MobileMockup · Market · Identity · PactBuilder · ProjectHub · Efficiency + serveis didacticService · tagsService. |
| **Panel + Presentació btns del topbar /map** | Inline `color:#86efac` → `color:var(--accent-green)` per al botó "🎛 Panel" · ja visible en ambdós temes. Border opacity ajustada de 0.40 a 0.45 per millor visibilitat. |

### Sprint H+ fix lot 2026-05-10 · Sectores nav + bug subtipus + audit pendents

| Fix | Detall |
|---|---|
| **`js/core/sectorSubtypes.js` realineat amb CNAE** | Bug crític · les keys del SECTOR_SUBTYPES feien servir taxonomia Matriu (A=Salut · B=Habitatge…) que NO coincideix amb les del `KnowledgeLoader.listSectors()` (A=Agriculture · B=Mining…). Resultat: l'usuari triava un sector al wizard "+ Nou projecte" i veia subtipus d'un àmbit no relacionat. Reescrit el dict amb keys CNAE A-S agrupant els subtipus existents per àmbit semàntic. IDs dels subtipus mantinguts (`A-residencia` continua sent `A-residencia` però ara viu sota R · Salut). `getSubtypeById` amb fallback que cerca a tots els sectors per backwards compat de projectes amb subtipus antic. |
| **`/sectors` view nova · `js/views/SectorsView.js`** | Substitueix el botó "📚 Knowledge Base" del topbar del Dashboard (sortia idèntic a totes les vistes · saturava). Pàgina dedicada amb llista dels 19 sectors A-S amb readiness badges (ready/solid/tier 2) + drill-down de roles + transaccions clau. Mateixa lògica que el panell lateral del Dashboard, com a vista pròpia (grid 2 columnes responsive). |
| **NAV_DESTINATIONS · entry `sectors`** | Afegit a la categoria knowledge · icon 📚 · label "Sectores" · global:true · hint "Catálogo A-S · readiness · roles y transacciones tipo del KB". Knowledge group passa de 5 a 6 links. Tests actualitzats (NAV_DESTINATIONS.length 18→19 · linksGlobal 14→15 · linksProject 18→19 · knowledge group 5→6). |
| **Dashboard topbar polit** | Botó `dashBtnKB` eliminat del topbar (mantingut comment per traçabilitat). Topbar més net amb només Export · Import · + New Project + lang selector. |
| **TODO Sprint H+ pendents** | Auditoria visual de TOTES les vistes (19) que verifiqui: (1) nav grouped es renderitza correctament a la topbar de cada view · (2) cap botó hardcodejat amb color trencat en light/dark · (3) `:focus-visible` consistent · (4) breadcrumb visible · (5) bottom nav mobile actiu correcte per cada ruta. Cada vista té el seu propi className per als nav buttons (sv-link · kb-link · vmap-btn · etc.) i poden tenir regressions visuals subtils que només es veuen en navegació real. |

### Sprint D fase A entregat 2026-05-10 · Multidioma · CA afegit + default ES + selector 3 botons

| Fix | Detall |
|---|---|
| **Català (CA) afegit a `js/i18n.js`** | Diccionari CA amb ~120 keys traduïdes (app.* · dash.* · settings.* · vmap.* · insp.* · ai.* · save.*). Les keys no incloses cauen via fallback chain `ca → es → en → key`. |
| **Default ES (era EN)** | Coherent amb la base d'usuaris actual i la Matriu cohort 0 hispanoparlant. `initLang` fallback també a ES. Actualitzat a `store.js`. |
| **`SUPPORTED_LANGS` export** | `Object.freeze(['ca','es','en'])` · usat per `setLang` validation i `langSelectorHtml` iteration · garanteix consistència entre validació i UI. |
| **Fallback chain `t(key)`** | `lang → es → en → key` · qualsevol key inexistent al CA cau a ES (llengua propera) abans de EN. Eviten "[key]" visible al usuari. |
| **`langSelectorHtml` refactor · 3 botons** | CA / ES / EN com a pill toggle group · usa `var(--bg-elevated)` + `var(--border-default)` · botó actiu amb `#fff` color sobre `var(--accent-indigo)` bg + `aria-pressed`. Tooltips amb nom complet de la llengua. Letter-spacing 0.05em + font-mono per look Linear. |
| **SettingsView · 🌐 Idioma card** | Nou card al `/settings` (era només `afterRender` cercant un `#settLangSel` inexistent) · border-top cyan `#06b6d4` · explicació breu dels 3 idiomes amb el seu propòsit (ES default · CA cohort 0 Matriu · EN xarxa ampliada). |

Pendents Sprint D fase B+: traducció complerta de tots els strings (175→525) · marcar amb `t('key')` strings dispersos a totes les 17 vistes · extraure a `js/i18n/{ca,es,en}.json` separats per facilitar manteniment.

### Sprint F resta entregat 2026-05-10 · Bottom Nav mòbil + Information Scent

| Fix | Detall |
|---|---|
| **Bottom Nav mòbil · 5 categories canòniques** | `navService.js · renderBottomNavHtml({pathname, projectId, active})` + `paintBottomNav({pathname, search})` async · injecta o actualitza `<nav class="bottom-nav">` al final del body via id `sos-bottom-nav`. Helper intern `_categoryForPath(pathname)` mapeja qualsevol ruta a una de les 5 categories (operations/knowledge/market/identity/home) i marca l'item actiu amb `aria-current="page"` + `::before` indigo pill al top. operations és project-aware quan hi ha `?project=` o `/project/{id}`. CSS al `base.css` refinat: bg `var(--bg-panel)` · border-top `var(--border-default)` · shadow superior · height 60px · safe-area-inset-bottom · max-width 720px centrat. `#app` rep `padding-bottom: 60px + safe-area` en mòbil per no tapar contingut. |
| **Router auto-paint** | `paintBottomNav` cridat des de `router.js` després de `paintBreadcrumb` · idempotent · cada navegació SPA actualitza el destacat actiu sense remountar el DOM. |
| **Information Scent · hint subtitle als dropdowns** | `renderNavGroupedHtml` ara emet 2 línies per item: label en negreta + hint subtitle 11px en text-muted (clamp 2 línies via `-webkit-line-clamp`). El hint ja existia a `NAV_DESTINATIONS[i].hint` però només es feia servir com a `title` (tooltip). Ara és visible directament al menú · l'usuari pot anticipar què trobarà a cada destí sense haver de fer hover. Dropdown amplat min 260px / max 320px (era 220/280) per acomodar 2 línies. CSS nou: `.sos-nav-icon` · `.sos-nav-content` · `.sos-nav-label` · `.sos-nav-hint` amb estats hover/active. |

### Sprint C2 entregat 2026-05-10 · Editor inline al panell del membre

| Fix | Detall |
|---|---|
| **DashboardView · mode edit inline al panell** | Botó "✏ Editar perfil" (substitueix el link a /identity) toggle `this._memberEditOpen`. Quan obert, expand inline `<div class="dash-member-edit">` sota les actions amb 3 grups editables. |
| **Skills declarades · chips removables + add picker** | Chips indigo amb botó ✕ per treure. `<select>` "+ Afegir skill..." amb totes les 90 SKILL_TAXONOMY no declarades encara (label + domain). On change → push al draft + refresh in-place del bloc edit. |
| **Sectors d'experiència · chips verds + add picker** | Mateix patró que skills. `<select>` carrega els 19 sectors A-S via `KnowledgeLoader.listSectors()` cached al `_memberCache.sectorsList`. |
| **Disponibilitat · 3 chips toggle** | high / normal / low amb icones 🟢🟡🔴 i labels canònics. Click → set draft.availability. is-active class amb indigo bg. |
| **Save → KB.upsert merged** | Si existeix `matriu_member` actual · merge in-place preservant tots els camps no editats + actualitza `skillsDeclared` · `sectorsExperience` · `availability` · `updatedAt` · keywords regenerades. Si no existeix · `buildMatriuMember` amb defaults (`displayName='Operador'` · `handle='@alvaro'` · `cohortNumber=0`). Dispatch `KB_UPSERT` · status "✓ Guardat" · auto-tanca edit mode + re-render panell. |
| **Cancel · zero impact** | Reseteja `_memberDraft = null` + tanca edit · panell torna a mostrar valors persistits. |
| **`_refreshEditOnly()` puro DOM** | Re-renderitza només el bloc `#dashMemberEdit` (no el panell sencer) després de cada chip add/remove · evita race conditions amb el draft i flicker. `_bindMemberPanelEditOnly()` separat de `_bindMemberPanel()` perquè el toggle button es bind UNA sola vegada (només es replaceja amb el panell sencer · evita doble listener). |

### Sprint E entregat 2026-05-10 · Revisió tipogràfica menús + WCAG AA verificat

| Fix | Detall |
|---|---|
| **NAV_GROUP_CSS reescrit Linear-style** | `navService.js` · dropdown menus migrats a vars · `min-width:220px` + `max-width:280px` (era `min-width:200px` sense max) · padding items 8px 12px (era 6px 10px) · `text-overflow:ellipsis` per truncar labels llargs · `grid-template-columns: 22px 1fr` per alinear icones com a columna fixa · animation `sosNavMenuIn` (fade + translateY) al obrir · `box-shadow:var(--shadow-lg)` adaptatiu · `:focus-visible` outline indigo per teclat · indicador d'item actiu amb `::before` pill indigo de 2px a l'esquerra + `font-weight:600` + `aria-current="page"` semantic. |
| **`sos-nav-active` class estable** | `renderNavGroupedHtml` afegeix classe `sos-nav-active` (a més del activeClass custom passat per la view) · permet styling consistent independent del view · KanbanView usa `kb-link-active` però segueix obtenint el visual styling correcte via la classe estable. `aria-current="page"` també s'afegeix per accessibilitat. |
| **`.sos-nav-group > button` minimal** | Eliminades overrides agressives que entraven en conflicte amb `dash-btn`/`kb-link`/etc · ara només afegeix `gap:6px` per al chevron · `:focus-visible` indigo ring · `aria-expanded="true"` → color indigo + border indigo. La className passada pel view controla la resta. |
| **BREADCRUMB_CSS migrat a vars** | Background `#06060a` → `var(--bg-panel)` · border `#1a1a22` → `var(--border-subtle)` · text `#888` → `var(--text-muted)` · links `#a5b4fc` → `var(--accent-indigo)` amb hover `bg:rgba(99,102,241,0.10)` · current `#fff` → `var(--text-main)` · separator `#444` → `var(--text-disabled)` amb opacity 0.6 · phase pill `--text-xs` font + `letter-spacing:0.06em` + `text-transform:uppercase` per look Linear. |
| **Typo cleanup `var(--duration-*)` → `var(--dur-*)`** | Sed batch · 15+ ocurrències a ValueMapView · DashboardView · altres. Les transicions/animations ara funcionen amb les vars correctes definides a tokens.css (eren no-op silencioses · ara són correctes). `var(--accent-gold)` (no existent) → `var(--accent-claude)` (definit). |
| **DashboardView dash-btn polit** | Padding `5px 14px` → `6px 12px` · font-weight `700` → `600` (Linear feel) · hover ara amb `background:var(--glass-hover)` per feedback més clar · `:focus-visible` outline indigo · `dash-btn-primary` color fix a `#fff` (era `text-main` que en light feia text negre sobre bg indigo). |

Pendents Sprint E+: auditoria visual als breakpoints mòbil (testejar dropdowns < 720px) · subtitles sota labels al dropdown (KM-001 sprint D backlog) · tooltips amb framework propi per a hints llargs.


---

### Decisions consensuades amb @alvaro 2026-05-10

| # | Decisió | Resposta @alvaro |
|---|---|---|
| 1 | **Funding model** · credit card directe via Turbo SDK · o wallet SOS prepagat? | ✅ **Wallet SOS prepagat** · l'usuari carrega el wallet (ALPHA-STRIPE-001 sprint A · Payment Links) i el publish/revoke descompta del saldo · UX unificat amb la resta del SOS · zero credit card direct integration al permaweb |
| 2 | **TTL cache** local | 🟡 default proposat · 1h discovery active · 24h background · revisable a /settings |
| 3 | **Privacitat** granular vs en bloc | 🟡 default proposat · en bloc · si vols privacitat granular no publiquis (clar i defensiu) |
| 4 | **Revocació** semàntica | 🟡 default proposat · nova tx Arweave amb `Entry-Type=revocation` + `Revokes={txId}` · el lookup descart entries amb revocation associada |
| 5 | **Federació cohort 0 → permaweb** | ❓ **no clar encara** · per defecte assumim opt-in explícit de cada membre · NO auto-publish automàtic |
| 6 | **Turbo SDK CDN** · jsDelivr o unpkg? | ✅ **jsDelivr** (`@ardrive/turbo-sdk@latest/+esm`) · més ràpid globalment · `+esm` mode directe sense bundler · mateix vendor que el D3 que ja usem |
| 7 | **Signing key** · compartida amb projectIO o nova? | ✅ **compartida amb projectIO** (`getOrCreateSigningKey`) · 1 sol keypair → 1 sol DID → simpler local-first |
| 8 | **Pricing** · flat o per byte? Quant? | ✅ **flat 0.05€ per publish · 0.05€ per revoke · verify+discovery FREE**. Cost real Arweave ~$0.0001 per profile · marge ~99%. Vendible per absurda (Twitter Blue $8/mes recurrent vs SOS 5 cèntim **per sempre**). |

### Sprint A · entregat (planificat)
- `js/core/publicRegistryService.js` · schema + builder + validator + canonicalize + extract helpers
- Tests asserts puros
- Zero deps externes · TDD-able sense network

### Funding flux (decisió #1 detallat)

```
Operador (@alvaro)
  └─> /wallet?project=<projectId>  (saldo prepagat)
        └─> "Publish public registry entry"
              └─> publicRegistryService.publishToPermaweb({entry, projectId, jwk})
                    ├─> walletService.consumeAndPersist({projectId, eur:0.02, kind:'permaweb-publish'})
                    │     └─> wallet.balanceEur -= 0.02
                    │     └─> movement registrat amb ref='permaweb-{txId}'
                    └─> Turbo SDK upload (signed amb ECDSA · backend de SOS · NO usuari final mai veu credit card)
                          └─> Arweave tx confirmat · txId tornat
```

> Per què wallet SOS i no credit card: (a) l'usuari ja carrega el wallet per a IA (Anthropic/OpenAI) · una sola UX de "saldo SOS". (b) ALPHA-STRIPE-001 ja gestiona el funding amb Payment Links (zero claus secret al frontend). (c) un operador empresarial pot tenir el wallet del projecte separat dels seus pagos personals.

---

## PERM-USER-001 · Permaweb · usuarios únicos + registre públic (input @alvaro 2026-05-10)

> Reframe SOS V11 cap a **identitats verificables i descobribles**: cada
> operador té un DID determinístic + clau ECDSA local-first · pot **opt-in**
> a publicar el seu perfil al permaweb (Arweave) · qualsevol altre SOS
> local pot descobrir-lo i verificar-lo sense backend central.
>
> Visió antigravity: **cap servidor SOS gestiona la directory · viu al
> permaweb · cada SOS local actua com a node de la xarxa**.

### Inventari actual (què ja existeix)

| Peça | Estat | On |
|---|---|---|
| Keypair ECDSA P-256 per dispositiu | ✅ | `projectIO.js` (1 sola clau · reutilitzada) |
| DID determinístic (SHA-256 publicJwk → `did:sos:{32hex}`) | ✅ | `identityService.deriveDidFromJwk` |
| Schema `user_identity` (DID + JWK + handle + wallets) | ✅ | `identityService.buildIdentityNode` |
| Schema `matriu_member` (fusió user_identity + cohort_seat + skills + sectors) | ✅ | `matriuMemberService.js` |
| Helpers migració `user_identity` → `matriu_member` | ✅ | `migrateAllToMatriuMembers(dryRun)` |
| UI `/identity` perfil editable + DID copiable | ✅ | `IdentityView.js` |
| Mockup mobile amb permaweb events (Arweave tx-id) | ✅ | `MobileMockupView.js` (paper) |
| Signature ECDSA over export snapshots | ✅ | `projectIO.downloadSnapshotJson` |
| Discovery UI `/matriu/network` (108 places · només local) | ✅ | `MatriuNetworkView.js` |

### Anti-inventari (què cal construir)

| Falta | Per què | Sprint |
|---|---|---|
| Schema `public_registry_entry` (perfil públic minim · DID + JWK + handle + skills + sectors · NO wallets · NO clau privada) | Decoupling del `matriu_member` (privat) i la versió pública | A |
| Builder + validator pur del registry entry | TDD-able · sense effects | A |
| `signRegistryEntry(entry, privateJwk)` + `verifyRegistryEntry(entry)` | Cada entry porta firma ECDSA over canonical JSON · qualsevol altre SOS pot verificar autenticitat | B |
| Arweave SDK integration (Turbo SDK · paid uploads) | Pujar entries al permaweb · cost ~$0.00001/KB negligible | C |
| `publishToPermaweb(entry, wallet)` async + UI opt-in toggle | Usuari controla 100% què surt · explicit consent | C |
| GraphQL gateway query a `arweave.net/graphql` per tag `App-Name=SOS-V11` + `Entry-Type=public-registry-entry` | Discovery descentralitzat | D |
| `cachePublicRegistry({ttl})` · sincronitza entries al KB local amb expiració | Performance · una sola query/h | D |
| UI `/registry` vista nova · busca per handle/DID · llista entries amb avatar/skills/sectors · verificació visible (✓ firma vàlida) | UX del descobriment | E |
| Toggle "🌐 Publicar el meu perfil públic" a `/identity` | Privacitat · revocable | E |
| `revokeRegistryEntry(did)` · marca l'entry com a revocada amb nova tx Arweave | GDPR compliance · "right to be forgotten" parcial (no esborra Arweave · marca com a inactive) | E |

### Sprint plan A-E

#### Sprint A · Foundation · schema + builder/validator puros (~1h)
- `js/core/publicRegistryService.js` nou:
  - `PUBLIC_REGISTRY_TYPE = 'public_registry_entry'`
  - `buildPublicRegistryEntry({did, handle, displayName, bio, publicJwk, skillsDeclared, sectorsExperience, availability, guardianOf, cohortNumber, avatar})` pura
  - `validatePublicRegistryEntry(entry)` pura · valida shape + camps obligatoris + què NO ha d'estar (privateJwk · wallets[] · oauthProviders[])
  - `canonicalizeRegistryEntry(entry)` pura · ordre canònic deterministic per signar (clau JSON.stringify amb keys ordenats)
  - `extractPublicFromMatriuMember(member)` pura · helper per generar entry des d'un matriu_member · selecciona només camps públics safe
- Tests · ~20 asserts puros (validació · canonicalització · extracció)

#### Sprint B · Signatura ECDSA over canonical JSON (~1h)
- `publicRegistryService.signRegistryEntry({entry, privateJwk})` async · canonicaliza + signa amb `crypto.subtle.sign` · retorna entry + `signature` base64
- `publicRegistryService.verifyRegistryEntry(entry)` async · reconstrueix canonical + verify amb publicJwk de l'entry mateixa · retorna `{valid:bool, reason:string}`
- Defensiu · si firma absent retorna `{valid:false, reason:'no-signature'}`
- Tests · ~15 asserts amb keypair real (crypto.subtle disponible a node 19+ · skippable a entorns vells)

#### Sprint C · Permaweb publish via Arweave Turbo SDK (~2h)
- Dependència nova · `@ardrive/turbo-sdk` (50KB · ESM · CDN compatible)
- `publishToPermaweb({entry, jwk})` async:
  - Tags Arweave: `App-Name=SOS-V11`, `Entry-Type=public-registry-entry`, `DID={did}`, `Handle={handle}`
  - Body · canonicalizeRegistryEntry(entry) + signature
  - Retorna `{txId, status, costUSD}`
- Funding · Turbo SDK suporta credit card directe o via Stripe Payment Link (compatible amb ALPHA-STRIPE-001)
- UI `/identity` · toggle "🌐 Publicar" + status badge (draft · pending · published txId)
- Tests · mock Turbo SDK · 10 asserts d'integració

#### Sprint D · Discovery + cache + verify (~2h)
- `queryPermawebRegistry({since, handles, dids})` async · GraphQL a `https://arweave.net/graphql` amb tags filter
- Resposta · array de tx descriptors (txId, owner, tags, timestamp)
- `fetchEntryByTxId(txId)` async · descarrega body via `https://arweave.net/{txId}`
- `cacheToKb({entries, ttl=3600000})` · upsert al KB local amb tipus `public_registry_entry` + flag `cachedAt` + `fromPermaweb=true`
- `getCachedRegistry({maxAge})` síncron · llegeix del KB filtrat per TTL
- Tests · mock fetch · 12 asserts

#### Sprint E · UI Discovery + opt-in/revoke (~2-3h)
- Vista nova `/registry` · `RegistryView.js`:
  - Buscador AJAX per handle/DID/skill/sector
  - Llista de cards · avatar gradient (per DID hash) + handle + displayName + bio · pills skills/sectors · badge "✓ verificat" si verifyRegistryEntry passa
  - Stats top · "Tens local · 12 entries · 8 verificades · última sync fa 23min" + botó "↻ Refresh des de permaweb"
  - Click card → `/n/{did}` per detail (reutilitza NodeView fallback)
- `IdentityView` · nova secció "🌐 Registre públic":
  - Toggle "Publicar el meu perfil al permaweb"
  - Si publicat · mostra txId + link arweave.net + botó "🗑 Revocar (nou tx)"
  - Cost · "Cost estimat: ~$0.00002 (~0.02 cèntim · una sola vegada)"
- `MatriuNetworkView` · ja existeix · afegir filter "Mostrar globals (permaweb)" al costat dels filtres locals
- Tests · 15 asserts UI binding + lookup

### Dependències i blockers

- **No bloqueja**: tots els sprints són additius · zero canvis al schema existent (es manté `matriu_member` privat com a font de veritat local).
- **CDN Arweave**: usar `https://unpkg.com/@ardrive/turbo-sdk` (ESM) · zero npm install al SOS local-first.
- **Costs**: Turbo accepta credit card sense backend · ~0.02 cèntim per perfil · plenament alfa-friendly.
- **Privacy by default**: opt-in explícit · perfil privat mai surt automàticament · entry pot tenir TTL implícit declarat al body.
- **eIDAS legal** (opcional): combinar amb OpenTimestamps anchor per validesa legal (sprint Z futur · vinculat a PUBLICREG-001).

### Decisions claus pendents de consensuar amb @alvaro

1. **Funding model**: ¿usuari paga directament amb credit card via Turbo SDK · o pot pagar via wallet SOS prepagat?
   - Recomanació: ambdós opt-in · default credit card (UX simpler primer).
2. **TTL de cache local**: 1h · 24h · 7 dies?
   - Recomanació: 1h per Discovery actives · 24h en background.
3. **Filtre privacitat default**: ¿skills sempre públiques · o opt-in granular per camp?
   - Recomanació: tot el perfil públic és opt-in en bloc · si vols privacitat granular no publiquis.
4. **Revocació**: ¿quina semàntica? Nova tx Arweave amb `Entry-Type=revocation` apuntant al txId revocat.
5. **Federació entre permaweb i Matriu Network**: ¿els 108 places de la cohort 0 aniran al permaweb automàticament un cop @alvaro ho activi?
   - Recomanació: NO automàtic · cada membre ha de signar el seu opt-in.

### ROI esperat (per què val la pena)

- **Unique users sense backend**: SOS V11 manté la seva tesi local-first/antigravity · zero hosting cost per a la directory.
- **Trust verificable**: signatura ECDSA dins l'entry · qualsevol altre SOS local pot verificar sense intermediaris.
- **Discoverability**: nova UX "qui sou els SOS operators del món" · viu a permaweb · indestructible.
- **Bridge a Matriu cohort 0 → cohort 1+**: quan cohort 0 (108 places) es publica al permaweb, qualsevol pot veure-la i sol·licitar entrar a cohort 1 amb el seu propi perfil.

## FUND-FLOW-001 · UX simple de saldo personal + projecte + auto-distribució (input @alvaro 2026-05-10)

> Visió @alvaro · "vull poder carregar saldo com a persona i fer servir
> les APIs de SOS (permaweb · blockchain · IA) amb control real de
> consum · i quan toqui derivar saldo al compte d'un projecte per donar
> crèdit. I quan el projecte generi ingressos, automatitzar que es
> distribueixin entre 1) despeses operatives APIs/fees i 2) stakeholders
> segons el pacte de socis i acords dinàmics signats."

### Estat actual (què funciona avui)

| Peça | Estat | On |
|---|---|---|
| Wallet per projecte amb saldo + moviments | ✅ | `walletService.js` · 4 kinds (topup/consume/refund/adjustment) |
| Funding manual via Stripe Payment Links | ✅ alfa | `stripeService.js` (4 trams · pk_test_ only · sense webhook auto) |
| Consum automàtic IA del wallet | ✅ | MKT-001 sprint C3 · `chargeWalletForLlmCall` post-LLM |
| Consum del wallet per permaweb publish/revoke | ✅ | PERM-USER-001 sprint C · 0.05€/publish |
| Slicing Pie + FairShares per projecte | ✅ | VAL-001 sprint A-C · `valueAccountingService.js` |
| WO → contribution automàtic al ledger | ✅ | VAL-001 sprint C · `woContributionService.js` |

### Anti-inventari (què falta per la visió completa)

| Falta | Per què cal |
|---|---|
| **Wallet personal** (no lligat a projecte) | Avui tots els wallets són per-projecte · l'operador no té un saldo "seu" general · ha de ser un projecte fictici |
| **Transferència wallet ↔ wallet** | Per derivar saldo personal a un projecte i tornar (quan el projecte genera ingressos i el repartiment toca a l'operador) |
| **Stripe webhook automàtic** | Sprint B pendent · Netlify Function amb `sk_test_` env · ara cal ajust manual post-pagament |
| **Distribució automàtica d'ingressos** | Regla configurable per projecte · `{operatingReserveBps, stakeholdersBps, foundersBps}` que dispara al rebre topup amb `source='income'` |
| **Stakeholder claim/withdraw** | Cada party del Slicing Pie pot fer `claimableEur(projectId, partyId)` + botó "💸 Retirar el meu pie" · descompta del wallet projecte · topup al wallet personal del party |
| **Schema `public_project_entry` al permaweb** | Per a federació · projectes publicats descobribles · "oportunitats" |
| **Vista `/opportunities`** | UI · projectes públics del permaweb que busquen rols/skills · permet sol·licitar entrar com a stakeholder |
| **Consum unificat** (IA + permaweb + blockchain) | Avui IA i permaweb consumen separadament · un `costEur` unificat amb breakdown per categoria al moviment del wallet |

### Sprint plan FUND-FLOW-001

#### Sprint A · Wallet personal + transferència (~1h · sense xarxa)
- `walletService.js` · `personalWalletIdFor(handle)` retorna `__personal_${handle.slice(1)}__`
- `getOrCreatePersonalWallet(handle = '@alvaro')` async
- `transferBetweenWallets({fromProjectId, toProjectId, amountEur, note})` · consume + topup atòmic amb refs encadenats (`ref:'transfer-{ts}'` a ambdós moviments)
- UI · `/wallet` sense `?project=` mostra el wallet personal (no errors com ara)
- UI · al `/wallet` afegir "↗ Transferir a projecte" amb selector
- Tests · 12 asserts puros

#### Sprint B · Stripe webhook auto-credit (~2h · necessita Netlify)
- Netlify Function `netlify/functions/stripe-webhook.js` · valida `stripe-signature` amb `sk_test_` al env
- Quan rep `checkout.session.completed` · POST al SOS local? · ALT · l'usuari sincronitza manualment a `/wallet?refresh` que llegeix les sessions completed via API
- UX · botó "↻ Refresh des de Stripe" al wallet · llegeix `payment_intent` amb metadata `projectId` per imputar
- Tests · mock Stripe API

#### Sprint C · Distribució automàtica d'ingressos (~2h)
- Schema `distribution_rule` per projecte (singleton al KB · `id:{projectId}::distribution-rule`):
  - `operatingReserveBps` (basis points · default 2000 = 20% per cobrir APIs/fees)
  - `stakeholdersBps` (default 8000 = 80% repartit segons Slicing Pie)
  - `customRules[]` (opcional · regles addicionals tipus "10% al fons de reserva fundacional")
- Helper · `distributeIncome({projectId, amountEur, source})` async:
  - Aplica `operatingReserveBps` → marca al wallet com `source='operating-reserve'`
  - Aplica `stakeholdersBps` → distribueix entre parties del Slicing Pie pro-rata
  - Persisteix moviments amb `kind='income-distribution'` + breakdown al note
- UI · `/value-accounting` · nou panel "🌊 Regla de distribució" editable
- Hook · quan topup arribi amb `source='income'`, dispara `distributeIncome` automàticament

#### Sprint D · Stakeholder claim/withdraw (~1.5h)
- `valueAccountingService.claimableEurForParty({projectId, partyId})` pure · calcula:
  - Pie share del party (Slicing Pie + FairShares)
  - × saldo disponible al wallet projecte assignat al stakeholder bucket
  - − ja retirat (suma de moviments `kind='claim-withdraw' ref:party-{partyId}'`)
- UI · `/value-accounting` · cada party row · botó "💸 Retirar X €"
  - Confirm modal · "Retirar X € · descompta del wallet projecte · topup al teu wallet personal"
  - Verifica que `partyId` correspon al `@handle` del operador actual (`resolveCurrentMember`) · refuse altres
- Auto-tx · consume project wallet + topup personal wallet amb refs encadenats

#### Sprint E · Cost unificat + telemetria APIs (~1.5h)
- `costTrackingService.js` nou · agrega:
  - IA: tokens × pricing del `Orchestrator.callLLM`
  - Permaweb: 0.05€ per publish/revoke · més bytes en futur
  - Blockchain: gas estimat per a futurs sprints (PACT-001 sprint D ja anticipa)
- UI · nou widget al `/savings` o `/wallet` · "Breakdown del consum del wallet projecte X" amb stacked bar per categoria
- KM-001 ja té telemetria IA pruning · reuse-la

#### Sprint F · Federació projectes públics al permaweb (~3h)
- Schema `public_project_entry` similar a `public_registry_entry`:
  - `projectId` · `ownerDid` · nom · descripció · sectorId · subtype · estat
  - `lookingForSkills[]` · `lookingForSectors[]` · stakeholders count
  - Signed ECDSA pel owner
- `publishProjectToPermaweb({projectId, ownerProjectId})` · cost 0.05€ · igual flow que PERM-USER-001
- Vista `/opportunities` · llistat de projectes públics descobrits via GraphQL · filtres per sector/skill · botó "📩 Sol·licitar unir-me"
- Sol·licitud · genera `join_request` signat · pot anar al permaweb (cost) o quedar local (free) i sincronitzar amb el owner per export/import

### UX simple proposat (la "experiència @alvaro")

```
1. /onboarding (alfa primera vegada)
   ─ Hola! Configurem el teu SOS local-first
   ─ [💶 Carrega 5€ al teu saldo personal · descompta de la teva targeta via Stripe]
   ─ "Aquest saldo cobreix · IA queries · permaweb · blockchain fees · TOT"
   ─ "Cap dada es comparteix · només pagues el cost real + un petit marge SOS"
   ─ [⏭ Salta · ja ho faré després]

2. /identity
   ─ Saldo personal: 5,00€  [↗ Recarrega]
   ─ El teu DID local · publica al permaweb (0,05€ del saldo personal)

3. /dashboard → "+ Nou projecte"
   ─ El projecte té el seu propi wallet (separat del teu personal)
   ─ "Vols transferir saldo del teu personal al projecte?" [Sí · 1€] [No]

4. Treballes al projecte
   ─ Cada query IA · cada permaweb publish · cada blockchain tx descompta
     del wallet del projecte (no del personal)
   ─ Si el projecte queda sense saldo · prompt "Recarrega projecte des de
     personal · o des de Stripe"

5. Projecte genera ingressos (manual o via Stripe)
   ─ topup amb source='income' al wallet projecte
   ─ AUTO: 20% queda com 'operating-reserve' (futurs APIs/fees)
   ─ AUTO: 80% disponible per claim dels stakeholders segons Slicing Pie

6. /value-accounting
   ─ Veus el teu pie · 35% del projecte
   ─ Saldo claim disponible · 28€ (35% de 80€ disponible)
   ─ [💸 Retirar 28€ al meu personal]

7. Saldo personal augmenta · pots usar-lo per altres projectes,
   permaweb publishes, o retirar a credit card via Stripe Connect
   (sprint futur)
```

### Decisions estratègiques pendents de consensuar amb @alvaro

1. **Personal wallet · global o per handle?** · Recomanació: per handle (un wallet per `matriu_member`)
2. **Auto-distribució · default % d'operating reserve** · Recomanació: 20% (cobreix IA mensual normal)
3. **Stripe pricing** · cost real + quin marge SOS? · Recomanació: cost real + 5% marge (10€ usuari paga · 9,50€ entren al wallet, 0,50€ marge SOS)
4. **Stripe Connect per a withdraw a credit card** · sprint X futur · cal Stripe Connect Express compte
5. **Federation /opportunities · qui paga publish del projecte?** · El project wallet (no el personal del founder) per coherència

### Implementació immediata (Sprint A · sense xarxa)

Comencem **avui** amb Sprint A · wallet personal + transferència. Té zero deps · zero risc · base per a tot el plà. Sprints B-F segueixen quan @alvaro confirmi les decisions.

---

## PERM-ALFA-001 · Permaweb Index unificat + flow alfa creador/worker (input @alvaro 2026-05-12)

> Petició literal · "haz un plan de ux superclaro y simple para el usuario
> de todo lo registrable en la permaweb para empezar a generar la alfa
> operativa que permite a personas trabajar de forma descentralizada y
> desarrollar el flujo de trabajo de el creador de proyecto y del worker
> que hace entregables · que en el registry salgan todos los elementos
> registrados en la permaweb · que el flujo de comprar saldo con stripe
> esté perfectamente integrado con el uso de apis de ia, en permaweb y
> en blockchain o sistemas de timestamping · enseñar haciendo".

### Decisió de scope

Reframe del Registry com a **Permaweb Index** — una sola pantalla on
l'usuari veu *tot* el que SOS pot pujar a permaweb: perfils, projectes,
workshops, mercat, SOPs, work orders. Avui només els **perfils** tenen
flow publish real (`PUBLIC_REGISTRY_TYPE`); la resta apareixen
visualment al mateix índex com a **local · no publicat** amb borda
discontínua i etiqueta "🛈 properament" perquè:
1. L'usuari descobreix d'un cop què és registrable.
2. Cada vista (Workshops, Mercat, SOPs, Kanban) sap on portar el botó
   "Publica al permaweb" quan obrim el sprint corresponent.
3. La feina de canalitzar al permaweb es fa **incremental** sense
   trencar l'UX general.

### Estat post-sprint (què queda després d'aquesta sessió)

| Peça | Estat | On |
|---|---|---|
| `RegistryView` rebatejat com a *Permaweb Index* | ✅ | `js/views/RegistryView.js` |
| `INDEX_TYPES` catalog (perfil + projecte + workshop + mercat + sop + wo) | ✅ | mateix fitxer |
| Filtres per tipus + counts dinàmics | ✅ | chips `data-type-chip` |
| Distinció visual real vs mock vs local · 6 stat cards | ✅ | `_renderStats` |
| Badge per estat (verificada · mock · revocada · local) | ✅ | `_cardHtml` |
| Llegenda explicativa "enseñar haciendo" inline | ✅ | `.rg-hint` |

### Sprint plan A → E (alfa creador + worker)

#### Sprint A · Permaweb Index unificat (✅ DONE · ~1.5h)
Inclòs en aquesta entrega. Veure secció anterior.

#### Sprint B · Dashboard onboarding 4 passes (~2h · pendent)
Al Dashboard, card horitzontal nova `🌐 Activa la teva alfa permaweb`
amb 4 steps detectats automàticament:
- **1. Perfil signat** · check si `matriu_member` té DID+JWK · cta `/identity`
- **2. Saldo carregat** · check si wallet personal > 0€ · cta `/wallet` (Stripe Payment Link 5€/10€/25€)
- **3. Primer projecte creat** · check si l'usuari té algun projecte propi · cta `+ Nou projecte`
- **4. Primer publish a permaweb** · check si `arweaveTxId` al perfil · cta `/identity` (toggle "Publicar")

Progress bar de 0-4 + missatge contextual a cada step ("Et falten X€ per…").
Disposem ja de tots els services (`walletService`, `identityService`,
`publicRegistryService`). Sols cal un `dashboardOnboardingService.js` que
calculi els 4 booleans i una card al `DashboardView`.

#### Sprint C · Wizard projecte enriquit + flow Federation (~4h · pendent)
Reescriu el modal de creació de projecte (avui simple) com a wizard de
4 passes amb scrolls verticals discrets:
1. **Sector + subsector** · selector sector (A-S KnowledgeLoader) + subtipus dinàmic (`sectorSubtypes.js` ja existeix)
2. **Roles + deliverables** · plantilla pre-fill segons subsector · usuari ajusta amb +/-
3. **Productes + workshops** · si el sector té oferta SOS-compatible (sector M, K, B…), pre-fill cataleg base
4. **Mapa de valor** · 1-3 flows de valor associats als entregables (preview ValueMapView)

Al final del wizard, oferir directament:
- "Publica el projecte al permaweb" → necessita `publicProjectService.js` (encara per implementar · veure següent)
- "Comparteix-lo amb el meu equip" → genera enllaç `#/project/{id}` signat

Dep nou: `js/core/publicProjectService.js` amb
`PUBLIC_PROJECT_TYPE='public_project_entry'`,
`extractPublicFieldsFromProject()`, `publishProjectToPermaweb()` —
mateix patró que `publicRegistryService` però amb camps de projecte
(name · sector · subsector · purpose · roles[] · deliverables[]) i
defensiu (refusa wallets · workOrders · ledger · contributions).

#### Sprint D · Worker flow al `/kanban` (~3h · pendent)
El worker entra al `/kanban`, veu work orders amb status `open`
(claim-ables), els pot reclamar i passar per estats:
`open → claimed → in-progress → evidence → done → ledger`. A "evidence"
puja una prova (text + opcional file hash · ja tenim ECDSA sign).
Quan passa a `ledger` es genera automàticament un `value_contribution`
(VAL-001 ja ho fa parcialment · cal completar el cicle).

Afegir 2 columnes noves al kanban: "Reclamar" (per workers que no són
owners) i "Evidència" (workers han d'aportar abans de `done`).

#### Sprint E · Stripe + categorització de despesa (~2h · pendent)
Al header global, badge persistent `💳 Saldo · 12,40€` que:
- Pots clicar i s'obre dropdown amb breakdown per categoria (IA · permaweb · blockchain · timestamping · stakeholder)
- Si baixa de 1€, popup auto suau "Et queden 0,87€ · vols recarregar?" amb shortcut 5€/10€/25€
- Cost històric: `costTrackingService.js` nou que llegeix `wallet_movement` i classifica per `category` (heuristica `source` field)

Vincular a `ALPHA-STRIPE-001` (ja té Payment Links) i a `FUND-FLOW-001`
(ja té wallet personal). Sols cal:
1. Capa de **classificació** dels moviments existents (ja són etiquetats
   amb `source` · sols cal taxonomia · 6-10 categories).
2. Capa de **visualització** (badge + dropdown + popup recharge).
3. **Webhook Stripe automàtic** (resta `FUND-FLOW-001 sprint B` · cal
   Netlify Function que escolta `checkout.session.completed` i crida
   l'API SOS local per actualitzar el saldo). Sense webhook l'usuari
   ha de confirmar manualment ("✓ He pagat") · ja operatiu avui.

### Cross-cutting · "Enseñar haciendo"
- Cada step del Dashboard té un tooltip `🛈 Per què això?` que obre el
  micro-explainer (~3 frases · DocsService).
- El Permaweb Index té llegenda inline ja afegida.
- Wizard de projecte: cada camp té placeholder amb exemple real del
  sector seleccionat (pre-pre-fill amb el corpus KB).
- Kanban worker: tooltips a cada estat ("Què passa quan reclamo? Pago
  res? No · sols et compromets a entregar X dies").

### Capes futures (no en aquesta alfa)
- **PERM-AGENT-001** · prompts d'agent al permaweb · cada agent SOS és un
  registre signat amb la seva system prompt + model + temperatura ·
  qualsevol SOS local pot importar-lo i executar-lo amb el seu saldo.
- **PERM-LEGAL-001** · ancoratge OpenTimestamps + eIDAS · cada tx
  Arweave porta un OTS anchor per validesa legal probada.
- **PERM-TRUST-001** · trust scoring · els SOS locals signen
  attestations de la fiabilitat dels altres operadors · agregació
  ponderada del permaweb (Web of Trust simplificat).

### Decisions pendents @alvaro
1. **Ordre B-E** · default proposat: B (dashboard onboarding) primer per
   guiar usuaris nous · després E (Stripe + cost tracking) per donar
   visibilitat real · després C (wizard projecte) · finalment D (worker
   flow). Justificació: B i E són transversals · C i D són profundes
   per rol.
2. **Mock mode default en alfa pública?** · Recomanació: SÍ ·
   `setPermawebMockEnabled(true)` per defecte · l'usuari ha d'opt-out
   activament quan carrega saldo Turbo real.
3. **Worker pot crear projectes?** · Recomanació: SÍ · cada operador
   SOS és sempre creator+worker (la distinció és per rol dins d'un
   projecte concret, no a nivell d'usuari).

---

## PROJ-QUALITY-001 · Project completeness tracker al Dashboard (input @alvaro 2026-05-12)

> "Vull poder veure al Dashboard el seguiment del grau de qualitat i
> completat d'un projecte · si té una bona landing amb presentació i
> productes, mapa de valor amb roles/transaccions/entregables adaptats
> de forma òptima, totes les SOPs operatives, i el contingut formatiu
> / workshops."

### Estat actual (què ja existeix)
- `projectHealth(proj)` a `DashboardView.js:43` · calcula score 0-100 a
  partir de roles + transactions + intangibles + neighbors. **Útil pero
  parcial** · sols cobreix el mapa de valor.
- `healthColor(score)` · llindar 75/50/<50 (verd/taronja/vermell).
- Cada card de projecte ja mostra `score` color-coded a la dash.

### Què cal afegir
Un score multidimensional · 5 capes ponderades · cada capa retorna
{score, missing[], cta} perquè la UI guiï l'usuari "què et falta".

| Dim | Pes | Check | Senyal "complet" |
|---|---|---|---|
| 🎨 **Landing** | 20% | té `purpose` (≥60 chars) · ≥1 product/service al market · presentation IA generada (`presentationCache`) | landing pot ser pública |
| 🗺 **Value map** | 30% | `projectHealth` (l'existent) · ≥3 roles · ≥5 transactions · ≥1 intangible · ≥1 cicle | mapa narratiu coherent |
| 🚚 **Deliverables** | 15% | cada role té ≥1 deliverable associat · cada deliverable té owner declarat | flux d'entregables traçable |
| 📋 **SOPs** | 20% | cada role té SOP (`type:'sop'` amb `roleId` match) · cap SOP draft sense contingut | operativa replicable |
| 🎓 **Workshops** | 15% | ≥1 workshop per audience type del projecte · ≥1 workshop públic (federable) | contingut formatiu mínim |

**Score total** = Σ (capaScore × pes) · 0-100 · mateixos llindars
75/50 que avui.

### Sprint plan A → C (~5h total)

#### Sprint A · `projectQualityService.js` pur (~1.5h)
- Nou `js/core/projectQualityService.js`:
  - `QUALITY_DIMS = [{id, weight, label, icon}…]` const exportada
  - `computeQualityScore(project, { sops, workshops, marketItems })` pur · retorna `{ total, byDim:{landing, valueMap, deliverables, sops, workshops}, missing:[…] }`
  - Cada `byDim[X]` és `{score:0-100, missing:[{label, cta:{href, label}}…]}`
  - **Pur** · zero KB.query · l'arg `{sops, workshops, marketItems}` ja arriba pre-carregat
- Tests · ~25 asserts amb projectes mock (`js/tests/projectQuality.test.js`)
- Integració package.json scripts.test

#### Sprint B · Card al Dashboard per cada projecte (~2h)
- Modificar `_renderProjects()` a `DashboardView.js`:
  - Pre-carregar workshops + sops + market amb 3 KB.query batched
  - Per a cada project card, calcular `computeQualityScore` i renderitzar:
    - Score gran (substitueix l'`projectHealth` actual o el complementa)
    - Mini radar (5 punts · CSS gradient sense D3) amb les 5 dims
    - Hover → tooltip llista els 3 missing principals + cta
- Filtre nou "Qualitat" al phase chips (`🌟 ≥75 · ⚠ 50-74 · ❌ <50`)

#### Sprint C · Vista detall `/quality?project={id}` (~1.5h)
- Nova vista `ProjectQualityView.js` que expandeix les 5 capes:
  - Una secció per dim · llista missing[] amb cta directa a la vista correcta
  - Botó "Ompli amb IA" per dim (cost ~150 tokens · genera draft que usuari pot acceptar/editar)
  - Botó "Marcar com a no aplicable" per dim (algunes orgs no necessiten Workshops)
- Link "Veure detall →" a cada card del Dashboard
- Tests · 10 asserts UI binding

### Tradeoffs i decisions pendents @alvaro
1. **Pesos** · proposats 20/30/15/20/15 · podem revisar després de veure projectes reals. Recomanació: començar així, ajustar a Ola 21.
2. **Substitueix o complementa `projectHealth`?** · Recomanació: **el substitueix** · la nova `valueMap` dim equival a l'existent.
3. **"No aplicable" per dim** · ¿permitir-ho? · Recomanació: SÍ · alguns projectes no tenen workshops (ex. consultoria 1:1).
4. **IA fill-in cost** · 5 dims × 150 tokens = ~750 tokens per "auto-completar" un projecte. Acceptable amb saldo prepagat.

---

## WALLET-AUTH-001 · Wallet connect + OAuth · identificació "des de qualsevol lloc" (input @alvaro 2026-05-12)

> "Vull que un usuari es pugui identificar des d'on sigui amb un
> criptomoneder per WalletConnect o similar, tenint en compte que al
> usar permaweb i possiblement blockchains hem de buscar la màxima
> usabilitat per usar wallets per signatures i identificació; però
> també hem de permetre OAuth que tenim pendent."

### Tesis · 3 camins compatibles
SOS V11 ja té AUTH-001 sprint A verd (identitat local-first ECDSA P-256
+ DID `did:sos:{32hex}`). Sprints B (wallet binding) i C (OAuth) estan
groc · això és el plà concret per tancar-los amb la millor UX possible:

1. **Local-first** (ja existeix) · usuari arriba al SOS i té DID al
   instant · firma local · per a operadors offline
2. **Wallet cripto** (sprint B refinat) · ArConnect/Wander per permaweb
   + WalletConnect v2 per EVM (Ethereum, Gnosis, Optimism, Arbitrum,
   Polygon, Base) · per a operadors que volen control complet de claus
3. **OAuth** (sprint C) · GitHub/Google/email magic-link · per onboarding
   ràpid de stakeholders no-cripto (subscriptors workshops, comentaris
   community, etc.)

Els tres alimenten el **mateix node `user_identity`** ampliant
`wallets[]` i `oauthProviders[]`. La firma del DID local és la canònica
per a publicació al permaweb (signa entries) · els wallets externs i
OAuth són signatures complementàries que afegeixen capes de verificació.

### Sprint A · ArConnect/Wander auto-detect (1.5h · alfa-blocker)
SOS ja porta Turbo SDK amb keyfile JSON. Refactor cap a UX més neta:
- Detecció auto de l'extensió `window.arweaveWallet` (ArConnect ·
  Wander). Si està disponible, mostrar "🦊 Connect Wander" enlloc
  d'arrossegar JSON
- `arweaveWalletService.connectExtension()` · crida `wallet.connect([
  'ACCESS_ADDRESS','ACCESS_PUBLIC_KEY','SIGN_TRANSACTION'])`
- Reutilitza `wallet.dispatch(tx)` per a uploads · Turbo SDK ja pot
  treballar amb signers externs
- Keyfile JSON segueix vivint com a fallback per a Catalina/Safari vell

### Sprint B · WalletConnect v2 + Web3Modal · EVM (3h)
- Dependència `@reown/appkit` (anteriorment Web3Modal v5) · ESM compatible
  · WalletConnect v2 nativament · suporta 150+ wallets EVM
- `js/core/walletConnectService.js` nou:
  - `initAppKit({ projectId, chains })` · projectId obtingut a cloud.reown.com
  - `openModal()` · trigger del modal de selecció wallet (MetaMask, Rainbow,
    Coinbase Wallet, Trust, Ledger Live…)
  - `signMessage(msg)` · EIP-191 personal_sign · per vincular wallet al DID
  - `getConnectedAddress()` · accessor amb cache + watch reconnect
- Vinculació wallet → identity:
  1. Usuari clica "Connect wallet" a /identity
  2. AppKit modal apareix · usuari escull
  3. SOS demana signar nonce `"SOS V11 link · DID=did:sos:XXX · ts=YYY"`
  4. Si signatura verifica (recover address == connected), s'afegeix al `wallets[]` amb `verifiedAt: ts`
  5. Si l'usuari prové d'una URL d'invitació (cohort · Matriu · projecte), s'auto-vincula també l'`invitedBy`
- Per a la firma de publicació permaweb · seguim usant la clau ECDSA
  local · el wallet EVM és per "owner attestation" no per signar entries
  (Arweave necessita RSA-4096, EVM no)

### Sprint C · OAuth amb Netlify Functions (2.5h)
- Netlify Function `auth/oauth-callback.js` · gestió generic OAuth
- 3 providers en alfa: GitHub · Google · Magic-link (email + Resend.com)
- Frontend:
  - "Connect with GitHub/Google" buttons a /identity
  - Magic-link: input email · "Send link" · click email → torna amb token de sessió
  - Token rebut s'usa per:
    - Afegir `oauthProviders[]` al user_identity (storage local)
    - Generar un `verifiedAt` que pot servir com a proof of identity
      (signat amb la clau local SOS)
- **NO és identitat principal** · sols verificació opcional ("aquest DID
  pertany al GitHub @x"). El DID segueix sent l'identificador canònic.

### Sprint D · UX unificada · botó únic "Identifica't" (1.5h)
- A /identity (i a un widget top-right de la global-nav), botó únic
  "🔑 Identifica't" obre modal amb 3 tabs:
  - **🦊 Wallet** (Wander · WalletConnect · MetaMask)
  - **🪪 OAuth** (GitHub · Google · Magic-link)
  - **💾 Local-first** (DID generat al teu dispositiu · default si no fas res)
- Cada tab té copies explicatives ("Per què triar això?") amb tradeoffs
  privacitat/portabilitat/funcionalitat
- Després de connectar, modal mostra ✓ verd + DID actiu + wallets/providers vinculats

### Decisions pendents @alvaro
1. **WalletConnect projectId** · cal registrar a cloud.reown.com (free tier ok)
   o usem un placeholder en alfa? · recomanació: registrar avui (1 min) i
   guardar a settings local
2. **OAuth scope mínim** · GitHub: `read:user` · Google: `profile email` ·
   Magic-link: sols email. Recomanació: scope mínim · zero permís d'escriure
3. **Quin wallet és canònic per signatures permaweb?** · l'Arweave RSA
   wallet (Wander/ArConnect) · els EVM són complementaris
4. **Recuperació de DID** · si l'usuari perd el dispositiu, recupera
   via OAuth + signatura wallet? · recomanació: SI · "tens 2 de 3" recuperes

### Visió futura (no en aquesta alfa)
- **DID en lloc · Ceramic Network · ENS subdomain** · `alvaro.sos.eth` resol al DID
- **Passkey/WebAuthn** · firma biometricament al mòbil sense wallet ni OAuth
- **Verificable Credentials** · cohort 0 emet VC signada per @alvaro · l'usuari guarda al seu wallet

---

## FOUNDER-001 · Plantilla projecte fundacional · @alvaro com a founder (input @alvaro 2026-05-12)

> "Aclareix com configurar SOS perquè hi hagi un pas que es faci com el
> founder i creador del projecte · m'agradaria que generessis com a una
> altra plantilla dinàmica amb accés des de permaweb."

### Tesi
SOS necessita un projecte "manifest" que actua com a:
1. **Bootstrap** · seed clonable per a nous operadors que volen entendre
   què és el mètode (vegen un projecte ben omplert · poden veure cada
   secció amb dades reals)
2. **Llinatge** · projecte signat per @alvaro que es publica al permaweb
   amb versionat · el "founder commit" del moviment
3. **Demostració d'auto-referent** · el SOS és un projecte SOS · el
   founderTemplate genera el projecte que descriu com es manté el SOS

### Estat post-sprint A (ja a producció)
`js/core/founderTemplate.js` (~180 LOC · pur) genera:
  - 1 project amb sector A · cohort 0 · projectType `foundational-network`
  - **9 roles** (visioner · arquitecte · narrador · matriuger · sentinel ·
    curator · token-econ · connector · founder-anchor) amb castell_level
    i typical_actor
  - **12 transactions** descrivint els flows essencials del moviment ·
    inclou 5 intangibles + 2 cicles recíprocs (per puntuar 90+ a /quality)
  - **5 SOPs** operatius (onboard cohort · publish · audit · pricing · cohort)
    cadascun amb 5-7 steps i roleId vinculat
  - **3 workshops** amb accessTier (public · operator · cohort) alineats
    amb WORKSHOPS-FED-001
  - Camps top-level pre-omplerts (purpose · description · presentation_narrative_v1)
    perquè el projectQuality doni score ≥85 de partida

### Sprint plan B → D (pendents · ~5h)

#### Sprint B · UI "Clonar founder template" al wizard (~1.5h)
- Modal `+ Nou Projecte` · nova opció radio "🌟 Founder bootstrap"
- Després de triar, mostra preview · l'usuari pot canviar el handle + sector
- A acceptar · `buildFounderProject()` + `store.dispatch(addProject)` +
  KB.upsert dels sops + workshops
- Score immediat ≥85 al Dashboard

#### Sprint C · publish del founder template al permaweb (~2h)
- A `/project/{id}` (Hub) · botó "🌟 Publish as founder template" especial
- Tags Arweave extra · `Template: founder` · `TemplateClonable: true`
- Quan un altre usuari fa `syncFromPermaweb`, veu el founder template a
  `/registry` amb un badge especial · click → "Clone aquest template"
  importa al seu KB local com a nou projecte propi
- Tracking · qui clona el template? Genera un node `template_clone` que
  permet a @alvaro veure adopció

#### Sprint D · Cohort 0 attestations (~1.5h)
- Cohort 0 té 108 places · cada membre signa una attestation `attests` al
  founder template ("aquest és el meu founder · m'identifico amb el moviment")
- Attestation té format propi · publicat al permaweb · construeix Web of Trust
- Vista `/matriu/network` · llista membres amb attestations actives + count

### Decisions pendents @alvaro
1. **Hi pot haver més d'un founder?** · recomanació: SÍ · cada operador pot
   crear el seu propi founder template (sector M · sector A · etc.). El
   `@alvaro` és el founder canònic del moviment SOS, però altres founders
   regionals/sectorials són benvinguts.
2. **Founder template és immutable o pot evolucionar?** · recomanació: amb
   PROJ-VERSIONING-001 cada update genera v+1 enllaçada · els clones poden
   "subscriure's" a updates o quedar-se fixats a una versió.

---

## PROJ-VERSIONING-001 · Versionat de projectes al permaweb (input @alvaro 2026-05-12)

> "En permaweb un projecte pot ser actualitzat amb un control de
> versions per tenir la última versió on-line de les dades i poder
> consultar l'històric."

### Schema (ja implementat sprint A)
Cada publish d'un `public_project_entry` ara incorpora:
```js
content: {
    entryVersion: 1,                   // monotonic increasing (1, 2, 3, …)
    previousTxId: null,                // null per v1 · txId de v-1 altrament
    // … resta de camps signables …
}
```
Tags Arweave:
```
App-Name:      SOS-V11
Entry-Type:    public-project-entry
ProjectId:     {id}
Version:       0001          ← padded a 4 dígits per ordre lexicogràfic
Previous-TxId: {txId v-1}    ← absent per v1
```
El padded `Version: 0001` permet que el GraphQL gateway d'Arweave faci
sort lexicogràfic = sort numèric · fins v9999 (sprint X+ ampliem a 6 dígits).

### Helpers (ja implementats sprint A)

```js
// Pure validation · detecta gaps · forks · previousTxId mismatch
validateVersionChain(versions)  →  { valid, issues:[…] }

// Query GraphQL · retorna [v1, v2, …, vN] ordenat ASC
await getProjectVersionHistory({ projectId, gqlUrl, first, fetchFn })

// Convenience · agafa l'últim element del history
await getLatestProjectVersion({ projectId, … })
```

### Defenses
1. **Build defensive** · `buildPublicProjectEntry({ entryVersion:2 })` sense
   `previousTxId` llança · evita orphan versions
2. **Validation defensive** · `entryVersion` ha de ser enter positiu ·
   1.5 o 0 throws
3. **Chain integrity** · `validateVersionChain` detecta gaps · forks ·
   previousTxId mismatch · v1 amb previousTxId

### Sprint plan B → D (pendents · ~5h)

#### Sprint B · UI versionat al ProjectHubView (~1.5h)
- Botó "📝 Publish update" (enlloc de "Publish" si ja és v>1)
- Mostra "v3 → v4" amb diff preview · usuari confirma · auto-incrementa
- Després de publish reeixit · actualitza store amb `arweaveTxId` nou +
  `entryVersion` nou + `previousTxId` apuntant a l'anterior

#### Sprint C · Historial visual al /quality o /project (~1.5h)
- Card nova "📜 Historial permaweb" amb timeline · click v3 obre preview
- Diff entre versions amb highlight de canvis (per dim · landing · valueMap · etc.)
- Botó "Rollback to v2" · genera v4 amb mateix contingut de v2 (no destructiu)

#### Sprint D · Discovery latest automàtic (~2h)
- `RegistryView` · per a cada public_project_entry, fetcha automàticament
  el latest version (cache 15min)
- Badge "v3 (last update fa 2 dies)" sobre la card
- Si l'usuari ha clonat la v1 i ara hi ha v3 disponible, banner "🛈 Versió
  nova del template disponible · veure canvis"

### Decisions pendents @alvaro
1. **Revoke d'una versió** · revoke v2 sense afectar v3? · recomanació:
   revoke porta tag `Entry-Type=revocation` apuntant al txId · l'usuari
   pot revoke versions concretes
2. **Schema migration entre versions** · si v3 afegeix un camp nou,
   què passa amb els clones de v2? · recomanació: schema additiu sempre ·
   camps nous null als clones · defensive parsing
3. **Cost** · cada publish costa 0,05€ · projectes amb 10+ versions
   acumulen 0,50€ · acceptable? · recomanació: SÍ · és barat i el valor
   d'historial real > cost
4. **Mutable references** · com referenciar "el founder template a la
   v latest" sense haver d'actualitzar el txId? · recomanació: ANS-104
   Bundlr permet "named references" futur · de moment usar /api/latest-version
   endpoint a Netlify Function (sprint X)

---

## IA-ROUTER-001 · Routing matrix IA · 5 providers · escalation per qualitat (input @alvaro 2026-05-12)

> "Defineix-me quines IAs de les que tinc apis · Anthropic · Gemini ·
> ChatGPT · DeepSeek · Minimax · em serveixen per a la màxima
> eficiència en cada ús de IA per optimitzar costos · i només en cas
> de necessitar arribar als tests de qualitat usar el model superior."

### Filosofia
SOS V11 té API keys de **5 providers**. Cada tasca té característiques diferents
(creativa · estructurada · raonament · multimodal · curt-vs-llarg) i cada
provider té modèls amb perfils preu/qualitat diferents. La filosofia:

1. **Default · model més barat viable** per al tipus de tasca (no el millor en absolut)
2. **Avaluador automàtic** mira l'output (cost ~$0.001 amb Haiku/Flash-Lite)
3. **Si l'avaluador rebutja**, retry amb model `fallback` (qualitat mig)
4. **Si encara rebutja**, escalate a `premium` (Opus 4.7 · GPT-5 · DeepSeek R1)
5. Si tot falla, retorna el millor output disponible amb flag `escalatedExhausted`

Resultat · **una crida ~80% més barata** que sempre usar el model premium,
sense sacrificar qualitat a les tasques difícils.

### Matriu de routing (sprint A · ja implementat)

Catàleg de **12 modèls** repartits per provider/tier:

| Provider | Modèls | Tier preu | USD/1M (in/out) | Quality |
|---|---|---|---|---|
| Anthropic | Opus 4.7 | frontier | 15.00 / 75.00 | 5/5 |
| Anthropic | Sonnet 4.6 | mid | 3.00 / 15.00 | 4/5 |
| Anthropic | Haiku 4.5 | small | 1.00 / 5.00 | 3/5 |
| OpenAI | GPT-5 | frontier | 1.25 / 10.00 | 5/5 |
| OpenAI | GPT-4o | mid | 2.50 / 10.00 | 4/5 |
| OpenAI | GPT-4o-mini | small | 0.15 / 0.60 | 3/5 |
| Gemini | 2.5 Pro | large | 1.25 / 10.00 | 4/5 |
| Gemini | 2.5 Flash | small | 0.15 / 0.60 | 3/5 |
| Gemini | 2.5 Flash-Lite | micro | 0.075 / 0.30 | 2/5 |
| DeepSeek | V3 | mid | 0.27 / 1.10 | 4/5 |
| DeepSeek | R1 (reasoner) | mid | 0.55 / 2.19 | 5/5 |
| Minimax | M2 | small | 0.30 / 1.20 | 3/5 |

Routing per task kind (`TASK_ROUTING` a `aiRouterService.js`):

| Tasca | Primary (barata) | Fallback (mid) | Premium (top) | Evaluator |
|---|---|---|---|---|
| `summary-short` | gemini/2.5-flash-lite | anthropic/haiku-4.5 | anthropic/sonnet-4.6 | haiku-4.5 |
| `schema-fill-simple` | gemini/2.5-flash | deepseek/v3 | anthropic/sonnet-4.6 | haiku-4.5 |
| `creative-narrative` | anthropic/sonnet-4.6 | openai/gpt-4o | **anthropic/opus-4.7** | deepseek/r1 |
| `value-map-design` | anthropic/sonnet-4.6 | deepseek/r1 | **anthropic/opus-4.7** | deepseek/r1 |
| `sop-structured` | deepseek/v3 | anthropic/sonnet-4.6 | anthropic/opus-4.7 | haiku-4.5 |
| `workshop-outline` | gemini/2.5-flash | anthropic/sonnet-4.6 | anthropic/sonnet-4.6 | haiku-4.5 |
| `code-generation` | deepseek/v3 | anthropic/sonnet-4.6 | anthropic/opus-4.7 | deepseek/r1 |
| `quality-audit` | deepseek/r1 | anthropic/sonnet-4.6 | anthropic/opus-4.7 | opus-4.7 |
| `deep-reasoning` | deepseek/r1 | gemini/2.5-pro | anthropic/opus-4.7 | opus-4.7 |
| `multimodal-image` | gemini/2.5-flash | openai/gpt-4o | gemini/2.5-pro | haiku-4.5 |
| `tag-generation` | gemini/2.5-flash-lite | anthropic/haiku-4.5 | anthropic/haiku-4.5 | (none) |

### Implementació (sprint A · ja en producció)
- `js/core/aiRouterService.js` · 175 LOC · pur · zero crides reals
- `AI_MODELS` · 12 modèls amb pricing + quality + contextK
- `TASK_ROUTING` · 11 tasques amb chain primary/fallback/premium/evaluator
- `estimateCostUsd/Eur(modelKey, {inputTokens, outputTokens})` · matemàtica pura
- `pickModelForBudget({taskKind, budgetEur, tokens})` · pick highest-quality dins budget
- `runEscalation({taskKind, generate, evaluate, ctx, stopAt})` · orquestrador agnòstic provider · es passa la funció `generate` (provider real) i `evaluate` (qualitat) i ell decideix la chain
- 43 tests cobrint catàleg + costs + routing + budget pick + escalation chain

### Sprint plan B → D (pendents · ~6h total)
#### Sprint B · provider adapters (~2h)
- `js/core/aiProvider.js` · capa fina d'adaptació `generate(modelKey, prompt, ctx)` que mira `AI_MODELS[modelKey].provider` i crida l'endpoint corresponent
- 5 adapters · anthropic · openai · gemini · deepseek · minimax
- Cada adapter usa API key configurada a /settings (mai al codi)
- Counts tokens reals retornats per al cost real (no estimat)

#### Sprint C · evaluadors per task kind (~2h)
- `js/core/aiEvaluator.js` · funcions per validar shape + qualitat semàntica
- Per `schema-fill-simple` · JSON shape check + missing fields detection
- Per `creative-narrative` · LLM-as-judge amb Haiku · score 0-1
- Per `code-generation` · syntax check + estructura
- Per `tag-generation` · skip (no eval · tags són cheap)

#### Sprint D · integració a aiFill (~2h)
- `iaContextService.aiFillLanding` etc usa `runEscalation` amb evaluate corresponent
- UI mostra a `/quality?project={id}` · "Generat amb deepseek/v3 · escalated a sonnet-4.6 (raó: missing field 'tagline')" per a transparència
- `ai_audit` node registra TOTS els intents (primary + fallback + premium) amb cost individual

### Decisions pendents @alvaro
1. **USD→EUR conversion rate** · default 0.92 · actualitzable a /settings · prou per a alfa?
2. **Override per usuari** · permitir a /settings que l'usuari triï "sempre Opus" o "sempre el barat sense escalation"? · recomanació: SÍ amb avís de cost
3. **DeepSeek R1 amb reasoning trace inclòs** · el reasoner mostra el "thinking" abans del response · cobrar tokens del trace o ocultar-los? · recomanació: cobrar (és cost real)
4. **Minimax M2** · està al catàleg però no té task kind primari · ús futur per a workshops amb àudio/video · justificat?

---

## IA-CONTEXT-001 · Prompts auditoria amb context intel·ligent + import links (input @alvaro 2026-05-12)

> "Em sembla molt bé el plantejament orientat a l'auditoria de prompts
> amb eficiència de context intel·ligent i accés als nodes de context
> actualitzats relacionats · per a la landing es pugui importar info o
> links per a la IA i la seva creació de landing/products/map/sop/SOCs
> que els tenim oblidats amb només els de TeamTowers desenvolupats."

### Diagnosi · què passa avui
- El KB té **corpus profund per al sector S** (Castellers · Fent Pinya · 108 places) i **resta de sectors són plantilles base poc enriquides**. Quan l'usuari crea un projecte d'un altre sector, la IA tira de prompts genèrics i el output és superficial.
- A `js/core/sectorSubtypes.js` ja tenim 19 sectors amb 10-20 subtipus cadascun · però no estan connectats amb un corpus de SOPs · workshops · SOCs concrets per sector.
- Els botons "🧠 Ompli amb IA" del `/quality?project={id}` són stubs · necessiten una capa de service per consumir context i generar drafts.

### Aproximació
Reframe l'IA fill-in com a **"auditoria de prompts amb context"** · 3 capes:

| Capa | Què fa | Cost token |
|---|---|---|
| **1. Context collector** | Llegeix nodes KB relacionats: sector readiness · perfils similars · projectes públics del permaweb · workshops del coop/cohort · SOPs verificades del directori | 0 (lectura local) |
| **2. Prompt builder** | Combina context + dim objectiu + user input opcional (URLs · text lliure · imatges) · genera prompt curt amb tot el que necessita | 0 |
| **3. IA generador** | Crida al provider IA · usa el saldo del wallet del projecte · retorna draft per accept/edit/reject | ~150-400 tokens per dim |

### Sprint plan A → D (~10h total)

#### Sprint A · iaContextService.js pur (~2h)
Service nou amb 5 funcions una per dim:
- `buildLandingContext({ project, sector, marketItems, similarProjects })` · retorna prompt-ready text
- `buildValueMapContext({ project, sector, similarProjects, criticalRoles })`
- `buildDeliverablesContext({ project, valueMap })`
- `buildSopsContext({ project, role, similarSops, sectorReadiness })`
- `buildWorkshopsContext({ project, sector, similarWorkshops, audience })`

Cada funció retorna:
```js
{ systemPrompt: string, userPrompt: string, contextTokens: number, refs: { nodeId: string, type: string }[] }
```

Tests · 25 asserts amb fixtures (sector A · sector M · sector S complet).

#### Sprint B · URL/file import pre-fill (~2h)
A `/quality?project={id}` afegir abans del botó "🧠 Ompli amb IA":
- Input "📎 Afegeix context · URL · text · imatge"
- Acceptable: URLs (es descarrega text via Cloudflare Workers proxy · 100KB max) · text lliure · PDF (sprint futur)
- El contingut va al **userPrompt** de la dim corresponent · pesat amb cap de 2000 tokens (truncar amb sumari IA si supera)

#### Sprint C · Generadors per dim (~4h)
- `aiFillLanding({ project })` · genera description (60-200 chars) + 2 productes draft (al market) + presentation_narrative_v1
- `aiFillValueMap({ project })` · suggereix roles + transactions amb proposta narrativa (no auto-persist · usuari accepta cada un)
- `aiFillSops({ project, roleId })` · per role · 5-7 steps amb body markdown · accept/edit/persist
- `aiFillWorkshops({ project })` · 2-3 workshops base amb outline + accessTier='public' (alineat WORKSHOPS-FED-001)
- Cada generador consumeix saldo via `walletService.consumeAndPersist({ source:'ai-fill-{dim}' })` · refund automàtic si fail

#### Sprint D · Audit log + cost tracking (~2h)
- Cada draft IA genera un node `ai_audit` amb { dim, projectId, prompt, response, tokensUsed, costEur, refs, accepted:bool, timestamp }
- Vista `/efficiency` · ja existeix · ampliem amb tab "Drafts IA" mostrant top 20 + budget per dim
- Tradeoff IT: si l'usuari accepta el draft, costEur queda imputat al projecte · si refusa, queda imputat però marcat com a `wasted` (mètrica per refinar prompts)

### Decisions pendents @alvaro
1. **Proveïdor IA default** · Anthropic (Sonnet 4.6 · ~$0.003/1k input · $0.015/1k output) recomanat per qualitat narrativa
2. **Token budget per dim** · proposat 400 input + 300 output = ~1¢ per crida · acceptable
3. **Edit-before-accept vs auto-persist** · recomanació: SEMPRE edit-before-accept per a alfa · evita drafts dolents persistits
4. **Cohort 0 / projectes Matriu poden compartir SOPs amb la xarxa?** · si SI · necessitem `publicSopService.js` futur (similar a publicProjectService)

---

## PERM-DISCO-001 · Discovery global · usuaris i dades SOS al permaweb (input @alvaro 2026-05-12)

> "Vull tenir accés al llistat global de usuaris registrats al permaweb
> · i en futurs sprints a altres dades de SOS · serà al backlog."

### Què ja tenim
- `publicRegistryService.queryPermawebRegistry({ entryType:'public-registry-entry' })` ja consulta GraphQL d'Arweave (`arweave.net/graphql`)
- `syncFromPermaweb({ verifyOnSync })` fa el cicle complet: query → fetch → verify → cache KB
- Vista `/registry` ja mostra cache local · sync manual + filtres per tipus (preparat per ampliar)

### Què cal afegir
1. **Sync automàtic en background** · primer load del SOS local · sync sense bloquejar UI · cache TTL 1h foreground · 24h background
2. **Filtres avançats** a `/registry` · per skill · sector · cohort · "verificats per @alvaro" (Web of Trust simple)
3. **Mapa visual** · `/matriu/network` ja existeix amb les 108 places cohort 0 · extends per superposar tots els operadors del permaweb (clustering per geo · ⚠ requeriria opt-in d'ubicació)
4. **Public Project Index** (PERM-ALFA-001 sprint C avançat) · projectes públics indexats com a perfils
5. **Public Workshop Index** (WORKSHOPS-FED-001 sprint C avançat)
6. **Public SOP Index** (sprint Z futur) · operadors poden publicar SOPs reutilitzables amb peer-review
7. **Trust scoring** (PERM-TRUST-001) · attestations signades + agregació ponderada

### Sprint plan A → C
#### Sprint A · Background sync + UX progress (~2h)
- `syncFromPermaweb` cridada al boot del Dashboard amb `silent:true`
- Status badge ↻ al breadcrumb ("Sincronitzant amb 1247 entries permaweb…")
- Throttle a 1 sync/h (TTL `DEFAULT_TTL_MS` ja definit) per evitar abuse del gateway

#### Sprint B · Filtres + mapa (~3h)
- /registry · panel lateral amb filtres dinàmics (KB-derived facets)
- Toggle "Veure al mapa" (geographic clustering) · cap geo data sense opt-in
- Quick-link · click un operador → /n/{did} amb perfil ampliat

#### Sprint C · Discovery API (~2h)
- Helper `searchPermaweb({ query, entryType, since })` async que combina cache + sync incremental
- Useable des de qualsevol vista (ex. "afegir stakeholder al projecte · cerca al permaweb")
- Backlog per sprints futurs · Workshop · Project · SOP discovery

### Decisions pendents @alvaro
1. **Throttle del Arweave gateway** · arweave.net té rate limits soft · podem fer mirror via ardrive.io · permagate.io · turbo gateway?
2. **Trust scoring**: només peer attestations o també activitat (commits · projects shipped · workshops compartits)?
3. **GDPR**: alguns usuaris poden voler ser invisibles al public registry però seguir accessibles via cohort · cal "private cohort listing" futur

---

## BIZ-MODEL-001 · Auditoria del flow de venta + model de negoci Stripe/Wander (input @alvaro 2026-05-12)

> "Vull auditoria del flow de venda del servei perquè els usuaris
> carreguin saldo · i definim el model de negoci per a Stripe i
> Arconnect/Wander."

### Auditoria · què hi ha avui

**Stripe**
- `js/core/stripeService.js` · 235 LOC · 4 plans definits:
  - **Free** · 0€/mes · API keys pròpies · zero saldo SOS · zero permaweb
  - **Pro** · 9€/mes · saldo prepagat · proxy IA · permaweb writes
  - **Cooperative** · 19€/mes · USDC al Gnosis Safe · multiplicador cohort × 1.5
  - **Enterprise** · custom · self-hosted · SLA
- Topup presets 10/25/50/100€ · gestionats via **Stripe Payment Links** (zero secret keys al client · gold-standard pattern)
- L'usuari configura Payment Link URLs manualment a `/settings` per cada amount preset
- **Confirmació MANUAL** post-pagament · usuari clica "✓ He pagat" · `WalletView` registra `topUpAndPersist({ source:'stripe-confirmed' })`
- **BLOCKER**: no webhook · si l'usuari paga però no torna a SOS, el saldo no s'aplica · risc de fraud + UX dolent

**Arconnect/Wander · Turbo Credits**
- `js/core/arweaveWalletService.js` exposa `getTurboBalance(jwk)` · sols lectura
- Els Credits de Turbo es compren DIRECTAMENT a turbo-sdk (credit card o crypto) · **fora del SOS wallet EUR**
- Sprint A2 acabat de fer · publishes via Wander signen sense JSON · però la càrrega de Credits no està integrada a la UI SOS

**Wallet personal + project**
- `walletService.js` ja té `personalWalletIdFor()` + `getOrCreatePersonalWallet()` + `transferBetweenWallets()`
- 6 categories de moviments: topup · consume · transfer · refund · income · adjust
- Sense margin model · sense fee SOS

### Conclusió de l'auditoria

**Punts forts**
1. ✅ Arquitectura "zero secret key al client" · publishable + payment links · canònic
2. ✅ Wallet personal vs project separats · stakeholders + auto-distribució (FUND-FLOW-001)
3. ✅ Mock mode (`setPermawebMockEnabled`) · permet testejar sense gastar
4. ✅ Plans definits però NO enforced · qualsevol pot usar publish · cal afegir gating

**Gaps crítics per a alfa pública**
1. ❌ **Sense webhook Stripe** · risc de no captura · necessita Netlify Function
2. ❌ **Sense margin model real** · les fees SOS no estan declarades · només els 0.05€ publish van íntegres a Turbo
3. ❌ **Plans no enforced** · qualsevol pot fer publish · el plan check no està al `publishToPermaweb`
4. ❌ **Turbo Credits NO connectats al wallet EUR** · l'usuari paga 2 vegades (subscripció SOS + Credits Turbo independents)
5. ❌ **Sense receipts** · usuari paga però no rep PDF o equivalent · pre-alfa cal millorar

### Proposta · Model de negoci alfa

```
Usuari paga 10€ via Stripe Payment Link
    │
    ▼
┌──────────────────────────────────────────────────────┐
│ Wallet PERSONAL del usuari · 10€ EUR entren           │
└──────────────────────────────────────────────────────┘
    │
    ├─► Consum IA · directe (preu real + 5% marge SOS)
    │     · ex. Sonnet 4.6 · ~$0.018 / 1k tokens output → 1¢ + 0.05¢ marge
    │
    ├─► Permaweb publish · 0.05€ fix
    │     · de moment 100% va a Turbo Credits (SOS no en treu marge)
    │     · futur: SOS compra Credits a l'engros · marge 10%
    │
    ├─► Transfer a wallet projecte · 0€ commissió interna
    │     · usuari decideix quant funda el projecte com a stakeholder
    │
    └─► Withdraw a credit card via Stripe Connect · (Sprint X futur)
          · 1.5% comissió + 0.25€ fix · cobreix la fee real de Stripe
```

**Marge mig estimat** · 7-10% sobre consum · cobreix costos plataforma + reinverteix a desenvolupament. **Plans subscripció** queden com a "premium UX" (Pro priority queue · enterprise SLA · etc.) NO com a paywall del consum bàsic · el saldo prepagat és la unitat principal de billing.

### Sprint plan A → E
#### Sprint A · Webhook Stripe via Netlify Function (~3h · ALFA-BLOCKER)
- `netlify/functions/stripe-webhook.js` · receptor signat amb `stripe-signature` header verificat
- Trigger event · `checkout.session.completed` · llegeix `client_reference_id` (= projectId o personalWalletId) i `amount_total`
- Crida API local SOS (POST `/api/wallet/topup-confirm`) per actualitzar saldo
- Idempotència via `event.id` cache 24h (evita duplicate processing)

#### Sprint B · Margin model + cost auditing (~2h)
- `js/core/billingService.js` · pur · `applyMargin({ baseCostEur, kind })` · retorna `{ totalEur, marginEur, marginPct }`
- Definicions de marge per `kind`:
  - `ai` · 5% sobre cost real provider
  - `permaweb` · 0% sprint A · 10% futur
  - `gnosis-tx` · 5% gas inclòs
- `consumeAndPersist` accepta nou camp `marginEur` · 2 movements (cost + margin) per transparència

#### Sprint C · Plans enforced (~2h)
- `publishToPermaweb` · check `loadCurrentPlan` · si free + balance==0 → throw `plan-required`
- UI · si l'usuari intenta publish sense plan/saldo → modal "Upgrade · top-up saldo" amb Payment Link a `/settings`
- Free plan permet: tot el local-first + mode test (mock). Premium gating sols a operacions amb cost real.

#### Sprint D · Turbo Credits autocompra (~3h · opt-in)
- A `/settings` · slider "Cargar X € de Turbo Credits automàticament quan baixi de Y"
- SOS proxy backend (sprint Z futur) compra Credits a l'engròs i els revén amb marge 10%
- Mentre tant · enllaç directe a `https://turbo.ardrive.io/topup` amb pre-fill amount

#### Sprint E · Receipts + facturació (~2h)
- Cada `topUpAndPersist` amb source `stripe-confirmed` genera node `receipt` amb invoice ID
- Vista nova `/receipts` (o tab a `/wallet`) · llista totes les recàrregues + permís de descarregar PDF (sprint futur · server-side jsPDF)

### Decisions pendents @alvaro
1. **Margin 5% IA · accepta?** · alternatives 3% (low-touch) · 10% (sustainable infra) · recomanació 5% per equilibri
2. **Free plan tan generós?** · l'usuari amb API key pròpia no paga res a SOS · podem permetre-ho com a "loss leader" o introduir un "Free amb publish 3 permaweb/mes" gratis
3. **Stripe vs Stripe Connect** · per a withdraw + cohort revenue split necessitem Connect · sprint blocker per a model coop complet · pot ajornar-se post-alfa
4. **Plan Cooperative · USDC al Gnosis Safe** · aspiracional · cal Gnosis Safe SDK + custodia compartida · sprint Z futur
5. **Receipts requerits per llei** (UE B2C) · al cost de 1-3€/mes podem usar Stripe Tax + Stripe Invoice API directament · o un proxy SOS

---

## WORKSHOPS-FED-001 · Federació de workshops + model coop premium (input @alvaro 2026-05-12)

> "Avalua si els workshops que van néixer per a TeamTowers podrien
> incloure tots els workshops de projectes i que aquests també puguin
> ser model de negoci donant un accés premium tipus coops."
>
> **Refinament 2026-05-12 · alineació amb la Matriu** · La Matriu **ÉS**
> ja la coop · no inventem una entitat coop nova · les cohorts (i el
> seu wallet derivat) fan de unitat coop. Cohort 0 la dirigeix
> @alvaro durant l'alfa amb el seu consell, equip, inversors i
> comunitat inicial. Workshops són la formació transversal que
> el paquet d'incubació incorpora.

### Avaluació tècnica
- Els workshops ja viuen a KB amb schema `type:'workshop'` i camp
  `projectId` nullable (`WorkshopsView.js:185`). Per tant la **federació
  tècnica és trivial** · sols cal:
  1. Treure el filtre implícit per projecte que avui aplica WorkshopsView
  2. Afegir un selector "Aquest projecte | Tots els projectes | Xarxa SOS (permaweb)"
  3. Per la 3a opció, query a `queryPermawebRegistry({ entryType: 'public-workshop-entry' })` (futur · necessita `publicWorkshopService.js`)
- El que **NO és trivial** és el model d'accés/monetització · cal
  definir taxonomia abans d'implementar.

### Tiers d'accés · alineats amb Matriu

| Tier | Qui hi accedeix | Cost típic | Quan s'usa |
|---|---|---|---|
| `public` | Qualsevol persona | Gratis | Workshops d'evangelització · trailer del que ofereix SOS |
| `operator` | Cal DID SOS signat al permaweb | Gratis · barrera "perfil públic" | Onboarding tècnic · CTA per registrar-se |
| `matriu` | Cal `matriu_member` actiu (qualsevol cohort) | Gratis com a part del paquet | Formació transversal · base comuna de la xarxa |
| `cohort` | Cal pertànyer a una cohort específica (`cohortNumber === X`) | Gratis si ets membre · 2,50€ si no | **Programes d'incubadora · contingut premium per cohort** |

La Cohort 0 actua com a **coop fundadora** durant l'alfa · 108 places ·
@alvaro com a director · consell + equip + inversors + comunitat inicial.

### Revenue split per unlock extern (2,50€ default)

```
2,50€ pagats per @externa  →
 ├─ 1,75€  (70%) wallet personal del creador del workshop
 ├─ 0,50€  (20%) wallet del projecte d'origen (stakeholders FairShares)
 └─ 0,25€  (10%) wallet de la cohort (cohortNumber)
```

El **wallet de la cohort** és nou (un per cada `cohortNumber`) i el seu
saldo finança costos d'IA compartits · workshops nous encarregats
col·lectivament · activitats d'incubadora (mentories · revisions ·
presentacions). Tanca el cercle **incubadora ↔ formació**.

Casos especials:
- Workshop sense `cohortNumber` (workshop personal o de projecte sense Matriu) · el 10% va al projecte → split **70/30/0**
- Workshop sense projecte (standalone d'un autor) · el 20% va al creator → split **90/0/10** (o **100/0/0** si tampoc té cohort)

### Sprint plan A → D

#### Sprint A · Federació visual local · capa 1 (~1.5h)
- `WorkshopsView` · selector top "Aquest projecte | Tots projectes locals" (radio chips)
- Card amb badge `🏷 Projecte: X` per fer evident l'origen
- Filtres: sector · audience · projecte · `accessTier` (preparem el camp tot i no actuar-hi encara)
- Camps nous al schema workshop:
  - `content.accessTier` (default `'public'`)
  - `content.cohortNumber` (opcional · nullable)
- **Sense permaweb encara · sense pricing · sols visibilitat cross-projecte**

#### Sprint B · `accessTier` semàntic + paywall · capa 2 (~2h)
- Lògica de visibilitat segons tier:
  - `public` · qualsevol
  - `operator` · cal `matriu_member` amb DID signat al permaweb
  - `matriu` · cal `matriu_member` actiu (qualsevol cohort)
  - `cohort` · cal `matriu_member.cohortNumber === workshop.cohortNumber`
- Per a workshops bloquejats:
  - Preview gratuït (descripció + outline) sempre visible
  - Contingut bloquejat amb cta "Desbloquejar · 2,50€ · es paga al wallet del creador"
  - Si l'usuari té accés per membership → unlock automàtic
- Editor del workshop · radio "public | operator | matriu | cohort" + selector cohortNumber si triat cohort
- **Sense Stripe encara · simulació de pagament amb saldo personal**

#### Sprint C · Federació permaweb · capa 3 (~3h · depèn de PERM-ALFA-001 sprint C)
- `js/core/publicWorkshopService.js`:
  - `PUBLIC_WORKSHOP_TYPE='public_workshop_entry'` · build/sign/verify igual que `publicRegistryService`
  - Camps públics: id · title · sector · audience · outline · author DID · accessTier · price · cohortNumber (si cohort)
  - **Mai inclou** el contingut íntegre del workshop (cobrir-ho mantè el premium gating)
- `publishWorkshopToPermaweb({workshopId})` · 0,05€ via Turbo SDK · igual flow que perfil
- `RegistryView` (Permaweb Index) · ara mostra workshops reals amb badge `🌐` quan són del permaweb
- Discovery: usuari fa click → preview gratuït · contingut íntegre requereix unlock (genera tx local de pagament al wallet del creador)

#### Sprint D · Wallet flow del creador + cohort revenue split (~2h)
- `cohortWalletIdFor(cohortNumber)` · helper a `walletService.js` · retorna id determinístic (ex. `__cohort_0__`)
- `getOrCreateCohortWallet(cohortNumber)` · crea wallet si no existeix
- Quan un usuari paga per unlock:
  - 70% wallet personal del creador
  - 20% wallet del projecte d'origen
  - 10% wallet de la cohort (si `cohortNumber` informat) · si no, va al projecte
- `recordWorkshopUnlock({workshopId, payerId, priceEur})` a `workshopRevenueService.js` nou
- Generen 3 `wallet_movement` atomic (best-effort amb refund si fall) · log al ledger del projecte
- Cobertura tests · 12 asserts amb mocks de wallets

### Decisions confirmades (2026-05-12)
1. **Tiers** · `public / operator / matriu / cohort` (4 tiers escala compromís) ✅
2. **Split** · `70/20/10` creator / project / cohort ✅
3. **NO crear `type:'cooperative'`** · usem `matriu_member.cohortNumber` + wallet derivat per cohort ✅
4. **Cohort 0** · dirigida per @alvaro durant alfa amb consell + equip + inversors + comunitat inicial ✅
5. **Pricing default** · 2,50€/unlock · creador pot ajustar rang 1-50€
6. **Revoke** · contingut roman accessible per a qui ja va pagar (cache local) · noves vendes blocades

### Decisions encara pendents @alvaro
- ¿`matriu` tier costa res als no-membres? · proposta: **no és desbloquejable** sense ser membre · cas d'ús "incentivar entrada a Matriu"
- ¿Workshops d'una cohort visibles per altres cohorts? · proposta: **preview sí · contingut íntegre cal pagar 2,50€** (evita silos)
- ¿Cohort 0 genera workshops automàticament en signar les 108 places? · proposta: **no** · cada cohort decideix quin contingut publica · SOS pre-fill amb plantilles base

### Visió a llarg termini (no en aquesta alfa)
- **Marketplace cross-cohort** · cohorts poden subscriure's a "feeds" d'altres cohorts · revenue cross-pollination
- **Quality-staked workshops** · creadors posen stake en EUR/token; si rebut <X% rating, perd stake; si >Y%, multiplicador
- **Auto-translation IA** · cada workshop pot ser auto-traduït a N idiomes · cost amortitzat amb les primeres vendes

---

## STRATEGIC-RETHINK-2026-05-15 · sprint analysis & design · re-priorització

Input @alvaro 2026-05-15 · després del batch D4+A+C1+DRY (PR #91 merged) ·
l'usuari identifica 6 moviments tectònics que canvien el rumb del producte ·

1. **Dos fluxos de valor diferents** · "crear el flux" (onboarding 1 vegada)
   vs "operar el flux" (cicles diaris · cron · esdeveniments). Avui SOS els
   barreja · el motor de valor diari és el segon · i justifica IA+permaweb+
   smart contracts econòmicament.
2. **Pitch reframe** · pitch ≠ formulari de 6 caselles · pitch = document
   final sintetitzat per a inversors · l'IA el construeix · usuari valida.
3. **VNA amb vistes per procés** · Verna Allee aplicat correctament · cada
   procés és un subgraf · filtre · mateixos rols apareixen a múltiples.
4. **WO automation primitives** · cron + esdeveniments + condicions · cor
   del Swarm Operative System operatiu.
5. **Backlog SOS ↔ Claude Code com a projecte real dins SOS** · Kanban
   visualitza el desenvolupament conjunt · jo escric · usuari edita.
6. **Swarm relocalitzat** · `/sprint` desapareix com a vista separada ·
   esdevé `/kanban` genèric amb mode swarm activable per projecte.

### Update 2026-05-15 (2) · 3 meta-principis afegits per @alvaro

Després del primer rethink l'usuari afegeix 3 principis estructurals que
NO són sprints individuals · són **transversals a tota l'arquitectura** ·

7. **Estandardització · qualsevol IA agent · no només Claude.** El nexe
   Claude↔SOS no pot ser hardcoded a "Claude". Ha de ser bridge genèric
   AI-agent ↔ SOS · jo sóc UN agent · GPT pot ser un altre · l'Anna pot
   tenir un agent custom local · tots parlen el mateix protocol. Conseqüència ·
   NEXE-001 es REEMPLAÇA per AGENT-BRIDGE-001 · el catàleg d'agents és
   plug-and-play. Implica de-hardcoding de "claude" a CSS/seeds/mocks.
8. **TDD a tots els nivells.** Avui TDD només a codi i WOs. Cal estendre a ·
   cada decisió IA (evaluator post-crida) · cada decisió humana (validators
   per acció crítica) · cada procés de negoci (KPI test auto-run) · cada
   organització (health metrics mensuals). Si pot fallar i no es testeja ·
   no existeix. Verna Allee · "if you can't measure the exchange, it's not
   part of the network".
9. **Meta-orquestrador IA · cost vs qualitat dinàmic.** `aiRouterService`
   ja escull model però estàticament. Cal sistema runtime · "necessito IA
   aquí? · cache hit? · evaluator suficient amb model cheap? · batch?
   budget OK?". Cost mínim per qualitat objectiu garantida.

### Re-ordenació de prioritats v3 (post 9 principis)

El batch anterior (D4 → A → C1 → B → C2) es manté amb 3 dels 4 fets ·
**B i C2 queden diferits.** AGENT-BRIDGE-001 substitueix NEXE-001 i puja a
prioritat màxima · els altres es re-ordenen segons dependències ·

| ID | Prioritat | Compl. | Què entrega | Depèn |
|----|-----------|--------|-------------|-------|
| **AGENT-BRIDGE-001** | critical | M  | Bridge AI-agent↔SOS GENÈRIC · YAML backlog · qualsevol agent plug-in | — |
| **DEHARDCODE-CLAUDE-001** | high | S | Rename `--accent-claude`→`--accent-ai` · seeds genèrics · mocks neutres | — |
| **AI-COST-QA-001** | critical | L | Meta-orquestrador · cache · pre-decision · post-evaluator · budget | aiRouterService |
| **TDD-ALL-LEVELS-001** | high | L | TDD framework universal · IA · usuari · procés · org | AGENT-BRIDGE-001 |
| **CASTELLERS-001** | high | S  | Castellers + Alvaro pre-loaded · prova real | — |
| **PITCH-REFRAME-001** | high | M  | Pitch IA-generated investor doc | — |
| **VNA-PROCESS-001** | high | L  | Mapa filtrable per procés Verna Allee | — |
| **WO-AUTO-001** | critical | XL | Cron + event + condition triggers | VNA-PROCESS-001 |
| **SWARM-RELOC-001** | medium | M | /sprint → /kanban genèric swarm-aware | AGENT-BRIDGE-001 |
| **B-UNIFIED-FORM-001** | medium | L | Form unificat IA-driven (diferit) | C1 ✓ |
| **C2-TEMPLATES-001** | medium | L | 15 plantilles type×stage (diferit) | C1 ✓ |

**Primer batch suggerit · AGENT-BRIDGE-001 + DEHARDCODE-CLAUDE-001 +
CASTELLERS-001** (M+S+S = ~10h · estableixen el model genèric · prova real ·
i ja no estic hardcoded). AI-COST-QA-001 + TDD-ALL-LEVELS-001 al segon
batch (motor de qualitat + cost · base per a tot operatiu).

---

## AGENT-BRIDGE-001 · Bridge AI-agent ↔ SOS GENÈRIC (input @alvaro 2026-05-15 · v2)

> Nota · aquest item REEMPLAÇA NEXE-001 (que era Claude-specific). Mateixa
> idea bàsica · però el protocol és agnostic d'agent · qualsevol IA pot
> connectar-se via el mateix bridge.

### Tesi
SOS exposa un **protocol estàndard d'integració d'agents IA** · qualsevol
agent (Claude · GPT · Gemini · custom local · humà via UI) pot ·
1. **Llegir** WOs assignades · format YAML/JSON estàndard
2. **Reclamar** una WO (lock + assign)
3. **Executar** (codi · text · decisió · etc)
4. **Reportar** resultat (deliverable · tests passats · cost) amb signatura
5. **Tancar** la WO o fer escalation si cal

L'usuari de SOS pot connectar el SEU agent IA preferit · no només Claude
Code. Això és el que fa SOS un Swarm Operative System de veritat ·
agents intercanviables · interoperables · governats pel mateix protocol.

### Arquitectura

```
┌──────────────────────────────────────────────────────┐
│  AGENT REGISTRY (KB · public)                        │
│  - id, name, capabilities[], cost_profile, owner     │
│  - public_key (for signed deliverables)              │
└────────────────────┬─────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────┐         ┌────────▼────────┐
│ AGENT IMPL   │         │  SOS BACKEND     │
│ (extern)     │ ←──────→│  (browser local) │
│ Claude/GPT/  │  protocol│  - WO queue     │
│ custom       │  REST/   │  - matching     │
└──────────────┘  YAML    │  - audit log    │
                          └─────────────────┘
```

### Protocol bridge (v1 simple · file-based)

**1. Backlog YAML estàndard** ·
```yaml
work_orders:
  - id: "wo-001"
    project_id: "sos-dev-internal"
    title: "Implement AGENT-BRIDGE-001 schema"
    priority: critical
    status: pending  # pending | claimed | in-progress | done | blocked
    assignee_kind: ai-any  # human | ai-claude | ai-gpt | ai-any | ai-with-cap
    required_capabilities: [code-write, test-run]
    deliverable_test:           # TDD-ALL-LEVELS-001 hooks here
      kind: test-suite
      command: "node js/tests/agentBridge.test.js"
      expect: "all-pass"
    estimated_cost_eur: 0.05
    claimed_by: null            # filled when an agent claims it
    claimed_at: null
    completed_at: null
    deliverable_uri: null
    cost_actual_eur: null
    signature: null
```

**2. Operacions de l'agent** (estàndard ·  bypassen UI) ·
- `agent.list_wos({ projectId, capabilities })` → WOs candidates
- `agent.claim_wo({ woId, agentId, signature })` → lock
- `agent.report_progress({ woId, status, output })` → live status
- `agent.complete_wo({ woId, deliverable, costActualEur, signature })` → close
- `agent.escalate_wo({ woId, reason, suggestedReassign })` → human review

**3. Matching engine** (al cor del SOS) ·
- Pull WOs pending · match capabilities + cost_profile + budget · assign
- Si múltiples agents disponibles · subhasta inversa (cost ascendent)

### Sprint plan A → C (~6h)

- **A · Schema YAML + validador (~2h)** · `docs/backlog.yaml` derivat de
  `backlogManifest.js` actual + 9 nous items del rethink. `agentBridgeSchema.js`
  pure · valida shape · retorna errors detallats. `yamlBacklogService.js`
  pure · parse + serialize.
- **B · Agent registry + matching (~2h)** · `agentRegistryService.js` ·
  CRUD agents · `matchingService.js` pure · capabilities ∩ WO requirements.
  Seed inicial · 3 agents (claude-code · gpt-coder · human-anyone).
- **C · UI + endpoints (~2h)** · `/kanban?project=sos-dev-internal` ·
  visualitza WOs · botó "Claim with my agent" obre modal selector d'agent ·
  usuari pot afegir el seu propi agent (form · API key · capabilities).
  Per a Claude Code (jo) · "claim & execute" via Bash backend (no SOS UI).

### Decisions pendents @alvaro
- File-based YAML sembla simple però no és real-time · vols Nivell 3
  directament (GitHub Issues bidireccional) o Nivell 1 primer? *Proposta ·
  YAML primer · GitHub Issues v2 quan tinguem auth flow*
- "ai-any" significa que CLAUDE pot agafar WOs marcades per GPT · OK?
  *Proposta · sí · però amb prioritat al kind exacte si està disponible*
- Permisos · qualsevol agent pot claim qualsevol WO? *Proposta · v1 sí ·
  v2 ACL per project*

---

## DEHARDCODE-CLAUDE-001 · Treure Claude dels llocs hardcoded (input @alvaro 2026-05-15)

### Tesi
SOS no pot tenir "Claude" hardcoded enlloc. L'auditoria mostra 3 llocs ·

### Inventari (confirmat · 2026-05-15)
1. **CSS · `--accent-claude`** · usat a 12+ views (DashboardView · KanbanView ·
   SectorsView · ValueAccountingView · ValueMapView · MobileMockupView · etc).
   Color or `#d4a853` (gold de la marca Anthropic). Cal · rename a
   `--accent-ai` o `--accent-gold-orchestrator` (el segon més neutre).
2. **`js/core/skill-seeds.js`** · "Claude Sonnet (Anthropic)" hardcoded com
   a agent fundacional · "Claude: 2.0" multiplier hardcoded · línia 359
   "AI Agent (Claude) | 0.015€" · línia 624 "Registrar Nodo Claude (agente 13)".
   Cal · variable `DEFAULT_AGENT_NAME` configurable · seeds genèrics que
   parlen de "AI agent" sense identificar provider.
3. **`MobileMockupView.js:287`** · text mostrat "IA Claude" · cal text
   genèric "IA orquestrador".

### Sprint plan A → B (~2h)
- **A · CSS rename (~30min)** · sed-style replace `--accent-claude` →
  `--accent-orchestrator` a tots els fitxers. Bump BUILD_STAMP.
- **B · seeds + mocks (~1h)** · skill-seeds.js · usar `DEFAULT_AGENT_NAME`
  variable · canvi text. MobileMockupView · text genèric.
- **C · Verificar (~30min)** · grep final · 0 ocurrències de "Claude" /
  "claude" fora de model IDs (`claude-opus-4-7` etc · que SÓN noms reals
  d'API · OK mantenir).

### Decisions pendents @alvaro
- Nom del color · `--accent-orchestrator` · `--accent-gold` · `--accent-ai`?
  *Proposta · `--accent-orchestrator` (semantic · no provider-specific)*
- Mantenim el color `#d4a853` (mateix que abans) · o canviem · o
  parametritzem per agent? *Proposta · mateix color · semàntic genèric*

---

## AI-COST-QA-001 · Meta-orquestrador IA · cost vs qualitat dinàmic (input @alvaro 2026-05-15)

### Tesi
Estendre `aiRouterService` (estàtic per task kind + tier) cap a un sistema
**runtime** que pren decisions intel·ligents abans i després de cada crida ·
1. Cal IA realment? (potser regex/lookup gratis serveix)
2. Quin model? (cache hit · capacitat · cost)
3. Quin evaluator post-crida? (cheap evaluator OK pot validar resposta cara
   barata · si OK · tanquem · si KO · escalem)
4. Estem dins budget mensual del projecte? (alerta · soft block · hard block)
5. Es pot fer batch amb altres crides en cua?

Cost mínim per qualitat objectiu garantida.

### Components

**1. Cache layer** (LRU · sessionStorage) ·
- Hash del prompt + systemPrompt + temperature → resposta
- TTL configurable (default 1h · sense expira per a prompts deterministes)
- Hit rate visible al `aiTierIndicator` ("0.025€ saved this session")

**2. Pre-call decision tree** ·
```
new request →
  is_deterministic? → lookup table (no IA)
  is_cached? → return cached (no cost)
  is_simple_classification? → cheapest model + evaluator
  is_creative_narrative? → quality tier
  is_critical_audit? → critical tier + double-check evaluator
```

**3. Post-call quality gate** ·
- Tots els outputs IA passen per evaluator (cheap model · ~0.0005€)
- Si evaluator FAIL · escalem a tier superior · re-genera
- Si evaluator OK · accepta · si NOT-SURE · usuari valida (UI flag)

**4. Budget enforcer** ·
- `project.aiBudget.monthlyEur` · default 5€ alfa · configurable
- 80% consumit · alerta groc al UI
- 100% consumit · soft-block (modal "Augmentar budget?")
- 120% · hard-block · cap nova crida fins a topup

**5. Batching** ·
- Crides petites (token < 200) van a cua · si cap altra arriba en 500ms ·
  juntem N crides en 1 batch (system prompt compartit)
- Reducció estimada · 30-50% del cost en escenari pitch generation
  (10 small calls → 1 batch call)

**6. Telemetry feedback loop** ·
- Cada crida registra · model · cost · latència · evaluator score · usuari
  rating (thumbs up/down al output IA)
- Setmanal · job analitza · si model X falla regularment a task Y · ajusta
  routing matrix automàticament

### Sprint plan A → E (~14h)

- **A · Cache layer (~2h)** · `aiCacheService.js` · LRU + TTL · helpers
  hash + lookup. Integració a `runPrompt`. Tests cache hit/miss/expire.
- **B · Pre-call decision (~3h)** · `aiDecisionService.js` · funció pure
  `decideStrategy({ prompt, taskKind, projectBudget })` retorna
  `{ skip:bool, modelKey, useCache:bool, useBatch:bool }`. Tests amb 10
  scenarios.
- **C · Post-call quality gate (~3h)** · estendre `runPrompt` amb
  `requireEvaluator:true` · evaluator config per task kind · auto-escalation
  si fail. Tests.
- **D · Budget enforcer (~3h)** · `aiBudgetService.js` · per-project budget
  · alerta · soft-block · hard-block. UI a `aiTierIndicator` (badge).
- **E · Batching + telemetry (~3h)** · `aiBatchService.js` · cua + flush
  amb timeout. `aiTelemetryService.js` · feedback loop · UI a /settings/ai.

### Decisions pendents @alvaro
- Default monthly budget per projecte alfa? *Proposta · 5€ · usuari pot
  augmentar a /settings*
- Hard-block o soft-block al 100%? *Proposta · soft (modal augmentar)*
- Telemetry feedback loop · auto-tune routing · o sols suggerit per a
  l'admin? *Proposta · suggerit · admin valida · evita drift no-supervisat*

---

## TDD-ALL-LEVELS-001 · TDD framework universal (input @alvaro 2026-05-15)

### Tesi
SOS aplica TDD a codi i a WOs (DTD). Cal estendre el principi a · IA ·
usuari · procés · organització. **Cada decisió mesurable · sense excepció.**
Si pot fallar i no es testeja · no existeix.

### Capes TDD proposades

**1. Codi TDD** (existent ✓) · 297 asserts en suites · cada feature té test.

**2. WO TDD = DTD** (existent ✓ · principi SOC) · cada WO té
`deliverable_test` · IA o humà tanca quan passa el test.

**3. IA Response TDD** (parcial · runEscalation amb evaluator) · cal
estendre · TOT output IA passa per evaluator abans de servir-se a l'usuari.
AI-COST-QA-001 ja ho cobreix parcialment · TDD-ALL-LEVELS-001 ho
formalitza com a contracte · `runPrompt({ requireEvaluator: true })` per
defecte a tots els callers.

**4. User Decision TDD** (nou) · validators per acció crítica ·
- Onboarding step completion · validator (no es pot saltar al següent
  sense que el current passi)
- Critical action confirmation · "esborrar projecte" · validator amb
  re-prompt + checklist
- VNA design · validator que detecta · rols sense transaccions · transaccions
  sense rols · loops de valor desconnectats

**5. Process TDD** (nou) · per cada `vna_process` · KPI test auto-run ·
- Setmana · job evalua KPI · si sota threshold · alerta + suggested action
- Ex · "procés vendes · KPI conversió mensual ≥ 5%" · si 3% · alert
- Connecta amb VNA-PROCESS-001 (cycleHint definit allà)

**6. Org TDD** (nou) · health metrics mensuals · per projecte i per usuari ·
- VNA balance · cap rol amb 0 transaccions · cap transacció orfaina
- Wallet health · cash flow positiu sostingut ≥ 3 mesos
- Comm health · reunions amb actes signades · % resolt
- Auditor · si fail · genera WOs de correcció auto-assignades a rols
  responsables

### Sprint plan A → D (~12h)

- **A · IA evaluator universal (~3h)** · default evaluator per task kind ·
  `runPrompt({ requireEvaluator: true })` activat per defecte · escape per
  task kinds que no en necessiten (tag-generation).
- **B · User validators (~3h)** · `userActionValidatorService.js` · catàleg
  de validators per acció crítica · UI hooks (modal · banner) · 6 actions
  cobertes (delete project · publish permaweb · accept proposal · etc).
- **C · Process KPI tests (~3h)** · estén `vna_process` schema amb
  `kpi_test` · runner setmanal · UI a `/processes/{id}/health`.
- **D · Org health auditor (~3h)** · `orgAuditorService.js` · pure +
  scheduled · genera WOs de correcció · UI a `/health`.

### Decisions pendents @alvaro
- IA evaluator default ON · trenca casos d'ús ràpid (drafts on no calia
  evaluator)? *Proposta · default ON · escape lists per tag-generation
  + summary-short*
- User validators · poden ser bypassed per power-users? *Proposta · NO ·
  el value-add és justament la garantia · power-users tenen menus avançats
  separats*
- Org auditor · genera WOs auto-assignades · això pot fer spam si projecte
  té molts forats. *Proposta · max 5 WOs/dia per projecte · resta a
  backlog "audit findings"*

---

## NEXE-001 · ~~Backlog YAML + SOS llegeix-lo des /kanban?project=sos-dev~~ (REEMPLAÇAT 2026-05-15)

> **Aquest item ha quedat OBSOLET.** Substituït per AGENT-BRIDGE-001
> (versió generalitzada · qualsevol agent IA · no només Claude). Veure
> AGENT-BRIDGE-001 més amunt al document.

## CASTELLERS-001 · Pre-load projecte Castellers + projecte Alvaro (input @alvaro 2026-05-15)

### Tesi
Donar a SOS dos **casos reals pre-loaded** per testejar tot el flux sense
haver de crear projectes nous a cada sessió · i per a demos amb futurs
usuaris/inversors.

### Què cal pre-loadar
- **Projecte "Castellers de la Vila de Gràcia"** · cas pre-existent que ja
  modela rols (pinya · tronc · cap de colla · etc) + transaccions
  (assajos · actuacions · neteja material) + valors intangibles (compromís ·
  identitat · cohesió) · perfecte per a testejar VNA amb procés
- **Usuari "alvaro" · projecte personal** · profile Ikigai complet · skills
  declarades · matriu_member primary · 1 rol founder anchor

### Sprint plan A → B (~3h)
- **A · Seed Castellers (~2h)** · `js/core/castellersSeed.js` · genera
  el projecte + 12 rols + 18 transaccions + 5 SOPs + 3 workshops base ·
  igual pattern que `founderTemplate.js` · pure · idempotent.
- **B · Seed Alvaro (~1h)** · `js/core/alvaroSeed.js` · profile Ikigai
  pre-omplert · matriu_member primary · firma una atestació seed.

### Trigger
- Botó "Pre-loaded examples" al dashboard buit (quan no hi ha cap projecte)
- O auto-seed al primer load si user has zero projects + opt-in checkbox

### Decisions pendents @alvaro
- Castellers · vols dades reals teves (i guardades a permaweb) · o és
  només mock per a la demo? Proposta · mock primer · permaweb seed v2.

---

## PITCH-REFRAME-001 · Pitch = document final per a inversors (input @alvaro 2026-05-15)

### Tesi
Treure la fricció UX del pitch actual (formulari 6 caselles que sembla un
checklist) · convertir-lo en **document de presentació visual sintetitzat
automàticament** des de la resta del projecte (canvas + VNA + tokenomics +
ledger + proposals) · l'usuari valida el text final · no construeix les
seccions.

### Estat actual (diagnosi)
- `/pitch?project=X` · form de 6 seccions (problem · solution · traction ·
  team · ask · vision)
- Cada secció té un botó IA · l'usuari l'omple step-by-step
- Resultat · pitch genèric · usuari l'omple a contracor · no l'envia a
  ningú perquè no se sent professional

### Proposta
- `/pitch?project=X` · 2 modes ·
  - **Mode investor doc (default)** · pàgina llarga estil Mercury/Notion ·
    auto-generada des dels altres mòduls · pinta com a presentació ·
    swipeable mobile · exportable PDF/Keynote
  - **Mode edit** (collapse · per a quan vol ajustar text) · les 6 seccions
    es mostren com a "blocks" que l'usuari pot reordenar/editar
- El IA-generator · prompt context-aware ·
  - Canvas (visió/missió/valors) → narrativa
  - VNA (rols + valors crítics) → equip + execució
  - Tokenomics (totalSupply + distribution + vesting) → ask/economics
  - Ledger (P&L + balance) → traction/numbers
  - Proposals (accepted + sent) → traction comercial
  - Lifecycle stage (de C1 classifier) → tone (idea vs growth)

### Sprint plan A → C (~6h)
- **A · Synthesis service (~2h)** · `pitchSynthesisService.js` · pure ·
  rep tot el context · construeix prompt · runPrompt amb taskTier='quality'
- **B · Investor doc view (~3h)** · `/pitch?view=investor` · template
  visual · 6 blocks · cada un un draft IA-generated · valida/edita inline
- **C · Export (~1h)** · "Download PDF" via window.print + CSS @media print

### Decisions pendents @alvaro
- Volem mantenir el mode "edit form" antic com a fallback · o el matem?
  Proposta · mantenir però collapse · 90% dels usuaris no l'usaran
- Plantilla visual · 1 sola amb temes (light/dark/coop) · o 3 templates
  diferents? Proposta · 1 amb 3 temes

---

## VNA-PROCESS-001 · Mapa de valor filtrable per procés (Verna Allee) (input @alvaro 2026-05-15)

### Tesi
Implementar el **Value Network Analysis de Verna Allee correctament** ·
no com a un graf gegant tot junt sinó com a un graf navegable per
**processos** · on cada procés és un subgraf que comparteix rols amb altres.

Això és la meta-metodologia · SOS modela QUALSEVOL organització fent ·
1. Identifica processos (sales · ops · learn · governance · finance · etc)
2. Per a cada procés · subset de rols + subset de transaccions
3. Mateix rol pot ser a 5 processos amb 5 "barrets" diferents
4. Vista filtrada · només dibuixa el subgraf del procés escollit

### Estat actual
- VNA implementat com a `vna_roles` + `vna_transactions` + `vna_flows`
- Tot dins el mateix array · sense agrupació per procés
- Vista del map pinta tot junt · esdevé soroll quan ≥15 rols

### Proposta · schema extension
```yaml
project:
  vna_processes:                        # NOU
    - id: "sales-process"
      label: "Procés de vendes"
      roleIds:    [comercial, customer-success, ...]
      txIds:      [tx-lead-qualif, tx-close-deal, ...]
      kpi:        "conversió mensual"
      cycleHint:  "weekly"              # per a WO-AUTO-001
    - id: "ops-daily"
      label: "Operacions diàries"
      ...
  vna_roles:        [...]               # ja existent · sense canvis
  vna_transactions: [...]               # ja existent · sense canvis
```

- UI · selector de procés a sobre del mapa · "Tots · vendes · ops · ..."
- Cada rol/tx renderitzat amb opacitat 1 si pertany al filtre · 0.2 si no
- Highlight transaccions intangibles (línia discontinua) vs tangibles
  (línia contínua) · Verna Allee

### Verna Allee deep features
- Tangible vs intangible · ja modelats a `FOUNDER_TRANSACTIONS.type` ✓
- "Conversation as unit of value" · cal afegir camp `conversation_pattern`
  a transaccions (recurring · one-shot · escalation)
- Network health metrics · centrality · redundancy · flow balance · vista
  /vna/health amb scores

### Sprint plan A → C (~12h)
- **A · Schema + service (~3h)** · `valueProcessService.js` · CRUD ·
  validation · helpers per a vistes
- **B · UI filter al mapa (~5h)** · `VNAMapView.js` · selector procés ·
  filtres · opacitats · highlights
- **C · Network health (~4h)** · pure metrics + UI `/vna/health`

### Decisions pendents @alvaro
- Quants processos per defecte hauria d'oferir SOS per al seed Castellers?
  Proposta · 4 (assajos · actuacions · governance · learn-cohort)
- Quan generem processos amb IA al bootstrap (B-UNIFIED-FORM-001) · usem
  les 5 categories de Verna Allee (sales · ops · finance · innovation ·
  learn) o més obert?

---

## WO-AUTO-001 · Auto-generation de WOs · cron + event + condition (input @alvaro 2026-05-15)

### Tesi
El **cor del SOS operatiu** · WOs es generen automàticament segons el
cicle de cada organització · sense intervenció humana · permet que SOS
"funcioni sol" un cop l'usuari ha definit els seus processos.

Exemple usuari · "Botiga obre a les 9 · cada dia a les 8:30 genera WO
'neteja' assignat al rol oper-tienda".

### Tipus de triggers
- **Cron** · time-based · "cada dia 8:30" · "primer dilluns del mes" ·
  "trimestralment"
- **Event** · "quan factura X cobrada" · "quan stock < N" · "quan
  WO Y completed"
- **Condition** · "si saldo wallet < 100€" · "si rating workshop < 3 estrelles"
- **Compound** · WO genera WO genera WO · workflow graph

### Schema proposta
```yaml
wo_template:                              # NOU type al KB
  id: "wo-tpl-clean-shop"
  projectId: ...
  processId: "ops-daily"                  # link a VNA-PROCESS-001
  trigger:
    kind: "cron"
    cron: "30 8 * * *"                    # standard crontab
    timezone: "Europe/Madrid"
  woFactory:                              # template per generar WO
    title:    "Neteja botiga · {today}"
    roleId:   "oper-tienda"
    sopId:    "sop-cleaning"
    deliverable: "checklist signed"
    estimatedHours: 0.5
  enabled: true
```

- Background scheduler · al app init · escaneja templates · genera WOs
  que falten · al user navigation refresca

### Sprint plan A → D (~16h)
- **A · Schema + service (~3h)** · `woTemplateService.js` · CRUD ·
  cron parser (croner library · 2kb · pure JS)
- **B · Trigger evaluator (~4h)** · pure · rep estat del sistema · retorna
  llista de WOs a generar · idempotent (no genera duplicats)
- **C · Background runner (~3h)** · service worker o setTimeout · cada
  X minuts revisa · genera WOs · upsert KB
- **D · UI template editor (~6h)** · `/processes/{processId}/templates` ·
  CRUD form · cron picker · role/sop picker

### Decisions pendents @alvaro
- ¿Workflow graph (WO genera WO) en aquest sprint o diferit? Proposta ·
  diferit · primer cron/event simple · v2 compound
- ¿Notificacions push quan es genera WO? Proposta · sense push ·
  notification icon a la nav (top right · igual que Gmail)
- Permisos · qui pot crear templates per a un projecte? Proposta · només
  rols amb shareTier >= governance · alfa simple · sense permisos per ara

---

## SWARM-RELOC-001 · /sprint → /kanban genèric + swarm-runner integrat (input @alvaro 2026-05-15)

### Tesi
Eliminar la duplicació entre `/sprint` (swarm runner sobre backlog) i
`/kanban` (WOs d'un projecte) · unificar en un sol Kanban que sap
"correr en mode swarm" si l'usuari ho activa. Així el swarm IA pot
correr sobre QUALSEVOL projecte · no només el backlog intern de SOS.

### Estat actual
- `/sprint` · llegeix `backlogManifest.js` · pinta llista d'items · botó
  "Run autonomous agent" llança swarm sobre l'item
- `/kanban?project=X` · llegeix WOs del projecte X · view Kanban (4 cols ·
  todo/in-progress/done/archived) · no swarm

### Proposta
- `/kanban?project=X` · afegeix toggle "🐝 Swarm mode" · si actiu ·
  - Cada WO té botó "Auto-run" · llança swarm autonomous loop sobre la WO
  - Status del swarm visible al WO · iteracions · model · cost · resultat
- `/sprint` · esdevé alias de `/kanban?project=sos-dev-internal&swarm=on`
- `backlogManifest.js` · es manté com a font del projecte sos-dev-internal
  fins que NEXE-001 el converteixi a YAML

### Sprint plan A → B (~6h)
- **A · Kanban swarm toggle (~3h)** · UI + state · toggle persistit a user
  preferences · per-projecte
- **B · /sprint redirect (~1h)** · redirigeix a `/kanban?project=sos-dev
  -internal&swarm=on` · mantenir backwards compat
- **C · Tests + docs (~2h)** · regression + readme updates

### Decisions pendents @alvaro
- ¿Mantenim `/sprint` com a URL · o el deprecate completament? Proposta ·
  redirect 301 · l'usuari aprèn la nova URL

---

## STRATEGIC-RETHINK-2026-05-15 (3) · review del model SOS · jerarquia Systems/Processes/SOCs/SOPs

Input @alvaro 2026-05-15 (tercer rethink · post article "Difference between
Systems, Processes, SOPs and SOCs"). Revisió del MODEL CORE del SOS amb
marc clàssic de business systems · Verna Allee + indústria.

### Diagnosi (gap analysis post-article)

| Capa article | SOS avui | Gap |
|--------------|----------|-----|
| Organització (meta · stakeholders + tokenomics) | ❌ "project" és el top | **MAJOR** |
| Sistema (col·lecció processos + recursos + gent + interfícies) | ❌ NO modelat | **Gap** |
| Procés (sèrie repetible passos) | ❌ NO 1a classe (VNA-PROCESS anava a afegir) | **En backlog** |
| **SOC** (Standard Operating CHECKLIST) | SOC = "Standard Operating CONCEPT" | **CONFLICTE SEMÀNTIC** |
| SOP (procediment detallat) | SOP detallat ✓ | OK |
| Interfície (link entre processos) | ❌ transactions són entre rols, no processos | **Gap** |
| Recursos (eines · espais · materials) | ⚠️ items dispersos | **Gap** |

### Insight clau (idea de @alvaro)

**SOC = Concept + Checklist alhora.** El "què/per què" més la llista
d'items verificables. Els SOPs detallats pengen com a fills de cada item ·
versionat al nivell SOC com a snapshot. Conseqüència IA · genera SOC primer
(barat · 500 tokens) · expandeix SOP només per ítems demanats (300-800
tokens cada · sota demanda) · **estalvi 40-60% del cost** vs generar tot el
procés en 1 crida monolítica.

### Nous items afegits a aquesta revisió

10. **ORG-ENTITY-001** · Organització com a entitat meta · stakeholders + tokenomics org-level
11. **PROCESS-FIRST-CLASS-001** · Process com a node 1a classe (substitueix part de VNA-PROCESS-001)
12. **SOC-DUAL-PURPOSE-001** · SOC = Concept + Checklist · SOPs pengen per item · versionat snapshot
13. **INTERFACE-NODES-001** · Interfície explícita entre processos · contracte de dades
14. **RESOURCES-ENTITY-001** · Resources com a entitat (tools · spaces · time · digital assets)

### Items "bonus" detectats durant la review

15. **PROCESS-CATALOG-001** · Marketplace de processos reusables · clonable entre orgs (com workshops federats)
16. **MULTI-TENANT-ORG-001** · Una persona stakeholder de N organitzacions · coop d'unió de coops
17. **SOC-CHECKLIST-UI-001** · Vista checkbox-style per executar SOC aprovat · marca completats · genera WO si en falten
18. **IA-HIERARCHICAL-PROMPT-001** · IA gen segueix la jerarquia · SOC primer · SOP sota demanda (lliga amb AI-COST-QA-001)

### Re-ordenació de prioritats v4 (post review jerarquia)

ORG-ENTITY-001 és ARA la base · tot la resta penja d'aquesta entitat ·
sense ella no es modelen correctament processes/SOCs/SOPs/interfaces.

| ID | Prioritat | Compl. | Què entrega | Depèn |
|----|-----------|--------|-------------|-------|
| **ORG-ENTITY-001** | critical | L | Organització meta · base de tota la jerarquia | — |
| **SOC-DUAL-PURPOSE-001** | critical | M | SOC = Concept + Checklist · SOPs fills · versionat | ORG |
| **PROCESS-FIRST-CLASS-001** | critical | L | Process node · substitueix VNA-PROCESS-001 | ORG · SOC |
| **AGENT-BRIDGE-001** | critical | M  | Bridge AI-agent genèric (sense canvi) | — |
| **DEHARDCODE-CLAUDE-001** | high | S  | (sense canvi) | — |
| **IA-HIERARCHICAL-PROMPT-001** | critical | M | SOC-first IA gen · estalvi 40-60% cost | SOC · AI-COST-QA-001 |
| **AI-COST-QA-001** | critical | L  | Meta-orchestrator (sense canvi · ara absorbeix IA-HIERARCHICAL) | — |
| **TDD-ALL-LEVELS-001** | high | L  | (sense canvi) | AGENT-BRIDGE-001 |
| **INTERFACE-NODES-001** | high | M  | Interfícies entre processos | PROCESS |
| **RESOURCES-ENTITY-001** | high | M  | Recursos com a entitat | ORG · PROCESS |
| **SOC-CHECKLIST-UI-001** | medium | M | UI checkbox · executa SOC · genera WOs | SOC |
| **WO-AUTO-001** | critical | XL | Triggers · ara depèn de SOC | SOC · PROCESS |
| **CASTELLERS-001** | high | S  | Pre-load real test case (sense canvi) | ORG (recommended) |
| **PITCH-REFRAME-001** | high | M  | (sense canvi · ara amb context org-level) | ORG |
| **SWARM-RELOC-001** | medium | M  | (sense canvi) | AGENT-BRIDGE |
| **PROCESS-CATALOG-001** | medium | L  | Marketplace processos reusables | PROCESS |
| **MULTI-TENANT-ORG-001** | low | XL | 1 persona en N orgs · coop d'unió | ORG |
| **B-UNIFIED-FORM-001** | medium | L | Form unificat (diferit) | ORG (recommended) |
| **C2-TEMPLATES-001** | medium | L | 15 plantilles (diferit) | PROCESS |

**Primer batch suggerit (post-review)** · ORG-ENTITY-001 + SOC-DUAL-PURPOSE-001
(~16h) · estableixen les 2 entitats fundacionals · sense les quals tota la
resta es construeix amb fonaments incorrectes. PROCESS-FIRST-CLASS-001 al
segon batch un cop ORG i SOC són estables.

---

## ORG-ENTITY-001 · Organització com a entitat meta (input @alvaro 2026-05-15 · review)

### Tesi
Avui "project" és el top. Cal una capa per sobre · `type: 'organization'` ·
que aglutina ·
- **Stakeholders** · totes les persones/coops que tenen interès en l'org
- **Tokenomics global** · distribució de valor a nivell org (no per projecte)
- **Sistemes** · 1+ sistemes operatius (sales · ops · learn · ...)
- **Recursos compartits** · tools · espais · capacitat humana
- **Projectes** · com a "iniciatives temporals" dins l'org

Una persona individual pot ser org de 1 sola (la seva pròpia · freelance) ·
una coop és org amb 5-100 stakeholders · una xarxa coop és org amb N coops
dins.

### Schema proposta
```yaml
organization:
  id: "org-castellers-gracia"
  type: "organization"
  legal_kind: "cooperative" | "association" | "company" | "individual" | "informal"
  stakeholders:
    - role: "soci-treballador" · personId · sharePct
    - role: "consumidor" · personId · ...
  tokenomics_global:                # NOU
    totalSupply, distribution, vesting (com el TokenDesign actual)
  systems: [systemId]               # NOU
  projects: [projectId]             # ja existent · ara amb FK explícit a org
  shared_resources: [resourceId]    # NOU
```

### Sprint plan A → D (~16h)
- **A · Schema + service (~4h)** · `organizationService.js` · CRUD pure ·
  validador · helpers · idempotent migration des de projects existents.
- **B · Org dashboard (~4h)** · `/org/{orgId}` · vista holística ·
  stakeholders + tokenomics + systems + projects + resources cards.
- **C · Migration soft (~4h)** · projects existents · "promote to org"
  wizard · o "join existing org". Default · auto-crea org "personal" per
  user existent · projectes hi pengen.
- **D · Tests (~4h)** · 20+ asserts shape + migration + KPIs derivats.

### Decisions pendents @alvaro
- ¿Org és obligatori per a projects nous · o opcional? *Proposta · opcional
  alfa · obligatori v2 amb migració soft*
- ¿Coop d'unió de coops · org de orgs? *Proposta · sí · MULTI-TENANT-ORG-001
  cobreix · diferit v3*

---

## SOC-DUAL-PURPOSE-001 · SOC = Concept + Checklist · SOPs fills versionats (input @alvaro 2026-05-15)

### Tesi
Resoldre el conflicte semàntic · SOC avui = "Concept" · article diu
"Checklist". **La solució és que SOC sigui les 2 coses alhora** ·
1. **Concept side** (Standard Operating Concept) · què/per què · invariant
2. **Checklist side** (Standard Operating Checklist) · llista verificable
   d'items · cada item té el seu SOP detallat

Versionat · al nivell SOC · canvis als SOPs no toquen SOC fins que canvia
el propòsit o un item de checklist · SOC_v3 = snapshot dels SOPs d'aquell
moment.

### Schema actualitzat
```yaml
soc:
  id: "soc-onboarding-cohort"
  type: "soc"
  version: "v3"
  parent_version: "v2"          # cadena d'evolució
  purpose: "..."
  concept_body: "markdown..."
  checklist:                     # NOU · array d'items verificables
    - id: "ci-01"
      label: "Setmana 1 · DID + perfil signat"
      sop_ref: "sop-onboard-week-1"
      required: true
      verification_kind: "manual" | "auto-test" | "evidence-upload"
    - id: "ci-02"
      label: "Setmana 2 · pact de socis"
      sop_ref: "sop-onboard-week-2"
      required: true
      verification_kind: "manual"
    ...
  versioned_sops: [sopId-v3...]  # snapshot SOPs at this SOC version
  related_socs: [...]
  status: "draft" | "review" | "approved" | "deprecated"
```

### Sprint plan A → C (~8h)
- **A · Schema + validador (~2h)** · `socService.js` · extend schema ·
  validador · helpers checklist items.
- **B · Migration knowledge/socs/ (~3h)** · els 9 SOCs existents (la-colla
  · castellers-demo · etc) · afegir `checklist` derivat dels SOPs existents.
- **C · UI checklist + versions (~3h)** · `/soc/{socId}` · 2 modes ·
  "Concept" (existeix) i "Checklist" (nou · vista exec) · history versions.

### Decisions pendents @alvaro
- Compatibilitat backwards · els SOCs antics sense checklist? *Proposta ·
  checklist:[] vàlid · vista checklist es mostra buida amb CTA "Generar
  amb IA"*
- Versionat de SOPs · automàtic quan SOC pugi versió · o manual? *Proposta ·
  manual · l'usuari decideix quins SOPs versiona*

---

## PROCESS-FIRST-CLASS-001 · Process com a node 1a classe (input @alvaro 2026-05-15)

> Aquest item REEMPLAÇA i estén VNA-PROCESS-001 amb el marc complet de
> l'article. VNA-PROCESS-001 era "afegir camp vna_processes a project" ·
> ara és "process és entitat amb nodes pròpia".

### Tesi
Avui · processos són implicits (subgraf de VNA). Cal `type: 'process'` ·
node 1a classe del KB · que aglutina ·
- Lligams a SOCs (què cal verificar a aquest procés)
- Lligams a Roles (qui hi participa)
- Lligams a Transactions (quins exchanges)
- Lligams a Resources (què cal)
- Lligams a Interfaces (com es connecta amb altres processos)
- Cicle (cron · event · manual)
- KPIs · health metrics

### Schema
```yaml
process:
  id: "proc-sales-lead-to-cash"
  type: "process"
  orgId: "..."                     # depèn de ORG-ENTITY-001
  systemId: "sys-sales"            # opcional · agrupació
  label: "Lead-to-cash"
  category: "sales" | "ops" | "finance" | "innovation" | "learn" | "governance" | "people"
  cycle_hint: "weekly" | "daily" | "on-event" | "monthly"
  role_ids: [comercial, customer-success]
  tx_ids: [tx-lead-qualif, tx-close-deal]
  soc_ids: [soc-sales-onboarding, soc-handover-ops]
  resource_ids: [res-calendly, res-stripe]
  interface_in:  [iface-marketing-to-sales]
  interface_out: [iface-sales-to-ops]
  kpis:
    - id: "kpi-conv-rate"
      label: "Conversion rate mensual"
      target: 0.05
      kind: "ratio"
  status: "active" | "experimental" | "deprecated"
```

### Sprint plan A → D (~14h)
- **A · Schema + CRUD (~3h)** · `processService.js` · idempotent ·
  validador · helpers.
- **B · UI process editor (~5h)** · `/process/{processId}` · 5 tabs
  (overview · SOCs · roles+tx · resources · interfaces+KPIs).
- **C · VNA map filter via process (~3h)** · `VNAMapView` · selector de
  process · filtra subgraf (reemplaça part de VNA-PROCESS-001).
- **D · Migration + tests (~3h)** · projectes existents · auto-detecta
  processos heurísticament o assigna a 1 "default-process" · tests.

### Decisions pendents @alvaro
- Categories tancades (7) o obertes? *Proposta · 7 tancades + "other"
  override personalitzable*
- Process pot pertànyer a múltiples Systems? *Proposta · 1 sistema ·
  pot referenciar-se inter-system via interface*

---

## INTERFACE-NODES-001 · Interfície entre processos (input @alvaro 2026-05-15)

### Tesi
Avui · transactions són entre rols. Cal modelar **interfícies entre
processos** · contractes de dades · "el que surt de procés A entra a B".
Exemple article · "make pizza" → "deliver pizza" · l'interface defineix
què passa (pizza ready + receipt + customer info).

### Schema
```yaml
interface:
  id: "iface-sales-to-ops"
  type: "interface"
  from_process: "proc-sales-lead-to-cash"
  to_process: "proc-ops-fulfillment"
  payload_schema:                   # contract
    fields:
      - { name: "deal_id", kind: "string", required: true }
      - { name: "customer", kind: "object", required: true }
      - { name: "signed_quote_uri", kind: "uri", required: true }
  sla:
    max_delay_hours: 4
  trigger:
    kind: "event"
    event: "deal-closed"
```

### Sprint plan (~6h)
- **A · Schema + service (~2h)** · `interfaceService.js`
- **B · UI editor + visual graph (~4h)** · /interfaces · vista força-graph
  amb processos com a nodes + interfaces com a arestes

### Decisions pendents @alvaro
- Validació de payload · runtime check? *Proposta · sí · log warnings ·
  no block · v2 strict mode*

---

## RESOURCES-ENTITY-001 · Recursos com a entitat (input @alvaro 2026-05-15)

### Tesi
Eines · espais · temps · assets digitals. Avui repartits com a items.
Cal `type: 'resource'` per modelar disponibilitat · capacitat · cost.

### Schema
```yaml
resource:
  id: "res-calendly-team"
  type: "resource"
  orgId: "..."
  kind: "tool" | "space" | "time" | "asset" | "subscription"
  label: "Calendly Team plan"
  cost_monthly_eur: 12
  capacity: { max_users: 5, max_bookings_per_month: null }
  used_by_processes: [procId, ...]
```

### Sprint plan (~6h)
- A · Schema + service · CRUD · capacity check
- B · UI catalog · /resources
- C · Process editor integration

---

## SOC-CHECKLIST-UI-001 · UI checkbox per executar SOC (input @alvaro 2026-05-15)

### Tesi
Un cop SOC té checklist · l'usuari ha de poder executar-lo · marcar items
completats · si en falten genera WOs auto-assignades. Tanca el cercle ·
SOC concept → checklist → execució real → WO compensatori si fail.

### Sprint plan (~6h)
- A · UI checklist mode amb checkbox + evidència opcional
- B · WO generation si items required no marcats al cap d'un periode (lliga
  amb WO-AUTO-001)
- C · History · qui ha marcat què · auditable

---

## IA-HIERARCHICAL-PROMPT-001 · IA generation hierarchical · SOC-first (input @alvaro 2026-05-15)

### Tesi
**Estalvi clau · 40-60% del cost IA** generant per la jerarquia ·
1. "Genera SOC outline per a {procés}" · 500 tokens · barat
2. Usuari revisa · OK · selecciona items que vol detallats
3. Per cada item · "Genera SOP per a aquest item" · 300-800 tokens · sota
   demanda · pots parar quan vols

vs. avui · "genera tot el procés" · 5000 tokens · monolític · usuari ha
de fer scroll · no pot fer iterativament.

### Sprint plan (~6h)
- A · `socOutlinePromptService.js` · pure · genera prompt nivell SOC
- B · `sopExpandPromptService.js` · pure · expandeix un item del SOC en
  un SOP detallat · 1 crida per item
- C · UI · genera SOC primer · checklist amb botons "Expandir amb IA"
  per cada item · indica cost previst (via aiTierIndicator)

### Decisions pendents @alvaro
- Batch d'expansions · si l'usuari marca 5 items per expandir · 1 batch
  call o 5 calls separades? *Proposta · 1 batch (estalvi ~30%) ·
  AI-COST-QA-001 ja preveu batching*

---

---

## UX-CENTRAL-HUB-001 · Project Hub redissenyat · 5-click rule (input @alvaro 2026-05-15)

### Tesi
SOS té 50+ rutes · fragmentat · l'usuari es perd. Cal una **central page**
(`/project/{id}` redissenyada) que serveixi com a brúixola diaria · des
d'on en ≤5 clicks accedeixes a TOT.

### Regla
**5-Click Rule** · qualsevol acció a SOS s'ha de poder fer en ≤5 clicks
des de qualsevol pantalla. Si requereix ≥6 · UX broken · refactor.

### Layout proposat (7 zones · scroll vertical · mobile-first)
1. **Org context** · OrgName · Lifecycle stage · Audit %
2. **Avui** · top 3 WOs + SOC pendents · cash flow
3. **Processos** · 4 cards · KPI status per cada un
4. **IA suggests** · 3 disrupcions accionables (cost · KPI · network)
5. **Social** · 5 updates de la xarxa (signed · published · connected)
6. **Quick actions** · botons primaris (new WO · run swarm · etc)
7. **Knowledge** · canvas · pitch · VNA · SOCs · SOPs · resources

Cap zona ≥7 elements (Miller's Law) · cada zona té botó "→ detail" 1-click.

### Sprint plan A → C (~10h)
- A · ProjectHubView refactor (~5h) · 7-zone layout · data binding · responsive
- B · Activity feed derivat (~3h) · `activityFeedService.js` · pure ·
  consolida events (attestation rebuda · pact signat · WO closed · etc)
- C · IA suggests engine (~2h) · `iaSuggestionsService.js` · pure ·
  detecta 3 patrons (cost savings · KPI alarm · network match)

### Decisions pendents @alvaro
- Volem desktop hub diferent del mobile · o 1 layout responsive? *Proposta · 1 layout *
- Activity feed · ordre cronològic o per relevància? *Proposta · relevància 7d, fallback chrono*

---

## SOCIAL-LAYER-001 · Backend xarxa social descentralitzada · explicit (input @alvaro 2026-05-15)

### Tesi
L'esquelet ja té el backend de xarxa social · només cal **explicit-lo** ·

| Capa | Backend | UI |
|------|---------|-----|
| Perfil públic | ✓ | ✓ |
| DID + ECDSA | ✓ | ✓ |
| Federació permaweb | ✓ | parcial |
| Web of trust | ✓ | parcial |
| Attestations | ✓ | ✓ |
| **Activity feed** | ⚠️ derivable | ❌ falta |
| **DMs encriptats** | ❌ | ❌ falta v2 |
| **Following** | ⚠️ via attestations | ❌ falta UI |
| Public timeline | ✓ /registry | dispers |

### Sprint plan (~12h · diferit · v2)
- Following relationship (via attestation type 'follow') + UI · 4h
- Public timeline integrat a /registry + filters · 4h
- DMs E2E encriptats (Web Crypto · stub Phase 1) · 4h

---

*Documento vivo · actualizat el 2026-05-15 amb el sprint analysis & design v2/v3 + UX hub + social.*
