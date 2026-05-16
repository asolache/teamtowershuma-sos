// ROLES-CASTELLER-CATEGORIZATION-001 · tests del model casteller integrat
// a vnaExpertPrompts + helpers d'inspecció / suggeriment.

import {
    SYSTEM_BASE, FEW_SHOT_EXAMPLES, CASTELLER_LEVELS,
    validateCastellLevel, suggestCastellLevel, buildPrompt,
} from '../core/vnaExpertPrompts.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== ROLES-CASTELLER-CATEGORIZATION ===\n');

// ─── A · CASTELLER_LEVELS · 6 nivells canònics ───────────────────────────
t(Array.isArray(CASTELLER_LEVELS),                       'A · CASTELLER_LEVELS array');
eq(CASTELLER_LEVELS.length, 6,                           'A · 6 nivells canònics');
const expected = ['pom_de_dalt', 'tronc', 'pinya', 'laterals', 'mans', 'baixos'];
for (const id of expected) {
    t(CASTELLER_LEVELS.some(l => l.id === id),           'A · level ' + id + ' present');
}
// Cap nivell sense kinds tipics
for (const l of CASTELLER_LEVELS) {
    t(Array.isArray(l.typical_kinds) && l.typical_kinds.length > 0, 'A · ' + l.id + ' té typical_kinds');
    t(l.description && l.position,                       'A · ' + l.id + ' té description + position');
}

// ─── B · SYSTEM_BASE conté model casteller ──────────────────────────────
t(SYSTEM_BASE.includes('Model casteller'),               'B · SYSTEM_BASE menció explícita "Model casteller"');
for (const id of expected) {
    t(SYSTEM_BASE.includes(id),                          'B · SYSTEM_BASE menciona ' + id);
}
t(SYSTEM_BASE.includes('castell_level diversificats'),  'B · regla diversificació al SYSTEM_BASE');
t(SYSTEM_BASE.includes('SEMPRE té camp castell_level'), 'B · contracte sortida · castell_level obligatori');

// ─── C · validateCastellLevel · whitelist estricta ──────────────────────
t(validateCastellLevel('pom_de_dalt'),                   'C · pom_de_dalt vàlid');
t(validateCastellLevel('tronc'),                         'C · tronc vàlid');
t(validateCastellLevel('baixos'),                        'C · baixos vàlid');
t(!validateCastellLevel('invent'),                       'C · invent invàlid');
t(!validateCastellLevel(null),                           'C · null invàlid');
t(!validateCastellLevel(''),                             'C · empty invàlid');
t(!validateCastellLevel('POM_DE_DALT'),                  'C · case-sensitive · rebuig majúscules');

// ─── D · suggestCastellLevel · heurístic kind → level ──────────────────
eq(suggestCastellLevel('visioner'), 'pom_de_dalt',       'D · visioner → pom_de_dalt');
eq(suggestCastellLevel('architect'), 'tronc',            'D · architect → tronc');
eq(suggestCastellLevel('cohort_manager'), 'pinya',       'D · cohort_manager → pinya');
eq(suggestCastellLevel('reviewer'), 'laterals',          'D · reviewer → laterals');
eq(suggestCastellLevel('facilitator'), 'mans',           'D · facilitator → mans');
eq(suggestCastellLevel('founder_anchor'), 'pom_de_dalt', 'D · founder_anchor matches founder → pom_de_dalt (prim. match)');
eq(suggestCastellLevel('unknown-kind'), 'pinya',         'D · unknown → pinya (default fallback)');
eq(suggestCastellLevel(null), 'pinya',                   'D · null → pinya (safe)');

// ─── E · few-shot examples · tots els rols tenen castell_level vàlid ───
for (const [templateId, ex] of Object.entries(FEW_SHOT_EXAMPLES)) {
    const parsed = JSON.parse(ex.assistantOutput);
    for (const r of parsed.roles) {
        t(validateCastellLevel(r.castell_level),         'E · ' + templateId + ' · role "' + r.id + '" castell_level vàlid (' + r.castell_level + ')');
    }
    // diversitat · ≥2 nivells distints
    const uniqueLevels = new Set(parsed.roles.map(r => r.castell_level));
    t(uniqueLevels.size >= 2,                            'E · ' + templateId + ' · ≥2 levels distints (' + uniqueLevels.size + ')');
}

// ─── F · buildPrompt encara funciona post-extensió ─────────────────────
{
    const p = buildPrompt({ templateId: 'founder-coop-tradicional', taskKind: 'enrich-value-map', context: { name: 'X', description: 'y' } });
    t(p.system.includes('Model casteller'),              'F · prompt system inclou model casteller');
    t(p.system.includes('pom_de_dalt'),                  'F · prompt menciona pom_de_dalt');
    t(p.approxTokens < 3000,                             'F · token budget · still <3000 (got ' + p.approxTokens + ')');
}

// ─── G · contracte estable · cap mutació accidental ─────────────────────
t(Object.isFrozen(CASTELLER_LEVELS),                     'G · CASTELLER_LEVELS frozen');
let mutated = false;
try { CASTELLER_LEVELS.push({ id: 'hack' }); } catch (_) { mutated = false; }
eq(CASTELLER_LEVELS.length, 6,                           'G · push no afecta (frozen)');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
