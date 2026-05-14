// =============================================================================
// swarmParallelFlow.test.js · SWARM-PARALLEL sprint A · DAG executor tests
// =============================================================================

import {
    SWARM_RUN_TYPE,
    runValueFlow,
    buildSwarmRunNode,
} from '../core/swarmParallelFlow.js';
import {
    buildEmptyValueFlow, addRole, addDeliverable, addTransaction,
} from '../core/valueFlowService.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');
const near = (a, b, eps, msg) => t(Math.abs(a - b) < eps, msg + ' (~' + b + ', got ' + a + ')');

// Helper · construeix un flow architect → coder
function flowArchitectCoder() {
    let f = buildEmptyValueFlow({ id: 'f1', projectId: 'p1', title: 'Test flow', ts: 1700000000000 });
    f = addRole(f, { id: 'r-arch', kind: 'architect', label: 'Arch' });
    f = addRole(f, { id: 'r-coder', kind: 'coder', label: 'Coder' });
    f = addDeliverable(f, { id: 'd-plan', producer: 'r-arch', consumers: ['r-coder'], description: 'Plan tècnic' });
    f = addDeliverable(f, { id: 'd-code', producer: 'r-coder', consumers: [], description: 'Codi implementat' });
    f = addTransaction(f, { id: 'tx1', from: 'r-arch', to: 'r-coder', deliverable: 'd-plan' });
    return f;
}

// Helper · construeix mock runner determinista amb cost fix
function mockRunner({ cost = 0.05, failIds = [], slowIds = [] } = {}) {
    return async ({ prompt, deliverable }) => {
        if (failIds.includes(deliverable.id)) throw new Error('mock-fail');
        if (slowIds.includes(deliverable.id)) await new Promise(r => setTimeout(r, 30));
        const upstream = (prompt.match(/### d-/g) || []).length;
        return {
            output: 'output for ' + deliverable.id + (upstream ? ' · upstream-count=' + upstream : ''),
            costEur: cost,
            modelKey: 'mock-model',
            usage: { totalTokens: 100 },
        };
    };
}

// ─── A · constants + arg validation ───────────────────────────────────────
eq(SWARM_RUN_TYPE, 'swarm_flow_run',                              'A · RUN_TYPE');

const noFlow = await runValueFlow({ runner: mockRunner() });
eq(noFlow.ok, false,                                              'A · no flow · ok false');
t(noFlow.errors.some(e => e.message.includes('flow')),            'A · error flow required');

const noRunner = await runValueFlow({ flow: flowArchitectCoder() });
eq(noRunner.ok, false,                                            'A · no runner · ok false');
t(noRunner.errors.some(e => e.message.includes('runner')),        'A · error runner required');

// ─── B · simple seq · 2 levels architect→coder ────────────────────────────
const f1 = flowArchitectCoder();
const r1 = await runValueFlow({ flow: f1, runner: mockRunner({ cost: 0.10 }) });
eq(r1.ok, true,                                                   'B · seq · ok');
eq(r1.levelsExecuted, 2,                                          'B · 2 levels');
eq(r1.results.size, 2,                                            'B · 2 results');
const planRes = r1.results.get('d-plan');
const codeRes = r1.results.get('d-code');
t(planRes.output.includes('d-plan'),                              'B · plan output set');
t(codeRes.output.includes('d-code'),                              'B · code output set');
near(r1.totalCostEur, 0.20, 0.001,                                'B · totalCostEur 0.20 (0.10 * 2)');
eq(r1.errors.length, 0,                                           'B · zero errors');
t(planRes.level < codeRes.level,                                  'B · plan level < code level (DAG order)');

// ─── C · contextOutputs passat al downstream ──────────────────────────────
// d-code prompt ha de tenir upstream d-plan output com a context
let promptsSeen = [];
const captureRunner = async ({ prompt, deliverable }) => {
    promptsSeen.push({ id: deliverable.id, prompt });
    return { output: 'mock-' + deliverable.id, costEur: 0.01 };
};
const r2 = await runValueFlow({ flow: f1, runner: captureRunner });
eq(r2.ok, true,                                                   'C · capture ok');
const codePrompt = promptsSeen.find(p => p.id === 'd-code')?.prompt;
t(codePrompt.includes('d-plan'),                                  'C · d-code prompt menciona d-plan');
t(codePrompt.includes('mock-d-plan'),                             'C · d-code prompt inclou OUTPUT d-plan');
const planPrompt = promptsSeen.find(p => p.id === 'd-plan')?.prompt;
t(!planPrompt.includes('Context · outputs upstream'),             'C · d-plan sense context (level 0)');

// ─── D · parallel · 2 deliverables al mateix level ────────────────────────
let f2 = buildEmptyValueFlow({ id: 'f2', projectId: 'p2' });
f2 = addRole(f2, { id: 'r-arch', kind: 'architect' });
f2 = addRole(f2, { id: 'r-design', kind: 'designer' });
f2 = addRole(f2, { id: 'r-coder', kind: 'coder' });
f2 = addDeliverable(f2, { id: 'd-plan',   producer: 'r-arch',   consumers: ['r-coder'] });
f2 = addDeliverable(f2, { id: 'd-mockup', producer: 'r-design', consumers: ['r-coder'] });
f2 = addDeliverable(f2, { id: 'd-code',   producer: 'r-coder',  consumers: [] });
// Sense transactions per simplicitat (no calen per a executar)

const r3 = await runValueFlow({ flow: f2, runner: mockRunner({ cost: 0.05 }) });
eq(r3.ok, true,                                                   'D · parallel · ok');
eq(r3.levelsExecuted, 2,                                          'D · 2 levels');
eq(r3.results.size, 3,                                            'D · 3 results');
const planL = r3.results.get('d-plan').level;
const mockupL = r3.results.get('d-mockup').level;
const codeL = r3.results.get('d-code').level;
eq(planL, mockupL,                                                'D · plan + mockup SAME level (paral·lel)');
t(codeL > planL,                                                  'D · code level > plan level');
near(r3.totalCostEur, 0.15, 0.001,                                'D · 3 × 0.05 = 0.15');

// d-code rep AMBDÓS upstream (plan + mockup) via prompt
let promptsP = [];
await runValueFlow({ flow: f2, runner: async ({ prompt, deliverable }) => {
    promptsP.push({ id: deliverable.id, prompt });
    return { output: 'OUT-' + deliverable.id, costEur: 0.01 };
}});
const codeP = promptsP.find(p => p.id === 'd-code')?.prompt;
t(codeP.includes('d-plan'),                                       'D · code prompt inclou plan');
t(codeP.includes('d-mockup'),                                     'D · code prompt inclou mockup');

// ─── E · parallel execution · temps reduït (timing) ──────────────────────
// Si 3 deliverables al mateix level i cadascun triga 30ms · paral·lel hauria
// de fer-ho en ~30ms · no ~90ms.
let fPar = buildEmptyValueFlow({ id: 'fp' });
fPar = addRole(fPar, { id: 'r1', kind: 'x' });
fPar = addRole(fPar, { id: 'r2', kind: 'y' });
fPar = addRole(fPar, { id: 'r3', kind: 'z' });
fPar = addDeliverable(fPar, { id: 'd1', producer: 'r1', consumers: [] });
fPar = addDeliverable(fPar, { id: 'd2', producer: 'r2', consumers: [] });
fPar = addDeliverable(fPar, { id: 'd3', producer: 'r3', consumers: [] });
const slowRunner = async ({ deliverable }) => {
    await new Promise(r => setTimeout(r, 40));
    return { output: 'slow-' + deliverable.id, costEur: 0.01 };
};
const tStart = Date.now();
const rPar = await runValueFlow({ flow: fPar, runner: slowRunner });
const elapsed = Date.now() - tStart;
eq(rPar.ok, true,                                                 'E · slow flow ok');
t(elapsed < 100,                                                  'E · 3 × 40ms paral·lel < 100ms (actually ' + elapsed + 'ms)');

// ─── F · retry on eval-fail · attempts cap ────────────────────────────────
let attemptsByDel = new Map();
const flakyRunner = async ({ deliverable, attempt }) => {
    attemptsByDel.set(deliverable.id, attempt);
    return { output: 'attempt-' + attempt, costEur: 0.01 };
};
const strictEvaluator = async (output) => {
    if (output.includes('attempt-3')) return { ok: true };
    return { ok: false, reason: 'not-attempt-3' };
};
// maxRetries=3 · primer attempt no passa · seguim fins attempt-3
const rRetry = await runValueFlow({
    flow:             flowArchitectCoder(),
    runner:           flakyRunner,
    evaluator:        strictEvaluator,
    maxRetriesPerDel: 3,
});
t(rRetry.ok,                                                      'F · retry · finally ok');
const planAttempts = rRetry.results.get('d-plan').attempts;
eq(planAttempts, 3,                                               'F · 3 attempts fins eval ok');

// Esgota retries · falla
const alwaysFailEvaluator = async () => ({ ok: false, reason: 'always-fail' });
const rFail = await runValueFlow({
    flow:             flowArchitectCoder(),
    runner:           flakyRunner,
    evaluator:        alwaysFailEvaluator,
    maxRetriesPerDel: 1,
});
eq(rFail.ok, false,                                               'F · always-fail evaluator · ok false');
t(rFail.errors.length > 0,                                        'F · errors registered');

// ─── G · budget exceeded · stop ──────────────────────────────────────────
// Budget 0.01 · costEur 0.10 · després del primer deliverable ja superat
const rBudget = await runValueFlow({
    flow:      flowArchitectCoder(),
    runner:    mockRunner({ cost: 0.10 }),
    budgetEur: 0.05,
});
eq(rBudget.budgetExceeded, true,                                  'G · budgetExceeded true');
t(rBudget.results.size < 2,                                       'G · sols 1 result · stop abans del segon level');
t(rBudget.totalCostEur >= 0.10,                                   'G · cost incurred del primer level');

// ─── H · onLevelStart + onDeliverableDone callbacks ──────────────────────
const events = [];
await runValueFlow({
    flow:              flowArchitectCoder(),
    runner:            mockRunner({ cost: 0.01 }),
    onLevelStart:      (e) => events.push({ kind: 'level', ...e }),
    onDeliverableDone: (e) => events.push({ kind: 'del', ...e }),
});
const levelEvents = events.filter(e => e.kind === 'level');
const delEvents   = events.filter(e => e.kind === 'del');
eq(levelEvents.length, 2,                                         'H · 2 onLevelStart calls');
eq(delEvents.length, 2,                                           'H · 2 onDeliverableDone calls');
t(delEvents.every(e => e.status === 'ok'),                        'H · tots status ok');

// Callback que llança · no atura el flow
const noisyCallback = () => { throw new Error('boom'); };
const rNoisy = await runValueFlow({
    flow:              flowArchitectCoder(),
    runner:            mockRunner({ cost: 0.01 }),
    onLevelStart:      noisyCallback,
    onDeliverableDone: noisyCallback,
});
eq(rNoisy.ok, true,                                               'H · callback throws · flow continua');

// ─── I · signer · attestation opcional ────────────────────────────────────
const mockSigner = async (output, deliverable, role) => 'SIG-' + deliverable.id + '-by-' + role.id;
const rSign = await runValueFlow({
    flow:   flowArchitectCoder(),
    runner: mockRunner({ cost: 0.01 }),
    signer: mockSigner,
});
eq(rSign.ok, true,                                                'I · signer · ok');
eq(rSign.results.get('d-plan').signature, 'SIG-d-plan-by-r-arch', 'I · signature anclada');
eq(rSign.results.get('d-code').signature, 'SIG-d-code-by-r-coder', 'I · code signature');

// Signer que throws · output preserved · signature null
const throwSigner = async () => { throw new Error('sign-fail'); };
const rThrow = await runValueFlow({
    flow:   flowArchitectCoder(),
    runner: mockRunner({ cost: 0.01 }),
    signer: throwSigner,
});
eq(rThrow.ok, true,                                               'I · signer throws · flow continua');
eq(rThrow.results.get('d-plan').signature, null,                  'I · signature null si throws');

// ─── J · cycle detection · refusa abans d'executar ───────────────────────
let fCyc = buildEmptyValueFlow({ id: 'fc' });
fCyc = addRole(fCyc, { id: 'r1', kind: 'a' });
fCyc = addRole(fCyc, { id: 'r2', kind: 'b' });
fCyc = addDeliverable(fCyc, { id: 'd-a', producer: 'r1', consumers: ['r2'] });
fCyc = addDeliverable(fCyc, { id: 'd-b', producer: 'r2', consumers: ['r1'] });

const rCyc = await runValueFlow({ flow: fCyc, runner: mockRunner() });
eq(rCyc.ok, false,                                                'J · cycle · ok false');
t(rCyc.errors.some(e => e.message.includes('cycle')),             'J · error cycle');

// ─── K · log entries ─────────────────────────────────────────────────────
const rLog = await runValueFlow({ flow: flowArchitectCoder(), runner: mockRunner({ cost: 0.01 }) });
t(rLog.log.length >= 4,                                           'K · log inclou >=4 events');
t(rLog.log.some(l => l.kind === 'level-start'),                   'K · log inclou level-start');
t(rLog.log.some(l => l.kind === 'deliverable-done'),              'K · log inclou deliverable-done');
t(typeof rLog.startedAt === 'string' && typeof rLog.finishedAt === 'string',
                                                                  'K · startedAt + finishedAt ISO');
t(typeof rLog.durationMs === 'number' && rLog.durationMs >= 0,    'K · durationMs');

// ─── L · buildSwarmRunNode · persistible al KB ───────────────────────────
const node = buildSwarmRunNode({ result: rLog, flowId: 'f1', projectId: 'p1', ts: 1700000000000 });
eq(node.type, SWARM_RUN_TYPE,                                     'L · node type');
eq(node.projectId, 'p1',                                          'L · projectId');
eq(node.content.flowId, 'f1',                                     'L · flowId');
eq(typeof node.content.results, 'object',                         'L · results serialitzats (Map→Object)');
t('d-plan' in node.content.results,                               'L · d-plan al results object');
eq(node.content.ok, true,                                         'L · ok=true');
t(typeof node.content.totalCostEur === 'number',                  'L · totalCostEur preserved');
t(Array.isArray(node.content.log),                                'L · log preserved');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
