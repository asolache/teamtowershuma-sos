// =============================================================================
// TEAMTOWERS SOS V11 — SOC DUAL-PURPOSE SERVICE (SOC-DUAL-PURPOSE-001 sprint A)
// Ruta · /js/core/socDualPurposeService.js
//
// Resol el conflicte semàntic · SOC era "Concept" · article diu "Checklist".
// **Solució** · SOC = Concept + Checklist alhora ·
//   1. Concept side · purpose · outcomes · why (existeix · markdown body)
//   2. Checklist side · array d'items verificables · cada item té sop_ref
//
// Versionat al nivell SOC · canvis als SOPs no toquen SOC fins que canvia
// el propòsit o un item de la checklist. SOC_v3 = snapshot dels SOPs
// d'aquell moment.
//
// IA cost optimitzat · genera SOC outline primer (cheap) · expandeix SOPs
// sota demanda per item · estalvi 40-60% vs gen monolític.
//
// Pure · zero KB · zero DOM. KB ho gestiona el caller.
// =============================================================================

export const SOC_TYPE = 'soc';
export const SOC_VERSION_SCHEMA = 'v2.0';   // v2 = dual purpose (v1 era concept-only)

export const SOC_STATUS = Object.freeze(['draft', 'review', 'approved', 'deprecated']);

export const CHECKLIST_ITEM_VERIFICATION = Object.freeze([
    'manual',          // humà valida visualment
    'auto-test',       // command + expected output
    'evidence-upload', // arxiu/foto pujat
    'attestation',     // firma ECDSA d'un altre rol
    'kb-query',        // KB query retorna ≥1 result
]);

// ── Builders ───────────────────────────────────────────────────────────────

// buildEmptyChecklistItem · pure
export function buildEmptyChecklistItem({ id, label, sop_ref = null, required = true, verification_kind = 'manual' } = {}) {
    if (!id) throw new Error('checklistItem · id required');
    if (!label) throw new Error('checklistItem · label required');
    if (!CHECKLIST_ITEM_VERIFICATION.includes(verification_kind)) {
        throw new Error('checklistItem · verification_kind invalid · ' + verification_kind);
    }
    return {
        id,
        label,
        sop_ref,
        required: !!required,
        verification_kind,
        verification_config: null,
    };
}

// buildEmptySoc · pure · genera SOC dual-purpose buit vàlid.
export function buildEmptySoc({
    id = null,
    slug,
    purpose,
    version = 'v1',
    author = null,
    ts = null,
} = {}) {
    if (!slug || typeof slug !== 'string') throw new Error('buildEmptySoc · slug required');
    if (!purpose || typeof purpose !== 'string') throw new Error('buildEmptySoc · purpose required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    const socId = id || ('soc-' + slug);
    return {
        id: socId,
        type: SOC_TYPE,
        version,
        parentVersion: null,
        slug,
        purpose,
        conceptBody: '',           // markdown · existing 'concept' side
        outcomes: [],
        checklist: [],             // NOU · checklist items · dual purpose side
        relatedSocs: [],
        versionedSops: [],         // snapshot SOPs en aquesta SOC version
        keywords: [],
        author,
        status: 'draft',
        schemaVersion: SOC_VERSION_SCHEMA,
        createdAt: now,
        updatedAt: now,
    };
}

// ── Validators ─────────────────────────────────────────────────────────────

export function validateSoc(soc) {
    const errors = [];
    if (!soc || typeof soc !== 'object') {
        return { ok: false, errors: ['soc: must be object'] };
    }
    if (soc.type !== SOC_TYPE) errors.push('type: must be ' + SOC_TYPE);
    if (!soc.id) errors.push('id: required');
    if (!soc.slug) errors.push('slug: required');
    if (!soc.purpose) errors.push('purpose: required');
    if (soc.status && !SOC_STATUS.includes(soc.status)) errors.push('status: invalid · ' + soc.status);
    if (!Array.isArray(soc.checklist)) errors.push('checklist: must be array');
    if (Array.isArray(soc.checklist)) {
        const ids = new Set();
        for (let i = 0; i < soc.checklist.length; i++) {
            const it = soc.checklist[i];
            if (!it || !it.id) { errors.push('checklist[' + i + '].id: required'); continue; }
            if (ids.has(it.id)) errors.push('checklist · duplicate id: ' + it.id);
            ids.add(it.id);
            if (!it.label) errors.push('checklist[' + i + '].label: required');
            if (it.verification_kind && !CHECKLIST_ITEM_VERIFICATION.includes(it.verification_kind)) {
                errors.push('checklist[' + i + '].verification_kind: invalid · ' + it.verification_kind);
            }
        }
    }
    if (!Array.isArray(soc.outcomes)) errors.push('outcomes: must be array');
    if (!Array.isArray(soc.versionedSops)) errors.push('versionedSops: must be array');
    return { ok: errors.length === 0, errors };
}

// ── Checklist helpers ──────────────────────────────────────────────────────

// addChecklistItem · pure · append item al final · genera id si no donat
export function addChecklistItem(soc, { id = null, label, sop_ref = null, required = true, verification_kind = 'manual', ts = null } = {}) {
    if (!soc) throw new Error('addChecklistItem · soc required');
    if (!label) throw new Error('addChecklistItem · label required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    const items = soc.checklist || [];
    const itemId = id || ('ci-' + String(items.length + 1).padStart(2, '0'));
    if (items.find(it => it.id === itemId)) throw new Error('addChecklistItem · duplicate id · ' + itemId);
    const item = buildEmptyChecklistItem({ id: itemId, label, sop_ref, required, verification_kind });
    return {
        ...soc,
        checklist: [...items, item],
        updatedAt: now,
    };
}

// updateChecklistItem · pure · patch d'un item · valida verification_kind
export function updateChecklistItem(soc, itemId, patch = {}, { ts = null } = {}) {
    if (!soc) throw new Error('updateChecklistItem · soc required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    const items = soc.checklist || [];
    const idx = items.findIndex(it => it.id === itemId);
    if (idx === -1) throw new Error('updateChecklistItem · itemId not found · ' + itemId);
    if (patch.verification_kind && !CHECKLIST_ITEM_VERIFICATION.includes(patch.verification_kind)) {
        throw new Error('updateChecklistItem · verification_kind invalid');
    }
    const updated = { ...items[idx], ...patch };
    const newChecklist = items.slice();
    newChecklist[idx] = updated;
    return { ...soc, checklist: newChecklist, updatedAt: now };
}

// removeChecklistItem · pure
export function removeChecklistItem(soc, itemId, { ts = null } = {}) {
    if (!soc) throw new Error('removeChecklistItem · soc required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...soc,
        checklist: (soc.checklist || []).filter(it => it.id !== itemId),
        updatedAt: now,
    };
}

// linkSopToItem · pure · associa un SOP existent a un item de la checklist
export function linkSopToItem(soc, itemId, sopRef, { ts = null } = {}) {
    return updateChecklistItem(soc, itemId, { sop_ref: sopRef }, { ts });
}

// ── Versioning · snapshot ──────────────────────────────────────────────────

// bumpSocVersion · pure · crea un SOC nou (id_v{N+1}) com a parent del previ.
// Snapshot dels SOPs actuals · permet reset · canvis posteriors no afecten.
export function bumpSocVersion(soc, { newPurpose = null, versionedSops = null, ts = null } = {}) {
    if (!soc) throw new Error('bumpSocVersion · soc required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    const currentVerNum = parseInt(String(soc.version || 'v1').replace(/^v/, ''), 10) || 1;
    const newVer = 'v' + (currentVerNum + 1);
    const newId = soc.id.replace(/-v\d+$/, '') + '-' + newVer;
    return {
        ...soc,
        id: newId,
        version: newVer,
        parentVersion: soc.version || 'v1',
        purpose: newPurpose || soc.purpose,
        versionedSops: Array.isArray(versionedSops) ? versionedSops.slice() : (soc.versionedSops || []).slice(),
        status: 'draft',
        createdAt: now,
        updatedAt: now,
    };
}

// ── Migration · v1 (concept-only) → v2 (dual-purpose) ─────────────────────

// migrateLegacySoc · pure · agafa SOC v1 (sense checklist) · retorna v2 amb
// checklist:[] · marca schemaVersion = SOC_VERSION_SCHEMA. Idempotent.
export function migrateLegacySoc(legacySoc, { ts = null } = {}) {
    if (!legacySoc) throw new Error('migrateLegacySoc · legacySoc required');
    if (legacySoc.schemaVersion === SOC_VERSION_SCHEMA) return legacySoc;
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...legacySoc,
        checklist: legacySoc.checklist || [],
        versionedSops: legacySoc.versionedSops || (Array.isArray(legacySoc.related_sops) ? legacySoc.related_sops.slice() : []),
        relatedSocs: legacySoc.relatedSocs || legacySoc.related_socs || [],
        outcomes: legacySoc.outcomes || [],
        schemaVersion: SOC_VERSION_SCHEMA,
        updatedAt: now,
    };
}

// ── IA-cost optimization prompt builders ───────────────────────────────────

// buildSocOutlinePrompt · pure · genera prompt curt per a IA · output JSON
// d'una checklist de 5-12 items · barat (~500 tokens output).
export function buildSocOutlinePrompt({ socPurpose, processContext = null, sectorContext = null } = {}) {
    return [
        'Ets dissenyador de processos cooperatius SOS.',
        '',
        'PROPÒSIT DEL SOC ·',
        socPurpose,
        '',
        sectorContext ? 'SECTOR · ' + sectorContext : '',
        processContext ? 'PROCÉS · ' + processContext : '',
        '',
        'GENERA un checklist de 5-12 items operatius que verifiquen el',
        'compliment d\'aquest propòsit. Respon NOMÉS JSON estricte ·',
        '',
        '{',
        '  "checklist": [',
        '    { "label": "...", "required": true|false, "verification_kind": "manual|auto-test|evidence-upload|attestation|kb-query" }',
        '  ]',
        '}',
        '',
        'Sense markdown · sense codeblock · sense text addicional · sols JSON.',
    ].filter(Boolean).join('\n');
}

// buildSopExpandPrompt · pure · prompt per a expandir 1 item de la checklist
// en un SOP detallat. Cost incremental ~500-800 tokens.
export function buildSopExpandPrompt({ socPurpose, checklistItemLabel, sectorContext = null } = {}) {
    return [
        'Ets dissenyador de procediments operatius SOS.',
        '',
        'SOC PROPÒSIT · ' + socPurpose,
        'ITEM DEL CHECKLIST · ' + checklistItemLabel,
        sectorContext ? 'SECTOR · ' + sectorContext : '',
        '',
        'GENERA un SOP detallat (Standard Operating Procedure) per a aquest item.',
        'Respon NOMÉS JSON estricte ·',
        '',
        '{',
        '  "title": "...",',
        '  "steps": ["1. ...", "2. ...", "3. ..."],',
        '  "duration_minutes": 30,',
        '  "prerequisites": ["..."],',
        '  "deliverables": ["..."]',
        '}',
        '',
        'Sense markdown · sense codeblock · sols JSON.',
    ].filter(Boolean).join('\n');
}

// ── Stats helpers ──────────────────────────────────────────────────────────

export function computeSocStats(soc) {
    if (!soc) return null;
    const checklist = soc.checklist || [];
    const requiredCount = checklist.filter(it => it.required).length;
    const linkedCount = checklist.filter(it => !!it.sop_ref).length;
    return {
        itemCount: checklist.length,
        requiredCount,
        optionalCount: checklist.length - requiredCount,
        linkedCount,
        unlinkedCount: checklist.length - linkedCount,
        versionsTracked: 1 + (soc.parentVersion ? 1 : 0),
        verificationBreakdown: _groupByVerification(checklist),
    };
}

function _groupByVerification(items) {
    const dist = {};
    for (const it of items) {
        const k = it.verification_kind || 'manual';
        dist[k] = (dist[k] || 0) + 1;
    }
    return dist;
}
