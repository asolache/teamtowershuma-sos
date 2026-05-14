// CANONICAL-001 sprint A · tests stand-alone per connectSaleService.
// Ús: node js/tests/connectSale.test.js

import {
    CONNECT_SALE_TYPE,
    computeConnectSaleSplit,
    buildConnectSaleNode,
    recordConnectSale,
} from '../core/connectSaleService.js';
import {
    CANONICAL_NODE_TYPES, VALID_NODE_TYPES, isValidNodeType,
    VALUE_CATEGORIES, categoryMeta,
    PLATFORM_WALLET_PROJECT_ID, DEFAULT_PLATFORM_FEE_PCT,
    validateMovement, STACK_TECH,
} from '../core/canonicalPrinciples.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== CANONICAL-001 sprint A · canonical principles + connectSaleService ===\n');

// ─── A · canonicalPrinciples · constants ─────────────────────────────
t(typeof CANONICAL_NODE_TYPES === 'object',                'A · CANONICAL_NODE_TYPES exportat');
t(VALID_NODE_TYPES.length >= 25,                            'A · ≥25 node types canònics');
t(CANONICAL_NODE_TYPES.wallet === 'Saldo + movements ledger', 'A · wallet definit');
t(CANONICAL_NODE_TYPES.connect_sale,                        'A · connect_sale canònic');
t(CANONICAL_NODE_TYPES.attestation,                         'A · attestation canònic (TEA)');
t(isValidNodeType('wallet'),                                'A · isValidNodeType(wallet) true');
t(!isValidNodeType('invented-type'),                        'A · isValidNodeType(invented) false');

// ─── B · VALUE_CATEGORIES ────────────────────────────────────────────
t(VALUE_CATEGORIES.ai.kind === 'expense',                   'B · ai · expense');
t(VALUE_CATEGORIES.topup.kind === 'income',                 'B · topup · income');
t(VALUE_CATEGORIES['connect-platform-fee'].kind === 'income', 'B · connect-platform-fee · income');
t(VALUE_CATEGORIES['workshop-revenue'].kind === 'income',   'B · workshop-revenue · income');
const meta = categoryMeta('ai');
eq(meta.sign, '-',                                          'B · categoryMeta(ai) · sign -');
const metaUnknown = categoryMeta('xyz');
eq(metaUnknown.kind, 'unknown',                             'B · categoryMeta(unknown) · kind unknown');

// ─── C · STACK_TECH ──────────────────────────────────────────────────
t(STACK_TECH.IA && Array.isArray(STACK_TECH.IA.services),   'C · STACK_TECH.IA');
t(STACK_TECH.PERMAWEB,                                      'C · STACK_TECH.PERMAWEB');
t(STACK_TECH.TEA,                                           'C · STACK_TECH.TEA · Triple-Entry');
t(STACK_TECH.SMART_CONTRACTS,                               'C · STACK_TECH.SMART_CONTRACTS');

// ─── D · validateMovement ────────────────────────────────────────────
const v1 = validateMovement({ amountEur: 5, kind: 'consume', source: 'ai-fill' });
t(v1.valid && v1.sourceKnown,                               'D · valid movement · ai-fill mapped');
const v2 = validateMovement({ amountEur: 5, kind: 'consume', source: 'unknown' });
t(v2.valid && !v2.sourceKnown,                              'D · valid movement · unknown source · warning');
const v3 = validateMovement({});
t(!v3.valid,                                                'D · invalid · missing amount');

// ─── E · CONNECT_SALE_TYPE ───────────────────────────────────────────
eq(CONNECT_SALE_TYPE, 'connect_sale',                       'E · CONNECT_SALE_TYPE constant');
eq(DEFAULT_PLATFORM_FEE_PCT, 8.0,                           'E · DEFAULT_PLATFORM_FEE_PCT 8%');
eq(PLATFORM_WALLET_PROJECT_ID, '__sos_platform__',          'E · PLATFORM_WALLET_PROJECT_ID');

// ─── F · computeConnectSaleSplit ────────────────────────────────────
const s1 = computeConnectSaleSplit({ priceEur: 100 });
eq(s1.priceEur,        100,                                 'F · price 100 · default 8% · price=100');
eq(s1.feeEur,          8,                                   'F · price 100 · fee=8');
eq(s1.sellerEur,       92,                                  'F · price 100 · seller=92');
eq(s1.platformFeePct,  8,                                   'F · platformFeePct 8');

const s2 = computeConnectSaleSplit({ priceEur: 25, platformFeePct: 5 });
eq(s2.feeEur,    1.25,                                      'F · 25€ × 5% = 1.25');
eq(s2.sellerEur, 23.75,                                     'F · seller 23.75');

let threw = null;
try { computeConnectSaleSplit({ priceEur: 0 }); } catch (e) { threw = e; }
t(threw && /priceEur must be > 0/.test(threw.message),      'F · price 0 · throw');
threw = null;
try { computeConnectSaleSplit({ priceEur: 10, platformFeePct: -5 }); } catch (e) { threw = e; }
t(threw && /platformFeePct/.test(threw.message),            'F · negative pct · throw');

// ─── G · buildConnectSaleNode ────────────────────────────────────────
const sale = buildConnectSaleNode({
    sessionId:      'cs_test_abc',
    productId:      'mkt-mentoring-1',
    productTitle:   'Mentoria 1:1',
    buyerWalletId:  'wallet-proj-buyer',
    sellerWalletId: 'wallet-proj-seller',
    priceEur:       50,
    stripeAccountId:'acct_test_xyz',
});
eq(sale.type, 'connect_sale',                               'G · type correcte');
t(sale.id.startsWith('connect-sale-'),                      'G · id prefix');
eq(sale.content.priceEur,        50,                        'G · priceEur al content');
eq(sale.content.feeEur,          4,                         'G · feeEur 50×8%=4');
eq(sale.content.sellerEur,       46,                        'G · sellerEur 46');
eq(sale.content.platformWalletId, PLATFORM_WALLET_PROJECT_ID, 'G · platformWalletId del canonical');
eq(sale.content.stripeAccountId, 'acct_test_xyz',           'G · stripeAccountId preservat');
eq(sale.content.signature, null,                            'G · signature null inicial · firmable sprint B');
t(sale.keywords.includes('type:connect-sale'),              'G · keyword type');
t(sale.keywords.some(k => k.startsWith('seller:')),         'G · keyword seller');

threw = null;
try { buildConnectSaleNode({}); } catch (e) { threw = e; }
t(threw,                                                    'G · sense args · throw');
threw = null;
try { buildConnectSaleNode({ sessionId: 'x' }); } catch (e) { threw = e; }
t(threw && /buyerWalletId/.test(threw.message),             'G · sense buyer · throw');

// ─── H · recordConnectSale · 3 movements + node + receipt ─────────
const calls = { consume: [], topUp: [], receipt: [] };
const mockWalletApi = {
    consumeAndPersist: async (args) => { calls.consume.push(args); return { content: { balanceEur: 999 } }; },
    topUpAndPersist:   async (args) => { calls.topUp.push(args); return { content: { balanceEur: 999 } }; },
};
const mockReceiptApi = {
    recordReceipt: async (args) => { calls.receipt.push(args); return { id: 'r1', content: args }; },
};
// TEA-UNIV-001 · ara recordConnectSale persisteix 1 sale node + N attestation nodes.
// Tracegem totes les upserts i busquem el connect_sale específicament.
const mockKb = { upsert: async (n) => { calls.upserts = (calls.upserts || []); calls.upserts.push(n); if (n.type === 'connect_sale') calls.salePersisted = n; return n; } };

const result = await recordConnectSale({
    sessionId:        'cs_real_001',
    productId:        'mkt-product-1',
    productTitle:     'Workshop',
    buyerProjectId:   'proj-buyer',
    sellerProjectId:  'proj-seller',
    priceEur:         100,
    stripeAccountId:  'acct_seller_1',
    kb:               mockKb,
    walletApi:        mockWalletApi,
    receiptApi:       mockReceiptApi,
});
// 3 movements registrats?
eq(calls.consume.length, 1,                                 'H · 1 consume (buyer)');
eq(calls.topUp.length,   2,                                 'H · 2 topUp (platform + seller)');
eq(calls.consume[0].projectId, 'proj-buyer',                'H · consume del buyer');
eq(calls.consume[0].amountEur,  100,                        'H · consume amount 100');
eq(calls.consume[0].source,    'connect-buyer',             'H · consume source');
eq(calls.topUp[0].projectId,  PLATFORM_WALLET_PROJECT_ID,   'H · primer topUp · platform wallet');
eq(calls.topUp[0].amountEur,  8,                            'H · platform topUp 8€ (fee)');
eq(calls.topUp[0].source,    'connect-platform-fee',        'H · platform source');
eq(calls.topUp[1].projectId, 'proj-seller',                 'H · segon topUp · seller');
eq(calls.topUp[1].amountEur, 92,                            'H · seller topUp 92€ (net)');
eq(calls.topUp[1].source,   'connect-seller',               'H · seller source');
// Sale node persistit al KB?
t(calls.salePersisted && calls.salePersisted.type === 'connect_sale', 'H · connect_sale node persisted');
// TEA-UNIV-001 · ara també persistim wallet_attestation nodes parejats
const teaAtts = (calls.upserts || []).filter(n => n.type === 'wallet_attestation');
t(teaAtts.length === 2,                                                'H · TEA · 2 attestations parejats (platform fee + seller net)');
t(teaAtts.every(a => a.content.kind === 'wallet-transfer'),            'H · TEA · kind wallet-transfer');
// Receipt creat per al buyer?
eq(calls.receipt.length, 1,                                 'H · 1 receipt creat per al buyer');
eq(calls.receipt[0].paymentMethod, 'stripe-connect',        'H · receipt paymentMethod');
eq(calls.receipt[0].amountEur, 100,                         'H · receipt amount = priceEur');
// Return shape complet
eq(result.sale.type, 'connect_sale',                        'H · result.sale');
t(result.platformMovement !== null,                         'H · result.platformMovement');
t(result.sellerMovement,                                    'H · result.sellerMovement');
t(result.buyerMovement,                                     'H · result.buyerMovement');

// ─── I · fee=0 · skip platform topup ─────────────────────────────────
const calls2 = { consume: [], topUp: [], receipt: [] };
const mockWalletApi2 = {
    consumeAndPersist: async (args) => { calls2.consume.push(args); return { content: { balanceEur: 999 } }; },
    topUpAndPersist:   async (args) => { calls2.topUp.push(args); return { content: { balanceEur: 999 } }; },
};
const mockReceiptApi2 = { recordReceipt: async () => null };
const r2 = await recordConnectSale({
    sessionId:        'cs_zero_fee',
    productId:        'free-product',
    buyerProjectId:   'b',
    sellerProjectId:  's',
    priceEur:         10,
    platformFeePct:   0,           // 0% fee
    walletApi:        mockWalletApi2,
    receiptApi:       mockReceiptApi2,
});
eq(calls2.topUp.length, 1,                                  'I · fee=0% · sols 1 topUp (seller · no platform)');
eq(calls2.topUp[0].projectId, 's',                          'I · seller únic recipient');
eq(calls2.topUp[0].amountEur, 10,                           'I · seller 100% (no fee)');
t(r2.platformMovement === null,                             'I · platformMovement null per fee=0');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
