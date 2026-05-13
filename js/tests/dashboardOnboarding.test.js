// PROJ-QUALITY-001 sprint D · tests stand-alone per dashboardOnboardingService.
// Ús: node js/tests/dashboardOnboarding.test.js

import * as o from '../core/dashboardOnboardingService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}

console.log('\n=== PROJ-QUALITY-001 sprint D · dashboardOnboardingService ===\n');

// 1 · Exports
t(Array.isArray(o.ONBOARDING_STEPS),                                  'A · ONBOARDING_STEPS exportat');
t(o.ONBOARDING_STEPS.length === 5,                                    'A · 5 passes');
t(typeof o.computeOnboardingState === 'function',                     'A · computeOnboardingState exportat');
t(typeof o.onboardingCompletion === 'function',                       'A · onboardingCompletion exportat');
t(typeof o.nextOnboardingStep === 'function',                         'A · nextOnboardingStep exportat');

// 2 · Cada step té id+icon+label+cta
const validShapes = o.ONBOARDING_STEPS.every(s => s.id && s.icon && s.label && s.cta && s.cta.href);
t(validShapes,                                                        'A · cada step té id+icon+label+cta');

// 3 · Estat buit (cap dada) · tot fals
const sEmpty = o.computeOnboardingState({});
t(!sEmpty.identity,                                                   'B · sense identitat · identity=false');
t(!sEmpty.permaweb,                                                   'B · sense identitat · permaweb=false');
t(!sEmpty.project,                                                    'B · sense projectes · project=false');
t(!sEmpty.valueMap,                                                   'B · sense quality · valueMap=false');
t(!sEmpty.quality,                                                    'B · sense quality · quality=false');

// 4 · Completion buida
const cEmpty = o.onboardingCompletion(sEmpty);
t(cEmpty.done === 0 && cEmpty.total === 5 && cEmpty.pct === 0,        'B · completion 0/5 · 0%');

// 5 · nextStep buit · primer pas
const nEmpty = o.nextOnboardingStep(sEmpty);
t(nEmpty && nEmpty.id === 'identity',                                 'B · nextStep buit · identity');

// 6 · Identitat sense permaweb
const idLocal = { id: 'u1', content: { primaryDid: 'did:sos:abc', isPrimary: true } };
const s6 = o.computeOnboardingState({ identityNode: idLocal });
t(s6.identity && !s6.permaweb,                                        'C · identitat local · sols identity true');

// 7 · Identitat publicada (txId real)
const idPub = { id: 'u1', content: { primaryDid: 'did:sos:abc', arweaveTxId: 'REAL_TX_ABCDEF' } };
const s7 = o.computeOnboardingState({ identityNode: idPub });
t(s7.identity && s7.permaweb,                                         'C · identitat publicada real · permaweb true');

// 8 · Mock txId NO compta com a permaweb
const idMock = { id: 'u1', content: { primaryDid: 'did:sos:abc', arweaveTxId: 'MOCK_TX_123' } };
const s8 = o.computeOnboardingState({ identityNode: idMock });
t(s8.identity && !s8.permaweb,                                        'C · MOCK_TX_ NO compta com a permaweb');

// 9 · Projecte demo NO compta com a propi
const sDemoOnly = o.computeOnboardingState({
    projects: [{ id: 'proj-colla-demo-v11', nombre: 'Demo' }],
});
t(!sDemoOnly.project,                                                 'D · només demo · project=false');

// 10 · Projecte real compta
const sReal = o.computeOnboardingState({
    projects: [{ id: 'p1', nombre: 'Meu projecte' }],
});
t(sReal.project,                                                      'D · projecte real · project=true');

// 11 · Archivat NO compta
const sArch = o.computeOnboardingState({
    projects: [{ id: 'p1', nombre: 'X', isArchived: true }],
});
t(!sArch.project,                                                     'D · projecte archivat · project=false');

// 12 · valueMap dim ≥75
const sVM = o.computeOnboardingState({
    projects: [{ id: 'p1', nombre: 'X' }],
    qualityById: { p1: { total: 30, byDim: { valueMap: { score: 80 } } } },
});
t(sVM.project && sVM.valueMap,                                        'E · valueMap dim ≥75 · valueMap true');

// 13 · valueMap <75 · false
const sVMlow = o.computeOnboardingState({
    projects: [{ id: 'p1' }],
    qualityById: { p1: { total: 30, byDim: { valueMap: { score: 60 } } } },
});
t(!sVMlow.valueMap,                                                   'E · valueMap dim <75 · valueMap false');

// 14 · Score total ≥90 · quality true
const sQ = o.computeOnboardingState({
    projects: [{ id: 'p1' }],
    qualityById: { p1: { total: 92, byDim: { valueMap: { score: 100 } } } },
});
t(sQ.quality,                                                         'E · total ≥90 · quality true');

// 15 · Estat complet · tot true · next null
const sFull = o.computeOnboardingState({
    identityNode: idPub,
    projects: [{ id: 'p1' }],
    qualityById: { p1: { total: 95, byDim: { valueMap: { score: 100 } } } },
});
const cFull = o.onboardingCompletion(sFull);
t(cFull.done === 5 && cFull.pct === 100,                              'F · estat complet · 5/5 · 100%');
t(o.nextOnboardingStep(sFull) === null,                               'F · nextStep complet · null');

// 16 · Estat parcial · nextStep retorna el primer no-done
const sPartial = { identity: true, permaweb: true, project: false, valueMap: false, quality: false };
const nP = o.nextOnboardingStep(sPartial);
t(nP && nP.id === 'project',                                          'F · partial · next = project');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
