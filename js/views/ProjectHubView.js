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
import { renderNavLinksHtml, renderNavGroupedHtml, ensureNavGroupStyle, bindNavGroupDropdowns } from '../core/navService.js';
import { listSeats, listAvailableSeats, seedDemoSeatsToKb, extractSwarmInput, persistAssignments, listProjectAssignments } from '../core/cohortSeatService.js';
import { getProjectTypeById } from '../core/critical108Roles.js';

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

        // MAT-003 sprint F · datos del enjambre + bootstrap meta
        const projectNodes = allNodes.filter(n => n.projectId === this.projectId);
        const seatNodes    = allNodes.filter(n => n?.type === 'cohort_seat');
        const memberNodes  = allNodes.filter(n => n?.type === 'matriu_member');
        const assignNodes  = allNodes.filter(n => n?.type === 'swarm_assignment' && n.projectId === this.projectId);
        this.swarmInput    = extractSwarmInput({ projectNodes, seatNodes });
        this.assignments   = assignNodes;
        this.totalSeats    = seatNodes.length + memberNodes.length;
        // MAT-002-I sprint C · resolver members del projecte (assigned via swarm_assignment + WO assignedToSeatId)
        const woNodes = allNodes.filter(n => n?.type === 'work_order' && n.projectId === this.projectId);
        const memberIdsInProject = new Set();
        for (const a of assignNodes) {
            if (a?.content?.seatId) memberIdsInProject.add(a.content.seatId);
        }
        for (const w of woNodes) {
            if (w?.content?.assignedToSeatId) memberIdsInProject.add(w.content.assignedToSeatId);
        }
        // Lookup index · accept seats and members
        const seatById = new Map([...seatNodes, ...memberNodes].map(n => [n.id, n]));
        this.projectMembers = Array.from(memberIdsInProject)
            .map(id => seatById.get(id))
            .filter(Boolean);
        // Si el projecte té ownerMemberId, incloure el owner aunque no tingui WO/assignment
        const ownerId = this.project?.ownerMemberId;
        if (ownerId && seatById.has(ownerId) && !this.projectMembers.find(m => m.id === ownerId)) {
            this.projectMembers.unshift(seatById.get(ownerId));
        }

        const p = this.project;
        const s = this.stats;
        const views = projectViewUrls(this.projectId);
        const sectorBadge = p.sector_id || p.based_on_sector ? `<span class="ph-badge">sector ${this._esc(p.sector_id || p.based_on_sector)}</span>` : '';
        const statusColor = p.cloneStatus === 'active' ? '#22c55e' : p.cloneStatus === 'draft' ? '#facc15' : '#94a3b8';

        return `
        <style>
            .ph-shell  { height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); display:flex; flex-direction:column; overflow:hidden; }
            .ph-topbar { display:flex; align-items:center; gap:1rem; padding:0.85rem 1.5rem; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-shrink:0; }
            .ph-logo   { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .ph-logo span { color:var(--accent-indigo); }
            .ph-title  { color:var(--text-secondary); font-weight:600; letter-spacing:0.05em; text-transform:uppercase; font-size:0.78rem; }
            .ph-spacer { flex:1; }
            .ph-link   { color:var(--accent-indigo); text-decoration:none; font-size:0.85rem; }

            .ph-main   { padding:1.5rem; flex:1; overflow-y:auto; max-width:1300px; margin:0 auto; width:100%; box-sizing:border-box; }

            .ph-hero   { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:var(--radius-lg); padding:1.4rem; margin-bottom:1.5rem; box-shadow:var(--shadow-sm); }
            .ph-hero h1 { margin:0; color:var(--text-main); font-size:1.5rem; letter-spacing:-0.01em; }
            .ph-hero .meta { display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.5rem; align-items:center; }
            .ph-badge  { background:rgba(99,102,241,0.15); color:var(--accent-indigo); padding:3px 9px; border-radius:10px; font-size:0.72rem; font-family:var(--font-mono); border:1px solid rgba(99,102,241,0.3); }
            .ph-badge.status { background:rgba(16,185,129,0.12); color:${statusColor}; border-color:${statusColor}40; }

            .ph-stat-row { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:0.6rem; margin-top:1rem; }
            .ph-stat { background:var(--bg-panel); border:1px solid var(--border-default); border-left:3px solid var(--ph-c,var(--accent-indigo)); border-radius:var(--radius-md); padding:0.7rem 0.9rem; box-shadow:var(--shadow-sm); }
            .ph-stat .label { color:var(--text-muted); font-size:0.72rem; font-family:var(--font-mono); text-transform:uppercase; letter-spacing:0.05em; font-weight:600; }
            .ph-stat .value { color:var(--text-main); font-size:1.25rem; font-weight:700; margin-top:0.2rem; }
            .ph-stat .sub   { color:var(--text-secondary); font-size:0.72rem; margin-top:0.15rem; }

            .ph-section h2 { margin:0 0 0.7rem 0; color:var(--text-main); font-size:1.05rem; font-weight:700; letter-spacing:-0.01em; }
            .ph-member-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:var(--radius-md); padding:14px; transition:transform var(--dur-fast), border-color var(--dur-fast); box-shadow:var(--shadow-sm); }
            .ph-member-card:hover { transform:translateY(-1px); border-color:var(--accent-purple); }
            .ph-section { margin-top:1.6rem; }

            .ph-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:0.7rem; }
            .ph-tile { display:flex; flex-direction:column; gap:0.3rem; background:var(--bg-panel); border:1px solid var(--border-default); border-radius:var(--radius-md); padding:0.85rem; text-decoration:none; color:var(--text-main); transition:all var(--dur-fast); cursor:pointer; box-shadow:var(--shadow-sm); }
            .ph-tile:hover { background:var(--glass-hover); border-color:var(--accent-indigo); transform:translateY(-1px); }
            .ph-tile .icon { font-size:1.5rem; line-height:1; }
            .ph-tile .ttl  { color:var(--text-main); font-weight:700; font-size:0.95rem; }
            .ph-tile .hint { color:var(--text-muted); font-size:0.78rem; line-height:1.4; }
            .ph-tile.stub  { opacity:0.7; cursor:default; }
            .ph-tile.stub:hover { background:var(--bg-panel); transform:none; }
            .ph-tile.stub .stub-pill { display:inline-block; font-size:0.65rem; padding:1px 6px; border-radius:8px; background:rgba(251,191,36,0.12); color:var(--accent-yellow); margin-top:0.3rem; align-self:flex-start; }

            .ph-list { display:flex; flex-direction:column; gap:0.4rem; }
            .ph-item { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:var(--radius-sm); padding:0.6rem 0.85rem; display:flex; gap:0.6rem; align-items:center; text-decoration:none; color:var(--text-main); font-size:0.9rem; transition:background var(--dur-fast); }
            .ph-item:hover { background:var(--glass-hover); }
            .ph-item .pname { color:var(--text-main); flex:1; }
            .ph-item .pmeta { color:var(--text-muted); font-size:0.75rem; font-family:var(--font-mono); }
        </style>

        <div class="ph-shell">
            <div class="ph-topbar">
                <a href="/" data-link class="ph-logo">🗼 Team<span>Towers</span></a>
                <span class="ph-title">⚙ Admin del projecte</span>
                <div class="ph-spacer"></div>
                <a href="/presentation?project=${encodeURIComponent(p.id)}" data-link class="ph-link" style="font-weight:700;">👁 Veure presentació pública →</a>
                <span style="color:var(--text-muted);">·</span>
                <a href="/n/${encodeURIComponent(p.id)}" data-link class="ph-link">📂 Nodo</a>
            </div>

            <div class="ph-main">
                <!-- PRESENTATION-HUB-001 · banner orientació · separar admin de presentació pública -->
                <div style="background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(168,85,247,0.06));border:1px solid var(--border-default);border-left:3px solid var(--accent-indigo);border-radius:var(--radius-md);padding:0.85rem 1.1rem;margin-bottom:1.5rem;display:flex;gap:1rem;align-items:center;flex-wrap:wrap;">
                    <span style="font-size:1.2rem;">⚙</span>
                    <div style="flex:1;min-width:240px;">
                        <div style="font-weight:800;color:var(--text-main);font-size:0.95rem;">Admin tècnic del projecte</div>
                        <div style="color:var(--text-muted);font-size:11px;line-height:1.5;margin-top:2px;">Operacions tècniques · enjambre IA · publicació permaweb · vistes operatives. La <strong>presentació pública</strong> (hero, productes, equip, slicing pie) viu a <a href="/presentation?project=${encodeURIComponent(p.id)}" data-link style="color:var(--accent-indigo);">/presentation</a> · la <strong>qualitat</strong> a <a href="/quality?project=${encodeURIComponent(p.id)}" data-link style="color:var(--accent-indigo);">/quality</a>.</div>
                    </div>
                </div>
                <!-- PROJ-CONFIG-001 · hero compacte · stats + members viuen a /presentation -->
                <div class="ph-hero" style="padding:1rem 1.2rem;">
                    <h1 class="mat-hero-h1" style="font-size:1.15rem;">${this._esc(p.nombre || p.name || p.id)}</h1>
                    <div class="meta">
                        <span class="ph-badge status">● ${this._esc(p.cloneStatus || 'active')}</span>
                        ${sectorBadge}
                        ${p.readinessAtClone ? `<span class="ph-badge">${this._esc(p.readinessAtClone).toUpperCase()}</span>` : ''}
                        <span style="color:#888;font-family:monospace;font-size:0.72rem;">id: ${this._esc(p.id)}</span>
                        <span style="margin-left:auto;font-size:0.7rem;color:#facc15;padding:2px 8px;background:rgba(250,204,21,0.15);border:1px solid rgba(250,204,21,0.35);border-radius:999px;font-weight:700;">CLÀSSIC · power-user</span>
                        <a href="/project/${encodeURIComponent(p.id)}" data-link class="ph-link" style="font-weight:700;color:var(--accent-indigo);" title="Project Hub V2 (default) · 7-zones · 5-click rule">← Hub v2 (default)</a>
                        <a href="/presentation?project=${encodeURIComponent(p.id)}" data-link class="ph-link" style="font-weight:700;">👁 Veure presentació pública →</a>
                    </div>
                </div>

                ${this._renderSwarmSection()}

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

                <!-- PRESENTATION-HUB-001 · les llistes de ofertes/SOPs ara viuen
                     a /presentation · evitem duplicació. Si s'està buscant un SOP
                     concret · /sops té el llistat editable. -->
                ${(s.marketItems.count || s.sops > 0) ? `
                    <div class="ph-section">
                        <h2>📚 Contingut del projecte</h2>
                        <p style="color:var(--text-secondary);font-size:0.82rem;line-height:1.6;margin:0 0 0.7rem 0;">
                            La presentació pública dels productes/SOPs/equip viu a <a href="/presentation?project=${encodeURIComponent(p.id)}" data-link style="color:var(--accent-indigo);font-weight:700;">/presentation</a>. Aquí pots accedir a les vistes operatives per editar.
                        </p>
                        <div class="ph-grid">
                            ${s.marketItems.count ? `<a class="ph-tile" href="/market?project=${encodeURIComponent(p.id)}" data-link><div class="icon">🛍</div><div class="ttl">${s.marketItems.count} ofertes al market</div><div class="hint">Edita productes, serveis i preus</div></a>` : ''}
                            ${s.sops > 0 ? `<a class="ph-tile" href="/sops?project=${encodeURIComponent(p.id)}" data-link><div class="icon">📜</div><div class="ttl">${s.sops} SOPs del projecte</div><div class="hint">Edita / regenera SOPs amb IA</div></a>` : ''}
                        </div>
                    </div>
                ` : ''}

                <div class="ph-section">
                    <h2>🚀 Federation · publica al permaweb</h2>
                    <p style="color:var(--text-secondary);font-size:0.85rem;line-height:1.6;margin:0 0 0.7rem 0;">
                        Publica la "part pública" del projecte al permaweb perquè altres operadors SOS puguin descobrir-lo a <a href="/opportunities" data-link style="color:var(--accent-indigo);">/oportunitats</a>. Camps safe: nom · descripció · sector · skills/sectors que busques. <strong>NO</strong> es publica · workOrders · ledger · wallets · contributions. Cost <strong>${0.05.toFixed(2)}€</strong> · es descompta del wallet d'aquest projecte.
                    </p>
                    <div id="phPermawebBody" style="background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-md);padding:0.85rem 1rem;">
                        <div style="color:var(--text-muted);font-style:italic;">Carregant estat…</div>
                    </div>
                </div>

                <!-- PUBLISH-SELECT-001 · publicació selectiva (WO + Market + Workshop) -->
                <div class="ph-section">
                    <h2>📤 Publica continguts a /oportunitats</h2>
                    <p style="color:var(--text-secondary);font-size:0.85rem;line-height:1.6;margin:0 0 0.7rem 0;">
                        Publica work orders obertes, productes i workshops al permaweb perquè altres operadors els puguin trobar a <a href="/opportunities" data-link style="color:var(--accent-indigo);">/oportunitats</a>.
                        Cost · WO 0,02€ · Market 0,03€ · Workshop 0,04€ · usuaris <strong>Free paguen ×1.5 fee</strong>, Pro/Coop preu base. Es desconta del wallet del projecte.
                    </p>
                    <div id="phSelectivePublishBody" style="background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-md);padding:0.85rem 1rem;">
                        <div style="color:var(--text-muted);font-style:italic;">Carregant entitats publicables…</div>
                    </div>
                </div>
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

        // FUND-FLOW-001 sprint F · permaweb publish card
        this._renderPermawebPublishCard().catch(e => console.warn('[ph] permaweb publish', e));
        // PUBLISH-SELECT-001 · publicació selectiva (WO + Market + Workshop)
        this._renderSelectivePublishCard().catch(e => console.warn('[ph] selective publish', e));

        // MAT-003 sprint F · handlers de la sección Enjambre
        document.getElementById('phSeedSeats')?.addEventListener('click', () => this._handleSeedSeats());
        document.getElementById('phActivateSwarm')?.addEventListener('click', () => this._handleActivateSwarm());
        document.getElementById('phSwarmModalClose')?.addEventListener('click', () => this._closeSwarmModal());
        document.getElementById('phSwarmModalApply')?.addEventListener('click', () => this._applySwarmMatching());
        const modal = document.getElementById('phSwarmModal');
        modal?.addEventListener('click', (e) => { if (e.target === modal) this._closeSwarmModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this._closeSwarmModal(); });

        // SWARM-DISCOVERY sprint A · render del panell de descoberta
        // (fire-and-forget · panel "Projectes afins · propostes de connexió")
        this._renderSwarmDiscoveryPanel().catch(e => console.warn('[ph] swarm discovery', e?.message));
    }

    // ── MAT-003 sprint F UI · Enjambre Cohort 0 ────────────────────

    // MAT-002-I sprint C · membres del projecte (matriu_member + cohort_seat amb fit)
    _renderProjectMembersSection() {
        const members = this.projectMembers || [];
        const owner = this.project?.ownerMemberId;
        return `
        <div class="ph-section ph-members">
            <h2>👥 Membres del projecte <span style="color:#888;font-weight:400;font-size:0.85rem;">· nucli humà</span>
                <a href="/matriu/network" data-link class="ph-link" style="float:right;font-size:0.78rem;">🌐 Veure tota la xarxa →</a>
            </h2>
            ${members.length === 0 ? `
                <div style="background:rgba(255,255,255,0.04);border:1px dashed rgba(255,255,255,0.15);border-radius:8px;padding:1rem 1.2rem;color:#888;font-size:0.85rem;">
                    Encara no hi ha membres assignats. Activa l'enjambre IA (sota) o assigna manualment plaçes als WOs del Kanban.
                </div>
            ` : `
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;">
                    ${members.map(m => this._renderMemberCard(m, m.id === owner)).join('')}
                </div>
            `}
        </div>
        `;
    }

    _renderMemberCard(member, isOwner = false) {
        const c = member.content || {};
        const guardianColor = {
            afrodita:'#c25a3a', apolo:'#fbbf24', atenea:'#5a6e4f', demeter:'#8b9a3a',
            dionisio:'#a855f7', hebe:'#ec4899', hefesto:'#9c5a2c', hera:'#2c4a7a',
            hermes:'#22c55e', hestia:'#d4a853', poseidon:'#0e7490', zeus:'#dc2626',
        }[c.guardianOf] || '#888';
        const initials = (c.displayName || member.id).split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
        const skills = (c.skillsDeclared || []).slice(0, 4);
        const woCount = 0;   // simplificat · sprint C complet podria comptar WOs assignats
        const projectAssigns = this.assignments.filter(a => a?.content?.seatId === member.id);
        const fitMax = projectAssigns.reduce((max, a) => Math.max(max, a?.content?.fit || 0), 0);
        return `
            <div class="ph-member-card">
                <header style="display:grid;grid-template-columns:42px 1fr auto;gap:10px;align-items:center;padding-bottom:6px;border-bottom:2px solid ${guardianColor}55;">
                    <div style="width:42px;height:42px;border-radius:50%;background:${guardianColor};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.95rem;">${this._esc(initials)}</div>
                    <div style="min-width:0;">
                        <div style="font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-size:1.05rem;color:#fff;line-height:1.2;">${this._esc(c.displayName || member.id)}</div>
                        <div style="font-family:monospace;font-size:0.7rem;color:#888;margin-top:2px;">${this._esc(c.handle || member.id.slice(-12))}</div>
                    </div>
                    ${isOwner ? '<span class="ph-badge" style="background:rgba(192,132,252,0.18);color:var(--accent-purple);border:1px solid rgba(192,132,252,0.4);">★ owner</span>' : ''}
                </header>
                ${c.guardianOf ? `<div style="font-family:monospace;font-size:0.72rem;color:${guardianColor};margin-top:8px;text-transform:uppercase;letter-spacing:0.05em;">⚡ ${this._esc(c.guardianOf)}</div>` : ''}
                ${c.bio ? `<p style="font-size:0.82rem;color:#aaa;line-height:1.5;margin:8px 0;">${this._esc(c.bio)}</p>` : ''}
                ${skills.length > 0 ? `
                    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">
                        ${skills.map(sk => `<span style="background:rgba(255,255,255,0.06);color:#bbb;padding:2px 8px;border-radius:99px;font-family:monospace;font-size:0.7rem;">${this._esc(sk)}</span>`).join('')}
                        ${(c.skillsDeclared || []).length > 4 ? `<span style="background:rgba(192,132,252,0.12);color:var(--accent-purple);padding:2px 8px;border-radius:99px;font-family:monospace;font-size:0.7rem;">+${(c.skillsDeclared || []).length - 4}</span>` : ''}
                    </div>
                ` : ''}
                ${fitMax > 0 ? `<div style="margin-top:8px;font-family:monospace;font-size:0.72rem;color:#fbbf24;">fit ${(fitMax * 100).toFixed(0)}% · ${projectAssigns.length} role${projectAssigns.length !== 1 ? 's' : ''}</div>` : ''}
            </div>
        `;
    }

    _renderSwarmSection() {
        const meta = this.swarmInput?.bootstrapMeta;
        const projectType = meta?.typeId ? getProjectTypeById(meta.typeId) : null;
        const requiredGuardians = meta?.requiredGuardians || [];
        const requiredRolesCount = (this.swarmInput?.requiredRoles || []).length;
        const totalSeats = this.totalSeats || 0;
        const assignmentsCount = (this.assignments || []).length;

        return `
        <div class="ph-section ph-swarm">
            <h2>🐝 Enjambre Cohort 0 <span style="color:#888;font-weight:400;font-size:0.85rem;">· matchmaker IA proyecto ↔ enjambre</span></h2>
            ${meta ? `
                <div style="background:rgba(192,132,252,0.06);border:1px solid rgba(192,132,252,0.25);border-radius:8px;padding:1rem 1.2rem;margin-bottom:1rem;font-size:0.85rem;">
                    <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px;color:#c8c8d4;">
                        <strong style="color:var(--accent-purple);font-family:monospace;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Tipus</strong>
                        <span>${this._esc(projectType?.label || meta.typeId)}</span>
                        <strong style="color:var(--accent-purple);font-family:monospace;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Sectors</strong>
                        <span>${this._esc((meta.sectorAffinity || []).join(' · ') || '—')}</span>
                        <strong style="color:var(--accent-purple);font-family:monospace;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Guardians</strong>
                        <span>${(requiredGuardians.map(g => `<span class="ph-badge" style="background:rgba(192,132,252,0.18);color:var(--accent-purple);border:1px solid rgba(192,132,252,0.4);">${this._esc(g)}</span>`)).join(' ') || '—'}</span>
                        <strong style="color:var(--accent-purple);font-family:monospace;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Setmanes est.</strong>
                        <span>${meta.expectedOutcomes?.weeksToOperateMin ?? '?'}–${meta.expectedOutcomes?.weeksToOperateMax ?? '?'}</span>
                    </div>
                </div>
            ` : `
                <div style="background:rgba(255,255,255,0.04);border:1px dashed rgba(255,255,255,0.15);border-radius:8px;padding:1rem 1.2rem;margin-bottom:1rem;color:#888;font-size:0.85rem;">
                    Aquest projecte no té bootstrap meta · activar enjambre funcionarà amb els roles que tu definis al mapa de valor.
                </div>
            `}

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0.8rem;margin-bottom:1rem;">
                <div class="ph-stat" style="--ph-c:#c084fc;">
                    <div class="label">Roles requerits</div>
                    <div class="value">${requiredRolesCount}</div>
                </div>
                <div class="ph-stat" style="--ph-c:#fbbf24;">
                    <div class="label">Plaçes Cohort 0</div>
                    <div class="value">${totalSeats}</div>
                    <div class="sub">disponibles a la KB</div>
                </div>
                <div class="ph-stat" style="--ph-c:#22c55e;">
                    <div class="label">Assignacions</div>
                    <div class="value">${assignmentsCount}</div>
                    <div class="sub">role ↔ seat persistides</div>
                </div>
            </div>

            <div style="display:flex;gap:0.6rem;flex-wrap:wrap;align-items:center;">
                <button id="phActivateSwarm" class="ph-link" style="background:linear-gradient(135deg,#c084fc,#6366f1);color:#fff;border:0;padding:10px 20px;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.9rem;">
                    🐝 Activar enjambre IA
                </button>
                ${totalSeats === 0 ? `
                    <button id="phSeedSeats" class="ph-link" style="background:rgba(251,191,36,0.12);border:1px solid #fbbf24;color:#fbbf24;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;font-size:0.85rem;">
                        ⚡ Seed 5 plaçes demo
                    </button>
                ` : ''}
                <span style="color:#666;font-size:0.78rem;">
                    ${totalSeats === 0
                        ? 'Encara no hi ha plaçes registrades · genera 5 demo per provar.'
                        : `${totalSeats} plaçes registrades · clica "Activar" per a córrer matchmaker.`}
                </span>
            </div>

            <!-- SWARM-DISCOVERY sprint A · panell de descobriment d'altres projectes afins -->
            <div id="phSwarmDiscovery" style="margin-top:1.4rem;border-top:1px dashed rgba(192,132,252,0.25);padding-top:1.2rem;">
                <h3 style="font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-size:1.2rem;color:var(--accent-purple);margin:0 0 0.6rem 0;">🔗 Projectes afins · propostes de connexió</h3>
                <div style="color:#888;font-size:0.78rem;line-height:1.5;margin-bottom:0.8rem;">
                    Altres projectes del SOS amb sectorial · skill · guardian overlap · pondera amb el trust score recursive (PageRank). Click → veure detall · CTA "connectar" (sprint B).
                </div>
                <div id="phSwarmDiscoveryBody" style="font-size:0.85rem;color:#888;">Carregant projectes afins…</div>
            </div>

            <!-- Modal matchmaker -->
            <div id="phSwarmModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;align-items:center;justify-content:center;backdrop-filter:blur(4px);">
                <div style="background:#0f0f15;border:1px solid rgba(192,132,252,0.3);border-radius:12px;padding:1.5rem;max-width:760px;width:calc(100% - 32px);max-height:90vh;overflow-y:auto;color:#e6e6e6;font-family:var(--font-base,sans-serif);">
                    <div style="display:flex;justify-content:space-between;align-items:start;gap:1rem;margin-bottom:1rem;">
                        <h3 style="font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-size:1.6rem;color:var(--accent-purple);margin:0;">🐝 Matchmaker · enjambre ↔ projecte</h3>
                        <button id="phSwarmModalClose" style="background:none;border:0;color:#888;cursor:pointer;font-size:1.4rem;line-height:1;">×</button>
                    </div>
                    <div id="phSwarmModalBody" style="font-size:0.88rem;line-height:1.55;">
                        <div style="color:#888;">…</div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    async _handleSeedSeats() {
        const btn = document.getElementById('phSeedSeats');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Seeding…'; }
        try {
            await seedDemoSeatsToKb(KB, 5);
            // Reload vista para refrescar contadores
            if (window.navigateTo) window.navigateTo(window.location.pathname + window.location.search);
            else window.location.reload();
        } catch (err) {
            console.error('[MAT-003 F] seedDemoSeats falló:', err);
            alert('Error generant plaçes demo: ' + (err?.message || err));
            if (btn) { btn.disabled = false; btn.textContent = '⚡ Seed 5 plaçes demo'; }
        }
    }

    _openSwarmModal() {
        const modal = document.getElementById('phSwarmModal');
        if (modal) modal.style.display = 'flex';
    }

    _closeSwarmModal() {
        const modal = document.getElementById('phSwarmModal');
        if (modal) modal.style.display = 'none';
    }

    _setSwarmModalBody(html) {
        const body = document.getElementById('phSwarmModalBody');
        if (body) body.innerHTML = html;
    }

    async _handleActivateSwarm() {
        this._openSwarmModal();
        this._setSwarmModalBody(`
            <div style="text-align:center;padding:2rem 0;">
                <div style="font-size:2rem;margin-bottom:0.6rem;">🧠</div>
                <div style="color:var(--accent-purple);">Carregant catàleg + plaçes…</div>
            </div>
        `);

        try {
            const seats = await listAvailableSeats(KB);
            if (!seats || seats.length === 0) {
                this._setSwarmModalBody(`
                    <p>No hi ha cap plaça disponible al KB.</p>
                    <p style="color:#888;font-size:0.82rem;">Tanca aquest modal i clica "⚡ Seed 5 plaçes demo" per generar el set inicial.</p>
                `);
                return;
            }
            const requiredRoles = this.swarmInput?.requiredRoles || [];
            const projectTypeId = this.swarmInput?.projectTypeId;
            if (requiredRoles.length === 0) {
                this._setSwarmModalBody(`
                    <p>Aquest projecte no té rols requerits declarats al bootstrap.</p>
                    <p style="color:#888;font-size:0.82rem;">Reserva el projecte des de /matriu amb un tipus seleccionat per a generar el bootstrap meta automàticament.</p>
                `);
                return;
            }
            if (!projectTypeId) {
                this._setSwarmModalBody(`
                    <p>El bootstrap meta no té projectTypeId.</p>
                `);
                return;
            }

            this._setSwarmModalBody(`
                <div style="text-align:center;padding:2rem 0;">
                    <div style="font-size:2rem;margin-bottom:0.6rem;">🤖</div>
                    <div style="color:var(--accent-purple);">L'agent IA està matching ${requiredRoles.length} roles ↔ ${seats.length} plaçes…</div>
                    <div style="color:#666;font-size:0.78rem;margin-top:0.4rem;">això pot trigar 10-30s segons el provider</div>
                </div>
            `);

            const swarmSeats = seats.map(s => ({
                id:             s.id,
                displayName:    s?.content?.displayName || s.id,
                skillsDeclared: s?.content?.skillsDeclared || [],
                guardianOf:     s?.content?.guardianOf || null,
                availability:   s?.content?.availability || 'normal',
            }));

            const { buildSwarmTeamForProject } = await import('../core/swarmMatchmaker.js?v=' + Date.now());
            const { Orchestrator } = await import('../core/Orchestrator.js?v=' + Date.now());
            const team = await buildSwarmTeamForProject({
                project: { id: this.projectId, name: this.project.nombre || this.project.name || this.projectId, description: this.project.description || '', sector: this.project.sector_id || null, phase: 'design' },
                projectTypeId,
                requiredRoles,
                swarmSeats,
                orchestrator: Orchestrator,
            });

            this._lastTeam = team;   // guardar para apply
            this._renderSwarmTeam(team, seats);
        } catch (err) {
            console.error('[MAT-003 F] activateSwarm falló:', err);
            this._setSwarmModalBody(`
                <p style="color:var(--accent-red);">Error: ${this._esc(err?.message || String(err))}</p>
                <p style="color:#888;font-size:0.78rem;">Comprova que tens la API key del provider configurada a /settings.</p>
            `);
        }
    }

    _renderSwarmTeam(team, seats) {
        const seatById = new Map((seats || []).map(s => [s.id, s]));
        const matchesHtml = (team.matches || []).map(m => {
            const seat = seatById.get(m.seatId);
            const seatLabel = seat?.content?.displayName || m.seatId;
            const fitColor = m.fit >= 0.85 ? '#22c55e' : (m.fit >= 0.6 ? '#fbbf24' : '#fca5a5');
            return `
                <tr>
                    <td style="padding:8px 10px;border-bottom:1px solid #1a1a22;">${this._esc(m.roleId.split('::').pop())}</td>
                    <td style="padding:8px 10px;border-bottom:1px solid #1a1a22;">${this._esc(seatLabel)}</td>
                    <td style="padding:8px 10px;border-bottom:1px solid #1a1a22;text-align:center;">
                        <span style="padding:2px 8px;border:1px solid ${m.primary ? '#c084fc' : '#666'};color:${m.primary ? '#c084fc' : '#888'};border-radius:99px;font-size:0.72rem;font-family:monospace;">${m.primary ? 'PRIMARY' : 'secondary'}</span>
                    </td>
                    <td style="padding:8px 10px;border-bottom:1px solid #1a1a22;text-align:right;color:${fitColor};font-family:monospace;">${m.fit.toFixed(2)}</td>
                    <td style="padding:8px 10px;border-bottom:1px solid #1a1a22;color:#aaa;font-size:0.82rem;">${this._esc(m.rationale || '')}</td>
                </tr>
            `;
        }).join('');

        const gapsHtml = (team.gaps && team.gaps.length > 0) ? `
            <div style="margin-top:1rem;padding:0.8rem;background:rgba(252,165,165,0.06);border:1px solid rgba(252,165,165,0.3);border-radius:6px;">
                <strong style="color:var(--accent-red);">Gaps · roles sense plaça:</strong>
                <span style="color:#ddd;">${team.gaps.map(g => this._esc(g.split('::').pop())).join(' · ')}</span>
            </div>
        ` : '';

        const cov = team.coverage || { coveredRoles: 0, totalRoles: 0, pct: 0 };
        const tel = team.telemetry || {};

        this._setSwarmModalBody(`
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.6rem;margin-bottom:1rem;">
                <div class="ph-stat" style="--ph-c:#c084fc;"><div class="label">Cobertura</div><div class="value">${cov.pct}%</div><div class="sub">${cov.coveredRoles}/${cov.totalRoles} roles</div></div>
                <div class="ph-stat" style="--ph-c:#22c55e;"><div class="label">Matches</div><div class="value">${(team.matches || []).length}</div></div>
                <div class="ph-stat" style="--ph-c:#fbbf24;"><div class="label">Provider</div><div class="value" style="font-size:1.05rem;">${this._esc(tel.provider || '?')}</div><div class="sub">${tel.latencyMs || 0}ms</div></div>
            </div>
            <p style="color:#aaa;line-height:1.55;margin-bottom:0.8rem;font-style:italic;">${this._esc(team.overallRationale || '')}</p>
            <table style="width:100%;border-collapse:collapse;margin-top:0.4rem;">
                <thead>
                    <tr style="color:#888;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em;font-family:monospace;">
                        <th style="padding:8px 10px;border-bottom:1px solid #2a2a32;text-align:left;">Rol</th>
                        <th style="padding:8px 10px;border-bottom:1px solid #2a2a32;text-align:left;">Plaça</th>
                        <th style="padding:8px 10px;border-bottom:1px solid #2a2a32;text-align:center;">Tipus</th>
                        <th style="padding:8px 10px;border-bottom:1px solid #2a2a32;text-align:right;">Fit</th>
                        <th style="padding:8px 10px;border-bottom:1px solid #2a2a32;text-align:left;">Per què</th>
                    </tr>
                </thead>
                <tbody>${matchesHtml}</tbody>
            </table>
            ${gapsHtml}
            <div style="display:flex;gap:0.6rem;justify-content:flex-end;margin-top:1.2rem;">
                <button id="phSwarmModalClose" style="background:none;border:1px solid #333;color:#aaa;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:0.85rem;">Cancel·lar</button>
                <button id="phSwarmModalApply" style="background:linear-gradient(135deg,#c084fc,#6366f1);color:#fff;border:0;padding:10px 20px;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.85rem;">✓ Aplicar matching · persistir al KB</button>
            </div>
        `);

        // Re-bind handlers
        document.getElementById('phSwarmModalClose')?.addEventListener('click', () => this._closeSwarmModal());
        document.getElementById('phSwarmModalApply')?.addEventListener('click', () => this._applySwarmMatching());
    }

    async _applySwarmMatching() {
        if (!this._lastTeam || !this._lastTeam.matches) return;
        const btn = document.getElementById('phSwarmModalApply');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Persistint…'; }
        try {
            await persistAssignments({ KB, projectId: this.projectId, matches: this._lastTeam.matches });
            this._setSwarmModalBody(`
                <div style="text-align:center;padding:2rem 0;">
                    <div style="font-size:2.4rem;color:#22c55e;margin-bottom:0.6rem;">✓</div>
                    <div style="color:#22c55e;font-weight:700;font-size:1.05rem;">${this._lastTeam.matches.length} assignacions persistides al KB</div>
                    <div style="color:#888;font-size:0.82rem;margin-top:0.4rem;">type='swarm_assignment' · projectId='${this._esc(this.projectId)}'</div>
                </div>
            `);
            setTimeout(() => {
                this._closeSwarmModal();
                if (window.navigateTo) window.navigateTo(window.location.pathname + window.location.search);
                else window.location.reload();
            }, 1400);
        } catch (err) {
            console.error('[MAT-003 F] persistAssignments falló:', err);
            alert('Error persistint: ' + (err?.message || err));
            if (btn) { btn.disabled = false; btn.textContent = '✓ Aplicar matching · persistir al KB'; }
        }
    }

    _htmlError(msg) {
        return `
        <div style="height:100dvh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;color:#888;font-family:monospace;background:#050507;">
            <div style="font-size:2.5rem;">🔍</div>
            <div style="color:var(--accent-red);">${msg}</div>
            <a href="/dashboard" data-link style="color:#6366f1;font-size:0.85rem;">← Dashboard</a>
        </div>`;
    }

    // SWARM-DISCOVERY sprint A · render del panell "🔗 Projectes afins"
    // a sota del matchmaker · llegeix projectes públics del KB + projects
    // visibles del store · calcula affinity (sector/skill/guardian) vs aquest
    // projecte · pondera amb trust score recursive (PageRank) · mostra top-5.
    async _renderSwarmDiscoveryPanel() {
        const body = document.getElementById('phSwarmDiscoveryBody');
        if (!body) return;
        try {
            const { rankAffinity } = await import('../core/swarmAffinityService.js');
            const { computeRecursiveTrustForBatch } = await import('../core/trustScoreService.js');
            const { KB } = await import('../core/kb.js');
            const { store } = await import('../core/store.js');
            const { visibleProjects } = await import('../core/projectFilter.js');

            // El projecte actual · target de la cerca
            const target = this.project || (this.projectId ? { id: this.projectId } : null);
            if (!target) { body.innerHTML = '<span style="color:#888;">Sense projecte actiu</span>'; return; }

            // Candidates · projectes locals (store) + entries públics del permaweb
            // (cross-device) merged · dedupe per id.
            const localProjects = visibleProjects(store.getState().projects || []);
            const publicEntries = await KB.query({ type: 'public_project_entry' }).catch(() => []);

            const candById = new Map();
            for (const p of localProjects) {
                if (p && p.id && p.id !== target.id) candById.set(p.id, p);
            }
            for (const e of publicEntries) {
                const c = e?.content || {};
                const pid = c.projectId || e.id;
                if (!pid || pid === target.id) continue;
                if (candById.has(pid)) continue;
                candById.set(pid, {
                    id:       pid,
                    nombre:   c.name,
                    content:  {
                        name:              c.name,
                        sectorId:          c.sectorId,
                        projectType:       c.projectType,
                        lookingForSkills:  c.lookingForSkills,
                        requiredGuardians: c.requiredGuardians,
                        description:       c.description,
                    },
                    arweaveTxId: c.arweaveTxId,
                });
            }
            const candidates = Array.from(candById.values());

            // Trust scores recursive · si falla, fallback sense trust
            let trustScores = null;
            try {
                const ids = candidates.map(c => c.id);
                const batch = await computeRecursiveTrustForBatch({ kb: KB, attestedIds: ids });
                trustScores = new Map();
                for (const id of ids) {
                    const t = batch[id];
                    if (t && typeof t.total === 'number') trustScores.set(id, t.total);
                }
            } catch (_) { trustScores = null; }

            // Affinity ranking
            const ranked = rankAffinity(target, candidates, { topN: 5, trustScores });

            if (ranked.length === 0) {
                body.innerHTML = `<div style="background:rgba(192,132,252,0.05);border:1px dashed rgba(192,132,252,0.25);border-radius:8px;padding:1rem 1.2rem;font-size:0.82rem;color:#888;line-height:1.5;">
                    Cap projecte afí encara · cal més projectes a la xarxa o ampliar la descripció (sector · skills · guardians) del teu projecte per al matching.
                    <br><br>
                    <a href="/opportunities?tab=projects" data-link style="color:var(--accent-indigo);font-weight:600;">Explora projectes públics →</a>
                </div>`;
                return;
            }

            const cards = ranked.map(r => {
                const p   = r.project;
                const c   = p.content || p;
                const pct = Math.round(r.finalScore * 100);
                const breakdown = r.affinity.breakdown;
                const trustBadge = r.trust > 0
                    ? `<span title="Trust score recursive (PageRank) · ${r.trust.toFixed(2)}" style="display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:999px;background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.30);font-size:10px;font-weight:700;font-family:var(--font-mono);">★ ${r.trust.toFixed(1)}</span>`
                    : '';
                const arwBadge = p.arweaveTxId
                    ? `<span title="Permaweb · ${this._esc(p.arweaveTxId)}" style="font-size:10px;color:var(--accent-indigo);font-family:var(--font-mono);">🌐</span>`
                    : '';
                const subtitle = [
                    c.sectorId ? 'sector ' + c.sectorId : null,
                    c.projectType,
                ].filter(Boolean).map(s => this._esc(s)).join(' · ');
                return `
                    <a href="/n/${encodeURIComponent(p.id)}" data-link style="text-decoration:none;color:inherit;display:flex;flex-direction:column;gap:6px;background:var(--bg-panel);border:1px solid var(--border-default);border-radius:8px;padding:10px 12px;transition:all var(--dur-fast);">
                        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
                            <strong style="font-size:0.88rem;color:var(--text-main);line-height:1.3;">${this._esc(c.name || c.nombre || p.id)}</strong>
                            <span style="background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;font-family:var(--font-mono);">${pct}%</span>
                        </div>
                        <div style="font-size:0.72rem;color:var(--text-muted);font-family:var(--font-mono);">${subtitle || '—'}</div>
                        <div style="font-size:0.70rem;color:var(--text-secondary);line-height:1.45;display:flex;flex-wrap:wrap;gap:6px;">
                            <span title="Sector overlap (Jaccard)">🏷 ${Math.round(breakdown.sectorScore*100)}%</span>
                            <span title="Skill overlap">🧠 ${Math.round(breakdown.skillScore*100)}%</span>
                            <span title="Guardian alignment">🌙 ${Math.round(breakdown.guardianScore*100)}%</span>
                            ${trustBadge}
                            ${arwBadge}
                        </div>
                    </a>`;
            }).join('');

            body.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;">${cards}</div>
                <div style="margin-top:10px;font-size:0.70rem;color:var(--text-muted);">
                    Top ${ranked.length} de ${candidates.length} candidats · affinity·0.7 + trust·0.3 (si attesters) · sector 50% · skill 30% · guardian 20%.
                </div>`;
        } catch (e) {
            console.warn('[swarm-discovery] failed', e);
            body.innerHTML = '<div style="color:var(--accent-orange);font-size:0.78rem;">⚠ ' + this._esc(e?.message || 'no s\'ha pogut carregar el panell de descoberta') + '</div>';
        }
    }

    _esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }

    // PUBLISH-SELECT-001 · publicació selectiva d'entitats lligades al projecte.
    // Mostra · llistat WOs (status='backlog' + 'doing'), market_items, workshops
    // amb checkboxes · cost agregat segons pricing per kind + plan free fee.
    // Botó "Publicar selecció" debita wallet del projecte i puja a Turbo
    // (real) o KB (mock) per cada entitat seleccionada.
    async _renderSelectivePublishCard() {
        const body = document.getElementById('phSelectivePublishBody');
        if (!body || !this.projectId) return;
        try {
            const {
                ENTITY_PUBLISH_PRICING, computeBatchPublishCost,
                buildPublicEntityEntry, publicEntityIdFor,
            } = await import('../core/publicEntityService.js');
            const { loadCurrentPlan } = await import('../core/stripeService.js');
            const planObj = await loadCurrentPlan().catch(() => null);
            const planId  = planObj?.planId || 'free';

            const [woNodes, marketNodes, wsNodes] = await Promise.all([
                KB.query({ type: 'work_order',  projectId: this.projectId }).catch(() => []),
                KB.query({ type: 'market_item' }).catch(() => []),
                KB.query({ type: 'workshop' }).catch(() => []),
            ]);
            // WO publicables · status='backlog' o 'doing' (oberts)
            const publishableWO = (woNodes || []).filter(w => {
                const st = w?.content?.status;
                return st === 'backlog' || st === 'doing';
            });
            const publishableMarket = (marketNodes || []).filter(m =>
                (m?.content?.projectId === this.projectId) || (m?.projectId === this.projectId)
            );
            const publishableWS = (wsNodes || []).filter(w =>
                (w?.content?.projectId === this.projectId) || (w?.projectId === this.projectId)
            );

            const renderItems = (items, kind) => {
                if (items.length === 0) {
                    return `<div style="color:var(--text-muted);font-style:italic;padding:6px 0;font-size:0.8rem;">Cap ${kind} publicable.</div>`;
                }
                return items.map(it => {
                    const c = it.content || {};
                    const title = c.title || c.name || it.id;
                    const isPublished = !!c.permawebTxId;
                    const sub = kind === 'work_order' ? ('status: ' + (c.status || '?'))
                              : kind === 'market_item' ? (c.kind + ' · ' + (c.priceEur || 0) + '€')
                              : ('tier: ' + (c.accessTier || 'public'));
                    return `<label style="display:flex;gap:8px;align-items:center;padding:5px 0;border-bottom:1px dashed var(--border-default);cursor:${isPublished ? 'not-allowed' : 'pointer'};opacity:${isPublished ? '0.6' : '1'};">
                        <input type="checkbox" data-publish-kind="${kind}" data-publish-id="${this._esc(it.id)}" ${isPublished ? 'disabled checked' : ''}>
                        <span style="flex:1;color:var(--text-main);font-size:0.85rem;">${this._esc(title)}</span>
                        <span style="color:var(--text-muted);font-size:0.72rem;font-family:var(--font-mono);">${this._esc(sub)}</span>
                        ${isPublished ? '<span style="color:#22c55e;font-size:0.72rem;">🌐 publicat</span>' : ''}
                    </label>`;
                }).join('');
            };

            const planBadge = planId === 'free'
                ? '<span style="background:rgba(251,191,36,0.15);color:var(--accent-yellow);padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;">Free · ×1.5 fee</span>'
                : '<span style="background:rgba(34,197,94,0.15);color:var(--accent-green);padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;">' + this._esc(planId) + ' · preu base</span>';

            body.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;">
                    <span style="font-weight:700;color:var(--text-main);font-size:0.85rem;">Pla actual:</span>
                    ${planBadge}
                    <span style="color:var(--text-muted);font-size:0.72rem;flex:1;">Pricing base · WO 0,02€ · Market 0,03€ · Workshop 0,04€</span>
                </div>

                <details open style="margin-bottom:6px;">
                    <summary style="cursor:pointer;color:var(--text-main);font-weight:700;font-size:0.85rem;padding:5px 0;">📋 Work Orders obertes (${publishableWO.length})</summary>
                    <div style="padding-left:14px;">${renderItems(publishableWO, 'work_order')}</div>
                </details>
                <details style="margin-bottom:6px;">
                    <summary style="cursor:pointer;color:var(--text-main);font-weight:700;font-size:0.85rem;padding:5px 0;">🛍 Productes / serveis (${publishableMarket.length})</summary>
                    <div style="padding-left:14px;">${renderItems(publishableMarket, 'market_item')}</div>
                </details>
                <details style="margin-bottom:6px;">
                    <summary style="cursor:pointer;color:var(--text-main);font-weight:700;font-size:0.85rem;padding:5px 0;">🎓 Workshops (${publishableWS.length})</summary>
                    <div style="padding-left:14px;">${renderItems(publishableWS, 'workshop')}</div>
                </details>

                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:10px;border-top:1px solid var(--border-default);gap:10px;flex-wrap:wrap;">
                    <div id="phPublishCostSummary" style="color:var(--text-muted);font-size:0.82rem;">Selecciona entitats per veure cost…</div>
                    <button id="phPublishSelectedBtn" class="ph-link" style="background:var(--accent-indigo);color:#fff;border:0;padding:8px 16px;border-radius:var(--radius-sm);cursor:pointer;font-weight:700;font-size:0.85rem;" disabled>📤 Publicar selecció</button>
                </div>
                <div id="phPublishStatus" style="margin-top:10px;font-size:0.78rem;display:none;"></div>
            `;

            // Bind checkboxes · update cost summary
            const updateCost = () => {
                const checked = body.querySelectorAll('input[type=checkbox][data-publish-kind]:checked:not(:disabled)');
                const items = {};
                checked.forEach(cb => {
                    const k = cb.getAttribute('data-publish-kind');
                    items[k] = (items[k] || 0) + 1;
                });
                const itemsArr = Object.keys(items).map(k => ({ kind: k, count: items[k] }));
                if (itemsArr.length === 0) {
                    document.getElementById('phPublishCostSummary').textContent = 'Selecciona entitats per veure cost…';
                    document.getElementById('phPublishSelectedBtn').disabled = true;
                    return;
                }
                const cost = computeBatchPublishCost({ items: itemsArr, planId });
                const partsTxt = cost.breakdown.map(b => b.count + '×' + b.kind + ' (' + b.subtotalEur.toFixed(3) + '€)').join(' + ');
                document.getElementById('phPublishCostSummary').innerHTML = '<strong>Total · ' + cost.totalEur.toFixed(3) + '€</strong> · ' + this._esc(partsTxt) + (cost.feeEur > 0 ? ' <span style="color:var(--accent-yellow);">(+' + cost.feeEur.toFixed(3) + '€ free fee)</span>' : '');
                document.getElementById('phPublishSelectedBtn').disabled = false;
            };
            body.querySelectorAll('input[type=checkbox][data-publish-kind]').forEach(cb => {
                cb.addEventListener('change', updateCost);
            });

            // Bind publish button
            document.getElementById('phPublishSelectedBtn')?.addEventListener('click', () =>
                this._handleSelectivePublish({ planId, woNodes: publishableWO, marketNodes: publishableMarket, wsNodes: publishableWS, computeBatchPublishCost, buildPublicEntityEntry })
            );
        } catch (e) {
            body.innerHTML = '<div style="color:var(--accent-orange);">⚠ ' + this._esc(e?.message || 'no s\'ha pogut carregar la publicació selectiva') + '</div>';
        }
    }

    // PUBLISH-SELECT-001 · executa la publicació selectiva amb plan check + wallet debit
    async _handleSelectivePublish({ planId, woNodes, marketNodes, wsNodes, computeBatchPublishCost, buildPublicEntityEntry }) {
        const status = document.getElementById('phPublishStatus');
        const btn    = document.getElementById('phPublishSelectedBtn');
        const setStatus = (msg, ok = true) => {
            if (!status) return;
            status.style.display = 'block';
            status.textContent = msg;
            status.style.color = ok ? 'var(--accent-green)' : 'var(--accent-red)';
        };
        try {
            // 1 · Recull seleccions
            const checked = document.querySelectorAll('#phSelectivePublishBody input[type=checkbox][data-publish-kind]:checked:not(:disabled)');
            const selected = [];
            checked.forEach(cb => {
                const kind = cb.getAttribute('data-publish-kind');
                const id   = cb.getAttribute('data-publish-id');
                const pool = kind === 'work_order' ? woNodes : (kind === 'market_item' ? marketNodes : wsNodes);
                const entity = pool.find(n => n.id === id);
                if (entity) selected.push({ kind, entity });
            });
            if (selected.length === 0) { setStatus('⚠ Cap entitat seleccionada', false); return; }

            // 2 · Plan check · si free, requereix permaweb-publish-paid (que retorna true pagant fee)
            const { canPerform } = await import('../core/planEnforcer.js');
            const op = (planId === 'free') ? 'permaweb-publish-paid' : 'permaweb-publish';
            const ok = canPerform({ planId, op });
            if (!ok.allowed) {
                setStatus('✗ Pla ' + planId + ' no permet ' + op, false);
                return;
            }

            // 3 · Cost agregat
            const items = {};
            for (const s of selected) items[s.kind] = (items[s.kind] || 0) + 1;
            const cost = computeBatchPublishCost({ items: Object.keys(items).map(k => ({ kind: k, count: items[k] })), planId });

            // 4 · Verificar saldo wallet
            const { getOrCreateWalletForProject, consumeAndPersist, refundWallet } = await import('../core/walletService.js');
            const wallet = await getOrCreateWalletForProject(this.projectId);
            const balance = Number(wallet.content?.balanceEur || 0);
            if (balance < cost.totalEur) {
                setStatus('✗ Saldo insuficient · cal ' + cost.totalEur.toFixed(3) + '€ · disponible ' + balance.toFixed(2) + '€ · ves a /wallet?project=' + this.projectId + ' a recarregar', false);
                return;
            }

            // 5 · Identity · auto-create si cal
            const { getOrCreateIdentity } = await import('../core/identityService.js');
            const { getOrCreateSigningKey } = await import('../core/projectIO.js');
            const identity = await getOrCreateIdentity();
            const did = identity?.content?.primaryDid || identity?.primaryDid;
            if (!did) { setStatus('✗ Identitat no s\'ha pogut crear', false); return; }
            const keyMeta = await getOrCreateSigningKey();

            // 6 · Debit wallet (un sol moviment agregat)
            btn.disabled = true; btn.textContent = '⏳ Pagant ' + cost.totalEur.toFixed(3) + '€…';
            const ref = 'selective-publish-' + Date.now().toString(36);
            await consumeAndPersist({
                projectId: this.projectId,
                amountEur: cost.totalEur,
                ref, source: 'selective-publish',
                note: 'Publicació selectiva · ' + selected.length + ' entitats',
            });

            // 7 · Per cada entity · sign + Turbo upload real (fallback mock si Turbo no disponible)
            //     TURBO-UNIFY-001 · usa turboUploadService unificat
            btn.textContent = '⏳ Publicant ' + selected.length + ' entitats…';
            const mockTxBase = 'mock-' + ref;
            const { signNode, canonicalizeNode } = await import('../core/nodeSigningService.js');
            const { uploadNodeToTurbo, buildSignedPayload, commonArweaveTags } = await import('../core/turboUploadService.js');
            let okCount = 0, errCount = 0;
            for (const s of selected) {
                try {
                    let node = buildPublicEntityEntry({
                        kind: s.kind,
                        entity: s.entity,
                        project: this.project,
                        ownerDid: did,
                        ownerPublicJwk: keyMeta.publicJwk,
                    });
                    const now = Date.now();
                    // Firma ECDSA P-256 abans del upload (TEA-SIGN-001)
                    try { node = await signNode({ node, privateJwk: keyMeta.privateJwk }); }
                    catch (e) { console.warn('[selective-publish] sign failed · puja sense firma', e?.message); }
                    // Upload Turbo real · fallback mock txId
                    let txId, uploadMode = 'mock';
                    try {
                        const canonical = canonicalizeNode(node);
                        const payload = node.content.signature
                            ? buildSignedPayload({
                                canonicalString: canonical,
                                signature:       node.content.signature,
                                signatureFormat: node.content.signatureFormat,
                            })
                            : canonical;
                        const tags = commonArweaveTags({
                            entryType: node.type,
                            extra: [
                                { name: 'Entity-Kind', value: s.kind },
                                { name: 'ProjectId',   value: this.projectId },
                                { name: 'OwnerDid',    value: did },
                            ],
                        });
                        const result = await uploadNodeToTurbo({ payload, tags });
                        txId = result.txId;
                        uploadMode = result.mode;
                    } catch (uErr) {
                        console.warn('[selective-publish] turbo upload failed · mock txId', uErr?.message);
                        txId = mockTxBase + '-' + s.entity.id.slice(0, 8);
                        uploadMode = 'mock';
                    }
                    node.content.arweaveTxId = txId;
                    node.content.permawebPublishedAt = now;
                    node.content._cachedAt = now;
                    node.content._fromPermaweb = false;
                    node.content._mockMode = uploadMode === 'mock';
                    node.content._uploadMode = uploadMode;
                    await KB.upsert(node);
                    // També marquem l'entity origen com a "publicada" per UI
                    const origUpdated = { ...s.entity, content: { ...s.entity.content,
                        permawebTxId: txId,
                        permawebPublishedAt: now,
                    }};
                    await KB.upsert(origUpdated);
                    okCount++;
                } catch (e) {
                    console.warn('[selective-publish] entity fail', s.entity.id, e?.message);
                    errCount++;
                }
            }

            // 8 · Refund parcial si alguns han fallat
            if (errCount > 0) {
                const refundEur = Number((cost.totalEur * (errCount / selected.length)).toFixed(4));
                try {
                    const wallet2 = await getOrCreateWalletForProject(this.projectId);
                    const refunded = refundWallet({
                        wallet: wallet2,
                        amountEur: refundEur,
                        ref: ref + '-refund',
                        source: 'selective-publish-refund',
                        note: 'Refund ' + errCount + ' entitats fallides',
                    });
                    const { persistWallet } = await import('../core/walletService.js');
                    await persistWallet(refunded);
                } catch (_) {}
            }

            setStatus('✓ Publicat ' + okCount + '/' + selected.length + ' entitats · cost ' + cost.totalEur.toFixed(3) + '€' + (errCount > 0 ? ' · refund ' + errCount + ' fallides' : '') + ' · re-renderitzant…', true);
            btn.disabled = false;
            setTimeout(() => this._renderSelectivePublishCard(), 1000);
        } catch (e) {
            console.error('[selective-publish] failed', e);
            setStatus('✗ ' + (e?.message || 'error desconegut'), false);
            if (btn) { btn.disabled = false; btn.textContent = '📤 Publicar selecció'; }
        }
    }

    // FUND-FLOW-001 sprint F · publish project al permaweb
    // PROJ-VERSIONING-001 sprint B+C · publish update (v+1) + history visual
    async _renderPermawebPublishCard() {
        const body = document.getElementById('phPermawebBody');
        if (!body || !this.projectId) return;
        const {
            PUBLIC_PROJECT_TYPE, projectRegistryEntryIdFor, buildPublicProjectEntry,
            signProjectEntry, publishProjectToPermaweb, PROJECT_PRICING,
            getProjectVersionHistory,
        } = await import('../core/publicProjectService.js');
        // PROJ-PUBLISH-FIX · getOrCreateIdentity en lloc de getCurrentIdentity
        // perquè els usuaris primerencs (sense /identity guardat) no quedin
        // bloquejats · l'identity es deriva automàticament del keypair ECDSA
        // P-256 que ja existeix al KB (getOrCreateSigningKey).
        const { getOrCreateIdentity }  = await import('../core/identityService.js');
        const { getOrCreateSigningKey } = await import('../core/projectIO.js');
        const { isPermawebMockEnabled } = await import('../core/publicRegistryService.js');
        const { getOrCreateWalletForProject } = await import('../core/walletService.js');

        let existing = null;
        try { existing = await KB.getNode(projectRegistryEntryIdFor(this.projectId)); } catch (_) {}
        const mockMode = await isPermawebMockEnabled();
        const wallet   = await getOrCreateWalletForProject(this.projectId);
        const balance  = Number(wallet.content.balanceEur || 0);
        const isPublished = !!(existing && existing.type === PUBLIC_PROJECT_TYPE && existing.content?.arweaveTxId);

        const mockPill = mockMode
            ? '<span style="background:rgba(168,85,247,0.12);color:#a855f7;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;font-family:var(--font-mono);">🧪 MOCK MODE</span>'
            : '';

        if (isPublished) {
            const tx = existing.content.arweaveTxId;
            const isMockTx = tx.startsWith('MOCK_TX_');
            const when = new Date(existing.content.permawebPublishedAt || 0).toLocaleDateString('ca-ES');
            const currentVersion = Number.isInteger(existing.content.entryVersion) ? existing.content.entryVersion : 1;
            const canUpdate = mockMode || balance >= PROJECT_PRICING.publishEur;
            const balanceWarning = !mockMode && balance < PROJECT_PRICING.publishEur
                ? `<div style="color:var(--accent-orange);font-size:0.78rem;margin-top:6px;">⚠ Saldo ${balance.toFixed(2)}€ · necessites ≥ ${PROJECT_PRICING.publishEur.toFixed(2)}€ per a publicar update · <a href="/wallet?project=${encodeURIComponent(this.projectId)}" data-link style="color:var(--accent-orange);">recarrega →</a></div>`
                : '';
            body.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:0.6rem;flex-wrap:wrap;">
                    <div>
                        <div style="font-weight:700;color:${isMockTx ? '#a855f7' : 'var(--accent-green)'};">${isMockTx ? '🧪 Publicat (mock)' : '✓ Publicat al permaweb'} <span style="background:rgba(99,102,241,0.15);color:var(--accent-indigo);padding:1px 8px;border-radius:999px;font-size:11px;font-weight:700;margin-left:6px;">v${currentVersion}</span></div>
                        <div style="color:var(--text-muted);font-size:0.78rem;font-family:var(--font-mono);margin-top:2px;">Tx · ${this._esc(tx.slice(0,16))}… · ${when}</div>
                    </div>
                    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                        ${isMockTx
                            ? '<span class="ph-link" style="opacity:0.6;cursor:default;">🧪 Mock · cap upload real</span>'
                            : `<a href="https://arweave.net/${encodeURIComponent(tx)}" target="_blank" rel="noopener" class="ph-link">🔗 Veure tx</a>`}
                        <a href="/opportunities" data-link class="ph-link">→ /opportunities</a>
                        <button class="ph-link" id="phPubUpdateBtn" style="background:${canUpdate ? 'rgba(99,102,241,0.15)' : 'var(--bg-panel)'};color:${canUpdate ? 'var(--accent-indigo)' : 'var(--text-muted)'};border:1px solid ${canUpdate ? 'var(--accent-indigo)' : 'var(--border-default)'};padding:6px 12px;border-radius:var(--radius-sm);font-weight:700;cursor:${canUpdate ? 'pointer' : 'not-allowed'};${canUpdate ? '' : 'opacity:0.6;'}" ${canUpdate ? '' : 'disabled'} title="Publica una nova versió v${currentVersion + 1} enllaçada amb la v${currentVersion}">📝 Publica update (v${currentVersion + 1})</button>
                    </div>
                </div>
                ${mockPill ? '<div style="margin-top:6px;">' + mockPill + '</div>' : ''}
                ${balanceWarning}
                <div id="phPubStatus" style="font-size:0.78rem;margin-top:6px;display:none;"></div>
                <div id="phVersionHistory" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--glass-border);">
                    <div style="font-size:0.72rem;color:var(--text-muted);font-weight:700;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:6px;">📜 Historial</div>
                    <div id="phVersionHistoryBody" style="font-size:0.78rem;color:var(--text-muted);">Carregant…</div>
                </div>
            `;

            const setStatus = (msg, ok = true) => {
                const s = document.getElementById('phPubStatus');
                if (!s) return;
                s.style.display = 'block';
                s.textContent = msg;
                s.style.color = ok ? 'var(--accent-green)' : 'var(--accent-red)';
            };

            document.getElementById('phPubUpdateBtn')?.addEventListener('click', async () => {
                const btn = document.getElementById('phPubUpdateBtn');
                btn.disabled = true; btn.textContent = '⏳ Construint v' + (currentVersion + 1) + '…';
                setStatus('Construint nova versió · signant…', true);
                try {
                    const identity = await getOrCreateIdentity();
                    if (!identity?.content?.primaryDid && !identity?.primaryDid) {
                        setStatus('✗ Identitat no s\'ha pogut crear · revisa /identity', false);
                        btn.disabled = false; btn.textContent = '📝 Publica update (v' + (currentVersion + 1) + ')';
                        return;
                    }
                    const did = identity.content?.primaryDid || identity.primaryDid;
                    const keyMeta = await getOrCreateSigningKey();
                    const entry = buildPublicProjectEntry({
                        project:        this.project,
                        ownerDid:       did,
                        ownerPublicJwk: keyMeta.publicJwk,
                        entryVersion:   currentVersion + 1,
                        previousTxId:   tx,
                    });
                    const signed = await signProjectEntry({ entry, privateJwk: keyMeta.privateJwk });
                    btn.textContent = '⏳ Pujant v' + (currentVersion + 1) + '…';
                    const result = await publishProjectToPermaweb({ entry: signed, projectId: this.projectId });
                    setStatus(`✓ v${currentVersion + 1} publicada · ${result.txId.slice(0,12)}… · cost ${result.costEur.toFixed(2)}€`, true);
                    setTimeout(() => this._renderPermawebPublishCard(), 800);
                } catch (e) {
                    console.error('[ph] publish update', e);
                    setStatus('✗ ' + (e?.message || 'error desconegut'), false);
                    btn.disabled = false; btn.textContent = '📝 Publica update (v' + (currentVersion + 1) + ')';
                }
            });

            // Sprint C · render history async (no bloqueja la UI)
            this._renderVersionHistory(tx, isMockTx, getProjectVersionHistory).catch(e => {
                const hb = document.getElementById('phVersionHistoryBody');
                if (hb) hb.textContent = 'No s\'ha pogut carregar l\'historial · ' + (e?.message || 'unknown');
            });
            return;
        }

        // No publicat encara
        const canPublish = mockMode || balance >= PROJECT_PRICING.publishEur;
        const costStr = mockMode ? '0,00€ (mock)' : PROJECT_PRICING.publishEur.toFixed(2) + '€';
        const balanceWarning = !mockMode && balance < PROJECT_PRICING.publishEur
            ? `<div style="color:var(--accent-orange);font-size:0.78rem;margin-top:6px;">⚠ Saldo wallet projecte ${balance.toFixed(2)}€ · necessites ≥ ${PROJECT_PRICING.publishEur.toFixed(2)}€ · <a href="/wallet?project=${encodeURIComponent(this.projectId)}" data-link style="color:var(--accent-orange);">recarrega aquí →</a></div>`
            : '';

        body.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:0.6rem;flex-wrap:wrap;">
                <div>
                    <div style="font-weight:700;color:var(--text-secondary);">— No publicat encara</div>
                    <div style="color:var(--text-muted);font-size:0.78rem;margin-top:2px;">Saldo wallet projecte · <strong style="color:var(--text-main);">${balance.toFixed(2)}€</strong> · cost <strong style="color:var(--accent-indigo);">${costStr}</strong></div>
                </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    ${mockPill}
                    <button class="ph-link" id="phPubBtn" style="background:${canPublish ? 'var(--accent-indigo)' : 'var(--bg-panel)'};color:${canPublish ? '#fff' : 'var(--text-muted)'};border:1px solid ${canPublish ? 'var(--accent-indigo)' : 'var(--border-default)'};padding:6px 14px;border-radius:var(--radius-sm);cursor:${canPublish ? 'pointer' : 'not-allowed'};font-weight:700;${canPublish ? '' : 'opacity:0.6;'}" ${canPublish ? '' : 'disabled'}>${mockMode ? '🧪 Publicar (mock)' : '🚀 Publicar al permaweb'}</button>
                </div>
            </div>
            ${balanceWarning}
            <div id="phPubStatus" style="font-size:0.78rem;margin-top:6px;display:none;"></div>
        `;

        const setStatus = (msg, ok = true) => {
            const s = document.getElementById('phPubStatus');
            if (!s) return;
            s.style.display = 'block';
            s.textContent = msg;
            s.style.color = ok ? 'var(--accent-green)' : 'var(--accent-red)';
        };

        document.getElementById('phPubBtn')?.addEventListener('click', async () => {
            const btn = document.getElementById('phPubBtn');
            btn.disabled = true; btn.textContent = '⏳ Construint…';
            setStatus('Construint entry · signant amb ECDSA P-256…', true);
            try {
                // PROJ-PUBLISH-FIX · auto-crea identity (deriva DID del keypair
                // ECDSA P-256 ja al KB) en lloc de bloquejar l'usuari · zero
                // fricció el primer cop que publica.
                const identity = await getOrCreateIdentity();
                const did = identity?.content?.primaryDid || identity?.primaryDid;
                if (!did) {
                    setStatus('✗ Identitat no s\'ha pogut crear · revisa /identity', false);
                    btn.disabled = false; btn.textContent = mockMode ? '🧪 Publicar (mock)' : '🚀 Publicar al permaweb';
                    return;
                }
                const keyMeta = await getOrCreateSigningKey();
                const entry = buildPublicProjectEntry({
                    project:        this.project,
                    ownerDid:       did,
                    ownerPublicJwk: keyMeta.publicJwk,
                });
                const signed = await signProjectEntry({ entry, privateJwk: keyMeta.privateJwk });
                btn.textContent = '⏳ Pujant…';
                setStatus('Pujant al permaweb…', true);
                const result = await publishProjectToPermaweb({ entry: signed, projectId: this.projectId });
                setStatus(`✓ Publicat · txId ${result.txId.slice(0,12)}… · cost ${result.costEur.toFixed(2)}€`, true);
                setTimeout(() => this._renderPermawebPublishCard(), 700);
            } catch (e) {
                console.error('[ph] publish project', e);
                setStatus('✗ ' + (e?.message || 'error desconegut'), false);
                btn.disabled = false; btn.textContent = mockMode ? '🧪 Publicar (mock)' : '🚀 Publicar al permaweb';
            }
        });
    }

    // PROJ-VERSIONING-001 sprint C · historial visual del versionat permaweb
    async _renderVersionHistory(currentTx, isMockTx, getProjectVersionHistory) {
        const body = document.getElementById('phVersionHistoryBody');
        if (!body) return;
        if (isMockTx) {
            body.innerHTML = '<div style="color:var(--text-muted);font-style:italic;">🧪 Mode mock · historial no disponible · publicat localment</div>';
            return;
        }
        let versions = [];
        try {
            versions = await getProjectVersionHistory({ projectId: this.projectId });
        } catch (e) {
            body.innerHTML = '<div style="color:var(--accent-orange);">⚠ ' + this._esc(e?.message || 'gateway no accessible') + '</div>';
            return;
        }
        if (!versions || versions.length === 0) {
            body.innerHTML = '<div style="color:var(--text-muted);font-style:italic;">Cap versió indexada al permaweb encara · pot trigar uns minuts a aparèixer després del publish</div>';
            return;
        }
        // Sort DESC per a mostrar més recent primer
        const sorted = versions.slice().sort((a, b) => b.entryVersion - a.entryVersion);
        body.innerHTML = sorted.map(v => {
            const isCurrent = v.txId === currentTx;
            const date = v.blockTimestamp ? new Date(v.blockTimestamp * 1000).toLocaleString('ca-ES') : '—';
            return `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;background:${isCurrent ? 'rgba(99,102,241,0.10)' : 'var(--bg-elevated)'};border:1px solid ${isCurrent ? 'var(--accent-indigo)' : 'var(--border-subtle)'};margin-bottom:4px;">
                <span style="background:${isCurrent ? 'var(--accent-indigo)' : 'var(--bg-panel)'};color:${isCurrent ? '#fff' : 'var(--text-secondary)'};padding:2px 8px;border-radius:999px;font-size:11px;font-weight:800;font-family:var(--font-mono);min-width:42px;text-align:center;">v${v.entryVersion}</span>
                <span style="flex:1;font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this._esc(v.txId.slice(0,20))}…</span>
                <span style="font-size:10px;color:var(--text-muted);font-style:italic;">${date}</span>
                <a href="https://arweave.net/${encodeURIComponent(v.txId)}" target="_blank" rel="noopener" style="color:var(--accent-indigo);text-decoration:none;font-size:11px;font-weight:700;">🔗</a>
            </div>`;
        }).join('');
    }

    destroy() {}
}
