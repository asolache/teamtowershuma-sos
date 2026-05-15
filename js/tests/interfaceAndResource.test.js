// INTERFACE-NODES-001 + RESOURCES-ENTITY-001 sprint A · tests
import {
    buildEmptyInterface, buildPayloadField, validateInterface,
    addPayloadField, removePayloadField, setSla,
    validatePayload, computeInterfaceStats,
    INTERFACE_TYPE, FIELD_KINDS, TRIGGER_KINDS,
} from '../core/interfaceService.js';
import {
    buildEmptyResource, validateResource,
    setCapacity, recordUsage, utilizationRatio, utilizationStatus,
    linkProcess, unlinkProcess,
    activateResource, deactivateResource,
    totalMonthlyCost, costByKind, computeResourceStats,
    RESOURCE_TYPE, RESOURCE_KINDS, CAPACITY_UNITS,
} from '../core/resourceService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== INTERFACE-NODES-001 + RESOURCES-ENTITY-001 · sprint A ===\n');

// ── INTERFACE ────────────────────────────────────────────────────────────

eq(INTERFACE_TYPE, 'process_interface',                  'A · interface type');
t(FIELD_KINDS.includes('string'),                        'A · string kind');
t(FIELD_KINDS.includes('amount-eur'),                    'A · amount-eur kind');
t(TRIGGER_KINDS.includes('event'),                       'A · event trigger');

const iface = buildEmptyInterface({
    fromProcess: 'proc-sales',
    toProcess: 'proc-ops',
    label: 'sales→ops',
    triggerKind: 'event',
    triggerKey: 'deal-closed',
});
eq(iface.type, INTERFACE_TYPE,                           'B · iface type set');
eq(iface.fromProcess, 'proc-sales',                      'B · fromProcess');
eq(iface.triggerKind, 'event',                           'B · trigger event');

try { buildEmptyInterface({}); t(false, 'B · sense from · throws'); }
catch (_) { t(true, 'B · sense from · throws'); }
try { buildEmptyInterface({ fromProcess: 'a', toProcess: 'b', triggerKind: 'inventat' }); t(false, 'B · trigger invalid'); }
catch (_) { t(true, 'B · trigger invalid · throws'); }

// validateInterface
eq(validateInterface(iface).ok, true,                    'C · iface vàlid');
eq(validateInterface(null).ok, false,                    'C · null fail');

// addPayloadField · idempotent check
const iface2 = addPayloadField(iface, { name: 'deal_id', kind: 'id', required: true });
const iface3 = addPayloadField(iface2, { name: 'customer', kind: 'object', required: true });
const iface4 = addPayloadField(iface3, { name: 'amount', kind: 'amount-eur', required: false });
eq(iface4.payloadSchema.fields.length, 3,                'D · 3 fields');

try { addPayloadField(iface4, { name: 'deal_id', kind: 'id' }); t(false, 'D · dup · throws'); }
catch (_) { t(true, 'D · dup field · throws'); }

try { buildPayloadField({ name: 'x', kind: 'inventat' }); t(false, 'D · kind invalid'); }
catch (_) { t(true, 'D · kind invalid · throws'); }

// validatePayload
const payOk = { deal_id: 'D-123', customer: { name: 'Acme' }, amount: 1000 };
eq(validatePayload(iface4, payOk).ok, true,              'E · payload vàlid');

const payMissingReq = { deal_id: 'D-1' };
const v1 = validatePayload(iface4, payMissingReq);
eq(v1.ok, false,                                         'E · missing required · fail');
t(v1.errors.some(e => e.includes('customer')),           'E · error mentions customer');

const payBadType = { deal_id: 'D-1', customer: 'string-not-object' };
eq(validatePayload(iface4, payBadType).ok, false,        'E · bad type fail');

// SLA + remove field
const iface5 = setSla(iface4, 4);
eq(iface5.slaMaxDelayHours, 4,                           'F · SLA 4h set');

const iface6 = removePayloadField(iface5, 'amount');
eq(iface6.payloadSchema.fields.length, 2,                'F · removed field · 2 left');

// stats
const istats = computeInterfaceStats(iface5);
eq(istats.fieldCount, 3,                                 'G · field count');
eq(istats.requiredCount, 2,                              'G · required count');
eq(istats.hasSla, true,                                  'G · hasSla true');

// ── RESOURCE ─────────────────────────────────────────────────────────────

eq(RESOURCE_TYPE, 'resource',                            'H · resource type');
t(RESOURCE_KINDS.includes('tool'),                       'H · tool kind');
t(RESOURCE_KINDS.includes('space'),                      'H · space kind');
t(CAPACITY_UNITS.includes('users'),                      'H · users unit');

const calendly = buildEmptyResource({
    orgId: 'org-1',
    kind: 'tool',
    label: 'Calendly Team',
    costMonthlyEur: 12,
    capacity: { max: 5, unit: 'users' },
});
eq(calendly.type, RESOURCE_TYPE,                         'I · resource type set');
eq(calendly.kind, 'tool',                                'I · kind tool');
eq(calendly.costMonthlyEur, 12,                          'I · cost 12');
eq(calendly.capacity.max, 5,                             'I · capacity 5');
eq(calendly.active, true,                                'I · default active');

try { buildEmptyResource({ orgId: 'o', kind: 'inventat', label: 'x' }); t(false, 'I · kind invalid'); }
catch (_) { t(true, 'I · kind invalid · throws'); }
try { buildEmptyResource({ orgId: 'o', kind: 'tool', label: 'x', costMonthlyEur: -5 }); t(false, 'I · negative cost'); }
catch (_) { t(true, 'I · negative cost · throws'); }

eq(validateResource(calendly).ok, true,                  'J · valid resource');
eq(validateResource(null).ok, false,                     'J · null fail');

// Usage
const usedCalendly = recordUsage(calendly, 3);
eq(utilizationRatio(usedCalendly), 0.6,                  'K · ratio 0.6');
eq(utilizationStatus(usedCalendly), 'ok',                'K · status ok');

const overUsed = recordUsage(calendly, 6);
eq(utilizationStatus(overUsed), 'overuse',               'K · overuse');

const noCapResource = buildEmptyResource({ orgId: 'o', kind: 'asset', label: 'Brand' });
eq(utilizationStatus(noCapResource), 'no-capacity-defined', 'K · no capacity');

// linkProcess idempotent
const linked = linkProcess(linkProcess(calendly, 'proc-sales'), 'proc-sales');
eq(linked.usedByProcesses.length, 1,                     'L · linkProcess idempotent');
const unlinked = unlinkProcess(linked, 'proc-sales');
eq(unlinked.usedByProcesses.length, 0,                   'L · unlinkProcess');

// activate/deactivate
const deactivated = deactivateResource(calendly);
eq(deactivated.active, false,                            'L · deactivated');
const reactivated = activateResource(deactivated);
eq(reactivated.active, true,                             'L · reactivated');

// totalMonthlyCost
const stripe = buildEmptyResource({ orgId: 'o', kind: 'subscription', label: 'Stripe Pro', costMonthlyEur: 30 });
const inactive = buildEmptyResource({ orgId: 'o', kind: 'tool', label: 'Inactive tool', costMonthlyEur: 50 });
const inactiveOff = deactivateResource(inactive);
const total = totalMonthlyCost([calendly, stripe, inactiveOff]);
eq(total, 42,                                            'M · total monthly cost = 12+30=42 (skip inactive)');

const byKind = costByKind([calendly, stripe, noCapResource]);
eq(byKind.tool, 12,                                      'M · cost by kind · tool 12');
eq(byKind.subscription, 30,                              'M · cost by kind · subscription 30');
eq(byKind.asset, 0,                                      'M · cost by kind · asset 0 (no cost)');

// stats
const rstats = computeResourceStats(usedCalendly);
eq(rstats.kind, 'tool',                                  'N · stats kind');
eq(rstats.utilizationRatio, 0.6,                         'N · stats ratio');
eq(rstats.usedByProcessCount, 0,                         'N · stats process count');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
