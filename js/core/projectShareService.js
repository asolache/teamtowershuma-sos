// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT SHARE SERVICE (SOCIAL-SHARE-001)
// Ruta · /js/core/projectShareService.js
//
// Permet · donar accés a un projecte a usuaris específics · marcar parts
// públiques · generar share links. Granular access · 3 nivells ·
//   - private  · només creator + assigned users
//   - shared   · creator + assigned + invited handles
//   - public   · qualsevol via link (read-only)
//
// Aprofita publicProjectService existent per a publicació permaweb · aquest
// service afegeix la capa d'access control local-first.
//
// Pure · zero KB · zero DOM.
// =============================================================================

export const ACCESS_LEVELS = Object.freeze(['private', 'shared', 'public']);

// _norm · pure · normalitza handle (@ prefix)
function _norm(h) {
    if (!h) return null;
    const s = String(h).trim();
    return s.startsWith('@') ? s : '@' + s;
}

// buildShareConfig · pure · genera config inicial · accessLevel='private'
export function buildShareConfig({ creatorHandle, ts = null } = {}) {
    if (!creatorHandle) throw new Error('buildShareConfig · creatorHandle required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        accessLevel: 'private',
        creatorHandle: _norm(creatorHandle),
        invitedHandles: [],
        publicShareToken: null,        // token segur per a share link · 'shared' mode
        createdAt: now,
        updatedAt: now,
    };
}

// inviteUser · pure · afegeix un handle a la llista invitada · access shared
export function inviteUser(config, handle, { ts = null } = {}) {
    if (!config) throw new Error('inviteUser · config required');
    if (!handle) throw new Error('inviteUser · handle required');
    const h = _norm(handle);
    if (h === config.creatorHandle) throw new Error('inviteUser · creator is implicit');
    const now = (typeof ts === 'number') ? ts : Date.now();
    if ((config.invitedHandles || []).includes(h)) {
        return config;        // idempotent
    }
    return {
        ...config,
        invitedHandles: [...(config.invitedHandles || []), h],
        accessLevel: config.accessLevel === 'private' ? 'shared' : config.accessLevel,
        updatedAt: now,
    };
}

// uninviteUser · pure · treu un handle
export function uninviteUser(config, handle, { ts = null } = {}) {
    if (!config) throw new Error('uninviteUser · config required');
    const h = _norm(handle);
    const now = (typeof ts === 'number') ? ts : Date.now();
    const remaining = (config.invitedHandles || []).filter(x => x !== h);
    return {
        ...config,
        invitedHandles: remaining,
        accessLevel: remaining.length === 0 && config.accessLevel === 'shared'
            ? 'private'
            : config.accessLevel,
        updatedAt: now,
    };
}

// _generateToken · pure-ish · genera token random (base36) · 12 chars
function _generateToken() {
    const a = Date.now().toString(36);
    const b = Math.random().toString(36).slice(2, 8);
    return (a + b).slice(0, 14);
}

// setPublic · pure · public mode · genera token si no existeix
export function setPublic(config, { ts = null } = {}) {
    if (!config) throw new Error('setPublic · config required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...config,
        accessLevel: 'public',
        publicShareToken: config.publicShareToken || _generateToken(),
        updatedAt: now,
    };
}

// setPrivate · pure · revoca tot · invalida token public
export function setPrivate(config, { ts = null } = {}) {
    if (!config) throw new Error('setPrivate · config required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...config,
        accessLevel: 'private',
        publicShareToken: null,
        updatedAt: now,
    };
}

// rotatePublicToken · pure · revoca link existent · genera nou (logout massive)
export function rotatePublicToken(config, { ts = null } = {}) {
    if (!config) throw new Error('rotatePublicToken · config required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...config,
        publicShareToken: _generateToken(),
        updatedAt: now,
    };
}

// ── Access checks · pure ──────────────────────────────────────────────────

// canView · pure · pot un usuari (o anònim) veure el projecte?
//
// args ·
//   config · share config del projecte
//   viewerHandle · handle de qui mira (null = anònim)
//   providedToken · token del URL si ve via share link (?token=X)
//
// Retorna · bool
export function canView({ config, viewerHandle = null, providedToken = null } = {}) {
    if (!config) return false;
    if (config.accessLevel === 'public') {
        // Public · si token vàlid · ok · si no · cap fricció igual (anyone)
        // Token serveix per a tracking · NO per a denial (read-only públic)
        return true;
    }
    const me = viewerHandle ? _norm(viewerHandle) : null;
    if (config.accessLevel === 'shared') {
        if (me === config.creatorHandle) return true;
        if (me && (config.invitedHandles || []).includes(me)) return true;
        // Si proveeix token vàlid · també access (link compartit)
        if (providedToken && providedToken === config.publicShareToken) return true;
        return false;
    }
    // private · només creator
    return me === config.creatorHandle;
}

// canEdit · més restrictiu que canView · només creator + invited
export function canEdit({ config, viewerHandle } = {}) {
    if (!config) return false;
    const me = viewerHandle ? _norm(viewerHandle) : null;
    if (!me) return false;
    if (me === config.creatorHandle) return true;
    if (config.accessLevel === 'shared' && (config.invitedHandles || []).includes(me)) {
        return true;
    }
    return false;
}

// ── Share URL · pure ──────────────────────────────────────────────────────

// buildShareUrl · pure · genera URL share complet · usable per a copy-paste
export function buildShareUrl({ projectId, config, baseOrigin = '' } = {}) {
    if (!projectId || !config) return null;
    const origin = baseOrigin || (typeof window !== 'undefined' && window.location ? window.location.origin : '');
    if (config.accessLevel === 'public' || (config.accessLevel === 'shared' && config.publicShareToken)) {
        const token = config.publicShareToken;
        return origin + '/project/' + encodeURIComponent(projectId) + (token ? '?token=' + encodeURIComponent(token) : '');
    }
    // Private · només link normal (require login)
    return origin + '/project/' + encodeURIComponent(projectId);
}

// summarize · pure · stats per a UI
export function summarizeShareConfig(config) {
    if (!config) return null;
    return {
        accessLevel: config.accessLevel,
        invitedCount: (config.invitedHandles || []).length,
        hasPublicLink: !!config.publicShareToken,
        creatorHandle: config.creatorHandle,
    };
}
