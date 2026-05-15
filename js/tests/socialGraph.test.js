// SOCIAL-LAYER-001 · socialGraphService tests
import {
    buildFollowGraph, followCounts, listFollowers, listFollowing,
    isMutual, isFollowing, buildFollowAttestation,
    computeTopFollowed, computeNetworkStats,
    FOLLOW_KIND,
} from '../core/socialGraphService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== SOCIAL-LAYER-001 · socialGraphService ===\n');

// Helper · build follow attestation simple per a tests
function fa(from, to, ts = Date.now()) {
    return {
        id: 'att-' + from + '-' + to + '-' + ts,
        type: 'attestation',
        createdAt: ts,
        content: { kind: FOLLOW_KIND, attesterHandle: from, targetHandle: to },
    };
}

// 1 · buildFollowGraph · empty
const empty = buildFollowGraph([]);
eq(empty.edges.length, 0,                                'A · empty · 0 edges');
eq(empty.byFollower.size, 0,                             'A · empty · byFollower empty');

// 2 · skip non-follow attestations
const noFollow = buildFollowGraph([
    { id: 'a', type: 'attestation', content: { kind: 'trust' } },
    { id: 'b', type: 'attestation', content: { kind: 'witness' } },
]);
eq(noFollow.edges.length, 0,                             'A · ignore non-follow kinds');

// 3 · happy path · 3 follows
const atts = [
    fa('@alvaro', '@maria', 1000),
    fa('@alvaro', '@bob',   2000),
    fa('@maria',  '@alvaro', 3000),  // mutual amb alvaro
    fa('@bob',    '@maria',  4000),
];
const g = buildFollowGraph(atts);
eq(g.edges.length, 4,                                    'B · 4 edges');
eq(g.byFollower.get('@alvaro').size, 2,                  'B · alvaro segueix 2 (@maria + @bob)');
eq(g.byFollowing.get('@maria').size, 2,                  'B · maria seguida per 2 (@alvaro + @bob)');

// 4 · auto-normalize handle (sense @ prefix)
const atsNoPrefix = [
    { id: 'a1', type: 'attestation', content: { kind: 'follow', attesterHandle: 'alvaro', targetHandle: 'maria' }, createdAt: 1 },
];
const gNorm = buildFollowGraph(atsNoPrefix);
eq(gNorm.edges[0].from, '@alvaro',                       'B · normalize · @ prepended');
eq(gNorm.edges[0].to,   '@maria',                        'B · normalize · target');

// 5 · self-follow rejected
const selfAt = [fa('@alvaro', '@alvaro')];
eq(buildFollowGraph(selfAt).edges.length, 0,             'B · self-follow rejected');

// 6 · followCounts
const c = followCounts({ handle: '@alvaro', attestations: atts });
eq(c.followers, 1,                                       'C · alvaro · 1 follower (maria)');
eq(c.following, 2,                                       'C · alvaro · segueix 2');
eq(c.mutual, 1,                                          'C · alvaro · 1 mutual (maria)');

const cMaria = followCounts({ handle: '@maria', attestations: atts });
eq(cMaria.followers, 2,                                  'C · maria · 2 followers (alvaro, bob)');
eq(cMaria.following, 1,                                  'C · maria · segueix 1 (alvaro)');
eq(cMaria.mutual, 1,                                     'C · maria · 1 mutual');

// 7 · empty handle
const cEmpty = followCounts({ handle: null });
eq(cEmpty.followers, 0,                                  'C · null handle · 0');

// 8 · listFollowers / listFollowing
const followers = listFollowers('@maria', atts);
eq(followers.length, 2,                                  'D · maria · 2 followers');
t(followers.includes('@alvaro'),                         'D · alvaro in followers');
t(followers.includes('@bob'),                            'D · bob in followers');

const following = listFollowing('@alvaro', atts);
eq(following.length, 2,                                  'D · alvaro segueix · 2');
t(following.includes('@maria'),                          'D · maria in following');

// 9 · isFollowing
eq(isFollowing('@alvaro', '@maria', atts), true,         'E · alvaro segueix maria');
eq(isFollowing('@maria', '@bob', atts), false,           'E · maria NO segueix bob');
eq(isFollowing('@alvaro', '@alvaro', atts), false,       'E · self · always false');
eq(isFollowing(null, '@maria', atts), false,             'E · null handle · false');

// 10 · isMutual
eq(isMutual('@alvaro', '@maria', atts), true,            'E · alvaro-maria mutual');
eq(isMutual('@alvaro', '@bob', atts), false,             'E · alvaro-bob NO mutual (bob no follows back)');
eq(isMutual('@alvaro', '@alvaro', atts), false,          'E · self · false');

// 11 · buildFollowAttestation
const newAt = buildFollowAttestation({ attesterHandle: 'alice', targetHandle: 'bob', ts: 5000 });
eq(newAt.type, 'attestation',                            'F · type attestation');
eq(newAt.content.kind, FOLLOW_KIND,                      'F · kind follow');
eq(newAt.content.attesterHandle, '@alice',               'F · attester normalized');
eq(newAt.content.targetHandle, '@bob',                   'F · target normalized');
t(newAt.id.includes('alice'),                            'F · id descriptive');
t(newAt.keywords.includes('kind:follow'),                'F · keyword kind:follow');

try { buildFollowAttestation({ attesterHandle: 'a', targetHandle: 'a' }); t(false, 'F · self-follow throws'); }
catch (_) { t(true, 'F · self-follow throws'); }

// 12 · computeTopFollowed
const top = computeTopFollowed(atts);
t(top.length > 0,                                        'G · top followed populated');
eq(top[0].handle, '@maria',                              'G · top · maria (2 followers)');

// 13 · computeNetworkStats
const stats = computeNetworkStats(atts);
eq(stats.totalEdges, 4,                                  'H · 4 total edges');
eq(stats.totalParticipants, 3,                           'H · 3 participants (alvaro · maria · bob)');
eq(stats.mutualPairs, 1,                                 'H · 1 mutual pair (alvaro+maria)');

// 14 · empty case
const emptyStats = computeNetworkStats([]);
eq(emptyStats.totalEdges, 0,                             'H · empty · 0');
eq(emptyStats.totalParticipants, 0,                      'H · empty · 0 participants');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
