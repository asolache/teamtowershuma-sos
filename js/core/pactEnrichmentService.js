// =============================================================================
// TEAMTOWERS SOS V11 — PACT ENRICHMENT SERVICE (PACT-AI sprint A)
// Ruta · /js/core/pactEnrichmentService.js
//
// Connecta el pacte de socis amb la resta del cicle SOS:
//   - project + canvas (vision · mission · values · stakeholders · north-star)
//   - tokenomics design (distribution + vesting · sync amb pact vesting)
//   - ledger entries (capital aportat · revenue · runway)
//   - roles · cohort_managers (parties candidates)
//   - attestations (trust validations per party)
//   - market_items + invoices (revenue streams · sunset metrics)
//
// Pure · zero KB · zero DOM · injectable runner per IA.
//
// PRINCIPIS · DRY (reusa serveis existents) · KISS (helpers atòmics).
// =============================================================================

import { DEFAULT_PACT_CLAUSES, mergeClauses } from './pactService.js';
import { computeBalanceSheet, computePLForPeriod } from './ledgerService.js';
import { computeIntersections, computeIkigaiCompleteness } from './ikigaiService.js';

// ─── EXTRACTORS · pure ────────────────────────────────────────────────────

// extractPartiesFromRoles · pure · pren roles + attestations i retorna parties
// candidates per al pacte. Roles cohort_manager amb attestations són els
// candidats principals.
//
// args ·
//   roles · [role nodes amb content.kind === 'cohort_manager' o similar]
//   attestations · [...] · per a trust score
//   members · [matriu_member] · per a obtenir displayName/handle
//
// Retorna · [{ identityId, displayName, handle, role, contributionType,
//              primarySkill, initialShare?, attestationCount }, ...]
export function extractPartiesFromRoles({ roles = [], attestations = [], members = [] } = {}) {
    if (!Array.isArray(roles) || roles.length === 0) return [];

    // Group attestations per attestedDid (o handle)
    const attCount = new Map();
    for (const a of attestations || []) {
        const ad = a?.content?.attestedDid;
        const ah = a?.content?.attestedHandle;
        if (ad) attCount.set(ad, (attCount.get(ad) || 0) + 1);
        if (ah) attCount.set(_norm(ah), (attCount.get(_norm(ah)) || 0) + 1);
    }

    // Index members per handle/did per a enrichment
    const memberByHandle = new Map();
    const memberByDid = new Map();
    for (const m of members || []) {
        const c = m?.content || {};
        if (c.handle) memberByHandle.set(_norm(c.handle), m);
        if (c.primaryDid) memberByDid.set(c.primaryDid, m);
    }

    // Build parties
    const parties = [];
    for (const r of roles) {
        const c = r?.content || {};
        if (!r?.id || c.kind !== 'cohort_manager') continue;
        // Identity · best-effort · prefereix handle del role · després label
        const handle = c.handle || c.createdBy || c.creatorHandle || null;
        const member = handle ? memberByHandle.get(_norm(handle)) : null;
        const displayName = member?.content?.displayName || c.label || r.id;
        const identityId = member?.content?.primaryDid || handle || r.id;
        parties.push({
            identityId,
            displayName,
            handle:           handle ? String(handle).replace(/^@/, '') : null,
            role:             c.kind,
            contributionType: 'skill-' + (c.skillDomain || 'mixed'),
            primarySkill:     c.primarySkillId || null,
            initialShare:     0,        // l'usuari ha de ajustar manualment o via slicing pie
            attestationCount: attCount.get(identityId) || attCount.get(_norm(handle || '')) || 0,
        });
    }
    return parties;
}

// extractCapitalFromLedger · pure · agrega capital aportat (equity entries) +
// runway (cash actual · expenses mes vista).
//
// args · { ledgerEntries · today? }
// Retorna · { equityRaised, cashOnHand, monthlyBurn, runwayMonths, profitYTD }
export function extractCapitalFromLedger({ ledgerEntries = [], today = null } = {}) {
    const bs = computeBalanceSheet(ledgerEntries);
    const pl = computePLForPeriod(ledgerEntries, {});

    // Equity raised · sumatori de credits a 'equity' account (positives)
    let equityRaised = 0;
    let totalExpenses = 0;
    let totalRevenue = 0;
    const earliest = ledgerEntries.reduce((min, e) => {
        const d = e?.content?.date;
        return (d && (!min || d < min)) ? d : min;
    }, null);

    for (const entry of ledgerEntries || []) {
        const legs = entry?.content?.legs || [];
        for (const leg of legs) {
            if (leg.account === 'equity' && leg.side === 'credit') equityRaised += leg.amount || 0;
            if (leg.account === 'expenses' && leg.side === 'debit') totalExpenses += leg.amount || 0;
            if (leg.account === 'revenue'  && leg.side === 'credit') totalRevenue += leg.amount || 0;
        }
    }

    // Months elapsed · per a burn-rate càlcul
    const todayStr = today || new Date().toISOString().slice(0, 10);
    let monthsElapsed = 1;
    if (earliest) {
        const t0 = new Date(earliest).getTime();
        const t1 = new Date(todayStr).getTime();
        monthsElapsed = Math.max(1, (t1 - t0) / (1000 * 60 * 60 * 24 * 30));
    }
    const monthlyBurn = Math.round((totalExpenses / monthsElapsed) * 100) / 100;
    const cashOnHand = bs.totalAssets || 0;
    const runwayMonths = (monthlyBurn > 0) ? Math.round((cashOnHand / monthlyBurn) * 10) / 10 : null;

    return {
        equityRaised:  _round2(equityRaised),
        cashOnHand:    _round2(cashOnHand),
        monthlyBurn,
        runwayMonths,
        profitYTD:     _round2(pl.profit),
        totalRevenue:  _round2(totalRevenue),
        totalExpenses: _round2(totalExpenses),
    };
}

// extractVestingFromTokenomics · pure · pren el design més recent i retorna
// el vesting agregat (cliff promig + linear promig dels grups) per a usar
// com a vesting del pacte. Sols inclou grups amb pct > 0.
//
// args · tokenomicsDesigns · [token_design nodes]
// Retorna · { cliffMonths, linearMonths, breakdown: [{groupId, cliff, linear, pct}] }
export function extractVestingFromTokenomics({ tokenomicsDesigns = [] } = {}) {
    if (!Array.isArray(tokenomicsDesigns) || tokenomicsDesigns.length === 0) {
        return { cliffMonths: 0, linearMonths: 0, breakdown: [] };
    }
    const design = tokenomicsDesigns
        .filter(d => d?.content)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
    if (!design) return { cliffMonths: 0, linearMonths: 0, breakdown: [] };

    const c = design.content;
    const dist = c.distribution || {};
    const vest = c.vesting || {};
    let totalCliff = 0;
    let totalLinear = 0;
    let totalPct = 0;
    const breakdown = [];
    for (const [gid, pct] of Object.entries(dist)) {
        if (!pct || pct <= 0) continue;
        const v = vest[gid] || { cliffMonths: 0, linearMonths: 0 };
        totalCliff  += (v.cliffMonths  || 0) * pct;
        totalLinear += (v.linearMonths || 0) * pct;
        totalPct    += pct;
        breakdown.push({ groupId: gid, cliff: v.cliffMonths || 0, linear: v.linearMonths || 0, pct });
    }
    const cliffMonths  = totalPct > 0 ? Math.round(totalCliff  / totalPct) : 0;
    const linearMonths = totalPct > 0 ? Math.round(totalLinear / totalPct) : 0;
    return { cliffMonths, linearMonths, breakdown, designId: design.id, tokenSymbol: c.symbol, totalSupply: c.totalSupply };
}

// extractSunsetMetricsFromInvoices · pure · suggereix una sunset metric
// (monthly-revenue-eur) basada en el promig dels invoices paid últim any.
//
// args · invoices · [...]
// Retorna · { metric: 'monthly-revenue-eur', below: number, basedOn: { months, count } }
export function extractSunsetMetricsFromInvoices({ invoices = [], today = null } = {}) {
    const paid = (invoices || []).filter(i => i?.content?.status === 'paid');
    if (paid.length === 0) {
        return { metric: 'monthly-revenue-eur', below: 500, basedOn: { months: 0, count: 0 } };
    }
    let totalPaid = 0;
    let earliest = null;
    for (const inv of paid) {
        const total = (inv.content?.items || []).reduce((s, it) => s + (it.total || 0), 0);
        totalPaid += total * (1 + (inv.content?.taxRate || 0));
        const d = inv.content?.issuedDate;
        if (d && (!earliest || d < earliest)) earliest = d;
    }
    const todayStr = today || new Date().toISOString().slice(0, 10);
    let months = 1;
    if (earliest) {
        const t0 = new Date(earliest).getTime();
        const t1 = new Date(todayStr).getTime();
        months = Math.max(1, (t1 - t0) / (1000 * 60 * 60 * 24 * 30));
    }
    const avgMonthly = totalPaid / months;
    // Sunset · 30% del promig (sota aquest llindar · auto-sunset)
    const below = Math.max(100, Math.round(avgMonthly * 0.3));
    return { metric: 'monthly-revenue-eur', below, basedOn: { months: Math.round(months * 10) / 10, count: paid.length, avgMonthly: _round2(avgMonthly) } };
}

// ─── ENRICHED DRAFT BUILDER ───────────────────────────────────────────────

// buildEnrichedPactDraft · pure · combina TOT el context del projecte en
// un draft de pact. NO crea el pact final · sols els arguments per a
// buildPactDraft del pactService. El consumidor crida després buildPactDraft.
//
// args ·
//   project          · project node
//   canvas           · canvas (project.content.canvas o null)
//   tokenomicsDesigns · [...]
//   ledgerEntries    · [...]
//   roles            · [...]
//   attestations     · [...]
//   members          · [...]
//   invoices         · [...]
//   marketItems      · [...]
//   ikigai           · ikigai del primary founder (opcional)
//
// Retorna · {
//   projectId,
//   parties: [...],
//   clauses: { object, capital, participation, vesting, decisions, exit,
//              conflict, sunset },
//   context: { projectName, canvasSummary, capitalSnapshot, tokenSummary,
//              sunsetSuggestion, partiesCount, ikigaiSummary },
// }
export function buildEnrichedPactDraft({
    project          = null,
    canvas           = null,
    tokenomicsDesigns = [],
    ledgerEntries    = [],
    roles            = [],
    attestations     = [],
    members          = [],
    invoices         = [],
    marketItems      = [],
    ikigai           = null,
} = {}) {
    if (!project) throw new Error('project required');
    const projectId = project.id;

    // Extract parts
    const parties = extractPartiesFromRoles({ roles, attestations, members });
    const capital = extractCapitalFromLedger({ ledgerEntries });
    const vestingFromToken = extractVestingFromTokenomics({ tokenomicsDesigns });
    const sunsetMetrics = extractSunsetMetricsFromInvoices({ invoices });

    // Canvas summary
    const c = canvas || project.content?.canvas;
    const canvasSummary = c?.steps ? {
        vision:       c.steps.vision?.value || null,
        mission:      c.steps.mission?.value || null,
        values:       c.steps.values?.value || null,
        northStar:    c.steps['north-star']?.value || null,
    } : null;

    // Ikigai summary (per primary founder)
    let ikigaiSummary = null;
    if (ikigai) {
        const completeness = computeIkigaiCompleteness(ikigai);
        if (completeness.filled > 0) {
            const intersections = computeIntersections(ikigai);
            ikigaiSummary = {
                completedAt: ikigai.completedAt,
                percent:     completeness.percent,
                center:      intersections.ikigai || [],
                passion:     intersections.passion || [],
                mission:     intersections.mission || [],
            };
        }
    }

    // Object clause · construct text default amb mission + vision
    let objectText = DEFAULT_PACT_CLAUSES.object;
    if (canvasSummary?.mission) {
        objectText = canvasSummary.mission;
    }

    // Clauses enriched
    const clauses = mergeClauses(DEFAULT_PACT_CLAUSES, {
        object: objectText,
        capital: {
            totalEur:        capital.equityRaised,
            hasInitialCash:  capital.equityRaised > 0,
            fairFractal:     true,
        },
        vesting: vestingFromToken.cliffMonths > 0 || vestingFromToken.linearMonths > 0 ? {
            months:       vestingFromToken.linearMonths || 24,
            cliffMonths:  vestingFromToken.cliffMonths || 6,
            type:         'linear',
        } : undefined,
        sunset: sunsetMetrics.basedOn.count > 0 ? {
            autoIfMetricsBelow:  { metric: sunsetMetrics.metric, below: sunsetMetrics.below },
            gracePeriodDays:     90,
        } : undefined,
    });

    return {
        projectId,
        parties,
        clauses,
        context: {
            projectName:       project.nombre || project.name || projectId,
            canvasSummary,
            capitalSnapshot:   capital,
            tokenSummary:      vestingFromToken,
            sunsetSuggestion:  sunsetMetrics,
            partiesCount:      parties.length,
            ikigaiSummary,
            marketItemsCount:  (marketItems || []).length,
            invoicesPaidCount: (invoices || []).filter(i => i?.content?.status === 'paid').length,
            attestationCount:  (attestations || []).length,
        },
    };
}

// ─── AI INTEGRATION · prompt + parse ──────────────────────────────────────

// buildAiPromptForPactClauses · pure · genera prompt per al runEscalation
// que pren l'enriched context i demana a la IA refinar les clàusules
// soft-text (object · exit · conflict · sunset rationale) en català.
//
// args · enrichedDraft · resultat de buildEnrichedPactDraft
// Retorna · string ready-to-send al runner
export function buildAiPromptForPactClauses(enrichedDraft) {
    if (!enrichedDraft || !enrichedDraft.context) throw new Error('enrichedDraft required');
    const ctx = enrichedDraft.context;
    const lines = [];
    lines.push('Ets ajudant legal cooperatiu SOS. Refina les clàusules del pacte de socis');
    lines.push('per a aquest projecte cooperatiu. Retorna JSON puro sense markdown.');
    lines.push('');
    lines.push('## Context del projecte');
    lines.push('Nom · ' + ctx.projectName);
    if (ctx.canvasSummary?.vision)    lines.push('Vision · ' + ctx.canvasSummary.vision);
    if (ctx.canvasSummary?.mission)   lines.push('Mission · ' + ctx.canvasSummary.mission);
    if (ctx.canvasSummary?.values)    lines.push('Valors · ' + ctx.canvasSummary.values);
    if (ctx.canvasSummary?.northStar) lines.push('North-star · ' + ctx.canvasSummary.northStar);
    lines.push('');
    lines.push('## Estat actual');
    lines.push('Socis candidats · ' + ctx.partiesCount);
    lines.push('Capital aportat · €' + ctx.capitalSnapshot.equityRaised);
    lines.push('Cash on hand · €' + ctx.capitalSnapshot.cashOnHand);
    if (ctx.capitalSnapshot.runwayMonths != null) {
        lines.push('Runway · ' + ctx.capitalSnapshot.runwayMonths + ' mesos');
    }
    lines.push('Revenue YTD · €' + ctx.capitalSnapshot.totalRevenue);
    lines.push('Profit YTD · €' + ctx.capitalSnapshot.profitYTD);
    if (ctx.tokenSummary.tokenSymbol) {
        lines.push('Tokenomics · ' + ctx.tokenSummary.tokenSymbol + ' · supply ' + (ctx.tokenSummary.totalSupply || 0) + ' · vesting ' + ctx.tokenSummary.cliffMonths + 'm cliff + ' + ctx.tokenSummary.linearMonths + 'm linear');
    }
    if (ctx.sunsetSuggestion?.basedOn?.count > 0) {
        lines.push('Sunset metric suggested · monthly-revenue < €' + ctx.sunsetSuggestion.below + ' (basat en ' + ctx.sunsetSuggestion.basedOn.count + ' invoices ' + ctx.sunsetSuggestion.basedOn.months + 'm)');
    }
    if (ctx.ikigaiSummary && ctx.ikigaiSummary.center.length > 0) {
        lines.push('Ikigai del primary · centre · ' + ctx.ikigaiSummary.center.join(' · '));
    }
    lines.push('');
    lines.push('## Format de resposta · JSON');
    lines.push('{');
    lines.push('  "object": "string · 80-300 chars · purpose del pacte coherent amb mission/vision",');
    lines.push('  "exitRationale": "string · com es gestiona la sortida d\'un soci · coherent amb slicing-pie",');
    lines.push('  "conflictRationale": "string · com es resolen conflictes · coherent amb valors",');
    lines.push('  "sunsetRationale": "string · justifica la metric below com a trigger d\'auto-tancament"');
    lines.push('}');
    lines.push('');
    lines.push('Estil · català · clar · concret · sense legalese · coherent amb valors cooperatius.');
    return lines.join('\n');
}

// applyAIDraftToPact · pure · pren raw text · parse JSON · aplica els camps
// soft-text al enrichedDraft. Si parse falla · retorna enrichedDraft sense
// canvis + error.
export function applyAIDraftToPact(enrichedDraft, rawText) {
    if (!enrichedDraft) throw new Error('enrichedDraft required');
    if (!rawText || typeof rawText !== 'string') {
        return { enrichedDraft, applied: false, error: 'empty-output' };
    }
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    }
    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch (e) { return { enrichedDraft, applied: false, error: 'parse-failed · ' + e.message }; }

    const next = {
        ...enrichedDraft,
        clauses: {
            ...enrichedDraft.clauses,
            object: (typeof parsed.object === 'string' && parsed.object.length >= 20) ? parsed.object : enrichedDraft.clauses.object,
        },
        aiNotes: {
            exitRationale:     typeof parsed.exitRationale === 'string' ? parsed.exitRationale : null,
            conflictRationale: typeof parsed.conflictRationale === 'string' ? parsed.conflictRationale : null,
            sunsetRationale:   typeof parsed.sunsetRationale === 'string' ? parsed.sunsetRationale : null,
            generatedAt:       new Date().toISOString(),
        },
    };
    return { enrichedDraft: next, applied: true, error: null };
}

// ─── INTERNAL HELPERS ─────────────────────────────────────────────────────

function _norm(s) { return String(s || '').toLowerCase().replace(/^@/, '').trim(); }
function _round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
