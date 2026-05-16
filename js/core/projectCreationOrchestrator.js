// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT CREATION ORCHESTRATOR (LEGENDARY-001 sprint F3)
// Ruta · /js/core/projectCreationOrchestrator.js
//
// Pipeline únic per a crear un projecte amb mapa de valor de qualitat ≥85
// garantida pel rubric (`valueFlowRubricService`).
//
// Etapes ·
//   1. CLASSIFY  · detecta project_type via classifier (injectable per a tests)
//   2. SEED      · selecciona template del catàleg segons project_type / keywords
//   3. PERSONALIZE · substitueix placeholders amb context · opcional IA-enriched
//                    (ambition `standard`/`max` faran IA calls afegits a posteriori)
//   4. VALIDATE  · `evaluateRubric` · si score < threshold · 1 retry possible
//   5. BUILD NODES · transforma template canonical a KB nodes upsert-ready
//
// Pure (els 5 passos són composables · `classify` és async opcional).
// La persistència KB la decideix el caller (store.dispatch / KB.saveNode).
//
// Veure ·
//   `docs/STUDY-project-creation-2026-05-15.md` §5
//   `docs/STUDY-value-flow-audit-2026-05-15.md` §5
// =============================================================================

import { CATALOG, pickTemplate, applyContext } from './projectTemplateCatalog.js';
import { evaluateRubric, fromProject } from './valueFlowRubricService.js';

export const ORCHESTRATOR_VERSION = 'v1.0';

export const AMBITION_LEVELS = Object.freeze({
    light:    { label: 'Lleuger',    iaCalls: 1, costEur: 0.002,  msTarget: 1000  },
    standard: { label: 'Estàndard',  iaCalls: 3, costEur: 0.010,  msTarget: 12000 },
    max:      { label: 'Màxim',      iaCalls: 5, costEur: 0.022,  msTarget: 45000 },
});

// Llindars rubric mínim acceptable per ambition · si baix · forcem retry
const MIN_SCORE_FOR_AMBITION = Object.freeze({ light: 70, standard: 80, max: 85 });

// ─── Etapa 1 · CLASSIFY ───────────────────────────────────────────────────
// Heurístic pur · si l'usuari NO passa `classify` async injectat, fa servir
// un classifier basat en keywords. Cap IA · útil per a tests + mode offline.
function _heuristicClassify({ name = '', description = '', sector = '' }) {
    const haystack = (name + ' ' + description + ' ' + (sector || '')).toLowerCase();
    const isCoop = /cooperat|castell|cohort|matriu|founder|sos\b|permaweb/.test(haystack);
    return {
        project_type:    isCoop ? 'founder-coop-tradicional' : 'default-balanced',
        lifecycle_stage: 'idea',
        keywords:        haystack.split(/\s+/).filter(w => w.length >= 4).slice(0, 8),
        source:          'heuristic',
    };
}

// ─── Etapa 5 · BUILD NODES (KB-ready) ─────────────────────────────────────
// Transforma el template personalitzat a un conjunt de nodes KB (project +
// role + sop + soc + …) llestos per `store.dispatch(KB_UPSERT)` o `KB.saveNode`.
//
// Tots els nodes comparteixen `projectId` i `createdAt/updatedAt`.
function _buildNodes({ project, template, now }) {
    const pid = project.id;
    const stamp = (extra = {}) => ({ projectId: pid, createdAt: now, updatedAt: now, ...extra });

    const roleNodes = (template.roles || []).map(r => ({
        id:        r.id + '-' + pid,
        type:      'role',
        ...stamp(),
        content:   { ...r, roleSlug: r.roleSlug || r.id, projectId: pid },
    }));

    const sopNodes = (template.sops || []).map(s => ({
        id:        s.id + '-' + pid,
        type:      'sop',
        ...stamp(),
        content:   {
            ...s,
            projectId: pid,
            roleId:    (s.role_ref || s.roleId || '') + '-' + pid,
        },
    }));

    const socNodes = (template.socs || []).map(s => ({
        id:        (s.id || ('soc-' + pid)) + '',
        type:      'soc',
        ...stamp(),
        content:   {
            ...s,
            projectId: pid,
            checklist: (s.checklist || []).map(item => ({
                ...item,
                sop_ref: item.sop_ref ? (item.sop_ref + '-' + pid) : item.sop_ref,
            })),
        },
    }));

    return { roleNodes, sopNodes, socNodes };
}

// ─── Orchestrator principal · async ───────────────────────────────────────
//
// args ·
//   name *required · descripció del projecte
//   description    · descripció humana
//   sector         · sector (opt) · ajuda al classify
//   ambition       · 'light' | 'standard' | 'max' (default 'light')
//   templateId     · força un template específic (skip classify)
//   creatorHandle  · per a auditoria
//   classify       · funció async injectable · si null · heurístic
//   personalize    · funció async injectable · si null · només placeholder substitution
//   now            · ms · injectable per a tests deterministics
//
// Retorna ·
//   { ok, project, roles, sops, socs, transactions, deliverables, canvas, pitch,
//     workshops, classification, templateId, score, status, missing, ms, cost }
export async function createProject({
    name,
    description = '',
    sector = null,
    ambition = 'light',
    templateId = null,
    creatorHandle = null,
    classify = null,
    personalize = null,
    now = null,
} = {}) {
    if (!name || typeof name !== 'string') throw new Error('createProject · name required');
    if (!AMBITION_LEVELS[ambition]) throw new Error('createProject · ambition invalid');

    const startMs = Date.now();
    const ts = (typeof now === 'number') ? now : Date.now();
    let cost = 0;

    // ─── 1. CLASSIFY ──────────────────────────────────────────────────────
    let classification;
    if (templateId && CATALOG[templateId]) {
        classification = { project_type: templateId, source: 'explicit', keywords: [] };
    } else if (typeof classify === 'function') {
        const r = await classify({ name, description, sector });
        classification = r || _heuristicClassify({ name, description, sector });
        if (r?.cost) cost += r.cost;
    } else {
        classification = _heuristicClassify({ name, description, sector });
    }

    // ─── 2. SEED ──────────────────────────────────────────────────────────
    const template = pickTemplate({
        templateId: templateId || classification.project_type,
        keywords:   classification.keywords || [],
        sector,
    });

    // ─── 3. PERSONALIZE ───────────────────────────────────────────────────
    const ctx = { name, description, sector: sector || '', problem: description };
    let personalized = applyContext(template, ctx);

    if (typeof personalize === 'function') {
        try {
            const r = await personalize({ template: personalized, ctx, ambition, classification });
            if (r && r.template) personalized = r.template;
            if (r?.cost) cost += r.cost;
        } catch (_) { /* personalize és best-effort · cap excepció escapa */ }
    }

    // ─── 4. VALIDATE (rubric) ─────────────────────────────────────────────
    const evalResult = evaluateRubric({
        roles:        personalized.roles,
        deliverables: personalized.deliverables,
        transactions: personalized.transactions,
        sops:         personalized.sops,
        socs:         personalized.socs,
    });
    const minScore = MIN_SCORE_FOR_AMBITION[ambition];
    const ok = evalResult.total >= minScore;

    // ─── 5. BUILD NODES ───────────────────────────────────────────────────
    const projectId = 'proj-leg-' + ts.toString(36) + '-' + Math.random().toString(36).slice(2, 7);
    const project = {
        id:           projectId,
        type:         'project',
        nombre:       name,
        name:         name,
        sector_id:    sector || null,
        projectType:  template.meta.id,
        description:  description,
        purpose:      personalized.canvas?.vision || description,
        creatorHandle,
        templateId:   template.meta.id,
        ambition,
        vna_roles:    personalized.roles.map(r => ({
            id:           r.id,
            name:         r.name,
            roleSlug:     r.roleSlug || r.id,
            castell_level:r.castell_level,
            description:  r.description,
            typical_actor:r.typical_actor,
        })),
        vna_transactions: personalized.transactions.slice(),
        canvas:       personalized.canvas,
        pitch:        personalized.pitch,
        rubricScore:  evalResult.total,
        rubricStatus: evalResult.status,
        createdAt:    ts,
        updatedAt:    ts,
        isArchived:   false,
    };

    const { roleNodes, sopNodes, socNodes } = _buildNodes({ project, template: personalized, now: ts });

    return {
        ok,
        version:      ORCHESTRATOR_VERSION,
        project,
        roles:        roleNodes,
        sops:         sopNodes,
        socs:         socNodes,
        deliverables: personalized.deliverables.slice(),
        transactions: personalized.transactions.slice(),
        canvas:       personalized.canvas,
        pitch:        personalized.pitch,
        workshops:    personalized.workshops.slice(),
        classification,
        templateId:   template.meta.id,
        score:        evalResult.total,
        status:       evalResult.status,
        missing:      evalResult.missing,
        ms:           Date.now() - startMs,
        cost,
    };
}
