// WO-AUTO-001 sprint A · tests
import {
    parseCron, cronMatchesDate,
    buildEmptyWoTemplate, validateWoTemplate,
    generateWoFromTemplate,
    shouldFire, markFired,
    enableTemplate, disableTemplate,
    evaluateTemplates,
    WO_TEMPLATE_TYPE, TRIGGER_KINDS,
} from '../core/woTemplateService.js';
import { validateWorkOrder } from '../core/agentBridgeSchema.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== WO-AUTO-001 sprint A · woTemplateService ===\n');

// 1 · parseCron
const c1 = parseCron('30 8 * * *');
t(c1 && c1.minute === '30' && c1.hour === '8',         'A · 30 8 * * * parses');
eq(parseCron('not valid'), null,                       'A · invalid · null');
eq(parseCron('@daily').hour, '0',                      'A · @daily preset');
eq(parseCron('@hourly').minute, '0',                   'A · @hourly preset');
const c2 = parseCron('*/15 * * * *');
t(c2,                                                  'A · step expression parses');

// 2 · cronMatchesDate
const at_8_30 = new Date(2026, 4, 15, 8, 30, 0);       // 2026-05-15 08:30
eq(cronMatchesDate('30 8 * * *', at_8_30), true,       'B · 30 8 * * * match 8:30');
eq(cronMatchesDate('30 8 * * *', new Date(2026, 4, 15, 8, 31, 0)), false, 'B · no match a 8:31');
eq(cronMatchesDate('0 9 * * 1', new Date(2026, 4, 18, 9, 0, 0)), true, 'B · 0 9 * * 1 match dilluns 9h'); // 2026-05-18 = Monday
eq(cronMatchesDate('0 9 * * 1', new Date(2026, 4, 17, 9, 0, 0)), false, 'B · 0 9 * * 1 no match diumenge');
eq(cronMatchesDate('0 * * * *', new Date(2026, 4, 15, 14, 0, 0)), true, 'B · 0 * * * * match qualsevol hora a :00');
eq(cronMatchesDate('*/15 * * * *', new Date(2026, 4, 15, 14, 15, 0)), true, 'B · step match :15');
eq(cronMatchesDate('*/15 * * * *', new Date(2026, 4, 15, 14, 16, 0)), false, 'B · step no match :16');
eq(cronMatchesDate('30 8,18 * * *', new Date(2026, 4, 15, 18, 30, 0)), true, 'B · list 8,18 match 18:30');
eq(cronMatchesDate('30 8-10 * * *', new Date(2026, 4, 15, 9, 30, 0)), true, 'B · range 8-10 match 9:30');

// 3 · buildEmptyWoTemplate
const tpl = buildEmptyWoTemplate({
    projectId: 'proj-shop',
    label: 'Neteja botiga',
    triggerKind: 'cron',
    triggerConfig: { cron: '30 8 * * *' },
    woFactory: { titleTpl: 'Neteja · {today}', roleId: 'r-oper', estimatedHours: 0.5 },
    ts: 1700000000000,
});
eq(tpl.type, WO_TEMPLATE_TYPE,                          'C · type set');
eq(tpl.triggerKind, 'cron',                             'C · cron trigger');
eq(tpl.enabled, true,                                   'C · default enabled');
eq(tpl.firedCount, 0,                                   'C · initial fired count 0');

try { buildEmptyWoTemplate({}); t(false, 'C · no projectId · throws'); }
catch (_) { t(true, 'C · no projectId · throws'); }
try { buildEmptyWoTemplate({ projectId: 'p', label: 'L', triggerKind: 'inventat' }); t(false, 'C · bad trigger'); }
catch (_) { t(true, 'C · bad triggerKind · throws'); }
try { buildEmptyWoTemplate({ projectId: 'p', label: 'L', triggerKind: 'cron', triggerConfig: { cron: 'bad' } }); t(false, 'C · bad cron'); }
catch (_) { t(true, 'C · bad cron expr · throws'); }

// 4 · validateWoTemplate
eq(validateWoTemplate(tpl).ok, true,                    'D · tpl vàlid');
eq(validateWoTemplate(null).ok, false,                  'D · null fail');
const tplEvent = buildEmptyWoTemplate({ projectId: 'p', label: 'L', triggerKind: 'event', triggerConfig: { event: 'invoice-paid' } });
eq(validateWoTemplate(tplEvent).ok, true,               'D · event tpl vàlid');
const tplEventBad = { ...tplEvent, triggerConfig: {} };
eq(validateWoTemplate(tplEventBad).ok, false,           'D · event sense name · fail');

// 5 · generateWoFromTemplate · forma compatible amb agentBridgeSchema
const wo = generateWoFromTemplate(tpl, { ts: 1700000000000 });
eq(wo.type, 'work_order',                               'E · type work_order');
eq(wo.project_id, 'proj-shop',                          'E · project_id');
eq(wo.status, 'pending',                                'E · pending');
t(wo.title.includes('2023') || wo.title.includes('2026'), 'E · title amb data');
t(wo.tags.includes('auto-generated'),                   'E · tag auto-generated');
t(wo.sourceTemplateId === tpl.id,                       'E · sourceTemplateId');
// Validation against agentBridgeSchema
const v = validateWorkOrder(wo);
eq(v.ok, true,                                          'E · WO generada vàlida segons agentBridgeSchema');

// 6 · shouldFire · cron
const fire1 = shouldFire(tpl, { now: at_8_30.getTime() });
eq(fire1.fire, true,                                    'F · fire cron al moment');

const fire2 = shouldFire(tpl, { now: new Date(2026, 4, 15, 8, 31, 0).getTime() });
eq(fire2.fire, false,                                   'F · no fire al min seguent');

// Idempotència · si firat aquest minut, no re-dispari
const firedTpl = markFired(tpl, { ts: at_8_30.getTime() });
const fire3 = shouldFire(firedTpl, { now: at_8_30.getTime() });
eq(fire3.fire, false,                                   'F · idempotent · no re-fire mateix min');

// Disabled
const disabled = disableTemplate(tpl);
eq(shouldFire(disabled, { now: at_8_30.getTime() }).fire, false, 'F · disabled · no fire');

// 7 · shouldFire · event
const fireE1 = shouldFire(tplEvent, { evt: { kind: 'event', name: 'invoice-paid', payload: { id: 'I-1' } } });
eq(fireE1.fire, true,                                   'G · event match fire');

const fireE2 = shouldFire(tplEvent, { evt: { kind: 'event', name: 'wrong-event' } });
eq(fireE2.fire, false,                                  'G · event mismatch no fire');

const fireE3 = shouldFire(tplEvent, {});
eq(fireE3.fire, false,                                  'G · no event provided no fire');

// 8 · shouldFire · condition
const tplCond = buildEmptyWoTemplate({
    projectId: 'p',
    label: 'Wallet low',
    triggerKind: 'condition',
    triggerConfig: { condition: 'wallet.balance < 100' },
});
const fireC1 = shouldFire(tplCond, { ctx: { conditionEvaluator: (c) => true } });
eq(fireC1.fire, true,                                   'H · condition true · fire');
const fireC2 = shouldFire(tplCond, { ctx: { conditionEvaluator: (c) => false } });
eq(fireC2.fire, false,                                  'H · condition false · no fire');
const fireC3 = shouldFire(tplCond, {});
eq(fireC3.fire, false,                                  'H · no evaluator · no fire');

// 9 · shouldFire · manual
const tplManual = buildEmptyWoTemplate({ projectId: 'p', label: 'Oneoff', triggerKind: 'manual', triggerConfig: {} });
eq(shouldFire(tplManual, {}).fire, false,               'I · manual sense trigger · no fire');
eq(shouldFire(tplManual, { evt: { kind: 'manual-trigger' } }).fire, true, 'I · manual amb trigger · fire');

// 10 · markFired
const marked = markFired(tpl, { ts: 1700000000000 });
eq(marked.lastFired, 1700000000000,                     'J · markFired · lastFired');
eq(marked.firedCount, 1,                                'J · firedCount 1');
const marked2 = markFired(marked, { ts: 1700000060000 });
eq(marked2.firedCount, 2,                               'J · firedCount 2');

// 11 · evaluateTemplates · batch
const templates = [tpl, tplEvent, disabled];
const result = evaluateTemplates(templates, { now: at_8_30.getTime() });
eq(result.generated.length, 1,                          'K · batch · 1 WO generada (només cron)');
eq(result.templates.length, 3,                          'K · 3 templates retornats');
const firedAfterBatch = result.templates.find(t => t.id === tpl.id);
eq(firedAfterBatch.firedCount, 1,                       'K · template firat updated');

// Re-evaluació · idempotent
const result2 = evaluateTemplates(result.templates, { now: at_8_30.getTime() });
eq(result2.generated.length, 0,                         'K · re-batch · 0 noves (idempotent)');

// Amb event
const result3 = evaluateTemplates(templates, {
    now: at_8_30.getTime(),
    evt: { kind: 'event', name: 'invoice-paid' },
});
eq(result3.generated.length, 2,                         'K · batch amb event · cron + event');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
