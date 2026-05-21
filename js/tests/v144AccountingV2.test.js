// =============================================================================
// TEAMTOWERS SOS V11 — v144 · AccountingV2View · TDD
// Ruta · /js/tests/v144AccountingV2.test.js
//
// Verifica · AccountingV2View · 5 tabs canonical + context switcher +
// redirect /accounting → /accounting/v2 + ProjectHubV2 enllaç actualitzat.
// Tanca wo-accounting-v2-redesign.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEGACY_REDIRECTS } from '../core/routerRedirects.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v144 · AccountingV2View · TDD ===\n');

// ─── A · redirect /accounting → /accounting/v2 ─────────────────────────
console.log('— A · LEGACY_REDIRECTS');
ok('A · /accounting → /accounting/v2',             LEGACY_REDIRECTS['/accounting'] === '/accounting/v2');
ok('A · /wallet → /wallet/v2 preservat',           LEGACY_REDIRECTS['/wallet'] === '/wallet/v2');
ok('A · /team encara NO redirect',                 !LEGACY_REDIRECTS['/team']);

// ─── B · AccountingV2View existeix amb estructura canonical ────────────
console.log('\n— B · AccountingV2View estructura');
const v2Path = path.join(ROOT, 'js/views/AccountingV2View.js');
ok('B · fitxer existeix',                          fs.existsSync(v2Path));
const v2 = fs.readFileSync(v2Path, 'utf8');
ok('B · imports SubmenuTabs',                      v2.includes("from '../ui/SubmenuTabs.js'"));
ok('B · imports ledgerService canonical',          v2.includes('computeBalanceSheet') &&
                                                    v2.includes('computePLForPeriod') &&
                                                    v2.includes('computeBalanceByAccount'));
ok('B · 5 tabs · resum/entrades/pl/categories/export',
                                                    /VALID_TABS = Object\.freeze\(\['resum', 'entrades', 'pl', 'categories', 'export'\]\)/.test(v2));
ok('B · TAB_META · icons + labels',                v2.includes("icon: '📊', label: 'Resum'") &&
                                                    v2.includes("icon: '📋', label: 'Entrades'") &&
                                                    v2.includes("icon: '📈', label: 'P&L'") &&
                                                    v2.includes("icon: '🥧', label: 'Categories'") &&
                                                    v2.includes("icon: '📄', label: 'Export'"));
ok('B · PERIOD_PRESETS · 30d/90d/ytd/all',         v2.includes("'30d':") && v2.includes("'90d':") &&
                                                    v2.includes("'ytd':") && v2.includes("'all':"));

// ─── C · bind canonical + context switcher ─────────────────────────────
console.log('\n— C · bind + context switcher');
ok('C · renderSubmenuTabs invocat',                v2.includes('renderSubmenuTabs({ tabs: submenuTabs'));
ok('C · bindSubmenuTabs amb urlParam tab',         v2.includes('bindSubmenuTabs(mount,') && v2.includes("urlParam: 'tab'"));
ok('C · cleanupTabs · destroy()',                  v2.includes('this._cleanupTabs') && v2.includes('destroy()'));
ok('C · mount id accSubmenu',                      v2.includes('id="accSubmenu"'));
ok('C · accContextSel · Personal default',         v2.includes('id="accContextSel"') &&
                                                    v2.includes('__personal__') &&
                                                    v2.includes('👤 Personal'));
ok('C · accContextSel · 1 option per projecte',    v2.includes('projects.map(p =>') && v2.includes('📁'));

// ─── D · KPIs + balance sheet render ───────────────────────────────────
console.log('\n— D · KPIs + balance sheet');
ok('D · KPI Actius totals',                        v2.includes('Actius totals'));
ok('D · KPI Passius totals',                       v2.includes('Passius totals'));
ok('D · KPI Equity (patrimoni)',                   v2.includes('Equity (patrimoni)'));
ok('D · KPI P&L amb període dinàmic',              v2.includes('P&L · ${PERIOD_PRESETS[this._period].label}'));
ok('D · Equació comptable balanced indicator',     v2.includes("'✓ Equilibrada'") && v2.includes("'⚠ Desbalanç'"));
ok('D · Resum balanç comptable table',             v2.includes('acc-pill-asset') && v2.includes('acc-pill-liability') && v2.includes('acc-pill-equity'));

// ─── E · entrades filter + render ──────────────────────────────────────
console.log('\n— E · entrades · filter + render');
ok('E · _renderEntrades mètode',                   v2.includes('_renderEntrades()'));
ok('E · _filteredEntries pure (period + search)',  v2.includes('_filteredEntries()') &&
                                                    v2.includes('range.from') &&
                                                    v2.includes('desc.includes(q)'));
ok('E · accPeriodSel + accSearchIn binding',       v2.includes("getElementById('accPeriodSel')") &&
                                                    v2.includes("getElementById('accSearchIn')"));
ok('E · sort desc per ts · slice top 100',         v2.includes("(b.ts || 0) - (a.ts || 0)") &&
                                                    v2.includes('sorted.slice(0, 100)'));

// ─── F · P&L tab · breakdown per compte amb barres ─────────────────────
console.log('\n— F · P&L · breakdown');
ok('F · _renderPL mètode',                         v2.includes('_renderPL()'));
ok('F · revenueByAccount loop',                    v2.includes('pl.revenueByAccount') && v2.includes('acc-pill-revenue'));
ok('F · expenseByAccount loop',                    v2.includes('pl.expenseByAccount') && v2.includes('acc-pill-expense'));
ok('F · acc-bar amb width % per total',            v2.includes('acc-bar-fill') && v2.includes('totalRevenue'));

// ─── G · Categories tab · agrupació per kind ───────────────────────────
console.log('\n— G · Categories per kind');
ok('G · _renderCategories mètode',                 v2.includes('_renderCategories()'));
ok('G · byKind · asset/liability/equity/revenue/expense',
                                                    v2.includes("byKind = { asset: [], liability: [], equity: [], revenue: [], expense: [] }"));
ok('G · sort desc per |balance|',                  v2.includes("Math.abs(b.balance) - Math.abs(a.balance)"));

// ─── H · Export CSV · download blob ────────────────────────────────────
console.log('\n— H · Export CSV');
ok('H · _renderExport mètode',                     v2.includes('_renderExport()'));
ok('H · _downloadCsv mètode · genera CSV',         v2.includes('_downloadCsv()') &&
                                                    v2.includes("'text/csv;charset=utf-8'"));
ok('H · CSV header · date,description,...',        v2.includes("['date', 'description', 'accountId', 'side', 'amount'"));
ok('H · escape CSV · " escapat',                   v2.includes("s.includes(',') || s.includes('\"')"));
ok('H · filename · accounting-<context>-<date>.csv',
                                                    v2.includes("'accounting-'") && v2.includes("'.csv'"));

// ─── I · router + ProjectHubV2 enllaç ──────────────────────────────────
console.log('\n— I · router + ProjectHubV2');
const router = fs.readFileSync(path.join(ROOT, 'js/router.js'), 'utf8');
ok('I · ruta /accounting/v2 registrada',           router.includes("'/accounting/v2'") && router.includes('AccountingV2View'));

const phv2 = fs.readFileSync(path.join(ROOT, 'js/views/ProjectHubV2View.js'), 'utf8');
ok('I · ProjectHubV2 accounting card → /accounting/v2',
                                                    phv2.includes("href: '/accounting/v2'") && phv2.includes("kind: 'accounting'"));

// ─── J · backlog · wo-accounting-v2-redesign done ──────────────────────
console.log('\n— J · backlog · WO done');
const yaml = fs.readFileSync(path.join(ROOT, 'docs/backlog.yaml'), 'utf8');
ok('J · WO marcada done amb v144 tag',             /wo-accounting-v2-redesign[\s\S]+?status: done.*v144/.test(yaml));
ok('J · tag done-v144 afegit',                     yaml.includes('"done-v144"'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
