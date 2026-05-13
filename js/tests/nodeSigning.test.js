// TEA-SIGN-001 sprint A · tests stand-alone per nodeSigningService.
// Ús: node js/tests/nodeSigning.test.js

import {
    NODE_SIGNATURE_FORMAT,
    canonicalizeNode, signNode, verifyNode, signAndVerifyRoundtrip,
} from '../core/nodeSigningService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== TEA-SIGN-001 sprint A · nodeSigningService ===\n');

// ── Gen ECDSA P-256 keypair per a tests (Web Crypto · Node 18+) ────────
async function genKeypair() {
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const privateJwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
    const publicJwk  = await crypto.subtle.exportKey('jwk', kp.publicKey);
    return { privateJwk, publicJwk };
}
const { privateJwk, publicJwk } = await genKeypair();

// ── A · canonical ─────────────────────────────────────────────────────
const node1 = {
    id: 'n1', type: 'neural_path_bundle', projectId: 'p1', createdAt: 100,
    content: {
        ownerHandle: '@a', name: 'Test', stepIds: ['s1'],
        publicJwk, signature: null, signatureFormat: NODE_SIGNATURE_FORMAT,
        // Camps efímers · NO han de ser part del hash
        arweaveTxId: null, _cachedAt: 999, _fromPermaweb: true,
    },
    keywords: ['k1', 'k0'],
};
const canon1 = canonicalizeNode(node1);
t(typeof canon1 === 'string' && canon1.startsWith('{'),          'A · canonical retorna JSON');
t(!canon1.includes('"signature"'),                                'A · canonical exclou signature');
t(!canon1.includes('"arweaveTxId"'),                              'A · canonical exclou arweaveTxId');
t(!canon1.includes('"_cachedAt"'),                                'A · canonical exclou _cachedAt');
t(!canon1.includes('"_fromPermaweb"'),                            'A · canonical exclou _fromPermaweb');

// Idempotència
const canon2 = canonicalizeNode(node1);
eq(canon1, canon2,                                                'A · idempotent');

// Keywords ordenades
t(canon1.indexOf('"k0"') < canon1.indexOf('"k1"'),                'A · keywords ordenades alfabèticament');

// ── B · signNode + verifyNode roundtrip ──────────────────────────────
const signed = await signNode({ node: node1, privateJwk });
t(typeof signed.content.signature === 'string' && signed.content.signature.length > 20, 'B · signature base64 generada');
eq(signed.content.signatureFormat, NODE_SIGNATURE_FORMAT,         'B · format ECDSA-P256-SHA256-base64');
t(signed.updatedAt > 0,                                           'B · updatedAt actualitzat');
// content original no modificat (immutabilitat)
eq(node1.content.signature, null,                                 'B · node original immutable');

const verify1 = await verifyNode(signed);
t(verify1.valid,                                                  'B · verify · valid TRUE');

// ── C · tampering · qualsevol canvi al content invalida la firma ────
const tampered = JSON.parse(JSON.stringify(signed));
tampered.content.name = 'Tampered name';
const verifyT = await verifyNode(tampered);
t(!verifyT.valid && /mismatch/.test(verifyT.reason),              'C · tamper content.name · invalid');

const tampered2 = JSON.parse(JSON.stringify(signed));
tampered2.content.stepIds.push('s2');
const verifyT2 = await verifyNode(tampered2);
t(!verifyT2.valid,                                                'C · tamper stepIds · invalid');

// ── D · camps efímers NO invaliden la firma ─────────────────────────
const withTx = JSON.parse(JSON.stringify(signed));
withTx.content.arweaveTxId = 'tx_xyz_123';
withTx.content._cachedAt = 555555;
withTx.content._fromPermaweb = false;
withTx.content.permawebPublishedAt = 12345;
const verifyEph = await verifyNode(withTx);
t(verifyEph.valid,                                                'D · afegir arweaveTxId + _cachedAt · firma segueix valid');

// ── E · privateJwk validacions ──────────────────────────────────────
let threw = null;
try { await signNode({ node: node1, privateJwk: { kty: 'RSA' } }); } catch (e) { threw = e; }
t(threw && /P-256/.test(threw.message),                           'E · privateJwk no-ECDSA · throw');

threw = null;
try { await signNode({ node: node1, privateJwk: { kty: 'EC', crv: 'P-256' } }); } catch (e) { threw = e; }
t(threw && /"d"/.test(threw.message),                             'E · privateJwk sense "d" · throw');

// publicJwk del content NO coincideix amb privateJwk · mismatch detection
const { privateJwk: pk2 } = await genKeypair();
threw = null;
try { await signNode({ node: signed, privateJwk: pk2 }); } catch (e) { threw = e; }
t(threw && /no coincideix/.test(threw.message),                   'E · publicJwk content ≠ privateJwk · throw');

// ── F · verifyNode amb signature absent · invalid amb reason ───────
const noSig = { ...node1, content: { ...node1.content, signature: null } };
const verifyNo = await verifyNode(noSig);
t(!verifyNo.valid && /no-signature/.test(verifyNo.reason),        'F · sense signature · no-signature');

const badFormat = JSON.parse(JSON.stringify(signed));
badFormat.content.signatureFormat = 'SOME-OTHER';
const verifyBF = await verifyNode(badFormat);
t(!verifyBF.valid && /unsupported-format/.test(verifyBF.reason),  'F · format incompatible · unsupported-format');

const badSig = JSON.parse(JSON.stringify(signed));
badSig.content.signature = 'not-valid-base64!@#';
const verifyBS = await verifyNode(badSig);
t(!verifyBS.valid,                                                'F · signature corrupta · invalid');

// ── G · signAndVerifyRoundtrip helper ──────────────────────────────
const rt = await signAndVerifyRoundtrip({ node: node1, privateJwk });
t(rt.signed && rt.signed.content.signature,                       'G · roundtrip retorna signed + result');
t(rt.result.valid,                                                'G · roundtrip verify valid');

// ── H · canonicalizeNode error · sense content ─────────────────────
threw = null;
try { canonicalizeNode({ id: 'x' }); } catch (e) { threw = e; }
t(threw && /content/.test(threw.message),                         'H · sense content · throw');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
