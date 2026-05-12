// BIZ-MODEL-001 sprint A · tests stand-alone per verifyStripeSession +
// readSessionIdFromUrl + claim helpers · mock fetch + KB.
// Ús: node js/tests/stripeVerify.test.js

import * as svc from '../core/stripeService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== BIZ-MODEL-001 sprint A · Stripe verify helpers ===\n');

// 1 · Exports
t(typeof svc.verifyStripeSession  === 'function',                     'A · verifyStripeSession exportat');
t(typeof svc.readSessionIdFromUrl === 'function',                     'A · readSessionIdFromUrl exportat');
t(typeof svc.hasSessionBeenClaimed === 'function',                    'A · hasSessionBeenClaimed exportat');
t(typeof svc.markSessionClaimed    === 'function',                    'A · markSessionClaimed exportat');

// 2 · readSessionIdFromUrl · format vàlid
eq(svc.readSessionIdFromUrl('?session_id=cs_test_abc1234567890def'), 'cs_test_abc1234567890def', 'B · URL test session · OK');
eq(svc.readSessionIdFromUrl('?session_id=cs_live_xyz9876543210uvw'), 'cs_live_xyz9876543210uvw', 'B · URL live session · OK');

// 3 · readSessionIdFromUrl · format invàlid · null
eq(svc.readSessionIdFromUrl(''), null,                                'B · URL buida · null');
eq(svc.readSessionIdFromUrl('?session_id=invalid'), null,             'B · sessionId invàlid · null');
eq(svc.readSessionIdFromUrl('?session_id=cs_foo_short'), null,        'B · sessionId massa curt · null');
eq(svc.readSessionIdFromUrl('?other=x'), null,                        'B · sense session_id · null');

// 4 · verifyStripeSession · sense sessionId · throw
let threw = null;
try { await svc.verifyStripeSession(); } catch (e) { threw = e; }
t(threw && /requires sessionId/.test(threw.message),                  'C · sense sessionId · throw');

// 5 · verifyStripeSession · fetch mock OK + verified true
const mockFetchVerified = async (url, opts) => {
    return {
        ok:   true,
        json: async () => ({
            verified:           true,
            sessionId:          'cs_test_xxx',
            amountTotal:        1000,
            currency:           'eur',
            status:             'complete',
            paymentStatus:      'paid',
            clientReferenceId:  null,
        }),
    };
};
const r1 = await svc.verifyStripeSession('cs_test_xxx', { fetchFn: mockFetchVerified });
t(r1.verified === true,                                               'C · mock verified · true');
eq(r1.amountTotal, 1000,                                              'C · amountTotal 1000 cents');
eq(r1.currency,    'eur',                                             'C · currency eur');

// 6 · verifyStripeSession · fetch mock 400 · error propagat
const mockFetch400 = async () => ({
    ok:     false,
    status: 400,
    json:   async () => ({ error: 'sessionId malformed' }),
});
threw = null;
try { await svc.verifyStripeSession('cs_test_xxx', { fetchFn: mockFetch400 }); } catch (e) { threw = e; }
t(threw && /verify-failed/.test(threw.message),                       'C · mock 400 · throw verify-failed');
t(threw && /malformed/.test(threw.message),                           'C · error detail inclòs');

// 7 · verifyStripeSession · fetch mock malformed body · throw
const mockFetchMalformed = async () => ({
    ok:   true,
    json: async () => ({ status: 'ok' }),    // no `verified` field
});
threw = null;
try { await svc.verifyStripeSession('cs_test_xxx', { fetchFn: mockFetchMalformed }); } catch (e) { threw = e; }
t(threw && /malformed/.test(threw.message),                           'C · response malformed · throw');

// 8 · KB-mocked claim flow
const mockKBStore = new Map();
const mockKB = {
    getNode: async (id) => mockKBStore.get(id) || null,
    upsert:  async (n) => { mockKBStore.set(n.id, n); return n; },
};
// 8a · primer cop · no reclamat
const claimed1 = await svc.hasSessionBeenClaimed('cs_test_abc', mockKB);
eq(claimed1, false,                                                   'D · primer cop · no reclamat');
// 8b · marquem com a reclamat
const node = await svc.markSessionClaimed('cs_test_abc', { amountEur: 10, kb: mockKB });
t(node && node.id === 'stripe-claim-cs_test_abc',                     'D · markSessionClaimed · genera node KB');
t(node.type === 'stripe_claim',                                       'D · node type stripe_claim');
eq(node.content.amountEur, 10,                                        'D · amountEur registrat');
// 8c · segon cop · ja reclamat
const claimed2 = await svc.hasSessionBeenClaimed('cs_test_abc', mockKB);
eq(claimed2, true,                                                    'D · després markClaimed · reclamat');

// 9 · hasSessionBeenClaimed amb sessionId null · safe (true · evita re-claim)
const c3 = await svc.hasSessionBeenClaimed(null, mockKB);
eq(c3, true,                                                          'D · sessionId null · true (defensive)');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
