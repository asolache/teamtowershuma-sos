// =============================================================================
// TEAMTOWERS SOS V11 — STRIPE CONNECT SERVICE (STRIPE-CONNECT-001 sprint A)
//
// Capa B del business model · cada usuari SOS pot connectar el seu compte
// Stripe Express i cobrar workshops/productes/projectes des de SOS. La
// platform (TeamTowers / @alvaro) reté un percentatge `application_fee`
// configurable per defecte 8% (5% IA margin + 3% Stripe Connect fee).
//
// Flux Connect:
//   1. Usuari clica "Connect Stripe Account" a /settings o /identity
//   2. Frontend crida /api/stripe-connect-link amb { userHandle, email,
//      returnUrl, refreshUrl }
//   3. Edge Function (server-side amb STRIPE_SECRET_KEY):
//        - Si no existeix · stripe.accounts.create({ type:'express', email })
//        - stripe.accountLinks.create({ account, type:'account_onboarding' })
//      Retorna acct_xxx + url
//   4. Frontend persisteix acct_xxx al KB (stripe_connect_account node) +
//      redirigeix a la url d'onboarding
//   5. Usuari completa formularis Stripe · torna al returnUrl
//   6. Frontend crida /api/stripe-connect-status per verificar charges_enabled
//   7. Si verified · workshop/producte/projecte CTA de cobrament passa a
//      activa: createProductCheckout({sellerAccountId, ...})
//
// Flux Checkout amb Connect:
//   1. Buyer clica "Comprar X · 25€" a SOS · createProductCheckout()
//   2. Frontend crida /api/stripe-checkout-product amb { sellerAccountId,
//      priceEur, productName, platformFeePct, successUrl, cancelUrl }
//   3. Edge Function crea Checkout Session amb:
//        payment_intent_data.application_fee_amount = priceEur * platformFee
//        payment_intent_data.transfer_data.destination = sellerAccountId
//   4. Returns checkoutUrl · frontend redirigeix buyer
//   5. Stripe processa · transfereix net al seller account · platform fee
//      es queda al compte SOS (@alvaro)
//
// PURO · zero global state · helpers async + persist via KB.
// =============================================================================

export const STRIPE_CONNECT_ACCOUNT_TYPE = 'stripe_connect_account';
export const STRIPE_CONNECT_ACCOUNT_ID   = 'sos-stripe-connect-primary';

// Platform fee default · 8% (5% margin SOS + 3% cobreix Stripe Connect fee)
export const DEFAULT_PLATFORM_FEE_PCT = 8.0;

const ENDPOINT_LINK     = '/api/stripe-connect-link';
const ENDPOINT_STATUS   = '/api/stripe-connect-status';
const ENDPOINT_CHECKOUT = '/api/stripe-checkout-product';

// computeApplicationFee · pur · returns amount in CENTS
export function computeApplicationFee({ priceEur, platformFeePct = DEFAULT_PLATFORM_FEE_PCT } = {}) {
    if (typeof priceEur !== 'number' || priceEur <= 0) throw new Error('computeApplicationFee · priceEur > 0');
    if (typeof platformFeePct !== 'number' || platformFeePct < 0 || platformFeePct > 50) {
        throw new Error('computeApplicationFee · platformFeePct 0-50');
    }
    const priceCents = Math.round(priceEur * 100);
    const feeCents   = Math.round(priceCents * platformFeePct / 100);
    return { priceCents, feeCents, sellerReceivesCents: priceCents - feeCents, platformFeePct };
}

// ─── Connect onboarding link · crea/recupera l'account + retorna URL ───
//
// Args · { userHandle, email?, returnUrl?, refreshUrl?, fetchFn? }
// Returns · { accountId, url, accountState }
export async function createConnectLink({
    userHandle,
    email = null,
    returnUrl   = (typeof window !== 'undefined' ? window.location.origin + '/identity' : ''),
    refreshUrl  = (typeof window !== 'undefined' ? window.location.origin + '/settings' : ''),
    endpoint    = ENDPOINT_LINK,
    fetchFn     = (typeof fetch !== 'undefined' ? fetch : null),
} = {}) {
    if (!userHandle) throw new Error('createConnectLink · userHandle required');
    if (!fetchFn)    throw new Error('createConnectLink · fetch unavailable');
    const res = await fetchFn(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userHandle, email, returnUrl, refreshUrl }),
    });
    let data; try { data = await res.json(); } catch (_) {}
    if (!res.ok) throw new Error('connect-link-failed · ' + (data?.error || res.status));
    if (!data || !data.url || !data.accountId) throw new Error('connect-link-malformed');
    return data;
}

// ─── Status check · accountId connected? charges_enabled? ──────────────
export async function getAccountStatus({
    accountId,
    endpoint = ENDPOINT_STATUS,
    fetchFn = (typeof fetch !== 'undefined' ? fetch : null),
} = {}) {
    if (!accountId) throw new Error('getAccountStatus · accountId required');
    if (!fetchFn)   throw new Error('fetch unavailable');
    const res = await fetchFn(endpoint + '?accountId=' + encodeURIComponent(accountId));
    let data; try { data = await res.json(); } catch (_) {}
    if (!res.ok) throw new Error('status-check-failed · ' + (data?.error || res.status));
    return data || { ready: false, chargesEnabled: false };
}

// ─── Product Checkout · creates session with Connect transfer ──────────
//
// Args · { sellerAccountId, priceEur, productName, productDescription?,
//          platformFeePct?, currency?, customerEmail?, metadata?,
//          successUrl?, cancelUrl?, fetchFn? }
// Returns · { sessionId, url }
export async function createProductCheckout({
    sellerAccountId,
    priceEur,
    productName,
    productDescription = null,
    platformFeePct     = DEFAULT_PLATFORM_FEE_PCT,
    currency           = 'eur',
    customerEmail      = null,
    metadata           = {},
    successUrl         = (typeof window !== 'undefined' ? window.location.origin + '/wallet?session_id={CHECKOUT_SESSION_ID}' : ''),
    cancelUrl          = (typeof window !== 'undefined' ? window.location.origin + '/market' : ''),
    endpoint           = ENDPOINT_CHECKOUT,
    fetchFn            = (typeof fetch !== 'undefined' ? fetch : null),
} = {}) {
    if (!sellerAccountId) throw new Error('createProductCheckout · sellerAccountId required');
    if (typeof priceEur !== 'number' || priceEur <= 0) throw new Error('priceEur > 0 required');
    if (!productName)     throw new Error('productName required');
    if (!fetchFn)         throw new Error('fetch unavailable');

    // Compute fees client-side per a UX (server tornarà a fer-ho)
    const fee = computeApplicationFee({ priceEur, platformFeePct });

    const res = await fetchFn(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sellerAccountId,
            priceCents:        fee.priceCents,
            feeCents:          fee.feeCents,
            currency,
            productName,
            productDescription,
            platformFeePct,
            customerEmail,
            metadata,
            successUrl,
            cancelUrl,
        }),
    });
    let data; try { data = await res.json(); } catch (_) {}
    if (!res.ok) throw new Error('checkout-failed · ' + (data?.error || res.status));
    if (!data || !data.url) throw new Error('checkout-malformed');
    return { ...data, fee };
}

// ─── KB persistence · stripe_connect_account node ──────────────────────
//
// Schema:
//   id           · 'sos-stripe-connect-primary' (singleton per usuari local)
//   type         · 'stripe_connect_account'
//   content:
//     userHandle      · '@alvaro'
//     accountId       · 'acct_xxx'
//     chargesEnabled  · bool
//     payoutsEnabled  · bool
//     detailsSubmitted· bool
//     country         · 'ES'
//     defaultCurrency · 'eur'
//     lastSyncAt      · ts

export async function saveConnectAccount({
    userHandle, accountId,
    chargesEnabled = false, payoutsEnabled = false, detailsSubmitted = false,
    country = null, defaultCurrency = 'eur',
    kb = null,
} = {}) {
    if (!userHandle) throw new Error('saveConnectAccount · userHandle');
    if (!accountId)  throw new Error('saveConnectAccount · accountId');
    let KB = kb;
    if (!KB) { try { KB = (await import('./kb.js')).KB; } catch (_) {} }
    if (!KB) throw new Error('KB unavailable');
    const now = Date.now();
    const node = {
        id:   STRIPE_CONNECT_ACCOUNT_ID,
        type: STRIPE_CONNECT_ACCOUNT_TYPE,
        content: {
            userHandle,
            accountId,
            chargesEnabled:   !!chargesEnabled,
            payoutsEnabled:   !!payoutsEnabled,
            detailsSubmitted: !!detailsSubmitted,
            country,
            defaultCurrency,
            lastSyncAt:       now,
        },
        keywords:  ['type:stripe-connect-account', 'account:' + accountId.slice(0, 20)],
        createdAt: now,
        updatedAt: now,
    };
    await KB.upsert(node);
    return node;
}

export async function getConnectAccount({ kb = null } = {}) {
    let KB = kb;
    if (!KB) { try { KB = (await import('./kb.js')).KB; } catch (_) { return null; } }
    try {
        const node = await KB.getNode(STRIPE_CONNECT_ACCOUNT_ID);
        if (node && node.type === STRIPE_CONNECT_ACCOUNT_TYPE) return node.content;
    } catch (_) {}
    return null;
}

export async function clearConnectAccount({ kb = null } = {}) {
    let KB = kb;
    if (!KB) { try { KB = (await import('./kb.js')).KB; } catch (_) { return; } }
    try { await KB.deleteNode(STRIPE_CONNECT_ACCOUNT_ID); } catch (_) {}
}

// Sincronitza l'estat des de Stripe (crida server) + persisteix al KB
export async function syncConnectAccountStatus({ accountId, fetchFn, kb = null } = {}) {
    if (!accountId) {
        const cached = await getConnectAccount({ kb });
        if (!cached) return null;
        accountId = cached.accountId;
    }
    const status = await getAccountStatus({ accountId, fetchFn });
    const existing = await getConnectAccount({ kb });
    const node = await saveConnectAccount({
        userHandle:       existing?.userHandle || '@alvaro',
        accountId,
        chargesEnabled:   status.chargesEnabled,
        payoutsEnabled:   status.payoutsEnabled,
        detailsSubmitted: status.detailsSubmitted,
        country:          status.country || existing?.country || null,
        defaultCurrency:  status.defaultCurrency || existing?.defaultCurrency || 'eur',
        kb,
    });
    return node.content;
}
