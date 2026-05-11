// =============================================================================
// TEAMTOWERS SOS V11 — WALLET VIEW (MKT-001 sprint C1)
// Ruta: /js/views/WalletView.js · matchea /wallet?project={id}
//
// Vista del wallet prepago de un proyecto: saldo + 4 tramos de top-up
// (manual en sprint C1 · Stripe Checkout en sprint C2) + ledger de
// movimientos completo.
// =============================================================================

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import {
    getWalletForProject, getOrCreateWalletForProject,
    topUpWallet, adjustWallet, persistWallet, walletStats,
    TOPUP_PRESETS,
} from '../core/walletService.js';
import { renderNavLinksHtml, renderNavGroupedHtml, ensureNavGroupStyle, bindNavGroupDropdowns } from '../core/navService.js';
import { renderExplainerBadge, bindExplainerBadges, ensureExplainerStyle } from '../core/didacticService.js';

const KIND_LABEL = {
    topup:      '⬆ Recarga',
    consume:    '⬇ Consumo',
    refund:     '↩ Reembolso',
    adjustment: '✎ Ajuste',
};
const KIND_COLOR = {
    topup:      '#86efac',
    consume:    '#fca5a5',
    refund:     '#a5b4fc',
    adjustment: '#facc15',
};

export default class WalletView {
    constructor() {
        document.title = 'Wallet · SOS V11';
        this.projectId = null;
        this.project   = null;
        this.wallet    = null;
    }

    async getHtml() {
        await store.init();
        const params = new URLSearchParams(window.location.search);
        this.projectId = params.get('project') || null;
        if (this.projectId) {
            const projects = (store.getState().projects || []);
            this.project = projects.find(p => p.id === this.projectId) || null;
        }

        return `
        <style>
            .w-shell  { height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base,sans-serif); display:flex; flex-direction:column; overflow:hidden; }
            .w-topbar { display:flex; align-items:center; gap:1rem; padding:1rem 1.5rem; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-shrink:0; flex-wrap:wrap; }
            .w-logo   { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .w-logo span { color:#6366f1; }
            .w-title  { color:var(--text-secondary); font-weight:500; letter-spacing:0.05em; text-transform:uppercase; font-size:0.78rem; }
            .w-spacer { flex:1; }
            .w-link   { color:#6366f1; text-decoration:none; font-size:0.85rem; }

            .w-main   { padding:1.5rem; max-width:1080px; margin:0 auto; flex:1; overflow-y:auto; width:100%; box-sizing:border-box; }
            .w-empty  { text-align:center; padding:3rem 1rem; color:var(--text-muted); border:1px dashed #2a2a35; border-radius:8px; }

            .w-hero   { background:linear-gradient(145deg,rgba(34,197,94,0.08),rgba(0,0,0,0)); border:1px solid var(--border-default); border-left:3px solid #22c55e; border-radius:10px; padding:1.5rem; margin-bottom:1.4rem; }
            .w-hero h1 { margin:0; color:var(--text-main); font-size:1.2rem; }
            .w-hero .pname { color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem; }
            .w-balance { display:flex; align-items:baseline; gap:1rem; margin-top:0.8rem; flex-wrap:wrap; }
            .w-balance .amount { font-size:2.4rem; font-weight:700; color:#22c55e; font-family:var(--font-mono,monospace); }
            .w-balance .currency { color:var(--text-secondary); font-size:0.95rem; }

            .w-stats  { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:0.6rem; margin-top:1rem; }
            .w-stat   { background:var(--bg-panel); border:1px solid var(--border-default); border-left:3px solid var(--w-c,#6366f1); border-radius:8px; padding:0.6rem 0.8rem; }
            .w-stat .label { color:var(--text-muted); font-size:0.7rem; font-family:monospace; text-transform:uppercase; letter-spacing:0.05em; }
            .w-stat .value { color:var(--text-main); font-size:1.15rem; font-weight:700; margin-top:0.2rem; font-family:monospace; }

            .w-section h2 { margin:1.6rem 0 0.6rem 0; font-size:0.85rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em; font-family:monospace; }

            .w-topup  { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:0.6rem; }
            .w-preset { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:0.85rem 1rem; cursor:pointer; transition:all 0.15s; text-align:center; color:var(--text-main); }
            .w-preset:hover { background:rgba(34,197,94,0.08); border-color:#22c55e; transform:translateY(-1px); }
            .w-preset .amount { font-size:1.4rem; font-weight:700; color:#22c55e; font-family:monospace; }
            .w-preset .label  { color:var(--text-muted); font-size:0.7rem; margin-top:0.15rem; }

            .w-custom { display:flex; gap:0.5rem; align-items:center; margin-top:0.6rem; flex-wrap:wrap; }
            .w-input  { background:var(--bg-dark); color:var(--text-main); border:1px solid var(--border-default); padding:7px 10px; border-radius:5px; font-family:inherit; font-size:0.85rem; outline:none; }
            .w-btn    { background:var(--bg-elevated); color:var(--text-main); border:1px solid var(--border-default); padding:7px 14px; border-radius:5px; cursor:pointer; font-family:inherit; font-size:0.85rem; }
            .w-btn:hover { background:var(--bg-elevated); }
            .w-btn-primary { background:#22c55e; border-color:#22c55e; color:var(--text-main); }
            .w-btn-primary:hover { background:#16a34a; }
            .w-btn-warn { background:rgba(250,204,21,0.08); border-color:rgba(250,204,21,0.3); color:var(--accent-orange); }

            .w-mvts   { display:flex; flex-direction:column; gap:0.3rem; }
            .w-mvt    { display:grid; grid-template-columns:120px 100px 1fr 100px 110px; gap:0.6rem; padding:0.5rem 0.7rem; background:var(--bg-panel); border:1px solid var(--border-default); border-radius:6px; font-size:0.78rem; align-items:center; }
            .w-mvt .when    { color:var(--text-secondary); font-family:monospace; font-size:0.7rem; }
            .w-mvt .kind    { font-family:monospace; font-size:0.72rem; padding:1px 7px; border-radius:8px; text-align:center; background:var(--glass-hover); }
            .w-mvt .ref     { color:var(--text-muted); font-family:monospace; font-size:0.72rem; word-break:break-all; }
            .w-mvt .amount  { color:var(--text-main); font-family:monospace; text-align:right; font-weight:600; }
            .w-mvt .balance { color:var(--accent-green); font-family:monospace; text-align:right; font-size:0.72rem; }

            .w-banner { background:rgba(250,204,21,0.06); border:1px dashed rgba(250,204,21,0.3); border-radius:8px; padding:0.7rem 0.9rem; font-size:0.78rem; color:var(--accent-orange); margin-top:1rem; line-height:1.45; }
        </style>

        <div class="w-shell">
            <div class="w-topbar">
                <a href="/" data-link class="w-logo">🗼 Team<span>Towers</span></a>
                <span class="w-title">Wallet · prepago del proyecto ${renderExplainerBadge('econom-ia', { size: 'xs' })}</span>
                <div class="w-spacer"></div>
                ${renderNavGroupedHtml({ active: '', projectId: this.projectId, className: 'w-link' })}
            </div>
            <div class="w-main" id="wMain">
                <p style="color:var(--text-muted);font-size:0.85rem;">Cargando…</p>
            </div>
        </div>`;
    }

    async afterRender() {
        ensureExplainerStyle();
        bindExplainerBadges(document);
        if (!this.projectId) {
            document.getElementById('wMain').innerHTML = `
                <div class="w-empty">
                    <p>Esta vista necesita un proyecto activo.</p>
                    <p style="font-size:0.85rem;color:#777;">Abre <a href="/dashboard" data-link class="w-link">el dashboard</a> y entra en un proyecto · luego pulsa <strong>💶 Wallet</strong> en el panel.</p>
                </div>`;
            return;
        }
        await this._load();
        this._render();
    }

    async _load() {
        await KB.init();
        this.wallet = await getOrCreateWalletForProject(this.projectId);
    }

    _render() {
        const main = document.getElementById('wMain');
        if (!main || !this.wallet) return;
        const c = this.wallet.content || {};
        const stats = walletStats(this.wallet);
        const projName = this.project?.nombre || this.project?.name || this.projectId;

        const presetsHtml = TOPUP_PRESETS.map(amt => `
            <button class="w-preset" data-amount="${amt}">
                <div class="amount">+${amt} €</div>
                <div class="label">recarga rápida</div>
            </button>
        `).join('');

        const movements = c.movements || [];
        const mvtsHtml = movements.length ? movements.slice(0, 200).map(mv => {
            const when = new Date(mv.ts).toLocaleString('es-ES');
            const sign = mv.kind === 'consume' ? '−' : (mv.kind === 'adjustment' && mv.amountEur < 0 ? '−' : '+');
            return `
                <div class="w-mvt">
                    <span class="when">${this._esc(when)}</span>
                    <span class="kind" style="color:${KIND_COLOR[mv.kind] || '#aaa'};">${KIND_LABEL[mv.kind] || mv.kind}</span>
                    <span class="ref" title="${this._esc(mv.note || '')}">${this._esc(mv.ref || mv.source || '—')}</span>
                    <span class="amount" style="color:${KIND_COLOR[mv.kind] || '#fff'};">${sign}${Math.abs(mv.amountEur).toFixed(4)} €</span>
                    <span class="balance">→ ${(mv.balanceAfter ?? 0).toFixed(2)} €</span>
                </div>`;
        }).join('') : '<div class="w-empty"><p>Sin movimientos todavía. Recarga el saldo para empezar.</p></div>';

        main.innerHTML = `
            <div class="w-hero">
                <h1 class="mat-hero-h1">💶 Wallet <strong>del projecte</strong></h1>
                <div class="pname">${this._esc(projName)} · <code style="color:var(--text-muted);">${this._esc(this.projectId)}</code></div>
                <div class="w-balance">
                    <span class="amount">${stats.balance.toFixed(2)}</span>
                    <span class="currency">EUR · saldo disponible</span>
                </div>
                <div class="w-stats">
                    <div class="w-stat" style="--w-c:#86efac;">
                        <div class="label">Recargas</div>
                        <div class="value">${stats.totalTopups.toFixed(2)} €</div>
                    </div>
                    <div class="w-stat" style="--w-c:#fca5a5;">
                        <div class="label">Consumido</div>
                        <div class="value">${stats.totalConsumed.toFixed(4)} €</div>
                    </div>
                    <div class="w-stat" style="--w-c:#a5b4fc;">
                        <div class="label">Reembolsos</div>
                        <div class="value">${stats.totalRefunds.toFixed(2)} €</div>
                    </div>
                    <div class="w-stat" style="--w-c:#facc15;">
                        <div class="label">Movimientos</div>
                        <div class="value">${stats.movementCount}</div>
                    </div>
                </div>
            </div>

            <div class="w-banner">
                🚧 <strong>Sprint C1 · recarga manual</strong>. Los botones registran un movimiento <code>topup</code> en el ledger sin pasar por pasarela de pago. <strong>Sprint C2</strong> integrará Stripe Checkout (€) y USDC en Gnosis (cripto) cuando @alvaro provea las claves. Útil ahora para validar el descuento automático del coste IA en Orchestrator (sprint C3).
            </div>

            <div class="w-section">
                <h2>Recargar saldo</h2>
                <div class="w-topup">${presetsHtml}</div>
                <div class="w-custom">
                    <input id="wCustomAmount" class="w-input" type="number" min="0.01" step="0.01" placeholder="Cantidad personalizada · €" style="width:200px;">
                    <input id="wCustomNote" class="w-input" type="text" placeholder="nota opcional" style="flex:1;min-width:200px;">
                    <button class="w-btn w-btn-primary" id="wAddCustom">＋ Recargar</button>
                </div>
            </div>

            <div class="w-section">
                <h2>Ajuste manual (auditoría)</h2>
                <div class="w-custom">
                    <input id="wAdjAmount" class="w-input" type="number" step="0.01" placeholder="±€ · positivo añade · negativo resta" style="width:200px;">
                    <input id="wAdjNote" class="w-input" type="text" placeholder="razón del ajuste" style="flex:1;min-width:200px;">
                    <button class="w-btn w-btn-warn" id="wAddAdj">✎ Ajustar</button>
                </div>
            </div>

            <div class="w-section">
                <h2>Movimientos · ${movements.length} total${movements.length === 1 ? '' : 'es'}${movements.length > 200 ? ' (mostrando últimos 200)' : ''}</h2>
                <div class="w-mvts">${mvtsHtml}</div>
            </div>
        `;

        // Bind presets
        main.querySelectorAll('.w-preset').forEach(btn => {
            btn.addEventListener('click', () => this._doTopUp(parseFloat(btn.dataset.amount), 'preset', ''));
        });
        document.getElementById('wAddCustom')?.addEventListener('click', () => {
            const amt  = parseFloat(document.getElementById('wCustomAmount').value);
            const note = document.getElementById('wCustomNote').value.trim();
            if (!Number.isFinite(amt) || amt <= 0) { alert('Cantidad inválida'); return; }
            this._doTopUp(amt, 'manual', note);
        });
        document.getElementById('wAddAdj')?.addEventListener('click', () => {
            const delta = parseFloat(document.getElementById('wAdjAmount').value);
            const note  = document.getElementById('wAdjNote').value.trim();
            if (!Number.isFinite(delta) || delta === 0) { alert('Cantidad inválida (no puede ser 0)'); return; }
            if (!confirm('¿Confirmar ajuste manual de ' + (delta > 0 ? '+' : '') + delta.toFixed(2) + ' €?\n\n' + (note || '(sin nota)'))) return;
            this._doAdjust(delta, note);
        });
    }

    async _doTopUp(amountEur, source, note) {
        try {
            this.wallet = topUpWallet({ wallet: this.wallet, amountEur, source, ref: 'manual-topup', note });
            await persistWallet(this.wallet);
            this._render();
        } catch (err) {
            console.error('[MKT-001/Wallet] topUp falló:', err);
            alert('Error al recargar: ' + err.message);
        }
    }

    async _doAdjust(deltaEur, note) {
        try {
            this.wallet = adjustWallet({ wallet: this.wallet, deltaEur, note });
            await persistWallet(this.wallet);
            this._render();
        } catch (err) {
            console.error('[MKT-001/Wallet] adjust falló:', err);
            alert('Error en ajuste: ' + err.message);
        }
    }

    _esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }

    destroy() {}
}
