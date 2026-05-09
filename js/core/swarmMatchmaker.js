// TEAMTOWERS SOS V11 — SWARM MATCHMAKER (MAT-003 sprint C)
//
// Asigna plazas humanas del enjambre Cohort 0 a roles necesarios para
// bootstrappear un proyecto cliente · usando LLM con catálogo de los
// 12 guardianes Pantheon Work + 90 skills + 12 project types.
//
// Output canónico:
//   {
//     matches: [
//       { roleId, seatId, primary: bool, fit: 0..1, rationale, skillsUsed[] },
//     ],
//     coverage: { coveredRoles, totalRoles, pct },
//     gaps:     [roleId, ...],         // roles sin asignación posible
//     overallRationale: '...',         // justificación global del LLM
//     telemetry: { provider, tokens, latencyMs, costUSD },
//   }
//
// Helpers puros · testeables sin LLM:
//   buildSwarmMatchPrompt(input) · construye system+user prompt
//   parseSwarmMatchResponse(jsonStr|obj) · valida + normaliza
//   applyMatchToSeats(matches, seats) · resuelve conflictos primario
//   scoreSwarmCoverage(matches, requiredRoles)
//
// Función principal async · `buildSwarmTeamForProject`.

import {
    PANTHEON_GUARDIANS,
    getGuardianById,
    PROJECT_TYPES,
    getProjectTypeById,
} from './critical108Roles.js';
import {
    SKILL_TAXONOMY,
    getSkillById,
    skillsByDomain,
} from './skillTaxonomy.js';

// ── Prompt builder · puro ────────────────────────────────────────────

const SYSTEM_HEADER = [
    'Eres el matchmaker del enjambre Cohort 0 de Matriu Incoopadora.',
    'Tu trabajo · asignar plazas humanas a roles necesarios para',
    'bootstrappear el proyecto cliente que se te pasa, según la matriz',
    'inicial multidisciplinar (96 plazas operativas + 12 guardianes',
    'Pantheon Work) y las skills declaradas por cada plaza.',
    '',
    'Reglas estrictas:',
    '- 1 plaza ejecuta 1 rol PRIMARIO + 0-2 roles SECUNDARIOS si demuestra skills.',
    '- Prioriza fit (skill match + guardian affinity + tier adecuado) > velocidad.',
    '- Si ningún seat cubre bien un rol, márcalo como GAP en el array `gaps`.',
    '- Cada rol crítico necesita ≥1 plaza primaria asignada.',
    '- Output JSON ESTRICTO según schema · sin texto fuera del JSON.',
].join('\n');

function compactGuardian(g) {
    return {
        id:        g.id,
        name:      g.name,
        domain:    g.domain,
        trivalent: g.trivalentLogic,
        keywords:  g.keywords || [],
    };
}

function compactSkill(s) {
    return {
        id:       s.id,
        domain:   s.domain,
        tier:     s.tier,
        guardian: s.guardianAffinity || [],
    };
}

function compactProjectType(pt) {
    return {
        id:                  pt.id,
        label:               pt.label,
        whyNow:              pt.whyNow,
    };
}

// `input` · {
//     project:        { id, name, description, sector?, phase? },
//     projectTypeId:  uno de los 12 PROJECT_TYPES,
//     requiredRoles:  [{ id, label, domain, criticality?, sopsBootstrap? }, ...],
//     swarmSeats:     [{ id, displayName, skillsDeclared[], guardianOf?, availability? }, ...],
//     options?:       { maxSecondaryRoles?, includeAllGuardians?, language? }
// }
export function buildSwarmMatchPrompt(input) {
    if (!input || typeof input !== 'object') {
        throw new Error('buildSwarmMatchPrompt requires { project, projectTypeId, requiredRoles, swarmSeats }');
    }
    const project = input.project || {};
    if (!project.id || !project.name) {
        throw new Error('buildSwarmMatchPrompt requires project.id + project.name');
    }
    const projectType = getProjectTypeById(input.projectTypeId);
    if (!projectType) {
        throw new Error('buildSwarmMatchPrompt · projectTypeId desconocido: ' + input.projectTypeId);
    }
    const requiredRoles = Array.isArray(input.requiredRoles) ? input.requiredRoles : [];
    if (requiredRoles.length === 0) {
        throw new Error('buildSwarmMatchPrompt requires ≥1 requiredRoles');
    }
    const swarmSeats = Array.isArray(input.swarmSeats) ? input.swarmSeats : [];
    if (swarmSeats.length === 0) {
        throw new Error('buildSwarmMatchPrompt requires ≥1 swarmSeats');
    }
    const opts = input.options || {};
    const maxSecondary = Number.isInteger(opts.maxSecondaryRoles) ? opts.maxSecondaryRoles : 2;
    const lang = opts.language || 'ca';

    const userPayload = {
        project: {
            id:          project.id,
            name:        project.name,
            description: project.description || '',
            sector:      project.sector || null,
            phase:       project.phase || null,
            type:        compactProjectType(projectType),
        },
        catalog: {
            guardians:     PANTHEON_GUARDIANS.map(compactGuardian),
            skills:        SKILL_TAXONOMY.map(compactSkill),
            allProjectTypes: PROJECT_TYPES.map(compactProjectType),
        },
        requiredRoles: requiredRoles.map(r => ({
            id:           r.id,
            label:        r.label || r.id,
            domain:       r.domain,
            criticality:  r.criticality || 'normal',
            sopsBootstrap:r.sopsBootstrap || [],
        })),
        swarmSeats: swarmSeats.map(s => ({
            id:              s.id,
            displayName:     s.displayName || s.id,
            skillsDeclared:  Array.isArray(s.skillsDeclared) ? s.skillsDeclared : [],
            guardianOf:      s.guardianOf || null,
            availability:    s.availability || 'normal',
        })),
        constraints: {
            maxSecondaryRolesPerSeat: maxSecondary,
            requirePrimaryPerRole:    true,
            language:                 lang,
        },
        outputSchema: {
            matches: [
                {
                    roleId:    'string',
                    seatId:    'string',
                    primary:   'bool',
                    fit:       'number 0..1',
                    rationale: 'string ≤140 chars',
                    skillsUsed:['skillId',  '...'],
                },
            ],
            gaps:             ['roleId', '...'],
            overallRationale: 'string ≤300 chars · justificación global del matching',
        },
    };

    const userPrompt = [
        '## Proyecto cliente',
        JSON.stringify(userPayload.project, null, 2),
        '',
        '## Catálogo (resumido)',
        '12 guardianes Pantheon Work · 90 skills · 12 project types.',
        JSON.stringify(userPayload.catalog, null, 2),
        '',
        '## Roles requeridos para bootstrappear este proyecto',
        JSON.stringify(userPayload.requiredRoles, null, 2),
        '',
        '## Plazas disponibles del enjambre',
        JSON.stringify(userPayload.swarmSeats, null, 2),
        '',
        '## Restricciones',
        JSON.stringify(userPayload.constraints, null, 2),
        '',
        '## Output schema (JSON estricto)',
        JSON.stringify(userPayload.outputSchema, null, 2),
        '',
        'Responde SOLO con el JSON válido según el schema. Sin markdown, sin texto explicativo fuera del JSON.',
    ].join('\n');

    return {
        systemPrompt: SYSTEM_HEADER,
        userPrompt,
        responseFormat: 'json_object',
        temperature: 0.2,
        meta: {
            projectId:     project.id,
            projectTypeId: projectType.id,
            seatsCount:    swarmSeats.length,
            rolesCount:    requiredRoles.length,
        },
    };
}

// ── Parser · puro ────────────────────────────────────────────────────

function clamp01(n) {
    if (typeof n !== 'number' || !isFinite(n)) return 0;
    return Math.max(0, Math.min(1, n));
}

export function parseSwarmMatchResponse(input) {
    let parsed = input;
    if (typeof input === 'string') {
        try { parsed = JSON.parse(input); } catch (e) {
            throw new Error('parseSwarmMatchResponse · JSON parse error: ' + e.message);
        }
    }
    if (!parsed || typeof parsed !== 'object') {
        throw new Error('parseSwarmMatchResponse · output must be object or JSON string');
    }
    const rawMatches = Array.isArray(parsed.matches) ? parsed.matches : [];
    const matches = rawMatches
        .filter(m => m && typeof m.roleId === 'string' && typeof m.seatId === 'string')
        .map(m => ({
            roleId:    String(m.roleId),
            seatId:    String(m.seatId),
            primary:   m.primary === true,
            fit:       clamp01(typeof m.fit === 'number' ? m.fit : 0),
            rationale: typeof m.rationale === 'string' ? m.rationale.slice(0, 240) : '',
            skillsUsed:Array.isArray(m.skillsUsed) ? m.skillsUsed.filter(s => typeof s === 'string') : [],
        }));
    const gaps = Array.isArray(parsed.gaps)
        ? parsed.gaps.filter(g => typeof g === 'string')
        : [];
    const overallRationale = typeof parsed.overallRationale === 'string'
        ? parsed.overallRationale.slice(0, 600)
        : '';
    return { matches, gaps, overallRationale };
}

// ── Applier · resuelve conflictos primario ──────────────────────────
//
// Regla · cada plaza puede tener máximo 1 rol PRIMARIO. Si el LLM
// devuelve 2 primarios sobre la misma plaza, conserva el de fit más
// alto y degrada los otros a secundario. Si una plaza queda con >2
// secundarios, conserva los 2 mejores fit.

export function applyMatchToSeats(matches, options = {}) {
    if (!Array.isArray(matches)) return [];
    const maxSecondary = Number.isInteger(options.maxSecondaryRoles) ? options.maxSecondaryRoles : 2;

    // 1) Ordenar todos los matches por fit desc para tener prioridad
    const sorted = matches.slice().sort((a, b) => (b.fit || 0) - (a.fit || 0));

    const seenPrimaryBySeat = new Map();      // seatId → roleId primario asignado
    const secondaryCountBySeat = new Map();   // seatId → count secundarios
    const result = [];

    for (const m of sorted) {
        const seatId = m.seatId;
        if (m.primary === true) {
            if (!seenPrimaryBySeat.has(seatId)) {
                seenPrimaryBySeat.set(seatId, m.roleId);
                result.push({ ...m, primary: true });
            } else {
                // ya tiene primario · degradar a secundario respetando límite
                const cnt = secondaryCountBySeat.get(seatId) || 0;
                if (cnt < maxSecondary) {
                    secondaryCountBySeat.set(seatId, cnt + 1);
                    result.push({ ...m, primary: false });
                }
                // else · descartar (excede límite)
            }
        } else {
            const cnt = secondaryCountBySeat.get(seatId) || 0;
            if (cnt < maxSecondary) {
                secondaryCountBySeat.set(seatId, cnt + 1);
                result.push({ ...m, primary: false });
            }
        }
    }

    return result;
}

// ── Scorer · coverage del proyecto ──────────────────────────────────

export function scoreSwarmCoverage(matches, requiredRoles) {
    const totalRoles = Array.isArray(requiredRoles) ? requiredRoles.length : 0;
    if (totalRoles === 0) return { coveredRoles: 0, totalRoles: 0, pct: 0, byRole: {} };

    const byRole = {};
    for (const r of requiredRoles) {
        byRole[r.id] = { primary: 0, secondary: 0, fitMax: 0 };
    }
    for (const m of (Array.isArray(matches) ? matches : [])) {
        if (!byRole[m.roleId]) continue;
        if (m.primary) byRole[m.roleId].primary += 1;
        else           byRole[m.roleId].secondary += 1;
        if (m.fit > byRole[m.roleId].fitMax) byRole[m.roleId].fitMax = m.fit;
    }
    const coveredRoles = Object.values(byRole).filter(v => v.primary >= 1).length;
    const pct = Math.round((coveredRoles / totalRoles) * 100);
    return { coveredRoles, totalRoles, pct, byRole };
}

// ── Función principal async ─────────────────────────────────────────

export async function buildSwarmTeamForProject({
    project,
    projectTypeId,
    requiredRoles,
    swarmSeats,
    options = {},
    orchestrator = null,
    preferredEngine = null,
} = {}) {
    if (!orchestrator || typeof orchestrator.callLLM !== 'function') {
        throw new Error('buildSwarmTeamForProject requires { orchestrator } with callLLM');
    }
    const built = buildSwarmMatchPrompt({ project, projectTypeId, requiredRoles, swarmSeats, options });
    const t0 = Date.now();
    const llmRes = await orchestrator.callLLM({
        preferredEngine: preferredEngine || undefined,
        systemPrompt:   built.systemPrompt,
        userPrompt:     built.userPrompt,
        responseFormat: built.responseFormat,
        temperature:    built.temperature,
    });
    const latencyMs = Date.now() - t0;

    const parsed = parseSwarmMatchResponse(llmRes?.text || llmRes?.response || llmRes || '{}');
    const reconciled = applyMatchToSeats(parsed.matches, options);
    const coverage = scoreSwarmCoverage(reconciled, requiredRoles);

    return {
        matches:          reconciled,
        coverage,
        gaps:             parsed.gaps,
        overallRationale: parsed.overallRationale,
        telemetry: {
            provider:    llmRes?.provider || preferredEngine || 'unknown',
            tokens:      llmRes?.usage || null,
            latencyMs,
            costUSD:     llmRes?.costUSD ?? null,
        },
        promptMeta: built.meta,
    };
}
