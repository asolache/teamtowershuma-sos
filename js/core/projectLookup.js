// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT LOOKUP (BUG-FIX sprint)
// Ruta · /js/core/projectLookup.js
//
// Helper centralitzat per a obtenir un project per id · compatible amb dos
// emmagatzematges:
//   1. KB indexat · usat per views noves (canvas · lifecycle · accounting · etc)
//   2. Redux-style store (state.projects array) · usat per views antigues
//      (ProjectHubView · KanbanView · etc)
//
// Algunes projectes només existeixen en un dels dos · cal fer fallback.
// Fixat al PR after stop-hook · KB.upsert es feia al MAX bootstrap però
// projectes legacy o creats per store-only path no apareixen al KB.
//
// USAGE · en lloc de ·
//   this.project = await KB.getNode(this.projectId);
// fer ·
//   this.project = await findProjectByIdAny(this.projectId);
//
// Pure async · zero side effects.
// =============================================================================

import { KB }    from './kb.js';
import { store } from './store.js';

// findProjectByIdAny · async · busca primer al KB · després al store
// Retorna · project node o null si no trobat enlloc
export async function findProjectByIdAny(projectId) {
    if (!projectId || typeof projectId !== 'string') return null;
    // 1. KB lookup · més ràpid per views noves
    try {
        const fromKB = await KB.getNode(projectId);
        if (fromKB) return fromKB;
    } catch (_) { /* KB no inicialitzat encara · fallback */ }
    // 2. Store fallback · projectes creats sense KB.upsert
    try {
        const state = store.getState();
        const found = (state.projects || []).find(p => p && p.id === projectId);
        if (found) return found;
    } catch (_) { /* store no init · ignore */ }
    return null;
}

// findProjectByIdAnySync · sync · només store (KB és async)
// Útil per a UI inicial abans del primer await
export function findProjectByIdAnySync(projectId) {
    if (!projectId || typeof projectId !== 'string') return null;
    try {
        const state = store.getState();
        return (state.projects || []).find(p => p && p.id === projectId) || null;
    } catch (_) { return null; }
}
