// UX-LEGENDARY · globalSearch tests pure
import {
    searchNodes,
    SEARCH_ID, TRIGGER_ID, QUICK_LINKS,
} from '../core/globalSearch.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== UX-LEGENDARY · globalSearch ===\n');

// Constants
t(typeof SEARCH_ID === 'string',                         'A · SEARCH_ID exported');
t(typeof TRIGGER_ID === 'string',                        'A · TRIGGER_ID exported');
t(Array.isArray(QUICK_LINKS) && QUICK_LINKS.length >= 5, 'A · QUICK_LINKS ≥5 entries');
for (const ql of QUICK_LINKS) {
    t(ql.icon && ql.title && ql.href && ql.type,         'A · quick link well-shaped · ' + ql.title);
}

// searchNodes · empty cases
eq(searchNodes([], 'foo').length, 0,                     'B · empty array · empty results');
eq(searchNodes(null, 'foo').length, 0,                   'B · null nodes · empty');
eq(searchNodes([{ type: 'project' }], '').length, 0,     'B · empty query · empty');
eq(searchNodes([{ type: 'project' }], null).length, 0,   'B · null query · empty');

// searchNodes · match by title in content.title
const nodes = [
    { id: 'p1', type: 'project',     content: { title: 'Castellers de Gràcia', description: 'colla castellera' }, keywords: ['castellers'] },
    { id: 'w1', type: 'work_order',  content: { title: 'Neteja botiga matí' }, keywords: ['ops', 'cleaning'] },
    { id: 'n1', type: 'note',        content: { text: 'Recordar reunió dijous' } },
    { id: 'u1', type: 'matriu_member', content: { handle: '@alvaro', displayName: 'Alvaro' } },
    { id: 's1', type: 'sop',         content: { title: 'Onboarding cohort 0' } },
];

const r1 = searchNodes(nodes, 'castellers');
t(r1.length >= 1,                                        'C · find "castellers" · ≥1 result');
eq(r1[0].node.id, 'p1',                                  'C · top result is project');

const r2 = searchNodes(nodes, 'neteja');
t(r2.length >= 1,                                        'C · find "neteja" · ≥1');
eq(r2[0].node.id, 'w1',                                  'C · top is WO');

const r3 = searchNodes(nodes, 'alvaro');
t(r3.length >= 1,                                        'C · find "alvaro" · ≥1');

const r4 = searchNodes(nodes, 'reunió');
t(r4.length >= 1,                                        'C · find by text (note content)');

const r5 = searchNodes(nodes, 'inventat-no-trobat');
eq(r5.length, 0,                                         'C · no match · 0 results');

// Case-insensitive
const r6 = searchNodes(nodes, 'CASTELLERS');
t(r6.length >= 1,                                        'C · case-insensitive · CASTELLERS finds');
eq(r6[0].node.id, 'p1',                                  'C · same project found');

// Title prefix bonus · "cas" matches "Castellers..."
const r7 = searchNodes(nodes, 'cas');
t(r7.length >= 1,                                        'C · prefix match works');

// Keyword match · "ops"
const r8 = searchNodes(nodes, 'ops');
t(r8.length >= 1,                                        'C · keyword match · ops finds WO');

// Score ordering · perfect title hit > partial keyword
const r9 = searchNodes(nodes, 'onboarding');
eq(r9[0].node.id, 's1',                                  'C · score · title match top');

// Limit
const r10 = searchNodes(nodes, 'a', { limit: 2 });
t(r10.length <= 2,                                       'C · limit respected');

// Module shape
import * as gs from '../core/globalSearch.js';
t(typeof gs.open === 'function',                         'D · open exported');
t(typeof gs.close === 'function',                        'D · close exported');
t(typeof gs.injectGlobal === 'function',                 'D · injectGlobal exported');
t(typeof gs.destroy === 'function',                      'D · destroy exported');
t(typeof gs.searchNodes === 'function',                  'D · searchNodes exported (pure)');
t(typeof gs.sortLinksByHabits === 'function',            'D · sortLinksByHabits exported');

// sortLinksByHabits · order by visit counts
const links = [
    { icon: '🏠', title: 'Home',     href: '/home',     type: 'page' },
    { icon: '🐝', title: 'Sprint',   href: '/sprint',   type: 'page' },
    { icon: '🛒', title: 'Market',   href: '/market',   type: 'page' },
    { icon: '💬', title: 'Timeline', href: '/timeline', type: 'page' },
];
const counts1 = { '/timeline': 12, '/sprint': 3, '/home': 8 };
const sorted1 = gs.sortLinksByHabits(links, counts1);
eq(sorted1.length, 4,                                    'E · sortLinksByHabits · keeps length');
eq(sorted1[0].href, '/timeline',                         'E · top visited (12) first');
eq(sorted1[1].href, '/home',                             'E · second visited (8) next');
eq(sorted1[2].href, '/sprint',                           'E · third visited (3) next');
eq(sorted1[3].href, '/market',                           'E · 0-visits (Market) last');

// Tie-break · estable amb original order si mateixes visites
const counts2 = { '/home': 5, '/sprint': 5 };
const sorted2 = gs.sortLinksByHabits(links, counts2);
eq(sorted2[0].href, '/home',                             'E · tie · original order preserved');
eq(sorted2[1].href, '/sprint',                           'E · tie 2');

// Empty counts · returns original order
const sorted3 = gs.sortLinksByHabits(links, {});
eq(sorted3[0].href, '/home',                             'E · no counts · original order');
eq(sorted3[3].href, '/timeline',                         'E · last preserved');

// Visit count badge on result
for (const item of sorted1) {
    t(typeof item.visits === 'number',                   'E · visits field added');
}
eq(sorted1[0].visits, 12,                                'E · visits value correct');
eq(sorted1[3].visits, 0,                                 'E · 0 visits explicit');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
