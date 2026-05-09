
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
    assert(NAV_DESTINATIONS.length === 15,                          '15 destinos canónicos (+ learn UX-EDU-001 + matriu MAT-002-H)');
    assert(NAV_DESTINATIONS.some(d => d.id === 'dashboard' && d.global), 'dashboard es global');
    assert(NAV_DESTINATIONS.some(d => d.id === 'sops' && !d.global),     'sops NO es global (requiere projectId)');

    // sin projectId → omite los no-globales
    const linksGlobal = buildNavLinks({ active: 'dashboard' });
    assert(linksGlobal.every(l => l.id !== 'sops'),                 'sin projectId · sops omitido');
    assert(linksGlobal.length === 13,                                'sin projectId · 13 links (sin sops y sin wallet · 15-2)');
    assert(linksGlobal.find(l => l.id === 'dashboard').active === true, 'active flag funciona');
    assert(linksGlobal.find(l => l.id === 'map').href === '/map',   'sin projectId · map sin query');

    // con projectId → todos + query ?project= en los aplicables
    const linksProject = buildNavLinks({ active: 'kanban', projectId: 'proj-x' });
    assert(linksProject.length === 13,                              'con projectId · 13 links (incluye sops, wallet y savings)');
    assert(linksProject.find(l => l.id === 'wallet').href === '/wallet?project=proj-x', 'wallet con project query');
    assert(linksProject.find(l => l.id === 'savings').href === '/savings?project=proj-x', 'savings con project query');
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

    // ── UX-NAV-002 · agrupación por categorías
    const { NAV_CATEGORIES, groupNavByCategory, renderNavGroupedHtml } = mod;
    assert(Object.isFrozen(NAV_CATEGORIES) && NAV_CATEGORIES.length === 5,             'NAV_CATEGORIES frozen · 5 categorías');
    assert(NAV_CATEGORIES.find(c => c.id === 'home'),                                  'cat home existe');
    assert(NAV_CATEGORIES.find(c => c.id === 'operations'),                            'cat operations existe');
    assert(NAV_CATEGORIES.find(c => c.id === 'knowledge'),                             'cat knowledge existe');
    assert(NAV_CATEGORIES.find(c => c.id === 'market'),                                'cat market existe');
    assert(NAV_CATEGORIES.find(c => c.id === 'identity'),                              'cat identity existe');

    // Cada destination tiene category
    NAV_DESTINATIONS.forEach(d => {
        assert(typeof d.category === 'string' && d.category.length > 0,                d.id + ' · tiene category');
    });

    // groupNavByCategory · sin projectId
    const groupsNoP = groupNavByCategory({ active: 'dashboard' });
    // home + knowledge + market + identity (operations sin proyecto sólo tiene map+kanban; sigue apareciendo)
    assert(groupsNoP.find(g => g.category.id === 'home'),                              'groups · home presente');
    // home ahora tiene 2 links (dashboard + matriu) tras MAT-002-H
    assert(groupsNoP.find(g => g.category.id === 'home')?.links.length === 2,          'home · 2 links (dashboard + matriu)');
    // knowledge ahora 4 (tags + folders + mind + learn) tras UX-EDU-001 sprint C
    assert(groupsNoP.find(g => g.category.id === 'knowledge')?.links.length === 4,     'knowledge · 4 links (tags + folders + mind + learn)');
    // sin projectId · operations sólo tiene 2 (map · kanban) · sops y wallet son global=false
    const opsNoP = groupsNoP.find(g => g.category.id === 'operations');
    assert(opsNoP && opsNoP.links.length === 2,                                        'operations sin projectId · 2 links (map · kanban)');

    // groupNavByCategory · con projectId
    const groupsP = groupNavByCategory({ active: 'wallet', projectId: 'p1' });
    const opsP = groupsP.find(g => g.category.id === 'operations');
    assert(opsP && opsP.links.length === 4,                                            'operations con projectId · 4 links (map · sops · kanban · wallet)');
    assert(opsP.links.find(l => l.id === 'wallet').active === true,                    'active=wallet marcado');

    // renderNavGroupedHtml · estructura HTML
    const groupedHtml = renderNavGroupedHtml({ active: 'map', projectId: 'p1' });
    assert(typeof groupedHtml === 'string' && groupedHtml.length > 0,                  'renderNavGroupedHtml string');
    assert(groupedHtml.includes('data-nav-group="operations"'),                        'incluye data-nav-group operations');
    assert(groupedHtml.includes('data-nav-group="knowledge"'),                         'incluye data-nav-group knowledge');
    assert(groupedHtml.includes('data-nav-group="market"'),                            'incluye data-nav-group market');
    assert(groupedHtml.includes('data-nav-group="identity"'),                          'incluye data-nav-group identity');
    // home (2 links · dashboard + matriu tras MAT-002-H) ahora se renderiza como dropdown
    assert(groupedHtml.includes('data-nav-group="home"'),                              'home · dropdown (dashboard + matriu)');
    assert(groupedHtml.includes('href="/dashboard"') && groupedHtml.includes('href="/matriu"'), 'home dropdown contiene dashboard + matriu');
    // active dentro de dropdown · agrega activeClass al header del grupo
    assert(groupedHtml.includes('aria-haspopup="true"'),                               'dropdowns con aria-haspopup');
    assert(groupedHtml.includes('role="menu"'),                                         'menus con role="menu"');
    assert(groupedHtml.includes('hidden'),                                              'menus hidden por defecto');

    // exports
    assert(typeof mod.ensureNavGroupStyle === 'function',                              'ensureNavGroupStyle exportada');
    assert(typeof mod.bindNavGroupDropdowns === 'function',                            'bindNavGroupDropdowns exportada');

    // ── UX-NAV-003 · Breadcrumb + detectProjectPhase
    const { buildBreadcrumb, renderBreadcrumbHtml, detectProjectPhase, PHASE_META, ensureBreadcrumbStyle } = mod;
    assert(Object.isFrozen(PHASE_META) && PHASE_META.design && PHASE_META.ledger,      'PHASE_META frozen · 4 fases');

    // /dashboard · sólo Inicio current
    const bc1 = buildBreadcrumb({ pathname: '/dashboard' });
    assert(bc1.length === 1 && bc1[0].current === true,                                'dashboard · sólo Inicio current');

    // / vacío · igual
    const bc2 = buildBreadcrumb({ pathname: '/' });
    assert(bc2.length === 1 && bc2[0].current === true,                                '/ · sólo Inicio current');

    // /map sin proyecto · 2 niveles
    const bc3 = buildBreadcrumb({ pathname: '/map' });
    assert(bc3.length === 2 && bc3[1].label.includes('Mapa') && bc3[1].current === true, '/map sin proj · 2 niveles');

    // /map?project=p1 con proyecto · 3 niveles
    const projects = [{ id: 'p1', nombre: 'Hortet de la Vall' }, { id: 'p2', nombre: 'IKEA Madrid' }];
    const bc4 = buildBreadcrumb({ pathname: '/map', search: '?project=p1', projects });
    assert(bc4.length === 3,                                                            '/map?project=p1 · 3 niveles');
    assert(bc4[1].label.includes('Hortet de la Vall'),                                  'incluye nombre proyecto');
    assert(bc4[1].href === '/project/p1',                                               'project link al hub');
    assert(bc4[2].current === true,                                                     'último current');

    // /project/p2 · 2 niveles · current
    const bc5 = buildBreadcrumb({ pathname: '/project/p2', projects });
    assert(bc5.length === 2 && bc5[1].label.includes('IKEA Madrid') && bc5[1].current,  '/project/{id} · 2 niveles current');

    // /n/some-id · 2 niveles · trunca id largo
    const bc6 = buildBreadcrumb({ pathname: '/n/some-very-long-id-12345' });
    assert(bc6.length === 2 && bc6[1].label.includes('Nodo:') && bc6[1].current,        '/n/{id} · trunca');
    assert(bc6[1].label.includes('…'),                                                   'truncamiento con ellipsis');

    // ruta desconocida fallback
    const bc7 = buildBreadcrumb({ pathname: '/wat' });
    assert(bc7.length === 2 && bc7[1].current,                                          'ruta desconocida · fallback');

    // detectProjectPhase
    assert(detectProjectPhase(null) === null,                                            'null → null');
    const projDesign = { id: 'p', vna_roles: [] };
    assert(detectProjectPhase(projDesign) === 'design',                                  'project sin nada · design');
    const projWithSops = { id: 'p' };
    const stats1 = { sopsCount: 2, woDoing: 0, woLedgered: 0 };
    assert(detectProjectPhase(projWithSops, stats1) === 'build',                        'sops>0 · build');
    const stats2 = { sopsCount: 2, woDoing: 1, woLedgered: 0 };
    assert(detectProjectPhase(projWithSops, stats2) === 'operate',                      'wo doing · operate');
    const stats3 = { sopsCount: 2, woDoing: 0, woLedgered: 3 };
    assert(detectProjectPhase(projWithSops, stats3) === 'ledger',                       'wo ledgered · ledger');
    // Override manual con tag phase:X · gana sobre heurística
    const projTagged = { id: 'p', tags: ['phase:operate'] };
    assert(detectProjectPhase(projTagged, stats1) === 'operate',                        'tag phase:operate override sobre sops>0');

    // renderBreadcrumbHtml · estructura
    const html2 = renderBreadcrumbHtml({ items: bc4, phase: 'design' });
    assert(typeof html2 === 'string',                                                    'render string');
    assert(html2.includes('Hortet de la Vall'),                                          'incluye nombre proyecto');
    assert(html2.includes('aria-current="page"'),                                        'current con aria');
    assert(html2.includes('🎨') && html2.includes('DESIGN'),                            'phase pill con icono');
    // Sin phase
    const html3 = renderBreadcrumbHtml({ items: bc1, phase: null });
    assert(!html3.includes('DESIGN') && !html3.includes('LEDGER'),                       'sin phase · sin pill');
    // Phase inválida no rompe
    const html4 = renderBreadcrumbHtml({ items: bc1, phase: 'fake' });
    assert(typeof html4 === 'string',                                                    'phase inválida no rompe');

    // exports
    assert(typeof ensureBreadcrumbStyle === 'function',                                  'ensureBreadcrumbStyle exportada');
    assert(typeof mod.paintBreadcrumb === 'function',                                    'paintBreadcrumb exportada');
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

    // ── AUTH-001 sprint B · wallet binding (puro)
    const { isValidEvmAddress, addWalletToIdentity, removeWalletFromIdentity } = mod;
    const validAddr = '0x' + 'a'.repeat(40);
    assert(isValidEvmAddress(validAddr) === true,                         'address válida 0x+40hex');
    assert(isValidEvmAddress('0xZZ') === false,                           'address corta inválida');
    assert(isValidEvmAddress('not-an-address') === false,                 'string sin 0x inválida');
    assert(isValidEvmAddress(null) === false,                             'null inválida');

    const linked = addWalletToIdentity(node, { address: validAddr, chain: 'gnosis', label: 'Safe matriu' });
    assert(linked !== node,                                                'addWalletToIdentity no muta · devuelve nuevo');
    assert(Array.isArray(linked.content.wallets) && linked.content.wallets.length === 1, 'wallets array con 1 entrada');
    assert(linked.content.wallets[0].address === validAddr.toLowerCase(), 'address normalizada lowercase');
    assert(linked.content.wallets[0].chain === 'gnosis',                  'chain preservado');
    assert(linked.content.wallets[0].label === 'Safe matriu',             'label preservado');
    assert(linked.content.wallets[0].verifiedAt === null,                 'verifiedAt null hasta firma WalletConnect');

    // Idempotente: añadir misma address (case-insensitive) devuelve el mismo nodo
    const dup = addWalletToIdentity(linked, { address: validAddr.toUpperCase(), chain: 'gnosis' });
    assert(dup === linked,                                                 'address duplicada (case-insensitive) → mismo node');

    // addWallet · address inválida lanza
    let threwAddr = false;
    try { addWalletToIdentity(node, { address: 'invalido' }); } catch (_) { threwAddr = true; }
    assert(threwAddr,                                                       'addWalletToIdentity address inválida lanza');

    // removeWalletFromIdentity
    const unlinked = removeWalletFromIdentity(linked, validAddr);
    assert(unlinked.content.wallets.length === 0,                         'removeWallet quita entrada');
    assert(removeWalletFromIdentity(node, validAddr) === node,            'remove sobre nodo sin wallet → no-op');
    assert(typeof mod.linkWallet === 'function',                          'linkWallet exportada');
    assert(typeof mod.unlinkWallet === 'function',                        'unlinkWallet exportada');
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
    assert(s.byType.project === 1 && s.byType.work_order === 3,           'stats.byType correcto (3 wos: wo-1, wo-2, huerf)');
    assert(s.byEdgeKind.parent === 5,                                     'stats.byEdgeKind.parent correcto');

    // empty inputs
    const empty = buildGraphFromKb(null);
    assert(empty.nodes.length === 0 && empty.edges.length === 0,          'null nodes → grafo vacío');
}

// ─── KM-001 sprint C · contextPruner puro ───────────────────────
async function testContextPruner() {
    const mod = await import('../core/contextPruner.js?v=' + Date.now());
    const {
        DEFAULT_WEIGHTS, DEFAULT_TYPE_BOOSTS, CHARS_PER_TOKEN,
        extractTaskTags, scoreNode, estimateNodeTokens, pruneContextNodes,
    } = mod;

    // Defaults frozen + cobertura
    assert(Object.isFrozen(DEFAULT_WEIGHTS),                              'DEFAULT_WEIGHTS frozen');
    assert(Object.isFrozen(DEFAULT_TYPE_BOOSTS),                          'DEFAULT_TYPE_BOOSTS frozen');
    assert(typeof CHARS_PER_TOKEN === 'number' && CHARS_PER_TOKEN > 0,    'CHARS_PER_TOKEN positivo');
    const sumW = DEFAULT_WEIGHTS.tagOverlap + DEFAULT_WEIGHTS.recency + DEFAULT_WEIGHTS.typeBoost + DEFAULT_WEIGHTS.priority;
    assert(Math.abs(sumW - 1) < 0.001,                                    'pesos suman ~1.0');
    assert(DEFAULT_TYPE_BOOSTS.config === 0,                              'config tiene boost 0 (excluido)');
    assert(DEFAULT_TYPE_BOOSTS.sop > 1,                                    'sop boost > 1 (relevante)');

    // extractTaskTags
    assert(extractTaskTags({}).length === 0,                              'task vacío → sin tags');
    const t1 = extractTaskTags({ projectId: 'proj-x', sectorId: 'K', roleId: 'rol-y', types: ['sop','role'] });
    assert(t1.includes('project:proj-x'),                                 'task tag · project:');
    assert(t1.includes('sector:k'),                                       'task tag · sector: lowercase');
    assert(t1.includes('role:rol-y'),                                     'task tag · role:');
    assert(t1.includes('kind:sop') && t1.includes('kind:role'),           'task tag · kind: por type');
    const t2 = extractTaskTags({ extraTags: ['urgente', 'b2b'] });
    assert(t2.includes('urgente') && t2.includes('b2b'),                  'extraTags se preservan');

    // scoreNode · tag overlap
    const now = Date.now();
    const sopRel = { id: 'sop-1', type: 'sop', updatedAt: now, projectId: 'p1',
        content: { name: 'Atención', tags: ['kind:sop','project:p1','sector:k','role:atencion'] } };
    const sopOff = { id: 'sop-2', type: 'sop', updatedAt: now,
        content: { name: 'Otro sop', tags: ['kind:sop','sector:z'] } };
    const cfg    = { id: 'cfg', type: 'config', value: 'secret' };
    const old    = { id: 'old', type: 'sop', updatedAt: now - 365 * 24 * 60 * 60 * 1000,
        content: { name: 'Viejo', tags: ['kind:sop','project:p1'] } };

    const task = { projectId: 'p1', sectorId: 'K' };
    const sRel = scoreNode(sopRel, task);
    const sOff = scoreNode(sopOff, task);
    const sCfg = scoreNode(cfg, task);
    const sOld = scoreNode(old, task);

    assert(sRel > sOff,                                                    'sop relevante > sop sin overlap');
    assert(sCfg === 0,                                                     'config siempre score 0 (excluido)');
    assert(sRel > sOld,                                                    'sop reciente > sop viejo · misma overlap');
    assert(sRel > 0 && sRel <= 1,                                          'score en [0,1]');

    // requireProjectId
    const taskStrict = { projectId: 'p1', requireProjectId: true };
    const orphan = { id: 'orph', type: 'sop', projectId: 'p2', content: { tags: ['kind:sop','project:p2'] } };
    assert(scoreNode(orphan, taskStrict) === 0,                            'requireProjectId · orphan score 0');
    assert(scoreNode(sopRel, taskStrict) > 0,                              'requireProjectId · pertenece score >0');

    // priority boost
    const woHigh = { id: 'wo-h', type: 'work_order', updatedAt: now, content: { tags: ['priority:high'] } };
    const woLow  = { id: 'wo-l', type: 'work_order', updatedAt: now, content: { tags: ['priority:low'] } };
    assert(scoreNode(woHigh, {}) > scoreNode(woLow, {}),                  'priority:high > priority:low');

    // estimateNodeTokens
    assert(estimateNodeTokens(null) === 0,                                 'estimateNodeTokens null → 0');
    const shortNode = { id: 'x', type: 'sop', content: { name: 'A' } };
    const longNode  = { id: 'y', type: 'sop', content: { name: 'A', description: 'X'.repeat(800) } };
    assert(estimateNodeTokens(longNode) > estimateNodeTokens(shortNode),  'tokens largos > cortos');
    assert(estimateNodeTokens(longNode) >= 200,                            '800 chars description ≥ 200 tokens');

    // pruneContextNodes
    const candidates = [
        sopRel,
        sopOff,
        old,
        cfg,
        woHigh,
        { id: 'big-sop', type: 'sop', updatedAt: now, content: { tags: ['kind:sop','project:p1'], description: 'L'.repeat(20000) } },
    ];
    const r1 = pruneContextNodes(candidates, task, { tokenBudget: 1000, minScore: 0.05, maxNodes: 50 });
    assert(Array.isArray(r1.selected) && r1.selected.length > 0,          'pruner selecciona algún nodo');
    assert(r1.selected.every(x => x.node.type !== 'config'),              'pruner nunca selecciona config');
    assert(r1.stats.usedTokens <= 1000,                                   'usedTokens dentro del budget');
    // El big-sop debería estar en skipped por exceder budget
    const bigSelected = r1.selected.find(x => x.node.id === 'big-sop');
    const bigSkipped  = r1.skipped.find(x => x.node && x.node.id === 'big-sop');
    assert(!bigSelected && bigSkipped && bigSkipped.reason === 'tokenBudget', 'big-sop skipped por tokenBudget');
    // Orden por score desc
    for (let i = 1; i < r1.selected.length; i++) {
        assert(r1.selected[i-1].score >= r1.selected[i].score,             'ordenado por score desc');
    }

    // maxNodes
    const r2 = pruneContextNodes(candidates, task, { tokenBudget: 999999, maxNodes: 2 });
    assert(r2.selected.length === 2,                                       'maxNodes=2 limita a 2');

    // empty inputs
    const empty = pruneContextNodes([], task);
    assert(empty.selected.length === 0 && empty.stats.usedTokens === 0,    'candidates vacío → resultado vacío');

    // task como string de tags directos
    const taskDirect = { tags: ['project:p1','kind:sop'] };
    const sDirect = scoreNode(sopRel, taskDirect);
    assert(sDirect > 0,                                                     'task con tags directos funciona');

    // ── KM-001 sprint D · formatNodesForPrompt + similarity baseline
    const { formatNodesForPrompt, jaccardSimilarity, passesContextGate } = mod;

    // formatNodesForPrompt con array vacío
    assert(formatNodesForPrompt([]) === '',                                 'formatNodesForPrompt vacío → ""');
    assert(formatNodesForPrompt(null) === '',                               'formatNodesForPrompt null → ""');

    // formato real con un selected
    const sopForFmt = {
        node: {
            id: 'sop-fmt', type: 'sop', projectId: 'p1',
            content: {
                name: 'SOP de prueba',
                description: 'Descripción larga ' + 'X'.repeat(2000),
                tags: ['kind:sop', 'project:p1', 'urgente', 'b2b'],
                steps: [
                    { id: 's1', label: 'Paso 1', role_kind: 'human', duration_minutes: 5 },
                    { id: 's2', label: 'Paso 2', role_kind: 'ai',    duration_minutes: 3 },
                ],
            },
        },
        score: 0.9,
    };
    const fmt = formatNodesForPrompt([sopForFmt], { maxBodyChars: 100 });
    assert(typeof fmt === 'string' && fmt.length > 0,                      'formatNodesForPrompt produce string');
    assert(fmt.includes('CONTEXTO INYECTADO · 1 nodos'),                   'header con count correcto');
    assert(fmt.includes('sop · sop-fmt'),                                  'incluye type · id');
    assert(fmt.includes('SOP de prueba'),                                  'incluye título');
    assert(fmt.includes('Tags: kind:sop · project:p1'),                    'separa taxonómicos');
    assert(fmt.includes('Folksonomy: urgente · b2b'),                      'separa folksonómicos');
    assert(fmt.includes('Paso 1') && fmt.includes('Paso 2'),               'incluye steps');
    // body truncado a maxBodyChars
    const bodyMatch = fmt.match(/Descripción larga X+/);
    assert(bodyMatch && bodyMatch[0].length <= 120,                         'body truncado a maxBodyChars');

    // jaccardSimilarity
    assert(jaccardSimilarity('', '') === 1,                                'ambos vacíos → 1');
    assert(jaccardSimilarity('hola mundo', '') === 0,                      'uno vacío → 0');
    assert(jaccardSimilarity('hola mundo', 'hola mundo') === 1,            'idénticos → 1');
    const sim = jaccardSimilarity('el cliente IKEA Madrid', 'cliente IKEA Madrid retail');
    assert(sim > 0.4 && sim < 1,                                            'parcial overlap entre 0 y 1');
    // Stopwords no cuentan: 'el' y 'the' deben ser ignorados
    const noisy = jaccardSimilarity('el cliente IKEA', 'the cliente IKEA');
    assert(noisy === 1,                                                     'stopwords no afectan al jaccard');

    // passesContextGate
    const gate1 = passesContextGate({ baseline: 'hola mundo SOP', candidate: 'hola mundo SOP', threshold: 0.9 });
    assert(gate1.passes === true && gate1.score === 1,                     'gate pasa con identicos');
    const gate2 = passesContextGate({ baseline: 'hola mundo', candidate: 'completamente distinto', threshold: 0.5 });
    assert(gate2.passes === false,                                          'gate falla con dispares');
    assert(typeof gate2.threshold === 'number',                            'gate retorna threshold');

    // ── KM-001 sprint E · pruneFromKb async con mock KB
    const { pruneFromKb } = mod;
    assert(typeof pruneFromKb === 'function',                              'pruneFromKb exportada');

    // KB null/undefined → resultado vacío sin lanzar
    const emptyKb = await pruneFromKb({ KB: null });
    assert(Array.isArray(emptyKb.selected) && emptyKb.selected.length === 0,    'pruneFromKb sin KB → resultado vacío');
    assert(emptyKb.formatted === '',                                          'pruneFromKb sin KB · formatted vacío');

    // KB mock con query/getAllNodes
    const nowKb = Date.now();
    const fakeNodes = [
        { id: 'p1', type: 'project',     content: { tags: ['kind:project','project:p1'] }, projectId: null, updatedAt: nowKb },
        { id: 'sop-of-p1', type: 'sop',  projectId: 'p1', updatedAt: nowKb,
          content: { name: 'SOP del proyecto', tags: ['kind:sop','project:p1','sector:k'] } },
        { id: 'sop-public', type: 'sop', projectId: null, updatedAt: nowKb,
          content: { name: 'SOP público TT', tags: ['kind:sop','scope:public','sector:k'] } },
        { id: 'sop-otro',   type: 'sop', projectId: 'p2', updatedAt: nowKb,
          content: { name: 'SOP otro proyecto', tags: ['kind:sop','project:p2'] } },
        { id: 'cfg', type: 'config', value: 'secret' },
    ];
    const mockKB = {
        query:        async (q) => fakeNodes.filter(n =>
            (q.projectId == null || n.projectId === q.projectId) &&
            (q.type == null     || n.type === q.type)),
        getAllNodes:  async ()  => fakeNodes,
    };

    const r = await pruneFromKb({
        KB: mockKB,
        projectId: 'p1',
        task: { sectorId: 'K', types: ['sop'] },
        options: { tokenBudget: 5000, minScore: 0 },
    });
    assert(r.stats.candidates >= 2,                                        'pruneFromKb proj-p1 incluye p1 + sop-of-p1 + públicos');
    const ids = r.selected.map(x => x.node.id);
    assert(ids.includes('sop-of-p1'),                                       'incluye sop del proyecto');
    assert(ids.includes('sop-public'),                                      'incluye sop público (sin projectId)');
    assert(!ids.includes('sop-otro'),                                       'NO incluye sop de otro proyecto');
    assert(!ids.includes('cfg'),                                            'NO incluye config');
    assert(typeof r.formatted === 'string' && r.formatted.includes('CONTEXTO INYECTADO'), 'formatted listo para system prompt');
}

// ─── MKT-001 sprint C1 · walletService puro ─────────────────────
async function testWalletService() {
    const mod = await import('../core/walletService.js?v=' + Date.now());
    const {
        MOVEMENT_KINDS, TOPUP_PRESETS,
        validateWallet, buildWalletForProject,
        topUpWallet, consumeFromWallet, refundWallet, adjustWallet,
        walletStats,
    } = mod;

    // Constantes
    assert(Object.isFrozen(MOVEMENT_KINDS),                                'MOVEMENT_KINDS frozen');
    assert(MOVEMENT_KINDS.includes('topup') && MOVEMENT_KINDS.includes('consume'), 'kinds incluye topup/consume');
    assert(Object.isFrozen(TOPUP_PRESETS) && TOPUP_PRESETS.length === 4,   'TOPUP_PRESETS · 4 tramos frozen');

    // buildWalletForProject
    let threwNoPid = false;
    try { buildWalletForProject(); } catch(_) { threwNoPid = true; }
    assert(threwNoPid,                                                      'sin projectId lanza');

    const w0 = buildWalletForProject('proj-x');
    assert(w0.id === 'wallet-proj-x' && w0.type === 'wallet',              'wallet id y type correctos');
    assert(w0.content.balanceEur === 0,                                    'balance inicial 0');
    assert(Array.isArray(w0.content.movements) && w0.content.movements.length === 0, 'movements vacío');
    assert(w0.projectId === 'proj-x',                                      'projectId en root');
    assert(w0.content.tags.includes('kind:wallet'),                        'tags taxonomy auto');
    assert(validateWallet(w0).ok === true,                                 'wallet recién construido válido');

    // validateWallet · errores
    assert(validateWallet(null).ok === false,                              'null falla');
    assert(validateWallet({ ...w0, type: 'project' }).ok === false,        'type incorrecto falla');

    // topUpWallet · pureza
    const w1 = topUpWallet({ wallet: w0, amountEur: 25, source: 'preset', note: 'test' });
    assert(w1 !== w0,                                                      'topUp no muta · devuelve nuevo');
    assert(w1.content.balanceEur === 25,                                   'balance actualizado');
    assert(w1.content.movements.length === 1,                              'movement añadido');
    assert(w1.content.movements[0].kind === 'topup',                       'movement kind topup');
    assert(w1.content.movements[0].amountEur === 25,                       'movement amount preservado');
    assert(w1.content.movements[0].balanceAfter === 25,                    'balanceAfter en movement');
    assert(w0.content.balanceEur === 0,                                    'original NO mutado');

    // topUpWallet · validaciones
    let threwNeg = false;
    try { topUpWallet({ wallet: w1, amountEur: -5 }); } catch(_) { threwNeg = true; }
    assert(threwNeg,                                                        'topUp negativo lanza');

    // consumeFromWallet · saldo suficiente
    const w2 = consumeFromWallet({ wallet: w1, amountEur: 0.05, ref: 'llm-call-abc', source: 'orchestrator' });
    assert(w2.content.balanceEur === +(25 - 0.05).toFixed(6),              'balance tras consume');
    assert(w2.content.movements[0].kind === 'consume',                     'kind consume primero (más reciente)');
    assert(w2.content.movements[1].kind === 'topup',                       'topup queda en posición 1');

    // consumeFromWallet · saldo insuficiente
    let threwInsuf = false;
    let insufErr;
    try { consumeFromWallet({ wallet: w0, amountEur: 100 }); } catch(e) { threwInsuf = true; insufErr = e; }
    assert(threwInsuf && insufErr.code === 'INSUFFICIENT_FUNDS',           'consume con saldo insuficiente lanza con code');
    assert(insufErr.balance === 0 && insufErr.required === 100,            'error trae balance y required');

    // consumeFromWallet · allowNegative
    const wNeg = consumeFromWallet({ wallet: w0, amountEur: 5, allowNegative: true });
    assert(wNeg.content.balanceEur === -5,                                 'allowNegative permite saldo negativo');

    // refundWallet
    const w3 = refundWallet({ wallet: w2, amountEur: 0.02, ref: 'refund-test' });
    assert(w3.content.balanceEur > w2.content.balanceEur,                  'refund suma saldo');
    assert(w3.content.movements[0].kind === 'refund',                      'kind refund');

    // adjustWallet
    const wPlus = adjustWallet({ wallet: w0, deltaEur: 100, note: 'inicial' });
    assert(wPlus.content.balanceEur === 100,                               'adjust positivo suma');
    const wMinus = adjustWallet({ wallet: wPlus, deltaEur: -30, note: 'corrección' });
    assert(wMinus.content.balanceEur === 70,                               'adjust negativo resta');

    let threwZero = false;
    try { adjustWallet({ wallet: w0, deltaEur: 0 }); } catch(_) { threwZero = true; }
    assert(threwZero,                                                       'adjust con delta=0 lanza');

    // walletStats
    const stats = walletStats(w3);
    assert(stats.balance === w3.content.balanceEur,                        'stats.balance correcto');
    assert(stats.totalTopups === 25,                                       'stats.totalTopups');
    assert(stats.totalConsumed === 0.05,                                   'stats.totalConsumed');
    assert(stats.totalRefunds === 0.02,                                    'stats.totalRefunds');
    assert(stats.movementCount === 3,                                      'stats.movementCount');

    // exports
    assert(typeof mod.getWalletForProject === 'function',                  'getWalletForProject exportada');
    assert(typeof mod.getOrCreateWalletForProject === 'function',          'getOrCreateWalletForProject exportada');
    assert(typeof mod.topUpAndPersist === 'function',                      'topUpAndPersist exportada');
    assert(typeof mod.consumeAndPersist === 'function',                    'consumeAndPersist exportada');

    // ── MKT-001 sprint C3 · computeChargeFromTelemetry (puro)
    const { computeChargeFromTelemetry, DEFAULT_USD_TO_EUR, chargeWalletForLlmCall } = mod;
    assert(DEFAULT_USD_TO_EUR === 0.92,                                    'rate USD→EUR default 0.92');

    // sin tokens → invalid
    const ch0 = computeChargeFromTelemetry(null);
    assert(ch0.valid === false,                                            'telemetry null → invalid');
    const ch1 = computeChargeFromTelemetry({});
    assert(ch1.valid === false,                                            'telemetry sin tokens → invalid');

    // costUSD explícito → costEur = costUSD * rate
    const ch2 = computeChargeFromTelemetry({ tokens: { total_tokens: 1000 } }, { costUSD: 0.10 });
    assert(ch2.valid === true && ch2.costUSD === 0.1,                      'costUSD explícito preservado');
    assert(ch2.costEur === +(0.10 * 0.92).toFixed(6),                      'costEur = costUSD * 0.92');

    // sin costUSD pero con pricing y tokens → calcula
    const ch3 = computeChargeFromTelemetry(
        { tokens: { prompt_tokens: 1000000, completion_tokens: 500000, total_tokens: 1500000 } },
        { pricing: { input: 3.00, output: 15.00 } }
    );
    assert(ch3.costUSD === +((1 * 3) + (0.5 * 15)).toFixed(6),             'costUSD calculado de tokens');

    // rate custom
    const ch4 = computeChargeFromTelemetry({ tokens: { total_tokens: 1 } }, { costUSD: 1, eurRate: 1.0 });
    assert(ch4.costEur === 1,                                              'rate custom 1.0');

    // chargeWalletForLlmCall · sin projectId → skipped
    const skip1 = await chargeWalletForLlmCall({ projectId: null, telemetry: { tokens: { total_tokens: 100 } } });
    assert(skip1.skipped === 'no-projectId' && skip1.charge === null,      'sin projectId → skipped');

    // sin telemetry → skipped
    const skip2 = await chargeWalletForLlmCall({ projectId: 'proj-x', telemetry: null });
    assert(skip2.skipped === 'no-telemetry',                               'sin telemetry → skipped');

    // costo cero → skipped (no toca KB)
    const skip3 = await chargeWalletForLlmCall({
        projectId: 'proj-x',
        telemetry: { tokens: { total_tokens: 100 } },
        costUSD: 0,
    });
    assert(skip3.skipped === 'zero-cost',                                  'costo 0 → skipped');

    // exports
    assert(typeof mod.chargeWalletForLlmCall === 'function',               'chargeWalletForLlmCall exportada');
    assert(typeof mod.computeChargeFromTelemetry === 'function',           'computeChargeFromTelemetry exportada');
}

// ─── MKT-001 sprint D · savingsService puro ─────────────────────
async function testSavingsService() {
    const mod = await import('../core/savingsService.js?v=' + Date.now());
    const {
        computeWoHumanCost, computeWoAiCost, sumWalletConsumption,
        sumEfficiencyLogs, compareToConventional, computeProjectSavings,
        buildSavingsTable, accumulateAllProjects,
    } = mod;

    // computeWoHumanCost
    const wo1 = { content: { fmvPerHour: 50, estimatedHours: 2, actualHours: 3 } };
    const c1  = computeWoHumanCost(wo1);
    assert(c1.estimated === 100,                                          'cost humano estimated = h·fmv');
    assert(c1.real === 150,                                                'cost humano real con actualHours');

    const wo2 = { content: { fmvPerHour: 50, estimatedHours: 1 } };       // sin actualHours
    const c2  = computeWoHumanCost(wo2);
    assert(c2.estimated === 50 && c2.real === null,                       'sin actualHours · real=null');

    assert(computeWoHumanCost(null).real === null,                        'null devuelve estructura sin lanzar');

    // computeWoAiCost
    const woAi = { content: { tokensIn: 1e6, tokensOut: 5e5 } };
    const ai1 = computeWoAiCost(woAi, { input: 3, output: 15 });
    assert(ai1.costUSD === +((1*3) + (0.5*15)).toFixed(6),                'cost IA · tokens × pricing');
    assert(computeWoAiCost({ content: {} }) === null,                     'sin tokens · null');

    // sumWalletConsumption
    const wallet = { content: { movements: [
        { kind: 'topup',   amountEur: 25 },
        { kind: 'consume', amountEur: 0.05 },
        { kind: 'consume', amountEur: 0.03 },
        { kind: 'refund',  amountEur: 0.01 },
        { kind: 'adjustment', amountEur: 1 },
    ]}};
    const sw = sumWalletConsumption(wallet);
    assert(sw.totalConsumedEur === 0.08,                                  'wallet consumido suma sólo consumes');
    assert(sw.movementCount === 2,                                         'count consumes');
    assert(sumWalletConsumption(null).totalConsumedEur === 0,             'null wallet → 0');

    // sumEfficiencyLogs
    const logs = [
        { content: { costUSD: 0.10, totalTokens: 5000, pruning: { taskTags: ['project:p1','sector:k'] } } },
        { content: { costUSD: 0.05, totalTokens: 2000, pruning: { taskTags: ['project:p2'] } } },
        { content: { costUSD: 0.20, totalTokens: 8000 } },                // sin tags
    ];
    const all = sumEfficiencyLogs(logs);
    assert(all.totalUsd === 0.35 && all.count === 3,                      'sin filter · todos');
    const onlyP1 = sumEfficiencyLogs(logs, { projectId: 'p1' });
    assert(onlyP1.count === 1 && onlyP1.totalUsd === 0.10,                'filtro projectId:p1');
    assert(onlyP1.totalEur === +(0.10 * 0.92).toFixed(6),                 'totalEur = USD * rate');

    // compareToConventional
    const cmp1 = compareToConventional({ category: 'notaria', sosEur: 100 });
    assert(cmp1.available === true,                                       'notaria existe en defaults');
    assert(cmp1.midEur === 1650,                                          'midpoint notaria · (800+2500)/2');
    assert(cmp1.savingEur === 1550,                                       'saving = mid - sos');
    assert(cmp1.savingPct === 94,                                         'pct ~94%');

    const cmpUnknown = compareToConventional({ category: 'inventado', sosEur: 100 });
    assert(cmpUnknown.available === false,                                'categoria inválida · available false');

    // saving negativo se clamps a 0 (sosEur > mid)
    const cmpExpensive = compareToConventional({ category: 'notaria', sosEur: 5000 });
    assert(cmpExpensive.savingEur === 0,                                  'saving clamp a 0 si sos>mid');
    assert(cmpExpensive.savingPct === 0,                                  'pct 0 también');

    // computeProjectSavings · agregado completo
    const projWO = [
        { projectId: 'p1', content: { status: 'ledgered', fmvPerHour: 50, estimatedHours: 2, actualHours: 3 } },
        { projectId: 'p1', content: { status: 'doing',    fmvPerHour: 50, estimatedHours: 1, actualHours: null } },
        { projectId: 'p2', content: { status: 'ledgered', fmvPerHour: 50, estimatedHours: 1, actualHours: 1 } },
    ];
    const stats = computeProjectSavings({
        projectId: 'p1', wallet, efficiencyLogs: logs, workOrders: projWO,
    });
    assert(stats.projectId === 'p1',                                      'projectId preservado');
    assert(stats.aiCostEur === 0.08,                                      'aiCostEur usa wallet consumed (mayor que efficiency)');
    assert(stats.humanCostReal === 150,                                   'humanCostReal sólo p1 · 3h*50');
    assert(stats.humanHoursReal === 3,                                    'humanHoursReal sólo de WOs ledgered/doing con actualHours · p1');
    assert(stats.woCount === 2 && stats.woLedgered === 1,                 'WOs cuenta sólo p1');
    assert(stats.sosTotalCostEur === +(0.08 + 150).toFixed(2),            'sosTotalCostEur = aiEur + humanReal');

    // sin wallet · fallback a efficiency logs
    const statsNoWallet = computeProjectSavings({
        projectId: 'p1', wallet: null, efficiencyLogs: logs, workOrders: projWO,
    });
    assert(statsNoWallet.aiCostEur === +(0.10 * 0.92).toFixed(4),         'sin wallet · usa efficiency con projectId:p1');

    // empty
    const empt = computeProjectSavings({ projectId: null });
    assert(empt.sosTotalCostEur === 0,                                    'sin projectId · stats vacíos');

    // buildSavingsTable
    const table = buildSavingsTable(stats);
    assert(Array.isArray(table) && table.length === 4,                    'tabla 4 categorias defaults');
    assert(table.every(c => c.available === true),                        'las 4 disponibles');

    // accumulateAllProjects
    const projects = [{ id: 'p1' }, { id: 'p2' }];
    const wallets  = [wallet];   // sólo p1 lo asignamos abajo
    wallet.projectId = 'p1';
    wallet.content.projectId = 'p1';
    const acc = accumulateAllProjects({ projects, wallets, efficiencyLogs: logs, workOrders: projWO });
    assert(acc.byProject.length === 2,                                    'byProject 2 entries');
    assert(acc.totals.aiCallCount === 2,                                  'totals.aiCallCount p1+p2');
    assert(acc.totals.woLedgered === 2,                                   'totals.woLedgered p1+p2');
    assert(acc.projectsCount === 2,                                       'projectsCount');
}

// ─── H_ANIM_001 sprint A · flowAnimationService puro ────────────
async function testFlowAnimationService() {
    const mod = await import('../core/flowAnimationService.js?v=' + Date.now());
    const {
        normalizeTransactionsOrder, groupTransactionsByPhase,
        computeAnimationCycles, validateFlowOrder, autoFillSequenceOrder,
        ANIMATION_MODES,
    } = mod;

    // Constantes
    assert(Object.isFrozen(ANIMATION_MODES) && ANIMATION_MODES.length === 2, '2 ANIMATION_MODES frozen');

    // normalizeTransactionsOrder
    const txs = [
        { id: 'a', from: 'r1', to: 'r2', sequence_order: 3 },
        { id: 'b', from: 'r2', to: 'r3' },                    // sin orden
        { id: 'c', from: 'r1', to: 'r3', sequence_order: 1 },
        { id: 'd', from: 'r3', to: 'r1', sequence_order: 2 },
        { id: 'e', from: 'r1', to: 'r4' },                    // sin orden
    ];
    const sorted = normalizeTransactionsOrder(txs);
    assert(sorted.length === 5,                                            'normalize · 5');
    assert(sorted[0].id === 'c' && sorted[1].id === 'd' && sorted[2].id === 'a',
        'orden: c(1) · d(2) · a(3)');
    assert(sorted[3].id === 'b' && sorted[4].id === 'e',                  'sin orden van al final · estable');
    assert(normalizeTransactionsOrder(null).length === 0,                 'null → []');
    assert(normalizeTransactionsOrder([]).length === 0,                   '[] → []');

    // groupTransactionsByPhase
    const txsPhases = [
        { id: 'a', phase: 'cosecha',   sequence_order: 1 },
        { id: 'b', phase: 'cosecha',   sequence_order: 2 },
        { id: 'c', phase: 'entrega',   sequence_order: 3 },
        { id: 'd' },                                          // sin phase ni orden
    ];
    const groups = groupTransactionsByPhase(txsPhases);
    assert(groups.cosecha?.length === 2,                                  'phase cosecha · 2');
    assert(groups.entrega?.length === 1,                                  'phase entrega · 1');
    assert(groups.__unphased?.length === 1,                               '__unphased · 1');

    // computeAnimationCycles · sequential (default)
    const cyc = computeAnimationCycles(txs, { pulseDuration: 1000, gap: 100 });
    assert(cyc.pulses.length === 5,                                       '5 pulsos · uno por tx');
    assert(cyc.pulses[0].txId === 'c' && cyc.pulses[0].delay === 0,       'primer pulso = c con delay 0');
    assert(cyc.pulses[1].delay === 1100,                                  'segundo delay · 1000+100');
    assert(cyc.pulses[2].delay === 2200,                                  'tercer delay · 2x(1000+100)');
    assert(cyc.totalDuration === 5500,                                    'totalDuration · 5*(1000+100)');
    assert(cyc.pulses.every(p => p.duration === 1000),                    'todos pulses con duration=1000');

    // computeAnimationCycles · parallel-by-phase
    const cycPhase = computeAnimationCycles(txsPhases, {
        mode: 'parallel-by-phase', pulseDuration: 500, gap: 100,
    });
    assert(cycPhase.pulses.length === 4,                                  'parallel-by-phase · 4 pulsos');
    // Pulsos del mismo phase tienen el mismo delay
    const cosechaP = cycPhase.pulses.filter(p => p.phase === 'cosecha');
    assert(cosechaP.length === 2 && cosechaP[0].delay === cosechaP[1].delay, 'cosecha · 2 pulsos mismo delay');

    // validateFlowOrder
    const v1 = validateFlowOrder([
        { id: 'a', sequence_order: 1 },
        { id: 'b', sequence_order: 2 },
        { id: 'c', sequence_order: 3 },
    ]);
    assert(v1.ok === true && v1.warnings.length === 0,                    'orden perfecto · sin warnings');

    const v2 = validateFlowOrder([
        { id: 'a', sequence_order: 1 },
        { id: 'b' },
        { id: 'c', sequence_order: 1 },          // duplicado
        { id: 'd', sequence_order: 5 },          // gap
    ]);
    assert(v2.ok === false,                                                'incompleto · ok false');
    assert(v2.warnings.some(w => /sin sequence_order/.test(w)),           'warning · sin sequence_order');
    assert(v2.warnings.some(w => /se repite/.test(w)),                    'warning · duplicado');
    assert(v2.warnings.some(w => /gap/.test(w)),                          'warning · gap');

    // autoFillSequenceOrder
    const filled = autoFillSequenceOrder([
        { id: 'a', sequence_order: 5 },
        { id: 'b' },
        { id: 'c' },
    ]);
    assert(filled[0].sequence_order === 5,                                'preserva orden existente');
    assert(filled[1].sequence_order === 6 && filled[2].sequence_order === 7, 'continúa desde max+1');

    // empty/null inputs
    const emptyCycle = computeAnimationCycles(null);
    assert(emptyCycle.pulses.length === 0 && emptyCycle.totalDuration === 0, 'null → ciclo vacío');

    // ── H_ANIM_001 sprint C · buildFlowOrderPrompt + applyOrderToTransactions
    const { buildFlowOrderPrompt, applyOrderToTransactions } = mod;

    const roles = [
        { id: 'r1', name: 'Cliente',     castell_level: 'pinya' },
        { id: 'r2', name: 'Comercial',   castell_level: 'tronc' },
        { id: 'r3', name: 'Operario' },
    ];
    const txOrd = [
        { id: 'tx-1', from: 'r1', to: 'r2', deliverable: 'Solicitud',  type: 'tangible',   is_must: true },
        { id: 'tx-2', from: 'r2', to: 'r3', deliverable: 'Brief',      type: 'intangible', is_must: false },
        { id: 'tx-3', from: 'r3', to: 'r1', deliverable: 'Entrega',    type: 'tangible',   is_must: true },
    ];

    const prompt = buildFlowOrderPrompt({ roles, transactions: txOrd, projectName: 'Cliente XYZ' });
    assert(typeof prompt === 'string' && prompt.length > 200,             'buildFlowOrderPrompt · string sustancioso');
    assert(prompt.includes('Cliente XYZ'),                                'projectName en prompt');
    assert(prompt.includes('tx-1') && prompt.includes('tx-3'),            'incluye tx ids');
    assert(prompt.includes('Solicitud') && prompt.includes('Brief'),      'incluye deliverables');
    assert(prompt.includes('MUST'),                                       'marca MUST');
    assert(prompt.includes('"sequence_order"'),                           'output schema con sequence_order');
    assert(prompt.includes('"phase"'),                                    'output schema con phase');
    assert(prompt.includes('"rationale"'),                                'output schema con rationale');

    // sin transactions lanza
    let threwEmpty = false;
    try { buildFlowOrderPrompt({ roles, transactions: [] }); } catch(_) { threwEmpty = true; }
    assert(threwEmpty,                                                     'sin transactions lanza');

    // applyOrderToTransactions
    const ordered = [
        { id: 'tx-1', sequence_order: 1, phase: 'descubrimiento' },
        { id: 'tx-3', sequence_order: 3, phase: 'entrega' },
        { id: 'tx-2', sequence_order: 2 },                               // sin phase
        { id: 'tx-bad' },                                                 // id no existe en txs · ignored
    ];
    const applied = applyOrderToTransactions(txOrd, ordered);
    assert(applied[0].sequence_order === 1 && applied[0].phase === 'descubrimiento', 'tx-1 · order y phase aplicados');
    assert(applied[1].sequence_order === 2 && applied[1].phase === null, 'tx-2 · order sin phase');
    assert(applied[2].sequence_order === 3 && applied[2].phase === 'entrega', 'tx-3 · order y phase');
    assert(applied !== txOrd,                                             'devuelve nuevo array · pureza');
    // sin sequence_order válido → tx queda intacta
    const partialOrdered = [{ id: 'tx-1', sequence_order: -5 }, { id: 'tx-2', sequence_order: 'foo' }];
    const partial = applyOrderToTransactions(txOrd, partialOrdered);
    assert(partial[0].sequence_order === undefined,                       'sequence_order inválido (negativo) ignorado');
    assert(partial[1].sequence_order === undefined,                       'sequence_order no numérico ignorado');

    // null inputs
    assert(applyOrderToTransactions(null, ordered).length === 0,         'null transactions → []');
    assert(applyOrderToTransactions(txOrd, null).length === txOrd.length, 'null ordered → mismo array');
}

// ─── MAT-002-A · matriuTemplate puro ────────────────────────────
async function testMatriuTemplate() {
    const mod = await import('../core/matriuTemplate.js?v=' + Date.now());
    const {
        MATRIU_COHORT_0, MATRIU_PERKS, MATRIU_FAIR_FRACTAL_RULES,
        MATRIU_VALUE_KINDS, buildMatriuCohortProject,
    } = mod;

    // Constantes frozen
    assert(Object.isFrozen(MATRIU_COHORT_0),                              'MATRIU_COHORT_0 frozen');
    assert(MATRIU_COHORT_0.cohort === 0 && MATRIU_COHORT_0.capacity === 100, 'cohort=0 · capacity=100');
    assert(MATRIU_COHORT_0.multiplier === 1.5,                            'multiplier ×1.5');
    assert(MATRIU_COHORT_0.initialCredits === 2000,                       '2.000 crèdits');
    assert(MATRIU_COHORT_0.cohortWeeks === 10,                            '10 setmanes');
    assert(MATRIU_COHORT_0.sectorTT === 'Q',                              'sector Q · educación');

    assert(Object.isFrozen(MATRIU_PERKS) && MATRIU_PERKS.length === 6,     '6 perks frozen');
    ['multiplicador','hat-tf-eco','credits','cohort-10sem','llinatge','cops-permanents']
        .forEach(p => assert(MATRIU_PERKS.find(x => x.id === p),           'perk ' + p));

    assert(Object.isFrozen(MATRIU_FAIR_FRACTAL_RULES) && MATRIU_FAIR_FRACTAL_RULES.length === 4, '4 reglas FF');
    ['fair','fractal','escalable','automatic']
        .forEach(r => assert(MATRIU_FAIR_FRACTAL_RULES.find(x => x.id === r), 'regla ' + r));

    assert(Object.isFrozen(MATRIU_VALUE_KINDS) && MATRIU_VALUE_KINDS.length === 4, '4 value kinds');
    ['producte-fisic','equity-composable','drets-us','credits-reputacio']
        .forEach(k => assert(MATRIU_VALUE_KINDS.find(x => x.id === k),     'value ' + k));

    // buildMatriuCohortProject · validaciones
    let threwName = false;
    try { buildMatriuCohortProject({ projectIdea: 'X' }); } catch(_) { threwName = true; }
    assert(threwName,                                                      'sin operatorName lanza');

    let threwIdea = false;
    try { buildMatriuCohortProject({ operatorName: 'Alvaro' }); } catch(_) { threwIdea = true; }
    assert(threwIdea,                                                      'sin projectIdea lanza');

    // Build completo
    const out = buildMatriuCohortProject({
        operatorName:   'Alvaro Solache',
        operatorHandle: '@alvaro',
        projectIdea:    'Hortet de la Vall · cooperativa de productores',
    });
    assert(out.project && out.project.id.startsWith('proj-matriu-'),       'project id con prefix matriu');
    assert(out.project.sector_id === 'Q',                                  'sector Q');
    assert(out.project.matriuCohort === 0 && out.project.matriuMultiplier === 1.5, 'flags Matriu en project');
    assert(out.project.nombre.includes('Alvaro Solache') && out.project.nombre.includes('Cohort 0'), 'nombre con operator + Cohort 0');

    // kbNodes · 1 SOC + 6 SOPs + 1 wallet = 8
    assert(Array.isArray(out.kbNodes) && out.kbNodes.length === 8,         '8 nodos KB (1 SOC + 6 SOPs + 1 wallet)');
    assert(out.kbNodes[0].type === 'soc',                                  'primer nodo · SOC');
    assert(out.kbNodes[0].content.slug === 'matriu-tokenomic',             'SOC slug matriu-tokenomic');
    assert(out.kbNodes[0].content.rules.length === 4,                      'SOC tiene 4 reglas');

    const sopNodes = out.kbNodes.filter(n => n.type === 'sop');
    assert(sopNodes.length === 6,                                          '6 SOPs');
    sopNodes.forEach(s => {
        assert(s.content.kind === 'matriu-perk-sop',                       s.id + ' · kind matriu-perk-sop');
        assert(s.content.soc_ref === out.kbNodes[0].id,                    s.id + ' · soc_ref al SOC del proyecto');
        assert(s.content.tags.some(t => t === 'cohort:0'),                 s.id + ' · tag cohort:0');
        assert(s.content.tags.some(t => t === 'project:' + out.project.id), s.id + ' · tag project:{id}');
    });

    // El SOP de cohort-10sem tiene 10 steps · el resto 3
    const cohortSop = sopNodes.find(s => s.id.includes('cohort-10sem'));
    assert(cohortSop && cohortSop.content.steps.length === 10,             'SOP cohort-10sem · 10 steps semanales');
    const otroSop = sopNodes.find(s => s.id.includes('credits'));
    assert(otroSop && otroSop.content.steps.length === 3,                  'SOP credits · 3 steps');

    // Wallet · saldo 2000 + movement seed
    const wallet = out.kbNodes.find(n => n.type === 'wallet');
    assert(wallet && wallet.content.balanceEur === 2000,                   'wallet · 2.000€ inicial');
    assert(wallet.content.movements.length === 1,                          'wallet · 1 movement seed');
    assert(wallet.content.movements[0].kind === 'topup',                   'movement kind topup');
    assert(wallet.content.movements[0].source === 'matriu-cohort-0',       'movement source · matriu-cohort-0');
    assert(wallet.content.movements[0].balanceAfter === 2000,              'balanceAfter · 2000');

    // navigateTo
    assert(out.navigateTo === '/project/' + encodeURIComponent(out.project.id), 'navigateTo · /project/{id}');

    // Tags consistentes
    out.kbNodes.forEach(n => {
        const tags = (n.content?.tags || []);
        assert(tags.some(t => t.startsWith('project:')),                    n.id + ' · tag project:');
    });
}

// ─── MAT-002-G fase A · sosManifesto puro + helpers KB-bound (mock) ──
async function testSosManifesto() {
    const mod = await import('../core/sosManifesto.js?v=' + Date.now());
    const {
        SOS_MANIFESTO,
        buildManifestoNode, extractManifestoText, isDefaultManifesto,
        loadManifesto, saveManifesto, restoreDefaultManifesto, ensureManifestoSeeded,
    } = mod;

    // Constantes y forma del export
    assert(Object.isFrozen(SOS_MANIFESTO),                                'SOS_MANIFESTO frozen');
    assert(SOS_MANIFESTO.nodeId === 'sos-system-prompt-canonical',        'nodeId canónico');
    assert(SOS_MANIFESTO.nodeType === 'system_prompt',                    'nodeType system_prompt');
    assert(SOS_MANIFESTO.nodeKind === 'canonical-manifesto',              'nodeKind canonical-manifesto');
    assert(typeof SOS_MANIFESTO.defaultText === 'string' && SOS_MANIFESTO.defaultText.length > 200, 'defaultText no vacío');
    assert(SOS_MANIFESTO.defaultText.startsWith('Eres el agente inteligente del SOS V11'), 'defaultText canónico');

    // buildManifestoNode con default
    const nDef = buildManifestoNode();
    assert(nDef.id === SOS_MANIFESTO.nodeId,                              'build · id');
    assert(nDef.type === SOS_MANIFESTO.nodeType,                          'build · type');
    assert(nDef.content.kind === SOS_MANIFESTO.nodeKind,                  'build · content.kind');
    assert(nDef.content.body === SOS_MANIFESTO.defaultText,               'build · body=default');
    assert(nDef.content.isDefault === true,                               'build · isDefault=true');
    assert(Array.isArray(nDef.keywords) && nDef.keywords.includes('type:system_prompt'), 'build · keywords taxonómicos');

    // buildManifestoNode con texto custom
    const customTxt = 'Misión adaptada · operador X';
    const nCust = buildManifestoNode({ text: customTxt, createdBy: 'did:sos:abcd' });
    assert(nCust.content.body === customTxt,                              'build · body=custom');
    assert(nCust.content.isDefault === false,                             'build · isDefault=false con custom');
    assert(nCust.content.createdBy === 'did:sos:abcd',                    'build · createdBy se persiste');

    // text vacío o whitespace cae a default
    const nEmpty = buildManifestoNode({ text: '   ' });
    assert(nEmpty.content.body === SOS_MANIFESTO.defaultText,             'build · text whitespace → default');
    assert(nEmpty.content.isDefault === true,                             'build · whitespace · isDefault=true');

    // extractManifestoText
    assert(extractManifestoText(nDef) === SOS_MANIFESTO.defaultText,      'extract · default node');
    assert(extractManifestoText(null) === '',                             'extract · null → ""');
    assert(extractManifestoText({}) === '',                               'extract · sin content → ""');
    assert(extractManifestoText({ content: { body: 'X' } }) === 'X',      'extract · custom body');

    // isDefaultManifesto
    assert(isDefaultManifesto(SOS_MANIFESTO.defaultText) === true,        'isDefault · texto default');
    assert(isDefaultManifesto('  ' + SOS_MANIFESTO.defaultText + '  ') === true, 'isDefault · trim-aware');
    assert(isDefaultManifesto('otra cosa') === false,                     'isDefault · custom');
    assert(isDefaultManifesto(null) === false,                            'isDefault · null');

    // ── KB mock async ─────────────────────────────────────────────
    const mockKB = (() => {
        const store = new Map();
        return {
            getNode: async (id) => store.has(id) ? store.get(id) : null,
            upsert:  async (node) => {
                const merged = { ...node, updatedAt: Date.now(), createdAt: store.get(node.id)?.createdAt || Date.now() };
                store.set(node.id, merged);
                return merged;
            },
            _peek: () => store,
        };
    })();

    // load sin nodo previo · cae a default
    const lEmpty = await loadManifesto(mockKB);
    assert(lEmpty.exists === false,                                       'load · exists=false sin seed');
    assert(lEmpty.text === SOS_MANIFESTO.defaultText,                     'load · text=default sin seed');
    assert(lEmpty.isDefault === true,                                     'load · isDefault=true sin seed');

    // ensureManifestoSeeded crea nodo si no existe
    const seeded = await ensureManifestoSeeded(mockKB);
    assert(seeded && seeded.id === SOS_MANIFESTO.nodeId,                  'ensure · seed creado');
    assert(mockKB._peek().has(SOS_MANIFESTO.nodeId),                      'ensure · existe en KB tras seed');

    // ensure idempotente · no rescribe si ya existe
    const before = mockKB._peek().get(SOS_MANIFESTO.nodeId);
    const seeded2 = await ensureManifestoSeeded(mockKB);
    assert(seeded2 === before,                                            'ensure · idempotente · devuelve nodo existente');

    // saveManifesto con custom
    const savedCustom = await saveManifesto(mockKB, { text: 'Versión adaptada SOS' });
    assert(savedCustom.content.body === 'Versión adaptada SOS',           'save · custom persiste');
    const lAfter = await loadManifesto(mockKB);
    assert(lAfter.exists === true,                                        'load · exists=true tras save');
    assert(lAfter.text === 'Versión adaptada SOS',                        'load · text=custom tras save');
    assert(lAfter.isDefault === false,                                    'load · isDefault=false con custom');

    // restoreDefaultManifesto
    await restoreDefaultManifesto(mockKB);
    const lRestored = await loadManifesto(mockKB);
    assert(lRestored.text === SOS_MANIFESTO.defaultText,                  'restore · vuelve al default');
    assert(lRestored.isDefault === true,                                  'restore · isDefault=true');

    // Errors de uso · KB inválido
    let threwLoad = false;
    try { await loadManifesto({}); } catch (_) { threwLoad = true; }
    assert(threwLoad,                                                     'load · KB sin getNode lanza');

    let threwSave = false;
    try { await saveManifesto({ getNode: () => null }); } catch (_) { threwSave = true; }
    assert(threwSave,                                                     'save · KB sin upsert lanza');
}

// ─── UX-EDU-001 sprint A · didacticService puro ──────────────────
async function testDidacticService() {
    const mod = await import('../core/didacticService.js?v=' + Date.now());
    const { EDU_CONCEPTS, getConcept, listConcepts, renderExplainerBadge } = mod;

    // Catálogo
    assert(Object.isFrozen(EDU_CONCEPTS),                                 'EDU_CONCEPTS frozen');
    const ids = Object.keys(EDU_CONCEPTS);
    assert(ids.length >= 14,                                              'catálogo ≥14 conceptos');
    ['vna', 'triple-entry-accounting', 'slicing-pie', 'fair-fractal-tokenomics',
     'soc', 'sop', 'dtd', 'antigravity-engine', 'context-pruning',
     'folksonomy', 'taxonomy', 'smart-contract', 'sbt', 'cohort-0', 'econom-ia'
    ].forEach(id => assert(EDU_CONCEPTS[id], 'concepto canónico ' + id));

    // Cada concepto bien formado
    listConcepts().forEach(c => {
        assert(typeof c.id === 'string' && c.id.length > 0,               c.id + ' · id');
        assert(typeof c.headline === 'string' && c.headline.length > 0,   c.id + ' · headline');
        assert(typeof c.body === 'string' && c.body.length > 0,           c.id + ' · body');
        assert(c.body.length <= 240,                                       c.id + ' · body ≤240 chars');
        assert(Object.isFrozen(c),                                         c.id + ' · frozen');
    });

    // getConcept
    assert(getConcept('vna').id === 'vna',                                'getConcept · vna');
    assert(getConcept('inexistente') === null,                            'getConcept · null en miss');
    assert(getConcept(null) === null,                                     'getConcept · null en input null');
    assert(getConcept('') === null,                                       'getConcept · null en string vacío');

    // listConcepts
    const list = listConcepts();
    assert(Array.isArray(list) && list.length === ids.length,             'listConcepts · array completo');

    // renderExplainerBadge · concepto válido
    const html = renderExplainerBadge('vna');
    assert(typeof html === 'string' && html.length > 0,                   'render · html no vacío');
    assert(html.includes('class="sos-edu-badge'),                         'render · class badge');
    assert(html.includes('data-edu-concept="vna"'),                       'render · data-attr concepto');
    assert(html.includes('role="button"'),                                'render · role button');
    assert(html.includes('aria-haspopup="true"'),                         'render · aria-haspopup');
    assert(html.includes('tabindex="0"'),                                 'render · tabindex 0');
    assert(html.includes('Value Network Analysis'),                       'render · headline incluido');
    assert(html.includes('role="tooltip"'),                               'render · tooltip role');
    assert(html.includes('hidden'),                                       'render · tooltip hidden default');

    // renderExplainerBadge · concepto inexistente devuelve string vacío
    assert(renderExplainerBadge('no-existe') === '',                      'render · concepto inválido → ""');
    assert(renderExplainerBadge(null) === '',                             'render · null → ""');

    // renderExplainerBadge · showLabel
    const htmlLbl = renderExplainerBadge('triple-entry-accounting', { showLabel: true });
    assert(htmlLbl.includes('sos-edu-badge-label'),                       'render · showLabel injecta label');

    // renderExplainerBadge · escape HTML en cuerpos (defensivo)
    // Inyectamos un concepto custom mediante hack del runtime · NO mutamos EDU_CONCEPTS
    // (verificamos que el escape no rompe en chars normales)
    const htmlSlicing = renderExplainerBadge('slicing-pie');
    assert(!htmlSlicing.includes('<script'),                              'render · no scripts injection');

    // Linkref opcional
    const htmlVna = renderExplainerBadge('vna');
    assert(htmlVna.includes('sos-edu-tip-link'),                          'render · vna lleva linkRef');
    const htmlDtd = renderExplainerBadge('dtd');
    assert(!htmlDtd.includes('sos-edu-tip-link'),                         'render · dtd sin linkRef · no aparece link');

    // Size variants
    const htmlXs = renderExplainerBadge('sop', { size: 'xs' });
    assert(htmlXs.includes('sos-edu-size-xs'),                            'render · size xs class');
    const htmlMd = renderExplainerBadge('sop', { size: 'md' });
    assert(htmlMd.includes('sos-edu-size-md'),                            'render · size md class');
}

// ─── MAT-003 sprint A · critical108Roles + Pantheon Work ──────────
async function testCritical108Roles() {
    const mod = await import('../core/critical108Roles.js?v=' + Date.now());
    const {
        COHORT_0_TOTAL, OPERATIVE_SEATS, GUARDIAN_SEATS,
        OPERATIVE_DOMAIN_DISTRIBUTION,
        PANTHEON_TRIVALENT_LOGIC, PANTHEON_NATIVE_PRACTICES,
        PANTHEON_GUARDIANS, PROJECT_TYPES,
        getGuardianById, getGuardiansByDomain, getGuardiansByTrivalentLogic,
        getProjectTypeById,
        guardiansPendingKeywords, guardiansWithKeywords, coverageReport,
    } = mod;

    // Constantes Cohort 0
    assert(COHORT_0_TOTAL === 108,                                     'COHORT_0_TOTAL = 108');
    assert(OPERATIVE_SEATS === 96,                                     'OPERATIVE_SEATS = 96');
    assert(GUARDIAN_SEATS === 12,                                      'GUARDIAN_SEATS = 12');
    assert(OPERATIVE_SEATS + GUARDIAN_SEATS === COHORT_0_TOTAL,        '96 + 12 = 108');

    // Distribución por dominio · suma 96
    const sum = Object.values(OPERATIVE_DOMAIN_DISTRIBUTION).reduce((a, b) => a + b, 0);
    assert(sum === 96,                                                 'distribución por dominio suma 96 · got=' + sum);
    assert(OPERATIVE_DOMAIN_DISTRIBUTION.governance === 8,             'governance · 8');
    assert(OPERATIVE_DOMAIN_DISTRIBUTION.finance === 12,               'finance · 12');
    assert(OPERATIVE_DOMAIN_DISTRIBUTION.tech === 16,                  'tech · 16 (ajustado de 18)');
    assert(OPERATIVE_DOMAIN_DISTRIBUTION.operations === 12,            'operations · 12 (ajustado de 14)');

    // 10 prácticas nativas digitales
    assert(Object.isFrozen(PANTHEON_NATIVE_PRACTICES),                 'PANTHEON_NATIVE_PRACTICES frozen');
    assert(PANTHEON_NATIVE_PRACTICES.length === 10,                    '10 prácticas nativas digitales');
    assert(PANTHEON_NATIVE_PRACTICES.find(p => p.id === 'flujo-valor'),       'práctica flujo-valor');
    assert(PANTHEON_NATIVE_PRACTICES.find(p => p.id === 'reconocer-competencias'), 'práctica reconocer-competencias');

    // Lógica trivalente
    assert(Object.isFrozen(PANTHEON_TRIVALENT_LOGIC),                  'PANTHEON_TRIVALENT_LOGIC frozen');
    ['distinguir', 'fusionar', 'relacionar'].forEach(k => {
        assert(PANTHEON_TRIVALENT_LOGIC[k]?.id === k,                  'trivalente · ' + k);
    });

    // 12 Guardianes · estructura
    assert(Object.isFrozen(PANTHEON_GUARDIANS),                        'PANTHEON_GUARDIANS frozen');
    assert(PANTHEON_GUARDIANS.length === 12,                           '12 guardianes');
    const ids = PANTHEON_GUARDIANS.map(g => g.id);
    assert(new Set(ids).size === 12,                                   'IDs únicos');
    const nums = PANTHEON_GUARDIANS.map(g => g.pantheonNum).sort((a, b) => a - b);
    assert(JSON.stringify(nums) === JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12]), 'pantheonNum 1..12');

    // 12 nombres canónicos · sin género asumido (cualquiera puede ser cualquier guardián)
    ['afrodita', 'apolo', 'atenea', 'demeter', 'dionisio', 'hebe',
     'hefesto', 'hera', 'hermes', 'hestia', 'poseidon', 'zeus'
    ].forEach(id => {
        assert(PANTHEON_GUARDIANS.find(g => g.id === id),              'guardián canónico ' + id);
    });

    // 12/12 con keywords (8 oficiales del PDF + 4 borradores interpretativos)
    assert(guardiansWithKeywords().length === 12,                      '12 guardianes con keywords');
    const { guardiansWithOfficialKeywords, guardiansWithDraftKeywords } = mod;
    assert(guardiansWithOfficialKeywords().length === 8,               '8 guardianes con keywords oficiales (PDF)');
    assert(guardiansWithDraftKeywords().length === 4,                  '4 guardianes con keywords __draft');
    assert(guardiansPendingKeywords().length === 4,                    '4 guardianes pending cuestionario oficial');
    const draftIds = guardiansWithDraftKeywords().map(g => g.id).sort();
    assert(JSON.stringify(draftIds) === JSON.stringify(['hefesto','hera','poseidon','zeus']),
                                                                       '__draft = hefesto/hera/poseidon/zeus');

    // Keywords literales del PDF · spot-check
    const afrodita = getGuardianById('afrodita');
    assert(afrodita.keywords.includes('estética'),                     'Afrodita · estética');
    assert(afrodita.keywords.includes('seducción'),                    'Afrodita · seducción');
    const apolo = getGuardianById('apolo');
    assert(apolo.keywords.includes('conocimiento teórico'),            'Apolo · conocimiento teórico');
    assert(apolo.keywords.includes('predicción'),                      'Apolo · predicción');
    const atenea = getGuardianById('atenea');
    assert(atenea.keywords.includes('estrategia defensiva y ofensiva'), 'Atenea · estrategia');
    assert(atenea.keywords.includes('civismo'),                        'Atenea · civismo');
    const hestia = getGuardianById('hestia');
    assert(hestia.keywords.includes('alma'),                           'Hestia · alma');
    assert(hestia.keywords.includes('centro'),                         'Hestia · centro');
    const hermes = getGuardianById('hermes');
    assert(hermes.keywords.includes('argucia'),                        'Hermes · argucia');
    assert(hermes.keywords.includes('intercambio'),                    'Hermes · intercambio');

    // Lógica trivalente del PDF (figura 4)
    const distLogic = getGuardiansByTrivalentLogic('distinguir').map(g => g.id).sort();
    assert(JSON.stringify(distLogic) === JSON.stringify(['apolo','atenea','hebe','poseidon']),
                                                                       'distinguir = apolo,atenea,hebe,poseidon (PDF fig.4)');
    const fusLogic = getGuardiansByTrivalentLogic('fusionar').map(g => g.id).sort();
    assert(JSON.stringify(fusLogic) === JSON.stringify(['demeter','dionisio','hefesto','hera']),
                                                                       'fusionar = demeter,dionisio,hefesto,hera (PDF fig.4)');
    const relLogic = getGuardiansByTrivalentLogic('relacionar').map(g => g.id).sort();
    assert(JSON.stringify(relLogic) === JSON.stringify(['afrodita','hermes','hestia','zeus']),
                                                                       'relacionar = afrodita,hermes,hestia,zeus (PDF fig.4)');

    // Guardianes por dominio
    assert(getGuardiansByDomain('governance').length === 2,            'governance · 2 guardianes (atenea + zeus)');
    assert(getGuardiansByDomain('community').length === 2,             'community · 2 guardianes (hermes + hestia)');
    assert(getGuardiansByDomain('finance').length === 1,               'finance · 1 guardián (poseidon)');
    assert(getGuardiansByDomain('tech').length === 1,                  'tech · 1 guardián (hefesto)');
    assert(getGuardiansByDomain('inexistente').length === 0,           'dominio inexistente · []');

    // Cada guardián tiene domain en la lista canónica
    const validDomains = Object.keys(OPERATIVE_DOMAIN_DISTRIBUTION);
    PANTHEON_GUARDIANS.forEach(g => {
        assert(validDomains.includes(g.domain),                        g.id + ' · domain canónico (' + g.domain + ')');
    });

    // 12 tipos de proyecto
    assert(Object.isFrozen(PROJECT_TYPES),                             'PROJECT_TYPES frozen');
    assert(PROJECT_TYPES.length === 12,                                '12 tipos de proyecto');
    const projectIds = PROJECT_TYPES.map(t => t.id);
    assert(new Set(projectIds).size === 12,                            'IDs únicos en PROJECT_TYPES');
    assert(getProjectTypeById('comunitat-autosuficient'),              'comunitat-autosuficient encontrado');
    assert(getProjectTypeById('dao-web3'),                             'dao-web3 encontrado');
    assert(getProjectTypeById('cooperativa-cures'),                    'cooperativa-cures encontrado');
    assert(getProjectTypeById('inexistente') === null,                 'tipo inexistente · null');

    // Coverage report agregado
    const rep = coverageReport();
    assert(rep.cohort0Total === 108,                                   'report · cohort0Total 108');
    assert(rep.operativeSeats === 96,                                  'report · operativeSeats 96');
    assert(rep.guardianSeats === 12,                                   'report · guardianSeats 12');
    assert(rep.operativeDomainSum === 96,                              'report · suma de dominios = 96');
    assert(rep.guardiansPending.length === 4,                          'report · 4 pending');
    assert(rep.guardiansReady.length === 12,                           'report · 12 ready (8 oficial + 4 __draft)');
    assert(rep.projectTypes === 12,                                    'report · 12 project types');
    assert(rep.domainCoverage.governance.guardians.length === 2,       'report · governance 2 guardianes');
}

// ─── MAT-003 sprint B · skillTaxonomy + coverageReport ────────────
async function testSkillTaxonomy() {
    const mod = await import('../core/skillTaxonomy.js?v=' + Date.now());
    const {
        SKILL_TAXONOMY, SKILL_TIERS,
        getSkillById, listSkills, skillsByDomain, skillsByTier, skillsByGuardian, skillsByPractice,
        coverageReport,
    } = mod;

    // Estructura
    assert(Object.isFrozen(SKILL_TAXONOMY),                                'SKILL_TAXONOMY frozen');
    assert(SKILL_TAXONOMY.length === 90,                                   '90 skills · ' + SKILL_TAXONOMY.length);
    assert(Object.isFrozen(SKILL_TIERS) && SKILL_TIERS.length === 3,       'SKILL_TIERS · 3 tiers');

    // Cada skill bien formado
    SKILL_TAXONOMY.forEach(s => {
        assert(typeof s.id === 'string' && /^[a-z][a-z0-9-]+$/.test(s.id),  s.id + ' · id kebab');
        assert(typeof s.label === 'string' && s.label.length > 0,           s.id + ' · label');
        assert(typeof s.domain === 'string',                                 s.id + ' · domain');
        assert(SKILL_TIERS.includes(s.tier),                                 s.id + ' · tier válido');
        assert(Array.isArray(s.guardianAffinity) && s.guardianAffinity.length >= 1, s.id + ' · ≥1 guardian');
        assert(Array.isArray(s.relatedPractices) && s.relatedPractices.length >= 1, s.id + ' · ≥1 práctica');
        assert(Object.isFrozen(s),                                            s.id + ' · frozen');
    });

    // IDs únicos
    const ids = SKILL_TAXONOMY.map(s => s.id);
    assert(new Set(ids).size === ids.length,                              'IDs únicos');

    // Distribución por dominio
    assert(skillsByDomain('governance').length === 8,                     'governance · 8');
    assert(skillsByDomain('finance').length    === 10,                    'finance · 10');
    assert(skillsByDomain('tech').length       === 14,                    'tech · 14');
    assert(skillsByDomain('design').length     === 8,                     'design · 8');
    assert(skillsByDomain('operations').length === 11,                    'operations · 11');
    assert(skillsByDomain('community').length  === 10,                    'community · 10');
    assert(skillsByDomain('legal').length      === 6,                     'legal · 6');
    assert(skillsByDomain('ecology').length    === 8,                     'ecology · 8');
    assert(skillsByDomain('education').length  === 8,                     'education · 8');
    assert(skillsByDomain('culture').length    === 7,                     'culture · 7');

    // Helpers
    assert(getSkillById('vision-strategic')?.domain === 'governance',     'getSkillById · vision');
    assert(getSkillById('no-existe') === null,                            'getSkillById · null miss');
    assert(getSkillById(null) === null,                                    'getSkillById · null input');
    assert(listSkills().length === 90,                                     'listSkills · 90');
    assert(skillsByTier('master').length >= 10,                            'master tier ≥10');
    assert(skillsByTier('foundation').length >= 5,                         'foundation tier ≥5');
    assert(skillsByGuardian('zeus').length >= 1,                           'zeus skills ≥1');
    assert(skillsByGuardian('demeter').length >= 1,                        'demeter skills ≥1');
    assert(skillsByPractice('flujo-valor').length >= 1,                    'flujo-valor skills ≥1');
    assert(skillsByPractice('memes-campanas').length >= 1,                 'memes-campanas skills ≥1');

    // coverageReport · vacío
    const r0 = coverageReport();
    assert(r0.totalSkills === 90,                                          'report · totalSkills=90');
    assert(r0.coveredCount === 0,                                           'report · 0 cubiertos vacío');
    assert(r0.coveragePct === 0,                                            'report · pct=0 vacío');
    assert(r0.gaps.length === 90,                                           'report · 90 gaps vacío');
    assert(r0.resilient.length === 0,                                       'report · 0 resilient vacío');
    assert(r0.fragile.length === 0,                                         'report · 0 fragile vacío');

    // coverageReport · con plazas (incluye ID inexistente · debe ignorarse)
    const swarmSkills = [
        { skillId: 'vision-strategic', seatId: 's1' },
        { skillId: 'vision-strategic', seatId: 's2' },
        { skillId: 'vision-strategic', seatId: 's3' },  // ≥3 → resilient
        { skillId: 'slicing-pie',      seatId: 's4' },  // 1 → fragile
        { skillId: 'system-architecture', seatId: 's5' },
        { skillId: 'system-architecture', seatId: 's6' }, // 2 (no fragile, no resilient)
        { skillId: 'no-existe',        seatId: 's99' },  // ignorar
    ];
    const r1 = coverageReport({ swarmSkills });
    assert(r1.coveredCount === 3,                                          'report · 3 cubiertos');
    assert(r1.resilient.includes('vision-strategic'),                      'report · vision resilient');
    assert(r1.fragile.includes('slicing-pie'),                             'report · slicing-pie fragile');
    assert(!r1.fragile.includes('system-architecture'),                    'report · 2 plazas no fragile');
    assert(!r1.resilient.includes('system-architecture'),                  'report · 2 plazas no resilient');
    assert(r1.gaps.length === 87,                                          'report · 87 gaps restantes');
    assert(r1.byDomain.governance.covered === 1,                           'governance · 1 cubierto');
    assert(r1.byDomain.tech.covered === 1,                                 'tech · 1 cubierto');
    assert(r1.byDomain.governance.gaps.length === 7,                       'governance · 7 gaps');
    assert(typeof r1.byTier.master.pct === 'number',                       'byTier.master.pct');
    assert(typeof r1.byGuardian.zeus.pct === 'number',                     'byGuardian.zeus.pct');

    // Robustez · input inválido
    const r2 = coverageReport({ swarmSkills: 'not an array' });
    assert(r2.coveredCount === 0,                                           'input no-array · graceful');
}

// ─── MAT-003 sprint C · swarmMatchmaker ────────────────────────────
async function testSwarmMatchmaker() {
    const mod = await import('../core/swarmMatchmaker.js?v=' + Date.now());
    const { buildSwarmMatchPrompt, parseSwarmMatchResponse, applyMatchToSeats, scoreSwarmCoverage, buildSwarmTeamForProject } = mod;

    // Errores de input
    let threw = false;
    try { buildSwarmMatchPrompt(); } catch (_) { threw = true; }
    assert(threw, 'prompt sin input lanza');

    threw = false;
    try { buildSwarmMatchPrompt({ project: {}, projectTypeId: 'comunitat-autosuficient', requiredRoles: [{id:'r1',label:'R1',domain:'tech'}], swarmSeats:[{id:'s1'}] }); } catch (_) { threw = true; }
    assert(threw, 'sin project.id+name lanza');

    threw = false;
    try { buildSwarmMatchPrompt({ project: { id:'p1', name:'P1' }, projectTypeId: 'inexistente', requiredRoles:[{id:'r1',label:'R1',domain:'tech'}], swarmSeats:[{id:'s1'}] }); } catch (_) { threw = true; }
    assert(threw, 'projectTypeId inválido lanza');

    threw = false;
    try { buildSwarmMatchPrompt({ project: { id:'p1', name:'P1' }, projectTypeId:'comunitat-autosuficient', requiredRoles:[], swarmSeats:[{id:'s1'}] }); } catch (_) { threw = true; }
    assert(threw, 'requiredRoles vacío lanza');

    threw = false;
    try { buildSwarmMatchPrompt({ project: { id:'p1', name:'P1' }, projectTypeId:'comunitat-autosuficient', requiredRoles:[{id:'r1',label:'R1',domain:'tech'}], swarmSeats:[] }); } catch (_) { threw = true; }
    assert(threw, 'swarmSeats vacío lanza');

    // Happy path · prompt
    const built = buildSwarmMatchPrompt({
        project: { id: 'proj-1', name: 'Hortet de la Vall', description: 'Coop de productores', sector: 'A', phase: 'design' },
        projectTypeId: 'comunitat-autosuficient',
        requiredRoles: [
            { id: 'pages-agricola',     label: 'Pagès',     domain: 'ecology' },
            { id: 'tresorera',          label: 'Tresorera', domain: 'finance' },
            { id: 'facilitador-comu',   label: 'Facilita',  domain: 'community' },
        ],
        swarmSeats: [
            { id: 'seat-1', displayName: 'Aitana R.', skillsDeclared: ['regenerative-agriculture','seed-banking'], guardianOf: 'demeter' },
            { id: 'seat-2', displayName: 'Núria B.',  skillsDeclared: ['triple-entry-accounting','treasury-management'], guardianOf: 'poseidon' },
            { id: 'seat-3', displayName: 'Jordi T.',  skillsDeclared: ['facilitation','meeting-design'], guardianOf: 'hermes' },
        ],
    });
    assert(built.systemPrompt.includes('Cohort 0 de Matriu'),                'systemPrompt menciona cohort 0');
    assert(built.userPrompt.includes('Hortet de la Vall'),                    'userPrompt · proyecto');
    assert(built.userPrompt.includes('demeter'),                              'userPrompt · catálogo guardianes');
    assert(built.userPrompt.includes('regenerative-agriculture'),             'userPrompt · catálogo skills');
    assert(built.userPrompt.includes('Aitana R.'),                            'userPrompt · plazas');
    assert(built.responseFormat === 'json_object',                            'responseFormat json_object');
    assert(built.temperature === 0.2,                                          'temperature baja');
    assert(built.meta.projectId === 'proj-1',                                  'meta.projectId');
    assert(built.meta.rolesCount === 3 && built.meta.seatsCount === 3,         'meta counts');

    // Parser · happy
    const sample = JSON.stringify({
        matches: [
            { roleId: 'pages-agricola',   seatId: 'seat-1', primary: true,  fit: 0.95, rationale: 'Demeter', skillsUsed: ['regenerative-agriculture'] },
            { roleId: 'tresorera',        seatId: 'seat-2', primary: true,  fit: 0.88, rationale: 'Treasury', skillsUsed: ['treasury-management'] },
            { roleId: 'facilitador-comu', seatId: 'seat-3', primary: true,  fit: 0.91, rationale: 'Hermes', skillsUsed: ['facilitation'] },
            { roleId: 'pages-agricola',   seatId: 'seat-3', primary: false, fit: 0.5,  rationale: 'backup', skillsUsed: [] },
        ],
        gaps: [],
        overallRationale: 'Cobertura completa 3/3.',
    });
    const parsed = parseSwarmMatchResponse(sample);
    assert(parsed.matches.length === 4,                                       '4 matches parseados');
    assert(parsed.gaps.length === 0,                                          'gaps vacío');
    assert(parsed.overallRationale.length > 0,                                'overallRationale presente');

    // Parser robusto · campos malos
    const messy = parseSwarmMatchResponse({
        matches: [
            { roleId: 'r1', seatId: 's1', primary: true, fit: 0.5 },
            { roleId: null, seatId: 's2' },                                   // inválido
            { roleId: 'r3', seatId: 's3', fit: 1.5 },                         // clamp 1
            { roleId: 'r4', seatId: 's4', fit: -0.3 },                        // clamp 0
        ],
        gaps: ['r5', null, 'r6'],
        overallRationale: 'x'.repeat(800),
    });
    assert(messy.matches.length === 3,                                        'parser · roleId null filtrado');
    assert(messy.matches.find(x => x.roleId === 'r3').fit === 1,              'fit clamp 1.5 → 1');
    assert(messy.matches.find(x => x.roleId === 'r4').fit === 0,              'fit clamp -0.3 → 0');
    assert(messy.gaps.length === 2,                                            'gaps · null filtrado');
    assert(messy.overallRationale.length === 600,                              'overallRationale 600 chars max');

    let parseThrew = false;
    try { parseSwarmMatchResponse('not json'); } catch (_) { parseThrew = true; }
    assert(parseThrew,                                                         'parser · invalid JSON lanza');

    // applyMatchToSeats · resuelve conflicto primario
    const conflict = [
        { roleId: 'r1', seatId: 'sX', primary: true, fit: 0.9 },
        { roleId: 'r2', seatId: 'sX', primary: true, fit: 0.95 },
        { roleId: 'r3', seatId: 'sX', primary: true, fit: 0.7 },
        { roleId: 'r4', seatId: 'sX', primary: false, fit: 0.6 },
        { roleId: 'r5', seatId: 'sX', primary: false, fit: 0.5 },
        { roleId: 'r6', seatId: 'sX', primary: false, fit: 0.4 },
    ];
    const reconciled = applyMatchToSeats(conflict, { maxSecondaryRoles: 2 });
    const primaries = reconciled.filter(x => x.seatId === 'sX' && x.primary);
    assert(primaries.length === 1,                                             '1 solo primario por seat');
    assert(primaries[0].roleId === 'r2',                                       'primario es el de fit más alto');
    const secondaries = reconciled.filter(x => x.seatId === 'sX' && !x.primary);
    assert(secondaries.length === 2,                                            'max 2 secundarios');

    // scoreSwarmCoverage
    const required = [
        { id: 'pages-agricola',   label:'p', domain:'ecology' },
        { id: 'tresorera',        label:'t', domain:'finance' },
        { id: 'facilitador-comu', label:'f', domain:'community' },
        { id: 'huerfano',         label:'h', domain:'culture' },
    ];
    const scored = scoreSwarmCoverage(parsed.matches, required);
    assert(scored.coveredRoles === 3 && scored.totalRoles === 4 && scored.pct === 75, 'cobertura 3/4 · 75%');
    assert(scored.byRole['huerfano'].primary === 0,                            'huerfano sin primary');
    const empty = scoreSwarmCoverage([], []);
    assert(empty.pct === 0 && empty.totalRoles === 0,                          'score vacío gracioso');

    // buildSwarmTeamForProject · mock orchestrator
    let mainThrew = false;
    try { await buildSwarmTeamForProject({}); } catch (_) { mainThrew = true; }
    assert(mainThrew, 'buildSwarmTeamForProject sin orchestrator lanza');

    const mockOrch = {
        callLLM: async () => ({
            text: JSON.stringify({
                matches: [
                    { roleId: 'pages-agricola',   seatId: 'seat-1', primary: true, fit: 0.95, rationale: 'Demeter', skillsUsed: ['regenerative-agriculture'] },
                    { roleId: 'tresorera',        seatId: 'seat-2', primary: true, fit: 0.90, rationale: 'Poseidon', skillsUsed: ['treasury-management'] },
                    { roleId: 'facilitador-comu', seatId: 'seat-3', primary: true, fit: 0.88, rationale: 'Hermes', skillsUsed: ['facilitation'] },
                ],
                gaps: [],
                overallRationale: 'Cobertura completa.',
            }),
            provider: 'anthropic',
            usage: { totalTokens: 1440 },
            costUSD: 0.012,
        }),
    };
    const team = await buildSwarmTeamForProject({
        project: { id: 'proj-1', name: 'Hortet' },
        projectTypeId: 'comunitat-autosuficient',
        requiredRoles: [
            { id: 'pages-agricola',   label:'p', domain:'ecology' },
            { id: 'tresorera',        label:'t', domain:'finance' },
            { id: 'facilitador-comu', label:'f', domain:'community' },
        ],
        swarmSeats: [
            { id: 'seat-1', skillsDeclared: ['regenerative-agriculture'] },
            { id: 'seat-2', skillsDeclared: ['treasury-management'] },
            { id: 'seat-3', skillsDeclared: ['facilitation'] },
        ],
        orchestrator: mockOrch,
    });
    assert(team.matches.length === 3,                                          'team · 3 matches');
    assert(team.coverage.pct === 100,                                          'team · 100%');
    assert(team.telemetry.provider === 'anthropic',                            'team · provider tracked');
    assert(team.telemetry.tokens.totalTokens === 1440,                          'team · tokens tracked');
    assert(typeof team.telemetry.latencyMs === 'number',                       'team · latency tracked');
    assert(team.promptMeta.projectId === 'proj-1',                              'team · promptMeta');
}

// ─── MAT-003 sprint E · bootstrapTemplates · 12 plantillas con seed ──
async function testBootstrapTemplates() {
    const m = await import('../core/bootstrapTemplates.js?v=' + Date.now());
    const c = await import('../core/critical108Roles.js?v=' + Date.now());
    const {
        PROJECT_BOOTSTRAP_TEMPLATES, PHASES,
        getBootstrapTemplate, listAllBootstrapTemplates,
        expectedSopsCountFor, expectedWeeksToOperateFor,
        validateBootstrapTemplate, bootstrapMapForProject, bootstrapStats,
    } = m;

    // Estructura
    assert(Object.isFrozen(PROJECT_BOOTSTRAP_TEMPLATES),                   'TEMPLATES frozen');
    assert(PROJECT_BOOTSTRAP_TEMPLATES.length === 12,                      '12 templates');
    assert(Object.isFrozen(PHASES) && PHASES.length === 4,                 '4 PHASES frozen');
    ['design','build','operate','ledger'].forEach(p => assert(PHASES.includes(p), 'phase ' + p));

    // 1:1 con PROJECT_TYPES
    const ptIds  = c.PROJECT_TYPES.map(pt => pt.id).sort();
    const tplIds = PROJECT_BOOTSTRAP_TEMPLATES.map(t => t.typeId).sort();
    assert(JSON.stringify(ptIds) === JSON.stringify(tplIds),               '12 templates 1:1 con PROJECT_TYPES');

    // Cada plantilla bien estructurada
    for (const t of PROJECT_BOOTSTRAP_TEMPLATES) {
        assert(validateBootstrapTemplate(t),                                t.typeId + ' · valid');
        assert(t.valueMapSeed.roles.length >= 4,                            t.typeId + ' · ≥4 roles');
        assert(t.valueMapSeed.transactions.length >= 5,                     t.typeId + ' · ≥5 tx');
        assert(t.bootstrapSops.length >= 5,                                  t.typeId + ' · ≥5 SOPs');
        assert(t.requiredGuardians.length >= 3,                              t.typeId + ' · ≥3 guardians');
        assert(typeof t.narrative === 'string' && t.narrative.length > 30,   t.typeId + ' · narrative');
        // Referential integrity
        const roleIds = new Set(t.valueMapSeed.roles.map(r => r.id));
        for (const tr of t.valueMapSeed.transactions) {
            assert(roleIds.has(tr.from) && roleIds.has(tr.to),               t.typeId + '·' + tr.id + ' refs');
            assert(PHASES.includes(tr.phase),                                t.typeId + '·' + tr.id + ' phase');
            assert(typeof tr.sequence_order === 'number',                    t.typeId + '·' + tr.id + ' seq_order');
        }
        // Phases en SOPs válidas
        for (const sop of t.bootstrapSops) {
            assert(PHASES.includes(sop.phase),                                t.typeId + '·' + sop.id + ' sop phase');
        }
    }

    // Helpers
    assert(getBootstrapTemplate('comunitat-autosuficient')?.typeId === 'comunitat-autosuficient', 'getBootstrap happy');
    assert(getBootstrapTemplate('xxx') === null,                            'getBootstrap miss → null');
    assert(getBootstrapTemplate(null) === null,                              'getBootstrap null input');
    assert(listAllBootstrapTemplates().length === 12,                       'listAll · 12');

    const expSops = expectedSopsCountFor('comunitat-autosuficient');
    assert(expSops.min === 8 && expSops.max === 12 && expSops.midpoint === 10, 'expSops 8-12 mid 10');
    const expWks = expectedWeeksToOperateFor('comunitat-autosuficient');
    assert(expWks.min === 4 && expWks.max === 8,                             'expWeeks 4-8');
    assert(expectedSopsCountFor('xxx') === null,                             'expSops · null miss');

    // bootstrapMapForProject · errors
    let threwBoot = false;
    try { bootstrapMapForProject({ typeId: 'xxx', projectId: 'p1' }); } catch (_) { threwBoot = true; }
    assert(threwBoot,                                                        'boot · type inválido lanza');
    threwBoot = false;
    try { bootstrapMapForProject({ typeId: 'comunitat-autosuficient' }); } catch (_) { threwBoot = true; }
    assert(threwBoot,                                                        'boot · sin projectId lanza');

    // bootstrapMapForProject · happy path
    const seed = bootstrapMapForProject({ typeId: 'comunitat-autosuficient', projectId: 'proj-test', multiplier: 1.5 });
    assert(seed.roles.length === 5,                                          'seed · 5 roles');
    assert(seed.transactions.length === 6,                                   'seed · 6 tx');
    assert(seed.sopsBootstrap.length === 8,                                  'seed · 8 sops');
    assert(seed.requiredGuardians.length === 4,                              'seed · 4 guardians');
    assert(seed.sectorAffinity.length === 3,                                 'seed · 3 sectors');
    assert(seed.roles[0].id.startsWith('proj-test::role::'),                 'seed · roles namespaced');
    assert(seed.roles[0].baseId === 'pages',                                  'seed · baseId conservado');
    assert(seed.roles[0].projectId === 'proj-test',                           'seed · projectId en role');
    assert(seed.transactions[0].id.startsWith('proj-test::tx::'),            'seed · tx namespaced');
    assert(seed.transactions[0].from.startsWith('proj-test::role::'),         'seed · from remap');
    assert(seed.transactions[0].to.startsWith('proj-test::role::'),           'seed · to remap');
    assert(seed.sopsBootstrap[0].id.startsWith('proj-test::sop::'),           'seed · sop namespaced');
    assert(seed.sopsBootstrap[0].multiplier === 1.5,                          'seed · multiplier ×1.5 aplicado');
    assert(typeof seed.narrative === 'string',                                'seed · narrative presente');

    // validateBootstrapTemplate · falsy
    assert(validateBootstrapTemplate(null) === false,                         'validate null');
    assert(validateBootstrapTemplate({}) === false,                           'validate empty');
    assert(validateBootstrapTemplate({ typeId: 'xxx' }) === false,            'validate type miss');

    // bootstrapStats
    const stats = bootstrapStats();
    assert(stats.totalTemplates === 12,                                       'stats · 12');
    assert(stats.totalSeedRoles >= 50,                                        'stats · roles >= 50');
    assert(stats.totalSeedTransactions >= 60,                                  'stats · tx >= 60');
    assert(stats.totalBootstrapSops >= 60,                                     'stats · sops >= 60');
    assert(stats.coveredProjectTypes.length === 12,                            'stats · cobertura 12 types');
}

// ─── MAT-003 sprint F · cohortSeatService · puro ──────────────────
async function testCohortSeatService() {
    const m = await import('../core/cohortSeatService.js?v=' + Date.now());
    const { buildSeedSeats, buildSeatNode, extractSwarmInput, buildSwarmAssignmentNode } = m;

    // buildSeedSeats
    assert(buildSeedSeats(3).length === 3,                                'buildSeedSeats · 3');
    assert(buildSeedSeats(5).length === 5,                                'buildSeedSeats · 5');
    assert(buildSeedSeats(99).length === 5,                               'buildSeedSeats · clamp 5');
    assert(buildSeedSeats(0).length === 0,                                'buildSeedSeats · 0');
    assert(buildSeedSeats(-3).length === 0,                                'buildSeedSeats · negativo → 0');

    // buildSeatNode
    const seat = buildSeedSeats(5)[0];
    const node = buildSeatNode(seat);
    assert(node.id === seat.id,                                            'buildSeatNode · id');
    assert(node.type === 'cohort_seat',                                     'buildSeatNode · type');
    assert(node.content.kind === 'cohort-seat',                             'buildSeatNode · kind');
    assert(node.content.guardianOf === 'demeter',                           'buildSeatNode · guardianOf');
    assert(node.keywords.includes('type:cohort_seat'),                      'keywords · type');
    assert(node.keywords.includes('guardianOf:demeter'),                    'keywords · guardianOf');
    assert(node.keywords.some(k => k.startsWith('skill:')),                 'keywords · skills');

    let threw = false;
    try { buildSeatNode({}); } catch(_) { threw = true; }
    assert(threw,                                                          'buildSeatNode · sin id lanza');

    // extractSwarmInput
    const projectNodes = [
        { id: 'p1::bootstrap-meta', type: 'project_bootstrap', content: { typeId: 'comunitat-autosuficient', sectorAffinity: ['A','N','Q'] } },
        { id: 'p1::role::pages',    type: 'role', content: { kind: 'bootstrap-role', label: 'Pagès', guardianAffinity: ['demeter'] } },
        { id: 'p1::role::tresorera',type: 'role', content: { kind: 'bootstrap-role', label: 'Tresorera', guardianAffinity: ['poseidon'] } },
        { id: 'p1::sop::xxx',       type: 'sop', content: { kind: 'bootstrap-sop' } },
    ];
    const seatNodes = [
        { id: 's1', type: 'cohort_seat', content: { displayName: 'A', skillsDeclared: ['x'], status: 'available' } },
        { id: 's2', type: 'cohort_seat', content: { displayName: 'B', skillsDeclared: ['y'], status: 'busy' } },
    ];
    const swarm = extractSwarmInput({ projectNodes, seatNodes });
    assert(swarm.requiredRoles.length === 2,                                'extractSwarmInput · 2 roles');
    assert(swarm.swarmSeats.length === 1,                                   'extractSwarmInput · 1 seat (busy filtrado)');
    assert(swarm.bootstrapMeta?.typeId === 'comunitat-autosuficient',       'extractSwarmInput · meta typeId');
    assert(swarm.projectTypeId === 'comunitat-autosuficient',               'extractSwarmInput · projectTypeId');
    assert(swarm.requiredRoles[0].domain === 'ecology',                     'inferDomain · demeter → ecology');
    assert(swarm.requiredRoles[1].domain === 'finance',                     'inferDomain · poseidon → finance');

    const empty = extractSwarmInput();
    assert(empty.requiredRoles.length === 0 && empty.swarmSeats.length === 0, 'extractSwarmInput vacío');

    // buildSwarmAssignmentNode
    const an = buildSwarmAssignmentNode({
        projectId: 'p1',
        match: { roleId: 'r1', seatId: 's1', primary: true, fit: 0.9, rationale: 'why', skillsUsed: ['k'] },
    });
    assert(an.type === 'swarm_assignment',                                  'assignment type');
    assert(an.id.includes('::P'),                                            'assignment primary suffix');
    assert(an.content.primary === true,                                     'assignment primary flag');
    assert(an.keywords.includes('rank:primary'),                             'rank:primary keyword');
    assert(an.keywords.includes('role:r1'),                                  'role keyword');

    const asec = buildSwarmAssignmentNode({
        projectId: 'p1',
        match: { roleId: 'r2', seatId: 's2', primary: false, fit: 0.5 },
    });
    assert(asec.id.includes('::S'),                                          'assignment secondary suffix');
    assert(asec.keywords.includes('rank:secondary'),                         'rank:secondary keyword');

    let threwA = false;
    try { buildSwarmAssignmentNode({}); } catch(_) { threwA = true; }
    assert(threwA,                                                           'buildSwarmAssignmentNode sin args lanza');
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
    { name: 'H8.1 · mindGraphService puro',                       fn: testMindGraphService },
    { name: 'KM-001 sprint C · contextPruner puro',               fn: testContextPruner },
    { name: 'MKT-001 sprint C1 · walletService puro',             fn: testWalletService },
    { name: 'MKT-001 sprint D · savingsService puro',             fn: testSavingsService },
    { name: 'H_ANIM_001 sprint A · flowAnimationService puro',    fn: testFlowAnimationService },
    { name: 'MAT-002-A · matriuTemplate puro',                    fn: testMatriuTemplate },
    { name: 'MAT-002-G fase A · sosManifesto puro + KB mock',     fn: testSosManifesto },
    { name: 'UX-EDU-001 sprint A · didacticService puro',         fn: testDidacticService },
    { name: 'MAT-003 sprint A · critical108Roles + Pantheon Work', fn: testCritical108Roles },
    { name: 'MAT-003 sprint B · skillTaxonomy + coverageReport',  fn: testSkillTaxonomy },
    { name: 'MAT-003 sprint C · swarmMatchmaker (matchmaker IA)', fn: testSwarmMatchmaker },
    { name: 'MAT-003 sprint E · bootstrapTemplates (12 plantillas)', fn: testBootstrapTemplates },
    { name: 'MAT-003 sprint F · cohortSeatService (CRUD + extract)', fn: testCohortSeatService }
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