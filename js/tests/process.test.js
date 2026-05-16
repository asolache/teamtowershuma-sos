// PROCESS-FIRST-CLASS-001 sprint A · tests
import {
    buildEmptyProcess, buildKpi, validateProcess,
    linkRole, unlinkRole, linkTransaction, linkSoc, linkResource,
    linkInterfaceIn, linkInterfaceOut,
    addKpi, recordKpiValue, evaluateKpiHealth,
    activateProcess, pauseProcess, deprecateProcess,
    extractSubgraph, computeProcessStats,
    PROCESS_TYPE, PROCESS_CATEGORIES, CYCLE_HINTS, PROCESS_STATUS, KPI_KIND,
} from '../core/processService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== PROCESS-FIRST-CLASS-001 sprint A · processService ===\n');

// 1 · Constants
eq(PROCESS_TYPE, 'process',                              'A · type constant');
eq(PROCESS_CATEGORIES.length, 8,                         'A · 8 categories');
t(PROCESS_CATEGORIES.includes('sales'),                  'A · sales category');
t(PROCESS_CATEGORIES.includes('governance'),             'A · governance category');
t(CYCLE_HINTS.includes('daily'),                         'A · daily cycle hint');
t(CYCLE_HINTS.includes('on-event'),                      'A · on-event cycle hint');
t(KPI_KIND.includes('ratio'),                            'A · ratio KPI kind');
t(KPI_KIND.includes('amount-eur'),                       'A · amount-eur KPI kind');

// 2 · buildEmptyProcess · happy path
const proc1 = buildEmptyProcess({
    orgId: 'org-castellers',
    label: 'Procés assajos setmanals',
    category: 'ops',
    cycleHint: 'weekly',
    ts: 1700000000000,
});
eq(proc1.type, PROCESS_TYPE,                             'B · type set');
eq(proc1.orgId, 'org-castellers',                        'B · orgId set');
eq(proc1.category, 'ops',                                'B · category ops');
eq(proc1.cycleHint, 'weekly',                            'B · cycle weekly');
eq(proc1.status, 'experimental',                         'B · default status experimental');
eq(proc1.roleIds.length, 0,                              'B · roleIds buit per defecte');

// 3 · Errors
try { buildEmptyProcess({}); t(false, 'B · sense orgId · throws'); }
catch (_) { t(true, 'B · sense orgId · throws'); }
try { buildEmptyProcess({ orgId: 'x', label: 'L', category: 'inventat' }); t(false, 'B · category invalid · throws'); }
catch (_) { t(true, 'B · category invalid · throws'); }
try { buildEmptyProcess({ orgId: 'x', label: 'L', cycleHint: 'inventat' }); t(false, 'B · cycleHint invalid · throws'); }
catch (_) { t(true, 'B · cycleHint invalid · throws'); }

// 4 · validateProcess
eq(validateProcess(proc1).ok, true,                      'C · proc1 vàlid');
eq(validateProcess(null).ok, false,                      'C · null fail');
eq(validateProcess({ ...proc1, category: 'inventat' }).ok, false, 'C · category invalid fail');
eq(validateProcess({ ...proc1, status: 'inventat' }).ok, false,   'C · status invalid fail');

// 5 · linkRole / unlinkRole · idempotent
const proc2 = linkRole(linkRole(proc1, 'role-cap-de-colla'), 'role-cap-de-colla');
eq(proc2.roleIds.length, 1,                              'D · linkRole idempotent');
const proc3 = linkRole(proc2, 'role-pinya');
eq(proc3.roleIds.length, 2,                              'D · linkRole afegit segon');
const proc4 = unlinkRole(proc3, 'role-cap-de-colla');
eq(proc4.roleIds.length, 1,                              'D · unlinkRole · 1');

// 6 · linkTransaction · linkSoc · linkResource · linkInterface
let proc = proc1;
proc = linkTransaction(proc, 'tx-001');
proc = linkSoc(proc, 'soc-assaig');
proc = linkResource(proc, 'res-local-assaig');
proc = linkInterfaceIn(proc, 'iface-001');
proc = linkInterfaceOut(proc, 'iface-002');
eq(proc.txIds.length, 1,                                 'E · tx linked');
eq(proc.socIds.length, 1,                                'E · soc linked');
eq(proc.resourceIds.length, 1,                           'E · resource linked');
eq(proc.interfaceIn.length, 1,                           'E · interface in');
eq(proc.interfaceOut.length, 1,                          'E · interface out');

// 7 · KPI · buildKpi
const kpi = buildKpi({ id: 'kpi-asaig-attend', label: 'Assistència mensual', kind: 'percentage', target: 80 });
eq(kpi.kind, 'percentage',                               'F · kpi kind');
eq(kpi.target, 80,                                       'F · kpi target');
eq(kpi.currentValue, null,                               'F · currentValue null inicial');

try { buildKpi({ label: 'no id' }); t(false, 'F · kpi sense id · throws'); }
catch (_) { t(true, 'F · kpi sense id · throws'); }
try { buildKpi({ id: 'x', label: 'L', kind: 'inventat', target: 5 }); t(false, 'F · kpi kind invalid · throws'); }
catch (_) { t(true, 'F · kpi kind invalid · throws'); }

// 8 · addKpi · recordKpiValue · evaluateKpiHealth
const procK = addKpi(proc1, { id: 'kpi-conv', label: 'Conv rate', kind: 'ratio', target: 0.05 });
eq(procK.kpis.length, 1,                                 'G · 1 kpi afegit');

try { addKpi(procK, { id: 'kpi-conv', label: 'dup', kind: 'ratio', target: 0.1 }); t(false, 'G · dup kpi · throws'); }
catch (_) { t(true, 'G · dup kpi · throws'); }

const procKv = recordKpiValue(procK, 'kpi-conv', 0.06);
eq(procKv.kpis[0].currentValue, 0.06,                    'G · valor enregistrat');
t(procKv.kpis[0].lastEvalAt > 0,                         'G · lastEvalAt set');

const health = evaluateKpiHealth(procKv);
eq(health.length, 1,                                     'H · 1 health entry');
eq(health[0].status, 'green',                            'H · 0.06/0.05 = 1.2 · green');

const procRed = recordKpiValue(procK, 'kpi-conv', 0.02);
eq(evaluateKpiHealth(procRed)[0].status, 'red',          'H · 0.02/0.05 = 0.4 · red');

const procYellow = recordKpiValue(procK, 'kpi-conv', 0.04);
eq(evaluateKpiHealth(procYellow)[0].status, 'yellow',    'H · 0.04/0.05 = 0.8 · yellow');

const procNo = procK; // sense recordar valor
eq(evaluateKpiHealth(procNo)[0].status, 'no-data',       'H · sense valor · no-data');

// 9 · Status transitions
const procActive = activateProcess(proc1);
eq(procActive.status, 'active',                          'I · activate');
const procPaused = pauseProcess(procActive);
eq(procPaused.status, 'paused',                          'I · pause');
const procDep = deprecateProcess(procPaused);
eq(procDep.status, 'deprecated',                         'I · deprecate');

// 10 · extractSubgraph · pure VNA filter
const procFilter = linkRole(linkTransaction(proc1, 'tx-001'), 'role-cap-de-colla');
const globalRoles = [
    { id: 'role-cap-de-colla', label: 'Cap' },
    { id: 'role-pinya', label: 'Pinya' },
    { id: 'role-tronc', label: 'Tronc' },
];
const globalTxs = [
    { id: 'tx-001', from: 'role-cap-de-colla', to: 'role-pinya' },
    { id: 'tx-002', from: 'role-pinya', to: 'role-tronc' },
];
const sub = extractSubgraph(procFilter, { roles: globalRoles, transactions: globalTxs });
eq(sub.roles.length, 1,                                  'J · subgraph · 1 role');
eq(sub.transactions.length, 1,                           'J · subgraph · 1 tx');
eq(sub.roles[0].id, 'role-cap-de-colla',                 'J · subgraph correct role');

// 11 · computeProcessStats
const procStats = addKpi(linkRole(linkSoc(proc1, 'soc-x'), 'role-y'), { id: 'kpi-1', label: 'K1', kind: 'count', target: 100 });
const stats = computeProcessStats(procStats);
eq(stats.roleCount, 1,                                   'K · roleCount 1');
eq(stats.socCount, 1,                                    'K · socCount 1');
eq(stats.kpiCount, 1,                                    'K · kpiCount 1');
eq(stats.kpiHealthOverall, 'no-data',                    'K · health no-data sense valor');

const procStatsHealthy = recordKpiValue(procStats, 'kpi-1', 120);
const stats2 = computeProcessStats(procStatsHealthy);
eq(stats2.kpiHealthOverall, 'green',                     'K · health green amb valor sobre target');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
