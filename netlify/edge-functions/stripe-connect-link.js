// =============================================================================
// TEAMTOWERS SOS V11 — STRIPE CONNECT ONBOARDING LINK (STRIPE-CONNECT-001)
// Ubicació: netlify/edge-functions/stripe-connect-link.js
//
// Crea l'account Stripe Express (si no existeix) + Account Link per al
// flux d'onboarding · retorna { accountId, url, expiresAt }.
//
// Setup · Netlify env vars:
//   STRIPE_SECRET_KEY · sk_live_... o sk_test_... · NO al client
//
// Stripe Connect setup (Dashboard):
//   1. dashboard.stripe.com → Settings → Connect
//   2. Activa "Express accounts"
//   3. Defineix Brand · logo · colors · suport email
//   4. Branding · es mostra durant onboarding al usuari final
//
// El client envia POST amb:
//   { userHandle, email?, returnUrl, refreshUrl }
// =============================================================================

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin':  '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

async function stripeRequest(path, secretKey, formData) {
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries(formData || {})) {
        if (v !== undefined && v !== null) body.append(k, String(v));
    }
    const res = await fetch(STRIPE_API_BASE + path, {
        method:  'POST',
        headers: {
            'Authorization': 'Bearer ' + secretKey,
            'Content-Type':  'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    });
    return res;
}

export default async (request, context) => {
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin':  '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }
    if (request.method !== 'POST') {
        return jsonResponse({ error: 'POST required' }, 405);
    }

    const secretKey = (typeof Deno !== 'undefined' && Deno.env && Deno.env.get('STRIPE_SECRET_KEY'))
        || (typeof process !== 'undefined' && process.env && process.env.STRIPE_SECRET_KEY);
    if (!secretKey) return jsonResponse({ error: 'STRIPE_SECRET_KEY not configured' }, 500);

    let body;
    try { body = await request.json(); } catch (_) { return jsonResponse({ error: 'Invalid JSON' }, 400); }
    const { userHandle, email, returnUrl, refreshUrl, existingAccountId } = body || {};
    if (!userHandle) return jsonResponse({ error: 'userHandle required' }, 400);
    if (!returnUrl)  return jsonResponse({ error: 'returnUrl required' }, 400);
    const finalRefresh = refreshUrl || returnUrl;

    // 1. Create account if not existing
    let accountId = existingAccountId;
    if (!accountId) {
        const createRes = await stripeRequest('/accounts', secretKey, {
            'type':                        'express',
            'email':                       email || '',
            'metadata[sos_user_handle]':   userHandle,
            'capabilities[transfers][requested]': 'true',
            'capabilities[card_payments][requested]': 'true',
        });
        if (!createRes.ok) {
            let detail = null;
            try { detail = (await createRes.json())?.error?.message; } catch (_) {}
            return jsonResponse({ error: 'stripe-create-account-failed', detail, status: createRes.status }, createRes.status);
        }
        const created = await createRes.json();
        accountId = created.id;
    }

    // 2. Create Account Link for onboarding
    const linkRes = await stripeRequest('/account_links', secretKey, {
        'account':     accountId,
        'refresh_url': finalRefresh,
        'return_url':  returnUrl,
        'type':        'account_onboarding',
    });
    if (!linkRes.ok) {
        let detail = null;
        try { detail = (await linkRes.json())?.error?.message; } catch (_) {}
        return jsonResponse({ error: 'stripe-link-failed', detail, status: linkRes.status, accountId }, linkRes.status);
    }
    const link = await linkRes.json();

    return jsonResponse({
        accountId,
        url:       link.url,
        expiresAt: link.expires_at,
    });
};

export const config = { path: '/api/stripe-connect-link' };
