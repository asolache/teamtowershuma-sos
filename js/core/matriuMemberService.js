// TEAMTOWERS SOS V11 — MATRIU MEMBER SERVICE (MAT-002-I sprint B)
//
// Schema unificat dels 108 membres del nucli Matriu · fusió de
// `cohort_seat` (perfil de skills + guardian + bio) + `user_identity`
// (DID + clau ECDSA + wallets + handle).
//
// Reframe @alvaro 2026-05-09 fase 2 · "la Matriu son las personas".
// Un sol nodo per persona · `matriu_member`. Backwards compat preservat
// via helpers de migració · els nodes legacy continuen llegint-se
// mentre es fa la transició.
//
// Schema:
//   id        · namespaced · 'matriu-member-{didHex|seatHex}-{cohort}'
//   type      · 'matriu_member'
//   content:
//     kind             · 'matriu-member'
//     displayName      · obligatori · string
//     handle           · opcional · '@alvaro' · string
//     bio              · opcional · string ≤500 chars
//     avatar           · opcional · URL/base64
//     primaryDid       · opcional · 'did:sos:{32hex}' (de user_identity)
//     publicJwk        · opcional · clau pública ECDSA (per signar pactes)
//     wallets          · array · [{address, chain, label, verifiedAt?}]
//     oauthProviders   · array · futur sprint
//     guardianOf       · 1 dels 12 guardianes Pantheon Work
//     skillsDeclared   · array de IDs del SKILL_TAXONOMY
//     availability     · 'high' | 'normal' | 'low'
//     status           · 'active' | 'inactive' | 'archived'
//     cohortNumber     · 0 = nucli fundacional · 1+ = cohorts posteriores
//     migratedFrom     · {seatId?, identityId?} · trace per debugging
//     createdAt · updatedAt

const MEMBER_TYPE = 'matriu_member';
const ID_PREFIX = 'matriu-member-';

// ── Helpers puros ────────────────────────────────────────────────────

function memberIdFor({ primaryDid, seatId, cohortNumber = 0 } = {}) {
    let suffix;
    if (primaryDid && typeof primaryDid === 'string') {
        suffix = primaryDid.replace(/^did:sos:/, '').replace(/[^a-z0-9]/gi, '').slice(0, 24);
    } else if (seatId && typeof seatId === 'string') {
        suffix = seatId.replace(/^cohort-seat-/, '').replace(/[^a-z0-9-]/gi, '').slice(0, 32);
    } else {
        suffix = 'anon-' + Math.random().toString(36).slice(2, 8);
    }
    return `${ID_PREFIX}${suffix}-c${cohortNumber}`;
}

const VALID_AVAIL = Object.freeze(['high', 'normal', 'low']);
const VALID_STATUS = Object.freeze(['active', 'inactive', 'archived']);

export function validateMatriuMember(node) {
    if (!node || typeof node !== 'object') return false;
    if (node.type !== MEMBER_TYPE) return false;
    if (typeof node.id !== 'string' || !node.id) return false;
    const c = node.content;
    if (!c || typeof c !== 'object') return false;
    if (typeof c.displayName !== 'string' || !c.displayName) return false;
    if (typeof c.cohortNumber !== 'number' || c.cohortNumber < 0) return false;
    if (c.availability && !VALID_AVAIL.includes(c.availability)) return false;
    if (c.status && !VALID_STATUS.includes(c.status)) return false;
    if (c.skillsDeclared && !Array.isArray(c.skillsDeclared)) return false;
    if (c.wallets && !Array.isArray(c.wallets)) return false;
    if (c.bio && typeof c.bio === 'string' && c.bio.length > 500) return false;
    return true;
}

// buildMatriuMember · puro · construye el nodo. Acepta camps opcionals
// de qualsevol font (cohort_seat o user_identity).
// Sprint E · `sectorsExperience` (codis A-S del KnowledgeLoader) · array
//           opcional de sectors on el membre té experiència professional.
export function buildMatriuMember({
    displayName,
    handle           = null,
    bio              = '',
    avatar           = null,
    primaryDid       = null,
    publicJwk        = null,
    wallets          = [],
    oauthProviders   = [],
    guardianOf       = null,
    skillsDeclared   = [],
    sectorsExperience = [],
    availability     = 'normal',
    status           = 'active',
    cohortNumber     = 0,
    migratedFrom     = null,
    seatId           = null,
} = {}) {
    if (typeof displayName !== 'string' || !displayName.trim()) {
        throw new Error('buildMatriuMember requires displayName');
    }
    if (availability && !VALID_AVAIL.includes(availability)) {
        throw new Error('buildMatriuMember · availability inválida: ' + availability);
    }
    if (status && !VALID_STATUS.includes(status)) {
        throw new Error('buildMatriuMember · status inválido: ' + status);
    }
    const id = memberIdFor({ primaryDid, seatId, cohortNumber });
    const now = Date.now();
    return {
        id,
        type: MEMBER_TYPE,
        content: {
            kind:           'matriu-member',
            displayName:    displayName.trim(),
            handle,
            bio:            bio.slice(0, 500),
            avatar,
            primaryDid,
            publicJwk,
            wallets:        wallets.slice(),
            oauthProviders: oauthProviders.slice(),
            guardianOf,
            skillsDeclared:    skillsDeclared.slice(),
            sectorsExperience: (sectorsExperience || []).slice(),
            availability,
            status,
            cohortNumber,
            migratedFrom:   migratedFrom || null,
            createdAt:      now,
            updatedAt:      now,
        },
        keywords: [
            'type:' + MEMBER_TYPE,
            'kind:matriu-member',
            'cohort:' + cohortNumber,
            ...(guardianOf ? ['guardianOf:' + guardianOf] : []),
            ...(skillsDeclared || []).map(s => 'skill:' + s),
            ...((sectorsExperience || []).map(s => 'sector:' + s)),
            ...(availability ? ['avail:' + availability] : []),
            ...(status ? ['status:' + status] : []),
        ],
    };
}

// ── Migracions puras (input → matriu_member node) ──────────────────

// migrateCohortSeatToMember · puro · transforma un nodo cohort_seat
// en un nodo matriu_member equivalent. La info de identity (DID/clau)
// queda buida · omplir-la després amb mergeIdentityIntoMember.
export function migrateCohortSeatToMember(seat) {
    if (!seat || seat.type !== 'cohort_seat') {
        throw new Error('migrateCohortSeatToMember requires seat with type=cohort_seat');
    }
    const c = seat.content || {};
    return buildMatriuMember({
        displayName:    c.displayName || seat.id,
        handle:         c.handle || null,
        bio:            c.bio || '',
        guardianOf:     c.guardianOf || null,
        skillsDeclared: c.skillsDeclared || [],
        availability:   c.availability || 'normal',
        status:         c.status || 'active',
        cohortNumber:   0,
        seatId:         seat.id,
        migratedFrom:   { seatId: seat.id },
    });
}

// mergeIdentityIntoMember · puro · enriqueix un member existent amb
// dades d'identity (DID, clau, wallets). Si member ja té primaryDid,
// no l'overwrite (preserva l'existent).
export function mergeIdentityIntoMember(member, identity) {
    if (!validateMatriuMember(member)) {
        throw new Error('mergeIdentityIntoMember requires valid member');
    }
    if (!identity || identity.type !== 'user_identity') {
        throw new Error('mergeIdentityIntoMember requires identity with type=user_identity');
    }
    const ic = identity.content || {};
    const next = {
        ...member,
        content: {
            ...member.content,
            primaryDid: member.content.primaryDid || ic.primaryDid || null,
            publicJwk:  member.content.publicJwk  || ic.publicKeys?.signing || null,
            wallets:    Array.from(new Map(
                [...(member.content.wallets || []), ...(ic.wallets || [])]
                    .map(w => [w.address?.toLowerCase(), w])
            ).values()).filter(Boolean),
            oauthProviders: ic.oauthProviders || member.content.oauthProviders || [],
            handle:     member.content.handle || ic.handle || null,
            avatar:     member.content.avatar || ic.avatar || null,
            displayName: member.content.displayName || ic.displayName || member.content.displayName,
            migratedFrom: { ...(member.content.migratedFrom || {}), identityId: identity.id },
            updatedAt:  Date.now(),
        },
    };
    return next;
}

// migrateIdentityToMember · puro · si NO hi ha cohort_seat associat,
// pot crear directament un member desde un user_identity. cohortNumber
// és null per defecte (member sense cohort assignada · "amic de la
// xarxa" sense plaza fundacional).
export function migrateIdentityToMember(identity, { cohortNumber = null } = {}) {
    if (!identity || identity.type !== 'user_identity') {
        throw new Error('migrateIdentityToMember requires identity');
    }
    const c = identity.content || {};
    return buildMatriuMember({
        displayName:    c.displayName || identity.id,
        handle:         c.handle || null,
        avatar:         c.avatar || null,
        primaryDid:     c.primaryDid || null,
        publicJwk:      c.publicKeys?.signing || null,
        wallets:        c.wallets || [],
        oauthProviders: c.oauthProviders || [],
        cohortNumber:   cohortNumber !== null ? cohortNumber : 99,   // 99 = network sense plaza fundacional
        migratedFrom:   { identityId: identity.id },
    });
}

// summarizeMember · puro · resum compacte per UI cards
export function summarizeMember(member) {
    if (!validateMatriuMember(member)) return null;
    const c = member.content;
    return {
        id:              member.id,
        displayName:     c.displayName,
        handle:          c.handle,
        guardianOf:      c.guardianOf,
        skillsCount:     (c.skillsDeclared || []).length,
        walletsCount:    (c.wallets || []).length,
        hasPrimaryDid:   !!c.primaryDid,
        hasPublicJwk:    !!c.publicJwk,
        availability:    c.availability,
        status:          c.status,
        cohortNumber:    c.cohortNumber,
        isFundacional:   c.cohortNumber === 0,
    };
}

// ── KB-bound helpers (async) ───────────────────────────────────────

export async function listMatriuMembers(KB) {
    if (!KB || typeof KB.query !== 'function') {
        throw new Error('listMatriuMembers requires KB');
    }
    return KB.query({ type: MEMBER_TYPE });
}

export async function getMemberById(KB, id) {
    if (!KB || typeof KB.getNode !== 'function') return null;
    return KB.getNode(id);
}

// migrateAllToMatriuMembers · async · escaneja tot el KB:
//   1. Llegeix tots els cohort_seat existents
//   2. Llegeix tots els user_identity existents
//   3. Per cada cohort_seat · genera matriu_member equivalent (preserva
//      l'idioma cohort 0)
//   4. Per cada user_identity sense seat · genera matriu_member amb
//      cohortNumber=99 (network)
//   5. Si un cohort_seat té un identity associat (per displayName o
//      primaryDid), els fusiona via mergeIdentityIntoMember
//
// `dryRun: true` (default) NO escriu al KB · només retorna preview.
// `dryRun: false` upserts els nous matriu_member.
export async function migrateAllToMatriuMembers(KB, { dryRun = true } = {}) {
    if (!KB || typeof KB.query !== 'function') {
        throw new Error('migrateAllToMatriuMembers requires KB');
    }
    const seats = (await KB.query({ type: 'cohort_seat' })) || [];
    const identities = (await KB.query({ type: 'user_identity' })) || [];

    const members = [];
    const seatToMember = new Map();

    for (const seat of seats) {
        const member = migrateCohortSeatToMember(seat);
        members.push(member);
        seatToMember.set(seat.id, member);
    }

    // Match identities to members by displayName/handle
    const identityIdsConsumed = new Set();
    for (const member of members) {
        const matchedIdentity = identities.find(i => {
            if (identityIdsConsumed.has(i.id)) return false;
            const ic = i.content || {};
            if (ic.displayName && ic.displayName === member.content.displayName) return true;
            if (ic.handle && member.content.handle && ic.handle === member.content.handle) return true;
            return false;
        });
        if (matchedIdentity) {
            const merged = mergeIdentityIntoMember(member, matchedIdentity);
            // Replace in-place
            const idx = members.indexOf(member);
            members[idx] = merged;
            identityIdsConsumed.add(matchedIdentity.id);
        }
    }

    // Identities sin seat · cohortNumber=99 (network)
    for (const identity of identities) {
        if (identityIdsConsumed.has(identity.id)) continue;
        members.push(migrateIdentityToMember(identity, { cohortNumber: 99 }));
    }

    const stats = {
        seatsCount:         seats.length,
        identitiesCount:    identities.length,
        membersGenerated:   members.length,
        cohort0Count:       members.filter(m => m.content.cohortNumber === 0).length,
        networkCount:       members.filter(m => m.content.cohortNumber === 99).length,
        dryRun,
    };

    if (!dryRun) {
        for (const member of members) {
            await KB.upsert(member);
        }
    }

    return { members, stats };
}
