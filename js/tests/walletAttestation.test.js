// TEA-UNIV-001 sprint A · tests stand-alone per walletAttestationService.
// Ús: node js/tests/walletAttestation.test.js

import {
    WALLET_ATTESTATION_TYPE, MOVEMENT_ATTESTATION_KINDS,
    walletAttestationIdFor,
    buildMovementAttestation, validateMovementAttestation,
    recordMovementAttestation,
    summarizeAttestationsByKind, sumAttestationsAmountEur,
} from '../core/walletAttestationService.js';

let pass = 0, fail = 0;
function t(cond, msg) { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } }
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== TEA-UNIV-001 sprint A · walletAttestationService ===\n');

// A · constants
eq(WALLET_ATTESTATION_TYPE, 'wallet_attestation',                'A · type constant');
t(MOVEMENT_ATTESTATION_KINDS.includes('wallet-consume'),         'A · wallet-consume kind');
t(MOVEMENT_ATTESTATION_KINDS.includes('wallet-transfer'),        'A · wallet-transfer kind');
t(MOVEMENT_ATTESTATION_KINDS.includes('wallet-split-revenue'),   'A · wallet-split-revenue kind');

// B · walletAttestationIdFor · idempotent
eq(walletAttestationIdFor({ ref: 'r1', walletId: 'w1' }),       'wallet-att-w1-r1', 'B · id format');
let threw = null;
try { walletAttestationIdFor({}); } catch (e) { threw = e; }
t(threw,                                                         'B · sense args · throw');

// C · buildMovementAttestation · consume (payer sense receiver)
const att1 = buildMovementAttestation({
    kind: 'wallet-consume',
    payer:    { walletId: 'wallet-proj-a', projectId: 'proj-a', ownerDid: 'did:sos:abcd1234567890abcdef1234' },
    receiver: null,
    amountEur: 0.05,
    source:    'ai-fill',
    ref:       'ai-fill-landing-1',
});
eq(att1.type, WALLET_ATTESTATION_TYPE,                          'C · type correcte');
eq(att1.content.kind, 'wallet-consume',                         'C · kind');
eq(att1.content.amountEur, 0.05,                                'C · amount');
t(att1.content.payer && !att1.content.receiver,                  'C · payer set · receiver null');
eq(att1.content.signature, null,                                'C · signature null inicial');
t(att1.keywords.includes('kind:wallet-consume'),                'C · keyword kind');
t(att1.keywords.some(k => k.startsWith('payer:wallet-proj-a')), 'C · keyword payer');
t(att1.keywords.some(k => k.startsWith('payerDid:')),           'C · keyword payerDid');

// D · transfer (payer + receiver)
const att2 = buildMovementAttestation({
    kind: 'wallet-transfer',
    payer:    { walletId: 'wallet-buyer',  projectId: 'p-buyer' },
    receiver: { walletId: 'wallet-seller', projectId: 'p-seller' },
    amountEur: 92,
    source:    'connect-seller',
    ref:       'connect-sale-xyz',
});
t(att2.content.payer && att2.content.receiver,                   'D · payer + receiver set');
t(att2.keywords.some(k => k.startsWith('receiver:wallet-seller')), 'D · keyword receiver');

// E · throws
threw = null;
try { buildMovementAttestation({ kind: 'wallet-consume', amountEur: 5, ref: 'r' }); } catch (e) { threw = e; }
t(threw && /payer\/receiver/.test(threw.message),                'E · sense payer ni receiver · throw');
threw = null;
try { buildMovementAttestation({ kind: 'unknown', payer: { walletId: 'w' }, amountEur: 5, ref: 'r' }); } catch (e) { threw = e; }
t(threw && /unknown kind/.test(threw.message),                   'E · kind invàlid · throw');
threw = null;
try { buildMovementAttestation({ kind: 'wallet-consume', payer: { walletId: 'w' }, amountEur: -1, ref: 'r' }); } catch (e) { threw = e; }
t(threw && /≥ 0/.test(threw.message),                            'E · amount negatiu · throw');

// F · publicJwk strip · privateJwk d eliminat
const att3 = buildMovementAttestation({
    kind: 'wallet-topup',
    receiver: { walletId: 'wallet-x', projectId: 'p-x' },
    amountEur: 10,
    ref: 'topup-1',
    publicJwk: { kty: 'EC', crv: 'P-256', x: 'X', y: 'Y', d: 'PRIVATE_LEAK' },
});
t(att3.content.publicJwk && !('d' in att3.content.publicJwk) || att3.content.publicJwk.d === undefined, 'F · privateJwk d strippat');

// G · validate
const v1 = validateMovementAttestation(att1);
t(v1.valid,                                                      'G · att1 vàlid');
const v2 = validateMovementAttestation({ type: 'wrong', content: {} });
t(!v2.valid && v2.errors.length,                                 'G · type incorrecte · invalid');

// H · recordMovementAttestation · KB mock
const calls = [];
const mockKb = { upsert: async (n) => { calls.push(n); return n; } };
const att = await recordMovementAttestation({
    kb: mockKb,
    kind: 'wallet-consume',
    payer:    { walletId: 'wallet-x', projectId: 'p-x' },
    receiver: null,
    amountEur: 1.5,
    source:    'ai-fill',
    ref:       'ai-1',
});
eq(calls.length, 1,                                              'H · upsert cridat 1 cop');
eq(att.type, WALLET_ATTESTATION_TYPE,                            'H · retorna node persistit');

// I · recordMovementAttestation sense kb · retorna null sense throw
const att4 = await recordMovementAttestation({ kind: 'wallet-consume', payer: { walletId: 'w' }, amountEur: 1, ref: 'r' });
eq(att4, null,                                                   'I · sense kb · null sense throw');

// J · summarizers
const sample = [att1, att2, att3];
const byKind = summarizeAttestationsByKind(sample);
eq(byKind['wallet-consume'], 1,                                  'J · summary · 1 consume');
eq(byKind['wallet-transfer'], 1,                                 'J · summary · 1 transfer');
eq(byKind['wallet-topup'], 1,                                    'J · summary · 1 topup');

const total = sumAttestationsAmountEur(sample);
eq(total, 102.05,                                                'J · sum · 0.05 + 92 + 10 = 102.05');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
