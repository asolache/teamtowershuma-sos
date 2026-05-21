// =============================================================================
// TEAMTOWERS SOS V11 — v150 · UX simplification · sub-tab redundancy fix · TDD
// Ruta · /js/tests/v150UxSimplification.test.js
//
// Verifica · (1) ProjectHubV2 · L2 submenu eliminat · pilar = grid de cards
// amb click directe · (2) WalletV2 + AccountingV2 · ctx-bar fusionada amb
// submenu (1 fila enlloc de 2) · tanca wo-project-hub-ia-aligned.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v150 · UX simplification · sub-tab redundancy fix · TDD ===\n');

// ─── A · ProjectHubV2View · L2 submenu eliminat ───────────────────────
console.log('— A · ProjectHubV2 · L2 submenu + preview eliminats');
const v2 = fs.readFileSync(path.join(ROOT, 'js/views/ProjectHubV2View.js'), 'utf8');
ok('A · NO _renderSubBody (orphan eliminat)',          !v2.includes('_renderSubBody()'));
ok('A · NO _renderSubInTab (orphan eliminat)',         !v2.includes('_renderSubInTab(sub, fullHref)'));
ok('A · NO hubSubSubmenu mount',                       !v2.includes('id="hubSubSubmenu"'));
ok('A · NO hubSubBody mount',                          !v2.includes('id="hubSubBody"'));
ok('A · NO _cleanupSubTabs state (orphan eliminat)',   !v2.includes('this._cleanupSubTabs'));
ok('A · NO bindSubmenuTabs amb urlParam sub',          !v2.includes("urlParam: 'sub'"));

// ─── B · Pillar content · grid de cards amb click directe ─────────────
console.log('\n— B · Pillar = grid de cards · navegació directa');
ok('B · _pilarCardDesc · helper descriptions',         v2.includes('_pilarCardDesc(kind)'));
ok('B · hub-pilar-card · classe nova grid',            v2.includes('class="hub-pilar-card"'));
ok('B · hub-pilar-grid · grid layout',                 v2.includes('hub-pilar-grid'));
ok('B · cards són <a> amb data-link (SPA)',            /href="\$\{this\._esc\(href\)\}" data-link class="hub-pilar-card"/.test(v2));
ok('B · cards inclouen icon + label + desc',           v2.includes('hub-pilar-card-icon') && v2.includes('hub-pilar-card-label') && v2.includes('hub-pilar-card-desc'));
ok('B · header pilar · " · click directe"',            v2.includes('click directe'));
ok('B · descripcions per kind · canvas/pitch/wallet/team-permissions',
                                                       v2.includes("canvas:") && v2.includes("'pitch'") &&
                                                       v2.includes("'wallet'") && v2.includes("'team-permissions'"));

// ─── C · WalletV2 · ctx-bar fusionada amb submenu ──────────────────────
console.log('\n— C · WalletV2 · fused bar');
const w2 = fs.readFileSync(path.join(ROOT, 'js/views/WalletV2View.js'), 'utf8');
ok('C · w2-bar-fused class definida',                  w2.includes('.w2-bar-fused {'));
ok('C · w2-bar-fused · flex display',                  /w2-bar-fused \{[\s\S]*?display: flex/.test(w2));
ok('C · NO render de w2-ctx-bar element (només CSS legacy)',
                                                       !/<div class="w2-ctx-bar"/.test(w2));
ok('C · w2-bar-fused render · tabs + ctx en 1 fila',   w2.includes('class="w2-bar-fused"') &&
                                                       w2.includes('class="w2-bar-fused-tabs"') &&
                                                       w2.includes('class="w2-bar-fused-ctx"'));
ok('C · select w2ContextSel preservat',                w2.includes('id="w2ContextSel"'));

// ─── D · AccountingV2 · ctx-bar fusionada amb submenu ─────────────────
console.log('\n— D · AccountingV2 · fused bar');
const acc = fs.readFileSync(path.join(ROOT, 'js/views/AccountingV2View.js'), 'utf8');
ok('D · acc-bar-fused class definida',                 acc.includes('.acc-bar-fused {'));
ok('D · acc-bar-fused · flex display',                 /acc-bar-fused \{[\s\S]*?display: flex/.test(acc));
ok('D · NO render de acc-ctx-bar element',             !/<div class="acc-ctx-bar"/.test(acc));
ok('D · acc-bar-fused render · tabs + ctx en 1 fila',  acc.includes('class="acc-bar-fused"') &&
                                                       acc.includes('class="acc-bar-fused-tabs"') &&
                                                       acc.includes('class="acc-bar-fused-ctx"'));
ok('D · select accContextSel preservat',               acc.includes('id="accContextSel"'));

// ─── E · CSS legacy mantingut (no breaking · backwards compat) ────────
console.log('\n— E · CSS legacy preservat');
ok('E · WalletV2 · .w2-ctx-bar CSS preservada (legacy)',w2.includes('.w2-ctx-bar { display:'));
ok('E · AccountingV2 · .acc-ctx-bar CSS preservada',   acc.includes('.acc-ctx-bar { display:'));

// ─── F · destroy() · sense cleanupSubTabs ─────────────────────────────
console.log('\n— F · destroy · només cleanupTabs');
ok('F · ProjectHubV2 · destroy · només 1 cleanup',     /destroy\(\) \{[\s\S]*?this\._cleanupTabs\?\.\(\)[\s\S]*?\}/.test(v2));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
