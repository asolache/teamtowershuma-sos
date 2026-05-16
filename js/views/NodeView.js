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
import { renderKnowledgeDoc } from '../core/markdownRenderer.js';
import { loadIndex } from '../core/knowledgeIndexService.js';

// NODE-VIEW-MD · base GitHub per a links "Veure original"
const GITHUB_BASE = 'https://github.com/asolache/teamtowershuma-sos/blob/main';

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

        // NODE-VIEW-MD · si no hi és al KB · prova al knowledge/ index
        // (els .md de knowledge/ NO viuen al KB · els carreguem fetch+parse)
        if (!this.node) {
            const kdoc = await this._tryLoadKnowledgeDoc(this.nodeId);
            if (kdoc) {
                this._knowledgeDoc = kdoc;
                return this._htmlKnowledgeDoc(kdoc);
            }
            return this._htmlError(`Nodo no encontrado: ${this._esc(this.nodeId)}`);
        }

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
            <a href="/learn" data-link style="color:var(--accent-indigo);font-size:0.85rem;">📚 Hub de coneixement</a>
            <a href="/" data-link style="color:var(--accent-indigo);font-size:0.85rem;">← Inicio</a>
        </div>`;
    }

    // NODE-VIEW-MD · prova de carregar un .md de knowledge/ via id
    // Retorna · { item, content, rendered } o null si no es troba
    async _tryLoadKnowledgeDoc(id) {
        try {
            const idx = await loadIndex({});
            if (!idx || !Array.isArray(idx.items)) return null;
            const item = idx.items.find(it => it.id === id);
            if (!item) return null;
            const url = '/knowledge/' + item.relpath.replace(/^\/+/, '');
            const res = await fetch(url);
            if (!res.ok) return { item, content: '', rendered: null, fetchError: 'HTTP ' + res.status };
            const content = await res.text();
            const rendered = renderKnowledgeDoc(content, { relpath: item.relpath, githubBase: GITHUB_BASE });
            return { item, content, rendered };
        } catch (e) {
            return null;
        }
    }

    _htmlKnowledgeDoc(kdoc) {
        const { item, rendered, fetchError } = kdoc;
        const fm = rendered?.frontmatter || {};
        const title = fm.id || item.title || item.relpath;
        const purpose = fm.purpose || item.purpose || '';
        const kws = Array.isArray(fm.keywords) ? fm.keywords : (Array.isArray(item.keywords) ? item.keywords : []);
        const githubUrl = rendered?.githubUrl;
        const status = fm.status || item.status || '';
        const version = fm.version || item.version || '';
        const folder = item.folder || '';
        const type = item.type || folder.replace(/s$/, '');

        return `
        <style>
            .kdoc-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); padding-bottom:3rem; }
            .kdoc-topbar { display:flex; align-items:center; gap:10px; padding:10px 18px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); position:sticky; top:0; z-index:10; }
            .kdoc-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .kdoc-logo span { color:var(--accent-indigo); }
            .kdoc-topbar-meta { color:var(--text-secondary); font-size:0.78rem; }
            .kdoc-topbar a.kdoc-btn { color:var(--text-secondary); text-decoration:none; padding:5px 10px; border-radius:6px; background:rgba(255,255,255,0.04); border:1px solid var(--border-default); font-size:0.78rem; }
            .kdoc-topbar a.kdoc-btn:hover { color:var(--text-main); background:rgba(99,102,241,0.12); }
            .kdoc-main { max-width:840px; margin:0 auto; padding:1.5rem 1.4rem; }

            .kdoc-meta-card { background:linear-gradient(135deg,rgba(99,102,241,0.10),rgba(168,85,247,0.04)); border:1px solid rgba(99,102,241,0.22); border-radius:10px; padding:1rem 1.2rem; margin-bottom:1.2rem; }
            .kdoc-meta-row { display:flex; gap:8px; flex-wrap:wrap; font-size:0.78rem; align-items:center; }
            .kdoc-pill { padding:3px 10px; border-radius:999px; background:rgba(255,255,255,0.06); color:var(--text-secondary); }
            .kdoc-pill strong { color:var(--text-main); }
            .kdoc-purpose { font-size:0.92rem; color:var(--text-secondary); line-height:1.55; margin-top:8px; font-style:italic; }

            .kdoc-body { color:#e6e6e6; line-height:1.7; font-size:0.93rem; }
            .kdoc-body h1 { font-size:1.7rem; margin:1.5rem 0 0.8rem 0; color:var(--text-main); border-bottom:1px solid var(--border-default); padding-bottom:6px; }
            .kdoc-body h2 { font-size:1.35rem; margin:1.6rem 0 0.6rem 0; color:var(--accent-indigo); }
            .kdoc-body h3 { font-size:1.1rem; margin:1.3rem 0 0.5rem 0; color:#c8b3ff; }
            .kdoc-body h4 { font-size:0.98rem; margin:1.1rem 0 0.4rem 0; color:var(--text-main); }
            .kdoc-body p  { margin:0 0 0.8rem 0; }
            .kdoc-body ul, .kdoc-body ol { margin:0.6rem 0 1rem 1.6rem; padding:0; }
            .kdoc-body li { margin-bottom:0.3rem; }
            .kdoc-body a  { color:var(--accent-indigo); text-decoration:none; border-bottom:1px dotted var(--accent-indigo); }
            .kdoc-body a:hover { color:#a8b2ff; }
            .kdoc-body code { background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; font-family:var(--font-mono); font-size:0.85em; color:#c8b3ff; }
            .kdoc-body pre { background:rgba(0,0,0,0.5); border:1px solid var(--border-default); padding:14px; border-radius:8px; overflow-x:auto; margin:1rem 0; }
            .kdoc-body pre code { background:transparent; padding:0; color:#e6e6e6; font-size:0.84rem; line-height:1.5; display:block; }
            .kdoc-body blockquote { border-left:3px solid var(--accent-indigo); padding:6px 14px; margin:1rem 0; background:rgba(99,102,241,0.06); color:var(--text-secondary); border-radius:0 6px 6px 0; }
            .kdoc-body hr { border:none; border-top:1px solid var(--border-default); margin:1.6rem 0; }
            .kdoc-body strong { color:var(--text-main); }

            .kdoc-footer { display:flex; gap:10px; justify-content:space-between; align-items:center; margin-top:2rem; padding-top:1rem; border-top:1px solid var(--border-default); flex-wrap:wrap; }
            .kdoc-footer .kdoc-ext { color:var(--text-secondary); font-size:0.78rem; }
            .kdoc-footer a.kdoc-github { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; background:#24292e; color:#fff; text-decoration:none; border-radius:6px; font-size:0.82rem; font-weight:600; }
            .kdoc-footer a.kdoc-github:hover { background:#000; }

            ${fetchError ? '.kdoc-err { padding:1rem; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.3); border-radius:8px; color:#fca5a5; }' : ''}
        </style>

        <div class="kdoc-shell">
            <div class="kdoc-topbar">
                <a href="/learn" data-link class="kdoc-logo">📚 Knowledge <span>SOS</span></a>
                <span class="kdoc-topbar-meta">${this._esc(folder)} · ${this._esc(type)}</span>
                <div style="flex:1;"></div>
                ${githubUrl ? `<a href="${this._esc(githubUrl)}" target="_blank" rel="noopener" class="kdoc-btn" title="Veure original a GitHub">📎 GitHub</a>` : ''}
                <a href="/learn" data-link class="kdoc-btn">← Hub</a>
            </div>

            <div class="kdoc-main">
                <div class="kdoc-meta-card">
                    <h1 style="margin:0 0 8px 0;font-size:1.6rem;">${this._esc(title)}</h1>
                    <div class="kdoc-meta-row">
                        ${folder ? `<span class="kdoc-pill">📁 <strong>${this._esc(folder)}</strong></span>` : ''}
                        ${type ? `<span class="kdoc-pill">🏷 <strong>${this._esc(type)}</strong></span>` : ''}
                        ${version ? `<span class="kdoc-pill">v <strong>${this._esc(version)}</strong></span>` : ''}
                        ${status ? `<span class="kdoc-pill">📊 <strong>${this._esc(status)}</strong></span>` : ''}
                        ${fm.sector_cnae ? `<span class="kdoc-pill">CNAE <strong>${this._esc(fm.sector_cnae)}</strong></span>` : ''}
                        ${fm.phase ? `<span class="kdoc-pill">fase <strong>${this._esc(fm.phase)}</strong></span>` : ''}
                        ${fm.scope ? `<span class="kdoc-pill">scope <strong>${this._esc(fm.scope)}</strong></span>` : ''}
                    </div>
                    ${purpose ? `<div class="kdoc-purpose">${this._esc(purpose)}</div>` : ''}
                    ${kws.length ? `<div class="kdoc-meta-row" style="margin-top:8px;">
                        ${kws.slice(0, 12).map(k => `<a href="/learn?tab=search&q=${encodeURIComponent(k)}" data-link class="kdoc-pill" style="text-decoration:none;color:var(--accent-indigo);">#${this._esc(k)}</a>`).join('')}
                    </div>` : ''}
                </div>

                ${fetchError ? `<div class="kdoc-err">⚠ No s'ha pogut carregar el contingut del fitxer · ${this._esc(fetchError)}. Prova el link a GitHub.</div>` : ''}

                <div class="kdoc-body">${rendered?.bodyHtml || ''}</div>

                <div class="kdoc-footer">
                    <span class="kdoc-ext">📄 <code>knowledge/${this._esc(item.relpath)}</code></span>
                    ${githubUrl ? `<a href="${this._esc(githubUrl)}" target="_blank" rel="noopener" class="kdoc-github">📎 Veure original a GitHub →</a>` : ''}
                </div>
            </div>
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
                    <div class="nv-label">Contingut · vista humana</div>
                    <div style="font-size:0.86rem;line-height:1.55;">${this._renderHumanContent(c)}</div>
                </div>

                <details class="nv-card" style="padding:0;">
                    <summary style="cursor:pointer;padding:1rem 1.2rem;color:var(--text-secondary);font-size:0.85rem;">🔧 Veure JSON cru (debug)</summary>
                    <pre class="nv-json" style="margin:0 1.2rem 1rem 1.2rem;">${this._esc(JSON.stringify(n, null, 2))}</pre>
                </details>
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

    // _renderHumanContent · render del `content` d'un node com a key-value llegible
    // (en lloc de només JSON cru). KISS · 1 nivell de profunditat · skip claus
    // que ja es mostren al header (id · title · name · description · tags).
    _renderHumanContent(c) {
        if (!c || typeof c !== 'object') return '<em style="color:var(--text-muted);">— sense contingut —</em>';
        const skip = new Set(['id', 'title', 'name', 'nombre', 'description', 'summary', 'tags', 'createdAt', 'updatedAt']);
        const keys = Object.keys(c).filter(k => !skip.has(k));
        if (keys.length === 0) return '<em style="color:var(--text-muted);">— cap detall extra —</em>';
        const rows = keys.map(k => {
            const v = c[k];
            let html = '';
            if (v == null)                       html = '<span style="color:var(--text-muted);">—</span>';
            else if (typeof v === 'string')      html = this._esc(v);
            else if (typeof v === 'number')      html = '<span style="font-family:var(--font-mono);color:#22c55e;">' + v + '</span>';
            else if (typeof v === 'boolean')     html = v ? '✓' : '✗';
            else if (Array.isArray(v) && v.length === 0) html = '<span style="color:var(--text-muted);">[]</span>';
            else if (Array.isArray(v) && v.every(x => typeof x !== 'object')) {
                html = v.map(x => '<span style="background:rgba(99,102,241,0.12);padding:1px 6px;border-radius:4px;margin-right:3px;font-size:0.78rem;">' + this._esc(String(x)) + '</span>').join('');
            }
            else if (Array.isArray(v))           html = '<span style="color:var(--text-muted);">' + v.length + ' items (object) · obre el JSON debug per detall</span>';
            else if (typeof v === 'object')      html = '<span style="color:var(--text-muted);">{...} · obre el JSON debug per detall</span>';
            return `<div style="display:grid;grid-template-columns:160px 1fr;gap:10px;padding:5px 0;border-bottom:1px dashed rgba(255,255,255,0.05);">
                <div style="color:var(--text-secondary);font-family:var(--font-mono);font-size:0.78rem;">${this._esc(k)}</div>
                <div>${html}</div>
            </div>`;
        }).join('');
        return rows;
    }

    destroy() {}
}
