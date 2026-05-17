// =============================================================================
// TEAMTOWERS SOS V11 — v140 · TEAM SERVICE · permission model + audit log
// Ruta · /js/core/teamService.js
//
// Item del backlog · wo-team-permissions-view (NOVA vista doble) ·
//
// Dimensió A · GLOBAL (/team)
//  · Llistat persones del swarm SOS amb qui he col·laborat
//  · Permisos GLOBALS · matriu rol × acció (RBAC)
//  · Audit log · qui ha fet què cross-projects
//
// Dimensió B · per-projecte (subtab Equip del Project Hub)
//  · Membres del projecte concret · qui hi participa
//  · Permisos in-project · matriu fine-grained
//
// Storage · KB node `type='team_<projectId>'` (per-projecte) · DID-based
//           identifiers. Storage global · `type='team_member'` per a perfils
//           creuats no associats a un projecte concret.
//
// API ·
//  · listMembers({ projectId?, kb? }) → { ok, members[] }
//  · addMember({ projectId, did, role?, name?, email?, kb? }) → { ok, member }
//  · removeMember({ projectId, did, kb? }) → { ok }
//  · setRole({ projectId, did, role, kb? }) → { ok, member }
//  · listInvitations({ projectId?, kb? }) → { ok, invitations[] }
//  · createInvitation({ projectId, email, role, expiresAt?, kb? }) → { ok, invitation }
//  · cancelInvitation({ projectId, token, kb? }) → { ok }
//  · can({ role, action, ownerDid?, actorDid? }) → boolean
//  · recordAuditEvent({ projectId, actor, action, target?, meta?, kb? }) → { ok }
//  · listAuditLog({ projectId?, actor?, since?, limit?, kb? }) → { ok, events[] }
// =============================================================================

export const TEAM_VERSION = 'v140';

// ── Catàleg canonical de rols ─────────────────────────────────────────────
export const ROLE_CATALOG = Object.freeze({
    founder: {
        id: 'founder', label: 'Founder',
        desc: 'Tots els permisos · creador del projecte',
        can: ['*'],
    },
    ops: {
        id: 'ops', label: 'Operations',
        desc: 'Editar canvas · claim WOs · approve WOs propis',
        can: ['read.*', 'edit.canvas', 'edit.pitch', 'claim.wos', 'approve.wos.own'],
    },
    contributor: {
        id: 'contributor', label: 'Contributor',
        desc: 'Pot reclamar WOs i veure tot · sense editar artefactes',
        can: ['read.*', 'claim.wos'],
    },
    viewer: {
        id: 'viewer', label: 'Viewer',
        desc: 'Lectura limitada · canvas + presentation només',
        can: ['read.canvas', 'read.presentation'],
    },
    invited: {
        id: 'invited', label: 'Invited',
        desc: 'Pendent d\'acceptar invitació · sense accés actiu',
        can: [],
    },
});

export const ACTION_CATALOG = Object.freeze([
    'read.canvas', 'read.pitch', 'read.pact', 'read.map', 'read.kanban', 'read.presentation',
    'read.wallet', 'read.accounting', 'read.value', 'read.invoices',
    'edit.canvas', 'edit.pitch', 'edit.pact', 'edit.map',
    'claim.wos', 'approve.wos.own', 'approve.wos',
    'manage.finances', 'manage.members', 'manage.settings',
]);

// ── can() · matcher RBAC · pure ───────────────────────────────────────────
//
// role · 'founder' | 'ops' | 'contributor' | 'viewer' | 'invited'
// action · ex 'edit.canvas' · 'claim.wos' · 'approve.wos.own'
// ownerDid · opcional · per a accions ".own" cal saber qui és el creador
// actorDid · opcional · per a comparar amb ownerDid
//
// Wildcards · 'read.*' fa match amb 'read.canvas' etc. '*' fa match amb tot.
// Action '.own' fa match si role té permís + actorDid === ownerDid.
export function can({ role, action, ownerDid = null, actorDid = null } = {}) {
    if (!role || !action) return false;
    const def = ROLE_CATALOG[role];
    if (!def) return false;
    const perms = def.can || [];
    if (perms.includes('*')) return true;

    // Si l'acció demanada és ".own" · només s'autoritza si:
    //   · el role té explícitament la mateixa key ".own" AND actor==owner
    //   · o el role té la key BASE (sense .own) que cobreix tot
    if (action.endsWith('.own')) {
        const base = action.slice(0, -4);
        if (perms.includes(base)) return true;        // base cobreix tots els casos
        if (perms.includes(action) && ownerDid && actorDid && ownerDid === actorDid) return true;
        return false;
    }

    // Acció genèrica · match exacte
    if (perms.includes(action)) return true;

    // Wildcards · ex perms='read.*' matches 'read.canvas'
    for (const p of perms) {
        if (p.endsWith('.*')) {
            const prefix = p.slice(0, -2);
            if (action.startsWith(prefix + '.')) return true;
        }
    }
    return false;
}

// ── KB resolver · permet injectar mock per a tests ────────────────────────
async function _resolveKb(kb) {
    if (kb) return kb;
    try { return (await import('./kb.js')).KB; } catch (_) { return null; }
}

function _teamNodeId(projectId) {
    return projectId ? 'team-' + projectId : 'team-global';
}

function _genId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Members CRUD ──────────────────────────────────────────────────────────
export async function listMembers({ projectId = null, kb = null } = {}) {
    const k = await _resolveKb(kb);
    if (!k || typeof k.getNode !== 'function') return { ok: false, error: 'kb-unavailable', members: [] };
    try {
        const node = await k.getNode(_teamNodeId(projectId));
        const members = node?.content?.members || [];
        return { ok: true, members };
    } catch (e) {
        return { ok: false, error: 'kb-failed · ' + (e?.message || ''), members: [] };
    }
}

export async function addMember({ projectId, did, role = 'contributor', name = null, email = null, kb = null } = {}) {
    if (!did) return { ok: false, error: 'did-required' };
    if (!ROLE_CATALOG[role]) return { ok: false, error: 'unknown-role · ' + role };
    const k = await _resolveKb(kb);
    if (!k) return { ok: false, error: 'kb-unavailable' };
    const id = _teamNodeId(projectId);
    const existing = (await k.getNode?.(id))?.content?.members || [];
    if (existing.some(m => m.did === did)) return { ok: false, error: 'already-member' };
    const member = { did, role, name, email, joinedAt: Date.now() };
    const node = {
        id,
        type: projectId ? ('team_' + projectId) : 'team_global',
        content: { members: [...existing, member] },
    };
    await k.upsert(node);
    await recordAuditEvent({ projectId, actor: 'system', action: 'member.added', target: did, meta: { role }, kb: k });
    return { ok: true, member };
}

export async function removeMember({ projectId, did, kb = null } = {}) {
    if (!did) return { ok: false, error: 'did-required' };
    const k = await _resolveKb(kb);
    if (!k) return { ok: false, error: 'kb-unavailable' };
    const id = _teamNodeId(projectId);
    const node = await k.getNode?.(id);
    const existing = node?.content?.members || [];
    const filtered = existing.filter(m => m.did !== did);
    if (filtered.length === existing.length) return { ok: false, error: 'not-found' };
    await k.upsert({ id, type: node?.type || (projectId ? 'team_' + projectId : 'team_global'),
                    content: { ...(node?.content || {}), members: filtered }});
    await recordAuditEvent({ projectId, actor: 'system', action: 'member.removed', target: did, kb: k });
    return { ok: true };
}

export async function setRole({ projectId, did, role, kb = null } = {}) {
    if (!did) return { ok: false, error: 'did-required' };
    if (!ROLE_CATALOG[role]) return { ok: false, error: 'unknown-role · ' + role };
    const k = await _resolveKb(kb);
    if (!k) return { ok: false, error: 'kb-unavailable' };
    const id = _teamNodeId(projectId);
    const node = await k.getNode?.(id);
    const existing = node?.content?.members || [];
    const idx = existing.findIndex(m => m.did === did);
    if (idx < 0) return { ok: false, error: 'not-found' };
    const oldRole = existing[idx].role;
    const updated = [...existing];
    updated[idx] = { ...updated[idx], role };
    await k.upsert({ id, type: node?.type || (projectId ? 'team_' + projectId : 'team_global'),
                    content: { ...(node?.content || {}), members: updated }});
    await recordAuditEvent({ projectId, actor: 'system', action: 'member.role_changed', target: did, meta: { from: oldRole, to: role }, kb: k });
    return { ok: true, member: updated[idx] };
}

// ── Invitations ───────────────────────────────────────────────────────────
export async function listInvitations({ projectId = null, kb = null } = {}) {
    const k = await _resolveKb(kb);
    if (!k) return { ok: false, error: 'kb-unavailable', invitations: [] };
    try {
        const node = await k.getNode?.(_teamNodeId(projectId));
        const invs = node?.content?.invitations || [];
        const now = Date.now();
        const active = invs.filter(i => !i.expiresAt || i.expiresAt > now);
        return { ok: true, invitations: active };
    } catch (e) {
        return { ok: false, error: 'kb-failed · ' + (e?.message || ''), invitations: [] };
    }
}

export async function createInvitation({ projectId, email, role = 'contributor', expiresAt = null, kb = null } = {}) {
    if (!email) return { ok: false, error: 'email-required' };
    if (!ROLE_CATALOG[role]) return { ok: false, error: 'unknown-role · ' + role };
    const k = await _resolveKb(kb);
    if (!k) return { ok: false, error: 'kb-unavailable' };
    const id = _teamNodeId(projectId);
    const node = await k.getNode?.(id);
    const existing = node?.content?.invitations || [];
    const invitation = {
        token:     'inv_' + _genId().slice(0, 12),
        email, role,
        createdAt: Date.now(),
        expiresAt: expiresAt || (Date.now() + 7 * 24 * 60 * 60 * 1000),   // default 7d
    };
    await k.upsert({ id, type: node?.type || (projectId ? 'team_' + projectId : 'team_global'),
                    content: { ...(node?.content || {}), invitations: [...existing, invitation] }});
    await recordAuditEvent({ projectId, actor: 'system', action: 'invitation.created', target: email, meta: { role }, kb: k });
    return { ok: true, invitation };
}

export async function cancelInvitation({ projectId, token, kb = null } = {}) {
    if (!token) return { ok: false, error: 'token-required' };
    const k = await _resolveKb(kb);
    if (!k) return { ok: false, error: 'kb-unavailable' };
    const id = _teamNodeId(projectId);
    const node = await k.getNode?.(id);
    const existing = node?.content?.invitations || [];
    const filtered = existing.filter(i => i.token !== token);
    if (filtered.length === existing.length) return { ok: false, error: 'not-found' };
    await k.upsert({ id, type: node?.type || (projectId ? 'team_' + projectId : 'team_global'),
                    content: { ...(node?.content || {}), invitations: filtered }});
    await recordAuditEvent({ projectId, actor: 'system', action: 'invitation.cancelled', target: token, kb: k });
    return { ok: true };
}

// ── Audit log · type='team_audit' node per event ─────────────────────────
export async function recordAuditEvent({ projectId = null, actor, action, target = null, meta = null, kb = null } = {}) {
    if (!actor || !action) return { ok: false, error: 'actor-action-required' };
    const k = await _resolveKb(kb);
    if (!k || typeof k.upsert !== 'function') return { ok: false, error: 'kb-unavailable' };
    const event = {
        id:       'audit-' + _genId(),
        type:     'team_audit',
        content: { projectId, actor, action, target, meta, ts: Date.now() },
    };
    try { await k.upsert(event); } catch (_) { /* swallow */ }
    return { ok: true, event };
}

export async function listAuditLog({ projectId = null, actor = null, since = null, limit = 100, kb = null } = {}) {
    const k = await _resolveKb(kb);
    if (!k || typeof k.query !== 'function') return { ok: false, error: 'kb-unavailable', events: [] };
    let nodes;
    try { nodes = await k.query({ type: 'team_audit' }); }
    catch (e) { return { ok: false, error: 'kb-query-failed · ' + (e?.message || ''), events: [] }; }
    let events = (nodes || []).map(n => n?.content).filter(Boolean);
    if (projectId)      events = events.filter(e => e.projectId === projectId);
    if (actor)          events = events.filter(e => e.actor === actor);
    if (typeof since === 'number') events = events.filter(e => (e.ts || 0) >= since);
    events.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    return { ok: true, events: events.slice(0, Math.max(1, limit)) };
}
