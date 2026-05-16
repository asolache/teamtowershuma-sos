// NEURAL-PATH-001 sprint A · tests stand-alone per neuralPathService.
// Ús: node js/tests/neuralPath.test.js

import {
    NEURAL_PATH_STEP_TYPE, NEURAL_PATH_BUNDLE_TYPE,
    PATH_STEP_KINDS,
    buildNeuralPathStep, appendStep, queryStepsForOwner, purgeOldSteps,
    buildContextBundle, resolveBundleSteps, renderBundleAsContextString,
    summarizeStepsByKind, summarizeStepsByProject,
    PATH_STEP_RETENTION_DAYS,
} from '../core/neuralPathService.js';
import { CANONICAL_NODE_TYPES } from '../core/canonicalPrinciples.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== NEURAL-PATH-001 sprint A · neuralPathService ===\n');

// ─── A · constants exportades ───────────────────────────────────────────
eq(NEURAL_PATH_STEP_TYPE,    'neural_path_step',          'A · step type');
eq(NEURAL_PATH_BUNDLE_TYPE,  'neural_path_bundle',        'A · bundle type');
t(CANONICAL_NODE_TYPES.neural_path_step,                  'A · canonical · neural_path_step');
t(CANONICAL_NODE_TYPES.neural_path_bundle,                'A · canonical · neural_path_bundle');
t(typeof PATH_STEP_KINDS === 'object',                    'A · PATH_STEP_KINDS exportat');
t(PATH_STEP_KINDS.visit && PATH_STEP_KINDS['ai-fill'],    'A · kinds: visit + ai-fill');

// ─── B · buildNeuralPathStep ────────────────────────────────────────────
const step1 = buildNeuralPathStep({
    ownerHandle: 'alice',           // sense @ · normalitzat
    kind:        'visit',
    route:       '/quality?project=p-1',
    projectId:   'p-1',
    summary:     'Visita quality view',
});
eq(step1.type, 'neural_path_step',                        'B · type correcte');
eq(step1.content.ownerHandle, '@alice',                   'B · ownerHandle normalitzat amb @');
eq(step1.content.kind, 'visit',                           'B · kind preservat');
eq(step1.content.projectId, 'p-1',                        'B · projectId preservat');
t(step1.content.ts > 0,                                   'B · timestamp generat');
t(step1.keywords.includes('type:neural-path-step'),       'B · keyword type');
t(step1.keywords.includes('owner:@alice'),                'B · keyword owner');
t(step1.keywords.includes('kind:visit'),                  'B · keyword kind');
t(step1.keywords.includes('projectId:p-1'),               'B · keyword projectId');

// Step amb ref
const step2 = buildNeuralPathStep({
    ownerHandle: '@bob',
    kind:        'ai-fill',
    refType:     'ai_audit',
    refId:       'ai-audit-xyz',
    projectId:   'p-2',
    meta:        { dimId: 'landing', costEur: 0.005 },
});
eq(step2.content.refType, 'ai_audit',                     'B · refType');
eq(step2.content.refId,   'ai-audit-xyz',                 'B · refId');
t(step2.content.meta && step2.content.meta.dimId === 'landing', 'B · meta object preservat');
t(step2.keywords.includes('refType:ai_audit'),            'B · keyword refType');

let threw = null;
try { buildNeuralPathStep({}); } catch (e) { threw = e; }
t(threw && /ownerHandle/.test(threw.message),             'B · sense ownerHandle · throw');
threw = null;
try { buildNeuralPathStep({ ownerHandle: 'x', kind: 'invented-kind' }); } catch (e) { threw = e; }
t(threw && /unknown kind/.test(threw.message),            'B · kind invàlid · throw');

// Clipping de summary
const step3 = buildNeuralPathStep({
    ownerHandle: 'x', kind: 'visit',
    summary: 'a'.repeat(500),
});
eq(step3.content.summary.length, 240,                     'B · summary clipped a 240 chars');

// ─── C · appendStep · KB injectable ─────────────────────────────────────
const calls = { upserts: [] };
const mockKb = { upsert: async (n) => { calls.upserts.push(n); return n; } };
const res = await appendStep({
    kb: mockKb,
    ownerHandle: '@alvaro',
    kind: 'edit',
    refType: 'role',
    refId: 'r-1',
    projectId: 'p-3',
});
eq(calls.upserts.length, 1,                               'C · upsert cridat 1 cop');
eq(calls.upserts[0].type, NEURAL_PATH_STEP_TYPE,          'C · upsert · type correcte');
t(res && res.content.kind === 'edit',                     'C · retorna el step persistit');

// appendStep amb error de KB · retorna null sense throw
const failKb = { upsert: async () => { throw new Error('KB down'); } };
const resFail = await appendStep({ kb: failKb, ownerHandle: 'x', kind: 'visit' });
eq(resFail, null,                                         'C · KB fail · retorna null sense throw');

// ─── D · queryStepsForOwner ─────────────────────────────────────────────
const allStepsMock = [
    buildNeuralPathStep({ ownerHandle: '@alice', kind: 'visit', ts: 100 }),
    buildNeuralPathStep({ ownerHandle: '@bob',   kind: 'visit', ts: 200 }),
    buildNeuralPathStep({ ownerHandle: '@alice', kind: 'edit',  ts: 300 }),
    buildNeuralPathStep({ ownerHandle: '@alice', kind: 'ai-fill', ts: 400 }),
];
const mockKbQuery = { query: async ({ type }) => (type === NEURAL_PATH_STEP_TYPE ? allStepsMock : []) };
const aliceSteps = await queryStepsForOwner({ kb: mockKbQuery, ownerHandle: 'alice' });
eq(aliceSteps.length, 3,                                  'D · alice té 3 steps');
eq(aliceSteps[0].content.ts, 400,                         'D · ordenats DESC · primer és ts=400');
eq(aliceSteps[0].content.kind, 'ai-fill',                 'D · primer step kind ai-fill (més recent)');

// Limit
const limited = await queryStepsForOwner({ kb: mockKbQuery, ownerHandle: 'alice', limit: 2 });
eq(limited.length, 2,                                     'D · limit 2 respectat');

// ─── E · buildContextBundle ─────────────────────────────────────────────
const bundle = buildContextBundle({
    ownerHandle: 'alvaro',
    name:        'Landing context · Q2 2026',
    stepIds:     [step1.id, step2.id, step3.id],
    extraRefs:   { nodeIds: ['proj-1', 'wo-5'] },
    intent:      'generate-landing',
    audienceId:  'fundadors',
});
eq(bundle.type, NEURAL_PATH_BUNDLE_TYPE,                  'E · bundle type');
eq(bundle.content.ownerHandle, '@alvaro',                 'E · handle normalitzat');
eq(bundle.content.stepCount, 3,                           'E · stepCount agregat');
eq(bundle.content.intent, 'generate-landing',             'E · intent preservat');
eq(bundle.content.audienceId, 'fundadors',                'E · audienceId preservat');
t(Array.isArray(bundle.content.stepIds),                  'E · stepIds array');
eq(bundle.content.extraRefs.nodeIds.length, 2,            'E · extraRefs nodeIds');
eq(bundle.content.signature, null,                        'E · signature null · firmable sprint B');
t(bundle.keywords.includes('intent:generate-landing'),    'E · keyword intent');
t(bundle.keywords.includes('audience:fundadors'),         'E · keyword audience');

threw = null;
try { buildContextBundle({ ownerHandle: 'x', name: 'X', stepIds: [] }); } catch (e) { threw = e; }
t(threw && /stepIds/.test(threw.message),                 'E · stepIds buit · throw');

// ─── F · resolveBundleSteps ─────────────────────────────────────────────
const storedNodes = {
    [step1.id]: step1,
    [step2.id]: step2,
    'proj-1':   { id: 'proj-1', type: 'project', content: { name: 'Mi projecte' } },
};
const mockKbResolve = { getNode: async (id) => storedNodes[id] || null };
const resolved = await resolveBundleSteps({ kb: mockKbResolve, bundle });
eq(resolved.steps.length,      2,                         'F · 2 steps resolts');
eq(resolved.extraNodes.length, 1,                         'F · 1 extra node resolt (proj-1)');
eq(resolved.missing.length,    1,                         'F · 1 step missing (step3 not in store)');
t(resolved.missing[0] === step3.id,                       'F · missing id correcte');

// ─── G · renderBundleAsContextString · output IA-friendly ──────────────
const str = renderBundleAsContextString({
    bundle,
    steps:      resolved.steps,
    extraNodes: resolved.extraNodes,
});
t(typeof str === 'string' && str.length > 100,            'G · output string');
t(str.includes('Landing context · Q2 2026'),              'G · inclou bundle name');
t(str.includes('Intent · generate-landing'),              'G · inclou intent');
t(str.includes('Audience · fundadors'),                   'G · inclou audience');
t(str.includes('Historial nodal'),                        'G · secció historial');
t(str.includes('Refs addicionals'),                       'G · secció extras');

// ─── H · summarizers per a stats UI ────────────────────────────────────
const sample = [
    buildNeuralPathStep({ ownerHandle: 'a', kind: 'visit', projectId: 'p1' }),
    buildNeuralPathStep({ ownerHandle: 'a', kind: 'visit', projectId: 'p1' }),
    buildNeuralPathStep({ ownerHandle: 'a', kind: 'edit',  projectId: 'p2' }),
    buildNeuralPathStep({ ownerHandle: 'a', kind: 'ai-fill', projectId: 'p1' }),
];
const byKind = summarizeStepsByKind(sample);
eq(byKind.visit, 2,                                       'H · 2 visits');
eq(byKind.edit, 1,                                        'H · 1 edit');
eq(byKind['ai-fill'], 1,                                  'H · 1 ai-fill');

const byProj = summarizeStepsByProject(sample);
eq(byProj.p1, 3,                                          'H · p1 · 3 steps');
eq(byProj.p2, 1,                                          'H · p2 · 1 step');

// ─── I · purgeOldSteps · TTL retention ─────────────────────────────────
// Backlog · wo-attestation-mock (renombrat) · purga steps >90d sense
// trencar bundles ja firmats.
const now = Date.now();
const DAY = 24 * 3600 * 1000;
const stepsKb = (() => {
    const store = new Map();
    return {
        nodes: store,
        upsert: async (n) => { store.set(n.id, n); return n; },
        query: async ({ type }) => Array.from(store.values()).filter(n => n.type === type),
        deleteNode: async (id) => { store.delete(id); return true; },
    };
})();
// 3 steps molt antics (200 dies) + 2 recents (1 dia)
await stepsKb.upsert(buildNeuralPathStep({ ownerHandle: '@a', kind: 'visit', ts: now - 200 * DAY }));
await stepsKb.upsert(buildNeuralPathStep({ ownerHandle: '@a', kind: 'edit',  ts: now - 200 * DAY }));
await stepsKb.upsert(buildNeuralPathStep({ ownerHandle: '@b', kind: 'visit', ts: now - 200 * DAY }));
await stepsKb.upsert(buildNeuralPathStep({ ownerHandle: '@a', kind: 'visit', ts: now - 1 * DAY }));
await stepsKb.upsert(buildNeuralPathStep({ ownerHandle: '@a', kind: 'publish', ts: now }));

// I1 · dryRun · compta sense esborrar
const dry = await purgeOldSteps({ kb: stepsKb, retentionDays: 90, nowTs: now, dryRun: true });
eq(dry.purgedCount, 3,                                    'I1 · dryRun · 3 antics comptats');
eq(dry.retainedCount, 2,                                  'I1 · dryRun · 2 recents retinguts');
eq(stepsKb.nodes.size, 5,                                 'I1 · dryRun · res esborrat realment');

// I2 · real purge · esborra els 3 antics
const real = await purgeOldSteps({ kb: stepsKb, retentionDays: 90, nowTs: now });
eq(real.purgedCount, 3,                                   'I2 · 3 esborrats');
eq(real.retainedCount, 2,                                 'I2 · 2 retinguts');
eq(stepsKb.nodes.size, 2,                                 'I2 · KB ara té 2 nodes');
t(real.errors.length === 0,                               'I2 · sense errors');

// I3 · idempotent · 2a crida no esborra res
const second = await purgeOldSteps({ kb: stepsKb, retentionDays: 90, nowTs: now });
eq(second.purgedCount, 0,                                 'I3 · idempotent · 0 esborrats');
eq(stepsKb.nodes.size, 2,                                 'I3 · KB intacta');

// I4 · ownerHandle filter · sols esborra d'un usuari
await stepsKb.upsert(buildNeuralPathStep({ ownerHandle: '@x', kind: 'visit', ts: now - 200 * DAY }));
await stepsKb.upsert(buildNeuralPathStep({ ownerHandle: '@y', kind: 'visit', ts: now - 200 * DAY }));
const onlyX = await purgeOldSteps({ kb: stepsKb, retentionDays: 90, nowTs: now, ownerHandle: '@x' });
eq(onlyX.purgedCount, 1,                                  'I4 · sols @x esborrat');
t(Array.from(stepsKb.nodes.values()).some(n => n?.content?.ownerHandle === '@y'), 'I4 · @y intacte');

// I5 · default retention · PATH_STEP_RETENTION_DAYS=90
eq(PATH_STEP_RETENTION_DAYS, 90,                          'I5 · default retention 90 dies');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
