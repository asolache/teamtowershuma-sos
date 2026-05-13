// PUBLISH-SELECT-001 sprint A · tests stand-alone per publicEntityService.
// Ús: node js/tests/publicEntity.test.js

import * as svc from '../core/publicEntityService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== PUBLISH-SELECT-001 sprint A · publicEntityService ===\n');

// ─── A · constants exportades ───────────────────────────────────────────
eq(svc.PUBLIC_WORK_ORDER_TYPE,  'public_work_order_entry',  'A · WORK_ORDER_TYPE');
eq(svc.PUBLIC_MARKET_ITEM_TYPE, 'public_market_item_entry', 'A · MARKET_ITEM_TYPE');
eq(svc.PUBLIC_WORKSHOP_TYPE,    'public_workshop_entry',    'A · WORKSHOP_TYPE');
t(typeof svc.ENTITY_PUBLISH_PRICING === 'object',           'A · pricing exportat');
eq(svc.ENTITY_PUBLISH_PRICING.work_order, 0.02,             'A · WO base price 0.02');
eq(svc.ENTITY_PUBLISH_PRICING.market_item, 0.03,            'A · Market base price 0.03');
eq(svc.ENTITY_PUBLISH_PRICING.workshop,    0.04,            'A · Workshop base price 0.04');
eq(svc.ENTITY_PUBLISH_PRICING.project,     0.05,            'A · Project base price 0.05');

// ─── B · computePublishCost ─────────────────────────────────────────────
const cFree = svc.computePublishCost({ kind: 'work_order', planId: 'free' });
eq(cFree.baseEur, 0.02,                                     'B · free WO base 0.02');
eq(cFree.totalEur, 0.03,                                    'B · free WO total 0.02 × 1.5 = 0.03');
eq(cFree.feeEur,  0.01,                                     'B · free WO fee 0.01');
t(cFree.isFree,                                             'B · free flag');

const cPro = svc.computePublishCost({ kind: 'workshop', planId: 'pro' });
eq(cPro.baseEur,  0.04,                                     'B · pro Workshop base 0.04');
eq(cPro.totalEur, 0.04,                                     'B · pro Workshop total = base · sense fee');
eq(cPro.feeEur,   0,                                        'B · pro fee 0');
t(!cPro.isFree,                                             'B · pro NO free');

let threw = null;
try { svc.computePublishCost({ kind: 'unknown' }); } catch (e) { threw = e; }
t(threw && /unknown kind/.test(threw.message),              'B · kind invàlid · throw');

// ─── C · computeBatchPublishCost · suma per batch ───────────────────────
const batch = svc.computeBatchPublishCost({
    items: [
        { kind: 'project',     count: 1 },
        { kind: 'work_order',  count: 3 },
        { kind: 'market_item', count: 2 },
        { kind: 'workshop',    count: 1 },
    ],
    planId: 'pro',
});
// project 0.05 + WO 3×0.02=0.06 + Market 2×0.03=0.06 + Workshop 0.04 = 0.21
eq(batch.totalEur,  0.21,                                   'C · pro batch total 0.21');
eq(batch.feeEur,    0,                                      'C · pro batch fee 0');
eq(batch.breakdown.length, 4,                               'C · breakdown 4 entries');

const batchFree = svc.computeBatchPublishCost({
    items: [{ kind: 'project', count: 1 }, { kind: 'work_order', count: 2 }],
    planId: 'free',
});
// free · project 0.05×1.5=0.075 + WO 2×0.03=0.06 = 0.135
eq(batchFree.totalEur, 0.135,                               'C · free batch total 0.135');
t(batchFree.feeEur > 0,                                     'C · free batch té fee');

// ─── D · publicEntityIdFor ─────────────────────────────────────────────
eq(svc.publicEntityIdFor('work_order', 'wo-abc-123'), 'public-work-order-wo-abc-123', 'D · WO id');
eq(svc.publicEntityIdFor('market_item', 'mkt-xyz'),   'public-market-item-mkt-xyz',   'D · Market id');
eq(svc.publicEntityIdFor('workshop',    'ws-001'),    'public-workshop-ws-001',       'D · Workshop id');
threw = null;
try { svc.publicEntityIdFor(null, 'x'); } catch (e) { threw = e; }
t(threw,                                                    'D · sense kind · throw');

// ─── E · extractPublicFieldsFromEntity ─────────────────────────────────
const woEntity = {
    id: 'wo-1', type: 'work_order', projectId: 'p-1',
    content: {
        title: 'Setup CI', description: 'Set up GitHub Actions',
        status: 'backlog', priority: 'high',
        estimatedHours: 4, fmvPerHour: 50,
        lookingForSkills: ['devops'],
        sopRef: 'sop-x', tags: ['ci'],
        // Privates · NO han de sortir
        secretKey: 'shouldnotappear', wallet: { balanceEur: 100 },
    },
};
const woFields = svc.extractPublicFieldsFromEntity({ kind: 'work_order', entity: woEntity });
eq(woFields.workOrderId, 'wo-1',                            'E · WO · id assignat a workOrderId');
eq(woFields.projectId,   'p-1',                             'E · WO · projectId propagat');
eq(woFields.title,       'Setup CI',                        'E · WO · title preservat');
eq(woFields.status,      'backlog',                         'E · WO · status preservat');
t(!('secretKey' in woFields),                               'E · WO · secretKey filtrat');
t(!('wallet' in woFields),                                  'E · WO · wallet filtrat');
t(Array.isArray(woFields.lookingForSkills),                 'E · WO · lookingForSkills preservat');

// Market item
const mktEntity = {
    id: 'mkt-1', type: 'market_item', projectId: 'p-1',
    content: {
        title: 'Mentoring', kind: 'service', priceEur: 25,
        deliverables: ['Sessió 60 min'], visibility: 'public',
        // Private
        ledger: [{ amount: 100 }],
    },
};
const mktFields = svc.extractPublicFieldsFromEntity({ kind: 'market_item', entity: mktEntity });
eq(mktFields.itemId,   'mkt-1',                             'E · Market · id assignat a itemId');
eq(mktFields.priceEur, 25,                                  'E · Market · priceEur preservat');
t(!('ledger' in mktFields),                                 'E · Market · ledger filtrat');

// Workshop
const wsEntity = {
    id: 'ws-1', type: 'workshop', projectId: 'p-1',
    content: {
        title: 'Fent Pinya 101', type: 'fent-pinya',
        accessTier: 'public', priceEur: 5, audienceSize: 20,
    },
};
const wsFields = svc.extractPublicFieldsFromEntity({ kind: 'workshop', entity: wsEntity });
eq(wsFields.workshopId, 'ws-1',                             'E · Workshop · id assignat a workshopId');
eq(wsFields.accessTier, 'public',                           'E · Workshop · accessTier preservat');

// ─── F · buildPublicEntityEntry · cas WO complet ───────────────────────
const ownerDid = 'did:sos:abcdef0123456789abcdef0123456789';
const ownerJwk = { kty: 'EC', crv: 'P-256', x: 'X', y: 'Y', d: 'PRIVATE_NEVER_PUBLISHED' };
const woNode = svc.buildPublicEntityEntry({
    kind: 'work_order',
    entity: woEntity,
    project: { id: 'p-1' },
    ownerDid,
    ownerPublicJwk: ownerJwk,
});
eq(woNode.type, 'public_work_order_entry',                  'F · WO · type correcte');
eq(woNode.id,   'public-work-order-wo-1',                   'F · WO · id derivat');
eq(woNode.projectId, 'p-1',                                 'F · WO · projectId top-level');
eq(woNode.content.workOrderId, 'wo-1',                      'F · WO · workOrderId al content');
eq(woNode.content.ownerDid,    ownerDid,                    'F · WO · ownerDid al content');
t(!('d' in woNode.content.publicJwk),                       'F · WO · privateJwk d strippat');
t(!('secretKey' in woNode.content),                         'F · WO · secretKey NO al content');
eq(woNode.content.signature, null,                          'F · WO · signature null inicialment');
eq(woNode.content.arweaveTxId, null,                        'F · WO · txId null inicialment');
t(woNode.keywords.includes('type:public_work_order_entry'), 'F · WO · keywords type');
t(woNode.keywords.includes('projectId:p-1'),                'F · WO · keywords projectId');
t(woNode.keywords.includes('status:backlog'),               'F · WO · keywords status');
t(woNode.keywords.includes('looking-skill:devops'),         'F · WO · keywords looking-skill');

// ─── G · validatePublicEntityEntry ─────────────────────────────────────
const v1 = svc.validatePublicEntityEntry(woNode, 'work_order');
t(v1.valid,                                                 'G · WO node vàlid');

// Forçar invalidesa · type incorrecte
const bad1 = { ...woNode, type: 'wrong_type' };
const v2 = svc.validatePublicEntityEntry(bad1, 'work_order');
t(!v2.valid && v2.errors.some(e => /type must be/.test(e)), 'G · type incorrecte detectat');

// Forçar invalidesa · ownerDid sense did:sos:
const bad2 = JSON.parse(JSON.stringify(woNode));
bad2.content.ownerDid = 'random-string';
const v3 = svc.validatePublicEntityEntry(bad2, 'work_order');
t(!v3.valid && v3.errors.some(e => /did:sos/.test(e)),      'G · ownerDid invàlid detectat');

// Forçar invalidesa · privateJwk leak
const bad3 = JSON.parse(JSON.stringify(woNode));
bad3.content.publicJwk.d = 'LEAK';
const v4 = svc.validatePublicEntityEntry(bad3, 'work_order');
t(!v4.valid && v4.errors.some(e => /MUST NOT contain "d"/.test(e)), 'G · privateJwk leak detectat');

// Forçar invalidesa · forbidden key (wallet) injectat
const bad4 = JSON.parse(JSON.stringify(woNode));
bad4.content.wallet = { balanceEur: 999 };
const v5 = svc.validatePublicEntityEntry(bad4, 'work_order');
t(!v5.valid && v5.errors.some(e => /wallet/.test(e)),       'G · forbidden key wallet detectat');

// ─── H · canonicalizeEntityEntry · stable hash ─────────────────────────
const canon = svc.canonicalizeEntityEntry(woNode);
t(typeof canon === 'string' && canon.startsWith('{'),       'H · canonical retorna string JSON');
t(!canon.includes('"signature"'),                           'H · canonical exclou signature');
t(!canon.includes('"arweaveTxId"'),                         'H · canonical exclou arweaveTxId');

// Idempotència · 2 builds amb mateix input · canonical igual (modulo timestamps)
const woNode2 = svc.buildPublicEntityEntry({
    kind: 'work_order',
    entity: woEntity,
    project: { id: 'p-1' },
    ownerDid,
    ownerPublicJwk: ownerJwk,
});
// Substituïm publishedAt · createdAt · updatedAt per a comparar
woNode2.content.publishedAt = woNode.content.publishedAt;
woNode2.createdAt = woNode.createdAt;
woNode2.updatedAt = woNode.updatedAt;
eq(svc.canonicalizeEntityEntry(woNode2), svc.canonicalizeEntityEntry(woNode), 'H · canonical idempotent');

// ─── I · arweaveTagsForEntityEntry ─────────────────────────────────────
const tags = svc.arweaveTagsForEntityEntry(woNode, 'work_order');
t(Array.isArray(tags) && tags.length >= 6,                  'I · tags array');
t(tags.some(t => t.name === 'App-Name' && t.value === 'SOS-V11'), 'I · App-Name tag');
t(tags.some(t => t.name === 'Entry-Type' && t.value === 'public_work_order_entry'), 'I · Entry-Type tag');
t(tags.some(t => t.name === 'Entity-Kind' && t.value === 'work_order'), 'I · Entity-Kind tag');
t(tags.some(t => t.name === 'OwnerDid' && t.value === ownerDid), 'I · OwnerDid tag');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
