// SOCIAL-LAYER-001 · presence + messaging tests pure
import {
    computePresenceStatus, formatLastSeen, renderPresencePill,
    HEARTBEAT_INTERVAL_MS, ONLINE_THRESHOLD_MS, IDLE_THRESHOLD_MS,
    PRESENCE_STATUS,
} from '../core/presenceService.js';
import {
    buildMessage, threadIdFor,
    listInbox, listSent, listThread, listThreadBetween, listConversations,
    countUnread, markAsRead, markAsDelivered, validateMessage,
    DM_TYPE, DM_STATUS,
} from '../core/messagingService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== SOCIAL-LAYER-001 · presence + messaging ===\n');

// ─── PRESENCE ────────────────────────────────────────────────────────────

const NOW = 1700000000000;

// Status computation
eq(computePresenceStatus(NOW - 1000, { now: NOW }),        'online',  'A · 1s ago = online');
eq(computePresenceStatus(NOW - 60000, { now: NOW }),       'online',  'A · 1min ago = online');
eq(computePresenceStatus(NOW - 3 * 60000, { now: NOW }),   'idle',    'A · 3min ago = idle');
eq(computePresenceStatus(NOW - 25 * 60000, { now: NOW }),  'idle',    'A · 25min ago = idle');
eq(computePresenceStatus(NOW - 60 * 60000, { now: NOW }),  'offline', 'A · 60min ago = offline');
eq(computePresenceStatus(null, { now: NOW }),              'offline', 'A · null = offline');
eq(computePresenceStatus(NOW + 1000, { now: NOW }),        'offline', 'A · future = offline');

// formatLastSeen
eq(formatLastSeen(NOW - 30000, { now: NOW }), 'just ara',         'B · <1min = just ara');
eq(formatLastSeen(NOW - 5 * 60000, { now: NOW }), 'fa 5 min',     'B · 5min');
eq(formatLastSeen(NOW - 2 * 3600000, { now: NOW }), 'fa 2 h',     'B · 2h');
eq(formatLastSeen(NOW - 3 * 86400000, { now: NOW }), 'fa 3 d',    'B · 3d');
eq(formatLastSeen(null, { now: NOW }), 'mai vist',                'B · null = mai');

// renderPresencePill · escape + status
const pill = renderPresencePill(NOW - 30000, { now: NOW });
t(pill.includes('Online'),                                 'C · pill · Online label');
t(pill.includes('🟢'),                                     'C · pill · online emoji');
t(pill.includes('just ara'),                               'C · pill · last seen text');

const pillOff = renderPresencePill(null);
t(pillOff.includes('Offline'),                             'C · null · offline');

// Constants
t(HEARTBEAT_INTERVAL_MS === 30000,                         'A · heartbeat 30s');
t(ONLINE_THRESHOLD_MS === 2 * 60000,                       'A · online threshold 2min');
t(IDLE_THRESHOLD_MS === 30 * 60000,                        'A · idle threshold 30min');
t(PRESENCE_STATUS.online && PRESENCE_STATUS.idle && PRESENCE_STATUS.offline, 'A · 3 status defined');

// ─── MESSAGING ───────────────────────────────────────────────────────────

eq(DM_TYPE, 'direct_message',                              'D · DM_TYPE');
t(DM_STATUS.includes('sent') && DM_STATUS.includes('delivered') && DM_STATUS.includes('read'), 'D · status enum');

// threadIdFor · stable independent del sender
const t1 = threadIdFor('@alvaro', '@maria');
const t2 = threadIdFor('@maria', '@alvaro');
eq(t1, t2,                                                 'E · threadId stable (A→B = B→A)');
t(t1.startsWith('thread-'),                                'E · prefix thread-');
eq(threadIdFor(null, '@x'), null,                          'E · null handles · null');

// buildMessage · happy path
const msg = buildMessage({
    fromHandle: 'alvaro', toHandle: '@maria', text: 'Hola Maria',
    ts: 1700000000000,
});
eq(msg.type, DM_TYPE,                                      'F · type DM');
eq(msg.content.fromHandle, '@alvaro',                      'F · from normalitzat');
eq(msg.content.toHandle, '@maria',                         'F · to normalitzat');
eq(msg.content.text, 'Hola Maria',                         'F · text preservat');
t(msg.content.threadId.includes('alvaro'),                 'F · threadId conté handle');
eq(msg.content.status, 'sent',                             'F · default status sent');
t(msg.id.startsWith('dm-'),                                'F · id prefix dm-');

// buildMessage · errors
try { buildMessage({ toHandle: 'a', text: 'x' }); t(false, 'F · no from · throws'); }
catch (_) { t(true, 'F · no from · throws'); }
try { buildMessage({ fromHandle: 'a', text: 'x' }); t(false, 'F · no to · throws'); }
catch (_) { t(true, 'F · no to · throws'); }
try { buildMessage({ fromHandle: 'a', toHandle: 'a', text: 'x' }); t(false, 'F · self · throws'); }
catch (_) { t(true, 'F · self · throws'); }
try { buildMessage({ fromHandle: 'a', toHandle: 'b', text: '' }); t(false, 'F · empty · throws'); }
catch (_) { t(true, 'F · empty text · throws'); }
try { buildMessage({ fromHandle: 'a', toHandle: 'b', text: 'x'.repeat(2001) }); t(false, 'F · too long · throws'); }
catch (_) { t(true, 'F · text too long · throws'); }

// Build some messages for query tests
const msgs = [
    buildMessage({ fromHandle: '@alvaro', toHandle: '@maria', text: 'Hola', ts: 1000 }),
    buildMessage({ fromHandle: '@maria',  toHandle: '@alvaro', text: 'Hola Alvaro', ts: 2000 }),
    buildMessage({ fromHandle: '@alvaro', toHandle: '@maria', text: 'Com va?', ts: 3000 }),
    buildMessage({ fromHandle: '@alvaro', toHandle: '@bob',   text: 'Hola Bob', ts: 4000 }),
    buildMessage({ fromHandle: '@bob',    toHandle: '@alvaro', text: 'Hola Alvaro', ts: 5000 }),
];

// listInbox
const inbox = listInbox(msgs, '@alvaro');
eq(inbox.length, 2,                                        'G · alvaro inbox · 2 (maria + bob)');
// Newest first
eq(inbox[0].content.fromHandle, '@bob',                    'G · newest first · @bob (ts 5000)');

const inboxMaria = listInbox(msgs, '@maria');
eq(inboxMaria.length, 2,                                   'G · maria inbox · 2 from alvaro');

// listSent
const sentByAlvaro = listSent(msgs, '@alvaro');
eq(sentByAlvaro.length, 3,                                 'G · alvaro sent · 3 (2 maria + 1 bob)');

// listThread
const thread = listThread(msgs, threadIdFor('@alvaro', '@maria'));
eq(thread.length, 3,                                       'H · thread alvaro+maria · 3 msgs');
// Oldest first (chat order)
eq(thread[0].createdAt, 1000,                              'H · oldest first');
eq(thread[2].createdAt, 3000,                              'H · newest last');

// listThreadBetween (helper)
const t3 = listThreadBetween(msgs, '@alvaro', '@maria');
eq(t3.length, 3,                                           'H · listThreadBetween coincideix');

// listConversations
const convs = listConversations(msgs, '@alvaro');
eq(convs.length, 2,                                        'I · 2 conversations (maria + bob)');
eq(convs[0].peerHandle, '@bob',                            'I · most recent thread · @bob');
eq(convs[1].peerHandle, '@maria',                          'I · second thread · @maria');
t(convs[0].lastMessage.createdAt === 5000,                 'I · last message ts');
t(convs[1].totalCount === 3,                               'I · maria thread · 3 msgs');

// countUnread
const unread = countUnread(msgs, '@alvaro');
eq(unread, 2,                                              'J · 2 unread (status sent · target alvaro)');

// markAsRead · pure · no muta original
const m0 = msgs[1];   // Maria → Alvaro
const read = markAsRead(m0);
eq(read.content.status, 'read',                            'K · read status set');
eq(m0.content.status, 'sent',                              'K · original unchanged');

// markAsRead idempotent
const read2 = markAsRead(read);
eq(read2.content.status, 'read',                           'K · idempotent');

// markAsDelivered
const delivered = markAsDelivered(msgs[0]);
eq(delivered.content.status, 'delivered',                  'K · delivered status');

// validateMessage
eq(validateMessage(msgs[0]).ok, true,                      'L · valid msg ok');
eq(validateMessage(null).ok, false,                        'L · null fail');
eq(validateMessage({ type: 'foo' }).ok, false,             'L · wrong type fail');
const badMsg = { type: DM_TYPE, content: { fromHandle: 'a' }, id: 'x', createdAt: 1 };
const v = validateMessage(badMsg);
eq(v.ok, false,                                            'L · missing fields fail');
t(v.errors.length > 0,                                     'L · errors populated');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
