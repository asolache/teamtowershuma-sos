// =============================================================================
// TEAMTOWERS SOS V11 — ROUTER
// SPA Router · Rutas relativas · Base: sos.teamtowershuma.com
// =============================================================================

import { store } from './core/store.js';

const ROUTES = [
    { path: '/',          view: () => import('./views/HomeView.js') },
    { path: '/dashboard', view: () => import('./views/HomeView.js') }, // placeholder
    { path: '/team',      view: () => import('./views/HomeView.js') }, // placeholder
    { path: '/paper',     view: () => import('./views/HomeView.js') }, // placeholder
    { path: '/lms',       view: () => import('./views/HomeView.js') }, // placeholder
    { path: '/map',       view: () => import('./views/HomeView.js') }, // placeholder
    { path: '/settings',  view: () => import('./views/HomeView.js') }, // placeholder
    { path: '/focus',     view: () => import('./views/HomeView.js') }, // placeholder
    { path: null,         view: () => import('./views/HomeView.js') }, // 404
];

async function router() {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    const match = ROUTES.find(r => r.path === path) || ROUTES.find(r => r.path === null);

    try {
        await store.init();

        const module    = await match.view();
        const ViewClass = module.default;
        const view      = new ViewClass();
        const app       = document.getElementById('app');

        app.innerHTML = await view.getHtml();

        if (typeof view.afterRender === 'function') await view.afterRender();

        // Delegación de clicks para data-link
        document.querySelectorAll('[data-link]').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                navigateTo(link.getAttribute('href'));
            });
        });

    } catch (err) {
        console.error('[Router V11] Error:', err);
        document.getElementById('app').innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;
                        height:100dvh;flex-direction:column;gap:1rem;
                        color:#888;font-family:monospace;">
                <div style="font-size:3rem;">💥</div>
                <div style="color:#ff5252;">Error: ${err.message}</div>
            </div>`;
    } finally {
        // Ocultar bootloader
        const boot = document.getElementById('bootloader');
        if (boot) {
            boot.classList.add('done');
            setTimeout(() => boot.remove(), 700);
        }
    }
}

export function navigateTo(url) {
    window.history.pushState(null, null, url);
    router();
}

window.addEventListener('popstate', router);

document.addEventListener('click', e => {
    const link = e.target.closest('[data-link]');
    if (link) { e.preventDefault(); navigateTo(link.getAttribute('href')); }
});

router();
