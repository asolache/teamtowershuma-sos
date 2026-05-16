// TeamTowers seed real · activa els 8 SOCs canònics del knowledge

import { buildTeamtowersSeed, TT_SOCS, TT_SEED_VERSION } from '../core/projectTeamtowersSeed.js';
import { evaluateRubric, fromProject } from '../core/valueFlowRubricService.js';
import { validateIntegrity } from '../core/valueFlowIntegrityService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== TeamTowers seed real ===\n');

// ─── A · constants ────────────────────────────────────────────────────────
eq(TT_SEED_VERSION, 'v1.0',                              'A · version v1.0');
eq(TT_SOCS.length, 8,                                    'A · 8 SOCs canònics TeamTowers');
const requiredSocs = ['soc-teamtowers-brand', 'soc-vna-network', 'soc-fent-pinya',
    'soc-castellers-demo', 'soc-la-colla', 'soc-teamtowers-merchandising',
    'soc-proyecto-custom', 'soc-charla-conferencia'];
for (const id of requiredSocs) {
    t(TT_SOCS.some(s => s.id === id),                   'A · SOC ' + id + ' present');
}

// ─── B · buildTeamtowersSeed · shape ─────────────────────────────────────
const result = buildTeamtowersSeed({ ts: 1000 });
t(result.project && result.project.id,                   'B · project amb id');
eq(result.project.type, 'project',                       'B · type project');
eq(result.project.templateId, 'teamtowers-real',         'B · templateId teamtowers-real');
eq(result.project.sector_id, 'N',                        'B · sector N · consultoria');
eq(result.project.ambition, 'max',                       'B · ambition max');
t(result.project.soc_refs && result.project.soc_refs.length === 8, 'B · project.soc_refs amb els 8 SOCs');

// ─── C · roles · 6 amb castell_level diversificats ──────────────────────
eq(result.roles.length, 6,                               'C · 6 rols TeamTowers');
const levels = new Set(result.roles.map(r => r.content.castell_level));
t(levels.size >= 4,                                      'C · ≥4 nivells casteller diversificats');
t(levels.has('pom_de_dalt'),                             'C · pom_de_dalt (visioner)');
t(levels.has('baixos'),                                  'C · baixos (founder_anchor)');

// ─── D · 7 transactions amb Lean metrics ────────────────────────────────
eq(result.transactions.length, 7,                        'D · 7 transactions');
t(result.transactions.every(tx => typeof tx.lead_time_hours === 'number'), 'D · totes amb lead_time');
t(result.transactions.every(tx => typeof tx.cycle_time_hours === 'number'), 'D · totes amb cycle_time');
const tangibles = result.transactions.filter(tx => tx.type === 'tangible');
const intangibles = result.transactions.filter(tx => tx.type === 'intangible');
t(tangibles.length >= 1 && intangibles.length >= 1,      'D · mix tangible+intangible');

// ─── E · 4 SOPs amb steps estructurats ──────────────────────────────────
eq(result.sops.length, 4,                                'E · 4 SOPs');
for (const sop of result.sops) {
    const steps = sop.content.steps || [];
    t(steps.length >= 3,                                 'E · SOP ' + sop.id + ' · ≥3 steps');
    t(steps.every(s => s.deliverable_kind && s.approval_rule), 'E · SOP ' + sop.id + ' · steps amb fields');
}

// ─── F · SOC arrel amb checklist cobrint tots els SOPs ───────────────────
eq(result.socs.length, 1,                                'F · 1 SOC arrel TT');
const checklistSocs = result.socs[0].content.checklist || [];
eq(checklistSocs.length, 4,                              'F · 4 items checklist · 1 per SOP');
t(checklistSocs.every(i => i.sop_ref),                   'F · cada item té sop_ref');
// External SOC refs (els 8 del knowledge)
t(Array.isArray(result.socs[0].content.external_socs_refs), 'F · external_socs_refs present');
eq(result.socs[0].content.external_socs_refs.length, 8,  'F · 8 SOCs externs referenciats');

// ─── G · canvas + pitch amb valors castellers reals ─────────────────────
t(result.canvas.values.some(v => /pinya|castell|seny|força|acotxador/i.test(v)),
                                                         'G · canvas values · referència castellera');
t(result.pitch.problem.includes('jerarqu') || result.pitch.problem.includes('silos'),
                                                         'G · pitch problem clar');
t(result.pitch.headline.includes('TeamTowers'),          'G · pitch headline TeamTowers');

// ─── H · rubric ≥85 sense IA (validació del seed real) ──────────────────
const input = fromProject(result.project, { sops: result.sops, socs: result.socs, roles: result.roles });
const rubric = evaluateRubric(input);
t(rubric.total >= 85,                                    'H · rubric ≥85 (got ' + rubric.total + ')');
eq(rubric.status, 'gold',                                'H · status gold');

// ─── I · integrity 0 errors ─────────────────────────────────────────────
const intg = validateIntegrity({
    valueFlow: { roles: input.roles, deliverables: input.deliverables, transactions: input.transactions },
    sops: input.sops, socs: input.socs,
});
eq(intg.errorCount, 0,                                   'I · 0 errors integrity');
t(intg.ok,                                               'I · integrity.ok=true');

// ─── J · stats ───────────────────────────────────────────────────────────
const stats = result.stats;
eq(stats.roleCount, 6,                                   'J · stats.roleCount 6');
eq(stats.sopCount, 4,                                    'J · stats.sopCount 4');
eq(stats.externalSocsRefs, 8,                            'J · 8 SOCs externs referenciats');

// ─── K · id stable per timestamp ────────────────────────────────────────
const r1 = buildTeamtowersSeed({ ts: 5000 });
const r2 = buildTeamtowersSeed({ ts: 5000 });
eq(r1.project.id, r2.project.id,                         'K · id estable amb mateix ts');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
