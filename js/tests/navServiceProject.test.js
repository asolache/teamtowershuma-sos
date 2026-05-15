// NAV-FIX 2026-05-15 · regression test · ?project= ha d'aplicar a TOTES
// les vistes project-scoped al dropdown del navbar.
import { buildNavLinks, groupNavByCategory } from '../core/navService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== nav · ?project= per a vistes project-scoped ===\n');

const PROJECT_ID = 'proj-test-123';
const links = buildNavLinks({ projectId: PROJECT_ID });

const find = (id) => links.find(l => l.id === id);

// Project-scoped views (global:false · NECESSITEN projectId)
const PROJECT_SCOPED = [
    'canvas', 'pitch', 'pact', 'presentation',
    'sops', 'tokenomics', 'accounting', 'value',
    'proposals', 'invoices',
    'lifecycle', 'swarm', 'improve',
];

for (const id of PROJECT_SCOPED) {
    const link = find(id);
    t(link,                                          'A · ' + id + ' present quan hi ha projectId');
    if (link) {
        t(link.href.includes('?project=' + PROJECT_ID),
           'A · ' + id + ' href incloent ?project= · ' + link.href);
    }
}

// Globals que també han de rebre ?project= si està disponible
const GLOBAL_BUT_CONTEXTUAL = ['kanban', 'map', 'market', 'wallet', 'savings'];
for (const id of GLOBAL_BUT_CONTEXTUAL) {
    const link = find(id);
    if (link) {
        t(link.href.includes('?project=' + PROJECT_ID),
           'B · ' + id + ' global+contextual · ' + link.href);
    }
}

// Globals purs · NO han de rebre projectId (preserva semàntica)
// REGISTRY-MERGE 2026-05-16 · 'registry' eliminat del nav · consolidat a /opportunities
const PURE_GLOBALS = ['dashboard', 'sprint', 'matriu', 'opportunities', 'identity', 'skills', 'sectors'];
for (const id of PURE_GLOBALS) {
    const link = find(id);
    t(link,                                          'C · ' + id + ' present (global)');
    if (link) {
        t(!link.href.includes('?project='),
           'C · ' + id + ' SENSE ?project= · ' + link.href);
    }
}

// Sense projectId · només globals visibles
const globalsOnly = buildNavLinks({ projectId: null });
for (const id of PROJECT_SCOPED) {
    t(!globalsOnly.find(l => l.id === id),
       'D · ' + id + ' NO present sense projectId');
}
for (const id of PURE_GLOBALS) {
    t(globalsOnly.find(l => l.id === id),
       'D · ' + id + ' present sense projectId (global)');
}

// Verifica no hi ha duplicats ? a la URL (escenari edge case)
const allWithProject = buildNavLinks({ projectId: PROJECT_ID });
for (const link of allWithProject) {
    const qmCount = (link.href.match(/\?/g) || []).length;
    t(qmCount <= 1,                                  'E · ' + link.id + ' max 1 ? a la URL');
}

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
