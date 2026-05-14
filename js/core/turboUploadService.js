// =============================================================================
// TEAMTOWERS SOS V11 — TURBO UPLOAD SERVICE (TURBO-UNIFY-001 sprint A)
//
// Extracció del flow Turbo upload de publicProjectService a un servei generic
// reutilitzable per a totes les entitats publicables (project, work_order,
// market_item, workshop, neural_path_bundle, ...).
//
// Filosofia · 1 funció = 1 cop d'eina · totes les pujades passen per aquí.
//
// Prioritats client Turbo:
//   1. Wander extension (signer-based · zero JWK)
//   2. Keyfile JSON cacheat al KB (/settings · sprint G)
//   3. Unauthenticated (read-only · warn)
// =============================================================================

// uploadNodeToTurbo · async · pure (no side-effect KB) · puja un payload JSON
// firmat al permaweb amb tags i retorna { txId, client, mode }.
//
// Args:
//   payload · string serialitzat (canonical JSON + signature appended)
//   tags    · [{name, value}] · seran tags Arweave
//
// Throws Error si el upload falla · el caller decideix refund logic.
export async function uploadNodeToTurbo({ payload, tags = [] } = {}) {
    if (typeof payload !== 'string' || !payload) {
        throw new Error('uploadNodeToTurbo requires payload string');
    }
    const {
        getArweaveKeyfile, getTurboClient,
        isWanderAvailable, getWanderConnection, getTurboClientForExtension,
    } = await import('./arweaveWalletService.js');

    let client = null;
    let mode = 'unauthenticated';

    // Prioritat 1 · Wander extension
    if (isWanderAvailable()) {
        try {
            const conn = await getWanderConnection();
            if (conn && conn.address) {
                client = await getTurboClientForExtension();
                mode = 'wander';
            }
        } catch (e) {
            console.warn('[turbo-upload] wander failed · fallback keyfile', e?.message);
        }
    }

    // Prioritat 2 · Keyfile JSON cacheat al KB
    if (!client) {
        try {
            const stored = await getArweaveKeyfile();
            if (stored?.jwk) {
                client = await getTurboClient(stored.jwk);
                mode = 'keyfile';
            }
        } catch (_) {}
    }

    // Prioritat 3 · Unauthenticated (read-only · warn)
    if (!client) {
        try {
            const mod = await import('https://esm.sh/@ardrive/turbo-sdk@1.27.1/web');
            const factory = mod.TurboFactory || mod.default || mod;
            client = factory.unauthenticated ? factory.unauthenticated() : factory;
            mode = 'unauthenticated';
            console.warn('[turbo-upload] unauthenticated · cap keyfile · cap extension');
        } catch (e) {
            throw new Error('Turbo SDK load failed: ' + (e?.message || e));
        }
    }

    // Upload
    const result = await client.uploadFile({
        fileStreamFactory: () => new Blob([payload], { type: 'application/json' }).stream(),
        fileSizeFactory:   () => payload.length,
        dataItemOpts:      { tags },
    });
    const txId = result?.id || result?.txId;
    if (!txId) throw new Error('Turbo upload sense txId · resposta inesperada');
    return { txId, mode, client };
}

// buildSignedPayload · helper · combina canonical body + signature pública per
// a generar el JSON final a pujar al permaweb. Mira que la signature i el
// signatureFormat estan al content del entry.
//   canonicalString · string canonical (sense signature)
//   signature       · base64 signature (de content.signature)
//   signatureFormat · format constant (ex. 'ECDSA-P256-SHA256-base64')
export function buildSignedPayload({ canonicalString, signature, signatureFormat } = {}) {
    if (!canonicalString) throw new Error('buildSignedPayload requires canonicalString');
    if (!signature)       throw new Error('buildSignedPayload requires signature');
    const parsed = JSON.parse(canonicalString);
    return JSON.stringify({
        ...parsed,
        signature,
        signatureFormat: signatureFormat || 'ECDSA-P256-SHA256-base64',
    });
}

// commonArweaveTags · helper · tags base que totes les entitats SOS comparteixen
export function commonArweaveTags({ entryType, version = '1.0', extra = [] } = {}) {
    const tags = [
        { name: 'App-Name',     value: 'SOS-V11' },
        { name: 'App-Version',  value: version },
        { name: 'Content-Type', value: 'application/json' },
    ];
    if (entryType) tags.push({ name: 'Entry-Type', value: entryType });
    for (const t of (extra || [])) {
        if (t && t.name && t.value !== undefined && t.value !== null) {
            tags.push({ name: String(t.name), value: String(t.value) });
        }
    }
    return tags;
}
