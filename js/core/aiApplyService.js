// =============================================================================
// TEAMTOWERS SOS V11 — AI APPLY SERVICE (IA-CONTEXT-001 sprint C)
//
// Service pur · pren el parsedDraft retornat per aiFillDim i el converteix
// en accions concretes (project updates + KB writes) que el consumidor
// pot aplicar amb store.dispatch + KB.upsert.
//
// Filosofia · mai destrueix dades existents · sols afegeix. Detecta
// duplicats per id i els salta. Retorna un summary per al toast UX.
//
// PURO · zero KB.query · zero store.dispatch · el caller decideix el
// transport. Cada applier retorna:
//   { updates:object, kbWrites:Array, summary:string, applied:boolean }
// =============================================================================

function _uid(prefix = 'ai-') {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function _clean(s, max = 1000) {
    if (s === null || s === undefined) return '';
    const str = String(s).trim();
    return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

// ─── Apply · Landing ────────────────────────────────────────────────────
//   parsedDraft shape · LANDING-UNIFY-001 · estructura compatible amb
//   PresentationView (legible directament a /presentation):
//     { heroTag, heroTitle, heroMantra, description, bodyMarkdown,
//       roleDescriptions:{<roleId>:str}, productSuggestions[], audienceId? }
//   El draft legacy (només `presentationNarrative` string) també és acceptat
//   per retro-compat · el storejem com a bodyMarkdown.
export function applyLanding(parsedDraft, project) {
    const updates  = {};
    const kbWrites = [];
    if (!parsedDraft || !project) return { updates, kbWrites, summary: 'no-op', applied: false };

    // description al projecte (camp directe · usat a /project + value map)
    if (parsedDraft.description && typeof parsedDraft.description === 'string') {
        updates.description = _clean(parsedDraft.description, 1000);
    }

    // LANDING-UNIFY-001 · construïm SEMPRE un objecte narrative · PresentationView
    // espera shape · { heroTag, heroTitle, heroMantra, roleDescriptions, ... }
    // Si el draft només té el camp legacy `presentationNarrative`, el conservem
    // dins `bodyMarkdown` per a retro-compat (no es perd).
    const existingNarr = (project.presentation_narrative_v1 && typeof project.presentation_narrative_v1 === 'object')
        ? project.presentation_narrative_v1 : null;
    const narrative = {
        heroTag:    parsedDraft.heroTag   ? _clean(parsedDraft.heroTag, 80)    : (existingNarr?.heroTag    || null),
        heroTitle:  parsedDraft.heroTitle ? _clean(parsedDraft.heroTitle, 120) : (existingNarr?.heroTitle  || null),
        heroMantra: parsedDraft.heroMantra? _clean(parsedDraft.heroMantra,240) : (existingNarr?.heroMantra || null),
        bodyMarkdown: typeof parsedDraft.bodyMarkdown === 'string'
            ? _clean(parsedDraft.bodyMarkdown, 4000)
            : (typeof parsedDraft.presentationNarrative === 'string'
                ? _clean(parsedDraft.presentationNarrative, 4000)
                : (existingNarr?.bodyMarkdown || null)),
        roleDescriptions: (parsedDraft.roleDescriptions && typeof parsedDraft.roleDescriptions === 'object')
            ? Object.fromEntries(
                Object.entries(parsedDraft.roleDescriptions)
                    .slice(0, 50)
                    .filter(([k, v]) => typeof k === 'string' && typeof v === 'string' && v.trim())
                    .map(([k, v]) => [k.slice(0, 64), _clean(v, 240)])
              )
            : (existingNarr?.roleDescriptions || {}),
        audienceId: parsedDraft.audienceId || existingNarr?.audienceId || null,
        generatedAt: Date.now(),
    };
    // Nomès persistim si almenys 1 camp principal és present (no escrivim
    // objecte buit que clobbery una narrativa anterior)
    const hasNarrative = narrative.heroTitle || narrative.heroTag || narrative.heroMantra
        || narrative.bodyMarkdown || (Object.keys(narrative.roleDescriptions).length > 0);
    if (hasNarrative) {
        updates.presentation_narrative_v1 = narrative;
    }

    let products = 0;
    if (Array.isArray(parsedDraft.productSuggestions)) {
        for (const p of parsedDraft.productSuggestions) {
            if (!p || !p.title) continue;
            kbWrites.push({
                id:   'market-' + _uid(),
                type: 'market_item',
                content: {
                    projectId:   project.id,
                    title:       _clean(p.title, 100),
                    kind:        _clean(p.kind || 'service', 30),
                    description: _clean(p.oneLiner || p.description || '', 300),
                    createdBy:   'ai-fill',
                    accessTier:  'public',
                },
                keywords:  ['type:market_item', 'projectId:' + project.id, 'source:ai-fill'],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            products++;
        }
    }
    updates.updatedAt = Date.now();
    const parts = [];
    if (updates.description) parts.push('description');
    if (hasNarrative) {
        const narrParts = [];
        if (narrative.heroTitle)  narrParts.push('hero');
        if (narrative.bodyMarkdown) narrParts.push('body');
        if (Object.keys(narrative.roleDescriptions).length) narrParts.push(Object.keys(narrative.roleDescriptions).length + ' roleDesc');
        parts.push('landing ' + (narrParts.length ? narrParts.join('+') : 'IA'));
    }
    if (products) parts.push(products + ' producte' + (products === 1 ? '' : 's'));
    return {
        updates,
        kbWrites,
        summary: parts.length ? '+ ' + parts.join(' · ') : 'res nou per aplicar',
        applied: parts.length > 0,
    };
}

// ─── Apply · Value map ──────────────────────────────────────────────────
//   parsedDraft shape · { addRoles[{id,name,castell_level,description,typical_actor,tags}], addTransactions[…] }
export function applyValueMap(parsedDraft, project) {
    const updates  = {};
    const kbWrites = [];
    if (!parsedDraft || !project) return { updates, kbWrites, summary: 'no-op', applied: false };

    const existingRoles = Array.isArray(project.vna_roles) ? project.vna_roles.slice() : [];
    const seenRoles     = new Set(existingRoles.map(r => r.id));
    let addedRoles = 0;
    if (Array.isArray(parsedDraft.addRoles)) {
        for (const r of parsedDraft.addRoles) {
            if (!r || !r.id) continue;
            const id = String(r.id).slice(0, 64);
            if (seenRoles.has(id)) continue;
            existingRoles.push({
                id,
                name:          _clean(r.name || id, 80),
                castell_level: _clean(r.castell_level || 'tronc', 24),
                description:   _clean(r.description || '', 400),
                typical_actor: _clean(r.typical_actor || '', 80),
                tags:          Array.isArray(r.tags) ? r.tags.slice(0, 8).map(t => _clean(t, 30)) : [],
            });
            seenRoles.add(id);
            addedRoles++;
        }
        if (addedRoles > 0) updates.vna_roles = existingRoles;
    }

    const existingTx = Array.isArray(project.vna_transactions) ? project.vna_transactions.slice() : [];
    const seenTx     = new Set(existingTx.map(t => t.id));
    let addedTx = 0;
    if (Array.isArray(parsedDraft.addTransactions)) {
        for (const tx of parsedDraft.addTransactions) {
            if (!tx || !tx.id || !tx.from || !tx.to) continue;
            const id = String(tx.id).slice(0, 64);
            if (seenTx.has(id)) continue;
            existingTx.push({
                id,
                from:        _clean(tx.from, 64),
                to:          _clean(tx.to, 64),
                deliverable: _clean(tx.deliverable || '', 200),
                type:        tx.type === 'intangible' ? 'intangible' : 'tangible',
                is_must:     !!tx.is_must,
                frequency:   _clean(tx.frequency || 'mensual', 24),
            });
            seenTx.add(id);
            addedTx++;
        }
        if (addedTx > 0) updates.vna_transactions = existingTx;
    }

    updates.updatedAt = Date.now();
    const parts = [];
    if (addedRoles) parts.push(addedRoles + ' role' + (addedRoles === 1 ? '' : 's'));
    if (addedTx)    parts.push(addedTx + ' transaction' + (addedTx === 1 ? '' : 's'));
    return {
        updates,
        kbWrites,
        summary: parts.length ? '+ ' + parts.join(' · ') : 'res nou per aplicar',
        applied: parts.length > 0,
    };
}

// ─── Apply · Deliverables ───────────────────────────────────────────────
//   parsedDraft shape · { addTransactions[{id,from,to,deliverable,type,is_must}] }
export function applyDeliverables(parsedDraft, project) {
    // Mateix patró que value map però només addTransactions
    if (!parsedDraft || !Array.isArray(parsedDraft.addTransactions)) {
        return { updates: {}, kbWrites: [], summary: 'no-op', applied: false };
    }
    return applyValueMap({ addTransactions: parsedDraft.addTransactions }, project);
}

// ─── Apply · SOPs ───────────────────────────────────────────────────────
//   parsedDraft shape · { newSops[{roleId, title, steps[]}] }
export function applySops(parsedDraft, project) {
    const updates  = {};
    const kbWrites = [];
    if (!parsedDraft || !project) return { updates, kbWrites, summary: 'no-op', applied: false };
    if (!Array.isArray(parsedDraft.newSops)) return { updates, kbWrites, summary: 'no-op', applied: false };

    let added = 0;
    for (const s of parsedDraft.newSops) {
        if (!s || !s.roleId || !Array.isArray(s.steps) || s.steps.length === 0) continue;
        const steps = s.steps.slice(0, 12).map(st => _clean(String(st), 280));
        const title = _clean(s.title || 'SOP role ' + s.roleId, 80);
        kbWrites.push({
            id:   'sop-ai-' + _uid(),
            type: 'sop',
            content: {
                projectId: project.id,
                roleId:    String(s.roleId).slice(0, 64),
                title,
                body:      steps.map((step, i) => (i + 1) + '. ' + step).join('\n\n'),
                steps,
                kind:      'project-role-sop',
                createdBy: 'ai-fill',
            },
            keywords:  ['type:sop', 'projectId:' + project.id, 'roleId:' + s.roleId, 'source:ai-fill'],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        added++;
    }
    return {
        updates,
        kbWrites,
        summary: added ? '+ ' + added + ' SOP' + (added === 1 ? '' : 's') : 'res nou per aplicar',
        applied: added > 0,
    };
}

// ─── Apply · Workshops ──────────────────────────────────────────────────
//   parsedDraft shape · { newWorkshops[{title, audience, accessTier, outline, cohortNumber?}] }
export function applyWorkshops(parsedDraft, project) {
    const updates  = {};
    const kbWrites = [];
    if (!parsedDraft || !project) return { updates, kbWrites, summary: 'no-op', applied: false };
    if (!Array.isArray(parsedDraft.newWorkshops)) return { updates, kbWrites, summary: 'no-op', applied: false };

    let added = 0;
    const TIER_VALID = new Set(['public', 'operator', 'matriu', 'cohort']);
    for (const w of parsedDraft.newWorkshops) {
        if (!w || !w.title || !w.audience) continue;
        const accessTier = TIER_VALID.has(w.accessTier) ? w.accessTier : 'public';
        kbWrites.push({
            id:   'workshop-ai-' + _uid(),
            type: 'workshop',
            content: {
                projectId:    project.id,
                title:        _clean(w.title, 100),
                audience:     _clean(w.audience, 40),
                accessTier,
                cohortNumber: typeof w.cohortNumber === 'number' ? w.cohortNumber : null,
                outline:      _clean(w.outline || '', 800),
                kind:         'project-workshop',
                createdBy:    'ai-fill',
            },
            keywords:  ['type:workshop', 'projectId:' + project.id, 'audience:' + w.audience, 'tier:' + accessTier, 'source:ai-fill'],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        added++;
    }
    return {
        updates,
        kbWrites,
        summary: added ? '+ ' + added + ' workshop' + (added === 1 ? '' : 's') : 'res nou per aplicar',
        applied: added > 0,
    };
}

// ─── Dispatcher ─────────────────────────────────────────────────────────
export const DIM_APPLIERS = Object.freeze({
    landing:      applyLanding,
    valueMap:     applyValueMap,
    deliverables: applyDeliverables,
    sops:         applySops,
    workshops:    applyWorkshops,
});

export function applyDimDraft(dimId, parsedDraft, project) {
    const fn = DIM_APPLIERS[dimId];
    if (!fn) return { updates: {}, kbWrites: [], summary: 'unknown-dim', applied: false };
    return fn(parsedDraft, project);
}

// ─── Async runner · executa le updates + kbWrites contra store + KB ─────
export async function commitApply({ projectId, dimId, parsedDraft, store, kb } = {}) {
    if (!projectId || !dimId) throw new Error('commitApply requires projectId + dimId');
    if (!store || !kb)        throw new Error('commitApply requires store + kb (injectable)');
    const project = (store.getState().projects || []).find(p => p && p.id === projectId);
    if (!project) throw new Error('commitApply · project not found · ' + projectId);
    const res = applyDimDraft(dimId, parsedDraft, project);
    if (!res.applied) return { ...res, persisted: false };
    if (Object.keys(res.updates).length > 0) {
        await store.dispatch({
            type:    'UPDATE_PROJECT_INFO',
            payload: { projectId, updates: res.updates },
        });
    }
    for (const node of res.kbWrites) {
        try { await kb.upsert(node); } catch (e) { console.warn('[applyDim] KB.upsert failed', node.id, e?.message); }
    }
    return { ...res, persisted: true };
}
