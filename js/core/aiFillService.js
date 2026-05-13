// =============================================================================
// TEAMTOWERS SOS V11 — AI FILL SERVICE (IA-CONTEXT-001 sprint A · final layer)
//
// Orquestrador top-level que connecta:
//   iaContextService.buildContextForDim → aiRouterService.runEscalation →
//   aiProviderService.generateWithProvider → JSON shape evaluator →
//   ai_audit log al KB → retorna { draft, attempts, totalCost }
//
// La UI (/quality?project={id}) crida aiFillDim({ projectId, dimId }) i
// rep un draft preview que l'usuari pot acceptar/rebutjar/editar.
// =============================================================================

import { buildContextForDim, DIM_TO_TASK_KIND } from './iaContextService.js';
import { runEscalation, AI_MODELS, estimateCostUsd } from './aiRouterService.js';
import { generateWithProvider, makeJsonShapeEvaluator, actualCostUsd } from './aiProviderService.js';
// BIZ-MODEL-001 sprint B · marge SOS sobre cost provider IA
import { applyMarginWithOverride } from './billingService.js';

const USD_EUR = 0.92;

// Camps JSON mínims esperats per cada dim · pel default evaluator
const REQUIRED_FIELDS_BY_DIM = Object.freeze({
    landing:      ['description'],
    valueMap:     ['addRoles'],
    deliverables: ['addTransactions'],
    sops:         ['newSops'],
    workshops:    ['newWorkshops'],
});

// loadProjectContext · default · llegeix KB i project per omplir l'context
// El consumidor pot passar el seu propi loader per a tests.
async function _defaultLoadContext({ projectId }) {
    const { store } = await import('./store.js');
    const { KB }    = await import('./kb.js');
    await store.init();
    await KB.init();
    const state   = store.getState();
    const project = (state.projects || []).find(p => p && p.id === projectId);
    if (!project) throw new Error('aiFillDim · project not found · ' + projectId);
    const [sops, workshops, marketItems] = await Promise.all([
        KB.query({ type: 'sop' }).catch(() => []),
        KB.query({ type: 'workshop' }).catch(() => []),
        KB.query({ type: 'market_item' }).catch(() => []),
    ]);
    return { project, sops, workshops, marketItems };
}

// Persisteix un ai_audit log al KB per a auditoria / cost tracking
async function _persistAuditLog({ projectId, dimId, attempts, totalCostUsd, accepted, draft, refs, billing = null }) {
    try {
        const { KB } = await import('./kb.js');
        await KB.init();
        const id = 'ai-audit-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        const now = Date.now();
        const baseCostEur = Number((totalCostUsd * USD_EUR).toFixed(6));
        await KB.upsert({
            id,
            type: 'ai_audit',
            content: {
                projectId,
                dimId,
                attempts,
                totalCostUsd,
                totalCostEur: baseCostEur,
                // BIZ-MODEL-001 sprint B · marge SOS (si proveït pel caller)
                marginEur:    billing ? billing.marginEur : 0,
                marginPct:    billing ? billing.marginPct : 0,
                totalWithMarginEur: billing ? billing.totalEur : baseCostEur,
                billingKind:  billing ? billing.kind : 'ai',
                accepted: !!accepted,
                draftPreview: draft ? draft.slice(0, 200) : null,
                refs,
                createdAt: now,
            },
            keywords: ['type:ai-audit', 'projectId:' + projectId, 'dim:' + dimId],
            createdAt: now,
            updatedAt: now,
        });
        return id;
    } catch (_) { return null; }
}

// Marca un audit log com acceptat (l'usuari ha clicat "accept")
export async function markAuditAccepted(auditId) {
    if (!auditId) return false;
    try {
        const { KB } = await import('./kb.js');
        const node = await KB.getNode(auditId);
        if (!node) return false;
        node.content.accepted = true;
        node.content.acceptedAt = Date.now();
        node.updatedAt = Date.now();
        await KB.upsert(node);
        return true;
    } catch (_) { return false; }
}

// aiFillDim · async · main entry point
export async function aiFillDim({
    projectId,
    dimId,
    sectorReadiness = null,
    similarProjects = [],
    criticalRoles   = [],
    extraContext    = null,    // IA-CONTEXT-001 sprint B · user input opcional
    maxOutputTokens = 800,
    temperature     = 0.4,
    stopAt          = 'premium',
    loadContext     = _defaultLoadContext,
    provider        = generateWithProvider,
    persistAudit    = _persistAuditLog,
} = {}) {
    if (!projectId) throw new Error('aiFillDim requires projectId');
    if (!dimId)     throw new Error('aiFillDim requires dimId');
    const taskKind = DIM_TO_TASK_KIND[dimId];
    if (!taskKind) throw new Error('aiFillDim · dim sense taskKind associat · ' + dimId);

    // 1 · Pre-càrrega KB
    const { project, sops, workshops, marketItems } = await loadContext({ projectId });

    // 2 · Build context per dim · inclou extraContext si l'usuari l'ha passat
    const ctx = buildContextForDim(dimId, {
        project, sops, workshops, marketItems,
        sectorReadiness, similarProjects, criticalRoles,
        extraContext,
    });

    // 3 · Setup generate + evaluate per runEscalation
    let totalCostUsd = 0;
    const attemptCosts = [];
    const evaluator = makeJsonShapeEvaluator(REQUIRED_FIELDS_BY_DIM[dimId] || []);

    const generate = async (modelKey) => {
        const out = await provider(modelKey, {
            systemPrompt:    ctx.systemPrompt,
            userPrompt:      ctx.userPrompt,
            maxOutputTokens,
            temperature,
        });
        const cost = actualCostUsd(modelKey, out.usage) ?? 0;
        totalCostUsd += cost;
        attemptCosts.push({ modelKey, costUsd: cost });
        return out;
    };

    // 4 · Run escalation chain
    let result;
    try {
        result = await runEscalation({
            taskKind, generate, evaluate: evaluator,
            stopAt,
        });
    } catch (e) {
        // Persisteix audit log fins i tot si fail
        await persistAudit({
            projectId, dimId,
            attempts: [{ error: e?.message || String(e) }],
            totalCostUsd,
            accepted: false,
            draft: null,
            refs: ctx.refs,
        });
        throw e;
    }

    // 5 · BIZ-MODEL-001 sprint B · marge SOS sobre cost provider
    const baseCostEur = Number((totalCostUsd * USD_EUR).toFixed(6));
    const margin = applyMarginWithOverride({ baseCostEur, kind: 'ai' });

    // 6 · Persisteix audit log (no accepted encara) · inclou marge
    const auditId = await persistAudit({
        projectId, dimId,
        attempts: result.attempts,
        totalCostUsd,
        accepted: false,
        draft: result.output?.text || null,
        refs: ctx.refs,
        billing: margin,
    });

    return {
        auditId,
        dimId,
        taskKind,
        modelKey:    result.modelKey,
        draft:       result.output ? result.output.text : null,
        parsedDraft: result.output && result.output.text
            ? _safeParseJson(result.output.text)
            : null,
        attempts:    result.attempts,
        attemptCosts,
        totalCostUsd,
        totalCostEur:  baseCostEur,
        marginEur:     margin.marginEur,
        marginPct:     margin.marginPct,
        totalWithMarginEur: margin.totalEur,
        escalatedExhausted: !!result.escalatedExhausted,
        refs:        ctx.refs,
        contextTokens: ctx.contextTokens,
    };
}

function _safeParseJson(text) {
    if (typeof text !== 'string') return null;
    let t = text.trim();
    const fenced = t.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (fenced) t = fenced[1].trim();
    try { return JSON.parse(t); } catch (_) { return null; }
}
