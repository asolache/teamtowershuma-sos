// =============================================================================
// TEAMTOWERS SOS V11 — BILLING SERVICE (BIZ-MODEL-001 sprint B)
//
// Service pur · calcula marges SOS sobre consum.
//
// Filosofia · saldo prepagat com a unitat principal de billing · subscripció
// = premium UX (no paywall). Marge mig 5-10% sobre consum · cobreix costos
// plataforma + reinverteix a desenvolupament. Veure docs/backlog.md
// BIZ-MODEL-001 per detalls.
//
// Per cada consum, el wallet del projecte (o personal) descompta:
//   totalEur = baseCostEur * (1 + marginPct/100)
// Un moviment cost (-baseCostEur) + un moviment margin (-marginEur) ·
// transparència total · l'usuari veu exactament quant paga al provider
// vs quant a SOS.
// =============================================================================

// Catàleg de marges per tipus de consum · congelat · valors per defecte
// pre-alfa pública. Configurables a /settings sprint C futur.
export const MARGINS_BY_KIND = Object.freeze({
    // IA · 5% sobre cost real provider (Anthropic/OpenAI/Gemini/DeepSeek/Minimax)
    ai:               5.0,
    // Permaweb · 0% sprint A (Turbo Credits raw price) · 10% futur quan
    // SOS compri Credits a l'engros i revengui
    permaweb:         0.0,
    // Gnosis tx · 5% gas inclòs (cobreix la fee real del relayer)
    'gnosis-tx':      5.0,
    // Workshop unlock · 0% del SOS · el split 70/20/10 (creator/project/cohort)
    // ja s'aplica a workshopRevenueService (WORKSHOPS-FED-001 sprint D)
    'workshop-unlock':0.0,
    // Stripe topup · 0% intern (la fee Stripe l'absorbeix l'usuari al pagar
    // l'amount marcat al Payment Link · el net rebut = el que entra al wallet)
    'stripe-topup':   0.0,
    // Default · qualsevol consum no categoritzat · 0% (defensive)
    default:          0.0,
});

// MARGIN_KINDS · array exportat per inspecció a UI (settings / efficiency)
export const MARGIN_KINDS = Object.freeze(Object.keys(MARGINS_BY_KIND));

// applyMargin · pur · {baseCostEur, kind} → {baseCostEur, marginEur, totalEur, marginPct, kind}
//   Si el `kind` no és reconegut, fallback a 0% (zero marge · pas-through).
//   Tots els valors retornats arrodonits a 6 decimals (precisió EUR fins
//   1 millonèssima · suficient per a IA token-level billing).
export function applyMargin({ baseCostEur = 0, kind = 'default' } = {}) {
    if (typeof baseCostEur !== 'number' || baseCostEur < 0) {
        throw new Error('applyMargin · baseCostEur must be non-negative number');
    }
    const marginPct = MARGINS_BY_KIND[kind] !== undefined
        ? MARGINS_BY_KIND[kind]
        : MARGINS_BY_KIND.default;
    const marginEur = Number((baseCostEur * marginPct / 100).toFixed(6));
    const totalEur  = Number((baseCostEur + marginEur).toFixed(6));
    return {
        kind,
        baseCostEur: Number(baseCostEur.toFixed(6)),
        marginPct,
        marginEur,
        totalEur,
    };
}

// summarizeMargins · pur · accepta array de moviments amb { kind, baseCostEur }
// i retorna agregat per kind. Útil per a /efficiency dashboard tab "Marges".
export function summarizeMargins(movements = []) {
    const acc = {};
    let totalBase = 0, totalMargin = 0, totalGross = 0;
    for (const m of movements) {
        const kind = m && m.kind ? m.kind : 'default';
        const baseCost = typeof m?.baseCostEur === 'number' ? m.baseCostEur : 0;
        const calc = applyMargin({ baseCostEur: baseCost, kind });
        if (!acc[kind]) acc[kind] = { count: 0, baseEur: 0, marginEur: 0, totalEur: 0, marginPct: calc.marginPct };
        acc[kind].count += 1;
        acc[kind].baseEur   = Number((acc[kind].baseEur   + calc.baseCostEur).toFixed(6));
        acc[kind].marginEur = Number((acc[kind].marginEur + calc.marginEur).toFixed(6));
        acc[kind].totalEur  = Number((acc[kind].totalEur  + calc.totalEur).toFixed(6));
        totalBase   += calc.baseCostEur;
        totalMargin += calc.marginEur;
        totalGross  += calc.totalEur;
    }
    return {
        byKind: acc,
        totalBaseEur:   Number(totalBase.toFixed(6)),
        totalMarginEur: Number(totalMargin.toFixed(6)),
        totalGrossEur:  Number(totalGross.toFixed(6)),
        effectiveMarginPct: totalBase > 0
            ? Number((totalMargin / totalBase * 100).toFixed(2))
            : 0,
    };
}

// setMarginForKind · permet sobreescriure el marge per `kind` en runtime
// (defensiu · només per a tests o /settings sprint C). Modifica una còpia
// mutable interna · el catàleg congelat MARGINS_BY_KIND segueix com a default.
let _overrides = {};
export function setMarginForKind(kind, pct) {
    if (typeof kind !== 'string' || typeof pct !== 'number' || pct < 0) {
        throw new Error('setMarginForKind · kind+pct (>=0) required');
    }
    _overrides[kind] = pct;
}
export function clearMarginOverrides() { _overrides = {}; }
export function getEffectiveMarginPct(kind) {
    if (_overrides[kind] !== undefined) return _overrides[kind];
    return MARGINS_BY_KIND[kind] !== undefined ? MARGINS_BY_KIND[kind] : MARGINS_BY_KIND.default;
}
// applyMarginWithOverride · usa el override · útil quan el caller vol
// respectar config de /settings sense haver de saber-ho.
export function applyMarginWithOverride({ baseCostEur = 0, kind = 'default' } = {}) {
    const pct = getEffectiveMarginPct(kind);
    if (typeof baseCostEur !== 'number' || baseCostEur < 0) {
        throw new Error('applyMarginWithOverride · baseCostEur must be non-negative number');
    }
    const marginEur = Number((baseCostEur * pct / 100).toFixed(6));
    const totalEur  = Number((baseCostEur + marginEur).toFixed(6));
    return { kind, baseCostEur: Number(baseCostEur.toFixed(6)), marginPct: pct, marginEur, totalEur };
}
