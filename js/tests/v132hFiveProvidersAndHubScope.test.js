// =============================================================================
// TEAMTOWERS SOS V11 — v132h · 5 providers benchmark + Project Hub WO refinements · TDD
// Ruta · /js/tests/v132hFiveProvidersAndHubScope.test.js
//
// Verifica · CLI suporta deepseek + minimax (5 providers totals) + backlog
// refinaments · scope projecte-not-persona · presentation page · pattern
// canonical submenú (refent LearnView).
// =============================================================================

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v132h · 5 providers + Project Hub scope refinaments · TDD ===\n');

// ─── A · CLI · 2 nous adapters · deepseek + minimax ───────────────────
console.log('— A · CLI adapters · deepseek + minimax');
const cliPath = path.join(ROOT, 'scripts/run-vna-benchmark.mjs');
const cliSrc = fs.readFileSync(cliPath, 'utf8');
ok('A · DeepSeek adapter present',                cliSrc.includes("name === 'deepseek'") && cliSrc.includes('api.deepseek.com'));
ok('A · DeepSeek llegeix DEEPSEEK_API_KEY',       cliSrc.includes('process.env.DEEPSEEK_API_KEY'));
ok('A · DeepSeek default model deepseek-chat',    cliSrc.includes("'deepseek-chat'"));
ok('A · MiniMax adapter present',                 cliSrc.includes("name === 'minimax'") && cliSrc.includes('api.minimaxi.com'));
ok('A · MiniMax llegeix MINIMAX_API_KEY',         cliSrc.includes('process.env.MINIMAX_API_KEY'));
ok('A · MiniMax default model MiniMax-Text-01',   cliSrc.includes("'MiniMax-Text-01'"));
ok('A · help text llista 5 providers',            cliSrc.includes('anthropic,openai,gemini,deepseek,minimax'));
ok('A · error desconegut llista 5 disponibles',   cliSrc.includes('anthropic · openai · gemini · deepseek · minimax'));

// ─── B · dry-run amb 5 providers ──────────────────────────────────────
console.log('\n— B · execució dry-run 5 providers · 1 cas');
const result = spawnSync('node', [cliPath, '--dry-run', '--limit', '1',
    '--providers', 'anthropic,openai,gemini,deepseek,minimax'],
    { cwd: ROOT, encoding: 'utf8', timeout: 20000 });
ok('B · exit code 0',                             result.status === 0);
ok('B · executa anthropic',                       result.stdout.includes('[anthropic ·'));
ok('B · executa openai',                          result.stdout.includes('[openai ·'));
ok('B · executa gemini',                          result.stdout.includes('[gemini ·'));
ok('B · executa deepseek',                        result.stdout.includes('[deepseek ·'));
ok('B · executa minimax',                         result.stdout.includes('[minimax ·'));
ok('B · output md multi té 5 files de provider', (() => {
    const benchDir = path.join(ROOT, 'docs/benchmarks');
    const files = fs.existsSync(benchDir) ? fs.readdirSync(benchDir).filter(f => f.endsWith('-multi.md')).sort() : [];
    const latest = files[files.length - 1];
    if (!latest) return false;
    const md = fs.readFileSync(path.join(benchDir, latest), 'utf8');
    return md.includes('| anthropic |') && md.includes('| openai |') &&
           md.includes('| gemini |') && md.includes('| deepseek |') && md.includes('| minimax |');
})());

// ─── C · backlog · refinaments scope project-not-persona ──────────────
console.log('\n— C · backlog · refinaments scope');
const yaml = fs.readFileSync(path.join(ROOT, 'docs/backlog.yaml'), 'utf8');
ok('C · scope clarifica · NOMÉS vistes de PROJECTE no persona',
                                                    yaml.includes('NO persona') && yaml.includes('NO toca vistes de persona'));
ok('C · 5 pestanyes principals (no 4)',           yaml.includes('Pestanyes principals (visibles · 5)'));
ok('C · pestanya nova · Presentation',            yaml.includes('5. Presentation'));
ok('C · presentation té secció Canvas + Pitch',   yaml.includes('Canvas · info estructurada') && yaml.includes('Pitch · narrativa'));
ok('C · presentation menciona IA precisa',        yaml.includes("Arquitectura d'Informació") && yaml.includes('IA-precisa'));
ok('C · referencia LearnView com a pattern',      yaml.includes('LearnView') && yaml.includes('.lv-tab') && yaml.includes('data-mode'));
ok('C · referencia wo-submenu-pattern-canonical', yaml.includes('wo-submenu-pattern-canonical'));

// ─── D · nova WO · submenu pattern canonical ──────────────────────────
console.log('\n— D · nova WO · wo-submenu-pattern-canonical');
ok('D · WO present al yaml',                      yaml.includes('id: "wo-submenu-pattern-canonical"'));
ok('D · menciona component compartit · SubmenuTabs',
                                                    yaml.includes('SubmenuTabs'));
ok('D · 5 tasques including audit + migration + doc',
                                                    yaml.includes('Auditar totes les vistes') &&
                                                    yaml.includes('Migrar LearnView') &&
                                                    yaml.includes('docs/ux/SUBMENU-PATTERN.md'));
ok('D · acceptance regression-safe LearnView',     yaml.includes('LearnView funciona idènticament'));
ok('D · anti-pattern documentat',                  yaml.includes('Anti-pattern a evitar'));
ok('D · prioritat high · complexitat M',           /id: "wo-submenu-pattern-canonical"[\s\S]+?priority: high[\s\S]+?complexity: M/.test(yaml));

// ─── E · backlog.json regenerat ───────────────────────────────────────
console.log('\n— E · backlog.json regenerat');
const bjson = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/backlog.json'), 'utf8'));
const ids = (bjson.work_orders || []).map(w => w.id);
ok('E · backlog.json conté wo-submenu-pattern-canonical', ids.includes('wo-submenu-pattern-canonical'));
ok('E · backlog.json conté wo-project-hub-subtabs',       ids.includes('wo-project-hub-subtabs'));
const subtabs = (bjson.work_orders || []).find(w => w.id === 'wo-project-hub-subtabs');
ok('E · subtabs WO json · tags incluen "presentation"',    subtabs?.tags?.includes('presentation'));
ok('E · subtabs WO json · tags incluen "information-architecture"', subtabs?.tags?.includes('information-architecture'));

// ─── F · LearnView · pattern existeix (avui MIGRAT al component canonical v133) ───
console.log('\n— F · LearnView · referent · ara migrat a SubmenuTabs.js');
const learn = fs.readFileSync(path.join(ROOT, 'js/views/LearnView.js'), 'utf8');
ok('F · LearnView usa SubmenuTabs canonical (post v133)',
                                                    learn.includes("from '../ui/SubmenuTabs.js'"));
ok('F · LearnView preserva backwards-compat [data-mode] handler',
                                                    learn.includes("querySelectorAll('[data-mode]')"));
ok('F · LearnView usa this._mode state',           learn.includes('this._mode'));
ok('F · LearnView accepta ?tab=X URL param',       learn.includes("p.get('tab')") || learn.includes('"tab"') || learn.includes("'tab'"));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
