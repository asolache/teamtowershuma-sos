// =============================================================================
// TEAMTOWERS SOS V11 — IA HIERARCHICAL SERVICE (IA-HIERARCHICAL-PROMPT-001)
// Ruta · /js/core/iaHierarchicalService.js
//
// Orquestra la generació jerarquica · SOC outline primer (~500 tokens · cheap)
// · expandeix SOPs sota demanda per item (300-800 tokens cada).
//
// **Estalvi 40-60% del cost vs gen monolític** · l'usuari pot parar quan
// vulgui · només expandeix items que realment necessita detall.
//
// Pure quan és possible · `generateSocOutline` i `generateSopForItem` són
// async (criden runPrompt).
// =============================================================================

import { buildSocOutlinePrompt, buildSopExpandPrompt, buildEmptyChecklistItem } from './socDualPurposeService.js';
import { decideStrategy } from './aiDecisionService.js';
import { set as cacheSet, get as cacheGet, recordHit, recordMiss } from './aiCacheService.js';
import { recordSpend } from './aiBudgetService.js';

// ── Public API ────────────────────────────────────────────────────────────

// generateSocOutline · async · 1 crida cheap · retorna { checklist: [...] }
//
// args ·
//   socPurpose · descripció del propòsit del SOC
//   processContext · opcional · descripció del procés
//   sectorContext · opcional · sector de la org
//   projectId · opcional · per a budget tracking
//
// Retorna · { ok, checklist:[items], strategy, cost, source:'ai'|'cache'|'block' }
export async function generateSocOutline({
    socPurpose,
    processContext = null,
    sectorContext = null,
    projectId = null,
} = {}) {
    if (!socPurpose) throw new Error('generateSocOutline · socPurpose required');
    const prompt = buildSocOutlinePrompt({ socPurpose, processContext, sectorContext });

    // 1. Decision · skip if cached / blocked / etc
    const strategy = decideStrategy({
        prompt,
        taskKind: 'schema-fill-simple',
        suggestedTier: 'draft',
        projectId,
        requireEvaluator: true,
        isBatchable: false,
    });

    if (strategy.decision === 'block') {
        return { ok: false, source: 'block', strategy, reason: strategy.reason };
    }
    if (strategy.decision === 'cache-hit') {
        recordHit();
        const cached = cacheGet(strategy.cacheKey);
        return {
            ok: true,
            checklist: cached?.checklist || [],
            strategy,
            cost: 0,
            source: 'cache',
        };
    }
    recordMiss();

    // 2. Real call · via runPrompt
    const { runPrompt } = await import('./aiRouterService.js');
    let result;
    try {
        result = await runPrompt({
            prompt,
            taskKind: 'schema-fill-simple',
            taskTier: 'draft',
            systemPrompt: 'Ets dissenyador de processos cooperatius SOS · respons JSON estricte.',
            maxOutputTokens: 800,
            temperature: 0.2,
            projectId,
        });
    } catch (e) {
        return { ok: false, source: 'ai-error', strategy, reason: e?.message || 'unknown' };
    }

    // 3. Parse + validate
    const text = result?.output || result?.text || '';
    let parsed;
    try {
        const fenced = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
        const candidate = (fenced ? fenced[1] : text).trim();
        const start = candidate.indexOf('{');
        const end = candidate.lastIndexOf('}');
        parsed = JSON.parse(candidate.slice(start, end + 1));
    } catch (e) {
        return { ok: false, source: 'parse-error', strategy, reason: 'JSON parse failed' };
    }
    if (!parsed || !Array.isArray(parsed.checklist)) {
        return { ok: false, source: 'shape-error', strategy, reason: 'no checklist array' };
    }

    // 4. Build checklist items
    const items = parsed.checklist
        .filter(c => c && c.label)
        .map((c, i) => buildEmptyChecklistItem({
            id: 'ci-' + String(i + 1).padStart(2, '0'),
            label: String(c.label).slice(0, 200),
            required: c.required !== false,
            verification_kind: c.verification_kind || 'manual',
        }));

    // 5. Cache the result
    if (strategy.cacheKey) {
        cacheSet(strategy.cacheKey, { checklist: items });
    }

    // 6. Track real cost
    const costEur = result.usage ? _estimateUsageCostEur(result.modelKey, result.usage) : (strategy.estimatedCostEur || 0);
    if (projectId && costEur > 0) recordSpend(projectId, costEur);

    return {
        ok: true,
        checklist: items,
        strategy,
        cost: costEur,
        modelKey: result.modelKey,
        source: 'ai',
    };
}

// generateSopForItem · async · 1 crida per item · ~500-800 tokens
//
// args ·
//   socPurpose · context del SOC pare
//   checklistItemLabel · l'item concret que expandim
//   sectorContext · opcional
//   projectId · per a budget tracking
//
// Retorna · { ok, sop:{ title, steps, duration_minutes, prerequisites,
//             deliverables }, strategy, cost }
export async function generateSopForItem({
    socPurpose,
    checklistItemLabel,
    sectorContext = null,
    projectId = null,
} = {}) {
    if (!socPurpose || !checklistItemLabel) {
        throw new Error('generateSopForItem · socPurpose + checklistItemLabel required');
    }
    const prompt = buildSopExpandPrompt({ socPurpose, checklistItemLabel, sectorContext });

    const strategy = decideStrategy({
        prompt,
        taskKind: 'sop-structured',
        suggestedTier: 'draft',
        projectId,
        requireEvaluator: false,
        isBatchable: true,
    });

    if (strategy.decision === 'block') {
        return { ok: false, source: 'block', reason: strategy.reason };
    }
    if (strategy.decision === 'cache-hit') {
        recordHit();
        const cached = cacheGet(strategy.cacheKey);
        return { ok: true, sop: cached?.sop || null, strategy, cost: 0, source: 'cache' };
    }
    recordMiss();

    const { runPrompt } = await import('./aiRouterService.js');
    let result;
    try {
        result = await runPrompt({
            prompt,
            taskKind: 'sop-structured',
            taskTier: 'draft',
            systemPrompt: 'Ets dissenyador d\'SOPs cooperatius SOS · respons JSON estricte.',
            maxOutputTokens: 800,
            temperature: 0.3,
            projectId,
        });
    } catch (e) {
        return { ok: false, source: 'ai-error', reason: e?.message };
    }

    const text = result?.output || result?.text || '';
    let parsed;
    try {
        const fenced = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
        const candidate = (fenced ? fenced[1] : text).trim();
        const start = candidate.indexOf('{');
        const end = candidate.lastIndexOf('}');
        parsed = JSON.parse(candidate.slice(start, end + 1));
    } catch (e) {
        return { ok: false, source: 'parse-error', reason: 'JSON parse failed' };
    }
    if (!parsed) {
        return { ok: false, source: 'shape-error', reason: 'no parsed' };
    }

    const sop = {
        title: String(parsed.title || checklistItemLabel).slice(0, 200),
        steps: Array.isArray(parsed.steps) ? parsed.steps.map(s => String(s)) : [],
        duration_minutes: typeof parsed.duration_minutes === 'number' ? parsed.duration_minutes : null,
        prerequisites: Array.isArray(parsed.prerequisites) ? parsed.prerequisites.map(p => String(p)) : [],
        deliverables: Array.isArray(parsed.deliverables) ? parsed.deliverables.map(d => String(d)) : [],
    };

    if (strategy.cacheKey) {
        cacheSet(strategy.cacheKey, { sop });
    }

    const costEur = result.usage ? _estimateUsageCostEur(result.modelKey, result.usage) : (strategy.estimatedCostEur || 0);
    if (projectId && costEur > 0) recordSpend(projectId, costEur);

    return { ok: true, sop, strategy, cost: costEur, modelKey: result.modelKey, source: 'ai' };
}

// generateSopBatch · async · expandeix múltiples items en una sola crida ·
// estalvi ~30% adicional vs N crides separades.
//
// args ·
//   socPurpose · context
//   items · array de labels (≤ 5 recomanat)
//   projectId
//
// Retorna · { ok, sops:[{ label, sop }], strategy, cost }
export async function generateSopBatch({
    socPurpose,
    items = [],
    sectorContext = null,
    projectId = null,
} = {}) {
    if (!socPurpose || items.length === 0) {
        throw new Error('generateSopBatch · socPurpose + items required');
    }
    const itemsList = items.map((label, i) => '  ' + (i + 1) + '. ' + label).join('\n');
    const prompt = [
        'Ets dissenyador d\'SOPs cooperatius SOS.',
        '',
        'SOC PROPÒSIT · ' + socPurpose,
        sectorContext ? 'SECTOR · ' + sectorContext : '',
        '',
        'GENERA ' + items.length + ' SOPs detallats, un per cada item ·',
        itemsList,
        '',
        'Respon NOMÉS JSON estricte ·',
        '',
        '{',
        '  "sops": [',
        '    { "label": "...", "title": "...", "steps": ["1. ...", "2. ..."], "duration_minutes": 30, "prerequisites": ["..."], "deliverables": ["..."] }',
        '  ]',
        '}',
        '',
        'Sense markdown · sense codeblock · sols JSON.',
    ].filter(Boolean).join('\n');

    const strategy = decideStrategy({
        prompt,
        taskKind: 'sop-structured',
        suggestedTier: 'draft',
        projectId,
        requireEvaluator: false,
    });

    if (strategy.decision === 'block') {
        return { ok: false, source: 'block', reason: strategy.reason };
    }
    if (strategy.decision === 'cache-hit') {
        recordHit();
        return { ok: true, sops: cacheGet(strategy.cacheKey)?.sops || [], strategy, cost: 0, source: 'cache' };
    }
    recordMiss();

    const { runPrompt } = await import('./aiRouterService.js');
    let result;
    try {
        result = await runPrompt({
            prompt,
            taskKind: 'sop-structured',
            taskTier: 'draft',
            systemPrompt: 'Ets dissenyador d\'SOPs cooperatius SOS · respons JSON estricte.',
            maxOutputTokens: 1500,
            temperature: 0.3,
            projectId,
        });
    } catch (e) {
        return { ok: false, source: 'ai-error', reason: e?.message };
    }

    const text = result?.output || result?.text || '';
    let parsed;
    try {
        const fenced = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
        const candidate = (fenced ? fenced[1] : text).trim();
        const start = candidate.indexOf('{');
        const end = candidate.lastIndexOf('}');
        parsed = JSON.parse(candidate.slice(start, end + 1));
    } catch (e) {
        return { ok: false, source: 'parse-error', reason: 'JSON parse failed' };
    }
    if (!parsed || !Array.isArray(parsed.sops)) {
        return { ok: false, source: 'shape-error', reason: 'no sops array' };
    }

    const sops = parsed.sops.map(s => ({
        label: String(s.label || ''),
        sop: {
            title: String(s.title || s.label || '').slice(0, 200),
            steps: Array.isArray(s.steps) ? s.steps.map(x => String(x)) : [],
            duration_minutes: typeof s.duration_minutes === 'number' ? s.duration_minutes : null,
            prerequisites: Array.isArray(s.prerequisites) ? s.prerequisites.map(p => String(p)) : [],
            deliverables: Array.isArray(s.deliverables) ? s.deliverables.map(d => String(d)) : [],
        },
    }));

    if (strategy.cacheKey) cacheSet(strategy.cacheKey, { sops });

    const costEur = result.usage ? _estimateUsageCostEur(result.modelKey, result.usage) : (strategy.estimatedCostEur || 0);
    if (projectId && costEur > 0) recordSpend(projectId, costEur);

    return { ok: true, sops, strategy, cost: costEur, modelKey: result.modelKey, source: 'ai' };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function _estimateUsageCostEur(modelKey, usage) {
    try {
        const { actualCostUsd } = require('./aiProviderService.js');
        const usd = actualCostUsd(modelKey, usage) || 0;
        return Number((usd * 0.92).toFixed(6));
    } catch (_) { return 0; }
}

// estimateHierarchicalSavings · pure · compara cost monolític vs jerarquic
//
// args ·
//   itemsCount · quants items espera la SOC
//   itemsExpanded · quants l'usuari realment expandirà (≤ itemsCount)
//   monolithicTokens · tokens necessaris si gen tot d'una (default 5000)
//   outlineTokens · tokens per a outline (default 500)
//   perItemTokens · tokens per SOP item (default 600)
//
// Retorna · { monolithic, hierarchical, savings, savingsPct }
export function estimateHierarchicalSavings({
    itemsCount = 8,
    itemsExpanded = 3,
    monolithicTokens = 5000,
    outlineTokens = 500,
    perItemTokens = 600,
} = {}) {
    const monolithic = monolithicTokens;
    const hierarchical = outlineTokens + (itemsExpanded * perItemTokens);
    const savings = monolithic - hierarchical;
    return {
        monolithic,
        hierarchical,
        savings,
        savingsPct: Number((savings / monolithic).toFixed(3)),
    };
}
