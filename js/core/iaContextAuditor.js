// =============================================================================
// TEAMTOWERS SOS V11 — IA CONTEXT AUDITOR (IA-CONTEXT-AUDIT-001)
// Ruta · /js/core/iaContextAuditor.js
//
// Auditoria de TOTS els llocs on l'app envia context a IA. Per cada crida:
//   - Mida del prompt (tokens approx · 1 token ≈ 4 chars)
//   - Token budget per ambition/tier (light <500 · standard <1500 · max <2500)
//   - Cache hit rate
//   - Cost real / estimat ratio (alerta si >1.5)
//   - Detecció de prompts duplicats (mateix hash · fusionable)
//
// Pure · ledger en memòria · zero KB by default (caller decideix persistència).
// Per a persistir · `audit({...})` + `getStats()` + `persist(KB)` opcional.
// =============================================================================

export const AUDITOR_VERSION = 'v1.0';

// Token budgets per tier · alineats amb AMBITION_LEVELS del orchestrator
export const TOKEN_BUDGETS = Object.freeze({
    light:    500,
    standard: 1500,
    max:      2500,
    unknown:  3000,   // default safety
});

// Ratio màxim real/estimat · alerta si una crida supera (cost descontrolat)
export const COST_RATIO_ALERT = 1.5;

// ─── Internal ledger (in-memory · reset amb _reset) ──────────────────────
let _entries = [];

// _hashPrompt · pure · djb2 simple · suficient per a deduplication detection.
// No criptogràfic · només identifica prompts idèntics.
function _hashPrompt(s) {
    if (!s) return '0';
    let h = 5381;
    const str = String(s);
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return Math.abs(h).toString(36);
}

// _estimateTokens · pure · 1 token ≈ 4 chars (regla de polz · ±15% accuracy)
function _estimateTokens(text) {
    return Math.ceil((String(text || '').length) / 4);
}

// ─── Public API ───────────────────────────────────────────────────────────

// audit · registra una crida IA al ledger intern.
//
// args ·
//   source · 'vnaExpertPrompts' · 'classifyProject' · 'projectCreationOrchestrator'
//            · 'woContextBuilder' · 'roleSopGenerator' · etc.
//   prompt · text complet del prompt (system+fewShot+user) · usat per
//            hash + token estimate. Es pot passar approxTokens explícit.
//   ambition · 'light'|'standard'|'max'|'unknown' (default unknown)
//   response · text de la resposta IA (per a token count outgoing)
//   costEstimateEur · cost estimat abans de la crida
//   costActualEur · cost real reportat pel provider
//   cacheHit · boolean · true si va venir de cache (cost 0)
//   ts · injectable per a tests
export function audit({
    source = 'unknown',
    prompt = '',
    approxTokens = null,
    ambition = 'unknown',
    response = '',
    costEstimateEur = 0,
    costActualEur = 0,
    cacheHit = false,
    ts = null,
} = {}) {
    const tokens = (typeof approxTokens === 'number') ? approxTokens : _estimateTokens(prompt);
    const responseTokens = _estimateTokens(response);
    const budget = TOKEN_BUDGETS[ambition] || TOKEN_BUDGETS.unknown;
    const overBudget = tokens > budget;
    const costRatio = costEstimateEur > 0 ? costActualEur / costEstimateEur : null;
    const overspend = costRatio !== null && costRatio > COST_RATIO_ALERT;
    const entry = {
        ts: (typeof ts === 'number') ? ts : Date.now(),
        source,
        ambition,
        promptHash: _hashPrompt(prompt),
        tokens,
        responseTokens,
        budget,
        overBudget,
        costEstimateEur,
        costActualEur,
        costRatio,
        overspend,
        cacheHit,
    };
    _entries.push(entry);
    return entry;
}

// getStats · pure · estadístiques agregades del ledger
//
// args · { sinceMs · filtra entries posteriors a aquest timestamp }
// Retorna · {
//   totalCalls, totalTokens, totalCost,
//   cacheHits, cacheHitRate,
//   bySource: { [source]: { calls, tokens, cost, cacheHits, avgTokens, ... } },
//   overBudgetCount, overBudgetSources[],
//   overspendCount, overspendSources[],
//   duplicates: [{ hash, count, sources[] }],
// }
export function getStats({ sinceMs = 0 } = {}) {
    const entries = _entries.filter(e => e.ts >= sinceMs);
    const bySource = {};
    const byHash = {};
    let totalTokens = 0;
    let totalCost = 0;
    let cacheHits = 0;
    let overBudgetCount = 0;
    let overspendCount = 0;
    const overBudgetSources = new Set();
    const overspendSources = new Set();

    for (const e of entries) {
        if (!bySource[e.source]) {
            bySource[e.source] = { calls: 0, tokens: 0, cost: 0, cacheHits: 0 };
        }
        const s = bySource[e.source];
        s.calls++;
        s.tokens += e.tokens;
        s.cost += e.costActualEur;
        if (e.cacheHit) { s.cacheHits++; cacheHits++; }

        totalTokens += e.tokens;
        totalCost += e.costActualEur;
        if (e.overBudget)  { overBudgetCount++; overBudgetSources.add(e.source); }
        if (e.overspend)   { overspendCount++;  overspendSources.add(e.source); }

        // Deduplication detection
        if (!byHash[e.promptHash]) byHash[e.promptHash] = { count: 0, sources: new Set() };
        byHash[e.promptHash].count++;
        byHash[e.promptHash].sources.add(e.source);
    }

    // avgTokens per source
    for (const k of Object.keys(bySource)) {
        const s = bySource[k];
        s.avgTokens = s.calls > 0 ? Math.round(s.tokens / s.calls) : 0;
    }

    // Duplicats · hash que apareix ≥2 cops
    const duplicates = Object.entries(byHash)
        .filter(([_h, v]) => v.count >= 2)
        .map(([hash, v]) => ({ hash, count: v.count, sources: [...v.sources] }))
        .sort((a, b) => b.count - a.count);

    return {
        totalCalls: entries.length,
        totalTokens,
        totalCost: Number(totalCost.toFixed(4)),
        cacheHits,
        cacheHitRate: entries.length > 0 ? cacheHits / entries.length : 0,
        bySource,
        overBudgetCount,
        overBudgetSources: [...overBudgetSources],
        overspendCount,
        overspendSources: [...overspendSources],
        duplicates,
    };
}

// listRecent · pure · últimes N entries (per a debug · UI auditor)
export function listRecent({ limit = 20 } = {}) {
    return _entries.slice(-limit).reverse();
}

// flagged · pure · entries amb anomalies (over budget · overspend · big dup)
export function flagged({ sinceMs = 0 } = {}) {
    const out = [];
    for (const e of _entries) {
        if (e.ts < sinceMs) continue;
        const flags = [];
        if (e.overBudget) flags.push('over-budget');
        if (e.overspend)  flags.push('overspend');
        if (flags.length > 0) out.push({ ...e, flags });
    }
    return out;
}

// _reset · només per a tests
export function _reset() {
    _entries = [];
}

// _setEntriesForTests · injectar entries (només tests)
export function _setEntriesForTests(entries) {
    _entries = Array.isArray(entries) ? entries.slice() : [];
}

// estimateTokensForPrompt · helper exportat per ús extern (ex. abans d'enviar)
export function estimateTokensForPrompt(text) {
    return _estimateTokens(text);
}

// budgetCheck · pure · retorna { ok, overBy, budget } abans de fer la crida
export function budgetCheck({ prompt = '', approxTokens = null, ambition = 'unknown' } = {}) {
    const tokens = (typeof approxTokens === 'number') ? approxTokens : _estimateTokens(prompt);
    const budget = TOKEN_BUDGETS[ambition] || TOKEN_BUDGETS.unknown;
    return {
        ok: tokens <= budget,
        tokens,
        budget,
        overBy: Math.max(0, tokens - budget),
    };
}
