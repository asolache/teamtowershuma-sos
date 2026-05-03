// =============================================================================
// TEAMTOWERS SOS V11 — TAGS CLOUD VIEW (UX-001 sprint A)
// Ruta: /js/views/TagsView.js
//
// Vista global de la folksonomía: cloud de todos los tags del KB con
// frecuencia + lista de nodos por tag al hacer click. Cada nodo de la
// lista enlaza a `/n/{nodeId}` (NodeView resuelve el destino real).
// =============================================================================

import { store }              from '../core/store.js';
import { aggregateTags, nodesWithTag, loadAllNodesForTags, normalizeTag } from '../core/tagsService.js';
import { renderNavLinksHtml } from '../core/navService.js';

export default class TagsView {
    constructor() {
        document.title = 'Folksonomía · SOS V11';
        this.nodes  = [];
        this.tags   = [];
        this.active = null;  // tag activo (filtro)
    }

    async getHtml() {
        await store.init();
        return `
        <style>
            .tg-shell  { height:100dvh; background:#050507; color:#e6e6e6; font-family:var(--font-base,sans-serif); display:flex; flex-direction:column; overflow:hidden; }
            .tg-topbar { display:flex; align-items:center; gap:1rem; padding:1rem 1.5rem; border-bottom:1px solid #1a1a22; background:#08080c; flex-shrink:0; }
            .tg-logo   { font-weight:700; color:#fff; text-decoration:none; font-size:1.05rem; }
            .tg-logo span { color:#6366f1; }
            .tg-title  { color:#aaa; font-weight:500; letter-spacing:0.05em; text-transform:uppercase; font-size:0.78rem; }
            .tg-spacer { flex:1; }
            .tg-link   { color:#6366f1; text-decoration:none; font-size:0.85rem; }

            .tg-main   { padding:1.5rem; max-width:1100px; margin:0 auto; flex:1; overflow-y:auto; width:100%; }
            .tg-cloud  { display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:1.5rem; padding:1rem; background:#0e0e14; border:1px solid #1a1a22; border-radius:8px; }
            .tg-chip   { background:rgba(99,102,241,0.1); color:#a5b4fc; padding:4px 10px; border-radius:12px; font-family:monospace; font-size:0.78rem; cursor:pointer; border:1px solid rgba(99,102,241,0.3); transition:all 0.15s; user-select:none; }
            .tg-chip:hover { background:rgba(99,102,241,0.25); transform:translateY(-1px); }
            .tg-chip.active { background:rgba(99,102,241,0.4); color:#fff; border-color:#6366f1; }
            .tg-chip .count { opacity:0.6; margin-left:4px; }

            .tg-empty  { text-align:center; padding:3rem 1rem; color:#666; border:1px dashed #2a2a35; border-radius:8px; }
            .tg-list   { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:0.8rem; }
            .tg-card   { background:#0e0e14; border:1px solid #1a1a22; border-left:3px solid #6366f1; border-radius:8px; padding:0.8rem; text-decoration:none; color:#e6e6e6; transition:background 0.15s; display:block; }
            .tg-card:hover { background:#13131a; }
            .tg-card .type   { font-size:0.7rem; color:#888; font-family:monospace; text-transform:uppercase; letter-spacing:0.05em; }
            .tg-card .title  { color:#fff; font-size:0.92rem; font-weight:600; margin:0.2rem 0; }
            .tg-card .meta   { color:#888; font-size:0.72rem; }
            .tg-card .tags   { margin-top:0.4rem; display:flex; flex-wrap:wrap; gap:3px; }
            .tg-card .tags .t { font-size:0.65rem; padding:1px 6px; border-radius:8px; background:rgba(99,102,241,0.12); color:#a5b4fc; font-family:monospace; }
        </style>

        <div class="tg-shell">
            <div class="tg-topbar">
                <a href="/" data-link class="tg-logo">🗼 Team<span>Towers</span></a>
                <span class="tg-title">Folksonomía · cloud de tags</span>
                <div class="tg-spacer"></div>
                ${renderNavLinksHtml({ active: 'tags', className: 'tg-link' })}
            </div>
            <div class="tg-main" id="tgMain">
                <p style="color:#888;">Cargando…</p>
            </div>
        </div>`;
    }

    async afterRender() {
        this.nodes = await loadAllNodesForTags();
        this.tags  = aggregateTags(this.nodes);

        // tag desde query param
        const qp = new URLSearchParams(window.location.search).get('tag');
        if (qp) this.active = normalizeTag(qp) || null;
        this._render();
    }

    _render() {
        const main = document.getElementById('tgMain');
        if (!main) return;

        if (!this.tags.length) {
            main.innerHTML = `
                <div class="tg-empty">
                    <p>El KB todavía no tiene tags folksonómicos.</p>
                    <p style="font-size:0.85rem;">Añade tags desde el editor inline en el inspector de roles del Map o en el modal de detalle de WO en el Kanban.</p>
                </div>`;
            return;
        }

        // Cloud (tamaño según count, simple linear scaling)
        const max = Math.max(...this.tags.map(t => t.count));
        const cloudHtml = this.tags.map(t => {
            const size = 0.78 + (t.count / max) * 0.55;  // 0.78 → ~1.33rem
            return `<span class="tg-chip ${this.active === t.tag ? 'active' : ''}" data-tag="${t.tag}" style="font-size:${size.toFixed(2)}rem;">#${t.tag}<span class="count">${t.count}</span></span>`;
        }).join('');

        // Lista de nodos: si hay tag activo → filtrados, si no → vacío con hint
        let listHtml;
        if (!this.active) {
            listHtml = `<p style="color:#888;font-size:0.85rem;text-align:center;padding:1rem;">Selecciona un tag para ver los nodos enlazados.</p>`;
        } else {
            const matches = nodesWithTag(this.nodes, this.active);
            if (!matches.length) {
                listHtml = `<p style="color:#fca5a5;font-size:0.85rem;text-align:center;">Sin nodos con #${this.active}</p>`;
            } else {
                listHtml = `
                    <p style="color:#aaa;font-size:0.85rem;margin-bottom:0.6rem;">${matches.length} nodo${matches.length === 1 ? '' : 's'} con <span style="color:#a5b4fc;font-family:monospace;">#${this.active}</span>:</p>
                    <div class="tg-list">
                        ${matches.map(n => this._cardHtml(n)).join('')}
                    </div>`;
            }
        }

        main.innerHTML = `
            <h1 style="font-size:1.4rem;color:#fff;margin:0 0 0.4rem 0;">Folksonomía</h1>
            <p style="color:#aaa;font-size:0.85rem;margin-bottom:1rem;">${this.tags.length} tag${this.tags.length === 1 ? '' : 's'} sobre ${this.nodes.length} nodo${this.nodes.length === 1 ? '' : 's'}. Click en un chip para ver sus nodos.</p>
            <div class="tg-cloud">${cloudHtml}</div>
            ${listHtml}
        `;

        // Click en chip → activar tag y actualizar URL
        main.querySelectorAll('.tg-chip').forEach(el => {
            el.addEventListener('click', () => {
                const tag = el.dataset.tag;
                this.active = (this.active === tag) ? null : tag;
                const url = new URL(window.location.href);
                if (this.active) url.searchParams.set('tag', this.active);
                else             url.searchParams.delete('tag');
                window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
                this._render();
            });
        });
    }

    _cardHtml(n) {
        const c = n.content || {};
        const title = this._esc(c.title || c.name || c.nombre || n.id);
        const tags  = (Array.isArray(c.tags) ? c.tags : []);
        return `
            <a href="/n/${encodeURIComponent(n.id)}" data-link class="tg-card">
                <div class="type">${this._esc(n.type || 'node')}</div>
                <div class="title">${title}</div>
                <div class="meta">${this._esc(n.id)}${n.projectId ? ' · proyecto: ' + this._esc(n.projectId) : ''}</div>
                ${tags.length ? `<div class="tags">${tags.map(t => `<span class="t">#${this._esc(t)}</span>`).join('')}</div>` : ''}
            </a>
        `;
    }

    _esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }

    destroy() {}
}
