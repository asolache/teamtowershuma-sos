// =============================================================================
// TEAMTOWERS SOS V11 — AI EVALUATOR SERVICE (IA-ROUTER-001 sprint C)
//
// Catàleg d'evaluators per task kind · decideixen si l'output d'un modèl
// és prou bo o cal escalate al següent. Filosofia · structural cheap
// (regex · JSON shape · word count · zero crides IA) primer · LLM-as-judge
// pot venir sprint C2 amb cost ~0.001$ per chamada.
//
// runEscalation usa { evaluator } · aquesta funció rep el `result` dels
// providers ({text, usage, modelKey, finishReason}) i retorna
// { ok:boolean, reason?:string, score?:number, parsed? }
//
// Cada evaluator és tolerant a:
//   - ```json fenced blocks (els unwrap automàticament)
//   - Trailing whitespace
//   - Output partial (truncat) · però necessita estructura mínima
// =============================================================================

import { makeJsonShapeEvaluator } from './aiProviderService.js';

// Strip fences ```json … ``` o ```…``` · pur
export function unwrapFenced(text) {
    if (typeof text !== 'string') return '';
    let t = text.trim();
    const fenced = t.match(/```(?:json|markdown|md)?\s*([\s\S]+?)\s*```/);
    if (fenced) t = fenced[1].trim();
    return t;
}

// ─── Schema shape (re-export amb wrappers per a cada dim) ───────────────
// Wrapper de l'existent · garanteix camps mínims
export function jsonShape(requiredFields = []) {
    return makeJsonShapeEvaluator(requiredFields);
}

// ─── Markdown content evaluator · creative-narrative ────────────────────
// Requereix · heading h1 al text · ≥ minWords paraules
export function markdownEvaluator({ minWords = 40, requireHeading = true, allowFences = true } = {}) {
    return async (output) => {
        if (!output || !output.text) return { ok: false, reason: 'empty-output' };
        const raw = allowFences ? unwrapFenced(output.text) : output.text.trim();
        if (!raw) return { ok: false, reason: 'empty-after-unwrap' };
        // Headings · # o ## acceptats
        if (requireHeading && !/^#{1,3}\s+\S/m.test(raw)) {
            return { ok: false, reason: 'missing-heading' };
        }
        const words = raw.split(/\s+/).filter(Boolean).length;
        if (words < minWords) {
            return { ok: false, reason: 'too-short · ' + words + ' < ' + minWords + ' words' };
        }
        return { ok: true, score: Math.min(1.0, words / (minWords * 2)), parsed: raw };
    };
}

// ─── Cohesion evaluator · value-map / sops / deliverables ───────────────
// Valida JSON shape + arrays no buits + ids amb prefix esperat (ai-)
export function cohesionEvaluator({
    requiredArrays = [],
    idPrefix       = 'ai-',
    maxItems       = 20,
    minItems       = 1,
} = {}) {
    return async (output) => {
        if (!output || !output.text) return { ok: false, reason: 'empty-output' };
        const raw = unwrapFenced(output.text);
        let parsed;
        try { parsed = JSON.parse(raw); }
        catch (e) { return { ok: false, reason: 'not-json · ' + (e?.message || '') }; }
        for (const f of requiredArrays) {
            if (!Array.isArray(parsed[f])) {
                return { ok: false, reason: 'missing-or-not-array · ' + f };
            }
            if (parsed[f].length < minItems) {
                return { ok: false, reason: 'too-few-' + f + ' · ' + parsed[f].length + ' < ' + minItems };
            }
            if (parsed[f].length > maxItems) {
                return { ok: false, reason: 'too-many-' + f + ' · ' + parsed[f].length + ' > ' + maxItems };
            }
            // ids · si el camp té id, ha de portar prefix
            for (const item of parsed[f]) {
                if (item && item.id && typeof item.id === 'string' && !item.id.startsWith(idPrefix)) {
                    // No throw · sols warn al return · score reduït
                    return { ok: true, reason: 'id-prefix-warn · ' + item.id, score: 0.7, parsed };
                }
            }
        }
        return { ok: true, score: 1.0, parsed };
    };
}

// ─── Tags evaluator · tag-generation ────────────────────────────────────
// Format esperat · array de strings curts (kebab-case · sense espais)
export function tagsEvaluator({ maxTags = 10, minTags = 3, maxLength = 30 } = {}) {
    return async (output) => {
        if (!output || !output.text) return { ok: false, reason: 'empty-output' };
        const raw = unwrapFenced(output.text);
        let parsed;
        try { parsed = JSON.parse(raw); }
        catch (e) {
            // Acceptem llista plain · separada per comes o newlines
            const candidates = raw.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
            if (candidates.length >= minTags && candidates.length <= maxTags) {
                parsed = candidates;
            } else {
                return { ok: false, reason: 'not-json-or-plain-list' };
            }
        }
        const tags = Array.isArray(parsed) ? parsed
                   : Array.isArray(parsed?.tags) ? parsed.tags
                   : null;
        if (!tags) return { ok: false, reason: 'not-array-or-tags-field' };
        if (tags.length < minTags) return { ok: false, reason: 'too-few-tags' };
        if (tags.length > maxTags) return { ok: false, reason: 'too-many-tags' };
        const invalid = tags.find(t => typeof t !== 'string' || t.length === 0 || t.length > maxLength);
        if (invalid) return { ok: false, reason: 'invalid-tag · ' + JSON.stringify(invalid).slice(0, 30) };
        return { ok: true, score: 1.0, parsed: tags };
    };
}

// ─── Audit evaluator · LLM-as-judge stub · sprint C2 futur ─────────────
// Per ara · sols structural (longitud + keywords mínimes)
export function auditEvaluator({ minWords = 80, requiredKeywords = [] } = {}) {
    return async (output) => {
        if (!output || !output.text) return { ok: false, reason: 'empty-output' };
        const raw = unwrapFenced(output.text);
        const words = raw.split(/\s+/).filter(Boolean).length;
        if (words < minWords) return { ok: false, reason: 'too-short · ' + words + ' words' };
        for (const kw of requiredKeywords) {
            if (!raw.toLowerCase().includes(kw.toLowerCase())) {
                return { ok: false, reason: 'missing-keyword · ' + kw };
            }
        }
        return { ok: true, score: 0.95, parsed: raw };
    };
}

// ─── Default evaluator · accept tot el que té text ──────────────────────
export function defaultEvaluator() {
    return async (output) => {
        if (!output || !output.text || output.text.trim().length === 0) {
            return { ok: false, reason: 'empty-output' };
        }
        return { ok: true, score: 0.8, parsed: output.text.trim() };
    };
}

// ─── Catàleg · task kind → evaluator factory ────────────────────────────
// Cada entry retorna una funció evaluator nova (factory pattern · permet
// override de paràmetres per task).
export const EVALUATORS_BY_TASK = Object.freeze({
    'summary-short':       () => markdownEvaluator({ minWords: 10, requireHeading: false }),
    'schema-fill-simple':  () => jsonShape(['description']),
    'creative-narrative':  () => markdownEvaluator({ minWords: 40, requireHeading: true }),
    'value-map-design':    () => cohesionEvaluator({ requiredArrays: ['addRoles'], minItems: 1, maxItems: 12 }),
    'sop-structured':      () => cohesionEvaluator({ requiredArrays: ['newSops'],  minItems: 1, maxItems: 10 }),
    'workshop-outline':    () => cohesionEvaluator({ requiredArrays: ['newWorkshops'], minItems: 1, maxItems: 6 }),
    'code-generation':     () => defaultEvaluator(),    // structural · sprint C2 syntax check
    'quality-audit':       () => auditEvaluator({ minWords: 60 }),
    'deep-reasoning':      () => auditEvaluator({ minWords: 100 }),
    'multimodal-image':    () => defaultEvaluator(),    // image output · no text eval
    'tag-generation':      () => tagsEvaluator({ maxTags: 10, minTags: 3 }),
});

// getEvaluatorForTask · pur · retorna evaluator factory o defaultEvaluator
export function getEvaluatorForTask(taskKind) {
    const factory = EVALUATORS_BY_TASK[taskKind];
    return factory ? factory() : defaultEvaluator();
}

export const TASK_KINDS_WITH_EVALUATORS = Object.freeze(Object.keys(EVALUATORS_BY_TASK));
