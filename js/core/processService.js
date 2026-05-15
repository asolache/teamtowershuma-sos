// =============================================================================
// TEAMTOWERS SOS V11 — PROCESS SERVICE (PROCESS-FIRST-CLASS-001 sprint A)
// Ruta · /js/core/processService.js
//
// Process · entitat 1a classe del KB. Substitueix VNA-PROCESS-001 (que
// era només un camp dins project) amb un node `type: 'process'` complet.
//
// Estructura jerarquia · Organization > System > Process > SOC > SOP
//
// Cada process aglutina ·
//   - SOCs (què cal verificar)
//   - Roles (qui hi participa · subset del VNA)
//   - Transactions (quins exchanges entre rols)
//   - Resources (què cal · tools · spaces)
//   - Interfaces (links amb altres processos)
//   - KPIs (mètriques amb threshold per a TDD-ALL-LEVELS-001)
//   - Cycle (cron · event · manual · per a WO-AUTO-001)
//
// Pure · zero KB · zero DOM.
// =============================================================================

export const PROCESS_TYPE = 'process';
export const PROCESS_VERSION = 'v1.0';

// 7 categories tancades (article Systems/Processes) + 'other' overridable
export const PROCESS_CATEGORIES = Object.freeze([
    'sales',         // lead-to-cash · conversions · pipeline
    'ops',           // operacions diàries · production · fulfillment
    'finance',       // tresoreria · facturació · audit
    'innovation',    // R&D · prototips · hipòtesis
    'learn',         // cohort · workshops · onboarding educatiu
    'governance',    // decisions · assembly · policy
    'people',        // HR · cultura · cohesió
    'other',         // overridable · llibre
]);

export const CYCLE_HINTS = Object.freeze([
    'daily',
    'weekly',
    'monthly',
    'quarterly',
    'yearly',
    'on-event',      // disparat per esdeveniment (sense periodicitat fixa)
    'on-demand',     // manual · ad-hoc
    'continuous',    // sempre actiu (e.g. monitoring)
]);

export const PROCESS_STATUS = Object.freeze([
    'active',         // actiu i operatiu
    'experimental',   // en proves · no stable
    'paused',         // pausat temporalment
    'deprecated',     // ja no fa res · mantingut només per historic
]);

export const KPI_KIND = Object.freeze([
    'ratio',          // ratio (e.g. conversion rate 0-1)
    'count',          // comptador absolut
    'duration',       // temps en minuts/hores
    'amount-eur',     // import EUR
    'percentage',     // %
    'boolean',        // sí/no
]);

// ── Builders ───────────────────────────────────────────────────────────────

export function buildEmptyProcess({
    id = null,
    orgId,
    systemId = null,
    label,
    category = 'other',
    cycleHint = 'on-demand',
    ts = null,
} = {}) {
    if (!orgId) throw new Error('buildEmptyProcess · orgId required');
    if (!label) throw new Error('buildEmptyProcess · label required');
    if (!PROCESS_CATEGORIES.includes(category)) {
        throw new Error('buildEmptyProcess · category invalid · ' + category);
    }
    if (!CYCLE_HINTS.includes(cycleHint)) {
        throw new Error('buildEmptyProcess · cycleHint invalid · ' + cycleHint);
    }
    const now = (typeof ts === 'number') ? ts : Date.now();
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    const procId = id || ('proc-' + slug + '-' + now.toString(36));
    return {
        id: procId,
        type: PROCESS_TYPE,
        orgId,
        systemId,
        label: label.trim(),
        category,
        cycleHint,
        roleIds: [],
        txIds: [],
        socIds: [],
        resourceIds: [],
        interfaceIn: [],          // ids of interfaces entering this process
        interfaceOut: [],         // ids of interfaces leaving this process
        kpis: [],
        status: 'experimental',
        version: PROCESS_VERSION,
        keywords: ['type:process', 'category:' + category, 'cycle:' + cycleHint, 'org:' + orgId],
        createdAt: now,
        updatedAt: now,
    };
}

// buildKpi · pure
export function buildKpi({ id, label, kind, target, unit = null } = {}) {
    if (!id) throw new Error('kpi · id required');
    if (!label) throw new Error('kpi · label required');
    if (!KPI_KIND.includes(kind)) throw new Error('kpi · kind invalid · ' + kind);
    if (target == null) throw new Error('kpi · target required');
    return { id, label, kind, target, unit, currentValue: null, lastEvalAt: null };
}

// ── Validators ─────────────────────────────────────────────────────────────

export function validateProcess(proc) {
    const errors = [];
    if (!proc || typeof proc !== 'object') {
        return { ok: false, errors: ['process: must be object'] };
    }
    if (proc.type !== PROCESS_TYPE) errors.push('type: must be ' + PROCESS_TYPE);
    if (!proc.id) errors.push('id: required');
    if (!proc.orgId) errors.push('orgId: required');
    if (!proc.label) errors.push('label: required');
    if (!PROCESS_CATEGORIES.includes(proc.category)) errors.push('category: invalid · ' + proc.category);
    if (!CYCLE_HINTS.includes(proc.cycleHint)) errors.push('cycleHint: invalid · ' + proc.cycleHint);
    if (proc.status && !PROCESS_STATUS.includes(proc.status)) errors.push('status: invalid · ' + proc.status);
    const arrFields = ['roleIds', 'txIds', 'socIds', 'resourceIds', 'interfaceIn', 'interfaceOut', 'kpis'];
    for (const f of arrFields) {
        if (!Array.isArray(proc[f])) errors.push(f + ': must be array');
    }
    if (Array.isArray(proc.kpis)) {
        const ids = new Set();
        for (let i = 0; i < proc.kpis.length; i++) {
            const k = proc.kpis[i];
            if (!k || !k.id) { errors.push('kpis[' + i + '].id: required'); continue; }
            if (ids.has(k.id)) errors.push('kpis · duplicate id: ' + k.id);
            ids.add(k.id);
            if (!KPI_KIND.includes(k.kind)) errors.push('kpis[' + i + '].kind: invalid · ' + k.kind);
            if (k.target == null) errors.push('kpis[' + i + '].target: required');
        }
    }
    return { ok: errors.length === 0, errors };
}

// ── Link helpers (idempotent) ──────────────────────────────────────────────

function _addUnique(arr, id) {
    if (!arr.includes(id)) return [...arr, id];
    return arr;
}
function _remove(arr, id) {
    return arr.filter(x => x !== id);
}

export function linkRole(proc, roleId, { ts = null } = {}) {
    if (!proc || !roleId) throw new Error('linkRole · proc + roleId required');
    return { ...proc, roleIds: _addUnique(proc.roleIds, roleId), updatedAt: ts || Date.now() };
}
export function unlinkRole(proc, roleId, { ts = null } = {}) {
    return { ...proc, roleIds: _remove(proc.roleIds, roleId), updatedAt: ts || Date.now() };
}

export function linkTransaction(proc, txId, { ts = null } = {}) {
    if (!proc || !txId) throw new Error('linkTransaction · proc + txId required');
    return { ...proc, txIds: _addUnique(proc.txIds, txId), updatedAt: ts || Date.now() };
}
export function unlinkTransaction(proc, txId, { ts = null } = {}) {
    return { ...proc, txIds: _remove(proc.txIds, txId), updatedAt: ts || Date.now() };
}

export function linkSoc(proc, socId, { ts = null } = {}) {
    if (!proc || !socId) throw new Error('linkSoc · proc + socId required');
    return { ...proc, socIds: _addUnique(proc.socIds, socId), updatedAt: ts || Date.now() };
}
export function unlinkSoc(proc, socId, { ts = null } = {}) {
    return { ...proc, socIds: _remove(proc.socIds, socId), updatedAt: ts || Date.now() };
}

export function linkResource(proc, resourceId, { ts = null } = {}) {
    if (!proc || !resourceId) throw new Error('linkResource · proc + resourceId required');
    return { ...proc, resourceIds: _addUnique(proc.resourceIds, resourceId), updatedAt: ts || Date.now() };
}

export function linkInterfaceIn(proc, ifaceId, { ts = null } = {}) {
    if (!proc || !ifaceId) throw new Error('linkInterfaceIn · proc + ifaceId required');
    return { ...proc, interfaceIn: _addUnique(proc.interfaceIn, ifaceId), updatedAt: ts || Date.now() };
}
export function linkInterfaceOut(proc, ifaceId, { ts = null } = {}) {
    if (!proc || !ifaceId) throw new Error('linkInterfaceOut · proc + ifaceId required');
    return { ...proc, interfaceOut: _addUnique(proc.interfaceOut, ifaceId), updatedAt: ts || Date.now() };
}

// ── KPI helpers ────────────────────────────────────────────────────────────

export function addKpi(proc, kpi, { ts = null } = {}) {
    if (!proc) throw new Error('addKpi · proc required');
    const k = buildKpi(kpi);
    if ((proc.kpis || []).find(x => x.id === k.id)) throw new Error('addKpi · duplicate id · ' + k.id);
    return { ...proc, kpis: [...(proc.kpis || []), k], updatedAt: ts || Date.now() };
}

export function recordKpiValue(proc, kpiId, value, { ts = null } = {}) {
    if (!proc) throw new Error('recordKpiValue · proc required');
    const now = ts || Date.now();
    const kpis = (proc.kpis || []).map(k => k.id === kpiId ? { ...k, currentValue: value, lastEvalAt: now } : k);
    return { ...proc, kpis, updatedAt: now };
}

// evaluateKpiHealth · pure · per cada KPI · status verd/groc/vermell vs target
export function evaluateKpiHealth(proc) {
    if (!proc) return [];
    return (proc.kpis || []).map(k => {
        if (k.currentValue == null) return { id: k.id, status: 'no-data', label: k.label };
        // Per a kinds amb "higher is better" · ratio · count · percentage
        // Per a kinds amb "lower is better" · duration · amount-eur (cost)
        // Per simplicitat · assumim higher is better default; UI pot override per kind.
        const target = k.target;
        const current = k.currentValue;
        const ratio = current / target;
        let status;
        if (ratio >= 1)         status = 'green';
        else if (ratio >= 0.7)  status = 'yellow';
        else                    status = 'red';
        return { id: k.id, status, label: k.label, current, target, ratio: Number(ratio.toFixed(3)) };
    });
}

// ── Status transitions ─────────────────────────────────────────────────────

export function activateProcess(proc, { ts = null } = {}) {
    if (!proc) throw new Error('activateProcess · proc required');
    return { ...proc, status: 'active', updatedAt: ts || Date.now() };
}
export function pauseProcess(proc, { ts = null } = {}) {
    return { ...proc, status: 'paused', updatedAt: ts || Date.now() };
}
export function deprecateProcess(proc, { ts = null } = {}) {
    return { ...proc, status: 'deprecated', updatedAt: ts || Date.now() };
}

// ── Verna Allee · subgraf VNA filtrat ──────────────────────────────────────

// extractSubgraph · pure · donat un Process + arrays globals (roles + txs)
// retorna el subgraf VNA del procés (només els nodes referenciats).
// Útil per a UI · "VNA filtrat per procés".
export function extractSubgraph(proc, { roles = [], transactions = [] } = {}) {
    if (!proc) return { roles: [], transactions: [] };
    const roleSet = new Set(proc.roleIds || []);
    const txSet = new Set(proc.txIds || []);
    return {
        roles: roles.filter(r => roleSet.has(r.id)),
        transactions: transactions.filter(t => txSet.has(t.id)),
    };
}

// ── Stats ──────────────────────────────────────────────────────────────────

export function computeProcessStats(proc) {
    if (!proc) return null;
    const kpiHealth = evaluateKpiHealth(proc);
    const greenCount = kpiHealth.filter(k => k.status === 'green').length;
    const redCount = kpiHealth.filter(k => k.status === 'red').length;
    return {
        roleCount:        (proc.roleIds || []).length,
        txCount:          (proc.txIds || []).length,
        socCount:         (proc.socIds || []).length,
        resourceCount:    (proc.resourceIds || []).length,
        interfaceInCount: (proc.interfaceIn || []).length,
        interfaceOutCount:(proc.interfaceOut || []).length,
        kpiCount:         (proc.kpis || []).length,
        kpiGreen:         greenCount,
        kpiRed:           redCount,
        kpiHealthOverall: redCount > 0 ? 'red' : (kpiHealth.some(k => k.status === 'yellow') ? 'yellow' : (greenCount > 0 ? 'green' : 'no-data')),
        cycleHint:        proc.cycleHint,
        status:           proc.status,
    };
}
