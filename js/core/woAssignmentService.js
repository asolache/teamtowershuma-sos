// =============================================================================
// TEAMTOWERS SOS V11 — WO ASSIGNMENT SERVICE (SOCIAL-WO-001)
// Ruta · /js/core/woAssignmentService.js
//
// Capa pure d'assignment per a Work Orders · "qui pot agafar aquest WO?" ·
// 3 tipus d'assignment ·
//   - human-specific · @handle concret
//   - ai-specific    · agent-claude-code · agent-gpt-coder · etc
//   - open           · qualsevol (anyone)
//
// Reusa el patró de agentBridgeSchema.assignee_kind però amb resolution
// dinàmica al claim. Tracks · pending / claimed / completed amb history.
//
// Pure · zero KB · zero DOM.
// =============================================================================

import { ASSIGNEE_KIND } from './agentBridgeSchema.js';

// _norm · pure
function _norm(h) {
    if (!h) return null;
    const s = String(h).trim();
    return s.startsWith('@') ? s : '@' + s;
}

// buildAssignment · pure · genera assignment block per al WO
//
// args ·
//   kind · 'human' | 'ai-claude' | 'ai-gpt' | 'ai-any' | 'open'
//   targetHandle · només si kind='human' i específic
//   agentId      · només si kind='ai-*'
//   requiredCapabilities · array de capabilities (per a ai-with-cap)
export function buildAssignment({
    kind = 'open',
    targetHandle = null,
    agentId = null,
    requiredCapabilities = [],
} = {}) {
    if (!ASSIGNEE_KIND.includes(kind) && kind !== 'open') {
        throw new Error('buildAssignment · kind invalid · ' + kind);
    }
    return {
        kind,
        targetHandle: targetHandle ? _norm(targetHandle) : null,
        agentId: agentId || null,
        requiredCapabilities: Array.isArray(requiredCapabilities) ? requiredCapabilities.slice() : [],
        status: 'pending',
        claimedBy: null,           // handle o agentId del qui ho ha agafat
        claimedAt: null,
        completedAt: null,
    };
}

// canClaim · pure · pot un usuari/agent reclamar aquest WO?
//
// args ·
//   assignment · objecte buildAssignment-shaped
//   claimerHandle · handle de l'usuari (si humà)
//   claimerAgentId · id de l'agent (si IA)
//   claimerCapabilities · capabilities de l'agent (per a match)
//
// Retorna · { ok, reason? }
export function canClaim({
    assignment, claimerHandle = null, claimerAgentId = null, claimerCapabilities = [],
} = {}) {
    if (!assignment) return { ok: false, reason: 'no assignment' };
    if (assignment.status === 'completed') return { ok: false, reason: 'wo already completed' };
    if (assignment.status === 'claimed' && assignment.claimedBy) {
        // Re-claim del propi claimer · OK (idempotent)
        const sameClaimer = assignment.claimedBy === _norm(claimerHandle)
                          || assignment.claimedBy === claimerAgentId;
        if (sameClaimer) return { ok: true, reason: 'already-claimed-by-self' };
        return { ok: false, reason: 'wo already claimed by ' + assignment.claimedBy };
    }

    const me = claimerHandle ? _norm(claimerHandle) : null;

    switch (assignment.kind) {
        case 'open':
            return { ok: true, reason: 'open assignment · qualsevol pot' };
        case 'human':
            // Específic · només si handle coincideix
            if (assignment.targetHandle && me === assignment.targetHandle) {
                return { ok: true, reason: 'human · handle match' };
            }
            if (!assignment.targetHandle && me) {
                return { ok: true, reason: 'human · cap específic · qualsevol humà' };
            }
            return { ok: false, reason: 'human · handle no coincideix · cal ' + assignment.targetHandle };
        case 'specific':
            if (assignment.agentId && claimerAgentId === assignment.agentId) {
                return { ok: true, reason: 'specific agent · match' };
            }
            return { ok: false, reason: 'specific · agent no coincideix' };
        case 'ai-any':
            if (claimerAgentId) return { ok: true, reason: 'ai-any · any agent ok' };
            return { ok: false, reason: 'ai-any · cal agent' };
        case 'ai-claude':
            if (claimerAgentId && claimerAgentId.includes('claude')) {
                return { ok: true, reason: 'ai-claude match' };
            }
            return { ok: false, reason: 'ai-claude requerit' };
        case 'ai-gpt':
            if (claimerAgentId && claimerAgentId.includes('gpt')) {
                return { ok: true, reason: 'ai-gpt match' };
            }
            return { ok: false, reason: 'ai-gpt requerit' };
        case 'ai-gemini':
            if (claimerAgentId && claimerAgentId.includes('gemini')) {
                return { ok: true, reason: 'ai-gemini match' };
            }
            return { ok: false, reason: 'ai-gemini requerit' };
        case 'ai-with-cap':
            const required = assignment.requiredCapabilities || [];
            const have = Array.isArray(claimerCapabilities) ? claimerCapabilities : [];
            const missing = required.filter(c => !have.includes(c));
            if (missing.length === 0) return { ok: true, reason: 'capabilities match' };
            return { ok: false, reason: 'missing capabilities · ' + missing.join(', ') };
        default:
            return { ok: false, reason: 'unknown kind · ' + assignment.kind };
    }
}

// claim · pure · marca assignment com a reclamat · retorna nou assignment
export function claim({ assignment, claimerHandle = null, claimerAgentId = null, ts = null } = {}) {
    if (!assignment) throw new Error('claim · assignment required');
    const claimer = claimerHandle ? _norm(claimerHandle) : claimerAgentId;
    if (!claimer) throw new Error('claim · claimerHandle or claimerAgentId required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...assignment,
        status: 'claimed',
        claimedBy: claimer,
        claimedAt: now,
    };
}

// complete · pure · marca completed
export function complete({ assignment, ts = null } = {}) {
    if (!assignment) throw new Error('complete · assignment required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...assignment,
        status: 'completed',
        completedAt: now,
    };
}

// unclaim · pure · torna a pending · cas error o cancel
export function unclaim({ assignment, ts = null } = {}) {
    if (!assignment) throw new Error('unclaim · assignment required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...assignment,
        status: 'pending',
        claimedBy: null,
        claimedAt: null,
        updatedAt: now,
    };
}

// describeAssignment · pure · text human-readable per a UI
export function describeAssignment(assignment) {
    if (!assignment) return 'no assignment';
    switch (assignment.kind) {
        case 'open':       return 'Obert · qualsevol pot agafar';
        case 'human':      return assignment.targetHandle
            ? 'Humà · ' + assignment.targetHandle
            : 'Humà · qualsevol persona';
        case 'specific':   return 'Agent específic · ' + (assignment.agentId || '?');
        case 'ai-any':     return 'IA · qualsevol agent';
        case 'ai-claude':  return 'IA · Claude';
        case 'ai-gpt':     return 'IA · GPT';
        case 'ai-gemini':  return 'IA · Gemini';
        case 'ai-with-cap': return 'IA · amb capabilities · ' + (assignment.requiredCapabilities || []).join(', ');
        default: return 'desconegut · ' + assignment.kind;
    }
}
