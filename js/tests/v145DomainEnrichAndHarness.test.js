// =============================================================================
// TEAMTOWERS SOS V11 — v145 · domain enrich + quality harness · TDD
// Ruta · /js/tests/v145DomainEnrichAndHarness.test.js
//
// Verifica · (1) 4 domain packs pilot tenen deliverables_tangible +
// transactions_canonical · (2) buildPrompt injecta aquests blocs · (3)
// promptQualityHarness · runQualityHarness + compareWithBaseline + serialize.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { DOMAIN_PACKS } from '../core/domainDetector.js';
import { buildPrompt } from '../core/vnaExpertPrompts.js';
import {
    HARNESS_VERSION, DEFAULT_THRESHOLDS,
    runQualityHarness, aggregateResults, compareWithBaseline,
    serializeBaseline, loadBaselineFromText,
} from '../core/promptQualityHarness.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v145 · domain enrich + quality harness · TDD ===\n');

// ─── A · 4 domain packs pilot enriquits ────────────────────────────────
console.log('— A · domain packs · 4 pilots enriquits');
const PILOTS = ['sports-team', 'arts-performance', 'coop-cares', 'software-agency'];
for (const id of PILOTS) {
    const pack = DOMAIN_PACKS[id];
    ok('A · ' + id + ' · existeix',                  !!pack);
    ok('A · ' + id + ' · deliverables_tangible · ≥ 6',
        Array.isArray(pack.deliverables_tangible) && pack.deliverables_tangible.length >= 6);
    ok('A · ' + id + ' · transactions_canonical · ≥ 5',
        Array.isArray(pack.transactions_canonical) && pack.transactions_canonical.length >= 5);
    ok('A · ' + id + ' · transaction · shape (from/to/deliverable/type/frequency/trigger)',
        pack.transactions_canonical.every(t =>
            t.from && t.to && t.deliverable && t.type && t.frequency && t.trigger));
}

// ─── B · NO totes les packs (24 totals) tenen ja els nous camps · pilot only ──
console.log('\n— B · packs no-pilot · sense camps nous (pilot scope confirmat)');
const allPackIds = Object.keys(DOMAIN_PACKS);
ok('B · ≥ 20 packs totals existeixen (pilots NO únics)',  allPackIds.length >= 20);
const enrichedCount = allPackIds.filter(k => DOMAIN_PACKS[k].deliverables_tangible).length;
ok('B · 4 packs enriquits (pilots)',                       enrichedCount === 4);

// ─── C · buildPrompt · injecció dels nous blocs al domain block ───────
console.log('\n— C · buildPrompt · injecció domain pack enriched');
{
    const pack = DOMAIN_PACKS['sports-team'];
    const ctx = {
        name: 'FC Lleida',
        description: 'Equip futbol semipro · cantera 80 joves',
        sector: 'R',
        vna_zoom: 'mid',
        domainDetection: { ...pack, domain: 'sports-team', confidence: 0.95 },
    };
    const prompt = buildPrompt({ taskKind: 'design-value-map-rich', context: ctx });
    ok('C · prompt user inclou DOMINI DETECTAT block',     prompt.user.includes('DOMINI DETECTAT'));
    ok('C · prompt inclou "Entregables TANGIBLES canonical"', prompt.user.includes('Entregables TANGIBLES canonical'));
    ok('C · prompt inclou "Transactions canonical"',        prompt.user.includes('Transactions canonical'));
    ok('C · prompt inclou exemple tangible · "Acta entrenament setmanal"',
        prompt.user.includes('Acta entrenament setmanal'));
    ok('C · prompt inclou transaction · scout → sporting-director',
        prompt.user.includes('scout → sporting-director'));
}

// ─── D · sense pack enriched · prompt no inclou blocs nous ────────────
console.log('\n— D · pack legacy · sense blocs nous');
{
    const pack = DOMAIN_PACKS['legal-advisory'];   // no enriquit
    const ctx = {
        name: 'Despatx', description: 'Advocats', sector: 'M', vna_zoom: 'mid',
        domainDetection: { ...pack, domain: 'legal-advisory', confidence: 0.9 },
    };
    const prompt = buildPrompt({ taskKind: 'design-value-map-rich', context: ctx });
    ok('D · pack legacy · NO inclou "Entregables TANGIBLES canonical"',
        !prompt.user.includes('Entregables TANGIBLES canonical'));
    ok('D · pack legacy · NO inclou "Transactions canonical"',
        !prompt.user.includes('Transactions canonical'));
}

// ─── E · runQualityHarness · validacions input ─────────────────────────
console.log('\n— E · runQualityHarness · validacions');
{
    const r0 = await runQualityHarness({ cases: [], provider: () => {} });
    ok('E · cases buides · ok=false · no-cases',           r0.ok === false && r0.error === 'no-cases');
    const r1 = await runQualityHarness({ cases: [{ id: 'a', name: 'X', description: 'Y' }] });
    ok('E · sense provider · ok=false · no-provider',      r1.ok === false && r1.error === 'no-provider');
}

// ─── F · runQualityHarness · happy path · mock provider ───────────────
console.log('\n— F · runQualityHarness · happy path');
{
    const mockProvider = async (_modelKey, opts) => {
        // Mock retorna JSON parseable amb roles · transactions · deliverables
        return {
            text: JSON.stringify({
                roles: [
                    { id: 'r1', castell_level: 'pom_de_dalt' },
                    { id: 'r2', castell_level: 'tronc' },
                    { id: 'r3', castell_level: 'pinya' },
                    { id: 'r4', castell_level: 'laterals' },
                    { id: 'r5', castell_level: 'mans' },
                    { id: 'r6', castell_level: 'baixos' },
                ],
                transactions: [
                    { from: 'r1', to: 'r2', type: 'tangible' },
                    { from: 'r2', to: 'r3', type: 'intangible' },
                    { from: 'r3', to: 'r4', type: 'tangible' },
                    { from: 'r4', to: 'r5', type: 'intangible' },
                ],
                deliverables: [
                    { name: 'Pla anual', kind: 'tangible' },
                    { name: 'Confiança equip', kind: 'intangible' },
                ],
            }),
            usage: { inputTokens: 1200, outputTokens: 400 },
        };
    };
    const r = await runQualityHarness({
        cases: [
            { id: 'c1', name: 'Forn Vall',   description: 'Forn coop', sector: 'C' },
            { id: 'c2', name: 'FC Lleida',  description: 'Equip futbol', sector: 'R' },
        ],
        provider: mockProvider,
    });
    ok('F · ok=true',                                       r.ok === true);
    ok('F · results.length = 2',                            r.results.length === 2);
    ok('F · cada result · ok=true · score > 0',             r.results.every(x => x.ok === true && x.score > 0));
    ok('F · aggregate · ok=2 · total=2',                    r.aggregate.ok === 2 && r.aggregate.total === 2);
    ok('F · aggregate · avgScore > 0',                      r.aggregate.avgScore > 0);
    ok('F · aggregate · avgTokens > 0',                     r.aggregate.avgTokens > 0);
    ok('F · aggregate · avgCostEur > 0',                    r.aggregate.avgCostEur > 0);
    ok('F · result · inputTokens + outputTokens propagats', r.results[0].inputTokens === 1200 && r.results[0].outputTokens === 400);
}

// ─── G · aggregateResults · pure · edge cases ──────────────────────────
console.log('\n— G · aggregateResults pure');
{
    const ag1 = aggregateResults([]);
    ok('G · empty · all zero',                              ag1.total === 0 && ag1.avgScore === 0 && ag1.passRate === 0);
    const ag2 = aggregateResults([
        { ok: true, score: 80, tokens: 1500, costEur: 0.001 },
        { ok: true, score: 60, tokens: 1500, costEur: 0.001 },
        { ok: false, error: 'parse-failed' },
    ]);
    ok('G · 2 ok + 1 fail · avgScore=70',                   ag2.avgScore === 70);
    ok('G · passRate = 1/3 (només 80 ≥ 70)',                ag2.passRate === 0.333);
    ok('G · total=3 · ok=2',                                ag2.total === 3 && ag2.ok === 2);
}

// ─── H · compareWithBaseline · regression detection ────────────────────
console.log('\n— H · compareWithBaseline');
{
    const baseline = { aggregate: { avgScore: 75, avgCostEur: 0.001, avgTokens: 1500, passRate: 0.7 } };
    // Cas 1 · improvement
    const better  = { aggregate: { avgScore: 80, avgCostEur: 0.0009, avgTokens: 1450, passRate: 0.8 } };
    const c1 = compareWithBaseline({ current: better, baseline });
    ok('H · millora · deltaScore +5pp · regression=false',  c1.deltaScore === 5 && c1.regression === false);
    ok('H · recommendation · MILLORA · actualitza baseline',c1.recommendation.includes('MILLORA'));

    // Cas 2 · regression score
    const worse = { aggregate: { avgScore: 70, avgCostEur: 0.001, avgTokens: 1500, passRate: 0.6 } };
    const c2 = compareWithBaseline({ current: worse, baseline });
    ok('H · score baixà 5pp (≥3 threshold) · regression',   c2.regression === true);
    ok('H · recommendation · REGRESSION',                   c2.recommendation.includes('REGRESSION'));

    // Cas 3 · regression cost
    const costly = { aggregate: { avgScore: 75, avgCostEur: 0.0012, avgTokens: 1500, passRate: 0.7 } };
    const c3 = compareWithBaseline({ current: costly, baseline });
    ok('H · cost ↑ 20% (≥10 threshold) · regression',       c3.regression === true);

    // Cas 4 · estable
    const stable = { aggregate: { avgScore: 75.5, avgCostEur: 0.001, avgTokens: 1500, passRate: 0.7 } };
    const c4 = compareWithBaseline({ current: stable, baseline });
    ok('H · estable · regression=false · ESTABLE rec',      c4.regression === false && c4.recommendation.includes('ESTABLE'));

    // Cas 5 · missing input
    const c5 = compareWithBaseline({ current: null, baseline });
    ok('H · missing · ok=false',                            c5.ok === false);
}

// ─── I · serialize / load baseline · round-trip ───────────────────────
console.log('\n— I · serialize/load baseline');
{
    const current = {
        aggregate: { avgScore: 75, avgCostEur: 0.001, avgTokens: 1500, passRate: 0.7, ok: 2, total: 2, totalCostEur: 0.002 },
        results: [{ id: 'c1', ok: true, score: 80, tokens: 1500, costEur: 0.001 }],
    };
    const ser = serializeBaseline(current);
    ok('I · version present',                               ser.version === HARNESS_VERSION);
    ok('I · timestamp ISO',                                  /^\d{4}-\d{2}-\d{2}T/.test(ser.timestamp));
    ok('I · casesCount · 1',                                 ser.casesCount === 1);
    ok('I · aggregate propagat',                             ser.aggregate.avgScore === 75);

    const text = JSON.stringify(ser);
    const loaded = loadBaselineFromText(text);
    ok('I · load round-trip · ok',                           loaded.ok === true);
    ok('I · load · aggregate intacte',                       loaded.baseline.aggregate.avgScore === 75);

    const bad = loadBaselineFromText('not json');
    ok('I · garbage · parse-failed',                         bad.ok === false && bad.error.includes('parse-failed'));
}

// ─── J · CLI · --harness dry-run smoke test ───────────────────────────
console.log('\n— J · CLI --harness · smoke');
{
    const cliPath = path.join(ROOT, 'scripts/run-vna-benchmark.mjs');
    const result = spawnSync('node', [cliPath, '--harness', '--dry-run', '--limit', '2'],
        { cwd: ROOT, encoding: 'utf8', timeout: 15000 });
    ok('J · exit 0',                                         result.status === 0);
    ok('J · header VNA Harness · v145',                      result.stdout.includes('VNA Harness · v145'));
    ok('J · AGGREGATE block',                                result.stdout.includes('AGGREGATE'));
    ok('J · per-case output',                                result.stdout.includes('[1/2]') && result.stdout.includes('[2/2]'));
    ok('J · suggesteix --update-baseline si no existeix',    result.stdout.includes('--update-baseline'));
    ok('J · escriu harness-<ts>-dryrun.md',                  result.stdout.includes('harness-') && result.stdout.includes('-dryrun.md'));
    // Cleanup files generated
    const benchDir = path.join(ROOT, 'docs/benchmarks');
    if (fs.existsSync(benchDir)) {
        fs.readdirSync(benchDir).filter(f => f.startsWith('harness-') && f.includes('-dryrun')).forEach(f => fs.unlinkSync(path.join(benchDir, f)));
    }
}

// ─── K · CLI · --help inclou --harness ─────────────────────────────────
console.log('\n— K · CLI --help');
{
    const cliPath = path.join(ROOT, 'scripts/run-vna-benchmark.mjs');
    const result = spawnSync('node', [cliPath, '--help'], { cwd: ROOT, encoding: 'utf8', timeout: 5000 });
    ok('K · --help inclou --harness',                        result.stdout.includes('--harness'));
    ok('K · --help inclou --baseline',                       result.stdout.includes('--baseline'));
    ok('K · --help inclou --update-baseline',                result.stdout.includes('--update-baseline'));
}

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
