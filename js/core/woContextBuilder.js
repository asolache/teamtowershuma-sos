// =============================================================================
// TEAMTOWERS SOS V11 — WO CONTEXT BUILDER (KANBAN-IA-SOS sprint A)
//
// Estandarditza el context que rep una IA quan opera sobre un Work Order
// des del Kanban. Honor el nom SOS · Swarm Operative System ·
// principis canònics + sector + subtype + roles + transactions + neural
// path bundle (si existeix) + accounting hints.
//
// Diseny PURE · sense KB · ni IA · ni I/O. Caller passa els refs ja resolts;
// així testem amb mocks sense haver de inicialitzar res.
//
// Ús típic des de KanbanView._executeAi():
//   const ctx = buildWoContext({ wo, project, roles, transactions, bundle });
//   const systemPrompt = ctx.systemPrompt + '\n\n' + existingPrompt;
//
// Retorna · { systemPrompt:string, userHints:string, blockCount:number,
//             warnings:string[] }
// =============================================================================

// Canonical principles · MUST-HONOR header per a cada execució IA al kanban
// (idèntic al sprintOrchestrator · single source of truth a backlogManifest)
const SOS_PRINCIPLES_HEADER = [
    '## SOS · "Swarm Operative System" · principis canònics · MUST-HONOR',
    '1. **Tot són nodes** · zero side-effect intangible · cada output es persisteix com a node KB amb type canonical · tags + keywords.',
    '2. **Tota aportació es comptabilitza** · audit trail · cada acció IA genera un `ai_audit` + `efficiency_log` + opcionalment `wallet movement consume`.',
    '3. **Stripe + stakeholders → pool · 20/80** · si l\'output genera ingrés, divisió automàtica entre operating reserve i stakeholders pool.',
    '4. **Stack tècnic clau** · IA escalation chain · permaweb federation · TEA (triple-entry accounting) · smart contracts · trust score PageRank.',
].join('\n');

// buildWoContext · PURE · construeix el systemPrompt-fragment SOS-branded
//
// args:
//   wo            · node `type:work_order` · usa wo.content.*
//   project       · node project (opcional) · per a sector + projectType
//   roles         · array de role nodes vinculats (opcional · sector-affected)
//   transactions  · array de transaction nodes vinculades (opcional)
//   bundle        · neural_path_bundle (opcional) · context historic IA
//   options:
//     includePrinciples (default true) · injecta el header SOS
//     maxRoles (default 5)
//     maxTransactions (default 5)
//
// Retorna · { systemPrompt, userHints, blockCount, warnings }
export function buildWoContext({
    wo           = null,
    project      = null,
    roles        = [],
    transactions = [],
    bundle       = null,
    options      = {},
} = {}) {
    const opts = {
        includePrinciples: options.includePrinciples !== false,
        maxRoles:          options.maxRoles ?? 5,
        maxTransactions:   options.maxTransactions ?? 5,
    };
    const warnings = [];
    if (!wo || !wo.id) {
        warnings.push('buildWoContext · no WO provided · context limitat');
    }
    const c = (wo && wo.content) || {};
    const blocks = [];

    // Block 0 · SOS principles MUST-HONOR
    if (opts.includePrinciples) {
        blocks.push(SOS_PRINCIPLES_HEADER);
    }

    // Block 1 · Sector context · TPS-canonical
    const sectorId = c.sectorId || project?.content?.sectorId || project?.sector_id || null;
    const projectType = c.projectType || project?.content?.projectType || project?.projectType || null;
    if (sectorId || projectType) {
        const lines = ['## SECTOR · projectType'];
        if (sectorId)    lines.push('Sector · ' + _safe(sectorId));
        if (projectType) lines.push('Project type · ' + _safe(projectType));
        if (project?.content?.iaContextHint || project?.iaContextHint) {
            lines.push('IA context hint · ' + _safe(project.content?.iaContextHint || project.iaContextHint));
        }
        blocks.push(lines.join('\n'));
    } else {
        warnings.push('No sector or projectType inferred · IA context generic');
    }

    // Block 2 · Subtype · entitat específica (subtypeId · subtype_context)
    const subtypeId = c.subtypeId || c.subtype || null;
    if (subtypeId) {
        const lines = ['## SUBTYPE · entitat específica'];
        lines.push('Subtype id · ' + _safe(subtypeId));
        if (c.subtype_context || c.subtypeContext) {
            lines.push('Context · ' + _safe(c.subtype_context || c.subtypeContext));
        }
        blocks.push(lines.join('\n'));
    }

    // Block 3 · Roles afectats (típicament typical_actor del castell + skills)
    if (Array.isArray(roles) && roles.length > 0) {
        const slice = roles.slice(0, opts.maxRoles);
        const lines = ['## ROLES afectats (' + slice.length + (roles.length > slice.length ? '/' + roles.length : '') + ')'];
        for (const r of slice) {
            const rc = (r && r.content) || r || {};
            const name = rc.name || r?.id || '?';
            const lvl  = rc.castell_level || rc.castellLevel;
            const fmv  = rc.fmvPerHour ?? rc.fmv;
            const parts = ['- ' + _safe(name)];
            if (lvl) parts.push('· castell ' + _safe(lvl));
            if (typeof fmv === 'number') parts.push('· FMV ' + fmv + '€/h');
            if (rc.typical_actor) parts.push('· actor ' + _safe(rc.typical_actor));
            lines.push(parts.join(' '));
        }
        if (roles.length > slice.length) lines.push('(...' + (roles.length - slice.length) + ' més)');
        blocks.push(lines.join('\n'));
    }

    // Block 4 · Transactions VNA vinculades
    if (Array.isArray(transactions) && transactions.length > 0) {
        const slice = transactions.slice(0, opts.maxTransactions);
        const lines = ['## TRANSACCIONS VNA vinculades (' + slice.length + (transactions.length > slice.length ? '/' + transactions.length : '') + ')'];
        for (const tx of slice) {
            const tc = (tx && tx.content) || tx || {};
            const parts = [];
            if (tc.from)         parts.push('from ' + _safe(tc.from));
            if (tc.to)           parts.push('to '   + _safe(tc.to));
            if (tc.deliverable)  parts.push('· deliverable ' + _safe(tc.deliverable));
            if (tc.type)         parts.push('· type ' + _safe(tc.type));
            lines.push('- ' + parts.join(' '));
        }
        if (transactions.length > slice.length) lines.push('(...' + (transactions.length - slice.length) + ' més)');
        blocks.push(lines.join('\n'));
    }

    // Block 5 · Neural path bundle (context històric · si existeix)
    if (bundle && (bundle.id || bundle.content)) {
        const bc = bundle.content || bundle;
        const lines = ['## NEURAL PATH BUNDLE · context històric nodal'];
        if (bc.name)        lines.push('Nom · ' + _safe(bc.name));
        if (bc.intent)      lines.push('Intent · ' + _safe(bc.intent));
        if (bc.audienceId)  lines.push('Audiència · ' + _safe(bc.audienceId));
        if (typeof bc.stepCount === 'number') lines.push('Steps · ' + bc.stepCount);
        blocks.push(lines.join('\n'));
    }

    // Block 6 · Accounting hints · TEA contribució
    const accHints = ['## ACCOUNTING HINTS · TEA'];
    if (typeof c.estimatedHours === 'number') accHints.push('Estimated human hours · ' + c.estimatedHours + ' h');
    if (typeof c.fmvPerHour === 'number')     accHints.push('FMV · ' + c.fmvPerHour + ' €/h');
    if (typeof c.estimatedHours === 'number' && typeof c.fmvPerHour === 'number') {
        accHints.push('Equivalent human cost · ' + (c.estimatedHours * c.fmvPerHour).toFixed(2) + ' €');
    }
    if (c.approvalRule)   accHints.push('Approval rule · ' + _safe(c.approvalRule));
    if (c.tddCheck)       accHints.push('TDD check · ' + _safe(c.tddCheck));
    if (c.priority)       accHints.push('Priority · ' + _safe(c.priority));
    if (accHints.length > 1) blocks.push(accHints.join('\n'));

    // Block 7 · Output expectations
    const outputBlock = [
        '## OUTPUT EXPECTATIONS',
        '- Honora els 4 principis SOS · cada decisió ha de ser persistible com a node + auditable.',
        '- Output curt + accionable · evita verbositat innecessària.',
        '- Si has de generar arxius / SOPs / WOs derivats, indica-ho explícitament i suggereix l\'estructura del node KB resultant (type · content shape · tags · keywords).',
    ].join('\n');
    blocks.push(outputBlock);

    const systemPrompt = blocks.join('\n\n');

    // userHints · suggeriment curt per al userPrompt opcional · concatenable
    const userHints = [
        wo?.id ? ('Work Order · ' + wo.id) : null,
        c.title ? ('Títol · ' + c.title) : null,
        c.description ? ('Descripció · ' + c.description.slice(0, 240)) : null,
    ].filter(Boolean).join(' · ');

    return {
        systemPrompt,
        userHints,
        blockCount: blocks.length,
        warnings,
    };
}

// _safe · escapa nous-line per evitar trencar el prompt amb caràcters inesperats
function _safe(v) {
    return String(v ?? '').replace(/[\r\n]+/g, ' ').slice(0, 240);
}
