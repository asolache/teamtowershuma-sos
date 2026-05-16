// A · sprint analysis & design · tests stand-alone per learnRoleCatalog.
// Ús · node js/tests/learnRoleCatalog.test.js

import {
    buildBaseLearnCatalog, buildSectorExtensions, getMergedCatalog,
    findLearnRoleBySkill, ensureBaseCatalogSeeded,
    addUserContribution, editUserContribution, removeUserContribution,
    listUserContributions, _resetUserContributions,
    TARGET_BASE_ROLES, LEARN_VISIBILITY, SECTOR_EXTENSIONS, LEARN_CATALOG_VERSION,
} from '../core/learnRoleCatalog.js';
import { SKILL_TAXONOMY } from '../core/skillTaxonomy.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== A · learnRoleCatalog (catàleg Learn vs vna_roles) ===\n');

// 1 · constants
eq(TARGET_BASE_ROLES, 108,                          'A · target 108 base roles');
t(typeof LEARN_CATALOG_VERSION === 'string',        'A · version present');
t(Array.isArray(LEARN_VISIBILITY) && LEARN_VISIBILITY.length === 3, 'A · 3 visibility levels');

// 2 · buildBaseLearnCatalog · pure · 108 nodes
const base = buildBaseLearnCatalog({ ts: 1700000000000 });
eq(base.length, 108,                                'B · 108 base roles');
const allLearnRole = base.every(r => r.type === 'learn_role');
t(allLearnRole,                                     'B · tots type learn_role');
const allSeed = base.every(r => r.content?.visibility === 'seed');
t(allSeed,                                          'B · tots visibility seed');
// Cap projectId · són globals
const noProjectId = base.every(r => !r.content?.projectId);
t(noProjectId,                                      'B · cap projectId leak');
// Skills úniques · ≥90
const uniqueSkills = new Set(base.map(r => r.content.primarySkillId));
t(uniqueSkills.size >= 90,                          `B · ≥90 skills úniques · ${uniqueSkills.size}`);
// 18 padding · 108 - 90 cobertura única
const paddingCount = base.filter(r => r.content.isPadding).length;
eq(paddingCount, 108 - SKILL_TAXONOMY.length,       'B · padding count == 108 - SKILL_TAXONOMY.length');
// IDs estables i únics
const uniqueIds = new Set(base.map(r => r.id));
eq(uniqueIds.size, 108,                             'B · 108 IDs únics');
// Determinisme · mateix ts · mateixos ids
const base2 = buildBaseLearnCatalog({ ts: 1700000000000 });
eq(base[0].id,   base2[0].id,                       'B · determinisme · same ts → same first id');
eq(base[107].id, base2[107].id,                     'B · determinisme · same ts → same last id');

// 3 · Sector extensions
const agroEx = buildSectorExtensions('agroecologia', { ts: 1700000000000 });
t(agroEx.length >= 2,                               'C · agroecologia · ≥2 extensions');
const allSectorSeed = agroEx.every(r => r.content?.visibility === 'seed' && r.content?.sectorId === 'agroecologia');
t(allSectorSeed,                                    'C · sector ext · tots seed + sectorId set');
eq(buildSectorExtensions('inventat-no-existeix').length, 0, 'C · sector desconegut · 0 extensions');
eq(buildSectorExtensions(null).length, 0,           'C · sectorId null · 0 extensions');

// 4 · User contributions · localStorage CRUD
//    En entorn node sense localStorage · les funcions no han de tirar
_resetUserContributions();
const initial = listUserContributions();
t(Array.isArray(initial),                           'D · listUserContributions · array');

// Si localStorage existeix (jsdom o similar) · provem CRUD complet
const hasLS = typeof localStorage !== 'undefined';
if (hasLS) {
    _resetUserContributions();
    const added = addUserContribution({
        title: 'Test rol custom',
        primarySkillId: 'governance-design',
        skillDomain: 'governance',
        skillTier: 'foundation',
        description: 'Test desc',
    });
    t(added && added.id && added.content.title === 'Test rol custom', 'D · add · retorna node');
    eq(added.content.visibility, 'personal',        'D · add · default visibility personal');
    eq(listUserContributions().length, 1,           'D · llistat · 1 entrada');

    const edited = editUserContribution(added.id, { title: 'Editat', estHours: 50 });
    eq(edited.content.title, 'Editat',              'D · edit · title aplicat');
    eq(edited.content.estHours, 50,                 'D · edit · estHours aplicat');

    const removed = removeUserContribution(added.id);
    eq(removed, true,                               'D · remove · ok per personal');
    eq(listUserContributions().length, 0,           'D · llistat · 0 entrades després remove');
} else {
    console.log('  (sense localStorage · skip CRUD tests · OK)');
}

// 5 · getMergedCatalog
const merged = getMergedCatalog({ sectorId: 'agroecologia' });
t(merged.length >= 108 + agroEx.length,             'E · merged · base + sector ext combinats');
const mergedNoSector = getMergedCatalog();
eq(mergedNoSector.length, 108,                      'E · merged sense sector · 108');

// 6 · Visibility filter
const seedOnly = getMergedCatalog({ visibilityFilter: 'seed' });
const allSeedFilter = seedOnly.every(r => r.content?.visibility === 'seed');
t(allSeedFilter,                                    'E · visibility filter · només seed');

// 7 · findLearnRoleBySkill
const govRoles = findLearnRoleBySkill('governance-design');
t(govRoles.length >= 1,                             `F · findLearnRoleBySkill · governance-design · ≥1 · ${govRoles.length}`);
eq(findLearnRoleBySkill(null).length, 0,            'F · skill null · 0 resultats');
eq(findLearnRoleBySkill('inventat-skill').length, 0, 'F · skill inexistent · 0 resultats');

// 8 · ensureBaseCatalogSeeded · KB stub idempotent
const kbStore = new Map();
const fakeKB = {
    async getNode(id) { return kbStore.get(id) || null; },
    async upsert(node) { kbStore.set(node.id, node); return node; },
};
const seeded1 = await ensureBaseCatalogSeeded({ kb: fakeKB, ts: 1700000000000 });
eq(seeded1.seeded, 108,                             'G · primera seed · 108 noves');
eq(seeded1.alreadyPresent, 0,                       'G · primera seed · 0 ja presents');
eq(kbStore.size, 108,                               'G · KB conté 108 entrades');
const seeded2 = await ensureBaseCatalogSeeded({ kb: fakeKB, ts: 1700000000000 });
eq(seeded2.seeded, 0,                               'G · segona seed · 0 noves (idempotent)');
eq(seeded2.alreadyPresent, 108,                     'G · segona seed · 108 ja presents');

// 9 · Validacions errors
try {
    addUserContribution({});
    t(false, 'H · add sense title · throws');
} catch (_) { t(true, 'H · add sense title · throws'); }

try {
    editUserContribution('inexistent-id', { title: 'x' });
    t(false, 'H · edit id inexistent · throws');
} catch (_) { t(true, 'H · edit id inexistent · throws'); }

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
