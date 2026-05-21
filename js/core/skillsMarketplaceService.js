// =============================================================================
// TEAMTOWERS SOS V11 — SKILLS MARKETPLACE SERVICE (v131c)
// Ruta · /js/core/skillsMarketplaceService.js
//
// Pont entre · sectorAgentLoader (skill_levels per role per sector · v131b/c) ·
// /skills view (catàleg complet) · WO assignment (assignar tasques basant-se
// en match de skills + nivell).
//
// API ·
//   listSkillsForSector(sectorId)              → array de skills agregats del sector
//   listSkillsForRole(sectorId, roleId)        → skills concrets del rol amb levels
//   matchCandidatesToWO(wo, candidates[])      → score 0-100 per cada candidate
//   skillsTaxonomySummary()                    → resum agregat tots sectors per UI catàleg
//
// Filosofia · KISS · pure functions · zero dependències · safe en Node test env.
// Levels canonical · 'junior' · 'mid' · 'senior' · 'principal' (4 nivells).
// =============================================================================

import { loadSectorAgent, listSectorAgents, CANONICAL_SECTOR_IDS } from './sectorAgentLoader.js';

export const SKILLS_MARKETPLACE_VERSION = 'v131c';

export const SKILL_LEVELS = Object.freeze(['junior', 'mid', 'senior', 'principal']);
export const SKILL_LEVEL_RANK = Object.freeze({ junior: 1, mid: 2, senior: 3, principal: 4 });

// listSkillsForRole · pure · retorna skills d'un rol específic d'un sector
// Output · array d'objectes { level, skills[] } o [] si no skill_levels declarat
export function listSkillsForRole(sectorAgent, roleId) {
    if (!sectorAgent || !Array.isArray(sectorAgent.roles)) return [];
    const role = sectorAgent.roles.find(r => r.id === roleId);
    if (!role || !role.skill_levels) return [];
    const out = [];
    for (const lvl of SKILL_LEVELS) {
        const entry = role.skill_levels[lvl];
        if (entry && Array.isArray(entry.skills) && entry.skills.length) {
            out.push({ level: lvl, skills: entry.skills });
        } else if (Array.isArray(entry) && entry.length) {
            // fallback · alguns sectors usen skill_levels.junior: ["skill1", "skill2"]
            out.push({ level: lvl, skills: entry });
        }
    }
    return out;
}

// listSkillsForSector · async · agrega totes les skills úniques d'un sector
// Útil per a UI catàleg · "quines capacitats es necessiten en sector M?"
export async function listSkillsForSector(sectorId) {
    const agent = await loadSectorAgent(sectorId);
    if (!agent) return [];
    const skillsMap = new Map();   // skill → { level: lvl, roles: [roleId] }
    for (const role of (agent.roles || [])) {
        if (!role.skill_levels) continue;
        for (const lvl of SKILL_LEVELS) {
            let skills = role.skill_levels[lvl];
            if (!skills) continue;
            if (skills && Array.isArray(skills.skills)) skills = skills.skills;
            if (!Array.isArray(skills)) continue;
            for (const sk of skills) {
                const key = String(sk).toLowerCase();
                if (!skillsMap.has(key)) {
                    skillsMap.set(key, { skill: sk, level: lvl, roles: [role.id] });
                } else {
                    const existing = skillsMap.get(key);
                    if (!existing.roles.includes(role.id)) existing.roles.push(role.id);
                    // Update level if encountered with lower seniority (skill seen earlier)
                    if (SKILL_LEVEL_RANK[lvl] < SKILL_LEVEL_RANK[existing.level]) {
                        existing.level = lvl;
                    }
                }
            }
        }
    }
    return Array.from(skillsMap.values()).sort((a, b) => {
        const r = SKILL_LEVEL_RANK[a.level] - SKILL_LEVEL_RANK[b.level];
        if (r !== 0) return r;
        return a.skill.localeCompare(b.skill);
    });
}

// matchCandidatesToWO · pure · score 0-100 per cada candidate vs WO
// wo · { required_skills[], required_level, role_kind }
// candidates · [{ id, name, skills[], experience_years, level }]
// Retorna · array ordenat DESC per score amb explicació per candidate
export function matchCandidatesToWO({ wo, candidates }) {
    if (!wo || !Array.isArray(candidates) || !candidates.length) return [];
    const required = new Set((wo.required_skills || []).map(s => String(s).toLowerCase()));
    const requiredLevel = wo.required_level || 'mid';
    const requiredRank = SKILL_LEVEL_RANK[requiredLevel] || 2;

    return candidates.map(cand => {
        const candSkills = new Set((cand.skills || []).map(s => String(s).toLowerCase()));
        const overlap = [...required].filter(r => candSkills.has(r));
        const skillCoverage = required.size > 0 ? (overlap.length / required.size) : 0;
        const levelRank = SKILL_LEVEL_RANK[cand.level] || 1;
        const levelMatch = levelRank >= requiredRank ? 1 : Math.max(0, levelRank / requiredRank);
        const score = Math.round((skillCoverage * 0.7 + levelMatch * 0.3) * 100);
        return {
            id: cand.id, name: cand.name,
            score,
            skillCoverage: Number(skillCoverage.toFixed(2)),
            levelMatch: Number(levelMatch.toFixed(2)),
            overlap,
            missing: [...required].filter(r => !candSkills.has(r)),
        };
    }).sort((a, b) => b.score - a.score);
}

// skillsTaxonomySummary · async · per a UI catàleg agregat
// Recorre TOTS els sectors i agrega · útil per a /skills view marketplace
export async function skillsTaxonomySummary() {
    const agents = await listSectorAgents();
    let totalRolesWithSkills = 0;
    let totalSkillEntries = 0;
    const bySector = {};
    const skillToSectors = new Map();   // skill → Set(sectorId)
    for (const a of agents) {
        const sectorSkills = [];
        for (const role of (a.roles || [])) {
            if (!role.skill_levels) continue;
            totalRolesWithSkills++;
            for (const lvl of SKILL_LEVELS) {
                let skills = role.skill_levels[lvl];
                if (skills && Array.isArray(skills.skills)) skills = skills.skills;
                if (!Array.isArray(skills)) continue;
                for (const sk of skills) {
                    totalSkillEntries++;
                    sectorSkills.push(sk);
                    const key = String(sk).toLowerCase();
                    if (!skillToSectors.has(key)) skillToSectors.set(key, new Set());
                    skillToSectors.get(key).add(a.sectorId);
                }
            }
        }
        bySector[a.sectorId] = {
            sectorName: a.frontmatter.sector_name,
            totalSkills: sectorSkills.length,
            uniqueSkills: new Set(sectorSkills.map(s => s.toLowerCase())).size,
        };
    }
    // Top cross-sector skills (skills shared by ≥2 sectors)
    const crossSector = Array.from(skillToSectors.entries())
        .filter(([, set]) => set.size >= 2)
        .map(([skill, set]) => ({ skill, sectorCount: set.size, sectors: [...set] }))
        .sort((a, b) => b.sectorCount - a.sectorCount)
        .slice(0, 30);

    return {
        totalSectors: agents.length,
        sectorsWithSkillLevels: Object.values(bySector).filter(s => s.totalSkills > 0).length,
        totalRolesWithSkills,
        totalSkillEntries,
        uniqueSkillsAcrossAllSectors: skillToSectors.size,
        bySector,
        topCrossSectorSkills: crossSector,
    };
}

// recommendLevelForExperience · pure · ajuda UI a suggerir level
export function recommendLevelForExperience(years) {
    const n = Number(years) || 0;
    if (n < 3)  return 'junior';
    if (n < 6)  return 'mid';
    if (n < 11) return 'senior';
    return 'principal';
}
