// =============================================================================
// TEAMTOWERS SOS V11 — IA CONTEXT SERVICE (IA-CONTEXT-001 sprint A)
//
// Service pur · construeix prompts amb context KB intel·ligent per a cada
// dim del /quality?project={id}. Eficiència de context · zero crides IA ·
// sols pre-lectura local. El consumidor (aiFillService) afegeix el bloc
// final amb la "petició concreta" a generar.
//
// Filosofia · cada builder retorna { systemPrompt, userPrompt, contextTokens,
// refs:[{nodeId, type}] } · el contextTokens és una estimació conservadora
// (chars/4) per al budgeting del runEscalation. Els refs serveixen per
// l'ai_audit log per que sigui auditable.
//
// PURO · zero KB.query · els arrays pre-carregats (sops · workshops ·
// marketItems · similarProjects) arriben com a opts.
// =============================================================================

const APPROX_CHARS_PER_TOKEN = 4;       // GPT-style heurística · prou aproximat

function _approxTokens(text) {
    if (typeof text !== 'string') return 0;
    return Math.ceil(text.length / APPROX_CHARS_PER_TOKEN);
}

function _addRef(refs, node) {
    if (!node || !node.id) return;
    refs.push({ nodeId: node.id, type: node.type || 'unknown' });
}

// IA-CONTEXT-001 sprint B · context extra opcional · l'usuari pot pegar
// URLs (text scraped futur · sprint B2), text lliure o llegir docs. Aquest
// helper trunca a max 2000 chars (~500 tokens) per evitar overflow del
// system prompt + budget.
const EXTRA_CONTEXT_MAX_CHARS = 2000;
function _buildExtraContextSection(extraContext) {
    if (!extraContext || typeof extraContext !== 'string') return '';
    const trimmed = extraContext.trim();
    if (!trimmed) return '';
    const clipped = trimmed.length > EXTRA_CONTEXT_MAX_CHARS
        ? trimmed.slice(0, EXTRA_CONTEXT_MAX_CHARS - 3) + '…'
        : trimmed;
    return '\n\n## Context addicional (input usuari)\n' + clipped + '\n';
}
export { EXTRA_CONTEXT_MAX_CHARS };

const COMMON_SYSTEM_HEADER = `Ets una IA assistent del SOS V11 · sistema operatiu col·laboratiu.
Generes drafts breus i estructurats que un operador humà revisarà abans d'acceptar.
PRIORITAT · qualitat semàntica sobre extensió. Format estricte JSON quan se't demana.
Idioma de resposta · català per defecte (manté el to del context).`;

// ─── Dim 1 · Landing context ──────────────────────────────────────────────
export function buildLandingContext({
    project,
    sectorReadiness = null,   // opcional · descripció del sector base
    marketItems     = [],     // items del market lligats al projecte
    similarProjects = [],     // descriptors de projectes públics del permaweb
    extraContext    = null,   // IA-CONTEXT-001 sprint B · usuari pot afegir context
} = {}) {
    if (!project || !project.id) throw new Error('buildLandingContext requires project');
    const refs = [];
    _addRef(refs, project);
    const productLines = marketItems
        .filter(m => (m.content?.projectId || m.projectId) === project.id)
        .slice(0, 5)
        .map(m => {
            _addRef(refs, m);
            const title = (m.content?.title || m.title || 'sense títol').slice(0, 60);
            const kind  = m.content?.kind || m.kind || '';
            return '- ' + title + (kind ? ' · ' + kind : '');
        });
    const peerLines = similarProjects.slice(0, 3).map(p => {
        if (p && p.id) _addRef(refs, p);
        return '- ' + (p.name || p.title || p.id || '?') + ' · ' + (p.sectorId || p.sector || '?');
    });
    const userPrompt =
        '## Projecte\n' +
        'Id · ' + project.id + '\n' +
        'Nom · ' + (project.nombre || project.name || project.id) + '\n' +
        'Sector · ' + (project.sector_id || project.sectorId || '—') + '\n' +
        (project.description ? ('Descripció existent · ' + project.description.slice(0, 300) + '\n') : '') +
        (project.purpose ? ('Purpose · ' + project.purpose.slice(0, 300) + '\n') : '') +
        '\n## Context del sector\n' + (sectorReadiness || '—') + '\n' +
        '\n## Productes/serveis al market\n' + (productLines.length ? productLines.join('\n') : '— cap encara —') + '\n' +
        '\n## Projectes similars descobrits al permaweb\n' + (peerLines.length ? peerLines.join('\n') : '— cap encara —') + '\n' +
        _buildExtraContextSection(extraContext) +
        '\n## Tasca\n' +
        'Genera DRAFT JSON per a la dim "Landing" amb camps:\n' +
        '  description (≥60 chars · narratiu directe · sense buzzwords)\n' +
        '  productSuggestions [{title, kind, oneLiner}]  (1-2 items)\n' +
        '  presentationNarrative (markdown ~150 paraules · # hero · 2 paràgrafs)\n' +
        'Retorna SOLS JSON · zero text fora.';
    const systemPrompt = COMMON_SYSTEM_HEADER + '\nDim activa · 🎨 Landing · pes 20% al projectQualityService.';
    return {
        systemPrompt,
        userPrompt,
        contextTokens: _approxTokens(systemPrompt + userPrompt),
        refs,
        dim: 'landing',
        hasExtraContext: !!(extraContext && extraContext.trim()),
    };
}

// ─── Dim 2 · Value map context ────────────────────────────────────────────
export function buildValueMapContext({
    project,
    sectorReadiness = null,
    similarProjects = [],
    criticalRoles   = [],   // skills/critical roles catalog (opcional)
    extraContext    = null,
} = {}) {
    if (!project || !project.id) throw new Error('buildValueMapContext requires project');
    const refs = [];
    _addRef(refs, project);
    const existingRoles = (project.vna_roles || []).slice(0, 8).map(r => '- ' + r.name + ' · ' + (r.castell_level || '—') + ' · ' + (r.description || '').slice(0, 80));
    const existingTx    = (project.vna_transactions || []).slice(0, 12).map(t => '- ' + t.from + '→' + t.to + ' · ' + (t.deliverable || '').slice(0, 70) + ' (' + t.type + ')');
    const criticalLines = criticalRoles.slice(0, 8).map(r => '- ' + (r.name || r.id) + (r.audience ? ' · ' + r.audience : ''));
    const peerLines     = similarProjects.slice(0, 3).map(p => {
        if (p && p.id) _addRef(refs, p);
        return '- ' + (p.name || p.id) + ' · ' + (p.sectorId || '?') + ' · ' + (p.rolesCount || '?') + ' roles';
    });
    const userPrompt =
        '## Projecte\n' +
        'Nom · ' + (project.nombre || project.name) + '\n' +
        'Sector · ' + (project.sector_id || '—') + '\n' +
        'Purpose · ' + ((project.purpose || project.description || '').slice(0, 240)) + '\n' +
        '\n## Roles actuals (' + existingRoles.length + ')\n' + (existingRoles.length ? existingRoles.join('\n') : '— cap encara —') + '\n' +
        '\n## Transactions actuals (' + existingTx.length + ')\n' + (existingTx.length ? existingTx.join('\n') : '— cap encara —') + '\n' +
        '\n## Context · sector\n' + (sectorReadiness || '—') + '\n' +
        '\n## Roles crítics catàleg\n' + (criticalLines.join('\n') || '—') + '\n' +
        '\n## Projectes similars\n' + (peerLines.join('\n') || '—') + '\n' +
        _buildExtraContextSection(extraContext) +
        '\n## Tasca\n' +
        'Suggereix EXTENSIONS · NO replaces · al value map. Format JSON:\n' +
        '  addRoles    [{id, name, castell_level, description, typical_actor, tags}]\n' +
        '  addTransactions [{id, from, to, deliverable, type (tangible|intangible), is_must}]\n' +
        'Garanteix ≥1 intangible nova si encara no n\'hi ha · ≥1 cicle recíproc.\n' +
        'Retorna SOLS JSON · ids amb prefix "ai-" per identificar.';
    const systemPrompt = COMMON_SYSTEM_HEADER + '\nDim activa · 🗺 Value map · pes 30% (la més important · cor del SOS).';
    return {
        systemPrompt,
        userPrompt,
        contextTokens: _approxTokens(systemPrompt + userPrompt),
        refs,
        hasExtraContext: !!(extraContext && extraContext.trim()),
        dim: 'valueMap',
    };
}

// ─── Dim 3 · Deliverables context ─────────────────────────────────────────
export function buildDeliverablesContext({ project, extraContext = null } = {}) {
    if (!project || !project.id) throw new Error('buildDeliverablesContext requires project');
    const refs = [{ nodeId: project.id, type: 'project' }];
    const roles = project.vna_roles || [];
    const txs   = project.vna_transactions || [];
    const rolesWithoutDeliver = roles.filter(r => !txs.some(t => t.from === r.id && (t.deliverable || '').trim().length > 0));
    const rolesLines = rolesWithoutDeliver.slice(0, 10).map(r => '- ' + r.id + ' · ' + r.name + (r.description ? ' · ' + r.description.slice(0, 80) : ''));
    const userPrompt =
        '## Projecte\n' +
        'Nom · ' + (project.nombre || project.name) + '\n' +
        'Sector · ' + (project.sector_id || '—') + '\n' +
        '\n## Roles SENSE entregable declarat (' + rolesWithoutDeliver.length + '/' + roles.length + ')\n' +
        (rolesLines.join('\n') || '— tots tenen entregable · cap a omplir —') + '\n' +
        _buildExtraContextSection(extraContext) +
        '\n## Tasca\n' +
        'Per a cada role sense entregable, suggereix 1-2 transactions tangibles + 1 intangible. Format JSON:\n' +
        '  addTransactions [{id (prefix "ai-"), from (roleId), to (roleId · pot ser nou ad-hoc tipus client/usuari/comunitat), deliverable, type, is_must}]\n' +
        'Si cal inventar un destí extern, usa "@client" "@usuari" "@comunitat" com a from/to.';
    const systemPrompt = COMMON_SYSTEM_HEADER + '\nDim activa · 🚚 Deliverables · pes 15%.';
    return {
        systemPrompt,
        userPrompt,
        contextTokens: _approxTokens(systemPrompt + userPrompt),
        refs,
        dim: 'deliverables',
        hasExtraContext: !!(extraContext && extraContext.trim()),
    };
}

// ─── Dim 4 · SOPs context ─────────────────────────────────────────────────
export function buildSopsContext({ project, sops = [], sectorReadiness = null, extraContext = null } = {}) {
    if (!project || !project.id) throw new Error('buildSopsContext requires project');
    const refs = [{ nodeId: project.id, type: 'project' }];
    const roles = project.vna_roles || [];
    const projSops = (sops || []).filter(s => (s.content?.projectId || s.projectId) === project.id);
    projSops.forEach(s => _addRef(refs, s));
    const rolesWithoutSop = roles.filter(r => !projSops.some(s => (s.content?.roleId || s.roleId) === r.id));
    const rolesLines = rolesWithoutSop.slice(0, 6).map(r => '- ' + r.id + ' · ' + r.name + (r.typical_actor ? ' · actor: ' + r.typical_actor : ''));
    const examples = projSops.slice(0, 2).map(s => {
        const c = s.content || s;
        return '- "' + (c.title || '?').slice(0, 50) + '" (role ' + (c.roleId || '?') + ')';
    });
    const userPrompt =
        '## Projecte\n' +
        'Nom · ' + (project.nombre || project.name) + '\n' +
        'Sector · ' + (project.sector_id || '—') + '\n' +
        '\n## SOPs ja existents (' + projSops.length + ')\n' + (examples.join('\n') || '— cap encara —') + '\n' +
        '\n## Roles que necessiten SOP (' + rolesWithoutSop.length + ')\n' + (rolesLines.join('\n') || '— tots cobertats —') + '\n' +
        '\n## Context sector\n' + (sectorReadiness || '—') + '\n' +
        _buildExtraContextSection(extraContext) +
        '\n## Tasca\n' +
        'Per cada role pendent, draftea un SOP. Format JSON:\n' +
        '  newSops [{roleId, title (≤60 chars), steps [5-7 strings d\'acció directa · imperatiu]}]\n' +
        'Cada step ha de començar amb verb d\'acció · ordre cronològic. Idioma · català.';
    const systemPrompt = COMMON_SYSTEM_HEADER + '\nDim activa · 📋 SOPs · pes 20%.';
    return {
        systemPrompt,
        userPrompt,
        contextTokens: _approxTokens(systemPrompt + userPrompt),
        refs,
        dim: 'sops',
        hasExtraContext: !!(extraContext && extraContext.trim()),
    };
}

// ─── Dim 5 · Workshops context ────────────────────────────────────────────
export function buildWorkshopsContext({ project, workshops = [], sectorReadiness = null, extraContext = null } = {}) {
    if (!project || !project.id) throw new Error('buildWorkshopsContext requires project');
    const refs = [{ nodeId: project.id, type: 'project' }];
    const projWorkshops = (workshops || []).filter(w => (w.content?.projectId || w.projectId) === project.id);
    projWorkshops.forEach(w => _addRef(refs, w));
    const existingAudiences = new Set(projWorkshops.map(w => w.content?.audience || w.audience).filter(Boolean));
    const userPrompt =
        '## Projecte\n' +
        'Nom · ' + (project.nombre || project.name) + '\n' +
        'Sector · ' + (project.sector_id || '—') + '\n' +
        'Purpose · ' + ((project.purpose || project.description || '').slice(0, 200)) + '\n' +
        '\n## Workshops existents (' + projWorkshops.length + ')\n' +
        projWorkshops.slice(0, 3).map(w => '- ' + (w.content?.title || '?').slice(0, 50) + ' · audience: ' + (w.content?.audience || '—')).join('\n') + '\n' +
        '\n## Context sector\n' + (sectorReadiness || '—') + '\n' +
        _buildExtraContextSection(extraContext) +
        '\n## Tasca\n' +
        'Si l\'estat és buit · genera 2-3 workshops base. Si ja n\'hi ha · suggereix 1-2 que cobreixin audiences que falten. Format JSON:\n' +
        '  newWorkshops [{title (≤60 chars), audience (founders|operators|cohort|clients|comunitat), accessTier (public|operator|matriu|cohort), outline (2-4 línies markdown amb llista de continguts)}]\n' +
        'Existing audiences detectades · ' + (Array.from(existingAudiences).join(', ') || '—') + '\n' +
        'Triar accessTier coherent · "public" per descoberta · "cohort" per programes premium.';
    const systemPrompt = COMMON_SYSTEM_HEADER + '\nDim activa · 🎓 Workshops · pes 15%.';
    return {
        systemPrompt,
        userPrompt,
        contextTokens: _approxTokens(systemPrompt + userPrompt),
        refs,
        dim: 'workshops',
        hasExtraContext: !!(extraContext && extraContext.trim()),
    };
}

// ─── Map dim → builder ────────────────────────────────────────────────────
export const DIM_BUILDERS = Object.freeze({
    landing:      buildLandingContext,
    valueMap:     buildValueMapContext,
    deliverables: buildDeliverablesContext,
    sops:         buildSopsContext,
    workshops:    buildWorkshopsContext,
});

// Mapeja dim id → taskKind d'aiRouterService per a coherència
export const DIM_TO_TASK_KIND = Object.freeze({
    landing:      'creative-narrative',
    valueMap:     'value-map-design',
    deliverables: 'schema-fill-simple',
    sops:         'sop-structured',
    workshops:    'workshop-outline',
});

// Helper genèric · invoca el builder correcte per dim id
export function buildContextForDim(dimId, ctx = {}) {
    const fn = DIM_BUILDERS[dimId];
    if (!fn) throw new Error('buildContextForDim · dim desconegut: ' + dimId);
    return fn(ctx);
}
