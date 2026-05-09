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
| **MAT-002-F** | **Matriu como vista de proyectos · home alternativa** — input @alvaro 2026-04-30: "quiero que la matriu sea la vista de proyectos". El Dashboard cuando hay ≥1 proyecto activa modo "Matriu" · proyectos como "seats" de la cohort 0 estilo cards landing · contador "X/100 places" · perks visibles · CTAs en `#1a1f1a` · header italic Instrument Serif. Toggle en `/settings → Aspecto` para alternar entre Dashboard SOS estándar (técnico) y Matriu (cooperativo · fundacional). | 🟡 |
| **MAT-002-G** | **System prompt SOS canónico · manifesto persistido + UI editable (NO inyección automática en callLLM)** — input @alvaro 2026-05-08 reframe: la visión VISION-001 vive en la memoria del desarrollador y en el documento maestro · NO debe inflar tokens en cada llamada LLM porque eso degrada calidad/coste, que son valores añadidos centrales de SOS. Decisión arquitectónica: persistir el manifesto como nodo KB `type='system_prompt' kind='canonical-manifesto' id='sos-system-prompt-canonical'` · UI editable en `/settings → System Prompt SOS` (read/edit/restaurar default) · **ZERO impacto en `Orchestrator.callLLM` por defecto**. El manifesto es referencia consultable · no premisa inyectada. Sprints derivados: A · persistencia + UI editable. B (opt-in muy específico) · si el operador activa expresamente "Inyectar manifesto en LLM" en `/settings`, los flujos de cloning de sector / generación de SOC pueden incluirlo · jamás los flujos críticos de generación de SOPs ni woAssistant donde el coste por token es crítico. C · audit cuantificado pre-merge · medir delta tokens/coste con muestra real antes de habilitar B en producción. | 🟡 fase A próxima |
| **UX-EDU-001** | **Capas UX didácticas · aprender haciendo VNA + contabilidad valor + triple-entry + smart contracts + econom-IA** — input @alvaro 2026-05-08: "el programa Matriu se aprenderá haciendo · cada vista de SOS debe incorporar capas didácticas que enseñen los conceptos teóricos sin que el operador tenga que leer un libro". `js/core/didacticService.js` puro: catálogo `EDU_CONCEPTS` Object.freeze con 17 conceptos canónicos · `renderExplainerBadge` accesible · `bindExplainerBadges` con hover/focus/click + Escape + click-outside · `ensureExplainerStyle` CSS único. Sprint A · service + integración /map (vna) /savings (triple-entry). Sprint B · 6 vistas restantes (/kanban antigravity · /wallet econom-ia · /folders folksonomy+taxonomy · /identity did+sbt · /efficiency context-pruning · /market slicing-pie). Sprint C · vista `/learn` glosario navegable con sidebar concepts + búsqueda + progress bar (✓ ya leído persistente en KB `type='didactic_seen'`) + back-references a vistas donde aparece cada concepto. Sprint D · enlaces cruzados a SOPs/SOCs reales del proyecto activo. ZERO consumo tokens. | 🟢 A+B+C verde · D 🟡 |
| **MAT-002-H** | **Landing pública Matriu Incoopadora en `/matriu`** — input @alvaro 2026-05-08 con `Matriu_Landing_standalone.html` adjunto: la página de venta de Matriu vive dentro de SOS, no en una página estática externa · refleja la "incubadora cooperativa que reparteix valor en temps real" en catalán fiel al HTML adjunto. `js/views/MatriuLandingView.js` reusa `MATRIU_COHORT_0`, `MATRIU_PERKS`, `MATRIU_FAIR_FRACTAL_RULES`, `MATRIU_VALUE_KINDS` de `matriuTemplate.js` (single source of truth). Secciones · hero "Sigues / dels primers / en el nucli" + pill "Cohort 0 oberta · 24/100" + CTA "Reservar el teu seient" · stats row (100/24/∞/0s) · "Per què ara" 4 cards (multiplicador ×1.5 · governança ECO · crèdits · llinatge) · "Tokenomic Fair Fractal" 4 reglas FF · "Value mapping engine" 4 ejemplos JT/NB/AR/ML · "Exit model" 4 fases (trigger · snapshot · càlcul · liquidació) + 3 invariantes · "Cohort 0 · 100 places" 6 perks completos · footer CTA "Reservar seient · 0 €" + whitepaper · footer cooperativa con enlaces (Producte · Comunitat · Recursos). Skin Matriu: `#f1ebde` crema · `#2a3a2a` verd fosc · `#c25a3a` terracota · Instrument Serif italic + Inter. Modal de reserva integrado · usa `buildMatriuCohortProject` + CREATE_PROJECT + KB_UPSERT · navega a `/project/{id}` tras reservar. Badges UX-EDU-001 inline (fair-fractal-tokenomics · vna · triple-entry · smart-contract · cohort-0) · refuerzo didáctico durante la lectura. Ruta `/matriu` registrada en router · destino global en navService categoría `home`. | ✅ verde |
| **MAT-003** | **Matriz inicial multidisciplinar · 100 roles críticos para el enjambre Cohort 0** — input @alvaro 2026-05-08: "los 100 asientos deben ser reales y desarrollar un modelo de que esas 100 personas deben poder ejecutar los 100 roles críticos para una matriz inicial multidisciplinar y multiskills que asegure la potencialidad de los conocimientos del enjambre que junto al agente inteligente SOS ayuden al desarrollo de proyectos de comunidades autosuficientes, startups, empresas, huertos o lo que sea". Concepto: la cohort 0 NO es 100 personas aleatorias · es una matriz cuidadosamente seleccionada donde **cada plaza ejecuta ≥1 rol crítico** y **el conjunto cubre el 100% de las skills necesarias para arrancar cualquier proyecto SOS** (comunidades autosuficientes · startups · empresas · huertos · cooperativas · fundaciones). El "enjambre" + el agente IA SOS forman una "matriz cognitiva fundacional" capaz de bootstrappear proyectos arbitrarios. Sprints definidos abajo en bloque dedicado. | 🟡 sprint A próximo |
| **I18N-001** | **Trilingüe ES · CA · EN real** — input @alvaro 2026-04-30: "quiero que seamos de verdad en inglés y castellano y catalán". Ya hay `i18n.js` parcial (selector de idioma) · falta cobertura completa de strings de UI + nodos KB con campos `name_en/ca/es` cuando aplique. Catalán es estratégico · base del fondo descentralizado catalán de la visión VISION-001. Sprints A: extracción i18next con detect navigator + override en /settings · B: traducción de todas las vistas · C: bilingüe en LLM prompts (ej. system prompt en idioma del operador). | 🟡 |
| **PACT-001** | **Pacto de socios dinámicos · evangelización del fundador** — input @alvaro 2026-04-30: "evangelista de pactos de socios dinámicos · no olvides que hay sprints para el desarrollo de pactos de socios y otros contratos". Plantilla de pacto JSON canónico · cláusulas (objeto · participación · vesting · exit · resolución conflictos · slicing pie reglas) · firmado EIP-712 · UI builder paso a paso · output PDF + JSON canónico para Pact.sol (MAT-001 fase 4). UX-001 sprint C ya tiene el tile placeholder · falta el builder real. Conecta con TimeFounder (background del fundador) y con el sistema de slicing pie de Matriu. | 🟡 |
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
- **MAT-002-B** · skin/branding Matriu para los miembros de la cohort · tema CSS con `--mat-bg:#f1ebde` `--mat-fg:#1a1f1a` · tipografías Instrument Serif + Inter Tight (loadeadas vía CDN o self-host) · toggle en `/settings → Aspecto` para alternar entre SOS estándar (oscuro) y Matriu (claro).
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

**Pendiente sprint C.UI**: botón "🐝 Activar enjambre" en panel del
proyecto + modal con propuesta + accept/reject por rol. Esto se hará
cuando tengamos plazas reales declaradas (sprint D · time banking
inverso) · hasta entonces el matchmaker funciona vía consola.

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

*Documento vivo · actualizar al cierre de cada Ola.*
