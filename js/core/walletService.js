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
