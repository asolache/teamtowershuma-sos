// =============================================================================
// TEAMTOWERS SOS V11 — ORCHESTRATOR CHAIN + ROUTER + SOC VIEWS · TDD (PR-Q)
// Ruta · /js/tests/orchestratorChainRouter.test.js
//
// Blinda · 3 features ·
//   1 · promptTierRouter · mapping correcte taskKind → tier
//   2 · expertChainOrchestrator · 8 fases · skip flags · cost guard
//   3 · generate-socs-from-value-map · presentationHints (linear + castell + map)
// =============================================================================

import { pickTier, pickRoutingForTask, listAllRoutings, TASK_TO_TIER, estimateCostMultiplier } from '../core/promptTierRouter.js';
import { runExpertChain, listChainPhases, CHAIN_PHASES, EXPERT_CHAIN_VERSION } from '../core/expertChainOrchestrator.js';
import { buildPrompt } from '../core/vnaExpertPrompts.js';

let pass = 0, fail = 0;
function ok(label, cond, expected = '', got = '') {
    if (cond) { pass++; console.log('✓', label); }
    else {
        fail++;
        const detail = (expected !== '' || got !== '') ? ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})` : '';
        console.log('✗', label + detail);
    }
}

console.log('=== ORCHESTRATOR-CHAIN + ROUTER + SOC VIEWS (PR-Q) ===\n');

// ─── A · pickTier · routing per cada task ────────────────────────────
console.log('— A · promptTierRouter · mapping cost-aware');
ok('A · design-value-map-rich → reasoner', pickTier('design-value-map-rich') === 'reasoner');
ok('A · enrich-value-map (legacy) → reasoner', pickTier('enrich-value-map') === 'reasoner');
ok('A · generate-socs-from-value-map → reasoner', pickTier('generate-socs-from-value-map') === 'reasoner');
ok('A · classify-and-pick-socs → mid', pickTier('classify-and-pick-socs') === 'mid');
ok('A · generate-sops-with-skills → mid', pickTier('generate-sops-with-skills') === 'mid');
ok('A · personalize-landing → small (cheaper)', pickTier('personalize-landing') === 'small');
ok('A · unknown taskKind → mid fallback', pickTier('xxxx-unknown') === 'mid');
ok('A · pickRoutingForTask · returns routing string', typeof pickRoutingForTask('design-value-map-rich') === 'string');

// Cost multiplier
ok('A · reasoner cost 5×', estimateCostMultiplier('design-value-map-rich') === 5);
ok('A · mid cost 1×',      estimateCostMultiplier('classify-and-pick-socs') === 1);
ok('A · small cost 0.3×',  estimateCostMultiplier('personalize-landing') === 0.3);

// All 13 task kinds mapped
const allMapped = Object.keys(TASK_TO_TIER);
ok('A · ≥13 tasks mapped', allMapped.length >= 13, '≥13', allMapped.length);

// listAllRoutings shape
const routings = listAllRoutings();
ok('A · listAllRoutings retorna array de {task, tier, routing, costMultiplier}',
    Array.isArray(routings) && routings.length === allMapped.length &&
    routings.every(r => r.task && r.tier && r.routing && typeof r.costMultiplier === 'number'));

// ─── B · CHAIN_PHASES · 7 fases canòniques (v147 · landing post-chain template) ──
console.log('\n— B · expertChainOrchestrator · 7 fases canòniques (post v147)');
ok('B · 7 fases definides (era 8 · landing post-chain template)',
                                       CHAIN_PHASES.length === 7, 7, CHAIN_PHASES.length);
const phaseIds = CHAIN_PHASES.map(p => p.id);
// v147 · personalize-landing eliminat (ara post-chain via _buildLandingFromCanvasAndPitch)
for (const id of ['define-product-service', 'personalize-canvas', 'personalize-pitch', 'design-value-map-rich', 'generate-socs-from-value-map', 'generate-sops-with-skills', 'generate-wos-from-sop']) {
    ok('B · fase canonical ' + id, phaseIds.includes(id));
}
ok('B · sops és per-item (per cada SOC)', CHAIN_PHASES.find(p => p.id === 'generate-sops-with-skills')?.perItem === 'socs');
ok('B · wos és per-item (per cada SOP)',  CHAIN_PHASES.find(p => p.id === 'generate-wos-from-sop')?.perItem === 'sops');
ok('B · EXPERT_CHAIN_VERSION exportat',   typeof EXPERT_CHAIN_VERSION === 'string');

// ─── C · runExpertChain · mock provider · fases en ordre + outputs ────
console.log('\n— C · runExpertChain · execució amb mocked provider');
const events = [];
let callCount = 0;

const mockedProvider = async (modelKey, opts) => {
    callCount++;
    const u = opts.userPrompt;
    // Detect task per content + return matching JSON
    if (u.includes('IDENTIFICA EL PRODUCTE')) {
        return { text: JSON.stringify({ name: 'Pauta cures setmanal', kind: 'service', audience: 'famílies', valueProposition: 'X', differentiator: 'Y', revenueModel: 'subscription' }), usage: { inputTokens: 500, outputTokens: 80 } };
    }
    if (u.includes('IKIGAI + CANVAS')) {
        return { text: JSON.stringify({ ikigai: { loves: ['x'], goodAt: ['y'], worldNeeds: ['z'], paidFor: ['w'] }, vision: 'V', mission: 'M', values: ['a'], stakeholders: ['s'], northStar: 'NS', productService: { name: 'P', kind: 'service', differentiator: 'D' } }), usage: { inputTokens: 600, outputTokens: 100 } };
    }
    if (u.includes('PITCH PER INVERSORS')) {
        return { text: JSON.stringify({ headline: 'H', problem: 'P', solution: 'S', market: 'M', business: 'B', team: 'T' }), usage: { inputTokens: 600, outputTokens: 100 } };
    }
    if (u.includes('LANDING PÚBLICA')) {
        return { text: JSON.stringify({ hero: { title: 'T', subtitle: 'S', primaryCta: 'C' }, differentiator: { vsAlternatives: 'V', uniqueClaim: 'U' }, howItWorks: ['s1'], socialProof: 'SP', roadmap: [{ horizon: 'now', milestones: ['m1'] }], faq: [{ q: 'q1', a: 'a1' }] }), usage: { inputTokens: 700, outputTokens: 150 } };
    }
    if (u.includes('MAPA DE VALOR RIC')) {
        return { text: JSON.stringify({
            valueMapVersion: 'v1', thinking: 'T',
            roles: [{ id: 'r1', kind: 'founder', name: 'CTO Founder', description: 'X', castell_level: 'pom_de_dalt', level: 'macro', typical_actor: 'person' }],
            deliverables: [{ id: 'd1', name: 'Acta X', kind: 'tangible', producer: 'r1', consumers: ['r1'], validator: 'manual' }],
            transactions: [{ id: 'tx1', from: 'r1', to: 'r1', deliverable: 'd1', type: 'tangible', trigger: 'x', lead_time_hours: 2, cycle_time_hours: 1, wip_units: 1, frequency: 'weekly', reciprocates_with: null }],
            patterns_detected: ['cicle setmanal recíproc']
        }), usage: { inputTokens: 800, outputTokens: 300 } };
    }
    if (u.includes('GENERA SOCs') && u.includes('DERIVATS DEL MAPA DE VALOR')) {
        return { text: JSON.stringify({
            socs: [
                { id: 'soc-1', name: 'Cicle setmanal cures', purpose: 'P', phase: 'mvp', level: 'meso', order_index: 0, transaction_refs: ['tx1'], involved_roles: ['r1'], outcomes: ['o1'], checklist: [{ id: 'i1', label: 'Acta signada', required: true, verification_kind: 'manual-review', sop_ref: null }] },
            ],
            presentationHints: {
                linearOrder: ['soc-1'],
                castellGrouping: { pom_de_dalt: ['soc-1'], tronc: [], pinya: [], laterals: [], mans: [], baixos: [] },
                deliverableSequence: ['d1'],
                mapClustering: { 'cluster-a': { label: 'Operació', soc_ids: ['soc-1'], color_hint: '#22c55e' } }
            }
        }), usage: { inputTokens: 900, outputTokens: 400 } };
    }
    if (u.includes('GENERA SOPs')) {
        return { text: JSON.stringify({ sops: [{ id: 'sop-1', role_ref: 'r1', title: 'SOP X', purpose: 'P', soc_item_ref: 'i1', steps: [{ id: 's1', label: 'a', deliverable_kind: 'doc', approval_rule: 'manual', role_kind: 'human', duration_minutes: 30, skills: ['sk1'] }] }] }), usage: { inputTokens: 700, outputTokens: 200 } };
    }
    if (u.includes('Genera Work Orders')) {
        return { text: JSON.stringify({ wos: [{ id: 'wo-1', title: 'WO X', description: 'd', sop_ref: 'sop-1', step_refs: ['s1'], assignee_role: 'r1', deliverable_kind: 'doc', approval_rule: 'manual', estimated_hours: 1, dtd_test: 'test' }] }), usage: { inputTokens: 500, outputTokens: 150 } };
    }
    return { text: '{}', usage: { inputTokens: 100, outputTokens: 10 } };
};

const result = await runExpertChain({
    context: { name: 'Coop Cures', description: 'cooperat cures', sector: 'Q', entity_type: 'organization', lifecycle_stage: 'mvp', vna_zoom: 'meso' },
    generateWithProvider: mockedProvider,
    preferredProvider: null,
    maxCostEur: 1.0,
    onEvent: (e) => events.push(e),
});

ok('C · result.ok',                  result.ok === true);
ok('C · result.productService present', !!result.productService);
ok('C · result.canvas present',         !!result.canvas);
ok('C · result.pitch present',          !!result.pitch);
ok('C · result.landing present',        !!result.landing);
ok('C · result.valueMap present',       !!result.valueMap);
ok('C · result.socs.length ≥1',         result.socs.length >= 1);
ok('C · result.sops.length ≥1',         result.sops.length >= 1);
ok('C · result.wos.length ≥1',          result.wos.length >= 1);
ok('C · ≥8 phases ran (1 per fase + 2 per-item)', result.phasesRun.length >= 8, '≥8', result.phasesRun.length);
ok('C · costTotal >0',                  result.costTotal > 0);
ok('C · presentationHints present',     !!result.presentationHints);
ok('C · presentationHints.linearOrder soc-1', JSON.stringify(result.presentationHints?.linearOrder) === JSON.stringify(['soc-1']));
ok('C · presentationHints.castellGrouping pom_de_dalt', Array.isArray(result.presentationHints?.castellGrouping?.pom_de_dalt));

// Events emitted
const phaseDoneEvents = events.filter(e => e.step === 'phase' && e.status === 'done');
ok('C · ≥6 phase-done events emesos', phaseDoneEvents.length >= 6, '≥6', phaseDoneEvents.length);
ok('C · finish event emès',           events.some(e => e.step === 'finish'));

// ─── D · skip flags · salta fases concretes ────────────────────────
console.log('\n— D · skip flags · salta fases');
const events2 = [];
const result2 = await runExpertChain({
    context: { name: 'Test skip', description: 'd', sector: 'M', entity_type: 'organization', lifecycle_stage: 'idea', vna_zoom: 'macro' },
    generateWithProvider: mockedProvider,
    skip: { landing: true, wos: true },
    onEvent: (e) => events2.push(e),
});
// v147 · landing eliminat de CHAIN_PHASES · ara és post-chain template ·
// skip.landing salta el template generation (result.landing queda null)
ok('D · landing skip salta template post-chain', result2.landing === null);
ok('D · wos SKIPPED (no és present)',         result2.phasesSkipped.includes('generate-wos-from-sop'));
ok('D · result2.wos.length === 0',            result2.wos.length === 0);
// Però la resta funcionen
ok('D · result2.productService present',      !!result2.productService);
ok('D · result2.valueMap present',            !!result2.valueMap);

// ─── E · budget guard · atura si supera maxCostEur ────────────────
console.log('\n— E · budget guard');
// Provider que retorna usage molt alt (per provocar cost ràpid)
const expensiveProvider = async (modelKey, opts) => {
    const txt = mockedProvider.toString();   // fallback if no match
    const r = await mockedProvider(modelKey, opts);
    return { ...r, usage: { inputTokens: 100000, outputTokens: 50000 } };   // huge
};
const result3 = await runExpertChain({
    context: { name: 'Budget test', description: 'd', sector: 'M', entity_type: 'organization', lifecycle_stage: 'mvp', vna_zoom: 'meso' },
    generateWithProvider: expensiveProvider,
    maxCostEur: 0.5,   // límit baix
    onEvent: () => {},
});
ok('E · cost atura execució abans del final', result3.costTotal <= 1.0 || result3.phasesRun.length < 8);

// ─── F · generate-socs-from-value-map · presentationHints al prompt ────
console.log('\n— F · prompt generate-socs té presentationHints schema');
const pSocs = buildPrompt({
    taskKind: 'generate-socs-from-value-map',
    context: {
        name: 'X', sector: 'M', lifecycle_stage: 'mvp', vna_zoom: 'meso',
        value_map: { roles: [{ id: 'r1', name: 'R', kind: 'founder' }], deliverables: [{ id: 'd1', name: 'D', kind: 'tangible' }], transactions: [{ id: 'tx1', from: 'r1', to: 'r1', deliverable: 'd1', type: 'tangible' }] },
    },
});
ok('F · prompt menciona "VISTES DEL SOS"',     pSocs.user.includes('VISTES DEL SOS'));
ok('F · prompt menciona "mapView"',            pSocs.user.includes('mapView'));
ok('F · prompt menciona "castellView"',        pSocs.user.includes('castellView'));
ok('F · prompt menciona "linearView"',         pSocs.user.includes('linearView'));
ok('F · prompt vocabulari procés=SOC',         pSocs.user.includes('procés') && pSocs.user.includes('SOC'));
ok('F · output schema · presentationHints',    pSocs.user.includes('"presentationHints"'));
ok('F · output schema · linearOrder',          pSocs.user.includes('linearOrder'));
ok('F · output schema · castellGrouping (6 nivells)',
    pSocs.user.includes('"pom_de_dalt"') && pSocs.user.includes('"tronc"') && pSocs.user.includes('"pinya"') &&
    pSocs.user.includes('"laterals"') && pSocs.user.includes('"mans"') && pSocs.user.includes('"baixos"'));
ok('F · output schema · deliverableSequence',  pSocs.user.includes('deliverableSequence'));
ok('F · output schema · mapClustering',        pSocs.user.includes('mapClustering'));
ok('F · output schema · order_index per SOC',  pSocs.user.includes('"order_index"'));
ok('F · output schema · transaction_refs',     pSocs.user.includes('"transaction_refs"'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
