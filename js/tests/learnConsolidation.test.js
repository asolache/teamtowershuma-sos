// =============================================================================
// TEAMTOWERS SOS V11 — LEARN CONSOLIDATION · TDD (PR-B)
// Ruta · /js/tests/learnConsolidation.test.js
//
// Valida que LearnView absorbeix els 4 conceptes (sectors · mind · folders ·
// tags) com a tabs nous · sense trencar els tabs originals (roadmaps ·
// carpetas · search). Test sense DOM real · validació de string-shape del
// HTML generat per `getHtml()` + assert de tabs disponibles + CTA links.
// =============================================================================

import { _setCacheForTests } from '../core/knowledgeIndexService.js';
import LearnView from '../views/LearnView.js';

let pass = 0, fail = 0;
function ok(label, cond, expected = '', got = '') {
    if (cond) { pass++; console.log('✓', label); }
    else {
        fail++;
        const detail = (expected !== '' || got !== '') ? ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})` : '';
        console.log('✗', label + detail);
    }
}

// Polyfill mínim document/window per testar la view sense DOM real
if (typeof globalThis.document === 'undefined') {
    globalThis.document = { title: '', querySelectorAll: () => [], getElementById: () => null };
}
if (typeof globalThis.window === 'undefined') {
    globalThis.window = { location: { search: '' } };
}

// Fixture · index knowledge mínim
const FIXTURE = {
    version: 'pr-b-test',
    generated: '2026-05-16',
    totalFiles: 6,
    items: [
        { folder: 'socs',   relpath: 'socs/sectors/J.md',        type: 'soc',    id: 'soc-j', title: 'Sector J · TIC',     sector_cnae: 'J', keywords: ['tic', 'software', 'cooperat'], excerpt: 'TIC sector ...' },
        { folder: 'socs',   relpath: 'socs/sectors/M.md',        type: 'soc',    id: 'soc-m', title: 'Sector M · Consult', sector_cnae: 'M', keywords: ['consult', 'profess'], excerpt: 'Consultoria ...' },
        { folder: 'sectors',relpath: 'sectors/J.md',             type: 'sector', id: 'sec-j', title: 'sectors/J',          sector_cnae: 'J', keywords: ['tic'], excerpt: 'Sector J pure' },
        { folder: 'socs',   relpath: 'socs/la-colla.md',         type: 'soc',    id: 'soc-c', title: 'La Colla',           sos_context: 'critical', keywords: ['colla', 'vna'], excerpt: 'Procés VNA' },
        { folder: 'vision', relpath: 'vision/sop-to-wo.md',      type: 'vision', id: 'v-1',   title: 'SOP→WO model',       keywords: ['sop', 'wo', 'antigravity'], excerpt: 'Model canònic' },
        { folder: 'sops',   relpath: 'sops/sop-fent-pinya.md',   type: 'sop',    id: 'sop-1', title: 'SOP Fent Pinya',     keywords: ['castell', 'taller'], excerpt: 'Taller ...' },
    ],
};

_setCacheForTests(FIXTURE);

console.log('=== LEARN-CONSOLIDATION · PR-B subhub 7 tabs ===\n');

// ─── A · 7 tabs disponibles al render ─────────────────────────────────────
console.log('— A · 7 tabs al render shell');
const v = new LearnView();
const html = await v.getHtml();

// v133 · migrats al component canonical SubmenuTabs · icona en span separat ·
// data-submenu-tab substitueix data-mode (compatibilitat semàntica preservada)
const EXPECTED_TABS = [
    { id: 'roadmaps', icon: '🤲', text: 'Roadmaps'  },
    { id: 'carpetas', icon: '📚', text: 'Knowledge' },
    { id: 'search',   icon: '🔍', text: 'Cerca'     },
    { id: 'sectors',  icon: '🏭', text: 'Sectors'   },
    { id: 'mind',     icon: '🕸', text: 'Mind'      },
    { id: 'folders',  icon: '📁', text: 'Carpetes'  },
    { id: 'tags',     icon: '🏷', text: 'Tags'      },
];

for (const tab of EXPECTED_TABS) {
    ok('A · tab data-submenu-tab="' + tab.id + '"', html.includes(`data-submenu-tab="${tab.id}"`));
    ok('A · icona + label "' + tab.icon + ' ' + tab.text + '" presents',
        html.includes(tab.icon) && html.includes(tab.text));
}

// ─── B · Sectors tab · render compacte amb SOCs sector ───────────────────
console.log('\n— B · Sectors tab compacte');
const vS = new LearnView();
vS._mode = 'sectors';
const htmlS = await vS.getHtml();
ok('B · "Sectors CNAE" header', htmlS.includes('Sectors CNAE'));
ok('B · menciona socMatcher', htmlS.includes('socMatcher'));
ok('B · mostra Sector J', htmlS.includes('J') && htmlS.includes('Sector'));
ok('B · CTA "Obre vista completa de sectors"', htmlS.includes('/sectors'));

// ─── C · Mind tab · stats per tipus + CTA ──────────────────────────────
console.log('\n— C · Mind tab compacte');
const vM = new LearnView();
vM._mode = 'mind';
const htmlM = await vM.getHtml();
ok('C · "Mind-as-Graph" header', htmlM.includes('Mind-as-Graph'));
ok('C · menciona "nodes al KB"', htmlM.includes('nodes al KB'));
ok('C · CTA "/mind"', htmlM.includes('/mind'));

// ─── D · Folders tab · smart folders ───────────────────────────────────
console.log('\n— D · Folders tab compacte');
const vF = new LearnView();
vF._mode = 'folders';
const htmlF = await vF.getHtml();
ok('D · "Carpetes intel·ligents" header', htmlF.includes('Carpetes intel·ligents'));
ok('D · CTA "/folders"', htmlF.includes('/folders'));

// ─── E · Tags tab · tag cloud ──────────────────────────────────────────
console.log('\n— E · Tags tab · cloud');
const vT = new LearnView();
vT._mode = 'tags';
const htmlT = await vT.getHtml();
ok('E · "Tag cloud" header', htmlT.includes('Tag cloud'));
ok('E · agrega keywords del fixture (tic)', htmlT.includes('tic'));
ok('E · agrega keywords del fixture (cooperat)', htmlT.includes('cooperat'));
ok('E · link a search amb tag', htmlT.includes('/learn?tab=search&q='));
ok('E · CTA "/tags"', htmlT.includes('/tags'));

// ─── F · Cross-tab navigation · ?tab= param funciona ───────────────────
console.log('\n— F · ?tab= URL param fa que el mode s\'apliqui');
globalThis.window.location.search = '?tab=mind';
const vNav = new LearnView();
ok('F · ?tab=mind → mode=mind', vNav._mode === 'mind', 'mind', vNav._mode);
globalThis.window.location.search = '?tab=sectors';
const vNav2 = new LearnView();
ok('F · ?tab=sectors → mode=sectors', vNav2._mode === 'sectors', 'sectors', vNav2._mode);
globalThis.window.location.search = '?mode=tags';
const vNav3 = new LearnView();
ok('F · ?mode=tags (legacy param) → mode=tags', vNav3._mode === 'tags', 'tags', vNav3._mode);
globalThis.window.location.search = '';

// ─── G · regressió · els 3 modes originals segueixen funcionant ────────
console.log('\n— G · regressió modes originals (roadmaps · carpetas · search)');
for (const m of ['roadmaps', 'carpetas', 'search']) {
    const vReg = new LearnView();
    vReg._mode = m;
    const h = await vReg.getHtml();
    ok('G · mode "' + m + '" renderitza', h && h.length > 1000);
}

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
