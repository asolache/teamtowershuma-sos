// TRUST-001 sprint A · tests stand-alone per trustScoreService.
// Ús: node js/tests/trustScore.test.js

import {
    computeTrustScore, renderTrustBadgeHtml,
    loadAttestationsForIds, computeTrustForBatch,
    computeRecursiveTrustScores, computeRecursiveTrustForBatch,
    buildTrustPanelData,
} from '../core/trustScoreService.js';

let pass = 0, fail = 0;
function t(cond, msg) { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } }
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== TRUST-001 sprint A · trustScoreService ===\n');

// Helper · build mock attestation node
const mkAtt = (attesterDid, attestedId, kind = 'endorses-operator') => ({
    id: 'att-' + Math.random().toString(36).slice(2, 8),
    type: 'attestation',
    content: { attesterDid, attestedId, attestationKind: kind, attestedType: 'profile' },
});

// A · sense attestations · band 'none'
const r0 = computeTrustScore({ attestations: [] });
eq(r0.band, 'none',                                              'A · sense atts · band none');
eq(r0.total, 0,                                                  'A · total 0');
eq(r0.icon, '·',                                                 'A · icon ·');

// B · 1 attestation · band 'low'
const r1 = computeTrustScore({ attestations: [mkAtt('did:sos:a', 'p1')] });
eq(r1.band, 'low',                                               'B · 1 att · low');
eq(r1.uniqueAttesters, 1,                                        'B · 1 attester');
t(r1.total >= 1,                                                 'B · total ≥1');

// C · 2 attesters diferents · band 'mid'
const r2 = computeTrustScore({ attestations: [
    mkAtt('did:sos:a', 'p1'), mkAtt('did:sos:b', 'p1'),
] });
eq(r2.band, 'mid',                                               'C · 2 attesters · mid');
eq(r2.uniqueAttesters, 2,                                        'C · 2 attesters');

// D · founder endorsement · band 'high' (×3 weight)
const r3 = computeTrustScore({ attestations: [
    mkAtt('did:sos:f', 'p1', 'endorses-founder'),
] });
eq(r3.band, 'high',                                              'D · founder · high');
eq(r3.founderEndorsements, 1,                                    'D · founder count 1');
t(r3.total >= 3,                                                 'D · total ≥3 (×3 weight)');

// E · attestedId filter
const r4 = computeTrustScore({
    attestations: [mkAtt('did:sos:a', 'p1'), mkAtt('did:sos:b', 'p2')],
    attestedId: 'p1',
});
eq(r4.uniqueAttesters, 1,                                        'E · filter attestedId · sols p1');

// F · attesterDidsFilter · sols allowed
const r5 = computeTrustScore({
    attestations: [mkAtt('did:sos:a', 'p1'), mkAtt('did:sos:trusted', 'p1')],
    attesterDidsFilter: ['did:sos:trusted'],
});
eq(r5.uniqueAttesters, 1,                                        'F · filter attesterDids · sols trusted');

// G · 4 attesters · band 'high'
const r6 = computeTrustScore({ attestations: [
    mkAtt('did:sos:a', 'p1'), mkAtt('did:sos:b', 'p1'),
    mkAtt('did:sos:c', 'p1'), mkAtt('did:sos:d', 'p1'),
] });
eq(r6.uniqueAttesters, 4,                                        'G · 4 attesters');
t(r6.band === 'high' || (r6.total >= 4),                         'G · band high amb 4+ attesters');

// H · renderTrustBadgeHtml · compact
const html = renderTrustBadgeHtml(r3, { compact: true });
t(typeof html === 'string' && html.includes('inline-flex'),      'H · compact badge HTML');
t(html.includes('★'),                                            'H · inclou icon high');
t(html.includes('Trust ·'),                                      'H · tooltip Trust');

// Sense score · retorna empty string
eq(renderTrustBadgeHtml(null), '',                               'H · null score · empty');

// I · loadAttestationsForIds amb kb mock
const mockKb = {
    query: async ({ type }) => type === 'attestation' ? [
        mkAtt('did:sos:a', 'p1'),
        mkAtt('did:sos:b', 'p1'),
        mkAtt('did:sos:c', 'p2'),
        mkAtt('did:sos:d', 'p-other'),  // exclós · no a allowed
    ] : [],
};
const byId = await loadAttestationsForIds({ kb: mockKb, attestedIds: ['p1', 'p2'] });
eq(byId.p1.length, 2,                                            'I · p1 · 2 atts');
eq(byId.p2.length, 1,                                            'I · p2 · 1 att');
t(!byId['p-other'],                                              'I · p-other exclòs');

// J · computeTrustForBatch · agregat per N attestedIds
const batch = await computeTrustForBatch({ kb: mockKb, attestedIds: ['p1', 'p2', 'p3'] });
eq(batch.p1.uniqueAttesters, 2,                                  'J · batch p1 · 2');
eq(batch.p2.uniqueAttesters, 1,                                  'J · batch p2 · 1');
eq(batch.p3.band, 'none',                                        'J · batch p3 · none (sense atts)');

// ─── K · TRUST-002 sprint B · computeRecursiveTrustScores · PageRank ───────
//
// K1 · cas degenerate · sense attestations
const recEmpty = computeRecursiveTrustScores({ attestations: [] });
eq(recEmpty.scores.size, 0,                                      'K1 · sense atts · 0 scores');
t(recEmpty.converged,                                            'K1 · trivially converged');

// K2 · single attestation · attester i attested apareixen al map
const recOne = computeRecursiveTrustScores({
    attestations: [mkAtt('did:sos:alice', 'did:sos:bob')],
    damping: 0.85, baseScore: 1.0,
});
eq(recOne.scores.size, 2,                                        'K2 · alice + bob al map');
t(recOne.scores.has('did:sos:alice'),                            'K2 · alice present');
t(recOne.scores.has('did:sos:bob'),                              'K2 · bob present');
// bob rep d'alice → score bob > score alice (alice no rep res)
t(recOne.scores.get('did:sos:bob') > recOne.scores.get('did:sos:alice'),
                                                                 'K2 · bob > alice (asimètric)');

// K3 · cross-endorse · alice ↔ bob · scores convergeixen iguals (simetria) i
// > teleport (han rebut > 0 contribucions) · amb operator-weight 1 i outDeg 1,
// el punt fix és s = (1−d) + d·s → s = 1.0 (igual a baseScore). Comprovem
// SIMETRIA · ambdós ≥ teleport · clarament > una identitat sense in-edges.
const recCross = computeRecursiveTrustScores({
    attestations: [
        mkAtt('did:sos:alice', 'did:sos:bob'),
        mkAtt('did:sos:bob',   'did:sos:alice'),
    ],
});
const sa = recCross.scores.get('did:sos:alice');
const sb = recCross.scores.get('did:sos:bob');
t(Math.abs(sa - sb) < 1e-3,                                      'K3 · cross-endorse · alice ≈ bob (simetria)');
t(sa > 0.15 && sb > 0.15,                                        'K3 · ambdós > teleport · han rebut contribucions');

// K4 · power user · power_dave endorsa power_dave i tothom el segueix
// dave té molts in-edges (high pagerank) · els que dave endorsa hereten boost
const power = [
    // Tothom endorsa dave → dave high PR
    mkAtt('did:sos:u1', 'did:sos:dave'),
    mkAtt('did:sos:u2', 'did:sos:dave'),
    mkAtt('did:sos:u3', 'did:sos:dave'),
    mkAtt('did:sos:u4', 'did:sos:dave'),
    // Dave endorsa mary · mary aprofita el high PR de dave
    mkAtt('did:sos:dave', 'did:sos:mary'),
    // Un new user u5 endorsa solo · score molt menor que mary
    mkAtt('did:sos:u5', 'did:sos:solo'),
];
const recPower = computeRecursiveTrustScores({ attestations: power, iterations: 50, damping: 0.85 });
const sMary = recPower.scores.get('did:sos:mary');
const sSolo = recPower.scores.get('did:sos:solo');
t(sMary > sSolo,                                                 'K4 · mary (endorsada per power-user) > solo (endorsada per new user)');

// K5 · founder kind val 3x · contribució més gran
const founderEndorse = [
    mkAtt('did:sos:f1', 'did:sos:target_founder', 'endorses-founder'),
    mkAtt('did:sos:o1', 'did:sos:target_op',     'endorses-operator'),
];
const recFounder = computeRecursiveTrustScores({ attestations: founderEndorse });
t(recFounder.scores.get('did:sos:target_founder') > recFounder.scores.get('did:sos:target_op'),
                                                                 'K5 · founder endorsement weight > operator');

// K6 · convergeix amb epsilon estandard
t(recCross.iterationsRun < 30,                                   'K6 · convergeix abans del màxim');
t(recCross.converged,                                            'K6 · converged=true');

// K7 · self-loop ignorat
const selfLoop = [mkAtt('did:sos:x', 'did:sos:x')];
const recSelf = computeRecursiveTrustScores({ attestations: selfLoop });
eq(recSelf.scores.size, 0,                                       'K7 · self-loop ignorat · 0 scores');

// ─── L · computeTrustScore amb attesterWeights · recursive variant ────────
const attestations_L = [
    mkAtt('did:sos:powerful', 'project-p1'),
    mkAtt('did:sos:newbie',   'project-p1'),
];
// Flat (sense weights) · 2 attesters · totalScore=2 (1+1)
const flatScore = computeTrustScore({ attestations: attestations_L });
eq(flatScore.uniqueAttesters, 2,                                 'L · flat · 2 attesters');
eq(flatScore.total, 2,                                           'L · flat · total 2');
t(!flatScore.recursive,                                          'L · flat · recursive=false');

// Recursive · powerful té weight 5, newbie weight 1
const weights = new Map([
    ['did:sos:powerful', 5.0],
    ['did:sos:newbie',   1.0],
]);
const recScore = computeTrustScore({ attestations: attestations_L, attesterWeights: weights });
eq(recScore.uniqueAttesters, 2,                                  'L · recursive · 2 attesters');
eq(recScore.total, 6,                                            'L · recursive · total 5+1=6');
t(recScore.recursive,                                            'L · recursive · recursive=true');

// L2 · attester sense weight a la Map · fallback weight 1 (no fa caure tot)
const partial = new Map([['did:sos:powerful', 3.0]]);
const recPart = computeTrustScore({ attestations: attestations_L, attesterWeights: partial });
eq(recPart.total, 4,                                             'L2 · partial weights · fallback 1 per attester sense entry');

// ─── M · computeRecursiveTrustForBatch · helper async ─────────────────────
const batchKb = {
    query: async ({ type }) => type === 'attestation' ? [
        mkAtt('did:sos:a', 'p1'),
        mkAtt('did:sos:b', 'p1'),
        mkAtt('did:sos:c', 'did:sos:b'),  // c endorsa b → b power
        mkAtt('did:sos:b', 'p2'),         // b endorsa p2 (alt weight per power)
    ] : [],
};
const recBatch = await computeRecursiveTrustForBatch({ kb: batchKb, attestedIds: ['p1', 'p2'] });
t(recBatch.p1.recursive,                                          'M · batch p1 · recursive=true');
t(recBatch.p2.recursive,                                          'M · batch p2 · recursive=true');
// p2 té UN attester (b) però b és power-user (endorsat per c). El score
// recursiu de p2 és kindWeight(1) × score[b] ≈ 0.85 × baseScore (b ha rebut
// 1 endorse) · NO comparable directament a p1 sense normalitzar. Validem
// sols que arriba a la UI amb un valor positiu i amb recursive=true.
t(recBatch.p2.total > 0,                                          'M · batch p2 · score positiu');
t(recBatch.__meta && typeof recBatch.__meta.iterationsRun === 'number',
                                                                  'M · batch · meta amb iterationsRun');

// ─── N · WEBOF-TRUST · buildTrustPanelData · pure data prep ───────────────
//
// N1 · sense nodeId · empty defaults
const n1 = buildTrustPanelData({});
eq(n1.aggregate.uniqueAttesters, 0,                               'N1 · sense nodeId · 0 attesters');
eq(n1.attesters.length,         0,                                'N1 · attesters []');

// N2 · cas bàsic · 2 attesters al mateix node
const wotKb = [
    mkAtt('did:sos:alice', 'project-x'),
    mkAtt('did:sos:bob',   'project-x', 'endorses-founder'),
    mkAtt('did:sos:c',     'other-node'),     // exclòs · no és el target
];
const n2 = buildTrustPanelData({ attestations: wotKb, nodeId: 'project-x' });
eq(n2.attesters.length, 2,                                        'N2 · 2 attesters per project-x');
eq(n2.aggregate.uniqueAttesters, 2,                               'N2 · agregat 2 attesters');
t(n2.relevant.length === 2,                                       'N2 · relevant filtered (2/3)');
// founder (3x) ha de tenir kindWeight=3 al row
const bobRow = n2.attesters.find(a => a.did === 'did:sos:bob');
eq(bobRow.kindWeight, 3,                                          'N2 · bob founder kindWeight 3');
const aliceRow = n2.attesters.find(a => a.did === 'did:sos:alice');
eq(aliceRow.kindWeight, 1,                                        'N2 · alice operator kindWeight 1');

// N3 · projectId fallback · attestations al projecte (no al node directament)
const wotKb2 = [
    mkAtt('did:sos:alice', 'project-x'),
];
const n3 = buildTrustPanelData({
    attestations: wotKb2,
    nodeId:       'wo-1',          // un WO concret
    projectId:    'project-x',     // del projecte de l'WO
});
eq(n3.attesters.length, 1,                                        'N3 · attestation al projectId · inclosa');

// N4 · attesters ordenats per pagerank DESC
const wotKb3 = [
    mkAtt('did:sos:newbie',   'tgt'),
    mkAtt('did:sos:powerful', 'tgt'),
    mkAtt('did:sos:u1', 'did:sos:powerful'),
    mkAtt('did:sos:u2', 'did:sos:powerful'),
    mkAtt('did:sos:u3', 'did:sos:powerful'),
];
const n4 = buildTrustPanelData({ attestations: wotKb3, nodeId: 'tgt' });
eq(n4.attesters.length, 2,                                        'N4 · 2 attesters per tgt');
eq(n4.attesters[0].did, 'did:sos:powerful',                       'N4 · powerful primer (PR més alt)');
t(n4.attesters[0].pagerank > n4.attesters[1].pagerank,            'N4 · ordre DESC');

// N5 · meta info · iterationsRun + converged
t(n4.recursive.iterationsRun > 0,                                 'N5 · iterationsRun >0');
t(typeof n4.recursive.converged === 'boolean',                    'N5 · converged boolean');
t(n4.recursive.attesterCount > 0,                                 'N5 · attesterCount > 0');

// N6 · dedupe · mateix DID 2 cops · sols 1 entry al attesters
const wotKb6 = [
    mkAtt('did:sos:alice', 'tgt'),
    mkAtt('did:sos:alice', 'tgt'),  // duplicat
];
const n6 = buildTrustPanelData({ attestations: wotKb6, nodeId: 'tgt' });
eq(n6.attesters.length, 1,                                        'N6 · dedupe per attesterDid');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
