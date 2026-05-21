// =============================================================================
// TEAMTOWERS SOS V11 — STRATEGIC ALPHA ROADMAP · TDD (v132)
// Ruta · /js/tests/strategicAlphaPlan.test.js
//
// Verifica · doc estratègic + backlog actualitzat amb 6 fases · 18 sprints ·
// 30+ WOs prioritzats per al llançament alfa pública v150.
// =============================================================================

import fs from 'node:fs';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== STRATEGIC ROADMAP TO ALPHA (v132) ===\n');

const planExists = fs.existsSync(new URL('../../docs/strategic-roadmap-to-alpha-v132.md', import.meta.url));
ok('doc/strategic-roadmap-to-alpha-v132.md existeix',  planExists);

if (planExists) {
    const plan = fs.readFileSync(new URL('../../docs/strategic-roadmap-to-alpha-v132.md', import.meta.url), 'utf8');

    // ─── A · 6 fases canòniques ──────────────────────────────────────────
    console.log('\n— A · 6 fases canòniques');
    const phases = ['Estabilització', 'Quality UX', 'Comercial', 'LMS + Knowledge', 'Comunitat', 'Launch'];
    for (const phase of phases) {
        ok('A · fase "' + phase + '" present',          plan.includes(phase));
    }

    // ─── B · 18 sprints v132 → v150 ──────────────────────────────────────
    console.log('\n— B · sprints v132 → v150');
    for (const v of ['v132', 'v133', 'v134', 'v135', 'v136', 'v137', 'v138', 'v140', 'v145', 'v149', 'v150']) {
        ok('B · sprint ' + v + ' present',              plan.includes(v));
    }

    // ─── C · 30+ WOs prioritzats ────────────────────────────────────────
    console.log('\n— C · WOs prioritzats per fase');
    const criticalWos = [
        'wo-research-lms', 'wo-prompt-ab-test-vna', 'wo-dynamic-kb-index',
        'wo-stripe-edge-deploy', 'wo-crypto-rpc-verify', 'wo-onboarding-flow-v1',
        'wo-sectors-fusion', 'wo-sostopbar-migration', 'wo-mobile-audit',
        'wo-landing-page-public', 'wo-pricing-page-activa', 'wo-trial-flow',
        'wo-lms-content-engine', 'wo-lms-api-market', 'wo-knowledge-permaweb-publish',
        'wo-cohort-0-onboarding', 'wo-trust-score-public', 'wo-referral-program',
        'wo-docs-site-public', 'wo-i18n-completion', 'wo-alpha-launch-checklist', 'wo-alpha-launch-comms',
    ];
    for (const wo of criticalWos) {
        ok('C · WO ' + wo + ' al plan',                 plan.includes(wo));
    }

    // ─── D · mètriques per fase + decisions @alvaro ─────────────────────
    console.log('\n— D · mètriques + decisions');
    ok('D · mètrica fi fase 1 · zero WARN/ERROR',       plan.toLowerCase().includes('zero error') || plan.toLowerCase().includes('zero warn'));
    ok('D · mètrica fi fase 2 · Lighthouse ≥ 90',       plan.includes('Lighthouse'));
    ok('D · mètrica fi fase 3 · 5 testers paguen',      plan.includes('5 testers'));
    ok('D · 4 decisions per @alvaro',                    plan.includes('Decisions a prendre @alvaro') && plan.includes('Pricing real') && plan.includes('LMS build vs'));

    // ─── E · taula mètriques globals pre/post alpha ─────────────────────
    console.log('\n— E · KPIs globals');
    ok('E · KPI Test asserts pass',                     plan.includes('Test asserts pass'));
    ok('E · KPI Vistes amb sosTopbar canonical',         plan.includes('sosTopbar canonical'));
    ok('E · KPI Plans Stripe actius',                    plan.includes('Plans Stripe actius'));
    ok('E · KPI LMS courses live',                       plan.includes('LMS courses live'));
    ok('E · KPI Mean Lighthouse score',                  plan.includes('Mean Lighthouse'));

    // ─── F · roadmap post-alpha ──────────────────────────────────────────
    console.log('\n— F · pla post-alfa visió continuació');
    ok('F · v151-160 beta permaweb federat',             plan.includes('v151-160'));
    ok('F · v161-180 Matriu integration · 6 vectors',    plan.includes('v161-180') && plan.includes('Matriu'));
    ok('F · v200+ GA · 1.0 release',                     plan.includes('v200+') && plan.includes('1.0'));

    // ─── G · principis transversals ──────────────────────────────────────
    console.log('\n— G · principis transversals');
    ok('G · principis KISS · TDD · cap regressió · PR atòmics',
       plan.includes('KISS') && plan.includes('TDD') && plan.includes('regressió') && plan.includes('PR atòmics'));
}

// ─── H · backlog.md inclou la secció ROADMAP ───────────────────────────
console.log('\n— H · backlog.md inclou ROADMAP ESTRATÈGIC');
const backlog = fs.readFileSync(new URL('../../docs/backlog.md', import.meta.url), 'utf8');
ok('H · backlog · "ROADMAP ESTRATÈGIC A ALFA"',       backlog.includes('ROADMAP ESTRATÈGIC A ALFA'));
ok('H · backlog · 6 fases · 18 sprints · 10 setmanes', backlog.includes('6 fases · 18 sprints'));
ok('H · backlog · taula amb fases v132-v150',         backlog.includes('v132-134') && backlog.includes('v149-150'));
ok('H · backlog · prioritat per fase',                 backlog.includes('Fase 1 · Estabilització'));
ok('H · backlog · decisions per @alvaro',              backlog.includes('Decisions per resoldre amb @alvaro'));
ok('H · backlog · pla post-alfa ≥ v151',               backlog.includes('Pla post-alfa'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
