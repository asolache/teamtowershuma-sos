// =============================================================================
// TEAMTOWERS SOS V11 — AI BUDGET SERVICE (AI-COST-QA-001 sprint B)
// Ruta · /js/core/aiBudgetService.js
//
// Per-project monthly budget enforcement amb 3 estats ·
//   - ok      · < 80% consumit · sense fricció
//   - warning · 80-99% consumit · modal opcional
//   - over    · ≥100% consumit · soft-block (modal augmentar budget)
//   - hard    · ≥120% consumit · hard-block (cap nova crida)
//
// Persistència · localStorage per projecte · clau 'sos_ai_budget_v1'
// =============================================================================

const LS_KEY = 'sos_ai_budget_v1';
const DEFAULT_MONTHLY_BUDGET_EUR = 5.0;     // alfa default per projecte
const WARN_THRESHOLD = 0.80;
const OVER_THRESHOLD = 1.00;
const HARD_THRESHOLD = 1.20;

// Fallback in-memory store quan localStorage no està disponible (Node tests)
let _moduleStore = {};

function _load() {
    if (typeof localStorage === 'undefined') return _moduleStore;
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (_) { return {}; }
}

function _save(data) {
    if (typeof localStorage === 'undefined') {
        _moduleStore = data;
        return;
    }
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (_) {}
}

function _monthKey(ts = null) {
    const d = ts ? new Date(ts) : new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

// setBudget · configura budget mensual per projecte
export function setBudget(projectId, monthlyEur) {
    if (!projectId) throw new Error('setBudget · projectId required');
    if (typeof monthlyEur !== 'number' || monthlyEur < 0) {
        throw new Error('setBudget · monthlyEur must be non-negative number');
    }
    const all = _load();
    if (!all[projectId]) all[projectId] = {};
    all[projectId].monthlyBudgetEur = monthlyEur;
    _save(all);
}

// getBudget · monthly budget (default si no configurat)
export function getBudget(projectId) {
    if (!projectId) return DEFAULT_MONTHLY_BUDGET_EUR;
    const all = _load();
    return all[projectId]?.monthlyBudgetEur ?? DEFAULT_MONTHLY_BUDGET_EUR;
}

// recordSpend · suma cost al mes actual del projecte
export function recordSpend(projectId, costEur, { ts = null } = {}) {
    if (!projectId) return;
    if (typeof costEur !== 'number' || costEur <= 0) return;
    const all = _load();
    if (!all[projectId]) all[projectId] = {};
    if (!all[projectId].monthly) all[projectId].monthly = {};
    const mk = _monthKey(ts);
    all[projectId].monthly[mk] = Number(((all[projectId].monthly[mk] || 0) + costEur).toFixed(6));
    _save(all);
}

// getSpend · acumulat del mes actual (o mes especificat)
export function getSpend(projectId, { ts = null } = {}) {
    if (!projectId) return 0;
    const all = _load();
    const mk = _monthKey(ts);
    return all[projectId]?.monthly?.[mk] || 0;
}

// budgetStatus · estat del projecte aquest mes
export function budgetStatus(projectId, { ts = null } = {}) {
    const budget = getBudget(projectId);
    const spent = getSpend(projectId, { ts });
    if (budget <= 0) return { state: 'unlimited', spent, budget, ratio: 0, remaining: Infinity };
    const ratio = spent / budget;
    let state;
    if (ratio < WARN_THRESHOLD)      state = 'ok';
    else if (ratio < OVER_THRESHOLD) state = 'warning';
    else if (ratio < HARD_THRESHOLD) state = 'over';
    else                              state = 'hard';
    return {
        state,
        spent: Number(spent.toFixed(4)),
        budget,
        ratio: Number(ratio.toFixed(3)),
        remaining: Number((budget - spent).toFixed(4)),
    };
}

// canSpend · pure check · usat ABANS de fer una crida IA
// Retorna { ok, reason?, status } · ok=false significa hard-block
export function canSpend(projectId, plannedCostEur = 0, { ts = null } = {}) {
    const status = budgetStatus(projectId, { ts });
    if (status.state === 'unlimited') return { ok: true, status };
    const projectedSpent = status.spent + plannedCostEur;
    const projectedRatio = projectedSpent / status.budget;
    if (projectedRatio >= HARD_THRESHOLD) {
        return { ok: false, reason: 'hard-block · ' + (projectedRatio * 100).toFixed(0) + '% del budget', status };
    }
    return { ok: true, status, projectedRatio: Number(projectedRatio.toFixed(3)) };
}

// resetMonth · esborra spend d'un mes (sols admin · per testing)
export function resetMonth(projectId, { ts = null } = {}) {
    const all = _load();
    if (!all[projectId]) return;
    const mk = _monthKey(ts);
    if (all[projectId].monthly) {
        delete all[projectId].monthly[mk];
    }
    _save(all);
}

// _resetAll · sols per a tests
export function _resetAll() {
    _moduleStore = {};
    if (typeof localStorage !== 'undefined') {
        try { localStorage.removeItem(LS_KEY); } catch (_) {}
    }
}
