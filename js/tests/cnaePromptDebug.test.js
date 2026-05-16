// =============================================================================
// TEAMTOWERS SOS V11 — CNAE PICKER + PROMPTS DEBUG · TDD (PR-N)
// Ruta · /js/tests/cnaePromptDebug.test.js
// =============================================================================

import {
    CNAE_CATALOG_VERSION, CNAE_SECTORS, CNAE_GROUPS,
    listCnae, listCnaeByGroup, getCnae, renderCnaeOptionsHtml,
} from '../core/cnaeCatalog.js';
import fs from 'node:fs';

let pass = 0, fail = 0;
function ok(label, cond, expected = '', got = '') {
    if (cond) { pass++; console.log('✓', label); }
    else {
        fail++;
        const detail = (expected !== '' || got !== '') ? ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})` : '';
        console.log('✗', label + detail);
    }
}

console.log('=== CNAE-PICKER + PROMPTS-DEBUG (PR-N) ===\n');

// ─── A · CNAE_SECTORS · 21 codis canònics ──────────────────────────
console.log('— A · CNAE_SECTORS · 21 codis canònics');
ok('A · 21 entries (A-T + UV)', CNAE_SECTORS.length === 21, 21, CNAE_SECTORS.length);
for (const code of ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','UV']) {
    ok('A · CNAE ' + code + ' present', CNAE_SECTORS.some(s => s.code === code));
}
ok('A · cada CNAE té label · group · subhint', CNAE_SECTORS.every(s => s.label && s.group && s.subhint));
ok('A · CNAE J → "Informació i comunicacions · TIC"', getCnae('J').label.includes('TIC'));
ok('A · CNAE F → "Construcció"', getCnae('F').label.includes('Construcció'));
ok('A · CNAE M → "consultoria"', getCnae('M').label.includes('consultoria'));

// ─── B · groups categoritzats ───────────────────────────────────────
console.log('\n— B · agrupacions (optgroups)');
ok('B · 5 grups (primari · secundari · terciari · institucional · creatiu)', CNAE_GROUPS.length === 5);
const byGroup = listCnaeByGroup();
ok('B · grup terciari té ≥7 items', (byGroup.terciari || []).length >= 7);
ok('B · grup institucional inclou educació + sanitat', (byGroup.institucional || []).some(s => s.code === 'P') && (byGroup.institucional || []).some(s => s.code === 'Q'));

// ─── C · renderCnaeOptionsHtml · HTML correcte ────────────────────
console.log('\n— C · renderCnaeOptionsHtml');
const html = renderCnaeOptionsHtml({ selected: 'J' });
ok('C · conté <optgroup>',                html.includes('<optgroup'));
ok('C · 5 optgroups',                     (html.match(/<optgroup/g) || []).length === 5);
ok('C · 21 options de CNAE + 1 empty + 1 other = 23', (html.match(/<option/g) || []).length === 23);
ok('C · selected="J" present',            html.includes('value="J" selected'));
ok('C · empty option per defecte',        html.includes('— Selecciona sector (opcional) —'));
ok('C · option "other" present',          html.includes('Altres · escriu al camp llibre'));
const htmlNoOther = renderCnaeOptionsHtml({ includeOther: false });
ok('C · includeOther:false · no "other"', !htmlNoOther.includes('Altres · escriu'));

// ─── D · ProjectCreationV2View · usa el CNAE picker ─────────────────
console.log('\n— D · ProjectCreationV2View · CNAE picker integrat');
const pcvSrc = fs.readFileSync(new URL('../views/ProjectCreationV2View.js', import.meta.url), 'utf8');
ok('D · importa renderCnaeOptionsHtml',  pcvSrc.includes('renderCnaeOptionsHtml'));
ok('D · select#pcvSector amb CNAE options', pcvSrc.match(/<select id="pcvSector"[\s\S]{0,100}renderCnaeOptionsHtml/));
ok('D · camp lliure pcvSectorFree per "other"', pcvSrc.includes('pcvSectorFree'));
ok('D · binding · si "other" → mostra camp lliure', pcvSrc.includes("'other'") && pcvSrc.includes('free.style.display'));
ok('D · submit · combina sectorSel + sectorFree', pcvSrc.includes('sectorSel === \'other\' ? (sectorFree'));

// ─── E · PromptsDebugView · ruta + view ────────────────────────────
console.log('\n— E · PromptsDebugView · vista de transparència IA');
const pdSrc = fs.readFileSync(new URL('../views/PromptsDebugView.js', import.meta.url), 'utf8');
ok('E · importa TASK_KINDS + buildPrompt + flattenPrompt', pdSrc.includes('TASK_KINDS') && pdSrc.includes('buildPrompt') && pdSrc.includes('flattenPrompt'));
ok('E · importa SECTOR_ROLES per a sector_role_examples', pdSrc.includes('SECTOR_ROLES'));
ok('E · DEFAULT_CTX amb sector M/Q + lifecycle mvp', pdSrc.includes('lifecycle_stage') && pdSrc.includes("'mvp'"));
ok('E · _buildContext segons activeTask',  pdSrc.includes('_buildContext'));
ok('E · _renderPromptPanel · mostra system + few-shot + user', pdSrc.includes('SYSTEM (manifest') && pdSrc.includes('FEW-SHOT') && pdSrc.includes('USER (task-specific'));
ok('E · stats · tokens + chars',           pdSrc.includes('approxTokens') && pdSrc.includes('chars (flat)'));
ok('E · copy-to-clipboard button',         pdSrc.includes('Copia tot el prompt'));

// Router
const routerSrc = fs.readFileSync(new URL('../router.js', import.meta.url), 'utf8');
ok('E · router · ruta /prompts-debug',     routerSrc.includes("'/prompts-debug'") && routerSrc.includes('PromptsDebugView'));

// NavService
const navSrc = fs.readFileSync(new URL('../core/navService.js', import.meta.url), 'utf8');
ok('E · navService · entrada Prompts debug al grup learn', navSrc.includes("'prompts-debug'") && navSrc.includes('Prompts debug'));

// ─── F · _buildContext per cada task · no llança ──────────────────
console.log('\n— F · PromptsDebugView · _buildContext per cada task no llança');
// Carreguem el module + verificiem amb les 8 tasks
const { buildPrompt, listTasks } = await import('../core/vnaExpertPrompts.js');
const sample_ctx = {
    name: 'Coop X', description: 'desc', sector: 'M', entity_type: 'organization',
    project_type: 'founder-coop-tradicional', lifecycle_stage: 'mvp', vna_zoom: 'mid',
    candidates: [{ relpath: 'x', title: 'X' }],
    soc: { title: 'T', purpose: 'p' },
    project_ctx: { description: 'd', sector: 'M', lifecycle_stage: 'mvp', entity_type: 'organization' },
    role_kinds: ['founder'],
    sector_role_examples: [{ kind: 'founder', name: 'Managing Partner', description: 'd' }],
    sop: { id: 's', title: 'SOP', role_ref: 'founder', steps: [] },
    currentTemplate: { roles: [], transactions: [], deliverables: [], sops: [] },
    roleName: 'r', sopTitle: 't', deliverable: 'd',
    sops: [{ id: 's1', role_ref: 'r', title: 't' }],
};
for (const t of listTasks()) {
    let p;
    try { p = buildPrompt({ templateId: 'founder-coop-tradicional', taskKind: t, context: sample_ctx }); }
    catch (e) { p = null; }
    ok('F · buildPrompt(' + t + ') no llança · user no buit', p && p.user && p.user.length > 50);
}

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
