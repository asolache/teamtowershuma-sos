// =============================================================================
// TEAMTOWERS SOS V11 — PROMPT A/B TEST · TDD (v132 · wo-prompt-ab-test-vna)
// Ruta · /js/tests/promptABTestService.test.js
//
// Verifica · 2 variants prompt · scoring objectiu · comparison · summarize ·
// runABTest amb mock provider · LMS API spec doc.
// =============================================================================

import fs from 'node:fs';
import {
    PROMPT_AB_VERSION,
    buildVariantAPrompt, buildVariantBPrompt,
    scoreOutput, compareOutputs, runABTest, summarizeABTests,
} from '../core/promptABTestService.js';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== PROMPT A/B TEST SERVICE (v132) ===\n');

// ─── A · buildVariantAPrompt · rich context v131c ──────────────────────
console.log('— A · Variant A · rich context (v131c style)');
{
    const p = buildVariantAPrompt({ name: 'FC Lleida', description: 'Equip futbol', sector: 'R', vna_zoom: 'mid' });
    ok('A · system inclou Verna Allee',           p.system.includes('Verna Allee'));
    ok('A · system inclou MODEL CASTELLER',       p.system.includes('CASTELLER'));
    ok('A · system inclou QUALITAT MÍNIMA',       p.system.includes('QUALITAT'));
    ok('A · user inclou FC Lleida',                p.user.includes('FC Lleida'));
    ok('A · user inclou THINK STEP-BY-STEP',       p.user.includes('THINK STEP-BY-STEP'));
    ok('A · approxTokens > 200',                   p.approxTokens > 200);
    ok('A · variant = A',                          p.variant === 'A');
    ok('A · label = rich-context-v131c',           p.label === 'rich-context-v131c');
}

// ─── B · buildVariantBPrompt · minimal "Sugerir con IA" style ─────────
console.log('\n— B · Variant B · minimal');
{
    const p = buildVariantBPrompt({ name: 'FC Lleida', description: 'Equip futbol', sector: 'R', vna_zoom: 'mid' });
    ok('B · system inclou Verna Allee',           p.system.includes('Verna Allee'));
    ok('B · system inclou RULES',                  p.system.includes('RULES'));
    ok('B · system MOLT més curt que A',          p.system.length < 700);
    ok('B · user concís · "Genera un mapa"',      p.user.includes('Genera un mapa'));
    ok('B · approxTokens < 250',                   p.approxTokens < 250);
    ok('B · variant = B',                          p.variant === 'B');
    ok('B · label = minimal-suggest-ia',           p.label === 'minimal-suggest-ia');
}

// ─── C · scoreOutput · mètriques objectives ────────────────────────────
console.log('\n— C · scoreOutput · pure scoring');
{
    const goodOutput = {
        roles: [
            { id: 'r1', kind: 'founder', castell_level: 'pom_de_dalt' },
            { id: 'r2', kind: 'pm',      castell_level: 'tronc' },
            { id: 'r3', kind: 'coder',   castell_level: 'pinya' },
            { id: 'r4', kind: 'reviewer', castell_level: 'laterals' },
            { id: 'r5', kind: 'facilitator', castell_level: 'mans' },
            { id: 'r6', kind: 'founder', castell_level: 'baixos' },
        ],
        transactions: [
            { from: 'r1', to: 'r2', type: 'tangible' },
            { from: 'r2', to: 'r1', type: 'intangible' },     // reciproc
            { from: 'r3', to: 'r4', type: 'tangible' },
            { from: 'r4', to: 'r5', type: 'intangible' },
        ],
        deliverables: [
            { kind: 'intangible', name: 'Confiança vestuari professional' },
            { kind: 'intangible', name: 'Identitat del club histórica' },
            { kind: 'tangible',   name: 'Alineació partit' },
        ],
    };
    const sc = scoreOutput(goodOutput);
    ok('C · roles_count = 6',                     sc.roles_count === 6);
    ok('C · castell_coverage = 6 (tots nivells)', sc.castell_coverage === 6);
    ok('C · reciprocal_cycles >= 1',               sc.reciprocal_cycles >= 1);
    ok('C · intangibles_pct = 50%',                sc.intangibles_pct === 50);
    ok('C · score >= 85 (bon output)',             sc.score >= 85);
}
{
    const badOutput = {
        roles: [{ id: 'r1' }],
        transactions: [],
        deliverables: [],
    };
    const sc = scoreOutput(badOutput);
    ok('C · output pobre · score < 30',            sc.score < 30);
}
ok('C · scoreOutput(null) = null',                scoreOutput(null) === null);

// ─── D · compareOutputs · diferencial ──────────────────────────────────
console.log('\n— D · compareOutputs');
{
    const scA = { roles_count: 5, intangibles_pct: 20, reciprocal_cycles: 0, castell_coverage: 3, score: 50 };
    const scB = { roles_count: 8, intangibles_pct: 40, reciprocal_cycles: 2, castell_coverage: 5, score: 85 };
    const cmp = compareOutputs(scA, scB);
    ok('D · winner = B',                          cmp.winner === 'B');
    ok('D · deltaScore = 35',                     cmp.deltaScore === 35);
    ok('D · roles.delta = +3',                    cmp.roles.delta === 3);
    ok('D · intangibles_pct.delta = +20',         cmp.intangibles_pct.delta === 20);
}
{
    const scA = { roles_count: 6, intangibles_pct: 30, reciprocal_cycles: 1, castell_coverage: 4, score: 70 };
    const scB = { roles_count: 6, intangibles_pct: 32, reciprocal_cycles: 1, castell_coverage: 4, score: 72 };
    const cmp = compareOutputs(scA, scB);
    ok('D · tie quan delta < 5',                  cmp.winner === 'tie');
}

// ─── E · runABTest · async amb mock provider ───────────────────────────
console.log('\n— E · runABTest · mock provider');
{
    const calls = [];
    const mockProvider = async (model, opts) => {
        calls.push({ system: opts.systemPrompt.slice(0, 30), user: opts.userPrompt.slice(0, 30) });
        // Variant B retorna output més ric simulat
        if (opts.systemPrompt.includes('RULES')) {
            return { text: JSON.stringify({
                roles: [
                    { id: 'a', castell_level: 'pom_de_dalt' }, { id: 'b', castell_level: 'tronc' },
                    { id: 'c', castell_level: 'pinya' }, { id: 'd', castell_level: 'laterals' },
                    { id: 'e', castell_level: 'mans' }, { id: 'f', castell_level: 'baixos' },
                ],
                transactions: [
                    { from: 'a', to: 'b', type: 'tangible' }, { from: 'b', to: 'a', type: 'intangible' },
                    { from: 'c', to: 'd', type: 'tangible' }, { from: 'd', to: 'e', type: 'intangible' },
                ],
                deliverables: [{ kind: 'intangible', name: 'Identitat institucional autèntica' }],
            }), usage: { inputTokens: 200, outputTokens: 300 } };
        }
        // Variant A retorna output més pobre simulat
        return { text: JSON.stringify({
            roles: [{ id: 'x', castell_level: 'tronc' }, { id: 'y', castell_level: 'pinya' }],
            transactions: [{ from: 'x', to: 'y', type: 'tangible' }],
            deliverables: [],
        }), usage: { inputTokens: 800, outputTokens: 200 } };
    };
    const result = await runABTest({
        context: { name: 'Test Project', description: 'Sample', sector: 'M' },
        provider: mockProvider,
    });
    ok('E · 2 crides al provider',                calls.length === 2);
    ok('E · variants A i B presents',              result.variants.A && result.variants.B);
    ok('E · output A parsejat',                    result.variants.A.output != null);
    ok('E · output B parsejat',                    result.variants.B.output != null);
    ok('E · scores calculats',                     result.variants.A.score && result.variants.B.score);
    ok('E · comparison · winner = B (output millor)', result.comparison.winner === 'B');
    ok('E · context.name preservat',               result.context.name === 'Test Project');
    ok('E · ms > 0',                                result.ms >= 0);
}

// ─── F · runABTest · errors són capturats ──────────────────────────────
console.log('\n— F · runABTest · errors capturats');
{
    const failProvider = async () => { throw new Error('network fail'); };
    const result = await runABTest({ context: { name: 'X' }, provider: failProvider });
    ok('F · errA capturat',                       result.variants.A.error === 'network fail');
    ok('F · errB capturat',                       result.variants.B.error === 'network fail');
    ok('F · output null si error',                 result.variants.A.output === null);
    ok('F · comparison.winner = null',             result.comparison.winner === null);
}

// ─── G · summarizeABTests · agregació ──────────────────────────────────
console.log('\n— G · summarizeABTests');
{
    const events = [
        { content: { winner: 'B', scoreA: { score: 50 }, scoreB: { score: 80 }, tokensA: 800, tokensB: 200 } },
        { content: { winner: 'B', scoreA: { score: 55 }, scoreB: { score: 75 }, tokensA: 800, tokensB: 200 } },
        { content: { winner: 'A', scoreA: { score: 70 }, scoreB: { score: 60 }, tokensA: 800, tokensB: 200 } },
        { content: { winner: 'tie', scoreA: { score: 65 }, scoreB: { score: 67 }, tokensA: 800, tokensB: 200 } },
    ];
    const sum = summarizeABTests(events);
    ok('G · total = 4',                           sum.total === 4);
    ok('G · winner.B = 2',                         sum.winner.B === 2);
    ok('G · winner.A = 1',                         sum.winner.A === 1);
    ok('G · winRateB = 50',                        sum.winRateB === 50);
    ok('G · avgScoreA i avgScoreB calculats',     sum.avgScoreA > 0 && sum.avgScoreB > 0);
    ok('G · tokenSavingsB = 75 (200 vs 800)',     sum.tokenSavingsB === 75);
}
{
    const empty = summarizeABTests([]);
    ok('G · empty events · total 0',              empty.total === 0);
}

// ─── H · LMS API spec doc ──────────────────────────────────────────────
console.log('\n— H · docs/lms-api-spec-v0.1.md · wo-research-lms entregable');
const specExists = fs.existsSync(new URL('../../docs/lms-api-spec-v0.1.md', import.meta.url));
ok('H · LMS API spec existeix',                   specExists);
if (specExists) {
    const spec = fs.readFileSync(new URL('../../docs/lms-api-spec-v0.1.md', import.meta.url), 'utf8');
    ok('H · 12 endpoints REST + xAPI',             spec.includes('12 endpoints'));
    ok('H · catàleg · enrollments · xAPI',         spec.includes('catàleg') && spec.includes('enrollment') && spec.includes('xAPI'));
    ok('H · endpoints GET /api/lms/courses',        spec.includes('GET `/api/lms/courses`'));
    ok('H · endpoints POST /api/lms/enroll',        spec.includes('POST `/api/lms/enroll`'));
    ok('H · endpoints xAPI statements',             spec.includes('/api/lms/xapi/statements'));
    ok('H · schema KB · lms_content',               spec.includes('type: lms_content'));
    ok('H · auth SBT identity (no API key)',        spec.includes('SBT identity'));
    ok('H · slicing pie compatible royalties',      spec.includes('Slicing Pie') && (spec.includes('royalties') || spec.includes('Royalties')));
    ok('H · compatibilitat SCORM + xAPI',           spec.includes('SCORM 1.2') && spec.includes('SCORM 2004') && spec.includes('xAPI'));
    ok('H · timeline 4 sprints v141-v144',          spec.includes('v141') && spec.includes('v144'));
    ok('H · 4 casos d\'us partners externs',        spec.toLowerCase().includes('partners') && spec.toLowerCase().includes('acceleradora'));
}

ok('PROMPT_AB_VERSION exposat',                   typeof PROMPT_AB_VERSION === 'string');

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
