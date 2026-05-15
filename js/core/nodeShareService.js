// =============================================================================
// TEAMTOWERS SOS V11 — NODE SHARE SERVICE (SHARE-JSON-001)
// Ruta · /js/core/nodeShareService.js
//
// Export / import de nodes del KB com a paquets JSON portables · cross-SOS ·
// DM-importable (auto-import quan rebem un missatge amb payload).
//
// Format del paquet (versionat) ·
//   { sosShare: 1,                 // version del format
//     kind:     'project'|'work_order'|'bundle'|'node',
//     created:  <epoch ms>,
//     by:       <handle|null>,     // qui exporta (opcional)
//     nodes:    [ { id, type, projectId?, content, ... } ],
//     edges?:   [ { from, to, kind } ],   // futur · relacions
//     meta?:    { title, note }     // descripció humana
//   }
//
// Pure module · zero deps · safe en Node. Persistència delegada al consumer
// (que decideix si crida store.dispatch / KB.saveNode).
// =============================================================================

export const SHARE_FORMAT_VERSION = 1;
export const SHARE_KINDS = Object.freeze(['project', 'work_order', 'bundle', 'node']);

// _isPlainObject · pure
function _isPlainObject(v) {
    return v && typeof v === 'object' && !Array.isArray(v);
}

// _sanitizeNode · pure · neteja transients abans d'exportar (cache · signatures
// locals de device · qualsevol cosa que no aporta valor en una altra inst.)
const _STRIPPED_FIELDS = Object.freeze(['_cache', '_localOnly', '_pendingSync']);
function _sanitizeNode(node) {
    if (!_isPlainObject(node)) return node;
    const out = { ...node };
    for (const f of _STRIPPED_FIELDS) delete out[f];
    return out;
}

// buildSharePackage · pure · construeix el paquet a partir d'un array de nodes
export function buildSharePackage({
    nodes = [],
    kind  = 'node',
    by    = null,
    title = '',
    note  = '',
    edges = null,
    now   = null,
} = {}) {
    if (!Array.isArray(nodes)) throw new Error('buildSharePackage · nodes must be array');
    if (!SHARE_KINDS.includes(kind)) throw new Error('buildSharePackage · invalid kind: ' + kind);
    const pkg = {
        sosShare: SHARE_FORMAT_VERSION,
        kind,
        created: typeof now === 'number' ? now : Date.now(),
        by:      by || null,
        nodes:   nodes.map(_sanitizeNode),
    };
    if (Array.isArray(edges) && edges.length) pkg.edges = edges;
    if (title || note) pkg.meta = { title: title || '', note: note || '' };
    return pkg;
}

// validateSharePackage · pure · { valid, errors[] }
export function validateSharePackage(pkg) {
    const errors = [];
    if (!_isPlainObject(pkg)) errors.push('not an object');
    else {
        if (pkg.sosShare !== SHARE_FORMAT_VERSION) errors.push('sosShare version mismatch · expected ' + SHARE_FORMAT_VERSION);
        if (!SHARE_KINDS.includes(pkg.kind)) errors.push('invalid kind');
        if (!Array.isArray(pkg.nodes)) errors.push('nodes must be array');
        else if (pkg.nodes.length === 0) errors.push('nodes empty');
        else {
            pkg.nodes.forEach((n, i) => {
                if (!_isPlainObject(n)) errors.push('nodes[' + i + '] not an object');
                else if (!n.id || !n.type) errors.push('nodes[' + i + '] missing id/type');
            });
        }
    }
    return { valid: errors.length === 0, errors };
}

// toJsonString · pure · prettyprint per a DMs · estable (sort keys top-level)
export function toJsonString(pkg, { pretty = true } = {}) {
    return pretty ? JSON.stringify(pkg, null, 2) : JSON.stringify(pkg);
}

// parseJsonString · pure · throws on invalid JSON; retorna paquet validat o null
export function parseJsonString(text) {
    const obj = JSON.parse(text);
    const v = validateSharePackage(obj);
    if (!v.valid) {
        const err = new Error('Invalid SOS share package: ' + v.errors.join(' · '));
        err.errors = v.errors;
        throw err;
    }
    return obj;
}

// detectSharePackage · pure · escaneja un missatge de DM buscant un JSON share
// embeddat (codeblock o text pla). Retorna el paquet validat o null.
export function detectSharePackage(text) {
    if (typeof text !== 'string' || !text.includes('sosShare')) return null;
    // Provem codeblock ```...```
    const cb = text.match(/```(?:json)?\s*([\s\S]+?)```/);
    const candidates = cb ? [cb[1]] : [];
    // Tota la cadena com a fallback
    candidates.push(text);
    for (const raw of candidates) {
        try {
            const pkg = JSON.parse(raw.trim());
            const v = validateSharePackage(pkg);
            if (v.valid) return pkg;
        } catch (_) { /* try next */ }
    }
    return null;
}

// mergeIntoKb · pure helper · prepara el llistat de nodes a desar (deixant que
// el consumer decideixi via store / KB). Per defecte respeta IDs (collision =
// overwrite). Mode 'rebase' assigna nous IDs i remapeja projectId si cal.
export function prepareImport(pkg, {
    mode      = 'preserve',           // 'preserve' | 'rebase'
    newId     = null,                  // (oldId) => newId · si mode==='rebase'
} = {}) {
    const v = validateSharePackage(pkg);
    if (!v.valid) throw new Error('prepareImport · invalid pkg: ' + v.errors.join(' · '));
    if (mode === 'preserve') {
        return { nodes: pkg.nodes.map(n => ({ ...n })), idMap: null };
    }
    if (mode === 'rebase') {
        const gen = typeof newId === 'function'
            ? newId
            : (oldId) => oldId + '_imp_' + Math.random().toString(36).slice(2, 8);
        const idMap = Object.create(null);
        for (const n of pkg.nodes) idMap[n.id] = gen(n.id);
        const remapped = pkg.nodes.map(n => {
            const next = { ...n, id: idMap[n.id] };
            if (next.projectId && idMap[next.projectId]) next.projectId = idMap[next.projectId];
            return next;
        });
        return { nodes: remapped, idMap };
    }
    throw new Error('prepareImport · unknown mode: ' + mode);
}
