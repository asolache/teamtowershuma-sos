// TEAMTOWERS SOS V11 — MEMBER PANEL SERVICE (UX-AUDIT-001 sprint C)
//
// Helpers purs per construir el "panell del membre" al Dashboard ·
// reframe @alvaro 2026-05-09: "Dashboard com a panell del membre, no
// del codi tècnic SOS".
//
// Detecta el membre actual del operador (per defecte @alvaro · resol
// per `content.handle` o pel primer `matriu_member` del KB) i calcula
// agregats d'impacte: projectes actius · slices generats · contribucions.

import { detectProjectPhase } from './navService.js';
import { isTestProject } from './projectFilter.js';

// ── Member resolution ─────────────────────────────────────────────────

// resolveCurrentMember · pura · cerca el membre del operador actual al KB.
// Estratègia: matchejar EXACTAMENT per `content.handle === preferredHandle`.
// Retorna `null` si no hi ha cap match · NO fa fallback al primer membre
// del KB perquè altres members (cohort 0, seed) podrien aparèixer com si
// fossin l'operador actual (bug @alvaro veu "Marc · @marc" al panell).
// Fix UX-AUDIT-001 sprint H+ pass 5 · 2026-05-10.
export function resolveCurrentMember(kbNodes = [], preferredHandle = '@alvaro') {
    if (!Array.isArray(kbNodes) || kbNodes.length === 0) return null;
    if (!preferredHandle) return null;
    const members = kbNodes.filter(n => n?.type === 'matriu_member');
    return members.find(m => m?.content?.handle === preferredHandle) || null;
}

// summarizeMemberIdentity · pura · extreu camps display-ready.
export function summarizeMemberIdentity(member) {
    if (!member?.content) {
        return {
            exists:        false,
            displayName:   'Operador anònim',
            handle:        '@alvaro',
            bio:           '',
            availability:  'normal',
            skillsCount:   0,
            sectorsCount:  0,
            guardianOf:    null,
            cohortNumber:  null,
        };
    }
    const c = member.content;
    return {
        exists:        true,
        displayName:   c.displayName || 'Operador',
        handle:        c.handle || null,
        bio:           c.bio || '',
        availability:  c.availability || 'normal',
        skillsCount:   Array.isArray(c.skillsDeclared) ? c.skillsDeclared.length : 0,
        skills:        Array.isArray(c.skillsDeclared) ? c.skillsDeclared.slice(0, 8) : [],
        sectorsCount:  Array.isArray(c.sectorsExperience) ? c.sectorsExperience.length : 0,
        sectors:       Array.isArray(c.sectorsExperience) ? c.sectorsExperience : [],
        guardianOf:    c.guardianOf || null,
        cohortNumber:  typeof c.cohortNumber === 'number' ? c.cohortNumber : null,
    };
}

// ── Impact stats ──────────────────────────────────────────────────────

// computeMemberImpact · pura · agrega l'impacte del operador.
// `projects` ja venen filtrats (sense test · sense archived).
// `kbNodes` és el dump complet del KB per cercar `value_contribution`.
export function computeMemberImpact({ projects = [], kbNodes = [] } = {}) {
    const visibleProjects = (projects || []).filter(p => p && !isTestProject(p));
    const activeProjects  = visibleProjects.length;

    // Slices · sumem `content.slices` de tots els value_contribution del KB
    // associats a un projecte visible.
    const visibleIds = new Set(visibleProjects.map(p => p.id));
    let totalSlices       = 0;
    let totalContributions = 0;
    let totalLedgerEntries = 0;
    let totalWorkOrders    = 0;

    (kbNodes || []).forEach(n => {
        if (!n) return;
        if (n.type === 'value_contribution' && visibleIds.has(n.projectId)) {
            totalContributions += 1;
            const s = Number(n?.content?.slices);
            if (Number.isFinite(s)) totalSlices += s;
        } else if (n.type === 'work_order' && visibleIds.has(n.projectId)) {
            totalWorkOrders += 1;
        }
    });

    // Ledger entries · viuen dins `project.ledger[]`
    visibleProjects.forEach(p => {
        if (Array.isArray(p.ledger)) totalLedgerEntries += p.ledger.length;
    });

    return {
        activeProjects,
        totalSlices:        Math.round(totalSlices * 100) / 100,
        totalContributions,
        totalLedgerEntries,
        totalWorkOrders,
    };
}

// ── Phase grouping ────────────────────────────────────────────────────

// groupProjectsByPhase · pura · agrupa projectes per fase detectada.
// Retorna `{ design: [...], build: [...], operate: [...], ledger: [...] }`.
// Cada projecte només apareix en una fase (la dominant segons detectProjectPhase).
export function groupProjectsByPhase(projects = [], statsResolver = null) {
    const groups = { design: [], build: [], operate: [], ledger: [] };
    (projects || []).forEach(p => {
        if (!p) return;
        const stats = typeof statsResolver === 'function' ? statsResolver(p) : null;
        const phase = detectProjectPhase(p, stats) || 'design';
        if (groups[phase]) groups[phase].push(p);
        else groups.design.push(p);
    });
    return groups;
}

// PHASE_ORDER · order canònic de visualització (DESIGN → BUILD → OPERATE → LEDGER)
export const PHASE_ORDER = Object.freeze(['design', 'build', 'operate', 'ledger']);

// AVAILABILITY_META · per UI badges
export const AVAILABILITY_META = Object.freeze({
    high:   { label: 'Disponibilitat alta',   color: '#10b981', icon: '🟢' },
    normal: { label: 'Disponibilitat normal', color: '#f59e0b', icon: '🟡' },
    low:    { label: 'Disponibilitat baixa',  color: '#ef4444', icon: '🔴' },
});
