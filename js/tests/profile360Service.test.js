// PROFILE-360 · tests del servei profile360Service · 8 zones · privacy · auto-create member
import {
    PROFILE_360_VERSION, PRIVACY_MODES, DEFAULT_PRIVACY,
    buildProfile360, ensureMember, updatePrivacy,
} from '../core/profile360Service.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== PROFILE-360 service ===\n');

// ─── A · constants ──────────────────────────────────────────────────────
eq(PROFILE_360_VERSION, 'v1.0',                          'A · version');
t(PRIVACY_MODES.includes('public'),                      'A · public mode');
t(PRIVACY_MODES.includes('cohort'),                      'A · cohort mode');
t(PRIVACY_MODES.includes('private'),                     'A · private mode');
eq(DEFAULT_PRIVACY.identity, 'public',                   'A · identity default public');
eq(DEFAULT_PRIVACY.wallets,  'private',                  'A · wallets default private');
eq(DEFAULT_PRIVACY.ikigai,   'public',                   'A · ikigai default public');

// ─── B · buildProfile360 · empty ────────────────────────────────────────
const empty = buildProfile360({});
t(typeof empty === 'object',                             'B · retorna objecte');
eq(empty.mode, 'public',                                 'B · mode default public');
eq(empty.handle, null,                                   'B · handle null si no input');
t(empty.zones,                                           'B · zones presents');

// ─── C · ensureMember · sense member existing · auto-create ─────────────
const identity = {
    id: 'identity-alvaro',
    type: 'user_identity',
    content: {
        primaryDid: 'did:sos:abc',
        displayName: 'Àlvaro',
        isPrimary: true,
    },
};
const { member: createdMember, created } = ensureMember({ handle: '@alvaro', identityNode: identity });
t(created,                                               'C · ensureMember crea quan no existeix');
t(createdMember && createdMember.id === 'member-alvaro', 'C · member id correcte');
eq(createdMember.type, 'matriu_member',                  'C · type correcte');
eq(createdMember.content.handle, 'alvaro',               'C · handle normalitzat');
eq(createdMember.content.primaryDid, 'did:sos:abc',      'C · DID copiat de identity');
t(createdMember.content.autoCreatedFromIdentity,         'C · flag autoCreatedFromIdentity');

// Si ja existeix · no crea
const { member: same, created: created2 } = ensureMember({
    handle: '@alvaro', identityNode: identity, existingMember: createdMember,
});
t(!created2,                                             'C · ensureMember no crea si ja existeix');
eq(same.id, createdMember.id,                            'C · retorna existing');

// Sense handle ni identity · retorna null
const { member: noneM } = ensureMember({});
eq(noneM, null,                                          'C · sense input · retorna null');

// ─── D · zone IDENTITY ──────────────────────────────────────────────────
const p1 = buildProfile360({
    handle: '@alvaro', identityNode: identity, member: createdMember, mode: 'me',
});
t(p1.zones.identity,                                     'D · zone identity present');
eq(p1.zones.identity.handle, '@alvaro',                  'D · handle correcte');
eq(p1.zones.identity.did, 'did:sos:abc',                 'D · DID correcte');

// ─── E · zone IKIGAI ────────────────────────────────────────────────────
const memberWithIkigai = {
    ...createdMember,
    content: {
        ...createdMember.content,
        ikigai: {
            dimensions: {
                loves:      { items: ['cooperatives', 'open source'] },
                goodAt:     { items: ['arquitectura', 'docs'] },
                worldNeeds: { items: ['descentralització'] },
                paidFor:    { items: ['consulting'] },
            },
        },
    },
};
const p2 = buildProfile360({ handle: '@alvaro', identityNode: identity, member: memberWithIkigai, mode: 'me' });
t(p2.zones.ikigai.present,                               'E · ikigai detected');
eq(p2.zones.ikigai.filledDims, 4,                        'E · 4 dimensions filled');
eq(p2.zones.ikigai.totalItems, 6,                        'E · 6 items totals');
eq(p2.zones.ikigai.completePct, 100,                     'E · 100% complete');

// Sense ikigai
const p3 = buildProfile360({ handle: '@alvaro', identityNode: identity, member: createdMember, mode: 'me' });
t(!p3.zones.ikigai.present,                              'E · ikigai not present quan member.content.ikigai = null');

// ─── F · zone SKILLS · declarades + roles + attestades ──────────────────
const memberWithSkills = {
    ...createdMember,
    content: { ...createdMember.content, skillsDeclared: ['architect', 'coder'] },
};
const roles = [
    { id: 'r1', content: { createdBy: '@alvaro', primarySkillId: 'reviewer', projectId: 'p1', roleSlug: 'arch', castell_level: 'tronc' } },
    { id: 'r2', content: { createdBy: '@alvaro', primarySkillId: 'qa', projectId: 'p2' } },
];
const attestations = [
    { id: 'a1', content: { fromHandle: '@bob',   toHandle: '@alvaro', skillId: 'architect', kind: 'skill-confirmed' } },
    { id: 'a2', content: { fromHandle: '@carol', toHandle: '@alvaro', skillId: 'coder',     kind: 'skill-confirmed' } },
];
const p4 = buildProfile360({ handle: '@alvaro', identityNode: identity, member: memberWithSkills, roles, attestations, mode: 'me' });
t(p4.zones.skills.skills.length >= 4,                    'F · ≥4 skills agregats');
t(p4.zones.skills.skills.some(s => s.id === 'architect' && s.attested), 'F · architect attestat');
t(p4.zones.skills.skills.some(s => s.id === 'reviewer' && s.source === 'role'), 'F · reviewer des de role');

// ─── G · zone REPUTATION ────────────────────────────────────────────────
const attsMore = [
    ...attestations,
    { id: 'a3', content: { fromHandle: '@alvaro', toHandle: '@bob', kind: 'follow' } },
    { id: 'a4', content: { fromHandle: '@dave',   toHandle: '@alvaro', kind: 'follow' } },
];
const p5 = buildProfile360({ handle: '@alvaro', identityNode: identity, member: memberWithSkills, attestations: attsMore, mode: 'me' });
eq(p5.zones.reputation.attestationsReceived, 3,          'G · 3 rebudes');
eq(p5.zones.reputation.attestationsSent, 1,              'G · 1 enviada');
eq(p5.zones.reputation.followers, 1,                     'G · 1 follower');
eq(p5.zones.reputation.following, 1,                     'G · 1 following');
eq(p5.zones.reputation.uniqueAttesters, 3,               'G · 3 unique attesters (bob+carol+dave)');

// ─── H · zone WORK ──────────────────────────────────────────────────────
const projects = [
    { id: 'p1', name: 'Castellers BCN', creatorHandle: '@alvaro' },
    { id: 'p2', name: 'Tech coop',     creatorHandle: '@other', collaborators: ['@alvaro'] },
];
const wos = [
    { id: 'wo1', content: { assignee: { kind: 'human', id: '@alvaro' }, status: 'in-progress' } },
    { id: 'wo2', content: { assignee: { kind: 'human', id: '@alvaro' }, status: 'done' } },
    { id: 'wo3', content: { assignee: { kind: 'human', id: '@other' }, status: 'in-progress' } },
];
const p6 = buildProfile360({ handle: '@alvaro', identityNode: identity, member: memberWithSkills, projects, roles, wos, mode: 'me' });
eq(p6.zones.work.projects.length, 2,                     'H · 2 projectes');
eq(p6.zones.work.wosInProgress.length, 1,                'H · 1 WO in progress (no other)');
eq(p6.zones.work.wosDone, 1,                             'H · 1 WO done');

// ─── I · zone OFFERINGS · revenue ───────────────────────────────────────
const marketItems = [
    { id: 'm1', content: { sellerHandle: '@alvaro', title: 'SOP consulting' } },
];
const ledger = [
    { content: { toHandle: '@alvaro', amount: 50 } },
    { content: { toHandle: '@alvaro', amount: 30 } },
    { content: { toHandle: '@other',  amount: 100 } },
];
const p7 = buildProfile360({ handle: '@alvaro', identityNode: identity, member: memberWithSkills, marketItems, ledger, mode: 'me' });
eq(p7.zones.offerings.products, 1,                       'I · 1 producte ofert');
eq(p7.zones.offerings.revenueEur, 80,                    'I · revenue 80€ (no compta /@other)');

// ─── J · zone NETWORK · permaweb ────────────────────────────────────────
const registryEntries = [
    { content: { handle: '@alvaro', arweaveTxId: 'MOCK_TX_test' } },
    { content: { handle: '@alvaro', arweaveTxId: 'real-tx-xyz' } },
];
const p8 = buildProfile360({ handle: '@alvaro', identityNode: identity, member: memberWithSkills, registryEntries, mode: 'me' });
eq(p8.zones.network.permawebEntries, 2,                  'J · 2 entries totals');
eq(p8.zones.network.permawebReal, 1,                     'J · 1 real (no mock)');

// ─── K · privacy mode · mode=public filtra zones private ────────────────
const identityPrivate = {
    ...identity,
    content: { ...identity.content, privacy: { ikigai: 'private', wallets: 'private' } },
};
const pub = buildProfile360({ handle: '@alvaro', identityNode: identityPrivate, member: memberWithIkigai, mode: 'public' });
eq(pub.zones.ikigai, null,                               'K · public mode · ikigai private → null');

const me = buildProfile360({ handle: '@alvaro', identityNode: identityPrivate, member: memberWithIkigai, mode: 'me' });
t(me.zones.ikigai && me.zones.ikigai.present,            'K · me mode · ikigai visible tot i ser private');

// ─── L · updatePrivacy · merge net ──────────────────────────────────────
const updated = updatePrivacy(identity, { ikigai: 'private', work: 'cohort' });
eq(updated.content.privacy.ikigai, 'private',            'L · ikigai actualitzat');
eq(updated.content.privacy.work, 'cohort',               'L · work actualitzat');

// Valors invàlids ignorats
const updated2 = updatePrivacy(identity, { ikigai: 'invalid-mode' });
t(updated2.content.privacy.ikigai === undefined || updated2.content.privacy.ikigai === 'public',
                                                         'L · valor invàlid ignorat');

// ─── M · privacy info al output ─────────────────────────────────────────
t(typeof pub.privacy === 'object',                       'M · privacy info exposat');
eq(pub.privacy.ikigai, 'private',                        'M · privacy.ikigai correcte');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
