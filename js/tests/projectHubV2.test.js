// UX-CENTRAL-HUB-001 · sprint UI · smoke test del ProjectHubV2View
// Ús · node js/tests/projectHubV2.test.js
//
// Nota · jsdom-style smoke test · només verifica que les funcions pure
// que la vista crida segueixen exposades + signatures bàsiques. El
// rendering real del DOM es testeja manualment al navegador.

import { buildFeed, summarizeFeed, ACTIVITY_KINDS } from '../core/activityFeedService.js';
import { buildSuggestionsList, SUGGESTION_KINDS } from '../core/iaSuggestionsService.js';
import { computeProcessStats } from '../core/processService.js';
import { auditOrg } from '../core/tddFrameworkService.js';
import { budgetStatus } from '../core/aiBudgetService.js';
import { getSessionTotalEur, formatCostEur } from '../core/aiCostTracker.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== UX-CENTRAL-HUB-001 · sprint UI · service contracts ===\n');

// 1 · ACTIVITY · functions present + minimal happy path
t(typeof buildFeed === 'function',                       'A · buildFeed available');
t(typeof summarizeFeed === 'function',                   'A · summarizeFeed available');
t(Array.isArray(ACTIVITY_KINDS) && ACTIVITY_KINDS.length === 16, 'A · ACTIVITY_KINDS · 16');

const feed = buildFeed({
    sources: { wos: [{ id: 'w1', status: 'done', completed_at: Date.now(), title: 'Done thing' }] },
    limit: 3,
});
t(Array.isArray(feed) && feed.length >= 1,               'A · buildFeed returns events');

const summary = summarizeFeed(feed);
t(summary.total >= 1,                                    'A · summary total');

// 2 · SUGGESTIONS · functions + happy path
t(typeof buildSuggestionsList === 'function',            'B · buildSuggestionsList available');
t(Array.isArray(SUGGESTION_KINDS) && SUGGESTION_KINDS.length === 8, 'B · SUGGESTION_KINDS · 8');

const list = buildSuggestionsList({ context: {}, limit: 3 });
t(Array.isArray(list),                                   'B · list is array');

// 3 · processStats · for zone 3 rendering
t(typeof computeProcessStats === 'function',             'C · computeProcessStats available');

const stats = computeProcessStats({
    type: 'process', id: 'p1', label: 'X', category: 'sales', cycleHint: 'weekly',
    roleIds: [], txIds: [], socIds: [], resourceIds: [],
    interfaceIn: [], interfaceOut: [],
    kpis: [],
    status: 'active',
});
t(stats && typeof stats === 'object',                    'C · stats object');
t('kpiHealthOverall' in stats,                           'C · kpiHealthOverall key');

// 4 · auditOrg · for zone 1 audit score
t(typeof auditOrg === 'function',                        'D · auditOrg available');

// 5 · budgetStatus · for zone 6
t(typeof budgetStatus === 'function',                    'E · budgetStatus available');
const bs = budgetStatus('proj-test');
t(bs && 'state' in bs && 'ratio' in bs,                  'E · budgetStatus returns shape');

// 6 · cost tracker · for zone 6
t(typeof getSessionTotalEur === 'function',              'F · getSessionTotalEur available');
t(typeof formatCostEur === 'function',                   'F · formatCostEur available');
eq(typeof formatCostEur(1.5), 'string',                  'F · formatCostEur returns string');

// 7 · Verify ProjectHubV2View module loads (syntax-level)
try {
    // ESM import-as-side-effect
    await import('../views/ProjectHubV2View.js');
    t(true,                                              'G · ProjectHubV2View module loads');
} catch (e) {
    t(false,                                             'G · ProjectHubV2View loads · ' + (e?.message || e));
}

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
