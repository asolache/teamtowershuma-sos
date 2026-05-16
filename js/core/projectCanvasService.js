// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT CANVAS SERVICE
// Ruta · /js/core/projectCanvasService.js
//
// Wizard 5-passes per a definir un projecte abans d'engegar el cicle complet
// (pitch · tokenomics · accounting · etc). Persisteix com a content.canvas al
// node project. Pure logic · no toca KB · no toca DOM · injectable IA.
//
// Steps · vision · mission · values · stakeholders · north-star
//
// PRINCIPIS · pure · injectable IA runner (failover via runEscalation) ·
// validació explícita (min/max) · tots els passes opcionals fins al darrer.
// =============================================================================

export const CANVAS_STEPS = Object.freeze([
    Object.freeze({
        id:          'vision',
        label:       'Vision · futur a 10 anys',
        prompt:      'Quin món vols veure si aquest projecte triomfa? Una frase potent · 1-2 línies · present narratiu.',
        minLength:   20,
        maxLength:   400,
        aiSeed:      'Genera una vision statement curta (1-2 frases · present narratiu) per al projecte. Inspiració · what world will exist when we win.',
    }),
    Object.freeze({
        id:          'mission',
        label:       'Mission · què fem cada dia',
        prompt:      'Què fa el teu equip cada dia per arribar a la vision? Acció concreta · audience clara · diferenciador.',
        minLength:   30,
        maxLength:   500,
        aiSeed:      'Genera una mission statement (què fem · per a qui · com és diferent) per al projecte.',
    }),
    Object.freeze({
        id:          'values',
        label:       'Values · principis no negociables',
        prompt:      '3-5 valors operatius (no slogans). Exemples · "transparència radical", "experimentació > consens", "anchoring ètic abans que velocitat".',
        minLength:   30,
        maxLength:   600,
        aiSeed:      'Llista 3-5 valors operatius (no slogans buits) per al projecte. Cada valor · 1 paraula clau + 1 frase explicativa.',
    }),
    Object.freeze({
        id:          'stakeholders',
        label:       'Stakeholders · qui guanya què',
        prompt:      'Per a cada stakeholder (fundadors · clients · operadors · inversors · comunitat) · què guanyen exactament? Si no està clar, no està dissenyat.',
        minLength:   40,
        maxLength:   800,
        aiSeed:      'Mapa de stakeholders (5+) i què guanya cadascú · concret · evita generalitats.',
    }),
    Object.freeze({
        id:          'north-star',
        label:       'North-star · mètrica única',
        prompt:      'Una mètrica única que captura el valor entregat (no vanity). Ex · "MAU que han facturat 1€ via SOS al mes", no "users registrats".',
        minLength:   15,
        maxLength:   300,
        aiSeed:      'Proposa una north-star metric (mètrica única · operacional · no vanity) per al projecte.',
    }),
]);

// buildEmptyCanvas · estat inicial · tots els passes buits, completedAt null
export function buildEmptyCanvas({ ts = null } = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    const steps = {};
    for (const s of CANVAS_STEPS) steps[s.id] = { value: '', updatedAt: null };
    return {
        steps,
        createdAt:   now,
        updatedAt:   now,
        completedAt: null,
    };
}

// validateCanvasStep · pura · retorna { ok, reason }
// Refusa string buit · refusa per sota minLength · refusa per sobre maxLength.
export function validateCanvasStep(stepId, value) {
    const step = CANVAS_STEPS.find(s => s.id === stepId);
    if (!step) return { ok: false, reason: 'unknown-step' };
    const v = typeof value === 'string' ? value.trim() : '';
    if (!v) return { ok: false, reason: 'empty' };
    if (v.length < step.minLength) return { ok: false, reason: 'too-short', need: step.minLength };
    if (v.length > step.maxLength) return { ok: false, reason: 'too-long', max: step.maxLength };
    return { ok: true };
}

// applyCanvasStep · pura · retorna nou canvas amb el step actualitzat
// No muta input. Si validació falla · llança Error amb reason.
export function applyCanvasStep(canvas, stepId, value, { ts = null } = {}) {
    const validation = validateCanvasStep(stepId, value);
    if (!validation.ok) {
        const err = new Error('canvas-step-invalid · ' + validation.reason);
        err.reason = validation.reason;
        throw err;
    }
    const now = (typeof ts === 'number') ? ts : Date.now();
    const next = {
        ...canvas,
        steps: {
            ...canvas.steps,
            [stepId]: { value: value.trim(), updatedAt: now },
        },
        updatedAt: now,
    };
    // Si tots els 5 steps tenen valor vàlid · marca completedAt
    const allFilled = CANVAS_STEPS.every(s => {
        const v = next.steps[s.id]?.value || '';
        return validateCanvasStep(s.id, v).ok;
    });
    next.completedAt = allFilled ? now : null;
    return next;
}

// computeCanvasCompletion · pura · 0-1 (i percentatge int)
export function computeCanvasCompletion(canvas) {
    if (!canvas || !canvas.steps) return { ratio: 0, percent: 0, filled: 0, total: CANVAS_STEPS.length };
    let filled = 0;
    for (const s of CANVAS_STEPS) {
        const v = canvas.steps[s.id]?.value || '';
        if (validateCanvasStep(s.id, v).ok) filled++;
    }
    const ratio = filled / CANVAS_STEPS.length;
    return {
        ratio,
        percent: Math.round(ratio * 100),
        filled,
        total:   CANVAS_STEPS.length,
    };
}

// applyCanvasToProject · pura · merge canvas dins project.content.canvas
// No destrueix altres camps de content. Retorna nou project (immutable).
export function applyCanvasToProject(project, canvas) {
    if (!project) throw new Error('project required');
    if (!canvas)  throw new Error('canvas required');
    const content = { ...(project.content || {}) };
    content.canvas = canvas;
    return {
        ...project,
        content,
        updatedAt: canvas.updatedAt || Date.now(),
    };
}

// buildAiPromptForStep · pura · construeix prompt per a IA failover runner.
// El consumidor pasa context (descripció · sector · stakeholders previs) ·
// retorna string ready-to-send al runEscalation.
export function buildAiPromptForStep(stepId, context = {}) {
    const step = CANVAS_STEPS.find(s => s.id === stepId);
    if (!step) throw new Error('unknown step ' + stepId);
    const lines = [];
    lines.push('Ets ajudant fundador SOS. Genera el draft per a aquest pas del canvas.');
    lines.push('');
    lines.push('## Step · ' + step.label);
    lines.push('Pregunta · ' + step.prompt);
    lines.push('Seed · ' + step.aiSeed);
    lines.push('Constraints · entre ' + step.minLength + ' i ' + step.maxLength + ' caràcters.');
    lines.push('');
    if (context.projectName)   lines.push('Project · ' + context.projectName);
    if (context.sector)        lines.push('Sector · ' + context.sector);
    if (context.description)   lines.push('Descripció · ' + context.description);
    if (context.previousSteps && typeof context.previousSteps === 'object') {
        const filled = Object.entries(context.previousSteps).filter(([_, v]) => v && v.value);
        if (filled.length) {
            lines.push('');
            lines.push('## Passes previs ja omplerts (referència · coherent amb ells)');
            for (const [id, st] of filled) {
                const step = CANVAS_STEPS.find(s => s.id === id);
                if (step) lines.push('- ' + step.label + ' · ' + st.value);
            }
        }
    }
    lines.push('');
    lines.push('Retorna · NOMÉS el text del step · sense markdown headers · sense salutació.');
    return lines.join('\n');
}

// generateStepDraft · async · invoca runner injectable (IA) per a omplir el step.
// El runner ha de tenir signature `async ({ prompt }) → string`.
// Per al test · injecta un mock. Per a producció · es bind a runEscalation.
export async function generateStepDraft({ stepId, context = {}, runner = null } = {}) {
    if (!runner || typeof runner !== 'function') {
        throw new Error('runner required (injectable IA)');
    }
    const prompt = buildAiPromptForStep(stepId, context);
    const raw = await runner({ prompt });
    if (typeof raw !== 'string' || !raw.trim()) {
        throw new Error('runner returned empty draft');
    }
    return raw.trim();
}
