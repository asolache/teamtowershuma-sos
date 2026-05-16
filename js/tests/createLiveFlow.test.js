// =============================================================================
// TEAMTOWERS SOS V11 — CREATE LIVE FLOW · TDD (PR2 frontend wiring)
// Ruta · /js/tests/createLiveFlow.test.js
//
// Valida el contracte de dades entre createProject (orchestrator streaming)
// i CreateLiveView (consumidor d'events). No testegem DOM · només event shape +
// payload format de sessionStorage.
// =============================================================================

import { createProject } from '../core/projectCreationOrchestrator.js';

let pass = 0, fail = 0;
function ok(label, cond, expected = '', got = '') {
    if (cond) { pass++; console.log('✓', label); }
    else {
        fail++;
        const detail = (expected !== '' || got !== '') ? ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})` : '';
        console.log('✗', label + detail);
    }
}

const FIXTURE = {
    version: 'live-test',
    items: [
        { folder: 'socs', relpath: 'socs/sectors/J.md',     title: 'Sector J',   sector_cnae: 'J', keywords: ['tic'] },
        { folder: 'socs', relpath: 'socs/lifecycle/mvp.md', title: 'Fase MVP',   phase: 'mvp', keywords: ['mvp'] },
        { folder: 'socs', relpath: 'socs/la-colla.md',      title: 'La Colla',   sos_context: 'critical', keywords: ['colla'] },
    ],
};

console.log('=== CREATE-LIVE FLOW · contracte events + payload ===\n');

// ─── A · sessionStorage payload format esperat per CreateLiveView ───────
console.log('— A · payload sessionStorage (contracte ProjectCreationV2 → CreateLive)');
const samplePayload = {
    name: 'Test', description: 'desc', sector: 'J', ambition: 'standard',
    templateId: null, entity_type: 'organization', vna_zoom: 'mid',
    generationMode: 'ai-driven',
};
const REQUIRED_KEYS = ['name', 'description', 'sector', 'ambition', 'generationMode'];
for (const k of REQUIRED_KEYS) {
    ok('A · payload té camp ' + k, Object.prototype.hasOwnProperty.call(samplePayload, k));
}
ok('A · payload entity_type és valor canònic', ['organization', 'business', 'sos', 'project_internal', null, ''].includes(samplePayload.entity_type));
ok('A · payload vna_zoom és valor canònic', ['macro', 'mid', 'micro', null, ''].includes(samplePayload.vna_zoom));
ok('A · payload generationMode és valor canònic', ['template', 'ai-driven'].includes(samplePayload.generationMode));

// ─── B · esdeveniments streaming · shape garantit per CreateLiveView ────
console.log('\n— B · streaming events tenen el shape que la UI espera');
const collectedEvents = [];

const mockPickSocs = async ({ candidates }) => ({ selected: candidates.slice(0, 2), cost: 0.003 });
const mockGenSops = async ({ soc, role_kinds }) => ({
    sops: [{ id: 'sop-x-' + soc.relpath.length, role_ref: role_kinds?.[0] || 'creator', title: 'SOP X', steps: [{ id: 's1', label: 'a', deliverable_kind: 'code', approval_rule: 'tdd' }, { id: 's2', label: 'b', deliverable_kind: 'tests', approval_rule: 'tdd' }, { id: 's3', label: 'c', deliverable_kind: 'comm', approval_rule: 'manual' }] }],
    cost: 0.005,
});
const mockGenWos = async ({ sop }) => ({ wos: [{ id: 'wo-' + sop.id, title: 'WO', description: 'desc', sop_ref: sop.id, dtd_test: 'test', estimated_hours: 1, approval_rule: 'tdd' }], cost: 0.007 });

const r = await createProject({
    name: 'Live Test', description: 'cooperat software · MVP · J',
    sector: 'J', ambition: 'light',
    generationMode: 'ai-driven',
    entity_type: 'organization',
    vna_zoom: 'macro',
    pickSocs: mockPickSocs,
    generateSops: mockGenSops,
    generateWos: mockGenWos,
    knowledgeIndex: FIXTURE,
    onEvent: (e) => collectedEvents.push(e),
});

// Events bàsics que la UI espera
const stepSet = new Set(collectedEvents.map(e => e.step));
for (const step of ['classify', 'seed', 'personalize', 'match-socs', 'pick-socs-ai', 'generate-sops', 'generate-wos', 'validate', 'build-nodes', 'finish']) {
    ok('B · stream emet ' + step, stepSet.has(step));
}

// Cada event té step+status
const allHaveShape = collectedEvents.every(e => typeof e.step === 'string' && typeof e.status === 'string');
ok('B · cada event té {step, status} strings', allHaveShape);

// validate event té score + integrity info per gauge
const validateDone = collectedEvents.find(e => e.step === 'validate' && e.status === 'done');
ok('B · validate done · té score num', typeof validateDone?.score === 'number');
ok('B · validate done · té integrityErrors num', typeof validateDone?.integrityErrors === 'number');
ok('B · validate done · té ok bool', typeof validateDone?.ok === 'boolean');

// finish event té score + status + ms
const finishDone = collectedEvents.find(e => e.step === 'finish' && e.status === 'done');
ok('B · finish done · té score', typeof finishDone?.score === 'number');
ok('B · finish done · té ms', typeof finishDone?.ms === 'number');

// ─── C · result té tot el que la UI necessita per pintar les 4 tabs ──────
console.log('\n— C · result complet per pintar 4 tabs (Castell · Mapa · Canvas · WOs)');
// Tab Castell · necessita roles amb castell_level
ok('C · roles array', Array.isArray(r.project.vna_roles));
ok('C · roles amb castell_level', r.project.vna_roles.every(rl => typeof rl.castell_level === 'string'));
// Tab Mapa · necessita transactions amb {from,to,deliverable,type}
ok('C · transactions array', Array.isArray(r.transactions));
ok('C · transactions amb {from,to,deliverable,type}', r.transactions.every(t => t.from && t.to && t.deliverable && t.type));
// Tab Canvas · necessita canvas + pitch
ok('C · canvas.vision string', typeof r.canvas?.vision === 'string');
ok('C · pitch.headline string', typeof r.pitch?.headline === 'string');
// Tab WOs · necessita sops + wos
ok('C · sops array', Array.isArray(r.sops));
ok('C · wos array', Array.isArray(r.wos));
ok('C · wo node té content.title', r.wos.every(w => typeof w.content?.title === 'string'));
ok('C · wo node té content.sop_ref', r.wos.every(w => typeof w.content?.sop_ref === 'string'));

// ─── D · CTAs post-finish · enllaços vàlids ─────────────────────────────
console.log('\n— D · post-finish · project.id present per CTAs (Kanban · Mapa · Quality · Hub)');
ok('D · result.project.id present', typeof r.project.id === 'string' && r.project.id.length > 0);
const ctaUrls = [
    '/kanban?project=' + encodeURIComponent(r.project.id),
    '/map?project=' + encodeURIComponent(r.project.id),
    '/quality?project=' + encodeURIComponent(r.project.id),
    '/hub/' + encodeURIComponent(r.project.id),
];
ok('D · 4 CTA URLs sense placeholders/buits', ctaUrls.every(u => u.length > 12 && !u.includes('undefined')));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
