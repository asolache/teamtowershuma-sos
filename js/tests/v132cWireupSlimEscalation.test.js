// =============================================================================
// TEAMTOWERS SOS V11 — V132c · slim wire-up + mode completar + escalation
// + benchmark dataset + A/B Lab UI · TDD
// Ruta · /js/tests/v132cWireupSlimEscalation.test.js
// =============================================================================

import fs from 'node:fs';
import { buildPrompt } from '../core/vnaExpertPrompts.js';
import { runExpertChain } from '../core/expertChainOrchestrator.js';
import { scoreOutput } from '../core/promptABTestService.js';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== V132c · wire-up slim + mode completar + escalation + UI ===\n');

// ─── A · prompt design-value-map-rich accepta existingMap (mode completar) ─
console.log('— A · mode completar · existingMap a design-value-map-rich');
const ctx = { name: 'FC Lleida', description: 'Equip futbol semi-pro', sector: 'R', vna_zoom: 'mid' };
const ctxWithExisting = {
    ...ctx,
    existingMap: {
        roles: [
            { id: 'coach', name: 'Primer Entrenador', castell_level: 'tronc' },
            { id: 'player', name: 'Jugador titular', castell_level: 'pinya' },
        ],
        transactions: [{ from: 'coach', to: 'player', deliverable: 'instrucció tàctica' }],
    },
};
const promptStandard = buildPrompt({ taskKind: 'design-value-map-rich', context: ctx });
const promptEnrich = buildPrompt({ taskKind: 'design-value-map-rich', context: ctxWithExisting });

ok('A · standard task header · DISSENY DE MAPA DE VALOR RIC',  promptStandard.user.includes('TASCA · DISSENY DE MAPA DE VALOR RIC'));
ok('A · enrich task header · ENRIQUIR MAPA',                    promptEnrich.user.includes('TASCA · ENRIQUIR MAPA DE VALOR EXISTENT'));
ok('A · enrich · "MODE COMPLETAR" injectat',                    promptEnrich.user.includes('MODE COMPLETAR'));
ok('A · enrich · llista rols existents · Primer Entrenador',    promptEnrich.user.includes('Primer Entrenador'));
ok('A · enrich · instrucció NO repetir',                         promptEnrich.user.includes('NO repeteixis els existents'));
ok('A · enrich · llista transactions',                           promptEnrich.user.includes('coach→player'));

// ─── B · runExpertChain accepta slim + qualityThreshold + existingMap ────
console.log('\n— B · runExpertChain signature v132c · slim · qualityThreshold · existingMap');
const orchSrc = fs.readFileSync(new URL('../core/expertChainOrchestrator.js', import.meta.url), 'utf8');
ok('B · runExpertChain accepta slim',                            /slim = false/.test(orchSrc));
ok('B · runExpertChain accepta qualityThreshold',                 /qualityThreshold = 70/.test(orchSrc));
ok('B · runExpertChain accepta existingMap',                      /existingMap = null/.test(orchSrc));
ok('B · injecta existingMap al context si present',               /context = \{ \.\.\.context, existingMap \}/.test(orchSrc));
ok('B · _runSingleTask accepta slim + qualityThreshold',           /async function _runSingleTask\([^)]*slim = false[^)]*qualityThreshold = 0/.test(orchSrc));
ok('B · escalation per qualitat · si score < threshold refà amb FULL',
   orchSrc.includes('quality-below-threshold') && orchSrc.includes('escalatedToFull = true'));
// v147 · slim moved to per-phase slimByDefault flag · escalation rubric segueix
// només per a design-value-map-rich (la fase pivotal)
ok('B · qualityThreshold només actiu a design-value-map-rich (rubric escalation)',
   orchSrc.includes("phase.id === 'design-value-map-rich' ? qualityThreshold : 0"));
ok('B · phase 5 builder injecta existingMap si baseCtx.existingMap té roles',
   /baseCtx\.existingMap && \(baseCtx\.existingMap\.roles\?\.length \|\| baseCtx\.existingMap\.transactions\?\.length\)/.test(orchSrc));

// ─── C · benchmark dataset 20 casos ─────────────────────────────────────
console.log('\n— C · knowledge/benchmarks/vna-quality-cases.json · 20 casos canonical');
const benchExists = fs.existsSync(new URL('../../knowledge/benchmarks/vna-quality-cases.json', import.meta.url));
ok('C · fitxer existeix',                                         benchExists);
if (benchExists) {
    const bench = JSON.parse(fs.readFileSync(new URL('../../knowledge/benchmarks/vna-quality-cases.json', import.meta.url), 'utf8'));
    ok('C · version v132c declarada',                             bench.version?.startsWith('v132c'));
    ok('C · 20 casos exactes',                                    bench.cases.length === 20);
    ok('C · cada cas té id · name · description · sector',        bench.cases.every(c => c.id && c.name && c.description && c.sector));
    ok('C · cada cas té expected_domain',                          bench.cases.every(c => c.expected_domain));
    ok('C · cada cas té expected_roles_min ≥ 5',                   bench.cases.every(c => c.expected_roles_min >= 5));
    ok('C · cada cas té must_include_role_kinds[]',                bench.cases.every(c => Array.isArray(c.must_include_role_kinds)));
    // Cobertura domains · ≥ 14 dominis diferents
    const domains = new Set(bench.cases.map(c => c.expected_domain));
    ok('C · cobertura domains ≥ 14',                              domains.size >= 14);
    // Cobertura sectors · ≥ 10 sectors diferents
    const sectors = new Set(bench.cases.map(c => c.sector));
    ok('C · cobertura sectors ≥ 10',                              sectors.size >= 10);
    // Cas crític · FC Lleida sports-team
    const football = bench.cases.find(c => c.id === 'case-sports-football');
    ok('C · cas FC Lleida · sports-team',                         football && football.expected_domain === 'sports-team');
    ok('C · FC Lleida té must_include · head-coach + player',     football.must_include_role_kinds.includes('head-coach') && football.must_include_role_kinds.includes('player'));
}

// ─── D · A/B Lab UI al /prompts-debug ──────────────────────────────────
console.log('\n— D · A/B Lab UI panel a /prompts-debug');
const pdSrc = fs.readFileSync(new URL('../views/PromptsDebugView.js', import.meta.url), 'utf8');
ok('D · sidebar inclou "🧪 A/B Lab"',                              pdSrc.includes('🧪 A/B Lab'));
ok('D · botó #pdAbLabRun',                                         pdSrc.includes('pdAbLabRun'));
ok('D · panel resultat #pdAbLabResult',                            pdSrc.includes('pdAbLabResult'));
ok('D · mètode _runAbLab definit',                                 pdSrc.includes('async _runAbLab()'));
ok('D · _runAbLab compara FULL vs SLIM vs MINIMAL',                pdSrc.includes('FULL') && pdSrc.includes('SLIM') && pdSrc.includes('MINIMAL'));
ok('D · _runAbLab cita "menys context > més"',                     pdSrc.includes('menys context'));

// ─── E · scoreOutput integració · output ric · score ≥ 85 ─────────────
console.log('\n— E · scoreOutput · validació hipòtesi qualitat (per a escalation)');
const richOutput = {
    roles: Array.from({length: 7}, (_, i) => ({ id: 'r'+i, castell_level: ['pom_de_dalt','tronc','pinya','laterals','mans','baixos','pinya'][i] })),
    transactions: [
        { from: 'r0', to: 'r1', type: 'tangible' },
        { from: 'r1', to: 'r0', type: 'intangible' },     // reciprocal!
        { from: 'r2', to: 'r3', type: 'tangible' },
        { from: 'r3', to: 'r4', type: 'intangible' },
    ],
    deliverables: [
        { kind: 'intangible', name: 'Confiança vestuari professional' },
        { kind: 'tangible', name: 'Alineació partit setmanal' },
    ],
};
const sc = scoreOutput(richOutput);
ok('E · output ric · score ≥ 85 (sense escalation)',              sc.score >= 85);

const poorOutput = {
    roles: [{ id: 'r1' }, { id: 'r2' }],
    transactions: [{ from: 'r1', to: 'r2', type: 'tangible' }],
    deliverables: [],
};
const scPoor = scoreOutput(poorOutput);
ok('E · output pobre · score < 70 (necessita escalation)',         scPoor.score < 70);

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
