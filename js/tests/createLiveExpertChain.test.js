// =============================================================================
// TEAMTOWERS SOS V11 — CREATE LIVE · EXPERT-CHAIN INTEGRATION · TDD
// Ruta · /js/tests/createLiveExpertChain.test.js
//
// Verifica que CreateLiveView delega a runExpertChain quan
// generationMode === 'expert-chain' (v122).
// Test estructural · string del source · sense executar la view (que demana
// DOM). El runExpertChain ja té test propi a orchestratorChainRouter.test.js.
// =============================================================================

import fs from 'node:fs';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== CREATE LIVE · EXPERT-CHAIN INTEGRATION (v122) ===\n');

const src = fs.readFileSync(new URL('../views/CreateLiveView.js', import.meta.url), 'utf8');

// ─── A · Imports + dispatch ────────────────────────────────────────────
console.log('— A · Imports + dispatch generationMode');
ok('A · importa runExpertChain',                src.includes("import { runExpertChain"));
ok('A · importa CHAIN_PHASES',                  src.includes('CHAIN_PHASES'));
ok('A · dispatch expert-chain dins _runPipeline', src.includes("generationMode === 'expert-chain'"));
ok('A · delega a _runExpertChainPipeline',      src.includes('_runExpertChainPipeline()'));

// ─── B · _runExpertChainPipeline method · contracte ────────────────────
console.log('\n— B · Mètode _runExpertChainPipeline');
ok('B · mètode definit',                                src.includes('async _runExpertChainPipeline()'));
ok('B · lazy-load aiProviderService.generateWithProvider', src.includes("await import('../core/aiProviderService.js')"));
ok('B · context té name + description + sector',        src.includes('context = {') && src.includes('description:'));
ok('B · maxCostEur per ambition (max/standard/light)',  src.includes('maxCostEur') && src.includes("'max'") && src.includes("'standard'"));
ok('B · crida runExpertChain amb generateWithProvider', src.includes('await runExpertChain({'));
ok('B · onEvent → _handleEvent',                        src.includes('onEvent: (e) => this._handleEvent(e)'));

// ─── C · Persistència KB · projecte + socs + sops + wos ────────────────
console.log('\n— C · Persistència KB');
ok('C · projectNode amb kind=project',          src.includes("kind: 'project'") && src.includes('expert_chain_version'));
ok('C · persist socs amb kind=soc',             src.includes("kind: 'soc'"));
ok('C · persist sops amb kind=sop',             src.includes("kind: 'sop'"));
ok('C · persist wos amb kind=wo',               src.includes("kind: 'wo'"));
ok('C · presentation_hints capturat al projecte', src.includes('presentation_hints'));
ok('C · dispatch CREATE_PROJECT',               src.includes("type: 'CREATE_PROJECT'"));

// ─── D · UX finish + sync tabs ─────────────────────────────────────────
console.log('\n— D · UX · render finish bar + sync tabs');
ok('D · sync _draft.canvas + pitch + sops + socs + wos', src.includes('this._draft.canvas') && src.includes('this._draft.socs') && src.includes('this._draft.wos'));
ok('D · renderFinishBar amb result',            src.includes('this._renderFinishBar(result)'));
ok('D · toast success amb cost + phases',       src.includes('Expert-chain ·') && src.includes('costTotal'));
ok('D · neteja payload sessionStorage',         src.includes("sessionStorage.removeItem('createLivePayload')"));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
