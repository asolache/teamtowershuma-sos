// =============================================================================
// TEAMTOWERS SOS V11 — TOKENOMICS SERVICE (TOKENOMICS sprint A)
// Ruta · /js/core/tokenomicsService.js
//
// Disseny de token + distribució + vesting per a projectes SOS. Generalitza
// el patró fair-fractal preexistent · sols capa de "design token" persistit
// com a node KB amb projectId. Pure · zero KB · zero DOM · injectable.
//
// Schema · token_design node ·
//   { id, type:'token_design', projectId,
//     content: {
//       name, symbol, totalSupply, decimals,
//       distribution: { founders, operators, treasury, community,
//                       investors, liquidity, advisors? },
//       vesting:      { founders: { cliffMonths, linearMonths },
//                       operators: {...}, ... },
//       launchDate?, notes?
//     } }
//
// Distribució · sum dels percentatges (0..1) = 1.0 (tol 0.001) per a poder
// desar. Vesting per categoria · cliff (sense unlock fins X) + linear (lineal
// fins Y mesos addicionals). Si cliff+linear = 0 · unlocked immediately.
//
// Reusa · patró TEA · zero retroactiu · attestable amb wallet signature
// (futur sprint B).
// =============================================================================

export const TOKEN_DESIGN_TYPE = 'token_design';

// Categories standard · suggeriments. L'usuari pot afegir categoria custom.
export const TOKEN_GROUPS = Object.freeze([
    { id: 'founders',   label: 'Fundadors',           color: '#facc15', defaultPct: 0.20, hint: 'Anchor ètic · multiplicador slicing pie' },
    { id: 'operators',  label: 'Operadors',           color: '#22c55e', defaultPct: 0.30, hint: 'Contributors actius · slicing pie continu' },
    { id: 'treasury',   label: 'Tresoreria',          color: '#3b82f6', defaultPct: 0.20, hint: 'DAO / coop reserva · governança' },
    { id: 'community',  label: 'Comunitat',           color: '#a855f7', defaultPct: 0.15, hint: 'Airdrops · quests · esdeveniments' },
    { id: 'investors',  label: 'Inversors',           color: '#fb923c', defaultPct: 0.10, hint: 'Early backers · rondes inicials' },
    { id: 'liquidity',  label: 'Liquiditat',          color: '#ec4899', defaultPct: 0.05, hint: 'DEX seed · market making' },
]);

const GROUP_BY_ID = new Map(TOKEN_GROUPS.map(g => [g.id, g]));

// Default vesting per categoria · alguns immediats · founders i investors
// amb cliff + linear · operators amb linear sense cliff (slicing pie continu).
export const DEFAULT_VESTING = Object.freeze({
    founders:  { cliffMonths: 12, linearMonths: 36 },     // 12m cliff + 36m linear · 4 anys total
    operators: { cliffMonths: 0,  linearMonths: 24 },     // 24m linear · slicing pie progressiu
    treasury:  { cliffMonths: 0,  linearMonths: 0  },     // governance-managed · liquid
    community: { cliffMonths: 0,  linearMonths: 12 },     // 12m drip · evitar dump
    investors: { cliffMonths: 6,  linearMonths: 18 },     // 6m cliff + 18m linear · 2 anys
    liquidity: { cliffMonths: 0,  linearMonths: 0  },     // immediat per seed DEX
});

// groupMeta · pure · retorna metadata per group id (label, color, hint).
export function groupMeta(groupId) {
    return GROUP_BY_ID.get(groupId) || {
        id: groupId, label: groupId, color: '#94a3b8', defaultPct: 0,
        hint: 'custom group',
    };
}

// buildEmptyTokenDesign · pura · genera design buit amb defaults SOS.
export function buildEmptyTokenDesign({
    projectId   = null,
    name        = 'SOSToken',
    symbol      = 'SOS',
    totalSupply = 1_000_000,
    decimals    = 18,
    ts          = null,
} = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    const distribution = {};
    for (const g of TOKEN_GROUPS) distribution[g.id] = g.defaultPct;
    const vesting = {};
    for (const g of TOKEN_GROUPS) vesting[g.id] = { ...DEFAULT_VESTING[g.id] };
    return {
        id:        'td-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 7),
        type:      TOKEN_DESIGN_TYPE,
        projectId,
        content: {
            name,
            symbol,
            totalSupply,
            decimals,
            distribution,
            vesting,
            launchDate:  null,
            notes:       '',
            createdAt:   now,
        },
        createdAt: now,
        updatedAt: now,
    };
}

// validateTokenDesign · pura · retorna { ok, errors[], distSum }
// Checks ·
//  - name · 1-32 chars · symbol · 1-12 chars
//  - totalSupply > 0
//  - distribution sum = 1.0 (tol 0.001)
//  - cap pct negatiu · cap > 1
//  - vesting · cliffMonths ≥ 0 · linearMonths ≥ 0 · sum < 240 (20 anys)
export function validateTokenDesign(design) {
    const errors = [];
    if (!design || !design.content) return { ok: false, errors: ['missing-content'], distSum: 0 };
    const c = design.content;

    if (!c.name || c.name.length < 1 || c.name.length > 32) errors.push('name-1-32');
    if (!c.symbol || c.symbol.length < 1 || c.symbol.length > 12) errors.push('symbol-1-12');
    if (typeof c.totalSupply !== 'number' || c.totalSupply <= 0) errors.push('totalSupply-positive');
    if (typeof c.decimals !== 'number' || c.decimals < 0 || c.decimals > 30) errors.push('decimals-0-30');

    // Distribution
    let distSum = 0;
    const dist = c.distribution || {};
    for (const [gid, pct] of Object.entries(dist)) {
        if (typeof pct !== 'number' || !isFinite(pct)) { errors.push('dist-bad-pct · ' + gid); continue; }
        if (pct < 0) errors.push('dist-negative · ' + gid);
        if (pct > 1) errors.push('dist-over-100 · ' + gid);
        distSum += pct;
    }
    distSum = Math.round(distSum * 1000) / 1000;
    if (Math.abs(distSum - 1) > 0.001) errors.push('dist-must-sum-1 · sum=' + distSum.toFixed(3));

    // Vesting
    const vesting = c.vesting || {};
    for (const [gid, v] of Object.entries(vesting)) {
        if (!v || typeof v !== 'object') { errors.push('vesting-bad · ' + gid); continue; }
        if (typeof v.cliffMonths !== 'number' || v.cliffMonths < 0)   errors.push('vesting-cliff-negative · ' + gid);
        if (typeof v.linearMonths !== 'number' || v.linearMonths < 0) errors.push('vesting-linear-negative · ' + gid);
        if ((v.cliffMonths || 0) + (v.linearMonths || 0) > 240)        errors.push('vesting-over-20-years · ' + gid);
    }

    return { ok: errors.length === 0, errors, distSum };
}

// setDistributionPct · pura · canvia pct d'un group · immutable. NO renormalitza.
// El consumidor (UI) decideix · normalitzar abans de validar o no.
export function setDistributionPct(design, groupId, pct) {
    if (typeof pct !== 'number' || !isFinite(pct)) throw new Error('pct must be number');
    if (pct < 0 || pct > 1) throw new Error('pct must be 0-1');
    return {
        ...design,
        content: {
            ...design.content,
            distribution: { ...(design.content.distribution || {}), [groupId]: pct },
        },
        updatedAt: Date.now(),
    };
}

// normalizeDistribution · pura · força la suma a 1.0 ajustant proporcionalment.
// Útil per quan l'usuari arrossega un slider · els altres es redueixen.
export function normalizeDistribution(distribution) {
    const entries = Object.entries(distribution);
    const sum = entries.reduce((s, [, p]) => s + (typeof p === 'number' ? p : 0), 0);
    if (sum === 0) return { ...distribution };
    const normalized = {};
    for (const [g, p] of entries) {
        normalized[g] = Math.round((p / sum) * 10000) / 10000;       // round 4 decimals
    }
    return normalized;
}

// setVestingParams · pura · canvia cliff/linear d'un group
export function setVestingParams(design, groupId, { cliffMonths = null, linearMonths = null } = {}) {
    const v = design.content?.vesting?.[groupId] || { cliffMonths: 0, linearMonths: 0 };
    const next = { ...v };
    if (typeof cliffMonths  === 'number') next.cliffMonths  = Math.max(0, cliffMonths);
    if (typeof linearMonths === 'number') next.linearMonths = Math.max(0, linearMonths);
    return {
        ...design,
        content: {
            ...design.content,
            vesting: { ...(design.content.vesting || {}), [groupId]: next },
        },
        updatedAt: Date.now(),
    };
}

// computeVestingSchedule · pura · simulació mensual.
// Retorna · [{ month, byGroup: { groupId: cumulativeUnlocked }, totalUnlocked }, ...]
// Per a M mesos (default 48 · 4 anys). Cada categoria desbloqueja segons:
//  - mes < cliffMonths · 0
//  - mes ∈ [cliffMonths, cliffMonths+linearMonths] · linear ramp
//  - mes > cliffMonths+linearMonths · 100% de la quota
//
// Si cliffMonths=0 i linearMonths=0 · 100% mes 0 (immediat).
export function computeVestingSchedule(design, { months = 48 } = {}) {
    const c = design?.content || {};
    const totalSupply = c.totalSupply || 0;
    const dist = c.distribution || {};
    const vest = c.vesting || {};
    const schedule = [];
    for (let m = 0; m <= months; m++) {
        const byGroup = {};
        let totalUnlocked = 0;
        for (const [gid, pct] of Object.entries(dist)) {
            const v = vest[gid] || { cliffMonths: 0, linearMonths: 0 };
            const quota = totalSupply * pct;
            let unlockedPct;
            if (v.cliffMonths === 0 && v.linearMonths === 0) {
                unlockedPct = 1;
            } else if (m < v.cliffMonths) {
                unlockedPct = 0;
            } else if (v.linearMonths === 0) {
                // cliff sense linear · 100% al mes del cliff
                unlockedPct = 1;
            } else if (m >= v.cliffMonths + v.linearMonths) {
                unlockedPct = 1;
            } else {
                unlockedPct = (m - v.cliffMonths) / v.linearMonths;
            }
            const unlocked = Math.round(quota * unlockedPct);
            byGroup[gid] = unlocked;
            totalUnlocked += unlocked;
        }
        schedule.push({ month: m, byGroup, totalUnlocked });
    }
    return schedule;
}

// computeQualityScore · pura · score 0-100 d'un design · per al lifecycle.
// Penalitza: sum != 1, no vesting (founders especialment), supply absurd,
// distribució extrema (>50% un sol group sense cliff).
export function computeQualityScore(design) {
    const v = validateTokenDesign(design);
    if (!v.ok) return { score: 0, reasons: v.errors, valid: false };
    const c = design.content;
    let score = 100;
    const reasons = [];

    // Founders sense vesting · -25 (governance risk)
    const fv = c.vesting?.founders || {};
    if ((fv.cliffMonths || 0) + (fv.linearMonths || 0) < 12) {
        score -= 25;
        reasons.push('founders-vesting-too-short · risk de dump');
    }

    // Cap group > 50% · -10
    for (const [gid, pct] of Object.entries(c.distribution)) {
        if (pct > 0.5) { score -= 10; reasons.push('concentration-' + gid + '-over-50pct'); }
    }

    // Treasury < 10% · -10 (no buffer governança)
    if ((c.distribution?.treasury || 0) < 0.10) { score -= 10; reasons.push('treasury-under-10pct'); }

    // Community = 0 · -10 (no community share)
    if ((c.distribution?.community || 0) === 0) { score -= 10; reasons.push('community-zero'); }

    // Liquidity = 0 i existeix · -5 (no DEX seed)
    if ((c.distribution?.liquidity || 0) === 0) { score -= 5; reasons.push('liquidity-zero · sense seed DEX'); }

    // Symbol massa llarg · -5
    if ((c.symbol || '').length > 6) { score -= 5; reasons.push('symbol-over-6-chars'); }

    score = Math.max(0, Math.min(100, score));
    return { score, reasons, valid: true };
}

// applyTokenDesignToProject · pura · merge a project.content.tokenDesignId
// per a quick-reference. El design segueix com a node KB separat.
export function applyTokenDesignToProject(project, designId) {
    if (!project) throw new Error('project required');
    if (!designId) throw new Error('designId required');
    return {
        ...project,
        content: { ...(project.content || {}), tokenDesignId: designId },
        updatedAt: Date.now(),
    };
}
