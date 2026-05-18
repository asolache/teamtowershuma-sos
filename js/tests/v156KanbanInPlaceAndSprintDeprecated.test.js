// =============================================================================
// TEAMTOWERS SOS V11 — v156 · Kanban swarm IN-PLACE + autonomous loop + Sprint deprecated · TDD
// Resol bug @alvaro · "swarm IA redirigeix a /sprint en lloc d'executar in-place".
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v156 · Kanban swarm in-place + autonomous loop + Sprint deprecated · TDD ===\n');

const kb = fs.readFileSync(path.join(ROOT, 'js/views/KanbanView.js'), 'utf8');
const sp = fs.readFileSync(path.join(ROOT, 'js/views/SprintView.js'), 'utf8');

// ─── A · bug fix · swarm NO redirigeix a /sprint ──────────────────────
console.log('— A · bug fix · swarm NO redirigeix a /sprint');
ok('A · _bindSwarmButtons present',                  kb.includes('_bindSwarmButtons()'));
ok('A · NO window.location.href = "/sprint"',        !kb.includes("window.location.href = '/sprint?wo="));
ok('A · NO setTimeout(() => ...) per redirect',      !/setTimeout\([\s\S]{0,80}\/sprint\?wo=/.test(kb));
ok('A · swarm click crida this._executeAi(woId)',    /_bindSwarmButtons[\s\S]+?await this\._executeAi\(woId\)/.test(kb));
ok('A · comentari v156 explicant fix',                kb.includes('v156 · resol bug "swarm redirigeix a /sprint"'));

// ─── B · autonomous loop button + handler ──────────────────────────────
console.log('\n— B · autonomous loop button');
ok('B · botó kbBtnAutonomousLoop al toolbar',        kb.includes('id="kbBtnAutonomousLoop"'));
ok('B · botó · "🤖 Run autonomous loop" label',      kb.includes('🤖 Run autonomous loop'));
ok('B · botó · linkat a _runAutonomousLoop',         kb.includes('kbBtnAutonomousLoop') &&
                                                      kb.includes('this._runAutonomousLoop()'));
ok('B · _runAutonomousLoop · mètode definit',         kb.includes('async _runAutonomousLoop()'));
ok('B · filtra WOs pending + assignee.kind===ai',     /pending = \(this\.workOrders[\s\S]{0,300}assignee\?\.kind === 'ai'/.test(kb));
ok('B · prompt confirm max WOs · cancel safe',        kb.includes("prompt('Quantes WOs pending"));
ok('B · loop seqüencial · _executeAi per cada batch', /this\._executeAi\(batch\[i\]\.id/.test(kb));
ok('B · toast empty case · "Cap WO IA pending"',     kb.includes('Cap WO IA pending'));
ok('B · summary modal (v157) substitueix toast',     kb.includes('_openAutonomousLoopSummary'));
ok('B · re-render board + stats post-loop',           kb.includes('this._renderBoard?.()') && kb.includes('this._renderStats?.()'));

// ─── C · Sprint deprecation banner ─────────────────────────────────────
console.log('\n— C · Sprint deprecation banner');
ok('C · banner "DEPRECATED · /sprint serà eliminat"',sp.includes('DEPRECATED · /sprint serà eliminat'));
ok('C · banner link a /kanban?project=sos-dev-internal',
                                                      sp.includes('href="/kanban?project=sos-dev-internal"') ||
                                                      sp.includes("href=\"/kanban?project=sos-dev-internal\""));
ok('C · banner menciona "Run autonomous loop" al toolbar',
                                                      sp.includes('🤖 Run autonomous loop'));
ok('C · banner style accent-orange/yellow (warning)', sp.includes('rgba(245,158,11') || sp.includes('#fbbf24'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
