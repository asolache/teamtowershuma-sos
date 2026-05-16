// =============================================================================
// TEAMTOWERS SOS V11 — AI CACHE SERVICE (AI-COST-QA-001 sprint A)
// Ruta · /js/core/aiCacheService.js
//
// LRU cache amb TTL per a respostes IA · clau = hash(prompt + systemPrompt
// + temperature + modelKey). Storage · sessionStorage (efímer per sessió ·
// no contamina disc).
//
// Filosofia · prompts deterministes (temperature=0 · classificació · etc)
// es repeteixen sovint · hit rate visible al aiTierIndicator. Hit estalvia
// 100% del cost · 100% de la latència.
// =============================================================================

const SS_KEY = 'sos_ai_cache_v1';
const DEFAULT_TTL_MS = 60 * 60 * 1000;       // 1h
const MAX_ENTRIES = 100;                      // LRU eviction límit

// In-memory layer · més ràpid que sessionStorage en hot path
let _memory = null;

function _loadSession() {
    if (_memory) return _memory;
    _memory = { entries: {}, order: [] };
    if (typeof sessionStorage !== 'undefined') {
        try {
            const raw = sessionStorage.getItem(SS_KEY);
            if (raw) _memory = JSON.parse(raw);
        } catch (_) {}
    }
    return _memory;
}

function _saveSession() {
    // _memory ja és l'autoritat in-memory · sessionStorage és la persistència
    if (typeof sessionStorage === 'undefined') return;
    try { sessionStorage.setItem(SS_KEY, JSON.stringify(_memory)); } catch (_) {}
}

// hashKey · DJB2-style hash · pure · ràpid · ~32-bit
export function hashKey({ prompt, systemPrompt = '', temperature = 0.7, modelKey = '' }) {
    const s = String(modelKey) + '|' + String(temperature) + '|' + String(systemPrompt) + '|' + String(prompt);
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    }
    return h.toString(36) + '-' + s.length.toString(36);
}

// get · retorna entry o null si miss/expired
export function get(key) {
    const m = _loadSession();
    const entry = m.entries[key];
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
        // expired · remove
        delete m.entries[key];
        m.order = m.order.filter(k => k !== key);
        _saveSession();
        return null;
    }
    // LRU bump · move to end
    m.order = m.order.filter(k => k !== key);
    m.order.push(key);
    _saveSession();
    return entry.value;
}

// set · LRU eviction si exhaurit MAX_ENTRIES
export function set(key, value, { ttlMs = DEFAULT_TTL_MS } = {}) {
    const m = _loadSession();
    const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : null;
    m.entries[key] = { value, expiresAt, savedAt: Date.now() };
    m.order = m.order.filter(k => k !== key);
    m.order.push(key);
    while (m.order.length > MAX_ENTRIES) {
        const oldKey = m.order.shift();
        delete m.entries[oldKey];
    }
    _saveSession();
}

// has · sense bump · pure check
export function has(key) {
    const m = _loadSession();
    const entry = m.entries[key];
    if (!entry) return false;
    if (entry.expiresAt && Date.now() > entry.expiresAt) return false;
    return true;
}

// stats · per a UI · saved / total / hit rate (tracked separately)
let _hits = 0;
let _misses = 0;

export function recordHit() { _hits++; }
export function recordMiss() { _misses++; }

export function getStats() {
    const m = _loadSession();
    const total = _hits + _misses;
    return {
        entries: Object.keys(m.entries).length,
        hits: _hits,
        misses: _misses,
        hitRate: total > 0 ? Number((_hits / total).toFixed(3)) : 0,
    };
}

export function clear() {
    _memory = { entries: {}, order: [] };
    _hits = 0;
    _misses = 0;
    if (typeof sessionStorage !== 'undefined') {
        try { sessionStorage.removeItem(SS_KEY); } catch (_) {}
    }
}

// _resetForTests
export function _resetForTests() { clear(); }
