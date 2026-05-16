// SWARM-OP-001 sprint A · tests stand-alone per sprintOrchestrator + backlogManifest.
// Ús: node js/tests/sprintOrchestrator.test.js

import {
    INITIAL_BACKLOG, BACKLOG_PRIORITY, BACKLOG_COMPLEXITY,
    summarizeBacklog, prioritizedPendingItems,
} from '../core/backlogManifest.js';
import {
    SPRINT_RUN_TYPE, SPRINT_RUN_KINDS,
    buildItemPrompt, runSprintItem, persistSprintRun, queryHistory, pickNextItem,
} from '../core/sprintOrchestrator.js';

let pass = 0, fail = 0;
function t(cond, msg) { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } }
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== SWARM-OP-001 sprint A · sprintOrchestrator ===\n');

// A · BACKLOG constants
t(Array.isArray(INITIAL_BACKLOG) && INITIAL_BACKLOG.length >= 8, 'A · INITIAL_BACKLOG ≥8 items');
t(INITIAL_BACKLOG.every(it => it.id && it.title && it.priority && it.complexity), 'A · cada item té shape minim');
t(Object.keys(BACKLOG_PRIORITY).includes('critical'),            'A · critical priority');
t(Object.keys(BACKLOG_COMPLEXITY).includes('XS'),                'A · XS complexity');

// B · summarizeBacklog
const sum = summarizeBacklog(INITIAL_BACKLOG);
eq(sum.count, INITIAL_BACKLOG.length,                            'B · count match');
t(typeof sum.byStatus === 'object' && sum.byStatus.pending >= 1, 'B · byStatus.pending');
t(typeof sum.totalPendingHours === 'number',                     'B · totalPendingHours number');

// C · prioritizedPendingItems · ordenat per priority desc + complexity asc
const queue = prioritizedPendingItems(INITIAL_BACKLOG);
t(queue.every(it => it.status === 'pending'),                    'C · sols pending');
t(queue.length >= 2,                                             'C · multiples items');
for (let i = 1; i < queue.length; i++) {
    const pa = BACKLOG_PRIORITY[queue[i-1].priority].level;
    const pb = BACKLOG_PRIORITY[queue[i].priority].level;
    if (pa < pb) { fail++; console.error('✘ C · ordre prioritat trencat a ' + i); break; }
}
console.log('✓ C · queue ordenat per priority');

// D · pickNextItem · primera de la queue
const next = pickNextItem(INITIAL_BACKLOG);
t(next && next.status === 'pending',                             'D · pickNextItem retorna pending');
if (next) eq(next.id, queue[0].id,                               'D · pickNextItem == queue[0]');

// E · buildItemPrompt · 3 kinds
const item = INITIAL_BACKLOG[0];
for (const kind of SPRINT_RUN_KINDS) {
    const p = buildItemPrompt({ item, kind });
    t(p.systemPrompt && p.systemPrompt.includes('SOS · "Swarm Operative System"'), 'E · ' + kind + ' systemPrompt SOS branded');
    t(p.userPrompt && p.userPrompt.includes(item.title),         'E · ' + kind + ' userPrompt inclou title');
    t(p.userPrompt.includes('principles canònics') || p.userPrompt.includes('principis canònics') || p.userPrompt.includes('principles'), 'E · ' + kind + ' prompt menciona principis');
    eq(p.kind, kind,                                             'E · ' + kind + ' kind propagat');
}

// E2 · throws
let threw = null;
try { buildItemPrompt({ kind: 'draft' }); } catch (e) { threw = e; }
t(threw && /requires item/.test(threw.message),                  'E2 · sense item · throw');
threw = null;
try { buildItemPrompt({ item, kind: 'unknown' }); } catch (e) { threw = e; }
t(threw && /unknown kind/.test(threw.message),                   'E2 · kind invàlid · throw');

// F · runSprintItem · runner mock injectable
let runnerCalled = null;
const mockRunner = async (prompt) => {
    runnerCalled = prompt;
    return { text: 'mock IA output', usage: { inputTokens: 100, outputTokens: 50 }, modelKey: 'mock-model' };
};
const result = await runSprintItem({ itemId: item.id, kind: 'draft', runner: mockRunner });
t(result.run && result.run.type === SPRINT_RUN_TYPE,             'F · run node creat');
eq(result.run.content.itemId, item.id,                           'F · itemId al run');
eq(result.run.content.kind, 'draft',                             'F · kind al run');
t(result.run.content.output && result.run.content.output.length > 0, 'F · output capturat');
eq(result.run.content.modelKey, 'mock-model',                    'F · modelKey capturat');
t(result.run.content.durationMs >= 0,                            'F · durationMs ≥0');
t(runnerCalled && runnerCalled.systemPrompt,                     'F · runner rep prompt');

// F2 · throws · itemId desconegut
threw = null;
try { await runSprintItem({ itemId: 'fake', runner: mockRunner }); } catch (e) { threw = e; }
t(threw && /unknown itemId/.test(threw.message),                 'F2 · itemId desconegut · throw');

// F3 · runner que throw · capturat al run.content.error
const failRunner = async () => { throw new Error('IA down'); };
const resultErr = await runSprintItem({ itemId: item.id, runner: failRunner });
t(resultErr.run.content.error && resultErr.run.content.error.includes('IA down'), 'F3 · error capturat al run');
t(!resultErr.run.content.output,                                 'F3 · output null on error');

// F4 · SWARM-OP-002 · runner amb attempts (failover trace) · output ok
const failoverRunner = async () => ({
    text: 'fallback output',
    usage: { inputTokens: 80, outputTokens: 40 },
    modelKey: 'openai/gpt-4o',
    attempts: [
        { modelKey: 'anthropic/sonnet-4.6', evalOk: false, evalReason: 'generate-failed: http 400 credit balance too low' },
        { modelKey: 'openai/gpt-4o',         evalOk: true },
    ],
});
const resultFO = await runSprintItem({ itemId: item.id, runner: failoverRunner });
t(Array.isArray(resultFO.run.content.attempts) && resultFO.run.content.attempts.length === 2, 'F4 · attempts trace propagat al run.content');
eq(resultFO.run.content.modelKey, 'openai/gpt-4o',               'F4 · modelKey reflecteix el que ha funcionat');

// F5 · SWARM-OP-002 · runner throw amb attempts · errorAttempts surface
const exhaustedErr = new Error('escalation exhausted');
exhaustedErr.attempts = [
    { modelKey: 'anthropic/sonnet-4.6', evalOk: false, evalReason: 'http 400' },
    { modelKey: 'openai/gpt-4o',         evalOk: false, evalReason: 'http 401 no key' },
];
const exhaustedRunner = async () => { throw exhaustedErr; };
const resultExh = await runSprintItem({ itemId: item.id, runner: exhaustedRunner });
t(Array.isArray(resultExh.run.content.attempts) && resultExh.run.content.attempts.length === 2, 'F5 · errorAttempts surface al run.content tot i throw');
t(resultExh.run.content.error && resultExh.run.content.error.includes('exhausted'), 'F5 · error message preservat');

// G · persistSprintRun · KB mock
const upserts = [];
const mockKb = { upsert: async (n) => { upserts.push(n); return n; } };
const persisted = await persistSprintRun({ kb: mockKb, run: result.run });
eq(persisted, result.run,                                        'G · persistSprintRun retorna run');
eq(upserts.length, 1,                                            'G · upsert cridat');

// G2 · sense kb · null
const noKb = await persistSprintRun({ run: result.run });
eq(noKb, null,                                                   'G2 · sense kb · null');

// H · queryHistory · KB mock
const historyMockKb = {
    query: async ({ type }) => type === SPRINT_RUN_TYPE
        ? [
            { id: 'r-old', type: SPRINT_RUN_TYPE, content: { itemId: 'A', startTs: 100 } },
            { id: 'r-mid', type: SPRINT_RUN_TYPE, content: { itemId: 'B', startTs: 200 } },
            { id: 'r-new', type: SPRINT_RUN_TYPE, content: { itemId: 'A', startTs: 300 } },
        ] : [],
};
const history = await queryHistory({ kb: historyMockKb, limit: 10 });
eq(history.length, 3,                                            'H · 3 runs total');
eq(history[0].id, 'r-new',                                       'H · ordenat DESC per startTs');

// H2 · filter per itemId
const historyA = await queryHistory({ kb: historyMockKb, itemId: 'A' });
eq(historyA.length, 2,                                           'H2 · filter itemId A · 2');
t(historyA.every(r => r.content.itemId === 'A'),                 'H2 · tots són itemId A');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
