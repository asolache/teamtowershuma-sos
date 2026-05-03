// =============================================================================
// TEAMTOWERS SOS V11 — MIND GRAPH SERVICE (H8.1)
// Ruta: /js/core/mindGraphService.js
//
// Construye el grafo Mind-as-Graph total a partir del KB completo:
// nodos por tipo + 3 capas de aristas (parent · relation · tag).
//
// Función PURA · sin I/O · testeable sin IndexedDB ni D3.
// =============================================================================

import { normalizeTag } from './tagsService.js';
import { relatedEdgesByTag } from './tagsService.js';

// Paleta canónica por tipo de nodo · compartida con FoldersView/MarketView/etc.
export const MIND_TYPE_COLORS = Object.freeze({
    project:           '#a855f7',  // morado
    role:              '#6366f1',  // índigo
    transaction:       '#06b6d4',  // cyan
    sop:               '#22c55e',  // verde
    work_order:        '#facc15',  // amarillo
    workshop:          '#fb923c',  // naranja
    market_item:       '#ec4899',  // rosa
    ledger_entry:      '#eab308',  // dorado
    user_identity:     '#7dd3fc',  // azul claro
    smart_folder:      '#94a3b8',  // gris azulado
    client_vna_model:  '#a855f7',  // morado (variante de project)
    deliverable:       '#10b981',  // esmeralda
    soc:               '#86efac',  // verde claro
    config:            '#475569',  // gris oscuro
    default:           '#94a3b8',
});

export function colorForType(type) {
    return MIND_TYPE_COLORS[type] || MIND_TYPE_COLORS.default;
}

// Etiqueta legible para un nodo (campo más informativo según tipo).
export function labelForNode(n) {
    const c = n.content || {};
    return c.title || c.name || c.displayName || c.nombre || c.label || n.id;
}

// ─── Construcción del grafo ────────────────────────────────────────────────
// Devuelve { nodes: [{id, type, label, color, projectId, tags, weight}],
//            edges: [{source, target, kind, weight, label?}] } donde
// `kind` ∈ {'parent', 'relation', 'tag'}.
//
// Capas de aristas:
//  - parent: nodo con projectId → nodo del proyecto (jerarquía clara)
//  - relation: relaciones explícitas vía campos (sopRef, role_ref,
//    providerProjectId, soc_ref, project_ref, workshopId)
//  - tag: aristas implícitas por tags compartidos (delega en
//    tagsService.relatedEdgesByTag · weight = nº tags compartidos)
//
// options:
//   includeTagEdges (default true): generar la capa de aristas por tags
//   minTagWeight (default 1): umbral de weight para incluir arista tag
//   excludeTypes (default ['config']): tipos de nodo a omitir
//   onlyProjectId: si está set, sólo nodos con ese projectId (o el propio
//     proyecto)
export function buildGraphFromKb(allNodes, options = {}) {
    if (!Array.isArray(allNodes)) return { nodes: [], edges: [] };
    const {
        includeTagEdges = true,
        minTagWeight    = 1,
        excludeTypes    = ['config'],
        onlyProjectId   = null,
    } = options;

    // 1. Filtrar nodos
    const filtered = allNodes.filter(n => {
        if (!n || !n.id || !n.type) return false;
        if (excludeTypes.includes(n.type)) return false;
        if (onlyProjectId) {
            // Incluir el propio proyecto + cualquier nodo con ese projectId
            const isProject = (n.type === 'project' || n.type === 'client_vna_model') && n.id === onlyProjectId;
            const belongs   = (n.projectId === onlyProjectId) || (n.content?.providerProjectId === onlyProjectId);
            if (!isProject && !belongs) return false;
        }
        return true;
    });

    // 2. Construir set de ids para validar aristas
    const idSet = new Set(filtered.map(n => n.id));

    // 3. Mapear nodos
    const nodes = filtered.map(n => ({
        id:        n.id,
        type:      n.type,
        label:     labelForNode(n),
        color:     colorForType(n.type),
        // projectId del nodo (parent jerárquico) · providerProjectId NO va aquí
        // porque conceptualmente el market_item NO pertenece al proyecto, sólo
        // ofrece su valor al proyecto · esa relación queda como `relation` aparte.
        projectId: n.projectId || n.content?.projectId || null,
        tags:      Array.isArray(n.content?.tags) ? n.content.tags : [],
        weight:    1,  // base · podríamos boostear por tipo/recencia en KM-001 sprint C
    }));

    // 4. Construir aristas
    const edges = [];

    // 4a. Parent edges · cualquier nodo con projectId apunta a su proyecto.
    //     Importante: NO incluir `providerProjectId` aquí · esa relación ya
    //     se modela como `relation` (con etiqueta 'provider'), evitando
    //     duplicados sobre el mismo par.
    for (const n of filtered) {
        const pid = n.projectId || n.content?.projectId;
        if (!pid || !idSet.has(pid)) continue;
        if (n.id === pid) continue;
        edges.push({ source: n.id, target: pid, kind: 'parent', weight: 2 });
    }

    // 4b. Relation edges · campos canónicos que enlazan nodos por id/slug.
    //     Ojo: muchos refs son slugs (sopRef='sop-fent-pinya-taller') que
    //     coinciden con node.id. Si no hay match, se ignoran.
    const pushRel = (src, tgt, label) => {
        if (!tgt || !idSet.has(tgt) || src === tgt) return;
        edges.push({ source: src, target: tgt, kind: 'relation', weight: 1.5, label });
    };
    for (const n of filtered) {
        const c = n.content || {};
        if (c.sopRef)            pushRel(n.id, c.sopRef,            'sop_ref');
        if (c.soc_ref)           pushRel(n.id, c.soc_ref,           'soc_ref');
        if (c.project_ref)       pushRel(n.id, c.project_ref,       'project_ref');
        if (c.role_ref)          pushRel(n.id, c.role_ref,          'role_ref');
        if (c.workshopId)        pushRel(n.id, c.workshopId,        'workshop');
        if (c.providerProjectId) pushRel(n.id, c.providerProjectId, 'provider');
        if (c.role && typeof c.role === 'object' && c.role.id) pushRel(n.id, c.role.id, 'role');
        if (c.assignee && c.assignee.id) pushRel(n.id, c.assignee.id, 'assignee');
        if (c.createdBy)         pushRel(n.id, c.createdBy,         'created_by');
        if (n.createdBy)         pushRel(n.id, n.createdBy,         'created_by');
    }

    // 4c. Tag edges · aristas implícitas por tags compartidos (UX-001)
    if (includeTagEdges) {
        const rawTagEdges = relatedEdgesByTag(filtered);
        for (const e of rawTagEdges) {
            if (e.weight < minTagWeight) continue;
            if (!idSet.has(e.a) || !idSet.has(e.b)) continue;
            // Saltar si ya hay una arista parent o relation entre los mismos nodos
            const exists = edges.some(x =>
                (x.source === e.a && x.target === e.b) ||
                (x.source === e.b && x.target === e.a));
            if (exists) continue;
            edges.push({
                source: e.a, target: e.b, kind: 'tag', weight: e.weight,
                label: e.sharedTags.slice(0, 3).join(','),
            });
        }
    }

    return { nodes, edges };
}

// Stats útiles para mostrar en la UI: cuenta por tipo + count totales.
export function graphStats(graph) {
    if (!graph) return { totalNodes: 0, totalEdges: 0, byType: {} };
    const byType = {};
    for (const n of graph.nodes) byType[n.type] = (byType[n.type] || 0) + 1;
    const byEdgeKind = {};
    for (const e of graph.edges) byEdgeKind[e.kind] = (byEdgeKind[e.kind] || 0) + 1;
    return {
        totalNodes: graph.nodes.length,
        totalEdges: graph.edges.length,
        byType,
        byEdgeKind,
    };
}
