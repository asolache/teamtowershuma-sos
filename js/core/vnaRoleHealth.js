// =============================================================================
// TEAMTOWERS SOS V11 — vnaRoleHealth (v163.3)
// Implementa c-02.4-analyze-role-health (Matriu D-02 · pilot v0.1) com a
// funcions pures. Calcula Health Score 0-100 per rol d'un mapa VNA basant-se
// en 4 propietats observables + 6 patologies clàssiques + contagi del veïnatge.
//
// Spec font · knowledge/matriu/competencies/c-02.4-analyze-role-health.md
//
// Pure · sense efectes secundaris · directament testable sense DOM/fetch.
// =============================================================================

const SPEC_REF = 'matriu/c-02.4-analyze-role-health';

// Bands · llindars del matriu (Score < 40 urgent · 40-69 attention · 70+ sa)
function bandFor(score) {
    if (score < 40)  return 'urgent';
    if (score < 70)  return 'attention';
    return 'healthy';
}

// _txsForRole · particiona transaccions per rol en in/out + tangible/intangible
function _txsForRole(roleId, txs) {
    const tIn  = []; const tOut = [];
    const iIn  = []; const iOut = [];
    const neighbors = new Set();
    for (const t of txs) {
        if (!t || !t.from || !t.to) continue;
        const isIntang = t.type === 'intangible';
        if (t.to === roleId) {
            if (isIntang) iIn.push(t); else tIn.push(t);
            if (t.from !== roleId) neighbors.add(t.from);
        }
        if (t.from === roleId) {
            if (isIntang) iOut.push(t); else tOut.push(t);
            if (t.to !== roleId) neighbors.add(t.to);
        }
    }
    return {
        tangiblesIn:    tIn,  tangiblesOut:   tOut,
        intangiblesIn:  iIn,  intangiblesOut: iOut,
        allIn:    tIn.length + iIn.length,
        allOut:   tOut.length + iOut.length,
        neighbors,
    };
}

// _propertyChecks · les 4 propietats observables del matriu c-02.4
function _propertyChecks(stats) {
    const props = {};
    // 1 · Reciprocitat · per cada intangible donat n'hi torna almenys un proporcional
    //     KISS · si dona intangibles, ha de rebre'n
    props.reciprocity =
        stats.intangiblesOut.length === 0 ||
        stats.intangiblesIn.length  >= 1;
    // 2 · Densitat · connectat amb 3+ rols (no aïllat · no centralitzat)
    props.density = stats.neighbors.size >= 3;
    // 3 · Equilibri tangible/intangible · NO només tangibles NI només intangibles
    const hasTangibles   = (stats.tangiblesIn.length   + stats.tangiblesOut.length)   > 0;
    const hasIntangibles = (stats.intangiblesIn.length + stats.intangiblesOut.length) > 0;
    props.balance = hasTangibles && hasIntangibles;
    // 4 · Càrrega · ni sobrecàrrega (out >> in) ni infrautilització (in >> out)
    //     KISS · ratio extrem (>3x) o un costat a 0 mentre l'altre supera 0 = fail
    if (stats.allIn === 0 && stats.allOut === 0) {
        props.load = false; // rol totalment desconectat
    } else if (stats.allIn === 0 || stats.allOut === 0) {
        props.load = false; // tot input o tot output
    } else {
        const ratio = Math.max(stats.allIn, stats.allOut) / Math.max(1, Math.min(stats.allIn, stats.allOut));
        props.load = ratio <= 3;
    }
    return props;
}

// _pathologyChecks · les 6 patologies clàssiques del matriu c-02.4
function _pathologyChecks(stats, totalEdges, avgDegree) {
    const path = {};
    // 1 · Orphan · 1 sola connexió
    path.orphan = stats.neighbors.size === 1;
    // 2 · Bottleneck · totes les fluxes hi passen
    //     KISS · degree > 50% del total OR > 2x avg degree
    const degree = stats.allIn + stats.allOut;
    path.bottleneck = totalEdges > 0 && (
        (degree / totalEdges) >= 0.5 ||
        (avgDegree > 0 && degree >= 2 * avgDegree && degree >= 4)
    );
    // 3 · Callejón sin salida · rep intangible · no produeix output
    path.dead_end = stats.intangiblesIn.length > 0 && stats.allOut === 0;
    // 4 · Extractor intangible · rep favors · no torna favors
    path.intangible_extractor =
        stats.intangiblesIn.length  > 0 &&
        stats.intangiblesOut.length === 0;
    // 5 · Donador exhaurit · dona intangibles · no rep res
    path.exhausted_donor =
        stats.intangiblesOut.length > 0 &&
        stats.allIn === 0;
    // 6 · Connector ofegat · molt input + molt output · tot hi passa
    path.drowned_connector =
        stats.allIn  >= 3 &&
        stats.allOut >= 3 &&
        Math.abs(stats.allIn - stats.allOut) <= 1;
    return path;
}

// computeRoleHealth · per a un rol concret · retorna { score, properties,
// pathologies, band }. Sense contagi (cal context global · veure analyzeMapHealth)
export function computeRoleHealth(role, txs, ctx = {}) {
    if (!role || !role.id) return null;
    const stats = _txsForRole(role.id, Array.isArray(txs) ? txs : []);
    const properties = _propertyChecks(stats);
    const pathologies = _pathologyChecks(stats, ctx.totalEdges || 0, ctx.avgDegree || 0);
    let score = 100;
    // −15 per propietat fallada
    for (const k of Object.keys(properties)) if (!properties[k]) score -= 15;
    // −10 per patologia detectada
    for (const k of Object.keys(pathologies)) if (pathologies[k]) score -= 10;
    if (score < 0) score = 0;
    if (score > 100) score = 100;
    return {
        id: role.id,
        name: role.name || role.id,
        score,
        band: bandFor(score),
        properties,
        pathologies: Object.keys(pathologies).filter(k => pathologies[k]),
        neighbors: Array.from(stats.neighbors),
        stats: { in: stats.allIn, out: stats.allOut, intangIn: stats.intangiblesIn.length, intangOut: stats.intangiblesOut.length },
    };
}

// analyzeMapHealth · mapa sencer · retorna { roles[], avg, variance, summary }
// Aplica contagi · si un veí té score < 50 al primer pas · -5 al rol.
export function analyzeMapHealth(map, options = {}) {
    if (!map || typeof map !== 'object') return null;
    const roles = Array.isArray(map.roles) ? map.roles : [];
    const txs   = Array.isArray(map.transactions) ? map.transactions : [];
    if (roles.length === 0) {
        return { roles: [], avg: 0, variance: 0, summary: { healthy: 0, attention: 0, urgent: 0 }, spec: SPEC_REF };
    }
    const totalEdges = txs.length;
    const avgDegree  = roles.length > 0 ? (2 * txs.length) / roles.length : 0;
    const ctx = { totalEdges, avgDegree };

    // Primera passada · sense contagi
    const first = roles.map(r => computeRoleHealth(r, txs, ctx)).filter(x => x);

    // Contagi · -5 per cada veí amb score < 50 (de la primera passada)
    const byId = new Map(first.map(r => [r.id, r]));
    const final = first.map(r => {
        let penalty = 0;
        for (const nId of r.neighbors) {
            const nb = byId.get(nId);
            if (nb && nb.score < 50) penalty += 5;
        }
        const adjusted = Math.max(0, r.score - penalty);
        return { ...r, score: adjusted, band: bandFor(adjusted), contagionPenalty: penalty };
    });

    const scores = final.map(r => r.score);
    const avg = scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length);
    const variance = scores.length > 1
        ? scores.reduce((s, v) => s + (v - avg) ** 2, 0) / scores.length
        : 0;
    const summary = { healthy: 0, attention: 0, urgent: 0 };
    final.forEach(r => { summary[r.band] = (summary[r.band] || 0) + 1; });

    return {
        roles: final,
        avg: Math.round(avg * 10) / 10,
        variance: Math.round(variance * 10) / 10,
        summary,
        spec: SPEC_REF,
    };
}
