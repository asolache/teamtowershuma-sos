
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

// ─── Runner ──────────────────────────────────────────────────────
const SUITE = [
    { name: 'H1.1 · KB Mind-as-Graph round-trip', fn: testKbMindAsGraph }
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