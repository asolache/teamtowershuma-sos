// =============================================================================
// projectPitch.test.js · PITCH-PUBLIC sprint A · pure logic tests
// =============================================================================

import {
    PROJECT_PITCH_TYPE, PITCH_SECTIONS,
    buildEmptyPitch,
    validatePitchSection, applyPitchSection,
    setPitchTagline,
    computePitchCompletion,
    publishPitch, unpublishPitch,
    prefillFromCanvas,
    buildOGMeta, renderOGTagsHtml,
} from '../core/projectPitchService.js';
import { buildEmptyCanvas, applyCanvasStep } from '../core/projectCanvasService.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

// ─── A · constants ────────────────────────────────────────────────────────
eq(PROJECT_PITCH_TYPE, 'project_pitch',                           'A · TYPE');
eq(PITCH_SECTIONS.length, 6,                                      'A · 6 sections');
const ids = PITCH_SECTIONS.map(s => s.id);
for (const need of ['problem', 'solution', 'traction', 'team', 'ask', 'vision']) {
    t(ids.includes(need),                                         'A · section ' + need + ' present');
}
// Algunes han de tenir canvasMap
t(PITCH_SECTIONS.find(s => s.id === 'vision').canvasMap === 'vision',     'A · vision canvasMap');
t(PITCH_SECTIONS.find(s => s.id === 'solution').canvasMap === 'mission', 'A · solution canvasMap mission');

// ─── B · buildEmptyPitch ──────────────────────────────────────────────────
const p1 = buildEmptyPitch({ projectId: 'p1', tagline: 'short', lang: 'ca', ts: 1700000000000 });
eq(p1.type, PROJECT_PITCH_TYPE,                                   'B · type');
eq(p1.projectId, 'p1',                                            'B · projectId');
eq(p1.content.tagline, 'short',                                   'B · tagline');
eq(p1.content.lang, 'ca',                                         'B · lang');
eq(p1.content.publishedAt, null,                                  'B · not published initial');
eq(p1.content.slug, null,                                         'B · no slug initial');
eq(Object.keys(p1.content.sections).length, 6,                    'B · 6 section entries');

// ─── C · validatePitchSection ─────────────────────────────────────────────
eq(validatePitchSection('problem', '').ok, false,                 'C · empty refused');
eq(validatePitchSection('problem', '').reason, 'empty',           'C · reason empty');
eq(validatePitchSection('problem', 'curt').ok, false,             'C · too short refused');
eq(validatePitchSection('problem', 'curt').reason, 'too-short',   'C · reason too-short');
eq(validatePitchSection('unknown-x', 'whatever').ok, false,       'C · unknown section refused');
const problemLong = 'Els fundadors cooperatius no tenen eina per dissenyar valor amb transparència. SOS resol això.';
eq(validatePitchSection('problem', problemLong).ok, true,         'C · long enough ok');
// Too long
const tooLong = 'x'.repeat(700);
eq(validatePitchSection('problem', tooLong).ok, false,            'C · too long refused');

// ─── D · applyPitchSection + immutability ─────────────────────────────────
const p2 = applyPitchSection(p1, 'problem', problemLong, { ts: 1700000001000 });
eq(p2.content.sections.problem.value, problemLong,                'D · value set');
eq(p1.content.sections.problem.value, '',                         'D · immutable orig');

let threw = false;
try { applyPitchSection(p1, 'problem', ''); } catch (e) { threw = true; eq(e.reason, 'empty', 'D · throw amb reason'); }
t(threw,                                                          'D · throws si invalid');

// ─── E · setPitchTagline · max 140 ────────────────────────────────────────
const t1 = setPitchTagline(p1, 'OS cooperatiu per a equips reals');
eq(t1.content.tagline, 'OS cooperatiu per a equips reals',        'E · tagline set');
const tLong = setPitchTagline(p1, 'x'.repeat(200));
eq(tLong.content.tagline.length, 140,                             'E · max 140 chars');

// ─── F · computePitchCompletion ───────────────────────────────────────────
eq(computePitchCompletion(p1).percent, 0,                         'F · 0% empty');
eq(computePitchCompletion(p2).percent, Math.round(100/6),         'F · 1/6 ≈ 17%');
eq(computePitchCompletion(null).percent, 0,                       'F · null safe');

// Fill tots · 100%
let pFull = p1;
const drafts = {
    problem:  'Fundadors cooperatius no tenen eines · escassa transparència real al disseny.',
    solution: 'SOS · sistema operatiu col·laboratiu local-first amb roles + transactions + entregables.',
    traction: '108 places de Matriu Cohort 0 · 5 PRs merged aquesta setmana · 1969 tests verds.',
    team:     'Fundadors anchors + operadors continuus + advisors externs · 9 roles 12 tx.',
    ask:      'Recursos · partners cooperatius · primers clients per a pilot enginyeria de valor.',
    vision:   'En 10 anys SOS és l\'estàndard cooperatiu mundial · 100k operadors actius.',
};
for (const [sid, v] of Object.entries(drafts)) pFull = applyPitchSection(pFull, sid, v);
eq(computePitchCompletion(pFull).percent, 100,                    'F · 100% tots omplerts');
eq(computePitchCompletion(pFull).filled, 6,                       'F · 6 filled');

// ─── G · publishPitch / unpublishPitch ────────────────────────────────────
threw = false;
try { publishPitch(p1, { projectName: 'X' }); } catch (e) { threw = true; t(e.message.includes('incomplete'), 'G · incomplete error msg'); }
t(threw,                                                          'G · throws si < 3 seccions');

const pub = publishPitch(pFull, { projectName: 'SOS Pilot Cooperatiu', ts: 1700001000000 });
t(typeof pub.content.publishedAt === 'string',                    'G · publishedAt set');
t(typeof pub.content.slug === 'string' && pub.content.slug.length > 0, 'G · slug generat');
eq(pub.content.slug, 'sos-pilot-cooperatiu',                      'G · slug kebab-case');
t(pub !== pFull,                                                  'G · immutable · noves refs');
eq(pFull.content.publishedAt, null,                               'G · orig sense canviar');

// Slug · ASCII safe · sense accents
const pubAccents = publishPitch(pFull, { projectName: 'Café Niño · Açúcar' });
t(!pubAccents.content.slug.includes('ç') && !pubAccents.content.slug.includes('í'),
                                                                  'G · slug ASCII safe (sense accents)');

const unpub = unpublishPitch(pub);
eq(unpub.content.publishedAt, null,                               'G · unpublished publishedAt null');
eq(unpub.content.slug, null,                                      'G · unpublished slug null');

// ─── H · prefillFromCanvas ────────────────────────────────────────────────
let canvas = buildEmptyCanvas();
canvas = applyCanvasStep(canvas, 'vision',  'En 10 anys 100k operadors han facturat via SOS · cooperativa-first');
canvas = applyCanvasStep(canvas, 'mission', 'Cada dia ajudem 10 operadors a llançar projecte cooperatiu en menys d\'una hora.');

const filled = prefillFromCanvas(p1, canvas);
t(filled.content.sections.vision.value.includes('10 anys'),       'H · vision pre-filled');
t(filled.content.sections.solution.value.includes('operadors'),   'H · solution pre-filled (from mission)');
// Problem sense canvasMap · queda buit
eq(filled.content.sections.problem.value, '',                     'H · problem sense canvasMap · buit');

// No sobreescriu seccions ja omplertes
const pWithVision = applyPitchSection(p1, 'vision', 'Vision pròpia ja definida abans del prefill ' + 'x'.repeat(40));
const filled2 = prefillFromCanvas(pWithVision, canvas);
eq(filled2.content.sections.vision.value, pWithVision.content.sections.vision.value,
                                                                  'H · NO sobreescriu vision ja omplert');

// null canvas safe
const safe = prefillFromCanvas(p1, null);
eq(safe, p1,                                                      'H · null canvas → pitch sense canvis');

// ─── I · buildOGMeta ──────────────────────────────────────────────────────
const project = { id: 'p1', nombre: 'SOS Pilot Cooperatiu', sector_id: 'agro' };
const og = buildOGMeta({ pitch: pub, project, absoluteUrl: 'https://sos.example.com' });
t(og.title.includes('SOS Pilot Cooperatiu'),                      'I · OG title projectName');
t(og.description.length <= 200,                                   'I · OG description max 200');
t(og.url.includes('https://sos.example.com'),                     'I · OG url absolute');
t(og.url.includes('/pitch/'),                                     'I · OG url /pitch/ amb slug');
eq(og.type, 'website',                                            'I · OG type website');

// Sense pitch
const og2 = buildOGMeta({ project });
t(og2.title.includes('SOS Pilot'),                                'I · sense pitch · title projectName');
t(og2.url.includes('/pitch?project='),                            'I · sense slug · ?project= URL');

// Sense res
const og3 = buildOGMeta({});
t(typeof og3.title === 'string',                                  'I · empty · safe defaults');

// Tagline cap a description
const pTag = setPitchTagline(pFull, 'OS cooperatiu local-first per a valor real');
const ogT = buildOGMeta({ pitch: pTag, project });
t(ogT.description.includes('OS cooperatiu'),                      'I · description usa tagline');

// ─── J · renderOGTagsHtml ─────────────────────────────────────────────────
const html = renderOGTagsHtml(og);
t(html.includes('og:title'),                                      'J · html · og:title');
t(html.includes('og:description'),                                'J · html · og:description');
t(html.includes('twitter:card'),                                  'J · html · twitter:card');
t(html.includes('summary'),                                       'J · html · summary card type (sense image)');
// HTML safe · sense < " no escapats
t(!html.includes('"></script>'),                                  'J · html safe escape');

// Amb image
const ogImg = { ...og, image: 'https://sos.example.com/hero.png' };
const htmlImg = renderOGTagsHtml(ogImg);
t(htmlImg.includes('summary_large_image'),                        'J · html · large card amb image');
t(htmlImg.includes('og:image'),                                   'J · html · og:image tag');

eq(renderOGTagsHtml(null), '',                                    'J · null og → empty string');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
