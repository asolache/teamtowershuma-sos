// =============================================================================
// TEAMTOWERS SOS V11 — PROPOSAL SERVICE (PROPOSAL-GENERATOR sprint A)
// Ruta · /js/core/proposalService.js
//
// Generador de propostes a clients · brief curt + canvas context → IA failover
// genera draft (escope · deliverables · pricing · skills required) · status
// state machine · skill matching · PDF print-css. Pure · zero KB · zero DOM.
//
// Schema · proposal node ·
//   { id, type: 'proposal', projectId,
//     content: { client, summary, deliverables[], pricing{total, currency,
//                breakdown}, validUntil, skillsRequired[], status,
//                acceptedAt?, rejectedAt?, sentAt?, notes? },
//     createdAt, updatedAt }
//   deliverable · { description, estimatedHours, price }
//   pricing.breakdown · per deliverable o per categoria
//
// Estats · draft → sent → accepted | rejected | expired
// Reusa · skillTaxonomy (matchSkillsToBrief) · projectCanvasService (context)
// =============================================================================

import { SKILL_TAXONOMY, getSkillById } from './skillTaxonomy.js';

export const PROPOSAL_TYPE = 'proposal';

export const PROPOSAL_STATUS = Object.freeze({
    draft:    { label: 'Draft',    color: '#94a3b8', icon: '✏️',  terminal: false },
    sent:     { label: 'Enviada',  color: '#3b82f6', icon: '📤',  terminal: false },
    accepted: { label: 'Acceptada',color: '#22c55e', icon: '✅',  terminal: true  },
    rejected: { label: 'Rebutjada',color: '#ef4444', icon: '✗',  terminal: true  },
    expired:  { label: 'Caducada', color: '#facc15', icon: '⏰',  terminal: true  },
});

const VALID_TRANSITIONS = Object.freeze({
    draft:    ['sent'],
    sent:     ['accepted', 'rejected', 'expired'],
    accepted: [],
    rejected: [],
    expired:  [],
});

// buildEmptyProposal · pura
export function buildEmptyProposal({
    projectId    = null,
    client       = '',
    summary      = '',
    validUntil   = null,
    currency     = 'EUR',
    ts           = null,
} = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        id:        'prop-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 7),
        type:      PROPOSAL_TYPE,
        projectId,
        content: {
            client,
            summary,
            deliverables:    [],
            pricing:         { total: 0, currency, breakdown: [] },
            validUntil,
            skillsRequired:  [],
            status:          'draft',
            sentAt:          null,
            acceptedAt:      null,
            rejectedAt:      null,
            notes:           '',
        },
        createdAt: now,
        updatedAt: now,
    };
}

// addDeliverable · pura · immutable
export function addDeliverable(proposal, { description = '', estimatedHours, price } = {}) {
    if (typeof estimatedHours !== 'number' || !isFinite(estimatedHours) || estimatedHours <= 0) {
        throw new Error('estimatedHours must be positive number');
    }
    if (typeof price !== 'number' || !isFinite(price) || price < 0) {
        throw new Error('price must be non-negative number');
    }
    const del = {
        description: String(description || ''),
        estimatedHours,
        price: round2(price),
    };
    const newDeliverables = [...(proposal.content?.deliverables || []), del];
    const newTotal = newDeliverables.reduce((s, d) => s + (d.price || 0), 0);
    return {
        ...proposal,
        content: {
            ...proposal.content,
            deliverables: newDeliverables,
            pricing: {
                ...proposal.content.pricing,
                total: round2(newTotal),
            },
        },
        updatedAt: Date.now(),
    };
}

// removeDeliverable · pura · per index · recalcula total
export function removeDeliverable(proposal, index) {
    const dels = proposal.content?.deliverables || [];
    if (index < 0 || index >= dels.length) throw new Error('deliverable index out of range');
    const next = dels.filter((_, i) => i !== index);
    const newTotal = next.reduce((s, d) => s + (d.price || 0), 0);
    return {
        ...proposal,
        content: {
            ...proposal.content,
            deliverables: next,
            pricing: { ...proposal.content.pricing, total: round2(newTotal) },
        },
        updatedAt: Date.now(),
    };
}

// setSkillsRequired · pura · valida que tots existeixin a la taxonomia
export function setSkillsRequired(proposal, skillIds = []) {
    if (!Array.isArray(skillIds)) throw new Error('skillIds must be array');
    const valid = skillIds.filter(id => getSkillById(id));
    return {
        ...proposal,
        content: { ...proposal.content, skillsRequired: valid },
        updatedAt: Date.now(),
    };
}

// validateProposal · pura · retorna { ok, errors[] }
export function validateProposal(proposal) {
    const errors = [];
    if (!proposal || !proposal.content) return { ok: false, errors: ['missing-content'] };
    const c = proposal.content;
    if (!c.client || !String(c.client).trim())     errors.push('client-required');
    if (!c.summary || c.summary.length < 20)        errors.push('summary-too-short · min 20');
    if (!c.deliverables || c.deliverables.length === 0) errors.push('deliverables-required');
    if (typeof c.pricing?.total !== 'number' || c.pricing.total < 0) errors.push('pricing-invalid');
    if (c.status && !(c.status in PROPOSAL_STATUS)) errors.push('unknown-status · ' + c.status);
    return { ok: errors.length === 0, errors };
}

// transitionStatus · pura · throws si transició invàlida
export function transitionProposalStatus(proposal, newStatus, { ts = null } = {}) {
    const current = proposal.content?.status;
    if (!current) throw new Error('no current status');
    if (!(newStatus in PROPOSAL_STATUS)) throw new Error('unknown target status · ' + newStatus);
    const allowed = VALID_TRANSITIONS[current] || [];
    if (!allowed.includes(newStatus)) {
        throw new Error('invalid-transition · ' + current + ' → ' + newStatus);
    }
    const now = (typeof ts === 'number') ? ts : Date.now();
    const updates = { status: newStatus };
    if (newStatus === 'sent')     updates.sentAt     = new Date(now).toISOString();
    if (newStatus === 'accepted') updates.acceptedAt = new Date(now).toISOString();
    if (newStatus === 'rejected') updates.rejectedAt = new Date(now).toISOString();
    return {
        ...proposal,
        content: { ...proposal.content, ...updates },
        updatedAt: now,
    };
}

// matchSkillsToBrief · pura · heurística simple text-match · retorna
// skills rankejades per relevance. Cada skill té un score basat en quantes
// keywords del brief apareixen al seu label + description.
//
// args ·
//   brief         · string · descripció del que el client necessita
//   topN          · int · cap d'skills a retornar (default 8)
//   minMatchScore · int · score mínim per incloure (default 1)
//
// Retorna · [{ skillId, skill, score, matches: [keyword,...] }, ...]
export function matchSkillsToBrief(brief, { topN = 8, minMatchScore = 1 } = {}) {
    if (!brief || typeof brief !== 'string') return [];
    // Stop-words bàsiques + tokens curts
    const STOP = new Set(['amb', 'per', 'una', 'els', 'les', 'que', 'del', 'des', 'pel', 'pels',
                          'and', 'the', 'for', 'with', 'from', 'into', 'this', 'that',
                          'tot', 'una', 'cap', 'als', 'son', 'molt', 'més', 'fer', 'hem']);
    const tokens = brief.toLowerCase()
        .replace(/[^\wàèéíòóúüç\s-]/giu, ' ')
        .split(/\s+/)
        .filter(t => t.length > 3 && !STOP.has(t));
    const tokenSet = new Set(tokens);

    const results = [];
    for (const skill of SKILL_TAXONOMY) {
        const haystack = (skill.label + ' ' + skill.description + ' ' + skill.domain).toLowerCase();
        let score = 0;
        const matches = [];
        for (const tok of tokenSet) {
            if (haystack.includes(tok)) { score++; matches.push(tok); }
        }
        // Bonus per match exact al domain
        if (tokenSet.has(skill.domain.toLowerCase())) score += 2;
        if (score >= minMatchScore) results.push({ skillId: skill.id, skill, score, matches });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topN);
}

// computeProposalQuality · pura · score 0-100 · per a lifecycle.
// Penalitza: sense client · summary curt · cap deliverable · pricing 0 ·
// validUntil passat · 0 skills required.
export function computeProposalQuality(proposal) {
    const validation = validateProposal(proposal);
    if (!validation.ok) return { score: 0, reasons: validation.errors, valid: false };
    const c = proposal.content;
    let score = 100;
    const reasons = [];

    if (c.summary.length < 80) { score -= 15; reasons.push('summary-thin · ' + c.summary.length + ' chars'); }
    if (c.deliverables.length < 3) { score -= 10; reasons.push('deliverables-few · ' + c.deliverables.length); }
    if ((c.skillsRequired || []).length === 0) { score -= 10; reasons.push('no-skills-tagged'); }
    if (!c.validUntil) { score -= 5; reasons.push('no-valid-until-date'); }
    else {
        const today = new Date().toISOString().slice(0, 10);
        if (c.validUntil < today) { score -= 15; reasons.push('expired-valid-until'); }
    }
    if (c.pricing.total === 0) { score -= 10; reasons.push('pricing-zero'); }

    score = Math.max(0, Math.min(100, score));
    return { score, reasons, valid: true };
}

// computeProposalsBreakdown · pura · per al lifecycle
export function computeProposalsBreakdown(proposals) {
    const counts = { draft: 0, sent: 0, accepted: 0, rejected: 0, expired: 0 };
    let totalValue = 0, acceptedValue = 0;
    for (const p of proposals || []) {
        const c = p?.content;
        if (!c) continue;
        counts[c.status] = (counts[c.status] || 0) + 1;
        totalValue += (c.pricing?.total || 0);
        if (c.status === 'accepted') acceptedValue += (c.pricing?.total || 0);
    }
    const total = proposals?.length || 0;
    return {
        ...counts,
        total,
        totalValue:    round2(totalValue),
        acceptedValue: round2(acceptedValue),
        acceptedRatio: total > 0 ? counts.accepted / total : 0,
    };
}

// buildAiPromptForProposal · pura · genera prompt per al runEscalation
// per a generar draft de proposal a partir del brief + project context.
export function buildAiPromptForProposal({
    brief        = '',
    client       = '',
    projectName  = '',
    projectCanvas = null,
    matchedSkills = [],
} = {}) {
    const lines = [];
    lines.push('Ets ajudant comercial SOS. Genera un draft de proposta professional en format JSON.');
    lines.push('');
    lines.push('## Context');
    if (projectName) lines.push('Projecte · ' + projectName);
    if (client)      lines.push('Client · ' + client);
    if (projectCanvas) {
        const vision = projectCanvas.steps?.vision?.value;
        const mission = projectCanvas.steps?.mission?.value;
        if (vision)  lines.push('Vision · ' + vision);
        if (mission) lines.push('Mission · ' + mission);
    }
    lines.push('');
    lines.push('## Brief del client');
    lines.push(brief);
    lines.push('');
    if (matchedSkills.length) {
        lines.push('## Skills detectades (rellevants per al brief)');
        for (const m of matchedSkills.slice(0, 5)) {
            lines.push('- ' + m.skill.label + ' (' + m.skill.domain + ' · ' + m.skill.tier + ')');
        }
        lines.push('');
    }
    lines.push('## Format de resposta · JSON puro · sense markdown wrap');
    lines.push('{');
    lines.push('  "summary": "string · 80-300 chars · valor proposat al client",');
    lines.push('  "deliverables": [');
    lines.push('    { "description": "string", "estimatedHours": number, "price": number_eur }');
    lines.push('  ],');
    lines.push('  "notes": "string opcional · supòsits o terms"');
    lines.push('}');
    lines.push('');
    lines.push('Genera 3-5 deliverables · pricing realista per a freelance/coop ES (40-80€/h promig).');
    return lines.join('\n');
}

// applyAIDraftToProposal · pura · pren raw text de l'IA · intenta parse JSON ·
// aplica a la proposal. Si parse falla · throws.
export function applyAIDraftToProposal(proposal, rawText) {
    if (!rawText || typeof rawText !== 'string') throw new Error('ai-output-empty');
    // Strip markdown fences if present
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    }
    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch (e) { throw new Error('ai-output-not-json · ' + e.message); }
    let next = {
        ...proposal,
        content: {
            ...proposal.content,
            summary: typeof parsed.summary === 'string' ? parsed.summary : proposal.content.summary,
            notes:   typeof parsed.notes === 'string'   ? parsed.notes   : proposal.content.notes,
            deliverables: [],
            pricing: { ...proposal.content.pricing, total: 0 },
        },
        updatedAt: Date.now(),
    };
    if (Array.isArray(parsed.deliverables)) {
        for (const d of parsed.deliverables) {
            if (!d || typeof d.estimatedHours !== 'number' || typeof d.price !== 'number') continue;
            try {
                next = addDeliverable(next, {
                    description:    String(d.description || ''),
                    estimatedHours: d.estimatedHours,
                    price:          d.price,
                });
            } catch (_) { /* skip bad deliverable */ }
        }
    }
    return next;
}

function round2(n) { return Math.round(n * 100) / 100; }
