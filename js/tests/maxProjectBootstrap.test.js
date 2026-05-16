// =============================================================================
// maxProjectBootstrap.test.js · MAX-BOOTSTRAP sprint A · 108-cohort generation
// =============================================================================

import {
    buildMaxQualityProject, MAX_BOOTSTRAP_VERSION, TARGET_COHORT_MANAGERS,
} from '../core/maxProjectBootstrap.js';
import { computeCanvasCompletion } from '../core/projectCanvasService.js';
import { computePitchCompletion } from '../core/projectPitchService.js';
import { computeBalanceSheet, computePLForPeriod } from '../core/ledgerService.js';
import { validateLedgerEntry } from '../core/ledgerService.js';
import { validateInvoice, computeInvoiceTotals } from '../core/invoiceService.js';
import { validateProposal } from '../core/proposalService.js';
import { validateTokenDesign } from '../core/tokenomicsService.js';
import { computeProjectLifecycle } from '../core/lifecycleService.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

// ─── A · constants ────────────────────────────────────────────────────────
eq(TARGET_COHORT_MANAGERS, 108,                                   'A · target 108');
t(typeof MAX_BOOTSTRAP_VERSION === 'string',                      'A · version present');

// ─── B · genera projecte sencer ───────────────────────────────────────────
const result = buildMaxQualityProject({ creatorHandle: '@test', ts: 1700000000000 });
t(result.project,                                                 'B · project node retornat');
eq(result.project.type, 'project',                                'B · type project');
t(result.project.id.startsWith('proj-max-'),                      'B · id prefix proj-max-');
eq(result.project.creatorHandle, '@test',                         'B · creatorHandle');
eq(result.project.content.bootstrapVersion, MAX_BOOTSTRAP_VERSION, 'B · bootstrapVersion anclat');
t(result.project.tags.includes('max-bootstrap'),                  'B · tag max-bootstrap');

// ─── C · roles del projecte + catàleg Learn separats ─────────────────────
// A · sprint analysis & design · DECISIÓ · 108 ja NO inflen vna_roles del
// projecte · viuen al catàleg global learn_role.
t(result.roles.length >= 5 && result.roles.length <= 12,          'C · roles del projecte · 5-12 (no inflat)');
const allProjectRole = result.roles.every(r => r.content.kind === 'project_role');
t(allProjectRole,                                                 'C · tots project_role (no cohort_manager)');
// project.vna_roles reflecteix les roles del projecte · no 108
eq(result.project.vna_roles.length, result.roles.length,          'C · project.vna_roles == roles.length');
t(result.project.vna_roles.length < 20,                           'C · vna_roles < 20 (mapa de valor net)');
// learnCatalog · 108 entrades globals
t(Array.isArray(result.learnCatalog),                             'C · learnCatalog array retornat');
eq(result.learnCatalog.length, 108,                               'C · learnCatalog = 108 entrades');
const allLearnRole = result.learnCatalog.every(r => r.type === 'learn_role');
t(allLearnRole,                                                   'C · tots type learn_role');
// cobertura de skills · ≥90 úniques al catàleg
const uniqueSkillsLearn = new Set(result.learnCatalog.map(r => r.content.primarySkillId));
t(uniqueSkillsLearn.size >= 90,                                   'C · learn catalog · ≥90 skills úniques');
// Cap learn_role té projectId (són globals)
const noProjectIdLeak = result.learnCatalog.every(r => !r.content.projectId);
t(noProjectIdLeak,                                                'C · learn catalog · cap node té projectId (globals)');

// ─── D · Canvas 5/5 ───────────────────────────────────────────────────────
const cc = computeCanvasCompletion(result.canvas);
eq(cc.percent, 100,                                               'D · canvas 100%');
eq(cc.filled, 5,                                                  'D · 5/5 steps');
t(result.canvas.completedAt !== null,                             'D · completedAt set');

// ─── E · Pitch 6/6 + publicat ─────────────────────────────────────────────
const pc = computePitchCompletion(result.pitch);
eq(pc.percent, 100,                                               'E · pitch 100%');
eq(pc.filled, 6,                                                  'E · 6/6 sections');
t(result.pitch.content.publishedAt !== null,                      'E · pitch publicat');
t(typeof result.pitch.content.slug === 'string' && result.pitch.content.slug.length > 0,
                                                                  'E · slug generat');

// ─── F · Tokenomics vàlid ─────────────────────────────────────────────────
const tv = validateTokenDesign(result.tokenomics);
eq(tv.ok, true,                                                   'F · tokenomics vàlid');
eq(result.tokenomics.content.symbol, 'COHO',                      'F · symbol COHO');
eq(result.tokenomics.content.totalSupply, 10_800_000,             'F · supply 10.8M (100k × 108)');

// ─── G · Ledger entries · balanced ────────────────────────────────────────
t(result.ledgerEntries.length >= 3,                               'G · ≥3 ledger entries inicials');
for (const e of result.ledgerEntries) {
    eq(validateLedgerEntry(e).ok, true,                           'G · ledger entry valid · ' + e.content.description);
}
// També el ledger entry auto del invoice paid · ja inclós a ledgerEntries
const bs = computeBalanceSheet(result.ledgerEntries);
t(bs.balanced,                                                    'G · balance sheet quadra (A = L + E)');
const pl = computePLForPeriod(result.ledgerEntries, {});
t(pl.profit > 0,                                                  'G · P&L positiu');

// ─── H · Invoices · 1 paid + 1 sent ────────────────────────────────────────
eq(result.invoices.length, 2,                                     'H · 2 invoices');
const paid = result.invoices.find(i => i.content.status === 'paid');
const sent = result.invoices.find(i => i.content.status === 'sent');
t(paid && sent,                                                   'H · 1 paid + 1 sent');
t(typeof paid.content.ledgerEntryId === 'string',                 'H · paid invoice té ledgerEntryId enllaçat');
// Validation
eq(validateInvoice(paid).ok, true,                                'H · paid invoice valid');
eq(validateInvoice(sent).ok, true,                                'H · sent invoice valid');
// Total > 0
const paidTot = computeInvoiceTotals(paid);
t(paidTot.total > 0,                                              'H · paid total > 0');

// ─── I · Proposals · 1 accepted + 1 sent ──────────────────────────────────
eq(result.proposals.length, 2,                                    'I · 2 proposals');
const acc = result.proposals.find(p => p.content.status === 'accepted');
const sentP = result.proposals.find(p => p.content.status === 'sent');
t(acc && sentP,                                                   'I · 1 accepted + 1 sent');
eq(validateProposal(acc).ok, true,                                'I · accepted proposal valid');
eq(validateProposal(sentP).ok, true,                              'I · sent proposal valid');
t((acc.content.deliverables || []).length >= 3,                   'I · accepted ≥3 deliverables');
t((acc.content.skillsRequired || []).length >= 3,                 'I · accepted ≥3 skills');

// ─── J · Market items · 1 product + 1 service ────────────────────────────
eq(result.marketItems.length, 2,                                  'J · 2 market items');
t(result.marketItems.some(m => m.content.kind === 'product'),     'J · 1 product');
t(result.marketItems.some(m => m.content.kind === 'service'),     'J · 1 service');

// ─── K · SOPs + Workshops · presents ──────────────────────────────────────
t(result.sops.length >= 3,                                        'K · ≥3 SOPs');
t(result.workshops.length >= 3,                                   'K · ≥3 workshops');
t(result.sops.every(s => s.content.projectId === result.project.id), 'K · SOPs projectId match');
t(result.workshops.every(w => w.content.projectId === result.project.id), 'K · workshops projectId match');

// ─── L · Lifecycle dashboard · 9/10+ fases done · overall ≥75% ───────────
// Simulem una crida amb tots els nodes
const lc = computeProjectLifecycle({
    project:       result.project,
    ledgerEntries: result.ledgerEntries,
    sops:          result.sops.map(s => ({ ...s, projectId: result.project.id })),
    workOrders:    [],   // sense WOs encara · l'improvement loop els crearà
    pacts:         [],
    workshops:     result.workshops.map(w => ({ ...w, projectId: result.project.id })),
    marketItems:   result.marketItems.map(m => ({ ...m, projectId: result.project.id })),
    invoices:      result.invoices,
    tokenomics:    [result.tokenomics],
    pitches:       [result.pitch],
    proposals:     result.proposals,
});
t(lc.overall.percent >= 60,                                       'L · lifecycle overall ≥60% (' + lc.overall.percent + '%)');
// Phases que han d'estar done o partial
const phasesById = new Map(lc.phases.map(p => [p.id, p]));
eq(phasesById.get('canvas').status, 'done',                       'L · canvas done');
eq(phasesById.get('pitch').status, 'done',                        'L · pitch done (publicat + 6/6)');
// tokenomics ≥ partial (quality score variable)
t(['done', 'partial'].includes(phasesById.get('tokenomics').status), 'L · tokenomics done o partial');
// accounting · 3+ entries balanced · done
t(['done', 'partial'].includes(phasesById.get('accounting').status), 'L · accounting done/partial');
// proposals · accepted > 0 · done
eq(phasesById.get('proposals').status, 'done',                    'L · proposals done (accepted > 0)');
// products + workshops · done
eq(phasesById.get('products').status, 'done',                     'L · products done');
eq(phasesById.get('workshops').status, 'done',                    'L · workshops done');
// invoices · 1 paid de 2 · partial
t(['done', 'partial'].includes(phasesById.get('invoices').status), 'L · invoices partial (1/2 paid)');

// ─── M · stats summary ────────────────────────────────────────────────────
t(result.stats.cohortManagers === 108,                            'M · stats 108 cohort');
t(result.stats.skillsCovered >= 90,                               'M · stats ≥90 skills');

// ─── N · determinism · same ts → same id ──────────────────────────────────
const r1 = buildMaxQualityProject({ creatorHandle: '@test', ts: 1700000000000 });
const r2 = buildMaxQualityProject({ creatorHandle: '@test', ts: 1700000000000 });
eq(r1.project.id, r2.project.id,                                  'N · same ts → same id');
eq(r1.roles[0].id, r2.roles[0].id,                                'N · same ts → same role[0] id');

// Different creator → different id
const r3 = buildMaxQualityProject({ creatorHandle: '@other', ts: 1700000000000 });
t(r3.project.id !== r1.project.id,                                'N · different creator → different id');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
