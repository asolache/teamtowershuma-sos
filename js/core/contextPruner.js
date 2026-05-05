// =============================================================================
// TEAMTOWERS SOS V11 — CONTEXT PRUNER (KM-001 sprint C)
// Ruta: /js/core/contextPruner.js
//
// Pipeline puro de selección de contexto relevante para llamadas LLM.
// Cierra el bucle "AI experience legendaria" de @alvaro: en lugar de
// inyectar el KB entero en cada prompt, sólo enviamos los nodos con
// score ≥ threshold ordenados por relevancia, hasta llenar el budget
// de tokens asignado.
//
// Funciones PURAS · sin LLM · sin IndexedDB · testeables.
//
// Diseño · score(node, task) combina 4 señales:
//   1. tag_overlap   · % de tags del task presentes en el node
//   2. recency       · 1 / log(days_since_update + 2)
//   3. type_boost    · multiplicador por tipo de nodo según el task
//   4. priority_boost· extra si tiene priority:high/urgent
//
// El consumidor pasa un task descriptor y opcionalmente sobrescribe
// pesos y boosts. Devuelve {selected[], skipped[], stats}.
// =============================================================================

import { normalizeTag } from './tagsService.js';

// Normalización SUAVE para tags ya canonicalizados (preserva el `:` del
// formato taxonomy:value que normalizeTag eliminaría por puntuación).
// Sólo hace trim + lowercase + colapsa espacios. Para tags libres del
// usuario sigue usándose normalizeTag.
function _softNormTag(t) {
    if (typeof t !== 'string') return '';
    return t.trim().toLowerCase().replace(/\s+/g, '-');
}

// ─── Defaults ──────────────────────────────────────────────────────────────

// Pesos relativos de las 4 señales · suman ~1.0 para que score ∈ [0,1].
export const DEFAULT_WEIGHTS = Object.freeze({
    tagOverlap: 0.50,
    recency:    0.20,
    typeBoost:  0.20,
    priority:   0.10,
});

// Multiplicador por tipo de nodo · 1.0 = neutral · >1 = más relevante.
// Para una task genérica de "asistir a una WO", los SOPs y SOCs son los
// más útiles porque dan contexto procedural; los workshops y ledger menos.
export const DEFAULT_TYPE_BOOSTS = Object.freeze({
    sop:               1.4,
    soc:               1.2,
    project:           1.2,
    role:              1.1,
    work_order:        1.0,
    transaction:       0.9,
    market_item:       0.7,
    workshop:          0.6,
    ledger_entry:      0.5,
    user_identity:     0.4,
    smart_folder:      0.3,
    config:            0.0,   // nunca inyectar config (claves API, etc.)
    default:           0.7,
});

// Estimación tokens · 4 chars/token aprox (regla común para inglés/español).
export const CHARS_PER_TOKEN = 4;

// ─── Helpers internos ──────────────────────────────────────────────────────

function _ageDays(node, nowMs = Date.now()) {
    const ts = node?.updatedAt || node?.content?.updatedAt || node?.createdAt || 0;
    if (!ts) return 365;  // sin timestamp → asumimos viejo
    const diffMs = Math.max(0, nowMs - ts);
    return diffMs / (24 * 60 * 60 * 1000);
}

function _recencyScore(node, nowMs) {
    const days = _ageDays(node, nowMs);
    // 0 días → 1.0 · 7 días → 0.6 · 30 días → 0.4 · 365 días → 0.15
    return 1 / (1 + Math.log10(days + 1));
}

function _tagOverlapScore(nodeTags, taskTags) {
    if (!taskTags.length) return 0;
    // _softNormTag preserva el `:` de los taxonómicos · ambos lados deben
    // usar el mismo normalizador para que el match funcione.
    const norm = (arr) => new Set((arr || []).map(_softNormTag).filter(Boolean));
    const ns = norm(nodeTags);
    const ts = norm(taskTags);
    if (!ns.size || !ts.size) return 0;
    let hits = 0;
    for (const t of ts) if (ns.has(t)) hits++;
    return hits / ts.size;
}

function _priorityScore(node) {
    const tags = (node?.content?.tags || []).map(_softNormTag);
    if (tags.includes('priority:urgent')) return 1.0;
    if (tags.includes('priority:high'))   return 0.8;
    if (tags.includes('priority:med'))    return 0.4;
    if (tags.includes('priority:low'))    return 0.2;
    const direct = (node?.content?.priority || '').toLowerCase();
    if (direct === 'urgent') return 1.0;
    if (direct === 'high')   return 0.8;
    if (direct === 'med')    return 0.4;
    if (direct === 'low')    return 0.2;
    return 0;
}

// ─── Extracción de tags del task ───────────────────────────────────────────
// El task viene como objeto descriptor: { projectId, sectorId, roleId,
// types[], extraTags[], requireProjectId }. Devolvemos la lista de tags
// taxonómicos que servirán como "qué busco".
export function extractTaskTags(task = {}) {
    const out = [];
    // Tags taxonómicos · construidos canónicamente · NO pasar por normalizeTag
    // (eliminaría el `:`); usar _softNormTag para trim + lowercase + colapsar
    // espacios sin tocar la puntuación canónica.
    if (task.projectId) out.push(_softNormTag('project:' + task.projectId));
    if (task.sectorId)  out.push(_softNormTag('sector:'  + task.sectorId));
    if (task.roleId)    out.push(_softNormTag('role:'    + task.roleId));
    if (Array.isArray(task.types))     for (const t of task.types) out.push(_softNormTag('kind:' + t));
    // extraTags vienen del usuario · pueden ser taxonómicos (con `:`) o
    // folksonómicos · usamos _softNormTag para no romper los taxonómicos.
    if (Array.isArray(task.extraTags)) for (const t of task.extraTags) out.push(_softNormTag(t));
    return out.filter(Boolean);
}

// ─── Scorer · función PURA ────────────────────────────────────────────────
export function scoreNode(node, task, options = {}) {
    if (!node || !node.id) return 0;
    const w = { ...DEFAULT_WEIGHTS, ...(options.weights || {}) };
    const boosts = { ...DEFAULT_TYPE_BOOSTS, ...(options.typeBoosts || {}) };
    const nowMs = options.now || Date.now();

    const taskTags = Array.isArray(task?.tags) ? task.tags : extractTaskTags(task || {});
    const nodeTags = Array.isArray(node.content?.tags) ? node.content.tags : [];

    const sTags = _tagOverlapScore(nodeTags, taskTags);
    const sRec  = _recencyScore(node, nowMs);
    const sPri  = _priorityScore(node);
    const tBoost = boosts[node.type] != null ? boosts[node.type] : boosts.default;

    // Si el task requiere projectId y el nodo no pertenece, score 0.
    if (task?.requireProjectId && task.projectId && (node.projectId || node.content?.projectId) !== task.projectId) {
        return 0;
    }
    // typeBoost actúa como multiplicador final (0 → excluido)
    if (tBoost === 0) return 0;

    const raw = (sTags * w.tagOverlap) + (sRec * w.recency) + (sPri * w.priority);
    // typeBoost se aplica multiplicativo sobre el componente de tipo · y sumamos
    const score = raw + (tBoost * w.typeBoost);
    // Clamp [0,1]
    return Math.max(0, Math.min(1, score));
}

// ─── Estimador de tokens · función PURA ────────────────────────────────────
// Estima tokens del nodo serializando sus campos texto principales.
export function estimateNodeTokens(node) {
    if (!node) return 0;
    const c = node.content || {};
    const fields = [
        node.id, node.type,
        c.title, c.name, c.description, c.summary, c.body,
        ...(Array.isArray(c.tags) ? c.tags : []),
        ...(Array.isArray(c.steps) ? c.steps.map(s => (s && (s.label || s.id)) || '') : []),
    ].filter(s => typeof s === 'string');
    const chars = fields.reduce((acc, s) => acc + s.length, 0);
    return Math.ceil(chars / CHARS_PER_TOKEN);
}

// ─── Pruner principal · función PURA ──────────────────────────────────────
// Devuelve {selected, skipped, stats}.
// options:
//   tokenBudget (default 4000) · tope acumulado de tokens
//   minScore    (default 0.05) · descarta nodos con score por debajo
//   maxNodes    (default 50)   · tope absoluto de cantidad
export function pruneContextNodes(candidates, task, options = {}) {
    if (!Array.isArray(candidates)) return _emptyResult();
    const tokenBudget = options.tokenBudget != null ? options.tokenBudget : 4000;
    const minScore    = options.minScore    != null ? options.minScore    : 0.05;
    const maxNodes    = options.maxNodes    != null ? options.maxNodes    : 50;

    // Pre-compute task tags para no recalcular en cada score
    const taskWithTags = { ...(task || {}), tags: Array.isArray(task?.tags) ? task.tags : extractTaskTags(task || {}) };

    const scored = candidates
        .map(n => ({ node: n, score: scoreNode(n, taskWithTags, options), tokens: estimateNodeTokens(n) }))
        .filter(x => x.score >= minScore)
        .sort((a, b) => b.score - a.score);

    const selected = [];
    const skipped  = [];
    let usedTokens = 0;
    for (const x of scored) {
        if (selected.length >= maxNodes) { skipped.push({ ...x, reason: 'maxNodes' }); continue; }
        if (usedTokens + x.tokens > tokenBudget) { skipped.push({ ...x, reason: 'tokenBudget' }); continue; }
        selected.push(x);
        usedTokens += x.tokens;
    }
    // Los que quedaron por debajo de minScore también van a skipped (con razón)
    const lowScore = candidates
        .filter(n => !scored.some(s => s.node.id === n.id))
        .map(n => ({ node: n, score: scoreNode(n, taskWithTags, options), tokens: estimateNodeTokens(n), reason: 'minScore' }));

    return {
        selected,                     // [{node, score, tokens}]
        skipped: [...skipped, ...lowScore],
        stats: {
            candidates: candidates.length,
            selected:   selected.length,
            usedTokens,
            tokenBudget,
            taskTags:   taskWithTags.tags,
        },
    };
}

function _emptyResult() {
    return { selected: [], skipped: [], stats: { candidates: 0, selected: 0, usedTokens: 0, tokenBudget: 0, taskTags: [] } };
}

// ─── KM-001 sprint D · helpers para integración con prompts LLM ────────────

// Serializa los nodos seleccionados por el pruner a un string compacto de
// markdown, listo para inyectar como contexto en el system prompt. Mantiene
// orden por score descendente y declara explícitamente los tags taxonómicos
// para que el LLM pueda razonar sobre el grafo cuando importe.
//
// PURO · no toca KB · función testeable.
export function formatNodesForPrompt(selected, options = {}) {
    if (!Array.isArray(selected) || !selected.length) return '';
    const maxBodyChars = options.maxBodyChars != null ? options.maxBodyChars : 800;
    const includeTags  = options.includeTags !== false;
    const lines = [];
    lines.push('### CONTEXTO INYECTADO · ' + selected.length + ' nodos seleccionados por relevancia');
    for (const x of selected) {
        const n = x.node || x;
        const c = n.content || {};
        const title = c.title || c.name || c.displayName || c.nombre || n.id;
        const body  = (c.description || c.summary || c.body || '').toString().slice(0, maxBodyChars);
        lines.push('');
        lines.push('--- ' + n.type + ' · ' + n.id + ' ---');
        if (title && title !== n.id) lines.push('Título: ' + title);
        if (n.projectId)              lines.push('Proyecto: ' + n.projectId);
        if (includeTags && Array.isArray(c.tags) && c.tags.length) {
            const taxon = c.tags.filter(t => typeof t === 'string' && t.includes(':'));
            const folks = c.tags.filter(t => typeof t === 'string' && !t.includes(':'));
            if (taxon.length) lines.push('Tags: ' + taxon.slice(0, 12).join(' · '));
            if (folks.length) lines.push('Folksonomy: ' + folks.slice(0, 8).join(' · '));
        }
        if (body) lines.push(body);
        // Steps si es un SOP
        if (Array.isArray(c.steps) && c.steps.length) {
            const summary = c.steps.slice(0, 6).map((s, i) =>
                `  ${i + 1}. [${s.role_kind || '?'}] ${s.label || s.id || '?'} (${s.duration_minutes || '?'} min)`
            ).join('\n');
            lines.push('Steps:');
            lines.push(summary);
            if (c.steps.length > 6) lines.push('  …(' + (c.steps.length - 6) + ' steps más omitidos)');
        }
    }
    return lines.join('\n');
}

// ─── Similarity baseline · placeholder para TDD-gate ──────────────────────
// Compara dos respuestas LLM (strings) usando Jaccard sobre tokens normalizados
// (lowercase, sólo alfanuméricos, sin stopwords mínimas). Devuelve [0,1]
// donde 1 = idéntico y 0 = nada en común.
//
// Es una métrica grosera · pensada como gate básico cuando integremos el
// pruner en Orchestrator (sprint E): si jaccard(pruned, baseline) ≥ 0.92
// aceptamos el contexto pruned. Métricas más finas (cosine sobre embeddings,
// LLM-as-judge) quedan como mejora posterior.
//
// PURO · sin dependencias.
const STOP_WORDS = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'de', 'del', 'a', 'al', 'en', 'por', 'para', 'con', 'sin', 'sobre',
    'y', 'o', 'u', 'e', 'ni', 'que', 'qué', 'no', 'sí', 'si',
    'es', 'son', 'ser', 'fue', 'fueron', 'sea', 'será',
    'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'and', 'or',
    'is', 'are', 'be', 'was', 'were', 'this', 'that', 'these', 'those',
]);

function _tokenize(text) {
    if (typeof text !== 'string') return new Set();
    const tokens = text
        .toLowerCase()
        .replace(/[^a-záéíóúñü0-9\s]+/g, ' ')
        .split(/\s+/)
        .filter(t => t.length >= 3 && !STOP_WORDS.has(t));
    return new Set(tokens);
}

export function jaccardSimilarity(textA, textB) {
    const setA = _tokenize(textA);
    const setB = _tokenize(textB);
    if (!setA.size && !setB.size) return 1;
    if (!setA.size || !setB.size) return 0;
    let intersection = 0;
    for (const t of setA) if (setB.has(t)) intersection++;
    const union = setA.size + setB.size - intersection;
    return intersection / union;
}

// Helper de alto nivel: dado un baseline y un candidato pruned, decide
// si el candidato pasa el TDD-gate.
export function passesContextGate({ baseline, candidate, threshold = 0.92 }) {
    const score = jaccardSimilarity(baseline, candidate);
    return { passes: score >= threshold, score, threshold };
}

// ─── KM-001 sprint E · integración con KB (async) ───────────────────────
// Carga candidatos desde el KB y aplica `pruneContextNodes` + serializa el
// resultado a markdown listo para inyectar al system prompt. Devuelve
// `{selected, skipped, stats, formatted}`.
//
// Uso típico desde Orchestrator.callLLM cuando contextPruning.enabled=true:
//   const r = await pruneFromKb({ KB, projectId, task, options });
//   const enriched = r.formatted + '\n\n' + originalSystemPrompt;
//
// Si KB es null/undefined o no hay candidatos, devuelve resultado vacío
// sin lanzar (el caller decide si seguir o no).
export async function pruneFromKb({ KB, projectId = null, task = {}, options = {}, formatOptions = {} } = {}) {
    if (!KB || typeof KB.query !== 'function') {
        return { selected: [], skipped: [], stats: { candidates: 0, selected: 0, usedTokens: 0, tokenBudget: 0, taskTags: [] }, formatted: '' };
    }
    // Si tenemos projectId, filtra por proyecto + nodos públicos relevantes
    // (SOPs públicos, SOCs, market_items públicos no atados a proyecto).
    let candidates = [];
    try {
        if (projectId) {
            const ofProject = await KB.query({ projectId });
            const all = await (KB.getAllNodes ? KB.getAllNodes() : KB.query({}));
            // Públicos relevantes: nodos sin projectId pero del catálogo TT
            // (sop · soc · market_item con scope:public en tags)
            const publics = (all || []).filter(n => {
                if (!n || n.projectId) return false;
                if (!['sop', 'soc', 'market_item'].includes(n.type)) return false;
                return true;
            });
            // Dedupe por id
            const seen = new Set();
            candidates = [...(ofProject || []), ...publics].filter(n => {
                if (!n || !n.id) return false;
                if (seen.has(n.id)) return false;
                seen.add(n.id); return true;
            });
        } else {
            candidates = (KB.getAllNodes ? await KB.getAllNodes() : await KB.query({})) || [];
        }
    } catch (err) {
        return { selected: [], skipped: [], stats: { candidates: 0, selected: 0, usedTokens: 0, tokenBudget: 0, taskTags: [], error: err.message }, formatted: '' };
    }

    const enrichedTask = projectId ? { projectId, ...task } : task;
    const result = pruneContextNodes(candidates, enrichedTask, options);
    const formatted = formatNodesForPrompt(result.selected, formatOptions);
    return { ...result, formatted };
}
