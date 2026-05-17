// =============================================================================
// TEAMTOWERS SOS V11 — v132k + v133 · Keyboard nav + Demo + LearnView mig
//                                       + Project Hub V3 Preview · TDD
// Ruta · /js/tests/v132kv133MigrationAndPreview.test.js
//
// Verifica · v132k (keyboard ← → + Home/End + demo viu a /design) + v133
// (LearnView migrat regression-safe + ProjectHubV3PreviewView nou + ruta
// + nav entry + dummy data IA Presentation completa).
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v132k + v133 · keyboard nav + migració LearnView + Project Hub V3 preview · TDD ===\n');

const submenuSrc = fs.readFileSync(path.join(ROOT, 'js/ui/SubmenuTabs.js'), 'utf8');
const learnSrc   = fs.readFileSync(path.join(ROOT, 'js/views/LearnView.js'), 'utf8');
const designSrc  = fs.readFileSync(path.join(ROOT, 'js/views/DesignSystemView.js'), 'utf8');
const v3Src      = fs.readFileSync(path.join(ROOT, 'js/views/ProjectHubV3PreviewView.js'), 'utf8');
const routerSrc  = fs.readFileSync(path.join(ROOT, 'js/router.js'), 'utf8');
const navSrc     = fs.readFileSync(path.join(ROOT, 'js/core/navService.js'), 'utf8');

// ─── A · v132k · keyboard nav ─────────────────────────────────────────
console.log('— A · v132k · keyboard nav ← → Home End');
ok('A · ArrowLeft handled',                       submenuSrc.includes("'ArrowLeft'"));
ok('A · ArrowRight handled',                      submenuSrc.includes("'ArrowRight'"));
ok('A · Home key handled',                        submenuSrc.includes("'Home'"));
ok('A · End key handled',                         submenuSrc.includes("'End'"));
ok('A · keydown listener attached',               submenuSrc.includes("document.addEventListener('keydown'"));
ok('A · cleanup remove keydown',                  submenuSrc.includes("removeEventListener('keydown'"));
ok('A · wraps around (modulo aritmetic)',         submenuSrc.includes('% mainTabs.length'));
ok('A · only triggers when focus dins root',      submenuSrc.includes('root.contains(document.activeElement)'));
ok('A · activates via _activateTab helper',       submenuSrc.includes('function _activateTab(') &&
                                                    submenuSrc.includes('_activateTab(root,'));
ok('A · CSS.escape defensive fallback',           submenuSrc.includes("typeof CSS !== 'undefined'") && submenuSrc.includes('CSS.escape'));

// ─── B · v132k · demo viu a DesignSystemView ──────────────────────────
console.log('\n— B · v132k · demo viu /design');
ok('B · imports SubmenuTabs',                     designSrc.includes("from '../ui/SubmenuTabs.js'"));
ok('B · mount point dsSubmenuLive',               designSrc.includes('id="dsSubmenuLive"'));
ok('B · output reactive dsSubmenuOutput',         designSrc.includes('id="dsSubmenuOutput"'));
ok('B · renderitza 5 tabs (Hub..Presentation)',  designSrc.includes("id: 'hub'") &&
                                                    designSrc.includes("id: 'map'") &&
                                                    designSrc.includes("id: 'kanban'") &&
                                                    designSrc.includes("id: 'wallet'") &&
                                                    designSrc.includes("id: 'presentation'"));
ok('B · dropdown 4 items (Pactes/Sprints/KB/Sett)',
                                                    designSrc.includes("id: 'pacts'") &&
                                                    designSrc.includes("id: 'sprints'") &&
                                                    designSrc.includes("id: 'kb'") &&
                                                    designSrc.includes("id: 'settings'"));
ok('B · URL param custom · demoTab (no col·lisió)',designSrc.includes("urlParam: 'demoTab'"));
ok('B · bindSubmenuTabs callback amb onSelect',   designSrc.includes('bindSubmenuTabs(live,'));

// ─── C · v133 · LearnView migrat ──────────────────────────────────────
console.log('\n— C · v133 · LearnView migrat regression-safe');
ok('C · imports SubmenuTabs',                     learnSrc.includes("from '../ui/SubmenuTabs.js'"));
ok('C · LEARN_TABS taula declarativa · 7 tabs',   learnSrc.includes('LEARN_TABS') &&
                                                    learnSrc.includes("id: 'roadmaps'") &&
                                                    learnSrc.includes("id: 'tags'"));
ok('C · OLD <button class="lv-tab" data-mode> REMOVED',
                                                    !learnSrc.includes('<button class="lv-tab ${'));
ok('C · NEW renderSubmenuTabs call · activeId',   learnSrc.includes('renderSubmenuTabs({ tabs: LEARN_TABS') &&
                                                    learnSrc.includes('activeId: this._mode'));
ok('C · mount point lvSubmenuMount',              learnSrc.includes('id="lvSubmenuMount"') ||
                                                    learnSrc.includes("id=\"lvSubmenuMount\""));
ok('C · afterRender · bindSubmenuTabs',           learnSrc.includes("bindSubmenuTabs(mount, (newId)"));
ok('C · _setMode preservat (regression-safe)',     learnSrc.includes('_setMode(mode)'));
ok('C · 7 modes valid · sense regressió',         learnSrc.includes("VALID_MODES") &&
                                                    learnSrc.includes("'roadmaps'") &&
                                                    learnSrc.includes("'tags'"));
ok('C · TPL_VERSION bump · canonical suffix',     learnSrc.includes('learn-v3-subhub-canonical'));
ok('C · backwards-compat handler [data-mode]',     learnSrc.includes("querySelectorAll('[data-mode]')"));

// ─── D · v133 · ProjectHubV3PreviewView nou ──────────────────────────
console.log('\n— D · v133 · ProjectHubV3PreviewView');
ok('D · vista existeix',                          fs.existsSync(path.join(ROOT, 'js/views/ProjectHubV3PreviewView.js')));
ok('D · imports SubmenuTabs + getActiveTabFromUrl',
                                                    v3Src.includes('renderSubmenuTabs') &&
                                                    v3Src.includes('bindSubmenuTabs') &&
                                                    v3Src.includes('getActiveTabFromUrl'));
ok('D · HUB_TABS · 5 pestanyes',                  v3Src.includes("id: 'hub'") &&
                                                    v3Src.includes("id: 'map'") &&
                                                    v3Src.includes("id: 'kanban'") &&
                                                    v3Src.includes("id: 'wallet'") &&
                                                    v3Src.includes("id: 'presentation'"));
ok('D · HUB_DROPDOWN · 4 items',                  v3Src.includes("id: 'pacts'") &&
                                                    v3Src.includes("id: 'sprints'") &&
                                                    v3Src.includes("id: 'kb'") &&
                                                    v3Src.includes("id: 'settings'"));
ok('D · DUMMY_PROJECT · Forn Vall',               v3Src.includes('Forn Vall'));
ok('D · Presentation tab · 4 cells Canvas',        v3Src.includes('Segments') && v3Src.includes('Value Propositions') &&
                                                    v3Src.includes('Channels') && v3Src.includes('Revenue Streams'));
ok('D · Presentation tab · 4 cells Pitch (P/S/W/T)',
                                                    v3Src.includes('PROBLEM') && v3Src.includes('SOLUTION') &&
                                                    v3Src.includes('WHY NOW') && v3Src.includes('TRACTION'));
ok('D · Pacts tab · legal agents drawer',         v3Src.toLowerCase().includes('legal agents drawer') &&
                                                    v3Src.includes('Generar doc amb IA legal'));
ok('D · activeId inicial via URL ?tab=X',         v3Src.includes("getActiveTabFromUrl('tab'"));
ok('D · destroy() cleanup listener',              v3Src.includes('destroy()') && v3Src.includes('this._cleanup'));
ok('D · XSS · _esc helper present',               v3Src.includes('_esc(s)'));

// ─── E · v133 · routing + nav entry ───────────────────────────────────
console.log('\n— E · v133 · ruta + nav entry');
ok('E · ruta /project-hub-v3-preview registrada', routerSrc.includes("/project-hub-v3-preview"));
ok('E · import ProjectHubV3PreviewView',           routerSrc.includes('ProjectHubV3PreviewView'));
ok('E · nav entry projhubv3',                      navSrc.includes("id: 'projhubv3'") &&
                                                    navSrc.includes("href: '/project-hub-v3-preview'"));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
