// PRESENTATION-EDIT-001 · tests stand-alone per buildPresentationEditUpdates
// Ús: node js/tests/presentationEdit.test.js
//
// La funció és pura · construeix l'objecte `updates` per a UPDATE_PROJECT_INFO
// a partir d'un snapshot de formulari + projecte existent. Els tests cobreixen
// edicions parcials, neteja de camps, role descs, persistència audienceId etc.

import { buildPresentationEditUpdates } from '../views/PresentationView.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== PRESENTATION-EDIT-001 · buildPresentationEditUpdates ===\n');

const baseProject = { id: 'p1', nombre: 'Test', description: 'desc previ' };

// A · sense project · throw
let threw = null;
try { buildPresentationEditUpdates({}, null); } catch (e) { threw = e; }
t(threw && /requires snapshot/.test(threw.message), 'A · sense project · throw');

// B · snapshot complet · tots els camps mapejats
const fullSnap = {
    heroTag:    'Cooperativa Test',
    heroTitle:  'Projecte Test',
    heroMantra: 'Una frase potent del projecte.',
    description: 'A meaningful description longer than 60 characters that describes the project purpose.',
    bodyMarkdown: '## Què oferim\nUn paràgraf.\n\n## Per qui\nUn altre.',
    roleDescriptions: {
        'r1': '  r1 fa això des del punt de vista del client.  ',  // trim
        'r2': 'r2 coordina la resta.',
    },
};
const r1 = buildPresentationEditUpdates(fullSnap, baseProject);
t(typeof r1 === 'object',                                          'B · retorna objecte updates');
eq(r1.description, fullSnap.description,                           'B · description persistida');
t(typeof r1.presentation_narrative_v1 === 'object',                'B · narrative és objecte');
eq(r1.presentation_narrative_v1.heroTag,    'Cooperativa Test',    'B · heroTag');
eq(r1.presentation_narrative_v1.heroTitle,  'Projecte Test',       'B · heroTitle');
eq(r1.presentation_narrative_v1.heroMantra, 'Una frase potent del projecte.', 'B · heroMantra');
t(r1.presentation_narrative_v1.bodyMarkdown.includes('Què oferim'), 'B · bodyMarkdown persistit');
eq(Object.keys(r1.presentation_narrative_v1.roleDescriptions).length, 2, 'B · 2 roleDescs persistides');
eq(r1.presentation_narrative_v1.roleDescriptions.r1, 'r1 fa això des del punt de vista del client.', 'B · trim roleDesc');
t(typeof r1.presentation_narrative_v1.editedAt === 'number',       'B · editedAt timestamp');
t(typeof r1.updatedAt === 'number',                                'B · updatedAt timestamp');

// C · roleDescriptions buides es filtren · si tots són buits, sense roleDesc
const noneRoles = buildPresentationEditUpdates({
    heroTag: 'X', heroTitle: 'Y', heroMantra: 'Z',
    description: 'd'.repeat(70),
    bodyMarkdown: '',
    roleDescriptions: { r1: '', r2: '   ', r3: null },
}, baseProject);
eq(Object.keys(noneRoles.presentation_narrative_v1.roleDescriptions).length, 0, 'C · roleDescs buides filtrades');

// D · snapshot buit total · presentation_narrative_v1 = null (no clobbery res)
const emptySnap = { heroTag:'', heroTitle:'', heroMantra:'', description:'', bodyMarkdown:'', roleDescriptions:{} };
const rEmpty = buildPresentationEditUpdates(emptySnap, baseProject);
eq(rEmpty.presentation_narrative_v1, null,                         'D · snapshot buit · narrative = null');
eq(rEmpty.description, '',                                         'D · description neta (l\'usuari l\'ha esborrada)');

// E · snapshot buit + project sense description prèvia · NO afegeix description: ''
const projectSenseDesc = { id: 'p2', nombre: 'Sense desc' };
const rNoDesc = buildPresentationEditUpdates(emptySnap, projectSenseDesc);
t(!('description' in rNoDesc),                                     'E · no escriu description si era buida abans i ara');

// F · preserva audienceId + generatedAt previs (no els esborra al editar)
const projectAmbNarrIA = {
    id: 'p3', nombre: 'P3',
    presentation_narrative_v1: {
        heroTag: 'Old', heroTitle: 'Old T',
        audienceId: 'fundadors',
        generatedAt: 1700000000000,
        roleDescriptions: {},
    },
};
const rPreserve = buildPresentationEditUpdates({
    heroTag: 'New', heroTitle: 'New T', heroMantra: 'New M',
    description: '', bodyMarkdown: '',
    roleDescriptions: {},
}, projectAmbNarrIA);
eq(rPreserve.presentation_narrative_v1.audienceId,  'fundadors',     'F · audienceId previ preservat');
eq(rPreserve.presentation_narrative_v1.generatedAt, 1700000000000,   'F · generatedAt previ preservat');
eq(rPreserve.presentation_narrative_v1.heroTag,     'New',           'F · heroTag sobrescrit');
eq(rPreserve.presentation_narrative_v1.heroTitle,   'New T',         'F · heroTitle sobrescrit');

// G · max-length clipping · valors massa llargs es retallen
const longSnap = {
    heroTag:    'x'.repeat(200),
    heroTitle:  'y'.repeat(300),
    heroMantra: 'z'.repeat(500),
    description: 'd'.repeat(2000),
    bodyMarkdown: 'b'.repeat(10000),
    roleDescriptions: { r1: 'r'.repeat(500) },
};
const rLong = buildPresentationEditUpdates(longSnap, baseProject);
eq(rLong.presentation_narrative_v1.heroTag.length,    80,           'G · heroTag clipped a 80');
eq(rLong.presentation_narrative_v1.heroTitle.length,  120,          'G · heroTitle clipped a 120');
eq(rLong.presentation_narrative_v1.heroMantra.length, 240,          'G · heroMantra clipped a 240');
eq(rLong.description.length,                          1000,         'G · description clipped a 1000');
eq(rLong.presentation_narrative_v1.bodyMarkdown.length, 4000,       'G · bodyMarkdown clipped a 4000');
eq(rLong.presentation_narrative_v1.roleDescriptions.r1.length, 240, 'G · roleDesc clipped a 240');

// H · sols hero (sense description) · narrative present però description no canvia
const heroOnly = buildPresentationEditUpdates({
    heroTag: 'Tag', heroTitle: 'Title', heroMantra: 'Mantra',
    description: '', bodyMarkdown: '', roleDescriptions: {},
}, baseProject);
t(heroOnly.presentation_narrative_v1.heroTag === 'Tag',            'H · sols hero · heroTag persistit');
eq(heroOnly.description, '',                                       'H · description neta');

// I · idempotència · cridar 2 cops amb mateix snapshot dóna mateix shape (modulo timestamps)
const s = { heroTag:'A', heroTitle:'B', heroMantra:'C', description:'d'.repeat(70), bodyMarkdown:'', roleDescriptions:{} };
const r2a = buildPresentationEditUpdates(s, baseProject);
const r2b = buildPresentationEditUpdates(s, baseProject);
eq(r2a.presentation_narrative_v1.heroTag,    r2b.presentation_narrative_v1.heroTag,    'I · heroTag idempotent');
eq(r2a.description,                          r2b.description,                          'I · description idempotent');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
