// IA-CONTEXT-001 sprint A · tests stand-alone per iaContextService + aiFillService
// Ús: node js/tests/iaFill.test.js

import * as ctx from '../core/iaContextService.js';
import * as fill from '../core/aiFillService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== IA-CONTEXT-001 sprint A · context builders + aiFillDim ===\n');

// ─── Fixtures ────────────────────────────────────────────────────────────
const project = {
    id: 'proj-test-1',
    nombre: 'Test Project',
    sector_id: 'A',
    description: 'Project that helps users do X with Y',
    purpose: 'Demonstrate the SOS method',
    vna_roles: [
        { id: 'r1', name: 'Alpha', castell_level: 'baixos', description: 'd1', typical_actor: 'a1' },
        { id: 'r2', name: 'Beta',  castell_level: 'tronc' },
    ],
    vna_transactions: [
        { id: 'tx1', from: 'r1', to: 'r2', deliverable: 'platform', type: 'tangible' },
    ],
};
const sops      = [{ id: 's1', type: 'sop',      content: { projectId: 'proj-test-1', roleId: 'r1', body: 'x'.repeat(50) } }];
const workshops = [{ id: 'w1', type: 'workshop', content: { projectId: 'proj-test-1', audience: 'founders' } }];
const market    = [{ id: 'm1', type: 'market_item', content: { projectId: 'proj-test-1', title: 'Mentoria' } }];

// ─── A · DIM_BUILDERS + DIM_TO_TASK_KIND ────────────────────────────────
t(typeof ctx.DIM_BUILDERS  === 'object',                              'A · DIM_BUILDERS exportat');
t(Object.keys(ctx.DIM_BUILDERS).length === 5,                         'A · 5 dim builders');
eq(ctx.DIM_TO_TASK_KIND.landing,      'creative-narrative',           'A · landing → creative-narrative');
eq(ctx.DIM_TO_TASK_KIND.valueMap,     'value-map-design',             'A · valueMap → value-map-design');
eq(ctx.DIM_TO_TASK_KIND.sops,         'sop-structured',               'A · sops → sop-structured');

// ─── B · buildLandingContext ────────────────────────────────────────────
const landing = ctx.buildLandingContext({ project, marketItems: market });
t(typeof landing.systemPrompt === 'string' && landing.systemPrompt.length > 50, 'B · systemPrompt no buit');
t(typeof landing.userPrompt   === 'string' && landing.userPrompt.includes('Test Project'), 'B · userPrompt conté nom projecte');
t(landing.userPrompt.includes('Mentoria'),                            'B · userPrompt conté el market item');
t(landing.contextTokens > 0,                                          'B · contextTokens estimat > 0');
eq(landing.dim, 'landing',                                            'B · dim = landing');
t(Array.isArray(landing.refs) && landing.refs.length >= 1,            'B · refs array no buit');

// ─── C · buildValueMapContext · roles+tx incloses ────────────────────────
const vmap = ctx.buildValueMapContext({ project });
t(vmap.userPrompt.includes('Alpha'),                                  'C · vmap · role Alpha al prompt');
t(vmap.userPrompt.includes('r1→r2'),                                  'C · vmap · tx r1→r2 al prompt');
eq(vmap.dim, 'valueMap',                                              'C · dim = valueMap');

// ─── D · buildDeliverablesContext · llista roles sense entregable ────────
const deliv = ctx.buildDeliverablesContext({ project });
// r1 té entregable (tx1) · r2 no → al prompt ha de sortir r2
t(deliv.userPrompt.includes('r2'),                                    'D · deliverables · role sense entregable detectat');
eq(deliv.dim, 'deliverables',                                         'D · dim = deliverables');

// ─── E · buildSopsContext · roles sense SOP ──────────────────────────────
const sopsCtx = ctx.buildSopsContext({ project, sops });
// r1 té SOP · r2 no → ha de sortir r2 al prompt
t(sopsCtx.userPrompt.includes('r2'),                                  'E · sops · role sense SOP detectat');
t(/Roles que necessiten SOP \(1\/2\)|Roles que necessiten SOP \(1\)/.test(sopsCtx.userPrompt), 'E · sops · counts coherents (1 missing / 2 totals)');
eq(sopsCtx.dim, 'sops',                                               'E · dim = sops');

// ─── F · buildWorkshopsContext ──────────────────────────────────────────
const wsCtx = ctx.buildWorkshopsContext({ project, workshops });
t(wsCtx.userPrompt.includes('founders'),                              'F · workshops · audience existing detectada');
eq(wsCtx.dim, 'workshops',                                            'F · dim = workshops');

// ─── G · buildContextForDim · dispatcher ────────────────────────────────
const dispatched = ctx.buildContextForDim('landing', { project, marketItems: market });
eq(dispatched.dim, 'landing',                                         'G · dispatcher · dim correcte');

let threw = null;
try { ctx.buildContextForDim('unknown', { project }); } catch (e) { threw = e; }
t(threw && /desconegut/.test(threw.message),                          'G · dispatcher · dim invàlid throw');

// ─── H · buildXxxContext · sense project · throw ─────────────────────────
threw = null;
try { ctx.buildLandingContext({}); } catch (e) { threw = e; }
t(threw && /requires project/.test(threw.message),                    'H · landing sense project · throw');

// ─── I · aiFillDim · mock provider + loadContext ────────────────────────
const mockProvider = async (modelKey, payload) => ({
    text: JSON.stringify({
        description: 'Generated description longer than 60 characters for landing dim test fixture.',
        productSuggestions: [],
        presentationNarrative: '# Hero\n\nGenerated.',
    }),
    usage: { inputTokens: 500, outputTokens: 200 },
    modelKey,
    finishReason: 'end_turn',
});
const mockLoad = async ({ projectId }) => ({ project, sops, workshops, marketItems: market });

let auditPersistedWith = null;
const mockAudit = async (args) => {
    auditPersistedWith = args;
    return 'ai-audit-mock-1';
};

const result = await fill.aiFillDim({
    projectId:    'proj-test-1',
    dimId:        'landing',
    loadContext:  mockLoad,
    provider:     mockProvider,
    persistAudit: mockAudit,
});
eq(result.dimId,         'landing',                                   'I · result.dimId');
eq(result.auditId,       'ai-audit-mock-1',                           'I · result.auditId');
t(result.draft && result.draft.includes('Generated description'),     'I · result.draft conté output');
t(result.parsedDraft && result.parsedDraft.description,               'I · parsedDraft · description present');
t(result.totalCostUsd > 0,                                            'I · totalCostUsd > 0');
t(result.totalCostEur > 0,                                            'I · totalCostEur > 0');
t(result.modelKey,                                                    'I · modelKey informat');
t(Array.isArray(result.refs),                                         'I · refs propagat');
t(auditPersistedWith && auditPersistedWith.dimId === 'landing',       'I · persistAudit cridat amb dim');

// ─── J · aiFillDim · provider falla primary · escalate ──────────────────
let callCount = 0;
const escalatingProvider = async (modelKey, payload) => {
    callCount++;
    if (callCount === 1) {
        // primer cop · retorna JSON invàlid · evaluator rebutja · escalate
        return { text: 'not valid json', usage: { inputTokens: 100, outputTokens: 20 }, modelKey, finishReason: 'end_turn' };
    }
    return {
        text: JSON.stringify({ description: 'd'.repeat(80), productSuggestions: [], presentationNarrative: 'x' }),
        usage: { inputTokens: 100, outputTokens: 20 },
        modelKey, finishReason: 'end_turn',
    };
};
const r2 = await fill.aiFillDim({
    projectId:    'proj-test-1',
    dimId:        'landing',
    loadContext:  mockLoad,
    provider:     escalatingProvider,
    persistAudit: async () => 'a',
});
t(callCount >= 2,                                                     'J · provider cridat ≥2 cops (escalate)');
t(r2.draft && r2.draft.includes('"description"'),                     'J · draft final · JSON parseable');

// ─── K · aiFillDim · dimId invàlid · throw ──────────────────────────────
threw = null;
try {
    await fill.aiFillDim({ projectId: 'p', dimId: 'unknown', loadContext: mockLoad, provider: mockProvider, persistAudit: async () => 'a' });
} catch (e) { threw = e; }
t(threw && /taskKind/.test(threw.message),                            'K · dimId invàlid · throw');

// ─── L · makeJsonShapeEvaluator ─────────────────────────────────────────
import * as prov from '../core/aiProviderService.js';
const evOk = prov.makeJsonShapeEvaluator(['description']);
const r3 = await evOk({ text: JSON.stringify({ description: 'long ok' }) });
t(r3.ok && r3.score === 1.0,                                          'L · JSON OK · ok=true score=1.0');

const r4 = await evOk({ text: JSON.stringify({ other: 1 }) });
t(!r4.ok && /missing-field/.test(r4.reason),                          'L · missing-field detectat');

const r5 = await evOk({ text: 'not json' });
t(!r5.ok && /not-json/.test(r5.reason),                               'L · not-json detectat');

const r6 = await evOk({ text: '```json\n{"description":"in fenced"}\n```' });
t(r6.ok,                                                              'L · fenced ```json``` parsed');

const r7 = await evOk(null);
t(!r7.ok && /empty/.test(r7.reason),                                  'L · null output · empty-output');

// IA-CONTEXT-001 sprint C · spec objecte amb minStringLength/minArrayLength
const evStrict = prov.makeJsonShapeEvaluator([{ name: 'description', minStringLength: 60 }]);
const tooShort = await evStrict({ text: JSON.stringify({ description: 'too short' }) });
t(!tooShort.ok && /string-too-short/.test(tooShort.reason),           'L · spec · minStringLength rebutja string curta');

const longEnough = await evStrict({ text: JSON.stringify({ description: 'x'.repeat(80) }) });
t(longEnough.ok,                                                      'L · spec · minStringLength acceptat amb 80 chars');

const evArr = prov.makeJsonShapeEvaluator([{ name: 'newSops', minArrayLength: 1 }]);
const emptyArr = await evArr({ text: JSON.stringify({ newSops: [] }) });
t(!emptyArr.ok && /array-too-short/.test(emptyArr.reason),            'L · spec · minArrayLength rebutja array buit');

const filledArr = await evArr({ text: JSON.stringify({ newSops: [{ roleId: 'r1' }] }) });
t(filledArr.ok,                                                       'L · spec · minArrayLength acceptat amb 1 element');

// IA-CONTEXT-001 sprint C · evaluator robust a markdown extra al voltant del JSON
const evRobust = prov.makeJsonShapeEvaluator(['description']);
const wrapped = await evRobust({ text: 'Aquí tens el JSON:\n\n{"description":"valid"}\n\nEspero ajudi.' });
t(wrapped.ok,                                                         'L · spec · extreu JSON envoltat de text');

// ─── M · setApiKeyResolver injectable ───────────────────────────────────
prov._resetApiKeyCache();
prov.setApiKeyResolver((provider) => provider === 'anthropic' ? 'sk-ant-test-mock' : null);
// Recover · l'API key resolver passa el provider correcte. No fem la crida
// real al endpoint (calria mock fetch · es valida via tests d'integració).
t(typeof prov.setApiKeyResolver === 'function',                       'M · setApiKeyResolver és funció');
prov.setApiKeyResolver(null);   // reset

// ─── N · IA-CONTEXT-001 sprint B · extraContext propagat ────────────────
const landingPlain = ctx.buildLandingContext({ project, marketItems: market });
t(!landingPlain.userPrompt.includes('## Context addicional'),         'N · sense extraContext · cap secció');
t(landingPlain.hasExtraContext === false,                             'N · sense extraContext · hasExtraContext=false');

const landingCtx = ctx.buildLandingContext({
    project, marketItems: market,
    extraContext: 'A document explaining the brand voice and key markets.',
});
t(landingCtx.userPrompt.includes('## Context addicional'),            'N · amb extraContext · secció present');
t(landingCtx.userPrompt.includes('brand voice'),                      'N · contingut propagat al userPrompt');
t(landingCtx.hasExtraContext === true,                                'N · hasExtraContext=true');

// Truncació · 3000 chars → max 2000
const longCtx = 'X'.repeat(3000);
const truncCtx = ctx.buildLandingContext({ project, marketItems: market, extraContext: longCtx });
t(truncCtx.userPrompt.includes('XXX'),                                'N · long ctx · primera part inclosa');
t(truncCtx.userPrompt.includes('…'),                                  'N · long ctx · marcador truncat present');

// Empty string ignored
const emptyCtx = ctx.buildLandingContext({ project, marketItems: market, extraContext: '   ' });
t(!emptyCtx.userPrompt.includes('## Context addicional'),             'N · whitespace-only · secció no inclosa');
t(emptyCtx.hasExtraContext === false,                                 'N · whitespace-only · hasExtraContext=false');

// Tots 5 builders propaguen extraContext consistent
for (const dimId of ['landing', 'valueMap', 'deliverables', 'sops', 'workshops']) {
    const r = ctx.buildContextForDim(dimId, {
        project, sops, workshops, marketItems: market,
        extraContext: 'shared context note ABC123',
    });
    t(r.userPrompt.includes('ABC123'),                                'N · ' + dimId + ' · extraContext propagat');
    t(r.hasExtraContext === true,                                     'N · ' + dimId + ' · hasExtraContext=true');
}

// aiFillDim · extraContext arriba al builder via opts
let observedCtx = null;
const inspectProvider = async (modelKey) => {
    observedCtx = arguments;   // no funciona en arrow · fem-ho via closure abaix
    return { text: JSON.stringify({ description: 'd'.repeat(80), productSuggestions: [], presentationNarrative: 'x' }), usage:{inputTokens:1,outputTokens:1}, modelKey, finishReason:'end_turn' };
};
let lastPrompt = null;
const promptCaptureProvider = async (modelKey, payload) => {
    lastPrompt = payload.userPrompt;
    return { text: JSON.stringify({ description: 'd'.repeat(80), productSuggestions: [], presentationNarrative: 'x' }), usage:{inputTokens:1,outputTokens:1}, modelKey, finishReason:'end_turn' };
};
const mockLoadN = async () => ({ project, sops, workshops, marketItems: market });
const rN = await fill.aiFillDim({
    projectId:    'proj-test-1',
    dimId:        'landing',
    extraContext: 'INJECTED-N-MARKER',
    loadContext:  mockLoadN,
    provider:     promptCaptureProvider,
    persistAudit: async () => 'a',
});
t(lastPrompt && lastPrompt.includes('INJECTED-N-MARKER'),             'N · aiFillDim · extraContext arriba al provider');

// EXTRA_CONTEXT_MAX_CHARS exportat
t(typeof ctx.EXTRA_CONTEXT_MAX_CHARS === 'number' && ctx.EXTRA_CONTEXT_MAX_CHARS >= 1000, 'N · EXTRA_CONTEXT_MAX_CHARS exportat (≥1000)');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
