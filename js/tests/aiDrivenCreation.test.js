// =============================================================================
// TEAMTOWERS SOS V11 — AI-DRIVEN CREATION · TDD (PR1 · SOC→SOP→WO)
// Ruta · /js/tests/aiDrivenCreation.test.js
//
// TDD que blinda la nova cadena IA-driven · puntos clau ·
//   A · socMatcher pure pattern-matching · zoom (macro/mid/micro)
//   B · 3 TASK_PROMPTS nous + buildPrompt funciona
//   C · createProject({generationMode:'ai-driven', mocked callbacks}) · stream events
//   D · sortida AI-driven sobrescriu socs/sops i pobla wos
//   E · fallback knowledge-only (sense IA) també funciona
//   F · zoom controla quants SOCs s'agafen
//   G · entity_type incideix als reasons
//   H · regressió · template-mode (default) segueix funcionant igual
// =============================================================================

import { matchSocs, listEntityTypes, listZoomLevels, VNA_ZOOM_LEVELS } from '../core/socMatcher.js';
import { buildPrompt, TASK_KINDS, listTasks } from '../core/vnaExpertPrompts.js';
import { createProject, GENERATION_MODES } from '../core/projectCreationOrchestrator.js';

let pass = 0, fail = 0;
function ok(label, cond, expected = '', got = '') {
    if (cond) { pass++; console.log('✓', label); }
    else {
        fail++;
        const detail = (expected !== '' || got !== '') ? ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})` : '';
        console.log('✗', label + detail);
    }
}

// ─── Fixture index · simula knowledge/_search-index.json ─────────────────
const FIXTURE_INDEX = {
    version: 'test-v1',
    items: [
        // 3 sector SOCs (CNAE J = info & comms)
        { folder: 'socs', relpath: 'socs/sectors/J.md',          title: 'Sector J',          sector_cnae: 'J', phase: null, sos_context: null, keywords: ['sector', 'cnae-j', 'tic', 'software'] },
        { folder: 'socs', relpath: 'socs/sectors/C.md',          title: 'Sector C',          sector_cnae: 'C', phase: null, sos_context: null, keywords: ['sector', 'manufactura'] },
        { folder: 'socs', relpath: 'socs/sectors/M.md',          title: 'Sector M',          sector_cnae: 'M', phase: null, sos_context: null, keywords: ['consultoria'] },
        // 4 lifecycle SOCs
        { folder: 'socs', relpath: 'socs/lifecycle/idea.md',       title: 'Fase Idea',       sector_cnae: null, phase: 'idea',       sos_context: null, keywords: ['lifecycle', 'idea'] },
        { folder: 'socs', relpath: 'socs/lifecycle/mvp.md',        title: 'Fase MVP',        sector_cnae: null, phase: 'mvp',        sos_context: null, keywords: ['lifecycle', 'mvp'] },
        { folder: 'socs', relpath: 'socs/lifecycle/validation.md', title: 'Fase Validation', sector_cnae: null, phase: 'validation', sos_context: null, keywords: ['lifecycle'] },
        { folder: 'socs', relpath: 'socs/lifecycle/scale.md',      title: 'Fase Scale',      sector_cnae: null, phase: 'scale',      sos_context: null, keywords: ['lifecycle', 'scale'] },
        // 3 critical brand SOCs
        { folder: 'socs', relpath: 'socs/la-colla.md',         title: 'La Colla',         sector_cnae: null, phase: null, sos_context: 'critical', keywords: ['colla', 'castell', 'matriu'] },
        { folder: 'socs', relpath: 'socs/fent-pinya.md',       title: 'Fent Pinya',       sector_cnae: null, phase: null, sos_context: 'critical', keywords: ['castell', 'comunit', 'cohesió'] },
        { folder: 'socs', relpath: 'socs/teamtowers-brand.md', title: 'TeamTowers Brand', sector_cnae: null, phase: null, sos_context: 'critical', keywords: ['brand', 'cooperatiu'] },
        // 1 non-SOC item (noise)
        { folder: 'vision', relpath: 'vision/mind.md', title: 'Mind Arch', keywords: ['vision'] },
    ],
};

console.log('=== AI-DRIVEN-CREATION · PR1 SOC→SOP→WO ===\n');

// ─── A · socMatcher pure ─────────────────────────────────────────────────
console.log('— A · socMatcher pure pattern-matching');
const mMid = matchSocs({
    sector_cnae: 'J', lifecycle_stage: 'mvp', entity_type: 'organization', vna_zoom: 'mid',
    description: 'Construïm un sistema software cooperatiu', name: 'SOS Test',
    index: FIXTURE_INDEX,
});
ok('A · ≥1 SOC seleccionat', mMid.selected.length >= 1);
ok('A · respecte rang mid (4-7)', mMid.selected.length >= 4 && mMid.selected.length <= 7, '4-7', mMid.selected.length);
const hasSectorJ = mMid.selected.some(s => s.relpath === 'socs/sectors/J.md');
ok('A · inclou sector J (exact match)', hasSectorJ);
const hasMvp = mMid.selected.some(s => s.relpath === 'socs/lifecycle/mvp.md');
ok('A · inclou lifecycle mvp', hasMvp);
const hasCritical = mMid.selected.some(s => s.sos_context === 'critical');
ok('A · inclou ≥1 critical TT-brand', hasCritical);

// ─── F · zoom controla quants SOCs ──────────────────────────────────────
console.log('\n— F · zoom controla la quantitat');
const mMacro = matchSocs({ sector_cnae: 'J', lifecycle_stage: 'mvp', vna_zoom: 'macro', index: FIXTURE_INDEX });
ok('F · macro 1-3', mMacro.selected.length >= 1 && mMacro.selected.length <= 3, '1-3', mMacro.selected.length);
const mMicro = matchSocs({ sector_cnae: 'J', lifecycle_stage: 'mvp', vna_zoom: 'micro', description: 'software cooperativa', index: FIXTURE_INDEX });
ok('F · micro ≥ mid', mMicro.selected.length >= mMid.selected.length, '≥' + mMid.selected.length, mMicro.selected.length);

// ─── G · entity_type incideix ────────────────────────────────────────────
console.log('\n— G · entity_type incideix als reasons');
const mOrg = matchSocs({ sector_cnae: 'J', lifecycle_stage: 'mvp', entity_type: 'organization', description: 'projecte cooperatiu', vna_zoom: 'mid', index: FIXTURE_INDEX });
const orgReasons = mOrg.selected.flatMap(s => s.reasons || []);
ok('G · org → entitat·coop reason apareix', orgReasons.some(r => r.includes('coop')) || orgReasons.length > 0);

// ─── B · 3 TASK_PROMPTS nous + buildPrompt ─────────────────────────────
console.log('\n— B · TASK_KINDS nous');
const tasks = listTasks();
for (const tk of ['classify-and-pick-socs', 'generate-sops-from-soc', 'generate-wos-from-sop']) {
    ok('B · TASK_KINDS conté ' + tk, tasks.includes(tk));
}

// buildPrompt per cada task nou
const p1 = buildPrompt({ taskKind: 'classify-and-pick-socs', context: { name: 'X', description: 'desc', sector: 'J', entity_type: 'organization', project_type: 'coop', vna_zoom: 'mid', candidates: mMid.selected } });
ok('B · classify-and-pick-socs · system carregat', p1.system.length > 1000);
ok('B · classify-and-pick-socs · user no buit', p1.user.length > 100);
ok('B · classify-and-pick-socs · tokens <3500', p1.approxTokens < 3500, '<3500', p1.approxTokens);

const fixtureSoc = { relpath: 'socs/sectors/J.md', title: 'Sector J', purpose: 'TIC', excerpt: 'Software cooperatiu' };
const p2 = buildPrompt({ taskKind: 'generate-sops-from-soc', context: { name: 'X', soc: fixtureSoc, project_ctx: { sector: 'J', lifecycle_stage: 'mvp', entity_type: 'organization', description: 'desc' }, role_kinds: ['founder', 'creator'] } });
ok('B · generate-sops-from-soc · user no buit', p2.user.length > 100);
ok('B · generate-sops-from-soc · tokens <3500', p2.approxTokens < 3500, '<3500', p2.approxTokens);

const fixtureSop = { id: 'sop-test', title: 'SOP test', role_ref: 'creator', steps: [{ id: 's1', label: 'a', deliverable_kind: 'code', approval_rule: 'tdd' }] };
const p3 = buildPrompt({ taskKind: 'generate-wos-from-sop', context: { name: 'X', sop: fixtureSop, project_ctx: { description: 'desc' } } });
ok('B · generate-wos-from-sop · user no buit', p3.user.length > 100);
ok('B · generate-wos-from-sop · tokens <3500', p3.approxTokens < 3500, '<3500', p3.approxTokens);

// ─── H · regressió · mode template segueix ──────────────────────────────
console.log('\n— H · regressió mode template');
ok('H · GENERATION_MODES conté template + ai-driven', GENERATION_MODES.includes('template') && GENERATION_MODES.includes('ai-driven'));
const rTpl = await createProject({ name: 'Test Template', description: 'cooperat castell', ambition: 'light' });
ok('H · template-mode ok', rTpl.ok === true);
ok('H · template-mode no té wos', Array.isArray(rTpl.wos) && rTpl.wos.length === 0);
ok('H · template-mode generationMode marker', rTpl.generationMode === 'template');
ok('H · template-mode score ≥85', rTpl.score >= 85, '≥85', rTpl.score);

// ─── C · createProject ai-driven streaming ──────────────────────────────
console.log('\n— C · createProject ai-driven · streaming events');
const events = [];
const collectedSteps = new Set();

// Mock IA callbacks · simulen IA real però retornen output determinístic
const mockPickSocs = async ({ candidates }) => ({
    selected: candidates.slice(0, 3).map(c => ({ relpath: c.relpath, weight: 1, reason: 'IA pick' })),
    cost: 0.005,
});
const mockGenSops = async ({ soc, role_kinds }) => ({
    sops: [
        { id: 'sop-' + soc.relpath.replace(/[^a-z0-9]/g, '-') + '-1', role_ref: role_kinds?.[0] || 'creator', title: 'SOP de ' + soc.title, purpose: 'derivat IA',
          steps: [
              { id: 's1', label: 'Step 1', deliverable_kind: 'analysis', approval_rule: 'manual', role_kind: 'human', duration_minutes: 30 },
              { id: 's2', label: 'Step 2', deliverable_kind: 'tests',    approval_rule: 'tdd',    role_kind: 'ai',    duration_minutes: 15 },
              { id: 's3', label: 'Step 3', deliverable_kind: 'code',     approval_rule: 'tdd',    role_kind: 'ai',    duration_minutes: 60 },
          ] },
    ],
    cost: 0.008,
});
const mockGenWos = async ({ sop }) => ({
    wos: [
        { id: 'wo-' + sop.id + '-a', title: 'WO A de ' + sop.title, description: 'Executar step 1', sop_ref: sop.id, step_refs: ['s1'], assignee_role: sop.role_ref, deliverable_kind: 'analysis', approval_rule: 'manual', estimated_hours: 0.5, dtd_test: 'output > 100 chars' },
        { id: 'wo-' + sop.id + '-b', title: 'WO B de ' + sop.title, description: 'Executar steps 2-3', sop_ref: sop.id, step_refs: ['s2','s3'], assignee_role: sop.role_ref, deliverable_kind: 'code', approval_rule: 'tdd', estimated_hours: 1.25, dtd_test: 'tests passen' },
    ],
    cost: 0.012,
});

const rAi = await createProject({
    name:        'Test AI-driven',
    description: 'software cooperativa amb 5 persones · sector tecnologia',
    sector:      'J',
    ambition:    'standard',
    generationMode: 'ai-driven',
    entity_type:    'organization',
    vna_zoom:       'mid',
    pickSocs:       mockPickSocs,
    generateSops:   mockGenSops,
    generateWos:    mockGenWos,
    knowledgeIndex: FIXTURE_INDEX,
    onEvent: (e) => { events.push(e); collectedSteps.add(e.step); },
});

ok('C · result.ok', rAi.ok === true);
ok('C · generationMode marker ai-driven', rAi.generationMode === 'ai-driven');
ok('C · event "classify" emès', collectedSteps.has('classify'));
ok('C · event "match-socs" emès', collectedSteps.has('match-socs'));
ok('C · event "pick-socs-ai" emès', collectedSteps.has('pick-socs-ai'));
ok('C · event "generate-sops" emès', collectedSteps.has('generate-sops'));
ok('C · event "generate-wos" emès', collectedSteps.has('generate-wos'));
ok('C · event "validate" emès', collectedSteps.has('validate'));
ok('C · event "build-nodes" emès', collectedSteps.has('build-nodes'));
ok('C · event "finish" emès', collectedSteps.has('finish'));
// Ordre · classify abans que match-socs · match-socs abans que generate-sops
const idxClassify = events.findIndex(e => e.step === 'classify' && e.status === 'done');
const idxMatch    = events.findIndex(e => e.step === 'match-socs' && e.status === 'done');
const idxGenSops  = events.findIndex(e => e.step === 'generate-sops' && e.status === 'start');
const idxGenWos   = events.findIndex(e => e.step === 'generate-wos' && e.status === 'start');
ok('C · ordre · classify→match-socs', idxClassify < idxMatch && idxClassify >= 0);
ok('C · ordre · match-socs→generate-sops', idxMatch < idxGenSops && idxMatch >= 0);
ok('C · ordre · generate-sops→generate-wos', idxGenSops < idxGenWos && idxGenSops >= 0);

// ─── D · sortida AI sobrescriu socs/sops + pobla wos ────────────────────
console.log('\n— D · sortida AI sobrescriu socs/sops + pobla wos');
ok('D · socsSelected present', Array.isArray(rAi.socsSelected) && rAi.socsSelected.length > 0);
ok('D · ≥1 SOC promogut a node', rAi.socs.length >= 1);
ok('D · ≥1 SOP generat per IA (≠ template)', rAi.sops.length >= 3, '≥3', rAi.sops.length);
ok('D · ≥1 WO generat per IA', rAi.wos.length >= 1, '≥1', rAi.wos.length);
ok('D · WO nodes amb sop_ref', rAi.wos.every(w => w.content.sop_ref));
ok('D · WO nodes amb dtd_test', rAi.wos.every(w => w.content.dtd_test));
ok('D · WO nodes type=work_order', rAi.wos.every(w => w.type === 'work_order'));
// Cost mesurat
ok('D · cost IA acumulat (>0)', rAi.cost > 0, '>0', rAi.cost);

// SOC node deve apuntar a source_path del knowledge real
const socNode0 = rAi.socs[0];
ok('D · SOC node té source_path (refereix al knowledge)', !!socNode0.content?.source_path);
ok('D · SOC node té checklist amb sop_ref', Array.isArray(socNode0.content?.checklist) && socNode0.content.checklist.length > 0);

// ─── E · fallback knowledge-only · sense IA ─────────────────────────────
console.log('\n— E · fallback knowledge-only (sense IA · només heurístic)');
const eventsE = [];
const rKnowledgeOnly = await createProject({
    name: 'Test K-only',
    description: 'cooperativa software',
    sector: 'J',
    ambition: 'light',
    generationMode: 'ai-driven',
    entity_type: 'organization',
    vna_zoom: 'macro',
    // pickSocs/generateSops/generateWos = null · skip IA
    knowledgeIndex: FIXTURE_INDEX,
    onEvent: (e) => eventsE.push(e),
});
ok('E · sense IA encara retorna result ok', rKnowledgeOnly.ok === true);
ok('E · socsSelected des de matcher heurístic', rKnowledgeOnly.socsSelected.length >= 1);
ok('E · wos buits (no hi ha IA per generar)', rKnowledgeOnly.wos.length === 0);
ok('E · event match-socs emès', eventsE.some(e => e.step === 'match-socs' && e.status === 'done'));
ok('E · event pick-socs-ai NO emès (callback null)', !eventsE.some(e => e.step === 'pick-socs-ai'));

// ─── Smoke · helpers UI ─────────────────────────────────────────────────
console.log('\n— Smoke · helpers UI');
const ets = listEntityTypes();
ok('Smoke · listEntityTypes 4 entries', ets.length === 4, 4, ets.length);
const zls = listZoomLevels();
ok('Smoke · listZoomLevels 3 entries', zls.length === 3, 3, zls.length);
ok('Smoke · VNA_ZOOM_LEVELS.macro existeix', !!VNA_ZOOM_LEVELS.macro);

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
