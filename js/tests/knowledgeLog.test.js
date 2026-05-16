// Knowledge LOG · workflow IA-humà · audit trail
import {
    parseLog, validateEntry, buildEntry, formatEntry, getStats,
    VALID_STATUSES, VALID_ALVARO_ACTIONS, LOG_VERSION,
} from '../core/knowledgeLogService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== Knowledge LOG ===\n');

// ─── A · constants ────────────────────────────────────────────────────────
eq(LOG_VERSION, 'v1',                                    'A · version v1');
t(VALID_STATUSES.includes('proposed'),                   'A · status proposed');
t(VALID_STATUSES.includes('approved'),                   'A · status approved');
t(VALID_STATUSES.includes('reverted'),                   'A · status reverted');
t(VALID_ALVARO_ACTIONS.includes('merge'),                'A · action merge');

// ─── B · parseLog · happy path ────────────────────────────────────────────
const md = `
## 2026-05-17 · IA-Claude · proposed
- what: "Test entry"
- why:  "Test reason"
- files:
    - path/a.md
    - path/b.js
- pr: branch-x
- alvaro_action_required: merge
`;
const parsed = parseLog(md);
eq(parsed.length, 1,                                     'B · 1 entry parsejada');
eq(parsed[0].date, '2026-05-17',                         'B · date correcta');
eq(parsed[0].who, 'IA-Claude',                           'B · who correct');
eq(parsed[0].status, 'proposed',                         'B · status correct');
eq(parsed[0].what, 'Test entry',                         'B · what correct');
eq(parsed[0].files.length, 2,                            'B · 2 files');
eq(parsed[0].pr, 'branch-x',                             'B · pr correct');

// ─── C · validateEntry · OK + errors ─────────────────────────────────────
const okEntry = { date: '2026-05-17', who: 'IA-Claude', what: 'test what', why: 'test why', files: ['a.md'], status: 'proposed' };
t(validateEntry(okEntry).ok,                             'C · valid entry');

const badDate = { ...okEntry, date: 'bad' };
t(!validateEntry(badDate).ok,                            'C · bad date · invalid');

const noWhat = { ...okEntry, what: '' };
t(!validateEntry(noWhat).ok,                             'C · empty what · invalid');

const badStatus = { ...okEntry, status: 'unknown' };
t(!validateEntry(badStatus).ok,                          'C · bad status · invalid');

const approvedNoMerged = { ...okEntry, status: 'approved' };
t(!validateEntry(approvedNoMerged).ok,                  'C · approved sense merged_at · invalid');

// ─── D · buildEntry · defaults sensats ──────────────────────────────────
const built = buildEntry({ what: 'X', why: 'Y', files: ['f.md'] });
t(built.date && /^\d{4}-\d{2}-\d{2}$/.test(built.date),  'D · date auto-generada');
eq(built.who, 'IA-Claude',                               'D · default who');
eq(built.status, 'proposed',                             'D · default status');
eq(built.alvaro_action_required, 'merge',                'D · default action merge');

// ─── E · buildEntry · approved auto-omple merged_at ─────────────────────
const approved = buildEntry({ what: 'X', why: 'Y', files: ['f.md'], status: 'approved' });
t(approved.merged_at,                                    'E · approved auto-merged_at');
eq(approved.alvaro_action_required, null,                'E · approved sense action pendent');

// ─── F · formatEntry · roundtrip parse→format ────────────────────────────
const entry = { date: '2026-05-17', who: 'IA-Claude', status: 'proposed', what: 'X', why: 'Y', files: ['a.md', 'b.js'], pr: 'br', alvaro_action_required: 'merge', merged_at: null };
const formatted = formatEntry(entry);
t(formatted.includes('## 2026-05-17 · IA-Claude · proposed'), 'F · header format');
t(formatted.includes('- what: "X"'),                     'F · what line');
t(formatted.includes('- files:'),                        'F · files header');
t(formatted.includes('    - a.md'),                      'F · file indented');
t(formatted.includes('- pr: br'),                        'F · pr line');

// Roundtrip
const reparsed = parseLog(formatted);
eq(reparsed.length, 1,                                   'F · roundtrip · 1 entry');
eq(reparsed[0].what, 'X',                                'F · roundtrip · what');
eq(reparsed[0].files.length, 2,                          'F · roundtrip · 2 files');

// ─── G · getStats · agregació ────────────────────────────────────────────
const entries = [
    { date: '2026-05-15', who: 'IA-Claude', status: 'approved', what: 'x', files: ['a'] },
    { date: '2026-05-16', who: 'IA-Claude', status: 'proposed', what: 'y', files: ['b'] },
    { date: '2026-05-17', who: '@alvaro',   status: 'approved', what: 'z', files: ['c'] },
];
const stats = getStats(entries);
eq(stats.total, 3,                                       'G · total 3');
eq(stats.byStatus.approved, 2,                           'G · 2 approved');
eq(stats.byStatus.proposed, 1,                           'G · 1 proposed');
eq(stats.byWho['IA-Claude'], 2,                          'G · IA-Claude 2');
eq(stats.latestDate, '2026-05-17',                       'G · latest date');
eq(stats.pendingActions, 1,                              'G · 1 pending action');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
