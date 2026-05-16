// D4 · sprint analysis & design · tests stand-alone per al tier visible.
// Ús · node js/tests/aiTier.test.js

import * as r from '../core/aiRouterService.js';
import * as ct from '../core/aiCostTracker.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== D4 · aiTier (router tier + cost tracker) ===\n');

// 1 · TASK_TIERS exposat
t(Array.isArray(r.TASK_TIERS) && r.TASK_TIERS.length === 3, 'A · TASK_TIERS · 3 valors');
t(r.TASK_TIERS.includes('draft'),     'A · draft inclós');
t(r.TASK_TIERS.includes('quality'),   'A · quality inclós');
t(r.TASK_TIERS.includes('critical'),  'A · critical inclós');

// 2 · pickModelForTier · retorna modelKey vàlid per cada tier
const draftKey    = r.pickModelForTier({ taskKind: 'creative-narrative', taskTier: 'draft' });
const qualityKey  = r.pickModelForTier({ taskKind: 'creative-narrative', taskTier: 'quality' });
const criticalKey = r.pickModelForTier({ taskKind: 'creative-narrative', taskTier: 'critical' });
t(!!r.AI_MODELS[draftKey],    'B · pickModelForTier · draft retorna model vàlid');
t(!!r.AI_MODELS[qualityKey],  'B · pickModelForTier · quality retorna model vàlid');
t(!!r.AI_MODELS[criticalKey], 'B · pickModelForTier · critical retorna model vàlid');

// 3 · La progressió de quality és creixent (draft ≤ quality ≤ critical)
const qDraft    = r.AI_MODELS[draftKey].quality;
const qQuality  = r.AI_MODELS[qualityKey].quality;
const qCritical = r.AI_MODELS[criticalKey].quality;
t(qDraft <= qQuality && qQuality <= qCritical, `B · quality creixent · ${qDraft} ≤ ${qQuality} ≤ ${qCritical}`);

// 4 · Tier desconegut · fallback a quality
const fallbackKey = r.pickModelForTier({ taskKind: 'creative-narrative', taskTier: 'inventat-no-existeix' });
t(!!r.AI_MODELS[fallbackKey], 'B · pickModelForTier · tier desconegut · fallback no-null');

// 5 · estimateTokensFromText
eq(r.estimateTokensFromText(''),        0,    'C · estimateTokens · buit · 0');
eq(r.estimateTokensFromText('abcd'),    1,    'C · estimateTokens · 4 chars · 1 token');
eq(r.estimateTokensFromText('a'.repeat(400)), 100, 'C · estimateTokens · 400 chars · 100 tokens');

// 6 · estimatePromptCostEur · cost positiu per a un model conegut
const cost = r.estimatePromptCostEur({
    modelKey: 'openai/gpt-4o-mini',
    prompt:   'a'.repeat(4000),  // ≈ 1000 input tokens
    expectedOutputTokens: 500,
});
t(typeof cost === 'number' && cost > 0, `C · estimatePromptCostEur · cost > 0 · ${cost}`);

// 7 · estimatePromptCostEur · modelKey desconegut · null
const costNull = r.estimatePromptCostEur({ modelKey: 'foo/bar', prompt: 'x', expectedOutputTokens: 100 });
eq(costNull, null, 'C · estimatePromptCostEur · model desconegut · null');

// 8 · Cost tracker · recordUsage + getSessionTotal
// (en entorn node sense window · les funcions han de no-tirar i retornar 0)
ct._resetSession();
const entry = ct.recordUsage({
    modelKey: 'openai/gpt-4o-mini',
    usage: { inputTokens: 1000, outputTokens: 500 },
    taskKind: 'creative-narrative',
    taskTier: 'draft',
    projectId: 'test-project-001',
});
t(entry && entry.costUsd > 0, `D · recordUsage · retorna entry amb costUsd > 0 · ${entry?.costUsd}`);
t(ct.getSessionTotalUsd() > 0, `D · getSessionTotalUsd · acumulat > 0 · ${ct.getSessionTotalUsd()}`);
t(ct.getSessionTotalEur() > 0, `D · getSessionTotalEur · acumulat > 0 · ${ct.getSessionTotalEur()}`);

// 9 · Cost tracker · una segona crida · acumulació
const totalBefore = ct.getSessionTotalUsd();
ct.recordUsage({
    modelKey: 'anthropic/haiku-4.5',
    usage: { inputTokens: 500, outputTokens: 200 },
});
const totalAfter = ct.getSessionTotalUsd();
t(totalAfter > totalBefore, `D · recordUsage · acumula · ${totalBefore} < ${totalAfter}`);

// 10 · formatCostEur · formats
eq(ct.formatCostEur(0),        '<0.01 €', 'D · formatCostEur · 0 · <0.01 €');
eq(ct.formatCostEur(0.005),    '<0.01 €', 'D · formatCostEur · 0.005 · <0.01 €');
eq(ct.formatCostEur(0.123),    '0.123 €', 'D · formatCostEur · 0.123 · 0.123 €');
eq(ct.formatCostEur(1.5),      '1.50 €',  'D · formatCostEur · 1.5 · 1.50 €');

// 11 · previewCostEur · estimació sense gravar
const tBefore = ct.getSessionTotalUsd();
const preview = ct.previewCostEur({
    modelKey: 'openai/gpt-4o-mini',
    inputTokens: 100,
    outputTokens: 100,
});
const tAfter = ct.getSessionTotalUsd();
eq(tAfter, tBefore,   'D · previewCostEur · no muta sessió');
t(typeof preview === 'number' && preview > 0, `D · previewCostEur · valor > 0 · ${preview}`);

// 12 · TIER_QUALITY_RANGE consistent
t(typeof r.TIER_QUALITY_RANGE === 'object',    'E · TIER_QUALITY_RANGE exposat');
t(r.TIER_QUALITY_RANGE.draft.max <= r.TIER_QUALITY_RANGE.quality.max, 'E · draft.max ≤ quality.max');
t(r.TIER_QUALITY_RANGE.quality.max <= r.TIER_QUALITY_RANGE.critical.max, 'E · quality.max ≤ critical.max');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
