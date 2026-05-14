// =============================================================================
// tokenomics.test.js · TOKENOMICS sprint A · pure design + vesting tests
// =============================================================================

import {
    TOKEN_DESIGN_TYPE, TOKEN_GROUPS, DEFAULT_VESTING,
    groupMeta,
    buildEmptyTokenDesign,
    validateTokenDesign,
    setDistributionPct, normalizeDistribution,
    setVestingParams,
    computeVestingSchedule,
    computeQualityScore,
    applyTokenDesignToProject,
} from '../core/tokenomicsService.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');
const near = (a, b, eps, msg) => t(Math.abs(a - b) < eps, msg + ' (~' + b + ', got ' + a + ')');

// ─── A · constants + groupMeta ────────────────────────────────────────────
eq(TOKEN_DESIGN_TYPE, 'token_design',                             'A · TYPE');
eq(TOKEN_GROUPS.length, 6,                                        'A · 6 groups standard');
const ids = TOKEN_GROUPS.map(g => g.id);
for (const need of ['founders', 'operators', 'treasury', 'community', 'investors', 'liquidity']) {
    t(ids.includes(need),                                         'A · group ' + need + ' present');
}
const sumDefault = TOKEN_GROUPS.reduce((s, g) => s + g.defaultPct, 0);
near(sumDefault, 1, 0.001,                                        'A · default pcts sum to 1.0');
const meta = groupMeta('founders');
eq(meta.id, 'founders',                                           'A · groupMeta(founders) id');
const customMeta = groupMeta('custom-x');
eq(customMeta.label, 'custom-x',                                  'A · custom group fallback');

// ─── B · DEFAULT_VESTING ──────────────────────────────────────────────────
t(DEFAULT_VESTING.founders.cliffMonths > 0,                       'B · founders amb cliff');
t(DEFAULT_VESTING.founders.linearMonths > 0,                      'B · founders amb linear');
eq(DEFAULT_VESTING.treasury.cliffMonths, 0,                       'B · treasury sense cliff');
eq(DEFAULT_VESTING.treasury.linearMonths, 0,                      'B · treasury immediat');

// ─── C · buildEmptyTokenDesign ────────────────────────────────────────────
const d1 = buildEmptyTokenDesign({ projectId: 'p1', name: 'X', symbol: 'XX', totalSupply: 1000, ts: 1700000000000 });
eq(d1.type, TOKEN_DESIGN_TYPE,                                    'C · type');
eq(d1.projectId, 'p1',                                            'C · projectId');
eq(d1.content.name, 'X',                                          'C · name');
eq(d1.content.symbol, 'XX',                                       'C · symbol');
eq(d1.content.totalSupply, 1000,                                  'C · totalSupply');
eq(d1.content.decimals, 18,                                       'C · 18 default decimals');
t(d1.id.startsWith('td-'),                                        'C · id prefix td-');
near(Object.values(d1.content.distribution).reduce((s, p) => s + p, 0), 1, 0.001,
                                                                  'C · distribution sums to 1');

// ─── D · validateTokenDesign ──────────────────────────────────────────────
eq(validateTokenDesign(d1).ok, true,                              'D · empty design valid');
eq(validateTokenDesign(null).ok, false,                           'D · null invalid');

// Bad sum
const dBadSum = setDistributionPct(d1, 'founders', 0.5);    // pujem un · suma > 1
const v2 = validateTokenDesign(dBadSum);
eq(v2.ok, false,                                                  'D · sum != 1 invalid');
t(v2.errors.some(e => e.includes('sum-1')),                       'D · error dist-must-sum-1');

// Negative pct
let dNeg = d1;
try { dNeg = setDistributionPct(d1, 'founders', -0.1); } catch (_) {}
eq(dNeg.content.distribution.founders, d1.content.distribution.founders, 'D · setDistributionPct rebutja negatiu');

// Symbol massa llarg
const dBadSym = { ...d1, content: { ...d1.content, symbol: 'TOOLONGSYMBOL' } };
eq(validateTokenDesign(dBadSym).ok, false,                        'D · symbol >12 invalid');

// supply 0
const dBadSupply = { ...d1, content: { ...d1.content, totalSupply: 0 } };
eq(validateTokenDesign(dBadSupply).ok, false,                     'D · totalSupply 0 invalid');

// ─── E · setDistributionPct + immutability ────────────────────────────────
const d2 = setDistributionPct(d1, 'founders', 0.25);
eq(d2.content.distribution.founders, 0.25,                        'E · pct canviat');
eq(d1.content.distribution.founders, 0.2,                         'E · immutable · orig sense canvi');

let threw = false;
try { setDistributionPct(d1, 'founders', 1.5); } catch (_) { threw = true; }
t(threw,                                                          'E · pct > 1 throws');
threw = false;
try { setDistributionPct(d1, 'founders', -0.1); } catch (_) { threw = true; }
t(threw,                                                          'E · pct < 0 throws');

// ─── F · normalizeDistribution ─────────────────────────────────────────────
const unbalanced = { a: 1, b: 1 };       // suma 2 · normalitzar a 0.5+0.5
const norm = normalizeDistribution(unbalanced);
near(norm.a, 0.5, 0.001,                                          'F · a → 0.5');
near(norm.b, 0.5, 0.001,                                          'F · b → 0.5');

const skewed = { a: 0.8, b: 0.2 };
const norm2 = normalizeDistribution(skewed);
near(norm2.a + norm2.b, 1, 0.001,                                 'F · norm sums to 1');
near(norm2.a, 0.8, 0.001,                                         'F · proporció mantinguda');

// Zero · safe
const zero = normalizeDistribution({ a: 0, b: 0 });
eq(zero.a, 0,                                                     'F · zero safe');

// ─── G · setVestingParams ─────────────────────────────────────────────────
const dV = setVestingParams(d1, 'operators', { cliffMonths: 6, linearMonths: 36 });
eq(dV.content.vesting.operators.cliffMonths, 6,                   'G · cliff actualitzat');
eq(dV.content.vesting.operators.linearMonths, 36,                 'G · linear actualitzat');
eq(d1.content.vesting.operators.cliffMonths, 0,                   'G · immutable · orig sense canvi');

// Negatius forçats a 0
const dV2 = setVestingParams(d1, 'operators', { cliffMonths: -5 });
eq(dV2.content.vesting.operators.cliffMonths, 0,                  'G · negatiu clamp a 0');

// ─── H · computeVestingSchedule ───────────────────────────────────────────
const dSched = buildEmptyTokenDesign({ totalSupply: 1000000 });
const sched = computeVestingSchedule(dSched, { months: 60 });
eq(sched.length, 61,                                              'H · 61 rows (0..60)');
// Mes 0 · founders amb cliff 12 · 0 unlocked
eq(sched[0].byGroup.founders, 0,                                  'H · mes 0 · founders 0');
// Mes 12 · just al cliff · founders 0 (no es desbloca fins després)
t(sched[12].byGroup.founders === 0,                               'H · mes 12 · founders 0 (just al cliff)');
// Mes 24 · 12 mesos després del cliff · 12/36 lineal = 33%
const founders24 = sched[24].byGroup.founders;
const expectedF24 = Math.round(1000000 * 0.20 * (12 / 36));
near(founders24, expectedF24, 1000,                               'H · founders mes 24 ≈ 33% quota');
// Mes 48 · cliff 12 + linear 36 · 100% · 200000 founders
eq(sched[48].byGroup.founders, 200000,                            'H · mes 48 · founders 100% (200k)');
// Treasury · immediat · 200000 des de mes 0
eq(sched[0].byGroup.treasury, 200000,                             'H · treasury immediat 100%');
// totalUnlocked al mes 48 · proper a totalSupply
near(sched[48].totalUnlocked, 1000000, 5000,                      'H · mes 48 total ≈ supply');

// ─── I · computeQualityScore ──────────────────────────────────────────────
const q1 = computeQualityScore(d1);   // defaults
t(q1.valid,                                                       'I · default valid');
t(q1.score >= 70,                                                 'I · default score >= 70 (defaults bons)');

// Sense vesting founders · -25
const dNoVest = setVestingParams(d1, 'founders', { cliffMonths: 0, linearMonths: 0 });
const q2 = computeQualityScore(dNoVest);
t(q2.score < q1.score,                                            'I · sense vesting · score lower');
t(q2.reasons.some(r => r.includes('founders-vesting')),           'I · reason founders-vesting');

// Concentration > 50% · -10
let dConc = setDistributionPct(d1, 'founders', 0.6);
dConc = setDistributionPct(dConc, 'operators', 0.0);
dConc = setDistributionPct(dConc, 'treasury', 0.05);  // sum = 0.6+0+0.05+0.15+0.10+0.05 = 0.95 not 1
dConc = setDistributionPct(dConc, 'community', 0.2);  // 0.6+0+0.05+0.2+0.10+0.05 = 1.0
const q3 = computeQualityScore(dConc);
t(q3.reasons.some(r => r.includes('concentration-founders')),    'I · reason concentration');
t(q3.reasons.some(r => r.includes('treasury-under-10pct')),      'I · reason treasury-under-10pct');

// Symbol llarg
const dLong = { ...d1, content: { ...d1.content, symbol: 'LONGSYM' } };  // 7 chars
const q4 = computeQualityScore(dLong);
t(q4.reasons.some(r => r.includes('symbol-over-6')),             'I · reason symbol-over-6');

// Invalid design · score 0
const dInvalid = { ...d1, content: { ...d1.content, totalSupply: 0 } };
const q5 = computeQualityScore(dInvalid);
eq(q5.score, 0,                                                   'I · invalid · score 0');
eq(q5.valid, false,                                               'I · invalid · valid false');

// ─── J · applyTokenDesignToProject ────────────────────────────────────────
const proj = { id: 'p1', type: 'project', content: { description: 'd' }, updatedAt: 1 };
const merged = applyTokenDesignToProject(proj, d1.id);
eq(merged.content.tokenDesignId, d1.id,                           'J · designId anclat');
eq(merged.content.description, 'd',                               'J · description preservada');
t(merged.updatedAt > 1,                                           'J · updatedAt mou');
eq(proj.content.tokenDesignId, undefined,                         'J · immutable · orig sense canvi');

threw = false;
try { applyTokenDesignToProject(null, d1.id); } catch (_) { threw = true; }
t(threw,                                                          'J · null project throws');
threw = false;
try { applyTokenDesignToProject(proj, null); } catch (_) { threw = true; }
t(threw,                                                          'J · null designId throws');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
