// =============================================================================
// TEAMTOWERS SOS V11 — v137 · UX cleanup project navigation · TDD
// Ruta · /js/tests/v137UxCleanupProjectNav.test.js
//
// Verifica · (1) subnav antic eliminat del router · (2) breadcrumb accepta
// nextSuggestion + render a la dreta amb CTA · (3) paintBreadcrumb calcula
// el next step quan hi ha projecte actiu · (4) SOPs afegit al pilar
// Treballar del ProjectHubV2View.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderBreadcrumbHtml } from '../core/navService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v137 · UX cleanup project navigation · TDD ===\n');

// ─── A · router · paintProjectSubnav · ELIMINAT ───────────────────────
console.log('— A · router · subnav antic eliminat');
const routerSrc = fs.readFileSync(path.join(ROOT, 'js/router.js'), 'utf8');
ok('A · NO crida paintProjectSubnav al router',    !routerSrc.includes('await paintProjectSubnav('));
ok('A · cleanup defensiu · oculta slot si existeix', routerSrc.includes("getElementById('sos-project-subnav-slot')") &&
                                                      routerSrc.includes("style.display = 'none'"));
ok('A · comentari v137 explicant la decisió',       routerSrc.includes('v137 · UX cleanup'));

// ─── B · renderBreadcrumbHtml · accepta nextSuggestion ────────────────
console.log('\n— B · renderBreadcrumbHtml · nextSuggestion render');
{
    const html0 = renderBreadcrumbHtml({ items: [{ label: 'Home', current: true }] });
    ok('B · sense nextSuggestion · no sos-bc-next class',  !html0.includes('sos-bc-next'));

    const html1 = renderBreadcrumbHtml({
        items: [{ label: 'Home', current: true }],
        nextSuggestion: {
            label: 'Map de valor',
            icon:  '🗺',
            gain:  12,
            href:  '/map?project=p1',
            title: 'Completa el mapa de valor',
        },
    });
    ok('B · amb nextSuggestion · class sos-bc-next present', html1.includes('class="sos-bc-next"'));
    ok('B · label "Següent · Map de valor"',                 html1.includes('Següent · Map de valor'));
    ok('B · icon renderitzat',                               html1.includes('🗺'));
    ok('B · gain · +12 pts',                                 html1.includes('+12 pts'));
    ok('B · href correcta',                                  html1.includes('href="/map?project=p1"'));
    ok('B · title escapat',                                  html1.includes('title="Completa el mapa de valor"'));
    ok('B · data-link present (SPA routing)',                html1.includes('data-link'));

    // gain=0 · sense pts visible
    const html2 = renderBreadcrumbHtml({
        items: [{ label: 'X', current: true }],
        nextSuggestion: { label: 'Y', gain: 0, href: '/y' },
    });
    ok('B · gain=0 · no mostra "+0 pts"',                   !html2.includes('pts'));
    ok('B · nextSuggestion sense label · no render',         !renderBreadcrumbHtml({ items: [{label:'a',current:true}], nextSuggestion: {} }).includes('sos-bc-next'));
}

// ─── C · CSS · sos-bc-next styles injected ─────────────────────────────
console.log('\n— C · CSS · sos-bc-next styles');
const navSrc = fs.readFileSync(path.join(ROOT, 'js/core/navService.js'), 'utf8');
ok('C · CSS · .sos-bc-next definit',                navSrc.includes('.sos-breadcrumb .sos-bc-next {'));
ok('C · CSS · color accent-indigo',                 navSrc.includes('color: var(--accent-indigo)'));
ok('C · CSS · :hover state',                        navSrc.includes('.sos-breadcrumb .sos-bc-next:hover'));
ok('C · CSS · flex-shrink:0 (no truncate)',         navSrc.includes('flex-shrink: 0'));

// ─── D · paintBreadcrumb · calcula next quan hi ha projecte ───────────
console.log('\n— D · paintBreadcrumb · next step calculation');
ok('D · paintBreadcrumb importa computeQualityScore',
                                                    navSrc.includes('computeQualityScore(p,') &&
                                                    navSrc.includes('suggestNextDim('));
ok('D · llegeix sops/workshops/marketItems del KB',  navSrc.includes("type: 'sop'") &&
                                                    navSrc.includes("type: 'workshop'") &&
                                                    navSrc.includes("type: 'market_item'"));
ok('D · nextSuggestion · label · icon · gain · href · title',
                                                    /nextSuggestion = \{[\s\S]+?label:[\s\S]+?icon:[\s\S]+?gain:[\s\S]+?href:[\s\S]+?title:/.test(navSrc));
ok('D · render passa nextSuggestion a renderBreadcrumbHtml',
                                                    navSrc.includes('renderBreadcrumbHtml({ items, phase, nextSuggestion })'));
ok('D · ocult slot només si tot està buit (items≤1 && !phase && !nextSuggestion)',
                                                    navSrc.includes('items?.length || 0) <= 1 && !phase && !nextSuggestion'));

// ─── E · ProjectHubV2View · SOPs al pilar Treballar ────────────────────
console.log('\n— E · ProjectHubV2View · SOPs');
const v2Src = fs.readFileSync(path.join(ROOT, 'js/views/ProjectHubV2View.js'), 'utf8');
ok('E · pillar treballar · SOPs link',              /treballar:[\s\S]+?href: '\/sops'/.test(v2Src));
ok('E · label "SOPs" amb icon 📜',                  /href: '\/sops'[\s\S]+?label: 'SOPs'[\s\S]+?icon: '📜'/.test(v2Src));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
