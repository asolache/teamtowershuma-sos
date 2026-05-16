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

// =============================================================================
// SPRINT B · extractValueContributionsPerParty
// =============================================================================
// Per a CADA party (cohort_manager role identificat) · agrega TOT el valor
// aportat al projecte des de múltiples fonts · permet pact body super
// detallat amb justificacions slicing-pie real. Pure.
//
// args ·
//   parties        · sortida de extractPartiesFromRoles (han de tenir identityId+handle)
//   members        · [matriu_member] (skills declarats · ikigai)
//   workOrders     · [work_order nodes] (per assignment hours/value)
//   sops           · [sop nodes] (created)
//   proposals      · [proposal nodes] (acceptades · revenue brought)
//   invoices       · [invoice nodes] (paid · revenue earned)
//   marketItems    · [market_item nodes] (offered)
//   attestations   · [attestation nodes] (rebudes per party)
//   ikigai (opt)   · { handle: ikigaiNode } map · per Ikigai alignment
//
// Retorna · {
//   [identityId]: {
//     handle,
//     skillsDeclared:      [...],
//     ikigai:              { hasIkigai, completePercent, centerCount },
//     workOrdersCompleted: { count, hoursEstimated, valueEur },
//     sopsAuthored:        { count, sellableCount },
//     marketOfferings:     { count, byKind },
//     proposalsContributed:{ count, acceptedEur },
//     invoicesIssued:      { count, paidEur, pendingEur },
//     attestationsReceived: { count, byKind },
//     trustScore,
//     valuePointsRaw:      number (heurística · ordena slicing-pie)
//   }
// }
export function extractValueContributionsPerParty({
    parties      = [],
    members      = [],
    workOrders   = [],
    sops         = [],
    proposals    = [],
    invoices     = [],
    marketItems  = [],
    attestations = [],
    ikigai       = {},
} = {}) {
    if (!Array.isArray(parties) || parties.length === 0) return {};

    // Index members per handle
    const memberByHandle = new Map();
    for (const m of members || []) {
        const h = _norm(m?.content?.handle);
        if (h) memberByHandle.set(h, m);
    }

    const result = {};
    for (const p of parties) {
        const handleKey = _norm(p.handle || '');
        const member = memberByHandle.get(handleKey);

        // Skills declarats al member
        const skillsDeclared = (member?.content?.skillsDeclared || []).slice();

        // Ikigai summary si existeix
        const ikiNode = ikigai[handleKey] || member?.content?.ikigai || null;
        let ikiSummary = { hasIkigai: false, completePercent: 0, centerCount: 0 };
        if (ikiNode?.dimensions) {
            const filled = Object.values(ikiNode.dimensions).filter(d => (d?.items || []).length > 0).length;
            const total = Object.keys(ikiNode.dimensions).length || 4;
            const intersections = ikiNode.completedAt ? 4 : filled;     // simple proxy
            ikiSummary = {
                hasIkigai:       filled > 0,
                completePercent: Math.round((filled / total) * 100),
                centerCount:     intersections >= 4 ? 1 : 0,
            };
        }

        // WO completed · assigned to handle
        let woCount = 0, woHours = 0, woValueEur = 0;
        for (const wo of workOrders || []) {
            const c = wo?.content || {};
            const assigned = _norm(c.assignedTo || c.createdBy || '');
            if (assigned !== handleKey) continue;
            if (c.status === 'completed' || c.status === 'done' || c.status === 'closed') {
                woCount++;
                woHours += (typeof c.estimatedHours === 'number' ? c.estimatedHours : 0);
                woValueEur += (typeof c.deliveredValueEur === 'number' ? c.deliveredValueEur : 0);
            }
        }

        // SOPs authored · createdBy
        let sopsCount = 0, sopsSellable = 0;
        for (const s of sops || []) {
            const c = s?.content || {};
            if (_norm(c.createdBy) !== handleKey) continue;
            sopsCount++;
            if (c.marketSellable === true) sopsSellable++;
        }

        // Market offerings · providerHandle / createdBy
        let marketCount = 0;
        const marketByKind = {};
        for (const m of marketItems || []) {
            const c = m?.content || {};
            const ph = _norm(c.providerHandle || c.createdBy || '');
            if (ph !== handleKey) continue;
            marketCount++;
            const k = c.kind || 'product';
            marketByKind[k] = (marketByKind[k] || 0) + 1;
        }

        // Proposals contributed · createdBy o assignedTo · accepted total
        let propCount = 0, propAcceptedEur = 0;
        for (const pr of proposals || []) {
            const c = pr?.content || {};
            const author = _norm(c.createdBy || c.authorHandle || '');
            if (author !== handleKey) continue;
            propCount++;
            if (c.status === 'accepted') {
                propAcceptedEur += (c.pricing?.total || 0);
            }
        }

        // Invoices issued (per aquest soci) · paid + pending
        let invCount = 0, invPaidEur = 0, invPendingEur = 0;
        for (const inv of invoices || []) {
            const c = inv?.content || {};
            const issuer = _norm(c.issuedBy || c.createdBy || '');
            if (issuer !== handleKey) continue;
            invCount++;
            const totals = (c.items || []).reduce((s, it) => s + (it.total || 0), 0) * (1 + (c.taxRate || 0));
            if (c.status === 'paid') invPaidEur += totals;
            else if (c.status === 'sent' || c.status === 'draft') invPendingEur += totals;
        }

        // Attestations rebudes
        let attCount = 0;
        const attByKind = {};
        for (const a of attestations || []) {
            const ac = a?.content || {};
            if (ac.attestedDid !== p.identityId && _norm(ac.attestedHandle) !== handleKey) continue;
            attCount++;
            const k = ac.attestationKind || 'unknown';
            attByKind[k] = (attByKind[k] || 0) + 1;
        }

        // Value points · heurística per a slicing-pie ordering
        // Weights · WO completed (3 per WO + hores·1) + SOPs (2) + market (1) +
        //          proposals accepted (5 + €/1000) + invoices paid (€/500) +
        //          attestations (1.5 · founder kind 3)
        let valuePoints = 0;
        valuePoints += woCount * 3 + woHours * 1;
        valuePoints += sopsCount * 2 + sopsSellable * 1;
        valuePoints += marketCount * 1;
        valuePoints += propCount * 5 + (propAcceptedEur / 1000);
        valuePoints += (invPaidEur / 500);
        valuePoints += attCount * 1.5;
        for (const [k, n] of Object.entries(attByKind)) {
            if (k === 'endorses-founder') valuePoints += n * 1.5;
        }
        valuePoints = _round2(valuePoints);

        result[p.identityId] = {
            handle:               p.handle,
            skillsDeclared,
            ikigai:               ikiSummary,
            workOrdersCompleted:  { count: woCount, hoursEstimated: woHours, valueEur: _round2(woValueEur) },
            sopsAuthored:         { count: sopsCount, sellableCount: sopsSellable },
            marketOfferings:      { count: marketCount, byKind: marketByKind },
            proposalsContributed: { count: propCount, acceptedEur: _round2(propAcceptedEur) },
            invoicesIssued:       { count: invCount, paidEur: _round2(invPaidEur), pendingEur: _round2(invPendingEur) },
            attestationsReceived: { count: attCount, byKind: attByKind },
            trustScore:           p.attestationCount || 0,
            valuePointsRaw:       valuePoints,
        };
    }
    return result;
}

// suggestSlicingPieShares · pure · normalitza valuePointsRaw a percentages
// que sumen 1.0 · servirà com a suggerència inicial pels initialShare
// d'aquest pacte. NO sobreescriu res · sols proposa.
//
// args · contributionsMap (sortida de extractValueContributionsPerParty)
// Retorna · { [identityId]: { share, valuePoints } } amb shares ∈ [0, 1] · sum = 1
export function suggestSlicingPieShares(contributionsMap = {}) {
    const entries = Object.entries(contributionsMap || {});
    if (entries.length === 0) return {};
    const total = entries.reduce((s, [, c]) => s + (c.valuePointsRaw || 0), 0);
    const out = {};
    if (total === 0) {
        // No data · equal share
        const equal = 1 / entries.length;
        for (const [id, c] of entries) out[id] = { share: _round2(equal * 10000) / 10000, valuePoints: 0 };
        return out;
    }
    for (const [id, c] of entries) {
        out[id] = {
            share:        Math.round((c.valuePointsRaw / total) * 10000) / 10000,
            valuePoints:  c.valuePointsRaw || 0,
        };
    }
    return out;
}

// =============================================================================
// SPRINT B · permaweb-publishable docs catalog
// =============================================================================
// Inventariar TOT el que podem publicar al permaweb des d'un projecte. La
// UI ho pot usar per a un "Publica tot" / "Selecciona què compartir" wizard.
//
// args · totes les colleccions del KB filtrades per projectId
// Retorna · [{ kind, label, count, items, defaultVisibility, signed }, ...]
export function extractDocsForPermaweb({
    project       = null,
    canvas        = null,
    pitches       = [],
    tokenomicsDesigns = [],
    attestations  = [],
    invoices      = [],
    ledgerEntries = [],
    proposals     = [],
    workshops     = [],
    sops          = [],
    marketItems   = [],
    pacts         = [],
    cycles        = [],     // improvement_cycle
    swarmRuns     = [],     // swarm_flow_run
    ikigais       = [],
    pathBundles   = [],     // neural_path_bundle
} = {}) {
    const cat = [];
    const _signedIfHas = (arr) => (arr || []).filter(x => x?.content?.signature || x?.content?.publishedAt).length;

    // 1. Project itself
    if (project) {
        cat.push({
            kind: 'project', label: 'Project node', count: 1, items: [project.id],
            defaultVisibility: 'opt-in', signed: 1, useCase: 'Federation discovery',
        });
    }
    // 2. Canvas snapshot
    if (canvas?.steps) {
        const filledSteps = Object.values(canvas.steps).filter(s => (s?.value || '').length > 0).length;
        cat.push({
            kind: 'canvas_snapshot', label: 'Canvas (vision/mission/values)', count: 1,
            items: ['embedded in project'], defaultVisibility: 'opt-in',
            signed: filledSteps >= 3 ? 1 : 0, useCase: 'Vision lineage public', completion: filledSteps,
        });
    }
    // 3. Pitches publicats
    cat.push({
        kind: 'project_pitch', label: 'Pitches públics', count: pitches.length,
        items: pitches.map(p => p.id),
        defaultVisibility: 'public', signed: _signedIfHas(pitches), useCase: 'OG share viral',
    });
    // 4. Tokenomics
    cat.push({
        kind: 'token_design', label: 'Token designs', count: tokenomicsDesigns.length,
        items: tokenomicsDesigns.map(t => t.id),
        defaultVisibility: 'public', signed: 0, useCase: 'Token discovery',
    });
    // 5. Pacts
    cat.push({
        kind: 'pact', label: 'Pactes signats', count: pacts.length,
        items: pacts.map(p => p.id), defaultVisibility: 'opt-in',
        signed: pacts.filter(p => p?.content?.signatures?.length > 0).length,
        useCase: 'Legal lineage',
    });
    // 6. Attestations
    cat.push({
        kind: 'attestation', label: 'Attestations', count: attestations.length,
        items: [], defaultVisibility: 'public',
        signed: attestations.filter(a => a?.content?.signature).length,
        useCase: 'Trust graph',
    });
    // 7. Invoices (sols audit-trail · privacy clients)
    cat.push({
        kind: 'invoice', label: 'Factures', count: invoices.length, items: [],
        defaultVisibility: 'opt-in', signed: invoices.filter(i => i?.content?.paymentProof).length,
        useCase: 'Audit trail · clients sensibles',
    });
    // 8. Ledger entries snapshots
    cat.push({
        kind: 'ledger_snapshot_monthly', label: 'Snapshots ledger mensuals', count: ledgerEntries.length > 0 ? 1 : 0,
        items: [], defaultVisibility: 'opt-in', signed: 0,
        useCase: 'Transparency dashboards', note: 'Aggregat · no entries individuals',
    });
    // 9. Proposals
    cat.push({
        kind: 'proposal', label: 'Propostes', count: proposals.length, items: [],
        defaultVisibility: 'opt-in', signed: proposals.filter(p => p?.content?.signedAt).length,
        useCase: 'Win-rate audit',
    });
    // 10. Workshops
    cat.push({
        kind: 'workshop', label: 'Workshops', count: workshops.length,
        items: workshops.map(w => w.id), defaultVisibility: 'public',
        signed: 0, useCase: 'Education catalog',
    });
    // 11. SOPs sellable
    const sellableSops = (sops || []).filter(s => s?.content?.marketSellable === true);
    cat.push({
        kind: 'sop', label: 'SOPs (sols sellable)', count: sellableSops.length,
        items: sellableSops.map(s => s.id), defaultVisibility: 'opt-in',
        signed: sellableSops.filter(s => s?.content?.signature).length,
        useCase: 'Practice sharing',
    });
    // 12. Market items
    cat.push({
        kind: 'market_item', label: 'Market items', count: marketItems.length,
        items: marketItems.map(m => m.id), defaultVisibility: 'public', signed: 0,
        useCase: 'Cross-network sales',
    });
    // 13. Ikigai snapshots
    cat.push({
        kind: 'ikigai_snapshot', label: 'Ikigai snapshots (opt-in)', count: ikigais.length,
        items: [], defaultVisibility: 'opt-in', signed: 0,
        useCase: 'Personal lineage · privacy',
    });
    // 14. Improvement cycles
    cat.push({
        kind: 'improvement_cycle', label: 'Improvement cycle runs', count: cycles.length,
        items: [], defaultVisibility: 'opt-in', signed: 0,
        useCase: 'Learning lineage',
    });
    // 15. Swarm runs
    cat.push({
        kind: 'swarm_flow_run', label: 'Swarm flow runs', count: swarmRuns.length,
        items: [], defaultVisibility: 'opt-in', signed: 0,
        useCase: 'Process audit',
    });
    // 16. Path bundles (CV nodal)
    cat.push({
        kind: 'neural_path_bundle', label: 'CV nodals', count: pathBundles.length,
        items: [], defaultVisibility: 'public', signed: pathBundles.filter(b => b?.content?.signature).length,
        useCase: 'Public CV nodal',
    });

    // Compute totals
    const totals = cat.reduce((acc, c) => {
        acc.totalItems += c.count;
        acc.totalSigned += c.signed || 0;
        return acc;
    }, { totalItems: 0, totalSigned: 0 });

    return {
        catalog: cat,
        totals,
    };
}

