// B-UNIFIED-FORM-001 sprint A · tests pure
import {
    buildCreationPlan,
    estimatePlanCost,
    AMBITION_LEVELS, UNIFIED_VERSION,
} from '../core/unifiedProjectCreationService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== B-UNIFIED-FORM-001 sprint A · unifiedProjectCreationService ===\n');

// 1 · Constants
t(typeof UNIFIED_VERSION === 'string',                   'A · version');
eq(Object.keys(AMBITION_LEVELS).length, 3,               'A · 3 ambition levels');
t(AMBITION_LEVELS.light,                                 'A · light');
t(AMBITION_LEVELS.standard,                              'A · standard');
t(AMBITION_LEVELS.max,                                   'A · max');

// 2 · buildCreationPlan happy path
const plan = buildCreationPlan({
    name: 'Test Coop',
    description: 'Cooperativa multi-stakeholder en tech',
    sector: 'tech',
    ambition: 'standard',
});
eq(plan.name, 'Test Coop',                               'B · name set');
eq(plan.ambition, 'standard',                            'B · standard ambition');
eq(plan.stepsToRun.length, 3,                            'B · 3 fan-out steps for standard');
t(plan.stepsToRun.includes('canvas'),                    'B · canvas in steps');
t(plan.stepsToRun.includes('vna'),                       'B · vna in steps');
t(plan.stepsToRun.includes('sops'),                      'B · sops in steps');
eq(plan.classification, null,                            'B · classification null by default');

// 3 · ambition light · 1 step
const planLight = buildCreationPlan({ name: 'Quick', ambition: 'light' });
eq(planLight.stepsToRun.length, 1,                       'B · light · 1 step');
eq(planLight.stepsToRun[0], 'canvas',                    'B · light · only canvas');

// 4 · ambition max · 5 steps + quality tier
const planMax = buildCreationPlan({ name: 'Big', ambition: 'max' });
eq(planMax.stepsToRun.length, 5,                         'B · max · 5 steps');
eq(planMax.ambitionDef.tier, 'quality',                  'B · max · quality tier');
t(planMax.stepsToRun.includes('tokenomics'),             'B · max · includes tokenomics');
t(planMax.stepsToRun.includes('workshops'),              'B · max · includes workshops');

// 5 · errors
try { buildCreationPlan({}); t(false, 'B · no name · throws'); }
catch (_) { t(true, 'B · no name · throws'); }
try { buildCreationPlan({ name: 'X', ambition: 'inventat' }); t(false, 'B · bad ambition · throws'); }
catch (_) { t(true, 'B · bad ambition · throws'); }

// 6 · Classification pre-injected
const planClassified = buildCreationPlan({
    name: 'Already classified',
    classification: { project_type: 'cooperativa-multi', lifecycle_stage: 'mvp' },
});
t(planClassified.classification,                         'B · classification preserved');
eq(planClassified.classification.project_type, 'cooperativa-multi', 'B · type preserved');

// 7 · estimatePlanCost
const costLight = estimatePlanCost(planLight);
t(typeof costLight === 'number' && costLight > 0,        `C · light cost · ${costLight}`);

const costStandard = estimatePlanCost(plan);
t(costStandard > costLight,                              'C · standard cost > light');

const costMax = estimatePlanCost(planMax);
t(costMax > costStandard,                                'C · max cost > standard');

eq(estimatePlanCost(null), 0,                            'C · null plan · 0');

// 8 · Tier mapping per ambition
eq(AMBITION_LEVELS.light.tier, 'draft',                  'D · light → draft');
eq(AMBITION_LEVELS.standard.tier, 'draft',               'D · standard → draft');
eq(AMBITION_LEVELS.max.tier, 'quality',                  'D · max → quality');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
