// =============================================================================
// valueFlow.test.js · VALUE-FLOW sprint A · DAG schema + topoSort + cycle
// =============================================================================

import {
    VALUE_FLOW_TYPE, SUGGESTED_ROLE_KINDS,
    buildEmptyValueFlow,
    validateValueFlow,
    topologicalLevels,
    addRole, addDeliverable, addTransaction,
    estimateFlowComplexity,
} from '../core/valueFlowService.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

// ─── A · constants + buildEmpty ───────────────────────────────────────────
eq(VALUE_FLOW_TYPE, 'value_flow',                                 'A · TYPE constant');
t(SUGGESTED_ROLE_KINDS.includes('architect'),                     'A · architect a suggested');
t(SUGGESTED_ROLE_KINDS.includes('coder'),                         'A · coder a suggested');
t(SUGGESTED_ROLE_KINDS.includes('reviewer'),                      'A · reviewer a suggested');

const empty = buildEmptyValueFlow({ title: 'T1', projectId: 'p1', ts: 1700000000000 });
eq(empty.type, VALUE_FLOW_TYPE,                                   'A · empty.type');
eq(empty.projectId, 'p1',                                         'A · projectId');
eq(empty.content.title, 'T1',                                     'A · title');
eq(empty.content.roles.length, 0,                                 'A · roles []');
eq(empty.content.transactions.length, 0,                          'A · tx []');
eq(empty.content.deliverables.length, 0,                          'A · deliverables []');
eq(empty.createdAt, 1700000000000,                                'A · createdAt');
t(typeof empty.id === 'string' && empty.id.length > 6,            'A · id auto-generat');

// ─── B · validateValueFlow · happy path ───────────────────────────────────
const ok = validateValueFlow(empty);
eq(ok.ok, true,                                                   'B · empty flow valid');
eq(ok.errors.length, 0,                                           'B · zero errors');

// missing content
eq(validateValueFlow(null).ok, false,                             'B · null invalid');
eq(validateValueFlow({}).ok, false,                               'B · no content invalid');

// ─── C · addRole + immutability ───────────────────────────────────────────
const fA = addRole(empty, { id: 'r-architect', kind: 'architect', label: 'Arch' });
eq(fA.content.roles.length, 1,                                    'C · 1 role afegit');
eq(fA.content.roles[0].id, 'r-architect',                         'C · id correcte');
eq(empty.content.roles.length, 0,                                 'C · immutable · original sense canviar');

let threw = false;
try { addRole(empty, { id: 'x' }); } catch (_) { threw = true; }
t(threw,                                                          'C · throw quan falta kind');

// ─── D · validate · roles duplicats ───────────────────────────────────────
const fDup = addRole(fA, { id: 'r-architect', kind: 'architect' });
const dupVal = validateValueFlow(fDup);
eq(dupVal.ok, false,                                              'D · dup roles invalid');
t(dupVal.errors.some(e => e.includes('role-duplicate')),          'D · error role-duplicate-id');

// ─── E · addDeliverable + validate ────────────────────────────────────────
const fC1 = addRole(fA, { id: 'r-coder', kind: 'coder' });
const fD1 = addDeliverable(fC1, { id: 'd-plan',    producer: 'r-architect', consumers: ['r-coder'] });
const fD2 = addDeliverable(fD1, { id: 'd-code',    producer: 'r-coder',     consumers: [] });
const eVal = validateValueFlow(fD2);
eq(eVal.ok, true,                                                 'E · simple DAG valid');

// bad producer
const fBad = addDeliverable(fA, { id: 'd-x', producer: 'r-nonexistent', consumers: [] });
const badVal = validateValueFlow(fBad);
eq(badVal.ok, false,                                              'E · bad producer invalid');
t(badVal.errors.some(e => e.includes('bad-producer')),            'E · error bad-producer');

// ─── F · addTransaction + validate ────────────────────────────────────────
const fT1 = addTransaction(fD2, { id: 'tx1', from: 'r-architect', to: 'r-coder', deliverable: 'd-plan' });
const tVal = validateValueFlow(fT1);
eq(tVal.ok, true,                                                 'F · tx valid');

// bad tx · deliverable inexistent
const fTBad = addTransaction(fD2, { id: 'tx-bad', from: 'r-architect', to: 'r-coder', deliverable: 'd-nope' });
eq(validateValueFlow(fTBad).ok, false,                            'F · bad deliverable tx invalid');

// ─── G · topologicalLevels · simple seq ───────────────────────────────────
const levels1 = topologicalLevels(fD2);
eq(levels1.length, 2,                                             'G · 2 levels seq architect→coder');
t(levels1[0].includes('d-plan'),                                  'G · level 0 té d-plan');
t(levels1[1].includes('d-code'),                                  'G · level 1 té d-code');

// ─── H · topologicalLevels · paral·lel ────────────────────────────────────
// Flow ·  architect produeix d-plan
//         designer  produeix d-mockup     (paral·lel a d-plan)
//         coder consumeix d-plan + d-mockup → d-code
let fH = empty;
fH = addRole(fH, { id: 'r-architect', kind: 'architect' });
fH = addRole(fH, { id: 'r-designer',  kind: 'designer'  });
fH = addRole(fH, { id: 'r-coder',     kind: 'coder'     });
fH = addDeliverable(fH, { id: 'd-plan',   producer: 'r-architect', consumers: ['r-coder'] });
fH = addDeliverable(fH, { id: 'd-mockup', producer: 'r-designer',  consumers: ['r-coder'] });
fH = addDeliverable(fH, { id: 'd-code',   producer: 'r-coder',     consumers: [] });

const levelsH = topologicalLevels(fH);
eq(levelsH.length, 2,                                             'H · 2 levels (paral·lel + seq)');
eq(levelsH[0].length, 2,                                          'H · level 0 té 2 deliverables (paral·lel)');
t(levelsH[0].includes('d-plan') && levelsH[0].includes('d-mockup'), 'H · paral·lel d-plan + d-mockup');
eq(levelsH[1].length, 1,                                          'H · level 1 té 1 (d-code)');
eq(levelsH[1][0], 'd-code',                                       'H · d-code és level 1');

// ─── I · cycle detection ──────────────────────────────────────────────────
// d-a producer r1 · consumer r2  · d-b producer r2 · consumer r1 → cicle
let fCyc = empty;
fCyc = addRole(fCyc, { id: 'r1', kind: 'a' });
fCyc = addRole(fCyc, { id: 'r2', kind: 'b' });
fCyc = addDeliverable(fCyc, { id: 'd-a', producer: 'r1', consumers: ['r2'] });
fCyc = addDeliverable(fCyc, { id: 'd-b', producer: 'r2', consumers: ['r1'] });
const cycVal = validateValueFlow(fCyc);
eq(cycVal.ok, false,                                              'I · cycle invalid');
t(cycVal.errors.some(e => e.includes('cycle')),                   'I · error dag-cycle-detected');

let threwI = false;
try { topologicalLevels(fCyc); } catch (e) { threwI = true; t(e.message.includes('cycle'), 'I · topo throws amb cycle msg'); }
t(threwI,                                                         'I · topo throws en cycle');

// ─── J · estimateFlowComplexity ───────────────────────────────────────────
const cEmpty = estimateFlowComplexity(empty);
eq(cEmpty.score, 0,                                               'J · empty score 0');
eq(cEmpty.levels, 0,                                              'J · empty levels 0');

const cSimple = estimateFlowComplexity(fD2);
t(cSimple.score > 0,                                              'J · simple score > 0');
eq(cSimple.levels, 2,                                             'J · simple levels 2');
eq(cSimple.maxParallel, 1,                                        'J · simple maxParallel 1');

const cParallel = estimateFlowComplexity(fH);
eq(cParallel.maxParallel, 2,                                      'J · parallel maxParallel 2');
t(cParallel.score > cSimple.score,                                'J · parallel score > simple');

const cCyc = estimateFlowComplexity(fCyc);
eq(cCyc.error, 'cycle',                                           'J · cycle error tag');
eq(cCyc.score, 100,                                               'J · cycle score 100 (penalitzat)');

// ─── K · empty deliverables · topo retorna [] ─────────────────────────────
eq(topologicalLevels(buildEmptyValueFlow()).length, 0,            'K · no deliverables → []');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
