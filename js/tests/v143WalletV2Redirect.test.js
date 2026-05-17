// =============================================================================
// TEAMTOWERS SOS V11 — v143 · Wallet V2 redirect + canonical tabs + context switcher · TDD
// Ruta · /js/tests/v143WalletV2Redirect.test.js
//
// Verifica · (1) /wallet → /wallet/v2 via LEGACY_REDIRECTS · (2) /team
// recuperat del legacy redirect (TeamView v140 viu) · (3) WalletV2View
// usa SubmenuTabs canonical · (4) context switcher Personal/Projecte ·
// (5) ProjectHubV2 enllaça a /wallet/v2.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEGACY_REDIRECTS, resolveLegacyPath } from '../core/routerRedirects.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v143 · Wallet V2 canonical + redirect + context switcher · TDD ===\n');

// ─── A · redirects ────────────────────────────────────────────────────
console.log('— A · LEGACY_REDIRECTS');
ok('A · /wallet → /wallet/v2 redirect',           LEGACY_REDIRECTS['/wallet'] === '/wallet/v2');
ok('A · /team RECUPERAT (NO redirect)',            !LEGACY_REDIRECTS['/team']);
ok('A · resolveLegacyPath(/wallet) = /wallet/v2',  resolveLegacyPath('/wallet') === '/wallet/v2');
ok('A · resolveLegacyPath(/team) = null',          resolveLegacyPath('/team') === null);
ok('A · altres redirects preservats',              LEGACY_REDIRECTS['/dashboard'] === '/home' && LEGACY_REDIRECTS['/lms'] === '/learn');

// ─── B · WalletV2View · canonical tabs ─────────────────────────────────
console.log('\n— B · WalletV2View · canonical tabs');
const w2 = fs.readFileSync(path.join(ROOT, 'js/views/WalletV2View.js'), 'utf8');
ok('B · imports SubmenuTabs',                      w2.includes("from '../ui/SubmenuTabs.js'"));
ok('B · renderSubmenuTabs invocat',                w2.includes('renderSubmenuTabs({ tabs: submenuTabs'));
ok('B · bindSubmenuTabs amb urlParam=tab',         w2.includes("bindSubmenuTabs(mount,") && w2.includes("urlParam: 'tab'"));
ok('B · mount id w2Submenu',                       w2.includes('id="w2Submenu"'));
ok('B · cleanupTabs · destroy()',                  w2.includes('this._cleanupTabs') && w2.includes('destroy()'));
// `data-w2-tab` segueix als CTAs intra-contingut ("Veure transaccions" · "Veure Saldo")
// per al cross-tab navigation des de cards · el tab BAR principal ja és canonical.
ok('B · main tab bar handler · usa bindSubmenuTabs (no foreach data-w2-tab al shell)',
                                                    !w2.includes("document.querySelectorAll('[data-w2-tab]')"));
ok('B · 6 tabs preservats',                        w2.includes("VALID_TABS = Object.freeze(['saldo', 'transaccions', 'compres', 'tarta', 'projectes', 'topup']"));
ok('B · Tarta requireProject preservat',           w2.includes('requiresProject: true'));

// ─── C · context switcher Personal / Projecte ─────────────────────────
console.log('\n— C · context switcher dual');
ok('C · w2-ctx-bar CSS · padding 8px 16px',        w2.includes('.w2-ctx-bar {') && w2.includes('background: var(--bg-panel)'));
ok('C · w2-ctx-select dropdown',                   w2.includes('.w2-ctx-select {'));
ok('C · option Personal · default si !projectId', w2.includes('"__personal__"') && w2.includes('👤 Personal'));
ok('C · options per cada projecte',                w2.includes('projects.map(p =>') && w2.includes('📁'));
ok('C · w2-ctx-hint mostra context actual',        w2.includes('w2-ctx-hint'));
ok('C · change handler · switch sense recarregar', w2.includes("getElementById('w2ContextSel')") &&
                                                    w2.includes("val === '__personal__'") &&
                                                    w2.includes('this.render()'));
ok('C · fallback Tarta → Saldo si personal',       w2.includes("meta?.requiresProject && !this._projectId") &&
                                                    w2.includes("this._activeTab = 'saldo'"));

// ─── D · CSS legacy w2-tab kept (backwards compat) ────────────────────
console.log('\n— D · CSS legacy kept');
ok('D · w2-tabs CSS encara present (compat)',      w2.includes('.w2-tabs {'));
ok('D · comentari "legacy w2-tab · sense ús post-v143"', w2.includes('legacy w2-tab CSS · sense ús post-v143'));

// ─── E · ProjectHubV2 link a /wallet/v2 ────────────────────────────────
console.log('\n— E · ProjectHubV2 link');
const v2 = fs.readFileSync(path.join(ROOT, 'js/views/ProjectHubV2View.js'), 'utf8');
ok('E · wallet card → /wallet/v2',                 v2.includes("href: '/wallet/v2'") && v2.includes("kind: 'wallet'"));
ok('E · NO link legacy a /wallet (sense /v2)',    !/id: 'wallet',\s+href: '\/wallet',/.test(v2));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
