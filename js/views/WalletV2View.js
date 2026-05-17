// =============================================================================
// TEAMTOWERS SOS V11 — WALLET V2 (v128 · pla integrat finances + comptabilitat)
// Ruta · /js/views/WalletV2View.js  →  /wallet/v2?project=X
//
// Reemplaça el WalletView legacy (757 LOC dispersos) amb 6 pestanyes
// estructurades · cada una respon a UNA pregunta del power user ·
//
//   💰 Saldo        · "Quants € tinc · runway · KPIs 30d"
//   📊 Transaccions · "Tot moviment · filtrable · exportable"
//   🛒 Compres      · "Què he pagat per recarregar (Stripe + crypto)"
//   🥧 Tarta        · "Slicing pie del projecte" (embed /value-accounting)
//   📁 Projectes    · "Tots els meus wallets · grid"
//   ⚙ Top-up       · "Recarregar amb Stripe o crypto"
//
// Disseny · sosTopbar canonical (v125) · tokens color-coded per categoria.
// Backend · reutilitza walletService · stripeService · cryptoTopupService
// · unifiedAccountingService · valueAccountingService (zero nova lògica core).
//
// Vegeu · docs/wallet-v2-accounting-integration-plan.md per al pla complet.
// =============================================================================

import { store } from '../core/store.js';
import { KB } from '../core/kb.js';
import { renderViewTopbar, ensureTopbarStyle, projectContextLinks } from '../core/sosTopbar.js';
import { getOrCreateWalletForProject, walletStats, personalWalletIdFor } from '../core/walletService.js';
import { aggregateMovementsForOwner, loadAllAccountingNodes } from '../core/unifiedAccountingService.js';

const VALID_TABS = Object.freeze(['saldo', 'transaccions', 'compres', 'tarta', 'projectes', 'topup']);

const TAB_META = Object.freeze({
    saldo:        { icon: '💰', label: 'Saldo',         desc: 'KPIs · runway · graf 30d' },
    transaccions: { icon: '📊', label: 'Transaccions',  desc: 'Filtrable · exportable CSV' },
    compres:      { icon: '🛒', label: 'Compres',       desc: 'Stripe + crypto top-ups' },
    tarta:        { icon: '🥧', label: 'Tarta',         desc: 'Slicing pie del projecte', requiresProject: true },
    projectes:    { icon: '📁', label: 'Projectes',     desc: 'Tots els meus wallets' },
    topup:        { icon: '⚙',  label: 'Top-up',        desc: 'Recarregar · Stripe + crypto' },
});

export default class WalletV2View {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Wallet v2 · SOS';
        this._projectId = null;
        this._project = null;
        this._activeTab = 'saldo';
        // v129 · estat per a Transaccions tab · filtres + paginació
        this._txFilters = { kind: 'all', projectId: 'all', period: '30d', search: '' };
        this._txPage = 1;
        this._txPageSize = 50;
        // v129 · cache async data
        this._wallet = null;
        this._aggregation = null;
    }

    async getHtml() {
        await store.init();
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        const path = (typeof window !== 'undefined' ? window.location.pathname : '');
        this._projectId = params.get('project') || null;
        const tab = params.get('tab');
        if (tab && VALID_TABS.includes(tab)) this._activeTab = tab;
        else if (path === '/ledger') this._activeTab = 'transaccions';   // v129 · alias semàntic
        if (this._projectId) {
            this._project = (store.getState().projects || []).find(p => p.id === this._projectId) || null;
        }
        return this._renderShell();
    }

    async afterRender() {
        ensureTopbarStyle();
        // Bind tab switching
        document.querySelectorAll('[data-w2-tab]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.getAttribute('data-w2-tab');
                if (VALID_TABS.includes(tab)) {
                    this._activeTab = tab;
                    this._updateUrl();
                    this._renderActiveTab();
                }
            });
        });
        this._renderActiveTab();
    }

    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    _updateUrl() {
        if (typeof window === 'undefined' || !window.history) return;
        const params = new URLSearchParams(window.location.search);
        params.set('tab', this._activeTab);
        if (this._projectId) params.set('project', this._projectId);
        const newUrl = window.location.pathname + '?' + params.toString();
        window.history.replaceState({}, '', newUrl);
    }

    _renderShell() {
        const projName = this._project?.nombre || this._project?.name || this._projectId || 'Personal';
        const subtitle = this._projectId ? this._projectId : 'wallet personal';
        const tabsHtml = VALID_TABS.map(tabId => {
            const meta = TAB_META[tabId];
            if (meta.requiresProject && !this._projectId) return '';   // skip Tarta si no hi ha projecte
            const active = (this._activeTab === tabId) ? ' w2-tab-active' : '';
            return `<button type="button" class="w2-tab${active}" data-w2-tab="${tabId}" title="${this._esc(meta.desc)}"><span>${meta.icon}</span><span class="w2-tab-label">${this._esc(meta.label)}</span></button>`;
        }).join('');

        const contextLinks = projectContextLinks({ projectId: this._projectId, current: 'wallet' });

        return `
        <style>
            .w2-shell { min-height: 100dvh; background: var(--bg-dark); color: var(--text-main); font-family: var(--font-base); display: flex; flex-direction: column; }
            .w2-tabs { display: flex; gap: 4px; padding: 6px 12px; background: var(--bg-panel); border-bottom: 1px solid var(--border-default); overflow-x: auto; flex-wrap: nowrap; align-items: center; }
            .w2-tab { background: transparent; color: var(--text-secondary); border: 1px solid transparent; padding: 6px 12px; border-radius: 999px; font-size: 0.84rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; font-family: inherit; transition: all 120ms; }
            .w2-tab:hover { background: var(--glass-hover); color: var(--text-main); }
            .w2-tab-active { background: rgba(99,102,241,0.15); border-color: var(--accent-indigo); color: var(--accent-indigo); }
            .w2-tab:focus-visible { outline: 2px solid var(--accent-indigo); outline-offset: 2px; }
            .w2-main { flex: 1; padding: 1.2rem 1.5rem; max-width: 1200px; margin: 0 auto; width: 100%; box-sizing: border-box; overflow-y: auto; }
            .w2-panel { background: var(--bg-panel); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 1.2rem 1.4rem; }
            .w2-loading { text-align: center; padding: 2rem; color: var(--text-muted); }
            .w2-placeholder { display: flex; flex-direction: column; gap: 12px; padding: 2rem; text-align: center; border: 1px dashed var(--border-default); border-radius: var(--radius-md); }
            .w2-placeholder h2 { margin: 0; font-size: 1.1rem; color: var(--text-main); }
            .w2-placeholder p { margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; }
            .w2-placeholder code { background: var(--bg-elevated); padding: 1px 6px; border-radius: 3px; font-family: var(--font-mono); font-size: 0.78rem; }
            /* v129 · KPIs · activity chart · CTA */
            .w2-cta, .w2-cta-primary, .w2-cta-small { background: var(--bg-elevated); color: var(--text-main); border: 1px solid var(--border-default); padding: 6px 12px; border-radius: var(--radius-sm); cursor: pointer; font-size: 0.82rem; font-weight: 600; font-family: var(--font-base); transition: all 120ms; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
            .w2-cta:hover, .w2-cta-primary:hover { background: var(--glass-hover); border-color: var(--accent-indigo); }
            .w2-cta-primary { background: #22c55e; border-color: #22c55e; color: #fff; }
            .w2-cta-primary:hover { background: #16a34a; border-color: #16a34a; }
            .w2-cta-small { padding: 4px 8px; font-size: 0.74rem; }
            .w2-panel + .w2-panel, .w2-kpi-grid + .w2-panel, .w2-panel + .w2-kpi-grid { margin-top: 14px; }
            .w2-kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin-top: 14px; }
            .w2-kpi { background: var(--bg-panel); border: 1px solid var(--border-default); border-left: 3px solid var(--w2-c, #6366f1); border-radius: var(--radius-md); padding: 10px 14px; }
            .w2-kpi-label { color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; font-family: var(--font-mono); }
            .w2-kpi-value { color: var(--text-main); font-size: 1.6rem; font-weight: 700; font-family: var(--font-mono); margin-top: 4px; }
            .w2-kpi-sub { color: var(--text-muted); font-size: 0.72rem; margin-top: 2px; }
            .w2-bars-chart { display: flex; align-items: flex-end; gap: 3px; height: 80px; padding-top: 6px; border-bottom: 1px solid var(--border-default); }
            .w2-bar-col { flex: 1; display: flex; flex-direction: column-reverse; justify-content: flex-end; height: 100%; gap: 1px; min-width: 2px; }
            .w2-bar-in { background: #22c55e; border-radius: 2px 2px 0 0; min-height: 0; transition: opacity 120ms; }
            .w2-bar-out { background: #ef4444; border-radius: 2px 2px 0 0; min-height: 0; transition: opacity 120ms; }
            .w2-bar-col:hover .w2-bar-in, .w2-bar-col:hover .w2-bar-out { opacity: 0.8; }
            /* v129 · Transaccions · filtres · taula · paginació */
            .w2-tx-filters { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; margin-bottom: 14px; }
            .w2-tx-filters label { display: flex; flex-direction: column; gap: 4px; font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
            .w2-tx-filters select, .w2-tx-filters input { background: var(--bg-elevated); color: var(--text-main); border: 1px solid var(--border-default); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 0.85rem; font-family: var(--font-base); }
            .w2-tx-summary { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 0.85rem; color: var(--text-secondary); border-top: 1px solid var(--border-default); }
            .w2-tx-table-wrap { overflow-x: auto; margin-top: 8px; }
            .w2-tx-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
            .w2-tx-table th { text-align: left; padding: 8px 10px; color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid var(--border-default); background: var(--bg-panel); position: sticky; top: 0; }
            .w2-tx-table td { padding: 8px 10px; border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.04)); }
            .w2-tx-table tr:hover td { background: var(--glass-hover); }
            .w2-tx-date { font-family: var(--font-mono); color: var(--text-muted); font-size: 0.74rem; }
            .w2-tx-kind { display: inline-block; padding: 1px 7px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.7rem; text-transform: uppercase; }
            .w2-kind-topup { background: rgba(34,197,94,0.18); color: #86efac; }
            .w2-kind-consume { background: rgba(239,68,68,0.18); color: #fca5a5; }
            .w2-kind-refund { background: rgba(165,180,252,0.18); color: #a5b4fc; }
            .w2-kind-adjustment { background: rgba(250,204,21,0.18); color: #fbbf24; }
            .w2-kind-transfer-in, .w2-kind-transfer-out { background: rgba(99,102,241,0.18); color: var(--accent-indigo); }
            .w2-tx-cat, .w2-tx-proj { color: var(--text-secondary); font-size: 0.78rem; }
            .w2-tx-desc { color: var(--text-main); overflow: hidden; text-overflow: ellipsis; max-width: 320px; white-space: nowrap; }
            .w2-tx-amount { text-align: right; font-family: var(--font-mono); font-weight: 600; }
            .w2-tx-pager { display: flex; justify-content: center; align-items: center; gap: 14px; padding: 10px 0; margin-top: 10px; }
            /* v129 · Projectes grid · multi-wallet */
            .w2-proj-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
            .w2-proj-card { background: var(--bg-elevated); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; min-height: 160px; }
            .w2-proj-card:hover { border-color: var(--accent-indigo); }
            .w2-proj-current { border-color: #22c55e; box-shadow: 0 0 0 1px rgba(34,197,94,0.3); }
            .w2-proj-head { display: flex; justify-content: space-between; align-items: center; gap: 6px; font-size: 0.86rem; }
            .w2-proj-curr-badge { font-size: 0.65rem; background: rgba(34,197,94,0.18); color: #86efac; padding: 1px 6px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.04em; }
            .w2-proj-balance { font-size: 1.6rem; font-weight: 700; font-family: var(--font-mono); }
            .w2-proj-stats { display: flex; gap: 12px; color: var(--text-muted); font-size: 0.72rem; font-family: var(--font-mono); }
            .w2-proj-runway { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-family: var(--font-mono); align-self: flex-start; }
            .w2-runway-good { background: rgba(34,197,94,0.15); color: #86efac; }
            .w2-runway-warn { background: rgba(250,204,21,0.15); color: #fbbf24; }
            .w2-runway-bad { background: rgba(239,68,68,0.18); color: #fca5a5; }
            .w2-proj-actions { display: flex; gap: 6px; margin-top: 6px; }
            .w2-proj-error { color: var(--accent-red); font-size: 0.78rem; }
            @media (max-width: 720px) {
                .w2-main { padding: 1rem 0.8rem; }
                .w2-tab-label { display: none; }
                .w2-tab { padding: 6px 9px; }
                .w2-tx-filters label { flex: 1; min-width: 110px; }
                .w2-tx-desc { max-width: 160px; }
            }
        </style>
        <div class="w2-shell">
            ${renderViewTopbar({
                icon: '💰', title: 'Wallet · ' + projName, subtitle,
                contextLinks: contextLinks.map(l => ({ ...l })),
            })}
            <nav class="w2-tabs" role="tablist" aria-label="Pestanyes del wallet">${tabsHtml}</nav>
            <main class="w2-main" id="w2Main">
                <div class="w2-loading">⏳ Carregant…</div>
            </main>
        </div>`;
    }

    _renderActiveTab() {
        const main = document.getElementById('w2Main');
        if (!main) return;
        switch (this._activeTab) {
            case 'saldo':        return this._renderTabSaldo(main);
            case 'transaccions': return this._renderTabTransaccions(main);
            case 'compres':      return this._renderTabCompres(main);
            case 'tarta':        return this._renderTabTarta(main);
            case 'projectes':    return this._renderTabProjectes(main);
            case 'topup':        return this._renderTabTopup(main);
            default:             main.innerHTML = '';
        }
    }

    // v128 · scaffold · contingut real ve a v129 (Saldo + Transaccions + Projectes)
    // i v130 (Top-up Stripe + Crypto) + v131 (Tarta embed). Ara · placeholders
    // accionables que descriuen què vindrà · permet a l'usuari validar el flow.

    // v129 · Saldo tab amb dades reals · KPIs + hero + quick actions
    async _renderTabSaldo(main) {
        main.innerHTML = `<div class="w2-loading">⏳ Carregant saldo…</div>`;
        try {
            const walletId = this._projectId || personalWalletIdFor(this._ownerHandle());
            const wallet = await getOrCreateWalletForProject(walletId);
            this._wallet = wallet;
            const stats = walletStats(wallet);

            // Calcula runway · saldo / despesa mensual mitja (últim mes)
            const last30dExpense = this._sumLast30d(wallet, 'consume');
            const last30dIncome  = this._sumLast30d(wallet, 'topup') + this._sumLast30d(wallet, 'refund');
            const runwayMonths   = (last30dExpense > 0.001) ? (stats.balance / last30dExpense) : Infinity;
            const runwayLabel    = !isFinite(runwayMonths) ? '∞' : runwayMonths.toFixed(1) + 'm';
            const runwayColor    = !isFinite(runwayMonths) ? '#22c55e' : runwayMonths >= 6 ? '#22c55e' : runwayMonths >= 2 ? '#fbbf24' : '#ef4444';

            const balanceColor = stats.balance >= 10 ? '#22c55e' : stats.balance >= 1 ? '#fbbf24' : '#ef4444';
            const projName = this._project?.nombre || this._project?.name || (this._projectId ? this._projectId : 'wallet personal');

            main.innerHTML = `
                <section class="w2-panel" style="background: linear-gradient(145deg, rgba(34,197,94,0.08), rgba(0,0,0,0)); border-left: 3px solid ${balanceColor};">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
                        <div>
                            <div style="color:var(--text-muted);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Saldo · ${this._esc(projName)}</div>
                            <div style="font-size:2.6rem;font-weight:700;color:${balanceColor};font-family:var(--font-mono);line-height:1.1;margin-top:4px;">${stats.balance.toFixed(2)} €</div>
                            <div style="color:var(--text-muted);font-size:0.8rem;margin-top:6px;">${stats.movementCount} moviment${stats.movementCount === 1 ? '' : 's'} totals · ${this._esc(walletId)}</div>
                        </div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;">
                            <button class="w2-cta-primary" data-w2-tab="topup">＋ Recarregar</button>
                            <button class="w2-cta" data-w2-tab="transaccions">📊 Veure transaccions</button>
                        </div>
                    </div>
                </section>

                <section class="w2-kpi-grid">
                    <div class="w2-kpi" style="--w2-c:#22c55e;">
                        <div class="w2-kpi-label">↑ Ingressos últims 30d</div>
                        <div class="w2-kpi-value">+${last30dIncome.toFixed(2)} €</div>
                        <div class="w2-kpi-sub">topups + refunds</div>
                    </div>
                    <div class="w2-kpi" style="--w2-c:#ef4444;">
                        <div class="w2-kpi-label">↓ Despesa últims 30d</div>
                        <div class="w2-kpi-value">-${last30dExpense.toFixed(2)} €</div>
                        <div class="w2-kpi-sub">consumed</div>
                    </div>
                    <div class="w2-kpi" style="--w2-c:${runwayColor};">
                        <div class="w2-kpi-label">⏳ Runway</div>
                        <div class="w2-kpi-value">${runwayLabel}</div>
                        <div class="w2-kpi-sub">al ritme dels últims 30d</div>
                    </div>
                    <div class="w2-kpi" style="--w2-c:#a5b4fc;">
                        <div class="w2-kpi-label">Σ Total recarregat</div>
                        <div class="w2-kpi-value">${stats.totalTopups.toFixed(2)} €</div>
                        <div class="w2-kpi-sub">acumulat · històric</div>
                    </div>
                </section>

                <section class="w2-panel">
                    <h3 style="margin:0 0 10px 0;font-size:0.92rem;color:var(--accent-indigo);">📈 Activitat últims 30 dies</h3>
                    ${this._renderActivityChart(wallet)}
                </section>
            `;
            // Bind buttons that switch tabs
            main.querySelectorAll('[data-w2-tab]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const t = e.currentTarget.getAttribute('data-w2-tab');
                    if (VALID_TABS.includes(t)) { this._activeTab = t; this._updateUrl(); this._renderActiveTab(); }
                });
            });
        } catch (e) {
            main.innerHTML = `<div class="w2-panel"><p style="color:var(--accent-red);">Error · ${this._esc(e?.message || e)}</p></div>`;
        }
    }

    // v129 · helpers per a stats
    _ownerHandle() {
        try { return store.getState?.()?.session?.handle || '@alvaro'; } catch (_) { return '@alvaro'; }
    }

    _sumLast30d(wallet, kind) {
        if (!wallet?.content?.movements) return 0;
        const cutoff = Date.now() - 30 * 86400_000;
        let sum = 0;
        for (const mv of wallet.content.movements) {
            if (mv.kind !== kind) continue;
            if ((mv.ts || 0) < cutoff) continue;
            sum += Math.abs(mv.amountEur || 0);
        }
        return sum;
    }

    _renderActivityChart(wallet) {
        // Mini sparkline-bars · 30 dies · ingressos verds · despeses vermelles
        const days = 30;
        const buckets = new Array(days).fill(null).map(() => ({ in: 0, out: 0 }));
        const cutoff = Date.now() - days * 86400_000;
        for (const mv of (wallet?.content?.movements || [])) {
            if ((mv.ts || 0) < cutoff) continue;
            const dayOffset = Math.floor((Date.now() - mv.ts) / 86400_000);
            if (dayOffset < 0 || dayOffset >= days) continue;
            const idx = days - 1 - dayOffset;
            if (mv.kind === 'topup' || mv.kind === 'refund') buckets[idx].in += Math.abs(mv.amountEur || 0);
            else if (mv.kind === 'consume') buckets[idx].out += Math.abs(mv.amountEur || 0);
        }
        const maxAmt = Math.max(0.01, ...buckets.flatMap(b => [b.in, b.out]));
        const bars = buckets.map((b, i) => {
            const inH  = Math.round((b.in  / maxAmt) * 100);
            const outH = Math.round((b.out / maxAmt) * 100);
            const dayLabel = new Date(Date.now() - (days - 1 - i) * 86400_000).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit' });
            return `<div class="w2-bar-col" title="${dayLabel} · +${b.in.toFixed(2)}€ · -${b.out.toFixed(2)}€">
                <div class="w2-bar-in"  style="height:${inH}%;"></div>
                <div class="w2-bar-out" style="height:${outH}%;"></div>
            </div>`;
        }).join('');
        const hasData = buckets.some(b => b.in > 0 || b.out > 0);
        if (!hasData) return `<div style="color:var(--text-muted);font-size:0.85rem;padding:10px 0;">Sense moviments els últims 30 dies. Recarrega per veure la teva activitat aquí.</div>`;
        return `
            <div class="w2-bars-chart">${bars}</div>
            <div style="display:flex;gap:14px;margin-top:8px;font-size:0.75rem;color:var(--text-muted);">
                <span><span style="display:inline-block;width:10px;height:10px;background:#22c55e;border-radius:2px;vertical-align:middle;"></span> Ingressos</span>
                <span><span style="display:inline-block;width:10px;height:10px;background:#ef4444;border-radius:2px;vertical-align:middle;"></span> Despeses</span>
            </div>`;
    }

    // v129 · Transaccions amb filtres + taula + paginació + CSV export
    async _renderTabTransaccions(main) {
        main.innerHTML = `<div class="w2-loading">⏳ Carregant transaccions…</div>`;
        try {
            if (!this._aggregation) await this._loadAggregation();
            const agg = this._aggregation;
            const filtered = this._applyTxFilters(agg.movements);
            const projects = (store.getState()?.projects || []);

            const projectOpts = ['<option value="all">Tots</option>',
                '<option value="__personal__">Personal</option>',
                ...projects.map(p => `<option value="${this._esc(p.id)}">${this._esc(p.nombre || p.name || p.id)}</option>`)].join('');

            const kindOpts = ['all', 'topup', 'consume', 'refund', 'adjustment', 'transfer-in', 'transfer-out']
                .map(k => `<option value="${k}" ${this._txFilters.kind === k ? 'selected' : ''}>${k === 'all' ? 'Tots els tipus' : k}</option>`).join('');

            const periodOpts = [
                ['7d', '7 dies'], ['30d', '30 dies'], ['90d', '90 dies'], ['365d', '1 any'], ['all', 'Tot'],
            ].map(([v, l]) => `<option value="${v}" ${this._txFilters.period === v ? 'selected' : ''}>${l}</option>`).join('');

            // Paginació
            const totalPages = Math.max(1, Math.ceil(filtered.length / this._txPageSize));
            this._txPage = Math.min(this._txPage, totalPages);
            const pageStart = (this._txPage - 1) * this._txPageSize;
            const pageItems = filtered.slice(pageStart, pageStart + this._txPageSize);

            // Sumaris filtered
            let sumIn = 0, sumOut = 0;
            for (const m of filtered) {
                if (m.amountEur > 0) sumIn += m.amountEur;
                else sumOut += Math.abs(m.amountEur);
            }
            const net = sumIn - sumOut;

            main.innerHTML = `
                <section class="w2-panel">
                    <div class="w2-tx-filters">
                        <label><span>Tipus</span><select id="w2TxKind">${kindOpts}</select></label>
                        <label><span>Projecte</span><select id="w2TxProject">${projectOpts.replace('value="all"', `value="all" ${this._txFilters.projectId === 'all' ? 'selected' : ''}`).replace('value="__personal__"', `value="__personal__" ${this._txFilters.projectId === '__personal__' ? 'selected' : ''}`)}</select></label>
                        <label><span>Període</span><select id="w2TxPeriod">${periodOpts}</select></label>
                        <label style="flex:1;min-width:160px;"><span>Cercar</span><input id="w2TxSearch" type="search" placeholder="descripció / ref" value="${this._esc(this._txFilters.search)}"></label>
                        <button class="w2-cta" id="w2TxExport">📥 CSV</button>
                        <button class="w2-cta" id="w2TxReset">↺ Reset</button>
                    </div>

                    <div class="w2-tx-summary">
                        <span><strong>${filtered.length}</strong> moviments · <span style="color:#22c55e;">+${sumIn.toFixed(2)}€</span> · <span style="color:#ef4444;">-${sumOut.toFixed(2)}€</span> · <strong>net ${net >= 0 ? '+' : ''}${net.toFixed(2)}€</strong></span>
                        ${totalPages > 1 ? `<span>pàgina ${this._txPage}/${totalPages}</span>` : ''}
                    </div>

                    <div class="w2-tx-table-wrap">
                        ${this._renderTxTable(pageItems, projects)}
                    </div>

                    ${totalPages > 1 ? `
                    <div class="w2-tx-pager">
                        <button class="w2-cta" id="w2TxPrev" ${this._txPage <= 1 ? 'disabled' : ''}>← Anterior</button>
                        <span>${this._txPage} / ${totalPages}</span>
                        <button class="w2-cta" id="w2TxNext" ${this._txPage >= totalPages ? 'disabled' : ''}>Següent →</button>
                    </div>` : ''}
                </section>
            `;
            this._bindTxControls(main);
        } catch (e) {
            main.innerHTML = `<div class="w2-panel"><p style="color:var(--accent-red);">Error · ${this._esc(e?.message || e)}</p></div>`;
        }
    }

    async _loadAggregation() {
        const { walletNodes, receiptNodes, aiAuditNodes, workshopUnlockNodes } = await loadAllAccountingNodes({ kb: KB });
        const projects = (store.getState().projects || []);
        const myProjectIds = projects.map(p => p.id).filter(Boolean);
        if (this._projectId && !myProjectIds.includes(this._projectId)) myProjectIds.push(this._projectId);
        this._aggregation = aggregateMovementsForOwner({
            walletNodes, receiptNodes, aiAuditNodes, workshopUnlockNodes,
            ownerHandle: this._ownerHandle(),
            ownerProjectIds: myProjectIds,
        });
    }

    _applyTxFilters(movements) {
        const f = this._txFilters;
        const periodCutoff = (f.period === 'all') ? 0 : Date.now() - (parseInt(f.period, 10) * 86400_000);
        const searchLc = (f.search || '').toLowerCase().trim();
        return movements.filter(m => {
            if ((m.ts || 0) < periodCutoff) return false;
            if (f.kind !== 'all' && m.kind !== f.kind) return false;
            if (f.projectId !== 'all') {
                if (f.projectId === '__personal__') {
                    if (!String(m.projectId || '').startsWith('__personal_')) return false;
                } else if (m.projectId !== f.projectId) return false;
            }
            if (searchLc) {
                const hay = ((m.note || '') + ' ' + (m.ref || '') + ' ' + (m.source || '') + ' ' + (m.category || '')).toLowerCase();
                if (!hay.includes(searchLc)) return false;
            }
            return true;
        });
    }

    _renderTxTable(items, projects) {
        if (!items.length) return `<div style="padding:18px;text-align:center;color:var(--text-muted);">Cap moviment amb aquests filtres.</div>`;
        const projMap = new Map(projects.map(p => [p.id, p.nombre || p.name || p.id]));
        const rows = items.map(m => {
            const date = new Date(m.ts || 0).toLocaleString('ca-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
            const projName = m.projectId
                ? (String(m.projectId).startsWith('__personal_') ? '👤 Personal' : (projMap.get(m.projectId) || m.projectId.slice(0, 12)))
                : '—';
            const amt = m.amountEur;
            const amtColor = amt > 0 ? '#22c55e' : amt < 0 ? '#ef4444' : 'var(--text-muted)';
            const sign = amt > 0 ? '+' : '';
            return `<tr>
                <td><span class="w2-tx-date">${this._esc(date)}</span></td>
                <td><span class="w2-tx-kind w2-kind-${this._esc(m.kind)}">${this._esc(m.kind)}</span></td>
                <td><span class="w2-tx-cat">${this._esc(m.category || '—')}</span></td>
                <td><span class="w2-tx-proj">${this._esc(projName)}</span></td>
                <td class="w2-tx-desc">${this._esc((m.note || m.ref || m.source || '').slice(0, 80))}</td>
                <td class="w2-tx-amount" style="color:${amtColor};">${sign}${amt.toFixed(4)} €</td>
            </tr>`;
        }).join('');
        return `<table class="w2-tx-table">
            <thead><tr>
                <th>Data</th><th>Tipus</th><th>Categoria</th><th>Projecte</th><th>Descripció</th><th style="text-align:right;">Import</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
    }

    _bindTxControls(main) {
        const onChange = () => { this._txPage = 1; this._renderActiveTab(); };
        main.querySelector('#w2TxKind')?.addEventListener('change', (e) => { this._txFilters.kind = e.target.value; onChange(); });
        main.querySelector('#w2TxProject')?.addEventListener('change', (e) => { this._txFilters.projectId = e.target.value; onChange(); });
        main.querySelector('#w2TxPeriod')?.addEventListener('change', (e) => { this._txFilters.period = e.target.value; onChange(); });
        let searchTimer = null;
        main.querySelector('#w2TxSearch')?.addEventListener('input', (e) => {
            clearTimeout(searchTimer);
            const v = e.target.value;
            searchTimer = setTimeout(() => { this._txFilters.search = v; onChange(); }, 250);
        });
        main.querySelector('#w2TxReset')?.addEventListener('click', () => {
            this._txFilters = { kind: 'all', projectId: 'all', period: '30d', search: '' };
            this._txPage = 1;
            this._renderActiveTab();
        });
        main.querySelector('#w2TxExport')?.addEventListener('click', () => this._exportTxCSV());
        main.querySelector('#w2TxPrev')?.addEventListener('click', () => { if (this._txPage > 1) { this._txPage--; this._renderActiveTab(); } });
        main.querySelector('#w2TxNext')?.addEventListener('click', () => { this._txPage++; this._renderActiveTab(); });
    }

    _exportTxCSV() {
        if (!this._aggregation) return;
        const filtered = this._applyTxFilters(this._aggregation.movements);
        const header = ['date', 'kind', 'category', 'projectId', 'amountEur', 'note', 'ref', 'source'];
        const rows = filtered.map(m => [
            new Date(m.ts || 0).toISOString(),
            m.kind || '',
            m.category || '',
            m.projectId || '',
            (m.amountEur || 0).toFixed(4),
            (m.note || '').replace(/"/g, '""'),
            (m.ref || '').replace(/"/g, '""'),
            (m.source || ''),
        ].map(v => `"${v}"`).join(','));
        const csv = [header.join(','), ...rows].join('\n');
        if (typeof document !== 'undefined' && typeof URL !== 'undefined') {
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transaccions-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    _renderTabCompres(main) {
        main.innerHTML = `
            <div class="w2-panel">
                <div class="w2-placeholder">
                    <div style="font-size: 2.4rem;">🛒</div>
                    <h2>Pestanya Compres · sprint v131</h2>
                    <p>Sub-vista de transaccions filtrada a topups. Stripe · session id + factura PDF. Crypto · txHash + blockchain explorer link. Total YTD + stats per provider.</p>
                </div>
            </div>`;
    }

    _renderTabTarta(main) {
        if (!this._projectId) {
            main.innerHTML = `
                <div class="w2-panel">
                    <div class="w2-placeholder">
                        <div style="font-size: 2.4rem;">🥧</div>
                        <h2>La Tarta requereix un projecte actiu</h2>
                        <p>Selecciona un projecte des de la pestanya <strong>Projectes</strong> · la Tarta mostra el slicing pie del projecte triat.</p>
                    </div>
                </div>`;
            return;
        }
        main.innerHTML = `
            <div class="w2-panel">
                <div class="w2-placeholder">
                    <div style="font-size: 2.4rem;">🥧</div>
                    <h2>Pestanya Tarta · sprint v131</h2>
                    <p>Embed inline de <code>/value-accounting?project=${this._esc(this._projectId)}</code> · header contextual · link a vista completa.</p>
                    <p><a href="/value-accounting?project=${encodeURIComponent(this._projectId)}" data-link style="color: var(--accent-purple);">🥧 Obrir vista completa →</a></p>
                </div>
            </div>`;
    }

    // v129 · Projectes · grid multi-wallet · saldo + runway per cada projecte
    async _renderTabProjectes(main) {
        main.innerHTML = `<div class="w2-loading">⏳ Carregant wallets…</div>`;
        try {
            const projects = (store.getState()?.projects || []).filter(p => !p.isArchived);
            const handle = this._ownerHandle();
            const targets = [
                { id: personalWalletIdFor(handle), label: '👤 Personal', isPersonal: true },
                ...projects.map(p => ({ id: p.id, label: '🏢 ' + (p.nombre || p.name || p.id), isPersonal: false, project: p })),
            ];

            const walletData = await Promise.all(targets.map(async (t) => {
                try {
                    const w = await getOrCreateWalletForProject(t.id);
                    const stats = walletStats(w);
                    const expense30 = this._sumLast30d(w, 'consume');
                    const runway = (expense30 > 0.001) ? (stats.balance / expense30) : Infinity;
                    return { ...t, stats, expense30, runway, wallet: w };
                } catch (e) { return { ...t, stats: null, error: e?.message }; }
            }));

            // Total agregat
            const totalBalance = walletData.reduce((s, w) => s + (w.stats?.balance || 0), 0);
            const totalMovements = walletData.reduce((s, w) => s + (w.stats?.movementCount || 0), 0);

            const cards = walletData.map(w => {
                if (!w.stats) return `<div class="w2-proj-card w2-proj-error"><strong>${this._esc(w.label)}</strong><div>Error · ${this._esc(w.error || 'unknown')}</div></div>`;
                const balanceColor = w.stats.balance >= 10 ? '#22c55e' : w.stats.balance >= 1 ? '#fbbf24' : '#ef4444';
                const runwayLabel = !isFinite(w.runway) ? '∞' : w.runway.toFixed(1) + 'm';
                const runwayBadge = !isFinite(w.runway)
                    ? `<span class="w2-proj-runway w2-runway-good">runway ∞</span>`
                    : w.runway >= 6
                        ? `<span class="w2-proj-runway w2-runway-good">runway ${runwayLabel}</span>`
                        : w.runway >= 2
                            ? `<span class="w2-proj-runway w2-runway-warn">⚠ runway ${runwayLabel}</span>`
                            : `<span class="w2-proj-runway w2-runway-bad">🚨 saldo baix · ${runwayLabel}</span>`;
                const isCurrent = (this._projectId === w.id) || (!this._projectId && w.isPersonal);
                return `
                    <div class="w2-proj-card ${isCurrent ? 'w2-proj-current' : ''}">
                        <div class="w2-proj-head">
                            <strong>${this._esc(w.label)}</strong>
                            ${isCurrent ? '<span class="w2-proj-curr-badge">actiu</span>' : ''}
                        </div>
                        <div class="w2-proj-balance" style="color:${balanceColor};">${w.stats.balance.toFixed(2)} €</div>
                        <div class="w2-proj-stats">
                            <span>${w.stats.movementCount} mov</span>
                            <span>−${w.expense30.toFixed(2)}€/30d</span>
                        </div>
                        ${runwayBadge}
                        <div class="w2-proj-actions">
                            ${w.isPersonal
                                ? `<a href="/wallet/v2" data-link class="w2-cta-small">Obrir →</a>`
                                : `<a href="/wallet/v2?project=${encodeURIComponent(w.id)}" data-link class="w2-cta-small">Obrir →</a>`}
                            ${w.isPersonal ? '' : `<a href="/project/${encodeURIComponent(w.id)}" data-link class="w2-cta-small">Panel</a>`}
                        </div>
                    </div>`;
            }).join('');

            main.innerHTML = `
                <section class="w2-panel">
                    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
                        <div>
                            <h3 style="margin:0;font-size:1.0rem;">📁 Els meus wallets · ${walletData.length}</h3>
                            <div style="color:var(--text-muted);font-size:0.78rem;margin-top:4px;">Personal + ${projects.length} projectes actius</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;">Total agregat</div>
                            <div style="font-size:1.6rem;font-weight:700;color:#22c55e;font-family:var(--font-mono);">${totalBalance.toFixed(2)} €</div>
                            <div style="color:var(--text-muted);font-size:0.72rem;">${totalMovements} moviments globals</div>
                        </div>
                    </div>
                    <div class="w2-proj-grid">${cards}</div>
                </section>
            `;
        } catch (e) {
            main.innerHTML = `<div class="w2-panel"><p style="color:var(--accent-red);">Error · ${this._esc(e?.message || e)}</p></div>`;
        }
    }

    _renderTabTopup(main) {
        main.innerHTML = `
            <div class="w2-panel">
                <div class="w2-placeholder">
                    <div style="font-size: 2.4rem;">⚙</div>
                    <h2>Pestanya Top-up · sprint v130</h2>
                    <p>3 sub-pestanyes · <strong>💳 Stripe</strong> (presets + custom amount via <code>createCheckoutSession</code>) · <strong>₿ Crypto stables</strong> (USDC · USDT · DAI · xDAI · deposit intent + QR + watch) · <strong>🪙 Crypto convertible</strong> (ETH · WBTC · MATIC amb quote i gas warning).</p>
                    <p>Backend ja disponible · <code>stripeService</code> + <code>cryptoTopupService</code> de v125.</p>
                </div>
            </div>`;
    }

    _esc(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    }

    destroy() {}
}
