// =============================================================================
// TEAMTOWERS SOS V11 — CANONICAL PRINCIPLES (CANONICAL-001 sprint A)
//
// Constants i registre canònic dels 4 principis fonamentals SOS:
//   1. Tot són nodes · KB-first · zero side-effect intangible
//   2. Tota aportació de valor es comptabilitza · audit trail
//   3. Stripe + stakeholders pool · 20/80 split via distribution_rule
//   4. Stack tècnic clau · IA · Permaweb · TEA · Smart contracts
//
// Aquest fitxer és la font de veritat per a · validacions de node type ·
// classificació de value categories · checks de TEA invariant.
//
// Vegeu docs/CANONICAL_PRINCIPLES.md per a la documentació completa.
// =============================================================================

// ── PRINCIPI 1 · CANONICAL_NODE_TYPES ──────────────────────────────────
// Catàleg congelat de TOTS els node types vàlids al KB. Cada type
// representa un artefacte real al sistema · zero excepcions.
export const CANONICAL_NODE_TYPES = Object.freeze({
    // Identitats + governance
    user_identity:           'DID + ECDSA P-256 keys',
    matriu_member:           'Cohort member profile',
    cohort_seat:             'Plaça Cohort 0 (108 total)',
    swarm_assignment:        'Member ↔ project link',
    // Economia
    wallet:                  'Saldo + movements ledger',
    value_contribution:      'Slicing pie input',
    receipt:                 'Stripe topup invoice',
    ai_audit:                'IA generation cost + outcome',
    workshop_unlock:         'Workshop 70/20/10 split',
    stripe_claim:            'Anti-double-spend lock',
    stripe_connect_account:  'Seller payout config',
    connect_sale:            'Stripe Connect product purchase (CANONICAL-001)',
    subscription_plan:       'Pla (free/pro/coop/ent)',
    distribution_rule:       '20/80 reserve/stakeholders',
    // Permaweb
    public_registry_entry:     'User permaweb profile',
    public_project_entry:      'Project permaweb entry',
    public_work_order_entry:   'WO permaweb entry',
    public_market_item_entry:  'Market item permaweb',
    public_workshop_entry:     'Workshop permaweb entry',
    // Operativa
    sop:                  'Standard Operating Procedure',
    work_order:           'Operational task',
    role:                 'Value map role',
    transaction:          'Value map transaction',
    market_item:          'Product/service offering',
    workshop:             'Educational session',
    soc:                  'Standard Operating Charter',
    efficiency_log:       'Context pruning metrics',
    // Triple-Entry Accounting (CANONICAL-001 nou)
    attestation:          'Signed dual-entry record (payer + receiver)',
    config:               'Generic config nodes (sos_key_*, etc.)',
    kernel:               'Global state persistence',
});

export const VALID_NODE_TYPES = Object.freeze(Object.keys(CANONICAL_NODE_TYPES));

export function isValidNodeType(type) {
    return typeof type === 'string' && CANONICAL_NODE_TYPES.hasOwnProperty(type);
}

// ── PRINCIPI 2 · VALUE_CATEGORIES ──────────────────────────────────────
// Categories d'aportació de valor · cada moviment monetari ha de poder
// classificar-se en una d'aquestes. Permet aggregar a /wallet panel.
export const VALUE_CATEGORIES = Object.freeze({
    // Expenses (consume)
    ai:                    { sign: '-', kind: 'expense', label: 'Cost IA',           color: '#ef4444' },
    permaweb:              { sign: '-', kind: 'expense', label: 'Publish permaweb',  color: '#ef4444' },
    'workshop-expense':    { sign: '-', kind: 'expense', label: 'Workshop unlock',   color: '#ef4444' },
    'selective-publish':   { sign: '-', kind: 'expense', label: 'Publish selectiu',  color: '#ef4444' },
    'connect-buyer':       { sign: '-', kind: 'expense', label: 'Compra Stripe Connect', color: '#ef4444' },
    // Income (topup)
    topup:                 { sign: '+', kind: 'income',  label: 'Recarrega Stripe',  color: '#22c55e' },
    'workshop-revenue':    { sign: '+', kind: 'income',  label: 'Ingressos workshop',color: '#22c55e' },
    'connect-seller':      { sign: '+', kind: 'income',  label: 'Venda Stripe Connect', color: '#22c55e' },
    'connect-platform-fee':{ sign: '+', kind: 'income',  label: 'Fee plataforma SOS',color: '#22c55e' },
    'stakeholder-claim':   { sign: '+', kind: 'income',  label: 'Retirada stakeholder',color: '#22c55e' },
    income:                { sign: '+', kind: 'income',  label: 'Ingrés genèric',    color: '#22c55e' },
    // Neutral
    transfer:              { sign: '↔', kind: 'neutral', label: 'Transferència',     color: '#a855f7' },
    adjustment:            { sign: '±', kind: 'neutral', label: 'Ajustament manual', color: '#facc15' },
    refund:                { sign: '+', kind: 'refund',  label: 'Reemborsament',     color: '#22c55e' },
});

export function categoryMeta(catId) {
    return VALUE_CATEGORIES[catId] || { sign: '·', kind: 'unknown', label: catId, color: '#94a3b8' };
}

// ── PRINCIPI 3 · STRIPE_FLOW_INVARIANTS ────────────────────────────────
// Quan un usuari paga via Stripe Connect (8% fee SOS · 92% al venedor):
//   1. buyer wallet · consume (-priceEur)
//   2. SOS platform wallet · topup (+feeEur)  · category 'connect-platform-fee'
//   3. seller wallet · topup (+(priceEur-feeEur))  · category 'connect-seller'
//
// Quan el seller té un distribution_rule (20/80):
//   La income arriba al project wallet → recordIncomeAndDistribute() splits
//   automàticament 20% reserve + 80% stakeholders pool (subdivisió virtual).
//
// SOS_PLATFORM_WALLET_ID · convenció id especial per al wallet de la plataforma
// (no lligat a cap projecte). Vegeu PLATFORM_WALLET_PROJECT_ID constant.
export const PLATFORM_WALLET_PROJECT_ID = '__sos_platform__';
export const DEFAULT_PLATFORM_FEE_PCT = 8.0;  // % de Stripe Connect que va a SOS

// ── PRINCIPI 4 · STACK_TECH ─────────────────────────────────────────────
// Llista canònica dels 4 pillars tècnics. Cada feature ha d'identificar quin
// pillar(s) utilitza per a auditoria d'arquitectura.
export const STACK_TECH = Object.freeze({
    IA: {
        services: ['aiFillService', 'aiRouterService', 'aiProviderService'],
        description: 'Escalation chain · 5 providers · cost auditat amb marge SOS',
    },
    PERMAWEB: {
        services: ['publicRegistryService', 'publicProjectService', 'publicEntityService'],
        description: 'Arweave · ECDSA P-256 signat · GraphQL discovery',
    },
    TEA: {  // Triple-Entry Accounting
        services: ['valueAccountingService', 'attestationService', 'walletService'],
        description: 'Payer + receiver + attestation signada · evita doble comptabilitat',
    },
    SMART_CONTRACTS: {
        services: ['(planned · Gnosis Safe integration)'],
        description: 'Multi-sig treasury · vesting · payouts atòmics',
    },
});

// ── Helper · validateMovement · TEA pre-check ──────────────────────────
// Check ràpid · cada moviment de wallet ha de tenir SOURCE o REF.
// Si SOURCE pertany a una category coneguda, és comptabilitzable. Si no,
// retorna warning per a auditoria (no bloquegem per backward-compat).
export function validateMovement(movement) {
    if (!movement || typeof movement !== 'object') return { valid: false, reason: 'movement required' };
    if (typeof movement.amountEur !== 'number')    return { valid: false, reason: 'amountEur required' };
    if (typeof movement.kind !== 'string')         return { valid: false, reason: 'kind required' };
    const sourceKnown = movement.source && VALUE_CATEGORIES[
        // Sources mapped to category
        movement.source === 'stripe-verified'           ? 'topup' :
        movement.source === 'ai-fill'                   ? 'ai' :
        movement.source === 'public-project-publish'    ? 'permaweb' :
        movement.source === 'public-registry-publish'   ? 'permaweb' :
        movement.source === 'workshop-unlock'           ? 'workshop-expense' :
        movement.source === 'workshop-revenue-creator'  ? 'workshop-revenue' :
        movement.source === 'workshop-revenue-project'  ? 'workshop-revenue' :
        movement.source === 'workshop-revenue-cohort'   ? 'workshop-revenue' :
        movement.source === 'selective-publish'         ? 'selective-publish' :
        movement.source === 'connect-buyer'             ? 'connect-buyer' :
        movement.source === 'connect-seller'            ? 'connect-seller' :
        movement.source === 'connect-platform-fee'      ? 'connect-platform-fee' :
        movement.source === 'stakeholder-claim'         ? 'stakeholder-claim' :
        movement.source === 'income'                    ? 'income' :
        movement.source
    ];
    return { valid: true, sourceKnown: !!sourceKnown, source: movement.source || null };
}
