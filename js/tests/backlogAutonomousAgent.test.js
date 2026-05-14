// TDD-AGENT sprint A · tests stand-alone per backlogAutonomousAgent.
// Ús: node js/tests/backlogAutonomousAgent.test.js

import {
    runUntilGreen, dryRun, buildAgentRunNode, pickNextRed, estimateRunCost,
    AGENT_RUN_TYPE,
} from '../core/backlogAutonomousAgent.js';
import { defaultEvaluator } from '../core/aiEvaluatorService.js';

const accept = defaultEvaluator();   // ok si text no buit

let pass = 0, fail = 0;
function t(cond, msg) { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } }
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== TDD-AGENT · backlogAutonomousAgent ===\n');

// Helpers · fixture items + mock runners
const mkItem = (id, complexity = 'S', priority = 'medium', status = 'pending') => ({
    id, title: 'Test ' + id, description: 'desc', status, priority, complexity,
    dependencies: [], principles: ['principle-1-nodes'],
    testRequirements: [], suggestedFiles: [],
});

const greenRunner = async (prompt) => ({
    text: 'output green · accepta el evaluator default',
    usage: { inputTokens: 100, outputTokens: 50 },
    modelKey: 'anthropic/sonnet-4.6',
});

const emptyRunner = async () => ({
    text: '',   // defaultEvaluator rebutja
    usage: { inputTokens: 50, outputTokens: 0 },
    modelKey: 'anthropic/sonnet-4.6',
});

const throwingRunner = async () => { throw new Error('IA down'); };

// A · constants
eq(AGENT_RUN_TYPE, 'autonomous_agent_run',                       'A · AGENT_RUN_TYPE constant');

// B · runUntilGreen · 2 items · ambdós verds
const items_B = [mkItem('a'), mkItem('b')];
const resB = await runUntilGreen({ items: items_B, runner: greenRunner, evaluator: accept, maxIterations: 10 });
eq(resB.completedCount, 2,                                       'B · 2 items completats verds');
eq(resB.attemptedCount, 2,                                       'B · 2 intents');
eq(resB.iterationsRun, 2,                                        'B · 2 iteracions');
eq(resB.greenItems.length, 2,                                    'B · 2 greenItems');
eq(resB.failedItems.length, 0,                                   'B · 0 failedItems');
eq(resB.skippedItems.length, 0,                                  'B · res skippet');

// B2 · workingBacklog · items completed
t(resB.workingBacklog.every(i => i.status === 'completed'),      'B2 · workingBacklog · tots completed');
t(resB.workingBacklog.every(i => !!i.completedAt),               'B2 · completedAt setat');

// C · runUntilGreen · evaluator que rebutja · res green
const items_C = [mkItem('c1'), mkItem('c2')];
const rejectEval = async () => ({ ok: false, reason: 'too short' });
const resC = await runUntilGreen({ items: items_C, runner: greenRunner, evaluator: rejectEval, maxIterations: 10 });
eq(resC.completedCount, 0,                                       'C · 0 completats');
eq(resC.attemptedCount, 2,                                       'C · 2 intents');
eq(resC.failedItems.length, 2,                                   'C · 2 failedItems');

// D · runUntilGreen · maxIterations cap
const items_D = [mkItem('d1'), mkItem('d2'), mkItem('d3'), mkItem('d4')];
const resD = await runUntilGreen({ items: items_D, runner: greenRunner, evaluator: rejectEval, maxIterations: 2 });
eq(resD.iterationsRun, 2,                                        'D · respecta maxIterations=2');
t(resD.skippedItems.length >= 2,                                 'D · 2+ items skippets');

// E · runUntilGreen · budgetEur exhaurit · stops early
// Cost per run · 100·input * $3/1M + 50·output * $15/1M ≈ $0.0011 ≈ €0.001
// Per a forçar budget exhausted amb 2 runs, baixem budget a €0.0005
const items_E = [mkItem('e1'), mkItem('e2'), mkItem('e3')];
const resE = await runUntilGreen({
    items: items_E, runner: greenRunner, evaluator: accept, maxIterations: 10, budgetEur: 0.0005,
});
t(resE.budgetExhausted,                                          'E · budgetExhausted=true');
t(resE.iterationsRun <= 2,                                        'E · stops abans del 3r run (budget out)');
t(resE.totalCostEur >= 0.0005 || resE.iterationsRun <= 2,        'E · totalCostEur ≥ budget OR stopped');

// F · runUntilGreen · runner que throw · capturat com a red · no crash
const items_F = [mkItem('f1'), mkItem('f2')];
const resF = await runUntilGreen({ items: items_F, runner: throwingRunner, maxIterations: 10 });
eq(resF.completedCount, 0,                                       'F · 0 verds quan runner throw');
eq(resF.failedItems.length, 2,                                   'F · 2 fallits');
t(resF.results[0].evalReason.includes('runner-error') || resF.results[0].evalReason.includes('IA down'),
                                                                 'F · evalReason inclou runner-error');

// G · empty output · defaultEvaluator rebutja
const items_G = [mkItem('g1')];
const resG = await runUntilGreen({ items: items_G, runner: emptyRunner, maxIterations: 5 });
eq(resG.failedItems.length, 1,                                   'G · empty output · rejected');
t(resG.results[0].evalReason && resG.results[0].evalReason.includes('empty-output'),
                                                                 'G · evalReason · empty-output');

// H · prioritzat order · high abans de low
const items_H = [
    mkItem('low-1',  'S', 'low'),
    mkItem('high-1', 'S', 'high'),
    mkItem('med-1',  'S', 'medium'),
];
const orderLog = [];
const orderRunner = async (prompt) => {
    const m = prompt.userPrompt.match(/\*\*id\*\*:\s*`([^`]+)`/);
    orderLog.push(m ? m[1] : 'unknown');
    return greenRunner(prompt);
};
await runUntilGreen({ items: items_H, runner: orderRunner, evaluator: accept, maxIterations: 5 });
eq(orderLog[0], 'high-1',                                        'H · high primer');
t(orderLog.indexOf('med-1') < orderLog.indexOf('low-1'),         'H · med abans de low');

// I · onIteration callback
const events = [];
const items_I = [mkItem('i1'), mkItem('i2')];
await runUntilGreen({
    items: items_I, runner: greenRunner, evaluator: accept,
    onIteration: (ev) => events.push(ev),
    maxIterations: 5,
});
eq(events.length, 2,                                              'I · onIteration cridat 2 cops');
t(events[0].itemId === 'i1' && events[0].status === 'green',     'I · 1r event · i1 green');

// J · persist kb mock · upserts cada run
const upserts = [];
const items_J = [mkItem('j1')];
const kbMock = { upsert: async (n) => { upserts.push(n); return n; } };
await runUntilGreen({
    items: items_J, runner: greenRunner, evaluator: accept, kb: kbMock, persist: true, maxIterations: 5,
});
t(upserts.length >= 1,                                            'J · KB upsert cridat (sprint_run)');
t(upserts[0].type === 'sprint_run',                               'J · upsert type sprint_run');

// K · dryRun · pure · sense IA · count + estimated hours
const dry = dryRun([mkItem('d1', 'S'), mkItem('d2', 'M'), mkItem('d3', 'L')]);
eq(dry.queueLength, 3,                                            'K · dryRun queue length 3');
eq(dry.estimatedHoursIfManual, 24,                                'K · hours sum · 2+6+16=24');
t(dry.nextItem && dry.nextItem.id === 'd1',                       'K · nextItem · primer per priority');

// L · buildAgentRunNode · empaqueta result
const node = buildAgentRunNode({
    completedCount: 2, attemptedCount: 3, iterationsRun: 3, totalCostEur: 0.05,
    budgetExhausted: false, greenItems: ['a', 'b'], failedItems: ['c'],
    results: [
        { itemId: 'a', status: 'green', modelKey: 'anthropic/sonnet-4.6' },
        { itemId: 'b', status: 'green', modelKey: 'anthropic/sonnet-4.6' },
        { itemId: 'c', status: 'red',   modelKey: 'openai/gpt-4o' },
    ],
    log: [{ ts: 100 }, { ts: 200 }],
});
eq(node.type, AGENT_RUN_TYPE,                                     'L · node type correcte');
eq(node.content.completedCount, 2,                                'L · completedCount al content');
t(node.keywords.includes('green:2'),                              'L · keyword green:2');
t(node.keywords.includes('red:1'),                                'L · keyword red:1');
eq(node.content.resultsSummary.length, 3,                         'L · 3 results al summary');

// M · pickNextRed · primer pending
const items_M = [
    { id: 'a', status: 'completed', priority: 'high', complexity: 'S' },
    { id: 'b', status: 'pending',   priority: 'low',  complexity: 'S' },
    { id: 'c', status: 'pending',   priority: 'high', complexity: 'S' },
];
const next = pickNextRed(items_M);
eq(next.id, 'c',                                                  'M · pickNextRed · c (high) primer');

// M2 · sense pendents · null
const nones = pickNextRed([{ id: 'a', status: 'completed' }]);
eq(nones, null,                                                   'M2 · sense pendents · null');

// N · estimateRunCost · model conegut amb usage
const cost = estimateRunCost({
    content: { modelKey: 'anthropic/sonnet-4.6', usage: { inputTokens: 1_000_000, outputTokens: 1_000_000 } },
});
t(cost > 0,                                                       'N · cost > 0 amb tokens reals');
// Sense modelKey · 0
eq(estimateRunCost({ content: { usage: { inputTokens: 100 } } }), 0,
                                                                  'N · sense modelKey · 0');
// run null · 0
eq(estimateRunCost(null), 0,                                      'N · run null · 0');

// O · all-green early stop · si tots completed, loop acaba immediat
const items_O = [
    { id: 'o1', status: 'completed', priority: 'high', complexity: 'S' },
    { id: 'o2', status: 'completed', priority: 'high', complexity: 'S' },
];
const resO = await runUntilGreen({ items: items_O, runner: greenRunner, maxIterations: 10 });
eq(resO.attemptedCount, 0,                                        'O · all-green start · 0 attempts');
eq(resO.iterationsRun, 0,                                         'O · 0 iterations');

// P · evaluator custom that uses item context (TDD-style)
const items_P = [
    { ...mkItem('contains'), tddCheck: 'contains:hello' },
    { ...mkItem('miss'),     tddCheck: 'contains:world' },
];
const tddEval = async (output, item) => {
    if (!item.tddCheck) return { ok: true };
    const m = item.tddCheck.match(/^contains:(.+)$/);
    if (m && output.text.includes(m[1])) return { ok: true, score: 1 };
    return { ok: false, reason: 'tdd-fail: ' + item.tddCheck };
};
const helloRunner = async () => ({ text: 'this output says hello!', usage: { inputTokens: 10, outputTokens: 10 }, modelKey: 'mock' });
const resP = await runUntilGreen({ items: items_P, runner: helloRunner, evaluator: tddEval, maxIterations: 5 });
eq(resP.greenItems.length, 1,                                     'P · TDD eval · 1 green (contains:hello)');
eq(resP.failedItems.length, 1,                                    'P · 1 red (contains:world miss)');
t(resP.results.find(r => r.itemId === 'miss').evalReason.includes('tdd-fail'),
                                                                  'P · failed reason · tdd-fail');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
