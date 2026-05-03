// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT HUB VIEW (UX-001 sprint C + MKT-001 sprint B)
// Ruta: /js/views/ProjectHubView.js · matchea /project/{projectId}
//
// Dashboard único del proyecto: confluyen las 5 vistas operativas (Mapa ·
// Kanban · SOPs · Mercado · Tags) y las 6 herramientas de constitución y
// gobernanza (Pacto · Constitución · Tokenómica · Contabilidad · Pools
// liquidez · Llançadora). Sprint C entrega la maqueta integrada con stats
// reales del KB y CTAs · sprint D irá implementando las herramientas (las
// que dependen de Gnosis las delegamos a MAT-001).
// =============================================================================

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import {
    aggregateProjectStats, projectViewUrls, PROJECT_TOOLS,
} from '../core/projectHubService.js';
import { renderNavLinksHtml } from '../core/navService.js';

export default class ProjectHubView {
    constructor() {
        document.title = 'Proyecto · SOS V11';
        this.projectId = null;
        this.project   = null;
        this.stats     = null;
    }

    async getHtml() {
        await store.init();
        await KB.init();
        const m = window.location.pathname.match(/^\/project\/(.+)$/);
        this.projectId = m ? decodeURIComponent(m[1]) : null;
        if (!this.projectId) return this._htmlError('URL malformada · esperado /project/{projectId}');

        const projects = (store.getState().projects || []);
        this.project = projects.find(p => p.id === this.projectId);
        if (!this.project) return this._htmlError(`Proyecto no encontrado: ${this._esc(this.projectId)}`);

        const allNodes = await KB.getAllNodes();
        this.stats = aggregateProjectStats({ projectId: this.projectId, nodes: allNodes });

        const p = this.project;
        const s = this.stats;
        const views = projectViewUrls(this.projectId);
        const sectorBadge = p.sector_id || p.based_on_sector ? `<span class="ph-badge">sector ${this._esc(p.sector_id || p.based_on_sector)}</span>` : '';
        const statusColor = p.cloneStatus === 'active' ? '#22c55e' : p.cloneStatus === 'draft' ? '#facc15' : '#94a3b8';

        return `
        <style>
            .ph-shell  { height:100dvh; background:#050507; color:#e6e6e6; font-family:var(--font-base,sans-serif); display:flex; flex-direction:column; overflow:hidden; }
            .ph-topbar { display:flex; align-items:center; gap:1rem; padding:1rem 1.5rem; border-bottom:1px solid #1a1a22; background:#08080c; flex-shrink:0; }
            .ph-logo   { font-weight:700; color:#fff; text-decoration:none; font-size:1.05rem; }
            .ph-logo span { color:#6366f1; }
            .ph-title  { color:#aaa; font-weight:500; letter-spacing:0.05em; text-transform:uppercase; font-size:0.78rem; }
            .ph-spacer { flex:1; }
            .ph-link   { color:#6366f1; text-decoration:none; font-size:0.85rem; }

            .ph-main   { padding:1.5rem; flex:1; overflow-y:auto; max-width:1300px; margin:0 auto; width:100%; box-sizing:border-box; }

            .ph-hero   { background:linear-gradient(145deg,rgba(99,102,241,0.06),rgba(0,0,0,0)); border:1px solid #1a1a22; border-radius:10px; padding:1.4rem; margin-bottom:1.5rem; }
            .ph-hero h1 { margin:0; color:#fff; font-size:1.5rem; }
            .ph-hero .meta { display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.5rem; align-items:center; }
            .ph-badge  { background:rgba(99,102,241,0.15); color:#a5b4fc; padding:3px 9px; border-radius:10px; font-size:0.7rem; font-family:monospace; border:1px solid rgba(99,102,241,0.3); }
            .ph-badge.status { background:rgba(34,197,94,0.12); color:${statusColor}; border-color:${statusColor}40; }

            .ph-stat-row { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:0.6rem; margin-top:1rem; }
            .ph-stat { background:#0e0e14; border:1px solid #1a1a22; border-left:3px solid var(--ph-c,#6366f1); border-radius:8px; padding:0.6rem 0.8rem; }
            .ph-stat .label { color:#888; font-size:0.7rem; font-family:monospace; text-transform:uppercase; letter-spacing:0.05em; }
            .ph-stat .value { color:#fff; font-size:1.25rem; font-weight:700; margin-top:0.2rem; }
            .ph-stat .sub   { color:#aaa; font-size:0.7rem; margin-top:0.15rem; }

            .ph-section h2 { margin:0 0 0.7rem 0; color:#fff; font-size:1rem; letter-spacing:0.02em; }
            .ph-section { margin-top:1.6rem; }

            .ph-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:0.7rem; }
            .ph-tile { display:flex; flex-direction:column; gap:0.3rem; background:#0e0e14; border:1px solid #1a1a22; border-radius:8px; padding:0.85rem; text-decoration:none; color:#e6e6e6; transition:background 0.15s, border-color 0.15s; cursor:pointer; }
            .ph-tile:hover { background:#13131a; border-color:#2a2a35; }
            .ph-tile .icon { font-size:1.5rem; line-height:1; }
            .ph-tile .ttl  { color:#fff; font-weight:700; font-size:0.92rem; }
            .ph-tile .hint { color:#888; font-size:0.72rem; line-height:1.3; }
            .ph-tile.stub  { opacity:0.7; cursor:default; }
            .ph-tile.stub:hover { background:#0e0e14; }
            .ph-tile.stub .stub-pill { display:inline-block; font-size:0.62rem; padding:1px 6px; border-radius:8px; background:rgba(250,204,21,0.12); color:#facc15; margin-top:0.3rem; align-self:flex-start; }

            .ph-list { display:flex; flex-direction:column; gap:0.4rem; }
            .ph-item { background:#0e0e14; border:1px solid #1a1a22; border-radius:6px; padding:0.55rem 0.8rem; display:flex; gap:0.6rem; align-items:center; text-decoration:none; color:#e6e6e6; font-size:0.85rem; }
            .ph-item:hover { background:#13131a; }
            .ph-item .pname { color:#fff; flex:1; }
            .ph-item .pmeta { color:#888; font-size:0.72rem; font-family:monospace; }
        </style>

        <div class="ph-shell">
            <div class="ph-topbar">
                <a href="/" data-link class="ph-logo">🗼 Team<span>Towers</span></a>
                <span class="ph-title">Proyecto · panel</span>
                <div class="ph-spacer"></div>
                ${renderNavLinksHtml({ active: '', projectId: this.projectId, className: 'ph-link' })}
                <a href="/n/${encodeURIComponent(p.id)}" data-link class="ph-link">📂 Nodo</a>
            </div>

            <div class="ph-main">
                <div class="ph-hero">
                    <h1>${this._esc(p.nombre || p.name || p.id)}</h1>
                    <div class="meta">
                        <span class="ph-badge status">● ${this._esc(p.cloneStatus || 'active')}</span>
                        ${sectorBadge}
                        ${p.readinessAtClone ? `<span class="ph-badge">${this._esc(p.readinessAtClone).toUpperCase()}</span>` : ''}
                        <span style="color:#888;font-family:monospace;font-size:0.72rem;">id: ${this._esc(p.id)}</span>
                    </div>

                    <div class="ph-stat-row">
                        <div class="ph-stat" style="--ph-c:#6366f1;">
                            <div class="label">Roles VNA</div>
                            <div class="value">${(p.vna_roles || []).length}</div>
                        </div>
                        <div class="ph-stat" style="--ph-c:#a5b4fc;">
                            <div class="label">Transacciones</div>
                            <div class="value">${(p.vna_transactions || []).length}</div>
                        </div>
                        <div class="ph-stat" style="--ph-c:#22c55e;">
                            <div class="label">SOPs</div>
                            <div class="value">${s.sops}</div>
                        </div>
                        <div class="ph-stat" style="--ph-c:#facc15;">
                            <div class="label">Work Orders</div>
                            <div class="value">${s.workOrders.total}</div>
                            <div class="sub">${s.workOrders.backlog} backlog · ${s.workOrders.doing} doing · ${s.workOrders.done} done · ${s.workOrders.ledgered} ledger</div>
                        </div>
                        <div class="ph-stat" style="--ph-c:#7dd3fc;">
                            <div class="label">Ofertas Mercado</div>
                            <div class="value">${s.marketItems.count}</div>
                        </div>
                        <div class="ph-stat" style="--ph-c:#86efac;">
                            <div class="label">Ahorro acumulado</div>
                            <div class="value">${s.savingEur.toFixed(2)} €</div>
                            <div class="sub">${s.woRolesAi} WOs IA · ${s.woRolesHuman} humanas</div>
                        </div>
                    </div>
                </div>

                <div class="ph-section">
                    <h2>Vistas operativas</h2>
                    <div class="ph-grid">
                        ${views.map(v => `
                            <a class="ph-tile" href="${v.url}" data-link>
                                <div class="icon">${v.icon}</div>
                                <div class="ttl">${this._esc(v.title)}</div>
                                <div class="hint">${this._esc(v.hint)}</div>
                            </a>`).join('')}
                    </div>
                </div>

                <div class="ph-section">
                    <h2>Herramientas de gobernanza y exit</h2>
                    <div class="ph-grid">
                        ${PROJECT_TOOLS.map(t => `
                            <div class="ph-tile ${t.stub ? 'stub' : ''}" ${t.stub ? '' : 'data-tool="' + t.id + '"'}>
                                <div class="icon">${t.icon}</div>
                                <div class="ttl">${this._esc(t.title)}</div>
                                <div class="hint">${this._esc(t.hint)}</div>
                                ${t.stub ? '<span class="stub-pill">🚧 próximamente · sprint D / MAT-001</span>' : ''}
                            </div>`).join('')}
                    </div>
                </div>

                ${s.marketItems.count ? `
                    <div class="ph-section">
                        <h2>Ofertas publicadas (${s.marketItems.count})</h2>
                        <div class="ph-list">
                            ${s.marketItems.list.map(it => {
                                const c = it.content || {};
                                return `
                                    <a class="ph-item" href="/n/${encodeURIComponent(it.id)}" data-link>
                                        <span style="font-size:1.1rem;">${c.kind === 'workshop' ? '🎓' : c.kind === 'product' ? '📦' : c.kind === 'template' ? '📋' : c.kind === 'skill' ? '🤲' : c.kind === 'subscription' ? '🔁' : '💡'}</span>
                                        <span class="pname">${this._esc(c.title || it.id)}</span>
                                        <span class="pmeta">${c.cnae ? 'CNAE ' + this._esc(c.cnae) + ' · ' : ''}${c.priceEur != null ? c.priceEur + ' €' : '— €'}</span>
                                    </a>`;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

                ${s.sops > 0 ? `
                    <div class="ph-section">
                        <h2>SOPs del proyecto (${s.sops})</h2>
                        <div class="ph-list">
                            ${s.sopsList.slice(0, 8).map(n => `
                                <a class="ph-item" href="/sops?project=${encodeURIComponent(this.projectId)}&focus=${encodeURIComponent(n.id)}" data-link>
                                    <span style="font-size:1rem;">📜</span>
                                    <span class="pname">${this._esc(n.content?.name || n.id)}</span>
                                    <span class="pmeta">rol ${this._esc(n.content?.role_ref || '?')} · ${(n.content?.steps || []).length} steps</span>
                                </a>`).join('')}
                            ${s.sops > 8 ? `<a class="ph-link" href="/sops?project=${encodeURIComponent(this.projectId)}" data-link style="text-align:center;padding:0.5rem;">Ver los ${s.sops} SOPs ›</a>` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>`;
    }

    async afterRender() {
        // Tools no-stub click → navegar a su route
        document.querySelectorAll('.ph-tile[data-tool]').forEach(el => {
            const tool = PROJECT_TOOLS.find(t => t.id === el.dataset.tool);
            if (tool && tool.route) {
                el.addEventListener('click', () => {
                    if (window.navigateTo) window.navigateTo(tool.route + encodeURIComponent(this.projectId));
                });
            }
        });
    }

    _htmlError(msg) {
        return `
        <div style="height:100dvh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;color:#888;font-family:monospace;background:#050507;">
            <div style="font-size:2.5rem;">🔍</div>
            <div style="color:#fca5a5;">${msg}</div>
            <a href="/dashboard" data-link style="color:#6366f1;font-size:0.85rem;">← Dashboard</a>
        </div>`;
    }

    _esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }

    destroy() {}
}
