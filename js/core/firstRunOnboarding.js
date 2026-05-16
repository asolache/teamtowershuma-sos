// =============================================================================
// TEAMTOWERS SOS V11 — FIRST RUN ONBOARDING (UX-LEGENDARY · welcome)
// Ruta · /js/core/firstRunOnboarding.js
//
// Welcome modal · es mostra la PRIMERA vegada que un usuari obre SOS · explica
// el concept "cervell extés cooperatiu" en 4 slides KISS. Mai més (localStorage
// flag sos_onboarding_seen_v1). Skippable amb "✕" o tecla Escape.
//
// Mobile-first · bottom-sheet on mobile · centered card on desktop. W3C
// accessible · focus management · keyboard nav.
// =============================================================================

const LS_KEY = 'sos_onboarding_seen_v1';
const MODAL_ID = 'sos-onboarding';
const CSS_ID   = 'sos-onboarding-css';

const SLIDES = Object.freeze([
    {
        icon: '🧠',
        title: 'SOS és el teu cervell cooperatiu',
        body: 'Un sistema operatiu local-first descentralitzat per gestionar valor en totes les dimensions · projectes · skills · network · processos · IA assistida.',
        accent: '#a855f7',
    },
    {
        icon: '➕',
        title: 'Captura ràpida · tecla "c"',
        body: 'Prem el botó "+" al fons-dreta o la tecla "c" des de qualsevol vista. Captura notes · WOs · idees · skills al teu KB local-first instantàniament.',
        accent: '#6366f1',
    },
    {
        icon: '🚀',
        title: 'Crea projectes amb IA',
        body: 'Ves a Crear · descriu el teu projecte breument · l\'IA classifica · genera canvas + VNA + SOPs adaptats al tipus i fase. Tu valides el text final.',
        accent: '#22c55e',
    },
    {
        icon: '🔍',
        title: 'Tot a un click · cmd+K o "/"',
        body: 'Cerca global · troba qualsevol cosa al teu KB · projectes · gent · WOs · idees. Drawer top-right "⋯" per al menú complet. 5 destins primaris sempre visibles al fons.',
        accent: '#facc15',
    },
]);

function _ensureCss() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(CSS_ID)) return;
    const style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = `
        .sos-onb-bg {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.78);
            backdrop-filter: blur(4px);
            z-index: 2500;
            display: flex; align-items: center; justify-content: center;
            padding: 16px;
            animation: sos-onb-fade 250ms ease-out;
            font-family: var(--font-base, system-ui, sans-serif);
        }
        @keyframes sos-onb-fade { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 768px) {
            .sos-onb-bg { align-items: flex-end; padding: 0; }
        }

        .sos-onb {
            background: var(--bg-panel, #0f172a);
            color: var(--text-main, #e2e8f0);
            border: 1px solid var(--border-default, #1e293b);
            border-radius: 16px;
            max-width: 480px; width: 100%;
            padding: 2rem 2rem 1.5rem 2rem;
            position: relative;
            box-shadow: 0 24px 80px rgba(0,0,0,0.55);
            animation: sos-onb-slide 350ms cubic-bezier(0.2, 0.9, 0.3, 1);
        }
        @keyframes sos-onb-slide { from { transform: translateY(40px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @media (max-width: 768px) {
            .sos-onb {
                border-radius: 20px 20px 0 0;
                padding: 1.4rem 1.4rem 1rem 1.4rem;
                max-height: 90vh; overflow-y: auto;
                animation: sos-onb-slide-up 350ms cubic-bezier(0.2, 0.9, 0.3, 1);
            }
            @keyframes sos-onb-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        }

        .sos-onb-skip {
            position: absolute; top: 12px; right: 12px;
            background: transparent; border: 0;
            color: var(--text-secondary, #94a3b8);
            font-size: 1.3rem; cursor: pointer;
            padding: 6px 10px; border-radius: 6px;
            min-width: 36px; min-height: 36px;
        }
        .sos-onb-skip:hover, .sos-onb-skip:focus-visible {
            background: rgba(255,255,255,0.06);
            color: var(--text-main, #e2e8f0);
            outline: 2px solid var(--accent-indigo, #6366f1);
            outline-offset: 1px;
        }

        .sos-onb-icon {
            font-size: 3.5rem; line-height: 1;
            text-align: center; margin-bottom: 1.2rem;
            display: block;
        }
        .sos-onb-title {
            margin: 0 0 0.6rem 0;
            font-size: 1.4rem;
            font-weight: 800;
            letter-spacing: -0.01em;
            text-align: center;
            line-height: 1.25;
        }
        @media (max-width: 768px) { .sos-onb-title { font-size: 1.2rem; } }
        .sos-onb-body {
            margin: 0 0 1.6rem 0;
            color: var(--text-secondary, #94a3b8);
            font-size: 0.95rem;
            line-height: 1.55;
            text-align: center;
        }

        .sos-onb-dots {
            display: flex; gap: 6px; justify-content: center;
            margin-bottom: 1.2rem;
        }
        .sos-onb-dot {
            width: 8px; height: 8px;
            border-radius: 50%;
            background: rgba(148,163,184,0.3);
            transition: background 200ms, transform 200ms;
        }
        .sos-onb-dot.active {
            background: #a8b2ff;
            transform: scale(1.3);
        }

        .sos-onb-actions { display: flex; gap: 10px; justify-content: space-between; align-items: center; }
        .sos-onb-back {
            padding: 9px 14px; border-radius: 6px;
            background: transparent;
            border: 1px solid var(--border-default, #1e293b);
            color: var(--text-secondary, #94a3b8);
            cursor: pointer; font-size: 0.85rem; font-weight: 600;
            min-height: 40px;
        }
        .sos-onb-back:hover, .sos-onb-back:focus-visible { background: var(--glass-hover, rgba(255,255,255,0.06)); color: var(--text-main, #e2e8f0); }
        .sos-onb-back:disabled { opacity: 0.4; cursor: default; }
        .sos-onb-next {
            padding: 10px 20px; border-radius: 6px;
            background: linear-gradient(135deg,#a855f7,#6366f1);
            color: #fff; border: 0;
            cursor: pointer; font-size: 0.9rem; font-weight: 700;
            min-height: 40px;
            flex: 1;
        }
        .sos-onb-next:hover, .sos-onb-next:focus-visible {
            filter: brightness(1.1);
            outline: 2px solid #fff;
            outline-offset: 2px;
        }
    `;
    document.head.appendChild(style);
}

let _slideIdx = 0;
let _isOpen = false;
let _escHandler = null;

function _esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _render() {
    const slide = SLIDES[_slideIdx];
    const isLast = _slideIdx === SLIDES.length - 1;
    return `
    <div class="sos-onb-bg" id="${MODAL_ID}" role="dialog" aria-modal="true" aria-labelledby="sosOnbTitle">
        <div class="sos-onb">
            <button class="sos-onb-skip" aria-label="Saltar onboarding" type="button" data-action="skip">✕</button>
            <div class="sos-onb-icon" aria-hidden="true">${slide.icon}</div>
            <h2 class="sos-onb-title" id="sosOnbTitle">${_esc(slide.title)}</h2>
            <p class="sos-onb-body">${_esc(slide.body)}</p>
            <div class="sos-onb-dots" role="tablist" aria-label="Progrés tour">
                ${SLIDES.map((s, i) => `<span class="sos-onb-dot ${i === _slideIdx ? 'active' : ''}" role="tab" aria-selected="${i === _slideIdx ? 'true' : 'false'}" aria-label="Slide ${i + 1}"></span>`).join('')}
            </div>
            <div class="sos-onb-actions">
                <button class="sos-onb-back" ${_slideIdx === 0 ? 'disabled' : ''} data-action="back" type="button">← Enrere</button>
                <button class="sos-onb-next" data-action="${isLast ? 'finish' : 'next'}" type="button">${isLast ? '🚀 Comença a SOS' : 'Següent →'}</button>
            </div>
        </div>
    </div>`;
}

function _close({ markSeen = true } = {}) {
    if (typeof document === 'undefined' || !_isOpen) return;
    document.getElementById(MODAL_ID)?.remove();
    _isOpen = false;
    if (markSeen) {
        try { localStorage.setItem(LS_KEY, '1'); } catch (_) {}
    }
    if (_escHandler) {
        document.removeEventListener('keydown', _escHandler);
        _escHandler = null;
    }
}

function _rerender() {
    const existing = document.getElementById(MODAL_ID);
    if (existing) existing.outerHTML = _render();
    _bind();
}

function _next() {
    if (_slideIdx < SLIDES.length - 1) {
        _slideIdx++;
        _rerender();
    }
}

function _back() {
    if (_slideIdx > 0) {
        _slideIdx--;
        _rerender();
    }
}

function _bind() {
    const modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    modal.querySelector('[data-action="skip"]')?.addEventListener('click', () => _close());
    modal.querySelector('[data-action="back"]')?.addEventListener('click', () => _back());
    modal.querySelector('[data-action="next"]')?.addEventListener('click', () => _next());
    modal.querySelector('[data-action="finish"]')?.addEventListener('click', () => _close());
    modal.addEventListener('click', (e) => { if (e.target === modal) _close(); });
}

// open · força mostrar onboarding (ignora flag · útil per a /design link)
export function open() {
    if (typeof document === 'undefined' || _isOpen) return;
    _ensureCss();
    _isOpen = true;
    _slideIdx = 0;
    const wrap = document.createElement('div');
    wrap.innerHTML = _render();
    document.body.appendChild(wrap.firstElementChild);
    _bind();
    setTimeout(() => document.querySelector('.sos-onb-next')?.focus(), 100);
    // Escape · keyboard
    _escHandler = (e) => {
        if (e.key === 'Escape') { _close(); }
        if (e.key === 'ArrowRight') { _next(); }
        if (e.key === 'ArrowLeft')  { _back(); }
    };
    document.addEventListener('keydown', _escHandler);
}

// hasSeenOnboarding · pure check
export function hasSeenOnboarding() {
    if (typeof localStorage === 'undefined') return false;
    try { return localStorage.getItem(LS_KEY) === '1'; } catch (_) { return false; }
}

// resetOnboarding · per a debugging / "veure tour de nou" via /design
export function resetOnboarding() {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.removeItem(LS_KEY); } catch (_) {}
}

// maybeShow · auto · cridat pel router · mostra només si NO seen
export function maybeShow() {
    if (typeof document === 'undefined') return;
    if (hasSeenOnboarding()) return;
    if (_isOpen) return;
    // Defer · espera DOM ready + altres injects
    setTimeout(() => open(), 800);
}

export { SLIDES, MODAL_ID, LS_KEY };
