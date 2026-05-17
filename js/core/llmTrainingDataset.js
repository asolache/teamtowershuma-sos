// =============================================================================
// TEAMTOWERS SOS V11 — v146 · LLM TRAINING DATASET BUILDER
// Ruta · /js/core/llmTrainingDataset.js
//
// Item wo-llm-local-train (Part A · dataset prep) ·
// Genera JSONL d'entrenament des de la KB local · skills declarades +
// WO history + deliverables + canvas/pitch + maps de valor del propi
// usuari. Format · instruction-tuning · 3 dialectes suportats ·
//   · `chatml`     · OpenAI / Anthropic / Mistral · {role,content}
//   · `alpaca`     · {instruction, input, output} · LoRA-friendly
//   · `sharegpt`   · {conversations: [{from,value}]} · Axolotl-friendly
//
// API ·
//  · buildDataset({ kb?, format?, maxSamples?, includeSkills?, includeWOs?, includeValueMaps? })
//      → { ok, samples[], stats }
//  · serializeJsonl(samples) → string (newline-delimited JSON)
//  · sourceCounts(samples) → { skills, work_orders, value_maps, ... }
//
// Filosofia · zero leakage de claus API · zero PII · només contingut SOS
// públic del KB local · l'usuari pot revisar el JSONL abans de pujar a
// cloud GPU per a fine-tune.
// =============================================================================

export const TRAINING_VERSION = 'v146';

export const SUPPORTED_FORMATS = Object.freeze(['chatml', 'alpaca', 'sharegpt']);

// ── KB resolver ─────────────────────────────────────────────────────────
async function _resolveKb(kb) {
    if (kb) return kb;
    try { return (await import('./kb.js')).KB; } catch (_) { return null; }
}

// ── Helpers per a cada tipus de node ────────────────────────────────────
//
// Cada source converteix N nodes en N samples · cada sample és un parell
// instruction→output que ensenya al model el "estil" SOS de l'usuari.

function _skillsToSamples(skills) {
    return (skills || []).filter(s => s?.content?.title || s?.title).map(s => {
        const c = s.content || s;
        const title = c.title || c.name || '';
        const desc  = c.description || c.body || c.summary || '';
        return {
            instruction: 'Descriu la skill "' + title + '" en context SOS.',
            input:       title,
            output:      desc,
            source:      'skill',
            sourceId:    s.id,
        };
    });
}

function _workOrdersToSamples(wos) {
    return (wos || []).filter(w => w?.content?.title || w?.title).map(w => {
        const c = w.content || w;
        const title  = c.title || '';
        const desc   = c.description || c.body || '';
        const status = c.status || 'unknown';
        const role   = c.role_ref || c.role || '';
        return {
            instruction: 'Donada aquesta WO descripció, genera un pla d\'execució SOS-style.',
            input:       'WO · ' + title + (role ? ' (role: ' + role + ')' : '') + '\n' + desc,
            output:      'Status · ' + status + '\nPla · ' + (c.plan || c.execution_plan || desc.slice(0, 200)),
            source:      'work_order',
            sourceId:    w.id,
        };
    });
}

function _valueMapsToSamples(maps) {
    return (maps || []).filter(m => m?.content?.roles || m?.roles).map(m => {
        const c = m.content || m;
        const roles = (c.roles || []).slice(0, 6).map(r => '· ' + (r.name || r.id) + ' [' + (r.castell_level || '?') + ']').join('\n');
        const txs   = (c.transactions || []).slice(0, 6).map(t => '· ' + t.from + ' → ' + t.to + ' (' + (t.deliverable || t.type || '?') + ')').join('\n');
        const projName = c.projectName || c.name || c.projectId || 'projecte';
        return {
            instruction: 'Genera un mapa de valor SOS-style per a "' + projName + '".',
            input:       projName,
            output:      'Rols principals ·\n' + roles + '\n\nTransactions ·\n' + txs,
            source:      'value_map',
            sourceId:    m.id,
        };
    });
}

function _canvasesToSamples(canvases) {
    return (canvases || []).filter(c => c?.content?.vision || c?.vision).map(c => {
        const ct = c.content || c;
        const proj = ct.projectName || ct.name || 'projecte';
        return {
            instruction: 'Genera un canvas (visió/missió/valors) SOS-style.',
            input:       proj,
            output:      'Visió · ' + (ct.vision || '—') + '\nMissió · ' + (ct.mission || '—') + '\nValors · ' + ((ct.values || []).join(' · ') || '—'),
            source:      'canvas',
            sourceId:    c.id,
        };
    });
}

function _pitchesToSamples(pitches) {
    return (pitches || []).filter(p => p?.content?.problem || p?.problem).map(p => {
        const c = p.content || p;
        const proj = c.projectName || c.name || 'projecte';
        return {
            instruction: 'Genera un pitch (problem/solution/why-now) SOS-style.',
            input:       proj,
            output:      'PROBLEM · ' + (c.problem || '—') + '\nSOLUTION · ' + (c.solution || '—') + '\nWHY NOW · ' + (c.why_now || c.whyNow || '—'),
            source:      'pitch',
            sourceId:    p.id,
        };
    });
}

// ── buildDataset · main API ─────────────────────────────────────────────
//
// Args ·
//   kb              · injectable · default · ./kb.js
//   format          · 'chatml' | 'alpaca' | 'sharegpt' · default 'alpaca'
//   maxSamples      · cap màxim · default 1000
//   includeSkills   · default true
//   includeWOs      · default true
//   includeValueMaps· default true
//   includeCanvases · default true
//   includePitches  · default true
//   systemMessage   · default SOS persona · usat al format chatml/sharegpt
//
// Retorna · { ok, samples[], stats }
export async function buildDataset({
    kb = null,
    format = 'alpaca',
    maxSamples = 1000,
    includeSkills = true,
    includeWOs = true,
    includeValueMaps = true,
    includeCanvases = true,
    includePitches = true,
    systemMessage = 'Ets un consultor SOS V11 expert en VNA (Verna Allee), Lean, Antigravity. Respon en català · estil del knowledge local del client.',
} = {}) {
    if (!SUPPORTED_FORMATS.includes(format)) {
        return { ok: false, error: 'format-not-supported · ' + format + ' · usa ' + SUPPORTED_FORMATS.join('|'), samples: [] };
    }
    const k = await _resolveKb(kb);
    if (!k || typeof k.query !== 'function') {
        return { ok: false, error: 'kb-unavailable', samples: [] };
    }

    const [skills, wos, valueMaps, canvases, pitches] = await Promise.all([
        includeSkills    ? k.query({ type: 'skill' }).catch(() => [])         : Promise.resolve([]),
        includeWOs       ? k.query({ type: 'work_order' }).catch(() => [])    : Promise.resolve([]),
        includeValueMaps ? k.query({ type: 'value_map' }).catch(() => [])     : Promise.resolve([]),
        includeCanvases  ? k.query({ type: 'project_canvas' }).catch(() => []): Promise.resolve([]),
        includePitches   ? k.query({ type: 'project_pitch' }).catch(() => []) : Promise.resolve([]),
    ]);

    const raw = [
        ..._skillsToSamples(skills),
        ..._workOrdersToSamples(wos),
        ..._valueMapsToSamples(valueMaps),
        ..._canvasesToSamples(canvases),
        ..._pitchesToSamples(pitches),
    ].filter(s => s.output && s.output.length > 10);

    // Cap màxim · podem fer un mix balancejat futur (stratified) · v147+
    const capped = raw.slice(0, Math.max(1, maxSamples));

    const samples = capped.map(s => _toFormat(s, format, systemMessage));

    const stats = {
        total: samples.length,
        format,
        bySource: sourceCounts(capped),
    };
    return { ok: true, samples, stats };
}

function _toFormat(sample, format, systemMessage) {
    if (format === 'alpaca') {
        return {
            instruction: sample.instruction,
            input:       sample.input || '',
            output:      sample.output,
            source:      sample.source,
        };
    }
    if (format === 'chatml') {
        return {
            messages: [
                { role: 'system',    content: systemMessage },
                { role: 'user',      content: sample.instruction + (sample.input ? '\n\n' + sample.input : '') },
                { role: 'assistant', content: sample.output },
            ],
            source: sample.source,
        };
    }
    if (format === 'sharegpt') {
        return {
            conversations: [
                { from: 'system', value: systemMessage },
                { from: 'human',  value: sample.instruction + (sample.input ? '\n\n' + sample.input : '') },
                { from: 'gpt',    value: sample.output },
            ],
            source: sample.source,
        };
    }
    return sample;
}

// ── sourceCounts · pure · agregació per tipus ─────────────────────────
export function sourceCounts(samples = []) {
    const out = {};
    for (const s of samples) {
        const k = s.source || 'unknown';
        out[k] = (out[k] || 0) + 1;
    }
    return out;
}

// ── serializeJsonl · pure · cada sample una línia JSON ────────────────
export function serializeJsonl(samples = []) {
    return (samples || []).map(s => JSON.stringify(s)).join('\n');
}
