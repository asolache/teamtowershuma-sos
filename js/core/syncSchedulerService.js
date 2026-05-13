// =============================================================================
// TEAMTOWERS SOS V11 — SYNC SCHEDULER (PERM-DISCO-001 sprint A)
//
// Service que orquestra el sync de fons amb el permaweb. Cooldown 1h
// foreground perquè el gateway Arweave no s'aboqui en queries
// duplicades. Persisteix l'última sincronització a KB com a node
// `sync_marker` perquè el cooldown sobrevisqui reloads.
//
// Filosofia · 100% async/silent · zero blocking del router. El consumidor
// (router) crida `triggerSyncIfDue()` sense `await` · el sync s'executa
// en background. Notifica via callbacks { onStart, onProgress, onDone, onError }.
//
// Idempotent · si una sync està en curs, retorna l'existent en comptes
// de llançar-ne una nova.
// =============================================================================

import { syncFromPermaweb, DEFAULT_TTL_MS, DEFAULT_TTL_BG_MS } from './publicRegistryService.js';

export const SYNC_MARKER_ID = 'sync-marker-permaweb';
export const SYNC_MARKER_TYPE = 'sync_marker';

// Cooldown foreground · 1h. Background podria ser més llarg (sprint B futur).
export const FOREGROUND_COOLDOWN_MS = DEFAULT_TTL_MS;       // 1h
export const BACKGROUND_COOLDOWN_MS = DEFAULT_TTL_BG_MS;    // 24h

let _inflight = null;   // Promise en curs · per evitar concurrent syncs
let _lastResult = null; // Cache del darrer result

// Lectura del marker · async · KB-bound
export async function getLastSyncMarker(kb = null) {
    try {
        const KB = kb || (await import('./kb.js')).KB;
        const node = await KB.getNode(SYNC_MARKER_ID);
        if (node && node.type === SYNC_MARKER_TYPE && typeof node.content?.lastSyncAt === 'number') {
            return node.content;
        }
    } catch (_) {}
    return null;
}

export async function setLastSyncMarker({ result, kb = null } = {}) {
    try {
        const KB = kb || (await import('./kb.js')).KB;
        const now = Date.now();
        const node = {
            id:   SYNC_MARKER_ID,
            type: SYNC_MARKER_TYPE,
            content: {
                lastSyncAt:  now,
                lastFetched: result?.fetched || 0,
                lastCached:  result?.cached  || 0,
                lastFailed:  result?.failed  || 0,
                lastRevocations: result?.revocations || 0,
            },
            keywords:  ['type:sync-marker'],
            createdAt: now,
            updatedAt: now,
        };
        await KB.upsert(node);
        return node;
    } catch (e) {
        console.warn('[syncScheduler] persist marker failed', e?.message);
        return null;
    }
}

// isDue · pur · compara timestamp actual vs lastSyncAt
export function isDue({ now = Date.now(), lastSyncAt = 0, cooldownMs = FOREGROUND_COOLDOWN_MS } = {}) {
    if (!lastSyncAt) return true;
    return (now - lastSyncAt) >= cooldownMs;
}

// triggerSyncIfDue · async · silent · executa syncFromPermaweb si toca.
// El caller pot passar callbacks per UI (status badge · toast post-sync).
//
// opts:
//   force        · bool · ignora el cooldown
//   cooldownMs   · default 1h
//   onStart      · fn · cridat just abans del sync
//   onDone       · fn(result) · cridat amb el { fetched, cached, revocations }
//   onError      · fn(err) · cridat si throws
//   syncOpts     · opts passats a syncFromPermaweb (default { verifyOnSync: true })
//
// Retorna · { triggered:bool, result?, reason? }. NO bloca · el sync
// real ocorre en background si triggered=true.
export async function triggerSyncIfDue({
    force         = false,
    cooldownMs    = FOREGROUND_COOLDOWN_MS,
    onStart       = null,
    onDone        = null,
    onError       = null,
    syncOpts      = { verifyOnSync: true },
    syncFn        = syncFromPermaweb,
    kb            = null,
    now           = Date.now(),
} = {}) {
    if (_inflight) {
        return { triggered: false, reason: 'already-in-flight', promise: _inflight };
    }
    if (!force) {
        const marker = await getLastSyncMarker(kb);
        const lastSyncAt = marker?.lastSyncAt || 0;
        if (!isDue({ now, lastSyncAt, cooldownMs })) {
            return { triggered: false, reason: 'cooldown', lastSyncAt };
        }
    }
    if (typeof onStart === 'function') {
        try { onStart(); } catch (_) {}
    }
    _inflight = (async () => {
        try {
            const result = await syncFn(syncOpts);
            _lastResult = result;
            await setLastSyncMarker({ result, kb });
            if (typeof onDone === 'function') {
                try { onDone(result); } catch (_) {}
            }
            return result;
        } catch (e) {
            if (typeof onError === 'function') {
                try { onError(e); } catch (_) {}
            }
            throw e;
        } finally {
            _inflight = null;
        }
    })();
    return { triggered: true, promise: _inflight };
}

// getInflight · útil per als consumers que volen mostrar "sync en curs"
export function getInflightSync() { return _inflight; }

// getLastResult · útil per UI (status badge)
export function getLastSyncResult() { return _lastResult; }

// Reset · per a tests
export function _resetSyncScheduler() {
    _inflight = null;
    _lastResult = null;
}
