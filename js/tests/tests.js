
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
    assert(socs.some(s => s.slug === 'proyecto-custom'),              'listSocs() incluye proyecto-custom (stub)');
    assert(socs.some(s => s.slug === 'charla-conferencia'),           'listSocs() incluye charla-conferencia (stub)');

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
    assert(sopsList.some(s => s.slug === 'proyecto-custom'),          'listSops() incluye proyecto-custom (stub)');
    assert(sopsList.some(s => s.slug === 'charla-conferencia'),       'listSops() incluye charla-conferencia (stub)');

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

// ─── Runner ──────────────────────────────────────────────────────
const SUITE = [
    { name: 'H1.1 · KB Mind-as-Graph round-trip',                 fn: testKbMindAsGraph },
    { name: 'H1.3 · Export/Import firmado ECDSA P-256',           fn: testProjectIO },
    { name: 'H1.5 · KnowledgeLoader carga SOPs/SOCs y projectId', fn: testKnowledgeLoaderSocsSops },
    { name: 'H2.1 · Workshops · CRUD + cambio de estado',         fn: testWorkshopsCrud },
    { name: 'H2.3 · WorkshopsView · prompt builder propuesta IA', fn: testWorkshopsProposalPromptBuilder },
    { name: 'H2.5 · WorkshopsView · prompt builder informe IA',   fn: testWorkshopsReportPromptBuilder },
    { name: 'H2.6 · Selector tipo servicio · prompts dinámicos',  fn: testWorkshopsServiceTypeSelector },
    { name: 'H7.1 · Kanban Work Orders · CRUD + ledger',          fn: testKanbanWorkOrders },
    { name: 'H7.2 · Kanban · prompt builder IA + TDD eval',       fn: testKanbanExecutionPromptAndTdd }
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