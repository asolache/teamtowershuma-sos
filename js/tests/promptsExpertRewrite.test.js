// =============================================================================
// TEAMTOWERS SOS V11 — PROMPTS EXPERT REWRITE · TDD (PR-O)
// Ruta · /js/tests/promptsExpertRewrite.test.js
//
// Valida · 4 prompts nous (define-product-service · design-value-map-rich ·
// generate-socs-from-value-map · generate-sops-with-skills) + personalize-
// canvas/pitch/landing reescrits + SYSTEM_BASE més concís però potent.
// =============================================================================

import { SYSTEM_BASE, buildPrompt, listTasks, TASK_KINDS } from '../core/vnaExpertPrompts.js';

let pass = 0, fail = 0;
function ok(label, cond, expected = '', got = '') {
    if (cond) { pass++; console.log('✓', label); }
    else {
        fail++;
        const detail = (expected !== '' || got !== '') ? ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})` : '';
        console.log('✗', label + detail);
    }
}

console.log('=== PROMPTS-EXPERT-REWRITE (PR-O) ===\n');

// ─── A · SYSTEM_BASE · KISS DRY Antigravity ──────────────────────────────
console.log('— A · SYSTEM_BASE · KISS DRY Antigravity present');
ok('A · "expert llegendari"',     SYSTEM_BASE.includes('expert llegendari'));
ok('A · "KISS · DRY · Antigravity"', SYSTEM_BASE.includes('KISS') && SYSTEM_BASE.includes('DRY') && SYSTEM_BASE.includes('Antigravity'));
ok('A · "<90 segons"',            SYSTEM_BASE.includes('<90 segons'));
ok('A · NIVELLS DE DETALL (macro/meso/micro)', SYSTEM_BASE.includes('macro') && SYSTEM_BASE.includes('meso') && SYSTEM_BASE.includes('micro'));
ok('A · SOC vs SOP vs WO definits',  SYSTEM_BASE.includes('SOC vs SOP vs WO'));
ok('A · cost-conscious explícit',    SYSTEM_BASE.includes('Cost-conscious'));
ok('A · METODOLOGIA VERNA ALLEE',    SYSTEM_BASE.includes('METODOLOGIA VERNA ALLEE'));
ok('A · 5 principis Verna Allee',    SYSTEM_BASE.includes('5 principis sagrats'));

// ─── B · TASK_KINDS · 13 prompts (5 nous) ───────────────────────────────
console.log('\n— B · TASK_KINDS · 5 nous prompts experts');
const all = TASK_KINDS;
for (const t of ['define-product-service', 'design-value-map-rich', 'generate-socs-from-value-map', 'generate-sops-with-skills', 'personalize-landing']) {
    ok('B · TASK_KINDS conté ' + t, all.includes(t));
}
ok('B · TASK_KINDS ≥13', all.length >= 13, '≥13', all.length);

// ─── C · define-product-service ─────────────────────────────────────────
console.log('\n— C · define-product-service · prompt qualitatiu');
const p1 = buildPrompt({
    taskKind: 'define-product-service',
    context: { name: 'Coop Cures', description: 'Cures domiciliàries cooperativa', sector: 'Q', entity_type: 'organization', lifecycle_stage: 'mvp' },
});
ok('C · prompt "IDENTIFICA EL PRODUCTE"',  p1.user.includes('IDENTIFICA EL PRODUCTE/SERVEI CENTRAL'));
ok('C · 4 preguntes step-by-step',  p1.user.includes('Quin és el producte CONCRET') && p1.user.includes('Quin és el diferencial'));
ok('C · output { name, kind, audience, valueProposition, differentiator, revenueModel }',
    p1.user.includes('"name"') && p1.user.includes('"kind"') && p1.user.includes('"audience"') && p1.user.includes('"valueProposition"') && p1.user.includes('"differentiator"') && p1.user.includes('"revenueModel"'));
ok('C · tokens <3500',  p1.approxTokens < 3500, '<3500', p1.approxTokens);

// ─── D · design-value-map-rich · deep thinking + macro/meso/micro ──────
console.log('\n— D · design-value-map-rich · pensar profundament');
const p2 = buildPrompt({
    taskKind: 'design-value-map-rich',
    context: {
        name: 'Coop Cures', description: 'Cures domiciliàries', sector: 'Q', entity_type: 'organization',
        lifecycle_stage: 'mvp', vna_zoom: 'meso',
        product_service: { name: 'Pauta cures setmanal', kind: 'service' },
        canvas: { vision: 'cura excel·lent' },
        pitch: { headline: 'cures cooperatives' },
    },
});
ok('D · prompt "MAPA DE VALOR RIC"',  p2.user.includes('MAPA DE VALOR RIC'));
ok('D · "pensa profundament"',  p2.user.includes('pensa profundament'));
ok('D · THINK STEP-BY-STEP guidance',  p2.user.includes('THINK STEP-BY-STEP'));
ok('D · 5-7 rols per meso zoom',  p2.user.includes('4-7'));
ok('D · MIX obligatori 60-70% tangible',  p2.user.includes('60-70% transaccions tangibles'));
ok('D · cicle recíproc obligatori',  p2.user.includes('CICLE RECÍPROC'));
ok('D · level macro/meso/micro per cada rol',  p2.user.includes('"level": "macro|meso|micro"'));
ok('D · patterns_detected output',  p2.user.includes('patterns_detected'));
ok('D · tokens <3500',  p2.approxTokens < 3500, '<3500', p2.approxTokens);

// ─── E · generate-socs-from-value-map · derivat del mapa ───────────────
console.log('\n— E · generate-socs-from-value-map');
const p3 = buildPrompt({
    taskKind: 'generate-socs-from-value-map',
    context: {
        name: 'Coop X', sector: 'M', lifecycle_stage: 'mvp', vna_zoom: 'meso',
        value_map: {
            roles: [{ id: 'r1', name: 'X', kind: 'founder' }],
            transactions: [{ id: 'tx1', from: 'r1', to: 'r1', type: 'tangible' }],
            patterns_detected: ['pattern 1'],
        },
    },
});
ok('E · "DERIVATS DEL MAPA DE VALOR"',  p3.user.includes('DERIVATS DEL MAPA DE VALOR'));
ok('E · SOC INVARIANT explicat (què + per què)',  p3.user.includes('"què + per què"'));
ok('E · checklist d\'estats desitjats (no tasques)',  p3.user.includes('estats desitjats') && p3.user.includes('no és una tasca') || p3.user.includes('estat desitjat'));
ok('E · output socs[] amb checklist verification_kind',  p3.user.includes('verification_kind'));
ok('E · level macro/meso/micro per SOC',  p3.user.includes('"level": "macro|meso|micro"'));
ok('E · 3-7 SOCs per zoom meso',  p3.user.includes('3-7'));
ok('E · tokens <3500',  p3.approxTokens < 3500, '<3500', p3.approxTokens);

// ─── F · generate-sops-with-skills · skills associades per step ────────
console.log('\n— F · generate-sops-with-skills · SKILLS clau per SOS');
const p4 = buildPrompt({
    taskKind: 'generate-sops-with-skills',
    context: {
        name: 'Coop X',
        soc: { name: 'Cicle setmanal', purpose: 'p', phase: 'mvp', checklist: [{ id: 'i1', label: 'X' }] },
        project_ctx: { description: 'd', sector: 'Q', entity_type: 'organization', lifecycle_stage: 'mvp' },
        role_kinds: ['founder', 'creator'],
        sector_role_examples: [{ kind: 'founder', name: 'Director Mèdic', description: 'd' }],
        available_skills: [{ id: 'skill-facilit', name: 'Facilitació grupal' }, { id: 'skill-design', name: 'Disseny serveis' }],
    },
});
ok('F · "SKILLS associades" prompt',  p4.user.includes('SKILLS associades'));
ok('F · "clau per SOS" mencionat',  p4.user.includes('clau per SOS') || p4.user.includes('clau per /skills'));
ok('F · catàleg available_skills passat',  p4.user.includes('Facilitació grupal'));
ok('F · cada step amb {skills: [...]}',  p4.user.includes('"skills":'));
ok('F · MAI Setup / Procés 1',  p4.user.includes('Setup') && p4.user.includes('Procés 1'));
ok('F · soc_item_ref per cada SOP',  p4.user.includes('soc_item_ref'));
ok('F · tokens <3500',  p4.approxTokens < 3500, '<3500', p4.approxTokens);

// ─── G · personalize-canvas amb ikigai estructurat ────────────────────
console.log('\n— G · personalize-canvas inclou IKIGAI 4 dimensions + productService');
const p5 = buildPrompt({
    taskKind: 'personalize-canvas',
    context: { name: 'X', description: 'd', sector: 'Q', product_service: 'Pauta cures' },
});
ok('G · prompt "IKIGAI + CANVAS"',  p5.user.includes('IKIGAI + CANVAS'));
ok('G · 4 dimensions ikigai · loves goodAt worldNeeds paidFor',
    p5.user.includes('loves') && p5.user.includes('goodAt') && p5.user.includes('worldNeeds') && p5.user.includes('paidFor'));
ok('G · output productService',  p5.user.includes('"productService"'));
ok('G · prohibits genèrics qualitat/innovació',  p5.user.includes('"qualitat"') && p5.user.includes('"innovació"'));

// ─── H · personalize-landing nou ──────────────────────────────────────
console.log('\n— H · personalize-landing · narrativa pública');
const p6 = buildPrompt({
    taskKind: 'personalize-landing',
    context: { name: 'X', description: 'd', sector: 'J', product_service: 'SaaS X', canvas: { vision: 'V', mission: 'M' }, pitch: { headline: 'H' } },
});
ok('H · "LANDING PÚBLICA"',  p6.user.includes('LANDING PÚBLICA'));
ok('H · hero + differentiator + howItWorks + faq',
    p6.user.includes('"hero"') && p6.user.includes('"differentiator"') && p6.user.includes('"howItWorks"') && p6.user.includes('"faq"'));
ok('H · roadmap horizons now/next/later',  p6.user.includes('"now"') && p6.user.includes('"next"') && p6.user.includes('"later"'));
ok('H · tone "sense jargon"',  p6.user.includes('sense jargon'));

// ─── I · personalize-pitch · business plan focus ──────────────────────
console.log('\n— I · personalize-pitch · adapta per fase');
const p7 = buildPrompt({
    taskKind: 'personalize-pitch',
    context: { name: 'X', description: 'd', sector: 'K', product_service: 'fintech app', lifecycle_stage: 'mvp' },
});
ok('I · "PITCH PER INVERSORS"',  p7.user.includes('PITCH PER INVERSORS'));
ok('I · adapta a fase mvp',  p7.user.includes('mvp'));
ok('I · "primer prototip+early signals"',  p7.user.includes('primer prototip'));
ok('I · 6 seccions',
    p7.user.includes('"headline"') && p7.user.includes('"problem"') && p7.user.includes('"solution"') &&
    p7.user.includes('"market"') && p7.user.includes('"business"') && p7.user.includes('"team"'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
