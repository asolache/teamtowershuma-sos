// =============================================================================
// TEAMTOWERS SOS V11 — EXPERT CHAIN ORCHESTRATOR (PR-Q · wo-orchestrator-expert-chain)
// Ruta · /js/core/expertChainOrchestrator.js
//
// Orquestra les 8 fases canòniques de la creació de projecte (veure
// knowledge/vision/prompts-chain-plan.md) ·
//   1 · define-product-service
//   2 · personalize-canvas (IKIGAI)
//   3 · personalize-pitch
//   4 · personalize-landing
//   5 · design-value-map-rich
//   6 · generate-socs-from-value-map
//   7 · generate-sops-with-skills (per cada SOC · paral·lel)
//   8 · generate-wos-from-sop (per cada SOP · paral·lel)
//
// Cada fase és opcional (skip via opts.skip) · cada fase emet events ·
// budget guard atura si total > maxCostEur.
//
// El callback `provider` (= generateWithProvider real o mock) es passa
// una sola vegada · l'orquestrador construeix els prompts i el crida
// amb el tier òptim de promptTierRouter.
//
// Pure · sense efectes secundaris al KB · el caller decideix persistir.
// =============================================================================

import { buildPrompt, listTasks } from './vnaExpertPrompts.js';
import { runEscalation, AI_MODELS, estimateCostUsd } from './aiRouterService.js';
import { pickRoutingForTask, pickTier } from './promptTierRouter.js';
import { __test_helpers__ as adapterHelpers } from './aiDrivenCreationAdapter.js';
import { detectDomain } from './domainDetector.js';

export const EXPERT_CHAIN_VERSION = 'v1.0';

const { _parseJsonSafe } = adapterHelpers;

// Ordre canonical de les 8 fases · KEY constant per a tests + emit
// v147 · per-phase slim defaults · només crítiques requereixen FULL (raonament
// estructural i contracte VNA estricte) · resta SLIM (43-73% reducció tokens).
// Veure docs/audit-creation-prompts-v146.md · proposta B.2.
// v147 · personalize-landing ELIMINAT · redundant amb canvas+pitch · landing
// es genera post-chain via template (sense LLM) · proposta B.1.
export const CHAIN_PHASES = Object.freeze([
    { id: 'define-product-service',       skipKey: 'product',       taskKind: 'define-product-service',       slimByDefault: true  },
    { id: 'personalize-canvas',           skipKey: 'canvas',        taskKind: 'personalize-canvas',           slimByDefault: true  },
    { id: 'personalize-pitch',            skipKey: 'pitch',         taskKind: 'personalize-pitch',            slimByDefault: true  },
    { id: 'design-value-map-rich',        skipKey: 'valueMap',      taskKind: 'design-value-map-rich',        slimByDefault: false },   // FULL · raonament VNA profund
    { id: 'generate-socs-from-value-map', skipKey: 'socs',          taskKind: 'generate-socs-from-value-map', slimByDefault: false },   // FULL · estructura SOCs
    { id: 'generate-sops-with-skills',    skipKey: 'sops',          taskKind: 'generate-sops-with-skills',    slimByDefault: true, perItem: 'socs' },
    { id: 'generate-wos-from-sop',        skipKey: 'wos',           taskKind: 'generate-wos-from-sop',        slimByDefault: true, perItem: 'sops' },
]);

// _costFromUsage · simple · USD * 0.92 ≈ EUR
function _costEur({ modelKey, usage }) {
    if (!modelKey || !usage) return 0;
    const usd = estimateCostUsd(modelKey, { inputTokens: usage.inputTokens || 0, outputTokens: usage.outputTokens || 0 });
    return (usd || 0) * 0.92;
}

// _runSingleTask · pure helper · build prompt + escalation + parse
// v132c · accepta `slim` per a usar SYSTEM_BASE_SLIM (43% menys tokens) +
// `qualityRubric` per a escalation post-IA si score < threshold.
async function _runSingleTask({ taskKind, context, generateWithProvider, preferredProvider, emit, slim = false, qualityThreshold = 0 }) {
    const prompt = buildPrompt({ taskKind, context, slim });
    const routeKind = pickRoutingForTask(taskKind);
    const tier = pickTier(taskKind);
    const usageRef = { last: null };

    const generate = async (modelKey) => {
        const res = await generateWithProvider(modelKey, {
            systemPrompt:    prompt.system,
            userPrompt:      prompt.user,
            fewShot:         prompt.fewShot,
            maxOutputTokens: 1800,
            temperature:     tier === 'reasoner' ? 0.5 : 0.4,
        });
        if (res?.usage) usageRef.last = res.usage;
        return res?.text || '';
    };

    const evaluate = async (output) => {
        const parsed = _parseJsonSafe(output);
        return { ok: !!parsed && (Array.isArray(parsed) || typeof parsed === 'object'), reason: parsed ? null : 'invalid-json' };
    };

    const result = await runEscalation({ taskKind: routeKind, generate, evaluate, ctx: { taskKind }, preferredProvider });
    let text = result?.output || '';
    let parsed = _parseJsonSafe(text, null);
    let cost = _costEur({ modelKey: result?.modelKey, usage: usageRef.last });

    // v132c · quality rubric · si slim+threshold actiu i score < threshold ·
    // refà amb prompt FULL (escalation per qualitat · no per parse-error)
    let escalatedToFull = false;
    if (slim && qualityThreshold > 0 && parsed && taskKind === 'design-value-map-rich') {
        try {
            const { scoreOutput } = await import('./promptABTestService.js');
            const score = scoreOutput(parsed);
            emit('phase', 'rubric', { taskKind, slim: true, score: score?.score, threshold: qualityThreshold });
            if (score && score.score < qualityThreshold) {
                emit('phase', 'escalate', { taskKind, reason: 'quality-below-threshold', score: score.score });
                const promptFull = buildPrompt({ taskKind, context, slim: false });
                const generateFull = async (modelKey) => {
                    const res = await generateWithProvider(modelKey, {
                        systemPrompt:    promptFull.system,
                        userPrompt:      promptFull.user,
                        fewShot:         promptFull.fewShot,
                        maxOutputTokens: 1800,
                        temperature:     tier === 'reasoner' ? 0.5 : 0.4,
                    });
                    if (res?.usage) usageRef.last = res.usage;
                    return res?.text || '';
                };
                const result2 = await runEscalation({ taskKind: routeKind, generate: generateFull, evaluate, ctx: { taskKind, escalated: true }, preferredProvider });
                const text2 = result2?.output || '';
                const parsed2 = _parseJsonSafe(text2, null);
                if (parsed2) {
                    parsed = parsed2;
                    text = text2;
                    cost += _costEur({ modelKey: result2?.modelKey, usage: usageRef.last });
                    escalatedToFull = true;
                }
            }
        } catch (_) { /* silent · escalation best-effort */ }
    }

    emit('phase', 'done', { taskKind, modelKey: result?.modelKey, tier, cost, output: parsed, slim, escalatedToFull });
    return { parsed, cost, modelKey: result?.modelKey || null, tier, slim, escalatedToFull };
}

// runExpertChain · async · executa les 8 fases en ordre
//
// args ·
//   context · {name, description, sector, entity_type, lifecycle_stage, vna_zoom}
//   generateWithProvider · fn real o mock
//   preferredProvider · 'anthropic'|'openai'|... o null
//   skip · {product, canvas, pitch, landing, valueMap, socs, sops, wos} (cada un boolean)
//   maxCostEur · si total > limit · atura
//   onEvent · fn({step, status, ...payload}) streaming
//
// Retorna · {
//   ok, costTotal,
//   productService, canvas, pitch, landing, valueMap, socs, sops, wos,
//   phasesRun, phasesSkipped, phaseErrors, ms
// }
export async function runExpertChain({
    context = {},
    generateWithProvider = null,
    preferredProvider = null,
    skip = {},
    maxCostEur = 1.0,
    onEvent = null,
    // v147 · slim mode · 'auto' = per-phase slimByDefault (recomanat · -50% cost) ·
    // true = SLIM globalment · false = FULL globalment (legacy)
    slim = 'auto',
    qualityThreshold = 70,
    // v132c · mode completar · si context.existingMap té roles/transactions ·
    // el prompt diu "enrich aquest mapa, no regeneris des de zero"
    existingMap = null,
    // v148 · pre-thinking clarify · si true · crida vnaClarify ABANS de la cadena
    // i merge respostes (clarifyAnswers) al context per a reduir ambigüitat
    clarifyBeforeRun = false,
    clarifyAnswers = null,         // [{ id, text, answer }] · pre-respostes (si UI les ha demanat)
    // v148 · gap detection post-Phase 5 · auto · resol "futbol sense scout" definitiu
    gapDetect = true,
    // v149 · role dedup · si embedder injectat · fusiona rols semànticament similars
    embedder = null,
    dedupThreshold = 0.85,
} = {}) {
    const t0 = Date.now();
    // v132c · injecta existingMap al context perquè phase 5 el rebi
    if (existingMap && (existingMap.roles?.length || existingMap.transactions?.length)) {
        context = { ...context, existingMap };
    }

    // v148 · pre-thinking · si clarifyBeforeRun · resol ambigüitat description
    // Cas 1 · clarifyAnswers passat per UI · merge directe (l'usuari ja ha respost)
    // Cas 2 · clarifyBeforeRun=true sense answers · genera questions ara (raon · si
    //         el caller vol fer-ho out-of-band · passar clarifyBeforeRun=false +
    //         clarifyAnswers post-respost)
    if (Array.isArray(clarifyAnswers) && clarifyAnswers.length > 0) {
        try {
            const { enrichContextWithAnswers } = await import('./vnaClarify.js');
            context = enrichContextWithAnswers(context, clarifyAnswers);
        } catch (_) {}
    } else if (clarifyBeforeRun && typeof generateWithProvider === 'function') {
        try {
            const { vnaClarify } = await import('./vnaClarify.js');
            const clarifyProvider = async (_m, opts) => generateWithProvider('auto-small', opts);
            const r = await vnaClarify({ context, provider: clarifyProvider });
            if (r.ok && r.questions?.length > 0) {
                // Emetem questions al onEvent · el caller decideix com gestionar-les
                // (mostrar UI · saltar · usar com a hints). Continuem sense respostes.
                if (typeof onEvent === 'function') {
                    try { onEvent({ step: 'clarify', status: 'questions', questions: r.questions, usage: r.usage }); } catch (_) {}
                }
            }
        } catch (_) {}
    }
    const emit = (step, status, payload = {}) => {
        if (typeof onEvent === 'function') { try { onEvent({ step, status, ...payload }); } catch (_) {} }
    };

    if (!generateWithProvider) throw new Error('runExpertChain · generateWithProvider required');

    // v126 · domain detection abans del loop · injectada a context per a la
    // fase 5 (design-value-map-rich) · evita rols genèrics no adequats al
    // sub-domini real (ex futbol · teatre · cures · escola)
    // v127 · telemetria via domainTelemetry · enriquim emit + persist event
    const detT0 = Date.now();
    const domainDetection = detectDomain({ name: context.name, description: context.description, sector: context.sector });
    const detMs = Date.now() - detT0;
    if (domainDetection) {
        emit('domain-detected', 'info', { domain: domainDetection.domain, confidence: domainDetection.confidence, label: domainDetection.label, via: 'keywords', durationMs: detMs });
        context = { ...context, domainDetection: { ...domainDetection, via: 'keywords' } };
    } else {
        emit('domain-detected', 'info', { domain: null, via: 'none', durationMs: detMs });
    }

    // v131b · sector context · load knowledge/sectors/{LETTER}.md i injecta
    // buildSectorContextBlock al prompt fase 5 (design-value-map-rich) ·
    // complementa el domainDetection amb CNAE-2009 oficial + rols arquetip per
    // nivell casteller del sector específic + SOPs canonical. Best-effort.
    if (context.sector && typeof context.sector === 'string') {
        try {
            const { loadSectorAgent, buildSectorContextBlock } = await import('./sectorAgentLoader.js');
            const agent = await loadSectorAgent(context.sector);
            if (agent) {
                const block = buildSectorContextBlock(agent);
                if (block && block.length > 20) {
                    context = { ...context, sectorContext: block, sectorAgent: { sectorId: agent.sectorId, rolesStatus: agent.rolesStatus, rolesInjectable: agent.rolesInjectable } };
                    emit('sector-context', 'info', { sectorId: agent.sectorId, status: agent.rolesStatus, injectable: agent.rolesInjectable, blockLen: block.length });
                }
            }
        } catch (_) { /* silent · sector .md no disponible o no canonical */ }
    }
    // Telemetria · best-effort · no bloca
    try {
        const { recordDetection } = await import('./domainTelemetry.js');
        await recordDetection({
            projectId: context.projectId || context.name || 'unknown-' + Date.now(),
            name:      context.name,
            sector:    context.sector,
            detection: domainDetection ? { ...domainDetection, via: 'keywords' } : null,
            durationMs: detMs,
        });
    } catch (_) { /* silent · telemetry mai trenca app */ }

    const out = {
        ok: true, costTotal: 0,
        domainDetection, productService: null, canvas: null, pitch: null, landing: null,
        valueMap: null, socs: [], sops: [], wos: [],
        phasesRun: [], phasesSkipped: [], phaseErrors: [],
    };

    // Phase 1-5 · sequencial (cada un usa l'output de l'anterior)
    for (const phase of CHAIN_PHASES) {
        if (out.costTotal >= maxCostEur) {
            emit('budget-exceeded', 'stop', { spent: out.costTotal, limit: maxCostEur });
            break;
        }
        if (skip[phase.skipKey]) {
            out.phasesSkipped.push(phase.id);
            emit('phase', 'skip', { phase: phase.id, reason: 'skip flag' });
            continue;
        }

        emit('phase', 'start', { phase: phase.id, tier: pickTier(phase.taskKind) });

        // Build context for this phase from out (so each phase can use prev outputs)
        const phaseCtx = _buildPhaseContext(phase, context, out);

        // Per-item phases (sops · wos) · iterate over the source array
        if (phase.perItem) {
            const items = phase.perItem === 'socs' ? out.socs
                       : phase.perItem === 'sops' ? out.sops
                       : [];
            for (const item of items) {
                if (out.costTotal >= maxCostEur) break;
                try {
                    const ctxPerItem = phase.perItem === 'socs'
                        ? { ...phaseCtx, soc: item }
                        : { ...phaseCtx, sop: item };
                    const r = await _runSingleTask({ taskKind: phase.taskKind, context: ctxPerItem, generateWithProvider, preferredProvider, emit });
                    out.costTotal += r.cost;
                    if (r.parsed) {
                        if (phase.perItem === 'socs' && Array.isArray(r.parsed.sops)) {
                            for (const sop of r.parsed.sops) out.sops.push({ ...sop, soc_ref: item.id });
                        } else if (phase.perItem === 'sops' && Array.isArray(r.parsed.wos)) {
                            for (const wo of r.parsed.wos) out.wos.push({ ...wo, sop_ref: item.id });
                        }
                    }
                } catch (e) {
                    out.phaseErrors.push({ phase: phase.id, item: item?.id, error: e?.message });
                    emit('phase', 'error', { phase: phase.id, item: item?.id, error: e?.message });
                }
            }
            out.phasesRun.push(phase.id);
            continue;
        }

        // Single-call phases (1-6)
        // v147 · slim per phase · 'auto' = phase.slimByDefault (default · -50% cost) ·
        // true|false = override global (legacy compat)
        const useSlim = slim === 'auto' ? !!phase.slimByDefault
                      : slim === true   ? true
                      : false;
        // qualityThreshold només actiu a design-value-map-rich (la fase pivotal)
        const usedThreshold = phase.id === 'design-value-map-rich' ? qualityThreshold : 0;
        try {
            const r = await _runSingleTask({ taskKind: phase.taskKind, context: phaseCtx, generateWithProvider, preferredProvider, emit, slim: useSlim, qualityThreshold: usedThreshold });
            out.costTotal += r.cost;
            if (r.parsed) _applyPhaseOutput(phase, out, r.parsed);
            out.phasesRun.push(phase.id);

            // v148 · post-Phase 5 · gap detection + multi-turn fill (resol "futbol sense scout")
            if (phase.id === 'design-value-map-rich' && gapDetect && out.valueMap) {
                try {
                    const { detectGaps, runGapFillTurn } = await import('./vnaGapDetector.js');
                    const gapResult = detectGaps({
                        map:             out.valueMap,
                        domainDetection: context.domainDetection,
                        sectorContext:   context.sectorAgent ? { expected_role_kinds: context.sectorAgent.rolesInjectable } : null,
                    });
                    if (!gapResult.hasAll && gapResult.gaps.length > 0) {
                        emit('phase', 'info', { phase: phase.id, gapsDetected: gapResult.gaps.length });
                        // Provider adapter compatible amb runGapFillTurn signature
                        const gapProvider = async (_m, opts) => generateWithProvider('auto-small', opts);
                        const fillResult = await runGapFillTurn({ map: out.valueMap, gaps: gapResult.gaps, provider: gapProvider });
                        if (fillResult.ok && !fillResult.noop) {
                            out.valueMap = fillResult.updatedMap;
                            emit('phase', 'info', { phase: phase.id, gapsFilled: fillResult.added?.roles?.length || 0, addedRoles: fillResult.added?.roles?.length || 0 });
                        }
                    }
                } catch (e) { /* silent · gap detection is best-effort */ }
            }

            // v149 · post-Phase 5 · roleDedup si embedder injectat (Ollama local · OpenAI · etc)
            if (phase.id === 'design-value-map-rich' && typeof embedder === 'function' && out.valueMap) {
                try {
                    const { dedupRoles } = await import('./roleDedup.js');
                    const dedupResult = await dedupRoles({ map: out.valueMap, embedder, threshold: dedupThreshold });
                    if (dedupResult.ok && !dedupResult.noChanges) {
                        out.valueMap = dedupResult.updatedMap;
                        emit('phase', 'info', { phase: phase.id, dedupMerged: dedupResult.merged?.length || 0, rolesBefore: dedupResult.rolesBefore, rolesAfter: dedupResult.rolesAfter });
                    }
                } catch (e) { /* silent · dedup is best-effort */ }
            }
        } catch (e) {
            out.phaseErrors.push({ phase: phase.id, error: e?.message });
            emit('phase', 'error', { phase: phase.id, error: e?.message });
        }
    }

    // v147 · post-chain · landing template generator (no LLM · usa canvas+pitch)
    if (!skip.landing && (out.canvas || out.pitch)) {
        out.landing = _buildLandingFromCanvasAndPitch({ canvas: out.canvas, pitch: out.pitch, name: context.name });
        out.phasesRun.push('landing-template');
        emit('phase', 'done', { phase: 'landing-template', generated: 'from-canvas-pitch' });
    }

    emit('finish', 'done', { ms: Date.now() - t0, cost: out.costTotal, phases: out.phasesRun.length });
    out.ms = Date.now() - t0;
    return out;
}

// v147 · landing template · canvas + pitch → landing object (sense LLM)
// Substitueix `personalize-landing` (1 fase + ~1700 tokens estalviats)
function _buildLandingFromCanvasAndPitch({ canvas = null, pitch = null, name = '' } = {}) {
    return {
        hero: {
            title:       name || 'Projecte',
            tagline:     pitch?.solution || canvas?.value_proposition || '',
            description: canvas?.vision || canvas?.mission || pitch?.problem || '',
        },
        problem:  pitch?.problem  || null,
        solution: pitch?.solution || null,
        whyNow:   pitch?.why_now  || pitch?.whyNow || null,
        traction: pitch?.traction || null,
        canvas: canvas ? {
            vision:           canvas.vision,
            mission:          canvas.mission,
            values:           canvas.values,
            valueProposition: canvas.value_proposition || canvas.valueProposition,
            stakeholders:     canvas.stakeholders,
        } : null,
        cta: [
            { label: '📧 Contacta',         action: 'contact' },
            { label: '📜 Signa un pacte',    action: 'pact' },
            { label: '🧠 Explora KB',        action: 'kb' },
        ],
        generatedBy: 'template-canvas-pitch-v147',
    };
}

// _buildPhaseContext · construeix el context de cada fase a partir dels outputs previs
function _buildPhaseContext(phase, baseCtx, out) {
    const c = { ...baseCtx };
    // Fase 2+ · canvas pot rebre productService (encara que opcional)
    if (out.productService) c.product_service = out.productService;
    // v147 · personalize-landing ELIMINAT · ara post-chain template (no LLM)
    // Fase 5 · value-map-rich rep canvas + pitch + domainDetection (v126)
    if (phase.id === 'design-value-map-rich') {
        c.canvas = out.canvas;
        c.pitch = out.pitch;
        // v126 · domain detector · injecta arquetip específic del sub-domini
        // (sports-team · arts-performance · coop-cares · edu-formation) quan
        // detectat amb confidence ≥ 0.4 · evita el fallback a 5 rols genèrics
        // del catàleg de sector (bug @alvaro · "equip de futbol" donava rols
        // d'Arts en comptes de rols esportius)
        try {
            // Lazy ESM-friendly · síncron via require simulat al package ESM
            // pattern · evitem await dins context builder · injectem només
            // si el caller l'ha computat i passat via baseCtx.domainDetection
            if (baseCtx.domainDetection) c.domainDetection = baseCtx.domainDetection;
            // v131b · sectorContext (string text del knowledge/sectors/X.md)
            if (baseCtx.sectorContext) c.sectorContext = baseCtx.sectorContext;
            // v132c · mode completar · si existingMap té roles/transactions ·
            // el prompt sap que ha d'enriquir, no regenerar des de zero
            if (baseCtx.existingMap && (baseCtx.existingMap.roles?.length || baseCtx.existingMap.transactions?.length)) {
                c.existingMap = baseCtx.existingMap;
            }
        } catch (_) {}
    }
    // Fase 6 · socs reb el valueMap
    if (phase.id === 'generate-socs-from-value-map') {
        c.value_map = out.valueMap;
    }
    // Fase 7 · sops reb el soc (s'afegirà al loop per-item) · project_ctx
    if (phase.id === 'generate-sops-with-skills') {
        c.project_ctx = { description: baseCtx.description, sector: baseCtx.sector, lifecycle_stage: baseCtx.lifecycle_stage, entity_type: baseCtx.entity_type, name: baseCtx.name };
        c.role_kinds = (out.valueMap?.roles || []).map(r => r.kind).filter(Boolean);
    }
    // Fase 8 · wos reb el sop (s'afegirà al loop per-item) · project_ctx
    if (phase.id === 'generate-wos-from-sop') {
        c.project_ctx = { description: baseCtx.description, sector: baseCtx.sector, lifecycle_stage: baseCtx.lifecycle_stage, entity_type: baseCtx.entity_type, name: baseCtx.name };
    }
    return c;
}

// _applyPhaseOutput · escriu el resultat al out segons la fase
function _applyPhaseOutput(phase, out, parsed) {
    switch (phase.id) {
        case 'define-product-service':       out.productService = parsed; break;
        case 'personalize-canvas':           out.canvas = parsed; break;
        case 'personalize-pitch':            out.pitch = parsed; break;
        case 'personalize-landing':          out.landing = parsed; break;
        case 'design-value-map-rich':        out.valueMap = parsed; break;
        case 'generate-socs-from-value-map':
            if (Array.isArray(parsed.socs)) out.socs = parsed.socs;
            if (parsed.presentationHints) out.presentationHints = parsed.presentationHints;
            break;
    }
}

// listChainPhases · helper UI · per a /prompts-debug i CreateLiveView
export function listChainPhases() {
    return CHAIN_PHASES.slice();
}
