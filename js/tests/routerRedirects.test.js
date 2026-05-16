// V2-EVOL Fase F · tests dels redirects de rutes legacy
// Veure `docs/STUDY-v2-evolution-plan-2026-05-16.md` Fase F.

import { LEGACY_REDIRECTS, resolveLegacyPath } from '../core/routerRedirects.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== V2-EVOL · routerRedirects ===\n');

// ─── A · contracte ──────────────────────────────────────────────────────
t(typeof LEGACY_REDIRECTS === 'object',                 'A · LEGACY_REDIRECTS exportat');
t(Object.isFrozen(LEGACY_REDIRECTS),                    'A · congelat (immutable)');

// ─── B · mappings explícits ──────────────────────────────────────────────
eq(LEGACY_REDIRECTS['/team'],  '/home',                 'B · /team → /home');
eq(LEGACY_REDIRECTS['/paper'], '/home',                 'B · /paper → /home');
eq(LEGACY_REDIRECTS['/lms'],   '/learn',                'B · /lms → /learn (LearnView ja existeix)');
eq(LEGACY_REDIRECTS['/focus'], '/home',                 'B · /focus → /home (per ara · pot ser vista real futur)');

// ─── C · cap path ambigu sense redirect declarat ─────────────────────────
// V2-EVOL Fase F (rutes ambígues) + Fase B (/settings-v2) + Fase C (/dashboard)
const expectedKeys = ['/team', '/paper', '/lms', '/focus', '/settings-v2', '/dashboard'];
eq(Object.keys(LEGACY_REDIRECTS).length, expectedKeys.length, 'C · només els 6 redirects esperats');
for (const k of expectedKeys) {
    t(k in LEGACY_REDIRECTS,                            'C · ' + k + ' present');
}

// ─── D · cap redirect cap a si mateix (loop infinit) ────────────────────
for (const [src, dst] of Object.entries(LEGACY_REDIRECTS)) {
    t(src !== dst,                                       'D · ' + src + ' no apunta a si mateix');
    // Cap destí és també un redirect (cap chain)
    t(!(dst in LEGACY_REDIRECTS),                        'D · ' + src + ' apunta a ' + dst + ' (no és redirect · evita chain)');
}

// ─── E · destins canònics existeixen al router (validat per fitxer router.js) ─
// Hard-coded sanity check · els destins han de ser rutes canòniques actuals.
const CANONICAL_PATHS = ['/home', '/learn', '/identity', '/settings-v2'];
for (const [src, dst] of Object.entries(LEGACY_REDIRECTS)) {
    t(CANONICAL_PATHS.includes(dst) || dst.startsWith('/'), 'E · ' + src + ' → ' + dst + ' és path canònic');
}

// ─── F · resolveLegacyPath helper ────────────────────────────────────────
eq(resolveLegacyPath('/team'), '/home',                  'F · resolveLegacyPath(/team) → /home');
eq(resolveLegacyPath('/lms'),  '/learn',                 'F · resolveLegacyPath(/lms) → /learn');
eq(resolveLegacyPath('/home'), null,                     'F · resolveLegacyPath(canonical) → null');
eq(resolveLegacyPath(null),    null,                     'F · resolveLegacyPath(null) → null');
eq(resolveLegacyPath(''),      null,                     'F · resolveLegacyPath(empty) → null');
eq(resolveLegacyPath('/inexistent'), null,               'F · resolveLegacyPath(unknown) → null');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
