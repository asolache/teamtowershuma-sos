// =============================================================================
// TEAMTOWERS SOS V11 — SAVINGS SERVICE (MKT-001 sprint D)
// Ruta: /js/core/savingsService.js
//
// Cuadro de ahorro acumulado vs vías convencionales.
//
// Combina 3 fuentes reales del KB:
//   - Wallet del proyecto (movements consume con costo IA real)
//   - Efficiency logs (tokens · costUSD por llamada con pruning)
//   - WO nodos (actualHours × fmvPerHour para tracking horas humanas)
//
// Y los compara con rangos convencionales editables (notaría · contable
// · project management · consultoría) para emitir un "ahorro acumulado"
// cuantificable proyecto por proyecto + global.
//
// Funciones PURAS · sin I/O · testeables sin IndexedDB.
// =============================================================================

import { DEFAULT_CONVENTIONAL_RANGES } from './marketService.js';

// ─── Cálculos atómicos · PUROS ─────────────────────────────────────────────

// Coste humano de una WO según hours × fmv. Devuelve { estimated, real }.
// Si no hay actualHours, real = null.
export function computeWoHumanCost(wo) {
    if (!wo || !wo.content) return { estimated: 0, real: null };
    const c = wo.content;
    const fmv = Number(c.fmvPerHour) || 0;
    const estHours = Number(c.estimatedHours) || 0;
    const actHours = c.actualHours != null ? Number(c.actualHours) : null;
    return {
        estimated: +(estHours * fmv).toFixed(4),
        real:      actHours != null ? +(actHours * fmv).toFixed(4) : null,
    };
}

// Coste IA de una WO según tokensIn/Out × pricing del provider.
// Si no hay tokensIn/Out, devuelve null.
export function computeWoAiCost(wo, pricing = null) {
    if (!wo || !wo.content) return null;
    const c = wo.content;
    const tokIn  = c.tokensIn  != null ? Number(c.tokensIn)  : null;
    const tokOut = c.tokensOut != null ? Number(c.tokensOut) : null;
    if (tokIn == null && tokOut == null) return null;
    const p = pricing || c.aiPricing || { input: 3.00, output: 15.00 };  // anthropic default
    const costUSD = ((tokIn || 0) / 1e6) * p.input + ((tokOut || 0) / 1e6) * p.output;
    return { tokensIn: tokIn || 0, tokensOut: tokOut || 0, costUSD: +costUSD.toFixed(6) };
}

// Suma del consumo del wallet (tokens IA reales descontados via sprint C3).
// Devuelve { totalConsumedEur, movementCount }.
export function sumWalletConsumption(wallet) {
    if (!wallet || !wallet.content) return { totalConsumedEur: 0, movementCount: 0 };
    const movements = wallet.content.movements || [];
    let total = 0;
    let count = 0;
    for (const mv of movements) {
        if (mv.kind === 'consume') {
            total += Number(mv.amountEur) || 0;
            count++;
        }
    }
    return { totalConsumedEur: +total.toFixed(6), movementCount: count };
}

// Suma del coste IA de los efficiency logs de un proyecto. Útil cuando
// el wallet aún no estaba activo · proporciona un fallback real.
// Filtra por projectId vía pruning.taskTags si está, o devuelve todo.
export function sumEfficiencyLogs(efficiencyLogs, { projectId = null, eurRate = 0.92 } = {}) {
    if (!Array.isArray(efficiencyLogs)) return { totalUsd: 0, totalEur: 0, count: 0, totalTokens: 0 };
    let totalUsd = 0;
    let totalTokens = 0;
    let count = 0;
    for (const log of efficiencyLogs) {
        const c = log?.content || {};
        // Filtrado por projectId: vía taskTags (p.ej. "project:proj-x") del pruning telemetry
        if (projectId) {
            const tags = c.pruning?.taskTags || [];
            const hasProj = tags.some(t => t === 'project:' + projectId);
            if (!hasProj) continue;
        }
        totalUsd    += Number(c.costUSD) || 0;
        totalTokens += Number(c.totalTokens) || 0;
        count++;
    }
    return {
        totalUsd:    +totalUsd.toFixed(6),
        totalEur:    +(totalUsd * eurRate).toFixed(6),
        count,
        totalTokens,
    };
}

// ─── Comparativa vs convencional · PURO ────────────────────────────────────
// Para una categoría dada (notaria · contable · pm · consultoria), calcula:
//   - rango convencional (lowEur, highEur)
//   - coste SOS real (sosEur)
//   - ahorro absoluto (savingEur)
//   - ahorro porcentual (savingPct vs midpoint)
export function compareToConventional({ category, sosEur, ranges = DEFAULT_CONVENTIONAL_RANGES }) {
    const range = ranges?.[category];
    if (!range) return { category, available: false };
    const mid = (range.lowEur + range.highEur) / 2;
    const savingEur = +Math.max(0, mid - sosEur).toFixed(4);
    const savingPct = mid > 0 ? Math.round(100 * savingEur / mid) : 0;
    return {
        category,
        available:    true,
        label:        range.label,
        lowEur:       range.lowEur,
        highEur:      range.highEur,
        midEur:       +mid.toFixed(2),
        sosEur:       +Number(sosEur).toFixed(4),
        savingEur,
        savingPct,
        unit:         range.unit || null,
    };
}

// ─── Stats agregadas por proyecto · PURO ──────────────────────────────────
// Combina wallet + efficiency logs + WOs del proyecto.
// Devuelve un objeto con stats listos para renderizar en dashboard.
export function computeProjectSavings({ projectId, wallet = null, efficiencyLogs = [], workOrders = [], options = {} }) {
    if (!projectId) return _emptyProjectSavings();

    // Coste IA real (preferimos wallet · si no hay, fallback a efficiency logs)
    const walletStats = sumWalletConsumption(wallet);
    const effStats    = sumEfficiencyLogs(efficiencyLogs, { projectId, eurRate: options.eurRate || 0.92 });
    const aiCostEur   = walletStats.totalConsumedEur > 0 ? walletStats.totalConsumedEur : effStats.totalEur;

    // Horas humanas + coste real
    let humanHoursReal = 0;
    let humanCostReal  = 0;
    let humanHoursEst  = 0;
    let humanCostEst   = 0;
    let woCount = 0;
    let woLedgered = 0;
    for (const wo of (workOrders || [])) {
        if (!wo || !wo.content) continue;
        if (wo.projectId !== projectId) continue;
        woCount++;
        if ((wo.content.status) === 'ledgered') woLedgered++;
        const cost = computeWoHumanCost(wo);
        humanCostEst   += cost.estimated;
        humanHoursEst  += Number(wo.content.estimatedHours) || 0;
        if (cost.real != null) {
            humanCostReal  += cost.real;
            humanHoursReal += Number(wo.content.actualHours) || 0;
        }
    }

    return {
        projectId,
        // costes IA
        aiCostEur:           +aiCostEur.toFixed(4),
        aiCostUsdFromLogs:   effStats.totalUsd,
        aiTokensTotal:       effStats.totalTokens,
        aiCallCount:         effStats.count,
        walletConsumedCount: walletStats.movementCount,
        // costes humanos
        humanHoursEst:       +humanHoursEst.toFixed(2),
        humanCostEst:        +humanCostEst.toFixed(2),
        humanHoursReal:      +humanHoursReal.toFixed(2),
        humanCostReal:       +humanCostReal.toFixed(2),
        // WOs
        woCount,
        woLedgered,
        // total operativo SOS = IA real + humano real
        sosTotalCostEur: +(aiCostEur + humanCostReal).toFixed(2),
    };
}

function _emptyProjectSavings() {
    return {
        projectId: null,
        aiCostEur: 0, aiCostUsdFromLogs: 0, aiTokensTotal: 0, aiCallCount: 0,
        walletConsumedCount: 0,
        humanHoursEst: 0, humanCostEst: 0, humanHoursReal: 0, humanCostReal: 0,
        woCount: 0, woLedgered: 0,
        sosTotalCostEur: 0,
    };
}

// ─── Cuadro de ahorro · vs los 4 rangos convencionales ─────────────────────
// Aplica compareToConventional para cada categoría con el sosTotalCostEur.
export function buildSavingsTable(projectStats, ranges = DEFAULT_CONVENTIONAL_RANGES) {
    if (!projectStats) return [];
    const sosCost = Number(projectStats.sosTotalCostEur || 0);
    return Object.keys(ranges).map(cat => compareToConventional({ category: cat, sosEur: sosCost, ranges }));
}

// ─── Acumulado global · todos los proyectos ────────────────────────────────
export function accumulateAllProjects({ projects = [], wallets = [], efficiencyLogs = [], workOrders = [], options = {} }) {
    const byProject = projects.map(p => {
        const wallet = wallets.find(w => w.content?.projectId === p.id || w.projectId === p.id) || null;
        return computeProjectSavings({
            projectId:      p.id,
            wallet,
            efficiencyLogs,
            workOrders,
            options,
        });
    });
    const totals = byProject.reduce((acc, s) => ({
        aiCostEur:        +(acc.aiCostEur + s.aiCostEur).toFixed(4),
        aiTokensTotal:    acc.aiTokensTotal + s.aiTokensTotal,
        aiCallCount:      acc.aiCallCount + s.aiCallCount,
        humanHoursReal:   +(acc.humanHoursReal + s.humanHoursReal).toFixed(2),
        humanCostReal:    +(acc.humanCostReal + s.humanCostReal).toFixed(2),
        woCount:          acc.woCount + s.woCount,
        woLedgered:       acc.woLedgered + s.woLedgered,
        sosTotalCostEur:  +(acc.sosTotalCostEur + s.sosTotalCostEur).toFixed(2),
    }), {
        aiCostEur: 0, aiTokensTotal: 0, aiCallCount: 0,
        humanHoursReal: 0, humanCostReal: 0,
        woCount: 0, woLedgered: 0, sosTotalCostEur: 0,
    });
    return { byProject, totals, projectsCount: projects.length };
}
