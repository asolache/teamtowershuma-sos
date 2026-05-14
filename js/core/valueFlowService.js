// =============================================================================
// TEAMTOWERS SOS V11 — VALUE FLOW SERVICE (VALUE-FLOW sprint A)
// Ruta · /js/core/valueFlowService.js
//
// Schema + utilities per a ValueFlow nodes · representen value chains com a
// DAG (Directed Acyclic Graph) de roles · transactions · deliverables. Base
// per al swarm-parallel-flow (sprint B · DAG executor sobre runUntilGreen).
//
// CONCEPTS ·
//   Role        · un agent (humà o IA) amb un kind funcional (architect ·
//                 coder · reviewer · qa · pm · ...). Evaluator key associat.
//   Transaction · un edge del DAG · roleFrom entrega un deliverable a roleTo.
//   Deliverable · node del DAG · producit per un role · consumit per N rols.
//                 Té un validator (evaluator kind · sentinel · etc) opcional.
//
// PURE · zero KB · zero DOM · injectable. Tots els checks són deterministics
// per a tests sense mocks heavy. Reusable per al swarm-parallel-flow.
// =============================================================================

export const VALUE_FLOW_TYPE = 'value_flow';

// Kinds de role suggerits · NO és una enum tancada · el camp `kind` pot ser
// qualsevol string. Aquests serveixen com a default mapping a evaluatorKey.
export const SUGGESTED_ROLE_KINDS = Object.freeze([
    'architect',     // dissenya plans
    'coder',         // implementa
    'reviewer',      // revisa qualitat
    'qa',            // tests + edge cases
    'pm',            // prioritza + scope
    'researcher',    // recerca prèvia
    'editor',        // narrativa
    'designer',      // UI/UX
]);

// buildEmptyValueFlow · crea un node ValueFlow buit. Retorna un objecte
// llest per a passar a KB.upsert (id es genera si no es dóna).
export function buildEmptyValueFlow({ id = null, title = '', projectId = null, ts = null } = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        id:        id || ('vflow-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 7)),
        type:      VALUE_FLOW_TYPE,
        projectId: projectId,
        content: {
            title:        title || 'Untitled value flow',
            roles:        [],            // [{ id, kind, evaluatorKey?, label? }]
            transactions: [],            // [{ id, from, to, deliverable }]
            deliverables: [],            // [{ id, producer, consumers, validator? }]
            createdAt:    now,
        },
        createdAt: now,
        updatedAt: now,
    };
}

// validateValueFlow · pura · retorna { ok, errors:[...] }
// Comprova: roles tenen ids únics, transactions referencien roles+deliverables
// existents, deliverables tenen producer existent, DAG sense cicles.
export function validateValueFlow(flow) {
    const errors = [];
    if (!flow || !flow.content) {
        return { ok: false, errors: ['flow-missing-content'] };
    }
    const { roles = [], transactions = [], deliverables = [] } = flow.content;

    // Roles · ids únics, kind no buit
    const roleIds = new Set();
    for (const r of roles) {
        if (!r || !r.id) { errors.push('role-missing-id'); continue; }
        if (roleIds.has(r.id)) errors.push('role-duplicate-id · ' + r.id);
        roleIds.add(r.id);
        if (!r.kind || typeof r.kind !== 'string') errors.push('role-missing-kind · ' + r.id);
    }

    // Deliverables · ids únics, producer ha de ser role existent
    const delIds = new Set();
    for (const d of deliverables) {
        if (!d || !d.id) { errors.push('deliverable-missing-id'); continue; }
        if (delIds.has(d.id)) errors.push('deliverable-duplicate-id · ' + d.id);
        delIds.add(d.id);
        if (!d.producer || !roleIds.has(d.producer)) {
            errors.push('deliverable-bad-producer · ' + d.id + ' → ' + d.producer);
        }
        if (Array.isArray(d.consumers)) {
            for (const c of d.consumers) {
                if (!roleIds.has(c)) errors.push('deliverable-bad-consumer · ' + d.id + ' → ' + c);
            }
        }
    }

    // Transactions · from/to són roles, deliverable existeix
    const txIds = new Set();
    for (const tx of transactions) {
        if (!tx || !tx.id) { errors.push('tx-missing-id'); continue; }
        if (txIds.has(tx.id)) errors.push('tx-duplicate-id · ' + tx.id);
        txIds.add(tx.id);
        if (!roleIds.has(tx.from)) errors.push('tx-bad-from · ' + tx.id + ' → ' + tx.from);
        if (!roleIds.has(tx.to))   errors.push('tx-bad-to · '   + tx.id + ' → ' + tx.to);
        if (!delIds.has(tx.deliverable)) errors.push('tx-bad-deliverable · ' + tx.id + ' → ' + tx.deliverable);
    }

    // Detecció de cicles al DAG de deliverables (via deliverable→consumer→produces)
    // Constuïm graf: deliverable → deliverables que consumers seus produeixen.
    const graph = new Map();
    for (const d of deliverables) {
        if (!d || !d.id) continue;
        const out = new Set();
        const consumers = Array.isArray(d.consumers) ? d.consumers : [];
        for (const consumerRoleId of consumers) {
            // Quins deliverables produeix aquest role?
            for (const d2 of deliverables) {
                if (d2 && d2.producer === consumerRoleId) out.add(d2.id);
            }
        }
        graph.set(d.id, out);
    }
    if (detectCycle(graph)) errors.push('dag-cycle-detected');

    return { ok: errors.length === 0, errors };
}

// detectCycle · DFS amb 3-color (white/gray/black). Retorna true si cicle.
function detectCycle(graph) {
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map();
    for (const id of graph.keys()) color.set(id, WHITE);

    const stack = [];
    for (const start of graph.keys()) {
        if (color.get(start) !== WHITE) continue;
        stack.push({ id: start, iter: graph.get(start).values() });
        color.set(start, GRAY);
        while (stack.length) {
            const top = stack[stack.length - 1];
            const next = top.iter.next();
            if (next.done) {
                color.set(top.id, BLACK);
                stack.pop();
                continue;
            }
            const nid = next.value;
            const c = color.get(nid);
            if (c === GRAY) return true;                          // back-edge · cicle
            if (c === BLACK) continue;
            color.set(nid, GRAY);
            stack.push({ id: nid, iter: (graph.get(nid) || new Set()).values() });
        }
    }
    return false;
}

// topologicalLevels · pura · retorna [[deliverable_id, ...], ...] · cada array
// és un "level" del DAG · tots els deliverables del mateix level es poden
// executar en paral·lel (no depenen entre ells). Si hi ha cicle · throws.
//
// Algoritme · Kahn's amb levels (no només seqüència topològica).
export function topologicalLevels(flow) {
    const validation = validateValueFlow(flow);
    if (!validation.ok) {
        if (validation.errors.includes('dag-cycle-detected')) {
            throw new Error('cycle-detected · DAG té cicle · no es pot toposort');
        }
        // Validation issues secundaries · permetem topo amb best-effort
    }

    const deliverables = (flow.content?.deliverables || []).filter(d => d && d.id);
    if (deliverables.length === 0) return [];

    // Construïm in-degree i out-edges
    //   edge: deliverable_X → deliverable_Y existeix sii X.consumers conté un
    //   role que produeix Y.
    const inDegree = new Map();
    const outEdges = new Map();
    for (const d of deliverables) {
        inDegree.set(d.id, 0);
        outEdges.set(d.id, new Set());
    }
    for (const d of deliverables) {
        const consumers = Array.isArray(d.consumers) ? d.consumers : [];
        for (const cRole of consumers) {
            for (const d2 of deliverables) {
                if (d2.producer === cRole && d2.id !== d.id) {
                    if (!outEdges.get(d.id).has(d2.id)) {
                        outEdges.get(d.id).add(d2.id);
                        inDegree.set(d2.id, (inDegree.get(d2.id) || 0) + 1);
                    }
                }
            }
        }
    }

    const levels = [];
    let frontier = deliverables.filter(d => inDegree.get(d.id) === 0).map(d => d.id);
    const processed = new Set();
    while (frontier.length) {
        levels.push(frontier.slice().sort());  // sort estable per al test
        for (const id of frontier) processed.add(id);
        const next = [];
        for (const id of frontier) {
            for (const nid of outEdges.get(id) || []) {
                inDegree.set(nid, inDegree.get(nid) - 1);
                if (inDegree.get(nid) === 0 && !processed.has(nid)) next.push(nid);
            }
        }
        frontier = next;
    }

    if (processed.size !== deliverables.length) {
        throw new Error('cycle-detected · ' + (deliverables.length - processed.size) + ' deliverables no reachable');
    }
    return levels;
}

// addRole · helper immutable. Retorna nou flow amb role afegit.
export function addRole(flow, { id, kind, evaluatorKey = null, label = null } = {}) {
    if (!id || !kind) throw new Error('id+kind required');
    const role = { id, kind, evaluatorKey, label };
    return {
        ...flow,
        content: {
            ...flow.content,
            roles: [...(flow.content.roles || []), role],
        },
        updatedAt: Date.now(),
    };
}

// addDeliverable · helper immutable
export function addDeliverable(flow, { id, producer, consumers = [], validator = null, description = null } = {}) {
    if (!id || !producer) throw new Error('id+producer required');
    const del = { id, producer, consumers: consumers.slice(), validator, description };
    return {
        ...flow,
        content: {
            ...flow.content,
            deliverables: [...(flow.content.deliverables || []), del],
        },
        updatedAt: Date.now(),
    };
}

// addTransaction · helper immutable
export function addTransaction(flow, { id, from, to, deliverable } = {}) {
    if (!id || !from || !to || !deliverable) throw new Error('id+from+to+deliverable required');
    const tx = { id, from, to, deliverable };
    return {
        ...flow,
        content: {
            ...flow.content,
            transactions: [...(flow.content.transactions || []), tx],
        },
        updatedAt: Date.now(),
    };
}

// estimateFlowComplexity · pura · score 0-100 basat en #roles · #deliverables
// · #levels · #parallelism. Ajuda al swarm a decidir budget i max iterations.
export function estimateFlowComplexity(flow) {
    const roles = flow?.content?.roles || [];
    const dels  = flow?.content?.deliverables || [];
    if (!dels.length) return { score: 0, levels: 0, maxParallel: 0, totalNodes: 0 };
    let levels;
    try { levels = topologicalLevels(flow); }
    catch (_) { return { score: 100, levels: -1, maxParallel: 0, totalNodes: dels.length, error: 'cycle' }; }

    const maxParallel = levels.reduce((m, l) => Math.max(m, l.length), 0);
    const score = Math.min(100, roles.length * 5 + dels.length * 8 + levels.length * 3 + maxParallel * 4);
    return {
        score,
        levels:      levels.length,
        maxParallel,
        totalNodes:  dels.length,
    };
}
