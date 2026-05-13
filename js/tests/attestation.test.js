// FOUNDER-001 sprint D · tests stand-alone per attestationService
// Ús: node js/tests/attestation.test.js

import * as svc from '../core/attestationService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== FOUNDER-001 sprint D · attestationService ===\n');

// Generem keypair real per a sign/verify tests
const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const privateJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
const publicJwk  = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
const did = 'did:sos:fakedidfortest1234567890abcd';

// ─── A · constants exportades ──────────────────────────────────────────
t(Array.isArray(svc.ATTESTATION_KINDS) && svc.ATTESTATION_KINDS.length === 4, 'A · 4 KINDS exportats');
t(svc.ATTESTATION_KINDS.includes('endorses-founder'),                 'A · endorses-founder');
t(svc.ATTESTATION_KINDS.includes('cohort-member'),                    'A · cohort-member');
t(Array.isArray(svc.ATTESTED_TYPES) && svc.ATTESTED_TYPES.length === 4, 'A · 4 attested types');
eq(svc.ATTESTATION_TYPE, 'attestation',                               'A · ATTESTATION_TYPE');

// ─── B · attestationIdFor · idempotent ──────────────────────────────────
const id1 = svc.attestationIdFor({ attesterDid: did, attestedId: 'proj-x' });
const id2 = svc.attestationIdFor({ attesterDid: did, attestedId: 'proj-x' });
eq(id1, id2,                                                          'B · idempotent · mateix id');
t(id1.startsWith('attestation-'),                                     'B · prefix correcte');

let threw = null;
try { svc.attestationIdFor({}); } catch (e) { threw = e; }
t(threw,                                                              'B · sense args · throw');

// ─── C · buildAttestation · estructura ─────────────────────────────────
const att1 = svc.buildAttestation({
    attesterDid:       did,
    attesterHandle:    '@alvaro',
    attestedId:        'public-project-proj-founder',
    attestedType:      'project',
    attestationKind:   'endorses-founder',
    statement:         'Reconec aquest projecte com a founder template canònic SOS.',
    attesterPublicJwk: publicJwk,
});
eq(att1.type, 'attestation',                                          'C · type=attestation');
eq(att1.content.attesterDid, did,                                     'C · attesterDid preservat');
eq(att1.content.attestationKind, 'endorses-founder',                  'C · attestationKind');
eq(att1.content.signature, null,                                      'C · signature null pre-sign');
t(!('d' in att1.content.publicJwk),                                   'C · publicJwk no porta d (private stripped)');
t(att1.keywords.includes('type:attestation'),                         'C · keyword type:attestation');
t(att1.keywords.includes('kind:endorses-founder'),                    'C · keyword kind');

// ─── D · buildAttestation · errors ──────────────────────────────────────
threw = null;
try { svc.buildAttestation({ attestedId: 'x', attestedType: 'project', attestationKind: 'endorses-founder', statement: 'longe enough', attesterPublicJwk: publicJwk }); } catch (e) { threw = e; }
t(threw && /attesterDid/.test(threw.message),                         'D · sense attesterDid · throw');

threw = null;
try { svc.buildAttestation({ attesterDid: did, attestedId: 'x', attestedType: 'project', attestationKind: 'unknown-kind', statement: 'long enough', attesterPublicJwk: publicJwk }); } catch (e) { threw = e; }
t(threw && /attestationKind/.test(threw.message),                     'D · kind invàlid · throw');

threw = null;
try { svc.buildAttestation({ attesterDid: did, attestedId: 'x', attestedType: 'X', attestationKind: 'endorses-founder', statement: 'long enough', attesterPublicJwk: publicJwk }); } catch (e) { threw = e; }
t(threw && /attestedType/.test(threw.message),                        'D · attestedType invàlid · throw');

threw = null;
try { svc.buildAttestation({ attesterDid: did, attestedId: 'x', attestedType: 'project', attestationKind: 'endorses-founder', statement: '!!', attesterPublicJwk: publicJwk }); } catch (e) { threw = e; }
t(threw && /statement/.test(threw.message),                           'D · statement <5 chars · throw');

threw = null;
try { svc.buildAttestation({ attesterDid: did, attestedId: 'x', attestedType: 'project', attestationKind: 'workshop-quality', statement: 'long enough', score: 10, attesterPublicJwk: publicJwk }); } catch (e) { threw = e; }
t(threw && /score/.test(threw.message),                               'D · score >5 · throw');

// ─── E · signAttestation + verifyAttestation roundtrip ─────────────────
const signed = await svc.signAttestation({ attestation: att1, privateJwk });
t(signed.content.signature && signed.content.signature.length > 50,   'E · signature generada (base64)');
eq(signed.content.signatureFormat, 'ECDSA-P256-SHA256-base64',        'E · signatureFormat');

const v = await svc.verifyAttestation(signed);
t(v.valid === true,                                                   'E · verify · valid=true');

// Modify content · verify falls
const tampered = { ...signed, content: { ...signed.content, statement: 'altered' } };
const v2 = await svc.verifyAttestation(tampered);
t(!v2.valid && v2.reason === 'signature-mismatch',                    'E · tampered · signature-mismatch');

// Without signature · no-signature reason
const unsigned = svc.buildAttestation({
    attesterDid: did, attestedId: 'proj-y', attestedType: 'project',
    attestationKind: 'endorses-founder', statement: 'unsigned attestation here.',
    attesterPublicJwk: publicJwk,
});
const v3 = await svc.verifyAttestation(unsigned);
t(!v3.valid && v3.reason === 'no-signature',                          'E · sense signature · reason no-signature');

// ─── F · signAttestation · errors ──────────────────────────────────────
threw = null;
try { await svc.signAttestation({ attestation: att1, privateJwk: null }); } catch (e) { threw = e; }
t(threw && /privateJwk/.test(threw.message),                          'F · sense privateJwk · throw');

threw = null;
try { await svc.signAttestation({ attestation: att1, privateJwk: { kty: 'RSA' } }); } catch (e) { threw = e; }
t(threw && /privateJwk/.test(threw.message),                          'F · privateJwk no ECDSA · throw');

// Different keypair · publicJwk mismatch
const otherKey = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const otherPriv = await crypto.subtle.exportKey('jwk', otherKey.privateKey);
threw = null;
try { await svc.signAttestation({ attestation: att1, privateJwk: otherPriv }); } catch (e) { threw = e; }
t(threw && /no coincideix/.test(threw.message),                       'F · privateJwk diferent · throw');

// ─── G · canonicalizeAttestation · stable JSON ──────────────────────────
const canon1 = svc.canonicalizeAttestation(att1);
const canon2 = svc.canonicalizeAttestation(att1);
eq(canon1, canon2,                                                    'G · canonical · stable');
t(canon1.length > 100,                                                'G · canonical · no buit');
t(!canon1.includes('"signature"'),                                    'G · canonical · omet signature');

// ─── H · aggregateAttestations · trust scoring ─────────────────────────
const att2 = svc.buildAttestation({
    attesterDid: did, attestedId: 'proj-x', attestedType: 'project',
    attestationKind: 'endorses-founder', statement: 'I endorse this founder template.',
    attesterPublicJwk: publicJwk,
});
const att2b = svc.buildAttestation({
    attesterDid: 'did:sos:bob1234567890', attestedId: 'proj-x', attestedType: 'project',
    attestationKind: 'cohort-member', statement: 'Cohort 0 member endorses this.',
    attesterPublicJwk: publicJwk,
});
const att2c = svc.buildAttestation({
    attesterDid: 'did:sos:carol1234567890', attestedId: 'proj-x', attestedType: 'project',
    attestationKind: 'endorses-operator', statement: 'Endorses operator.',
    attesterPublicJwk: publicJwk,
});

const agg = svc.aggregateAttestations([att2, att2b, att2c]);
eq(agg.uniqueAttesters, 3,                                            'H · 3 unique attesters');
// 3 (founder) + 1.5 (cohort) + 1 (operator) = 5.5
t(Math.abs(agg.totalScore - 5.5) < 0.01,                              'H · totalScore 5.5');
eq(agg.byKind['endorses-founder'], 1,                                 'H · byKind.endorses-founder=1');
eq(agg.byKind['cohort-member'], 1,                                    'H · byKind.cohort-member=1');
eq(agg.founderEndorsements, 1,                                        'H · founderEndorsements=1');

// _verified=false · skip
const aggFiltered = svc.aggregateAttestations([att2, { ...att2b, _verified: false }, att2c]);
eq(aggFiltered.uniqueAttesters, 2,                                    'H · _verified=false · skip');

// Mateix attester · només count una vegada · pren el weight més alt
const sameAttester1 = svc.buildAttestation({
    attesterDid: did, attestedId: 'proj-y', attestedType: 'project',
    attestationKind: 'endorses-operator', statement: 'Attestation A · operator endorse.', attesterPublicJwk: publicJwk,
});
const sameAttester2 = svc.buildAttestation({
    attesterDid: did, attestedId: 'proj-y', attestedType: 'project',
    attestationKind: 'endorses-founder', statement: 'Attestation B · founder endorse, higher weight.', attesterPublicJwk: publicJwk,
});
const aggDedup = svc.aggregateAttestations([sameAttester1, sameAttester2]);
eq(aggDedup.uniqueAttesters, 1,                                       'H · same attester · count 1');
eq(aggDedup.totalScore, 3,                                            'H · pren weight més alt (founder=3)');

// Empty · zero
const aggEmpty = svc.aggregateAttestations([]);
eq(aggEmpty.uniqueAttesters, 0,                                       'H · empty · 0');
eq(aggEmpty.totalScore, 0,                                            'H · empty · 0');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
