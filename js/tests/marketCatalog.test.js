// =============================================================================
// marketCatalog.test.js · MARKET-CATALOG sprint A · multi-source aggregation
// =============================================================================

import {
    CATALOG_SOURCE_TYPES, SELLABLE_SOP_KEYWORD,
    fromMarketItem, fromWorkshop, fromSop,
    buildCatalog, filterCatalog, computeCatalogStats, findCatalogEntry,
    shareUrlFor,
    markSopAsSellable, unmarkSopAsSellable,
} from '../core/marketCatalogService.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

// ─── Fixtures ─────────────────────────────────────────────────────────────
const mkItem = (id, props = {}) => ({
    id, type: 'market_item',
    content: { title: 't-' + id, kind: 'product', priceEur: 100, currency: 'EUR', providerProjectId: 'p1', visibility: 'public', ...props },
    updatedAt: 100, createdAt: 90,
});
const mkWorkshop = (id, props = {}) => ({
    id, type: 'workshop',
    content: { title: 'Workshop ' + id, outline: 'desc', priceEur: 240, projectId: 'p1', accessTier: 'public', audience: 'pro', ...props },
    updatedAt: 200, createdAt: 100,
});
const mkSop = (id, sellable = false, props = {}) => ({
    id, type: 'sop',
    content: { title: 'SOP ' + id, body: 'body', steps: ['s1', 's2'], roleId: 'r1', projectId: 'p1', priceEur: 80, currency: 'EUR', ...(sellable ? { marketSellable: true } : {}), ...props },
    keywords: sellable ? ['type:sop', SELLABLE_SOP_KEYWORD] : ['type:sop'],
    updatedAt: 150, createdAt: 50,
});

// ─── A · constants + source converters ────────────────────────────────────
eq(CATALOG_SOURCE_TYPES.length, 3,                                'A · 3 source types');
t(CATALOG_SOURCE_TYPES.includes('market_item'),                   'A · market_item');
t(CATALOG_SOURCE_TYPES.includes('workshop'),                      'A · workshop');
t(CATALOG_SOURCE_TYPES.includes('sop'),                           'A · sop');
eq(SELLABLE_SOP_KEYWORD, 'market-sellable',                       'A · sellable keyword');

// fromMarketItem
const i1 = mkItem('m1', { kind: 'service', priceEur: 200 });
const e1 = fromMarketItem(i1);
eq(e1.sourceType, 'market_item',                                  'A · market_item sourceType');
eq(e1.kind, 'service',                                            'A · kind preserved');
eq(e1.priceEur, 200,                                              'A · price');
eq(e1.providerProjectId, 'p1',                                    'A · providerProjectId');
eq(e1.raw, i1,                                                    'A · raw reference');

// fromMarketItem · null safe
eq(fromMarketItem(null), null,                                    'A · null → null');
eq(fromMarketItem({ type: 'other' }), null,                       'A · wrong type → null');

// fromWorkshop
const w1 = mkWorkshop('w1', { priceEur: 480 });
const ew1 = fromWorkshop(w1);
eq(ew1.kind, 'workshop',                                          'A · workshop kind');
eq(ew1.priceEur, 480,                                              'A · workshop price');
t(ew1.tags.includes('workshop'),                                  'A · workshop tag auto');
t(ew1.tags.includes('pro'),                                       'A · audience tag');
eq(fromWorkshop({ type: 'sop' }), null,                           'A · workshop · wrong type');

// fromSop · sellable
const s1 = mkSop('s1', true);
const es1 = fromSop(s1);
t(es1 !== null,                                                   'A · sop sellable → entry');
eq(es1.kind, 'service',                                           'A · sop → service kind');
eq(es1.priceEur, 80,                                              'A · sop price');
t(es1.tags.includes('service-from-sop'),                          'A · sop tag · service-from-sop');

// fromSop · NOT sellable → null
const sNo = mkSop('s2', false);
eq(fromSop(sNo), null,                                            'A · sop sense flag → null');

// fromSop · flag via keywords array
const sKw = { id: 'sk', type: 'sop', content: { title: 'kw', steps: [] }, keywords: [SELLABLE_SOP_KEYWORD], updatedAt: 1 };
t(fromSop(sKw) !== null,                                          'A · sop keyword flag suficient');

// ─── B · buildCatalog · aggregation ──────────────────────────────────────
const cat = buildCatalog({
    marketItems: [mkItem('m1'), mkItem('m2', { kind: 'service' })],
    workshops:   [mkWorkshop('w1')],
    sops:        [mkSop('s1', true), mkSop('s2', false), mkSop('s3', true)],
});
eq(cat.length, 5,                                                 'B · 2 items + 1 workshop + 2 sellable sops = 5 (s2 exclòs)');
// Order · DESC per updatedAt · workshop=200 primer (té el major updatedAt)
eq(cat[0].id, 'w1',                                               'B · workshop primer (updatedAt 200)');

// Sense workshops/sops
const catItems = buildCatalog({ marketItems: [mkItem('m1')] });
eq(catItems.length, 1,                                            'B · sols items');
eq(catItems[0].sourceType, 'market_item',                         'B · sourceType correct');

// Tots buits
const empty = buildCatalog({});
eq(empty.length, 0,                                               'B · totes fonts buides → []');

// ─── C · visibleProjectIds filter ────────────────────────────────────────
const items = [mkItem('m1', { providerProjectId: 'p1' }), mkItem('m2', { providerProjectId: 'p2' }), mkItem('m3', { providerProjectId: null })];
const visiblePIDs = new Set(['p1']);
const catVis = buildCatalog({ marketItems: items, visibleProjectIds: visiblePIDs });
eq(catVis.length, 2,                                              'C · m1 (p1 visible) + m3 (sense project) · m2 fora');
t(!catVis.some(e => e.id === 'm2'),                               'C · m2 (p2 invisible) exclòs');
t(catVis.some(e => e.id === 'm3'),                                'C · m3 (no project) sempre inclós');

// ─── D · filterCatalog ────────────────────────────────────────────────────
const base = buildCatalog({
    marketItems: [
        mkItem('m1', { kind: 'product', priceEur: 50 }),
        mkItem('m2', { kind: 'service', priceEur: 200 }),
        mkItem('m3', { kind: 'subscription', priceEur: 30 }),
    ],
    workshops: [mkWorkshop('w1', { priceEur: 480 })],
});

// Filter per kind
const fProd = filterCatalog(base, { kinds: ['product'] });
eq(fProd.length, 1,                                               'D · sols product');
eq(fProd[0].id, 'm1',                                             'D · m1');

const fMulti = filterCatalog(base, { kinds: ['product', 'workshop'] });
eq(fMulti.length, 2,                                              'D · product + workshop');

// Filter per sourceType
const fSt = filterCatalog(base, { sourceTypes: ['workshop'] });
eq(fSt.length, 1,                                                 'D · sourceType workshop');
eq(fSt[0].id, 'w1',                                               'D · w1');

// Filter per priceRange
const fPrice = filterCatalog(base, { priceMin: 100, priceMax: 300 });
eq(fPrice.length, 1,                                              'D · price 100-300 → 1 (m2 200)');
eq(fPrice[0].id, 'm2',                                            'D · m2');

const fPriceHigh = filterCatalog(base, { priceMin: 400 });
eq(fPriceHigh.length, 1,                                          'D · price >=400 → 1 (w1 480)');

// Filter per visibility
const fVis = filterCatalog(base, { visibility: 'public' });
t(fVis.length >= 3,                                               'D · visibility public · >=3');

// Filter per text
const fText = filterCatalog(base, { text: 'workshop' });
t(fText.length >= 1,                                              'D · text workshop trobat');

// Filter per projectId
const fProj = filterCatalog(base, { projectId: 'p1' });
t(fProj.length >= 3,                                              'D · projectId p1 · totes');

// Filter empty → tot
eq(filterCatalog(base, {}).length, base.length,                   'D · empty filter · tot');

// Filter per tags
const taggedItems = [
    mkItem('mt1', { tags: ['premium', 'spanish'] }),
    mkItem('mt2', { tags: ['basic'] }),
];
const tagBase = buildCatalog({ marketItems: taggedItems });
// Tag filtering needs intersection · ALL tags must be present
// mkItem putteja tags al content però fromMarketItem només copia content.tags
const fTags = filterCatalog(tagBase, { tags: ['premium'] });
eq(fTags.length, 1,                                               'D · tag premium · 1');
const fTagsBoth = filterCatalog(tagBase, { tags: ['premium', 'spanish'] });
eq(fTagsBoth.length, 1,                                           'D · tags premium+spanish · 1');
const fTagsMissing = filterCatalog(tagBase, { tags: ['premium', 'missing'] });
eq(fTagsMissing.length, 0,                                        'D · tag missing · 0');

// ─── E · computeCatalogStats ──────────────────────────────────────────────
const stats = computeCatalogStats(base);
eq(stats.total, 4,                                                'E · total 4');
eq(stats.byKind.product, 1,                                       'E · 1 product');
eq(stats.byKind.service, 1,                                       'E · 1 service');
eq(stats.byKind.subscription, 1,                                  'E · 1 subscription');
eq(stats.byKind.workshop, 1,                                      'E · 1 workshop');
eq(stats.bySourceType.market_item, 3,                             'E · 3 market_item');
eq(stats.bySourceType.workshop, 1,                                'E · 1 workshop source');
eq(stats.minPrice, 30,                                            'E · minPrice 30');
eq(stats.maxPrice, 480,                                           'E · maxPrice 480');
eq(stats.avgPrice, 190,                                           'E · avgPrice (50+200+30+480)/4 = 190');

// Empty
const emptyStats = computeCatalogStats([]);
eq(emptyStats.total, 0,                                           'E · empty stats · total 0');
eq(emptyStats.minPrice, null,                                     'E · empty minPrice null');

// ─── F · findCatalogEntry ─────────────────────────────────────────────────
const found = findCatalogEntry(base, 'm2');
t(found && found.id === 'm2',                                     'F · trobat per id');
eq(findCatalogEntry(base, 'nope'), null,                          'F · no trobat → null');
eq(findCatalogEntry(base, null), null,                            'F · null id → null');
eq(findCatalogEntry(null, 'm1'), null,                            'F · null entries → null');

// ─── G · shareUrlFor ──────────────────────────────────────────────────────
const url = shareUrlFor(base[0], { absoluteUrl: 'https://sos.example.com' });
t(url.startsWith('https://sos.example.com/market/'),              'G · share URL · /market/');
t(url.includes(base[0].id),                                       'G · share URL inclou id');
eq(shareUrlFor(null), null,                                       'G · null entry → null');

// ─── H · markSopAsSellable + unmark ──────────────────────────────────────
const sopOrig = { id: 'sop1', type: 'sop', content: { title: 'X', steps: [] }, keywords: ['type:sop'], updatedAt: 1 };
const sopMarked = markSopAsSellable(sopOrig, { priceEur: 120, currency: 'EUR' });
eq(sopMarked.content.marketSellable, true,                        'H · marketSellable true');
eq(sopMarked.content.priceEur, 120,                               'H · priceEur set');
t(sopMarked.keywords.includes(SELLABLE_SOP_KEYWORD),              'H · keyword afegida');
t(sopOrig.content.marketSellable !== true,                        'H · immutable · orig sense canvi');

// Doble mark · keyword no es duplica
const sopReMarked = markSopAsSellable(sopMarked, { priceEur: 150 });
const kwCount = sopReMarked.keywords.filter(k => k === SELLABLE_SOP_KEYWORD).length;
eq(kwCount, 1,                                                    'H · keyword no duplicada');
eq(sopReMarked.content.priceEur, 150,                             'H · price actualitzat');

// Unmark
const sopUnmarked = unmarkSopAsSellable(sopMarked);
eq(sopUnmarked.content.marketSellable, false,                     'H · unmark · false');
t(!sopUnmarked.keywords.includes(SELLABLE_SOP_KEYWORD),           'H · keyword treta');

// Errors
let threw = false;
try { markSopAsSellable(null); } catch (_) { threw = true; }
t(threw,                                                          'H · null sop throws');
threw = false;
try { markSopAsSellable({ type: 'other' }); } catch (_) { threw = true; }
t(threw,                                                          'H · non-sop throws');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
