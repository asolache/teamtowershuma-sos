// =============================================================================
// TEAMTOWERS SOS V11 — A11Y SERVICE (W3C/WCAG · audit accessibility)
// Ruta · /js/core/a11yService.js
//
// Components reusables d'accessibilitat · skip-link global · live-region per
// a anuncis screen-reader · keyboard navigation helpers · focus trap per
// modals.
//
// Pure DOM · safe en Node (guards). Reusable per a TOTES les vistes ·
// injectat un cop pel router via injectGlobalA11y().
// =============================================================================

const SKIP_LINK_ID  = 'sos-skip-link';
const LIVE_REGION_ID = 'sos-a11y-live';
const CSS_ID         = 'sos-a11y-css';

// _ensureCss · estils minimals per a skip-link visualment hidden fins focus
function _ensureCss() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(CSS_ID)) return;
    const style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = `
        /* Skip link · visualment ocult fins focus (W3C/WCAG 2.4.1) */
        .sos-skip-link {
            position: absolute;
            top: -100px; left: 0;
            background: #6366f1; color: #fff;
            padding: 10px 16px;
            text-decoration: none;
            font-weight: 700; font-family: var(--font-base, system-ui, sans-serif);
            border-radius: 0 0 8px 0;
            z-index: 9999;
            transition: top 150ms ease-out;
        }
        .sos-skip-link:focus {
            top: 0; outline: 3px solid #fff; outline-offset: -3px;
        }

        /* Visually hidden · screen-reader only · WCAG-friendly hide */
        .sr-only {
            position: absolute;
            width: 1px; height: 1px;
            padding: 0; margin: -1px;
            overflow: hidden; clip: rect(0, 0, 0, 0);
            white-space: nowrap; border: 0;
        }

        /* Live region · invisible · ARIA live announces */
        .sos-a11y-live {
            position: absolute;
            width: 1px; height: 1px;
            padding: 0; margin: -1px;
            overflow: hidden; clip: rect(0, 0, 0, 0);
            white-space: nowrap; border: 0;
        }

        /* Focus visible global · WCAG 2.4.7 */
        *:focus-visible {
            outline: 2px solid var(--accent-indigo, #6366f1);
            outline-offset: 2px;
        }
    `;
    document.head.appendChild(style);
}

// injectGlobalA11y · idempotent · injecta skip-link + live-region al body
// Called by router after each view render.
export function injectGlobalA11y() {
    if (typeof document === 'undefined') return;
    _ensureCss();

    // Skip link · destí #app (assumeix que totes les vistes munten a #app)
    if (!document.getElementById(SKIP_LINK_ID)) {
        const skip = document.createElement('a');
        skip.id = SKIP_LINK_ID;
        skip.className = 'sos-skip-link';
        skip.href = '#app';
        skip.textContent = 'Saltar al contingut principal';
        // Insert as first child of body
        if (document.body.firstChild) {
            document.body.insertBefore(skip, document.body.firstChild);
        } else {
            document.body.appendChild(skip);
        }
    }

    // Live region (per a announce())
    if (!document.getElementById(LIVE_REGION_ID)) {
        const live = document.createElement('div');
        live.id = LIVE_REGION_ID;
        live.className = 'sos-a11y-live';
        live.setAttribute('aria-live', 'polite');
        live.setAttribute('aria-atomic', 'true');
        document.body.appendChild(live);
    }

    // Marca #app amb role="main" + tabindex per al skip-link target
    const app = document.getElementById('app');
    if (app) {
        if (!app.getAttribute('role')) app.setAttribute('role', 'main');
        if (!app.hasAttribute('tabindex')) app.setAttribute('tabindex', '-1');
    }
}

// announce · helper screen-reader · força reading via live region
export function announce(text) {
    if (typeof document === 'undefined' || !text) return;
    const live = document.getElementById(LIVE_REGION_ID);
    if (!live) return;
    // Clear then set · força re-read en lectors de pantalla
    live.textContent = '';
    setTimeout(() => { live.textContent = String(text); }, 50);
}

// trapFocus · útil per a modals · cicla focus dins un element
// Retorna funció cleanup que treu el listener.
export function trapFocus(container) {
    if (typeof document === 'undefined' || !container) return () => {};
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const handler = (e) => {
        if (e.key !== 'Tab') return;
        const focusables = Array.from(container.querySelectorAll(focusableSelector));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };
    container.addEventListener('keydown', handler);
    return () => container.removeEventListener('keydown', handler);
}

// W3C audit helpers · pure · per a tests + UI diagnostics

// auditPage · pure-ish · scan DOM per a issues a11y comuns
// Retorna { issues:[], score:0-100 } · útil per a /design page
export function auditPage() {
    if (typeof document === 'undefined') {
        return { issues: ['no DOM available'], score: 0 };
    }
    const issues = [];

    // 1. Images sense alt
    const imgs = document.querySelectorAll('img');
    imgs.forEach((img, i) => {
        if (!img.hasAttribute('alt')) {
            issues.push({ kind: 'img-no-alt', element: 'img[' + i + ']', src: img.src?.slice(0, 60) });
        }
    });

    // 2. Buttons sense text accessible
    const btns = document.querySelectorAll('button');
    btns.forEach((b, i) => {
        const hasText = (b.textContent || '').trim().length > 0;
        const hasAria = b.hasAttribute('aria-label') || b.hasAttribute('aria-labelledby');
        if (!hasText && !hasAria) {
            issues.push({ kind: 'button-no-label', element: 'button[' + i + ']' });
        }
    });

    // 3. Form inputs sense label
    const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
    inputs.forEach((el, i) => {
        const id = el.id;
        const hasLabel = id && document.querySelector('label[for="' + id + '"]');
        const hasAria = el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby');
        const isHiddenType = el.type === 'hidden';
        if (!hasLabel && !hasAria && !isHiddenType) {
            issues.push({ kind: 'input-no-label', element: el.tagName + '[' + i + ']' });
        }
    });

    // 4. Links sense text accessible
    const links = document.querySelectorAll('a[href]');
    links.forEach((a, i) => {
        const hasText = (a.textContent || '').trim().length > 0;
        const hasAria = a.hasAttribute('aria-label') || a.hasAttribute('aria-labelledby');
        if (!hasText && !hasAria) {
            issues.push({ kind: 'link-no-text', element: 'a[' + i + ']', href: a.href });
        }
    });

    // 5. Múltiples h1 (WCAG · 1 h1 per pàgina)
    const h1s = document.querySelectorAll('h1');
    if (h1s.length > 1) {
        issues.push({ kind: 'multiple-h1', element: h1s.length + ' h1 elements' });
    }

    // Score · 100 if no issues · -5 per issue · floor 0
    const score = Math.max(0, 100 - issues.length * 5);

    return {
        issues,
        score,
        counts: {
            images: imgs.length,
            buttons: btns.length,
            inputs: inputs.length,
            links: links.length,
            h1s: h1s.length,
        },
    };
}

// destroy · cleanup global a11y · per a tests
export function destroyGlobalA11y() {
    if (typeof document === 'undefined') return;
    document.getElementById(SKIP_LINK_ID)?.remove();
    document.getElementById(LIVE_REGION_ID)?.remove();
    document.getElementById(CSS_ID)?.remove();
}

export { SKIP_LINK_ID, LIVE_REGION_ID };
