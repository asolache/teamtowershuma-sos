// =============================================================================
// TEAMTOWERS SOS V11 — RECEIPT SERVICE (BIZ-MODEL-001 sprint E)
//
// Service pur per a generar receipts dels topups i altres pagaments
// fets via Stripe. Pre-alfa UE B2C necessitarem invoices completes
// (Stripe Tax + Invoice API) · de moment generem receipts SOS al KB
// que l'usuari pot consultar/imprimir.
//
// Estructura del receipt node KB · type='receipt':
//   id           · unique sequential
//   invoiceNumber· SOS-2026-0001 format
//   topupRef     · ref del moviment topup associat
//   sessionId    · Stripe checkout session (si verified)
//   amountEur    · amount cobrat (després de fees Stripe)
//   currency     · 'eur'
//   issuedAt     · ISO timestamp
//   paymentMethod· 'stripe-verified' | 'manual' | …
//   customerEmail· del payload Stripe (si disponible)
//   lineItems    · [{description, amountEur}]
//   plan         · planId actiu al moment del topup
// =============================================================================

export const RECEIPT_TYPE      = 'receipt';
export const RECEIPT_COUNTER_ID = 'receipt-counter';

// Format invoice number · SOS-{YYYY}-{NNNN}
export function formatInvoiceNumber(year, sequence) {
    const y = Number.isInteger(year) ? year : new Date().getFullYear();
    const seq = Math.max(1, Math.floor(Number(sequence) || 1));
    return 'SOS-' + y + '-' + String(seq).padStart(4, '0');
}

// nextInvoiceSequence · llegeix counter KB · incrementa · persisteix
// Retorna { year, sequence, invoiceNumber }
export async function nextInvoiceSequence({ kb = null, now = Date.now() } = {}) {
    const year = new Date(now).getFullYear();
    let KB = kb;
    if (!KB) {
        try { KB = (await import('./kb.js')).KB; } catch (_) { KB = null; }
    }
    let seq = 1;
    if (KB) {
        try {
            const node = await KB.getNode(RECEIPT_COUNTER_ID);
            if (node && node.content?.year === year && typeof node.content?.sequence === 'number') {
                seq = node.content.sequence + 1;
            }
            await KB.upsert({
                id:   RECEIPT_COUNTER_ID,
                type: 'config',
                content: { year, sequence: seq, updatedAt: now },
                keywords: ['type:receipt-counter'],
                createdAt: now, updatedAt: now,
            });
        } catch (_) {}
    }
    return { year, sequence: seq, invoiceNumber: formatInvoiceNumber(year, seq) };
}

// buildReceipt · pur · genera l'estructura sense persistir
//   topupRef · cadena identificadora del top-up (ex. 'stripe-session-cs_...')
//   amountEur · numeric > 0
//   paymentMethod · 'stripe-verified' default
//   customerEmail · opcional
//   sessionId · opcional · Stripe checkout session
//   planId    · opcional (sprint enforce) · 'free'|'pro'|...
export function buildReceipt({
    invoiceNumber,
    topupRef,
    amountEur,
    currency = 'eur',
    paymentMethod = 'stripe-verified',
    customerEmail = null,
    sessionId = null,
    planId = 'free',
    issuedAt = Date.now(),
    description = null,
} = {}) {
    if (!invoiceNumber) throw new Error('buildReceipt requires invoiceNumber');
    if (typeof amountEur !== 'number' || amountEur <= 0) {
        throw new Error('buildReceipt requires positive amountEur');
    }
    const lineDesc = description || ('Top-up SOS wallet · ' + amountEur.toFixed(2) + ' ' + currency.toUpperCase());
    const id = 'receipt-' + invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_');
    return {
        id,
        type: RECEIPT_TYPE,
        content: {
            invoiceNumber,
            topupRef,
            sessionId,
            amountEur:     Number(amountEur.toFixed(2)),
            currency,
            paymentMethod,
            customerEmail,
            planId,
            issuedAt,
            issuedAtIso:   new Date(issuedAt).toISOString(),
            lineItems: [{ description: lineDesc, amountEur: Number(amountEur.toFixed(2)) }],
            // Marquem visible per a /receipts
            visible: true,
        },
        keywords: [
            'type:receipt',
            'invoice:' + invoiceNumber,
            'paymentMethod:' + paymentMethod,
            ...(sessionId ? ['session:' + sessionId.slice(0, 20)] : []),
        ],
        createdAt: issuedAt,
        updatedAt: issuedAt,
    };
}

// recordReceipt · async · async builder amb counter + persist al KB
export async function recordReceipt({
    topupRef, amountEur, currency, paymentMethod, customerEmail, sessionId, planId, description,
    kb = null, now = Date.now(),
} = {}) {
    const counter = await nextInvoiceSequence({ kb, now });
    const node = buildReceipt({
        invoiceNumber: counter.invoiceNumber,
        topupRef, amountEur, currency, paymentMethod, customerEmail, sessionId, planId, description,
        issuedAt: now,
    });
    let KB = kb;
    if (!KB) { try { KB = (await import('./kb.js')).KB; } catch (_) {} }
    if (KB) {
        try { await KB.upsert(node); } catch (e) { console.warn('[receipt] persist failed', e?.message); }
    }
    return node;
}

// listReceipts · async · llegeix tots els receipts del KB
export async function listReceipts({ kb = null, max = 50 } = {}) {
    let KB = kb;
    if (!KB) { try { KB = (await import('./kb.js')).KB; } catch (_) { return []; } }
    try {
        const list = await KB.query({ type: RECEIPT_TYPE });
        return (list || [])
            .filter(r => r?.content?.visible !== false)
            .sort((a, b) => (b.content?.issuedAt || 0) - (a.content?.issuedAt || 0))
            .slice(0, max);
    } catch (_) { return []; }
}

// renderReceiptHtml · pur · HTML imprimible (print css friendly)
// El consumidor pot inserir-lo a un iframe o window.print() després.
export function renderReceiptHtml(receipt, { logoText = 'TeamTowers SOS V11', companyInfo = 'Local-first · Antigravity' } = {}) {
    const c = receipt?.content || receipt;
    if (!c || !c.invoiceNumber) return '<p>Receipt buit</p>';
    const escape = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    const lineRows = (c.lineItems || []).map(li =>
        `<tr><td>${escape(li.description)}</td><td style="text-align:right;font-family:monospace;">${(li.amountEur || 0).toFixed(2)} ${escape((c.currency || 'eur').toUpperCase())}</td></tr>`
    ).join('');
    const total = (c.lineItems || []).reduce((acc, li) => acc + (li.amountEur || 0), 0);
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escape(c.invoiceNumber)}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 700px; margin: 2rem auto; padding: 1rem; color: #1a1a1a; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a1a1a; padding-bottom: 1rem; margin-bottom: 1.4rem; }
  .head h1 { margin: 0; font-size: 1.4rem; }
  .head .info { font-size: 0.85rem; color: #555; margin-top: 0.4rem; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem 1rem; font-size: 0.9rem; margin-bottom: 1.2rem; }
  .meta dt { font-weight: 600; color: #555; }
  table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
  th, td { padding: 0.6rem 0.4rem; border-bottom: 1px solid #ddd; }
  th { text-align: left; font-weight: 600; }
  .total { font-weight: 700; font-size: 1.1rem; padding-top: 0.8rem; }
  .foot { font-size: 0.78rem; color: #888; margin-top: 1.4rem; padding-top: 0.8rem; border-top: 1px solid #ddd; }
  @media print { body { margin: 0; padding: 1rem; } }
</style></head><body>
  <div class="head">
    <div><h1>${escape(logoText)}</h1><div class="info">${escape(companyInfo)}</div></div>
    <div style="text-align:right;font-family:monospace;font-size:0.95rem;"><strong>Invoice</strong><br>${escape(c.invoiceNumber)}</div>
  </div>
  <dl class="meta">
    <dt>Data</dt><dd>${escape((c.issuedAtIso || '').slice(0, 10))}</dd>
    <dt>Mètode pagament</dt><dd>${escape(c.paymentMethod || '—')}</dd>
    ${c.customerEmail ? `<dt>Client</dt><dd>${escape(c.customerEmail)}</dd>` : ''}
    ${c.sessionId ? `<dt>Stripe session</dt><dd style="font-family:monospace;font-size:0.75rem;">${escape(c.sessionId.slice(0, 30))}…</dd>` : ''}
    ${c.planId ? `<dt>Plan</dt><dd>${escape(c.planId)}</dd>` : ''}
  </dl>
  <table>
    <thead><tr><th>Descripció</th><th style="text-align:right;">Import</th></tr></thead>
    <tbody>
      ${lineRows}
      <tr><td class="total">Total</td><td class="total" style="text-align:right;font-family:monospace;">${total.toFixed(2)} ${escape((c.currency || 'eur').toUpperCase())}</td></tr>
    </tbody>
  </table>
  <div class="foot">
    Aquest rebut és per a referència de l'usuari. Pre-alfa pública · l'invoice fiscal definitiu (UE B2C complaint) serà emès via Stripe Tax + Invoice API al sprint B post-alfa. <br>
    Generat per TeamTowers SOS V11 · ${escape(new Date(c.issuedAt || Date.now()).toLocaleString())}
  </div>
</body></html>`;
}
