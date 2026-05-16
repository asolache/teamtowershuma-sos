// =============================================================================
// TEAMTOWERS SOS V11 — NICKNAME REGISTRY (SOCIAL-IDENTITY-001)
// Ruta · /js/core/nicknameRegistryService.js
//
// Verifica que un nickname (@handle) NO està agafat globalment · query del
// public_registry_entry catalog (sincronitzat des de permaweb via
// syncFromPermaweb) + KB local. Pure-ish · llegeix KB.
//
// Reserva first-come-first-served · si vols un nickname únic globalment ·
// publica el teu public_registry_entry signat a permaweb · ningú podrà
// reclamar el mateix handle després (verifyRegistryEntry detecta col·lisió).
// =============================================================================

const HANDLE_REGEX = /^@?([a-z0-9][a-z0-9_-]{2,29})$/i;
export const HANDLE_MIN_LENGTH = 3;
export const HANDLE_MAX_LENGTH = 30;

// Reserved · noms del sistema · no es poden agafar
const RESERVED = new Set([
    'admin', 'system', 'sos', 'sos-bot', 'teamtowers', 'matriu', 'cohort',
    'team', 'support', 'help', 'api', 'www', 'root', 'me', 'you', 'us',
    'anonymous', 'anon', 'null', 'undefined', 'test', 'demo', 'guest',
    'agent', 'ai', 'claude', 'gpt', 'gemini', 'admin', 'orchestrator',
]);

// _normHandle · pure · strip @ · lowercase
export function normalizeHandle(handle) {
    if (!handle || typeof handle !== 'string') return null;
    return handle.trim().replace(/^@/, '').toLowerCase();
}

// validateHandleSyntax · pure · format check (no DB hit)
// Retorna · { ok, reason? }
export function validateHandleSyntax(handle) {
    if (!handle) return { ok: false, reason: 'handle empty' };
    const clean = normalizeHandle(handle);
    if (!clean) return { ok: false, reason: 'handle empty post-norm' };
    if (clean.length < HANDLE_MIN_LENGTH) {
        return { ok: false, reason: 'handle massa curt · min ' + HANDLE_MIN_LENGTH };
    }
    if (clean.length > HANDLE_MAX_LENGTH) {
        return { ok: false, reason: 'handle massa llarg · max ' + HANDLE_MAX_LENGTH };
    }
    if (!HANDLE_REGEX.test(clean)) {
        return { ok: false, reason: 'caràcters invàlids · només a-z 0-9 _ - · ha de començar amb lletra o número' };
    }
    if (RESERVED.has(clean)) {
        return { ok: false, reason: 'reservat del sistema · prova un altre' };
    }
    return { ok: true, normalized: '@' + clean };
}

// isHandleTakenInList · pure · check contra una llista de registry entries
//
// args ·
//   handle · @x (o x) · normalitzat internament
//   entries · array de public_registry_entry nodes
//   exceptDid · DID a excloure (cas · l'usuari verifica el seu propi handle)
//
// Retorna · { taken, byDid?, bySource? }
export function isHandleTakenInList({ handle, entries = [], exceptDid = null } = {}) {
    const norm = normalizeHandle(handle);
    if (!norm) return { taken: false };
    for (const e of entries) {
        if (!e || !e.content) continue;
        const entryHandle = normalizeHandle(e.content.handle);
        if (!entryHandle) continue;
        if (entryHandle === norm) {
            if (exceptDid && e.content.did === exceptDid) continue;
            return {
                taken: true,
                byDid: e.content.did || null,
                bySource: e.arweaveTxId ? 'permaweb' : 'local',
                entryId: e.id,
            };
        }
    }
    return { taken: false };
}

// suggestAlternatives · pure · si handle agafat · suggereix N variants ·
// pattern · handle1 · handle2 · handle_2026 · etc
//
// args · handle, entries, limit
export function suggestAlternatives({ handle, entries = [], limit = 5 } = {}) {
    const norm = normalizeHandle(handle);
    if (!norm) return [];
    const suggestions = [
        norm + Math.floor(Math.random() * 99 + 2),
        norm + '_' + new Date().getFullYear(),
        norm + '-x',
        norm + '_real',
        norm + 'sos',
    ];
    const taken = new Set();
    for (const e of (entries || [])) {
        const h = normalizeHandle(e.content?.handle);
        if (h) taken.add(h);
    }
    const out = [];
    for (const s of suggestions) {
        const v = validateHandleSyntax(s);
        if (v.ok && !taken.has(s)) {
            out.push('@' + s);
        }
        if (out.length >= limit) break;
    }
    return out;
}

// checkHandleAvailability · async · combina syntax + KB query + permaweb sync
// (si tens KB injectat). Retorna · { ok, status, ... }
//
// status · 'available' · 'invalid-syntax' · 'reserved' · 'taken-local' ·
//          'taken-permaweb' · 'unknown'
export async function checkHandleAvailability({ handle, exceptDid = null, kb = null } = {}) {
    // 1. Syntax
    const syn = validateHandleSyntax(handle);
    if (!syn.ok) {
        return { ok: false, status: syn.reason.includes('reservat') ? 'reserved' : 'invalid-syntax', reason: syn.reason };
    }

    // 2. KB local check
    let entries = [];
    if (kb) {
        try {
            entries = await kb.query({ type: 'public_registry_entry' }).catch(() => []);
        } catch (_) {}
    }
    const local = isHandleTakenInList({ handle, entries, exceptDid });
    if (local.taken) {
        return {
            ok: false,
            status: local.bySource === 'permaweb' ? 'taken-permaweb' : 'taken-local',
            reason: 'agafat per DID · ' + (local.byDid || 'unknown'),
            byDid: local.byDid,
            suggestions: suggestAlternatives({ handle, entries }),
        };
    }

    return {
        ok: true,
        status: 'available',
        normalized: syn.normalized,
    };
}
