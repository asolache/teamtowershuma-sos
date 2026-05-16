// =============================================================================
// TEAMTOWERS SOS V11 — PRODUCTION BUGS BATCH 1 · TDD (PR-F)
// Ruta · /js/tests/productionBugsBatch1.test.js
//
// Blinda els 6 bugs de producció reportats per @alvaro ·
//   B1 · avatar dropdown · data-nav-group="identity" present al HTML
//   B2 · ESC tanca el sos-global-search (clear+blur)
//   B3 · ProjectCreationV2 + CreateLive usen navigateTo (no full reload)
//   B4 · aiDrivenCreationAdapter · auto-load preferredProvider del KB
//        + logging d'errors via onModelUsed amb errorCode
//   B5 · CreateLiveView · sync immediat del draft amb result final
//   B6 · vnaExpertPrompts · SYSTEM_BASE + task prompts amb requisits qualitat
// =============================================================================

import { renderGlobalNavHtml } from '../core/navService.js';
import { SYSTEM_BASE, buildPrompt } from '../core/vnaExpertPrompts.js';
import { buildAiCallbacks } from '../core/aiDrivenCreationAdapter.js';
import fs from 'node:fs';

let pass = 0, fail = 0;
function ok(label, cond, expected = '', got = '') {
    if (cond) { pass++; console.log('✓', label); }
    else {
        fail++;
        const detail = (expected !== '' || got !== '') ? ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})` : '';
        console.log('✗', label + detail);
    }
}

console.log('=== PRODUCTION-BUGS · BATCH 1 (PR-F) ===\n');

// ─── B1 · avatar dropdown ──────────────────────────────────────────────
console.log('— B1 · avatar dropdown · data-nav-group="identity"');
const navHtml = renderGlobalNavHtml({ pathname: '/home' });
ok('B1 · identity div té data-nav-group="identity"', navHtml.includes('data-nav-group="identity"'));
ok('B1 · identity div manté classe sos-nav-group (compat)', navHtml.includes('sos-nav-group sos-global-nav-identity'));
ok('B1 · avatar button té aria-haspopup', navHtml.includes('aria-haspopup="menu"'));

// ─── B2 · ESC clear+blur al global search ──────────────────────────────
console.log('\n— B2 · ESC tanca el global search');
const navSrc = fs.readFileSync(new URL('../core/navService.js', import.meta.url), 'utf8');
ok('B2 · navService maneja ev.key === "Escape"', navSrc.includes("ev.key === 'Escape'"));
ok('B2 · ESC fa input.blur()', navSrc.includes('input.blur()'));
ok('B2 · ESC neteja input.value', navSrc.match(/Escape[\s\S]{0,150}input\.value = ['"]['"]/));

// ─── B3 · navigateTo (no full reload) ──────────────────────────────────
console.log('\n— B3 · ProjectCreationV2 + CreateLive usen navigateTo (SPA)');
const pcvSrc = fs.readFileSync(new URL('../views/ProjectCreationV2View.js', import.meta.url), 'utf8');
const clvSrc = fs.readFileSync(new URL('../views/CreateLiveView.js', import.meta.url), 'utf8');
ok('B3 · ProjectCreationV2 · cap window.location.href = nu (sense navigateTo wrap)',
    !pcvSrc.match(/^\s+window\.location\.href = ['"]\//m) || pcvSrc.includes('window.navigateTo'));
ok('B3 · ProjectCreationV2 · usa window.navigateTo', pcvSrc.includes('window.navigateTo'));
ok('B3 · CreateLiveView · usa window.navigateTo', clvSrc.includes('window.navigateTo'));

// ─── B4 · adapter auto-load preferredProvider + log errors ──────────────
console.log('\n— B4 · adapter auto-load preferredProvider + log errors');
const adapterSrc = fs.readFileSync(new URL('../core/aiDrivenCreationAdapter.js', import.meta.url), 'utf8');
ok('B4 · adapter llegeix sos_ai_provider del KB', adapterSrc.includes('sos_ai_provider'));
ok('B4 · adapter exposa _ensurePreferred', adapterSrc.includes('_ensurePreferred'));
ok('B4 · adapter té _logError helper', adapterSrc.includes('_logError'));
ok('B4 · adapter passa errorCode a onModelUsed', adapterSrc.includes('errorCode'));
ok('B4 · adapter detecta payment-required', adapterSrc.includes('payment'));

// Comprova que onModelUsed rep errors
const errors = [];
const cb = buildAiCallbacks({
    generateWithProvider: async () => { throw new Error('Test error'); },
    preferredProvider: null,   // null explícit · no auto-load del KB en test
    onModelUsed: (info) => errors.push(info),
});
const r1 = await cb.pickSocs({ candidates: [{ relpath: 'x' }], ctx: {} });
ok('B4 · pickSocs error · fallback a candidates', Array.isArray(r1.selected) && r1.selected.length > 0);
ok('B4 · pickSocs error · onModelUsed cridat amb error', errors.length > 0 && errors[0].error);
ok('B4 · pickSocs error · errorCode present', errors.length > 0 && errors[0].errorCode);

// ─── B5 · CreateLiveView sync immediat draft ──────────────────────────
console.log('\n— B5 · CreateLiveView sync immediat del draft amb result');
ok('B5 · CreateLiveView assigna this._draft.roles després del result', clvSrc.includes('this._draft.roles'));
ok('B5 · CreateLiveView crida _renderTabs() després del sync', clvSrc.match(/this\._draft\.socsSelected[\s\S]{0,120}this\._renderTabs\(\)/));
ok('B5 · CreateLiveView sincronitza també deliverables', clvSrc.includes('this._draft.deliverables'));

// ─── B6 · context IA enriquit per qualitat ────────────────────────────
console.log('\n— B6 · SYSTEM_BASE amb requisits de qualitat explícits');
ok('B6 · SYSTEM_BASE menciona QUALITAT MÍNIMA', SYSTEM_BASE.includes('QUALITAT MÍNIMA'));
ok('B6 · SYSTEM_BASE prohibeix placeholders', SYSTEM_BASE.includes('placeholder'));
ok('B6 · SYSTEM_BASE menciona dtd_test concret', SYSTEM_BASE.includes('dtd_test'));
ok('B6 · SYSTEM_BASE requereix steps convertibles a WO', SYSTEM_BASE.includes('CONVERTIBLE A WORK ORDER'));
ok('B6 · SYSTEM_BASE menciona consultora sènior', SYSTEM_BASE.includes('consultora sènior'));

// Task prompts enriquits
const sopPrompt = buildPrompt({ taskKind: 'generate-sops-from-soc', context: { name: 'X', soc: { title: 'T' }, project_ctx: { description: 'd' }, role_kinds: ['founder'] } });
ok('B6 · generate-sops prompt menciona REQUISITS QUALITAT', sopPrompt.user.includes('REQUISITS QUALITAT'));
ok('B6 · generate-sops prompt menciona description', sopPrompt.user.includes('description'));
ok('B6 · generate-sops prompt menciona test booleà', sopPrompt.user.includes('booleà') || sopPrompt.user.includes('test'));

const woPrompt = buildPrompt({ taskKind: 'generate-wos-from-sop', context: { name: 'X', sop: { id: 's', steps: [] }, project_ctx: { description: 'd' } } });
ok('B6 · generate-wos prompt menciona REQUISITS QUALITAT', woPrompt.user.includes('REQUISITS QUALITAT'));
ok('B6 · generate-wos prompt menciona test BOOLEÀ verificable', woPrompt.user.includes('BOOLEÀ verificable'));
ok('B6 · generate-wos prompt menciona Kanban', woPrompt.user.includes('Kanban'));

// Budget tokens encara <3500
ok('B6 · prompts encara dins budget · sop <3500 tokens', sopPrompt.approxTokens < 3500, '<3500', sopPrompt.approxTokens);
ok('B6 · prompts encara dins budget · wo <3500 tokens', woPrompt.approxTokens < 3500, '<3500', woPrompt.approxTokens);

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
