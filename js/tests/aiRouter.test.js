// IA-ROUTER-001 sprint A · tests stand-alone per aiRouterService.
// Ús: node js/tests/aiRouter.test.js

import * as r from '../core/aiRouterService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== IA-ROUTER-001 sprint A · aiRouterService ===\n');

// 1 · Catàleg complet i congelat
t(typeof r.AI_MODELS === 'object',                                    'A · AI_MODELS exportat');
t(Object.isFrozen(r.AI_MODELS),                                       'A · AI_MODELS congelat');
t(Array.isArray(r.MODEL_IDS) && r.MODEL_IDS.length >= 12,             'A · MODEL_IDS · 12+ modèls');

// 2 · Cada modèl té shape complet
const allValid = r.MODEL_IDS.every(k => {
    const m = r.AI_MODELS[k];
    return m.provider && m.id && m.tier && m.kind &&
           typeof m.quality === 'number' &&
           m.pricing && typeof m.pricing.input === 'number' && typeof m.pricing.output === 'number' &&
           typeof m.contextK === 'number';
});
t(allValid,                                                           'A · cada modèl té shape válid');

// 3 · Providers presents · 5 esperats
const providers = new Set(r.MODEL_IDS.map(k => r.AI_MODELS[k].provider));
t(providers.has('anthropic'),                                         'A · provider anthropic');
t(providers.has('openai'),                                            'A · provider openai');
t(providers.has('gemini'),                                            'A · provider gemini');
t(providers.has('deepseek'),                                          'A · provider deepseek');
t(providers.has('minimax'),                                           'A · provider minimax');

// 4 · TASK_ROUTING · totes les chains válides
t(Array.isArray(r.TASK_KINDS) && r.TASK_KINDS.length >= 8,            'B · TASK_KINDS · 8+ tasques');
const allChainsValid = r.TASK_KINDS.every(tk => {
    const c = r.TASK_ROUTING[tk];
    return c.primary && c.fallback && c.premium &&
           r.AI_MODELS[c.primary] && r.AI_MODELS[c.fallback] && r.AI_MODELS[c.premium];
});
t(allChainsValid,                                                     'B · cada chain referencia modèls existents');

// 5 · getModelChain
const chain = r.getModelChain('creative-narrative');
eq(chain.length,       3,                                             'B · creative-narrative chain · 3 modèls');
eq(chain[0],           'anthropic/sonnet-4.6',                        'B · creative primary · sonnet-4.6');
eq(chain[2],           'anthropic/opus-4.7',                          'B · creative premium · opus-4.7');

// 6 · taskKind inexistent · null/empty
t(r.getRouting('nope') === null,                                      'B · taskKind inexistent · null');
t(r.getModelChain('nope').length === 0,                               'B · taskKind inexistent · chain buida');

// 7 · estimateCostUsd · matemàtica bàsica
// Haiku 4.5 · $1 input + $5 output / 1M
// 100k input + 50k output → 0.10 + 0.25 = 0.35 USD
const c1 = r.estimateCostUsd('anthropic/haiku-4.5', { inputTokens: 100_000, outputTokens: 50_000 });
eq(c1,                 0.35,                                          'C · haiku 100k/50k · $0.35');

// 8 · Opus 4.7 més car que Haiku per a mateixos tokens
const c2 = r.estimateCostUsd('anthropic/opus-4.7', { inputTokens: 100_000, outputTokens: 50_000 });
t(c2 > c1 * 10,                                                       'C · opus >> haiku · gap ~22x');

// 9 · Gemini Flash-Lite és el més barat dels generals
const cFL = r.estimateCostUsd('gemini/2.5-flash-lite', { inputTokens: 100_000, outputTokens: 50_000 });
t(cFL < cFL + 0.001 && cFL < c1,                                      'C · flash-lite < haiku per a same tokens');

// 10 · Cost = 0 si tokens 0
eq(r.estimateCostUsd('anthropic/sonnet-4.6', { inputTokens: 0, outputTokens: 0 }), 0, 'C · 0 tokens · 0 cost');

// 11 · estimateCostEur · USD * 0.92
const costUsd = r.estimateCostUsd('anthropic/sonnet-4.6', { inputTokens: 10_000, outputTokens: 5_000 });
const costEur = r.estimateCostEur('anthropic/sonnet-4.6', { inputTokens: 10_000, outputTokens: 5_000 });
t(Math.abs(costEur - costUsd * 0.92) < 0.001,                         'C · estimateCostEur = USD * 0.92');

// 12 · estimateCost amb modèl inexistent · null
eq(r.estimateCostUsd('nope/nope', { inputTokens: 1000 }), null,       'C · modèl inexistent · null');

// 13 · pickModelForBudget · budget alt · agafa premium
const pick1 = r.pickModelForBudget({
    taskKind: 'creative-narrative',
    budgetEur: 10,
    inputTokens: 1000, outputTokens: 500,
});
t(pick1 && pick1.withinBudget,                                        'D · budget 10€ · cap dins');
eq(pick1.key,          'anthropic/opus-4.7',                          'D · budget alt · agafa opus (premium)');

// 14 · pickModelForBudget · budget zero · cap el més barat
const pick2 = r.pickModelForBudget({
    taskKind: 'creative-narrative',
    budgetEur: 0,
    inputTokens: 1000, outputTokens: 500,
});
t(pick2 && !pick2.withinBudget,                                       'D · budget 0€ · cap dins · retorna cheapest');
// El més barat de la chain creative · openai/gpt-4o (fallback) o sonnet · cheapest_index
t(pick2.key === 'openai/gpt-4o' || pick2.key === 'anthropic/sonnet-4.6', 'D · budget zero · cheapest de la chain');

// 15 · pickModelForBudget · taskKind invàlid
const pickX = r.pickModelForBudget({ taskKind: 'nope', budgetEur: 1 });
eq(pickX,              null,                                          'D · taskKind invàlid · null');

// 16 · runEscalation · primary passa l'evaluator → para
let genCalls = 0;
let evalCalls = 0;
const fakeGen = async (modelKey, ctx) => { genCalls++; return 'OUT-' + modelKey; };
const fakeEvalAlwaysOk = async (output) => { evalCalls++; return { ok: true, score: 0.95 }; };
const run1 = await r.runEscalation({
    taskKind: 'schema-fill-simple',
    generate: fakeGen,
    evaluate: fakeEvalAlwaysOk,
});
eq(genCalls,           1,                                             'E · evaluator OK · 1 sola crida generate');
eq(evalCalls,          1,                                             'E · evaluator OK · 1 sola crida eval');
eq(run1.modelKey,      'gemini/2.5-flash',                            'E · returns primary key');
t(run1.output && run1.output.startsWith('OUT-'),                      'E · output propagat');

// 17 · runEscalation · primary falla · escalate to fallback
genCalls = 0; evalCalls = 0;
let evalReturn = [false, true];   // primer fail, després ok
const evalSeq = async (output) => { evalCalls++; const v = evalReturn.shift(); return v ? { ok:true } : { ok:false, reason:'low-quality' }; };
const run2 = await r.runEscalation({
    taskKind: 'schema-fill-simple',
    generate: fakeGen,
    evaluate: evalSeq,
});
eq(genCalls,           2,                                             'E · primary fail · 2 generate calls');
eq(run2.modelKey,      'deepseek/v3',                                 'E · fallback usat (deepseek/v3)');

// 18 · runEscalation · tots fallen · escalatedExhausted
evalReturn = [];
const fakeEvalAlwaysFail = async () => ({ ok:false, reason:'always-bad' });
const run3 = await r.runEscalation({
    taskKind: 'schema-fill-simple',
    generate: fakeGen,
    evaluate: fakeEvalAlwaysFail,
});
t(run3.escalatedExhausted === true,                                   'E · tots fallen · escalatedExhausted');
eq(run3.modelKey,      null,                                          'E · sense modèl winner');
t(run3.attempts.length === 3,                                         'E · 3 attempts loggats');

// 19 · runEscalation · stopAt 'primary' · no escalate
genCalls = 0;
const run4 = await r.runEscalation({
    taskKind: 'schema-fill-simple',
    generate: fakeGen,
    evaluate: fakeEvalAlwaysFail,
    stopAt: 'primary',
});
eq(genCalls,           1,                                             'E · stopAt primary · 1 crida');
t(run4.escalatedExhausted === true,                                   'E · stopAt primary · exhausted');

// 20 · runEscalation · sense evaluator · retorna primary directament
genCalls = 0; evalCalls = 0;
const run5 = await r.runEscalation({
    taskKind: 'tag-generation',
    generate: fakeGen,
    evaluate: null,
});
eq(genCalls,           1,                                             'E · sense evaluator · 1 crida (no eval)');
eq(run5.modelKey,      'gemini/2.5-flash-lite',                       'E · sense evaluator · agafa primary');

// 21 · Quality property · opus = 5
eq(r.AI_MODELS['anthropic/opus-4.7'].quality, 5,                      'F · opus quality 5 (frontier)');
eq(r.AI_MODELS['gemini/2.5-flash-lite'].quality, 2,                   'F · flash-lite quality 2 (micro)');

// 22 · Context window màxim · Gemini 2.5 Pro · 2M tokens
t(r.AI_MODELS['gemini/2.5-pro'].contextK >= 1000,                     'F · gemini-pro context ≥1M');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
