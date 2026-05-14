// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT PITCH SERVICE (PITCH-PUBLIC sprint A)
// Ruta · /js/core/projectPitchService.js
//
// Pitch one-pager · 6 seccions estàndard (problem · solution · traction ·
// team · ask · vision) · shareable URL · OG meta tags per cards a xarxes.
// Pure · zero KB · zero DOM. Schema · project_pitch node.
//
// Reusa · projectCanvasService (pre-fill des de canvas) ·
//         attestation count (traction) · computeQualityScore (traction)
//
// SCHEMA · project_pitch node ·
//   { id, type: 'project_pitch', projectId,
//     content: { sections: { problem, solution, traction, team, ask, vision },
//                tagline?, heroImage?, cta?, publishedAt?, slug?, lang? },
//     createdAt, updatedAt }
// =============================================================================

import { computeCanvasCompletion, CANVAS_STEPS } from './projectCanvasService.js';

export const PROJECT_PITCH_TYPE = 'project_pitch';

// 6 seccions standard del pitch · ordre rellevant (problem first · vision last)
export const PITCH_SECTIONS = Object.freeze([
    Object.freeze({
        id:         'problem',
        label:      '💢 Problem',
        prompt:     'Quin dolor concret resolem? Per a qui? Per què ara?',
        minLength:  30,
        maxLength:  500,
        canvasMap:  null,                          // sense fill auto
    }),
    Object.freeze({
        id:         'solution',
        label:      '💡 Solution',
        prompt:     'Què oferim? Com és diferent del que ja existeix?',
        minLength:  40,
        maxLength:  600,
        canvasMap:  'mission',                     // pre-fill from canvas mission
    }),
    Object.freeze({
        id:         'traction',
        label:      '📈 Traction',
        prompt:     'Què hem fet ja? Quants usuaris · MAU · contractes signats · etc.',
        minLength:  30,
        maxLength:  500,
        canvasMap:  null,
    }),
    Object.freeze({
        id:         'team',
        label:      '🧑‍🤝‍🧑 Team',
        prompt:     'Qui ho fa? Què aporta cadascú? Per què som l\'equip adequat?',
        minLength:  30,
        maxLength:  600,
        canvasMap:  null,
    }),
    Object.freeze({
        id:         'ask',
        label:      '🎯 Ask',
        prompt:     'Què demanem? Recursos · partners · clients · mentors · cohort.',
        minLength:  20,
        maxLength:  400,
        canvasMap:  null,
    }),
    Object.freeze({
        id:         'vision',
        label:      '🌅 Vision',
        prompt:     'Com és el món si triomfem? 1-2 frases · present narratiu.',
        minLength:  20,
        maxLength:  400,
        canvasMap:  'vision',                      // pre-fill from canvas vision
    }),
]);

const SECTION_BY_ID = new Map(PITCH_SECTIONS.map(s => [s.id, s]));

// buildEmptyPitch · pura · pitch inicial buit
export function buildEmptyPitch({
    projectId = null,
    tagline   = '',
    lang      = 'ca',
    ts        = null,
} = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    const sections = {};
    for (const s of PITCH_SECTIONS) sections[s.id] = { value: '', updatedAt: null };
    return {
        id:        'pitch-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 7),
        type:      PROJECT_PITCH_TYPE,
        projectId,
        content: {
            sections,
            tagline,
            heroImage:    null,
            cta:          null,           // { label, href }
            publishedAt:  null,
            slug:         null,
            lang,
            createdAt:    now,
        },
        createdAt: now,
        updatedAt: now,
    };
}

// validatePitchSection · pura · retorna { ok, reason }
export function validatePitchSection(sectionId, value) {
    const sec = SECTION_BY_ID.get(sectionId);
    if (!sec) return { ok: false, reason: 'unknown-section' };
    const v = typeof value === 'string' ? value.trim() : '';
    if (!v) return { ok: false, reason: 'empty' };
    if (v.length < sec.minLength) return { ok: false, reason: 'too-short', need: sec.minLength };
    if (v.length > sec.maxLength) return { ok: false, reason: 'too-long', max: sec.maxLength };
    return { ok: true };
}

// applyPitchSection · pura · immutable · throws si validation falla
export function applyPitchSection(pitch, sectionId, value, { ts = null } = {}) {
    const validation = validatePitchSection(sectionId, value);
    if (!validation.ok) {
        const err = new Error('pitch-section-invalid · ' + validation.reason);
        err.reason = validation.reason;
        throw err;
    }
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...pitch,
        content: {
            ...pitch.content,
            sections: {
                ...pitch.content.sections,
                [sectionId]: { value: value.trim(), updatedAt: now },
            },
        },
        updatedAt: now,
    };
}

// setPitchTagline · pura · max 140 chars (Twitter card subtitle)
export function setPitchTagline(pitch, tagline, { ts = null } = {}) {
    const v = String(tagline || '').slice(0, 140);
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...pitch,
        content: { ...pitch.content, tagline: v },
        updatedAt: now,
    };
}

// computePitchCompletion · pura · 0-1 + percent
export function computePitchCompletion(pitch) {
    if (!pitch || !pitch.content) return { ratio: 0, percent: 0, filled: 0, total: PITCH_SECTIONS.length };
    let filled = 0;
    for (const s of PITCH_SECTIONS) {
        const v = pitch.content.sections?.[s.id]?.value || '';
        if (validatePitchSection(s.id, v).ok) filled++;
    }
    const ratio = filled / PITCH_SECTIONS.length;
    return {
        ratio,
        percent: Math.round(ratio * 100),
        filled,
        total:   PITCH_SECTIONS.length,
    };
}

// publishPitch · pura · marca publishedAt + genera slug a partir del project name.
// Slug · kebab-case · ASCII safe · max 60 chars.
export function publishPitch(pitch, { projectName = '', ts = null } = {}) {
    const completion = computePitchCompletion(pitch);
    if (completion.filled < 3) {
        throw new Error('pitch-incomplete · cal mínim 3 seccions per publicar (té ' + completion.filled + ')');
    }
    const now = (typeof ts === 'number') ? ts : Date.now();
    const slug = slugify(projectName || pitch.content.tagline || 'project') || ('p-' + now.toString(36));
    return {
        ...pitch,
        content: {
            ...pitch.content,
            publishedAt: new Date(now).toISOString(),
            slug,
        },
        updatedAt: now,
    };
}

// unpublishPitch · pura · neteja publishedAt + slug
export function unpublishPitch(pitch, { ts = null } = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        ...pitch,
        content: { ...pitch.content, publishedAt: null, slug: null },
        updatedAt: now,
    };
}

// prefillFromCanvas · pura · agafa els canvas steps mappats i omple seccions
// buides del pitch (no sobreescriu seccions ja omplertes).
export function prefillFromCanvas(pitch, canvas) {
    if (!pitch || !canvas) return pitch;
    let result = pitch;
    for (const sec of PITCH_SECTIONS) {
        if (!sec.canvasMap) continue;
        const existing = result.content.sections?.[sec.id]?.value || '';
        if (existing.trim()) continue;             // no sobreescriure
        const canvasVal = canvas.steps?.[sec.canvasMap]?.value || '';
        if (!canvasVal) continue;
        // Tallar/expandir a fit · simple slice si llarg · concat si curt
        const v = canvasVal.slice(0, sec.maxLength);
        if (v.length >= sec.minLength) {
            try {
                result = applyPitchSection(result, sec.id, v);
            } catch (_) { /* skip si validation falla · ex too-short */ }
        }
    }
    return result;
}

// buildOGMeta · pura · retorna { title, description, image, url, type }
// per a meta tags · OpenGraph + Twitter cards.
//
// args ·
//   pitch       · project_pitch node
//   project     · project node (per nom + sector)
//   absoluteUrl · base URL absoluta (ex 'https://sos.example.com')
//
// Retorna ·
//   {
//     title       · '{projectName} · {tagline}' (max 70 chars)
//     description · tagline o problem (max 200 chars)
//     image       · heroImage o null
//     url         · canonical URL
//     type        · 'website'
//   }
export function buildOGMeta({ pitch = null, project = null, absoluteUrl = '' } = {}) {
    const projectName = project?.nombre || project?.name || project?.id || 'Projecte SOS';
    const tagline     = pitch?.content?.tagline || '';
    const problemSec  = pitch?.content?.sections?.problem?.value || '';
    const visionSec   = pitch?.content?.sections?.vision?.value  || '';

    const title = (projectName + (tagline ? ' · ' + tagline : '')).slice(0, 70);
    const description = (tagline || visionSec || problemSec || 'Projecte SOS local-first').slice(0, 200);
    const image = pitch?.content?.heroImage || null;
    const slug  = pitch?.content?.slug;
    const pid   = pitch?.projectId || project?.id;
    const path  = slug ? ('/pitch/' + encodeURIComponent(slug)) : ('/pitch?project=' + encodeURIComponent(pid || ''));
    const url   = (absoluteUrl || '') + path;

    return {
        title,
        description,
        image,
        url,
        type: 'website',
    };
}

// renderOGTagsHtml · pura · genera HTML d'etiquetes <meta> per al head.
// Per a SPA dinàmica · podem injectar-les via afterRender.
export function renderOGTagsHtml(og) {
    if (!og) return '';
    const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const tags = [
        `<meta property="og:title" content="${esc(og.title)}">`,
        `<meta property="og:description" content="${esc(og.description)}">`,
        `<meta property="og:type" content="${esc(og.type || 'website')}">`,
        `<meta property="og:url" content="${esc(og.url)}">`,
        og.image ? `<meta property="og:image" content="${esc(og.image)}">` : '',
        `<meta name="twitter:card" content="${og.image ? 'summary_large_image' : 'summary'}">`,
        `<meta name="twitter:title" content="${esc(og.title)}">`,
        `<meta name="twitter:description" content="${esc(og.description)}">`,
        og.image ? `<meta name="twitter:image" content="${esc(og.image)}">` : '',
    ];
    return tags.filter(Boolean).join('\n');
}

// slugify · helper · ASCII lowercase + kebab · max 60.
function slugify(s) {
    return String(s || '')
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')          // accents off
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
}
