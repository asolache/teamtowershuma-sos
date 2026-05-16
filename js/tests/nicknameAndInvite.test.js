// SOCIAL-IDENTITY-001 + SOCIAL-INVITE-001 tests
import {
    normalizeHandle, validateHandleSyntax,
    isHandleTakenInList, suggestAlternatives, checkHandleAvailability,
    HANDLE_MIN_LENGTH, HANDLE_MAX_LENGTH,
} from '../core/nicknameRegistryService.js';
import {
    buildInvite, acceptInvite, declineInvite,
    listInvitesForUser, listInvitesSent, listInvitesForProject,
    countPendingForUser, resolveStatus, validateInvite,
    PROJECT_INVITE_TYPE, INVITE_STATUS, INVITE_ROLES,
} from '../core/projectInviteService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== NICKNAME REGISTRY + PROJECT INVITES ===\n');

// ─── NICKNAME ────────────────────────────────────────────────────────────

// normalize
eq(normalizeHandle('@Maria'), 'maria',                   'A · @ stripped + lower');
eq(normalizeHandle('JOAN'), 'joan',                      'A · ALLCAPS → lower');
eq(normalizeHandle('  spaced  '), 'spaced',              'A · trimmed');
eq(normalizeHandle(null), null,                          'A · null safe');

// validateHandleSyntax · OK cases
eq(validateHandleSyntax('alvaro').ok, true,              'B · valid · alvaro');
eq(validateHandleSyntax('@alvaro').ok, true,             'B · with @ ok');
eq(validateHandleSyntax('user_2026').ok, true,           'B · underscore ok');
eq(validateHandleSyntax('user-x').ok, true,              'B · dash ok');
eq(validateHandleSyntax('abc').ok, true,                 'B · min 3');

// validateHandleSyntax · FAIL
eq(validateHandleSyntax('ab').ok, false,                 'B · too short fail');
eq(validateHandleSyntax('x'.repeat(31)).ok, false,       'B · too long fail');
eq(validateHandleSyntax('with space').ok, false,         'B · space fail');
eq(validateHandleSyntax('user@email').ok, false,         'B · @ in middle fail');
eq(validateHandleSyntax('').ok, false,                   'B · empty fail');
eq(validateHandleSyntax('admin').ok, false,              'B · reserved · admin');
eq(validateHandleSyntax('claude').ok, false,             'B · reserved · claude');
eq(validateHandleSyntax('-startsdash').ok, false,        'B · starts dash fail');

// isHandleTakenInList
const entries = [
    { id: 'r1', type: 'public_registry_entry', content: { handle: '@maria', did: 'did:maria' }, arweaveTxId: 'tx1' },
    { id: 'r2', type: 'public_registry_entry', content: { handle: 'bob',   did: 'did:bob' } },
];
eq(isHandleTakenInList({ handle: 'maria', entries }).taken, true,    'C · maria taken');
eq(isHandleTakenInList({ handle: '@MARIA', entries }).taken, true,   'C · case-insensitive');
eq(isHandleTakenInList({ handle: 'bob', entries }).taken, true,      'C · bob taken (no @ stored)');
eq(isHandleTakenInList({ handle: 'free', entries }).taken, false,    'C · free available');

const taken = isHandleTakenInList({ handle: 'maria', entries });
eq(taken.byDid, 'did:maria',                             'C · byDid');
eq(taken.bySource, 'permaweb',                           'C · permaweb source (arweaveTxId)');

const localTaken = isHandleTakenInList({ handle: 'bob', entries });
eq(localTaken.bySource, 'local',                         'C · local source');

// exceptDid · skip
const skip = isHandleTakenInList({ handle: 'maria', entries, exceptDid: 'did:maria' });
eq(skip.taken, false,                                    'C · exceptDid skip self');

// suggestAlternatives
const sugg = suggestAlternatives({ handle: 'maria', entries });
t(sugg.length >= 3,                                      'D · ≥3 suggestions');
t(sugg.every(s => s.startsWith('@')),                    'D · suggestions amb @ prefix');
t(!sugg.includes('@maria'),                              'D · cap suggerència és el taken');

// checkHandleAvailability · syntax fail
const r1 = await checkHandleAvailability({ handle: '@ab' });
eq(r1.ok, false,                                         'E · short syntax fail');
eq(r1.status, 'invalid-syntax',                          'E · status invalid-syntax');

const r2 = await checkHandleAvailability({ handle: 'admin' });
eq(r2.status, 'reserved',                                'E · reserved status');

// checkHandleAvailability · with KB mock
const mockKb = {
    query: async ({ type }) => type === 'public_registry_entry' ? entries : [],
};
const r3 = await checkHandleAvailability({ handle: 'maria', kb: mockKb });
eq(r3.ok, false,                                         'E · taken-permaweb · ok false');
eq(r3.status, 'taken-permaweb',                          'E · status taken-permaweb');
t(Array.isArray(r3.suggestions),                         'E · suggestions provided');

const r4 = await checkHandleAvailability({ handle: 'newone', kb: mockKb });
eq(r4.ok, true,                                          'E · newone available · ok');
eq(r4.status, 'available',                               'E · status available');
eq(r4.normalized, '@newone',                             'E · normalized format');

// ─── INVITE ─────────────────────────────────────────────────────────────

eq(PROJECT_INVITE_TYPE, 'project_invite',                'F · type');
t(Array.isArray(INVITE_STATUS) && INVITE_STATUS.includes('pending'), 'F · status enum');
t(INVITE_ROLES.collab && INVITE_ROLES.view && INVITE_ROLES.admin, 'F · 3 roles');

// buildInvite happy
const inv = buildInvite({
    projectId: 'proj-x',
    fromHandle: '@alvaro',
    toHandle: 'maria',
    role: 'collab',
    message: 'Vols col·laborar?',
    ts: 1700000000000,
});
eq(inv.type, PROJECT_INVITE_TYPE,                        'G · type set');
eq(inv.content.fromHandle, '@alvaro',                    'G · from norm');
eq(inv.content.toHandle, '@maria',                       'G · to norm');
eq(inv.content.role, 'collab',                           'G · role');
eq(inv.content.status, 'pending',                        'G · default pending');
t(typeof inv.content.expiresAt === 'number',             'G · expiresAt set');
t(inv.content.expiresAt > inv.createdAt,                 'G · expires in future');

// errors
try { buildInvite({ projectId: 'p', fromHandle: 'a' }); t(false, 'G · no to throws'); }
catch (_) { t(true, 'G · no to throws'); }
try { buildInvite({ projectId: 'p', fromHandle: 'a', toHandle: 'a' }); t(false, 'G · self throws'); }
catch (_) { t(true, 'G · self throws'); }
try { buildInvite({ projectId: 'p', fromHandle: 'a', toHandle: 'b', role: 'fake' }); t(false, 'G · bad role'); }
catch (_) { t(true, 'G · bad role throws'); }

// acceptInvite
const accepted = acceptInvite(inv, { acceptedByHandle: 'maria', ts: 1700001000000 });
eq(accepted.content.status, 'accepted',                  'H · accepted');
eq(accepted.content.acceptedAt, 1700001000000,           'H · acceptedAt set');
t(accepted.keywords.includes('status:accepted'),         'H · keyword updated');

// Wrong recipient
try { acceptInvite(inv, { acceptedByHandle: 'bob' }); t(false, 'H · wrong recipient throws'); }
catch (_) { t(true, 'H · wrong recipient throws'); }

// Already accepted · can't re-accept
try { acceptInvite(accepted, { acceptedByHandle: 'maria' }); t(false, 'H · re-accept throws'); }
catch (_) { t(true, 'H · re-accept throws'); }

// Expired
const expiredInv = buildInvite({ projectId: 'p', fromHandle: 'a', toHandle: 'b', expiresInMs: 1, ts: 1 });
await new Promise(r => setTimeout(r, 5));
try { acceptInvite(expiredInv, { acceptedByHandle: 'b' }); t(false, 'H · expired throws'); }
catch (_) { t(true, 'H · expired throws'); }

// resolveStatus · pass `now` perquè inv (ts BASE_TS 2023) no aparegui expired ara
eq(resolveStatus(inv, { now: 1700000000500 }), 'pending', 'I · pending (mateix moment de creació)');
eq(resolveStatus(accepted), 'accepted',                  'I · accepted (status no depèn de time)');
eq(resolveStatus(expiredInv), 'expired',                 'I · expired auto-detect (expiresInMs=1)');

// declineInvite
const declined = declineInvite(inv, { declinedByHandle: 'maria', ts: 1700002000000 });
eq(declined.content.status, 'declined',                  'J · declined');

// listInvitesForUser · usem ts fictici llunyà perquè no expiri durant el test
const BASE_TS = 1700000000000;
const FAKE_NOW = BASE_TS + 1000;   // 1 segon després · cap invite expired
const allInvites = [
    inv,                                                                                          // pending to @maria · expira a BASE_TS + 7d
    buildInvite({ projectId: 'p2', fromHandle: 'b', toHandle: 'maria', ts: BASE_TS + 100 }),     // pending to @maria
    accepted,                                                                                     // accepted to @maria (mateix id que inv)
    buildInvite({ projectId: 'p3', fromHandle: 'c', toHandle: 'alvaro', ts: BASE_TS + 200 }),    // pending to @alvaro
];
const mariaInbox = listInvitesForUser(allInvites, 'maria', { onlyPending: true, now: FAKE_NOW });
eq(mariaInbox.length, 2,                                 'K · maria · 2 pending (inv + p2 · skip accepted)');
const mariaAll = listInvitesForUser(allInvites, 'maria', { onlyPending: false });
eq(mariaAll.length, 3,                                   'K · maria · 3 all (inclou accepted)');

const alvaroInbox = listInvitesForUser(allInvites, 'alvaro', { onlyPending: true, now: FAKE_NOW });
eq(alvaroInbox.length, 1,                                'K · alvaro · 1 pending');

// listInvitesSent
const sentByAlvaro = listInvitesSent(allInvites, 'alvaro');
t(sentByAlvaro.length >= 1,                              'K · alvaro sent · ≥1');

// listInvitesForProject · inv + accepted són mateix invite distints status · ambdós tornen
const proj1Invites = listInvitesForProject(allInvites, 'proj-x');
t(proj1Invites.length >= 1,                              'K · proj-x · ≥1 invite');

// countPendingForUser amb now sense expirar
eq(countPendingForUser(allInvites, 'maria', { now: FAKE_NOW }), 2, 'L · maria · 2 pending');
eq(countPendingForUser(allInvites, 'unknown'), 0,                  'L · unknown · 0');

// validateInvite
eq(validateInvite(inv).ok, true,                         'M · valid invite');
eq(validateInvite(null).ok, false,                       'M · null fail');
eq(validateInvite({ type: 'foo' }).ok, false,            'M · wrong type fail');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
