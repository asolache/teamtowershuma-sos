// =============================================================================
// TEAMTOWERS SOS V11 — SMART FOLDER SERVICE (KM-001 sprint A)
// Ruta: /js/core/smartFolderService.js
//
// Carpetas inteligentes: queries persistentes sobre el KB que actúan
// como vistas vivas tipo Smart Mailbox. Cada carpeta se almacena como
// nodo `type='smart_folder'` con un `content.query` que se ejecuta al
// abrirla y devuelve los nodos del KB que la cumplen.
//
// Funciones PURAS sobre arrays de nodos (sin I/O · testeables sin
// IndexedDB) + 5 carpetas predefinidas que el sistema crea por defecto.
// =============================================================================

import { normalizeTag } from './tagsService.js';

// ─── Validación + constructor canónico ─────────────────────────────────────

export function validateFolder(folder) {
    const errors = [];
    if (!folder || typeof folder !== 'object') return { ok: false, errors: ['folder no es objeto'] };
    if (!folder.id || typeof folder.id !== 'string')                   errors.push('id requerido');
    if (folder.type !== 'smart_folder')                                errors.push("type debe ser 'smart_folder'");
    const c = folder.content || {};
    if (!c.name || typeof c.name !== 'string')                         errors.push('content.name requerido');
    if (!c.query || typeof c.query !== 'object')                       errors.push('content.query requerido');
    return { ok: errors.length === 0, errors };
}

export function buildFolder({
    name,
    icon = '📁',
    owner = null,
    query = {},
    view = 'list',
    preview = ['title', 'updatedAt'],
} = {}) {
    if (!name) throw new Error('buildFolder: name requerido');
    const slug = name.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'folder';
    return {
        id:   'folder-' + slug + '-' + Math.random().toString(36).slice(2, 6),
        type: 'smart_folder',
        content: {
            name,
            icon,
            owner,
            query: query || {},
            view,
            preview: Array.isArray(preview) ? preview : ['title', 'updatedAt'],
            createdAt: Date.now(),
        },
        keywords: ['smart_folder', 'kind:smart-folder'],
    };
}

// ─── Ejecutor de queries · PURO sobre array de nodos ───────────────────────
// query: {
//   types: string[]               · filtra por node.type (OR)
//   tagsAll: string[]             · TODOS estos tags presentes (taxon o folks)
//   tagsAny: string[]             · AL MENOS UNO de estos
//   tagsNone: string[]            · NINGUNO de estos
//   projectId: string             · exact match con node.projectId
//   keywords: string[]            · OR sobre node.keywords
//   ownerEquals: string           · matchea content.assignee.id o content.owner
//   recentDays: number            · updatedAt dentro de los N días
//   sortBy: string                · 'updatedAt' (default) | 'createdAt' | 'name' | 'priority'
//   sortDir: 'asc'|'desc'         · default 'desc'
//   limit: number                 · top N
// }
export function executeFolderQuery(folder, allNodes) {
    if (!folder || !Array.isArray(allNodes)) return [];
    const q = folder.content?.query || {};

    const tagsAll  = Array.isArray(q.tagsAll)  ? q.tagsAll.map(normalizeTag).filter(Boolean) : null;
    const tagsAny  = Array.isArray(q.tagsAny)  ? q.tagsAny.map(normalizeTag).filter(Boolean) : null;
    const tagsNone = Array.isArray(q.tagsNone) ? q.tagsNone.map(normalizeTag).filter(Boolean) : null;
    const types    = Array.isArray(q.types) && q.types.length ? q.types : null;
    const keywords = Array.isArray(q.keywords) && q.keywords.length ? q.keywords : null;
    const cutoff   = (typeof q.recentDays === 'number' && q.recentDays > 0)
        ? Date.now() - q.recentDays * 24 * 60 * 60 * 1000
        : null;

    let result = allNodes.filter(n => {
        if (!n || !n.id) return false;
        if (types && !types.includes(n.type)) return false;
        if (q.projectId && n.projectId !== q.projectId) return false;

        if (tagsAll || tagsAny || tagsNone) {
            const nodeTags = (Array.isArray(n.content?.tags) ? n.content.tags : []).map(normalizeTag);
            if (tagsAll && !tagsAll.every(t => nodeTags.includes(t))) return false;
            if (tagsAny && !tagsAny.some(t => nodeTags.includes(t)))  return false;
            if (tagsNone && tagsNone.some(t => nodeTags.includes(t))) return false;
        }

        if (keywords) {
            const nk = Array.isArray(n.keywords) ? n.keywords : [];
            if (!keywords.some(k => nk.includes(k))) return false;
        }

        if (q.ownerEquals) {
            const owner = n.content?.assignee?.id || n.content?.owner || n.createdBy || null;
            if (owner !== q.ownerEquals) return false;
        }

        if (cutoff != null) {
            const ts = n.updatedAt || n.content?.updatedAt || n.createdAt || 0;
            if (ts < cutoff) return false;
        }
        return true;
    });

    // Sort
    const sortBy  = q.sortBy  || 'updatedAt';
    const sortDir = q.sortDir === 'asc' ? 1 : -1;
    result.sort((a, b) => {
        const va = _sortKey(a, sortBy);
        const vb = _sortKey(b, sortBy);
        if (va === vb) return 0;
        return va < vb ? -sortDir : sortDir;
    });

    if (typeof q.limit === 'number' && q.limit > 0) result = result.slice(0, q.limit);
    return result;
}

function _sortKey(node, sortBy) {
    switch (sortBy) {
        case 'name':       return (node.content?.title || node.content?.name || node.id || '').toLowerCase();
        case 'createdAt':  return Number(node.createdAt || node.content?.createdAt || 0);
        case 'priority': {
            const p = (node.content?.priority || '').toLowerCase();
            return p === 'urgent' ? 4 : p === 'high' ? 3 : p === 'med' ? 2 : p === 'low' ? 1 : 0;
        }
        case 'updatedAt':
        default:           return Number(node.updatedAt || node.content?.updatedAt || node.createdAt || 0);
    }
}

// ─── 5 carpetas predefinidas del sistema ───────────────────────────────────
// El operador puede editarlas o borrarlas como cualquier otra. La instalación
// inicial las crea con seed para que el usuario nuevo tenga señal en /folders.
export const DEFAULT_FOLDERS = Object.freeze([
    {
        id:   'folder-system-wo-urgent',
        type: 'smart_folder',
        content: {
            name: 'WOs urgentes en marcha',
            icon: '🚨',
            owner: 'system',
            query: { types: ['work_order'], tagsAll: ['priority:high'], tagsNone: ['status:ledgered','status:cancelled'], sortBy: 'updatedAt' },
            view: 'list',
            preview: ['title','tags:role-kind','tags:priority','updatedAt'],
            isSystem: true,
        },
        keywords: ['smart_folder', 'kind:smart-folder', 'system'],
    },
    {
        id:   'folder-system-wo-ai-doing',
        type: 'smart_folder',
        content: {
            name: 'WOs IA en marcha',
            icon: '🤖',
            owner: 'system',
            query: { types: ['work_order'], tagsAll: ['role-kind:ai','status:doing'], sortBy: 'updatedAt' },
            view: 'list',
            preview: ['title','tags:priority','updatedAt'],
            isSystem: true,
        },
        keywords: ['smart_folder', 'kind:smart-folder', 'system'],
    },
    {
        id:   'folder-system-sops-ready',
        type: 'smart_folder',
        content: {
            name: 'SOPs ready de proyectos',
            icon: '📜',
            owner: 'system',
            query: { types: ['sop'], tagsAny: ['kind:project-role-sop'], sortBy: 'updatedAt' },
            view: 'list',
            preview: ['name','tags:role','updatedAt'],
            isSystem: true,
        },
        keywords: ['smart_folder', 'kind:smart-folder', 'system'],
    },
    {
        id:   'folder-system-market-public',
        type: 'smart_folder',
        content: {
            name: 'Mercado · ofertas públicas',
            icon: '🛒',
            owner: 'system',
            query: { types: ['market_item'], tagsAll: ['scope:public'], sortBy: 'createdAt' },
            view: 'grid',
            preview: ['title','tags:cnae','createdAt'],
            isSystem: true,
        },
        keywords: ['smart_folder', 'kind:smart-folder', 'system'],
    },
    {
        id:   'folder-system-recent-ledger',
        type: 'smart_folder',
        content: {
            name: 'Ledger · últimos 7 días',
            icon: '💶',
            owner: 'system',
            query: { types: ['ledger_entry'], recentDays: 7, sortBy: 'updatedAt' },
            view: 'list',
            preview: ['title','updatedAt'],
            isSystem: true,
        },
        keywords: ['smart_folder', 'kind:smart-folder', 'system'],
    },
]);
