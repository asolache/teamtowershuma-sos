// =============================================================================
// TEAMTOWERS SOS V11 — v132g · Benchmark Multi-Provider · TDD
// Ruta · /js/tests/v132gMultiProviderBenchmark.test.js
//
// Verifica · scripts/run-vna-benchmark.mjs suporta --providers csv · executa
// els N providers · output md amb matriu casos × providers + resum agregat
// per provider + anàlisi cross-provider (decisió slim per-provider vs global).
// =============================================================================

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v132g · benchmark multi-provider · TDD ===\n');

// ─── A · CLI suporta --providers csv ──────────────────────────────────
console.log('— A · CLI flags + adapters');
const cliPath = path.join(ROOT, 'scripts/run-vna-benchmark.mjs');
const cliSrc = fs.readFileSync(cliPath, 'utf8');
ok('A · suporta --providers (csv)',                cliSrc.includes("'--providers'"));
ok('A · parseArgs crea providerList',              cliSrc.includes('providerList'));
ok('A · providerList = csv.split(",")',            cliSrc.includes("split(',')"));
ok('A · backwards-compat · --provider single',     cliSrc.includes("'--provider'"));
ok('A · Gemini adapter present',                   cliSrc.includes("name === 'gemini'") && cliSrc.includes('generativelanguage.googleapis.com'));
ok('A · Gemini llegeix GEMINI_API_KEY o GOOGLE_API_KEY',
                                                    cliSrc.includes('GEMINI_API_KEY') && cliSrc.includes('GOOGLE_API_KEY'));
ok('A · renderMarkdownMulti definit',              cliSrc.includes('function renderMarkdownMulti('));
ok('A · runOneProvider helper · refactor net',     cliSrc.includes('async function runOneProvider('));

// ─── B · dry-run multi · 3 providers · 2 casos ────────────────────────
console.log('\n— B · execució dry-run multi (3 providers · 2 casos)');
const result = spawnSync('node', [cliPath, '--dry-run', '--limit', '2', '--providers', 'anthropic,openai,gemini'],
    { cwd: ROOT, encoding: 'utf8', timeout: 15000 });
ok('B · exit code 0',                              result.status === 0);
ok('B · header indica v132g MULTI-PROVIDER',       result.stdout.includes('v132g · MULTI-PROVIDER'));
ok('B · llista 3 providers a header',              result.stdout.includes('anthropic, openai, gemini'));
ok('B · executa cada provider seqüencialment',     result.stdout.includes('[anthropic ·') &&
                                                    result.stdout.includes('[openai ·') &&
                                                    result.stdout.includes('[gemini ·'));
ok('B · output file té sufix -multi.md',           result.stdout.includes('-multi.md'));

// ─── C · markdown multi-provider ben format ───────────────────────────
console.log('\n— C · markdown multi-provider');
const benchDir = path.join(ROOT, 'docs/benchmarks');
const multiFiles = fs.existsSync(benchDir) ? fs.readdirSync(benchDir).filter(f => f.endsWith('-multi.md')).sort() : [];
const latestMulti = multiFiles[multiFiles.length - 1];
ok('C · existeix almenys un multi.md',             !!latestMulti);
if (latestMulti) {
    const md = fs.readFileSync(path.join(benchDir, latestMulti), 'utf8');
    ok('C · md té títol MULTI-PROVIDER',           md.includes('MULTI-PROVIDER'));
    ok('C · md té matriu casos × providers · winner',
                                                    md.includes('Matriu casos × providers · winner'));
    ok('C · md té matriu casos × providers · scores',
                                                    md.includes('Matriu casos × providers · scores'));
    ok('C · md té secció "Resum agregat per provider"',
                                                    md.includes('Resum agregat per provider'));
    ok('C · md té secció "Anàlisi cross-provider"',
                                                    md.includes('Anàlisi cross-provider'));
    ok('C · md llista win rate B per provider',    (md.match(/Win rate B/g) || []).length >= 1);
    ok('C · md detecta spread cross-provider',     md.includes('Spread ·'));
    ok('C · md no té "undefined"',                  !md.includes('undefined'));
    ok('C · header taula resum incluye providers', md.includes('| Provider |') && md.includes('| Total |'));
}

// ─── D · backwards-compat · single provider segueix funcionant ────────
console.log('\n— D · backwards-compat · single provider');
const single = spawnSync('node', [cliPath, '--dry-run', '--limit', '2'],
    { cwd: ROOT, encoding: 'utf8', timeout: 15000 });
ok('D · single provider · exit code 0',            single.status === 0);
ok('D · header NO menciona MULTI-PROVIDER',        !single.stdout.includes('MULTI-PROVIDER'));
ok('D · output file NO té sufix -multi',           !single.stdout.match(/-multi\.md/));

// ─── E · cross-provider analysis · veredicte automàtic ────────────────
console.log('\n— E · veredicte automàtic cross-provider');
ok('E · cas CONSENS si tots ≥ 60%',                cliSrc.includes("'CONSENS'") || cliSrc.includes('CONSENS'));
ok('E · cas DIVERGÈNCIA si spread ≥ 20',           cliSrc.includes('DIVERGÈNCIA') && cliSrc.includes('spread ≥ 20'));
ok('E · cas CONSENS NEGATIU si tots < 60%',        cliSrc.includes('CONSENS NEGATIU'));
ok('E · cas MIXT si entre mig',                    cliSrc.includes('MIXT'));

// ─── F · backlog · noves entrades v132g ───────────────────────────────
console.log('\n— F · backlog · entrades noves');
const yaml = fs.readFileSync(path.join(ROOT, 'docs/backlog.yaml'), 'utf8');
ok('F · backlog · wo-project-hub-subtabs',         yaml.includes('wo-project-hub-subtabs'));
ok('F · backlog · wo-benchmark-multi-api-compare', yaml.includes('wo-benchmark-multi-api-compare'));
ok('F · backlog · hub subtabs menciona Kanban',    yaml.includes('Kanban') && yaml.includes('subpestanyes'));
ok('F · backlog · hub subtabs menciona dropdown · Pactes · legal agents',
                                                    yaml.includes('Pactes') && yaml.includes('legal-agents'));
const bjson = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/backlog.json'), 'utf8'));
const ids = (bjson.work_orders || []).map(w => w.id);
ok('F · backlog.json regenerat amb noves entrades', ids.includes('wo-project-hub-subtabs') && ids.includes('wo-benchmark-multi-api-compare'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
