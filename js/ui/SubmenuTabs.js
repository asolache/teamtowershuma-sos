// =============================================================================
// TEAMTOWERS SOS V11 — v132j · SUBMENU TABS · SHARED COMPONENT
// Ruta · /js/ui/SubmenuTabs.js
//
// Pattern canonical de submenú per a totes les vistes SOS · refent extret
// del referent LearnView (.lv-tab · data-mode · ?tab=X). Mockup validat a
// v132i (`docs/ux/v132i-mockup-project-hub-subtabs.html`).
//
// API ·
//   renderSubmenuTabs({ tabs, dropdown?, activeId, urlParam? }) → HTML string
//   bindSubmenuTabs(container, onSelect, options?) → cleanup function
//   getActiveTabFromUrl(urlParam, fallback) → string
//   setActiveTabInUrl(urlParam, id) → void
//   ensureSubmenuStyles() → void · injecta CSS un sol cop al <head>
//
// Convencions canòniques · v132i validat ·
//   - state name a la vista · `this._mode` (no `_activeTab`)
//   - data-attr · `data-submenu-tab="<id>"`
//   - CSS class wrapper · `.sos-submenu` · botó · `.sos-submenu-tab`
//   - Active state · `.is-active` + `aria-current="page"`
//   - URL param · `?tab=<id>` per defecte (configurable)
//   - Dropdown · click outside tanca · Esc tanca
//   - CSS vars · `--sos-submenu-*` (configurables via tema)
// =============================================================================

export const SUBMENU_VERSION = 'v141';

// ── HTML escape · defensive · evitem XSS en labels generats ──────────────
function _esc(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

// ── CSS canonical · injectat un sol cop al <head> al primer render ────────
const SUBMENU_STYLES = `
.sos-submenu {
    display: flex;
    align-items: stretch;
    height: var(--sos-submenu-height, 44px);
    background: var(--surface-2, var(--bg-panel, #0e0f13));
    border-bottom: 1px solid var(--border-default, #1f2937);
    overflow-x: auto;
    overflow-y: visible;
    scrollbar-width: thin;
    position: relative;
    font-family: var(--font-base, inherit);
}
.sos-submenu-tab {
    background: transparent;
    border: none;
    color: var(--text-secondary, #94a3b8);
    padding: var(--sos-submenu-tab-padding, 0 14px);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-bottom: 2px solid transparent;
    transition: background 0.15s ease, color 0.15s ease;
    white-space: nowrap;
    font-family: inherit;
}
.sos-submenu-tab:hover {
    background: var(--sos-submenu-hover-bg, var(--bg-elevated, #161821));
    color: var(--text-main, #e2e8f0);
}
.sos-submenu-tab.is-active {
    color: var(--sos-submenu-active-color, var(--accent-indigo, #6366f1));
    background: var(--sos-submenu-active-bg, rgba(99, 102, 241, 0.12));
    border-bottom: var(--sos-submenu-border-bottom, 2px solid var(--accent-indigo, #6366f1));
}
.sos-submenu-tab:focus-visible {
    outline: 2px solid var(--accent-indigo, #6366f1);
    outline-offset: -2px;
}
.sos-submenu-tab-icon { font-size: 1.05rem; }
.sos-submenu-dropdown-wrap { position: relative; margin-left: auto; }
.sos-submenu-dropdown-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary, #94a3b8);
    padding: var(--sos-submenu-tab-padding, 0 14px);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    height: 100%;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: inherit;
}
.sos-submenu-dropdown-btn:hover {
    background: var(--sos-submenu-hover-bg, var(--bg-elevated, #161821));
    color: var(--text-main, #e2e8f0);
}
.sos-submenu-dropdown-panel {
    position: absolute;
    right: 0;
    top: 100%;
    background: var(--surface-2, var(--bg-panel, #0e0f13));
    border: 1px solid var(--border-default, #1f2937);
    border-radius: var(--radius-md, 10px);
    padding: 6px;
    min-width: 220px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
    z-index: 10;
    display: none;
}
.sos-submenu-dropdown-panel.is-open { display: block; }
.sos-submenu-dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    color: var(--text-main, #e2e8f0);
    font-size: 0.88rem;
    cursor: pointer;
    border-radius: 4px;
    font-family: inherit;
    text-align: left;
}
.sos-submenu-dropdown-item:hover { background: var(--bg-elevated, #161821); }
.sos-submenu-dropdown-item.is-active { color: var(--accent-indigo, #6366f1); font-weight: 700; }
.sos-submenu-dropdown-item .item-icon { font-size: 1.05rem; }

/* v141 · variant l2 · sub-submenu compacte · viu DINS d'una tab pare */
.sos-submenu.is-l2 {
    height: 36px;
    background: var(--bg-elevated, #161821);
    border-bottom: 1px solid var(--border-default, #1f2937);
    padding: 0 8px;
}
.sos-submenu.is-l2 .sos-submenu-tab {
    font-size: 0.82rem;
    padding: 0 10px;
    font-weight: 500;
}
.sos-submenu.is-l2 .sos-submenu-tab.is-active {
    background: var(--surface-2, var(--bg-panel, #0e0f13));
    border-bottom: 2px solid var(--accent-purple, #a855f7);
    color: var(--accent-purple, #a855f7);
}
.sos-submenu.is-l2 .sos-submenu-tab-icon { font-size: 0.95rem; }
`;

let _stylesInjected = false;
export function ensureSubmenuStyles() {
    if (_stylesInjected) return;
    if (typeof document === 'undefined') return;
    if (document.getElementById('sos-submenu-styles')) { _stylesInjected = true; return; }
    const style = document.createElement('style');
    style.id = 'sos-submenu-styles';
    style.textContent = SUBMENU_STYLES;
    document.head.appendChild(style);
    _stylesInjected = true;
}

// Helper de test · permet resetejar el flag entre tests
export function _resetSubmenuStylesForTest() { _stylesInjected = false; }

// ── URL param helpers · sync sharable URL ↔ state ────────────────────────
export function getActiveTabFromUrl(urlParam = 'tab', fallback = null) {
    if (typeof window === 'undefined' || !window.location) return fallback;
    try {
        const v = new URLSearchParams(window.location.search).get(urlParam);
        return v || fallback;
    } catch (_) { return fallback; }
}

export function setActiveTabInUrl(urlParam, id) {
    if (typeof window === 'undefined' || !window.history?.replaceState) return;
    try {
        const url = new URL(window.location.href);
        if (id) url.searchParams.set(urlParam, id);
        else    url.searchParams.delete(urlParam);
        window.history.replaceState({}, '', url.toString());
    } catch (_) { /* ignore */ }
}

// ── renderSubmenuTabs · pura · retorna HTML string ────────────────────────
//
// tabs · [{ id, label, icon?, disabled? }]
// dropdown · [{ id, label, icon?, disabled? }] · opcional · genera "Més ▾"
// activeId · string · id de la tab activa actual
// urlParam · string · default 'tab' · només per a docs/clarity (el sync el fa bindSubmenuTabs)
// v141 · variant 'l1' (default) o 'l2' (sub-submenu compacte sense dropdown)
export function renderSubmenuTabs({ tabs = [], dropdown = null, activeId = null, urlParam = 'tab', variant = 'l1' } = {}) {
    if (!Array.isArray(tabs) || tabs.length === 0) return '';
    const isL2 = variant === 'l2';
    // L2 no suporta dropdown · simplifica patró
    if (isL2) dropdown = null;

    const tabHtml = tabs.map(t => {
        if (!t || !t.id) return '';
        const isActive = t.id === activeId;
        const disabled = t.disabled ? ' disabled' : '';
        return `<button class="sos-submenu-tab${isActive ? ' is-active' : ''}"`
            + ` role="tab"`
            + ` data-submenu-tab="${_esc(t.id)}"`
            + (isActive ? ` aria-current="page"` : '')
            + disabled
            + `>${t.icon ? `<span class="sos-submenu-tab-icon">${_esc(t.icon)}</span> ` : ''}`
            + `${_esc(t.label || t.id)}</button>`;
    }).join('');

    let dropdownHtml = '';
    if (Array.isArray(dropdown) && dropdown.length > 0) {
        const items = dropdown.map(d => {
            if (!d || !d.id) return '';
            const isActive = d.id === activeId;
            const disabled = d.disabled ? ' disabled' : '';
            return `<button class="sos-submenu-dropdown-item${isActive ? ' is-active' : ''}"`
                + ` role="menuitem"`
                + ` data-submenu-tab="${_esc(d.id)}"`
                + disabled
                + `>${d.icon ? `<span class="item-icon">${_esc(d.icon)}</span> ` : ''}`
                + `${_esc(d.label || d.id)}</button>`;
        }).join('');
        dropdownHtml = `<div class="sos-submenu-dropdown-wrap">`
            + `<button class="sos-submenu-dropdown-btn" data-submenu-dropdown-btn`
            + ` aria-haspopup="true" aria-expanded="false">Més ▾</button>`
            + `<div class="sos-submenu-dropdown-panel" data-submenu-dropdown-panel role="menu">`
            + items
            + `</div></div>`;
    }

    const wrapCls = 'sos-submenu' + (isL2 ? ' is-l2' : '');
    return `<nav class="${wrapCls}" role="tablist" data-url-param="${_esc(urlParam)}">`
        + tabHtml + dropdownHtml + `</nav>`;
}

// ── bindSubmenuTabs · gestiona events + URL sync ──────────────────────────
//
// container · element DOM o selector · ha de contenir l'HTML de renderSubmenuTabs
// onSelect · fn(newId, prevId) · cridat quan canvia activeTab
// options ·
//   - urlParam · default 'tab' · sync URL ↔ state
//   - syncUrl · default true · false per desactivar history.replaceState
//
// Retorna · cleanup function · remou listeners
export function bindSubmenuTabs(container, onSelect, options = {}) {
    if (typeof document === 'undefined') return () => {};
    const root = (typeof container === 'string') ? document.querySelector(container) : container;
    if (!root) return () => {};

    ensureSubmenuStyles();

    const urlParam = options.urlParam || 'tab';
    const syncUrl  = options.syncUrl !== false;

    const cleanupFns = [];

    // Tab click · main + dropdown items
    const onTabClick = (e) => {
        const btn = e.target.closest('[data-submenu-tab]');
        if (!btn || btn.hasAttribute('disabled')) return;
        _activateTab(root, btn.getAttribute('data-submenu-tab'), { urlParam, syncUrl, onSelect });
    };
    root.addEventListener('click', onTabClick);
    cleanupFns.push(() => root.removeEventListener('click', onTabClick));

    // Keyboard arrow nav (v132k) · ← → mou activeTab entre tabs principals ·
    // Home/End salten a primera/última · Enter/Space ja és default
    const onArrowKeys = (e) => {
        if (!root.contains(document.activeElement)) return;
        const isLeft  = e.key === 'ArrowLeft';
        const isRight = e.key === 'ArrowRight';
        const isHome  = e.key === 'Home';
        const isEnd   = e.key === 'End';
        if (!isLeft && !isRight && !isHome && !isEnd) return;
        const mainTabs = Array.from(root.querySelectorAll('.sos-submenu-tab:not([disabled])'));
        if (mainTabs.length === 0) return;
        const current = root.querySelector('.sos-submenu-tab.is-active');
        let idx = current ? mainTabs.indexOf(current) : 0;
        if (idx < 0) idx = 0;
        let next = idx;
        if (isLeft)  next = (idx - 1 + mainTabs.length) % mainTabs.length;
        if (isRight) next = (idx + 1) % mainTabs.length;
        if (isHome)  next = 0;
        if (isEnd)   next = mainTabs.length - 1;
        if (next === idx) return;
        e.preventDefault();
        const newId = mainTabs[next].getAttribute('data-submenu-tab');
        _activateTab(root, newId, { urlParam, syncUrl, onSelect });
        mainTabs[next].focus();
    };
    document.addEventListener('keydown', onArrowKeys);
    cleanupFns.push(() => document.removeEventListener('keydown', onArrowKeys));

    // Dropdown toggle
    const ddBtn = root.querySelector('[data-submenu-dropdown-btn]');
    const ddPanel = root.querySelector('[data-submenu-dropdown-panel]');
    if (ddBtn && ddPanel) {
        const onDdToggle = (e) => {
            e.stopPropagation();
            const open = ddPanel.classList.toggle('is-open');
            ddBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        };
        ddBtn.addEventListener('click', onDdToggle);
        cleanupFns.push(() => ddBtn.removeEventListener('click', onDdToggle));

        // Click outside
        const onDocClick = (e) => {
            if (!ddPanel.contains(e.target) && !ddBtn.contains(e.target)) _closeDropdown(root);
        };
        document.addEventListener('click', onDocClick);
        cleanupFns.push(() => document.removeEventListener('click', onDocClick));

        // Esc tanca
        const onKey = (e) => { if (e.key === 'Escape') _closeDropdown(root); };
        document.addEventListener('keydown', onKey);
        cleanupFns.push(() => document.removeEventListener('keydown', onKey));
    }

    return () => { cleanupFns.forEach(fn => { try { fn(); } catch (_) {} }); };
}

function _activateTab(root, newId, { urlParam = 'tab', syncUrl = true, onSelect } = {}) {
    if (!newId) return;
    const prev = root.querySelector('.sos-submenu-tab.is-active');
    const prevId = prev?.getAttribute('data-submenu-tab') || null;
    if (newId === prevId) return;
    root.querySelectorAll('.sos-submenu-tab.is-active').forEach(el => {
        el.classList.remove('is-active');
        el.removeAttribute('aria-current');
    });
    root.querySelectorAll('.sos-submenu-dropdown-item.is-active').forEach(el => {
        el.classList.remove('is-active');
    });
    const escapeId = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(newId) : newId;
    const tabBtn = root.querySelector('.sos-submenu-tab[data-submenu-tab="' + escapeId + '"]');
    if (tabBtn) {
        tabBtn.classList.add('is-active');
        tabBtn.setAttribute('aria-current', 'page');
    } else {
        const ddItem = root.querySelector('.sos-submenu-dropdown-item[data-submenu-tab="' + escapeId + '"]');
        if (ddItem) ddItem.classList.add('is-active');
    }
    if (syncUrl) setActiveTabInUrl(urlParam, newId);
    _closeDropdown(root);
    try { onSelect?.(newId, prevId); } catch (_) {}
}

function _closeDropdown(root) {
    const ddBtn = root.querySelector('[data-submenu-dropdown-btn]');
    const ddPanel = root.querySelector('[data-submenu-dropdown-panel]');
    if (ddPanel) ddPanel.classList.remove('is-open');
    if (ddBtn) ddBtn.setAttribute('aria-expanded', 'false');
}
