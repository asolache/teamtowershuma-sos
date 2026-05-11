// TEAMTOWERS SOS V11 — VALUE ACCOUNTING VIEW (VAL-001 sprint B)
//
// Ruta: /value-accounting?project={projectId}
// Visualiza la tarta del proyecto KIS · una sola tarta dividida en
// pies con targets fijos, cada miembro con su % final del proyecto.
//
// UI:
//   - Hero · skin Matriu · "Tarta del projecte · {nombre}"
//   - 4 stat-cards · Total slices · Líder · Allocated% · Unallocated%
//   - Pie chart D3 (color por pie type) · centro con projectId
//   - Tabla de pies · target% · used% · slices · status (active/empty)
//   - Tabla de parties · party · pieType · slices · sharePctInPie · sharePctInProject
//   - Form añadir contribution (party + type + fairValueEur)
//   - Editor pieTargets (4-5 sliders que suman 100)

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import { renderNavLinksHtml, renderNavGroupedHtml, ensureNavGroupStyle, bindNavGroupDropdowns } from '../core/navService.js';
import {
    SLICING_PIE_MULTIPLIERS, FAIRSHARES_PIE_TYPES,
    DEFAULT_PIE_TARGETS_BY_PROJECT_TYPE,
    buildContribution, fairValueForTime,
    calculateProjectPie, summarizeProjectPie,
    pieTargetsForProject, validatePieTargets,
    buildValueContributionNode, extractContributionsFromKb,
} from '../core/valueAccountingService.js';
import { importWosToContributions, importStats } from '../core/woContributionService.js';
import { renderExplainerBadge, bindExplainerBadges, ensureExplainerStyle } from '../core/didacticService.js';

// Color por pie type (consistente con landing Matriu)
const PIE_COLORS = Object.freeze({
    founders:  '#c25a3a',   // terracota
    team:      '#5a6e4f',   // verd olivo
    users:     '#2c4a7a',   // azul profund
    investors: '#fbbf24',   // ambre
    community: '#a855f7',   // morado · comunidad
});

function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export default class ValueAccountingView {
    constructor() {
        document.title = 'Comptabilitat de valor · SOS V11';
        this.projectId = null;
        this.project = null;
        this.contributions = [];
        this.partyTypeMap = {};      // { partyId: pieType }
        this.pieTargets = null;      // { founders: 50, team: 30, ... }
        this.projectPie = null;      // resultado de calculateProjectPie
    }

    async getHtml() {
        await store.init();
        await KB.init();
        const params = new URLSearchParams(window.location.search);
        this.projectId = params.get('project');
        if (!this.projectId) return this._htmlNoProject();

        const projects = (store.getState().projects || []);
        this.project = projects.find(p => p.id === this.projectId);
        if (!this.project) return this._htmlError('Projecte no trobat: ' + this.projectId);

        // Cargar contributions del KB
        const allNodes = await KB.getAllNodes();
        this.contributions = extractContributionsFromKb({ kbNodes: allNodes, projectId: this.projectId });

        // Cargar partyTypeMap del KB (si existe nodo `value_party_map`)
        const mapNode = allNodes.find(n => n.id === this.projectId + '::value-party-map' && n.type === 'value_party_map');
        this.partyTypeMap = mapNode?.content?.map || {};

        // Cargar pieTargets del KB o defaults según projectType
        const targetsNode = allNodes.find(n => n.id === this.projectId + '::value-pie-targets' && n.type === 'value_pie_targets');
        const projectTypeId = this.project.matriuProjectType || null;
        this.pieTargets = targetsNode?.content?.targets || pieTargetsForProject({ projectTypeId });

        // Calcular tarta
        try {
            this.projectPie = calculateProjectPie({
                contributions: this.contributions,
                partyTypeMap:  this.partyTypeMap,
                pieTargets:    this.pieTargets,
            });
        } catch (e) {
            console.warn('[VAL-001 B] calculateProjectPie falló:', e);
            this.projectPie = { pieTargets: this.pieTargets, totalSlices: 0, piesActive: [], piesEmpty: Object.keys(this.pieTargets), parties: [] };
        }

        return this._renderShell();
    }

    _htmlNoProject() {
        return `
        <div class="va-shell">
            <div class="va-empty">
                <div style="font-size:2.4rem;margin-bottom:0.6rem;">📊</div>
                <h2 class="mat-hero-h1">Falta el projecte a la <strong>URL</strong></h2>
                <p style="color:var(--text-muted);font-size:0.9rem;">Aquesta vista necessita <code>?project={id}</code>.</p>
                <a href="/dashboard" data-link style="color:var(--accent-purple);font-size:0.85rem;">← Dashboard</a>
            </div>
        </div>
        ${this._renderStyle()}
        `;
    }

    _htmlError(msg) {
        return `
        <div class="va-shell">
            <div class="va-empty">
                <div style="font-size:2.4rem;color:var(--accent-red);">✘</div>
                <h2 class="mat-hero-h1">${escapeHtml(msg)}</h2>
                <a href="/dashboard" data-link style="color:var(--accent-purple);font-size:0.85rem;">← Dashboard</a>
            </div>
        </div>
        ${this._renderStyle()}
        `;
    }

    _renderShell() {
        const p = this.project;
        const summary = summarizeProjectPie(this.projectPie);
        const piesActive = this.projectPie.piesActive || [];
        const piesEmpty = this.projectPie.piesEmpty || [];

        return `
        ${this._renderStyle()}
        <div class="va-shell">
            <div class="va-topbar">
                <a href="/" data-link class="va-logo">🗼 Team<span>Towers</span></a>
                <span class="va-title">📊 Contabilitat de valor ${renderExplainerBadge('triple-entry-accounting', { size: 'xs' })} ${renderExplainerBadge('slicing-pie', { size: 'xs' })} ${renderExplainerBadge('fair-fractal-tokenomics', { size: 'xs' })}</span>
                <div class="va-spacer"></div>
                <a href="/project/${encodeURIComponent(p.id)}" data-link class="va-link">🎛 Panel projecte</a>
                
            </div>

            <div class="va-main">
                <div class="va-hero">
                    <h1 class="mat-hero-h1">📊 Tarta del <strong>projecte</strong> · ${escapeHtml(p.nombre || p.name || p.id)}</h1>
                    <p class="va-hero-sub">Slicing Pie + FairShares · una sola tarta dividida en pies amb target % acotats. Cada membre rep el seu % del projecte segons les seves aportacions.</p>

                    <div class="va-stats-row">
                        <div class="va-stat" style="--va-c:${PIE_COLORS.founders};">
                            <div class="va-stat-label">Membres</div>
                            <div class="va-stat-value">${summary.totalParties}</div>
                        </div>
                        <div class="va-stat" style="--va-c:#c084fc;">
                            <div class="va-stat-label">Slices total</div>
                            <div class="va-stat-value">${summary.totalSlices.toLocaleString('ca-ES')}</div>
                        </div>
                        <div class="va-stat" style="--va-c:${summary.allocatedPct >= 95 ? '#22c55e' : '#fbbf24'};">
                            <div class="va-stat-label">Assignat</div>
                            <div class="va-stat-value">${summary.allocatedPct}%</div>
                        </div>
                        <div class="va-stat" style="--va-c:${summary.unallocatedPct === 0 ? '#22c55e' : '#fca5a5'};">
                            <div class="va-stat-label">Sense assignar</div>
                            <div class="va-stat-value">${summary.unallocatedPct}%</div>
                            ${summary.unallocatedPct > 0 ? `<div class="va-stat-sub">${summary.piesEmptyCount} pie${summary.piesEmptyCount !== 1 ? 's' : ''} buit${summary.piesEmptyCount !== 1 ? 's' : ''}</div>` : ''}
                        </div>
                    </div>
                </div>

                <div class="va-grid">
                    <div class="va-section">
                        <h2>🥧 Tarta del projecte</h2>
                        <div id="vaPieChart" class="va-pie-chart"></div>
                        <div class="va-legend" id="vaLegend"></div>
                    </div>

                    <div class="va-section">
                        <h2>🍰 Pies (target % del projecte)</h2>
                        <div class="va-pies-list" id="vaPiesList"></div>
                        <button class="va-btn-secondary" id="vaEditTargets">Editar targets ↗</button>
                    </div>
                </div>

                <div class="va-section">
                    <h2>👥 Membres · % del projecte</h2>
                    ${this._renderPartiesTable()}
                </div>

                <div class="va-section">
                    <h2>🔄 Importar des de WOs ledgered <span style="color:var(--text-muted);font-weight:400;font-size:0.78rem;">· VAL-001 sprint C · Antigravity Engine</span></h2>
                    <p style="color:var(--text-secondary);font-size:0.88rem;line-height:1.6;margin-bottom:14px;">
                        Cada Work Order amb status='ledgered' + actualHours + party assignat es converteix automàticament en una <strong class="mat-accent">aportació de tipus time</strong>. Si el WO declara <code>fmvPerHour</code>, s'aplica directe; si no, fórmula default <code>2 × salari_anual / 2000h × hores</code>.
                    </p>
                    <div id="vaImportPreview" style="margin-bottom:12px;"></div>
                    <button class="va-btn" id="vaBtnImportWos">🔄 Escanejar WOs i importar</button>
                </div>

                <div class="va-section">
                    <h2>➕ Afegir aportació manual</h2>
                    <p style="color:var(--text-secondary);font-size:0.86rem;margin-bottom:10px;">Per a aportacions que <strong>NO</strong> vénen del Kanban · cash · actius · idees · contactes. Les hores treballades es generen automàticament des dels WOs ledgered.</p>
                    ${this._renderContributionForm()}
                </div>

                <div class="va-section va-section-explain">
                    <h2>Com funciona</h2>
                    <p><strong class="mat-accent">1. Aportes valor</strong> · cash, hores, idees, actius, contactes. Cada tipus té un multiplicador de risc (cash ×4 · time ×2 · ideas ×1).</p>
                    <p><strong class="mat-accent">2. Generes slices</strong> · slices = fairValueEur × multiplier. Les teves slices van al pie del teu stakeholder type (founders/team/users/investors/community).</p>
                    <p><strong class="mat-accent">3. Reps el teu %</strong> · sharePctInProject = (slicesTeves / totalSlicesTuPie) × pieTarget. Si el teu pie té 50% del projecte i tu tens la meitat de slices del pie · reps 25% del projecte.</p>
                    <p><strong class="mat-accent">4. Pies sense aportacions</strong> · queden sense assignar (alerta visible). NO es redistribueixen automàticament · el pacte ha de decidir.</p>
                </div>
            </div>
        </div>
        `;
    }

    _renderStyle() {
        return `
        <style>
            .va-shell { background: var(--bg-dark); color: var(--text-main); min-height: 100%; font-family: var(--font-base, sans-serif); display: flex; flex-direction: column; }
            .va-topbar { display: flex; align-items: center; gap: 1rem; padding: 14px 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; flex-shrink: 0; }
            .va-logo { font-family: monospace; color: var(--text-muted); text-decoration: none; font-size: 0.78rem; }
            .va-logo span { color: #6366f1; font-weight: 700; }
            .va-title { color: var(--text-secondary); font-size: 0.86rem; display: inline-flex; align-items: center; gap: 6px; }
            .va-spacer { flex: 1; }
            .va-link { color: var(--text-muted); text-decoration: none; font-size: 0.85rem; padding: 6px 12px; border-radius: 6px; transition: background 0.15s; }
            .va-link:hover { background: var(--glass-hover); color: var(--text-main); }

            .va-main { flex: 1; padding: clamp(20px, 4vw, 36px); max-width: 1240px; margin: 0 auto; width: 100%; box-sizing: border-box; overflow-y: auto; }
            .va-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center; gap: 0.6rem; padding: 2rem; }

            .va-hero { margin-bottom: 24px; padding: 24px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
            .va-hero h1 { font-size: clamp(1.6rem, 3vw, 2.2rem); color: var(--text-main); line-height: 1.05; margin-bottom: 6px; }
            .va-hero-sub { color: var(--text-secondary); font-size: 0.92rem; max-width: 720px; line-height: 1.55; margin-bottom: 18px; }

            .va-stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
            .va-stat { background: var(--bg-panel); border: 1px solid var(--border-default); border-left: 3px solid var(--va-c, var(--text-muted)); border-radius: var(--radius-md); padding: 14px 16px; box-shadow: var(--shadow-sm); }
            .va-stat-label { font-family: monospace; font-size: 0.7rem; color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase; }
            .va-stat-value { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 1.8rem; color: var(--text-main); line-height: 1; margin-top: 6px; }
            .va-stat-sub { font-family: monospace; font-size: 0.7rem; color: var(--va-c); margin-top: 4px; }

            .va-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; }
            @media (max-width: 880px) { .va-grid { grid-template-columns: 1fr; } }

            .va-section { background: rgba(255,255,255,0.025); border: 1px solid var(--border-default); border-radius: 10px; padding: 20px; margin-bottom: 20px; }
            .va-section h2 { color: var(--text-main); font-size: 1.05rem; margin-bottom: 14px; font-weight: 600; }

            .va-pie-chart { width: 100%; height: 320px; display: flex; align-items: center; justify-content: center; }
            .va-pie-chart svg { width: 100%; height: 100%; }

            .va-legend { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; max-height: 200px; overflow-y: auto; }
            .va-legend-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; font-size: 0.82rem; }
            .va-legend-item:hover { background: var(--glass-hover); }
            .va-legend-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
            .va-legend-name { flex: 1; color: #ddd; }
            .va-legend-pct { font-family: monospace; color: var(--accent-purple); font-weight: 700; }

            .va-pies-list { display: flex; flex-direction: column; gap: 10px; }
            .va-pie-row { display: grid; grid-template-columns: auto 1fr auto auto; gap: 12px; align-items: center; padding: 10px 12px; border: 1px solid var(--border-default); border-radius: 8px; background: var(--glass-hover); }
            .va-pie-row.is-empty { opacity: 0.55; border-style: dashed; }
            .va-pie-dot { width: 14px; height: 14px; border-radius: 50%; }
            .va-pie-name { font-weight: 600; color: var(--text-main); text-transform: capitalize; }
            .va-pie-bar { width: 100%; height: 4px; background: var(--glass-hover); border-radius: 99px; overflow: hidden; margin-top: 4px; }
            .va-pie-bar-fill { height: 100%; border-radius: 99px; }
            .va-pie-target { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 1.2rem; color: var(--text-main); }
            .va-pie-status { font-family: monospace; font-size: 0.7rem; padding: 2px 8px; border-radius: 99px; white-space: nowrap; }
            .va-pie-status.is-active { background: rgba(34,197,94,0.12); color: #4ade80; border: 1px solid rgba(34,197,94,0.4); }
            .va-pie-status.is-empty { background: rgba(252,165,165,0.12); color: var(--accent-red); border: 1px solid rgba(252,165,165,0.3); }

            .va-table { width: 100%; border-collapse: collapse; }
            .va-table thead th { padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.12); text-align: left; font-family: monospace; font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; }
            .va-table tbody tr:hover { background: var(--glass-hover); }
            .va-table tbody td { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.88rem; color: #ddd; }
            .va-table tbody td.va-td-pie { font-weight: 600; text-transform: capitalize; }
            .va-table tbody td.va-td-pct { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 1.15rem; color: var(--accent-purple); text-align: right; }
            .va-table tbody td.va-td-share-pie { font-family: monospace; color: var(--text-muted); text-align: right; font-size: 0.82rem; }
            .va-table-empty { color: var(--text-muted); font-style: italic; padding: 14px; text-align: center; }

            .va-form { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr auto; gap: 8px; align-items: end; }
            .va-form label { display: flex; flex-direction: column; gap: 4px; font-family: monospace; font-size: 0.7rem; color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase; font-weight: 500; }
            .va-input { background: var(--bg-elevated); border: 1px solid var(--border-default); color: var(--text-main); padding: 10px 12px; border-radius: 6px; font-size: 0.88rem; outline: none; transition: border-color 0.15s; font-family: inherit; }
            .va-input:focus { border-color: var(--accent-purple); }
            .va-btn { background: linear-gradient(135deg, #c084fc, #6366f1); color: var(--text-main); border: 0; padding: 10px 18px; border-radius: 6px; font-weight: 700; cursor: pointer; transition: transform 0.15s; font-size: 0.85rem; }
            .va-btn:hover { transform: translateY(-1px); }
            .va-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
            .va-btn-secondary { background: transparent; border: 1px solid rgba(255,255,255,0.15); color: var(--accent-purple); padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 0.82rem; margin-top: 12px; }
            .va-btn-secondary:hover { border-color: var(--accent-purple); }

            .va-section-explain p { color: var(--text-secondary); font-size: 0.88rem; line-height: 1.65; margin-bottom: 10px; }

            @media (max-width: 720px) {
                .va-form { grid-template-columns: 1fr; }
            }

            .va-edit-targets { background: rgba(192,132,252,0.06); border: 1px solid rgba(192,132,252,0.3); border-radius: 8px; padding: 14px; margin-top: 12px; display: none; }
            .va-edit-targets.is-open { display: block; }
            .va-target-slider { display: grid; grid-template-columns: 110px 1fr 60px; gap: 10px; align-items: center; padding: 6px 0; }
            .va-target-slider input[type=range] { accent-color: var(--accent-purple); }
            .va-target-slider input[type=number] { width: 60px; padding: 4px 8px; border: 1px solid var(--border-default); background: var(--bg-elevated); color: var(--text-main); border-radius: 4px; font-size: 0.85rem; text-align: right; }
            .va-target-sum { display: flex; justify-content: space-between; padding: 8px 12px; background: var(--bg-elevated); border-radius: 6px; margin: 10px 0; font-family: monospace; font-size: 0.85rem; }
            .va-target-sum.is-valid { color: #4ade80; }
            .va-target-sum.is-invalid { color: var(--accent-red); }
        </style>
        `;
    }

    _renderPartiesTable() {
        const parties = this.projectPie.parties || [];
        if (parties.length === 0) {
            return '<div class="va-table-empty">Encara no hi ha cap aportació · afegeix la primera al formulari de sota.</div>';
        }
        const rows = parties.map(p => {
            const color = PIE_COLORS[p.pieType] || '#888';
            return `
                <tr>
                    <td>${escapeHtml(p.partyId)}</td>
                    <td class="va-td-pie" style="color:${color};">${escapeHtml(p.pieType)}</td>
                    <td class="va-td-share-pie">${p.slicesInPie.toLocaleString('ca-ES')}</td>
                    <td class="va-td-share-pie">${p.sharePctInPie}%</td>
                    <td class="va-td-pct">${p.sharePctInProject}%</td>
                </tr>
            `;
        }).join('');
        return `
            <table class="va-table">
                <thead>
                    <tr>
                        <th>Membre</th>
                        <th>Pie</th>
                        <th style="text-align:right;">Slices al pie</th>
                        <th style="text-align:right;">% al pie</th>
                        <th style="text-align:right;">% al projecte</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    _renderContributionForm() {
        const knownParties = Array.from(new Set([
            ...Object.keys(this.partyTypeMap),
            ...this.contributions.map(c => c.partyId),
        ])).sort();
        const partyOptions = knownParties.length === 0
            ? ''
            : knownParties.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');

        const typeOptions = Object.keys(SLICING_PIE_MULTIPLIERS).map(t =>
            `<option value="${t}">${t} · ×${SLICING_PIE_MULTIPLIERS[t]}</option>`
        ).join('');
        const pieOptions = FAIRSHARES_PIE_TYPES.map(p =>
            `<option value="${p}">${p}</option>`
        ).join('');

        return `
            <form class="va-form" id="vaContribForm">
                <label>Membre (party)
                    <input type="text" id="vaPartyId" class="va-input" list="vaPartiesList" placeholder="ex. did:sos:abc · @alvaro · alvaro" required>
                    <datalist id="vaPartiesList">${partyOptions}</datalist>
                </label>
                <label>Pie
                    <select id="vaPartyPie" class="va-input">${pieOptions}</select>
                </label>
                <label>Tipus aportació
                    <select id="vaContribType" class="va-input">${typeOptions}</select>
                </label>
                <label>Valor (€)
                    <input type="number" id="vaFairValue" class="va-input" step="0.01" min="0" placeholder="100" required>
                </label>
                <button type="submit" class="va-btn">+ Afegir</button>
            </form>
            <p style="color:var(--text-muted);font-size:0.75rem;margin-top:8px;font-family:monospace;">
                Pista · per a hores de feina, valor = 2 × salari_anual / 2000 × hores. SOS calcula slices = valor × multiplicador automàticament.
            </p>
        `;
    }

    async afterRender() {
        ensureExplainerStyle();
        bindExplainerBadges(document);

        if (!this.projectPie) return;
        this._renderPieChart();
        this._renderLegend();
        this._renderPiesList();
        this._bindForm();
        this._bindEditTargets();
        this._bindImportWos();
        // FUND-FLOW-001 sprint C+D · panell distribució + claim
        this._renderDistributionPanel().catch(e => console.warn('[va] distribution panel', e));
    }

    async _renderDistributionPanel() {
        const main = document.querySelector('.va-main');
        if (!main || !this.projectId) return;
        // Carrega rule + wallet
        const { getDistributionRuleForProject, saveDistributionRule } = await import('../core/distributionRuleService.js');
        const { getOrCreateWalletForProject, computeStakeholdersPool, withdrawClaim } = await import('../core/walletService.js');
        const { resolveCurrentMember } = await import('../core/memberPanelService.js');
        const rule = await getDistributionRuleForProject(this.projectId);
        const wallet = await getOrCreateWalletForProject(this.projectId);
        const pool = computeStakeholdersPool(wallet, rule.stakeholdersBps);

        // Crea section dins .va-main si no existeix
        let section = document.getElementById('vaDistSection');
        if (!section) {
            section = document.createElement('section');
            section.id = 'vaDistSection';
            section.style.cssText = 'margin-top:1.6rem;background:var(--bg-panel);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:1.2rem;';
            main.appendChild(section);
        }

        const partiesHtml = (this.projectPie.parties || []).map(p => {
            const share = (p.sharePctInProject || 0) / 100;
            const claimedByThisParty = (wallet.content.movements || [])
                .filter(m => m && m.kind === 'consume' && m.source === 'stakeholder-claim' && m.ref && m.ref.includes(':party-' + p.partyId))
                .reduce((s, m) => s + Number(m.amountEur || 0), 0);
            const claimableForParty = Math.max(0, pool.allocatedEur * share - claimedByThisParty);
            return `<tr>
                <td style="padding:6px 8px;">${this._escHtml(p.partyId)}</td>
                <td style="padding:6px 8px;text-align:right;color:var(--text-muted);font-family:var(--font-mono);font-size:0.78rem;">${(p.sharePctInProject || 0).toFixed(2)}%</td>
                <td style="padding:6px 8px;text-align:right;font-family:var(--font-mono);color:var(--accent-green);font-weight:600;">${claimableForParty.toFixed(2)} €</td>
                <td style="padding:6px 8px;text-align:right;color:var(--text-muted);font-family:var(--font-mono);font-size:0.78rem;">${claimedByThisParty.toFixed(2)} €</td>
                <td style="padding:6px 8px;text-align:right;">
                    <button class="va-btn va-btn-claim" data-party="${this._escHtml(p.partyId)}" data-share="${share}" data-claimable="${claimableForParty}" ${claimableForParty <= 0 ? 'disabled' : ''}>💸 Retirar</button>
                </td>
            </tr>`;
        }).join('');

        section.innerHTML = `
            <h2 style="margin:0 0 0.6rem 0;color:var(--text-main);font-size:1.05rem;">🌊 Distribució automàtica · sprint C/D</h2>
            <p style="color:var(--text-muted);font-size:0.85rem;margin:0 0 0.8rem 0;">
                Quan arribi un <strong>topup amb source='income'</strong> al wallet del projecte (botó "💰 Registrar ingrés" a /wallet?project=${this._escHtml(this.projectId)}), automàticament es marca el split entre reserve operativa i pool stakeholders. Els stakeholders poden retirar el seu pie segons la seva share.
            </p>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin-bottom:1rem;">
                <div style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:8px 12px;">
                    <div style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono);text-transform:uppercase;">Saldo wallet</div>
                    <div style="font-size:1.2rem;font-weight:700;font-family:var(--font-mono);color:var(--text-main);">${Number(wallet.content.balanceEur || 0).toFixed(2)} €</div>
                </div>
                <div style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:8px 12px;">
                    <div style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono);text-transform:uppercase;">Pool stakeholders</div>
                    <div style="font-size:1.2rem;font-weight:700;font-family:var(--font-mono);color:var(--accent-green);">${pool.allocatedEur.toFixed(2)} €</div>
                </div>
                <div style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:8px 12px;">
                    <div style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono);text-transform:uppercase;">Ja retirat</div>
                    <div style="font-size:1.2rem;font-weight:700;font-family:var(--font-mono);color:var(--text-muted);">${pool.claimedEur.toFixed(2)} €</div>
                </div>
                <div style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:8px 12px;">
                    <div style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono);text-transform:uppercase;">Claimable global</div>
                    <div style="font-size:1.2rem;font-weight:700;font-family:var(--font-mono);color:var(--accent-claude);">${pool.claimableEur.toFixed(2)} €</div>
                </div>
            </div>

            <div style="display:flex;gap:8px;align-items:center;margin-bottom:0.8rem;flex-wrap:wrap;">
                <label style="font-size:0.78rem;color:var(--text-muted);">Regla:</label>
                <input type="number" min="0" max="100" id="vaRuleReserve" value="${(rule.operatingReserveBps/100).toFixed(0)}" style="width:60px;background:var(--bg-elevated);color:var(--text-main);border:1px solid var(--border-default);border-radius:6px;padding:4px 6px;text-align:right;font-family:var(--font-mono);">
                <span style="color:var(--text-muted);font-size:0.78rem;">% reserve · </span>
                <input type="number" min="0" max="100" id="vaRuleStake" value="${(rule.stakeholdersBps/100).toFixed(0)}" style="width:60px;background:var(--bg-elevated);color:var(--text-main);border:1px solid var(--border-default);border-radius:6px;padding:4px 6px;text-align:right;font-family:var(--font-mono);">
                <span style="color:var(--text-muted);font-size:0.78rem;">% stakeholders</span>
                <button id="vaRuleSave" class="va-btn" style="background:var(--accent-indigo);color:#fff;border:0;padding:4px 12px;border-radius:6px;font-size:0.78rem;font-weight:600;cursor:pointer;">💾 Guardar regla</button>
                <span id="vaRuleStatus" style="font-size:0.78rem;color:var(--accent-green);"></span>
            </div>

            <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
                <thead>
                    <tr style="border-bottom:1px solid var(--border-default);">
                        <th style="padding:6px 8px;text-align:left;color:var(--text-muted);font-size:0.72rem;font-family:var(--font-mono);text-transform:uppercase;">Party</th>
                        <th style="padding:6px 8px;text-align:right;color:var(--text-muted);font-size:0.72rem;font-family:var(--font-mono);text-transform:uppercase;">Share</th>
                        <th style="padding:6px 8px;text-align:right;color:var(--text-muted);font-size:0.72rem;font-family:var(--font-mono);text-transform:uppercase;">Claimable</th>
                        <th style="padding:6px 8px;text-align:right;color:var(--text-muted);font-size:0.72rem;font-family:var(--font-mono);text-transform:uppercase;">Retirat</th>
                        <th style="padding:6px 8px;text-align:right;"></th>
                    </tr>
                </thead>
                <tbody>${partiesHtml || '<tr><td colspan="5" style="padding:1rem;text-align:center;color:var(--text-muted);font-style:italic;">Cap party encara · afegeix contributions al projecte</td></tr>'}</tbody>
            </table>
            <div id="vaClaimStatus" style="margin-top:0.6rem;font-size:0.85rem;display:none;"></div>
        `;

        // Bind regla
        document.getElementById('vaRuleSave')?.addEventListener('click', async () => {
            const r  = parseFloat(document.getElementById('vaRuleReserve').value);
            const s  = parseFloat(document.getElementById('vaRuleStake').value);
            const st = document.getElementById('vaRuleStatus');
            if (!Number.isFinite(r) || !Number.isFinite(s) || r + s > 100) {
                if (st) { st.textContent = '✗ Suma > 100%'; st.style.color = 'var(--accent-red)'; }
                return;
            }
            try {
                await saveDistributionRule({ projectId: this.projectId, operatingReserveBps: r * 100, stakeholdersBps: s * 100 });
                if (st) { st.textContent = '✓ Guardat'; st.style.color = 'var(--accent-green)'; }
                setTimeout(() => { if (st) st.textContent = ''; }, 1500);
                this._renderDistributionPanel();
            } catch (err) {
                if (st) { st.textContent = '✗ ' + err.message; st.style.color = 'var(--accent-red)'; }
            }
        });

        // Bind claim buttons
        document.querySelectorAll('.va-btn-claim').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const partyId   = btn.getAttribute('data-party');
                const share     = parseFloat(btn.getAttribute('data-share'));
                const claimable = parseFloat(btn.getAttribute('data-claimable'));
                const status    = document.getElementById('vaClaimStatus');
                if (claimable <= 0) return;
                const setStatus = (msg, ok = true) => {
                    if (!status) return;
                    status.style.display = 'block';
                    status.textContent = msg;
                    status.style.color = ok ? 'var(--accent-green)' : 'var(--accent-red)';
                };
                // Per ara · auto-assume el handle de l'operador actual (`@alvaro`)
                // En sprint futur: verify partyId correspon a un member del operador
                let toHandle = '@alvaro';
                try {
                    const { KB } = await import('../core/kb.js');
                    const kbNodes = await KB.getAllNodes();
                    const me = resolveCurrentMember(kbNodes, '@alvaro');
                    if (me?.content?.handle) toHandle = me.content.handle;
                } catch (_) {}
                if (!confirm(`Retirar ${claimable.toFixed(2)}€ del pool al teu wallet personal (${toHandle})?\n\nParty: ${partyId}\nShare: ${(share*100).toFixed(2)}%\n\nDescompta del wallet del projecte · es topupea al teu wallet personal.`)) return;
                btn.disabled = true; btn.textContent = '⏳';
                try {
                    const res = await withdrawClaim({
                        projectId: this.projectId,
                        partyId, partyShare: share,
                        toHandle, amountEur: claimable,
                        note: 'manual claim from /value-accounting',
                    });
                    setStatus(`✓ Retirats ${res.amountEur.toFixed(2)}€ · refs ${res.ref.slice(0,32)}…`, true);
                    setTimeout(() => this._renderDistributionPanel(), 500);
                } catch (err) {
                    setStatus('✗ ' + (err?.message || 'error desconegut'), false);
                    btn.disabled = false; btn.textContent = '💸 Retirar';
                }
            });
        });
    }

    _bindImportWos() {
        const btn = document.getElementById('vaBtnImportWos');
        const preview = document.getElementById('vaImportPreview');
        if (!btn) return;
        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.textContent = '⏳ Escanejant…';
            try {
                const wos = await KB.query({ type: 'work_order', projectId: this.projectId });
                const result = importWosToContributions({ wos: wos || [], projectId: this.projectId });
                const stats = importStats(result);
                if (result.contributions.length === 0) {
                    if (preview) preview.innerHTML = `
                        <div style="background:rgba(252,165,165,0.06);border:1px solid rgba(252,165,165,0.3);border-radius:6px;padding:12px;color:var(--accent-red);font-size:0.88rem;">
                            Cap WO contributable trobat. Revisa que els WOs estiguin <code>status='ledgered'</code> + <code>actualHours > 0</code> + tinguin party assignat (assignedToSeatId o assignee.id ≠ pending).
                            ${stats.skippedCount > 0 ? '<br>· ' + stats.skippedCount + ' WOs descartats per: ' + Object.entries(stats.skippedReasons).map(([k,v])=>k+'×'+v).join(' · ') : ''}
                        </div>
                    `;
                    btn.disabled = false;
                    btn.textContent = '🔄 Escanejar WOs i importar';
                    return;
                }
                // Confirmación
                if (!confirm(`Importar ${stats.importedCount} WOs com a aportacions?\n\n· ${stats.partiesCount} membres distints\n· ${stats.totalEur.toFixed(2)} € valor total\n· ${stats.totalSlices.toLocaleString('ca-ES')} slices\n\n${stats.skippedCount > 0 ? stats.skippedCount + ' WOs descartats.' : ''}`)) {
                    btn.disabled = false;
                    btn.textContent = '🔄 Escanejar WOs i importar';
                    return;
                }
                // Persistir contributions
                for (const contrib of result.contributions) {
                    const node = buildValueContributionNode({ projectId: this.projectId, contribution: contrib });
                    await KB.upsert(node);
                }
                // Actualitzar partyTypeMap fusionant inferred amb el actual
                const newMap = { ...result.partyTypeMapInferred, ...this.partyTypeMap };   // existent prevaleix
                await KB.upsert({
                    id:   this.projectId + '::value-party-map',
                    type: 'value_party_map',
                    projectId: this.projectId,
                    content: { kind: 'party-map', map: newMap },
                    keywords: ['type:value_party_map', 'project:' + this.projectId],
                });
                if (preview) preview.innerHTML = `
                    <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.4);border-radius:6px;padding:12px;color:#4ade80;font-size:0.88rem;">
                        ✓ ${stats.importedCount} aportacions importades · ${stats.partiesCount} membres · ${stats.totalEur.toFixed(2)} €
                    </div>
                `;
                setTimeout(() => {
                    if (window.navigateTo) window.navigateTo(window.location.pathname + window.location.search);
                }, 1200);
            } catch (err) {
                console.error('[VAL-001 C] importWos failed:', err);
                if (preview) preview.innerHTML = `<div style="color:var(--accent-red);font-size:0.88rem;">✘ Error: ${escapeHtml(err?.message || String(err))}</div>`;
                btn.disabled = false;
                btn.textContent = '🔄 Escanejar WOs i importar';
            }
        });
    }

    _renderPieChart() {
        const el = document.getElementById('vaPieChart');
        if (!el) return;
        if (typeof window.d3 === 'undefined') {
            el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">D3 no carregat encara · ves a /map per a forçar la càrrega.</p>';
            return;
        }
        const d3 = window.d3;
        el.innerHTML = '';

        const parties = this.projectPie.parties || [];
        const piesEmpty = this.projectPie.piesEmpty || [];
        const targets = this.projectPie.pieTargets || {};

        // Datos · cada party + un sector "unallocated" por cada pie vacío
        const data = parties.map(p => ({
            label:    p.partyId,
            value:    p.sharePctInProject,
            color:    PIE_COLORS[p.pieType] || '#888',
            pieType:  p.pieType,
            isEmpty:  false,
        }));
        for (const pieType of piesEmpty) {
            const pct = targets[pieType] || 0;
            if (pct > 0) {
                data.push({
                    label:    pieType + ' (sense assignar)',
                    value:    pct,
                    color:    PIE_COLORS[pieType] || '#444',
                    pieType,
                    isEmpty:  true,
                });
            }
        }
        // Si no llega a 100, añadir un sector "unallocated" gris
        const sumValue = data.reduce((acc, d) => acc + d.value, 0);
        if (sumValue < 99.5) {
            data.push({
                label: '(sense assignar)',
                value: 100 - sumValue,
                color: '#2a2a32',
                isEmpty: true,
            });
        }

        if (data.length === 0 || sumValue === 0) {
            el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:2rem;">Encara no hi ha aportacions · afegeix la primera per veure la tarta.</p>';
            return;
        }

        const width = el.clientWidth || 480;
        const height = 320;
        const radius = Math.min(width, height) / 2 - 20;

        const svg = d3.select(el).append('svg')
            .attr('viewBox', `${-width/2} ${-height/2} ${width} ${height}`)
            .style('overflow', 'visible');

        const pie = d3.pie().value(d => d.value).sort(null);
        const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius);

        const arcs = svg.selectAll('path')
            .data(pie(data))
            .enter().append('path')
            .attr('d', arc)
            .attr('fill', d => d.data.color)
            .attr('stroke', '#050507')
            .attr('stroke-width', 2)
            .style('opacity', d => d.data.isEmpty ? 0.4 : 1)
            .style('cursor', 'pointer');

        arcs.append('title').text(d => `${d.data.label} · ${d.data.value.toFixed(2)}%`);

        // Center text
        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.2em')
            .style('font-family', "'Instrument Serif', Georgia, serif")
            .style('font-style', 'italic')
            .style('font-size', '2.2rem')
            .style('fill', '#fff')
            .text('100%');
        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '1.3em')
            .style('font-family', 'monospace')
            .style('font-size', '0.7rem')
            .style('fill', '#888')
            .text('TARTA DEL PROJECTE');
    }

    _renderLegend() {
        const el = document.getElementById('vaLegend');
        if (!el) return;
        const parties = this.projectPie.parties || [];
        if (parties.length === 0) { el.innerHTML = ''; return; }
        el.innerHTML = parties.map(p => `
            <div class="va-legend-item">
                <span class="va-legend-dot" style="background:${PIE_COLORS[p.pieType] || '#888'};"></span>
                <span class="va-legend-name">${escapeHtml(p.partyId)} <span style="color:var(--text-muted);font-size:0.78rem;">· ${escapeHtml(p.pieType)}</span></span>
                <span class="va-legend-pct">${p.sharePctInProject}%</span>
            </div>
        `).join('');
    }

    _renderPiesList() {
        const el = document.getElementById('vaPiesList');
        if (!el) return;
        const targets = this.pieTargets;
        const piesActive = this.projectPie.piesActive || [];
        const parties = this.projectPie.parties || [];

        const usedByPie = {};
        for (const p of parties) {
            usedByPie[p.pieType] = (usedByPie[p.pieType] || 0) + p.sharePctInProject;
        }

        el.innerHTML = Object.entries(targets).map(([pieType, target]) => {
            const used = usedByPie[pieType] || 0;
            const isActive = piesActive.includes(pieType);
            const color = PIE_COLORS[pieType] || '#888';
            const pct = target > 0 ? Math.min(100, (used / target) * 100) : 0;
            return `
                <div class="va-pie-row ${isActive ? '' : 'is-empty'}">
                    <span class="va-pie-dot" style="background:${color};"></span>
                    <div>
                        <div class="va-pie-name" style="color:${color};">${pieType}</div>
                        <div class="va-pie-bar"><div class="va-pie-bar-fill" style="width:${pct}%;background:${color};"></div></div>
                    </div>
                    <span class="va-pie-target">${target}%</span>
                    <span class="va-pie-status ${isActive ? 'is-active' : 'is-empty'}">${isActive ? '✓ actiu · ' + used.toFixed(1) + '% del projecte' : '— buit'}</span>
                </div>
            `;
        }).join('');

        // Editor de targets (oculto inicialmente)
        el.insertAdjacentHTML('afterend', this._renderTargetsEditor());
    }

    _renderTargetsEditor() {
        const targets = this.pieTargets;
        const sliders = FAIRSHARES_PIE_TYPES.map(pieType => {
            const v = targets[pieType] || 0;
            const color = PIE_COLORS[pieType];
            return `
                <div class="va-target-slider">
                    <span style="color:${color};font-weight:600;text-transform:capitalize;">${pieType}</span>
                    <input type="range" min="0" max="100" step="5" value="${v}" data-pie="${pieType}" id="vaTargetRange-${pieType}">
                    <input type="number" min="0" max="100" step="5" value="${v}" data-pie="${pieType}" id="vaTargetNum-${pieType}">
                </div>
            `;
        }).join('');
        return `
            <div class="va-edit-targets" id="vaTargetsEditor">
                <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:12px;">Ajusta el % de cada pie · la suma ha de ser <strong>100</strong>.</p>
                ${sliders}
                <div class="va-target-sum" id="vaTargetSum"><span>Total</span><span id="vaTargetSumValue">100%</span></div>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button class="va-btn-secondary" id="vaCancelTargets">Cancel·lar</button>
                    <button class="va-btn" id="vaSaveTargets" disabled>💾 Guardar targets</button>
                </div>
            </div>
        `;
    }

    _bindEditTargets() {
        const editor = document.getElementById('vaTargetsEditor');
        const editBtn = document.getElementById('vaEditTargets');
        if (!editor || !editBtn) return;

        editBtn.addEventListener('click', () => {
            editor.classList.toggle('is-open');
            this._updateTargetSum();
        });

        document.getElementById('vaCancelTargets')?.addEventListener('click', () => {
            editor.classList.remove('is-open');
        });

        FAIRSHARES_PIE_TYPES.forEach(pieType => {
            const range = document.getElementById('vaTargetRange-' + pieType);
            const num = document.getElementById('vaTargetNum-' + pieType);
            const sync = (val) => {
                if (range) range.value = val;
                if (num) num.value = val;
                this._updateTargetSum();
            };
            range?.addEventListener('input', (e) => sync(e.target.value));
            num?.addEventListener('input', (e) => sync(e.target.value));
        });

        document.getElementById('vaSaveTargets')?.addEventListener('click', () => this._saveTargets());
    }

    _readEditedTargets() {
        const targets = {};
        FAIRSHARES_PIE_TYPES.forEach(pieType => {
            const num = document.getElementById('vaTargetNum-' + pieType);
            const v = num ? parseFloat(num.value) : 0;
            if (v > 0) targets[pieType] = v;
        });
        return targets;
    }

    _updateTargetSum() {
        const targets = this._readEditedTargets();
        const sum = Object.values(targets).reduce((a, b) => a + b, 0);
        const sumEl = document.getElementById('vaTargetSum');
        const sumValueEl = document.getElementById('vaTargetSumValue');
        const saveBtn = document.getElementById('vaSaveTargets');
        if (sumValueEl) sumValueEl.textContent = sum + '%';
        const valid = Math.abs(sum - 100) <= 0.5 && validatePieTargets(targets);
        if (sumEl) {
            sumEl.classList.toggle('is-valid', valid);
            sumEl.classList.toggle('is-invalid', !valid);
        }
        if (saveBtn) saveBtn.disabled = !valid;
    }

    async _saveTargets() {
        const targets = this._readEditedTargets();
        if (!validatePieTargets(targets)) {
            alert('Targets invàlids · suma ha de ser 100.');
            return;
        }
        try {
            await KB.upsert({
                id:   this.projectId + '::value-pie-targets',
                type: 'value_pie_targets',
                projectId: this.projectId,
                content: { kind: 'pie-targets', targets },
                keywords: ['type:value_pie_targets', 'project:' + this.projectId],
            });
            if (window.navigateTo) window.navigateTo(window.location.pathname + window.location.search);
        } catch (err) {
            console.error('[VAL-001 B] saveTargets falló:', err);
            alert('Error guardant: ' + (err?.message || err));
        }
    }

    _bindForm() {
        const form = document.getElementById('vaContribForm');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const partyId = document.getElementById('vaPartyId')?.value?.trim();
            const partyPie = document.getElementById('vaPartyPie')?.value;
            const type = document.getElementById('vaContribType')?.value;
            const fairValueEur = parseFloat(document.getElementById('vaFairValue')?.value || '0');
            if (!partyId || !partyPie || !type || !fairValueEur) {
                alert('Tots els camps són obligatoris.');
                return;
            }
            try {
                // 1) Update partyTypeMap (KB)
                const newMap = { ...this.partyTypeMap, [partyId]: partyPie };
                await KB.upsert({
                    id:   this.projectId + '::value-party-map',
                    type: 'value_party_map',
                    projectId: this.projectId,
                    content: { kind: 'party-map', map: newMap },
                    keywords: ['type:value_party_map', 'project:' + this.projectId],
                });
                // 2) Build + save contribution
                const contrib = buildContribution({ partyId, type, fairValueEur });
                const node = buildValueContributionNode({ projectId: this.projectId, contribution: contrib });
                await KB.upsert(node);
                // 3) Reload vista
                if (window.navigateTo) window.navigateTo(window.location.pathname + window.location.search);
            } catch (err) {
                console.error('[VAL-001 B] addContribution falló:', err);
                alert('Error: ' + (err?.message || err));
            }
        });
    }

    destroy() { /* nothing */ }
}
