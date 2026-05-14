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
        if (!src || !tgt || src === tgt) return;
        if (!idSet.has(src) || !idSet.has(tgt)) return;
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
        // UX-AUDIT-001 sprint H+ · transactions enllacen roles · from/to
        if (n.type === 'transaction') {
            if (c.from) pushRel(c.from, n.id, 'tx_from');
            if (c.to)   pushRel(n.id, c.to, 'tx_to');
        }
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

// =============================================================================
// MIND-GRAPH GALAXY LAYOUT (H8.2 · sprint A)
//
// "Galàxies per afinitat dimensional" · cada sector → 1 galàxia.
// Dins de cada galàxia · capes de ceba per tipus de node usant la
// proporció àuria φ = (1+√5)/2 ≈ 1.618 per a separar tiers radialment.
//
// Disposició dels centres de galàxia · Vogel spiral (golden-angle) ·
// reparteix N galàxies sense sobreposició amb apariència orgànica.
//
// Pseudo-3D · cada galàxia rep un `cz` ∈ [0..1] · 0 = primer pla,
// 1 = fons. La capa renderització · usa cz per modular opacitat i
// escala (efecte parallax / profunditat) sense Three.js / WebGL.
// =============================================================================

export const PHI         = 1.618033988749895;
const GOLDEN_ANGLE       = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.39996

// Capes de ceba per tipus de node · tier 0 (project · centre) ··· 4 (perifèria)
// El radi de cada capa · baseRingR * φ^(tier·0.6)
export const TYPE_TIER = Object.freeze({
    project:          0,
    client_vna_model: 0,
    role:             1,
    transaction:      1,
    sop:              2,
    workshop:         2,
    work_order:       2,
    market_item:      3,
    deliverable:      3,
    ledger_entry:     3,
    user_identity:    4,
    smart_folder:     4,
    soc:              4,
    config:           4,
    sprint_run:       4,
});

export function tierForType(type) {
    return TYPE_TIER[type] ?? 3;
}

// Resol sectorKey per a un node · projecte: content.sectorId · altres: heretat
// del parent project. Fallback · 'misc'.
function _resolveSectorMap(nodes) {
    const projectSector = {};
    for (const n of nodes) {
        if (n.type === 'project' || n.type === 'client_vna_model') {
            const sec = n.sectorId || n.content?.sectorId || n.sector_id || 'misc';
            projectSector[n.id] = sec || 'misc';
        }
    }
    return projectSector;
}

// assignSpatialLayout · PURA · muta graph.nodes afegint
//   sectorKey · tier · sectorCx · sectorCy · sectorCz · ringRadius · cx · cy
// i retorna metadata { sectorCenters, sectors, sectorCount }.
//
// width/height · viewport · baseRingR · radi de la capa 0 (project center)
export function assignSpatialLayout(graph, {
    width      = 1400,
    height     = 1000,
    baseRingR  = 90,
    seed       = null,   // determinisme opcional per a tests
} = {}) {
    if (!graph || !Array.isArray(graph.nodes)) return { sectorCenters: {}, sectors: [], sectorCount: 0 };
    const nodes = graph.nodes;
    const projectSector = _resolveSectorMap(nodes);

    // Resol sectorKey per a tots els nodes
    for (const n of nodes) {
        if (n.type === 'project' || n.type === 'client_vna_model') {
            n.sectorKey = projectSector[n.id] || 'misc';
        } else if (n.projectId && projectSector[n.projectId]) {
            n.sectorKey = projectSector[n.projectId];
        } else {
            n.sectorKey = 'misc';
        }
    }

    // Recull sectors únics ordenats (deterministic)
    const sectorSet = new Set(nodes.map(n => n.sectorKey));
    const sectors = Array.from(sectorSet).sort();
    if (sectors.length === 0) {
        // Degenerate · 0 nodes · res a posicionar
        return { sectorCenters: {}, sectors: [], sectorCount: 0 };
    }
    const N = sectors.length;

    // Centres de galàxia · Vogel spiral · r = maxR · √(i/(N−1)) · θ = i·GA
    const cx0  = width  / 2;
    const cy0  = height / 2;
    const maxR = Math.min(width, height) * 0.38;
    const sectorCenters = {};
    for (let i = 0; i < N; i++) {
        const r     = N === 1 ? 0 : maxR * Math.sqrt(i / (N - 1));
        const theta = i * GOLDEN_ANGLE;
        sectorCenters[sectors[i]] = {
            cx:    cx0 + r * Math.cos(theta),
            cy:    cy0 + r * Math.sin(theta),
            cz:    N === 1 ? 0 : i / (N - 1),   // depth 0..1 (alt index → més profund)
            index: i,
            key:   sectors[i],
        };
    }

    // Assigna posicions inicials per a cada node · cebola dins de la galàxia.
    // Dins d'un mateix tier · els nodes es distribueixen angularment via
    // golden-angle deterministic perquè no es sobreposin.
    const tierCount = {}; // counter de quants nodes ja ha rebut cada (sector,tier)
    const rng = _seededRng(seed);
    for (const n of nodes) {
        n.tier = tierForType(n.type);
        const s = sectorCenters[n.sectorKey] || sectorCenters[sectors[0]];
        n.sectorCx = s ? s.cx : cx0;
        n.sectorCy = s ? s.cy : cy0;
        n.sectorCz = s ? s.cz : 0;
        // Radi de la capa de ceba · creix exponencialment amb tier via φ
        n.ringRadius = baseRingR * Math.pow(PHI, n.tier * 0.6);
        // Angle dins del tier · golden angle deterministic (+ petit jitter si rng)
        const tierKey = n.sectorKey + ':' + n.tier;
        const idxInTier = (tierCount[tierKey] = (tierCount[tierKey] || 0) + 1) - 1;
        const baseAngle = idxInTier * GOLDEN_ANGLE;
        const jitter    = rng ? (rng() - 0.5) * 0.4 : 0;
        n.cx = n.sectorCx + n.ringRadius * Math.cos(baseAngle + jitter);
        n.cy = n.sectorCy + n.ringRadius * Math.sin(baseAngle + jitter);
    }

    return { sectorCenters, sectors, sectorCount: N };
}

// Mulberry32 · RNG determinístic petit per a tests (sense Math.random)
function _seededRng(seed) {
    if (seed === null || seed === undefined) return null;
    let s = seed >>> 0;
    return function() {
        s |= 0; s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
