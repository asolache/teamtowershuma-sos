// =============================================================================
// TEAMTOWERS SOS V11 — SWARM AFFINITY SERVICE (SWARM-DISCOVERY sprint A)
//
// Calcula afinitat entre 2 projectes per a la secció "🐝 Enjambre · matchmaker
// projecte ↔ enjambre" del ProjectHub. La part de discovery (trobar altres
// projectes afins) anteriorment NO existia · sols el matchmaker INTERNAL
// (asignar seats a roles dins d'un projecte) funcionava.
//
// Aquest mòdul és PURE · zero KB · zero IA · sols funcions de scoring. La
// vista (SwarmDiscoveryPanel) llegeix projectes del KB i les passa aquí.
//
// Algoritme d'afinitat ·
//   score = 0.5 · sectorOverlap + 0.3 · skillJaccard + 0.2 · guardianAlignment
//
//   sectorOverlap   · Jaccard de [sector_id, ...sector_affinity[]]
//   skillJaccard    · Jaccard de lookingForSkills + offeredSkills
//   guardianAlignment · ratio de guardians comuns (0 si no n'hi ha cap)
//
// Filosofia · ponderacions revisables · sector domina (els projectes del
// mateix sector són candidats naturals) · skills secundari · guardian
// terciari (afinitat conceptual / mitològica).
// =============================================================================

const WEIGHTS = Object.freeze({
    sector:   0.5,
    skill:    0.3,
    guardian: 0.2,
});

// scoreProjectAffinity · PURE · 2 projects → { score, breakdown }
//
// project shape · { sectorId?, sector_affinity?[], lookingForSkills?[],
//                   offeredSkills?[], requiredGuardians?[], guardianAffinity?[] }
// Tots els camps opcionals · si manquen, contribució = 0.
//
// Retorna · { score:0..1, breakdown: { sectorScore, skillScore, guardianScore } }
export function scoreProjectAffinity(p1, p2) {
    if (!p1 || !p2) return { score: 0, breakdown: { sectorScore: 0, skillScore: 0, guardianScore: 0 } };
    if (p1.id && p2.id && p1.id === p2.id) {
        return { score: 1, breakdown: { sectorScore: 1, skillScore: 1, guardianScore: 1 }, selfMatch: true };
    }

    const sectorScore   = _jaccard(_sectorsOf(p1), _sectorsOf(p2));
    const skillScore    = _jaccard(_skillsOf(p1),  _skillsOf(p2));
    const guardianScore = _jaccard(_guardiansOf(p1), _guardiansOf(p2));

    const score = WEIGHTS.sector * sectorScore +
                  WEIGHTS.skill  * skillScore  +
                  WEIGHTS.guardian * guardianScore;

    return {
        score:      _round(score),
        breakdown:  {
            sectorScore:   _round(sectorScore),
            skillScore:    _round(skillScore),
            guardianScore: _round(guardianScore),
        },
    };
}

// rankAffinity · PURE · troba els N projects més afins a `target`
//
//   target    · projecte de referència
//   candidates · array de projects · target s'exclou automàticament per id
//   topN      · default 5
//   trustScores · Map<projectId, score> opcional · pondera el ranking final
//
// Retorna · array ordenat DESC per finalScore
//   [{ project, affinity:{ score, breakdown }, trust:number, finalScore }]
//
// finalScore = affinity·0.7 + (trust normalitzat 0..1)·0.3 si trustScores
//              donat · altrament = affinity.score
export function rankAffinity(target, candidates, {
    topN          = 5,
    trustScores   = null,
    minScore      = 0.05,
    trustWeight   = 0.3,
} = {}) {
    if (!target || !Array.isArray(candidates) || candidates.length === 0) return [];
    const aff = WEIGHTS;   // captura per closure si calgués
    void aff;

    // Calcula affinity per a cada candidat (exclou target)
    const list = [];
    for (const cand of candidates) {
        if (!cand || !cand.id) continue;
        if (target.id && cand.id === target.id) continue;
        const a = scoreProjectAffinity(target, cand);
        if (a.score < minScore) continue;
        list.push({ project: cand, affinity: a });
    }

    // Normalitza trust scores a [0..1] (max-scaling)
    let maxTrust = 0;
    if (trustScores instanceof Map) {
        for (const v of trustScores.values()) if (v > maxTrust) maxTrust = v;
    }
    for (const item of list) {
        const rawTrust = (trustScores instanceof Map) ? (trustScores.get(item.project.id) || 0) : 0;
        const normTrust = maxTrust > 0 ? rawTrust / maxTrust : 0;
        item.trust = _round(rawTrust);
        item.trustNorm = _round(normTrust);
        item.finalScore = (trustScores instanceof Map)
            ? _round(item.affinity.score * (1 - trustWeight) + normTrust * trustWeight)
            : _round(item.affinity.score);
    }
    list.sort((a, b) => b.finalScore - a.finalScore);
    return list.slice(0, topN);
}

// findGapSkills · pure · skills que `target` busca i que `cohortMembers`
// (typically seats o altres projectes) PODEN oferir. Útil per a la secció
// "seats que completen el teu projecte".
//   target · projecte amb lookingForSkills[]
//   cohortMembers · array d'entitats amb offeredSkills[] o skills[]
//
// Retorna · array { member, skillsCovered:[], coverage:0..1 } ordenat per coverage DESC
export function findGapSkills(target, cohortMembers = [], { topN = 5 } = {}) {
    if (!target || !Array.isArray(cohortMembers)) return [];
    const wanted = new Set((target.lookingForSkills || target.skills_needed || []).map(_norm));
    if (wanted.size === 0) return [];
    const ranked = [];
    for (const m of cohortMembers) {
        if (!m || !m.id) continue;
        const offered = new Set([
            ...((m.offeredSkills || m.skills || m.content?.offeredSkills || m.content?.skills || [])
                .map(_norm)),
        ]);
        const covered = [];
        for (const w of wanted) if (offered.has(w)) covered.push(w);
        if (covered.length === 0) continue;
        const coverage = covered.length / wanted.size;
        ranked.push({ member: m, skillsCovered: covered, coverage: _round(coverage) });
    }
    ranked.sort((a, b) => b.coverage - a.coverage);
    return ranked.slice(0, topN);
}

// ─── helpers ────────────────────────────────────────────────────────────────

function _sectorsOf(p) {
    const c = p.content || p;
    const arr = [];
    if (c.sectorId)    arr.push(c.sectorId);
    if (c.sector_id)   arr.push(c.sector_id);
    if (c.sectorTT)    arr.push(c.sectorTT);
    if (Array.isArray(c.sector_affinity)) arr.push(...c.sector_affinity);
    if (Array.isArray(c.sectors))         arr.push(...c.sectors);
    return new Set(arr.filter(Boolean).map(_norm));
}

function _skillsOf(p) {
    const c = p.content || p;
    const arr = [
        ...(Array.isArray(c.lookingForSkills) ? c.lookingForSkills : []),
        ...(Array.isArray(c.offeredSkills)    ? c.offeredSkills    : []),
        ...(Array.isArray(c.skills)           ? c.skills           : []),
    ];
    return new Set(arr.filter(Boolean).map(_norm));
}

function _guardiansOf(p) {
    const c = p.content || p;
    const arr = [
        ...(Array.isArray(c.requiredGuardians)  ? c.requiredGuardians  : []),
        ...(Array.isArray(c.guardianAffinity)   ? c.guardianAffinity   : []),
        ...(Array.isArray(c.guardians)          ? c.guardians          : []),
    ];
    return new Set(arr.filter(Boolean).map(_norm));
}

function _jaccard(a, b) {
    if (!(a instanceof Set) || !(b instanceof Set)) return 0;
    if (a.size === 0 || b.size === 0) return 0;
    let intersect = 0;
    for (const x of a) if (b.has(x)) intersect++;
    const union = a.size + b.size - intersect;
    return union > 0 ? intersect / union : 0;
}

function _norm(s) {
    return String(s ?? '').trim().toLowerCase();
}

function _round(n) {
    return Number(Number(n).toFixed(3));
}

export { WEIGHTS as AFFINITY_WEIGHTS };
