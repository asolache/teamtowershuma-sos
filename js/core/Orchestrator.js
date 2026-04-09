// =============================================================================
// TEAMTOWERS SOS V11 — ORCHESTRATOR.JS
// Motor LLM multi-proveedor · Anthropic primario
// API Key: IndexedDB via KB.js (zero localStorage)
// Proxy: /api/anthropic-proxy (Netlify Edge Function)
// =============================================================================

import { store } from './store.js';
import { KB }    from './kb.js';

// ─── AGENTES CORE ────────────────────────────────────────────────
const CORE_AGENTS = {
    ARCHITECT:   '@agent_genesis_architect',
    ONTOLOGIST:  '@agent_dharma_ontologist',
    CRAFTER:     '@agent_skill_crafter',
    SYNTHESIZER: '@agent_prompt_synthesizer',
    AUDITOR:     '@agent_tdd_auditor',
    WEAVER:      '@agent_synaptic_weaver',
    ECONOMIST:   '@agent_token_economist'
};

// ─── PRECIO BASE USD / 1M tokens ────────────────────────────────
const BASE_PRICING = {
    anthropic: { input: 3.00,  output: 15.00 },
    openai:    { input: 2.50,  output: 10.00 },
    deepseek:  { input: 0.14,  output: 0.28  },
    gemini:    { input: 0.075, output: 0.30  },
    custom:    { input: 0.0,   output: 0.0   }
};

// ─── MODELO PRIMARIO ─────────────────────────────────────────────
const ANTHROPIC_MODEL   = 'claude-sonnet-4-20250514';
const ANTHROPIC_VERSION = '2023-06-01';

// ─── PROXY: siempre relativo — funciona en local y en Netlify ────
// En local Netlify Dev sirve el edge function en el mismo puerto
const ANTHROPIC_PROXY_URL = '/api/anthropic-proxy';

// ─── CLAVES KB ───────────────────────────────────────────────────
const KB_KEY_PROVIDER  = 'sos_ai_provider';
const KB_KEY_ANTHROPIC = 'sos_key_anthropic';
const KB_KEY_OPENAI    = 'sos_key_openai';
const KB_KEY_DEEPSEEK  = 'sos_key_deepseek';
const KB_KEY_GEMINI    = 'sos_key_gemini';

// =============================================================================
class OrchestratorCore {

    constructor() {
        this.version     = 'V11-Antigravity';
        this.isListening = false;
        this._kbReady    = false;
    }

    async _ensureKB() {
        if (this._kbReady) return;
        await KB.init();
        this._kbReady = true;
    }

    async _getAvailableProviders(overrideEngine = null) {
        await this._ensureKB();
        const globalEngine     = (await KB.getNode(KB_KEY_PROVIDER))?.value || 'anthropic';
        const actualPreference = overrideEngine || globalEngine;
        const chain = [...new Set([actualPreference, globalEngine, 'anthropic', 'openai', 'deepseek', 'gemini', 'custom'])];
        const available = [];

        for (const provider of chain) {
            if (provider === 'custom') {
                available.push({ provider: 'custom', apiKey: 'local' });
                continue;
            }
            const record = await KB.getNode(this._kbKeyForProvider(provider));
            const apiKey = record?.value?.trim();
            if (apiKey && apiKey.length > 10) available.push({ provider, apiKey });
        }

        if (!available.length) throw new Error('[KERNEL PANIC] Sin API Key en KB. Configura en /settings.');
        return available;
    }

    _kbKeyForProvider(provider) {
        return { anthropic: KB_KEY_ANTHROPIC, openai: KB_KEY_OPENAI, deepseek: KB_KEY_DEEPSEEK, gemini: KB_KEY_GEMINI }[provider] || `sos_key_${provider}`;
    }

    // ══════════════════════════════════════════════════════════════
    //  callLLM — Motor central multi-proveedor
    // ══════════════════════════════════════════════════════════════
    async callLLM({ preferredEngine = 'anthropic', systemPrompt, userPrompt, responseFormat = 'json_object', temperature = 0.2, mcpSkills = [] }) {
        const providers = await this._getAvailableProviders(preferredEngine);
        let lastError = null;

        for (const { provider, apiKey } of providers) {
            let attempt = 0;
            while (attempt <= 1) {
                try {
                    const startTime = Date.now();
                    let textResponse = '';
                    let tokenUsage   = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

                    // ── ANTHROPIC ────────────────────────────────────────────
                    if (provider === 'anthropic') {
                        const jsonSuffix = responseFormat === 'json_object'
                            ? '\n\nDEBES RESPONDER ÚNICAMENTE CON UN OBJETO JSON VÁLIDO. SIN MARKDOWN NI TEXTO ADICIONAL.'
                            : '';

                        const requestBody = {
                            apiKey,
                            _anthropicVersion: ANTHROPIC_VERSION,
                            model:       ANTHROPIC_MODEL,
                            max_tokens:  4096,
                            temperature,
                            system:      systemPrompt + jsonSuffix,
                            messages:    [{ role: 'user', content: userPrompt }]
                        };

                        const response = await fetch(ANTHROPIC_PROXY_URL, {
                            method:  'POST',
                            headers: { 'content-type': 'application/json' },
                            body:    JSON.stringify(requestBody)
                        });

                        if (!response.ok) throw new Error(`[HTTP ${response.status}] ${await response.text()}`);
                        const data = await response.json();

                        textResponse = data.content.filter(c => c.type === 'text').map(c => c.text).join('');

                        if (data.usage) {
                            tokenUsage = {
                                prompt_tokens:     data.usage.input_tokens  || 0,
                                completion_tokens: data.usage.output_tokens || 0,
                                total_tokens:      (data.usage.input_tokens + data.usage.output_tokens) || 0
                            };
                        }
                    }

                    // ── OPENAI ───────────────────────────────────────────────
                    else if (provider === 'openai') {
                        const body = {
                            model: 'gpt-4o', temperature, max_tokens: 8192,
                            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt + (responseFormat === 'json_object' ? '\n\nResponde ÚNICAMENTE con JSON válido.' : '') }]
                        };
                        if (responseFormat === 'json_object') body.response_format = { type: 'json_object' };
                        const r = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                            body: JSON.stringify(body)
                        });
                        if (!r.ok) throw new Error(`[HTTP ${r.status}] ${await r.text()}`);
                        const d = await r.json();
                        textResponse = d.choices?.[0]?.message?.content || '';
                        if (d.usage) tokenUsage = { prompt_tokens: d.usage.prompt_tokens, completion_tokens: d.usage.completion_tokens, total_tokens: d.usage.total_tokens };
                    }

                    // ── DEEPSEEK ─────────────────────────────────────────────
                    else if (provider === 'deepseek') {
                        const body = {
                            model: 'deepseek-chat', temperature, max_tokens: 8192,
                            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt + (responseFormat === 'json_object' ? '\n\nResponde ÚNICAMENTE con JSON válido.' : '') }]
                        };
                        if (responseFormat === 'json_object') body.response_format = { type: 'json_object' };
                        const r = await fetch('https://api.deepseek.com/chat/completions', {
                            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                            body: JSON.stringify(body)
                        });
                        if (!r.ok) throw new Error(`[HTTP ${r.status}] ${await r.text()}`);
                        const d = await r.json();
                        textResponse = d.choices?.[0]?.message?.content || '';
                        if (d.usage) tokenUsage = { prompt_tokens: d.usage.prompt_tokens, completion_tokens: d.usage.completion_tokens, total_tokens: d.usage.total_tokens };
                    }

                    // ── GEMINI ───────────────────────────────────────────────
                    else if (provider === 'gemini') {
                        const mimeType = responseFormat === 'json_object' ? 'application/json' : 'text/plain';
                        const models   = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
                        let gRes = null;
                        for (const m of models) {
                            const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\nINPUT:\n${userPrompt}` }] }], generationConfig: { temperature, maxOutputTokens: 8192, responseMimeType: mimeType } })
                            });
                            if (r.ok) { gRes = r; break; }
                        }
                        if (!gRes) throw new Error('[Gemini] Ningún modelo disponible.');
                        const d = await gRes.json();
                        if (!d.candidates?.length) throw new Error('Respuesta vacía de Gemini.');
                        textResponse = d.candidates[0].content.parts[0].text;
                    }

                    // ── CUSTOM / OLLAMA ──────────────────────────────────────
                    else if (provider === 'custom') {
                        const r = await fetch('http://localhost:11434/api/chat', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ model: 'llama3', stream: false, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] })
                        });
                        if (!r.ok) throw new Error(`[Ollama HTTP ${r.status}]`);
                        const d = await r.json();
                        textResponse = d.message?.content || '';
                    }

                    // ── PARSE ────────────────────────────────────────────────
                    let parsedContent = textResponse;
                    if (responseFormat === 'json_object') {
                        try {
                            parsedContent = JSON.parse(textResponse.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim());
                        } catch (_) {
                            parsedContent = { raw: textResponse, parseError: true };
                        }
                    }

                    const latencyMs = Date.now() - startTime;

                    // Emitir evento para el monitor de actividad
                    const priceMatrix = BASE_PRICING[provider] || { input: 0, output: 0 };
                    const costUSD = (tokenUsage.prompt_tokens / 1e6) * priceMatrix.input + (tokenUsage.completion_tokens / 1e6) * priceMatrix.output;
                    window.dispatchEvent(new CustomEvent('sos:ai-activity', {
                        detail: { provider, totalTokens: tokenUsage.total_tokens, costUSD: parseFloat(costUSD.toFixed(6)), latencyMs, timestamp: Date.now() }
                    }));

                    return { content: parsedContent, telemetry: { provider, model: provider === 'anthropic' ? ANTHROPIC_MODEL : provider, tokens: tokenUsage, latencyMs } };

                } catch (err) {
                    lastError = err;
                    console.warn(`[V11·Orchestrator] ⚠️ Fallo ${provider} (intento ${attempt + 1}):`, err.message);
                    attempt++;
                }
            }
        }

        throw new Error(`[V11·Orchestrator] Todos los proveedores fallaron. Último error: ${lastError?.message}`);
    }

    // ══════════════════════════════════════════════════════════════
    //  dispatch — Router de rutinas del Swarm
    // ══════════════════════════════════════════════════════════════
    async dispatch({ routine, agent, context = {}, constraints = {} }) {
        const { strictJSON = true, engine = 'anthropic' } = constraints;
        await this._ensureKB();

        const promptNode = await KB.getNode(`prompt_global_${agent.replace('@', '')}`);
        const agentSOP   = promptNode?.content || `Eres ${agent}, agente del Swarm SOS V11.`;

        const systemPrompt = `${agentSOP}\n\nRUTINA: ${routine}\nKERNEL: V11 Antigravity\n${strictJSON ? 'RESPONDE CON UN ÚNICO JSON-LD VÁLIDO.' : ''}`;
        const userPrompt   = `CONTEXTO:\n${JSON.stringify(context, null, 2)}\n\nEjecuta "${routine}".`;

        const response = await this.callLLM({ preferredEngine: engine, systemPrompt, userPrompt, responseFormat: strictJSON ? 'json_object' : 'text', temperature: 0.2 });

        const artifact = {
            '@context':   'https://teamtowers.io/sos/v11',
            '@type':      'SosArtifact',
            artifactType: 'routine_output',
            agentId:      agent,
            routine,
            timestamp:    new Date().toISOString(),
            payload:      response.content?.payload || response.content,
            telemetry:    response.telemetry,
            audit:        { tddPassed: false, notarized: false, hash: `sha256:${Date.now().toString(16)}` }
        };

        if (context.projectId) this._logTelemetry(context.projectId, agent, response.telemetry.provider, routine, response.telemetry);
        return artifact;
    }

    // ══════════════════════════════════════════════════════════════
    //  Telemetría
    // ══════════════════════════════════════════════════════════════
    _logTelemetry(projectId, agentId, engine, actionType, telemetryData) {
        if (!telemetryData) return;
        const state       = store.getState();
        const ecoConfig   = state.config?.economics || {};
        const priceMatrix = BASE_PRICING[engine] || { input: 0, output: 0 };
        const baseCost    = (telemetryData.tokens.prompt_tokens / 1e6) * priceMatrix.input + (telemetryData.tokens.completion_tokens / 1e6) * priceMatrix.output;
        const finalCost   = baseCost * (1 + (ecoConfig.markup_margin || 0) + (ecoConfig.premium_features_fee || 0));

        store.dispatch({ type: 'LOG_TELEMETRY', payload: { projectId, agentId, engine, actionType, tokens: telemetryData.tokens, costInDollars: finalCost, latencyMs: telemetryData.latencyMs } });
        if (projectId) store.dispatch({ type: 'LEDGER_AI_COST', payload: { projectId, agentId, engine, routine: actionType, input_tokens: telemetryData.tokens.prompt_tokens || 0, output_tokens: telemetryData.tokens.completion_tokens || 0, latencyMs: telemetryData.latencyMs || 0, cost_usd: finalCost, multiplier: 2.0 } });
    }

    // ══════════════════════════════════════════════════════════════
    //  API Settings — guardar/leer claves desde KB
    // ══════════════════════════════════════════════════════════════
    async saveApiKey(provider, apiKey) {
        await this._ensureKB();
        await KB.saveNode({ id: this._kbKeyForProvider(provider), type: 'config', value: apiKey.trim() });
        console.log(`[V11·Orchestrator] 🔑 ${provider} API Key guardada.`);
    }

    async getApiKey(provider) {
        await this._ensureKB();
        const record = await KB.getNode(this._kbKeyForProvider(provider));
        return record?.value || null;
    }

    async setDefaultProvider(provider) {
        await this._ensureKB();
        await KB.saveNode({ id: KB_KEY_PROVIDER, type: 'config', value: provider });
    }

    async getDefaultProvider() {
        await this._ensureKB();
        const record = await KB.getNode(KB_KEY_PROVIDER);
        return record?.value || 'anthropic';
    }
}

export const Orchestrator = new OrchestratorCore();
