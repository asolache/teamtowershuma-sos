// =============================================================================
// TEAMTOWERS SOS V11 — v157 · Autonomous loop summary modal · TDD
// Resol bug @alvaro · "loop processa N WOs però només es veu/guarda l'última"
// (cada _openExecutionModal sobreescrivia el modal anterior · només l'últim
// quedava visible · ara silent mode + summary modal amb totes les WOs).
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v157 · Autonomous loop summary · TDD ===\n');

const kb = fs.readFileSync(path.join(ROOT, 'js/views/KanbanView.js'), 'utf8');

// ─── A · _executeAi silent mode + return ─────────────────────────────
console.log('— A · _executeAi silent mode + retorna resultat');
ok('A · _executeAi accepta extras = {}',          /async _executeAi\(woId, extras = \{\}\)/.test(kb));
ok('A · silent flag des de extras.__silent',      kb.includes('const silent = !!extras.__silent;'));
ok('A · comentari v157 silent mode',              kb.includes('v157 · silent mode'));
ok('A · openExecutionModal loading wrapped',      kb.includes("if (!silent) this._openExecutionModal(wo, { state: 'loading' });"));
ok('A · openExecutionModal ready wrapped',        /if \(!silent\) this\._openExecutionModal\(updated, \{[\s\S]{0,200}state: 'ready'/.test(kb));
ok('A · openExecutionModal tdd-passed wrapped',   /if \(!silent\) this\._openExecutionModal\([\s\S]{0,200}state: 'tdd-passed'/.test(kb));
ok('A · openExecutionModal tdd-failed wrapped',   /if \(!silent\) this\._openExecutionModal\(failed, \{[\s\S]{0,80}state: 'tdd-failed'/.test(kb));
ok('A · openExecutionModal error wrapped',        /if \(!silent\) this\._openExecutionModal\(wo, \{[\s\S]{0,80}state: 'error'/.test(kb));
ok('A · retorna { ok:true, state:ready, ... }',   /return \{ ok: true, wo: updated, aiOutput, state: 'ready'/.test(kb));
ok('A · retorna { ok:true, state:tdd-passed }',   /return \{ ok: true, wo: updated, aiOutput, state: 'tdd-passed'/.test(kb));
ok('A · retorna { ok:false, state:tdd-failed }',  /return \{ ok: false, wo: failed, aiOutput, state: 'tdd-failed'/.test(kb));
ok('A · retorna { ok:false, state:error, err }',  /return \{ ok: false, wo, aiOutput: null, state: 'error', error:/.test(kb));
ok('A · si !wo retorna null',                     /if \(!wo\) return null;/.test(kb));

// ─── B · _runAutonomousLoop col·lecciona resultats ───────────────────
console.log('\n— B · _runAutonomousLoop col·lecciona resultats');
ok('B · array results = []',                      kb.includes('const results = [];'));
ok('B · crida _executeAi amb __silent: true',     kb.includes("await this._executeAi(batch[i].id, { __silent: true });"));
ok('B · push result per cada WO',                 kb.includes('results.push(r ||'));
ok('B · catch push state:error',                  /results\.push\(\{ ok: false, wo: batch\[i\], state: 'error'/.test(kb));
ok('B · al final crida _openAutonomousLoopSummary',
                                                    kb.includes('this._openAutonomousLoopSummary(results);'));
ok('B · comentari v157 al loop',                  kb.includes('v157 · col·lecciona resultats'));
// regressió · NO tornem a usar ok/fail toast simple (substituït pel summary)
ok('B · NO usem toast simple "Loop acabat ·"',    !kb.includes("'🤖 Loop acabat · '"));

// ─── C · _openAutonomousLoopSummary modal ────────────────────────────
console.log('\n— C · _openAutonomousLoopSummary modal');
ok('C · mètode definit',                          kb.includes('_openAutonomousLoopSummary(results = [])'));
ok('C · usa root kbExecRoot',                     /_openAutonomousLoopSummary[\s\S]{0,400}getElementById\('kbExecRoot'\)/.test(kb));
ok('C · títol "Loop autonomous · summary"',       kb.includes('🤖 Loop autonomous · summary'));
ok('C · comptador ok/fail',                       /\$\{ok\} ✓/.test(kb) && /\$\{fail\} ✗/.test(kb));
ok('C · explica "ja s\'ha guardat"',              kb.includes("ja s'ha guardat"));
ok('C · botó tancar',                             kb.includes('id="kbExecClose"'));

// ─── D · per-row actions · Veure / Ledger / Re-run ───────────────────
console.log('\n— D · per-row actions');
ok('D · data-loop-view button (👁 Veure)',         kb.includes('data-loop-view=') && kb.includes('👁 Veure'));
ok('D · data-loop-ledger button (✓ Ledger)',      kb.includes('data-loop-ledger=') && kb.includes('✓ Ledger'));
ok('D · data-loop-rerun button (🔁 Re-run)',      kb.includes('data-loop-rerun=') && kb.includes('🔁 Re-run'));
ok('D · view obre _openExecutionModal',           /data-loop-view[\s\S]{0,400}this\._openExecutionModal\(r\.wo/.test(kb));
ok('D · ledger crida _ledgerize',                 /data-loop-ledger[\s\S]{0,300}this\._ledgerize\(woId/.test(kb));
ok('D · rerun crida _executeAi(woId)',            /data-loop-rerun[\s\S]{0,300}this\._executeAi\(woId\)/.test(kb));
ok('D · preview aiOutput (details)',              kb.includes('Preview · primers 200 chars'));
ok('D · empty case · "Cap resultat"',             kb.includes('Cap resultat'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
