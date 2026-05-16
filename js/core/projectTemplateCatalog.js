// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT TEMPLATE CATALOG
// Ruta · /js/core/projectTemplateCatalog.js
//
// Catàleg de templates pre-construïts per al flow `projectCreationLegendary`.
// Cada template puntua ≥85 al `valueFlowRubricService` SENSE personalització
// IA · les placeholders `{{name}}` · `{{sector}}` · `{{problem}}` són
// substituïdes durant l'step `personalize` del pipeline.
//
// Pure · zero deps · safe en Node.
// Veure `docs/STUDY-project-creation-2026-05-15.md` §5.3.
// =============================================================================

import FOUNDER_COOP_TRADICIONAL from './templates/founderCoopTradicional.js';
import DEFAULT_BALANCED          from './templates/defaultBalanced.js';

// Llistat d'IDs canònics (estable · API contract)
export const TEMPLATE_IDS = Object.freeze([
    'founder-coop-tradicional',
    'default-balanced',
]);

// Registry · id → template object
export const CATALOG = Object.freeze({
    'founder-coop-tradicional': FOUNDER_COOP_TRADICIONAL,
    'default-balanced':         DEFAULT_BALANCED,
});

// Regles de matching · keywords → templateId · ordre importa (primer match
// guanya · si cap match · fallback a 'default-balanced').
const MATCHING_RULES = Object.freeze([
    Object.freeze({ templateId: 'founder-coop-tradicional', keywords: ['founder', 'cooperative', 'cooperativa', 'castellers', 'cohort', 'matriu', 'permaweb', 'sos'] }),
]);

// pickTemplate · accepta { type?, classification?, keywords? · sector? }
// retorna l'objecte template (canonical shape) corresponent.
export function pickTemplate({
    type        = null,
    templateId  = null,
    keywords    = [],
    sector      = null,
} = {}) {
    if (templateId && CATALOG[templateId]) return CATALOG[templateId];

    const haystack = [type, sector, ...keywords]
        .filter(Boolean)
        .map(s => String(s).toLowerCase());

    if (haystack.length > 0) {
        for (const rule of MATCHING_RULES) {
            for (const kw of rule.keywords) {
                if (haystack.some(h => h.includes(kw))) {
                    return CATALOG[rule.templateId];
                }
            }
        }
    }

    return CATALOG['default-balanced'];
}

// listTemplates · pure · per a UI (selector de template)
export function listTemplates() {
    return TEMPLATE_IDS.map(id => ({
        id,
        ...CATALOG[id].meta,
    }));
}

// applyContext · pure · substitueix placeholders del template amb el context
// real del projecte. Manté el shape canonical · returns un OBJECTE NOU (cap
// mutation). Placeholders supported · `{{name}}` · `{{sector}}` · `{{problem}}`
// · `{{name_slug}}` (slug-safe).
//
// `context` esperat · { name, sector?, problem?, description? }
export function applyContext(template, context = {}) {
    if (!template || typeof template !== 'object') return template;
    const ctx = _prepareContext(context);
    return {
        meta:         template.meta,        // meta no es personalitza
        roles:        (template.roles        || []).map(r => _replaceAll(r, ctx)),
        deliverables: (template.deliverables || []).map(d => _replaceAll(d, ctx)),
        transactions: (template.transactions || []).map(t => _replaceAll(t, ctx)),
        sops:         (template.sops         || []).map(s => _replaceAll(s, ctx)),
        socs:         (template.socs         || []).map(s => _replaceAll(s, ctx)),
        canvas:       template.canvas       ? _replaceAll(template.canvas, ctx)   : null,
        pitch:        template.pitch        ? _replaceAll(template.pitch, ctx)    : null,
        workshops:    (template.workshops    || []).map(w => _replaceAll(w, ctx)),
    };
}

function _prepareContext({ name = 'Project', sector = '', problem = '', description = '' } = {}) {
    const ctx = {
        name:        String(name).trim() || 'Project',
        sector:      String(sector || 'cooperativisme').trim(),
        problem:     String(problem || description || 'definir el problema').trim(),
        description: String(description || '').trim(),
    };
    ctx.name_slug = ctx.name
        .toLowerCase()
        .replace(/[àáâã]/g, 'a').replace(/[èéê]/g, 'e').replace(/[ìíî]/g, 'i')
        .replace(/[òóô]/g, 'o').replace(/[ùúû]/g, 'u').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'project';
    return ctx;
}

function _replaceAll(value, ctx) {
    if (value == null) return value;
    if (typeof value === 'string') return _replaceStr(value, ctx);
    if (Array.isArray(value)) return value.map(v => _replaceAll(v, ctx));
    if (typeof value === 'object') {
        const out = {};
        for (const k of Object.keys(value)) {
            out[k] = _replaceAll(value[k], ctx);
        }
        // si l'objecte tenia `id` amb placeholder · es respecta (el replace ja
        // ha tingut efecte a la llistat de keys); KISS · cap altra cosa.
        return out;
    }
    return value;
}

function _replaceStr(s, ctx) {
    return s.replace(/\{\{(name_slug|name|sector|problem|description)\}\}/g, (_, key) => ctx[key] ?? '');
}
