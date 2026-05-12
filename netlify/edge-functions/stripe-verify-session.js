// =============================================================================
// TEAMTOWERS SOS V11 — STRIPE VERIFY SESSION (BIZ-MODEL-001 sprint A)
// Ubicació: netlify/edge-functions/stripe-verify-session.js
//
// Edge Function que verifica una Stripe Checkout Session via Stripe API.
// Filosofia · zero secret key al client; el client passa només el sessionId
// que prové del success_url del Payment Link · aquí (server-side) verifiquem
// que la sessió existeix, està pagada, i retornem amount + currency. El
// client (WalletView) aplicarà el top-up al wallet local si verifiquem OK.
//
// Setup env var · STRIPE_SECRET_KEY (sk_test_... per test · sk_live_... per
// alfa pública) al Netlify Dashboard → Site → Environment variables.
//
// Endpoint · POST /api/stripe-verify-session
// Body     · { sessionId: "cs_test_..." }
// Response · { verified, amountTotal, currency, status, paymentStatus, clientReferenceId, customerEmail, metadata }
//             o { error: "..." } amb status 4xx/5xx
// =============================================================================

const STRIPE_API = 'https://api.stripe.com/v1/checkout/sessions';

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

function looksLikeSessionId(s) {
    if (typeof s !== 'string') return false;
    return /^cs_(test|live)_[a-zA-Z0-9_]{10,}$/.test(s);
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
        return jsonResponse({ error: 'Method not allowed · use POST' }, 405);
    }

    const secretKey = (typeof Deno !== 'undefined' && Deno.env && Deno.env.get('STRIPE_SECRET_KEY'))
        || (typeof process !== 'undefined' && process.env && process.env.STRIPE_SECRET_KEY)
        || null;
    if (!secretKey) {
        return jsonResponse({ error: 'STRIPE_SECRET_KEY not configured at Netlify env vars' }, 500);
    }

    let body;
    try {
        body = await request.json();
    } catch (_) {
        return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }
    const sessionId = body && body.sessionId;
    if (!sessionId || !looksLikeSessionId(sessionId)) {
        return jsonResponse({ error: 'sessionId invàlid · cal cs_test_... o cs_live_...' }, 400);
    }

    let stripeRes;
    try {
        stripeRes = await fetch(STRIPE_API + '/' + encodeURIComponent(sessionId), {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + secretKey,
                'Stripe-Version': '2024-11-20.acacia',
            },
        });
    } catch (e) {
        return jsonResponse({ error: 'Stripe API fetch failed: ' + (e?.message || 'unknown') }, 502);
    }
    if (!stripeRes.ok) {
        let errBody = null;
        try { errBody = await stripeRes.json(); } catch (_) {}
        return jsonResponse({
            error:  'Stripe error · status ' + stripeRes.status,
            detail: errBody?.error?.message || null,
        }, stripeRes.status);
    }

    let session;
    try {
        session = await stripeRes.json();
    } catch (_) {
        return jsonResponse({ error: 'Stripe response not JSON' }, 502);
    }

    // Defensiu · només considerem "verified" si:
    //   - session.status === 'complete'
    //   - payment_status === 'paid'
    //   - amount_total > 0
    const verified = session.status === 'complete'
        && session.payment_status === 'paid'
        && typeof session.amount_total === 'number'
        && session.amount_total > 0;

    return jsonResponse({
        verified,
        sessionId,
        amountTotal:        session.amount_total       || null,    // en cèntims
        currency:           session.currency           || null,
        status:             session.status             || null,
        paymentStatus:      session.payment_status     || null,
        clientReferenceId:  session.client_reference_id || null,
        customerEmail:      session.customer_details?.email || session.customer_email || null,
        metadata:           session.metadata           || null,
    });
};

export const config = { path: '/api/stripe-verify-session' };
