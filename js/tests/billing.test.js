// BIZ-MODEL-001 sprint B · tests stand-alone per billingService
// Ús: node js/tests/billing.test.js

import * as bs from '../core/billingService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== BIZ-MODEL-001 sprint B · billingService ===\n');

// ─── A · MARGINS_BY_KIND catàleg ────────────────────────────────────────
t(typeof bs.MARGINS_BY_KIND === 'object',                             'A · MARGINS_BY_KIND exportat');
t(Object.isFrozen(bs.MARGINS_BY_KIND),                                'A · MARGINS_BY_KIND congelat');
eq(bs.MARGINS_BY_KIND.ai,         5.0,                                'A · ai · 5%');
eq(bs.MARGINS_BY_KIND.permaweb,   0.0,                                'A · permaweb · 0%');
eq(bs.MARGINS_BY_KIND['gnosis-tx'], 5.0,                              'A · gnosis-tx · 5%');
eq(bs.MARGINS_BY_KIND.default,    0.0,                                'A · default · 0%');

t(Array.isArray(bs.MARGIN_KINDS) && bs.MARGIN_KINDS.length >= 5,      'A · MARGIN_KINDS array exportat');

// ─── B · applyMargin · IA 5% ────────────────────────────────────────────
const r1 = bs.applyMargin({ baseCostEur: 0.10, kind: 'ai' });
eq(r1.kind,        'ai',                                              'B · ai · kind preservat');
eq(r1.baseCostEur, 0.1,                                               'B · ai · baseCostEur 0.10');
eq(r1.marginPct,   5.0,                                               'B · ai · marginPct 5');
eq(r1.marginEur,   0.005,                                             'B · ai · marginEur 0.005');
eq(r1.totalEur,    0.105,                                             'B · ai · totalEur 0.105');

// ─── C · applyMargin · permaweb 0% ──────────────────────────────────────
const r2 = bs.applyMargin({ baseCostEur: 0.05, kind: 'permaweb' });
eq(r2.marginEur,   0,                                                 'C · permaweb · marginEur 0');
eq(r2.totalEur,    0.05,                                              'C · permaweb · totalEur = baseCost');

// ─── D · applyMargin · kind desconegut · fallback default 0% ────────────
const r3 = bs.applyMargin({ baseCostEur: 1.00, kind: 'unknown-kind' });
eq(r3.marginPct,   0,                                                 'D · unknown · marginPct 0 (default)');
eq(r3.totalEur,    1.00,                                              'D · unknown · totalEur = baseCost');

// ─── E · applyMargin · cost 0 · marge 0 ─────────────────────────────────
const rZero = bs.applyMargin({ baseCostEur: 0, kind: 'ai' });
eq(rZero.marginEur, 0,                                                'E · cost 0 · marge 0');
eq(rZero.totalEur,  0,                                                'E · cost 0 · total 0');

// ─── F · applyMargin · negatius/no-numerics throw ───────────────────────
let threw = null;
try { bs.applyMargin({ baseCostEur: -0.1, kind: 'ai' }); } catch (e) { threw = e; }
t(threw && /non-negative/.test(threw.message),                        'F · negatiu · throw');
threw = null;
try { bs.applyMargin({ baseCostEur: 'no' }); } catch (e) { threw = e; }
t(threw,                                                              'F · string · throw');

// ─── G · summarizeMargins ───────────────────────────────────────────────
const movs = [
    { kind: 'ai',       baseCostEur: 0.10 },
    { kind: 'ai',       baseCostEur: 0.20 },
    { kind: 'permaweb', baseCostEur: 0.05 },
    { kind: 'gnosis-tx',baseCostEur: 0.30 },
];
const sum = bs.summarizeMargins(movs);
eq(sum.totalBaseEur,   0.65,                                          'G · totalBaseEur 0.65');
// ai 5% · permaweb 0% · gnosis-tx 5% → marges 0.015 + 0 + 0.015 = 0.03
eq(sum.totalMarginEur, 0.03,                                          'G · totalMarginEur 0.03');
eq(sum.totalGrossEur,  0.68,                                          'G · totalGrossEur 0.68');
eq(sum.byKind.ai.count,    2,                                         'G · ai count 2');
eq(sum.byKind.ai.baseEur,  0.30,                                      'G · ai baseEur 0.30');
eq(sum.byKind.ai.marginEur,0.015,                                     'G · ai marginEur 0.015');

t(sum.effectiveMarginPct > 4 && sum.effectiveMarginPct < 5,           'G · effective margin · ~4.6% (3/65)');

// ─── H · setMarginForKind / clearMarginOverrides / applyMarginWithOverride
bs.clearMarginOverrides();
const before = bs.getEffectiveMarginPct('ai');
eq(before, 5,                                                         'H · sense override · ai 5%');

bs.setMarginForKind('ai', 7.5);
const after = bs.getEffectiveMarginPct('ai');
eq(after, 7.5,                                                        'H · amb override · ai 7.5%');

const rOv = bs.applyMarginWithOverride({ baseCostEur: 1.00, kind: 'ai' });
eq(rOv.marginPct, 7.5,                                                'H · applyMarginWithOverride · ai 7.5%');
eq(rOv.marginEur, 0.075,                                              'H · marginEur 0.075');
eq(rOv.totalEur,  1.075,                                              'H · totalEur 1.075');

// override no afecta applyMargin (que usa MARGINS_BY_KIND congelat)
const rOrig = bs.applyMargin({ baseCostEur: 1.00, kind: 'ai' });
eq(rOrig.marginPct, 5,                                                'H · applyMargin (sense override) · ai 5%');

// Clear override · torna a default
bs.clearMarginOverrides();
eq(bs.getEffectiveMarginPct('ai'), 5,                                 'H · clear · torna a 5%');

// setMarginForKind invàlid · throw
threw = null;
try { bs.setMarginForKind('ai', -1); } catch (e) { threw = e; }
t(threw,                                                              'H · pct negatiu · throw');
threw = null;
try { bs.setMarginForKind(null, 5); } catch (e) { threw = e; }
t(threw,                                                              'H · kind null · throw');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
