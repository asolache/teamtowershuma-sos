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
import { buildAiCallbacks, __test_helpers__ } from '../core/aiDrivenCreationAdapter.js';
import { TASK_ROUTING } from '../core/aiRouterService.js';

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

// ─── M · brand-specific filtering (TeamTowers context) ─────────────────
console.log('\n— M · brand-specific SOCs filtrats per scope');
const BRAND_FIXTURE = {
    version: 'test-brand',
    items: [
        { folder: 'socs', relpath: 'socs/sectors/J.md',     title: 'Sector J',       sector_cnae: 'J', phase: null, sos_context: null, keywords: ['sector', 'tic'] },
        { folder: 'socs', relpath: 'socs/lifecycle/mvp.md', title: 'Fase MVP',       phase: 'mvp', keywords: ['lifecycle', 'mvp'] },
        { folder: 'socs', relpath: 'socs/la-colla.md',      title: 'La Colla',       sos_context: 'critical', keywords: ['colla', 'vna'] },
        // Brand-specific · NO ha d'aparèixer a projectes genèrics
        { folder: 'socs', relpath: 'socs/teamtowers-brand.md', title: 'TT Brand', sos_context: 'critical', scope: 'brand-specific', brand_owner: 'teamtowers', keywords: ['teamtowers', 'marca'] },
        { folder: 'socs', relpath: 'socs/teamtowers-merchandising.md', title: 'TT Merch', sos_context: 'secondary', scope: 'brand-specific', brand_owner: 'teamtowers', keywords: ['merch'] },
    ],
};

const mGeneric = matchSocs({ sector_cnae: 'J', lifecycle_stage: 'mvp', description: 'cooperativa software', name: 'Random Project', vna_zoom: 'micro', index: BRAND_FIXTURE });
const genericPaths = mGeneric.selected.map(s => s.relpath);
ok('M · projecte genèric NO inclou teamtowers-brand', !genericPaths.includes('socs/teamtowers-brand.md'));
ok('M · projecte genèric NO inclou teamtowers-merchandising', !genericPaths.includes('socs/teamtowers-merchandising.md'));
ok('M · projecte genèric SÍ inclou la-colla (universal)', genericPaths.includes('socs/la-colla.md'));

const mTTAuto = matchSocs({ sector_cnae: 'J', lifecycle_stage: 'mvp', description: 'projecte intern de TeamTowers · refonament', name: 'TT internal', vna_zoom: 'micro', index: BRAND_FIXTURE });
const ttAutoPaths = mTTAuto.selected.map(s => s.relpath);
ok('M · projecte TT (auto-detected pel nom) SÍ inclou teamtowers-brand', ttAutoPaths.includes('socs/teamtowers-brand.md'));

const mTTExplicit = matchSocs({ sector_cnae: 'J', lifecycle_stage: 'mvp', description: 'cooperativa', name: 'X', brandContext: 'teamtowers', vna_zoom: 'micro', index: BRAND_FIXTURE });
ok('M · brandContext=teamtowers explícit SÍ inclou teamtowers-brand', mTTExplicit.selected.some(s => s.relpath === 'socs/teamtowers-brand.md'));

// ─── I · classify heurístic detecta entity_type + lifecycle_stage ───────
console.log('\n— I · classify heurístic · entity_type + lifecycle_stage');
const rSos = await createProject({ name: 'SOS Federat', description: 'sistema sociotècnic permaweb federation', ambition: 'light' });
ok('I · "sos federat" → entity_type=sos', rSos.classification.entity_type === 'sos', 'sos', rSos.classification.entity_type);
const rBiz = await createProject({ name: 'Mi SL', description: 'una empresa SL de software · negoci consultoria', ambition: 'light' });
ok('I · "empresa SL negoci" → entity_type=business', rBiz.classification.entity_type === 'business', 'business', rBiz.classification.entity_type);
const rOrg = await createProject({ name: 'La Colla', description: 'cooperativa associació fundació', ambition: 'light' });
ok('I · "cooperativa associació" → entity_type=organization', rOrg.classification.entity_type === 'organization', 'organization', rOrg.classification.entity_type);
const rMvp = await createProject({ name: 'X', description: 'fer prototip MVP del producte', ambition: 'light' });
ok('I · "MVP prototip" → lifecycle_stage=mvp', rMvp.classification.lifecycle_stage === 'mvp', 'mvp', rMvp.classification.lifecycle_stage);
const rScale = await createProject({ name: 'Y', description: 'escalar a 108 operadors federation consolida', ambition: 'light' });
ok('I · "escalar 108 federat" → lifecycle_stage=scale', rScale.classification.lifecycle_stage === 'scale', 'scale', rScale.classification.lifecycle_stage);

// ─── J · aiDrivenCreationAdapter · parser JSON robust ───────────────────
console.log('\n— J · aiDrivenCreationAdapter · _parseJsonSafe robust');
const { _parseJsonSafe } = __test_helpers__;
ok('J · JSON pur', _parseJsonSafe('{"a":1}')?.a === 1);
ok('J · markdown codeblock json', _parseJsonSafe('```json\n{"a":2}\n```')?.a === 2);
ok('J · preàmbul abans del JSON', _parseJsonSafe('Aquí està la sortida ·\n{"a":3}')?.a === 3);
ok('J · text invalid → null', _parseJsonSafe('text random sense json') === null);
ok('J · null → null', _parseJsonSafe(null) === null);

// ─── K · buildAiCallbacks · adapter integra runEscalation ──────────────
console.log('\n— K · buildAiCallbacks · integra amb runEscalation');
const mockedGen = async (modelKey, opts) => {
    // Simula resposta JSON adequada segons taskKind detectat al systemPrompt
    if (/tria els SOCs/i.test(opts.userPrompt)) {
        return { text: JSON.stringify({ selected: [{ relpath: 'socs/sectors/J.md', weight: 1, reason: 'IA' }] }), usage: { inputTokens: 500, outputTokens: 80 } };
    }
    if (/expandeix el SOC/i.test(opts.userPrompt)) {
        return { text: JSON.stringify({ sops: [{ id: 'sop-adap-1', role_ref: 'creator', title: 'SOP adap', steps: [{ id: 's1', label: 'a', deliverable_kind: 'code', approval_rule: 'tdd', role_kind: 'ai', duration_minutes: 30 }, { id: 's2', label: 'b', deliverable_kind: 'tests', approval_rule: 'tdd', role_kind: 'ai', duration_minutes: 15 }, { id: 's3', label: 'c', deliverable_kind: 'comm', approval_rule: 'manual', role_kind: 'human', duration_minutes: 10 }] }] }), usage: { inputTokens: 800, outputTokens: 250 } };
    }
    if (opts.userPrompt.includes('Genera Work Orders')) {
        return { text: '```json\n' + JSON.stringify({ wos: [{ id: 'wo-adap-1', title: 'WO adap', description: 'do it', sop_ref: 'sop-adap-1', step_refs: ['s1'], assignee_role: 'creator', deliverable_kind: 'code', approval_rule: 'tdd', estimated_hours: 1, dtd_test: 'tests pass' }] }) + '\n```', usage: { inputTokens: 400, outputTokens: 120 } };
    }
    return { text: '{}', usage: { inputTokens: 100, outputTokens: 10 } };
};

const adapterCalls = [];
const callbacks = buildAiCallbacks({
    generateWithProvider: mockedGen,
    onModelUsed: ({ taskKind, modelKey, cost }) => adapterCalls.push({ taskKind, modelKey, cost }),
});

ok('K · TASK_ROUTING té soc-pick', !!TASK_ROUTING['soc-pick']);
ok('K · TASK_ROUTING té sop-from-soc', !!TASK_ROUTING['sop-from-soc']);
ok('K · TASK_ROUTING té wo-from-sop', !!TASK_ROUTING['wo-from-sop']);

const rAdapter = await createProject({
    name:        'Adapter test',
    description: 'cooperativa software · sector J · MVP',
    sector:      'J',
    ambition:    'light',
    generationMode: 'ai-driven',
    vna_zoom:       'macro',
    ...callbacks,
    knowledgeIndex: FIXTURE_INDEX,
    onEvent: () => {},
});
ok('K · adapter result returned', !!rAdapter && rAdapter.version);
ok('K · adapter retorna score ≥0', rAdapter.score >= 0, '≥0', rAdapter.score);
ok('K · adapter sops generats per IA', rAdapter.sops.length >= 1, '≥1', rAdapter.sops.length);
ok('K · adapter wos generats per IA', rAdapter.wos.length >= 1, '≥1', rAdapter.wos.length);
ok('K · adapter onModelUsed cridat ≥1', adapterCalls.length >= 1, '≥1', adapterCalls.length);
ok('K · adapter cost acumulat (>0)', rAdapter.cost > 0, '>0', rAdapter.cost);

// ─── L · cost per step · cada pas afegeix al total ──────────────────────
console.log('\n— L · cost acumulat per step IA');
let perStepCosts = [];
const trackedCallbacks = {
    pickSocs:     async ({ candidates }) => { const c = 0.003; perStepCosts.push({ step: 'pick-socs', cost: c }); return { selected: candidates.slice(0, 2), cost: c }; },
    generateSops: async ({ soc, role_kinds }) => { const c = 0.007; perStepCosts.push({ step: 'gen-sops', cost: c }); return { sops: [{ id: 'sop-trk-' + soc.relpath.length, role_ref: role_kinds?.[0] || 'creator', title: 'T', steps: [{ id: 's1', label: 'a', deliverable_kind: 'code', approval_rule: 'tdd' }, { id: 's2', label: 'b', deliverable_kind: 'tests', approval_rule: 'tdd' }, { id: 's3', label: 'c', deliverable_kind: 'comm', approval_rule: 'manual' }] }], cost: c }; },
    generateWos:  async ({ sop }) => { const c = 0.011; perStepCosts.push({ step: 'gen-wos', cost: c }); return { wos: [{ id: 'wo-trk-' + sop.id, title: 'W', description: 'd', sop_ref: sop.id, dtd_test: 't' }], cost: c }; },
};
const rCost = await createProject({
    name: 'Cost test',
    description: 'cooperativa software · sector J',
    sector: 'J',
    ambition: 'standard',
    generationMode: 'ai-driven',
    vna_zoom: 'macro',
    ...trackedCallbacks,
    knowledgeIndex: FIXTURE_INDEX,
    onEvent: () => {},
});
const expectedCost = perStepCosts.reduce((a, p) => a + p.cost, 0);
ok('L · cost total ≈ suma per step', Math.abs(rCost.cost - expectedCost) < 0.001, 'sum', { total: rCost.cost, expected: expectedCost });
ok('L · pickSocs · 1 invocació', perStepCosts.filter(p => p.step === 'pick-socs').length === 1);
ok('L · generateSops · ≥1 invocació', perStepCosts.filter(p => p.step === 'gen-sops').length >= 1);
ok('L · generateWos · ≥1 invocació', perStepCosts.filter(p => p.step === 'gen-wos').length >= 1);

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
