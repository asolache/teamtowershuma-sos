// =============================================================================
// TEAMTOWERS SOS V11 — MARKET SERVICE (MKT-001 sprint A)
// Ruta: /js/core/marketService.js
//
// Schema y operaciones puras para el Mercado SOS · catálogo de productos
// y servicios que las redes de valor con propósito intercambian con
// otros stakeholders (red macro tipo SOS Matriu Launch).
//
// Tesis @alvaro: el output final del VNA es un producto/servicio que se
// intercambia. El Mercado SOS es la plaza donde esos outputs se cruzan.
//
// Funciones PURAS (sin I/O · testeables sin IndexedDB ni LLM).
// =============================================================================

import { normalizeTag } from './tagsService.js';

// ─── Constantes ─────────────────────────────────────────────────────────────
export const MARKET_ITEM_KINDS = Object.freeze([
    'product',     // bien tangible (mueble, libro, dispositivo)
    'service',     // intangible facturable (consultoría, mentoría, auditoría)
    'workshop',    // taller con asistentes (heredado del /workshops original)
    'skill',       // capacidad concreta de un humano · ofertable como hora
    'template',    // plantilla descargable (SOC, SOP, contrato)
    'subscription',// acceso recurrente a recursos
]);

export const MARKET_VISIBILITY = Object.freeze([
    'public',      // visible en todo el ecosistema SOS
    'red-macro',   // sólo proyectos federados con el origen
    'client',      // sólo invitados · enlace privado
    'internal',    // sólo dentro del proyecto creador
]);

// ─── Validación de un item · pura ───────────────────────────────────────────
export function validateMarketItem(item) {
    const errors = [];
    if (!item || typeof item !== 'object') return { ok: false, errors: ['item no es objeto'] };
    if (!item.id || typeof item.id !== 'string')                     errors.push('id requerido');
    if (item.type !== 'market_item')                                 errors.push("type debe ser 'market_item'");
    const c = item.content || {};
    if (!c.title || typeof c.title !== 'string')                     errors.push('content.title requerido');
    if (!c.kind || !MARKET_ITEM_KINDS.includes(c.kind))              errors.push("content.kind debe ser uno de " + MARKET_ITEM_KINDS.join('|'));
    if (c.priceEur != null && (typeof c.priceEur !== 'number' || c.priceEur < 0)) errors.push('content.priceEur debe ser número ≥ 0');
    if (c.cnae && !/^[0-9]{2,4}$/.test(c.cnae))                      errors.push('content.cnae debe ser 2-4 dígitos');
    if (c.visibility && !MARKET_VISIBILITY.includes(c.visibility))   errors.push("content.visibility inválida");
    return { ok: errors.length === 0, errors };
}

// ─── Constructor canónico ───────────────────────────────────────────────────
// Genera un nodo market_item válido con valores por defecto sensatos.
export function buildMarketItem({
    title,
    kind = 'service',
    description = '',
    cnae = null,
    sectorTT = null,
    priceEur = null,
    fmvHumanEquivalentEur = null,
    providerProjectId = null,
    deliverables = [],
    tags = [],
    visibility = 'public',
    sku = null,
} = {}) {
    if (!title) throw new Error('buildMarketItem: title requerido');
    const id = 'mkt-' + (sku || '') + '-' + Math.random().toString(36).slice(2, 8) + '-' + Date.now().toString(36);
    return {
        id,
        type:      'market_item',
        projectId: providerProjectId,
        content: {
            title,
            kind,
            description,
            sku:                   sku || id,
            cnae,
            sectorTT,
            priceEur:              priceEur != null ? Number(priceEur) : null,
            fmvHumanEquivalentEur: fmvHumanEquivalentEur != null ? Number(fmvHumanEquivalentEur) : null,
            providerProjectId,
            deliverables:          Array.isArray(deliverables) ? deliverables : [],
            visibility,
            createdAt:             Date.now(),
            tags:                  Array.isArray(tags) ? tags : [],
        },
        keywords: ['market_item', kind, cnae, sectorTT, ...(Array.isArray(tags) ? tags : [])].filter(Boolean),
    };
}

// ─── Búsqueda · función PURA sobre array de items ──────────────────────────
// Filtra por texto libre (título · description · cnae · sectorTT · tags) +
// filtros estructurados opcionales. Devuelve array filtrado preservando orden.
export function searchMarketItems(items, query = {}) {
    if (!Array.isArray(items)) return [];
    const text = (query.text || '').toString().trim().toLowerCase();
    const kinds = Array.isArray(query.kinds) && query.kinds.length ? query.kinds : null;
    const cnaes = Array.isArray(query.cnaes) && query.cnaes.length ? query.cnaes : null;
    const sectorTT = (query.sectorTT || '').toString().trim().toUpperCase() || null;
    const visibility = (query.visibility || '').toString().trim().toLowerCase() || null;
    const projectId = query.projectId || null;
    const priceMax = query.priceMax != null ? Number(query.priceMax) : null;
    const priceMin = query.priceMin != null ? Number(query.priceMin) : null;

    return items.filter(item => {
        const c = item?.content || {};
        if (item?.type !== 'market_item') return false;
        if (kinds      && !kinds.includes(c.kind)) return false;
        if (cnaes      && !cnaes.includes(c.cnae)) return false;
        if (sectorTT   && (c.sectorTT || '').toUpperCase() !== sectorTT) return false;
        if (visibility && c.visibility !== visibility) return false;
        if (projectId  && c.providerProjectId !== projectId) return false;
        if (priceMax != null && (c.priceEur == null || c.priceEur > priceMax)) return false;
        if (priceMin != null && (c.priceEur == null || c.priceEur < priceMin)) return false;
        if (!text) return true;
        const hay = [
            c.title || '', c.description || '', c.sku || '', c.cnae || '',
            c.sectorTT || '', (c.deliverables || []).join(' '),
            ...(Array.isArray(c.tags) ? c.tags : []),
        ].join(' ').toLowerCase();
        return hay.includes(text);
    });
}

// ─── Agrupado por sector TT y por kind · útil para grids facetados ──────────
export function groupBy(items, keyExtractor) {
    if (!Array.isArray(items) || typeof keyExtractor !== 'function') return {};
    const out = {};
    for (const it of items) {
        const k = keyExtractor(it) ?? '__none';
        if (!out[k]) out[k] = [];
        out[k].push(it);
    }
    return out;
}

export function groupBySectorTT(items) {
    return groupBy(items, it => it?.content?.sectorTT || null);
}

export function groupByKind(items) {
    return groupBy(items, it => it?.content?.kind || null);
}

// ─── Cálculo del cuadro de ahorro · vs vías convencionales ─────────────────
// Toma un market_item y un mapa de rangos convencionales (configurable en
// /settings · MKT-001 sprint D). Devuelve { savingEur, savingPct, vsConv }.
//
// Por defecto, los rangos vienen de la tabla del backlog (notaría · contable
// · PM · consultoría) · el operador puede sobreescribir.
export const DEFAULT_CONVENTIONAL_RANGES = Object.freeze({
    notaria:     { lowEur: 800,  highEur: 2500, label: 'Notaría / escritura'   },
    contable:    { lowEur: 80,   highEur: 300,  label: 'Asesoría contable mensual', unit: '€/mes' },
    pm:          { lowEur: 40,   highEur: 90,   label: 'Project Manager externo',   unit: '€/h' },
    consultoria: { lowEur: 200,  highEur: 600,  label: 'Consultoría estratégica',   unit: '€/h' },
});

export function computeSaving(item, conventional = DEFAULT_CONVENTIONAL_RANGES) {
    const c = item?.content || {};
    if (c.priceEur == null) return null;
    if (!c.savingsCompareTo) return null;     // no aplica si no se ha definido contra qué se compara
    const range = conventional[c.savingsCompareTo];
    if (!range) return null;
    const conv = (range.lowEur + range.highEur) / 2;
    const savingEur = Math.max(0, conv - c.priceEur);
    const savingPct = Math.round(100 * savingEur / conv);
    return {
        savingEur,
        savingPct,
        vsConvLabel: range.label,
        vsConvLowEur:  range.lowEur,
        vsConvHighEur: range.highEur,
    };
}
