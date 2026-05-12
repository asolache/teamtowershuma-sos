// TEAMTOWERS SOS V11 — PUBLIC PROJECT SERVICE (FUND-FLOW-001 sprint F)
//
// Schema `public_project_entry` · paral·lel a public_registry_entry però
// per a projectes (no usuaris). Permet a un projecte publicar la seva
// "part pública" al permaweb · qualsevol SOS local pot descobrir-lo a
// /opportunities · sol·licitar entrar com a stakeholder.
//
// Decisions @alvaro:
//   - Funding · wallet del PROJECTE (no el personal del founder)
//   - Pricing · 0.05€ flat publish · 0.05€ flat revoke (mateix que /registry)
//   - Federation default · opt-in explícit (no auto-publish)
//   - Camps safe · nom · descripció · sectorId · subtype · projectType ·
//     looking-for-skills · looking-for-sectors · stakeholders count ·
//     ownerDid (referència · els founders no es publiquen automàticament)
//   - Camps prohibits · wallets · privateJwk · contributions · ledger ·
//     workOrders · roles privats

export const PUBLIC_PROJECT_TYPE = 'public_project_entry';
export const PROJECT_REGISTRY_VERSION = '1.0';

// projectRegistryEntryIdFor · pura · idempotent
export function projectRegistryEntryIdFor(projectId) {
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('projectRegistryEntryIdFor requires projectId');
    }
    const suffix = projectId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40);
    return 'public-project-' + suffix;
}

// validatePublicProjectEntry · pura · defensive contra dades privades
const PROJECT_FORBIDDEN_KEYS = Object.freeze([
    'workOrders', 'ledger', 'telemetry', 'roles',
    'contributions', 'wallets', 'privateJwk', 'wallet',
    'mnemonic', 'apiKeys',
]);

export function validatePublicProjectEntry(node) {
    const errors = [];
    if (!node || typeof node !== 'object') return { valid: false, errors: ['node must be object'] };
    if (node.type !== PUBLIC_PROJECT_TYPE) errors.push(`type must be '${PUBLIC_PROJECT_TYPE}'`);
    const c = node.content;
    if (!c) return { valid: false, errors: errors.concat(['content required']) };
    if (typeof c.projectId !== 'string' || !c.projectId) errors.push('content.projectId required');
    if (typeof c.name !== 'string' || !c.name.trim()) errors.push('content.name required');
    if (typeof c.ownerDid !== 'string' || !c.ownerDid.startsWith('did:sos:')) errors.push("content.ownerDid required ('did:sos:...')");
    if (!c.publicJwk || typeof c.publicJwk !== 'object') errors.push('content.publicJwk required');
    else if ('d' in c.publicJwk) errors.push('publicJwk MUST NOT contain "d"');
    if (c.description && typeof c.description === 'string' && c.description.length > 1000) errors.push('description ≤ 1000 chars');
    if (c.lookingForSkills && !Array.isArray(c.lookingForSkills)) errors.push('lookingForSkills must be array');
    if (c.lookingForSectors && !Array.isArray(c.lookingForSectors)) errors.push('lookingForSectors must be array');
    // DEFENSIVE · camps prohibits
    for (const k of PROJECT_FORBIDDEN_KEYS) {
        if (k in c) errors.push(`content MUST NOT contain '${k}'`);
    }
    for (const k of Object.keys(c)) {
        if (/^private/i.test(k) || /secret/i.test(k)) errors.push(`content key '${k}' looks private`);
    }
    return { valid: errors.length === 0, errors };
}

// extractPublicFieldsFromProject · pura · selecciona només camps safe
// d'un project store entry per publicar al permaweb.
export function extractPublicFieldsFromProject(project) {
    if (!project || typeof project !== 'object') return null;
    return {
        projectId:        project.id,
        name:             project.nombre || project.name || project.id,
        description:      String(project.description || '').slice(0, 1000),
        sectorId:         project.sector_id || project.based_on_sector || null,
        subtype:          project.subtypeId || null,
        projectType:      project.projectType || project.matriuProjectType || null,
        lookingForSkills: Array.isArray(project.lookingForSkills) ? project.lookingForSkills.slice() : [],
        lookingForSectors:Array.isArray(project.lookingForSectors) ? project.lookingForSectors.slice() : [],
        stakeholdersCount: typeof project.stakeholdersCount === 'number'
                           ? project.stakeholdersCount
                           : (Array.isArray(project.roles) ? project.roles.length : 0),
        cohortNumber:     typeof project.matriuCohort === 'number' ? project.matriuCohort : null,
        tags:             Array.isArray(project.tags) ? project.tags.slice() : [],
    };
}

// buildPublicProjectEntry · pura · construeix el node canònic
export function buildPublicProjectEntry({
    project,
    ownerDid,
    ownerPublicJwk,
    overrides = {},
} = {}) {
    if (!project) throw new Error('buildPublicProjectEntry requires project');
    if (!ownerDid) throw new Error('buildPublicProjectEntry requires ownerDid');
    if (!ownerPublicJwk) throw new Error('buildPublicProjectEntry requires ownerPublicJwk');

    const fields = extractPublicFieldsFromProject(project);
    if (!fields) throw new Error('buildPublicProjectEntry · invalid project');

    const now = Date.now();
    const node = {
        id:   projectRegistryEntryIdFor(project.id),
        type: PUBLIC_PROJECT_TYPE,
        projectId: project.id,
        content: {
            kind:     'public-project-entry',
            version:  PROJECT_REGISTRY_VERSION,
            ...fields,
            ...overrides,
            ownerDid,
            publicJwk: stripPrivateJwkFields(ownerPublicJwk),
            publishedAt:     now,
            signatureFormat: 'ECDSA-P256-SHA256-base64',
            signature:       null,
            arweaveTxId:     null,
        },
        keywords: [
            'type:public-project-entry',
            'projectId:' + project.id,
            'ownerDid:' + ownerDid,
            ...(fields.sectorId ? ['sector:' + fields.sectorId] : []),
            ...(fields.projectType ? ['projectType:' + fields.projectType] : []),
            ...(fields.lookingForSkills || []).map(s => 'looking-skill:' + s),
            ...(fields.lookingForSectors || []).map(s => 'looking-sector:' + s),
            ...(typeof fields.cohortNumber === 'number' ? ['cohort:' + fields.cohortNumber] : []),
        ],
        createdAt: now,
        updatedAt: now,
    };
    const v = validatePublicProjectEntry(node);
    if (!v.valid) throw new Error('buildPublicProjectEntry · invalid: ' + v.errors.join(' · '));
    return node;
}

// canonicalizeProjectEntry · pura · omet signature + arweaveTxId
export function canonicalizeProjectEntry(node) {
    if (!node || !node.content) throw new Error('canonicalizeProjectEntry requires node.content');
    const { signature, arweaveTxId, ...signableContent } = node.content;
    const canonical = {
        id:        node.id,
        type:      node.type,
        projectId: node.projectId,
        content:   sortedKeys(signableContent),
        keywords:  Array.isArray(node.keywords) ? node.keywords.slice().sort() : [],
        createdAt: node.createdAt,
    };
    return JSON.stringify(canonical);
}

function sortedKeys(obj) {
    if (Array.isArray(obj)) return obj.map(sortedKeys);
    if (obj === null || typeof obj !== 'object') return obj;
    const out = {};
    for (const k of Object.keys(obj).sort()) out[k] = sortedKeys(obj[k]);
    return out;
}

function stripPrivateJwkFields(jwk) {
    if (!jwk || typeof jwk !== 'object') return jwk;
    const { d, ...pub } = jwk;
    return pub;
}

export function arweaveTagsForProjectEntry(entry) {
    if (!entry || !entry.content) throw new Error('arweaveTagsForProjectEntry requires entry');
    const c = entry.content;
    return [
        { name: 'App-Name',     value: 'SOS-V11' },
        { name: 'App-Version',  value: PROJECT_REGISTRY_VERSION },
        { name: 'Entry-Type',   value: 'public-project-entry' },
        { name: 'ProjectId',    value: c.projectId },
        { name: 'OwnerDid',     value: c.ownerDid },
        { name: 'SectorId',     value: c.sectorId || '' },
        { name: 'Content-Type', value: 'application/json' },
    ];
}

// ── Pricing · igual que el registry d'usuaris · 0.05€ flat (decisió #8) ──
export const PROJECT_PRICING = Object.freeze({
    publishEur: 0.05,
    revokeEur:  0.05,
});

// ── Sign + verify · reutilitza les utilities crypto.subtle ──────────

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

export async function signProjectEntry({ entry, privateJwk } = {}) {
    if (!entry || !entry.content) throw new Error('signProjectEntry requires entry');
    if (!privateJwk || privateJwk.kty !== 'EC' || privateJwk.crv !== 'P-256' || !privateJwk.d) {
        throw new Error('signProjectEntry requires ECDSA P-256 privateJwk with "d"');
    }
    const pub = entry.content.publicJwk;
    if (pub && (pub.x !== privateJwk.x || pub.y !== privateJwk.y)) {
        throw new Error('privateJwk does not match entry.content.publicJwk');
    }
    const subtle = _ensureSubtle();
    const key = await subtle.importKey('jwk', privateJwk, { name:'ECDSA', namedCurve:'P-256' }, false, ['sign']);
    const data = new TextEncoder().encode(canonicalizeProjectEntry(entry));
    const sigBuf = await subtle.sign({ name:'ECDSA', hash:'SHA-256' }, key, data);
    return {
        ...entry,
        content: { ...entry.content, signature: _bytesToBase64(new Uint8Array(sigBuf)), signatureFormat: 'ECDSA-P256-SHA256-base64' },
        updatedAt: Date.now(),
    };
}

export async function verifyProjectEntry(entry) {
    if (!entry || !entry.content) return { valid: false, reason: 'no-content' };
    const c = entry.content;
    if (!c.signature)  return { valid: false, reason: 'no-signature' };
    if (!c.publicJwk)  return { valid: false, reason: 'no-publicJwk' };
    let subtle;
    try { subtle = _ensureSubtle(); } catch (_) { return { valid:false, reason:'crypto-unavailable' }; }
    let sigBytes;
    try { sigBytes = _base64ToBytes(c.signature); } catch (_) { return { valid:false, reason:'invalid-signature-encoding' }; }
    let pubKey;
    try {
        pubKey = await subtle.importKey('jwk', c.publicJwk, { name:'ECDSA', namedCurve:'P-256' }, false, ['verify']);
    } catch (_) { return { valid:false, reason:'invalid-publicJwk' }; }
    const data = new TextEncoder().encode(canonicalizeProjectEntry(entry));
    const ok = await subtle.verify({ name:'ECDSA', hash:'SHA-256' }, pubKey, sigBytes, data);
    return { valid: !!ok, reason: ok ? 'ok' : 'signature-mismatch' };
}

// ── Publish + revoke flow · descompta del wallet DEL PROJECTE (decisió #5) ──
// Si mode mock actiu (PERM-USER-001 setPermawebMockEnabled), skip Turbo + wallet.

export async function publishProjectToPermaweb({ entry, projectId } = {}) {
    if (!entry || !entry.content) throw new Error('publishProjectToPermaweb requires entry');
    if (!projectId) throw new Error('publishProjectToPermaweb requires projectId (font wallet · habitualment el mateix project que es publica)');
    if (!entry.content.signature) throw new Error('must-sign-first');

    const v = await verifyProjectEntry(entry);
    if (!v.valid) throw new Error('publishProjectToPermaweb · invalid signature: ' + v.reason);

    // MOCK MODE check (reutilitza flag de PERM-USER-001)
    try {
        const reg = await import('./publicRegistryService.js');
        if (await reg.isPermawebMockEnabled()) {
            const txId = 'MOCK_TX_PROJ_' + Math.random().toString(36).slice(2, 10);
            const updated = {
                ...entry,
                content: { ...entry.content, arweaveTxId: txId, permawebPublishedAt: Date.now(), _mock: true },
                updatedAt: Date.now(),
            };
            try { const { KB } = await import('./kb.js'); await KB.upsert(updated); } catch (_) {}
            return { entry: updated, txId, costEur: 0, mock: true };
        }
    } catch (_) {}

    const price = PROJECT_PRICING.publishEur;
    const { consumeAndPersist, refundWallet, getOrCreateWalletForProject, persistWallet } = await import('./walletService.js');
    const before = await getOrCreateWalletForProject(projectId);
    if (Number(before.content.balanceEur) < price) {
        throw new Error('insufficient-funds · saldo ' + before.content.balanceEur + '€ < preu ' + price + '€');
    }
    const walletAfter = await consumeAndPersist({
        projectId, amountEur: price,
        ref:    'permaweb-project-publish-' + entry.id,
        source: 'public-project-publish',
        note:   'FUND-FLOW-001 sprint F · publish project ' + entry.content.name,
    });

    let txId;
    try {
        const tags = arweaveTagsForProjectEntry(entry);
        const body = canonicalizeProjectEntry(entry);
        const payload = JSON.stringify({
            ...JSON.parse(body),
            signature:       entry.content.signature,
            signatureFormat: entry.content.signatureFormat,
        });
        // Sprint G · 2026-05-10 · usa keyfile Arweave si configurada al /settings
        const { getArweaveKeyfile, getTurboClient } = await import('./arweaveWalletService.js');
        const stored = await getArweaveKeyfile();
        let client;
        if (stored?.jwk) {
            client = await getTurboClient(stored.jwk);
        }
        if (!client) {
            const mod = await import('https://esm.sh/@ardrive/turbo-sdk@1.27.1/web');
            const factory = mod.TurboFactory || mod.default || mod;
            client = factory.unauthenticated ? factory.unauthenticated() : factory;
            console.warn('[publicProject] publishing unauthenticated · cap keyfile Arweave configurada');
        }
        const result  = await client.uploadFile({
            fileStreamFactory: () => new Blob([payload], { type: 'application/json' }).stream(),
            fileSizeFactory:   () => payload.length,
            dataItemOpts:      { tags },
        });
        txId = result?.id || result?.txId;
        if (!txId) throw new Error('Turbo upload sense txId');
    } catch (e) {
        // Refund
        try {
            const refunded = refundWallet({
                wallet: walletAfter, amountEur: price,
                ref: 'permaweb-project-publish-refund-' + entry.id,
                source: 'public-project-publish-refund',
                note: 'refund · upload failed: ' + (e?.message || e),
            });
            await persistWallet(refunded);
        } catch (_) {}
        throw new Error('turbo-upload-failed: ' + (e?.message || e));
    }

    const updated = {
        ...entry,
        content: { ...entry.content, arweaveTxId: txId, permawebPublishedAt: Date.now() },
        updatedAt: Date.now(),
    };
    try { const { KB } = await import('./kb.js'); await KB.upsert(updated); } catch (_) {}
    return { entry: updated, txId, costEur: price, walletAfter };
}
