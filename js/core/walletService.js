// =============================================================================
// TEAMTOWERS SOS V11 — WALLET SERVICE (MKT-001 sprint C1)
// Ruta: /js/core/walletService.js
//
// Wallet prepago por proyecto · balance en € + ledger de movimientos.
// Sprint C1 entrega el schema + helpers puros + persistencia en KB.
// Sprint C2 enchufará Stripe Checkout y descuento automático en
// Orchestrator.callLLM tras cada respuesta exitosa.
//
// Schema: type='wallet' con content = {
//   projectId · balanceEur · currency · movements[]
// }
//
// Cada movement: {
//   id · ts · kind · amountEur · ref · source · note · balanceAfter
// }
//
// Funciones PURAS · sin I/O · testeables sin IndexedDB.
// =============================================================================

import { KB }    from './kb.js';
import { store } from './store.js';

// ─── Constantes ────────────────────────────────────────────────────────────
export const MOVEMENT_KINDS = Object.freeze([
    'topup',          // recarga (Stripe / USDC / manual)
    'consume',        // gasto (callLLM · gas blockchain · operación interna)
    'refund',         // devolución
    'adjustment',     // ajuste manual del operador
]);

export const TOPUP_PRESETS = Object.freeze([10, 25, 50, 100]);

// ─── Validación ────────────────────────────────────────────────────────────
export function validateWallet(node) {
    const errors = [];
    if (!node || typeof node !== 'object') return { ok: false, errors: ['wallet no es objeto'] };
    if (!node.id || typeof node.id !== 'string')                       errors.push('id requerido');
    if (node.type !== 'wallet')                                        errors.push("type debe ser 'wallet'");
    const c = node.content || {};
    if (!c.projectId || typeof c.projectId !== 'string')               errors.push('content.projectId requerido');
    if (typeof c.balanceEur !== 'number' || isNaN(c.balanceEur))       errors.push('content.balanceEur debe ser number');
    if (!Array.isArray(c.movements))                                   errors.push('content.movements debe ser array');
    return { ok: errors.length === 0, errors };
}

// ─── Constructor canónico ──────────────────────────────────────────────────
export function buildWalletForProject(projectId, options = {}) {
    if (!projectId) throw new Error('buildWalletForProject: projectId requerido');
    return {
        id:    'wallet-' + projectId,
        type:  'wallet',
        projectId,
        content: {
            projectId,
            balanceEur:  Number(options.initialBalanceEur || 0),
            currency:    options.currency || 'EUR',
            movements:   [],
            createdAt:   Date.now(),
            tags:        ['kind:wallet', 'project:' + projectId],
        },
        keywords: ['wallet', 'kind:wallet', 'project:' + projectId],
    };
}

// ─── Movimientos puros · no mutan ──────────────────────────────────────────
function _movementId() {
    return 'mv-' + Math.random().toString(36).slice(2, 8) + '-' + Date.now().toString(36);
}

// Helper interno · aplica un movimiento al wallet (devuelve nuevo nodo).
// Reglas de signo del delta sobre balance:
//   consume     → siempre resta (delta negativo)
//   topup       → siempre suma (delta positivo)
//   refund      → siempre suma (delta positivo)
//   adjustment  → respeta el signo del amountEur (puede sumar o restar)
function _applyMovement(wallet, mv) {
    const c = wallet.content || {};
    const balanceBefore = Number(c.balanceEur || 0);
    const raw = Number(mv.amountEur) || 0;
    let delta;
    if (mv.kind === 'consume')           delta = -Math.abs(raw);
    else if (mv.kind === 'adjustment')   delta = raw;                  // preserva signo
    else                                  delta = Math.abs(raw);        // topup, refund
    const balanceAfter = +(balanceBefore + delta).toFixed(6);
    const fullMovement = {
        id:           mv.id || _movementId(),
        ts:           mv.ts || Date.now(),
        kind:         mv.kind,
        amountEur:    mv.kind === 'adjustment' ? raw : Math.abs(raw),  // adj guarda signo
        ref:          mv.ref || null,
        source:       mv.source || null,
        note:         mv.note || '',
        balanceAfter,
    };
    return {
        ...wallet,
        content: {
            ...c,
            balanceEur: balanceAfter,
            movements:  [fullMovement, ...(c.movements || [])],
            lastUpdatedAt: fullMovement.ts,
        },
    };
}

// Top-up · añade saldo. PURO.
export function topUpWallet({ wallet, amountEur, source = 'manual', ref = null, note = '' }) {
    if (!wallet) throw new Error('topUpWallet: wallet requerido');
    const amt = Number(amountEur);
    if (!Number.isFinite(amt) || amt <= 0) throw new Error('topUpWallet: amountEur debe ser > 0');
    return _applyMovement(wallet, { kind: 'topup', amountEur: amt, source, ref, note });
}

// Consumo · resta saldo. Por defecto NO permite quedar negativo (configurable).
// PURO. Devuelve {wallet} actualizado o lanza si insuficiente y allowNegative=false.
export function consumeFromWallet({ wallet, amountEur, ref = null, source = null, note = '', allowNegative = false }) {
    if (!wallet) throw new Error('consumeFromWallet: wallet requerido');
    const amt = Number(amountEur);
    if (!Number.isFinite(amt) || amt <= 0) throw new Error('consumeFromWallet: amountEur debe ser > 0');
    const balance = Number(wallet.content?.balanceEur || 0);
    if (!allowNegative && balance < amt) {
        const err = new Error('Saldo insuficiente · ' + balance.toFixed(2) + '€ < ' + amt.toFixed(4) + '€');
        err.code = 'INSUFFICIENT_FUNDS';
        err.balance = balance;
        err.required = amt;
        throw err;
    }
    return _applyMovement(wallet, { kind: 'consume', amountEur: amt, source, ref, note });
}

// Refund · devuelve fondos al wallet
export function refundWallet({ wallet, amountEur, ref = null, source = null, note = '' }) {
    if (!wallet) throw new Error('refundWallet: wallet requerido');
    const amt = Number(amountEur);
    if (!Number.isFinite(amt) || amt <= 0) throw new Error('refundWallet: amountEur debe ser > 0');
    return _applyMovement(wallet, { kind: 'refund', amountEur: amt, source, ref, note });
}

// Adjustment · operador cambia balance directamente (auditoría).
// deltaEur conserva signo (positivo suma · negativo resta) y _applyMovement
// lo respeta al ser kind='adjustment'.
export function adjustWallet({ wallet, deltaEur, note = '' }) {
    if (!wallet) throw new Error('adjustWallet: wallet requerido');
    const d = Number(deltaEur);
    if (!Number.isFinite(d) || d === 0) throw new Error('adjustWallet: deltaEur debe ser != 0');
    return _applyMovement(wallet, { kind: 'adjustment', amountEur: d, source: 'manual', note });
}

// Stats agregadas · útil para dashboards
export function walletStats(wallet) {
    if (!wallet || !wallet.content) return { balance: 0, totalTopups: 0, totalConsumed: 0, movementCount: 0 };
    const c = wallet.content;
    let totalTopups = 0;
    let totalConsumed = 0;
    let totalRefunds = 0;
    for (const mv of (c.movements || [])) {
        if (mv.kind === 'topup')    totalTopups   += mv.amountEur;
        if (mv.kind === 'consume')  totalConsumed += mv.amountEur;
        if (mv.kind === 'refund')   totalRefunds  += mv.amountEur;
    }
    return {
        balance:        Number(c.balanceEur || 0),
        totalTopups:    +totalTopups.toFixed(4),
        totalConsumed:  +totalConsumed.toFixed(4),
        totalRefunds:   +totalRefunds.toFixed(4),
        movementCount:  (c.movements || []).length,
    };
}

// ─── Helpers async sobre KB ────────────────────────────────────────────────

export async function getWalletForProject(projectId) {
    if (!projectId) return null;
    await KB.init();
    const id = 'wallet-' + projectId;
    return await KB.getNode(id) || null;
}

export async function getOrCreateWalletForProject(projectId, options = {}) {
    const existing = await getWalletForProject(projectId);
    if (existing) return existing;
    const node = buildWalletForProject(projectId, options);
    await store.dispatch({ type: 'KB_UPSERT', payload: { node } });
    return node;
}

export async function persistWallet(wallet) {
    if (!wallet) throw new Error('persistWallet: wallet requerido');
    await store.dispatch({ type: 'KB_UPSERT', payload: { node: wallet } });
    return wallet;
}

// Helper de alto nivel · top-up persistente
export async function topUpAndPersist({ projectId, amountEur, source = 'manual', ref = null, note = '' }) {
    const wallet = await getOrCreateWalletForProject(projectId);
    const updated = topUpWallet({ wallet, amountEur, source, ref, note });
    return await persistWallet(updated);
}

// Helper de alto nivel · consumo persistente con manejo de fondos insuficientes
export async function consumeAndPersist({ projectId, amountEur, ref = null, source = null, note = '', allowNegative = false }) {
    const wallet = await getOrCreateWalletForProject(projectId);
    const updated = consumeFromWallet({ wallet, amountEur, ref, source, note, allowNegative });
    return await persistWallet(updated);
}

// ─── FUND-FLOW-001 sprint A · Wallet personal + transferència ─────────────
//
// Visió @alvaro 2026-05-10 · l'operador té UN saldo personal (no lligat
// a cap projecte) i pot derivar saldo a wallets de projecte concret.
// Quan un projecte genera ingressos, els stakeholders poden retirar el
// seu pie cap al seu personal (sprint D).
//
// El "personal wallet" és un cas especial · projectId convencional
// `__personal_${handle}__` (ex. `__personal_alvaro__`). Tota l'API
// existent funciona idènticament · només canvia el sentit semantic.

// personalWalletIdFor · pura · genera el projectId convencional per a un handle.
export function personalWalletIdFor(handle = '@alvaro') {
    const clean = String(handle || '@alvaro').replace(/^@/, '').replace(/[^\w-]/g, '').toLowerCase().slice(0, 32) || 'anon';
    return '__personal_' + clean + '__';
}

// isPersonalWallet · pura · true si el projectId segueix la convenció.
export function isPersonalWallet(projectId) {
    return typeof projectId === 'string' && projectId.startsWith('__personal_') && projectId.endsWith('__');
}

// WORKSHOPS-FED-001 sprint B · cohort wallet · destinació del 10% revenue
// split dels workshop unlocks. Cada cohortNumber té el seu wallet propi.
// cohortWalletIdFor(0) → '__cohort_0__'
export function cohortWalletIdFor(cohortNumber) {
    if (typeof cohortNumber !== 'number' || !Number.isInteger(cohortNumber) || cohortNumber < 0) {
        throw new Error('cohortWalletIdFor requires non-negative integer cohortNumber');
    }
    return '__cohort_' + cohortNumber + '__';
}

export function isCohortWallet(projectId) {
    return typeof projectId === 'string' && /^__cohort_\d+__$/.test(projectId);
}

export async function getOrCreateCohortWallet(cohortNumber) {
    const id = cohortWalletIdFor(cohortNumber);
    let wallet = await getWalletForProject(id);
    if (!wallet) {
        wallet = buildWalletForProject(id, { initial: 0 });
        wallet.content.kind         = 'wallet-cohort';
        wallet.content.isCohort     = true;
        wallet.content.cohortNumber = cohortNumber;
        wallet.content.createdAt    = wallet.content.createdAt || Date.now();
        await persistWallet(wallet);
    }
    return wallet;
}

// getOrCreatePersonalWallet · async · crea (o recupera) el wallet personal
// del handle indicat. Mateixa shape que els de projecte · només el
// projectId convencional. Marca isPersonal=true al content per UI.
export async function getOrCreatePersonalWallet(handle = '@alvaro') {
    const pid = personalWalletIdFor(handle);
    const wallet = await getOrCreateWalletForProject(pid, { isPersonal: true, ownerHandle: handle });
    return wallet;
}

// transferBetweenWallets · async · atòmic-best-effort · descompta del
// source · acredita al destination amb refs encadenats per traçabilitat.
// Llença InsufficientFunds si saldo source < amount.
// Retorna { from, to, amountEur, ref }.
export async function transferBetweenWallets({
    fromProjectId,
    toProjectId,
    amountEur,
    note = '',
    source = 'transfer',
} = {}) {
    if (!fromProjectId || !toProjectId) {
        throw new Error('transferBetweenWallets requires fromProjectId + toProjectId');
    }
    if (fromProjectId === toProjectId) {
        throw new Error('transferBetweenWallets · source i destination són el mateix wallet');
    }
    const amt = Number(amountEur);
    if (!Number.isFinite(amt) || amt <= 0) {
        throw new Error('transferBetweenWallets · amount must be > 0');
    }
    const fromWallet = await getOrCreateWalletForProject(fromProjectId);
    if (Number(fromWallet.content.balanceEur) < amt) {
        throw new Error('insufficient-funds · saldo origen ' + fromWallet.content.balanceEur + '€ < ' + amt + '€');
    }
    const transferRef = 'transfer-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const fromLabel = isPersonalWallet(fromProjectId) ? 'personal' : fromProjectId;
    const toLabel   = isPersonalWallet(toProjectId)   ? 'personal' : toProjectId;
    const baseNote  = note || ('transfer ' + fromLabel + ' → ' + toLabel);

    // 1. Descompta del source
    const after1 = await consumeAndPersist({
        projectId: fromProjectId,
        amountEur: amt,
        kind:      'consume',
        ref:       transferRef + ':out',
        source,
        note:      baseNote + ' (out)',
    });
    // 2. Acredita al destination · si falla, refund automàtic al source
    try {
        const after2 = await topUpAndPersist({
            projectId: toProjectId,
            amountEur: amt,
            source,
            ref:       transferRef + ':in',
            note:      baseNote + ' (in)',
        });
        return { from: after1, to: after2, amountEur: amt, ref: transferRef };
    } catch (e) {
        // Refund best-effort
        try {
            const refunded = refundWallet({
                wallet:    after1,
                amountEur: amt,
                ref:       transferRef + ':refund',
                source,
                note:      'refund failed transfer · ' + (e?.message || e),
            });
            await persistWallet(refunded);
        } catch (_) { /* best-effort */ }
        throw new Error('transfer-failed: ' + (e?.message || e));
    }
}

// ─── FUND-FLOW-001 sprint C · Distribució automàtica d'ingressos ─────────
//
// Quan arriba un topup amb source='income', el wallet enregistra el moviment
// + la regla de distribució calcula el split en operating-reserve i
// stakeholders-pool. El balanceEur del wallet manté tot el saldo (1 balanç
// únic) · els buckets es deriven com a agregats dels moviments amb font:
//   - sum topup source='income' × stakeholdersBps/10000 = pool acumulat
//   - sum consume source='stakeholder-claim' = total claimed
//   - claimable per party = (poolAcumulat - clientPersonalShare) × partyShare%

export const INCOME_SOURCE       = 'income';
export const CLAIM_SOURCE        = 'stakeholder-claim';
export const RESERVE_SOURCE      = 'operating-reserve';   // info-only · marca consumes que provenen de reserva
export const ALLOCATION_SOURCE   = 'income-allocation';   // marker movements amb amount=0

// computeStakeholdersPool · pura · suma de l'allocation per stakeholders
// segons tots els moviments d'income passats. NO mutate.
export function computeStakeholdersPool(wallet, ruleStakeholdersBps = 8000) {
    if (!wallet || !wallet.content) return { allocatedEur: 0, claimedEur: 0, claimableEur: 0 };
    const movs = wallet.content.movements || [];
    let allocatedEur = 0;
    let claimedEur   = 0;
    const bps = Number(ruleStakeholdersBps);
    const factor = Number.isFinite(bps) && bps >= 0 ? (bps / 10000) : 0.8;
    for (const m of movs) {
        if (!m) continue;
        if (m.kind === 'topup' && m.source === INCOME_SOURCE) {
            allocatedEur += Number(m.amountEur || 0) * factor;
        }
        if (m.kind === 'consume' && m.source === CLAIM_SOURCE) {
            claimedEur += Number(m.amountEur || 0);
        }
    }
    allocatedEur = Math.round(allocatedEur * 10000) / 10000;
    claimedEur   = Math.round(claimedEur   * 10000) / 10000;
    return {
        allocatedEur,
        claimedEur,
        claimableEur: Math.max(0, Math.round((allocatedEur - claimedEur) * 10000) / 10000),
    };
}

// recordIncomeAndDistribute · async · accept un topup d'ingrés i persisteix
// el moviment + opcionalment marker movements informatius de l'allocation.
// El balanceEur incrementa per amountEur sencer · la distribució es calcula
// virtualment per computeStakeholdersPool.
export async function recordIncomeAndDistribute({ projectId, amountEur, note = '', ref = null } = {}) {
    if (!projectId) throw new Error('recordIncomeAndDistribute requires projectId');
    const amt = Number(amountEur);
    if (!Number.isFinite(amt) || amt <= 0) throw new Error('amount must be > 0');

    // Carrega regla per a calcular split (default 20/80)
    let rule = { operatingReserveBps: 2000, stakeholdersBps: 8000 };
    try {
        const { getDistributionRuleForProject, computeIncomeSplit } = await import('./distributionRuleService.js');
        rule = await getDistributionRuleForProject(projectId);
        const split = computeIncomeSplit({ amountEur: amt, rule });
        // Persisteix el topup principal amb tag 'income' i les sub-quantitats al note per traçabilitat
        const updated = await topUpAndPersist({
            projectId,
            amountEur: amt,
            source: INCOME_SOURCE,
            ref:    ref || ('income-' + Date.now()),
            note:   note + (note ? ' · ' : '') + 'reserva ' + split.reserveEur.toFixed(2) + '€ · stakeholders ' + split.stakeholdersEur.toFixed(2) + '€',
        });
        return { wallet: updated, split, rule };
    } catch (e) {
        // Fallback · si distributionRuleService no està disponible, topup normal
        const updated = await topUpAndPersist({
            projectId, amountEur: amt, source: INCOME_SOURCE,
            ref: ref || ('income-' + Date.now()),
            note: note || 'income',
        });
        return { wallet: updated, split: { reserveEur: 0, stakeholdersEur: amt, leftoverEur: 0 }, rule };
    }
}

// withdrawClaim · async · retira el pie d'un stakeholder: consume del
// wallet projecte (kind=consume source=stakeholder-claim) + topup al
// wallet personal del handle indicat.
// Refuse si amount > claimable.
export async function withdrawClaim({ projectId, partyId, partyShare, toHandle, amountEur, note = '' } = {}) {
    if (!projectId) throw new Error('withdrawClaim requires projectId');
    if (!partyId)   throw new Error('withdrawClaim requires partyId');
    if (!toHandle)  throw new Error('withdrawClaim requires toHandle (destinatari del wallet personal)');
    const amt = Number(amountEur);
    if (!Number.isFinite(amt) || amt <= 0) throw new Error('amount must be > 0');

    // Verifica claimable
    const wallet = await getOrCreateWalletForProject(projectId);
    const rule = await (async () => {
        try {
            const m = await import('./distributionRuleService.js');
            const r = await m.getDistributionRuleForProject(projectId);
            return r;
        } catch (_) { return { stakeholdersBps: 8000 }; }
    })();
    const pool = computeStakeholdersPool(wallet, rule.stakeholdersBps);
    const share = Number(partyShare);
    if (!Number.isFinite(share) || share < 0 || share > 1) {
        throw new Error('partyShare must be 0..1 (fraction, no percent)');
    }
    // Claimable global per a aquest party = pool × share - ja claimed per aquest party
    const claimedByParty = (wallet.content.movements || [])
        .filter(m => m && m.kind === 'consume' && m.source === CLAIM_SOURCE && m.ref && m.ref.includes(':party-' + partyId))
        .reduce((s, m) => s + Number(m.amountEur || 0), 0);
    const claimablePartyEur = Math.max(0, pool.allocatedEur * share - claimedByParty);

    if (amt > claimablePartyEur + 1e-6) {
        throw new Error('claim-exceeds-share · claimable=' + claimablePartyEur.toFixed(4) + '€ · requested=' + amt + '€');
    }
    if (Number(wallet.content.balanceEur) < amt) {
        throw new Error('insufficient-funds · balance ' + wallet.content.balanceEur + '€ < ' + amt + '€');
    }

    const ref = 'claim-' + Date.now() + ':party-' + partyId;
    // 1. Consume del wallet projecte
    const after1 = await consumeAndPersist({
        projectId, amountEur: amt,
        ref: ref + ':out',
        source: CLAIM_SOURCE,
        note: note + (note ? ' · ' : '') + 'claim · party ' + partyId + ' → ' + toHandle,
    });
    // 2. Topup al wallet personal del destinatari
    const personalId = personalWalletIdFor(toHandle);
    try {
        const after2 = await topUpAndPersist({
            projectId: personalId,
            amountEur: amt,
            source: CLAIM_SOURCE,
            ref: ref + ':in',
            note: 'claim from ' + projectId + ' · party ' + partyId,
        });
        return { fromProjectWallet: after1, toPersonalWallet: after2, amountEur: amt, ref };
    } catch (e) {
        // Refund · revertim
        try {
            const refunded = refundWallet({
                wallet: after1, amountEur: amt,
                ref: ref + ':refund', source: CLAIM_SOURCE,
                note: 'refund claim · personal wallet topup failed: ' + (e?.message || e),
            });
            await persistWallet(refunded);
        } catch (_) {}
        throw new Error('claim-failed: ' + (e?.message || e));
    }
}

// ─── MKT-001 sprint C3 · helper puro de cargo por llamada LLM ──────────────
// Convierte costUSD → costEur con un rate configurable (default 0.92).
// PURO · sin I/O · testeable.
export const DEFAULT_USD_TO_EUR = 0.92;

export function computeChargeFromTelemetry(telemetry, options = {}) {
    if (!telemetry || !Number.isFinite(Number(telemetry.tokens?.total_tokens))) {
        return { costUSD: 0, costEur: 0, valid: false };
    }
    // costUSD viene calculado por Orchestrator (BASE_PRICING) y se pasa
    // explícito en options.costUSD; si no, lo derivamos de tokens con el
    // pricing también opcionalmente pasado en options.pricing.
    let costUSD = Number(options.costUSD);
    if (!Number.isFinite(costUSD)) {
        const pricing = options.pricing || { input: 0, output: 0 };
        const t = telemetry.tokens || {};
        costUSD = ((t.prompt_tokens     || 0) / 1e6) * pricing.input
                + ((t.completion_tokens || 0) / 1e6) * pricing.output;
    }
    const eurRate = Number.isFinite(Number(options.eurRate)) ? Number(options.eurRate) : DEFAULT_USD_TO_EUR;
    const costEur = +(Math.max(0, costUSD) * eurRate).toFixed(6);
    return { costUSD: +costUSD.toFixed(6), costEur, valid: true, eurRate };
}

// Helper de alto nivel · cobra al wallet de un proyecto el coste de una
// llamada LLM. Devuelve {wallet, charge, sufficient}.
// Si saldo insuficiente y allowNegative=true (default), aplica el cargo
// igualmente · marca sufficient=false para que el caller emita warning.
export async function chargeWalletForLlmCall({ projectId, telemetry, costUSD = null, eurRate = DEFAULT_USD_TO_EUR, allowNegative = true, refPrefix = 'llm' }) {
    if (!projectId)  return { wallet: null, charge: null, sufficient: true, skipped: 'no-projectId' };
    if (!telemetry)  return { wallet: null, charge: null, sufficient: true, skipped: 'no-telemetry' };

    const charge = computeChargeFromTelemetry(telemetry, {
        costUSD: costUSD != null ? costUSD : undefined,
        eurRate,
    });
    if (!charge.valid || charge.costEur <= 0) {
        return { wallet: null, charge, sufficient: true, skipped: 'zero-cost' };
    }

    const wallet = await getOrCreateWalletForProject(projectId);
    const balance = Number(wallet.content?.balanceEur || 0);
    const sufficient = balance >= charge.costEur;

    const ref = refPrefix + '-' + (telemetry.provider || 'unknown') + '-' + Date.now().toString(36);
    const note = (telemetry.tokens?.total_tokens || 0) + ' tokens · ' + (telemetry.provider || '?') + '/' + (telemetry.model || '?');
    const updated = consumeFromWallet({
        wallet, amountEur: charge.costEur,
        ref, source: 'orchestrator', note,
        allowNegative: true,   // siempre true en este helper · el bloqueo lo decide el caller con sufficient
    });
    await persistWallet(updated);
    return { wallet: updated, charge, sufficient, ref, note };
}
