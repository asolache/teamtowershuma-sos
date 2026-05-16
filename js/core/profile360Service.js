// =============================================================================
// TEAMTOWERS SOS V11 — PROFILE 360 SERVICE (PROFILE-360-LEGENDARY-001)
// Ruta · /js/core/profile360Service.js
//
// Servei pure que prepara dades per a les 8 zones del perfil unificat:
//   1. IDENTITY · DID · wallets · keyfile · Wander · trust score
//   2. IKIGAI 🌸 · 4 dimensions · 5 zones · privacy per dim
//   3. SKILLS 🤲 · declarades + attestades + evidence level
//   4. KNOWLEDGE 🧠 · workshops fets + learn_role progress + sectors
//   5. REPUTATION 🤝 · trust score · attestations · follow counts
//   6. WORK · projectes/WOs en curs + disponibilitat + castell_level
//   7. OFERTES 🛒 · productes/workshops/sops · acquisitions · revenue
//   8. NETWORK 🌐 · permaweb reach · cross-SOS · triple-entry proof
//
// Pure · zero DOM · zero IA. Tots els inputs s'injecten (KB.query externs).
// Privacy filter aplicat al mode 'public' (vista d'altres usuaris).
// =============================================================================

export const PROFILE_360_VERSION = 'v1.0';

// Privacy modes · per cada zona · usuari pot triar:
//   'public'  · visible a qualsevol que vegi el perfil
//   'cohort'  · només membres del mateix cohort (requereix DID match)
//   'private' · només l'usuari propietari
export const PRIVACY_MODES = Object.freeze(['public', 'cohort', 'private']);

// Default privacy · sensible · tot public excepte wallets sensibles
export const DEFAULT_PRIVACY = Object.freeze({
    identity:   'public',     // DID · handle · displayName · cohort
    wallets:    'private',    // adreces Ethereum/Arweave
    ikigai:     'public',
    skills:     'public',
    knowledge:  'public',
    reputation: 'public',
    work:       'public',
    offerings:  'public',
    network:    'public',
});

// ─── Inputs canonical (tots arrays · injectats pel caller) ────────────────
// { handle, identityNode, member, projects, roles, attestations, marketItems,
//   workshops, sops, ledger, invoices, learnRoles, registryEntries, mode }
//
// mode · 'me' (privat · tot visible) · 'public' (filtra per privacy)

function _emptyInputs() {
    return {
        handle: null, identityNode: null, member: null,
        projects: [], roles: [], attestations: [], marketItems: [],
        workshops: [], sops: [], ledger: [], invoices: [], wos: [],
        learnRoles: [], registryEntries: [], mode: 'public',
    };
}

// _norm · pure
function _norm(h) {
    if (!h) return null;
    return '@' + String(h).trim().toLowerCase().replace(/^@/, '');
}

function _matches(a, b) {
    return _norm(a) === _norm(b);
}

// _privacyFor · retorna el mode efectiu d'una zona segons identityNode + defaults
function _privacyFor(zoneId, identityNode) {
    const ovr = identityNode?.content?.privacy || {};
    return ovr[zoneId] || DEFAULT_PRIVACY[zoneId] || 'public';
}

// _canShow · pure · retorna si una zona ha de ser visible en mode actual
function _canShow(zoneId, mode, identityNode) {
    if (mode === 'me') return true;   // mode propi · tot visible
    const privacy = _privacyFor(zoneId, identityNode);
    if (privacy === 'public') return true;
    if (privacy === 'cohort') return false;   // simplification · MVP no implementa cohort match
    return false;                              // private
}

// ─── Zona 1 · IDENTITY ────────────────────────────────────────────────────
function _zoneIdentity({ handle, identityNode, member, mode }) {
    const visible = _canShow('identity', mode, identityNode);
    if (!visible) return null;
    const c = identityNode?.content || {};
    const mc = member?.content || {};
    const wallets = Array.isArray(c.wallets) ? c.wallets : [];
    const showWallets = _canShow('wallets', mode, identityNode);
    return {
        zone: 'identity',
        handle: handle,
        displayName: mc.displayName || c.displayName || handle || '@unknown',
        did: c.primaryDid || null,
        avatar: mc.avatar || c.avatar || null,
        cohortNumber: mc.cohortNumber || null,
        wallets: showWallets ? wallets : wallets.map(w => ({ chain: w.chain, redacted: true })),
        hasKeyfile: !!c.hasArweaveKeyfile,
        wanderConnected: !!c.wanderAddress,
        publicKeyPresent: !!c.publicJwk,
        lastSeen: c.lastSeen || mc.lastSeen || null,
    };
}

// ─── Zona 2 · IKIGAI 🌸 ────────────────────────────────────────────────────
function _zoneIkigai({ member, identityNode, mode }) {
    if (!_canShow('ikigai', mode, identityNode)) return null;
    const ikigai = member?.content?.ikigai || null;
    if (!ikigai) return { zone: 'ikigai', present: false };
    // Compute filled count
    const dims = ikigai.dimensions || {};
    const filledDims = Object.values(dims).filter(d => Array.isArray(d?.items) && d.items.length > 0).length;
    const totalItems = Object.values(dims).reduce((s, d) => s + (Array.isArray(d?.items) ? d.items.length : 0), 0);
    return {
        zone: 'ikigai',
        present: true,
        ikigai,
        filledDims,
        totalItems,
        completePct: Math.round((filledDims / 4) * 100),
    };
}

// ─── Zona 3 · SKILLS 🤲 ────────────────────────────────────────────────────
function _zoneSkills({ handle, member, roles, attestations, mode, identityNode }) {
    if (!_canShow('skills', mode, identityNode)) return null;
    const c = member?.content || {};
    const declared = Array.isArray(c.skillsDeclared) ? c.skillsDeclared.slice() : [];
    // Roles del usuari · cada role té primarySkillId
    const myRoles = (roles || []).filter(r => {
        const rc = r?.content || {};
        return _matches(rc.createdBy, handle) || _matches(rc.creatorHandle, handle) || _matches(rc.handle, handle);
    });
    const fromRoles = myRoles.map(r => r.content?.primarySkillId).filter(Boolean);
    // Attestations rebudes per skill
    const attested = (attestations || []).filter(a => {
        const ac = a?.content || {};
        return _matches(ac.toHandle, handle) || _matches(ac.targetHandle, handle);
    });
    const attestedSkillIds = new Set();
    for (const a of attested) {
        const sid = a.content?.skillId;
        if (sid) attestedSkillIds.add(sid);
    }
    // Merge · cada skill té source + attested boolean
    const allIds = new Set([...declared, ...fromRoles, ...attestedSkillIds]);
    const skills = [...allIds].map(id => ({
        id,
        source: declared.includes(id) ? 'declared' : (fromRoles.includes(id) ? 'role' : 'attested-only'),
        attested: attestedSkillIds.has(id),
        attestationCount: attested.filter(a => a.content?.skillId === id).length,
    }));
    return { zone: 'skills', skills, totals: { all: skills.length, attested: attestedSkillIds.size } };
}

// ─── Zona 4 · KNOWLEDGE 🧠 (workshops + learn_role + sectors) ─────────────
function _zoneKnowledge({ handle, member, workshops, learnRoles, mode, identityNode }) {
    if (!_canShow('knowledge', mode, identityNode)) return null;
    const c = member?.content || {};
    const sectorsExp = Array.isArray(c.sectorsExperience) ? c.sectorsExperience.slice() : [];
    // Workshops on participat (audience match) o cohortNumber match
    const myCohort = c.cohortNumber || null;
    const myWorkshops = (workshops || []).filter(w => {
        const wc = w?.content || {};
        if (Array.isArray(wc.participants) && wc.participants.some(p => _matches(p, handle))) return true;
        if (myCohort && wc.cohortNumber === myCohort) return true;
        return false;
    });
    // Learn roles · progress per role
    const myLearnRoles = (learnRoles || []).filter(l => {
        const lc = l?.content || {};
        return _matches(lc.handle, handle) || _matches(lc.holder, handle);
    });
    return {
        zone: 'knowledge',
        sectorsExperience: sectorsExp,
        workshops: myWorkshops.map(w => ({
            id: w.id,
            title: w.content?.title,
            cohortNumber: w.content?.cohortNumber,
            accessTier: w.content?.accessTier,
        })),
        learnRoles: myLearnRoles.map(l => ({
            id: l.id,
            roleSlug: l.content?.roleSlug || l.content?.role_id,
            progress: l.content?.progress || 0,
            status: l.content?.status || 'in-progress',
        })),
    };
}

// ─── Zona 5 · REPUTATION 🤝 (trust + attestations + follow) ──────────────
function _zoneReputation({ handle, attestations, mode, identityNode }) {
    if (!_canShow('reputation', mode, identityNode)) return null;
    const received = (attestations || []).filter(a => {
        const ac = a?.content || {};
        return _matches(ac.toHandle, handle) || _matches(ac.targetHandle, handle);
    });
    const sent = (attestations || []).filter(a => _matches(a?.content?.fromHandle, handle));
    const uniqueAttesters = new Set(received.map(a => _norm(a.content?.fromHandle)).filter(Boolean)).size;
    const followers = received.filter(a => a.content?.kind === 'follow').length;
    const following = sent.filter(a => a.content?.kind === 'follow').length;
    return {
        zone: 'reputation',
        attestationsReceived: received.length,
        attestationsSent: sent.length,
        uniqueAttesters,
        followers,
        following,
        // band derivat al consumer (color · icon)
        rawScore: received.length + uniqueAttesters * 2,
    };
}

// ─── Zona 6 · WORK (projects + WOs in progress + availability) ────────────
function _zoneWork({ handle, member, projects, roles, wos, mode, identityNode }) {
    if (!_canShow('work', mode, identityNode)) return null;
    const c = member?.content || {};
    const availability = c.availability || 'available';
    // Projectes on participa · createdBy match O membre del cohort
    const myProjects = (projects || []).filter(p => {
        if (_matches(p.creatorHandle, handle)) return true;
        if (Array.isArray(p.collaborators) && p.collaborators.some(x => _matches(x, handle))) return true;
        return false;
    });
    // Roles assignats per projecte · castell_level
    const myRoles = (roles || []).filter(r => {
        const rc = r?.content || {};
        return _matches(rc.assignedTo, handle) || _matches(rc.createdBy, handle);
    });
    // WOs assignades
    const myWos = (wos || []).filter(w => {
        const wc = w?.content || {};
        const ass = wc.assignee || {};
        return _matches(ass.id, handle) || ass.id === handle;
    });
    return {
        zone: 'work',
        availability,
        projects: myProjects.map(p => ({
            id: p.id, name: p.name || p.nombre,
            roleAtProject: myRoles.find(r => r.content?.projectId === p.id)?.content?.roleSlug || null,
            castell_level: myRoles.find(r => r.content?.projectId === p.id)?.content?.castell_level || null,
        })),
        wosInProgress: myWos.filter(w => ['claimed', 'in-progress', 'backlog'].includes(w.content?.status)),
        wosDone: myWos.filter(w => w.content?.status === 'done').length,
    };
}

// ─── Zona 7 · OFERTES (market_items · workshops · sops oferts) ────────────
function _zoneOfferings({ handle, marketItems, workshops, sops, ledger, mode, identityNode }) {
    if (!_canShow('offerings', mode, identityNode)) return null;
    const fromMe = (n) => _matches(n?.content?.sellerHandle, handle) || _matches(n?.content?.createdBy, handle);
    const products = (marketItems || []).filter(fromMe);
    const myWorkshops = (workshops || []).filter(fromMe);
    const mySops = (sops || []).filter(fromMe);
    // Revenue · agregat dels ledger entries amb to=handle
    const myRevenue = (ledger || []).reduce((sum, l) => {
        const lc = l?.content || {};
        if (_matches(lc.toHandle, handle) && typeof lc.amount === 'number') return sum + lc.amount;
        return sum;
    }, 0);
    return {
        zone: 'offerings',
        products: products.length,
        workshops: myWorkshops.length,
        sops: mySops.length,
        items: [
            ...products.map(p => ({ kind: 'product',   id: p.id, title: p.content?.title })),
            ...myWorkshops.map(w => ({ kind: 'workshop', id: w.id, title: w.content?.title })),
            ...mySops.map(s => ({ kind: 'sop',         id: s.id, title: s.content?.title })),
        ],
        revenueEur: Number(myRevenue.toFixed(2)),
    };
}

// ─── Zona 8 · NETWORK (permaweb · cross-SOS · triple-entry signal) ────────
function _zoneNetwork({ handle, identityNode, registryEntries, attestations, mode }) {
    if (!_canShow('network', mode, identityNode)) return null;
    const myEntries = (registryEntries || []).filter(e => {
        const ec = e?.content || {};
        return _matches(ec.handle, handle) || _matches(ec.fromHandle, handle);
    });
    const publishedToPermaweb = myEntries.filter(e => e.content?.arweaveTxId && !String(e.content.arweaveTxId).startsWith('MOCK_TX_'));
    const crossSosAttesters = new Set();
    for (const a of (attestations || [])) {
        const ac = a?.content || {};
        if (_matches(ac.toHandle, handle) && ac.sosInstanceId && ac.sosInstanceId !== 'local') {
            crossSosAttesters.add(ac.sosInstanceId);
        }
    }
    return {
        zone: 'network',
        permawebEntries: myEntries.length,
        permawebReal: publishedToPermaweb.length,
        crossSosReach: crossSosAttesters.size,
        tripleEntryProof: 0,   // pendent triple-entry implementació
    };
}

// ─── Core · buildProfile360 ────────────────────────────────────────────────
//
// inputs · canonical · veure _emptyInputs() per a shape
// Retorna · { handle · mode · zones · privacy · timestamp }
export function buildProfile360(inputs) {
    const i = { ..._emptyInputs(), ...(inputs || {}) };
    const mode = i.mode === 'me' ? 'me' : 'public';

    const zones = {
        identity:   _zoneIdentity(i),
        ikigai:     _zoneIkigai(i),
        skills:     _zoneSkills(i),
        knowledge:  _zoneKnowledge(i),
        reputation: _zoneReputation(i),
        work:       _zoneWork(i),
        offerings:  _zoneOfferings(i),
        network:    _zoneNetwork(i),
    };

    const privacy = {
        identity:   _privacyFor('identity',   i.identityNode),
        ikigai:     _privacyFor('ikigai',     i.identityNode),
        skills:     _privacyFor('skills',     i.identityNode),
        knowledge:  _privacyFor('knowledge',  i.identityNode),
        reputation: _privacyFor('reputation', i.identityNode),
        work:       _privacyFor('work',       i.identityNode),
        offerings:  _privacyFor('offerings',  i.identityNode),
        network:    _privacyFor('network',    i.identityNode),
    };

    return {
        version: PROFILE_360_VERSION,
        handle:  _norm(i.handle),
        mode,
        zones,
        privacy,
        timestamp: Date.now(),
    };
}

// ensureMember · auto-crea matriu_member si l'usuari té identity però no member.
// Resol el bug · "ikigai no es guarda quan no tinc matriu_member".
// Pure function · retorna el node · el caller fa KB.upsert.
export function ensureMember({ handle, identityNode, existingMember = null, ts = null } = {}) {
    if (existingMember && existingMember.id) return { member: existingMember, created: false };
    if (!handle || !identityNode) return { member: null, created: false };
    const now = (typeof ts === 'number') ? ts : Date.now();
    const h = _norm(handle).replace(/^@/, '');
    const member = {
        id: 'member-' + h,
        type: 'matriu_member',
        content: {
            handle: h,
            displayName: identityNode.content?.displayName || ('@' + h),
            primaryDid: identityNode.content?.primaryDid || null,
            avatar: identityNode.content?.avatar || null,
            availability: 'available',
            skillsDeclared: [],
            sectorsExperience: [],
            ikigai: null,
            isPrimary: !!identityNode.content?.isPrimary,
            autoCreatedFromIdentity: true,
        },
        keywords: ['type:matriu_member', 'handle:' + h, 'auto-created'],
        createdAt: now,
        updatedAt: now,
    };
    return { member, created: true };
}

// updatePrivacy · pure · merge privacy settings al identityNode.
// Retorna node modificat · caller fa KB.upsert.
export function updatePrivacy(identityNode, privacyPatch = {}) {
    if (!identityNode) throw new Error('identityNode required');
    const current = identityNode.content?.privacy || {};
    const next = { ...current };
    for (const [k, v] of Object.entries(privacyPatch)) {
        if (PRIVACY_MODES.includes(v)) next[k] = v;
    }
    return {
        ...identityNode,
        content: { ...(identityNode.content || {}), privacy: next },
        updatedAt: Date.now(),
    };
}
