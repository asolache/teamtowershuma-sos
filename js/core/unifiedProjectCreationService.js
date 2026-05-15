// =============================================================================
// TEAMTOWERS SOS V11 — UNIFIED PROJECT CREATION (B-UNIFIED-FORM-001 sprint A)
// Ruta · /js/core/unifiedProjectCreationService.js
//
// Pipeline "Plan → Fan-out → Reduce" per a crear un projecte amb IA-driven
// drafts adaptats al (project_type × maturity_stage) via plantilles C2.
//
// Decisió @alvaro · "1 sol form per a tots els projectes · canvas+pitch+
// tokenomics generats amb IA realista no genèrica".
//
// Pipeline ·
//   1. PLAN · classificar projecte + escollir plantilla + pla d'execució
//   2. FAN-OUT · generar canvas + VNA + SOPs en paral·lel (cheap tier)
//   3. REDUCE · validar coherència + persistir nodes
//
// Pure (build*) · async (executeCreationPlan fa les crides reals).
// =============================================================================

import { classifyProject } from './projectClassifierService.js';
import { getTemplate, buildTemplateAwarePrompt } from './projectTemplateService.js';
import { decideStrategy } from './aiDecisionService.js';
import { recordSpend } from './aiBudgetService.js';
import { set as cacheSet, get as cacheGet, recordHit, recordMiss } from './aiCacheService.js';

export const UNIFIED_VERSION = 'v1.0';

export const AMBITION_LEVELS = Object.freeze({
    light:     { label: 'Lleuger · esquelet mínim',          fanOutSteps: ['canvas'], tier: 'draft' },
    standard:  { label: 'Estàndard · canvas + pitch + 3-5 rols', fanOutSteps: ['canvas', 'vna', 'sops'], tier: 'draft' },
    max:       { label: 'MAX · tot el cicle complet',        fanOutSteps: ['canvas', 'vna', 'sops', 'tokenomics', 'workshops'], tier: 'quality' },
});

// ── PLAN · pure · classificació + plantilla + steps ───────────────────────

// buildCreationPlan · pure (sync · sense IA) · agregada des de la
// classificació + plantilla. Si classification absent · es fa heurística.
export function buildCreationPlan({
    name,
    description,
    sector = null,
    parentProjectName = null,
    ambition = 'standard',
    classification = null,         // si ja classificat per UI · skip
} = {}) {
    if (!name) throw new Error('buildCreationPlan · name required');
    if (!AMBITION_LEVELS[ambition]) throw new Error('buildCreationPlan · ambition invalid');

    return {
        name,
        description: description || '',
        sector,
        parentProjectName,
        ambition,
        ambitionDef: AMBITION_LEVELS[ambition],
        classification,             // pot ser null · executeCreationPlan classifica
        templateKey: null,          // serà ompert quan classification disponible
        stepsToRun: AMBITION_LEVELS[ambition].fanOutSteps.slice(),
        startedAt: null,
        completedAt: null,
        version: UNIFIED_VERSION,
    };
}

// ── Execution · async · classify + run fan-out ───────────────────────────

// executeCreationPlan · async · executa el pipeline complet.
//
// args ·
//   plan · resultat de buildCreationPlan
//   projectId · per a budget tracking
//   onProgress · fn(stepKind, status) · UI feedback callback
//
// Retorna ·
//   { ok, plan, classification, template, results: { canvas, vna, sops, ... },
//     cost, errors }
export async function executeCreationPlan(plan, {
    projectId = null,
    onProgress = null,
    preferCache = true,
} = {}) {
    if (!plan) throw new Error('executeCreationPlan · plan required');
    const errors = [];
    let totalCost = 0;

    const report = (step, status, extra = {}) => {
        if (typeof onProgress === 'function') {
            try { onProgress({ step, status, ...extra }); } catch (_) {}
        }
    };

    // ─── 1. CLASSIFY (cheap · ~0.002€) ────────────────────────────────────
    let classification = plan.classification;
    if (!classification) {
        report('classify', 'start');
        try {
            classification = await classifyProject({
                name: plan.name,
                description: plan.description,
                sector: plan.sector,
                parentProjectName: plan.parentProjectName,
                projectId,
            });
            if (classification?.cost) totalCost += classification.cost;
            report('classify', 'done', { classification });
        } catch (e) {
            errors.push({ step: 'classify', error: e?.message || 'classify failed' });
            // Fallback heuristic-only
            classification = { project_type: 'startup-coop-tradicional', lifecycle_stage: 'idea', scale: 'local', dependency_type: 'standalone', source: 'fallback' };
            report('classify', 'fallback', { classification });
        }
    }

    // ─── 2. TEMPLATE ──────────────────────────────────────────────────────
    const template = getTemplate({
        projectType: classification.project_type,
        lifecycleStage: classification.lifecycle_stage,
    });

    // ─── 3. FAN-OUT · paral·lel per a cada step ───────────────────────────
    const results = {};
    const fanOutPromises = plan.stepsToRun.map(stepKind =>
        _runFanOutStep({
            stepKind,
            template,
            templateKey: template.key,
            plan,
            projectId,
            tier: plan.ambitionDef.tier,
            preferCache,
            onProgress: report,
        }).then(res => {
            results[stepKind] = res;
            if (res.cost) totalCost += res.cost;
            if (res.error) errors.push({ step: stepKind, error: res.error });
            return res;
        }).catch(e => {
            errors.push({ step: stepKind, error: e?.message || 'fan-out failed' });
            results[stepKind] = { error: e?.message, ok: false };
        })
    );
    await Promise.all(fanOutPromises);

    // ─── 4. REDUCE · validate coherence (light · sense IA extra) ─────────
    report('reduce', 'start');
    const reducedResults = _reduceResults(results, { plan, classification, template });
    report('reduce', 'done');

    return {
        ok: errors.length === 0 || Object.keys(results).some(k => results[k].ok),
        plan,
        classification,
        template,
        results: reducedResults,
        cost: Number(totalCost.toFixed(4)),
        errors,
        version: UNIFIED_VERSION,
    };
}

// _runFanOutStep · async · 1 step de la fan-out
async function _runFanOutStep({ stepKind, template, templateKey, plan, projectId, tier, preferCache, onProgress }) {
    onProgress(stepKind, 'start');

    const prompt = buildTemplateAwarePrompt({
        templateKey,
        stepKind: stepKind === 'sops' ? 'sop' : (stepKind === 'tokenomics' ? 'kpi' : stepKind),
        projectName: plan.name,
        projectDescription: plan.description,
        sectorContext: plan.sector,
    });
    const taskKind = _taskKindForStep(stepKind);

    // Decision (cache · budget · skip)
    const strategy = decideStrategy({
        prompt,
        taskKind,
        suggestedTier: tier,
        projectId,
    });

    if (strategy.decision === 'block') {
        onProgress(stepKind, 'blocked', { reason: strategy.reason });
        return { ok: false, error: 'budget block · ' + strategy.reason, source: 'block', cost: 0 };
    }

    if (preferCache && strategy.decision === 'cache-hit') {
        recordHit();
        onProgress(stepKind, 'cache-hit');
        return { ok: true, output: cacheGet(strategy.cacheKey), cost: 0, source: 'cache' };
    }
    recordMiss();

    // Real call
    try {
        const { runPrompt } = await import('./aiRouterService.js');
        const result = await runPrompt({
            prompt: prompt + '\n\nSurt sols el contingut · prosa neta · sense ' +
                'comentaris ni marcs JSON · 100-300 paraules.',
            taskKind,
            taskTier: tier,
            systemPrompt: 'Ets ajudant cooperatiu SOS · respons concis · proseic · català/castellà segons context.',
            maxOutputTokens: 1000,
            temperature: 0.6,
            projectId,
        });
        const output = (result.output || result.text || '').trim();
        const cost = result.usage ? _estimateUsageCostEur(result.modelKey, result.usage) : 0;
        if (projectId && cost > 0) recordSpend(projectId, cost);
        if (strategy.cacheKey) cacheSet(strategy.cacheKey, output);
        onProgress(stepKind, 'done', { modelKey: result.modelKey, cost });
        return { ok: true, output, cost, source: 'ai', modelKey: result.modelKey };
    } catch (e) {
        onProgress(stepKind, 'error', { error: e?.message });
        return { ok: false, error: e?.message || 'ai-error', source: 'ai-error', cost: 0 };
    }
}

function _taskKindForStep(stepKind) {
    switch (stepKind) {
        case 'canvas':     return 'creative-narrative';
        case 'vna':        return 'value-map-design';
        case 'sops':       return 'sop-structured';
        case 'tokenomics': return 'schema-fill-simple';
        case 'workshops':  return 'workshop-outline';
        case 'pitch':      return 'creative-narrative';
        default:           return 'creative-narrative';
    }
}

// _reduceResults · pure · post-process · valida coherence entre steps
function _reduceResults(results, { plan, classification, template }) {
    const out = {};
    for (const [key, r] of Object.entries(results)) {
        if (!r) continue;
        out[key] = {
            ok: !!r.ok,
            output: r.output || null,
            source: r.source || 'unknown',
            cost: r.cost || 0,
            modelKey: r.modelKey || null,
            error: r.error || null,
        };
    }
    // Add convenience aggregate
    const ok = Object.values(out).filter(r => r.ok).length;
    const total = Object.keys(out).length;
    out.__summary = {
        stepsCompleted: ok,
        stepsTotal: total,
        completionRatio: total > 0 ? Number((ok / total).toFixed(2)) : 0,
        templateKey: template.key,
        classification,
    };
    return out;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function _estimateUsageCostEur(modelKey, usage) {
    try {
        const { actualCostUsd } = require('./aiProviderService.js');
        const usd = actualCostUsd(modelKey, usage) || 0;
        return Number((usd * 0.92).toFixed(6));
    } catch (_) { return 0; }
}

// estimatePlanCost · pure · estima cost abans d'executar
export function estimatePlanCost(plan) {
    if (!plan) return 0;
    const stepCount = plan.stepsToRun.length;
    const perStep = plan.ambitionDef?.tier === 'quality' ? 0.005 : 0.002;
    return Number((stepCount * perStep + 0.002).toFixed(4)); // +classify
}
