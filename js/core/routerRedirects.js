// =============================================================================
// TEAMTOWERS SOS V11 — ROUTER REDIRECTS (V2-EVOL Fase F)
// Ruta · /js/core/routerRedirects.js
//
// Mapa de rutes legacy → rutes canòniques · usat per `router()` per
// fer redirect 301-style (history.replaceState + re-dispatch).
//
// Aïllat en un fitxer Node-safe perquè els tests puguin importar-ho
// sense executar el bootstrap del router (que toca `window`).
//
// Veure `docs/STUDY-v2-evolution-plan-2026-05-16.md` Fase F.
// =============================================================================

// V2-EVOL Fase F · rutes legacy redirigides a destins coherents · cap entrada
// ambígua al fallback genèric HomeView.
//   /team /paper /focus → /home (cap rationale específic · tornar a Home)
//   /lms                → /learn (LMS = Learning Management = LearnView ja existeix)
export const LEGACY_REDIRECTS = Object.freeze({
    '/team':  '/home',
    '/paper': '/home',
    '/lms':   '/learn',
    '/focus': '/home',
});

// Helper · retorna el destí canònic d'una path · null si no és legacy.
export function resolveLegacyPath(path) {
    if (!path || typeof path !== 'string') return null;
    return LEGACY_REDIRECTS[path] || null;
}
