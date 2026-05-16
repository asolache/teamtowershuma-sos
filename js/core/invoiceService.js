// =============================================================================
// TEAMTOWERS SOS V11 — INVOICE SERVICE (INVOICE-BILLING sprint A)
// Ruta · /js/core/invoiceService.js
//
// CRUD lleuger d'invoices + transició d'estat + auto-ledger-entry quan
// l'invoice passa a 'paid'. Reusa ledgerService.quickEntry per a la
// integració · així el flow comercial es reflecteix automàticament a la
// comptabilitat. Pure · zero KB · zero DOM.
//
// Schema · invoice node ·
//   { id, type: 'invoice', projectId,
//     content: { number, client, issuedDate, dueDate, items[], currency,
//                taxRate, status, paidAt?, paymentProof?, notes?, ledgerEntryId? },
//     createdAt, updatedAt }
//   item · { description, quantity, unitPrice, total }
//
// Estats · draft → sent → paid · plus overdue (derivat) · cancelled (terminal)
//
// Integration · markInvoicePaid retorna { invoice, ledgerEntry } · el
// consumidor crida KB.upsert per ambdós. L'invoice té ledgerEntryId per
// traçabilitat invertida.
// =============================================================================

import { quickEntry, buildEmptyLedgerEntry, addLeg } from './ledgerService.js';

export const INVOICE_TYPE = 'invoice';

export const INVOICE_STATUS = Object.freeze({
    draft:     { label: 'Draft',     color: '#94a3b8', icon: '✏️',  terminal: false },
    sent:      { label: 'Enviada',   color: '#3b82f6', icon: '📤',  terminal: false },
    paid:      { label: 'Pagada',    color: '#22c55e', icon: '✅',  terminal: true  },
    overdue:   { label: 'Vençuda',   color: '#facc15', icon: '⏰',  terminal: false },
    cancelled: { label: 'Cancel·lada', color: '#ef4444', icon: '✗', terminal: true  },
});

// Transicions vàlides · key 'from' → array de 'to' permesos.
const VALID_TRANSITIONS = Object.freeze({
    draft:     ['sent', 'cancelled'],
    sent:      ['paid', 'overdue', 'cancelled'],
    overdue:   ['paid', 'cancelled'],
    paid:      [],           // terminal
    cancelled: [],           // terminal
});

// generateInvoiceNumber · pura · YYYY-NNNN format · NNNN comptador per any.
// Cal passar invoicesExistents per a no col·lidir.
export function generateInvoiceNumber({ existingInvoices = [], date = null, ts = null } = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    const year = date ? new Date(date).getFullYear() : new Date(now).getFullYear();
    const yPrefix = String(year) + '-';
    let maxNum = 0;
    for (const inv of existingInvoices) {
        const num = inv?.content?.number || '';
        if (!num.startsWith(yPrefix)) continue;
        const tail = parseInt(num.slice(yPrefix.length), 10);
        if (isFinite(tail) && tail > maxNum) maxNum = tail;
    }
    return yPrefix + String(maxNum + 1).padStart(4, '0');
}

// buildEmptyInvoice · pura · invoice sense items, status draft.
export function buildEmptyInvoice({
    projectId    = null,
    number       = null,
    client       = '',
    issuedDate   = null,
    dueDate      = null,
    currency     = 'EUR',
    taxRate      = 0.21,        // 21% IVA per defecte (ES)
    ts           = null,
} = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    const issued = issuedDate || new Date(now).toISOString().slice(0, 10);
    return {
        id:        'inv-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 7),
        type:      INVOICE_TYPE,
        projectId,
        content: {
            number:        number || null,    // setat per generateInvoiceNumber al consumidor
            client,
            issuedDate:    issued,
            dueDate:       dueDate || null,
            items:         [],
            currency,
            taxRate,
            status:        'draft',
            paidAt:        null,
            paymentProof:  null,
            ledgerEntryId: null,
            notes:         '',
        },
        createdAt: now,
        updatedAt: now,
    };
}

// addInvoiceItem · pura · immutable · valida quantity i unitPrice positius.
// total es calcula automàticament (qty * unitPrice).
export function addInvoiceItem(invoice, { description = '', quantity, unitPrice } = {}) {
    if (typeof quantity !== 'number' || !isFinite(quantity) || quantity <= 0) {
        throw new Error('quantity must be positive number');
    }
    if (typeof unitPrice !== 'number' || !isFinite(unitPrice) || unitPrice < 0) {
        throw new Error('unitPrice must be non-negative number');
    }
    const item = {
        description: String(description || ''),
        quantity,
        unitPrice,
        total: round2(quantity * unitPrice),
    };
    return {
        ...invoice,
        content: {
            ...invoice.content,
            items: [...(invoice.content?.items || []), item],
        },
        updatedAt: Date.now(),
    };
}

// removeInvoiceItem · pura · per index
export function removeInvoiceItem(invoice, index) {
    const items = invoice.content?.items || [];
    if (index < 0 || index >= items.length) throw new Error('item index out of range');
    return {
        ...invoice,
        content: {
            ...invoice.content,
            items: items.filter((_, i) => i !== index),
        },
        updatedAt: Date.now(),
    };
}

// computeInvoiceTotals · pura · subtotal · tax · total.
// Tax aplicat sobre subtotal (taxa decimal · ex 0.21 = 21%).
export function computeInvoiceTotals(invoice) {
    const items = invoice?.content?.items || [];
    const taxRate = typeof invoice?.content?.taxRate === 'number' ? invoice.content.taxRate : 0;
    let subtotal = 0;
    for (const it of items) subtotal += (it.total || 0);
    subtotal = round2(subtotal);
    const tax = round2(subtotal * taxRate);
    const total = round2(subtotal + tax);
    return { subtotal, tax, total, taxRate };
}

// validateInvoice · pura · retorna { ok, errors[] }
export function validateInvoice(invoice) {
    const errors = [];
    if (!invoice || !invoice.content) return { ok: false, errors: ['invoice-missing-content'] };
    const c = invoice.content;
    if (!c.client || !String(c.client).trim()) errors.push('client-required');
    if (!c.items || c.items.length === 0)      errors.push('items-required');
    if (!c.currency)                           errors.push('currency-required');
    if (typeof c.taxRate !== 'number' || c.taxRate < 0 || c.taxRate > 1) errors.push('taxRate-out-of-range');
    if (!(c.status in INVOICE_STATUS))         errors.push('unknown-status · ' + c.status);
    const totals = computeInvoiceTotals(invoice);
    if (totals.total <= 0) errors.push('total-must-be-positive');
    return { ok: errors.length === 0, errors, totals };
}

// transitionInvoiceStatus · pura · canvi d'estat amb validation transicions.
// Retorna nou invoice o throws si transició invàlida.
export function transitionInvoiceStatus(invoice, newStatus, { ts = null } = {}) {
    const current = invoice.content?.status;
    if (!current) throw new Error('invoice has no current status');
    if (!(newStatus in INVOICE_STATUS)) throw new Error('unknown target status · ' + newStatus);
    const allowed = VALID_TRANSITIONS[current] || [];
    if (!allowed.includes(newStatus)) {
        throw new Error('invalid-transition · ' + current + ' → ' + newStatus);
    }
    const now = (typeof ts === 'number') ? ts : Date.now();
    const updates = { status: newStatus };
    if (newStatus === 'paid') updates.paidAt = new Date(now).toISOString();
    return {
        ...invoice,
        content: { ...invoice.content, ...updates },
        updatedAt: now,
    };
}

// markInvoicePaid · pura · transició a 'paid' + genera ledger entry automàtic.
// Retorna · { invoice, ledgerEntry }. El consumidor desa ambdós al KB.
//
// Auto-entry · debit cash · credit revenue · per l'amount total (inclou IVA).
// Si l'invoice té tax > 0 · split en 2 credits · revenue (subtotal) +
// tax-payable (tax). Així el ledger separa ingressos d'impostos a pagar.
export function markInvoicePaid(invoice, {
    debitAccount   = 'cash',
    revenueAccount = 'revenue',
    taxAccount     = 'tax-payable',
    paymentProof   = null,
    ts             = null,
} = {}) {
    const validation = validateInvoice(invoice);
    if (!validation.ok) throw new Error('invoice-invalid · ' + validation.errors.join('·'));
    const totals = validation.totals;
    const now = (typeof ts === 'number') ? ts : Date.now();
    const isoDate = new Date(now).toISOString().slice(0, 10);

    // Build ledger entry · si tax==0 · single-credit · si tax>0 · multi-leg
    // Construïm directament amb buildEmpty + addLeg per a 3 legs en cas tax>0.
    const desc = 'Invoice ' + (invoice.content.number || invoice.id) + ' · ' + (invoice.content.client || '');
    let ledgerEntry;
    if (totals.tax > 0) {
        // Inline build · 1 debit + 2 credits
        ledgerEntry = buildEmptyLedgerEntry({
            projectId:   invoice.projectId,
            description: desc,
            date:        isoDate,
            ts:          now,
            currency:    invoice.content.currency,
        });
        ledgerEntry = addLeg(ledgerEntry, { account: debitAccount,   side: 'debit',  amount: totals.total,    currency: invoice.content.currency });
        ledgerEntry = addLeg(ledgerEntry, { account: revenueAccount, side: 'credit', amount: totals.subtotal, currency: invoice.content.currency });
        ledgerEntry = addLeg(ledgerEntry, { account: taxAccount,     side: 'credit', amount: totals.tax,      currency: invoice.content.currency });
        ledgerEntry.content.proof = invoice.id;
        ledgerEntry.content.tags  = ['invoice', 'auto-from-invoice'];
    } else {
        ledgerEntry = quickEntry({
            projectId:     invoice.projectId,
            date:          isoDate,
            description:   desc,
            debitAccount:  debitAccount,
            creditAccount: revenueAccount,
            amount:        totals.total,
            currency:      invoice.content.currency,
            proof:         invoice.id,
            tags:          ['invoice', 'auto-from-invoice'],
            ts:            now,
        });
    }

    const paidInvoice = {
        ...invoice,
        content: {
            ...invoice.content,
            status:        'paid',
            paidAt:        new Date(now).toISOString(),
            paymentProof:  paymentProof || null,
            ledgerEntryId: ledgerEntry.id,
        },
        updatedAt: now,
    };
    return { invoice: paidInvoice, ledgerEntry };
}

// computeInvoicesStatusBreakdown · pura · per al dashboard / lifecycle
// retorna { total, draft, sent, paid, overdue, cancelled, paidRatio }.
// També marca overdue automàticament si dueDate < today i status='sent'.
export function computeInvoicesStatusBreakdown(invoices, { today = null } = {}) {
    const todayStr = today || new Date().toISOString().slice(0, 10);
    const counts = { draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 };
    let totalAmount = 0, paidAmount = 0;
    for (const inv of invoices || []) {
        if (!inv?.content) continue;
        let st = inv.content.status;
        if (st === 'sent' && inv.content.dueDate && inv.content.dueDate < todayStr) {
            st = 'overdue';
        }
        counts[st] = (counts[st] || 0) + 1;
        const t = computeInvoiceTotals(inv);
        totalAmount += t.total;
        if (inv.content.status === 'paid') paidAmount += t.total;
    }
    const total = invoices?.length || 0;
    return {
        ...counts,
        total,
        totalAmount: round2(totalAmount),
        paidAmount:  round2(paidAmount),
        paidRatio:   total > 0 ? counts.paid / total : 0,
    };
}

function round2(n) { return Math.round(n * 100) / 100; }
