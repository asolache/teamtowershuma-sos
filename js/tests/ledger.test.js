// =============================================================================
// ledger.test.js · LEDGER-ACCOUNTING sprint A · double-entry pure tests
// =============================================================================

import {
    LEDGER_ENTRY_TYPE, STANDARD_ACCOUNTS,
    accountKindFor,
    buildEmptyLedgerEntry,
    addLeg,
    validateLedgerEntry,
    computeBalanceByAccount,
    computePLForPeriod,
    computeBalanceSheet,
    quickEntry,
} from '../core/ledgerService.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');
const near = (a, b, eps, msg) => t(Math.abs(a - b) < eps, msg + ' (expected ~' + b + ', got ' + a + ')');

// ─── A · constants + accountKindFor ───────────────────────────────────────
eq(LEDGER_ENTRY_TYPE, 'ledger_entry',                             'A · TYPE');
t(STANDARD_ACCOUNTS.length > 5,                                   'A · >5 standard accounts');
const cashMeta = accountKindFor('cash');
eq(cashMeta.kind, 'asset',                                        'A · cash · asset');
eq(cashMeta.positiveSide, 'debit',                                'A · cash · debit positive');
const revMeta = accountKindFor('revenue');
eq(revMeta.kind, 'income',                                        'A · revenue · income');
eq(revMeta.positiveSide, 'credit',                                'A · revenue · credit positive');
const custom = accountKindFor('my-custom-acc');
eq(custom.kind, 'asset',                                          'A · custom default · asset');

// ─── B · buildEmptyLedgerEntry ────────────────────────────────────────────
const e1 = buildEmptyLedgerEntry({ projectId: 'p1', description: 'd', ts: 1700000000000 });
eq(e1.type, LEDGER_ENTRY_TYPE,                                    'B · type');
eq(e1.projectId, 'p1',                                            'B · projectId');
eq(e1.content.legs.length, 0,                                     'B · empty legs');
eq(e1.content.currency, 'EUR',                                    'B · EUR default');
eq(e1.content.date, '2023-11-14',                                 'B · date from ts ISO YYYY-MM-DD');
t(typeof e1.id === 'string' && e1.id.startsWith('le-'),           'B · id prefix le-');

// ─── C · addLeg + immutability ────────────────────────────────────────────
const e2 = addLeg(e1, { account: 'cash', side: 'debit', amount: 100 });
eq(e2.content.legs.length, 1,                                     'C · 1 leg afegit');
eq(e2.content.legs[0].account, 'cash',                            'C · account ok');
eq(e2.content.legs[0].side, 'debit',                              'C · side ok');
eq(e2.content.legs[0].amount, 100,                                'C · amount ok');
eq(e2.content.legs[0].currency, 'EUR',                            'C · currency inherits');
eq(e1.content.legs.length, 0,                                     'C · immutable · orig sense canvi');

let threw = false;
try { addLeg(e1, { account: 'x', side: 'wrong', amount: 1 }); } catch (_) { threw = true; }
t(threw,                                                          'C · bad side throws');
threw = false;
try { addLeg(e1, { account: 'x', side: 'debit', amount: -1 }); } catch (_) { threw = true; }
t(threw,                                                          'C · negative amount throws');
threw = false;
try { addLeg(e1, { side: 'debit', amount: 1 }); } catch (_) { threw = true; }
t(threw,                                                          'C · missing account throws');

// ─── D · validateLedgerEntry ──────────────────────────────────────────────
const eIncomplete = addLeg(e1, { account: 'cash', side: 'debit', amount: 100 });
const v1 = validateLedgerEntry(eIncomplete);
eq(v1.ok, false,                                                  'D · 1 leg invalid');
t(v1.errors.some(e => e.includes('needs-2-legs')),                'D · error needs-2-legs');

let eBalanced = e1;
eBalanced = addLeg(eBalanced, { account: 'cash',    side: 'debit',  amount: 100 });
eBalanced = addLeg(eBalanced, { account: 'revenue', side: 'credit', amount: 100 });
const v2 = validateLedgerEntry(eBalanced);
eq(v2.ok, true,                                                   'D · balanced 2 legs valid');
eq(v2.debitTotal, 100,                                            'D · debitTotal 100');
eq(v2.creditTotal, 100,                                           'D · creditTotal 100');

// Mismatch
let eMismatch = e1;
eMismatch = addLeg(eMismatch, { account: 'cash',    side: 'debit',  amount: 100 });
eMismatch = addLeg(eMismatch, { account: 'revenue', side: 'credit', amount: 90  });
const v3 = validateLedgerEntry(eMismatch);
eq(v3.ok, false,                                                  'D · mismatch invalid');
t(v3.errors.some(e => e.includes('not-balanced')),                'D · error not-balanced');

// Floating point tolerance
let eFp = e1;
eFp = addLeg(eFp, { account: 'cash',    side: 'debit',  amount: 100.005 });
eFp = addLeg(eFp, { account: 'revenue', side: 'credit', amount: 100.005 });
eq(validateLedgerEntry(eFp).ok, true,                             'D · tolerance fp 0.01');

// Mixed currencies
let eMix = e1;
eMix = addLeg(eMix, { account: 'cash',    side: 'debit',  amount: 100, currency: 'EUR' });
eMix = addLeg(eMix, { account: 'revenue', side: 'credit', amount: 100, currency: 'USD' });
const vMix = validateLedgerEntry(eMix);
eq(vMix.ok, false,                                                'D · mixed currencies invalid');
t(vMix.errors.some(e => e.includes('mixed-currencies')),          'D · error mixed-currencies');

// ─── E · quickEntry · helper ──────────────────────────────────────────────
const q1 = quickEntry({
    projectId: 'p1', description: 'venda', amount: 200,
    debitAccount: 'cash', creditAccount: 'revenue',
});
eq(validateLedgerEntry(q1).ok, true,                              'E · quickEntry valid');
eq(q1.content.legs.length, 2,                                     'E · 2 legs');

threw = false;
try { quickEntry({ debitAccount: 'cash', amount: 100 }); } catch (_) { threw = true; }
t(threw,                                                          'E · missing creditAccount throws');
threw = false;
try { quickEntry({ debitAccount: 'cash', creditAccount: 'revenue', amount: 0 }); } catch (_) { threw = true; }
t(threw,                                                          'E · zero amount throws');

// ─── F · computeBalanceByAccount ──────────────────────────────────────────
// 3 entries · 2 vendes (200 + 150) + 1 despesa (50)
const entries = [
    quickEntry({ debitAccount: 'cash',     creditAccount: 'revenue', amount: 200, date: '2026-01-15', ts: Date.parse('2026-01-15') }),
    quickEntry({ debitAccount: 'cash',     creditAccount: 'revenue', amount: 150, date: '2026-02-10', ts: Date.parse('2026-02-10') }),
    quickEntry({ debitAccount: 'expenses', creditAccount: 'cash',    amount: 50,  date: '2026-02-20', ts: Date.parse('2026-02-20') }),
];
const balances = computeBalanceByAccount(entries);
eq(balances.size, 3,                                              'F · 3 accounts');
const cashB = balances.get('cash');
eq(cashB.debit, 350,                                              'F · cash debit total 350');
eq(cashB.credit, 50,                                              'F · cash credit total 50');
eq(cashB.balance, 300,                                            'F · cash balance 300 (asset · debit-credit)');
const revB = balances.get('revenue');
eq(revB.balance, 350,                                             'F · revenue balance 350 (income · credit-debit)');
const expB = balances.get('expenses');
eq(expB.balance, 50,                                              'F · expenses balance 50 (expense · debit-credit)');

// asOf filtering
const bJan = computeBalanceByAccount(entries, { asOf: '2026-01-31' });
eq(bJan.get('cash').balance, 200,                                 'F · asOf jan · cash 200');
t(!bJan.has('expenses') || bJan.get('expenses').balance === 0,    'F · asOf jan · sense expenses');

// ─── G · computePLForPeriod ───────────────────────────────────────────────
const plAll = computePLForPeriod(entries, {});
eq(plAll.revenue, 350,                                            'G · revenue all 350');
eq(plAll.expenses, 50,                                            'G · expenses all 50');
eq(plAll.profit, 300,                                             'G · profit 300');

const plFeb = computePLForPeriod(entries, { from: '2026-02-01', to: '2026-02-28' });
eq(plFeb.revenue, 150,                                            'G · feb revenue 150');
eq(plFeb.expenses, 50,                                            'G · feb expenses 50');
eq(plFeb.profit, 100,                                             'G · feb profit 100');

const plMar = computePLForPeriod(entries, { from: '2026-03-01' });
eq(plMar.revenue, 0,                                              'G · mar revenue 0');
eq(plMar.profit, 0,                                               'G · mar profit 0');

// ─── H · computeBalanceSheet · balanced (assets = L+E) ────────────────────
// Inclou un equity entry · fundador aporta 1000
const withEquity = entries.concat([
    quickEntry({ debitAccount: 'cash', creditAccount: 'equity', amount: 1000, date: '2026-01-01', ts: Date.parse('2026-01-01') }),
]);
const bs = computeBalanceSheet(withEquity);
near(bs.totalAssets, 1300, 0.01,                                  'H · totalAssets 1300 (cash 1300)');
near(bs.totalEquity, 1000 + 300, 0.01,                            'H · equity 1000 + retained 300 = 1300');
near(bs.retainedEarnings, 300, 0.01,                              'H · retainedEarnings 300');
eq(bs.balanced, true,                                             'H · balanced sheet');

// ─── I · invalid entries skipped al compute ────────────────────────────────
const mixedSet = [
    quickEntry({ debitAccount: 'cash', creditAccount: 'revenue', amount: 100, date: '2026-01-01' }),
    eMismatch,  // invalid
    eMix,       // invalid
];
const bMixed = computeBalanceByAccount(mixedSet);
eq(bMixed.get('cash').debit, 100,                                 'I · mismatch entries skipped');
eq(bMixed.get('cash').balance, 100,                               'I · sols el valid compta');

// ─── J · custom account ────────────────────────────────────────────────────
const customEntry = quickEntry({
    debitAccount: 'my-custom-acc', creditAccount: 'cash',
    amount: 75, date: '2026-01-05',
});
const balC = computeBalanceByAccount([customEntry]);
const customB = balC.get('my-custom-acc');
eq(customB.balance, 75,                                           'J · custom asset balance 75');
eq(customB.kind, 'asset',                                         'J · custom default kind asset');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
