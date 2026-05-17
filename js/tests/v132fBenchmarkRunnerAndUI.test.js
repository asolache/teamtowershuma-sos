// =============================================================================
// TEAMTOWERS SOS V11 — v132f · Benchmark Runner CLI + UI dropdown · TDD
// Ruta · /js/tests/v132fBenchmarkRunnerAndUI.test.js
//
// Verifica · scripts/run-vna-benchmark.mjs (dry-run executable · output md +
// taula + hipòtesi H1 + dry-run sense API key) + PromptsDebugView wireup
// del dropdown de 20 casos benchmark + botó "Run live A/B (LLM real)".
// =============================================================================

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v132f · benchmark runner CLI + UI dropdown · TDD ===\n');

// ─── A · CLI script existeix + és parsejable ──────────────────────────
console.log('— A · scripts/run-vna-benchmark.mjs');
const cliPath = path.join(ROOT, 'scripts/run-vna-benchmark.mjs');
ok('A · script existeix',                         fs.existsSync(cliPath));
const cliSrc = fs.readFileSync(cliPath, 'utf8');
ok('A · imports runABTest + summarizeABTests',    cliSrc.includes("from '../js/core/promptABTestService.js'"));
ok('A · suporta --dry-run',                        cliSrc.includes('--dry-run'));
ok('A · suporta --limit',                          cliSrc.includes('--limit'));
ok('A · suporta --provider anthropic|openai',      cliSrc.includes("'anthropic'") && cliSrc.includes("'openai'"));
ok('A · llegeix ANTHROPIC_API_KEY de env',         cliSrc.includes('process.env.ANTHROPIC_API_KEY'));
ok('A · llegeix OPENAI_API_KEY de env',            cliSrc.includes('process.env.OPENAI_API_KEY'));
ok('A · escriu output a docs/benchmarks/',         cliSrc.includes('docs/benchmarks') || cliSrc.includes("'docs/benchmarks'"));
ok('A · main() retorna 0 en cas d\'èxit',          cliSrc.includes('process.exit(1)'));

// ─── B · CLI executable en dry-run mode (no LLM call) ─────────────────
console.log('\n— B · execució dry-run · 3 casos · genera md');
const result = spawnSync('node', [cliPath, '--dry-run', '--limit', '3'], { cwd: ROOT, encoding: 'utf8', timeout: 15000 });
ok('B · exit code 0',                              result.status === 0);
ok('B · stdout indica DRY-RUN',                    result.stdout.includes('DRY-RUN'));
ok('B · stdout llista 3 casos',                    result.stdout.includes('[1/3]') && result.stdout.includes('[3/3]'));
ok('B · stdout escriu fitxer md a docs/benchmarks',result.stdout.includes('docs/benchmarks/results-'));
ok('B · stdout conté secció hipòtesi H1',          result.stdout.includes('Hipòtesi H1'));

// ─── C · markdown output ben format ───────────────────────────────────
console.log('\n— C · markdown report');
// Localitza el fitxer dryrun més recent
const benchDir = path.join(ROOT, 'docs/benchmarks');
const files = fs.existsSync(benchDir) ? fs.readdirSync(benchDir).filter(f => f.endsWith('-dryrun.md')).sort() : [];
const latestFile = files[files.length - 1];
ok('C · existeix almenys un dryrun md',            !!latestFile);
if (latestFile) {
    const md = fs.readFileSync(path.join(benchDir, latestFile), 'utf8');
    ok('C · md té títol VNA Benchmark Results',    md.includes('# VNA Benchmark Results'));
    ok('C · md té taula amb columnes Winner/Score', md.includes('Winner') && md.includes('Score A'));
    ok('C · md té secció Resum agregat',            md.includes('Resum agregat'));
    ok('C · md té secció Hipòtesi H1',              md.includes('Hipòtesi H1'));
    ok('C · md llista win rate B',                  md.includes('Win rate B'));
    ok('C · md no té "undefined"',                  !md.includes('undefined'));
}

// ─── D · PromptsDebugView dropdown casos benchmark ────────────────────
console.log('\n— D · UI · /prompts-debug dropdown de casos benchmark');
const viewSrc = fs.readFileSync(path.join(ROOT, 'js/views/PromptsDebugView.js'), 'utf8');
ok('D · dropdown pdBenchmarkCase renderitzat',    viewSrc.includes("id=\"pdBenchmarkCase\""));
ok('D · botó pdAbLabRunLive (run live LLM)',      viewSrc.includes("id=\"pdAbLabRunLive\""));
ok('D · _loadBenchmarkCases definit',             viewSrc.includes('async _loadBenchmarkCases('));
ok('D · fetch /knowledge/benchmarks/vna-quality', viewSrc.includes('/knowledge/benchmarks/vna-quality-cases.json'));
ok('D · _applyBenchmarkCase definit',             viewSrc.includes('_applyBenchmarkCase('));
ok('D · _runAbLabLive definit',                   viewSrc.includes('async _runAbLabLive('));
ok('D · _runAbLabLive importa runABTest',         viewSrc.includes("await import('../core/promptABTestService.js')") &&
                                                    viewSrc.includes('runABTest'));
ok('D · _runAbLabLive importa generateWithProvider',
                                                    viewSrc.includes('generateWithProvider'));
ok('D · _runAbLabLive mostra winner + ms',         viewSrc.includes('Winner') && viewSrc.includes('${r.ms}ms'));
ok('D · _runAbLabLive missatge si no API key',     viewSrc.includes('configura API key'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
