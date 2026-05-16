// =============================================================================
// TEAMTOWERS SOS V11 — LEARN ROLE CATALOG (A · sprint analysis & design)
// Ruta · /js/core/learnRoleCatalog.js
//
// Catàleg global de rols formatius (108 base + extensions sectorials + user
// contributions). Conceptualment separat del VNA d'un projecte concret · els
// rols catàleg són per "Aprendre" (formació · CoP · onboarding) i NO han
// d'inflar el `vna_roles` del mapa de valor d'un projecte real.
//
// Mode anàlisi & disseny · primera capa de la decisió presa amb l'usuari ·
//   "una cosa es tenirlos definits i un altre afegirho al mapa de valor".
//
// Tres nivells de visibilitat ·
//   - seed       · oficial SOS · derivat de SKILL_TAXONOMY · 108 entrades
//   - community  · proposat per usuaris · acceptat amb atestacions
//   - personal   · només visible per l'usuari que l'ha creat · pot promoure
//
// Persistència ·
//   - seed       · pura · derivada per codi (idempotent)
//   - extensions · pures · definides per sector (futur · ara empty)
//   - user       · localStorage (LS_KEY 'sos_learn_catalog_user_v1')
// =============================================================================

import { SKILL_TAXONOMY } from './skillTaxonomy.js';

export const LEARN_CATALOG_VERSION = 'v1.0';
export const TARGET_BASE_ROLES = 108;
export const LEARN_VISIBILITY = Object.freeze(['seed', 'community', 'personal']);

const LS_KEY = 'sos_learn_catalog_user_v1';

// _padRoleNumber · helper UI · '001' .. '108'
function _padRoleNumber(n) { return String(n).padStart(3, '0'); }

// _slugFromSkill · skill.id ja és slug · si calgués transformar · única font
function _slugForBaseRole(skill, indexZeroBased) {
    return 'learn-' + skill.id + (indexZeroBased >= SKILL_TAXONOMY.length ? '-pad' + (indexZeroBased - SKILL_TAXONOMY.length + 1) : '');
}

// buildBaseLearnCatalog · pure · retorna 108 nodes learn_role derivats de
// SKILL_TAXONOMY. Els primers `SKILL_TAXONOMY.length` rols (90) cobreixen
// 1 skill cadascun · els 18 restants són generalistes amb skill cyclada.
//
// args ·
//   ts · timestamp injectable (default Date.now)
//
// Retorna · [learn_role node, ...] · 108 entrades.
//
// Cada node té format ·
//   {
//     id:       'learn-role-{idx}',
//     type:     'learn_role',
//     content: {
//        slug, title, primarySkillId, primarySkillName, skillDomain, skillTier,
//        isPadding, visibility:'seed', source:'seed-v1.0',
//        cohortTier, learningPath, estHours,
//     },
//     keywords: ['type:learn_role', 'skill:{id}', 'visibility:seed', ...],
//     createdAt, updatedAt,
//   }
export function buildBaseLearnCatalog({ ts = null } = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    const out = [];
    for (let i = 0; i < TARGET_BASE_ROLES; i++) {
        const skill = SKILL_TAXONOMY[i % SKILL_TAXONOMY.length];
        const isPadding = i >= SKILL_TAXONOMY.length;
        const num = i + 1;
        const id = 'learn-role-' + _padRoleNumber(num);
        out.push({
            id,
            type:   'learn_role',
            content: {
                slug:             _slugForBaseRole(skill, i),
                title:            'Rol formatiu #' + num + (isPadding ? ' · generalista' : ' · ' + skill.label),
                primarySkillId:   skill.id,
                primarySkillName: skill.label,
                skillDomain:      skill.domain,
                skillTier:        skill.tier,
                isPadding,
                visibility:       'seed',
                source:           'seed-' + LEARN_CATALOG_VERSION,
                cohortTier:       skill.tier === 'master' ? 'advanced' : (skill.tier === 'practitioner' ? 'intermediate' : 'foundation'),
                learningPath:     'path-' + skill.domain,
                estHours:         skill.tier === 'master' ? 80 : (skill.tier === 'practitioner' ? 40 : 16),
                description:      skill.description || '',
                prerequisites:    isPadding ? [] : [skill.domain + '-intro'],
            },
            keywords: [
                'type:learn_role',
                'skill:' + skill.id,
                'domain:' + skill.domain,
                'tier:' + skill.tier,
                'visibility:seed',
                'catalog:base',
            ],
            createdAt: now,
            updatedAt: now,
        });
    }
    return out;
}

// ── Extensions sectorials · stub inicial · ready to grow ──────────────────
// Per a cada sector pot afegir-hi rols específics (no necessàriament 1:1 amb
// skills). Comencem amb agroecologia · habitatge · tech-coop com a exemples.
// Es regen com a nodes addicionals · visibility 'seed' · catalog 'sector-ext'.

export const SECTOR_EXTENSIONS = Object.freeze({
    'agroecologia': Object.freeze([
        Object.freeze({ slug: 'permacultor-regeneratiu',  title: 'Permacultor regeneratiu',  primarySkillId: 'sustainability-design', skillDomain: 'sustainability', skillTier: 'practitioner', estHours: 80,  description: 'Disseny de sistemes productius regeneratius · sòl, aigua, biodiversitat.' }),
        Object.freeze({ slug: 'coordinador-grup-consum',  title: 'Coordinador de grup de consum', primarySkillId: 'cooperative-ops', skillDomain: 'operations', skillTier: 'foundation', estHours: 24, description: 'Gestió logística d\'un grup de consum cooperatiu.' }),
    ]),
    'habitatge': Object.freeze([
        Object.freeze({ slug: 'gestor-cessio-us',         title: 'Gestor de cessió d\'ús',    primarySkillId: 'governance-design',     skillDomain: 'governance',   skillTier: 'practitioner', estHours: 60, description: 'Operació jurídica i operativa de cooperatives d\'habitatge en cessió d\'ús.' }),
    ]),
    'tech-coop': Object.freeze([
        Object.freeze({ slug: 'cooperative-cto',          title: 'CTO cooperatiu',            primarySkillId: 'system-architecture',   skillDomain: 'tech',         skillTier: 'master',       estHours: 120, description: 'Lidera tècnicament una coop tech sense jerarquia extractiva.' }),
    ]),
});

// buildSectorExtensions · pure · retorna learn_role nodes addicionals per
// al sector indicat. Si el sector no té extensions · array buit.
export function buildSectorExtensions(sectorId, { ts = null } = {}) {
    if (!sectorId || !SECTOR_EXTENSIONS[sectorId]) return [];
    const now = (typeof ts === 'number') ? ts : Date.now();
    return SECTOR_EXTENSIONS[sectorId].map((tmpl, idx) => ({
        id:   'learn-role-' + sectorId + '-' + _padRoleNumber(idx + 1),
        type: 'learn_role',
        content: {
            slug:             tmpl.slug,
            title:            tmpl.title,
            primarySkillId:   tmpl.primarySkillId,
            skillDomain:      tmpl.skillDomain,
            skillTier:        tmpl.skillTier,
            isPadding:        false,
            visibility:       'seed',
            source:           'sector-ext-' + LEARN_CATALOG_VERSION,
            cohortTier:       tmpl.skillTier === 'master' ? 'advanced' : (tmpl.skillTier === 'practitioner' ? 'intermediate' : 'foundation'),
            learningPath:     'sector-' + sectorId,
            estHours:         tmpl.estHours || 40,
            description:      tmpl.description || '',
            prerequisites:    [],
            sectorId,
        },
        keywords: [
            'type:learn_role',
            'skill:' + tmpl.primarySkillId,
            'domain:' + tmpl.skillDomain,
            'sector:' + sectorId,
            'visibility:seed',
            'catalog:sector-ext',
        ],
        createdAt: now,
        updatedAt: now,
    }));
}

// ── User contributions · localStorage CRUD ────────────────────────────────

function _loadUserContributions() {
    if (typeof localStorage === 'undefined') return [];
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (_) { return []; }
}

function _saveUserContributions(arr) {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.setItem(LS_KEY, JSON.stringify(arr || [])); } catch (_) {}
}

// listUserContributions · retorna còpia dels rols custom de l'usuari
export function listUserContributions() {
    return _loadUserContributions().slice();
}

// addUserContribution · afegeix nou rol custom · valida slug únic
export function addUserContribution(role, { ts = null } = {}) {
    if (!role || typeof role !== 'object') throw new Error('addUserContribution · role required');
    if (!role.title || !role.primarySkillId) throw new Error('addUserContribution · title + primarySkillId required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    const all = _loadUserContributions();
    const slug = (role.slug || 'user-' + Date.now().toString(36)).toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (all.find(r => r.content?.slug === slug)) {
        throw new Error('addUserContribution · slug ja existeix · ' + slug);
    }
    const node = {
        id:   'learn-role-user-' + Date.now().toString(36),
        type: 'learn_role',
        content: {
            slug,
            title:            String(role.title).slice(0, 200),
            primarySkillId:   String(role.primarySkillId),
            skillDomain:      role.skillDomain || 'general',
            skillTier:        role.skillTier || 'foundation',
            isPadding:        false,
            visibility:       role.visibility === 'community' ? 'community' : 'personal',
            source:           'user-contribution',
            cohortTier:       role.cohortTier || 'foundation',
            learningPath:     role.learningPath || 'user-custom',
            estHours:         typeof role.estHours === 'number' ? role.estHours : 40,
            description:      role.description || '',
            prerequisites:    Array.isArray(role.prerequisites) ? role.prerequisites.slice() : [],
            authorHandle:     role.authorHandle || null,
        },
        keywords: [
            'type:learn_role',
            'skill:' + role.primarySkillId,
            'visibility:' + (role.visibility === 'community' ? 'community' : 'personal'),
            'catalog:user',
        ],
        createdAt: now,
        updatedAt: now,
    };
    all.push(node);
    _saveUserContributions(all);
    return node;
}

// editUserContribution · patch del rol · només camps modificables · titol +
// description + estHours + tier + visibility (promote personal → community)
export function editUserContribution(roleId, patch = {}, { ts = null } = {}) {
    if (!roleId) throw new Error('editUserContribution · roleId required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    const all = _loadUserContributions();
    const idx = all.findIndex(r => r.id === roleId);
    if (idx === -1) throw new Error('editUserContribution · roleId no trobat · ' + roleId);
    const orig = all[idx];
    const updated = {
        ...orig,
        content: {
            ...orig.content,
            ...('title'       in patch ? { title:       String(patch.title).slice(0, 200) } : {}),
            ...('description' in patch ? { description: String(patch.description || '') } : {}),
            ...('estHours'    in patch && typeof patch.estHours === 'number' ? { estHours: patch.estHours } : {}),
            ...('skillTier'   in patch ? { skillTier:  patch.skillTier } : {}),
            ...('visibility'  in patch && LEARN_VISIBILITY.includes(patch.visibility) ? { visibility: patch.visibility } : {}),
            ...('learningPath' in patch ? { learningPath: patch.learningPath } : {}),
        },
        updatedAt: now,
    };
    all[idx] = updated;
    _saveUserContributions(all);
    return updated;
}

// removeUserContribution · esborra un rol custom · només si és personal
// (els community no els pot esborrar l'usuari · necessiten revocació explícita)
export function removeUserContribution(roleId) {
    if (!roleId) return false;
    const all = _loadUserContributions();
    const idx = all.findIndex(r => r.id === roleId);
    if (idx === -1) return false;
    if (all[idx].content?.visibility !== 'personal') return false;
    all.splice(idx, 1);
    _saveUserContributions(all);
    return true;
}

// ── Vista agregada ─────────────────────────────────────────────────────────

// getMergedCatalog · pure-ish · combina base + sector extensions + user
// contributions visibles · filtres opcionals.
//
// args ·
//   sectorId               · filtra extensions per sector (opcional)
//   includeUserPersonal    · default true · inclou rols personals
//   includeUserCommunity   · default true · inclou rols community
//   visibilityFilter       · null / 'seed' / 'community' / 'personal' (només una)
//
// NOTA · el base catalog es regenera amb el `ts` actual cada vegada · per
// això no caché · el caller pot caché si vol.
export function getMergedCatalog({
    sectorId = null,
    includeUserPersonal = true,
    includeUserCommunity = true,
    visibilityFilter = null,
    ts = null,
} = {}) {
    const base = buildBaseLearnCatalog({ ts });
    const sector = sectorId ? buildSectorExtensions(sectorId, { ts }) : [];
    const userAll = _loadUserContributions();
    const user = userAll.filter(r => {
        const v = r.content?.visibility;
        if (v === 'personal'  && !includeUserPersonal)  return false;
        if (v === 'community' && !includeUserCommunity) return false;
        return true;
    });
    let combined = [...base, ...sector, ...user];
    if (visibilityFilter && LEARN_VISIBILITY.includes(visibilityFilter)) {
        combined = combined.filter(r => r.content?.visibility === visibilityFilter);
    }
    return combined;
}

// findLearnRoleBySkill · pure · busca rols (base + sector + user) que
// tenen primarySkillId == skillId. Útil per al hub `/learn` o per a un
// projecte que vol enllaçar un vna_role amb formació.
export function findLearnRoleBySkill(skillId, opts = {}) {
    if (!skillId) return [];
    return getMergedCatalog(opts).filter(r => r.content?.primarySkillId === skillId);
}

// ── KB-coupled · idempotent seeding · helper opcional ──────────────────────

// ensureBaseCatalogSeeded · injecta el catàleg base al KB si no hi és.
// La funció és async · accepta { kb } amb mètodes getNode/upsert/query.
// Idempotent · només upserta els que falten.
//
// Retorna · { seeded:int, alreadyPresent:int, total:int }
export async function ensureBaseCatalogSeeded({ kb, ts = null } = {}) {
    if (!kb || typeof kb.upsert !== 'function') {
        throw new Error('ensureBaseCatalogSeeded · kb amb upsert required');
    }
    const base = buildBaseLearnCatalog({ ts });
    let seeded = 0, alreadyPresent = 0;
    for (const node of base) {
        let exists = false;
        if (typeof kb.getNode === 'function') {
            try {
                const existing = await kb.getNode(node.id);
                if (existing && existing.type === 'learn_role') exists = true;
            } catch (_) {}
        }
        if (exists) { alreadyPresent++; continue; }
        await kb.upsert(node);
        seeded++;
    }
    return { seeded, alreadyPresent, total: base.length };
}

// _resetUserContributions · sols per a tests
export function _resetUserContributions() {
    if (typeof localStorage !== 'undefined') {
        try { localStorage.removeItem(LS_KEY); } catch (_) {}
    }
}
