// MANIFEST-DELIVERABLES · TDD que verifica que createProject genera
// TOTS els entregables especificats al manifest "Agent SOS V11"
// (vnaExpertPrompts.SYSTEM_BASE · secció OUTPUT ESPERAT).
//
// Manifest expectation · 'ikigai/canvas + landing + pitch + mapa de valor
// amb processos per FASE + SOCs + SOPs amb TDD + roles CNAE-adaptats +
// mètriques Lean + cicles recíprocs + cap rol orfe'.
//
// Aquest test és la xarxa de seguretat · si la IA un dia genera output
// sense alguna d'aquestes parts · falla aquí.

import { createProject } from '../core/projectCreationOrchestrator.js';
import { evaluateRubric, fromProject } from '../core/valueFlowRubricService.js';
import { validateIntegrity } from '../core/valueFlowIntegrityService.js';
import { SYSTEM_BASE, FEW_SHOT_EXAMPLES, CASTELLER_LEVELS, buildPrompt } from '../core/vnaExpertPrompts.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== MANIFEST-DELIVERABLES · TDD agent SOS V11 ===\n');

// ─── A · MANIFEST · contingut del SYSTEM_BASE actual ─────────────────────
{
    // Manifest expectation · 4 missions
    t(/MISSIÓ/.test(SYSTEM_BASE),                            'A · manifest · secció MISSIÓ present');
    t(/Value Network Analysis|VNA/.test(SYSTEM_BASE),       'A · manifest · VNA · Value Network Analysis');
    t(/Antigravity Engine|SOP→WO→Ledger/.test(SYSTEM_BASE),  'A · manifest · Antigravity Engine · SOP→WO→Ledger');
    t(/slicing pie/i.test(SYSTEM_BASE),                      'A · manifest · slicing pie');

    // 6 PRINCIPIS
    t(/Mind-as-Graph/.test(SYSTEM_BASE),                     'A · principle · Mind-as-Graph');
    t(/Context-First/.test(SYSTEM_BASE),                     'A · principle · Context-First');
    t(/Local-first/.test(SYSTEM_BASE),                       'A · principle · Local-first');
    t(/Intangibles humans/i.test(SYSTEM_BASE),               'A · principle · Intangibles humans');
    t(/DTD/.test(SYSTEM_BASE),                               'A · principle · DTD (Deliverable Test-Driven)');
    t(/Fair Fractal Tokenomics/i.test(SYSTEM_BASE),          'A · principle · Fair Fractal Tokenomics');

    // CNAE adaptation
    t(/CNAE/.test(SYSTEM_BASE),                              'A · marc · CNAE adaptation');

    // OUTPUT ESPERAT
    t(/ikigai/i.test(SYSTEM_BASE),                           'A · output · ikigai esperat');
    t(/canvas/i.test(SYSTEM_BASE),                           'A · output · canvas esperat');
    t(/pitch/i.test(SYSTEM_BASE),                            'A · output · pitch per inversors');
    t(/landing|presentació/i.test(SYSTEM_BASE),              'A · output · landing/presentació');
    t(/per FASE|por FASE|per fase/i.test(SYSTEM_BASE),       'A · output · mapa per FASE del cicle');
}

// ─── B · OUTPUT createProject · TÉ tots els deliverables del manifest ───
{
    const r = await createProject({ name: 'Castellers Demo Test', description: 'connectar colles', sector: 'cultura', ambition: 'max' });
    t(r.ok,                                                   'B · result.ok');
    eq(r.status, 'gold',                                      'B · status gold');

    // Canvas amb camps requerits manifest
    t(r.canvas && r.canvas.vision,                           'B · canvas.vision');
    t(r.canvas.mission,                                      'B · canvas.mission');
    t(Array.isArray(r.canvas.values),                        'B · canvas.values array');
    t(Array.isArray(r.canvas.stakeholders),                  'B · canvas.stakeholders array');
    t(r.canvas.northStar,                                    'B · canvas.northStar');

    // Pitch amb 6 seccions requerides manifest
    t(r.pitch && r.pitch.headline,                           'B · pitch.headline');
    t(r.pitch.problem,                                       'B · pitch.problem');
    t(r.pitch.solution,                                      'B · pitch.solution');
    t(r.pitch.market,                                        'B · pitch.market');
    t(r.pitch.business,                                      'B · pitch.business');
    t(r.pitch.team,                                          'B · pitch.team');

    // Workshops · landing/presentació
    t(Array.isArray(r.workshops),                            'B · workshops array');
    t(r.workshops.length >= 1,                               'B · ≥1 workshop com a landing');

    // Mapa de valor · roles + transactions + deliverables + SOPs + SOCs
    t(Array.isArray(r.roles) && r.roles.length >= 3,         'B · ≥3 roles');
    t(Array.isArray(r.transactions) && r.transactions.length >= 5, 'B · ≥5 transactions');
    t(Array.isArray(r.deliverables) && r.deliverables.length >= 3, 'B · ≥3 deliverables');
    t(Array.isArray(r.sops) && r.sops.length >= 3,           'B · ≥3 SOPs');
    t(Array.isArray(r.socs) && r.socs.length >= 1,           'B · ≥1 SOC');
}

// ─── C · ROLES manifest · castell_level + canonical kind ───────────────
{
    const r = await createProject({ name: 'TestRoles', ambition: 'max' });
    // Cada rol té castell_level vàlid
    const validLevels = new Set(CASTELLER_LEVELS.map(l => l.id));
    for (const role of r.roles) {
        const cl = role.content?.castell_level;
        t(cl && validLevels.has(cl),                         'C · rol "' + role.id + '" · castell_level vàlid (' + cl + ')');
    }
    // ≥2 levels distints (rubric C2)
    const distinctLevels = new Set(r.roles.map(rr => rr.content?.castell_level).filter(Boolean));
    t(distinctLevels.size >= 2,                              'C · ≥2 castell_levels diversificats');
}

// ─── D · TRANSACTIONS manifest · mètriques Lean + mix tangible/intangible ─
{
    const r = await createProject({ name: 'TestTx', ambition: 'max' });
    const ratioLean = r.transactions.filter(tx =>
        typeof tx.lead_time_hours === 'number' &&
        typeof tx.cycle_time_hours === 'number' &&
        typeof tx.wip_units === 'number'
    ).length / r.transactions.length;
    t(ratioLean >= 0.8,                                      'D · ≥80% txs amb mètriques Lean (got ' + Math.round(ratioLean*100) + '%)');

    const types = new Set(r.transactions.map(tx => tx.type));
    t(types.has('tangible') && types.has('intangible'),     'D · mix tangible + intangible');
}

// ─── E · SOPs manifest · steps amb deliverable_kind + approval_rule ─────
{
    const r = await createProject({ name: 'TestSops', ambition: 'max' });
    for (const sop of r.sops) {
        const steps = sop.content?.steps || sop.steps || [];
        t(steps.length >= 3,                                 'E · SOP "' + sop.id + '" · ≥3 steps');
        t(steps.every(s => s.deliverable_kind && s.approval_rule),
                                                              'E · SOP "' + sop.id + '" · steps amb deliverable_kind + approval_rule');
    }
}

// ─── F · SOC checklist cobreix ≥80% dels SOPs (C11) ─────────────────────
{
    const r = await createProject({ name: 'TestSocCov', ambition: 'max' });
    const sopIds = new Set(r.sops.map(s => s.id));
    const referenced = new Set();
    for (const soc of r.socs) {
        const checklist = soc.content?.checklist || [];
        for (const item of checklist) if (item.sop_ref) referenced.add(item.sop_ref);
    }
    const covered = [...referenced].filter(ref => sopIds.has(ref)).length;
    const ratio = covered / sopIds.size;
    t(ratio >= 0.8,                                          'F · SOC coverage ≥80% (got ' + Math.round(ratio*100) + '%)');
}

// ─── G · RUBRIC + INTEGRITY · contracte global ─────────────────────────
{
    const r = await createProject({ name: 'TestQuality', ambition: 'max' });
    const input = fromProject(r.project, { sops: r.sops, socs: r.socs, roles: r.roles });
    const ev = evaluateRubric(input);
    t(ev.total >= 85,                                         'G · rubric ≥85 (got ' + ev.total + ')');
    eq(ev.status, 'gold',                                     'G · status gold');

    const intg = validateIntegrity({
        valueFlow: { roles: input.roles, deliverables: input.deliverables, transactions: input.transactions },
        sops: input.sops, socs: input.socs,
    });
    eq(intg.errorCount, 0,                                    'G · integrity · 0 errors');
}

// ─── H · FEW-SHOT examples · alineats amb manifest ─────────────────────
{
    for (const [tplId, ex] of Object.entries(FEW_SHOT_EXAMPLES)) {
        const parsed = JSON.parse(ex.assistantOutput);
        // Output del few-shot ha de tenir mateixa shape que esperem del manifest
        t(Array.isArray(parsed.roles) && parsed.roles.length >= 3, 'H · ' + tplId + ' · ≥3 roles al few-shot');
        t(parsed.roles.every(r => r.castell_level),         'H · ' + tplId + ' · cada role amb castell_level');
        t(Array.isArray(parsed.transactions) && parsed.transactions.length >= 5, 'H · ' + tplId + ' · ≥5 txs');
        t(parsed.transactions.every(tx => typeof tx.lead_time_hours === 'number'), 'H · ' + tplId + ' · txs amb lead_time');
        t(Array.isArray(parsed.sops) && parsed.sops.length >= 1, 'H · ' + tplId + ' · ≥1 SOP');
        t(parsed.sops.every(s => Array.isArray(s.steps) && s.steps.every(st => st.deliverable_kind && st.approval_rule)), 'H · ' + tplId + ' · SOP steps ben formats');
        t(Array.isArray(parsed.socs) && parsed.socs.length >= 1, 'H · ' + tplId + ' · ≥1 SOC');
    }
}

// ─── I · buildPrompt · token budget guard ─────────────────────────────
{
    const tasks = ['enrich-value-map', 'personalize-canvas', 'personalize-pitch', 'expand-sop', 'generate-soc'];
    for (const taskKind of tasks) {
        const p = buildPrompt({
            templateId: 'founder-coop-tradicional',
            taskKind,
            context: { name: 'X', description: 'Y', sector: 'Z', roleName: 'r', sopTitle: 't', sops: [] },
        });
        t(p.approxTokens < 3500,                              'I · ' + taskKind + ' · tokens <3500 (got ' + p.approxTokens + ')');
        t(p.system && p.system.length > 500,                  'I · ' + taskKind + ' · system manifest carregat');
        t(p.user && p.user.length > 50,                       'I · ' + taskKind + ' · user prompt no buit');
    }
}

// ─── J · PERSONALIZE callback · estructura preservada + cost mesurat ──
{
    let called = false;
    const personalize = async ({ template, ctx, ambition, classification }) => {
        called = true;
        // Simula IA enriquint descripcions sense trencar estructura
        const enriched = {
            ...template,
            canvas: { ...template.canvas, vision: 'IA-enriched · ' + template.canvas.vision },
            pitch:  { ...template.pitch,  headline: 'IA · ' + template.pitch.headline },
        };
        return { template: enriched, cost: 0.012 };
    };
    const r = await createProject({ name: 'TestIA', ambition: 'standard', personalize });
    t(called,                                                  'J · personalize callback executat');
    t(r.canvas.vision.startsWith('IA-enriched'),              'J · canvas IA-enriched al output');
    t(r.pitch.headline.startsWith('IA · '),                   'J · pitch IA-enriched');
    t(r.cost >= 0.012,                                        'J · cost IA mesurat al result.cost');
}

// ─── K · CICLE recíproc · cap rol orfe · contracte VNA ────────────────
{
    const r = await createProject({ name: 'TestCycle', ambition: 'max' });
    const input = fromProject(r.project, { sops: r.sops, socs: r.socs, roles: r.roles });
    const ev = evaluateRubric(input);
    // C7 · cicle recíproc · C8 · cap rol orfe (revisa byCriterion)
    t(ev.byCriterion.C7.passed,                              'K · C7 · cicle recíproc detectat');
    t(ev.byCriterion.C8.passed,                              'K · C8 · cap rol orfe');
}

// ─── L · CNAE-awareness (futur · ja al manifest text) ──────────────────
{
    // El manifest menciona CNAE adaptation · text-level check (la implementació
    // del CNAE-role-adaptation és WO pendent · veure wo-cnae-role-adaptation-001)
    t(/CNAE/.test(SYSTEM_BASE),                              'L · manifest preparat per CNAE (WO impl. pendent · sector ja al classify)');
}

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
