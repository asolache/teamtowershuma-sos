// =============================================================================
// TEAMTOWERS SOS V11 — AI-DRIVEN CREATION ADAPTER (PR1 · sprint backend)
// Ruta · /js/core/aiDrivenCreationAdapter.js
//
// Connecta els callbacks `pickSocs / generateSops / generateWos` del
// projectCreationOrchestrator amb la stack IA real ·
//   vnaExpertPrompts.buildPrompt  → user/system/few-shot
//   aiRouterService.runEscalation → chain de modèls + escalation
//   aiProviderService             → crida real al provider
//
// Filosofia · KISS · 1 funció `buildAiCallbacks({preferredProvider, taskTier})`
// retorna { pickSocs, generateSops, generateWos } injectables directament al
// createProject. Cada callback ·
//   1. Construeix el prompt via buildPrompt(taskKind, ctx)
//   2. Crida runEscalation amb un `generate` que invoca generateWithProvider
//   3. Parseja JSON · si fail · retorna {} (orchestrator gestiona fallback)
//   4. Retorna també `cost` calculat a partir de usage real (per acumular)
//
// Pure · zero DOM · safe Node + browser. Tests usen mocks de runEscalation.
// =============================================================================

import { buildPrompt } from './vnaExpertPrompts.js';
import { runEscalation, AI_MODELS, estimateCostUsd } from './aiRouterService.js';

export const ADAPTER_VERSION = 'v1.0';

// _parseJsonSafe · pure · parseja JSON · si fail · retorna fallback
function _parseJsonSafe(text, fallback = null) {
    if (!text || typeof text !== 'string') return fallback;
    let s = text.trim();
    // Strip markdown codeblocks si la IA n'ha posat
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    // Si la IA ha posat preàmbul abans del JSON · busca el primer { o [
    const firstBrace = s.search(/[{[]/);
    if (firstBrace > 0) s = s.slice(firstBrace);
    // Trunca al darrer } o ]
    const lastBrace = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
    if (lastBrace > 0 && lastBrace < s.length - 1) s = s.slice(0, lastBrace + 1);
    try { return JSON.parse(s); } catch (_) { return fallback; }
}

// _costFromUsage · pure · calcula cost EUR a partir de usage real
// Si usage no està disponible · estima per longitud text
function _costFromUsage({ modelKey, usage, outputText }) {
    if (!modelKey || !AI_MODELS[modelKey]) return 0;
    if (usage && (usage.inputTokens >= 0) && (usage.outputTokens >= 0)) {
        const usd = estimateCostUsd(modelKey, { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens });
        return (usd || 0) * 0.92;   // USD→EUR aproximat
    }
    // Fallback estimate · 4 chars per token
    const outTokens = Math.ceil((outputText || '').length / 4);
    const inTokens  = outTokens * 3;   // assumeix prompt ~3x output
    const usd = estimateCostUsd(modelKey, { inputTokens: inTokens, outputTokens: outTokens });
    return (usd || 0) * 0.92;
}

// _runTask · pure helper · construeix prompt + crida runEscalation + retorna {parsed, cost, modelKey}
async function _runTask({ taskKind, routeKind, context, generateWithProvider, preferredProvider, evaluator = null }) {
    const prompt = buildPrompt({ taskKind, context });

    // Captura usage real per cost · ctx mutable compartit entre intents
    const usageRef = { last: null };

    const generate = async (modelKey) => {
        const res = await generateWithProvider(modelKey, {
            systemPrompt:    prompt.system,
            userPrompt:      prompt.user,
            fewShot:         prompt.fewShot,
            maxOutputTokens: 1800,
            temperature:     0.4,
        });
        if (res?.usage) usageRef.last = res.usage;
        return res?.text || '';
    };

    const evalFn = evaluator || (async (output) => {
        // Default · JSON parse-able + no buit
        const parsed = _parseJsonSafe(output);
        return { ok: !!parsed && (Array.isArray(parsed) || typeof parsed === 'object'), reason: parsed ? null : 'invalid-json' };
    });

    const result = await runEscalation({
        taskKind: routeKind,
        generate,
        evaluate: evalFn,
        ctx: { taskKind },
        preferredProvider,
    });

    const text = result?.output || '';
    const parsed = _parseJsonSafe(text, null);
    const cost = _costFromUsage({ modelKey: result?.modelKey, usage: usageRef.last, outputText: text });
    return { parsed, cost, modelKey: result?.modelKey || null, attempts: result?.attempts || [] };
}

// buildAiCallbacks · factory · retorna {pickSocs, generateSops, generateWos}
// injectables directament al createProject({ ...callbacks })
//
// args ·
//   generateWithProvider · fn(modelKey, opts) → {text, usage} · per defecte
//                          carrega dinàmicament aiProviderService
//   preferredProvider    · 'anthropic'|'openai'|'gemini'|'deepseek'|null
//   onModelUsed          · fn({taskKind, modelKey, cost}) · telemetria
export function buildAiCallbacks({
    generateWithProvider = null,
    preferredProvider = null,
    onModelUsed = null,
} = {}) {
    // Lazy-load provider · només si l'usuari NO ha injectat un de seu
    let _provider = generateWithProvider;
    const _ensureProvider = async () => {
        if (_provider) return _provider;
        try {
            const mod = await import('./aiProviderService.js');
            _provider = mod.generateWithProvider;
        } catch (_) {
            _provider = null;
        }
        return _provider;
    };

    const _report = (taskKind, modelKey, cost) => {
        if (typeof onModelUsed === 'function') {
            try { onModelUsed({ taskKind, modelKey, cost }); } catch (_) {}
        }
    };

    return {
        pickSocs: async ({ candidates, ctx }) => {
            const gp = await _ensureProvider();
            if (!gp) return { selected: candidates.slice(0, 5), cost: 0 };
            try {
                const { parsed, cost, modelKey } = await _runTask({
                    taskKind: 'classify-and-pick-socs',
                    routeKind: 'soc-pick',
                    context: { ...ctx, candidates },
                    generateWithProvider: gp,
                    preferredProvider,
                });
                _report('classify-and-pick-socs', modelKey, cost);
                const selected = Array.isArray(parsed?.selected) ? parsed.selected : [];
                return { selected, cost, modelKey };
            } catch (_) {
                // Fallback graceful · retorna heuristic original
                return { selected: candidates.slice(0, 5), cost: 0 };
            }
        },

        generateSops: async ({ soc, project_ctx, role_kinds }) => {
            const gp = await _ensureProvider();
            if (!gp) return { sops: [], cost: 0 };
            try {
                const { parsed, cost, modelKey } = await _runTask({
                    taskKind: 'generate-sops-from-soc',
                    routeKind: 'sop-from-soc',
                    context: { name: project_ctx?.name || '', soc, project_ctx, role_kinds },
                    generateWithProvider: gp,
                    preferredProvider,
                });
                _report('generate-sops-from-soc', modelKey, cost);
                const sops = Array.isArray(parsed?.sops) ? parsed.sops : [];
                return { sops, cost, modelKey };
            } catch (_) {
                return { sops: [], cost: 0 };
            }
        },

        generateWos: async ({ sop, project_ctx }) => {
            const gp = await _ensureProvider();
            if (!gp) return { wos: [], cost: 0 };
            try {
                const { parsed, cost, modelKey } = await _runTask({
                    taskKind: 'generate-wos-from-sop',
                    routeKind: 'wo-from-sop',
                    context: { name: project_ctx?.name || '', sop, project_ctx },
                    generateWithProvider: gp,
                    preferredProvider,
                });
                _report('generate-wos-from-sop', modelKey, cost);
                const wos = Array.isArray(parsed?.wos) ? parsed.wos : [];
                return { wos, cost, modelKey };
            } catch (_) {
                return { wos: [], cost: 0 };
            }
        },
    };
}

// Helper exposat per tests · permet validar el parser
export const __test_helpers__ = Object.freeze({ _parseJsonSafe, _costFromUsage });
