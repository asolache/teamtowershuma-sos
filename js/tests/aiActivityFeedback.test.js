// =============================================================================
// aiActivityFeedback.test.js · AI-FEEDBACK sprint A · pure formatters
// =============================================================================

import {
    ACTIVITY_LEVELS, levelColor,
    formatActivityEvent, formatActivityEntries,
    summarizeActivity, renderActivityEntryHtml,
    THINKING_PULSE_CSS,
} from '../core/aiActivityFeedback.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

// ─── A · constants ────────────────────────────────────────────────────────
t(ACTIVITY_LEVELS.includes('thinking'),                           'A · thinking level');
t(ACTIVITY_LEVELS.includes('ok'),                                 'A · ok level');
t(ACTIVITY_LEVELS.includes('err'),                                'A · err level');
t(typeof levelColor('thinking') === 'string',                     'A · levelColor returns string');
eq(levelColor('thinking'), '#a855f7',                             'A · thinking purple');
eq(levelColor('ok'), '#22c55e',                                   'A · ok green');
eq(levelColor('err'), '#ef4444',                                  'A · err red');
eq(levelColor('unknown'), levelColor('info'),                     'A · unknown fallback to info');

// ─── B · improvement-loop events ─────────────────────────────────────────
const cyc = formatActivityEvent({ kind: 'cycle-start', iteration: 3, sopId: 's2', sopTitle: 'Setup ledger' });
eq(cyc.icon, '🔁',                                                'B · cycle-start icon');
t(cyc.title.includes('iter 3'),                                   'B · title amb iter 3');
t(cyc.detail.includes('Setup ledger'),                            'B · detail amb sopTitle');
eq(cyc.nodeRef, 's2',                                             'B · nodeRef sopId');
eq(cyc.level, 'info',                                             'B · level info');

const runStart = formatActivityEvent({ kind: 'runner-start', sopTitle: 'Setup ledger', iteration: 3, attempt: 2 });
eq(runStart.icon, '🤖',                                           'B · runner-start icon');
t(runStart.title.includes('Pensant'),                             'B · title Pensant');
t(runStart.detail.includes('Setup ledger'),                       'B · detail sopTitle');
t(runStart.detail.includes('iter 3'),                             'B · detail iter');
t(runStart.detail.includes('intent 2'),                           'B · detail attempt');
eq(runStart.level, 'thinking',                                    'B · level thinking');

const woExec = formatActivityEvent({ kind: 'wo-executed', woId: 'wo-1', outputLen: 540, costEur: 0.023, attempt: 1 });
eq(woExec.level, 'ok',                                            'B · wo-executed level ok');
t(woExec.detail.includes('540'),                                  'B · detail length chars');
t(woExec.detail.includes('€0.0230'),                              'B · detail cost');

const woFail = formatActivityEvent({ kind: 'wo-failed', woId: 'wo-2', error: 'empty-output' });
eq(woFail.level, 'err',                                           'B · wo-failed err');
t(woFail.detail.includes('empty-output'),                         'B · detail error msg');

const ana = formatActivityEvent({ kind: 'analyzed', enrichments: 4, score: 78, mentionsCount: 9 });
eq(ana.icon, '🔍',                                                'B · analyzed icon');
t(ana.detail.includes('78/100'),                                  'B · score formatted');
t(ana.detail.includes('4 enrichments'),                           'B · enrichments count');
t(ana.detail.includes('9 mencions'),                              'B · mencions count');

const enrApp = formatActivityEvent({ kind: 'enrichments-applied', mutations: 5 });
eq(enrApp.icon, '🌱',                                             'B · enrichments-applied icon');
t(enrApp.detail.includes('5 mutacions'),                          'B · 5 mutacions');

const woBuilt = formatActivityEvent({ kind: 'wo-built', woId: 'wo-x', contextCount: 3 });
t(woBuilt.detail.includes('darrers 3'),                           'B · wo-built context info');

// ─── C · swarm events ────────────────────────────────────────────────────
const lvl = formatActivityEvent({ kind: 'level-start', level: 1, deliverableIds: ['d-code', 'd-mockup'], roleLabels: ['Coder', 'Designer'] });
eq(lvl.icon, '⚡',                                                'C · level-start icon');
t(lvl.title.includes('Level 1'),                                  'C · title Level 1');
t(lvl.title.includes('2 deliverables'),                           'C · count');
t(lvl.detail.includes('d-code'),                                  'C · detail deliverables');
t(lvl.detail.includes('Coder'),                                   'C · detail roles');

const delStart = formatActivityEvent({ kind: 'deliverable-start', deliverableId: 'd-code', roleLabel: 'Coder', upstreamCount: 2 });
eq(delStart.icon, '🤖',                                           'C · deliverable-start icon');
t(delStart.title.includes('d-code'),                              'C · title id');
t(delStart.detail.includes('Coder'),                              'C · detail role');
t(delStart.detail.includes('2 upstream'),                         'C · upstream context');
eq(delStart.level, 'thinking',                                    'C · level thinking');

const delDone = formatActivityEvent({ kind: 'deliverable-done', id: 'd-plan', level: 0, costEur: 0.05, signed: true });
eq(delDone.icon, '✓',                                             'C · deliverable-done icon');
t(delDone.detail.includes('Level 0'),                             'C · detail level');
t(delDone.detail.includes('€0.0500'),                             'C · cost format');
t(delDone.detail.includes('signat'),                              'C · signed badge');

const delFail = formatActivityEvent({ kind: 'deliverable-fail', id: 'd-broken', level: 2, error: 'runner-throw' });
eq(delFail.level, 'err',                                          'C · deliverable-fail err');
t(delFail.detail.includes('runner-throw'),                        'C · detail error');

const budget = formatActivityEvent({ kind: 'budget-exceeded', totalCostEur: 5.123 });
eq(budget.icon, '💸',                                             'C · budget icon');
eq(budget.level, 'warn',                                          'C · budget warn');
t(budget.detail.includes('€5.1230'),                              'C · cost format');

// ─── D · generic events ──────────────────────────────────────────────────
const ls = formatActivityEvent({ kind: 'loop-start', iterations: 5 });
eq(ls.icon, '▶',                                                  'D · loop-start icon');
t(ls.detail.includes('5'),                                        'D · iterations');

const le = formatActivityEvent({ kind: 'loop-end', ok: true, iterations: 3, totalEnrichments: 8, mutations: 12, errors: 0 });
eq(le.icon, '🎉',                                                 'D · loop-end ok icon');
eq(le.level, 'ok',                                                'D · loop-end ok level');
t(le.detail.includes('3 iteracions'),                             'D · 3 iter');
t(le.detail.includes('8 enrichments'),                            'D · enrichments');
t(le.detail.includes('12 mutacions'),                             'D · mutations');

const leFail = formatActivityEvent({ kind: 'loop-end', ok: false, iterations: 2, errors: 1 });
eq(leFail.icon, '⚠',                                              'D · loop-end fail icon');
eq(leFail.level, 'warn',                                          'D · loop-end fail warn');

const msg = formatActivityEvent({ kind: 'message', icon: '⏳', title: 'Carregant', detail: 'subset…', level: 'thinking' });
t(msg.icon === '⏳' && msg.title === 'Carregant',                 'D · message custom icon+title');
eq(msg.level, 'thinking',                                         'D · message level passed');

const err = formatActivityEvent({ kind: 'error', error: 'KB unavailable' });
eq(err.icon, '💥',                                                'D · error icon');
eq(err.level, 'err',                                              'D · error level');
t(err.detail.includes('KB unavailable'),                          'D · error msg');

// ─── E · fallbacks ────────────────────────────────────────────────────────
const unk = formatActivityEvent({ kind: 'random-kind', foo: 'bar', count: 7 });
t(unk.title.includes('random-kind'),                              'E · unknown title = kind');
t(unk.detail.includes('foo=bar'),                                 'E · detail key=value');
t(unk.detail.includes('count=7'),                                 'E · detail num');

const empty = formatActivityEvent({});
t(typeof empty === 'object' && empty.icon,                        'E · empty object · safe');
const nullEv = formatActivityEvent(null);
t(typeof nullEv === 'object',                                     'E · null event · safe');
eq(nullEv.level, 'warn',                                          'E · null · level warn');

// ─── F · formatActivityEntries · batch ────────────────────────────────────
const batch = formatActivityEntries([
    { kind: 'cycle-start', iteration: 1, sopId: 's1', sopTitle: 'Title1' },
    { kind: 'runner-start', sopTitle: 'Title1', iteration: 1 },
    { kind: 'wo-executed', outputLen: 200 },
    { kind: 'analyzed', score: 70, enrichments: 2, mentionsCount: 5 },
]);
eq(batch.length, 4,                                               'F · 4 entries');
eq(batch[0].icon, '🔁',                                           'F · 0 cycle-start');
eq(batch[1].level, 'thinking',                                    'F · 1 thinking');
eq(batch[2].level, 'ok',                                          'F · 2 ok');

eq(formatActivityEntries([]).length, 0,                           'F · empty array');
eq(formatActivityEntries(null).length, 0,                         'F · null safe');

// ─── G · summarizeActivity ───────────────────────────────────────────────
const sum = summarizeActivity([
    { kind: 'cycle-start', iteration: 1, sopId: 's1' },
    { kind: 'runner-start', sopTitle: 'X', iteration: 1 },
    { kind: 'wo-executed', outputLen: 100 },
    { kind: 'analyzed', score: 60, enrichments: 1 },
]);
eq(sum.totalEvents, 4,                                            'G · total 4');
t(sum.thinking !== null && sum.thinking.icon === '🤖',            'G · thinking captured');
t(sum.lastOk !== null,                                            'G · lastOk captured');
eq(sum.lastErr, null,                                             'G · sense errors');

const sumErr = summarizeActivity([
    { kind: 'runner-start' },
    { kind: 'wo-failed', error: 'boom' },
]);
t(sumErr.lastErr !== null && sumErr.lastErr.level === 'err',      'G · lastErr captured');

eq(summarizeActivity([]).totalEvents, 0,                          'G · empty · 0');
eq(summarizeActivity(null).totalEvents, 0,                        'G · null safe');

// ─── H · renderActivityEntryHtml ─────────────────────────────────────────
const entry = formatActivityEvent({ kind: 'runner-start', sopTitle: 'Test SOP', iteration: 2 });
const html = renderActivityEntryHtml(entry);
t(html.includes('Pensant'),                                       'H · html · title');
t(html.includes('Test SOP'),                                      'H · html · detail');
t(html.includes('animation:ai-pulse'),                            'H · html · thinking pulse animation');
t(html.includes('border-left'),                                   'H · html · color border');

const entryOk = formatActivityEvent({ kind: 'analyzed', score: 80, enrichments: 5 });
const htmlOk = renderActivityEntryHtml(entryOk);
t(!htmlOk.includes('animation:ai-pulse'),                         'H · ok · sense pulse animation');

// HTML escape
const evil = formatActivityEvent({ kind: 'message', title: '<script>alert(1)</script>', detail: 'safe' });
const htmlEvil = renderActivityEntryHtml(evil);
t(!htmlEvil.includes('<script>alert'),                            'H · escape · sense raw <script>');
t(htmlEvil.includes('&lt;script&gt;'),                            'H · escape · entities aplicades');

// Node badge
const entryNode = formatActivityEvent({ kind: 'cycle-start', iteration: 1, sopId: 'sop-very-long-id-truncated', sopTitle: 'Long SOP Title' });
const htmlNode = renderActivityEntryHtml(entryNode);
t(htmlNode.includes('Long SOP Title'),                            'H · node badge · sopTitle preferit');

eq(renderActivityEntryHtml(null), '',                             'H · null · empty');

// ─── I · CSS export ──────────────────────────────────────────────────────
t(typeof THINKING_PULSE_CSS === 'string' && THINKING_PULSE_CSS.includes('ai-pulse'),
                                                                  'I · CSS exporta keyframes ai-pulse');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
