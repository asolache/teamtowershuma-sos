// =============================================================================
// TEAMTOWERS SOS V11 — AGENT BACKLOG LOADER (AGENT-BRIDGE-001 sprint B)
// Ruta · /js/core/agentBacklogLoader.js
//
// Carrega el backlog canonical des de `/docs/backlog.json` · cache local ·
// emet event 'agent-backlog:loaded'. Valida amb agentBridgeSchema.
//
// Aquesta és la connexió real Claude Code ↔ SOS · qualsevol IA agent que
// llegeixi el JSON parla amb SOS.
// =============================================================================

import { validateBacklog, computeBacklogStats } from './agentBridgeSchema.js';

const LS_KEY = 'sos_agent_backlog_v1';
const BACKLOG_URL = '/docs/backlog.json';

let _cached = null;
let _loadPromise = null;

// loadBacklog · async · llegeix backlog.json · valida · caché.
// Si falla fetch · prova cache localStorage. Si tampoc · retorna null + log.
export async function loadBacklog({ forceReload = false } = {}) {
    if (_cached && !forceReload) return _cached;
    if (_loadPromise && !forceReload) return _loadPromise;

    _loadPromise = (async () => {
        let raw = null;
        try {
            const res = await fetch(BACKLOG_URL, { cache: forceReload ? 'no-cache' : 'default' });
            if (!res.ok) throw new Error('fetch failed · ' + res.status);
            raw = await res.json();
        } catch (e) {
            console.warn('[agentBacklog] fetch failed · trying localStorage cache', e?.message);
            try {
                const cached = localStorage.getItem(LS_KEY);
                if (cached) raw = JSON.parse(cached);
            } catch (_) {}
        }
        if (!raw) {
            console.error('[agentBacklog] no backlog disponible');
            _loadPromise = null;
            return null;
        }
        const v = validateBacklog(raw);
        if (!v.ok) {
            console.error('[agentBacklog] validation errors ·', v.errors);
            _loadPromise = null;
            return null;
        }
        _cached = v.normalized;
        // Save to localStorage cache
        try { localStorage.setItem(LS_KEY, JSON.stringify(_cached)); } catch (_) {}
        // Emit event
        try {
            if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('agent-backlog:loaded', {
                    detail: { stats: computeBacklogStats(_cached) },
                }));
            }
        } catch (_) {}
        _loadPromise = null;
        return _cached;
    })();

    return _loadPromise;
}

// getCached · sense fetch · útil per a accés ràpid · null si no carregat
export function getCachedBacklog() {
    return _cached;
}

// invalidateCache · força la propera càrrega · útil quan Claude commiteja
export function invalidateCache() {
    _cached = null;
    _loadPromise = null;
    if (typeof localStorage !== 'undefined') {
        try { localStorage.removeItem(LS_KEY); } catch (_) {}
    }
}

// queryWos · sync · query del backlog cached (no fetch)
// args · { status, assignee_kind, tag } · filtres opcionals
export function queryWos({ status, assignee_kind, tag, projectId } = {}) {
    if (!_cached) return [];
    return (_cached.work_orders || []).filter(wo => {
        if (status && wo.status !== status) return false;
        if (assignee_kind && wo.assignee_kind !== assignee_kind) return false;
        if (tag && !(wo.tags || []).includes(tag)) return false;
        if (projectId && wo.project_id !== projectId) return false;
        return true;
    });
}

// queryAgents · sync · filtra agents per kind / active
export function queryAgents({ kind, activeOnly = true } = {}) {
    if (!_cached) return [];
    return (_cached.agents || []).filter(a => {
        if (activeOnly && !a.active) return false;
        if (kind && a.kind !== kind) return false;
        return true;
    });
}

// getStats · sync · stats del backlog cached
export function getStats() {
    if (!_cached) return null;
    return computeBacklogStats(_cached);
}

// _setCacheForTests · només per a tests · injecta backlog sense fetch
export function _setCacheForTests(backlog) {
    _cached = backlog;
}
