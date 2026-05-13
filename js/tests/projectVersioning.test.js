// PROJ-VERSIONING-001 + FOUNDER-001 sprint A · tests stand-alone.
// Ús: node js/tests/projectVersioning.test.js

import * as svc from '../core/publicProjectService.js';
import * as f from '../core/founderTemplate.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== PROJ-VERSIONING-001 + FOUNDER-001 · tests ===\n');

// ─── Fixtures ────────────────────────────────────────────────────────────
const ownerDid = 'did:sos:abc1234567890abcdef';
const ownerJwk = { kty:'EC', crv:'P-256', x:'AAAA', y:'BBBB' };
const project  = {
    id:           'proj-v1-test',
    nombre:       'Test versioned',
    sector_id:    'A',
    description:  'desc',
};

// ─── A · buildPublicProjectEntry · default version=1 ─────────────────────
const entry1 = svc.buildPublicProjectEntry({ project, ownerDid, ownerPublicJwk: ownerJwk });
eq(entry1.content.entryVersion, 1,                                    'A · default entryVersion = 1');
eq(entry1.content.previousTxId, null,                                 'A · v1 · previousTxId null');
t(entry1.keywords.includes('entryVersion:1'),                         'A · keyword entryVersion:1');

// ─── B · v2 sense previousTxId · throw ────────────────────────────────────
let threw = null;
try {
    svc.buildPublicProjectEntry({ project, ownerDid, ownerPublicJwk: ownerJwk, entryVersion: 2 });
} catch (e) { threw = e; }
t(threw && /requires previousTxId/.test(threw.message),               'B · v2 sense previousTxId · throw');

// ─── C · v2 amb previousTxId · OK ────────────────────────────────────────
const entry2 = svc.buildPublicProjectEntry({
    project, ownerDid, ownerPublicJwk: ownerJwk,
    entryVersion: 2, previousTxId: 'TX_V1_FAKE_ABCDEF',
});
eq(entry2.content.entryVersion, 2,                                    'C · v2 · entryVersion 2');
eq(entry2.content.previousTxId, 'TX_V1_FAKE_ABCDEF',                  'C · v2 · previousTxId enllaçat');
t(entry2.keywords.includes('entryVersion:2'),                         'C · v2 · keyword entryVersion:2');
t(entry2.keywords.some(k => k.startsWith('previousTxId:')),           'C · v2 · keyword previousTxId');

// ─── D · entryVersion invàlid · throw ────────────────────────────────────
threw = null;
try { svc.buildPublicProjectEntry({ project, ownerDid, ownerPublicJwk: ownerJwk, entryVersion: 0 }); } catch (e) { threw = e; }
t(threw && /positive integer/.test(threw.message),                    'D · entryVersion 0 · throw');
threw = null;
try { svc.buildPublicProjectEntry({ project, ownerDid, ownerPublicJwk: ownerJwk, entryVersion: 1.5 }); } catch (e) { threw = e; }
t(threw && /positive integer/.test(threw.message),                    'D · entryVersion 1.5 · throw');

// ─── E · arweaveTagsForProjectEntry inclou Version + Previous-TxId ──────
const tags1 = svc.arweaveTagsForProjectEntry(entry1);
const vTag = tags1.find(t => t.name === 'Version');
t(vTag && vTag.value === '0001',                                      'E · v1 · tag Version=0001 (padded)');
t(!tags1.find(t => t.name === 'Previous-TxId'),                       'E · v1 · sense Previous-TxId tag');

const tags2 = svc.arweaveTagsForProjectEntry(entry2);
const vTag2 = tags2.find(t => t.name === 'Version');
const pTag2 = tags2.find(t => t.name === 'Previous-TxId');
t(vTag2 && vTag2.value === '0002',                                    'E · v2 · tag Version=0002');
t(pTag2 && pTag2.value === 'TX_V1_FAKE_ABCDEF',                       'E · v2 · tag Previous-TxId enllaçat');

// ─── F · validateVersionChain · chain íntegre ────────────────────────────
const chainOk = [
    { txId:'TX_V1', entryVersion:1, previousTxId:null },
    { txId:'TX_V2', entryVersion:2, previousTxId:'TX_V1' },
    { txId:'TX_V3', entryVersion:3, previousTxId:'TX_V2' },
];
const okResult = svc.validateVersionChain(chainOk);
t(okResult.valid,                                                     'F · chain íntegre · valid true');
eq(okResult.issues.length, 0,                                         'F · chain íntegre · issues 0');

// ─── G · validateVersionChain · gap detection ────────────────────────────
const chainGap = [
    { txId:'TX_V1', entryVersion:1, previousTxId:null },
    { txId:'TX_V3', entryVersion:3, previousTxId:'TX_V2' },
];
const gapResult = svc.validateVersionChain(chainGap);
t(!gapResult.valid,                                                   'G · chain amb gap · invalid');
t(gapResult.issues.some(i => /gap/.test(i)),                          'G · gap reportat');

// ─── H · validateVersionChain · fork detection ───────────────────────────
const chainFork = [
    { txId:'TX_V1',  entryVersion:1, previousTxId:null },
    { txId:'TX_V2A', entryVersion:2, previousTxId:'TX_V1' },
    { txId:'TX_V2B', entryVersion:2, previousTxId:'TX_V1' },
];
const forkResult = svc.validateVersionChain(chainFork);
t(!forkResult.valid,                                                  'H · chain amb fork · invalid');
t(forkResult.issues.some(i => /fork/.test(i)),                        'H · fork reportat');

// ─── I · validateVersionChain · previousTxId mismatch ────────────────────
const chainMismatch = [
    { txId:'TX_V1', entryVersion:1, previousTxId:null },
    { txId:'TX_V2', entryVersion:2, previousTxId:'WRONG_TX' },
];
const mismatchResult = svc.validateVersionChain(chainMismatch);
t(!mismatchResult.valid,                                              'I · previousTxId wrong · invalid');
t(mismatchResult.issues.some(i => /mismatch/.test(i)),                'I · mismatch reportat');

// ─── J · validateVersionChain · v1 amb previousTxId · invalid ────────────
const chainBadV1 = [
    { txId:'TX_V1', entryVersion:1, previousTxId:'SHOULD_BE_NULL' },
];
const badV1 = svc.validateVersionChain(chainBadV1);
t(!badV1.valid,                                                       'J · v1 amb previousTxId · invalid');
t(badV1.issues.some(i => /v1-has-previousTxId/.test(i)),              'J · v1-has-previousTxId reportat');

// ─── K · getProjectVersionHistory · mock fetch ───────────────────────────
const mockGqlResponse = {
    data: {
        transactions: {
            edges: [
                { node: { id: 'TX_V2', block: { height: 1500001, timestamp: 1700001000 },
                    tags: [
                        { name: 'App-Name', value: 'SOS-V11' },
                        { name: 'Entry-Type', value: 'public-project-entry' },
                        { name: 'ProjectId', value: 'proj-x' },
                        { name: 'Version', value: '0002' },
                        { name: 'Previous-TxId', value: 'TX_V1' },
                        { name: 'OwnerDid', value: 'did:sos:abc' },
                        { name: 'SectorId', value: 'A' },
                    ],
                } },
                { node: { id: 'TX_V1', block: { height: 1500000, timestamp: 1700000000 },
                    tags: [
                        { name: 'App-Name', value: 'SOS-V11' },
                        { name: 'Entry-Type', value: 'public-project-entry' },
                        { name: 'ProjectId', value: 'proj-x' },
                        { name: 'Version', value: '0001' },
                        { name: 'OwnerDid', value: 'did:sos:abc' },
                        { name: 'SectorId', value: 'A' },
                    ],
                } },
            ],
        },
    },
};
const mockFetch = async () => ({ ok: true, json: async () => mockGqlResponse });

const history = await svc.getProjectVersionHistory({ projectId: 'proj-x', fetchFn: mockFetch });
eq(history.length, 2,                                                 'K · history · 2 versions');
eq(history[0].entryVersion, 1,                                        'K · history sorted ASC · v1 first');
eq(history[1].entryVersion, 2,                                        'K · v2 second');
eq(history[0].txId, 'TX_V1',                                          'K · v1 · txId TX_V1');
eq(history[1].previousTxId, 'TX_V1',                                  'K · v2 · previousTxId TX_V1');

const latest = await svc.getLatestProjectVersion({ projectId: 'proj-x', fetchFn: mockFetch });
eq(latest.entryVersion, 2,                                            'K · latest · v2');
eq(latest.txId, 'TX_V2',                                              'K · latest · txId TX_V2');

// ─── L · getProjectVersionHistory · mock fetch fails ─────────────────────
const failFetch = async () => ({ ok: false, status: 500 });
threw = null;
try { await svc.getProjectVersionHistory({ projectId: 'p', fetchFn: failFetch }); } catch (e) { threw = e; }
t(threw && /gql-http-500/.test(threw.message),                        'L · fetch 500 · throw gql-http-500');

// ─── M · FOUNDER-001 · buildFounderProject ───────────────────────────────
const founderResult = f.buildFounderProject({ ts: 1700000000000 });
t(founderResult.project && founderResult.project.id,                  'M · founder · project amb id');
t(founderResult.project.id.startsWith('proj-founder-alvaro-'),        'M · founder · id format correcte');
eq(founderResult.project.vna_roles.length, 9,                         'M · founder · 9 roles');
eq(founderResult.project.vna_transactions.length, 12,                 'M · founder · 12 transactions');
eq(founderResult.sops.length, 5,                                      'M · founder · 5 sops');
eq(founderResult.workshops.length, 3,                                 'M · founder · 3 workshops');
eq(founderResult.project.sector_id, 'A',                              'M · founder · sector A');
eq(founderResult.project.cohortNumber, 0,                             'M · founder · cohort 0');
t(founderResult.project.presentation_narrative_v1 && founderResult.project.presentation_narrative_v1.length > 100, 'M · founder · presentation narrative omplerta');

// ─── N · founder SOPs porten projectId i roleId vinculats ────────────────
const allSopsLinked = founderResult.sops.every(s =>
    s.type === 'sop' && s.content.projectId === founderResult.project.id && s.content.roleId &&
    Array.isArray(s.content.steps) && s.content.steps.length >= 5
);
t(allSopsLinked,                                                      'N · sops · type+projectId+roleId+steps tots OK');

// ─── O · founder workshops · accessTier + audience ───────────────────────
const allWorkshopsTiered = founderResult.workshops.every(w =>
    w.type === 'workshop' && w.content.projectId === founderResult.project.id &&
    w.content.audience && ['public', 'operator', 'matriu', 'cohort'].includes(w.content.accessTier)
);
t(allWorkshopsTiered,                                                 'O · workshops · tier vàlid (public/operator/matriu/cohort)');

// ─── P · founder transactions · ≥1 intangible + cicle recíproc ───────────
const hasIntangible = founderResult.project.vna_transactions.some(t => t.type === 'intangible');
t(hasIntangible,                                                      'P · founder · ≥1 transacció intangible');
// Check cycle · busca un parell A↔B
const edges = new Set();
founderResult.project.vna_transactions.forEach(t => edges.add(t.from + '→' + t.to));
const hasCycle = founderResult.project.vna_transactions.some(t => edges.has(t.to + '→' + t.from));
t(hasCycle,                                                           'P · founder · té cicle recíproc');

// ─── Q · stats coherents ────────────────────────────────────────────────
eq(founderResult.stats.roles,        9,                               'Q · stats.roles 9');
eq(founderResult.stats.transactions, 12,                              'Q · stats.transactions 12');
eq(founderResult.stats.sops,         5,                               'Q · stats.sops 5');
eq(founderResult.stats.workshops,    3,                               'Q · stats.workshops 3');

// ─── R · FOUNDER-001 sprint C · template:'founder' propagated ──────────
// extractPublicFieldsFromProject d'un projecte foundational-network ha de
// portar template='founder' + templateClonable=true
const fields = svc.extractPublicFieldsFromProject(founderResult.project);
eq(fields.template,         'founder',                                'R · founder project · template=founder');
eq(fields.templateClonable, true,                                     'R · founder project · templateClonable=true');
eq(fields.projectType,      'foundational-network',                   'R · founder project · projectType preserved');

// Projecte normal (no foundational) · sense template
const regularProject = { id: 'p-reg', nombre: 'Regular', sector_id: 'A', description: 'desc' };
const fieldsReg = svc.extractPublicFieldsFromProject(regularProject);
t(!fieldsReg.template,                                                'R · regular project · template null');
t(!fieldsReg.templateClonable,                                        'R · regular project · templateClonable false');

// buildPublicProjectEntry inclou keywords template:founder + template-clonable
const founderEntry = svc.buildPublicProjectEntry({
    project:        founderResult.project,
    ownerDid:       'did:sos:fake1234567890abcdef',
    ownerPublicJwk: { kty:'EC', crv:'P-256', x:'AAAA', y:'BBBB' },
});
t(founderEntry.keywords.includes('template:founder'),                 'R · entry keywords · template:founder');
t(founderEntry.keywords.includes('template-clonable'),                'R · entry keywords · template-clonable');
eq(founderEntry.content.template, 'founder',                          'R · entry content · template=founder');

// Regular project · keywords NO porten template
const regEntry = svc.buildPublicProjectEntry({
    project:        regularProject,
    ownerDid:       'did:sos:fake1234567890abcdef',
    ownerPublicJwk: { kty:'EC', crv:'P-256', x:'AAAA', y:'BBBB' },
});
t(!regEntry.keywords.some(k => k.startsWith('template:')),            'R · regular entry · sense template keyword');

// arweaveTagsForProjectEntry afegeix Template tag per founder
const founderTags = svc.arweaveTagsForProjectEntry(founderEntry);
const tplTag = founderTags.find(t => t.name === 'Template');
t(tplTag && tplTag.value === 'founder',                               'R · arweave tags · Template=founder');
const cloneTag = founderTags.find(t => t.name === 'TemplateClonable');
t(cloneTag && cloneTag.value === 'true',                              'R · arweave tags · TemplateClonable=true');

const regTags = svc.arweaveTagsForProjectEntry(regEntry);
t(!regTags.find(t => t.name === 'Template'),                          'R · regular · sense tag Template');

// ─── S · PROJ-VERSIONING-001 sprint D · getLatestVersionCached ──────────
t(typeof svc.getLatestVersionCached === 'function',                   'S · getLatestVersionCached exportat');
t(typeof svc.LATEST_CACHE_TTL_MS === 'number' && svc.LATEST_CACHE_TTL_MS > 0, 'S · LATEST_CACHE_TTL_MS exportat');

// Mock KB · cache hit/miss simulation
function makeMockKb() {
    const m = new Map();
    return { store: m, getNode: async (id) => m.get(id) || null, upsert: async (n) => { m.set(n.id, n); return n; } };
}

// Mock fetch que retorna 2 versions per al projecte
const mockGqlOk = {
    data: {
        transactions: {
            edges: [
                { node: { id: 'TX_V2', block: { height: 2, timestamp: 1700000200 },
                    tags: [
                        { name: 'App-Name', value: 'SOS-V11' },
                        { name: 'Entry-Type', value: 'public-project-entry' },
                        { name: 'ProjectId', value: 'proj-v' },
                        { name: 'Version', value: '0002' },
                        { name: 'Previous-TxId', value: 'TX_V1' },
                    ],
                }},
                { node: { id: 'TX_V1', block: { height: 1, timestamp: 1700000100 },
                    tags: [
                        { name: 'App-Name', value: 'SOS-V11' },
                        { name: 'Entry-Type', value: 'public-project-entry' },
                        { name: 'ProjectId', value: 'proj-v' },
                        { name: 'Version', value: '0001' },
                    ],
                }},
            ],
        },
    },
};
const mockFetchOk = async () => ({ ok: true, json: async () => mockGqlOk });

// 1ª crida · cache miss · fa fetch + cacheja
const kbS = makeMockKb();
const latestS1 = await svc.getLatestVersionCached({ projectId: 'proj-v', fetchFn: mockFetchOk, kb: kbS });
t(latestS1 && latestS1.entryVersion === 2,                            'S · cache miss · fetch + latest v2');
eq(latestS1.txId, 'TX_V2',                                            'S · txId TX_V2');
t(kbS.store.has('project-latest-proj-v'),                             'S · cache persistit al KB');

// 2ª crida · cache hit · NO fa fetch
let fetchCalls = 0;
const countingFetch = async () => { fetchCalls++; return { ok:true, json: async () => mockGqlOk }; };
const latestS2 = await svc.getLatestVersionCached({ projectId: 'proj-v', fetchFn: countingFetch, kb: kbS });
eq(latestS2.entryVersion, 2,                                          'S · cache hit · retorna same data');
eq(fetchCalls, 0,                                                     'S · cache hit · 0 fetch calls');

// force=true · bypassa cache · fa fetch
const latestS3 = await svc.getLatestVersionCached({ projectId: 'proj-v', fetchFn: countingFetch, kb: kbS, force: true });
t(latestS3 && latestS3.entryVersion === 2,                            'S · force=true · refetch');
eq(fetchCalls, 1,                                                     'S · force=true · 1 fetch call');

// Gateway error · retorna null silent
const gwFailFetch = async () => ({ ok: false, status: 500 });
const kbErr = makeMockKb();
const latestErr = await svc.getLatestVersionCached({ projectId: 'proj-z', fetchFn: gwFailFetch, kb: kbErr });
eq(latestErr, null,                                                   'S · gateway fail · null silent (no throw)');
t(!kbErr.store.has('project-latest-proj-z'),                          'S · gateway fail · NO cacheja');

// projectId buit · null
const latestNul = await svc.getLatestVersionCached({});
eq(latestNul, null,                                                   'S · projectId buit · null');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
