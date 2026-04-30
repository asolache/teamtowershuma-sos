// =============================================================================
// TEAMTOWERS SOS V11 — SEMANTIC TAGGER (UX-002)
// Ruta: /js/core/semanticTagger.js
//
// Auto-tagging semántico en el momento de creación de nodos del Mind-as-Graph.
// Dos capas:
//
//   - **Taxonómica** (vocabulario controlado · prefijo:valor)
//     Tags estructurados predecibles a partir de los campos canónicos
//     del nodo. Sin LLM. Coste cero. Para filtros precisos, matchmaking
//     y aristas pesadas en el grafo implícito.
//
//   - **Folksonómica** (vocabulario libre · sin prefijo)
//     Tags humanos derivados del LLM o tecleados a mano (UX-001). Para
//     discoverability y sentido común.
//
// Las dos capas viven en el mismo `content.tags[]`. La única diferencia
// visible es el `:` después de un prefijo conocido.
//
// FUNCIONES PURAS (sin I/O · sin LLM · testeables).
// =============================================================================

import { normalizeTag } from './tagsService.js';

// ─── Catálogo cerrado de prefijos taxonómicos ──────────────────────────────
// Cualquier prefijo NO listado se trata como folksonómico (sin warning).
export const KNOWN_TAXONOMY_PREFIXES = Object.freeze([
    'sector', 'cnae', 'kind', 'role', 'castell', 'deliverable',
    'priority', 'step-kind', 'role-kind', 'approval', 'status',
    'scope', 'soc-ref', 'sop-ref', 'project', 'hat', 'skill',
]);

// Validación de un tag individual: ¿es taxonómico (con prefijo conocido) o folksonómico?
// Importante: `normalizeTag` elimina el `:` porque la puntuación no es alfanumérica.
// Así que primero detectamos `:` en el raw, partimos, y normalizamos prefijo/valor
// por separado antes de reconstruir.
export function validateTaxonomyTag(rawTag) {
    if (typeof rawTag !== 'string') return { ok: false, prefix: null, value: null, knownPrefix: false, taxonomy: false };
    const trimmed = rawTag.trim();
    if (!trimmed) return { ok: false, prefix: null, value: null, knownPrefix: false, taxonomy: false };

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx <= 0 || colonIdx === trimmed.length - 1) {
        // Sin `:` o `:` en posición inválida → folksonómico
        const folkValue = normalizeTag(trimmed);
        if (!folkValue) return { ok: false, prefix: null, value: null, knownPrefix: false, taxonomy: false };
        return { ok: true, prefix: null, value: folkValue, knownPrefix: false, taxonomy: false };
    }

    const prefix = normalizeTag(trimmed.slice(0, colonIdx));
    const value  = normalizeTag(trimmed.slice(colonIdx + 1));
    if (!prefix || !value) {
        // Tras normalizar quedó vacío en algún lado → tratar como folksonómico
        const folkValue = normalizeTag(trimmed);
        if (!folkValue) return { ok: false, prefix: null, value: null, knownPrefix: false, taxonomy: false };
        return { ok: true, prefix: null, value: folkValue, knownPrefix: false, taxonomy: false };
    }
    return {
        ok:          true,
        prefix,
        value,
        knownPrefix: KNOWN_TAXONOMY_PREFIXES.includes(prefix),
        taxonomy:    KNOWN_TAXONOMY_PREFIXES.includes(prefix),
    };
}

// Helper · construye un tag taxonómico canónico (siempre normalizado).
export function buildTag(prefix, value) {
    const p = normalizeTag(prefix);
    const v = normalizeTag(value);
    if (!p || !v) return null;
    return p + ':' + v;
}

// Tras combinar varias listas, garantizar unicidad sin perder el orden inicial.
function unique(arr) {
    const seen = new Set();
    const out = [];
    for (const t of (arr || [])) {
        if (typeof t !== 'string') continue;
        if (seen.has(t)) continue;
        seen.add(t);
        out.push(t);
    }
    return out;
}

// ─── Generadores por entidad ────────────────────────────────────────────────

// Proyecto cliente (clonado de un sector).
// project: { id, nombre, sector_id, based_on_sector?, cnae?, scope? }
// sector:  opcional · objeto con `cnae` o sólo string id.
export function taxonomicTagsForProject(project, sector = null) {
    if (!project) return [];
    const sectorId = project.sector_id || project.based_on_sector || (sector && (sector.id || sector));
    const cnae     = project.cnae || (sector && sector.cnae) || null;
    const scope    = project.scope || 'client';
    const tags = [
        buildTag('kind', 'project'),
        sectorId ? buildTag('sector', sectorId) : null,
        cnae     ? buildTag('cnae',   cnae)     : null,
        buildTag('scope', scope),
        buildTag('project', project.id || ''),
    ].filter(Boolean);
    return unique(tags);
}

// Rol VNA dentro de un proyecto cliente.
// role:    { id, name, castell_level }
// project: el proyecto donde vive (para sector·project tags)
export function taxonomicTagsForRole(role, project = null) {
    if (!role) return [];
    const sectorId = project ? (project.sector_id || project.based_on_sector) : null;
    const tags = [
        buildTag('kind', 'role'),
        buildTag('role', role.id || ''),
        role.castell_level ? buildTag('castell', role.castell_level) : null,
        sectorId           ? buildTag('sector',  sectorId)           : null,
        project?.id        ? buildTag('project', project.id)         : null,
    ].filter(Boolean);
    return unique(tags);
}

// Transaction (arista del VNA).
// tx: { id, from, to, deliverable, type, is_must }
export function taxonomicTagsForTransaction(tx, project = null) {
    if (!tx) return [];
    const tags = [
        buildTag('kind', 'transaction'),
        tx.type    ? buildTag('tx-type', tx.type)            : null,
        tx.is_must !== undefined ? buildTag('is-must', tx.is_must ? 'yes' : 'no') : null,
        project?.id ? buildTag('project', project.id) : null,
    ].filter(Boolean);
    return unique(tags);
}

// SOP del proyecto cliente (project-role-sop).
// sop:     resultado del roleSopGenerator (objeto con id, name, role_ref, soc_ref)
// project: el proyecto donde vive
// role:    el rol al que pertenece (para sector y castell)
export function taxonomicTagsForSop(sop, project = null, role = null) {
    if (!sop) return [];
    const sectorId = project ? (project.sector_id || project.based_on_sector) : null;
    const tags = [
        buildTag('kind', 'project-role-sop'),
        sop.role_ref ? buildTag('role', sop.role_ref) : null,
        sop.soc_ref  ? buildTag('soc-ref', sop.soc_ref) : null,
        project?.id  ? buildTag('project', project.id) : null,
        sectorId     ? buildTag('sector', sectorId)    : null,
        role?.castell_level ? buildTag('castell', role.castell_level) : null,
    ].filter(Boolean);
    return unique(tags);
}

// Step de un SOP (sub-tag, no nodo independiente, pero se reusa al generar WOs).
// step: { id, role_kind, priority, approval_rule, deliverable_kind }
export function taxonomicTagsForStep(step) {
    if (!step) return [];
    const tags = [
        step.role_kind        ? buildTag('step-kind', step.role_kind)         : null,
        step.priority         ? buildTag('priority',  step.priority)          : null,
        step.approval_rule    ? buildTag('approval',  step.approval_rule)     : null,
        step.deliverable_kind ? buildTag('deliverable', step.deliverable_kind): null,
    ].filter(Boolean);
    return unique(tags);
}

// Work Order generada desde un step de un SOP.
// wo:      el work order { id, projectId, content: { sopRef, assignee, priority, approvalRule } }
// sopRef:  slug del SOP padre (puede venir distinto del wo.content.sopRef si se pasa explícito)
// step:    el step del que se generó la WO
export function taxonomicTagsForWo(wo, sopRef = null, step = null) {
    if (!wo) return [];
    const c = wo.content || {};
    const sopRefFinal = sopRef || c.sopRef || null;
    const kind = c.assignee?.kind || (step && step.role_kind) || null;
    const tags = [
        buildTag('kind', 'work-order'),
        buildTag('status', c.status || 'backlog'),
        sopRefFinal     ? buildTag('sop-ref',  sopRefFinal)        : null,
        kind            ? buildTag('role-kind', kind)              : null,
        c.priority      ? buildTag('priority', c.priority)         : null,
        c.approvalRule  ? buildTag('approval', c.approvalRule)     : null,
        wo.projectId    ? buildTag('project', wo.projectId)        : null,
    ].filter(Boolean);
    return unique(tags);
}

// ─── Combinador · merge taxonomy + folksonomy preservando ambos ─────────────
// Al persistir un nodo: combina los tags taxonómicos (que el sistema controla,
// vienen siempre primero) con los folksonómicos (libres del usuario o LLM).
// Garantiza unicidad y no descarta los folksonómicos previamente añadidos.
export function mergeTags(taxonomic, folksonomic) {
    const tax  = (taxonomic  || []).map(t => normalizeTag(t)).filter(Boolean);
    const folk = (folksonomic || []).map(t => normalizeTag(t)).filter(Boolean);
    return unique([...tax, ...folk]);
}
