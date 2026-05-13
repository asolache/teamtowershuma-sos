// IA-ROUTER-001 sprint B' · tests dels 5 provider adapters · mock fetch
// Ús: node js/tests/aiProviders.test.js

import * as prov from '../core/aiProviderService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== IA-ROUTER-001 sprint B/B\' · provider adapters ===\n');

// Setup resolver mock (totes les keys disponibles)
prov.setApiKeyResolver((p) => 'TEST_KEY_' + p.toUpperCase());

// Helper · construeix fetch mock que captura args + retorna response especificat
function mockFetch(returnFn, captureRef) {
    return async (url, opts) => {
        if (captureRef) {
            captureRef.url = url;
            captureRef.opts = opts;
            try { captureRef.body = JSON.parse(opts?.body || '{}'); } catch (_) { captureRef.body = null; }
        }
        return returnFn(url, opts);
    };
}

// ─── A · OpenAI (Chat Completions) ──────────────────────────────────────
const oaiCap = {};
const oaiFetch = mockFetch(() => ({
    ok: true,
    json: async () => ({
        choices: [{ message: { content: 'openai-reply' }, finish_reason: 'stop' }],
        usage:   { prompt_tokens: 120, completion_tokens: 45 },
    }),
}), oaiCap);

const r1 = await prov.generateWithProvider('openai/gpt-4o-mini', {
    systemPrompt: 'sys',
    userPrompt:   'usr',
    maxOutputTokens: 256,
    temperature: 0.2,
}, { fetchFn: oaiFetch });

eq(r1.text,                'openai-reply',                            'A · openai · text propagat');
eq(r1.usage.inputTokens,   120,                                       'A · openai · inputTokens 120');
eq(r1.usage.outputTokens,  45,                                        'A · openai · outputTokens 45');
eq(r1.modelKey,            'openai/gpt-4o-mini',                      'A · openai · modelKey');
eq(r1.finishReason,        'stop',                                    'A · openai · finishReason');
t(oaiCap.url.includes('api.openai.com'),                              'A · openai · url correcte');
t(oaiCap.opts.headers.Authorization === 'Bearer TEST_KEY_OPENAI',     'A · openai · Bearer header');
eq(oaiCap.body.model,      'gpt-4o-mini',                             'A · openai · body.model');
t(Array.isArray(oaiCap.body.messages) && oaiCap.body.messages.length === 2, 'A · openai · 2 messages');
eq(oaiCap.body.messages[0].role, 'system',                            'A · openai · message[0]=system');
eq(oaiCap.body.messages[1].role, 'user',                              'A · openai · message[1]=user');

// ─── B · Gemini (Generative Language) ───────────────────────────────────
const gemCap = {};
const gemFetch = mockFetch(() => ({
    ok: true,
    json: async () => ({
        candidates: [{
            content: { parts: [{ text: 'gemini-reply' }] },
            finishReason: 'STOP',
        }],
        usageMetadata: { promptTokenCount: 200, candidatesTokenCount: 70 },
    }),
}), gemCap);

const r2 = await prov.generateWithProvider('gemini/2.5-flash', {
    systemPrompt: 'sys-g',
    userPrompt:   'usr-g',
    maxOutputTokens: 512,
}, { fetchFn: gemFetch });

eq(r2.text,                'gemini-reply',                            'B · gemini · text propagat');
eq(r2.usage.inputTokens,   200,                                       'B · gemini · promptTokenCount → inputTokens');
eq(r2.usage.outputTokens,  70,                                        'B · gemini · candidatesTokenCount → outputTokens');
eq(r2.finishReason,        'STOP',                                    'B · gemini · finishReason');
t(gemCap.url.includes('generativelanguage.googleapis.com'),           'B · gemini · domain');
t(gemCap.url.includes('gemini-2.5-flash:generateContent'),            'B · gemini · model+method al path');
t(gemCap.url.includes('key=TEST_KEY_GEMINI'),                         'B · gemini · API key com query param');
t(gemCap.body.systemInstruction.parts[0].text === 'sys-g',            'B · gemini · systemInstruction');
t(gemCap.body.contents[0].parts[0].text === 'usr-g',                  'B · gemini · user content');
eq(gemCap.body.generationConfig.maxOutputTokens, 512,                 'B · gemini · maxOutputTokens passat');

// ─── C · DeepSeek (OpenAI-compatible) ───────────────────────────────────
const dsCap = {};
const dsFetch = mockFetch(() => ({
    ok: true,
    json: async () => ({
        choices: [{ message: { content: 'deepseek-reply' }, finish_reason: 'stop' }],
        usage:   { prompt_tokens: 80, completion_tokens: 30 },
    }),
}), dsCap);

const r3 = await prov.generateWithProvider('deepseek/v3', {
    systemPrompt: 's', userPrompt: 'u', maxOutputTokens: 200,
}, { fetchFn: dsFetch });
eq(r3.text,                'deepseek-reply',                          'C · deepseek · text');
eq(r3.usage.inputTokens,   80,                                        'C · deepseek · inputTokens');
t(dsCap.url.includes('api.deepseek.com'),                             'C · deepseek · domain');
t(dsCap.opts.headers.Authorization === 'Bearer TEST_KEY_DEEPSEEK',    'C · deepseek · Bearer');
eq(dsCap.body.model,       'deepseek-v3',                             'C · deepseek · model.id');

// ─── D · Minimax (chatcompletion_v2) ────────────────────────────────────
const mmCap = {};
const mmFetch = mockFetch(() => ({
    ok: true,
    json: async () => ({
        choices: [{ message: { content: 'minimax-reply' }, finish_reason: 'stop' }],
        usage:   { prompt_tokens: 50, completion_tokens: 20 },
    }),
}), mmCap);

const r4 = await prov.generateWithProvider('minimax/m2', {
    systemPrompt: 's', userPrompt: 'u',
}, { fetchFn: mmFetch });
eq(r4.text,                'minimax-reply',                           'D · minimax · text');
eq(r4.usage.outputTokens,  20,                                        'D · minimax · outputTokens');
t(mmCap.url.includes('api.minimaxi.com'),                             'D · minimax · domain');
t(mmCap.opts.headers.Authorization === 'Bearer TEST_KEY_MINIMAX',     'D · minimax · Bearer');

// ─── E · Sense API key · no-api-key error per cada provider ─────────────
prov._resetApiKeyCache();
prov.setApiKeyResolver(() => null);
for (const [provName, modelKey] of [
    ['openai',    'openai/gpt-4o-mini'],
    ['gemini',    'gemini/2.5-flash'],
    ['deepseek',  'deepseek/v3'],
    ['minimax',   'minimax/m2'],
    ['anthropic', 'anthropic/sonnet-4.6'],
]) {
    let err = null;
    try {
        await prov.generateWithProvider(modelKey, { systemPrompt:'s', userPrompt:'u' }, { fetchFn: async () => ({ ok:true, json:async()=>({}) }) });
    } catch (e) { err = e; }
    t(err && err.code === 'no-api-key' && err.provider === provName,  'E · ' + provName + ' · no-api-key error code/provider');
}

// ─── F · HTTP 4xx · throws amb status + detail ──────────────────────────
prov.setApiKeyResolver(() => 'TEST_KEY');
const errFetch = async () => ({
    ok:     false,
    status: 401,
    json:   async () => ({ error: { message: 'invalid key' } }),
});
let errOpenai = null;
try { await prov.generateWithProvider('openai/gpt-4o-mini', { systemPrompt:'s', userPrompt:'u' }, { fetchFn: errFetch }); }
catch (e) { errOpenai = e; }
t(errOpenai && /http 401/.test(errOpenai.message),                    'F · openai · http 401 propagat');
t(errOpenai && /invalid key/.test(errOpenai.message),                 'F · openai · detail inclòs');

// ─── G · actualCostUsd usa pricing del modèl ────────────────────────────
const cost = prov.actualCostUsd('anthropic/sonnet-4.6', { inputTokens: 1_000_000, outputTokens: 0 });
eq(cost,                   3.00,                                      'G · sonnet 4.6 · 1M input = $3.00');

const cost2 = prov.actualCostUsd('anthropic/haiku-4.5', { inputTokens: 100_000, outputTokens: 50_000 });
eq(cost2,                  0.35,                                      'G · haiku 100k/50k = $0.35');

// ─── H · KB key path · prioritat Orchestrator (sos_key_*) > bundle ─────
// El sprint del API keys UI usa Orchestrator que guarda nodes
// `sos_key_anthropic` amb { value: '...' }. aiProviderService ha de
// llegir-ne. Test amb resolver custom que simula KB lookup.
prov._resetApiKeyCache();
let lastKeyLookup = null;
prov.setApiKeyResolver((p) => {
    lastKeyLookup = p;
    // Simula que /settings ha escrit sols Anthropic
    if (p === 'anthropic') return 'sk-ant-from-settings';
    return null;
});

// Mock fetch return per fer la crida no llançar
const okFetch = async () => ({ ok: true, json: async () => ({
    content: [{ type:'text', text:'ok' }],
    usage:   { input_tokens: 10, output_tokens: 5 },
    stop_reason: 'end_turn',
})});

const rH = await prov.generateWithProvider('anthropic/sonnet-4.6', {
    systemPrompt:'s', userPrompt:'u',
}, { fetchFn: okFetch });
eq(rH.text, 'ok',                                                     'H · resolver settings · anthropic key resolt');
eq(lastKeyLookup, 'anthropic',                                        'H · resolver cridat amb provider correct');

// Reset
prov.setApiKeyResolver(null);
prov._resetApiKeyCache();

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
