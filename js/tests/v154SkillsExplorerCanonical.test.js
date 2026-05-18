// =============================================================================
// TEAMTOWERS SOS V11 — v154 · SkillsExplorerView migració canonical · TDD
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v154 · SkillsExplorerView canonical migration · TDD ===\n');

const src = fs.readFileSync(path.join(ROOT, 'js/views/SkillsExplorerView.js'), 'utf8');

// ─── A · imports + state ───────────────────────────────────────────────
console.log('— A · canonical imports');
ok('A · imports SubmenuTabs + bind + getActiveTabFromUrl',
                                                       src.includes("from '../ui/SubmenuTabs.js'") &&
                                                       src.includes('renderSubmenuTabs') &&
                                                       src.includes('bindSubmenuTabs'));
ok('A · constructor · _cleanupTabs state',            src.includes('this._cleanupTabs = null'));

// ─── B · render · canonical submenu substitueix se-topbar ─────────────
console.log('\n— B · canonical submenu render');
ok('B · mount id seSubmenu',                          src.includes('id="seSubmenu"'));
ok('B · renderSubmenuTabs invocat amb category tabs',  src.includes('renderSubmenuTabs({ tabs: catTabs'));
ok('B · urlParam category',                           src.includes("urlParam: 'category'"));
ok('B · tabs amb counts · "(N)" als labels',          /label: meta\.label \+ ' \(' \+ /.test(src));
ok('B · "Totes" option · primer tab amb id=""',       src.includes("id: '',") && src.includes("label: 'Totes'"));

// ─── C · se-topbar custom ELIMINAT del render ──────────────────────────
console.log('\n— C · se-topbar custom eliminat del render');
ok('C · NO render <div class="se-topbar">',           !/<div class="se-topbar"/.test(src));
ok('C · NO render se-logo "🗼 Team"',                  !/se-logo[\s\S]{0,30}🗼 Team/.test(src));
ok('C · NO render se-link "📜 Conceptes"',             !/se-link[\s\S]{0,40}📜 Conceptes/.test(src));

// ─── D · se-stats-row ocult (compat) + funcionalitat preservada ───────
console.log('\n— D · se-stats-row ocult · funcionalitat preservada');
ok('D · se-stats-row · display:none (compat)',        /se-stats-row[\s\S]{0,40}display:none/.test(src));
ok('D · data-cat-toggle preservat (binding extern OK)', src.includes('data-cat-toggle='));

// ─── E · afterRender · bind canonical + cleanup ───────────────────────
console.log('\n— E · afterRender + destroy');
ok('E · bindSubmenuTabs(seMount, ...)',                src.includes('bindSubmenuTabs(seMount,'));
ok('E · callback · this.filters.category = catId',     src.includes('this.filters.category = catId'));
ok('E · callback · sync select dropdown',              src.includes("getElementById('seCategory')") &&
                                                       src.includes('sel.value = catId'));
ok('E · destroy · cleanup cleanupTabs',               src.includes('destroy()') && src.includes('this._cleanupTabs?.()'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
