// =============================================================================
// TEAMTOWERS SOS V11 — MARKET CATALOG SERVICE (MARKET-CATALOG sprint A)
// Ruta · /js/core/marketCatalogService.js
//
// Agrega ofertes del mercat SOS des de múltiples fonts (market_item · workshop ·
// SOP exposable). Tradueix cada font a una estructura comuna `CatalogEntry`
// per a renderitzar tot junt al /market i a la pàgina detall /market/{id}.
// Pure · zero KB · zero DOM · injectable.
//
// SOURCES ·
//   market_item · directe (kind del propi item)
//   workshop    · exposat com a kind='workshop' (sempre que projectId visible)
//   sop         · exposat com a kind='service' SI conté tag/keyword
//                 'market-sellable' o `content.marketSellable === true`
//
// FILTERING · per kind · per project · per visibility · per text search ·
// per priceRange · per tags
//
// CATALOG ENTRY · estructura unificada per a UI ·
//   {
//     id,              // node id origen
//     sourceType,      // 'market_item' | 'workshop' | 'sop'
//     kind,            // 'product' | 'service' | 'workshop' | 'subscription' | ...
//     title,
//     description,
//     priceEur,        // null si sense preu
//     currency,        // EUR default
//     providerProjectId,
//     providerHandle,  // creator si disponible
//     visibility,      // public/internal/red-macro/client
//     tags,            // [...]
//     cnae,
//     sectorTT,
//     createdAt,
//     updatedAt,
//     raw,             // node original (per detail view)
//   }
// =============================================================================

import { MARKET_ITEM_KINDS, MARKET_VISIBILITY } from './marketService.js';

export const CATALOG_SOURCE_TYPES = Object.freeze(['market_item', 'workshop', 'sop']);

// SELLABLE_SOP_KEYWORD · marca als SOP nodes que els fa visibles al market.
// L'usuari pot afegir aquesta keyword o `content.marketSellable = true`.
export const SELLABLE_SOP_KEYWORD = 'market-sellable';

// fromMarketItem · pura · converteix market_item a CatalogEntry
export function fromMarketItem(item) {
    if (!item || item.type !== 'market_item') return null;
    const c = item.content || {};
    return {
        id:                item.id,
        sourceType:        'market_item',
        kind:              c.kind || 'product',
        title:             c.title || item.id,
        description:       c.description || '',
        priceEur:          (typeof c.priceEur === 'number') ? c.priceEur : (typeof c.price === 'number' ? c.price : null),
        currency:          c.currency || 'EUR',
        providerProjectId: c.providerProjectId || c.projectId || null,
        providerHandle:    c.providerHandle || c.createdBy || null,
        visibility:        c.visibility || 'public',
        tags:              Array.isArray(c.tags) ? c.tags.slice() : [],
        cnae:              c.cnae || null,
        sectorTT:          c.sectorTT || c.sector || null,
        createdAt:         c.createdAt || item.createdAt || 0,
        updatedAt:         item.updatedAt || c.updatedAt || 0,
        raw:               item,
    };
}

// fromWorkshop · pura · converteix workshop a CatalogEntry kind='workshop'
export function fromWorkshop(workshop) {
    if (!workshop || workshop.type !== 'workshop') return null;
    const c = workshop.content || {};
    return {
        id:                workshop.id,
        sourceType:        'workshop',
        kind:              'workshop',
        title:             c.title || workshop.id,
        description:       c.outline || c.description || '',
        priceEur:          (typeof c.priceEur === 'number') ? c.priceEur : (typeof c.price === 'number' ? c.price : null),
        currency:          c.currency || 'EUR',
        providerProjectId: c.projectId || workshop.projectId || null,
        providerHandle:    c.createdBy || c.facilitator || null,
        visibility:        c.accessTier === 'public' ? 'public' : 'red-macro',
        tags:              ['workshop', c.audience || 'general', c.accessTier || 'free'],
        cnae:              c.cnae || null,
        sectorTT:          null,
        createdAt:         c.createdAt || workshop.createdAt || 0,
        updatedAt:         workshop.updatedAt || 0,
        raw:               workshop,
    };
}

// fromSop · pura · sols si flagged sellable
export function fromSop(sop) {
    if (!sop || sop.type !== 'sop') return null;
    const c = sop.content || {};
    const hasFlag = c.marketSellable === true
        || (Array.isArray(sop.keywords) && sop.keywords.includes(SELLABLE_SOP_KEYWORD))
        || (Array.isArray(c.tags) && c.tags.includes(SELLABLE_SOP_KEYWORD));
    if (!hasFlag) return null;
    return {
        id:                sop.id,
        sourceType:        'sop',
        kind:              'service',
        title:             c.title || sop.id,
        description:       c.body || (Array.isArray(c.steps) ? c.steps.join(' · ') : ''),
        priceEur:          (typeof c.priceEur === 'number') ? c.priceEur : (typeof c.priceHour === 'number' ? c.priceHour : null),
        currency:          c.currency || 'EUR',
        providerProjectId: c.projectId || sop.projectId || null,
        providerHandle:    c.createdBy || null,
        visibility:        c.visibility || 'public',
        tags:              ['sop', 'service-from-sop', c.roleId || 'role'],
        cnae:              c.cnae || null,
        sectorTT:          null,
        createdAt:         c.createdAt || sop.createdAt || 0,
        updatedAt:         sop.updatedAt || 0,
        raw:               sop,
    };
}

// buildCatalog · pura · agrega entries de múltiples sources en una llista única.
//
// args ·
//   marketItems  · [market_item nodes]
//   workshops    · [workshop nodes]
//   sops         · [sop nodes · sols els flagged sellable s'inclouen]
//   visibleProjectIds · Set<string> opcional · si dóna · filtra entries amb
//                       providerProjectId fora del set (excepte si no té project)
//
// Retorna · CatalogEntry[] · ordenat per updatedAt DESC
export function buildCatalog({
    marketItems         = [],
    workshops           = [],
    sops                = [],
    visibleProjectIds   = null,
} = {}) {
    const entries = [];
    for (const item of marketItems || []) {
        const e = fromMarketItem(item);
        if (e) entries.push(e);
    }
    for (const w of workshops || []) {
        const e = fromWorkshop(w);
        if (e) entries.push(e);
    }
    for (const s of sops || []) {
        const e = fromSop(s);
        if (e) entries.push(e);
    }
    // Filter per visibleProjectIds
    let filtered = entries;
    if (visibleProjectIds instanceof Set && visibleProjectIds.size > 0) {
        filtered = entries.filter(e => !e.providerProjectId || visibleProjectIds.has(e.providerProjectId));
    }
    filtered.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return filtered;
}

// filterCatalog · pura · aplica filtres en cadena.
//
// filter · {
//   text,            // case-insensitive substring sobre title + description + tags
//   kinds: [...],    // intersecció · cap → tots
//   sourceTypes: [...], // intersecció · cap → tots
//   visibility,      // exacte · '' → tots
//   priceMin,        // priceEur ≥ priceMin (null exclou)
//   priceMax,        // priceEur ≤ priceMax (null exclou)
//   projectId,       // exacte
//   tags: [...],     // intersecció · entry ha de tenir TOTS els tags
// }
export function filterCatalog(entries, filter = {}) {
    const text = (filter.text || '').trim().toLowerCase();
    const kinds = Array.isArray(filter.kinds) ? filter.kinds : [];
    const sourceTypes = Array.isArray(filter.sourceTypes) ? filter.sourceTypes : [];
    const tags = Array.isArray(filter.tags) ? filter.tags : [];
    return (entries || []).filter(e => {
        if (kinds.length > 0 && !kinds.includes(e.kind)) return false;
        if (sourceTypes.length > 0 && !sourceTypes.includes(e.sourceType)) return false;
        if (filter.visibility && e.visibility !== filter.visibility) return false;
        if (filter.projectId && e.providerProjectId !== filter.projectId) return false;
        if (typeof filter.priceMin === 'number' && (e.priceEur == null || e.priceEur < filter.priceMin)) return false;
        if (typeof filter.priceMax === 'number' && (e.priceEur == null || e.priceEur > filter.priceMax)) return false;
        if (tags.length > 0) {
            const entryTags = new Set((e.tags || []).map(t => String(t).toLowerCase()));
            for (const t of tags) {
                if (!entryTags.has(String(t).toLowerCase())) return false;
            }
        }
        if (text) {
            const hay = (e.title + ' ' + e.description + ' ' + (e.tags || []).join(' ')).toLowerCase();
            if (!hay.includes(text)) return false;
        }
        return true;
    });
}

// computeCatalogStats · pura · breakdown per kind + sourceType + totals.
// Retorna · { total, byKind: {product, service, workshop, ...}, bySourceType,
//   minPrice, maxPrice, avgPrice }
export function computeCatalogStats(entries) {
    const byKind = {};
    const bySourceType = {};
    let total = 0;
    let priceSum = 0;
    let priceCount = 0;
    let minPrice = null, maxPrice = null;
    for (const e of entries || []) {
        total++;
        byKind[e.kind] = (byKind[e.kind] || 0) + 1;
        bySourceType[e.sourceType] = (bySourceType[e.sourceType] || 0) + 1;
        if (typeof e.priceEur === 'number' && isFinite(e.priceEur)) {
            priceSum += e.priceEur;
            priceCount++;
            if (minPrice === null || e.priceEur < minPrice) minPrice = e.priceEur;
            if (maxPrice === null || e.priceEur > maxPrice) maxPrice = e.priceEur;
        }
    }
    return {
        total,
        byKind,
        bySourceType,
        minPrice,
        maxPrice,
        avgPrice: priceCount > 0 ? Math.round((priceSum / priceCount) * 100) / 100 : null,
    };
}

// findCatalogEntry · pura · busca per id (cross-source).
// Retorna · entry o null. Útil per a la pàgina detall.
export function findCatalogEntry(entries, id) {
    if (!id) return null;
    return (entries || []).find(e => e.id === id) || null;
}

// shareUrlFor · pura · construeix URL detail
export function shareUrlFor(entry, { absoluteUrl = '' } = {}) {
    if (!entry || !entry.id) return null;
    return (absoluteUrl || '') + '/market/' + encodeURIComponent(entry.id);
}

// markSopAsSellable · pura · retorna nou SOP node amb el flag aplicat.
// Útil al UI quan l'usuari prem "Publicar al market" en un SOP.
export function markSopAsSellable(sop, { priceEur = null, currency = 'EUR', ts = null } = {}) {
    if (!sop || sop.type !== 'sop') throw new Error('sop required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    const next = {
        ...sop,
        content:  { ...(sop.content || {}), marketSellable: true },
        keywords: Array.isArray(sop.keywords) ? sop.keywords.slice() : [],
        updatedAt: now,
    };
    if (!next.keywords.includes(SELLABLE_SOP_KEYWORD)) next.keywords.push(SELLABLE_SOP_KEYWORD);
    if (typeof priceEur === 'number' && priceEur >= 0) next.content.priceEur = priceEur;
    if (currency) next.content.currency = currency;
    return next;
}

// unmarkSopAsSellable · pura · treu el flag (no esborra preu)
export function unmarkSopAsSellable(sop, { ts = null } = {}) {
    if (!sop || sop.type !== 'sop') throw new Error('sop required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...sop,
        content:  { ...(sop.content || {}), marketSellable: false },
        keywords: Array.isArray(sop.keywords) ? sop.keywords.filter(k => k !== SELLABLE_SOP_KEYWORD) : [],
        updatedAt: now,
    };
}

// EXPORT MARKET-KINDS constants for UI reuse
export { MARKET_ITEM_KINDS, MARKET_VISIBILITY };
