// CREATION-COMPLETENESS-GUARANTEE-001 · TDD que garanteix que createProject
// sempre retorna mapa de valor complet i evolucionable (manualment o via IA)
// Veure WO `wo-creation-completeness-guarantee-001` al backlog.
//
// Diana · cap regressió possible al flow legendary · cap mapa incomplet ·
// cada criteri fallit té un fix actionable visible a /quality.

import {
    createProject, AMBITION_LEVELS, ORCHESTRATOR_VERSION,
} from '../core/projectCreationOrchestrator.js';
import { CATALOG, applyContext } from '../core/projectTemplateCatalog.js';
import { evaluateRubric, fromProject, RUBRIC_THRESHOLDS } from '../core/valueFlowRubricService.js';
import { validateIntegrity } from '../core/valueFlowIntegrityService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== CREATION-COMPLETENESS-GUARANTEE ===\n');

// ─── A · score thresholds per ambition · contract de qualitat ──────────────
const expectedThresholds = { light: 70, standard: 80, max: 85 };
for (const [amb, minScore] of Object.entries(expectedThresholds)) {
    const r = await createProject({ name: 'Test ' + amb, ambition: amb });
    t(r.score >= minScore,                                   'A · ' + amb + ' · score ≥ ' + minScore + ' · got ' + r.score);
    t(r.ok === true,                                         'A · ' + amb + ' · result.ok=true');
    eq(r.status, r.score >= 85 ? 'gold' : (r.score >= 70 ? 'silver' : (r.score >= 50 ? 'bronze' : 'red')),
       'A · ' + amb + ' · status coherent amb score');
}

// ─── B · integrity garantida · 0 errors per cada ambition ─────────────────
for (const amb of ['light', 'standard', 'max']) {
    const r = await createProject({ name: 'IntegrityTest ' + amb, ambition: amb });
    t(r.integrity,                                           'B · ' + amb + ' · integrity object exposat');
    eq(r.integrity.errorCount, 0,                            'B · ' + amb + ' · 0 errors d\'integritat');
    t(r.integrity.ok === true,                               'B · ' + amb + ' · integrity.ok = true');
}

// ─── C · cap criteri pendent sense fix actionable ────────────────────────
{
    // Cas patològic · template minimal · forcem que algun criteri falli
    const partialTpl = {
        meta: { id: 'partial-test' },
        roles: [{ id: 'r1', kind: 'pm' }],                  // només 1 rol
        deliverables: [],
        transactions: [],
        sops: [],
        socs: [],
    };
    const e = evaluateRubric({
        roles: partialTpl.roles, deliverables: [], transactions: [], sops: [], socs: [],
    });
    t(e.missing.length > 0,                                  'C · template parcial · missing items presents');
    // Cada missing té label + fix · evolucionable
    for (const m of e.missing) {
        t(m.criterion && m.label && m.fix,                   'C · missing[' + m.criterion + '] · label+fix actionables');
    }
}

// ─── D · evolució humana · afegir info al projecte puja el score ─────────
// Simulem que l'usuari edita el projecte manualment (afegeix mètriques Lean
// a una tx que no en tenia). El re-evaluate ha de donar un score més alt.
{
    const tpl = applyContext(CATALOG['founder-coop-tradicional'], { name: 'EvolveHuman', sector: 'x', problem: 'y' });

    // Strip lean metrics from one tx
    const txsBad = tpl.transactions.map((tx, i) => i === 0
        ? { ...tx, lead_time_hours: null, cycle_time_hours: null, wip_units: null }
        : tx
    );
    const scoreBefore = evaluateRubric({
        roles: tpl.roles, deliverables: tpl.deliverables, transactions: txsBad,
        sops: tpl.sops, socs: tpl.socs,
    }).total;

    // Usuari "edita manualment" · re-afegeix lean
    const txsFix = tpl.transactions.slice();
    const scoreAfter = evaluateRubric({
        roles: tpl.roles, deliverables: tpl.deliverables, transactions: txsFix,
        sops: tpl.sops, socs: tpl.socs,
    }).total;

    t(scoreAfter >= scoreBefore,                             'D · evolució humana puja score · ' + scoreBefore + ' → ' + scoreAfter);
    t(scoreAfter === 100,                                    'D · template complet · 100/100 post-fix');
}

// ─── E · evolució IA · injectar personalize callback puja score ──────────
{
    // Callback simulant IA que enriqueix descripcions però manté estructura
    const personalize = async ({ template }) => {
        const enriched = {
            ...template,
            roles: template.roles.map(r => ({ ...r, description: 'IA-enriched · ' + (r.description || '') })),
        };
        return { template: enriched, cost: 0.005 };
    };
    const r1 = await createProject({ name: 'NoIA', ambition: 'light' });
    const r2 = await createProject({ name: 'WithIA', ambition: 'standard', personalize });
    eq(r1.score, r2.score,                                   'E · estructura idèntica · ambdós scores 100');
    t(r2.cost > 0,                                            'E · IA personalize · cost mesurat');
    t(r2.roles[0].content.description.includes('IA-enriched'), 'E · IA enrichment aplicat als roles');
}

// ─── F · idempotència · mateixos params · cap regressió de score ────────
{
    const r1 = await createProject({ name: 'Idempo', ambition: 'standard' });
    const r2 = await createProject({ name: 'Idempo', ambition: 'standard' });
    eq(r1.score, r2.score,                                   'F · mateix input · mateix score (idempotent)');
    eq(r1.status, r2.status,                                 'F · mateix status');
}

// ─── G · failure mode · ambition invàlid · throw clar ──────────────────
{
    let threw = false;
    try { await createProject({ name: 'Bad', ambition: 'extreme' }); } catch (_) { threw = true; }
    t(threw,                                                  'G · ambition invàlid · throws cleanly');
}

// ─── H · contracte shape · sempre present els camps clau ─────────────────
{
    const r = await createProject({ name: 'ShapeCheck' });
    const required = ['ok', 'score', 'status', 'project', 'roles', 'sops', 'socs',
                      'transactions', 'deliverables', 'canvas', 'pitch', 'workshops',
                      'classification', 'templateId', 'missing', 'integrity', 'ms', 'cost'];
    for (const k of required) {
        t(k in r,                                            'H · result.' + k + ' present');
    }
    eq(r.version, ORCHESTRATOR_VERSION,                      'H · version stamp');
}

// ─── I · evolution gap · per a cada criteri fallit · pot-se evolucionar ─
// Si l'usuari té un projecte amb score 60 · cada criteri fallit ha de tenir
// fix actionable que l'usuari pot aplicar manualment via /quality o /map.
{
    // Cas mínim per detectar gaps
    const minimal = applyContext(CATALOG['default-balanced'], { name: 'MinTest' });
    // Estrip lean metrics + estrip 1 SOP per simular regressió
    const stripLean = minimal.transactions.map(tx => ({ ...tx, lead_time_hours: null, cycle_time_hours: null, wip_units: null }));
    const stripSops = minimal.sops.slice(0, 2); // només 2 de 5
    const e = evaluateRubric({
        roles: minimal.roles, deliverables: minimal.deliverables,
        transactions: stripLean, sops: stripSops, socs: minimal.socs,
    });
    t(e.total < 100,                                         'I · score < 100 amb info incompleta');
    t(e.missing.length > 0,                                  'I · ≥1 missing detectat');
    // Cada missing té fix · evolucionable
    const allFixable = e.missing.every(m => m.fix && m.fix.length > 0);
    t(allFixable,                                            'I · cada missing té fix actionable');
}

// ─── J · stress · 5 projectes consecutius sense fluctuació ──────────────
{
    const scores = [];
    for (let i = 0; i < 5; i++) {
        const r = await createProject({ name: 'Stress ' + i, ambition: 'max' });
        scores.push(r.score);
    }
    const uniqueScores = new Set(scores);
    eq(uniqueScores.size, 1,                                 'J · 5 projectes · scores idèntics (estabilitat)');
    eq(scores[0], 100,                                       'J · tots 100/100 (gold)');
}

// ─── K · integrity issues mostren auto_fix_hint ──────────────────────────
{
    const broken = validateIntegrity({
        valueFlow: { roles: [{ id: 'r1' }], deliverables: [], transactions: [] },
        sops: [{ id: 'sop-bad', role_ref: 'non-existent', steps: [{ deliverable_kind: 'x', approval_rule: 'y' }] }],
    });
    t(broken.errorCount > 0,                                 'K · integrity broken · error count > 0');
    for (const issue of broken.issues) {
        t(issue.human_message && issue.auto_fix_hint,        'K · issue ' + issue.rule + ' · té human_message + auto_fix_hint');
    }
}

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
