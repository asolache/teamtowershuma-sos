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

export const SUBMENU_VERSION = 'v132j';

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
export function renderSubmenuTabs({ tabs = [], dropdown = null, activeId = null, urlParam = 'tab' } = {}) {
    if (!Array.isArray(tabs) || tabs.length === 0) return '';

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

    return `<nav class="sos-submenu" role="tablist" data-url-param="${_esc(urlParam)}">`
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
        const newId = btn.getAttribute('data-submenu-tab');
        const prev = root.querySelector('.sos-submenu-tab.is-active');
        const prevId = prev?.getAttribute('data-submenu-tab') || null;
        if (newId === prevId) return;
        // Update UI · active state
        root.querySelectorAll('.sos-submenu-tab.is-active').forEach(el => {
            el.classList.remove('is-active');
            el.removeAttribute('aria-current');
        });
        root.querySelectorAll('.sos-submenu-dropdown-item.is-active').forEach(el => {
            el.classList.remove('is-active');
        });
        const tabBtn = root.querySelector('.sos-submenu-tab[data-submenu-tab="' + CSS.escape(newId) + '"]');
        if (tabBtn) {
            tabBtn.classList.add('is-active');
            tabBtn.setAttribute('aria-current', 'page');
        } else {
            // Dropdown item · marca actiu però NO afegim tab al main bar
            btn.classList.add('is-active');
        }
        // URL sync
        if (syncUrl) setActiveTabInUrl(urlParam, newId);
        // Close dropdown si era una item del dropdown
        _closeDropdown(root);
        // Callback
        try { onSelect?.(newId, prevId); } catch (_) {}
    };
    root.addEventListener('click', onTabClick);
    cleanupFns.push(() => root.removeEventListener('click', onTabClick));

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

function _closeDropdown(root) {
    const ddBtn = root.querySelector('[data-submenu-dropdown-btn]');
    const ddPanel = root.querySelector('[data-submenu-dropdown-panel]');
    if (ddPanel) ddPanel.classList.remove('is-open');
    if (ddBtn) ddBtn.setAttribute('aria-expanded', 'false');
}
