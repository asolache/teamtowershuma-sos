// =============================================================================
// TEAMTOWERS SOS V11 — TAGS SERVICE (UX-001 sprint A)
// Ruta: /js/core/tagsService.js
//
// Folksonomía universal sobre Mind-as-Graph: cada nodo del KB puede llevar
// un array libre de tags en `content.tags`. Dos nodos que compartan tags
// quedan implícitamente conectados (arista virtual `related_to` con
// weight = nº tags compartidos).
//
// Diseño:
//   - Tags se almacenan SIEMPRE en `node.content.tags: string[]`
//     (normalizados a kebab-case lowercase, sin duplicados).
//   - Se sincronizan a `node.keywords` (array root indexado por KB.query)
//     para que `KB.query({ keyword })` funcione sin esfuerzo.
//   - Funciones puras testeables (sin I/O) + helpers async sobre KB.
// =============================================================================

import { KB }    from './kb.js';
import { store } from './store.js';

// ─── Normalización ──────────────────────────────────────────────────────────
// "Mi Tag · Genial!" → "mi-tag-genial"
export function normalizeTag(raw) {
    if (typeof raw !== 'string') return '';
    return raw
        .trim()
        .toLowerCase()
        .replace(/[áàäâã]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i')
        .replace(/[óòöôõ]/g, 'o').replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n')
        .replace(/[^\w\s-]/g, '')   // quita puntuación
        .replace(/\s+/g, '-')       // espacios → guión
        .replace(/-+/g, '-')        // colapsa guiones
        .replace(/^-|-$/g, '')      // trim guiones
        .slice(0, 40);              // techo de longitud
}

// ─── Lectura · funciones puras sobre arrays de nodos ───────────────────────
// Devuelve `[{tag, count, nodeIds[]}]` ordenado descendente por count.
export function aggregateTags(nodes) {
    if (!Array.isArray(nodes)) return [];
    const map = new Map();
    for (const n of nodes) {
        const tags = Array.isArray(n?.content?.tags) ? n.content.tags : [];
        for (const t of tags) {
            const tag = normalizeTag(t);
            if (!tag) continue;
            if (!map.has(tag)) map.set(tag, { tag, count: 0, nodeIds: [] });
            const entry = map.get(tag);
            entry.count++;
            entry.nodeIds.push(n.id);
        }
    }
    return [...map.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function nodesWithTag(nodes, tag) {
    const target = normalizeTag(tag);
    if (!target || !Array.isArray(nodes)) return [];
    return nodes.filter(n => Array.isArray(n?.content?.tags) && n.content.tags.map(normalizeTag).includes(target));
}

// Aristas virtuales: dos nodos comparten tag(s) → relación implícita.
// Devuelve `[{a, b, weight, sharedTags[]}]` con weight ≥ 1.
export function relatedEdgesByTag(nodes) {
    if (!Array.isArray(nodes)) return [];
    const tagToNodes = new Map();
    for (const n of nodes) {
        const tags = Array.isArray(n?.content?.tags) ? n.content.tags.map(normalizeTag).filter(Boolean) : [];
        for (const t of tags) {
            if (!tagToNodes.has(t)) tagToNodes.set(t, new Set());
            tagToNodes.get(t).add(n.id);
        }
    }
    const edgeMap = new Map();
    for (const [tag, set] of tagToNodes) {
        const ids = [...set];
        for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
                const key = ids[i] < ids[j] ? ids[i] + '|' + ids[j] : ids[j] + '|' + ids[i];
                if (!edgeMap.has(key)) edgeMap.set(key, { a: ids[i], b: ids[j], weight: 0, sharedTags: [] });
                const e = edgeMap.get(key);
                e.weight++;
                e.sharedTags.push(tag);
            }
        }
    }
    return [...edgeMap.values()].sort((a, b) => b.weight - a.weight);
}

// ─── Escritura · funciones puras de mutación ───────────────────────────────
// Devuelven un nuevo nodo (no mutan el original). Mantiene `keywords` sincronizado.
export function addTagToNode(node, rawTag) {
    if (!node) throw new Error('addTagToNode: node requerido');
    const tag = normalizeTag(rawTag);
    if (!tag) return node;
    const current = Array.isArray(node.content?.tags) ? node.content.tags : [];
    if (current.map(normalizeTag).includes(tag)) return node;  // ya existe
    const nextTags = [...current, tag];
    const nextKeywords = Array.from(new Set([...(node.keywords || []), tag]));
    return {
        ...node,
        content:  { ...(node.content || {}), tags: nextTags },
        keywords: nextKeywords,
    };
}

export function removeTagFromNode(node, rawTag) {
    if (!node) throw new Error('removeTagFromNode: node requerido');
    const tag = normalizeTag(rawTag);
    if (!tag) return node;
    const current = Array.isArray(node.content?.tags) ? node.content.tags : [];
    const nextTags = current.filter(t => normalizeTag(t) !== tag);
    if (nextTags.length === current.length) return node;  // no estaba
    const nextKeywords = (node.keywords || []).filter(k => k !== tag);
    return {
        ...node,
        content:  { ...(node.content || {}), tags: nextTags },
        keywords: nextKeywords,
    };
}

// ─── Helpers async sobre KB ─────────────────────────────────────────────────
export async function loadAllNodesForTags() {
    await KB.init();
    return await KB.getAllNodes();
}

export async function persistTagAdd(nodeId, rawTag) {
    await KB.init();
    const existing = await KB.getNode(nodeId);
    if (!existing) throw new Error('persistTagAdd: nodo no encontrado · ' + nodeId);
    const updated = addTagToNode(existing, rawTag);
    if (updated === existing) return existing;
    await store.dispatch({ type: 'KB_UPSERT', payload: { node: updated } });
    return updated;
}

export async function persistTagRemove(nodeId, rawTag) {
    await KB.init();
    const existing = await KB.getNode(nodeId);
    if (!existing) throw new Error('persistTagRemove: nodo no encontrado · ' + nodeId);
    const updated = removeTagFromNode(existing, rawTag);
    if (updated === existing) return existing;
    await store.dispatch({ type: 'KB_UPSERT', payload: { node: updated } });
    return updated;
}

// ─── Helper UX · render del editor inline de tags para una vista ───────────
// Devuelve string HTML con chips de tags + input "+ tag".
// El consumidor debe enganchar handlers (click chip → remove · enter input → add).
export function renderTagsEditor({ tags = [], inputId = 'tagsInput', chipClass = 'sos-tag-chip' } = {}) {
    const safeTags = (Array.isArray(tags) ? tags : []).map(normalizeTag).filter(Boolean);
    const chips = safeTags.map(t => `
        <span class="${chipClass}" data-tag="${t}" style="display:inline-flex;align-items:center;gap:4px;background:rgba(99,102,241,0.15);color:#a5b4fc;padding:2px 8px;border-radius:10px;font-size:0.72rem;font-family:monospace;cursor:pointer;border:1px solid rgba(99,102,241,0.3);"
            title="Click para eliminar">
            #${t} <span style="opacity:0.6;font-size:0.65rem;">×</span>
        </span>
    `).join(' ');
    return `
        <div class="sos-tags-editor" style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;">
            ${chips}
            <input id="${inputId}" type="text" placeholder="+ tag (Enter)" style="background:rgba(0,0,0,0.3);border:1px solid var(--glass-border,#2a2a35);color:#e6e6e6;padding:3px 8px;border-radius:10px;font-size:0.72rem;font-family:monospace;outline:none;width:120px;">
        </div>
    `;
}
