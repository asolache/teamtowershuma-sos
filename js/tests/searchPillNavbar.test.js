// =============================================================================
// TEAMTOWERS SOS V11 — SEARCH PILL · NAVBAR INTEGRATION · TDD (v125)
// Ruta · /js/tests/searchPillNavbar.test.js
//
// Sprint A · search trigger es mou de floating (position:fixed conflict amb
// topbar i contingut) a una pill dins la navbar global. Visible a tots els
// screens · mobile = icona · desktop = icona + label + ⌘K hint.
// =============================================================================

import { renderGlobalNavHtml } from '../core/navService.js';
import fs from 'node:fs';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== SEARCH PILL · NAVBAR INTEGRATION (v125) ===\n');

const navSrc = fs.readFileSync(new URL('../core/navService.js', import.meta.url), 'utf8');
const gsSrc  = fs.readFileSync(new URL('../core/globalSearch.js', import.meta.url), 'utf8');

// ─── A · renderGlobalNavHtml inclou la pill ───────────────────────────
console.log('— A · pill renderitzada al navbar');
const html = renderGlobalNavHtml({ pathname: '/home' });
ok('A · pill button #sos-global-nav-search-btn present',  html.includes('id="sos-global-nav-search-btn"'));
ok('A · pill té classe sos-global-nav-search',            html.includes('sos-global-nav-search'));
ok('A · pill mostra icona 🔍',                             html.includes('🔍'));
ok('A · pill mostra label "Cerca"',                       html.includes('>Cerca<'));
ok('A · pill mostra hint ⌘K',                              html.includes('⌘K'));
ok('A · pill té aria-label per a11y',                     html.includes('aria-label="Obrir cerca global"'));
ok('A · pill abans de Messages (ordre · search prioritari)',
    html.indexOf('sos-global-nav-search') < html.indexOf('sos-global-nav-msg'));

// ─── B · paintGlobalNav lligar click → open palette ───────────────────
console.log('\n— B · click handler · open() del palette');
ok('B · paintGlobalNav busca el btn',                     navSrc.includes("el.querySelector('#sos-global-nav-search-btn')"));
ok('B · idempotent · marca data-bound = 1',               navSrc.includes("searchBtn.dataset.bound = '1'"));
ok('B · dynamic import globalSearch.js',                  navSrc.includes("await import('./globalSearch.js')"));
ok('B · crida mod.open()',                                 navSrc.includes('mod.open()'));

// ─── C · CSS pill · estats hover/focus + responsive ────────────────────
console.log('\n— C · CSS pill · estats + mobile');
ok('C · CSS .sos-global-nav-search definit',              navSrc.includes('.sos-global-nav-search {'));
ok('C · hover style amb accent purple',                    navSrc.includes('#a78bfa'));
ok('C · kbd hint amb monospace',                          navSrc.includes('sos-global-nav-kbd'));
ok('C · mobile · kbd hint amagat',                        navSrc.includes('.sos-global-nav-search .sos-global-nav-kbd { display: none'));
ok('C · mobile · pill-label amagat (icona only)',         navSrc.includes('.sos-global-nav-pill-label { display: none'));
ok('C · focus-visible · outline accent-indigo',           navSrc.includes('.sos-global-nav-pill:focus-visible'));

// ─── D · globalSearch.js · floating button RETIRAT ────────────────────
console.log('\n— D · globalSearch.js · NO injecta floating button');
ok('D · injectGlobal NO crea trigger button document.body.appendChild',
   !gsSrc.includes("document.body.appendChild(btn)"));
ok('D · document.getElementById(TRIGGER_ID)?.remove()  · cleanup defensiu',
   gsSrc.includes("document.getElementById(TRIGGER_ID)?.remove()"));
ok('D · injectGlobal comentari · viu a navbar pill',      gsSrc.includes('viu a navbar pill'));
ok('D · keyboard listener (cmd/ctrl + K) preservat',      gsSrc.includes("e.key.toLowerCase() === 'k'"));
ok('D · "/" shortcut preservat',                          gsSrc.includes("e.key === '/'"));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
