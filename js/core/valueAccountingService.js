// TEAMTOWERS SOS V11 — VALUE ACCOUNTING SERVICE (VAL-001 sprint A)
//
// Cimiento operativo del slicing pie y FairShares · primera vista
// formal de contabilidad de valor en SOS V11. Mide aportaciones reales
// (tiempo, dinero, ideas, activos, relaciones) con multiplicadores de
// riesgo y reparte tarta entre stakeholders.
//
// Modelos integrados:
//   - Slicing Pie (Mike Moyer · TimeFounder) · multiplicadores de riesgo
//   - FairShares (Rory Ridley-Duff) · 4-5 pies de stakeholders
//
// Fórmula canónica:
//   slices = fair_market_value × risk_multiplier
//
// Cada projecte té el seu state de contabilitat de valor · els
// multiplicadors són públics i auditables · les aportacions queden
// registrades en KB com a `value_contribution` nodes · el resultat
// és un mapa "person → slices" que es pot dividir per pies (founders ·
// team · users · investors · community).

// ── Slicing Pie multipliers (Mike Moyer · TimeFounder) ──────────────

export const SLICING_PIE_MULTIPLIERS = Object.freeze({
    cash:           4,    // Riesgo máximo · pérdida total posible
    time:           2,    // Coste de oportunidad de salario no cobrado
    assets:         2,    // Equipos · facilities · vehículos · depreciación
    ideas:          1,    // IP · apreciación independiente · subjetiva
    vendor:         1,    // Crédito comercial diferido · proveedor sin pago
    relationships:  1,    // Cliente clave · contacto comercial
});

export const VALID_CONTRIBUTION_TYPES = Object.freeze(Object.keys(SLICING_PIE_MULTIPLIERS));

// ── FairShares pie types (Rory Ridley-Duff) ─────────────────────────

export const FAIRSHARES_PIE_TYPES = Object.freeze([
    'founders',     // Fundadores · capital fundacional + visión + liderazgo inicial
    'team',         // Equipo · aportaciones operativas continuadas
    'users',        // Clientes/usuarios · generan ingresos · co-crean producto
    'investors',    // Inversores externos · capital líquido posterior · sin trabajo operativo
    'community',    // Comunidad/territorio · impacto social · ecosistema regenerativo (opt)
]);

// Mapping default · qué pies están activos por defecto en cada tipus
// de proyecto MAT-003. Coherente con bootstrapTemplates.js.
export const DEFAULT_PIES_BY_PROJECT_TYPE = Object.freeze({
    'comunitat-autosuficient':    Object.freeze(['founders', 'team', 'users', 'community']),
    'startup-coop-tradicional':   Object.freeze(['founders', 'team', 'investors']),
    'empresa-en-transicio':       Object.freeze(['founders', 'team', 'investors']),
    'cooperativa-multi':          Object.freeze(['founders', 'team', 'users', 'community']),
    'fundacio-ong':               Object.freeze(['founders', 'team', 'community']),
    'ecosistema-regional':        Object.freeze(['founders', 'team', 'community']),
    'dao-web3':                   Object.freeze(['founders', 'team', 'investors', 'community']),
    'plataforma-cooperativa':     Object.freeze(['founders', 'team', 'users']),
    'cooperativa-cures':          Object.freeze(['founders', 'team', 'users', 'community']),
    'espai-autogestionat':        Object.freeze(['founders', 'team', 'community']),
    'hub-transicio':              Object.freeze(['founders', 'team', 'community']),
    'familiar-relevo':            Object.freeze(['founders', 'team']),
});

// VAL-001 sprint A.5 · KIS · cada pie tiene un % objetivo del total del
// proyecto. La suma de pieTargets = 100. Dentro de cada pie, los
// miembros se reparten ese % proporcional a sus slices.
//
// Defaults sensatos por tipo de proyecto (FairShares aplicado al
// signo dels temps 2026 · founders/team con peso fundacional · users
// con voz creciente · investors solo donde hace falta capital
// líquido · community con voz testimonial).
export const DEFAULT_PIE_TARGETS_BY_PROJECT_TYPE = Object.freeze({
    'comunitat-autosuficient':    Object.freeze({ founders: 35, team: 35, users: 20, community: 10 }),
    'startup-coop-tradicional':   Object.freeze({ founders: 50, team: 35, investors: 15 }),
    'empresa-en-transicio':       Object.freeze({ founders: 45, team: 40, investors: 15 }),
    'cooperativa-multi':          Object.freeze({ founders: 25, team: 35, users: 25, community: 15 }),
    'fundacio-ong':               Object.freeze({ founders: 30, team: 50, community: 20 }),
    'ecosistema-regional':        Object.freeze({ founders: 25, team: 40, community: 35 }),
    'dao-web3':                   Object.freeze({ founders: 35, team: 30, investors: 25, community: 10 }),
    'plataforma-cooperativa':     Object.freeze({ founders: 30, team: 40, users: 30 }),
    'cooperativa-cures':          Object.freeze({ founders: 25, team: 50, users: 15, community: 10 }),
    'espai-autogestionat':        Object.freeze({ founders: 25, team: 40, community: 35 }),
    'hub-transicio':              Object.freeze({ founders: 30, team: 35, community: 35 }),
    'familiar-relevo':            Object.freeze({ founders: 60, team: 40 }),
});

// Hours per year · default for time contribution fair value calculation
// (2000h = 50 weeks × 40h/week)
export const DEFAULT_HOURS_PER_YEAR = 2000;

// ── Pure helpers ────────────────────────────────────────────────────

// buildContribution · construye un objeto contribution validado.
// type debe ser uno de SLICING_PIE_MULTIPLIERS keys.
export function buildContribution({
    partyId,
    type,
    fairValueEur,
    riskMultiplierOverride = null,
    description = '',
    evidenceRef = null,
    timestamp = null,
} = {}) {
    if (typeof partyId !== 'string' || !partyId) {
        throw new Error('buildContribution requires partyId (string)');
    }
    if (!VALID_CONTRIBUTION_TYPES.includes(type)) {
        throw new Error('buildContribution · type inválido: ' + type + ' · debe ser uno de ' + VALID_CONTRIBUTION_TYPES.join(','));
    }
    if (typeof fairValueEur !== 'number' || fairValueEur < 0 || !isFinite(fairValueEur)) {
        throw new Error('buildContribution requires fairValueEur (positive number)');
    }
    const multiplier = (typeof riskMultiplierOverride === 'number' && riskMultiplierOverride > 0)
        ? riskMultiplierOverride
        : SLICING_PIE_MULTIPLIERS[type];
    return {
        partyId,
        type,
        fairValueEur,
        riskMultiplier: multiplier,
        slices:         fairValueEur * multiplier,
        description,
        evidenceRef,
        timestamp:      timestamp || Date.now(),
    };
}

// fairValueForTime · calcula valor justo de mercado para tiempo.
// fórmula · 2 × annualSalaryEur / hoursPerYear (Slicing Pie default)
export function fairValueForTime({ hours, annualSalaryEur, hoursPerYear = DEFAULT_HOURS_PER_YEAR } = {}) {
    if (typeof hours !== 'number' || hours < 0) return 0;
    if (typeof annualSalaryEur !== 'number' || annualSalaryEur < 0) return 0;
    if (hoursPerYear <= 0) return 0;
    // Slicing Pie · time fair value es 2x salario para reflejar coste de
    // oportunidad de no cobrar nómina. El multiplicador ×2 de risk se
    // aplica encima.
    return (2 * annualSalaryEur / hoursPerYear) * hours;
}

// calculateSlices · puro · array contributions → { partyId: totalSlices }
export function calculateSlices(contributions) {
    if (!Array.isArray(contributions)) return {};
    const slices = {};
    for (const c of contributions) {
        if (!c || typeof c.partyId !== 'string' || typeof c.slices !== 'number') continue;
        if (!isFinite(c.slices) || c.slices < 0) continue;
        slices[c.partyId] = (slices[c.partyId] || 0) + c.slices;
    }
    return slices;
}

// calculatePieDistribution · puro · slices map → array ordered desc
// con sharePct = slice / total
export function calculatePieDistribution({ slices = {} } = {}) {
    const partyIds = Object.keys(slices || {});
    if (partyIds.length === 0) return [];
    const total = partyIds.reduce((acc, id) => acc + (slices[id] || 0), 0);
    if (total <= 0) return partyIds.map(id => ({ partyId: id, slices: 0, sharePct: 0 }));
    return partyIds
        .map(id => ({
            partyId:  id,
            slices:   slices[id] || 0,
            sharePct: Math.round((slices[id] / total) * 10000) / 100,   // 2 decimals
        }))
        .sort((a, b) => b.slices - a.slices);
}

// calculateStakeholderPies · puro · separa slices en pies según
// `partyTypeMap` que clasifica cada partyId como uno de FAIRSHARES_PIE_TYPES.
//
// Input:
//   contributions  · array de contributions
//   partyTypeMap   · { partyId: 'founders' | 'team' | 'users' | 'investors' | 'community' }
//   activePies     · subset de FAIRSHARES_PIE_TYPES (default: todos los presentes)
//
// Output:
//   { [pieType]: { totalSlices, distribution: [{partyId, slices, sharePct}] } }
export function calculateStakeholderPies({ contributions = [], partyTypeMap = {}, activePies = null } = {}) {
    const map = partyTypeMap || {};
    const piesUsed = new Set(activePies || FAIRSHARES_PIE_TYPES);

    // Agrupa contributions por pie type
    const byPie = {};
    for (const c of (contributions || [])) {
        if (!c || typeof c.partyId !== 'string') continue;
        const pieType = map[c.partyId] || 'team';   // default: team
        if (!piesUsed.has(pieType)) continue;
        if (!byPie[pieType]) byPie[pieType] = [];
        byPie[pieType].push(c);
    }

    const out = {};
    for (const pieType of piesUsed) {
        const contribs = byPie[pieType] || [];
        const slicesMap = calculateSlices(contribs);
        const distribution = calculatePieDistribution({ slices: slicesMap });
        const totalSlices = distribution.reduce((acc, d) => acc + d.slices, 0);
        out[pieType] = { totalSlices, distribution };
    }
    return out;
}

// summarizePieDistribution · resumen breve para UI cards
export function summarizePieDistribution(slices) {
    const dist = calculatePieDistribution({ slices });
    if (dist.length === 0) {
        return { totalParties: 0, totalSlices: 0, leader: null, leaderPct: 0 };
    }
    const totalSlices = dist.reduce((acc, d) => acc + d.slices, 0);
    return {
        totalParties: dist.length,
        totalSlices,
        leader:       dist[0].partyId,
        leaderPct:    dist[0].sharePct,
    };
}

// pieGiniCoefficient · puro · medida de desigualdad (0=igualitario · ~1=monopolio)
// Fórmula clásica · G = (2·Σ(i·xi)) / (n·Σxi) − (n+1)/n  con xi ordenados ascendentemente.
// Útil para alertar si un pie está demasiado concentrado.
export function pieGiniCoefficient(slices) {
    const values = Object.values(slices || {}).filter(v => typeof v === 'number' && v >= 0);
    if (values.length === 0) return 0;
    const total = values.reduce((a, b) => a + b, 0);
    if (total <= 0) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    const n = sorted.length;
    let weighted = 0;
    for (let i = 0; i < n; i++) {
        weighted += (i + 1) * sorted[i];   // 1-indexed
    }
    const gini = ((2 * weighted) / (n * total)) - ((n + 1) / n);
    return Math.max(0, Math.min(1, Math.round(gini * 1000) / 1000));
}

// ── KB integration helpers ──────────────────────────────────────────

export function buildValueContributionNode({ projectId, contribution } = {}) {
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('buildValueContributionNode requires projectId');
    }
    if (!contribution || typeof contribution !== 'object') {
        throw new Error('buildValueContributionNode requires contribution');
    }
    const id = `${projectId}::value-contrib::${contribution.partyId}::${contribution.type}::${contribution.timestamp || Date.now()}`;
    return {
        id,
        type: 'value_contribution',
        projectId,
        content: {
            kind:           'value-contribution',
            partyId:        contribution.partyId,
            contribType:    contribution.type,
            fairValueEur:   contribution.fairValueEur,
            riskMultiplier: contribution.riskMultiplier,
            slices:         contribution.slices,
            description:    contribution.description || '',
            evidenceRef:    contribution.evidenceRef || null,
            timestamp:      contribution.timestamp || Date.now(),
        },
        keywords: [
            'type:value_contribution',
            'kind:value-contribution',
            'project:' + projectId,
            'contribType:' + contribution.type,
            'party:' + contribution.partyId,
        ],
    };
}

// extractContributionsFromKb · puro · lee nodos value_contribution
// del KB y los devuelve como array de contributions listos para
// calculateSlices/calculateStakeholderPies.
export function extractContributionsFromKb({ kbNodes = [], projectId = null } = {}) {
    return (kbNodes || [])
        .filter(n => n?.type === 'value_contribution')
        .filter(n => !projectId || n.projectId === projectId)
        .map(n => ({
            partyId:        n.content?.partyId,
            type:           n.content?.contribType,
            fairValueEur:   n.content?.fairValueEur,
            riskMultiplier: n.content?.riskMultiplier,
            slices:         n.content?.slices,
            description:    n.content?.description || '',
            evidenceRef:    n.content?.evidenceRef || null,
            timestamp:      n.content?.timestamp || 0,
        }))
        .filter(c => typeof c.partyId === 'string' && typeof c.slices === 'number');
}

// activePiesForProject · resuelve qué pies aplican según projectTypeId
// + override del operador (si lo hay).
export function activePiesForProject({ projectTypeId, overridePies = null } = {}) {
    if (Array.isArray(overridePies) && overridePies.length > 0) {
        return overridePies.filter(p => FAIRSHARES_PIE_TYPES.includes(p));
    }
    if (projectTypeId && DEFAULT_PIES_BY_PROJECT_TYPE[projectTypeId]) {
        return DEFAULT_PIES_BY_PROJECT_TYPE[projectTypeId].slice();
    }
    return ['founders', 'team'];   // mínimo viable por defecto
}

// ── VAL-001 sprint A.5 · KIS · pies con target % del proyecto total ──
//
// Filosofía · una sola tarta del proyecto = 100%. Se divide en pies
// según `pieTargets` (objeto { founders: 40, team: 30, ... } que suma
// 100). Cada miembro del pie gana su % final del proyecto =
// (slicesEnPie / totalSlicesPie) × pieTarget.

// validatePieTargets · puro · suma debe ser 100 (±0.5 tolerancia
// para redondeos). Cada key debe ser un pie type válido.
export function validatePieTargets(pieTargets) {
    if (!pieTargets || typeof pieTargets !== 'object') return false;
    const keys = Object.keys(pieTargets);
    if (keys.length === 0) return false;
    let sum = 0;
    for (const k of keys) {
        if (!FAIRSHARES_PIE_TYPES.includes(k)) return false;
        const v = pieTargets[k];
        if (typeof v !== 'number' || !isFinite(v) || v < 0) return false;
        sum += v;
    }
    return Math.abs(sum - 100) <= 0.5;
}

// pieTargetsForProject · resuelve qué % por pie según projectTypeId +
// override del operador. Devuelve siempre un objeto válido (validateable).
export function pieTargetsForProject({ projectTypeId, overrideTargets = null } = {}) {
    if (overrideTargets && validatePieTargets(overrideTargets)) {
        return { ...overrideTargets };
    }
    if (projectTypeId && DEFAULT_PIE_TARGETS_BY_PROJECT_TYPE[projectTypeId]) {
        return { ...DEFAULT_PIE_TARGETS_BY_PROJECT_TYPE[projectTypeId] };
    }
    // mínimo viable · 60/40
    return { founders: 60, team: 40 };
}

// calculateProjectPie · puro · KIS · devuelve la tarta completa del
// proyecto con cada miembro y su % FINAL en el proyecto (no del pie).
//
// Input:
//   contributions   · array de contributions (cada una con partyId · slices)
//   partyTypeMap    · { partyId: pieType }    classifica cada party
//   pieTargets      · { pieType: pct }        suma 100
//   options:
//     - includeEmpty: bool · si true devuelve también pies sin
//       contribuciones (con todoSlicesPct disponible para asignar)
//
// Output:
//   {
//     pieTargets,       // echo del input
//     totalSlices,      // suma global de slices
//     piesActive: [...], // pies que tienen ≥1 contribución
//     parties: [        // ordenado desc por sharePctInProject
//       { partyId, pieType, slicesInPie, totalSlicesInPie,
//         sharePctInPie, sharePctInProject }
//     ],
//     piesEmpty: [...],  // pies activos en pieTargets pero sin contribuciones
//                        // (su % está disponible · NO se distribuye automá-
//                        // ticamente a otros)
//   }
export function calculateProjectPie({
    contributions = [],
    partyTypeMap = {},
    pieTargets = null,
} = {}) {
    if (!validatePieTargets(pieTargets)) {
        throw new Error('calculateProjectPie · pieTargets inválido (debe sumar 100 con keys válidas)');
    }
    const targets = pieTargets;
    const map = partyTypeMap || {};

    // 1) Agrupar contributions por pie type
    const byPie = {};
    for (const c of (contributions || [])) {
        if (!c || typeof c.partyId !== 'string' || typeof c.slices !== 'number') continue;
        if (c.slices < 0 || !isFinite(c.slices)) continue;
        const pieType = map[c.partyId];
        // Si el party no está clasificado o su pie no está en targets · ignorar
        if (!pieType || !(pieType in targets)) continue;
        if (!byPie[pieType]) byPie[pieType] = [];
        byPie[pieType].push(c);
    }

    // 2) Para cada pie · agregar slices por party + total del pie
    const parties = [];
    const piesActive = [];
    const piesEmpty = [];
    for (const pieType of Object.keys(targets)) {
        const contribs = byPie[pieType] || [];
        if (contribs.length === 0) {
            piesEmpty.push(pieType);
            continue;
        }
        piesActive.push(pieType);
        const slicesByParty = calculateSlices(contribs);
        const totalSlicesInPie = Object.values(slicesByParty).reduce((a, b) => a + b, 0);
        if (totalSlicesInPie <= 0) { piesEmpty.push(pieType); continue; }
        const pieTargetPct = targets[pieType];
        for (const partyId of Object.keys(slicesByParty)) {
            const slicesInPie = slicesByParty[partyId];
            const sharePctInPie = (slicesInPie / totalSlicesInPie) * 100;
            const sharePctInProject = (slicesInPie / totalSlicesInPie) * pieTargetPct;
            parties.push({
                partyId,
                pieType,
                slicesInPie,
                totalSlicesInPie,
                sharePctInPie:    Math.round(sharePctInPie * 100) / 100,
                sharePctInProject: Math.round(sharePctInProject * 100) / 100,
            });
        }
    }

    parties.sort((a, b) => b.sharePctInProject - a.sharePctInProject);

    const totalSlices = parties.reduce((acc, p) => acc + p.slicesInPie, 0);

    return {
        pieTargets: { ...targets },
        totalSlices,
        piesActive,
        piesEmpty,
        parties,
    };
}

// summarizeProjectPie · resumen ejecutivo para UI cards
export function summarizeProjectPie(projectPie) {
    if (!projectPie || !Array.isArray(projectPie.parties)) {
        return { totalParties: 0, totalSlices: 0, leader: null, leaderPct: 0, allocatedPct: 0, unallocatedPct: 100 };
    }
    const allocated = projectPie.parties.reduce((acc, p) => acc + p.sharePctInProject, 0);
    const leader = projectPie.parties[0] || null;
    return {
        totalParties:    projectPie.parties.length,
        totalSlices:     projectPie.totalSlices,
        leader:          leader ? leader.partyId : null,
        leaderPct:       leader ? leader.sharePctInProject : 0,
        allocatedPct:    Math.round(allocated * 100) / 100,
        unallocatedPct:  Math.round((100 - allocated) * 100) / 100,
        piesActiveCount: (projectPie.piesActive || []).length,
        piesEmptyCount:  (projectPie.piesEmpty || []).length,
    };
}
