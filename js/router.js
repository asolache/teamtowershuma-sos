// TEAMTOWERS SOS V11 — ROUTER
import { store } from './core/store.js';
import { KB }    from './core/kb.js';
// UX-NAV-002 · estilos y bind globales para los dropdowns de navegación.
// UX-NAV-003 · breadcrumb dinámico bajo la topbar.
// Inyectados una vez tras cada render para que funcionen sin que cada
// vista tenga que llamarlo a mano.
import {
    ensureNavGroupStyle, bindNavGroupDropdowns,
    paintBreadcrumb,
} from './core/navService.js';
import { bootTheme } from './core/themeService.js';

const ROUTES = [
    { path: '/',          view: () => import('./views/DashboardView.js') },
    { path: '/dashboard', view: () => import('./views/DashboardView.js') },
    { path: '/team',      view: () => import('./views/HomeView.js')     },
    { path: '/paper',     view: () => import('./views/HomeView.js')     },
    { path: '/lms',       view: () => import('./views/HomeView.js')     },
    { path: '/map',       view: () => import('./views/ValueMapView.js')  },
    { path: '/workshops', view: () => import('./views/WorkshopsView.js') },
    { path: '/kanban',    view: () => import('./views/KanbanView.js')   },
    { path: '/sops',      view: () => import('./views/SopsView.js')     },
    { path: '/focus',     view: () => import('./views/HomeView.js')     },
    { path: '/settings',  view: () => import('./views/SettingsView.js') },
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
    // VAL-001 sprint B · vista /value-accounting · tarta del proyecto (Slicing Pie + FairShares)
    { path: '/value-accounting', view: () => import('./views/ValueAccountingView.js') },
    // PACT-001 sprint B · UI builder del primer contrato (pacto socios)
    { path: '/pact',      view: () => import('./views/PactBuilderView.js') },
    { path: null,         view: () => import('./views/HomeView.js')     },
];

// UX-001 · prefijo dinámico /n/{nodeId} resuelto por NodeView
const NODE_PATH_PREFIX    = '/n/';
// UX-001 sprint C · prefijo dinámico /project/{projectId} resuelto por ProjectHubView
const PROJECT_PATH_PREFIX = '/project/';

async function router() {
    const path  = window.location.pathname.replace(/\/$/, '') || '/';
    let match;
    if (path.startsWith(NODE_PATH_PREFIX)) {
        match = { path, view: () => import('./views/NodeView.js') };
    } else if (path.startsWith(PROJECT_PATH_PREFIX)) {
        match = { path, view: () => import('./views/ProjectHubView.js') };
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
        document.querySelectorAll('[data-link]').forEach(link => {
            link.addEventListener('click', e => { e.preventDefault(); navigateTo(link.getAttribute('href')); });
        });
        // UX-NAV-002 · CSS de los dropdowns + bind toggle (idempotente).
        // Ejecutar después de los data-link para que los anchors dentro del
        // menú también respondan al SPA. App entera comparte el CSS único.
        ensureNavGroupStyle();
        bindNavGroupDropdowns(document.getElementById('app') || document);

        // UX-NAV-003 · breadcrumb dinámico bajo la topbar (zero changes en
        // vistas individuales · el slot se gestiona aquí). Calcula la fase
        // del proyecto activo si lo hay, vía stats del KB.
        try {
            let slot = document.getElementById('sos-breadcrumb-slot');
            if (!slot) {
                slot = document.createElement('div');
                slot.id = 'sos-breadcrumb-slot';
                // Insertar como hermano del #app, justo antes de él en el body.
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
