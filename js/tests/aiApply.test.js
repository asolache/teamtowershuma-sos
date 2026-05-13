// IA-CONTEXT-001 sprint C · tests stand-alone per aiApplyService
// Ús: node js/tests/aiApply.test.js

import * as svc from '../core/aiApplyService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== IA-CONTEXT-001 sprint C · aiApplyService ===\n');

// ─── Fixtures ────────────────────────────────────────────────────────────
const baseProject = {
    id: 'proj-test',
    nombre: 'Test',
    sector_id: 'A',
    description: '',
    vna_roles: [
        { id: 'r1', name: 'Existing', castell_level: 'baixos' },
    ],
    vna_transactions: [
        { id: 'tx-existing', from: 'r1', to: 'r2', deliverable: 'x', type: 'tangible' },
    ],
};

// ─── A · applyLanding · LANDING-UNIFY-001 · structured shape ───────────
const landingDraft = {
    description: 'A meaningful description longer than 60 characters that describes the project purpose.',
    heroTag:    'Cooperativa Test',
    heroTitle:  'Projecte Test',
    heroMantra: 'Una frase potent del projecte.',
    bodyMarkdown: '## Què oferim\nUn paràgraf.\n\n## Per qui\nUn altre paràgraf.',
    roleDescriptions: {
        'r1': 'r1 fa això des del punt de vista del client.',
        'r2': 'r2 coordina la resta del sistema.',
    },
    productSuggestions: [
        { title: 'Mentoria 1:1', kind: 'service', oneLiner: 'Sessió individual de 60 min' },
        { title: 'Workshop · Fent Pinya 101', kind: 'workshop', oneLiner: 'Intro al mètode SOS' },
    ],
};
const r1 = svc.applyLanding(landingDraft, baseProject);
t(r1.applied,                                                         'A · landing · applied=true');
t(typeof r1.updates.description === 'string' && r1.updates.description.length > 50, 'A · description omplerta');
t(typeof r1.updates.presentation_narrative_v1 === 'object',           'A · presentation_narrative_v1 · objecte (no string)');
eq(r1.updates.presentation_narrative_v1.heroTitle, 'Projecte Test',   'A · narrative.heroTitle persistit');
eq(r1.updates.presentation_narrative_v1.heroTag,   'Cooperativa Test', 'A · narrative.heroTag persistit');
t(r1.updates.presentation_narrative_v1.heroMantra.length > 0,         'A · narrative.heroMantra persistit');
t(r1.updates.presentation_narrative_v1.bodyMarkdown.includes('Què oferim'), 'A · narrative.bodyMarkdown persistit');
eq(Object.keys(r1.updates.presentation_narrative_v1.roleDescriptions).length, 2, 'A · 2 roleDescriptions persistides');
t(typeof r1.updates.presentation_narrative_v1.generatedAt === 'number', 'A · generatedAt timestamp present');
eq(r1.kbWrites.length, 2,                                             'A · 2 productes generats al kbWrites');
eq(r1.kbWrites[0].type, 'market_item',                                'A · primer kbWrite · type=market_item');
eq(r1.kbWrites[0].content.projectId, 'proj-test',                     'A · kbWrite porta projectId');
eq(r1.kbWrites[0].content.createdBy, 'ai-fill',                       'A · kbWrite createdBy ai-fill');
t(r1.summary.includes('2 productes'),                                 'A · summary menciona productes');

// ─── A2 · applyLanding · retro-compat draft legacy ─────────────────────
//   Si la IA retorna sols `presentationNarrative` (shape antic), s'ha de
//   conservar com a `bodyMarkdown` dins la narrative · zero pèrdua dades.
const legacyDraft = {
    description: 'A meaningful description longer than 60 characters that describes the project purpose.',
    presentationNarrative: '# Hero\n\nLegacy markdown body.',
};
const rLeg = svc.applyLanding(legacyDraft, baseProject);
t(rLeg.applied,                                                       'A2 · legacy draft · applied=true');
t(typeof rLeg.updates.presentation_narrative_v1 === 'object',         'A2 · legacy · narrative és objecte (no string)');
t(rLeg.updates.presentation_narrative_v1.bodyMarkdown.includes('Legacy markdown'), 'A2 · presentationNarrative migrat a bodyMarkdown');

// ─── B · applyLanding · sense draft ─────────────────────────────────────
const rNoOp = svc.applyLanding({}, baseProject);
t(!rNoOp.applied,                                                     'B · landing buit · applied=false');
eq(rNoOp.summary, 'res nou per aplicar',                              'B · summary "res nou per aplicar"');

// ─── C · applyValueMap · afegeix sense duplicar ─────────────────────────
const valueDraft = {
    addRoles: [
        { id: 'r1', name: 'Duplicate' },                              // ja existeix · ignorat
        { id: 'r-new', name: 'Nou role', castell_level: 'tronc', description: 'desc', typical_actor: 'a' },
        { id: 'r-new-2', name: 'Altre', tags: ['t1', 't2'] },
    ],
    addTransactions: [
        { id: 'tx-existing', from: 'r1', to: 'r2', deliverable: 'dup' }, // duplicate
        { id: 'tx-ai-1', from: 'r-new', to: 'r1', deliverable: 'feedback', type: 'intangible' },
    ],
};
const r2 = svc.applyValueMap(valueDraft, baseProject);
t(r2.applied,                                                         'C · valueMap · applied=true');
eq(r2.updates.vna_roles.length, 3,                                    'C · roles · 3 totals (1 existing + 2 new)');
eq(r2.updates.vna_transactions.length, 2,                             'C · transactions · 2 totals (1 existing + 1 new)');
t(r2.updates.vna_roles.some(r => r.id === 'r-new'),                   'C · role r-new present');
t(r2.updates.vna_roles.some(r => r.id === 'r-new-2'),                 'C · role r-new-2 present');
t(!r2.updates.vna_roles.some(r => r.name === 'Duplicate'),            'C · duplicate ignorat (preserva name existing)');
const newTx = r2.updates.vna_transactions.find(t => t.id === 'tx-ai-1');
eq(newTx && newTx.type, 'intangible',                                 'C · nova transaction · type intangible');
t(r2.summary.includes('2 roles'),                                     'C · summary menciona 2 roles');
t(r2.summary.includes('1 transaction'),                               'C · summary menciona 1 transaction');

// ─── D · applyValueMap · sols transactions ──────────────────────────────
const txOnlyDraft = {
    addTransactions: [
        { id: 'tx-only', from: 'r1', to: 'r-x', deliverable: 'd', type: 'tangible' },
    ],
};
const r3 = svc.applyValueMap(txOnlyDraft, baseProject);
t(r3.applied,                                                         'D · sols tx · applied=true');
t(!r3.updates.vna_roles,                                              'D · no updates.vna_roles');
eq(r3.updates.vna_transactions.length, 2,                             'D · vna_transactions actualitzades');

// ─── E · applyDeliverables · reusa applyValueMap ────────────────────────
const delivDraft = {
    addTransactions: [
        { id: 'tx-d1', from: 'r1', to: '@client', deliverable: 'report', type: 'tangible' },
    ],
};
const r4 = svc.applyDeliverables(delivDraft, baseProject);
t(r4.applied,                                                         'E · deliverables · applied=true');
eq(r4.updates.vna_transactions.length, 2,                             'E · transactions afegida');
const newDeliv = r4.updates.vna_transactions.find(t => t.id === 'tx-d1');
eq(newDeliv && newDeliv.to, '@client',                                'E · destí @client preservat');

// ─── F · applySops ──────────────────────────────────────────────────────
const sopsDraft = {
    newSops: [
        { roleId: 'r1', title: 'SOP r1', steps: ['step 1', 'step 2', 'step 3', 'step 4', 'step 5'] },
        { roleId: 'r-x', title: 'SOP r-x', steps: ['a', 'b'] },
        { roleId: '', steps: ['no role'] },                           // invalid · skip
    ],
};
const r5 = svc.applySops(sopsDraft, baseProject);
t(r5.applied,                                                         'F · sops · applied=true');
eq(r5.kbWrites.length, 2,                                             'F · 2 SOPs vàlids (3r invalid)');
eq(r5.kbWrites[0].type, 'sop',                                        'F · sop type');
eq(r5.kbWrites[0].content.projectId, 'proj-test',                     'F · sop projectId');
eq(r5.kbWrites[0].content.roleId, 'r1',                               'F · sop roleId');
t(Array.isArray(r5.kbWrites[0].content.steps) && r5.kbWrites[0].content.steps.length === 5, 'F · sop té 5 steps');
t(r5.kbWrites[0].content.body.startsWith('1. step 1'),                'F · sop body markdown numerat');

// ─── G · applyWorkshops ─────────────────────────────────────────────────
const wsDraft = {
    newWorkshops: [
        { title: 'Intro · founders', audience: 'founders', accessTier: 'public', outline: 'Lec1\nLec2' },
        { title: 'Cohort 0 deep dive', audience: 'cohort', accessTier: 'cohort', cohortNumber: 0, outline: 'X' },
        { title: 'Invalid tier', audience: 'all', accessTier: 'banana' },  // tier invàlid · default public
        { audience: 'no-title' },                                      // sense title · skip
    ],
};
const r6 = svc.applyWorkshops(wsDraft, baseProject);
t(r6.applied,                                                         'G · workshops · applied=true');
eq(r6.kbWrites.length, 3,                                             'G · 3 workshops vàlids (4t sense title)');
eq(r6.kbWrites[2].content.accessTier, 'public',                       'G · tier invàlid → fallback public');
eq(r6.kbWrites[1].content.cohortNumber, 0,                            'G · cohortNumber preservat');

// ─── H · applyDimDraft dispatcher ───────────────────────────────────────
const rDisp = svc.applyDimDraft('landing', landingDraft, baseProject);
eq(rDisp.applied, true,                                               'H · dispatcher · landing ok');
const rUnknown = svc.applyDimDraft('unknown-dim', {}, baseProject);
eq(rUnknown.applied, false,                                           'H · dispatcher · dim invàlid · applied=false');
eq(rUnknown.summary, 'unknown-dim',                                   'H · summary unknown-dim');

// ─── I · commitApply mock store + kb ────────────────────────────────────
const mockDispatched = [];
const mockKbUpserted = [];
const mockStore = {
    getState: () => ({ projects: [baseProject] }),
    dispatch: async (action) => { mockDispatched.push(action); },
};
const mockKb = {
    upsert: async (node) => { mockKbUpserted.push(node); return node; },
};
const rCommit = await svc.commitApply({
    projectId: 'proj-test', dimId: 'landing',
    parsedDraft: landingDraft, store: mockStore, kb: mockKb,
});
t(rCommit.persisted,                                                  'I · commitApply persisted=true');
eq(mockDispatched.length, 1,                                          'I · dispatch cridat 1 cop (UPDATE_PROJECT_INFO)');
eq(mockDispatched[0].type, 'UPDATE_PROJECT_INFO',                     'I · type correct');
eq(mockDispatched[0].payload.projectId, 'proj-test',                  'I · projectId correct');
eq(mockKbUpserted.length, 2,                                          'I · 2 market items KB.upsert');

// commitApply amb projectId invàlid · throw
let threw = null;
try {
    await svc.commitApply({ projectId: 'missing', dimId: 'landing', parsedDraft: {}, store: mockStore, kb: mockKb });
} catch (e) { threw = e; }
t(threw && /project not found/.test(threw.message),                   'I · commitApply project missing · throw');

// commitApply sense store/kb · throw
threw = null;
try { await svc.commitApply({ projectId: 'p', dimId: 'landing', parsedDraft: {} }); } catch (e) { threw = e; }
t(threw && /requires store/.test(threw.message),                      'I · commitApply sense store · throw');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
