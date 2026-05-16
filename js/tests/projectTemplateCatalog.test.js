// PROJECT-TEMPLATE-CATALOG · tests · 2 templates MVP (founder + default)
// Cada template ha de puntuar ≥85 al valueFlowRubricService SENSE IA.

import {
    CATALOG, TEMPLATE_IDS, pickTemplate, listTemplates, applyContext,
} from '../core/projectTemplateCatalog.js';
import { evaluateRubric } from '../core/valueFlowRubricService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== PROJECT-TEMPLATE-CATALOG ===\n');

// ─── A · estructura del catàleg ───────────────────────────────────────────
t(Array.isArray(TEMPLATE_IDS),                          'A · TEMPLATE_IDS array');
eq(TEMPLATE_IDS.length, 2,                              'A · 2 templates al MVP');
t(TEMPLATE_IDS.includes('founder-coop-tradicional'),    'A · founder-coop-tradicional present');
t(TEMPLATE_IDS.includes('default-balanced'),            'A · default-balanced present');

for (const id of TEMPLATE_IDS) {
    const tpl = CATALOG[id];
    t(tpl && typeof tpl === 'object',                   'A · ' + id + ' té template');
    t(tpl.meta && tpl.meta.id === id,                   'A · ' + id + ' meta.id correcte');
    t(Array.isArray(tpl.roles) && tpl.roles.length >= 3, 'A · ' + id + ' ≥3 roles');
    t(Array.isArray(tpl.transactions) && tpl.transactions.length >= 5, 'A · ' + id + ' ≥5 transactions');
    t(Array.isArray(tpl.deliverables) && tpl.deliverables.length >= 3, 'A · ' + id + ' ≥3 deliverables');
    t(Array.isArray(tpl.sops) && tpl.sops.length >= 3,  'A · ' + id + ' ≥3 SOPs');
    t(Array.isArray(tpl.socs) && tpl.socs.length >= 1,  'A · ' + id + ' ≥1 SOC');
}

// ─── B · pickTemplate · matching ─────────────────────────────────────────
let picked = pickTemplate({ templateId: 'founder-coop-tradicional' });
eq(picked.meta.id, 'founder-coop-tradicional',          'B · templateId explícit');

picked = pickTemplate({ keywords: ['cooperativa', 'cohort'] });
eq(picked.meta.id, 'founder-coop-tradicional',          'B · keywords coop → founder');

picked = pickTemplate({ keywords: ['castellers'] });
eq(picked.meta.id, 'founder-coop-tradicional',          'B · keyword castellers');

picked = pickTemplate({ keywords: ['restaurant', 'menjar'] });
eq(picked.meta.id, 'default-balanced',                  'B · keywords inesperades → default');

picked = pickTemplate({});
eq(picked.meta.id, 'default-balanced',                  'B · cap input → default');

picked = pickTemplate({ templateId: 'inexistent' });
eq(picked.meta.id, 'default-balanced',                  'B · templateId invàlid → default');

// ─── C · listTemplates · UI selector ─────────────────────────────────────
const list = listTemplates();
eq(list.length, 2,                                      'C · 2 templates al llistat');
t(list.every(x => x.id && x.label && x.description),   'C · cada item ben format');

// ─── D · applyContext · placeholder substitution ─────────────────────────
const ctx = { name: 'Castellers Bcn', sector: 'cultura', problem: 'connectar colles' };
const founderCtx = applyContext(CATALOG['founder-coop-tradicional'], ctx);

// {{name}} reemplaçat
t(founderCtx.roles[0].description.includes('Castellers Bcn'), 'D · {{name}} reemplaçat als roles');
t(founderCtx.pitch.headline.includes('cultura'),       'D · {{sector}} al pitch');
t(founderCtx.pitch.problem.includes('connectar colles'),'D · {{problem}} al pitch');

// {{name_slug}} reemplaçat als IDs dels SOCs
t(founderCtx.socs[0].id.includes('castellers-bcn'),    'D · {{name_slug}} slug-safe als IDs SOC');
t(!founderCtx.roles[0].description.includes('{{'),     'D · cap placeholder restant als roles');

// Test diacrítics
const ctxAccents = { name: 'Càrrec amb accents é í ó ç' };
const founderAcc = applyContext(CATALOG['founder-coop-tradicional'], ctxAccents);
t(/^[a-z0-9-]+$/.test(founderAcc.socs[0].id.replace(/^soc-/, '')), 'D · diacrítics normalitzats');

// ─── E · cada template puntua ≥85 al rubric (diana fonamental) ───────────
for (const id of TEMPLATE_IDS) {
    const personalized = applyContext(CATALOG[id], { name: 'Test Project', sector: 'test', problem: 'test' });
    const evalResult = evaluateRubric({
        roles:        personalized.roles,
        deliverables: personalized.deliverables,
        transactions: personalized.transactions,
        sops:         personalized.sops,
        socs:         personalized.socs,
    });
    t(evalResult.total >= 85, 'E · ' + id + ' rubric score ≥85 · obtingut ' + evalResult.total + '/100 (status ' + evalResult.status + ')');
    eq(evalResult.status, 'gold', 'E · ' + id + ' status gold');
}

// ─── F · isolation · cap mutation del template original ──────────────────
const original = CATALOG['founder-coop-tradicional'];
const personalized = applyContext(original, { name: 'X' });
t(original.roles[0].description.includes('{{name}}'),  'F · template original NO mutated · placeholders intactes');
t(!personalized.roles[0].description.includes('{{name}}'), 'F · output personalitzat sí substituït');

// ─── G · null/undefined safety ───────────────────────────────────────────
const safeResult = applyContext(null, { name: 'X' });
eq(safeResult, null,                                    'G · applyContext(null) → null');

const noCtx = applyContext(CATALOG['default-balanced']);
t(noCtx.roles.length > 0,                               'G · applyContext sense context · usa defaults');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
