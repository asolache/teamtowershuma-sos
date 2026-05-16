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
import { renderNavLinksHtml, renderNavGroupedHtml, ensureNavGroupStyle, bindNavGroupDropdowns } from '../core/navService.js';

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
            return `<div style="display:flex;align-items:center;justify-content:center;height:100dvh;color:var(--text-muted);font-family:monospace;">
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
        // WEBOF-TRUST sprint A · render del panell d'attesters (fire-and-forget)
        this._renderWebOfTrust().catch(e => console.warn('[node-view] web-of-trust', e?.message));
    }

    // WEBOF-TRUST sprint A · render del panell "🤝 Web of Trust"
    // Llegeix les attestations del KB · les filtra per attestedId=this.nodeId ·
    // calcula trust score recursive (PageRank) · verifica signatures inline ·
    // mostra cada attester amb el seu propi trust score normalitzat.
    async _renderWebOfTrust() {
        const body = document.getElementById('nvTrustBody');
        if (!body) return;
        try {
            const { buildTrustPanelData } = await import('../core/trustScoreService.js');
            const { verifyAttestation }   = await import('../core/attestationService.js');
            const allAtts = await KB.query({ type: 'attestation' }).catch(() => []);

            const data = buildTrustPanelData({
                attestations: allAtts,
                nodeId:       this.node.id,
                projectId:    this.node.content?.projectId || this.node.projectId || null,
            });

            if (data.relevant.length === 0) {
                body.innerHTML = `<div style="color:var(--text-muted);font-style:italic;font-size:0.82rem;">Cap attestation encara per a aquest node. Una entitat amb identitat ECDSA pot endorsar-lo des d'<a href="/opportunities" data-link style="color:var(--accent-indigo);">/opportunities</a> (cards) o des d'aquesta vista (sprint B · CTA "✓ Endorse aquest node").</div>`;
                return;
            }

            const agg = data.aggregate;
            const aggBadge = `<span title="Trust score recursive · ${agg.uniqueAttesters} attesters · PageRank weighted" style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;background:${agg.color}25;color:${agg.color};border:1px solid ${agg.color}50;font-size:11px;font-weight:700;font-family:var(--font-mono);">${agg.icon} ${agg.total.toFixed(2)} · ${agg.uniqueAttesters} attester${agg.uniqueAttesters === 1 ? '' : 's'}</span>`;

            // Verify signatures (parallel · defensiu) · index per attesterDid
            const verifMap = new Map();
            await Promise.all(data.relevant.map(async (a) => {
                try {
                    const ok = await verifyAttestation(a);
                    verifMap.set(a.content?.attesterDid, ok ? 'ok' : 'bad');
                } catch (_) {
                    verifMap.set(a.content?.attesterDid, 'unknown');
                }
            }));

            const rows = data.attesters.map(att => {
                const v = verifMap.get(att.did);
                const issued = att.issuedAt ? new Date(att.issuedAt).toLocaleString('es-ES') : '';
                const verifyBadge = v === 'ok'
                    ? '<span title="Signatura ECDSA verificada" style="color:#22c55e;font-weight:700;font-size:11px;">🔐 verified</span>'
                    : v === 'bad'
                        ? '<span title="Signatura no vàlida" style="color:#ef4444;font-weight:700;font-size:11px;">✗ invalid</span>'
                        : '<span title="Sense signatura o error de verificació" style="color:var(--text-muted);font-size:11px;">— unverified</span>';
                const kindColor = att.kind === 'endorses-founder' ? '#22c55e' : (att.kind === 'cohort-member' ? '#a855f7' : '#3b82f6');
                return `
                    <div style="display:grid;grid-template-columns:1fr auto;gap:8px;padding:10px 0;border-top:1px solid var(--border-default);font-size:0.82rem;">
                        <div style="min-width:0;">
                            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:4px;">
                                <code style="font-family:var(--font-mono);color:var(--text-secondary);font-size:11px;">${this._esc(att.did.slice(0, 24))}…</code>
                                ${att.handle ? `<span style="color:var(--accent-indigo);font-size:11px;font-weight:600;">${this._esc(att.handle)}</span>` : ''}
                                <span title="kind weight ${att.kindWeight}×" style="background:${kindColor}25;color:${kindColor};padding:1px 7px;border-radius:999px;font-size:10px;font-weight:700;font-family:var(--font-mono);">${this._esc(att.kind)} · ${att.kindWeight}×</span>
                                ${verifyBadge}
                            </div>
                            ${att.statement ? `<div style="color:var(--text-secondary);font-size:0.78rem;line-height:1.45;font-style:italic;">"${this._esc(att.statement)}"</div>` : ''}
                            ${issued ? `<div style="color:var(--text-muted);font-size:10px;font-family:var(--font-mono);margin-top:2px;">📅 ${this._esc(issued)}</div>` : ''}
                        </div>
                        <div style="text-align:right;font-family:var(--font-mono);color:var(--text-muted);font-size:11px;">
                            <div title="Trust score PageRank de l'attester">PR ${att.pagerank.toFixed(2)}</div>
                        </div>
                    </div>
                `;
            }).join('');

            body.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:6px;padding-bottom:8px;border-bottom:1px dashed var(--border-default);">
                    <div>${aggBadge}</div>
                    <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">PageRank · ${data.recursive.iterationsRun} iter · Δ ${data.recursive.finalDelta.toFixed(5)}${data.recursive.converged ? ' · converged' : ' · max iter'}</div>
                </div>
                ${rows}
                <div style="margin-top:10px;padding-top:8px;border-top:1px dashed var(--border-default);font-size:11px;color:var(--text-muted);line-height:1.5;">
                    Web of Trust · cada attester contribueix <code>kindWeight × scorePageRank(attester)</code>. Power-user endorsements valen més. Verifies via Web Crypto ECDSA P-256.
                </div>
            `;
        } catch (e) {
            console.warn('[node-view] _renderWebOfTrust failed', e);
            body.innerHTML = '<div style="color:var(--accent-orange);font-size:0.8rem;">⚠ ' + this._esc(e?.message || 'no s\'ha pogut carregar el web of trust') + '</div>';
        }
    }

    _htmlError(msg) {
        return `
        <div style="height:100dvh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;color:var(--text-muted);font-family:monospace;background:var(--bg-dark);">
            <div style="font-size:2.5rem;">🔍</div>
            <div style="color:var(--accent-red);">${msg}</div>
            <a href="/" data-link style="color:var(--accent-indigo);font-size:0.85rem;">← Inicio</a>
            <a href="/tags" data-link style="color:var(--accent-indigo);font-size:0.85rem;">🏷 Cloud de tags</a>
        </div>`;
    }

    _htmlGeneric() {
        const n = this.node;
        const c = n.content || {};
        const title = c.title || c.name || c.nombre || n.id;
        const tags  = Array.isArray(c.tags) ? c.tags : [];

        return `
        <style>
            .nv-shell  { height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); display:flex; flex-direction:column; overflow:hidden; }
            .nv-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; flex-wrap:wrap; min-height:48px; box-sizing:border-box; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-shrink:0; }
            .nv-logo   { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .nv-logo span { color:var(--accent-indigo); }
            .nv-link { color:var(--text-secondary); text-decoration:none; font-size:var(--text-xs); font-weight:600; padding:6px 10px; border-radius:var(--radius-sm); transition:all var(--dur-fast); display:inline-flex; align-items:center; gap:4px; white-space:nowrap; }
            .nv-link:hover { color:var(--text-main); background:var(--glass-hover); }
            .nv-link:focus-visible { outline:2px solid var(--accent-indigo); outline-offset:2px; }
            .nv-spacer { flex:1; }
            .nv-main   { padding:1.5rem; max-width:900px; margin:0 auto; flex:1; overflow-y:auto; width:100%; }
            .nv-card   { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1.2rem; margin-bottom:1rem; }
            .nv-label  { font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; font-family:monospace; margin-bottom:0.3rem; }
            .nv-meta   { color:var(--text-secondary); font-size:0.8rem; font-family:monospace; }
            .nv-json   { background:#000; padding:0.8rem; border-radius:5px; color:var(--text-secondary); font-size:0.7rem; max-height:480px; overflow:auto; white-space:pre-wrap; word-break:break-all; }
        </style>

        <div class="nv-shell">
            <div class="nv-topbar">
                <a href="/" data-link class="nv-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Nodo · ${this._esc(n.type || 'sin tipo')}</span>
                <div class="nv-spacer"></div>
                
            </div>
            <div class="nv-main">
                <h1 style="font-size:1.5rem;color:var(--text-main);margin:0 0 0.6rem 0;">${this._esc(title)}</h1>
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

                <!-- WEBOF-TRUST sprint A · panell d'attesters · llistat verificable inline -->
                <div class="nv-card" id="nvTrustCard">
                    <div class="nv-label">🤝 Web of Trust · attesters d'aquest node</div>
                    <div id="nvTrustBody" style="font-size:0.85rem;color:var(--text-muted);">Carregant…</div>
                </div>

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
