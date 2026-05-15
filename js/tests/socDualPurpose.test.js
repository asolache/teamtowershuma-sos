// SOC-DUAL-PURPOSE-001 sprint A · tests stand-alone
// Ús · node js/tests/socDualPurpose.test.js

import {
    buildEmptyChecklistItem, buildEmptySoc, validateSoc,
    addChecklistItem, updateChecklistItem, removeChecklistItem, linkSopToItem,
    bumpSocVersion, migrateLegacySoc,
    buildSocOutlinePrompt, buildSopExpandPrompt,
    computeSocStats,
    SOC_TYPE, SOC_STATUS, SOC_VERSION_SCHEMA, CHECKLIST_ITEM_VERIFICATION,
} from '../core/socDualPurposeService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== SOC-DUAL-PURPOSE-001 sprint A · socDualPurposeService ===\n');

// 1 · Constants
eq(SOC_TYPE, 'soc',                                  'A · type constant');
eq(SOC_VERSION_SCHEMA, 'v2.0',                       'A · schema v2.0');
t(SOC_STATUS.includes('approved'),                   'A · status includes approved');
t(CHECKLIST_ITEM_VERIFICATION.includes('manual'),    'A · verification includes manual');
t(CHECKLIST_ITEM_VERIFICATION.includes('auto-test'), 'A · verification includes auto-test');

// 2 · buildEmptySoc · happy path
const soc1 = buildEmptySoc({
    slug: 'onboarding-cohort',
    purpose: 'Acompanyar nous cohort members les primeres 10 setmanes',
    author: '@alvaro',
    ts: 1700000000000,
});
eq(soc1.type, SOC_TYPE,                              'B · type set');
eq(soc1.slug, 'onboarding-cohort',                   'B · slug set');
eq(soc1.id, 'soc-onboarding-cohort',                 'B · id derived from slug');
eq(soc1.status, 'draft',                             'B · default status draft');
eq(soc1.checklist.length, 0,                         'B · checklist empty by default');
eq(soc1.schemaVersion, 'v2.0',                       'B · schemaVersion v2.0');

// 3 · buildEmptySoc · errors
try { buildEmptySoc({}); t(false, 'B · sense slug · throws'); }
catch (_) { t(true, 'B · sense slug · throws'); }
try { buildEmptySoc({ slug: 'x' }); t(false, 'B · sense purpose · throws'); }
catch (_) { t(true, 'B · sense purpose · throws'); }

// 4 · validateSoc
eq(validateSoc(soc1).ok, true,                       'C · soc1 vàlid');
eq(validateSoc(null).ok, false,                      'C · null fail');
eq(validateSoc({ ...soc1, status: 'inventat' }).ok, false, 'C · status invàlid fail');

// 5 · buildEmptyChecklistItem
const ci = buildEmptyChecklistItem({ id: 'ci-01', label: 'Test item' });
eq(ci.id, 'ci-01',                                   'D · ci id');
eq(ci.required, true,                                'D · default required');
eq(ci.verification_kind, 'manual',                   'D · default verification manual');

try { buildEmptyChecklistItem({ id: 'x', label: 'y', verification_kind: 'inventat' }); t(false, 'D · verification inventat · throws'); }
catch (_) { t(true, 'D · verification inventat · throws'); }

// 6 · addChecklistItem
const soc2 = addChecklistItem(soc1, { label: 'Setmana 1 · DID + perfil signat', verification_kind: 'attestation' });
eq(soc2.checklist.length, 1,                         'E · 1 item afegit');
eq(soc2.checklist[0].id, 'ci-01',                    'E · auto-id ci-01');
eq(soc2.checklist[0].verification_kind, 'attestation', 'E · verification kind preservat');

const soc3 = addChecklistItem(soc2, { label: 'Setmana 2 · pact signat', sop_ref: 'sop-pact' });
eq(soc3.checklist.length, 2,                         'E · 2 items');
eq(soc3.checklist[1].id, 'ci-02',                    'E · auto-id ci-02');
eq(soc3.checklist[1].sop_ref, 'sop-pact',            'E · sop_ref set');

// 7 · Duplicate id
try { addChecklistItem(soc3, { id: 'ci-01', label: 'dup' }); t(false, 'E · duplicate · throws'); }
catch (_) { t(true, 'E · duplicate id · throws'); }

// 8 · updateChecklistItem
const soc4 = updateChecklistItem(soc3, 'ci-01', { required: false, label: 'Setmana 1 · perfil (opt)' });
eq(soc4.checklist[0].required, false,                'F · required false');
eq(soc4.checklist[0].label, 'Setmana 1 · perfil (opt)', 'F · label updated');

try { updateChecklistItem(soc4, 'ci-99', { label: 'x' }); t(false, 'F · update id inexistent · throws'); }
catch (_) { t(true, 'F · update id inexistent · throws'); }

// 9 · linkSopToItem
const soc5 = linkSopToItem(soc4, 'ci-01', 'sop-onboard-week-1');
eq(soc5.checklist[0].sop_ref, 'sop-onboard-week-1',  'F · sop linked');

// 10 · removeChecklistItem
const soc6 = removeChecklistItem(soc5, 'ci-01');
eq(soc6.checklist.length, 1,                         'F · post-remove · 1 item');

// 11 · bumpSocVersion
const soc7 = bumpSocVersion(soc5, { newPurpose: 'Acompanyar 12 setmanes (no 10)' });
eq(soc7.version, 'v2',                               'G · version v2');
eq(soc7.parentVersion, 'v1',                         'G · parentVersion v1');
eq(soc7.purpose, 'Acompanyar 12 setmanes (no 10)',   'G · new purpose');
eq(soc7.status, 'draft',                             'G · status reset draft');
t(soc7.id !== soc5.id,                               'G · id canviat');

// 12 · migrateLegacySoc
const legacy = {
    id: 'soc-old',
    type: 'soc',
    slug: 'old',
    purpose: 'old purpose',
    related_socs: ['soc-other'],
    related_sops: ['sop-x', 'sop-y'],
    status: 'approved',
};
const migrated = migrateLegacySoc(legacy);
eq(migrated.schemaVersion, 'v2.0',                   'H · schemaVersion v2.0');
t(Array.isArray(migrated.checklist),                 'H · checklist array');
eq(migrated.checklist.length, 0,                     'H · checklist empty');
eq(migrated.versionedSops.length, 2,                 'H · versionedSops migrats');
eq(migrated.relatedSocs.length, 1,                   'H · relatedSocs migrats');

// Idempotent
const migrated2 = migrateLegacySoc(migrated);
eq(migrated2, migrated,                              'H · migration idempotent');

// 13 · buildSocOutlinePrompt
const prompt = buildSocOutlinePrompt({
    socPurpose: 'Process vendes B2B SaaS',
    sectorContext: 'tech-coop',
});
t(prompt.includes('SOC PROPÒSIT') || prompt.includes('PROPÒSIT'), 'I · prompt menciona propòsit');
t(prompt.includes('JSON'),                           'I · prompt demana JSON');
t(prompt.includes('tech-coop'),                      'I · prompt inclou sector');

// 14 · buildSopExpandPrompt
const sopPrompt = buildSopExpandPrompt({
    socPurpose: 'Process X',
    checklistItemLabel: 'Item Y · verificar Z',
});
t(sopPrompt.includes('Item Y'),                      'I · sop prompt inclou item');
t(sopPrompt.includes('steps'),                       'I · sop prompt demana steps');

// 15 · computeSocStats
const richSoc = addChecklistItem(
    addChecklistItem(soc1, { label: 'A', required: true, verification_kind: 'manual' }),
    { label: 'B', required: false, verification_kind: 'auto-test', sop_ref: 'sop-b' }
);
const stats = computeSocStats(richSoc);
eq(stats.itemCount, 2,                               'J · stats itemCount');
eq(stats.requiredCount, 1,                           'J · 1 required');
eq(stats.optionalCount, 1,                           'J · 1 optional');
eq(stats.linkedCount, 1,                             'J · 1 linked');
eq(stats.unlinkedCount, 1,                           'J · 1 unlinked');
t(stats.verificationBreakdown.manual === 1,          'J · 1 manual');
t(stats.verificationBreakdown['auto-test'] === 1,    'J · 1 auto-test');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
