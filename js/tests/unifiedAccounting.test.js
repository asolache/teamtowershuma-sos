// WALLET-ACC-001 sprint A · tests stand-alone per unifiedAccountingService.
// Ús: node js/tests/unifiedAccounting.test.js

import {
    aggregateMovementsForOwner,
    summarizeAccounting,
    categoryForMovement,
    loadAllAccountingNodes,
} from '../core/unifiedAccountingService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== WALLET-ACC-001 sprint A · unifiedAccountingService ===\n');

// ─── A · categoryForMovement ────────────────────────────────────────────
eq(categoryForMovement('stripe-verified', 'topup'), 'topup',          'A · stripe-verified → topup');
eq(categoryForMovement('ai-fill', 'consume'),       'ai',             'A · ai-fill → ai');
eq(categoryForMovement('public-project-publish', 'consume'), 'permaweb', 'A · permaweb publish → permaweb');
eq(categoryForMovement('workshop-revenue-creator', 'topup'), 'workshop-revenue', 'A · workshop-revenue → workshop-revenue');
eq(categoryForMovement('workshop-unlock', 'consume'), 'workshop-expense', 'A · workshop-unlock → workshop-expense');
eq(categoryForMovement('unknown-source', 'consume'), 'expense',       'A · unknown source consume → expense');
eq(categoryForMovement('unknown', 'topup'),         'topup',          'A · unknown topup → topup');

// ─── B · aggregateMovementsForOwner · cas bàsic ─────────────────────────
const wallet1 = {
    id: 'wallet-proj-A', type: 'wallet',
    content: {
        projectId: 'proj-A', balanceEur: 50,
        movements: [
            { ts: 100, kind: 'topup',   amountEur: 100, source: 'stripe-verified', ref: 'cs-1', balanceAfter: 100 },
            { ts: 200, kind: 'consume', amountEur: 5,   source: 'ai-fill',         ref: 'ai-1', balanceAfter: 95 },
            { ts: 300, kind: 'consume', amountEur: 0.05,source: 'public-project-publish', balanceAfter: 94.95 },
            { ts: 400, kind: 'consume', amountEur: 44.95, source: 'workshop-unlock', balanceAfter: 50 },
        ],
    },
};
const wallet2 = {
    id: 'wallet-proj-B', type: 'wallet',
    content: {
        projectId: 'proj-B', balanceEur: 30,
        movements: [
            { ts: 500, kind: 'topup',   amountEur: 30, source: 'stripe-verified', balanceAfter: 30 },
        ],
    },
};
const walletPersonal = {
    id: 'wallet-__personal_@alvaro__', type: 'wallet',
    content: {
        projectId: '__personal_@alvaro__', balanceEur: 70,
        movements: [
            { ts: 600, kind: 'topup', amountEur: 70, source: 'workshop-revenue-creator', balanceAfter: 70 },
        ],
    },
};
const walletStranger = {
    id: 'wallet-proj-X', type: 'wallet',
    content: {
        projectId: 'proj-X', balanceEur: 999,
        movements: [{ ts: 1, kind: 'topup', amountEur: 999, balanceAfter: 999 }],
    },
};

const aggAll = aggregateMovementsForOwner({
    walletNodes:     [wallet1, wallet2, walletPersonal, walletStranger],
    ownerHandle:     '@alvaro',
    ownerProjectIds: ['proj-A', 'proj-B'],
});
eq(aggAll.walletCount,         3,                                    'B · 3 wallets matched (proj-A, proj-B, personal)');
eq(aggAll.movements.length,    6,                                    'B · 6 moviments totals (no inclou stranger)');
t(!aggAll.movements.some(m => m.walletId === 'wallet-proj-X'),       'B · stranger wallet exclòs');
eq(aggAll.totalIncome,         200,                                  'B · totalIncome 100+30+70=200');
eq(aggAll.totalExpense,        50,                                   'B · totalExpense 5+0.05+44.95=50');
eq(aggAll.netBalance,          150,                                  'B · netBalance 200-50=150');

// Categoria breakdown · ai = 5 · permaweb = 0.05 · workshop-expense = 44.95
eq(aggAll.totalsByCategory.ai,            5,                         'B · totals.ai = 5€');
eq(aggAll.totalsByCategory.permaweb,      0.05,                      'B · totals.permaweb = 0.05€');
eq(aggAll.totalsByCategory['workshop-expense'], 44.95,               'B · totals.workshop-expense = 44.95€');
eq(aggAll.totalsByCategory['workshop-revenue'], 70,                  'B · totals.workshop-revenue = 70€');
eq(aggAll.totalsByCategory.topup,         130,                       'B · totals.topup = 100+30 = 130€');

// Ordenats DESC per ts
t(aggAll.movements[0].ts === 600,                                     'B · movements ordenats per ts DESC');

// ─── C · sense filtre · agafa tots els wallets ──────────────────────────
const aggNoFilter = aggregateMovementsForOwner({
    walletNodes: [wallet1, wallet2, walletStranger],
});
eq(aggNoFilter.walletCount, 3,                                        'C · sense filtre · agafa tots');
t(aggNoFilter.movements.some(m => m.walletId === 'wallet-proj-X'),    'C · sense filtre · stranger inclòs');

// ─── D · sols ownerHandle (sense projectIds) · agafa personal wallet ───
const aggHandleOnly = aggregateMovementsForOwner({
    walletNodes: [wallet1, wallet2, walletPersonal, walletStranger],
    ownerHandle: '@alvaro',
});
eq(aggHandleOnly.walletCount, 1,                                      'D · sols handle · 1 wallet (personal)');
eq(aggHandleOnly.movements[0].walletId, 'wallet-__personal_@alvaro__','D · sols handle · personal wallet');

// ─── E · agg buit ────────────────────────────────────────────────────────
const aggEmpty = aggregateMovementsForOwner({});
eq(aggEmpty.walletCount,    0,                                        'E · sense input · walletCount 0');
eq(aggEmpty.movements.length, 0,                                      'E · sense input · 0 moviments');
eq(aggEmpty.totalIncome,    0,                                        'E · sense input · totalIncome 0');

// ─── F · summarizeAccounting · text resum ──────────────────────────────
const summary = summarizeAccounting(aggAll);
t(summary.includes('3 wallet'),                                       'F · summary inclou wallet count');
t(summary.includes('200.00'),                                         'F · summary inclou totalIncome');
t(summary.includes('150.00'),                                         'F · summary inclou netBalance');

// ─── G · loadAllAccountingNodes · injectable kb ────────────────────────
let queryCalls = [];
const mockKb = {
    query: async ({ type }) => {
        queryCalls.push(type);
        return [{ id: 'mock-' + type, type }];
    },
};
const loaded = await loadAllAccountingNodes({ kb: mockKb });
eq(queryCalls.length,         4,                                      'G · 4 queries · wallet + receipt + ai_audit + workshop_unlock');
t(queryCalls.includes('wallet'),                                      'G · query type wallet');
t(queryCalls.includes('receipt'),                                     'G · query type receipt');
t(queryCalls.includes('ai_audit'),                                    'G · query type ai_audit');
t(queryCalls.includes('workshop_unlock'),                             'G · query type workshop_unlock');
t(loaded.walletNodes.length === 1,                                    'G · walletNodes carregats');

// ─── H · receipt + audit + unlock arrays propagats ─────────────────────
const aggWithExtras = aggregateMovementsForOwner({
    walletNodes:        [wallet1],
    receiptNodes:       [{ id: 'r1', content: { issuedAt: 100 } }, { id: 'r2', content: { issuedAt: 200 } }],
    aiAuditNodes:       [{ id: 'a1', content: { createdAt: 50 } }],
    workshopUnlockNodes:[{ id: 'u1', content: { unlockedAt: 75 } }],
});
eq(aggWithExtras.receipts.length, 2,                                  'H · receipts propagats');
eq(aggWithExtras.aiAudits.length, 1,                                  'H · aiAudits propagats');
eq(aggWithExtras.workshopUnlocks.length, 1,                           'H · workshopUnlocks propagats');
// Receipts ordenats DESC per issuedAt
eq(aggWithExtras.receipts[0].id, 'r2',                                'H · receipts ordenats DESC per issuedAt');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
