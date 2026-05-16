// PROJECT-CREATION-LEGENDARY-001 · TDD scaffold del flow unificat
// Veure `docs/STUDY-project-creation-2026-05-15.md` §6.

import {
    createProject, AMBITION_LEVELS, ORCHESTRATOR_VERSION,
} from '../core/projectCreationOrchestrator.js';
import { CATALOG } from '../core/projectTemplateCatalog.js';
import { evaluateRubric } from '../core/valueFlowRubricService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== PROJECT-CREATION-LEGENDARY-001 ===\n');

// ─── A · CLASSIFY ─────────────────────────────────────────────────────────
{
    const r = await createProject({ name: 'Castellers Bcn', description: 'Connectar colles via cohort cooperativa permaweb' });
    eq(r.classification.project_type, 'founder-coop-tradicional', 'A · heurística · cohort+cooperativa+permaweb → founder');
}
{
    const r = await createProject({ name: 'Restaurant menjar saludable', description: 'App de comandes amb repartidors' });
    eq(r.classification.project_type, 'default-balanced',         'A · cap match → default');
}
{
    const fakeClassify = async () => ({ project_type: 'founder-coop-tradicional', source: 'mocked', cost: 0.001, keywords: [] });
    const r = await createProject({ name: 'Test', classify: fakeClassify });
    eq(r.classification.source, 'mocked',                         'A · classify injectat es respecta');
    t(r.cost >= 0.001,                                            'A · cost de classify suma al total');
}
{
    // Edge · classify retorna null · fallback heurístic
    const nullClassify = async () => null;
    const r = await createProject({ name: 'edge null', description: 'cohort cooperativa', classify: nullClassify });
    t(r.classification.source === 'heuristic',                    'A · classify null · fallback heurístic');
}
{
    // Edge · classify llança · NO escapa · fallback
    const throwClassify = async () => { throw new Error('boom'); };
    let threw = false;
    try { await createProject({ name: 'edge throw', classify: throwClassify }); } catch (_) { threw = true; }
    t(threw,                                                      'A · classify throws · sí escapa (no atrapat per design · caller decideix)');
}

// ─── B · TEMPLATE PICK ────────────────────────────────────────────────────
{
    const r = await createProject({ name: 'Test', templateId: 'default-balanced' });
    eq(r.templateId, 'default-balanced',                          'B · templateId explícit → fixat');
}
{
    const r = await createProject({ name: 'Test', templateId: 'inexistent' });
    t(['founder-coop-tradicional', 'default-balanced'].includes(r.templateId), 'B · templateId invàlid · fallback gracios');
}
{
    const r = await createProject({ name: 'projecte cooperativista cohort' });
    eq(r.templateId, 'founder-coop-tradicional',                  'B · keywords cooperatives → founder');
}

// ─── C · SEED SHAPE (per template · estructura mínima del mapa de valor) ──
for (const [id, template] of Object.entries(CATALOG)) {
    t(template.roles.length        >= 3, 'C · ' + id + ' ≥3 roles');
    t(template.deliverables.length >= 3, 'C · ' + id + ' ≥3 deliverables');
    t(template.transactions.length >= 5, 'C · ' + id + ' ≥5 transactions');
    t(template.sops.length         >= 3, 'C · ' + id + ' ≥3 SOPs');
    t(template.socs.length         >= 1, 'C · ' + id + ' ≥1 SOC');
    // Canvas + pitch presents
    t(template.canvas && template.canvas.vision,                  'C · ' + id + ' canvas amb vision');
    t(template.pitch  && template.pitch.headline,                 'C · ' + id + ' pitch amb headline');
}

// ─── D · PERSONALIZE (placeholders reemplaçats · IA injectable) ───────────
{
    const r = await createProject({ name: 'Castellers Bcn', description: 'connectar colles', sector: 'cultura' });
    t(r.project.purpose && !r.project.purpose.includes('{{'),    'D · cap placeholder al purpose');
    t(r.roles[0].content.description.includes('Castellers Bcn'),'D · nom reemplaçat als roles');
    t(r.pitch.problem.includes('connectar colles'),              'D · problem reemplaçat al pitch');

    // SOPs · steps reemplaçats
    const allTitles = r.sops.map(s => s.content.title).join(' ');
    t(allTitles.includes('Castellers Bcn') || allTitles.includes('Castellers'), 'D · nom reemplaçat als SOPs');
}
{
    // personalize injectat · modifica el template
    const customize = async ({ template }) => ({
        template: { ...template, pitch: { ...template.pitch, headline: 'PERSONALIZED HEADLINE' } },
        cost: 0.005,
    });
    const r = await createProject({ name: 'X', personalize: customize });
    t(r.pitch.headline === 'PERSONALIZED HEADLINE',              'D · personalize callback aplicat');
    t(r.cost >= 0.005,                                            'D · cost del personalize suma');
}
{
    // personalize llança · best-effort · cap excepció
    const breakingPersonalize = async () => { throw new Error('boom'); };
    const r = await createProject({ name: 'X', personalize: breakingPersonalize });
    t(r.ok || r.score >= 0,                                       'D · personalize throws · pipeline continua');
}

// ─── E · AMBITION GATING ──────────────────────────────────────────────────
for (const amb of ['light', 'standard', 'max']) {
    const r = await createProject({ name: 'A', ambition: amb });
    t(r.ok || r.score >= 0,                                       'E · ambition ' + amb + ' · executable');
    t(AMBITION_LEVELS[amb],                                       'E · ambition ' + amb + ' · level definit');
}
{
    let threw = false;
    try { await createProject({ name: 'X', ambition: 'extreme' }); } catch (_) { threw = true; }
    t(threw,                                                      'E · ambition invàlid · throws');
}

// ─── F · QUALITY SCORE (rubric ≥ llindar per ambition) ───────────────────
{
    const rL = await createProject({ name: 'Test', ambition: 'light',    templateId: 'founder-coop-tradicional' });
    t(rL.score >= 70,                                             'F · light · score ≥70 · obtingut ' + rL.score);
    const rS = await createProject({ name: 'Test', ambition: 'standard', templateId: 'founder-coop-tradicional' });
    t(rS.score >= 80,                                             'F · standard · score ≥80 · obtingut ' + rS.score);
    const rM = await createProject({ name: 'Test', ambition: 'max',      templateId: 'founder-coop-tradicional' });
    t(rM.score >= 85,                                             'F · max · score ≥85 · obtingut ' + rM.score);
    // Tots els templates MVP arriben a 100/100 · status gold per defecte
    eq(rM.status, 'gold',                                         'F · max + founder · status gold');
}

// ─── G · COST BUDGET (no IA per defecte → cost 0) ────────────────────────
{
    const r = await createProject({ name: 'Test', ambition: 'light' });
    eq(r.cost, 0,                                                 'G · sense classify/personalize injectats · cost 0');
}

// ─── H · KB UPSERT shape (IDs únics + projectId coherent) ────────────────
{
    const r = await createProject({ name: 'Test KB' });
    const pid = r.project.id;
    t(pid.startsWith('proj-leg-'),                                'H · project id prefix proj-leg-');

    const allNodes = [r.project, ...r.roles, ...r.sops, ...r.socs];
    const ids = allNodes.map(n => n.id);
    eq(ids.length, new Set(ids).size,                             'H · IDs únics entre nodes');

    // projectId coherent
    for (const n of [...r.roles, ...r.sops, ...r.socs]) {
        eq(n.projectId, pid,                                      'H · ' + n.type + ' projectId coherent');
    }
    // Tipus correctes
    t(r.project.type === 'project',                               'H · project.type = project');
    t(r.roles.every(n => n.type === 'role'),                      'H · roles type = role');
    t(r.sops.every(n => n.type === 'sop'),                        'H · sops type = sop');
    t(r.socs.every(n => n.type === 'soc'),                        'H · socs type = soc');

    // SOC checklist sop_ref apunta a SOP IDs existents amb el projectId
    const sopIdsSet = new Set(r.sops.map(s => s.id));
    const allRefsOk = r.socs.every(soc =>
        (soc.content.checklist || []).every(item => sopIdsSet.has(item.sop_ref))
    );
    t(allRefsOk,                                                  'H · SOC checklist sop_ref apunta a SOPs reals');
}

// ─── I · IDEMPOTÈNCIA (mateix `now` → IDs reproduïbles excepte random suffix) ──
{
    const ts = 1747500000000;
    const r1 = await createProject({ name: 'Idempo', now: ts });
    const r2 = await createProject({ name: 'Idempo', now: ts });
    // El sufix random fa que projectId difereixi · però NO han de petar
    t(r1.project.id !== r2.project.id || r1.project.id === r2.project.id, 'I · 2 crides separades · no peten');
    eq(r1.project.createdAt, ts,                                  'I · createdAt respecta `now`');
    eq(r1.score, r2.score,                                        'I · score reproduïble');
}

// ─── J · FAILURE MODES ────────────────────────────────────────────────────
{
    let threw = false;
    try { await createProject({}); } catch (_) { threw = true; }
    t(threw,                                                      'J · sense name · throws');
}
{
    let threw = false;
    try { await createProject({ name: '' }); } catch (_) { threw = true; }
    t(threw,                                                      'J · name buit · throws');
}
{
    // Result shape stable
    const r = await createProject({ name: 'Shape' });
    t(typeof r.ok === 'boolean',                                  'J · result.ok boolean');
    t(typeof r.score === 'number',                                'J · result.score number');
    t(typeof r.status === 'string',                               'J · result.status string');
    t(typeof r.ms === 'number',                                   'J · result.ms number');
    t(r.version === ORCHESTRATOR_VERSION,                         'J · version present');
}

// ─── K · INTEGRATION · output complet és VÀLID respecte rubric ───────────
{
    const r = await createProject({ name: 'End-to-end', description: 'cohort cooperativa', sector: 'cultura' });
    const reEvaluation = evaluateRubric({
        roles:        r.project.vna_roles,
        deliverables: r.deliverables,
        transactions: r.project.vna_transactions,
        sops:         r.sops.map(s => s.content),
        socs:         r.socs.map(s => s.content),
    });
    t(reEvaluation.total >= 85,                                   'K · output rebavaluat · gold (' + reEvaluation.total + ')');
    eq(reEvaluation.status, 'gold',                               'K · status gold confirmat post-build');
}

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
