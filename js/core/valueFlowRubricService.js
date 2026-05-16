// =============================================================================
// TEAMTOWERS SOS V11 — VALUE FLOW RUBRIC SERVICE (VALUE-FLOW-RUBRIC-001)
// Ruta · /js/core/valueFlowRubricService.js
//
// Rubric auditable · 12 criteris · 100 punts · evaluació pura del mapa de
// valor d'un projecte (roles · deliverables · transactions · SOPs · SOCs).
// Substitueix el scoring hardcoded i serveix com a contracte TDD del flow
// `projectCreationLegendary`.
//
// Veure `docs/STUDY-value-flow-audit-2026-05-15.md` §2.
//
// Pure · zero deps · safe en Node. Adapters per a project (vna_roles/...) i
// per a valueFlow node (content.roles/...).
// =============================================================================

export const RUBRIC_VERSION = '1.0';

// Llindars de status (idèntics al projectQualityService per a coherència visual).
export const RUBRIC_THRESHOLDS = Object.freeze({
    gold:   85,
    silver: 70,
    bronze: 50,
});

// Kinds canònics esperats al value flow · alineats amb SUGGESTED_ROLE_KINDS
// de `valueFlowService.js`. Cap rol pot tenir `kind:'other'` (no informatiu).
export const CANONICAL_ROLE_KINDS = Object.freeze([
    'architect', 'coder', 'reviewer', 'qa', 'pm',
    'researcher', 'editor', 'designer',
    // Roles VNA específics del domini cooperatiu · acceptats com a canònics
    'visioner', 'coordinator', 'mentor', 'cohort_manager', 'founder',
    'facilitator', 'curator', 'operator',
]);

// ─── Rubric definition · 12 criteris · pesos sumen 100 ────────────────────
export const RUBRIC = Object.freeze({
    version: RUBRIC_VERSION,
    criteria: Object.freeze([
        Object.freeze({
            id: 'C1', weight: 8, predicate: 'rolesMinCanonical',
            params: { min: 3 },
            label: 'Roles ≥ 3 amb kind canònic',
            fix: 'Afegeix més rols al mapa · cap amb kind="other"',
        }),
        Object.freeze({
            id: 'C2', weight: 4, predicate: 'castellLevelsDiversity',
            params: { min: 2 },
            label: 'Castell levels diversificats (≥2)',
            fix: 'Distribueix els rols en almenys 2 castell_levels diferents',
        }),
        Object.freeze({
            id: 'C3', weight: 8, predicate: 'deliverablePerRole',
            params: { min: 1 },
            label: 'Cada rol és productor de ≥1 deliverable',
            fix: 'Declara almenys un deliverable per cada rol (producer = rol.id)',
        }),
        Object.freeze({
            id: 'C4', weight: 4, predicate: 'deliverableWithValidator',
            params: { minRatio: 0.5 },
            label: '≥50% deliverables amb validator',
            fix: 'Assigna validator (evaluator key) a la meitat dels deliverables',
        }),
        Object.freeze({
            id: 'C5', weight: 8, predicate: 'transactionsMin',
            params: { min: 5 },
            label: 'Transaccions ≥ 5',
            fix: 'Afegeix més intercanvis de valor entre rols',
        }),
        Object.freeze({
            id: 'C6', weight: 6, predicate: 'tangibleIntangibleMix',
            params: {},
            label: 'Mix tangible + intangible',
            fix: 'Afegeix almenys una transacció de cada type (tangible/intangible)',
        }),
        Object.freeze({
            id: 'C7', weight: 8, predicate: 'reciprocalCycle',
            params: {},
            label: 'Cicle recíproc detectat',
            fix: 'Crea com a mínim 1 cicle A→B i B→A entre rols',
        }),
        Object.freeze({
            id: 'C8', weight: 6, predicate: 'noOrphanRole',
            params: {},
            label: 'Cap rol orfe (zero edges)',
            fix: 'Connecta cada rol a almenys una transacció (com from o to)',
        }),
        Object.freeze({
            id: 'C9', weight: 6, predicate: 'noDeadDeliverable',
            params: {},
            label: 'Cap deliverable mort (sense consumer ni transacció)',
            fix: 'Cada deliverable ha de tenir consumer i una transacció que el moga',
        }),
        Object.freeze({
            id: 'C10', weight: 10, predicate: 'sopPerRoleSteps',
            params: { minSteps: 3 },
            label: 'SOP per cada rol amb ≥3 steps estructurats',
            fix: 'Crea SOP amb steps (deliverable_kind + approval_rule) per a tots els rols',
        }),
        Object.freeze({
            id: 'C11', weight: 8, predicate: 'socCoverageOfSops',
            params: { minRatio: 0.8 },
            label: 'SOC checklist cobreix ≥80% dels SOPs',
            fix: 'Lliga items del checklist SOC a sop_ref per a ≥80% dels SOPs',
        }),
        Object.freeze({
            id: 'C12', weight: 24, predicate: 'leanMetricsCoverage',
            params: { minRatio: 0.8 },
            label: 'Mètriques Lean a ≥80% transactions (lead/cycle/WIP)',
            fix: 'Estima lead_time_hours · cycle_time_hours · wip_units per ≥80% transactions',
        }),
    ]),
});

// ─── Canonical input shape ────────────────────────────────────────────────
// { roles[], deliverables[], transactions[], sops[], socs[] }
// Tots arrays. Buit acceptable (donarà score 0 sense petar).

// ─── Adapters ─────────────────────────────────────────────────────────────

// fromProject · accepta el shape del MAX/founder template
// (project.vna_roles · project.vna_transactions · project.vna_deliverables?).
// Inputs opcionals sops/socs/roles des de KB.query externs · si `roles` array
// es passa, enriqueix els vna_roles amb info addicional (castell_level · kind
// del KB node real) fent merge per `roleSlug` o `id`.
export function fromProject(project, { sops = [], socs = [], roles: enrichRoles = [] } = {}) {
    if (!project) return _emptyInput();
    let roles = Array.isArray(project.vna_roles) ? project.vna_roles.slice() : [];
    const transactions = Array.isArray(project.vna_transactions) ? project.vna_transactions.slice() : [];

    // Enrich · si l'usuari passa els role nodes separats (KB.query type:'role'),
    // fusionem per roleSlug o id perquè el rubric pugui veure castell_level
    // i altres metadades que el vna_roles[] simplificat no porta.
    if (Array.isArray(enrichRoles) && enrichRoles.length > 0) {
        roles = roles.map(vr => {
            const slug = vr.roleSlug || vr.role_slug || vr.id;
            const enriched = enrichRoles.find(er => {
                const c = er.content || {};
                return c.roleSlug === slug || c.role_slug === slug || er.id === vr.id;
            });
            if (!enriched) return vr;
            const c = enriched.content || {};
            return {
                ...vr,
                castell_level: vr.castell_level || c.castell_level,
                kind: vr.kind || c.kind,
                description: vr.description || c.description,
                typicalActor: vr.typicalActor || c.typicalActor,
            };
        });
    }
    // Deliverables · si el project els porta explícits, els fem servir;
    // si no, derivem implícitament des de transactions (deliverable id).
    let deliverables = Array.isArray(project.vna_deliverables) ? project.vna_deliverables.slice() : [];
    if (deliverables.length === 0 && transactions.length > 0) {
        const seen = new Set();
        for (const t of transactions) {
            if (!t || !t.deliverable || seen.has(t.deliverable)) continue;
            seen.add(t.deliverable);
            deliverables.push({
                id:        t.deliverable,
                producer:  t.from || null,
                consumers: [t.to].filter(Boolean),
                validator: null,
                _implicit: true,
            });
        }
    }
    return {
        roles,
        deliverables,
        transactions,
        sops:  Array.isArray(sops)  ? sops.slice()  : [],
        socs:  Array.isArray(socs)  ? socs.slice()  : [],
    };
}

// fromValueFlow · accepta un node ValueFlow (flow.content.{roles, ...}).
export function fromValueFlow(flow, { sops = [], socs = [] } = {}) {
    if (!flow || !flow.content) return _emptyInput();
    return {
        roles:        Array.isArray(flow.content.roles)        ? flow.content.roles.slice()        : [],
        deliverables: Array.isArray(flow.content.deliverables) ? flow.content.deliverables.slice() : [],
        transactions: Array.isArray(flow.content.transactions) ? flow.content.transactions.slice() : [],
        sops:         Array.isArray(sops)  ? sops.slice()  : [],
        socs:         Array.isArray(socs)  ? socs.slice()  : [],
    };
}

function _emptyInput() {
    return { roles: [], deliverables: [], transactions: [], sops: [], socs: [] };
}

// ─── Predicates · pure · ({ input, params }) → { passed, score 0-100, evidence } ─

// Helper · accepta `role_ref` · `roleId` · `role_id` a top-level o dins
// `.content` (KB nodes posen els camps dins content).
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

// Helper · "identitat funcional" del rol · accepta `kind` o `roleSlug`
// (alguns templates posen el kind semàntic a `roleSlug` i deixen `kind`
// com a etiqueta genèrica del KB · ex. MAX `kind:'project_role'`).
function _roleKind(role) {
    if (!role) return null;
    if (role.kind && role.kind !== 'project_role' && role.kind !== 'other') return role.kind;
    if (role.roleSlug) return role.roleSlug;
    return role.kind || null;
}

// Helper · IDs alternatius que poden aparèixer com a `from`/`to` o referències
// de SOP. Acceptem tant `id` com `roleSlug` (slug) perquè alguns templates
// (MAX) usen el slug com a referència de transactions.
function _roleAliases(role) {
    if (!role) return [];
    const set = new Set();
    if (role.id)        set.add(role.id);
    if (role.roleSlug)  set.add(role.roleSlug);
    if (role.role_slug) set.add(role.role_slug);
    return [...set];
}

// Helper · resol "qui és la from/to" d'una tx al rol corresponent (per alias)
function _roleByAlias(roles, alias) {
    if (!alias) return null;
    for (const r of (roles || [])) {
        if (_roleAliases(r).includes(alias)) return r;
    }
    return null;
}

const PREDICATES = Object.freeze({

    rolesMinCanonical({ input, params }) {
        const min = params?.min ?? 3;
        const roles = input.roles || [];
        const total = roles.length;
        // "Other" detectat sols si tant kind com roleSlug són absents/genèrics
        const noOther = roles.every(r => {
            if (!r) return false;
            const k = _roleKind(r);
            return k && k !== 'other';
        });
        const canonicalCount = roles.filter(r => {
            const k = _roleKind(r);
            return k && CANONICAL_ROLE_KINDS.includes(k);
        }).length;
        const passed = total >= min && noOther && canonicalCount >= Math.min(1, total);
        let score = 0;
        if (total === 0) score = 0;
        else if (total < min) score = Math.round((total / min) * 70);
        else if (!noOther) score = 60;
        else if (canonicalCount === 0) score = 50;
        else score = 100;
        return { passed, score, evidence: { total, canonicalCount, noOther } };
    },

    castellLevelsDiversity({ input, params }) {
        const min = params?.min ?? 2;
        const roles = input.roles || [];
        const levels = new Set();
        for (const r of roles) {
            if (r && r.castell_level) levels.add(r.castell_level);
        }
        const passed = levels.size >= min;
        const score = passed ? 100 : Math.round((levels.size / min) * 100);
        return { passed, score, evidence: { distinctLevels: levels.size, levels: [...levels] } };
    },

    deliverablePerRole({ input, params }) {
        const min = params?.min ?? 1;
        const roles = input.roles || [];
        const dels  = input.deliverables || [];
        if (roles.length === 0) return { passed: false, score: 0, evidence: { reason: 'no-roles' } };
        let covered = 0;
        for (const r of roles) {
            const aliases = _roleAliases(r);
            const count = dels.filter(d => d && aliases.includes(d.producer)).length;
            if (count >= min) covered++;
        }
        const ratio = covered / roles.length;
        const score = Math.round(ratio * 100);
        return { passed: ratio === 1, score, evidence: { covered, total: roles.length } };
    },

    deliverableWithValidator({ input, params }) {
        const minRatio = params?.minRatio ?? 0.5;
        const dels = input.deliverables || [];
        if (dels.length === 0) return { passed: false, score: 0, evidence: { reason: 'no-deliverables' } };
        const withVal = dels.filter(d => d && d.validator && String(d.validator).trim().length > 0).length;
        const ratio = withVal / dels.length;
        const passed = ratio >= minRatio;
        const score = passed ? 100 : Math.round((ratio / minRatio) * 100);
        return { passed, score, evidence: { withValidator: withVal, total: dels.length, ratio } };
    },

    transactionsMin({ input, params }) {
        const min = params?.min ?? 5;
        const txs = input.transactions || [];
        const passed = txs.length >= min;
        const score = passed ? 100 : Math.round((txs.length / min) * 100);
        return { passed, score, evidence: { count: txs.length } };
    },

    tangibleIntangibleMix({ input }) {
        const txs = input.transactions || [];
        const types = new Set();
        for (const t of txs) {
            if (t && (t.type === 'tangible' || t.type === 'intangible')) types.add(t.type);
        }
        const passed = types.has('tangible') && types.has('intangible');
        const score = passed ? 100 : (types.size === 1 ? 50 : 0);
        return { passed, score, evidence: { types: [...types] } };
    },

    reciprocalCycle({ input }) {
        const txs = input.transactions || [];
        const edges = new Set();
        for (const t of txs) {
            if (t && t.from && t.to && t.from !== t.to) edges.add(t.from + '→' + t.to);
        }
        let cycleFound = false;
        for (const t of txs) {
            if (t && t.from && t.to && t.from !== t.to && edges.has(t.to + '→' + t.from)) {
                cycleFound = true;
                break;
            }
        }
        return { passed: cycleFound, score: cycleFound ? 100 : 0, evidence: { cycleFound } };
    },

    noOrphanRole({ input }) {
        const roles = input.roles || [];
        const txs   = input.transactions || [];
        if (roles.length === 0) return { passed: false, score: 0, evidence: { reason: 'no-roles' } };
        const involved = new Set();
        for (const t of txs) {
            if (!t) continue;
            if (t.from) involved.add(t.from);
            if (t.to)   involved.add(t.to);
        }
        const orphans = roles.filter(r => {
            const aliases = _roleAliases(r);
            return !aliases.some(a => involved.has(a));
        }).map(r => r.id);
        const ratio = (roles.length - orphans.length) / roles.length;
        const score = Math.round(ratio * 100);
        return { passed: orphans.length === 0, score, evidence: { orphans } };
    },

    noDeadDeliverable({ input }) {
        const dels = input.deliverables || [];
        const txs  = input.transactions || [];
        if (dels.length === 0) return { passed: false, score: 0, evidence: { reason: 'no-deliverables' } };
        const txDels = new Set(txs.map(t => t?.deliverable).filter(Boolean));
        const dead = [];
        for (const d of dels) {
            const hasConsumers = Array.isArray(d.consumers) && d.consumers.length > 0;
            const moved = txDels.has(d.id);
            if (!hasConsumers || !moved) dead.push(d.id);
        }
        const ratio = (dels.length - dead.length) / dels.length;
        const score = Math.round(ratio * 100);
        return { passed: dead.length === 0, score, evidence: { dead } };
    },

    sopPerRoleSteps({ input, params }) {
        const minSteps = params?.minSteps ?? 3;
        const roles = input.roles || [];
        const sops  = input.sops  || [];
        if (roles.length === 0) return { passed: false, score: 0, evidence: { reason: 'no-roles' } };
        let coveredRoles = 0;
        for (const r of roles) {
            const aliases = _roleAliases(r);
            const ownSops = sops.filter(s => aliases.includes(_sopRole(s)));
            const wellFormed = ownSops.some(s => {
                const steps = _sopSteps(s);
                if (steps.length < minSteps) return false;
                return steps.every(st => st && st.deliverable_kind && st.approval_rule);
            });
            if (wellFormed) coveredRoles++;
        }
        const ratio = coveredRoles / roles.length;
        const score = Math.round(ratio * 100);
        return { passed: ratio === 1, score, evidence: { coveredRoles, total: roles.length } };
    },

    socCoverageOfSops({ input, params }) {
        const minRatio = params?.minRatio ?? 0.8;
        const sops = input.sops || [];
        const socs = input.socs || [];
        if (sops.length === 0) return { passed: false, score: 0, evidence: { reason: 'no-sops' } };
        // Recull tots els sop_ref dels checklists dels SOCs
        const referenced = new Set();
        for (const soc of socs) {
            const checklist = (soc && (soc.checklist || soc.content?.checklist)) || [];
            for (const item of checklist) {
                if (item && item.sop_ref) referenced.add(item.sop_ref);
            }
        }
        const covered = sops.filter(s => referenced.has(s.id)).length;
        const ratio = covered / sops.length;
        const passed = ratio >= minRatio;
        const score = passed ? 100 : Math.round((ratio / minRatio) * 100);
        return { passed, score, evidence: { covered, total: sops.length, ratio } };
    },

    leanMetricsCoverage({ input, params }) {
        const minRatio = params?.minRatio ?? 0.8;
        const txs = input.transactions || [];
        if (txs.length === 0) return { passed: false, score: 0, evidence: { reason: 'no-transactions' } };
        const isPositiveNumber = v => typeof v === 'number' && Number.isFinite(v) && v >= 0;
        const withMetrics = txs.filter(t => t
            && isPositiveNumber(t.lead_time_hours)
            && isPositiveNumber(t.cycle_time_hours)
            && isPositiveNumber(t.wip_units)
        ).length;
        const ratio = withMetrics / txs.length;
        const passed = ratio >= minRatio;
        const score = passed ? 100 : Math.round((ratio / minRatio) * 100);
        return { passed, score, evidence: { withMetrics, total: txs.length, ratio } };
    },

});

// ─── Core · evaluateRubric ────────────────────────────────────────────────
// input · shape canonical { roles, deliverables, transactions, sops, socs }
// rubric · per defecte RUBRIC · permet rubric custom (per a tests futurs)
// predicates · registry opcional · per defecte PREDICATES · permet injectar
//              predicates extra sense modificar el registre congelat.
// Retorna · { total · status · byCriterion · missing }
export function evaluateRubric(input, rubric = RUBRIC, predicates = PREDICATES) {
    const normalized = _normalize(input);
    const byCriterion = {};
    const missing = [];
    let weightedSum = 0;
    let totalWeight = 0;

    for (const c of (rubric.criteria || [])) {
        const fn = predicates[c.predicate];
        if (!fn) {
            byCriterion[c.id] = {
                id: c.id, weight: c.weight, score: 0, passed: false,
                label: c.label, fix: c.fix,
                evidence: { error: 'predicate-not-registered · ' + c.predicate },
            };
            totalWeight += c.weight;
            continue;
        }
        let result;
        try {
            result = fn({ input: normalized, params: c.params || {} });
        } catch (err) {
            result = { passed: false, score: 0, evidence: { error: String(err?.message || err) } };
        }
        const passed = !!result.passed;
        const score  = Math.max(0, Math.min(100, Math.round(result.score || 0)));
        byCriterion[c.id] = {
            id: c.id, weight: c.weight, score, passed,
            label: c.label, fix: c.fix, evidence: result.evidence || {},
        };
        weightedSum += score * c.weight;
        totalWeight += c.weight;
        if (!passed) missing.push({ criterion: c.id, label: c.label, fix: c.fix, score });
    }

    const total = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    const status = _statusFor(total);
    return { total, status, byCriterion, missing, rubricVersion: rubric.version || RUBRIC_VERSION };
}

function _statusFor(total) {
    if (total >= RUBRIC_THRESHOLDS.gold)   return 'gold';
    if (total >= RUBRIC_THRESHOLDS.silver) return 'silver';
    if (total >= RUBRIC_THRESHOLDS.bronze) return 'bronze';
    return 'red';
}

function _normalize(input) {
    if (!input) return _emptyInput();
    return {
        roles:        Array.isArray(input.roles)        ? input.roles        : [],
        deliverables: Array.isArray(input.deliverables) ? input.deliverables : [],
        transactions: Array.isArray(input.transactions) ? input.transactions : [],
        sops:         Array.isArray(input.sops)         ? input.sops         : [],
        socs:         Array.isArray(input.socs)         ? input.socs         : [],
    };
}

// Exports addicionals · útils per a debugging i UI
export { PREDICATES };
