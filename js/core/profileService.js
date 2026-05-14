// =============================================================================
// TEAMTOWERS SOS V11 — PROFILE SERVICE (PROFILE sprint A)
// Ruta · /js/core/profileService.js
//
// Construeix un perfil públic agregat per a un handle/DID a partir de:
//   - matriu_member  · identitat base (displayName · bio · avatar · skills
//                      declarats · sectors experience · cohort · wallets)
//   - projects       · creats per aquest handle (creatorHandle match)
//   - roles          · al·locats a aquest handle (createdBy · primarySkillId)
//   - attestations   · rebudes (attestedDid match) + emeses (attesterDid match)
//   - market entries · com a provider (providerHandle / createdBy match)
//   - sops           · creats per aquest handle (createdBy match)
//   - skills derivades de SKILL_TAXONOMY · enriquides amb label + domain + tier
//
// Pure · zero KB · zero DOM. ProfileView consum aquesta API.
// =============================================================================

import { computeRecursiveTrustScores, computeTrustScore } from './trustScoreService.js';
import { getSkillById, SKILL_TAXONOMY } from './skillTaxonomy.js';
import { fromMarketItem, fromWorkshop, fromSop } from './marketCatalogService.js';

// normalizeHandle · helper · treu @ prefix · lowercase
export function normalizeHandle(handle) {
    if (typeof handle !== 'string') return '';
    return handle.trim().replace(/^@/, '').toLowerCase();
}

// matchesHandle · pure · comparació flexible (case-insensitive · prefix @)
export function matchesHandle(a, b) {
    return normalizeHandle(a) === normalizeHandle(b) && normalizeHandle(a) !== '';
}

// findMember · pure · busca matriu_member per handle dins el llistat
export function findMember(members, handle) {
    const h = normalizeHandle(handle);
    if (!h) return null;
    return (members || []).find(m => matchesHandle(m?.content?.handle, h)) || null;
}

// enrichSkill · pure · combina skillId amb metadata SKILL_TAXONOMY
function enrichSkill(skillId) {
    const meta = getSkillById(skillId);
    if (!meta) return { id: skillId, label: skillId, domain: 'unknown', tier: 'foundation' };
    return { id: meta.id, label: meta.label, domain: meta.domain, tier: meta.tier };
}

// buildPublicProfile · pure · agrega totes les fonts en un sol perfil.
//
// args ·
//   handle              · '@alvaro' o 'alvaro' (case-insensitive)
//   members             · [matriu_member nodes]
//   projects            · [project nodes]
//   roles               · [role nodes] (per skill assignments)
//   attestations        · [attestation nodes]
//   marketItems         · [market_item nodes]
//   workshops           · [workshop nodes]
//   sops                · [sop nodes]
//   includeOfferings    · bool · default true · aggregate market entries
//
// Retorna · {
//   handle, displayName, bio, avatar, did, cohortNumber, availability, status,
//   skills        · [{ id, label, domain, tier, source: 'declared'|'role' }]
//   sectorsExperience: [...],
//   projects      · [{ id, name, role: 'creator' }]
//   roles         · [{ id, label, primarySkillId, projectId }]
//   attestationsReceived · [...attestation nodes]
//   attestationsSent     · [...attestation nodes]
//   trustScore    · { total, uniqueAttesters, band, color, icon, recursive }
//   offerings     · [CatalogEntry...]
//   stats         · { skills, projects, offerings, attestations }
//   exists        · bool · true si member trobat
// }
export function buildPublicProfile({
    handle              = null,
    members             = [],
    projects            = [],
    roles               = [],
    attestations        = [],
    marketItems         = [],
    workshops           = [],
    sops                = [],
    includeOfferings    = true,
} = {}) {
    const h = normalizeHandle(handle);
    const member = findMember(members, h);

    // Identitat base
    const c = member?.content || {};
    const displayName = c.displayName || ('@' + (h || 'unknown'));
    const did = c.primaryDid || null;

    // Skills declarats al member + skills derivats de roles assignats
    const skillSet = new Map();   // skillId → { source, ...meta }
    for (const sid of (c.skillsDeclared || [])) {
        skillSet.set(sid, { ...enrichSkill(sid), source: 'declared' });
    }

    // Roles · createdBy/creatorHandle match · contribueix primarySkillId
    const myRoles = (roles || []).filter(r => {
        const rc = r?.content || {};
        return matchesHandle(rc.createdBy, h) || matchesHandle(rc.creatorHandle, h) || matchesHandle(rc.handle, h);
    });
    for (const r of myRoles) {
        const sid = r.content?.primarySkillId;
        if (sid && !skillSet.has(sid)) {
            skillSet.set(sid, { ...enrichSkill(sid), source: 'role' });
        }
    }

    // Projects · creatorHandle match
    const myProjects = (projects || []).filter(p => {
        return matchesHandle(p?.creatorHandle, h) || matchesHandle(p?.createdBy, h) || matchesHandle(p?.content?.creatorHandle, h);
    }).map(p => ({
        id: p.id,
        name: p.nombre || p.name || p.id,
        role: 'creator',
        sectorId: p.sector_id || p.sectorId || null,
        cohortNumber: p.cohortNumber || null,
        updatedAt: p.updatedAt || 0,
    }));

    // Attestations rebudes · attestedDid match (o attestedId si és member.id)
    const attReceived = (attestations || []).filter(a => {
        const ac = a?.content || {};
        // attestedDid coincideix amb did · o attestedHandle amb handle · o attestedId amb member.id
        return (did && ac.attestedDid === did)
            || matchesHandle(ac.attestedHandle, h)
            || (member?.id && ac.attestedId === member.id);
    });

    // Attestations emeses
    const attSent = (attestations || []).filter(a => {
        const ac = a?.content || {};
        return (did && ac.attesterDid === did) || matchesHandle(ac.attesterHandle, h);
    });

    // Trust score recursive · sobre TOT el grafo (per pesos correctes) ·
    // després agreguem sols les attestations rebudes per a aquest handle
    let trustScore = { total: 0, uniqueAttesters: 0, band: 'none', color: '#94a3b8', icon: '·', recursive: false };
    if (attReceived.length > 0) {
        const recursive = computeRecursiveTrustScores({ attestations: attestations || [] });
        trustScore = computeTrustScore({
            attestations:    attReceived,
            attesterWeights: recursive.scores,
        });
    }

    // Offerings · market entries on aquesta persona és el provider
    let offerings = [];
    if (includeOfferings) {
        const matchProvider = (entry) => {
            if (!entry) return false;
            const ph = entry.providerHandle;
            return matchesHandle(ph, h);
        };
        for (const item of marketItems || []) {
            const e = fromMarketItem(item);
            if (e && matchProvider(e)) offerings.push(e);
        }
        for (const w of workshops || []) {
            const e = fromWorkshop(w);
            if (e && matchProvider(e)) offerings.push(e);
        }
        for (const s of sops || []) {
            const e = fromSop(s);
            if (e && matchProvider(e)) offerings.push(e);
        }
        offerings.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }

    // Aggregate skills array (sort by tier · master first)
    const TIER_ORDER = { master: 3, practitioner: 2, foundation: 1 };
    const skills = Array.from(skillSet.values()).sort((a, b) => (TIER_ORDER[b.tier] || 0) - (TIER_ORDER[a.tier] || 0));

    return {
        handle:           h,
        displayName,
        bio:              c.bio || '',
        avatar:           c.avatar || null,
        did,
        cohortNumber:     c.cohortNumber || 0,
        availability:     c.availability || 'normal',
        status:           c.status || 'active',
        publicJwk:        c.publicJwk || null,
        wallets:          c.wallets || [],
        skills,
        sectorsExperience: c.sectorsExperience || [],
        projects:         myProjects,
        roles:            myRoles.map(r => ({
            id: r.id,
            label: r.content?.label || r.id,
            primarySkillId: r.content?.primarySkillId || null,
            projectId: r.content?.projectId || null,
        })),
        attestationsReceived: attReceived,
        attestationsSent:     attSent,
        trustScore,
        offerings,
        stats: {
            skills:        skills.length,
            projects:      myProjects.length,
            roles:         myRoles.length,
            offerings:     offerings.length,
            attestationsReceived: attReceived.length,
            attestationsSent:     attSent.length,
        },
        exists:           member !== null,
        memberNodeId:     member?.id || null,
    };
}

// computeProfileBadges · pure · derive badges de logros del perfil
// Retorna · [{ id, label, icon, color, description }]
export function computeProfileBadges(profile) {
    const badges = [];
    if (!profile) return badges;

    // Cohort 0 founder badge
    if (profile.cohortNumber === 0) {
        badges.push({ id: 'cohort-0', label: 'Cohort 0', icon: '🌟', color: '#facc15', description: 'Cohort fundacional · 108 places' });
    }

    // Skills tier · n master skills
    const masters = profile.skills.filter(s => s.tier === 'master').length;
    if (masters >= 1) {
        badges.push({ id: 'master-' + masters, label: masters + 'x Master', icon: '🏆', color: '#a855f7', description: masters + ' skills tier master' });
    }

    // Multiple projects · founder/creator
    if (profile.projects.length >= 3) {
        badges.push({ id: 'multi-project', label: 'Multi-project', icon: '🏗', color: '#22c55e', description: profile.projects.length + ' projectes creats' });
    } else if (profile.projects.length >= 1) {
        badges.push({ id: 'founder', label: 'Founder', icon: '🏗', color: '#3b82f6', description: profile.projects.length + ' projecte/s creat/s' });
    }

    // Trust score
    if (profile.trustScore?.total >= 5) {
        badges.push({ id: 'trusted', label: 'Trusted', icon: '🤝', color: '#22c55e', description: 'Trust score ≥5 · ' + profile.trustScore.uniqueAttesters + ' attesters' });
    }

    // Offerings al market
    if (profile.offerings.length >= 1) {
        badges.push({ id: 'provider', label: 'Market Provider', icon: '🛒', color: '#fb923c', description: profile.offerings.length + ' ofertes al market' });
    }

    // Active attester
    if (profile.attestationsSent.length >= 3) {
        badges.push({ id: 'attester', label: 'Active Attester', icon: '✍️', color: '#6366f1', description: profile.attestationsSent.length + ' attestations emeses' });
    }

    return badges;
}

// shareUrlForProfile · pure · /u/{handle}
export function shareUrlForProfile(profile, { absoluteUrl = '' } = {}) {
    if (!profile || !profile.handle) return null;
    return (absoluteUrl || '') + '/u/' + encodeURIComponent(profile.handle);
}

// listKnownHandles · pure · retorna handles únics observats al sistema
// (per autocomplete · cerques)
export function listKnownHandles({ members = [], projects = [], attestations = [] } = {}) {
    const handles = new Set();
    for (const m of members || []) {
        const h = m?.content?.handle;
        if (h) handles.add(normalizeHandle(h));
    }
    for (const p of projects || []) {
        const h = p?.creatorHandle || p?.content?.creatorHandle;
        if (h) handles.add(normalizeHandle(h));
    }
    for (const a of attestations || []) {
        const h1 = a?.content?.attesterHandle;
        const h2 = a?.content?.attestedHandle;
        if (h1) handles.add(normalizeHandle(h1));
        if (h2) handles.add(normalizeHandle(h2));
    }
    return Array.from(handles).filter(Boolean).sort();
}
