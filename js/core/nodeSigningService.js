// =============================================================================
// TEAMTOWERS SOS V11 — NODE SIGNING SERVICE (TEA-SIGN-001 sprint A)
//
// Servei genèric de signatura ECDSA P-256 per a QUALSEVOL node KB amb shape:
//   content: { publicJwk, signature: null, signatureFormat, ...payload }
// Generalització del patró de attestationService · publicProjectService ·
// publicEntityService que cada un té el seu propi canonicalize+sign.
//
// Filosofia · 1 servei = 1 cop d'eina · totes les firmes passen per aquí.
// Cada node firmat queda auditable + verifiable + publicable al permaweb.
//
// Camps exclosos del canonical hash (signed-over):
//   - content.signature   (es genera amb el hash · circular)
//   - content.arweaveTxId (assignat post-upload Turbo)
//   - content._cachedAt   (cache local · no part de la veritat)
//   - content._fromPermaweb · _verified · _ttlExpiresAt · _mockMode
// =============================================================================

export const NODE_SIGNATURE_FORMAT = 'ECDSA-P256-SHA256-base64';

const EPHEMERAL_KEYS = Object.freeze([
    'signature', 'arweaveTxId',
    '_cachedAt', '_fromPermaweb', '_verified', '_ttlExpiresAt', '_mockMode',
    'permawebPublishedAt',  // metadata post-publish
]);

// canonicalizeNode · pure · JSON ordenat estable · exclou camps efímers
export function canonicalizeNode(node) {
    if (!node || !node.content) throw new Error('canonicalizeNode requires node.content');
    const cleanContent = {};
    for (const k of Object.keys(node.content)) {
        if (EPHEMERAL_KEYS.includes(k)) continue;
        cleanContent[k] = node.content[k];
    }
    const canonical = {
        id:       node.id,
        type:     node.type,
        projectId: node.projectId || null,
        content:  _sortedKeys(cleanContent),
        keywords: Array.isArray(node.keywords) ? node.keywords.slice().sort() : [],
        createdAt: node.createdAt,
    };
    return JSON.stringify(canonical);
}

function _sortedKeys(obj) {
    if (Array.isArray(obj)) return obj.map(_sortedKeys);
    if (obj === null || typeof obj !== 'object') return obj;
    const out = {};
    for (const k of Object.keys(obj).sort()) out[k] = _sortedKeys(obj[k]);
    return out;
}

// Web Crypto helpers · navegador + Node 18+
function _subtle() {
    const c = (typeof crypto !== 'undefined' && crypto.subtle) ? crypto.subtle
            : (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) ? globalThis.crypto.subtle
            : null;
    if (!c) throw new Error('Web Crypto subtle unavailable');
    return c;
}
function _bytesToBase64(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return (typeof btoa !== 'undefined') ? btoa(s) : Buffer.from(s, 'binary').toString('base64');
}
function _base64ToBytes(b64) {
    const s = (typeof atob !== 'undefined') ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
}

// signNode · async · firma in-place i retorna nova versió amb content.signature
export async function signNode({ node, privateJwk } = {}) {
    if (!node || !node.content) throw new Error('signNode requires node.content');
    if (!privateJwk || privateJwk.kty !== 'EC' || privateJwk.crv !== 'P-256' || !privateJwk.d) {
        throw new Error('signNode requires ECDSA P-256 privateJwk with "d"');
    }
    const pub = node.content.publicJwk;
    if (pub && (pub.x !== privateJwk.x || pub.y !== privateJwk.y)) {
        throw new Error('signNode · publicJwk no coincideix amb privateJwk');
    }
    const subtle = _subtle();
    const canonical = canonicalizeNode(node);
    const data = new TextEncoder().encode(canonical);
    const key = await subtle.importKey('jwk', privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    const sigBuf = await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, data);
    const signature = _bytesToBase64(new Uint8Array(sigBuf));
    return {
        ...node,
        content: { ...node.content, signature, signatureFormat: NODE_SIGNATURE_FORMAT },
        updatedAt: Date.now(),
    };
}

// verifyNode · async · valida la signatura content.signature
export async function verifyNode(node) {
    if (!node || !node.content)            return { valid: false, reason: 'invalid-shape' };
    const c = node.content;
    if (!c.signature)                       return { valid: false, reason: 'no-signature' };
    if (c.signatureFormat && c.signatureFormat !== NODE_SIGNATURE_FORMAT) {
        return { valid: false, reason: 'unsupported-format · ' + c.signatureFormat };
    }
    if (!c.publicJwk || c.publicJwk.kty !== 'EC' || c.publicJwk.crv !== 'P-256') {
        return { valid: false, reason: 'invalid-publicJwk' };
    }
    let sigBytes;
    try { sigBytes = _base64ToBytes(c.signature); }
    catch (_) { return { valid: false, reason: 'invalid-signature-encoding' }; }
    const subtle = _subtle();
    const canonical = canonicalizeNode(node);
    const data = new TextEncoder().encode(canonical);
    try {
        const key = await subtle.importKey('jwk', c.publicJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
        const ok = await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, sigBytes, data);
        return ok ? { valid: true } : { valid: false, reason: 'signature-mismatch' };
    } catch (e) {
        return { valid: false, reason: 'verify-failed · ' + (e?.message || 'unknown') };
    }
}

// signAndVerifyRoundtrip · debug helper · útil per als tests
export async function signAndVerifyRoundtrip({ node, privateJwk } = {}) {
    const signed = await signNode({ node, privateJwk });
    const result = await verifyNode(signed);
    return { signed, result };
}
