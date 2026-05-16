// =============================================================================
// TEAMTOWERS SOS V11 — LEARN VIEW · KNOWLEDGE HUB (LEARN-HUB-001)
// Ruta · /js/views/LearnView.js  →  /learn
//
// HUB unificat del knowledge SOS · 3 modes simultanis:
//   1. CARPETAS    · navegació jeràrquica de tot knowledge/
//   2. CERCA       · full-text + filtres (tipus · sector · fase)
//   3. ROADMAPS    · seqüències ordenades de lectura per rol canònic
//
// Resol feedback usuari · "Quiero los contenidos de /knowledge como parte
// de la documentación de SOS en el área Aprende. Todo ordenado como
// carpetas pero también como base de conocimientos con roadmaps de
// lectura por rol."
//
// El glossari EDU previ (UX-EDU-001) queda a git history · els seus
// conceptes han d'integrar-se al knowledge/ com a SOPs/SOCs (futur).
// =============================================================================

import { loadIndex, searchIndex, listByFolder, getRoadmap, listRoles, stats } from '../core/knowledgeIndexService.js';
import { ROADMAPS_BY_ROLE } from '../core/knowledgeRoadmaps.js';

const TPL_VERSION = 'learn-v2-hub';

const FOLDER_META = Object.freeze({
    vision:   { icon: '🧭', label: 'Visió',         desc: 'Documents fundacionals · principis VNA · arquitectura · cadena canònica' },
    socs:     { icon: '🧱', label: 'SOCs',          desc: 'Standard Operating Concepts · què + per què · invariants' },
    sops:     { icon: '📋', label: 'SOPs',          desc: 'Standard Operating Procedures · com s\'executa cada concepte' },
    sectors:  { icon: '🏛',  label: 'Sectors',       desc: 'Plantilles CNAE per sectors · roles + transactions base' },
    roles:    { icon: '🤲', label: 'Roles',         desc: 'Catàlegs de rols · per tipus i nivell' },
    clients:  { icon: '👥', label: 'Clients',        desc: 'Models VNA de clients reals · convenció `clients/{id}/`' },
});

const TYPE_META = Object.freeze({
    vision:  { icon: '🧭', color: '#a8b2ff' },
    soc:     { icon: '🧱', color: '#22c55e' },
    sop:     { icon: '📋', color: '#facc15' },
    sector:  { icon: '🏛', color: '#f472b6' },
    role:    { icon: '🤲', color: '#94a3b8' },
    client:  { icon: '👥', color: '#06b6d4' },
});

export default class LearnView {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Aprèn · SOS Knowledge Hub';
        this._mode = 'roadmaps';     // 'carpetas' | 'search' | 'roadmaps'
        this._activeRole = 'visioner';
        this._search = { query: '', type: '', folder: '', sector: '', phase: '' };
        try {
            if (typeof window !== 'undefined' && window.location) {
                const p = new URLSearchParams(window.location.search);
                const mode = p.get('mode');
                if (['carpetas', 'search', 'roadmaps'].includes(mode)) this._mode = mode;
                const role = p.get('role');
                if (role && ROADMAPS_BY_ROLE[role]) this._activeRole = role;
                if (p.get('q')) { this._mode = 'search'; this._search.query = p.get('q'); }
            }
        } catch (_) {}
    }

    async getHtml() {
        this._index = await loadIndex();
        this._stats = stats(this._index);
        return this._renderShell();
    }

    async afterRender() {
        document.querySelectorAll('[data-mode]').forEach(b =>
            b.addEventListener('click', (e) => this._setMode(e.currentTarget.dataset.mode)));
        document.querySelectorAll('[data-role]').forEach(b =>
            b.addEventListener('click', (e) => this._setRole(e.currentTarget.dataset.role)));
        const search = document.getElementById('lvSearch');
        if (search) search.addEventListener('input', (e) => {
            this._search.query = e.target.value;
            this._refreshSearch();
        });
        document.querySelectorAll('[data-filter]').forEach(el => {
            el.addEventListener('change', (e) => {
                const k = e.target.dataset.filter;
                this._search[k] = e.target.value;
                this._refreshSearch();
            });
        });
    }

    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    _setMode(mode) {
        this._mode = mode;
        this.render();
    }

    _setRole(role) {
        this._activeRole = role;
        this.render();
    }

    _refreshSearch() {
        const results = searchIndex(this._search, this._index);
        const el = document.getElementById('lvResults');
        if (el) el.innerHTML = this._renderResults(results);
        const count = document.getElementById('lvCount');
        if (count) count.textContent = results.length;
    }

    _renderShell() {
        const st = this._stats || { total: 0, byType: {}, byFolder: {}, rolesAvailable: 0 };
        return `
        <style>
            .lv-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); padding-bottom:2rem; }
            .lv-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); position:sticky; top:0; z-index:10; }
            .lv-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .lv-logo span { color:var(--accent-indigo); }
            .lv-main { max-width:1100px; margin:0 auto; padding:1.2rem 1rem; display:flex; flex-direction:column; gap:0.85rem; }

            .lv-hero { background:linear-gradient(135deg,rgba(99,102,241,0.16),rgba(168,85,247,0.08)); border:1px solid rgba(99,102,241,0.30); border-radius:10px; padding:1.2rem 1.4rem; }
            .lv-hero h1 { margin:0 0 4px 0; font-size:1.4rem; }
            .lv-hero p { margin:0; font-size:0.88rem; color:var(--text-secondary); line-height:1.5; }
            .lv-hero-stats { display:flex; gap:1rem; flex-wrap:wrap; margin-top:10px; }
            .lv-stat { padding:4px 10px; border-radius:999px; background:rgba(99,102,241,0.18); color:#a8b2ff; font-size:0.74rem; font-weight:600; }

            .lv-tabs { display:flex; gap:5px; border-bottom:1px solid var(--border-default); padding-bottom:6px; }
            .lv-tab { padding:8px 16px; border-radius:8px 8px 0 0; border:0; background:transparent; color:var(--text-secondary); cursor:pointer; font-size:0.88rem; font-weight:700; }
            .lv-tab:hover { color:var(--text-main); background:var(--glass-hover); }
            .lv-tab.active { color:#fff; background:linear-gradient(135deg,#a855f7,#6366f1); }

            .lv-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:0.9rem 1.1rem; }
            .lv-card h2 { margin:0 0 8px 0; font-size:0.95rem; }

            .lv-folder-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:0.7rem; }
            .lv-folder-card { background:var(--bg-dark); border:1px solid var(--border-default); border-radius:8px; padding:0.85rem 1rem; }
            .lv-folder-card h3 { margin:0 0 4px 0; font-size:0.9rem; }
            .lv-folder-card .desc { font-size:0.72rem; color:var(--text-secondary); margin-bottom:8px; line-height:1.4; }
            .lv-folder-card .count { font-size:0.65rem; color:var(--text-muted); }
            .lv-folder-card ul { list-style:none; padding:0; margin:8px 0 0 0; max-height:180px; overflow-y:auto; }
            .lv-folder-card li { padding:3px 0; font-size:0.75rem; }
            .lv-folder-card li a { color:var(--accent-indigo); text-decoration:none; }
            .lv-folder-card li a:hover { text-decoration:underline; }

            .lv-search-bar { display:flex; gap:6px; align-items:center; flex-wrap:wrap; padding:0.6rem 0.8rem; background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; }
            .lv-search-input { flex:1; min-width:200px; padding:6px 10px; background:var(--bg-dark); color:var(--text-main); border:1px solid var(--border-default); border-radius:6px; font-size:0.85rem; }
            .lv-search-input:focus { outline:2px solid var(--accent-indigo); }
            .lv-search-select { padding:6px 10px; background:var(--bg-dark); color:var(--text-main); border:1px solid var(--border-default); border-radius:6px; font-size:0.78rem; }

            .lv-result { background:var(--bg-panel); border:1px solid var(--border-default); border-left-width:3px; border-radius:6px; padding:8px 12px; margin-bottom:6px; }
            .lv-result-head { display:flex; gap:8px; align-items:center; margin-bottom:3px; flex-wrap:wrap; }
            .lv-result-title { font-weight:700; font-size:0.86rem; flex:1; min-width:0; }
            .lv-result-meta { font-size:0.66rem; color:var(--text-muted); font-family:var(--font-mono); }
            .lv-result-excerpt { font-size:0.76rem; color:var(--text-secondary); line-height:1.4; }

            .lv-role-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:6px; }
            .lv-role-pill { padding:8px 12px; border-radius:8px; border:1px solid var(--border-default); background:var(--bg-dark); cursor:pointer; text-align:left; font-size:0.82rem; color:var(--text-main); font-family:var(--font-base); }
            .lv-role-pill.active { background:linear-gradient(135deg,#a855f7,#6366f1); color:#fff; border-color:transparent; }
            .lv-role-pill:hover { border-color:var(--accent-indigo); }

            .lv-roadmap-step { display:flex; gap:12px; padding:10px 12px; border:1px solid var(--border-default); border-left-width:3px; border-radius:6px; background:var(--bg-panel); margin-bottom:8px; }
            .lv-roadmap-step .num { font-size:1.4rem; font-weight:900; font-family:var(--font-mono); color:var(--accent-indigo); min-width:30px; }
            .lv-roadmap-step .body { flex:1; min-width:0; }
            .lv-roadmap-step .body h4 { margin:0 0 3px 0; font-size:0.92rem; }
            .lv-roadmap-step .body .why { font-size:0.74rem; color:var(--text-secondary); margin:3px 0 6px 0; font-style:italic; }
            .lv-roadmap-step .body a { color:var(--accent-indigo); text-decoration:none; font-size:0.78rem; font-weight:600; }
            .lv-roadmap-step .body a:hover { text-decoration:underline; }
            .lv-roadmap-step.missing { opacity:0.5; }
        </style>

        <div class="lv-shell">
            <div class="lv-topbar">
                <a href="/home" data-link class="lv-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Aprèn · Knowledge Hub</span>
                <span style="flex:1;"></span>
            </div>

            <div class="lv-main">
                <div class="lv-hero">
                    <h1>🎓 Aprèn · tot el coneixement de SOS</h1>
                    <p>Hub unificat amb tots els documents · SOCs · SOPs · sectors · visió · clients. 3 maneres d'explorar · mira carpetas · cerca paraules · o segueix un roadmap segons el teu rol.</p>
                    <div class="lv-hero-stats">
                        <span class="lv-stat">📁 ${st.total} docs</span>
                        ${Object.entries(st.byType || {}).map(([type, c]) => `<span class="lv-stat">${TYPE_META[type]?.icon || '·'} ${c} ${type}</span>`).join('')}
                        <span class="lv-stat">🤲 ${st.rolesAvailable} roadmaps</span>
                    </div>
                </div>

                <div class="lv-tabs" role="tablist">
                    <button class="lv-tab ${this._mode === 'roadmaps' ? 'active' : ''}" data-mode="roadmaps">🤲 Roadmaps per rol</button>
                    <button class="lv-tab ${this._mode === 'carpetas' ? 'active' : ''}" data-mode="carpetas">📁 Carpetas</button>
                    <button class="lv-tab ${this._mode === 'search'   ? 'active' : ''}" data-mode="search">🔍 Cerca</button>
                </div>

                ${this._mode === 'roadmaps' ? this._renderRoadmaps()
                 : this._mode === 'carpetas' ? this._renderCarpetas()
                 : this._renderSearch()}
            </div>
        </div>`;
    }

    _renderRoadmaps() {
        const roles = listRoles();
        const roadmap = getRoadmap(this._activeRole, this._index);
        return `
        <div class="lv-card">
            <h2>🤲 Tria el teu rol</h2>
            <div class="lv-role-grid">
                ${roles.map(r => {
                    const rm = ROADMAPS_BY_ROLE[r];
                    return `<button class="lv-role-pill ${r === this._activeRole ? 'active' : ''}" data-role="${this._esc(r)}">${this._esc(rm.roleName)}</button>`;
                }).join('')}
            </div>
        </div>

        ${roadmap ? `
        <div class="lv-card">
            <h2>${this._esc(roadmap.roleName)} · ${roadmap.foundCount}/${roadmap.totalSteps} lectures disponibles</h2>
            <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:14px;">${this._esc(roadmap.description)}</p>
            ${roadmap.readings.map(r => `
                <div class="lv-roadmap-step ${r.found ? '' : 'missing'}" style="border-left-color:${r.found ? '#22c55e' : '#94a3b8'};">
                    <div class="num">${r.step}</div>
                    <div class="body">
                        <h4>${this._esc(r.title)}</h4>
                        <div class="why">${this._esc(r.why)}</div>
                        ${r.found
                            ? `<a href="/n/${encodeURIComponent(r.item.id)}" data-link>📖 Llegir · ${this._esc(r.item.relpath)} →</a>`
                            : `<span style="font-size:0.7rem;color:var(--text-muted);">⚠ Fitxer no trobat · ${this._esc(r.path)}</span>`}
                    </div>
                </div>
            `).join('')}
            <div style="margin-top:12px;padding:10px 12px;background:rgba(99,102,241,0.08);border-radius:6px;font-size:0.78rem;color:var(--text-secondary);">
                💡 Quan completis aquest roadmap · es marcarà el rol al teu perfil 360 com a <strong>practitioner</strong>. (Tracking automàtic · WO pendent · ara és manual.)
            </div>
        </div>` : `<div class="lv-card"><h2>⚠ Cap roadmap per a ${this._esc(this._activeRole)}</h2></div>`}`;
    }

    _renderCarpetas() {
        const byFolder = listByFolder(this._index);
        const folders = Object.keys(byFolder).sort();
        return `
        <div class="lv-folder-grid">
            ${folders.map(folder => {
                const meta = FOLDER_META[folder] || { icon: '📂', label: folder, desc: '' };
                const items = byFolder[folder];
                return `
                <div class="lv-folder-card">
                    <h3>${meta.icon} ${this._esc(meta.label)}</h3>
                    <div class="desc">${this._esc(meta.desc)}</div>
                    <div class="count">${items.length} document${items.length > 1 ? 's' : ''}</div>
                    <ul>
                        ${items.slice(0, 15).map(it => `<li>${TYPE_META[it.type]?.icon || '·'} <a href="/n/${encodeURIComponent(it.id)}" data-link title="${this._esc(it.purpose || '')}">${this._esc(it.title)}</a></li>`).join('')}
                        ${items.length > 15 ? `<li><em>...i ${items.length - 15} més</em></li>` : ''}
                    </ul>
                </div>`;
            }).join('')}
        </div>`;
    }

    _renderSearch() {
        const results = searchIndex(this._search, this._index);
        return `
        <div class="lv-search-bar">
            <input type="search" id="lvSearch" class="lv-search-input" placeholder="🔍 Cerca per nom · paraula · keyword..." value="${this._esc(this._search.query || '')}" autocomplete="off">
            <select class="lv-search-select" data-filter="type">
                <option value="">Tots tipus</option>
                ${Object.keys(TYPE_META).map(t => `<option value="${t}" ${this._search.type === t ? 'selected' : ''}>${TYPE_META[t].icon} ${t}</option>`).join('')}
            </select>
            <select class="lv-search-select" data-filter="folder">
                <option value="">Totes carpetes</option>
                ${Object.keys(FOLDER_META).map(f => `<option value="${f}" ${this._search.folder === f ? 'selected' : ''}>${FOLDER_META[f].icon} ${f}</option>`).join('')}
            </select>
            <select class="lv-search-select" data-filter="phase">
                <option value="">Totes fases</option>
                <option value="idea" ${this._search.phase === 'idea' ? 'selected' : ''}>idea</option>
                <option value="mvp" ${this._search.phase === 'mvp' ? 'selected' : ''}>mvp</option>
                <option value="validation" ${this._search.phase === 'validation' ? 'selected' : ''}>validation</option>
                <option value="scale" ${this._search.phase === 'scale' ? 'selected' : ''}>scale</option>
            </select>
        </div>

        <div class="lv-card">
            <h2>🔍 Resultats · <span id="lvCount">${results.length}</span></h2>
            <div id="lvResults">${this._renderResults(results)}</div>
        </div>`;
    }

    _renderResults(results) {
        if (!results || results.length === 0) {
            return `<div style="padding:1rem;text-align:center;color:var(--text-muted);font-style:italic;">Cap resultat amb aquests filtres.</div>`;
        }
        return results.map(it => {
            const meta = TYPE_META[it.type] || { icon: '·', color: '#94a3b8' };
            return `
            <div class="lv-result" style="border-left-color:${meta.color};">
                <div class="lv-result-head">
                    <span style="font-size:1.05rem;">${meta.icon}</span>
                    <span class="lv-result-title">${this._esc(it.title)}</span>
                    <span class="lv-result-meta">${this._esc(it.relpath)}</span>
                </div>
                <div class="lv-result-excerpt">${this._esc(it.purpose || it.excerpt)}</div>
                <div style="margin-top:6px;"><a href="/n/${encodeURIComponent(it.id)}" data-link style="font-size:0.76rem;color:var(--accent-indigo);text-decoration:none;font-weight:600;">📖 Llegir →</a></div>
            </div>`;
        }).join('');
    }

    _esc(s) {
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    destroy() {}
}

export { TPL_VERSION };
