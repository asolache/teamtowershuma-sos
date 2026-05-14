// MKT-003 sprint A · tests stand-alone per conventionalRangesService.
// Ús: node js/tests/conventionalRanges.test.js

import {
    loadConventionalRanges, saveConventionalRanges, validateRangesShape,
    CONVENTIONAL_RANGES_CONFIG_ID, CONVENTIONAL_RANGES_TYPE,
} from '../core/conventionalRangesService.js';
import { DEFAULT_CONVENTIONAL_RANGES } from '../core/marketService.js';

let pass = 0, fail = 0;
function t(cond, msg) { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } }
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== MKT-003 · conventionalRangesService ===\n');

// A · constants
eq(CONVENTIONAL_RANGES_CONFIG_ID, 'conventional-ranges',         'A · config id constant');
eq(CONVENTIONAL_RANGES_TYPE,      'config',                       'A · type constant');

// B · loadConventionalRanges · sense kb · fallback default
const noKb = await loadConventionalRanges({});
eq(noKb.source, 'default-fallback-no-kb',                         'B · sense kb · fallback');
t(noKb.ranges === DEFAULT_CONVENTIONAL_RANGES,                    'B · sense kb · ranges = DEFAULT');

// C · loadConventionalRanges · kb sense node · fallback default
const emptyKb = { query: async () => [] };
const empty = await loadConventionalRanges({ kb: emptyKb });
eq(empty.source, 'default-fallback-no-config',                    'C · KB buit · fallback');
t(empty.ranges === DEFAULT_CONVENTIONAL_RANGES,                   'C · KB buit · ranges = DEFAULT');

// D · loadConventionalRanges · kb amb node · usa el del KB
const customRanges = {
    notaria: { lowEur: 500, highEur: 1500, label: 'Notaria · custom' },
    contable: { lowEur: 60, highEur: 200, label: 'Contable · custom', unit: '€/mes' },
};
const cfgKb = {
    query: async ({ type }) => type === 'config' ? [
        { id: CONVENTIONAL_RANGES_CONFIG_ID, type: 'config', content: { ranges: customRanges }, updatedAt: 1234567890 },
    ] : [],
};
const fromKb = await loadConventionalRanges({ kb: cfgKb });
eq(fromKb.source,                       'kb-config',              'D · KB amb config · source=kb-config');
eq(fromKb.ranges.notaria.lowEur,        500,                      'D · custom notaria low override');
eq(fromKb.ranges.contable.lowEur,       60,                       'D · custom contable low override');
// Defaults preservats per categories no overridden
t(fromKb.ranges.pm && fromKb.ranges.pm.lowEur === DEFAULT_CONVENTIONAL_RANGES.pm.lowEur,
                                                                  'D · pm preservat dels defaults');
eq(fromKb.updatedAt, 1234567890,                                   'D · updatedAt propagat');

// E · loadConventionalRanges · query throws · fallback
const failKb = { query: async () => { throw new Error('KB down'); } };
const failed = await loadConventionalRanges({ kb: failKb });
eq(failed.source, 'default-fallback-query-failed',                'E · query failed · fallback');

// F · saveConventionalRanges · upsert correct
const upserts = [];
const writeKb = { upsert: async (n) => { upserts.push(n); return n; } };
const saved = await saveConventionalRanges({ kb: writeKb, ranges: customRanges });
eq(upserts.length, 1,                                              'F · 1 upsert call');
eq(upserts[0].id,   CONVENTIONAL_RANGES_CONFIG_ID,                 'F · id correcte');
eq(upserts[0].type, 'config',                                       'F · type correcte');
t(upserts[0].content && upserts[0].content.ranges === customRanges,'F · ranges al content');

// G · saveConventionalRanges · validació · negatius
let threw = null;
try { await saveConventionalRanges({ kb: writeKb, ranges: { x: { lowEur: -1, highEur: 10, label: 'x' } } }); }
catch (e) { threw = e; }
t(threw && /negatius/.test(threw.message),                        'G · valor negatiu · throw');

// G2 · low > high
threw = null;
try { await saveConventionalRanges({ kb: writeKb, ranges: { x: { lowEur: 100, highEur: 50, label: 'x' } } }); }
catch (e) { threw = e; }
t(threw && /lowEur > highEur/.test(threw.message),                'G2 · low > high · throw');

// G3 · missing kb
threw = null;
try { await saveConventionalRanges({ ranges: customRanges }); }
catch (e) { threw = e; }
t(threw && /requires kb/.test(threw.message),                     'G3 · sense kb · throw');

// H · validateRangesShape · pure · returns errors no-throw
const validOk = validateRangesShape({ x: { lowEur: 10, highEur: 50, label: 'X' } });
t(validOk.ok && validOk.errors.length === 0,                      'H · valid · ok=true');

const validBad = validateRangesShape({
    a: { lowEur: -5, highEur: 10, label: 'A' },
    b: { lowEur: 100, highEur: 50, label: 'B' },
    c: { lowEur: 10 },                            // missing highEur
});
t(!validBad.ok,                                                    'H · invalid · ok=false');
t(validBad.errors.length >= 3,                                     'H · invalid · ≥3 errors');

// H2 · validate · null/non-object
const validNull = validateRangesShape(null);
t(!validNull.ok && validNull.errors.length > 0,                    'H2 · null · errors');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
