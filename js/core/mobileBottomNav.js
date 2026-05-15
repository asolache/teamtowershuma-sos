// =============================================================================
// TEAMTOWERS SOS V11 — MOBILE BOTTOM NAV (UX-MOBILE-D · sprint mobile-first)
// Ruta · /js/core/mobileBottomNav.js
//
// Component injectat globalment pel router · barra inferior fixed amb 5
// destinacions primàries · només visible en pantalles < 768px (mobile).
// Active state derivat del pathname actual. Persistent · no es reinjecta
// al canvi de vista · sols actualitza l'active state.
//
// Pure DOM · zero deps · safe en Node (typeof document guards).
// =============================================================================

const NAV_ID = 'sos-mobile-bottom-nav';
const CSS_ID = 'sos-mobile-bottom-nav-css';
const MOBILE_BREAKPOINT = '768px';

// 5 primaris · "daily mass flow" del usuari · SOS com a cervell personal ·
// Home (avui) · Timeline (xarxa) · Crear (contribuir valor) · Mercat
// (descobrir valor) · Jo (identitat + wallet + skills).
// (cap zona ≥7 · Miller's Law) · W3C/WCAG aria-labels semàntics
const PRIMARY = Object.freeze([
    { id: 'home',     icon: '🏠', label: 'Avui',      match: ['/', '/home'] },
    { id: 'timeline', icon: '💬', label: 'Xarxa',     match: ['/timeline', '/registry'] },
    { id: 'create',   icon: '➕', label: 'Crea',       match: ['/create', '/dashboard'] },
    { id: 'market',   icon: '🛒', label: 'Descobreix', match: ['/market', '/opportunities', '/process-catalog'] },
    { id: 'me',       icon: '👤', label: 'Jo',         match: ['/identity', '/wallet', '/u/', '/settings', '/settings-v2'] },
]);

// hrefs per a cada item · sense projectId (els primaris no apliquen)
const HREF_BY_ID = Object.freeze({
    home:     '/home',
    timeline: '/timeline',
    create:   '/create',
    market:   '/market',
    me:       '/identity',
});

// _isActive · pure · pathname.match? (per a "/u/{handle}" usem startsWith)
function _isActive(item, pathname = '/') {
    if (!item || !pathname) return false;
    return (item.match || []).some(m => {
        // Cas exacte arrel · '/' només matcha '/' (no qualsevol path)
        if (m === '/') return pathname === '/';
        // Prefix match · 'foo/' matcha 'foo/bar' · 'foo/x/y' · etc
        if (m.endsWith('/')) return pathname.startsWith(m);
        // Cas exact · 'foo' matcha 'foo' · 'foo/bar' · 'foo?x=1' (no 'foobar')
        return pathname === m || pathname.startsWith(m + '/') || pathname.startsWith(m + '?');
    });
}

// inferActiveId · pure helper · pathname → id (or null si cap match)
export function inferActiveId(pathname) {
    for (const item of PRIMARY) {
        if (_isActive(item, pathname)) return item.id;
    }
    return null;
}

// _ensureCss · injecta CSS una sola vegada
function _ensureCss() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(CSS_ID)) return;
    const style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = `
        .sos-mbn {
            display: none;
            position: fixed; bottom: 0; left: 0; right: 0;
            z-index: 1000;
            background: var(--bg-panel, #0f172a);
            border-top: 1px solid var(--border-default, #1e293b);
            padding: 6px 4px calc(6px + env(safe-area-inset-bottom)) 4px;
            font-family: var(--font-base, system-ui, sans-serif);
        }
        @media (max-width: ${MOBILE_BREAKPOINT}) {
            .sos-mbn { display: flex; }
            body { padding-bottom: 64px; }
        }
        .sos-mbn-item {
            flex: 1;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            padding: 6px 4px;
            gap: 2px;
            text-decoration: none;
            color: var(--text-secondary, #94a3b8);
            font-size: 0.65rem; font-weight: 600;
            border-radius: 6px;
            transition: background 0.15s, color 0.15s;
            min-width: 0;
        }
        .sos-mbn-item:active { background: rgba(99,102,241,0.18); }
        .sos-mbn-item.active { color: var(--text-main, #e2e8f0); background: rgba(99,102,241,0.15); }
        .sos-mbn-item .ic { font-size: 1.25rem; line-height: 1.1; }
        .sos-mbn-item .lb { line-height: 1; letter-spacing: 0.02em; }
    `;
    document.head.appendChild(style);
}

// renderHtml · pure · string del nav (test-friendly)
export function renderHtml({ activeId = null, primary = PRIMARY, hrefMap = HREF_BY_ID } = {}) {
    const items = primary.map(it => {
        const isActive = activeId === it.id;
        const href = hrefMap[it.id] || '/';
        return `<a class="sos-mbn-item${isActive ? ' active' : ''}" data-link href="${href}" aria-label="${it.label}">
            <span class="ic" aria-hidden="true">${it.icon}</span>
            <span class="lb">${it.label}</span>
        </a>`;
    }).join('');
    return `<nav class="sos-mbn" id="${NAV_ID}" role="navigation" aria-label="Mobile primary navigation">${items}</nav>`;
}

// injectOrUpdate · DOM · injecta el nav si no hi és · si hi és · actualitza
// només l'active state (no re-mount complet · evita flicker entre vistes).
export function injectOrUpdate({ pathname = null } = {}) {
    if (typeof document === 'undefined') return null;
    _ensureCss();
    const activeId = inferActiveId(pathname || window.location.pathname);
    let nav = document.getElementById(NAV_ID);
    if (!nav) {
        const wrap = document.createElement('div');
        wrap.innerHTML = renderHtml({ activeId });
        nav = wrap.firstChild;
        document.body.appendChild(nav);
    } else {
        // Update active state in-place
        nav.querySelectorAll('.sos-mbn-item').forEach((el, idx) => {
            const item = PRIMARY[idx];
            if (item) {
                if (item.id === activeId) el.classList.add('active');
                else el.classList.remove('active');
            }
        });
    }
    return nav;
}

// destroy · remove · for tests
export function destroy() {
    if (typeof document === 'undefined') return;
    const nav = document.getElementById(NAV_ID);
    if (nav) nav.remove();
    const css = document.getElementById(CSS_ID);
    if (css) css.remove();
}

// PRIMARY · exposat per a tests
export { PRIMARY, HREF_BY_ID, NAV_ID };
