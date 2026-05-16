// =============================================================================
// sosCopy.test.js · DESIGN-SYSTEM sprint A · DRY copy lookup tests
// =============================================================================

import {
    label, labelOr, labelN, hasLabel, listLabels,
    applyToNavDestinations, TOKENS,
} from '../core/sosCopy.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

// ─── A · label lookup ────────────────────────────────────────────────────
eq(label('nav.dashboard'), 'Projectes',                           'A · nav.dashboard');
eq(label('cta.save'), 'Desar',                                    'A · cta.save');
eq(label('state.loading'), 'Carregant…',                          'A · state.loading');
eq(label('state.thinking'), 'Pensant…',                           'A · thinking');
eq(label('cta.generate'), 'Generar amb IA',                       'A · generate');

// Unknown key · retorna key (sense fallback)
eq(label('unknown.key'), 'unknown.key',                           'A · unknown · returns key');

// Unknown key amb fallback
eq(label('unknown.key', 'Custom Text'), 'Custom Text',            'A · fallback usat si unknown');

// Empty string
eq(label(''), '',                                                 'A · empty string · returns empty');

// ─── B · labelOr alias ───────────────────────────────────────────────────
eq(labelOr('cta.save'), 'Desar',                                  'B · labelOr same as label');
eq(labelOr('x', 'fallback'), 'fallback',                          'B · labelOr fallback');

// ─── C · labelN · {n} substitution ───────────────────────────────────────
eq(labelN('hint.min_chars', 30), 'Mínim 30 caràcters',            'C · min chars 30');
eq(labelN('hint.max_chars', 280), 'Màxim 280 caràcters',          'C · max 280');
eq(labelN('err.too_short', 10), 'Massa curt · mínim 10',          'C · too short');

// Unknown amb fallback amb {n}
eq(labelN('unknown.x', 5, 'Need {n} items'), 'Need 5 items',      'C · fallback amb {n}');

// Sense {n} al template · queda igual
eq(labelN('cta.save', 7), 'Desar',                                'C · key sense {n}');

// ─── D · hasLabel ────────────────────────────────────────────────────────
t(hasLabel('nav.market'),                                         'D · hasLabel nav.market true');
t(!hasLabel('nav.nonexistent'),                                   'D · unknown · false');
t(!hasLabel(''),                                                  'D · empty · false');

// ─── E · listLabels ──────────────────────────────────────────────────────
const all = listLabels();
t(all.length >= 60,                                               'E · ≥60 labels (DRY · single source · ample)');
t(all.includes('nav.dashboard'),                                  'E · contains nav.dashboard');
t(all.includes('cta.save'),                                       'E · contains cta.save');
t(all.includes('state.thinking'),                                 'E · contains state.thinking');

// All keys lowercase + dot-namespaced
const malformed = all.filter(k => !/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/.test(k));
eq(malformed.length, 0,                                           'E · zero malformed keys (lowercase·dot·single·level)');

// ─── F · applyToNavDestinations · pure transform ─────────────────────────
const destinations = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
    { id: 'market',    label: 'Mercado',   href: '/market' },
    { id: 'unknown',   label: 'Unknown',   href: '/unknown' },
];
const updated = applyToNavDestinations(destinations);
eq(updated.length, 3,                                             'F · same length');
eq(updated[0].label, 'Projectes',                                 'F · dashboard → Projectes');
eq(updated[1].label, 'Mercat',                                    'F · market → Mercat');
eq(updated[2].label, 'Unknown',                                   'F · unknown · preserva original');
// Immutable
eq(destinations[0].label, 'Dashboard',                            'F · immutable · orig sense canvi');

// Empty/null safe
eq(applyToNavDestinations([]).length, 0,                          'F · empty array');
eq(applyToNavDestinations(null).length, 0,                        'F · null safe');

// ─── G · TOKENS · constants present ──────────────────────────────────────
t(typeof TOKENS.colors.primary === 'string',                      'G · TOKENS.colors.primary');
t(typeof TOKENS.colors.success === 'string',                      'G · success');
t(typeof TOKENS.colors.ikigai === 'string',                       'G · ikigai color present');
t(typeof TOKENS.radii.pill === 'string',                          'G · radii.pill');
t(typeof TOKENS.spacing.lg === 'string',                          'G · spacing.lg');

// ─── H · coverage · key categories ───────────────────────────────────────
const categories = ['nav.', 'cta.', 'state.', 'hint.', 'err.', 'help.', 'group.', 'empty.'];
for (const cat of categories) {
    const count = all.filter(k => k.startsWith(cat)).length;
    t(count >= 3,                                                 'H · category ' + cat + ' has ≥3 keys (' + count + ')');
}

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
