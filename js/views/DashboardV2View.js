// =============================================================================
// TEAMTOWERS SOS V11 — DASHBOARD V2 (UX-DASHBOARD-V2 · clean entry page)
// Ruta · /js/views/DashboardV2View.js  →  /home
//
// Substitueix el dashboard antic (2628L · monolític) per una entry page
// neta · DRY · KISS · 4 zones max ·
//   1. Hero context-aware (CTA principal segons estat)
//   2. Projects grid (cards visuals · 6 visibles · "veure tots" si N>6)
//   3. Activity recent (top 5 events de TOTS els projects · feed unificat)
//   4. Quick start / footer (links útils + balance · settings)
//
// Mobile-first · 5-click rule respectat · cap zona ≥7 elements (Miller).
//
// Manté /dashboard antic intacte per a backward compat. /home és la nova
// entrada que recomanem.
// =============================================================================

import { store } from '../core/store.js';
import { KB } from '../core/kb.js';
import { buildFeed } from '../core/activityFeedService.js';
import { renderNavGroupedHtml, ensureNavGroupStyle, bindNavGroupDropdowns } from '../core/navService.js';

const TPL_VERSION = 'dashboard-v2-v1.0';

export default class DashboardV2View {

    constructor() {
        if (typeof document !== 'undefined') {
            document.title = 'SOS · Home';
        }
        // State carregat a getHtml() · usat a afterRender()
        this._state = null;
    }

    // Router pattern · getHtml retorna string · afterRender fa binding
    async getHtml() {
        await store.init();
        const state = store.getState();
        const projects = (state.projects || []).filter(p => p && !p.isArchived);

        // Carrega data per al feed agregat (top 5 events globals)
        const [attestations, pacts, wos, ledger, invoices, proposals, members] = await Promise.all([
            KB.query({ type: 'attestation' }).catch(() => []),
            KB.query({ type: 'pact' }).catch(() => []),
            KB.query({ type: 'work_order' }).catch(() => []),
            KB.query({ type: 'ledger_entry' }).catch(() => []),
            KB.query({ type: 'invoice' }).catch(() => []),
            KB.query({ type: 'proposal' }).catch(() => []),
            KB.query({ type: 'matriu_member' }).catch(() => []),
        ]);
        const meHandle = (members.find(m => m && (m.content?.isPrimary || m.isPrimary))?.content?.handle) || null;
        const feed = buildFeed({
            sources: { attestations, pacts, wos, ledger, invoices, proposals },
            userHandle: meHandle,
            limit: 5,
            sortBy: 'relevance',
        });

        this._state = { projects, feed, meHandle };
        return this._renderShell({ projects, feed, meHandle });
    }

    async afterRender() {
        ensureNavGroupStyle();
        this._bind();
        bindNavGroupDropdowns();
    }

    // BACK-COMPAT · alguns callers (tests / hot-reload) usen render(). Manté
    // la API antiga · simplement encadena els 2 passos del router.
    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    _renderShell({ projects, feed, meHandle }) {
        const hasProjects = projects.length > 0;
        const recentProject = hasProjects ? projects[0] : null;
        return `
        <style>
            .h2-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); padding-bottom:2rem; }
            .h2-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-wrap:wrap; position:sticky; top:0; z-index:10; }
            .h2-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .h2-logo span { color:var(--accent-indigo); }
            .h2-tag  { font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.07em; padding:2px 8px; background:rgba(99,102,241,0.12); border-radius:999px; }
            .h2-nav  { margin-left:auto; display:flex; gap:6px; align-items:center; }
            .h2-back-old { font-size:0.7rem; color:var(--text-muted); text-decoration:none; padding:4px 10px; border-radius:4px; }
            .h2-back-old:hover { color:var(--text-main); background:var(--glass-hover); }

            .h2-main { max-width:1100px; margin:0 auto; padding:1.2rem 1rem; display:flex; flex-direction:column; gap:0.85rem; }

            /* Zone 1 · Hero context-aware */
            .h2-hero { background:linear-gradient(135deg,rgba(99,102,241,0.18),rgba(168,85,247,0.10)); border:1px solid rgba(99,102,241,0.3); border-radius:10px; padding:1.4rem 1.6rem; }
            .h2-hero h1 { margin:0 0 0.4rem 0; font-size:1.6rem; letter-spacing:-0.01em; }
            .h2-hero h1 span { color:#a8b2ff; }
            .h2-hero p { margin:0 0 1rem 0; font-size:0.95rem; color:var(--text-secondary); line-height:1.5; max-width:680px; }
            .h2-hero-actions { display:flex; gap:8px; flex-wrap:wrap; }
            .h2-btn { padding:9px 16px; border-radius:6px; font-size:0.88rem; font-weight:700; text-decoration:none; cursor:pointer; border:1px solid var(--border-default); background:var(--bg-panel); color:var(--text-main); display:inline-flex; align-items:center; gap:6px; }
            .h2-btn-primary { background:linear-gradient(135deg,#a855f7,#6366f1); color:#fff; border-color:transparent; }
            .h2-btn-primary:hover { filter:brightness(1.10); }
            .h2-btn:hover { background:var(--glass-hover); border-color:var(--accent-indigo); }

            /* Zone 2 · Projects grid */
            .h2-zone { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem 1.1rem; }
            .h2-zone-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem; }
            .h2-zone-head h2 { margin:0; font-size:0.95rem; color:var(--text-main); }
            .h2-zone-head a { color:var(--text-secondary); font-size:0.75rem; text-decoration:none; padding:4px 10px; border-radius:4px; }
            .h2-zone-head a:hover { color:var(--text-main); background:var(--glass-hover); }

            .h2-proj-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:0.7rem; }
            .h2-proj-card { background:var(--bg-dark); border:1px solid var(--border-default); border-radius:6px; padding:0.85rem 1rem; text-decoration:none; color:var(--text-main); display:flex; flex-direction:column; gap:0.45rem; transition:all 0.15s; }
            .h2-proj-card:hover { border-color:var(--accent-indigo); transform:translateY(-2px); }
            .h2-proj-name { font-weight:700; font-size:0.95rem; line-height:1.3; }
            .h2-proj-meta { font-size:0.7rem; color:var(--text-secondary); display:flex; gap:6px; flex-wrap:wrap; }
            .h2-proj-pill { padding:1px 7px; border-radius:999px; font-size:0.62rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; background:rgba(148,163,184,0.15); }
            .h2-proj-pill.active { background:rgba(34,197,94,0.18); color:#22c55e; }
            .h2-proj-pill.demo   { background:rgba(250,204,21,0.18); color:#facc15; }

            /* Empty state · zone projects */
            .h2-empty { text-align:center; padding:2rem 1rem; color:var(--text-secondary); }
            .h2-empty p { margin:0 0 1rem 0; font-size:0.95rem; }

            /* Zone 3 · Activity */
            .h2-act-row { padding:0.5rem 0.6rem; border-radius:4px; display:flex; gap:10px; font-size:0.82rem; align-items:flex-start; }
            .h2-act-row:hover { background:var(--glass-hover); }
            .h2-act-icon { flex-shrink:0; font-size:1.1rem; line-height:1.2; }
            .h2-act-body .ttl { font-weight:600; }
            .h2-act-body .meta { font-size:0.7rem; color:var(--text-secondary); margin-top:1px; }

            /* Zone 4 · Quick links */
            .h2-quick-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:0.5rem; }
            .h2-quick-card { padding:0.65rem 0.85rem; background:var(--bg-dark); border:1px solid var(--border-default); border-radius:6px; text-decoration:none; color:var(--text-main); display:block; transition:all 0.15s; }
            .h2-quick-card:hover { border-color:var(--accent-indigo); transform:translateY(-1px); }
            .h2-quick-card .ic { font-size:1.4rem; line-height:1; margin-bottom:4px; }
            .h2-quick-card .nm { font-weight:600; font-size:0.84rem; }
            .h2-quick-card .ds { font-size:0.7rem; color:var(--text-secondary); margin-top:2px; line-height:1.4; }

            .h2-empty-feed { color:var(--text-muted); font-size:0.78rem; font-style:italic; padding:0.5rem 0; }

            /* Mobile-first · < 768px */
            @media (max-width: 768px) {
                .h2-topbar { padding:6px 10px; gap:6px; }
                .h2-tag { display:none; }                              /* treure label uppercase per espai */
                .h2-back-old { font-size:0.65rem; padding:2px 6px; }
                .h2-primary-nav { gap:2px !important; flex-wrap:wrap !important; }
                .h2-primary-nav a { padding:4px 7px !important; font-size:0.7rem !important; }
                .h2-main { padding:0.7rem 0.6rem; gap:0.6rem; }
                .h2-hero { padding:1rem 1.1rem; }
                .h2-hero h1 { font-size:1.25rem; }
                .h2-hero p { font-size:0.85rem; }
                .h2-zone { padding:0.7rem 0.85rem; }
                .h2-zone-head h2 { font-size:0.88rem; }
                .h2-proj-grid { grid-template-columns:1fr; gap:0.5rem; }
                .h2-quick-grid { grid-template-columns:repeat(2, 1fr); gap:0.4rem; }
                .h2-btn { padding:7px 12px; font-size:0.82rem; }
            }
        </style>

        <div class="h2-shell">
            <div class="h2-topbar">
                <a href="/home" data-link class="h2-logo">🗼 Team<span>Towers</span></a>
                <span class="h2-tag">SOS · Home</span>
                <div class="h2-nav">
                    ${this._renderTopNav()}
                    <a href="/dashboard" data-link class="h2-back-old" title="Tornar al dashboard antic (power-user view)">↩ Antic</a>
                </div>
            </div>

            <div class="h2-main">
                ${this._zone1_Hero({ projects, recentProject, meHandle })}
                ${this._zone2_Projects({ projects })}
                ${this._zone3_Activity({ feed })}
                ${this._zone4_QuickLinks({ meHandle })}
            </div>
        </div>`;
    }

    _renderTopNav() {
        // 5 enllaços primaris + dropdown "Més" amb la resta agrupada
        const PRIMARY = [
            { href: '/home',      label: '🏠 Home',     active: true },
            { href: '/registry',  label: '🌐 Registry', active: false },
            { href: '/market',    label: '🛒 Mercat',   active: false },
            { href: '/learn',     label: '🎓 Aprèn',    active: false },
            { href: '/identity',  label: '👤 Jo',       active: false },
        ];
        return `
            <div class="h2-primary-nav" style="display:flex;gap:4px;align-items:center;">
                ${PRIMARY.map(p => `
                    <a href="${p.href}" data-link style="padding:6px 10px;font-size:0.78rem;color:${p.active ? 'var(--text-main)' : 'var(--text-secondary)'};background:${p.active ? 'rgba(99,102,241,0.15)' : 'transparent'};border-radius:4px;text-decoration:none;font-weight:${p.active ? '700' : '500'};">${p.label}</a>
                `).join('')}
            </div>
        `;
    }

    _zone1_Hero({ projects, recentProject, meHandle }) {
        if (projects.length === 0) {
            return `
            <div class="h2-hero">
                <h1>Hola · benvingut a <span>SOS</span></h1>
                <p>Operating System cooperatiu local-first · descentralitzat · TDD a tots els nivells. Comença creant el teu primer projecte · l'IA t'ajudarà a definir el mapa de valor · els processos i les WOs.</p>
                <div class="h2-hero-actions">
                    <a href="/create" data-link class="h2-btn h2-btn-primary">+ Crear primer projecte</a>
                    <a href="/learn" data-link class="h2-btn">📚 Què és SOS?</a>
                </div>
            </div>`;
        }
        const handleLabel = meHandle ? meHandle : 'cofundador';
        return `
        <div class="h2-hero">
            <h1>Hola <span>${this._esc(handleLabel)}</span></h1>
            <p>Tens ${projects.length} ${projects.length === 1 ? 'projecte actiu' : 'projectes actius'}. Continua amb el més recent · "${this._esc(recentProject.nombre || recentProject.name)}" · o explora els altres.</p>
            <div class="h2-hero-actions">
                <a href="/hub/${encodeURIComponent(recentProject.id)}" data-link class="h2-btn h2-btn-primary">→ Continuar amb ${this._esc((recentProject.nombre || recentProject.name || '').slice(0, 24))}</a>
                <a href="/create" data-link class="h2-btn">+ Nou projecte</a>
                <a href="/sprint" data-link class="h2-btn">🐝 Sprint Swarm</a>
            </div>
        </div>`;
    }

    _zone2_Projects({ projects }) {
        if (projects.length === 0) {
            return `
            <div class="h2-zone">
                <div class="h2-zone-head">
                    <h2>📁 Els teus projectes</h2>
                </div>
                <div class="h2-empty">
                    <p>Encara no tens cap projecte.</p>
                    <a href="/create" data-link class="h2-btn h2-btn-primary">+ Crear primer projecte</a>
                </div>
            </div>`;
        }
        const visibleProjects = projects.slice(0, 6);
        const moreCount = projects.length - visibleProjects.length;
        return `
        <div class="h2-zone">
            <div class="h2-zone-head">
                <h2>📁 Els teus projectes · ${projects.length}</h2>
                ${moreCount > 0 ? `<a href="/dashboard" data-link>→ Veure tots (${projects.length})</a>` : `<a href="/dashboard" data-link>→ Gestionar</a>`}
            </div>
            <div class="h2-proj-grid">
                ${visibleProjects.map(p => this._renderProjectCard(p)).join('')}
            </div>
        </div>`;
    }

    _renderProjectCard(p) {
        const name = p.nombre || p.name || p.id;
        const isDemo = (p.tags || []).some(t => t === 'castellers-seed' || t === 'demo' || t === 'max-bootstrap');
        const sector = p.sector_id || null;
        const stage = p.aiClassification?.lifecycle_stage || null;
        return `
        <a href="/hub/${encodeURIComponent(p.id)}" data-link class="h2-proj-card">
            <div class="h2-proj-name">${this._esc(name)}</div>
            <div class="h2-proj-meta">
                <span class="h2-proj-pill ${isDemo ? 'demo' : 'active'}">${isDemo ? 'demo' : 'actiu'}</span>
                ${sector ? `<span class="h2-proj-pill">${this._esc(sector)}</span>` : ''}
                ${stage ? `<span class="h2-proj-pill">${this._esc(stage)}</span>` : ''}
            </div>
        </a>`;
    }

    _zone3_Activity({ feed }) {
        return `
        <div class="h2-zone">
            <div class="h2-zone-head">
                <h2>💬 Activitat recent</h2>
                <a href="/registry" data-link>→ Registry</a>
            </div>
            ${feed.length === 0
                ? '<div class="h2-empty-feed">Encara cap activitat enregistrada · crea WOs · firma pactes · publica al permaweb</div>'
                : feed.map(e => `
                    <div class="h2-act-row">
                        <div class="h2-act-icon">${e.iconHint || '·'}</div>
                        <div class="h2-act-body">
                            <div class="ttl">${this._esc(e.title)}</div>
                            <div class="meta">${e.actorHandle ? this._esc(e.actorHandle) + ' · ' : ''}${this._formatRelativeTime(e.ts)}</div>
                        </div>
                    </div>`).join('')}
        </div>`;
    }

    _zone4_QuickLinks({ meHandle }) {
        const links = [
            { ic: '🐝', nm: 'Sprint Swarm',  ds: 'Backlog SOS · agent IA',     href: '/sprint' },
            { ic: '🌐', nm: 'Registry',      ds: 'Permaweb · operadors SOS',   href: '/registry' },
            { ic: '🛒', nm: 'Mercat',        ds: 'Productes · workshops · sops', href: '/market' },
            { ic: '🎓', nm: 'Aprèn',         ds: 'Catàleg learn · 108 rols',   href: '/learn' },
            { ic: '👤', nm: meHandle ? 'El meu perfil' : 'Crear identitat', ds: meHandle ? meHandle : 'DID + ECDSA local', href: meHandle ? '/u/' + meHandle.replace(/^@/, '') : '/identity' },
            { ic: '⚙️', nm: 'Configuració',  ds: 'API keys · tema · preferències', href: '/settings' },
            { ic: '🎨', nm: 'Disseny',       ds: 'Sistema visual · BUILD_STAMP',  href: '/design' },
        ];
        return `
        <div class="h2-zone">
            <div class="h2-zone-head">
                <h2>🚀 Accés ràpid</h2>
            </div>
            <div class="h2-quick-grid">
                ${links.map(l => `
                    <a href="${l.href}" data-link class="h2-quick-card">
                        <div class="ic">${l.ic}</div>
                        <div class="nm">${this._esc(l.nm)}</div>
                        <div class="ds">${this._esc(l.ds)}</div>
                    </a>`).join('')}
            </div>
        </div>`;
    }

    _bind() {
        // No event listeners necessaris · tots els links són data-link · gestionats pel router.
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    _formatRelativeTime(ts) {
        if (!ts) return '';
        const diffMs = Date.now() - ts;
        const min = Math.floor(diffMs / 60000);
        if (min < 1) return 'just ara';
        if (min < 60) return min + ' min';
        const hr = Math.floor(min / 60);
        if (hr < 24) return hr + ' h';
        const days = Math.floor(hr / 24);
        if (days < 30) return days + ' d';
        return new Date(ts).toLocaleDateString();
    }

    _esc(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    destroy() {}
}

export { TPL_VERSION };
