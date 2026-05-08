// =============================================================================
// TEAMTOWERS SOS V11 — FLOW ANIMATION SERVICE (H_ANIM_001 sprint A)
// Ruta: /js/core/flowAnimationService.js
//
// Helpers puros para preparar la animación del flujo de valor sobre el
// ValueMap · pulsos viajando por las aristas en orden secuencial. El
// orden viene de transactions[i].sequence_order (entero ≥1) cuando está
// presente; fallback a orden de creación / posición en el array.
//
// Funciones PURAS · sin I/O · sin D3 · testeables en node.
// =============================================================================

// ─── Ordenación y agrupación ────────────────────────────────────────────────

// Devuelve copia del array de transactions ordenadas:
// 1) primero las que tienen sequence_order (asc)
// 2) luego las que no, en su orden original (estable)
export function normalizeTransactionsOrder(transactions) {
    if (!Array.isArray(transactions)) return [];
    const withOrder = [];
    const without   = [];
    transactions.forEach((t, idx) => {
        if (!t) return;
        const so = t.sequence_order;
        const isOrdered = (typeof so === 'number' && Number.isFinite(so) && so >= 1);
        if (isOrdered) withOrder.push({ tx: t, so, idx });
        else           without.push({ tx: t, idx });
    });
    withOrder.sort((a, b) => a.so === b.so ? a.idx - b.idx : a.so - b.so);
    return [...withOrder.map(x => x.tx), ...without.map(x => x.tx)];
}

// Agrupa transactions por phase (string libre). Las que no tienen phase
// quedan en un grupo '__unphased'. Conserva el orden interno.
export function groupTransactionsByPhase(transactions) {
    const sorted = normalizeTransactionsOrder(transactions);
    const groups = {};
    for (const t of sorted) {
        const p = (typeof t.phase === 'string' && t.phase.trim()) ? t.phase.trim() : '__unphased';
        if (!groups[p]) groups[p] = [];
        groups[p].push(t);
    }
    return groups;
}

// ─── Cálculo de pulsos para D3 / SVG ────────────────────────────────────────

// Construye el descriptor de los pulsos a animar. Cada pulso = {from, to,
// txId, sequenceOrder, delay, duration, phase}.
//
// Modo 'sequential' (default): los pulsos viajan uno tras otro, respetando
// el orden, con `pulseDuration` cada uno. delay acumulativo.
// Modo 'parallel-by-phase': pulsos del mismo phase salen a la vez; entre
// phases hay separación. Útil para BPMN-light.
//
// `pulseDuration` y `gap` en ms.
export function computeAnimationCycles(transactions, options = {}) {
    const sorted = normalizeTransactionsOrder(transactions);
    if (!sorted.length) return { pulses: [], totalDuration: 0 };
    const mode      = options.mode || 'sequential';
    const duration  = Number.isFinite(options.pulseDuration) ? options.pulseDuration : 1500;
    const gap       = Number.isFinite(options.gap) ? options.gap : 200;
    const pulses    = [];

    if (mode === 'parallel-by-phase') {
        const groups = groupTransactionsByPhase(sorted);
        const phaseOrder = Object.keys(groups).filter(k => k !== '__unphased').concat(groups.__unphased ? ['__unphased'] : []);
        let accDelay = 0;
        for (const phase of phaseOrder) {
            const list = groups[phase] || [];
            for (const t of list) {
                pulses.push({
                    txId:          t.id,
                    from:          t.from,
                    to:            t.to,
                    sequenceOrder: typeof t.sequence_order === 'number' ? t.sequence_order : null,
                    phase:         phase === '__unphased' ? null : phase,
                    delay:         accDelay,
                    duration,
                });
            }
            accDelay += duration + gap;
        }
        return { pulses, totalDuration: accDelay };
    }

    // sequential
    let acc = 0;
    for (const t of sorted) {
        pulses.push({
            txId:          t.id,
            from:          t.from,
            to:            t.to,
            sequenceOrder: typeof t.sequence_order === 'number' ? t.sequence_order : null,
            phase:         (typeof t.phase === 'string' && t.phase.trim()) ? t.phase.trim() : null,
            delay:         acc,
            duration,
        });
        acc += duration + gap;
    }
    return { pulses, totalDuration: acc };
}

// ─── Validación / sanity de datos ───────────────────────────────────────────

// Detecta inconsistencias del orden. Devuelve {ok, warnings: [...]}
// Útil para mostrar al usuario "los siguientes pasos no tienen orden".
export function validateFlowOrder(transactions) {
    const warnings = [];
    if (!Array.isArray(transactions)) return { ok: false, warnings: ['transactions no es array'] };
    const ordered = transactions.filter(t => typeof t?.sequence_order === 'number');
    const unordered = transactions.filter(t => !t || typeof t.sequence_order !== 'number');
    if (unordered.length) {
        warnings.push(unordered.length + ' transacciones sin sequence_order · animarán al final del ciclo');
    }
    // Detectar duplicados de sequence_order
    const counts = {};
    for (const t of ordered) {
        const k = String(t.sequence_order);
        counts[k] = (counts[k] || 0) + 1;
    }
    for (const k of Object.keys(counts)) {
        if (counts[k] > 1) warnings.push('sequence_order ' + k + ' se repite ' + counts[k] + ' veces');
    }
    // Gaps en la secuencia (1, 2, 4 → falta 3)
    if (ordered.length) {
        const sortedOrders = ordered.map(t => t.sequence_order).sort((a, b) => a - b);
        for (let i = 1; i < sortedOrders.length; i++) {
            const gap = sortedOrders[i] - sortedOrders[i - 1];
            if (gap > 1) {
                warnings.push('gap entre sequence_order ' + sortedOrders[i - 1] + ' y ' + sortedOrders[i]);
            }
        }
    }
    return { ok: warnings.length === 0, warnings };
}

// Asigna sequence_order automáticamente a transactions sin orden,
// continuando desde el máximo existente. PURO · devuelve nuevo array.
export function autoFillSequenceOrder(transactions) {
    if (!Array.isArray(transactions)) return [];
    const maxSo = transactions.reduce((m, t) => {
        const so = t?.sequence_order;
        return (typeof so === 'number' && so > m) ? so : m;
    }, 0);
    let next = maxSo + 1;
    return transactions.map(t => {
        if (!t) return t;
        if (typeof t.sequence_order === 'number') return { ...t };
        const updated = { ...t, sequence_order: next };
        next++;
        return updated;
    });
}

// Modo de animación canónicos · útil para selector UI.
export const ANIMATION_MODES = Object.freeze([
    { id: 'sequential',         label: 'Secuencial',          hint: 'Pulsos uno a uno respetando sequence_order' },
    { id: 'parallel-by-phase',  label: 'Paralelo por fase',   hint: 'Pulsos del mismo phase a la vez · entre fases hay gap' },
]);

// ─── H_ANIM_001 sprint C · prompt builder para inferir orden con IA ────────
// Construye el user prompt para el LLM. PURO · testeable sin tokens.
// roles: array {id, name, description?, castell_level?}
// transactions: array {id, from, to, deliverable?, type?, is_must?}
// projectName: string (opcional, para contexto)
export function buildFlowOrderPrompt({ roles = [], transactions = [], projectName = '' } = {}) {
    if (!Array.isArray(roles) || !Array.isArray(transactions)) {
        throw new Error('buildFlowOrderPrompt: roles y transactions deben ser arrays');
    }
    if (transactions.length === 0) {
        throw new Error('buildFlowOrderPrompt: no hay transactions para ordenar');
    }
    const rolesSummary = roles.map(r => '  - ' + r.id + (r.name ? ' · ' + r.name : '') + (r.castell_level ? ' (' + r.castell_level + ')' : '')).join('\n') || '  (sin roles definidos)';
    const txsList = transactions.map(t =>
        '  - ' + t.id + ' · ' + t.from + ' → ' + t.to +
        (t.deliverable ? ' · "' + t.deliverable + '"' : '') +
        (t.type ? ' [' + t.type + (t.is_must ? ' · MUST' : '') + ']' : '')
    ).join('\n');

    return [
        'TAREA: Inferir el ORDEN SECUENCIAL más razonable del flujo de valor de un proyecto VNA (Value Network Analysis), asignando a cada transaction un sequence_order (entero ≥1) y opcionalmente un phase (string · ej. "descubrimiento", "propuesta", "producción", "entrega", "cobro", "cierre").',
        '',
        'PROYECTO: ' + (projectName || '(sin nombre)'),
        '',
        'ROLES VNA:',
        rolesSummary,
        '',
        'TRANSACTIONS (' + transactions.length + '):',
        txsList,
        '',
        'INSTRUCCIONES:',
        '1. Asigna un sequence_order ÚNICO entre 1 y ' + transactions.length + ' a cada transaction.',
        '2. El orden refleja el ciclo natural de creación de valor: descubrimiento → propuesta → ejecución → entrega → cobro → cierre.',
        '3. Las transactions con `is_must: true` y `type: "tangible"` suelen ir antes en cada fase.',
        '4. Asigna un phase razonable (kebab-case · 1-2 palabras) cuando 2+ transactions agrupen.',
        '5. Si dos transactions son simultáneas conceptualmente, asígnales sequence_order distintos pero contiguos y el mismo phase.',
        '',
        'OUTPUT: SÓLO JSON válido con este schema:',
        '{',
        '  "ordered": [',
        '    { "id": "tx-id", "sequence_order": 1, "phase": "descubrimiento" },',
        '    ...',
        '  ],',
        '  "rationale": "Texto breve (1-2 frases) explicando el criterio de ordenación elegido."',
        '}',
    ].join('\n');
}

// Aplica el resultado del LLM (`ordered` array) a una lista de transactions.
// PURO · devuelve nueva lista con sequence_order y phase actualizados.
// `ordered` debe ser array de {id, sequence_order, phase?}.
export function applyOrderToTransactions(transactions, ordered) {
    if (!Array.isArray(transactions) || !Array.isArray(ordered)) return transactions || [];
    const map = new Map();
    for (const o of ordered) {
        if (!o || !o.id) continue;
        const so = Number(o.sequence_order);
        if (!Number.isFinite(so) || so < 1) continue;
        map.set(o.id, { sequence_order: so, phase: typeof o.phase === 'string' && o.phase.trim() ? o.phase.trim() : null });
    }
    return transactions.map(t => {
        if (!t || !map.has(t.id)) return t;
        const upd = map.get(t.id);
        return { ...t, sequence_order: upd.sequence_order, phase: upd.phase || t.phase || null };
    });
}

// Orquestador async · llama al LLM y devuelve {ordered, rationale, applied}.
// Caller decide si hacer commit del applied al store.
export async function inferFlowOrder({ roles, transactions, projectName = '', projectId = null, preferredEngine = 'anthropic' } = {}) {
    const userPrompt = buildFlowOrderPrompt({ roles, transactions, projectName });
    const systemPrompt = 'Eres el asistente IA del sistema TeamTowers SOS V11. Tu rol aquí es analizar un grafo de Value Network Analysis (VNA) y ordenar sus transactions secuencialmente para visualizar el flujo de valor. Respondes SÓLO con JSON válido, sin markdown ni texto adicional.';

    const { Orchestrator } = await import('./Orchestrator.js?v=' + Date.now());
    const result = await Orchestrator.callLLM({
        preferredEngine,
        systemPrompt,
        userPrompt,
        responseFormat: 'json_object',
        temperature:    0.2,
        maxTokens:      4096,
        // Si el toggle global de pruning está ON, también pasamos contexto · KM-001
        contextPruning: projectId ? { enabled: false, projectId, task: { projectId, types: ['sop','transaction'] } } : null,
        chargeWallet:   projectId ? { projectId } : null,
    });

    const out = result.content;
    if (!out || out.parseError || !Array.isArray(out.ordered)) {
        throw new Error('LLM devolvió respuesta no parseable o sin "ordered" array');
    }
    const applied = applyOrderToTransactions(transactions, out.ordered);
    return {
        ordered:  out.ordered,
        rationale: out.rationale || '',
        applied,
        telemetry: result.telemetry,
    };
}
