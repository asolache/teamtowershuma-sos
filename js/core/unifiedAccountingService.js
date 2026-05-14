// =============================================================================
// TEAMTOWERS SOS V11 — UNIFIED ACCOUNTING SERVICE (WALLET-ACC-001 sprint A)
//
// Agrega TOTES les transaccions d'un usuari (operador) i les seves projectes
// per a una vista unificada · "tot el que he gastat i guanyat".
//
// Llegeix de · wallet.content.movements (tots els nodes type='wallet'),
// receipt nodes, ai_audit nodes (per category 'ai'), workshop_unlock nodes.
//
// Filosofia · NO crea nodes nous · sols agrega lectures. Les fonts de veritat
// són les ja existents · evita doble comptabilitat.
//
// Exports puros (zero KB.query · els llegeix el caller i passa nodes):
//   aggregateMovementsForOwner({ walletNodes, receiptNodes, aiAuditNodes,
//                                workshopUnlockNodes, ownerHandle, ownerProjectIds })
//   → { movements:[{...}], totalsByCategory, totalsByKind, totalIncome,
//       totalExpense, netBalance, walletCount }
// =============================================================================

// MOVEMENT_CATEGORIES · mapeig kind/source → categoria humanitzada
const CATEGORY_BY_SOURCE = Object.freeze({
    'stripe-verified':           'topup',
    'ai-fill':                   'ai',
    'orchestrator':              'ai',
    'public-registry-publish':   'permaweb',
    'public-project-publish':    'permaweb',
    'workshop-unlock':           'workshop-expense',
    'workshop-revenue-creator':  'workshop-revenue',
    'workshop-revenue-project':  'workshop-revenue',
    'workshop-revenue-cohort':   'workshop-revenue',
    'stakeholder-claim':         'claim',
    'stakeholder-claim-payout':  'claim',
    'income':                    'income',
    'transfer':                  'transfer',
    'manual':                    'manual',
});

export function categoryForMovement(source, kind) {
    if (CATEGORY_BY_SOURCE[source]) return CATEGORY_BY_SOURCE[source];
    if (kind === 'topup')   return 'topup';
    if (kind === 'consume') return 'expense';
    if (kind === 'refund')  return 'refund';
    if (kind === 'adjustment') return 'adjustment';
    return 'other';
}

// isIncome · els kinds que afegeixen saldo
function _isIncome(kind) {
    return kind === 'topup' || kind === 'refund';
}
// isExpense · els kinds que treuen saldo
function _isExpense(kind) {
    return kind === 'consume';
}

// _flattenMovements · agafa array de wallet nodes i retorna llista plana
function _flattenMovements(walletNodes) {
    const out = [];
    for (const w of (walletNodes || [])) {
        const projectId = w?.content?.projectId || w?.projectId || null;
        const moves     = w?.content?.movements || [];
        for (const m of moves) {
            out.push({
                ts:          m.ts || w?.content?.lastUpdatedAt || 0,
                projectId,
                walletId:    w?.id || null,
                amountEur:   Number(m.amountEur || 0),
                kind:        m.kind || 'unknown',
                source:      m.source || null,
                ref:         m.ref || null,
                note:        m.note || '',
                balanceAfter: m.balanceAfter ?? null,
                category:    categoryForMovement(m.source, m.kind),
            });
        }
    }
    return out;
}

// aggregateMovementsForOwner · pure · retorna agregació per a UI.
//   ownerProjectIds opcional · filtra sols wallets que l'usuari posseeix.
//   Si ownerHandle='@x', també inclou el personal wallet '__personal_@x__'.
export function aggregateMovementsForOwner({
    walletNodes        = [],
    receiptNodes       = [],
    aiAuditNodes       = [],
    workshopUnlockNodes = [],
    ownerHandle        = null,
    ownerProjectIds    = null,
} = {}) {
    // Filtra wallets de l'owner si es proporciona projectIds o handle
    let myWallets = walletNodes;
    if (Array.isArray(ownerProjectIds) || ownerHandle) {
        const allowedProjects = new Set(Array.isArray(ownerProjectIds) ? ownerProjectIds : []);
        if (ownerHandle) {
            // personalWalletIdFor convention · '__personal_{handle}__'
            const handle = ownerHandle.startsWith('@') ? ownerHandle : ('@' + ownerHandle);
            const personalProjectId = '__personal_' + handle + '__';
            allowedProjects.add(personalProjectId);
        }
        myWallets = walletNodes.filter(w => {
            const pid = w?.content?.projectId || w?.projectId;
            return pid && allowedProjects.has(pid);
        });
    }

    const movements = _flattenMovements(myWallets)
        .sort((a, b) => (b.ts || 0) - (a.ts || 0));

    // Agregats per category + kind
    const totalsByCategory = {};
    const totalsByKind     = {};
    let totalIncome  = 0;
    let totalExpense = 0;
    for (const m of movements) {
        totalsByCategory[m.category] = (totalsByCategory[m.category] || 0) + m.amountEur;
        totalsByKind[m.kind]         = (totalsByKind[m.kind]         || 0) + m.amountEur;
        if (_isIncome(m.kind))   totalIncome  += m.amountEur;
        if (_isExpense(m.kind))  totalExpense += m.amountEur;
    }

    // Llistes addicionals per a la vista detall
    const receipts = (receiptNodes || []).slice().sort((a, b) => (b?.content?.issuedAt || 0) - (a?.content?.issuedAt || 0));
    const aiAudits = (aiAuditNodes || []).slice().sort((a, b) => (b?.content?.createdAt || 0) - (a?.content?.createdAt || 0));
    const workshopUnlocks = (workshopUnlockNodes || []).slice().sort((a, b) => (b?.content?.unlockedAt || b?.createdAt || 0) - (a?.content?.unlockedAt || a?.createdAt || 0));

    return {
        movements,
        totalsByCategory,
        totalsByKind,
        totalIncome:   Number(totalIncome.toFixed(6)),
        totalExpense:  Number(totalExpense.toFixed(6)),
        netBalance:    Number((totalIncome - totalExpense).toFixed(6)),
        walletCount:   myWallets.length,
        receipts,
        aiAudits,
        workshopUnlocks,
    };
}

// Helper · summary plain text per al tooltip
export function summarizeAccounting(agg) {
    if (!agg) return 'cap moviment encara';
    const parts = [];
    parts.push(agg.walletCount + ' wallet' + (agg.walletCount === 1 ? '' : 's'));
    parts.push(agg.movements.length + ' moviments');
    parts.push('+' + agg.totalIncome.toFixed(2) + '€');
    parts.push('-' + agg.totalExpense.toFixed(2) + '€');
    parts.push('= ' + (agg.netBalance >= 0 ? '+' : '') + agg.netBalance.toFixed(2) + '€ net');
    return parts.join(' · ');
}

// Helper · async loader per defecte (per a WalletView · injectable per a tests)
export async function loadAllAccountingNodes({ kb }) {
    if (!kb) throw new Error('loadAllAccountingNodes requires kb');
    const [walletNodes, receiptNodes, aiAuditNodes, workshopUnlockNodes] = await Promise.all([
        kb.query({ type: 'wallet' }).catch(() => []),
        kb.query({ type: 'receipt' }).catch(() => []),
        kb.query({ type: 'ai_audit' }).catch(() => []),
        kb.query({ type: 'workshop_unlock' }).catch(() => []),
    ]);
    return { walletNodes, receiptNodes, aiAuditNodes, workshopUnlockNodes };
}
