// PITCH-REFRAME-001 sprint A · tests pure (sense IA real)
import {
    buildSynthesisContext, buildSynthesisPrompt, buildHeuristicPitch,
    PITCH_TONE_BY_STAGE, PITCH_SYNTHESIS_VERSION,
} from '../core/pitchSynthesisService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== PITCH-REFRAME-001 sprint A · pitchSynthesisService ===\n');

// 1 · Constants
t(typeof PITCH_SYNTHESIS_VERSION === 'string',           'A · version exported');
t(PITCH_TONE_BY_STAGE.idea,                              'A · idea tone defined');
t(PITCH_TONE_BY_STAGE.growth,                            'A · growth tone defined');
t(PITCH_TONE_BY_STAGE.maturity,                          'A · maturity tone defined');

// 2 · buildSynthesisContext · happy path
const project = {
    id: 'proj-test',
    nombre: 'Cooperativa Test',
    sector_id: 'tech-coop',
    description: 'Test description',
    purpose: 'Test purpose',
    aiClassification: { project_type: 'cooperativa-multi', lifecycle_stage: 'mvp', scale: 'regional' },
    vna_roles: [{ id: 'r1' }, { id: 'r2' }],
    vna_transactions: [
        { id: 't1', type: 'tangible' },
        { id: 't2', type: 'tangible' },
        { id: 't3', type: 'intangible' },
    ],
};
const canvas = {
    steps: {
        vision:       { value: 'En 5 anys 1000 coops' },
        mission:      { value: 'Donem eines' },
        values:       { value: 'transparència · coop' },
        stakeholders: { value: 'fundadors · clients' },
        'north-star': { value: 'MAU' },
    },
};
const ledger = [
    { content: { creditAccount: 'revenue', amount: 1000 } },
    { content: { debitAccount: 'expenses', amount: 300 } },
];
const invoices = [
    { content: { status: 'paid', totals: { gross: 1200 } } },
];
const proposals = [
    { content: { status: 'accepted', deliverables: [{ price: 800 }, { price: 200 }] } },
    { content: { status: 'sent' } },
];

const ctx = buildSynthesisContext({ project, canvas, ledger, invoices, proposals });
eq(ctx.projectName, 'Cooperativa Test',                  'B · projectName');
eq(ctx.classification.stage, 'mvp',                      'B · stage from classification');
eq(ctx.classification.type, 'cooperativa-multi',         'B · type');
eq(ctx.canvas.vision, 'En 5 anys 1000 coops',            'B · vision extracted');
eq(ctx.vna.roleCount, 2,                                 'B · 2 roles');
eq(ctx.vna.tangibleCount, 2,                             'B · 2 tangible');
eq(ctx.vna.intangibleCount, 1,                           'B · 1 intangible');
eq(ctx.ledger.totalRevenue, 1000,                        'B · revenue 1000');
eq(ctx.ledger.totalExpenses, 300,                        'B · expenses 300');
eq(ctx.ledger.profit, 700,                               'B · profit 700');
eq(ctx.traction.paidInvoicesCount, 1,                    'B · 1 paid invoice');
eq(ctx.traction.paidRevenueEur, 1200,                    'B · paid 1200');
eq(ctx.traction.acceptedProposalsCount, 1,               'B · 1 accepted proposal');
eq(ctx.traction.acceptedRevenueEur, 1000,                'B · accepted 1000');

// 3 · errors
try { buildSynthesisContext({}); t(false, 'B · no project · throws'); }
catch (_) { t(true, 'B · no project · throws'); }

// 4 · buildSynthesisPrompt · ho conté tot
const prompt = buildSynthesisPrompt(ctx);
t(prompt.includes('Cooperativa Test'),                   'C · prompt has project name');
t(prompt.includes('mvp'),                                'C · prompt has stage');
t(prompt.includes('tech-coop'),                          'C · prompt has sector');
t(prompt.includes('1000 coops'),                         'C · prompt has vision');
t(prompt.includes('JSON'),                               'C · prompt demands JSON');
t(prompt.includes('1200'),                               'C · prompt has paid invoice amount');
t(prompt.includes('tagline'),                            'C · prompt has tagline key');
t(prompt.includes('hero'),                               'C · prompt has hero key');
t(prompt.includes('vision'),                             'C · prompt has vision key');

// 5 · Lang options
const promptEn = buildSynthesisPrompt(ctx, { lang: 'en' });
t(promptEn.includes('anglès'),                           'C · english lang');

// 6 · buildHeuristicPitch · fallback sense IA
const heuristic = buildHeuristicPitch(ctx);
t(heuristic && heuristic.tagline,                        'D · heuristic produces tagline');
t(heuristic.vision === ctx.canvas.vision,                'D · heuristic vision from canvas');
t(heuristic.version.includes('heuristic'),               'D · heuristic version marker');
t(heuristic.traction.includes('1') || heuristic.traction.includes('paid'), 'D · heuristic traction usa numbers');

const heuristicIdea = buildHeuristicPitch({
    projectName: 'Idea',
    classification: { stage: 'idea' },
    canvas: {},
    vna: { roleCount: 0, tangibleCount: 0, intangibleCount: 0 },
    traction: { paidInvoicesCount: 0, paidRevenueEur: 0 },
    ledger: {},
});
t(heuristicIdea.ask.includes('partners') || heuristicIdea.ask.includes('mentors'),
   'D · idea stage ask focuses partners/mentors');

const heuristicGrowth = buildHeuristicPitch({
    projectName: 'Growing',
    classification: { stage: 'growth' },
    canvas: {},
    vna: { roleCount: 5, tangibleCount: 3, intangibleCount: 2 },
    traction: { paidInvoicesCount: 5, paidRevenueEur: 10000 },
    ledger: {},
});
t(heuristicGrowth.ask.includes('inversió') || heuristicGrowth.ask.includes('escalat'),
   'D · growth stage ask focuses inversion');

// 7 · null context
eq(buildHeuristicPitch(null), null,                      'D · null ctx · null result');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
