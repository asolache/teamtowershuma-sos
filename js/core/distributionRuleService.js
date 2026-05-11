// TEAMTOWERS SOS V11 — DISTRIBUTION RULE SERVICE (FUND-FLOW-001 sprint C)
//
// Regla configurable per projecte que dispara quan arriba un topup amb
// source='income': N% va a "operating reserve" (cobrir APIs/fees) ·
// M% al "stakeholders pool" (claim segons Slicing Pie).
//
// Es persisteix com a node KB · `id: '{projectId}::distribution-rule'`.
// Si no hi ha · default: 2000 BPS reserve · 8000 BPS stakeholders (20/80).

export const DISTRIBUTION_RULE_TYPE = 'distribution_rule';
export const BPS_TOTAL = 10000;

export const DEFAULT_RULE = Object.freeze({
    operatingReserveBps: 2000,    // 20% reserva operativa (APIs IA · permaweb · blockchain)
    stakeholdersBps:     8000,    // 80% disponible per claim dels stakeholders
    customRules:         [],
});

// Genera l'id estable de la regla per a un projectId.
export function distributionRuleIdFor(projectId) {
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('distributionRuleIdFor requires projectId');
    }
    return projectId + '::distribution-rule';
}

// validateDistributionRule · pura · {valid, errors[]}
export function validateDistributionRule(node) {
    const errors = [];
    if (!node || typeof node !== 'object') return { valid: false, errors: ['node must be object'] };
    if (node.type !== DISTRIBUTION_RULE_TYPE) errors.push(`type must be '${DISTRIBUTION_RULE_TYPE}'`);
    const c = node.content;
    if (!c) return { valid: false, errors: errors.concat(['content required']) };
    const r = Number(c.operatingReserveBps);
    const s = Number(c.stakeholdersBps);
    if (!Number.isFinite(r) || r < 0 || r > BPS_TOTAL) errors.push('operatingReserveBps must be 0..10000');
    if (!Number.isFinite(s) || s < 0 || s > BPS_TOTAL) errors.push('stakeholdersBps must be 0..10000');
    if (Number.isFinite(r) && Number.isFinite(s) && (r + s) > BPS_TOTAL) {
        errors.push(`operatingReserveBps + stakeholdersBps must be ≤ ${BPS_TOTAL} (now ${r+s})`);
    }
    return { valid: errors.length === 0, errors };
}

// buildDistributionRule · pura · construeix el nodo canònic.
export function buildDistributionRule({ projectId, operatingReserveBps, stakeholdersBps, customRules } = {}) {
    if (!projectId) throw new Error('buildDistributionRule requires projectId');
    const r = Number.isFinite(operatingReserveBps) ? operatingReserveBps : DEFAULT_RULE.operatingReserveBps;
    const s = Number.isFinite(stakeholdersBps)     ? stakeholdersBps     : DEFAULT_RULE.stakeholdersBps;
    const now = Date.now();
    const node = {
        id:   distributionRuleIdFor(projectId),
        type: DISTRIBUTION_RULE_TYPE,
        projectId,
        content: {
            kind:                'distribution-rule',
            projectId,
            operatingReserveBps: r,
            stakeholdersBps:     s,
            customRules:         Array.isArray(customRules) ? customRules.slice() : [],
            updatedAt:           now,
        },
        keywords: ['type:distribution-rule', 'projectId:' + projectId],
        createdAt: now,
        updatedAt: now,
    };
    const v = validateDistributionRule(node);
    if (!v.valid) throw new Error('buildDistributionRule · invalid: ' + v.errors.join(' · '));
    return node;
}

// computeIncomeSplit · pura · per a un amount d'ingrés, retorna les
// quantitats que van a cada bucket segons la regla.
// Retorna { reserveEur, stakeholdersEur, leftoverEur }.
export function computeIncomeSplit({ amountEur, rule = DEFAULT_RULE } = {}) {
    const amt = Number(amountEur);
    if (!Number.isFinite(amt) || amt <= 0) {
        return { reserveEur: 0, stakeholdersEur: 0, leftoverEur: 0 };
    }
    const r = Number(rule?.operatingReserveBps ?? DEFAULT_RULE.operatingReserveBps);
    const s = Number(rule?.stakeholdersBps     ?? DEFAULT_RULE.stakeholdersBps);
    const reserveEur     = Math.round((amt * r / BPS_TOTAL) * 10000) / 10000;
    const stakeholdersEur = Math.round((amt * s / BPS_TOTAL) * 10000) / 10000;
    const leftoverEur    = Math.round((amt - reserveEur - stakeholdersEur) * 10000) / 10000;
    return { reserveEur, stakeholdersEur, leftoverEur };
}

// ── KB-bound async ──────────────────────────────────────────────────

export async function getDistributionRuleForProject(projectId) {
    if (!projectId) return null;
    try {
        const { KB } = await import('./kb.js');
        const node = await KB.getNode(distributionRuleIdFor(projectId));
        if (node && node.type === DISTRIBUTION_RULE_TYPE) return node.content;
    } catch (_) {}
    return { ...DEFAULT_RULE, projectId };
}

export async function saveDistributionRule({ projectId, operatingReserveBps, stakeholdersBps, customRules } = {}) {
    const node = buildDistributionRule({ projectId, operatingReserveBps, stakeholdersBps, customRules });
    const { KB } = await import('./kb.js');
    await KB.upsert(node);
    return node;
}
