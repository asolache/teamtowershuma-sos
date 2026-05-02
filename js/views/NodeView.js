// =============================================================================
// TEAMTOWERS SOS V11 — NODE VIEW (UX-001 sprint A)
// Ruta: /js/views/NodeView.js · matchea /n/{nodeId}
//
// Resolver universal del Mind-as-Graph: cualquier nodo del KB tiene una
// URL canónica `/n/{id}`. Esta vista lee el ID, carga el nodo desde KB
// y:
//   - Si el tipo es conocido (project/sop/work_order/workshop) →
//     redirige a la vista especializada con los query params correctos.
//   - Si el tipo es genérico → renderiza un fallback con tags inline,
//     metadatos básicos y un dump JSON colapsable.
// =============================================================================

import { store }        from '../core/store.js';
import { KB }           from '../core/kb.js';
import { navigateTo }   from '../router.js';
import { renderTagsEditor, persistTagAdd, persistTagRemove } from '../core/tagsService.js';
import { linkifyMultiline } from '../core/linkifyService.js';

// Mapping tipo → URL especializada (si existe).
function specializedUrlFor(node) {
    if (!node || !node.type) return null;
    const id  = node.id;
    const pid = node.projectId || node.content?.projectId;
    switch (node.type) {
        case 'project':     return id ? `/project/${encodeURIComponent(id)}` : null;
        case 'sop':         return pid ? `/sops?project=${encodeURIComponent(pid)}&focus=${encodeURIComponent(id)}` : null;
        case 'work_order':  return pid ? `/kanban?project=${encodeURIComponent(pid)}` : `/kanban`;
        case 'workshop':    return `/workshops`;
        default:            return null;
    }
}

export default class NodeView {
    constructor() {
        document.title = 'Nodo · SOS V11';
        this.nodeId = null;
        this.node   = null;
    }

    async getHtml() {
        await store.init();
        await KB.init();

        // Extraer el ID del path: /n/{nodeId}
        const path = window.location.pathname;
        const m = path.match(/^\/n\/(.+)$/);
        this.nodeId = m ? decodeURIComponent(m[1]) : null;
        if (!this.nodeId) return this._htmlError('URL malformada · esperado /n/{nodeId}');

        this.node = await KB.getNode(this.nodeId);
        if (!this.node) return this._htmlError(`Nodo no encontrado: ${this._esc(this.nodeId)}`);

        // Si el tipo tiene vista especializada → redirigir
        const target = specializedUrlFor(this.node);
        if (target) {
            // Devolvemos shell mínima · afterRender hace el navigateTo
            return `<div style="display:flex;align-items:center;justify-content:center;height:100dvh;color:#888;font-family:monospace;">
                Redirigiendo a vista especializada…
            </div>`;
        }

        // Fallback genérico
        return this._htmlGeneric();
    }

    async afterRender() {
        if (!this.node) return;
        const target = specializedUrlFor(this.node);
        if (target) {
            navigateTo(target);
            return;
        }
        this._bindTagsEditor();
    }

    _htmlError(msg) {
        return `
        <div style="height:100dvh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;color:#888;font-family:monospace;background:#050507;">
            <div style="font-size:2.5rem;">🔍</div>
            <div style="color:#fca5a5;">${msg}</div>
            <a href="/" data-link style="color:#6366f1;font-size:0.85rem;">← Inicio</a>
            <a href="/tags" data-link style="color:#6366f1;font-size:0.85rem;">🏷 Cloud de tags</a>
        </div>`;
    }

    _htmlGeneric() {
        const n = this.node;
        const c = n.content || {};
        const title = c.title || c.name || c.nombre || n.id;
        const tags  = Array.isArray(c.tags) ? c.tags : [];

        return `
        <style>
            .nv-shell  { height:100dvh; background:#050507; color:#e6e6e6; font-family:var(--font-base,sans-serif); display:flex; flex-direction:column; overflow:hidden; }
            .nv-topbar { display:flex; align-items:center; gap:1rem; padding:1rem 1.5rem; border-bottom:1px solid #1a1a22; background:#08080c; flex-shrink:0; }
            .nv-logo   { font-weight:700; color:#fff; text-decoration:none; font-size:1.05rem; }
            .nv-logo span { color:#6366f1; }
            .nv-link   { color:#6366f1; text-decoration:none; font-size:0.85rem; }
            .nv-spacer { flex:1; }
            .nv-main   { padding:1.5rem; max-width:900px; margin:0 auto; flex:1; overflow-y:auto; width:100%; }
            .nv-card   { background:#0e0e14; border:1px solid #1a1a22; border-radius:8px; padding:1.2rem; margin-bottom:1rem; }
            .nv-label  { font-size:0.7rem; color:#888; text-transform:uppercase; letter-spacing:0.05em; font-family:monospace; margin-bottom:0.3rem; }
            .nv-meta   { color:#aaa; font-size:0.8rem; font-family:monospace; }
            .nv-json   { background:#000; padding:0.8rem; border-radius:5px; color:#bbb; font-size:0.7rem; max-height:480px; overflow:auto; white-space:pre-wrap; word-break:break-all; }
        </style>

        <div class="nv-shell">
            <div class="nv-topbar">
                <a href="/" data-link class="nv-logo">🗼 Team<span>Towers</span></a>
                <span style="color:#aaa;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Nodo · ${this._esc(n.type || 'sin tipo')}</span>
                <div class="nv-spacer"></div>
                <a href="/tags" data-link class="nv-link">🏷 Cloud de tags</a>
                <a href="/dashboard" data-link class="nv-link">← Dashboard</a>
            </div>
            <div class="nv-main">
                <h1 style="font-size:1.5rem;color:#fff;margin:0 0 0.6rem 0;">${this._esc(title)}</h1>
                <div class="nv-meta">id: ${this._esc(n.id)}${n.projectId ? ' · proyecto: ' + this._esc(n.projectId) : ''}${n.updatedAt ? ' · actualizado: ' + new Date(n.updatedAt).toLocaleString('es-ES') : ''}</div>

                <div class="nv-card">
                    <div class="nv-label">🏷 Tags folksonómicos</div>
                    <div id="nvTagsRoot">${renderTagsEditor({ tags, inputId: 'nvTagsInput' })}</div>
                </div>

                ${c.description || c.summary ? `
                    <div class="nv-card">
                        <div class="nv-label">Descripción</div>
                        <div style="font-size:0.88rem;line-height:1.5;color:#ddd;">${linkifyMultiline(c.description || c.summary)}</div>
                    </div>
                ` : ''}

                <div class="nv-card">
                    <div class="nv-label">Contenido completo · JSON</div>
                    <pre class="nv-json">${this._esc(JSON.stringify(n, null, 2))}</pre>
                </div>
            </div>
        </div>`;
    }

    _bindTagsEditor() {
        const root = document.getElementById('nvTagsRoot');
        if (!root) return;
        const refresh = async () => {
            this.node = await KB.getNode(this.nodeId);
            const tags = Array.isArray(this.node?.content?.tags) ? this.node.content.tags : [];
            root.innerHTML = renderTagsEditor({ tags, inputId: 'nvTagsInput' });
            this._bindTagsEditor();  // re-bind tras innerHTML reset
        };

        // Click en chip folksonómico → eliminar (los taxonómicos son inmutables · UX-002)
        root.querySelectorAll('.sos-tag-chip[data-taxonomy="false"]').forEach(chip => {
            chip.addEventListener('click', async () => {
                try { await persistTagRemove(this.nodeId, chip.dataset.tag); await refresh(); }
                catch (err) { console.error('[UX-001] Error removiendo tag:', err); }
            });
        });

        // Enter en input → añadir
        const input = document.getElementById('nvTagsInput');
        if (input) {
            input.addEventListener('keydown', async (e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                const raw = input.value.trim();
                if (!raw) return;
                try { await persistTagAdd(this.nodeId, raw); input.value = ''; await refresh(); }
                catch (err) { console.error('[UX-001] Error añadiendo tag:', err); }
            });
        }
    }

    _esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }

    destroy() {}
}
