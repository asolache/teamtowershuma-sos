// =============================================================================
// TEAMTOWERS SOS V11 — IKIGAI SERVICE (IKIGAI sprint A)
// Ruta · /js/core/ikigaiService.js
//
// Ikigai (生き甲斐) · concept japonès per a "raó de ser" · intersecció de
// 4 dimensions:
//   1. el que estimes        (loves      · passion)
//   2. en què ets bo         (goodAt     · vocation)
//   3. què necessita el món  (worldNeeds · mission)
//   4. com pots ser pagat    (paidFor    · profession)
//
// Cada dimensió és una llista d'items textuals (skills · activitats · temes).
// Les interseccions donen els 4 cercles secundaris (passion · profession ·
// vocation · mission) i el centre · l'Ikigai en si.
//
// Pure · zero KB · zero DOM. Persisteix com a content.ikigai al matriu_member.
// =============================================================================

export const IKIGAI_DIMENSIONS = Object.freeze([
    Object.freeze({
        id:     'loves',
        label:  'El que estimes',
        icon:   '❤️',
        color:  '#ec4899',
        prompt: 'Què fas que perds la noció del temps? Activitats · temes · pràctiques.',
        minItems: 1,
        maxItems: 15,
    }),
    Object.freeze({
        id:     'goodAt',
        label:  'En què ets bo',
        icon:   '🏆',
        color:  '#22c55e',
        prompt: 'Habilitats reals · validades per altres · feines fetes amb mestria.',
        minItems: 1,
        maxItems: 15,
    }),
    Object.freeze({
        id:     'worldNeeds',
        label:  'Què necessita el món',
        icon:   '🌍',
        color:  '#3b82f6',
        prompt: 'Problemes reals · gent vulnerable · sistemes que cal redissenyar.',
        minItems: 1,
        maxItems: 15,
    }),
    Object.freeze({
        id:     'paidFor',
        label:  'Pel que et poden pagar',
        icon:   '💰',
        color:  '#facc15',
        prompt: 'Per què pagaria un client real ara mateix? Serveis · productes · expertesa.',
        minItems: 1,
        maxItems: 15,
    }),
]);

const DIM_BY_ID = new Map(IKIGAI_DIMENSIONS.map(d => [d.id, d]));

// IKIGAI_INTERSECTIONS · les 5 zones derivades · 4 binaries + el centre
export const IKIGAI_INTERSECTIONS = Object.freeze([
    Object.freeze({ id: 'passion',    label: 'Passió',     icon: '🔥', color: '#fb7185', dims: ['loves', 'goodAt'],            tagline: 'satisfactori però potser no útil ni rendible' }),
    Object.freeze({ id: 'profession', label: 'Professió',  icon: '⚙',  color: '#a5b4fc', dims: ['goodAt', 'paidFor'],          tagline: 'còmode però potser sense propòsit' }),
    Object.freeze({ id: 'vocation',   label: 'Vocació',    icon: '🌅', color: '#86efac', dims: ['paidFor', 'worldNeeds'],      tagline: 'útil i rendible · però potser sense satisfacció' }),
    Object.freeze({ id: 'mission',    label: 'Missió',     icon: '🎯', color: '#fbbf24', dims: ['worldNeeds', 'loves'],        tagline: 'amb sentit · però potser no remunerada' }),
    Object.freeze({ id: 'ikigai',     label: 'Ikigai',     icon: '🌸', color: '#ec4899', dims: ['loves', 'goodAt', 'worldNeeds', 'paidFor'], tagline: 'el centre · raó de ser · vida plena' }),
]);

// dimMeta · pure · getter
export function dimMeta(dimId) {
    return DIM_BY_ID.get(dimId) || null;
}

// buildEmptyIkigai · pure · estat inicial · 4 dimensions buides
export function buildEmptyIkigai({ ts = null } = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    const dimensions = {};
    for (const d of IKIGAI_DIMENSIONS) dimensions[d.id] = { items: [], updatedAt: null };
    return {
        dimensions,
        createdAt:    now,
        updatedAt:    now,
        completedAt:  null,
    };
}

// normalizeItem · pure · trim + collapsa espais + lowercase opcional (dedupe)
function normalizeItem(item) {
    return String(item || '').trim().replace(/\s+/g, ' ');
}

// applyIkigaiDimension · pure · immutable · substitueix la llista d'items
// d'una dimensió. Valida limit min/max i dedupe (case-insensitive).
export function applyIkigaiDimension(ikigai, dimId, items, { ts = null } = {}) {
    const dim = DIM_BY_ID.get(dimId);
    if (!dim) throw new Error('unknown dimension · ' + dimId);
    if (!Array.isArray(items)) throw new Error('items must be array');
    const normalized = [];
    const seen = new Set();
    for (const raw of items) {
        const v = normalizeItem(raw);
        if (!v) continue;
        const key = v.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        normalized.push(v);
    }
    if (normalized.length > dim.maxItems) {
        throw new Error('too-many-items · max ' + dim.maxItems);
    }
    const now = (typeof ts === 'number') ? ts : Date.now();
    const next = {
        ...ikigai,
        dimensions: {
            ...ikigai.dimensions,
            [dimId]: { items: normalized, updatedAt: now },
        },
        updatedAt: now,
    };
    // Detecta complet · totes 4 dimensions amb ≥minItems
    const allFilled = IKIGAI_DIMENSIONS.every(d => (next.dimensions[d.id]?.items || []).length >= d.minItems);
    next.completedAt = allFilled ? now : null;
    return next;
}

// addIkigaiItem · pure · helper · afegeix 1 item a una dimensió (immutable)
export function addIkigaiItem(ikigai, dimId, item, { ts = null } = {}) {
    const dim = DIM_BY_ID.get(dimId);
    if (!dim) throw new Error('unknown dimension · ' + dimId);
    const current = (ikigai.dimensions?.[dimId]?.items || []).slice();
    const v = normalizeItem(item);
    if (!v) throw new Error('item-empty');
    const key = v.toLowerCase();
    if (current.some(x => x.toLowerCase() === key)) {
        // dedupe · no throw · sols ignorem
        return ikigai;
    }
    current.push(v);
    return applyIkigaiDimension(ikigai, dimId, current, { ts });
}

// removeIkigaiItem · pure · per índex
export function removeIkigaiItem(ikigai, dimId, index, { ts = null } = {}) {
    const dim = DIM_BY_ID.get(dimId);
    if (!dim) throw new Error('unknown dimension · ' + dimId);
    const current = (ikigai.dimensions?.[dimId]?.items || []).slice();
    if (index < 0 || index >= current.length) throw new Error('index-out-of-range');
    current.splice(index, 1);
    return applyIkigaiDimension(ikigai, dimId, current, { ts });
}

// validateIkigai · pure · { ok, errors[], missingDimensions[] }
export function validateIkigai(ikigai) {
    const errors = [];
    const missing = [];
    if (!ikigai || !ikigai.dimensions) return { ok: false, errors: ['no-dimensions'], missingDimensions: IKIGAI_DIMENSIONS.map(d => d.id) };
    for (const d of IKIGAI_DIMENSIONS) {
        const items = ikigai.dimensions[d.id]?.items || [];
        if (items.length < d.minItems) {
            missing.push(d.id);
            errors.push('dim-empty · ' + d.id + ' (cal ' + d.minItems + '+ item)');
        }
        if (items.length > d.maxItems) {
            errors.push('dim-too-many · ' + d.id);
        }
    }
    return { ok: errors.length === 0, errors, missingDimensions: missing };
}

// computeIkigaiCompleteness · pure · 0-1 ratio + percent
export function computeIkigaiCompleteness(ikigai) {
    if (!ikigai || !ikigai.dimensions) return { ratio: 0, percent: 0, filled: 0, total: IKIGAI_DIMENSIONS.length };
    let filled = 0;
    let totalItems = 0;
    for (const d of IKIGAI_DIMENSIONS) {
        const items = ikigai.dimensions[d.id]?.items || [];
        if (items.length >= d.minItems) filled++;
        totalItems += items.length;
    }
    const ratio = filled / IKIGAI_DIMENSIONS.length;
    return {
        ratio,
        percent:    Math.round(ratio * 100),
        filled,
        total:      IKIGAI_DIMENSIONS.length,
        totalItems,
    };
}

// computeIntersections · pure · per a cada IKIGAI_INTERSECTION calcula
// items comuns (case-insensitive set intersection) entre les seves dimensions.
//
// Retorna · {
//   passion:    [...],
//   profession: [...],
//   vocation:   [...],
//   mission:    [...],
//   ikigai:     [...]   // items que apareixen a TOTES 4 dimensions
// }
export function computeIntersections(ikigai) {
    const out = {};
    if (!ikigai || !ikigai.dimensions) {
        for (const i of IKIGAI_INTERSECTIONS) out[i.id] = [];
        return out;
    }
    const setsByDim = {};
    const lookupByDim = {};
    for (const d of IKIGAI_DIMENSIONS) {
        const items = ikigai.dimensions[d.id]?.items || [];
        const set = new Set(items.map(x => x.toLowerCase()));
        const lookup = new Map();
        for (const it of items) lookup.set(it.toLowerCase(), it);
        setsByDim[d.id] = set;
        lookupByDim[d.id] = lookup;
    }
    for (const i of IKIGAI_INTERSECTIONS) {
        let common = null;
        for (const did of i.dims) {
            const s = setsByDim[did] || new Set();
            if (common === null) common = new Set(s);
            else { for (const v of common) if (!s.has(v)) common.delete(v); }
        }
        // Recupera la grafia original (de la primera dimensió de la intersecció)
        const firstDim = i.dims[0];
        const lookup = lookupByDim[firstDim] || new Map();
        out[i.id] = Array.from(common || []).map(k => lookup.get(k) || k);
    }
    return out;
}

// applyIkigaiToMember · pure · merge a member.content.ikigai (immutable).
// El consumidor crida KB.upsert després.
export function applyIkigaiToMember(member, ikigai, { ts = null } = {}) {
    if (!member) throw new Error('member required');
    if (!ikigai) throw new Error('ikigai required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...member,
        content: { ...(member.content || {}), ikigai },
        updatedAt: now,
    };
}

// ikigaiBadge · pure · retorna { icon, color, label, level } segons quants
// intersections té omplerts. Per a UI compact.
export function ikigaiBadge(ikigai) {
    const intersections = computeIntersections(ikigai);
    const counts = {
        passion:    intersections.passion.length,
        profession: intersections.profession.length,
        vocation:   intersections.vocation.length,
        mission:    intersections.mission.length,
        ikigai:     intersections.ikigai.length,
    };
    if (counts.ikigai > 0) return { icon: '🌸', color: '#ec4899', label: 'Ikigai · centre trobat', level: 'ikigai', counts };
    const intersectionsWithItems = ['passion', 'profession', 'vocation', 'mission'].filter(k => counts[k] > 0);
    if (intersectionsWithItems.length >= 3) return { icon: '🌺', color: '#fb7185', label: 'Quasi al centre · ' + intersectionsWithItems.length + '/4 zones', level: 'almost', counts };
    if (intersectionsWithItems.length >= 1) return { icon: '🌱', color: '#86efac', label: 'En ruta · ' + intersectionsWithItems.length + ' zones', level: 'growing', counts };
    const completeness = computeIkigaiCompleteness(ikigai);
    if (completeness.filled === 0) return { icon: '·', color: '#94a3b8', label: 'Sense Ikigai definit', level: 'none', counts };
    return { icon: '◐', color: '#facc15', label: 'En progrés · ' + completeness.filled + '/4 dimensions', level: 'partial', counts };
}
