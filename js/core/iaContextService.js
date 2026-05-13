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
        'Genera el contingut clau de la landing del projecte. Format ESTRICTE JSON:\n' +
        '{\n' +
        '  "description": "<70-180 chars · qui són, què fan, per qui · sense buzzwords>",\n' +
        '  "productSuggestions": [\n' +
        '    { "title": "<≤60 chars>", "kind": "service|product|workshop|membership",\n' +
        '      "oneLiner": "<≤140 chars · valor concret · sense fluff>" }\n' +
        '  ],\n' +
        '  "presentationNarrative": "# <Hero title accionable>\\n\\n<paràgraf 1 · problema/audiència>\\n\\n<paràgraf 2 · solució + diferenciador>"\n' +
        '}\n' +
        'REGLES estrictes:\n' +
        '- description ≥60 chars · directa · idioma català · zero "innovador", "revolucionari", "best-in-class"\n' +
        '- 1-2 productSuggestions · alineats amb el sector i el purpose\n' +
        '- presentationNarrative ~120-180 paraules · # hero + 2 paràgrafs · markdown vàlid\n' +
        '- Retorna SOLS JSON · zero text fora dels braços {}.';
    const systemPrompt = COMMON_SYSTEM_HEADER +
        '\nDim activa · 🎨 Landing · pes 20% · primer punt de contacte amb el client.' +
        '\nPRIORITZA · claredat sobre creativitat · qui paga vol entendre què guanya.';
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
    const hasIntangible = (project.vna_transactions || []).some(t => t && t.type === 'intangible');
    const userPrompt =
        '## Projecte\n' +
        'Id · ' + project.id + '\n' +
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
        'Suggereix EXTENSIONS al value map · NO substitueixis res existent. Format ESTRICTE JSON:\n' +
        '{\n' +
        '  "addRoles": [\n' +
        '    { "id": "ai-<slug-curt>", "name": "<≤40 chars>",\n' +
        '      "castell_level": "base|tronc|cim", "description": "<≤200 chars · què fa concretament>",\n' +
        '      "typical_actor": "<perfil real ex. Designer Sr.>", "tags": ["sector:x", "skill:y"] }\n' +
        '  ],\n' +
        '  "addTransactions": [\n' +
        '    { "id": "ai-tx-<n>", "from": "<roleId existent o nou>", "to": "<roleId>",\n' +
        '      "deliverable": "<què flueix concretament · ex. \\"feedback estructurat\\">",\n' +
        '      "type": "tangible|intangible", "is_must": true }\n' +
        '  ]\n' +
        '}\n' +
        'REGLES estrictes:\n' +
        '- Genera 1-4 addRoles + 2-6 addTransactions\n' +
        '- ' + (hasIntangible ? 'Ja hi ha intangibles · pots afegir-ne més' : '⚠ NO hi ha intangibles · cal MINIM 1 transaction type:"intangible" (ex. confiança, reputació, feedback)') + '\n' +
        '- Cal ≥1 cicle recíproc · si A→B està definida, afegeix B→A o un triangle A→B→C→A\n' +
        '- ids amb prefix "ai-" per identificar drafts\n' +
        '- Roles existents pots referenciar-los per id sense duplicar-los a addRoles\n' +
        '- Retorna SOLS JSON · zero text fora dels braços {}.';
    const systemPrompt = COMMON_SYSTEM_HEADER +
        '\nDim activa · 🗺 Value map · pes 30% · cor sistèmic del projecte.' +
        '\nPRIORITZA · transactions concrets sobre roles abstractes · qui dóna què a qui i per què.';
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
        'Id · ' + project.id + '\n' +
        'Nom · ' + (project.nombre || project.name) + '\n' +
        'Sector · ' + (project.sector_id || '—') + '\n' +
        'Purpose · ' + ((project.purpose || project.description || '').slice(0, 200)) + '\n' +
        '\n## Roles SENSE entregable declarat (' + rolesWithoutDeliver.length + '/' + roles.length + ')\n' +
        (rolesLines.join('\n') || '— tots tenen entregable · cap a omplir —') + '\n' +
        _buildExtraContextSection(extraContext) +
        '\n## Tasca\n' +
        'Per a CADA role pendent, suggereix 1-2 transactions tangibles + opcionalment 1 intangible.\n' +
        'Format ESTRICTE JSON:\n' +
        '{\n' +
        '  "addTransactions": [\n' +
        '    { "id": "ai-tx-<roleId>-1", "from": "<roleId existent>",\n' +
        '      "to": "@client|@usuari|@comunitat|<altre roleId>",\n' +
        '      "deliverable": "<què lliura concretament · ≤140 chars · sense \\"servei\\" genèric>",\n' +
        '      "type": "tangible|intangible", "is_must": true }\n' +
        '  ]\n' +
        '}\n' +
        'REGLES estrictes:\n' +
        '- from · sempre id EXACTE del role pendent · zero invenció\n' +
        '- to · pot ser un role existent o destí extern @client/@usuari/@comunitat\n' +
        '- deliverable · concret i observable (no "valor", "experiència" sense més)\n' +
        '- Generar 1-2 addTransactions per role · max 8 totals\n' +
        '- Retorna SOLS JSON · zero text fora.';
    const systemPrompt = COMMON_SYSTEM_HEADER +
        '\nDim activa · 🚚 Deliverables · pes 15% · cada role ha de tenir un output mesurable.';
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
// _getSopRoleRef · accepta `roleId` (founderTemplate) i `role_ref`
// (SopsView · ValueMapView · matriuTemplate) per identificar el role al qual
// pertany el SOP. Mantè coherència amb projectQualityService._getRoleRef.
function _getSopRoleRef(s) {
    if (!s) return null;
    const c = s.content || {};
    return c.roleId || c.role_ref || c.roleRef || c.role_id
        || s.roleId  || s.role_ref || s.roleRef || s.role_id
        || null;
}
export function buildSopsContext({ project, sops = [], sectorReadiness = null, extraContext = null } = {}) {
    if (!project || !project.id) throw new Error('buildSopsContext requires project');
    const refs = [{ nodeId: project.id, type: 'project' }];
    const roles = project.vna_roles || [];
    const projSops = (sops || []).filter(s => (s.content?.projectId || s.projectId) === project.id);
    projSops.forEach(s => _addRef(refs, s));
    const rolesWithoutSop = roles.filter(r => !projSops.some(s => _getSopRoleRef(s) === r.id));
    const rolesLines = rolesWithoutSop.slice(0, 6).map(r => '- ' + r.id + ' · ' + r.name + (r.typical_actor ? ' · actor: ' + r.typical_actor : '') + (r.description ? ' · ' + r.description.slice(0, 70) : ''));
    const examples = projSops.slice(0, 3).map(s => {
        const c = s.content || s;
        const title = (c.title || c.name || '?').toString().slice(0, 50);
        const role  = _getSopRoleRef(s) || '?';
        const stepCount = Array.isArray(c.steps) ? c.steps.length : 0;
        return '- "' + title + '" (role ' + role + (stepCount ? ' · ' + stepCount + ' steps' : '') + ')';
    });
    const purpose = (project.purpose || project.description || '').slice(0, 240);
    const userPrompt =
        '## Projecte\n' +
        'Id · ' + project.id + '\n' +
        'Nom · ' + (project.nombre || project.name) + '\n' +
        'Sector · ' + (project.sector_id || project.sectorId || '—') + '\n' +
        (purpose ? 'Purpose · ' + purpose + '\n' : '') +
        '\n## SOPs ja existents (' + projSops.length + ')\n' + (examples.join('\n') || '— cap encara —') + '\n' +
        '\n## Roles que necessiten SOP (' + rolesWithoutSop.length + '/' + roles.length + ')\n' + (rolesLines.join('\n') || '— tots cobertats —') + '\n' +
        '\n## Context sector\n' + (sectorReadiness || '—') + '\n' +
        _buildExtraContextSection(extraContext) +
        '\n## Tasca\n' +
        'Per a CADA role pendent (max 5), draftea un SOP operatiu, executable.\n' +
        'Format ESTRICTE JSON (sense text addicional ni markdown):\n' +
        '{\n' +
        '  "newSops": [\n' +
        '    {\n' +
        '      "roleId": "<id exacte del role · sense prefix ai->",\n' +
        '      "title": "<≤60 chars · descriu funció clau · verb implícit>",\n' +
        '      "steps": [\n' +
        '        "<verb imperatiu> <objecte> <criteri d\'èxit>",\n' +
        '        "... 4-6 steps més, ordre cronològic, sense pleonasmes"\n' +
        '      ]\n' +
        '    }\n' +
        '  ]\n' +
        '}\n' +
        'REGLES estrictes:\n' +
        '- 5-7 steps per SOP · cada step ≤140 chars · idioma català\n' +
        '- Cada step comença amb verb imperatiu (Verificar, Documentar, Coordinar…)\n' +
        '- Inclou ≥1 step amb mètrica/criteri d\'èxit (ex. "fins assolir >90% NPS")\n' +
        '- roleId · referència EXACTA al id del role pendent (no inventar)\n' +
        '- Si no hi ha roles pendents, retorna {"newSops":[]}';
    const systemPrompt = COMMON_SYSTEM_HEADER +
        '\nDim activa · 📋 SOPs · pes 20% · cor de l\'execució operativa.' +
        '\nPRIORITZA · steps accionables sobre descripcions abstractes.';
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
        'Id · ' + project.id + '\n' +
        'Nom · ' + (project.nombre || project.name) + '\n' +
        'Sector · ' + (project.sector_id || '—') + '\n' +
        'Purpose · ' + ((project.purpose || project.description || '').slice(0, 200)) + '\n' +
        '\n## Workshops existents (' + projWorkshops.length + ')\n' +
        (projWorkshops.length
            ? projWorkshops.slice(0, 3).map(w => '- ' + (w.content?.title || '?').slice(0, 50) + ' · audience: ' + (w.content?.audience || '—') + ' · tier: ' + (w.content?.accessTier || 'public')).join('\n')
            : '— cap encara —') + '\n' +
        '\n## Context sector\n' + (sectorReadiness || '—') + '\n' +
        _buildExtraContextSection(extraContext) +
        '\n## Tasca\n' +
        (projWorkshops.length
            ? 'Hi ha ' + projWorkshops.length + ' workshop(s). Suggereix 1-2 NOUS que cobreixin audiences que falten.'
            : 'Estat buit · genera 2-3 workshops base que reflecteixin el purpose del projecte.') + '\n' +
        'Format ESTRICTE JSON:\n' +
        '{\n' +
        '  "newWorkshops": [\n' +
        '    { "title": "<≤60 chars · accionable · sense «curs de»>",\n' +
        '      "audience": "founders|operators|cohort|clients|comunitat",\n' +
        '      "accessTier": "public|operator|matriu|cohort",\n' +
        '      "outline": "## Que aprendràs\\n- punt 1\\n- punt 2\\n- punt 3\\n\\n## Format\\n<durada · síncron/asíncron · cohorts>" }\n' +
        '  ]\n' +
        '}\n' +
        'REGLES estrictes:\n' +
        '- 2-3 workshops si llista buida · 1-2 si ja n\'hi ha\n' +
        '- Audiences ja cobertes · ' + (Array.from(existingAudiences).join(', ') || '—') + ' · prioritza les NO cobertes\n' +
        '- accessTier · "public" per descoberta · "operator/matriu" per intermedi · "cohort" per programa pagat\n' +
        '- outline · markdown amb llista 3-6 bullets concrets + format (durada + síncron/asíncron)\n' +
        '- Retorna SOLS JSON · zero text fora.';
    const systemPrompt = COMMON_SYSTEM_HEADER +
        '\nDim activa · 🎓 Workshops · pes 15% · canal d\'expansió i monetització.';
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
