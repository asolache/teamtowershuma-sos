
// TEAMTOWERS SOS V11 — TESTS (browser-only, vanilla)
// Uso desde DevTools:
//   import('/js/tests/tests.js').then(m => m.runTests())
//   o simplemente: __runTests()  (tras cargar la app al menos una vez)

import { KB }    from '../core/kb.js';
import { store } from '../core/store.js';

function assert(cond, msg) {
    if (!cond) throw new Error('✘ ' + msg);
    console.log('%c✔', 'color:#4ade80;font-weight:bold', msg);
}

// ─── H1.1 · KB Mind-as-Graph round-trip ──────────────────────────
async function testKbMindAsGraph() {
    await KB.init();
    await store.init();

    const id  = 'test-sop-' + Date.now();
    const pid = 'proj-colla-demo-v11';
    const node = {
        id,
        type: 'sop',
        projectId: pid,
        content: { title: 'Fent Pinya · Apertura', steps: ['calentamiento', 'pinya', 'tronc'] },
        keywords: ['fent-pinya', 'taller', 'castells']
    };

    const kbVersionBefore = store.getState().kbVersion || 0;

    // upsert vía dispatch (Mind-as-Graph)
    await store.dispatch({ type: 'KB_UPSERT', payload: { node } });

    const roundTrip = await KB.getNode(id);
    assert(roundTrip?.id === id,                'KB_UPSERT persiste el nodo por id');
    assert(roundTrip?.type === 'sop',           'type se mantiene');
    assert(roundTrip?.createdAt > 0,            'upsert añade createdAt');
    assert(roundTrip?.updatedAt >= roundTrip.createdAt, 'updatedAt ≥ createdAt');

    const byType = await KB.query({ type: 'sop' });
    assert(byType.some(n => n.id === id),       'query({ type }) encuentra el SOP');

    const byProject = await KB.query({ type: 'sop', projectId: pid });
    assert(byProject.some(n => n.id === id),    'query({ type, projectId }) filtra OK');

    const byKeyword = await KB.query({ keyword: 'fent-pinya' });
    assert(byKeyword.some(n => n.id === id),    'query({ keyword }) encuentra el SOP');

    // segundo upsert preserva createdAt, actualiza updatedAt
    await new Promise(r => setTimeout(r, 5));
    await store.dispatch({ type: 'KB_UPSERT', payload: { node: { ...node, content: { ...node.content, version: 2 } } } });
    const updated = await KB.getNode(id);
    assert(updated.createdAt === roundTrip.createdAt, 'upsert preserva createdAt original');
    assert(updated.updatedAt >  roundTrip.updatedAt,  'upsert refresca updatedAt');

    // delete vía dispatch
    await store.dispatch({ type: 'KB_DELETE', payload: { id } });
    const gone = await KB.getNode(id);
    assert(gone === null,                       'KB_DELETE elimina el nodo');

    const kbVersionAfter = store.getState().kbVersion || 0;
    assert(kbVersionAfter >= kbVersionBefore + 3, 'kbVersion se incrementa en cada acción KB (upsert+upsert+delete)');
}

// ─── H1.5 · KnowledgeLoader carga SOPs/SOCs e inyecta en buildContext ─────
async function testKnowledgeLoaderSocsSops() {
    // cache-bust por si el navegador tiene una versión vieja del módulo
    const { KnowledgeLoader } = await import('../core/KnowledgeLoader.js?v=' + Date.now());
    KnowledgeLoader.clearCache();

    // listSocs → debe encontrar al menos los 8 SOCs registrados en _index.md
    const socs = await KnowledgeLoader.listSocs();
    assert(Array.isArray(socs),                                       'listSocs() devuelve array');
    assert(socs.length >= 8,                                          'listSocs() encuentra ≥8 SOCs en _index.md');
    assert(socs.some(s => s.slug === 'teamtowers-brand'),             'listSocs() incluye teamtowers-brand (raíz marca)');
    assert(socs.some(s => s.slug === 'fent-pinya'),                   'listSocs() incluye fent-pinya');
    assert(socs.some(s => s.slug === 'soc-vna-network'),              'listSocs() incluye soc-vna-network');
    assert(socs.some(s => s.slug === 'castellers-demo'),              'listSocs() incluye castellers-demo');
    assert(socs.some(s => s.slug === 'la-colla'),                     'listSocs() incluye la-colla (proceso VNA)');
    assert(socs.some(s => s.slug === 'teamtowers-merchandising'),     'listSocs() incluye teamtowers-merchandising');
    assert(socs.some(s => s.slug === 'proyecto-custom'),              'listSocs() incluye proyecto-custom (5 variantes)');
    assert(socs.some(s => s.slug === 'charla-conferencia'),           'listSocs() incluye charla-conferencia (teatralizada)');

    // listSops → al menos 6 SOPs
    const sopsList = await KnowledgeLoader.listSops();
    assert(Array.isArray(sopsList),                                   'listSops() devuelve array');
    assert(sopsList.length >= 6,                                      'listSops() encuentra ≥6 SOPs en _index.md');
    const sopEntry = sopsList.find(s => s.slug === 'fent-pinya-taller');
    assert(!!sopEntry,                                                'listSops() incluye fent-pinya-taller');
    assert(sopEntry.socRef === 'soc-fent-pinya',                      'sop fent-pinya-taller referencia soc-fent-pinya');
    assert(sopsList.some(s => s.slug === 'castellers-demo'),          'listSops() incluye castellers-demo');
    assert(sopsList.some(s => s.slug === 'la-colla'),                 'listSops() incluye la-colla');
    assert(sopsList.some(s => s.slug === 'teamtowers-merchandising'), 'listSops() incluye teamtowers-merchandising');
    assert(sopsList.some(s => s.slug === 'proyecto-custom'),          'listSops() incluye proyecto-custom (5 variantes)');
    assert(sopsList.some(s => s.slug === 'charla-conferencia'),       'listSops() incluye charla-conferencia (3 fases · arte vivo)');

    // getSocSeed → carga frontmatter y body del fichero
    const soc = await KnowledgeLoader.getSocSeed('fent-pinya');
    assert(!!soc,                                        'getSocSeed("fent-pinya") devuelve seed');
    assert(soc.id === 'soc-fent-pinya',                  'soc.id = soc-fent-pinya (del frontmatter)');
    assert(typeof soc.purpose === 'string' && soc.purpose.length > 30, 'soc.purpose presente');
    assert(soc.body.includes('Fent Pinya'),              'soc.body contiene contenido del MD');

    // getSopSeed → carga SOP con soc_ref. Duración real 2h core (120 min).
    const sop = await KnowledgeLoader.getSopSeed('fent-pinya-taller');
    assert(!!sop,                                        'getSopSeed("fent-pinya-taller") devuelve seed');
    assert(sop.socRef === 'soc-fent-pinya',              'sop.socRef = soc-fent-pinya');
    assert(sop.durationMinutes === 120,                  'sop.durationMinutes = 120 (2 h core, +30 min reflex opcional)');
    assert(sop.body.includes('Pinya'),                   'sop.body contiene contenido del MD');

    // buildContext con socs+sops → systemPrompt incluye contenido inyectado
    const ctx = await KnowledgeLoader.buildContext({
        includeVna: false,
        socs: ['fent-pinya'],
        sops: ['fent-pinya-taller'],
    });
    assert(typeof ctx.systemPrompt === 'string',                        'buildContext devuelve systemPrompt');
    assert(ctx.systemPrompt.includes('SOC: SOC-FENT-PINYA'),            'systemPrompt incluye sección SOC');
    assert(ctx.systemPrompt.includes('SOP: SOP-FENT-PINYA-TALLER'),     'systemPrompt incluye sección SOP');
    assert(ctx.sources.includes('socs/fent-pinya.md'),                  'sources incluye SOC source');
    assert(ctx.sources.includes('sops/fent-pinya-taller.md'),           'sources incluye SOP source');

    // buildContext con projectId → carga nodos KB Mind-as-Graph del proyecto
    const pid = 'proj-test-h15-' + Date.now();
    const sopId = 'sop-test-h15-' + Date.now();
    await store.dispatch({ type: 'KB_UPSERT', payload: { node: {
        id:        sopId,
        type:      'sop',
        projectId: pid,
        content:   { title: 'Test SOP local del proyecto' },
    }}});
    const ctxKb = await KnowledgeLoader.buildContext({
        includeVna: false,
        projectId:  pid,
    });
    assert(ctxKb.systemPrompt.includes('CONTEXTO PROYECTO'),       'buildContext con projectId inyecta sección Mind-as-Graph');
    assert(ctxKb.systemPrompt.includes(pid),                       'systemPrompt incluye projectId');
    assert(ctxKb.sources.includes('kb://project/' + pid),          'sources incluye kb://project/...');

    // limpieza del SOP de prueba
    await store.dispatch({ type: 'KB_DELETE', payload: { id: sopId } });
}

// ─── H2.1 · Workshops · CRUD + cambio de estado ──────────────────
async function testWorkshopsCrud() {
    await KB.init();
    await store.init();

    const id = 'ws-test-' + Date.now();
    const node = {
        id,
        type: 'workshop',
        projectId: null,
        content: {
            clientName:   'Test Client SAU',
            type:         'fent-pinya',
            sector:       'consultoría',
            date:         Date.now(),
            audienceSize: 18,
            notes:        'Test taller',
            status:       'propuesta',
        },
        keywords: ['workshop', 'fent-pinya'],
    };

    // crear
    await store.dispatch({ type: 'KB_UPSERT', payload: { node } });
    const list1 = await KB.query({ type: 'workshop' });
    assert(list1.some(w => w.id === id),                                  'workshop creado y listable por type');
    const w1 = list1.find(w => w.id === id);
    assert(w1.content.status === 'propuesta',                             'status inicial = propuesta');
    assert(w1.content.clientName === 'Test Client SAU',                   'clientName persistido');
    assert(w1.content.audienceSize === 18,                                'audienceSize persistido');

    // cambio de estado: propuesta → agendado → impartido → cobrado
    for (const next of ['agendado', 'impartido', 'cobrado']) {
        const current = (await KB.query({ type: 'workshop' })).find(w => w.id === id);
        const updated = { ...current, content: { ...current.content, status: next } };
        await store.dispatch({ type: 'KB_UPSERT', payload: { node: updated } });
        const fresh = await KB.getNode(id);
        assert(fresh.content.status === next,                             'status transicionó a ' + next);
        assert(fresh.createdAt === current.createdAt,                     'createdAt preservado en transición ' + next);
    }

    // borrado
    await store.dispatch({ type: 'KB_DELETE', payload: { id } });
    const gone = await KB.getNode(id);
    assert(gone === null,                                                 'workshop eliminado');
    const list2 = await KB.query({ type: 'workshop' });
    assert(!list2.some(w => w.id === id),                                 'workshop ya no aparece en listado');
}

// ─── H2.3 · WorkshopsView · builder de prompt para propuesta IA ───
async function testWorkshopsProposalPromptBuilder() {
    const Mod = await import('../views/WorkshopsView.js?v=' + Date.now());
    const view = new Mod.default();
    const workshop = {
        id: 'ws-test-prompt',
        type: 'workshop',
        content: {
            clientName:   'Ayuntamiento de Vic',
            type:         'fent-pinya',
            sector:       'ayuntamiento',
            audienceSize: 22,
            date:         Date.now(),
            notes:        'cooperación inter-departamental',
            status:       'propuesta',
        }
    };
    const prompt = view.buildProposalPrompt(workshop);

    assert(typeof prompt === 'string' && prompt.length > 200, 'buildProposalPrompt devuelve string sustancioso');
    assert(prompt.includes('Ayuntamiento de Vic'),            'prompt incluye clientName');
    assert(prompt.includes('ayuntamiento'),                   'prompt incluye sector');
    assert(prompt.includes('22 personas'),                    'prompt incluye audienceSize formateado');
    assert(prompt.includes('cooperación inter-departamental'),'prompt incluye notas internas');
    assert(prompt.includes('soc-fent-pinya'),                 'prompt referencia SOC fent-pinya');
    assert(prompt.includes('sop-fent-pinya-taller'),          'prompt referencia SOP fent-pinya-taller');
    assert(prompt.includes('Markdown'),                       'prompt instruye output Markdown');
    assert(prompt.includes('[PRECIO]'),                       'prompt incluye placeholder de precio');
    assert(/máximo\s+600\s+palabras/i.test(prompt),           'prompt limita a 600 palabras');
}

// ─── H1.3 · Export/Import firmado del grafo (ECDSA P-256) ────────
async function testProjectIO() {
    const { exportSnapshot, verifySnapshot, importSnapshot } =
        await import('../core/projectIO.js?v=' + Date.now());
    await KB.init();
    await store.init();

    // sembrar un nodo único para verificar el roundtrip
    const probeId = 'probe-h13-' + Date.now();
    await store.dispatch({ type: 'KB_UPSERT', payload: { node: {
        id:        probeId,
        type:      'soc',
        projectId: 'proj-h13-test',
        content:   { title: 'H1.3 probe', random: Math.random() },
        keywords:  ['probe', 'h13'],
    }}});

    // Export
    const snap = await exportSnapshot();
    assert(snap.format === 'sos-export',                   'snapshot tiene formato sos-export');
    assert(typeof snap.signature === 'string',             'snapshot tiene firma');
    assert(typeof snap.publicJwk === 'object',             'snapshot tiene publicJwk');
    assert(Array.isArray(snap.kbNodes),                    'snapshot tiene kbNodes array');
    assert(snap.kbNodes.some(n => n.id === probeId),       'snapshot incluye el nodo probe');
    assert(!snap.kbNodes.some(n => n.id === 'sos_signing_keypair_v1'), 'snapshot NO contiene par de claves');

    // Verify firma OK
    assert((await verifySnapshot(snap)) === true,          'verifySnapshot OK con snapshot íntegro');

    // Tampering: alterar un nodo dentro del snapshot debe romper firma
    const tampered = JSON.parse(JSON.stringify(snap));
    tampered.kbNodes.find(n => n.id === probeId).content.title = 'tampered!';
    let tamperRejected = false;
    try { await verifySnapshot(tampered); }
    catch (e) { tamperRejected = /Firma inv|alterado/i.test(e.message); }
    assert(tamperRejected,                                 'verifySnapshot rechaza snapshot alterado');

    // Borrar el nodo probe y reimportar (modo merge) → debe volver
    await store.dispatch({ type: 'KB_DELETE', payload: { id: probeId } });
    assert((await KB.getNode(probeId)) === null,           'nodo probe borrado antes del import');

    const result = await importSnapshot(snap, { mode: 'merge' });
    assert(result.imported >= 1,                           'importSnapshot importa ≥1 nodo');
    const restored = await KB.getNode(probeId);
    assert(restored && restored.id === probeId,            'nodo probe restaurado tras importSnapshot merge');
    assert(restored.content.title === 'H1.3 probe',        'contenido restaurado intacto (no el tampered)');

    // limpieza
    await store.dispatch({ type: 'KB_DELETE', payload: { id: probeId } });
}

// ─── H2.5 · WorkshopsView · builder de prompt para informe post-taller ──
async function testWorkshopsReportPromptBuilder() {
    const Mod = await import('../views/WorkshopsView.js?v=' + Date.now());
    const view = new Mod.default();
    const workshop = {
        id: 'ws-test-report',
        type: 'workshop',
        content: {
            clientName:   'Startup Innovació SL',
            type:         'fent-pinya',
            sector:       'startup',
            audienceSize: 14,
            date:         Date.now(),
            notes:        'fundadores recientes, primer offsite',
            status:       'impartido',
        }
    };
    const notes = '- Pinya fase 2: María tocó el hombro de Javier sin palabras.\n- Músic detectado: Sara (PM marketing).\n- Patrón: rotación excesiva de baixos.\n- 5 personas eligen rol distinto a su puesto.';

    const prompt = view.buildReportPrompt(workshop, notes);
    assert(typeof prompt === 'string' && prompt.length > 300, 'buildReportPrompt devuelve string sustancioso');
    assert(prompt.includes('Startup Innovació SL'),         'prompt incluye clientName');
    assert(prompt.includes('startup'),                      'prompt incluye sector');
    assert(prompt.includes('14 personas'),                  'prompt incluye audienceSize formateado');
    assert(prompt.includes('María tocó el hombro'),         'prompt embeda las capturas literales del formador');
    assert(prompt.includes('Sara (PM marketing)'),          'prompt embeda hallazgo del músic');
    assert(prompt.includes('soc-fent-pinya'),               'prompt referencia SOC fent-pinya');
    assert(prompt.includes('sop-fent-pinya-taller'),        'prompt referencia SOP fent-pinya-taller');
    assert(/Roles\s+VNA\s+detectados/i.test(prompt),        'prompt pide sección Roles VNA detectados');
    assert(/Acotxadors\s+invisibles/i.test(prompt),         'prompt pide sección Acotxadors invisibles');
    assert(/Patrones\s+de\s+disfunci/i.test(prompt),        'prompt pide sección Patrones de disfunción');
    assert(/máximo\s+900\s+palabras/i.test(prompt),         'prompt limita a 900 palabras');
    assert(/NO\s+inventes/i.test(prompt),                   'prompt prohíbe explícitamente inventar contenido');

    // Sin notas: el prompt debe seguir construyéndose pero advertir explícitamente
    const empty = view.buildReportPrompt(workshop, '');
    assert(/sin\s+notas/i.test(empty),                      'prompt vacío señala "sin notas" para que la IA marque [pendiente]');
}

// ─── H2.6 · Selector tipo de servicio · prompts dinámicos por tipo ────────
async function testWorkshopsServiceTypeSelector() {
    const Mod = await import('../views/WorkshopsView.js?v=' + Date.now());
    const view = new Mod.default();

    const baseContent = {
        clientName:   'Cliente test H2.6',
        sector:       'corporativo',
        audienceSize: 30,
        date:         Date.now(),
        notes:        'notas',
        status:       'propuesta',
    };

    // Fent Pinya (default)
    const wFent = { id: 'ws-h26-fent', type: 'workshop', content: { ...baseContent, type: 'fent-pinya' } };
    const pFent = view.buildProposalPrompt(wFent);
    assert(pFent.includes('Fent Pinya'),               'prompt Fent Pinya menciona Fent Pinya');
    assert(pFent.includes('soc-fent-pinya'),           'prompt Fent Pinya referencia soc-fent-pinya');
    assert(pFent.includes('sop-fent-pinya-taller'),    'prompt Fent Pinya referencia sop-fent-pinya-taller');
    assert(pFent.includes('UNESCO'),                   'prompt Fent Pinya menciona Patrimonio UNESCO');

    // La Colla (proceso VNA)
    const wColla = { id: 'ws-h26-colla', type: 'workshop', content: { ...baseContent, type: 'la-colla' } };
    const pColla = view.buildProposalPrompt(wColla);
    const rColla = view.buildReportPrompt(wColla, '- Saturación en nodo central\n- 7 propuestas de mejora\n- Roles emergentes');
    assert(pColla.includes('La Colla'),                'prompt La Colla menciona La Colla');
    assert(pColla.includes('soc-la-colla'),            'prompt La Colla referencia soc-la-colla');
    assert(pColla.includes('sop-la-colla'),            'prompt La Colla referencia sop-la-colla');
    assert(rColla.includes('Mapa VNA del ámbito'),     'informe La Colla incluye sección Mapa VNA del ámbito');
    assert(rColla.includes('Pulso de satisfacción'),   'informe La Colla incluye sección Pulso de satisfacción');
    assert(rColla.includes('Retos identificados'),     'informe La Colla incluye sección Retos identificados');
    assert(rColla.includes('Propuestas de mejora'),    'informe La Colla incluye sección Propuestas de mejora');

    // Demo castellera
    const wDemo = { id: 'ws-h26-demo', type: 'workshop', content: { ...baseContent, type: 'castellers-demo' } };
    const pDemo = view.buildProposalPrompt(wDemo);
    const rDemo = view.buildReportPrompt(wDemo, '- 4 castells construidos\n- Vídeo entregado\n- Sin incidencias');
    assert(pDemo.includes('Demo castellera'),          'prompt Demo menciona Demo castellera');
    assert(pDemo.includes('soc-castellers-demo'),      'prompt Demo referencia soc-castellers-demo');
    assert(rDemo.includes('Castells construidos'),     'informe Demo incluye sección Castells construidos');

    // Merchandising
    const wMerch = { id: 'ws-h26-merch', type: 'workshop', content: { ...baseContent, type: 'merchandising' } };
    const pMerch = view.buildProposalPrompt(wMerch);
    assert(pMerch.includes('Merchandising'),           'prompt Merch menciona Merchandising');
    assert(pMerch.includes('soc-teamtowers-merchandising'), 'prompt Merch referencia soc-teamtowers-merchandising');

    // Charla / Conferencia
    const wCharla = { id: 'ws-h26-charla', type: 'workshop', content: { ...baseContent, type: 'charla-conferencia' } };
    const pCharla = view.buildProposalPrompt(wCharla);
    assert(pCharla.includes('Charla'),                 'prompt Charla menciona Charla');
    assert(pCharla.includes('soc-charla-conferencia'), 'prompt Charla referencia soc-charla-conferencia');

    // Proyecto custom
    const wCust = { id: 'ws-h26-cust', type: 'workshop', content: { ...baseContent, type: 'proyecto-custom' } };
    const pCust = view.buildProposalPrompt(wCust);
    assert(pCust.includes('Proyecto custom'),          'prompt Custom menciona Proyecto custom');
    assert(pCust.includes('soc-proyecto-custom'),      'prompt Custom referencia soc-proyecto-custom');

    // Tipo desconocido → cae a Fent Pinya como fallback
    const wUnknown = { id: 'ws-h26-unk', type: 'workshop', content: { ...baseContent, type: 'tipo-inventado' } };
    const pUnknown = view.buildProposalPrompt(wUnknown);
    assert(pUnknown.includes('soc-fent-pinya'),        'tipo desconocido cae al fallback Fent Pinya');

    // Brand SOC siempre presente (heredado en todos los tipos)
    assert(pFent.includes('soc-teamtowers-brand'),     'prompt Fent Pinya hereda SOC raíz brand');
    assert(pColla.includes('soc-teamtowers-brand'),    'prompt La Colla hereda SOC raíz brand');
    assert(pDemo.includes('soc-teamtowers-brand'),     'prompt Demo hereda SOC raíz brand');
}

// ─── H7.1 · Kanban Work Orders · CRUD + transiciones + ledger ─────────────
async function testKanbanWorkOrders() {
    const Mod = await import('../views/KanbanView.js?v=' + Date.now());
    const { computeWOCost } = Mod;
    await KB.init();
    await store.init();

    // 1. computeWOCost — humano sin actualHours → realCost 0
    const woHumanEst = {
        id: 'wo-test-h-est', type: 'work_order',
        content: { assignee: { kind: 'human', id: '@alvaro' }, estimatedHours: 2, fmvPerHour: 60, actualHours: null }
    };
    const cHumanEst = computeWOCost(woHumanEst);
    assert(cHumanEst.humanCostEstimated === 120,                   'computeWOCost humano: estimado = horas × FMV');
    assert(cHumanEst.humanCostReal === null,                       'computeWOCost humano sin actualHours: real = null');
    assert(cHumanEst.savingEur === null,                           'computeWOCost humano: ahorro = null (no es IA)');

    // 2. computeWOCost — IA con tokens (Anthropic Sonnet)
    const woAi = {
        id: 'wo-test-ai', type: 'work_order',
        content: {
            assignee: { kind: 'ai', id: 'anthropic', engine: 'anthropic' },
            estimatedHours: 2, fmvPerHour: 60,
            actualHours: 0,
            tokensIn:  10000,   // 10K tokens entrada
            tokensOut: 2000,    // 2K tokens salida
        }
    };
    const cAi = computeWOCost(woAi);
    // Coste bruto: (10000/1e6)*3 + (2000/1e6)*15 = 0.030 + 0.030 = 0.060 USD/EUR
    // Con markup 30%: 0.060 * 1.30 = 0.078
    assert(Math.abs(cAi.aiCostReal - 0.078) < 0.001,               'computeWOCost IA: tokens × precio × markup = 0.078 €');
    assert(cAi.humanCostEstimated === 120,                         'computeWOCost IA: humano estimado se conserva (120 €)');
    assert(cAi.savingEur > 119 && cAi.savingEur < 120,             'computeWOCost IA: ahorro ≈ 120 - 0.078 = 119.92 €');

    // 3. CRUD de work_order vía store/KB
    const woId = 'wo-test-' + Date.now();
    const node = {
        id:        woId,
        type:      'work_order',
        projectId: null,
        content: {
            title:           'Test WO H7.1',
            description:     'Generar propuesta IKEA',
            assignee:        { kind: 'human', id: '@alvaro' },
            approvalRule:    'manual',
            priority:        'high',
            estimatedHours:  1.5,
            fmvPerHour:      80,
            actualHours:     null,
            status:          'backlog',
        },
        keywords: ['work_order', 'human'],
    };
    await store.dispatch({ type: 'KB_UPSERT', payload: { node } });
    const stored = await KB.getNode(woId);
    assert(stored?.content?.status === 'backlog',                   'WO creada en estado backlog');
    assert(stored?.content?.assignee?.kind === 'human',             'WO assignee.kind = human');

    // 4. Transición backlog → doing
    const w1 = { ...stored, content: { ...stored.content, status: 'doing' } };
    await store.dispatch({ type: 'KB_UPSERT', payload: { node: w1 } });
    assert((await KB.getNode(woId)).content.status === 'doing',     'transición backlog→doing OK');

    // 5. Transición doing → done con actualHours
    const w2 = { ...w1, content: { ...w1.content, status: 'done', actualHours: 2 } };
    await store.dispatch({ type: 'KB_UPSERT', payload: { node: w2 } });
    const d2 = await KB.getNode(woId);
    assert(d2.content.status === 'done',                            'transición doing→done OK');
    assert(d2.content.actualHours === 2,                            'actualHours capturado en done');

    // 6. Transición done → ledgered: simula _ledgerize calculando coste y dispatch LEDGER_UPDATE
    const cost = computeWOCost(d2);
    assert(cost.humanCostReal === 160,                              'humanCostReal = 2 h × 80 €/h = 160 €');
    const projectId = 'proj-test-h71-' + Date.now();
    const projectsBefore = store.getState().projects.length;
    // Crear proyecto destino mínimo si no existe (para que LEDGER_UPDATE encuentre projects[idx])
    await store.dispatch({ type: 'CREATE_PROJECT', payload: { id: projectId, nombre: 'Test H7.1', sector_id: 'N' } });
    await store.dispatch({ type: 'LEDGER_UPDATE', payload: {
        projectId,
        workOrderId: woId,
        agentId: '@alvaro',
        assigneeKind: 'human',
        realHours: 2,
        fmv: 80,
        multiplier: 1,
        humanCostReal: cost.humanCostReal,
    }});
    const finalProj = store.getState().projects.find(p => p.id === projectId);
    assert(!!finalProj,                                             'proyecto destino existe');
    assert(Array.isArray(finalProj.ledger) && finalProj.ledger.length >= 1, 'ledger del proyecto recibe entry');
    const lastEntry = finalProj.ledger[finalProj.ledger.length - 1];
    assert(lastEntry.workOrderId === woId,                          'ledger entry referencia la WO');
    assert(lastEntry.slices === 160,                                'slices = realHours × fmv × multiplier = 160');

    // 7. Marcar WO como ledgered
    const w3 = {
        ...d2,
        content: {
            ...d2.content,
            status:        'ledgered',
            ledgeredAt:    Date.now(),
            humanCostEur:  cost.humanCostReal,
            ledgerProjectId: projectId,
        }
    };
    await store.dispatch({ type: 'KB_UPSERT', payload: { node: w3 } });
    const w3Stored = await KB.getNode(woId);
    assert(w3Stored.content.status === 'ledgered',                  'WO marcada como ledgered');
    assert(w3Stored.content.ledgerProjectId === projectId,          'WO referencia el proyecto del ledger');

    // 8. KB.query type=work_order encuentra el nodo
    const allWO = await KB.query({ type: 'work_order' });
    assert(allWO.some(w => w.id === woId),                          'KB.query({type:work_order}) lista la WO');

    // 9. Limpieza (no destructiva)
    await store.dispatch({ type: 'KB_DELETE', payload: { id: woId } });
    assert((await KB.getNode(woId)) === null,                       'WO borrada de KB');
}

// ─── H7.2 · KanbanView · prompt builder de auto-ejecución IA + TDD eval ────
async function testKanbanExecutionPromptAndTdd() {
    const Mod = await import('../views/KanbanView.js?v=' + Date.now());
    const { buildExecutionPrompt } = Mod;

    // 1. Builder produce prompt con datos críticos de la WO
    const wo = {
        id: 'wo-test-h72',
        type: 'work_order',
        content: {
            title:       'Generar propuesta IKEA Madrid',
            description: 'Propuesta de servicio de cosecha VNA fase 6',
            sopRef:      'sop-la-colla',
            stepRef:     'fase-6-cosecha',
            workshopId:  'ws-ikea-madrid',
            assignee:    { kind: 'ai', id: 'anthropic', engine: 'anthropic' },
            approvalRule: 'manual',
        },
    };
    const p = buildExecutionPrompt(wo);
    assert(typeof p === 'string' && p.length > 200,           'buildExecutionPrompt devuelve string sustancioso');
    assert(p.includes('Generar propuesta IKEA Madrid'),       'prompt incluye título de la WO');
    assert(p.includes('cosecha VNA fase 6'),                  'prompt incluye descripción');
    assert(p.includes('sop-la-colla'),                        'prompt incluye sopRef');
    assert(p.includes('fase-6-cosecha'),                      'prompt incluye stepRef');
    assert(p.includes('ws-ikea-madrid'),                      'prompt incluye workshopId');
    assert(p.includes('anthropic'),                           'prompt declara engine');
    assert(p.includes('soc-teamtowers-brand'),                'prompt invoca el SOC raíz brand');
    assert(p.includes('NO inventes'),                         'prompt prohíbe inventar');
    assert(p.includes('[VER CATÁLOGO]'),                      'prompt instruye placeholder de precio');

    // 2. Si approvalRule=tdd-auto y hay tddCheck, el prompt lo embeda
    const woTdd = {
        ...wo,
        content: { ...wo.content, approvalRule: 'tdd-auto', tddCheck: 'h2Count:6' },
    };
    const pTdd = buildExecutionPrompt(woTdd);
    assert(pTdd.includes('h2Count:6'),                        'prompt embeda el tddCheck cuando approvalRule=tdd-auto');
    assert(/test booleano/i.test(pTdd),                       'prompt avisa explícitamente del test booleano');

    // 3. Evaluador TDD (privado, lo testeamos via instancia)
    const ViewClass = Mod.default;
    const view = new ViewClass();
    assert(view._evalTdd('contains:Pinya', 'Esto contiene Pinya y más') === true,    'TDD contains: hit');
    assert(view._evalTdd('contains:Saturno', 'Esto contiene Pinya y más') === false, 'TDD contains: miss');
    assert(view._evalTdd('minLen:50', 'corto') === false,                            'TDD minLen: muy corto');
    assert(view._evalTdd('minLen:5', 'suficiente') === true,                         'TDD minLen: suficiente');
    assert(view._evalTdd('h2Count:2', '## A\n## B\n## C') === true,                  'TDD h2Count: 3 ≥ 2');
    assert(view._evalTdd('h2Count:5', '## A\n## B') === false,                       'TDD h2Count: 2 < 5');
    assert(view._evalTdd('regex:/^# /', '# Título principal') === true,              'TDD regex: anchor inicio');
    assert(view._evalTdd('regex:/[ñ]/', 'campaña') === true,                         'TDD regex: ñ');
    assert(view._evalTdd('formato-invalido', 'cualquier cosa') === false,            'TDD inválido devuelve false');
    assert(view._evalTdd(null, 'output') === false,                                  'TDD null devuelve false');
    assert(view._evalTdd('', 'output') === false,                                    'TDD vacío devuelve false');
}

// ─── H1.8 · Auditoría TDD del Knowledge Base · readiness sectores ─────────
async function testSectorReadiness() {
    const { KnowledgeLoader } = await import('../core/KnowledgeLoader.js?v=' + Date.now());
    KnowledgeLoader.clearCache();

    const sectors = await KnowledgeLoader.listSectors();
    assert(Array.isArray(sectors),                                       'listSectors devuelve array');
    assert(sectors.length >= 21,                                         'listSectors devuelve ≥21 sectores (CNAE A-UV)');

    // Cada sector tiene readiness válido y conteos numéricos
    sectors.forEach(s => {
        assert(['ready','solid','tier 2'].includes(s.readiness),         's=' + s.id + ' tiene readiness válido (' + s.readiness + ')');
        assert(typeof s.roles === 'number',                              's=' + s.id + ' tiene roles count numérico');
        assert(typeof s.transactions === 'number',                       's=' + s.id + ' tiene transactions count numérico');
        assert(typeof s.patterns === 'number',                           's=' + s.id + ' tiene patterns count numérico');
    });

    // Criterio de excelencia: K (Tech) y N (Consulting) deben ser ready
    // (auditor confirmó 10 roles · 16 tx · 5 patterns · bilingüe en ambos)
    const k = sectors.find(s => s.id === 'K');
    const n = sectors.find(s => s.id === 'N');
    assert(!!k && k.readiness === 'ready',                               'K (Tech/Software) calificado ready según criterio TDD');
    assert(!!n && n.readiness === 'ready',                               'N (Consulting) calificado ready según criterio TDD');

    // F (Construction) tiene 8 roles · 12 tx · 3 patterns → no llega al umbral
    const f = sectors.find(s => s.id === 'F');
    assert(!!f && f.readiness !== 'ready',                               'F (Construction) NO llega a ready (12 tx < 14, 3 patterns < 4)');

    // Distribución sana: al menos 1 ready y al menos 5 solid (mayoría del catálogo)
    const ready = sectors.filter(s => s.readiness === 'ready').length;
    const solid = sectors.filter(s => s.readiness === 'solid').length;
    assert(ready >= 1,                                                   'al menos 1 sector ready');
    assert(solid + ready >= 15,                                          '≥15 sectores cubren al menos el umbral solid (KB con cobertura)');

    // El criterio _computeSectorReadiness es determinista y reusable
    // H1.8.1: bilingualRoles ya no es bloqueante para 'ready' (sólo hasEn lo es)
    assert(KnowledgeLoader._computeSectorReadiness({ roles: 10, txs: 14, patterns: 4, hasEn: true }) === 'ready',  'criterio TDD: 10/14/4 + sector_name_en → ready');
    assert(KnowledgeLoader._computeSectorReadiness({ roles: 10, txs: 14, patterns: 4, hasEn: false }) === 'solid', 'criterio TDD: cuantitativo OK pero sin EN → solid (no ready)');
    assert(KnowledgeLoader._computeSectorReadiness({ roles: 8,  txs: 12, patterns: 3, hasEn: true })  === 'solid',  'criterio TDD: 8/12/3 → solid');
    assert(KnowledgeLoader._computeSectorReadiness({ roles: 3,  txs: 5,  patterns: 1, hasEn: false }) === 'tier 2', 'criterio TDD: muy bajo → tier 2');
}

// ─── H7.3 · Auto-generación de WOs desde SOP con steps[] ─────────────────
async function testGenerateWosFromSop() {
    const KLMod  = await import('../core/KnowledgeLoader.js?v=' + Date.now());
    const KbMod  = await import('../views/KanbanView.js?v=' + Date.now());
    const { KnowledgeLoader } = KLMod;
    const { generateWosFromSop } = KbMod;
    KnowledgeLoader.clearCache();

    // 1. fent-pinya-taller tiene steps[] tras H7.3
    const stepsFent = await KnowledgeLoader.getSopSteps('fent-pinya-taller');
    assert(Array.isArray(stepsFent),                                  'getSopSteps devuelve array para fent-pinya-taller');
    assert(stepsFent.length >= 10,                                    'fent-pinya-taller tiene ≥10 steps (8 guion + cosecha + informe)');
    assert(stepsFent.some(s => s.id === 'paso-1-apertura'),           'fent-pinya-taller incluye paso-1-apertura');
    assert(stepsFent.some(s => s.id === 'paso-7-aleta'),              'fent-pinya-taller incluye paso-7-aleta (catarsis)');
    const apertura = stepsFent.find(s => s.id === 'paso-1-apertura');
    assert(apertura.duration_minutes === 10,                          'paso apertura: 10 min');
    assert(apertura.role_kind === 'human',                            'paso apertura: role_kind=human');

    // 2. la-colla tiene steps multi-sesión
    const stepsColla = await KnowledgeLoader.getSopSteps('la-colla');
    assert(Array.isArray(stepsColla) && stepsColla.length >= 12,      'la-colla tiene ≥12 steps (3 fases × pasos)');
    assert(stepsColla.some(s => s.id === 'fase-b1-paso-5'),           'la-colla incluye paso 5 mapeo MUST/EXTRA');
    assert(stepsColla.some(s => s.role_kind === 'ai'),                'la-colla tiene al menos 1 step asignado a IA');
    const informe = stepsColla.find(s => s.id === 'fase-c2-informe');
    assert(informe && informe.role_kind === 'ai',                     'fase-c2-informe es asignada a IA');

    // 3. SOP que existe pero NO tiene steps[] devuelve array vacío (no rompe)
    //    castellers-demo y teamtowers-merchandising siguen siendo narrativos sin steps[]
    const stepsDemo = await KnowledgeLoader.getSopSteps('castellers-demo');
    assert(Array.isArray(stepsDemo) && stepsDemo.length === 0,        'castellers-demo (narrativo, sin steps[]) devuelve []');

    // 3b. SOP con steps tras enriquecimiento H1.6.1
    const stepsCustom = await KnowledgeLoader.getSopSteps('proyecto-custom');
    assert(Array.isArray(stepsCustom) && stepsCustom.length >= 7,     'proyecto-custom v1 tiene ≥7 steps tras H1.6.1');
    const stepsCharla = await KnowledgeLoader.getSopSteps('charla-conferencia');
    assert(Array.isArray(stepsCharla) && stepsCharla.length >= 9,     'charla-conferencia v1 tiene ≥9 steps tras H1.6.1');

    // 3c. SOP inexistente devuelve []
    const stepsNada = await KnowledgeLoader.getSopSteps('inexistente-xyz');
    assert(Array.isArray(stepsNada) && stepsNada.length === 0,        'getSopSteps de slug inexistente devuelve []');

    // 4. generateWosFromSop con un array de steps de prueba
    const fakeSteps = [
        { id: 'paso-uno', label: 'Paso uno', duration_minutes: 15, role_kind: 'human', role_profile: 'facilitador', approval_rule: 'manual', priority: 'high', deliverable_kind: 'artefacto-x' },
        { id: 'paso-dos', label: 'Paso dos · IA', duration_minutes: 30, role_kind: 'ai',  role_profile: 'agente_anthropic', approval_rule: 'tdd-auto', priority: 'med', deliverable_kind: 'informe' },
    ];
    const wos = generateWosFromSop('mi-sop-test', fakeSteps, { workshopId: 'ws-x', fmvPerHour: 80, socRefs: ['soc-teamtowers-brand'] });
    assert(wos.length === 2,                                          'generateWosFromSop produce 1 WO por step');

    // Step 0 (humano)
    assert(wos[0].type === 'work_order',                              'WO[0] es type=work_order');
    assert(wos[0].content.title === 'Paso uno',                       'WO[0] title heredado del label');
    assert(wos[0].content.sopRef === 'sop-mi-sop-test',               'WO[0] sopRef formateado con prefijo sop-');
    assert(wos[0].content.stepRef === 'paso-uno',                     'WO[0] stepRef heredado del id del step');
    assert(wos[0].content.assignee.kind === 'human',                  'WO[0] assignee.kind = human');
    assert(wos[0].content.assignee.id === 'facilitador',              'WO[0] assignee.id = role_profile');
    assert(wos[0].content.priority === 'high',                        'WO[0] priority heredado');
    assert(wos[0].content.estimatedHours === 0.25,                    'WO[0] estimatedHours = 15min/60 = 0.25');
    assert(wos[0].content.fmvPerHour === 80,                          'WO[0] fmvPerHour heredado de options');
    assert(wos[0].content.workshopId === 'ws-x',                      'WO[0] workshopId pasado');
    assert(wos[0].content.deliverableKind === 'artefacto-x',          'WO[0] deliverableKind heredado');
    assert(Array.isArray(wos[0].content.socRefs) && wos[0].content.socRefs[0] === 'soc-teamtowers-brand', 'WO[0] socRefs heredados');

    // Step 1 (IA con tdd-auto)
    assert(wos[1].content.assignee.kind === 'ai',                     'WO[1] assignee.kind = ai');
    assert(wos[1].content.assignee.engine === 'anthropic',            'WO[1] engine asignado por defecto');
    assert(wos[1].content.approvalRule === 'tdd-auto',                'WO[1] approvalRule heredado');

    // 5. IDs únicos para evitar colisiones en bulk insert
    const ids = wos.map(w => w.id);
    assert(new Set(ids).size === ids.length,                          'IDs de WO generados son únicos');

    // 6. Caso degenerado: no array
    const empty = generateWosFromSop('no-existe', null);
    assert(Array.isArray(empty) && empty.length === 0,                'generateWosFromSop con steps=null devuelve []');
}

// ─── H1.10.1 · Sector Cloner · prompt builder ─────────────────────────────
async function testSectorClonerPromptBuilder() {
    const { buildClonePrompt } = await import('../core/sectorCloner.js?v=' + Date.now());

    const sectorSeed = {
        sectorId:   'K',
        sectorName: 'Tech / Software / IA',
        roles: [
            { id: 'descubridor-oportunidad', name: 'Descubridor de oportunidad', castell_level: 'pom_de_dalt', description: 'Identifica problemas con potencial de mercado.', typical_actor: 'founder, PM, head of product' },
            { id: 'product-owner', name: 'Product Owner', castell_level: 'tronc', description: 'Prioriza el roadmap.', typical_actor: 'PO senior' },
        ],
        transactions: [
            { id: 'tx-1', from: 'descubridor-oportunidad', to: 'product-owner', deliverable: 'Hipótesis validada', type: 'tangible', is_must: true, health_hint: 'Sin esto el roadmap es vacío' },
        ],
        patterns: [
            { name: 'Discovery infinito', description: 'Equipo no llega a entregar.', signal: '>3 meses sin release.' },
        ],
    };

    const prompt = buildClonePrompt({
        sectorId:           'K',
        sectorSeed,
        clientName:         'Startup XYZ Madrid',
        clientDescription:  'SaaS B2B de gestión de incidencias para retailers, equipo 12 personas, sponsor CTO',
    });

    assert(typeof prompt === 'string' && prompt.length > 400,        'buildClonePrompt devuelve string sustancioso');
    assert(prompt.includes('Startup XYZ Madrid'),                    'prompt incluye clientName');
    assert(prompt.includes('SaaS B2B de gestión de incidencias'),    'prompt incluye descripción del cliente');
    assert(prompt.includes('"K"'),                                   'prompt incluye sectorId');
    assert(prompt.includes('descubridor-oportunidad'),               'prompt embebe los roles del sector base');
    assert(prompt.includes('Hipótesis validada'),                    'prompt embebe transacciones del sector base');
    assert(prompt.includes('Discovery infinito'),                    'prompt embebe patterns del sector base');
    assert(prompt.includes('CONSERVA los IDs'),                      'prompt instruye conservar IDs base (trazabilidad)');
    assert(prompt.includes('client-'),                               'prompt instruye prefijo client- para emergentes');
    assert(prompt.includes('NO inventes'),                           'prompt prohíbe inventar sin contexto');
    assert(prompt.includes('NO incluyas precios'),                   'prompt prohíbe precios');
    assert(prompt.includes('soc-teamtowers-brand'),                  'prompt referencia SOC raíz brand');
    assert(prompt.includes('"based_on_sector"'),                     'prompt define schema con based_on_sector');
    assert(prompt.includes('emergent_notes'),                        'prompt pide emergent_notes en el output');
    assert(/SÓLO\s+JSON/i.test(prompt),                              'prompt instruye output JSON sin texto adicional');
    // UX-002 fase 2 · cloner pide folksonomy a nivel proyecto Y a nivel rol
    assert(prompt.includes('"folksonomy"'),                          'UX-002 · cloner schema incluye folksonomy de proyecto');
    assert(/"tags":.*kebab-case/i.test(prompt),                      'UX-002 · cloner schema explicita tags por rol en kebab-case');

    // Caso degenerado: sector seed vacío sigue produciendo prompt válido
    const empty = buildClonePrompt({
        sectorId: 'K',
        sectorSeed: { roles: [], transactions: [], patterns: [] },
        clientName: 'X',
        clientDescription: 'Y',
    });
    assert(typeof empty === 'string' && empty.length > 200,          'buildClonePrompt con seed vacío sigue funcionando');
    assert(empty.includes('roles:\n  []'),                            'sector vacío produce roles: []');
}

// ─── BUG-002 · extractJsonFromLlmOutput · robusto contra fences markdown ──
async function testExtractJsonFromLlmOutput() {
    const { extractJsonFromLlmOutput } = await import('../core/Orchestrator.js?v=' + Date.now());

    // Caso real del bug: Anthropic devuelve ```json\n{...}\n```
    const real = '```json\n{\n  "client_id": "ikea-madrid",\n  "roles": [{"id": "x"}]\n}\n```';
    const r1 = extractJsonFromLlmOutput(real);
    assert(r1.client_id === 'ikea-madrid',                            'fence ```json extrae JSON real');
    assert(Array.isArray(r1.roles),                                   'fence ```json preserva estructura anidada');

    // JSON puro sin fences
    assert(extractJsonFromLlmOutput('{"a": 1}').a === 1,              'JSON puro');

    // Fence ``` sin label de lenguaje
    assert(extractJsonFromLlmOutput('```\n{"a": 2}\n```').a === 2,    'fence ``` sin label');

    // Fence con texto explicativo antes y después
    assert(extractJsonFromLlmOutput('Aquí tienes:\n```json\n{"a": 3}\n```\nFin.').a === 3, 'fence con texto explicativo alrededor');

    // Array como root
    const arr = extractJsonFromLlmOutput('```json\n[1, 2, 3]\n```');
    assert(Array.isArray(arr) && arr.length === 3,                    'fence con array root');

    // JSON con texto explicativo alrededor SIN fences (LLM rebelde)
    assert(extractJsonFromLlmOutput('Sure, here is:\n{"a": 4}\nDone.').a === 4, 'JSON sin fences pero con texto');

    // JSON con strings que contienen llaves (no debe confundirse)
    const tricky = extractJsonFromLlmOutput('```json\n{"msg": "Hola {mundo}", "n": 5}\n```');
    assert(tricky.msg === 'Hola {mundo}',                             'no se confunde con llaves dentro de strings');
    assert(tricky.n === 5,                                            'parsea correctamente tras string con llaves');

    // JSON con caracteres escapados
    const esc = extractJsonFromLlmOutput('```json\n{"path": "C:\\\\Users", "quote": "\\"hola\\""}\n```');
    assert(esc.path === 'C:\\Users',                                  'escapes en strings se preservan');

    // Caso degenerado: input vacío lanza
    let threwEmpty = false;
    try { extractJsonFromLlmOutput(''); } catch(_) { threwEmpty = true; }
    assert(threwEmpty,                                                'input vacío lanza excepción');

    // Caso degenerado: null lanza
    let threwNull = false;
    try { extractJsonFromLlmOutput(null); } catch(_) { threwNull = true; }
    assert(threwNull,                                                 'input null lanza excepción');

    // Caso degenerado: texto sin JSON lanza
    let threwNoJson = false;
    try { extractJsonFromLlmOutput('esto no es json'); } catch(_) { threwNoJson = true; }
    assert(threwNoJson,                                               'texto sin JSON lanza excepción');
}

// ─── H1.10.2 · Role SOP Generator · prompt builder ───────────────────────
async function testRoleSopGeneratorPromptBuilder() {
    const { buildRoleSopPrompt } = await import('../core/roleSopGenerator.js?v=' + Date.now());

    const role = {
        id: 'atencion-cliente',
        name: 'Atención al Cliente',
        castell_level: 'tronc',
        description: 'Resuelve incidencias post-venta de servicios',
        typical_actor: 'Operador con experiencia en escalado de incidencias',
        tags: ['cliente', 'incidencias', 'soporte'],
    };
    const project = {
        id:               'proj-ikea-mad-01',
        nombre:           'IKEA Madrid · Servicios y Devoluciones',
        sector_id:        'K',
        based_on_sector:  'K',
        vna_transactions: [
            { id: 'tx-1', from: 'cliente', to: 'atencion-cliente', deliverable: 'Pedido (IT)', type: 'tangible', is_must: true },
            { id: 'tx-2', from: 'atencion-cliente', to: 'cliente',  deliverable: 'Solución',    type: 'tangible', is_must: true },
            { id: 'tx-3', from: 'atencion-cliente', to: 'coordinacion-servicios', deliverable: 'Resolución Causa Raíz', type: 'intangible', is_must: false },
        ],
    };

    const prompt = buildRoleSopPrompt({ role, project });
    assert(typeof prompt === 'string' && prompt.length > 400,             'buildRoleSopPrompt devuelve string sustancioso');
    assert(prompt.includes('IKEA Madrid · Servicios y Devoluciones'),     'prompt incluye nombre del proyecto');
    assert(prompt.includes('atencion-cliente'),                           'prompt incluye id del rol');
    assert(prompt.includes('Atención al Cliente'),                        'prompt incluye nombre del rol');
    assert(prompt.includes('Operador con experiencia'),                   'prompt incluye typical_actor');
    assert(prompt.includes('OUT → cliente'),                              'prompt embeba transacciones SALIENTES con dirección');
    assert(prompt.includes('IN  ← cliente'),                              'prompt embeba transacciones ENTRANTES con dirección');
    assert(prompt.includes('Resolución Causa Raíz'),                      'prompt incluye deliverable de transacción intangible');
    assert(prompt.includes('soc-teamtowers-brand'),                       'prompt referencia SOC raíz brand (irrenunciables)');
    assert(prompt.includes('NO inventar precios'),                        'prompt prohíbe precios');
    assert(prompt.includes('AL MENOS UN step'),                           'prompt fuerza al menos 1 step IA cuando aplique');
    assert(prompt.includes('"role_ref": "atencion-cliente"'),             'schema JSON pide role_ref del rol');
    assert(prompt.includes('"project_ref": "proj-ikea-mad-01"'),          'schema JSON pide project_ref del proyecto');
    assert(/SÓLO\s+JSON\s+v[aá]lido/i.test(prompt),                       'prompt instruye output JSON sin texto adicional');
    // UX-002 fase 2 · prompt pide folksonomy del LLM
    assert(prompt.includes('"folksonomy"'),                               'UX-002 · schema JSON incluye campo folksonomy');
    assert(/folksonomy.*kebab-case/i.test(prompt),                        'UX-002 · folksonomy especifica kebab-case');
    assert(/sin .{0,3}:/i.test(prompt) && /NO uses prefijos/i.test(prompt), 'UX-002 · folksonomy prohíbe explícitamente prefijos `:`');

    // Caso degenerado: rol sin transacciones (cliente VNA recién clonado)
    const orphan = buildRoleSopPrompt({
        role: { id: 'rol-x', name: 'Rol X' },
        project: { id: 'proj-y', nombre: 'Proyecto Y', sector_id: 'K' },
    });
    assert(typeof orphan === 'string' && orphan.length > 200,             'rol sin transacciones produce prompt válido');
    assert(orphan.includes('(ninguna definida'),                          'rol sin transacciones marca explícitamente "ninguna definida"');

    // Sin role o project lanza excepción
    let threw = false;
    try { buildRoleSopPrompt({}); } catch(_) { threw = true; }
    assert(threw,                                                          'sin role/project lanza excepción');
}

// ─── H1.10.4 · Regenerate SOP with feedback · prompt builder ─────────────
async function testRegenerateSopBuilder() {
    const { buildRegenerateSopPrompt } = await import('../core/roleSopGenerator.js?v=' + Date.now());

    const previousSop = {
        id: 'sop-atencion-cliente-proj-x',
        name: 'SOP · Atención al Cliente',
        soc_ref: 'soc-vna-network',
        role_ref: 'atencion-cliente',
        project_ref: 'proj-x',
        version: 'v1',
        steps: [
            { id: 'step-1', label: 'Recibir incidencia', role_kind: 'human', priority: 'high' },
            { id: 'step-2', label: 'Tipificar',          role_kind: 'human', priority: 'med'  },
        ],
        summary: 'Atiende incidencias post-venta.',
    };
    const role    = { id: 'atencion-cliente', name: 'Atención al Cliente' };
    const project = { id: 'proj-x', nombre: 'Proyecto X', sector_id: 'K', based_on_sector: 'K' };
    const feedback = 'Añade un step IA que verifique calidad del output del paso 2 antes de pasar al paso 3.';

    const prompt = buildRegenerateSopPrompt({ previousSop, role, project, feedback });
    assert(typeof prompt === 'string' && prompt.length > 400,         'buildRegenerateSopPrompt devuelve string sustancioso');
    assert(prompt.includes(feedback),                                  'prompt embeba el feedback literal');
    assert(prompt.includes('FEEDBACK DEL OPERADOR'),                   'prompt marca claramente la sección de feedback');
    assert(prompt.includes('VERSIÓN ANTERIOR DEL SOP'),                'prompt embeba la versión anterior');
    assert(prompt.includes('"role_ref": "atencion-cliente"'),          'previousSop serializado contiene role_ref original');
    assert(prompt.includes('Conserva el `id`, `role_ref` y `project_ref`'), 'prompt instruye conservar identidad');
    assert(prompt.includes('Incrementa la versión'),                   'prompt instruye incrementar version');
    assert(prompt.includes('regeneration_notes'),                      'prompt pide regeneration_notes en el output');
    assert(/SÓLO\s+JSON\s+v[aá]lido/i.test(prompt),                    'prompt instruye output JSON puro');
    // UX-002 fase 2 · regenerate también pide folksonomy
    assert(/folksonomy/i.test(prompt),                                 'UX-002 · regenerate prompt incluye folksonomy');

    // Sin previousSop lanza
    let threwNoPrev = false;
    try { buildRegenerateSopPrompt({ feedback: 'algo', role, project }); } catch(_) { threwNoPrev = true; }
    assert(threwNoPrev,                                                'sin previousSop lanza excepción');

    // Sin feedback (o vacío) lanza
    let threwNoFb = false;
    try { buildRegenerateSopPrompt({ previousSop, feedback: '   ', role, project }); } catch(_) { threwNoFb = true; }
    assert(threwNoFb,                                                  'feedback vacío/whitespace lanza excepción');
}

// ─── H1.10.5 · Bulk SOP generation · skip/cancel logic ───────────────────
async function testBulkGenSopOrchestration() {
    // No usamos generateAllRoleSopsForProject directo (llama al LLM real).
    // Verificamos sólo la lógica de skip / cancel / total / progress
    // simulando una versión local con la misma firma.

    const project = {
        id: 'proj-bulk-test',
        nombre: 'Bulk Test',
        sector_id: 'K',
        based_on_sector: 'K',
        vna_roles: [
            { id: 'rol-1', name: 'Rol 1' },
            { id: 'rol-2', name: 'Rol 2' },
            { id: 'rol-3', name: 'Rol 3' },
        ],
    };
    const existingSops = [
        { content: { role_ref: 'rol-1' } },
    ];

    // Iterador equivalente al del orquestador real (versión testeable)
    const events = [];
    const generated = [];
    const errors = [];
    const existingByRole = new Set(existingSops.map(s => s.content.role_ref));
    let cancelled = false;
    const cancelOnIdx = 2;  // cancelamos justo antes del 3er rol
    let i = 0;
    for (const role of project.vna_roles) {
        if (i >= cancelOnIdx) { cancelled = true; break; }
        const baseEvt = { roleId: role.id, index: i, total: project.vna_roles.length };
        if (existingByRole.has(role.id)) {
            events.push({ ...baseEvt, status: 'skipped' });
        } else {
            events.push({ ...baseEvt, status: 'running' });
            // Simular generación OK
            generated.push({ roleRef: role.id });
            events.push({ ...baseEvt, status: 'done' });
        }
        i++;
    }

    assert(events.some(e => e.roleId === 'rol-1' && e.status === 'skipped'), 'rol-1 ya existente → skipped');
    assert(events.some(e => e.roleId === 'rol-2' && e.status === 'running'), 'rol-2 no existente → running emitido');
    assert(events.some(e => e.roleId === 'rol-2' && e.status === 'done'),    'rol-2 → done tras generar');
    assert(!events.some(e => e.roleId === 'rol-3'),                         'rol-3 no procesado por cancelación temprana');
    assert(cancelled === true,                                              'cancelled=true cuando se aborta');
    assert(generated.length === 1,                                          '1 SOP generado (rol-2)');

    // Verificar que el módulo real exporta la función
    const mod = await import('../core/roleSopGenerator.js?v=' + Date.now());
    assert(typeof mod.generateAllRoleSopsForProject === 'function',         'generateAllRoleSopsForProject exportada');
}

// ─── H7.6 · WO Assistant · contexto + prompt builder ─────────────
async function testWoAssistantContext() {
    const { assembleWoContext, buildWoAssistPrompt } = await import('../core/woAssistant.js?v=' + Date.now());

    const wo = {
        id: 'wo-test-001',
        type: 'work_order',
        projectId: 'proj-ikea-mad',
        content: {
            title:          'Diagnóstico devolución pedido #4521',
            description:    'Cliente reporta que el sofá no encaja en la sala. Evaluar opciones.',
            status:         'doing',
            priority:       'high',
            estimatedHours: 1.5,
            fmvPerHour:     50,
            sopRef:         'sop-atencion-cliente-proj-ikea-mad',
            socRefs:        ['soc-teamtowers-brand'],
            assignee:       { kind: 'human', id: '@maria' },
            projectId:      'proj-ikea-mad',
        },
    };
    const project = { id: 'proj-ikea-mad', nombre: 'IKEA Madrid Servicios', sector_id: 'K', based_on_sector: 'K', vna_roles: [{ id: 'atencion-cliente', name: 'Atención Cliente', castell_level: 'tronc' }] };
    const sopNode = { id: 'sop-atencion-cliente-proj-ikea-mad', type: 'sop', projectId: 'proj-ikea-mad', content: { name: 'SOP Atención Cliente IKEA', role_ref: 'atencion-cliente', steps: [{ id: 'step-1', label: 'Recibir incidencia', role_kind: 'human', duration_minutes: 5 }, { id: 'step-2', label: 'Generar borrador respuesta', role_kind: 'ai', duration_minutes: 3 }] } };
    const socNotes = ['SOC teamtowers-brand: 10 valores casteller, NO inventar precios.'];
    const role = project.vna_roles[0];

    // assembleWoContext
    const ctx = assembleWoContext({ wo, project, sopNode, socNotes, role });
    assert(ctx.woId === 'wo-test-001',                              'ctx.woId correcto');
    assert(ctx.woTitle.includes('Diagnóstico'),                     'ctx.woTitle preservado');
    assert(ctx.projectId === 'proj-ikea-mad',                       'ctx.projectId tomado de wo');
    assert(ctx.projectName === 'IKEA Madrid Servicios',             'ctx.projectName del project');
    assert(ctx.sopRef === 'sop-atencion-cliente-proj-ikea-mad',     'ctx.sopRef del wo.content');
    assert(ctx.sopName === 'SOP Atención Cliente IKEA',             'ctx.sopName del sopNode');
    assert(ctx.sopHasSteps === true,                                'ctx.sopHasSteps true cuando steps.length>0');
    assert(ctx.sopSteps.length === 2,                               'ctx.sopSteps preserva los 2 steps');
    assert(ctx.socRefs.includes('soc-teamtowers-brand'),            'ctx.socRefs lista los socRefs del wo');
    assert(ctx.socNotes.length === 1,                               'ctx.socNotes preserva las 1 notas pasadas');
    assert(ctx.role && ctx.role.id === 'atencion-cliente',          'ctx.role preservado');
    assert(ctx.assigneeKind === 'human' && ctx.assigneeId === '@maria', 'assignee humano correcto');

    // assembleWoContext sin sopNode → sopHasSteps=false, sopName=null
    const ctxNoSop = assembleWoContext({ wo: { id: 'wo-2', content: { title: 'WO suelta' } } });
    assert(ctxNoSop.sopHasSteps === false,                          'sopHasSteps false sin sopNode');
    assert(ctxNoSop.sopName === null,                               'sopName null sin sopNode');
    assert(ctxNoSop.projectId === null,                             'projectId null sin proyecto');

    // buildWoAssistPrompt
    const humanInput = 'El cliente envió foto del sofá en la entrada de la casa. No cabe por la puerta. Modelo KIVIK 3 plazas. Pedido 4521 de hace 8 días.';
    const prompt = buildWoAssistPrompt(ctx, humanInput);
    assert(typeof prompt === 'string' && prompt.length > 600,                    'buildWoAssistPrompt devuelve string sustancioso');
    assert(prompt.includes('wo-test-001'),                                       'prompt incluye woId');
    assert(prompt.includes('Diagnóstico devolución'),                            'prompt incluye título de la WO');
    assert(prompt.includes('proj-ikea-mad'),                                     'prompt incluye projectId');
    assert(prompt.includes('IKEA Madrid Servicios'),                             'prompt incluye nombre del proyecto');
    assert(prompt.includes('sop-atencion-cliente-proj-ikea-mad'),                'prompt incluye sopRef');
    assert(prompt.includes('Recibir incidencia'),                                'prompt embeba label de step humano del SOP');
    assert(prompt.includes('Generar borrador respuesta'),                        'prompt embeba label de step IA del SOP');
    assert(prompt.includes('soc-teamtowers-brand'),                              'prompt referencia SOC raíz');
    assert(prompt.includes('SOC teamtowers-brand: 10 valores casteller'),        'prompt embeba notas de SOC');
    assert(prompt.includes('atencion-cliente'),                                  'prompt embeba id del rol VNA');
    assert(prompt.includes('HUMAN_INPUT_START') && prompt.includes('HUMAN_INPUT_END'), 'prompt encapsula humanInput entre marcadores');
    assert(prompt.includes('KIVIK 3 plazas'),                                    'prompt preserva contenido del input humano');
    assert(prompt.includes('## 0 · Contexto inyectado (Chitta)'),                'prompt instruye sección 0 (contexto)');
    assert(prompt.includes('## 1 · Síntesis'),                                   'prompt instruye sección 1 (síntesis)');
    assert(prompt.includes('## 2 · Diagnóstico estructurado'),                   'prompt instruye sección 2 (diagnóstico)');
    assert(prompt.includes('## 4 · DTD · test de aprobación'),                   'prompt instruye sección 4 (DTD obligatoria)');
    assert(prompt.includes('## 5 · Intangibles humanos requeridos'),             'prompt instruye sección 5 (intangibles)');
    assert(prompt.includes('## 6 · Mind-as-Graph'),                              'prompt instruye sección 6 (KB upserts propuestos)');
    assert(prompt.includes('NO inventes datos'),                                 'prompt prohíbe alucinar');
    assert(prompt.includes('HECHOS'),                                            'prompt fuerza distinción hechos/inferencias/lagunas');

    // buildWoAssistPrompt rechaza humanInput vacío
    let threw = false;
    try { buildWoAssistPrompt(ctx, ''); } catch (_) { threw = true; }
    assert(threw === true,                                                       'buildWoAssistPrompt lanza si humanInput vacío');

    // Verificar que el orquestador está exportado
    const mod = await import('../core/woAssistant.js?v=' + Date.now());
    assert(typeof mod.generateWoAssistReport === 'function',                     'generateWoAssistReport exportada');
    assert(typeof mod.assembleWoContext === 'function',                          'assembleWoContext exportada');
    assert(typeof mod.buildWoAssistPrompt === 'function',                        'buildWoAssistPrompt exportada');
}

// ─── UX-001 · tagsService · folksonomía pura ────────────────────
async function testTagsService() {
    const mod = await import('../core/tagsService.js?v=' + Date.now());
    const { normalizeTag, aggregateTags, nodesWithTag, relatedEdgesByTag, addTagToNode, removeTagFromNode } = mod;

    // normalizeTag
    assert(normalizeTag('Mi Tag · Genial!') === 'mi-tag-genial',  'normaliza puntuación, espacios y caso');
    assert(normalizeTag('Año Nuevo') === 'ano-nuevo',             'normaliza diacríticos (ñ→n, ó→o)');
    assert(normalizeTag('  multiple   spaces  ') === 'multiple-spaces', 'colapsa espacios');
    assert(normalizeTag('---trim---') === 'trim',                 'trimea guiones de bordes');
    assert(normalizeTag('') === '',                               'string vacío → vacío');
    assert(normalizeTag(123) === '',                              'no-string → vacío');

    // Setup nodos para los siguientes tests
    const nodes = [
        { id: 'n1', type: 'project', content: { tags: ['ikea', 'b2b', 'madrid'], title: 'Proyecto IKEA' } },
        { id: 'n2', type: 'sop',     content: { tags: ['ikea', 'b2b'],            name:  'SOP atención IKEA' } },
        { id: 'n3', type: 'work_order', content: { tags: ['urgente'],             title: 'WO urgente' } },
        { id: 'n4', type: 'role',    content: { /* sin tags */                    name:  'Rol sin tags' } },
        { id: 'n5', type: 'project', content: { tags: ['Madrid', 'sostenible'],   title: 'Otro proyecto Madrid' } }, // mayúscula → debe normalizar
    ];

    // aggregateTags
    const agg = aggregateTags(nodes);
    assert(Array.isArray(agg) && agg.length === 5,                'aggregateTags devuelve 5 tags únicos');
    const ikea = agg.find(a => a.tag === 'ikea');
    assert(ikea && ikea.count === 2,                              'tag ikea aparece 2 veces');
    assert(ikea.nodeIds.includes('n1') && ikea.nodeIds.includes('n2'), 'ikea referencia n1 y n2');
    const madrid = agg.find(a => a.tag === 'madrid');
    assert(madrid && madrid.count === 2,                          'Madrid normalizado se cuenta como madrid (2 ocurrencias)');
    assert(agg[0].count >= agg[1].count,                          'aggregateTags ordena por count desc');

    // nodesWithTag
    const ikeaNodes = nodesWithTag(nodes, 'IKEA');  // probar mayúsculas
    assert(ikeaNodes.length === 2 && ikeaNodes.every(n => ['n1','n2'].includes(n.id)), 'nodesWithTag filtra normalizando');
    assert(nodesWithTag(nodes, 'inexistente').length === 0,       'tag inexistente devuelve []');

    // relatedEdgesByTag · n1+n2 comparten 2 tags (ikea, b2b) → weight 2
    const edges = relatedEdgesByTag(nodes);
    const e12 = edges.find(e => (e.a === 'n1' && e.b === 'n2') || (e.a === 'n2' && e.b === 'n1'));
    assert(e12 && e12.weight === 2,                               'arista n1↔n2 con weight 2 (ikea + b2b)');
    assert(e12.sharedTags.includes('ikea') && e12.sharedTags.includes('b2b'), 'arista lista los 2 tags compartidos');
    const e15 = edges.find(e => (e.a === 'n1' && e.b === 'n5') || (e.a === 'n5' && e.b === 'n1'));
    assert(e15 && e15.weight === 1 && e15.sharedTags[0] === 'madrid', 'arista n1↔n5 con weight 1 (madrid normalizado)');
    assert(!edges.some(e => e.a === 'n4' || e.b === 'n4'),        'n4 sin tags no aparece en aristas');

    // addTagToNode · pureness
    const original = { id: 'n1', type: 'project', content: { tags: ['ikea'], title: 'X' }, keywords: ['existing'] };
    const added = addTagToNode(original, 'Nueva CATEGORIA!');
    assert(added !== original,                                    'addTagToNode no muta · devuelve nuevo objeto');
    assert(added.content.tags.length === 2,                       'añade el tag normalizado');
    assert(added.content.tags[1] === 'nueva-categoria',           'tag normalizado correctamente');
    assert(added.keywords.includes('nueva-categoria') && added.keywords.includes('existing'), 'sincroniza con keywords sin perder previos');
    assert(original.content.tags.length === 1,                    'original NO mutado');
    const dup = addTagToNode(added, 'IKEA');
    assert(dup === added,                                         'añadir tag duplicado devuelve el mismo objeto');

    // removeTagFromNode · pureness
    const removed = removeTagFromNode(added, 'nueva-categoria');
    assert(removed.content.tags.length === 1 && removed.content.tags[0] === 'ikea', 'removeTagFromNode quita el tag');
    assert(!removed.keywords.includes('nueva-categoria'),         'removeTagFromNode sincroniza keywords');
    const noop = removeTagFromNode(added, 'inexistente');
    assert(noop === added,                                        'remover tag inexistente devuelve mismo objeto');

    // Exports
    assert(typeof mod.persistTagAdd === 'function',               'persistTagAdd exportada');
    assert(typeof mod.persistTagRemove === 'function',            'persistTagRemove exportada');
    assert(typeof mod.loadAllNodesForTags === 'function',         'loadAllNodesForTags exportada');
    assert(typeof mod.renderTagsEditor === 'function',            'renderTagsEditor exportada');
    const html = mod.renderTagsEditor({ tags: ['a', 'b-c'] });
    assert(typeof html === 'string' && html.includes('#a') && html.includes('#b-c'), 'renderTagsEditor produce chips para los tags');
}

// ─── UX-001 sprint B · linkifyService · hipertexto puro ─────────
async function testLinkifyService() {
    const { linkifyNodeRefs, linkifyMultiline } = await import('../core/linkifyService.js?v=' + Date.now());

    // Caso vacío
    assert(linkifyNodeRefs('') === '',                                   'string vacío → vacío');
    assert(linkifyNodeRefs(null) === '',                                 'null → vacío');

    // Texto sin refs
    assert(linkifyNodeRefs('Hola mundo') === 'Hola mundo',               'texto sin refs queda igual');
    assert(linkifyNodeRefs('5 < 10') === '5 &lt; 10',                    'escapa HTML del texto literal');
    assert(linkifyNodeRefs('a&b') === 'a&amp;b',                         'escapa & en literal');

    // [[id]] simple
    const r1 = linkifyNodeRefs('Ver [[wo-abc-123]]');
    assert(r1.includes('href="/n/wo-abc-123"'),                          '[[id]] genera href /n/{id}');
    assert(r1.includes('data-link'),                                     '[[id]] añade data-link para SPA');
    assert(r1.includes('>wo-abc-123<'),                                  '[[id]] muestra el id como texto por defecto');

    // [[id|alias]]
    const r2 = linkifyNodeRefs('Esta WO [[wo-abc-123|propuesta IKEA]] está en marcha');
    assert(r2.includes('>propuesta IKEA<'),                              '[[id|alias]] muestra el alias como texto');
    assert(r2.includes('href="/n/wo-abc-123"'),                          '[[id|alias]] usa el id en href');

    // #tag inline (con espacio o inicio)
    const r3 = linkifyNodeRefs('Es un proyecto #b2b y #madrid.');
    assert(r3.includes('href="/tags?tag=b2b"'),                          '#tag genera link a /tags?tag=');
    assert(r3.includes('href="/tags?tag=madrid"'),                       '#tag funciona con varios en la frase');
    assert(r3.includes('class="sos-tagref"'),                            '#tag tiene class sos-tagref');

    // #tag en inicio de string
    const r4 = linkifyNodeRefs('#urgente: ver detalle');
    assert(r4.startsWith('<a'),                                          '#tag al inicio se reconoce');

    // No confundir hashtag dentro de palabra (ej. C#)
    const r5 = linkifyNodeRefs('lenguaje C#sharp no es tag');
    assert(!r5.includes('href="/tags'),                                  '#tag pegado a letra anterior NO es tag');

    // Múltiples refs mezcladas
    const r6 = linkifyNodeRefs('[[proj-ikea-mad|IKEA Madrid]] tiene WO [[wo-1]] urgente #b2b');
    const matches = (r6.match(/href="\/n\//g) || []).length + (r6.match(/href="\/tags/g) || []).length;
    assert(matches === 3,                                                'mezcla de [[id]], [[id|alias]] y #tag genera 3 links');

    // ID inválido → no convierte (preserva literal)
    const r7 = linkifyNodeRefs('Cosas raras [[id con espacios]] aquí');
    assert(!r7.includes('href="/n/'),                                    'ID con espacios NO se convierte');
    assert(r7.includes('[[id con espacios]]'),                           'literal preservado escapado');

    // Tag inválido (mayúsculas) NO se convierte
    const r8 = linkifyNodeRefs('Un #TagMal no debería linkificar');
    assert(!r8.includes('href="/tags'),                                  'tag con mayúsculas no es válido');

    // XSS · no debe permitir HTML inyectado
    const r9 = linkifyNodeRefs('texto <script>alert(1)</script>');
    assert(!r9.includes('<script>'),                                     'escapa <script> embebido');
    assert(r9.includes('&lt;script&gt;'),                                'lo escapa correctamente');

    // Alias con HTML especial se escapa
    const r10 = linkifyNodeRefs('[[id-1|<b>negrita</b>]]');
    assert(!r10.includes('<b>negrita</b>'),                              'alias con HTML se escapa (no se permite tag bruto)');
    assert(r10.includes('&lt;b&gt;negrita&lt;/b&gt;'),                   'alias escapado en el anchor');

    // linkifyMultiline · saltos de línea
    const r11 = linkifyMultiline('Línea 1\nLínea 2 con [[wo-1]]');
    assert(r11.includes('<br>'),                                         'multiline convierte \\n en <br>');
    assert(r11.includes('href="/n/wo-1"'),                               'multiline también linkifica refs');
}

// ─── UX-002 · semanticTagger · taxonomía + folksonomía pura ─────
async function testSemanticTagger() {
    const mod = await import('../core/semanticTagger.js?v=' + Date.now());
    const {
        KNOWN_TAXONOMY_PREFIXES,
        validateTaxonomyTag,
        buildTag,
        taxonomicTagsForProject,
        taxonomicTagsForRole,
        taxonomicTagsForTransaction,
        taxonomicTagsForSop,
        taxonomicTagsForStep,
        taxonomicTagsForWo,
        mergeTags,
    } = mod;

    // KNOWN_TAXONOMY_PREFIXES contiene los 12+ prefijos canónicos
    assert(Array.isArray(KNOWN_TAXONOMY_PREFIXES) && KNOWN_TAXONOMY_PREFIXES.length >= 12, 'catálogo de prefijos ≥ 12');
    ['sector','cnae','kind','role','castell','deliverable','priority','step-kind','approval','status','scope','soc-ref','sop-ref'].forEach(p => {
        assert(KNOWN_TAXONOMY_PREFIXES.includes(p),                   'catálogo incluye prefijo ' + p);
    });

    // validateTaxonomyTag reconoce los conocidos
    const v1 = validateTaxonomyTag('sector:K');
    assert(v1.taxonomy === true && v1.knownPrefix === true && v1.prefix === 'sector' && v1.value === 'k', 'sector:K reconocido como taxonómico');
    const v2 = validateTaxonomyTag('proj:foo');
    assert(v2.taxonomy === false && v2.knownPrefix === false,         '"proj:" (no listado) NO es taxonómico');
    const v3 = validateTaxonomyTag('urgente');
    assert(v3.taxonomy === false && v3.value === 'urgente',           'tag sin `:` es folksonómico');
    const v4 = validateTaxonomyTag('  Kind:Project  ');
    assert(v4.taxonomy === true && v4.prefix === 'kind' && v4.value === 'project', 'normaliza prefijo y valor');
    const v5 = validateTaxonomyTag('');
    assert(v5.ok === false,                                            'tag vacío NO es válido');

    // buildTag normaliza
    assert(buildTag('Sector', 'K') === 'sector:k',                    'buildTag normaliza prefijo y valor');
    assert(buildTag('', 'k') === null,                                'buildTag rechaza prefijo vacío');
    assert(buildTag('sector', '') === null,                           'buildTag rechaza valor vacío');

    // taxonomicTagsForProject
    const proj = { id: 'proj-ikea-mad', sector_id: 'K', cnae: '4321', nombre: 'IKEA Madrid' };
    const tagsP = taxonomicTagsForProject(proj);
    assert(tagsP.includes('kind:project'),                            'project tag · kind:project');
    assert(tagsP.includes('sector:k'),                                'project tag · sector:k');
    assert(tagsP.includes('cnae:4321'),                               'project tag · cnae:4321');
    assert(tagsP.includes('scope:client'),                            'project tag · scope:client por defecto');
    assert(tagsP.includes('project:proj-ikea-mad'),                   'project tag · project:{id}');
    assert(new Set(tagsP).size === tagsP.length,                      'project tags únicos');

    // taxonomicTagsForRole
    const role = { id: 'atencion-cliente', castell_level: 'tronc', name: 'Atención' };
    const tagsR = taxonomicTagsForRole(role, proj);
    assert(tagsR.includes('kind:role'),                               'role tag · kind:role');
    assert(tagsR.includes('role:atencion-cliente'),                   'role tag · role:{id}');
    assert(tagsR.includes('castell:tronc'),                           'role tag · castell:tronc');
    assert(tagsR.includes('sector:k'),                                'role tag hereda sector del proyecto');
    assert(tagsR.includes('project:proj-ikea-mad'),                   'role tag hereda project:{id}');

    // taxonomicTagsForTransaction
    const tx = { id: 'tx-1', from: 'a', to: 'b', deliverable: 'X', type: 'tangible', is_must: true };
    const tagsT = taxonomicTagsForTransaction(tx, proj);
    assert(tagsT.includes('kind:transaction'),                        'tx tag · kind:transaction');
    assert(tagsT.includes('tx-type:tangible'),                        'tx tag · tx-type:tangible');
    assert(tagsT.includes('is-must:yes'),                             'tx tag · is-must:yes');

    // taxonomicTagsForSop
    const sop = { id: 'sop-x', name: 'SOP X', role_ref: 'atencion-cliente', soc_ref: 'soc-vna-network' };
    const tagsS = taxonomicTagsForSop(sop, proj, role);
    assert(tagsS.includes('kind:project-role-sop'),                   'sop tag · kind:project-role-sop');
    assert(tagsS.includes('role:atencion-cliente'),                   'sop tag · role:{ref}');
    assert(tagsS.includes('soc-ref:soc-vna-network'),                 'sop tag · soc-ref:{slug}');
    assert(tagsS.includes('castell:tronc'),                           'sop tag hereda castell del rol');

    // taxonomicTagsForStep
    const step = { id: 's1', role_kind: 'ai', priority: 'high', approval_rule: 'tdd-auto', deliverable_kind: 'propuesta' };
    const tagsStep = taxonomicTagsForStep(step);
    assert(tagsStep.includes('step-kind:ai'),                         'step tag · step-kind:ai');
    assert(tagsStep.includes('priority:high'),                        'step tag · priority:high');
    assert(tagsStep.includes('approval:tdd-auto'),                    'step tag · approval:tdd-auto');
    assert(tagsStep.includes('deliverable:propuesta'),                'step tag · deliverable:{kind}');

    // taxonomicTagsForWo
    const wo = { id: 'wo-1', projectId: 'proj-ikea-mad', content: { sopRef: 'sop-x', priority: 'med', approvalRule: 'manual', status: 'backlog', assignee: { kind: 'human' } } };
    const tagsW = taxonomicTagsForWo(wo, null, step);
    assert(tagsW.includes('kind:work-order'),                         'wo tag · kind:work-order');
    assert(tagsW.includes('status:backlog'),                          'wo tag · status:backlog');
    assert(tagsW.includes('sop-ref:sop-x'),                           'wo tag · sop-ref:{ref}');
    assert(tagsW.includes('role-kind:human'),                         'wo tag · role-kind:human (assignee)');
    assert(tagsW.includes('project:proj-ikea-mad'),                   'wo tag hereda project del wo');

    // mergeTags · taxonomy primero · folksonomy después · únicos · sin perder
    const merged = mergeTags(['kind:role','sector:k'], ['urgente','b2b','sector:k']);
    assert(merged[0] === 'kind:role',                                 'mergeTags pone taxonómicos primero');
    assert(merged.includes('urgente') && merged.includes('b2b'),      'mergeTags conserva folksonómicos');
    assert(new Set(merged).size === merged.length,                    'mergeTags deduplica');

    // Edge cases · null/undefined
    assert(taxonomicTagsForProject(null).length === 0,                'null project → []');
    assert(taxonomicTagsForRole(null).length === 0,                   'null role → []');
    assert(mergeTags(null, null).length === 0,                        'null inputs → []');
}

// ─── MKT-001 sprint A · marketService + cnaeSeed puros ──────────
async function testMarketService() {
    const mkt   = await import('../core/marketService.js?v=' + Date.now());
    const cnae  = await import('../core/cnaeSeed.js?v=' + Date.now());

    // CNAE seed · básicos
    assert(typeof cnae.CNAE_SEED === 'object',                            'CNAE_SEED es objeto');
    assert(cnae.CNAE_SEED['6201'] && cnae.CNAE_SEED['6201'].sectorTT === 'K', 'CNAE 6201 mapea a sector K (programación)');
    assert(cnae.CNAE_SEED['4771'] && cnae.CNAE_SEED['4771'].group === 'G',     'CNAE 4771 grupo G (comercio)');
    assert(cnae.getCnae('6201').name.includes('programación'),            'getCnae("6201") devuelve metadata');
    assert(cnae.getCnae('9999') === null,                                 'getCnae con código no existente devuelve null');
    assert(cnae.getCnae('') === null,                                     'getCnae con vacío devuelve null');

    // searchCnae · prefix por código
    const r1 = cnae.searchCnae('62');
    assert(Array.isArray(r1) && r1.length > 0,                            'searchCnae prefijo "62" devuelve resultados');
    assert(r1[0].code.startsWith('62'),                                   'primer resultado coincide con prefijo');

    // searchCnae · prefix por nombre
    const r2 = cnae.searchCnae('Const');
    assert(r2.some(x => /Construcción/i.test(x.name)),                   'searchCnae "Const" matchea nombres');

    // searchCnae · vacío devuelve []
    assert(cnae.searchCnae('').length === 0,                              'searchCnae vacío → []');

    // validateMarketItem · ok mínimo
    const okItem = {
        id: 'mkt-1',
        type: 'market_item',
        content: { title: 'Mapa de Valor IKEA-style', kind: 'service', priceEur: 495, cnae: '7022', visibility: 'public' }
    };
    const v1 = mkt.validateMarketItem(okItem);
    assert(v1.ok === true && v1.errors.length === 0,                      'validateMarketItem item mínimo válido');

    // validateMarketItem · falla por kind
    const v2 = mkt.validateMarketItem({ ...okItem, content: { ...okItem.content, kind: 'cosa-rara' } });
    assert(v2.ok === false && v2.errors.some(e => /kind/.test(e)),        'validateMarketItem detecta kind inválido');

    // validateMarketItem · falla por price negativo
    const v3 = mkt.validateMarketItem({ ...okItem, content: { ...okItem.content, priceEur: -10 } });
    assert(v3.ok === false,                                                'validateMarketItem detecta precio negativo');

    // validateMarketItem · falla por type
    const v4 = mkt.validateMarketItem({ id:'x', type:'project', content:{ title:'a', kind:'service' } });
    assert(v4.ok === false && v4.errors.some(e => /type/.test(e)),        'validateMarketItem detecta type incorrecto');

    // buildMarketItem · genera id + defaults
    const built = mkt.buildMarketItem({ title: 'Cosecha VNA', kind: 'service', priceEur: 750, cnae: '7022' });
    assert(built.id.startsWith('mkt-'),                                    'buildMarketItem genera id con prefijo mkt-');
    assert(built.type === 'market_item',                                   'buildMarketItem.type === market_item');
    assert(built.content.title === 'Cosecha VNA',                          'buildMarketItem preserva título');
    assert(built.content.visibility === 'public',                          'buildMarketItem default visibility=public');
    assert(built.keywords.includes('market_item'),                         'buildMarketItem añade keywords');
    assert(mkt.validateMarketItem(built).ok === true,                      'buildMarketItem devuelve item válido');

    // buildMarketItem · sin título lanza
    let threw = false;
    try { mkt.buildMarketItem({ kind: 'service' }); } catch(_) { threw = true; }
    assert(threw === true,                                                 'buildMarketItem sin título lanza');

    // searchMarketItems · setup
    const items = [
        mkt.buildMarketItem({ title: 'Mapa Valor B2B',     kind: 'service',  priceEur: 495, cnae: '7022', sectorTT: 'N', tags: ['vna','b2b'] }),
        mkt.buildMarketItem({ title: 'Plantilla Pacto',    kind: 'template', priceEur: 49,  cnae: '6920', sectorTT: 'N', tags: ['legal'] }),
        mkt.buildMarketItem({ title: 'Workshop Fent Pinya',kind: 'workshop', priceEur: 250, cnae: '8559', sectorTT: 'Q', tags: ['formacion'] }),
        mkt.buildMarketItem({ title: 'Skill UX Research',  kind: 'skill',    priceEur: 60,  cnae: '7320', sectorTT: 'P', tags: ['ux'], visibility: 'red-macro' }),
    ];

    // text search
    assert(mkt.searchMarketItems(items, { text: 'pacto' }).length === 1,                  'search texto "pacto" devuelve 1');
    assert(mkt.searchMarketItems(items, { text: 'b2b' }).length === 1,                    'search texto "b2b" matchea tags');
    assert(mkt.searchMarketItems(items, { text: 'NoExiste' }).length === 0,              'search texto sin match → 0');

    // filtro por kind
    assert(mkt.searchMarketItems(items, { kinds: ['template','skill'] }).length === 2,    'filtro kinds devuelve 2');

    // filtro por cnae
    assert(mkt.searchMarketItems(items, { cnaes: ['7022'] }).length === 1,                'filtro cnae devuelve 1');

    // filtro por sectorTT
    assert(mkt.searchMarketItems(items, { sectorTT: 'N' }).length === 2,                  'filtro sectorTT N devuelve 2');

    // filtro por visibility
    assert(mkt.searchMarketItems(items, { visibility: 'red-macro' }).length === 1,        'filtro visibility red-macro devuelve 1');

    // rango precio
    assert(mkt.searchMarketItems(items, { priceMax: 100 }).length === 2,                  'priceMax 100 devuelve 2 (49+60)');
    assert(mkt.searchMarketItems(items, { priceMin: 200, priceMax: 500 }).length === 2,   'priceMin 200 priceMax 500 devuelve 2');

    // groupBy
    const byKind   = mkt.groupByKind(items);
    assert(Object.keys(byKind).length === 4,                                              'groupByKind 4 grupos');
    assert(byKind.service.length === 1 && byKind.workshop.length === 1,                   'groupByKind correcto');
    const bySector = mkt.groupBySectorTT(items);
    assert(bySector.N.length === 2,                                                        'groupBySectorTT N tiene 2 items');

    // computeSaving · sin savingsCompareTo → null
    assert(mkt.computeSaving(items[0]) === null,                                          'sin savingsCompareTo → null');

    // computeSaving · con compareTo
    const itemNotaria = mkt.buildMarketItem({ title: 'Pacto firmado', kind: 'service', priceEur: 50 });
    itemNotaria.content.savingsCompareTo = 'notaria';
    const s = mkt.computeSaving(itemNotaria);
    assert(s != null && s.savingEur > 0 && s.savingPct > 90,                              'savingPct frente a notaría >90%');

    // exports
    assert(Array.isArray(mkt.MARKET_ITEM_KINDS) && mkt.MARKET_ITEM_KINDS.length >= 6,     'MARKET_ITEM_KINDS exportado con ≥6 valores');
    assert(Array.isArray(mkt.MARKET_VISIBILITY) && mkt.MARKET_VISIBILITY.length >= 4,     'MARKET_VISIBILITY exportado con ≥4 valores');
    assert(typeof mkt.DEFAULT_CONVENTIONAL_RANGES.notaria === 'object',                   'DEFAULT_CONVENTIONAL_RANGES exportado');
}

// ─── UX-001 sprint C · projectHubService puro ───────────────────
async function testProjectHub() {
    const mod = await import('../core/projectHubService.js?v=' + Date.now());
    const { aggregateProjectStats, PROJECT_TOOLS, PROJECT_VIEWS, projectViewUrls } = mod;

    const projectId = 'proj-ikea-mad';
    const nodes = [
        { id: 'sop-1', type: 'sop', projectId,         content: { name: 'SOP A', steps: [{}, {}] } },
        { id: 'sop-2', type: 'sop', projectId,         content: { name: 'SOP B' } },
        { id: 'sop-x', type: 'sop', projectId: 'otro', content: { name: 'NO debe contar' } },
        { id: 'wo-1',  type: 'work_order', projectId,  content: { status: 'backlog',  assignee: { kind: 'ai'    } } },
        { id: 'wo-2',  type: 'work_order', projectId,  content: { status: 'doing',    assignee: { kind: 'human' } } },
        { id: 'wo-3',  type: 'work_order', projectId,  content: { status: 'ledgered', assignee: { kind: 'ai'    } } },
        { id: 'wo-x',  type: 'work_order', projectId: 'otro', content: { status: 'doing' } },
        { id: 'mkt-1', type: 'market_item', content: { kind: 'service', providerProjectId: projectId } },
        { id: 'mkt-2', type: 'market_item', content: { kind: 'service', providerProjectId: 'otro'   } },
        { id: 'led-1', type: 'ledger_entry', projectId, content: { savingEur: 250.5 } },
        { id: 'led-2', type: 'ledger_entry', projectId, content: { savingEur: 100   } },
    ];

    // aggregateProjectStats
    const s = aggregateProjectStats({ projectId, nodes });
    assert(s.sops === 2,                                              'aggregate · 2 sops del proyecto (filtra otro)');
    assert(s.sopsList.every(n => n.projectId === projectId),          'aggregate · sopsList sólo del proyecto');
    assert(s.workOrders.total === 3,                                  'aggregate · 3 WOs del proyecto');
    assert(s.workOrders.backlog === 1 && s.workOrders.doing === 1 && s.workOrders.ledgered === 1, 'aggregate · counts por status');
    assert(s.workOrders.list.length === 3,                            'aggregate · workOrders.list sólo del proyecto');
    assert(s.woRolesAi === 2 && s.woRolesHuman === 1,                 'aggregate · split AI vs human');
    assert(s.marketItems.count === 1,                                 'aggregate · 1 oferta del proyecto');
    assert(s.ledgerEntries.count === 2,                               'aggregate · 2 ledger entries');
    assert(s.savingEur === 350.5,                                     'aggregate · suma savingEur del ledger');

    // empty case
    const empty = aggregateProjectStats({ projectId: null, nodes: [] });
    assert(empty.sops === 0 && empty.workOrders.total === 0,          'aggregate · projectId nulo → stats vacías');
    assert(empty.savingEur === 0,                                     'aggregate · empty savingEur 0');

    // PROJECT_TOOLS y PROJECT_VIEWS son catálogos cerrados Object.freeze
    assert(Array.isArray(PROJECT_TOOLS) && PROJECT_TOOLS.length === 6, 'PROJECT_TOOLS tiene 6 herramientas');
    assert(PROJECT_TOOLS.some(t => t.id === 'pact')        ,           'PROJECT_TOOLS incluye pact');
    assert(PROJECT_TOOLS.some(t => t.id === 'tokenomics'),             'PROJECT_TOOLS incluye tokenomics');
    assert(PROJECT_TOOLS.some(t => t.id === 'launchpad'),              'PROJECT_TOOLS incluye launchpad');
    assert(Array.isArray(PROJECT_VIEWS) && PROJECT_VIEWS.length === 5, 'PROJECT_VIEWS tiene 5 vistas operativas');
    assert(Object.isFrozen(PROJECT_TOOLS),                              'PROJECT_TOOLS está congelado');
    assert(Object.isFrozen(PROJECT_VIEWS),                              'PROJECT_VIEWS está congelado');

    // projectViewUrls compone bien
    const urls = projectViewUrls(projectId);
    assert(urls.length === 5,                                         'projectViewUrls devuelve 5');
    assert(urls.find(u => u.id === 'map').url === '/map?project=' + encodeURIComponent(projectId),       'map url correcta');
    assert(urls.find(u => u.id === 'tags').url === '/tags?tag=project:' + encodeURIComponent(projectId), 'tags url compone tag=project:{id}');
    assert(projectViewUrls(null).length === 0,                        'projectViewUrls null → []');
}

// ─── UX-NAV-001 · navService puro ───────────────────────────────
async function testNavService() {
    const mod = await import('../core/navService.js?v=' + Date.now());
    const { NAV_DESTINATIONS, buildNavLinks, renderNavLinksHtml } = mod;

    assert(Object.isFrozen(NAV_DESTINATIONS),                       'NAV_DESTINATIONS frozen');
    assert(NAV_DESTINATIONS.length === 10,                          '10 destinos canónicos (+ folders + mind + identity en Ola 9)');
    assert(NAV_DESTINATIONS.some(d => d.id === 'dashboard' && d.global), 'dashboard es global');
    assert(NAV_DESTINATIONS.some(d => d.id === 'sops' && !d.global),     'sops NO es global (requiere projectId)');

    // sin projectId → omite los no-globales
    const linksGlobal = buildNavLinks({ active: 'dashboard' });
    assert(linksGlobal.every(l => l.id !== 'sops'),                 'sin projectId · sops omitido');
    assert(linksGlobal.length === 9,                                 'sin projectId · 9 links (sin sops · 10-1)');
    assert(linksGlobal.find(l => l.id === 'dashboard').active === true, 'active flag funciona');
    assert(linksGlobal.find(l => l.id === 'map').href === '/map',   'sin projectId · map sin query');

    // con projectId → todos + query ?project= en los aplicables
    const linksProject = buildNavLinks({ active: 'kanban', projectId: 'proj-x' });
    assert(linksProject.length === 10,                              'con projectId · 10 links (incluye sops)');
    assert(linksProject.find(l => l.id === 'sops').href === '/sops?project=proj-x',     'sops con project query');
    assert(linksProject.find(l => l.id === 'map').href === '/map?project=proj-x',       'map con project query');
    assert(linksProject.find(l => l.id === 'market').href === '/market?project=proj-x', 'market con project query');
    assert(linksProject.find(l => l.id === 'kanban').href === '/kanban?project=proj-x', 'kanban con project query');
    assert(linksProject.find(l => l.id === 'tags').href === '/tags',                    'tags NO recibe project query');
    assert(linksProject.find(l => l.id === 'kanban').active === true,                   'active=kanban marcado');

    // renderNavLinksHtml escapa títulos
    const html = renderNavLinksHtml({ active: 'map', projectId: 'p1' });
    assert(typeof html === 'string' && html.includes('href="/map?project=p1"'),         'html incluye href con query');
    assert(html.includes('class="sos-nav-link sos-nav-link-active"'),                   'html marca active class');
    assert(html.includes('data-link'),                                                  'html añade data-link para SPA');
}

// ─── AUTH-001 sprint A · identityService (helpers puros) ────────
async function testIdentityService() {
    const mod = await import('../core/identityService.js?v=' + Date.now());
    const { validateIdentity, stampNode, buildIdentityNode } = mod;

    // buildIdentityNode · sin args lanza
    let threwNoArgs = false;
    try { buildIdentityNode({}); } catch(_) { threwNoArgs = true; }
    assert(threwNoArgs,                                                   'buildIdentityNode sin primaryDid lanza');

    let threwNoKey = false;
    try { buildIdentityNode({ primaryDid: 'did:sos:abc' }); } catch(_) { threwNoKey = true; }
    assert(threwNoKey,                                                    'buildIdentityNode sin publicJwk lanza');

    const node = buildIdentityNode({
        primaryDid: 'did:sos:abc123def456',
        publicJwk:  { kty: 'EC', crv: 'P-256', x: 'X', y: 'Y' },
        displayName: 'Alvaro',
        handle: '@alvaro',
        createdAt: 1700000000000,
    });
    assert(node.type === 'user_identity',                                 'type es user_identity');
    assert(node.id.startsWith('user-'),                                   'id con prefijo user-');
    assert(node.content.primaryDid === 'did:sos:abc123def456',            'primaryDid preservado');
    assert(node.content.displayName === 'Alvaro',                         'displayName preservado');
    assert(node.content.handle === '@alvaro',                             'handle preservado');
    assert(node.content.isPrimary === true,                                'isPrimary default true');
    assert(node.content.publicKeys && node.content.publicKeys.signing,    'publicKeys.signing presente');
    assert(node.content.tags.includes('kind:user-identity'),              'tags taxonomy auto');
    assert(Array.isArray(node.content.wallets) && node.content.wallets.length === 0,        'wallets array vacío');
    assert(Array.isArray(node.content.oauthProviders) && node.content.oauthProviders.length === 0, 'oauthProviders array vacío');

    // validateIdentity
    assert(validateIdentity(node).ok === true,                            'identity válida pasa validation');
    assert(validateIdentity(null).ok === false,                           'null falla');
    assert(validateIdentity({ ...node, type: 'project' }).ok === false,   'type incorrecto falla');
    const noDid = JSON.parse(JSON.stringify(node)); delete noDid.content.primaryDid;
    assert(validateIdentity(noDid).ok === false,                          'sin primaryDid falla');

    // stampNode · puro
    const wo = { id: 'wo-1', type: 'work_order', content: { title: 'X' } };
    const stamped = stampNode(wo, node);
    assert(stamped !== wo,                                                'stampNode no muta · devuelve nuevo');
    assert(stamped.createdBy === node.id,                                 'createdBy = identity.id');
    assert(stamped.lastEditedBy === node.id,                              'lastEditedBy = identity.id');
    assert(typeof stamped.lastEditedAt === 'number' && stamped.lastEditedAt > 0, 'lastEditedAt timestamp');
    assert(wo.createdBy === undefined,                                    'original NO mutado');

    // stampNode · si createdBy ya existe lo preserva
    const stamped2 = stampNode({ ...wo, createdBy: 'user-original' }, node);
    assert(stamped2.createdBy === 'user-original',                        'createdBy preservado si ya existía');
    assert(stamped2.lastEditedBy === node.id,                             'lastEditedBy actualizado igualmente');

    // stampNode · sin identity devuelve node tal cual
    assert(stampNode(wo, null) === wo,                                    'sin identity → node sin cambios');
    assert(stampNode(wo, undefined) === wo,                               'undefined identity → node sin cambios');

    // stampNode · acepta string id
    const sid = stampNode(wo, 'user-direct-id');
    assert(sid.createdBy === 'user-direct-id',                            'stampNode acepta string id');

    // exports
    assert(typeof mod.deriveDidFromJwk === 'function',                    'deriveDidFromJwk exportada');
    assert(typeof mod.getCurrentIdentity === 'function',                  'getCurrentIdentity exportada');
    assert(typeof mod.getOrCreateIdentity === 'function',                 'getOrCreateIdentity exportada');
    assert(typeof mod.updateIdentityProfile === 'function',               'updateIdentityProfile exportada');
    assert(typeof mod.touchIdentity === 'function',                       'touchIdentity exportada');
}

// ─── KM-001 sprint A · smartFolderService puro ──────────────────
async function testSmartFolderService() {
    const mod = await import('../core/smartFolderService.js?v=' + Date.now());
    const { validateFolder, buildFolder, executeFolderQuery, DEFAULT_FOLDERS } = mod;

    // DEFAULT_FOLDERS · catálogo cerrado de 5 carpetas del sistema
    assert(Object.isFrozen(DEFAULT_FOLDERS),                              'DEFAULT_FOLDERS frozen');
    assert(DEFAULT_FOLDERS.length === 5,                                  '5 carpetas predefinidas');
    DEFAULT_FOLDERS.forEach(f => {
        assert(f.type === 'smart_folder' && f.content?.isSystem === true, 'cada DEFAULT es system smart_folder');
    });

    // buildFolder · normaliza id, defaults
    const f = buildFolder({ name: 'Mis WOs urgentes', icon: '🚨', query: { types: ['work_order'], tagsAll: ['priority:high'] } });
    assert(f.type === 'smart_folder' && f.id.startsWith('folder-'),       'buildFolder genera nodo válido');
    assert(f.content.name === 'Mis WOs urgentes',                         'name preservado');
    assert(f.content.view === 'list',                                     'view default list');
    assert(validateFolder(f).ok === true,                                 'buildFolder devuelve válido');

    let threw = false;
    try { buildFolder({}); } catch(_) { threw = true; }
    assert(threw,                                                          'buildFolder sin name lanza');

    // validateFolder · errores
    assert(validateFolder({ id: 'x', type: 'smart_folder', content: { query: {} } }).ok === false, 'sin name falla');
    assert(validateFolder({ id: 'x', type: 'project', content: { name: 'a', query: {} } }).ok === false, 'type incorrecto falla');

    // executeFolderQuery · setup nodes
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const nodes = [
        { id: 'wo-1', type: 'work_order', projectId: 'p1', updatedAt: now,         content: { title: 'Recientes urgentes', tags: ['kind:work-order','priority:high','status:doing','role-kind:ai'], priority: 'high' } },
        { id: 'wo-2', type: 'work_order', projectId: 'p1', updatedAt: now - 30*day, content: { title: 'Vieja',              tags: ['kind:work-order','priority:high','status:ledgered'], priority: 'high' } },
        { id: 'wo-3', type: 'work_order', projectId: 'p2', updatedAt: now,         content: { title: 'Otro proyecto med',   tags: ['kind:work-order','priority:med','status:backlog'],  priority: 'med'  } },
        { id: 'sop-1',type: 'sop',         projectId: 'p1', updatedAt: now,         content: { name:  'SOP atención',         tags: ['kind:project-role-sop','role:atencion-cliente'] } },
        { id: 'mkt-1',type: 'market_item',                                          updatedAt: now, createdAt: now,             content: { title: 'Servicio público',     tags: ['kind:market-item','scope:public'] } },
        { id: 'mkt-2',type: 'market_item',                                          updatedAt: now, createdAt: now,             content: { title: 'Servicio privado',    tags: ['kind:market-item','scope:client'] } },
    ];

    // tagsAll filtro
    const r1 = executeFolderQuery({ content: { query: { types: ['work_order'], tagsAll: ['priority:high'], tagsNone: ['status:ledgered'] } } }, nodes);
    assert(r1.length === 1 && r1[0].id === 'wo-1',                        'tagsAll + tagsNone filtra correctamente');

    // tagsAny
    const r2 = executeFolderQuery({ content: { query: { tagsAny: ['priority:med', 'priority:high'] } } }, nodes);
    assert(r2.length === 3,                                                'tagsAny matchea cualquier tag listado');

    // projectId filtro
    const r3 = executeFolderQuery({ content: { query: { types: ['work_order'], projectId: 'p1' } } }, nodes);
    assert(r3.length === 2 && r3.every(n => n.projectId === 'p1'),        'projectId filtra correcto');

    // recentDays cutoff
    const r4 = executeFolderQuery({ content: { query: { types: ['work_order'], recentDays: 7 } } }, nodes);
    assert(r4.length === 2 && !r4.some(n => n.id === 'wo-2'),             'recentDays excluye nodos viejos');

    // sortBy priority
    const r5 = executeFolderQuery({ content: { query: { types: ['work_order'], sortBy: 'priority', sortDir: 'desc' } } }, nodes);
    assert(r5.length === 3,                                                'sort by priority devuelve todos');
    assert(r5[0].content.priority === 'high',                              'priority high primero (desc)');

    // limit
    const r6 = executeFolderQuery({ content: { query: { types: ['work_order'], limit: 1 } } }, nodes);
    assert(r6.length === 1,                                                'limit 1');

    // ejecutar las 5 default folders contra el dataset · no deben crashear
    DEFAULT_FOLDERS.forEach(f => {
        const out = executeFolderQuery(f, nodes);
        assert(Array.isArray(out),                                         'DEFAULT_FOLDER "' + f.content.name + '" ejecuta sin crash');
    });

    // empty inputs
    assert(executeFolderQuery(null, nodes).length === 0,                  'null folder → []');
    assert(executeFolderQuery({ content: { query: {} } }, null).length === 0, 'null nodes → []');
}

// ─── H8.1 · mindGraphService puro ───────────────────────────────
async function testMindGraphService() {
    const mod = await import('../core/mindGraphService.js?v=' + Date.now());
    const { buildGraphFromKb, graphStats, MIND_TYPE_COLORS, colorForType, labelForNode } = mod;

    // Catálogo de colores frozen + cobertura por tipo
    assert(Object.isFrozen(MIND_TYPE_COLORS),                              'MIND_TYPE_COLORS frozen');
    ['project','role','transaction','sop','work_order','workshop','market_item','ledger_entry','user_identity','smart_folder']
        .forEach(t => assert(typeof MIND_TYPE_COLORS[t] === 'string',     'color para ' + t));
    assert(colorForType('inexistente') === MIND_TYPE_COLORS.default,      'colorForType fallback default');

    // labelForNode preferencias
    assert(labelForNode({ id: 'x', content: { title: 'T', name: 'N' } }) === 'T',  'labelForNode prefiere title');
    assert(labelForNode({ id: 'x', content: { name: 'N' } }) === 'N',              'fallback a name');
    assert(labelForNode({ id: 'x', content: { displayName: 'D' } }) === 'D',       'fallback a displayName');
    assert(labelForNode({ id: 'fallback' }) === 'fallback',                        'fallback a id');

    // buildGraphFromKb · setup
    const nodes = [
        { id: 'p1', type: 'project',     content: { nombre: 'IKEA' } },
        { id: 'r1', type: 'role',        projectId: 'p1', content: { name: 'Atención' } },
        { id: 'tx1',type: 'transaction', projectId: 'p1', content: { name: 'Pedido' } },
        { id: 'sop-1', type: 'sop',      projectId: 'p1', content: { name: 'SOP A', role_ref: 'r1', soc_ref: 'soc-x', tags: ['kind:sop','sector:k'] } },
        { id: 'wo-1', type: 'work_order',projectId: 'p1', content: { title: 'WO 1', sopRef: 'sop-1', tags: ['priority:high','sector:k'] } },
        { id: 'wo-2', type: 'work_order',projectId: 'p1', content: { title: 'WO 2', sopRef: 'sop-1', tags: ['priority:high','sector:k'] } },
        { id: 'mkt-1',type: 'market_item',                content: { title: 'Servicio', providerProjectId: 'p1', tags: ['scope:public'] } },
        { id: 'cfg-x',type: 'config',                     value: 'algo' }, // se debe excluir
        { id: 'huerf',type: 'work_order', projectId: 'p999', content: { title: 'Huérfano' } }, // proyecto no existe
    ];

    const g = buildGraphFromKb(nodes);
    assert(g.nodes.length === 8,                                          'config excluido por excludeTypes default');
    assert(!g.nodes.some(n => n.type === 'config'),                       'no hay nodos de tipo config');

    // Parent edges
    const parentEdges = g.edges.filter(e => e.kind === 'parent');
    assert(parentEdges.length === 5,                                      '5 parent edges (r1, tx1, sop-1, wo-1, wo-2 → p1)');
    assert(parentEdges.every(e => e.target === 'p1'),                     'todos los parent apuntan a p1');
    assert(!parentEdges.some(e => e.source === 'huerf'),                  'huérfano sin proyecto en grafo no genera parent');

    // Relation edges
    const relEdges = g.edges.filter(e => e.kind === 'relation');
    assert(relEdges.some(e => e.source === 'sop-1' && e.target === 'r1'), 'relation sop→role por role_ref');
    assert(relEdges.some(e => e.source === 'wo-1' && e.target === 'sop-1'), 'relation wo→sop por sopRef');
    assert(relEdges.some(e => e.source === 'mkt-1' && e.target === 'p1'), 'relation market→project por providerProjectId');

    // Tag edges (entre wo-1 y wo-2 que comparten 2 tags)
    const tagEdges = g.edges.filter(e => e.kind === 'tag');
    assert(tagEdges.length > 0,                                           'al menos una tag edge generada');
    const woTagEdge = tagEdges.find(e => (e.source === 'wo-1' && e.target === 'wo-2') || (e.source === 'wo-2' && e.target === 'wo-1'));
    assert(woTagEdge && woTagEdge.weight >= 2,                            'wo-1↔wo-2 con weight ≥ 2');

    // includeTagEdges=false omite la capa
    const g2 = buildGraphFromKb(nodes, { includeTagEdges: false });
    assert(g2.edges.every(e => e.kind !== 'tag'),                         'includeTagEdges:false omite capa tag');

    // onlyProjectId filtra
    const g3 = buildGraphFromKb(nodes, { onlyProjectId: 'p1' });
    assert(g3.nodes.some(n => n.id === 'p1'),                             'onlyProjectId incluye el propio proyecto');
    assert(!g3.nodes.some(n => n.id === 'huerf'),                         'onlyProjectId excluye nodos de otro proyecto');
    assert(g3.nodes.some(n => n.id === 'mkt-1'),                          'onlyProjectId incluye market_item con providerProjectId match');

    // graphStats
    const s = graphStats(g);
    assert(s.totalNodes === 8,                                             'stats.totalNodes correcto');
    assert(s.byType.project === 1 && s.byType.work_order === 2,           'stats.byType correcto');
    assert(s.byEdgeKind.parent === 5,                                     'stats.byEdgeKind.parent correcto');

    // empty inputs
    const empty = buildGraphFromKb(null);
    assert(empty.nodes.length === 0 && empty.edges.length === 0,          'null nodes → grafo vacío');
}

// ─── Runner ──────────────────────────────────────────────────────
const SUITE = [
    { name: 'H1.1 · KB Mind-as-Graph round-trip',                 fn: testKbMindAsGraph },
    { name: 'H1.3 · Export/Import firmado ECDSA P-256',           fn: testProjectIO },
    { name: 'H1.5 · KnowledgeLoader carga SOPs/SOCs y projectId', fn: testKnowledgeLoaderSocsSops },
    { name: 'H1.8 · KB sector readiness · auditoría TDD',         fn: testSectorReadiness },
    { name: 'H1.10.1 · Sector Cloner · prompt builder',           fn: testSectorClonerPromptBuilder },
    { name: 'H1.10.2 · Role SOP Generator · prompt builder',      fn: testRoleSopGeneratorPromptBuilder },
    { name: 'H1.10.4 · Regenerate SOP with feedback · builder',   fn: testRegenerateSopBuilder },
    { name: 'H1.10.5 · Bulk SOP generation · skip/cancel logic',  fn: testBulkGenSopOrchestration },
    { name: 'BUG-002 · extractJsonFromLlmOutput robusto a fences', fn: testExtractJsonFromLlmOutput },
    { name: 'H2.1 · Workshops · CRUD + cambio de estado',         fn: testWorkshopsCrud },
    { name: 'H2.3 · WorkshopsView · prompt builder propuesta IA', fn: testWorkshopsProposalPromptBuilder },
    { name: 'H2.5 · WorkshopsView · prompt builder informe IA',   fn: testWorkshopsReportPromptBuilder },
    { name: 'H2.6 · Selector tipo servicio · prompts dinámicos',  fn: testWorkshopsServiceTypeSelector },
    { name: 'H7.1 · Kanban Work Orders · CRUD + ledger',          fn: testKanbanWorkOrders },
    { name: 'H7.2 · Kanban · prompt builder IA + TDD eval',       fn: testKanbanExecutionPromptAndTdd },
    { name: 'H7.3 · Generar WOs desde SOP steps[]',               fn: testGenerateWosFromSop },
    { name: 'H7.6 · WO Assistant · context + prompt builder',     fn: testWoAssistantContext },
    { name: 'UX-001 · tagsService · folksonomía pura',            fn: testTagsService },
    { name: 'UX-001 sprint B · linkifyService · hipertexto puro', fn: testLinkifyService },
    { name: 'UX-002 · semanticTagger · taxonomía + folksonomía',  fn: testSemanticTagger },
    { name: 'MKT-001 sprint A · marketService + cnaeSeed puros',  fn: testMarketService },
    { name: 'UX-001 sprint C · projectHubService puro',           fn: testProjectHub },
    { name: 'UX-NAV-001 · navService puro',                       fn: testNavService },
    { name: 'AUTH-001 sprint A · identityService (helpers puros)', fn: testIdentityService },
    { name: 'KM-001 sprint A · smartFolderService puro',          fn: testSmartFolderService },
    { name: 'H8.1 · mindGraphService puro',                       fn: testMindGraphService }
];

export async function runTests() {
    console.group('%c SOS V11 · Test Suite ', 'background:#6366f1;color:#fff;padding:2px 6px;border-radius:3px');
    let passed = 0, failed = 0;
    for (const t of SUITE) {
        console.group(t.name);
        try { await t.fn(); passed++; console.groupEnd(); }
        catch (e) { failed++; console.error(e); console.groupEnd(); }
    }
    const badge = failed === 0 ? '%c✔ ALL GREEN' : '%c✘ FAILURES';
    const color = failed === 0 ? 'background:#16a34a' : 'background:#dc2626';
    console.log(badge + ` · ${passed}/${SUITE.length}`, `${color};color:#fff;padding:2px 6px;border-radius:3px`);
    console.groupEnd();
    return { passed, failed, total: SUITE.length };
}

if (typeof window !== 'undefined') {
    window.__runTests = runTests;
    // Dev ergonomics: exponer store y KB como globales tras cargar este módulo
    // para poder inspeccionar/manipular desde DevTools sin imports manuales.
    window.store = store;
    window.KB = KB;
}