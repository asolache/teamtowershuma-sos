// =============================================================================
// TEAMTOWERS SOS V11 — INTERFACE SERVICE (INTERFACE-NODES-001 sprint A)
// Ruta · /js/core/interfaceService.js
//
// Interfície entre processos · contracte de dades · "el que surt de
// procés A entra a B". Exemple article · "make pizza" → "deliver pizza"
// l'interface defineix payload (pizza ready + receipt + customer info).
//
// Pure · zero KB · zero DOM.
// =============================================================================

export const INTERFACE_TYPE = 'process_interface';
export const INTERFACE_VERSION = 'v1.0';

export const FIELD_KINDS = Object.freeze([
    'string', 'number', 'boolean', 'object', 'array',
    'uri', 'id', 'datetime', 'amount-eur',
]);

export const TRIGGER_KINDS = Object.freeze([
    'event',         // disparat per esdeveniment ('deal-closed')
    'cron',          // cron (delegate a WO-AUTO-001)
    'manual',        // l'usuari el dispara
    'continuous',    // sempre actiu (streaming)
]);

// ── Builders ───────────────────────────────────────────────────────────────

export function buildEmptyInterface({
    id = null,
    fromProcess,
    toProcess,
    label = null,
    triggerKind = 'event',
    triggerKey = null,           // event name / cron expr / null
    ts = null,
} = {}) {
    if (!fromProcess) throw new Error('buildEmptyInterface · fromProcess required');
    if (!toProcess) throw new Error('buildEmptyInterface · toProcess required');
    if (!TRIGGER_KINDS.includes(triggerKind)) {
        throw new Error('buildEmptyInterface · triggerKind invalid · ' + triggerKind);
    }
    const now = (typeof ts === 'number') ? ts : Date.now();
    const ifaceId = id || ('iface-' + fromProcess.slice(0, 8) + '-to-' + toProcess.slice(0, 8) + '-' + now.toString(36));
    return {
        id: ifaceId,
        type: INTERFACE_TYPE,
        fromProcess,
        toProcess,
        label: label || (fromProcess + ' → ' + toProcess),
        triggerKind,
        triggerKey,
        payloadSchema: { fields: [] },
        slaMaxDelayHours: null,
        version: INTERFACE_VERSION,
        keywords: ['type:process_interface', 'from:' + fromProcess, 'to:' + toProcess],
        createdAt: now,
        updatedAt: now,
    };
}

export function buildPayloadField({ name, kind, required = true, description = null }) {
    if (!name) throw new Error('payloadField · name required');
    if (!FIELD_KINDS.includes(kind)) throw new Error('payloadField · kind invalid · ' + kind);
    return { name, kind, required: !!required, description };
}

// ── Validators ─────────────────────────────────────────────────────────────

export function validateInterface(iface) {
    const errors = [];
    if (!iface || typeof iface !== 'object') {
        return { ok: false, errors: ['interface: must be object'] };
    }
    if (iface.type !== INTERFACE_TYPE) errors.push('type: must be ' + INTERFACE_TYPE);
    if (!iface.id) errors.push('id: required');
    if (!iface.fromProcess) errors.push('fromProcess: required');
    if (!iface.toProcess) errors.push('toProcess: required');
    if (!TRIGGER_KINDS.includes(iface.triggerKind)) errors.push('triggerKind: invalid · ' + iface.triggerKind);
    if (!iface.payloadSchema || !Array.isArray(iface.payloadSchema.fields)) {
        errors.push('payloadSchema.fields: must be array');
    } else {
        const names = new Set();
        for (let i = 0; i < iface.payloadSchema.fields.length; i++) {
            const f = iface.payloadSchema.fields[i];
            if (!f || !f.name) { errors.push('payloadSchema.fields[' + i + '].name: required'); continue; }
            if (names.has(f.name)) errors.push('payloadSchema · duplicate field: ' + f.name);
            names.add(f.name);
            if (!FIELD_KINDS.includes(f.kind)) errors.push('payloadSchema.fields[' + i + '].kind: invalid · ' + f.kind);
        }
    }
    if (iface.slaMaxDelayHours != null && (typeof iface.slaMaxDelayHours !== 'number' || iface.slaMaxDelayHours < 0)) {
        errors.push('slaMaxDelayHours: non-negative number or null');
    }
    return { ok: errors.length === 0, errors };
}

// ── Schema helpers ─────────────────────────────────────────────────────────

export function addPayloadField(iface, field, { ts = null } = {}) {
    if (!iface) throw new Error('addPayloadField · iface required');
    const f = buildPayloadField(field);
    const existing = (iface.payloadSchema?.fields || []).find(x => x.name === f.name);
    if (existing) throw new Error('addPayloadField · duplicate · ' + f.name);
    return {
        ...iface,
        payloadSchema: {
            ...iface.payloadSchema,
            fields: [...(iface.payloadSchema?.fields || []), f],
        },
        updatedAt: ts || Date.now(),
    };
}

export function removePayloadField(iface, fieldName, { ts = null } = {}) {
    if (!iface) throw new Error('removePayloadField · iface required');
    return {
        ...iface,
        payloadSchema: {
            ...iface.payloadSchema,
            fields: (iface.payloadSchema?.fields || []).filter(f => f.name !== fieldName),
        },
        updatedAt: ts || Date.now(),
    };
}

export function setSla(iface, hours, { ts = null } = {}) {
    if (!iface) throw new Error('setSla · iface required');
    if (hours != null && (typeof hours !== 'number' || hours < 0)) {
        throw new Error('setSla · hours non-negative or null');
    }
    return { ...iface, slaMaxDelayHours: hours, updatedAt: ts || Date.now() };
}

// ── Payload validation (runtime check) ────────────────────────────────────

// validatePayload · runtime · verifica que un payload acompleix l'schema
// Retorna { ok, errors[] } · NO muta payload.
export function validatePayload(iface, payload) {
    const errors = [];
    if (!iface) return { ok: false, errors: ['iface required'] };
    if (!payload || typeof payload !== 'object') {
        return { ok: false, errors: ['payload: must be object'] };
    }
    const fields = iface.payloadSchema?.fields || [];
    for (const f of fields) {
        const v = payload[f.name];
        if (f.required && (v === undefined || v === null)) {
            errors.push('payload.' + f.name + ': required');
            continue;
        }
        if (v === undefined || v === null) continue;  // optional · skip type check
        switch (f.kind) {
            case 'string': case 'uri': case 'id': case 'datetime':
                if (typeof v !== 'string') errors.push('payload.' + f.name + ': must be string'); break;
            case 'number': case 'amount-eur':
                if (typeof v !== 'number') errors.push('payload.' + f.name + ': must be number'); break;
            case 'boolean':
                if (typeof v !== 'boolean') errors.push('payload.' + f.name + ': must be boolean'); break;
            case 'object':
                if (typeof v !== 'object' || Array.isArray(v)) errors.push('payload.' + f.name + ': must be object'); break;
            case 'array':
                if (!Array.isArray(v)) errors.push('payload.' + f.name + ': must be array'); break;
        }
    }
    return { ok: errors.length === 0, errors };
}

// ── Stats ──────────────────────────────────────────────────────────────────

export function computeInterfaceStats(iface) {
    if (!iface) return null;
    const fields = iface.payloadSchema?.fields || [];
    return {
        fieldCount: fields.length,
        requiredCount: fields.filter(f => f.required).length,
        triggerKind: iface.triggerKind,
        hasSla: iface.slaMaxDelayHours != null,
    };
}
