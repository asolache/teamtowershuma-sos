// =============================================================================
// TEAMTOWERS SOS V11 — v136 · xapiService · TDD
// Ruta · /js/tests/v136XapiService.test.js
//
// Verifica · item #6 del audit post-alfa v134 · xAPI Tin Can compatible
// service amb helpers VNA quality tracking. Tests purs · KB injectat mock.
// =============================================================================

import {
    XAPI_VERSION, XAPI_VERBS, XAPI_ACTIVITY_TYPES,
    recordStatement, listStatements, listActivities,
    recordMapGenerated, recordMapAccepted, recordClarifyAnswered, recordGapFilled,
    summarizeStatements,
} from '../core/xapiService.js';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v136 · xapiService · Tin Can compatible · TDD ===\n');

// ── KB Mock · in-memory · query + upsert ───────────────────────────────
function makeKbMock() {
    const store = new Map();
    return {
        store,
        upsert: async (node) => { store.set(node.id, node); return node; },
        query:  async (filter) => Array.from(store.values()).filter(n => !filter?.type || n.type === filter.type),
    };
}

// ─── A · API surface ──────────────────────────────────────────────────
console.log('— A · API surface');
ok('A · XAPI_VERSION = v136',                          XAPI_VERSION === 'v136');
ok('A · XAPI_VERBS · 10 verbs (completed..gapfilled)', Object.keys(XAPI_VERBS).length >= 10 && XAPI_VERBS.generated && XAPI_VERBS.gapfilled);
ok('A · XAPI_VERBS · adl.gov namespace · completed',   XAPI_VERBS.completed.id.startsWith('http://adlnet.gov/'));
ok('A · XAPI_VERBS · SOS extension namespace',         XAPI_VERBS.gapfilled.id.startsWith('https://sos.teamtowershuma.com/'));
ok('A · XAPI_ACTIVITY_TYPES · vnaMap defined',         XAPI_ACTIVITY_TYPES.vnaMap.includes('vna-map'));
ok('A · recordStatement async',                        typeof recordStatement === 'function');
ok('A · listStatements async',                         typeof listStatements === 'function');
ok('A · listActivities async',                         typeof listActivities === 'function');
ok('A · 4 helpers SOS (recordMap* + recordClarify*)', typeof recordMapGenerated === 'function' && typeof recordMapAccepted === 'function' &&
                                                       typeof recordClarifyAnswered === 'function' && typeof recordGapFilled === 'function');
ok('A · summarizeStatements pure',                     typeof summarizeStatements === 'function');

// ─── B · recordStatement · validacions input ──────────────────────────
console.log('\n— B · recordStatement · validacions');
{
    const r0 = await recordStatement({});
    ok('B · null statement · ok=false',                r0.ok === false && r0.error.includes('invalid'));
    const r1 = await recordStatement({ actor: { name: 'A' }, verb: { id: 'x' } });
    ok('B · sense object · ok=false · object-required',r1.ok === false && r1.error.includes('object-required'));
    const r2 = await recordStatement({ actor: { name: 'A' }, object: { id: 'o' } });
    ok('B · sense verb · ok=false · verb-required',    r2.ok === false && r2.error.includes('verb-required'));
    const r3 = await recordStatement({ verb: { id: 'x' }, object: { id: 'o' } });
    ok('B · sense actor · ok=false · actor-required',  r3.ok === false && r3.error.includes('actor-required'));
    // actor pot ser només name
    const r4 = await recordStatement({
        actor: { name: 'Test' },
        verb: XAPI_VERBS.completed,
        object: { id: 'https://x/a' },
    });
    ok('B · actor amb només name · ok=true',           r4.ok === true);
}

// ─── C · recordStatement · happy path + KB persist ────────────────────
console.log('\n— C · recordStatement · happy path');
{
    const kb = makeKbMock();
    const r = await recordStatement({
        actor:  { mbox: 'mailto:alice@example.com', name: 'Alice' },
        verb:   XAPI_VERBS.completed,
        object: { id: 'https://sos.teamtowershuma.com/lms/courses/vna-basics',
                  definition: { name: { en: 'VNA Basics' }, type: XAPI_ACTIVITY_TYPES.course }},
        result: { completion: true, success: true, score: { scaled: 0.85 } },
        kb,
    });
    ok('C · ok=true',                                   r.ok === true);
    ok('C · node.id prefixat amb xapi-',                r.node.id.startsWith('xapi-'));
    ok('C · node.type = xapi_statement',                r.node.type === 'xapi_statement');
    ok('C · statement.id present (UUID-ish)',           typeof r.statement.id === 'string' && r.statement.id.length >= 8);
    ok('C · statement.timestamp ISO',                    /^\d{4}-\d{2}-\d{2}T/.test(r.statement.timestamp));
    ok('C · version 1.0.3',                              r.statement.version === '1.0.3');
    ok('C · persistit al KB mock',                       kb.store.has(r.node.id));
}

// ─── D · listStatements · filters · agent · verb · object · since ─────
console.log('\n— D · listStatements · filters');
{
    const kb = makeKbMock();
    // Inject 4 statements
    await recordStatement({
        actor: { mbox: 'mailto:alice@x.com', name: 'Alice' },
        verb: XAPI_VERBS.completed, object: { id: 'http://x/c1' }, kb,
        timestamp: '2026-01-01T10:00:00Z',
    });
    await recordStatement({
        actor: { mbox: 'mailto:alice@x.com', name: 'Alice' },
        verb: XAPI_VERBS.attempted, object: { id: 'http://x/c1' }, kb,
        timestamp: '2026-02-01T10:00:00Z',
    });
    await recordStatement({
        actor: { mbox: 'mailto:bob@x.com', name: 'Bob' },
        verb: XAPI_VERBS.completed, object: { id: 'http://x/c2' }, kb,
        timestamp: '2026-03-01T10:00:00Z',
    });
    await recordStatement({
        actor: { mbox: 'mailto:bob@x.com', name: 'Bob' },
        verb: XAPI_VERBS.generated, object: { id: 'http://x/m1' }, kb,
        timestamp: '2026-04-01T10:00:00Z',
    });

    const all = await listStatements({ kb });
    ok('D · all · 4 statements',                        all.ok === true && all.statements.length === 4);
    ok('D · sort desc · primer és més recent',          all.statements[0].timestamp.startsWith('2026-04'));

    const alice = await listStatements({ kb, agent: 'alice' });
    ok('D · filter agent=alice · 2 statements',         alice.statements.length === 2);

    const completed = await listStatements({ kb, verbId: XAPI_VERBS.completed.id });
    ok('D · filter verbId=completed · 2 statements',    completed.statements.length === 2);

    const c1 = await listStatements({ kb, objectId: 'http://x/c1' });
    ok('D · filter objectId=c1 · 2 statements',         c1.statements.length === 2);

    const since = await listStatements({ kb, since: '2026-03-01T00:00:00Z' });
    ok('D · filter since=2026-03-01 · 2 statements',   since.statements.length === 2);

    const limit = await listStatements({ kb, limit: 1 });
    ok('D · limit=1 · només 1 statement',               limit.statements.length === 1);
}

// ─── E · listStatements · KB unavailable ──────────────────────────────
console.log('\n— E · listStatements · KB unavailable');
{
    const r = await listStatements({ kb: { /* no query method */ } });
    ok('E · sense query method · ok=false · kb-unavailable', r.ok === false && r.error === 'kb-unavailable');
}

// ─── F · listActivities · unique objects ──────────────────────────────
console.log('\n— F · listActivities');
{
    const kb = makeKbMock();
    await recordStatement({ actor: { name: 'A' }, verb: XAPI_VERBS.completed, object: { id: 'http://x/a' }, kb });
    await recordStatement({ actor: { name: 'A' }, verb: XAPI_VERBS.attempted, object: { id: 'http://x/a' }, kb });   // dup
    await recordStatement({ actor: { name: 'B' }, verb: XAPI_VERBS.completed, object: { id: 'http://x/b' }, kb });
    const r = await listActivities({ kb });
    ok('F · 2 activitats úniques',                      r.ok === true && r.activities.length === 2);
    ok('F · ids · http://x/a + http://x/b',             r.activities.map(a => a.id).sort().join(',') === 'http://x/a,http://x/b');
}

// ─── G · recordMapGenerated · helper amb score 0-100 ─────────────────
console.log('\n— G · recordMapGenerated · helper VNA quality');
{
    const kb = makeKbMock();
    const r = await recordMapGenerated({
        actor: 'did:sos:alvaro',
        mapId: 'fc-lleida',
        score: 78,
        tokens: 1850,
        ms: 4200,
        slim: true,
        kb,
    });
    ok('G · ok=true',                                   r.ok === true);
    ok('G · verb = generated',                          r.statement.verb.id === XAPI_VERBS.generated.id);
    ok('G · object.id · sos.tt/vna-map/fc-lleida',     r.statement.object.id.includes('/vna-map/fc-lleida'));
    ok('G · score scaled = 0.78',                       r.statement.result.score.scaled === 0.78);
    ok('G · score raw + min + max',                     r.statement.result.score.raw === 78 &&
                                                        r.statement.result.score.min === 0 &&
                                                        r.statement.result.score.max === 100);
    ok('G · duration ISO 8601 · PT4S',                  r.statement.result.duration === 'PT4S');
    ok('G · extensions · tokens + slim',                r.statement.result.extensions['https://sos.teamtowershuma.com/xapi/ext/tokens'] === 1850 &&
                                                        r.statement.result.extensions['https://sos.teamtowershuma.com/xapi/ext/slim'] === true);
    ok('G · actor DID resolt · did:sos:alvaro',         r.statement.actor.did === 'did:sos:alvaro');
}

// ─── H · recordMapGenerated · actor email format ──────────────────────
console.log('\n— H · recordMapGenerated · actor email');
{
    const r = await recordMapGenerated({ actor: 'alice@x.com', mapId: 'm1', score: 90, kb: makeKbMock() });
    ok('H · email · actor.mbox = mailto:alice@x.com',   r.statement.actor.mbox === 'mailto:alice@x.com');
    ok('H · actor.name extreta · alice',                r.statement.actor.name === 'alice');
}

// ─── I · recordMapGenerated · sense score · sense result.score ─────────
console.log('\n— I · recordMapGenerated · score opcional');
{
    const r = await recordMapGenerated({ actor: 'X', mapId: 'm', kb: makeKbMock() });
    ok('I · ok=true sense score',                        r.ok === true);
    ok('I · result.score absent',                        !r.statement.result.score);
    ok('I · result.completion=true',                     r.statement.result.completion === true);
}

// ─── J · recordMapAccepted · accepted verb ─────────────────────────────
console.log('\n— J · recordMapAccepted');
{
    const r = await recordMapAccepted({ actor: 'X', mapId: 'm', roleCount: 8, txCount: 12, kb: makeKbMock() });
    ok('J · verb = accepted',                            r.statement.verb.id === XAPI_VERBS.accepted.id);
    ok('J · success=true · completion=true',             r.statement.result.success === true && r.statement.result.completion === true);
    ok('J · extensions · role-count + tx-count',         r.statement.result.extensions['https://sos.teamtowershuma.com/xapi/ext/role-count'] === 8);
}

// ─── K · recordClarifyAnswered + recordGapFilled ──────────────────────
console.log('\n— K · clarify + gapfilled helpers');
{
    const r1 = await recordClarifyAnswered({ actor: 'X', mapId: 'm', questionsCount: 4, answeredCount: 3, kb: makeKbMock() });
    ok('K · clarified verb',                             r1.statement.verb.id === XAPI_VERBS.clarified.id);
    ok('K · ext · questions:4 · answered:3',             r1.statement.result.extensions['https://sos.teamtowershuma.com/xapi/ext/questions'] === 4);

    const r2 = await recordGapFilled({ actor: 'X', mapId: 'm', gapsCount: 3, addedRoles: 2, kb: makeKbMock() });
    ok('K · gapfilled verb',                             r2.statement.verb.id === XAPI_VERBS.gapfilled.id);
    ok('K · ext · gaps-detected:3 · roles-added:2',      r2.statement.result.extensions['https://sos.teamtowershuma.com/xapi/ext/gaps-detected'] === 3);
}

// ─── L · summarizeStatements · aggregation pure ────────────────────────
console.log('\n— L · summarizeStatements');
{
    const stmts = [
        { actor: { mbox: 'mailto:a@x' }, verb: { id: 'v1' }, object: { id: 'o1' }, timestamp: '2026-01-01T00:00:00Z', result: { score: { scaled: 0.8 } } },
        { actor: { mbox: 'mailto:a@x' }, verb: { id: 'v1' }, object: { id: 'o2' }, timestamp: '2026-02-01T00:00:00Z', result: { score: { scaled: 0.9 } } },
        { actor: { mbox: 'mailto:b@x' }, verb: { id: 'v2' }, object: { id: 'o1' }, timestamp: '2026-03-01T00:00:00Z' },
    ];
    const sum = summarizeStatements(stmts);
    ok('L · total = 3',                                  sum.total === 3);
    ok('L · byVerb · v1=2 · v2=1',                       sum.byVerb['v1'] === 2 && sum.byVerb['v2'] === 1);
    ok('L · avgScore = (0.8+0.9)/2 = 0.85',              sum.avgScore === 0.85);
    ok('L · agents · 2 únics',                           sum.agents.size === 2);
    ok('L · activities · 2 úniques',                     sum.activities.size === 2);
    ok('L · firstAt + lastAt rang correcte',             sum.firstAt.startsWith('2026-01') && sum.lastAt.startsWith('2026-03'));

    const empty = summarizeStatements([]);
    ok('L · empty · total=0 · avgScore=null',            empty.total === 0 && empty.avgScore === null);
}

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
