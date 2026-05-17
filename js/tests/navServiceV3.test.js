// =============================================================================
// TEAMTOWERS SOS V11 — NAV V3 · TDD (PR-A · navbar única · 5 grups)
// Ruta · /js/tests/navServiceV3.test.js
//
// Valida que la nova information architecture de la navbar (Crear · Treballar ·
// Comptabilitzar · Connectar · Aprendre) és consistent + cobreix totes les
// vistes existents + identity viu fora dels 5 grups + cap destí orfe.
// =============================================================================

import {
    NAV_CATEGORIES, NAV_DESTINATIONS, IDENTITY_MENU_ITEMS,
    buildNavLinks, groupNavByCategory, renderGlobalNavHtml, renderNavGroupedHtml,
} from '../core/navService.js';

let pass = 0, fail = 0;
function ok(label, cond, expected = '', got = '') {
    if (cond) { pass++; console.log('✓', label); }
    else {
        fail++;
        const detail = (expected !== '' || got !== '') ? ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})` : '';
        console.log('✗', label + detail);
    }
}

console.log('=== NAV-V3 · navbar única · 5 grups (PR-A) ===\n');

// ─── A · 5 grups canònics ────────────────────────────────────────────────
console.log('— A · NAV_CATEGORIES · 5 grups imperatius');
const EXPECTED_GROUPS = ['create', 'work', 'account', 'connect', 'learn'];
ok('A · NAV_CATEGORIES 5 entries', NAV_CATEGORIES.length === 5, 5, NAV_CATEGORIES.length);
for (const g of EXPECTED_GROUPS) {
    ok('A · grup canònic ' + g, NAV_CATEGORIES.some(c => c.id === g));
}
ok('A · cada grup té icon i label', NAV_CATEGORIES.every(c => c.icon && c.label && c.hint));

// ─── B · IDENTITY_MENU_ITEMS · viu fora dels 5 grups ─────────────────────
console.log('\n— B · IDENTITY · avatar-menu separat');
ok('B · IDENTITY_MENU_ITEMS ≥3', IDENTITY_MENU_ITEMS.length >= 3);
const idsInIdentity = NAV_DESTINATIONS.filter(d => d.category === 'identity').map(d => d.id);
for (const it of IDENTITY_MENU_ITEMS) {
    ok('B · identity item ' + it + ' té destinació amb category=identity', idsInIdentity.includes(it));
}

// ─── C · cap destí amb category orfe ────────────────────────────────────
console.log('\n— C · cobertura · cap destí amb category orfe');
const validCats = new Set([...EXPECTED_GROUPS, 'identity', 'home']);
for (const d of NAV_DESTINATIONS) {
    ok('C · destí ' + d.id + ' té category vàlida (' + d.category + ')', validCats.has(d.category));
}

// ─── D · noves vistes integrades ────────────────────────────────────────
console.log('\n— D · noves vistes integrades');
const REQUIRED_NEW = [
    { id: 'create',      cat: 'create' },
    { id: 'create-live', cat: 'create' },
    { id: 'quality',     cat: 'work' },
    { id: 'projects',    cat: 'create' },
    { id: 'process-catalog', cat: 'create' },
    { id: 'notes',       cat: 'learn' },
];
for (const r of REQUIRED_NEW) {
    const d = NAV_DESTINATIONS.find(x => x.id === r.id);
    ok('D · ' + r.id + ' present', !!d);
    if (d) ok('D · ' + r.id + ' al grup ' + r.cat, d.category === r.cat, r.cat, d.category);
}

// ─── E · groupNavByCategory · només els 5 grups (no identity ni home) ───
console.log('\n— E · groupNavByCategory exposa només els 5 grups principals');
const groups = groupNavByCategory({ projectId: 'p-test' });
ok('E · ≥5 grups retornats', groups.length === 5, 5, groups.length);
ok('E · cap grup "identity" als 5 grups', !groups.some(g => g.category.id === 'identity'));
ok('E · cap grup "home" als 5 grups', !groups.some(g => g.category.id === 'home'));
for (const g of EXPECTED_GROUPS) {
    ok('E · grup ' + g + ' present al menú', groups.some(grp => grp.category.id === g));
}

// ─── F · cada grup té ≥3 items (cobertura mínima) ────────────────────────
console.log('\n— F · cada grup té ≥3 items');
for (const g of groups) {
    ok('F · grup ' + g.category.id + ' té ≥3 items (got ' + g.links.length + ')', g.links.length >= 3);
}

// ─── G · renderGlobalNavHtml · conté logo + home + 5 grups + search + avatar ─
console.log('\n— G · renderGlobalNavHtml estructura completa');
const html = renderGlobalNavHtml({ pathname: '/home' });
ok('G · HTML conté logo', html.includes('sos-global-nav-logo'));
ok('G · HTML conté home pill', html.includes('sos-global-nav-home'));
ok('G · HTML conté el bloc de grups', html.includes('sos-global-nav-groups'));
// v120 · search es MOU al breadcrumb · NO al navbar
ok('G · HTML navbar NO té search input (mogut al breadcrumb)', !html.includes('sos-global-search'));
ok('G · HTML conté pill Messages (Inbox)', html.includes('sos-global-nav-msg'));
ok('G · HTML conté pill Wallet · saldo', html.includes('sos-global-nav-wallet'));
ok('G · HTML conté avatar identity menu', html.includes('sos-global-nav-avatar'));
// Project pill només si projectId
const htmlNoProj = renderGlobalNavHtml({ pathname: '/home', projectId: null });
ok('G · sense project · no apareix project-pill', !htmlNoProj.includes('sos-global-nav-project-pill'));
const htmlWithProj = renderGlobalNavHtml({ pathname: '/map', projectId: 'proj-abc' });
ok('G · amb project · apareix project-pill', htmlWithProj.includes('sos-global-nav-project-pill'));

// ─── H · buildNavLinks · home present també sense projectId ─────────────
console.log('\n— H · home global sempre disponible');
const linksNoProj = buildNavLinks({ projectId: null });
ok('H · home present sense projectId', linksNoProj.some(l => l.id === 'home'));
ok('H · create present sense projectId (global)', linksNoProj.some(l => l.id === 'create'));
ok('H · canvas NO present sense projectId (project-scoped)', !linksNoProj.some(l => l.id === 'canvas'));

// ─── I · regressió · destins V2 antics absents (sense renames trencats) ─
console.log('\n— I · cap destí duplicat ni orfe per migració V2→V3');
const allIds = NAV_DESTINATIONS.map(d => d.id);
const dupIds = allIds.filter((id, i) => allIds.indexOf(id) !== i);
ok('I · cap id duplicat (got ' + dupIds.length + ')', dupIds.length === 0);

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
