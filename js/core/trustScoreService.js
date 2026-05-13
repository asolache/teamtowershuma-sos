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
//   { attestations:[], attestedId?, attesterDidsFilter? }
// Retorna · {
//   total, uniqueAttesters, byKind, founderEndorsements,
//   band:'none'|'low'|'mid'|'high', label, color, icon
// }
export function computeTrustScore({ attestations = [], attestedId = null, attesterDidsFilter = null } = {}) {
    let list = attestations;
    if (attestedId) {
        list = list.filter(a => a?.content?.attestedId === attestedId);
    }
    if (Array.isArray(attesterDidsFilter) && attesterDidsFilter.length) {
        const allowed = new Set(attesterDidsFilter);
        list = list.filter(a => allowed.has(a?.content?.attesterDid));
    }
    const agg = aggregateAttestations(list);
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
