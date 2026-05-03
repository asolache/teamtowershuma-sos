// =============================================================================
// TEAMTOWERS SOS V11 — FOLDERS VIEW (KM-001 sprint A)
// Ruta: /js/views/FoldersView.js · matchea /folders
//
// Vista de carpetas inteligentes (smart folders): queries persistentes
// sobre el KB tipo Smart Mailbox. Muestra el catálogo de carpetas y al
// abrir una se ejecuta la query en vivo y se listan los nodos resultado.
//
// Sprint A entrega: catálogo + ejecución + 5 carpetas predefinidas
// auto-seed la primera vez. Sprint B añadirá wizard de creación con
// autocompletado de tags conocidos.
// =============================================================================

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import {
    executeFolderQuery, validateFolder, DEFAULT_FOLDERS,
} from '../core/smartFolderService.js';
import { renderNavLinksHtml } from '../core/navService.js';

export default class FoldersView {
    constructor() {
        document.title = 'Folders · SOS V11';
        this.folders = [];
        this.allNodes = [];
        this.activeFolderId = null;
    }

    async getHtml() {
        await store.init();
        return `
        <style>
            .fl-shell  { height:100dvh; background:#050507; color:#e6e6e6; font-family:var(--font-base,sans-serif); display:flex; flex-direction:column; overflow:hidden; }
            .fl-topbar { display:flex; align-items:center; gap:1rem; padding:1rem 1.5rem; border-bottom:1px solid #1a1a22; background:#08080c; flex-shrink:0; flex-wrap:wrap; }
            .fl-logo   { font-weight:700; color:#fff; text-decoration:none; font-size:1.05rem; }
            .fl-logo span { color:#6366f1; }
            .fl-title  { color:#aaa; font-weight:500; letter-spacing:0.05em; text-transform:uppercase; font-size:0.78rem; }
            .fl-spacer { flex:1; }
            .fl-link   { color:#6366f1; text-decoration:none; font-size:0.85rem; }

            .fl-main   { flex:1; overflow:hidden; display:grid; grid-template-columns:280px 1fr; }
            @media (max-width:780px) { .fl-main { grid-template-columns: 1fr; } .fl-side { display:none; } }
            .fl-side   { background:#08080c; border-right:1px solid #1a1a22; overflow-y:auto; padding:0.8rem; }
            .fl-content{ overflow-y:auto; padding:1.2rem 1.5rem; }

            .fl-folder-tile { display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:6px; cursor:pointer; transition:background 0.12s; margin-bottom:2px; }
            .fl-folder-tile:hover { background:#11111a; }
            .fl-folder-tile.active { background:rgba(99,102,241,0.15); border-left:3px solid #a5b4fc; padding-left:7px; }
            .fl-folder-tile .icon { font-size:1.05rem; }
            .fl-folder-tile .name { color:#e6e6e6; font-size:0.85rem; flex:1; }
            .fl-folder-tile .count { color:#888; font-family:monospace; font-size:0.7rem; }
            .fl-folder-tile.system .name { color:#a5b4fc; }

            .fl-section-label { font-size:10px; color:#666; text-transform:uppercase; letter-spacing:0.1em; font-family:monospace; margin:0.8rem 0 0.4rem 0.3rem; }

            .fl-empty  { text-align:center; padding:3rem 1rem; color:#666; border:1px dashed #2a2a35; border-radius:8px; }
            .fl-list   { display:flex; flex-direction:column; gap:0.5rem; }
            .fl-item   { background:#0e0e14; border:1px solid #1a1a22; border-left:3px solid var(--fl-c,#6366f1); border-radius:8px; padding:0.7rem 0.9rem; text-decoration:none; color:#e6e6e6; transition:background 0.12s; }
            .fl-item:hover { background:#13131a; }
            .fl-item h4 { margin:0; color:#fff; font-size:0.9rem; font-weight:600; }
            .fl-item .meta { color:#888; font-size:0.72rem; font-family:monospace; margin-top:0.25rem; }
            .fl-item .tags { display:flex; flex-wrap:wrap; gap:3px; margin-top:0.35rem; }
            .fl-item .tag  { font-size:0.62rem; padding:1px 6px; border-radius:8px; background:rgba(99,102,241,0.12); color:#a5b4fc; font-family:monospace; }
            .fl-item .tag.tax { background:rgba(56,189,248,0.12); color:#7dd3fc; }
        </style>

        <div class="fl-shell">
            <div class="fl-topbar">
                <a href="/" data-link class="fl-logo">🗼 Team<span>Towers</span></a>
                <span class="fl-title">Folders · carpetas inteligentes</span>
                <div class="fl-spacer"></div>
                ${renderNavLinksHtml({ active: '', className: 'fl-link' })}
            </div>

            <div class="fl-main">
                <aside class="fl-side" id="flSide">
                    <p style="color:#888;font-size:0.78rem;">Cargando carpetas…</p>
                </aside>
                <section class="fl-content" id="flContent">
                    <p style="color:#888;font-size:0.85rem;">Selecciona una carpeta para ver sus nodos.</p>
                </section>
            </div>
        </div>`;
    }

    async afterRender() {
        await this._load();
        await this._ensureDefaults();
        await this._load();   // releer tras seed
        this._renderSide();
        // tabla activa por query param o la primera con items
        const focus = new URLSearchParams(window.location.search).get('focus');
        if (focus && this.folders.some(f => f.id === focus)) this.activeFolderId = focus;
        else if (this.folders.length) this.activeFolderId = this.folders[0].id;
        this._renderContent();
    }

    async _load() {
        await KB.init();
        this.allNodes = await KB.getAllNodes();
        this.folders  = this.allNodes
            .filter(n => n.type === 'smart_folder')
            .sort((a, b) => {
                const sysA = a.content?.isSystem ? 0 : 1;
                const sysB = b.content?.isSystem ? 0 : 1;
                if (sysA !== sysB) return sysA - sysB;
                return (a.content?.name || '').localeCompare(b.content?.name || '');
            });
    }

    async _ensureDefaults() {
        const existingIds = new Set(this.folders.map(f => f.id));
        for (const def of DEFAULT_FOLDERS) {
            if (existingIds.has(def.id)) continue;
            const node = JSON.parse(JSON.stringify(def));
            await store.dispatch({ type: 'KB_UPSERT', payload: { node } });
        }
    }

    _renderSide() {
        const side = document.getElementById('flSide');
        if (!side) return;
        const sys = this.folders.filter(f => f.content?.isSystem);
        const usr = this.folders.filter(f => !f.content?.isSystem);

        const renderTile = (f) => {
            const c = f.content || {};
            const matches = executeFolderQuery(f, this.allNodes).length;
            const cls = (this.activeFolderId === f.id) ? 'fl-folder-tile active' : 'fl-folder-tile';
            return `
                <div class="${cls}${c.isSystem ? ' system' : ''}" data-folder-id="${this._esc(f.id)}">
                    <span class="icon">${c.icon || '📁'}</span>
                    <span class="name">${this._esc(c.name || f.id)}</span>
                    <span class="count">${matches}</span>
                </div>`;
        };

        side.innerHTML = `
            <div class="fl-section-label">Sistema · ${sys.length}</div>
            ${sys.map(renderTile).join('')}
            <div class="fl-section-label">Personales · ${usr.length}</div>
            ${usr.length ? usr.map(renderTile).join('') : '<p style="color:#666;font-size:0.78rem;padding:0.4rem;">Aún no has creado carpetas propias. Sprint B añadirá un wizard.</p>'}
        `;

        side.querySelectorAll('.fl-folder-tile').forEach(el => {
            el.addEventListener('click', () => {
                this.activeFolderId = el.dataset.folderId;
                this._renderSide();
                this._renderContent();
                const url = new URL(window.location.href);
                url.searchParams.set('focus', this.activeFolderId);
                window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
            });
        });
    }

    _renderContent() {
        const main = document.getElementById('flContent');
        if (!main) return;
        const folder = this.folders.find(f => f.id === this.activeFolderId);
        if (!folder) {
            main.innerHTML = `<p style="color:#888;font-size:0.85rem;">Selecciona una carpeta a la izquierda.</p>`;
            return;
        }
        const c = folder.content || {};
        const items = executeFolderQuery(folder, this.allNodes);

        const queryHints = [];
        const q = c.query || {};
        if (q.types?.length)    queryHints.push('types: ' + q.types.join(','));
        if (q.projectId)        queryHints.push('project: ' + q.projectId);
        if (q.tagsAll?.length)  queryHints.push('AND ' + q.tagsAll.join('+'));
        if (q.tagsAny?.length)  queryHints.push('OR (' + q.tagsAny.join(',') + ')');
        if (q.tagsNone?.length) queryHints.push('NOT ' + q.tagsNone.join(','));
        if (q.recentDays)       queryHints.push('últimos ' + q.recentDays + ' días');
        if (q.sortBy)           queryHints.push('ord: ' + q.sortBy);

        const headerHtml = `
            <div style="margin-bottom:1rem;">
                <h1 style="margin:0;color:#fff;font-size:1.3rem;">${this._esc(c.icon || '📁')} ${this._esc(c.name || folder.id)}</h1>
                <div style="color:#888;font-size:0.75rem;font-family:monospace;margin-top:0.3rem;">
                    ${items.length} nodo${items.length === 1 ? '' : 's'} · query: ${queryHints.join(' · ') || '(sin filtros)'}
                </div>
            </div>`;

        if (!items.length) {
            main.innerHTML = headerHtml + `
                <div class="fl-empty">
                    <p>Sin nodos que cumplan la query.</p>
                    <p style="font-size:0.78rem;color:#777;">Es normal si todavía no has generado SOPs / WOs / ofertas. Crea contenido y vuelve.</p>
                </div>`;
            return;
        }

        const itemHtml = items.map(n => {
            const c2 = n.content || {};
            const title = c2.title || c2.name || n.id;
            const tags  = (Array.isArray(c2.tags) ? c2.tags : []).slice(0, 6);
            const updatedAt = n.updatedAt ? new Date(n.updatedAt).toLocaleDateString('es-ES') : '';
            const color = _typeColor(n.type);
            return `
                <a class="fl-item" href="/n/${encodeURIComponent(n.id)}" data-link style="--fl-c:${color};">
                    <h4>${this._esc(title)}</h4>
                    <div class="meta">${this._esc(n.type)}${n.projectId ? ' · ' + this._esc(n.projectId) : ''}${updatedAt ? ' · ' + updatedAt : ''}</div>
                    ${tags.length ? `<div class="tags">${tags.map(t => `<span class="tag ${t.includes(':') ? 'tax' : ''}">${this._esc(t)}</span>`).join('')}</div>` : ''}
                </a>`;
        }).join('');

        main.innerHTML = headerHtml + `<div class="fl-list">${itemHtml}</div>`;
    }

    _esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }

    destroy() {}
}

function _typeColor(type) {
    return TYPE_COLORS[type] || '#6366f1';
}

// Compartido con MindGraphView (H8.1) · paleta canónica por tipo de nodo.
const TYPE_COLORS = {
    project:           '#a855f7',
    role:              '#6366f1',
    transaction:       '#06b6d4',
    sop:               '#22c55e',
    work_order:        '#facc15',
    workshop:          '#fb923c',
    market_item:       '#ec4899',
    ledger_entry:      '#eab308',
    user_identity:     '#7dd3fc',
    smart_folder:      '#94a3b8',
    client_vna_model:  '#a855f7',
    deliverable:       '#10b981',
    soc:               '#86efac',
    config:            '#475569',
};
