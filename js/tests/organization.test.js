// ORG-ENTITY-001 sprint A · tests stand-alone per organizationService.
// Ús · node js/tests/organization.test.js

import {
    buildEmptyOrganization, validateOrganization,
    addStakeholder, removeStakeholder, updateStakeholderShares,
    linkProject, unlinkProject, linkResource, linkSystem,
    setTokenomicsGlobal,
    buildPersonalOrgFor, migrateProjectIntoOrg,
    computeOrgStats,
    LEGAL_KINDS, STAKEHOLDER_ROLES, ORGANIZATION_TYPE, ORGANIZATION_VERSION,
} from '../core/organizationService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== ORG-ENTITY-001 sprint A · organizationService ===\n');

// 1 · Constants
t(typeof ORGANIZATION_TYPE === 'string',          'A · type constant');
t(typeof ORGANIZATION_VERSION === 'string',       'A · version constant');
t(LEGAL_KINDS.includes('cooperative'),            'A · legal kinds · cooperative');
t(LEGAL_KINDS.includes('individual'),             'A · legal kinds · individual');
t(STAKEHOLDER_ROLES.includes('soci-fundador'),    'A · stakeholder roles · founder');

// 2 · buildEmptyOrganization · happy path
const org1 = buildEmptyOrganization({
    name: 'Castellers de Gràcia',
    legalKind: 'association',
    founderHandle: '@alvaro',
    ts: 1700000000000,
});
eq(org1.type, ORGANIZATION_TYPE,                   'B · type set');
eq(org1.name, 'Castellers de Gràcia',              'B · name set');
eq(org1.legalKind, 'association',                  'B · legalKind set');
eq(org1.founderHandle, '@alvaro',                  'B · founderHandle set');
eq(org1.stakeholders.length, 1,                    'B · 1 stakeholder (founder)');
eq(org1.stakeholders[0].handle, '@alvaro',         'B · founder handle');
eq(org1.stakeholders[0].role, 'soci-fundador',     'B · founder role');
eq(org1.stakeholders[0].sharePct, 100,             'B · founder sharePct 100');
t(org1.id.startsWith('org-castellers'),            'B · id derivat del nom');

// 3 · buildEmptyOrganization · errors
try { buildEmptyOrganization({}); t(false, 'B · sense name · throws'); }
catch (_) { t(true, 'B · sense name · throws'); }
try { buildEmptyOrganization({ name: 'X', legalKind: 'inventat' }); t(false, 'B · legalKind invàlid · throws'); }
catch (_) { t(true, 'B · legalKind invàlid · throws'); }

// 4 · validateOrganization
eq(validateOrganization(org1).ok, true,            'C · org1 vàlida');
eq(validateOrganization(null).ok, false,           'C · null · fail');
eq(validateOrganization({}).ok, false,             'C · {} · fail');
const orgInvalidKind = { ...org1, legalKind: 'inventat' };
eq(validateOrganization(orgInvalidKind).ok, false, 'C · legalKind invàlid · fail');

// 5 · addStakeholder
const org2 = addStakeholder(org1, { handle: '@maria', role: 'soci-treballador', sharePct: 30 });
eq(org2.stakeholders.length, 2,                    'D · 2 stakeholders');
eq(org2.stakeholders[1].handle, '@maria',          'D · @maria afegit');
// Validació · sum > 100 hauria de fallar  (alvaro 100 + maria 30 = 130)
eq(validateOrganization(org2).ok, false,           'D · sum > 100 · fail');

// 5b · Ajustar shares · alvaro 70 · maria 30 · total 100
const org2b = updateStakeholderShares(org2, { '@alvaro': 70 });
eq(org2b.stakeholders.find(s => s.handle === '@alvaro').sharePct, 70, 'D · share actualitzat');
eq(validateOrganization(org2b).ok, true,           'D · sum = 100 · ok');

// 6 · Duplicate handle
try { addStakeholder(org2b, { handle: '@alvaro', role: 'comunitat' }); t(false, 'D · duplicate handle · throws'); }
catch (_) { t(true, 'D · duplicate handle · throws'); }

// 7 · removeStakeholder
const org3 = removeStakeholder(org2b, '@maria');
eq(org3.stakeholders.length, 1,                    'D · post-remove · 1 stakeholder');

// 8 · linkProject
const org4 = linkProject(org1, 'proj-001');
eq(org4.projectIds.length, 1,                      'E · projectIds · 1');
// Idempotent
const org4b = linkProject(org4, 'proj-001');
eq(org4b.projectIds.length, 1,                     'E · linkProject idempotent');
// Unlink
const org4c = unlinkProject(org4b, 'proj-001');
eq(org4c.projectIds.length, 0,                     'E · unlinkProject ok');

// 9 · linkResource + linkSystem
const org5 = linkResource(linkSystem(org1, 'sys-sales'), 'res-calendly');
eq(org5.systems.length, 1,                         'E · systems · 1');
eq(org5.sharedResourceIds.length, 1,               'E · resources · 1');

// 10 · setTokenomicsGlobal
const org6 = setTokenomicsGlobal(org1, 'token-cohort');
eq(org6.tokenomicsGlobal, 'token-cohort',          'F · tokenomicsGlobal set');

// 11 · buildPersonalOrgFor
const personalOrg = buildPersonalOrgFor({ handle: '@alvaro' });
eq(personalOrg.legalKind, 'individual',            'G · personal · legalKind individual');
eq(personalOrg.stakeholders.length, 1,             'G · personal · 1 stakeholder');
eq(personalOrg.stakeholders[0].handle, '@alvaro',  'G · personal · alvaro');
eq(personalOrg.stakeholders[0].sharePct, 100,      'G · personal · 100%');

// 12 · migrateProjectIntoOrg
const project = { id: 'proj-orphan-1', type: 'project', name: 'Proj orphan' };
const migration = migrateProjectIntoOrg(personalOrg, project);
eq(migration.org.projectIds.length, 1,             'H · migration · org té projecte');
eq(migration.org.projectIds[0], 'proj-orphan-1',   'H · migration · projectId correcte');
eq(migration.project.orgId, personalOrg.id,        'H · migration · projecte té orgId');
t(migration.project.updatedAt > 0,                 'H · migration · updatedAt fresc');

// 13 · computeOrgStats
const richOrg = addStakeholder(
    addStakeholder(org1,
        { handle: '@bob', role: 'soci-treballador', sharePct: 20 }),
    { handle: '@carol', role: 'soci-consumidor', sharePct: 10 }
);
// Re-share alvaro a 70 perquè quadri
const richOrg2 = updateStakeholderShares(richOrg, { '@alvaro': 70 });
const stats = computeOrgStats(richOrg2);
eq(stats.stakeholderCount, 3,                      'I · stats · 3 stakeholders');
eq(stats.sharePctAllocated, 100,                   'I · stats · 100% allocated');
eq(stats.sharePctFree, 0,                          'I · stats · 0% free');
t(stats.roleDistribution['soci-fundador'] === 1,   'I · role distrib · 1 fundador');
t(stats.roleDistribution['soci-treballador'] === 1,'I · role distrib · 1 treballador');

// 14 · Determinisme · same ts + name → same id
const a = buildEmptyOrganization({ name: 'Test Org', ts: 1700000000000, founderHandle: '@x' });
const b = buildEmptyOrganization({ name: 'Test Org', ts: 1700000000000, founderHandle: '@x' });
eq(a.id, b.id,                                     'J · determinisme · same id');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
