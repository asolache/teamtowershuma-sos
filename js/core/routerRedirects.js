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
//   /paper /focus → /home (cap rationale específic · tornar a Home)
//   /lms          → /learn (LMS = Learning Management = LearnView ja existeix)
//   /settings-v2  → /settings (canònic · V2 ja viu a /settings post-Fase B)
//   /dashboard    → /home (canònic · DashboardV2 absorbeix V1 post-Fase C)
//   /wallet       → /wallet/v2 (v143 · WalletV2 amb tabs canonical · /wallet legacy mort)
//   /accounting   → /accounting/v2 (v144 · AccountingV2 alineat WalletV2 · legacy mort)
// v140 · /team RECUPERAT del legacy redirect · TeamView nova vista global RBAC
export const LEGACY_REDIRECTS = Object.freeze({
    '/paper':        '/home',
    '/lms':          '/learn',
    '/focus':        '/home',
    '/settings-v2':  '/settings',
    '/dashboard':    '/home',
    '/wallet':       '/wallet/v2',
    '/accounting':   '/accounting/v2',
});

// Helper · retorna el destí canònic d'una path · null si no és legacy.
export function resolveLegacyPath(path) {
    if (!path || typeof path !== 'string') return null;
    return LEGACY_REDIRECTS[path] || null;
}
