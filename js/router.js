// TEAMTOWERS SOS V11 — ROUTER
import { store } from './core/store.js';
import { KB }    from './core/kb.js';
// UX-NAV-002 · estilos y bind globales para los dropdowns de navegación.
// UX-NAV-003 · breadcrumb dinámico bajo la topbar.
// Inyectados una vez tras cada render para que funcionen sin que cada
// vista tenga que llamarlo a mano.
import {
    ensureNavGroupStyle, bindNavGroupDropdowns,
    paintBreadcrumb, paintBottomNav, paintGlobalNav,
    paintProjectSubnav,
} from './core/navService.js';
import { bootTheme } from './core/themeService.js';

const ROUTES = [
    { path: '/',          view: () => import('./views/DashboardV2View.js') },
    { path: '/home',      view: () => import('./views/DashboardV2View.js') },
    { path: '/dashboard', view: () => import('./views/DashboardView.js') },
    { path: '/create',    view: () => import('./views/ProjectCreationV2View.js') },
    { path: '/team',      view: () => import('./views/HomeView.js')     },
    { path: '/paper',     view: () => import('./views/HomeView.js')     },
    { path: '/lms',       view: () => import('./views/HomeView.js')     },
    { path: '/map',       view: () => import('./views/ValueMapView.js')  },
    { path: '/workshops', view: () => import('./views/WorkshopsView.js') },
    { path: '/kanban',    view: () => import('./views/KanbanView.js')   },
    { path: '/sops',      view: () => import('./views/SopsView.js')     },
    { path: '/focus',     view: () => import('./views/HomeView.js')     },
    { path: '/settings',     view: () => import('./views/SettingsView.js') },
    { path: '/settings-v2',  view: () => import('./views/SettingsV2View.js') },
    // UX-001 · folksonomía universal
    { path: '/tags',      view: () => import('./views/TagsView.js')     },
    // MKT-001 · Mercado SOS
    { path: '/market',    view: () => import('./views/MarketView.js')   },
    // AUTH-001 · identidad operador
    { path: '/identity',  view: () => import('./views/IdentityView.js') },
    // KM-001 · folders inteligentes
    { path: '/folders',   view: () => import('./views/FoldersView.js')  },
    // H8.1 · vista panorámica del Mind-as-Graph
    { path: '/mind',      view: () => import('./views/MindGraphView.js') },
    // KM-001 sprint E2 · dashboard de eficiencia (tokens / coste / pruning)
    { path: '/efficiency',view: () => import('./views/EfficiencyView.js') },
    // MKT-001 sprint C · wallet prepago por proyecto
    { path: '/wallet',    view: () => import('./views/WalletView.js')    },
    // MKT-001 sprint D · cuadro comparativo de ahorro acumulado vs convencional
    { path: '/savings',   view: () => import('./views/SavingsView.js')   },
    // MAT-002-H · landing pública Matriu Incoopadora
    { path: '/matriu',    view: () => import('./views/MatriuLandingView.js') },
    // MAT-002-I sprint A · vista /matriu/network · directori de les 108 places
    { path: '/matriu/network', view: () => import('./views/MatriuNetworkView.js') },
    // UX-EDU-001 sprint C · vista /learn glosario navegable + progreso "ya leído"
    { path: '/learn',     view: () => import('./views/LearnView.js') },
    // SKILL-TAX-002 sprint B · vista /skills · directori 90 skills amb filtres
    { path: '/skills',    view: () => import('./views/SkillsExplorerView.js') },
    // UX-AUDIT-001 sprint H+ · /sectors · substitueix el botó "Knowledge Base" del Dashboard
    { path: '/sectors',   view: () => import('./views/SectorsView.js') },
    // PERM-USER-001 sprint E · /registry · permaweb public registry
    { path: '/registry',  view: () => import('./views/RegistryView.js') },
    { path: '/timeline',         view: () => import('./views/TimelineView.js') },
    { path: '/inbox',            view: () => import('./views/InboxView.js') },
    { path: '/process-catalog',  view: () => import('./views/ProcessCatalogView.js') },
    // FUND-FLOW-001 sprint F · /opportunities · projectes públics permaweb
    { path: '/opportunities', view: () => import('./views/OpportunitiesView.js') },
    { path: '/discover',      view: () => import('./views/OpportunitiesView.js') },
    // VAL-001 sprint B · vista /value-accounting · tarta del proyecto (Slicing Pie + FairShares)
    { path: '/value-accounting', view: () => import('./views/ValueAccountingView.js') },
    // PACT-001 sprint B · UI builder del primer contrato (pacto socios)
    { path: '/pact',      view: () => import('./views/PactBuilderView.js') },
    // UX-AUDIT-001 sprint A2 · vista landing del projecte (read-only · presentació)
    { path: '/presentation', view: () => import('./views/PresentationView.js') },
    // UX-AUDIT-001 sprint A2 · mockup mobile app (Work Orders + temps + permaweb + IA + saldo)
    { path: '/mobile',       view: () => import('./views/MobileMockupView.js') },
    // PROJ-QUALITY-001 sprint E · vista detall qualitat del projecte
    { path: '/quality',      view: () => import('./views/ProjectQualityView.js') },
    // NEURAL-PATH-001 sprint B · timeline d'activitat + bundle builder
    { path: '/path',         view: () => import('./views/NeuralPathView.js') },
    // SWARM-OP-001 · sprint orchestrator · backlog autonomous + IA runs
    { path: '/sprint',       view: () => import('./views/SprintView.js') },
    // CANVAS-WIZARD sprint A · /canvas?project=X · 5-step project canvas
    { path: '/canvas',       view: () => import('./views/ProjectCanvasView.js') },
    // LEDGER-ACCOUNTING sprint A · /accounting?project=X · double-entry
    { path: '/accounting',   view: () => import('./views/AccountingView.js') },
    // LIFECYCLE-DASHBOARD sprint A · /lifecycle?project=X · 10 phases status
    { path: '/lifecycle',    view: () => import('./views/ProjectLifecycleView.js') },
    // INVOICE-BILLING sprint A · /invoices?project=X · CRUD + auto-ledger
    { path: '/invoices',     view: () => import('./views/InvoiceView.js') },
    // TOKENOMICS sprint A · /tokenomics?project=X · designer + vesting
    { path: '/tokenomics',   view: () => import('./views/TokenomicsView.js') },
    // PITCH-PUBLIC sprint A · /pitch?project=X · public one-pager + edit
    { path: '/pitch',        view: () => import('./views/ProjectPitchView.js') },
    // PROPOSAL-GENERATOR sprint A · /proposals?project=X · IA brief + skill match
    { path: '/proposals',    view: () => import('./views/ProposalView.js') },
    // SWARM-PARALLEL sprint A · /swarm?project=X · DAG executor paral·lel
    { path: '/swarm',        view: () => import('./views/SwarmFlowView.js') },
    // IMPROVEMENT-LOOP sprint A · /improve?project=X · TDD WO + feedback agent kanban
    { path: '/improve',      view: () => import('./views/ImprovementLoopView.js') },
    // DESIGN-SYSTEM sprint A · /design · mockup deluxe + arquitectura informació + components
    { path: '/design',       view: () => import('./views/DesignSystemView.js') },
    { path: null,         view: () => import('./views/HomeView.js')     },
];

// UX-001 · prefijo dinámico /n/{nodeId} resuelto por NodeView
const NODE_PATH_PREFIX    = '/n/';
// MARKET-CATALOG sprint A · /market/{id} · detail view multi-source
const MARKET_PATH_PREFIX  = '/market/';
// PROFILE sprint A · /u/{handle} · perfil públic d'usuari amb skills + projects
const PROFILE_PATH_PREFIX = '/u/';
// UX-001 sprint C · prefijo dinámico /project/{projectId} ·
// 2026-05-15 · /project/{id} ara resol al ProjectHubV2View (clean 7-zones).
// L'antic ProjectHubView accessible a /project-classic/{id} per a
// power-users que necessitin swarm matchmaker · permaweb publish · etc.
const PROJECT_PATH_PREFIX = '/project/';
const PROJECT_CLASSIC_PATH_PREFIX = '/project-classic/';
// UX-CENTRAL-HUB-001 · /hub/{projectId} · nou layout 7-zones consumint
// activityFeedService + iaSuggestionsService. L'antic /project/{id} es manté.
const HUB_V2_PATH_PREFIX = '/hub/';
// PITCH-REFRAME-001 · /pitch-doc/{projectId} · document visual investor
// auto-generat des de canvas + VNA + tokenomics + ledger + proposals.
const PITCH_DOC_PATH_PREFIX = '/pitch-doc/';

async function router() {
    const path  = window.location.pathname.replace(/\/$/, '') || '/';
    let match;
    if (path.startsWith(NODE_PATH_PREFIX)) {
        match = { path, view: () => import('./views/NodeView.js') };
    } else if (path.startsWith(MARKET_PATH_PREFIX)) {
        match = { path, view: () => import('./views/MarketDetailView.js') };
    } else if (path.startsWith(PROFILE_PATH_PREFIX)) {
        match = { path, view: () => import('./views/ProfileView.js') };
    } else if (path.startsWith(PITCH_DOC_PATH_PREFIX)) {
        match = { path, view: () => import('./views/InvestorPitchView.js') };
    } else if (path.startsWith(HUB_V2_PATH_PREFIX)) {
        match = { path, view: () => import('./views/ProjectHubV2View.js') };
    } else if (path.startsWith(PROJECT_CLASSIC_PATH_PREFIX)) {
        match = { path, view: () => import('./views/ProjectHubView.js') };
    } else if (path.startsWith(PROJECT_PATH_PREFIX)) {
        match = { path, view: () => import('./views/ProjectHubV2View.js') };
    } else {
        match = ROUTES.find(r => r.path === path) || ROUTES.find(r => r.path === null);
    }

    try {
        await store.init();
        // UX-AUDIT-001 · aplica el tema persistit (light/dark) abans del primer render
        try { await bootTheme(); } catch (_) { /* non-blocking */ }
        // Destruir vista anterior (detener simulaciones D3, etc.)
        if (window.__currentView && typeof window.__currentView.destroy === 'function') {
            window.__currentView.destroy();
        }
        const module    = await match.view();
        const ViewClass = module.default;
        const view      = new ViewClass();
        window.__currentView = view;
        const app       = document.getElementById('app');
        app.innerHTML   = await view.getHtml();
        if (typeof view.afterRender === 'function') await view.afterRender();
        // Mobile bottom-nav · global · injectat un cop · active state actualitzat
        // a cada navegació. Visible només a pantalles < 768px (CSS media query).
        try {
            const { injectOrUpdate } = await import('./core/mobileBottomNav.js');
            injectOrUpdate({ pathname: path });
        } catch (_) { /* non-blocking */ }
        // Mobile topbar · drawer · hide-on-scroll · global · < 768px només.
        // Aporta navegació completa via "⋯" sense ocupar pantalla.
        try {
            const { injectOrUpdate: injTopbar } = await import('./core/mobileTopbar.js');
            injTopbar({ pathname: path });
        } catch (_) { /* non-blocking */ }
        // A11Y · W3C/WCAG · global skip-link + live-region + focus-visible CSS
        try {
            const { injectGlobalA11y } = await import('./core/a11yService.js');
            injectGlobalA11y();
        } catch (_) { /* non-blocking */ }
        // Quick Capture FAB · cervell SOS · "+" floating · noies/WO/idees/skills
        // Activable amb la tecla "c" o click al botó · al fons-dreta.
        try {
            const { injectGlobalFab } = await import('./core/quickCaptureFab.js');
            injectGlobalFab();
        } catch (_) { /* non-blocking */ }
        // Global Search · cmd-K / Ctrl-K / "/" · accés instantani a tot el KB
        // Pattern Linear/Notion · cercador modal · keyboard nav · mobile bottom-sheet
        try {
            const { injectGlobal: injSearch } = await import('./core/globalSearch.js');
            injSearch();
        } catch (_) { /* non-blocking */ }
        // First-run onboarding · welcome modal · només si l'usuari mai l'ha vist
        // Es mostra al primer entry page · explica "cervell SOS" en 4 slides
        if (path === '/' || path === '/home') {
            try {
                const { maybeShow } = await import('./core/firstRunOnboarding.js');
                maybeShow();
            } catch (_) { /* non-blocking */ }
        }
        // Presence heartbeat · global · marca lastSeen cada 30s mentre app oberta
        // Permet a altres usuaris (futur federat) veure si estem online.
        try {
            const { startHeartbeat } = await import('./core/presenceService.js');
            startHeartbeat();
        } catch (_) { /* non-blocking */ }
        // NEURAL-PATH-001 · log de visita · fire-and-forget · zero bloqueig
        (async () => {
            try {
                const { appendStep } = await import('./core/neuralPathService.js');
                const { KB } = await import('./core/kb.js');
                const identities = await KB.query({ type: 'user_identity' }).catch(() => []);
                const ownerHandle = identities[0]?.content?.handle || '@alvaro';
                const params = new URLSearchParams(window.location.search || '');
                const projectId = params.get('project') || null;
                await appendStep({
                    kb: KB,
                    ownerHandle,
                    kind: 'visit',
                    route: window.location.pathname + window.location.search,
                    projectId,
                    summary: 'Visita · ' + path,
                });
            } catch (_) { /* silent */ }
        })();
        // UX-AUDIT-001 sprint A2 · el delegado global en `document` (al final
        // de este módulo) ya cubre todos los [data-link]. Antes se añadía
        // además un listener por elemento aquí, lo que disparaba navigateTo
        // dos veces por click → pushState duplicado + router() ejecutándose
        // dos veces → flickering ("papallugues").
        // UX-NAV-002 · CSS de los dropdowns + bind toggle (idempotente).
        // Ejecutar después de los data-link para que los anchors dentro del
        // menú también respondan al SPA. App entera comparte el CSS único.
        ensureNavGroupStyle();
        bindNavGroupDropdowns(document.getElementById('app') || document);

        // UX-AUDIT-001 sprint H+ pass 5 · Global Nav sticky al top · ABANS
        // del breadcrumb. Slot únic gestionat aquí · cada vista no la incrusta.
        try {
            let gslot = document.getElementById('sos-global-nav-slot');
            if (!gslot) {
                gslot = document.createElement('div');
                gslot.id = 'sos-global-nav-slot';
                const app = document.getElementById('app');
                if (app && app.parentNode) {
                    app.parentNode.insertBefore(gslot, app);
                } else {
                    document.body.insertBefore(gslot, document.body.firstChild);
                }
            }
            paintGlobalNav({ pathname: window.location.pathname, search: window.location.search });
        } catch (e) { console.warn('[Router · global-nav]', e); }

        // UX-NAV-003 · breadcrumb dinámico bajo la topbar (zero changes en
        // vistas individuales · el slot se gestiona aquí). Calcula la fase
        // del proyecto activo si lo hay, vía stats del KB.
        try {
            let slot = document.getElementById('sos-breadcrumb-slot');
            if (!slot) {
                slot = document.createElement('div');
                slot.id = 'sos-breadcrumb-slot';
                // Insertar como hermano del #app, justo antes de él en el body
                // PERÒ després del global-nav-slot (que ja existeix per inserció anterior).
                const app = document.getElementById('app');
                if (app && app.parentNode) {
                    app.parentNode.insertBefore(slot, app);
                } else {
                    document.body.insertBefore(slot, document.body.firstChild);
                }
            }
            const projects = (store.getState().projects || []);
            // Heurística de fase · si hay proyecto activo, contamos sops/wos
            const params = new URLSearchParams(window.location.search);
            const pid = params.get('project') || (window.location.pathname.startsWith('/project/')
                ? decodeURIComponent(window.location.pathname.slice(9)) : null);
            let projectStats = null;
            if (pid) {
                try {
                    await KB.init();
                    const sops = await KB.query({ type: 'sop', projectId: pid });
                    const wos  = await KB.query({ type: 'work_order', projectId: pid });
                    projectStats = {
                        sopsCount:  (sops || []).length,
                        woBacklog:  (wos || []).filter(w => w?.content?.status === 'backlog').length,
                        woDoing:    (wos || []).filter(w => w?.content?.status === 'doing').length,
                        woLedgered: (wos || []).filter(w => w?.content?.status === 'ledgered').length,
                    };
                } catch (e) { /* breadcrumb sigue funcionando sin stats */ }
            }
            await paintBreadcrumb({
                targetEl: slot,
                pathname: window.location.pathname,
                search:   window.location.search,
                projects,
                projectStats,
            });
        } catch (e) { console.warn('[Router · breadcrumb]', e); }

        // PROJ-QUALITY-001 sprint C · Project subnav · sub-barra contextual amb
        // 10 tabs del projecte actiu + score qualitat + cta "Següent".
        // Apareix sols si hi ha ?project= o /project/{id}. Idempotent.
        try {
            const projects = (store.getState().projects || []);
            await paintProjectSubnav({
                pathname: window.location.pathname,
                search:   window.location.search,
                projects,
            });
        } catch (e) { console.warn('[Router · project-subnav]', e); }

        // UX-AUDIT-001 sprint F · bottom nav mòbil · 5 categories canòniques
        try {
            paintBottomNav({
                pathname: window.location.pathname,
                search:   window.location.search,
            });
        } catch (e) { console.warn('[Router · bottom-nav]', e); }

        // WALLET-AUTH-001 sprint D · bind delegation per al modal "🔑 Identifica't"
        try {
            const { bindIdentifyTriggers } = await import('./core/identifyModalService.js');
            bindIdentifyTriggers();
        } catch (e) { /* silent */ }

        // PERM-DISCO-001 sprint A · background sync silent · cooldown 1h
        // Es dispara a CADA navigation però el throttle a syncSchedulerService
        // evita que es repeteixi · sols 1 sync per hora màxim · silent UX
        // (status badge invisible si sync no toca).
        try {
            const { triggerSyncIfDue } = await import('./core/syncSchedulerService.js');
            triggerSyncIfDue({
                onStart: () => _paintSyncBadge('syncing'),
                onDone:  (res) => _paintSyncBadge('done', res),
                onError: (e)   => _paintSyncBadge('error', e),
            }).catch(() => {});  // silent
        } catch (e) { console.warn('[Router · bg-sync]', e); }
    } catch (err) {
        console.error('[Router V11]', err);
        document.getElementById('app').innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100dvh;flex-direction:column;gap:1rem;color:#888;font-family:monospace;">
                <div style="font-size:3rem;">💥</div>
                <div style="color:#ff5252;">${err.message}</div>
                <a href="/" data-link style="color:#6366f1;font-size:0.85rem;">← Inicio</a>
            </div>`;
    } finally {
        const boot = document.getElementById('bootloader');
        if (boot) { boot.classList.add('done'); setTimeout(() => boot.remove(), 700); }
    }
}

// PERM-DISCO-001 sprint A · status badge del background sync
// Estats: 'syncing' (pulse indigo) · 'done' (verd 4s) · 'error' (taronja 4s)
function _ensureSyncBadgeSlot() {
    let el = document.getElementById('sos-sync-badge');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'sos-sync-badge';
    el.style.cssText = 'position:fixed;top:8px;right:12px;z-index:9991;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;font-family:var(--font-mono);pointer-events:none;opacity:0;transition:opacity 0.3s ease;';
    document.body.appendChild(el);
    return el;
}
function _paintSyncBadge(state, payload) {
    const el = _ensureSyncBadgeSlot();
    let text = '', bg = '', color = '', autoHideMs = 0;
    if (state === 'syncing') {
        text = '🔄 Sync permaweb…';
        bg = 'rgba(99,102,241,0.15)'; color = '#6366f1';
    } else if (state === 'done') {
        const fetched = payload?.fetched ?? 0;
        const cached  = payload?.cached  ?? 0;
        text = `✓ Sync · ${fetched} entries · ${cached} cache`;
        bg = 'rgba(0,230,118,0.12)'; color = '#00e676'; autoHideMs = 4200;
    } else if (state === 'error') {
        text = '⚠ Sync · ' + (payload?.message || 'error').slice(0, 40);
        bg = 'rgba(250,204,21,0.12)'; color = '#facc15'; autoHideMs = 5400;
    }
    el.style.background = bg;
    el.style.color = color;
    el.style.border = '1px solid ' + color + '40';
    el.textContent = text;
    el.style.opacity = '1';
    if (autoHideMs > 0) {
        setTimeout(() => { el.style.opacity = '0'; }, autoHideMs);
    }
}

export function navigateTo(url) {
    window.history.pushState(null, null, url);
    router();
}

window.navigateTo = navigateTo;
window.addEventListener('popstate', router);
document.addEventListener('click', e => {
    const link = e.target.closest('[data-link]');
    if (link) { e.preventDefault(); navigateTo(link.getAttribute('href')); }
});

router();
