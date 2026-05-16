// IA-CONTEXT-AUDIT-001 · tests del context auditor IA
// Diana · cap token malgastat · cada crida IA té rationale + budget + cache strategy auditables.

import {
    AUDITOR_VERSION, TOKEN_BUDGETS, COST_RATIO_ALERT,
    audit, getStats, listRecent, flagged,
    estimateTokensForPrompt, budgetCheck, _reset,
} from '../core/iaContextAuditor.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== IA-CONTEXT-AUDIT-001 ===\n');

_reset();

// ─── A · constants ──────────────────────────────────────────────────────
eq(AUDITOR_VERSION, 'v1.0',                              'A · version');
t(TOKEN_BUDGETS.light < TOKEN_BUDGETS.standard,          'A · budget light < standard');
t(TOKEN_BUDGETS.standard < TOKEN_BUDGETS.max,            'A · budget standard < max');
eq(COST_RATIO_ALERT, 1.5,                                'A · cost ratio alert 1.5');

// ─── B · estimateTokensForPrompt · ~ chars/4 ───────────────────────────
eq(estimateTokensForPrompt(''), 0,                       'B · empty · 0 tokens');
eq(estimateTokensForPrompt('a'.repeat(400)), 100,        'B · 400 chars · 100 tokens');
eq(estimateTokensForPrompt(null), 0,                     'B · null safe');

// ─── C · budgetCheck · pre-call validator ───────────────────────────────
{
    const r = budgetCheck({ prompt: 'a'.repeat(400), ambition: 'light' });
    t(r.ok,                                              'C · 100 tokens · light (500) · ok');
    eq(r.overBy, 0,                                       'C · ok · overBy 0');
}
{
    const r = budgetCheck({ prompt: 'a'.repeat(3000), ambition: 'light' });
    t(!r.ok,                                             'C · 750 tokens > 500 light · not ok');
    t(r.overBy > 0,                                       'C · overBy > 0');
}
{
    const r = budgetCheck({ approxTokens: 2400, ambition: 'max' });
    t(r.ok,                                              'C · 2400 tokens · max (2500) · ok');
}

// ─── D · audit · entry shape ────────────────────────────────────────────
_reset();
{
    const e = audit({
        source: 'vnaExpertPrompts',
        prompt: 'a'.repeat(800),
        ambition: 'standard',
        response: 'b'.repeat(400),
        costEstimateEur: 0.01,
        costActualEur: 0.012,
        cacheHit: false,
        ts: 1000,
    });
    eq(e.source, 'vnaExpertPrompts',                     'D · source preservat');
    eq(e.tokens, 200,                                    'D · 800 chars → 200 tokens');
    eq(e.responseTokens, 100,                            'D · 400 chars resp → 100 tokens');
    eq(e.budget, 1500,                                   'D · standard budget');
    t(!e.overBudget,                                     'D · 200 < 1500 · no over-budget');
    t(!e.overspend,                                      'D · ratio 1.2 < 1.5 · no overspend');
    t(e.promptHash && typeof e.promptHash === 'string',  'D · promptHash generat');
    eq(e.ts, 1000,                                       'D · ts injectable');
}

// ─── E · audit · over-budget detection ──────────────────────────────────
{
    const e = audit({
        source: 'iaRouterService',
        prompt: 'x'.repeat(3000),
        ambition: 'light',     // budget 500
        ts: 2000,
    });
    t(e.overBudget,                                      'E · 750 > 500 light · over-budget');
}

// ─── F · audit · overspend detection ────────────────────────────────────
{
    const e = audit({
        source: 'classify',
        prompt: 'short',
        ambition: 'standard',
        costEstimateEur: 0.005,
        costActualEur: 0.015,   // 3x estimate · > 1.5x
        ts: 3000,
    });
    t(e.overspend,                                       'F · 3x cost · overspend detectat');
    eq(e.costRatio, 3,                                   'F · costRatio 3');
}

// ─── G · audit · cache hit ──────────────────────────────────────────────
{
    const e = audit({ source: 'classify', prompt: 'cached', cacheHit: true, ts: 4000 });
    t(e.cacheHit,                                        'G · cacheHit flag preservat');
}

// ─── H · getStats · agregació ───────────────────────────────────────────
{
    const s = getStats();
    eq(s.totalCalls, 4,                                  'H · 4 entries totals');
    t(s.totalTokens > 0,                                 'H · totalTokens > 0');
    eq(s.cacheHits, 1,                                   'H · 1 cache hit');
    eq(Math.round(s.cacheHitRate * 100), 25,             'H · cache hit rate 25%');
    eq(s.overBudgetCount, 1,                             'H · 1 over-budget');
    eq(s.overspendCount, 1,                              'H · 1 overspend');
    t(s.overBudgetSources.includes('iaRouterService'),  'H · source over-budget identificat');
    t(s.overspendSources.includes('classify'),          'H · source overspend identificat');
}

// ─── I · bySource · agregació per font ─────────────────────────────────
{
    const s = getStats();
    t(s.bySource.classify,                               'I · bySource.classify present');
    eq(s.bySource.classify.calls, 2,                     'I · classify · 2 calls (overspend + cache)');
    t(s.bySource.vnaExpertPrompts.avgTokens > 0,         'I · avgTokens calculat');
}

// ─── J · duplicates detection ───────────────────────────────────────────
{
    _reset();
    // Mateix prompt 3 vegades · ha de ser detectat com a dup
    for (let i = 0; i < 3; i++) {
        audit({ source: 'iaRouter', prompt: 'IDENTICAL', ts: 1000 + i });
    }
    audit({ source: 'iaRouter', prompt: 'DIFFERENT', ts: 4000 });
    const s = getStats();
    t(s.duplicates.length >= 1,                          'J · ≥1 duplicate detectat');
    eq(s.duplicates[0].count, 3,                         'J · top dup · 3 occurrences');
}

// ─── K · listRecent · últimes N · ordre invers ─────────────────────────
{
    _reset();
    for (let i = 0; i < 5; i++) audit({ source: 's' + i, prompt: 'p' + i, ts: i });
    const recent = listRecent({ limit: 3 });
    eq(recent.length, 3,                                 'K · limit respectat');
    eq(recent[0].source, 's4',                           'K · més recent primer');
    eq(recent[2].source, 's2',                           'K · ordre invers');
}

// ─── L · flagged · només anomalies ──────────────────────────────────────
{
    _reset();
    audit({ source: 'a', prompt: 'short', ambition: 'standard' });                  // ok
    audit({ source: 'b', prompt: 'x'.repeat(3000), ambition: 'light' });            // over-budget
    audit({ source: 'c', prompt: 'short', costEstimateEur: 0.001, costActualEur: 0.005 }); // overspend
    const f = flagged();
    eq(f.length, 2,                                      'L · 2 entries flagged · cap "ok"');
    t(f.some(e => e.flags.includes('over-budget')),     'L · flag over-budget present');
    t(f.some(e => e.flags.includes('overspend')),       'L · flag overspend present');
}

// ─── M · sinceMs · filtre temporal ──────────────────────────────────────
{
    _reset();
    audit({ source: 'old', prompt: 'old', ts: 1000 });
    audit({ source: 'new', prompt: 'new', ts: 5000 });
    const s = getStats({ sinceMs: 3000 });
    eq(s.totalCalls, 1,                                  'M · només entries posteriors a sinceMs');
    t(s.bySource.new,                                    'M · "new" source present');
    t(!s.bySource.old,                                   'M · "old" filtrat');
}

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
