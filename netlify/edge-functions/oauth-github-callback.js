// =============================================================================
// TEAMTOWERS SOS V11 — OAUTH GITHUB CALLBACK (WALLET-AUTH-001 sprint C)
// Ubicació: netlify/edge-functions/oauth-github-callback.js
//
// Rep el callback de GitHub post-autorització · intercanvia code → token
// amb el CLIENT_SECRET (env var · NO al client) · fetcha /user de GitHub ·
// retorna HTML amb postMessage cap al opener window perquè el client
// pugui rebre les dades de l'usuari + persistir-les via oauthService.
//
// Defensives:
//   - State nonce ha de coincidir amb el query string (CSRF protection)
//   - access_token NO es passa al client (sols dades públiques)
//   - Errors retornen també via postMessage per UX consistent
// =============================================================================

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL  = 'https://api.github.com/user';
const GITHUB_EMAILS_URL = 'https://api.github.com/user/emails';

function htmlResponse(content, status = 200) {
    return new Response(content, {
        status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}

function postMessageHtml(payload) {
    // Renderitza HTML que envia postMessage al window.opener · tanca popup
    const data = JSON.stringify({ type: 'sos-oauth', ...payload });
    return htmlResponse(`<!DOCTYPE html>
<html><head><title>SOS · OAuth callback</title>
<style>body{font-family:system-ui;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-size:0.95rem;}</style>
</head><body>
<div style="text-align:center;padding:2rem;">
  <div style="font-size:2rem;">${payload.error ? '✗' : '✓'}</div>
  <div style="margin-top:1rem;color:#aaa;">${payload.error ? 'OAuth ha fallat · pots tancar aquesta finestra.' : 'Autenticat · tancant finestra…'}</div>
</div>
<script>
  try {
    var data = ${data};
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(data, '*');
    }
  } catch (e) {}
  setTimeout(function(){ try { window.close(); } catch (e) {} }, 1500);
</script>
</body></html>`);
}

export default async (request, context) => {
    const url = new URL(request.url);
    const code  = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const errParam = url.searchParams.get('error');

    if (errParam) {
        return postMessageHtml({ provider: 'github', state, error: errParam });
    }
    if (!code || !state) {
        return postMessageHtml({ provider: 'github', state, error: 'missing-code-or-state' });
    }

    const clientId = (typeof Deno !== 'undefined' && Deno.env && Deno.env.get('GITHUB_OAUTH_CLIENT_ID'))
        || (typeof process !== 'undefined' && process.env && process.env.GITHUB_OAUTH_CLIENT_ID);
    const clientSecret = (typeof Deno !== 'undefined' && Deno.env && Deno.env.get('GITHUB_OAUTH_CLIENT_SECRET'))
        || (typeof process !== 'undefined' && process.env && process.env.GITHUB_OAUTH_CLIENT_SECRET);
    if (!clientId || !clientSecret) {
        return postMessageHtml({ provider: 'github', state, error: 'oauth-not-configured' });
    }

    // 1. Exchange code → access_token
    let tokenRes;
    try {
        tokenRes = await fetch(GITHUB_TOKEN_URL, {
            method:  'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body:    JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, state }),
        });
    } catch (e) {
        return postMessageHtml({ provider: 'github', state, error: 'token-fetch-failed' });
    }
    if (!tokenRes.ok) {
        return postMessageHtml({ provider: 'github', state, error: 'token-http-' + tokenRes.status });
    }
    const tokenData = await tokenRes.json();
    if (tokenData.error || !tokenData.access_token) {
        return postMessageHtml({ provider: 'github', state, error: tokenData.error || 'no-access-token' });
    }
    const accessToken = tokenData.access_token;

    // 2. Fetch user profile
    let userRes;
    try {
        userRes = await fetch(GITHUB_USER_URL, {
            headers: { 'Authorization': 'Bearer ' + accessToken, 'Accept': 'application/json', 'User-Agent': 'sos-v11' },
        });
    } catch (e) {
        return postMessageHtml({ provider: 'github', state, error: 'user-fetch-failed' });
    }
    if (!userRes.ok) {
        return postMessageHtml({ provider: 'github', state, error: 'user-http-' + userRes.status });
    }
    const user = await userRes.json();

    // 3. Fetch primary email (sometimes user.email is null)
    let primaryEmail = user.email || null;
    if (!primaryEmail) {
        try {
            const emailsRes = await fetch(GITHUB_EMAILS_URL, {
                headers: { 'Authorization': 'Bearer ' + accessToken, 'Accept': 'application/json', 'User-Agent': 'sos-v11' },
            });
            if (emailsRes.ok) {
                const emails = await emailsRes.json();
                const primary = (emails || []).find(e => e.primary && e.verified) || (emails || [])[0];
                if (primary) primaryEmail = primary.email;
            }
        } catch (_) {}
    }

    // 4. postMessage al opener · zero access_token al payload
    return postMessageHtml({
        provider:   'github',
        state,
        userId:     user.id,
        login:      user.login,
        name:       user.name || user.login,
        email:      primaryEmail,
        avatarUrl:  user.avatar_url,
        verifiedAt: Date.now(),
    });
};

export const config = { path: '/api/oauth-github-callback' };
