// =============================================================================
// TEAMTOWERS SOS V11 — STRIPE CHECKOUT WITH CONNECT (STRIPE-CONNECT-001)
// Ubicació: netlify/edge-functions/stripe-checkout-product.js
//
// Crea una Stripe Checkout Session per a un producte d'un seller (SOS user
// amb compte Connect Express). Aplica platform fee automàtica i transfer
// data al compte del seller · funds van directament al compte del seller
// menys la fee de SOS.
//
// Flux des del frontend:
//   POST /api/stripe-checkout-product
//   {
//     sellerAccountId · 'acct_xxx' (de l'usuari SOS venedor)
//     priceCents      · amount en cèntims · ex. 2500 = 25.00 EUR
//     feeCents        · platform fee en cèntims · ex. 200 = 2.00 EUR (8%)
//     currency        · 'eur' default
//     productName     · nom mostrat al checkout
//     productDescription · opcional
//     customerEmail   · opcional · pre-fill al checkout
//     metadata        · { workshopId, projectId, sosUserHandle, ... }
//     successUrl      · on redirigeix post-pagament
//     cancelUrl       · on redirigeix si cancel·la
//   }
//
// Retorna · { sessionId, url }
//
// Defensives:
//   - Stripe valida que sellerAccountId existeix i té charges_enabled
//   - Si fails · retornem 4xx amb missatge clar al frontend
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
    const {
        sellerAccountId, priceCents, feeCents = 0,
        currency = 'eur', productName, productDescription = null,
        customerEmail = null, metadata = {},
        successUrl, cancelUrl,
    } = body || {};
    if (!sellerAccountId || !/^acct_[a-zA-Z0-9]+$/.test(sellerAccountId)) {
        return jsonResponse({ error: 'invalid-sellerAccountId' }, 400);
    }
    if (typeof priceCents !== 'number' || priceCents < 50) {
        return jsonResponse({ error: 'priceCents must be ≥50 (Stripe min)' }, 400);
    }
    if (!productName) return jsonResponse({ error: 'productName required' }, 400);
    if (!successUrl)  return jsonResponse({ error: 'successUrl required' }, 400);
    if (!cancelUrl)   return jsonResponse({ error: 'cancelUrl required' }, 400);
    if (feeCents < 0 || feeCents > priceCents) {
        return jsonResponse({ error: 'feeCents invalid' }, 400);
    }

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', successUrl);
    params.append('cancel_url',  cancelUrl);
    if (customerEmail) params.append('customer_email', customerEmail);
    params.append('line_items[0][price_data][currency]',    currency);
    params.append('line_items[0][price_data][unit_amount]', String(priceCents));
    params.append('line_items[0][price_data][product_data][name]', productName);
    if (productDescription) {
        params.append('line_items[0][price_data][product_data][description]', String(productDescription).slice(0, 500));
    }
    params.append('line_items[0][quantity]', '1');
    // Application fee + transfer to seller (Stripe Connect)
    if (feeCents > 0) {
        params.append('payment_intent_data[application_fee_amount]', String(feeCents));
    }
    params.append('payment_intent_data[transfer_data][destination]', sellerAccountId);
    // Metadata (workshop id · seller handle · etc.)
    for (const [k, v] of Object.entries(metadata || {})) {
        if (v !== undefined && v !== null) params.append('metadata[' + k + ']', String(v));
    }

    const res = await fetch(STRIPE_API_BASE + '/checkout/sessions', {
        method:  'POST',
        headers: {
            'Authorization': 'Bearer ' + secretKey,
            'Content-Type':  'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });
    if (!res.ok) {
        let detail = null;
        try { detail = (await res.json())?.error?.message; } catch (_) {}
        return jsonResponse({ error: 'stripe-checkout-failed', detail, status: res.status }, res.status);
    }
    const session = await res.json();
    return jsonResponse({
        sessionId: session.id,
        url:       session.url,
        amountTotal: session.amount_total,
        currency:    session.currency,
        livemode:    session.livemode,
    });
};

export const config = { path: '/api/stripe-checkout-product' };
