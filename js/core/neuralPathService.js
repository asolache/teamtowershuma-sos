// =============================================================================
// TEAMTOWERS SOS V11 — NEURAL PATH SERVICE (NEURAL-PATH-001 sprint A)
//
// "Log de rutes neuronals/nodals · contextes a mida al CVS o flow històric
// que el creador de contextes pot ampliar amb referencies de nodes · un flux
// de valor per a l'agent."
//
// Concepte · cada interacció rellevant de l'usuari amb un node (visita,
// edició, IA-fill, publicació, ...) crea un step al seu neural path. Aquest
// historial nodal és · (1) un CV/flow històric per a humans · (2) un flux
// de context personalitzat per a agents IA que necessiten "saber què ha
// estat treballant l'usuari" sense haver-li de preguntar.
//
// Filosofia · alineat amb 4 principis canònics:
//   1. Tot són nodes · cada step és un `neural_path_step` node
//   2. Tota aportació es comptabilitza · el TEMPS i CONTEXT de l'usuari
//      és valor (no només diners) · el log permet auditar contribució
//   3. Stakeholders pool · futur · els paths poden aportar slicing pie
//      "engagement-weighted"
//   4. TEA + Permaweb · paths firmables ECDSA · context bundles publicables
//
// Steps · `kind` enum · 'visit' · 'edit' · 'create' · 'ai-fill' · 'publish' ·
//   'comment' · 'sign' · 'transfer' · custom (futur)
//
// Pure service · zero side-effect al render. El consumidor (router.js,
// views, services) crida `appendStep` async · no bloca.
// =============================================================================

import { CANONICAL_NODE_TYPES } from './canonicalPrinciples.js';

export const NEURAL_PATH_STEP_TYPE = 'neural_path_step';
export const NEURAL_PATH_BUNDLE_TYPE = 'neural_path_bundle';

// Steps de path · catàleg congelat · el caller passa `kind`
export const PATH_STEP_KINDS = Object.freeze({
    visit:    'Visita d\'una vista / ruta',
    edit:     'Edició d\'un node existent',
    create:   'Creació d\'un node nou',
    delete:   'Esborrar un node',
    'ai-fill':'Generació amb IA · audit + cost',
    publish:  'Publicació al permaweb',
    comment:  'Comentari / nota associada',
    sign:     'Signatura ECDSA d\'un node',
    transfer: 'Transferència de saldo entre wallets',
    apply:    'Aplicació d\'un draft IA al projecte',
});

// PATH_STEP_RETENTION_DAYS · TTL · steps més antics es poden purgar (sprint B)
export const PATH_STEP_RETENTION_DAYS = 90;

// ─── Pure builders ────────────────────────────────────────────────────────

// buildNeuralPathStep · pure · construeix un step idempotent
//   { ownerHandle, kind, refType, refId, projectId?, route?, summary?, meta? }
// Idempotència · l'id incorpora `now` + hash de refId+kind perquè dos steps
// iguals al mateix instant col·lisionen (no problema · es desambigüen amb
// random suffix). Per a dedup explícit, el caller pot passar `id` override.
export function buildNeuralPathStep({
    ownerHandle,
    kind,
    refType    = null,
    refId      = null,
    projectId  = null,
    route      = null,
    summary    = null,
    meta       = null,
    ts         = null,
    id         = null,
} = {}) {
    if (!ownerHandle)                throw new Error('buildNeuralPathStep requires ownerHandle');
    if (!kind || !PATH_STEP_KINDS[kind]) throw new Error('buildNeuralPathStep · unknown kind: ' + kind);
    const at = typeof ts === 'number' ? ts : Date.now();
    const stepId = id || ('np-' + at.toString(36) + '-' + Math.random().toString(36).slice(2, 6));
    // Defensive · refType ha de ser un canonical type si es passa
    if (refType && !CANONICAL_NODE_TYPES.hasOwnProperty(refType)) {
        // No throw · sols warn · permet refs externes (futur)
    }
    return {
        id:   stepId,
        type: NEURAL_PATH_STEP_TYPE,
        content: {
            ownerHandle:  ownerHandle.startsWith('@') ? ownerHandle : ('@' + ownerHandle),
            kind,
            refType,
            refId,
            projectId,
            route:        route ? String(route).slice(0, 200) : null,
            summary:      summary ? String(summary).slice(0, 240) : null,
            meta:         (meta && typeof meta === 'object') ? meta : null,
            ts:           at,
        },
        keywords: [
            'type:neural-path-step',
            'owner:' + (ownerHandle.startsWith('@') ? ownerHandle : ('@' + ownerHandle)),
            'kind:' + kind,
            ...(refType ? ['refType:' + refType] : []),
            ...(refId   ? ['refId:' + String(refId).slice(0, 40)] : []),
            ...(projectId ? ['projectId:' + projectId] : []),
        ],
        createdAt: at,
        updatedAt: at,
    };
}

// appendStep · async · persisteix un step al KB · fire-and-forget per al caller
//   Si kb no és proveït, prova d'importar el default.
export async function appendStep({ kb = null, ...args } = {}) {
    try {
        const k = kb || (await import('./kb.js')).KB;
        const step = buildNeuralPathStep(args);
        await k.upsert(step);
        return step;
    } catch (e) {
        console.warn('[neural-path] appendStep failed', e?.message);
        return null;
    }
}

// purgeOldSteps · async · esborra neural_path_step nodes més antics que
// retentionDays (default 90 · ve de PATH_STEP_RETENTION_DAYS).
//
// SAFETY · els bundles ja firmats NO es toquen · els steps que ja s'han
// inclòs a un bundle s'han copiat al bundle.content.stepsSnapshot (sprint A
// del neural path), així que purgar-los no perd informació.
//
// Retorna · { purgedCount, retainedCount, cutoffTs, dryRun, errors }
// dryRun=true · NO esborra, sols compta (per a UI preview)
export async function purgeOldSteps({
    kb           = null,
    retentionDays = PATH_STEP_RETENTION_DAYS,
    nowTs        = null,
    dryRun       = false,
    ownerHandle  = null,   // opcional · sols purga steps d'un usuari concret
} = {}) {
    const k = kb || (await import('./kb.js')).KB;
    if (!k || typeof k.query !== 'function') {
        throw new Error('purgeOldSteps requires kb with query()');
    }
    const now = typeof nowTs === 'number' ? nowTs : Date.now();
    const cutoffTs = now - (retentionDays * 24 * 3600 * 1000);
    let nodes = [];
    try {
        nodes = await k.query({ type: NEURAL_PATH_STEP_TYPE });
    } catch (e) {
        return { purgedCount: 0, retainedCount: 0, cutoffTs, dryRun, errors: [e?.message || String(e)] };
    }
    const handleFilter = ownerHandle
        ? (ownerHandle.startsWith('@') ? ownerHandle : ('@' + ownerHandle))
        : null;
    const errors = [];
    let purgedCount = 0;
    let retainedCount = 0;
    for (const n of nodes) {
        const ts = n?.content?.ts ?? n?.createdAt ?? 0;
        if (handleFilter && n?.content?.ownerHandle !== handleFilter) {
            retainedCount++;
            continue;
        }
        if (ts >= cutoffTs) {
            retainedCount++;
            continue;
        }
        if (dryRun) {
            purgedCount++;
            continue;
        }
        try {
            if (typeof k.deleteNode === 'function')      await k.deleteNode(n.id);
            else if (typeof k.remove === 'function')     await k.remove(n.id);
            else throw new Error('kb has no deleteNode/remove method');
            purgedCount++;
        } catch (e) {
            errors.push((n.id || '?') + ': ' + (e?.message || String(e)));
        }
    }
    return { purgedCount, retainedCount, cutoffTs, dryRun, errors };
}

// queryStepsForOwner · async · llegeix steps d'un usuari (ordenats DESC per ts)
export async function queryStepsForOwner({ kb, ownerHandle, limit = 100 } = {}) {
    if (!kb)          throw new Error('queryStepsForOwner requires kb');
    if (!ownerHandle) throw new Error('queryStepsForOwner requires ownerHandle');
    const handle = ownerHandle.startsWith('@') ? ownerHandle : ('@' + ownerHandle);
    let nodes = [];
    try {
        nodes = await kb.query({ type: NEURAL_PATH_STEP_TYPE });
    } catch (_) { nodes = []; }
    return nodes
        .filter(n => n?.content?.ownerHandle === handle)
        .sort((a, b) => (b?.content?.ts || 0) - (a?.content?.ts || 0))
        .slice(0, limit);
}

// ─── Context bundles ──────────────────────────────────────────────────────
// Un context bundle és una col·lecció curada de steps + nodes referenciats
// que un creador (humà o agent) selecciona per a alimentar una IA amb
// "context personalitzat". Per exemple · si l'usuari construeix una landing,
// el bundle pot incloure els últims 10 steps de tipus 'visit' a /presentation,
// els 5 'edit' a /map, etc.
//
// El bundle és serializable + publicable al permaweb (sprint B · firmat ECDSA).

// buildContextBundle · pure · construeix bundle a partir d'una selecció
//   { ownerHandle, name, stepIds, extraRefs?, intent?, audienceId? }
//   stepIds · ids de neural_path_step que formen el bundle
//   extraRefs · refs addicionals fora del path log · { nodeIds:[] }
//   intent · què vol l'agent fer amb aquest context · 'generate-landing',
//            'estimate-effort', 'audit-quality', ...
//   audienceId · alineat amb LANDING-UNIFY-001
export function buildContextBundle({
    ownerHandle,
    name,
    stepIds      = [],
    extraRefs    = null,
    intent       = null,
    audienceId   = null,
    ts           = null,
    id           = null,
} = {}) {
    if (!ownerHandle) throw new Error('buildContextBundle requires ownerHandle');
    if (!name)        throw new Error('buildContextBundle requires name');
    if (!Array.isArray(stepIds) || stepIds.length === 0) {
        throw new Error('buildContextBundle requires stepIds[] (≥1)');
    }
    const at = typeof ts === 'number' ? ts : Date.now();
    const bundleId = id || ('npb-' + at.toString(36) + '-' + Math.random().toString(36).slice(2, 6));
    return {
        id:   bundleId,
        type: NEURAL_PATH_BUNDLE_TYPE,
        content: {
            ownerHandle:  ownerHandle.startsWith('@') ? ownerHandle : ('@' + ownerHandle),
            name:         String(name).slice(0, 120),
            stepIds:      stepIds.slice(0, 200),         // cap a 200 steps
            extraRefs:    extraRefs ? {
                nodeIds: Array.isArray(extraRefs.nodeIds) ? extraRefs.nodeIds.slice(0, 50) : [],
            } : null,
            intent:       intent ? String(intent).slice(0, 80) : null,
            audienceId:   audienceId || null,
            stepCount:    stepIds.length,
            createdAt:    at,
            // TEA · firmable opcional (sprint B)
            signatureFormat: 'ECDSA-P256-SHA256-base64',
            signature:    null,
        },
        keywords: [
            'type:neural-path-bundle',
            'owner:' + (ownerHandle.startsWith('@') ? ownerHandle : ('@' + ownerHandle)),
            ...(intent     ? ['intent:' + intent] : []),
            ...(audienceId ? ['audience:' + audienceId] : []),
        ],
        createdAt: at,
        updatedAt: at,
    };
}

// resolveBundleSteps · async · resol els stepIds + extraRefs a nodes reals
//   Retorna { steps:[], extraNodes:[], missing:[] }
export async function resolveBundleSteps({ kb, bundle } = {}) {
    if (!kb)     throw new Error('resolveBundleSteps requires kb');
    if (!bundle) throw new Error('resolveBundleSteps requires bundle');
    const c = bundle.content || {};
    const stepIds = c.stepIds || [];
    const extraIds = (c.extraRefs?.nodeIds || []);
    const steps = [];
    const extraNodes = [];
    const missing = [];
    for (const sid of stepIds) {
        try {
            const n = await kb.getNode(sid);
            if (n) steps.push(n); else missing.push(sid);
        } catch (_) { missing.push(sid); }
    }
    for (const nid of extraIds) {
        try {
            const n = await kb.getNode(nid);
            if (n) extraNodes.push(n);
        } catch (_) {}
    }
    return { steps, extraNodes, missing };
}

// renderBundleAsContextString · pure · output multi-líneas per a injectar
// a un system/user prompt d'IA. Comprimit · sols summary + ref + ts.
//   { steps, extraNodes, intent, audienceId, ownerHandle, name }
export function renderBundleAsContextString({
    bundle,
    steps      = [],
    extraNodes = [],
} = {}) {
    if (!bundle) return '';
    const c = bundle.content || {};
    const lines = [];
    lines.push('## Context bundle · ' + (c.name || 'sense nom'));
    if (c.intent)     lines.push('Intent · ' + c.intent);
    if (c.audienceId) lines.push('Audience · ' + c.audienceId);
    if (c.ownerHandle) lines.push('Owner · ' + c.ownerHandle);
    lines.push('Steps · ' + steps.length);
    lines.push('');
    if (steps.length) {
        lines.push('### Historial nodal recent');
        for (const s of steps.slice(0, 50)) {
            const sc = s?.content || {};
            const when = sc.ts ? new Date(sc.ts).toISOString().slice(0, 16).replace('T', ' ') : '?';
            const ref  = sc.refType && sc.refId ? sc.refType + '#' + sc.refId : (sc.route || '·');
            const sum  = sc.summary ? ' · ' + sc.summary : '';
            lines.push('- [' + when + '] ' + sc.kind + ' ' + ref + sum);
        }
    }
    if (extraNodes.length) {
        lines.push('');
        lines.push('### Refs addicionals');
        for (const n of extraNodes.slice(0, 30)) {
            const t = n.type || '?';
            const idShort = String(n.id || '').slice(0, 32);
            const title = n?.content?.name || n?.content?.title || idShort;
            lines.push('- ' + t + '#' + idShort + ' · ' + title);
        }
    }
    return lines.join('\n');
}

// ─── Agg helpers per a UI ─────────────────────────────────────────────────

// summarizeStepsByKind · pure · counts per kind per al stats strip
export function summarizeStepsByKind(steps) {
    const counts = {};
    for (const s of (steps || [])) {
        const k = s?.content?.kind || 'unknown';
        counts[k] = (counts[k] || 0) + 1;
    }
    return counts;
}

// summarizeStepsByProject · pure · counts per projectId
export function summarizeStepsByProject(steps) {
    const counts = {};
    for (const s of (steps || [])) {
        const p = s?.content?.projectId || 'no-project';
        counts[p] = (counts[p] || 0) + 1;
    }
    return counts;
}
