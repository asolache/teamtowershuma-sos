// =============================================================================
// pactEnrichment.test.js · PACT-AI sprint A · pure enrichment + AI tests
// =============================================================================

import {
    extractPartiesFromRoles, extractCapitalFromLedger,
    extractVestingFromTokenomics, extractSunsetMetricsFromInvoices,
    buildEnrichedPactDraft,
    buildAiPromptForPactClauses, applyAIDraftToPact,
} from '../core/pactEnrichmentService.js';
import { quickEntry } from '../core/ledgerService.js';
import { buildEmptyTokenDesign, setVestingParams, setDistributionPct } from '../core/tokenomicsService.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');
const near = (a, b, eps, msg) => t(Math.abs(a - b) < eps, msg + ' (~' + b + ', got ' + a + ')');

// ─── A · extractPartiesFromRoles ──────────────────────────────────────────
const roles = [
    { id: 'r1', content: { kind: 'cohort_manager', label: 'Manager A', handle: '@alvaro', primarySkillId: 'governance-design', skillDomain: 'governance' } },
    { id: 'r2', content: { kind: 'cohort_manager', label: 'Manager B', handle: 'bob', primarySkillId: 'slicing-pie', skillDomain: 'finance' } },
    { id: 'r3', content: { kind: 'other-role', label: 'X' } },     // ignorat · no és cohort_manager
];
const members = [
    { id: 'm1', content: { handle: '@alvaro', displayName: 'Alvaro Test', primaryDid: 'did:sos:alvaro-x' } },
];
const attestations = [
    { content: { attestedDid: 'did:sos:alvaro-x', attesterHandle: '@x' } },
    { content: { attestedDid: 'did:sos:alvaro-x', attesterHandle: '@y' } },
    { content: { attestedHandle: 'bob', attesterHandle: '@z' } },
];

const parties = extractPartiesFromRoles({ roles, attestations, members });
eq(parties.length, 2,                                             'A · 2 parties (cohort_manager only)');
const alv = parties.find(p => p.handle === 'alvaro');
t(alv && alv.identityId === 'did:sos:alvaro-x',                   'A · alvaro · did from member');
eq(alv.displayName, 'Alvaro Test',                                'A · displayName from member');
eq(alv.role, 'cohort_manager',                                    'A · role kind');
t(alv.contributionType.startsWith('skill-governance'),            'A · contributionType from skillDomain');
eq(alv.attestationCount, 2,                                       'A · attestationCount · 2 attestations rebudes');

const bob = parties.find(p => p.handle === 'bob');
eq(bob.attestationCount, 1,                                       'A · bob · 1 attestation per handle match');
t(bob.identityId === 'bob' || bob.identityId === 'r2',            'A · bob · fallback identityId si no member');

// Empty safe
eq(extractPartiesFromRoles({}).length, 0,                         'A · empty args · 0 parties');
eq(extractPartiesFromRoles({ roles: [] }).length, 0,              'A · empty roles · 0');

// ─── B · extractCapitalFromLedger ────────────────────────────────────────
const ledger = [
    quickEntry({ projectId: 'p1', debitAccount: 'cash',     creditAccount: 'equity',  amount: 5000, date: '2026-01-01' }),
    quickEntry({ projectId: 'p1', debitAccount: 'cash',     creditAccount: 'equity',  amount: 3000, date: '2026-02-01' }),
    quickEntry({ projectId: 'p1', debitAccount: 'expenses', creditAccount: 'cash',    amount: 1200, date: '2026-03-01' }),
    quickEntry({ projectId: 'p1', debitAccount: 'cash',     creditAccount: 'revenue', amount: 4000, date: '2026-04-01' }),
];
const cap = extractCapitalFromLedger({ ledgerEntries: ledger, today: '2026-05-01' });
near(cap.equityRaised, 8000, 0.01,                                'B · equityRaised 8000');
near(cap.totalRevenue, 4000, 0.01,                                'B · totalRevenue 4000');
near(cap.totalExpenses, 1200, 0.01,                               'B · totalExpenses 1200');
near(cap.profitYTD, 2800, 0.01,                                   'B · profitYTD 4000-1200');
t(cap.cashOnHand > 0,                                             'B · cashOnHand positive');
t(cap.monthlyBurn > 0,                                            'B · monthlyBurn positive');
t(cap.runwayMonths > 0,                                           'B · runwayMonths calculated');

// Empty
const empCap = extractCapitalFromLedger({ ledgerEntries: [] });
eq(empCap.equityRaised, 0,                                        'B · empty · 0 equity');
eq(empCap.totalRevenue, 0,                                        'B · empty · 0 revenue');

// ─── C · extractVestingFromTokenomics ────────────────────────────────────
let token = buildEmptyTokenDesign({ projectId: 'p1', symbol: 'COHO', totalSupply: 1000000 });
// Defaults: founders 20% · 12m cliff + 36m linear · operators 30% · 0 + 24m
// Average weighted: cliff = (12*0.2)/totalPct ... totalPct = 1 (defaults suma 1)
// cliff weighted · 0.2*12 + 0.3*0 + 0.2*0 + 0.15*0 + 0.1*6 + 0.05*0 = 2.4 + 0.6 = 3
// linear weighted · 0.2*36 + 0.3*24 + 0.2*0 + 0.15*12 + 0.1*18 + 0.05*0 = 7.2+7.2+1.8+1.8 = 18
const vest = extractVestingFromTokenomics({ tokenomicsDesigns: [token] });
t(vest.cliffMonths >= 1 && vest.cliffMonths <= 15,                'C · cliff weighted reasonable');
t(vest.linearMonths >= 5 && vest.linearMonths <= 40,              'C · linear weighted reasonable');
eq(vest.tokenSymbol, 'COHO',                                      'C · symbol passat');
t(vest.breakdown.length >= 5,                                     'C · breakdown · 5+ groups');

// Empty designs
const empVest = extractVestingFromTokenomics({ tokenomicsDesigns: [] });
eq(empVest.cliffMonths, 0,                                        'C · empty · 0 cliff');
eq(empVest.linearMonths, 0,                                       'C · empty · 0 linear');

// Selecció del més recent
let tokenOld = { ...token, updatedAt: 100 };
let tokenNew = { ...token, updatedAt: 500, content: { ...token.content, symbol: 'NEW' } };
const vestRecent = extractVestingFromTokenomics({ tokenomicsDesigns: [tokenOld, tokenNew] });
eq(vestRecent.tokenSymbol, 'NEW',                                 'C · sort recent · agafa NEW');

// ─── D · extractSunsetMetricsFromInvoices ────────────────────────────────
const invoices = [
    { content: { status: 'paid', issuedDate: '2026-01-01', taxRate: 0.21, items: [{ total: 1000 }] } },
    { content: { status: 'paid', issuedDate: '2026-02-01', taxRate: 0.21, items: [{ total: 800 }] } },
    { content: { status: 'paid', issuedDate: '2026-03-01', taxRate: 0.21, items: [{ total: 1200 }] } },
    { content: { status: 'draft', items: [{ total: 9999 }] } },   // exclòs · no paid
];
const sun = extractSunsetMetricsFromInvoices({ invoices, today: '2026-05-01' });
eq(sun.metric, 'monthly-revenue-eur',                             'D · metric');
t(sun.below >= 100,                                               'D · below ≥ 100 min');
eq(sun.basedOn.count, 3,                                          'D · 3 paid');
t(sun.basedOn.avgMonthly > 0,                                     'D · avg monthly positive');

// No invoices
const sunEmpty = extractSunsetMetricsFromInvoices({ invoices: [] });
eq(sunEmpty.below, 500,                                           'D · default 500 si cap paid');
eq(sunEmpty.basedOn.count, 0,                                     'D · count 0');

// ─── E · buildEnrichedPactDraft · integration ────────────────────────────
const project = { id: 'p1', nombre: 'TestProj', content: { canvas: { steps: { vision: { value: 'In 10 yr 100k coops' }, mission: { value: 'Onboard 10 ops/day' }, values: { value: 'transparency' }, 'north-star': { value: 'MAU' } } } } };
const draft = buildEnrichedPactDraft({
    project,
    canvas: project.content.canvas,
    tokenomicsDesigns: [token],
    ledgerEntries: ledger,
    roles, attestations, members,
    invoices,
});
eq(draft.projectId, 'p1',                                         'E · projectId');
t(draft.parties.length === 2,                                     'E · 2 parties extracted');
// Object substituït per mission (mission > default text)
t(draft.clauses.object === 'Onboard 10 ops/day',                  'E · object = mission del canvas');
// Capital aplicat
near(draft.clauses.capital.totalEur, 8000, 0.01,                  'E · capital totalEur 8000');
t(draft.clauses.capital.hasInitialCash === true,                  'E · hasInitialCash true');
// Vesting des de token (no defaults)
t(draft.clauses.vesting.cliffMonths > 0,                          'E · vesting from token');
// Sunset metric aplicada
t(draft.clauses.sunset.autoIfMetricsBelow.metric === 'monthly-revenue-eur',
                                                                  'E · sunset metric set');
// Context summary
eq(draft.context.projectName, 'TestProj',                         'E · context.projectName');
eq(draft.context.partiesCount, 2,                                 'E · context.partiesCount');
t(draft.context.canvasSummary.mission === 'Onboard 10 ops/day',   'E · canvasSummary.mission');
t(draft.context.invoicesPaidCount === 3,                          'E · invoicesPaidCount');

// project required
let threw = false;
try { buildEnrichedPactDraft({}); } catch (_) { threw = true; }
t(threw,                                                          'E · project required throws');

// Sense canvas · object queda default
const projNoCanvas = { id: 'p2', nombre: 'P2', content: {} };
const draft2 = buildEnrichedPactDraft({ project: projNoCanvas });
t(draft2.clauses.object.length > 0,                               'E · default object si no canvas');
eq(draft2.context.canvasSummary, null,                            'E · canvasSummary null');

// ─── F · buildAiPromptForPactClauses ─────────────────────────────────────
const prompt = buildAiPromptForPactClauses(draft);
t(prompt.includes('TestProj'),                                    'F · projectName al prompt');
t(prompt.includes('mission'),                                     'F · mission keyword');
t(prompt.includes('€8000'),                                       'F · capital € present');
t(prompt.includes('JSON'),                                        'F · format JSON');
t(prompt.includes('object'),                                      'F · format object key');
t(prompt.includes('exitRationale'),                               'F · format exitRationale key');
t(prompt.includes('conflictRationale'),                           'F · format conflictRationale');
t(prompt.includes('sunsetRationale'),                             'F · format sunsetRationale');
t(prompt.includes('cooperatius'),                                 'F · estil coop');

// Sense draft · throws
threw = false;
try { buildAiPromptForPactClauses(null); } catch (_) { threw = true; }
t(threw,                                                          'F · null throws');

// ─── G · applyAIDraftToPact ──────────────────────────────────────────────
const rawAI = JSON.stringify({
    object: 'Construir un projecte cooperatiu sostenible amb governança transparent i economia de saldo prepagat per a 108 cohort managers.',
    exitRationale: 'Sortida via slicing-pie · snapshot mensual · 90 dies cooldown.',
    conflictRationale: 'Mediació primer · arbitratge cooperatiu si cal · sense recurs a tribunals ordinaris.',
    sunsetRationale: 'Si MAU < 500 · es discuteix tancament o pivot · 90 dies grace period.',
});
const applied = applyAIDraftToPact(draft, rawAI);
eq(applied.applied, true,                                         'G · aplicat true');
t(applied.enrichedDraft.clauses.object.includes('108 cohort'),    'G · object substituït amb AI');
eq(applied.enrichedDraft.aiNotes.exitRationale, 'Sortida via slicing-pie · snapshot mensual · 90 dies cooldown.',
                                                                  'G · exitRationale aplicat');
t(typeof applied.enrichedDraft.aiNotes.generatedAt === 'string',  'G · generatedAt ISO');
t(applied.enrichedDraft !== draft,                                'G · immutable · new ref');

// Object too short · preserva original
const shortAI = JSON.stringify({ object: 'curt', exitRationale: 'x' });
const appliedShort = applyAIDraftToPact(draft, shortAI);
t(appliedShort.enrichedDraft.clauses.object === draft.clauses.object,
                                                                  'G · object curt · preserva original');

// Markdown fence strip
const wrappedAI = '```json\n' + rawAI + '\n```';
const appliedWrap = applyAIDraftToPact(draft, wrappedAI);
eq(appliedWrap.applied, true,                                     'G · markdown fence strip ok');

// Empty / null safe
const appEmpty = applyAIDraftToPact(draft, '');
eq(appEmpty.applied, false,                                       'G · empty · applied false');
t(appEmpty.error.includes('empty'),                               'G · error empty-output');

// Parse fail
const appBad = applyAIDraftToPact(draft, 'not json at all');
eq(appBad.applied, false,                                         'G · bad json · applied false');
t(appBad.error.includes('parse'),                                 'G · error parse-failed');

threw = false;
try { applyAIDraftToPact(null, '{}'); } catch (_) { threw = true; }
t(threw,                                                          'G · null draft throws');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
