// TEAMTOWERS SOS V11 — PUBLIC REGISTRY SERVICE (PERM-USER-001 sprint A)
//
// Sprint A · foundation pure · schema + builder + validator + canonicalize +
// extract des de matriu_member. Zero deps externes · TDD-able sense network.
//
// Decisió @alvaro 2026-05-10 · funding via wallet SOS prepagat (no credit
// card direct) · publish/revoke descompten saldo del wallet del projecte.
//
// Schema `public_registry_entry`:
//   id          · 'registry-{didHex}' · idempotent per DID
//   type        · 'public_registry_entry'
//   content:
//     kind         · 'public-registry-entry'
//     version      · '1.0'
//     did          · 'did:sos:{32hex}' · canonical id
//     handle       · '@alvaro' · opcional
//     displayName  · string · obligatori
//     bio          · string ≤500 chars · opcional
//     avatar       · string (URL/base64) · opcional
//     publicJwk    · clau pública ECDSA · obligatori per verificació
//     skillsDeclared    · array d'IDs (SKILL_TAXONOMY)
//     sectorsExperience · array CNAE A-S
//     availability      · 'high' | 'normal' | 'low'
//     guardianOf        · 1 dels 12 Pantheon Work · opcional
//     cohortNumber      · 0+ · opcional
//     publishedAt       · timestamp creació
//     signatureFormat   · 'ECDSA-P256-SHA256-base64' (constant)
//     signature         · base64 · OMÈS al canonicalize (es signa el body sense signature)
//     arweaveTxId       · null fins post-publish (sprint C)
//
// PROHIBIT al schema (defensive validation):
//   - privateJwk
//   - wallets[]
//   - oauthProviders[]
//   - hatTokens[]
//   - qualsevol clau que comenci per `private` o contingui 'secret'

export const PUBLIC_REGISTRY_TYPE = 'public_registry_entry';
export const REGISTRY_VERSION = '1.0';
export const SIGNATURE_FORMAT = 'ECDSA-P256-SHA256-base64';

const VALID_AVAIL = Object.freeze(['high', 'normal', 'low']);

// ── Pure helpers ─────────────────────────────────────────────────────

// Genera l'id estable de l'entry a partir del DID.
// Idempotent · qualsevol re-build amb el mateix DID dona el mateix id.
export function registryEntryIdFor(did) {
    if (!did || typeof did !== 'string') throw new Error('registryEntryIdFor requires did');
    const suffix = did.replace(/^did:sos:/, '').replace(/[^a-z0-9]/gi, '').slice(0, 32);
    return 'registry-' + suffix;
}

// validatePublicRegistryEntry · pura · valida shape + camps obligatoris
// + DEFENSIU contra dades privades que mai han d'estar al permaweb.
// Retorna { valid: bool, errors: string[] }.
export function validatePublicRegistryEntry(node) {
    const errors = [];
    if (!node || typeof node !== 'object') {
        return { valid: false, errors: ['node must be object'] };
    }
    if (node.type !== PUBLIC_REGISTRY_TYPE) {
        errors.push(`type must be '${PUBLIC_REGISTRY_TYPE}'`);
    }
    if (typeof node.id !== 'string' || !node.id.startsWith('registry-')) {
        errors.push("id must start with 'registry-'");
    }
    const c = node.content;
    if (!c || typeof c !== 'object') {
        return { valid: false, errors: errors.concat(['content must be object']) };
    }
    if (typeof c.did !== 'string' || !c.did.startsWith('did:sos:')) {
        errors.push("content.did must be 'did:sos:{hex}'");
    }
    if (typeof c.displayName !== 'string' || !c.displayName.trim()) {
        errors.push('content.displayName required');
    }
    if (!c.publicJwk || typeof c.publicJwk !== 'object') {
        errors.push('content.publicJwk required (ECDSA P-256 JWK)');
    } else {
        if (c.publicJwk.kty !== 'EC')   errors.push('publicJwk.kty must be "EC"');
        if (c.publicJwk.crv !== 'P-256')errors.push('publicJwk.crv must be "P-256"');
        // d (private scalar) MAI present
        if ('d' in c.publicJwk) errors.push('publicJwk MUST NOT contain "d" (private scalar)');
    }
    if (c.availability && !VALID_AVAIL.includes(c.availability)) {
        errors.push(`availability must be one of ${VALID_AVAIL.join(' | ')}`);
    }
    if (c.skillsDeclared && !Array.isArray(c.skillsDeclared)) {
        errors.push('skillsDeclared must be array');
    }
    if (c.sectorsExperience && !Array.isArray(c.sectorsExperience)) {
        errors.push('sectorsExperience must be array');
    }
    if (c.bio && typeof c.bio === 'string' && c.bio.length > 500) {
        errors.push('bio must be ≤500 chars');
    }
    // DEFENSIVE · cap dada privada
    const FORBIDDEN_KEYS = ['privateJwk', 'wallets', 'oauthProviders', 'hatTokens', 'privateKey', 'secret', 'mnemonic'];
    for (const k of FORBIDDEN_KEYS) {
        if (k in c) errors.push(`content MUST NOT contain '${k}' (private data)`);
    }
    for (const k of Object.keys(c)) {
        if (/^private/i.test(k) || /secret/i.test(k)) {
            errors.push(`content key '${k}' looks private · refuse to publish`);
        }
    }
    return { valid: errors.length === 0, errors };
}

// buildPublicRegistryEntry · pura · construeix el nodo canònic.
// NO crida cap KB · NO signa · NO publica · només construeix el shape.
// Llença Error si hi ha violacions al validate.
export function buildPublicRegistryEntry({
    did,
    handle           = null,
    displayName,
    bio              = '',
    avatar           = null,
    publicJwk,
    skillsDeclared   = [],
    sectorsExperience = [],
    availability     = 'normal',
    guardianOf       = null,
    cohortNumber     = null,
} = {}) {
    if (!did) throw new Error('buildPublicRegistryEntry requires did');
    if (!displayName || !displayName.trim()) throw new Error('buildPublicRegistryEntry requires displayName');
    if (!publicJwk) throw new Error('buildPublicRegistryEntry requires publicJwk');

    const now = Date.now();
    const node = {
        id:   registryEntryIdFor(did),
        type: PUBLIC_REGISTRY_TYPE,
        content: {
            kind:              'public-registry-entry',
            version:           REGISTRY_VERSION,
            did,
            handle:            handle ? String(handle).trim() : null,
            displayName:       String(displayName).trim(),
            bio:               bio ? String(bio).slice(0, 500) : '',
            avatar:            avatar || null,
            publicJwk:         stripPrivateJwkFields(publicJwk),
            skillsDeclared:    Array.isArray(skillsDeclared) ? skillsDeclared.slice() : [],
            sectorsExperience: Array.isArray(sectorsExperience) ? sectorsExperience.slice() : [],
            availability,
            guardianOf:        guardianOf || null,
            cohortNumber:      typeof cohortNumber === 'number' ? cohortNumber : null,
            publishedAt:       now,
            signatureFormat:   SIGNATURE_FORMAT,
            signature:         null,
            arweaveTxId:       null,
        },
        keywords: [
            'type:public-registry-entry',
            'did:' + did,
            ...(handle ? ['handle:' + handle] : []),
            ...(Array.isArray(skillsDeclared)    ? skillsDeclared.map(s => 'skill:' + s) : []),
            ...(Array.isArray(sectorsExperience) ? sectorsExperience.map(s => 'sector:' + s) : []),
            ...(guardianOf ? ['guardian:' + guardianOf] : []),
            ...(typeof cohortNumber === 'number' ? ['cohort:' + cohortNumber] : []),
        ],
        createdAt: now,
        updatedAt: now,
    };
    const v = validatePublicRegistryEntry(node);
    if (!v.valid) throw new Error('buildPublicRegistryEntry · invalid: ' + v.errors.join(' · '));
    return node;
}

// stripPrivateJwkFields · pura · defensive: si l'usuari passa un JWK
// amb camp `d` (private scalar), el treiem. Mai s'inclou al publish.
export function stripPrivateJwkFields(jwk) {
    if (!jwk || typeof jwk !== 'object') return jwk;
    const { d, ...pub } = jwk;   // descarta d explícitament
    return pub;
}

// canonicalizeRegistryEntry · pura · genera el JSON canònic per signar.
// IMPORTANT · omet sempre `content.signature` i `content.arweaveTxId`
// perquè aquests camps es generen DESPRÉS de signar. Ordena claus
// alfabèticament per a reproducibilitat cross-platform.
export function canonicalizeRegistryEntry(node) {
    if (!node || !node.content) throw new Error('canonicalizeRegistryEntry requires node.content');
    const c = node.content;
    // Exclou explícitament signature + arweaveTxId del payload signat
    const { signature, arweaveTxId, ...signableContent } = c;
    const canonical = {
        id:        node.id,
        type:      node.type,
        content:   sortedKeys(signableContent),
        keywords:  Array.isArray(node.keywords) ? node.keywords.slice().sort() : [],
        createdAt: node.createdAt,
    };
    return JSON.stringify(canonical);
}

// sortedKeys · pura · ordena recursivament les claus d'un objecte
// per garantir canonicalització cross-platform (JSON.stringify no
// garanteix ordre de claus).
function sortedKeys(obj) {
    if (Array.isArray(obj)) return obj.map(sortedKeys);
    if (obj === null || typeof obj !== 'object') return obj;
    const out = {};
    for (const k of Object.keys(obj).sort()) {
        out[k] = sortedKeys(obj[k]);
    }
    return out;
}

// extractPublicFromMatriuMember · pura · genera un registry entry des
// d'un node `matriu_member` (que té camps privats + públics fusionats).
// Selecciona NOMÉS els camps safe per al permaweb · descart wallets ·
// oauthProviders · privateJwk · qualsevol cosa amb `private*` o `secret*`.
export function extractPublicFromMatriuMember(member) {
    if (!member || !member.content) return null;
    const c = member.content;
    if (!c.primaryDid || !c.publicJwk) return null;   // necessita DID + clau pública
    return buildPublicRegistryEntry({
        did:               c.primaryDid,
        handle:            c.handle || null,
        displayName:       c.displayName,
        bio:               c.bio || '',
        avatar:            c.avatar || null,
        publicJwk:         c.publicJwk,
        skillsDeclared:    c.skillsDeclared    || [],
        sectorsExperience: c.sectorsExperience || [],
        availability:      c.availability      || 'normal',
        guardianOf:        c.guardianOf        || null,
        cohortNumber:      typeof c.cohortNumber === 'number' ? c.cohortNumber : null,
    });
}

// ── Constants per a tags Arweave (consumits a sprint C) ──────────────

// Tags estàndard amb què cada entry es pujarà al permaweb.
// Permet GraphQL discovery filtrant per App-Name + Entry-Type.
export function arweaveTagsForEntry(entry) {
    if (!entry || !entry.content) throw new Error('arweaveTagsForEntry requires entry');
    const c = entry.content;
    return [
        { name: 'App-Name',     value: 'SOS-V11' },
        { name: 'App-Version',  value: REGISTRY_VERSION },
        { name: 'Entry-Type',   value: 'public-registry-entry' },
        { name: 'DID',          value: c.did },
        { name: 'Handle',       value: c.handle || '' },
        { name: 'Content-Type', value: 'application/json' },
    ];
}

// ── Sprint B · Signatura ECDSA P-256 over canonical JSON ─────────────
//
// Format: 'ECDSA-P256-SHA256-base64' · subtle.sign retorna 64 bytes
// raw r||s · els codifiquem en base64 standard (no urlsafe) per que
// estigui el JSON-friendly i compatible amb GraphQL Arweave tags.
//
// El payload signat és el output de `canonicalizeRegistryEntry(node)`
// que OMET sempre content.signature i content.arweaveTxId. Així podem
// re-signar després d'afegir l'arweaveTxId post-publish sense
// invalidar la firma original.

function _ensureSubtle() {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        throw new Error('crypto.subtle no disponible · necessari per signRegistryEntry (browser modern o node 19+ amb webcrypto)');
    }
    return crypto.subtle;
}

// Bytes → base64 (ASCII safe) · cross-platform (browser + node 19+).
function _bytesToBase64(bytes) {
    if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
    let binary = '';
    const len = bytes.byteLength || bytes.length;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

// base64 → Uint8Array.
function _base64ToBytes(b64) {
    if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(b64, 'base64'));
    const binary = atob(b64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
}

// signRegistryEntry · async · clona l'entry · canonicaliza · signa amb
// privateJwk (ECDSA P-256) · retorna entry amb content.signature filled
// (base64). NO modifica l'entry original (return new object).
//
// Llença Error si:
//   - entry invàlid
//   - privateJwk no és ECDSA P-256 amb 'd'
//   - crypto.subtle no disponible
//   - publicJwk de l'entry no coincideix amb el derivat de privateJwk
//     (defensive · evita signar amb una clau aliena)
export async function signRegistryEntry({ entry, privateJwk } = {}) {
    if (!entry || !entry.content) throw new Error('signRegistryEntry requires entry');
    if (!privateJwk || typeof privateJwk !== 'object') {
        throw new Error('signRegistryEntry requires privateJwk');
    }
    if (privateJwk.kty !== 'EC' || privateJwk.crv !== 'P-256') {
        throw new Error('privateJwk must be ECDSA P-256');
    }
    if (!privateJwk.d) {
        throw new Error('privateJwk lacks "d" (private scalar)');
    }
    // Defensive · privateJwk.{x,y} ha de coincidir amb entry.content.publicJwk.{x,y}
    const pub = entry.content.publicJwk;
    if (pub && (pub.x !== privateJwk.x || pub.y !== privateJwk.y)) {
        throw new Error('privateJwk does not match entry.content.publicJwk · refusing to sign with foreign key');
    }
    const subtle = _ensureSubtle();
    const key = await subtle.importKey(
        'jwk', privateJwk,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false, ['sign']
    );
    const canonical = canonicalizeRegistryEntry(entry);
    const data = new TextEncoder().encode(canonical);
    const sigBuf = await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, data);
    const signature = _bytesToBase64(new Uint8Array(sigBuf));
    return {
        ...entry,
        content: {
            ...entry.content,
            signature,
            signatureFormat: SIGNATURE_FORMAT,
        },
        updatedAt: Date.now(),
    };
}

// verifyRegistryEntry · async · re-canonicaliza · verify amb la
// publicJwk de l'entry mateixa (auto-contained).
// Retorna { valid: bool, reason: string }.
//
// Casos defensius:
//   - signature absent → {valid:false, reason:'no-signature'}
//   - publicJwk absent → {valid:false, reason:'no-publicJwk'}
//   - signatureFormat inesperat → {valid:false, reason:'unsupported-format'}
//   - crypto.subtle no disponible → {valid:false, reason:'crypto-unavailable'}
//   - base64 invàlid → {valid:false, reason:'invalid-signature-encoding'}
//   - signature no verifica → {valid:false, reason:'signature-mismatch'}
//   - valid → {valid:true, reason:'ok'}
export async function verifyRegistryEntry(entry) {
    if (!entry || !entry.content) return { valid: false, reason: 'no-content' };
    const c = entry.content;
    if (!c.signature) return { valid: false, reason: 'no-signature' };
    if (!c.publicJwk) return { valid: false, reason: 'no-publicJwk' };
    if (c.signatureFormat && c.signatureFormat !== SIGNATURE_FORMAT) {
        return { valid: false, reason: 'unsupported-format: ' + c.signatureFormat };
    }
    let subtle;
    try { subtle = _ensureSubtle(); } catch (_) {
        return { valid: false, reason: 'crypto-unavailable' };
    }
    let sigBytes;
    try { sigBytes = _base64ToBytes(c.signature); }
    catch (_) { return { valid: false, reason: 'invalid-signature-encoding' }; }
    let pubKey;
    try {
        pubKey = await subtle.importKey(
            'jwk', c.publicJwk,
            { name: 'ECDSA', namedCurve: 'P-256' },
            false, ['verify']
        );
    } catch (_) { return { valid: false, reason: 'invalid-publicJwk' }; }
    const canonical = canonicalizeRegistryEntry(entry);
    const data = new TextEncoder().encode(canonical);
    let ok;
    try {
        ok = await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pubKey, sigBytes, data);
    } catch (e) {
        return { valid: false, reason: 'verify-threw: ' + (e?.message || e) };
    }
    return { valid: !!ok, reason: ok ? 'ok' : 'signature-mismatch' };
}
