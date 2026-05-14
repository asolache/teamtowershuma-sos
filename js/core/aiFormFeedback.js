// =============================================================================
// TEAMTOWERS SOS V11 — AI FORM FEEDBACK (DESIGN-SYSTEM sprint A)
// Ruta · /js/core/aiFormFeedback.js
//
// KISS · widget reutilitzable per a forms · DRY · evita re-implementar la
// lògica de feedback IA a cada view. Combina aiActivityFeedback (formatter)
// + sosCopy (microcopy human-readable) en un sol mount-point.
//
// API ·
//   attachAIFormFeedback(containerEl, options) → controller {
//     setThinking(event?), addEvent(event), setError(msg), setOk(msg),
//     clear(), destroy()
//   }
//
// El controller exposa mètodes simples per actualitzar l'estat del feedback
// sense que la view hagi de tocar DOM manualment.
//
// USAGE ·
//   const fb = attachAIFormFeedback(document.getElementById('myFormFeedback'));
//   fb.setThinking({ kind: 'runner-start', sopTitle: 'Setup' });
//   const result = await runAI({ prompt, onActivity: (e) => fb.addEvent(e) });
//   fb.setOk('Generat correctament');
// =============================================================================

import {
    formatActivityEvent, renderActivityEntryHtml, THINKING_PULSE_CSS,
} from './aiActivityFeedback.js';
import { label } from './sosCopy.js';

// Make sure CSS keyframes are injected only once per page
let _cssInjected = false;
function _ensureCss() {
    if (_cssInjected) return;
    try {
        const style = document.createElement('style');
        style.setAttribute('data-ai-form-feedback', '1');
        style.textContent = THINKING_PULSE_CSS + `
            .aff-shell { display:flex; flex-direction:column; gap:6px; }
            .aff-thinking { padding:8px 12px; border-radius:6px; background:linear-gradient(135deg,rgba(168,85,247,0.18),rgba(99,102,241,0.10)); border:1px solid rgba(168,85,247,0.35); display:none; }
            .aff-thinking.active { display:block; }
            .aff-log { display:flex; flex-direction:column; gap:4px; max-height:240px; overflow-y:auto; }
            .aff-log:empty { display:none; }
            .aff-message { padding:6px 10px; border-radius:4px; font-size:0.82rem; font-weight:600; border-left:3px solid; }
            .aff-message.ok { background:rgba(34,197,94,0.12); color:#22c55e; border-left-color:#22c55e; }
            .aff-message.err { background:rgba(239,68,68,0.12); color:#ef4444; border-left-color:#ef4444; }
            .aff-message.warn { background:rgba(250,204,21,0.12); color:#facc15; border-left-color:#facc15; }
        `;
        document.head.appendChild(style);
        _cssInjected = true;
    } catch (_) { /* no DOM · ignore */ }
}

// attachAIFormFeedback · pure-ish · retorna controller. NO toca KB · NO
// fa fetch · sols gestiona DOM dins el container.
//
// args ·
//   container · HTMLElement on muntar el widget
//   options · { showLog: true, autoFadeOk: 3000 (ms · 0=no fade) }
//
// Retorna · controller amb mètodes setThinking/addEvent/setError/setOk/clear/destroy
export function attachAIFormFeedback(container, options = {}) {
    if (!container || typeof container.innerHTML !== 'string') {
        return _noopController();
    }
    _ensureCss();

    const opts = {
        showLog:    options.showLog !== false,
        autoFadeOk: typeof options.autoFadeOk === 'number' ? options.autoFadeOk : 3000,
    };

    // Mount skeleton
    container.innerHTML = `
        <div class="aff-shell">
            <div class="aff-thinking" data-aff-thinking></div>
            <div class="aff-message" data-aff-message style="display:none;"></div>
            ${opts.showLog ? '<div class="aff-log" data-aff-log></div>' : ''}
        </div>
    `;

    const thinkingEl = container.querySelector('[data-aff-thinking]');
    const messageEl  = container.querySelector('[data-aff-message]');
    const logEl      = container.querySelector('[data-aff-log]');
    let fadeTimer    = null;

    const clearFade = () => { if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = null; } };

    const setMessage = (text, kind) => {
        if (!messageEl) return;
        messageEl.textContent = text;
        messageEl.className = 'aff-message ' + (kind || 'ok');
        messageEl.style.display = text ? 'block' : 'none';
    };

    const controller = {
        setThinking(event) {
            if (!thinkingEl) return;
            if (!event) { thinkingEl.classList.remove('active'); thinkingEl.innerHTML = ''; return; }
            const entry = formatActivityEvent(event);
            // Si l'event no és thinking, no muntem el box top · sols al log
            if (entry.level !== 'thinking') return;
            thinkingEl.innerHTML = renderActivityEntryHtml(entry);
            thinkingEl.classList.add('active');
        },
        addEvent(event) {
            const entry = formatActivityEvent(event);
            if (entry.level === 'thinking') {
                // També actualitzem el thinking box
                this.setThinking(event);
                return;
            }
            // Si abans estava pensant · neteja
            if (thinkingEl) { thinkingEl.classList.remove('active'); thinkingEl.innerHTML = ''; }
            if (logEl) {
                const wrap = document.createElement('div');
                wrap.innerHTML = renderActivityEntryHtml(entry);
                const node = wrap.firstElementChild;
                if (node) {
                    logEl.appendChild(node);
                    logEl.scrollTop = logEl.scrollHeight;
                }
            }
        },
        setError(msg) {
            clearFade();
            this.setThinking(null);
            setMessage('✗ ' + (msg || label('state.error')), 'err');
        },
        setOk(msg) {
            clearFade();
            this.setThinking(null);
            setMessage('✓ ' + (msg || label('state.done')), 'ok');
            if (opts.autoFadeOk > 0) {
                fadeTimer = setTimeout(() => setMessage('', 'ok'), opts.autoFadeOk);
            }
        },
        setWarning(msg) {
            clearFade();
            setMessage('⚠ ' + (msg || ''), 'warn');
        },
        clear() {
            clearFade();
            this.setThinking(null);
            setMessage('', 'ok');
            if (logEl) logEl.innerHTML = '';
        },
        destroy() {
            clearFade();
            container.innerHTML = '';
        },
        // onActivity · helper · retorna callback ready per a passar a runEscalation etc
        // així el consumidor sols fa: runner({ onActivity: fb.onActivity() })
        onActivity() {
            return (event) => this.addEvent(event);
        },
    };

    return controller;
}

// _noopController · si container no és vàlid · retornem stubs no-op
function _noopController() {
    return {
        setThinking() {}, addEvent() {}, setError() {}, setOk() {},
        setWarning() {}, clear() {}, destroy() {},
        onActivity() { return () => {}; },
    };
}

// renderInlineFeedbackHtml · pure · útil per a SSR-style renderitzar la
// caixa buida abans del bind. Retorna HTML string per insertar al template.
export function renderInlineFeedbackHtml({ id = 'aiFormFeedback' } = {}) {
    return `<div id="${id}" class="aff-mount"></div>`;
}
