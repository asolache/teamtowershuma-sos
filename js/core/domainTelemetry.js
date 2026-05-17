// =============================================================================
// TEAMTOWERS SOS V11 — DOMAIN TELEMETRY (v127)
// Ruta · /js/core/domainTelemetry.js
//
// Recull mètriques agregades de la detecció de dominis · permet a @alvaro
// veure si el detector està cobrint la realitat dels projectes creats.
//
// Mètriques ·
//   - total projectes amb detecció intentada
//   - % cobert (kw+llm) vs business-generic vs cap detecció
//   - distribució per domain (quins són els més freqüents)
//   - via stats (keywords vs LLM fallback · cost mig)
//
// Storage · KB nodes type='domain_telemetry_event' · agregació pure helpers.
// Privacy · NO emmagatzemem el text del projecte · només l'id i el resultat.
// =============================================================================

import { KB } from './kb.js';

export const TELEMETRY_VERSION = 'v1.0';
export const TELEMETRY_EVENT_TYPE = 'domain_telemetry_event';

// recordDetection · async · persisteix un event de detecció al KB
// Idempotent per projectId · si ja existeix · actualitza (l'última detecció gana)
export async function recordDetection({
    projectId,
    name = null,
    sector = null,
    detection = null,
    durationMs = 0,
    costEur = 0,
} = {}) {
    if (!projectId) return null;
    const now = Date.now();
    const node = {
        id:   'domain-telemetry-' + projectId,
        type: TELEMETRY_EVENT_TYPE,
        content: {
            projectId,
            projectName:  name || null,
            sector:       sector || null,
            domain:       detection?.domain || null,
            label:        detection?.label || null,
            via:          detection?.via || (detection ? 'keywords' : 'none'),
            confidence:   detection?.confidence ?? null,
            composite:    detection?.composite === true,
            components:   detection?.components || null,
            matchCount:   detection?.matchCount ?? null,
            archetypesCount: detection?.archetypes?.length || 0,
            durationMs,
            costEur,
            recordedAt:   now,
        },
        keywords: [
            'type:domain_telemetry',
            'project:' + projectId,
            'domain:' + (detection?.domain || 'none'),
            'via:' + (detection?.via || 'none'),
        ],
        createdAt: now,
        updatedAt: now,
    };
    try { await KB.upsert(node); } catch (_) { /* silent · telemetry mai trenca app */ }
    return node;
}

// queryDetections · async · retorna tots els events recents
export async function queryDetections({ sinceDays = 30, kb = KB } = {}) {
    if (!kb || typeof kb.query !== 'function') return [];
    try {
        const all = (await kb.query({ type: TELEMETRY_EVENT_TYPE })) || [];
        const cutoff = Date.now() - (sinceDays * 86_400_000);
        return all
            .filter(n => (n.content?.recordedAt || 0) >= cutoff)
            .sort((a, b) => (b.content?.recordedAt || 0) - (a.content?.recordedAt || 0));
    } catch (_) { return []; }
}

// summarizeDetections · pure · accepta llista d'events i retorna stats
// agregats. Sense KB · 100% testejable.
export function summarizeDetections(events = []) {
    if (!Array.isArray(events) || events.length === 0) {
        return {
            total: 0,
            byDomain:   {},
            byVia:      {},
            bySector:   {},
            covered:    0,
            uncovered:  0,
            businessGenericCount: 0,
            coveragePct:        0,
            llmFallbackPct:     0,
            avgConfidence:      0,
            avgCostEur:         0,
            avgDurationMs:      0,
            topDomains:         [],
        };
    }
    const stats = {
        total:        events.length,
        byDomain:     {},
        byVia:        {},
        bySector:     {},
        covered:      0,
        uncovered:    0,
        businessGenericCount: 0,
    };
    let confSum = 0, confN = 0;
    let costSum = 0, durSum = 0;
    for (const ev of events) {
        const c = ev.content || {};
        const d = c.domain || 'none';
        const v = c.via    || 'none';
        const s = c.sector || 'unknown';
        stats.byDomain[d] = (stats.byDomain[d] || 0) + 1;
        stats.byVia[v]    = (stats.byVia[v]    || 0) + 1;
        stats.bySector[s] = (stats.bySector[s] || 0) + 1;
        if (d && d !== 'none' && d !== 'business-generic') stats.covered++;
        else if (d === 'business-generic') { stats.businessGenericCount++; stats.uncovered++; }
        else stats.uncovered++;
        if (typeof c.confidence === 'number') { confSum += c.confidence; confN++; }
        costSum += Number(c.costEur || 0);
        durSum  += Number(c.durationMs || 0);
    }
    stats.coveragePct    = Number(((stats.covered    / stats.total) * 100).toFixed(1));
    stats.llmFallbackPct = Number((((stats.byVia.llm || 0) / stats.total) * 100).toFixed(1));
    stats.avgConfidence  = confN ? Number((confSum / confN).toFixed(2)) : 0;
    stats.avgCostEur     = Number((costSum / stats.total).toFixed(6));
    stats.avgDurationMs  = Math.round(durSum / stats.total);
    stats.topDomains = Object.entries(stats.byDomain)
        .sort((a, b) => b[1] - a[1]).slice(0, 8)
        .map(([id, n]) => ({ id, count: n, pct: Number(((n / stats.total) * 100).toFixed(1)) }));
    return stats;
}

// detectionsByDomain · agrupació detallada per domain · útil per a UI
export function detectionsByDomain(events = []) {
    const groups = {};
    for (const ev of events) {
        const d = ev.content?.domain || 'none';
        if (!groups[d]) groups[d] = [];
        groups[d].push(ev);
    }
    return groups;
}
