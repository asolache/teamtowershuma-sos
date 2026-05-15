// =============================================================================
// TEAMTOWERS SOS V11 — RESOURCE SERVICE (RESOURCES-ENTITY-001 sprint A)
// Ruta · /js/core/resourceService.js
//
// Resource · entitat 1a classe per a · eines · espais · temps · digital
// assets · subscripcions. Substitueix els "items dispersos" amb un model
// uniformes amb capacity + cost.
//
// Pure · zero KB · zero DOM.
// =============================================================================

export const RESOURCE_TYPE = 'resource';
export const RESOURCE_VERSION = 'v1.0';

export const RESOURCE_KINDS = Object.freeze([
    'tool',           // software · SaaS (Calendly · Stripe · Notion)
    'space',          // físic (botiga · oficina · ateneu)
    'time',           // capacitat humana (hores · cohorts)
    'asset',          // digital asset (brand · template · IP)
    'subscription',   // recurrent (Netflix-like · cloud bills)
    'equipment',      // hardware (laptop · impressora · servidor)
    'consumable',     // material que es consumeix (paper · pintura)
]);

export const CAPACITY_UNITS = Object.freeze([
    'users', 'bookings-per-month', 'hours-per-week',
    'mb', 'gb', 'requests-per-minute', 'units', 'unlimited',
]);

// ── Builders ───────────────────────────────────────────────────────────────

export function buildEmptyResource({
    id = null,
    orgId,
    kind,
    label,
    costMonthlyEur = null,
    capacity = null,           // { max: N, unit: 'users' } | null
    ts = null,
} = {}) {
    if (!orgId) throw new Error('buildEmptyResource · orgId required');
    if (!label) throw new Error('buildEmptyResource · label required');
    if (!RESOURCE_KINDS.includes(kind)) {
        throw new Error('buildEmptyResource · kind invalid · ' + kind);
    }
    if (costMonthlyEur != null && (typeof costMonthlyEur !== 'number' || costMonthlyEur < 0)) {
        throw new Error('buildEmptyResource · costMonthlyEur non-negative or null');
    }
    if (capacity && capacity.unit && !CAPACITY_UNITS.includes(capacity.unit)) {
        throw new Error('buildEmptyResource · capacity.unit invalid · ' + capacity.unit);
    }
    const now = (typeof ts === 'number') ? ts : Date.now();
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    const resId = id || ('res-' + slug + '-' + now.toString(36));
    return {
        id: resId,
        type: RESOURCE_TYPE,
        orgId,
        kind,
        label: label.trim(),
        description: '',
        costMonthlyEur,
        capacity: capacity || null,
        currentUsage: null,                  // updated by usage helpers
        usedByProcesses: [],
        active: true,
        version: RESOURCE_VERSION,
        keywords: ['type:resource', 'kind:' + kind, 'org:' + orgId],
        createdAt: now,
        updatedAt: now,
    };
}

// ── Validators ─────────────────────────────────────────────────────────────

export function validateResource(res) {
    const errors = [];
    if (!res || typeof res !== 'object') {
        return { ok: false, errors: ['resource: must be object'] };
    }
    if (res.type !== RESOURCE_TYPE) errors.push('type: must be ' + RESOURCE_TYPE);
    if (!res.id) errors.push('id: required');
    if (!res.orgId) errors.push('orgId: required');
    if (!res.label) errors.push('label: required');
    if (!RESOURCE_KINDS.includes(res.kind)) errors.push('kind: invalid · ' + res.kind);
    if (res.costMonthlyEur != null && (typeof res.costMonthlyEur !== 'number' || res.costMonthlyEur < 0)) {
        errors.push('costMonthlyEur: non-negative or null');
    }
    if (res.capacity && res.capacity.unit && !CAPACITY_UNITS.includes(res.capacity.unit)) {
        errors.push('capacity.unit: invalid · ' + res.capacity.unit);
    }
    if (!Array.isArray(res.usedByProcesses)) errors.push('usedByProcesses: must be array');
    return { ok: errors.length === 0, errors };
}

// ── Capacity helpers ───────────────────────────────────────────────────────

export function setCapacity(res, { max, unit }, { ts = null } = {}) {
    if (!res) throw new Error('setCapacity · res required');
    if (typeof max !== 'number' || max < 0) throw new Error('setCapacity · max non-negative number');
    if (!CAPACITY_UNITS.includes(unit)) throw new Error('setCapacity · unit invalid · ' + unit);
    return {
        ...res,
        capacity: { max, unit },
        updatedAt: ts || Date.now(),
    };
}

export function recordUsage(res, current, { ts = null } = {}) {
    if (!res) throw new Error('recordUsage · res required');
    if (typeof current !== 'number' || current < 0) throw new Error('recordUsage · current non-negative');
    return { ...res, currentUsage: current, updatedAt: ts || Date.now() };
}

// utilizationRatio · pure · current / max · 0-1+ (>1 = overuse)
export function utilizationRatio(res) {
    if (!res || !res.capacity || !res.capacity.max) return null;
    if (res.currentUsage == null) return 0;
    return res.currentUsage / res.capacity.max;
}

// utilizationStatus · pure · OK / warning / overuse
export function utilizationStatus(res) {
    const r = utilizationRatio(res);
    if (r == null) return 'no-capacity-defined';
    if (r === 0) return 'unused';
    if (r < 0.7) return 'ok';
    if (r < 1)   return 'warning';
    return 'overuse';
}

// ── Process linking ────────────────────────────────────────────────────────

export function linkProcess(res, processId, { ts = null } = {}) {
    if (!res || !processId) throw new Error('linkProcess · res + processId required');
    if ((res.usedByProcesses || []).includes(processId)) return res;
    return {
        ...res,
        usedByProcesses: [...(res.usedByProcesses || []), processId],
        updatedAt: ts || Date.now(),
    };
}

export function unlinkProcess(res, processId, { ts = null } = {}) {
    if (!res) throw new Error('unlinkProcess · res required');
    return {
        ...res,
        usedByProcesses: (res.usedByProcesses || []).filter(id => id !== processId),
        updatedAt: ts || Date.now(),
    };
}

// ── Status helpers ─────────────────────────────────────────────────────────

export function activateResource(res, { ts = null } = {}) {
    return { ...res, active: true, updatedAt: ts || Date.now() };
}
export function deactivateResource(res, { ts = null } = {}) {
    return { ...res, active: false, updatedAt: ts || Date.now() };
}

// ── Cost aggregation ──────────────────────────────────────────────────────

// totalMonthlyCost · pure · suma costs d'un array de resources
export function totalMonthlyCost(resources = []) {
    return Number(resources
        .filter(r => r && typeof r.costMonthlyEur === 'number' && r.active)
        .reduce((acc, r) => acc + r.costMonthlyEur, 0)
        .toFixed(2));
}

// costByKind · pure · agregat per kind
export function costByKind(resources = []) {
    const out = Object.fromEntries(RESOURCE_KINDS.map(k => [k, 0]));
    for (const r of resources) {
        if (!r || !r.active || typeof r.costMonthlyEur !== 'number') continue;
        out[r.kind] = Number((out[r.kind] + r.costMonthlyEur).toFixed(2));
    }
    return out;
}

// ── Stats ──────────────────────────────────────────────────────────────────

export function computeResourceStats(res) {
    if (!res) return null;
    return {
        kind: res.kind,
        active: res.active,
        costMonthlyEur: res.costMonthlyEur,
        utilizationRatio: utilizationRatio(res),
        utilizationStatus: utilizationStatus(res),
        usedByProcessCount: (res.usedByProcesses || []).length,
    };
}
