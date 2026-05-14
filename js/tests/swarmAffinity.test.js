// SWARM-DISCOVERY sprint A · tests stand-alone per swarmAffinityService.
// Ús: node js/tests/swarmAffinity.test.js

import {
    scoreProjectAffinity, rankAffinity, findGapSkills, AFFINITY_WEIGHTS,
} from '../core/swarmAffinityService.js';

let pass = 0, fail = 0;
function t(cond, msg) { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } }
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }
function near(a, b, eps, msg) { t(Math.abs(a - b) <= eps, msg + ' (expected ~' + b + ', got ' + a + ')'); }

console.log('\n=== SWARM-DISCOVERY · swarmAffinityService ===\n');

// A · weights · sum to 1
const sum = AFFINITY_WEIGHTS.sector + AFFINITY_WEIGHTS.skill + AFFINITY_WEIGHTS.guardian;
near(sum, 1.0, 1e-6,                                              'A · weights sum 1.0');

// B · null inputs · score 0
const z1 = scoreProjectAffinity(null, { sectorId: 'tech' });
eq(z1.score, 0,                                                   'B · null p1 · score 0');
const z2 = scoreProjectAffinity({ sectorId: 'tech' }, null);
eq(z2.score, 0,                                                   'B · null p2 · score 0');

// C · self-match · score 1 · selfMatch flag
const self = scoreProjectAffinity({ id: 'p1', sectorId: 'x' }, { id: 'p1', sectorId: 'y' });
eq(self.score, 1,                                                 'C · self-match · score 1');
t(self.selfMatch === true,                                        'C · self-match · flag');

// D · disjoint · score 0
const d = scoreProjectAffinity(
    { id: 'a', sectorId: 'tech',  lookingForSkills: ['react'],  requiredGuardians: ['hermes'] },
    { id: 'b', sectorId: 'agro',  lookingForSkills: ['plowing'], requiredGuardians: ['demeter'] },
);
eq(d.score, 0,                                                    'D · disjoint · score 0');
eq(d.breakdown.sectorScore, 0,                                    'D · sector 0');
eq(d.breakdown.skillScore, 0,                                     'D · skill 0');
eq(d.breakdown.guardianScore, 0,                                  'D · guardian 0');

// E · full sector overlap · skills disjoint · guardian disjoint
const e = scoreProjectAffinity(
    { id: 'a', sectorId: 'tech' },
    { id: 'b', sectorId: 'tech' },
);
eq(e.breakdown.sectorScore, 1,                                    'E · sector full Jaccard 1.0');
near(e.score, AFFINITY_WEIGHTS.sector, 1e-3,                     'E · score = sector weight');

// F · sector + skill match · score sumat
const f = scoreProjectAffinity(
    { id: 'a', sectorId: 'tech', lookingForSkills: ['react', 'node'] },
    { id: 'b', sectorId: 'tech', lookingForSkills: ['react'] },
);
// sector Jaccard = 1, skill Jaccard = 1/2 = 0.5
// score = 0.5·1 + 0.3·0.5 + 0.2·0 = 0.65
near(f.score, 0.65, 0.01,                                        'F · sector full + skill 50% = 0.65');

// G · guardian overlap
const g = scoreProjectAffinity(
    { id: 'a', requiredGuardians: ['hermes', 'demeter'] },
    { id: 'b', requiredGuardians: ['hermes'] },
);
// guardian Jaccard = 1/2 = 0.5 · score = 0.2·0.5 = 0.1
near(g.score, 0.1, 0.01,                                         'G · guardian Jaccard 0.5 · score 0.1');

// H · case-insensitive matching
const h = scoreProjectAffinity(
    { id: 'a', sectorId: 'TECH' },
    { id: 'b', sectorId: 'tech' },
);
eq(h.breakdown.sectorScore, 1,                                    'H · case-insensitive · sector match');

// I · sector_affinity[] arrays
const i = scoreProjectAffinity(
    { id: 'a', sectorId: 'tech', sector_affinity: ['edu', 'agro'] },
    { id: 'b', sectorId: 'edu',  sector_affinity: ['health'] },
);
// p1 sectors: {tech,edu,agro} · p2 sectors: {edu,health}
// intersect: {edu} · union: {tech,edu,agro,health} · 1/4 = 0.25
near(i.breakdown.sectorScore, 0.25, 0.01,                        'I · sector_affinity array match');

// ─── rankAffinity tests ────────────────────────────────────────────────────

// J · rankAffinity · exclou target · ordena DESC
const target = { id: 't', sectorId: 'tech', lookingForSkills: ['react'] };
const candidates = [
    { id: 'c1', sectorId: 'tech', lookingForSkills: ['react'] },           // perfect match
    { id: 'c2', sectorId: 'tech', lookingForSkills: ['vue'] },             // sector only
    { id: 'c3', sectorId: 'agro' },                                        // no match (filtered)
    { id: 't',  sectorId: 'tech' },                                        // self · exclòs
];
const ranked = rankAffinity(target, candidates);
t(ranked.length === 2,                                            'J · target i no-match filtered · 2 resultats');
eq(ranked[0].project.id, 'c1',                                    'J · c1 primer (millor affinity)');
t(ranked[0].finalScore > ranked[1].finalScore,                    'J · ordenat DESC');

// K · rankAffinity amb trust scores · els amb trust alt pugen
const trustMap = new Map([
    ['c1', 1.0],   // power
    ['c2', 10.0],  // mega power · normalitza a 1.0 · pujarà
]);
const ranked2 = rankAffinity(target, candidates, { trustScores: trustMap, trustWeight: 0.5 });
// c1 · affinity ~0.8 · trust normalitzat 0.1 · final = 0.4 + 0.05 = 0.45
// c2 · affinity ~0.5 · trust normalitzat 1.0 · final = 0.25 + 0.5 = 0.75
t(ranked2[0].project.id === 'c2',                                 'K · trust mega-power · c2 supera c1');

// K2 · sense trust · same order que sense
const ranked3 = rankAffinity(target, candidates);
eq(ranked3[0].project.id, 'c1',                                   'K2 · sense trust · c1 primer (affinity)');

// L · topN
const manyCandidates = Array.from({ length: 10 }).map((_, k) => ({
    id: 'cm' + k, sectorId: 'tech',
}));
const top3 = rankAffinity(target, manyCandidates, { topN: 3 });
eq(top3.length, 3,                                                'L · topN respectat');

// M · empty/null inputs
eq(rankAffinity(null, candidates).length, 0,                     'M · null target · 0');
eq(rankAffinity(target, []).length, 0,                            'M · candidates buits · 0');

// ─── findGapSkills tests ──────────────────────────────────────────────────

// N · skill gap coverage
const gapTarget = { id: 'p', lookingForSkills: ['react', 'node', 'sql'] };
const seats = [
    { id: 's1', offeredSkills: ['react', 'node'] },           // 2/3
    { id: 's2', offeredSkills: ['sql'] },                     // 1/3
    { id: 's3', offeredSkills: ['java'] },                    // 0/3 · filtered
    { id: 's4', content: { skills: ['react', 'node', 'sql'] } }, // 3/3 (via content.skills)
];
const gaps = findGapSkills(gapTarget, seats);
eq(gaps[0].member.id, 's4',                                       'N · s4 (full coverage) primer');
near(gaps[0].coverage, 1.0, 0.01,                                'N · s4 coverage 1.0');
near(gaps[1].coverage, 2/3, 0.01,                                'N · s1 coverage 0.67');
eq(gaps.length, 3,                                                'N · s3 sense match · filtered');

// N2 · empty target wanted
const empty = findGapSkills({ id: 'p', lookingForSkills: [] }, seats);
eq(empty.length, 0,                                               'N2 · sense skills wanted · empty');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
