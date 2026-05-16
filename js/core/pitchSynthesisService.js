// =============================================================================
// TEAMTOWERS SOS V11 — PITCH SYNTHESIS SERVICE (PITCH-REFRAME-001 sprint A)
// Ruta · /js/core/pitchSynthesisService.js
//
// Sintetitza el pitch d'un projecte des de TOTES les altres fonts (canvas
// + VNA + tokenomics + ledger + proposals + classification). L'usuari NO
// omple seccions a mà · l'IA llegeix el context i genera el document final
// per a inversors · usuari valida text final.
//
// Decisió del rethink @alvaro · "pitch ≠ formulari · pitch = document final
// sintetitzat".
//
// Pure (buildSynthesisContext + buildSynthesisPrompt) · async (synthesize
// fa la crida real via runPrompt).
// =============================================================================

import { decideStrategy } from './aiDecisionService.js';
import { set as cacheSet, get as cacheGet, recordHit, recordMiss } from './aiCacheService.js';
import { recordSpend } from './aiBudgetService.js';

export const PITCH_SYNTHESIS_VERSION = 'v1.0';

export const PITCH_TONE_BY_STAGE = Object.freeze({
    idea:      'humil + visió clara · admetem hipòtesis no validades',
    mvp:       'demostratiu · "tenim quelcom funcional" sense exagerar',
    pilot:     'evidència de primers usuaris · learnings · iteració',
    growth:    'tracció clara · números · escalat operatiu',
    maturity:  'rendibilitat sostinguda · operació predictible',
    'wind-down': 'transparència total · lessons learned',
});

// ── Context aggregation · pure ────────────────────────────────────────────

// buildSynthesisContext · agrega les dades del projecte en un objecte
// estructurat · base per al prompt IA.
export function buildSynthesisContext({
    project,
    canvas = null,
    vna = null,              // { roles[], transactions[] · o project.vna_roles + vna_transactions }
    tokenomics = null,       // node token_design
    ledger = [],
    invoices = [],
    proposals = [],
    classification = null,   // project.aiClassification
    org = null,
} = {}) {
    if (!project) throw new Error('buildSynthesisContext · project required');

    const stage = classification?.lifecycle_stage || project.aiClassification?.lifecycle_stage || 'idea';
    const type = classification?.project_type || project.aiClassification?.project_type || null;
    const scale = classification?.scale || project.aiClassification?.scale || null;

    // Canvas → vision/mission/values
    const canvasSteps = canvas?.steps || project.content?.canvas?.steps || {};
    const vision = canvasSteps.vision?.value || canvasSteps['vision']?.value || null;
    const mission = canvasSteps.mission?.value || null;
    const values = canvasSteps.values?.value || null;
    const stakeholders = canvasSteps.stakeholders?.value || null;
    const northStar = canvasSteps['north-star']?.value || null;

    // VNA · counts + summary
    const vnaRoles = vna?.roles || project.vna_roles || [];
    const vnaTxs = vna?.transactions || project.vna_transactions || [];
    const tangibleCount = vnaTxs.filter(t => t.type === 'tangible').length;
    const intangibleCount = vnaTxs.filter(t => t.type === 'intangible').length;

    // Tokenomics summary
    const tokenInfo = tokenomics ? {
        symbol: tokenomics.content?.symbol || null,
        totalSupply: tokenomics.content?.totalSupply || null,
        distributionCount: Object.keys(tokenomics.content?.distribution || {}).length,
    } : null;

    // Ledger · P&L summary
    let totalRevenue = 0, totalExpenses = 0;
    for (const e of ledger) {
        if (e.content?.creditAccount === 'revenue') totalRevenue += e.content.amount || 0;
        if (e.content?.debitAccount === 'expenses') totalExpenses += e.content.amount || 0;
    }

    // Proposals · accepted
    const acceptedProposals = proposals.filter(p => p.content?.status === 'accepted');
    const acceptedRevenue = acceptedProposals.reduce((acc, p) => {
        const items = p.content?.deliverables || [];
        return acc + items.reduce((s, d) => s + (d.price || 0), 0);
    }, 0);

    // Invoices · paid
    const paidInvoices = invoices.filter(i => i.content?.status === 'paid');
    const paidRevenue = paidInvoices.reduce((acc, i) => acc + (i.content?.totals?.gross || 0), 0);

    return {
        projectName: project.nombre || project.name || project.id,
        projectId: project.id,
        sector: project.sector_id || null,
        description: project.description || null,
        purpose: project.purpose || null,
        classification: { type, stage, scale },
        canvas: { vision, mission, values, stakeholders, northStar },
        vna: { roleCount: vnaRoles.length, tangibleCount, intangibleCount, txCount: vnaTxs.length },
        tokenomics: tokenInfo,
        ledger: {
            totalRevenue: Number(totalRevenue.toFixed(2)),
            totalExpenses: Number(totalExpenses.toFixed(2)),
            profit: Number((totalRevenue - totalExpenses).toFixed(2)),
        },
        traction: {
            acceptedProposalsCount: acceptedProposals.length,
            acceptedRevenueEur: Number(acceptedRevenue.toFixed(2)),
            paidInvoicesCount: paidInvoices.length,
            paidRevenueEur: Number(paidRevenue.toFixed(2)),
        },
        org: org ? {
            name: org.name,
            stakeholderCount: (org.stakeholders || []).length,
            legalKind: org.legalKind,
        } : null,
    };
}

// buildSynthesisPrompt · pure · prompt complet per a synth IA
export function buildSynthesisPrompt(context, { lang = 'ca' } = {}) {
    if (!context) throw new Error('buildSynthesisPrompt · context required');
    const tone = PITCH_TONE_BY_STAGE[context.classification?.stage] || PITCH_TONE_BY_STAGE.idea;

    return [
        'Ets dissenyador de pitches per a projectes cooperatius SOS.',
        'TASK · sintetitzar UN pitch professional final per a inversors a partir',
        'del context complet del projecte. NO formulari de seccions ·',
        'document narratiu coherent · llest per a presentar.',
        '',
        'PROJECTE ·',
        '- Nom · ' + context.projectName,
        context.sector ? '- Sector · ' + context.sector : '',
        context.description ? '- Descripció · ' + context.description : '',
        context.purpose ? '- Propòsit · ' + context.purpose : '',
        context.classification?.type ? '- Tipus · ' + context.classification.type : '',
        context.classification?.stage ? '- Maduresa · ' + context.classification.stage + ' (' + tone + ')' : '',
        context.classification?.scale ? '- Escala · ' + context.classification.scale : '',
        '',
        '─── CONTEXT CANVAS ───',
        context.canvas?.vision ? 'Visió · ' + context.canvas.vision : '(no canvas vision)',
        context.canvas?.mission ? 'Missió · ' + context.canvas.mission : '',
        context.canvas?.values ? 'Valors · ' + context.canvas.values : '',
        context.canvas?.stakeholders ? 'Stakeholders · ' + context.canvas.stakeholders : '',
        context.canvas?.northStar ? 'North Star · ' + context.canvas.northStar : '',
        '',
        '─── VNA (Verna Allee) ───',
        'Roles · ' + context.vna.roleCount,
        'Transactions · ' + context.vna.txCount + ' (' + context.vna.tangibleCount + ' tangibles · ' + context.vna.intangibleCount + ' intangibles)',
        '',
        '─── TOKENOMICS ───',
        context.tokenomics
            ? 'Token · ' + context.tokenomics.symbol + ' · supply ' + context.tokenomics.totalSupply + ' · ' + context.tokenomics.distributionCount + ' grups distribució'
            : 'No tokenomics modelats',
        '',
        '─── TRACCIÓ ───',
        'Revenue ledger · ' + context.ledger.totalRevenue + '€',
        'Expenses · ' + context.ledger.totalExpenses + '€',
        'Profit · ' + context.ledger.profit + '€',
        'Proposals acceptades · ' + context.traction.acceptedProposalsCount + ' (' + context.traction.acceptedRevenueEur + '€)',
        'Invoices paid · ' + context.traction.paidInvoicesCount + ' (' + context.traction.paidRevenueEur + '€)',
        '',
        context.org ? '─── ORG ───\nOrg · ' + context.org.name + ' (' + context.org.legalKind + ') · ' + context.org.stakeholderCount + ' stakeholders' : '',
        '',
        '═══ OUTPUT REQUERIT ═══',
        'Genera un objecte JSON estricte amb les 7 seccions del pitch.',
        'Idioma · ' + (lang === 'es' ? 'castellà' : (lang === 'en' ? 'anglès' : 'català')),
        'Tonalitat · ' + tone + '.',
        'Cada secció · narrativa fluida · NO bullet points · 50-150 paraules cada.',
        '',
        '{',
        '  "tagline": "1 frase de hook · 8-15 paraules · que capturi l\'essència",',
        '  "hero": "1 paràgraf curt que obre el pitch · projecte + stage + visió",',
        '  "problem": "el dolor concret que resolem · per a qui · per què ara",',
        '  "solution": "què oferim · diferent · ancorat al canvas + VNA",',
        '  "traction": "evidència real · usa números del ledger/invoices/proposals si n\'hi ha",',
        '  "team": "qui ho fa · stakeholders · governança cooperativa · roles VNA",',
        '  "ask": "què demanem segons stage · investment · partners · clients · etc",',
        '  "vision": "món si triomfem · futur narratiu · 1-2 frases finals"',
        '}',
        '',
        'Sense markdown · sense codeblock · sense text addicional · sols JSON.',
    ].filter(s => s !== '').join('\n');
}

// ── Synthesis · async · fa la crida IA real ──────────────────────────────

export async function synthesizePitch(context, { projectId = null, lang = 'ca', preferCache = true } = {}) {
    if (!context) throw new Error('synthesizePitch · context required');
    const prompt = buildSynthesisPrompt(context, { lang });

    const strategy = decideStrategy({
        prompt,
        taskKind: 'creative-narrative',
        suggestedTier: 'quality',           // pitch · cal qualitat
        projectId,
        requireEvaluator: true,
    });

    if (strategy.decision === 'block') {
        return { ok: false, source: 'block', reason: strategy.reason };
    }
    if (preferCache && strategy.decision === 'cache-hit') {
        recordHit();
        return {
            ok: true,
            pitch: cacheGet(strategy.cacheKey)?.pitch || null,
            strategy,
            source: 'cache',
            cost: 0,
        };
    }
    recordMiss();

    const { runPrompt } = await import('./aiRouterService.js');
    let result;
    try {
        result = await runPrompt({
            prompt,
            taskKind: 'creative-narrative',
            taskTier: 'quality',
            systemPrompt: 'Ets dissenyador de pitches per a projectes cooperatius SOS · respons NOMÉS JSON estricte.',
            maxOutputTokens: 1800,
            temperature: 0.5,
            projectId,
        });
    } catch (e) {
        return { ok: false, source: 'ai-error', reason: e?.message };
    }

    const text = result?.output || result?.text || '';
    const parsed = _parseJson(text);
    if (!parsed) return { ok: false, source: 'parse-error', reason: 'JSON parse failed', rawText: text.slice(0, 200) };

    const pitch = {
        tagline:   String(parsed.tagline || '').slice(0, 200),
        hero:      String(parsed.hero || '').slice(0, 800),
        problem:   String(parsed.problem || '').slice(0, 800),
        solution:  String(parsed.solution || '').slice(0, 800),
        traction:  String(parsed.traction || '').slice(0, 800),
        team:      String(parsed.team || '').slice(0, 800),
        ask:       String(parsed.ask || '').slice(0, 600),
        vision:    String(parsed.vision || '').slice(0, 600),
        synthesizedAt: Date.now(),
        synthesizedFrom: {
            stage: context.classification?.stage,
            type: context.classification?.type,
            hasCanvas: !!(context.canvas?.vision || context.canvas?.mission),
            hasVna: context.vna.roleCount > 0,
            hasTokenomics: !!context.tokenomics,
        },
        version: PITCH_SYNTHESIS_VERSION,
    };

    if (strategy.cacheKey) cacheSet(strategy.cacheKey, { pitch });

    const costEur = result.usage ? _estimateUsageCostEur(result.modelKey, result.usage) : (strategy.estimatedCostEur || 0);
    if (projectId && costEur > 0) recordSpend(projectId, costEur);

    return { ok: true, pitch, strategy, cost: costEur, modelKey: result.modelKey, source: 'ai' };
}

// ── Heuristic fallback · pure · sense IA · per a empty state ─────────────

// buildHeuristicPitch · pure · genera un pitch placeholder amb el context
// disponible · útil quan IA no està configurada o budget exhaurit.
export function buildHeuristicPitch(context) {
    if (!context) return null;
    const stage = context.classification?.stage || 'idea';
    const tone = PITCH_TONE_BY_STAGE[stage] || '';
    const v = context.canvas?.vision || 'visió pendent de definir al canvas';
    const m = context.canvas?.mission || 'missió pendent';
    return {
        tagline: context.projectName + ' · ' + (context.purpose || 'cooperativa SOS'),
        hero:    context.projectName + ' és un projecte en fase ' + stage + ' · ' + (context.description || ''),
        problem: '(omplir manualment · ' + tone + ')',
        solution: m,
        traction: context.traction.paidInvoicesCount > 0
            ? context.traction.paidInvoicesCount + ' invoices cobrades · ' + context.traction.paidRevenueEur + '€'
            : 'pre-tracció · validant hipòtesis al canvas',
        team: context.vna.roleCount > 0
            ? context.vna.roleCount + ' rols modelats · ' + context.vna.tangibleCount + ' transaccions tangibles'
            : '(omplir equip manualment · cap rol VNA encara)',
        ask: stage === 'idea' || stage === 'mvp'
            ? 'cerquem partners pilot · mentors · validadors'
            : 'cerquem inversió per escalat operatiu',
        vision: v,
        synthesizedAt: Date.now(),
        synthesizedFrom: { stage, type: context.classification?.type, hasCanvas: !!v, hasVna: context.vna.roleCount > 0, hasTokenomics: false },
        version: PITCH_SYNTHESIS_VERSION + '-heuristic',
    };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function _parseJson(text) {
    if (!text) return null;
    const trimmed = String(text).trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    const candidate = fenced ? fenced[1] : trimmed;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) return null;
    try { return JSON.parse(candidate.slice(start, end + 1)); } catch (_) { return null; }
}

function _estimateUsageCostEur(modelKey, usage) {
    try {
        const { actualCostUsd } = require('./aiProviderService.js');
        const usd = actualCostUsd(modelKey, usage) || 0;
        return Number((usd * 0.92).toFixed(6));
    } catch (_) { return 0; }
}
