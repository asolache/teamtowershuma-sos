// =============================================================================
// invoice.test.js · INVOICE-BILLING sprint A · pure logic + ledger integration
// =============================================================================

import {
    INVOICE_TYPE, INVOICE_STATUS,
    generateInvoiceNumber,
    buildEmptyInvoice,
    addInvoiceItem, removeInvoiceItem,
    computeInvoiceTotals,
    validateInvoice,
    transitionInvoiceStatus,
    markInvoicePaid,
    computeInvoicesStatusBreakdown,
} from '../core/invoiceService.js';
import { validateLedgerEntry, computeBalanceByAccount } from '../core/ledgerService.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');
const near = (a, b, eps, msg) => t(Math.abs(a - b) < eps, msg + ' (~' + b + ', got ' + a + ')');

// ─── A · constants ────────────────────────────────────────────────────────
eq(INVOICE_TYPE, 'invoice',                                       'A · TYPE');
t('draft' in INVOICE_STATUS,                                      'A · draft status');
t('paid' in INVOICE_STATUS,                                       'A · paid status');
t(INVOICE_STATUS.paid.terminal,                                   'A · paid terminal');
t(INVOICE_STATUS.cancelled.terminal,                              'A · cancelled terminal');
t(!INVOICE_STATUS.draft.terminal,                                 'A · draft no terminal');

// ─── B · generateInvoiceNumber ────────────────────────────────────────────
eq(generateInvoiceNumber({ ts: Date.parse('2026-05-14') }), '2026-0001',
                                                                  'B · primer · 0001');
const existing = [
    { content: { number: '2026-0001' } },
    { content: { number: '2026-0002' } },
    { content: { number: '2025-0099' } },     // any anterior · no compta
];
eq(generateInvoiceNumber({ existingInvoices: existing, ts: Date.parse('2026-05-14') }), '2026-0003',
                                                                  'B · següent · 0003 (any actual)');
eq(generateInvoiceNumber({ existingInvoices: existing, ts: Date.parse('2025-12-31') }), '2025-0100',
                                                                  'B · 2025 · 0100');

// ─── C · buildEmptyInvoice ────────────────────────────────────────────────
const inv1 = buildEmptyInvoice({ projectId: 'p1', client: 'Acme', ts: 1700000000000 });
eq(inv1.type, INVOICE_TYPE,                                       'C · type');
eq(inv1.projectId, 'p1',                                          'C · projectId');
eq(inv1.content.client, 'Acme',                                   'C · client');
eq(inv1.content.status, 'draft',                                  'C · status draft');
eq(inv1.content.currency, 'EUR',                                  'C · EUR default');
eq(inv1.content.taxRate, 0.21,                                    'C · 21% IVA default');
eq(inv1.content.items.length, 0,                                  'C · empty items');
t(typeof inv1.id === 'string' && inv1.id.startsWith('inv-'),      'C · id prefix inv-');

// ─── D · addInvoiceItem + immutability ────────────────────────────────────
const inv2 = addInvoiceItem(inv1, { description: 'Consultoria', quantity: 10, unitPrice: 50 });
eq(inv2.content.items.length, 1,                                  'D · 1 item afegit');
eq(inv2.content.items[0].total, 500,                              'D · total 10*50=500');
eq(inv1.content.items.length, 0,                                  'D · immutable · orig sense canviar');

let threw = false;
try { addInvoiceItem(inv1, { quantity: 0, unitPrice: 50 }); } catch (_) { threw = true; }
t(threw,                                                          'D · quantity 0 throws');
threw = false;
try { addInvoiceItem(inv1, { quantity: 1, unitPrice: -1 }); } catch (_) { threw = true; }
t(threw,                                                          'D · negative unitPrice throws');

// ─── E · removeInvoiceItem ─────────────────────────────────────────────────
let inv3 = addInvoiceItem(inv2, { quantity: 1, unitPrice: 100, description: 'Extra' });
eq(inv3.content.items.length, 2,                                  'E · 2 items');
inv3 = removeInvoiceItem(inv3, 0);
eq(inv3.content.items.length, 1,                                  'E · 1 item després remove');
eq(inv3.content.items[0].description, 'Extra',                    'E · resta l\'extra');

threw = false;
try { removeInvoiceItem(inv3, 99); } catch (_) { threw = true; }
t(threw,                                                          'E · index out of range throws');

// ─── F · computeInvoiceTotals · sense IVA i amb IVA ───────────────────────
let invNoTax = buildEmptyInvoice({ client: 'Acme', taxRate: 0 });
invNoTax = addInvoiceItem(invNoTax, { quantity: 2, unitPrice: 100 });
invNoTax = addInvoiceItem(invNoTax, { quantity: 1, unitPrice: 50 });
const totNoTax = computeInvoiceTotals(invNoTax);
eq(totNoTax.subtotal, 250,                                        'F · subtotal 250');
eq(totNoTax.tax, 0,                                               'F · tax 0');
eq(totNoTax.total, 250,                                           'F · total 250');

let invTax = buildEmptyInvoice({ client: 'Acme', taxRate: 0.21 });
invTax = addInvoiceItem(invTax, { quantity: 1, unitPrice: 1000 });
const totTax = computeInvoiceTotals(invTax);
eq(totTax.subtotal, 1000,                                         'F · IVA · subtotal 1000');
eq(totTax.tax, 210,                                               'F · IVA · tax 210');
eq(totTax.total, 1210,                                            'F · IVA · total 1210');

// ─── G · validateInvoice ──────────────────────────────────────────────────
eq(validateInvoice(invTax).ok, true,                              'G · valid invoice');
const noClient = buildEmptyInvoice({ taxRate: 0 });
const noClientWithItem = addInvoiceItem(noClient, { quantity: 1, unitPrice: 100 });
const v1 = validateInvoice(noClientWithItem);
eq(v1.ok, false,                                                  'G · no client invalid');
t(v1.errors.includes('client-required'),                          'G · error client-required');

const noItems = buildEmptyInvoice({ client: 'X' });
const v2 = validateInvoice(noItems);
eq(v2.ok, false,                                                  'G · no items invalid');
t(v2.errors.includes('items-required'),                           'G · error items-required');

const badTaxRate = buildEmptyInvoice({ client: 'X', taxRate: 1.5 });
const badTaxWithItem = addInvoiceItem(badTaxRate, { quantity: 1, unitPrice: 100 });
const v3 = validateInvoice(badTaxWithItem);
eq(v3.ok, false,                                                  'G · taxRate > 1 invalid');
t(v3.errors.some(e => e.includes('taxRate')),                     'G · error taxRate-out-of-range');

// ─── H · transitionInvoiceStatus ──────────────────────────────────────────
const draftInv = addInvoiceItem(buildEmptyInvoice({ client: 'X' }), { quantity: 1, unitPrice: 100 });
const sentInv = transitionInvoiceStatus(draftInv, 'sent');
eq(sentInv.content.status, 'sent',                                'H · draft → sent ok');
eq(draftInv.content.status, 'draft',                              'H · immutable · orig sense canviar');

threw = false;
try { transitionInvoiceStatus(draftInv, 'paid'); } catch (_) { threw = true; }
t(threw,                                                          'H · draft → paid invalid (cal sent)');

threw = false;
try { transitionInvoiceStatus(draftInv, 'wrongstatus'); } catch (_) { threw = true; }
t(threw,                                                          'H · unknown status throws');

// paid terminal · no transition
const paidInv = transitionInvoiceStatus(sentInv, 'paid', { ts: Date.parse('2026-06-01') });
eq(paidInv.content.status, 'paid',                                'H · sent → paid ok');
t(typeof paidInv.content.paidAt === 'string',                     'H · paidAt set');
threw = false;
try { transitionInvoiceStatus(paidInv, 'cancelled'); } catch (_) { threw = true; }
t(threw,                                                          'H · paid terminal · no transitions');

// ─── I · markInvoicePaid · auto ledger entry ──────────────────────────────
let invToPay = buildEmptyInvoice({ projectId: 'p1', client: 'Acme', taxRate: 0.21, currency: 'EUR' });
invToPay = addInvoiceItem(invToPay, { quantity: 1, unitPrice: 1000, description: 'Servei' });
invToPay = transitionInvoiceStatus(invToPay, 'sent');

const result = markInvoicePaid(invToPay, { ts: Date.parse('2026-06-01') });
t(result.invoice && result.ledgerEntry,                           'I · retorna { invoice, ledgerEntry }');
eq(result.invoice.content.status, 'paid',                         'I · invoice status paid');
eq(result.invoice.content.ledgerEntryId, result.ledgerEntry.id,   'I · ledgerEntryId enllaçat');
t(typeof result.invoice.content.paidAt === 'string',              'I · paidAt set');

// Ledger entry vàlid · 3 legs (debit cash + credit revenue + credit tax)
const led = result.ledgerEntry;
eq(led.content.legs.length, 3,                                    'I · 3 legs amb IVA');
const lv = validateLedgerEntry(led);
eq(lv.ok, true,                                                   'I · ledger entry valid (balanced)');
eq(lv.debitTotal, 1210,                                           'I · debit total 1210 (amb IVA)');
eq(lv.creditTotal, 1210,                                          'I · credit total 1210');

const cashLeg = led.content.legs.find(l => l.account === 'cash');
eq(cashLeg.amount, 1210,                                          'I · cash debit 1210');
const revLeg = led.content.legs.find(l => l.account === 'revenue');
eq(revLeg.amount, 1000,                                           'I · revenue credit 1000 (subtotal)');
const taxLeg = led.content.legs.find(l => l.account === 'tax-payable');
eq(taxLeg.amount, 210,                                            'I · tax-payable credit 210');

// Tags traçabilitat
t(led.content.tags.includes('invoice'),                           'I · tag invoice');
t(led.content.tags.includes('auto-from-invoice'),                 'I · tag auto-from-invoice');
eq(led.content.proof, invToPay.id,                                'I · proof = invoice id');

// markInvoicePaid amb tax 0 · single quickEntry · 2 legs
let invNoTaxPay = buildEmptyInvoice({ projectId: 'p1', client: 'X', taxRate: 0 });
invNoTaxPay = addInvoiceItem(invNoTaxPay, { quantity: 1, unitPrice: 500 });
invNoTaxPay = transitionInvoiceStatus(invNoTaxPay, 'sent');
const r2 = markInvoicePaid(invNoTaxPay, { ts: Date.parse('2026-06-02') });
eq(r2.ledgerEntry.content.legs.length, 2,                         'I · no tax · 2 legs');

// invalid invoice throws
threw = false;
try { markInvoicePaid(buildEmptyInvoice({ client: 'X' })); } catch (_) { threw = true; }
t(threw,                                                          'I · invalid invoice (no items) throws');

// ─── J · computeInvoicesStatusBreakdown ───────────────────────────────────
const mockInv = (status, total, dueDate = null) => {
    let inv = buildEmptyInvoice({ client: 'X', dueDate, taxRate: 0 });
    inv = addInvoiceItem(inv, { quantity: 1, unitPrice: total });
    inv.content.status = status;
    return inv;
};
const invs = [
    mockInv('draft', 100),
    mockInv('sent',  200),
    mockInv('sent',  150, '2025-01-01'),    // overdue (passat)
    mockInv('paid',  300),
    mockInv('paid',  400),
    mockInv('cancelled', 50),
];
const br = computeInvoicesStatusBreakdown(invs, { today: '2026-05-14' });
eq(br.total, 6,                                                   'J · total 6');
eq(br.draft, 1,                                                   'J · draft 1');
eq(br.sent, 1,                                                    'J · sent 1 (l\'altre passa a overdue)');
eq(br.overdue, 1,                                                 'J · overdue 1 (auto-detected dueDate)');
eq(br.paid, 2,                                                    'J · paid 2');
eq(br.cancelled, 1,                                               'J · cancelled 1');
near(br.paidAmount, 700, 0.01,                                    'J · paidAmount 700');
near(br.totalAmount, 1200, 0.01,                                  'J · totalAmount 1200');
near(br.paidRatio, 2/6, 0.001,                                    'J · paidRatio 0.333');

// ─── K · integration · paid invoice → ledger balances ─────────────────────
// Quan paid invoice genera entry · podem compute balance i veure el revenue
let intInv = buildEmptyInvoice({ projectId: 'pX', client: 'Acme', taxRate: 0.21 });
intInv = addInvoiceItem(intInv, { quantity: 1, unitPrice: 100 });
intInv = transitionInvoiceStatus(intInv, 'sent');
const intResult = markInvoicePaid(intInv);
const balances = computeBalanceByAccount([intResult.ledgerEntry]);
eq(balances.get('cash').balance, 121,                             'K · cash 121 (100 + 21 IVA)');
eq(balances.get('revenue').balance, 100,                          'K · revenue 100');
eq(balances.get('tax-payable').balance, 21,                       'K · tax-payable 21');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
