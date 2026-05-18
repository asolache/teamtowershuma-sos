// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT HUB V2 (UX-CENTRAL-HUB-001 · sprint UI)
// Ruta · /js/views/ProjectHubV2View.js
//
// Nou layout 7-zones · 5-click rule · mobile-first.
// Consumeix services pure (activityFeed + iaSuggestions + organization +
// process + budget + cost-tracker). L'antic /project/{id} segueix viu.
//
// Zones ·
//   1. Org context bar (top)
//   2. Avui · top WOs + cash flow
//   3. Processos · 4 cards amb KPI status
//   4. IA suggests · 3 disrupcions accionables
//   5. Social · 5 events recents
//   6. Quick actions · botons primaris
//   7. Knowledge · canvas · pitch · VNA · SOCs · SOPs · resources
//
// Filosofia · cap zona ≥7 elements (Miller's Law) · cada zona té botó "→
// detall" 1-click.
// =============================================================================

import { store } from '../core/store.js';
import { KB } from '../core/kb.js';
import { findProjectByIdAny } from '../core/projectLookup.js';
import { buildFeed, summarizeFeed } from '../core/activityFeedService.js';
import { buildSuggestionsList } from '../core/iaSuggestionsService.js';
import { computeOrgStats } from '../core/organizationService.js';
import { computeProcessStats } from '../core/processService.js';
import { budgetStatus, getSpend } from '../core/aiBudgetService.js';
import { getSessionTotalEur, formatCostEur } from '../core/aiCostTracker.js';
import { auditOrg } from '../core/tddFrameworkService.js';
// v134/v136 · SubmenuTabs canonical + IA-aligned 6 tabs + dropdown
import { renderSubmenuTabs, bindSubmenuTabs, getActiveTabFromUrl } from '../ui/SubmenuTabs.js';

const TPL_VERSION = 'hub-v2-v1.1-canonical-tabs';

// v134 IA aligned · 6 tabs als 5 pilars del menú principal + Equip
const HUB_TABS = Object.freeze([
    { id: 'hub',           label: 'Hub',           icon: '🏠' },
    { id: 'crear',         label: 'Crear',         icon: '🎨' },
    { id: 'treballar',     label: 'Treballar',     icon: '🔨' },
    { id: 'comptabilitzar',label: 'Comptabilitzar',icon: '💶' },
    { id: 'connectar',     label: 'Connectar',     icon: '🔗' },
    { id: 'equip',         label: 'Equip',         icon: '👥' },
]);
const HUB_DROPDOWN = Object.freeze([
    { id: 'aprendre', label: 'Aprendre (KB projecte)', icon: '🧠' },
    { id: 'sprints',  label: 'Sprints management',    icon: '🚀' },
    { id: 'lifecycle',label: 'Lifecycle dashboard',   icon: '🌀' },
    { id: 'settings', label: 'Settings projecte',     icon: '⚙' },
]);

// v141+v142 · Mapping pilar → vistes globals · cada link té id (per al sub-submenu l2)
// + href (per a "Obre vista completa") + kind (per al render in-tab preview lleuger)
const HUB_PILLAR_LINKS = Object.freeze({
    crear: [
        { id: 'canvas',       href: '/canvas',       label: 'Canvas',       icon: '🎨', kind: 'canvas' },
        { id: 'pitch',        href: '/pitch',        label: 'Pitch',        icon: '📣', kind: 'pitch' },
        { id: 'pact',         href: '/pact',         label: 'Pacte',        icon: '🤝', kind: 'pact' },
        { id: 'presentation', href: '/presentation', label: 'Presentation', icon: '🎤', kind: 'presentation' },
    ],
    treballar: [
        { id: 'map',       href: '/map',       label: 'Map',       icon: '🗺', kind: 'map' },
        { id: 'kanban',    href: '/kanban',    label: 'Kanban',    icon: '📋', kind: 'kanban' },
        { id: 'sops',      href: '/sops',      label: 'SOPs',      icon: '📜', kind: 'sops' },
        { id: 'quality',   href: '/quality',   label: 'Qualitat',  icon: '🎯', kind: 'quality' },
        { id: 'sprint',    href: '/sprint',    label: 'Sprint',    icon: '🐝', kind: 'sprint' },
        { id: 'lifecycle', href: '/lifecycle', label: 'Lifecycle', icon: '🌀', kind: 'lifecycle' },
    ],
    comptabilitzar: [
        { id: 'wallet',     href: '/wallet/v2',        label: 'Wallet',       icon: '💼', kind: 'wallet' },
        { id: 'accounting', href: '/accounting/v2',    label: 'Comptes',      icon: '📒', kind: 'accounting' },
        { id: 'value',      href: '/value-accounting', label: 'Pastís valor', icon: '🥧', kind: 'value' },
        { id: 'invoices',   href: '/invoices',         label: 'Factures',     icon: '🧾', kind: 'invoices' },
        { id: 'tokenomics', href: '/tokenomics',       label: 'Tokenomics',   icon: '🪙', kind: 'tokenomics' },
    ],
    connectar: [
        { id: 'proposals', href: '/proposals', label: 'Propostes',       icon: '📝', kind: 'proposals' },
        { id: 'market',    href: '/market',    label: 'Mercat',          icon: '🛒', kind: 'market' },
        { id: 'registry',  href: '/registry',  label: 'Registry públic', icon: '📡', kind: 'registry' },
    ],
    equip: [
        { id: 'members',     href: '/team?tab=projects',    label: 'Membres',      icon: '🧬', kind: 'team-members' },
        { id: 'roles',       href: '/team?tab=roles',       label: 'Rols',         icon: '🤲', kind: 'team-roles' },
        { id: 'permissions', href: '/team?tab=permissions', label: 'Permisos',     icon: '🔐', kind: 'team-permissions' },
        { id: 'invites',     href: '/team?tab=projects',    label: 'Convidacions', icon: '✉',  kind: 'team-invites' },
    ],
});

const VALID_TAB_IDS = new Set([...HUB_TABS, ...HUB_DROPDOWN].map(t => t.id));

export default class ProjectHubV2View {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'SOS · Project Hub';
        // Extract project id from path · /hub/{id}
        // Accepta tant /hub/{id} com /project/{id} (que ara resol aquí · l'antic és /project-classic/{id})
        this.projectId = (typeof window !== 'undefined' && window.location)
            ? window.location.pathname
                .replace(/^\/(hub|project)\//, '')
                .replace(/\/$/, '')
                .split('/')[0] || null
            : null;
        this._project = null;
        this._notFoundHtml = null;
        // v136 · IA-aligned tab routing
        const urlTab = getActiveTabFromUrl('tab', 'hub');
        this._mode = VALID_TAB_IDS.has(urlTab) ? urlTab : 'hub';
        // v150 · L2 submenu eliminat · pilar tabs ara són grid de cards amb
        // navegació directa a la vista global (zero preview redundant).
        this._cleanupTabs = null;
    }

    // Router pattern · getHtml + afterRender
    async getHtml() {
        // Load project + related data
        const project = this.projectId ? await findProjectByIdAny(this.projectId) : null;
        this._project = project;

        if (!project) {
            return this._renderNotFound();
        }

        // Parallel loads
        const [org, processes, attestations, pacts, wos, ledger, invoices, proposals] = await Promise.all([
            this._loadOrg(project.orgId).catch(() => null),
            this._loadProcesses(project.id).catch(() => []),
            KB.query({ type: 'attestation' }).catch(() => []),
            KB.query({ type: 'pact' }).catch(() => []),
            KB.query({ type: 'work_order' }).catch(() => []),
            KB.query({ type: 'ledger_entry' }).catch(() => []),
            KB.query({ type: 'invoice' }).catch(() => []),
            KB.query({ type: 'proposal' }).catch(() => []),
        ]);

        // Filter by project where applicable
        const projectWos = wos.filter(w => w.project_id === project.id || w.projectId === project.id || w.content?.projectId === project.id);
        const projectLedger = ledger.filter(l => l.content?.projectId === project.id);
        const projectInvoices = invoices.filter(i => i.content?.projectId === project.id);
        const projectProposals = proposals.filter(p => p.content?.projectId === project.id);
        const projectPacts = pacts.filter(p => p.content?.projectId === project.id);

        const me = await this._getMyHandle();

        // Compute derived state
        const orgAudit = org ? auditOrg({ org, processes }) : null;
        const bs = budgetStatus(project.id);
        const sessionEur = getSessionTotalEur();
        const cashBalance = this._computeCashBalance(projectLedger);

        // Build feed + suggestions
        const feed = buildFeed({
            sources: {
                attestations,
                pacts: projectPacts,
                wos: projectWos,
                ledger: projectLedger,
                invoices: projectInvoices,
                proposals: projectProposals,
            },
            userHandle: me,
            limit: 5,
            sortBy: 'relevance',
        });

        const suggestions = buildSuggestionsList({
            context: {
                aiCostStats: { sessionUsdSpent: sessionEur, criticalCallCount: 0, totalCallCount: 0 },
                processes,
                orgAudit,
                budgetStatus: bs,
                wos: projectWos,
                project,
                otherProjects: (store.getState()?.projects || []).filter(p => p.id !== project.id),
            },
            limit: 3,
        });

        // Today's top WOs (pending + claimed · sorted by priority)
        const todayWos = projectWos
            .filter(w => w.status === 'pending' || w.status === 'claimed' || w.status === 'in-progress')
            .sort((a, b) => this._prioRank(b.priority) - this._prioRank(a.priority))
            .slice(0, 3);

        return this._renderShell({
            project, org, orgAudit, processes,
            todayWos, cashBalance, bs, sessionEur,
            suggestions, feed,
        });
    }

    async afterRender() {
        if (this._project) this._bind();
        // v136 · bind canonical submenu · re-render quan canvia tab
        // v150 · L2 submenu eliminat · no més bindings de sub-tab
        const mount = document.getElementById('hubSubmenu');
        if (mount) {
            try { this._cleanupTabs?.(); } catch (_) {}
            this._cleanupTabs = bindSubmenuTabs(mount, (newId) => {
                if (!VALID_TAB_IDS.has(newId) || newId === this._mode) return;
                this._mode = newId;
                this.render();
            }, { urlParam: 'tab' });
        }
    }

    destroy() {
        try { this._cleanupTabs?.(); } catch (_) {}
    }

    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    // ── Renderers ──────────────────────────────────────────────────────────

    _renderShell({ project, org, orgAudit, processes, todayWos, cashBalance, bs, sessionEur, suggestions, feed }) {
        return `
        <style>
            .hub-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); padding-bottom:2rem; }
            .hub-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-wrap:wrap; position:sticky; top:0; z-index:10; }
            .hub-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .hub-logo span { color:var(--accent-indigo); }
            .hub-back { color:var(--text-secondary); text-decoration:none; font-size:0.78rem; padding:6px 10px; border-radius:4px; }
            .hub-back:hover { color:var(--text-main); background:var(--glass-hover); }
            .hub-main { max-width:1100px; margin:0 auto; padding:1rem; display:flex; flex-direction:column; gap:0.85rem; }

            .hub-zone { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:0.85rem 1rem; }
            .hub-zone-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.55rem; }
            .hub-zone-head h2 { margin:0; font-size:0.92rem; color:var(--text-main); display:flex; align-items:center; gap:8px; }
            .hub-zone-head a { color:var(--text-secondary); text-decoration:none; font-size:0.75rem; padding:4px 10px; border-radius:4px; }
            .hub-zone-head a:hover { color:var(--text-main); background:var(--glass-hover); }

            /* Zone 1 · Org bar */
            .hub-orgbar { background:linear-gradient(135deg,rgba(99,102,241,0.12),rgba(212,168,83,0.08)); border-color:rgba(99,102,241,0.3); }
            .hub-orgbar-row { display:flex; gap:1rem; align-items:center; flex-wrap:wrap; font-size:0.85rem; }
            .hub-orgbar .label { color:var(--text-secondary); font-size:0.7rem; text-transform:uppercase; letter-spacing:0.06em; }
            .hub-orgbar .value { font-weight:700; color:var(--text-main); }
            .hub-pill { padding:2px 8px; border-radius:999px; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; }
            .hub-pill.green { background:rgba(34,197,94,0.18); color:#22c55e; }
            .hub-pill.yellow { background:rgba(250,204,21,0.18); color:#facc15; }
            .hub-pill.red { background:rgba(239,68,68,0.18); color:#ef4444; }

            /* Zone 2 · Avui */
            .hub-today-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:0.6rem; }
            .hub-wo-item { padding:0.55rem 0.75rem; background:var(--bg-dark); border-radius:4px; border:1px solid var(--border-default); }
            .hub-wo-item .ttl { font-weight:600; font-size:0.84rem; }
            .hub-wo-item .meta { font-size:0.72rem; color:var(--text-secondary); margin-top:2px; }

            /* Zone 3 · Processos */
            .hub-proc-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:0.6rem; }
            .hub-proc-card { padding:0.6rem 0.8rem; background:var(--bg-dark); border-radius:6px; border:1px solid var(--border-default); cursor:pointer; transition:all 0.15s; }
            .hub-proc-card:hover { border-color:var(--accent-indigo); transform:translateY(-1px); }
            .hub-proc-card .lbl { font-weight:600; font-size:0.85rem; }
            .hub-proc-card .cat { font-size:0.65rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; }

            /* Zone 4 · IA suggests */
            .hub-suggest { padding:0.65rem 0.8rem; background:linear-gradient(135deg,rgba(168,85,247,0.12),rgba(99,102,241,0.06)); border-radius:6px; border:1px solid rgba(168,85,247,0.3); margin-bottom:0.5rem; }
            .hub-suggest:last-child { margin-bottom:0; }
            .hub-suggest .ttl { font-weight:700; font-size:0.85rem; display:flex; gap:6px; align-items:center; }
            .hub-suggest .ttl .prio { font-size:0.62rem; padding:1px 6px; border-radius:999px; text-transform:uppercase; }
            .hub-suggest .ttl .prio.urgent { background:#ef4444; color:#fff; }
            .hub-suggest .ttl .prio.high { background:#facc15; color:#000; }
            .hub-suggest .ttl .prio.medium { background:#3b82f6; color:#fff; }
            .hub-suggest .ttl .prio.low { background:#94a3b8; color:#fff; }
            .hub-suggest .msg { color:var(--text-secondary); font-size:0.78rem; margin-top:4px; line-height:1.5; }
            .hub-suggest .act { margin-top:6px; display:flex; gap:6px; }
            .hub-suggest .act button, .hub-suggest .act a { padding:3px 10px; border-radius:4px; font-size:0.72rem; font-weight:600; cursor:pointer; border:none; background:rgba(99,102,241,0.25); color:var(--text-main); text-decoration:none; }
            .hub-suggest .act .dismiss { background:transparent; color:var(--text-secondary); }

            /* Zone 5 · Social/activity */
            .hub-act-item { padding:0.5rem 0.7rem; border-radius:4px; display:flex; gap:8px; font-size:0.8rem; }
            .hub-act-item:hover { background:var(--glass-hover); }
            .hub-act-item .icon { flex-shrink:0; font-size:1.1rem; }
            .hub-act-item .body .ttl { font-weight:600; }
            .hub-act-item .body .meta { color:var(--text-secondary); font-size:0.7rem; margin-top:2px; }

            /* Zone 6 · Quick actions */
            .hub-actions { display:flex; gap:0.5rem; flex-wrap:wrap; }
            .hub-actions a, .hub-actions button { padding:8px 14px; border-radius:6px; background:var(--bg-dark); color:var(--text-main); text-decoration:none; font-size:0.82rem; font-weight:600; border:1px solid var(--border-default); cursor:pointer; }
            .hub-actions a:hover, .hub-actions button:hover { background:rgba(99,102,241,0.18); border-color:var(--accent-indigo); }

            /* Zone 7 · Knowledge */
            .hub-know-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:0.5rem; }
            .hub-know-card { padding:0.6rem 0.8rem; background:var(--bg-dark); border-radius:6px; border:1px solid var(--border-default); text-decoration:none; color:var(--text-main); display:block; transition:all 0.15s; }
            .hub-know-card:hover { border-color:var(--accent-indigo); transform:translateY(-1px); }
            .hub-know-card .ic { font-size:1.4rem; margin-bottom:4px; }
            .hub-know-card .nm { font-weight:600; font-size:0.82rem; }
            .hub-know-card .ds { font-size:0.7rem; color:var(--text-secondary); margin-top:2px; line-height:1.4; }

            .hub-empty { color:var(--text-muted); font-size:0.78rem; font-style:italic; padding:0.4rem 0; }

            /* Mobile-first · < 768px */
            @media (max-width: 768px) {
                .hub-topbar { padding:6px 10px; gap:6px; }
                .hub-main { max-width:100%; padding:0.7rem 0.6rem; gap:0.6rem; }
                .hub-zone { padding:0.7rem 0.85rem; }
                .hub-zone-head h2 { font-size:0.85rem; }
                .hub-zone-head a { font-size:0.7rem; padding:3px 8px; }
                .hub-orgbar-row { gap:0.5rem; font-size:0.78rem; }
                .hub-orgbar .label { font-size:0.65rem; }
                .hub-today-grid { grid-template-columns:1fr; gap:0.4rem; }
                .hub-proc-grid { grid-template-columns:1fr 1fr; gap:0.4rem; }
                .hub-know-grid { grid-template-columns:repeat(2,1fr); gap:0.4rem; }
                .hub-actions { gap:0.4rem; }
                .hub-actions a { padding:7px 10px; font-size:0.78rem; }
                .hub-suggest { padding:0.55rem 0.7rem; }
                .hub-suggest .ttl { font-size:0.82rem; }
            }
        </style>

        <div class="hub-shell">

            <div id="hubSubmenu" style="border-bottom:1px solid var(--border-default);">
                ${renderSubmenuTabs({ tabs: HUB_TABS, dropdown: HUB_DROPDOWN, activeId: this._mode, urlParam: 'tab' })}
            </div>

            <div class="hub-main">
                ${this._mode === 'hub'
                    ? this._renderHubContent({ project, todayWos, bs, sessionEur, suggestions, feed, org, orgAudit, processes, cashBalance })
                    : this._renderPillarContent(this._mode, project)}
            </div>
        </div>`;
    }

    // ZONE 0 · LEGENDARY HERO · stats clau visibles d'un cop d'ull
    // Quality score · canvas vision preview · WO progress · cost IA · num rols
    // 5 cards en 1 fila amb les claus del projecte
    // v136 · Hub tab content · embolcalla les 8 zones existents (7-zones + legendary)
    _renderHubContent({ project, todayWos, bs, sessionEur, suggestions, feed, org, orgAudit, processes, cashBalance }) {
        return `
            ${this._zone0_Legendary({ project, todayWos, bs, sessionEur })}
            ${this._zone1_OrgBar({ project, org, orgAudit })}
            ${this._zone2_Today({ todayWos, cashBalance })}
            ${this._zone3_Processes({ processes })}
            ${this._zone4_Suggestions({ suggestions })}
            ${this._zone5_Activity({ feed })}
            ${this._zone6_Actions({ project, bs, sessionEur })}
            ${this._zone7_Knowledge({ project })}
            ${this._zone8_AdvancedTools({ project })}`;
    }

    // v142 · Pillar tab content · sub-submenu l2 + in-tab content lleuger per sub
    // v150 · pilar content · grid de cards · click directe a la vista global
    // (sense L2 submenu redundant · sense preview placeholder que només era
    // un link a la vista) · -1 barra horizontal · -1 click al destí real.
    _renderPillarContent(pilarId, project) {
        const links = HUB_PILLAR_LINKS[pilarId] || [];
        const pilarMeta = HUB_TABS.find(t => t.id === pilarId) || HUB_DROPDOWN.find(t => t.id === pilarId);
        const pilarLabel = pilarMeta ? (pilarMeta.icon + ' ' + pilarMeta.label) : pilarId;

        if (links.length === 0) {
            return `<div class="hub-zone" style="text-align:center;padding:2rem;">
                <h2 style="margin:0 0 8px;">${this._esc(pilarLabel)}</h2>
                <p style="color:var(--text-muted);margin:0;">Aquest pilar encara no té vistes assignades.</p>
            </div>`;
        }

        const cards = links.map(l => {
            const sep = l.href.includes('?') ? '&' : '?';
            const href = l.href + sep + 'project=' + encodeURIComponent(project.id);
            const desc = this._pilarCardDesc(l.kind);
            return `<a href="${this._esc(href)}" data-link class="hub-pilar-card">
                <div class="hub-pilar-card-icon">${this._esc(l.icon || '·')}</div>
                <div class="hub-pilar-card-label">${this._esc(l.label)}</div>
                <div class="hub-pilar-card-desc">${this._esc(desc)}</div>
            </a>`;
        }).join('');

        return `
            <div class="hub-zone" style="padding:0;overflow:hidden;">
                <div class="hub-zone-head" style="padding:12px 16px;margin:0;border-bottom:1px solid var(--border-default);">
                    <h2 style="margin:0;">${this._esc(pilarLabel)} <span style="color:var(--text-muted);font-weight:400;font-size:0.8rem;">· ${links.length} vistes · click directe</span></h2>
                </div>
                <div class="hub-pilar-grid" style="padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">${cards}</div>
            </div>
            <style>
                .hub-pilar-card { background:var(--bg-elevated); border:1px solid var(--border-default); border-radius:var(--radius-md); padding:16px; text-align:center; text-decoration:none; color:var(--text-main); transition:transform 0.15s ease, border-color 0.15s ease; display:flex; flex-direction:column; align-items:center; gap:6px; }
                .hub-pilar-card:hover { transform:translateY(-2px); border-color:var(--accent-indigo); }
                .hub-pilar-card-icon { font-size:1.7rem; }
                .hub-pilar-card-label { font-size:0.92rem; font-weight:700; }
                .hub-pilar-card-desc { font-size:0.75rem; color:var(--text-muted); line-height:1.3; }
            </style>`;
    }

    // v150 · descripció curta per cada kind (1 línia) · suficient per a card grid
    _pilarCardDesc(kind) {
        const map = {
            canvas:           'Visió · missió · valors · stakeholders',
            pitch:            'One-pager públic · 6 seccions',
            pact:             'Pacte de socis · ECDSA signatures',
            presentation:     'Landing read-only · roles + tx + SOPs',
            map:              'Mapa de valor VNA · rols · transactions',
            kanban:           'Work orders · backlog → in-progress → done',
            sops:             'Procediments · publicables al mercat',
            quality:          'Rubric 12-criteris + integritat 7-regles',
            sprint:           'Sprint orchestrator · IA runs autonomous',
            lifecycle:        '10 fases · status % · next-best-action',
            wallet:           'Saldo + flow + transferència entre projectes',
            accounting:       'Ledger double-entry · P&L per període',
            value:            'Slicing Pie · equity dinàmic Moyer',
            invoices:         'CRUD invoices · IVA · auto-ledger',
            tokenomics:       'Disseny token · 6 grups + vesting',
            proposals:        'IA brief + skill matching · win rate',
            market:           'Aquest projecte al mercat · traction',
            registry:         'Permaweb public registry · signat',
            'team-members':   'Llistat persones · trust score',
            'team-roles':     'Catàleg rols · founder/ops/contributor/viewer',
            'team-permissions':'Matriu RBAC fine-grained',
            'team-invites':   'Convidacions pendents · expiry 7d',
        };
        return map[kind] || '';
    }


    _zone0_Legendary({ project, todayWos, bs, sessionEur }) {
        const score   = project.rubricScore ?? project.score ?? null;
        const status  = project.rubricStatus ?? project.status ?? (score >= 85 ? 'gold' : score >= 70 ? 'silver' : score >= 50 ? 'bronze' : 'red');
        const scoreEmoji = score == null ? '—' : (score >= 85 ? '🏆' : score >= 70 ? '✨' : score >= 50 ? '👍' : '🚧');
        const scoreColor = score == null ? '#94a3b8' : (score >= 85 ? '#fbbf24' : score >= 70 ? '#cbd5e1' : score >= 50 ? '#d97706' : '#ef4444');
        const visionTxt = (project.canvas?.vision || project.purpose || project.description || '').trim();
        const visionShort = visionTxt ? (visionTxt.length > 110 ? visionTxt.slice(0, 110) + '…' : visionTxt) : '(sense visió definida · edita el canvas)';
        const roleCount = (project.vna_roles || []).length;
        const txCount   = (project.vna_transactions || []).length;
        const wosTotal  = (todayWos || []).length;
        const wosDoing  = (todayWos || []).filter(w => w?.content?.status === 'doing' || w?.content?.status === 'in-progress').length;
        const totalCostStr = sessionEur != null ? sessionEur.toFixed(4) + '€' : '0€';
        const ambition = project.ambition || 'standard';
        const ambIcon = { light: '✏️', standard: '⚡', max: '🏆' }[ambition] || '⚡';

        return `
        <section class="hub-legendary" aria-label="Visió legendària del projecte">
            <div class="hub-leg-header">
                <div class="hub-leg-title">
                    <span class="hub-leg-amb-pill">${ambIcon} ${this._esc(ambition)}</span>
                    <h2>${this._esc(project.nombre || project.name || project.id)}</h2>
                </div>
                <a href="/quality?project=${encodeURIComponent(project.id)}" data-link class="hub-leg-quality" style="border-color:${scoreColor};color:${scoreColor};">
                    ${scoreEmoji} <strong>${score ?? '—'}</strong>/100 · ${this._esc(status)}
                </a>
            </div>
            <div class="hub-leg-vision">
                💭 <em>${this._esc(visionShort)}</em>
            </div>
            <div class="hub-leg-stats">
                <a href="/map?project=${encodeURIComponent(project.id)}" data-link class="hub-leg-stat">
                    <div class="hub-leg-stat-num">${roleCount}</div>
                    <div class="hub-leg-stat-lbl">rols</div>
                </a>
                <a href="/map?project=${encodeURIComponent(project.id)}" data-link class="hub-leg-stat">
                    <div class="hub-leg-stat-num">${txCount}</div>
                    <div class="hub-leg-stat-lbl">transaccions</div>
                </a>
                <a href="/kanban?project=${encodeURIComponent(project.id)}" data-link class="hub-leg-stat">
                    <div class="hub-leg-stat-num">${wosDoing}/${wosTotal}</div>
                    <div class="hub-leg-stat-lbl">WOs · in-progress / total</div>
                </a>
                <a href="/accounting?project=${encodeURIComponent(project.id)}" data-link class="hub-leg-stat">
                    <div class="hub-leg-stat-num">${this._esc(totalCostStr)}</div>
                    <div class="hub-leg-stat-lbl">cost IA sessió</div>
                </a>
                <a href="/canvas?project=${encodeURIComponent(project.id)}" data-link class="hub-leg-stat">
                    <div class="hub-leg-stat-num">${project.canvas ? '✓' : '—'}</div>
                    <div class="hub-leg-stat-lbl">canvas</div>
                </a>
                <a href="/pitch?project=${encodeURIComponent(project.id)}" data-link class="hub-leg-stat">
                    <div class="hub-leg-stat-num">${project.pitch ? '✓' : '—'}</div>
                    <div class="hub-leg-stat-lbl">pitch</div>
                </a>
            </div>
        </section>
        <style>
            .hub-legendary { background:linear-gradient(135deg,rgba(99,102,241,0.10),rgba(168,85,247,0.05)); border:1px solid rgba(99,102,241,0.25); border-radius:12px; padding:1.2rem 1.4rem; margin-bottom:1rem; }
            .hub-leg-header { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:10px; flex-wrap:wrap; }
            .hub-leg-title { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
            .hub-leg-title h2 { margin:0; font-size:1.4rem; color:var(--text-main); }
            .hub-leg-amb-pill { background:rgba(255,255,255,0.06); border:1px solid var(--border-default); padding:3px 10px; border-radius:999px; font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em; font-weight:600; }
            .hub-leg-quality { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border:1px solid; border-radius:8px; font-size:0.9rem; text-decoration:none; background:rgba(0,0,0,0.18); transition:all 0.15s; font-weight:600; }
            .hub-leg-quality:hover { transform:translateY(-1px); filter:brightness(1.15); }
            .hub-leg-quality strong { font-size:1.2rem; }
            .hub-leg-vision { font-size:0.92rem; color:var(--text-secondary); margin-bottom:14px; padding:8px 12px; background:rgba(0,0,0,0.18); border-radius:6px; border-left:3px solid var(--accent-indigo); }
            .hub-leg-stats { display:grid; grid-template-columns:repeat(auto-fit, minmax(115px, 1fr)); gap:8px; }
            .hub-leg-stat { display:flex; flex-direction:column; align-items:center; padding:10px 8px; background:rgba(255,255,255,0.04); border:1px solid var(--border-default); border-radius:8px; text-decoration:none; color:var(--text-main); transition:all 0.15s; }
            .hub-leg-stat:hover { background:rgba(99,102,241,0.12); border-color:var(--accent-indigo); transform:translateY(-1px); }
            .hub-leg-stat-num { font-size:1.4rem; font-weight:800; line-height:1.1; color:var(--accent-indigo); font-family:var(--font-mono); }
            .hub-leg-stat-lbl { font-size:0.7rem; color:var(--text-secondary); margin-top:3px; text-transform:uppercase; letter-spacing:0.04em; text-align:center; }
            @media (max-width: 600px) {
                .hub-leg-stats { grid-template-columns:repeat(3, 1fr); }
            }
        </style>`;
    }

    _zone8_AdvancedTools({ project }) {
        // Eines power-user · funcions del hub clàssic + advanced flows.
        // Col·lapsable per defecte · no satura el hub principal.
        const items = [
            { ic: '🐝',  nm: 'Swarm matchmaker',    ds: 'Cohort 0 · proj ↔ enjambre',     href: '/project-classic/' + project.id + '#swarm' },
            { ic: '👥',  nm: 'Membres',             ds: 'Nucli humà · cofounders',         href: '/project-classic/' + project.id + '#members' },
            { ic: '🌐',  nm: 'Publica permaweb',    ds: 'Entry pública firmada',           href: '/project-classic/' + project.id + '#permaweb' },
            { ic: '🎯',  nm: 'Quality score',       ds: 'Audit + millora contínua',        href: '/quality?project=' + project.id },
            { ic: '🔁',  nm: 'Improvement loop',    ds: 'TDD WO + feedback agent',         href: '/improve?project=' + project.id },
            { ic: '🌪',  nm: 'Swarm flow paral·lel',ds: 'DAG executor · Promise.all',      href: '/swarm?project=' + project.id },
            { ic: '🧠',  nm: 'Mind graph',          ds: 'Visualització nodal del KB',      href: '/mind' },
            { ic: '🎤',  nm: 'Presentació pública', ds: 'Landing read-only · share link',  href: '/presentation?project=' + project.id },
            { ic: '⚙️',  nm: 'Hub clàssic',         ds: 'Versió power-user · totes les eines', href: '/project-classic/' + project.id },
        ];
        return `
        <div class="hub-zone" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
            <div><strong style="font-size:0.92rem;">🤝 Convidar col·laboradors a aquest projecte</strong>
                <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px;">Invita @handles SOS · 3 rols · view / collab / admin · acceptació al seu inbox</div>
            </div>
            <button class="hub-invite-btn" data-action="open-invite" style="padding:8px 16px;border-radius:6px;border:0;background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;font-weight:700;font-size:0.85rem;cursor:pointer;">+ Convidar usuari</button>
        </div>
        <details class="hub-zone" style="padding:0.6rem 1rem;">
            <summary style="cursor:pointer;font-weight:700;font-size:0.92rem;list-style:none;display:flex;align-items:center;justify-content:space-between;">
                <span>🛠 Eines avançades · power-user</span>
                <span style="font-size:0.7rem;color:var(--text-secondary);">${items.length} eines · click per obrir</span>
            </summary>
            <div class="hub-know-grid" style="margin-top:0.7rem;">
                ${items.map(it => `
                    <a href="${this._esc(it.href)}" data-link class="hub-know-card">
                        <div class="ic">${it.ic}</div>
                        <div class="nm">${this._esc(it.nm)}</div>
                        <div class="ds">${this._esc(it.ds)}</div>
                    </a>`).join('')}
            </div>
        </details>`;
    }

    _zone1_OrgBar({ project, org, orgAudit }) {
        const orgName = org?.name || project?.nombre || project?.name || project.id;
        const auditScore = orgAudit?.score ?? '—';
        const auditState = orgAudit?.state || 'no-data';
        const stage = project.aiClassification?.lifecycle_stage || '—';
        return `
        <div class="hub-zone hub-orgbar">
            <div class="hub-orgbar-row">
                <div><span class="label">🏢 Org</span> · <span class="value">${this._esc(orgName)}</span></div>
                <div><span class="label">Stage</span> · <span class="value">${this._esc(stage)}</span></div>
                <div><span class="label">Audit</span> · <span class="hub-pill ${auditState === 'green' ? 'green' : (auditState === 'yellow' ? 'yellow' : 'red')}">${auditScore}${typeof auditScore === 'number' ? '%' : ''}</span></div>
                ${org ? `<a href="/org/${encodeURIComponent(org.id)}" data-link style="margin-left:auto;color:var(--accent-indigo);font-size:0.75rem;font-weight:600;text-decoration:none;">→ Org dashboard</a>` : ''}
            </div>
        </div>`;
    }

    // v153 · _zone2_Today enriquit · KPIs + Top 3 WOs prioritaris + cash flow + upcoming
    _zone2_Today({ todayWos, cashBalance }) {
        const woWeekDone = (todayWos || []).filter(w => {
            const c = w.content || w; const ts = c.completedAt || c.doneAt;
            return ts && (Date.now() - ts) < 7 * 86400000;
        }).length;
        const alertsCount = (todayWos || []).filter(w => {
            const c = w.content || w; return c.priority === 'critical' || c.priority === 'high';
        }).length;
        // Top 3 WOs prioritaris · sort per priority + due
        const PRIO_ORDER = { critical: 4, high: 3, medium: 2, low: 1 };
        const top3 = [...(todayWos || [])]
            .sort((a, b) => (PRIO_ORDER[b.priority] || 0) - (PRIO_ORDER[a.priority] || 0))
            .slice(0, 3);
        // Cash flow setmanal · 7 dies · bar visual simple
        const days7 = this._weeklyFlow(this._project?.ledger || []);
        const maxAbs = Math.max(...days7.map(d => Math.max(Math.abs(d.inflow), Math.abs(d.outflow))), 1);
        const projId = encodeURIComponent(this.projectId);

        return `
        <div class="hub-zone">
            <div class="hub-zone-head">
                <h2>🎯 Avui · activitat del projecte</h2>
                <a href="/kanban?project=${projId}" data-link>→ Kanban complet</a>
            </div>

            <!-- v153 · 4 KPI cards -->
            <div class="hub-today-kpis">
                <div class="hub-today-kpi">
                    <div class="num">${(todayWos || []).length}</div>
                    <div class="lbl">WOs actius</div>
                </div>
                <div class="hub-today-kpi">
                    <div class="num">${woWeekDone}</div>
                    <div class="lbl">Done setmana</div>
                </div>
                <div class="hub-today-kpi">
                    <div class="num">${formatCostEur(cashBalance)}</div>
                    <div class="lbl">Saldo wallet</div>
                </div>
                <div class="hub-today-kpi" style="${alertsCount > 0 ? 'border-color:var(--accent-orange);' : ''}">
                    <div class="num" style="${alertsCount > 0 ? 'color:var(--accent-orange);' : ''}">${alertsCount}</div>
                    <div class="lbl">Prioritat alta</div>
                </div>
            </div>

            <!-- v153 · Top 3 WOs prioritaris -->
            ${top3.length === 0
                ? '<div class="hub-empty" style="margin-top:10px;">Cap WO pendent · <a href="/kanban?project=' + projId + '" data-link style="color:var(--accent-indigo);">crea\'n una a Kanban →</a></div>'
                : `<div class="hub-today-top3" style="margin-top:12px;">
                    <div class="hub-today-subhead">📌 Top 3 prioritaris</div>
                    ${top3.map(w => {
                        const c = w.content || w;
                        const prioColor = c.priority === 'critical' ? 'var(--accent-red)'
                            : c.priority === 'high' ? 'var(--accent-orange)'
                            : c.priority === 'medium' ? 'var(--accent-indigo)' : 'var(--text-muted)';
                        const dueStr = c.dueAt ? this._formatRelativeTime(c.dueAt) : '';
                        return `<a href="/kanban?project=${projId}&wo=${encodeURIComponent(w.id || c.id || '')}" data-link class="hub-today-wo">
                            <div class="ttl">${this._esc(c.title || w.title || w.id)}</div>
                            <div class="meta">
                                <span class="prio" style="color:${prioColor};">● ${this._esc(c.priority || 'medium')}</span>
                                <span class="status">${this._esc(c.status || w.status || 'pending')}</span>
                                ${dueStr ? `<span class="due">⏰ ${this._esc(dueStr)}</span>` : ''}
                            </div>
                        </a>`;
                    }).join('')}
                </div>`}

            <!-- v153 · Cash flow setmanal · bar visual -->
            ${days7.some(d => d.inflow > 0 || d.outflow > 0) ? `
                <div class="hub-today-cashflow" style="margin-top:14px;">
                    <div class="hub-today-subhead">💸 Cash flow · 7 dies</div>
                    <div class="hub-cf-bars">
                        ${days7.map(d => {
                            const inH = (d.inflow / maxAbs) * 100;
                            const outH = (d.outflow / maxAbs) * 100;
                            return `<div class="hub-cf-day" title="${d.label} · +${d.inflow.toFixed(2)}€ · -${d.outflow.toFixed(2)}€">
                                <div class="bar-stack">
                                    <div class="bar-in"  style="height:${inH}%;"></div>
                                    <div class="bar-out" style="height:${outH}%;"></div>
                                </div>
                                <div class="day-lbl">${d.short}</div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
        <style>
            .hub-today-kpis { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:8px; }
            .hub-today-kpi { background:rgba(255,255,255,0.04); border:1px solid var(--border-default); border-radius:8px; padding:10px 12px; text-align:center; }
            .hub-today-kpi .num { font-size:1.4rem; font-weight:800; color:var(--accent-indigo); font-family:var(--font-mono); }
            .hub-today-kpi .lbl { font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; margin-top:3px; }
            .hub-today-subhead { font-size:0.78rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px; }
            .hub-today-top3 { display:flex; flex-direction:column; gap:6px; }
            .hub-today-wo { display:flex; flex-direction:column; gap:3px; padding:8px 12px; background:rgba(255,255,255,0.03); border:1px solid var(--border-default); border-radius:6px; text-decoration:none; color:var(--text-main); transition:all 0.15s; }
            .hub-today-wo:hover { border-color:var(--accent-indigo); background:rgba(99,102,241,0.08); }
            .hub-today-wo .ttl { font-size:0.88rem; font-weight:600; }
            .hub-today-wo .meta { display:flex; gap:10px; font-size:0.72rem; color:var(--text-muted); }
            .hub-today-wo .meta .prio { font-weight:700; }
            .hub-cf-bars { display:flex; gap:6px; align-items:flex-end; height:60px; padding:6px 0; }
            .hub-cf-day { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; }
            .hub-cf-day .bar-stack { width:100%; height:50px; display:flex; flex-direction:column-reverse; justify-content:flex-start; gap:1px; align-items:stretch; }
            .hub-cf-day .bar-in { background:var(--accent-green); border-radius:1px; min-height:1px; }
            .hub-cf-day .bar-out { background:var(--accent-red); border-radius:1px; min-height:1px; }
            .hub-cf-day .day-lbl { font-size:0.62rem; color:var(--text-muted); text-transform:uppercase; }
        </style>`;
    }

    // v153 · _weeklyFlow · pure · 7 dies inflow/outflow per al cash flow bar chart
    _weeklyFlow(ledger = []) {
        const now = Date.now();
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const t = new Date(now - i * 86400000);
            const dayStart = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
            const dayEnd = dayStart + 86400000;
            let inflow = 0, outflow = 0;
            for (const e of (ledger || [])) {
                const c = e.content || e;
                const ts = c.ts || c.createdAt || 0;
                if (ts < dayStart || ts >= dayEnd) continue;
                const amt = c.amount || 0;
                if (amt > 0) inflow += amt; else outflow += Math.abs(amt);
            }
            days.push({
                label: t.toLocaleDateString(),
                short: ['Dg','Dl','Dt','Dc','Dj','Dv','Ds'][t.getDay()],
                inflow, outflow,
            });
        }
        return days;
    }

    _zone3_Processes({ processes }) {
        const active = (processes || []).filter(p => p.status === 'active').slice(0, 6);
        return `
        <div class="hub-zone">
            <div class="hub-zone-head">
                <h2>🗺️ Processos · ${active.length} actius</h2>
                <a href="/map?project=${encodeURIComponent(this.projectId)}" data-link>→ Mapa de valor</a>
            </div>
            ${active.length === 0
                ? '<div class="hub-empty">Cap procés actiu · defineix-ne al mapa</div>'
                : `<div class="hub-proc-grid">${active.map(p => {
                    const stats = computeProcessStats(p);
                    const health = stats?.kpiHealthOverall || 'no-data';
                    const pill = health === 'green' ? 'green' : (health === 'yellow' ? 'yellow' : (health === 'red' ? 'red' : 'yellow'));
                    return `<div class="hub-proc-card" data-proc-id="${this._esc(p.id)}">
                        <div class="cat">${this._esc(p.category || '—')}</div>
                        <div class="lbl">${this._esc(p.label || p.id)}</div>
                        <div style="margin-top:6px;"><span class="hub-pill ${pill}">${health}</span> · ${stats?.kpiCount || 0} KPI</div>
                    </div>`;
                }).join('')}</div>`}
        </div>`;
    }

    _zone4_Suggestions({ suggestions }) {
        return `
        <div class="hub-zone">
            <div class="hub-zone-head">
                <h2>🧠 IA suggests · ${suggestions.length} disrupcions</h2>
            </div>
            ${suggestions.length === 0
                ? '<div class="hub-empty">Tot OK · sense disrupcions detectades aquest moment</div>'
                : suggestions.map((s, i) => `
                    <div class="hub-suggest" data-suggest-idx="${i}">
                        <div class="ttl"><span class="prio ${s.priority}">${this._esc(s.priority)}</span> ${this._esc(s.title)}</div>
                        <div class="msg">${this._esc(s.message)}</div>
                        ${s.action ? `<div class="act">
                            ${s.action.kind === 'navigate' ? `<a href="${this._esc(s.action.href)}" data-link>${this._esc(s.action.label)}</a>` : `<button data-suggest-action="${i}">${this._esc(s.action.label)}</button>`}
                            ${s.dismissable !== false ? `<button class="dismiss" data-suggest-dismiss="${i}">Dismiss</button>` : ''}
                        </div>` : ''}
                    </div>`).join('')}
        </div>`;
    }

    _zone5_Activity({ feed }) {
        return `
        <div class="hub-zone">
            <div class="hub-zone-head">
                <h2>💬 Activitat · ${feed.length} recent</h2>
                <a href="/registry" data-link>→ Registry permaweb</a>
            </div>
            ${feed.length === 0
                ? '<div class="hub-empty">Encara cap activitat enregistrada</div>'
                : feed.map(e => `
                    <div class="hub-act-item">
                        <div class="icon">${e.iconHint || '·'}</div>
                        <div class="body">
                            <div class="ttl">${this._esc(e.title)}</div>
                            <div class="meta">${e.actorHandle ? this._esc(e.actorHandle) + ' · ' : ''}${this._formatRelativeTime(e.ts)}</div>
                            ${e.summary ? `<div class="meta">${this._esc(e.summary)}</div>` : ''}
                        </div>
                    </div>`).join('')}
        </div>`;
    }

    _zone6_Actions({ project, bs, sessionEur }) {
        const budgetPill = bs.state === 'ok' ? 'green' : (bs.state === 'warning' ? 'yellow' : 'red');
        return `
        <div class="hub-zone">
            <div class="hub-zone-head">
                <h2>🚀 Quick actions</h2>
                <div style="display:flex;gap:8px;align-items:center;font-size:0.72rem;color:var(--text-secondary);">
                    <span>Sessió IA · ${formatCostEur(sessionEur)}</span>
                    <span class="hub-pill ${budgetPill}">budget ${(bs.ratio * 100).toFixed(0)}%</span>
                </div>
            </div>
            <div class="hub-actions">
                <a href="/kanban?project=${encodeURIComponent(project.id)}" data-link>📊 Nou WO</a>
                <a href="/canvas?project=${encodeURIComponent(project.id)}" data-link>🎨 Canvas</a>
                <a href="/pact?project=${encodeURIComponent(project.id)}" data-link>🤝 Pacte</a>
                <a href="/accounting?project=${encodeURIComponent(project.id)}" data-link>📒 Comptabilitat</a>
                <a href="/proposals?project=${encodeURIComponent(project.id)}" data-link>📝 Propostes</a>
                <a href="/sprint" data-link>🐝 Swarm</a>
            </div>
        </div>`;
    }

    _zone7_Knowledge({ project }) {
        // v152 · Knowledge cards redundants amb el pilar Treballar (Map · SOPs · Quality)
        // i el pilar Comptabilitzar (Tokenomics) · netejat per a no duplicar navegació.
        // Mantenim només els que NO viuen com a pilar sub-tab encara · Pitch doc ·
        // Workshops · Market. Substituïm "VNA · Mapa de valor" per CTA "Continuar creant"
        // que porta al CreateLiveView amb el projecte actual com a base (mode iteració).
        const items = [
            { ic: '✨', nm: 'Continuar creant', ds: 'Iterar el projecte amb IA',  href: '/create-live?project=' + project.id },
            { ic: '📣', nm: 'Pitch doc',       ds: 'Investor doc IA-sint.',       href: '/pitch-doc/' + project.id },
            { ic: '🎓', nm: 'Workshops',       ds: 'Formació · publicable',        href: '/workshops?project=' + project.id },
            { ic: '🛒', nm: 'Market',          ds: 'Productes/serveis al mercat', href: '/market?project=' + project.id },
        ];
        return `
        <div class="hub-zone">
            <div class="hub-zone-head">
                <h2>📚 Knowledge</h2>
                <a href="/lifecycle?project=${encodeURIComponent(project.id)}" data-link>→ Lifecycle dashboard</a>
            </div>
            <div class="hub-know-grid">
                ${items.map(it => `
                    <a href="${it.href}" data-link class="hub-know-card">
                        <div class="ic">${it.ic}</div>
                        <div class="nm">${it.nm}</div>
                        <div class="ds">${it.ds}</div>
                    </a>`).join('')}
            </div>
        </div>`;
    }

    _renderNotFound() {
        return `
        <div style="padding:2rem;text-align:center;font-family:var(--font-base);color:var(--text-main);">
            <h1>⚠ Projecte no trobat</h1>
            <p>L'id <code>${this._esc(this.projectId)}</code> no existeix al KB ni al store.</p>
            <a href="/dashboard" data-link style="color:var(--accent-indigo);">← Tornar al Dashboard</a>
        </div>`;
    }

    // ── Bind ──────────────────────────────────────────────────────────────

    _bind() {
        // Dismiss suggestions · session-only
        document.querySelectorAll('[data-suggest-dismiss]').forEach(btn => {
            btn.addEventListener('click', () => {
                const el = btn.closest('.hub-suggest');
                if (el) el.remove();
            });
        });
        // Process card click → /process/{id} (futur · ara fallback a /map)
        document.querySelectorAll('[data-proc-id]').forEach(card => {
            card.addEventListener('click', () => {
                const pid = card.getAttribute('data-proc-id');
                window.navigateTo('/map?project=' + encodeURIComponent(this.projectId) + '&proc=' + encodeURIComponent(pid));
            });
        });
        // Open invite modal
        document.querySelector('[data-action="open-invite"]')?.addEventListener('click', () => {
            this._openInviteModal();
        });
    }

    async _openInviteModal() {
        const wrap = document.createElement('div');
        const projId = this._project?.id || this.projectId;
        wrap.innerHTML = `
        <div id="hubInviteBg" role="dialog" aria-modal="true" aria-labelledby="hubInviteTitle" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:2000;display:flex;align-items:center;justify-content:center;padding:16px;font-family:var(--font-base);">
            <div style="background:var(--bg-panel);color:var(--text-main);border:1px solid var(--border-default);border-radius:12px;padding:1.3rem 1.5rem;max-width:480px;width:100%;">
                <div id="hubInviteTitle" style="font-weight:800;font-size:1.05rem;margin-bottom:0.4rem;">🤝 Convidar col·laborador a "${this._esc((this._project?.nombre || this._project?.name || projId).slice(0, 32))}"</div>
                <div style="color:var(--text-secondary);font-size:0.78rem;margin-bottom:0.8rem;">L'usuari rebrà la invitació al seu /inbox · pot acceptar o declinar · si accepta · es vincula al projecte amb el rol que tu li dones.</div>

                <label for="hubInviteHandle" style="display:block;font-size:0.78rem;font-weight:700;margin-bottom:4px;">Handle SOS del convidat *</label>
                <input id="hubInviteHandle" type="text" placeholder="@maria · @bob..." style="width:100%;box-sizing:border-box;padding:8px 12px;background:var(--bg-dark);color:var(--text-main);border:1px solid var(--border-default);border-radius:6px;font-family:var(--font-mono);margin-bottom:0.4rem;">
                <div id="hubInviteHandleStatus" style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:0.7rem;min-height:18px;">·</div>

                <label for="hubInviteRole" style="display:block;font-size:0.78rem;font-weight:700;margin-bottom:4px;">Rol *</label>
                <select id="hubInviteRole" style="width:100%;box-sizing:border-box;padding:8px 12px;background:var(--bg-dark);color:var(--text-main);border:1px solid var(--border-default);border-radius:6px;font-family:var(--font-base);margin-bottom:0.7rem;">
                    <option value="view">👁️ Read-only · només veure</option>
                    <option value="collab" selected>✏️ Col·laborador · edita canvas · WOs · pacts</option>
                    <option value="admin">🔑 Admin · tot + invitar altres</option>
                </select>

                <label for="hubInviteMsg" style="display:block;font-size:0.78rem;font-weight:700;margin-bottom:4px;">Missatge personalitzat (opcional)</label>
                <textarea id="hubInviteMsg" maxlength="500" placeholder="Hola · vols col·laborar al projecte X?" style="width:100%;box-sizing:border-box;min-height:60px;padding:8px 12px;background:var(--bg-dark);color:var(--text-main);border:1px solid var(--border-default);border-radius:6px;font-family:var(--font-base);font-size:0.85rem;resize:vertical;margin-bottom:0.8rem;"></textarea>

                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button id="hubInviteCancel" style="padding:8px 14px;border-radius:6px;border:1px solid var(--border-default);background:transparent;color:var(--text-secondary);cursor:pointer;font-weight:600;">Cancel</button>
                    <button id="hubInviteSend" style="padding:8px 16px;border-radius:6px;border:0;background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;cursor:pointer;font-weight:700;">📨 Convidar</button>
                </div>
            </div>
        </div>`;
        document.body.appendChild(wrap.firstElementChild);
        const modal = document.getElementById('hubInviteBg');
        const close = () => modal?.remove();
        const handleInput = document.getElementById('hubInviteHandle');
        const handleStatus = document.getElementById('hubInviteHandleStatus');

        // Live availability check com escriu
        let checkTimer = null;
        handleInput?.addEventListener('input', () => {
            if (checkTimer) clearTimeout(checkTimer);
            checkTimer = setTimeout(async () => {
                const val = (handleInput.value || '').trim();
                if (!val) { handleStatus.textContent = '·'; handleStatus.style.color = ''; return; }
                try {
                    const { validateHandleSyntax } = await import('../core/nicknameRegistryService.js');
                    const syn = validateHandleSyntax(val);
                    if (!syn.ok) {
                        handleStatus.textContent = '✗ ' + syn.reason;
                        handleStatus.style.color = '#ef4444';
                    } else {
                        handleStatus.textContent = '✓ Format vàlid · ' + syn.normalized;
                        handleStatus.style.color = '#22c55e';
                    }
                } catch (_) {}
            }, 200);
        });

        modal.addEventListener('click', e => { if (e.target === modal) close(); });
        document.getElementById('hubInviteCancel')?.addEventListener('click', close);
        document.getElementById('hubInviteSend')?.addEventListener('click', async () => {
            const handle = (handleInput?.value || '').trim();
            const role = document.getElementById('hubInviteRole')?.value || 'collab';
            const message = (document.getElementById('hubInviteMsg')?.value || '').trim();
            if (!handle) {
                const { toast } = await import('../core/uxComponents.js');
                toast({ kind: 'warn', text: 'Cal el handle' });
                handleInput?.focus();
                return;
            }
            try {
                const { validateHandleSyntax } = await import('../core/nicknameRegistryService.js');
                const syn = validateHandleSyntax(handle);
                if (!syn.ok) throw new Error(syn.reason);
                const { buildInvite } = await import('../core/projectInviteService.js');
                const { KB } = await import('../core/kb.js');
                const members = await KB.query({ type: 'matriu_member' }).catch(() => []);
                const fromHandle = (members.find(m => m && (m.content?.isPrimary || m.isPrimary))?.content?.handle) || null;
                if (!fromHandle) throw new Error('Cal crear identitat primer · /identity');
                const invite = buildInvite({
                    projectId: projId,
                    fromHandle,
                    toHandle: syn.normalized,
                    role,
                    message,
                });
                await KB.upsert(invite);
                const { toast } = await import('../core/uxComponents.js');
                toast({ kind: 'success', text: '✓ Convidat ' + syn.normalized + ' · rebrà al seu inbox' });
                close();
            } catch (e) {
                const { toast } = await import('../core/uxComponents.js');
                toast({ kind: 'error', text: 'Error: ' + (e?.message || e) });
            }
        });
    }

    // ── Loaders ────────────────────────────────────────────────────────────

    async _loadOrg(orgId) {
        if (!orgId) return null;
        try { return await KB.getNode(orgId); } catch (_) { return null; }
    }

    async _loadProcesses(projectId) {
        try {
            const all = await KB.query({ type: 'process' });
            return all.filter(p => {
                const proj = p.projectId || p.content?.projectId;
                // process is linked to org · we need project's org · for now skip filter
                // (the explorer filters by org via UI later)
                return !proj || proj === projectId;
            });
        } catch (_) {
            return [];
        }
    }

    async _getMyHandle() {
        try {
            const members = await KB.query({ type: 'matriu_member' });
            const primary = (members || []).find(m => m && (m.content?.isPrimary || m.isPrimary));
            return primary?.content?.handle || null;
        } catch (_) { return null; }
    }

    _computeCashBalance(ledger) {
        let balance = 0;
        for (const e of (ledger || [])) {
            if (e.content?.debitAccount === 'cash') balance += e.content.amount || 0;
            if (e.content?.creditAccount === 'cash') balance -= e.content.amount || 0;
        }
        return balance;
    }

    _prioRank(p) {
        return ({ critical: 4, high: 3, medium: 2, low: 1 })[p] || 2;
    }

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

    destroy() {
        // Cleanup if needed
    }
}

export { TPL_VERSION };
