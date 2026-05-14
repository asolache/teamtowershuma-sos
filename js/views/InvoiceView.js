// =============================================================================
// TEAMTOWERS SOS V11 — INVOICE VIEW (INVOICE-BILLING sprint A)
// Ruta · /js/views/InvoiceView.js  →  /invoices?project={id}
//
// CRUD invoices · llista per status · formulari nou amb add/remove items ·
// transition status · mark paid (auto ledger entry) · print-css friendly.
// =============================================================================

import { KB } from '../core/kb.js';
import {
    INVOICE_TYPE, INVOICE_STATUS,
    generateInvoiceNumber,
    buildEmptyInvoice,
    addInvoiceItem,
    computeInvoiceTotals,
    validateInvoice,
    transitionInvoiceStatus,
    markInvoicePaid,
    computeInvoicesStatusBreakdown,
} from '../core/invoiceService.js';

export default class InvoiceView {

    constructor() {
        document.title = 'Facturació · SOS V11';
        try {
            const u = new URL(window.location.href);
            this.projectId  = u.searchParams.get('project') || null;
            this.openInvoice = u.searchParams.get('inv') || null;
        } catch (_) { this.projectId = null; this.openInvoice = null; }
        this.project  = null;
        this.invoices = [];
    }

    async getHtml() {
        if (!this.projectId) return this._htmlNoProject();
        try { this.project = await KB.getNode(this.projectId); } catch (_) { this.project = null; }
        if (!this.project) return this._htmlNotFound();
        try {
            this.invoices = await KB.query({ type: INVOICE_TYPE, projectId: this.projectId }) || [];
        } catch (_) { this.invoices = []; }
        return this._htmlMain();
    }

    async afterRender() {
        if (!this.project) return;
        this._bindCreate();
        this._bindRowActions();
    }

    _htmlNoProject() {
        return `<div style="min-height:100dvh;background:var(--bg-dark);color:var(--text-main);font-family:var(--font-base);padding:2rem;">
            <div style="max-width:600px;margin:4rem auto;text-align:center;background:var(--bg-panel);padding:2rem;border-radius:8px;border:1px solid var(--border-default);">
                <h1>🧾 Facturació</h1>
                <p>Cal indicar projecte · <code>?project=&lt;projectId&gt;</code>.</p>
                <a href="/dashboard" data-link style="color:var(--accent-indigo);">← Dashboard</a>
            </div></div>`;
    }
    _htmlNotFound() {
        return `<div style="min-height:100dvh;background:var(--bg-dark);color:var(--text-main);font-family:var(--font-base);padding:2rem;">
            <div style="max-width:600px;margin:4rem auto;text-align:center;background:var(--bg-panel);padding:2rem;border-radius:8px;border:1px solid var(--border-default);">
                <h1>⚠ Projecte no trobat</h1><p><code>${this._esc(this.projectId)}</code></p>
                <a href="/dashboard" data-link style="color:var(--accent-indigo);">← Dashboard</a>
            </div></div>`;
    }

    _htmlMain() {
        const projName = this.project.nombre || this.project.name || this.project.id;
        const br = computeInvoicesStatusBreakdown(this.invoices);

        const sorted = this.invoices.slice().sort((a, b) => (b.content?.issuedDate || '').localeCompare(a.content?.issuedDate || ''));
        const todayStr = new Date().toISOString().slice(0, 10);
        const rows = sorted.length === 0
            ? '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:20px;">Cap factura encara · usa el botó per crear-ne una</td></tr>'
            : sorted.map(inv => {
                const c = inv.content || {};
                let st = c.status;
                if (st === 'sent' && c.dueDate && c.dueDate < todayStr) st = 'overdue';
                const meta = INVOICE_STATUS[st] || INVOICE_STATUS.draft;
                const totals = computeInvoiceTotals(inv);
                const actions = [];
                if (c.status === 'draft')   actions.push(`<button class="iv-btn-sm" data-act="send" data-id="${inv.id}">📤 Enviar</button>`);
                if (c.status === 'sent' || st === 'overdue') actions.push(`<button class="iv-btn-sm iv-btn-pay" data-act="pay" data-id="${inv.id}">✓ Pagada</button>`);
                if (!meta.terminal)         actions.push(`<button class="iv-btn-sm iv-btn-x" data-act="cancel" data-id="${inv.id}">✗</button>`);
                actions.push(`<a class="iv-btn-sm" href="?project=${encodeURIComponent(this.projectId)}&inv=${encodeURIComponent(inv.id)}#print" data-link onclick="setTimeout(()=>window.print(),300);return false;">🖨</a>`);
                return `<tr>
                    <td style="font-family:var(--font-mono);font-size:11px;">${this._esc(c.number || '—')}</td>
                    <td>${this._esc(c.client || '')}</td>
                    <td style="font-family:var(--font-mono);font-size:11px;">${this._esc(c.issuedDate || '')}</td>
                    <td style="font-family:var(--font-mono);font-size:11px;">${this._esc(c.dueDate || '—')}</td>
                    <td style="text-align:right;font-family:var(--font-mono);">${totals.total.toFixed(2)} ${this._esc(c.currency || 'EUR')}</td>
                    <td><span style="background:${meta.color}25;color:${meta.color};padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;font-family:var(--font-mono);">${meta.icon} ${this._esc(meta.label.toUpperCase())}</span></td>
                    <td style="text-align:right;white-space:nowrap;">${actions.join(' ')}</td>
                </tr>`;
            }).join('');

        // Stats breakdown
        const statsHtml = `
            <div class="iv-stats">
                <div class="iv-stat"><span class="iv-stat-num">${br.total}</span><span class="iv-stat-lbl">Total</span></div>
                <div class="iv-stat" style="color:#3b82f6;"><span class="iv-stat-num">${br.sent + br.overdue}</span><span class="iv-stat-lbl">Pendents</span></div>
                <div class="iv-stat" style="color:#facc15;"><span class="iv-stat-num">${br.overdue}</span><span class="iv-stat-lbl">Vençudes</span></div>
                <div class="iv-stat" style="color:#22c55e;"><span class="iv-stat-num">${br.paid}</span><span class="iv-stat-lbl">Pagades</span></div>
                <div class="iv-stat" style="color:#22c55e;"><span class="iv-stat-num">${br.paidAmount.toFixed(0)}</span><span class="iv-stat-lbl">Cobrat €</span></div>
                <div class="iv-stat"><span class="iv-stat-num">${br.totalAmount.toFixed(0)}</span><span class="iv-stat-lbl">Facturat €</span></div>
            </div>
        `;

        return `
        <style>
            .iv-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); }
            .iv-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-wrap:wrap; }
            .iv-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .iv-logo span { color:var(--accent-indigo); }
            .iv-main { max-width:1200px; margin:0 auto; padding:1.5rem; }
            .iv-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem 1.2rem; margin-bottom:1rem; }
            .iv-stats { display:grid; grid-template-columns:repeat(6,1fr); gap:8px; }
            @media (max-width:780px) { .iv-stats { grid-template-columns:repeat(3,1fr); } }
            .iv-stat { background:#0008; border:1px solid var(--border-default); border-radius:6px; padding:10px; text-align:center; }
            .iv-stat-num { display:block; font-size:1.4rem; font-weight:700; font-family:var(--font-mono); }
            .iv-stat-lbl { display:block; font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-top:2px; }
            table.iv-rows { width:100%; border-collapse:collapse; font-size:0.82rem; }
            table.iv-rows th, table.iv-rows td { padding:8px; text-align:left; border-bottom:1px solid var(--border-default); }
            table.iv-rows th { background:#0008; font-size:11px; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-muted); }
            .iv-btn-sm { display:inline-block; padding:3px 8px; border-radius:3px; border:1px solid var(--border-default); background:var(--bg-dark); color:var(--text-main); font-size:11px; cursor:pointer; text-decoration:none; }
            .iv-btn-sm:hover { background:var(--glass-hover); }
            .iv-btn-pay { background:#22c55e; border-color:#22c55e; color:#fff; }
            .iv-btn-x { background:#ef4444; border-color:#ef4444; color:#fff; }
            .iv-form { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:8px; margin-top:8px; }
            .iv-form input, .iv-form select, .iv-form textarea { background:#000; color:var(--text-main); border:1px solid var(--border-default); border-radius:4px; padding:6px 8px; font-family:var(--font-base); font-size:0.82rem; }
            .iv-items-form { display:grid; grid-template-columns:3fr 1fr 1fr auto; gap:6px; margin-top:6px; align-items:center; }
            .iv-items-list { margin-top:8px; font-family:var(--font-mono); font-size:0.78rem; }
            .iv-item-row { display:grid; grid-template-columns:3fr 1fr 1fr 1fr auto; gap:6px; padding:4px 0; border-top:1px solid var(--border-default); }
            .iv-btn { padding:8px 14px; border-radius:4px; border:1px solid #22c55e; background:#22c55e; color:#fff; font-size:0.82rem; font-weight:600; cursor:pointer; }
            .iv-msg { font-size:11px; font-family:var(--font-mono); margin-top:6px; }
            .iv-msg.ok { color:#22c55e; }
            .iv-msg.err { color:#ef4444; }
            @media print { .iv-topbar, .iv-btn, .iv-btn-sm, button { display:none !important; } body { background:#fff !important; color:#000 !important; } .iv-card { border-color:#ccc !important; background:#fff !important; color:#000 !important; } }
        </style>
        <div class="iv-shell">
            <div class="iv-topbar">
                <a href="/dashboard" data-link class="iv-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Facturació</span>
                <span style="flex:1;"></span>
                <a href="/lifecycle?project=${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">🌀 Lifecycle</a>
                <a href="/accounting?project=${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">📒 Compta</a>
                <a href="/project/${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">← Hub</a>
            </div>
            <div class="iv-main">
                <h1 style="margin:0 0 1rem 0;font-size:1.35rem;">🧾 ${this._esc(projName)} · Facturació</h1>

                ${statsHtml}

                <div class="iv-card" style="margin-top:1rem;">
                    <h3 style="margin:0 0 0.6rem 0;">➕ Nova factura</h3>
                    <p style="font-size:0.78rem;color:var(--text-secondary);margin:0 0 0.4rem 0;">Quan marquis "✓ Pagada", es generarà automàticament un apunt al ledger (debit cash · credit revenue + tax-payable).</p>
                    <div class="iv-form">
                        <input type="text" id="ivClient" placeholder="Client (nom o entitat)">
                        <input type="date" id="ivIssued" value="${todayStr}">
                        <input type="date" id="ivDue" placeholder="Venciment">
                        <select id="ivCurrency">
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                        </select>
                        <input type="number" id="ivTaxRate" value="0.21" step="0.01" min="0" max="1" title="Tax rate decimal · 0.21 = 21%">
                    </div>
                    <div class="iv-items-form">
                        <input type="text" id="ivItemDesc" placeholder="Descripció del concepte">
                        <input type="number" id="ivItemQty" placeholder="Qty" step="0.01" min="0" value="1">
                        <input type="number" id="ivItemPrice" placeholder="Preu/u" step="0.01" min="0">
                        <button class="iv-btn-sm" id="ivAddItem">+ Item</button>
                    </div>
                    <div id="ivItemsPreview" class="iv-items-list"></div>
                    <div style="margin-top:10px;">
                        <button class="iv-btn" id="ivCreate">💾 Crear factura</button>
                        <span class="iv-msg" id="ivMsg"></span>
                    </div>
                </div>

                <div class="iv-card">
                    <h3 style="margin:0 0 0.6rem 0;">📑 Factures · ${this.invoices.length}</h3>
                    <table class="iv-rows">
                        <thead><tr><th>Núm</th><th>Client</th><th>Emesa</th><th>Venciment</th><th style="text-align:right;">Total</th><th>Estat</th><th></th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
    }

    _bindCreate() {
        const addItemBtn = document.getElementById('ivAddItem');
        const preview    = document.getElementById('ivItemsPreview');
        const items      = [];

        const refreshPreview = () => {
            if (!preview) return;
            if (items.length === 0) { preview.innerHTML = '<div style="color:var(--text-muted);font-size:11px;padding:4px 0;">cap item encara · afegeix mínim 1</div>'; return; }
            preview.innerHTML = items.map((it, i) =>
                `<div class="iv-item-row"><span>${this._esc(it.description)}</span><span>×${it.quantity}</span><span>${it.unitPrice.toFixed(2)}</span><span style="text-align:right;">${(it.quantity * it.unitPrice).toFixed(2)}</span><button class="iv-btn-sm iv-btn-x" data-rm-idx="${i}">✗</button></div>`
            ).join('');
            preview.querySelectorAll('[data-rm-idx]').forEach(btn => btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.rmIdx, 10);
                items.splice(idx, 1);
                refreshPreview();
            }));
        };
        refreshPreview();

        if (addItemBtn) addItemBtn.addEventListener('click', () => {
            const desc = document.getElementById('ivItemDesc')?.value || '';
            const qty  = parseFloat(document.getElementById('ivItemQty')?.value);
            const pr   = parseFloat(document.getElementById('ivItemPrice')?.value);
            if (!desc.trim()) { this._setMsg('descripció requerida', 'err'); return; }
            if (!qty || qty <= 0) { this._setMsg('quantity > 0', 'err'); return; }
            if (typeof pr !== 'number' || pr < 0) { this._setMsg('preu >= 0', 'err'); return; }
            items.push({ description: desc, quantity: qty, unitPrice: pr });
            // Reset inputs
            const dEl = document.getElementById('ivItemDesc'); if (dEl) dEl.value = '';
            const pEl = document.getElementById('ivItemPrice'); if (pEl) pEl.value = '';
            refreshPreview();
            this._setMsg('+ item afegit · ' + items.length + ' total', 'ok');
        });

        const createBtn = document.getElementById('ivCreate');
        if (createBtn) createBtn.addEventListener('click', async () => {
            const client  = document.getElementById('ivClient')?.value.trim();
            const issued  = document.getElementById('ivIssued')?.value;
            const due     = document.getElementById('ivDue')?.value || null;
            const cur     = document.getElementById('ivCurrency')?.value || 'EUR';
            const taxRate = parseFloat(document.getElementById('ivTaxRate')?.value);
            if (!client) { this._setMsg('client requerit', 'err'); return; }
            if (items.length === 0) { this._setMsg('mínim 1 item', 'err'); return; }
            try {
                let inv = buildEmptyInvoice({
                    projectId: this.projectId, client, issuedDate: issued, dueDate: due,
                    currency: cur, taxRate: isFinite(taxRate) ? taxRate : 0.21,
                });
                inv.content.number = generateInvoiceNumber({ existingInvoices: this.invoices, date: issued });
                for (const it of items) inv = addInvoiceItem(inv, it);
                const val = validateInvoice(inv);
                if (!val.ok) { this._setMsg('✗ ' + val.errors.join(' · '), 'err'); return; }
                await KB.upsert(inv);
                this._setMsg('✓ factura ' + inv.content.number + ' creada (€' + val.totals.total.toFixed(2) + ')', 'ok');
                setTimeout(() => window.location.reload(), 500);
            } catch (e) {
                this._setMsg('✗ ' + (e?.message || 'error'), 'err');
            }
        });
    }

    _bindRowActions() {
        document.querySelectorAll('[data-act]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const act = btn.dataset.act;
                const id  = btn.dataset.id;
                const inv = this.invoices.find(x => x.id === id);
                if (!inv) return;
                try {
                    if (act === 'send') {
                        const next = transitionInvoiceStatus(inv, 'sent');
                        await KB.upsert(next);
                    } else if (act === 'cancel') {
                        const next = transitionInvoiceStatus(inv, 'cancelled');
                        await KB.upsert(next);
                    } else if (act === 'pay') {
                        // Si en draft · primer enviar (transició draft→sent→paid)
                        let working = inv;
                        if (working.content.status === 'draft') working = transitionInvoiceStatus(working, 'sent');
                        const { invoice: paid, ledgerEntry } = markInvoicePaid(working);
                        await KB.upsert(paid);
                        await KB.upsert(ledgerEntry);
                    }
                    setTimeout(() => window.location.reload(), 200);
                } catch (e) {
                    alert('Error · ' + (e?.message || 'desconegut'));
                }
            });
        });
    }

    _setMsg(text, kind) {
        const msg = document.getElementById('ivMsg');
        if (msg) { msg.textContent = text; msg.className = 'iv-msg ' + (kind || ''); }
    }

    _esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
