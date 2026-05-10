// TEAMTOWERS SOS V11 — THEME SERVICE (UX-AUDIT-001 sprint A)
//
// Toggle entre tema fosc (default tècnic SOS) i tema clar (Matriu-friendly).
// Persisteix la preferència al KB com a nodo `type='config'` ·
// `id='sos-ui-theme'`. Apica `body.theme-light` quan procedeix.
//
// Reframe @alvaro 2026-05-09: "haz que SOS pueda verse en blanco o en negro".

import { KB } from './kb.js';

const THEME_NODE_ID = 'sos-ui-theme';
const VALID_THEMES = Object.freeze(['dark', 'light']);

export const DEFAULT_THEME = 'dark';

// Pure helpers ─────────────────────────────────────────────────────

export function isValidTheme(theme) {
    return VALID_THEMES.includes(theme);
}

export function buildThemeNode(theme = DEFAULT_THEME) {
    const t = isValidTheme(theme) ? theme : DEFAULT_THEME;
    return {
        id:   THEME_NODE_ID,
        type: 'config',
        content: {
            kind:      'sos-ui-theme',
            theme:     t,
            updatedAt: Date.now(),
        },
        keywords: ['type:config', 'kind:sos-ui-theme', 'theme:' + t],
    };
}

// ── KB-bound async ────────────────────────────────────────────

export async function loadCurrentTheme(kb = KB) {
    if (!kb || typeof kb.getNode !== 'function') return DEFAULT_THEME;
    try {
        const node = await kb.getNode(THEME_NODE_ID);
        const t = node?.content?.theme;
        return isValidTheme(t) ? t : DEFAULT_THEME;
    } catch (_) { return DEFAULT_THEME; }
}

export async function saveTheme(kb, theme) {
    if (!kb || typeof kb.upsert !== 'function') throw new Error('saveTheme requires KB');
    if (!isValidTheme(theme)) throw new Error('saveTheme · invalid theme: ' + theme);
    const node = buildThemeNode(theme);
    return kb.upsert(node);
}

// applyThemeToDocument · puro DOM · idempotent
export function applyThemeToDocument(theme) {
    if (typeof document === 'undefined' || !document.body) return;
    const t = isValidTheme(theme) ? theme : DEFAULT_THEME;
    document.body.classList.toggle('theme-light', t === 'light');
    document.body.classList.toggle('theme-dark',  t === 'dark');
    // Per a SVG / canvas que llegeixen del CSS computed style
    document.body.setAttribute('data-theme', t);
}

// boot helper · cridar des del router/main al carregar perquè el
// tema s'apliqui ABANS del primer paint.
export async function bootTheme(kb = KB) {
    const t = await loadCurrentTheme(kb);
    applyThemeToDocument(t);
    return t;
}
