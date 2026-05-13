// =============================================================================
// TEAMTOWERS SOS V11 — PUBLIC ENTITY SERVICE (PUBLISH-SELECT-001 sprint A)
//
// Schema unificat per a publicar al permaweb 3 entitats secundàries lligades
// a un projecte · workOrder · marketItem · workshop. Mirroring el pattern de
// publicProjectService però genèric per evitar 3 mòduls duplicats.
//
// Filosofia · cada entry és independent (txId propi) per a discoverability
// granular a /opportunities. L'ownerDid és el del projecte propietari.
//
// Camps safe per defecte · llistat per ENTITY_PUBLIC_FIELDS (sense forbidden).
// Cost variable per kind · ENTITY_PUBLISH_PRICING.
//
// PUBLISH-SELECT-001 sprint A · backend (servei pur + validators + tests)
// =============================================================================

// PUBLIC_ENTITY_TYPES · constants per a discovery a /opportunities
export const PUBLIC_WORK_ORDER_TYPE  = 'public_work_order_entry';
export const PUBLIC_MARKET_ITEM_TYPE = 'public_market_item_entry';
export const PUBLIC_WORKSHOP_TYPE    = 'public_workshop_entry';

export const PUBLIC_ENTITY_TYPES = Object.freeze({
    work_order:  PUBLIC_WORK_ORDER_TYPE,
    market_item: PUBLIC_MARKET_ITEM_TYPE,
    workshop:    PUBLIC_WORKSHOP_TYPE,
});

export const PUBLIC_ENTITY_VERSION = '1.0';

// PUBLISH-PRICING-001 · cost base per kind · €. Free plan paga +50% fee
// addicional (PUBLISH_FREE_FEE_MULT). Pro/Coop/Ent paguen base · zero fee.
export const ENTITY_PUBLISH_PRICING = Object.freeze({
    project:     0.05,
    workshop:    0.04,
    market_item: 0.03,
    work_order:  0.02,
});

export const PUBLISH_FREE_FEE_MULT = 1.5;   // free pla = base × 1.5

// computePublishCost · pure · cost final segons kind + pla
// Retorna { baseEur, feeEur, totalEur, isFree, planId }
export function computePublishCost({ kind, planId = 'free' } = {}) {
    if (!kind) throw new Error('computePublishCost requires kind');
    const base = ENTITY_PUBLISH_PRICING[kind];
    if (typeof base !== 'number') throw new Error('computePublishCost · unknown kind: ' + kind);
    const isFree = planId === 'free';
    const totalMult = isFree ? PUBLISH_FREE_FEE_MULT : 1.0;
    const totalEur = Number((base * totalMult).toFixed(4));
    const feeEur   = Number((totalEur - base).toFixed(4));
    return { baseEur: base, feeEur, totalEur, isFree, planId };
}

// computeBatchPublishCost · pure · suma de costs per a publicació múltiple
// Input · { items: [{kind, count}, ...], planId } · count default 1
export function computeBatchPublishCost({ items = [], planId = 'free' } = {}) {
    let totalEur = 0, totalBase = 0, totalFee = 0;
    const breakdown = [];
    for (const it of items) {
        const count = typeof it.count === 'number' && it.count > 0 ? it.count : 1;
        const c = computePublishCost({ kind: it.kind, planId });
        const sub = Number((c.totalEur * count).toFixed(4));
        totalBase += c.baseEur * count;
        totalFee  += c.feeEur  * count;
        totalEur  += sub;
        breakdown.push({ kind: it.kind, count, unitEur: c.totalEur, subtotalEur: sub });
    }
    return {
        totalEur:   Number(totalEur.toFixed(4)),
        baseEur:    Number(totalBase.toFixed(4)),
        feeEur:     Number(totalFee.toFixed(4)),
        isFree:     planId === 'free',
        planId,
        breakdown,
    };
}

// ─── Field whitelists per entity ──────────────────────────────────────────

const WORK_ORDER_PUBLIC_FIELDS = Object.freeze([
    'workOrderId', 'projectId', 'title', 'description', 'status',
    'sopRef', 'stepRef', 'roleId',
    'estimatedHours', 'fmvPerHour',
    'lookingForSkills', 'lookingForRoleProfiles',
    'priority', 'deadline', 'tags',
]);
const MARKET_ITEM_PUBLIC_FIELDS = Object.freeze([
    'itemId', 'projectId', 'title', 'description', 'kind',
    'sku', 'cnae', 'sectorTT',
    'priceEur', 'fmvHumanEquivalentEur',
    'deliverables', 'visibility',
    'savingsCompareTo', 'tags',
]);
const WORKSHOP_PUBLIC_FIELDS = Object.freeze([
    'workshopId', 'projectId', 'title', 'description',
    'type', 'sector', 'date', 'audienceSize',
    'accessTier', 'priceEur',
    'tags',
]);

const FIELDS_BY_KIND = Object.freeze({
    work_order:  WORK_ORDER_PUBLIC_FIELDS,
    market_item: MARKET_ITEM_PUBLIC_FIELDS,
    workshop:    WORKSHOP_PUBLIC_FIELDS,
});

const ID_FIELD_BY_KIND = Object.freeze({
    work_order:  'workOrderId',
    market_item: 'itemId',
    workshop:    'workshopId',
});

const PUBLIC_TYPE_BY_KIND = Object.freeze({
    work_order:  PUBLIC_WORK_ORDER_TYPE,
    market_item: PUBLIC_MARKET_ITEM_TYPE,
    workshop:    PUBLIC_WORKSHOP_TYPE,
});

// FORBIDDEN_KEYS · defensive · no es publiquen mai
const FORBIDDEN_KEYS = Object.freeze([
    'wallet', 'wallets', 'privateJwk', 'mnemonic', 'apiKeys',
    'ledger', 'contributions', 'workOrders',
]);

// ─── Pure helpers ─────────────────────────────────────────────────────────

// publicEntityIdFor · pure · idempotent
export function publicEntityIdFor(kind, entityId) {
    if (!kind || !entityId) throw new Error('publicEntityIdFor requires kind + entityId');
    const slug = String(entityId).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 48);
    return 'public-' + kind.replace('_', '-') + '-' + slug;
}

// extractPublicFieldsFromEntity · pure · selecciona només camps safe
export function extractPublicFieldsFromEntity({ kind, entity, projectId } = {}) {
    if (!kind || !entity) return null;
    const allowed = FIELDS_BY_KIND[kind];
    if (!allowed) throw new Error('extractPublicFieldsFromEntity · unknown kind: ' + kind);
    const c = entity.content || entity;
    const out = {};
    // Auto-set the entity-id field from the node id
    const idField = ID_FIELD_BY_KIND[kind];
    out[idField] = entity.id || c[idField] || null;
    out.projectId = projectId || c.projectId || entity.projectId || null;
    for (const k of allowed) {
        if (k === idField || k === 'projectId') continue;
        if (c[k] !== undefined && c[k] !== null) out[k] = c[k];
    }
    return out;
}

// validatePublicEntityEntry · pure · defensive
export function validatePublicEntityEntry(node, kind) {
    const errors = [];
    if (!node || typeof node !== 'object') return { valid: false, errors: ['node must be object'] };
    const expected = PUBLIC_TYPE_BY_KIND[kind];
    if (!expected) errors.push('unknown kind: ' + kind);
    if (node.type !== expected) errors.push(`type must be '${expected}'`);
    const c = node.content;
    if (!c) return { valid: false, errors: errors.concat(['content required']) };
    const idField = ID_FIELD_BY_KIND[kind];
    if (typeof c[idField] !== 'string' || !c[idField]) errors.push('content.' + idField + ' required');
    if (typeof c.projectId !== 'string' || !c.projectId) errors.push('content.projectId required');
    if (typeof c.ownerDid !== 'string' || !c.ownerDid.startsWith('did:sos:')) errors.push("content.ownerDid required ('did:sos:...')");
    if (!c.publicJwk || typeof c.publicJwk !== 'object') errors.push('content.publicJwk required');
    else if ('d' in c.publicJwk) errors.push('publicJwk MUST NOT contain "d"');
    // FORBIDDEN_KEYS defensive
    for (const k of FORBIDDEN_KEYS) {
        if (k in c) errors.push(`content MUST NOT contain '${k}'`);
    }
    for (const k of Object.keys(c)) {
        if (/^private/i.test(k) || /secret/i.test(k)) errors.push(`content key '${k}' looks private`);
    }
    return { valid: errors.length === 0, errors };
}

// stripPrivateJwkFields · helper local · evita d (private)
function stripPrivateJwkFields(jwk) {
    if (!jwk || typeof jwk !== 'object') return jwk;
    const { d, ...pub } = jwk;
    return pub;
}

// buildPublicEntityEntry · pure · construeix node canònic per a un entity
//   { kind, entity, project, ownerDid, ownerPublicJwk, overrides }
//   `kind` ∈ work_order | market_item | workshop
//   `entity` · node KB del entity (amb id + content + projectId)
//   `project` · referència al projecte propietari (sols per a ownerDid context)
export function buildPublicEntityEntry({
    kind,
    entity,
    project,
    ownerDid,
    ownerPublicJwk,
    overrides = {},
} = {}) {
    if (!kind)           throw new Error('buildPublicEntityEntry requires kind');
    if (!entity)         throw new Error('buildPublicEntityEntry requires entity');
    if (!ownerDid)       throw new Error('buildPublicEntityEntry requires ownerDid');
    if (!ownerPublicJwk) throw new Error('buildPublicEntityEntry requires ownerPublicJwk');
    const expectedType = PUBLIC_TYPE_BY_KIND[kind];
    if (!expectedType)   throw new Error('buildPublicEntityEntry · unknown kind: ' + kind);

    const projectId = project?.id || entity.projectId || entity.content?.projectId || null;
    const fields = extractPublicFieldsFromEntity({ kind, entity, projectId });
    if (!fields) throw new Error('buildPublicEntityEntry · invalid entity');

    const now = Date.now();
    const node = {
        id:        publicEntityIdFor(kind, entity.id),
        type:      expectedType,
        projectId,
        content: {
            kind:    expectedType,        // ex. 'public_work_order_entry'
            version: PUBLIC_ENTITY_VERSION,
            ...fields,
            ...overrides,
            ownerDid,
            publicJwk:        stripPrivateJwkFields(ownerPublicJwk),
            publishedAt:      now,
            signatureFormat:  'ECDSA-P256-SHA256-base64',
            signature:        null,
            arweaveTxId:      null,
        },
        keywords: [
            'type:' + expectedType,
            'kind:' + kind,
            'projectId:' + projectId,
            'ownerDid:' + ownerDid,
            ...(fields.sectorId  ? ['sector:' + fields.sectorId] : []),
            ...(fields.sectorTT  ? ['sector:' + fields.sectorTT] : []),
            ...(fields.cnae      ? ['cnae:' + fields.cnae] : []),
            ...(fields.status    ? ['status:' + fields.status] : []),
            ...(fields.accessTier? ['tier:' + fields.accessTier] : []),
            ...(Array.isArray(fields.lookingForSkills) ? fields.lookingForSkills.map(s => 'looking-skill:' + s) : []),
            ...(Array.isArray(fields.tags) ? fields.tags.map(s => 'tag:' + s) : []),
        ],
        createdAt: now,
        updatedAt: now,
    };
    const v = validatePublicEntityEntry(node, kind);
    if (!v.valid) throw new Error('buildPublicEntityEntry · invalid: ' + v.errors.join(' · '));
    return node;
}

// canonicalizeEntityEntry · pure · omet signature + arweaveTxId per a hash
export function canonicalizeEntityEntry(node) {
    if (!node || !node.content) throw new Error('canonicalizeEntityEntry requires node.content');
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

// arweaveTagsForEntityEntry · pure · per a Turbo upload tags
export function arweaveTagsForEntityEntry(entry, kind) {
    if (!entry || !entry.content) throw new Error('arweaveTagsForEntityEntry requires entry');
    const c = entry.content;
    return [
        { name: 'App-Name',     value: 'SOS-V11' },
        { name: 'App-Version',  value: PUBLIC_ENTITY_VERSION },
        { name: 'Entry-Type',   value: PUBLIC_TYPE_BY_KIND[kind] },
        { name: 'Entity-Kind',  value: kind },
        { name: 'ProjectId',    value: c.projectId || '' },
        { name: 'OwnerDid',     value: c.ownerDid },
        { name: 'Content-Type', value: 'application/json' },
    ];
}
