// =============================================================================
// TEAMTOWERS SOS V11 — ORGANIZATION SERVICE (ORG-ENTITY-001 sprint A)
// Ruta · /js/core/organizationService.js
//
// Organització · entitat META sobre la qual pengen ·
//   - Stakeholders (totes les persones/coops amb interès)
//   - Tokenomics global (distribució de valor a nivell org)
//   - Systems · 1+ sistemes operatius
//   - Projects · iniciatives temporals dins l'org
//   - Shared resources · tools · spaces · capacitat
//
// Pure · zero KB · zero DOM · helpers funcionals. KB lo gestiona el caller.
//
// Sense ORG · "project" era el top · ara és un fill de l'org. Permet ·
//   - 1 persona freelance · 1 org "personal" amb 1 stakeholder (ella)
//   - Cooperativa · 1 org amb 5-100 stakeholders
//   - Xarxa coop · 1 org amb N coops dins (MULTI-TENANT-ORG-001 v3)
// =============================================================================

export const ORGANIZATION_TYPE = 'organization';
export const ORGANIZATION_VERSION = 'v1.0';

export const LEGAL_KINDS = Object.freeze([
    'individual',     // freelance · autònom · 1 persona
    'informal',       // grup informal · sense personalitat jurídica
    'cooperative',    // SCCL · SCM · etc
    'association',    // associació · ONG
    'foundation',     // fundació
    'company',        // SL · SA · etc
    'public',         // entitat pública
    'network',        // xarxa d'orgs (futur · v3)
]);

export const STAKEHOLDER_ROLES = Object.freeze([
    'soci-treballador',   // soci de treball cooperativa
    'soci-consumidor',    // soci consum cooperativa
    'soci-collaborador',  // col·laborador extern
    'soci-inversor',      // capital sense vot
    'soci-fundador',      // founder
    'voluntari',          // sense compensació
    'empleat',            // contracte laboral
    'proveidor',          // proveïdor recurrent estratègic
    'client',             // client estratègic
    'comunitat',          // membre comunitat (consells · usuaris)
    'altre',              // override personalitzat
]);

// ── Builders ───────────────────────────────────────────────────────────────

// buildEmptyOrganization · pure · genera org node minimalista vàlid.
// args ·
//   id (opcional · auto-generat si null)
//   name · required
//   legalKind · default 'informal'
//   founderHandle · DID del fundador · stakeholder fundador per defecte
//   ts · injectable per a tests
export function buildEmptyOrganization({
    id = null,
    name,
    legalKind = 'informal',
    founderHandle = null,
    ts = null,
} = {}) {
    if (!name || typeof name !== 'string') throw new Error('buildEmptyOrganization · name required');
    if (!LEGAL_KINDS.includes(legalKind)) throw new Error('buildEmptyOrganization · legalKind invalid · ' + legalKind);
    const now = (typeof ts === 'number') ? ts : Date.now();
    const orgId = id || ('org-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) + '-' + now.toString(36));
    const stakeholders = founderHandle ? [{
        handle: founderHandle,
        role: 'soci-fundador',
        sharePct: 100,
        joinedAt: now,
    }] : [];
    return {
        id: orgId,
        type: ORGANIZATION_TYPE,
        name: name.trim(),
        legalKind,
        founderHandle: founderHandle || null,
        stakeholders,
        tokenomicsGlobal: null,         // pendent (lligat a token_design opcional)
        systems: [],                    // ids de sistemes
        projectIds: [],                 // ids de projectes pertanyents
        sharedResourceIds: [],          // ids de resources compartits
        bootstrapVersion: ORGANIZATION_VERSION,
        keywords: ['type:organization', 'legalKind:' + legalKind],
        createdAt: now,
        updatedAt: now,
    };
}

// ── Validators ─────────────────────────────────────────────────────────────

export function validateOrganization(org) {
    const errors = [];
    if (!org || typeof org !== 'object') {
        return { ok: false, errors: ['org: must be object'] };
    }
    if (org.type !== ORGANIZATION_TYPE) errors.push('type: must be ' + ORGANIZATION_TYPE);
    if (!org.id || typeof org.id !== 'string') errors.push('id: required string');
    if (!org.name || typeof org.name !== 'string') errors.push('name: required string');
    if (!LEGAL_KINDS.includes(org.legalKind)) errors.push('legalKind: invalid · ' + org.legalKind);
    if (!Array.isArray(org.stakeholders)) errors.push('stakeholders: must be array');
    if (Array.isArray(org.stakeholders)) {
        for (let i = 0; i < org.stakeholders.length; i++) {
            const sh = org.stakeholders[i];
            if (!sh || typeof sh !== 'object') { errors.push('stakeholders[' + i + ']: object'); continue; }
            if (!sh.handle) errors.push('stakeholders[' + i + '].handle: required');
            if (sh.role && !STAKEHOLDER_ROLES.includes(sh.role)) errors.push('stakeholders[' + i + '].role: invalid · ' + sh.role);
            if (sh.sharePct != null && (typeof sh.sharePct !== 'number' || sh.sharePct < 0 || sh.sharePct > 100)) {
                errors.push('stakeholders[' + i + '].sharePct: 0-100');
            }
        }
        // sum of sharePct (excluding null) should be <= 100 + epsilon
        const total = org.stakeholders
            .filter(s => typeof s.sharePct === 'number')
            .reduce((acc, s) => acc + s.sharePct, 0);
        if (total > 100.01) errors.push('stakeholders · sharePct sum > 100 · ' + total);
    }
    if (!Array.isArray(org.projectIds)) errors.push('projectIds: must be array');
    if (!Array.isArray(org.systems)) errors.push('systems: must be array');
    if (!Array.isArray(org.sharedResourceIds)) errors.push('sharedResourceIds: must be array');
    return { ok: errors.length === 0, errors };
}

// ── Stakeholder helpers ────────────────────────────────────────────────────

// addStakeholder · pure · afegeix stakeholder · valida no-duplicate handle
export function addStakeholder(org, { handle, role = 'comunitat', sharePct = null, ts = null } = {}) {
    if (!org) throw new Error('addStakeholder · org required');
    if (!handle) throw new Error('addStakeholder · handle required');
    if (role && !STAKEHOLDER_ROLES.includes(role)) throw new Error('addStakeholder · role invalid · ' + role);
    if (sharePct != null && (sharePct < 0 || sharePct > 100)) throw new Error('addStakeholder · sharePct 0-100');
    const now = (typeof ts === 'number') ? ts : Date.now();
    const existing = (org.stakeholders || []).find(s => s.handle === handle);
    if (existing) throw new Error('addStakeholder · handle already present · ' + handle);
    return {
        ...org,
        stakeholders: [
            ...(org.stakeholders || []),
            { handle, role, sharePct, joinedAt: now },
        ],
        updatedAt: now,
    };
}

// removeStakeholder · pure · elimina stakeholder per handle
export function removeStakeholder(org, handle, { ts = null } = {}) {
    if (!org) throw new Error('removeStakeholder · org required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...org,
        stakeholders: (org.stakeholders || []).filter(s => s.handle !== handle),
        updatedAt: now,
    };
}

// updateStakeholderShares · pure · accepta { handle → newSharePct } · valida sum
export function updateStakeholderShares(org, shareMap, { ts = null } = {}) {
    if (!org) throw new Error('updateStakeholderShares · org required');
    if (!shareMap || typeof shareMap !== 'object') throw new Error('updateStakeholderShares · shareMap object');
    const now = (typeof ts === 'number') ? ts : Date.now();
    const updated = (org.stakeholders || []).map(s => {
        if (s.handle in shareMap) {
            const newPct = shareMap[s.handle];
            if (newPct != null && (newPct < 0 || newPct > 100)) {
                throw new Error('updateStakeholderShares · invalid pct for ' + s.handle + ' · ' + newPct);
            }
            return { ...s, sharePct: newPct };
        }
        return s;
    });
    const total = updated
        .filter(s => typeof s.sharePct === 'number')
        .reduce((acc, s) => acc + s.sharePct, 0);
    if (total > 100.01) throw new Error('updateStakeholderShares · sum > 100 · ' + total);
    return { ...org, stakeholders: updated, updatedAt: now };
}

// ── Project / Resource / System link helpers ──────────────────────────────

export function linkProject(org, projectId, { ts = null } = {}) {
    if (!org) throw new Error('linkProject · org required');
    if (!projectId) throw new Error('linkProject · projectId required');
    if ((org.projectIds || []).includes(projectId)) return org;
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...org,
        projectIds: [...(org.projectIds || []), projectId],
        updatedAt: now,
    };
}

export function unlinkProject(org, projectId, { ts = null } = {}) {
    if (!org) throw new Error('unlinkProject · org required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...org,
        projectIds: (org.projectIds || []).filter(id => id !== projectId),
        updatedAt: now,
    };
}

export function linkResource(org, resourceId, { ts = null } = {}) {
    if (!org) throw new Error('linkResource · org required');
    if ((org.sharedResourceIds || []).includes(resourceId)) return org;
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...org,
        sharedResourceIds: [...(org.sharedResourceIds || []), resourceId],
        updatedAt: now,
    };
}

export function linkSystem(org, systemId, { ts = null } = {}) {
    if (!org) throw new Error('linkSystem · org required');
    if ((org.systems || []).includes(systemId)) return org;
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...org,
        systems: [...(org.systems || []), systemId],
        updatedAt: now,
    };
}

// ── Tokenomics global · estub · vinculació a TokenDesign ──────────────────

export function setTokenomicsGlobal(org, tokenDesignId, { ts = null } = {}) {
    if (!org) throw new Error('setTokenomicsGlobal · org required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...org,
        tokenomicsGlobal: tokenDesignId || null,
        updatedAt: now,
    };
}

// ── Auto-org for legacy projects · idempotent ─────────────────────────────

// buildPersonalOrgFor · pure · per a un user existent sense org · crea
// org "personal" amb el founder com a stakeholder · sharePct 100.
export function buildPersonalOrgFor({ handle, name = null, ts = null } = {}) {
    if (!handle) throw new Error('buildPersonalOrgFor · handle required');
    const cleanHandle = handle.replace(/^@/, '');
    const orgName = name || ('Org personal · ' + cleanHandle);
    return buildEmptyOrganization({
        name: orgName,
        legalKind: 'individual',
        founderHandle: handle,
        ts,
    });
}

// migrateProjectIntoOrg · pure · retorna { org, project } amb el projecte
// referenciant org · org tenint el project a projectIds. No muta inputs.
export function migrateProjectIntoOrg(org, project, { ts = null } = {}) {
    if (!org || !project) throw new Error('migrateProjectIntoOrg · org + project required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    const newOrg = linkProject(org, project.id, { ts: now });
    const newProject = {
        ...project,
        orgId: org.id,            // NOU camp · FK a l'org
        updatedAt: now,
    };
    return { org: newOrg, project: newProject };
}

// ── Stats / queries ────────────────────────────────────────────────────────

export function computeOrgStats(org) {
    if (!org) return null;
    const stakeholders = org.stakeholders || [];
    const totalShare = stakeholders
        .filter(s => typeof s.sharePct === 'number')
        .reduce((acc, s) => acc + s.sharePct, 0);
    return {
        stakeholderCount: stakeholders.length,
        projectCount:     (org.projectIds || []).length,
        systemCount:      (org.systems || []).length,
        resourceCount:    (org.sharedResourceIds || []).length,
        sharePctAllocated: Number(totalShare.toFixed(2)),
        sharePctFree:      Number((100 - totalShare).toFixed(2)),
        roleDistribution:  _groupByRole(stakeholders),
    };
}

function _groupByRole(stakeholders) {
    const dist = {};
    for (const s of stakeholders) {
        const r = s.role || 'altre';
        dist[r] = (dist[r] || 0) + 1;
    }
    return dist;
}
