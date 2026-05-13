// =============================================================================
// TEAMTOWERS SOS V11 — STRIPE CONNECT STATUS (STRIPE-CONNECT-001)
// Ubicació: netlify/edge-functions/stripe-connect-status.js
//
// Verifica l'estat actual d'un Stripe Express account · charges_enabled,
// payouts_enabled, details_submitted · útil pre-checkout per al frontend
// per decidir si el botó "Comprar" està actiu.
//
// GET /api/stripe-connect-status?accountId=acct_xxx
// =============================================================================

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin':  '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

export default async (request, context) => {
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin':  '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }
    if (request.method !== 'GET') {
        return jsonResponse({ error: 'GET required' }, 405);
    }

    const url = new URL(request.url);
    const accountId = url.searchParams.get('accountId');
    if (!accountId || !/^acct_[a-zA-Z0-9]+$/.test(accountId)) {
        return jsonResponse({ error: 'invalid-accountId' }, 400);
    }

    const secretKey = (typeof Deno !== 'undefined' && Deno.env && Deno.env.get('STRIPE_SECRET_KEY'))
        || (typeof process !== 'undefined' && process.env && process.env.STRIPE_SECRET_KEY);
    if (!secretKey) return jsonResponse({ error: 'STRIPE_SECRET_KEY not configured' }, 500);

    const res = await fetch(STRIPE_API_BASE + '/accounts/' + encodeURIComponent(accountId), {
        headers: { 'Authorization': 'Bearer ' + secretKey },
    });
    if (!res.ok) {
        let detail = null;
        try { detail = (await res.json())?.error?.message; } catch (_) {}
        return jsonResponse({ error: 'stripe-fetch-failed', detail, status: res.status }, res.status);
    }
    const acct = await res.json();
    const chargesEnabled   = !!acct.charges_enabled;
    const payoutsEnabled   = !!acct.payouts_enabled;
    const detailsSubmitted = !!acct.details_submitted;
    return jsonResponse({
        accountId:        acct.id,
        chargesEnabled,
        payoutsEnabled,
        detailsSubmitted,
        ready:            chargesEnabled && detailsSubmitted,
        country:          acct.country,
        defaultCurrency:  acct.default_currency,
        requirements:     acct.requirements ? {
            currentlyDue:    acct.requirements.currently_due || [],
            eventuallyDue:   acct.requirements.eventually_due || [],
            pastDue:         acct.requirements.past_due || [],
        } : null,
    });
};

export const config = { path: '/api/stripe-connect-status' };
