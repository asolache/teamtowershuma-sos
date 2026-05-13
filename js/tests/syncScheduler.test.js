// PERM-DISCO-001 sprint A · tests stand-alone per syncSchedulerService
// Ús: node js/tests/syncScheduler.test.js

import * as svc from '../core/syncSchedulerService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== PERM-DISCO-001 sprint A · syncSchedulerService ===\n');

// ─── Mock KB · in-memory ────────────────────────────────────────────────
function makeMockKb() {
    const store = new Map();
    return {
        store,
        getNode: async (id) => store.get(id) || null,
        upsert:  async (n) => { store.set(n.id, n); return n; },
    };
}

// ─── A · isDue · pur ─────────────────────────────────────────────────────
const NOW = 1700000000000;
const ONE_HOUR = 3600000;
t(svc.isDue({ now: NOW, lastSyncAt: 0 }) === true,                    'A · primer cop · isDue=true');
t(svc.isDue({ now: NOW, lastSyncAt: NOW - ONE_HOUR }) === true,       'A · exactly 1h · isDue=true');
t(svc.isDue({ now: NOW, lastSyncAt: NOW - ONE_HOUR + 1 }) === false,  'A · 59min59s · isDue=false');
t(svc.isDue({ now: NOW, lastSyncAt: NOW - 10 }) === false,            'A · just synced · isDue=false');

// Cooldown personalitzat
t(svc.isDue({ now: NOW, lastSyncAt: NOW - 100, cooldownMs: 50 }) === true,  'A · cooldown 50ms < 100ms ago · isDue=true');
t(svc.isDue({ now: NOW, lastSyncAt: NOW - 30, cooldownMs: 50 }) === false,  'A · cooldown 50ms > 30ms ago · isDue=false');

// ─── B · setLastSyncMarker + getLastSyncMarker ──────────────────────────
const kb1 = makeMockKb();
const marker = await svc.setLastSyncMarker({
    result: { fetched: 12, cached: 10, failed: 2, revocations: 1 },
    kb:     kb1,
});
t(marker && marker.id === svc.SYNC_MARKER_ID,                         'B · marker creat amb id correcte');
eq(marker.type, svc.SYNC_MARKER_TYPE,                                 'B · marker type sync_marker');
t(typeof marker.content.lastSyncAt === 'number' && marker.content.lastSyncAt > 0, 'B · lastSyncAt timestamp');
eq(marker.content.lastFetched, 12,                                    'B · lastFetched 12');
eq(marker.content.lastCached,  10,                                    'B · lastCached 10');
eq(marker.content.lastFailed,  2,                                     'B · lastFailed 2');
eq(marker.content.lastRevocations, 1,                                 'B · lastRevocations 1');

const read = await svc.getLastSyncMarker(kb1);
t(read && read.lastSyncAt === marker.content.lastSyncAt,              'B · getLastSyncMarker · roundtrip OK');

// ─── C · getLastSyncMarker sense KB · null ──────────────────────────────
const kb2 = makeMockKb();
const empty = await svc.getLastSyncMarker(kb2);
eq(empty, null,                                                       'C · sense marker · null');

// ─── D · triggerSyncIfDue · primer cop · executa ────────────────────────
svc._resetSyncScheduler();
const kb3 = makeMockKb();
let onStartCalled = false;
let onDoneResult = null;
const mockSyncFn = async () => ({ fetched: 5, cached: 5, revocations: 0, failed: 0, entries: [] });

const r1 = await svc.triggerSyncIfDue({
    onStart: () => { onStartCalled = true; },
    onDone:  (res) => { onDoneResult = res; },
    syncFn:  mockSyncFn,
    kb:      kb3,
});
t(r1.triggered === true,                                              'D · primer sync · triggered=true');
t(r1.promise instanceof Promise,                                      'D · retorna promise');
await r1.promise;
t(onStartCalled,                                                      'D · onStart cridat');
t(onDoneResult && onDoneResult.fetched === 5,                         'D · onDone amb result');
const marker3 = await svc.getLastSyncMarker(kb3);
t(marker3 && marker3.lastFetched === 5,                               'D · marker persistit post-sync');

// ─── E · triggerSyncIfDue · cooldown · no executa ───────────────────────
const r2 = await svc.triggerSyncIfDue({
    syncFn: mockSyncFn,
    kb:     kb3,
});
t(r2.triggered === false,                                             'E · dins cooldown · triggered=false');
eq(r2.reason, 'cooldown',                                             'E · reason=cooldown');
t(typeof r2.lastSyncAt === 'number',                                  'E · lastSyncAt al return');

// ─── F · triggerSyncIfDue · force=true · ignora cooldown ────────────────
let secondSyncCalled = false;
const r3 = await svc.triggerSyncIfDue({
    force:  true,
    syncFn: async () => { secondSyncCalled = true; return { fetched: 7, cached: 7, revocations: 0, failed: 0 }; },
    kb:     kb3,
});
t(r3.triggered === true,                                              'F · force=true · triggered');
await r3.promise;
t(secondSyncCalled,                                                   'F · syncFn re-cridat');

// ─── G · triggerSyncIfDue · in-flight protection ────────────────────────
svc._resetSyncScheduler();
const kb4 = makeMockKb();
let slowSyncFn = () => new Promise(resolve => setTimeout(() => resolve({ fetched: 1, cached: 1 }), 100));
const r4a = await svc.triggerSyncIfDue({ syncFn: slowSyncFn, kb: kb4 });
const r4b = await svc.triggerSyncIfDue({ syncFn: slowSyncFn, kb: kb4 });
t(r4a.triggered === true,                                             'G · primer trigger · sí');
t(r4b.triggered === false,                                            'G · segon trigger mentre in-flight · no');
eq(r4b.reason, 'already-in-flight',                                   'G · reason=already-in-flight');
t(r4b.promise === r4a.promise,                                        'G · retorna mateixa promise');
await r4a.promise;

// ─── H · onError cridat si syncFn throws ───────────────────────────────
svc._resetSyncScheduler();
const kb5 = makeMockKb();
let onErrorCaught = null;
const failingSyncFn = async () => { throw new Error('gateway down'); };
const r5 = await svc.triggerSyncIfDue({
    syncFn:  failingSyncFn,
    onError: (e) => { onErrorCaught = e; },
    kb:      kb5,
});
t(r5.triggered === true,                                              'H · triggered');
try { await r5.promise; } catch (_) {}
t(onErrorCaught && /gateway down/.test(onErrorCaught.message),        'H · onError amb missatge correcte');

// ─── I · constants exportades ──────────────────────────────────────────
t(typeof svc.FOREGROUND_COOLDOWN_MS === 'number' && svc.FOREGROUND_COOLDOWN_MS >= 60000, 'I · FOREGROUND_COOLDOWN_MS ≥ 1 min');
t(typeof svc.BACKGROUND_COOLDOWN_MS === 'number' && svc.BACKGROUND_COOLDOWN_MS > svc.FOREGROUND_COOLDOWN_MS, 'I · BACKGROUND_COOLDOWN_MS > FOREGROUND');
eq(svc.SYNC_MARKER_TYPE, 'sync_marker',                               'I · SYNC_MARKER_TYPE');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
