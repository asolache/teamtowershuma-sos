// =============================================================================
// TEAMTOWERS SOS V11 — NAV SERVICE (UX-NAV-001 · Ola 8)
// Ruta: /js/core/navService.js
//
// Helper para construir la barra de navegación principal de cada vista,
// garantizando acceso bidireccional entre las áreas del sistema. La idea
// es que desde cualquier vista el usuario pueda saltar a las otras
// principales sin teclear URL.
//
// Cada vista decide cómo renderizar los links (clase CSS local) pero
// la lista canónica de destinos sale de aquí.
// =============================================================================

// Catálogo cerrado de destinos principales · ordenado por flujo natural
// del operador: descubrir → diseñar → ejecutar → contabilizar → ofertar.
export const NAV_DESTINATIONS = Object.freeze([
    { id: 'dashboard', icon: '🏠', label: 'Dashboard', href: '/dashboard',  global: true,  hint: 'Inicio · proyectos' },
    { id: 'map',       icon: '🗺',  label: 'Mapa',      href: '/map',        global: true,  hint: 'Mapa de valor del proyecto activo' },
    { id: 'sops',      icon: '📜', label: 'SOPs',      href: '/sops',       global: false, hint: 'Procedimientos del proyecto' },
    { id: 'kanban',    icon: '📋', label: 'Kanban',    href: '/kanban',     global: true,  hint: 'Work orders · backlog → ledger' },
    { id: 'market',    icon: '🛒', label: 'Mercado',   href: '/market',     global: true,  hint: 'Catálogo de productos y servicios' },
    { id: 'tags',      icon: '🏷', label: 'Tags',      href: '/tags',       global: true,  hint: 'Folksonomía · cloud de tags' },
    { id: 'folders',   icon: '📁', label: 'Folders',   href: '/folders',    global: true,  hint: 'Carpetas inteligentes · queries persistentes' },
    { id: 'mind',      icon: '🕸',  label: 'Mind-Graph',href: '/mind',       global: true,  hint: 'Mind-as-Graph total · panorámica del KB' },
    { id: 'identity',  icon: '👤', label: 'Identidad', href: '/identity',   global: true,  hint: 'Tu perfil · DID local-first · wallet (sprint B)' },
    { id: 'settings',  icon: '⚙',  label: 'Settings',  href: '/settings',   global: true,  hint: 'Claves API · IA · purga' },
]);

// Devuelve la lista de links contextualizada al projectId activo.
// - global=true: el link siempre aparece sin query
// - global=false: el link sólo tiene sentido con projectId; se omite si no
// - active: marca el destino activo (vista actual)
// - projectId: si hay, se concatena ?project={id} a los hrefs que apliquen
//   (map, kanban, sops, market) para preservar contexto al navegar.
export function buildNavLinks({ active = '', projectId = null } = {}) {
    return NAV_DESTINATIONS
        .filter(d => d.global || !!projectId)
        .map(d => {
            let href = d.href;
            if (projectId && ['map', 'sops', 'kanban', 'market'].includes(d.id)) {
                href += '?project=' + encodeURIComponent(projectId);
            }
            return {
                ...d,
                href,
                active: d.id === active,
            };
        });
}

// Helper opcional · genera HTML estándar de los links.
// El consumidor pasa un className para integrarlo con su CSS local.
export function renderNavLinksHtml({ active = '', projectId = null, className = 'sos-nav-link', activeClass = 'sos-nav-link-active' } = {}) {
    const links = buildNavLinks({ active, projectId });
    return links.map(l => {
        const cls = l.active ? `${className} ${activeClass}` : className;
        return `<a href="${l.href}" data-link class="${cls}" title="${_esc(l.hint)}">${l.icon} ${_esc(l.label)}</a>`;
    }).join('');
}

function _esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}
