// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT ENTITY WIZARD · TDD (PR3)
// Ruta · /js/tests/projectEntityWizard.test.js
//
// Pure data tests del wizard. No DOM · només input → output del `resolveSuggestion`.
// =============================================================================

import {
    ENTITY_CARDS, FORMATS_BY_ENTITY, WIZARD_VERSION,
    listEntityCards, listFormats, resolveSuggestion,
} from '../core/projectEntityWizard.js';

let pass = 0, fail = 0;
function ok(label, cond, expected = '', got = '') {
    if (cond) { pass++; console.log('✓', label); }
    else {
        fail++;
        const detail = (expected !== '' || got !== '') ? ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})` : '';
        console.log('✗', label + detail);
    }
}

console.log('=== PROJECT-ENTITY-WIZARD · TDD ===\n');

// ─── A · ENTITY_CARDS · 4 entrades canòniques ──────────────────────────
console.log('— A · ENTITY_CARDS · 4 entrades canòniques');
ok('A · ENTITY_CARDS 4 entrades', ENTITY_CARDS.length === 4, 4, ENTITY_CARDS.length);
const ids = ENTITY_CARDS.map(e => e.id);
for (const k of ['organization', 'business', 'sos', 'project_internal']) {
    ok('A · ENTITY_CARDS conté ' + k, ids.includes(k));
}
ok('A · cada card té icon/title/subtitle/examples/description', ENTITY_CARDS.every(c => c.icon && c.title && c.subtitle && Array.isArray(c.examples) && c.description));
ok('A · listEntityCards retorna còpia', listEntityCards().length === 4);

// ─── B · FORMATS_BY_ENTITY · cada entity_type té ≥3 formats ────────────
console.log('\n— B · FORMATS_BY_ENTITY · 1 array per entity_type');
for (const k of ['organization', 'business', 'sos', 'project_internal']) {
    ok('B · ' + k + ' té ≥3 formats', listFormats(k).length >= 3);
    ok('B · ' + k + ' formats tenen {id,title,hint,vna_zoom,ambition}', listFormats(k).every(f => f.id && f.title && f.hint && f.vna_zoom && f.ambition));
}
ok('B · listFormats(invàlid) retorna []', listFormats('invalid').length === 0);

// ─── C · resolveSuggestion · combinació → form pre-fill ────────────────
console.log('\n— C · resolveSuggestion · combinacions ↔ pre-fill');
const sOrgCoop = resolveSuggestion('organization', 'coop');
ok('C · org+coop · entity_type=organization', sOrgCoop?.entity_type === 'organization');
ok('C · org+coop · format=coop', sOrgCoop?.format === 'coop');
ok('C · org+coop · format_title visible',  typeof sOrgCoop?.format_title === 'string' && sOrgCoop.format_title.length > 0);
ok('C · org+coop · vna_zoom canònic', ['macro', 'mid', 'micro'].includes(sOrgCoop?.vna_zoom));
ok('C · org+coop · ambition canònic', ['light', 'standard', 'max'].includes(sOrgCoop?.ambition));
ok('C · org+coop · generationMode canònic', ['template', 'ai-driven'].includes(sOrgCoop?.generationMode));
ok('C · org+coop · descriptionHint string', typeof sOrgCoop?.descriptionHint === 'string' && sOrgCoop.descriptionHint.length > 5);

const sBizSL = resolveSuggestion('business', 'sl');
ok('C · biz+sl · entity_type=business', sBizSL?.entity_type === 'business');
ok('C · biz+sl · format=sl',           sBizSL?.format === 'sl');

const sSosFed = resolveSuggestion('sos', 'sos_federat');
ok('C · sos+federat · ambition=max',      sSosFed?.ambition === 'max');
ok('C · sos+federat · generationMode=ai-driven', sSosFed?.generationMode === 'ai-driven');

const sIntPilot = resolveSuggestion('project_internal', 'pilot');
ok('C · intern+pilot · ambition=light',   sIntPilot?.ambition === 'light');
// PR-J · IA per defecte a tots els ambitions · fallback a template el fa el pre-flight check
ok('C · intern+pilot · generationMode=ai-driven (PR-J · default IA)', sIntPilot?.generationMode === 'ai-driven');

// ─── D · Edge cases ─────────────────────────────────────────────────────
console.log('\n— D · edge cases');
ok('D · entity invàlid → null', resolveSuggestion('xxxx', 'coop') === null);
ok('D · entity null → null', resolveSuggestion(null, null) === null);
const sFallback = resolveSuggestion('organization', 'format-no-existeix');
ok('D · format invàlid → fallback al primer format', sFallback?.format === FORMATS_BY_ENTITY.organization[0].id);

// ─── E · cobertura entity × format · cap suggestion buida ──────────────
console.log('\n— E · cobertura full · entity × format ≥1 suggestion vàlida');
for (const e of Object.keys(FORMATS_BY_ENTITY)) {
    for (const f of FORMATS_BY_ENTITY[e]) {
        const s = resolveSuggestion(e, f.id);
        if (!s || !s.descriptionHint || !s.vna_zoom) {
            fail++;
            console.log('✗ E · ' + e + '/' + f.id + ' incomplet');
        } else {
            pass++;
            console.log('✓ E · ' + e + '/' + f.id + ' → ' + s.ambition + ' · ' + s.vna_zoom + ' · ' + s.generationMode);
        }
    }
}

// ─── F · version exportat ──────────────────────────────────────────────
console.log('\n— F · WIZARD_VERSION');
ok('F · WIZARD_VERSION string', typeof WIZARD_VERSION === 'string' && WIZARD_VERSION.length > 0);

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
