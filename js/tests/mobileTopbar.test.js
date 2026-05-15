// UX-LEGENDARY · mobileTopbar tests pure
import {
    renderTopbarHtml, renderDrawerHtml,
    TOPBAR_ID, DRAWER_ID, BACKDROP_ID, DRAWER_GROUPS,
} from '../core/mobileTopbar.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== UX-LEGENDARY · mobileTopbar ===\n');

// Constants
t(typeof TOPBAR_ID === 'string',                         'A · TOPBAR_ID exported');
t(typeof DRAWER_ID === 'string',                         'A · DRAWER_ID exported');
t(typeof BACKDROP_ID === 'string',                       'A · BACKDROP_ID exported');
t(new Set([TOPBAR_ID, DRAWER_ID, BACKDROP_ID]).size === 3, 'A · all 3 IDs distinct');

// DRAWER_GROUPS · structure
t(Array.isArray(DRAWER_GROUPS),                          'A · DRAWER_GROUPS is array');
t(DRAWER_GROUPS.length >= 4,                             'A · ≥4 groups');
for (const g of DRAWER_GROUPS) {
    t(g.title && Array.isArray(g.items),                 'A · group · title + items · ' + g.title);
    t(g.items.length >= 1,                               'A · group · ≥1 item');
    for (const it of g.items) {
        t(it.id && it.href && it.icon && it.label,       'A · item ben format · ' + it.label);
    }
}

// renderTopbarHtml
const tb = renderTopbarHtml({ title: 'Test Page', currentPath: '/test' });
t(tb.includes('role="banner"'),                          'B · role banner');
t(tb.includes('aria-label="Obrir menú principal"'),      'B · menu button aria-label');
t(tb.includes('aria-expanded="false"'),                  'B · aria-expanded initial');
t(tb.includes('Test Page'),                              'B · title rendered');
t(tb.includes('data-link'),                              'B · data-link router');
t(tb.includes('TT'),                                     'B · logo TT');

// renderTopbarHtml · XSS escape
const tbXss = renderTopbarHtml({ title: '<script>alert(1)</script>' });
t(!tbXss.includes('<script>alert(1)'),                   'B · XSS escape title');

// renderDrawerHtml
const dr = renderDrawerHtml({ currentPath: '/home' });
t(dr.includes('role="dialog"'),                          'C · role dialog');
t(dr.includes('aria-modal="true"'),                      'C · aria-modal');
t(dr.includes('aria-labelledby="sosMtbDrawerTitle"'),    'C · aria-labelledby');
t(dr.includes('Tancar menú'),                            'C · close button aria');
t(dr.includes('aria-current="page"'),                    'C · current page marked');
t(dr.includes('href="/home"'),                           'C · home link present');
t(dr.includes('href="/timeline"'),                       'C · timeline link');
t(dr.includes('href="/create"'),                         'C · create link');
t(dr.includes('href="/identity"'),                       'C · identity link');

// Drawer · sense currentPath active match
const drNone = renderDrawerHtml({ currentPath: '/nothing-matches' });
t(!drNone.includes('aria-current="page"'),               'C · no active si cap match');

// Drawer · root '/' actua com a /home
const drRoot = renderDrawerHtml({ currentPath: '/' });
t(drRoot.includes('aria-current="page"'),                'C · / activa /home (root === home)');

// All groups present
for (const g of DRAWER_GROUPS) {
    t(dr.includes(g.title),                              'C · group title rendered · ' + g.title);
}

// Module shape
import * as topbar from '../core/mobileTopbar.js';
t(typeof topbar.injectOrUpdate === 'function',           'D · injectOrUpdate exported');
t(typeof topbar.destroy === 'function',                  'D · destroy exported');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
