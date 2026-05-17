// =============================================================================
// TEAMTOWERS SOS V11 — DOMAIN PACKS EXPANDED + MULTI + LLM + TELEMETRY · TDD (v127)
// Ruta · /js/tests/domainPacksExpanded.test.js
// =============================================================================

import {
    DOMAIN_PACKS, DOMAIN_IDS,
    detectDomain, detectDomainsMulti, combineDetections, listDomains, getDomainPack,
} from '../core/domainDetector.js';
import {
    buildDomainDetectionPrompt, parseDetectionResponse, detectDomainViaLLM, detectDomainSmart,
    __test_helpers__ as llmHelpers,
} from '../core/domainDetectorLLM.js';
import {
    recordDetection, summarizeDetections, detectionsByDomain, TELEMETRY_EVENT_TYPE,
} from '../core/domainTelemetry.js';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== DOMAIN PACKS EXPANDED + MULTI + LLM + TELEMETRY (v127) ===\n');

// ─── A · 6 packs nous ──────────────────────────────────────────────────
console.log('— A · 6 packs nous (religious · political · art · worker-coop · research · maker)');
for (const id of ['religious-community', 'political-movement', 'art-collective', 'worker-coop', 'research-lab', 'maker-space']) {
    ok('A · pack ' + id + ' present',     DOMAIN_PACKS[id] != null);
    ok('A · ' + id + ' té ≥ 7 arquetip',  DOMAIN_PACKS[id].archetypes.length >= 7);
    ok('A · ' + id + ' té intangibles',   DOMAIN_PACKS[id].intangibles.length >= 2);
    ok('A · ' + id + ' té patterns',      DOMAIN_PACKS[id].patterns.length >= 2);
}
ok('A · DOMAIN_IDS total ≥ 10 packs',     DOMAIN_IDS.length >= 10);

// ─── B · detecció dels 6 nous casos ────────────────────────────────────
console.log('\n— B · detecció casos reals');
const cases = [
    { name: 'Parròquia Sant Just',  desc: 'Comunitat religiosa cristiana de base · misses dominicals · catequesi',           sector: 'R', expect: 'religious-community' },
    { name: 'Sufí Tariqa',          desc: 'Sangha sufí amb monjo guia · retir mensual',                                       sector: 'R', expect: 'religious-community' },
    { name: 'PAH Sant Adrià',       desc: 'Moviment social per al dret a l\'habitatge · stop desnonaments · assemblea oberta', sector: 'S', expect: 'political-movement' },
    { name: 'Sindicat de Llogateres',desc:'Sindicat de lluita pel dret habitatge · mobilització · piquets · activist',        sector: 'S', expect: 'political-movement' },
    { name: 'La Caldera',           desc: 'Col·lectiu d\'artistes plàstiques · taller compartit · open studios anual',         sector: 'R', expect: 'art-collective' },
    { name: 'Pa de Pagès SCCL',     desc: 'Cooperativa de treball associat · 8 sòcies treballadores · forn artesà · sccl',     sector: 'C', expect: 'worker-coop' },
    { name: 'Lab Cosmologia ICCUB', desc: 'Grup de recerca en cosmologia · 4 postdocs + 8 doctorands · grants ERC',            sector: 'M', expect: 'research-lab' },
    { name: 'Fab Lab Barcelona',    desc: 'Maker space comunitari · impressores 3D · CNC · taller obert membres',              sector: 'P', expect: 'maker-space' },
];
for (const tc of cases) {
    const d = detectDomain({ name: tc.name, description: tc.desc, sector: tc.sector });
    ok('B · "' + tc.name + '" → ' + tc.expect, d?.domain === tc.expect);
}

// ─── C · detectDomainsMulti + combineDetections ────────────────────────
console.log('\n— C · multi-domain · híbrid');
const hybridMulti = detectDomainsMulti({
    name: 'Parròquia · Escola Lliure',
    description: 'Comunitat religiosa que gestiona una escola lliure amb mestres acompanyants',
    sector: 'P',
    topN: 2,
});
ok('C · multi · 2 dominis detectats',      hybridMulti.length === 2);
ok('C · top conté religious o edu',
   hybridMulti.some(d => d.domain === 'religious-community') &&
   hybridMulti.some(d => d.domain === 'edu-formation'));

const combined = combineDetections(hybridMulti);
ok('C · combined.composite = true',         combined?.composite === true);
ok('C · combined.components té 2',          combined?.components?.length === 2);
ok('C · combined arquetip · dedup · té ambdues sources',
   combined.archetypes.some(a => a.id === 'spiritual-leader') &&
   combined.archetypes.some(a => a.id === 'teacher'));
ok('C · combined label conté " + "',        combined.label.includes(' + '));

ok('C · combineDetections amb 1 sol · retorna directament', combineDetections([hybridMulti[0]]).composite === undefined);
ok('C · combineDetections amb 0 · null',                    combineDetections([]) === null);

// ─── D · LLM detector · pure helpers ──────────────────────────────────
console.log('\n— D · LLM detector · prompt + parse');
const prompt = buildDomainDetectionPrompt({ name: 'X', description: 'd', sector: 'M' });
ok('D · prompt té system + user',           prompt.system && prompt.user);
ok('D · prompt enumera DOMAIN_IDS',         DOMAIN_IDS.every(id => prompt.user.includes(id)));
ok('D · prompt esmenta business-generic',   prompt.user.includes('business-generic'));
ok('D · prompt instrueix JSON-only',        prompt.user.toLowerCase().includes('json'));

// parseDetectionResponse · happy paths
const r1 = parseDetectionResponse('{"domain":"sports-team","confidence":0.85,"reasoning":"futbol clar"}');
ok('D · parse · happy path',                r1?.domain === 'sports-team');
ok('D · parse · confidence numeric',        typeof r1?.confidence === 'number');

const r2 = parseDetectionResponse('Some text before {"domain":"worker-coop","confidence":0.7,"reasoning":"sccl"} more text');
ok('D · parse · extrau JSON entre text',    r2?.domain === 'worker-coop');

const r3 = parseDetectionResponse('{"domain":"sports-team","confidence":"high"}');
ok('D · parse · confidence non-numeric → default 0.5',  r3?.confidence === 0.5);

ok('D · parse · invalid domain → null',     parseDetectionResponse('{"domain":"xyz","confidence":1}') === null);
ok('D · parse · garbage → null',            parseDetectionResponse('no json here') === null);

const r4 = parseDetectionResponse('{"domain":"business-generic","confidence":0.9}');
ok('D · parse · accepta business-generic',  r4?.domain === llmHelpers.BUSINESS_GENERIC);

// detectDomainViaLLM · mock provider
console.log('— D.1 · LLM async amb mock provider');
{
    const mockProvider = async (modelKey, { systemPrompt, userPrompt }) => {
        return { text: '{"domain":"sports-team","confidence":0.9,"reasoning":"mock"}' };
    };
    const det = await detectDomainViaLLM({ name: 'FC X', description: 'equip', generateWithProvider: mockProvider });
    ok('D.1 · LLM retorna detection enriquida amb pack', det?.domain === 'sports-team' && det.archetypes?.length >= 8);
    ok('D.1 · via = llm',                                det?.via === 'llm');
}
{
    const mockProvider = async () => ({ text: '{"domain":"business-generic","confidence":0.7,"reasoning":"genèric"}' });
    const det = await detectDomainViaLLM({ name: 'SaaS', description: 'dev tools', generateWithProvider: mockProvider });
    ok('D.1 · business-generic · archetypes buit', det?.domain === 'business-generic' && det.archetypes.length === 0);
}
{
    const mockProvider = async () => ({ text: 'no json here · model failed' });
    const det = await detectDomainViaLLM({ name: 'X', description: 'd', generateWithProvider: mockProvider });
    ok('D.1 · parse fail → null',                  det === null);
}

// ─── E · detectDomainSmart · combinació keywords + LLM ───────────────
console.log('\n— E · detectDomainSmart · routing intel·ligent');
{
    // Cas 1 · keywords detecten fort · NO crida LLM
    let llmCalled = false;
    const mockProvider = async () => { llmCalled = true; return { text: '{}' }; };
    const det = await detectDomainSmart({
        name: 'FC Lleida', description: 'equip de futbol', sector: 'R',
        generateWithProvider: mockProvider,
    });
    ok('E · keywords fortes → via=keywords',       det?.via === 'keywords');
    ok('E · keywords fortes → NO crida LLM',       llmCalled === false);
}
{
    // Cas 2 · keywords nul·les · LLM fallback
    let llmCalled = false;
    const mockProvider = async () => { llmCalled = true; return { text: '{"domain":"sports-team","confidence":0.8}' }; };
    const det = await detectDomainSmart({
        name: 'Mi proyecto', description: 'algo generico',  // sense keywords
        generateWithProvider: mockProvider,
    });
    ok('E · sense keywords · LLM cridat',          llmCalled === true);
    ok('E · sense keywords · via=llm',              det?.via === 'llm');
}
{
    // Cas 3 · LLM desactivat · retorna null
    const det = await detectDomainSmart({
        name: 'Mi proyecto', description: 'algo generico',
        enableLLMFallback: false,
    });
    ok('E · LLM desactivat · sense detecció',      det === null);
}

// ─── F · telemetria · pure summarizers ────────────────────────────────
console.log('\n— F · telemetria · summarizeDetections');
const evs = [
    { content: { domain: 'sports-team', via: 'keywords', confidence: 0.8, sector: 'R', durationMs: 5, costEur: 0, recordedAt: Date.now() } },
    { content: { domain: 'sports-team', via: 'keywords', confidence: 0.9, sector: 'R', durationMs: 4, costEur: 0, recordedAt: Date.now() } },
    { content: { domain: 'worker-coop', via: 'llm',      confidence: 0.75, sector: 'C', durationMs: 800, costEur: 0.0005, recordedAt: Date.now() } },
    { content: { domain: 'business-generic', via: 'llm', confidence: 0.6, sector: 'J', durationMs: 700, costEur: 0.0005, recordedAt: Date.now() } },
    { content: { domain: null,         via: 'none',     confidence: null, sector: 'J', durationMs: 2, costEur: 0, recordedAt: Date.now() } },
];
const sum = summarizeDetections(evs);
ok('F · total = 5',                            sum.total === 5);
ok('F · covered = 3 (sports x2 + coop x1)',    sum.covered === 3);
ok('F · businessGenericCount = 1',             sum.businessGenericCount === 1);
ok('F · uncovered = 2 (generic + none)',       sum.uncovered === 2);
ok('F · coveragePct = 60.0',                   sum.coveragePct === 60.0);
ok('F · llmFallbackPct = 40.0 (2 of 5)',       sum.llmFallbackPct === 40.0);
ok('F · topDomains[0].id = sports-team',       sum.topDomains[0].id === 'sports-team');
ok('F · topDomains[0].count = 2',              sum.topDomains[0].count === 2);
ok('F · byVia keywords = 2',                   sum.byVia.keywords === 2);
ok('F · byVia llm = 2',                        sum.byVia.llm === 2);
ok('F · avgCostEur > 0',                       sum.avgCostEur > 0);

// Empty case
const emptySum = summarizeDetections([]);
ok('F · empty list · coveragePct = 0',          emptySum.coveragePct === 0);
ok('F · empty list · total = 0',                emptySum.total === 0);

// ─── G · detectionsByDomain · agrupació ────────────────────────────────
console.log('\n— G · detectionsByDomain');
const groups = detectionsByDomain(evs);
ok('G · sports-team agrupat 2',                groups['sports-team']?.length === 2);
ok('G · worker-coop agrupat 1',                groups['worker-coop']?.length === 1);

// ─── H · TELEMETRY_EVENT_TYPE constant ─────────────────────────────────
console.log('\n— H · constants');
ok('H · TELEMETRY_EVENT_TYPE = domain_telemetry_event',  TELEMETRY_EVENT_TYPE === 'domain_telemetry_event');

// ─── I · recordDetection · idempotència per projectId (KB mock) ───────
console.log('\n— I · recordDetection · mock KB');
{
    // Patch KB module · simulació · usem getNode/upsert in-memory directament al test via mock import
    // Aquí · només verifiquem que no llança i retorna node ben format quan li passem mocks.
    // El detall real és cobert pel test d'integració al chain (ja existeix).
    const node = await recordDetection({
        projectId: 'test-proj',
        name: 'Test',
        sector: 'R',
        detection: { domain: 'sports-team', via: 'keywords', confidence: 0.8, archetypes: [{ id: 'a' }] },
        durationMs: 5,
    });
    // El node es persisteix (best-effort) · sempre retorna el node
    ok('I · recordDetection retorna node',        node?.type === TELEMETRY_EVENT_TYPE);
    ok('I · node.content.domain conservat',       node?.content?.domain === 'sports-team');
    ok('I · node.content.archetypesCount = 1',    node?.content?.archetypesCount === 1);
}

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
