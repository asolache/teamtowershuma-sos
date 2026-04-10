// =============================================================================
// TEAMTOWERS SOS V11 — DASHBOARD VIEW
// Ruta: /js/views/DashboardView.js
//
// Hub central: lista de proyectos agrupados por sector, crear nuevo proyecto,
// panel de knowledge base inline.
//
// BACKLOG: vista intermedia de detalle de proyecto antes de abrir el mapa.
// =============================================================================

import { store }           from '../core/store.js';
import { KB }              from '../core/kb.js';
import { KnowledgeLoader } from '../core/KnowledgeLoader.js';
import { t, langSelectorHtml } from '../i18n.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid() { return 'proj-' + Math.random().toString(36).slice(2, 9); }

function formatDate(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function healthColor(score) {
    if (score >= 75) return '#00e676';
    if (score >= 50) return '#ff9100';
    return '#ff5252';
}

// Calcula health score agregado de un proyecto (promedio de roles)
function projectHealth(proj) {
    const roles = proj.vna_roles        || [];
    const txs   = proj.vna_transactions || [];
    if (roles.length === 0) return null;

    let total = 0;
    roles.forEach(function(r) {
        let s = 0;
        const txIn  = txs.filter(function(t) { return t.to   === r.id; });
        const txOut = txs.filter(function(t) { return t.from === r.id; });
        if (txIn.length  > 0) s += 25;
        if (txOut.length > 0) s += 25;
        const all = txIn.concat(txOut);
        if (all.some(function(t) { return t.type === 'intangible'; })) s += 25;
        const neighbors = new Set(txOut.map(function(t) { return t.to; }).concat(txIn.map(function(t) { return t.from; })));
        for (const nb of neighbors) {
            if (txOut.some(function(t) { return t.to === nb; }) && txIn.some(function(t) { return t.from === nb; })) { s += 25; break; }
        }
        total += Math.min(s, 100);
    });
    return Math.round(total / roles.length);
}

// =============================================================================
export default class DashboardView {

    constructor() {
        document.title = 'Dashboard · SOS V11';
        this._kbOpen   = false;
        this._kbSector = null;
    }

    async getHtml() {
        await store.init();
        const sectors = await KnowledgeLoader.listSectors();
        const sectorOptions = sectors.map(function(s) {
            return '<option value="' + s.id + '">' + s.id + ' · ' + s.name + '</option>';
        }).join('');

        return `
        <style>
            .dash-shell {
                min-height: 100dvh;
                background: var(--bg-dark);
                font-family: var(--font-base);
                display: flex;
                flex-direction: column;
            }

            /* ── Topbar ── */
            .dash-topbar {
                display: flex; align-items: center; gap: 12px;
                padding: 0 20px; height: 52px;
                border-bottom: 1px solid var(--glass-border);
                background: rgba(10,10,15,0.97);
                position: sticky; top: 0; z-index: 20; flex-shrink: 0;
            }
            .dash-logo {
                font-size: var(--text-sm); font-weight: 900; color: white;
                display: flex; align-items: center; gap: 6px; text-decoration: none;
            }
            .dash-logo span { color: var(--accent-indigo); }
            .dash-topbar-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }
            .dash-btn {
                background: transparent; border: 1px solid var(--glass-border);
                color: var(--text-secondary); padding: 5px 14px;
                border-radius: var(--radius-sm); font-size: var(--text-xs);
                font-weight: 700; cursor: pointer; transition: all var(--duration-fast);
                font-family: var(--font-base);
            }
            .dash-btn:hover { border-color: var(--accent-indigo); color: white; }
            .dash-btn-primary {
                background: var(--accent-indigo); border-color: var(--accent-indigo); color: white;
            }
            .dash-btn-primary:hover { filter: brightness(1.12); }
            .dash-btn-kb {
                border-color: rgba(212,168,83,0.4); color: var(--accent-gold);
            }
            .dash-btn-kb:hover { background: rgba(212,168,83,0.08); }

            /* ── Main layout ── */
            .dash-main {
                flex: 1; display: grid;
                grid-template-columns: 1fr;
                gap: 0;
            }
            .dash-main.kb-open { grid-template-columns: 1fr 360px; }

            /* ── Content area ── */
            .dash-content {
                padding: 28px 32px;
                overflow-y: auto;
            }

            .dash-hero {
                margin-bottom: 32px;
                animation: fadeIn 0.5s var(--ease-out);
            }
            .dash-hero h1 {
                font-size: var(--text-2xl); font-weight: 900;
                color: white; letter-spacing: -0.5px; margin-bottom: 4px;
            }
            .dash-hero h1 span { color: var(--accent-indigo); }
            .dash-hero-sub { font-size: var(--text-sm); color: var(--text-muted); font-family: var(--font-mono); }

            /* ── Stats bar ── */
            .dash-stats {
                display: flex; gap: 16px; margin-bottom: 32px; flex-wrap: wrap;
            }
            .dash-stat {
                background: rgba(25,25,32,0.7); border: 1px solid var(--glass-border);
                border-radius: var(--radius-md); padding: 12px 18px;
                min-width: 120px;
            }
            .dash-stat-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; font-family: var(--font-mono); margin-bottom: 4px; }
            .dash-stat-value { font-size: var(--text-xl); font-weight: 900; color: white; font-family: var(--font-mono); }

            /* ── Sector group ── */
            .dash-sector-group { margin-bottom: 32px; animation: slideUp 0.4s var(--ease-out); }
            .dash-sector-label {
                font-size: 10px; font-weight: 700; color: var(--text-muted);
                text-transform: uppercase; letter-spacing: 0.12em; font-family: var(--font-mono);
                margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
            }
            .dash-sector-label::after { content: ''; flex: 1; height: 1px; background: var(--glass-border); }

            /* ── Project cards grid ── */
            .dash-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }

            .dash-card {
                background: linear-gradient(145deg, rgba(25,25,32,0.9), rgba(10,10,15,0.95));
                border: 1px solid var(--glass-border); border-radius: var(--radius-xl);
                padding: 18px 20px; cursor: pointer; text-decoration: none; color: inherit;
                transition: all var(--duration-base) var(--ease-out);
                display: flex; flex-direction: column; gap: 10px;
                position: relative; overflow: hidden;
            }
            .dash-card:hover {
                border-color: var(--accent-indigo);
                transform: translateY(-2px);
                box-shadow: var(--shadow-indigo);
            }
            .dash-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
            .dash-card-name { font-size: var(--text-sm); font-weight: 900; color: white; line-height: 1.3; }
            .dash-card-sector-badge {
                font-size: 9px; font-family: var(--font-mono); padding: 2px 7px;
                border-radius: 3px; background: rgba(99,102,241,0.15);
                color: var(--accent-indigo); flex-shrink: 0; font-weight: 700;
            }
            .dash-card-meta {
                font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);
                display: flex; gap: 10px; flex-wrap: wrap;
            }
            .dash-card-meta span { display: flex; align-items: center; gap: 3px; }
            .dash-card-footer {
                display: flex; align-items: center; justify-content: space-between;
                padding-top: 8px; border-top: 1px solid var(--glass-border);
            }
            .dash-card-date { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
            .dash-card-health {
                font-size: 10px; font-weight: 700; font-family: var(--font-mono);
                padding: 2px 7px; border-radius: 3px;
            }
            .dash-card-actions {
                position: absolute; top: 10px; right: 10px;
                display: none; gap: 4px;
            }
            .dash-card:hover .dash-card-actions { display: flex; }
            .dash-card-action-btn {
                background: rgba(10,10,15,0.9); border: 1px solid var(--glass-border);
                color: var(--text-muted); font-size: 10px; padding: 3px 8px;
                border-radius: var(--radius-sm); cursor: pointer; transition: all var(--duration-fast);
                font-family: var(--font-base); font-weight: 700;
            }
            .dash-card-action-btn:hover { color: var(--accent-red); border-color: rgba(255,82,82,0.4); }

            /* ── New project card ── */
            .dash-card-new {
                border: 1px dashed rgba(99,102,241,0.25); border-radius: var(--radius-xl);
                padding: 18px 20px; cursor: pointer; color: var(--text-muted);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                gap: 8px; min-height: 120px; transition: all var(--duration-base) var(--ease-out);
            }
            .dash-card-new:hover { border-color: var(--accent-indigo); color: var(--accent-indigo); background: rgba(99,102,241,0.04); }
            .dash-card-new-icon { font-size: 1.8rem; }
            .dash-card-new-label { font-size: var(--text-xs); font-weight: 700; }

            /* ── Empty state ── */
            .dash-empty {
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                min-height: 320px; gap: 12px; opacity: 0.5;
            }
            .dash-empty-icon { font-size: 3rem; }
            .dash-empty-text { font-size: var(--text-sm); color: var(--text-muted); font-family: var(--font-mono); text-align: center; }

            /* ── Knowledge panel ── */
            .dash-kb-panel {
                border-left: 1px solid var(--glass-border);
                background: rgba(8,8,12,0.98);
                overflow-y: auto;
                display: none;
            }
            .dash-main.kb-open .dash-kb-panel { display: flex; flex-direction: column; }
            .dash-kb-head {
                padding: 14px 16px 10px; border-bottom: 1px solid var(--glass-border);
                display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
            }
            .dash-kb-title { font-size: var(--text-sm); font-weight: 900; color: var(--accent-gold); display: flex; align-items: center; gap: 6px; }
            .dash-kb-close { background: transparent; border: none; color: var(--text-muted); font-size: 1rem; cursor: pointer; padding: 2px 6px; border-radius: var(--radius-sm); }
            .dash-kb-close:hover { color: white; }
            .dash-kb-body { flex: 1; overflow-y: auto; padding: 14px 16px; }
            .dash-kb-sector-item {
                display: flex; align-items: center; justify-content: space-between;
                padding: 8px 10px; border-radius: var(--radius-sm); cursor: pointer;
                transition: background var(--duration-fast); margin-bottom: 4px;
                border: 1px solid transparent;
            }
            .dash-kb-sector-item:hover { background: var(--glass-hover); }
            .dash-kb-sector-item.active { background: rgba(212,168,83,0.08); border-color: rgba(212,168,83,0.2); }
            .dash-kb-sector-name { font-size: var(--text-xs); color: var(--text-secondary); font-weight: 700; }
            .dash-kb-sector-badge {
                font-size: 9px; font-family: var(--font-mono); padding: 2px 6px;
                border-radius: 3px; font-weight: 700;
            }
            .dash-kb-detail { margin-top: 12px; }
            .dash-kb-detail-title { font-size: var(--text-sm); font-weight: 900; color: white; margin-bottom: 8px; }
            .dash-kb-role-item {
                padding: 7px 10px; border-radius: var(--radius-sm);
                background: rgba(25,25,32,0.8); margin-bottom: 5px;
                border-left: 2px solid var(--accent-indigo);
            }
            .dash-kb-role-name { font-size: var(--text-xs); color: white; font-weight: 700; margin-bottom: 2px; }
            .dash-kb-role-desc { font-size: 10px; color: var(--text-muted); line-height: 1.5; }
            .dash-kb-role-level { font-size: 9px; font-family: var(--font-mono); color: var(--accent-indigo); margin-top: 3px; }
            .dash-kb-tx-item {
                padding: 6px 10px; border-radius: var(--radius-sm);
                background: rgba(25,25,32,0.6); margin-bottom: 4px;
                display: flex; gap: 8px; align-items: flex-start;
            }
            .dash-kb-tx-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
            .dash-kb-tx-text { font-size: 10px; color: var(--text-muted); line-height: 1.5; }
            .dash-kb-spinner { text-align: center; padding: 24px; color: var(--text-muted); font-family: var(--font-mono); font-size: var(--text-xs); }

            /* ── Modal nuevo proyecto ── */
            .dash-modal-bg {
                display: none; position: fixed; inset: 0; z-index: 1000;
                background: rgba(0,0,0,0.65); align-items: center; justify-content: center;
            }
            .dash-modal-bg.open { display: flex; }
            .dash-modal {
                background: var(--bg-elevated); border: 1px solid var(--glass-border);
                border-radius: var(--radius-xl); padding: 24px; width: 400px; max-width: 95vw;
                animation: slideUp var(--duration-base) var(--ease-spring);
            }
            .dash-modal h2 { font-size: var(--text-lg); font-weight: 900; margin: 0 0 4px; color: white; }
            .dash-modal-sub { font-size: var(--text-xs); color: var(--text-muted); margin-bottom: 20px; font-family: var(--font-mono); }
            .dash-form-group { margin-bottom: 14px; }
            .dash-form-label { display: block; font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; margin-bottom: 5px; }
            .dash-form-input {
                width: 100%; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border);
                color: white; padding: 10px 12px; border-radius: var(--radius-md);
                font-family: var(--font-base); font-size: var(--text-sm); outline: none;
                transition: border-color var(--duration-fast); box-sizing: border-box;
            }
            .dash-form-input:focus { border-color: var(--accent-indigo); }
            .dash-modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
            .dash-modal-cancel { background: transparent; border: 1px solid var(--glass-border); color: var(--text-muted); padding: 9px 18px; border-radius: var(--radius-md); cursor: pointer; font-weight: 700; font-size: var(--text-sm); font-family: var(--font-base); }
            .dash-modal-cancel:hover { color: white; }
            .dash-modal-confirm { background: var(--accent-indigo); border: none; color: white; padding: 9px 20px; border-radius: var(--radius-md); cursor: pointer; font-weight: 900; font-size: var(--text-sm); font-family: var(--font-base); }
            .dash-modal-confirm:hover { filter: brightness(1.1); }

            @media (max-width: 768px) {
                .dash-content { padding: 16px; }
                .dash-main.kb-open { grid-template-columns: 1fr; }
                .dash-main.kb-open .dash-kb-panel { display: none; }
            }
        </style>

        <div class="dash-shell">

            <!-- TOPBAR -->
            <div class="dash-topbar">
                <a href="/" data-link class="dash-logo">🗼 Team<span>Towers</span> <span style="color:var(--text-muted);font-weight:400;font-size:10px;font-family:var(--font-mono);">SOS V11</span></a>
                <div class="dash-topbar-right">
                    <button class="dash-btn dash-btn-kb" id="dashBtnKB">📚 Knowledge Base</button>
                    <button class="dash-btn dash-btn-primary" id="dashBtnNew">＋ New Project</button>
                    <a href="/settings" data-link class="dash-btn">⚙ Settings</a>
                    <div id="dashLangSelector"></div>
                </div>
            </div>

            <!-- MAIN -->
            <div class="dash-main" id="dashMain">

                <!-- CONTENT -->
                <div class="dash-content" id="dashContent">
                    <div class="dash-hero">
                        <h1>Value <span>Map</span> Dashboard</h1>
                        <div class="dash-hero-sub" id="dashHeroSub">Loading projects…</div>
                    </div>
                    <div class="dash-stats" id="dashStats"></div>
                    <div id="dashProjectList"></div>
                </div>

                <!-- KB PANEL -->
                <div class="dash-kb-panel" id="dashKBPanel">
                    <div class="dash-kb-head">
                        <div class="dash-kb-title">📚 Knowledge Base</div>
                        <button class="dash-kb-close" id="dashKBClose">✕</button>
                    </div>
                    <div class="dash-kb-body" id="dashKBBody">
                        <div class="dash-kb-spinner">Loading sectors…</div>
                    </div>
                </div>

            </div>
        </div>

        <!-- MODAL NUEVO PROYECTO -->
        <div class="dash-modal-bg" id="dashModalNew">
            <div class="dash-modal">
                <h2>New project</h2>
                <div class="dash-modal-sub">Create a new value network map</div>
                <div class="dash-form-group">
                    <label class="dash-form-label">Project name *</label>
                    <input type="text" class="dash-form-input" id="newProjName" placeholder="e.g. ACME Corp · VNA 2025">
                </div>
                <div class="dash-form-group">
                    <label class="dash-form-label">Sector (optional)</label>
                    <select class="dash-form-input" id="newProjSector" style="font-family:var(--font-base);">
                        <option value="">— Select sector —</option>
                        ${sectorOptions}
                    </select>
                </div>
                <div class="dash-modal-actions">
                    <button class="dash-modal-cancel" id="newProjCancel">Cancel</button>
                    <button class="dash-modal-confirm" id="newProjConfirm">Create &amp; open map</button>
                </div>
            </div>
        </div>
        `;
    }

    async afterRender() {
        const sel = document.getElementById('dashLangSelector');
        if (sel) sel.innerHTML = langSelectorHtml();
        await this._renderProjects();
        this._bindTopbar();
        this._bindModal();
        await this._loadKBSectors();
    }

    // ── Render projects ───────────────────────────────────────────────────────
    async _renderProjects() {
        const state    = store.getState();
        const projects = (state.projects || []).filter(function(p) { return !p.isArchived; });

        // Stats
        const totalRoles = projects.reduce(function(acc, p) { return acc + (p.vna_roles || []).length; }, 0);
        const totalTxs   = projects.reduce(function(acc, p) { return acc + (p.vna_transactions || []).length; }, 0);
        document.getElementById('dashStats').innerHTML =
            '<div class="dash-stat"><div class="dash-stat-label">Projects</div><div class="dash-stat-value">' + projects.length + '</div></div>' +
            '<div class="dash-stat"><div class="dash-stat-label">Total roles</div><div class="dash-stat-value">' + totalRoles + '</div></div>' +
            '<div class="dash-stat"><div class="dash-stat-label">Transactions</div><div class="dash-stat-value">' + totalTxs + '</div></div>';

        document.getElementById('dashHeroSub').textContent =
            projects.length === 0
                ? 'No projects yet — create your first value map'
                : projects.length + ' active project' + (projects.length !== 1 ? 's' : '') + ' · ordered by sector';

        if (projects.length === 0) {
            document.getElementById('dashProjectList').innerHTML =
                '<div class="dash-empty">' +
                '<div class="dash-empty-icon">🗺</div>' +
                '<div class="dash-empty-text">No value maps yet.<br>Click "+ New Project" to start.</div>' +
                '</div>';
            return;
        }

        // Agrupar por sector
        const groups = {};
        projects.forEach(function(p) {
            const key = p.sector_id || 'general';
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });

        const sectors = await KnowledgeLoader.listSectors();
        const sectorName = function(id) {
            const found = sectors.find(function(s) { return s.id === id; });
            return found ? found.name : (id === 'general' ? 'General' : id);
        };

        let html = '';
        Object.keys(groups).sort().forEach(function(sectorId) {
            const sProjects = groups[sectorId];
            const label     = sectorName(sectorId);

            html += '<div class="dash-sector-group">' +
                '<div class="dash-sector-label">' + (sectorId !== 'general' ? sectorId + ' · ' : '') + label + '</div>' +
                '<div class="dash-cards">';

            sProjects.forEach(function(p) {
                const roles  = (p.vna_roles        || []).length;
                const txs    = (p.vna_transactions || []).length;
                const score  = projectHealth(p);
                const hColor = score !== null ? healthColor(score) : 'var(--text-muted)';
                const hLabel = score !== null ? score + ' health' : 'empty';

                html += '<a class="dash-card" href="/map?project=' + p.id + '" data-link>' +
                    '<div class="dash-card-top">' +
                        '<div class="dash-card-name">' + (p.nombre || p.name || 'Unnamed') + '</div>' +
                        (sectorId !== 'general' ? '<div class="dash-card-sector-badge">' + sectorId + '</div>' : '') +
                    '</div>' +
                    '<div class="dash-card-meta">' +
                        '<span>⬤ ' + roles + ' roles</span>' +
                        '<span>→ ' + txs + ' transactions</span>' +
                    '</div>' +
                    '<div class="dash-card-footer">' +
                        '<div class="dash-card-date">' + formatDate(p.updatedAt || p.createdAt) + '</div>' +
                        '<div class="dash-card-health" style="background:' + hColor + '18;color:' + hColor + ';">' + hLabel + '</div>' +
                    '</div>' +
                    '<div class="dash-card-actions">' +
                        '<button class="dash-card-action-btn" data-archive="' + p.id + '">Archive</button>' +
                    '</div>' +
                '</a>';
            });

            // Tarjeta "Nuevo proyecto" al final de cada grupo
            html += '<div class="dash-card-new" id="dashNewInGroup">' +
                '<div class="dash-card-new-icon">＋</div>' +
                '<div class="dash-card-new-label">New project</div>' +
                '</div>';

            html += '</div></div>';
        });

        document.getElementById('dashProjectList').innerHTML = html;

        // Bind archive buttons
        document.querySelectorAll('[data-archive]').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                const pid = e.currentTarget.dataset.archive;
                if (confirm('Archive this project?')) {
                    store.dispatch({ type: 'ARCHIVE_PROJECT', payload: { projectId: pid } })
                        .then(function() { window.location.reload(); });
                }
            });
        });

        // Bind "New project" inline card
        document.querySelectorAll('#dashNewInGroup').forEach(function(el) {
            el.addEventListener('click', function() {
                document.getElementById('dashModalNew').classList.add('open');
                document.getElementById('newProjName').focus();
            });
        });
    }

    // ── Topbar ────────────────────────────────────────────────────────────────
    _bindTopbar() {
        document.getElementById('dashBtnNew')?.addEventListener('click', function() {
            document.getElementById('dashModalNew').classList.add('open');
            document.getElementById('newProjName').focus();
        });

        document.getElementById('dashBtnKB')?.addEventListener('click', function() {
            const main = document.getElementById('dashMain');
            main.classList.toggle('kb-open');
        });

        document.getElementById('dashKBClose')?.addEventListener('click', function() {
            document.getElementById('dashMain').classList.remove('kb-open');
        });
    }

    // ── Modal nuevo proyecto ──────────────────────────────────────────────────
    _bindModal() {
        document.getElementById('newProjCancel')?.addEventListener('click', function() {
            document.getElementById('dashModalNew').classList.remove('open');
        });

        document.getElementById('newProjConfirm')?.addEventListener('click', async function() {
            const name     = document.getElementById('newProjName').value.trim();
            const sectorId = document.getElementById('newProjSector').value || null;
            if (!name) { document.getElementById('newProjName').focus(); return; }

            const projectId = uid();
            await store.dispatch({
                type:    'CREATE_PROJECT',
                payload: {
                    id:               projectId,
                    nombre:           name,
                    sector_id:        sectorId,
                    vna_roles:        [],
                    vna_transactions: [],
                    createdAt:        Date.now(),
                    updatedAt:        Date.now(),
                }
            });

            document.getElementById('dashModalNew').classList.remove('open');
            const url = '/map?project=' + projectId + (sectorId ? '&sector=' + sectorId : '');
            window.navigateTo(url);
        }.bind(this));

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') document.getElementById('dashModalNew')?.classList.remove('open');
        });
    }

    // ── Knowledge Base panel ──────────────────────────────────────────────────
    async _loadKBSectors() {
        const sectors = await KnowledgeLoader.listSectors();
        const body    = document.getElementById('dashKBBody');
        if (!body) return;

        // Tier 1 = los que tenemos fichero. Tier 2 = los que KnowledgeLoader infiere.
        const tier1Ids = new Set(['N', 'K', 'Q', 'F', 'R']);

        let html = '<div style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono);margin-bottom:12px;">Click a sector to preview its roles</div>';
        sectors.forEach(function(s) {
            const isTier1 = tier1Ids.has(s.id);
            html += '<div class="dash-kb-sector-item" data-sector="' + s.id + '">' +
                '<div class="dash-kb-sector-name">' + s.id + ' · ' + s.name + '</div>' +
                '<span class="dash-kb-sector-badge" style="background:' +
                    (isTier1 ? 'rgba(0,230,118,0.1);color:var(--accent-green)' : 'rgba(255,145,0,0.1);color:var(--accent-orange)') +
                ';">' + (isTier1 ? 'ready' : 'tier 2') + '</span>' +
            '</div>';
        });
        html += '<div id="dashKBDetail" class="dash-kb-detail"></div>';
        body.innerHTML = html;

        // Bind sector items
        body.querySelectorAll('.dash-kb-sector-item').forEach(function(el) {
            el.addEventListener('click', function() {
                body.querySelectorAll('.dash-kb-sector-item').forEach(function(e) { e.classList.remove('active'); });
                el.classList.add('active');
                this._loadKBSectorDetail(el.dataset.sector);
            }.bind(this));
        }.bind(this));
    }

    async _loadKBSectorDetail(sectorId) {
        const detail = document.getElementById('dashKBDetail');
        if (!detail) return;
        detail.innerHTML = '<div class="dash-kb-spinner">Loading…</div>';

        const seed = await KnowledgeLoader.getSectorSeed(sectorId);
        if (!seed || seed.roles.length === 0) {
            detail.innerHTML = '<div class="dash-kb-spinner" style="color:var(--accent-orange);">Sector not loaded yet — will be generated by AI when needed.</div>';
            return;
        }

        const levelColors = { pinya: '#00b0ff', tronc: '#6366f1', pom_de_dalt: '#e040fb' };
        const levelLabels = { pinya: 'Base', tronc: 'Core', pom_de_dalt: 'Strategic' };

        let html = '<div class="dash-kb-detail-title">' + (seed.sectorName || sectorId) + '</div>';
        html += '<div style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono);margin-bottom:8px;">' + seed.roles.length + ' roles · ' + seed.transactions.length + ' transactions</div>';

        seed.roles.forEach(function(r) {
            const lvlColor = levelColors[r.castell_level] || '#6366f1';
            const lvlLabel = levelLabels[r.castell_level] || r.castell_level;
            html += '<div class="dash-kb-role-item" style="border-left-color:' + lvlColor + ';">' +
                '<div class="dash-kb-role-name">' + (r.name || r.id) + '</div>' +
                (r.description ? '<div class="dash-kb-role-desc">' + r.description.slice(0, 100) + (r.description.length > 100 ? '…' : '') + '</div>' : '') +
                '<div class="dash-kb-role-level">' + lvlLabel + (r.typical_actor ? ' · ' + r.typical_actor : '') + '</div>' +
            '</div>';
        });

        html += '<div style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono);margin:10px 0 6px;">Key transactions</div>';
        seed.transactions.slice(0, 6).forEach(function(t) {
            const color = t.type === 'intangible' ? '#d4a853' : '#00e676';
            html += '<div class="dash-kb-tx-item">' +
                '<div class="dash-kb-tx-dot" style="background:' + color + ';"></div>' +
                '<div class="dash-kb-tx-text">' + (t.deliverable || t.id) + (t.is_must ? ' <span style="color:var(--text-muted);">[MUST]</span>' : '') + '</div>' +
            '</div>';
        });
        if (seed.transactions.length > 6) {
            html += '<div style="font-size:10px;color:var(--text-muted);text-align:center;padding:6px;">+' + (seed.transactions.length - 6) + ' more transactions</div>';
        }

        detail.innerHTML = html;
    }
}
