// CASTELLERS-001 sprint A · tests del seed
import { buildCastellersSeed, CASTELLERS_PROJECT_ID, CASTELLERS_ORG_ID } from '../core/castellersSeed.js';
import { validateOrganization } from '../core/organizationService.js';
import { validateProcess } from '../core/processService.js';
import { validateSoc } from '../core/socDualPurposeService.js';
import { validateResource } from '../core/resourceService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== CASTELLERS-001 sprint A · seed ===\n');

const seed = buildCastellersSeed({ ts: 1700000000000 });

// Org
eq(seed.org.id, CASTELLERS_ORG_ID,                       'A · org id stable');
eq(seed.org.legalKind, 'association',                    'A · legalKind association');
t(seed.org.stakeholders.length >= 10,                   `A · ≥10 stakeholders · ${seed.org.stakeholders.length}`);
eq(validateOrganization(seed.org).ok, true,             'A · org valid · sumPct = 100');

// Project
eq(seed.project.id, CASTELLERS_PROJECT_ID,               'B · project id stable');
eq(seed.project.orgId, CASTELLERS_ORG_ID,                'B · project orgId backed by org');
t(seed.org.projectIds.includes(CASTELLERS_PROJECT_ID),   'B · org references project');
eq(seed.project.vna_roles.length, seed.roles.length,     'B · vna_roles count == roles count');
eq(seed.project.vna_transactions.length, seed.transactions.length, 'B · vna_tx == transactions');

// Roles (12 expected per design)
eq(seed.roles.length, 12,                                'C · 12 roles');
const levels = new Set(seed.roles.map(r => r.content.castell_level));
t(levels.has('pinya') && levels.has('tronc') && levels.has('pom_de_dalt'), 'C · 3 castell levels');
t(seed.roles.every(r => r.type === 'role'),              'C · all roles type=role');
t(seed.roles.every(r => r.content.kind === 'project_role'), 'C · all project_role');

// Transactions (18 expected)
eq(seed.transactions.length, 18,                         'D · 18 transactions');
eq(seed.stats.tangibleTxCount, 10,                       'D · 10 tangible');
eq(seed.stats.intangibleTxCount, 8,                      'D · 8 intangible');

// Processes (4 expected · all active)
eq(seed.processes.length, 4,                             'E · 4 processes');
const procCategories = new Set(seed.processes.map(p => p.category));
t(procCategories.has('ops'),                             'E · ops category');
t(procCategories.has('governance'),                      'E · governance');
t(procCategories.has('learn'),                           'E · learn');
t(seed.processes.every(p => validateProcess(p).ok),      'E · all processes valid');
t(seed.processes.every(p => p.status === 'active'),      'E · all active');
t(seed.processes.every(p => p.kpis.length >= 1),         'E · all have ≥1 KPI');

// SOCs (5 expected · all valid)
eq(seed.socs.length, 5,                                  'F · 5 SOCs');
t(seed.socs.every(s => validateSoc(s).ok),               'F · all SOCs valid');
t(seed.socs.some(s => s.checklist.length > 0),           'F · ≥1 SOC has checklist items');

// Resources (3 expected · all valid)
eq(seed.resources.length, 3,                             'G · 3 resources');
t(seed.resources.every(r => validateResource(r).ok),     'G · all resources valid');
const kinds = new Set(seed.resources.map(r => r.kind));
t(kinds.has('space') && kinds.has('equipment') && kinds.has('consumable'), 'G · 3 different kinds');

// Determinism · same ts → same shape
const seed2 = buildCastellersSeed({ ts: 1700000000000 });
eq(seed2.org.id, seed.org.id,                            'H · determinism · org id');
eq(seed2.roles.length, seed.roles.length,                'H · determinism · role count');
eq(seed2.transactions[0].id, seed.transactions[0].id,    'H · determinism · tx[0] id');

// Stats consistent
eq(seed.stats.stakeholderCount, seed.org.stakeholders.length, 'I · stats consistent · stakeholders');
eq(seed.stats.roleCount, seed.roles.length,              'I · stats consistent · roles');
eq(seed.stats.processCount, seed.processes.length,       'I · stats consistent · processes');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
