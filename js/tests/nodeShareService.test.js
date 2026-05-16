// SHARE-JSON-001 · tests del nodeShareService
import {
    SHARE_FORMAT_VERSION, SHARE_KINDS,
    buildSharePackage, validateSharePackage,
    toJsonString, parseJsonString,
    detectSharePackage, prepareImport,
} from '../core/nodeShareService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== SHARE-JSON-001 · nodeShareService ===\n');

// 1 · constants
eq(SHARE_FORMAT_VERSION, 1,                              'A · format v1');
t(SHARE_KINDS.includes('project'),                       'A · project kind');
t(SHARE_KINDS.includes('work_order'),                    'A · work_order kind');
t(SHARE_KINDS.includes('bundle'),                        'A · bundle kind');
t(SHARE_KINDS.includes('node'),                          'A · node kind');

// 2 · build · happy path
const nodes = [
    { id: 'wo-1', type: 'work_order', projectId: 'p-1', content: { title: 'Test WO' }, createdAt: 1000, updatedAt: 1000 },
];
const pkg = buildSharePackage({ nodes, kind: 'work_order', by: 'alvaro', title: 'WO de test' });
eq(pkg.sosShare, 1,                                      'B · version stamped');
eq(pkg.kind, 'work_order',                               'B · kind preservat');
eq(pkg.by, 'alvaro',                                     'B · by handle');
eq(pkg.nodes.length, 1,                                  'B · 1 node');
eq(pkg.meta.title, 'WO de test',                         'B · meta.title');
t(typeof pkg.created === 'number',                       'B · created ts');

// 3 · sanitize · strips transients
const dirtyNodes = [{ id: 'n', type: 'x', content: {}, _cache: { huge: 'data' }, _pendingSync: true }];
const cleanPkg = buildSharePackage({ nodes: dirtyNodes, kind: 'node' });
t(!('_cache' in cleanPkg.nodes[0]),                      'B · _cache stripped');
t(!('_pendingSync' in cleanPkg.nodes[0]),                'B · _pendingSync stripped');

// 4 · validate
t(validateSharePackage(pkg).valid,                       'C · valid pkg');
t(!validateSharePackage(null).valid,                     'C · null invalid');
t(!validateSharePackage({}).valid,                       'C · empty obj invalid');
t(!validateSharePackage({ sosShare: 99, kind: 'project', nodes: [] }).valid, 'C · wrong version invalid');
t(!validateSharePackage({ sosShare: 1, kind: 'bogus', nodes: [{ id: 'x', type: 'y' }] }).valid, 'C · bad kind invalid');
t(!validateSharePackage({ sosShare: 1, kind: 'node', nodes: [{ type: 'x' }] }).valid, 'C · missing id invalid');

// 5 · roundtrip JSON
const str = toJsonString(pkg);
t(str.includes('"sosShare": 1'),                         'D · serialized contains version');
const back = parseJsonString(str);
eq(back.nodes[0].id, 'wo-1',                             'D · roundtrip id preserved');

// 6 · parse throws on invalid
let threw = false;
try { parseJsonString('{ "sosShare": 99, "kind": "node", "nodes": [] }'); } catch (_) { threw = true; }
t(threw,                                                 'D · parse throws on invalid');

// 7 · detect from DM text
const dmText = 'mira aquesta WO\n```json\n' + toJsonString(pkg, { pretty: false }) + '\n```\nbona?';
const detected = detectSharePackage(dmText);
t(detected && detected.nodes[0].id === 'wo-1',           'E · detect dins codeblock');

const dmPlain = toJsonString(pkg, { pretty: false });
const detectedPlain = detectSharePackage(dmPlain);
t(detectedPlain && detectedPlain.nodes[0].id === 'wo-1', 'E · detect json pla');

t(detectSharePackage('hola que tal') === null,           'E · text sense json → null');
t(detectSharePackage('{ "no": "share" }') === null,      'E · json sense sosShare → null');

// 8 · prepareImport · preserve mode
const prep1 = prepareImport(pkg, { mode: 'preserve' });
eq(prep1.nodes[0].id, 'wo-1',                            'F · preserve · id intacte');
eq(prep1.idMap, null,                                    'F · preserve · idMap null');

// 9 · prepareImport · rebase mode
const prep2 = prepareImport(pkg, { mode: 'rebase' });
t(prep2.nodes[0].id !== 'wo-1',                          'F · rebase · id canviat');
t(prep2.idMap && prep2.idMap['wo-1'] === prep2.nodes[0].id, 'F · rebase · idMap mapped');

// 10 · rebase · projectId remap si project a dins del paquet
const bundle = buildSharePackage({
    kind: 'bundle',
    nodes: [
        { id: 'p-1', type: 'project', content: { name: 'P' } },
        { id: 'wo-1', type: 'work_order', projectId: 'p-1', content: { title: 'WO' } },
    ],
});
const prep3 = prepareImport(bundle, { mode: 'rebase' });
const newP = prep3.idMap['p-1'];
const newWo = prep3.nodes.find(n => n.type === 'work_order');
eq(newWo.projectId, newP,                                'F · rebase · projectId remapped');

// 11 · custom newId fn
const prep4 = prepareImport(pkg, { mode: 'rebase', newId: (id) => 'NEW_' + id });
eq(prep4.nodes[0].id, 'NEW_wo-1',                        'F · rebase · custom newId fn');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
