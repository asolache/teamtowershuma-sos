// =============================================================================
// TEAMTOWERS SOS V11 — v146 · OLLAMA LOCAL LLM PROVIDER
// Ruta · /js/core/ollamaProvider.js
//
// Item wo-llm-local-train (Part B · inference adapter) ·
// Adapter HTTP per a Ollama local · http://localhost:11434/api/generate ·
// permet usar models open-weight (llama3 · qwen2.5 · phi3 · mistral) com a
// 6è provider del catàleg AI_MODELS. Compatible interface generateWithProvider.
//
// Filosofia · Mac mid-2012 d'@alvaro pot córrer Ollama amb models quantitzats
// de 3B-7B (qwen2.5-3b · phi3-mini · llama3.2-3b) · CPU-only · 6GB RAM ·
// no fine-tune local (necessita GPU · documentat a docs/llm-local-training.md).
//
// API ·
//  · ollamaGenerate({ model, systemPrompt, userPrompt, ... }) → { text, usage }
//  · ollamaListModels({ baseUrl? }) → { ok, models[] }
//  · ollamaHealthCheck({ baseUrl? }) → { ok, version? }
//  · makeOllamaProvider({ baseUrl?, defaultModel? }) → async fn (per al harness/benchmark)
// =============================================================================

export const OLLAMA_VERSION = 'v146';

const DEFAULT_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL    = 'qwen2.5:3b';   // 1.9GB · ràpid en CPU · suficient per a tasks small-tier

// ── ollamaGenerate · single request · format JSON-mode si el model ho suporta
//
// Args ·
//   baseUrl       · default http://localhost:11434
//   model         · default qwen2.5:3b
//   systemPrompt  · sistema (Ollama natively support)
//   userPrompt    · message body
//   maxOutputTokens · default 1800
//   temperature   · default 0.3
//   format        · 'json' | null · format=json fa que Ollama retorni JSON estricte
//
// Retorna · { text, usage: { inputTokens, outputTokens }, modelKey }
export async function ollamaGenerate({
    baseUrl = DEFAULT_BASE_URL,
    model = DEFAULT_MODEL,
    systemPrompt = '',
    userPrompt = '',
    maxOutputTokens = 1800,
    temperature = 0.3,
    format = null,
    fetchFn = (typeof fetch !== 'undefined' ? fetch : null),
} = {}) {
    if (!fetchFn) throw new Error('ollama · fetch unavailable');
    if (!userPrompt) throw new Error('ollama · userPrompt required');
    const url = baseUrl.replace(/\/$/, '') + '/api/generate';
    const body = {
        model,
        prompt:  userPrompt,
        system:  systemPrompt || undefined,
        stream:  false,
        options: {
            temperature,
            num_predict: maxOutputTokens,
        },
    };
    if (format === 'json') body.format = 'json';

    let res;
    try {
        res = await fetchFn(url, {
            method:  'POST',
            headers: { 'content-type': 'application/json' },
            body:    JSON.stringify(body),
        });
    } catch (e) {
        throw new Error('ollama · connection failed · ' + (e?.message || 'is Ollama running on ' + baseUrl + '?'));
    }
    if (!res.ok) {
        let detail = '';
        try { detail = (await res.json())?.error || ''; } catch (_) {}
        throw new Error('ollama · http ' + res.status + (detail ? ' · ' + detail : ''));
    }
    const data = await res.json();
    return {
        text: data?.response || '',
        usage: {
            inputTokens:  data?.prompt_eval_count || 0,
            outputTokens: data?.eval_count        || 0,
        },
        modelKey:     'ollama/' + model,
        finishReason: data?.done_reason || 'stop',
        raw: data,
    };
}

// ── ollamaListModels · GET /api/tags ───────────────────────────────────
export async function ollamaListModels({
    baseUrl = DEFAULT_BASE_URL,
    fetchFn = (typeof fetch !== 'undefined' ? fetch : null),
} = {}) {
    if (!fetchFn) return { ok: false, error: 'fetch-unavailable', models: [] };
    const url = baseUrl.replace(/\/$/, '') + '/api/tags';
    try {
        const res = await fetchFn(url);
        if (!res.ok) return { ok: false, error: 'http ' + res.status, models: [] };
        const data = await res.json();
        const models = (data?.models || []).map(m => ({
            name:    m.name,
            size:    m.size,
            digest:  m.digest,
            details: m.details || null,
        }));
        return { ok: true, models };
    } catch (e) {
        return { ok: false, error: 'connection-failed · ' + (e?.message || ''), models: [] };
    }
}

// ── ollamaHealthCheck · GET / · verifica que Ollama corre ──────────────
export async function ollamaHealthCheck({
    baseUrl = DEFAULT_BASE_URL,
    fetchFn = (typeof fetch !== 'undefined' ? fetch : null),
} = {}) {
    if (!fetchFn) return { ok: false, error: 'fetch-unavailable' };
    try {
        const res = await fetchFn(baseUrl.replace(/\/$/, '') + '/');
        if (!res.ok) return { ok: false, error: 'http ' + res.status };
        const text = await res.text();
        return { ok: true, response: text };
    } catch (e) {
        return { ok: false, error: 'connection-failed · is Ollama running on ' + baseUrl + '?' };
    }
}

// ── makeOllamaProvider · adapter compatible amb el harness · per al CLI ──
//
// Crea una closure ollamaProvider compatible amb la signatura del harness ·
// `async (modelKey, opts) → { text, usage }`. modelKey s'ignora · usa el
// defaultModel sempre (o el que es passi al constructor).
export function makeOllamaProvider({ baseUrl = DEFAULT_BASE_URL, defaultModel = DEFAULT_MODEL } = {}) {
    return async function ollamaProvider(_modelKey, opts) {
        return await ollamaGenerate({
            baseUrl, model: defaultModel,
            systemPrompt:   opts.systemPrompt,
            userPrompt:     opts.userPrompt,
            maxOutputTokens: opts.maxOutputTokens || 1800,
            temperature:    typeof opts.temperature === 'number' ? opts.temperature : 0.3,
            format:         opts.format || null,
        });
    };
}

// ── Suggested models · per a power-users · adaptat a hardware limited ──
export const SUGGESTED_MODELS = Object.freeze([
    { name: 'qwen2.5:3b',       size_gb: 1.9, ram_min_gb: 4,  use: 'classify · ner · small extracts',    hw: 'Mac 2012 OK' },
    { name: 'qwen2.5:7b',       size_gb: 4.7, ram_min_gb: 8,  use: 'general · mid quality',              hw: 'Mac 2012 lent' },
    { name: 'phi3:mini',        size_gb: 2.3, ram_min_gb: 4,  use: 'instruct · razonament petit',        hw: 'Mac 2012 OK' },
    { name: 'llama3.2:3b',      size_gb: 2.0, ram_min_gb: 4,  use: 'general · context 8k',               hw: 'Mac 2012 OK' },
    { name: 'mistral:7b',       size_gb: 4.1, ram_min_gb: 8,  use: 'general · raonament estructurat',    hw: 'Mac 2012 lent' },
    { name: 'gemma2:2b',        size_gb: 1.6, ram_min_gb: 4,  use: 'classify · molt ràpid',              hw: 'Mac 2012 OK' },
    { name: 'qwen2.5-coder:7b', size_gb: 4.7, ram_min_gb: 8,  use: 'code completion · DSL gen',          hw: 'Mac 2012 lent' },
]);
