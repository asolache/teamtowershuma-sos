// =============================================================================
// TEAMTOWERS SOS V11 — STRIPE CHECKOUT · CUSTOM AMOUNT · TDD (v125)
// Ruta · /js/tests/stripeCheckoutCustomAmount.test.js
//
// Sprint C · backend per a top-ups d'amount arbitrari (no només 10/25/50/100€).
// Crida edge function `/api/stripe-create-session` que crea Stripe Checkout
// Session dinàmica. Test amb mock fetch.
// =============================================================================

import { createCheckoutSession, listSessionClaims, markSessionClaimed, hasSessionBeenClaimed } from '../core/stripeService.js';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }
async function asyncThrows(label, fn) { try { await fn(); fail++; console.log('✗', label, '(no llançà)'); } catch (_) { pass++; console.log('✓', label); } }

console.log('=== STRIPE CHECKOUT · CUSTOM AMOUNT (v125) ===\n');

// ─── A · createCheckoutSession · happy path ────────────────────────────
console.log('— A · createCheckoutSession · happy path');
{
    let receivedReq = null;
    const mockFetch = async (url, opts) => {
        receivedReq = { url, body: JSON.parse(opts.body) };
        return { ok: true, async json() { return { sessionId: 'cs_test_abc123', url: 'https://checkout.stripe.com/c/pay/cs_test_abc123' }; } };
    };
    const res = await createCheckoutSession({ amountEur: 17.50, projectId: 'proj-1', fetchFn: mockFetch });
    ok('A · sessionId al return',           res.sessionId === 'cs_test_abc123');
    ok('A · url al return',                  res.url.includes('checkout.stripe.com'));
    ok('A · POST a /api/stripe-create-session', receivedReq.url === '/api/stripe-create-session');
    ok('A · body inclou amountEur',          receivedReq.body.amountEur === 17.50);
    ok('A · body inclou projectId',          receivedReq.body.projectId === 'proj-1');
    ok('A · body inclou successUrl + cancelUrl',
       receivedReq.body.successUrl && receivedReq.body.cancelUrl);
    ok('A · successUrl conté {CHECKOUT_SESSION_ID} placeholder',
       receivedReq.body.successUrl.includes('{CHECKOUT_SESSION_ID}'));
}

// ─── B · createCheckoutSession · validacions ───────────────────────────
console.log('\n— B · createCheckoutSession · validacions');
await asyncThrows('B · amountEur < 1 throws',     () => createCheckoutSession({ amountEur: 0.5, fetchFn: async () => ({}) }));
await asyncThrows('B · amountEur > 10000 throws', () => createCheckoutSession({ amountEur: 20000, fetchFn: async () => ({}) }));
await asyncThrows('B · sense fetch throws',       () => createCheckoutSession({ amountEur: 10, fetchFn: null }));

// ─── C · createCheckoutSession · error paths ───────────────────────────
console.log('\n— C · createCheckoutSession · error paths');
{
    const mock500 = async () => ({ ok: false, status: 500, async json() { return { error: 'stripe-key-missing' }; } });
    await asyncThrows('C · 500 amb error body llança checkout-create-failed',
        () => createCheckoutSession({ amountEur: 10, fetchFn: mock500 }));
}
{
    const mockMalformed = async () => ({ ok: true, async json() { return { foo: 'bar' }; } });
    await asyncThrows('C · response sense sessionId llança malformed',
        () => createCheckoutSession({ amountEur: 10, fetchFn: mockMalformed }));
}
{
    const mockNetFail = async () => { throw new Error('network down'); };
    await asyncThrows('C · network failure throws checkout-fetch-failed',
        () => createCheckoutSession({ amountEur: 10, fetchFn: mockNetFail }));
}

// ─── D · markSessionClaimed + hasSessionBeenClaimed (KB mock) ─────────
console.log('\n— D · session claim idempotency');
const _store = new Map();
const mockKB = {
    async getNode(id) { return _store.get(id) || null; },
    async upsert(n) { _store.set(n.id, n); return n; },
    async query({ type }) { return Array.from(_store.values()).filter(n => n.type === type); },
};
ok('D · sense claims · hasSessionBeenClaimed = false',
   !(await hasSessionBeenClaimed('cs_test_xyz', mockKB)));
const claim = await markSessionClaimed('cs_test_xyz', { amountEur: 50, projectId: 'proj-1', kb: mockKB });
ok('D · markSessionClaimed retorna node',         claim?.type === 'stripe_claim');
ok('D · claim té projectId (v125 enriquit)',      claim.content.projectId === 'proj-1');
ok('D · post-claim · hasSessionBeenClaimed = true',
   (await hasSessionBeenClaimed('cs_test_xyz', mockKB)) === true);

// ─── E · listSessionClaims · filtres ──────────────────────────────────
console.log('\n— E · listSessionClaims');
await markSessionClaimed('cs_test_2', { amountEur: 25, projectId: 'proj-2', kb: mockKB });
await markSessionClaimed('cs_test_3', { amountEur: 100, projectId: 'proj-1', kb: mockKB });
const all     = await listSessionClaims({ kb: mockKB });
const proj1   = await listSessionClaims({ kb: mockKB, projectId: 'proj-1' });
ok('E · totes les claims · 3',                    all.length === 3);
ok('E · projectId=proj-1 · 2 claims',             proj1.length === 2);
ok('E · ordenades DESC per claimedAt',
   all[0].content.claimedAt >= all[all.length - 1].content.claimedAt);

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
