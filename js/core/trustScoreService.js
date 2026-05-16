// =============================================================================
// TEAMTOWERS SOS V11 — TRUST SCORE SERVICE (TRUST-001 sprint A)
//
// Trust score weighted basat en attestations (endorses-founder · cohort-member
// · endorses-operator · workshop-quality). Pure layer sobre attestationService
// que afegeix · banding (low/mid/high) · color codes · HTML badges per a UI.
//
// Filosofia · trust score és pure-data · derivat directament dels nodes
// attestation. NO és un score absolut · és relatiu al nombre i pes de les
// endorsements. Es recalcula a cada lectura · evita stale state.
//
// Bandes (sprint A · simple linear):
//   none     · 0 attestations
//   low      · 1 attestation (1-2 pts)
//   mid      · 2-3 attestations (3-5 pts)
//   high     · 4+ attestations (≥6 pts) OR ≥1 founder endorsement
//
// Sprint B+ · PageRank style · weight d'un attester depèn del seu propi
// trust score (recursive). Per ara · binary weight basat en kind.
// =============================================================================

import { aggregateAttestations } from './attestationService.js';

// computeTrustScore · pure · prima del aggregateAttestations
//   { attestations:[], attestedId?, attesterDidsFilter?, attesterWeights? }
// Retorna · {
//   total, uniqueAttesters, byKind, founderEndorsements,
//   band:'none'|'low'|'mid'|'high', label, color, icon
// }
//
// TRUST-002 sprint B · `attesterWeights` (Map<did,score>) opcional · si es
// proveeix, cada attester contribueix `kindWeight × attesterWeights.get(did)`
// en lloc del flat kindWeight clàssic. Habilita PageRank-style scoring ·
// vegis computeRecursiveTrustScores.
export function computeTrustScore({
    attestations       = [],
    attestedId         = null,
    attesterDidsFilter = null,
    attesterWeights    = null,
} = {}) {
    let list = attestations;
    if (attestedId) {
        list = list.filter(a => a?.content?.attestedId === attestedId);
    }
    if (Array.isArray(attesterDidsFilter) && attesterDidsFilter.length) {
        const allowed = new Set(attesterDidsFilter);
        list = list.filter(a => allowed.has(a?.content?.attesterDid));
    }
    const agg = (attesterWeights && (attesterWeights instanceof Map))
        ? _aggregateWeighted(list, attesterWeights)
        : aggregateAttestations(list);
    const band = _bandFor(agg);
    return {
        total:             agg.totalScore,
        uniqueAttesters:   agg.uniqueAttesters,
        byKind:            agg.byKind,
        founderEndorsements: agg.founderEndorsements,
        band:              band.id,
        label:             band.label,
        color:             band.color,
        icon:              band.icon,
        recursive:         !!attesterWeights,
    };
}

// _aggregateWeighted · variant de aggregateAttestations on cada attester
// es pondera amb el seu propi pagerank-style score (passat via Map).
// Reusa la mateixa lògica de kindWeight + dedup per did, sols multiplica.
function _aggregateWeighted(attestations, attesterWeights) {
    const byAttester = new Map();   // did → maxWeightContributed (després de ponderar)
    const byKind = {};
    let founderEndorsements = 0;
    for (const a of attestations) {
        if (!a || !a.content) continue;
        if (a._verified === false) continue;
        const c = a.content;
        const did = c.attesterDid;
        if (!did) continue;
        const kind = c.attestationKind;
        const baseKind = (kind === 'endorses-founder') ? 3
                       : (kind === 'cohort-member')   ? 1.5
                       : 1;
        const attesterRank = Number(attesterWeights.get(did) ?? 1);
        const weight = baseKind * attesterRank;
        if (!byAttester.has(did) || byAttester.get(did) < weight) {
            byAttester.set(did, weight);
        }
        byKind[kind] = (byKind[kind] || 0) + 1;
        if (kind === 'endorses-founder') founderEndorsements++;
    }
    let totalScore = 0;
    for (const w of byAttester.values()) totalScore += w;
    return {
        uniqueAttesters: byAttester.size,
        totalScore:      Number(totalScore.toFixed(3)),
        byKind,
        founderEndorsements,
    };
}

// =============================================================================
// TRUST-002 sprint B · TRUST PAGERANK
//
// Score recursiu · power user endorsement val més que un new user. L'algorisme
// és PageRank adaptat al web of trust:
//
//   score[v] = (1−d) · baseScore + d · Σ_(u→v) weight(u,v) · score[u] / outW(u)
//
// On ·
//   d        · damping factor (default 0.85 · clàssic PageRank)
//   baseScore · valor de partida per a tots els nodes (default 1.0)
//   weight(u,v) · kindWeight de l'attestation u→v (1 · 1.5 · 3)
//   outW(u)   · suma de weights de tots els out-edges de u (normalització)
//
// Iteració fins a |Δmax| < epsilon (default 1e-4) o iterations màx (default 30).
// Retorna · { scores:Map<id,score>, iterationsRun, converged, finalDelta }
//
// Nota · `id` pot ser tant un attesterDid com un attestedId. El score d'un
// attester és el que el converteix en "power user" · el score d'un attested
// és el que es mostraria a la UI (computeTrustScore reusant attesterWeights).
// =============================================================================
export function computeRecursiveTrustScores({
    attestations = [],
    iterations   = 30,
    damping      = 0.85,
    epsilon      = 1e-4,
    baseScore    = 1.0,
} = {}) {
    if (!Array.isArray(attestations) || attestations.length === 0) {
        return { scores: new Map(), iterationsRun: 0, converged: true, finalDelta: 0 };
    }
    // 1. Build adjacency · in-edges per attestedId + out-DEGREE per attester
    //    (count distinct out-targets · NO weight sum) · així founder-weight
    //    no es cancel·la per la normalització. Per a un attester amb K
    //    endorsements de pesos w1..wK · cada recipient v rep `w(u,v) × score[u] / K`
    //    (no `/ Σwi`). Resultat · pesos kind (1 · 1.5 · 3) modulen la contribució real.
    const inEdges  = new Map();   // attestedId → [{ attesterDid, w }]
    const outDeg   = new Map();   // attesterDid → count of distinct out-targets
    const seenEdge = new Set();   // dedupe (u,v) duplicats
    const allIds   = new Set();
    for (const a of attestations) {
        if (!a || !a.content) continue;
        if (a._verified === false) continue;
        const c = a.content;
        const u = c.attesterDid;
        const v = c.attestedId;
        if (!u || !v || u === v) continue;
        const edgeKey = u + '→' + v;
        const isFirstEdge = !seenEdge.has(edgeKey);
        seenEdge.add(edgeKey);
        const kind = c.attestationKind;
        const w = (kind === 'endorses-founder') ? 3
                : (kind === 'cohort-member')   ? 1.5
                : 1;
        if (!inEdges.has(v)) inEdges.set(v, []);
        inEdges.get(v).push({ from: u, w });
        if (isFirstEdge) outDeg.set(u, (outDeg.get(u) || 0) + 1);
        allIds.add(u);
        allIds.add(v);
    }
    if (allIds.size === 0) {
        return { scores: new Map(), iterationsRun: 0, converged: true, finalDelta: 0 };
    }
    // 2. Init · tothom amb baseScore
    let scores = new Map();
    for (const id of allIds) scores.set(id, baseScore);
    // 3. Itera · normalitza per out-DEGREE (count) · founder weight (3x) survives
    let iterationsRun = 0;
    let finalDelta = Infinity;
    let converged = false;
    const teleport = (1 - damping) * baseScore;
    for (let it = 0; it < iterations; it++) {
        const next = new Map();
        let maxDelta = 0;
        for (const v of allIds) {
            let contrib = 0;
            const ins = inEdges.get(v) || [];
            for (const { from: u, w } of ins) {
                const su = scores.get(u) || baseScore;
                const ou = outDeg.get(u) || 1;
                contrib += w * su / ou;
            }
            const newScore = teleport + damping * contrib;
            next.set(v, newScore);
            const d = Math.abs(newScore - (scores.get(v) || baseScore));
            if (d > maxDelta) maxDelta = d;
        }
        scores = next;
        iterationsRun = it + 1;
        finalDelta = maxDelta;
        if (maxDelta < epsilon) { converged = true; break; }
    }
    // 4. Round per a estabilitat numèrica
    const rounded = new Map();
    for (const [id, s] of scores) rounded.set(id, Number(s.toFixed(4)));
    return { scores: rounded, iterationsRun, converged, finalDelta: Number(finalDelta.toFixed(6)) };
}

// computeRecursiveTrustForBatch · async · helper · 1 query al KB +
// computeRecursiveTrustScores + applyem els weights a cada attestedId
// objectiu. Optimitzat per a UI grids.
export async function computeRecursiveTrustForBatch({ kb, attestedIds = [], options = {} } = {}) {
    if (!kb) throw new Error('computeRecursiveTrustForBatch requires kb');
    if (!Array.isArray(attestedIds) || attestedIds.length === 0) return {};
    let all = [];
    try { all = await kb.query({ type: 'attestation' }); }
    catch (_) { return {}; }
    const recursive = computeRecursiveTrustScores({ attestations: all, ...(options || {}) });
    const result = {};
    for (const id of attestedIds) {
        const subset = all.filter(a => a?.content?.attestedId === id);
        result[id] = computeTrustScore({
            attestations:   subset,
            attesterWeights: recursive.scores,
        });
    }
    result.__meta = {
        iterationsRun: recursive.iterationsRun,
        converged:     recursive.converged,
        finalDelta:    recursive.finalDelta,
        attesterCount: recursive.scores.size,
    };
    return result;
}

// =============================================================================
// WEBOF-TRUST sprint A · buildTrustPanelData
//
// Pure helper · prepara les dades per al panell "🤝 Web of Trust" del
// detail view (NodeView). El render és UI · aquí sols agreguem els numbers ·
// així podem testejar sense DOM.
//
// args ·
//   attestations · TOTES les attestations del KB (per a recursive accuracy)
//   nodeId       · id del node target
//   projectId    · projectId opcional · si el node forma part d'un projecte
//                  també incloem attestations al propi projecte
//   options      · forwarded a computeRecursiveTrustScores
//
// Retorna · {
//   aggregate:    { total, uniqueAttesters, band, color, icon, recursive:true },
//   attesters:    [{ did, handle, kind, statement, issuedAt, kindWeight,
//                    pagerank }, ...],
//   recursive:    { iterationsRun, converged, finalDelta, attesterCount },
//   relevant:     [{ ...attestation }],   // les attestations filtered
// }
// =============================================================================
export function buildTrustPanelData({
    attestations = [],
    nodeId       = null,
    projectId    = null,
    options      = {},
} = {}) {
    if (!nodeId) {
        return {
            aggregate: { total: 0, uniqueAttesters: 0, band: 'none', recursive: false },
            attesters: [],
            recursive: { iterationsRun: 0, converged: true, finalDelta: 0, attesterCount: 0 },
            relevant:  [],
        };
    }
    const all = Array.isArray(attestations) ? attestations : [];

    // 1. Recursive scores sobre TOT el grafo (no només les del node) ·
    //    així els attesters externs també contribueixen a la PageRank
    const rec = computeRecursiveTrustScores({ attestations: all, ...(options || {}) });

    // 2. Filtra attestations rellevants per a aquest node (o el seu project)
    const relevant = all.filter(a => {
        const aid = a?.content?.attestedId;
        return aid === nodeId || (projectId && aid === projectId);
    });

    // 3. Agregat amb attesterWeights (recursive · power user val més)
    const aggregate = computeTrustScore({ attestations: relevant, attesterWeights: rec.scores });

    // 4. Llista d'attesters · enriquits amb el seu PR + kindWeight
    const seen = new Set();
    const attesters = [];
    for (const a of relevant) {
        const c = a.content || {};
        const did = c.attesterDid;
        if (!did || seen.has(did)) continue;
        seen.add(did);
        const kind = c.attestationKind || '?';
        const kindWeight = (kind === 'endorses-founder') ? 3 : (kind === 'cohort-member') ? 1.5 : 1;
        attesters.push({
            did,
            handle:    c.attesterHandle || null,
            kind,
            statement: c.statement || null,
            issuedAt:  c.issuedAt || null,
            kindWeight,
            pagerank:  Number(rec.scores.get(did) ?? 0),
        });
    }
    attesters.sort((a, b) => b.pagerank - a.pagerank);

    return {
        aggregate,
        attesters,
        recursive: {
            iterationsRun: rec.iterationsRun,
            converged:     rec.converged,
            finalDelta:    rec.finalDelta,
            attesterCount: rec.scores.size,
        },
        relevant,
    };
}

function _bandFor(agg) {
    const n = agg.uniqueAttesters;
    const score = agg.totalScore;
    if (n === 0) return { id: 'none', label: 'sense endorsements', color: '#94a3b8', icon: '·' };
    if (agg.founderEndorsements >= 1 || score >= 6) {
        return { id: 'high', label: 'high trust', color: '#22c55e', icon: '★' };
    }
    if (n >= 2 || score >= 3) {
        return { id: 'mid', label: 'mid trust', color: '#facc15', icon: '✦' };
    }
    return { id: 'low', label: 'low trust', color: '#3b82f6', icon: '✓' };
}

// renderTrustBadgeHtml · pure · genera HTML per a injectar a una card
// Compact mode default · inline-flex · 1 línia · clipped 24px height
export function renderTrustBadgeHtml(score, { compact = true } = {}) {
    if (!score) return '';
    const tooltip = `Trust · ${score.uniqueAttesters} attester${score.uniqueAttesters === 1 ? '' : 's'} · ${score.total} pts · ${score.founderEndorsements} founder endorsement${score.founderEndorsements === 1 ? '' : 's'}`;
    if (compact) {
        return `<span title="${_esc(tooltip)}" style="display:inline-flex;align-items:center;gap:3px;padding:1px 7px;border-radius:999px;background:${score.color}25;color:${score.color};border:1px solid ${score.color}50;font-size:10px;font-weight:700;">${_esc(score.icon)} ${score.total.toFixed(1)}</span>`;
    }
    return `<div title="${_esc(tooltip)}" style="display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;background:${score.color}18;color:${score.color};border:1px solid ${score.color}40;font-size:12px;font-weight:700;">
        <span style="font-size:14px;">${_esc(score.icon)}</span>
        <span>${score.total.toFixed(1)} pts</span>
        <span style="opacity:0.7;font-size:10px;">${_esc(score.label)}</span>
    </div>`;
}

function _esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
}

// loadAttestationsForIds · async · helper · llegeix attestations del KB
// per a un conjunt de attestedIds en una sola query + filter local
export async function loadAttestationsForIds({ kb, attestedIds = [] } = {}) {
    if (!kb) throw new Error('loadAttestationsForIds requires kb');
    if (!Array.isArray(attestedIds) || attestedIds.length === 0) return {};
    let all = [];
    try { all = await kb.query({ type: 'attestation' }); }
    catch (_) { return {}; }
    const out = {};
    const allowed = new Set(attestedIds);
    for (const a of (all || [])) {
        const id = a?.content?.attestedId;
        if (id && allowed.has(id)) {
            if (!out[id]) out[id] = [];
            out[id].push(a);
        }
    }
    return out;
}

// computeTrustForBatch · async · pure · score per a múltiples attestedIds
// Optimitzat per a UI grids · 1 query · N computes
export async function computeTrustForBatch({ kb, attestedIds } = {}) {
    const byId = await loadAttestationsForIds({ kb, attestedIds });
    const result = {};
    for (const id of attestedIds) {
        const list = byId[id] || [];
        result[id] = computeTrustScore({ attestations: list });
    }
    return result;
}
