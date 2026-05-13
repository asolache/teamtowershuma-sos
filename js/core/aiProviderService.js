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

async function _readApiKey(provider) {
    if (_apiKeyResolver) return _apiKeyResolver(provider);
    const cached = _apiKeyCache.get(provider);
    if (_isFreshCache(cached)) return cached.key;
    try {
        const { KB } = await import('./kb.js');
        await KB.init();
        const node = await KB.getNode('api-keys-sos');
        const key  = node?.content?.[provider] || null;
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

// ── Stubs · resta de providers (placeholder per a sprint B' futur) ─────────
async function _stubProvider(provider, modelKey, ctx) {
    const apiKey = await _readApiKey(provider);
    if (!apiKey) {
        const e = new Error('no-api-key · ' + provider + ' · configura a /settings');
        e.code = 'no-api-key'; e.provider = provider;
        throw e;
    }
    // Provider implementation pendent · sprint B' del IA-ROUTER-001
    const e = new Error(provider + ' · adapter no implementat encara · usa anthropic o fallback');
    e.code = 'provider-not-implemented'; e.provider = provider;
    throw e;
}

const _openaiGenerate   = (k, ctx, opts) => _stubProvider('openai',   k, ctx, opts);
const _geminiGenerate   = (k, ctx, opts) => _stubProvider('gemini',   k, ctx, opts);
const _deepseekGenerate = (k, ctx, opts) => _stubProvider('deepseek', k, ctx, opts);
const _minimaxGenerate  = (k, ctx, opts) => _stubProvider('minimax',  k, ctx, opts);

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
