// TEAMTOWERS SOS V11 — COHORT SEAT SERVICE (MAT-003 sprint F)
//
// Gestión de las plazas Cohort 0 (108 places · 96 op + 12 guardians).
// Cada plaza · nodo KB type='cohort_seat' con · displayName · skills
// declaradas · guardianOf opcional · availability · status.
//
// Helpers:
//   listSeats(KB)                     → todas las plaças
//   listAvailableSeats(KB)            → status === 'available'
//   buildSeedSeats(count=5)           → array sintético per a demo
//   seedDemoSeatsToKb(KB, count=5)    → escriu seed a KB (idempotent)
//   buildSeatNode(seat)               → puro · nodo KB para upsert
//   collectSwarmInputForProject(KB, projectId)
//                                     → {requiredRoles, swarmSeats} listo
//                                       para swarmMatchmaker
//
// Pure helpers testables sin KB · buildSeedSeats / buildSeatNode /
// extractSwarmInput.

const SEAT_TYPE = 'cohort_seat';
const ASSIGNMENT_TYPE = 'swarm_assignment';

// 5 plazas demo realistas · cada una con perfil distinto que cubre
// dominios variados. Útil para activar el matchmaker en el demo
// fundadores · NO son personas reales · son arquetipos visualizados.
const DEMO_SEAT_SEED = Object.freeze([
    Object.freeze({
        id:             'cohort-seat-demo-aitana',
        displayName:    'Aitana R.',
        handle:         '@aitanaregenera',
        guardianOf:     'demeter',
        skillsDeclared: Object.freeze(['regenerative-agriculture', 'seed-banking', 'food-systems', 'biodiversity-stewardship', 'energy-transition']),
        availability:   'high',
        bio:            'Pagesa regenerativa · 12 anys · banc de llavors comarcal',
    }),
    Object.freeze({
        id:             'cohort-seat-demo-nuria',
        displayName:    'Núria B.',
        handle:         '@nuriadev',
        guardianOf:     'hefesto',
        skillsDeclared: Object.freeze(['smart-contract-development', 'system-architecture', 'devops-cooperative', 'security-engineering', 'llm-orchestration']),
        availability:   'normal',
        bio:            'Smart contract dev · 8 anys · gnosis multisig spec',
    }),
    Object.freeze({
        id:             'cohort-seat-demo-jordi',
        displayName:    'Jordi T.',
        handle:         '@jordifacilita',
        guardianOf:     'hermes',
        skillsDeclared: Object.freeze(['facilitation', 'meeting-design', 'network-weaving', 'territorial-ambassadorship', 'relational-intelligence']),
        availability:   'high',
        bio:            'Facilitador comunitari · 15 anys · cohousing + ateneus',
    }),
    Object.freeze({
        id:             'cohort-seat-demo-marc',
        displayName:    'Marc L.',
        handle:         '@marcfinances',
        guardianOf:     'poseidon',
        skillsDeclared: Object.freeze(['triple-entry-accounting', 'slicing-pie', 'treasury-management', 'capital-sourcing', 'exit-mechanism-design']),
        availability:   'normal',
        bio:            'Comptable triple-entry · 10 anys · slicing pie practitioner',
    }),
    Object.freeze({
        id:             'cohort-seat-demo-laia',
        displayName:    'Laia P.',
        handle:         '@laiacures',
        guardianOf:     'hestia',
        skillsDeclared: Object.freeze(['conflict-mediation', 'cop-stewardship', 'ritual-design', 'storytelling', 'curriculum-design']),
        availability:   'high',
        bio:            'Cures · facilitació de conflictes · 14 anys · sessions respir',
    }),
]);

// ── Pure helpers ────────────────────────────────────────────────────

export function buildSeedSeats(count = 5) {
    const max = Math.min(Math.max(0, count), DEMO_SEAT_SEED.length);
    return DEMO_SEAT_SEED.slice(0, max).map(s => ({ ...s, skillsDeclared: s.skillsDeclared.slice() }));
}

export function buildSeatNode(seat) {
    if (!seat || typeof seat.id !== 'string' || !seat.id) {
        throw new Error('buildSeatNode requires { id }');
    }
    return {
        id:   seat.id,
        type: SEAT_TYPE,
        content: {
            kind:           'cohort-seat',
            displayName:    seat.displayName || seat.id,
            handle:         seat.handle || null,
            guardianOf:     seat.guardianOf || null,
            skillsDeclared: Array.isArray(seat.skillsDeclared) ? seat.skillsDeclared.slice() : [],
            availability:   seat.availability || 'normal',
            status:         seat.status || 'available',
            bio:            seat.bio || '',
        },
        keywords: [
            'type:' + SEAT_TYPE,
            'kind:cohort-seat',
            ...(seat.guardianOf ? ['guardianOf:' + seat.guardianOf] : []),
            ...(Array.isArray(seat.skillsDeclared) ? seat.skillsDeclared.map(s => 'skill:' + s) : []),
        ],
    };
}

// extractSwarmInput · puro · de los nodos del proyecto extrae los roles
// del bootstrap (type='role' · kind='bootstrap-role') y los expone como
// `requiredRoles` listos para el matchmaker. El bootstrap meta lo lee
// del nodo `${projectId}::bootstrap-meta` (type='project_bootstrap').
export function extractSwarmInput({ projectNodes = [], seatNodes = [] } = {}) {
    const meta = projectNodes.find(n => n?.type === 'project_bootstrap');
    const roleNodes = projectNodes.filter(n =>
        n?.type === 'role' && n?.content?.kind === 'bootstrap-role'
    );
    const requiredRoles = roleNodes.map(n => ({
        id:               n.id,
        label:            n?.content?.label || n.id,
        domain:           inferDomainFromGuardians(n?.content?.guardianAffinity || []),
        criticality:      'normal',
        guardianAffinity: n?.content?.guardianAffinity || [],
    }));
    const swarmSeats = (seatNodes || [])
        .filter(s => s?.type === SEAT_TYPE && (s?.content?.status || 'available') === 'available')
        .map(s => ({
            id:              s.id,
            displayName:     s?.content?.displayName || s.id,
            skillsDeclared:  s?.content?.skillsDeclared || [],
            guardianOf:      s?.content?.guardianOf || null,
            availability:    s?.content?.availability || 'normal',
        }));
    return {
        requiredRoles,
        swarmSeats,
        bootstrapMeta: meta?.content || null,
        projectTypeId: meta?.content?.typeId || null,
    };
}

// Heurística simple guardian → domain · usado para prompt enrichment
const GUARDIAN_DOMAIN_HINT = Object.freeze({
    afrodita:'design', apolo:'education', atenea:'governance', demeter:'ecology',
    dionisio:'culture', hebe:'operations', hefesto:'tech', hera:'legal',
    hermes:'community', hestia:'community', poseidon:'finance', zeus:'governance',
});
function inferDomainFromGuardians(guardiansArr) {
    if (!Array.isArray(guardiansArr) || guardiansArr.length === 0) return 'operations';
    const g = guardiansArr[0];
    return GUARDIAN_DOMAIN_HINT[g] || 'operations';
}

export function buildSwarmAssignmentNode({ projectId, match }) {
    if (!projectId || !match || !match.roleId || !match.seatId) {
        throw new Error('buildSwarmAssignmentNode requires { projectId, match: {roleId, seatId} }');
    }
    const id = `${projectId}::assignment::${match.roleId}::${match.seatId}::${match.primary ? 'P' : 'S'}`;
    return {
        id,
        type: ASSIGNMENT_TYPE,
        projectId,
        content: {
            kind:       'swarm-assignment',
            roleId:     match.roleId,
            seatId:     match.seatId,
            primary:    match.primary === true,
            fit:        typeof match.fit === 'number' ? match.fit : 0,
            rationale:  match.rationale || '',
            skillsUsed: Array.isArray(match.skillsUsed) ? match.skillsUsed.slice() : [],
        },
        keywords: [
            'type:swarm_assignment',
            'project:' + projectId,
            'role:' + match.roleId,
            'seat:' + match.seatId,
            (match.primary ? 'rank:primary' : 'rank:secondary'),
        ],
    };
}

// ── KB-bound helpers (async) ────────────────────────────────────────

export async function listSeats(KB) {
    if (!KB || typeof KB.query !== 'function') {
        throw new Error('listSeats requires KB instance');
    }
    return KB.query({ type: SEAT_TYPE });
}

export async function listAvailableSeats(KB) {
    const all = await listSeats(KB);
    return (all || []).filter(s => (s?.content?.status || 'available') === 'available');
}

export async function seedDemoSeatsToKb(KB, count = 5) {
    if (!KB || typeof KB.upsert !== 'function') {
        throw new Error('seedDemoSeatsToKb requires KB instance');
    }
    const seats = buildSeedSeats(count);
    const written = [];
    for (const seat of seats) {
        const node = buildSeatNode(seat);
        await KB.upsert(node);
        written.push(node);
    }
    return written;
}

export async function persistAssignments({ KB, projectId, matches }) {
    if (!KB || typeof KB.upsert !== 'function') {
        throw new Error('persistAssignments requires KB instance');
    }
    if (!projectId) throw new Error('persistAssignments requires projectId');
    const list = Array.isArray(matches) ? matches : [];
    const written = [];
    for (const m of list) {
        const node = buildSwarmAssignmentNode({ projectId, match: m });
        await KB.upsert(node);
        written.push(node);
    }
    return written;
}

export async function listProjectAssignments(KB, projectId) {
    if (!KB || typeof KB.query !== 'function') {
        throw new Error('listProjectAssignments requires KB');
    }
    if (!projectId) return [];
    const all = await KB.query({ type: ASSIGNMENT_TYPE, projectId });
    return all || [];
}
