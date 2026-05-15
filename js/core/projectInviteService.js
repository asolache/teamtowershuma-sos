// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT INVITE SERVICE (SOCIAL-INVITE-001)
// Ruta · /js/core/projectInviteService.js
//
// Invitar usuaris dins SOS a un projecte · type:'project_invite' nodes ·
// status flow · pending → accepted | declined | expired.
//
// Quan acceptes · es crea automàticament una assignació al projectShare
// config (inviteUser) i l'invitee pot accedir al projecte amb el seu
// nivell d'accés ('view' o 'collab').
//
// Pure · zero KB · zero DOM. Caller fa KB.upsert.
// =============================================================================

export const PROJECT_INVITE_TYPE = 'project_invite';

export const INVITE_STATUS = Object.freeze(['pending', 'accepted', 'declined', 'expired']);

export const INVITE_ROLES = Object.freeze({
    view:    { label: '👁️ Read-only', description: 'Pot veure tot · no edita' },
    collab:  { label: '✏️ Col·laborador', description: 'Pot editar canvas · WOs · pacts' },
    admin:   { label: '🔑 Admin', description: 'Tot + invitar altres + esborrar' },
});

function _norm(h) {
    if (!h) return null;
    const s = String(h).trim();
    return s.startsWith('@') ? s : '@' + s;
}

// buildInvite · pure · genera invite node prepared per a KB.upsert
//
// args ·
//   projectId       · projecte
//   fromHandle      · qui convida
//   toHandle        · convidat
//   role            · 'view' | 'collab' | 'admin'
//   message         · text opcional
//   expiresInMs     · default 7 dies
//   ts              · injectable
export function buildInvite({
    projectId, fromHandle, toHandle,
    role = 'collab',
    message = '',
    expiresInMs = 7 * 24 * 3600 * 1000,
    ts = null,
} = {}) {
    if (!projectId) throw new Error('buildInvite · projectId required');
    if (!fromHandle) throw new Error('buildInvite · fromHandle required');
    if (!toHandle) throw new Error('buildInvite · toHandle required');
    const f = _norm(fromHandle);
    const t = _norm(toHandle);
    if (f === t) throw new Error('buildInvite · self-invite no permès');
    if (!INVITE_ROLES[role]) throw new Error('buildInvite · role invàlid · ' + role);

    const now = (typeof ts === 'number') ? ts : Date.now();
    const expiresAt = now + expiresInMs;
    const id = 'invite-' + projectId.slice(0, 24) + '-to-' + t.replace(/^@/, '') + '-' + now.toString(36);
    return {
        id,
        type: PROJECT_INVITE_TYPE,
        content: {
            projectId,
            fromHandle: f,
            toHandle: t,
            role,
            message: String(message || '').slice(0, 500),
            status: 'pending',
            createdAt: now,
            expiresAt,
            acceptedAt: null,
            declinedAt: null,
        },
        keywords: [
            'type:project_invite',
            'project:' + projectId,
            'from:' + f,
            'to:' + t,
            'status:pending',
            'role:' + role,
        ],
        createdAt: now,
        updatedAt: now,
    };
}

// _isExpired · pure check
function _isExpired(invite, now) {
    const exp = invite?.content?.expiresAt;
    return typeof exp === 'number' && exp > 0 && now > exp;
}

// resolveStatus · pure · expired si time exhausit · sinó el status manual
export function resolveStatus(invite, { now = null } = {}) {
    const t = (typeof now === 'number') ? now : Date.now();
    if (!invite || !invite.content) return 'unknown';
    const s = invite.content.status || 'pending';
    if (s === 'pending' && _isExpired(invite, t)) return 'expired';
    return s;
}

// acceptInvite · pure · status='accepted'. Retorna nou invite + indicació
// de què el caller ha de fer (afegir al projectShare config via inviteUser).
//
// args · invite · acceptedByHandle (verifica que coincideix amb toHandle)
export function acceptInvite(invite, { acceptedByHandle, ts = null } = {}) {
    if (!invite) throw new Error('acceptInvite · invite required');
    if (!acceptedByHandle) throw new Error('acceptInvite · acceptedByHandle required');
    const me = _norm(acceptedByHandle);
    if (me !== invite.content.toHandle) {
        throw new Error('acceptInvite · només el destinatari pot acceptar · ' + me + ' ≠ ' + invite.content.toHandle);
    }
    const now = (typeof ts === 'number') ? ts : Date.now();
    if (_isExpired(invite, now)) {
        throw new Error('acceptInvite · invite expired');
    }
    if (invite.content.status !== 'pending') {
        throw new Error('acceptInvite · status no és pending · ' + invite.content.status);
    }
    return {
        ...invite,
        content: {
            ...invite.content,
            status: 'accepted',
            acceptedAt: now,
        },
        keywords: [
            ...(invite.keywords || []).filter(k => !k.startsWith('status:')),
            'status:accepted',
        ],
        updatedAt: now,
    };
}

// declineInvite · pure
export function declineInvite(invite, { declinedByHandle, ts = null } = {}) {
    if (!invite) throw new Error('declineInvite · invite required');
    const me = _norm(declinedByHandle);
    if (me !== invite.content.toHandle) {
        throw new Error('declineInvite · només destinatari · ' + me);
    }
    const now = (typeof ts === 'number') ? ts : Date.now();
    if (invite.content.status !== 'pending') {
        throw new Error('declineInvite · status no és pending');
    }
    return {
        ...invite,
        content: {
            ...invite.content,
            status: 'declined',
            declinedAt: now,
        },
        keywords: [
            ...(invite.keywords || []).filter(k => !k.startsWith('status:')),
            'status:declined',
        ],
        updatedAt: now,
    };
}

// ── Queries · pure ────────────────────────────────────────────────────────

// listInvitesForUser · pure · invites rebuts (pending only by default)
export function listInvitesForUser(allInvites = [], handle, { onlyPending = true, now = null } = {}) {
    const me = _norm(handle);
    if (!me) return [];
    return (allInvites || [])
        .filter(i => i && i.type === PROJECT_INVITE_TYPE && i.content?.toHandle === me)
        .filter(i => {
            if (!onlyPending) return true;
            return resolveStatus(i, { now }) === 'pending';
        })
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// listInvitesSent · pure · invites enviats per un handle
export function listInvitesSent(allInvites = [], handle) {
    const me = _norm(handle);
    if (!me) return [];
    return (allInvites || [])
        .filter(i => i && i.type === PROJECT_INVITE_TYPE && i.content?.fromHandle === me)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// listInvitesForProject · pure · invites enviats per a un projecte concret
export function listInvitesForProject(allInvites = [], projectId) {
    if (!projectId) return [];
    return (allInvites || [])
        .filter(i => i && i.type === PROJECT_INVITE_TYPE && i.content?.projectId === projectId)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// countPending · pure · per a badge a nav
export function countPendingForUser(allInvites = [], handle, { now = null } = {}) {
    return listInvitesForUser(allInvites, handle, { onlyPending: true, now }).length;
}

// validateInvite · pure · schema check (per a sync)
export function validateInvite(inv) {
    const errors = [];
    if (!inv || typeof inv !== 'object') return { ok: false, errors: ['not object'] };
    if (inv.type !== PROJECT_INVITE_TYPE) errors.push('type must be ' + PROJECT_INVITE_TYPE);
    const c = inv.content;
    if (!c) errors.push('content required');
    else {
        if (!c.projectId)  errors.push('projectId required');
        if (!c.fromHandle) errors.push('fromHandle required');
        if (!c.toHandle)   errors.push('toHandle required');
        if (c.status && !INVITE_STATUS.includes(c.status)) errors.push('status invalid · ' + c.status);
        if (c.role && !INVITE_ROLES[c.role]) errors.push('role invalid · ' + c.role);
    }
    return { ok: errors.length === 0, errors };
}
