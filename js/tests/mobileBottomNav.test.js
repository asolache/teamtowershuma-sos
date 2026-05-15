// UX-MOBILE-D · sprint mobile-first · tests del bottom-nav
import {
    inferActiveId, renderHtml,
    PRIMARY, HREF_BY_ID, NAV_ID,
} from '../core/mobileBottomNav.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== UX-MOBILE-D · mobileBottomNav ===\n');

// 1 · 5 primaris · cap zona ≥7 (Miller's Law)
eq(PRIMARY.length, 5,                                    'A · 5 primary items (Miller)');
t(PRIMARY.every(p => p.id && p.icon && p.label && Array.isArray(p.match)), 'A · all items well-shaped');
t(typeof NAV_ID === 'string' && NAV_ID.length > 0,       'A · NAV_ID exported');

// 2 · inferActiveId · happy paths
eq(inferActiveId('/'),         'home',                   'B · / → home');
eq(inferActiveId('/home'),     'home',                   'B · /home → home');
eq(inferActiveId('/timeline'), 'timeline',               'B · /timeline → timeline');
eq(inferActiveId('/registry'), 'timeline',               'B · /registry → timeline (same group)');
eq(inferActiveId('/create'),   'create',                 'B · /create → create');
eq(inferActiveId('/dashboard'),'create',                 'B · /dashboard → create (project creation flow)');
eq(inferActiveId('/market'),   'market',                 'B · /market → market');
eq(inferActiveId('/opportunities'), 'market',            'B · /opportunities → market (same group)');
eq(inferActiveId('/process-catalog'), 'market',          'B · /process-catalog → market (discover)');
eq(inferActiveId('/identity'), 'me',                     'B · /identity → me');
eq(inferActiveId('/wallet'),   'me',                     'B · /wallet → me');
eq(inferActiveId('/u/alvaro'), 'me',                     'B · /u/{handle} → me');
eq(inferActiveId('/settings'), 'me',                     'B · /settings → me');
eq(inferActiveId('/settings-v2'), 'me',                  'B · /settings-v2 → me');

// 3 · paths no-match · null
eq(inferActiveId('/canvas'),   null,                     'B · /canvas → null');
eq(inferActiveId('/inventat'), null,                     'B · /inventat → null');

// 4 · HREF_BY_ID
t(HREF_BY_ID.home === '/home',                           'C · home href /home');
t(HREF_BY_ID.timeline === '/timeline',                   'C · timeline href');
t(HREF_BY_ID.create === '/create',                       'C · create href');
t(HREF_BY_ID.market === '/market',                       'C · market href');
t(HREF_BY_ID.me === '/identity',                         'C · me href');

// 5 · renderHtml · pure · conté els 5 items
const html = renderHtml({ activeId: 'home' });
t(html.includes('sos-mbn'),                              'D · root class sos-mbn');
t(html.includes(NAV_ID),                                 'D · id attribute set');
for (const item of PRIMARY) {
    t(html.includes('aria-label="' + item.label + '"'),  'D · ' + item.label + ' aria-label');
    t(html.includes(item.icon),                          'D · ' + item.label + ' icon');
}
// active className on home item only
t(html.match(/active.*Avui/) || html.match(/Avui.*active/), 'D · home té active class · label "Avui"');

// 6 · renderHtml sense active · cap item active
const htmlNoActive = renderHtml({ activeId: null });
t(!htmlNoActive.includes('active'),                      'D · no active · cap item.active');

// 7 · renderHtml amb data-link · router-compat
t(html.includes('data-link'),                            'E · data-link present · router consumeix');

// 8 · custom primary / href map · injection point
const customPrimary = [
    { id: 'x', icon: '⭐', label: 'X', match: ['/x'] },
];
const customHrefs = { x: '/x' };
const customHtml = renderHtml({ activeId: 'x', primary: customPrimary, hrefMap: customHrefs });
t(customHtml.includes('aria-label="X"'),                 'E · custom primary injectable');
t(customHtml.includes('href="/x"'),                      'E · custom href map injectable');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
