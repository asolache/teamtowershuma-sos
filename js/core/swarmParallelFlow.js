// =============================================================================
// TEAMTOWERS SOS V11 — SWARM PARALLEL FLOW (SWARM-PARALLEL sprint A)
// Ruta · /js/core/swarmParallelFlow.js
//
// DAG executor que processa un ValueFlow node en paral·lel per level. Cada
// deliverable s'executa via un runner injectable (default · runEscalation
// failover). Transactions defineixen com els outputs viatgen entre rols ·
// upstream context es passa al downstream prompt automàticament.
//
// Pillar Antigravity capstone · permet al swarm orquestrar value chains
// completes sense intervenció humana entre passes.
//
// PRINCIPIS · pure + injectable · zero IA hardcoded · zero KB hardcoded.
// Test cobreix execució paral·lela amb mock runner determinista.
//
// Reusa · valueFlowService (topologicalLevels) · attestationService (opcional
// per a signar deliverables) · aiEvaluatorService (opcional per a sentinels).
// =============================================================================

import { topologicalLevels, validateValueFlow } from './valueFlowService.js';

export const SWARM_RUN_TYPE = 'swarm_flow_run';

// runValueFlow · async · main entry point.
//
// args ·
//   flow              · ValueFlow node (validat o no · es valida internament)
//   runner            · async ({ prompt, deliverable, role, contextOutputs,
//                               attempt }) → { output, costEur, modelKey, usage }
//                       REQUIRED · injectable
//   budgetEur         · cap total acumulat (default 5)
//   maxRetriesPerDel  · retries per deliverable failed (default 1)
//   onLevelStart      · callback opcional · ({ levelIndex, deliverableIds }) → void
//   onDeliverableDone · callback opcional · ({ id, status, output, costEur, level }) → void
//   evaluator         · opcional · async (output, deliverable) → { ok, reason }
//                       · si !ok · es retry fins esgotar maxRetriesPerDel
//   signer            · opcional · async (output, deliverable, role) → signature
//                       · si retornat · es desa al result com a 'signature'
//   ts                · injectable per a tests (timestamp inicial)
//
// Retorna · {
//   ok,                       // tots els deliverables completats sense errors
//   results,                  // Map<deliverableId, { output, costEur, modelKey,
//                             //   signature?, evaluation?, attempts, level }>
//   levelsExecuted,           // int · levels processats
//   totalCostEur,             // sum dels deliverables
//   budgetExceeded,           // bool · es va aturar per budget
//   errors,                   // [{ deliverableId, message, level }] · errors no recuperables
//   startedAt, finishedAt,    // ISO strings
//   log,                      // event log per timeline
// }
export async function runValueFlow({
    flow                   = null,
    runner                 = null,
    budgetEur              = 5,
    maxRetriesPerDel       = 1,
    onLevelStart           = null,
    onDeliverableDone      = null,
    evaluator              = null,
    signer                 = null,
    ts                     = null,
} = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    const startedAt = new Date(now).toISOString();

    const out = {
        ok:               false,
        results:          new Map(),
        levelsExecuted:   0,
        totalCostEur:     0,
        budgetExceeded:   false,
        errors:           [],
        startedAt,
        finishedAt:       null,
        log:              [],
    };

    if (!flow)   { out.errors.push({ message: 'flow required' }); _finish(out, now); return out; }
    if (!runner) { out.errors.push({ message: 'runner required (injectable)' }); _finish(out, now); return out; }

    // Valida flow · si invàlid amb cicle · no podem topo-sort
    const validation = validateValueFlow(flow);
    if (!validation.ok && validation.errors.some(e => e.includes('cycle'))) {
        out.errors.push({ message: 'flow-has-cycle · ' + validation.errors.join(',') });
        _finish(out, now);
        return out;
    }

    let levels;
    try { levels = topologicalLevels(flow); }
    catch (e) {
        out.errors.push({ message: 'topoSort failed · ' + e.message });
        _finish(out, now);
        return out;
    }

    const deliverables = flow.content?.deliverables || [];
    const delById = new Map(deliverables.filter(d => d && d.id).map(d => [d.id, d]));
    const roles = flow.content?.roles || [];
    const roleById = new Map(roles.filter(r => r && r.id).map(r => [r.id, r]));
    const transactions = flow.content?.transactions || [];

    // Construïm map de upstream · per a cada deliverable · quins outputs upstream
    // tenim que passar com a context. Heurística · upstream és qualsevol del
    // qual el consumer és el producer d'aquest deliverable.
    const upstreamFor = new Map();
    for (const d of deliverables) {
        if (!d || !d.id) continue;
        const upstream = [];
        for (const other of deliverables) {
            if (!other || !other.id || other.id === d.id) continue;
            const consumers = Array.isArray(other.consumers) ? other.consumers : [];
            if (consumers.includes(d.producer)) upstream.push(other.id);
        }
        upstreamFor.set(d.id, upstream);
    }

    for (let levelIdx = 0; levelIdx < levels.length; levelIdx++) {
        const levelIds = levels[levelIdx];
        if (onLevelStart) {
            try { onLevelStart({ levelIndex: levelIdx, deliverableIds: levelIds }); } catch (_) {}
        }
        out.log.push({ kind: 'level-start', level: levelIdx, deliverables: levelIds, ts: Date.now() });

        // Budget gate · si ja superat · marcar i parar
        if (out.totalCostEur >= budgetEur) {
            out.budgetExceeded = true;
            out.log.push({ kind: 'budget-exceeded', level: levelIdx, totalCostEur: out.totalCostEur, ts: Date.now() });
            break;
        }

        // Per cada deliverable del level · paral·lel via Promise.all
        const tasks = levelIds.map(async (did) => {
            const deliverable = delById.get(did);
            if (!deliverable) { return { id: did, error: 'unknown-deliverable' }; }
            const role = roleById.get(deliverable.producer) || { id: deliverable.producer, kind: 'unknown' };

            // Build contextOutputs (upstream outputs already computed)
            const contextOutputs = {};
            for (const upId of (upstreamFor.get(did) || [])) {
                const upResult = out.results.get(upId);
                if (upResult && typeof upResult.output === 'string') {
                    contextOutputs[upId] = upResult.output;
                }
            }
            const prompt = _buildDeliverablePrompt({ deliverable, role, contextOutputs, transactions });

            let attempts = 0;
            let lastErr = null;
            while (attempts <= maxRetriesPerDel) {
                attempts++;
                // Budget guard inline · si arribem aquí amb budget ja superat · skip
                if (out.totalCostEur >= budgetEur) {
                    return { id: did, error: 'budget-exhausted-before-attempt', attempts: attempts - 1 };
                }
                try {
                    const result = await runner({
                        prompt,
                        deliverable,
                        role,
                        contextOutputs,
                        attempt: attempts,
                    });
                    const costEur = typeof result?.costEur === 'number' ? result.costEur : 0;
                    const output  = result?.output || result?.text || '';
                    const modelKey = result?.modelKey || null;
                    if (!output || typeof output !== 'string') {
                        lastErr = 'empty-output';
                        continue;
                    }
                    // Evaluator gate · optional
                    let evaluation = null;
                    if (evaluator) {
                        try {
                            evaluation = await evaluator(output, deliverable);
                            if (!evaluation?.ok) {
                                lastErr = 'eval-fail · ' + (evaluation?.reason || '');
                                continue;
                            }
                        } catch (e) { lastErr = 'eval-throw · ' + e.message; continue; }
                    }
                    // Signer · optional
                    let signature = null;
                    if (signer) {
                        try { signature = await signer(output, deliverable, role); }
                        catch (e) { /* signature opcional · no aturar per error de signer */ }
                    }
                    return { id: did, output, costEur, modelKey, signature, evaluation, attempts, level: levelIdx };
                } catch (e) {
                    lastErr = e?.message || String(e);
                }
            }
            return { id: did, error: lastErr || 'unknown-error', attempts, level: levelIdx };
        });

        const settled = await Promise.all(tasks);
        for (const r of settled) {
            if (r.error) {
                out.errors.push({ deliverableId: r.id, message: r.error, level: levelIdx, attempts: r.attempts });
                out.results.set(r.id, { error: r.error, attempts: r.attempts, level: levelIdx });
                out.log.push({ kind: 'deliverable-fail', id: r.id, level: levelIdx, error: r.error, ts: Date.now() });
                if (onDeliverableDone) { try { onDeliverableDone({ id: r.id, status: 'fail', level: levelIdx }); } catch (_) {} }
            } else {
                out.totalCostEur += (r.costEur || 0);
                out.results.set(r.id, {
                    output:     r.output,
                    costEur:    r.costEur || 0,
                    modelKey:   r.modelKey,
                    signature:  r.signature || null,
                    evaluation: r.evaluation,
                    attempts:   r.attempts,
                    level:      levelIdx,
                });
                out.log.push({ kind: 'deliverable-done', id: r.id, level: levelIdx, costEur: r.costEur || 0, ts: Date.now() });
                if (onDeliverableDone) { try { onDeliverableDone({ id: r.id, status: 'ok', output: r.output, costEur: r.costEur, level: levelIdx }); } catch (_) {} }
            }
        }
        out.levelsExecuted = levelIdx + 1;

        // Stop if a deliverable in this level failed AND its downstream can't proceed
        // (simple heuristic · seguim si hi ha errors aïllats · downstream pot fallar però l'usuari ho veurà)
    }

    out.totalCostEur = round2(out.totalCostEur);
    out.ok = out.errors.length === 0;
    _finish(out, now);
    return out;
}

// _buildDeliverablePrompt · pura · construeix prompt per al runner.
// El prompt inclou · description del deliverable · role kind · context
// outputs upstream agrupats per id origen.
function _buildDeliverablePrompt({ deliverable, role, contextOutputs = {}, transactions = [] }) {
    const lines = [];
    lines.push('Ets ' + (role?.label || role?.kind || role?.id) + ' (kind=' + (role?.kind || '?') + ') al ValueFlow SOS.');
    lines.push('');
    lines.push('## La teva tasca · entregar el deliverable');
    lines.push('id · ' + deliverable.id);
    if (deliverable.description) lines.push('descripció · ' + deliverable.description);
    if (deliverable.validator)   lines.push('validator · ' + deliverable.validator);
    lines.push('');
    const ctxKeys = Object.keys(contextOutputs);
    if (ctxKeys.length > 0) {
        lines.push('## Context · outputs upstream (input per a la teva tasca)');
        for (const k of ctxKeys) {
            lines.push('### ' + k);
            lines.push(contextOutputs[k]);
            lines.push('');
        }
    }
    // Lookup d'inbound transactions per a indicar quins consumidors esperen què
    const inboundTx = transactions.filter(tx => tx?.to === deliverable.producer && tx?.deliverable === deliverable.id);
    if (inboundTx.length > 0) {
        lines.push('## Transactions assignades a tu');
        for (const tx of inboundTx) {
            lines.push('- ' + tx.id + ' · des de role ' + tx.from + ' · entrega · ' + tx.deliverable);
        }
        lines.push('');
    }
    lines.push('Retorna · text en català/anglès/castellà · concret · directament aplicable per al consumidor downstream.');
    return lines.join('\n');
}

function _finish(out, startMs) {
    out.finishedAt = new Date().toISOString();
    out.durationMs = Date.now() - startMs;
}

function round2(n) { return Math.round(n * 100) / 100; }

// buildSwarmRunNode · pura · serialitza el resultat per persistir-lo al KB.
export function buildSwarmRunNode({ result, flowId, projectId, ts = null } = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    const resultsObj = {};
    if (result?.results instanceof Map) {
        for (const [k, v] of result.results) resultsObj[k] = v;
    }
    return {
        id:        'swarm-run-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 6),
        type:      SWARM_RUN_TYPE,
        projectId,
        content: {
            flowId,
            results:        resultsObj,
            levelsExecuted: result?.levelsExecuted || 0,
            totalCostEur:   result?.totalCostEur || 0,
            budgetExceeded: !!result?.budgetExceeded,
            errors:         result?.errors || [],
            startedAt:      result?.startedAt,
            finishedAt:     result?.finishedAt,
            durationMs:     result?.durationMs,
            log:            result?.log || [],
            ok:             !!result?.ok,
        },
        createdAt: now,
        updatedAt: now,
    };
}
