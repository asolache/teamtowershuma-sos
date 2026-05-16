// =============================================================================
// improvementLoop.test.js · IMPROVEMENT-LOOP sprint A · TDD WO + feedback
// =============================================================================

import {
    IMPROVEMENT_CYCLE_TYPE, IMPROVEMENT_MODEL_TYPE, FOCUS_AREAS,
    defineImprovementModel,
    pickNextSOP,
    buildWOFromSOP,
    analyzeDeliverable,
    applyEnrichmentsToProject,
    buildImprovementCycleNode,
    runImprovementCycle,
    runImprovementLoop,
} from '../core/improvementLoopService.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

// Fixtures
const mockProject = () => ({
    id: 'pX', type: 'project', name: 'TestProj', tags: ['existing-tag'],
    content: { description: 'd' },
});
const mockSOP = (id, title, body) => ({
    id, type: 'sop',
    content: { projectId: 'pX', roleId: 'r1', title, body, steps: [body] },
});

// ─── A · constants ────────────────────────────────────────────────────────
eq(IMPROVEMENT_CYCLE_TYPE, 'improvement_cycle',                   'A · CYCLE_TYPE');
eq(IMPROVEMENT_MODEL_TYPE, 'improvement_model',                   'A · MODEL_TYPE');
t(FOCUS_AREAS.length >= 6,                                        'A · ≥6 focus areas');
const focusIds = FOCUS_AREAS.map(f => f.id);
for (const need of ['canvas-evolution', 'role-coverage', 'commercial-pipeline', 'accounting-discipline']) {
    t(focusIds.includes(need),                                    'A · focus ' + need + ' present');
}

// ─── B · defineImprovementModel ───────────────────────────────────────────
const m1 = defineImprovementModel({ projectId: 'pX', ts: 1700000000000 });
eq(m1.type, IMPROVEMENT_MODEL_TYPE,                               'B · type');
eq(m1.projectId, 'pX',                                            'B · projectId');
t(m1.content.focusAreas.length >= 6,                              'B · default all focus areas');
t(Array.isArray(m1.content.scoringRules.bonus),                   'B · bonus array');
t(Array.isArray(m1.content.scoringRules.penalty),                 'B · penalty array');

// Custom focusAreas · filtra
const m2 = defineImprovementModel({ focusAreas: ['canvas-evolution', 'unknown-x'] });
eq(m2.content.focusAreas.length, 1,                               'B · unknown filtered');
eq(m2.content.focusAreas[0], 'canvas-evolution',                  'B · valid kept');

// ─── C · pickNextSOP ──────────────────────────────────────────────────────
const sops = [
    mockSOP('s1', 'Define vision', 'Define vision'),
    mockSOP('s2', 'Setup ledger',  'Setup ledger'),
    mockSOP('s3', 'Pitch deck',    'Pitch'),
];
eq(pickNextSOP({ sops }).id, 's1',                                'C · primer SOP unused');
eq(pickNextSOP({ sops: [] }), null,                               'C · empty sops → null');
// Excloure ja usats
const usedCycle = { content: { sourceSopId: 's1' } };
eq(pickNextSOP({ sops, prevCycles: [usedCycle] }).id, 's2',       'C · skip s1, prefereix s2');
// Tots usats · re-circula al primer
eq(pickNextSOP({ sops, prevCycles: [
    { content: { sourceSopId: 's1' } },
    { content: { sourceSopId: 's2' } },
    { content: { sourceSopId: 's3' } },
]}).id, 's1',                                                     'C · tots usats · loop al primer');

// ─── D · buildWOFromSOP · sense context ───────────────────────────────────
const proj = mockProject();
const sop1 = sops[0];
const wo1 = buildWOFromSOP({ sop: sop1, project: proj, iteration: 1, ts: 1700000000000 });
eq(wo1.type, 'work_order',                                        'D · type work_order');
eq(wo1.projectId, 'pX',                                           'D · projectId');
eq(wo1.content.sourceSopId, 's1',                                 'D · sourceSopId');
eq(wo1.content.iteration, 1,                                      'D · iteration');
eq(wo1.content.kind, 'improvement-loop-wo',                       'D · kind tagged');
eq(wo1.content.status, 'pending',                                 'D · status pending');
t(wo1.content.title.includes('Iter 1'),                           'D · title amb [Iter N]');
t(wo1.content.description.includes('TestProj'),                   'D · description projectName');
t(wo1.content.description.includes('Define vision'),              'D · description SOP body');
// Sense prev · no 'Context · darrers' section
t(!wo1.content.description.includes('Context · darrers'),         'D · sense prev · sense Context section');

let threw = false;
try { buildWOFromSOP({ project: proj }); } catch (_) { threw = true; }
t(threw,                                                          'D · sop required throws');
threw = false;
try { buildWOFromSOP({ sop: sop1 }); } catch (_) { threw = true; }
t(threw,                                                          'D · project required throws');

// ─── E · buildWOFromSOP · amb prev cycles · context enriched ──────────────
const prevCycle = {
    id: 'icycle-1',
    content: {
        iteration: 1, sourceSopId: 's1',
        deliverableOutput: 'Output anterior · mentions stakeholders + 5 cohort managers + 1000€',
        enrichments: [{ kind: 'add-tag', payload: 'cohort' }, { kind: 'evidence-cited' }],
    },
};
const wo2 = buildWOFromSOP({ sop: sops[1], project: proj, prevCycles: [prevCycle], iteration: 2 });
t(wo2.content.description.includes('Context · darrers'),          'E · context section inclosa');
t(wo2.content.description.includes('Output anterior'),            'E · preview deliverable anterior');
t(wo2.content.description.includes('cohort'),                     'E · enrichments anteriors listed');
t(wo2.content.description.includes('Iter 1'),                     'E · referencia iter 1');
eq(wo2.content.iteration, 2,                                      'E · iteration 2');
// prevContext bookkeeping
eq(wo2.content.prevContext.length, 1,                             'E · 1 prev cycle al prevContext');

// 3 prev · sols els darrers 3 inclosos
const manyPrev = [1, 2, 3, 4, 5].map(i => ({
    id: 'c' + i,
    content: { iteration: i, sourceSopId: 's' + i, deliverableOutput: 'out' + i, enrichments: [] },
}));
const wo3 = buildWOFromSOP({ sop: sops[0], project: proj, prevCycles: manyPrev, iteration: 6 });
t(wo3.content.description.includes('out5'),                       'E · last 3 · out5 inclós');
t(wo3.content.description.includes('out4'),                       'E · out4 inclós');
t(wo3.content.description.includes('out3'),                       'E · out3 inclós');
t(!wo3.content.description.includes('out1'),                      'E · out1 (vell) NO inclós');

// ─── F · analyzeDeliverable · enrichments + mentions + score ──────────────
const goodOutput = 'Vision · 100 cohort managers cobreixen 90 skills. Mètrica · 1200€/mes MAU. Stakeholder · founders + operadors + community. Roles definits per transaction clara.';
const a1 = analyzeDeliverable({ output: goodOutput, model: m1, project: proj });
t(a1.score > 50,                                                  'A · score baseline+');
t(a1.enrichments.length > 0,                                      'F · enrichments detectats');
t(a1.mentions.length >= 3,                                        'F · ≥3 mentions de keywords');
// Mentions hauria de tenir focus area role-coverage (cohort/manager) i commercial-pipeline (revenue)
const mFA = new Set(a1.mentions.map(m => m.focusAreaId));
t(mFA.has('role-coverage'),                                       'F · mention role-coverage');
t(mFA.has('commercial-pipeline') || mFA.has('canvas-evolution'),  'F · mention commercial o canvas');

// Evidence cited (mètrica numèrica)
t(a1.enrichments.some(e => e.kind === 'evidence-cited'),          'F · evidence-cited (1200€)');

// Empty output · score 0
const aEmpty = analyzeDeliverable({ output: '', model: m1, project: proj });
eq(aEmpty.score, 0,                                               'F · empty · score 0');
eq(aEmpty.enrichments.length, 0,                                  'F · empty · cap enrichment');

// Penalty keywords · score lower
const vagueOutput = 'TBD · vague · maybe · unsure · reinvent something';
const aV = analyzeDeliverable({ output: vagueOutput, model: m1, project: proj });
t(aV.score < 50,                                                  'F · penalty keywords · score < 50');

// suggestedNext · ≥2 mentions del mateix focus area
const multiOutput = 'token supply distribution vesting cliff supply equity equity slicing equity';
const aMulti = analyzeDeliverable({ output: multiOutput, model: m1, project: proj });
t(aMulti.suggestedNext.length > 0,                                'F · suggested-next per focus repetit');
t(aMulti.suggestedNext.some(s => s.focusAreaId === 'tokenomics-fairness'),
                                                                  'F · suggested-next tokenomics');

// "nou role" detectat
const newRoleOut = 'Cal afegir un nou role · responsable de risk · 1 cohort manager x.x.x';
const aRol = analyzeDeliverable({ output: newRoleOut, model: m1, project: proj });
t(aRol.enrichments.some(e => e.kind === 'suggest-role'),          'F · suggest-role pattern detectat');

// ─── G · applyEnrichmentsToProject ────────────────────────────────────────
const enr = [
    { kind: 'add-tag', target: 'project', payload: 'cohort-driven' },
    { kind: 'add-tag', target: 'project', payload: 'existing-tag' },   // ja existeix · skip
    { kind: 'evidence-cited' },
    { kind: 'suggest-role', payload: 'risk officer' },
];
const applied = applyEnrichmentsToProject({ project: proj, enrichments: enr });
t(applied.project.tags.includes('cohort-driven'),                 'G · tag nou afegit');
t(applied.project.tags.includes('existing-tag'),                  'G · tag existent preservat');
eq(applied.project.tags.length, 2,                                'G · sols 1 nou (dedupe)');
eq(applied.project._iLoopEvidenceCount, 1,                        'G · evidence count incrementat');
const mutKinds = applied.mutations.map(m => m.type);
t(mutKinds.includes('tag-added'),                                 'G · mutation tag-added');
t(mutKinds.includes('evidence-counted'),                          'G · mutation evidence-counted');
t(mutKinds.includes('role-suggested'),                            'G · mutation role-suggested');
// Immutability
t(applied.project !== proj,                                       'G · immutable · orig sense canvi');
eq(proj.tags.length, 1,                                           'G · orig tags inalterats');

// project required throws
threw = false;
try { applyEnrichmentsToProject({ enrichments: [] }); } catch (_) { threw = true; }
t(threw,                                                          'G · null project throws');

// ─── H · buildImprovementCycleNode ────────────────────────────────────────
const cycleNode = buildImprovementCycleNode({
    projectId: 'pX', iteration: 3, sourceSopId: 's2', woId: 'wo-x',
    deliverableOutput: 'out text', analysis: a1, modelId: m1.id,
    status: 'completed', log: [{ kind: 'a' }], ts: 1700000000000,
});
eq(cycleNode.type, IMPROVEMENT_CYCLE_TYPE,                        'H · type');
eq(cycleNode.projectId, 'pX',                                     'H · projectId');
eq(cycleNode.content.iteration, 3,                                'H · iteration');
eq(cycleNode.content.sourceSopId, 's2',                           'H · sourceSopId');
eq(cycleNode.content.woId, 'wo-x',                                'H · woId');
eq(cycleNode.content.modelId, m1.id,                              'H · modelId');
t(cycleNode.content.enrichments.length > 0,                       'H · enrichments anclats');
t(cycleNode.content.score > 0,                                    'H · score persisted');
t(Array.isArray(cycleNode.content.log),                           'H · log persisted');

// ─── I · runImprovementCycle · runner mock OK ─────────────────────────────
const okRunner = async ({ prompt, iteration }) => {
    return {
        output: 'Iter ' + iteration + ' · output amb cohort manager · 500€ mensual · stakeholder ' + prompt.slice(0, 30),
        costEur: 0.02,
    };
};

const r1 = await runImprovementCycle({
    project:    proj,
    sop:        sops[0],
    model:      m1,
    runner:     okRunner,
    iteration:  1,
    ts:         1700000000000,
});
eq(r1.ok, true,                                                   'I · cycle ok');
t(r1.wo && r1.wo.type === 'work_order',                           'I · wo retornat');
t(r1.cycle && r1.cycle.type === IMPROVEMENT_CYCLE_TYPE,           'I · cycle retornat');
eq(r1.cycle.content.status, 'completed',                          'I · cycle status completed');
t(r1.cycle.content.deliverableOutput.includes('cohort'),          'I · deliverableOutput captured');
t(Array.isArray(r1.mutations),                                    'I · mutations array');
t(r1.updatedProject !== proj,                                     'I · updatedProject immutable');
// WO marcat completed
eq(r1.wo.content.status, 'completed',                             'I · WO completed');

// Required arg validation
const noProj = await runImprovementCycle({ sop: sops[0], runner: okRunner });
eq(noProj.ok, false,                                              'I · no project · ok false');
const noSop  = await runImprovementCycle({ project: proj, runner: okRunner });
eq(noSop.ok, false,                                               'I · no sop · ok false');
const noRun  = await runImprovementCycle({ project: proj, sop: sops[0] });
eq(noRun.ok, false,                                               'I · no runner · ok false');

// ─── J · runImprovementCycle · evaluator gate · retry ─────────────────────
let attemptsSeen = 0;
const flakyRunner = async () => {
    attemptsSeen++;
    return { output: 'try-' + attemptsSeen + ' · cohort manager metric 100€', costEur: 0.01 };
};
const passOnSecond = async (output) => ({ ok: output.includes('try-2'), reason: 'need-try-2' });
const rEval = await runImprovementCycle({
    project:    proj,
    sop:        sops[0],
    model:      m1,
    runner:     flakyRunner,
    evaluator:  passOnSecond,
    iteration:  1,
});
eq(rEval.ok, true,                                                'J · retry · finally ok');
eq(attemptsSeen, 2,                                               'J · 2 attempts (1 fail · 1 ok)');

// Always fail evaluator · cycle status failed
const alwaysFail = async () => ({ ok: false, reason: 'always-fail' });
const rFail = await runImprovementCycle({
    project: proj, sop: sops[0], model: m1,
    runner: async () => ({ output: 'whatever' }),
    evaluator: alwaysFail,
});
eq(rFail.ok, false,                                               'J · always-fail · ok false');
eq(rFail.cycle.content.status, 'failed',                          'J · cycle status failed');

// Runner throws
const throwRunner = async () => { throw new Error('boom'); };
const rThrow = await runImprovementCycle({
    project: proj, sop: sops[0], model: m1, runner: throwRunner,
});
eq(rThrow.ok, false,                                              'J · runner throws · ok false');
t(rThrow.error.includes('runner-throw'),                          'J · error runner-throw');

// ─── K · runImprovementLoop · multi-iteració · context acumula ────────────
const seenIterations = [];
const trackingRunner = async ({ iteration, prevCycles }) => {
    seenIterations.push({ iter: iteration, prevCount: prevCycles.length });
    return { output: 'iter-' + iteration + ' · cohort manager · 1000€ revenue · transaction stakeholder', costEur: 0.01 };
};
const loop = await runImprovementLoop({
    project:       proj,
    sops,
    model:         m1,
    runner:        trackingRunner,
    maxIterations: 3,
    ts:            1700000000000,
});
eq(loop.ok, true,                                                 'K · loop ok');
eq(loop.iterations, 3,                                            'K · 3 iterations completades');
eq(loop.cycles.length, 3,                                         'K · 3 cycles');
// Context acumula · iter 2 ha de tenir 1 prev · iter 3 ha de tenir 2 prev
eq(seenIterations[0].prevCount, 0,                                'K · iter 1 · 0 prev');
eq(seenIterations[1].prevCount, 1,                                'K · iter 2 · 1 prev');
eq(seenIterations[2].prevCount, 2,                                'K · iter 3 · 2 prev');
t(loop.totalEnrichments > 0,                                      'K · enrichments acumulats');
// finalProject té tags mutats
t(loop.finalProject.tags.length >= proj.tags.length,              'K · finalProject tags ≥ original');

// ─── L · runImprovementLoop · sops empty · error ─────────────────────────
const loopEmpty = await runImprovementLoop({ project: proj, sops: [], runner: okRunner });
eq(loopEmpty.ok, false,                                           'L · sops empty · ok false');
t(loopEmpty.error.includes('sops-empty'),                         'L · error sops-empty');

// onIteration callback
const callbackEvents = [];
await runImprovementLoop({
    project: proj, sops, model: m1, runner: okRunner,
    maxIterations: 2,
    onIteration: (e) => callbackEvents.push({ iter: e.iteration, ok: e.ok }),
});
eq(callbackEvents.length, 2,                                      'L · onIteration cridat 2 cops');
t(callbackEvents.every(e => e.ok),                                'L · tots ok');

// Callback que throws · loop continua
const noisyCb = () => { throw new Error('boom'); };
const rNoisy = await runImprovementLoop({
    project: proj, sops, model: m1, runner: okRunner,
    maxIterations: 2,
    onIteration: noisyCb,
});
eq(rNoisy.iterations, 2,                                          'L · noisy callback · 2 iters tot bé');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
