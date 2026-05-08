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

// UX-NAV-002 · categorías canónicas para agrupar el menú superior
// (la topbar con 13 destinos saturaba; ahora se renderizan en 4 grupos
// + dashboard suelto · cada vista decide si renderizar plano o agrupado).
export const NAV_CATEGORIES = Object.freeze([
    { id: 'home',         label: 'Inicio',        icon: '🏠' },
    { id: 'operations',   label: 'Operaciones',   icon: '⚙',  hint: 'Mapa · SOPs · Kanban · Wallet del proyecto activo' },
    { id: 'knowledge',    label: 'Conocimiento',  icon: '📚', hint: 'Tags · Folders · Mind-Graph del KB' },
    { id: 'market',       label: 'Mercado & ROI', icon: '🛒', hint: 'Mercado · Eficiencia IA · Ahorro acumulado' },
    { id: 'identity',     label: 'Cuenta',        icon: '👤', hint: 'Identidad · Settings' },
]);

// Catálogo cerrado de destinos principales · ordenado por flujo natural
// del operador: descubrir → diseñar → ejecutar → contabilizar → ofertar.
// Cada destino lleva ahora `category` (id de NAV_CATEGORIES) para UX-NAV-002.
export const NAV_DESTINATIONS = Object.freeze([
    { id: 'dashboard', icon: '🏠', label: 'Dashboard', href: '/dashboard',  global: true,  category: 'home',       hint: 'Inicio · proyectos' },
    { id: 'map',       icon: '🗺',  label: 'Mapa',      href: '/map',        global: true,  category: 'operations', hint: 'Mapa de valor del proyecto activo' },
    { id: 'sops',      icon: '📜', label: 'SOPs',      href: '/sops',       global: false, category: 'operations', hint: 'Procedimientos del proyecto' },
    { id: 'kanban',    icon: '📋', label: 'Kanban',    href: '/kanban',     global: true,  category: 'operations', hint: 'Work orders · backlog → ledger' },
    { id: 'wallet',    icon: '💶', label: 'Wallet',    href: '/wallet',     global: false, category: 'operations', hint: 'Saldo prepago del proyecto · ledger movimientos' },
    { id: 'tags',      icon: '🏷', label: 'Tags',      href: '/tags',       global: true,  category: 'knowledge',  hint: 'Folksonomía · cloud de tags' },
    { id: 'folders',   icon: '📁', label: 'Folders',   href: '/folders',    global: true,  category: 'knowledge',  hint: 'Carpetas inteligentes · queries persistentes' },
    { id: 'mind',      icon: '🕸',  label: 'Mind-Graph',href: '/mind',       global: true,  category: 'knowledge',  hint: 'Mind-as-Graph total · panorámica del KB' },
    { id: 'market',    icon: '🛒', label: 'Mercado',   href: '/market',     global: true,  category: 'market',     hint: 'Catálogo de productos y servicios' },
    { id: 'efficiency',icon: '⚡', label: 'Eficiencia', href: '/efficiency', global: true,  category: 'market',     hint: 'KM-001 · tokens/coste/pruning · ROI IA' },
    { id: 'savings',   icon: '📊', label: 'Ahorro',    href: '/savings',    global: true,  category: 'market',     hint: 'Cuadro comparativo de ahorro vs convencional · global o por proyecto' },
    { id: 'identity',  icon: '👤', label: 'Identidad', href: '/identity',   global: true,  category: 'identity',   hint: 'Tu perfil · DID local-first · wallet' },
    { id: 'settings',  icon: '⚙',  label: 'Settings',  href: '/settings',   global: true,  category: 'identity',   hint: 'Claves API · IA · purga' },
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
            if (projectId && ['map', 'sops', 'kanban', 'market', 'wallet', 'savings'].includes(d.id)) {
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

// ─── UX-NAV-002 · agrupación por categorías ────────────────────────────────
// PURO. Devuelve `[{category: NAV_CATEGORIES_entry, links: [...]}]` con
// los destinos contextualizados por projectId y filtrados por global.
export function groupNavByCategory({ active = '', projectId = null } = {}) {
    const links = buildNavLinks({ active, projectId });
    const groups = NAV_CATEGORIES.map(cat => ({
        category: cat,
        links:    links.filter(l => l.category === cat.id),
    })).filter(g => g.links.length > 0);
    return groups;
}

// Render compacto · Dashboard suelto + 4 dropdowns por categoría.
// Cada vista decide su CSS con los hooks provistos.
export function renderNavGroupedHtml({
    active = '', projectId = null,
    className   = 'sos-nav-link',
    activeClass = 'sos-nav-link-active',
    groupClass  = 'sos-nav-group',
    menuClass   = 'sos-nav-menu',
} = {}) {
    const groups = groupNavByCategory({ active, projectId });
    return groups.map(g => {
        // Si la categoría sólo tiene un link y es el dashboard (home), render directo
        if (g.category.id === 'home' && g.links.length === 1) {
            const l = g.links[0];
            const cls = l.active ? `${className} ${activeClass}` : className;
            return `<a href="${l.href}" data-link class="${cls}" title="${_esc(l.hint)}">${l.icon} ${_esc(l.label)}</a>`;
        }
        // Si hay sólo un link en una categoría no-home, también render directo
        if (g.links.length === 1) {
            const l = g.links[0];
            const cls = l.active ? `${className} ${activeClass}` : className;
            return `<a href="${l.href}" data-link class="${cls}" title="${_esc(l.hint)}">${l.icon} ${_esc(l.label)}</a>`;
        }
        // Categoría con varios links · dropdown
        const anyActive = g.links.some(l => l.active);
        const headerCls = anyActive ? `${className} ${activeClass}` : className;
        const items = g.links.map(l => {
            const cls = l.active ? `${className} ${activeClass}` : className;
            return `<a href="${l.href}" data-link class="${cls}" title="${_esc(l.hint)}" role="menuitem">${l.icon} ${_esc(l.label)}</a>`;
        }).join('');
        return `<div class="${groupClass}" data-nav-group="${g.category.id}">
                    <button class="${headerCls}" type="button" aria-haspopup="true" aria-expanded="false" title="${_esc(g.category.hint || '')}">${g.category.icon} ${_esc(g.category.label)} <span aria-hidden="true">▾</span></button>
                    <div class="${menuClass}" role="menu" hidden>${items}</div>
                </div>`;
    }).join('');
}

// Bind helper opcional · activa el toggle de los dropdowns en runtime.
// El consumidor llama esto tras renderizar los grupos en el DOM.
// Cierra al click fuera y al pulsar Escape.
export function bindNavGroupDropdowns(rootEl) {
    if (!rootEl || typeof rootEl.querySelectorAll !== 'function') return;
    const groups = rootEl.querySelectorAll('[data-nav-group]');
    groups.forEach(g => {
        const btn  = g.querySelector('button');
        const menu = g.querySelector('[role="menu"]');
        if (!btn || !menu) return;
        const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
        const open  = () => { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); };
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Cierra otros groups primero
            rootEl.querySelectorAll('[data-nav-group] [role="menu"]').forEach(m => { if (m !== menu) m.hidden = true; });
            rootEl.querySelectorAll('[data-nav-group] button').forEach(b => { if (b !== btn) b.setAttribute('aria-expanded', 'false'); });
            if (menu.hidden) open(); else close();
        });
        // Click en cualquier item · cerrar después de la navegación SPA
        menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setTimeout(close, 50)));
    });
    // Click fuera · cerrar todos
    document.addEventListener('click', () => {
        rootEl.querySelectorAll('[data-nav-group] [role="menu"]').forEach(m => { m.hidden = true; });
        rootEl.querySelectorAll('[data-nav-group] button').forEach(b => b.setAttribute('aria-expanded', 'false'));
    }, { once: false });
    // Escape · cerrar todos
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            rootEl.querySelectorAll('[data-nav-group] [role="menu"]').forEach(m => { m.hidden = true; });
            rootEl.querySelectorAll('[data-nav-group] button').forEach(b => b.setAttribute('aria-expanded', 'false'));
        }
    });
}

function _esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

// CSS mínimo común para los dropdowns · se inyecta una sola vez en <head>.
// Cada vista puede mantener sus propios estilos para los anchors (className)
// pero el contenedor del menú compartido necesita posicionamiento absoluto
// y un fondo neutro. Inyección idempotente.
const NAV_GROUP_STYLE_ID = 'sos-nav-group-style';
const NAV_GROUP_CSS = `
.sos-nav-group { position: relative; display: inline-flex; }
.sos-nav-group > button { background: transparent; border: 0; padding: 0; margin: 0; cursor: pointer; font: inherit; color: inherit; display: inline-flex; align-items: center; gap: 4px; }
.sos-nav-group > [role="menu"] {
    position: absolute; top: 100%; right: 0; margin-top: 4px;
    min-width: 200px; background: #0e0e14; border: 1px solid #2a2a35;
    border-radius: 8px; padding: 6px; z-index: 1000;
    box-shadow: 0 8px 24px rgba(0,0,0,0.45);
    display: flex; flex-direction: column; gap: 2px;
}
.sos-nav-group > [role="menu"][hidden] { display: none; }
.sos-nav-group > [role="menu"] > a { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 5px; white-space: nowrap; text-decoration: none; }
.sos-nav-group > [role="menu"] > a:hover { background: rgba(99,102,241,0.12); }
@media (max-width: 720px) {
    .sos-nav-group > [role="menu"] { right: auto; left: 0; }
}
`;

export function ensureNavGroupStyle() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(NAV_GROUP_STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = NAV_GROUP_STYLE_ID;
    el.textContent = NAV_GROUP_CSS;
    document.head.appendChild(el);
}
