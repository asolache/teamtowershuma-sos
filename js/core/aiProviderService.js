// =============================================================================
// TEAMTOWERS SOS V11 — AI PROVIDER SERVICE (IA-ROUTER-001 sprint B)
//
// Capa fina d'adaptació que `runEscalation` crida amb el modelKey + ctx.
// Aquesta funció:
//   1. Mira AI_MODELS[modelKey].provider
//   2. Llegeix la API key configurada per l'usuari a /settings
//   3. Crida l'endpoint corresponent
//   4. Compta tokens reals retornats per al cost real
//
// Filosofia · adaptació mínima per provider. Anthropic implementat
// complet (provider més madur · API simple · streaming opcional). La
// resta tenen stubs que detecten "no api key" + missatge útil.
//
// Cada adapter rep { systemPrompt, userPrompt, maxOutputTokens, temperature }
// i retorna { text, usage: { inputTokens, outputTokens }, modelKey,
// finishReason }. Si l'API key falta, llança { error: 'no-api-key',
// provider } perquè el runEscalation pugui escalate.
// =============================================================================

import { AI_MODELS, estimateCostUsd } from './aiRouterService.js';

// ── KB-bound API key loader · idempotent · cache 60s ───────────────────────
const _apiKeyCache = new Map();   // provider → { key, fetchedAt }
const _CACHE_TTL_MS = 60_000;

function _isFreshCache(entry) {
    return entry && (Date.now() - entry.fetchedAt < _CACHE_TTL_MS);
}

// Resolver de KB · busca node `api_keys` amb estructura { content: { anthropic, openai, gemini, deepseek, minimax } }
// Per a tests · setApiKeyResolver injecta una funció custom.
let _apiKeyResolver = null;
export function setApiKeyResolver(fn) { _apiKeyResolver = (typeof fn === 'function') ? fn : null; }

// BIZ-MODEL-001 sprint B refinament · llegim del mateix node KB que el
// /settings UI ja escriu (via Orchestrator.setApiKey) · zero UI dual.
// Nodes · `sos_key_{provider}` amb { value: 'sk-...' }
async function _readApiKey(provider) {
    if (_apiKeyResolver) return _apiKeyResolver(provider);
    const cached = _apiKeyCache.get(provider);
    if (_isFreshCache(cached)) return cached.key;
    try {
        const { KB } = await import('./kb.js');
        await KB.init();
        // Prioritat 1 · format Orchestrator (UI existent a /settings)
        const orchNode = await KB.getNode('sos_key_' + provider);
        let key = orchNode?.value || null;
        // Prioritat 2 · format unified api-keys-sos (fallback legacy)
        if (!key) {
            const bundleNode = await KB.getNode('api-keys-sos');
            key = bundleNode?.content?.[provider] || null;
        }
        _apiKeyCache.set(provider, { key, fetchedAt: Date.now() });
        return key;
    } catch (_) {
        return null;
    }
}

// ── Anthropic adapter ──────────────────────────────────────────────────────
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

async function _anthropicGenerate(modelKey, ctx = {}, { fetchFn = (typeof fetch !== 'undefined' ? fetch : null) } = {}) {
    if (!fetchFn) throw new Error('anthropic · fetch unavailable');
    const apiKey = await _readApiKey('anthropic');
    if (!apiKey) {
        const e = new Error('no-api-key · anthropic · configura a /settings');
        e.code = 'no-api-key'; e.provider = 'anthropic';
        throw e;
    }
    const model = AI_MODELS[modelKey];
    if (!model) throw new Error('anthropic · modelKey unknown · ' + modelKey);
    const body = {
        model:       model.id,
        max_tokens:  ctx.maxOutputTokens || 1024,
        temperature: typeof ctx.temperature === 'number' ? ctx.temperature : 0.4,
        system:      ctx.systemPrompt || '',
        messages: [{ role: 'user', content: ctx.userPrompt || '' }],
    };
    let res;
    try {
        res = await fetchFn(ANTHROPIC_API, {
            method:  'POST',
            headers: {
                'x-api-key':         apiKey,
                'anthropic-version': ANTHROPIC_VERSION,
                'content-type':      'application/json',
                'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify(body),
        });
    } catch (e) {
        throw new Error('anthropic · fetch failed · ' + (e?.message || 'unknown'));
    }
    if (!res.ok) {
        let detail = null;
        try { detail = (await res.json())?.error?.message; } catch (_) {}
        throw new Error('anthropic · http ' + res.status + (detail ? ' · ' + detail : ''));
    }
    const data = await res.json();
    const text = Array.isArray(data?.content)
        ? data.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
        : '';
    return {
        text,
        usage: {
            inputTokens:  data?.usage?.input_tokens || 0,
            outputTokens: data?.usage?.output_tokens || 0,
        },
        modelKey,
        finishReason: data?.stop_reason || 'unknown',
        raw: data,
    };
}

// ── OpenAI adapter (Chat Completions API) ────────────────────────────────
const OPENAI_API = 'https://api.openai.com/v1/chat/completions';

async function _openaiGenerate(modelKey, ctx = {}, { fetchFn = (typeof fetch !== 'undefined' ? fetch : null) } = {}) {
    if (!fetchFn) throw new Error('openai · fetch unavailable');
    const apiKey = await _readApiKey('openai');
    if (!apiKey) {
        const e = new Error('no-api-key · openai · configura a /settings');
        e.code = 'no-api-key'; e.provider = 'openai'; throw e;
    }
    const model = AI_MODELS[modelKey];
    if (!model) throw new Error('openai · modelKey unknown · ' + modelKey);
    const body = {
        model:       model.id,
        max_tokens:  ctx.maxOutputTokens || 1024,
        temperature: typeof ctx.temperature === 'number' ? ctx.temperature : 0.4,
        messages: [
            { role: 'system', content: ctx.systemPrompt || '' },
            { role: 'user',   content: ctx.userPrompt   || '' },
        ],
    };
    let res;
    try {
        res = await fetchFn(OPENAI_API, {
            method:  'POST',
            headers: { 'Authorization': 'Bearer ' + apiKey, 'content-type': 'application/json' },
            body:    JSON.stringify(body),
        });
    } catch (e) { throw new Error('openai · fetch failed · ' + (e?.message || 'unknown')); }
    if (!res.ok) {
        let detail = null;
        try { detail = (await res.json())?.error?.message; } catch (_) {}
        throw new Error('openai · http ' + res.status + (detail ? ' · ' + detail : ''));
    }
    const data = await res.json();
    const choice = data?.choices?.[0];
    return {
        text: choice?.message?.content || '',
        usage: {
            inputTokens:  data?.usage?.prompt_tokens     || 0,
            outputTokens: data?.usage?.completion_tokens || 0,
        },
        modelKey,
        finishReason: choice?.finish_reason || 'unknown',
        raw: data,
    };
}

// ── Gemini adapter (Generative Language API · key as query param) ─────────
const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models';

async function _geminiGenerate(modelKey, ctx = {}, { fetchFn = (typeof fetch !== 'undefined' ? fetch : null) } = {}) {
    if (!fetchFn) throw new Error('gemini · fetch unavailable');
    const apiKey = await _readApiKey('gemini');
    if (!apiKey) {
        const e = new Error('no-api-key · gemini · configura a /settings');
        e.code = 'no-api-key'; e.provider = 'gemini'; throw e;
    }
    const model = AI_MODELS[modelKey];
    if (!model) throw new Error('gemini · modelKey unknown · ' + modelKey);
    const url = GEMINI_API + '/' + encodeURIComponent(model.id) + ':generateContent?key=' + encodeURIComponent(apiKey);
    const body = {
        systemInstruction: ctx.systemPrompt ? { parts: [{ text: ctx.systemPrompt }] } : undefined,
        contents: [{ role: 'user', parts: [{ text: ctx.userPrompt || '' }] }],
        generationConfig: {
            maxOutputTokens: ctx.maxOutputTokens || 1024,
            temperature:     typeof ctx.temperature === 'number' ? ctx.temperature : 0.4,
        },
    };
    let res;
    try {
        res = await fetchFn(url, {
            method:  'POST',
            headers: { 'content-type': 'application/json' },
            body:    JSON.stringify(body),
        });
    } catch (e) { throw new Error('gemini · fetch failed · ' + (e?.message || 'unknown')); }
    if (!res.ok) {
        let detail = null;
        try { detail = (await res.json())?.error?.message; } catch (_) {}
        throw new Error('gemini · http ' + res.status + (detail ? ' · ' + detail : ''));
    }
    const data = await res.json();
    const cand = data?.candidates?.[0];
    const text = (cand?.content?.parts || []).filter(p => p && typeof p.text === 'string').map(p => p.text).join('\n');
    return {
        text,
        usage: {
            inputTokens:  data?.usageMetadata?.promptTokenCount     || 0,
            outputTokens: data?.usageMetadata?.candidatesTokenCount || 0,
        },
        modelKey,
        finishReason: cand?.finishReason || 'unknown',
        raw: data,
    };
}

// ── DeepSeek adapter (OpenAI-compatible API) ──────────────────────────────
const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';

async function _deepseekGenerate(modelKey, ctx = {}, { fetchFn = (typeof fetch !== 'undefined' ? fetch : null) } = {}) {
    if (!fetchFn) throw new Error('deepseek · fetch unavailable');
    const apiKey = await _readApiKey('deepseek');
    if (!apiKey) {
        const e = new Error('no-api-key · deepseek · configura a /settings');
        e.code = 'no-api-key'; e.provider = 'deepseek'; throw e;
    }
    const model = AI_MODELS[modelKey];
    if (!model) throw new Error('deepseek · modelKey unknown · ' + modelKey);
    const body = {
        model:       model.id,
        max_tokens:  ctx.maxOutputTokens || 1024,
        temperature: typeof ctx.temperature === 'number' ? ctx.temperature : 0.4,
        messages: [
            { role: 'system', content: ctx.systemPrompt || '' },
            { role: 'user',   content: ctx.userPrompt   || '' },
        ],
    };
    let res;
    try {
        res = await fetchFn(DEEPSEEK_API, {
            method:  'POST',
            headers: { 'Authorization': 'Bearer ' + apiKey, 'content-type': 'application/json' },
            body:    JSON.stringify(body),
        });
    } catch (e) { throw new Error('deepseek · fetch failed · ' + (e?.message || 'unknown')); }
    if (!res.ok) {
        let detail = null;
        try { detail = (await res.json())?.error?.message; } catch (_) {}
        throw new Error('deepseek · http ' + res.status + (detail ? ' · ' + detail : ''));
    }
    const data = await res.json();
    const choice = data?.choices?.[0];
    return {
        text: choice?.message?.content || '',
        usage: {
            inputTokens:  data?.usage?.prompt_tokens     || 0,
            outputTokens: data?.usage?.completion_tokens || 0,
        },
        modelKey,
        finishReason: choice?.finish_reason || 'unknown',
        raw: data,
    };
}

// ── Minimax adapter (chatcompletion_v2 · OpenAI-like) ─────────────────────
const MINIMAX_API = 'https://api.minimaxi.com/v1/text/chatcompletion_v2';

async function _minimaxGenerate(modelKey, ctx = {}, { fetchFn = (typeof fetch !== 'undefined' ? fetch : null) } = {}) {
    if (!fetchFn) throw new Error('minimax · fetch unavailable');
    const apiKey = await _readApiKey('minimax');
    if (!apiKey) {
        const e = new Error('no-api-key · minimax · configura a /settings');
        e.code = 'no-api-key'; e.provider = 'minimax'; throw e;
    }
    const model = AI_MODELS[modelKey];
    if (!model) throw new Error('minimax · modelKey unknown · ' + modelKey);
    const body = {
        model:       model.id,
        max_tokens:  ctx.maxOutputTokens || 1024,
        temperature: typeof ctx.temperature === 'number' ? ctx.temperature : 0.4,
        messages: [
            { role: 'system', content: ctx.systemPrompt || '' },
            { role: 'user',   content: ctx.userPrompt   || '' },
        ],
    };
    let res;
    try {
        res = await fetchFn(MINIMAX_API, {
            method:  'POST',
            headers: { 'Authorization': 'Bearer ' + apiKey, 'content-type': 'application/json' },
            body:    JSON.stringify(body),
        });
    } catch (e) { throw new Error('minimax · fetch failed · ' + (e?.message || 'unknown')); }
    if (!res.ok) {
        let detail = null;
        try { detail = (await res.json())?.base_resp?.status_msg || (await res.json())?.error?.message; } catch (_) {}
        throw new Error('minimax · http ' + res.status + (detail ? ' · ' + detail : ''));
    }
    const data = await res.json();
    const choice = data?.choices?.[0];
    return {
        text: choice?.message?.content || '',
        usage: {
            inputTokens:  data?.usage?.prompt_tokens     || data?.usage?.input_tokens  || 0,
            outputTokens: data?.usage?.completion_tokens || data?.usage?.output_tokens || 0,
        },
        modelKey,
        finishReason: choice?.finish_reason || 'unknown',
        raw: data,
    };
}

// ── Dispatcher · usat per runEscalation ────────────────────────────────────
export async function generateWithProvider(modelKey, ctx = {}, opts = {}) {
    const m = AI_MODELS[modelKey];
    if (!m) throw new Error('generateWithProvider · modelKey unknown · ' + modelKey);
    switch (m.provider) {
        case 'anthropic': return _anthropicGenerate(modelKey, ctx, opts);
        case 'openai':    return _openaiGenerate(modelKey,    ctx, opts);
        case 'gemini':    return _geminiGenerate(modelKey,    ctx, opts);
        case 'deepseek':  return _deepseekGenerate(modelKey,  ctx, opts);
        case 'minimax':   return _minimaxGenerate(modelKey,   ctx, opts);
        default:
            throw new Error('generateWithProvider · provider desconegut · ' + m.provider);
    }
}

// Cost real (a partir d'usage retornat per el provider real)
export function actualCostUsd(modelKey, usage) {
    return estimateCostUsd(modelKey, {
        inputTokens:  usage?.inputTokens  || 0,
        outputTokens: usage?.outputTokens || 0,
    });
}

// ── Evaluator default per a dims · JSON shape check ────────────────────────
// Si el provider retorna text que parsa com a JSON i té certs camps mínims,
// l'evaluator passa. Si no, escalate (fallback/premium).
export function makeJsonShapeEvaluator(requiredFields = []) {
    return async (output) => {
        if (!output || !output.text) {
            return { ok: false, reason: 'empty-output' };
        }
        let text = output.text.trim();
        // Treu un possible fenced ```json block
        const fenced = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
        if (fenced) text = fenced[1].trim();
        let parsed;
        try { parsed = JSON.parse(text); }
        catch (e) { return { ok: false, reason: 'not-json · ' + (e?.message || '') }; }
        for (const f of requiredFields) {
            if (parsed[f] === undefined || parsed[f] === null) {
                return { ok: false, reason: 'missing-field · ' + f };
            }
        }
        return { ok: true, score: 1.0, parsed };
    };
}

// Reset cache per a tests
export function _resetApiKeyCache() {
    _apiKeyCache.clear();
}
