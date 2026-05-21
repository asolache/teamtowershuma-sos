// =============================================================================
// TEAMTOWERS SOS V11 — v159 · Expert Chain canonical (runValueMapCycle integrated) · TDD
// User: "actualiza el formulario de creacion de proyecto para que use el nuevo
// sistema simplificado pero a la par mas potente y testea que mejore los
// entregables mapa SOC SOP".
//
// Estratègia · mock generateWithProvider amb outputs realistes · executa
// runExpertChain dos cops (legacy vs cycle) · compara shape eval scores ·
// NEW (cycle) ha de superar o igualar OLD (legacy) en map/SOCs/SOPs.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v159 · Expert Chain · runValueMapCycle integrated · TDD ===\n');

// ─── A · expertChainOrchestrator · flag useValueMapCycle present ─────
console.log('— A · expertChainOrchestrator · flag useValueMapCycle');
const ec = fs.readFileSync(path.join(ROOT, 'js/core/expertChainOrchestrator.js'), 'utf8');
ok('A · flag useValueMapCycle al signature',         ec.includes('useValueMapCycle = true'));
ok('A · comentari v159 explicant canvi',             ec.includes('v159 · canonical cycle'));
ok('A · phase 5 intercepta amb runValueMapCycle',    ec.includes("phase.id === 'design-value-map-rich' && useValueMapCycle"));
ok('A · import dinamic de runValueMapCycle',         ec.includes("await import('./vnaQuickSuggest.js')") && ec.includes('runValueMapCycle'));
ok('A · phases 6+7 skip si cycle ha corregut',       ec.includes('valueMapCycleRan'));
ok('A · valueMapCycle metadata exposat al out',      ec.includes('out.valueMapCycle = {'));
ok('A · emit "value-map-cycle" event',                ec.includes("'value-map-cycle'"));

// ─── B · CreateLiveView · persisteix valueMapCycle metadata ──────────
console.log('\n— B · CreateLiveView · auditable metadata');
const cv = fs.readFileSync(path.join(ROOT, 'js/views/CreateLiveView.js'), 'utf8');
ok('B · projectNode persisteix value_map_cycle',     cv.includes('value_map_cycle: out.valueMapCycle'));
ok('B · comentari v159 al projectNode',              cv.includes('v159 · canonical cycle metadata'));

// ─── C · Integration test · runExpertChain amb mock provider ─────────
console.log('\n— C · integration · runExpertChain w/ canonical cycle');
const { runExpertChain } = await import(path.join(ROOT, 'js/core/expertChainOrchestrator.js'));
const { evaluateValueMapShape, evaluateSocsShape, evaluateSopsShape } = await import(path.join(ROOT, 'js/core/vnaShapeEvaluators.js'));

// Mock provider · retorna output realista per a cada taskKind
function makeMockProvider() {
    const calls = [];
    const provider = async (_modelKey, opts) => {
        const sys  = opts.systemPrompt || '';
        const user = opts.userPrompt || '';
        calls.push({ sys: sys.slice(0, 80), user: user.slice(0, 80) });

        // Detect taskKind from user prompt
        if (user.includes('PRODUCTE/SERVEI') || user.includes('PRODUCT/SERVICE')) {
            return { text: JSON.stringify({ name: 'Plataforma cohort', kind: 'service', stages: ['onboarding', 'cohort', 'graduate'] }), usage: { inputTokens: 200, outputTokens: 80 } };
        }
        if (user.includes('CANVAS') || user.includes('IKIGAI')) {
            return { text: JSON.stringify({ vision: 'cohorts sostenibles', mission: 'acompanyar', values: ['transparència'], value_proposition: 'mentoria contínua', stakeholders: ['client', 'mentor'] }), usage: { inputTokens: 300, outputTokens: 120 } };
        }
        if (user.includes('PITCH')) {
            return { text: JSON.stringify({ problem: 'cohorts moren ràpid', solution: 'mentoria + ritus', why_now: 'demand X10', traction: '3 pilots' }), usage: { inputTokens: 250, outputTokens: 100 } };
        }
        // ORDER MATTERS · SOPs i SOCs també contenen "MAPA"/"VNA" al context ·
        // i el prompt SOCs cita "generate-sops-with-skills" als comments, així
        // que cal usar strings més específics per evitar match creuat.
        if (user.includes('Standard Operating PROCEDURES') || user.includes('GENERA SOPs')) {
            return { text: JSON.stringify({
                sops: [{
                    id: 'sop-1', role_ref: 'eq', title: 'Sincronitzar cohort setmanal',
                    steps: [
                        { id: 's1', label: 'Recollir feedback dels participants', deliverable_kind: 'analysis', approval_rule: 'manual', role_kind: 'human' },
                        { id: 's2', label: 'Compilar resum al canal compartit',   deliverable_kind: 'comm',     approval_rule: 'manual', role_kind: 'human' },
                        { id: 's3', label: 'Generar pla per la setmana següent',  deliverable_kind: 'doc',      approval_rule: 'tdd',    role_kind: 'ai' },
                    ],
                }],
            }), usage: { inputTokens: 400, outputTokens: 200 } };
        }
        if (user.includes('Standard Operating CONCEPTS') || user.includes('GENERA SOCs')) {
            return { text: JSON.stringify({
                socs: [
                    { id: 'soc-1', name: 'Cicle setmanal cohort coordinadora', purpose: 'sincronitza cohort i recull feedback per iterar', phase: 'mvp',
                      checklist: [
                          { id: 'i1', label: 'Acta signada per tots els participants', verification_kind: 'manual-review' },
                          { id: 'i2', label: 'Resum publicat al canal compartit', verification_kind: 'sop-exists' },
                      ] },
                    { id: 'soc-2', name: 'Onboarding nou client consultoria', purpose: 'alinear expectatives inicials i objectius del cohort', phase: 'mvp',
                      checklist: [
                          { id: 'i1', label: 'Kickoff doc compartit amb client signat', verification_kind: 'attestation' },
                          { id: 'i2', label: 'Calendari de sessions definit i acceptat per ambdues parts', verification_kind: 'tdd' },
                      ] },
                ],
                presentationHints: { linearOrder: ['soc-2', 'soc-1'] },
            }), usage: { inputTokens: 500, outputTokens: 280 } };
        }
        if (user.includes('MAPA DE VALOR') || user.includes('Verna Allee') || user.includes('VNA')) {
            // Output realista per a value map
            return { text: JSON.stringify({
                roles: [
                    { id: 'cli', name: 'Client cohort', kind: 'human', castell_level: 'pom_de_dalt' },
                    { id: 'eq',  name: 'Equip facilitador', kind: 'collective', castell_level: 'tronc' },
                    { id: 'mn',  name: 'Mentor extern', kind: 'human', castell_level: 'laterals' },
                    { id: 'fnd', name: 'Fundadora', kind: 'human', castell_level: 'baixos' },
                ],
                transactions: [
                    { id: 'tx1', from: 'cli', to: 'eq',  deliverable: 'brief',    type: 'tangible' },
                    { id: 'tx2', from: 'eq',  to: 'cli', deliverable: 'report',   type: 'tangible' },
                    { id: 'tx3', from: 'mn',  to: 'eq',  deliverable: 'feedback', type: 'intangible' },
                    { id: 'tx4', from: 'fnd', to: 'eq',  deliverable: 'guidance', type: 'intangible' },
                ],
                deliverables: [
                    { id: 'brief',    name: 'Brief inicial cohort',     kind: 'doc' },
                    { id: 'report',   name: 'Report mensual cohort',    kind: 'doc' },
                    { id: 'feedback', name: 'Feedback mentor setmanal', kind: 'comm' },
                    { id: 'guidance', name: 'Guidance estratègic',      kind: 'comm' },
                ],
                valueMapVersion: 'v1.0',
            }), usage: { inputTokens: 600, outputTokens: 320 } };
        }
        // generate-wos fallback
        if (user.includes('WO') || user.includes('Work Order')) {
            return { text: JSON.stringify({ wos: [{ id: 'wo-1', title: 'Recollir feedback participants', status: 'todo' }] }), usage: { inputTokens: 250, outputTokens: 100 } };
        }
        // Generic JSON fallback
        return { text: '{}', usage: { inputTokens: 100, outputTokens: 20 } };
    };
    return { provider, calls };
}

const context = {
    name:        'cohort-mentoria-pilot',
    description: 'plataforma de mentoria per cohorts d\'emprenedoria social',
    sector:      'consultoria',
    vna_zoom:    'meso',
    entity_type: 'cooperative',
    lifecycle_stage: 'mvp',
};

// C.1 · run NEW path (useValueMapCycle = true · default)
const mockNew = makeMockProvider();
const outNew = await runExpertChain({
    context,
    generateWithProvider: mockNew.provider,
    maxCostEur: 2.0,
    useValueMapCycle: true,
    gapDetect: false,         // disable per evitar extra LLM calls al test
});
console.log('  · NEW cycle · socs:', outNew.socs?.length, '· sops:', outNew.sops?.length, '· degraded:', outNew.valueMapCycle?.degraded);
ok('C.1 · NEW · runExpertChain returns ok',              outNew && outNew.ok === true);
ok('C.1 · NEW · valueMap produced',                       !!outNew.valueMap && Array.isArray(outNew.valueMap.roles));
ok('C.1 · NEW · socs produced',                           Array.isArray(outNew.socs) && outNew.socs.length >= 2);
ok('C.1 · NEW · sops produced',                           Array.isArray(outNew.sops) && outNew.sops.length >= 1);
ok('C.1 · NEW · valueMapCycle metadata present',          !!outNew.valueMapCycle);
ok('C.1 · NEW · phasesRun inclou value-map-cycle',        outNew.phasesRun.includes('value-map-cycle'));
ok('C.1 · NEW · phases 6+7 marcades via-cycle',           outNew.phasesRun.some(p => p.includes('via-cycle-v159')));

// C.2 · shape eval scores · NEW
const newMapEval  = evaluateValueMapShape(outNew.valueMap);
const newSocsEval = evaluateSocsShape({ socs: outNew.socs });
const newSopsEval = evaluateSopsShape({ sops: outNew.sops });
console.log('  NEW · map score:',  newMapEval.score, '· socs:', newSocsEval.score, '· sops:', newSopsEval.score);
ok('C.2 · NEW · map shape eval ok=true',                  newMapEval.ok === true);
ok('C.2 · NEW · socs shape eval ok=true',                 newSocsEval.ok === true);
ok('C.2 · NEW · sops shape eval ok=true',                 newSopsEval.ok === true);
ok('C.2 · NEW · map score ≥ 70',                          newMapEval.score >= 70);
ok('C.2 · NEW · socs score ≥ 70',                         newSocsEval.score >= 70);
ok('C.2 · NEW · sops score ≥ 70',                         newSopsEval.score >= 70);

// C.3 · run OLD path (useValueMapCycle = false · legacy)
const mockOld = makeMockProvider();
const outOld = await runExpertChain({
    context,
    generateWithProvider: mockOld.provider,
    maxCostEur: 2.0,
    useValueMapCycle: false,
    gapDetect: false,
});
ok('C.3 · OLD · runExpertChain returns ok',               outOld && outOld.ok === true);
ok('C.3 · OLD · valueMap produced',                        !!outOld.valueMap);
ok('C.3 · OLD · NO valueMapCycle metadata',                !outOld.valueMapCycle);
ok('C.3 · OLD · phasesRun NO inclou value-map-cycle',      !outOld.phasesRun.includes('value-map-cycle'));

// C.4 · shape eval scores · OLD
const oldMapEval  = evaluateValueMapShape(outOld.valueMap);
const oldSocsEval = evaluateSocsShape({ socs: outOld.socs });
const oldSopsEval = evaluateSopsShape({ sops: outOld.sops });
console.log('  OLD · map score:',  oldMapEval.score, '· socs:', oldSocsEval.score, '· sops:', oldSopsEval.score);

// C.5 · comparativa · NEW ≥ OLD per a totes les fases
ok('C.5 · NEW map score ≥ OLD map score',                 newMapEval.score >= oldMapEval.score);
ok('C.5 · NEW socs score ≥ OLD socs score',               newSocsEval.score >= oldSocsEval.score);
ok('C.5 · NEW sops score ≥ OLD sops score',               newSopsEval.score >= oldSopsEval.score);

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
