// =============================================================================
// ikigai.test.js · IKIGAI sprint A · pure logic + intersection computation
// =============================================================================

import {
    IKIGAI_DIMENSIONS, IKIGAI_INTERSECTIONS,
    dimMeta,
    buildEmptyIkigai,
    applyIkigaiDimension, addIkigaiItem, removeIkigaiItem,
    validateIkigai, computeIkigaiCompleteness,
    computeIntersections, applyIkigaiToMember, ikigaiBadge,
} from '../core/ikigaiService.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

// ─── A · constants ────────────────────────────────────────────────────────
eq(IKIGAI_DIMENSIONS.length, 4,                                   'A · 4 dimensions');
const dimIds = IKIGAI_DIMENSIONS.map(d => d.id);
for (const need of ['loves', 'goodAt', 'worldNeeds', 'paidFor']) {
    t(dimIds.includes(need),                                      'A · dimension ' + need);
}
eq(IKIGAI_INTERSECTIONS.length, 5,                                'A · 5 intersections');
const intIds = IKIGAI_INTERSECTIONS.map(i => i.id);
for (const need of ['passion', 'profession', 'vocation', 'mission', 'ikigai']) {
    t(intIds.includes(need),                                      'A · intersection ' + need);
}
// dimMeta
t(dimMeta('loves') !== null,                                      'A · dimMeta loves');
eq(dimMeta('unknown'), null,                                      'A · dimMeta unknown → null');

// ─── B · buildEmptyIkigai ─────────────────────────────────────────────────
const empty = buildEmptyIkigai({ ts: 1700000000000 });
eq(empty.createdAt, 1700000000000,                                'B · createdAt');
eq(empty.completedAt, null,                                       'B · completedAt null');
eq(Object.keys(empty.dimensions).length, 4,                       'B · 4 dimensions entries');
for (const d of IKIGAI_DIMENSIONS) {
    eq(empty.dimensions[d.id].items.length, 0,                    'B · dim ' + d.id + ' empty');
}

// ─── C · applyIkigaiDimension + dedupe + normalize ───────────────────────
const i1 = applyIkigaiDimension(empty, 'loves', ['  Música  ', 'música', 'codi', '']);
eq(i1.dimensions.loves.items.length, 2,                           'C · dedupe case + trim · 2 items (música+codi)');
eq(i1.dimensions.loves.items[0], 'Música',                        'C · first kept (Música amb majúscula)');
t(i1.dimensions.loves.items.includes('codi'),                     'C · codi inclós');
// Immutable
eq(empty.dimensions.loves.items.length, 0,                        'C · immutable · empty sense canviar');

// Throws on unknown dim
let threw = false;
try { applyIkigaiDimension(empty, 'unknown', ['x']); } catch (_) { threw = true; }
t(threw,                                                          'C · unknown dim throws');
threw = false;
try { applyIkigaiDimension(empty, 'loves', 'not-array'); } catch (_) { threw = true; }
t(threw,                                                          'C · non-array throws');

// Max items · throw si excedeix
const tooMany = new Array(20).fill('item-').map((s, i) => s + i);
threw = false;
try { applyIkigaiDimension(empty, 'loves', tooMany); } catch (_) { threw = true; }
t(threw,                                                          'C · max items throws');

// ─── D · addIkigaiItem + removeIkigaiItem ────────────────────────────────
let i2 = addIkigaiItem(empty, 'loves', 'Música');
eq(i2.dimensions.loves.items.length, 1,                           'D · add 1 item');
i2 = addIkigaiItem(i2, 'loves', 'música');     // dedupe · ignora
eq(i2.dimensions.loves.items.length, 1,                           'D · dedupe · still 1');
i2 = addIkigaiItem(i2, 'loves', 'codi');
eq(i2.dimensions.loves.items.length, 2,                           'D · add second');

// Remove per index
const i2r = removeIkigaiItem(i2, 'loves', 0);
eq(i2r.dimensions.loves.items.length, 1,                          'D · remove · 1 left');
eq(i2r.dimensions.loves.items[0], 'codi',                         'D · queda codi');

threw = false;
try { removeIkigaiItem(i2, 'loves', 99); } catch (_) { threw = true; }
t(threw,                                                          'D · out of range throws');

threw = false;
try { addIkigaiItem(empty, 'loves', '   '); } catch (_) { threw = true; }
t(threw,                                                          'D · empty item throws');

// ─── E · validateIkigai ──────────────────────────────────────────────────
// Empty · invalid
const v0 = validateIkigai(empty);
eq(v0.ok, false,                                                  'E · empty invalid');
eq(v0.missingDimensions.length, 4,                                'E · 4 missing');

// Parcial · invalid
const partial = applyIkigaiDimension(empty, 'loves', ['música']);
const vP = validateIkigai(partial);
eq(vP.ok, false,                                                  'E · partial invalid');
eq(vP.missingDimensions.length, 3,                                'E · 3 missing');

// Tots 4 omplerts · valid
let full = empty;
full = applyIkigaiDimension(full, 'loves',      ['música', 'codi', 'cuinar']);
full = applyIkigaiDimension(full, 'goodAt',     ['codi', 'enginyeria', 'pedagogia']);
full = applyIkigaiDimension(full, 'worldNeeds', ['educació', 'codi obert', 'cooperatives']);
full = applyIkigaiDimension(full, 'paidFor',    ['codi', 'pedagogia', 'consultoria']);
const vF = validateIkigai(full);
eq(vF.ok, true,                                                   'E · full valid');
eq(vF.missingDimensions.length, 0,                                'E · 0 missing');

// completedAt
t(full.completedAt !== null,                                      'E · completedAt set quan 4 omplerts');

// Null / no dimensions
eq(validateIkigai(null).ok, false,                                'E · null invalid');
eq(validateIkigai({}).ok, false,                                  'E · no dimensions invalid');

// ─── F · computeIkigaiCompleteness ───────────────────────────────────────
const c0 = computeIkigaiCompleteness(empty);
eq(c0.percent, 0,                                                 'F · empty 0%');
eq(c0.filled, 0,                                                  'F · 0 filled');
eq(c0.totalItems, 0,                                              'F · 0 totalItems');

const cP = computeIkigaiCompleteness(partial);
eq(cP.percent, 25,                                                'F · partial 25%');
eq(cP.filled, 1,                                                  'F · 1 filled');
eq(cP.totalItems, 1,                                              'F · 1 totalItems');

const cF = computeIkigaiCompleteness(full);
eq(cF.percent, 100,                                               'F · full 100%');
eq(cF.filled, 4,                                                  'F · 4 filled');
eq(cF.totalItems, 12,                                             'F · 12 totalItems');

eq(computeIkigaiCompleteness(null).percent, 0,                    'F · null safe');

// ─── G · computeIntersections ────────────────────────────────────────────
// loves      · música · codi · cuinar
// goodAt     · codi · enginyeria · pedagogia
// worldNeeds · educació · codi obert · cooperatives
// paidFor    · codi · pedagogia · consultoria
//
// passion (loves ∩ goodAt)             · codi
// profession (goodAt ∩ paidFor)        · codi · pedagogia
// vocation (paidFor ∩ worldNeeds)      · []  (cap solapament)
// mission (worldNeeds ∩ loves)         · []  (cap)
// ikigai (4-way)                       · []  (codi no està a worldNeeds)
const inter = computeIntersections(full);
t(inter.passion.length === 1 && inter.passion[0].toLowerCase() === 'codi', 'G · passion · codi');
eq(inter.profession.length, 2,                                    'G · profession · 2 (codi+pedagogia)');
eq(inter.vocation.length, 0,                                      'G · vocation · 0');
eq(inter.mission.length, 0,                                       'G · mission · 0');
eq(inter.ikigai.length, 0,                                        'G · ikigai · 0 (no codi a worldNeeds)');

// Cas amb ikigai trobat · "codi obert" a TOTES 4
let ikiFull = buildEmptyIkigai();
const term = 'codi obert';
ikiFull = applyIkigaiDimension(ikiFull, 'loves',      [term, 'música']);
ikiFull = applyIkigaiDimension(ikiFull, 'goodAt',     [term, 'pedagogia']);
ikiFull = applyIkigaiDimension(ikiFull, 'worldNeeds', [term, 'educació']);
ikiFull = applyIkigaiDimension(ikiFull, 'paidFor',    [term, 'consultoria']);
const intIki = computeIntersections(ikiFull);
eq(intIki.ikigai.length, 1,                                       'G · ikigai trobat · 1 item');
eq(intIki.ikigai[0].toLowerCase(), 'codi obert',                  'G · ikigai · codi obert');

// Case-insensitive
let iki2 = buildEmptyIkigai();
iki2 = applyIkigaiDimension(iki2, 'loves',      ['Música', 'codi']);
iki2 = applyIkigaiDimension(iki2, 'goodAt',     ['música', 'enginyeria']);
const int2 = computeIntersections(iki2);
eq(int2.passion.length, 1,                                        'G · case-insensitive · 1 item passion');

// Empty safe
eq(computeIntersections(empty).passion.length, 0,                 'G · empty · 0');
eq(computeIntersections(null).passion.length, 0,                  'G · null safe');

// ─── H · applyIkigaiToMember ─────────────────────────────────────────────
const member = { id: 'mem-1', type: 'matriu_member', content: { displayName: 'X', handle: '@x' } };
const updated = applyIkigaiToMember(member, full);
eq(updated.content.ikigai, full,                                  'H · ikigai anclat');
eq(updated.content.displayName, 'X',                              'H · displayName preservat');
t(updated !== member,                                             'H · immutable');
eq(member.content.ikigai, undefined,                              'H · orig sense canvi');

threw = false;
try { applyIkigaiToMember(null, full); } catch (_) { threw = true; }
t(threw,                                                          'H · null member throws');
threw = false;
try { applyIkigaiToMember(member, null); } catch (_) { threw = true; }
t(threw,                                                          'H · null ikigai throws');

// ─── I · ikigaiBadge ─────────────────────────────────────────────────────
const bEmpty = ikigaiBadge(empty);
eq(bEmpty.level, 'none',                                          'I · empty · none');

const bPartial = ikigaiBadge(partial);
eq(bPartial.level, 'partial',                                     'I · partial · partial');

const bFull = ikigaiBadge(full);
// full té passion (codi) · profession (codi+pedagogia) · 2 intersections
eq(bFull.level, 'growing',                                        'I · 2 intersections · growing');

const bIki = ikigaiBadge(ikiFull);
eq(bIki.level, 'ikigai',                                          'I · ikigai trobat · level ikigai');
eq(bIki.icon, '🌸',                                               'I · icon 🌸');

// Cas amb 3 intersections · almost
let iki3 = buildEmptyIkigai();
iki3 = applyIkigaiDimension(iki3, 'loves',      ['a', 'b', 'c']);
iki3 = applyIkigaiDimension(iki3, 'goodAt',     ['a', 'd']);              // passion: a
iki3 = applyIkigaiDimension(iki3, 'worldNeeds', ['b', 'e']);              // mission: b
iki3 = applyIkigaiDimension(iki3, 'paidFor',    ['d', 'e']);              // profession (goodAt∩paidFor): d, vocation (paidFor∩worldNeeds): e
const bAlmost = ikigaiBadge(iki3);
eq(bAlmost.level, 'almost',                                       'I · 4 intersections · almost (sense ikigai centre)');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
