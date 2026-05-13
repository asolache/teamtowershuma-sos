// =============================================================================
// TEAMTOWERS SOS V11 — OAUTH SERVICE (WALLET-AUTH-001 sprint C)
//
// Client-side helpers per al flux OAuth · onboarding ràpid per a stakeholders
// no-cripto. Filosofia · OAuth és VERIFICACIÓ opcional · el DID local-first
// segueix sent l'identificador canònic. Vincular GitHub/Google/Magic-link
// permet que altres operadors et trobin pel teu username conegut.
//
// Flux GitHub (canonical):
//   1. Usuari clica "Connect GitHub" · loginWithGithub() obre popup a
//      /api/oauth-github-init que redirigeix a GitHub authorize URL
//   2. Usuari autoritza · GitHub redirigeix a /api/oauth-github-callback
//   3. La Edge Function intercanvia code → access_token (server-side amb
//      client_secret · zero secret al client) · fetcha /user · envia
//      `postMessage` al opener amb { provider:'github', userId, login,
//      name, email, verifiedAt }
//   4. Listener al client · linkProviderToIdentity() persisteix a
//      matriu_member.oauthProviders[]
//
// Same pattern per Google. Magic-link · variant amb email + token signat.
//
// PURO · zero global state · injectable per tests.
// =============================================================================

const OAUTH_INIT_ENDPOINTS = Object.freeze({
    github: '/api/oauth-github-init',
    google: '/api/oauth-google-init',
});

export const SUPPORTED_PROVIDERS = Object.freeze(['github', 'google', 'magic-link']);

// _openOauthPopup · pur · obre window centrada · retorna handle
function _openOauthPopup(url, name = 'sos-oauth') {
    if (typeof window === 'undefined') return null;
    const w = 600;
    const h = 720;
    const left = (window.screen.width  / 2) - (w / 2);
    const top  = (window.screen.height / 2) - (h / 2);
    return window.open(url, name, `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=yes`);
}

// _waitForMessage · pur · escolta postMessage del popup · resolv/reject amb timeout
function _waitForMessage({ provider, timeoutMs = 120000, expectedOrigin = null } = {}) {
    if (typeof window === 'undefined') return Promise.reject(new Error('no-window'));
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            window.removeEventListener('message', onMsg);
            reject(new Error('oauth-timeout · ' + provider));
        }, timeoutMs);
        function onMsg(ev) {
            // Defensive · acceptem només postMessage del nostre propi origin
            if (expectedOrigin && ev.origin !== expectedOrigin) return;
            const data = ev?.data;
            if (!data || data.type !== 'sos-oauth' || data.provider !== provider) return;
            window.removeEventListener('message', onMsg);
            clearTimeout(timer);
            if (data.error) reject(new Error('oauth-error · ' + data.error));
            else            resolve(data);
        }
        window.addEventListener('message', onMsg);
    });
}

// loginWithProvider · async · genèric per github/google
//   Returns · { provider, userId, login, name, email, avatarUrl, verifiedAt }
export async function loginWithProvider(provider, { stateNonce = null, expectedOrigin = null } = {}) {
    if (!OAUTH_INIT_ENDPOINTS[provider]) throw new Error('Unsupported provider · ' + provider);
    const nonce = stateNonce || (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
    const url = OAUTH_INIT_ENDPOINTS[provider] + '?state=' + encodeURIComponent(nonce);
    const popup = _openOauthPopup(url, 'sos-oauth-' + provider);
    if (!popup) throw new Error('popup-blocked · permet popups al navegador');
    try {
        const data = await _waitForMessage({
            provider,
            expectedOrigin: expectedOrigin || (typeof window !== 'undefined' ? window.location.origin : null),
        });
        if (data.state !== nonce) {
            throw new Error('oauth-state-mismatch · possible CSRF');
        }
        return data;
    } finally {
        try { popup.close(); } catch (_) {}
    }
}

export async function loginWithGithub(opts = {}) { return loginWithProvider('github', opts); }
export async function loginWithGoogle(opts = {}) { return loginWithProvider('google', opts); }

// ─── Magic-link · variant per email · sense popup ──────────────────────
// Flux · 1) frontend crida /api/oauth-magic-request amb email · 2) backend
// genera token signat (HMAC) · l'envia per email amb link · 3) usuari
// clica link · /api/oauth-magic-verify rep el token · valida · postMessage
// (si obert via popup) o redirect (si link directe).
export async function requestMagicLink(email, { endpoint = '/api/oauth-magic-request', fetchFn = (typeof fetch !== 'undefined' ? fetch : null) } = {}) {
    if (typeof email !== 'string' || !email.includes('@')) throw new Error('Invalid email');
    if (!fetchFn) throw new Error('fetch unavailable');
    const res = await fetchFn(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    let data; try { data = await res.json(); } catch (_) { data = null; }
    if (!res.ok) throw new Error('magic-request-failed · ' + (data?.error || res.status));
    return data || { ok: true, sent: true };
}

// ─── KB persistence · vincula provider a matriu_member ─────────────────
//
// Schema · matriu_member.content.oauthProviders[]:
//   [{ provider, userId, login, name, email, avatarUrl, verifiedAt }]
//
// Defensive · NO emmagatzemem access_token al client. La verificació es
// fa server-side cada vegada. El client sols porta la dada pública.

export async function linkProviderToIdentity(providerData, { kb = null, member = null } = {}) {
    if (!providerData || !providerData.provider || !providerData.userId) {
        throw new Error('linkProviderToIdentity · missing provider/userId');
    }
    let KB = kb;
    if (!KB) { try { KB = (await import('./kb.js')).KB; } catch (_) {} }
    if (!KB) throw new Error('KB unavailable');

    let target = member;
    if (!target) {
        try {
            const all = await KB.query({ type: 'matriu_member' });
            target = (all || []).find(m => m && (m.content?.isPrimary || m.isPrimary));
        } catch (_) {}
    }
    if (!target) {
        // Crea node minim · l'usuari refinarà a /identity
        const now = Date.now();
        target = {
            id:   'matriu-member-primary',
            type: 'matriu_member',
            content: {
                isPrimary:      true,
                handle:         '@' + (providerData.login || 'anon'),
                displayName:    providerData.name || providerData.login || 'Operador',
                oauthProviders: [],
                createdAt:      now,
            },
            keywords:  ['type:matriu-member', 'oauth-link:' + providerData.provider],
            createdAt: now,
            updatedAt: now,
        };
    }
    const c = target.content = target.content || {};
    if (!Array.isArray(c.oauthProviders)) c.oauthProviders = [];
    // Replace existing entry for the same provider
    c.oauthProviders = c.oauthProviders.filter(p => p?.provider !== providerData.provider);
    c.oauthProviders.push({
        provider:    providerData.provider,
        userId:      String(providerData.userId),
        login:       providerData.login || null,
        name:        providerData.name  || null,
        email:       providerData.email || null,
        avatarUrl:   providerData.avatarUrl || null,
        verifiedAt:  providerData.verifiedAt || Date.now(),
    });
    target.updatedAt = Date.now();
    await KB.upsert(target);
    return target;
}

export async function unlinkProvider(provider, { kb = null } = {}) {
    if (!provider) throw new Error('unlinkProvider requires provider');
    let KB = kb;
    if (!KB) { try { KB = (await import('./kb.js')).KB; } catch (_) {} }
    if (!KB) throw new Error('KB unavailable');
    const all = await KB.query({ type: 'matriu_member' });
    const target = (all || []).find(m => m && (m.content?.isPrimary || m.isPrimary));
    if (!target) return null;
    const c = target.content;
    if (!Array.isArray(c.oauthProviders)) return target;
    c.oauthProviders = c.oauthProviders.filter(p => p?.provider !== provider);
    target.updatedAt = Date.now();
    await KB.upsert(target);
    return target;
}

export async function getOAuthProviders({ kb = null } = {}) {
    let KB = kb;
    if (!KB) { try { KB = (await import('./kb.js')).KB; } catch (_) { return []; } }
    try {
        const all = await KB.query({ type: 'matriu_member' });
        const target = (all || []).find(m => m && (m.content?.isPrimary || m.isPrimary));
        return target?.content?.oauthProviders || [];
    } catch (_) { return []; }
}
