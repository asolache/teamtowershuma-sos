
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
    { name: 'H7.3 · Generar WOs desde SOP steps[]',               fn: testGenerateWosFromSop }
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