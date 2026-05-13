// WORKSHOPS-FED-001 sprint B · tests stand-alone per workshopRevenueService
// Ús: node js/tests/workshopRevenue.test.js

import * as svc from '../core/workshopRevenueService.js';
import { cohortWalletIdFor, isCohortWallet, personalWalletIdFor } from '../core/walletService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== WORKSHOPS-FED-001 sprint B · revenue split + paywall ===\n');

// ─── A · cohortWalletIdFor + isCohortWallet ─────────────────────────────
eq(cohortWalletIdFor(0),   '__cohort_0__',                            'A · cohortWalletIdFor(0)');
eq(cohortWalletIdFor(1),   '__cohort_1__',                            'A · cohortWalletIdFor(1)');
t(isCohortWallet('__cohort_0__'),                                     'A · isCohortWallet · positive');
t(!isCohortWallet('__personal_alvaro__'),                             'A · isCohortWallet · false (personal)');
t(!isCohortWallet('proj-1'),                                          'A · isCohortWallet · false (proj)');

let threw = null;
try { cohortWalletIdFor(-1); } catch (e) { threw = e; }
t(threw,                                                              'A · cohortWalletIdFor(-1) · throw');
threw = null;
try { cohortWalletIdFor(1.5); } catch (e) { threw = e; }
t(threw,                                                              'A · cohortWalletIdFor(1.5) · throw');

// ─── B · computeUnlockSplit · cas complet (creator + project + cohort) ──
const r1 = svc.computeUnlockSplit({
    priceEur:      2.50,
    creatorHandle: '@alvaro',
    projectId:     'proj-x',
    cohortNumber:  0,
});
eq(r1.creatorEur, 1.75,                                               'B · creator 70% · 1.75€');
eq(r1.projectEur, 0.50,                                               'B · project 20% · 0.50€');
eq(r1.cohortEur,  0.25,                                               'B · cohort 10% · 0.25€');
eq(r1.fallbackApplied.length, 0,                                      'B · cap fallback');

// ─── C · computeUnlockSplit · sense cohort → projecte rep el 10% ────────
const r2 = svc.computeUnlockSplit({
    priceEur:      2.50,
    creatorHandle: '@alvaro',
    projectId:     'proj-x',
    cohortNumber:  null,
});
eq(r2.creatorEur, 1.75,                                               'C · sense cohort · creator 70% (1.75)');
eq(r2.projectEur, 0.75,                                               'C · sense cohort · project 30% (0.75)');
eq(r2.cohortEur,  0,                                                  'C · sense cohort · cohort 0');
t(r2.fallbackApplied.includes('cohort-missing → project'),            'C · fallback registrat');

// ─── D · sense project · creator rep el 20% ─────────────────────────────
const r3 = svc.computeUnlockSplit({
    priceEur:      2.50,
    creatorHandle: '@alvaro',
    projectId:     null,
    cohortNumber:  0,
});
eq(r3.creatorEur, 2.25,                                               'D · sense project · creator 90% (2.25)');
eq(r3.projectEur, 0,                                                  'D · sense project · project 0');
eq(r3.cohortEur,  0.25,                                               'D · sense project · cohort 10% (0.25)');
t(r3.fallbackApplied.includes('project-missing → creator'),           'D · fallback project→creator');

// ─── E · sense res excepte creator · creator 100% ───────────────────────
const r4 = svc.computeUnlockSplit({
    priceEur:      10.00,
    creatorHandle: '@alvaro',
});
eq(r4.creatorEur, 10.00,                                              'E · sols creator · 100% (10€)');
eq(r4.projectEur, 0,                                                  'E · project 0');
eq(r4.cohortEur,  0,                                                  'E · cohort 0');
t(r4.fallbackApplied.length === 2,                                    'E · 2 fallbacks (project + cohort missing)');

// ─── F · arrodoniment · dust al creator ─────────────────────────────────
const r5 = svc.computeUnlockSplit({
    priceEur:      0.33,                                              // pot tenir dust
    creatorHandle: '@alvaro',
    projectId:     'p',
    cohortNumber:  0,
});
const totalAssigned = r5.creatorEur + r5.projectEur + r5.cohortEur;
t(Math.abs(totalAssigned - 0.33) < 0.0001,                            'F · suma = priceEur (dust reassignat)');

// ─── G · split percentages custom ───────────────────────────────────────
const r6 = svc.computeUnlockSplit({
    priceEur:      10,
    creatorHandle: '@alvaro',
    projectId:     'p',
    cohortNumber:  0,
    split:         { creator: 60, project: 30, cohort: 10 },
});
eq(r6.creatorEur, 6,                                                  'G · custom 60/30/10 · creator 6€');
eq(r6.projectEur, 3,                                                  'G · project 3€');
eq(r6.cohortEur,  1,                                                  'G · cohort 1€');

// ─── H · errors ─────────────────────────────────────────────────────────
threw = null;
try { svc.computeUnlockSplit({ priceEur: 0, creatorHandle: '@a' }); } catch (e) { threw = e; }
t(threw,                                                              'H · preu 0 · throw');
threw = null;
try { svc.computeUnlockSplit({ priceEur: 2, creatorHandle: null }); } catch (e) { threw = e; }
t(threw,                                                              'H · sense creator · throw');
threw = null;
try { svc.computeUnlockSplit({ priceEur: 100, creatorHandle: '@a' }); } catch (e) { threw = e; }
t(threw,                                                              'H · preu > maxEur · throw');
threw = null;
try { svc.computeUnlockSplit({ priceEur: 2, creatorHandle: '@a', split:{ creator:50, project:30, cohort:10 } }); } catch (e) { threw = e; }
t(threw,                                                              'H · split no suma 100 · throw');

// ─── I · canUnlockWithoutPaying ─────────────────────────────────────────
const wsPublic   = { content: { accessTier: 'public' } };
const wsOperator = { content: { accessTier: 'operator' } };
const wsMatriu   = { content: { accessTier: 'matriu' } };
const wsCohort0  = { content: { accessTier: 'cohort', cohortNumber: 0 } };
const wsCohort1  = { content: { accessTier: 'cohort', cohortNumber: 1 } };

t(svc.canUnlockWithoutPaying({ workshop: wsPublic }),                 'I · public · accés sense pagar (sense member)');
t(!svc.canUnlockWithoutPaying({ workshop: wsOperator }),              'I · operator · sense member · denied');
t(svc.canUnlockWithoutPaying({ workshop: wsOperator, member: { didSigned: true } }), 'I · operator amb didSigned · accés');
t(!svc.canUnlockWithoutPaying({ workshop: wsOperator, member: { didSigned: false } }), 'I · operator sense didSigned · denied');
t(svc.canUnlockWithoutPaying({ workshop: wsMatriu, member: { matriu: true } }),    'I · matriu amb member · accés');
t(!svc.canUnlockWithoutPaying({ workshop: wsMatriu, member: { matriu: false } }),  'I · matriu sense flag · denied');
t(svc.canUnlockWithoutPaying({ workshop: wsCohort0, member: { cohortNumber: 0 } }),'I · cohort match · accés');
t(!svc.canUnlockWithoutPaying({ workshop: wsCohort1, member: { cohortNumber: 0 } }),'I · cohort no match · denied');
t(!svc.canUnlockWithoutPaying({ workshop: wsCohort0 }),               'I · cohort sense member · denied');

// ─── J · DEFAULT_SPLIT + UNLOCK_PRICING constants ───────────────────────
eq(svc.DEFAULT_SPLIT.creator, 70,                                     'J · DEFAULT_SPLIT.creator = 70');
eq(svc.DEFAULT_SPLIT.project, 20,                                     'J · DEFAULT_SPLIT.project = 20');
eq(svc.DEFAULT_SPLIT.cohort,  10,                                     'J · DEFAULT_SPLIT.cohort = 10');
eq(svc.UNLOCK_PRICING.defaultEur, 2.50,                               'J · UNLOCK_PRICING.defaultEur = 2.50');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
