// H8.2 sprint A · tests stand-alone per al layout galàctic del mind-graph.
// Ús: node js/tests/mindGraphGalaxy.test.js

import {
    PHI, TYPE_TIER, tierForType,
    assignSpatialLayout,
    buildGraphFromKb, graphStats, colorForType,
} from '../core/mindGraphService.js';

let pass = 0, fail = 0;
function t(cond, msg) { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } }
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }
function near(a, b, eps, msg) { t(Math.abs(a - b) <= eps, msg + ' (expected ~' + b + ' ±' + eps + ', got ' + a + ')'); }

console.log('\n=== H8.2 · mind-graph galaxy layout ===\n');

// A · PHI constant
near(PHI, 1.6180339887, 1e-6,                                       'A · PHI ≈ (1+√5)/2');

// B · TYPE_TIER · capes de ceba canòniques
eq(tierForType('project'),         0,                               'B · project tier 0 (centre)');
eq(tierForType('client_vna_model'),0,                               'B · client_vna_model tier 0');
eq(tierForType('role'),            1,                               'B · role tier 1');
eq(tierForType('transaction'),     1,                               'B · transaction tier 1');
eq(tierForType('sop'),             2,                               'B · sop tier 2');
eq(tierForType('work_order'),      2,                               'B · work_order tier 2');
eq(tierForType('workshop'),        2,                               'B · workshop tier 2');
eq(tierForType('market_item'),     3,                               'B · market_item tier 3');
eq(tierForType('user_identity'),   4,                               'B · user_identity tier 4 (perifèria)');
eq(tierForType('unknown_type'),    3,                               'B · fallback tier 3');

// C · assignSpatialLayout · cas multi-sector
const graph = {
    nodes: [
        { id: 'p-tech',   type: 'project', sectorId: 'tech' },
        { id: 'p-edu',    type: 'project', sectorId: 'education' },
        { id: 'r-1',      type: 'role',         projectId: 'p-tech' },
        { id: 'r-2',      type: 'role',         projectId: 'p-tech' },
        { id: 'r-3',      type: 'role',         projectId: 'p-edu' },
        { id: 'tx-1',     type: 'transaction',  projectId: 'p-tech' },
        { id: 'sop-1',    type: 'sop',          projectId: 'p-tech' },
        { id: 'wo-1',     type: 'work_order',   projectId: 'p-edu' },
        { id: 'mkt-1',    type: 'market_item',  projectId: 'p-edu' },
        { id: 'u-1',      type: 'user_identity' },           // sense projecte → sector 'misc'
    ],
};
const meta = assignSpatialLayout(graph, { width: 1200, height: 900, baseRingR: 100, seed: 42 });
eq(meta.sectorCount, 3,                                              'C · 3 sectors (tech · education · misc)');
t(meta.sectors.includes('tech') && meta.sectors.includes('education') && meta.sectors.includes('misc'),
                                                                     'C · sectors recollits');

// D · sectorKey heretat correctament
eq(graph.nodes.find(n => n.id === 'r-1').sectorKey,    'tech',       'D · role hereta sector del project');
eq(graph.nodes.find(n => n.id === 'sop-1').sectorKey,  'tech',       'D · sop hereta sector del project');
eq(graph.nodes.find(n => n.id === 'wo-1').sectorKey,   'education',  'D · wo hereta sector del project');
eq(graph.nodes.find(n => n.id === 'u-1').sectorKey,    'misc',       'D · sense projecte → misc');
eq(graph.nodes.find(n => n.id === 'p-tech').sectorKey, 'tech',       'D · project usa propi sectorId');

// E · tier assignat correctament per a cada node
eq(graph.nodes.find(n => n.id === 'p-tech').tier, 0,                 'E · project tier 0');
eq(graph.nodes.find(n => n.id === 'r-1').tier,    1,                 'E · role tier 1');
eq(graph.nodes.find(n => n.id === 'tx-1').tier,   1,                 'E · transaction tier 1');
eq(graph.nodes.find(n => n.id === 'sop-1').tier,  2,                 'E · sop tier 2');
eq(graph.nodes.find(n => n.id === 'mkt-1').tier,  3,                 'E · market_item tier 3');
eq(graph.nodes.find(n => n.id === 'u-1').tier,    4,                 'E · user_identity tier 4');

// F · ringRadius segueix la proporció àuria φ^(tier·0.6)
// tier 0 → baseRingR · tier 1 → baseRingR · φ^0.6 · tier 2 → baseRingR · φ^1.2 ...
const baseR  = 100;
const r0     = graph.nodes.find(n => n.id === 'p-tech').ringRadius;
const r1     = graph.nodes.find(n => n.id === 'r-1').ringRadius;
const r2     = graph.nodes.find(n => n.id === 'sop-1').ringRadius;
const r3     = graph.nodes.find(n => n.id === 'mkt-1').ringRadius;
const r4     = graph.nodes.find(n => n.id === 'u-1').ringRadius;
near(r0, baseR,                       1e-3,                          'F · tier 0 · baseRingR');
near(r1, baseR * Math.pow(PHI, 0.6),  1e-3,                          'F · tier 1 · baseRingR · φ^0.6');
near(r2, baseR * Math.pow(PHI, 1.2),  1e-3,                          'F · tier 2 · baseRingR · φ^1.2');
near(r3, baseR * Math.pow(PHI, 1.8),  1e-3,                          'F · tier 3 · baseRingR · φ^1.8');
near(r4, baseR * Math.pow(PHI, 2.4),  1e-3,                          'F · tier 4 · baseRingR · φ^2.4');
t(r4 > r3 && r3 > r2 && r2 > r1 && r1 > r0,                          'F · radis estrictament creixents (ceba)');

// G · pseudo-3D depth · cz ∈ [0..1] · 1a galàxia sempre 0 (primer pla)
const sectorCenters = meta.sectorCenters;
const all_cz_in_range = Object.values(sectorCenters).every(s => s.cz >= 0 && s.cz <= 1);
t(all_cz_in_range,                                                   'G · sectorCenters.cz ∈ [0..1]');
// La galàxia central (index 0) té cz=0 (primer pla)
const firstSector = Object.values(sectorCenters).find(s => s.index === 0);
eq(firstSector.cz, 0,                                                'G · primera galàxia cz=0 (primer pla)');

// H · sectorCx/sectorCy assignats a cada node (no NaN, no undefined)
const allHaveCoords = graph.nodes.every(n =>
    typeof n.sectorCx === 'number' && typeof n.sectorCy === 'number' &&
    !Number.isNaN(n.sectorCx) && !Number.isNaN(n.sectorCy)
);
t(allHaveCoords,                                                      'H · tots els nodes tenen sectorCx/sectorCy vàlids');

// I · nodes del mateix sector comparteixen sectorCx/sectorCy
const techNodes = graph.nodes.filter(n => n.sectorKey === 'tech');
const cx0 = techNodes[0].sectorCx, cy0 = techNodes[0].sectorCy;
t(techNodes.every(n => n.sectorCx === cx0 && n.sectorCy === cy0),    'I · nodes del mateix sector comparteixen centre');

// J · cas degenerate · 0 nodes
const empty = assignSpatialLayout({ nodes: [] });
eq(empty.sectorCount, 0,                                              'J · graph buit · 0 sectors');

// K · cas single-sector · cz=0 i centre al canvas center
const single = { nodes: [{ id: 'p-1', type: 'project', sectorId: 'solo' }] };
const ms = assignSpatialLayout(single, { width: 1000, height: 800 });
eq(ms.sectorCount, 1,                                                 'K · single sector · count 1');
const solo = ms.sectorCenters['solo'];
near(solo.cx, 500, 1,                                                 'K · single · cx = width/2');
near(solo.cy, 400, 1,                                                 'K · single · cy = height/2');
eq(solo.cz,   0,                                                      'K · single · cz=0');

// L · determinisme · mateix seed → mateixes posicions
const g1 = { nodes: [{ id: 'a', type: 'project', sectorId: 's' }, { id: 'b', type: 'role', projectId: 'a' }] };
const g2 = { nodes: [{ id: 'a', type: 'project', sectorId: 's' }, { id: 'b', type: 'role', projectId: 'a' }] };
assignSpatialLayout(g1, { width: 1200, height: 900, seed: 123 });
assignSpatialLayout(g2, { width: 1200, height: 900, seed: 123 });
eq(g1.nodes[1].cx, g2.nodes[1].cx,                                    'L · seed=123 · cx idèntic');
eq(g1.nodes[1].cy, g2.nodes[1].cy,                                    'L · seed=123 · cy idèntic');

// M · golden-angle distribució · sectors a distàncies creixents del centre
// (Vogel's spiral: r ∝ √(i / (N−1))) · sector index 0 al centre · últim al màxim radi.
const many = { nodes: [] };
for (let i = 0; i < 6; i++) {
    many.nodes.push({ id: 'p' + i, type: 'project', sectorId: 'sec' + i });
}
const mm = assignSpatialLayout(many, { width: 2000, height: 1500 });
const centers = mm.sectors.map(k => mm.sectorCenters[k]).sort((a, b) => a.index - b.index);
const cx = 1000, cy = 750;
const dist = (s) => Math.hypot(s.cx - cx, s.cy - cy);
t(dist(centers[0]) < 1,                                               'M · sector index 0 al centre');
t(dist(centers[5]) > dist(centers[1]),                                'M · sector index 5 més lluny que index 1');
t(centers[5].cz === 1,                                                'M · sector index N-1 cz=1 (fons)');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
