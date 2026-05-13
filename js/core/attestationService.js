// =============================================================================
// TEAMTOWERS SOS V11 — ATTESTATION SERVICE (FOUNDER-001 sprint D)
//
// Service pur · construcció + signatura + verify d'attestations · Web of
// Trust simple sense backend central. Cada operador SOS pot attestar al
// founder o a altres membres · l'agregació ponderada construeix una
// reputació visible al /registry per a discovery i confiança.
//
// Tipus d'attestation:
//   'endorses-founder'  · "reconec aquest projecte com a founder template"
//   'cohort-member'     · "soc membre actiu de la cohort N"
//   'endorses-operator' · "aquest operador SOS és genuí · DID signat"
//   'workshop-quality'  · "aquest workshop val la pena (escala 1-5)"
//
// Schema · attestation node KB:
//   id           · 'attestation-{txId-hash}' o uid local
//   type         · 'attestation'
//   content:
//     attesterDid       · qui firma (did:sos:...)
//     attesterHandle    · @handle visible
//     attestedId        · targetId (entry id · workshop id · etc.)
//     attestedType      · 'project'|'workshop'|'profile'|'cohort'
//     attestationKind   · veure llista de tipus
//     statement         · 'Reconec aquest projecte com a founder template canònic SOS.'
//     score             · 1-5 opcional (per workshop-quality)
//     signature         · base64 ECDSA P-256 SHA256
//     signatureFormat   · 'ECDSA-P256-SHA256-base64'
//     publicJwk         · {kty:'EC', crv:'P-256', x, y} de l'attester
//     createdAt
//
// PURO · zero KB.query · build i verify són purs · l'orchestrator
// (record/list) és async.
// =============================================================================

export const ATTESTATION_TYPE         = 'attestation';
export const SIGNATURE_FORMAT         = 'ECDSA-P256-SHA256-base64';

export const ATTESTATION_KINDS = Object.freeze([
    'endorses-founder',
    'cohort-member',
    'endorses-operator',
    'workshop-quality',
]);

export const ATTESTED_TYPES = Object.freeze([
    'project',
    'workshop',
    'profile',
    'cohort',
]);

// attestationIdFor · pur · idempotent per a un attester+attested
export function attestationIdFor({ attesterDid, attestedId }) {
    if (!attesterDid || !attestedId) throw new Error('attestationIdFor requires attesterDid + attestedId');
    const sa = attesterDid.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 32);
    const sb = attestedId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40);
    return 'attestation-' + sa + '-' + sb;
}

// validateAttestation · pur · valida shape + camps obligatoris
export function validateAttestation(node) {
    const errors = [];
    if (!node || typeof node !== 'object') return { valid: false, errors: ['node must be object'] };
    if (node.type !== ATTESTATION_TYPE) errors.push("type must be '" + ATTESTATION_TYPE + "'");
    const c = node.content;
    if (!c) return { valid: false, errors: errors.concat(['content required']) };
    if (typeof c.attesterDid !== 'string' || !c.attesterDid.startsWith('did:sos:')) errors.push("content.attesterDid required ('did:sos:...')");
    if (typeof c.attestedId !== 'string'  || !c.attestedId.length) errors.push('content.attestedId required');
    if (!ATTESTED_TYPES.includes(c.attestedType)) errors.push('content.attestedType invalid · expected one of ' + ATTESTED_TYPES.join('|'));
    if (!ATTESTATION_KINDS.includes(c.attestationKind)) errors.push('content.attestationKind invalid · expected one of ' + ATTESTATION_KINDS.join('|'));
    if (typeof c.statement !== 'string' || c.statement.length < 5) errors.push('content.statement required (≥5 chars)');
    if (c.statement && c.statement.length > 500) errors.push('content.statement ≤ 500 chars');
    if (c.score !== undefined && c.score !== null) {
        if (typeof c.score !== 'number' || c.score < 1 || c.score > 5) errors.push('content.score must be 1-5 if present');
    }
    if (!c.publicJwk || typeof c.publicJwk !== 'object') errors.push('content.publicJwk required');
    else if ('d' in c.publicJwk) errors.push('publicJwk MUST NOT contain "d"');
    // DEFENSIVE · camps prohibits (mateixos que public_registry_entry)
    if ('privateJwk' in c) errors.push("content MUST NOT contain 'privateJwk'");
    return { valid: errors.length === 0, errors };
}

// buildAttestation · pura · construeix el node canònic sense signatura
export function buildAttestation({
    attesterDid,
    attesterHandle = null,
    attestedId,
    attestedType,
    attestationKind,
    statement,
    score = null,
    attesterPublicJwk,
    createdAt = Date.now(),
} = {}) {
    if (!attesterDid)       throw new Error('buildAttestation requires attesterDid');
    if (!attestedId)        throw new Error('buildAttestation requires attestedId');
    if (!attesterPublicJwk) throw new Error('buildAttestation requires attesterPublicJwk');
    const { d, ...pubSafe } = attesterPublicJwk;   // strip private key just in case
    const node = {
        id:   attestationIdFor({ attesterDid, attestedId }),
        type: ATTESTATION_TYPE,
        content: {
            attesterDid,
            attesterHandle,
            attestedId,
            attestedType,
            attestationKind,
            statement:       String(statement || '').slice(0, 500),
            score:           (typeof score === 'number') ? score : null,
            signatureFormat: SIGNATURE_FORMAT,
            signature:       null,
            publicJwk:       pubSafe,
            createdAt,
        },
        keywords: [
            'type:attestation',
            'attester:' + attesterDid.slice(0, 24),
            'attested:' + attestedId.slice(0, 24),
            'kind:' + attestationKind,
            'attestedType:' + attestedType,
        ],
        createdAt,
        updatedAt: createdAt,
    };
    const v = validateAttestation(node);
    if (!v.valid) throw new Error('buildAttestation · invalid: ' + v.errors.join(' · '));
    return node;
}

// canonicalizeAttestation · pura · omet signature
export function canonicalizeAttestation(node) {
    if (!node || !node.content) throw new Error('canonicalizeAttestation requires node.content');
    const { signature, ...signableContent } = node.content;
    const canonical = {
        id:        node.id,
        type:      node.type,
        content:   _sortedKeys(signableContent),
        keywords:  Array.isArray(node.keywords) ? node.keywords.slice().sort() : [],
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

// ── Signature ECDSA P-256 SHA-256 (mateix patró que publicRegistryService) ──

function _ensureSubtle() {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        throw new Error('crypto.subtle no disponible');
    }
    return crypto.subtle;
}
function _bytesToBase64(bytes) {
    if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
    let binary = '';
    const len = bytes.byteLength || bytes.length;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}
function _base64ToBytes(b64) {
    if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(b64, 'base64'));
    const binary = atob(b64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
}

export async function signAttestation({ attestation, privateJwk } = {}) {
    if (!attestation || !attestation.content) throw new Error('signAttestation requires attestation');
    if (!privateJwk || privateJwk.kty !== 'EC' || privateJwk.crv !== 'P-256' || !privateJwk.d) {
        throw new Error('signAttestation requires ECDSA P-256 privateJwk with "d"');
    }
    const pub = attestation.content.publicJwk;
    if (pub && (pub.x !== privateJwk.x || pub.y !== privateJwk.y)) {
        throw new Error('signAttestation · publicJwk no coincideix amb privateJwk');
    }
    const subtle = _ensureSubtle();
    const canonical = canonicalizeAttestation(attestation);
    const data = new TextEncoder().encode(canonical);
    const key = await subtle.importKey('jwk', privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    const sigBuf = await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, data);
    const signature = _bytesToBase64(new Uint8Array(sigBuf));
    return {
        ...attestation,
        content: { ...attestation.content, signature, signatureFormat: SIGNATURE_FORMAT },
        updatedAt: Date.now(),
    };
}

export async function verifyAttestation(attestation) {
    if (!attestation || !attestation.content) return { valid: false, reason: 'invalid-shape' };
    const c = attestation.content;
    if (!c.signature) return { valid: false, reason: 'no-signature' };
    if (c.signatureFormat && c.signatureFormat !== SIGNATURE_FORMAT) {
        return { valid: false, reason: 'unsupported-format' };
    }
    if (!c.publicJwk || c.publicJwk.kty !== 'EC' || c.publicJwk.crv !== 'P-256') {
        return { valid: false, reason: 'invalid-publicJwk' };
    }
    let sigBytes;
    try { sigBytes = _base64ToBytes(c.signature); }
    catch (_) { return { valid: false, reason: 'invalid-signature-encoding' }; }
    const subtle = _ensureSubtle();
    const canonical = canonicalizeAttestation(attestation);
    const data = new TextEncoder().encode(canonical);
    try {
        const key = await subtle.importKey('jwk', c.publicJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
        const ok = await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, sigBytes, data);
        return ok ? { valid: true } : { valid: false, reason: 'signature-mismatch' };
    } catch (e) {
        return { valid: false, reason: 'verify-failed · ' + (e?.message || 'unknown') };
    }
}

// ─── Trust scoring · pur · agregat sobre llista d'attestations verificades ──
//
// Score · 1 punt per cada attestation única (per attesterDid)
//         + bonus per founder-anchor attestations (×3 weight)
//         + bonus per cohort-member attestations dins de la mateixa cohort (×1.5)
//
// Retorna · { uniqueAttesters, totalScore, byKind:{}, founderEndorsements }
export function aggregateAttestations(attestations = []) {
    const byAttester = new Map();
    const byKind = {};
    let founderEndorsements = 0;
    for (const a of attestations) {
        if (!a || !a.content) continue;
        if (a._verified === false) continue;
        const c = a.content;
        const did = c.attesterDid;
        if (!did) continue;
        const kind = c.attestationKind;
        const weight = (kind === 'endorses-founder') ? 3
                     : (kind === 'cohort-member')   ? 1.5
                     : 1;
        if (!byAttester.has(did) || byAttester.get(did) < weight) {
            byAttester.set(did, weight);
        }
        byKind[kind] = (byKind[kind] || 0) + 1;
        if (kind === 'endorses-founder') founderEndorsements++;
    }
    let totalScore = 0;
    for (const w of byAttester.values()) totalScore += w;
    return {
        uniqueAttesters:    byAttester.size,
        totalScore:         Number(totalScore.toFixed(2)),
        byKind,
        founderEndorsements,
    };
}

// ─── KB persistence ─────────────────────────────────────────────────────
//
// recordAttestation · async · valida + signa + persisteix al KB
// (idempotent per attesterId+attestedId · re-attestation actualitza)
export async function recordAttestation({ attestation, privateJwk, kb = null } = {}) {
    const signed = await signAttestation({ attestation, privateJwk });
    let KB = kb;
    if (!KB) { try { KB = (await import('./kb.js')).KB; } catch (_) {} }
    if (KB) {
        try { await KB.upsert(signed); }
        catch (e) { console.warn('[attestation] persist failed', e?.message); }
    }
    return signed;
}

// listAttestationsFor · async · llegeix tots els attestations a un targetId
export async function listAttestationsFor(attestedId, { kb = null, verifyOnRead = false } = {}) {
    let KB = kb;
    if (!KB) { try { KB = (await import('./kb.js')).KB; } catch (_) { return []; } }
    try {
        const all = await KB.query({ type: ATTESTATION_TYPE });
        const filtered = (all || []).filter(a => a?.content?.attestedId === attestedId);
        if (!verifyOnRead) return filtered;
        const results = await Promise.all(filtered.map(async a => {
            const v = await verifyAttestation(a);
            return { ...a, _verified: v.valid, _verifyReason: v.reason };
        }));
        return results;
    } catch (_) { return []; }
}
