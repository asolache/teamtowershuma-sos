// =============================================================================
// TEAMTOWERS SOS V11 — PROJECTS VIEW (PROJECTS-LIST-001)
// Ruta · /js/views/ProjectsView.js  →  /projects
//
// Vista llistat de TOTS els projectes locals · filtres bàsics (sector ·
// status · search) · CTA · crear · obrir hub. Resol "no hi ha vista per
// veure tots els projectes" reportat per l'usuari.
//
// Substitueix el legacy enllaç "/dashboard" del DashboardV2 "Veure tots"
// que era un redirect a /home (cicle).
// =============================================================================

import { store } from '../core/store.js';

const TPL_VERSION = 'projects-v1.0';

export default class ProjectsView {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Projectes · SOS';
        this._filter = { search: '', sector: null, status: 'all' };
        try {
            if (typeof window !== 'undefined' && window.location) {
                const p = new URLSearchParams(window.location.search);
                this._filter.search = p.get('q') || '';
                this._filter.sector = p.get('sector') || null;
                this._filter.status = p.get('status') || 'all';
            }
        } catch (_) {}
    }

    async getHtml() {
        await store.init();
        const state = store.getState();
        const all = (state.projects || []).filter(p => p && p.id);
        const filtered = this._applyFilter(all);
        return this._renderShell({ all, filtered });
    }

    async afterRender() {
        const search = document.getElementById('projSearch');
        if (search) search.addEventListener('input', (e) => {
            this._filter.search = e.target.value.toLowerCase();
            this._refresh();
        });
        document.querySelectorAll('[data-filter-status]').forEach(b =>
            b.addEventListener('click', () => {
                this._filter.status = b.dataset.filterStatus;
                this._refresh();
            }));
        // v132a · archive / unarchive · NO trenca contabilitat (ledger immutable)
        this._bindArchiveActions();
    }

    _bindArchiveActions() {
        document.querySelectorAll('[data-archive]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault(); e.stopPropagation();
                const pid = btn.getAttribute('data-archive');
                if (!confirm('Arxivar aquest projecte?\n\nEl projecte deixarà d\'aparèixer a les llistes i cerques. La comptabilitat de valor (ledger · tarta · receipts) es preserva intacta · sempre podràs desarxivar.')) return;
                const { store } = await import('../core/store.js');
                await store.dispatch({ type: 'ARCHIVE_PROJECT', payload: { projectId: pid } });
                this._refresh();
            });
        });
        document.querySelectorAll('[data-unarchive]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault(); e.stopPropagation();
                const pid = btn.getAttribute('data-unarchive');
                const { store } = await import('../core/store.js');
                await store.dispatch({ type: 'UNARCHIVE_PROJECT', payload: { projectId: pid } });
                this._refresh();
            });
        });
    }

    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    async _refresh() {
        const list = document.getElementById('projList');
        const count = document.getElementById('projCount');
        if (!list) return;
        const state = store.getState();
        const all = (state.projects || []).filter(p => p && p.id);
        const filtered = this._applyFilter(all);
        if (count) count.textContent = filtered.length + ' / ' + all.length;
        list.innerHTML = filtered.length === 0
            ? `<div class="proj-empty">Cap projecte amb aquests filtres.</div>`
            : filtered.map(p => this._renderCard(p)).join('');
        // v132a · rebind archive actions post-render
        this._bindArchiveActions();
    }

    _applyFilter(projects) {
        const f = this._filter;
        return projects.filter(p => {
            if (f.status === 'active'   && p.isArchived) return false;
            if (f.status === 'archived' && !p.isArchived) return false;
            if (f.status === 'demo'     && !this._isDemo(p)) return false;
            if (f.sector && p.sector_id !== f.sector) return false;
            if (f.search) {
                const hay = ((p.nombre || '') + ' ' + (p.name || '') + ' ' + (p.description || '')).toLowerCase();
                if (!hay.includes(f.search)) return false;
            }
            return true;
        }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    _isDemo(p) {
        return (p.tags || []).some(t => t === 'castellers-seed' || t === 'demo' || t === 'max-bootstrap');
    }

    _renderShell({ all, filtered }) {
        const sectors = [...new Set(all.map(p => p.sector_id).filter(Boolean))];
        return `
        <style>
            .proj-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); padding-bottom:2rem; }
            .proj-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); position:sticky; top:0; z-index:10; }
            .proj-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .proj-logo span { color:var(--accent-indigo); }
            .proj-main { max-width:1100px; margin:0 auto; padding:1.2rem 1rem; display:flex; flex-direction:column; gap:0.85rem; }
            .proj-hero { background:linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.06)); border:1px solid rgba(99,102,241,0.25); border-radius:10px; padding:1rem 1.2rem; }
            .proj-hero h1 { margin:0 0 4px 0; font-size:1.3rem; }
            .proj-hero p { margin:0; font-size:0.85rem; color:var(--text-secondary); }
            .proj-filters { display:flex; gap:8px; flex-wrap:wrap; align-items:center; padding:0.7rem 0.85rem; background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; }
            .proj-search { flex:1; min-width:200px; padding:6px 10px; background:var(--bg-dark); color:var(--text-main); border:1px solid var(--border-default); border-radius:6px; font-family:var(--font-base); font-size:0.85rem; }
            .proj-search:focus { outline:2px solid var(--accent-indigo); outline-offset:1px; }
            .proj-fbtn { padding:5px 12px; border-radius:999px; border:1px solid var(--border-default); background:transparent; color:var(--text-secondary); cursor:pointer; font-size:0.78rem; font-weight:600; }
            .proj-fbtn.active { background:linear-gradient(135deg,#a855f7,#6366f1); color:#fff; border-color:transparent; }
            .proj-fbtn:hover { color:var(--text-main); }
            .proj-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:0.7rem; }
            .proj-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:0.85rem 1rem; text-decoration:none; color:var(--text-main); transition:all 0.15s; display:flex; flex-direction:column; gap:6px; }
            .proj-card:hover { border-color:var(--accent-indigo); transform:translateY(-2px); }
            .proj-name { font-weight:700; font-size:0.95rem; line-height:1.3; }
            .proj-meta { font-size:0.7rem; color:var(--text-secondary); display:flex; gap:5px; flex-wrap:wrap; }
            .proj-pill { padding:1px 7px; border-radius:999px; font-size:0.62rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; background:rgba(148,163,184,0.15); }
            .proj-pill.active { background:rgba(34,197,94,0.18); color:#22c55e; }
            .proj-pill.demo { background:rgba(250,204,21,0.18); color:#facc15; }
            .proj-pill.arch { background:rgba(148,163,184,0.18); color:#94a3b8; }
            /* v132a · archive/unarchive actions */
            .proj-card-wrap { position:relative; }
            .proj-card-archived { opacity:0.65; }
            .proj-card-actions { position:absolute; top:8px; right:8px; display:flex; gap:4px; opacity:0; transition:opacity 0.15s; }
            .proj-card-wrap:hover .proj-card-actions, .proj-card-actions:focus-within { opacity:1; }
            .proj-action-btn { background:var(--bg-elevated); color:var(--text-secondary); border:1px solid var(--border-default); padding:3px 8px; border-radius:4px; font-size:0.7rem; cursor:pointer; font-family:var(--font-base); transition:all 0.12s; }
            .proj-action-btn:hover { color:var(--text-main); border-color:var(--accent-indigo); }
            .proj-action-archive:hover { background:rgba(148,163,184,0.18); }
            .proj-action-unarchive:hover { background:rgba(34,197,94,0.15); color:#22c55e; }
            .proj-desc { font-size:0.78rem; color:var(--text-muted); line-height:1.4; }
            .proj-empty { padding:2rem; text-align:center; color:var(--text-secondary); background:var(--bg-panel); border:1px dashed var(--border-default); border-radius:8px; font-style:italic; }
        </style>

        <div class="proj-shell">
            <div class="proj-topbar">
                <a href="/home" data-link class="proj-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Projectes</span>
                <span style="flex:1;"></span>
                <a href="/create" data-link style="padding:6px 14px;background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:700;">+ Crear</a>
            </div>

            <div class="proj-main">
                <div class="proj-hero">
                    <h1>📁 Tots els teus projectes · <span id="projCount">${filtered.length} / ${all.length}</span></h1>
                    <p>Llistat complet · cerca · filtra · clica per obrir el hub del projecte.</p>
                </div>

                <div class="proj-filters">
                    <input id="projSearch" class="proj-search" type="search" placeholder="🔍 Cerca per nom o descripció..." value="${this._esc(this._filter.search || '')}" autocomplete="off">
                    <button class="proj-fbtn ${this._filter.status === 'all' ? 'active' : ''}" data-filter-status="all">Tots</button>
                    <button class="proj-fbtn ${this._filter.status === 'active' ? 'active' : ''}" data-filter-status="active">Actius</button>
                    <button class="proj-fbtn ${this._filter.status === 'demo' ? 'active' : ''}" data-filter-status="demo">Demo</button>
                    <button class="proj-fbtn ${this._filter.status === 'archived' ? 'active' : ''}" data-filter-status="archived">Arxivats</button>
                </div>

                <div id="projList">
                    ${filtered.length === 0
                        ? `<div class="proj-empty">Cap projecte ${all.length === 0 ? 'encara · clica <strong>+ Crear</strong>' : 'amb aquests filtres'}.</div>`
                        : `<div class="proj-grid">${filtered.map(p => this._renderCard(p)).join('')}</div>`}
                </div>
            </div>
        </div>`;
    }

    _renderCard(p) {
        const name = p.nombre || p.name || p.id;
        const isDemo = this._isDemo(p);
        const isArch = !!p.isArchived;
        const sector = p.sector_id || null;
        const desc = (p.description || p.purpose || '').slice(0, 100);
        // v132a · accions arxivar / desarxivar · NO trenca ledger (immutable)
        const archAction = isArch
            ? `<button type="button" class="proj-action-btn proj-action-unarchive" data-unarchive="${this._esc(p.id)}" title="Desarxivar · torna a aparèixer a les llistes">↺ Desarxivar</button>`
            : (isDemo ? '' : `<button type="button" class="proj-action-btn proj-action-archive" data-archive="${this._esc(p.id)}" title="Arxivar · amaga de llistes · contabilitat intacta">📦 Arxivar</button>`);
        return `
        <div class="proj-card-wrap">
            <a href="/hub/${encodeURIComponent(p.id)}" data-link class="proj-card${isArch ? ' proj-card-archived' : ''}">
                <div class="proj-name">${this._esc(name)}</div>
                <div class="proj-meta">
                    <span class="proj-pill ${isArch ? 'arch' : isDemo ? 'demo' : 'active'}">${isArch ? 'arxivat' : isDemo ? 'demo' : 'actiu'}</span>
                    ${sector ? `<span class="proj-pill">${this._esc(sector)}</span>` : ''}
                </div>
                ${desc ? `<div class="proj-desc">${this._esc(desc)}${desc.length >= 100 ? '…' : ''}</div>` : ''}
            </a>
            ${archAction ? `<div class="proj-card-actions">${archAction}</div>` : ''}
        </div>`;
    }

    _esc(s) {
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    destroy() {}
}

export { TPL_VERSION };
