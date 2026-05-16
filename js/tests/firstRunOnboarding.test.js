// UX-LEGENDARY · firstRunOnboarding tests
import {
    hasSeenOnboarding, resetOnboarding,
    SLIDES, MODAL_ID, LS_KEY,
} from '../core/firstRunOnboarding.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== UX-LEGENDARY · firstRunOnboarding ===\n');

// Constants
t(typeof MODAL_ID === 'string',                          'A · MODAL_ID exported');
t(typeof LS_KEY === 'string' && LS_KEY.startsWith('sos_'), 'A · LS_KEY semantic');

// SLIDES · 4 slides · cada un amb shape complet
eq(SLIDES.length, 4,                                     'A · 4 slides');
for (const s of SLIDES) {
    t(s.icon && s.title && s.body && s.accent,           'A · slide complet · ' + s.title);
    t(s.title.length <= 60,                              'A · slide title concís · ' + s.title);
    t(s.body.length <= 220,                              'A · slide body succint');
}

// hasSeenOnboarding · safe en Node (no localStorage)
const seen = hasSeenOnboarding();
eq(typeof seen, 'boolean',                               'B · hasSeenOnboarding retorna boolean');

// resetOnboarding · safe en Node · no throw
let didThrow = false;
try { resetOnboarding(); } catch (e) { didThrow = true; }
eq(didThrow, false,                                      'B · resetOnboarding safe');

// Module shape
import * as onb from '../core/firstRunOnboarding.js';
t(typeof onb.open === 'function',                        'C · open exported');
t(typeof onb.maybeShow === 'function',                   'C · maybeShow exported');
t(typeof onb.hasSeenOnboarding === 'function',           'C · hasSeenOnboarding exported');
t(typeof onb.resetOnboarding === 'function',             'C · resetOnboarding exported');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
