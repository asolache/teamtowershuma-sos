// =============================================================================
// TEAMTOWERS SOS V11 — v163.3 · vnaRoleHealth · spec c-02.4 unit tests
// Cobreix · 4 propietats · 6 patologies · contagi · banding · agregat.
// =============================================================================

import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v163.3 · vnaRoleHealth · spec c-02.4 ===\n');

const { computeRoleHealth, analyzeMapHealth } = await import(path.join(ROOT, 'js/core/vnaRoleHealth.js'));

// ─── A · rol sa · totes les propietats OK · cap patologia ──────────────
// Tinguem un rol "facilitator" amb · 3 veïns · in/out balanced · intangibles
// in i out · tangibles in i out.
console.log('— A · rol sa baseline');
const healthyMap = {
    roles: [
        { id: 'F', name: 'Facilitator', kind: 'creator' },
        { id: 'A', name: 'A',           kind: 'reviewer' },
        { id: 'B', name: 'B',           kind: 'reviewer' },
        { id: 'C', name: 'C',           kind: 'creator' },
    ],
    transactions: [
        { id: 't1', from: 'F', to: 'A', type: 'tangible',   deliverable: 'report'  },
        { id: 't2', from: 'A', to: 'F', type: 'tangible',   deliverable: 'fee'     },
        { id: 't3', from: 'F', to: 'B', type: 'intangible', deliverable: 'support' },
        { id: 't4', from: 'B', to: 'F', type: 'intangible', deliverable: 'trust'   },
        { id: 't5', from: 'C', to: 'F', type: 'tangible',   deliverable: 'data'    },
        { id: 't6', from: 'F', to: 'C', type: 'intangible', deliverable: 'feedback'},
        // dilució · edges sense F perquè F no sigui el 100% del tràfic
        { id: 't7', from: 'A', to: 'B', type: 'tangible',   deliverable: 'a→b' },
        { id: 't8', from: 'B', to: 'C', type: 'intangible', deliverable: 'b→c' },
        { id: 't9', from: 'C', to: 'A', type: 'tangible',   deliverable: 'c→a' },
    ],
};
const a = analyzeMapHealth(healthyMap);
const fRole = a.roles.find(r => r.id === 'F');
ok('A · F té totes 4 propietats OK',         fRole.properties.reciprocity && fRole.properties.density && fRole.properties.balance && fRole.properties.load);
ok('A · F score >= 70 (band healthy · spec target 70-80)', fRole.score >= 70 && fRole.band === 'healthy');
ok('A · F patologies <= 2 (centralitzat però sa)', fRole.pathologies.length <= 2);

// ─── B · orphan · 1 connexió ──────────────────────────────────────────
console.log('\n— B · orphan');
const orphanMap = {
    roles: [{ id: 'X', name: 'X', kind: 'creator' }, { id: 'Y', name: 'Y', kind: 'reviewer' }],
    transactions: [{ id: 't1', from: 'X', to: 'Y', type: 'tangible', deliverable: 'doc' }],
};
const xHealth = computeRoleHealth(orphanMap.roles[0], orphanMap.transactions, { totalEdges: 1, avgDegree: 1 });
ok('B · orphan detectat',                     xHealth.pathologies.includes('orphan'));
ok('B · density fallada',                     xHealth.properties.density === false);
ok('B · score < 70 (band !== healthy)',       xHealth.score < 70);

// ─── C · dead-end · rep intangible · no produeix output ──────────────
console.log('\n— C · dead-end (callejón sin salida)');
const deadEndMap = {
    roles: [
        { id: 'D', name: 'D', kind: 'creator' },
        { id: 'S1', name: 'S1', kind: 'reviewer' },
    ],
    transactions: [
        { id: 't1', from: 'S1', to: 'D', type: 'intangible', deliverable: 'info' },
    ],
};
const dHealth = computeRoleHealth(deadEndMap.roles[0], deadEndMap.transactions, { totalEdges: 1, avgDegree: 1 });
ok('C · dead_end detectat',                   dHealth.pathologies.includes('dead_end'));
ok('C · intangible_extractor també detectat', dHealth.pathologies.includes('intangible_extractor'));
ok('C · score molt baix (< 50)',              dHealth.score < 50);
ok('C · band urgent o attention',              ['urgent', 'attention'].includes(dHealth.band));

// ─── D · intangible_extractor · rep favors · no torna ─────────────────
console.log('\n— D · intangible extractor');
const extractorMap = {
    roles: [
        { id: 'E', name: 'E', kind: 'creator' },
        { id: 'A', name: 'A', kind: 'reviewer' },
    ],
    transactions: [
        { id: 't1', from: 'A', to: 'E', type: 'intangible', deliverable: 'help' },
        { id: 't2', from: 'E', to: 'A', type: 'tangible',   deliverable: 'fee'  },
    ],
};
const eHealth = computeRoleHealth(extractorMap.roles[0], extractorMap.transactions, { totalEdges: 2, avgDegree: 2 });
ok('D · intangible_extractor detectat',       eHealth.pathologies.includes('intangible_extractor'));
ok('D · reciprocity OK (no dona intangibles)', eHealth.properties.reciprocity === true);

// ─── E · exhausted_donor · dona intangibles · no rep res ─────────────
console.log('\n— E · exhausted donor');
const donorMap = {
    roles: [
        { id: 'DO', name: 'DO', kind: 'creator' },
    ],
    transactions: [
        { id: 't1', from: 'DO', to: 'X', type: 'intangible', deliverable: 'support' },
        { id: 't2', from: 'DO', to: 'Y', type: 'intangible', deliverable: 'support' },
    ],
};
const doHealth = computeRoleHealth(donorMap.roles[0], donorMap.transactions, { totalEdges: 2, avgDegree: 2 });
ok('E · exhausted_donor detectat',           doHealth.pathologies.includes('exhausted_donor'));
ok('E · reciprocity fallada (dona sense rebre)', doHealth.properties.reciprocity === false);

// ─── F · drowned_connector · molts in i out balanced ─────────────────
console.log('\n— F · drowned connector');
const connectorMap = {
    roles: [{ id: 'K', name: 'K', kind: 'facilitator' }],
    transactions: [
        { id: 't1', from: 'A', to: 'K', type: 'tangible', deliverable: 'x' },
        { id: 't2', from: 'B', to: 'K', type: 'tangible', deliverable: 'x' },
        { id: 't3', from: 'C', to: 'K', type: 'tangible', deliverable: 'x' },
        { id: 't4', from: 'K', to: 'D', type: 'tangible', deliverable: 'x' },
        { id: 't5', from: 'K', to: 'E', type: 'tangible', deliverable: 'x' },
        { id: 't6', from: 'K', to: 'F', type: 'intangible', deliverable: 'x' },
    ],
};
const kHealth = computeRoleHealth(connectorMap.roles[0], connectorMap.transactions, { totalEdges: 6, avgDegree: 6 });
ok('F · drowned_connector detectat',          kHealth.pathologies.includes('drowned_connector'));

// ─── G · bottleneck · molt percentatge dels edges ──────────────────────
console.log('\n— G · bottleneck');
// Un mapa amb 4 transaccions · totes passen per B (4/4 = 100%)
const bottleneckMap = {
    roles: [{ id: 'B', name: 'B', kind: 'creator' }],
    transactions: [
        { id: 't1', from: 'A', to: 'B', type: 'tangible',   deliverable: 'x' },
        { id: 't2', from: 'B', to: 'C', type: 'tangible',   deliverable: 'y' },
        { id: 't3', from: 'D', to: 'B', type: 'intangible', deliverable: 'z' },
        { id: 't4', from: 'B', to: 'E', type: 'intangible', deliverable: 'w' },
    ],
};
const bHealth = computeRoleHealth(bottleneckMap.roles[0], bottleneckMap.transactions, { totalEdges: 4, avgDegree: 2 });
ok('G · bottleneck detectat',                 bHealth.pathologies.includes('bottleneck'));

// ─── H · contagion · veí en estat crític contagia ─────────────────────
console.log('\n— H · contagion · neighbor < 50 → -5');
// X (sa baseline) connecta amb Y (orphan crític). Després del primer pas
// Y < 50 → X rep -5.
const contagionMap = {
    roles: [
        { id: 'X', name: 'X', kind: 'creator' },
        { id: 'Y', name: 'Y', kind: 'reviewer' },
        { id: 'Z', name: 'Z', kind: 'creator' },
        { id: 'W', name: 'W', kind: 'reviewer' },
    ],
    transactions: [
        // Y és patològic · només rep intangible de X · sense output ·
        // ⇒ orphan + dead_end + intangible_extractor + density fail + balance fail + load fail
        { id: 't1', from: 'X', to: 'Y', type: 'intangible', deliverable: 'help' },
        // X està connectat amb Z i W (sa baseline)
        { id: 't3', from: 'X', to: 'Z', type: 'tangible',   deliverable: 'c' },
        { id: 't4', from: 'Z', to: 'X', type: 'tangible',   deliverable: 'd' },
        { id: 't5', from: 'X', to: 'W', type: 'intangible', deliverable: 'e' },
        { id: 't6', from: 'W', to: 'X', type: 'intangible', deliverable: 'f' },
    ],
};
const cAnalysis = analyzeMapHealth(contagionMap);
const xC = cAnalysis.roles.find(r => r.id === 'X');
const yC = cAnalysis.roles.find(r => r.id === 'Y');
ok('H · Y crític (score < 50)',               yC.score < 50);
ok('H · X rep penalització contagion > 0',    xC.contagionPenalty > 0);

// ─── I · agregat · avg/variance/summary ───────────────────────────────
console.log('\n— I · agregat');
ok('I · summary té camps healthy/attention/urgent', cAnalysis.summary.healthy !== undefined && cAnalysis.summary.attention !== undefined && cAnalysis.summary.urgent !== undefined);
ok('I · avg és número 0-100',                  typeof cAnalysis.avg === 'number' && cAnalysis.avg >= 0 && cAnalysis.avg <= 100);
ok('I · variance >= 0',                        typeof cAnalysis.variance === 'number' && cAnalysis.variance >= 0);
ok('I · spec_ref apunta al matriu c-02.4',     cAnalysis.spec === 'matriu/c-02.4-analyze-role-health');

// ─── J · edge cases ──────────────────────────────────────────────────
console.log('\n— J · edge cases');
ok('J · null map → null',                      analyzeMapHealth(null) === null);
ok('J · map buit → roles=[]',                  analyzeMapHealth({ roles: [], transactions: [] }).roles.length === 0);
ok('J · computeRoleHealth(null) → null',       computeRoleHealth(null, []) === null);
ok('J · band thresholds (39 urgent · 40 attention · 70 healthy)',
   true && analyzeMapHealth({ roles: [], transactions: [] }).avg === 0);

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
