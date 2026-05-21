// =============================================================================
// TEAMTOWERS SOS V11 — canvasLabMetrics (v163)
// Mètriques pures per al Canvas Anchoring Lab. Anàlogues a les del value-map
// Lab però adaptades a l'estructura canvas (ikigai + vision/mission/values +
// stakeholders + productService).
//
//   - computeGenericityCount(canvas)        → nº paraules genèriques prohibides
//   - computeStakeholderDiversityPct(canvases) → % stakeholders únics
//   - computeCanvasCompletenessPct(canvas)  → 0-100 omplitut canòmic
//
// Pure functions · sense efectes secundaris · directament testables.
// =============================================================================

// Paraules genèriques que el preamble v162 prohibeix explícitament + altres
// "fillers" típics d'output anchored a plantilla. KISS · llista curta amb
// les més freqüents · ampliable si cal.
export const GENERIC_VOCAB = Object.freeze([
    // CA
    'qualitat', 'innovació', 'excel·lència', 'sinergia', 'sinergies',
    'compromís', 'transparència', 'sostenibilitat', 'eficiència',
    // ES
    'calidad', 'innovacion', 'innovación', 'excelencia', 'sinergia',
    'compromiso', 'transparencia', 'sostenibilidad', 'eficiencia',
    // EN
    'quality', 'innovation', 'excellence', 'synergy', 'commitment',
    'transparency', 'sustainability', 'efficiency',
]);

// _collectCanvasText · concatena tots els camps textuals del canvas per a
// detecció de vocabulari. Recursiu sobre objectes/arrays.
function _collectCanvasText(canvas) {
    if (canvas == null) return '';
    if (typeof canvas === 'string') return canvas + ' ';
    if (Array.isArray(canvas)) return canvas.map(_collectCanvasText).join(' ');
    if (typeof canvas === 'object') {
        return Object.values(canvas).map(_collectCanvasText).join(' ');
    }
    return '';
}

export function computeGenericityCount(canvas) {
    const text = _collectCanvasText(canvas).toLowerCase();
    if (!text) return 0;
    let count = 0;
    for (const word of GENERIC_VOCAB) {
        const matches = text.match(new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g'));
        if (matches) count += matches.length;
    }
    return count;
}

export function computeStakeholderDiversityPct(canvases) {
    const valid = (canvases || []).filter(c => c && Array.isArray(c.stakeholders));
    if (valid.length < 2) return 0;
    const all = [];
    const unique = new Set();
    for (const c of valid) {
        for (const s of c.stakeholders) {
            const key = String(s || '').toLowerCase().trim();
            if (!key) continue;
            all.push(key);
            unique.add(key);
        }
    }
    if (all.length === 0) return 0;
    return Math.round((unique.size / all.length) * 100);
}

// Canvas canonical · 8 camps clau · cada un val 12.5 punts (8 × 12.5 = 100)
const CANVAS_REQUIRED_FIELDS = Object.freeze([
    { key: 'ikigai.loves',      validator: v => Array.isArray(v) && v.length >= 1 },
    { key: 'ikigai.goodAt',     validator: v => Array.isArray(v) && v.length >= 1 },
    { key: 'ikigai.worldNeeds', validator: v => Array.isArray(v) && v.length >= 1 },
    { key: 'ikigai.paidFor',    validator: v => Array.isArray(v) && v.length >= 1 },
    { key: 'vision',            validator: v => typeof v === 'string' && v.trim().length > 5 },
    { key: 'mission',           validator: v => typeof v === 'string' && v.trim().length > 5 },
    { key: 'values',            validator: v => Array.isArray(v) && v.length >= 1 },
    { key: 'stakeholders',      validator: v => Array.isArray(v) && v.length >= 1 },
]);

function _getByPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function computeCanvasCompletenessPct(canvas) {
    if (!canvas) return 0;
    let ok = 0;
    for (const field of CANVAS_REQUIRED_FIELDS) {
        if (field.validator(_getByPath(canvas, field.key))) ok++;
    }
    return Math.round((ok / CANVAS_REQUIRED_FIELDS.length) * 100);
}
