// =============================================================================
// TEAMTOWERS SOS V11 — BACKLOG AUTONOMOUS AGENT (TDD-AGENT sprint A)
//
// Agent IA que processa el backlog (o un subset) amb un loop RED→GREEN:
//
//   loop fins a (totes verdes · maxIterations · budgetEur exhaurit):
//     1. pickNextRed(items)  · primer pending segons prioritzed order
//     2. runSprintItem(...)  · invoca IA via escalation chain (failover)
//     3. evaluator(output)   · accepta o rebutja segons regla TDD
//     4. si ok · marca status='completed' al backlog (in-memory)
//        · upsert al KB · log run amb evalReason='green'
//     5. si fail · log + retry budget · si exhaurit, marca 'needs_review'
//
// PRINCIPIS · pure + injectable · zero IA hardcoded · zero KB hardcoded ·
// el test passa mocks per a `runner` (el que executa la IA) i `evaluator`.
//
// Reusa · sprintOrchestrator.runSprintItem (failover via runEscalation),
//         aiEvaluatorService.getEvaluatorForTask (sentinel pattern).
//
// Cost tracking · cada run inclou `usage` + `modelKey` · estimateCostEur del
// aiRouterService produeix € real · sumat al `totalCostEur`.
// =============================================================================

import { runSprintItem, persistSprintRun } from './sprintOrchestrator.js';
import { prioritizedPendingItems, INITIAL_BACKLOG } from './backlogManifest.js';
import { getEvaluatorForTask, defaultEvaluator } from './aiEvaluatorService.js';
import { estimateCostEur } from './aiRouterService.js';

export const AGENT_RUN_TYPE = 'autonomous_agent_run';

// runUntilGreen · async · main loop
//
// args:
//   items         · array de backlog items (per defecte INITIAL_BACKLOG · mutable copy)
//   evaluator     · async (output, item, runMeta) → { ok, score?, reason? }
//                   per defecte · getEvaluatorForTask(item.expectedKind || 'creative-narrative')
//   maxIterations · cap d'execucions IA (default 20)
//   budgetEur     · cost màxim cumulat (default 5€)
//   runner        · override per tests · si null usa runSprintItem default
//   kb            · per a persistir sprint_run nodes (opcional · NULL = skip)
//   onIteration   · callback opcional · (iterEvent) => void · per a UI live update
//
// Retorna · {
//   completedCount, attemptedCount, iterationsRun, totalCostEur, budgetExhausted,
//   greenItems:[itemId], failedItems:[itemId], skippedItems:[itemId],
//   results:[{itemId, status, iteration, costEur, evalReason}], log:[]
// }
export async function runUntilGreen({
    items          = null,
    evaluator      = null,
    maxIterations  = 20,
    budgetEur      = 5,
    runner         = null,
    kb             = null,
    onIteration    = null,
    sprintKind     = 'draft',
    taskKind       = 'creative-narrative',
    persist        = false,
    maxAttemptsPerItem = 1,
} = {}) {
    // Treballem amb una còpia mutable · els originals d'INITIAL_BACKLOG són Object.frozen
    const working = (items || INITIAL_BACKLOG).map(it => ({ ...it }));
    const attempts = new Map();   // itemId → count d'intents d'aquesta sessió
    const results = [];
    const log     = [];
    let iter        = 0;
    let totalCostEur = 0;
    let budgetExhausted = false;

    while (iter < maxIterations) {
        if (totalCostEur >= budgetEur) {
            budgetExhausted = true;
            log.push({ ts: Date.now(), kind: 'budget-exhausted', totalCostEur, budgetEur });
            break;
        }
        const next = _pickNextRed(working, attempts, maxAttemptsPerItem);
        if (!next) {
            log.push({ ts: Date.now(), kind: 'all-green-or-exhausted' });
            break;   // no més pendents elegibles
        }
        attempts.set(next.id, (attempts.get(next.id) || 0) + 1);
        iter++;

        // 1. Executa el run IA (failover via runSprintItem default · o mock)
        let run, output, error;
        try {
            const r = await runSprintItem({
                itemId:  next.id,
                kind:    sprintKind,
                items:   working,
                runner,
                taskKind,
            });
            run    = r.run;
            output = r.output;
            error  = r.error;
        } catch (e) {
            error = e?.message || String(e);
        }

        // 2. Cost tracking · estimateCostEur del modelKey + usage
        const costEur = _estimateRunCost(run);
        totalCostEur += costEur;
        totalCostEur = Number(totalCostEur.toFixed(4));

        // 3. Persist run (si kb proveït)
        if (persist && kb && run) {
            await persistSprintRun({ kb, run });
        }

        // 4. Evaluator · accepta o rebutja l'output
        let evalRes = { ok: false, reason: 'no-evaluator' };
        if (!error && output) {
            const evalFn = evaluator || getEvaluatorForTask(taskKind);
            try {
                evalRes = await evalFn(output, next, { run, iteration: iter });
            } catch (e) {
                evalRes = { ok: false, reason: 'evaluator-throw: ' + (e?.message || e) };
            }
        } else if (error) {
            evalRes = { ok: false, reason: 'runner-error: ' + error };
        }

        const itemResult = {
            itemId:     next.id,
            status:     evalRes.ok ? 'green' : 'red',
            iteration:  iter,
            costEur,
            modelKey:   run?.content?.modelKey || null,
            evalReason: evalRes.reason || null,
            evalScore:  typeof evalRes.score === 'number' ? evalRes.score : null,
        };
        results.push(itemResult);
        log.push({ ts: Date.now(), kind: evalRes.ok ? 'green' : 'red', ...itemResult });

        // 5. Si verd · marca item completed al working set · persisteix si calgués
        if (evalRes.ok) {
            const idx = working.findIndex(i => i.id === next.id);
            if (idx >= 0) {
                working[idx] = {
                    ...working[idx],
                    status: 'completed',
                    completedAt:    new Date().toISOString().slice(0, 10),
                    completedPr:    'agent-' + (run?.id || iter),
                    agentOutputRef: run?.id || null,
                };
            }
        }

        if (typeof onIteration === 'function') {
            try { onIteration({ ...itemResult, totalCostEur, budgetEur }); } catch (_) {}
        }
    }

    const greenItems   = results.filter(r => r.status === 'green').map(r => r.itemId);
    const failedItems  = results.filter(r => r.status === 'red').map(r => r.itemId);
    const skippedItems = working.filter(it => it.status === 'pending').map(it => it.id);

    return {
        completedCount:  greenItems.length,
        attemptedCount:  results.length,
        iterationsRun:   iter,
        totalCostEur,
        budgetExhausted,
        greenItems,
        failedItems,
        skippedItems,
        results,
        log,
        workingBacklog:  working,
    };
}

// _pickNextRed · helper · primer pending segons prioritzed order que encara
// no ha exhaurit maxAttemptsPerItem. Per defecte 1 intent per item · evita
// loops infinits si l'evaluator rebutja repetidament un mateix item.
function _pickNextRed(items, attempts = null, maxAttemptsPerItem = Infinity) {
    const queue = prioritizedPendingItems(items);
    if (!attempts || !(attempts instanceof Map)) {
        return queue.length > 0 ? queue[0] : null;
    }
    for (const item of queue) {
        const tried = attempts.get(item.id) || 0;
        if (tried < maxAttemptsPerItem) return item;
    }
    return null;
}

// _estimateRunCost · helper · estimateCostEur en € (USD→EUR ja inclòs)
function _estimateRunCost(run) {
    if (!run || !run.content) return 0;
    const c = run.content;
    if (!c.modelKey || !c.usage) return 0;
    try {
        const cost = estimateCostEur(c.modelKey, {
            inputTokens:  Number(c.usage.inputTokens  || c.usage.input  || 0),
            outputTokens: Number(c.usage.outputTokens || c.usage.output || 0),
        });
        return Number(cost.toFixed(6)) || 0;
    } catch (_) {
        return 0;
    }
}

// dryRun · pure · sense IA · simula què faria l'agent per a UI preview
// Retorna · { queueLength, nextItem, estimatedHoursIfManual, items:[] }
export function dryRun(items = INITIAL_BACKLOG) {
    const queue = prioritizedPendingItems(items);
    return {
        queueLength:     queue.length,
        nextItem:        queue[0] || null,
        estimatedHoursIfManual: queue.reduce((acc, it) => acc + _hoursForItem(it), 0),
        items:           queue.map(it => ({ id: it.id, title: it.title, priority: it.priority, complexity: it.complexity })),
    };
}

function _hoursForItem(it) {
    const c = it.complexity;
    if (c === 'XS') return 0.5;
    if (c === 'S')  return 2;
    if (c === 'M')  return 6;
    if (c === 'L')  return 16;
    if (c === 'XL') return 40;
    return 6;
}

// buildAgentRunNode · pure · empaqueta el resultat per a persistir-lo al KB
// com a node type='autonomous_agent_run' · audit trail TEA dels runs.
export function buildAgentRunNode(result) {
    const id = 'agent-run-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    return {
        id,
        type:     AGENT_RUN_TYPE,
        content:  {
            completedCount:  result.completedCount,
            attemptedCount:  result.attemptedCount,
            iterationsRun:   result.iterationsRun,
            totalCostEur:    result.totalCostEur,
            budgetExhausted: result.budgetExhausted,
            greenItems:      result.greenItems,
            failedItems:     result.failedItems,
            startedAt:       result.log?.[0]?.ts || Date.now(),
            finishedAt:      result.log?.[result.log.length - 1]?.ts || Date.now(),
            // Sols els resums dels resultats · log complet pot ser molt gran
            resultsSummary:  result.results.map(r => ({ itemId: r.itemId, status: r.status, modelKey: r.modelKey })),
        },
        keywords: [
            'type:autonomous-agent-run',
            'green:' + result.completedCount,
            'red:'   + result.failedItems.length,
            ...(result.budgetExhausted ? ['budget-exhausted'] : []),
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}

export { _pickNextRed as pickNextRed, _estimateRunCost as estimateRunCost };
