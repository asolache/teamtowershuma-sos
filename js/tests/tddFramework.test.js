// TDD-ALL-LEVELS-001 sprint A · tests
import {
    validateIaResponse,
    USER_ACTION_VALIDATORS, validateUserAction,
    auditOrg, auditOrgGenerateWos,
    computeTddCoverage,
    TDD_LEVELS, VALIDATOR_RESULT_KINDS,
} from '../core/tddFrameworkService.js';
import { buildEmptyOrganization } from '../core/organizationService.js';
import { buildEmptyProcess, addKpi, recordKpiValue, activateProcess } from '../core/processService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== TDD-ALL-LEVELS-001 sprint A · tddFrameworkService ===\n');

// 1 · Constants
eq(TDD_LEVELS.length, 6,                                 'A · 6 TDD levels');
t(TDD_LEVELS.includes('ai-response'),                    'A · ai-response level');
t(TDD_LEVELS.includes('org'),                            'A · org level');
t(VALIDATOR_RESULT_KINDS.includes('pass'),               'A · pass kind');
t(VALIDATOR_RESULT_KINDS.includes('warn'),               'A · warn kind');

// ── IA Response Validators ──────────────────────────────────────────────

// JSON expected · valid
const v1 = validateIaResponse({
    output: '{"foo": 1, "bar": "x"}',
    taskKind: 'schema-fill-simple',
    expectedShape: ['foo', 'bar'],
});
eq(v1.kind, 'pass',                                      'B · JSON pass');

// JSON missing field
const v2 = validateIaResponse({
    output: '{"foo": 1}',
    taskKind: 'schema-fill-simple',
    expectedShape: ['foo', 'bar'],
});
eq(v2.kind, 'fail',                                      'B · missing field · fail');
t(v2.reason.includes('bar'),                             'B · reason mentions missing');

// JSON parse fail
const v3 = validateIaResponse({
    output: 'not json at all',
    taskKind: 'value-map-design',
});
eq(v3.kind, 'fail',                                      'B · parse fail');

// JSON amb fenced code block
const v4 = validateIaResponse({
    output: '```json\n{"a": 1}\n```',
    taskKind: 'schema-fill-simple',
    expectedShape: ['a'],
});
eq(v4.kind, 'pass',                                      'B · fenced JSON pass');

// Tag generation
const v5 = validateIaResponse({
    output: 'tag1, tag2, tag3',
    taskKind: 'tag-generation',
});
eq(v5.kind, 'pass',                                      'B · tags pass');

const v6 = validateIaResponse({
    output: '',
    taskKind: 'tag-generation',
});
eq(v6.kind, 'fail',                                      'B · empty output fail');

// Creative narrative
const v7 = validateIaResponse({
    output: 'Short.',
    taskKind: 'creative-narrative',
});
eq(v7.kind, 'warn',                                      'B · short narrative · warn');

const v8 = validateIaResponse({
    output: 'This is a longer narrative response that exceeds 30 chars certainly.',
    taskKind: 'creative-narrative',
});
eq(v8.kind, 'pass',                                      'B · long narrative · pass');

// ── User Action Validators ──────────────────────────────────────────────

// delete-project · with ledger but no backup
const ud1 = validateUserAction('delete-project', { project: { id: 'p1' }, hasBackup: false, ledgerEntries: [{ id: 'e1' }] });
eq(ud1.kind, 'fail',                                     'C · delete with ledger no backup · fail');
t(ud1.hint && ud1.hint.includes('Exporta'),              'C · hint says export');

// delete-project · empty project
const ud2 = validateUserAction('delete-project', { project: { id: 'p1' }, ledgerEntries: [] });
eq(ud2.kind, 'pass',                                     'C · delete empty · pass');

// publish-permaweb · low balance
const ud3 = validateUserAction('publish-permaweb', { walletBalanceEur: 0.01, requiredEur: 0.05, hasSignature: true });
eq(ud3.kind, 'fail',                                     'C · publish low balance · fail');

// publish-permaweb · no signature
const ud4 = validateUserAction('publish-permaweb', { walletBalanceEur: 1, hasSignature: false });
eq(ud4.kind, 'fail',                                     'C · publish no sig · fail');

// publish-permaweb · ok
const ud5 = validateUserAction('publish-permaweb', { walletBalanceEur: 1, hasSignature: true, contentMinLength: 500 });
eq(ud5.kind, 'pass',                                     'C · publish ok');

// transfer-tokens · ok
const ud6 = validateUserAction('transfer-tokens', { fromBalance: 100, amount: 30, toAddress: '0xabc' });
eq(ud6.kind, 'pass',                                     'C · transfer pass');

// transfer-tokens · insufficient
const ud7 = validateUserAction('transfer-tokens', { fromBalance: 10, amount: 30, toAddress: '0xabc' });
eq(ud7.kind, 'fail',                                     'C · transfer insufficient · fail');

// complete-wo · already done · skip
const ud8 = validateUserAction('complete-wo', { wo: { status: 'done' } });
eq(ud8.kind, 'skip',                                     'C · wo already done · skip');

// complete-wo · no deliverable · fail
const ud9 = validateUserAction('complete-wo', { wo: { status: 'in-progress' }, signature: 'sig' });
eq(ud9.kind, 'fail',                                     'C · wo no deliverable · fail');

// unknown action · skip
const ud10 = validateUserAction('inventat-action', {});
eq(ud10.kind, 'skip',                                    'C · unknown action · skip');

// ── Org Audit ──────────────────────────────────────────────────────────

const org = buildEmptyOrganization({
    name: 'Test Org',
    legalKind: 'cooperative',
    founderHandle: '@alvaro',
    ts: 1700000000000,
});

// org · sense projectes · no sharePct issue · no processes · ja té founder
const audit1 = auditOrg({ org });
t(audit1.score >= 90,                                    `D · empty org healthy · score ${audit1.score}`);
eq(audit1.state, 'green',                                'D · state green');
t(audit1.findings.some(f => f.message.includes('sense cap projecte')), 'D · finding · no project');

// org amb processos · 1 actiu · 1 KPI vermell
let p1 = buildEmptyProcess({ orgId: org.id, label: 'Sales', category: 'sales', cycleHint: 'weekly' });
p1 = activateProcess(p1);
p1 = addKpi(p1, { id: 'k1', label: 'Conv', kind: 'ratio', target: 0.05 });
p1 = recordKpiValue(p1, 'k1', 0.02);  // 40% del target · red
const audit2 = auditOrg({ org, processes: [p1] });
t(audit2.findings.some(f => f.message.includes('vermell')), 'D · finding KPI red');
t(audit2.score <= 90,                                    `D · score afectat per KPI vermell · ${audit2.score}`);

// org · wallet en descobert
const audit3 = auditOrg({ org, walletStats: { balanceEur: -50 } });
t(audit3.findings.some(f => f.message.includes('descobert')), 'D · finding · descobert');
t(audit3.score <= 80,                                    `D · score < 80 · ${audit3.score}`);

// org · expenses 30% sobre revenue
const audit4 = auditOrg({ org, ledgerStats: { totalRevenue: 100, totalExpenses: 140 } });
t(audit4.findings.some(f => f.message.includes('expenses')), 'D · finding · expenses');

// ── Audit Generate WOs ──────────────────────────────────────────────────

const result = auditOrgGenerateWos({
    org: { ...org, projectIds: [] },
    processes: [p1],
    walletStats: { balanceEur: -10 },
}, { ts: 1700000000000 });
t(result.wos.length >= 2,                                `E · WOs generades · ${result.wos.length}`);
t(result.wos.every(wo => wo.priority),                   'E · WOs amb priority');
t(result.wos.every(wo => wo.tags.includes('audit-findings')), 'E · audit-findings tag');

// Max per day
const auditMax = auditOrgGenerateWos({ org }, { maxPerDay: 1, ts: 1700000000000 });
t(auditMax.wos.length <= 1,                              'E · max per day respected');

// ── TDD coverage ───────────────────────────────────────────────────────

const cov1 = computeTddCoverage({
    codeTestsCount: 600,
    aiValidatorsActive: true,
    userValidatorsActive: true,
    processesWithKpis: 4,
    processesTotal: 4,
    orgAuditRan: true,
});
eq(cov1.coverage, 1,                                     'F · full coverage 1.0');
eq(cov1.activeCount, 6,                                  'F · 6 levels active');

const cov2 = computeTddCoverage({});
t(cov2.coverage > 0,                                     'F · default · només code+wo · cov > 0');
t(cov2.levels.wo === true,                               'F · wo level sempre actiu');
t(cov2.levels['ai-response'] === false,                  'F · ai-response inactive default');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
