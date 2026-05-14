// =============================================================================
// projectCanvas.test.js · CANVAS-WIZARD sprint A · pure logic tests
// =============================================================================

import {
    CANVAS_STEPS,
    buildEmptyCanvas,
    validateCanvasStep,
    applyCanvasStep,
    computeCanvasCompletion,
    applyCanvasToProject,
    buildAiPromptForStep,
    generateStepDraft,
} from '../core/projectCanvasService.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

// ─── A · STEPS schema ─────────────────────────────────────────────────────
eq(CANVAS_STEPS.length, 5,                                        'A · 5 steps');
const ids = CANVAS_STEPS.map(s => s.id);
t(ids.includes('vision') && ids.includes('mission') && ids.includes('values') && ids.includes('stakeholders') && ids.includes('north-star'),
                                                                  'A · steps vision/mission/values/stakeholders/north-star');
for (const s of CANVAS_STEPS) {
    t(typeof s.minLength === 'number' && s.minLength > 0,         'A · step ' + s.id + ' · minLength positive');
    t(typeof s.maxLength === 'number' && s.maxLength > s.minLength, 'A · step ' + s.id + ' · maxLength > min');
    t(typeof s.aiSeed === 'string' && s.aiSeed.length > 10,       'A · step ' + s.id + ' · aiSeed not empty');
}

// ─── B · buildEmptyCanvas ─────────────────────────────────────────────────
const empty = buildEmptyCanvas({ ts: 1700000000000 });
eq(empty.createdAt, 1700000000000,                                'B · createdAt injectable');
eq(empty.completedAt, null,                                       'B · completedAt null inicial');
eq(Object.keys(empty.steps).length, 5,                            'B · 5 step entries');
for (const s of CANVAS_STEPS) {
    eq(empty.steps[s.id].value, '',                               'B · step ' + s.id + ' · value empty');
    eq(empty.steps[s.id].updatedAt, null,                         'B · step ' + s.id + ' · updatedAt null');
}

// ─── C · validateCanvasStep ───────────────────────────────────────────────
eq(validateCanvasStep('vision', '').ok, false,                    'C · empty refused');
eq(validateCanvasStep('vision', '').reason, 'empty',              'C · reason empty');
eq(validateCanvasStep('vision', 'curt').ok, false,                'C · too short refused');
eq(validateCanvasStep('vision', 'curt').reason, 'too-short',      'C · reason too-short');
eq(validateCanvasStep('unknown-step', 'whatever').ok, false,      'C · unknown step refused');
const longVision = 'Una vision potent · '.repeat(2) + 'arribem als 1k operadors actius';
eq(validateCanvasStep('vision', longVision).ok, true,             'C · long enough ok');
// max length
const tooLong = 'x'.repeat(500);
const validMax = validateCanvasStep('vision', tooLong);
eq(validMax.ok, false,                                            'C · too long refused');
eq(validMax.reason, 'too-long',                                   'C · reason too-long');

// ─── D · applyCanvasStep ──────────────────────────────────────────────────
let c = buildEmptyCanvas({ ts: 1700000000000 });
const vision1 = 'En 10 anys 100k operadors han facturat via SOS · cooperativa-first';
c = applyCanvasStep(c, 'vision', vision1, { ts: 1700000001000 });
eq(c.steps.vision.value, vision1,                                 'D · vision value set');
eq(c.steps.vision.updatedAt, 1700000001000,                       'D · vision updatedAt set');
eq(c.completedAt, null,                                           'D · completedAt null encara (només 1 step)');
eq(c.updatedAt, 1700000001000,                                    'D · canvas updatedAt mou');

// Immutabilitat · canvas original no s'ha mutat
const orig = buildEmptyCanvas({ ts: 1700000000000 });
const next = applyCanvasStep(orig, 'vision', vision1);
t(orig !== next,                                                  'D · immutable · diferents refs');
eq(orig.steps.vision.value, '',                                   'D · immutable · orig sense canviar');

// Validation fail · throws
let threw = false;
try { applyCanvasStep(c, 'vision', ''); } catch (e) { threw = true; eq(e.reason, 'empty', 'D · throw amb reason'); }
t(threw,                                                          'D · throw quan invalid');

// ─── E · completedAt detecció · 5 steps omplerts ──────────────────────────
let full = buildEmptyCanvas({ ts: 1700000000000 });
const drafts = {
    vision:       vision1,
    mission:      'Cada dia ajudem 10 operadors a llançar un projecte cooperatiu via SOS amb un onboarding < 1 hora.',
    values:       'transparència radical · experimentació > consens · anchoring ètic · open source · economia de saldo.',
    stakeholders: 'fundadors guanyen reputació · operadors guanyen ingressos · clients guanyen serveis cooperatius · comunitat guanya open source · inversors retorn a 5 anys via slicing pie.',
    'north-star': 'MAU que han facturat 1€ via SOS al mes',
};
let ts = 1700000001000;
for (const [id, val] of Object.entries(drafts)) {
    full = applyCanvasStep(full, id, val, { ts: ts++ });
}
t(full.completedAt !== null,                                      'E · completedAt set quan 5 omplerts');

// ─── F · computeCanvasCompletion ──────────────────────────────────────────
eq(computeCanvasCompletion(empty).percent, 0,                     'F · 0% buit');
eq(computeCanvasCompletion(empty).filled, 0,                      'F · 0 filled');
eq(computeCanvasCompletion(c).filled, 1,                          'F · 1 filled un step');
eq(computeCanvasCompletion(c).percent, 20,                        'F · 20% un step');
eq(computeCanvasCompletion(full).filled, 5,                       'F · 5 filled tots');
eq(computeCanvasCompletion(full).percent, 100,                    'F · 100% tots');
eq(computeCanvasCompletion(null).percent, 0,                      'F · null safe');

// ─── G · applyCanvasToProject ─────────────────────────────────────────────
const project = { id: 'p1', type: 'project', content: { description: 'd', tags: ['x'] }, updatedAt: 1 };
const merged   = applyCanvasToProject(project, full);
t(merged !== project,                                             'G · immutable · diferents refs');
eq(merged.content.description, 'd',                               'G · description preservada');
t(Array.isArray(merged.content.tags) && merged.content.tags[0] === 'x', 'G · tags preservats');
t(merged.content.canvas === full,                                 'G · canvas anclat');
t(merged.updatedAt > 1,                                           'G · updatedAt actualitzat');

// ─── H · buildAiPromptForStep ─────────────────────────────────────────────
const prompt1 = buildAiPromptForStep('vision', { projectName: 'TestProj', sector: 'agro', description: 'd' });
t(prompt1.includes('Vision'),                                     'H · prompt inclou label');
t(prompt1.includes('TestProj'),                                   'H · prompt inclou projectName');
t(prompt1.includes('agro'),                                       'H · prompt inclou sector');
t(prompt1.includes('caràcters'),                                  'H · prompt inclou constraint length');

// previousSteps merge
const prompt2 = buildAiPromptForStep('mission', {
    projectName:    'TestProj',
    previousSteps:  { vision: { value: vision1, updatedAt: 1 } },
});
t(prompt2.includes(vision1),                                      'H · prompt mission inclou vision prev');

let threwH = false;
try { buildAiPromptForStep('unknown'); } catch (_) { threwH = true; }
t(threwH,                                                         'H · unknown step throws');

// ─── I · generateStepDraft (mock runner) ──────────────────────────────────
let lastPrompt = null;
const mockRunner = async ({ prompt }) => { lastPrompt = prompt; return 'En 10 anys SOS és l\'estàndard cooperatiu mundial.'; };
const draft = await generateStepDraft({ stepId: 'vision', context: { projectName: 'X' }, runner: mockRunner });
t(typeof draft === 'string' && draft.length > 10,                 'I · draft retornat');
t(lastPrompt && lastPrompt.includes('Vision'),                    'I · runner cridat amb prompt');

// runner null · throws
let threwI = false;
try { await generateStepDraft({ stepId: 'vision' }); } catch (_) { threwI = true; }
t(threwI,                                                         'I · runner required');

// runner empty response · throws
let threwI2 = false;
try { await generateStepDraft({ stepId: 'vision', runner: async () => '' }); } catch (_) { threwI2 = true; }
t(threwI2,                                                        'I · empty draft throws');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
