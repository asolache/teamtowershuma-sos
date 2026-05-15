// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT CLASSIFIER SERVICE (C1 · sprint analysis & design)
// Ruta · /js/core/projectClassifierService.js
//
// Classifica un projecte abans de generar els seus drafts amb IA · així
// la generació pot adaptar plantilles (C2) al tipus + fase del lifecycle.
//
// Decisió presa amb l'usuari ·
//   "clasificacion automatica si hay taxonomia clara · si hay duda
//    pregunta para asegurar calidad"
//
// Estratègia ·
//   1. Heurística keyword-based (rapidíssim · sense IA · ~1ms · gratuit)
//      - Si la heurística retorna confidence ≥ 0.85 · auto-accept
//   2. Si heurística és incerta · IA `draft` tier (gpt-4o-mini · ~0.002€)
//      retorna JSON estructurat amb confidence
//   3. Si IA confidence < 0.7 · la UI ha de demanar confirmació
// =============================================================================

import { PROJECT_TYPES } from './critical108Roles.js';

export const CLASSIFIER_VERSION = 'v1.0';

// ── Taxonomies tancades ───────────────────────────────────────────────────
export const LIFECYCLE_STAGES = Object.freeze([
    Object.freeze({ id: 'idea',      label: 'Idea · pre-validació',        hint: 'No té producte/servei encara · hipotètic' }),
    Object.freeze({ id: 'mvp',       label: 'MVP · primera versió',         hint: 'Té quelcom funcional però sense usuaris validats' }),
    Object.freeze({ id: 'pilot',     label: 'Pilot · primers usuaris',      hint: 'Un grup petit l\'usa · iterant amb feedback' }),
    Object.freeze({ id: 'growth',    label: 'Creixement · expansió',        hint: 'Adquisició activa · escalat operatiu' }),
    Object.freeze({ id: 'maturity',  label: 'Maduresa · operació estable',  hint: 'Cash positiu · operació predictible' }),
    Object.freeze({ id: 'wind-down', label: 'Tancament · liquidació',       hint: 'En procés de tancar · repartir actius' }),
]);

export const PROJECT_SCALES = Object.freeze([
    Object.freeze({ id: 'local',    label: 'Local · barri/poble' }),
    Object.freeze({ id: 'regional', label: 'Regional · comarca/país' }),
    Object.freeze({ id: 'global',   label: 'Global · multi-país' }),
]);

export const DEPENDENCY_TYPES = Object.freeze([
    Object.freeze({ id: 'standalone', label: 'Independent', hint: 'No depèn de cap altre projecte' }),
    Object.freeze({ id: 'spinoff',    label: 'Spin-off',    hint: 'Branca independent d\'un projecte mare · separació formal' }),
    Object.freeze({ id: 'subproject', label: 'Subprojecte', hint: 'Subordinat operativament a un projecte mare' }),
    Object.freeze({ id: 'fork',       label: 'Fork',        hint: 'Còpia d\'un projecte existent · divergeix des d\'un punt' }),
    Object.freeze({ id: 'extension',  label: 'Extensió',    hint: 'Aporta funcionalitat extra a un projecte existent' }),
]);

const PROJECT_TYPE_IDS = PROJECT_TYPES.map(p => p.id);
const LIFECYCLE_IDS    = LIFECYCLE_STAGES.map(s => s.id);
const SCALE_IDS        = PROJECT_SCALES.map(s => s.id);
const DEPENDENCY_IDS   = DEPENDENCY_TYPES.map(d => d.id);

// ── Heurística keyword-based · sense IA · sense xarxa ─────────────────────
// Score per tipus a partir de keywords. Llindar `confidence ≥ 0.85` per
// considerar la classificació segura. Tornem un objecte amb scores.

// Keywords mapejats a project_type id · llista breu i discriminativa.
// (no exhaustiu · pensat per cobrir el 60-70% de casos directes)
const TYPE_KEYWORDS = Object.freeze({
    'comunitat-autosuficient':  ['comunitat', 'autosuficient', 'permacultura', 'hort', 'ateneu', 'transició energètica', 'ecovila'],
    'startup-coop-tradicional': ['startup', 'producte saas', 'mvp', 'founder', 'cap table', 'fundadors'],
    'empresa-en-transicio':     ['transició cooperativa', 'sccl', 'conversió', 'empresa establerta', 'consolidada'],
    'cooperativa-multi':        ['cooperativa', 'multi-stakeholder', 'coceta', 'socis treballadors', 'socis consumidors'],
    'fundacio-ong':             ['fundació', 'fundacion', 'ong', 'associació', 'sense ànim de lucre', 'no profit', 'tercer sector'],
    'ecosistema-regional':      ['comarcal', 'biorregional', 'federació', 'ecosistema regional', 'xarxa comarcal', 'coopdevs'],
    'dao-web3':                 ['dao', 'web3', 'blockchain', 'token governance', 'on-chain', 'refi', 'regen'],
    'plataforma-cooperativa':   ['plataforma cooperativa', 'platform coop', 'app cooperativa', 'marketplace cooperatiu', 'alternativa uber'],
    'cooperativa-cures':        ['cures', 'cuidados', 'salut mental', 'acompanyament', 'gent gran', 'majors', 'final de vida', 'diversitat funcional'],
    'espai-autogestionat':      ['ateneu', 'cso', 'okupa', 'autogestionat', 'co-housing', 'coliving', 'espai cultural'],
    'hub-transicio':            ['hub transició', 'transition network', 'transició alimentària', 'hub sectorial'],
    'familiar-relevo':          ['empresa familiar', 'successió', 'relleu generacional', 'patrimoni familiar'],
});

const STAGE_KEYWORDS = Object.freeze({
    'idea':       ['idea', 'concept', 'estem pensant', 'volem fer', 'futur', 'plantegem'],
    'mvp':        ['mvp', 'primera versió', 'prototip', 'beta', 'pre-llançament', 'primer producte'],
    'pilot':      ['pilot', 'fase pilot', 'primers usuaris', 'beta tancada', 'pilots'],
    'growth':     ['creixement', 'escalar', 'expansió', 'creixent', 'roadmap', 'marketing actiu'],
    'maturity':   ['estable', 'consolidat', 'establert', 'operativa estable', 'cash positiu', 'profitable'],
    'wind-down':  ['tancar', 'liquidació', 'dissolució', 'final del cicle', 'wind down'],
});

const SCALE_KEYWORDS = Object.freeze({
    'local':    ['barri', 'poble', 'local', 'vilatge', 'comunitat propera'],
    'regional': ['comarca', 'regional', 'país', 'catalunya', 'espanya', 'biorregió'],
    'global':   ['global', 'mundial', 'internacional', 'multi-país', 'continental'],
});

function _normalizeText(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function _scoreKeywords(text, kwMap) {
    const t = _normalizeText(text);
    const scores = {};
    let total = 0;
    for (const [key, kws] of Object.entries(kwMap)) {
        let s = 0;
        for (const kw of kws) {
            if (t.includes(_normalizeText(kw))) s++;
        }
        scores[key] = s;
        total += s;
    }
    return { scores, total };
}

function _topKey(scoreMap, fallback) {
    const sorted = Object.entries(scoreMap).sort(([, a], [, b]) => b - a);
    if (!sorted.length || sorted[0][1] === 0) return { key: fallback, top: 0, second: 0 };
    return { key: sorted[0][0], top: sorted[0][1], second: sorted[1] ? sorted[1][1] : 0 };
}

// classifyByHeuristic · pure · sense xarxa · retorna l'objecte de
// classificació amb confidence basat en separació top vs second.
// confidence ∈ [0, 1] · sempre.
//
// args ·
//   name, description, sector, parentProjectName
// Retorna · { project_type, lifecycle_stage, scale, dependency_type,
//             confidence, source:'heuristic', signals }
export function classifyByHeuristic({
    name = '',
    description = '',
    sector = '',
    parentProjectName = null,
} = {}) {
    const text = [name, description, sector].join(' \n ');
    const typeScored  = _scoreKeywords(text, TYPE_KEYWORDS);
    const stageScored = _scoreKeywords(text, STAGE_KEYWORDS);
    const scaleScored = _scoreKeywords(text, SCALE_KEYWORDS);

    const typeTop  = _topKey(typeScored.scores,  'startup-coop-tradicional');
    const stageTop = _topKey(stageScored.scores, 'idea');
    const scaleTop = _topKey(scaleScored.scores, 'local');

    // Confidence per cada dimensió · separació entre top i 2n
    const conf = (top) => {
        if (top.top === 0) return 0.25; // res trobat · baix
        if (top.second === 0) return 0.9;
        const sep = (top.top - top.second) / top.top;
        return Math.max(0.5, Math.min(0.95, 0.5 + sep * 0.5));
    };
    const cType  = conf(typeTop);
    const cStage = conf(stageTop);
    const cScale = conf(scaleTop);
    // Conjuncta · agafem el mínim · si una falla · tota la classificació falla
    const confidence = Number(Math.min(cType, cStage, cScale).toFixed(3));

    const dependency_type = parentProjectName ? 'subproject' : 'standalone';

    return {
        project_type:     typeTop.key,
        lifecycle_stage:  stageTop.key,
        scale:            scaleTop.key,
        dependency_type,
        confidence,
        source: 'heuristic',
        signals: {
            typeScores:  typeScored.scores,
            stageScores: stageScored.scores,
            scaleScores: scaleScored.scores,
            parentLinked: !!parentProjectName,
        },
        version: CLASSIFIER_VERSION,
    };
}

// validateClassification · pure · garanteix que els camps fan part de les
// taxonomies tancades. Retorna { ok, errors[] }.
export function validateClassification(c) {
    const errors = [];
    if (!c || typeof c !== 'object') {
        return { ok: false, errors: ['classification null o no objecte'] };
    }
    if (!PROJECT_TYPE_IDS.includes(c.project_type)) errors.push('project_type invàlid · ' + c.project_type);
    if (!LIFECYCLE_IDS.includes(c.lifecycle_stage)) errors.push('lifecycle_stage invàlid · ' + c.lifecycle_stage);
    if (!SCALE_IDS.includes(c.scale))               errors.push('scale invàlid · ' + c.scale);
    if (!DEPENDENCY_IDS.includes(c.dependency_type)) errors.push('dependency_type invàlid · ' + c.dependency_type);
    if (typeof c.confidence !== 'number' || c.confidence < 0 || c.confidence > 1) errors.push('confidence fora de rang');
    return { ok: errors.length === 0, errors };
}

// needsConfirmation · pure · llindar 0.7 (segons disseny user)
export function needsConfirmation(c) {
    if (!c) return true;
    return typeof c.confidence !== 'number' || c.confidence < 0.7;
}

// ── IA classifier · async · cost ~0.002 € · prompt curtet ────────────────
// Es crida només si la heurística no és prou segura (< 0.85).
// Demana JSON estructurat · la response es valida i normalitza.

function _buildClassifierPrompt({ name, description, sector, parentProjectName }) {
    const typeList  = PROJECT_TYPES.map(p => `- ${p.id} · ${p.label} (${p.hint})`).join('\n');
    const stageList = LIFECYCLE_STAGES.map(s => `- ${s.id} · ${s.label} (${s.hint})`).join('\n');
    const scaleList = PROJECT_SCALES.map(s => `- ${s.id} · ${s.label}`).join('\n');
    const depList   = DEPENDENCY_TYPES.map(d => `- ${d.id} · ${d.label} (${d.hint})`).join('\n');

    return [
        'Classifica aquest projecte en les 4 dimensions següents.',
        '',
        'PROJECTE ·',
        '- Nom · ' + (name || '(sense nom)'),
        '- Sector · ' + (sector || '(sense sector)'),
        '- Descripció · ' + (description || '(sense descripció)'),
        parentProjectName ? '- Depèn del projecte · ' + parentProjectName : '- Sense projecte mare',
        '',
        'TAXONOMIES TANCADES (escull EXACTAMENT un id de cada llista) ·',
        '',
        '1. project_type (12 valors possibles) ·',
        typeList,
        '',
        '2. lifecycle_stage (6 valors) ·',
        stageList,
        '',
        '3. scale (3 valors) ·',
        scaleList,
        '',
        '4. dependency_type (5 valors) ·',
        depList,
        '',
        'RESPON NOMÉS amb un objecte JSON estricte amb aquesta forma exacta ·',
        '{',
        '  "project_type":    "...",',
        '  "lifecycle_stage": "...",',
        '  "scale":           "...",',
        '  "dependency_type": "...",',
        '  "confidence":      0.0-1.0,',
        '  "rationale":       "1 frase breu per defensar la decisió"',
        '}',
        'Sense markdown · sense codeblock · sense text addicional · sols JSON.',
    ].join('\n');
}

// _extractJson · helper · treu el primer block JSON vàlid del text.
function _extractJson(text) {
    if (!text) return null;
    const trimmed = String(text).trim();
    // Treu fenced ```json ... ```
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    const candidate = fenced ? fenced[1] : trimmed;
    // Primer caràcter ha de ser { · busca primera { i última }
    const start = candidate.indexOf('{');
    const end   = candidate.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) return null;
    try { return JSON.parse(candidate.slice(start, end + 1)); } catch (_) { return null; }
}

// classifyByAi · async · retorna classificació o null si fail.
// Reutilitza runPrompt amb taskTier 'draft' (cost mínim).
export async function classifyByAi({
    name = '',
    description = '',
    sector = '',
    parentProjectName = null,
    projectId = null,
} = {}) {
    if (!description && !name) return null;
    const { runPrompt } = await import('./aiRouterService.js');
    const prompt = _buildClassifierPrompt({ name, description, sector, parentProjectName });
    let result;
    try {
        result = await runPrompt({
            prompt,
            taskKind:        'schema-fill-simple',
            taskTier:        'draft',
            systemPrompt:    'Ets un classificador de projectes cooperatius SOS · respons NOMÉS JSON estricte segons l\'esquema demanat.',
            maxOutputTokens: 400,
            temperature:     0.1,
            projectId,
        });
    } catch (e) {
        return { error: true, code: e?.code || 'ai-error', message: e?.message || 'unknown', source: 'ai' };
    }
    const text = result?.output || result?.text || result?.result;
    const parsed = _extractJson(text);
    if (!parsed) {
        return { error: true, code: 'parse-failed', rawText: text, source: 'ai' };
    }
    const out = {
        project_type:    String(parsed.project_type    || '').trim(),
        lifecycle_stage: String(parsed.lifecycle_stage || '').trim(),
        scale:           String(parsed.scale           || '').trim(),
        dependency_type: String(parsed.dependency_type || (parentProjectName ? 'subproject' : 'standalone')).trim(),
        confidence:      typeof parsed.confidence === 'number' ? parsed.confidence : 0.6,
        rationale:       String(parsed.rationale || '').slice(0, 400),
        source:          'ai',
        modelKey:        result?.modelKey || null,
        version:         CLASSIFIER_VERSION,
    };
    const v = validateClassification(out);
    if (!v.ok) {
        return { error: true, code: 'validation-failed', validationErrors: v.errors, raw: out, source: 'ai' };
    }
    return out;
}

// classifyProject · entrada principal · combina heurística + IA segons llindars
//
// args ·
//   name, description, sector, parentProjectName, projectId, preferAi:false
//
// Retorna · classificació final + flag `needsConfirmation` per UI
export async function classifyProject(input = {}) {
    const h = classifyByHeuristic(input);
    // Si la heurística és prou segura · curt-circuit
    if (h.confidence >= 0.85 && !input.preferAi) {
        return {
            ...h,
            needsConfirmation: false,
        };
    }
    // Si no · pregunta a la IA · si falla · cau a la heurística amb flag confirma
    const ai = await classifyByAi(input);
    if (ai && !ai.error) {
        return {
            ...ai,
            heuristicFallback: h,
            needsConfirmation: needsConfirmation(ai),
        };
    }
    // IA ha fallat · retorna heurística + força confirmació
    return {
        ...h,
        aiError: ai || null,
        needsConfirmation: true,
    };
}

// applyConfirmedClassification · pure · agafa el projecte i el patch
// confirmat per l'usuari · retorna el projecte amb aiClassification anclat.
export function applyConfirmedClassification(project, classification, { ts = null } = {}) {
    if (!project || typeof project !== 'object') return project;
    const now = (typeof ts === 'number') ? ts : Date.now();
    const v = validateClassification(classification);
    if (!v.ok) throw new Error('applyConfirmedClassification · invalid · ' + v.errors.join(' · '));
    return {
        ...project,
        aiClassification: {
            project_type:    classification.project_type,
            lifecycle_stage: classification.lifecycle_stage,
            scale:           classification.scale,
            dependency_type: classification.dependency_type,
            confidence:      classification.confidence,
            rationale:       classification.rationale || null,
            source:          classification.source || 'manual',
            modelKey:        classification.modelKey || null,
            classifiedAt:    now,
            version:         CLASSIFIER_VERSION,
        },
        updatedAt: now,
    };
}
