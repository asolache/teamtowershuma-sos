// =============================================================================
// TEAMTOWERS SOS V11 — v141 + v142 · SubmenuTabs v2 (l2 variant) + in-tab render
// Ruta · /js/tests/v141v142SubmenuV2AndInTab.test.js
//
// Verifica · (1) SubmenuTabs accepta variant 'l2' (sub-submenu) · (2)
// ProjectHubV2View renderitza l2 + in-tab preview per cada sub-tab del pilar
// (tanca wo-project-hub-ia-aligned · wo-submenu-tabs-v2-sublevel).
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSubmenuTabs, SUBMENU_VERSION } from '../ui/SubmenuTabs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v141 + v142 · SubmenuTabs v2 + in-tab render · TDD ===\n');

// ─── A · SubmenuTabs v2 · variant 'l2' ─────────────────────────────────
console.log('— A · SubmenuTabs · variant l2');
ok('A · SUBMENU_VERSION = v141',                  SUBMENU_VERSION === 'v141');

{
    const l1 = renderSubmenuTabs({ tabs: [{ id: 'a', label: 'A' }], activeId: 'a' });
    ok('A · default variant · NO is-l2',           !l1.includes('is-l2'));
    ok('A · default · class="sos-submenu"',         l1.includes('class="sos-submenu"'));
}
{
    const l2 = renderSubmenuTabs({ tabs: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], activeId: 'a', variant: 'l2' });
    ok('A · variant=l2 · class sos-submenu is-l2',  l2.includes('class="sos-submenu is-l2"'));
    ok('A · l2 · 2 botons amb data-submenu-tab',    (l2.match(/data-submenu-tab="/g) || []).length === 2);
    ok('A · l2 · primer és is-active',              l2.includes('class="sos-submenu-tab is-active"'));
}
{
    // L2 forcaria a ignorar el dropdown
    const l2 = renderSubmenuTabs({ tabs: [{ id: 'a', label: 'A' }], dropdown: [{ id: 'd', label: 'D' }], variant: 'l2' });
    ok('A · l2 · dropdown ignorat (no més · ▾)',    !l2.includes('Més ▾') && !l2.includes('sos-submenu-dropdown'));
}

// ─── B · CSS · .is-l2 styles injected ──────────────────────────────────
console.log('\n— B · CSS · is-l2 styles');
const tabsSrc = fs.readFileSync(path.join(ROOT, 'js/ui/SubmenuTabs.js'), 'utf8');
ok('B · CSS · .sos-submenu.is-l2 definit',        tabsSrc.includes('.sos-submenu.is-l2 {'));
ok('B · CSS · l2 · height més baix (36px)',       tabsSrc.includes('height: 36px'));
ok('B · CSS · l2 · active accent-purple (vs indigo)',
                                                    tabsSrc.includes('border-bottom: 2px solid var(--accent-purple'));
ok('B · CSS · l2 · tab font-size més petit',      /\.sos-submenu\.is-l2 \.sos-submenu-tab \{[\s\S]+?font-size: 0\.82rem/.test(tabsSrc));

// ─── C · ProjectHubV2View · HUB_PILLAR_LINKS amb id + kind ─────────────
console.log('\n— C · HUB_PILLAR_LINKS · id + kind per a routing');
const v2 = fs.readFileSync(path.join(ROOT, 'js/views/ProjectHubV2View.js'), 'utf8');
ok('C · crear · cada link té id + kind',           /crear:[\s\S]+?\{ id: 'canvas'[\s\S]+?kind: 'canvas' \}/.test(v2));
ok('C · treballar · sops + quality amb kind',      /id: 'sops'[\s\S]+?kind: 'sops'/.test(v2) &&
                                                   /id: 'quality'[\s\S]+?kind: 'quality'/.test(v2));
ok('C · comptabilitzar · 5 kinds (wallet..tokenomics)',
                                                   /id: 'wallet'[\s\S]+?id: 'accounting'[\s\S]+?id: 'value'[\s\S]+?id: 'invoices'[\s\S]+?id: 'tokenomics'/.test(v2));
ok('C · equip · 4 sub-tabs (members..invites)',    /equip:[\s\S]+?id: 'members'[\s\S]+?id: 'roles'[\s\S]+?id: 'permissions'[\s\S]+?id: 'invites'/.test(v2));
ok('C · equip · invites href apunta a /team',      /id: 'invites'[\s\S]+?href: '\/team\?/.test(v2));

// ─── D · ProjectHubV2View · sub-tab routing · v150 simplificat ────────
// v150 · L2 submenu i preview eliminats · pilar = grid de cards · click directe ·
// vegeu v150UxSimplification.test.js per a assertions exhaustives del nou disseny
console.log('\n— D · pilar grid (v150 · L2 submenu eliminat)');
ok('D · NO L2 submenu (v150 · eliminat)',           !v2.includes("urlParam: 'sub'"));
ok('D · NO sub state al constructor',               !v2.includes('this._sub = '));
ok('D · destroy · 1 sol listener (cleanupTabs)',     /destroy\(\) \{[\s\S]*?this\._cleanupTabs\?\.\(\)[\s\S]*?\}/.test(v2));

// ─── E · _renderPillarContent · grid de cards (no L2 submenu) ──────────
console.log('\n— E · _renderPillarContent · grid de cards');
ok('E · NO renderSubmenuTabs amb variant l2 dins pilar',
                                                    !v2.includes("variant: 'l2'"));
ok('E · zero-links pilar · message',               v2.includes('Aquest pilar encara no té vistes assignades'));
ok('E · grid de cards hub-pilar-card',              v2.includes('class="hub-pilar-card"'));

// ─── F · pilar cards · descripcions per kind ──────────────────────────
console.log('\n— F · pilar cards · descripcions per kind');
ok('F · _pilarCardDesc helper · 1-liner descripcions',  v2.includes('_pilarCardDesc(kind)'));
ok('F · NO "Obre vista completa →" link (redundància eliminada)',
                                                    !v2.includes('Obre vista completa →'));
// Manté legacy assertions del v141+v142 que segueixen vàlides
ok('F · canvas desc · Visió + Stakeholders',        v2.includes("Visió · missió · valors · stakeholders"));
ok('F · map desc · VNA',                            v2.includes('Mapa de valor VNA'));
ok('F · quality desc · 12-criteris',                v2.includes("'12-criteris'") || v2.includes('12-criteris'));
ok('F · wallet desc',                               v2.includes('Saldo + flow'));
ok('F · team-* kinds · permission matrix mencionada',
                                                    v2.includes('RBAC') || v2.includes('Matriu RBAC'));

// v150 contract · les assertions exhaustives del nou disseny viuen a
// v150UxSimplification.test.js · aquí només verifiquem que l'orphan code
// del v141+v142 ja no existeix (regressió de la simplificació).
ok('F · v150 · contract reset · no orphan _renderSubBody', !v2.includes('_renderSubBody()'));
ok('F · v150 · contract reset · no orphan _renderSubInTab',!v2.includes('_renderSubInTab(sub, fullHref)'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
