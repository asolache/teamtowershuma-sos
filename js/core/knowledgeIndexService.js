// =============================================================================
// TEAMTOWERS SOS V11 — KNOWLEDGE INDEX SERVICE (LEARN-HUB-001)
// Ruta · /js/core/knowledgeIndexService.js
//
// Servei pure que carrega knowledge/_search-index.json (generat per
// scripts/generate-knowledge-index.mjs) i ofereix · search · filter · roadmap.
//
// Pure · zero IA · zero DOM. El caller decideix render.
// =============================================================================

import { ROADMAPS_BY_ROLE } from './knowledgeRoadmaps.js';

export const INDEX_VERSION = 'v1.0';
const INDEX_URL = '/knowledge/_search-index.json';

// In-memory cache · 1 sol fetch per sessió
let _cache = null;

// loadIndex · async · carrega l'index una sola vegada · cached
export async function loadIndex({ forceReload = false } = {}) {
    if (_cache && !forceReload) return _cache;
    if (typeof fetch === 'undefined') return null;
    try {
        const res = await fetch(INDEX_URL);
        if (!res.ok) throw new Error('Fetch failed · ' + res.status);
        _cache = await res.json();
        return _cache;
    } catch (e) {
        console.warn('[knowledgeIndex] failed to load index ·', e?.message || e);
        return null;
    }
}

// getCached · sync · retorna l'index si ja carregat · null si no
export function getCached() {
    return _cache;
}

// _setCacheForTests · injecta · només tests
export function _setCacheForTests(idx) {
    _cache = idx;
}

// searchIndex · pure · cerca full-text + filtres
//
// args ·
//   query   · string · cerca a title · purpose · excerpt · keywords
//   type    · 'soc'|'sop'|'vision'|'sector'|'client'|'role' (opcional)
//   folder  · 'vision'|'socs'|'sops'|'sectors'|'clients'|'roles' (opcional)
//   sector  · CNAE id (A-T·UV) (opcional)
//   phase   · 'idea'|'mvp'|'validation'|'scale' (opcional)
//   limit   · default 50
export function searchIndex({ query = '', type, folder, sector, phase, limit = 50 } = {}, idx = _cache) {
    if (!idx || !Array.isArray(idx.items)) return [];
    const q = String(query || '').trim().toLowerCase();
    let results = idx.items.slice();
    if (type)    results = results.filter(it => it.type === type);
    if (folder)  results = results.filter(it => it.folder === folder);
    if (sector)  results = results.filter(it => it.sector_cnae === sector || it.sector_id === sector);
    if (phase)   results = results.filter(it => it.phase === phase);
    if (q) {
        results = results.filter(it => {
            const hay = (it.title + ' ' + (it.purpose || '') + ' ' + (it.excerpt || '') + ' ' + (it.keywords || []).join(' ')).toLowerCase();
            return hay.includes(q);
        });
    }
    return results.slice(0, limit);
}

// listByFolder · pure · agrupa items per folder · per a vista carpetas
export function listByFolder(idx = _cache) {
    if (!idx || !Array.isArray(idx.items)) return {};
    const out = {};
    for (const it of idx.items) {
        if (!out[it.folder]) out[it.folder] = [];
        out[it.folder].push(it);
    }
    // Ordena per relpath dins cada folder
    for (const k of Object.keys(out)) {
        out[k].sort((a, b) => a.relpath.localeCompare(b.relpath));
    }
    return out;
}

// listRoles · pure · llista els rols canònics amb roadmap disponible
export function listRoles() {
    return Object.keys(ROADMAPS_BY_ROLE);
}

// getRoadmap · pure · per a un rol · retorna roadmap amb items resolts
export function getRoadmap(roleId, idx = _cache) {
    const rm = ROADMAPS_BY_ROLE[roleId];
    if (!rm) return null;
    const items = (idx && idx.items) || [];
    // Resol cada path/id del roadmap a un item de l'index
    const resolved = (rm.readings || []).map(reading => {
        const found = items.find(it =>
            it.id === reading.id || it.relpath === reading.path || it.relpath === reading.relpath
        );
        return found ? { ...reading, item: found, found: true } : { ...reading, item: null, found: false };
    });
    return {
        roleId,
        roleName:    rm.roleName,
        description: rm.description,
        readings:    resolved,
        totalSteps:  resolved.length,
        foundCount:  resolved.filter(r => r.found).length,
    };
}

// stats · pure · per a UI hero
export function stats(idx = _cache) {
    if (!idx || !Array.isArray(idx.items)) return null;
    const byType = {};
    const byFolder = {};
    for (const it of idx.items) {
        byType[it.type] = (byType[it.type] || 0) + 1;
        byFolder[it.folder] = (byFolder[it.folder] || 0) + 1;
    }
    return {
        total:    idx.items.length,
        byType,
        byFolder,
        generated: idx.generated || null,
        rolesAvailable: Object.keys(ROADMAPS_BY_ROLE).length,
    };
}
