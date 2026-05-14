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
// VALUEMAP-GEN-001 · seed sectorial + subtype hint quan dim=valueMap
import { getSubtypeById, buildIaContextHint } from './sectorSubtypes.js';

const USD_EUR = 0.92;

// Camps JSON mínims esperats per cada dim · pel default evaluator
// Spec objecte permet validar minArrayLength + minStringLength · evita
// que provider retorni `{ "newSops": [] }` i compti com a "ok"
// LANDING-UNIFY-001 · landing requereix description + heroTitle perquè
// la sortida es renderitzi a /presentation com a landing completa
const REQUIRED_FIELDS_BY_DIM = Object.freeze({
    landing:      [
        { name: 'description', minStringLength: 60 },
        { name: 'heroTitle',   minStringLength: 3 },
    ],
    valueMap:     [{ name: 'addRoles',        minArrayLength: 1 }],
    deliverables: [{ name: 'addTransactions', minArrayLength: 1 }],
    sops:         [{ name: 'newSops',         minArrayLength: 1 }],
    workshops:    [{ name: 'newWorkshops',    minArrayLength: 1 }],
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
async function _persistAuditLog({ projectId, dimId, attempts, totalCostUsd, accepted, draft, refs, billing = null, walletDebit = null }) {
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
                // WALLET-ACC-001 · resultat del debit automàtic al wallet
                walletDebit:  walletDebit ? {
                    ok:           !!walletDebit.ok,
                    balanceAfter: walletDebit.balanceAfter ?? null,
                    error:        walletDebit.error || null,
                } : null,
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

// IA-PROVIDER-PREF-001 · llegeix la preferència de provider de l'usuari
// del KB (mateix node que /settings escriu via Orchestrator.setActiveProvider)
async function _loadPreferredProvider() {
    try {
        const { KB } = await import('./kb.js');
        await KB.init();
        const node = await KB.getNode('sos_ai_provider');
        return node?.value || null;
    } catch (_) { return null; }
}

// aiFillDim · async · main entry point
export async function aiFillDim({
    projectId,
    dimId,
    sectorReadiness = null,
    similarProjects = [],
    criticalRoles   = [],
    extraContext    = null,    // IA-CONTEXT-001 sprint B · user input opcional
    audienceId      = null,    // LANDING-UNIFY-001 · per a regenerar landings per audiència
    subtypeId       = null,    // VALUEMAP-GEN-001 · override del project.subtypeId
    sectorSeedLoader = null,   // VALUEMAP-GEN-001 · injectable per a tests · default importa KnowledgeLoader
    preferredProvider = undefined,  // IA-PROVIDER-PREF-001 · explicit override; undefined = auto-load del KB
    bundleId        = null,    // NEURAL-PATH-001 sprint B · context bundle opcional · injectat a extraContext
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

    // 1b · VALUEMAP-GEN-001 · per a dim=valueMap, carrega seed sectorial
    // (roles+tx típiques del sector) + subtype hint · injectats al context
    let sectorSeed = null;
    let subtypeHint = null;
    if (dimId === 'valueMap') {
        const effSubtypeId = subtypeId || project.subtypeId || null;
        const sectorId     = project.sector_id || project.sectorId || null;
        if (sectorId) {
            try {
                let loader = sectorSeedLoader;
                if (!loader) {
                    const mod = await import('./KnowledgeLoader.js');
                    loader = (sid) => mod.KnowledgeLoader.getSectorSeed(sid);
                }
                sectorSeed = await loader(sectorId);
            } catch (e) { /* loader pot fallar a node tests · degrade silenciós */ }
            if (effSubtypeId) {
                const sub = getSubtypeById(sectorId, effSubtypeId);
                if (sub) {
                    subtypeHint = sub.label + ' · ' + (sub.hint || '') +
                        (sub.iaContextHint ? ' · operativa típica: ' + sub.iaContextHint : '');
                }
            }
        }
    }

    // 1c · NEURAL-PATH-001 sprint B · si el caller passa bundleId, carrega
    // el neural_path_bundle + resol els seus steps i el prependa a
    // extraContext (l'usuari es manté com a context personalitzat de CV nodal).
    let effectiveExtraContext = extraContext;
    let bundleInfo = null;
    if (bundleId) {
        try {
            const { KB }    = await import('./kb.js');
            const { resolveBundleSteps, renderBundleAsContextString } = await import('./neuralPathService.js');
            await KB.init();
            const bundleNode = await KB.getNode(bundleId);
            if (bundleNode && bundleNode.type === 'neural_path_bundle') {
                const resolved = await resolveBundleSteps({ kb: KB, bundle: bundleNode });
                const bundleStr = renderBundleAsContextString({
                    bundle: bundleNode,
                    steps: resolved.steps,
                    extraNodes: resolved.extraNodes,
                });
                effectiveExtraContext = bundleStr + (extraContext ? '\n\n## Context addicional usuari\n' + extraContext : '');
                bundleInfo = {
                    bundleId,
                    name: bundleNode.content?.name || null,
                    stepCount: resolved.steps.length,
                    missing: resolved.missing.length,
                };
            }
        } catch (e) {
            console.warn('[aiFillDim] bundle load failed', e?.message);
        }
    }

    // 2 · Build context per dim · inclou extraContext si l'usuari l'ha passat
    const ctx = buildContextForDim(dimId, {
        project, sops, workshops, marketItems,
        sectorReadiness, similarProjects, criticalRoles,
        extraContext: effectiveExtraContext,   // NEURAL-PATH-001 · pot incloure bundle context
        audienceId,   // LANDING-UNIFY-001 · propagat al builder (landing l'usa)
        sectorSeed,   // VALUEMAP-GEN-001 · sectorSeed propagat al builder valueMap
        subtypeHint,  // VALUEMAP-GEN-001 · text hint del subtype
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

    // 4 · Run escalation chain · respectant preferred-provider de l'usuari
    // si en té un seleccionat a /settings (sos_ai_provider KB node)
    const effectivePreferredProvider = (preferredProvider === undefined)
        ? await _loadPreferredProvider()
        : preferredProvider;
    let result;
    try {
        result = await runEscalation({
            taskKind, generate, evaluate: evaluator,
            stopAt,
            preferredProvider: effectivePreferredProvider,
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

    // 5b · WALLET-ACC-001 · auto-debit del project wallet pel cost + marge IA.
    // Si el wallet no té saldo suficient, allowNegative=false → throw. Catch
    // local · no bloqueja el return del draft · l'usuari pot acceptar audit
    // log encara que el debit hagi fallat (i top-up wallet després).
    let walletDebit = null;
    if (margin.totalEur > 0) {
        try {
            const { consumeAndPersist } = await import('./walletService.js');
            const ref = 'ai-fill-' + dimId + '-' + Date.now().toString(36);
            const updated = await consumeAndPersist({
                projectId,
                amountEur: margin.totalEur,
                ref,
                source:    'ai-fill',
                note:      'IA ' + dimId + ' · ' + (result.modelKey || 'unknown'),
            });
            walletDebit = { ok: true, balanceAfter: updated.content.balanceEur };
            // TEA-UNIV-001 · attestation firmada del movement · fire-and-forget
            (async () => {
                try {
                    const { KB } = await import('./kb.js');
                    const { recordMovementAttestation } = await import('./walletAttestationService.js');
                    const { getOrCreateIdentity } = await import('./identityService.js');
                    const { getOrCreateSigningKey } = await import('./projectIO.js');
                    const identity = await getOrCreateIdentity().catch(() => null);
                    const did = identity?.content?.primaryDid || identity?.primaryDid || null;
                    let pk = null;
                    try { const k = await getOrCreateSigningKey(); pk = k?.privateJwk || null; } catch (_) {}
                    await recordMovementAttestation({
                        kb: KB,
                        kind: 'wallet-consume',
                        payer: { walletId: 'wallet-' + projectId, projectId, ownerDid: did },
                        receiver: null,  // IA provider extern · no SOS wallet
                        amountEur: margin.totalEur,
                        source: 'ai-fill',
                        ref,
                        meta: { dimId, modelKey: result.modelKey, marginEur: margin.marginEur },
                        privateJwk: pk,
                    });
                } catch (_) {}
            })();
        } catch (e) {
            walletDebit = { ok: false, error: e?.message || 'wallet-debit-failed' };
        }
    }

    // 6 · Persisteix audit log (no accepted encara) · inclou marge + walletDebit
    const auditId = await persistAudit({
        projectId, dimId,
        attempts: result.attempts,
        totalCostUsd,
        accepted: false,
        draft: result.output?.text || null,
        refs: ctx.refs,
        billing: margin,
        walletDebit,
    });

    // NEURAL-PATH-001 · log step 'ai-fill' · fire-and-forget · zero bloqueig
    (async () => {
        try {
            const { appendStep } = await import('./neuralPathService.js');
            const { KB } = await import('./kb.js');
            const identities = await KB.query({ type: 'user_identity' }).catch(() => []);
            const ownerHandle = identities[0]?.content?.handle || '@alvaro';
            await appendStep({
                kb: KB,
                ownerHandle,
                kind: 'ai-fill',
                refType: 'ai_audit',
                refId: auditId || null,
                projectId,
                summary: 'IA ' + dimId + ' · ' + (result.modelKey || 'unknown') + ' · ' + margin.totalEur.toFixed(4) + '€',
                meta: { dimId, modelKey: result.modelKey, costEur: margin.totalEur },
            });
        } catch (_) {}
    })();

    // LANDING-UNIFY-001 · si el caller passa audienceId i el draft té camps
    // landing-specific, els persistim com a part del parsedDraft (l'applier ja
    // els consumirà · zero canvi addicional).
    const parsedDraftLocal = result.output && result.output.text
        ? _safeParseJson(result.output.text)
        : null;
    if (parsedDraftLocal && audienceId && dimId === 'landing') {
        parsedDraftLocal.audienceId = audienceId;
    }

    return {
        auditId,
        dimId,
        taskKind,
        audienceId,
        subtypeId:   subtypeId || project.subtypeId || null,
        sectorSeed:  sectorSeed ? { sectorId: sectorSeed.sectorId, sectorName: sectorSeed.sectorName, rolesCount: (sectorSeed.roles || []).length } : null,
        preferredProvider: effectivePreferredProvider,
        bundleInfo,  // NEURAL-PATH-001 · {bundleId, name, stepCount, missing} o null
        walletDebit, // WALLET-ACC-001 · {ok, balanceAfter, error} o null
        modelKey:    result.modelKey,
        draft:       result.output ? result.output.text : null,
        parsedDraft: parsedDraftLocal,
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
