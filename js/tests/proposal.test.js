// =============================================================================
// proposal.test.js · PROPOSAL-GENERATOR sprint A · pure logic + skill match
// =============================================================================

import {
    PROPOSAL_TYPE, PROPOSAL_STATUS,
    buildEmptyProposal,
    addDeliverable, removeDeliverable,
    setSkillsRequired,
    validateProposal,
    transitionProposalStatus,
    matchSkillsToBrief,
    computeProposalQuality,
    computeProposalsBreakdown,
    buildAiPromptForProposal,
    applyAIDraftToProposal,
} from '../core/proposalService.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');
const near = (a, b, eps, msg) => t(Math.abs(a - b) < eps, msg + ' (~' + b + ', got ' + a + ')');

// ─── A · constants ────────────────────────────────────────────────────────
eq(PROPOSAL_TYPE, 'proposal',                                     'A · TYPE');
for (const s of ['draft', 'sent', 'accepted', 'rejected', 'expired']) {
    t(s in PROPOSAL_STATUS,                                       'A · status ' + s + ' present');
}
t(PROPOSAL_STATUS.accepted.terminal,                              'A · accepted terminal');
t(PROPOSAL_STATUS.rejected.terminal,                              'A · rejected terminal');
t(!PROPOSAL_STATUS.draft.terminal,                                'A · draft no terminal');

// ─── B · buildEmptyProposal ───────────────────────────────────────────────
const p1 = buildEmptyProposal({ projectId: 'p1', client: 'Acme', ts: 1700000000000 });
eq(p1.type, PROPOSAL_TYPE,                                        'B · type');
eq(p1.projectId, 'p1',                                            'B · projectId');
eq(p1.content.client, 'Acme',                                     'B · client');
eq(p1.content.status, 'draft',                                    'B · status draft');
eq(p1.content.deliverables.length, 0,                             'B · empty deliverables');
eq(p1.content.pricing.total, 0,                                   'B · total 0');
eq(p1.content.pricing.currency, 'EUR',                            'B · EUR default');
t(p1.id.startsWith('prop-'),                                      'B · id prefix prop-');

// ─── C · addDeliverable + total recalc ────────────────────────────────────
const p2 = addDeliverable(p1, { description: 'Disseny', estimatedHours: 20, price: 1000 });
eq(p2.content.deliverables.length, 1,                             'C · 1 deliverable');
eq(p2.content.pricing.total, 1000,                                'C · total 1000');
const p3 = addDeliverable(p2, { description: 'Dev', estimatedHours: 40, price: 2400 });
eq(p3.content.pricing.total, 3400,                                'C · total 3400 (1000+2400)');
eq(p1.content.deliverables.length, 0,                             'C · immutable orig');

let threw = false;
try { addDeliverable(p1, { estimatedHours: 0, price: 100 }); } catch (_) { threw = true; }
t(threw,                                                          'C · hours 0 throws');
threw = false;
try { addDeliverable(p1, { estimatedHours: 10, price: -5 }); } catch (_) { threw = true; }
t(threw,                                                          'C · price < 0 throws');

// ─── D · removeDeliverable + total recalc ─────────────────────────────────
const p3r = removeDeliverable(p3, 0);
eq(p3r.content.deliverables.length, 1,                            'D · 1 deliverable resta');
eq(p3r.content.pricing.total, 2400,                               'D · total recalc 2400');
eq(p3r.content.deliverables[0].description, 'Dev',                'D · queda Dev');

threw = false;
try { removeDeliverable(p3, 99); } catch (_) { threw = true; }
t(threw,                                                          'D · out of range throws');

// ─── E · setSkillsRequired · valida existència a taxonomia ────────────────
const pSk = setSkillsRequired(p1, ['vision-strategic', 'fake-skill-x', 'slicing-pie']);
eq(pSk.content.skillsRequired.length, 2,                          'E · sols ids vàlids · 2/3');
t(pSk.content.skillsRequired.includes('vision-strategic'),        'E · vision-strategic vàlid');
t(!pSk.content.skillsRequired.includes('fake-skill-x'),           'E · fake-skill-x filtrat');

threw = false;
try { setSkillsRequired(p1, 'not-array'); } catch (_) { threw = true; }
t(threw,                                                          'E · non-array throws');

// ─── F · validateProposal ─────────────────────────────────────────────────
const valid = addDeliverable(buildEmptyProposal({ client: 'C', summary: 'Una proposta digne i extensa per al client X', currency: 'EUR' }),
                              { estimatedHours: 10, price: 500 });
eq(validateProposal(valid).ok, true,                              'F · valid proposal');

const noClient = buildEmptyProposal({ summary: 'summary suficientment llarga per passar validation' });
const noClientWithDel = addDeliverable(noClient, { estimatedHours: 1, price: 1 });
const v1 = validateProposal(noClientWithDel);
eq(v1.ok, false,                                                  'F · no client invalid');
t(v1.errors.includes('client-required'),                          'F · error client-required');

const noDel = buildEmptyProposal({ client: 'X', summary: 'summary suficientment llarga per passar validation' });
const v2 = validateProposal(noDel);
eq(v2.ok, false,                                                  'F · no deliverables invalid');
t(v2.errors.some(e => e.includes('deliverables-required')),       'F · error deliverables-required');

const shortSum = buildEmptyProposal({ client: 'X', summary: 'curt' });
const shortWithDel = addDeliverable(shortSum, { estimatedHours: 1, price: 1 });
const v3 = validateProposal(shortWithDel);
eq(v3.ok, false,                                                  'F · summary curt invalid');
t(v3.errors.some(e => e.includes('summary-too-short')),           'F · error summary-too-short');

// ─── G · transitionStatus ─────────────────────────────────────────────────
const sent = transitionProposalStatus(valid, 'sent');
eq(sent.content.status, 'sent',                                   'G · draft → sent ok');
t(typeof sent.content.sentAt === 'string',                        'G · sentAt set');
eq(valid.content.status, 'draft',                                 'G · immutable orig');

const accepted = transitionProposalStatus(sent, 'accepted');
eq(accepted.content.status, 'accepted',                           'G · sent → accepted ok');
t(typeof accepted.content.acceptedAt === 'string',                'G · acceptedAt set');

threw = false;
try { transitionProposalStatus(valid, 'accepted'); } catch (_) { threw = true; }
t(threw,                                                          'G · draft → accepted invalid');

threw = false;
try { transitionProposalStatus(accepted, 'rejected'); } catch (_) { threw = true; }
t(threw,                                                          'G · accepted terminal');

threw = false;
try { transitionProposalStatus(valid, 'unknown'); } catch (_) { threw = true; }
t(threw,                                                          'G · unknown status throws');

// ─── H · matchSkillsToBrief ───────────────────────────────────────────────
const briefGov = 'Necessitem dissenyar governança cooperativa amb facilitació de decisions';
const matches = matchSkillsToBrief(briefGov);
t(matches.length > 0,                                             'H · matches govern brief');
const matchIds = matches.map(m => m.skillId);
t(matchIds.includes('governance-design') || matchIds.includes('decision-facilitation'),
                                                                  'H · troba skills governance');
// Score descendent
for (let i = 1; i < matches.length; i++) {
    t(matches[i-1].score >= matches[i].score,                     'H · ordre score DESC ' + i);
}
// topN limit
const limited = matchSkillsToBrief(briefGov, { topN: 3 });
t(limited.length <= 3,                                            'H · topN respect');
// empty brief
eq(matchSkillsToBrief('').length, 0,                              'H · empty brief · []');
eq(matchSkillsToBrief(null).length, 0,                            'H · null brief · []');

// Finance brief
const matchesF = matchSkillsToBrief('Slicing pie equity dinàmic comptabilitat triple-entry');
const finIds = matchesF.map(m => m.skillId);
t(finIds.includes('slicing-pie') || finIds.includes('triple-entry-accounting'),
                                                                  'H · troba skills finance');

// ─── I · computeProposalQuality ───────────────────────────────────────────
// Invalid · score 0
const qBad = computeProposalQuality(buildEmptyProposal({ client: 'X' }));
eq(qBad.score, 0,                                                 'I · invalid · score 0');
eq(qBad.valid, false,                                             'I · invalid · valid false');

// Bàsic vàlid · baix score per pocs deliverables / sense skills / sense date
const qLow = computeProposalQuality(valid);
t(qLow.valid,                                                     'I · valid');
t(qLow.score >= 30 && qLow.score < 80,                            'I · score mid (poc complet)');
t(qLow.reasons.some(r => r.includes('no-skills-tagged')),         'I · reason no-skills');
t(qLow.reasons.some(r => r.includes('no-valid-until-date')),      'I · reason no-valid-until');

// High-quality · summary llarga + 3+ deliverables + skills + validUntil
let qHigh = buildEmptyProposal({
    client: 'Acme', summary: 'Proposta consultoria estratègica per a dissenyar governança cooperativa amb roles i transactions reals',
    validUntil: '2030-01-01',
});
qHigh = addDeliverable(qHigh, { estimatedHours: 10, price: 500 });
qHigh = addDeliverable(qHigh, { estimatedHours: 20, price: 1200 });
qHigh = addDeliverable(qHigh, { estimatedHours: 15, price: 900 });
qHigh = setSkillsRequired(qHigh, ['vision-strategic', 'governance-design']);
const qH = computeProposalQuality(qHigh);
t(qH.score >= 90,                                                 'I · complete · score ≥ 90');

// validUntil passat · -15
let qExp = qHigh;
qExp.content.validUntil = '2020-01-01';
const qE = computeProposalQuality(qExp);
t(qE.reasons.some(r => r.includes('expired-valid-until')),        'I · reason expired-valid-until');

// ─── J · computeProposalsBreakdown ────────────────────────────────────────
const make = (status, total) => {
    let p = buildEmptyProposal({ client: 'X', summary: 'Summary suficientment llarga per validar correctament' });
    p = addDeliverable(p, { estimatedHours: 10, price: total });
    p.content.status = status;
    return p;
};
const props = [
    make('draft', 100),
    make('sent', 500),
    make('accepted', 1000),
    make('accepted', 2000),
    make('rejected', 300),
];
const br = computeProposalsBreakdown(props);
eq(br.total, 5,                                                   'J · total 5');
eq(br.draft, 1,                                                   'J · draft 1');
eq(br.sent, 1,                                                    'J · sent 1');
eq(br.accepted, 2,                                                'J · accepted 2');
eq(br.rejected, 1,                                                'J · rejected 1');
near(br.totalValue, 3900, 0.01,                                   'J · totalValue 3900');
near(br.acceptedValue, 3000, 0.01,                                'J · acceptedValue 3000');
near(br.acceptedRatio, 2/5, 0.001,                                'J · acceptedRatio 0.4');

// ─── K · buildAiPromptForProposal ─────────────────────────────────────────
const prompt = buildAiPromptForProposal({
    brief:       'Cal dissenyar governança',
    client:      'Acme Coop',
    projectName: 'TestProj',
    matchedSkills: matches.slice(0, 3),
});
t(prompt.includes('Acme Coop'),                                   'K · prompt amb client');
t(prompt.includes('TestProj'),                                    'K · prompt amb projectName');
t(prompt.includes('Cal dissenyar governança'),                    'K · prompt amb brief');
t(prompt.includes('JSON'),                                        'K · format JSON');
t(prompt.includes('deliverables'),                                'K · format deliverables');
t(prompt.includes('summary'),                                     'K · format summary');

// ─── L · applyAIDraftToProposal ───────────────────────────────────────────
const rawAI = JSON.stringify({
    summary: 'Disseny + implementació de governança cooperativa per al client X amb roles i transactions clares',
    deliverables: [
        { description: 'Workshop inicial', estimatedHours: 4, price: 240 },
        { description: 'Diagnòstic + matriu rols', estimatedHours: 12, price: 720 },
        { description: 'Roll-out + suport 1 mes', estimatedHours: 20, price: 1200 },
    ],
    notes: 'Inclou 2 hores de revisió',
});
const pAI = applyAIDraftToProposal(buildEmptyProposal({ client: 'X' }), rawAI);
eq(pAI.content.deliverables.length, 3,                            'L · 3 deliverables aplicats');
near(pAI.content.pricing.total, 240 + 720 + 1200, 0.01,           'L · total auto-calc');
t(pAI.content.summary.includes('governança'),                     'L · summary aplicat');
t(pAI.content.notes.includes('revisió'),                          'L · notes aplicades');

// Amb markdown fence wrap · accepta
const rawWrap = '```json\n' + rawAI + '\n```';
const pWrap = applyAIDraftToProposal(buildEmptyProposal({ client: 'X' }), rawWrap);
eq(pWrap.content.deliverables.length, 3,                          'L · markdown fence ok');

threw = false;
try { applyAIDraftToProposal(buildEmptyProposal({ client: 'X' }), 'not json text'); } catch (_) { threw = true; }
t(threw,                                                          'L · bad json throws');

threw = false;
try { applyAIDraftToProposal(buildEmptyProposal({ client: 'X' }), ''); } catch (_) { threw = true; }
t(threw,                                                          'L · empty throws');

// Bad deliverable skipped, others applied
const partialAI = JSON.stringify({
    summary: 'Summary llarga per validar correctament i passar el min length',
    deliverables: [
        { description: 'OK', estimatedHours: 5, price: 300 },
        { description: 'BAD · no hours', price: 100 },
        { description: 'BAD2 · no price', estimatedHours: 5 },
    ],
});
const pPartial = applyAIDraftToProposal(buildEmptyProposal({ client: 'X' }), partialAI);
eq(pPartial.content.deliverables.length, 1,                       'L · bad deliverables skipped · sols 1');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
