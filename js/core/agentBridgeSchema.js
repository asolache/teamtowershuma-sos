// =============================================================================
// TEAMTOWERS SOS V11 — AGENT BRIDGE SCHEMA (AGENT-BRIDGE-001 sprint A)
// Ruta · /js/core/agentBridgeSchema.js
//
// Schema canonical de WOs · agents · backlog YAML per al bridge GENÈRIC
// entre SOS i qualsevol agent IA (Claude · GPT · Gemini · custom).
//
// Pure · zero KB · zero DOM · validators puro-funcionals retornen
// { ok, errors[], normalized }.
//
// Filosofia · single source of truth per al protocol. Si dos agents
// parlen aquesta schema, poden col·laborar sobre el mateix backlog.
// =============================================================================

export const AGENT_BRIDGE_VERSION = 'v1.0';

// ── Constants ──────────────────────────────────────────────────────────────

export const WO_STATUS = Object.freeze([
    'pending',      // creat · cap agent l'ha agafat
    'claimed',      // un agent ha fet claim · pendent execució
    'in-progress',  // execució activa
    'done',         // completed + deliverable lliurat
    'blocked',      // dependència pendent · necessita humà
    'cancelled',    // cancel·lat · raó explícita
]);

export const ASSIGNEE_KIND = Object.freeze([
    'human',        // qualsevol humà pot claim
    'ai-any',       // qualsevol agent IA pot claim
    'ai-claude',    // específicament Claude Code
    'ai-gpt',       // específicament GPT
    'ai-gemini',    // específicament Gemini
    'ai-with-cap',  // agent amb capabilities específics (veure required_capabilities)
    'specific',     // agent específic (veure specific_agent_id)
]);

export const DELIVERABLE_KIND = Object.freeze([
    'test-suite',    // command + expect (TDD)
    'file-output',   // path + content hash
    'kb-upsert',     // KB nodes upserted (count + types)
    'text-output',   // resposta text avaluada per IA
    'manual-check',  // humà valida visualment
    'multi',         // múltiples deliverables (combinació)
]);

export const PRIORITY = Object.freeze(['critical', 'high', 'medium', 'low']);
export const COMPLEXITY = Object.freeze(['XS', 'S', 'M', 'L', 'XL']);

export const AGENT_CAPABILITIES = Object.freeze([
    'code-write',
    'code-review',
    'test-run',
    'bash-execute',
    'file-edit',
    'browser-debug',
    'text-generate',
    'classify',
    'translate',
    'image-generate',
    'voice-transcribe',
    'data-analysis',
    'git-commit',
    'github-pr',
]);

// ── Validators ─────────────────────────────────────────────────────────────

function _isString(v) { return typeof v === 'string' && v.length > 0; }
function _isArrayOfStrings(v) { return Array.isArray(v) && v.every(x => typeof x === 'string'); }

// validateWorkOrder · schema check d'un WO al backlog YAML.
// Retorna { ok, errors[], normalized }. `normalized` és la versió validada
// amb defaults aplicats · null si !ok.
export function validateWorkOrder(wo) {
    const errors = [];
    if (!wo || typeof wo !== 'object') {
        return { ok: false, errors: ['wo: must be object'], normalized: null };
    }
    if (!_isString(wo.id))             errors.push('id: required string');
    if (!_isString(wo.title))          errors.push('title: required string');
    if (wo.status && !WO_STATUS.includes(wo.status)) errors.push('status: invalid · ' + wo.status);
    if (wo.priority && !PRIORITY.includes(wo.priority)) errors.push('priority: invalid · ' + wo.priority);
    if (wo.complexity && !COMPLEXITY.includes(wo.complexity)) errors.push('complexity: invalid · ' + wo.complexity);
    if (wo.assignee_kind && !ASSIGNEE_KIND.includes(wo.assignee_kind)) errors.push('assignee_kind: invalid · ' + wo.assignee_kind);
    if (wo.required_capabilities && !_isArrayOfStrings(wo.required_capabilities)) errors.push('required_capabilities: array of strings');
    if (wo.required_capabilities) {
        const bad = wo.required_capabilities.filter(c => !AGENT_CAPABILITIES.includes(c));
        if (bad.length) errors.push('required_capabilities · unknown: ' + bad.join(', '));
    }
    if (wo.deliverable_test) {
        if (!wo.deliverable_test.kind || !DELIVERABLE_KIND.includes(wo.deliverable_test.kind)) {
            errors.push('deliverable_test.kind: invalid · ' + wo.deliverable_test.kind);
        }
    }
    if (wo.estimated_cost_eur != null && (typeof wo.estimated_cost_eur !== 'number' || wo.estimated_cost_eur < 0)) {
        errors.push('estimated_cost_eur: must be non-negative number');
    }
    if (errors.length > 0) return { ok: false, errors, normalized: null };
    const normalized = {
        id:                    wo.id,
        project_id:            wo.project_id || 'sos-dev-internal',
        title:                 wo.title,
        description:           wo.description || '',
        priority:              wo.priority || 'medium',
        complexity:            wo.complexity || 'M',
        status:                wo.status || 'pending',
        assignee_kind:         wo.assignee_kind || 'ai-any',
        required_capabilities: wo.required_capabilities || [],
        specific_agent_id:     wo.specific_agent_id || null,
        deliverable_test:      wo.deliverable_test || null,
        estimated_cost_eur:    typeof wo.estimated_cost_eur === 'number' ? wo.estimated_cost_eur : null,
        dependencies:          Array.isArray(wo.dependencies) ? wo.dependencies.slice() : [],
        soc_ref:               wo.soc_ref || null,                  // lligam jerarquia SOC
        process_ref:           wo.process_ref || null,              // lligam procés
        org_ref:               wo.org_ref || null,                  // lligam organització
        claimed_by:            wo.claimed_by || null,
        claimed_at:            wo.claimed_at || null,
        completed_at:          wo.completed_at || null,
        deliverable_uri:       wo.deliverable_uri || null,
        cost_actual_eur:       wo.cost_actual_eur != null ? wo.cost_actual_eur : null,
        signature:             wo.signature || null,
        tags:                  Array.isArray(wo.tags) ? wo.tags.slice() : [],
        notes:                 wo.notes || '',
    };
    return { ok: true, errors: [], normalized };
}

// validateAgent · schema d'un agent registrat.
// Un agent declara id · nom · capabilities · cost profile · public key
// (per a deliverables signats).
export function validateAgent(agent) {
    const errors = [];
    if (!agent || typeof agent !== 'object') {
        return { ok: false, errors: ['agent: must be object'], normalized: null };
    }
    if (!_isString(agent.id))   errors.push('id: required string');
    if (!_isString(agent.name)) errors.push('name: required string');
    if (!agent.kind || !ASSIGNEE_KIND.includes(agent.kind)) errors.push('kind: invalid · ' + agent.kind);
    if (!_isArrayOfStrings(agent.capabilities)) errors.push('capabilities: required array of strings');
    if (agent.capabilities) {
        const bad = agent.capabilities.filter(c => !AGENT_CAPABILITIES.includes(c));
        if (bad.length) errors.push('capabilities · unknown: ' + bad.join(', '));
    }
    if (agent.cost_per_hour_eur != null && typeof agent.cost_per_hour_eur !== 'number') {
        errors.push('cost_per_hour_eur: must be number or null');
    }
    if (errors.length > 0) return { ok: false, errors, normalized: null };
    const normalized = {
        id:                  agent.id,
        name:                agent.name,
        kind:                agent.kind,
        capabilities:        agent.capabilities,
        cost_per_hour_eur:   agent.cost_per_hour_eur != null ? agent.cost_per_hour_eur : null,
        cost_profile:        agent.cost_profile || 'unknown',
        public_key:          agent.public_key || null,
        owner_handle:        agent.owner_handle || null,
        api_endpoint:        agent.api_endpoint || null,
        active:              agent.active !== false,
        notes:               agent.notes || '',
    };
    return { ok: true, errors: [], normalized };
}

// validateBacklog · schema del fitxer backlog complet (YAML root).
export function validateBacklog(backlog) {
    const errors = [];
    if (!backlog || typeof backlog !== 'object') {
        return { ok: false, errors: ['backlog: must be object'], normalized: null };
    }
    if (!_isString(backlog.version)) errors.push('version: required string');
    if (!Array.isArray(backlog.work_orders)) errors.push('work_orders: required array');
    const woResults = (backlog.work_orders || []).map((wo, i) => {
        const r = validateWorkOrder(wo);
        if (!r.ok) errors.push('work_orders[' + i + '] · ' + r.errors.join(' · '));
        return r;
    });
    const agentResults = (backlog.agents || []).map((a, i) => {
        const r = validateAgent(a);
        if (!r.ok) errors.push('agents[' + i + '] · ' + r.errors.join(' · '));
        return r;
    });
    // Check unique IDs
    const woIds = new Set();
    for (const r of woResults) {
        if (r.ok) {
            if (woIds.has(r.normalized.id)) errors.push('work_orders · duplicate id: ' + r.normalized.id);
            woIds.add(r.normalized.id);
        }
    }
    const agentIds = new Set();
    for (const r of agentResults) {
        if (r.ok) {
            if (agentIds.has(r.normalized.id)) errors.push('agents · duplicate id: ' + r.normalized.id);
            agentIds.add(r.normalized.id);
        }
    }
    if (errors.length > 0) return { ok: false, errors, normalized: null };
    const normalized = {
        version:     backlog.version,
        last_update: backlog.last_update || null,
        project_id:  backlog.project_id || 'sos-dev-internal',
        agents:      agentResults.map(r => r.normalized),
        work_orders: woResults.map(r => r.normalized),
    };
    return { ok: true, errors: [], normalized };
}

// ── Matching engine · pure ────────────────────────────────────────────────

// matchAgentToWo · pure · retorna true si l'agent pot agafar el WO.
// Lògica · WO.assignee_kind compatible + capabilities ⊇ required.
export function matchAgentToWo(agent, wo) {
    if (!agent || !wo || !agent.active) return false;
    // Specific agent · només si coincideix exactament
    if (wo.assignee_kind === 'specific') {
        return wo.specific_agent_id === agent.id;
    }
    // Kind compatibility
    if (wo.assignee_kind === 'human' && agent.kind !== 'human') return false;
    if (wo.assignee_kind === 'ai-claude' && agent.kind !== 'ai-claude') return false;
    if (wo.assignee_kind === 'ai-gpt' && agent.kind !== 'ai-gpt') return false;
    if (wo.assignee_kind === 'ai-gemini' && agent.kind !== 'ai-gemini') return false;
    if (wo.assignee_kind === 'ai-any' && !agent.kind.startsWith('ai-')) return false;
    // Capabilities ⊇ required
    const required = wo.required_capabilities || [];
    const have = agent.capabilities || [];
    return required.every(c => have.includes(c));
}

// rankCandidates · pure · donat WO + array d'agents · ordena per fitting score
// Score = capability_match × 10 + cost_inverse + kind_priority
// El millor candidat primer.
export function rankCandidates(wo, agents = []) {
    const valid = agents.filter(a => matchAgentToWo(a, wo));
    return valid.map(a => {
        const capMatch = (wo.required_capabilities || []).length;
        const cost = a.cost_per_hour_eur != null ? a.cost_per_hour_eur : 100;
        const costInverse = 1 / (cost + 1);
        // Priority · si WO demana ai-claude i tenim ai-claude · prioritat alta
        const exactKind = a.kind === wo.assignee_kind ? 5 : 0;
        const score = capMatch * 10 + costInverse + exactKind;
        return { agent: a, score };
    }).sort((a, b) => b.score - a.score);
}

// ── Lifecycle helpers · pure ──────────────────────────────────────────────

// claimWo · pure · agent reclama un WO · canvia status a 'claimed'.
// Retorna { ok, wo, error } · no muta input.
export function claimWo(wo, agentId, { ts = null } = {}) {
    if (!wo) return { ok: false, error: 'wo required' };
    if (!agentId) return { ok: false, error: 'agentId required' };
    if (wo.status !== 'pending') return { ok: false, error: 'wo status not pending · ' + wo.status };
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ok: true,
        wo: { ...wo, status: 'claimed', claimed_by: agentId, claimed_at: now },
    };
}

// startWo · pure · transició claimed → in-progress
export function startWo(wo, { ts = null } = {}) {
    if (!wo) return { ok: false, error: 'wo required' };
    if (wo.status !== 'claimed') return { ok: false, error: 'wo not claimed · ' + wo.status };
    return { ok: true, wo: { ...wo, status: 'in-progress' } };
}

// completeWo · pure · in-progress → done + deliverable + cost actual
export function completeWo(wo, { deliverable_uri, cost_actual_eur, signature, ts = null } = {}) {
    if (!wo) return { ok: false, error: 'wo required' };
    if (wo.status !== 'in-progress' && wo.status !== 'claimed') {
        return { ok: false, error: 'wo not claimed/in-progress · ' + wo.status };
    }
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ok: true,
        wo: {
            ...wo,
            status: 'done',
            completed_at: now,
            deliverable_uri: deliverable_uri || null,
            cost_actual_eur: typeof cost_actual_eur === 'number' ? cost_actual_eur : null,
            signature: signature || null,
        },
    };
}

// blockWo · pure · marca com a bloquejat amb raó
export function blockWo(wo, reason) {
    if (!wo) return { ok: false, error: 'wo required' };
    return { ok: true, wo: { ...wo, status: 'blocked', notes: (wo.notes ? wo.notes + '\n' : '') + 'BLOCKED: ' + (reason || 'no reason') } };
}

// ── Stats helpers ──────────────────────────────────────────────────────────

// computeBacklogStats · pure · retorna counts per status + cost actual/estimat
export function computeBacklogStats(backlog) {
    const counts = { pending: 0, claimed: 0, 'in-progress': 0, done: 0, blocked: 0, cancelled: 0 };
    let totalEstimatedEur = 0;
    let totalActualEur = 0;
    for (const wo of (backlog?.work_orders || [])) {
        if (counts[wo.status] !== undefined) counts[wo.status]++;
        if (typeof wo.estimated_cost_eur === 'number') totalEstimatedEur += wo.estimated_cost_eur;
        if (typeof wo.cost_actual_eur === 'number') totalActualEur += wo.cost_actual_eur;
    }
    return {
        counts,
        total: backlog?.work_orders?.length || 0,
        totalEstimatedEur: Number(totalEstimatedEur.toFixed(4)),
        totalActualEur:    Number(totalActualEur.toFixed(4)),
        agentCount:        backlog?.agents?.length || 0,
    };
}
