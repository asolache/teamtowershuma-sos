// =============================================================================
// TEAMTOWERS SOS V11 — SOCIAL GRAPH SERVICE (SOCIAL-LAYER-001 part)
// Ruta · /js/core/socialGraphService.js
//
// Following/followers · pure social primitives sobre attestations existents.
// Reusa el schema d'attestation (kind:'follow' = trust signal explícit).
//
// NO crea schema nou · NO afegeix nodes nous · només deriva relacions des
// del KB existent. KISS · DRY · zero migració.
//
// Funcions ·
//   buildFollowGraph(attestations) → { followers, following, mutual }
//   followCounts({ handle, attestations }) → { followers, following, mutual }
//   listFollowers(handle, attestations) → handles[]
//   listFollowing(handle, attestations) → handles[]
//   isMutual(a, b, attestations) → bool
//
// Pure · zero DOM · zero async.
// =============================================================================

// FOLLOW_KIND · convenció · attestation amb content.kind='follow' i
// content.targetHandle = qui es segueix. content.attesterHandle = qui segueix.
export const FOLLOW_KIND = 'follow';

// _normalizeHandle · garantitza prefix @
function _normalizeHandle(h) {
    if (!h) return null;
    const s = String(h).trim();
    return s.startsWith('@') ? s : '@' + s;
}

// _isFollowAtt · pure · accepta vàries variants d'esquema (defensive)
function _isFollowAtt(att) {
    if (!att || !att.content) return false;
    const k = att.content.kind || att.content.relationKind || att.kind;
    return k === FOLLOW_KIND;
}

// buildFollowGraph · pure · construeix mapes des d'una llista d'attestations
//
// Retorna ·
//   {
//     edges: [{ from, to, attestationId, ts }],
//     byFollower:  Map<handle, Set<targetHandle>>,    // qui segueixo
//     byFollowing: Map<handle, Set<followerHandle>>,  // qui em segueix
//   }
export function buildFollowGraph(attestations = []) {
    const edges = [];
    const byFollower = new Map();
    const byFollowing = new Map();
    for (const att of (attestations || [])) {
        if (!_isFollowAtt(att)) continue;
        const from = _normalizeHandle(att.content.attesterHandle || att.content.fromHandle);
        const to   = _normalizeHandle(att.content.targetHandle  || att.content.toHandle);
        if (!from || !to || from === to) continue;
        edges.push({ from, to, attestationId: att.id, ts: att.createdAt || 0 });
        if (!byFollower.has(from)) byFollower.set(from, new Set());
        if (!byFollowing.has(to)) byFollowing.set(to, new Set());
        byFollower.get(from).add(to);
        byFollowing.get(to).add(from);
    }
    return { edges, byFollower, byFollowing };
}

// followCounts · pure · resum per a un handle
export function followCounts({ handle, attestations = [] } = {}) {
    if (!handle) return { followers: 0, following: 0, mutual: 0 };
    const h = _normalizeHandle(handle);
    const g = buildFollowGraph(attestations);
    const following = g.byFollower.get(h) || new Set();
    const followers = g.byFollowing.get(h) || new Set();
    let mutual = 0;
    for (const f of following) {
        if (followers.has(f)) mutual++;
    }
    return {
        followers: followers.size,
        following: following.size,
        mutual,
    };
}

// listFollowers · pure · handles que segueixen H
export function listFollowers(handle, attestations = []) {
    if (!handle) return [];
    const h = _normalizeHandle(handle);
    const g = buildFollowGraph(attestations);
    return Array.from(g.byFollowing.get(h) || new Set());
}

// listFollowing · pure · handles que H segueix
export function listFollowing(handle, attestations = []) {
    if (!handle) return [];
    const h = _normalizeHandle(handle);
    const g = buildFollowGraph(attestations);
    return Array.from(g.byFollower.get(h) || new Set());
}

// isMutual · pure · A segueix B i B segueix A?
export function isMutual(a, b, attestations = []) {
    if (!a || !b) return false;
    const A = _normalizeHandle(a);
    const B = _normalizeHandle(b);
    if (A === B) return false;
    const g = buildFollowGraph(attestations);
    const aFollowsB = g.byFollower.get(A)?.has(B) || false;
    const bFollowsA = g.byFollower.get(B)?.has(A) || false;
    return aFollowsB && bFollowsA;
}

// isFollowing · pure · A segueix B?
export function isFollowing(a, b, attestations = []) {
    if (!a || !b) return false;
    const A = _normalizeHandle(a);
    const B = _normalizeHandle(b);
    if (A === B) return false;
    const g = buildFollowGraph(attestations);
    return g.byFollower.get(A)?.has(B) || false;
}

// buildFollowAttestation · pure · crea l'attestation perquè un wrapper
// (UI) la pugui upsert al KB. NO toca KB · NO firma · NO persisteix.
//
// El wrapper signara amb ECDSA i upsertara via attestationService.
export function buildFollowAttestation({
    attesterHandle, targetHandle, ts = null, statement = null,
} = {}) {
    if (!attesterHandle || !targetHandle) {
        throw new Error('buildFollowAttestation · handles required');
    }
    const A = _normalizeHandle(attesterHandle);
    const T = _normalizeHandle(targetHandle);
    if (A === T) throw new Error('buildFollowAttestation · no self-follow');
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        id: 'att-follow-' + A.replace(/^@/, '') + '-to-' + T.replace(/^@/, '') + '-' + now.toString(36),
        type: 'attestation',
        content: {
            kind: FOLLOW_KIND,
            attesterHandle: A,
            targetHandle: T,
            statement: statement || (A + ' segueix ' + T),
            relationKind: 'follow',
        },
        keywords: ['type:attestation', 'kind:follow', 'from:' + A, 'to:' + T],
        createdAt: now,
        updatedAt: now,
    };
}

// computeTopFollowed · pure · ranking dels més seguits
export function computeTopFollowed(attestations = [], { limit = 10 } = {}) {
    const g = buildFollowGraph(attestations);
    const sorted = Array.from(g.byFollowing.entries())
        .map(([handle, followers]) => ({ handle, count: followers.size }))
        .sort((a, b) => b.count - a.count);
    return sorted.slice(0, limit);
}

// computeNetworkStats · pure · resum global del social graph
export function computeNetworkStats(attestations = []) {
    const g = buildFollowGraph(attestations);
    const handles = new Set();
    for (const e of g.edges) {
        handles.add(e.from);
        handles.add(e.to);
    }
    let mutualEdges = 0;
    for (const e of g.edges) {
        if (g.byFollower.get(e.to)?.has(e.from)) mutualEdges++;
    }
    return {
        totalEdges: g.edges.length,
        totalParticipants: handles.size,
        mutualPairs: Math.floor(mutualEdges / 2),    // div 2 per evitar doble-comptar
    };
}
