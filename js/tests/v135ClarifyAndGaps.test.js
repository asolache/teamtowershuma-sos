// =============================================================================
// TEAMTOWERS SOS V11 — v135 · vnaClarify + vnaGapDetector · TDD
// Ruta · /js/tests/v135ClarifyAndGaps.test.js
//
// Verifica · items #1 (pre-thinking clarify) i #2 (multi-turn gap fill) del
// audit post-alfa v134 · les úniques 2 millores rendibles per a alfa+.
// Tests purs (sense DOM · provider injectat).
// =============================================================================

import {
    VNA_CLARIFY_VERSION,
    vnaClarify,
    enrichContextWithAnswers,
} from '../core/vnaClarify.js';
import {
    VNA_GAP_VERSION,
    detectGaps,
    buildGapFillPrompt,
    runGapFillTurn,
    mergeGapFill,
} from '../core/vnaGapDetector.js';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v135 · vnaClarify + vnaGapDetector · TDD ===\n');

// ════════════════════════════════════════════════════════════════════════
// PART A · vnaClarify (item #1 · pre-thinking)
// ════════════════════════════════════════════════════════════════════════

// ─── A1 · API surface ─────────────────────────────────────────────────
console.log('— A1 · vnaClarify API');
ok('A1 · VNA_CLARIFY_VERSION = v135',                VNA_CLARIFY_VERSION === 'v135');
ok('A1 · vnaClarify és async function',              typeof vnaClarify === 'function');
ok('A1 · enrichContextWithAnswers és function',      typeof enrichContextWithAnswers === 'function');

// ─── A2 · validacions input ────────────────────────────────────────────
console.log('\n— A2 · vnaClarify · validacions');
{
    const r1 = await vnaClarify({ context: {} });
    ok('A2 · sense name/description · ok=false · no-context', r1.ok === false && r1.error.includes('no-context'));
    const r2 = await vnaClarify({ context: { name: 'X', description: 'Y' } });
    ok('A2 · sense provider · ok=false · no-provider',         r2.ok === false && r2.error.includes('no-provider'));
}

// ─── A3 · happy path · mock provider retorna 3 questions ──────────────
console.log('\n— A3 · vnaClarify · happy path');
{
    let captured;
    const mock = async (model, opts) => {
        captured = opts;
        return { text: JSON.stringify({ questions: [
            { id: 'q1', text: 'Quins són els 3 stakeholders més crítics?', why: 'afecta rols', kind: 'stakeholders' },
            { id: 'q2', text: 'En quina fase del cicle estàs?', kind: 'stage' },
            { id: 'q3', text: 'Els entregables són tangibles o serveis?', kind: 'deliverables' },
        ]}), usage: { inputTokens: 100, outputTokens: 80 } };
    };
    const r = await vnaClarify({
        context: { name: 'Forn Vall', description: 'Forn artesà', sector: 'C' },
        provider: mock,
    });
    ok('A3 · ok=true',                                    r.ok === true);
    ok('A3 · 3 questions normalitzades',                  r.questions.length === 3);
    ok('A3 · question.id present',                        r.questions[0].id === 'q1');
    ok('A3 · question.text trimmed',                      r.questions[0].text.includes('stakeholders'));
    ok('A3 · question.why opcional · primer present',     r.questions[0].why === 'afecta rols');
    ok('A3 · question.why null si absent · segon',        r.questions[1].why === null);
    ok('A3 · provider rebut systemPrompt + userPrompt',   typeof captured.systemPrompt === 'string' && typeof captured.userPrompt === 'string');
    ok('A3 · temperature baixa per consistency',          captured.temperature === 0.2);
    ok('A3 · usage propagat',                             r.usage && r.usage.outputTokens === 80);
}

// ─── A4 · cap màx · max=2 truncates ───────────────────────────────────
console.log('\n— A4 · vnaClarify · max param truncate');
{
    const mock = async () => ({ text: JSON.stringify({ questions: [
        { text: 'q1' }, { text: 'q2' }, { text: 'q3' }, { text: 'q4' }, { text: 'q5' },
    ]}), usage: {} });
    const r = await vnaClarify({ context: { name: 'X', description: 'Y' }, provider: mock, max: 2 });
    ok('A4 · max=2 · 2 questions retornades',             r.questions.length === 2);
    ok('A4 · ids auto-assignats (q1 · q2)',               r.questions[0].id === 'q1' && r.questions[1].id === 'q2');
}

// ─── A5 · parse fail · fenced JSON · garbage ───────────────────────────
console.log('\n— A5 · vnaClarify · parse robustness');
{
    const mock1 = async () => ({ text: 'Aquí et torno · ```json\n{"questions":[{"text":"q?"}]}\n``` final.' });
    const r1 = await vnaClarify({ context: { name: 'X', description: 'Y' }, provider: mock1 });
    ok('A5 · fenced JSON parse OK',                       r1.ok === true && r1.questions.length === 1);

    const mock2 = async () => ({ text: 'not json at all bla bla' });
    const r2 = await vnaClarify({ context: { name: 'X', description: 'Y' }, provider: mock2 });
    ok('A5 · garbage · ok=false · parse-failed',          r2.ok === false && r2.error.includes('parse-failed'));
    ok('A5 · rawOutput conservat per debug',              typeof r2.rawOutput === 'string' && r2.rawOutput.length > 0);
}

// ─── A6 · provider error caught ───────────────────────────────────────
console.log('\n— A6 · vnaClarify · provider error');
{
    const mockFail = async () => { throw new Error('network'); };
    const r = await vnaClarify({ context: { name: 'X', description: 'Y' }, provider: mockFail });
    ok('A6 · provider error · ok=false · provider-failed',r.ok === false && r.error.includes('provider-failed'));
}

// ─── A7 · enrichContextWithAnswers · merge to description ──────────────
console.log('\n— A7 · enrichContextWithAnswers');
{
    const ctx = { name: 'X', description: 'desc original', sector: 'C' };
    const answers = [
        { id: 'q1', text: '3 stakeholders?', answer: 'Sòcies · Botigues · Famílies' },
        { id: 'q2', text: 'Fase?', answer: 'MVP' },
        { id: 'q3', text: 'Skip', answer: '' },                  // buit · ha de filtrar
    ];
    const enriched = enrichContextWithAnswers(ctx, answers);
    ok('A7 · description prefixada amb Q&A block',        enriched.description.includes('## Clarificacions usuari'));
    ok('A7 · respostes incloses',                          enriched.description.includes('Sòcies · Botigues') &&
                                                          enriched.description.includes('MVP'));
    ok('A7 · empty answer filtrat',                        !enriched.description.includes('Skip'));
    ok('A7 · _clarifyAnswers metadata · 2 valid',          Array.isArray(enriched._clarifyAnswers) && enriched._clarifyAnswers.length === 2);
    ok('A7 · sense answers · context intacte',             enrichContextWithAnswers(ctx, []).description === ctx.description);
}

// ════════════════════════════════════════════════════════════════════════
// PART B · vnaGapDetector (item #2 · multi-turn gap fill)
// ════════════════════════════════════════════════════════════════════════

// ─── B1 · API surface ─────────────────────────────────────────────────
console.log('\n— B1 · vnaGapDetector API');
ok('B1 · VNA_GAP_VERSION = v135',                      VNA_GAP_VERSION === 'v135');
ok('B1 · detectGaps és function',                      typeof detectGaps === 'function');
ok('B1 · buildGapFillPrompt és function',              typeof buildGapFillPrompt === 'function');
ok('B1 · runGapFillTurn és async function',            typeof runGapFillTurn === 'function');
ok('B1 · mergeGapFill és function',                    typeof mergeGapFill === 'function');

// ─── B2 · detectGaps · pattern completament cobert (zero gaps) ────────
console.log('\n— B2 · detectGaps · zero gaps');
{
    const map = {
        roles: [
            { id: 'r1', kind: 'head-coach', name: 'Entrenador', castell_level: 'pom_de_dalt' },
            { id: 'r2', kind: 'player',     name: 'Jugadors',    castell_level: 'tronc' },
            { id: 'r3', kind: 'scout',      name: 'Scout',       castell_level: 'pinya' },
            { id: 'r4', kind: 'fan-base',   name: 'Aficionats',  castell_level: 'baixos' },
        ],
        transactions: [{ from: 'r1', to: 'r2' }, { from: 'r3', to: 'r1' }],
    };
    const domain = { archetypes: [
        { kind: 'head-coach', name: 'Entrenador', castell: 'pom_de_dalt' },
        { kind: 'scout',      name: 'Scout',      castell: 'pinya' },
    ]};
    const r = detectGaps({ map, domainDetection: domain });
    ok('B2 · hasAll=true (tots arquetip presents · castell levels OK)', r.hasAll === true);
    ok('B2 · gaps array buit',                            r.gaps.length === 0);
}

// ─── B3 · detectGaps · "futbol sense scout" · cas crític ──────────────
console.log('\n— B3 · detectGaps · cas FC Lleida sense scout');
{
    const map = {
        roles: [
            { id: 'r1', kind: 'head-coach', name: 'Entrenador', castell_level: 'pom_de_dalt' },
            { id: 'r2', kind: 'player',     name: 'Jugadors',    castell_level: 'tronc' },
            { id: 'r3', kind: 'fan-base',   name: 'Aficionats',  castell_level: 'baixos' },
        ],
        transactions: [{ from: 'r1', to: 'r2' }],
    };
    const domain = { archetypes: [
        { kind: 'head-coach', name: 'Entrenador',  castell: 'pom_de_dalt' },
        { kind: 'scout',      name: 'Scout',       castell: 'pinya' },
        { kind: 'player',     name: 'Jugadors',    castell: 'tronc' },
    ]};
    const r = detectGaps({ map, domainDetection: domain });
    ok('B3 · hasAll=false',                                r.hasAll === false);
    ok('B3 · detecta missing-archetype Scout',             r.gaps.some(g => g.kind === 'missing-archetype' && /scout/i.test(g.suggestedName || g.suggestedKind)));
}

// ─── B4 · detectGaps · castell level crític buit (tronc) ───────────────
console.log('\n— B4 · detectGaps · castell crític buit');
{
    const map = {
        roles: [
            { id: 'r1', kind: 'a', name: 'A', castell_level: 'pom_de_dalt' },
            { id: 'r2', kind: 'b', name: 'B', castell_level: 'baixos' },
            // falta 'tronc'
        ],
        transactions: [],
    };
    const r = detectGaps({ map });
    ok('B4 · gap missing-castell-level · tronc',           r.gaps.some(g => g.kind === 'missing-castell-level' && g.suggestedCastell === 'tronc'));
}

// ─── B5 · detectGaps · no-transactions amb roles ──────────────────────
console.log('\n— B5 · detectGaps · sense transactions');
{
    const map = {
        roles: [
            { id: 'r1', kind: 'a', castell_level: 'pom_de_dalt' },
            { id: 'r2', kind: 'b', castell_level: 'tronc' },
            { id: 'r3', kind: 'c', castell_level: 'baixos' },
        ],
        transactions: [],
    };
    const r = detectGaps({ map });
    ok('B5 · gap no-transactions detectat',                r.gaps.some(g => g.kind === 'no-transactions'));
}

// ─── B6 · detectGaps · expected_role_kinds sector ─────────────────────
console.log('\n— B6 · detectGaps · sector context expected_role_kinds');
{
    const map = {
        roles: [
            { id: 'r1', kind: 'founder',  castell_level: 'pom_de_dalt' },
            { id: 'r2', kind: 'employee', castell_level: 'tronc' },
            { id: 'r3', kind: 'customer', castell_level: 'baixos' },
        ],
        transactions: [{ from: 'r1', to: 'r2' }],
    };
    const sectorContext = { expected_role_kinds: ['founder', 'employee', 'customer', 'auditor'] };
    const r = detectGaps({ map, sectorContext });
    ok('B6 · gap missing-sector-role · auditor',           r.gaps.some(g => g.kind === 'missing-sector-role' && g.suggestedKind === 'auditor'));
}

// ─── B7 · buildGapFillPrompt · prompt format ──────────────────────────
console.log('\n— B7 · buildGapFillPrompt');
{
    const gaps = [
        { kind: 'missing-archetype', suggestedKind: 'scout', suggestedName: 'Scout', suggestedCastell: 'pinya', reason: 'arquetip esperat' },
        { kind: 'no-transactions',   reason: 'cap transacció' },
    ];
    const currentMap = { roles: [{ id: 'r1', name: 'Entrenador', kind: 'head-coach', castell_level: 'pom_de_dalt' }] };
    const prompt = buildGapFillPrompt(gaps, currentMap);
    ok('B7 · prompt menciona "COMPLETAR EL MAPA"',          prompt.includes('COMPLETAR EL MAPA'));
    ok('B7 · llista gaps · Scout · pinya',                 prompt.includes('Scout') && prompt.includes('pinya'));
    ok('B7 · gap no-transactions · genera ≥ 4',            prompt.includes('genera ≥ 4 transaccions'));
    ok('B7 · llista rols existents NO repetir',            prompt.includes('NO repeteixis') && prompt.includes('Entrenador'));
    ok('B7 · output JSON esquema',                         prompt.includes('design-value-map-rich') && prompt.includes('roles:'));
}

// ─── B8 · runGapFillTurn · noop si zero gaps ──────────────────────────
console.log('\n— B8 · runGapFillTurn · noop si zero gaps');
{
    const r = await runGapFillTurn({ map: { roles: [] }, gaps: [], provider: async () => ({ text: '{}' }) });
    ok('B8 · noop · ok=true · noop=true',                  r.ok === true && r.noop === true);
    ok('B8 · noop · 0 ms (no call feta)',                  r.ms === 0);
}

// ─── B9 · runGapFillTurn · happy path · merge fills the gap ────────────
console.log('\n— B9 · runGapFillTurn · happy path');
{
    const currentMap = {
        roles: [
            { id: 'r1', name: 'Entrenador', kind: 'head-coach', castell_level: 'pom_de_dalt' },
            { id: 'r2', name: 'Jugadors',   kind: 'player',     castell_level: 'tronc' },
        ],
        transactions: [],
    };
    const gaps = [
        { kind: 'missing-archetype', suggestedKind: 'scout', suggestedName: 'Scout', suggestedCastell: 'pinya' },
    ];
    const mockProvider = async (model, opts) => {
        return { text: JSON.stringify({
            roles:        [{ id: 'r3', name: 'Scout', kind: 'scout', castell_level: 'pinya' }],
            transactions: [{ from: 'r3', to: 'r1', type: 'tangible' }],
            deliverables: [],
        }), usage: { inputTokens: 300, outputTokens: 60 } };
    };
    const r = await runGapFillTurn({ map: currentMap, gaps, provider: mockProvider });
    ok('B9 · ok=true',                                     r.ok === true);
    ok('B9 · added.roles 1 · Scout',                       r.added.roles.length === 1 && r.added.roles[0].kind === 'scout');
    ok('B9 · updatedMap.roles 3 (merge)',                  r.updatedMap.roles.length === 3);
    ok('B9 · updatedMap.transactions 1 (merge)',           r.updatedMap.transactions.length === 1);
    ok('B9 · usage propagat',                              r.usage && r.usage.outputTokens === 60);
}

// ─── B10 · runGapFillTurn · parse fail ─────────────────────────────────
console.log('\n— B10 · runGapFillTurn · parse fail');
{
    const r = await runGapFillTurn({
        map: { roles: [] }, gaps: [{ kind: 'no-transactions' }],
        provider: async () => ({ text: 'no json bla bla' }),
    });
    ok('B10 · parse fail · ok=false',                      r.ok === false && r.error === 'parse-failed');
}

// ─── B11 · mergeGapFill · dedupe per id + fuzzy name ──────────────────
console.log('\n— B11 · mergeGapFill · dedupe');
{
    const cur = {
        roles: [{ id: 'r1', name: 'Entrenador' }, { id: 'r2', name: 'Jugadors' }],
        transactions: [{ from: 'r1', to: 'r2' }],
    };
    const added = {
        roles: [
            { id: 'r1', name: 'Entrenador' },           // dup id · descarta
            { id: 'r3', name: 'entrenador' },           // dup name lowercase · descarta
            { id: 'r4', name: 'Scout' },                // OK · nou
        ],
        transactions: [
            { from: 'r4', to: 'r1' },                   // OK
            { from: 'rX', to: 'r1' },                   // from inexistent · descarta
        ],
    };
    const merged = mergeGapFill(cur, added);
    ok('B11 · només 1 rol nou afegit (r4)',                merged.roles.length === 3 && merged.roles.find(r => r.id === 'r4'));
    ok('B11 · transaction inexistent descartada',          merged.transactions.length === 2);
}

// ─── B12 · runGapFillTurn · provider error ────────────────────────────
console.log('\n— B12 · runGapFillTurn · provider error');
{
    const r = await runGapFillTurn({
        map: { roles: [] }, gaps: [{ kind: 'no-transactions' }],
        provider: async () => { throw new Error('boom'); },
    });
    ok('B12 · provider error · ok=false',                  r.ok === false && r.error.includes('gap-fill-provider-failed'));
}

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
