// =============================================================================
// TEAMTOWERS SOS V11 — v135 · VNA CLARIFY · PRE-THINKING PHASE
// Ruta · /js/core/vnaClarify.js
//
// Item #1 del audit post-alfa (v134) · ALFA-RELEVANT ·
// Abans de cridar `design-value-map-rich` (cars · 2477 tokens REAL · 1549
// SLIM), invoca una crida small-tier que digui "què preguntaries a
// l'usuari per millorar el mapa donat aquest context?".
//
// Beneficis ·
//  · Redueix ambigüitat input → output més precís sense escalation
//  · Cost · 1 crida small-tier (~150 tokens · ~0.0001€)
//  · Latency · +1-2s pre-generació · acceptable
//  · Opcional · l'usuari pot saltar les preguntes (skipQuestions:true)
//
// API · vnaClarify({ context, provider, modelKey?, max?, slim? })
//        → { ok, questions: [{ id, text, why?, kind? }], rawOutput?, error? }
// =============================================================================

export const VNA_CLARIFY_VERSION = 'v135';

const DEFAULT_MAX_QUESTIONS = 4;

// ── Prompt minimal · small-tier optimized · ~120 tokens system ──────────
const SYSTEM_PROMPT = `Ets un assistent VNA (Verna Allee value network analysis) expert.
La teva tasca · llegir el context d'un projecte i identificar 2-5 preguntes
CLAU que faries a l'usuari per generar un mapa de valor més precís. Pregunta
només el que afecta significativament el mapa · no preguntis evidències.

Output · JSON estricte ·
{ "questions": [
  { "id": "q1", "text": "...", "why": "afecta X", "kind": "scope|stakeholders|stage|deliverables|monetization" }
]}`;

function _buildUserPrompt(ctx = {}) {
    const parts = [];
    parts.push('## Context del projecte');
    if (ctx.name)        parts.push('· Nom · ' + ctx.name);
    if (ctx.description) parts.push('· Descripció · ' + ctx.description);
    if (ctx.sector)      parts.push('· Sector CNAE · ' + ctx.sector);
    if (ctx.vna_zoom)    parts.push('· Zoom VNA · ' + ctx.vna_zoom);
    if (ctx.lifecycle_stage) parts.push('· Fase · ' + ctx.lifecycle_stage);
    if (ctx.entity_type) parts.push('· Tipus entitat · ' + ctx.entity_type);
    if (ctx.domainDetection?.label) parts.push('· Domini detectat · ' + ctx.domainDetection.label);
    if (Array.isArray(ctx.existingMap?.roles) && ctx.existingMap.roles.length) {
        parts.push('· Té mapa parcial · ' + ctx.existingMap.roles.length + ' rols ja');
    }
    parts.push('');
    parts.push('Quines 2-5 preguntes clau faries per millorar el mapa?');
    parts.push('Retorna JSON segons l\'esquema.');
    return parts.join('\n');
}

// ── Parser defensiu · accepta fenced JSON · garbage abans/després ────────
function _parseQuestions(text) {
    if (!text) return null;
    let t = String(text).trim();
    const fenced = t.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (fenced) t = fenced[1].trim();
    if (!t.startsWith('{') && !t.startsWith('[')) {
        const open  = t.indexOf('{');
        const close = t.lastIndexOf('}');
        if (open >= 0 && close > open) t = t.slice(open, close + 1);
    }
    let parsed;
    try { parsed = JSON.parse(t); }
    catch (_) { return null; }
    const arr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.questions) ? parsed.questions : null);
    if (!arr) return null;
    return arr.filter(q => q && typeof q === 'object' && typeof q.text === 'string' && q.text.trim().length > 0);
}

// ── vnaClarify · async · injectable provider ─────────────────────────────
//
// Args ·
//   context        · { name, description, sector, vna_zoom, ... } (mateix ctx que quickSuggestMap)
//   provider       · async fn(modelKey, opts) → { text, usage }
//   modelKey       · default 'auto-small'
//   max            · cap màxim de preguntes a retornar (default 4)
//
// Retorna ·
//   { ok: true,  questions: [...], usage, ms }
//   { ok: false, error: 'no-context|no-provider|...', rawOutput? }
export async function vnaClarify({
    context = {},
    provider = null,
    modelKey = 'auto-small',
    max = DEFAULT_MAX_QUESTIONS,
} = {}) {
    if (!context || (!context.name && !context.description)) {
        return { ok: false, error: 'no-context · name o description required' };
    }
    if (typeof provider !== 'function') {
        return { ok: false, error: 'no-provider · injecta provider async fn' };
    }
    const t0 = Date.now();
    const systemPrompt = SYSTEM_PROMPT;
    const userPrompt   = _buildUserPrompt(context);
    let result;
    try {
        result = await provider(modelKey, {
            systemPrompt,
            userPrompt,
            temperature: 0.2,        // baix · vol consistency
            maxOutputTokens: 400,    // limita cost
        });
    } catch (e) {
        return { ok: false, error: 'provider-failed · ' + (e?.message || 'unknown'), ms: Date.now() - t0 };
    }
    const text = (typeof result?.text === 'string') ? result.text : (typeof result?.content === 'string' ? result.content : '');
    const questions = _parseQuestions(text);
    if (!questions || questions.length === 0) {
        return { ok: false, error: 'parse-failed · output no és JSON vàlid amb questions', rawOutput: text, ms: Date.now() - t0 };
    }
    // Normalitza · afegeix id si falta · cap a màx
    const norm = questions.slice(0, Math.max(1, max)).map((q, i) => ({
        id:   q.id || ('q' + (i + 1)),
        text: q.text.trim(),
        why:  typeof q.why === 'string' ? q.why : null,
        kind: typeof q.kind === 'string' ? q.kind : null,
    }));
    return { ok: true, questions: norm, usage: result?.usage || null, ms: Date.now() - t0 };
}

// ── enrichContextWithAnswers · helper pur · merge respostes a context ────
//
// Quan l'usuari respon les questions, prefixem la description amb un bloc
// estructurat de Q&A perquè el prompt principal (design-value-map-rich)
// el pugui aprofitar sense canvis schema.
export function enrichContextWithAnswers(context = {}, answers = []) {
    if (!Array.isArray(answers) || answers.length === 0) return { ...context };
    const valid = answers.filter(a => a && a.text && typeof a.answer === 'string' && a.answer.trim().length > 0);
    if (valid.length === 0) return { ...context };
    const qaBlock = '\n\n## Clarificacions usuari · pre-thinking\n' +
        valid.map(a => '· ' + a.text + ' → ' + a.answer.trim()).join('\n');
    return {
        ...context,
        description: (context.description || '') + qaBlock,
        _clarifyAnswers: valid,
    };
}
