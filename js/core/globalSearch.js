// =============================================================================
// TEAMTOWERS SOS V11 — GLOBAL SEARCH (UX-LEGENDARY · brain access instant)
// Ruta · /js/core/globalSearch.js
//
// Pattern Linear/Notion/Slack · cmd-K (o "/" o Ctrl-K) obre una recerca
// global · type → filter live across · projects · WOs · notes · skills ·
// attestations · qualsevol node KB. Click result → navigate.
//
// Mobile-first · bottom-sheet style · keyboard nav (↑↓ enter esc).
// W3C accessible · role="dialog" aria-modal · focus management · live region.
// =============================================================================

const SEARCH_ID    = 'sos-global-search';
const BACKDROP_ID  = 'sos-global-search-backdrop';
const CSS_ID       = 'sos-global-search-css';
const TRIGGER_ID   = 'sos-global-search-trigger';

function _ensureCss() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(CSS_ID)) return;
    const style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = `
        /* Trigger button · hidden floating · ctrl/cmd+K opens · "/" opens */
        .sos-search-trigger {
            position: fixed; top: 12px; right: 80px;
            background: rgba(99,102,241,0.18);
            color: #a8b2ff;
            border: 1px solid rgba(99,102,241,0.4);
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.78rem;
            cursor: pointer;
            z-index: 980;
            display: none;
            align-items: center; gap: 6px;
            font-family: var(--font-base, system-ui, sans-serif);
            font-weight: 600;
        }
        .sos-search-trigger:hover, .sos-search-trigger:focus-visible {
            background: rgba(99,102,241,0.28);
            outline: none;
        }
        .sos-search-trigger kbd {
            background: rgba(0,0,0,0.3);
            padding: 1px 6px;
            border-radius: 3px;
            font-family: var(--font-mono, monospace);
            font-size: 0.7rem;
        }
        @media (min-width: 769px) {
            .sos-search-trigger { display: inline-flex; }
        }
        /* < 768px · el search no ocupa lloc al top · pot obrir-se via "/" key
           o · més rellevant · futur botó al drawer */
        @media (max-width: 768px) {
            .sos-search-trigger { display: none !important; }
        }

        /* Search modal · backdrop + content */
        .sos-search-bg {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.65);
            z-index: 1800;
            display: none;
            align-items: flex-start; justify-content: center;
            padding: 80px 16px 16px 16px;
            animation: sos-search-fade 150ms ease-out;
        }
        .sos-search-bg.active { display: flex; }
        @media (max-width: 768px) {
            .sos-search-bg {
                padding: 0;
                align-items: flex-end;       /* bottom-sheet on mobile */
            }
        }
        @keyframes sos-search-fade { from { opacity: 0; } to { opacity: 1; } }

        .sos-search-panel {
            background: var(--bg-panel, #0f172a);
            color: var(--text-main, #e2e8f0);
            border: 1px solid var(--border-default, #1e293b);
            border-radius: 12px;
            max-width: 600px; width: 100%;
            max-height: 70vh; display: flex; flex-direction: column;
            font-family: var(--font-base, system-ui, sans-serif);
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            animation: sos-search-slide 200ms ease-out;
        }
        @keyframes sos-search-slide { from { transform: translateY(-12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @media (max-width: 768px) {
            .sos-search-panel {
                max-height: 80vh;
                border-radius: 16px 16px 0 0;
                animation: sos-search-slide-up 250ms ease-out;
            }
            @keyframes sos-search-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        }

        .sos-search-input-wrap {
            display: flex; align-items: center; gap: 10px;
            padding: 14px 18px;
            border-bottom: 1px solid var(--border-default, #1e293b);
        }
        .sos-search-input {
            flex: 1;
            background: transparent;
            color: var(--text-main, #e2e8f0);
            border: 0; outline: none;
            font-size: 1rem;
            font-family: var(--font-base, system-ui, sans-serif);
        }
        .sos-search-input::placeholder { color: var(--text-secondary, #94a3b8); }
        .sos-search-icon { font-size: 1.2rem; color: var(--text-secondary, #94a3b8); }
        .sos-search-esc {
            font-size: 0.7rem; padding: 2px 8px;
            background: rgba(255,255,255,0.06);
            border-radius: 4px;
            color: var(--text-secondary, #94a3b8);
            font-family: var(--font-mono, monospace);
        }

        .sos-search-results {
            overflow-y: auto;
            flex: 1;
            padding: 6px;
        }
        .sos-search-section {
            padding: 4px 12px;
            font-size: 0.65rem;
            font-weight: 700;
            color: var(--text-secondary, #94a3b8);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-top: 6px;
        }
        .sos-search-item {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 12px;
            border-radius: 6px;
            cursor: pointer;
            color: var(--text-main, #e2e8f0);
            text-decoration: none;
            font-size: 0.88rem;
            min-height: 44px;
            transition: background 100ms;
        }
        .sos-search-item:hover, .sos-search-item.active {
            background: rgba(99,102,241,0.18);
        }
        .sos-search-item .ic {
            font-size: 1.15rem; line-height: 1; min-width: 24px; text-align: center;
        }
        .sos-search-item .ttl { flex: 1; font-weight: 500; }
        .sos-search-item .type {
            font-size: 0.65rem;
            color: var(--text-secondary, #94a3b8);
            padding: 1px 6px;
            background: rgba(148,163,184,0.12);
            border-radius: 3px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }
        .sos-search-item .sos-search-visits {
            font-size: 0.7rem;
            font-weight: 700;
            color: #facc15;
            background: rgba(250,204,21,0.12);
            padding: 1px 7px;
            border-radius: 999px;
            min-width: 28px;
            text-align: center;
        }
        .sos-search-empty {
            padding: 28px 18px;
            color: var(--text-secondary, #94a3b8);
            font-size: 0.85rem;
            text-align: center;
        }

        .sos-search-foot {
            border-top: 1px solid var(--border-default, #1e293b);
            padding: 8px 14px;
            font-size: 0.7rem;
            color: var(--text-secondary, #94a3b8);
            display: flex; gap: 12px; flex-wrap: wrap;
        }
        .sos-search-foot kbd {
            background: rgba(255,255,255,0.06);
            padding: 1px 6px;
            border-radius: 3px;
            font-family: var(--font-mono, monospace);
        }
    `;
    document.head.appendChild(style);
}

// Static "quick links" sempre visibles (sense query)
const QUICK_LINKS = Object.freeze([
    { icon: '🏠', title: 'Avui · Home',         href: '/home',          type: 'page' },
    { icon: '➕', title: 'Crear projecte',      href: '/create',         type: 'action' },
    { icon: '💬', title: 'Timeline · Xarxa',    href: '/timeline',       type: 'page' },
    { icon: '🛒', title: 'Mercat · Descobrir',  href: '/market',         type: 'page' },
    { icon: '👤', title: 'El meu perfil',       href: '/identity',       type: 'page' },
    { icon: '🐝', title: 'Sprint · Swarm',      href: '/sprint',         type: 'page' },
    { icon: '⚙️', title: 'Settings',             href: '/settings',       type: 'page' },
    { icon: '🗺', title: 'Catàleg processos',  href: '/process-catalog',type: 'page' },
]);

// Icona per type de node
function _iconForType(type) {
    return ({
        'project':           '📁',
        'work_order':        '📋',
        'note':              '📝',
        'insight':           '💡',
        'skill_log':         '🎯',
        'skill':             '🤲',
        'matriu_member':     '👤',
        'attestation':       '✨',
        'pact':              '🤝',
        'invoice':           '🧾',
        'proposal':          '📝',
        'sop':               '📜',
        'soc':               '📐',
        'workshop':          '🎓',
        'market_item':       '🛒',
        'ledger_entry':      '📒',
        'role':              '🧑',
        'organization':      '🏢',
        'process':           '🔄',
        'public_registry_entry': '🌐',
        'learn_role':        '🎓',
    })[type] || '·';
}

// hrefForNode · pure · deriva ruta navegable per a un node
function _hrefForNode(node) {
    if (!node) return null;
    if (node.type === 'project')           return '/project/' + encodeURIComponent(node.id);
    if (node.type === 'work_order')        return '/kanban?project=' + encodeURIComponent(node.content?.projectId || node.project_id || '');
    if (node.type === 'matriu_member')     return '/u/' + encodeURIComponent((node.content?.handle || '').replace(/^@/, ''));
    if (node.type === 'sop')               return '/sops?project=' + encodeURIComponent(node.content?.projectId || '');
    if (node.type === 'invoice')           return '/invoices?project=' + encodeURIComponent(node.content?.projectId || '');
    if (node.type === 'proposal')          return '/proposals?project=' + encodeURIComponent(node.content?.projectId || '');
    if (node.type === 'market_item')       return '/market/' + encodeURIComponent(node.id);
    if (node.type === 'workshop')          return '/workshops?project=' + encodeURIComponent(node.content?.projectId || '');
    if (node.type === 'organization')      return '/org/' + encodeURIComponent(node.id);
    return '/n/' + encodeURIComponent(node.id);
}

function _titleForNode(node) {
    if (!node) return '';
    const c = node.content || {};
    return c.title || c.name || c.label || c.text?.slice(0, 80) || c.handle || c.displayName || node.id;
}

// search · pure-ish · pren array de nodes + query · retorna top matches.
// Score · title match (10) · keywords match (5) · type match (2).
export function searchNodes(nodes, query, { limit = 30 } = {}) {
    if (!query || typeof query !== 'string') return [];
    const q = query.toLowerCase().trim();
    if (q.length < 1) return [];
    const matches = [];
    for (const n of (nodes || [])) {
        if (!n) continue;
        const title = _titleForNode(n).toLowerCase();
        const keywords = (n.keywords || []).join(' ').toLowerCase();
        const desc = (n.content?.description || '').toLowerCase();
        let score = 0;
        if (title.includes(q)) score += 10;
        if (title.startsWith(q)) score += 5;     // exact prefix bonus
        if (keywords.includes(q)) score += 5;
        if (desc.includes(q)) score += 3;
        if ((n.type || '').toLowerCase().includes(q)) score += 2;
        if (score > 0) {
            matches.push({ node: n, score, title: _titleForNode(n) });
        }
    }
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, limit);
}

function _esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let _isOpen = false;
let _allNodes = [];
let _activeIdx = 0;
let _currentResults = [];
let _visitCounts = {};         // map route → visit count (last 90d via neural_path_step)

async function _loadAllNodes() {
    try {
        const { KB } = await import('./kb.js');
        const TYPES_TO_SEARCH = [
            'project', 'work_order', 'note', 'insight', 'skill_log',
            'matriu_member', 'attestation', 'pact', 'invoice', 'proposal',
            'sop', 'soc', 'workshop', 'market_item', 'organization',
            'public_registry_entry', 'role', 'process', 'learn_role',
            // Step nodes per al ranking d'habituals
            'neural_path_step',
        ];
        const results = await Promise.all(TYPES_TO_SEARCH.map(t => KB.query({ type: t }).catch(() => [])));
        const flat = results.flat();
        // Split · neural_path_step → visitCounts · resta → search nodes
        _visitCounts = {};
        _allNodes = [];
        for (const n of flat) {
            if (n.type === 'neural_path_step' && n.content?.kind === 'visit') {
                // Normalitza route · treu query strings · pathname pur
                const route = String(n.content.route || '').split('?')[0] || '/';
                _visitCounts[route] = (_visitCounts[route] || 0) + 1;
            } else {
                _allNodes.push(n);
            }
        }
    } catch (e) {
        _allNodes = [];
        _visitCounts = {};
    }
}

// _sortLinksByHabits · pure · ordena per visit count desc · pinned items
// (sense visites) van al final · ordre original com a fallback
function _sortLinksByHabits(links, counts = _visitCounts) {
    const enriched = links.map((l, originalIdx) => ({
        ...l,
        visits: counts[l.href] || 0,
        originalIdx,
    }));
    enriched.sort((a, b) => {
        if (b.visits !== a.visits) return b.visits - a.visits;
        return a.originalIdx - b.originalIdx;  // estable tie-break
    });
    return enriched;
}

// Exposed per a tests
export function sortLinksByHabits(links, counts) {
    return _sortLinksByHabits(links, counts);
}

function _renderPanel({ query = '' } = {}) {
    const showQuick = !query || query.trim().length === 0 || query.trim() === '/';
    const results = showQuick ? [] : searchNodes(_allNodes, query, { limit: 30 });
    if (showQuick) {
        // Ordena per habituals (visit count) · primer els més visitats
        const sortedLinks = _sortLinksByHabits(QUICK_LINKS);
        _currentResults = sortedLinks.map(q => ({
            icon: q.icon,
            title: q.title,
            type: q.type,
            href: q.href,
            visits: q.visits,
            _isQuick: true,
        }));
    } else {
        _currentResults = results.map(r => ({
            icon: _iconForType(r.node.type),
            title: r.title || r.node.id,
            type: r.node.type,
            href: _hrefForNode(r.node),
            _node: r.node,
        }));
    }
    _activeIdx = 0;

    // Pista per a empty state · explica el "/" hint
    const _renderQuickItem = (r, i) => {
        const badge = r.visits > 0
            ? `<span class="sos-search-visits" title="Vistes a la teva sessió · ${r.visits} cops">${r.visits}×</span>`
            : '';
        return `
            <a href="${_esc(r.href)}" data-link data-idx="${i}" class="sos-search-item ${i === 0 ? 'active' : ''}" role="option" aria-selected="${i === 0 ? 'true' : 'false'}">
                <span class="ic" aria-hidden="true">${r.icon}</span>
                <span class="ttl">${_esc(r.title)}</span>
                ${badge}
                <span class="type">${_esc(r.type)}</span>
            </a>`;
    };
    const _renderNodeItem = (r, i) => `
            <a href="${_esc(r.href)}" data-link data-idx="${i}" class="sos-search-item ${i === 0 ? 'active' : ''}" role="option" aria-selected="${i === 0 ? 'true' : 'false'}">
                <span class="ic" aria-hidden="true">${r.icon}</span>
                <span class="ttl">${_esc(r.title)}</span>
                <span class="type">${_esc(r.type)}</span>
            </a>`;

    const itemsHtml = _currentResults.length === 0 && !showQuick
        ? `<div class="sos-search-empty">Cap resultat per a "${_esc(query)}" · prova un altre terme · escriu menys lletres</div>`
        : (showQuick
            ? `<div class="sos-search-section">Vistes habituals · ordenades pel teu ús · escriu per cercar nodes</div>` + _currentResults.map(_renderQuickItem).join('')
            : `<div class="sos-search-section">${_currentResults.length} resultats</div>` + _currentResults.map(_renderNodeItem).join(''));

    return `
    <div class="sos-search-bg active" id="${SEARCH_ID}" role="dialog" aria-modal="true" aria-labelledby="sosSearchLabel">
        <div class="sos-search-panel">
            <div class="sos-search-input-wrap">
                <span class="sos-search-icon" aria-hidden="true">🔍</span>
                <input id="sosSearchInput" class="sos-search-input"
                    type="search"
                    placeholder="Cerca projectes · WOs · notes · idees · skills · gent..."
                    aria-label="Cerca global · escriu per filtrar"
                    autocomplete="off"
                    spellcheck="false"
                    value="${_esc(query)}">
                <span class="sos-search-esc">Esc</span>
            </div>
            <div class="sos-search-results" role="listbox" aria-label="Resultats de la cerca">
                ${itemsHtml}
            </div>
            <div class="sos-search-foot">
                <span><kbd>↑↓</kbd> navega</span>
                <span><kbd>Enter</kbd> obre</span>
                <span><kbd>Esc</kbd> tanca</span>
                <span style="margin-left:auto;">${_allNodes.length} nodes al KB</span>
            </div>
        </div>
    </div>`;
}

function _close() {
    if (typeof document === 'undefined' || !_isOpen) return;
    const el = document.getElementById(SEARCH_ID);
    if (el) el.remove();
    _isOpen = false;
}

async function _open() {
    if (typeof document === 'undefined' || _isOpen) return;
    _isOpen = true;
    _ensureCss();
    await _loadAllNodes();
    const wrap = document.createElement('div');
    wrap.innerHTML = _renderPanel({ query: '' });
    document.body.appendChild(wrap.firstElementChild);

    const input = document.getElementById('sosSearchInput');
    if (input) {
        setTimeout(() => input.focus(), 50);
        input.addEventListener('input', () => {
            _rerenderResults(input.value);
        });
        input.addEventListener('keydown', _handleKeyNav);
    }
    // Backdrop click closes
    document.getElementById(SEARCH_ID)?.addEventListener('click', (e) => {
        if (e.target.id === SEARCH_ID) _close();
    });
    // Item clicks close
    _bindResultClicks();
}

function _rerenderResults(query) {
    const container = document.querySelector('.sos-search-results');
    if (!container) return;
    const showQuick = !query || query.trim().length === 0 || query.trim() === '/';
    if (showQuick) {
        const sortedLinks = _sortLinksByHabits(QUICK_LINKS);
        _currentResults = sortedLinks.map(q => ({
            icon: q.icon, title: q.title, type: q.type, href: q.href, visits: q.visits, _isQuick: true,
        }));
    } else {
        const results = searchNodes(_allNodes, query, { limit: 30 });
        _currentResults = results.map(r => ({
            icon: _iconForType(r.node.type),
            title: r.title || r.node.id,
            type: r.node.type,
            href: _hrefForNode(r.node),
        }));
    }
    _activeIdx = 0;
    if (_currentResults.length === 0 && !showQuick) {
        container.innerHTML = `<div class="sos-search-empty">Cap resultat per a "${_esc(query)}" · prova un altre terme</div>`;
        return;
    }
    const renderItem = (r, i) => {
        const visitBadge = (r._isQuick && r.visits > 0)
            ? `<span class="sos-search-visits" title="Vistes ${r.visits} cops">${r.visits}×</span>` : '';
        return `
            <a href="${_esc(r.href)}" data-link data-idx="${i}" class="sos-search-item ${i === 0 ? 'active' : ''}" role="option" aria-selected="${i === 0 ? 'true' : 'false'}">
                <span class="ic" aria-hidden="true">${r.icon}</span>
                <span class="ttl">${_esc(r.title)}</span>
                ${visitBadge}
                <span class="type">${_esc(r.type)}</span>
            </a>`;
    };
    container.innerHTML = (showQuick
        ? '<div class="sos-search-section">Vistes habituals · ordenades pel teu ús</div>'
        : '<div class="sos-search-section">' + _currentResults.length + ' resultats</div>'
    ) + _currentResults.map(renderItem).join('');
    _bindResultClicks();
}

function _bindResultClicks() {
    document.querySelectorAll('.sos-search-item').forEach(item => {
        item.addEventListener('click', () => _close());
    });
}

function _handleKeyNav(e) {
    if (e.key === 'Escape') {
        e.preventDefault();
        _close();
        return;
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        _setActive(_activeIdx + 1);
        return;
    }
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        _setActive(_activeIdx - 1);
        return;
    }
    if (e.key === 'Enter') {
        e.preventDefault();
        const active = document.querySelector('.sos-search-item.active');
        if (active) active.click();
    }
}

function _setActive(idx) {
    if (_currentResults.length === 0) return;
    if (idx < 0) idx = _currentResults.length - 1;
    if (idx >= _currentResults.length) idx = 0;
    _activeIdx = idx;
    document.querySelectorAll('.sos-search-item').forEach((it, i) => {
        if (i === idx) {
            it.classList.add('active');
            it.setAttribute('aria-selected', 'true');
            it.scrollIntoView({ block: 'nearest' });
        } else {
            it.classList.remove('active');
            it.setAttribute('aria-selected', 'false');
        }
    });
}

// Public API · open / close
export function open()  { return _open(); }
export function close() { _close(); }

// injectGlobal · injecta keyboard listeners + CSS · cridat pel router
// v125 · el trigger ja viu integrat dins la navbar (renderGlobalNavHtml ·
// .sos-global-nav-search) · ja NO injectem el floating button position:fixed
// que xocava amb la navbar. Si cap a un altre lloc cal trigger flotant,
// reactivem aquest bloc · per ara · removed.
export function injectGlobal() {
    if (typeof document === 'undefined') return;
    _ensureCss();
    // v125 · trigger floating removed · viu a navbar pill (#sos-global-nav-search-btn)
    // Defensiu · si quedés algun trigger antic al DOM · neteja
    document.getElementById(TRIGGER_ID)?.remove();
    // Keyboard listener · cmd-K / ctrl-K / "/"
    if (!window.__sosSearchKeyBound) {
        window.__sosSearchKeyBound = true;
        document.addEventListener('keydown', (e) => {
            // cmd/ctrl + K
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                _isOpen ? _close() : _open();
                return;
            }
            // "/" en context lliure
            if (e.key === '/' && !_isOpen) {
                const tag = (document.activeElement?.tagName || '').toLowerCase();
                if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
                e.preventDefault();
                _open();
            }
        });
    }
}

export function destroy() {
    _close();
    if (typeof document === 'undefined') return;
    document.getElementById(TRIGGER_ID)?.remove();
    document.getElementById(CSS_ID)?.remove();
}

export { SEARCH_ID, TRIGGER_ID, QUICK_LINKS };
