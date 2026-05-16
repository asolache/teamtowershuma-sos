// VALUE-FLOW-SOC-SEQUENCING-001 · tests · agrupar transactions en SOCs
// coherents · diana rubric C11 (SOC coverage ≥80%) post-personalize.

import {
    SOC_SEQUENCING_VERSION,
    extractProcessGroups, materializeSocs, computeSocCoverage, sequenceSocs,
} from '../core/socSequencingService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== VALUE-FLOW-SOC-SEQUENCING ===\n');

// ─── A · version + buit ───────────────────────────────────────────────────
eq(SOC_SEQUENCING_VERSION, 'v1.0',                       'A · version v1.0');
eq(extractProcessGroups({}).length, 0,                   'A · sense input · cap group');
eq(extractProcessGroups({ transactions: [] }).length, 0, 'A · transactions [] · cap group');
eq(materializeSocs({}).length, 0,                        'A · sense groups · cap soc');

// ─── B · cap pivot · tot al "Cicle operatiu principal" ──────────────────
{
    const txs = [
        { id: 't1', from: 'a', to: 'b' },
        { id: 't2', from: 'b', to: 'c' },
    ];
    const groups = extractProcessGroups({ transactions: txs });
    eq(groups.length, 1,                                 'B · 1 group fallback');
    eq(groups[0].id, 'proc-all',                         'B · id proc-all');
    eq(groups[0].transactions.length, 2,                 'B · tots els tx al group');
    t(groups[0].roles.includes('a'),                     'B · roles agregats');
}

// ─── C · pivot detection · rol amb ≥3 edges ─────────────────────────────
{
    const txs = [
        { id: 't1', from: 'pivot', to: 'a' },
        { id: 't2', from: 'pivot', to: 'b' },
        { id: 't3', from: 'c', to: 'pivot' },
        { id: 't4', from: 'd', to: 'e' },
    ];
    const groups = extractProcessGroups({ transactions: txs });
    const pivotGroup = groups.find(g => g.pivotRole === 'pivot');
    t(pivotGroup,                                        'C · pivot group detectat');
    eq(pivotGroup.transactions.length, 3,                'C · 3 transactions del pivot');
    t(pivotGroup.roles.includes('pivot'),                'C · pivot al roles');
    // Resta · miscellaneous
    const misc = groups.find(g => g.id === 'proc-misc');
    t(misc && misc.transactions.length === 1,            'C · 1 transaction misc · t4');
}

// ─── D · topological order · frequency ──────────────────────────────────
{
    const txs = [
        { id: 't1', from: 'a', to: 'b', frequency: 'yearly' },
        { id: 't2', from: 'a', to: 'c', frequency: 'weekly' },
        { id: 't3', from: 'a', to: 'd', frequency: 'monthly' },
        { id: 't4', from: 'a', to: 'e', frequency: 'weekly' },
    ];
    const groups = extractProcessGroups({ transactions: txs });
    const ordered = groups[0].transactions;
    // Weekly primer · monthly al mig · yearly últim
    eq(ordered[0].frequency, 'weekly',                   'D · weekly primer');
    eq(ordered[ordered.length - 1].frequency, 'yearly',  'D · yearly últim');
}

// ─── E · materializeSocs · checklist sop_ref matching ───────────────────
{
    const groups = [{
        id: 'proc-test',
        name: 'Test process',
        trigger: 'on',
        exitCriteria: 'off',
        transactions: [{ id: 't1' }],
        roles: ['r1', 'r2'],
        pivotRole: 'r1',
    }];
    const sops = [
        { id: 'sop-r1', role_ref: 'r1', title: 'SOP de r1' },
        { id: 'sop-r2', role_ref: 'r2', title: 'SOP de r2' },
    ];
    const socs = materializeSocs({ groups, sops, projectId: 'proj-X', ts: 1000 });
    eq(socs.length, 1,                                   'E · 1 SOC generat');
    eq(socs[0].id, 'proc-test-proj-X',                   'E · id amb projectId namespace');
    eq(socs[0].type, 'soc',                              'E · type soc');
    eq(socs[0].content.checklist.length, 2,              'E · 2 items checklist (2 rols)');
    t(socs[0].content.checklist.every(i => i.sop_ref),   'E · cada item té sop_ref');
    t(socs[0].content.checklist.some(i => i.sop_ref === 'sop-r1'), 'E · sop_ref r1 present');
    eq(socs[0].content.transactions[0], 't1',            'E · transactions ids preservats');
    eq(socs[0].createdAt, 1000,                          'E · ts injectable');
}

// ─── F · cas real · founder template · ≥80% coverage post-sequencing ───
{
    const { CATALOG, applyContext } = await import('../core/projectTemplateCatalog.js');
    const founder = applyContext(CATALOG['founder-coop-tradicional'], { name: 'Test' });

    const result = sequenceSocs({
        transactions: founder.transactions,
        roles: founder.roles,
        sops: founder.sops,
        projectId: 'proj-test',
    });
    t(result.socs.length >= 1,                           'F · ≥1 SOC generat del founder template');
    t(result.coverage.ratio >= 0.80,                     'F · coverage ≥80% post-sequencing · got ' + Math.round(result.coverage.ratio * 100) + '%');
}

// ─── G · default-balanced template · mateix contracte ──────────────────
{
    const { CATALOG, applyContext } = await import('../core/projectTemplateCatalog.js');
    const def = applyContext(CATALOG['default-balanced'], { name: 'Def' });
    const result = sequenceSocs({
        transactions: def.transactions,
        roles: def.roles,
        sops: def.sops,
        projectId: 'p-d',
    });
    t(result.socs.length >= 1,                           'G · default-balanced · ≥1 SOC');
    t(result.coverage.ratio >= 0.80,                     'G · coverage ≥80% · got ' + Math.round(result.coverage.ratio * 100) + '%');
}

// ─── H · computeSocCoverage · ratio correct ─────────────────────────────
{
    const sops = [{ id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }, { id: 's5' }];
    const socs = [{
        content: { checklist: [{ sop_ref: 's1' }, { sop_ref: 's2' }, { sop_ref: 's3' }, { sop_ref: 's4' }] }
    }];
    const c = computeSocCoverage({ sops, socs });
    eq(c.ratio, 4 / 5,                                   'H · ratio 4/5 = 0.8');
    eq(c.coveredSopIds.length, 4,                        'H · 4 covered');
    eq(c.totalSopIds.length, 5,                          'H · 5 total');
}
{
    const c = computeSocCoverage({ sops: [], socs: [] });
    eq(c.ratio, 0,                                       'H · cap sop · ratio 0 safe');
}

// ─── I · integration · rubric C11 amb sequencing real puja a 100% ──────
{
    const { evaluateRubric, fromProject } = await import('../core/valueFlowRubricService.js');
    const { CATALOG, applyContext } = await import('../core/projectTemplateCatalog.js');
    // Founder template SENSE SOCs · simulant cas IA que va perdre-los
    const founder = applyContext(CATALOG['founder-coop-tradicional'], { name: 'T' });
    const noSocs = { ...founder, socs: [] };
    // Score abans
    const before = evaluateRubric({
        roles: noSocs.roles, deliverables: noSocs.deliverables, transactions: noSocs.transactions,
        sops: noSocs.sops, socs: [],
    });
    const c11Before = before.byCriterion.C11.score;
    t(c11Before < 100,                                   'I · C11 score abans · ' + c11Before + ' < 100');

    // Apliquem soc-sequencing
    const seq = sequenceSocs({ transactions: noSocs.transactions, roles: noSocs.roles, sops: noSocs.sops });
    const after = evaluateRubric({
        roles: noSocs.roles, deliverables: noSocs.deliverables, transactions: noSocs.transactions,
        sops: noSocs.sops, socs: seq.socs,
    });
    const c11After = after.byCriterion.C11.score;
    t(c11After >= c11Before,                             'I · C11 score post-sequencing puja · ' + c11Before + ' → ' + c11After);
    t(c11After === 100,                                  'I · C11 = 100 post-sequencing');
}

// ─── J · idempotency · mateix input · mateix output ────────────────────
{
    const txs = [
        { id: 't1', from: 'a', to: 'b', frequency: 'monthly' },
        { id: 't2', from: 'b', to: 'c', frequency: 'weekly' },
    ];
    const g1 = extractProcessGroups({ transactions: txs });
    const g2 = extractProcessGroups({ transactions: txs });
    eq(JSON.stringify(g1), JSON.stringify(g2),           'J · idempotent · mateix input · mateix output');
}

// ─── K · cap soc duplicat per group ─────────────────────────────────────
{
    const groups = [{ id: 'p1', name: 'P1', trigger: 't', exitCriteria: 'e', transactions: [], roles: ['r'], pivotRole: 'r' }];
    const sops = [{ id: 'sop-r', role_ref: 'r' }];
    const s1 = materializeSocs({ groups, sops, projectId: 'x', ts: 1 });
    eq(s1.length, 1,                                     'K · 1 group → 1 SOC');
    eq(s1[0].content.checklist.length, 1,                'K · 1 role · 1 checklist item');
}

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
