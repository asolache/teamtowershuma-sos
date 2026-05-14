// =============================================================================
// TEAMTOWERS SOS V11 — SAVINGS VIEW (MKT-001 sprint D)
// Ruta: /js/views/SavingsView.js · matchea /savings (global) o /savings?project={id}
//
// Cuadro comparativo de ahorro acumulado vs vías convencionales.
// Combina datos reales del KB (wallet · efficiency_log · WOs) y los
// compara con rangos editables (notaria · contable · pm · consultoria).
// =============================================================================

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import { loadConventionalRanges } from '../core/conventionalRangesService.js';
import {
    computeProjectSavings, buildSavingsTable, accumulateAllProjects,
} from '../core/savingsService.js';
import { renderNavLinksHtml, renderNavGroupedHtml, ensureNavGroupStyle, bindNavGroupDropdowns } from '../core/navService.js';
import { visibleProjects } from '../core/projectFilter.js';
import { renderExplainerBadge, bindExplainerBadges, ensureExplainerStyle } from '../core/didacticService.js';

const CATEGORY_ICONS = {
    notaria:     '⚖',
    contable:    '📒',
    pm:          '📋',
    consultoria: '🎓',
};
const CATEGORY_COLORS = {
    notaria:     '#a855f7',
    contable:    '#06b6d4',
    pm:          '#facc15',
    consultoria: '#22c55e',
};

export default class SavingsView {
    constructor() {
        document.title = 'Ahorro · SOS V11';
        this.projectId   = null;
        this.project     = null;
        this.allProjects = [];
        this.wallets     = [];
        this.efficiencyLogs = [];
        this.workOrders  = [];
    }

    async getHtml() {
        await store.init();
        const params = new URLSearchParams(window.location.search);
        this.projectId = params.get('project') || null;
        if (this.projectId) {
            this.project = (store.getState().projects || []).find(p => p.id === this.projectId) || null;
        }
        this.allProjects = visibleProjects(store.getState().projects);

        return `
        <style>
            .sa-shell  { height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); display:flex; flex-direction:column; overflow:hidden; }
            .sa-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; flex-wrap:wrap; min-height:48px; box-sizing:border-box; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-shrink:0; flex-wrap:wrap; }
            .sa-logo   { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .sa-logo span { color:var(--accent-indigo); }
            .sa-title  { color:var(--text-secondary); font-weight:500; letter-spacing:0.05em; text-transform:uppercase; font-size:0.78rem; }
            .sa-spacer { flex:1; }
            .sa-link { color:var(--text-secondary); text-decoration:none; font-size:var(--text-xs); font-weight:600; padding:6px 10px; border-radius:var(--radius-sm); transition:all var(--dur-fast); display:inline-flex; align-items:center; gap:4px; white-space:nowrap; }
            .sa-link:hover { color:var(--text-main); background:var(--glass-hover); }
            .sa-link:focus-visible { outline:2px solid var(--accent-indigo); outline-offset:2px; }

            .sa-main   { padding:1.5rem; max-width:1180px; margin:0 auto; flex:1; overflow-y:auto; width:100%; box-sizing:border-box; }

            .sa-hero   { background:linear-gradient(145deg,rgba(34,197,94,0.06),rgba(0,0,0,0)); border:1px solid var(--border-default); border-left:3px solid #22c55e; border-radius:10px; padding:1.4rem; margin-bottom:1.4rem; }
            .sa-hero h1 { margin:0; color:var(--text-main); font-size:1.3rem; }
            .sa-hero .meta { color:var(--text-secondary); font-size:0.85rem; margin-top:0.3rem; line-height:1.45; }

            .sa-stats  { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:0.7rem; margin-top:1rem; }
            .sa-stat   { background:var(--bg-panel); border:1px solid var(--border-default); border-left:3px solid var(--sa-c,#6366f1); border-radius:8px; padding:0.7rem 0.9rem; }
            .sa-stat .label { color:var(--text-muted); font-size:0.7rem; font-family:monospace; text-transform:uppercase; letter-spacing:0.05em; }
            .sa-stat .value { color:var(--text-main); font-size:1.35rem; font-weight:700; margin-top:0.2rem; font-family:monospace; }
            .sa-stat .sub   { color:var(--text-secondary); font-size:0.7rem; margin-top:0.15rem; }

            .sa-section h2 { margin:1.6rem 0 0.7rem 0; font-size:0.85rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em; font-family:monospace; }

            .sa-cards  { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:0.8rem; }
            .sa-card   { background:var(--bg-panel); border:1px solid var(--border-default); border-left:3px solid var(--sa-cc,#a855f7); border-radius:10px; padding:1rem; }
            .sa-card .head { display:flex; align-items:center; gap:0.5rem; margin-bottom:0.6rem; }
            .sa-card .head .icon { font-size:1.5rem; }
            .sa-card .head .name { color:var(--text-main); font-weight:700; font-size:0.95rem; }
            .sa-card .range { color:var(--text-secondary); font-size:0.75rem; font-family:monospace; margin-bottom:0.3rem; }
            .sa-card .saving-amt { color:var(--accent-orange); font-size:1.4rem; font-weight:700; font-family:monospace; }
            .sa-card .saving-pct { color:var(--accent-green); font-size:0.95rem; font-family:monospace; margin-top:0.2rem; }
            .sa-card .sos-cost { color:#7dd3fc; font-size:0.78rem; font-family:monospace; margin-top:0.4rem; }
            .sa-card .bar { background:var(--bg-elevated); border-radius:4px; overflow:hidden; height:6px; margin-top:0.5rem; }
            .sa-card .bar > span { display:block; height:100%; background:linear-gradient(90deg,#22c55e,#86efac); }

            .sa-table  { width:100%; border-collapse:collapse; font-size:0.78rem; margin-top:0.5rem; }
            .sa-table th { color:var(--text-muted); font-family:monospace; font-weight:600; text-align:left; padding:6px 8px; border-bottom:1px solid var(--border-default); text-transform:uppercase; letter-spacing:0.05em; font-size:0.7rem; }
            .sa-table td { padding:8px; border-bottom:1px solid #11111a; color:#ddd; font-family:monospace; }
            .sa-table td.num { text-align:right; }
            .sa-table tr:hover td { background:rgba(99,102,241,0.04); }
            .sa-table a { color:var(--accent-indigo); text-decoration:none; }
            .sa-table a:hover { text-decoration:underline; }

            .sa-empty { text-align:center; padding:3rem 1rem; color:var(--text-muted); border:1px dashed #2a2a35; border-radius:8px; }

            .sa-banner { background:rgba(99,102,241,0.05); border:1px dashed rgba(99,102,241,0.3); border-radius:8px; padding:0.7rem 0.9rem; font-size:0.78rem; color:var(--accent-indigo); margin-top:1rem; line-height:1.5; }
        </style>

        <div class="sa-shell">
            <div class="sa-topbar">
                <a href="/" data-link class="sa-logo">🗼 Team<span>Towers</span></a>
                <span class="sa-title">Ahorro acumulado · cuadro comparativo ${renderExplainerBadge('triple-entry-accounting', { size: 'xs' })}</span>
                <div class="sa-spacer"></div>
                
            </div>
            <div class="sa-main" id="saMain">
                <p style="color:var(--text-muted);font-size:0.85rem;">Cargando…</p>
            </div>
        </div>`;
    }

    async afterRender() {
        ensureExplainerStyle();
        bindExplainerBadges(document);
        await this._load();
        this._render();
        bindExplainerBadges(document);
        // FUND-FLOW-001 sprint E · panell unified cost breakdown
        if (this.projectId) {
            this._renderUnifiedCostPanel().catch(e => console.warn('[savings] cost panel', e));
        }
    }

    async _renderUnifiedCostPanel() {
        const main = document.getElementById('saMain');
        if (!main || !this.projectId) return;
        const { computeUnifiedCostPanelData, CATEGORY_META } = await import('../core/costTrackingService.js');
        const data = await computeUnifiedCostPanelData(this.projectId);
        const all = data.summaries.all;
        const today = data.summaries.today;
        const week = data.summaries.week;

        // Render per cada categoria una barra
        const bars = Object.entries(CATEGORY_META).map(([cat, meta]) => {
            const eurAll  = all.totals[cat]  || 0;
            const eurWeek = week.totals[cat] || 0;
            const eurToday = today.totals[cat] || 0;
            const widthPct = all.total > 0 ? Math.max(2, (eurAll / all.total) * 100) : 0;
            return `<div style="display:grid;grid-template-columns:120px 1fr 90px 90px 90px;gap:12px;align-items:center;padding:6px 0;font-size:0.85rem;border-bottom:1px solid var(--border-subtle);">
                <span style="display:inline-flex;align-items:center;gap:6px;color:${meta.color};font-weight:600;">${meta.icon} ${meta.label}</span>
                <div style="background:var(--bg-elevated);border-radius:6px;height:12px;position:relative;overflow:hidden;">
                    <div style="background:${meta.color};height:100%;width:${widthPct}%;transition:width 0.3s;"></div>
                </div>
                <span style="color:${meta.color};font-family:var(--font-mono);font-weight:700;text-align:right;">${eurAll.toFixed(2)} €</span>
                <span style="color:var(--text-muted);font-family:var(--font-mono);text-align:right;">${eurWeek.toFixed(2)} €</span>
                <span style="color:var(--text-muted);font-family:var(--font-mono);text-align:right;">${eurToday.toFixed(2)} €</span>
            </div>`;
        }).join('');

        let panel = document.getElementById('saCostPanel');
        if (!panel) {
            panel = document.createElement('section');
            panel.id = 'saCostPanel';
            panel.style.cssText = 'margin-top:1.6rem;background:var(--bg-panel);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:1.2rem;box-shadow:var(--shadow-sm);';
            main.appendChild(panel);
        }
        panel.innerHTML = `
            <h2 style="margin:0 0 0.4rem 0;color:var(--text-main);font-size:1.05rem;">📊 Consum unificat per categoria · sprint E</h2>
            <p style="color:var(--text-muted);font-size:0.85rem;margin:0 0 0.8rem 0;">
                Wallet del projecte · saldo actual <strong style="color:var(--text-main);">${Number(data.wallet.content.balanceEur || 0).toFixed(2)} €</strong> · total consumit <strong style="color:var(--text-main);">${all.total.toFixed(2)} €</strong> (${all.totalCount} moviments) classificat per categoria operativa.
            </p>
            <div style="display:grid;grid-template-columns:120px 1fr 90px 90px 90px;gap:12px;padding:6px 0;border-bottom:2px solid var(--border-default);font-size:0.72rem;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);font-weight:700;">
                <span>Categoria</span>
                <span>Distribució</span>
                <span style="text-align:right;">Total</span>
                <span style="text-align:right;">7 dies</span>
                <span style="text-align:right;">Avui</span>
            </div>
            ${bars}
        `;
    }

    async _load() {
        await KB.init();
        this.efficiencyLogs = await KB.query({ type: 'efficiency_log' });
        this.wallets        = await KB.query({ type: 'wallet' });
        this.workOrders     = await KB.query({ type: 'work_order' });
        // MKT-003 · ranges convencionals · si l'usuari els ha personalitzat
        // via /settings (tab Mercat · pendent) els llegim del KB · si no,
        // fallback a DEFAULT_CONVENTIONAL_RANGES de marketService.
        try {
            const cfg = await loadConventionalRanges({ kb: KB });
            this.conventionalRanges       = cfg.ranges;
            this.conventionalRangesSource = cfg.source;
        } catch (_) {
            this.conventionalRanges       = null;   // fallback intern de buildSavingsTable
            this.conventionalRangesSource = 'default-fallback-load-failed';
        }
    }

    _render() {
        const main = document.getElementById('saMain');
        if (!main) return;

        // Modo: por proyecto si hay projectId · si no, vista global con todos
        if (this.projectId) {
            this._renderProjectMode(main);
        } else {
            this._renderGlobalMode(main);
        }
    }

    _renderProjectMode(main) {
        if (!this.project) {
            main.innerHTML = `<div class="sa-empty"><p>Proyecto no encontrado: <code>${this._esc(this.projectId)}</code></p></div>`;
            return;
        }
        const wallet = this.wallets.find(w => w.content?.projectId === this.projectId) || null;
        const stats = computeProjectSavings({
            projectId: this.projectId,
            wallet,
            efficiencyLogs: this.efficiencyLogs,
            workOrders:    this.workOrders,
        });
        const cards = buildSavingsTable(stats, this.conventionalRanges || undefined);

        main.innerHTML = `
            <div class="sa-hero">
                <h1 class="mat-hero-h1">📊 Ahorro <strong>acumulat</strong> · ${this._esc(this.project.nombre || this.project.id)}</h1>
                <div class="meta">Coste real SOS = IA (descontada del wallet o estimada de logs) + horas humanas (Kanban actualHours × FMV). Comparado contra los 4 rangos convencionales editables (sprint D2 los hará ajustables en /settings).</div>
                <div class="sa-stats">
                    <div class="sa-stat" style="--sa-c:#7dd3fc;">
                        <div class="label">Coste IA real</div>
                        <div class="value">${stats.aiCostEur.toFixed(4)} €</div>
                        <div class="sub">${stats.aiCallCount} llamadas · ${stats.aiTokensTotal.toLocaleString('es-ES')} tokens</div>
                    </div>
                    <div class="sa-stat" style="--sa-c:#fb923c;">
                        <div class="label">Coste humano real</div>
                        <div class="value">${stats.humanCostReal.toFixed(2)} €</div>
                        <div class="sub">${stats.humanHoursReal.toFixed(2)} h · ${stats.woLedgered}/${stats.woCount} WOs ledgered</div>
                    </div>
                    <div class="sa-stat" style="--sa-c:#facc15;">
                        <div class="label">Coste SOS total</div>
                        <div class="value">${stats.sosTotalCostEur.toFixed(2)} €</div>
                        <div class="sub">IA + humano · operación real</div>
                    </div>
                    <div class="sa-stat" style="--sa-c:#86efac;">
                        <div class="label">WOs en ledger</div>
                        <div class="value">${stats.woLedgered}</div>
                        <div class="sub">de ${stats.woCount} totales</div>
                    </div>
                </div>
            </div>

            <div class="sa-section">
                <h2>Comparativa vs vías convencionales</h2>
                <div class="sa-cards">${cards.map(c => this._cardHtml(c)).join('')}</div>
            </div>

            <div class="sa-banner">
                💡 Estos números asumen que <strong>el SOS reemplaza la categoría completa</strong> con su flujo IA + humano.
                Útil como argumento de venta para alfa privada (BILL-001) ·
                no como factura definitiva. Cada cliente puede ajustar los rangos
                según su mercado local en sprint D2.
            </div>

            <div class="sa-section">
                <h2>Detalle de cálculo</h2>
                <table class="sa-table">
                    <thead><tr><th>Concepto</th><th class="num">Valor</th><th>Notas</th></tr></thead>
                    <tbody>
                        <tr><td>Wallet · consumido</td><td class="num">${(stats.aiCostEur).toFixed(4)} €</td><td>${stats.walletConsumedCount} movimientos consume · sprint C3</td></tr>
                        <tr><td>Tokens IA totales</td><td class="num">${stats.aiTokensTotal}</td><td>de efficiency_log con projectId</td></tr>
                        <tr><td>Horas humanas estimadas</td><td class="num">${stats.humanHoursEst.toFixed(2)} h</td><td>WOs · estimatedHours · ${stats.humanCostEst.toFixed(2)} €</td></tr>
                        <tr><td>Horas humanas reales</td><td class="num">${stats.humanHoursReal.toFixed(2)} h</td><td>WOs · actualHours · ${stats.humanCostReal.toFixed(2)} €</td></tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    _renderGlobalMode(main) {
        const acc = accumulateAllProjects({
            projects:        this.allProjects,
            wallets:         this.wallets,
            efficiencyLogs:  this.efficiencyLogs,
            workOrders:      this.workOrders,
        });

        if (!acc.projectsCount) {
            main.innerHTML = `
                <div class="sa-hero">
                    <h1 class="mat-hero-h1">📊 Ahorro <strong>acumulat</strong> · global</h1>
                    <div class="meta">Aún no hay proyectos. Crea uno desde <a href="/dashboard" data-link class="sa-link">el dashboard</a> y vuelve.</div>
                </div>
                <div class="sa-empty"><p>Sin proyectos.</p></div>`;
            return;
        }

        const cards = buildSavingsTable(acc.totals, this.conventionalRanges || undefined);
        const rows = acc.byProject.map(s => {
            const proj = this.allProjects.find(p => p.id === s.projectId);
            const name = this._esc(proj?.nombre || proj?.id || s.projectId);
            return `<tr>
                <td><a href="/savings?project=${encodeURIComponent(s.projectId)}" data-link>${name}</a></td>
                <td class="num">${s.aiCostEur.toFixed(4)} €</td>
                <td class="num">${s.humanCostReal.toFixed(2)} €</td>
                <td class="num">${s.sosTotalCostEur.toFixed(2)} €</td>
                <td class="num">${s.woLedgered}/${s.woCount}</td>
                <td class="num">${s.aiCallCount}</td>
            </tr>`;
        }).join('');

        main.innerHTML = `
            <div class="sa-hero">
                <h1 class="mat-hero-h1">📊 Ahorro <strong>acumulat</strong> · global</h1>
                <div class="meta">Suma de todos los proyectos activos · IA real + humano real comparado contra rangos convencionales (notaría · contable · PM · consultoría).</div>
                <div class="sa-stats">
                    <div class="sa-stat" style="--sa-c:#a5b4fc;">
                        <div class="label">Proyectos</div>
                        <div class="value">${acc.projectsCount}</div>
                    </div>
                    <div class="sa-stat" style="--sa-c:#7dd3fc;">
                        <div class="label">IA total</div>
                        <div class="value">${acc.totals.aiCostEur.toFixed(2)} €</div>
                        <div class="sub">${acc.totals.aiCallCount} llamadas · ${acc.totals.aiTokensTotal.toLocaleString('es-ES')} tokens</div>
                    </div>
                    <div class="sa-stat" style="--sa-c:#fb923c;">
                        <div class="label">Humano total</div>
                        <div class="value">${acc.totals.humanCostReal.toFixed(2)} €</div>
                        <div class="sub">${acc.totals.humanHoursReal.toFixed(2)} h reales</div>
                    </div>
                    <div class="sa-stat" style="--sa-c:#facc15;">
                        <div class="label">SOS total</div>
                        <div class="value">${acc.totals.sosTotalCostEur.toFixed(2)} €</div>
                        <div class="sub">IA + humano · todos proyectos</div>
                    </div>
                    <div class="sa-stat" style="--sa-c:#86efac;">
                        <div class="label">WOs ledgered</div>
                        <div class="value">${acc.totals.woLedgered}</div>
                        <div class="sub">de ${acc.totals.woCount} totales</div>
                    </div>
                </div>
            </div>

            <div class="sa-section">
                <h2>Ahorro vs convencional · suma global</h2>
                <div class="sa-cards">${cards.map(c => this._cardHtml(c)).join('')}</div>
            </div>

            <div class="sa-section">
                <h2>Detalle por proyecto</h2>
                <table class="sa-table">
                    <thead>
                        <tr>
                            <th>Proyecto</th>
                            <th class="num">IA real</th>
                            <th class="num">Humano real</th>
                            <th class="num">SOS total</th>
                            <th class="num">WOs ledger</th>
                            <th class="num">Llamadas</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }

    _cardHtml(c) {
        if (!c.available) return '';
        const color = CATEGORY_COLORS[c.category] || '#a855f7';
        const icon  = CATEGORY_ICONS[c.category]  || '💡';
        const pctClamped = Math.max(0, Math.min(100, c.savingPct || 0));
        return `
            <div class="sa-card" style="--sa-cc:${color};">
                <div class="head">
                    <span class="icon">${icon}</span>
                    <span class="name">${this._esc(c.label || c.category)}</span>
                </div>
                <div class="range">Convencional: ${c.lowEur}-${c.highEur} €${c.unit ? ' (' + this._esc(c.unit) + ')' : ''}</div>
                <div class="saving-amt">${c.savingEur.toFixed(2)} € ahorrado</div>
                <div class="saving-pct">~ ${c.savingPct}% vs midpoint ${c.midEur}€</div>
                <div class="bar"><span style="width:${pctClamped}%;"></span></div>
                <div class="sos-cost">SOS real: ${c.sosEur.toFixed(2)} €</div>
            </div>
        `;
    }

    _esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }

    destroy() {}
}
