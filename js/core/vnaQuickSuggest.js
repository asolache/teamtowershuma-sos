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
    // v160 · contextProfile · 'sos-current' | 'verna-minimal' | 'verna-guided'
    // Si 'verna-*' · usa task 'design-value-map-verna' i strip de capes ancoradores
    contextProfile = 'sos-current',
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

    // v160 · ruta canonical · si contextProfile='verna-*' usa el nou task amb
    // sistema VERNA pur · zero exemples literals · ancla en metaskill
    const taskKindUsed = (contextProfile === 'verna-minimal' || contextProfile === 'verna-guided')
        ? 'design-value-map-verna'
        : 'design-value-map-rich';
    const prompt = buildPrompt({ taskKind: taskKindUsed, context: fullCtx, slim, contextProfile });
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
            const promptFull = buildPrompt({ taskKind: taskKindUsed, context: fullCtx, slim: false, contextProfile });
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

// v158 · quickSuggestSocs · derivat del mapa de valor · slim-first + escalate
//   context  · { name, sector, lifecycle_stage, vna_zoom }
//   valueMap · output de quickSuggestMap (map field)
// Retorna · { ok, socs, presentationHints, eval, ms, slim, escalatedToFull }
export async function quickSuggestSocs({
    context = {},
    valueMap = null,
    slim = true,
    qualityThreshold = 70,
    generateWithProvider = null,
    preferredProvider = null,
    modelKey = 'auto-reasoner',
    onProgress = null,
} = {}) {
    const t0 = Date.now();
    const emit = (step, payload) => { try { onProgress?.({ step, ...payload }); } catch (_) {} };
    if (!valueMap) return { ok: false, error: 'valueMap required', ms: 0 };
    if (!generateWithProvider) {
        try { const mod = await import('./aiProviderService.js'); generateWithProvider = mod.generateWithProvider; }
        catch (_) { return { ok: false, error: 'provider not available', ms: 0 }; }
    }

    const { evaluateSocsShape } = await import('./vnaShapeEvaluators.js');
    const ctx = {
        name:            context.name,
        sector:          context.sector,
        lifecycle_stage: context.lifecycle_stage,
        vna_zoom:        context.vna_zoom || 'meso',
        value_map:       valueMap,
    };
    const prompt = buildPrompt({ taskKind: 'generate-socs-from-value-map', context: ctx, slim });
    emit('prompt-built', { tokens: prompt.approxTokens, slim });

    const runOnce = async (sl) => {
        const p = buildPrompt({ taskKind: 'generate-socs-from-value-map', context: ctx, slim: sl });
        const res = await generateWithProvider(modelKey, {
            systemPrompt: p.system, userPrompt: p.user, fewShot: p.fewShot,
            maxOutputTokens: 2200, temperature: 0.4, preferredProvider,
        });
        return { text: res?.text || '', usage: res?.usage || null };
    };

    let text, usage;
    try { ({ text, usage } = await runOnce(slim)); emit('first-call-done', { tokens: usage?.outputTokens }); }
    catch (e) { return { ok: false, error: 'first-call-failed: ' + (e?.message || String(e)), ms: Date.now() - t0 }; }

    let parsed = _parseJsonOutput(text);
    if (!parsed) return { ok: false, error: 'parse-failed · no JSON', ms: Date.now() - t0, rawOutput: text.slice(0, 300) };

    let evalRes = evaluateSocsShape(parsed);
    let escalatedToFull = false;
    if (slim && evalRes.score < qualityThreshold) {
        emit('escalating', { reason: 'shape-eval', score: evalRes.score, threshold: qualityThreshold });
        try {
            const { text: t2 } = await runOnce(false);
            const parsed2 = _parseJsonOutput(t2);
            if (parsed2) {
                const eval2 = evaluateSocsShape(parsed2);
                if (eval2.score > evalRes.score) {
                    parsed = parsed2; evalRes = eval2; escalatedToFull = true;
                    emit('escalation-success', { newScore: eval2.score });
                }
            }
        } catch (_) {}
    }

    const ms = Date.now() - t0;
    emit('done', { ms, score: evalRes.score, escalatedToFull });
    return {
        ok: evalRes.ok,
        socs: Array.isArray(parsed.socs) ? parsed.socs : [],
        presentationHints: parsed.presentationHints || null,
        eval: evalRes,
        ms, slim, escalatedToFull,
        tokens: prompt.approxTokens, usage,
        rawOutput: parsed,
    };
}

// v158 · quickSuggestSops · per un SOC · slim-first + escalate
//   context     · { name, sector, lifecycle_stage, description, entity_type }
//   soc         · 1 SOC del output de quickSuggestSocs
//   role_kinds  · llista de role kinds disponibles
// Retorna · { ok, sops, eval, ms, slim, escalatedToFull }
export async function quickSuggestSops({
    context = {},
    soc = null,
    role_kinds = [],
    sector_role_examples = null,
    available_skills = null,
    slim = true,
    qualityThreshold = 70,
    generateWithProvider = null,
    preferredProvider = null,
    modelKey = 'auto-mid',
    onProgress = null,
} = {}) {
    const t0 = Date.now();
    const emit = (step, payload) => { try { onProgress?.({ step, ...payload }); } catch (_) {} };
    if (!soc) return { ok: false, error: 'soc required', ms: 0 };
    if (!generateWithProvider) {
        try { const mod = await import('./aiProviderService.js'); generateWithProvider = mod.generateWithProvider; }
        catch (_) { return { ok: false, error: 'provider not available', ms: 0 }; }
    }

    const { evaluateSopsShape } = await import('./vnaShapeEvaluators.js');
    const ctx = {
        name: context.name,
        soc,
        project_ctx: {
            description:     context.description,
            sector:          context.sector,
            entity_type:     context.entity_type,
            lifecycle_stage: context.lifecycle_stage,
        },
        role_kinds, sector_role_examples, available_skills,
    };
    const prompt = buildPrompt({ taskKind: 'generate-sops-with-skills', context: ctx, slim });
    emit('prompt-built', { tokens: prompt.approxTokens, slim });

    const runOnce = async (sl) => {
        const p = buildPrompt({ taskKind: 'generate-sops-with-skills', context: ctx, slim: sl });
        const res = await generateWithProvider(modelKey, {
            systemPrompt: p.system, userPrompt: p.user, fewShot: p.fewShot,
            maxOutputTokens: 2200, temperature: 0.4, preferredProvider,
        });
        return { text: res?.text || '', usage: res?.usage || null };
    };

    let text, usage;
    try { ({ text, usage } = await runOnce(slim)); emit('first-call-done', { tokens: usage?.outputTokens }); }
    catch (e) { return { ok: false, error: 'first-call-failed: ' + (e?.message || String(e)), ms: Date.now() - t0 }; }

    let parsed = _parseJsonOutput(text);
    if (!parsed) return { ok: false, error: 'parse-failed · no JSON', ms: Date.now() - t0, rawOutput: text.slice(0, 300) };

    let evalRes = evaluateSopsShape(parsed);
    let escalatedToFull = false;
    if (slim && evalRes.score < qualityThreshold) {
        emit('escalating', { reason: 'shape-eval', score: evalRes.score, threshold: qualityThreshold });
        try {
            const { text: t2 } = await runOnce(false);
            const parsed2 = _parseJsonOutput(t2);
            if (parsed2) {
                const eval2 = evaluateSopsShape(parsed2);
                if (eval2.score > evalRes.score) {
                    parsed = parsed2; evalRes = eval2; escalatedToFull = true;
                    emit('escalation-success', { newScore: eval2.score });
                }
            }
        } catch (_) {}
    }

    const ms = Date.now() - t0;
    emit('done', { ms, score: evalRes.score, escalatedToFull });
    return {
        ok: evalRes.ok,
        sops: Array.isArray(parsed.sops) ? parsed.sops : [],
        eval: evalRes,
        ms, slim, escalatedToFull,
        tokens: prompt.approxTokens, usage,
        rawOutput: parsed,
    };
}

// v158 · runValueMapCycle · loop canonical · map → SOCs → SOPs · cada step
// té eval booleà · si gating falla, escala a rich · si escala falla, segueix
// igualment però marca degraded=true al result final. Caller pot decidir.
//
// Retorna · {
//   ok, degraded, ms,
//   map:   { ok, score, issues, data },
//   socs:  { ok, score, issues, data },
//   sops:  { ok, score, issues, data[] · 1 per SOC },
// }
export async function runValueMapCycle({
    context = {},
    existingMap = null,
    generateWithProvider = null,
    preferredProvider = null,
    onProgress = null,
    qualityThreshold = 60,
    skip = {},
    // v160 · contextProfile propagat a fase 1 (map) · SOCs/SOPs encara legacy
    contextProfile = 'sos-current',
} = {}) {
    const t0 = Date.now();
    const emit = (step, payload) => { try { onProgress?.({ step, ...payload }); } catch (_) {} };
    const out = { ok: true, degraded: false, ms: 0, map: null, socs: null, sops: null };

    // Phase 1 · map
    if (!skip.map) {
        emit('cycle-phase', { phase: 'map' });
        const mapRes = await quickSuggestMap({ context, existingMap, slim: true, qualityThreshold, generateWithProvider, preferredProvider, onProgress, contextProfile });
        out.map = { ok: mapRes.ok, score: mapRes.score?.score || 0, issues: [], data: mapRes.map, escalatedToFull: mapRes.escalatedToFull };
        if (!mapRes.ok) { out.ok = false; out.degraded = true; out.ms = Date.now() - t0; return out; }
    }
    const valueMap = out.map?.data || existingMap;

    // Phase 2 · SOCs
    if (!skip.socs && valueMap) {
        emit('cycle-phase', { phase: 'socs' });
        const socsRes = await quickSuggestSocs({ context, valueMap, slim: true, qualityThreshold: 70, generateWithProvider, preferredProvider, onProgress });
        out.socs = { ok: socsRes.ok, score: socsRes.eval?.score || 0, issues: socsRes.eval?.issues || [], data: socsRes.socs, presentationHints: socsRes.presentationHints || null, escalatedToFull: socsRes.escalatedToFull };
        if (!socsRes.ok) { out.degraded = true; }
    }

    // Phase 3 · SOPs · 1 per SOC (paral·lel · max 3 per evitar rate limit)
    if (!skip.sops && out.socs?.data?.length) {
        emit('cycle-phase', { phase: 'sops', count: out.socs.data.length });
        const role_kinds = (valueMap?.roles || []).map(r => r.kind).filter(Boolean);
        const batches = [];
        for (let i = 0; i < out.socs.data.length; i += 3) batches.push(out.socs.data.slice(i, i + 3));
        const allSopResults = [];
        for (const batch of batches) {
            const batchRes = await Promise.all(batch.map(soc =>
                quickSuggestSops({ context, soc, role_kinds, slim: true, qualityThreshold: 70, generateWithProvider, preferredProvider, onProgress })
            ));
            allSopResults.push(...batchRes);
        }
        const allOk = allSopResults.every(r => r.ok);
        const avgScore = Math.round(allSopResults.reduce((s, r) => s + (r.eval?.score || 0), 0) / Math.max(1, allSopResults.length));
        const allIssues = allSopResults.flatMap((r, i) => (r.eval?.issues || []).map(iss => '[soc-' + i + '] ' + iss));
        out.sops = {
            ok: allOk, score: avgScore, issues: allIssues,
            data: allSopResults.map(r => r.sops || []),
            escalatedCount: allSopResults.filter(r => r.escalatedToFull).length,
        };
        if (!allOk) out.degraded = true;
    }

    out.ms = Date.now() - t0;
    emit('cycle-done', { ms: out.ms, degraded: out.degraded, ok: out.ok });
    return out;
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
