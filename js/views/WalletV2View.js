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
    }

    async getHtml() {
        await store.init();
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        this._projectId = params.get('project') || null;
        const tab = params.get('tab');
        if (tab && VALID_TABS.includes(tab)) this._activeTab = tab;
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
            @media (max-width: 720px) {
                .w2-main { padding: 1rem 0.8rem; }
                .w2-tab-label { display: none; }
                .w2-tab { padding: 6px 9px; }
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

    _renderTabSaldo(main) {
        main.innerHTML = `
            <div class="w2-panel">
                <div class="w2-placeholder">
                    <div style="font-size: 2.4rem;">💰</div>
                    <h2>Pestanya Saldo · sprint v129</h2>
                    <p>Hero amb balance gran · 4 KPIs (saldo · ingressos mes · despesa mes · runway) · graf barres últims 30 dies · quick actions a Top-up.</p>
                    <p>Backend ja disponible · <code>walletService.walletStats()</code>. Implementació · sprint v129.</p>
                </div>
            </div>`;
    }

    _renderTabTransaccions(main) {
        main.innerHTML = `
            <div class="w2-panel">
                <div class="w2-placeholder">
                    <div style="font-size: 2.4rem;">📊</div>
                    <h2>Pestanya Transaccions · sprint v129</h2>
                    <p>Filtres · tipus · projecte · període · estat · cercar text · exportar CSV. Taula paginada · 50 per pàgina · click row → detall modal.</p>
                    <p>Backend ja disponible · <code>unifiedAccountingService.aggregateMovementsForOwner()</code>.</p>
                </div>
            </div>`;
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

    _renderTabProjectes(main) {
        main.innerHTML = `
            <div class="w2-panel">
                <div class="w2-placeholder">
                    <div style="font-size: 2.4rem;">📁</div>
                    <h2>Pestanya Projectes · sprint v129</h2>
                    <p>Grid de cards multi-wallet · saldo + moviments + runway per cada wallet propi (personal + tots els projectes). Click card → entrar al wallet del projecte.</p>
                    <p>Backend ja disponible · <code>walletService.getOrCreateWalletForProject()</code> per cada projecte de l'usuari.</p>
                </div>
            </div>`;
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
