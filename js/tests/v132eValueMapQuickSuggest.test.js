// =============================================================================
// TEAMTOWERS SOS V11 — v132e · ValueMapView usa quickSuggestMap · TDD
// Ruta · /js/tests/v132eValueMapQuickSuggest.test.js
//
// Verifica · refactor no-breaking de ValueMapView._runAISuggestion · feature
// flag preservat (legacy via ?vmap_ui=legacy) · adapter Orchestrator→provider ·
// existingMap injectat si hasRoles · escalation passa via onProgress.
// =============================================================================

import fs from 'node:fs';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v132e · ValueMapView · migració quickSuggestMap (no-breaking) ===\n');

const src = fs.readFileSync(new URL('../views/ValueMapView.js', import.meta.url), 'utf8');

// ─── A · canonical path (v158 · legacy eliminat) ──────────────────────
console.log('— A · canonical path · v158 elimina legacy');
ok('A · default · path NOU (quickSuggest)',            src.includes('this._runAISuggestionQuickSuggest('));
ok('A · v158 · legacy ELIMINAT (no useLegacy)',        !src.includes("get('vmap_ui') === 'legacy'"));
ok('A · v158 · NO crida _runAISuggestionLegacy',       !src.includes('this._runAISuggestionLegacy('));
ok('A · outer try/catch UI unified',                   src.includes("catch (err)") && src.includes("'❌ Error: '"));

// ─── B · path NOU · _runAISuggestionQuickSuggest ──────────────────────
console.log('\n— B · _runAISuggestionQuickSuggest implementació');
ok('B · método definit',                               src.includes('async _runAISuggestionQuickSuggest('));
ok('B · importa vnaQuickSuggest dynamicament',         src.includes("await import('../core/vnaQuickSuggest.js')"));
ok('B · crea adapter Orchestrator → provider',         src.includes('const provider = async (_modelKey, opts)') && src.includes('Orchestrator.callLLM'));
ok('B · provider retorna { text, usage }',             /return \{ text, usage:/.test(src));
ok('B · adapter parse content string vs object',       src.includes("typeof result?.content === 'string'"));
ok('B · build description amb projectMeta (subtype hint)',
   src.includes('iaContextHint'));
ok('B · crida quickSuggestMap amb context complet',     src.includes('await quickSuggestMap({'));
ok('B · slim:true default v132e',                       src.includes('slim: true,'));
ok('B · qualityThreshold: 60 (més tolerant que chain)', src.includes('qualityThreshold: 60'));
ok('B · existingMap injectat si hasRoles',              src.includes('existingMap: hasRoles ? {'));
ok('B · onProgress emet UI escalating',                  src.includes("if (p.step === 'escalating')") && src.includes('Escalant'));

// ─── C · gestió output · _aiProposals + fases UI ──────────────────────
console.log('\n— C · output handling · _aiProposals + Phase1/2 transition');
ok('C · gestiona !r.ok · status text + reset button',   src.includes('if (!r.ok || !r.map ||') && src.includes('t(\'ai.no.results\')'));
ok('C · success · this._aiProposals = { roles, transactions }',
   src.includes('this._aiProposals = { roles: r.map.roles, transactions: r.map.transactions }'));
ok('C · success · _renderProposals invocat',            src.includes('this._renderProposals(r.map.roles, r.map.transactions)'));
ok('C · Phase1 ocult · Phase2 visible',                 src.includes("vmapAIPhase1').style.display = 'none'") &&
                                                          src.includes("vmapAIPhase2').style.display = 'block'"));
ok('C · log info si escalatedToFull',                   src.includes('escalat a FULL prompt'));

// ─── D · v158 · legacy ELIMINAT (simplificació) ───────────────────────
console.log('\n— D · v158 · path únic · legacy completament eliminat');
ok('D · _runAISuggestionLegacy NO definit',             !src.includes('async _runAISuggestionLegacy('));
ok('D · v158 · comentari simplificació present',        src.includes('v158 · canonical · path únic'));

// ─── E · vnaQuickSuggest mòdul disponible ─────────────────────────────
console.log('\n— E · vnaQuickSuggest (v132d) disponible per a ValueMapView');
const qs = fs.readFileSync(new URL('../core/vnaQuickSuggest.js', import.meta.url), 'utf8');
ok('E · vnaQuickSuggest.js exporta quickSuggestMap',    qs.includes('export async function quickSuggestMap('));

// ─── F · backwards compat · _runAISuggestion API intacta ──────────────
console.log('\n— F · _runAISuggestion API intacta (no breaking)');
ok('F · _runAISuggestion segueix sense args',           /async _runAISuggestion\(\)/.test(src));
ok('F · vmapAIGenerate listener no canviat',            src.includes("'vmapAIGenerate'")
                                                          && src.includes("() => this._runAISuggestion(), { once: true }"));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
