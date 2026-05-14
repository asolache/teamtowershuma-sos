// =============================================================================
// profile.test.js · PROFILE sprint A · pure aggregation tests
// =============================================================================

import {
    normalizeHandle, matchesHandle, findMember,
    buildPublicProfile, computeProfileBadges,
    shareUrlForProfile, listKnownHandles,
} from '../core/profileService.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

// ─── Fixtures ─────────────────────────────────────────────────────────────
const member = {
    id: 'mem-1', type: 'matriu_member',
    content: {
        kind: 'matriu-member',
        displayName: 'Alvaro Test',
        handle: '@alvaro',
        bio: 'Founder anchor · cohort 0',
        avatar: 'https://example.com/a.png',
        primaryDid: 'did:sos:alvaro-x',
        cohortNumber: 0,
        availability: 'normal',
        status: 'active',
        skillsDeclared: ['vision-strategic', 'slicing-pie'],
        sectorsExperience: ['A', 'B'],
    },
};
const memberNoSkills = {
    id: 'mem-2', type: 'matriu_member',
    content: { displayName: 'Bob', handle: '@bob', primaryDid: 'did:sos:bob', cohortNumber: 1 },
};

// ─── A · normalizeHandle + matchesHandle ─────────────────────────────────
eq(normalizeHandle('@Alvaro'), 'alvaro',                          'A · @ + case stripped');
eq(normalizeHandle('  alvaro  '), 'alvaro',                       'A · trim');
eq(normalizeHandle(null), '',                                     'A · null safe');
eq(normalizeHandle(123), '',                                      'A · non-string safe');

t(matchesHandle('@alvaro', 'ALVARO'),                             'A · matches case-insensitive');
t(matchesHandle('@x', '@x'),                                      'A · same');
t(!matchesHandle('@a', '@b'),                                     'A · different');
t(!matchesHandle('', ''),                                         'A · empty no match');

// ─── B · findMember ───────────────────────────────────────────────────────
const found = findMember([member, memberNoSkills], '@alvaro');
t(found && found.id === 'mem-1',                                  'B · trobat per handle');
t(findMember([member], 'unknown') === null,                       'B · no trobat → null');
t(findMember([], 'alvaro') === null,                              'B · empty safe');

// ─── C · buildPublicProfile · happy path ──────────────────────────────────
const profile = buildPublicProfile({ handle: '@alvaro', members: [member] });
eq(profile.handle, 'alvaro',                                      'C · handle normalitzat');
eq(profile.displayName, 'Alvaro Test',                            'C · displayName');
eq(profile.bio, 'Founder anchor · cohort 0',                      'C · bio');
eq(profile.avatar, 'https://example.com/a.png',                   'C · avatar');
eq(profile.did, 'did:sos:alvaro-x',                               'C · did');
eq(profile.cohortNumber, 0,                                       'C · cohortNumber');
eq(profile.exists, true,                                          'C · member exists');
eq(profile.memberNodeId, 'mem-1',                                 'C · memberNodeId');
// Skills declarats · 2
eq(profile.skills.length, 2,                                      'C · 2 skills declarats');
const skillIds = profile.skills.map(s => s.id);
t(skillIds.includes('vision-strategic'),                          'C · vision-strategic');
t(skillIds.includes('slicing-pie'),                               'C · slicing-pie');
// Source 'declared'
t(profile.skills.every(s => s.source === 'declared'),             'C · source declared');
// Sectors
eq(profile.sectorsExperience.length, 2,                           'C · 2 sectors');

// Handle desconegut · exists false
const ghost = buildPublicProfile({ handle: '@ghost', members: [member] });
eq(ghost.exists, false,                                           'C · handle inexistent · exists false');
eq(ghost.handle, 'ghost',                                         'C · handle preservat malgrat no exist');
eq(ghost.displayName, '@ghost',                                   'C · displayName fallback');

// ─── D · projects · creatorHandle match ──────────────────────────────────
const projects = [
    { id: 'p1', nombre: 'Proj 1', creatorHandle: '@alvaro', sector_id: 'A', cohortNumber: 0 },
    { id: 'p2', nombre: 'Proj 2', creatorHandle: '@bob' },
    { id: 'p3', name: 'Proj 3', creatorHandle: 'ALVARO' },   // case-insensitive
];
const pProf = buildPublicProfile({ handle: '@alvaro', members: [member], projects });
eq(pProf.projects.length, 2,                                      'D · 2 projects (case insensitive)');
eq(pProf.projects[0].role, 'creator',                             'D · role creator');
t(pProf.projects.some(p => p.id === 'p1'),                        'D · p1 inclós');
t(pProf.projects.some(p => p.id === 'p3'),                        'D · p3 case-insensitive');

// ─── E · roles + skills derived ───────────────────────────────────────────
const roles = [
    { id: 'r1', content: { createdBy: '@alvaro', primarySkillId: 'governance-design', label: 'Arch', projectId: 'p1' } },
    { id: 'r2', content: { createdBy: '@bob',    primarySkillId: 'triple-entry-accounting' } },
    { id: 'r3', content: { creatorHandle: '@alvaro', primarySkillId: 'vision-strategic', label: 'V' } },   // ja a declared · no duplica
];
const rProf = buildPublicProfile({ handle: '@alvaro', members: [member], roles });
eq(rProf.roles.length, 2,                                         'E · 2 roles assignats');
// Skills · declared (2) + role-derived nous (1 governance · vision-strategic ja existeix) = 3
eq(rProf.skills.length, 3,                                        'E · 3 skills (2 declared + 1 derived)');
const govSkill = rProf.skills.find(s => s.id === 'governance-design');
t(govSkill && govSkill.source === 'role',                         'E · governance-design source=role');

// Ordering · master tier first
const masterCount = rProf.skills.filter(s => s.tier === 'master').length;
const idx = rProf.skills.findIndex(s => s.tier !== 'master');
t(masterCount === 0 || idx === -1 || idx >= masterCount,          'E · masters primer');

// ─── F · attestations received + sent + trust score ──────────────────────
const attReceived = [
    { id: 'a1', type: 'attestation', content: { attesterDid: 'did:sos:x', attesterHandle: '@x', attestedDid: 'did:sos:alvaro-x', attestationKind: 'cohort-member' } },
    { id: 'a2', type: 'attestation', content: { attesterDid: 'did:sos:y', attesterHandle: '@y', attestedHandle: 'alvaro', attestationKind: 'endorses-founder' } },
];
const attSent = [
    { id: 'a3', type: 'attestation', content: { attesterDid: 'did:sos:alvaro-x', attesterHandle: '@alvaro', attestedDid: 'did:sos:other', attestationKind: 'cohort-member' } },
    { id: 'a4', type: 'attestation', content: { attesterDid: 'did:sos:alvaro-x', attesterHandle: '@alvaro', attestedDid: 'did:sos:other2', attestationKind: 'operator' } },
];
const attProf = buildPublicProfile({
    handle: '@alvaro', members: [member],
    attestations: [...attReceived, ...attSent],
});
eq(attProf.attestationsReceived.length, 2,                        'F · 2 attestations rebudes');
eq(attProf.attestationsSent.length, 2,                            'F · 2 emeses');
t(attProf.trustScore.total > 0,                                   'F · trust score positiu');
t(attProf.trustScore.uniqueAttesters === 2,                       'F · 2 attesters únics');

// Sense attestations · trust score 0
const noAtt = buildPublicProfile({ handle: '@alvaro', members: [member] });
eq(noAtt.trustScore.total, 0,                                     'F · sense att · trust 0');

// ─── G · offerings (market_item + workshop + sop sellable) ───────────────
const marketItems = [
    { id: 'm1', type: 'market_item', content: { title: 'Producte X', kind: 'product', providerHandle: '@alvaro', priceEur: 100 } },
    { id: 'm2', type: 'market_item', content: { title: 'Other', kind: 'service', providerHandle: '@bob', priceEur: 200 } },
];
const workshops = [
    { id: 'w1', type: 'workshop', content: { title: 'Ws 1', createdBy: '@alvaro', accessTier: 'public', audience: 'pro' } },
];
const sops = [
    { id: 's1', type: 'sop', content: { title: 'Sop Sellable', createdBy: '@alvaro', marketSellable: true, steps: ['step'] }, keywords: ['market-sellable'] },
    { id: 's2', type: 'sop', content: { title: 'Sop NoSell', createdBy: '@alvaro', steps: ['step'] }, keywords: [] },   // no sellable
];
const oProf = buildPublicProfile({
    handle: '@alvaro', members: [member], marketItems, workshops, sops,
});
eq(oProf.offerings.length, 3,                                     'G · 3 offerings (1 item + 1 ws + 1 sop · s2 exclòs)');
t(oProf.offerings.some(o => o.id === 'm1'),                       'G · market item inclós');
t(oProf.offerings.some(o => o.id === 'w1'),                       'G · workshop inclós');
t(oProf.offerings.some(o => o.id === 's1'),                       'G · sop sellable inclós');
t(!oProf.offerings.some(o => o.id === 's2'),                      'G · sop no-sellable exclòs');

// includeOfferings: false
const noOff = buildPublicProfile({ handle: '@alvaro', members: [member], marketItems, includeOfferings: false });
eq(noOff.offerings.length, 0,                                     'G · includeOfferings=false · []');

// ─── H · stats summary ────────────────────────────────────────────────────
const fullProf = buildPublicProfile({
    handle: '@alvaro', members: [member],
    projects, roles, attestations: [...attReceived, ...attSent],
    marketItems, workshops, sops,
});
eq(fullProf.stats.projects, 2,                                    'H · stats.projects 2');
eq(fullProf.stats.roles, 2,                                       'H · stats.roles 2');
eq(fullProf.stats.attestationsReceived, 2,                        'H · attReceived');
eq(fullProf.stats.attestationsSent, 2,                            'H · attSent');
eq(fullProf.stats.offerings, 3,                                   'H · offerings 3');
t(fullProf.stats.skills >= 3,                                     'H · skills >=3');

// ─── I · computeProfileBadges ────────────────────────────────────────────
const badges = computeProfileBadges(fullProf);
t(badges.some(b => b.id === 'cohort-0'),                          'I · cohort-0 badge');
// Skills declared inclou vision-strategic (master) i slicing-pie (master)
t(badges.some(b => b.id.startsWith('master-')),                   'I · master badge');
t(badges.some(b => b.id === 'founder' || b.id === 'multi-project'), 'I · founder/multi badge');
t(badges.some(b => b.id === 'provider'),                          'I · provider badge (3 offerings)');

// Trusted · necessita ≥5 score
const trustedProf = { ...fullProf, trustScore: { total: 6, uniqueAttesters: 3 } };
t(computeProfileBadges(trustedProf).some(b => b.id === 'trusted'), 'I · trusted badge si score≥5');
t(!computeProfileBadges({ ...fullProf, trustScore: { total: 2 } }).some(b => b.id === 'trusted'), 'I · sense trusted si <5');

// Profile null
eq(computeProfileBadges(null).length, 0,                          'I · null profile · []');

// ─── J · shareUrlForProfile ──────────────────────────────────────────────
const url = shareUrlForProfile(profile, { absoluteUrl: 'https://sos.example.com' });
eq(url, 'https://sos.example.com/u/alvaro',                       'J · share URL');
eq(shareUrlForProfile(null), null,                                'J · null safe');

// ─── K · listKnownHandles ────────────────────────────────────────────────
const handles = listKnownHandles({
    members:  [member, memberNoSkills],
    projects: [{ creatorHandle: '@charlie' }],
    attestations: [{ content: { attesterHandle: '@dave', attestedHandle: '@eve' } }],
});
t(handles.includes('alvaro'),                                     'K · alvaro');
t(handles.includes('bob'),                                        'K · bob');
t(handles.includes('charlie'),                                    'K · charlie');
t(handles.includes('dave'),                                       'K · dave');
t(handles.includes('eve'),                                        'K · eve');
eq(handles.length, 5,                                             'K · 5 unique handles');

// Empty safe
eq(listKnownHandles({}).length, 0,                                'K · empty safe');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
