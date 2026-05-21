// =============================================================================
// TEAMTOWERS SOS V11 — v158 · Value Map canonical (1 flux + cycle + shape eval) · TDD
// User: "que no hay 3 formas de crear y solo una que vaya bien con loop · y tests
// de evaluación booleanos para automatizar el loop map → SOC → SOP".
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v158 · Value Map canonical · TDD ===\n');

const qs   = fs.readFileSync(path.join(ROOT, 'js/core/vnaQuickSuggest.js'), 'utf8');
const evjs = fs.readFileSync(path.join(ROOT, 'js/core/vnaShapeEvaluators.js'), 'utf8');
const vm   = fs.readFileSync(path.join(ROOT, 'js/views/ValueMapView.js'), 'utf8');

// ─── A · Shape evaluators existeixen i exporten ──────────────────────
console.log('— A · shape evaluators');
ok('A · vnaShapeEvaluators.js existeix',          evjs.length > 100);
ok('A · evaluateValueMapShape exportat',          evjs.includes('export function evaluateValueMapShape'));
ok('A · evaluateSocsShape exportat',              evjs.includes('export function evaluateSocsShape'));
ok('A · evaluateSopsShape exportat',              evjs.includes('export function evaluateSopsShape'));
ok('A · evaluateBundle helper exportat',          evjs.includes('export function evaluateBundle'));
ok('A · SHAPE_EVAL_VERSION exportat',             evjs.includes("export const SHAPE_EVAL_VERSION = 'v158'"));

// ─── B · quickSuggestSocs + quickSuggestSops + runValueMapCycle ──────
console.log('\n— B · vnaQuickSuggest extensions (v158)');
ok('B · quickSuggestSocs exportat',               qs.includes('export async function quickSuggestSocs'));
ok('B · quickSuggestSops exportat',               qs.includes('export async function quickSuggestSops'));
ok('B · runValueMapCycle exportat',               qs.includes('export async function runValueMapCycle'));
ok('B · SOCs · slim-first + escalate pattern',    /quickSuggestSocs[\s\S]+?slim = true[\s\S]+?qualityThreshold[\s\S]+?escalatedToFull = true/.test(qs));
ok('B · SOPs · slim-first + escalate pattern',    /quickSuggestSops[\s\S]+?slim = true[\s\S]+?qualityThreshold[\s\S]+?escalatedToFull = true/.test(qs));
ok('B · SOCs · usa taskKind generate-socs-from-value-map',
                                                    qs.includes("'generate-socs-from-value-map'"));
ok('B · SOPs · usa taskKind generate-sops-with-skills',
                                                    qs.includes("'generate-sops-with-skills'"));
ok('B · SOCs · usa evaluateSocsShape',            qs.includes('evaluateSocsShape'));
ok('B · SOPs · usa evaluateSopsShape',            qs.includes('evaluateSopsShape'));
ok('B · cycle · 3 fases · map → socs → sops',     /skip\.map[\s\S]+?skip\.socs[\s\S]+?skip\.sops/.test(qs));
ok('B · cycle · emit cycle-phase events',         qs.includes("emit('cycle-phase'"));
ok('B · cycle · retorna out amb degraded/map/socs/sops',
                                                    qs.includes('degraded: false') && qs.includes('out.map') &&
                                                    qs.includes('out.socs') && qs.includes('out.sops'));

// ─── C · ValueMapView · legacy ELIMINAT · 1 sol path ─────────────────
console.log('\n— C · ValueMapView · path únic (legacy eliminat)');
ok('C · NO crida _runAISuggestionLegacy',         !/await this\._runAISuggestionLegacy/.test(vm));
ok('C · NO mètode _runAISuggestionLegacy definit', !/async _runAISuggestionLegacy\(/.test(vm));
ok('C · NO feature flag vmap_ui=legacy actiu',    !/get\('vmap_ui'\) === 'legacy'/.test(vm));
ok('C · canonical · _runAISuggestionQuickSuggest', vm.includes('_runAISuggestionQuickSuggest'));
ok('C · comentari v158 explicant simplificació',  vm.includes('v158 · canonical · path únic'));

// ─── D · Shape evaluators · funcionament determinista (samples sintètics) ──
console.log('\n— D · shape evaluators · samples');
const { evaluateValueMapShape, evaluateSocsShape, evaluateSopsShape } = await import(path.join(ROOT, 'js/core/vnaShapeEvaluators.js'));

// D.1 · Value Map · sample BO (ha de passar ok=true)
const goodMap = {
    roles: [
        { id: 'cli', name: 'Client', kind: 'human', castell_level: 'pom_de_dalt' },
        { id: 'eq',  name: 'Equip core', kind: 'collective', castell_level: 'tronc' },
        { id: 'mn',  name: 'Mentor extern', kind: 'human', castell_level: 'laterals' },
    ],
    transactions: [
        { id: 'tx1', from: 'cli', to: 'eq',  deliverable: 'brief',  type: 'tangible' },
        { id: 'tx2', from: 'eq',  to: 'cli', deliverable: 'report', type: 'tangible' },
        { id: 'tx3', from: 'mn',  to: 'eq',  deliverable: 'feedback', type: 'intangible' },
    ],
    deliverables: [
        { id: 'brief',    name: 'Brief inicial', kind: 'doc' },
        { id: 'report',   name: 'Report setmanal', kind: 'doc' },
        { id: 'feedback', name: 'Feedback mentor', kind: 'comm' },
    ],
};
const evMap = evaluateValueMapShape(goodMap);
ok('D.1 · map bo · ok=true', evMap.ok === true);
ok('D.1 · map bo · score ≥ 70', evMap.score >= 70);

// D.2 · Value Map · sample DOLENT (només 1 rol)
const badMap = { roles: [{ id: 'x', name: 'X', kind: 'human' }], transactions: [], deliverables: [] };
const evMapBad = evaluateValueMapShape(badMap);
ok('D.2 · map dolent · ok=false', evMapBad.ok === false);
ok('D.2 · map dolent · issues llista counts',
                                                    evMapBad.issues.some(i => i.includes('roles · need ≥3')));

// D.3 · SOCs · sample BO
const goodSocs = {
    socs: [
        { id: 'soc-1', name: 'Cicle setmanal cohort', purpose: 'sincronitza cohort i feedback', phase: 'mvp',
          checklist: [
              { id: 'i1', label: 'Acta signada per tots els participants', verification_kind: 'manual-review' },
              { id: 'i2', label: 'Resum publicat al canal Slack del grup', verification_kind: 'sop-exists' },
          ] },
        { id: 'soc-2', name: 'Onboarding nou client', purpose: 'alinear expectatives inicials', phase: 'mvp',
          checklist: [
              { id: 'i1', label: 'Kickoff doc compartit amb client', verification_kind: 'attestation' },
              { id: 'i2', label: 'Calendari de sessions definit i acceptat', verification_kind: 'tdd' },
          ] },
    ],
};
const evSocs = evaluateSocsShape(goodSocs);
ok('D.3 · socs bons · ok=true', evSocs.ok === true);
ok('D.3 · socs bons · score ≥ 70', evSocs.score >= 70);

// D.4 · SOCs · sample DOLENT (nom genèric)
const badSocs = { socs: [
    { id: 's1', name: 'Procés 1', purpose: 'purpose descriptiu prou llarg per passar', phase: 'mvp',
      checklist: [
          { id: 'i1', label: 'item suficientment descriptiu llarg', verification_kind: 'manual-review' },
          { id: 'i2', label: 'altre item amb prou caracters', verification_kind: 'sop-exists' },
      ] },
    { id: 's2', name: 'Procés 2', purpose: 'purpose descriptiu prou llarg per passar', phase: 'mvp',
      checklist: [
          { id: 'i1', label: 'item suficientment descriptiu llarg', verification_kind: 'manual-review' },
          { id: 'i2', label: 'altre item amb prou caracters', verification_kind: 'sop-exists' },
      ] },
] };
const evSocsBad = evaluateSocsShape(badSocs);
ok('D.4 · socs noms genèrics · detectat als issues',
                                                    evSocsBad.issues.some(i => i.includes('generic names')));

// D.5 · SOPs · sample BO
const goodSops = {
    sops: [{
        id: 'sop-1', role_ref: 'eq', title: 'Sincronitzar cohort setmanal',
        steps: [
            { id: 's1', label: 'Recollir feedback dels participants', deliverable_kind: 'analysis', approval_rule: 'manual', role_kind: 'human' },
            { id: 's2', label: 'Compilar resum al canal compartit',   deliverable_kind: 'comm',     approval_rule: 'manual', role_kind: 'human' },
            { id: 's3', label: 'Generar pla per la setmana següent',  deliverable_kind: 'doc',      approval_rule: 'tdd',    role_kind: 'ai' },
        ],
    }],
};
const evSops = evaluateSopsShape(goodSops);
ok('D.5 · sops bons · ok=true', evSops.ok === true);
ok('D.5 · sops bons · score ≥ 70', evSops.score >= 70);

// D.6 · SOPs · sample DOLENT (només 1 step)
const badSops = { sops: [{ id: 'x', role_ref: 'r', title: 'Setup',
    steps: [{ id: 's1', label: 'do', deliverable_kind: 'doc', approval_rule: 'manual', role_kind: 'human' }] }] };
const evSopsBad = evaluateSopsShape(badSops);
ok('D.6 · sops dolents · ok=false (steps < 3)', evSopsBad.ok === false);

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
