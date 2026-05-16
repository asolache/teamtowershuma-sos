// VALUE-FLOW-RUBRIC-001 · tests del rubric auditable · 12 criteris · 100 punts
// Veure `docs/STUDY-value-flow-audit-2026-05-15.md` §2.

import {
    RUBRIC, RUBRIC_VERSION, RUBRIC_THRESHOLDS, CANONICAL_ROLE_KINDS,
    evaluateRubric, fromProject, fromValueFlow, PREDICATES,
} from '../core/valueFlowRubricService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== VALUE-FLOW-RUBRIC-001 ===\n');

// ─── A · estructura del rubric ────────────────────────────────────────────
eq(RUBRIC_VERSION, '1.0',                                'A · version v1.0');
t(typeof RUBRIC === 'object',                            'A · RUBRIC exportat');
t(Array.isArray(RUBRIC.criteria),                        'A · criteris array');
eq(RUBRIC.criteria.length, 12,                           'A · 12 criteris');

// Pesos sumen 100
const totalWeight = RUBRIC.criteria.reduce((s, c) => s + c.weight, 0);
eq(totalWeight, 100,                                     'A · pesos sumen 100');

// IDs únics C1..C12
const ids = new Set(RUBRIC.criteria.map(c => c.id));
eq(ids.size, 12,                                         'A · IDs únics');
for (let i = 1; i <= 12; i++) {
    t(ids.has('C' + i),                                  'A · C' + i + ' present');
}

// Cada criteri ben format
for (const c of RUBRIC.criteria) {
    t(c.id && c.weight > 0 && c.predicate && c.label && c.fix, 'A · ' + c.id + ' ben format');
    t(typeof PREDICATES[c.predicate] === 'function',     'A · predicate ' + c.predicate + ' registrat');
}

// Thresholds canònics
eq(RUBRIC_THRESHOLDS.gold, 85,                           'A · gold≥85');
eq(RUBRIC_THRESHOLDS.silver, 70,                         'A · silver≥70');
eq(RUBRIC_THRESHOLDS.bronze, 50,                         'A · bronze≥50');

// Canonical role kinds
t(CANONICAL_ROLE_KINDS.includes('architect'),            'A · canonical kind architect');
t(CANONICAL_ROLE_KINDS.includes('coder'),                'A · canonical kind coder');
t(CANONICAL_ROLE_KINDS.includes('visioner'),             'A · canonical kind visioner (VNA)');

// ─── B · adapters · fromProject ────────────────────────────────────────────
const projectMax = {
    id: 'proj-x',
    vna_roles: [
        { id: 'r1', kind: 'architect', castell_level: 'castell' },
        { id: 'r2', kind: 'coder',     castell_level: 'castell' },
        { id: 'r3', kind: 'reviewer',  castell_level: 'cim' },
    ],
    vna_transactions: [
        { id: 't1', from: 'r1', to: 'r2', deliverable: 'spec', type: 'tangible' },
        { id: 't2', from: 'r2', to: 'r3', deliverable: 'code', type: 'tangible' },
    ],
};
const adapted = fromProject(projectMax);
eq(adapted.roles.length, 3,                              'B · fromProject · roles count');
eq(adapted.transactions.length, 2,                       'B · fromProject · transactions count');
t(adapted.deliverables.length >= 2,                      'B · fromProject · deliverables implicits derivats');
t(adapted.deliverables.every(d => d._implicit),          'B · fromProject · marca _implicit als derivats');

// fromValueFlow
const flow = { content: { roles: [{ id: 'a', kind: 'pm' }], transactions: [], deliverables: [] } };
const adaptedFlow = fromValueFlow(flow);
eq(adaptedFlow.roles.length, 1,                          'B · fromValueFlow · roles');
eq(adaptedFlow.transactions.length, 0,                   'B · fromValueFlow · txs buit ok');

// Null safety
const empty = fromProject(null);
eq(empty.roles.length, 0,                                'B · fromProject(null) → buit');
const emptyFlow = fromValueFlow(null);
eq(emptyFlow.roles.length, 0,                            'B · fromValueFlow(null) → buit');

// ─── C · predicate C1 · rolesMinCanonical ─────────────────────────────────
const passRoles = { roles: [
    { id: 'r1', kind: 'architect' }, { id: 'r2', kind: 'coder' }, { id: 'r3', kind: 'reviewer' },
] };
let r = PREDICATES.rolesMinCanonical({ input: passRoles, params: { min: 3 } });
t(r.passed && r.score === 100,                           'C · C1 · 3 roles canonical · pass 100');

r = PREDICATES.rolesMinCanonical({ input: { roles: [{ id: 'r1', kind: 'architect' }] }, params: { min: 3 } });
t(!r.passed && r.score < 100,                            'C · C1 · 1 rol · fail amb score parcial');

r = PREDICATES.rolesMinCanonical({ input: { roles: [
    { id: 'r1', kind: 'other' }, { id: 'r2', kind: 'coder' }, { id: 'r3', kind: 'qa' },
] }, params: { min: 3 } });
t(!r.passed && r.score === 60,                           'C · C1 · té kind:other · score 60');

// ─── D · predicate C2 · castellLevelsDiversity ────────────────────────────
r = PREDICATES.castellLevelsDiversity({ input: { roles: [
    { id: 'r1', castell_level: 'canalla' }, { id: 'r2', castell_level: 'castell' },
] }, params: { min: 2 } });
t(r.passed && r.score === 100,                           'D · C2 · 2 levels · pass');

r = PREDICATES.castellLevelsDiversity({ input: { roles: [
    { id: 'r1', castell_level: 'castell' }, { id: 'r2', castell_level: 'castell' },
] }, params: { min: 2 } });
t(!r.passed,                                             'D · C2 · 1 level · fail');

// ─── E · predicate C3 · deliverablePerRole ───────────────────────────────
r = PREDICATES.deliverablePerRole({ input: {
    roles: [{ id: 'r1' }, { id: 'r2' }],
    deliverables: [{ id: 'd1', producer: 'r1' }, { id: 'd2', producer: 'r2' }],
}, params: { min: 1 } });
t(r.passed && r.score === 100,                           'E · C3 · cada rol amb deliverable · pass');

r = PREDICATES.deliverablePerRole({ input: {
    roles: [{ id: 'r1' }, { id: 'r2' }],
    deliverables: [{ id: 'd1', producer: 'r1' }],
}, params: { min: 1 } });
t(!r.passed && r.score === 50,                           'E · C3 · 1 de 2 · score 50');

// ─── F · predicate C4 · deliverableWithValidator ─────────────────────────
r = PREDICATES.deliverableWithValidator({ input: {
    deliverables: [{ id: 'd1', validator: 'qa' }, { id: 'd2', validator: 'reviewer' }],
}, params: { minRatio: 0.5 } });
t(r.passed && r.score === 100,                           'F · C4 · 100% amb validator · pass');

r = PREDICATES.deliverableWithValidator({ input: {
    deliverables: [{ id: 'd1' }, { id: 'd2' }, { id: 'd3', validator: 'qa' }, { id: 'd4', validator: 'qa' }],
}, params: { minRatio: 0.5 } });
t(r.passed,                                              'F · C4 · 50% · pass exacte');

// ─── G · predicate C5 · transactionsMin ──────────────────────────────────
r = PREDICATES.transactionsMin({ input: { transactions: new Array(5).fill({}) }, params: { min: 5 } });
t(r.passed && r.score === 100,                           'G · C5 · 5 txs · pass');

r = PREDICATES.transactionsMin({ input: { transactions: new Array(2).fill({}) }, params: { min: 5 } });
t(!r.passed && r.score === 40,                           'G · C5 · 2 de 5 · score 40');

// ─── H · predicate C6 · tangibleIntangibleMix ─────────────────────────────
r = PREDICATES.tangibleIntangibleMix({ input: {
    transactions: [{ type: 'tangible' }, { type: 'intangible' }],
} });
t(r.passed && r.score === 100,                           'H · C6 · mix tangible+intangible · pass');

r = PREDICATES.tangibleIntangibleMix({ input: {
    transactions: [{ type: 'tangible' }, { type: 'tangible' }],
} });
t(!r.passed && r.score === 50,                           'H · C6 · només tangible · 50');

r = PREDICATES.tangibleIntangibleMix({ input: { transactions: [] } });
t(!r.passed && r.score === 0,                            'H · C6 · cap tx · 0');

// ─── I · predicate C7 · reciprocalCycle ──────────────────────────────────
r = PREDICATES.reciprocalCycle({ input: {
    transactions: [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }],
} });
t(r.passed,                                              'I · C7 · A→B + B→A · pass');

r = PREDICATES.reciprocalCycle({ input: {
    transactions: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }],
} });
t(!r.passed,                                             'I · C7 · cap cicle · fail');

// ─── J · predicate C8 · noOrphanRole ─────────────────────────────────────
r = PREDICATES.noOrphanRole({ input: {
    roles: [{ id: 'r1' }, { id: 'r2' }],
    transactions: [{ from: 'r1', to: 'r2' }],
} });
t(r.passed && r.score === 100,                           'J · C8 · tots connectats · pass');

r = PREDICATES.noOrphanRole({ input: {
    roles: [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }],
    transactions: [{ from: 'r1', to: 'r2' }],
} });
t(!r.passed && r.score < 100 && r.evidence.orphans.includes('r3'), 'J · C8 · 1 orfe · score parcial · evidence');

// ─── K · predicate C9 · noDeadDeliverable ────────────────────────────────
r = PREDICATES.noDeadDeliverable({ input: {
    deliverables: [{ id: 'd1', consumers: ['r2'] }],
    transactions: [{ deliverable: 'd1' }],
} });
t(r.passed,                                              'K · C9 · deliverable amb consumer i tx · pass');

r = PREDICATES.noDeadDeliverable({ input: {
    deliverables: [{ id: 'd1', consumers: [] }],
    transactions: [{ deliverable: 'd1' }],
} });
t(!r.passed && r.evidence.dead.includes('d1'),           'K · C9 · sense consumers · dead');

// ─── L · predicate C10 · sopPerRoleSteps ─────────────────────────────────
const goodSop = (roleId) => ({
    id: 'sop-' + roleId, role_ref: roleId,
    steps: [
        { deliverable_kind: 'plan', approval_rule: 'manual' },
        { deliverable_kind: 'spec', approval_rule: 'tdd' },
        { deliverable_kind: 'doc',  approval_rule: 'manual' },
    ],
});
r = PREDICATES.sopPerRoleSteps({ input: {
    roles: [{ id: 'r1' }, { id: 'r2' }],
    sops:  [goodSop('r1'), goodSop('r2')],
}, params: { minSteps: 3 } });
t(r.passed && r.score === 100,                           'L · C10 · SOP ben formada per rol · pass');

r = PREDICATES.sopPerRoleSteps({ input: {
    roles: [{ id: 'r1' }, { id: 'r2' }],
    sops:  [{ id: 'sop-r1', role_ref: 'r1', steps: [{ deliverable_kind: 'x', approval_rule: 'y' }] }],
}, params: { minSteps: 3 } });
t(!r.passed,                                             'L · C10 · steps < min · fail');

// SOP amb roleId (alternativa)
r = PREDICATES.sopPerRoleSteps({ input: {
    roles: [{ id: 'r1' }],
    sops:  [{ id: 's', roleId: 'r1', steps: new Array(3).fill({ deliverable_kind: 'x', approval_rule: 'y' }) }],
}, params: { minSteps: 3 } });
t(r.passed,                                              'L · C10 · accepta roleId alternatiu');

// ─── M · predicate C11 · socCoverageOfSops ───────────────────────────────
r = PREDICATES.socCoverageOfSops({ input: {
    sops: [{ id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }, { id: 's5' }],
    socs: [{ checklist: [{ sop_ref: 's1' }, { sop_ref: 's2' }, { sop_ref: 's3' }, { sop_ref: 's4' }] }],
}, params: { minRatio: 0.8 } });
t(r.passed,                                              'M · C11 · 4/5 = 80% · pass');

r = PREDICATES.socCoverageOfSops({ input: {
    sops: [{ id: 's1' }, { id: 's2' }],
    socs: [{ checklist: [{ sop_ref: 's1' }] }],
}, params: { minRatio: 0.8 } });
t(!r.passed,                                             'M · C11 · 50% · fail');

// SOC dins content.checklist
r = PREDICATES.socCoverageOfSops({ input: {
    sops: [{ id: 's1' }],
    socs: [{ content: { checklist: [{ sop_ref: 's1' }] } }],
}, params: { minRatio: 0.8 } });
t(r.passed,                                              'M · C11 · accepta content.checklist');

// ─── N · predicate C12 · leanMetricsCoverage ─────────────────────────────
const leanTx = (extra = {}) => ({ from: 'a', to: 'b', lead_time_hours: 24, cycle_time_hours: 2, wip_units: 1, ...extra });
r = PREDICATES.leanMetricsCoverage({ input: {
    transactions: [leanTx(), leanTx(), leanTx(), leanTx(), leanTx()],
}, params: { minRatio: 0.8 } });
t(r.passed && r.score === 100,                           'N · C12 · 100% lean · pass');

r = PREDICATES.leanMetricsCoverage({ input: {
    transactions: [leanTx(), {}, {}, {}, {}],
}, params: { minRatio: 0.8 } });
t(!r.passed,                                             'N · C12 · 20% lean · fail');

// Negatives invalides (cycle > lead permès però han de ser nums positius)
r = PREDICATES.leanMetricsCoverage({ input: {
    transactions: [{ lead_time_hours: -1, cycle_time_hours: 2, wip_units: 1 }],
}, params: { minRatio: 0.8 } });
t(!r.passed,                                             'N · C12 · valors negatius · no compten');

// ─── O · evaluateRubric · projecte buit ──────────────────────────────────
const evalEmpty = evaluateRubric({ roles: [], deliverables: [], transactions: [], sops: [], socs: [] });
eq(evalEmpty.total, 0,                                   'O · evaluateRubric · buit · total 0');
eq(evalEmpty.status, 'red',                              'O · evaluateRubric · buit · status red');
eq(Object.keys(evalEmpty.byCriterion).length, 12,        'O · evaluateRubric · 12 byCriterion');
t(evalEmpty.missing.length === 12,                       'O · evaluateRubric · buit · 12 missing');

// ─── P · evaluateRubric · projecte mediocre ──────────────────────────────
const mediocre = {
    roles: [
        { id: 'r1', kind: 'architect', castell_level: 'castell' },
        { id: 'r2', kind: 'coder',     castell_level: 'castell' },
        { id: 'r3', kind: 'reviewer',  castell_level: 'cim' },
    ],
    deliverables: [
        { id: 'd1', producer: 'r1', consumers: ['r2'], validator: 'qa' },
        { id: 'd2', producer: 'r2', consumers: ['r3'] },
        { id: 'd3', producer: 'r3', consumers: ['r1'] },
    ],
    transactions: [
        { from: 'r1', to: 'r2', deliverable: 'd1', type: 'tangible' },
        { from: 'r2', to: 'r3', deliverable: 'd2', type: 'tangible' },
        { from: 'r3', to: 'r1', deliverable: 'd3', type: 'intangible' },
        { from: 'r1', to: 'r3', deliverable: 'd1', type: 'tangible' },
        { from: 'r2', to: 'r1', deliverable: 'd2', type: 'tangible' },
    ],
    sops: [],
    socs: [],
};
const evalMed = evaluateRubric(mediocre);
t(evalMed.total > 30 && evalMed.total < 75,              'P · evaluateRubric · mediocre · status mid (' + evalMed.total + ')');
t(evalMed.byCriterion.C7.passed,                         'P · mediocre · cicle recíproc detectat');
t(!evalMed.byCriterion.C10.passed,                       'P · mediocre · falta SOP per rol');
t(!evalMed.byCriterion.C12.passed,                       'P · mediocre · falta Lean');

// ─── Q · evaluateRubric · projecte excellent (gold) ──────────────────────
const excellent = {
    roles: mediocre.roles.slice(),
    deliverables: mediocre.deliverables.map(d => ({ ...d, validator: 'qa' })),
    transactions: mediocre.transactions.map(t => ({ ...t, lead_time_hours: 24, cycle_time_hours: 2, wip_units: 1 })),
    sops:  [
        goodSop('r1'), goodSop('r2'), goodSop('r3'),
    ],
    socs:  [{ checklist: [
        { sop_ref: 'sop-r1' }, { sop_ref: 'sop-r2' }, { sop_ref: 'sop-r3' },
    ] }],
};
const evalExc = evaluateRubric(excellent);
t(evalExc.total >= 85,                                   'Q · evaluateRubric · excellent · gold (' + evalExc.total + ')');
eq(evalExc.status, 'gold',                               'Q · excellent · status gold');
eq(evalExc.missing.length, 0,                            'Q · excellent · cap missing');

// ─── R · evaluateRubric · failure mode · predicate inexistent ────────────
const customRubric = { version: 'test', criteria: [
    { id: 'X1', weight: 100, predicate: 'doesNotExist', label: 'no existeix', fix: '-', params: {} },
] };
const evalBad = evaluateRubric({}, customRubric);
eq(evalBad.total, 0,                                     'R · predicate inexistent · score 0');
t(evalBad.byCriterion.X1.evidence.error,                 'R · predicate inexistent · error a l\'evidence');

// ─── S · status thresholds · predicates injectables ──────────────────────
const fakeRubric = (score) => ({ version: 't', criteria: [
    { id: 'X', weight: 100, predicate: 'fake', label: '-', fix: '-', params: { score } },
] });
const fakeRegistry = {
    ...PREDICATES,
    fake: ({ params }) => ({ passed: true, score: params.score }),
};
eq(evaluateRubric({}, fakeRubric(90), fakeRegistry).status, 'gold',    'S · status gold ≥85');
eq(evaluateRubric({}, fakeRubric(75), fakeRegistry).status, 'silver',  'S · status silver ≥70');
eq(evaluateRubric({}, fakeRubric(55), fakeRegistry).status, 'bronze',  'S · status bronze ≥50');
eq(evaluateRubric({}, fakeRubric(30), fakeRegistry).status, 'red',     'S · status red <50');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
