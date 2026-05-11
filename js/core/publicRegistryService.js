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

// ── Sprint C · Permaweb publish via Turbo SDK + wallet SOS ───────────
//
// Decisions @alvaro 2026-05-10:
//   1. Turbo SDK · jsDelivr ESM CDN (`@ardrive/turbo-sdk@latest/+esm`)
//   2. Signing key · MATEIXA del projectIO (compartida) · via
//      `getOrCreateSigningKey` → 1 sol keypair per dispositiu → 1 sol DID
//   3. Pricing flat 0.05€ per publish · 0.05€ per revoke · verify+discovery
//      són free · marge ~99% (cost real Arweave ~$0.0001/KB)

// Constants pricing · publicables a UI per transparency
export const PRICING = Object.freeze({
    publishEur: 0.05,
    revokeEur:  0.05,
    verifyEur:  0,
    queryEur:   0,
});

// Mock helper · l'usuari del module pot injectar un Turbo client mock
// per testing. Per defecte carrega el real des de jsDelivr.
let _turboLoader = null;

// setTurboLoader · per a tests · injecta una funció async que retorna
// l'objecte Turbo simulat. Si no s'ha cridat, la càrrega real es fa.
export function setTurboLoader(loader) {
    _turboLoader = (typeof loader === 'function') ? loader : null;
}

async function _loadTurbo() {
    if (_turboLoader) return _turboLoader();
    // Real load · jsDelivr ESM
    const mod = await import('https://cdn.jsdelivr.net/npm/@ardrive/turbo-sdk@latest/+esm');
    return mod;
}

// publishToPermaweb · async · descompta del wallet del projecte (decisió
// @alvaro #1) · puja al permaweb · actualitza entry amb arweaveTxId ·
// retorna { entry, txId, costEur, walletAfter }.
//
// Flux:
//   1. Verifica que l'entry estigui signat (signRegistryEntry abans)
//   2. consumeAndPersist al wallet del projecte (0.05€)
//   3. Carrega Turbo SDK · upload amb tags estàndard
//   4. Actualitza entry.content.arweaveTxId + content.publishedAt (real)
//   5. Persisteix l'entry al KB
//
// Errors defensius:
//   - entry sense signatura → throw 'must-sign-first'
//   - saldo insuficient → throw 'insufficient-funds' (no upload)
//   - upload falla → refund automàtic + re-throw
export async function publishToPermaweb({
    entry,
    projectId,
    pricing = PRICING,
} = {}) {
    if (!entry || !entry.content) throw new Error('publishToPermaweb requires entry');
    if (!projectId) throw new Error('publishToPermaweb requires projectId (wallet source)');
    if (!entry.content.signature) throw new Error('publishToPermaweb · entry not signed · call signRegistryEntry first');

    // Sanity · verify la firma abans de gastar (defensive)
    const v = await verifyRegistryEntry(entry);
    if (!v.valid) throw new Error('publishToPermaweb · entry signature invalid: ' + v.reason);

    const price = Number(pricing?.publishEur ?? PRICING.publishEur);
    if (!(price >= 0)) throw new Error('publishToPermaweb · invalid pricing');

    // 1. Descompta del wallet · import dinàmic per evitar cicle
    const { consumeAndPersist, getOrCreateWalletForProject } = await import('./walletService.js');
    const before = await getOrCreateWalletForProject(projectId);
    if (Number(before.content.balanceEur) < price) {
        throw new Error('insufficient-funds · saldo ' + before.content.balanceEur + '€ < preu ' + price + '€');
    }

    let walletAfter;
    try {
        walletAfter = await consumeAndPersist({
            projectId,
            amountEur: price,
            kind:      'consume',
            ref:       'permaweb-publish-' + entry.id,
            source:    'public-registry-publish',
            note:      'PERM-USER-001 · publish ' + (entry.content.handle || entry.content.did),
        });
    } catch (e) {
        throw new Error('wallet-consume-failed: ' + (e?.message || e));
    }

    // 2. Upload al permaweb
    let txId;
    try {
        const tags = arweaveTagsForEntry(entry);
        const body = canonicalizeRegistryEntry(entry);
        // Body signat inclou el signature al payload? · YES · el publiquem JUNT amb el signature
        const payload = JSON.stringify({
            ...JSON.parse(body),
            signature:       entry.content.signature,
            signatureFormat: entry.content.signatureFormat,
        });
        const turbo = await _loadTurbo();
        const factory = turbo.TurboFactory || turbo.default || turbo;
        const client  = factory.unauthenticated ? factory.unauthenticated() : factory;
        const result  = await client.uploadFile({
            fileStreamFactory: () => new Blob([payload], { type: 'application/json' }).stream(),
            fileSizeFactory:   () => payload.length,
            dataItemOpts:      { tags },
        });
        txId = result?.id || result?.txId;
        if (!txId) throw new Error('Turbo upload sense txId al response');
    } catch (e) {
        // Refund · revertim el cobrament si l'upload falla
        try {
            const { refundWallet } = await import('./walletService.js');
            const refunded = refundWallet({
                wallet: walletAfter,
                amountEur: price,
                ref:    'permaweb-publish-refund-' + entry.id,
                source: 'public-registry-publish-refund',
                note:   'refund · upload Turbo failed: ' + (e?.message || e),
            });
            // Persisteix refund
            const { KB } = await import('./kb.js');
            await KB.upsert(refunded);
        } catch (_) { /* best-effort refund */ }
        throw new Error('turbo-upload-failed: ' + (e?.message || e));
    }

    // 3. Actualitza l'entry amb arweaveTxId + persisteix al KB
    const updated = {
        ...entry,
        content: {
            ...entry.content,
            arweaveTxId:    txId,
            permawebPublishedAt: Date.now(),
        },
        updatedAt: Date.now(),
    };
    try {
        const { KB } = await import('./kb.js');
        await KB.upsert(updated);
    } catch (_) { /* el txId queda al return igual */ }

    return {
        entry:       updated,
        txId,
        costEur:     price,
        walletAfter,
    };
}

// revokeFromPermaweb · async · publica una nova tx Arweave amb tag
// `Entry-Type=revocation` apuntant al txId original. Cost igual que
// publish · descompta del wallet del projecte.
//
// Retorna { revocationTxId, costEur, walletAfter }.
//
// Decisió @alvaro #4 (default): el lookup descart entries que tenen
// revocation associada · el lookup ho gestiona a sprint D.
export async function revokeFromPermaweb({
    revokesTxId,
    did,
    projectId,
    pricing = PRICING,
} = {}) {
    if (!revokesTxId) throw new Error('revokeFromPermaweb requires revokesTxId (txId original)');
    if (!did) throw new Error('revokeFromPermaweb requires did');
    if (!projectId) throw new Error('revokeFromPermaweb requires projectId (wallet source)');

    const price = Number(pricing?.revokeEur ?? PRICING.revokeEur);
    if (!(price >= 0)) throw new Error('revokeFromPermaweb · invalid pricing');

    const { consumeAndPersist, refundWallet, getOrCreateWalletForProject } = await import('./walletService.js');
    const before = await getOrCreateWalletForProject(projectId);
    if (Number(before.content.balanceEur) < price) {
        throw new Error('insufficient-funds · saldo ' + before.content.balanceEur + '€ < preu ' + price + '€');
    }

    const walletAfter = await consumeAndPersist({
        projectId,
        amountEur: price,
        kind:      'consume',
        ref:       'permaweb-revoke-' + revokesTxId,
        source:    'public-registry-revoke',
        note:      'PERM-USER-001 · revoke ' + did + ' (revokes ' + revokesTxId + ')',
    });

    let revocationTxId;
    try {
        const tags = [
            { name: 'App-Name',     value: 'SOS-V11' },
            { name: 'App-Version',  value: REGISTRY_VERSION },
            { name: 'Entry-Type',   value: 'revocation' },
            { name: 'DID',          value: did },
            { name: 'Revokes',      value: revokesTxId },
            { name: 'Content-Type', value: 'application/json' },
        ];
        const payload = JSON.stringify({
            kind:        'revocation',
            did,
            revokesTxId,
            revokedAt:   Date.now(),
        });
        const turbo = await _loadTurbo();
        const factory = turbo.TurboFactory || turbo.default || turbo;
        const client  = factory.unauthenticated ? factory.unauthenticated() : factory;
        const result  = await client.uploadFile({
            fileStreamFactory: () => new Blob([payload], { type: 'application/json' }).stream(),
            fileSizeFactory:   () => payload.length,
            dataItemOpts:      { tags },
        });
        revocationTxId = result?.id || result?.txId;
        if (!revocationTxId) throw new Error('Turbo revoke sense txId');
    } catch (e) {
        // Refund
        try {
            const refunded = refundWallet({
                wallet: walletAfter, amountEur: price,
                ref:    'permaweb-revoke-refund-' + revokesTxId,
                source: 'public-registry-revoke-refund',
                note:   'refund · revoke upload failed: ' + (e?.message || e),
            });
            const { KB } = await import('./kb.js');
            await KB.upsert(refunded);
        } catch (_) { /* best-effort */ }
        throw new Error('turbo-revoke-failed: ' + (e?.message || e));
    }

    return { revocationTxId, costEur: price, walletAfter };
}

// ── Sprint D · GraphQL discovery + cache TTL al KB ───────────────────
//
// Decisions @alvaro:
//   - Default TTL · 1h discovery active · 24h background · revisable
//     a /settings (sprint E)
//   - Revocació · entries amb tag Entry-Type=revocation apuntant a
//     Revokes={txId} es marquen invalid al lookup
//
// Funcionament:
//   1. queryPermawebRegistry({since, handles, dids}) → llista descriptors
//      (txId, owner, tags, timestamp) via GraphQL arweave.net
//   2. fetchEntryByTxId(txId) → descarrega el body (canonical JSON) via
//      https://arweave.net/{txId}
//   3. cacheToKb(entries, {ttl}) → upsert al KB amb cachedAt + fromPermaweb=true
//   4. getCachedRegistry({maxAge}) síncron · llegeix del KB filtrat
//   5. applyRevocations(entries, revocations) → filter out els revocats

// Configurable via setArweaveGatewayUrl (per testing).
let _arweaveGatewayUrl = 'https://arweave.net';
let _arweaveGraphQLUrl = 'https://arweave.net/graphql';
let _fetchFn = null;  // injectable per testing

export function setArweaveGateway({ baseUrl, graphqlUrl, fetchFn } = {}) {
    if (baseUrl)    _arweaveGatewayUrl = baseUrl;
    if (graphqlUrl) _arweaveGraphQLUrl = graphqlUrl;
    if (fetchFn)    _fetchFn = fetchFn;
}

function _fetch() {
    return _fetchFn || (typeof fetch !== 'undefined' ? fetch : null);
}

// Construeix la query GraphQL amb tags filter. Si `dids` o `handles`
// són arrays, fa OR amb filter per cada un. Si `since` és timestamp,
// limita els resultats. Limit per defecte 100.
function _buildGqlQuery({ dids = [], handles = [], entryType = 'public-registry-entry', since = null, first = 100 } = {}) {
    const tagFilters = [
        '{ name: "App-Name", values: ["SOS-V11"] }',
        `{ name: "Entry-Type", values: ["${entryType}"] }`,
    ];
    if (dids && dids.length)     tagFilters.push('{ name: "DID", values: ' + JSON.stringify(dids) + ' }');
    if (handles && handles.length) tagFilters.push('{ name: "Handle", values: ' + JSON.stringify(handles) + ' }');
    const blockFilter = since ? `block: { min: ${Math.floor(since/1000/120)} }` : '';
    return `{
        transactions(
            tags: [${tagFilters.join(',')}],
            first: ${first},
            sort: HEIGHT_DESC
            ${blockFilter}
        ) {
            edges {
                node {
                    id
                    owner { address }
                    block { timestamp height }
                    tags { name value }
                }
            }
        }
    }`;
}

// queryPermawebRegistry · async · cerca entries al gateway Arweave.
// Retorna array de descriptors { txId, owner, timestamp, tags }.
// Si vol obtenir el body, fer fetchEntryByTxId(txId) després.
export async function queryPermawebRegistry({ dids, handles, since, first = 100, entryType = 'public-registry-entry' } = {}) {
    const fetcher = _fetch();
    if (!fetcher) throw new Error('fetch no disponible');
    const query = _buildGqlQuery({ dids, handles, since, first, entryType });
    const res = await fetcher(_arweaveGraphQLUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error('GraphQL query failed: HTTP ' + res.status);
    const data = await res.json();
    const edges = data?.data?.transactions?.edges || [];
    return edges.map(e => ({
        txId:      e.node.id,
        owner:     e.node.owner?.address || null,
        timestamp: (e.node.block?.timestamp || 0) * 1000,
        height:    e.node.block?.height || null,
        tags:      Object.fromEntries((e.node.tags || []).map(t => [t.name, t.value])),
    }));
}

// fetchEntryByTxId · async · descarrega el body (canonical JSON + signature)
// d'un txId Arweave. Parses i retorna { entry, raw }.
export async function fetchEntryByTxId(txId) {
    if (!txId) throw new Error('fetchEntryByTxId requires txId');
    const fetcher = _fetch();
    if (!fetcher) throw new Error('fetch no disponible');
    const url = _arweaveGatewayUrl + '/' + txId;
    const res = await fetcher(url);
    if (!res.ok) throw new Error('fetchEntryByTxId · HTTP ' + res.status + ' per ' + txId);
    const raw = await res.text();
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) { throw new Error('fetchEntryByTxId · JSON invàlid al body de ' + txId); }

    // Re-construeix l'entry · el payload publicat porta el canonical (sense
    // signature/arweaveTxId) + signature/signatureFormat al top-level (publish
    // sprint C l'afegeix així). Reconstruim el shape original per verifyRegistryEntry.
    if (parsed.id && parsed.type === PUBLIC_REGISTRY_TYPE) {
        // Format antic / canonical pur · ja shape complet
        return { entry: parsed, raw };
    }
    // Format publicat · re-mount
    const entry = {
        id:   parsed.id,
        type: parsed.type || PUBLIC_REGISTRY_TYPE,
        content: { ...(parsed.content || {}), signature: parsed.signature, signatureFormat: parsed.signatureFormat, arweaveTxId: txId },
        keywords:  parsed.keywords || [],
        createdAt: parsed.createdAt || 0,
        updatedAt: parsed.updatedAt || 0,
    };
    return { entry, raw };
}

// applyRevocations · pura · filtra entries marcant invalid els que
// tenen una revocation associada (apunta al seu txId via Revokes tag).
// Retorna entries amb camp `_revoked: true` quan procedeix.
export function applyRevocations(entries = [], revocationDescriptors = []) {
    const revokedTxIds = new Set();
    for (const r of revocationDescriptors) {
        const revokesTx = r?.tags?.Revokes;
        if (revokesTx) revokedTxIds.add(revokesTx);
    }
    return entries.map(e => {
        const tx = e?.content?.arweaveTxId;
        if (tx && revokedTxIds.has(tx)) return { ...e, _revoked: true };
        return e;
    });
}

// cacheToKb · async · upsert entries al KB amb metadata cachedAt + ttl.
// Idempotent · re-cacheging just actualitza updatedAt + cachedAt.
// Default TTL 1h actiu · 24h background. Llegit per getCachedRegistry.
const DEFAULT_TTL_MS = 60 * 60 * 1000;  // 1h
const DEFAULT_TTL_BG_MS = 24 * 60 * 60 * 1000;  // 24h
export { DEFAULT_TTL_MS, DEFAULT_TTL_BG_MS };

export async function cacheToKb(entries = [], { ttlMs = DEFAULT_TTL_MS } = {}) {
    if (!Array.isArray(entries) || entries.length === 0) return { cached: 0, skipped: 0 };
    const { KB } = await import('./kb.js');
    let cached = 0, skipped = 0;
    const now = Date.now();
    for (const entry of entries) {
        if (!entry || !entry.id || entry.type !== PUBLIC_REGISTRY_TYPE) { skipped++; continue; }
        const enriched = {
            ...entry,
            content: {
                ...entry.content,
                _cachedAt:      now,
                _ttlExpiresAt:  now + ttlMs,
                _fromPermaweb:  true,
            },
            updatedAt: now,
        };
        try {
            await KB.upsert(enriched);
            cached++;
        } catch (e) {
            console.warn('[cacheToKb] failed', entry.id, e?.message);
            skipped++;
        }
    }
    return { cached, skipped };
}

// getCachedRegistry · async · llegeix del KB tots els entries cache.
// `maxAge` ms · descart els que excedeixen el TTL.
export async function getCachedRegistry({ maxAge = DEFAULT_TTL_MS } = {}) {
    const { KB } = await import('./kb.js');
    const all = await KB.query({ type: PUBLIC_REGISTRY_TYPE });
    const now = Date.now();
    return (all || []).filter(e => {
        const ageMs = now - (e?.content?._cachedAt || 0);
        return ageMs < maxAge;
    });
}

// syncFromPermaweb · async · helper "tot inclòs" per UI · fa la query +
// fetch dels bodies + applyRevocations + cacheToKb · retorna estat resum.
export async function syncFromPermaweb({ dids, handles, since, ttlMs = DEFAULT_TTL_MS, verifyOnSync = true } = {}) {
    // 1. Query entries
    const entryDescs = await queryPermawebRegistry({ dids, handles, since, entryType: 'public-registry-entry' });
    // 2. Query revocations
    const revocDescs = await queryPermawebRegistry({ dids, handles, since, entryType: 'revocation' });
    // 3. Fetch bodies (paral·lel · cap a 8 alhora · no abusem del gateway)
    const entries = [];
    const failed  = [];
    for (let i = 0; i < entryDescs.length; i += 8) {
        const batch = entryDescs.slice(i, i + 8);
        const results = await Promise.allSettled(batch.map(d => fetchEntryByTxId(d.txId)));
        for (let j = 0; j < results.length; j++) {
            if (results[j].status === 'fulfilled') {
                entries.push(results[j].value.entry);
            } else {
                failed.push({ txId: batch[j].txId, error: results[j].reason?.message || 'unknown' });
            }
        }
    }
    // 4. Apply revocations
    const withRevocations = applyRevocations(entries, revocDescs);
    // 5. Optional · verify signatures
    let verified = withRevocations;
    if (verifyOnSync) {
        const results = await Promise.all(withRevocations.map(async e => {
            if (e._revoked) return e;
            const v = await verifyRegistryEntry(e);
            return { ...e, _verified: v.valid, _verifyReason: v.reason };
        }));
        verified = results;
    }
    // 6. Cache
    const cacheRes = await cacheToKb(verified, { ttlMs });
    return {
        fetched:    entries.length,
        revocations: revocDescs.length,
        failed:     failed.length,
        cached:     cacheRes.cached,
        entries:    verified,
    };
}
