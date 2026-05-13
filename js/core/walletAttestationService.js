// =============================================================================
// TEAMTOWERS SOS V11 — WALLET ATTESTATION SERVICE (TEA-UNIV-001 sprint A)
//
// Triple-Entry Accounting universal · cada wallet movement consume/topup/
// refund pot tenir un node `wallet_attestation` firmat ECDSA P-256 que
// declara · payer (qui paga · wallet+did) · receiver (qui rep) · amount ·
// timestamp · source. Permet auditar parejes pay+receive sense doble
// comptabilitat (TEA principle 4).
//
// Filosofia · NO substitueix wallet.content.movements (segueix sent la
// font de saldo) · AFEGEIX una capa d'attestation auditable + firmable +
// publicable al permaweb.
//
// Cada attestation enllaça 2 movements parells si existeixen:
//   payerMovement (consume del payer)
//   receiverMovement (topup del receiver)
// O 1 movement si és top-up extern (stripe topup · no payer SOS).
//
// El node tipus `wallet_attestation` és pure-data · sense saldo · sols
// referències + signatura. Quan es publica al permaweb forma part del
// CV nodal financer de l'usuari.
// =============================================================================

export const WALLET_ATTESTATION_TYPE = 'wallet_attestation';

// MOVEMENT_ATTESTATION_KINDS · enum congelat
export const MOVEMENT_ATTESTATION_KINDS = Object.freeze([
    'wallet-topup',          // entrada de saldo (stripe topup, refund, claim, etc.)
    'wallet-consume',        // sortida de saldo (ai-fill, publish, workshop-unlock, etc.)
    'wallet-transfer',       // payer + receiver al sistema SOS · paired
    'wallet-refund',         // restauració saldo post-fail
    'wallet-split-revenue',  // workshop 70/20/10 split · paired triplet
]);

// walletAttestationIdFor · pure · idempotent per a un movement ref
export function walletAttestationIdFor({ ref, walletId } = {}) {
    if (!ref || !walletId) throw new Error('walletAttestationIdFor requires ref + walletId');
    const a = String(ref).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40);
    const b = String(walletId).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 32);
    return 'wallet-att-' + b + '-' + a;
}

// buildMovementAttestation · pure · construeix node sense signatura
//   { kind, payer:{walletId,projectId,ownerDid?}, receiver:{walletId,projectId,ownerDid?},
//     amountEur, source, ref, ts?, meta? }
// `payer` o `receiver` poden ser null si el movement és externa (topup Stripe
// sense payer SOS · refund sense receiver, etc.).
export function buildMovementAttestation({
    kind,
    payer        = null,
    receiver     = null,
    amountEur,
    source       = null,
    ref          = null,
    ts           = null,
    meta         = null,
    publicJwk    = null,    // opcional · si es passa, queda al content per a sign
} = {}) {
    if (!kind || !MOVEMENT_ATTESTATION_KINDS.includes(kind)) {
        throw new Error('buildMovementAttestation · unknown kind: ' + kind);
    }
    if (typeof amountEur !== 'number' || !isFinite(amountEur) || amountEur < 0) {
        throw new Error('buildMovementAttestation · amountEur must be ≥ 0');
    }
    if (!payer && !receiver) {
        throw new Error('buildMovementAttestation requires at least one of payer/receiver');
    }
    if (!ref) {
        throw new Error('buildMovementAttestation requires ref (movement identifier)');
    }
    const at = typeof ts === 'number' ? ts : Date.now();
    // ID derivat del primer wallet disponible · primer payer si existeix
    const idWallet = payer?.walletId || receiver?.walletId;
    const id = walletAttestationIdFor({ ref, walletId: idWallet });
    const cleanParty = (p) => p ? {
        walletId:  String(p.walletId).slice(0, 80),
        projectId: p.projectId ? String(p.projectId).slice(0, 80) : null,
        ownerDid:  p.ownerDid && p.ownerDid.startsWith('did:sos:') ? p.ownerDid : null,
    } : null;
    return {
        id,
        type: WALLET_ATTESTATION_TYPE,
        content: {
            kind,
            payer:        cleanParty(payer),
            receiver:     cleanParty(receiver),
            amountEur:    Number(amountEur.toFixed(6)),
            source:       source ? String(source).slice(0, 64) : null,
            ref:          String(ref).slice(0, 120),
            ts:           at,
            meta:         (meta && typeof meta === 'object') ? meta : null,
            publicJwk:    publicJwk ? { ...publicJwk, d: undefined } : null,
            signatureFormat: 'ECDSA-P256-SHA256-base64',
            signature:    null,
        },
        keywords: [
            'type:wallet-attestation',
            'kind:' + kind,
            ...(payer?.walletId    ? ['payer:' + String(payer.walletId).slice(0, 60)] : []),
            ...(receiver?.walletId ? ['receiver:' + String(receiver.walletId).slice(0, 60)] : []),
            ...(source ? ['source:' + source] : []),
            ...(payer?.ownerDid    ? ['payerDid:' + payer.ownerDid] : []),
            ...(receiver?.ownerDid ? ['receiverDid:' + receiver.ownerDid] : []),
        ],
        createdAt: at,
        updatedAt: at,
    };
}

// validateMovementAttestation · pure · defensive · alineat amb nodeSigning
export function validateMovementAttestation(node) {
    const errors = [];
    if (!node || typeof node !== 'object') return { valid: false, errors: ['node must be object'] };
    if (node.type !== WALLET_ATTESTATION_TYPE) errors.push('type must be ' + WALLET_ATTESTATION_TYPE);
    const c = node.content;
    if (!c) return { valid: false, errors: errors.concat(['content required']) };
    if (!MOVEMENT_ATTESTATION_KINDS.includes(c.kind)) errors.push('kind invalid');
    if (typeof c.amountEur !== 'number') errors.push('amountEur required');
    if (!c.ref) errors.push('ref required');
    if (!c.payer && !c.receiver) errors.push('at least one of payer/receiver required');
    if (c.publicJwk && 'd' in c.publicJwk) errors.push('publicJwk MUST NOT contain "d"');
    return { valid: errors.length === 0, errors };
}

// recordMovementAttestation · async · alta nivell · build + persist al KB
// Opcional · firmar amb privateJwk si es passa. Si fail · retorna null (no
// llança · fire-and-forget per al caller).
export async function recordMovementAttestation({
    kb, kind, payer, receiver, amountEur, source, ref, ts, meta,
    privateJwk = null,
} = {}) {
    try {
        if (!kb) throw new Error('kb required');
        // Auto-extreu publicJwk del privateJwk per a quedar al content
        const publicJwk = privateJwk
            ? Object.fromEntries(Object.entries(privateJwk).filter(([k]) => k !== 'd'))
            : null;
        let att = buildMovementAttestation({ kind, payer, receiver, amountEur, source, ref, ts, meta, publicJwk });
        if (privateJwk) {
            try {
                const { signNode } = await import('./nodeSigningService.js');
                att = await signNode({ node: att, privateJwk });
            } catch (e) {
                console.warn('[wallet-attestation] sign failed · persistim sense signatura', e?.message);
            }
        }
        await kb.upsert(att);
        return att;
    } catch (e) {
        console.warn('[wallet-attestation] record failed', e?.message);
        return null;
    }
}

// Helpers per a stats UI · agrupacions per kind/source
export function summarizeAttestationsByKind(atts) {
    const out = {};
    for (const a of (atts || [])) {
        const k = a?.content?.kind || 'unknown';
        out[k] = (out[k] || 0) + 1;
    }
    return out;
}
export function sumAttestationsAmountEur(atts) {
    let s = 0;
    for (const a of (atts || [])) {
        const v = a?.content?.amountEur;
        if (typeof v === 'number') s += v;
    }
    return Number(s.toFixed(6));
}
