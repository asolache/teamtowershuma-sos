// =============================================================================
// TEAMTOWERS SOS V11 — OAUTH GITHUB INIT (WALLET-AUTH-001 sprint C)
// Ubicació: netlify/edge-functions/oauth-github-init.js
//
// Inicia el flow OAuth GitHub · redirigeix al user a github.com/authorize
// amb el client_id (env GITHUB_OAUTH_CLIENT_ID) + scope mínim · state nonce
// passat com a query · GitHub el torna inalterat al callback (CSRF defensive).
//
// Setup · Netlify env vars necessaris:
//   GITHUB_OAUTH_CLIENT_ID     · public id de la GitHub OAuth App
//   GITHUB_OAUTH_CLIENT_SECRET · secret (sols al callback)
//   OAUTH_REDIRECT_BASE        · ex. https://teamtowershuma.com
//
// GitHub OAuth App setup (instruccions):
//   1. github.com/settings/developers → OAuth Apps → New
//   2. Authorization callback URL · https://teamtowershuma.com/api/oauth-github-callback
//   3. Copia Client ID + Client Secret · enganxa als env vars Netlify
// =============================================================================

const GITHUB_AUTHORIZE = 'https://github.com/login/oauth/authorize';
const DEFAULT_SCOPE    = 'read:user user:email';

export default async (request, context) => {
    const url = new URL(request.url);
    const state = url.searchParams.get('state') || '';
    if (!state || state.length < 8) {
        return new Response('Missing or invalid state parameter', { status: 400 });
    }
    const clientId = (typeof Deno !== 'undefined' && Deno.env && Deno.env.get('GITHUB_OAUTH_CLIENT_ID'))
        || (typeof process !== 'undefined' && process.env && process.env.GITHUB_OAUTH_CLIENT_ID);
    const redirectBase = (typeof Deno !== 'undefined' && Deno.env && Deno.env.get('OAUTH_REDIRECT_BASE'))
        || (typeof process !== 'undefined' && process.env && process.env.OAUTH_REDIRECT_BASE)
        || url.origin;
    if (!clientId) {
        return new Response('GITHUB_OAUTH_CLIENT_ID not configured at Netlify env vars', { status: 500 });
    }
    const redirectUri = redirectBase + '/api/oauth-github-callback';
    const githubUrl = GITHUB_AUTHORIZE
        + '?client_id='    + encodeURIComponent(clientId)
        + '&redirect_uri=' + encodeURIComponent(redirectUri)
        + '&scope='        + encodeURIComponent(DEFAULT_SCOPE)
        + '&state='        + encodeURIComponent(state)
        + '&allow_signup=true';
    return Response.redirect(githubUrl, 302);
};

export const config = { path: '/api/oauth-github-init' };
