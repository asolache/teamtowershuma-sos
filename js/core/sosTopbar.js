// =============================================================================
// TEAMTOWERS SOS V11 — SOS TOPBAR · canonical view topbar (v125)
// Ruta · /js/core/sosTopbar.js
//
// Standardització · totes les views poden usar `renderViewTopbar()` en comptes
// de definir el seu propi `.w-topbar` · `.pb-topbar` · `.ac-topbar` · etc.
// Avantatges ·
//   ─ 1 CSS canonical injectat un cop (idempotent)
//   ─ shape canviable globalment sense tocar 14 views
//   ─ títol + icona + context links + slot per a botons custom
//   ─ responsive · mobile = només icona + títol curt · desktop = tot
//   ─ a11y · ARIA role=banner · skip-link compatible
//
// Migració · opt-in. Les views poden adoptar-lo sprint a sprint sense breaking.
// Existeix paral·lel amb els topbars actuals fins que es migrin tots.
// =============================================================================

import { renderExplainerBadge } from './didacticService.js';

export const SOS_TOPBAR_VERSION = 'v1.0';

const STYLE_ID = 'sos-view-topbar-style';

function _esc(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// ensureTopbarStyle · idempotent · injecta CSS al <head> un sol cop
export function ensureTopbarStyle() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = `
.sos-view-topbar {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 16px; min-height: 48px;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border-default);
    flex-wrap: wrap; box-sizing: border-box; flex-shrink: 0;
}
.sos-view-topbar-title {
    display: inline-flex; align-items: center; gap: 8px;
    color: var(--text-main); font-weight: 700;
    font-size: 1.02rem; font-family: var(--font-base);
}
.sos-view-topbar-title .sos-view-icon { font-size: 1.15rem; line-height: 1; }
.sos-view-topbar-subtitle {
    color: var(--text-muted); font-size: 0.78rem;
    font-family: var(--font-mono); margin-left: 6px;
    text-transform: uppercase; letter-spacing: 0.04em;
}
.sos-view-topbar-spacer { flex: 1; }
.sos-view-topbar-link {
    color: var(--text-secondary); text-decoration: none;
    font-size: var(--text-xs); font-weight: 600;
    padding: 6px 10px; border-radius: var(--radius-sm);
    transition: all var(--dur-fast);
    display: inline-flex; align-items: center; gap: 4px;
    white-space: nowrap;
    background: transparent; border: 1px solid transparent;
    cursor: pointer; font-family: var(--font-base); line-height: 1.3;
}
.sos-view-topbar-link:hover {
    color: var(--text-main); background: var(--glass-hover);
}
.sos-view-topbar-link:focus-visible {
    outline: 2px solid var(--accent-indigo); outline-offset: 2px;
}
.sos-view-topbar-link.sos-view-topbar-link-primary {
    background: var(--accent-indigo); color: #fff;
    border-color: var(--accent-indigo);
}
.sos-view-topbar-link.sos-view-topbar-link-primary:hover {
    background: var(--accent-indigo-strong, #4f46e5);
}
.sos-view-topbar-link.sos-view-topbar-link-accent {
    color: var(--accent-purple);
    background: rgba(167,139,250,0.10);
    border-color: rgba(167,139,250,0.30);
}
@media (max-width: 720px) {
    .sos-view-topbar { padding: 6px 10px; gap: 6px; }
    .sos-view-topbar-title { font-size: 0.92rem; }
    .sos-view-topbar-subtitle { display: none; }
    .sos-view-topbar-link { padding: 5px 7px; font-size: 0.72rem; }
    .sos-view-topbar-link .sos-view-topbar-link-label { display: none; }
}
`;
    document.head.appendChild(el);
}

// renderViewTopbar · HTML pur · views fan element.innerHTML = renderViewTopbar(opts)
// Cada `contextLinks` entry · { href, label, icon?, primary?, accent?, dataLink? }
// dataLink default true (SPA navigation via data-link attribute)
export function renderViewTopbar({
    icon = '',
    title = '',
    subtitle = '',
    titleBadgeKey = null,    // ex 'smart-contract' · 'slicing-pie' · renderExplainerBadge
    contextLinks = [],
} = {}) {
    const titleBadge = titleBadgeKey ? renderExplainerBadge(titleBadgeKey, { size: 'xs' }) : '';
    const linksHtml = contextLinks.map(l => {
        const cls = ['sos-view-topbar-link'];
        if (l.primary) cls.push('sos-view-topbar-link-primary');
        if (l.accent)  cls.push('sos-view-topbar-link-accent');
        const dataLink = (l.dataLink !== false) ? ' data-link' : '';
        const iconHtml = l.icon ? `<span>${_esc(l.icon)}</span>` : '';
        const labelHtml = `<span class="sos-view-topbar-link-label">${_esc(l.label || '')}</span>`;
        return `<a href="${_esc(l.href)}"${dataLink} class="${cls.join(' ')}" ${l.title ? `title="${_esc(l.title)}"` : ''}>${iconHtml}${labelHtml}</a>`;
    }).join('');
    return `
        <header class="sos-view-topbar" role="banner">
            <div class="sos-view-topbar-title">
                ${icon ? `<span class="sos-view-icon">${_esc(icon)}</span>` : ''}
                <span>${_esc(title)}</span>
                ${titleBadge}
                ${subtitle ? `<span class="sos-view-topbar-subtitle">${_esc(subtitle)}</span>` : ''}
            </div>
            <div class="sos-view-topbar-spacer"></div>
            ${linksHtml}
        </header>`;
}

// Helper · genera contextLinks típics per a una view de projecte
// (panel · wallet · pact · value-accounting · map) · estalvia copy-paste
export function projectContextLinks({ projectId, current = '' } = {}) {
    if (!projectId) return [];
    const enc = encodeURIComponent(projectId);
    const all = [
        { id: 'hub',     href: `/project/${enc}`,                  icon: '🎛',  label: 'Panel',    title: 'Panel del projecte' },
        { id: 'map',     href: `/map?project=${enc}`,              icon: '🗺',  label: 'Mapa',     title: 'Mapa de valor' },
        { id: 'wallet',  href: `/wallet?project=${enc}`,           icon: '💰',  label: 'Wallet',   title: 'Wallet del projecte' },
        { id: 'pact',    href: `/pact?project=${enc}`,             icon: '📜',  label: 'Pacte',    title: 'Pacte de socis' },
        { id: 'tarta',   href: `/value-accounting?project=${enc}`, icon: '🥧',  label: 'Tarta',    title: 'Slicing pie · value accounting' },
        { id: 'kanban',  href: `/kanban?project=${enc}`,           icon: '📋',  label: 'Kanban',   title: 'Sprint Kanban' },
    ];
    return all.filter(l => l.id !== current);
}
