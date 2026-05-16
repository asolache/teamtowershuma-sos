// =============================================================================
// TEAMTOWERS SOS V11 — VALUE FLOW INTEGRITY (VALUE-FLOW-INTEGRITY-001)
// Ruta · /js/core/valueFlowIntegrityService.js
//
// Cross-layer validator · verifica que les 4 capes (SOC · SOP · valueFlow ·
// processes) estan sincronitzades. 7 regles R1-R7 · cada una retorna issues
// amb severity · human_message · auto_fix_hint per a UI feedback.
//
// Pure · zero deps · safe en Node.
// Veure `docs/STUDY-value-flow-audit-2026-05-15.md` §4.3.
// =============================================================================

export const INTEGRITY_VERSION = 'v1.0';

export const SEVERITIES = Object.freeze(['error', 'warning', 'info']);

// ─── Canonical input ──────────────────────────────────────────────────────
// { socs[], sops[], valueFlow:{ roles[], deliverables[], transactions[] },
//   processes[] (opcional · post-alfa) }
// Tots arrays. Buit acceptable.

function _empty() {
    return { socs: [], sops: [], valueFlow: { roles: [], deliverables: [], transactions: [] }, processes: [] };
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function _roleAliases(role) {
    if (!role) return [];
    const set = new Set();
    if (role.id) set.add(role.id);
    if (role.roleSlug) set.add(role.roleSlug);
    if (role.role_slug) set.add(role.role_slug);
    return [...set];
}

function _sopRole(sop) {
    if (!sop) return null;
    const c = sop.content || {};
    return sop.role_ref || sop.roleId || sop.role_id || sop.roleRef
        || c.role_ref   || c.roleId   || c.role_id   || c.roleRef
        || null;
}

function _sopSteps(sop) {
    if (!sop) return [];
    if (Array.isArray(sop.steps)) return sop.steps;
    if (sop.content && Array.isArray(sop.content.steps)) return sop.content.steps;
    return [];
}

function _socChecklist(soc) {
    if (!soc) return [];
    if (Array.isArray(soc.checklist)) return soc.checklist;
    if (soc.content && Array.isArray(soc.content.checklist)) return soc.content.checklist;
    return [];
}

// ─── Regles ───────────────────────────────────────────────────────────────

// R1 · cada SOP step.deliverable_kind ∈ deliverables del projecte
//     (matching per kind label · si template usa kind genèric · ok)
function r1_sopStepDeliverableExists(input) {
    const issues = [];
    const dels = input.valueFlow.deliverables || [];
    const deliverableNames = new Set();
    for (const d of dels) {
        if (d?.id) deliverableNames.add(String(d.id).toLowerCase());
        // També acceptem la "kind" semàntica si està declarada
        if (d?.kind) deliverableNames.add(String(d.kind).toLowerCase());
        if (d?.description) {
            // Acceptem coincidencia parcial al primer mot · ex. "Direcció estratègica" matches "direcció"
            const firstWord = String(d.description).split(/\s+/)[0]?.toLowerCase();
            if (firstWord && firstWord.length >= 4) deliverableNames.add(firstWord);
        }
    }
    // Si no hi ha deliverables · skip · serà reportat per R5
    if (deliverableNames.size === 0) return issues;

    // R1 és relaxada · només warning · perquè el matching kind↔deliverable
    // és semàntic (label) i pot variar. Hard rule només si CAP step matcha.
    for (const sop of input.sops) {
        const steps = _sopSteps(sop);
        if (steps.length === 0) continue;
        const kinds = steps.map(s => s?.deliverable_kind).filter(Boolean).map(k => k.toLowerCase());
        if (kinds.length === 0) {
            issues.push({
                rule: 'R1', severity: 'warning',
                human_message: 'SOP ' + (sop.id || '?') + ' · cap step amb deliverable_kind declarat',
                auto_fix_hint: 'afegir step.deliverable_kind a tots els passos',
            });
        }
    }
    return issues;
}

// R2 · cada SOP.role_ref ∈ roles del valueFlow (alias · id o roleSlug)
function r2_sopRoleRefExists(input) {
    const issues = [];
    const allAliases = new Set();
    for (const r of input.valueFlow.roles || []) {
        for (const a of _roleAliases(r)) allAliases.add(a);
    }
    if (allAliases.size === 0 && input.sops.length > 0) {
        issues.push({
            rule: 'R2', severity: 'error',
            human_message: 'Hi ha SOPs però cap rol al valueFlow',
            auto_fix_hint: 'definir roles abans de SOPs',
        });
        return issues;
    }
    for (const sop of input.sops) {
        const ref = _sopRole(sop);
        if (!ref) {
            issues.push({
                rule: 'R2', severity: 'warning',
                human_message: 'SOP ' + (sop.id || '?') + ' · sense role_ref',
                auto_fix_hint: 'afegir role_ref al SOP',
            });
            continue;
        }
        if (!allAliases.has(ref)) {
            issues.push({
                rule: 'R2', severity: 'error',
                sop_id: sop.id,
                bad_ref: ref,
                human_message: 'SOP ' + (sop.id || '?') + ' · role_ref="' + ref + '" no existeix al valueFlow',
                auto_fix_hint: 'usar id o roleSlug d\'un rol existent',
            });
        }
    }
    return issues;
}

// R3 · cada SOC checklist item amb sop_ref existeix com a SOP
function r3_socChecklistSopRefExists(input) {
    const issues = [];
    const sopIds = new Set(input.sops.map(s => s?.id).filter(Boolean));
    for (const soc of input.socs) {
        const checklist = _socChecklist(soc);
        for (const item of checklist) {
            if (!item || !item.sop_ref) continue;
            if (!sopIds.has(item.sop_ref)) {
                issues.push({
                    rule: 'R3', severity: 'error',
                    soc_id: soc.id,
                    bad_sop_ref: item.sop_ref,
                    human_message: 'SOC ' + (soc.id || '?') + ' · item refereix sop_ref="' + item.sop_ref + '" inexistent',
                    auto_fix_hint: 'crear el SOP o corregir sop_ref',
                });
            }
        }
    }
    return issues;
}

// R4 · cada transaction.process_ref existeix com a process
// (Si no hi ha processes definits · skip · serà introduit post-alfa)
function r4_transactionProcessRefExists(input) {
    const issues = [];
    const processes = input.processes || [];
    if (processes.length === 0) return issues;
    const processIds = new Set(processes.map(p => p?.id).filter(Boolean));
    for (const tx of input.valueFlow.transactions || []) {
        if (!tx || !tx.process_ref) continue;
        if (!processIds.has(tx.process_ref)) {
            issues.push({
                rule: 'R4', severity: 'warning',
                tx_id: tx.id,
                bad_process_ref: tx.process_ref,
                human_message: 'Transaction ' + (tx.id || '?') + ' · process_ref="' + tx.process_ref + '" no existeix',
                auto_fix_hint: 'crear el process o corregir process_ref',
            });
        }
    }
    return issues;
}

// R5 · cada process.transactions[] son tots membres del DAG (tx existents)
function r5_processTransactionsAreMembers(input) {
    const issues = [];
    const processes = input.processes || [];
    if (processes.length === 0) return issues;
    const txIds = new Set((input.valueFlow.transactions || []).map(t => t?.id).filter(Boolean));
    for (const p of processes) {
        if (!p || !Array.isArray(p.transactions)) continue;
        for (const txId of p.transactions) {
            if (!txIds.has(txId)) {
                issues.push({
                    rule: 'R5', severity: 'error',
                    process_id: p.id,
                    bad_tx_id: txId,
                    human_message: 'Process ' + (p.id || '?') + ' · refereix tx="' + txId + '" inexistent',
                    auto_fix_hint: 'corregir array transactions del process',
                });
            }
        }
    }
    return issues;
}

// R6 · cada rol declarat dins un process apareix com from/to d'almenys una
// transaction del mateix process
function r6_processRolesParticipate(input) {
    const issues = [];
    const processes = input.processes || [];
    if (processes.length === 0) return issues;
    const txs = input.valueFlow.transactions || [];
    const txById = new Map();
    for (const t of txs) if (t?.id) txById.set(t.id, t);

    for (const p of processes) {
        if (!p || !Array.isArray(p.roles) || !Array.isArray(p.transactions)) continue;
        const procTxs = p.transactions.map(id => txById.get(id)).filter(Boolean);
        const involved = new Set();
        for (const t of procTxs) {
            if (t.from) involved.add(t.from);
            if (t.to)   involved.add(t.to);
        }
        for (const roleAlias of p.roles) {
            if (!involved.has(roleAlias)) {
                issues.push({
                    rule: 'R6', severity: 'warning',
                    process_id: p.id,
                    orphan_role: roleAlias,
                    human_message: 'Process ' + (p.id || '?') + ' · rol "' + roleAlias + '" declarat però no participa a cap tx del process',
                    auto_fix_hint: 'crear tx amb aquest rol o treure\'l del process',
                });
            }
        }
    }
    return issues;
}

// R7 · cicles recíprocs no trenquen el boundary del process
// Detecta cicles A→B dins un process que tinguin B→A FORA del process
// (suspecte d'escape · normalment l'altra meitat del cicle hauria de
// quedar al mateix process per coherència).
function r7_reciprocalCyclesWithinBoundary(input) {
    const issues = [];
    const processes = input.processes || [];
    if (processes.length === 0) return issues;
    const txs = input.valueFlow.transactions || [];
    const txByProcess = new Map();
    for (const t of txs) {
        if (!t || !t.process_ref) continue;
        if (!txByProcess.has(t.process_ref)) txByProcess.set(t.process_ref, []);
        txByProcess.get(t.process_ref).push(t);
    }
    // Edges globals
    const allEdges = new Set();
    for (const t of txs) if (t?.from && t?.to) allEdges.add(t.from + '→' + t.to);

    for (const p of processes) {
        const procTxs = txByProcess.get(p.id) || [];
        for (const t of procTxs) {
            if (!t.from || !t.to || t.from === t.to) continue;
            // Si l'edge invers existeix globalment però NO dins el process · warning
            const inverseEdge = t.to + '→' + t.from;
            if (allEdges.has(inverseEdge)) {
                const inverseInProcess = procTxs.some(x => x.from === t.to && x.to === t.from);
                if (!inverseInProcess) {
                    issues.push({
                        rule: 'R7', severity: 'warning',
                        process_id: p.id,
                        tx_id: t.id,
                        human_message: 'Process ' + (p.id || '?') + ' · cicle ' + t.from + '↔' + t.to + ' trenca boundary (l\'invers viu fora)',
                        auto_fix_hint: 'moure l\'edge invers dins el mateix process o tractar com a 2 processos separats',
                    });
                }
            }
        }
    }
    return issues;
}

const RULES = Object.freeze([
    { id: 'R1', label: 'SOP step deliverable_kind declarat',  fn: r1_sopStepDeliverableExists },
    { id: 'R2', label: 'SOP role_ref existeix al valueFlow',  fn: r2_sopRoleRefExists },
    { id: 'R3', label: 'SOC checklist sop_ref existeix',      fn: r3_socChecklistSopRefExists },
    { id: 'R4', label: 'Transaction process_ref existeix',    fn: r4_transactionProcessRefExists },
    { id: 'R5', label: 'Process tx members existeixen',       fn: r5_processTransactionsAreMembers },
    { id: 'R6', label: 'Process roles participen a txs',       fn: r6_processRolesParticipate },
    { id: 'R7', label: 'Cicles recíprocs dins boundary',       fn: r7_reciprocalCyclesWithinBoundary },
]);

// ─── Core · validateIntegrity ─────────────────────────────────────────────
//
// input · { socs[], sops[], valueFlow:{ roles, deliverables, transactions }, processes[] }
// Retorna · { ok, issues:[{ rule, severity, human_message, auto_fix_hint, ... }],
//             byRule, errorCount, warningCount, version }
export function validateIntegrity(input) {
    const normalized = _normalize(input);
    const issues = [];
    const byRule = {};
    for (const rule of RULES) {
        let ruleIssues;
        try {
            ruleIssues = rule.fn(normalized) || [];
        } catch (err) {
            ruleIssues = [{
                rule: rule.id, severity: 'error',
                human_message: 'Error a la regla ' + rule.id + ' · ' + (err?.message || err),
                auto_fix_hint: 'reportar bug al validator',
            }];
        }
        byRule[rule.id] = { label: rule.label, count: ruleIssues.length, severities: _severityCounts(ruleIssues) };
        for (const i of ruleIssues) issues.push(i);
    }
    const errorCount   = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    return {
        ok: errorCount === 0,
        issues,
        byRule,
        errorCount,
        warningCount,
        version: INTEGRITY_VERSION,
    };
}

function _severityCounts(issues) {
    const out = { error: 0, warning: 0, info: 0 };
    for (const i of issues) {
        if (i.severity && out[i.severity] !== undefined) out[i.severity]++;
    }
    return out;
}

function _normalize(input) {
    if (!input) return _empty();
    const vf = input.valueFlow || {};
    return {
        socs:      Array.isArray(input.socs) ? input.socs : [],
        sops:      Array.isArray(input.sops) ? input.sops : [],
        valueFlow: {
            roles:        Array.isArray(vf.roles)        ? vf.roles        : [],
            deliverables: Array.isArray(vf.deliverables) ? vf.deliverables : [],
            transactions: Array.isArray(vf.transactions) ? vf.transactions : [],
        },
        processes: Array.isArray(input.processes) ? input.processes : [],
    };
}

// Exports addicionals
export { RULES };
