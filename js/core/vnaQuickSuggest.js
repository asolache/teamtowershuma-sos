// =============================================================================
// TEAMTOWERS SOS V11 — VNA QUICK SUGGEST (v132d · wo-vna-unify-map-suggest)
// Ruta · /js/core/vnaQuickSuggest.js
//
// Wrapper unificat sobre runExpertChain · optimitzat per a single-call rapid
// suggestion (cas /map · Sugerir con IA · v1) amb opt-in al SOC/SOP/WO chain
// complet (cas /create-live · expert chain).
//
// Resol el Gap 3 de l'anàlisi v132b · el botó /map tenia el seu propi prompt
// curt enfora del runExpertChain · ara · 1 sol backend, 2 modes UX.
//
// API ·
//   quickSuggestMap({ context, generateWithProvider, existingMap, slim })
//     · 1 sola crida small-tier · retorna { roles[], transactions[], deliverables[], score }
//     · default slim=true · cost ~0.0001€
//
//   fullExpertChain({ context, generateWithProvider, ... })
//     · 8 fases · cost ~0.05-0.10€ · per a /create-live
//     · simple re-export de runExpertChain
//
// Filosofia · KISS · 1 backend · 2 cases d'ús distints clarament tipificats.
// =============================================================================

import { buildPrompt } from './vnaExpertPrompts.js';
import { scoreOutput } from './promptABTestService.js';
// v135 · alfa+ items #1 + #2 · re-export · disponible a consumidors de quickSuggest
export { vnaClarify, enrichContextWithAnswers, VNA_CLARIFY_VERSION } from './vnaClarify.js';
export { detectGaps, buildGapFillPrompt, runGapFillTurn, mergeGapFill, VNA_GAP_VERSION } from './vnaGapDetector.js';

export const VNA_QUICK_VERSION = 'v1.0';

// Internal · helper · parse JSON output safely
function _parseJsonOutput(text) {
    if (!text) return null;
    const trimmed = String(text).trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const m = trimmed.match(/\{[\s\S]*\}/);
    try { return JSON.parse(m ? m[0] : trimmed); } catch (_) { return null; }
}

// quickSuggestMap · async · single-call optimitzat per a /map · Sugerir con IA
//   context     · { name, description, sector, vna_zoom, domainDetection?, sectorContext? }
//   existingMap · { roles[], transactions[] } · si present, mode completar
//   slim        · default true · usa SYSTEM_BASE_SLIM (43% menys tokens)
//   provider    · generateWithProvider fn · si null, lazy-import aiProviderService
//   modelKey    · 'auto-small' default · tier router del SOS
//
// Retorna · {
//   ok: bool,
//   map: { roles[], transactions[], deliverables[] },
//   score: { score, roles_count, intangibles_pct, reciprocal_cycles, ... },
//   ms,
//   slim, escalatedToFull,
//   error?: string,
// }
export async function quickSuggestMap({
    context = {},
    existingMap = null,
    slim = true,
    qualityThreshold = 60,    // /map és més tolerant · 60 vs 70 del chain
    generateWithProvider = null,
    preferredProvider = null,
    modelKey = 'auto-small',
    onProgress = null,
} = {}) {
    const t0 = Date.now();
    const emit = (step, payload) => { try { onProgress?.({ step, ...payload }); } catch (_) {} };

    if (!context?.name && !context?.description) {
        return { ok: false, error: 'context · name or description required', ms: 0 };
    }
    if (!generateWithProvider) {
        try {
            const mod = await import('./aiProviderService.js');
            generateWithProvider = mod.generateWithProvider;
        } catch (_) {
            return { ok: false, error: 'provider not available', ms: 0 };
        }
    }

    // v132d · build prompt amb mode completar si existingMap
    const fullCtx = { ...context };
    if (existingMap && (existingMap.roles?.length || existingMap.transactions?.length)) {
        fullCtx.existingMap = existingMap;
    }

    const prompt = buildPrompt({ taskKind: 'design-value-map-rich', context: fullCtx, slim });
    emit('prompt-built', { tokens: prompt.approxTokens, slim, hasExistingMap: !!fullCtx.existingMap });

    // First call · slim
    let text = '';
    let usage = null;
    try {
        const res = await generateWithProvider(modelKey, {
            systemPrompt:    prompt.system,
            userPrompt:      prompt.user,
            fewShot:         prompt.fewShot,
            maxOutputTokens: 1800,
            temperature:     0.4,
            preferredProvider,
        });
        text = res?.text || '';
        usage = res?.usage || null;
        emit('first-call-done', { tokens: usage?.outputTokens });
    } catch (e) {
        return { ok: false, error: 'first-call-failed: ' + (e?.message || String(e)), ms: Date.now() - t0 };
    }

    let parsed = _parseJsonOutput(text);
    if (!parsed) {
        return { ok: false, error: 'parse-failed · output no és JSON vàlid', ms: Date.now() - t0, rawOutput: text.slice(0, 300) };
    }

    let score = scoreOutput(parsed);
    let escalatedToFull = false;

    // v132d · escalation per qualitat · només si slim i score baix
    if (slim && score && score.score < qualityThreshold) {
        emit('escalating', { reason: 'score < threshold', score: score.score, threshold: qualityThreshold });
        try {
            const promptFull = buildPrompt({ taskKind: 'design-value-map-rich', context: fullCtx, slim: false });
            const res2 = await generateWithProvider(modelKey, {
                systemPrompt:    promptFull.system,
                userPrompt:      promptFull.user,
                fewShot:         promptFull.fewShot,
                maxOutputTokens: 1800,
                temperature:     0.4,
                preferredProvider,
            });
            const text2 = res2?.text || '';
            const parsed2 = _parseJsonOutput(text2);
            if (parsed2) {
                const score2 = scoreOutput(parsed2);
                if (score2 && score2.score > score.score) {
                    parsed = parsed2;
                    score = score2;
                    escalatedToFull = true;
                    emit('escalation-success', { newScore: score2.score });
                }
            }
        } catch (_) { /* silent · escalation best-effort */ }
    }

    const ms = Date.now() - t0;
    emit('done', { ms, score: score?.score, escalatedToFull });

    return {
        ok: true,
        map: {
            roles:        Array.isArray(parsed.roles)        ? parsed.roles        : [],
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
            deliverables: Array.isArray(parsed.deliverables) ? parsed.deliverables : [],
        },
        score,
        ms,
        slim,
        escalatedToFull,
        tokens:    prompt.approxTokens,
        usage,
        rawOutput: parsed,
    };
}

// fullExpertChain · re-export de runExpertChain · keep symmetry de API
// Per a /create-live (8 fases · cost més alt · output complet)
export async function fullExpertChain(opts) {
    const { runExpertChain } = await import('./expertChainOrchestrator.js');
    return runExpertChain(opts);
}

// determineMode · helper UI · suggereix quick vs full segons context
// Retorna 'quick' si · ja hi ha mapa parcial · usuari demana suggerències ràpides
// Retorna 'full' si · projecte nou · es vol cadena expert completa (socs+sops+wos)
export function determineMode({ existingMap = null, requestType = 'auto' } = {}) {
    if (requestType === 'quick' || requestType === 'full') return requestType;
    if (existingMap && (existingMap.roles?.length > 0 || existingMap.transactions?.length > 0)) {
        return 'quick';   // enrich mode
    }
    return 'full';   // bootstrap from zero
}
