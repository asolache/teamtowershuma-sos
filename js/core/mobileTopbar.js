// =============================================================================
// TEAMTOWERS SOS V11 — MOBILE TOPBAR (UX-LEGENDARY · mobile-first global)
// Ruta · /js/core/mobileTopbar.js
//
// Topbar minimal sticky · hide-on-scroll-down · show-on-scroll-up (Instagram /
// Twitter mobile pattern) · només visible < 768px · combinable amb el topbar
// que cada view ja inclou (aquest s'afegeix a sobre i s'amaga el del view via
// CSS override · només en mobile).
//
// Conté ·
//   - Logo TT (link /home)
//   - Títol breu de la pàgina (auto · des de document.title)
//   - "⋯" trigger del drawer off-canvas
//
// Drawer · slide-from-right · tots els links agrupats per categoria · keyboard
// trap focus (W3C). Tap backdrop · Escape · "✕" tanquen.
//
// L'objectiu UX · usuari mobil veu només contingut · scroll · "+" FAB ·
// bottom-nav 5 destins · drawer per a tot el demés.
// =============================================================================

const TOPBAR_ID    = 'sos-mobile-topbar';
const DRAWER_ID    = 'sos-mobile-drawer';
const CSS_ID       = 'sos-mobile-topbar-css';
const BACKDROP_ID  = 'sos-mobile-drawer-backdrop';

function _ensureCss() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(CSS_ID)) return;
    const style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = `
        /* Mobile topbar · només < 768px · global */
        .sos-mtb {
            position: fixed; top: 0; left: 0; right: 0;
            z-index: 990;
            background: var(--bg-panel, #0f172a);
            border-bottom: 1px solid var(--border-default, #1e293b);
            padding: 8px 12px calc(8px + env(safe-area-inset-top)) 12px;
            display: none;
            align-items: center; gap: 10px;
            min-height: 44px;
            transform: translateY(0);
            transition: transform 200ms ease-out;
            font-family: var(--font-base, system-ui, sans-serif);
        }
        .sos-mtb.hidden { transform: translateY(-100%); }
        .sos-mtb-logo {
            font-weight: 800; font-size: 0.95rem;
            color: var(--text-main, #e2e8f0);
            text-decoration: none;
            display: flex; align-items: center; gap: 4px;
        }
        .sos-mtb-logo span { color: var(--accent-indigo, #6366f1); }
        .sos-mtb-title {
            flex: 1; min-width: 0;
            font-size: 0.78rem;
            color: var(--text-secondary, #94a3b8);
            font-weight: 600;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            text-transform: uppercase; letter-spacing: 0.04em;
        }
        .sos-mtb-menu-btn {
            background: transparent; border: 0;
            color: var(--text-main, #e2e8f0);
            font-size: 1.5rem; line-height: 1;
            cursor: pointer;
            padding: 6px 8px;
            border-radius: 6px;
            min-width: 36px; min-height: 36px;
        }
        .sos-mtb-menu-btn:hover, .sos-mtb-menu-btn:focus-visible { background: var(--glass-hover, rgba(255,255,255,0.06)); }
        .sos-mtb-menu-btn:focus-visible { outline: 2px solid var(--accent-indigo, #6366f1); outline-offset: 1px; }

        /* Notification badge · pendents · DMs + invites · click /inbox */
        .sos-mtb-notif-btn {
            background: transparent; border: 0;
            color: var(--text-main, #e2e8f0);
            font-size: 1.3rem; line-height: 1;
            cursor: pointer;
            padding: 6px 8px;
            border-radius: 6px;
            min-width: 36px; min-height: 36px;
            position: relative;
            text-decoration: none;
            display: inline-flex; align-items: center; justify-content: center;
        }
        .sos-mtb-notif-btn:hover { background: var(--glass-hover, rgba(255,255,255,0.06)); }
        .sos-mtb-notif-badge {
            position: absolute; top: 2px; right: 2px;
            background: #ef4444; color: #fff;
            font-size: 0.6rem; font-weight: 700;
            min-width: 16px; height: 16px;
            border-radius: 999px;
            display: inline-flex; align-items: center; justify-content: center;
            padding: 0 4px;
            border: 1.5px solid var(--bg-panel, #0f172a);
        }
        .sos-mtb-notif-badge.hidden { display: none; }

        /* Drawer · off-canvas · slides from right */
        .sos-mtb-backdrop {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1100;
            opacity: 0;
            pointer-events: none;
            transition: opacity 200ms ease-out;
            display: none;
        }
        .sos-mtb-backdrop.active { display: block; opacity: 1; pointer-events: auto; }

        .sos-mtb-drawer {
            position: fixed;
            top: 0; right: 0; bottom: 0;
            width: min(320px, 86vw);
            background: var(--bg-panel, #0f172a);
            color: var(--text-main, #e2e8f0);
            z-index: 1200;
            transform: translateX(100%);
            transition: transform 250ms ease-out;
            padding: calc(12px + env(safe-area-inset-top)) 0 calc(12px + env(safe-area-inset-bottom)) 0;
            overflow-y: auto;
            box-shadow: -8px 0 32px rgba(0,0,0,0.45);
            display: none;
            font-family: var(--font-base, system-ui, sans-serif);
        }
        .sos-mtb-drawer.active { display: block; transform: translateX(0); }
        .sos-mtb-drawer-head {
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 18px 12px 18px;
            border-bottom: 1px solid var(--border-default, #1e293b);
            margin-bottom: 12px;
        }
        .sos-mtb-drawer-title { font-weight: 800; font-size: 1rem; }
        .sos-mtb-drawer-close {
            background: transparent; border: 0;
            color: var(--text-main, #e2e8f0);
            font-size: 1.5rem; line-height: 1;
            cursor: pointer;
            padding: 6px 10px; border-radius: 6px;
            min-width: 36px; min-height: 36px;
        }
        .sos-mtb-drawer-close:focus-visible { outline: 2px solid var(--accent-indigo, #6366f1); outline-offset: 1px; }
        .sos-mtb-drawer-group {
            padding: 8px 18px;
        }
        .sos-mtb-drawer-group h3 {
            margin: 14px 0 6px 0;
            font-size: 0.65rem;
            font-weight: 800;
            color: var(--text-secondary, #94a3b8);
            text-transform: uppercase; letter-spacing: 0.08em;
        }
        .sos-mtb-drawer-link {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 12px;
            border-radius: 8px;
            color: var(--text-main, #e2e8f0);
            text-decoration: none;
            font-size: 0.9rem;
            margin-bottom: 2px;
            min-height: 40px;
        }
        .sos-mtb-drawer-link:hover, .sos-mtb-drawer-link:focus-visible {
            background: var(--glass-hover, rgba(255,255,255,0.06));
            outline: none;
        }
        .sos-mtb-drawer-link .ic {
            font-size: 1.15rem; line-height: 1; min-width: 24px; text-align: center;
        }
        .sos-mtb-drawer-link.active {
            background: rgba(99,102,241,0.18);
            color: #a8b2ff;
            font-weight: 700;
        }

        /* Activació mobile · < 768px · amaga els topbars propis dels views V2
           perquè el global cobreix la navegació. Els classics es respecten · les
           V2 modernes (.h2-topbar · .hub-topbar · .tlv-topbar · etc) s'amaguen. */
        @media (max-width: 768px) {
            .sos-mtb { display: flex; }
            body { padding-top: calc(48px + env(safe-area-inset-top)); }

            /* Hide view-local topbars on mobile · global topbar pren el lloc */
            .h2-topbar,           /* DashboardV2View */
            .hub-topbar,          /* ProjectHubV2View */
            .tlv-topbar,          /* TimelineView */
            .sv2-topbar,          /* SettingsV2View */
            .ipv-topbar,          /* InvestorPitchView */
            .pcv-topbar,          /* ProjectCreationV2View */
            .pcat-topbar          /* ProcessCatalogView */
                { display: none !important; }
        }
    `;
    document.head.appendChild(style);
}

// Drawer · destinacions agrupades · categories del menú principal
const DRAWER_GROUPS = Object.freeze([
    {
        title: 'Avui',
        items: [
            { id: 'home',     href: '/home',         icon: '🏠', label: 'Avui · Home' },
            { id: 'search',   href: '#search',       icon: '🔍', label: 'Cerca global · "/"', action: 'open-search' },
            { id: 'timeline', href: '/timeline',     icon: '💬', label: 'Timeline · Xarxa' },
            { id: 'inbox',    href: '/inbox',        icon: '📨', label: 'Inbox · DMs' },
            { id: 'create',   href: '/create',       icon: '➕', label: 'Crear projecte' },
        ],
    },
    {
        title: 'Projectes',
        items: [
            { id: 'dashboard', href: '/dashboard',   icon: '📁', label: 'Dashboard antic' },
            { id: 'process-catalog', href: '/process-catalog', icon: '🗺', label: 'Catàleg processos' },
            { id: 'sprint',   href: '/sprint',       icon: '🐝', label: 'Sprint Swarm' },
        ],
    },
    {
        title: 'Descobrir',
        items: [
            { id: 'discover', href: '/discover',     icon: '🚀', label: 'Permaweb hub · tot' },
            { id: 'market',   href: '/market',       icon: '🛒', label: 'Mercat' },
            { id: 'matriu',   href: '/matriu',       icon: '✦',  label: 'Matriu cohort' },
        ],
    },
    {
        title: 'Aprenentatge',
        items: [
            { id: 'learn',    href: '/learn',        icon: '🎓', label: 'Aprèn' },
            { id: 'skills',   href: '/skills',       icon: '🤲', label: 'Skills explorer' },
            { id: 'sectors',  href: '/sectors',      icon: '📚', label: 'Sectors' },
            { id: 'mind',     href: '/mind',         icon: '🧠', label: 'Mind graph' },
        ],
    },
    {
        title: 'Jo',
        items: [
            { id: 'identity', href: '/identity',     icon: '👤', label: 'Identitat · DID' },
            { id: 'wallet',   href: '/wallet',       icon: '💼', label: 'Wallet personal' },
            { id: 'settings', href: '/settings', icon: '⚙️', label: 'Settings' },
            { id: 'design',   href: '/design',       icon: '🎨', label: 'Design system' },
        ],
    },
]);

function _esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// inferActiveHref · pure · agafa pathname · retorna href amb millor match
function _isLinkActive(linkHref, currentPath) {
    if (!linkHref || !currentPath) return false;
    if (linkHref === currentPath) return true;
    if (linkHref === '/home' && currentPath === '/') return true;
    if (currentPath.startsWith(linkHref + '/')) return true;
    if (currentPath.startsWith(linkHref + '?')) return true;
    return false;
}

// renderDrawerHtml · pure · genera el HTML del drawer
export function renderDrawerHtml({ currentPath = '/' } = {}) {
    return `
    <div class="sos-mtb-drawer" id="${DRAWER_ID}" role="dialog" aria-modal="true" aria-labelledby="sosMtbDrawerTitle" aria-hidden="true">
        <div class="sos-mtb-drawer-head">
            <span class="sos-mtb-drawer-title" id="sosMtbDrawerTitle">Menú</span>
            <button class="sos-mtb-drawer-close" aria-label="Tancar menú" type="button">✕</button>
        </div>
        ${DRAWER_GROUPS.map(g => `
            <div class="sos-mtb-drawer-group" role="group" aria-labelledby="sosMtbGroup-${_esc(g.title)}">
                <h3 id="sosMtbGroup-${_esc(g.title)}">${_esc(g.title)}</h3>
                ${g.items.map(it => {
                    const active = _isLinkActive(it.href, currentPath);
                    return `<a href="${_esc(it.href)}" data-link class="sos-mtb-drawer-link ${active ? 'active' : ''}" ${active ? 'aria-current="page"' : ''}>
                        <span class="ic" aria-hidden="true">${it.icon}</span>
                        <span>${_esc(it.label)}</span>
                    </a>`;
                }).join('')}
            </div>
        `).join('')}
    </div>`;
}

// renderTopbarHtml · pure · `notifCount` opcional · 0 → badge hidden
export function renderTopbarHtml({ title = '', currentPath = '/', notifCount = 0 } = {}) {
    const n = Number(notifCount) || 0;
    const badgeHidden = n <= 0 ? ' hidden' : '';
    const badgeText = n > 99 ? '99+' : String(n);
    const ariaLabel = n > 0 ? `Inbox · ${n} pendents` : 'Inbox';
    return `
    <header class="sos-mtb" id="${TOPBAR_ID}" role="banner">
        <a href="/home" data-link class="sos-mtb-logo" aria-label="TeamTowers · Avui">🗼 TT<span>·</span></a>
        <span class="sos-mtb-title">${_esc(title || '')}</span>
        <a href="/inbox" data-link class="sos-mtb-notif-btn" aria-label="${_esc(ariaLabel)}">
            📨<span class="sos-mtb-notif-badge${badgeHidden}" aria-hidden="${n <= 0}">${_esc(badgeText)}</span>
        </a>
        <button class="sos-mtb-menu-btn" aria-label="Obrir menú principal" aria-expanded="false" aria-controls="${DRAWER_ID}" type="button">⋯</button>
    </header>`;
}

// _loadNotifCount · async · suma DMs no llegits + invites pendents per a l'usuari
// activa. Retorna 0 en errors (zero-deps · safe en Node · safe en browser).
async function _loadNotifCount() {
    if (typeof indexedDB === 'undefined') return 0;
    try {
        const [{ KB }, { getCurrentIdentity }, { countUnread }, { countPendingForUser }] = await Promise.all([
            import('./kb.js'),
            import('./identityService.js'),
            import('./messagingService.js'),
            import('./projectInviteService.js'),
        ]);
        await KB.init();
        const me = await getCurrentIdentity();
        const handle = me?.content?.handle;
        if (!handle) return 0;
        const all = await KB.getAllNodes();
        const dms = all.filter(n => n && n.type === 'direct_message');
        const invites = all.filter(n => n && n.type === 'project_invite');
        return (countUnread(dms, handle) || 0) + (countPendingForUser(invites, handle) || 0);
    } catch (_) {
        return 0;
    }
}

// _updateBadge · DOM · actualitza el badge del topbar (idempotent)
function _updateBadge(n) {
    if (typeof document === 'undefined') return;
    const btn = document.querySelector(`#${TOPBAR_ID} .sos-mtb-notif-btn`);
    if (!btn) return;
    const badge = btn.querySelector('.sos-mtb-notif-badge');
    if (!badge) return;
    const count = Number(n) || 0;
    const text = count > 99 ? '99+' : String(count);
    badge.textContent = text;
    if (count <= 0) {
        badge.classList.add('hidden');
        badge.setAttribute('aria-hidden', 'true');
        btn.setAttribute('aria-label', 'Inbox');
    } else {
        badge.classList.remove('hidden');
        badge.setAttribute('aria-hidden', 'false');
        btn.setAttribute('aria-label', `Inbox · ${count} pendents`);
    }
}

// _setupScrollHide · hide topbar on scroll down · show on scroll up
let _lastScrollY = 0;
let _scrollHandler = null;
function _setupScrollHide() {
    if (typeof window === 'undefined') return;
    if (_scrollHandler) window.removeEventListener('scroll', _scrollHandler);
    let ticking = false;
    _lastScrollY = window.scrollY;
    _scrollHandler = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const bar = document.getElementById(TOPBAR_ID);
                if (!bar) { ticking = false; return; }
                const curr = window.scrollY;
                const goingDown = curr > _lastScrollY + 8;
                const goingUp = curr < _lastScrollY - 8;
                if (goingDown && curr > 80) bar.classList.add('hidden');
                else if (goingUp) bar.classList.remove('hidden');
                if (curr < 20) bar.classList.remove('hidden');   // sempre visible al top
                _lastScrollY = curr;
                ticking = false;
            });
            ticking = true;
        }
    };
    window.addEventListener('scroll', _scrollHandler, { passive: true });
}

let _isOpen = false;
let _escHandler = null;
let _focusReturn = null;

function _openDrawer() {
    if (typeof document === 'undefined' || _isOpen) return;
    const drawer = document.getElementById(DRAWER_ID);
    const backdrop = document.getElementById(BACKDROP_ID);
    if (!drawer || !backdrop) return;
    _focusReturn = document.activeElement;
    drawer.classList.add('active');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('active');
    _isOpen = true;
    // Focus al primer link
    setTimeout(() => drawer.querySelector('a, button')?.focus(), 100);
    // Update aria-expanded on trigger
    document.querySelector('.sos-mtb-menu-btn')?.setAttribute('aria-expanded', 'true');
    // Escape closes
    _escHandler = (e) => { if (e.key === 'Escape') _closeDrawer(); };
    document.addEventListener('keydown', _escHandler);
    // Focus trap
    import('./a11yService.js').then(({ trapFocus }) => {
        _trapCleanup = trapFocus(drawer);
    }).catch(() => {});
}

let _trapCleanup = null;
function _closeDrawer() {
    if (typeof document === 'undefined' || !_isOpen) return;
    const drawer = document.getElementById(DRAWER_ID);
    const backdrop = document.getElementById(BACKDROP_ID);
    if (drawer) {
        drawer.classList.remove('active');
        drawer.setAttribute('aria-hidden', 'true');
    }
    if (backdrop) backdrop.classList.remove('active');
    _isOpen = false;
    document.querySelector('.sos-mtb-menu-btn')?.setAttribute('aria-expanded', 'false');
    if (_escHandler) {
        document.removeEventListener('keydown', _escHandler);
        _escHandler = null;
    }
    if (_trapCleanup) {
        _trapCleanup();
        _trapCleanup = null;
    }
    // Restore focus
    if (_focusReturn && typeof _focusReturn.focus === 'function') {
        _focusReturn.focus();
        _focusReturn = null;
    }
}

// injectOrUpdate · idempotent · injecta o actualitza el topbar i el drawer.
// Cridat pel router després de cada render. `pathname` per a active state ·
// `title` opcional (default · document.title).
export function injectOrUpdate({ pathname = null, title = null } = {}) {
    if (typeof document === 'undefined') return;
    _ensureCss();
    const currentPath = pathname || (window.location ? window.location.pathname : '/');
    const pageTitle = title != null ? title : (document.title || '').replace(/ · SOS.*$/, '').slice(0, 36);

    // Backdrop · cap render dinàmic · només presència
    if (!document.getElementById(BACKDROP_ID)) {
        const bd = document.createElement('div');
        bd.id = BACKDROP_ID;
        bd.className = 'sos-mtb-backdrop';
        bd.addEventListener('click', () => _closeDrawer());
        document.body.appendChild(bd);
    }

    // Topbar
    let bar = document.getElementById(TOPBAR_ID);
    if (!bar) {
        const wrap = document.createElement('div');
        wrap.innerHTML = renderTopbarHtml({ title: pageTitle, currentPath, notifCount: 0 });
        bar = wrap.firstElementChild;
        document.body.insertBefore(bar, document.body.firstChild);
        bar.querySelector('.sos-mtb-menu-btn').addEventListener('click', () => _openDrawer());
        _setupScrollHide();
    } else {
        // Update title
        const t = bar.querySelector('.sos-mtb-title');
        if (t) t.textContent = pageTitle;
    }

    // Notif badge · async · update sense bloquejar el render
    _loadNotifCount().then(_updateBadge).catch(() => {});

    // Drawer · re-render per actualitzar active states
    const oldDrawer = document.getElementById(DRAWER_ID);
    if (oldDrawer) oldDrawer.remove();
    const wrapD = document.createElement('div');
    wrapD.innerHTML = renderDrawerHtml({ currentPath });
    const newDrawer = wrapD.firstElementChild;
    document.body.appendChild(newDrawer);
    newDrawer.querySelector('.sos-mtb-drawer-close')?.addEventListener('click', () => _closeDrawer());
    // Click qualsevol link tanca el drawer (router data-link)
    newDrawer.querySelectorAll('.sos-mtb-drawer-link').forEach(a => {
        // Special action · open global search
        if (a.getAttribute('href') === '#search') {
            a.addEventListener('click', async (e) => {
                e.preventDefault();
                _closeDrawer();
                try {
                    const { open } = await import('./globalSearch.js');
                    setTimeout(() => open(), 250); // wait drawer close anim
                } catch (_) {}
            });
            // Remove data-link perquè el router no l'agafi
            a.removeAttribute('data-link');
        } else {
            a.addEventListener('click', () => _closeDrawer());
        }
    });
}

export function destroy() {
    if (typeof document === 'undefined') return;
    document.getElementById(TOPBAR_ID)?.remove();
    document.getElementById(DRAWER_ID)?.remove();
    document.getElementById(BACKDROP_ID)?.remove();
    document.getElementById(CSS_ID)?.remove();
    if (_scrollHandler && typeof window !== 'undefined') {
        window.removeEventListener('scroll', _scrollHandler);
    }
    _scrollHandler = null;
    _isOpen = false;
}

export { TOPBAR_ID, DRAWER_ID, BACKDROP_ID, DRAWER_GROUPS };
