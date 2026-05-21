// =============================================================================
// TEAMTOWERS SOS V11 — v145 · PROMPT QUALITY HARNESS · auto-improvement loop
// Ruta · /js/core/promptQualityHarness.js
//
// Evolució del A/B test (v132) cap a un loop automàtic de millora qualitat
// + cost · executa N cases · scoreja outputs · compara contra baseline ·
// detecta regressions / millores · suggereix accions.
//
// Filosofia · cada commit que toca prompts/vnaExpertPrompts ha de córrer
// el harness · si Δscore < -3pp o Δcost > +10% → bloqueja merge.
//
// API ·
//  · runQualityHarness({ cases, provider, builder, scoreFn?, slim?, modelKey? })
//      → { results[], aggregate, ms }
//  · compareWithBaseline({ current, baseline })
//      → { deltaScore, deltaCost, deltaTokens, regression, recommendation }
//  · serializeBaseline(current) → JSON-safe snapshot
//  · loadBaselineFromText(text) → { ok, baseline }
// =============================================================================

import { scoreOutput } from './promptABTestService.js';
import { buildPrompt } from './vnaExpertPrompts.js';

export const HARNESS_VERSION = 'v145';

// Llindars per a regression detection · configurables via opts
export const DEFAULT_THRESHOLDS = Object.freeze({
    maxScoreDrop:    3,      // pp · si avgScore baixa més de 3 pts → regression
    maxCostIncrease: 0.10,   // 10% · si cost mig augmenta més → regression
    minPassRate:     0.60,   // 60% · cases amb score ≥ 70
    passScore:       70,     // pts · score que considera "pass"
});

// ── runQualityHarness · executa N cases · scoreja · agrega ──────────────
//
// Args ·
//   cases    · [{ id, name, description, sector, vna_zoom? }]
//   provider · async fn(modelKey, opts) → { text, usage }
//   builder  · opcional · default · buildPrompt({ taskKind: 'design-value-map-rich', ... slim })
//   scoreFn  · opcional · default · scoreOutput de promptABTestService
//   slim     · default true · si false usa SYSTEM_BASE FULL
//   modelKey · default 'auto-small'
//
// Retorna ·
//   { results: [{ id, ok, score, tokens, costEur, ms, error? }],
//     aggregate: { total, ok, avgScore, passRate, avgTokens, avgCostEur, totalMs },
//     ms }
export async function runQualityHarness({
    cases = [],
    provider = null,
    builder = null,
    scoreFn = null,
    slim = true,
    modelKey = 'auto-small',
    onProgress = null,
} = {}) {
    if (!Array.isArray(cases) || cases.length === 0) {
        return { ok: false, error: 'no-cases', results: [], aggregate: null };
    }
    if (typeof provider !== 'function') {
        return { ok: false, error: 'no-provider', results: [], aggregate: null };
    }
    const _scoreFn = scoreFn || scoreOutput;
    const _builder = builder || ((ctx) => buildPrompt({ taskKind: 'design-value-map-rich', context: ctx, slim }));

    const t0 = Date.now();
    const results = [];
    let idx = 0;
    for (const c of cases) {
        idx++;
        const caseT0 = Date.now();
        const ctx = { name: c.name, description: c.description, sector: c.sector, vna_zoom: c.vna_zoom || 'mid' };
        let result = { id: c.id, ok: false };
        try {
            const prompt = _builder(ctx);
            const res = await provider(modelKey, {
                systemPrompt: prompt.system, userPrompt: prompt.user,
                temperature: 0.3, maxOutputTokens: 1800,
            });
            const text = res?.text || res?.content || '';
            const parsed = _parseJson(text);
            if (!parsed) {
                result = { id: c.id, ok: false, error: 'parse-failed', tokens: prompt.approxTokens, ms: Date.now() - caseT0 };
            } else {
                const scoreObj = _scoreFn(parsed) || { score: 0 };
                const inT  = res?.usage?.inputTokens  || prompt.approxTokens || 0;
                const outT = res?.usage?.outputTokens || 0;
                // Cost EUR · model agnostic estimat (small-tier · approx 0.0001€/k input + 0.0003€/k output)
                const costEur = (inT / 1000) * 0.0001 + (outT / 1000) * 0.0003;
                result = {
                    id: c.id, ok: true,
                    score: scoreObj.score || 0,
                    scoreBreakdown: scoreObj,
                    tokens: inT + outT,
                    inputTokens: inT,
                    outputTokens: outT,
                    costEur: +costEur.toFixed(5),
                    ms: Date.now() - caseT0,
                };
            }
        } catch (e) {
            result = { id: c.id, ok: false, error: 'provider-failed · ' + (e?.message || ''), ms: Date.now() - caseT0 };
        }
        results.push(result);
        try { onProgress?.({ idx, total: cases.length, result }); } catch (_) {}
    }

    const aggregate = aggregateResults(results);
    return { ok: true, results, aggregate, ms: Date.now() - t0 };
}

function _parseJson(text) {
    if (!text) return null;
    let t = String(text).trim();
    const fenced = t.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (fenced) t = fenced[1].trim();
    if (!t.startsWith('{')) {
        const open = t.indexOf('{'); const close = t.lastIndexOf('}');
        if (open >= 0 && close > open) t = t.slice(open, close + 1);
    }
    try { return JSON.parse(t); } catch (_) { return null; }
}

// ── aggregateResults · pure · estadístics ────────────────────────────────
export function aggregateResults(results = [], { passScore = DEFAULT_THRESHOLDS.passScore } = {}) {
    const total = results.length;
    const okResults = results.filter(r => r.ok);
    const ok = okResults.length;
    if (ok === 0) return { total, ok: 0, avgScore: 0, passRate: 0, avgTokens: 0, avgCostEur: 0 };
    const sumScore  = okResults.reduce((s, r) => s + (r.score || 0), 0);
    const sumTok    = okResults.reduce((s, r) => s + (r.tokens || 0), 0);
    const sumCost   = okResults.reduce((s, r) => s + (r.costEur || 0), 0);
    const passes    = okResults.filter(r => (r.score || 0) >= passScore).length;
    return {
        total,
        ok,
        avgScore:   +(sumScore / ok).toFixed(2),
        passRate:   +(passes / total).toFixed(3),
        avgTokens:  Math.round(sumTok / ok),
        avgCostEur: +(sumCost / ok).toFixed(5),
        totalCostEur: +sumCost.toFixed(5),
    };
}

// ── compareWithBaseline · pure · detecta regression vs millora ──────────
export function compareWithBaseline({ current, baseline, thresholds = DEFAULT_THRESHOLDS } = {}) {
    if (!current || !baseline) {
        return { ok: false, error: 'missing-current-or-baseline' };
    }
    const c = current.aggregate || current;
    const b = baseline.aggregate || baseline;
    const deltaScore  = +(c.avgScore   - b.avgScore).toFixed(2);
    const deltaCost   = b.avgCostEur > 0 ? +(((c.avgCostEur - b.avgCostEur) / b.avgCostEur) * 100).toFixed(2) : 0;
    const deltaTokens = +(c.avgTokens - b.avgTokens);
    const deltaPassRate = +((c.passRate - b.passRate) * 100).toFixed(2);

    const regression = (deltaScore < -thresholds.maxScoreDrop) || (deltaCost > thresholds.maxCostIncrease * 100);
    let recommendation;
    if (regression) {
        recommendation = '🛑 REGRESSION · revisa canvis al prompt · cas-by-cas debug';
        if (deltaScore < -thresholds.maxScoreDrop) recommendation += ` · score baixà ${deltaScore}pp`;
        if (deltaCost > thresholds.maxCostIncrease * 100) recommendation += ` · cost ↑ ${deltaCost}%`;
    } else if (deltaScore >= 3 && deltaCost <= 5) {
        recommendation = '✅ MILLORA · actualitza baseline a aquest run';
    } else if (Math.abs(deltaScore) < 1 && Math.abs(deltaCost) < 5) {
        recommendation = '⚪ ESTABLE · cap canvi significatiu';
    } else {
        recommendation = '🟡 NEUTRAL · monitor més runs abans d\'actualitzar baseline';
    }

    return {
        ok: true,
        deltaScore, deltaCost, deltaTokens, deltaPassRate,
        regression,
        recommendation,
        thresholds,
    };
}

// ── Baseline serialization ───────────────────────────────────────────────
export function serializeBaseline(current) {
    if (!current) return null;
    return {
        version: HARNESS_VERSION,
        timestamp: new Date().toISOString(),
        aggregate: current.aggregate || null,
        casesCount: (current.results || []).length,
        cases: (current.results || []).map(r => ({
            id: r.id, ok: r.ok, score: r.score || 0,
            tokens: r.tokens || 0, costEur: r.costEur || 0,
        })),
    };
}

export function loadBaselineFromText(text) {
    if (!text || typeof text !== 'string') return { ok: false, error: 'invalid-input' };
    try {
        const baseline = JSON.parse(text);
        if (!baseline.aggregate || typeof baseline.aggregate.avgScore !== 'number') {
            return { ok: false, error: 'baseline-missing-aggregate' };
        }
        return { ok: true, baseline };
    } catch (e) {
        return { ok: false, error: 'parse-failed · ' + (e?.message || '') };
    }
}
