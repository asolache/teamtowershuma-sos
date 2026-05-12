// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT QUALITY SERVICE (PROJ-QUALITY-001 sprint A)
//
// Service pur · calcula score multidimensional 0-100 d'un projecte:
//   🎨 Landing       20% · descripció + producte/servei + presentation IA
//   🗺 Value map     30% · roles + transactions + intangibles + cicles
//   🚚 Deliverables  15% · cada role té entregable + owner declarat
//   📋 SOPs          20% · cada role té SOP amb contingut
//   🎓 Workshops     15% · ≥1 workshop · audience + federable
//
// Total ponderat 0-100 · llindar 75 verd · 50 taronja · <50 vermell.
//
// Pur · zero KB.query · l'usuari pre-carrega { sops, workshops,
// marketItems } i els passa com a opts. Tests al `js/tests/projectQuality.test.js`.
// =============================================================================

export const QUALITY_DIMS = Object.freeze([
    Object.freeze({ id: 'landing',      weight: 20, label: 'Landing',      icon: '🎨' }),
    Object.freeze({ id: 'valueMap',     weight: 30, label: 'Value map',    icon: '🗺' }),
    Object.freeze({ id: 'deliverables', weight: 15, label: 'Deliverables', icon: '🚚' }),
    Object.freeze({ id: 'sops',         weight: 20, label: 'SOPs',         icon: '📋' }),
    Object.freeze({ id: 'workshops',    weight: 15, label: 'Workshops',    icon: '🎓' }),
]);

export const QUALITY_THRESHOLDS = Object.freeze({ high: 75, medium: 50 });

// Util · accés a camp pot estar a node arrel o dins .content (KB nodes)
function _get(node, key) {
    if (!node) return undefined;
    if (node.content && node.content[key] !== undefined) return node.content[key];
    return node[key];
}

// ─── Dim 1 · Landing ─────────────────────────────────────────────────────
function scoreLanding(project, { marketItems }) {
    const missing = [];
    let pts = 0;
    const desc = (project.description || project.projectIdea || project.purpose || '').toString();
    if (desc.trim().length >= 60) {
        pts += 40;
    } else {
        missing.push({
            label: 'Descripció del projecte (≥60 caràcters · ara ' + desc.trim().length + ')',
            cta:   { href: '/project/' + project.id, label: 'Editar projecte' },
        });
    }
    const products = (marketItems || []).filter(m => _get(m, 'projectId') === project.id);
    if (products.length >= 1) {
        pts += 30;
    } else {
        missing.push({
            label: '≥1 producte o servei al mercat',
            cta:   { href: '/market', label: 'Crear oferta' },
        });
    }
    if (project.presentation_narrative_v1) {
        pts += 30;
    } else {
        missing.push({
            label: 'Presentation IA generada',
            cta:   { href: '/presentation?project=' + project.id, label: 'Generar amb IA' },
        });
    }
    return { score: pts, missing };
}

// ─── Dim 2 · Value map ───────────────────────────────────────────────────
function _hasReciprocalCycle(txs) {
    const edges = new Set();
    for (const t of txs) {
        if (t && t.from && t.to) edges.add(t.from + '→' + t.to);
    }
    for (const t of txs) {
        if (t && t.from && t.to && t.from !== t.to && edges.has(t.to + '→' + t.from)) return true;
    }
    return false;
}

function scoreValueMap(project) {
    const roles = project.vna_roles        || [];
    const txs   = project.vna_transactions || [];
    const missing = [];
    let pts = 0;

    if (roles.length >= 3) {
        pts += 25;
    } else {
        missing.push({
            label: '≥3 roles definits (ara ' + roles.length + ')',
            cta:   { href: '/map?project=' + project.id, label: 'Editar mapa' },
        });
    }
    if (txs.length >= 5) {
        pts += 25;
    } else {
        missing.push({
            label: '≥5 transaccions (ara ' + txs.length + ')',
            cta:   { href: '/map?project=' + project.id, label: 'Editar mapa' },
        });
    }
    if (txs.some(t => t && t.type === 'intangible')) {
        pts += 25;
    } else {
        missing.push({
            label: '≥1 transacció intangible',
            cta:   { href: '/map?project=' + project.id, label: 'Editar mapa' },
        });
    }
    if (_hasReciprocalCycle(txs)) {
        pts += 25;
    } else {
        missing.push({
            label: 'Cicle recíproc (A↔B mínim)',
            cta:   { href: '/map?project=' + project.id, label: 'Editar mapa' },
        });
    }
    return { score: pts, missing };
}

// ─── Dim 3 · Deliverables ────────────────────────────────────────────────
function scoreDeliverables(project) {
    const roles = project.vna_roles        || [];
    const txs   = project.vna_transactions || [];
    const missing = [];
    if (roles.length === 0) {
        return {
            score: 0,
            missing: [{
                label: 'Defineix roles abans (mapa de valor)',
                cta:   { href: '/map?project=' + project.id, label: 'Editar mapa' },
            }],
        };
    }
    let rolesWithDeliver = 0;
    let rolesWithOwner   = 0;
    for (const r of roles) {
        if (txs.some(t => t.from === r.id && typeof t.deliverable === 'string' && t.deliverable.trim().length > 0)) {
            rolesWithDeliver++;
        }
        if ((r.typical_actor && r.typical_actor.trim()) || (r.owner && String(r.owner).trim())) {
            rolesWithOwner++;
        }
    }
    const cov1 = rolesWithDeliver / roles.length;
    const cov2 = rolesWithOwner   / roles.length;
    const pts = Math.round(cov1 * 70 + cov2 * 30);

    if (cov1 < 1) {
        missing.push({
            label: (roles.length - rolesWithDeliver) + '/' + roles.length + ' roles sense entregable declarat',
            cta:   { href: '/map?project=' + project.id, label: 'Completar transaccions' },
        });
    }
    if (cov2 < 1) {
        missing.push({
            label: (roles.length - rolesWithOwner) + '/' + roles.length + ' roles sense owner / typical_actor',
            cta:   { href: '/map?project=' + project.id, label: 'Assignar owners' },
        });
    }
    return { score: Math.min(100, pts), missing };
}

// ─── Dim 4 · SOPs ────────────────────────────────────────────────────────
function _hasSopContent(sop) {
    const body  = _get(sop, 'body');
    const steps = _get(sop, 'steps');
    if (typeof body === 'string'  && body.trim().length >= 30) return true;
    if (Array.isArray(steps)      && steps.length >= 2)        return true;
    if (typeof steps === 'string' && steps.trim().length >= 30) return true;
    return false;
}

function scoreSops(project, { sops }) {
    const roles = project.vna_roles || [];
    const missing = [];
    if (roles.length === 0) {
        return {
            score: 0,
            missing: [{
                label: 'Defineix roles abans (mapa de valor)',
                cta:   { href: '/map?project=' + project.id, label: 'Editar mapa' },
            }],
        };
    }
    const projectSops = (sops || []).filter(s => _get(s, 'projectId') === project.id);
    let rolesWithSop = 0;
    for (const r of roles) {
        if (projectSops.some(s => _get(s, 'roleId') === r.id && _hasSopContent(s))) {
            rolesWithSop++;
        }
    }
    const cov = rolesWithSop / roles.length;
    const pts = Math.round(cov * 100);
    if (cov < 1) {
        missing.push({
            label: (roles.length - rolesWithSop) + '/' + roles.length + ' roles sense SOP amb contingut',
            cta:   { href: '/sops?project=' + project.id, label: 'Crear/editar SOPs' },
        });
    }
    return { score: pts, missing };
}

// ─── Dim 5 · Workshops ───────────────────────────────────────────────────
function scoreWorkshops(project, { workshops }) {
    const projWorkshops = (workshops || []).filter(w => _get(w, 'projectId') === project.id);
    const missing = [];
    let pts = 0;
    if (projWorkshops.length >= 1) {
        pts += 50;
    } else {
        missing.push({
            label: 'Cap workshop al projecte',
            cta:   { href: '/workshops?project=' + project.id, label: 'Crear workshop' },
        });
    }
    const audiences = new Set(
        projWorkshops.map(w => _get(w, 'audience')).filter(Boolean)
    );
    if (audiences.size >= 1) {
        pts += 25;
    } else if (projWorkshops.length >= 1) {
        missing.push({
            label: 'Cap audience declarada als workshops',
            cta:   { href: '/workshops?project=' + project.id, label: 'Editar audience' },
        });
    }
    const federable = projWorkshops.some(w => {
        const tier = _get(w, 'accessTier') || 'public';
        return tier !== 'private';
    });
    if (federable) {
        pts += 25;
    } else if (projWorkshops.length >= 1) {
        missing.push({
            label: 'Cap workshop federable (≥1 amb tier public/operator/matriu/cohort)',
            cta:   { href: '/workshops?project=' + project.id, label: 'Marcar com a federable' },
        });
    }
    return { score: Math.min(100, pts), missing };
}

// ─── Core · agrupador ────────────────────────────────────────────────────
export function computeQualityScore(project, opts = {}) {
    if (!project || !project.id) {
        return { total: 0, byDim: {}, missing: [], status: 'invalid' };
    }
    const sops        = opts.sops        || [];
    const workshops   = opts.workshops   || [];
    const marketItems = opts.marketItems || [];

    const byDim = {
        landing:      scoreLanding(project,      { marketItems }),
        valueMap:     scoreValueMap(project),
        deliverables: scoreDeliverables(project),
        sops:         scoreSops(project,         { sops }),
        workshops:    scoreWorkshops(project,    { workshops }),
    };

    let total = 0;
    for (const dim of QUALITY_DIMS) {
        const sc = byDim[dim.id] ? byDim[dim.id].score : 0;
        total += sc * (dim.weight / 100);
    }
    total = Math.round(total);

    const missing = [];
    for (const dim of QUALITY_DIMS) {
        const dm = byDim[dim.id] ? byDim[dim.id].missing : [];
        for (const m of dm) missing.push({ dim: dim.id, ...m });
    }

    let status = 'low';
    if (total >= QUALITY_THRESHOLDS.high)        status = 'high';
    else if (total >= QUALITY_THRESHOLDS.medium) status = 'medium';

    return { total, byDim, missing, status };
}

export function statusColor(status) {
    if (status === 'high')   return '#00e676';
    if (status === 'medium') return '#ff9100';
    if (status === 'low')    return '#ff5252';
    return 'var(--text-muted)';
}

export function statusIcon(status) {
    if (status === 'high')   return '🌟';
    if (status === 'medium') return '⚠';
    if (status === 'low')    return '❌';
    return '·';
}
