// =============================================================================
// TEAMTOWERS SOS V11 — v144 · ACCOUNTING V2 · redisseny UX alineat WalletV2
// Ruta · /js/views/AccountingV2View.js  →  /accounting/v2[?project=X]
//
// Tanca · wo-accounting-v2-redesign · "AccountingView v2 amb mateixa
// qualitat que WalletV2 (per al pilar Comptabilitzar del Project Hub)".
//
// 5 tabs canonical · mateix pattern que WalletV2View (v143) ·
//   📊 Resum     · KPIs Actius / Passius / Equity / P&L mes + balanced indicator
//   📋 Entrades  · llista compacta amb filtres (cerca · categoria · període)
//   📈 P&L       · breakdown per compte · ingressos vs despeses + diferència
//   🥧 Categories · agrupació entrades per kind (compres · vendes · operatives)
//   📄 Export    · CSV download · període configurable
//
// Backend · reutilitza ledgerService.js (computeBalanceSheet · computePLForPeriod ·
// computeBalanceByAccount · STANDARD_ACCOUNTS) · ZERO nova lògica core.
// =============================================================================

import { store } from '../core/store.js';
import { KB } from '../core/kb.js';
import { renderViewTopbar, ensureTopbarStyle, projectContextLinks } from '../core/sosTopbar.js';
import {
    LEDGER_ENTRY_TYPE, STANDARD_ACCOUNTS,
    computeBalanceSheet, computePLForPeriod, computeBalanceByAccount,
    accountKindFor,
} from '../core/ledgerService.js';
import { renderSubmenuTabs, bindSubmenuTabs } from '../ui/SubmenuTabs.js';

const VALID_TABS = Object.freeze(['resum', 'entrades', 'pl', 'categories', 'export']);

const TAB_META = Object.freeze({
    resum:      { icon: '📊', label: 'Resum',      desc: 'KPIs Actius · Passius · Equity · P&L mes' },
    entrades:   { icon: '📋', label: 'Entrades',   desc: 'Llista entrades amb filtres' },
    pl:         { icon: '📈', label: 'P&L',        desc: 'Ingressos vs despeses · diferència' },
    categories: { icon: '🥧', label: 'Categories', desc: 'Agrupació per kind de compte' },
    export:     { icon: '📄', label: 'Export',     desc: 'Download CSV · període configurable' },
});

const PERIOD_PRESETS = Object.freeze({
    '30d':  { label: 'Últims 30 dies',   ms: 30 * 86400 * 1000 },
    '90d':  { label: 'Últims 90 dies',   ms: 90 * 86400 * 1000 },
    'ytd':  { label: 'Any actual (YTD)', ytd: true },
    'all':  { label: 'Tot',              all: true },
});

export default class AccountingV2View {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Comptes v2 · SOS';
        this._projectId = null;
        this._project = null;
        this._activeTab = 'resum';
        this._period = '30d';
        this._search = '';
        this._entries = [];
        this._cleanupTabs = null;
    }

    async getHtml() {
        await store.init();
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        this._projectId = params.get('project') || null;
        const tab = params.get('tab');
        if (tab && VALID_TABS.includes(tab)) this._activeTab = tab;
        const period = params.get('period');
        if (period && PERIOD_PRESETS[period]) this._period = period;
        if (this._projectId) {
            this._project = (store.getState().projects || []).find(p => p.id === this._projectId) || null;
        }
        // Lazy load entries (filtered per project si aplica)
        try {
            const all = await KB.query({ type: LEDGER_ENTRY_TYPE });
            this._entries = this._projectId
                ? (all || []).filter(e => e?.projectId === this._projectId || e?.content?.projectId === this._projectId)
                : (all || []);
        } catch (_) { this._entries = []; }
        return this._renderShell();
    }

    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    async afterRender() {
        ensureTopbarStyle();
        const mount = document.getElementById('accSubmenu');
        if (mount) {
            try { this._cleanupTabs?.(); } catch (_) {}
            this._cleanupTabs = bindSubmenuTabs(mount, (newTab) => {
                if (!VALID_TABS.includes(newTab) || newTab === this._activeTab) return;
                this._activeTab = newTab;
                this._updateUrl();
                this._renderActiveTab();
            }, { urlParam: 'tab' });
        }
        // Context switcher
        const ctxSel = document.getElementById('accContextSel');
        if (ctxSel) {
            ctxSel.addEventListener('change', (e) => {
                const val = e.target.value;
                this._projectId = val === '__personal__' ? null : val;
                this._project = this._projectId
                    ? (store.getState().projects || []).find(p => p.id === this._projectId) || null
                    : null;
                this.render();
            });
        }
        this._renderActiveTab();
    }

    destroy() { try { this._cleanupTabs?.(); } catch (_) {} }

    _updateUrl() {
        if (typeof window === 'undefined' || !window.history) return;
        const params = new URLSearchParams(window.location.search);
        params.set('tab', this._activeTab);
        if (this._projectId) params.set('project', this._projectId); else params.delete('project');
        window.history.replaceState({}, '', window.location.pathname + '?' + params.toString());
    }

    _renderShell() {
        const projName = this._project?.nombre || this._project?.name || this._projectId || 'Personal';
        const subtitle = this._projectId ? this._projectId : 'comptes personals';

        const submenuTabs = VALID_TABS.map(tabId => {
            const meta = TAB_META[tabId];
            return { id: tabId, label: meta.label, icon: meta.icon };
        });
        const submenuHtml = renderSubmenuTabs({ tabs: submenuTabs, activeId: this._activeTab, urlParam: 'tab' });

        const projects = (store.getState().projects || []);
        const ctxOptions = [
            `<option value="__personal__"${!this._projectId ? ' selected' : ''}>👤 Personal</option>`,
            ...projects.map(p => {
                const pid = p.id;
                const label = (p.nombre || p.name || pid).slice(0, 40);
                return `<option value="${this._esc(pid)}"${pid === this._projectId ? ' selected' : ''}>📁 ${this._esc(label)}</option>`;
            }),
        ].join('');

        const contextLinks = projectContextLinks({ projectId: this._projectId, current: 'accounting' });

        return `
        <style>
            .acc-shell { min-height: 100dvh; background: var(--bg-dark); color: var(--text-main); font-family: var(--font-base); display: flex; flex-direction: column; }
            .acc-ctx-bar { display: flex; align-items: center; gap: 10px; padding: 8px 16px; background: var(--bg-panel); border-bottom: 1px solid var(--border-default); flex-wrap: wrap; }
            /* v150 · fused bar · submenu + context switcher en 1 sola fila */
            .acc-bar-fused { display: flex; align-items: stretch; background: var(--bg-panel); border-bottom: 1px solid var(--border-default); }
            .acc-bar-fused-tabs { flex: 1; min-width: 0; overflow-x: auto; }
            .acc-bar-fused-tabs .sos-submenu { border-bottom: none; }
            .acc-bar-fused-ctx { display: flex; align-items: center; padding: 0 12px; border-left: 1px solid var(--border-default); flex-shrink: 0; }
            .acc-ctx-label { font-size: 0.78rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
            .acc-ctx-select { background: var(--bg-elevated); color: var(--text-main); border: 1px solid var(--border-default); padding: 5px 28px 5px 10px; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 600; font-family: inherit; cursor: pointer; min-width: 200px; }
            .acc-ctx-select:hover { border-color: var(--accent-indigo); }
            .acc-ctx-hint { font-size: 0.78rem; color: var(--text-muted); margin-left: auto; }
            .acc-main { flex: 1; padding: 1.2rem 1.5rem; max-width: 1200px; margin: 0 auto; width: 100%; box-sizing: border-box; }
            .acc-kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
            .acc-kpi { background: var(--bg-panel); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 14px; }
            .acc-kpi-label { color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; }
            .acc-kpi-value { font-size: 1.5rem; font-weight: 700; margin-top: 6px; font-family: var(--font-mono); }
            .acc-section { background: var(--bg-panel); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 14px 16px; margin-top: 14px; }
            .acc-section h3 { margin: 0 0 10px; font-size: 0.95rem; color: var(--text-main); }
            .acc-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
            .acc-table th, .acc-table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid var(--border-default); }
            .acc-table th { background: var(--bg-elevated); color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
            .acc-num { font-family: var(--font-mono); text-align: right; }
            .acc-num-pos { color: var(--accent-green); }
            .acc-num-neg { color: var(--accent-red); }
            .acc-pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; }
            .acc-pill-asset    { background: rgba(16, 185, 129, 0.12); color: var(--accent-green); }
            .acc-pill-liability{ background: rgba(239, 68, 68, 0.12);  color: var(--accent-red); }
            .acc-pill-equity   { background: rgba(168, 85, 247, 0.12); color: var(--accent-purple); }
            .acc-pill-revenue  { background: rgba(59, 130, 246, 0.12); color: var(--accent-blue); }
            .acc-pill-expense  { background: rgba(245, 158, 11, 0.12); color: var(--accent-orange); }
            .acc-filter-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
            .acc-input { background: var(--bg-elevated); color: var(--text-main); border: 1px solid var(--border-default); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 0.85rem; font-family: inherit; }
            .acc-btn { background: var(--accent-indigo); color: #fff; border: none; padding: 8px 14px; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: inherit; }
            .acc-btn:hover { opacity: 0.9; }
            .acc-empty { padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem; }
            .acc-bar { display: flex; align-items: stretch; height: 22px; border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-elevated); margin-bottom: 6px; }
            .acc-bar-fill { display: flex; align-items: center; padding: 0 8px; font-size: 0.72rem; color: #fff; font-weight: 700; white-space: nowrap; }
        </style>

        <div class="acc-shell">
            ${renderViewTopbar({
                icon: '📒', title: 'Comptes · ' + projName, subtitle,
                contextLinks: contextLinks.map(l => ({ ...l })),
            })}

            <!-- v150 · ctx-bar fusionada amb submenu · 1 sola fila enlloc de 2 -->
            <div class="acc-bar-fused">
                <div id="accSubmenu" class="acc-bar-fused-tabs">${submenuHtml}</div>
                <div class="acc-bar-fused-ctx">
                    <select id="accContextSel" class="acc-ctx-select" aria-label="Context comptes" title="Canviar context comptes">
                        ${ctxOptions}
                    </select>
                </div>
            </div>
            <main class="acc-main" id="accMain">
                <div class="acc-empty">⏳ Carregant…</div>
            </main>
        </div>`;
    }

    _renderActiveTab() {
        const main = document.getElementById('accMain');
        if (!main) return;
        try {
            if (this._activeTab === 'resum')      main.innerHTML = this._renderResum();
            else if (this._activeTab === 'entrades') main.innerHTML = this._renderEntrades();
            else if (this._activeTab === 'pl')       main.innerHTML = this._renderPL();
            else if (this._activeTab === 'categories') main.innerHTML = this._renderCategories();
            else if (this._activeTab === 'export')   main.innerHTML = this._renderExport();
            else main.innerHTML = '<div class="acc-empty">Tab desconeguda · ' + this._esc(this._activeTab) + '</div>';
            this._bindTabActions();
        } catch (e) {
            main.innerHTML = '<div class="acc-empty" style="color:var(--accent-red);">Error · ' + this._esc(e?.message || String(e)) + '</div>';
        }
    }

    _bindTabActions() {
        const periodSel = document.getElementById('accPeriodSel');
        if (periodSel) {
            periodSel.addEventListener('change', (e) => {
                if (PERIOD_PRESETS[e.target.value]) {
                    this._period = e.target.value;
                    this._renderActiveTab();
                }
            });
        }
        const searchIn = document.getElementById('accSearchIn');
        if (searchIn) {
            searchIn.addEventListener('input', (e) => {
                this._search = String(e.target.value || '').toLowerCase();
                this._renderActiveTab();
            });
        }
        const exportBtn = document.getElementById('accExportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this._downloadCsv());
        }
    }

    // ─── Tab · Resum ────────────────────────────────────────────────────
    _renderResum() {
        const sheet = computeBalanceSheet(this._entries);
        const period = this._periodRange();
        const pl = computePLForPeriod(this._entries, period);
        const eur = (n) => '€ ' + (Math.round(n * 100) / 100).toFixed(2);
        const cls = (n) => n >= 0 ? 'acc-num-pos' : 'acc-num-neg';
        return `
            <div class="acc-kpi-grid">
                <div class="acc-kpi">
                    <div class="acc-kpi-label">Actius totals</div>
                    <div class="acc-kpi-value">${eur(sheet.totalAssets)}</div>
                </div>
                <div class="acc-kpi">
                    <div class="acc-kpi-label">Passius totals</div>
                    <div class="acc-kpi-value">${eur(sheet.totalLiabilities)}</div>
                </div>
                <div class="acc-kpi">
                    <div class="acc-kpi-label">Equity (patrimoni)</div>
                    <div class="acc-kpi-value">${eur(sheet.totalEquity)}</div>
                </div>
                <div class="acc-kpi">
                    <div class="acc-kpi-label">P&L · ${PERIOD_PRESETS[this._period].label}</div>
                    <div class="acc-kpi-value ${cls(pl.profit)}">${pl.profit >= 0 ? '+' : ''}${eur(pl.profit)}</div>
                </div>
                <div class="acc-kpi">
                    <div class="acc-kpi-label">Equació comptable</div>
                    <div class="acc-kpi-value" style="font-size:1rem;color:${sheet.balanced ? 'var(--accent-green)' : 'var(--accent-red)'};">${sheet.balanced ? '✓ Equilibrada' : '⚠ Desbalanç'}</div>
                </div>
                <div class="acc-kpi">
                    <div class="acc-kpi-label">Entrades totals</div>
                    <div class="acc-kpi-value">${this._entries.length}</div>
                </div>
            </div>

            <div class="acc-section">
                <h3>Resum balanç comptable</h3>
                <table class="acc-table">
                    <thead><tr><th>Categoria</th><th>Comptes</th><th class="acc-num">Total</th></tr></thead>
                    <tbody>
                        <tr><td><span class="acc-pill acc-pill-asset">Actius</span></td><td>${sheet.assets.length}</td><td class="acc-num">${eur(sheet.totalAssets)}</td></tr>
                        <tr><td><span class="acc-pill acc-pill-liability">Passius</span></td><td>${sheet.liabilities.length}</td><td class="acc-num">${eur(sheet.totalLiabilities)}</td></tr>
                        <tr><td><span class="acc-pill acc-pill-equity">Equity</span></td><td>${sheet.equity.length}</td><td class="acc-num">${eur(sheet.totalEquity)}</td></tr>
                    </tbody>
                </table>
            </div>`;
    }

    // ─── Tab · Entrades ─────────────────────────────────────────────────
    _renderEntrades() {
        const filtered = this._filteredEntries();
        const sorted = [...filtered].sort((a, b) => (b.ts || 0) - (a.ts || 0));
        const eur = (n) => '€ ' + (Math.round((n || 0) * 100) / 100).toFixed(2);
        const rows = sorted.slice(0, 100).map(e => {
            const c = e.content || e;
            const date = c.date || (c.ts ? new Date(c.ts).toISOString().slice(0, 10) : '—');
            const desc = c.description || '—';
            const total = (c.legs || []).reduce((s, l) => s + Math.abs(l.amount || 0), 0) / 2;
            return `<tr>
                <td style="font-family:var(--font-mono);font-size:0.78rem;">${this._esc(date)}</td>
                <td>${this._esc(desc)}</td>
                <td>${(c.legs || []).length}</td>
                <td class="acc-num">${eur(total)}</td>
            </tr>`;
        }).join('');
        return `
            ${this._filterRow()}
            <div class="acc-section">
                <h3>Entrades · ${sorted.length} resultats${sorted.length > 100 ? ' (mostrant primeres 100)' : ''}</h3>
                ${sorted.length === 0
                    ? '<div class="acc-empty">Cap entrada per als filtres actuals.</div>'
                    : `<table class="acc-table">
                        <thead><tr><th>Data</th><th>Descripció</th><th>Legs</th><th class="acc-num">Total</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>`}
            </div>`;
    }

    // ─── Tab · P&L ──────────────────────────────────────────────────────
    _renderPL() {
        const period = this._periodRange();
        const pl = computePLForPeriod(this._entries, period);
        const eur = (n) => '€ ' + (Math.round(n * 100) / 100).toFixed(2);
        const maxRev = Math.max(...pl.revenueByAccount.map(r => r.total || 0), 1);
        const maxExp = Math.max(...pl.expenseByAccount.map(r => r.total || 0), 1);
        return `
            ${this._filterRow({ search: false })}
            <div class="acc-kpi-grid">
                <div class="acc-kpi">
                    <div class="acc-kpi-label">Ingressos · ${PERIOD_PRESETS[this._period].label}</div>
                    <div class="acc-kpi-value acc-num-pos">${eur(pl.totalRevenue)}</div>
                </div>
                <div class="acc-kpi">
                    <div class="acc-kpi-label">Despeses</div>
                    <div class="acc-kpi-value acc-num-neg">${eur(pl.totalExpense)}</div>
                </div>
                <div class="acc-kpi">
                    <div class="acc-kpi-label">Resultat (P&L)</div>
                    <div class="acc-kpi-value ${pl.profit >= 0 ? 'acc-num-pos' : 'acc-num-neg'}">${pl.profit >= 0 ? '+' : ''}${eur(pl.profit)}</div>
                </div>
            </div>
            <div class="acc-section">
                <h3><span class="acc-pill acc-pill-revenue">Ingressos</span> per compte</h3>
                ${pl.revenueByAccount.length === 0 ? '<div class="acc-empty">Cap ingrés al període.</div>' : pl.revenueByAccount.map(r => `
                    <div style="margin-bottom:8px;">
                        <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:2px;">
                            <span>${this._esc(r.label || r.accountId)}</span>
                            <span class="acc-num acc-num-pos">${eur(r.total)}</span>
                        </div>
                        <div class="acc-bar"><div class="acc-bar-fill" style="width:${(r.total / maxRev * 100).toFixed(0)}%;background:var(--accent-blue);"></div></div>
                    </div>`).join('')}
            </div>
            <div class="acc-section">
                <h3><span class="acc-pill acc-pill-expense">Despeses</span> per compte</h3>
                ${pl.expenseByAccount.length === 0 ? '<div class="acc-empty">Cap despesa al període.</div>' : pl.expenseByAccount.map(r => `
                    <div style="margin-bottom:8px;">
                        <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:2px;">
                            <span>${this._esc(r.label || r.accountId)}</span>
                            <span class="acc-num acc-num-neg">${eur(r.total)}</span>
                        </div>
                        <div class="acc-bar"><div class="acc-bar-fill" style="width:${(r.total / maxExp * 100).toFixed(0)}%;background:var(--accent-orange);"></div></div>
                    </div>`).join('')}
            </div>`;
    }

    // ─── Tab · Categories ────────────────────────────────────────────────
    _renderCategories() {
        const balances = computeBalanceByAccount(this._entries);
        const byKind = { asset: [], liability: [], equity: [], revenue: [], expense: [] };
        for (const b of balances.values()) {
            const kind = b.kind || accountKindFor(b.accountId) || 'unknown';
            if (byKind[kind]) byKind[kind].push(b);
        }
        const eur = (n) => '€ ' + (Math.round(Math.abs(n) * 100) / 100).toFixed(2);
        const block = (kindKey, label, pill) => {
            const arr = byKind[kindKey] || [];
            if (arr.length === 0) return '';
            const total = arr.reduce((s, b) => s + Math.abs(b.balance), 0);
            return `<div class="acc-section">
                <h3><span class="acc-pill acc-pill-${pill}">${this._esc(label)}</span> · ${arr.length} compte${arr.length === 1 ? '' : 's'} · total ${eur(total)}</h3>
                <table class="acc-table">
                    <thead><tr><th>Compte</th><th class="acc-num">Saldo</th></tr></thead>
                    <tbody>${arr.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).map(b => `
                        <tr><td>${this._esc(b.label || b.accountId)}</td><td class="acc-num">${eur(b.balance)}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
        };
        const html = [
            block('asset',     'Actius',     'asset'),
            block('liability', 'Passius',    'liability'),
            block('equity',    'Equity',     'equity'),
            block('revenue',   'Ingressos',  'revenue'),
            block('expense',   'Despeses',   'expense'),
        ].join('');
        return html || '<div class="acc-empty">Cap moviment encara.</div>';
    }

    // ─── Tab · Export ────────────────────────────────────────────────────
    _renderExport() {
        const filtered = this._filteredEntries();
        return `
            ${this._filterRow({ search: false })}
            <div class="acc-section">
                <h3>Export CSV</h3>
                <p style="color:var(--text-muted);font-size:0.85rem;margin:0 0 12px;">${filtered.length} entrades seran exportades amb els filtres actuals.</p>
                <button id="accExportBtn" class="acc-btn">📥 Descarrega CSV (${filtered.length} entrades)</button>
                <p style="color:var(--text-muted);font-size:0.78rem;margin:14px 0 0;">Format · date · description · accountId · side · amount · currency · proofs · audit_score</p>
            </div>`;
    }

    // ─── Helpers ────────────────────────────────────────────────────────
    _filterRow({ search = true } = {}) {
        const periodOpts = Object.entries(PERIOD_PRESETS).map(([k, v]) =>
            `<option value="${k}"${k === this._period ? ' selected' : ''}>${this._esc(v.label)}</option>`).join('');
        return `<div class="acc-filter-row">
            <select id="accPeriodSel" class="acc-input">${periodOpts}</select>
            ${search ? `<input id="accSearchIn" class="acc-input" type="search" placeholder="Cerca descripció…" value="${this._esc(this._search)}" style="flex:1;min-width:200px;">` : ''}
        </div>`;
    }

    _periodRange() {
        const preset = PERIOD_PRESETS[this._period];
        if (preset.all) return {};
        if (preset.ytd) {
            const ytdFrom = new Date(new Date().getFullYear(), 0, 1).getTime();
            return { from: ytdFrom };
        }
        return { from: Date.now() - preset.ms };
    }

    _filteredEntries() {
        const range = this._periodRange();
        const q = (this._search || '').toLowerCase();
        return this._entries.filter(e => {
            const c = e.content || e;
            const ts = c.ts || (c.date ? new Date(c.date).getTime() : 0);
            if (range.from && ts < range.from) return false;
            if (range.to && ts > range.to) return false;
            if (q) {
                const desc = (c.description || '').toLowerCase();
                if (!desc.includes(q)) return false;
            }
            return true;
        });
    }

    _downloadCsv() {
        const filtered = this._filteredEntries();
        const rows = [['date', 'description', 'accountId', 'side', 'amount', 'currency', 'proofs', 'audit_score']];
        for (const e of filtered) {
            const c = e.content || e;
            const date = c.date || (c.ts ? new Date(c.ts).toISOString().slice(0, 10) : '');
            for (const leg of (c.legs || [])) {
                rows.push([
                    date,
                    (c.description || '').replace(/"/g, '""'),
                    leg.account || leg.accountId || '',
                    leg.side || '',
                    leg.amount || 0,
                    leg.currency || c.currency || 'EUR',
                    (c.proofs || []).length,
                    c.audit_score || '',
                ]);
            }
        }
        const csv = rows.map(r => r.map(v => {
            const s = String(v == null ? '' : v);
            return s.includes(',') || s.includes('"') ? '"' + s + '"' : s;
        }).join(',')).join('\n');
        if (typeof document === 'undefined') return;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'accounting-' + (this._projectId || 'personal') + '-' + new Date().toISOString().slice(0, 10) + '.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
    }

    _esc(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
}
