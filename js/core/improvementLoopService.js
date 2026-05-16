// =============================================================================
// TEAMTOWERS SOS V11 — IMPROVEMENT LOOP SERVICE (IMPROVEMENT-LOOP sprint A)
// Ruta · /js/core/improvementLoopService.js
//
// Bucle de millora contínua · TDD WO flow desde SOPs · feedback agent amb
// context dels deliverables anteriors per enriquir evolució del projecte.
// Cada iteració produeix un improvement_cycle node amb deliverable +
// enrichments + suggested next WOs · cosa que automàticament alimenta la
// pròxima iteració amb context acumulat. Pure · zero KB · zero DOM.
//
// FLUX D'UNA ITERACIÓ ·
//   1. Pick pròxim SOP (segons model · ordre prioritat + què s'ha cobert ja)
//   2. buildWOFromSOP(sop, project, prevDeliverables) · construeix WO amb context
//   3. Executor (injectable runner) processa amb prompt enriquit
//   4. analyzeDeliverable(output, model) · detecta enrichments + suggested-next
//   5. applyEnrichmentsToProject(project, enrichments) · genera mutacions
//      (tags · noves keywords · suggestions per a WO futures)
//   6. Retorna improvement_cycle node + project mutations + suggested next WO
//
// PRINCIPIS · pure · injectable · zero IA hardcoded · zero KB hardcoded ·
// determinístic per a mock runner.
// =============================================================================

export const IMPROVEMENT_CYCLE_TYPE = 'improvement_cycle';
export const IMPROVEMENT_MODEL_TYPE = 'improvement_model';

// Focus areas standard · l'usuari pot afegir custom
export const FOCUS_AREAS = Object.freeze([
    { id: 'canvas-evolution',    label: 'Canvas · vision/mission/values evolution',
      keywords: ['vision', 'mission', 'values', 'stakeholder', 'north-star', 'purpose'] },
    { id: 'role-coverage',       label: 'Role · skill coverage + ownership',
      keywords: ['role', 'rol', 'skill', 'ownership', 'cohort', 'manager', 'responsable'] },
    { id: 'transactions-clarity', label: 'Transactions · entregables clars',
      keywords: ['transaction', 'transacció', 'entregable', 'deliverable', 'output', 'contract'] },
    { id: 'commercial-pipeline', label: 'Commercial · proposals + invoices + revenue',
      keywords: ['proposal', 'invoice', 'cliente', 'revenue', 'ingrés', 'cobrament', 'factura', 'oferta'] },
    { id: 'accounting-discipline', label: 'Accounting · balance + P&L hygiene',
      keywords: ['ledger', 'comptable', 'balance', 'expense', 'profit', 'doubleentry', 'tax'] },
    { id: 'governance-protocols', label: 'Governance · decisions + pacts + transparency',
      keywords: ['governança', 'governance', 'pact', 'decision', 'vote', 'transparency', 'protocol'] },
    { id: 'tokenomics-fairness', label: 'Tokenomics · distribution + vesting fairness',
      keywords: ['token', 'distribution', 'vesting', 'cliff', 'supply', 'slicing', 'pie', 'equity'] },
    { id: 'workshop-cohort',     label: 'Workshop · cohort education',
      keywords: ['workshop', 'cohort', 'training', 'onboarding', 'curriculum', 'tier'] },
]);

const FOCUS_BY_ID = new Map(FOCUS_AREAS.map(f => [f.id, f]));

// defineImprovementModel · pura · model spec per al loop
export function defineImprovementModel({
    projectId    = null,
    focusAreas   = null,        // array de ids · default tots
    scoringRules = null,        // { bonus: [keyword,...], penalty: [keyword,...] }
    maxCycles    = 20,
    ts           = null,
} = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    const areas = Array.isArray(focusAreas) && focusAreas.length
        ? focusAreas.filter(id => FOCUS_BY_ID.has(id))
        : FOCUS_AREAS.map(f => f.id);
    return {
        id:        'imodel-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 6),
        type:      IMPROVEMENT_MODEL_TYPE,
        projectId,
        content: {
            focusAreas:   areas,
            scoringRules: scoringRules || {
                bonus:   ['concrete', 'metric', 'stakeholder', 'transaction', 'evidence', 'attestation'],
                penalty: ['vague', 'tbd', 'maybe', 'unsure', 'reinvent', 'duplicate'],
            },
            maxCycles,
            createdAt:    now,
        },
        createdAt: now,
        updatedAt: now,
    };
}

// pickNextSOP · pura · selecciona el pròxim SOP a executar.
// Heurística simple · prefereix SOPs no executats encara (no apareixen al
// prevCycles.sourceSopId) · empate · ordre original.
// Si TOTS ja executats · re-circula al primer (loop continu).
export function pickNextSOP({ sops = [], prevCycles = [] } = {}) {
    if (!Array.isArray(sops) || sops.length === 0) return null;
    const usedIds = new Set();
    for (const c of prevCycles || []) {
        const sid = c?.content?.sourceSopId;
        if (sid) usedIds.add(sid);
    }
    // Primer · prefereix unused
    const unused = sops.filter(s => s?.id && !usedIds.has(s.id));
    if (unused.length > 0) return unused[0];
    // Fallback · re-circula al primer (loop)
    return sops[0];
}

// buildWOFromSOP · pura · construeix work_order amb context enriquit.
//
// args ·
//   sop          · SOP node origen
//   project      · project node
//   prevCycles   · [improvement_cycle...] · pels deliverables previs
//   iteration    · número d'iteració (1-based)
//   ts           · injectable
//
// Retorna · { id, type:'work_order', projectId, content: {...} }
export function buildWOFromSOP({ sop, project, prevCycles = [], iteration = 1, ts = null } = {}) {
    if (!sop || !sop.id)      throw new Error('sop required');
    if (!project || !project.id) throw new Error('project required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    const projectName = project.nombre || project.name || project.id;
    const title = '[Iter ' + iteration + '] ' + (sop.content?.title || sop.title || sop.id);
    // Context · darrers 3 deliverables previs
    const recent = (prevCycles || []).slice(-3);
    const contextLines = [];
    if (recent.length > 0) {
        contextLines.push('## Context · darrers ' + recent.length + ' deliverables anteriors');
        for (const c of recent) {
            const cc = c.content || {};
            contextLines.push('### Iter ' + (cc.iteration ?? '?') + ' · SOP ' + (cc.sourceSopId || '?'));
            const preview = String(cc.deliverableOutput || '').slice(0, 300);
            if (preview) contextLines.push(preview);
            if (Array.isArray(cc.enrichments) && cc.enrichments.length) {
                contextLines.push('enrichments aplicats · ' + cc.enrichments.map(e => e.kind).join(' · '));
            }
        }
    }
    const sopBody = sop.content?.body || sop.body || (Array.isArray(sop.content?.steps) ? sop.content.steps.join('\n') : '');
    const description = [
        'Project · ' + projectName,
        'SOP origen · ' + (sop.content?.title || sop.id),
        '',
        sopBody,
        '',
        contextLines.join('\n'),
        '',
        '## Tasca · executar aquest SOP i retornar entregable concret. ',
        'Coherent amb context previ. Tags concrets, mètriques, stakeholders.',
    ].join('\n');
    return {
        id:        'wo-iloop-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 6),
        type:      'work_order',
        projectId: project.id,
        content: {
            title,
            description,
            sourceSopId:  sop.id,
            iteration,
            status:       'pending',
            createdBy:    'improvement-loop',
            createdAt:    now,
            kind:         'improvement-loop-wo',
            prevContext:  recent.map(c => ({ id: c.id, iter: c.content?.iteration })),
        },
        createdAt: now,
        updatedAt: now,
    };
}

// analyzeDeliverable · pura · escanneja output per detectar enrichments
// + suggested-next WOs + score per model.
//
// args ·
//   output  · string · text retornat pel runner
//   model   · improvement_model
//   project · per a context (tags existents · skills · etc)
//
// Retorna ·
//   {
//     enrichments: [{ kind, target?, payload, reason }],
//     suggestedNext: [{ title, description, focusAreaId }],
//     mentions:    [{ focusAreaId, keyword }],
//     score:       0-100,
//   }
export function analyzeDeliverable({ output = '', model = null, project = null } = {}) {
    const text = typeof output === 'string' ? output : '';
    const enrichments = [];
    const suggestedNext = [];
    const mentions = [];
    let score = 50; // baseline

    if (!text || text.length < 20) {
        return { enrichments, suggestedNext, mentions, score: 0 };
    }

    const lower = text.toLowerCase();
    const m = model?.content || model || {};
    const focusIds = Array.isArray(m.focusAreas) && m.focusAreas.length ? m.focusAreas : FOCUS_AREAS.map(f => f.id);
    const bonus = (m.scoringRules?.bonus  || []);
    const penalty = (m.scoringRules?.penalty || []);

    // Mencions per focus area
    for (const fid of focusIds) {
        const fa = FOCUS_BY_ID.get(fid);
        if (!fa) continue;
        for (const kw of fa.keywords) {
            if (lower.includes(kw)) {
                mentions.push({ focusAreaId: fid, keyword: kw });
                score += 2;
            }
        }
    }

    // Score · bonus + penalty
    for (const b of bonus) {
        if (lower.includes(String(b).toLowerCase())) score += 3;
    }
    for (const p of penalty) {
        if (lower.includes(String(p).toLowerCase())) score -= 5;
    }
    score = Math.max(0, Math.min(100, score));

    // Enrichments · simple extraction heurística
    //   1. Tags · paraules sobre 6 chars que apareixen com a kw a focus + no estan
    //      a project.tags ja · proposem afegir
    const existingTags = new Set((project?.tags || []).map(t => String(t).toLowerCase()));
    const candidateTags = new Set();
    for (const m of mentions) {
        const kw = m.keyword;
        if (kw.length > 5 && !existingTags.has(kw)) candidateTags.add(kw);
    }
    for (const tag of Array.from(candidateTags).slice(0, 3)) {
        enrichments.push({
            kind:     'add-tag',
            target:   'project',
            payload:  tag,
            reason:   'keyword-frequent-in-deliverable',
        });
    }

    //   2. Per cada focus-area amb ≥2 mencions · suggereix WO futur
    const focusCount = new Map();
    for (const m of mentions) {
        focusCount.set(m.focusAreaId, (focusCount.get(m.focusAreaId) || 0) + 1);
    }
    for (const [fid, count] of focusCount) {
        if (count >= 2) {
            const fa = FOCUS_BY_ID.get(fid);
            if (!fa) continue;
            suggestedNext.push({
                title:       'Profunditzar · ' + fa.label,
                description: 'L\'output anterior menciona ' + count + ' keywords de ' + fa.label + ' · cal una iteració dedicada per aprofundir.',
                focusAreaId: fid,
            });
        }
    }

    //   3. Si l'output menciona 'stakeholder' o 'role' nou · suggereix afegir-lo
    if (/\bnou\s+(rol|role|stakeholder)\b/i.test(text) || /\bnew\s+(role|stakeholder)\b/i.test(text)) {
        enrichments.push({
            kind:    'suggest-role',
            target:  'project',
            payload: 'output suggereix nou role/stakeholder · revisar manualment',
            reason:  'pattern-match',
        });
    }

    //   4. Si l'output cita una mètrica numèrica · enriquiment "evidence-cited"
    if (/\d+(\.\d+)?\s*(%|€|euros?|hores?|mau|users?|dies?)/i.test(text)) {
        enrichments.push({
            kind:    'evidence-cited',
            target:  'project',
            payload: 'mètrica numèrica detectada',
            reason:  'concrete-metric',
        });
        score = Math.min(100, score + 5);
    }

    return { enrichments, suggestedNext, mentions, score };
}

// applyEnrichmentsToProject · pura · genera mutacions al project node.
// NO toca KB · retorna { project: updated, mutations: [{type, payload}] }.
// El consumidor decideix què persistir.
export function applyEnrichmentsToProject({ project = null, enrichments = [] } = {}) {
    if (!project) throw new Error('project required');
    const mutations = [];
    let next = { ...project, tags: Array.isArray(project.tags) ? project.tags.slice() : [] };
    for (const e of enrichments) {
        if (!e || !e.kind) continue;
        if (e.kind === 'add-tag' && typeof e.payload === 'string') {
            const tag = String(e.payload).toLowerCase().trim();
            if (tag && !next.tags.includes(tag)) {
                next.tags.push(tag);
                mutations.push({ type: 'tag-added', tag });
            }
        } else if (e.kind === 'evidence-cited') {
            next._iLoopEvidenceCount = (next._iLoopEvidenceCount || 0) + 1;
            mutations.push({ type: 'evidence-counted' });
        } else if (e.kind === 'suggest-role') {
            mutations.push({ type: 'role-suggested', note: e.payload });
        }
    }
    next.updatedAt = Date.now();
    return { project: next, mutations };
}

// buildImprovementCycleNode · pura · serialitza cicle per KB.upsert
export function buildImprovementCycleNode({
    projectId   = null,
    iteration   = 1,
    sourceSopId = null,
    woId        = null,
    deliverableOutput = '',
    analysis    = null,         // resultat de analyzeDeliverable
    modelId     = null,
    status      = 'completed',
    startedAt,
    finishedAt,
    log         = [],
    ts          = null,
} = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        id:        'icycle-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 6),
        type:      IMPROVEMENT_CYCLE_TYPE,
        projectId,
        content: {
            iteration,
            sourceSopId,
            woId,
            deliverableOutput,
            enrichments:    analysis?.enrichments || [],
            suggestedNext:  analysis?.suggestedNext || [],
            mentions:       analysis?.mentions || [],
            score:          analysis?.score || 0,
            modelId,
            status,
            startedAt:      startedAt || new Date(now).toISOString(),
            finishedAt:     finishedAt || new Date(now).toISOString(),
            log,
        },
        createdAt: now,
        updatedAt: now,
    };
}

// runImprovementCycle · async · executa una iteració completa.
//
// args ·
//   project       · project node
//   sop           · SOP node a executar
//   prevCycles    · [improvement_cycle...] · context anterior
//   model         · improvement_model
//   runner        · REQUIRED · async ({ prompt, sop, project, iteration }) →
//                   { output, costEur?, modelKey? }
//   evaluator     · opcional · async (output) → { ok, reason }
//   iteration     · número 1-based
//   ts            · injectable
//
// Retorna ·
//   {
//     ok,
//     cycle:        cycle node (per upsert)
//     wo:           WO node (per upsert)
//     mutations:    [{type, payload}]
//     updatedProject: project node amb enrichments aplicats (per upsert)
//     error?
//   }
export async function runImprovementCycle({
    project       = null,
    sop           = null,
    prevCycles    = [],
    model         = null,
    runner        = null,
    evaluator     = null,
    iteration     = 1,
    onActivity    = null,
    ts            = null,
} = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    const startedAt = new Date(now).toISOString();
    const log = [];

    // Helper · emit + log + onActivity callback
    const emit = (event) => {
        const enriched = { ts: Date.now(), ...event };
        log.push(enriched);
        if (onActivity) { try { onActivity(enriched); } catch (_) { /* swallow */ } }
    };

    if (!project) return { ok: false, error: 'project-required', log };
    if (!sop)     return { ok: false, error: 'sop-required', log };
    if (!runner || typeof runner !== 'function') return { ok: false, error: 'runner-required', log };

    const sopTitle = sop.content?.title || sop.title || sop.id;
    emit({ kind: 'cycle-start', iteration, sopId: sop.id, sopTitle });

    let wo;
    try { wo = buildWOFromSOP({ sop, project, prevCycles, iteration, ts: now }); }
    catch (e) { return { ok: false, error: 'wo-build-fail · ' + e.message, log }; }
    emit({ kind: 'wo-built', woId: wo.id, contextCount: Math.min(prevCycles?.length || 0, 3) });

    // Runner execution (TDD-style · 1 retry si evaluator rebutja)
    let output = '';
    let lastErr = null;
    const maxAttempts = evaluator ? 2 : 1;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            // Pre-runner event · UI mostra 'Pensant…' mentre esperem
            emit({ kind: 'runner-start', sopId: sop.id, sopTitle, iteration, attempt, woId: wo.id });
            const r = await runner({
                prompt:       wo.content.description,
                sop,
                project,
                iteration,
                wo,
                attempt,
                prevCycles,
            });
            output = r?.output || r?.text || '';
            if (!output || typeof output !== 'string') { lastErr = 'empty-output'; continue; }
            if (evaluator) {
                const ev = await evaluator(output, wo);
                if (!ev?.ok) { lastErr = 'eval-fail · ' + (ev?.reason || ''); continue; }
            }
            emit({ kind: 'wo-executed', attempt, woId: wo.id, outputLen: output.length, costEur: r?.costEur || 0 });
            lastErr = null;
            break;
        } catch (e) {
            lastErr = 'runner-throw · ' + (e?.message || 'unknown');
        }
    }

    if (lastErr) {
        emit({ kind: 'wo-failed', woId: wo.id, error: lastErr });
        const failCycle = buildImprovementCycleNode({
            projectId: project.id, iteration, sourceSopId: sop.id, woId: wo.id,
            deliverableOutput: '', analysis: null, modelId: model?.id,
            status: 'failed', startedAt, finishedAt: new Date().toISOString(), log, ts: now,
        });
        return { ok: false, error: lastErr, wo, cycle: failCycle, mutations: [], updatedProject: project, log };
    }

    // Analitzar deliverable
    const analysis = analyzeDeliverable({ output, model, project });
    emit({ kind: 'analyzed', enrichments: analysis.enrichments.length, score: analysis.score, mentionsCount: (analysis.mentions || []).length });

    // Aplicar enrichments al project (pura · retorna nou node)
    const applied = applyEnrichmentsToProject({ project, enrichments: analysis.enrichments });
    emit({ kind: 'enrichments-applied', mutations: applied.mutations.length });

    // Marca WO completed
    wo.content.status = 'completed';
    wo.content.deliverableOutput = output;
    wo.updatedAt = Date.now();

    const cycle = buildImprovementCycleNode({
        projectId: project.id,
        iteration,
        sourceSopId: sop.id,
        woId: wo.id,
        deliverableOutput: output,
        analysis,
        modelId: model?.id,
        status: 'completed',
        startedAt,
        finishedAt: new Date().toISOString(),
        log,
        ts: now,
    });

    return {
        ok:             true,
        wo,
        cycle,
        mutations:      applied.mutations,
        updatedProject: applied.project,
        log,
    };
}

// runImprovementLoop · async · executa múltiples cicles seqüencials fins
// `maxIterations` o evaluator-fail o runner-error o usuari-cancel.
//
// Cada iteració alimenta el context al següent · els prevCycles s'acumulen.
//
// Retorna · { ok, cycles, finalProject, totalEnrichments, mutationsLog, errors }
export async function runImprovementLoop({
    project        = null,
    sops           = [],
    model          = null,
    runner         = null,
    evaluator      = null,
    maxIterations  = 5,
    onIteration    = null,    // callback ({ iteration, cycle, mutations }) → void
    onActivity     = null,    // callback ({ kind, ts, ...payload }) → void (fine-grained)
    ts             = null,
} = {}) {
    if (!project) return { ok: false, error: 'project-required', cycles: [] };
    if (!runner)  return { ok: false, error: 'runner-required',  cycles: [] };
    if (!Array.isArray(sops) || sops.length === 0) {
        return { ok: false, error: 'sops-empty', cycles: [] };
    }

    const cycles = [];
    const errors = [];
    const mutationsLog = [];
    let currentProject = project;
    let totalEnrichments = 0;
    const baseTs = (typeof ts === 'number') ? ts : Date.now();

    if (onActivity) { try { onActivity({ kind: 'loop-start', iterations: maxIterations, ts: Date.now() }); } catch (_) {} }

    for (let i = 1; i <= maxIterations; i++) {
        const sop = pickNextSOP({ sops, prevCycles: cycles });
        if (!sop) break;
        const result = await runImprovementCycle({
            project:    currentProject,
            sop,
            prevCycles: cycles,
            model,
            runner,
            evaluator,
            iteration:  i,
            onActivity,
            ts:         baseTs + i,
        });
        if (!result.ok) {
            errors.push({ iteration: i, error: result.error });
            if (result.cycle) cycles.push(result.cycle);
            // Continuem · una iteració fallida no bloqueja el loop
        } else {
            cycles.push(result.cycle);
            totalEnrichments += (result.cycle.content?.enrichments?.length || 0);
            mutationsLog.push(...result.mutations.map(m => ({ ...m, iteration: i })));
            currentProject = result.updatedProject;
        }
        if (onIteration) {
            try { onIteration({ iteration: i, cycle: result.cycle, mutations: result.mutations || [], ok: result.ok }); }
            catch (_) { /* swallow */ }
        }
    }

    const final = {
        ok:                errors.length === 0,
        cycles,
        finalProject:      currentProject,
        totalEnrichments,
        mutationsLog,
        errors,
        iterations:        cycles.length,
    };
    if (onActivity) {
        try {
            onActivity({
                kind: 'loop-end',
                ok:   final.ok,
                iterations: final.iterations,
                totalEnrichments,
                mutations: mutationsLog.length,
                errors: errors.length,
                ts: Date.now(),
            });
        } catch (_) {}
    }
    return final;
}
