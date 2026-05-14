// BIZ-MODEL-001 sprint C · tests stand-alone per planEnforcer
// Ús: node js/tests/planEnforcer.test.js

import * as svc from '../core/planEnforcer.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== BIZ-MODEL-001 sprint C · planEnforcer ===\n');

// ─── A · PLAN_PERMISSIONS catàleg ───────────────────────────────────────
t(typeof svc.PLAN_PERMISSIONS === 'object',                           'A · PLAN_PERMISSIONS exportat');
t(Object.isFrozen(svc.PLAN_PERMISSIONS),                              'A · catàleg congelat');
t(svc.PLAN_PERMISSIONS.free,                                          'A · free entry present');
t(svc.PLAN_PERMISSIONS.pro,                                           'A · pro entry present');
t(svc.PLAN_PERMISSIONS.cooperative,                                   'A · cooperative entry present');
t(svc.PLAN_PERMISSIONS.enterprise,                                    'A · enterprise entry present');

t(Array.isArray(svc.VALID_OPS) && svc.VALID_OPS.length >= 8,          'A · VALID_OPS exportat (≥8)');

// ─── B · canPerform · free no pot publish ───────────────────────────────
const r1 = svc.canPerform({ planId: 'free', op: 'permaweb-publish' });
t(!r1.allowed,                                                        'B · free + permaweb-publish · denied');
t(/plan-required/.test(r1.reason),                                    'B · reason inclou plan-required');
eq(r1.requiredPlan, 'pro',                                            'B · requiredPlan · pro');

// ─── C · canPerform · pro pot publish ───────────────────────────────────
const r2 = svc.canPerform({ planId: 'pro', op: 'permaweb-publish' });
t(r2.allowed,                                                         'C · pro + permaweb-publish · allowed');
eq(r2.reason,        null,                                            'C · reason null');
eq(r2.requiredPlan,  null,                                            'C · requiredPlan null');

// ─── D · canPerform · free pot project-create + value-map-edit ──────────
t(svc.canPerform({ planId: 'free', op: 'project-create' }).allowed,   'D · free + project-create · ok (local-first)');
t(svc.canPerform({ planId: 'free', op: 'value-map-edit' }).allowed,   'D · free + value-map-edit · ok');
t(svc.canPerform({ planId: 'free', op: 'ai-via-own-key'  }).allowed,  'D · free + ai-via-own-key · ok');

// ─── E · canPerform · cooperative + enterprise · all true ───────────────
for (const op of svc.VALID_OPS) {
    t(svc.canPerform({ planId: 'cooperative', op }).allowed, 'E · cooperative + ' + op + ' · ok');
    t(svc.canPerform({ planId: 'enterprise',  op }).allowed, 'E · enterprise + '  + op + ' · ok');
}

// ─── F · canPerform · planId invàlid · fallback free ────────────────────
const rFb = svc.canPerform({ planId: 'made-up', op: 'permaweb-publish' });
t(!rFb.allowed,                                                       'F · planId invàlid · fallback free · denied');

// op desconegut · denied
const rNoOp = svc.canPerform({ planId: 'pro', op: 'unknown-op' });
t(!rNoOp.allowed,                                                     'F · op desconegut · denied');
t(/unknown-op/.test(rNoOp.reason),                                    'F · reason inclou unknown-op');

// ─── G · PUBLISH-SELECT-001 · permaweb-publish-paid · free OK pagant fee ─
const rFreePaid = svc.canPerform({ planId: 'free', op: 'permaweb-publish-paid' });
t(rFreePaid.allowed,                                                  'G · free + permaweb-publish-paid · OK (pagant fee)');
const rProPaid  = svc.canPerform({ planId: 'pro', op: 'permaweb-publish-paid' });
t(rProPaid.allowed,                                                   'G · pro + permaweb-publish-paid · OK');
// Op unpaid segueix bloquejat per a free
const rFreeUnpaid = svc.canPerform({ planId: 'free', op: 'permaweb-publish' });
t(!rFreeUnpaid.allowed,                                               'G · free + permaweb-publish (no-paid) · denied');
t(svc.VALID_OPS.includes('permaweb-publish-paid'),                    'G · VALID_OPS inclou permaweb-publish-paid');

// sense op · throw shape · allowed=false
const rNoOpAt = svc.canPerform({ planId: 'pro' });
t(!rNoOpAt.allowed,                                                   'F · sense op · denied');

// ─── G · requirePermission · throws si free intenta publish ─────────────
const mockLoadFree = async () => ({ planId: 'free' });
let threw = null;
try {
    await svc.requirePermission('permaweb-publish', { loadPlan: mockLoadFree });
} catch (e) { threw = e; }
t(threw && threw.code === 'plan-required',                            'G · free publish · throw plan-required');
eq(threw.op,           'permaweb-publish',                            'G · err.op');
eq(threw.currentPlan,  'free',                                        'G · err.currentPlan');
eq(threw.requiredPlan, 'pro',                                         'G · err.requiredPlan');

// ─── H · requirePermission · pro ok · retorna info ──────────────────────
const mockLoadPro = async () => ({ planId: 'pro' });
const okResult = await svc.requirePermission('permaweb-publish', { loadPlan: mockLoadPro });
eq(okResult.planId, 'pro',                                            'H · pro · planId retornat');
eq(okResult.op,     'permaweb-publish',                               'H · op retornat');

// ─── I · loadPlan throws · fallback free ────────────────────────────────
const failingLoad = async () => { throw new Error('KB down'); };
threw = null;
try { await svc.requirePermission('permaweb-publish', { loadPlan: failingLoad }); }
catch (e) { threw = e; }
t(threw && threw.code === 'plan-required',                            'I · loadPlan fail · fallback a free · throw plan-required');

// ─── J · upgradeUrlForOp ───────────────────────────────────────────────
const url1 = svc.upgradeUrlForOp('permaweb-publish', 'free');
t(url1 && url1.includes('/settings'),                                 'J · url · /settings');
t(url1.includes('upgrade=pro'),                                       'J · url · upgrade=pro');
t(url1.includes('permaweb-publish'),                                  'J · url · for=permaweb-publish');

const url2 = svc.upgradeUrlForOp('permaweb-publish', 'pro');
eq(url2, null,                                                        'J · pro · cap upgrade · null');

// ─── K · planLabel ─────────────────────────────────────────────────────
eq(svc.planLabel('free'), 'Free',                                     'K · planLabel free');
eq(svc.planLabel('pro'),  'Pro · saldo prepagat',                     'K · planLabel pro');
eq(svc.planLabel('?'),    'Free',                                     'K · planLabel unknown · fallback Free');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
