// =============================================================================
// lifecycle.test.js · LIFECYCLE-DASHBOARD sprint A · pure phase computation
// =============================================================================

import {
    LIFECYCLE_PHASES,
    computeProjectLifecycle,
    computeNextBestAction,
} from '../core/lifecycleService.js';
import { buildEmptyCanvas, applyCanvasStep } from '../core/projectCanvasService.js';
import { quickEntry } from '../core/ledgerService.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

// ─── A · constants ────────────────────────────────────────────────────────
eq(LIFECYCLE_PHASES.length, 10,                                   'A · 10 phases');
const ids = LIFECYCLE_PHASES.map(p => p.id);
for (const need of ['canvas', 'pitch', 'kanban', 'pacts', 'tokenomics', 'accounting', 'proposals', 'products', 'workshops', 'invoices']) {
    t(ids.includes(need),                                         'A · phase ' + need + ' present');
}

// ─── B · empty project ────────────────────────────────────────────────────
const empty = computeProjectLifecycle({ project: null });
eq(empty.phases.length, 0,                                        'B · null project · sense phases');
eq(empty.overall.percent, 0,                                      'B · overall 0%');
eq(empty.nextBestAction, null,                                    'B · nextBestAction null');

// ─── C · projecte buit (sense canvas/entries/etc) · totes pending ─────────
const bareProj = { id: 'p1', type: 'project', content: {} };
const bare = computeProjectLifecycle({ project: bareProj });
eq(bare.phases.length, 10,                                        'C · 10 phases retornades');
const pendingCount = bare.phases.filter(p => p.status === 'pending').length;
t(pendingCount >= 8,                                              'C · majoria pending');
eq(bare.overall.doneCount, 0,                                     'C · doneCount 0');
eq(bare.overall.percent, 0,                                       'C · overall 0%');
t(bare.nextBestAction !== null,                                   'C · nextBestAction definit');
eq(bare.nextBestAction.phase, 'canvas',                           'C · primer next = canvas (orden 1)');

// ─── D · canvas parcial · partial ─────────────────────────────────────────
let canvas = buildEmptyCanvas();
canvas = applyCanvasStep(canvas, 'vision', 'En 10 anys 100k operadors han facturat via SOS · cooperativa-first');
const proj2 = { id: 'p2', type: 'project', content: { canvas } };
const r2 = computeProjectLifecycle({ project: proj2 });
const canvasPh2 = r2.phases.find(p => p.id === 'canvas');
eq(canvasPh2.status, 'partial',                                   'D · canvas 1/5 · partial');
t(canvasPh2.completion > 0 && canvasPh2.completion < 1,           'D · completion 0-1');
t(canvasPh2.detail.includes('1/5'),                               'D · detail 1/5');

// canvas complet (5 steps)
let cFull = buildEmptyCanvas();
const drafts = {
    vision:       'Vision potent · 10 anys · 100k operadors han facturat via SOS · cooperativa-first',
    mission:      'Cada dia ajudem 10 operadors a llançar un projecte cooperatiu via SOS amb onboarding < 1 hora.',
    values:       'transparència radical · experimentació · anchoring ètic · open source · economia de saldo prepagat.',
    stakeholders: 'fundadors guanyen reputació · operadors guanyen ingressos · clients guanyen serveis · comunitat guanya open · inversors retorn a 5 anys.',
    'north-star': 'MAU que han facturat 1€ via SOS al mes',
};
for (const [id, val] of Object.entries(drafts)) cFull = applyCanvasStep(cFull, id, val);
const proj3 = { id: 'p3', type: 'project', content: { canvas: cFull } };
const r3 = computeProjectLifecycle({ project: proj3 });
const canvasPh3 = r3.phases.find(p => p.id === 'canvas');
eq(canvasPh3.status, 'done',                                      'D · canvas 5/5 · done');
eq(canvasPh3.completion, 1,                                       'D · completion 1');

// ─── E · accounting · 3+ entries balanced → done ──────────────────────────
const entries3 = [
    quickEntry({ projectId: 'p4', debitAccount: 'cash',     creditAccount: 'revenue', amount: 100, date: '2026-01-01' }),
    quickEntry({ projectId: 'p4', debitAccount: 'cash',     creditAccount: 'revenue', amount: 200, date: '2026-01-15' }),
    quickEntry({ projectId: 'p4', debitAccount: 'expenses', creditAccount: 'cash',    amount: 50,  date: '2026-01-20' }),
];
const proj4 = { id: 'p4', type: 'project', content: {} };
const r4 = computeProjectLifecycle({ project: proj4, ledgerEntries: entries3 });
const accPh = r4.phases.find(p => p.id === 'accounting');
eq(accPh.status, 'done',                                          'E · 3+ entries balanced · done');
eq(accPh.completion, 1,                                           'E · accounting completion 1');
t(accPh.detail.includes('3 entries'),                             'E · detail 3 entries');
t(accPh.detail.includes('quadrat'),                               'E · detail quadrat');

// 1 entry · partial
const r5 = computeProjectLifecycle({ project: proj4, ledgerEntries: [entries3[0]] });
const acc5 = r5.phases.find(p => p.id === 'accounting');
eq(acc5.status, 'partial',                                        'E · 1 entry · partial');

// 0 entries · pending
const r6 = computeProjectLifecycle({ project: proj4, ledgerEntries: [] });
const acc6 = r6.phases.find(p => p.id === 'accounting');
eq(acc6.status, 'pending',                                        'E · 0 entries · pending');
t(acc6.href.includes('/accounting'),                              'E · href /accounting');

// ─── F · kanban · sops + wos ──────────────────────────────────────────────
const sops = [{ id: 's1', projectId: 'p5' }, { id: 's2', projectId: 'p5' }];
const wos  = [{ id: 'w1', projectId: 'p5' }, { id: 'w2', projectId: 'p5' }];
const proj5 = { id: 'p5', type: 'project', content: {} };
const r7 = computeProjectLifecycle({ project: proj5, sops, workOrders: wos });
const knPh = r7.phases.find(p => p.id === 'kanban');
eq(knPh.status, 'done',                                           'F · kanban 2+2 (>=3) · done');
t(knPh.detail.includes('2 SOPs'),                                 'F · detail 2 SOPs');
t(knPh.detail.includes('2 WOs'),                                  'F · detail 2 WOs');

// Sols 1 SOP · partial
const r7b = computeProjectLifecycle({ project: proj5, sops: [sops[0]], workOrders: [] });
const knPh2 = r7b.phases.find(p => p.id === 'kanban');
eq(knPh2.status, 'partial',                                       'F · kanban 1 SOP · partial');

// ─── G · pacts · signats / pendents ───────────────────────────────────────
const pacts = [
    { id: 'pact1', projectId: 'p6', content: { signatures: [{}] } },
    { id: 'pact2', projectId: 'p6', content: { signatures: [] } },
];
const proj6 = { id: 'p6', type: 'project', content: {} };
const r8 = computeProjectLifecycle({ project: proj6, pacts });
const pactPh = r8.phases.find(p => p.id === 'pacts');
eq(pactPh.status, 'partial',                                      'G · pacts 1/2 signats · partial');
eq(pactPh.completion, 0.5,                                        'G · completion 0.5');

// 2/2 signats · done
const allSigned = pacts.map(p => ({ ...p, content: { signatures: [{}] } }));
const r9 = computeProjectLifecycle({ project: proj6, pacts: allSigned });
const pactPh2 = r9.phases.find(p => p.id === 'pacts');
eq(pactPh2.status, 'done',                                        'G · pacts 2/2 · done');

// ─── H · products + workshops ─────────────────────────────────────────────
const market = [{ id: 'm1', projectId: 'p7', kind: 'product' }, { id: 'm2', projectId: 'p7', kind: 'service' }];
const workshops = [{ id: 'ws1', projectId: 'p7' }];
const proj7 = { id: 'p7', type: 'project', content: {} };
const r10 = computeProjectLifecycle({ project: proj7, marketItems: market, workshops });
const prodPh = r10.phases.find(p => p.id === 'products');
eq(prodPh.status, 'done',                                         'H · 1 product · done');
t(prodPh.detail.includes('1 producte'),                           'H · detail 1 producte');
const wsPh = r10.phases.find(p => p.id === 'workshops');
eq(wsPh.status, 'done',                                           'H · 1 workshop · done');

// ─── I · pitch / tokenomics / proposals · pending Wave 1 ──────────────────
// invoices ja és live (sprint A done) · té href · pending si 0 invoices
const r11 = computeProjectLifecycle({ project: proj4 });
for (const id of ['pitch', 'tokenomics', 'proposals']) {
    const ph = r11.phases.find(p => p.id === id);
    eq(ph.status, 'pending',                                      'I · ' + id + ' pending Wave 1');
    t(ph.nextAction.includes('Wave 1') || ph.nextAction.includes('crear') || ph.nextAction.includes('dissenyar') || ph.nextAction.includes('generar'),
                                                                  'I · ' + id + ' nextAction informatiu');
}
// invoices · ja és live · pending amb href si 0 invoices
const invPh = r11.phases.find(p => p.id === 'invoices');
eq(invPh.status, 'pending',                                       'I · invoices 0 → pending');
t(invPh.href !== null && invPh.href.includes('/invoices'),        'I · invoices href live (sprint A done)');

// ─── J · overall completion · weighted ────────────────────────────────────
// Projecte amb canvas done · accounting done · pacts done · kanban done ·
// products done · workshops done · resta pending
const projFull = {
    id: 'pf', type: 'project', content: { canvas: cFull, pitch: 'narrative inline · suficient per partial' },
    presentation_narrative_v1: 'pitch narrative',
};
const entriesFull = [
    quickEntry({ projectId: 'pf', debitAccount: 'cash',     creditAccount: 'revenue', amount: 100, date: '2026-01-01' }),
    quickEntry({ projectId: 'pf', debitAccount: 'cash',     creditAccount: 'revenue', amount: 200, date: '2026-01-15' }),
    quickEntry({ projectId: 'pf', debitAccount: 'expenses', creditAccount: 'cash',    amount: 50,  date: '2026-01-20' }),
];
const sopsFull = [{ id: 's1', projectId: 'pf' }, { id: 's2', projectId: 'pf' }];
const wosFull  = [{ id: 'w1', projectId: 'pf' }, { id: 'w2', projectId: 'pf' }];
const pactsFull = [{ id: 'pa1', projectId: 'pf', content: { signatures: [{}] } }];
const marketFull = [{ id: 'm1', projectId: 'pf', kind: 'product' }];
const wsFull = [{ id: 'ws1', projectId: 'pf' }];

const rFull = computeProjectLifecycle({
    project: projFull,
    ledgerEntries: entriesFull,
    sops: sopsFull,
    workOrders: wosFull,
    pacts: pactsFull,
    marketItems: marketFull,
    workshops: wsFull,
});
t(rFull.overall.percent > 50,                                     'J · overall > 50%');
t(rFull.overall.doneCount >= 5,                                   'J · doneCount >=5');

// Next best action · primera pending o partial per ordre · després de canvas/kanban...
t(rFull.nextBestAction !== null,                                  'J · nextBestAction definit');
t(['pitch', 'tokenomics', 'proposals', 'invoices'].includes(rFull.nextBestAction.phase),
                                                                  'J · next a Wave 1 pendent');

// ─── K · computeNextBestAction helper ─────────────────────────────────────
const nba = computeNextBestAction({ project: proj4 });
t(nba !== null,                                                   'K · helper retorna nba');
eq(nba.phase, 'canvas',                                           'K · primer next canvas');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
