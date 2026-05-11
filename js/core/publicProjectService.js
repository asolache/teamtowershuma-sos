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
