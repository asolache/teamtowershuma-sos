// =============================================================================
// TEAMTOWERS SOS V11 — QUICK CAPTURE FAB (UX-BRAIN-001 · cervell personal)
// Ruta · /js/core/quickCaptureFab.js
//
// Floating Action Button (FAB) global · injectat pel router · permet capturar
// instantàniament ·
//   📝 Nota ràpida (KB type:'note')
//   📋 WO al projecte actiu (KB type:'work_order')
//   💡 Idea / Insight (KB type:'insight')
//   🎯 Skill aprehesa (KB type:'skill_log')
//
// Mobile-first · botó floating + modal · per al "brain extension" del usuari.
// Aria-labels + focus management · W3C accessible.
// =============================================================================

const FAB_ID  = 'sos-quick-fab';
const CSS_ID  = 'sos-quick-fab-css';
const MODAL_ID = 'sos-quick-modal';

function _ensureCss() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(CSS_ID)) return;
    const style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = `
        .sos-quick-fab {
            position: fixed;
            right: 16px; bottom: 80px;  /* sobre el mobile-bottom-nav */
            width: 56px; height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg,#a855f7,#6366f1);
            color: #fff; border: 0;
            font-size: 1.8rem; line-height: 1;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(99,102,241,0.45);
            z-index: 900;
            transition: transform 150ms, box-shadow 150ms;
            display: flex; align-items: center; justify-content: center;
        }
        .sos-quick-fab:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(99,102,241,0.55); }
        .sos-quick-fab:focus-visible { outline: 3px solid var(--accent-indigo); outline-offset: 3px; }
        .sos-quick-fab:active { transform: scale(0.95); }

        @media (min-width: 769px) {
            .sos-quick-fab { bottom: 24px; right: 24px; }
        }

        /* Modal */
        .sos-quick-modal-bg {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.7);
            z-index: 1500;
            display: flex; align-items: flex-end; justify-content: center;
            padding: 16px;
            animation: sos-quick-fade 150ms ease-out;
        }
        @keyframes sos-quick-fade { from { opacity: 0; } to { opacity: 1; } }
        @media (min-width: 769px) {
            .sos-quick-modal-bg { align-items: center; }
        }
        .sos-quick-modal {
            background: var(--bg-panel, #0f172a);
            color: var(--text-main, #e2e8f0);
            border: 1px solid var(--border-default, #1e293b);
            border-radius: 12px;
            padding: 1.2rem 1.4rem;
            max-width: 520px; width: 100%;
            font-family: var(--font-base, system-ui, sans-serif);
            animation: sos-quick-slide 200ms ease-out;
            max-height: 90vh; overflow-y: auto;
        }
        @keyframes sos-quick-slide { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .sos-quick-modal h2 { margin: 0 0 0.7rem 0; font-size: 1.1rem; }
        .sos-quick-modal p { margin: 0 0 0.8rem 0; font-size: 0.82rem; color: var(--text-secondary, #94a3b8); line-height: 1.5; }

        .sos-quick-tabs { display: flex; gap: 4px; margin-bottom: 0.8rem; flex-wrap: wrap; }
        .sos-quick-tab { padding: 8px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; background: var(--bg-dark, #0a0e1a); color: var(--text-secondary, #94a3b8); border: 1px solid var(--border-default, #1e293b); cursor: pointer; }
        .sos-quick-tab:hover { color: var(--text-main, #e2e8f0); }
        .sos-quick-tab.active { background: rgba(99,102,241,0.18); color: #a8b2ff; border-color: rgba(99,102,241,0.4); }

        .sos-quick-input, .sos-quick-textarea {
            width: 100%; box-sizing: border-box;
            padding: 9px 12px;
            background: var(--bg-dark, #0a0e1a);
            color: var(--text-main, #e2e8f0);
            border: 1px solid var(--border-default, #1e293b);
            border-radius: 6px;
            font-family: var(--font-base, system-ui, sans-serif);
            font-size: 0.9rem;
            margin-bottom: 0.7rem;
        }
        .sos-quick-textarea { min-height: 90px; resize: vertical; }
        .sos-quick-input:focus, .sos-quick-textarea:focus {
            outline: 2px solid var(--accent-indigo, #6366f1); outline-offset: 1px;
        }

        .sos-quick-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
        .sos-quick-btn {
            padding: 9px 16px; border-radius: 6px;
            font-size: 0.85rem; font-weight: 700; cursor: pointer;
            border: 1px solid var(--border-default, #1e293b);
            background: var(--bg-panel, #0f172a);
            color: var(--text-main, #e2e8f0);
        }
        .sos-quick-btn:hover { background: var(--glass-hover, rgba(255,255,255,0.05)); }
        .sos-quick-btn-primary {
            background: linear-gradient(135deg,#a855f7,#6366f1);
            color: #fff; border-color: transparent;
        }
        .sos-quick-btn-primary:hover { filter: brightness(1.10); }

        .sos-quick-hint { font-size: 0.7rem; color: var(--text-secondary, #94a3b8); margin-top: 4px; }
    `;
    document.head.appendChild(style);
}

const TABS = [
    { id: 'note',    icon: '📝', label: 'Nota',   placeholder: 'Quina nota vols recordar?',           type: 'note',         help: 'Es desa al KB com a node type:note · cercable a /n/{id}' },
    { id: 'wo',      icon: '📋', label: 'WO',     placeholder: 'Què cal fer?',                          type: 'work_order',   help: 'Es crea WO al backlog del projecte actiu (si n\'hi ha)' },
    { id: 'insight', icon: '💡', label: 'Idea',   placeholder: 'Quina idea o insight?',                 type: 'insight',      help: 'Es desa com a insight · vinculat al teu cervell · timeline' },
    { id: 'skill',   icon: '🎯', label: 'Skill',  placeholder: 'Què has après o practicat avui?',       type: 'skill_log',    help: 'Log d\'aprenentatge · "learn by doing"' },
];

function _esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// _renderModalHtml · pure HTML
function _renderModalHtml({ activeTab = 'note', currentProjectId = null } = {}) {
    const tab = TABS.find(t => t.id === activeTab) || TABS[0];
    return `
    <div class="sos-quick-modal-bg" id="${MODAL_ID}" role="dialog" aria-modal="true" aria-labelledby="sosQuickTitle">
        <div class="sos-quick-modal">
            <h2 id="sosQuickTitle">⚡ Captura ràpida · cervell SOS</h2>
            <p>Captura aquí qualsevol pensament · WO · idea · skill. Se desa al teu KB local-first ${currentProjectId ? '· projecte ' + _esc(currentProjectId.slice(0, 24)) : ''}.</p>

            <div class="sos-quick-tabs" role="tablist">
                ${TABS.map(t => `<button class="sos-quick-tab ${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}" role="tab" aria-selected="${t.id === activeTab}">${t.icon} ${t.label}</button>`).join('')}
            </div>

            <label for="sosQuickInput" class="sr-only">Contingut</label>
            <textarea id="sosQuickInput" class="sos-quick-textarea" placeholder="${_esc(tab.placeholder)}" autofocus></textarea>
            <div class="sos-quick-hint">${_esc(tab.help)}</div>

            <div class="sos-quick-actions" style="margin-top:0.7rem;">
                <button class="sos-quick-btn" id="sosQuickCancel">Cancel</button>
                <button class="sos-quick-btn sos-quick-btn-primary" id="sosQuickSave">💾 Save · ${_esc(tab.label)}</button>
            </div>
        </div>
    </div>`;
}

// _getCurrentProjectId · best-effort · llegeix ?project= o /project/{id}
function _getCurrentProjectId() {
    if (typeof window === 'undefined' || !window.location) return null;
    try {
        const url = new URL(window.location.href);
        const fromParam = url.searchParams.get('project');
        if (fromParam) return fromParam;
        const m = url.pathname.match(/^\/(project|hub|project-classic)\/([^\/?]+)/);
        if (m) return m[2];
    } catch (_) {}
    return null;
}

let _isOpen = false;
let _activeTab = 'note';

function _openModal() {
    if (typeof document === 'undefined') return;
    if (_isOpen) return;
    _isOpen = true;
    const projectId = _getCurrentProjectId();
    const wrap = document.createElement('div');
    wrap.innerHTML = _renderModalHtml({ activeTab: _activeTab, currentProjectId: projectId });
    const modal = wrap.firstElementChild;
    document.body.appendChild(modal);

    // Focus textarea
    setTimeout(() => document.getElementById('sosQuickInput')?.focus(), 50);

    // Bind tabs
    modal.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            _activeTab = btn.dataset.tab;
            _closeModal();
            _openModal();
        });
    });

    // Backdrop click cancels
    modal.addEventListener('click', (e) => {
        if (e.target === modal) _closeModal();
    });

    // Escape closes
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            _closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    // Cancel
    modal.querySelector('#sosQuickCancel')?.addEventListener('click', () => _closeModal());

    // Save
    modal.querySelector('#sosQuickSave')?.addEventListener('click', () => _save({ projectId }));
}

function _closeModal() {
    if (typeof document === 'undefined') return;
    document.getElementById(MODAL_ID)?.remove();
    _isOpen = false;
}

async function _save({ projectId }) {
    const input = document.getElementById('sosQuickInput');
    const text = (input?.value || '').trim();
    if (!text) {
        const { toast } = await import('./uxComponents.js');
        toast({ kind: 'warn', text: 'Escriu alguna cosa abans de desar' });
        input?.focus();
        return;
    }
    const tab = TABS.find(t => t.id === _activeTab) || TABS[0];
    const now = Date.now();
    const node = {
        id: tab.type + '-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 7),
        type: tab.type,
        content: {
            text,
            projectId: projectId || null,
            kind: tab.id,
            ...(tab.type === 'work_order' ? {
                title: text.slice(0, 80),
                description: text,
                status: 'backlog',
                priority: 'medium',
                source: 'quick-capture',
            } : {}),
        },
        keywords: ['type:' + tab.type, 'source:quick-capture', tab.id, projectId ? 'project:' + projectId : 'global'],
        createdAt: now,
        updatedAt: now,
    };
    try {
        const { KB } = await import('./kb.js');
        await KB.upsert(node);
        const { toast } = await import('./uxComponents.js');
        toast({
            kind: 'success',
            text: '✓ ' + tab.icon + ' ' + tab.label + ' desat al KB',
            ttl: 3500,
        });
        // Live region announce
        try {
            const { announce } = await import('./a11yService.js');
            announce('Capturat ' + tab.label + ' · ' + text.slice(0, 60));
        } catch (_) {}
        _closeModal();
    } catch (e) {
        const { toast } = await import('./uxComponents.js');
        toast({ kind: 'error', text: 'Error: ' + (e?.message || e) });
    }
}

// _ensureFab · idempotent · injecta botó floating
function _ensureFab() {
    if (typeof document === 'undefined') return;
    _ensureCss();
    if (document.getElementById(FAB_ID)) return;
    const btn = document.createElement('button');
    btn.id = FAB_ID;
    btn.className = 'sos-quick-fab';
    btn.setAttribute('aria-label', 'Captura ràpida · obre modal · noia / WO / idea / skill');
    btn.setAttribute('title', 'Captura ràpida (cervell SOS)');
    btn.innerHTML = '<span aria-hidden="true">+</span>';
    btn.addEventListener('click', () => _openModal());
    // Keyboard shortcut · "c" sense focus textarea
    document.addEventListener('keydown', (e) => {
        if (e.key === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const tag = (document.activeElement?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
            if (!_isOpen) {
                e.preventDefault();
                _openModal();
            }
        }
    });
    document.body.appendChild(btn);
}

// injectGlobalFab · public · injectat pel router
export function injectGlobalFab() {
    _ensureFab();
}

// destroy · cleanup · per a tests
export function destroyGlobalFab() {
    if (typeof document === 'undefined') return;
    document.getElementById(FAB_ID)?.remove();
    document.getElementById(MODAL_ID)?.remove();
    document.getElementById(CSS_ID)?.remove();
    _isOpen = false;
}

// Exports per a tests
export { FAB_ID, MODAL_ID, TABS, _renderModalHtml as renderModalHtml };
