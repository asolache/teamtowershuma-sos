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
// UX-NAV-V2 · arquitectura informació v2 · agrupació pel viatge del fundador
// (Foundation → Execution → Value → Commercial) + Swarm + Discovery + Identity.
// 7 grups · max 5-6 items per grup · ordre natural cap → cua del cicle.
// Copy human-readable centralitzat via sosCopy.label('nav.<id>').
export const NAV_CATEGORIES = Object.freeze([
    { id: 'foundation',  label: 'Fundació',           icon: '🏛', hint: 'Defineix el projecte abans d\'engegar el cicle · canvas · pitch · pacte de socis' },
    { id: 'execution',   label: 'Execució',           icon: '⚙',  hint: 'Operativa diària · kanban · procediments · mapa de valor' },
    { id: 'value',       label: 'Valor',              icon: '💎', hint: 'Disseny econòmic · tokenomics · comptabilitat · wallet' },
    { id: 'commercial',  label: 'Comercial',          icon: '💼', hint: 'Cicle de venda · propostes · factures · mercat · estalvi vs convencional' },
    { id: 'swarm',       label: 'Swarm Intel·ligència', icon: '🐝', hint: 'Automatització IA · sprints · flux paral·lel · millora contínua · cicle del projecte' },
    { id: 'discovery',   label: 'Descobriment',       icon: '🌐', hint: 'Permaweb federation · oportunitats · registre públic · Matriu' },
    { id: 'identity',    label: 'Identitat',          icon: '👤', hint: 'Tu · skills · aprendre · settings · saldo personal' },
]);

// Catálogo cerrado de destinos principales · ordenado por flujo natural
// del operador: descubrir → diseñar → ejecutar → contabilizar → ofertar.
// Cada destino lleva ahora `category` (id de NAV_CATEGORIES) para UX-NAV-002.
// UX-NAV-V2 · destins · category restructurada · copy via sosCopy.label('nav.X')
// Per a actualitzar copy human-readable · editar sosCopy.js (DRY).
// Per a re-aplicar copy v2 · usar applyToNavDestinations(NAV_DESTINATIONS).
export const NAV_DESTINATIONS = Object.freeze([
    // ─── Foundation · defineix el projecte ────────────────────────────────
    { id: 'dashboard', icon: '🏠', label: 'Dashboard',       href: '/dashboard',        global: true,  category: 'foundation', hint: 'Inici · llistat dels teus projectes · entrada al cicle' },
    { id: 'canvas',    icon: '🎨', label: 'Canvas',          href: '/canvas',           global: false, category: 'foundation', hint: 'Vision · mission · values · stakeholders · north-star del projecte' },
    { id: 'pitch',     icon: '📣', label: 'Pitch',           href: '/pitch',            global: false, category: 'foundation', hint: 'One-pager públic shareable amb OG meta · 6 seccions' },
    { id: 'pact',      icon: '🤝', label: 'Pacte',           href: '/pact',             global: false, category: 'foundation', hint: 'Pacte de socis dinàmic · ECDSA signatures · primer contracte SOS' },
    { id: 'presentation', icon: '🎤', label: 'Presentació',  href: '/presentation',     global: false, category: 'foundation', hint: 'Landing read-only del projecte · imprimible · roles + tx + SOPs' },

    // ─── Execution · operativa diària ─────────────────────────────────────
    { id: 'map',       icon: '🗺',  label: 'Mapa',            href: '/map',              global: true,  category: 'execution',  hint: 'Mapa de valor del projecte actiu · roles · transactions · entregables' },
    { id: 'kanban',    icon: '📋', label: 'Tasques',         href: '/kanban',           global: true,  category: 'execution',  hint: 'Work orders · backlog → in-progress → done · WO context SOS' },
    { id: 'sops',      icon: '📜', label: 'Procediments',    href: '/sops',             global: false, category: 'execution',  hint: 'SOPs · procediments del projecte · pots publicar al mercat' },

    // ─── Value · disseny econòmic ─────────────────────────────────────────
    { id: 'tokenomics',icon: '🪙', label: 'Tokenomics',      href: '/tokenomics',       global: false, category: 'value',      hint: 'Disseny del token · 6 grups + vesting + quality score live' },
    { id: 'accounting',icon: '📒', label: 'Comptabilitat',   href: '/accounting',       global: false, category: 'value',      hint: 'Ledger double-entry · balance sheet · P&L per període' },
    { id: 'wallet',    icon: '💶', label: 'Wallet',          href: '/wallet',           global: false, category: 'value',      hint: 'Saldo prepago del projecte · moviments del ledger' },
    { id: 'value',     icon: '🥧', label: 'Pastís de valor', href: '/value-accounting', global: false, category: 'value',      hint: 'Slicing Pie + FairShares · pastís del projecte · equity dinàmic' },

    // ─── Commercial · cicle de venda ──────────────────────────────────────
    { id: 'proposals', icon: '📝', label: 'Propostes',       href: '/proposals',        global: false, category: 'commercial', hint: 'IA brief + skill matching + PDF · win rate tracker' },
    { id: 'invoices',  icon: '🧾', label: 'Factures',        href: '/invoices',         global: false, category: 'commercial', hint: 'CRUD invoices · IVA · auto-ledger entry quan paid · print-PDF' },
    { id: 'market',    icon: '🛒', label: 'Mercat',          href: '/market',           global: true,  category: 'commercial', hint: 'Catàleg productes · serveis · workshops · subscripcions · sops · permaweb federation' },
    { id: 'savings',   icon: '📊', label: 'Estalvi',         href: '/savings',          global: true,  category: 'commercial', hint: 'Estalvi vs notaria · contable · PM · consultoria · global o per projecte' },
    { id: 'efficiency',icon: '⚡', label: 'Eficiència',      href: '/efficiency',       global: true,  category: 'commercial', hint: 'Tokens · cost · pruning · ROI IA · KM-001' },

    // ─── Swarm · automatització IA ────────────────────────────────────────
    { id: 'lifecycle', icon: '🌀', label: 'Cicle',           href: '/lifecycle',        global: false, category: 'swarm',      hint: 'Dashboard amb 10 fases · status %  · next-best-action · capstone Wave 2' },
    { id: 'sprint',    icon: '🐝', label: 'Sprint Swarm',    href: '/sprint',           global: true,  category: 'swarm',      hint: 'Sprint orchestrator · backlog estructurat + IA runs autonomous TDD' },
    { id: 'swarm',     icon: '🌪', label: 'Flux paral·lel',  href: '/swarm',            global: false, category: 'swarm',      hint: 'DAG executor paral·lel · Promise.all per level · pillar Antigravity' },
    { id: 'improve',   icon: '🔁', label: 'Millora contínua',href: '/improve',          global: false, category: 'swarm',      hint: 'TDD WO + feedback agent · cicle continu auto-orquestrat' },
    { id: 'path',      icon: '🧠', label: 'Historial neural',href: '/path',             global: true,  category: 'swarm',      hint: 'Path nodal cronològic · curador de context bundles per a IA' },

    // ─── Discovery · permaweb federation ──────────────────────────────────
    { id: 'opportunities', icon: '🚀', label: 'Descobreix',  href: '/opportunities',    global: true,  category: 'discovery',  hint: 'Projectes · WOs · productes · workshops · CV nodals · usuaris federats al permaweb' },
    { id: 'registry',  icon: '🌐', label: 'Registre',        href: '/registry',         global: true,  category: 'discovery',  hint: 'Registre públic permaweb · operadors SOS descobribles · verify free' },
    { id: 'matriu',    icon: '✦',  label: 'Matriu',          href: '/matriu',           global: true,  category: 'discovery',  hint: 'Landing pública Matriu Incoopadora · Cohort 0 oberta · 108 places' },

    // ─── Identity · tu ────────────────────────────────────────────────────
    { id: 'identity',  icon: '👤', label: 'Identitat',       href: '/identity',         global: true,  category: 'identity',   hint: 'El teu perfil · DID local-first · ECDSA keypair' },
    { id: 'mywallet',  icon: '💼', label: 'Saldo personal',  href: '/wallet',           global: true,  category: 'identity',   hint: 'Saldo personal per pagar APIs IA · transferible a projectes' },
    { id: 'skills',    icon: '🤲', label: 'Skills',          href: '/skills',           global: true,  category: 'identity',   hint: '90 skills · 5 domains · 3 tiers · 12 tipus de projecte' },
    { id: 'sectors',   icon: '📚', label: 'Sectors',         href: '/sectors',          global: true,  category: 'identity',   hint: 'Catàleg A-S · readiness · roles + transactions del KB' },
    { id: 'learn',     icon: '🎓', label: 'Aprèn',           href: '/learn',            global: true,  category: 'identity',   hint: 'Glossari navegable · aprendre fent' },
    { id: 'tags',      icon: '🏷', label: 'Tags',            href: '/tags',             global: true,  category: 'identity',   hint: 'Folksonomia · cloud de tags' },
    { id: 'folders',   icon: '📁', label: 'Carpetes',        href: '/folders',          global: true,  category: 'identity',   hint: 'Carpetes intel·ligents · queries persistents' },
    { id: 'mind',      icon: '🕸',  label: 'Mind-graph',      href: '/mind',             global: true,  category: 'identity',   hint: 'Mind-as-Graph total · panoràmica galàctica del KB' },
    { id: 'settings',  icon: '⚙',  label: 'Settings',        href: '/settings',         global: true,  category: 'identity',   hint: 'Claus API · IA · purga · preferències' },
    { id: 'design',    icon: '🎨', label: 'Disseny SOS',     href: '/design',           global: true,  category: 'identity',   hint: 'Design system v1 · mockup deluxe · arquitectura informació · component library' },
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
            if (projectId && ['map', 'sops', 'kanban', 'market', 'wallet', 'savings', 'presentation', 'pact', 'value'].includes(d.id)) {
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
    // UX-AUDIT-001 sprint E · classe estable `sos-nav-active` sempre que active=true,
    // a més de l'activeClass custom · permet styling consistent independent del view.
    const activeCls = (l) => l.active ? `${className} ${activeClass} sos-nav-active` : className;
    const aria      = (l) => l.active ? ' aria-current="page"' : '';
    return groups.map(g => {
        // Si la categoría sólo tiene un link y es el dashboard (home), render directo
        if (g.category.id === 'home' && g.links.length === 1) {
            const l = g.links[0];
            return `<a href="${l.href}" data-link class="${activeCls(l)}" title="${_esc(l.hint)}"${aria(l)}>${l.icon} ${_esc(l.label)}</a>`;
        }
        // Si hay sólo un link en una categoría no-home, también render directo
        if (g.links.length === 1) {
            const l = g.links[0];
            return `<a href="${l.href}" data-link class="${activeCls(l)}" title="${_esc(l.hint)}"${aria(l)}>${l.icon} ${_esc(l.label)}</a>`;
        }
        // Categoría con varios links · dropdown · UX-AUDIT-001 sprint F: Information Scent
        // Cada item ara mostra label + hint subtitle (si està definit) per donar
        // pistes visuals de què trobarà l'usuari abans de clicar.
        const anyActive = g.links.some(l => l.active);
        const headerCls = anyActive ? `${className} ${activeClass} sos-nav-active` : className;
        const items = g.links.map(l => {
            const hint = l.hint ? `<span class="sos-nav-hint">${_esc(l.hint)}</span>` : '';
            return `<a href="${l.href}" data-link class="${activeCls(l)}" title="${_esc(l.hint)}"${aria(l)} role="menuitem">
                <span class="sos-nav-icon" aria-hidden="true">${l.icon}</span>
                <span class="sos-nav-content">
                    <span class="sos-nav-label">${_esc(l.label)}</span>
                    ${hint}
                </span>
            </a>`;
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
//
// IDEMPOTENT (fix UX 2026-05-09 · bug "dropdowns no funcionen a /mind"):
// - Cada botón se marca amb `data-nav-bound="1"` un cop bound · evita
//   acumular handlers a cada navegació SPA.
// - El listener global click/keydown del document es registra UN SOL
//   COP via flag de mòdul · evita acumulació cross-navigation.
let _navGlobalListenersBound = false;
export function bindNavGroupDropdowns(rootEl) {
    if (!rootEl || typeof rootEl.querySelectorAll !== 'function') return;
    const groups = rootEl.querySelectorAll('[data-nav-group]');
    groups.forEach(g => {
        const btn  = g.querySelector('button');
        const menu = g.querySelector('[role="menu"]');
        if (!btn || !menu) return;
        if (btn.getAttribute('data-nav-bound') === '1') return;   // ja bound · skip
        btn.setAttribute('data-nav-bound', '1');
        const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
        const open  = () => { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); };
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Cierra otros groups primero (en TODO el DOM, no solo rootEl ·
            // múltiples vistas pueden tener nav groups simultáneos)
            document.querySelectorAll('[data-nav-group] [role="menu"]').forEach(m => { if (m !== menu) m.hidden = true; });
            document.querySelectorAll('[data-nav-group] button').forEach(b => { if (b !== btn) b.setAttribute('aria-expanded', 'false'); });
            if (menu.hidden) open(); else close();
        });
        // Click en cualquier item · cerrar después de la navegación SPA
        menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setTimeout(close, 50)));
    });
    if (_navGlobalListenersBound) return;
    _navGlobalListenersBound = true;
    // Click fuera · cerrar todos (1 sol cop registrat)
    document.addEventListener('click', () => {
        document.querySelectorAll('[data-nav-group] [role="menu"]').forEach(m => { m.hidden = true; });
        document.querySelectorAll('[data-nav-group] button').forEach(b => b.setAttribute('aria-expanded', 'false'));
    });
    // Escape · cerrar todos (1 sol cop registrat)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('[data-nav-group] [role="menu"]').forEach(m => { m.hidden = true; });
            document.querySelectorAll('[data-nav-group] button').forEach(b => b.setAttribute('aria-expanded', 'false'));
        }
    });
}

function _esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

// ─── UX-NAV-003 sprint A · Breadcrumb dinámico ────────────────────────────
// Input @alvaro 2026-04-30: "quiero que la UX de SOS me ayude a saber dónde
// estoy en todo momento". El breadcrumb se inyecta automáticamente bajo
// la topbar de cada vista (router · zero changes en vistas individuales).

// Mapeo de routes globales a labels legibles
const ROUTE_LABELS = Object.freeze({
    '/dashboard':  '🏠 Inicio',
    '/map':        '🗺 Mapa',
    '/sops':       '📜 SOPs',
    '/kanban':     '📋 Kanban',
    '/wallet':     '💶 Wallet',
    '/savings':    '📊 Ahorro',
    '/efficiency': '⚡ Eficiencia',
    '/market':     '🛒 Mercado',
    '/tags':       '🏷 Tags',
    '/folders':    '📁 Folders',
    '/mind':       '🕸 Mind-Graph',
    '/identity':   '👤 Identidad',
    '/settings':   '⚙ Settings',
    '/workshops':  '🎓 Workshops',
});

// Detecta la fase del proyecto · heurística simple sobre stats
// (KM-001 podría afinarla con datos reales en sprint B).
// projectStats opcional · {sopsCount, woBacklog, woDoing, woLedgered}.
export function detectProjectPhase(project, projectStats = null) {
    if (!project) return null;
    // Override manual via tag phase:X
    const tags = (project.tags || project.content?.tags || []);
    const phaseTag = (Array.isArray(tags) ? tags : []).find(t => typeof t === 'string' && t.startsWith('phase:'));
    if (phaseTag) {
        const v = phaseTag.slice(6).toLowerCase();
        if (['design', 'build', 'operate', 'ledger'].includes(v)) return v;
    }
    // Heurística sobre stats si están
    if (projectStats) {
        if ((projectStats.woLedgered || 0) > 0) return 'ledger';
        if ((projectStats.woDoing    || 0) > 0) return 'operate';
        if ((projectStats.sopsCount  || 0) > 0) return 'build';
    }
    // Fallback · si tiene roles → DESIGN avanzado · si vacío → DESIGN inicial
    return 'design';
}

const PHASE_META = Object.freeze({
    design:  { icon: '🎨', label: 'DESIGN',  color: '#a855f7', hint: 'Diseñando el mapa de valor · roles · transacciones' },
    build:   { icon: '🛠',  label: 'BUILD',   color: '#facc15', hint: 'Creando SOPs · WOs · plantillas' },
    operate: { icon: '⚙',  label: 'OPERATE', color: '#06b6d4', hint: 'Ejecutando WOs · IA + humanos' },
    ledger:  { icon: '💶', label: 'LEDGER',  color: '#22c55e', hint: 'Contabilizando · ahorro · slicing pie' },
});
export { PHASE_META };

// Construye el breadcrumb. PURO. Devuelve `[{label, href, current}]`.
// `pathname` y `search` vienen de window.location.
// `projects` es el array de proyectos del store (puede ser []).
export function buildBreadcrumb({ pathname = '/', search = '', projects = [] } = {}) {
    const path = pathname.replace(/\/$/, '') || '/';
    const params = new URLSearchParams(search || '');
    const projectId = params.get('project') || null;
    const project   = projectId ? (projects || []).find(p => p && p.id === projectId) : null;

    const out = [];
    // Inicio siempre primero (excepto en `/` y `/dashboard`)
    out.push({ label: '🏠 Inicio', href: '/dashboard', current: false });

    // Caso /n/{id}
    const nMatch = path.match(/^\/n\/(.+)$/);
    if (nMatch) {
        const id = decodeURIComponent(nMatch[1]);
        out.push({ label: '🔎 Nodo: ' + id.slice(0, 16) + (id.length > 16 ? '…' : ''), href: '#', current: true });
    }
    // Caso /project/{id}
    else if (path.startsWith('/project/')) {
        const id = decodeURIComponent(path.slice(9));
        const p  = (projects || []).find(x => x && x.id === id);
        const name = p?.nombre || p?.name || id;
        out.push({ label: '🎛 ' + name, href: '/project/' + encodeURIComponent(id), current: true });
    }
    // Caso global con project query
    else if (projectId && project) {
        const name = project.nombre || project.name || projectId;
        out.push({ label: '🎛 ' + name, href: '/project/' + encodeURIComponent(projectId), current: false });
        const label = ROUTE_LABELS[path] || path;
        out.push({ label, href: path + (search || ''), current: true });
    }
    // Caso global sin project · ruta conocida
    else if (ROUTE_LABELS[path]) {
        if (path === '/dashboard') {
            // ya tenemos Inicio · marcamos current
            out[0].current = true;
        } else {
            out.push({ label: ROUTE_LABELS[path], href: path, current: true });
        }
    }
    // Caso `/` · sólo Inicio current
    else if (path === '/') {
        out[0].current = true;
    }
    // Fallback · ruta desconocida
    else {
        out.push({ label: '· ' + path, href: path, current: true });
    }
    return out;
}

// Renderiza el breadcrumb como HTML compacto.
// items = output de buildBreadcrumb. options.phase = 'design'|...|null.
export function renderBreadcrumbHtml({ items = [], phase = null, className = 'sos-breadcrumb' } = {}) {
    const crumbs = items.map((it, i) => {
        const sep = i > 0 ? '<span class="sos-bc-sep" aria-hidden="true">›</span>' : '';
        if (it.current) return sep + `<span class="sos-bc-current" aria-current="page">${_esc(it.label)}</span>`;
        return sep + `<a href="${_esc(it.href)}" data-link class="sos-bc-link">${_esc(it.label)}</a>`;
    }).join('');
    let phaseHtml = '';
    if (phase && PHASE_META[phase]) {
        const m = PHASE_META[phase];
        phaseHtml = `<span class="sos-bc-phase" style="background:${m.color}22;color:${m.color};border-color:${m.color}55;" title="${_esc(m.hint)}">${m.icon} ${_esc(m.label)}</span>`;
    }
    return `<nav class="${className}" aria-label="Breadcrumb">${crumbs}${phaseHtml}</nav>`;
}

// CSS único inyectado una vez · idempotente. Llamado desde el router.
const BREADCRUMB_STYLE_ID = 'sos-breadcrumb-style';
const BREADCRUMB_CSS = `
.sos-breadcrumb {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 1.5rem;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border-subtle);
    font-size: var(--text-xs, 0.8125rem);
    color: var(--text-muted);
    font-family: var(--font-mono);
    flex-wrap: wrap;
}
.sos-breadcrumb a, .sos-breadcrumb .sos-bc-current { display: inline-flex; align-items: center; gap: 4px; }
.sos-breadcrumb a {
    color: var(--accent-indigo);
    text-decoration: none;
    padding: 2px 6px;
    border-radius: var(--radius-sm, 6px);
    transition: background var(--dur-fast, 120ms), color var(--dur-fast, 120ms);
}
.sos-breadcrumb a:hover { color: var(--text-main); background: rgba(99,102,241,0.10); }
.sos-breadcrumb .sos-bc-current { color: var(--text-main); font-weight: 600; padding: 2px 6px; }
.sos-breadcrumb .sos-bc-sep { color: var(--text-disabled, var(--text-muted)); padding: 0 2px; opacity: 0.6; }
.sos-breadcrumb .sos-bc-phase {
    margin-left: auto;
    padding: 3px 10px;
    border-radius: var(--radius-full, 999px);
    border: 1px solid;
    font-family: var(--font-mono);
    font-size: var(--text-xs, 0.8125rem);
    letter-spacing: 0.06em;
    font-weight: 700;
    text-transform: uppercase;
}
@media (max-width: 720px) {
    .sos-breadcrumb { padding: 6px 1rem; }
    .sos-breadcrumb .sos-bc-phase { margin-left: 4px; }
}
`;

export function ensureBreadcrumbStyle() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(BREADCRUMB_STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = BREADCRUMB_STYLE_ID;
    el.textContent = BREADCRUMB_CSS;
    document.head.appendChild(el);
}

// Helper async · pinta el breadcrumb actual sobre `targetEl`. Llamado por el router.
// Idempotente · sustituye el HTML anterior. Calcula phase si hay project + KB.
export async function paintBreadcrumb({
    targetEl,
    pathname = window.location.pathname,
    search   = window.location.search,
    projects = [],
    projectStats = null,
} = {}) {
    if (!targetEl) return;
    ensureBreadcrumbStyle();
    const items = buildBreadcrumb({ pathname, search, projects });
    // Resolver phase si hay proyecto activo
    let phase = null;
    const params = new URLSearchParams(search || '');
    const projectId = params.get('project') || (pathname.startsWith('/project/') ? decodeURIComponent(pathname.slice(9)) : null);
    if (projectId) {
        const p = (projects || []).find(x => x && x.id === projectId);
        if (p) phase = detectProjectPhase(p, projectStats);
    }
    // UX · ocultar el slot cuando no hay valor que mostrar (single-item sin phase)
    // para no consumir altura en /dashboard etc. Mantiene la regla "el slot
    // toma su altura natural" del flexbox · 0px cuando display:none.
    if ((items?.length || 0) <= 1 && !phase) {
        targetEl.innerHTML = '';
        targetEl.style.display = 'none';
        return;
    }
    targetEl.style.display = '';
    targetEl.innerHTML = renderBreadcrumbHtml({ items, phase });
}

// ─── UX-AUDIT-001 sprint H+ pass 5 · Global Nav al top ────────────────────
// Reframe: la nav agrupada (5 categories) viu a una barra GLOBAL sticky al
// top, fora dels topbars de cada vista. Abans cada view la incrustava dins
// del seu propi topbar i quan feia flex-wrap, la nav podia caure a la 2a
// fila — inconsistent. Ara sempre al top.

// Mapping pathname → destination id · per detectar l'item actiu
function _destinationForPath(pathname = '') {
    if (!pathname || pathname === '/') return 'dashboard';
    const path = pathname.split('?')[0].split('#')[0];
    if (path.startsWith('/project/')) return 'dashboard';   // hub propi · home category
    if (path.startsWith('/n/'))       return '';            // node view · sense actiu específic
    if (path.startsWith('/matriu'))   return 'matriu';
    // Match exacte amb NAV_DESTINATIONS · stripping params
    const stripped = path.replace(/^\//, '').split('/')[0];
    if (stripped === 'value-accounting') return 'value';
    const dest = NAV_DESTINATIONS.find(d => d.id === stripped);
    return dest ? dest.id : '';
}

// renderGlobalNavHtml · pura · genera el HTML de la nav global
export function renderGlobalNavHtml({ pathname = '', projectId = null } = {}) {
    const active = _destinationForPath(pathname);
    return `<div class="sos-global-nav-inner">
        <a href="/" data-link class="sos-global-nav-logo" title="Inicio · SOS V11">🗼 <span>SOS</span></a>
        <div class="sos-global-nav-groups">${renderNavGroupedHtml({ active, projectId, className: 'sos-global-nav-link' })}</div>
    </div>`;
}

// paintGlobalNav · injecta o actualitza la nav global · idempotent
export function paintGlobalNav({
    pathname = window.location.pathname,
    search   = window.location.search,
} = {}) {
    if (typeof document === 'undefined' || !document.body) return;
    ensureGlobalNavStyle();
    const params = new URLSearchParams(search || '');
    const projectId = params.get('project') || (pathname.startsWith('/project/') ? decodeURIComponent(pathname.slice(9)) : null);
    let el = document.getElementById('sos-global-nav-slot');
    if (!el) {
        // El router crearà el slot, però per defensiva si no existeix el creem
        el = document.createElement('div');
        el.id = 'sos-global-nav-slot';
        document.body.insertBefore(el, document.body.firstChild);
    }
    el.innerHTML = `<nav class="sos-global-nav" aria-label="Global navigation">${renderGlobalNavHtml({ pathname, projectId })}</nav>`;
    // Re-bind dropdown handlers · nous botons emesos
    bindNavGroupDropdowns(el);
}

const GLOBAL_NAV_STYLE_ID = 'sos-global-nav-style';
const GLOBAL_NAV_CSS = `
.sos-global-nav {
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border-default);
    padding: 0 16px;
    height: 48px;
    display: flex;
    align-items: center;
    z-index: 50;
}
.sos-global-nav-inner {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
}
.sos-global-nav-logo {
    font-weight: 800;
    font-size: var(--text-sm);
    color: var(--text-main);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    transition: background var(--dur-fast);
}
.sos-global-nav-logo:hover { background: var(--glass-hover); }
.sos-global-nav-logo span { color: var(--accent-indigo); }
.sos-global-nav-groups {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
    flex-wrap: wrap;
    justify-content: flex-end;
}
.sos-global-nav-link {
    color: var(--text-secondary);
    text-decoration: none;
    font-size: var(--text-sm);
    font-weight: 600;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    transition: all var(--dur-fast);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    line-height: 1.3;
}
.sos-global-nav-link:hover {
    color: var(--text-main);
    background: var(--glass-hover);
}
.sos-global-nav-link:focus-visible {
    outline: 2px solid var(--accent-indigo);
    outline-offset: 2px;
}
.sos-global-nav-link.sos-nav-active,
.sos-global-nav-link[aria-current="page"] {
    color: var(--accent-indigo);
    background: rgba(99,102,241,0.10);
}
@media (max-width: 720px) {
    .sos-global-nav { padding: 0 12px; }
    .sos-global-nav-link { font-size: var(--text-xs); padding: 6px 8px; }
    .sos-global-nav-logo { font-size: var(--text-xs); }
}
`;

export function ensureGlobalNavStyle() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(GLOBAL_NAV_STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = GLOBAL_NAV_STYLE_ID;
    el.textContent = GLOBAL_NAV_CSS;
    document.head.appendChild(el);
}

// ─── UX-AUDIT-001 sprint F · Bottom Nav mòbil (5 categories) ──────────────
// Barra inferior tipus app mòbil amb les 5 categories canòniques de
// NAV_CATEGORIES. Cada item enllaça a un destí representatiu de la categoria
// i marca actiu si la pathname actual pertany a aquesta categoria.
//
// Decisió de routing per categoria:
//   home        → /dashboard
//   operations  → /map (project-aware si hi ha projectId)
//   knowledge   → /tags
//   market      → /market
//   identity    → /settings

// Categoria → ruta representativa (no necessàriament la primera del grup,
// sinó la que té més sentit com a "landing" mobile).
const BOTTOM_NAV_DEFAULTS = Object.freeze({
    home:       '/dashboard',
    operations: '/map',
    knowledge:  '/tags',
    market:     '/market',
    identity:   '/settings',
});

// Mapping de pathname → category id · per detectar el actiu.
// Pre-calcula via NAV_DESTINATIONS · cada destí coneix la seva category.
function _categoryForPath(pathname = '') {
    if (!pathname) return null;
    // Strip query/hash
    const path = pathname.split('?')[0].split('#')[0];
    // /project/{id} → home (panell)
    if (path.startsWith('/project/')) return 'home';
    if (path.startsWith('/n/'))       return 'knowledge';
    // /matriu* → home (és el landing públic)
    if (path.startsWith('/matriu'))   return 'home';
    // /mobile · /presentation → market
    if (path === '/mobile' || path === '/presentation') return 'market';
    // /value-accounting → market (es comptabilitat de valor)
    if (path === '/value-accounting') return 'market';
    // /pact · /wallet · /sops · /kanban · /map → operations
    if (['/pact', '/wallet', '/sops', '/kanban', '/map'].includes(path)) return 'operations';
    // /tags · /folders · /mind · /skills · /learn → knowledge
    if (['/tags', '/folders', '/mind', '/skills', '/learn'].includes(path)) return 'knowledge';
    // /market · /efficiency · /savings · /workshops → market
    if (['/market', '/efficiency', '/savings', '/workshops'].includes(path)) return 'market';
    // /identity · /settings → identity
    if (['/identity', '/settings'].includes(path)) return 'identity';
    // Default home
    return 'home';
}

// renderBottomNavHtml · puro · genera l'HTML de la nav mòbil.
// `active` opcional · si no es passa, es detecta via `pathname`.
export function renderBottomNavHtml({ pathname = '', projectId = null, active = null } = {}) {
    const activeCat = active || _categoryForPath(pathname);
    const items = NAV_CATEGORIES.map(cat => {
        let href = BOTTOM_NAV_DEFAULTS[cat.id] || '/dashboard';
        // Operations és project-aware quan hi ha projectId
        if (cat.id === 'operations' && projectId) {
            href = '/map?project=' + encodeURIComponent(projectId);
        }
        const isActive = cat.id === activeCat;
        const cls = 'bn-item' + (isActive ? ' active' : '');
        const aria = isActive ? ' aria-current="page"' : '';
        return `<a href="${href}" data-link class="${cls}"${aria} title="${_esc(cat.hint || cat.label)}">
            <span class="bn-icon" aria-hidden="true">${cat.icon}</span>
            <span class="bn-label">${_esc(cat.label)}</span>
        </a>`;
    }).join('');
    return `<nav class="bottom-nav" aria-label="Mobile navigation"><div class="bn-menu">${items}</div></nav>`;
}

// paintBottomNav · async · injecta o actualitza la bottom nav al body.
// Idempotent · localitza per id `sos-bottom-nav` · substitueix l'HTML.
export function paintBottomNav({
    pathname = window.location.pathname,
    search   = window.location.search,
} = {}) {
    if (typeof document === 'undefined' || !document.body) return;
    const params = new URLSearchParams(search || '');
    const projectId = params.get('project') || (pathname.startsWith('/project/') ? decodeURIComponent(pathname.slice(9)) : null);
    let el = document.getElementById('sos-bottom-nav');
    const html = renderBottomNavHtml({ pathname, projectId });
    if (!el) {
        el = document.createElement('div');
        el.id = 'sos-bottom-nav';
        document.body.appendChild(el);
    }
    el.innerHTML = html;
}

// CSS mínimo común para los dropdowns · se inyecta una sola vez en <head>.
// Cada vista puede mantener sus propios estilos para los anchors (className)
// pero el contenedor del menú compartido necesita posicionamiento absoluto
// y un fondo neutro. Inyección idempotente.
const NAV_GROUP_STYLE_ID = 'sos-nav-group-style';
const NAV_GROUP_CSS = `
.sos-nav-group { position: relative; display: inline-flex; }
/* El botón hereda estilos de la className del view (dash-btn, kb-link, etc).
   Aquí sólo afegim el dropdown-specific gap, focus ring i aria-expanded state. */
.sos-nav-group > button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
}
.sos-nav-group > button:focus-visible {
    outline: 2px solid var(--accent-indigo);
    outline-offset: 2px;
}
.sos-nav-group > button[aria-expanded="true"] {
    color: var(--accent-indigo);
    border-color: var(--accent-indigo);
}
.sos-nav-group > [role="menu"] {
    position: absolute; top: calc(100% + 6px); right: 0;
    min-width: 260px; max-width: 320px;
    background: var(--bg-panel);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md, 8px);
    padding: 6px;
    z-index: 1000;
    box-shadow: var(--shadow-lg, 0 12px 32px rgba(0,0,0,0.50));
    display: flex; flex-direction: column;
    gap: 1px;
    animation: sosNavMenuIn var(--dur-base, 200ms) var(--ease-out, cubic-bezier(0.2,0.8,0.2,1));
}
@keyframes sosNavMenuIn {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
}
.sos-nav-group > [role="menu"][hidden] { display: none; }
.sos-nav-group > [role="menu"] > a {
    display: grid;
    grid-template-columns: 22px 1fr;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: var(--radius-sm, 6px);
    text-decoration: none;
    color: var(--text-secondary);
    font-size: var(--text-sm, 0.9375rem);
    font-weight: 500;
    line-height: 1.3;
    transition: background var(--dur-fast, 120ms), color var(--dur-fast, 120ms);
    position: relative;
    overflow: hidden;
}
.sos-nav-group > [role="menu"] > a:hover {
    background: rgba(99,102,241,0.10);
    color: var(--text-main);
}
/* UX-AUDIT-001 sprint F · Information Scent */
.sos-nav-icon { font-size: 1rem; line-height: 1; display: inline-flex; justify-content: center; }
.sos-nav-content { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.sos-nav-label { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sos-nav-hint {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 400;
    line-height: 1.3;
    white-space: normal;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}
.sos-nav-group > [role="menu"] > a:hover .sos-nav-hint { color: var(--text-secondary); }
.sos-nav-group > [role="menu"] > a.sos-nav-active .sos-nav-hint,
.sos-nav-group > [role="menu"] > a[aria-current="page"] .sos-nav-hint { color: var(--accent-indigo); opacity: 0.85; }
.sos-nav-group > [role="menu"] > a:focus-visible {
    outline: 2px solid var(--accent-indigo);
    outline-offset: -2px;
    color: var(--text-main);
}
.sos-nav-group > [role="menu"] > a.sos-nav-active,
.sos-nav-group > [role="menu"] > a[aria-current="page"] {
    background: rgba(99,102,241,0.12);
    color: var(--accent-indigo);
    font-weight: 600;
}
.sos-nav-group > [role="menu"] > a.sos-nav-active::before,
.sos-nav-group > [role="menu"] > a[aria-current="page"]::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    border-radius: 999px;
    background: var(--accent-indigo);
}
@media (max-width: 720px) {
    .sos-nav-group > [role="menu"] {
        right: auto; left: 0;
        min-width: 200px;
    }
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

// =============================================================================
// PROJ-QUALITY-001 sprint C · PROJECT SUB-NAVBAR
//
// Sub-barra contextual que apareix sota la global nav quan hi ha
// `?project=X` o ruta `/project/{id}`. Mostra:
//   - Nom + score qualitat (calculat des de projectQualityService)
//   - 10 tabs a totes les vistes del projecte, amb badge d'estat per dim
//   - Suggeriment "📌 Següent" amb la dim que dona més punts si es completa
//
// Guia "enseñar haciendo": cada tab està vinculada a la dimensió que
// influencia (landing/valueMap/deliverables/sops/workshops) · l'usuari
// veu d'un cop d'ull on completar perquè el score arribi a 90+.
// =============================================================================

import { computeQualityScore, QUALITY_DIMS, QUALITY_THRESHOLDS, statusColor, statusIcon } from './projectQualityService.js';

// Tabs del subnav · cadascuna referencia les dimensions a les que contribueix.
// `dims:[]` significa "no influeix al score" (operativa pura · kanban, wallet…).
// PROJ-CONFIG-001 · 'Hub' renombrat a 'Configuració' i mogut al final · és la
// pestanya d'admin tècnic (swarm matchmaker, federation publish, archive…).
export const PROJECT_SUBNAV_ITEMS = Object.freeze([
    { id: 'presentation', icon: '🎤', label: 'Presentació',  dims: ['landing'],                 buildHref: (pid) => '/presentation?project=' + encodeURIComponent(pid) },
    { id: 'quality',      icon: '🌟', label: 'Qualitat',     dims: [],                          buildHref: (pid) => '/quality?project=' + encodeURIComponent(pid) },
    { id: 'map',          icon: '🗺',  label: 'Mapa',         dims: ['valueMap', 'deliverables'],buildHref: (pid) => '/map?project=' + encodeURIComponent(pid) },
    { id: 'sops',         icon: '📜', label: 'SOPs',         dims: ['sops'],                    buildHref: (pid) => '/sops?project=' + encodeURIComponent(pid) },
    { id: 'workshops',    icon: '🎓', label: 'Workshops',    dims: ['workshops'],               buildHref: (pid) => '/workshops?project=' + encodeURIComponent(pid) },
    { id: 'market',       icon: '🛒', label: 'Mercat',       dims: ['landing'],                 buildHref: (pid) => '/market?project=' + encodeURIComponent(pid) },
    { id: 'kanban',       icon: '📋', label: 'Kanban',       dims: [],                          buildHref: (pid) => '/kanban?project=' + encodeURIComponent(pid) },
    { id: 'value',        icon: '🥧', label: 'Tarta',        dims: [],                          buildHref: (pid) => '/value-accounting?project=' + encodeURIComponent(pid) },
    { id: 'wallet',       icon: '💶', label: 'Wallet',       dims: [],                          buildHref: (pid) => '/wallet?project=' + encodeURIComponent(pid) },
    { id: 'pact',         icon: '📜', label: 'Pacte',        dims: [],                          buildHref: (pid) => '/pact?project=' + encodeURIComponent(pid) },
    { id: 'hub',          icon: '⚙',  label: 'Configuració', dims: [],                          buildHref: (pid) => '/project/' + encodeURIComponent(pid) },
]);

// Detecta si el pathname actual coincideix amb una de les tabs del subnav.
function _subnavActiveId(pathname = '') {
    const path = (pathname || '').split('?')[0].split('#')[0];
    if (path.startsWith('/project/'))   return 'hub';
    if (path === '/quality')            return 'quality';
    if (path === '/presentation')       return 'presentation';
    if (path === '/map')                return 'map';
    if (path === '/sops')               return 'sops';
    if (path === '/workshops')          return 'workshops';
    if (path === '/market')             return 'market';
    if (path === '/kanban')             return 'kanban';
    if (path === '/value-accounting')   return 'value';
    if (path === '/wallet')             return 'wallet';
    if (path === '/pact')               return 'pact';
    return '';
}

// Donada una quality result, calcula el status del tab basat en les seves dims.
// Retorna 'high' si totes les dims relacionades són ≥75, 'medium' si alguna
// està a 50-74, 'low' si alguna està <50, null si dims:[] (no aplica).
function _tabStatus(item, quality) {
    if (!item.dims || item.dims.length === 0) return null;
    if (!quality || !quality.byDim) return 'low';
    let worst = 'high';
    for (const dimId of item.dims) {
        const sc = (quality.byDim[dimId] && quality.byDim[dimId].score) || 0;
        if (sc < QUALITY_THRESHOLDS.medium)      return 'low';
        if (sc < QUALITY_THRESHOLDS.high)        worst = (worst === 'high' ? 'medium' : worst);
    }
    return worst;
}

// Calcula la dim que dona més impuls al total si arriba a 100.
// gain_potential = weight × (100 - currentScore) / 100
// Retorna { dim, gain, missing[] } o null si tot està a 100.
export function suggestNextDim(quality) {
    if (!quality || !quality.byDim) return null;
    let best = null;
    for (const dim of QUALITY_DIMS) {
        const sc   = (quality.byDim[dim.id] && quality.byDim[dim.id].score) || 0;
        if (sc >= 100) continue;
        const gain = Math.round(dim.weight * (100 - sc) / 100);
        if (!best || gain > best.gain) {
            best = { dim, gain, missing: (quality.byDim[dim.id] && quality.byDim[dim.id].missing) || [] };
        }
    }
    return best;
}

// Donada una dim id, troba la tab del subnav amb vincle (preferint la primera
// que la inclou). Útil per a la cta "📌 Següent".
function _tabForDim(dimId) {
    for (const item of PROJECT_SUBNAV_ITEMS) {
        if (item.dims && item.dims.includes(dimId)) return item;
    }
    return PROJECT_SUBNAV_ITEMS[0]; // fallback hub
}

// Genera el HTML del subnav · pur · accepta { project, quality, pathname }
export function renderProjectSubnavHtml({ project, quality, pathname = '' } = {}) {
    if (!project) return '';
    const active   = _subnavActiveId(pathname);
    const total    = quality && typeof quality.total === 'number' ? quality.total : 0;
    const status   = quality && quality.status                      ? quality.status : 'low';
    const color    = statusColor(status);
    const icon     = statusIcon(status);
    const name     = project.nombre || project.name || project.id;

    const tabsHtml = PROJECT_SUBNAV_ITEMS.map(item => {
        const tabStatus = _tabStatus(item, quality);
        const dot = tabStatus
            ? `<span class="sos-psub-dot" style="background:${statusColor(tabStatus)};" title="${statusIcon(tabStatus)} ${tabStatus}"></span>`
            : '';
        const cls = item.id === active ? 'sos-psub-tab is-active' : 'sos-psub-tab';
        const href = item.buildHref(project.id);
        return `<a href="${href}" data-link class="${cls}" title="${item.label}">
            <span class="sos-psub-tab-ico">${item.icon}</span>
            <span class="sos-psub-tab-lbl">${_esc(item.label)}</span>
            ${dot}
        </a>`;
    }).join('');

    const next = suggestNextDim(quality);
    let nextHtml = '';
    if (next && next.gain > 0) {
        const tab = _tabForDim(next.dim.id);
        const href = tab.buildHref(project.id);
        const firstMissing = (next.missing && next.missing[0] && next.missing[0].label) || ('Completa ' + next.dim.label);
        nextHtml = `<a class="sos-psub-next" href="${href}" data-link title="${_esc(firstMissing)}">
            <span class="sos-psub-next-pin">📌</span>
            <span class="sos-psub-next-lbl">Següent · ${next.dim.icon} ${_esc(next.dim.label)}</span>
            <span class="sos-psub-next-gain">+${next.gain} pts</span>
        </a>`;
    } else if (total >= 90) {
        nextHtml = `<span class="sos-psub-next sos-psub-next-done"><span>🌟</span><span>Excel·lent · ≥90</span></span>`;
    }

    const hubHref = '/project/' + encodeURIComponent(project.id);
    return `<div class="sos-psub-inner">
        <a class="sos-psub-name" href="${hubHref}" data-link title="${_esc(name)} · obrir hub">
            <span class="sos-psub-name-ico">${icon}</span>
            <span class="sos-psub-name-text">${_esc(name)}</span>
            <span class="sos-psub-name-score" style="color:${color};">${total}<span style="opacity:0.6;font-size:0.8em;">/100</span></span>
        </a>
        <div class="sos-psub-tabs">${tabsHtml}</div>
        <div class="sos-psub-cta">${nextHtml}</div>
    </div>`;
}

// CSS · injectat una sola vegada
const PROJECT_SUBNAV_STYLE_ID = 'sos-psub-style';
const PROJECT_SUBNAV_CSS = `
.sos-psub {
    background: var(--bg-elevated, var(--bg-panel));
    border-bottom: 1px solid var(--border-default);
    padding: 0 16px;
    min-height: 44px;
    display: flex;
    align-items: center;
    z-index: 49;
    position: relative;
}
.sos-psub-inner {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
    flex-wrap: wrap;
}
.sos-psub-name {
    display: inline-flex; align-items: center; gap: 8px;
    text-decoration: none; color: var(--text-main);
    padding: 6px 10px; border-radius: var(--radius-sm);
    background: var(--bg-panel);
    border: 1px solid var(--border-default);
    font-weight: 700; font-size: var(--text-xs);
    flex-shrink: 0;
}
.sos-psub-name:hover { border-color: var(--accent-indigo); }
.sos-psub-name-ico { font-size: 14px; }
.sos-psub-name-text { white-space: nowrap; max-width: 240px; overflow: hidden; text-overflow: ellipsis; }
.sos-psub-name-score { font-family: var(--font-mono); font-weight: 800; padding-left: 4px; border-left: 1px solid var(--border-default); margin-left: 4px; padding-left: 8px; }
.sos-psub-tabs { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; flex: 1; min-width: 0; }
.sos-psub-tab {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 9px; border-radius: var(--radius-sm);
    color: var(--text-secondary); text-decoration: none;
    font-size: var(--text-xs); font-weight: 600;
    border: 1px solid transparent; position: relative;
    transition: all var(--dur-fast);
}
.sos-psub-tab:hover { background: var(--glass-hover); color: var(--text-main); border-color: var(--border-default); }
.sos-psub-tab.is-active { background: var(--accent-indigo); color: #fff; border-color: var(--accent-indigo); }
.sos-psub-tab.is-active .sos-psub-tab-lbl { color: #fff; }
.sos-psub-tab-ico { font-size: 13px; }
.sos-psub-tab-lbl { white-space: nowrap; }
.sos-psub-dot {
    width: 7px; height: 7px; border-radius: 50%; display: inline-block;
    box-shadow: 0 0 0 2px var(--bg-elevated, var(--bg-panel));
}
.sos-psub-cta { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.sos-psub-next {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 10px; border-radius: var(--radius-sm);
    background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.12));
    border: 1px solid rgba(99,102,241,0.30);
    color: var(--text-main); text-decoration: none;
    font-size: var(--text-xs); font-weight: 700;
    transition: all var(--dur-fast);
}
.sos-psub-next:hover { border-color: var(--accent-indigo); background: linear-gradient(135deg, rgba(99,102,241,0.20), rgba(168,85,247,0.20)); }
.sos-psub-next-pin { font-size: 11px; }
.sos-psub-next-gain {
    font-family: var(--font-mono); font-size: 10px;
    background: rgba(99,102,241,0.20); color: var(--accent-indigo);
    padding: 1px 6px; border-radius: 10px;
}
.sos-psub-next-done {
    background: rgba(0,230,118,0.10); border-color: rgba(0,230,118,0.35);
    color: #00e676;
}
@media (max-width: 720px) {
    .sos-psub { padding: 0 8px; }
    .sos-psub-name-text { max-width: 120px; }
    .sos-psub-tab-lbl { display: none; }
    .sos-psub-tab { padding: 6px; }
}
`;

export function ensureProjectSubnavStyle() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(PROJECT_SUBNAV_STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = PROJECT_SUBNAV_STYLE_ID;
    el.textContent = PROJECT_SUBNAV_CSS;
    document.head.appendChild(el);
}

// paintProjectSubnav · async, accepta projectStats opcional · si no en té,
// pre-carrega sops/workshops/market amb KB importat. Idempotent: amaga el
// slot si no hi ha projecte actiu.
export async function paintProjectSubnav({
    pathname = (typeof window !== 'undefined' ? window.location.pathname : ''),
    search   = (typeof window !== 'undefined' ? window.location.search   : ''),
    projects = [],
    quality  = null,
} = {}) {
    if (typeof document === 'undefined' || !document.body) return;
    ensureProjectSubnavStyle();

    // Localitza slot · si no existeix el crea entre global-nav i breadcrumb
    let slot = document.getElementById('sos-project-subnav-slot');
    if (!slot) {
        slot = document.createElement('nav');
        slot.id = 'sos-project-subnav-slot';
        slot.className = 'sos-psub';
        slot.setAttribute('aria-label', 'Project context navigation');
        const breadcrumb = document.getElementById('sos-breadcrumb-slot');
        const globalNav  = document.getElementById('sos-global-nav-slot');
        if (breadcrumb && breadcrumb.parentNode) {
            breadcrumb.parentNode.insertBefore(slot, breadcrumb);
        } else if (globalNav && globalNav.parentNode && globalNav.nextSibling) {
            globalNav.parentNode.insertBefore(slot, globalNav.nextSibling);
        } else {
            const app = document.getElementById('app');
            if (app && app.parentNode) app.parentNode.insertBefore(slot, app);
        }
    }

    const params = new URLSearchParams(search || '');
    const projectId = params.get('project') || (pathname.startsWith('/project/') ? decodeURIComponent(pathname.slice(9)) : null);
    if (!projectId) {
        slot.innerHTML = '';
        slot.style.display = 'none';
        return;
    }
    const project = (projects || []).find(p => p && p.id === projectId);
    if (!project) {
        slot.innerHTML = '';
        slot.style.display = 'none';
        return;
    }
    slot.style.display = '';

    // Si no ens passen quality pre-calculada, anem a buscar les llistes a KB
    let q = quality;
    if (!q) {
        try {
            const KB = (await import('./kb.js')).KB;
            await KB.init();
            const [sops, workshops, marketItems] = await Promise.all([
                KB.query({ type: 'sop' }).catch(() => []),
                KB.query({ type: 'workshop' }).catch(() => []),
                KB.query({ type: 'market_item' }).catch(() => []),
            ]);
            q = computeQualityScore(project, { sops, workshops, marketItems });
        } catch (_) {
            q = computeQualityScore(project);
        }
    }

    slot.innerHTML = renderProjectSubnavHtml({ project, quality: q, pathname });
}
