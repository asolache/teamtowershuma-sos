// =============================================================================
// TEAMTOWERS SOS V11 — SPRINT ORCHESTRATOR (SWARM-OP-001 sprint A)
//
// Core service que orchestrates the backlog loop · "Honor SOS Swarm Operative
// System". Permet a un agent IA recollir items del backlog + generar prompts
// + invocar el flow d'aiFillDim · audit a sprint_run nodes.
//
// Sprint A · pure helpers · UI manual triggering · NO code generation/apply
// (per a code apply cal humà in-the-loop · evita risc · sprint B+ explora).
//
// Tipus de runs:
//   draft      · IA escriu el pla d'implementació + diff suggestion
//   audit      · IA revisa estat actual del codebase i suggereix updates
//   research   · IA fa research sobre l'item (per a complexity XL)
// =============================================================================

import { INITIAL_BACKLOG, prioritizedPendingItems, summarizeBacklog,
         BACKLOG_PRIORITY, BACKLOG_COMPLEXITY } from './backlogManifest.js';

export const SPRINT_RUN_TYPE = 'sprint_run';
export const SPRINT_RUN_KINDS = Object.freeze([ 'draft', 'audit', 'research' ]);

// buildItemPrompt · pure · construeix system + user prompt per IA
export function buildItemPrompt({ item, kind = 'draft', principlesContext = '' } = {}) {
    if (!item) throw new Error('buildItemPrompt requires item');
    if (!SPRINT_RUN_KINDS.includes(kind)) throw new Error('unknown kind: ' + kind);
    const sys = [
        'Ets un agent operatiu de SOS · "Swarm Operative System" · TeamTowers V11.',
        'El teu rol · ' + (
            kind === 'draft'    ? 'redactar un PLA DE IMPLEMENTACIÓ concret + diff suggerit per a un ítem del backlog' :
            kind === 'audit'    ? 'auditar l\'estat actual del codebase i suggerir actualitzacions específiques' :
            kind === 'research' ? 'investigar trade-offs i biblioteques compatibles per a un ítem foundational' : '?'
        ),
        '',
        'Principis canònics SOS (alineament obligatori):',
        '  1. Tot són nodes (KB-first · zero side-effect intangible)',
        '  2. Tota aportació de valor es comptabilitza',
        '  3. Stripe + stakeholders → pool · distribució 20/80',
        '  4. Stack tècnic clau · IA · Permaweb · TEA · Smart contracts',
        '',
        'Format de resposta · markdown estructurat amb seccions clares · zero codi inline llarg (≥30 línies) · sols suggereix · l\'aplicació final la fa humà.',
    ].join('\n');

    const fields = [
        '## Ítem del backlog',
        '- **id**: `' + item.id + '`',
        '- **title**: ' + item.title,
        '- **priority**: ' + item.priority + ' (' + (BACKLOG_PRIORITY[item.priority]?.label || '?') + ')',
        '- **complexity**: ' + item.complexity + ' (' + (BACKLOG_COMPLEXITY[item.complexity]?.label || '?') + ')',
        '- **principles**: ' + (item.principles || []).join(', '),
        '- **dependencies**: ' + ((item.dependencies && item.dependencies.length) ? item.dependencies.join(', ') : 'none'),
        '',
        '## Descripció',
        item.description || '(no description)',
    ];
    if (item.testRequirements && item.testRequirements.length) {
        fields.push('', '## Test requirements');
        for (const t of item.testRequirements) fields.push('- ' + t);
    }
    if (item.suggestedFiles && item.suggestedFiles.length) {
        fields.push('', '## Fitxers suggerits');
        for (const f of item.suggestedFiles) fields.push('- `' + f + '`');
    }
    if (principlesContext) {
        fields.push('', '## Context principis (auto-injectat)', principlesContext);
    }
    fields.push('', '## Tasca específica per al rol "' + kind + '"');
    if (kind === 'draft') {
        fields.push(
            'Genera:',
            '1. **Resum executiu** (3-4 línies · què s\'aporta + per què)',
            '2. **Pla de fitxers** · llistat dels fitxers a crear/modificar amb una descripció 1-línia de cada canvi',
            '3. **API surface** · exports principals + signatures (sense implementació)',
            '4. **Test plan** · llistat dels test grups (A, B, C…) + què cada un verifica',
            '5. **Riscos** · 2-3 riscos identificats + mitigació',
            '6. **PR descripció** · markdown llest per a copy-paste a la PR',
        );
    } else if (kind === 'audit') {
        fields.push(
            'Audita el codebase actual respecte aquest ítem:',
            '1. **Estat actual** · què ja existeix relacionat',
            '2. **Gap analysis** · què falta concretament',
            '3. **Riscos d\'integració** · conflictes amb codi existent',
            '4. **Recomanació** · GO/NO-GO + ordre seqüencial de canvis',
        );
    } else if (kind === 'research') {
        fields.push(
            'Investiga:',
            '1. **Biblioteques candidates** · 2-3 amb pros/cons',
            '2. **Compatibilitat** · Web Crypto · Browser · Node 18+ · Arweave SDK',
            '3. **Decisió** · recomanació final + bundle size estimat',
            '4. **POC plan** · steps minimal viable',
        );
    }

    return {
        systemPrompt: sys,
        userPrompt:   fields.join('\n'),
        item:         { id: item.id, title: item.title, priority: item.priority, complexity: item.complexity },
        kind,
    };
}

// runSprintItem · async · executa l'item amb IA via aiFillDim (delegated)
// Retorna · { run, attempts, output, totalCostEur }
//
// SWARM-OP-002 · default runner ara usa `runEscalation` · si Anthropic
// torna HTTP 400 (saldo baix / credit balance too low) salta a OpenAI →
// Gemini → DeepSeek automàticament. Captura `attempts[]` per a la UI.
export async function runSprintItem({ itemId, kind = 'draft', items = INITIAL_BACKLOG, runner = null, taskKind = 'creative-narrative', preferredProvider = null } = {}) {
    const item = items.find(i => i.id === itemId);
    if (!item) throw new Error('runSprintItem · unknown itemId: ' + itemId);
    const prompt = buildItemPrompt({ item, kind });

    // Default runner · escalation chain via aiRouterService
    const run = runner || (async (p) => {
        const { generateWithProvider } = await import('./aiProviderService.js');
        const { runEscalation } = await import('./aiRouterService.js');
        const generate = (modelKey) => generateWithProvider(modelKey, {
            systemPrompt:    p.systemPrompt,
            userPrompt:      p.userPrompt,
            maxOutputTokens: 1800,
            temperature:     0.5,
        });
        const { output, modelKey, attempts, escalatedExhausted } = await runEscalation({
            taskKind,
            generate,
            preferredProvider,
        });
        if (!output) {
            const err = new Error('sprint runner · escalation exhausted · ' + (attempts || []).map(a => a.modelKey + '=' + (a.errorCode || 'fail')).join(', '));
            err.attempts = attempts;
            err.escalatedExhausted = !!escalatedExhausted;
            throw err;
        }
        // Propagate attempts perquè el caller pugui mostrar quins models s'han provat
        return { ...output, modelKey: modelKey || output.modelKey, attempts };
    });

    const startTs = Date.now();
    let output, error = null, errorAttempts = null;
    try {
        output = await run(prompt);
    } catch (e) {
        error = e?.message || String(e);
        errorAttempts = e?.attempts || null;   // SWARM-OP-002 · keep trace even on throw
    }

    const sprintRun = {
        id:   'sprint-run-' + startTs.toString(36) + '-' + Math.random().toString(36).slice(2, 6),
        type: SPRINT_RUN_TYPE,
        content: {
            itemId:    item.id,
            kind,
            output:    output?.text || null,
            usage:     output?.usage || null,
            modelKey:  output?.modelKey || null,
            // SWARM-OP-002 · trace de quins models s'han provat (per UI failover)
            attempts:  output?.attempts || errorAttempts || null,
            error,
            startTs,
            endTs:     Date.now(),
            durationMs: Date.now() - startTs,
        },
        keywords: [
            'type:sprint-run',
            'item:' + item.id,
            'kind:' + kind,
            ...(output?.modelKey ? ['model:' + output.modelKey] : []),
        ],
        createdAt: startTs,
        updatedAt: Date.now(),
    };
    return { run: sprintRun, output, error, item, prompt };
}

// persistSprintRun · async · upserts al KB
export async function persistSprintRun({ kb, run } = {}) {
    if (!kb || !run) return null;
    try { await kb.upsert(run); return run; }
    catch (e) { console.warn('[sprint] persist failed', e?.message); return null; }
}

// queryHistory · async · llegeix sprint_run nodes (last N)
export async function queryHistory({ kb, itemId = null, limit = 20 } = {}) {
    if (!kb) return [];
    try {
        const all = await kb.query({ type: SPRINT_RUN_TYPE });
        let filtered = all;
        if (itemId) filtered = filtered.filter(n => n?.content?.itemId === itemId);
        return filtered.sort((a, b) => (b?.content?.startTs || 0) - (a?.content?.startTs || 0)).slice(0, limit);
    } catch (_) { return []; }
}

// pickNextItem · pure · helper per al loop autonomous
export function pickNextItem(items = INITIAL_BACKLOG) {
    const queue = prioritizedPendingItems(items);
    return queue[0] || null;
}

// Re-export utilities for convenience
export { INITIAL_BACKLOG, summarizeBacklog, prioritizedPendingItems,
         BACKLOG_PRIORITY, BACKLOG_COMPLEXITY };
