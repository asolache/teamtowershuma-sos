// =============================================================================
// TEAMTOWERS SOS V11 — UX COMPONENTS (UX-COMPONENTS · sprint mobile-first)
// Ruta · /js/core/uxComponents.js
//
// 3 components reusables · DRY · disponibles per a totes les views ·
//   1. toast({ kind, text, ttl }) · notificació top-right · auto-fade
//   2. emptyStateHtml({ icon, title, body, ctaLabel, ctaHref }) · empty state DRY
//   3. confirmModalHtml({ title, body, confirmLabel, danger }) + bindConfirm()
//
// Pure (HTML helpers) + DOM (toast · confirm). Safe en Node (guards).
// =============================================================================

// ── Toast notifications ───────────────────────────────────────────────────

const TOAST_HOST_ID = 'sos-toast-host';
const TOAST_CSS_ID  = 'sos-toast-css';

function _ensureToastCss() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(TOAST_CSS_ID)) return;
    const style = document.createElement('style');
    style.id = TOAST_CSS_ID;
    style.textContent = `
        #${TOAST_HOST_ID} {
            position: fixed; top: 16px; right: 16px;
            z-index: 2000;
            display: flex; flex-direction: column; gap: 8px;
            max-width: min(360px, calc(100vw - 32px));
            pointer-events: none;
        }
        .sos-toast {
            padding: 10px 14px; border-radius: 8px;
            font-family: var(--font-base, system-ui, sans-serif);
            font-size: 0.85rem; line-height: 1.4;
            pointer-events: auto;
            box-shadow: 0 8px 24px rgba(0,0,0,0.45);
            border: 1px solid;
            animation: sos-toast-in 180ms ease-out;
            opacity: 1;
            transition: opacity 200ms ease-out, transform 200ms ease-out;
        }
        .sos-toast.fade-out { opacity: 0; transform: translateX(20px); }
        @keyframes sos-toast-in {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
        }
        .sos-toast.success { background: rgba(34,197,94,0.16); border-color: rgba(34,197,94,0.4); color: #22c55e; }
        .sos-toast.error   { background: rgba(239,68,68,0.16); border-color: rgba(239,68,68,0.4); color: #ef4444; }
        .sos-toast.warn    { background: rgba(250,204,21,0.16); border-color: rgba(250,204,21,0.45); color: #facc15; }
        .sos-toast.info    { background: rgba(99,102,241,0.16); border-color: rgba(99,102,241,0.4); color: #a8b2ff; }
        .sos-toast .ic { margin-right: 6px; }
        .sos-toast .x  { float: right; margin-left: 8px; cursor: pointer; opacity: 0.6; }
        .sos-toast .x:hover { opacity: 1; }
    `;
    document.head.appendChild(style);
}

function _ensureToastHost() {
    if (typeof document === 'undefined') return null;
    let host = document.getElementById(TOAST_HOST_ID);
    if (!host) {
        host = document.createElement('div');
        host.id = TOAST_HOST_ID;
        host.setAttribute('aria-live', 'polite');
        host.setAttribute('aria-atomic', 'false');
        document.body.appendChild(host);
    }
    return host;
}

const TOAST_ICONS = { success: '✓', error: '✗', warn: '⚠', info: 'ℹ' };

// toast · API pública · mostra notificació · auto-fade
//
// args ·
//   kind · 'success' | 'error' | 'warn' | 'info'
//   text · contingut
//   ttl  · ms abans de fade-out (default 4000 · 0 = persistent)
//
// Retorna · funció dismiss() · per a tancar manual
export function toast({ kind = 'info', text = '', ttl = 4000 } = {}) {
    if (typeof document === 'undefined') return () => {};
    _ensureToastCss();
    const host = _ensureToastHost();
    if (!host) return () => {};
    const k = ['success', 'error', 'warn', 'info'].includes(kind) ? kind : 'info';
    const node = document.createElement('div');
    node.className = 'sos-toast ' + k;
    node.innerHTML = `<span class="ic">${TOAST_ICONS[k]}</span>${_esc(text)}<span class="x" aria-label="Tanca">✕</span>`;
    host.appendChild(node);
    let timer = null;
    const dismiss = () => {
        if (timer) clearTimeout(timer);
        if (!node.parentNode) return;
        node.classList.add('fade-out');
        setTimeout(() => { if (node.parentNode) node.remove(); }, 220);
    };
    node.querySelector('.x')?.addEventListener('click', dismiss);
    if (ttl > 0) timer = setTimeout(dismiss, ttl);
    return dismiss;
}

// ── Empty state · pure HTML helper ────────────────────────────────────────

// emptyStateHtml · pure · per a vistes amb 0 data
// args · { icon, title, body, ctaLabel, ctaHref, secondaryLabel, secondaryHref }
export function emptyStateHtml({
    icon = '✨',
    title = 'Encara cap dada',
    body = 'Aquest espai s\'omplirà a mesura que treballis al projecte.',
    ctaLabel = null,
    ctaHref = null,
    secondaryLabel = null,
    secondaryHref = null,
} = {}) {
    return `
    <div class="sos-empty" style="padding:2rem 1rem;text-align:center;color:var(--text-secondary,#94a3b8);">
        <div style="font-size:2.5rem;line-height:1;margin-bottom:0.7rem;" aria-hidden="true">${_esc(icon)}</div>
        <div style="font-size:1rem;font-weight:700;color:var(--text-main,#e2e8f0);margin-bottom:0.4rem;">${_esc(title)}</div>
        <div style="font-size:0.85rem;line-height:1.55;max-width:480px;margin:0 auto 1rem auto;">${_esc(body)}</div>
        ${ctaLabel && ctaHref ? `<a href="${_esc(ctaHref)}" data-link style="display:inline-block;padding:8px 16px;border-radius:6px;background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;text-decoration:none;font-size:0.85rem;font-weight:700;margin:0 4px;">${_esc(ctaLabel)}</a>` : ''}
        ${secondaryLabel && secondaryHref ? `<a href="${_esc(secondaryHref)}" data-link style="display:inline-block;padding:8px 16px;border-radius:6px;background:transparent;border:1px solid var(--border-default,#1e293b);color:var(--text-main,#e2e8f0);text-decoration:none;font-size:0.85rem;font-weight:600;margin:0 4px;">${_esc(secondaryLabel)}</a>` : ''}
    </div>`;
}

// ── Confirm modal · pure HTML + bindConfirm ──────────────────────────────

// confirmModalHtml · pure · genera el HTML del modal (host extern)
export function confirmModalHtml({
    title = 'Confirma',
    body = 'Estàs segur?',
    confirmLabel = 'Sí · confirma',
    cancelLabel = 'Cancel·la',
    danger = false,
    id = 'sosConfirmModal',
} = {}) {
    const btnBg = danger ? 'background:#ef4444;color:#fff;' : 'background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;';
    return `
    <div id="${_esc(id)}" class="sos-confirm-bg" style="position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:2100;display:flex;align-items:center;justify-content:center;padding:1rem;">
        <div class="sos-confirm" style="background:var(--bg-panel,#0f172a);color:var(--text-main,#e2e8f0);border:1px solid var(--border-default,#1e293b);border-radius:10px;padding:1.3rem 1.5rem;max-width:420px;width:100%;font-family:var(--font-base,system-ui,sans-serif);">
            <div style="font-size:1.05rem;font-weight:700;margin-bottom:0.6rem;">${_esc(title)}</div>
            <div style="font-size:0.88rem;color:var(--text-secondary,#94a3b8);line-height:1.55;margin-bottom:1rem;">${_esc(body)}</div>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button data-confirm-cancel style="padding:8px 14px;border-radius:6px;background:transparent;border:1px solid var(--border-default,#1e293b);color:var(--text-secondary,#94a3b8);font-size:0.85rem;cursor:pointer;font-weight:600;">${_esc(cancelLabel)}</button>
                <button data-confirm-ok style="padding:8px 14px;border-radius:6px;border:0;font-size:0.85rem;font-weight:700;cursor:pointer;${btnBg}">${_esc(confirmLabel)}</button>
            </div>
        </div>
    </div>`;
}

// confirm · async wrapper · muntat al body · resolt amb true/false
export async function confirm({
    title, body, confirmLabel, cancelLabel, danger = false,
} = {}) {
    if (typeof document === 'undefined') return false;
    return new Promise((resolve) => {
        const wrap = document.createElement('div');
        wrap.innerHTML = confirmModalHtml({ title, body, confirmLabel, cancelLabel, danger });
        const node = wrap.firstElementChild;
        document.body.appendChild(node);
        const cleanup = (result) => {
            if (node.parentNode) node.remove();
            resolve(!!result);
        };
        node.querySelector('[data-confirm-ok]')?.addEventListener('click', () => cleanup(true));
        node.querySelector('[data-confirm-cancel]')?.addEventListener('click', () => cleanup(false));
        node.addEventListener('click', (e) => {
            if (e.target === node) cleanup(false);   // backdrop click cancels
        });
    });
}

// ── Helpers ───────────────────────────────────────────────────────────────

function _esc(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// destroy · cleanup · per a tests
export function destroyAll() {
    if (typeof document === 'undefined') return;
    document.getElementById(TOAST_HOST_ID)?.remove();
    document.getElementById(TOAST_CSS_ID)?.remove();
}

// Exports per a tests
export { TOAST_HOST_ID, TOAST_CSS_ID };
