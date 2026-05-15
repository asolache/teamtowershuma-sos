// UX-CENTRAL-HUB-001 · tests · activityFeedService + iaSuggestionsService
import {
    buildActivityEvent, buildFeed, summarizeFeed,
    deriveFromAttestations, deriveFromPacts, deriveFromWos,
    deriveFromLedger, deriveFromInvoices, deriveFromProposals,
    ACTIVITY_KINDS,
} from '../core/activityFeedService.js';
import {
    detectCostSavings, detectKpiAlerts, detectAuditGaps,
    detectBudgetWarning, detectWoOverdue, detectNetworkMatch,
    buildSuggestionsList,
    SUGGESTION_KINDS, SUGGESTION_PRIORITY,
} from '../core/iaSuggestionsService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== UX-CENTRAL-HUB-001 · activity + suggestions ===\n');

// ── ACTIVITY FEED ────────────────────────────────────────────────────────

eq(ACTIVITY_KINDS.length, 16,                            'A · 16 activity kinds');
t(ACTIVITY_KINDS.includes('pact-signed'),                'A · pact-signed');
t(ACTIVITY_KINDS.includes('connection-made'),            'A · social connection');

// buildActivityEvent
const evt = buildActivityEvent({ kind: 'pact-signed', ts: 1700000000000, actorHandle: '@x' });
eq(evt.kind, 'pact-signed',                              'B · event kind set');
eq(evt.actorHandle, '@x',                                'B · actor');
t(evt.title.length > 0,                                  'B · default title generated');
t(evt.iconHint.length > 0,                               'B · default icon');

try { buildActivityEvent({ kind: 'inventat', ts: 1 }); t(false, 'B · invalid kind · throws'); }
catch (_) { t(true, 'B · invalid kind · throws'); }
try { buildActivityEvent({ kind: 'pact-signed' }); t(false, 'B · no ts · throws'); }
catch (_) { t(true, 'B · no ts · throws'); }

// deriveFromAttestations
const atts = [
    { id: 'att-1', createdAt: 1700000000000, content: { attesterHandle: '@a', targetHandle: '@me', statement: 'You are trustworthy' } },
    { id: 'att-2', createdAt: 1700000100000, content: { attesterHandle: '@me', targetHandle: '@b' } },
];
const attEvents = deriveFromAttestations(atts, { userHandle: '@me' });
eq(attEvents.length, 2,                                  'C · 2 attestation events');
eq(attEvents[0].kind, 'attestation-received',            'C · first · received');
eq(attEvents[1].kind, 'attestation-issued',              'C · second · issued');

// deriveFromPacts
const pacts = [
    { id: 'pact-1', updatedAt: 1700000200000, content: { status: 'signed', title: 'Founder pact' } },
    { id: 'pact-2', createdAt: 1700000300000, content: { status: 'draft', title: 'Draft pact' } },
];
const pactEvents = deriveFromPacts(pacts);
eq(pactEvents.length, 2,                                 'C · 2 pact events');
eq(pactEvents[0].kind, 'pact-signed',                    'C · signed kind');
t(pactEvents[0].relevanceScore > pactEvents[1].relevanceScore, 'C · signed > draft relevance');

// deriveFromWos
const wos = [
    { id: 'wo-1', status: 'done', completed_at: 1700000400000, title: 'Done thing' },
    { id: 'wo-2', status: 'claimed', claimed_at: 1700000500000, title: 'Claimed thing' },
    { id: 'wo-3', status: 'pending', title: 'Pending · no event' },
];
const woEvents = deriveFromWos(wos);
eq(woEvents.length, 2,                                   'C · 2 WO events (pending no)');

// deriveFromInvoices
const invoices = [
    { id: 'inv-1', updatedAt: 1700000600000, content: { status: 'paid', number: 'INV-001', client: 'Acme', totals: { gross: 1000 } } },
    { id: 'inv-2', content: { status: 'sent' } },
];
const invEvents = deriveFromInvoices(invoices);
eq(invEvents.length, 1,                                  'C · only paid invoice generates event');
eq(invEvents[0].kind, 'invoice-paid',                    'C · invoice-paid kind');

// deriveFromProposals · accepted
const proposals = [
    { id: 'prop-1', updatedAt: 1700000700000, content: { status: 'accepted', client: 'Coop' } },
    { id: 'prop-2', content: { status: 'sent' } },
];
const propEvents = deriveFromProposals(proposals);
eq(propEvents.length, 1,                                 'C · only accepted proposal');

// deriveFromLedger
const ledger = [
    { id: 'le-1', createdAt: 1700000800000, content: { amount: 100, description: 'Sale', debitAccount: 'cash', creditAccount: 'revenue' } },
];
const ledgerEvents = deriveFromLedger(ledger);
eq(ledgerEvents.length, 1,                               'C · 1 ledger event');

// buildFeed · aggregator
const feed = buildFeed({
    sources: { attestations: atts, pacts, wos, invoices, proposals, ledger },
    userHandle: '@me',
    limit: 10,
    sortBy: 'chrono',
});
t(feed.length >= 5,                                      `D · feed aggregat · ${feed.length} events`);
// chrono · newest first
for (let i = 0; i < feed.length - 1; i++) {
    if (feed[i].ts < feed[i + 1].ts) { t(false, 'D · chrono order'); break; }
}
t(true, 'D · chrono order respected');

// Relevance sort
const feedRel = buildFeed({
    sources: { attestations: atts, pacts, wos, invoices, proposals },
    userHandle: '@me',
    sortBy: 'relevance',
    limit: 5,
});
t(feedRel.length <= 5,                                   'D · limit respected');

// Filter sinceMs
const recent = buildFeed({
    sources: { wos, invoices },
    sinceMs: 1700000500000,
});
t(recent.every(e => e.ts >= 1700000500000),              'D · sinceMs filter applied');

// summarizeFeed
const summary = summarizeFeed(feed);
t(summary.total > 0,                                     'D · summary total > 0');
t(summary.byKind && Object.keys(summary.byKind).length > 0, 'D · byKind populated');

// ── SUGGESTIONS ──────────────────────────────────────────────────────────

t(SUGGESTION_KINDS.includes('cost-savings'),             'E · cost-savings kind');
t(SUGGESTION_PRIORITY.includes('urgent'),                'E · urgent priority');

// detectCostSavings · trigger
const cs1 = detectCostSavings({ sessionUsdSpent: 0.10, criticalCallCount: 8, totalCallCount: 10 });
t(cs1 && cs1.kind === 'cost-savings',                    'F · cost savings detected');
t(cs1.message.includes('40%'),                           'F · message mentions 40%');

// detectCostSavings · no trigger (poc gastat)
eq(detectCostSavings({ sessionUsdSpent: 0.01, criticalCallCount: 5, totalCallCount: 10 }), null, 'F · sotto threshold no');
eq(detectCostSavings({ totalCallCount: 0 }), null,       'F · zero calls no');

// detectKpiAlerts
const processes = [
    { id: 'p1', label: 'Sales', status: 'active', kpis: [{ id: 'k1', label: 'Conv', currentValue: 0.02, target: 0.05 }] },
    { id: 'p2', label: 'Ops',   status: 'active', kpis: [{ id: 'k2', label: 'Q', currentValue: 100, target: 100 }] },
    { id: 'p3', label: 'Paused', status: 'paused', kpis: [{ id: 'k3', label: 'X', currentValue: 1, target: 100 }] },
];
const kpiAlerts = detectKpiAlerts({ processes });
eq(kpiAlerts.length, 1,                                  'G · 1 alert (Sales red · Ops ok · Paused skipped)');
eq(kpiAlerts[0].kind, 'kpi-alert',                       'G · alert kind');
t(kpiAlerts[0].priority === 'high',                      'G · alert priority high');

// detectAuditGaps
const orgAudit = {
    score: 60, state: 'yellow',
    findings: [
        { kind: 'fail', level: 'critical', message: 'wallet en descobert', suggestedWo: 'topup-wallet' },
        { kind: 'warn', level: 'warning', message: 'expenses 30% sobre revenue', suggestedWo: 'review-cost' },
    ],
};
const audits = detectAuditGaps({ orgAudit });
eq(audits.length, 2,                                     'H · 2 audit gaps');
eq(audits[0].priority, 'urgent',                         'H · critical → urgent priority');

// detectBudgetWarning
const bw = detectBudgetWarning({ budgetStatus: { state: 'over', ratio: 1.1, spent: 5.5, budget: 5 } });
t(bw && bw.kind === 'budget-warning',                    'I · budget over detected');
t(bw.priority === 'high',                                'I · over priority high');

const bwHard = detectBudgetWarning({ budgetStatus: { state: 'hard', ratio: 1.3, spent: 6.5, budget: 5 } });
eq(bwHard.priority, 'urgent',                            'I · hard priority urgent');

eq(detectBudgetWarning({ budgetStatus: { state: 'ok' } }), null, 'I · ok no warning');
eq(detectBudgetWarning({ budgetStatus: { state: 'unlimited' } }), null, 'I · unlimited no warning');

// detectWoOverdue
const oldClaimed = [
    { id: 'wo-old', status: 'claimed', claimed_at: 1700000000000 },  // very old
    { id: 'wo-recent', status: 'claimed', claimed_at: Date.now() - 1000 },
];
const overdue = detectWoOverdue({ wos: oldClaimed, ts: Date.now() });
t(overdue && overdue.payload.count === 1,                'J · 1 WO overdue detected');

// detectNetworkMatch
const project = { id: 'me', tags: ['coop', 'culture', 'castellers'] };
const others = [
    { id: 'o1', name: 'Coop Cultura', tags: ['coop', 'culture', 'music'] },     // 2 matches
    { id: 'o2', name: 'Tech', tags: ['tech', 'startup'] },                       // 0 matches
];
const match = detectNetworkMatch({ project, otherProjects: others });
t(match && match.kind === 'network-match',               'K · network match detected');
eq(match.payload.matchedProjectId, 'o1',                 'K · matched the right project');

eq(detectNetworkMatch({ project, otherProjects: [] }), null, 'K · empty others · null');

// buildSuggestionsList · aggregator
const list = buildSuggestionsList({
    context: {
        aiCostStats: { sessionUsdSpent: 0.10, criticalCallCount: 8, totalCallCount: 10 },
        processes,
        orgAudit,
        budgetStatus: { state: 'over', ratio: 1.1, spent: 5.5, budget: 5 },
        wos: oldClaimed,
    },
    limit: 3,
});
eq(list.length, 3,                                       'L · 3 suggestions returned');
// Urgent first
t(list[0].priority === 'urgent' || list[0].priority === 'high', 'L · highest priority first');

// Dismissed
const listDismissed = buildSuggestionsList({
    context: { orgAudit },
    dismissed: ['audit-gap'],
});
t(listDismissed.every(s => s.kind !== 'audit-gap'),      'L · dismissed kind filtered');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
