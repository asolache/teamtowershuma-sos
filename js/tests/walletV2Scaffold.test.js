// =============================================================================
// TEAMTOWERS SOS V11 — WALLET V2 SCAFFOLD · TDD (v128)
// Ruta · /js/tests/walletV2Scaffold.test.js
//
// Verifica · sprint v128 · esquelet de WalletV2View amb 6 pestanyes · routing
// `/wallet/v2` registrat · LearnView 'skills' tab eliminat per redundància.
// =============================================================================

import fs from 'node:fs';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== WALLET V2 SCAFFOLD + LEARN SKILLS CLEANUP (v128) ===\n');

const w2Src     = fs.readFileSync(new URL('../views/WalletV2View.js', import.meta.url), 'utf8');
const routerSrc = fs.readFileSync(new URL('../router.js', import.meta.url), 'utf8');
const learnSrc  = fs.readFileSync(new URL('../views/LearnView.js', import.meta.url), 'utf8');
const planDoc   = fs.readFileSync(new URL('../../docs/wallet-v2-accounting-integration-plan.md', import.meta.url), 'utf8');

// ─── A · WalletV2View scaffold · 6 pestanyes ────────────────────────────
console.log('— A · WalletV2View · 6 pestanyes');
ok('A · WalletV2View default export class',  /export default class WalletV2View/.test(w2Src));
ok('A · VALID_TABS conté 6 entries',          /VALID_TABS = Object\.freeze\(\['saldo', 'transaccions', 'compres', 'tarta', 'projectes', 'topup'\]\)/.test(w2Src));
const tabs = ['saldo', 'transaccions', 'compres', 'tarta', 'projectes', 'topup'];
for (const t of tabs) {
    ok('A · tab ' + t + ' al TAB_META', w2Src.includes(t + ':'));
    ok('A · _renderTab' + t.charAt(0).toUpperCase() + t.slice(1) + ' definit',
       w2Src.includes('_renderTab' + t.charAt(0).toUpperCase() + t.slice(1) + '(main)'));
}

// ─── B · routing · /wallet/v2 registrat ────────────────────────────────
console.log('\n— B · routing');
ok('B · /wallet/v2 route registrat',          /\{ path: '\/wallet\/v2'/.test(routerSrc));
ok('B · import WalletV2View al router',       /WalletV2View\.js/.test(routerSrc));
ok('B · /wallet legacy segueix funcionant',   /\{ path: '\/wallet',\s+view: \(\) => import\('\.\/views\/WalletView\.js'\)/.test(routerSrc));

// ─── C · UX · topbar canonical + tab switching ──────────────────────────
console.log('\n— C · UX integration');
ok('C · usa sosTopbar (renderViewTopbar)',     w2Src.includes('renderViewTopbar'));
ok('C · usa ensureTopbarStyle',                w2Src.includes('ensureTopbarStyle'));
ok('C · usa projectContextLinks',              w2Src.includes('projectContextLinks'));
ok('C · CSS w2-tabs pill style',               w2Src.includes('.w2-tab {') && w2Src.includes('.w2-tab-active'));
ok('C · responsive mobile · tab-label hidden', w2Src.includes('.w2-tab-label { display: none; }') || w2Src.includes('w2-tab-label'));
ok('C · tab handler · updateUrl + renderActiveTab', w2Src.includes('this._updateUrl()') && w2Src.includes('this._renderActiveTab()'));

// ─── D · LearnView · 'skills' tab eliminat ──────────────────────────────
console.log('\n— D · /learn · skills tab eliminat (v128)');
ok('D · VALID_MODES NO inclou "skills"',
   !/'skills'/.test(learnSrc.match(/VALID_MODES = Object\.freeze\(\[[^\]]+\]/)?.[0] || ''));
ok('D · cap button data-mode="skills"',        !learnSrc.includes('data-mode="skills"'));
ok('D · _renderSkillsTab method ELIMINAT',     !/\b_renderSkillsTab\(\) \{/.test(learnSrc));
ok('D · documenta v128 a comentari',           /v128.*skills.*elimin|elimin.*skills.*v128/i.test(learnSrc));

// ─── E · estat sprints · v129 done · v130/v131 placeholders ──────────
console.log('\n— E · sprint v129 implementat · v130/v131 segueixen placeholders');
ok('E · Saldo IMPLEMENTAT (no placeholder v129)',         !w2Src.includes('Pestanya Saldo · sprint v129'));
ok('E · Transaccions IMPLEMENTAT (no placeholder v129)',  !w2Src.includes('Pestanya Transaccions · sprint v129'));
ok('E · Projectes IMPLEMENTAT (no placeholder v129)',     !w2Src.includes('Pestanya Projectes · sprint v129'));
ok('E · Top-up encara placeholder v130',                  w2Src.includes('Top-up · sprint v130'));
ok('E · Tarta encara placeholder v131',                   w2Src.includes('Tarta · sprint v131'));
ok('E · Compres encara placeholder v131',                 w2Src.includes('Compres · sprint v131'));
ok('E · view usa els 4 serveis backend (reuse)',
   w2Src.includes('walletService') && w2Src.includes('unifiedAccountingService') && w2Src.includes('stripeService') && w2Src.includes('cryptoTopupService'));

// ─── F · pla doc · diagnòstic + 4 fases ────────────────────────────────
console.log('\n— F · docs/wallet-v2-accounting-integration-plan.md');
ok('F · doc menciona "diagnòstic actual"',     planDoc.toLowerCase().includes('diagnòstic'));
ok('F · doc llista 6 pestanyes',               planDoc.includes('💰 Saldo') && planDoc.includes('📊 Transaccions') && planDoc.includes('🥧 Tarta'));
ok('F · doc té 4 sprints (v128 → v131)',       planDoc.includes('Sprint v128') && planDoc.includes('Sprint v129') && planDoc.includes('Sprint v130') && planDoc.includes('Sprint v131'));
ok('F · doc té secció · Q&A decisions',        planDoc.includes('Q · ') && planDoc.includes('A · '));
ok('F · doc té mètrica èxit 30d',              planDoc.toLowerCase().includes('mètrica'));
ok('F · doc confirma integració /value-accounting embed', planDoc.includes('/value-accounting'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
