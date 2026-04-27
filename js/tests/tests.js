
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

    // listSocs → debe encontrar al menos los 2 SOCs registrados en _index.md
    const socs = await KnowledgeLoader.listSocs();
    assert(Array.isArray(socs),                          'listSocs() devuelve array');
    assert(socs.length >= 2,                             'listSocs() encuentra ≥2 SOCs en _index.md');
    assert(socs.some(s => s.slug === 'fent-pinya'),      'listSocs() incluye fent-pinya');
    assert(socs.some(s => s.slug === 'soc-vna-network'), 'listSocs() incluye soc-vna-network');

    // listSops → debe encontrar el SOP de fent-pinya con soc_ref
    const sopsList = await KnowledgeLoader.listSops();
    assert(Array.isArray(sopsList),                      'listSops() devuelve array');
    assert(sopsList.length >= 1,                         'listSops() encuentra ≥1 SOP en _index.md');
    const sopEntry = sopsList.find(s => s.slug === 'fent-pinya-taller');
    assert(!!sopEntry,                                   'listSops() incluye fent-pinya-taller');
    assert(sopEntry.socRef === 'soc-fent-pinya',         'sop fent-pinya-taller referencia soc-fent-pinya');

    // getSocSeed → carga frontmatter y body del fichero
    const soc = await KnowledgeLoader.getSocSeed('fent-pinya');
    assert(!!soc,                                        'getSocSeed("fent-pinya") devuelve seed');
    assert(soc.id === 'soc-fent-pinya',                  'soc.id = soc-fent-pinya (del frontmatter)');
    assert(typeof soc.purpose === 'string' && soc.purpose.length > 30, 'soc.purpose presente');
    assert(soc.body.includes('Fent Pinya'),              'soc.body contiene contenido del MD');

    // getSopSeed → carga SOP con soc_ref
    const sop = await KnowledgeLoader.getSopSeed('fent-pinya-taller');
    assert(!!sop,                                        'getSopSeed("fent-pinya-taller") devuelve seed');
    assert(sop.socRef === 'soc-fent-pinya',              'sop.socRef = soc-fent-pinya');
    assert(sop.durationMinutes === 180,                  'sop.durationMinutes = 180');
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

// ─── Runner ──────────────────────────────────────────────────────
const SUITE = [
    { name: 'H1.1 · KB Mind-as-Graph round-trip',                fn: testKbMindAsGraph },
    { name: 'H1.5 · KnowledgeLoader carga SOPs/SOCs y projectId', fn: testKnowledgeLoaderSocsSops }
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