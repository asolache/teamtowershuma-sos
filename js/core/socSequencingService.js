// =============================================================================
// TEAMTOWERS SOS V11 — SOC SEQUENCING SERVICE (VALUE-FLOW-SOC-SEQ-001)
// Ruta · /js/core/socSequencingService.js
//
// Agrupa transactions del value flow en SOCs (Standard Operating Concepts) ·
// processos d'operació coherents. Cada SOC té:
//   - trigger d'entrada (què el comença)
//   - seqüència ordenada de transactions
//   - criteri de sortida (què el considera complet)
//   - checklist amb sop_refs (≥80% dels SOPs del group)
//
// Diana · rubric C11 (SOC coverage ≥80% dels SOPs) passa al 100%
// post-personalize · cada projecte té ≥1 SOC amb ≥3 items checklist.
//
// Pure · zero IA · zero KB · zero DOM. Heurístic determinístic.
// =============================================================================

export const SOC_SEQUENCING_VERSION = 'v1.0';

// _norm · pure
function _norm(s) {
    return String(s || '').trim().toLowerCase();
}

// _matches · pure · two strings compared case-insensitively
function _matches(a, b) {
    return _norm(a) === _norm(b);
}

// _topologicalOrder · pure · simple topo · transactions ordenades per
// frequency descending (més freqüent primer) + fallback per id alfabètic.
// No fa cycle resolution agressiva · els cicles recíprocs es deixen com a tals
// (són desitjats per al rubric C7).
function _topologicalOrder(transactions) {
    const FREQ = { weekly: 0, monthly: 1, quarterly: 2, yearly: 3 };
    return transactions.slice().sort((a, b) => {
        const fa = FREQ[a.frequency] ?? 4;
        const fb = FREQ[b.frequency] ?? 4;
        if (fa !== fb) return fa - fb;
        return String(a.id || '').localeCompare(String(b.id || ''));
    });
}

// ─── Heurístic d'agrupació · per rol pivot ──────────────────────────────
// Estratègia · per a cada rol "pivot" (apareix en moltes transactions ·
// típicament tronc/pinya), agrupar les seves transactions com a process
// candidate. Si una transaction toca múltiples pivots · prioritzar al rol
// que té més edges al group.
function _findPivots(transactions, roles, { minEdgesPivot = 3 } = {}) {
    const edgesByRole = new Map();
    for (const t of transactions) {
        if (!t) continue;
        if (t.from) edgesByRole.set(t.from, (edgesByRole.get(t.from) || 0) + 1);
        if (t.to)   edgesByRole.set(t.to,   (edgesByRole.get(t.to)   || 0) + 1);
    }
    const pivotIds = [...edgesByRole.entries()]
        .filter(([_id, count]) => count >= minEdgesPivot)
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id);
    return pivotIds;
}

// ─── extractProcessGroups · pure · retorna groups candidats ──────────────
// Output · [{ id, name, trigger, exitCriteria, transactions, roles, pivotRole }]
export function extractProcessGroups({ transactions = [], roles = [] } = {}) {
    if (transactions.length === 0) return [];
    const pivots = _findPivots(transactions, roles, { minEdgesPivot: 3 });

    if (pivots.length === 0) {
        // Cap pivot prou central · agrupem TOTES les transactions en un sol process
        const involvedRoles = [...new Set(transactions.flatMap(t => [t.from, t.to]).filter(Boolean))];
        return [{
            id: 'proc-all',
            name: 'Cicle operatiu principal',
            trigger: 'kickoff',
            exitCriteria: 'cicle complert',
            transactions: _topologicalOrder(transactions),
            roles: involvedRoles,
            pivotRole: null,
        }];
    }

    const groups = [];
    const assignedTxIds = new Set();

    for (const pivot of pivots) {
        const pivotTxs = transactions.filter(t =>
            t && (t.from === pivot || t.to === pivot) && !assignedTxIds.has(t.id)
        );
        if (pivotTxs.length === 0) continue;
        pivotTxs.forEach(t => t.id && assignedTxIds.add(t.id));
        const involvedRoles = [...new Set(pivotTxs.flatMap(t => [t.from, t.to]).filter(Boolean))];
        const pivotRoleNode = (roles || []).find(r => r?.id === pivot || r?.roleSlug === pivot);
        const pivotName = pivotRoleNode?.name || pivot;
        groups.push({
            id: 'proc-' + String(pivot).replace(/[^a-z0-9-]+/gi, '-').toLowerCase(),
            name: 'Procés centrat a ' + pivotName,
            trigger: pivot + ' ready',
            exitCriteria: 'cycle complete · ' + pivotName,
            transactions: _topologicalOrder(pivotTxs),
            roles: involvedRoles,
            pivotRole: pivot,
        });
    }

    // Transactions no assignades · grup "miscellaneous"
    const leftovers = transactions.filter(t => t && t.id && !assignedTxIds.has(t.id));
    if (leftovers.length > 0) {
        const leftoverRoles = [...new Set(leftovers.flatMap(t => [t.from, t.to]).filter(Boolean))];
        groups.push({
            id: 'proc-misc',
            name: 'Altres transaccions',
            trigger: 'on-demand',
            exitCriteria: 'completada',
            transactions: _topologicalOrder(leftovers),
            roles: leftoverRoles,
            pivotRole: null,
        });
    }

    return groups;
}

// ─── materializeSocs · pure · groups → SOC nodes amb checklist sop_refs ─
// Inputs · groups[] (d'extractProcessGroups), sops[] (per a sop_ref matching),
//          projectId (per a content.projectId i id namespace), ts (per testing)
// Output · [soc] amb structure compatible amb socDualPurposeService + rubric C11
export function materializeSocs({ groups = [], sops = [], projectId = null, ts = null } = {}) {
    if (groups.length === 0) return [];
    const now = (typeof ts === 'number') ? ts : Date.now();

    return groups.map((g, i) => {
        // Per a cada rol del grup · busca el SOP corresponent · afegeix al checklist
        const checklist = [];
        let itemIdx = 1;
        for (const roleAlias of (g.roles || [])) {
            const matchingSop = (sops || []).find(s => {
                const c = s?.content || {};
                const ref = s.role_ref || s.roleId || s.role_id || c.role_ref || c.roleId || c.role_id;
                return _matches(ref, roleAlias);
            });
            if (matchingSop) {
                checklist.push({
                    id: 'soc-item-' + g.id + '-' + (itemIdx++),
                    label: 'Tenir SOP operativa · ' + (matchingSop.title || matchingSop.content?.title || roleAlias),
                    required: true,
                    verification_kind: 'sop-exists',
                    sop_ref: matchingSop.id,
                });
            }
        }
        return {
            id: g.id + (projectId ? '-' + projectId : ''),
            type: 'soc',
            projectId,
            content: {
                projectId,
                name: g.name,
                purpose: 'Procés operatiu coherent · trigger ' + g.trigger + ' · sortida ' + g.exitCriteria,
                trigger: g.trigger,
                exit_criteria: g.exitCriteria,
                transactions: g.transactions.map(t => t.id).filter(Boolean),
                roles: g.roles.slice(),
                checklist: checklist,
            },
            createdAt: now,
            updatedAt: now,
            keywords: ['type:soc', 'soc-sequencing-auto', 'process:' + g.id],
        };
    });
}

// ─── computeSocCoverage · pure · helper per a rubric C11 ────────────────
// Retorna { ratio, coveredSopIds, totalSopIds } · per validar que ≥80% dels
// SOPs estan referenciats per algun SOC checklist item.
export function computeSocCoverage({ sops = [], socs = [] } = {}) {
    const totalSopIds = sops.map(s => s.id).filter(Boolean);
    if (totalSopIds.length === 0) return { ratio: 0, coveredSopIds: [], totalSopIds: [] };
    const referenced = new Set();
    for (const soc of socs) {
        const checklist = soc?.content?.checklist || soc?.checklist || [];
        for (const item of checklist) {
            if (item?.sop_ref) referenced.add(item.sop_ref);
        }
    }
    const coveredSopIds = totalSopIds.filter(id => referenced.has(id));
    return {
        ratio: coveredSopIds.length / totalSopIds.length,
        coveredSopIds,
        totalSopIds,
    };
}

// ─── sequenceSocs · helper integrat · groups + materialize + coverage ─────
// Sortida · { socs, groups, coverage } · directament cridable per al
// orchestrator step `personalize` post-IA.
export function sequenceSocs({ transactions = [], roles = [], sops = [], projectId = null, ts = null } = {}) {
    const groups = extractProcessGroups({ transactions, roles });
    const socs = materializeSocs({ groups, sops, projectId, ts });
    const coverage = computeSocCoverage({ sops, socs });
    return { socs, groups, coverage };
}
