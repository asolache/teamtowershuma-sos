// =============================================================================
// TEAMTOWERS SOS V11 — PROMPT A/B TEST SERVICE (v132 · wo-prompt-ab-test-vna)
// Ruta · /js/core/promptABTestService.js
//
// Compara qualitat entre 2 estratègies de prompt VNA per a entendre què
// funciona millor · el flow expert chain pesat (v121-v131c) o el prompt
// minimalista del botó "Sugerir con IA" (/map).
//
// Hipòtesi @alvaro · "menys context ben enfocat > més context exhaustiu"
//
// API ·
//   buildVariantAPrompt(context)   · prompt v131c complet · domain + sector + canvas + ...
//   buildVariantBPrompt(context)   · prompt "Sugerir con IA" style · curt · focused
//   runABTest({context, provider}) · executa ambdós · retorna 2 outputs + mètriques
//   scoreOutput(output)            · pure · mètriques objectives (roles · % intangibles · etc)
//   compareOutputs(a, b)           · pure · diferencial qui guanya
//
// Filosofia · evidence-based · sense suposicions. KISS · zero deps externes.
// =============================================================================

export const PROMPT_AB_VERSION = 'v1.0';

// buildVariantAPrompt · estil v131c · ric context · domain + sector + canvas
// Reusa el prompt actual de vnaExpertPrompts.design-value-map-rich
export function buildVariantAPrompt({ name, description, sector, domainDetection = null, sectorContext = null, vna_zoom = 'mid' }) {
    let domainBlock = '';
    if (domainDetection?.archetypes?.length) {
        const archs = domainDetection.archetypes.map(a => `  · ${a.name} [${a.castell}] · ${a.desc}`).join('\n');
        domainBlock = `\nDOMINI DETECTAT · ${domainDetection.label}\n${archs}\n`;
    }
    const sectorBlock = sectorContext ? `\nCONTEXT SECTORIAL CNAE-2009 ·\n${sectorContext}\n` : '';

    const system = `# AGENT IA · SOS V11 · expert llegendari en VNA
Ets consultor sènior amb 3 disciplines · Verna Allee VNA · Lean · Antigravity.
PRINCIPIS · Mind-as-Graph · Context-First · Local-first · Intangibles humans · DTD · Fair Fractal Tokenomics · CNAE adaptation.
METODOLOGIA VERNA ALLEE · ROLES actius · TRANSACTIONS bidireccionals · TANGIBLE+INTANGIBLE · DELIVERABLES nominats · PATTERN RECÍPROC.
NIVELLS · macro 1-3 rols · meso 4-7 · micro 8-15.
MODEL CASTELLER · pom_de_dalt · tronc · pinya · laterals · mans · baixos.
QUALITAT MÍNIMA · 0 placeholders · nomenclatura sectorial · 60-70% tangibles · 30-40% intangibles · ≥1 cicle recíproc · sense rols orfes.`;

    const user = `TASCA · DISSENY DE MAPA DE VALOR RIC.
Projecte · "${name}"
Sector CNAE · ${sector || '(infereix)'}
Descripció · ${description}
Zoom VNA · ${vna_zoom}
${domainBlock}${sectorBlock}
THINK STEP-BY-STEP · network real · rols cicle complet · transactions tangibles + intangibles · cicles recíprocs · sense orfes.

Retorna JSON · { roles[], transactions[], deliverables[], thinking, patterns_detected[] }
Sense markdown · sense codeblocks. JSON pur.`;

    return { system, user, variant: 'A', label: 'rich-context-v131c', approxTokens: Math.ceil((system.length + user.length) / 4) };
}

// buildVariantARealPrompt · v132b · async · usa el prompt REAL exacte de
// vnaExpertPrompts.design-value-map-rich · per a comparació A/B perfecta amb
// el que SOS V11 envia a la IA en producció.
export async function buildVariantARealPrompt(context = {}) {
    try {
        const { buildPrompt } = await import('./vnaExpertPrompts.js');
        const p = buildPrompt({ taskKind: 'design-value-map-rich', context });
        return { system: p.system, user: p.user, variant: 'A', label: 'real-vna-expert-chain', approxTokens: p.approxTokens };
    } catch (_) {
        return buildVariantAPrompt(context);
    }
}

// buildVariantBPrompt · estil "Sugerir con IA" /map · curt · focused
// Pattern descobert via codeReview de ValueMapView._runAISuggestion
export function buildVariantBPrompt({ name, description, sector, vna_zoom = 'mid' }) {
    const system = `Eres un experto en Value Network Analysis (metodología Verna Allee). Genera un mapa VNA en formato JSON estricto.

RULES:
- Roles = value flow activities, NOT job titles
- Respond ONLY with valid JSON, no markdown blocks, no extra text
- ids in kebab-case, unique
- ALL role names, descriptions, deliverables MUST be specific to the sector
- Minimum 6 roles, distributed across 3 levels (pom_de_dalt, tronc, pinya, laterals, mans, baixos)
- Each transaction must have a tangible OR intangible deliverable
- At least 1 reciprocal cycle (A→B + B→A)`;

    const user = `Organización · ${name}
Sector · ${sector || '(infereix del context)'}
Descripció · ${description}
Zoom · ${vna_zoom}

Genera un mapa VNA complet · roles + transactions + deliverables.`;

    return { system, user, variant: 'B', label: 'minimal-suggest-ia', approxTokens: Math.ceil((system.length + user.length) / 4) };
}

// scoreOutput · pure · mètriques objectives d'un output VNA
//   roles_count · transactions_count · deliverables_count
//   tangibles_pct · intangibles_pct (sobre transactions)
//   reciprocal_cycles · cicles A→B + B→A detectats
//   role_kinds_diversity · diferents kinds canonical usats
//   castell_coverage · quants nivells castell representats (0-6)
//   intangible_named_pct · % deliverables intangibles amb nom específic
export function scoreOutput(output) {
    if (!output || typeof output !== 'object') return null;
    const roles = Array.isArray(output.roles) ? output.roles : [];
    const txs = Array.isArray(output.transactions) ? output.transactions : [];
    const delivs = Array.isArray(output.deliverables) ? output.deliverables : [];

    let tangibleCount = 0, intangibleCount = 0;
    for (const t of txs) {
        if (t.type === 'tangible' || t.kind === 'tangible') tangibleCount++;
        else if (t.type === 'intangible' || t.kind === 'intangible') intangibleCount++;
    }
    const txTotal = tangibleCount + intangibleCount;
    const tangibles_pct   = txTotal ? Math.round((tangibleCount / txTotal) * 100) : 0;
    const intangibles_pct = txTotal ? Math.round((intangibleCount / txTotal) * 100) : 0;

    // Reciprocal cycles · A→B + B→A
    const pairs = new Set();
    let reciprocal_cycles = 0;
    for (const t of txs) {
        if (!t.from || !t.to) continue;
        const fwd = t.from + '→' + t.to;
        const rev = t.to + '→' + t.from;
        if (pairs.has(rev)) reciprocal_cycles++;
        pairs.add(fwd);
    }

    // Role kinds diversity
    const kinds = new Set();
    for (const r of roles) {
        if (r.kind) kinds.add(r.kind);
        if (r.castell_level) kinds.add('castell:' + r.castell_level);
    }
    const castell_levels = new Set();
    for (const r of roles) {
        if (r.castell_level) castell_levels.add(r.castell_level);
    }

    // Intangible deliverables with sector-specific naming
    let intangible_named = 0, intangible_total = 0;
    for (const d of delivs) {
        if (d.kind === 'intangible' || d.type === 'intangible') {
            intangible_total++;
            const name = String(d.name || d.id || '').toLowerCase();
            if (name && !/document|comunicaci[oó]|info|generi[cs]/i.test(name) && name.length > 8) intangible_named++;
        }
    }
    const intangible_named_pct = intangible_total ? Math.round((intangible_named / intangible_total) * 100) : 0;

    // Quality score · ponderació proposta
    //   roles_count fit zoom (40%) · intangibles ≥30% (15%) · reciprocal_cycles (15%) ·
    //   castell_coverage ≥4 (15%) · intangible_named ≥60% (15%)
    let score = 0;
    if (roles.length >= 4 && roles.length <= 12) score += 40;
    else if (roles.length >= 2) score += 25;
    if (intangibles_pct >= 30 && intangibles_pct <= 50) score += 15;
    else if (intangibles_pct > 0) score += 8;
    if (reciprocal_cycles >= 1) score += 15;
    if (castell_levels.size >= 4) score += 15;
    else if (castell_levels.size >= 2) score += 8;
    if (intangible_named_pct >= 60) score += 15;
    else if (intangible_named_pct >= 30) score += 8;

    return {
        roles_count: roles.length,
        transactions_count: txs.length,
        deliverables_count: delivs.length,
        tangibles_pct,
        intangibles_pct,
        reciprocal_cycles,
        role_kinds_diversity: kinds.size,
        castell_coverage: castell_levels.size,
        intangible_named_pct,
        score,
    };
}

// compareOutputs · pure · diferencial qui guanya
// Retorna · { winner: 'A'|'B'|'tie', deltaScore, ratios }
export function compareOutputs(scoreA, scoreB) {
    if (!scoreA || !scoreB) return { winner: null, deltaScore: 0 };
    const deltaScore = scoreB.score - scoreA.score;
    const winner = deltaScore > 5 ? 'B' : deltaScore < -5 ? 'A' : 'tie';
    return {
        winner,
        deltaScore,
        roles: { A: scoreA.roles_count, B: scoreB.roles_count, delta: scoreB.roles_count - scoreA.roles_count },
        intangibles_pct: { A: scoreA.intangibles_pct, B: scoreB.intangibles_pct, delta: scoreB.intangibles_pct - scoreA.intangibles_pct },
        reciprocal_cycles: { A: scoreA.reciprocal_cycles, B: scoreB.reciprocal_cycles },
        castell_coverage: { A: scoreA.castell_coverage, B: scoreB.castell_coverage },
        score: { A: scoreA.score, B: scoreB.score, delta: deltaScore },
    };
}

// runABTest · async · executa els dos prompts amb el mateix model · retorna
// outputs + scores + comparison. provider · injectable per a tests.
export async function runABTest({
    context,
    provider = null,
    modelKey = 'auto-small',
    preferredProvider = null,
    onProgress = null,
} = {}) {
    if (!context || !context.name) throw new Error('runABTest · context.name required');
    if (!provider) {
        try {
            const mod = await import('./aiProviderService.js');
            provider = mod.generateWithProvider;
        } catch (_) { throw new Error('runABTest · provider not available'); }
    }
    const promptA = buildVariantAPrompt(context);
    const promptB = buildVariantBPrompt(context);

    const t0 = Date.now();
    const emit = (step, payload) => { try { onProgress?.({ step, ...payload }); } catch (_) {} };

    emit('start', { promptA: promptA.approxTokens, promptB: promptB.approxTokens });

    // Run amb dos crides paral·leles
    let outputA, outputB, errA, errB;
    const [resA, resB] = await Promise.all([
        provider(modelKey, { systemPrompt: promptA.system, userPrompt: promptA.user, temperature: 0.3, maxOutputTokens: 1800, preferredProvider }).catch(e => { errA = e?.message; return null; }),
        provider(modelKey, { systemPrompt: promptB.system, userPrompt: promptB.user, temperature: 0.3, maxOutputTokens: 1800, preferredProvider }).catch(e => { errB = e?.message; return null; }),
    ]);

    function _parseJson(text) {
        if (!text) return null;
        const trimmed = String(text).trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        const m = trimmed.match(/\{[\s\S]*\}/);
        try { return JSON.parse(m ? m[0] : trimmed); } catch (_) { return null; }
    }
    outputA = _parseJson(resA?.text);
    outputB = _parseJson(resB?.text);

    const scoreA = outputA ? scoreOutput(outputA) : null;
    const scoreB = outputB ? scoreOutput(outputB) : null;
    const comparison = scoreA && scoreB ? compareOutputs(scoreA, scoreB) : { winner: null };

    emit('finish', { ms: Date.now() - t0, winner: comparison.winner });

    return {
        ms: Date.now() - t0,
        variants: {
            A: { ...promptA, output: outputA, score: scoreA, error: errA, usage: resA?.usage || null },
            B: { ...promptB, output: outputB, score: scoreB, error: errB, usage: resB?.usage || null },
        },
        comparison,
        context: { name: context.name, sector: context.sector },
    };
}

// recordABTestResult · persisteix al KB per a anàlisi posterior
export async function recordABTestResult({ result, kb = null } = {}) {
    if (!result) return null;
    if (!kb) {
        try { kb = (await import('./kb.js')).KB; } catch (_) { return null; }
    }
    const node = {
        id:   'prompt-ab-test-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
        type: 'prompt_ab_test_result',
        content: {
            ms: result.ms,
            winner: result.comparison?.winner,
            deltaScore: result.comparison?.deltaScore,
            context: result.context,
            scoreA: result.variants?.A?.score,
            scoreB: result.variants?.B?.score,
            tokensA: result.variants?.A?.approxTokens,
            tokensB: result.variants?.B?.approxTokens,
            usageA: result.variants?.A?.usage,
            usageB: result.variants?.B?.usage,
            errorA: result.variants?.A?.error,
            errorB: result.variants?.B?.error,
            recordedAt: Date.now(),
        },
    };
    try { await kb.upsert(node); } catch (_) {}
    return node;
}

// summarizeABTests · pure · agrega N resultats per a dashboard
// events · array de prompt_ab_test_result nodes
export function summarizeABTests(events = []) {
    if (!Array.isArray(events) || !events.length) {
        return { total: 0, winner: { A: 0, B: 0, tie: 0 }, avgScoreA: 0, avgScoreB: 0, winRateB: 0 };
    }
    let A = 0, B = 0, tie = 0, sumA = 0, sumB = 0, countA = 0, countB = 0;
    let sumTokensA = 0, sumTokensB = 0;
    for (const ev of events) {
        const c = ev.content || {};
        if (c.winner === 'A') A++;
        else if (c.winner === 'B') B++;
        else tie++;
        if (typeof c.scoreA?.score === 'number') { sumA += c.scoreA.score; countA++; }
        if (typeof c.scoreB?.score === 'number') { sumB += c.scoreB.score; countB++; }
        sumTokensA += (c.tokensA || 0);
        sumTokensB += (c.tokensB || 0);
    }
    return {
        total: events.length,
        winner: { A, B, tie },
        avgScoreA: countA ? Number((sumA / countA).toFixed(1)) : 0,
        avgScoreB: countB ? Number((sumB / countB).toFixed(1)) : 0,
        winRateB: Number(((B / events.length) * 100).toFixed(1)),
        winRateA: Number(((A / events.length) * 100).toFixed(1)),
        tiePct:   Number(((tie / events.length) * 100).toFixed(1)),
        avgTokensA: events.length ? Math.round(sumTokensA / events.length) : 0,
        avgTokensB: events.length ? Math.round(sumTokensB / events.length) : 0,
        tokenSavingsB: events.length ? Number(((1 - (sumTokensB / sumTokensA)) * 100).toFixed(1)) : 0,
    };
}
