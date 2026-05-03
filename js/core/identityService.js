// =============================================================================
// TEAMTOWERS SOS V11 — IDENTITY SERVICE (AUTH-001 sprint A)
// Ruta: /js/core/identityService.js
//
// Identidad local-first del operador. Reusa el keypair ECDSA P-256 que
// projectIO ya genera para firmas; lo eleva a "primary identity" con
// DID sos local + perfil editable. Compatible con Safari 13 / Catalina.
//
// Sprint A: una sola identidad por dispositivo. Sprint B añadirá
// wallet connect (Ethereum/Gnosis) y OAuth providers, ambos vinculados
// al mismo nodo `user_identity` ampliando `wallets[]` y `oauthProviders[]`.
// =============================================================================

import { KB }    from './kb.js';
import { store } from './store.js';
import { getOrCreateSigningKey } from './projectIO.js';

const PRIMARY_IDENTITY_ID_PREFIX = 'user-';

// ─── Funciones puras (sin I/O · testeables) ────────────────────────────────

// Valida shape mínimo de un nodo `user_identity`.
export function validateIdentity(node) {
    const errors = [];
    if (!node || typeof node !== 'object') return { ok: false, errors: ['identity no es objeto'] };
    if (node.type !== 'user_identity')                            errors.push("type debe ser 'user_identity'");
    if (!node.id || typeof node.id !== 'string')                  errors.push('id requerido');
    const c = node.content || {};
    if (!c.primaryDid || typeof c.primaryDid !== 'string')        errors.push('content.primaryDid requerido');
    if (!c.publicKeys || typeof c.publicKeys !== 'object')        errors.push('content.publicKeys requerido');
    if (typeof c.createdAt !== 'number')                          errors.push('content.createdAt debe ser number');
    return { ok: errors.length === 0, errors };
}

// Estampa un nodo con metadatos de autoría.
// PURO · si identity es null/undefined devuelve node tal cual.
// Acepta tanto un userIdentity nodo como un id string.
export function stampNode(node, identity) {
    if (!node) return node;
    const identityId = (typeof identity === 'string')
        ? identity
        : (identity && identity.id) || null;
    if (!identityId) return node;
    const now = Date.now();
    return {
        ...node,
        createdBy:    node.createdBy || identityId,
        lastEditedBy: identityId,
        lastEditedAt: now,
    };
}

// Construye un nodo user_identity canónico con defaults sensatos.
// PURO · no toca KB. Útil para tests.
export function buildIdentityNode({
    primaryDid,
    publicJwk,
    displayName = '',
    handle = '',
    isPrimary = true,
    createdAt = Date.now(),
} = {}) {
    if (!primaryDid)  throw new Error('buildIdentityNode: primaryDid requerido');
    if (!publicJwk)   throw new Error('buildIdentityNode: publicJwk requerido');
    const id = PRIMARY_IDENTITY_ID_PREFIX + primaryDid.replace(/^did:sos:/, '').slice(0, 24);
    return {
        id,
        type:      'user_identity',
        content: {
            displayName,
            handle,
            avatar:        null,
            primaryDid,
            publicKeys:    { signing: publicJwk },
            wallets:       [],
            oauthProviders: [],
            hatTokens:     [],
            isPrimary,
            createdAt,
            lastActiveAt:  createdAt,
            tags: ['kind:user-identity', 'scope:internal'],
        },
        keywords: ['user_identity', primaryDid, 'local-first'],
    };
}

// ─── Helpers async (KB) ────────────────────────────────────────────────────

// SHA-256 hex del JWK público (canonicalizado: x · y · crv · kty · alfabético).
async function _jwkFingerprint(jwk) {
    const canonical = JSON.stringify({
        crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y,
    });
    const buf = new TextEncoder().encode(canonical);
    const hashBuf = await crypto.subtle.digest('SHA-256', buf);
    const hashArr = new Uint8Array(hashBuf);
    return Array.from(hashArr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// DID local-first canónico para SOS · "did:sos:{32 chars hex}".
// Migrable a did:key real en sprint B con noble-secp256k1 si aplica.
export async function deriveDidFromJwk(publicJwk) {
    const fp = await _jwkFingerprint(publicJwk);
    return 'did:sos:' + fp.slice(0, 32);
}

// Devuelve el primary user_identity actual o null si no existe aún.
// No lo crea (use getOrCreateIdentity para garantizarlo).
export async function getCurrentIdentity() {
    await KB.init();
    const all = await KB.query({ type: 'user_identity' });
    if (!all || !all.length) return null;
    const primary = all.find(n => n.content?.isPrimary) || all[0];
    return primary || null;
}

// Garantiza que existe un primary user_identity. Si no, lo crea reusando
// el keypair ECDSA P-256 de projectIO (una sola clave por dispositivo).
// Persiste con KB_UPSERT vía store y devuelve el nodo.
export async function getOrCreateIdentity() {
    const existing = await getCurrentIdentity();
    if (existing) return existing;

    // Reutilizamos el keypair de projectIO (ECDSA P-256 ya en KB)
    const keypair = await getOrCreateSigningKey();
    const did     = await deriveDidFromJwk(keypair.publicJwk);
    const node    = buildIdentityNode({
        primaryDid:  did,
        publicJwk:   keypair.publicJwk,
        displayName: '',
        handle:      '',
        isPrimary:   true,
        createdAt:   keypair.createdAt || Date.now(),
    });
    await store.dispatch({ type: 'KB_UPSERT', payload: { node } });
    return node;
}

// Actualiza el perfil de la identidad activa (displayName, handle, avatar).
// Mantiene las claves intactas. Refresca lastActiveAt.
export async function updateIdentityProfile({ displayName, handle, avatar } = {}) {
    const current = await getOrCreateIdentity();
    const c = current.content || {};
    const updated = {
        ...current,
        content: {
            ...c,
            displayName: typeof displayName === 'string' ? displayName.trim() : c.displayName,
            handle:      typeof handle      === 'string' ? handle.trim()      : c.handle,
            avatar:      typeof avatar      === 'string' ? avatar             : c.avatar,
            lastActiveAt: Date.now(),
        },
    };
    await store.dispatch({ type: 'KB_UPSERT', payload: { node: updated } });
    return updated;
}

// ─── Wallet binding (sprint B · manual) ────────────────────────────────────
// Validación de address Ethereum/EVM: 0x + 40 hex chars. NO valida checksum
// (eso requiere keccak256, lo dejamos para sprint con WalletConnect real).
const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export function isValidEvmAddress(addr) {
    return typeof addr === 'string' && EVM_ADDRESS_RE.test(addr.trim());
}

// Funciones puras que devuelven nuevos nodos sin mutar.
export function addWalletToIdentity(identityNode, { address, chain = 'gnosis', label = '' }) {
    if (!identityNode) throw new Error('addWalletToIdentity: identity requerida');
    if (!isValidEvmAddress(address)) throw new Error('Address EVM inválida (esperado 0x + 40 hex)');
    const norm = address.trim().toLowerCase();
    const c = identityNode.content || {};
    const wallets = Array.isArray(c.wallets) ? c.wallets : [];
    if (wallets.some(w => (w.address || '').toLowerCase() === norm)) {
        // Ya existe · no duplicar, retornamos node tal cual
        return identityNode;
    }
    const nextWallets = [...wallets, {
        address: norm,
        chain:   chain || 'gnosis',
        label:   label ? String(label).trim().slice(0, 60) : '',
        verifiedAt: null,    // sprint B real (con firma) lo rellenará
        addedAt: Date.now(),
    }];
    return {
        ...identityNode,
        content: { ...c, wallets: nextWallets, lastActiveAt: Date.now() },
    };
}

export function removeWalletFromIdentity(identityNode, address) {
    if (!identityNode || !address) return identityNode;
    const norm = address.trim().toLowerCase();
    const c = identityNode.content || {};
    const wallets = Array.isArray(c.wallets) ? c.wallets : [];
    const nextWallets = wallets.filter(w => (w.address || '').toLowerCase() !== norm);
    if (nextWallets.length === wallets.length) return identityNode;
    return {
        ...identityNode,
        content: { ...c, wallets: nextWallets, lastActiveAt: Date.now() },
    };
}

// Helpers async sobre KB
export async function linkWallet({ address, chain = 'gnosis', label = '' }) {
    const current = await getOrCreateIdentity();
    const updated = addWalletToIdentity(current, { address, chain, label });
    if (updated === current) return current;
    await store.dispatch({ type: 'KB_UPSERT', payload: { node: updated } });
    return updated;
}

export async function unlinkWallet(address) {
    const current = await getCurrentIdentity();
    if (!current) return null;
    const updated = removeWalletFromIdentity(current, address);
    if (updated === current) return current;
    await store.dispatch({ type: 'KB_UPSERT', payload: { node: updated } });
    return updated;
}

// Marca lastActiveAt = now sin cambiar el resto. Idempotente.
export async function touchIdentity() {
    const current = await getCurrentIdentity();
    if (!current) return null;
    const updated = {
        ...current,
        content: { ...(current.content || {}), lastActiveAt: Date.now() },
    };
    await store.dispatch({ type: 'KB_UPSERT', payload: { node: updated } });
    return updated;
}
