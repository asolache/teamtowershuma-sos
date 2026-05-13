// WALLET-AUTH-001 sprint C + STRIPE-CONNECT-001 sprint A · tests stand-alone
// Cobreix les parts pures dels 2 serveis · les Edge Functions es validen
// per integration test al deploy (necessiten env vars + Stripe API).
// Ús: node js/tests/oauthStripe.test.js

import * as oauth   from '../core/oauthService.js';
import * as connect from '../core/stripeConnectService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== WALLET-AUTH-001 sprint C + STRIPE-CONNECT-001 sprint A ===\n');

// ─── A · oauthService exports ──────────────────────────────────────────
t(Array.isArray(oauth.SUPPORTED_PROVIDERS) && oauth.SUPPORTED_PROVIDERS.length === 3, 'A · SUPPORTED_PROVIDERS · 3 entries');
t(oauth.SUPPORTED_PROVIDERS.includes('github'),                       'A · github');
t(oauth.SUPPORTED_PROVIDERS.includes('google'),                       'A · google');
t(oauth.SUPPORTED_PROVIDERS.includes('magic-link'),                   'A · magic-link');

t(typeof oauth.loginWithGithub        === 'function',                 'A · loginWithGithub exportat');
t(typeof oauth.loginWithGoogle        === 'function',                 'A · loginWithGoogle exportat');
t(typeof oauth.requestMagicLink       === 'function',                 'A · requestMagicLink exportat');
t(typeof oauth.linkProviderToIdentity === 'function',                 'A · linkProviderToIdentity exportat');
t(typeof oauth.unlinkProvider         === 'function',                 'A · unlinkProvider exportat');
t(typeof oauth.getOAuthProviders      === 'function',                 'A · getOAuthProviders exportat');

// ─── B · loginWithProvider · provider unsupported · throw ──────────────
let threw = null;
try { await oauth.loginWithProvider('unsupported'); } catch (e) { threw = e; }
t(threw && /Unsupported/.test(threw.message),                         'B · provider invàlid · throw');

// ─── C · linkProviderToIdentity · mock KB ──────────────────────────────
function makeMockKb() {
    const m = new Map();
    return {
        store: m,
        getNode: async (id) => m.get(id) || null,
        upsert:  async (n) => { m.set(n.id, n); return n; },
        query:   async (q) => Array.from(m.values()).filter(n => !q.type || n.type === q.type),
        deleteNode: async (id) => m.delete(id),
    };
}

const kb1 = makeMockKb();
const providerData = {
    provider: 'github', userId: 12345, login: 'alvaro',
    name: 'Alvaro Solache', email: 'alvaro@example.com',
    avatarUrl: 'https://x.com/img.png', verifiedAt: 1700000000000,
};
const member1 = await oauth.linkProviderToIdentity(providerData, { kb: kb1 });
t(member1 && member1.content.oauthProviders.length === 1,             'C · primer vincle · 1 provider');
eq(member1.content.oauthProviders[0].login, 'alvaro',                 'C · login persistit');
eq(member1.content.oauthProviders[0].provider, 'github',              'C · provider persistit');
eq(member1.content.handle, '@alvaro',                                 'C · handle creat des de login');

// Idempotent · 2n cop replaces (no duplica)
const member2 = await oauth.linkProviderToIdentity({ ...providerData, name: 'NEW NAME' }, { kb: kb1 });
eq(member2.content.oauthProviders.length, 1,                          'C · 2n cop same provider · count 1');
eq(member2.content.oauthProviders[0].name, 'NEW NAME',                'C · name actualitzat');

// Diferent provider · 2 entries
const member3 = await oauth.linkProviderToIdentity({
    ...providerData, provider: 'google', userId: 'google_id',
}, { kb: kb1 });
eq(member3.content.oauthProviders.length, 2,                          'C · provider diferent · 2 entries');

// unlinkProvider
const member4 = await oauth.unlinkProvider('github', { kb: kb1 });
eq(member4.content.oauthProviders.length, 1,                          'C · unlink github · 1 left');
eq(member4.content.oauthProviders[0].provider, 'google',              'C · google preservat');

// getOAuthProviders
const list = await oauth.getOAuthProviders({ kb: kb1 });
eq(list.length, 1,                                                    'C · getOAuthProviders · 1');

// ─── D · linkProviderToIdentity · errors ───────────────────────────────
threw = null;
try { await oauth.linkProviderToIdentity({}, { kb: kb1 }); } catch (e) { threw = e; }
t(threw && /missing/.test(threw.message),                             'D · sense provider/userId · throw');

// ─── E · requestMagicLink · validació email ────────────────────────────
threw = null;
try { await oauth.requestMagicLink('not-email'); } catch (e) { threw = e; }
t(threw && /Invalid email/.test(threw.message),                       'E · email invàlid · throw');

// Mock fetch · 200 ok
const mockOk = async () => ({ ok: true, json: async () => ({ sent: true }) });
const rOk = await oauth.requestMagicLink('user@example.com', { fetchFn: mockOk });
t(rOk && rOk.sent,                                                    'E · magic-request OK · resposta correcta');

// Mock fetch · 500 error
const mockErr = async () => ({ ok: false, status: 500, json: async () => ({ error: 'server-down' }) });
threw = null;
try { await oauth.requestMagicLink('user@example.com', { fetchFn: mockErr }); } catch (e) { threw = e; }
t(threw && /magic-request-failed/.test(threw.message),                'E · server error · throw');

// ─── F · stripeConnectService exports ──────────────────────────────────
t(typeof connect.computeApplicationFee     === 'function',            'F · computeApplicationFee exportat');
t(typeof connect.createConnectLink         === 'function',            'F · createConnectLink exportat');
t(typeof connect.getAccountStatus          === 'function',            'F · getAccountStatus exportat');
t(typeof connect.createProductCheckout     === 'function',            'F · createProductCheckout exportat');
t(typeof connect.saveConnectAccount        === 'function',            'F · saveConnectAccount exportat');
t(typeof connect.getConnectAccount         === 'function',            'F · getConnectAccount exportat');
eq(connect.DEFAULT_PLATFORM_FEE_PCT, 8.0,                             'F · DEFAULT_PLATFORM_FEE_PCT · 8%');
eq(connect.STRIPE_CONNECT_ACCOUNT_TYPE, 'stripe_connect_account',     'F · type constant');

// ─── G · computeApplicationFee ─────────────────────────────────────────
const f1 = connect.computeApplicationFee({ priceEur: 25.00 });
eq(f1.priceCents,        2500,                                        'G · 25€ · 2500 cents');
eq(f1.feeCents,          200,                                         'G · 8% · 200 cents');
eq(f1.sellerReceivesCents, 2300,                                      'G · seller · 2300 cents');
eq(f1.platformFeePct,    8.0,                                         'G · platformFeePct · 8');

const f2 = connect.computeApplicationFee({ priceEur: 10.00, platformFeePct: 5.0 });
eq(f2.feeCents,          50,                                          'G · 10€ at 5% · 50 cents');
eq(f2.sellerReceivesCents, 950,                                       'G · seller · 950 cents');

// Errors
threw = null;
try { connect.computeApplicationFee({ priceEur: 0 }); } catch (e) { threw = e; }
t(threw,                                                              'G · priceEur 0 · throw');
threw = null;
try { connect.computeApplicationFee({ priceEur: 25, platformFeePct: 60 }); } catch (e) { threw = e; }
t(threw && /platformFeePct/.test(threw.message),                      'G · platformFeePct > 50% · throw');
threw = null;
try { connect.computeApplicationFee({ priceEur: 25, platformFeePct: -1 }); } catch (e) { threw = e; }
t(threw,                                                              'G · platformFeePct negative · throw');

// ─── H · createConnectLink mock ────────────────────────────────────────
const mockCreateOk = async () => ({
    ok: true,
    json: async () => ({ accountId: 'acct_mock123', url: 'https://connect.stripe.com/setup', expiresAt: 1700001000 }),
});
const link = await connect.createConnectLink({
    userHandle: '@bob', email: 'bob@example.com',
    returnUrl: 'https://x.com/return', refreshUrl: 'https://x.com/refresh',
    fetchFn: mockCreateOk,
});
eq(link.accountId, 'acct_mock123',                                    'H · accountId retornat');
t(link.url && link.url.includes('connect.stripe.com'),                'H · url stripe');

// Error · sense userHandle
threw = null;
try { await connect.createConnectLink({ fetchFn: mockCreateOk }); } catch (e) { threw = e; }
t(threw && /userHandle/.test(threw.message),                          'H · sense userHandle · throw');

// Error · 400 server
const mock400 = async () => ({ ok: false, status: 400, json: async () => ({ error: 'invalid-email' }) });
threw = null;
try { await connect.createConnectLink({ userHandle: '@b', returnUrl: 'x', fetchFn: mock400 }); } catch (e) { threw = e; }
t(threw && /connect-link-failed/.test(threw.message),                 'H · 400 · throw amb detail');

// ─── I · getAccountStatus mock ────────────────────────────────────────
const mockStatus = async () => ({
    ok: true,
    json: async () => ({
        accountId: 'acct_x', chargesEnabled: true, payoutsEnabled: false,
        detailsSubmitted: true, ready: false, country: 'ES', defaultCurrency: 'eur',
    }),
});
const status = await connect.getAccountStatus({ accountId: 'acct_x', fetchFn: mockStatus });
t(status.chargesEnabled,                                              'I · chargesEnabled true');
t(!status.payoutsEnabled,                                             'I · payoutsEnabled false');
eq(status.country, 'ES',                                              'I · country ES');

threw = null;
try { await connect.getAccountStatus({ fetchFn: mockStatus }); } catch (e) { threw = e; }
t(threw && /accountId/.test(threw.message),                           'I · sense accountId · throw');

// ─── J · createProductCheckout mock + fee inclusion ────────────────────
let capturedBody = null;
const mockCheckout = async (url, opts) => {
    try { capturedBody = JSON.parse(opts?.body || '{}'); } catch (_) {}
    return { ok: true, json: async () => ({ sessionId: 'cs_test_x', url: 'https://checkout.stripe.com/c/x' }) };
};
const checkout = await connect.createProductCheckout({
    sellerAccountId: 'acct_seller',
    priceEur:        25,
    productName:     'Onboarding Workshop',
    customerEmail:   'alice@example.com',
    metadata:        { workshopId: 'ws-1' },
    successUrl:      'https://x.com/ok',
    cancelUrl:       'https://x.com/cancel',
    fetchFn:         mockCheckout,
});
t(checkout.sessionId === 'cs_test_x',                                 'J · sessionId retornat');
t(checkout.url && checkout.url.includes('checkout.stripe.com'),       'J · url stripe checkout');
t(checkout.fee && checkout.fee.feeCents === 200,                      'J · fee retornada (8%)');

t(capturedBody && capturedBody.sellerAccountId === 'acct_seller',     'J · body · sellerAccountId');
eq(capturedBody.priceCents, 2500,                                     'J · body · priceCents');
eq(capturedBody.feeCents,   200,                                      'J · body · feeCents');
eq(capturedBody.productName, 'Onboarding Workshop',                   'J · body · productName');
eq(capturedBody.metadata.workshopId, 'ws-1',                          'J · body · metadata');

// Errors
threw = null;
try { await connect.createProductCheckout({ priceEur: 25, productName: 'x', fetchFn: mockCheckout }); } catch (e) { threw = e; }
t(threw && /sellerAccountId/.test(threw.message),                     'J · sense sellerAccountId · throw');

threw = null;
try { await connect.createProductCheckout({ sellerAccountId: 'acct_x', priceEur: 0, productName: 'x', fetchFn: mockCheckout }); } catch (e) { threw = e; }
t(threw && /priceEur/.test(threw.message),                            'J · priceEur 0 · throw');

// ─── K · KB persistence · saveConnectAccount + getConnectAccount ───────
const kb2 = makeMockKb();
const saved = await connect.saveConnectAccount({
    userHandle: '@bob', accountId: 'acct_bob',
    chargesEnabled: true, payoutsEnabled: true, detailsSubmitted: true,
    country: 'ES', kb: kb2,
});
eq(saved.type, 'stripe_connect_account',                              'K · saved type');
eq(saved.content.userHandle, '@bob',                                  'K · userHandle');
eq(saved.content.accountId, 'acct_bob',                               'K · accountId');
t(saved.content.chargesEnabled,                                       'K · chargesEnabled');

const loaded = await connect.getConnectAccount({ kb: kb2 });
eq(loaded.accountId, 'acct_bob',                                      'K · roundtrip · accountId');

// Sense node · null
const kb3 = makeMockKb();
const empty = await connect.getConnectAccount({ kb: kb3 });
eq(empty, null,                                                       'K · sense node · null');

// clearConnectAccount
await connect.clearConnectAccount({ kb: kb2 });
const afterClear = await connect.getConnectAccount({ kb: kb2 });
eq(afterClear, null,                                                  'K · clearConnectAccount · esborra');

// Errors
threw = null;
try { await connect.saveConnectAccount({ accountId: 'acct_x', kb: kb2 }); } catch (e) { threw = e; }
t(threw,                                                              'K · sense userHandle · throw');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
