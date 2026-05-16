// =============================================================================
// TEAMTOWERS SOS V11 — AI DECISION SERVICE (AI-COST-QA-001 sprint C)
// Ruta · /js/core/aiDecisionService.js
//
// Meta-orquestrador · decideix ABANS de fer una crida IA ·
//   1. Cal IA realment? · regex/lookup determinista? → skip
//   2. Cache hit? → return cached, cost 0
//   3. Budget OK? → si NO i hard-block, refuse
//   4. Quin tier? · draft/quality/critical segons context
//   5. Cal evaluator? · cheap evaluator per validar resposta cara cheap?
//   6. Batch amb altres? · si crida petita i hi ha cua, agrupa
//
// Pure (decideStrategy retorna recomanació · no executa).
// =============================================================================

import { hashKey, has as cacheHas } from './aiCacheService.js';
import { canSpend, budgetStatus } from './aiBudgetService.js';
import { pickModelForTier, estimatePromptCostEur } from './aiRouterService.js';

// Patterns deterministes · no requereixen IA · regex/lookup
const DETERMINISTIC_TASKS = Object.freeze([
    'tag-from-text-exact-match',
    'sector-from-keywords-strict',
    'cost-classification-simple',
]);

// decideStrategy · pure · retorna recomanació detallada de què fer.
//
// Input ·
//   prompt           · text user prompt
//   taskKind         · routing key
//   suggestedTier    · 'draft' | 'quality' | 'critical' (default 'quality')
//   projectId        · per a budget enforcement
//   requireEvaluator · true si volem post-call quality gate
//   isDeterministic  · força skip si l'usuari sap que pot evitar IA
//   isBatchable      · true si la crida pot esperar 500ms per a join
//
// Output · estratègia recomanada · el caller la pot ignorar
//   {
//     decision: 'skip' | 'cache-hit' | 'block' | 'run',
//     reason: '...',
//     modelKey?,
//     useCache?,
//     useEvaluator?,
//     canBatch?,
//     estimatedCostEur?,
//     budget: { state, spent, budget, ratio }
//   }
export function decideStrategy({
    prompt = '',
    taskKind = 'creative-narrative',
    suggestedTier = 'quality',
    projectId = null,
    requireEvaluator = false,
    isDeterministic = false,
    isBatchable = false,
    systemPrompt = '',
    temperature = 0.7,
} = {}) {
    // 1) Skip si deterministe
    if (isDeterministic || DETERMINISTIC_TASKS.includes(taskKind)) {
        return {
            decision: 'skip',
            reason: 'task deterministic · IA innecessària',
            estimatedCostEur: 0,
            budget: projectId ? budgetStatus(projectId) : null,
        };
    }

    // 2) Tier → model resolution
    const modelKey = pickModelForTier({ taskKind, taskTier: suggestedTier });
    const estCost = estimatePromptCostEur({ modelKey, prompt }) || 0;

    // 3) Cache check
    const cacheK = hashKey({ prompt, systemPrompt, temperature, modelKey });
    if (cacheHas(cacheK)) {
        return {
            decision: 'cache-hit',
            reason: 'cache hit · cost 0',
            modelKey,
            useCache: true,
            cacheKey: cacheK,
            estimatedCostEur: 0,
            budget: projectId ? budgetStatus(projectId) : null,
        };
    }

    // 4) Budget check
    const budgetCheck = projectId ? canSpend(projectId, estCost) : { ok: true, status: null };
    if (!budgetCheck.ok) {
        return {
            decision: 'block',
            reason: budgetCheck.reason,
            modelKey,
            estimatedCostEur: estCost,
            budget: budgetCheck.status,
        };
    }

    // 5) Use evaluator? · per tasques crítiques (data-classification · audit)
    //    En tier draft + critical-task → evaluator val la pena
    //    En tier critical → ja és gold standard · evaluator opcional
    const shouldUseEvaluator = requireEvaluator
        || (suggestedTier === 'draft' && _isCriticalTask(taskKind));

    return {
        decision: 'run',
        reason: 'proceed amb model + tier seleccionat',
        modelKey,
        cacheKey: cacheK,
        useCache: true,                 // post-call save al cache
        useEvaluator: shouldUseEvaluator,
        canBatch: isBatchable && _isSmallPrompt(prompt),
        estimatedCostEur: estCost,
        budget: budgetCheck.status,
    };
}

function _isCriticalTask(taskKind) {
    return ['quality-audit', 'deep-reasoning', 'value-map-design'].includes(taskKind);
}

function _isSmallPrompt(prompt) {
    return typeof prompt === 'string' && prompt.length < 800;
}

// formatStrategyForUi · helper per a aiTierIndicator
export function formatStrategyForUi(strategy) {
    if (!strategy) return '';
    switch (strategy.decision) {
        case 'skip':       return '🚫 Sense IA · ' + (strategy.reason || '');
        case 'cache-hit':  return '⚡ Cache · sense cost';
        case 'block':      return '⛔ Bloquejat · ' + (strategy.reason || '');
        case 'run':
            const parts = [];
            parts.push('▶ ' + (strategy.modelKey || ''));
            if (strategy.useEvaluator) parts.push('+ evaluator');
            if (strategy.canBatch)    parts.push('+ batch-eligible');
            if (typeof strategy.estimatedCostEur === 'number') {
                parts.push('≈' + strategy.estimatedCostEur.toFixed(4) + '€');
            }
            return parts.join(' · ');
        default: return '';
    }
}
