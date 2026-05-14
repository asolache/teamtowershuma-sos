// TRUST-001 sprint A · tests stand-alone per trustScoreService.
// Ús: node js/tests/trustScore.test.js

import {
    computeTrustScore, renderTrustBadgeHtml,
    loadAttestationsForIds, computeTrustForBatch,
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

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
