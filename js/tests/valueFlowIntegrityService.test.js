// VALUE-FLOW-INTEGRITY-001 · cross-layer validator · 7 regles R1-R7
// Veure `docs/STUDY-value-flow-audit-2026-05-15.md` §4.3.

import {
    INTEGRITY_VERSION, SEVERITIES, RULES,
    validateIntegrity,
} from '../core/valueFlowIntegrityService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== VALUE-FLOW-INTEGRITY-001 ===\n');

// ─── A · estructura del service ──────────────────────────────────────────
eq(INTEGRITY_VERSION, 'v1.0',                            'A · version v1.0');
t(SEVERITIES.includes('error'),                          'A · severity error');
t(SEVERITIES.includes('warning'),                        'A · severity warning');
t(SEVERITIES.includes('info'),                           'A · severity info');
eq(RULES.length, 7,                                      'A · 7 regles R1-R7');
for (let i = 1; i <= 7; i++) {
    t(RULES.some(r => r.id === 'R' + i),                'A · R' + i + ' present');
}

// ─── B · input buit · cap issue (cap input → cap regla applicable) ──────
{
    const r = validateIntegrity({});
    t(r.ok,                                              'B · input buit · ok');
    eq(r.issues.length, 0,                               'B · input buit · cap issue');
    eq(r.errorCount, 0,                                  'B · errorCount 0');
    eq(r.warningCount, 0,                                'B · warningCount 0');
    eq(Object.keys(r.byRule).length, 7,                  'B · byRule per cada regla');
}
{
    const r = validateIntegrity(null);
    t(r.ok,                                              'B · null input · ok (gracios)');
}

// ─── C · R1 · sop step deliverable_kind manca ────────────────────────────
{
    const r = validateIntegrity({
        valueFlow: { deliverables: [{ id: 'd1' }], roles: [], transactions: [] },
        sops: [{ id: 'sop-bad', role_ref: 'r1', steps: [{ id: 's1', label: 'no kind' }] }],
    });
    const r1Issues = r.issues.filter(i => i.rule === 'R1');
    t(r1Issues.length >= 1,                              'C · R1 · detecta SOP sense deliverable_kind als steps');
    eq(r1Issues[0].severity, 'warning',                  'C · R1 · severity warning');
}
{
    const r = validateIntegrity({
        valueFlow: { deliverables: [{ id: 'd1' }], roles: [], transactions: [] },
        sops: [{ id: 'sop-ok', role_ref: 'r1', steps: [
            { id: 's1', deliverable_kind: 'plan', approval_rule: 'manual' },
        ] }],
    });
    const r1Issues = r.issues.filter(i => i.rule === 'R1');
    eq(r1Issues.length, 0,                               'C · R1 · SOP amb deliverable_kind · pass');
}

// ─── D · R2 · sop role_ref no existeix ──────────────────────────────────
{
    const r = validateIntegrity({
        valueFlow: { roles: [{ id: 'r1' }, { id: 'r2', roleSlug: 'r2-slug' }], deliverables: [], transactions: [] },
        sops: [{ id: 'sop-bad', role_ref: 'r-inexistent', steps: [{ deliverable_kind: 'x', approval_rule: 'y' }] }],
    });
    const r2Issues = r.issues.filter(i => i.rule === 'R2');
    eq(r2Issues.length, 1,                               'D · R2 · 1 issue · role_ref invent');
    eq(r2Issues[0].severity, 'error',                    'D · R2 · severity error');
    eq(r2Issues[0].bad_ref, 'r-inexistent',              'D · R2 · evidence bad_ref');
}
{
    const r = validateIntegrity({
        valueFlow: { roles: [{ id: 'r1', roleSlug: 'r-slug' }], deliverables: [], transactions: [] },
        sops: [{ id: 'sop-by-slug', role_ref: 'r-slug', steps: [{ deliverable_kind: 'x', approval_rule: 'y' }] }],
    });
    const r2Issues = r.issues.filter(i => i.rule === 'R2');
    eq(r2Issues.length, 0,                               'D · R2 · matching per roleSlug · pass');
}
{
    // Sense role_ref
    const r = validateIntegrity({
        valueFlow: { roles: [{ id: 'r1' }], deliverables: [], transactions: [] },
        sops: [{ id: 'sop-no-role' }],
    });
    const r2 = r.issues.filter(i => i.rule === 'R2');
    t(r2.some(i => i.severity === 'warning'),            'D · R2 · sense role_ref · warning');
}

// ─── E · R3 · soc checklist sop_ref inexistent ──────────────────────────
{
    const r = validateIntegrity({
        valueFlow: { roles: [], deliverables: [], transactions: [] },
        sops: [{ id: 'sop-1' }],
        socs: [{ id: 'soc-1', checklist: [{ id: 'i1', sop_ref: 'sop-inexistent' }] }],
    });
    const r3 = r.issues.filter(i => i.rule === 'R3');
    eq(r3.length, 1,                                     'E · R3 · 1 issue · sop_ref invent');
    eq(r3[0].severity, 'error',                          'E · R3 · severity error');
    eq(r3[0].bad_sop_ref, 'sop-inexistent',              'E · R3 · evidence');
}
{
    const r = validateIntegrity({
        valueFlow: { roles: [], deliverables: [], transactions: [] },
        sops: [{ id: 'sop-1' }],
        socs: [{ id: 'soc-1', content: { checklist: [{ sop_ref: 'sop-1' }] } }],
    });
    const r3 = r.issues.filter(i => i.rule === 'R3');
    eq(r3.length, 0,                                     'E · R3 · accepta content.checklist');
}

// ─── F · R4 · transaction process_ref inexistent ────────────────────────
{
    const r = validateIntegrity({
        valueFlow: { roles: [], deliverables: [], transactions: [{ id: 't1', from: 'a', to: 'b', process_ref: 'proc-x' }] },
        sops: [], socs: [],
        processes: [{ id: 'proc-real', transactions: [] }],
    });
    const r4 = r.issues.filter(i => i.rule === 'R4');
    eq(r4.length, 1,                                     'F · R4 · 1 issue · process_ref invent');
    eq(r4[0].severity, 'warning',                        'F · R4 · severity warning');
}
{
    // Skip si cap process definit
    const r = validateIntegrity({
        valueFlow: { transactions: [{ id: 't1', process_ref: 'proc-x' }] },
        sops: [], socs: [],
    });
    const r4 = r.issues.filter(i => i.rule === 'R4');
    eq(r4.length, 0,                                     'F · R4 · sense processes · skip');
}

// ─── G · R5 · process.transactions[] membres inexistents ────────────────
{
    const r = validateIntegrity({
        valueFlow: { roles: [], deliverables: [], transactions: [{ id: 't1' }] },
        sops: [], socs: [],
        processes: [{ id: 'p1', transactions: ['t1', 't-inexistent'] }],
    });
    const r5 = r.issues.filter(i => i.rule === 'R5');
    eq(r5.length, 1,                                     'G · R5 · detecta tx-id invent');
    eq(r5[0].bad_tx_id, 't-inexistent',                  'G · R5 · evidence');
    eq(r5[0].severity, 'error',                          'G · R5 · severity error');
}

// ─── H · R6 · process role no participa a cap tx ─────────────────────────
{
    const r = validateIntegrity({
        valueFlow: { roles: [], deliverables: [], transactions: [
            { id: 't1', from: 'a', to: 'b' },
        ] },
        sops: [], socs: [],
        processes: [{ id: 'p1', roles: ['a', 'b', 'c-orphan'], transactions: ['t1'] }],
    });
    const r6 = r.issues.filter(i => i.rule === 'R6');
    eq(r6.length, 1,                                     'H · R6 · detecta rol orfe al process');
    eq(r6[0].orphan_role, 'c-orphan',                    'H · R6 · evidence orphan_role');
}

// ─── I · R7 · cicles recíprocs trenquen boundary ────────────────────────
{
    // a→b dins p1 · b→a fora de p1
    const r = validateIntegrity({
        valueFlow: { roles: [], deliverables: [], transactions: [
            { id: 't1', from: 'a', to: 'b', process_ref: 'p1' },
            { id: 't2', from: 'b', to: 'a', process_ref: 'p2' },
        ] },
        sops: [], socs: [],
        processes: [
            { id: 'p1', transactions: ['t1'], roles: [] },
            { id: 'p2', transactions: ['t2'], roles: [] },
        ],
    });
    const r7 = r.issues.filter(i => i.rule === 'R7');
    t(r7.length >= 1,                                    'I · R7 · detecta cicle que travessa processos');
    t(r7[0].severity === 'warning',                      'I · R7 · severity warning');
}
{
    // a→b i b→a tots dos dins p1 · pass
    const r = validateIntegrity({
        valueFlow: { roles: [], deliverables: [], transactions: [
            { id: 't1', from: 'a', to: 'b', process_ref: 'p1' },
            { id: 't2', from: 'b', to: 'a', process_ref: 'p1' },
        ] },
        sops: [], socs: [],
        processes: [{ id: 'p1', transactions: ['t1', 't2'], roles: [] }],
    });
    const r7 = r.issues.filter(i => i.rule === 'R7');
    eq(r7.length, 0,                                     'I · R7 · cicle dins boundary · pass');
}

// ─── J · integration · projecte healthy (template del catàleg) ──────────
{
    // Carrega un template real i comprova integritat
    const { CATALOG, applyContext } = await import('../core/projectTemplateCatalog.js');
    const founder = applyContext(CATALOG['founder-coop-tradicional'], { name: 'Test', sector: 'cultura', problem: 'x' });
    const result = validateIntegrity({
        valueFlow: { roles: founder.roles, deliverables: founder.deliverables, transactions: founder.transactions },
        sops:      founder.sops,
        socs:      founder.socs,
    });
    eq(result.errorCount, 0,                             'J · template founder · cap error d\'integritat');
    t(result.ok,                                         'J · template founder · ok=true');
}
{
    const { CATALOG, applyContext } = await import('../core/projectTemplateCatalog.js');
    const def = applyContext(CATALOG['default-balanced'], { name: 'Test', sector: 'x', problem: 'y' });
    const result = validateIntegrity({
        valueFlow: { roles: def.roles, deliverables: def.deliverables, transactions: def.transactions },
        sops:      def.sops,
        socs:      def.socs,
    });
    eq(result.errorCount, 0,                             'J · template default · cap error d\'integritat');
}

// ─── K · failure mode · regla que peta · capturat · cap excepció ────────
{
    // Forcem mal input · sop sense steps definit · ha de retornar warning · no petar
    const r = validateIntegrity({
        valueFlow: { roles: [{ id: 'r1' }], deliverables: [], transactions: [] },
        sops: [{ id: 'sop-no-steps', role_ref: 'r1', steps: null }],
    });
    t(typeof r === 'object',                             'K · sop steps null · sense excepció');
    t(r.issues.length >= 0,                              'K · resultat retornat');
}

// ─── L · byRule summary ─────────────────────────────────────────────────
{
    const r = validateIntegrity({
        valueFlow: { roles: [], deliverables: [], transactions: [] },
        sops: [{ id: 'bad', role_ref: 'inexistent', steps: [{ deliverable_kind: 'x', approval_rule: 'y' }] }],
    });
    t(r.byRule.R2 && r.byRule.R2.count >= 1,            'L · byRule.R2 count refleja issues');
    t(r.byRule.R2.severities.error >= 1,                'L · byRule.R2 severities.error');
}

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);