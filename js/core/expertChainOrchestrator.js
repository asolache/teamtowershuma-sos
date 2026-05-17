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
export const CHAIN_PHASES = Object.freeze([
    { id: 'define-product-service',       skipKey: 'product',       taskKind: 'define-product-service' },
    { id: 'personalize-canvas',           skipKey: 'canvas',        taskKind: 'personalize-canvas' },
    { id: 'personalize-pitch',            skipKey: 'pitch',         taskKind: 'personalize-pitch' },
    { id: 'personalize-landing',          skipKey: 'landing',       taskKind: 'personalize-landing' },
    { id: 'design-value-map-rich',        skipKey: 'valueMap',      taskKind: 'design-value-map-rich' },
    { id: 'generate-socs-from-value-map', skipKey: 'socs',          taskKind: 'generate-socs-from-value-map' },
    { id: 'generate-sops-with-skills',    skipKey: 'sops',          taskKind: 'generate-sops-with-skills',   perItem: 'socs' },
    { id: 'generate-wos-from-sop',        skipKey: 'wos',           taskKind: 'generate-wos-from-sop',       perItem: 'sops' },
]);

// _costFromUsage · simple · USD * 0.92 ≈ EUR
function _costEur({ modelKey, usage }) {
    if (!modelKey || !usage) return 0;
    const usd = estimateCostUsd(modelKey, { inputTokens: usage.inputTokens || 0, outputTokens: usage.outputTokens || 0 });
    return (usd || 0) * 0.92;
}

// _runSingleTask · pure helper · build prompt + escalation + parse
async function _runSingleTask({ taskKind, context, generateWithProvider, preferredProvider, emit }) {
    const prompt = buildPrompt({ taskKind, context });
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
    const text = result?.output || '';
    const parsed = _parseJsonSafe(text, null);
    const cost = _costEur({ modelKey: result?.modelKey, usage: usageRef.last });

    emit('phase', 'done', { taskKind, modelKey: result?.modelKey, tier, cost, output: parsed });
    return { parsed, cost, modelKey: result?.modelKey || null, tier };
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
} = {}) {
    const t0 = Date.now();
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
        try {
            const r = await _runSingleTask({ taskKind: phase.taskKind, context: phaseCtx, generateWithProvider, preferredProvider, emit });
            out.costTotal += r.cost;
            if (r.parsed) _applyPhaseOutput(phase, out, r.parsed);
            out.phasesRun.push(phase.id);
        } catch (e) {
            out.phaseErrors.push({ phase: phase.id, error: e?.message });
            emit('phase', 'error', { phase: phase.id, error: e?.message });
        }
    }

    emit('finish', 'done', { ms: Date.now() - t0, cost: out.costTotal, phases: out.phasesRun.length });
    out.ms = Date.now() - t0;
    return out;
}

// _buildPhaseContext · construeix el context de cada fase a partir dels outputs previs
function _buildPhaseContext(phase, baseCtx, out) {
    const c = { ...baseCtx };
    // Fase 2+ · canvas pot rebre productService (encara que opcional)
    if (out.productService) c.product_service = out.productService;
    // Fase 4 · landing rep canvas + pitch
    if (phase.id === 'personalize-landing') {
        c.canvas = out.canvas;
        c.pitch = out.pitch;
    }
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
