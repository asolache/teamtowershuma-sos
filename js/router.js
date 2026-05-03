// TEAMTOWERS SOS V11 — ROUTER
import { store } from './core/store.js';

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
