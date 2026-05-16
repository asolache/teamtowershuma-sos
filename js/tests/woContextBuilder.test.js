// KANBAN-IA-SOS sprint A · tests stand-alone per woContextBuilder.
// Ús: node js/tests/woContextBuilder.test.js

import { buildWoContext } from '../core/woContextBuilder.js';

let pass = 0, fail = 0;
function t(cond, msg) { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } }
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== KANBAN-IA-SOS · woContextBuilder ===\n');

// A · empty input · warnings + still returns something
const empty = buildWoContext({});
t(empty.systemPrompt && empty.systemPrompt.length > 100,         'A · empty · systemPrompt amb SOS principles header');
t(empty.warnings.length > 0,                                     'A · empty · warnings recollits');
t(empty.systemPrompt.includes('SOS · "Swarm Operative System"'), 'A · empty · SOS branded');

// B · WO bàsic · sense extras
const wo = { id: 'wo-1', type: 'work_order', projectId: 'p1', content: { title: 'Crear landing v1', estimatedHours: 4, fmvPerHour: 50, priority: 'high' } };
const b = buildWoContext({ wo });
t(b.systemPrompt.includes('Equivalent human cost · 200.00'),     'B · accounting hints · cost calculat');
t(b.systemPrompt.includes('Priority · high'),                    'B · priority surface');
t(b.userHints.includes('Crear landing v1'),                      'B · userHints inclou title');
t(b.userHints.includes('wo-1'),                                  'B · userHints inclou wo.id');

// C · Sector + projectType from project
const project = { id: 'p1', content: { sectorId: 'tech', projectType: 'foundational-network' } };
const c = buildWoContext({ wo, project });
t(c.systemPrompt.includes('Sector · tech'),                      'C · sector surfaces');
t(c.systemPrompt.includes('foundational-network'),               'C · projectType surfaces');

// C2 · iaContextHint si està al project
const c2 = buildWoContext({ wo, project: { content: { sectorId: 'edu', iaContextHint: 'centrarse en cohort + landing' } } });
t(c2.systemPrompt.includes('IA context hint · centrarse en cohort'),
                                                                 'C2 · iaContextHint propagat');

// D · Subtype info
const d = buildWoContext({
    wo: { id: 'w', content: { title: 't', subtypeId: 'cooperativa-cures', subtype_context: 'Cures · economia social' } },
});
t(d.systemPrompt.includes('Subtype id · cooperativa-cures'),     'D · subtypeId al prompt');
t(d.systemPrompt.includes('Cures · economia social'),            'D · subtype_context surface');

// E · Roles afectats
const roles = [
    { id: 'r1', content: { name: 'PM',     castell_level: 'tronc',         fmvPerHour: 60, typical_actor: 'Marc' } },
    { id: 'r2', content: { name: 'Design', castell_level: 'pom_de_dalt',   fmvPerHour: 50 } },
];
const e = buildWoContext({ wo, roles });
t(e.systemPrompt.includes('ROLES afectats'),                     'E · roles block present');
t(e.systemPrompt.includes('PM · castell tronc · FMV 60€/h'),     'E · role detalls inline');
t(e.systemPrompt.includes('· actor Marc'),                       'E · typical_actor surface');

// E2 · maxRoles cap
const manyRoles = Array.from({ length: 10 }).map((_, i) => ({ id: 'r' + i, content: { name: 'R' + i } }));
const e2 = buildWoContext({ wo, roles: manyRoles, options: { maxRoles: 3 } });
t(e2.systemPrompt.includes('(3/10)'),                            'E2 · cap respectat · 3/10 indicat');
t(e2.systemPrompt.includes('(...7 més)'),                        'E2 · ellipsis · 7 més');

// F · Transactions
const txs = [
    { content: { from: 'PM', to: 'Design', deliverable: 'mockup landing', type: 'must' } },
    { content: { from: 'Design', to: 'Dev', deliverable: 'specs CSS' } },
];
const f = buildWoContext({ wo, transactions: txs });
t(f.systemPrompt.includes('TRANSACCIONS VNA'),                   'F · transactions block');
t(f.systemPrompt.includes('from PM to Design'),                  'F · tx 1 detalls');
t(f.systemPrompt.includes('mockup landing'),                     'F · deliverable surface');

// G · Neural path bundle
const bundle = { id: 'np-1', content: { name: 'Onboarding founder', intent: 'generate-cv', audienceId: 'inversors', stepCount: 12 } };
const g = buildWoContext({ wo, bundle });
t(g.systemPrompt.includes('NEURAL PATH BUNDLE'),                 'G · bundle block');
t(g.systemPrompt.includes('Nom · Onboarding founder'),           'G · bundle name');
t(g.systemPrompt.includes('Intent · generate-cv'),               'G · intent');
t(g.systemPrompt.includes('Steps · 12'),                         'G · stepCount');

// H · Disable principles header via option
const h = buildWoContext({ wo, options: { includePrinciples: false } });
t(!h.systemPrompt.includes('MUST-HONOR'),                        'H · principles header excluït');

// I · Output expectations block sempre present
const i = buildWoContext({ wo });
t(i.systemPrompt.includes('OUTPUT EXPECTATIONS'),                'I · output expectations block');
t(i.systemPrompt.includes('persistible com a node'),             'I · honora principi 1');

// J · TDD check surface
const j = buildWoContext({
    wo: { id: 'w', content: { title: 't', tddCheck: 'contains:✓ pass', approvalRule: 'tdd-auto' } },
});
t(j.systemPrompt.includes('TDD check · contains:✓ pass'),        'J · tddCheck surface');
t(j.systemPrompt.includes('Approval rule · tdd-auto'),           'J · approvalRule surface');

// K · blockCount sensible (≥3: principles + output + accounting fallback)
const k = buildWoContext({ wo });
t(k.blockCount >= 3,                                              'K · blockCount ≥3');

// L · sanitization · no nous-line trencaments
const l = buildWoContext({
    wo: { id: 'w', content: { title: 'línia1\nlínia2\nlínia3', description: 'desc\r\namb\r\nsalts' } },
});
t(!l.systemPrompt.includes('línia1\nlínia2'),                    'L · nous-line normalitzats al prompt');
t(l.userHints.length > 0,                                         'L · userHints generats');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
