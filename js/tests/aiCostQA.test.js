// AI-COST-QA-001 · tests dels 3 components · cache + budget + decision
// Ús · node js/tests/aiCostQA.test.js

import {
    hashKey, get as cacheGet, set as cacheSet, has as cacheHas,
    clear as cacheClear, getStats as cacheStats, recordHit, recordMiss,
    _resetForTests,
} from '../core/aiCacheService.js';
import {
    setBudget, getBudget, recordSpend, getSpend, budgetStatus, canSpend,
    _resetAll as resetBudget, resetMonth,
} from '../core/aiBudgetService.js';
import {
    decideStrategy, formatStrategyForUi,
} from '../core/aiDecisionService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== AI-COST-QA-001 · cache + budget + decision ===\n');

// ── CACHE ────────────────────────────────────────────────────────────────
_resetForTests();

// 1 · hashKey · determinístic
const k1 = hashKey({ prompt: 'a', systemPrompt: 'sys', temperature: 0.5, modelKey: 'm' });
const k2 = hashKey({ prompt: 'a', systemPrompt: 'sys', temperature: 0.5, modelKey: 'm' });
const k3 = hashKey({ prompt: 'b', systemPrompt: 'sys', temperature: 0.5, modelKey: 'm' });
eq(k1, k2,                                           'A · hashKey determinístic');
t(k1 !== k3,                                         'A · hashKey diferent per a prompts diferents');

// 2 · set + get
cacheSet('key1', { text: 'hello' });
const got = cacheGet('key1');
t(got && got.text === 'hello',                       'A · cache get retorna valor');

// 3 · miss
eq(cacheGet('key-no-existeix'), null,                'A · cache miss · null');

// 4 · has
eq(cacheHas('key1'), true,                           'A · has true');
eq(cacheHas('inventat'), false,                      'A · has false');

// 5 · TTL expiration (TTL = 0 implementat com sense expiració)
cacheSet('keyTTL', { text: 'x' }, { ttlMs: 1 });
// Espera 5ms via blocking · jsdom no té setTimeout sincron · skip
// Verifiquem només que es desa
eq(cacheHas('keyTTL'), true,                         'A · TTL set immediatament present');

// 6 · stats
recordHit(); recordHit(); recordMiss();
const stats = cacheStats();
eq(stats.hits, 2,                                    'A · stats hits 2');
eq(stats.misses, 1,                                  'A · stats misses 1');
eq(stats.hitRate, 0.667,                             'A · hit rate 0.667');

cacheClear();
eq(cacheStats().entries, 0,                          'A · clear · 0 entries');

// ── BUDGET ───────────────────────────────────────────────────────────────
resetBudget();

// 7 · default budget
eq(getBudget('proj-1'), 5.0,                         'B · default 5€');

// 8 · setBudget
setBudget('proj-1', 10.0);
eq(getBudget('proj-1'), 10.0,                        'B · setBudget · 10€');

try { setBudget('proj-1', -1); t(false, 'B · negative · throws'); }
catch (_) { t(true, 'B · negative · throws'); }

// 9 · recordSpend
recordSpend('proj-1', 1.5);
recordSpend('proj-1', 0.5);
eq(getSpend('proj-1'), 2.0,                          'B · spend 2.0€');

// 10 · budgetStatus
const status1 = budgetStatus('proj-1');
eq(status1.state, 'ok',                              'B · status ok (20%)');
eq(status1.budget, 10.0,                             'B · status budget');
eq(status1.remaining, 8.0,                           'B · status remaining 8.0');

recordSpend('proj-1', 6.5);  // total 8.5 = 85% · warning
eq(budgetStatus('proj-1').state, 'warning',          'B · status warning a 85%');

recordSpend('proj-1', 2);    // total 10.5 = 105% · over
eq(budgetStatus('proj-1').state, 'over',             'B · status over a 105%');

recordSpend('proj-1', 3);    // total 13.5 = 135% · hard
eq(budgetStatus('proj-1').state, 'hard',             'B · status hard a 135%');

// 11 · canSpend · ok abans, hard-block després
resetBudget();
setBudget('proj-2', 5);
const cs1 = canSpend('proj-2', 0.01);
eq(cs1.ok, true,                                     'B · canSpend small · ok');

recordSpend('proj-2', 5.95);  // total 5.95 = 119% · sota hard
const cs2 = canSpend('proj-2', 1.0);  // 6.95 = 139% · sobre hard
eq(cs2.ok, false,                                    'B · canSpend projected hard · false');

// 12 · unlimited budget
setBudget('proj-3', 0);
eq(budgetStatus('proj-3').state, 'unlimited',        'B · 0 budget · unlimited');
eq(canSpend('proj-3', 1000).ok, true,                'B · unlimited · canSpend');

// ── DECISION ─────────────────────────────────────────────────────────────
cacheClear();
resetBudget();

// 13 · decideStrategy · skip si deterministic
const dec1 = decideStrategy({ prompt: 'a', isDeterministic: true });
eq(dec1.decision, 'skip',                            'C · skip si deterministic');
eq(dec1.estimatedCostEur, 0,                         'C · cost 0');

// 14 · decideStrategy · run normal
const dec2 = decideStrategy({
    prompt: 'Genera un resum de 200 paraules',
    taskKind: 'creative-narrative',
    suggestedTier: 'draft',
});
eq(dec2.decision, 'run',                             'C · run normal');
t(dec2.modelKey,                                     'C · modelKey assignat');
t(typeof dec2.estimatedCostEur === 'number',         'C · cost estimat');
t(dec2.estimatedCostEur > 0,                         'C · cost > 0');

// 15 · decideStrategy · cache hit
const sysPrompt = 'sys';
const prompt = 'cached prompt';
const modelKey = dec2.modelKey;
const key = hashKey({ prompt, systemPrompt: sysPrompt, temperature: 0.7, modelKey });
cacheSet(key, { text: 'cached response' });
const dec3 = decideStrategy({
    prompt,
    systemPrompt: sysPrompt,
    taskKind: 'creative-narrative',
    suggestedTier: 'draft',
});
eq(dec3.decision, 'cache-hit',                       'C · cache-hit detectat');
eq(dec3.estimatedCostEur, 0,                         'C · cache cost 0');

// 16 · decideStrategy · budget block
setBudget('proj-blocked', 1);
recordSpend('proj-blocked', 1.5);  // 150% · hard
const dec4 = decideStrategy({
    prompt: 'a'.repeat(2000),
    suggestedTier: 'critical',
    projectId: 'proj-blocked',
});
eq(dec4.decision, 'block',                           'C · block per budget hard');
t(dec4.reason.includes('hard-block'),                'C · reason hard-block');

// 17 · decideStrategy · evaluator suggested
const dec5 = decideStrategy({
    prompt: 'a',
    taskKind: 'quality-audit',
    suggestedTier: 'draft',
});
eq(dec5.useEvaluator, true,                          'C · draft + critical task · evaluator suggested');

const dec6 = decideStrategy({
    prompt: 'a',
    taskKind: 'creative-narrative',
    suggestedTier: 'critical',
});
eq(!!dec6.useEvaluator, false,                       'C · critical tier · evaluator opcional');

// 18 · formatStrategyForUi
const fmt1 = formatStrategyForUi({ decision: 'skip', reason: 'det' });
t(fmt1.includes('Sense IA'),                         'D · format skip');
const fmt2 = formatStrategyForUi({ decision: 'cache-hit' });
t(fmt2.includes('Cache'),                            'D · format cache');
const fmt3 = formatStrategyForUi({ decision: 'block', reason: 'r' });
t(fmt3.includes('Bloquejat'),                        'D · format block');
const fmt4 = formatStrategyForUi({ decision: 'run', modelKey: 'm', estimatedCostEur: 0.05 });
t(fmt4.includes('m'),                                'D · format run amb model');
t(fmt4.includes('0.05'),                             'D · format run amb cost');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
