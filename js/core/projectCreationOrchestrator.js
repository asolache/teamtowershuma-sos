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
import { validateIntegrity } from './valueFlowIntegrityService.js';
import { matchSocs, VNA_ZOOM_LEVELS, ENTITY_TYPES } from './socMatcher.js';

export const ORCHESTRATOR_VERSION = 'v1.1';

// generationMode ·
//   'template'  · clone template + personalize text (mode V1 · ràpid · offline)
//   'ai-driven' · classify → pickSocs (knowledge+IA) → generateSops (IA per SOC)
//                 → generateWOs (IA per SOP) → personalize → validate → buildNodes
//                 (mode V2 default · "mapa de valor de qualitat", no template-clone)
export const GENERATION_MODES = Object.freeze(['template', 'ai-driven']);

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

// ─── Etapa AI-DRIVEN · cadena SOC→SOP→WO ──────────────────────────────────
// _runAiDriven · async · NO substitueix el template completament · l'usa com
// a BASE i sobrescriu socs/sops/wos amb la sortida real de la IA + knowledge.
//
// args ·
//   personalized   · template ja personalitzat (canvas/pitch del path normal)
//   classification · {project_type, lifecycle_stage, sector_cnae?, entity_type?, vna_zoom?}
//   project_ctx    · {name, description, sector, entity_type}
//   pickSocs       · async fn({candidates, ctx}) → {selected:[...]} · injectable
//   generateSops   · async fn({soc, project_ctx, role_kinds}) → {sops:[...]} · injectable
//   generateWos    · async fn({sop, project_ctx}) → {wos:[...]} · injectable
//   emit           · fn(event) · streaming callback
//   index          · knowledge index (injectable per tests)
//
// Retorna · { template (modificat amb socs/sops/wos AI), socsSelected, wosGenerated, cost }
async function _runAiDriven({
    personalized,
    classification,
    project_ctx,
    pickSocs,
    generateSops,
    generateWos,
    emit,
    index = null,
} = {}) {
    let cost = 0;
    const sector_cnae = classification.sector_cnae || classification.cnae || null;
    const lifecycle_stage = classification.lifecycle_stage || 'idea';
    const entity_type = project_ctx.entity_type || classification.entity_type || 'organization';
    const vna_zoom = project_ctx.vna_zoom || classification.vna_zoom || 'mid';

    // 1) Match SOCs (knowledge-only · heurístic pur)
    emit('match-socs', 'start', { vna_zoom, sector_cnae, lifecycle_stage });
    const matched = matchSocs({
        sector_cnae, lifecycle_stage, entity_type, vna_zoom,
        project_type: classification.project_type,
        description:  project_ctx.description,
        name:         project_ctx.name,
        index,
    });
    emit('match-socs', 'done', { selected: matched.selected.length, stats: matched.stats });

    // 2) IA opcional refina la selecció (si callback present)
    let socsSelected = matched.selected.slice();
    if (typeof pickSocs === 'function' && socsSelected.length > 0) {
        emit('pick-socs-ai', 'start', { candidates: socsSelected.length });
        try {
            const r = await pickSocs({
                candidates: matched.selected,
                ctx: { name: project_ctx.name, description: project_ctx.description, sector: sector_cnae, entity_type, project_type: classification.project_type, vna_zoom },
            });
            if (r && Array.isArray(r.selected) && r.selected.length > 0) {
                // Merge · respecta ordre IA però només dels que estaven als candidats
                const cand = new Map(matched.selected.map(s => [s.relpath, s]));
                socsSelected = r.selected
                    .map(s => cand.get(s.relpath))
                    .filter(Boolean);
                if (socsSelected.length === 0) socsSelected = matched.selected.slice();
            }
            if (r?.cost) cost += r.cost;
            emit('pick-socs-ai', 'done', { final: socsSelected.length });
        } catch (e) {
            emit('pick-socs-ai', 'error', { error: e?.message || 'pickSocs failed' });
            // Fallback · seguim amb el match heurístic
        }
    }

    // 3) Genera SOPs per cada SOC seleccionat (IA opcional · si null · skip)
    const allSops = [];
    const role_kinds = (personalized.roles || []).map(r => r.kind).filter(Boolean);
    if (typeof generateSops === 'function') {
        for (const soc of socsSelected) {
            emit('generate-sops', 'start', { soc: soc.relpath });
            try {
                const r = await generateSops({
                    soc,
                    project_ctx: { ...project_ctx, sector: sector_cnae, lifecycle_stage, entity_type },
                    role_kinds,
                });
                if (r && Array.isArray(r.sops)) {
                    for (const s of r.sops) {
                        if (s && s.id) allSops.push({ ...s, soc_ref: soc.relpath });
                    }
                }
                if (r?.cost) cost += r.cost;
                emit('generate-sops', 'done', { soc: soc.relpath, count: (r?.sops || []).length });
            } catch (e) {
                emit('generate-sops', 'error', { soc: soc.relpath, error: e?.message || 'fail' });
            }
        }
    }

    // 4) Genera WOs per cada SOP (V1 buildWOFromSOP feature recuperada · ara via IA)
    const allWos = [];
    if (typeof generateWos === 'function' && allSops.length > 0) {
        for (const sop of allSops) {
            emit('generate-wos', 'start', { sop: sop.id });
            try {
                const r = await generateWos({ sop, project_ctx });
                if (r && Array.isArray(r.wos)) {
                    for (const w of r.wos) {
                        if (w && w.id) allWos.push({ ...w, sop_ref: sop.id });
                    }
                }
                if (r?.cost) cost += r.cost;
                emit('generate-wos', 'done', { sop: sop.id, count: (r?.wos || []).length });
            } catch (e) {
                emit('generate-wos', 'error', { sop: sop.id, error: e?.message || 'fail' });
            }
        }
    }

    // 5) Sobrescriu template amb sortida AI (si va generar quelcom · si no · fallback template)
    const finalTemplate = { ...personalized };
    if (allSops.length > 0) finalTemplate.sops = allSops;
    if (socsSelected.length > 0) {
        // Promociona SOCs seleccionats a primera classe · cobertura SOP
        finalTemplate.socs = socsSelected.map((soc, i) => {
            const coveringSops = allSops.filter(s => s.soc_ref === soc.relpath);
            return {
                id:          'soc-ai-' + i,
                name:        soc.title,
                purpose:     soc.reasons?.join(' · ') || 'SOC seleccionat per matcher',
                source_path: soc.relpath,
                phase:       soc.phase || lifecycle_stage,
                checklist:   coveringSops.map((sop, j) => ({
                    id:                'i' + (j + 1),
                    label:             'SOP ' + sop.title,
                    sop_ref:           sop.id,
                    required:          true,
                    verification_kind: 'manual',
                })),
            };
        });
    }

    return { template: finalTemplate, socsSelected, wosGenerated: allWos, cost };
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
//   ─ AI-DRIVEN (PR1) ─
//   generationMode · 'template' (V1·default·offline) | 'ai-driven' (V2·SOC→SOP→WO)
//   entity_type    · 'organization'|'business'|'sos'|'project_internal'
//   vna_zoom       · 'macro'|'mid'|'micro' · controla quants SOCs aplicar
//   pickSocs       · async fn IA opt · refina selecció heurística
//   generateSops   · async fn IA opt · genera SOPs per cada SOC
//   generateWos    · async fn IA opt · genera WOs per cada SOP
//   onEvent        · fn({step, status, ...payload}) · streaming UI
//   knowledgeIndex · injectable per tests
//
// Retorna ·
//   { ok, project, roles, sops, socs, wos?, transactions, deliverables, canvas, pitch,
//     workshops, classification, templateId, score, status, missing, ms, cost,
//     generationMode, socsSelected? }
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
    // AI-DRIVEN
    generationMode = 'template',
    entity_type = null,
    vna_zoom = null,
    pickSocs = null,
    generateSops = null,
    generateWos = null,
    onEvent = null,
    knowledgeIndex = null,
} = {}) {
    if (!name || typeof name !== 'string') throw new Error('createProject · name required');
    if (!AMBITION_LEVELS[ambition]) throw new Error('createProject · ambition invalid');
    if (!GENERATION_MODES.includes(generationMode)) throw new Error('createProject · generationMode invalid · ' + generationMode);

    const startMs = Date.now();
    const ts = (typeof now === 'number') ? now : Date.now();
    let cost = 0;

    const emit = (step, status, payload = {}) => {
        if (typeof onEvent === 'function') {
            try { onEvent({ step, status, ...payload }); } catch (_) {}
        }
    };

    // ─── 1. CLASSIFY ──────────────────────────────────────────────────────
    emit('classify', 'start', { name, sector });
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
    emit('classify', 'done', { classification });

    // ─── 2. SEED ──────────────────────────────────────────────────────────
    emit('seed', 'start', { templateId: templateId || classification.project_type });
    const template = pickTemplate({
        templateId: templateId || classification.project_type,
        keywords:   classification.keywords || [],
        sector,
    });
    emit('seed', 'done', { templateId: template.meta.id });

    // ─── 3. PERSONALIZE (canvas/pitch text) ──────────────────────────────
    emit('personalize', 'start', {});
    const ctx = { name, description, sector: sector || '', problem: description };
    let personalized = applyContext(template, ctx);

    if (typeof personalize === 'function') {
        try {
            const r = await personalize({ template: personalized, ctx, ambition, classification });
            if (r && r.template) personalized = r.template;
            if (r?.cost) cost += r.cost;
        } catch (_) { /* personalize és best-effort · cap excepció escapa */ }
    }
    emit('personalize', 'done', {});

    // ─── 3b. AI-DRIVEN cadena SOC→SOP→WO (V2 · opt-in via generationMode) ──
    let aiDriven = null;
    if (generationMode === 'ai-driven') {
        emit('ai-driven', 'start', { vna_zoom: vna_zoom || 'mid', entity_type: entity_type || 'organization' });
        aiDriven = await _runAiDriven({
            personalized,
            classification: { ...classification, sector_cnae: classification.sector_cnae || sector || null, entity_type, vna_zoom },
            project_ctx:    { name, description, sector, entity_type, vna_zoom },
            pickSocs, generateSops, generateWos,
            emit,
            index: knowledgeIndex,
        });
        personalized = aiDriven.template;
        cost += aiDriven.cost || 0;
        emit('ai-driven', 'done', {
            socs:    aiDriven.socsSelected.length,
            sops:    (aiDriven.template.sops || []).length,
            wos:     aiDriven.wosGenerated.length,
        });
    }

    // ─── 4. VALIDATE (rubric + integrity cross-layer) ────────────────────
    emit('validate', 'start', {});
    const evalResult = evaluateRubric({
        roles:        personalized.roles,
        deliverables: personalized.deliverables,
        transactions: personalized.transactions,
        sops:         personalized.sops,
        socs:         personalized.socs,
    });
    const integrityResult = validateIntegrity({
        valueFlow: {
            roles:        personalized.roles,
            deliverables: personalized.deliverables,
            transactions: personalized.transactions,
        },
        sops: personalized.sops,
        socs: personalized.socs,
    });
    const minScore = MIN_SCORE_FOR_AMBITION[ambition];
    // ok · rubric ≥ llindar I cap error d'integritat (warnings sí tolerats)
    const ok = evalResult.total >= minScore && integrityResult.errorCount === 0;
    emit('validate', 'done', { score: evalResult.total, status: evalResult.status, integrityErrors: integrityResult.errorCount, ok });

    // ─── 5. BUILD NODES ───────────────────────────────────────────────────
    emit('build-nodes', 'start', {});
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

    // WO nodes · derivats del AI-driven path · KB-ready
    const woNodes = (aiDriven?.wosGenerated || []).map(w => ({
        id:        (w.id || ('wo-ai-' + Math.random().toString(36).slice(2, 7))) + '-' + projectId,
        type:      'work_order',
        projectId: projectId,
        createdAt: ts,
        updatedAt: ts,
        content:   {
            ...w,
            projectId,
            status:    'pending',
            createdBy: 'ai-driven-pipeline',
        },
    }));

    emit('build-nodes', 'done', { roles: roleNodes.length, sops: sopNodes.length, socs: socNodes.length, wos: woNodes.length });
    emit('finish', 'done', { ok, score: evalResult.total, status: evalResult.status, ms: Date.now() - startMs });

    return {
        ok,
        version:      ORCHESTRATOR_VERSION,
        generationMode,
        project,
        roles:        roleNodes,
        sops:         sopNodes,
        socs:         socNodes,
        wos:          woNodes,
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
        socsSelected: aiDriven?.socsSelected || null,
        integrity:    {
            ok:           integrityResult.errorCount === 0,
            errorCount:   integrityResult.errorCount,
            warningCount: integrityResult.warningCount,
            issues:       integrityResult.issues,
            byRule:       integrityResult.byRule,
        },
        ms:           Date.now() - startMs,
        cost,
    };
}
