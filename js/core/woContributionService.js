// TEAMTOWERS SOS V11 — WO TO CONTRIBUTION SERVICE (VAL-001 sprint C)
//
// Cierra el bucle SOP → WO → Ledger → Slice del Antigravity Engine.
// Cada Work Order que llega a status='ledgered' con horas reales
// trabajadas y party asignada se convierte automáticamente en una
// `value_contribution` type='time' que alimenta la tarta del proyecto
// (VAL-001 valueAccountingService).
//
// Filosofía @alvaro 2026-05-09: "las contributions deberían ser las
// WOs contabilizadas". Esto es exactamente lo que materializa este
// servicio. Las aportaciones tipo cash/assets/ideas siguen siendo
// formulario manual en /value-accounting.
//
// Helpers puros · todos testables sin KB ni DOM.

import { buildContribution, fairValueForTime, DEFAULT_HOURS_PER_YEAR } from './valueAccountingService.js';

// Tasa salarial anual default (€/año) usada para calcular fairValue
// cuando el WO no declara fmvPerHour. Editable per-projecte vía
// override en options.defaultAnnualSalaryEur.
export const DEFAULT_ANNUAL_SALARY_EUR = 36000;   // ≈ 18 €/h base

// ── partyIdForWo · resuelve el party (priority order) ────────────
// 1) wo.content.assignedToSeatId (campo explícito del nuevo flow)
// 2) wo.content.assignee.id si != 'pending' / null / 'agente_anthropic' / 'unknown'
// 3) null · WO sin party asignado · NO genera contribution
export function partyIdForWo(wo) {
    if (!wo || typeof wo !== 'object') return null;
    const c = wo.content || {};
    if (typeof c.assignedToSeatId === 'string' && c.assignedToSeatId.length > 0) {
        return c.assignedToSeatId;
    }
    const a = c.assignee;
    if (a && typeof a.id === 'string' && a.id.length > 0) {
        const blacklist = new Set(['pending', 'unknown', 'agente_anthropic', 'agente_openai', 'agente_deepseek', 'agente_gemini', 'agente_minimax', 'tbd', 'todo']);
        if (!blacklist.has(a.id.toLowerCase())) return a.id;
    }
    return null;
}

// ── woHasContributableLedger · WO contabilizable como slice ──────
// Requiere · status='ledgered' + actualHours > 0 + party válido.
export function woHasContributableLedger(wo) {
    if (!wo || typeof wo !== 'object') return false;
    const c = wo.content || {};
    if (c.status !== 'ledgered') return false;
    const hours = Number(c.actualHours);
    if (!isFinite(hours) || hours <= 0) return false;
    if (!partyIdForWo(wo)) return false;
    return true;
}

// ── woFairValueEur · calcula valor justo del tiempo trabajado ────
// Si el WO declara fmvPerHour > 0, usa ese (manda el WO).
// Si no, fórmula Slicing Pie default: 2 × annualSalary / 2000h × hours.
export function woFairValueEur(wo, { defaultAnnualSalaryEur = DEFAULT_ANNUAL_SALARY_EUR, hoursPerYear = DEFAULT_HOURS_PER_YEAR } = {}) {
    if (!wo || typeof wo !== 'object') return 0;
    const c = wo.content || {};
    const hours = Number(c.actualHours) || 0;
    if (hours <= 0) return 0;
    const fmv = Number(c.fmvPerHour);
    if (isFinite(fmv) && fmv > 0) return fmv * hours;
    return fairValueForTime({ hours, annualSalaryEur: defaultAnnualSalaryEur, hoursPerYear });
}

// ── woToContribution · genera contribution desde WO ───────────────
// Devuelve null si el WO no cumple condiciones.
// Override de salario anual por party · `salaryByPartyId` (opcional).
export function woToContribution(wo, {
    defaultAnnualSalaryEur = DEFAULT_ANNUAL_SALARY_EUR,
    hoursPerYear           = DEFAULT_HOURS_PER_YEAR,
    salaryByPartyId        = null,
} = {}) {
    if (!woHasContributableLedger(wo)) return null;
    const partyId = partyIdForWo(wo);
    const c = wo.content || {};
    const annualSalary = (salaryByPartyId && salaryByPartyId[partyId]) || defaultAnnualSalaryEur;
    const fairValue = woFairValueEur(wo, { defaultAnnualSalaryEur: annualSalary, hoursPerYear });
    if (fairValue <= 0) return null;
    const description = c.title
        ? `WO ledgered · ${c.title} · ${c.actualHours}h`
        : `WO ledgered · ${c.actualHours}h`;
    return buildContribution({
        partyId,
        type:           'time',
        fairValueEur:   fairValue,
        description,
        evidenceRef:    wo.id,
        timestamp:      wo.updatedAt || wo.createdAt || Date.now(),
    });
}

// ── importWosToContributions · bulk · puro ────────────────────────
// Filtra WOs por proyecto + estado + party. Devuelve {
//   contributions, skipped, partyTypeMapInferred
// }
export function importWosToContributions({
    wos = [],
    projectId = null,
    options = {},
} = {}) {
    const list = Array.isArray(wos) ? wos : [];
    const filtered = projectId
        ? list.filter(w => (w?.projectId === projectId || w?.content?.projectId === projectId))
        : list;
    const contributions = [];
    const skipped = [];
    const partyTypeMapInferred = {};   // partyId → pieType heurístico (default 'team')

    for (const wo of filtered) {
        if (!woHasContributableLedger(wo)) {
            skipped.push({ id: wo?.id, reason: 'not-contributable', status: wo?.content?.status, actualHours: wo?.content?.actualHours, partyId: partyIdForWo(wo) });
            continue;
        }
        const contrib = woToContribution(wo, options);
        if (!contrib) {
            skipped.push({ id: wo?.id, reason: 'fair-value-zero' });
            continue;
        }
        contributions.push(contrib);
        // Heurística · todos los WOs van a 'team' por defecto. Operador
        // puede ajustar luego en /value-accounting.
        if (!partyTypeMapInferred[contrib.partyId]) {
            partyTypeMapInferred[contrib.partyId] = 'team';
        }
    }

    return { contributions, skipped, partyTypeMapInferred };
}

// ── importStats · resumen para UI feedback ────────────────────────
export function importStats({ contributions = [], skipped = [] } = {}) {
    const totalSlices = contributions.reduce((acc, c) => acc + (c.slices || 0), 0);
    const totalEur = contributions.reduce((acc, c) => acc + (c.fairValueEur || 0), 0);
    const partiesSet = new Set(contributions.map(c => c.partyId));
    return {
        importedCount:   contributions.length,
        skippedCount:    skipped.length,
        partiesCount:    partiesSet.size,
        totalSlices,
        totalEur:        Math.round(totalEur * 100) / 100,
        skippedReasons:  skipped.reduce((acc, s) => { acc[s.reason] = (acc[s.reason] || 0) + 1; return acc; }, {}),
    };
}
