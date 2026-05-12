// TEAMTOWERS SOS V11 — STRIPE SERVICE (ALPHA-STRIPE-001 sprint A)
//
// Stripe Checkout per a saldo prepagat (LLM · permaweb · Gnosis · etc).
// SOS és local-first SENSE backend propi · per tant la integració usa
// Stripe Payment Links (URLs creades manualment al Stripe Dashboard) ·
// NO necessita cap clau secreta al codi. Public Key (pk_) opcional
// per a futur Stripe Elements embedded.
//
// ⚠️ SEGURETAT · MAI posar al codi:
//   - sk_test_ / sk_live_ (Secret Keys)
//   - rk_test_ / rk_live_ (Restricted Keys)
//   Les claus secret/restricted han d'anar només al servidor (Netlify
//   Function · env var). Si es comparteixen accidentalment · ROLL al
//   Stripe Dashboard immediatament.
//
// Schema KB:
//   - 'sos-stripe-config' · type='config' · pk + paymentLinks per amount
//   - 'sos-subscription-plan' · type='subscription_plan' · plan actiu

import { KB } from './kb.js';

const CONFIG_NODE_ID = 'sos-stripe-config';
const PLAN_NODE_ID   = 'sos-subscription-plan';

// ── Plans canònics SOS V11 ──────────────────────────────────────────

export const SOS_PLANS = Object.freeze({
    free: Object.freeze({
        id:           'free',
        label:        'Free',
        priceEurMonth: 0,
        features:     [
            'SOS local-first complet (KB · mapa · kanban · pacte)',
            "API key pròpia de l'usuari per a IA (Anthropic · OpenAI · DeepSeek · Gemini · MiniMax)",
            'Sense crides al proxy SOS · zero costos plataforma',
            'Sense permaweb ni Gnosis txs · només KB local',
        ],
        limitations: [
            "No hi ha saldo prepagat · l'usuari paga directe als providers",
            'No hi ha Stripe billing',
        ],
    }),
    pro: Object.freeze({
        id:           'pro',
        label:        'Pro · saldo prepagat',
        priceEurMonth: 9,
        features:     [
            'Tot el del Free',
            'Saldo prepagat al wallet · es consumeix per crides IA + permaweb + Gnosis',
            'Cargo automàtic al wallet del projecte (MKT-001 sprint C3)',
            'Proxy IA gestionat (sense haver de configurar API keys)',
            'Permaweb writes (PERMAWEB-001 quan estigui ready)',
            'Pact firmat a Gnosis (PACT-001 sprint D quan estigui ready)',
        ],
        topupAmounts: [10, 25, 50, 100],
    }),
    cooperative: Object.freeze({
        id:           'cooperative',
        label:        'Cooperative · USDC + cohort',
        priceEurMonth: 19,
        features:     [
            'Tot el del Pro',
            'Saldo en USDC al Gnosis Safe (custòdia compartida)',
            'Multiplicador Cohort 0 ×1.5 si ets fundador',
            'Pact a Gnosis i Arweave automatitzats',
            'Suport prioritari + onboarding cohort',
        ],
    }),
    enterprise: Object.freeze({
        id:           'enterprise',
        label:        'Enterprise · custom',
        priceEurMonth: null,   // contact
        features:     [
            'Tot el del Cooperative',
            'Self-hosted SOS instance (multi-tenant)',
            'SLA + suport dedicat',
            'Custom integrations · ESCO · O*NET · ERP existent',
            'On-premise permaweb gateway',
        ],
    }),
});

export const VALID_PLAN_IDS = Object.freeze(Object.keys(SOS_PLANS));
export const DEFAULT_TOPUP_AMOUNTS = Object.freeze([10, 25, 50, 100]);

// ── Pure helpers ────────────────────────────────────────────────────

// validatePublishableKey · accepta pk_test_ i pk_live_ · rebutja sk_/rk_
// per protegir l'usuari de paste accidental.
export function validatePublishableKey(pk) {
    if (typeof pk !== 'string' || !pk) return false;
    if (pk.startsWith('sk_') || pk.startsWith('rk_')) return false;   // SECRET · NO!
    return /^pk_(test|live)_[a-zA-Z0-9]{20,}$/.test(pk);
}

// detectKeyType · per a UI feedback · 'publishable' / 'secret' / 'restricted' / 'invalid'
export function detectKeyType(key) {
    if (typeof key !== 'string' || !key) return 'invalid';
    if (key.startsWith('pk_test_') || key.startsWith('pk_live_')) return 'publishable';
    if (key.startsWith('sk_test_') || key.startsWith('sk_live_')) return 'secret';
    if (key.startsWith('rk_test_') || key.startsWith('rk_live_')) return 'restricted';
    return 'invalid';
}

// validatePaymentLinkUrl · accepta https://buy.stripe.com/test_... o
// https://buy.stripe.com/{id}
export function validatePaymentLinkUrl(url) {
    if (typeof url !== 'string' || !url) return false;
    return /^https:\/\/buy\.stripe\.com\/(test_)?[a-zA-Z0-9_]+$/.test(url);
}

// buildPlanNode · puro · genera nodo subscription_plan
export function buildPlanNode({ planId, status = 'active', validUntil = null, walletBalanceEur = 0 } = {}) {
    if (!VALID_PLAN_IDS.includes(planId)) {
        throw new Error('buildPlanNode · planId inválido: ' + planId);
    }
    const plan = SOS_PLANS[planId];
    return {
        id: PLAN_NODE_ID,
        type: 'subscription_plan',
        content: {
            kind:         'sos-subscription-plan',
            planId,
            planLabel:    plan.label,
            priceEurMonth: plan.priceEurMonth,
            status,
            validUntil,
            walletBalanceEur,
            updatedAt:    Date.now(),
        },
        keywords: [
            'type:subscription_plan',
            'kind:sos-subscription-plan',
            'plan:' + planId,
            'status:' + status,
        ],
    };
}

// buildConfigNode · puro · stores pk + payment links + opt provider info
export function buildConfigNode({ publishableKey = null, paymentLinks = {} } = {}) {
    // Validate paymentLinks · only keep valid URLs
    const cleanLinks = {};
    for (const [amount, url] of Object.entries(paymentLinks || {})) {
        if (validatePaymentLinkUrl(url)) {
            cleanLinks[String(amount)] = url;
        }
    }
    return {
        id:   CONFIG_NODE_ID,
        type: 'config',
        content: {
            kind:           'sos-stripe-config',
            publishableKey: validatePublishableKey(publishableKey) ? publishableKey : null,
            paymentLinks:   cleanLinks,
            updatedAt:      Date.now(),
        },
        keywords: ['type:config', 'kind:sos-stripe-config'],
    };
}

// ── KB-bound helpers (async) ────────────────────────────────────────

export async function loadStripeConfig(kb = KB) {
    if (!kb || typeof kb.getNode !== 'function') return { publishableKey: null, paymentLinks: {} };
    try {
        const node = await kb.getNode(CONFIG_NODE_ID);
        return {
            publishableKey: node?.content?.publishableKey || null,
            paymentLinks:   node?.content?.paymentLinks || {},
            exists:         !!node,
        };
    } catch (_) { return { publishableKey: null, paymentLinks: {}, exists: false }; }
}

export async function saveStripeConfig(kb, { publishableKey, paymentLinks } = {}) {
    if (!kb || typeof kb.upsert !== 'function') throw new Error('saveStripeConfig requires KB');
    const node = buildConfigNode({ publishableKey, paymentLinks });
    return kb.upsert(node);
}

export async function loadCurrentPlan(kb = KB) {
    if (!kb || typeof kb.getNode !== 'function') return null;
    try {
        const node = await kb.getNode(PLAN_NODE_ID);
        if (!node) return { planId: 'free', planLabel: 'Free', status: 'default', walletBalanceEur: 0, fromDefault: true };
        return {
            planId:           node.content?.planId || 'free',
            planLabel:        node.content?.planLabel || 'Free',
            status:           node.content?.status || 'active',
            validUntil:       node.content?.validUntil || null,
            walletBalanceEur: node.content?.walletBalanceEur || 0,
            updatedAt:        node.content?.updatedAt || null,
            fromDefault:      false,
        };
    } catch (_) { return null; }
}

export async function setCurrentPlan(kb, { planId, validUntil = null, walletBalanceEur = null } = {}) {
    if (!kb || typeof kb.upsert !== 'function') throw new Error('setCurrentPlan requires KB');
    if (!VALID_PLAN_IDS.includes(planId)) throw new Error('Invalid planId: ' + planId);
    const current = (await loadCurrentPlan(kb)) || {};
    const node = buildPlanNode({
        planId,
        status:           'active',
        validUntil,
        walletBalanceEur: walletBalanceEur !== null ? walletBalanceEur : (current.walletBalanceEur || 0),
    });
    return kb.upsert(node);
}

// ── Topup flow (Payment Links) ─────────────────────────────────────

// openTopupPaymentLink · obre la URL del Payment Link configurat per
// l'amount donat. NO necessita cap clau · només la URL configurada
// prèviament al Stripe Dashboard de l'usuari operador.
//
// Després del pagament Stripe redirigeix al success_url configurat ·
// si l'usuari l'ha apuntat a /settings?stripe=success&amount=X
// el callback pot acreditar el saldo localment (sprint B · webhook
// real necessitarà Netlify Function).
export async function openTopupPaymentLink({ kb = KB, amountEur } = {}) {
    if (typeof amountEur !== 'number' || amountEur <= 0) {
        throw new Error('openTopupPaymentLink requires amountEur (positive number)');
    }
    const config = await loadStripeConfig(kb);
    const url = config.paymentLinks?.[String(amountEur)];
    if (!url) {
        throw new Error('No Payment Link configured for ' + amountEur + '€ · configura\'n un a /settings');
    }
    if (typeof window !== 'undefined' && window.open) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
    return url;
}

// =============================================================================
// BIZ-MODEL-001 sprint A · verifyStripeSession() · auto-verify post-payment
//
// Quan l'usuari paga via Payment Link, Stripe redirigeix al success_url amb
// `?session_id={CHECKOUT_SESSION_ID}` (cal configurar-ho al Payment Link
// settings). WalletView llegeix el param, crida aquest helper, que via
// Netlify Edge Function `/api/stripe-verify-session` confirma que el
// pagament és real. Si verified=true, el client aplica el top-up al wallet.
//
// Setup · netlify/edge-functions/stripe-verify-session.js + STRIPE_SECRET_KEY
// env var al Netlify dashboard.
// =============================================================================

const STRIPE_VERIFY_ENDPOINT = '/api/stripe-verify-session';

export async function verifyStripeSession(sessionId, { endpoint = STRIPE_VERIFY_ENDPOINT, fetchFn = (typeof fetch !== 'undefined' ? fetch : null) } = {}) {
    if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('verifyStripeSession requires sessionId');
    }
    if (!fetchFn) throw new Error('verifyStripeSession requires fetch (browser or node 18+)');
    let res;
    try {
        res = await fetchFn(endpoint, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ sessionId }),
        });
    } catch (e) {
        throw new Error('verify-fetch-failed: ' + (e?.message || 'unknown'));
    }
    let data;
    try { data = await res.json(); } catch (_) { data = null; }
    if (!res.ok) {
        const detail = (data && (data.error || data.detail)) || ('HTTP ' + res.status);
        throw new Error('verify-failed: ' + detail);
    }
    if (!data || typeof data.verified !== 'boolean') {
        throw new Error('verify-malformed-response');
    }
    return data;
}

// readSessionIdFromUrl · lee `?session_id=cs_...` del location actual.
// Defensiu · retorna null si no existeix o té format invàlid.
export function readSessionIdFromUrl(search = (typeof window !== 'undefined' ? window.location.search : '')) {
    try {
        const params = new URLSearchParams(search || '');
        const id = params.get('session_id');
        if (!id) return null;
        if (!/^cs_(test|live)_[a-zA-Z0-9_]{10,}$/.test(id)) return null;
        return id;
    } catch (_) { return null; }
}

// claimedSessionIds · KB-bound · evita aplicar el mateix top-up dues vegades
// si l'usuari recarrega la URL. Persistim al KB amb type='stripe_claim'.
const STRIPE_CLAIM_TYPE = 'stripe_claim';

export async function hasSessionBeenClaimed(sessionId, kb = KB) {
    if (!sessionId) return true;
    try {
        const node = await kb.getNode('stripe-claim-' + sessionId);
        return !!(node && node.type === STRIPE_CLAIM_TYPE);
    } catch (_) { return false; }
}

export async function markSessionClaimed(sessionId, { amountEur, kb = KB } = {}) {
    if (!sessionId) return null;
    const now = Date.now();
    const node = {
        id:   'stripe-claim-' + sessionId,
        type: STRIPE_CLAIM_TYPE,
        content: {
            sessionId,
            amountEur: typeof amountEur === 'number' ? amountEur : null,
            claimedAt: now,
        },
        keywords:  ['type:stripe-claim', 'session:' + sessionId.slice(0, 20)],
        createdAt: now,
        updatedAt: now,
    };
    try { await kb.upsert(node); } catch (_) {}
    return node;
}
