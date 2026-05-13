// BIZ-MODEL-001 sprint E · tests stand-alone per receiptService
// Ús: node js/tests/receipt.test.js

import * as svc from '../core/receiptService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== BIZ-MODEL-001 sprint E · receiptService ===\n');

// ─── Mock KB · in-memory ────────────────────────────────────────────────
function makeMockKb() {
    const m = new Map();
    return {
        store: m,
        getNode: async (id) => m.get(id) || null,
        upsert:  async (n) => { m.set(n.id, n); return n; },
        query:   async (q) => Array.from(m.values()).filter(n => !q.type || n.type === q.type),
    };
}

// ─── A · formatInvoiceNumber ────────────────────────────────────────────
eq(svc.formatInvoiceNumber(2026, 1),    'SOS-2026-0001',              'A · 2026/1 · SOS-2026-0001');
eq(svc.formatInvoiceNumber(2026, 42),   'SOS-2026-0042',              'A · 2026/42 · padded 4 digits');
eq(svc.formatInvoiceNumber(2026, 9999), 'SOS-2026-9999',              'A · 2026/9999 · no overflow');
eq(svc.formatInvoiceNumber(2027, 1),    'SOS-2027-0001',              'A · year change ok');

// ─── B · nextInvoiceSequence · primer cop · 1 ──────────────────────────
const kb1 = makeMockKb();
const r1 = await svc.nextInvoiceSequence({ kb: kb1, now: new Date('2026-05-13T10:00:00').getTime() });
eq(r1.year,           2026,                                           'B · primer cop · year 2026');
eq(r1.sequence,       1,                                              'B · primer cop · sequence 1');
eq(r1.invoiceNumber,  'SOS-2026-0001',                                'B · primer cop · invoiceNumber');
t(kb1.store.has(svc.RECEIPT_COUNTER_ID),                              'B · counter persistit al KB');

// 2n cop · 2
const r2 = await svc.nextInvoiceSequence({ kb: kb1, now: new Date('2026-05-13T10:01:00').getTime() });
eq(r2.sequence,       2,                                              'B · segon cop · seq 2');
eq(r2.invoiceNumber,  'SOS-2026-0002',                                'B · invoice 0002');

// 3r cop · 3
const r3 = await svc.nextInvoiceSequence({ kb: kb1, now: Date.now() });
eq(r3.sequence,       3,                                              'B · 3r cop · seq 3');

// Year change · reset a 1
const kb2 = makeMockKb();
await svc.nextInvoiceSequence({ kb: kb2, now: new Date('2026-12-31T23:00:00').getTime() });
const r4 = await svc.nextInvoiceSequence({ kb: kb2, now: new Date('2027-01-01T00:01:00').getTime() });
eq(r4.year,           2027,                                           'B · year change · 2027');
eq(r4.sequence,       1,                                              'B · year change · sequence resets to 1');

// ─── C · buildReceipt · estructura completa ─────────────────────────────
const recC = svc.buildReceipt({
    invoiceNumber: 'SOS-2026-0001',
    topupRef:      'stripe-session-cs_test_abc',
    amountEur:     10.00,
    currency:      'eur',
    paymentMethod: 'stripe-verified',
    customerEmail: 'user@example.com',
    sessionId:     'cs_test_abc1234567890',
    planId:        'pro',
    issuedAt:      1700000000000,
});
eq(recC.type, svc.RECEIPT_TYPE,                                       'C · type=receipt');
eq(recC.content.invoiceNumber, 'SOS-2026-0001',                       'C · invoiceNumber');
eq(recC.content.amountEur,     10.00,                                 'C · amountEur');
eq(recC.content.currency,      'eur',                                 'C · currency');
eq(recC.content.paymentMethod, 'stripe-verified',                     'C · paymentMethod');
eq(recC.content.customerEmail, 'user@example.com',                    'C · customerEmail');
eq(recC.content.planId,        'pro',                                 'C · planId');
t(Array.isArray(recC.content.lineItems) && recC.content.lineItems.length === 1, 'C · 1 line item');
t(recC.content.issuedAtIso.startsWith('2023-'),                       'C · issuedAtIso ISO format');
t(recC.keywords.includes('type:receipt'),                             'C · keyword type:receipt');

// ─── D · buildReceipt · errors ──────────────────────────────────────────
let threw = null;
try { svc.buildReceipt({ amountEur: 10 }); } catch (e) { threw = e; }
t(threw && /invoiceNumber/.test(threw.message),                       'D · sense invoiceNumber · throw');

threw = null;
try { svc.buildReceipt({ invoiceNumber: 'SOS-X', amountEur: -1 }); } catch (e) { threw = e; }
t(threw && /positive/.test(threw.message),                            'D · amountEur negatiu · throw');

threw = null;
try { svc.buildReceipt({ invoiceNumber: 'SOS-X', amountEur: 'bad' }); } catch (e) { threw = e; }
t(threw,                                                              'D · amountEur not number · throw');

// ─── E · recordReceipt · persist amb counter automatic ──────────────────
const kb3 = makeMockKb();
const rec1 = await svc.recordReceipt({
    topupRef: 'stripe-cs1', amountEur: 10, paymentMethod: 'stripe-verified', kb: kb3,
    now: new Date('2026-05-13').getTime(),
});
eq(rec1.content.invoiceNumber, 'SOS-2026-0001',                       'E · 1r receipt · invoice 0001');
t(kb3.store.has(rec1.id),                                             'E · receipt persistit');

const rec2 = await svc.recordReceipt({
    topupRef: 'stripe-cs2', amountEur: 25, paymentMethod: 'stripe-verified', kb: kb3,
    now: new Date('2026-05-13T10:01').getTime(),
});
eq(rec2.content.invoiceNumber, 'SOS-2026-0002',                       'E · 2n receipt · invoice 0002');

// ─── F · listReceipts · ordenats DESC + max ─────────────────────────────
const list = await svc.listReceipts({ kb: kb3 });
eq(list.length, 2,                                                    'F · listReceipts · 2 receipts');
eq(list[0].content.invoiceNumber, 'SOS-2026-0002',                    'F · més recent primer');
eq(list[1].content.invoiceNumber, 'SOS-2026-0001',                    'F · més antic després');

const list1 = await svc.listReceipts({ kb: kb3, max: 1 });
eq(list1.length, 1,                                                   'F · max=1 · 1 result');

// Filter visibility · si invisible · no surt
const hidden = svc.buildReceipt({
    invoiceNumber: 'SOS-2026-9999', topupRef: 'x', amountEur: 5,
});
hidden.content.visible = false;
await kb3.upsert(hidden);
const list3 = await svc.listReceipts({ kb: kb3 });
eq(list3.length, 2,                                                   'F · invisible · skipped del list');

// ─── G · renderReceiptHtml · HTML imprimible ───────────────────────────
const html = svc.renderReceiptHtml(rec1);
t(typeof html === 'string' && html.length > 100,                      'G · HTML retornat');
t(html.includes('SOS-2026-0001'),                                     'G · HTML conté invoiceNumber');
t(html.includes('TeamTowers SOS'),                                    'G · HTML conté logo');
t(html.includes('10.00 EUR'),                                         'G · HTML mostra amount');
t(html.includes('<table'),                                            'G · HTML té table line items');
t(html.includes('@media print'),                                      'G · HTML té print CSS');

// receipt buit · graceful
const htmlEmpty = svc.renderReceiptHtml(null);
t(htmlEmpty.includes('Receipt buit'),                                 'G · null · mensaje fallback');

// ─── H · constants exportades ──────────────────────────────────────────
eq(svc.RECEIPT_TYPE, 'receipt',                                       'H · RECEIPT_TYPE');
eq(svc.RECEIPT_COUNTER_ID, 'receipt-counter',                         'H · RECEIPT_COUNTER_ID');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
