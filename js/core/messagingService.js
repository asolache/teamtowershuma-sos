// =============================================================================
// TEAMTOWERS SOS V11 — MESSAGING SERVICE (SOCIAL-LAYER-001 part 3)
// Ruta · /js/core/messagingService.js
//
// Direct Messages descentralitzats · cada missatge és un node KB
// `type:'direct_message'` amb · fromHandle · toHandle · text · threadId ·
// createdAt · signature (futur ECDSA). Sense servidor · local-first.
//
// Quan permaweb federation activa · missatges es propaguen via sync ·
// l'usuari destinatari el veu al seu inbox la propera vegada que rep
// el syncFromPermaweb.
//
// Threading · threadId = hash(min(from,to) + '+' + max(from,to)) ·
// estable per a una parella · ordena per createdAt.
//
// Status · 'sent' | 'delivered' (sync confirmat) | 'read' (peer obert).
// =============================================================================

export const DM_TYPE = 'direct_message';

export const DM_STATUS = Object.freeze(['sent', 'delivered', 'read']);

// _normalizeHandle · garantitza prefix @
function _norm(h) {
    if (!h) return null;
    const s = String(h).trim();
    return s.startsWith('@') ? s : '@' + s;
}

// _threadIdFor · pure · stable per a parella (independent de qui envia)
function _threadIdFor(a, b) {
    const A = _norm(a);
    const B = _norm(b);
    if (!A || !B) return null;
    const [x, y] = [A, B].sort();
    return 'thread-' + x.replace(/^@/, '') + '+' + y.replace(/^@/, '');
}

export function threadIdFor(a, b) { return _threadIdFor(a, b); }

// buildMessage · pure · crea un DM node prepared per a KB.upsert
//
// args ·
//   fromHandle · qui envia (autor)
//   toHandle   · destinatari
//   text       · contingut (validat 1-2000 chars)
//   ts         · injectable per a tests
//   replyTo    · opcional · id del missatge previ
//
// Retorna · DM node listo para KB.upsert
export function buildMessage({
    fromHandle, toHandle, text,
    ts = null, replyTo = null,
} = {}) {
    const f = _norm(fromHandle);
    const t = _norm(toHandle);
    if (!f) throw new Error('buildMessage · fromHandle required');
    if (!t) throw new Error('buildMessage · toHandle required');
    if (f === t) throw new Error('buildMessage · self-message not allowed');
    if (!text || typeof text !== 'string') throw new Error('buildMessage · text required');
    const clean = text.trim();
    if (clean.length === 0) throw new Error('buildMessage · text empty');
    if (clean.length > 2000) throw new Error('buildMessage · text too long (>2000)');

    const now = (typeof ts === 'number') ? ts : Date.now();
    const tid = _threadIdFor(f, t);
    return {
        id: 'dm-' + tid.replace(/^thread-/, '') + '-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 7),
        type: DM_TYPE,
        content: {
            fromHandle: f,
            toHandle: t,
            text: clean,
            threadId: tid,
            status: 'sent',
            replyTo: replyTo || null,
            // signature futur · ECDSA P-256 via identityService
            signature: null,
        },
        keywords: [
            'type:direct_message',
            'from:' + f,
            'to:' + t,
            'thread:' + tid,
        ],
        createdAt: now,
        updatedAt: now,
    };
}

// ── Queries · pure ────────────────────────────────────────────────────────

// listInbox · pure · filtra DMs rebuts per a un handle · sort newest first
export function listInbox(allMessages = [], myHandle) {
    const me = _norm(myHandle);
    if (!me) return [];
    return (allMessages || [])
        .filter(m => m && m.type === DM_TYPE && m.content?.toHandle === me)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// listSent · pure · DMs enviats per un handle
export function listSent(allMessages = [], myHandle) {
    const me = _norm(myHandle);
    if (!me) return [];
    return (allMessages || [])
        .filter(m => m && m.type === DM_TYPE && m.content?.fromHandle === me)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// listThread · pure · totes les msgs d'un thread · oldest first (chat order)
export function listThread(allMessages = [], threadId) {
    if (!threadId) return [];
    return (allMessages || [])
        .filter(m => m && m.type === DM_TYPE && m.content?.threadId === threadId)
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

// listThreadBetween · pure · helper · llista tots els msgs entre A i B
export function listThreadBetween(allMessages, a, b) {
    return listThread(allMessages, _threadIdFor(a, b));
}

// listConversations · pure · agrupa per threadId · per a inbox UI ·
// retorna [{ threadId, peerHandle, lastMessage, unreadCount }]
export function listConversations(allMessages = [], myHandle) {
    const me = _norm(myHandle);
    if (!me) return [];
    const dms = (allMessages || []).filter(m => m && m.type === DM_TYPE &&
        (m.content?.toHandle === me || m.content?.fromHandle === me));
    const byThread = new Map();
    for (const m of dms) {
        const tid = m.content?.threadId;
        if (!tid) continue;
        if (!byThread.has(tid)) byThread.set(tid, []);
        byThread.get(tid).push(m);
    }
    const convs = [];
    for (const [tid, msgs] of byThread.entries()) {
        msgs.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        const last = msgs[msgs.length - 1];
        const peerHandle = last.content.fromHandle === me ? last.content.toHandle : last.content.fromHandle;
        const unreadCount = msgs.filter(m =>
            m.content.toHandle === me && m.content.status !== 'read'
        ).length;
        convs.push({
            threadId: tid,
            peerHandle,
            lastMessage: last,
            unreadCount,
            totalCount: msgs.length,
        });
    }
    convs.sort((a, b) => (b.lastMessage?.createdAt || 0) - (a.lastMessage?.createdAt || 0));
    return convs;
}

// countUnread · pure · per a badge a nav
export function countUnread(allMessages = [], myHandle) {
    const me = _norm(myHandle);
    if (!me) return 0;
    return (allMessages || []).filter(m =>
        m && m.type === DM_TYPE &&
        m.content?.toHandle === me &&
        m.content?.status !== 'read'
    ).length;
}

// markAsRead · pure · retorna versió actualitzada d'un missatge · status='read'
export function markAsRead(message, { ts = null } = {}) {
    if (!message) throw new Error('markAsRead · message required');
    if (message.content?.status === 'read') return message;
    return {
        ...message,
        content: { ...message.content, status: 'read', readAt: (typeof ts === 'number') ? ts : Date.now() },
        updatedAt: (typeof ts === 'number') ? ts : Date.now(),
    };
}

// markAsDelivered · pure · status='delivered' (després de sync confirmat)
export function markAsDelivered(message, { ts = null } = {}) {
    if (!message) throw new Error('markAsDelivered · message required');
    if (message.content?.status === 'read' || message.content?.status === 'delivered') return message;
    return {
        ...message,
        content: { ...message.content, status: 'delivered', deliveredAt: (typeof ts === 'number') ? ts : Date.now() },
        updatedAt: (typeof ts === 'number') ? ts : Date.now(),
    };
}

// validateMessage · pure · schema check · per a sync
export function validateMessage(m) {
    const errors = [];
    if (!m || typeof m !== 'object') return { ok: false, errors: ['not object'] };
    if (m.type !== DM_TYPE) errors.push('type must be ' + DM_TYPE);
    if (!m.content) errors.push('content required');
    if (m.content) {
        if (!m.content.fromHandle) errors.push('fromHandle required');
        if (!m.content.toHandle) errors.push('toHandle required');
        if (!m.content.text) errors.push('text required');
        if (!m.content.threadId) errors.push('threadId required');
        if (m.content.status && !DM_STATUS.includes(m.content.status)) {
            errors.push('status invalid · ' + m.content.status);
        }
    }
    if (!m.id) errors.push('id required');
    if (!m.createdAt) errors.push('createdAt required');
    return { ok: errors.length === 0, errors };
}
