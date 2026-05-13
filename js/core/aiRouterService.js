// =============================================================================
// TEAMTOWERS SOS V11 — AI ROUTER SERVICE (IA-ROUTER-001 sprint A)
//
// Service pur · catàleg dels 5 providers IA que SOS suporta amb les seves
// modèls/preus/usatges + routing matrix per task kind + escalation chain
// "només puja a modèl superior si el test de qualitat falla".
//
// Filosofia · usuari paga consum prepagat (BIZ-MODEL-001) · cada cèntim
// compta. La cadena de routing busca el balanç qualitat/cost més favorable.
//
// Pricing en USD per 1M tokens (input/output) · 2026-Q2 · cal actualitzar
// trimestralment via /settings o pull de provider docs. ALL VALUES SON
// APROXIMATS · cada provider modifica preus sense avís previu.
// =============================================================================

// ── Catàleg de modèls · cada entrada congelada ──────────────────────────
// `tier` · 'micro' < 'small' < 'mid' < 'large' < 'frontier' (cost creixent)
// `kind` · 'general' · 'reasoner' (raonament profund) · 'multimodal' · 'creative'
// `quality` · 1-5 (5 = top quality coneguda)
// `pricing` · USD per 1M tokens · {input, output}
// `contextK` · context window en milers de tokens

export const AI_MODELS = Object.freeze({
    // Anthropic · qualitat narrativa + raonament estructurat
    'anthropic/opus-4.7':      Object.freeze({ provider:'anthropic', id:'claude-opus-4-7',         tier:'frontier', kind:'general',    quality:5, pricing:{input:15.00, output:75.00}, contextK:1000 }),
    'anthropic/sonnet-4.6':    Object.freeze({ provider:'anthropic', id:'claude-sonnet-4-6',       tier:'mid',      kind:'general',    quality:4, pricing:{input: 3.00, output:15.00}, contextK: 200 }),
    'anthropic/haiku-4.5':     Object.freeze({ provider:'anthropic', id:'claude-haiku-4-5',        tier:'small',    kind:'general',    quality:3, pricing:{input: 1.00, output: 5.00}, contextK: 200 }),

    // OpenAI · GPT-5 + omni + minis
    'openai/gpt-5':            Object.freeze({ provider:'openai',    id:'gpt-5',                   tier:'frontier', kind:'general',    quality:5, pricing:{input: 1.25, output:10.00}, contextK: 400 }),
    'openai/gpt-4o':           Object.freeze({ provider:'openai',    id:'gpt-4o',                  tier:'mid',      kind:'multimodal', quality:4, pricing:{input: 2.50, output:10.00}, contextK: 128 }),
    'openai/gpt-4o-mini':      Object.freeze({ provider:'openai',    id:'gpt-4o-mini',             tier:'small',    kind:'general',    quality:3, pricing:{input: 0.15, output: 0.60}, contextK: 128 }),

    // Google · Gemini Pro/Flash · Flash-Lite és batalla price/perf
    'gemini/2.5-pro':          Object.freeze({ provider:'gemini',    id:'gemini-2.5-pro',          tier:'large',    kind:'multimodal', quality:4, pricing:{input: 1.25, output:10.00}, contextK:2000 }),
    'gemini/2.5-flash':        Object.freeze({ provider:'gemini',    id:'gemini-2.5-flash',        tier:'small',    kind:'multimodal', quality:3, pricing:{input: 0.15, output: 0.60}, contextK:1000 }),
    'gemini/2.5-flash-lite':   Object.freeze({ provider:'gemini',    id:'gemini-2.5-flash-lite',   tier:'micro',    kind:'general',    quality:2, pricing:{input: 0.075,output: 0.30}, contextK:1000 }),

    // DeepSeek · raonament profund + ratio price/perf molt agressiu
    'deepseek/v3':             Object.freeze({ provider:'deepseek',  id:'deepseek-v3',             tier:'mid',      kind:'general',    quality:4, pricing:{input: 0.27, output: 1.10}, contextK:  64 }),
    'deepseek/r1':             Object.freeze({ provider:'deepseek',  id:'deepseek-r1',             tier:'mid',      kind:'reasoner',   quality:5, pricing:{input: 0.55, output: 2.19}, contextK:  64 }),

    // Minimax · text + multimodal (audio/video) · text-only ràtio agressiu
    'minimax/m2':              Object.freeze({ provider:'minimax',   id:'minimax-m2',              tier:'small',    kind:'multimodal', quality:3, pricing:{input: 0.30, output: 1.20}, contextK: 200 }),
});

export const MODEL_IDS = Object.freeze(Object.keys(AI_MODELS));

// ── Routing matrix · task kind → escalation chain ─────────────────────────
// Cadascuna és [primary, fallback, premium] · l'orquestrador prova primary;
// si l'avaluador rebutja, retry amb fallback; si falla altre cop, premium.
//
// Tradeoff explicat als comentaris · usuari pot sobreescriure via /settings.

export const TASK_ROUTING = Object.freeze({
    // Lectura/sumari curt · KB pruning · titles
    'summary-short':        Object.freeze({ primary:'gemini/2.5-flash-lite', fallback:'anthropic/haiku-4.5',   premium:'anthropic/sonnet-4.6', evaluator:'anthropic/haiku-4.5' }),
    // Descriptions + tags + landing-fill
    'schema-fill-simple':   Object.freeze({ primary:'gemini/2.5-flash',      fallback:'deepseek/v3',           premium:'anthropic/sonnet-4.6', evaluator:'anthropic/haiku-4.5' }),
    // Narrativa creativa (landing hero · presentation IA)
    'creative-narrative':   Object.freeze({ primary:'anthropic/sonnet-4.6',  fallback:'openai/gpt-4o',         premium:'anthropic/opus-4.7',   evaluator:'deepseek/r1' }),
    // Value map · roles + transactions amb coherència sistèmica
    'value-map-design':     Object.freeze({ primary:'anthropic/sonnet-4.6',  fallback:'deepseek/r1',           premium:'anthropic/opus-4.7',   evaluator:'deepseek/r1' }),
    // SOPs estructurats · steps amb body markdown
    'sop-structured':       Object.freeze({ primary:'deepseek/v3',           fallback:'anthropic/sonnet-4.6',  premium:'anthropic/opus-4.7',   evaluator:'anthropic/haiku-4.5' }),
    // Workshop outline · educational
    'workshop-outline':     Object.freeze({ primary:'gemini/2.5-flash',      fallback:'anthropic/sonnet-4.6',  premium:'anthropic/sonnet-4.6', evaluator:'anthropic/haiku-4.5' }),
    // Code generation
    'code-generation':      Object.freeze({ primary:'deepseek/v3',           fallback:'anthropic/sonnet-4.6',  premium:'anthropic/opus-4.7',   evaluator:'deepseek/r1' }),
    // Audit · qualitat avaluador propi
    'quality-audit':        Object.freeze({ primary:'deepseek/r1',           fallback:'anthropic/sonnet-4.6',  premium:'anthropic/opus-4.7',   evaluator:'anthropic/opus-4.7' }),
    // Raonament profund (anàlisis · trade-offs · ROI)
    'deep-reasoning':       Object.freeze({ primary:'deepseek/r1',           fallback:'gemini/2.5-pro',        premium:'anthropic/opus-4.7',   evaluator:'anthropic/opus-4.7' }),
    // Multimodal · imatges (workshops thumbnails · landings)
    'multimodal-image':     Object.freeze({ primary:'gemini/2.5-flash',      fallback:'openai/gpt-4o',         premium:'gemini/2.5-pro',       evaluator:'anthropic/haiku-4.5' }),
    // Tags / etiquetes / permaweb tags
    'tag-generation':       Object.freeze({ primary:'gemini/2.5-flash-lite', fallback:'anthropic/haiku-4.5',   premium:'anthropic/haiku-4.5',  evaluator:null }),
});

export const TASK_KINDS = Object.freeze(Object.keys(TASK_ROUTING));

// ── Pure helpers ────────────────────────────────────────────────────────

// estimateCostUsd · cost en USD per a una crida concreta · tokens
// d'entrada+sortida pre-comptats per l'orquestrador (tokenizer aproximat)
export function estimateCostUsd(modelKey, { inputTokens = 0, outputTokens = 0 } = {}) {
    const m = AI_MODELS[modelKey];
    if (!m) return null;
    const inP  = m.pricing.input  / 1_000_000;
    const outP = m.pricing.output / 1_000_000;
    return Number((inputTokens * inP + outputTokens * outP).toFixed(6));
}

// estimateCostEur · USD * factor (default 0.92 ≈ EUR conversió) · simplificat
// per la UI · el ratio canvia · usuari pot sobreescriure a /settings.
const USD_EUR = 0.92;
export function estimateCostEur(modelKey, tokens, { rate = USD_EUR } = {}) {
    const usd = estimateCostUsd(modelKey, tokens);
    if (usd === null) return null;
    return Number((usd * rate).toFixed(6));
}

// getRouting · accés directe a la chain · null si task kind no existeix
export function getRouting(taskKind) {
    return TASK_ROUTING[taskKind] || null;
}

// getModelChain · retorna [primary, fallback, premium] com a array (utility)
export function getModelChain(taskKind) {
    const r = getRouting(taskKind);
    if (!r) return [];
    return [r.primary, r.fallback, r.premium].filter(Boolean);
}

// pickModelForBudget · donat un budget EUR i una estimació de tokens,
// retorna el modèl de MÀXIMA qualitat que cap dins del budget per a la task.
// Si cap modèl de la chain cap, retorna el més barat (i el caller decideix
// si avorta o accepta la qualitat baixa).
export function pickModelForBudget({ taskKind, budgetEur, inputTokens = 0, outputTokens = 0, rate = USD_EUR } = {}) {
    const chain = getModelChain(taskKind);
    if (chain.length === 0) return null;
    let best = null;
    let cheapest = null;
    for (const key of chain) {
        const cost = estimateCostEur(key, { inputTokens, outputTokens }, { rate });
        if (cost === null) continue;
        if (cheapest === null || cost < cheapest.cost) cheapest = { key, cost };
        if (cost <= budgetEur) {
            // Greater "tier" wins among models within budget
            if (!best || AI_MODELS[key].quality > AI_MODELS[best.key].quality) {
                best = { key, cost };
            }
        }
    }
    if (best) return { ...best, withinBudget: true };
    if (cheapest) return { ...cheapest, withinBudget: false };
    return null;
}

// IA-PROVIDER-PREF-001 · pickBestModelForProvider · donat un providerId
// (anthropic|openai|gemini|deepseek|minimax) i un taskKind, retorna el
// modelKey d'aquell provider més adequat per a la task. Si el provider
// no té cap model "encaixable" per al kind requerit, retorna el de més
// alta qualitat del provider (degradació elegant).
//
// Estratègia · prioritza models del provider que coincideixen amb el
// `kind` requerit (ex. taskKind 'sop-structured' → kind 'reasoner' o
// 'general'). Si cap, agafa el de quality més alta del provider.
const TASK_KIND_PREFERENCE = Object.freeze({
    'creative-narrative': ['general', 'creative', 'multimodal'],
    'value-map-design':   ['reasoner', 'general'],
    'schema-fill-simple': ['general', 'multimodal'],
    'sop-structured':     ['reasoner', 'general'],
    'workshop-outline':   ['general', 'multimodal'],
    'code-generation':    ['reasoner', 'general'],
    'quality-audit':      ['reasoner', 'general'],
    'deep-reasoning':     ['reasoner'],
    'multimodal-image':   ['multimodal'],
    'tag-generation':     ['general', 'multimodal'],
    'summary-short':      ['general', 'multimodal'],
});
export function pickBestModelForProvider({ providerId, taskKind } = {}) {
    if (!providerId) return null;
    const candidates = MODEL_IDS.filter(k => AI_MODELS[k].provider === providerId);
    if (candidates.length === 0) return null;
    const preferredKinds = TASK_KIND_PREFERENCE[taskKind] || ['general'];
    // Prioritat 1 · model del provider amb kind preferit · més qualitat
    for (const kind of preferredKinds) {
        const ofKind = candidates.filter(k => AI_MODELS[k].kind === kind);
        if (ofKind.length > 0) {
            ofKind.sort((a, b) => AI_MODELS[b].quality - AI_MODELS[a].quality);
            return ofKind[0];
        }
    }
    // Prioritat 2 · qualsevol model del provider · més qualitat (degradació)
    candidates.sort((a, b) => AI_MODELS[b].quality - AI_MODELS[a].quality);
    return candidates[0];
}

// runEscalation · helper d'execució estilitzat per al caller. Rep:
//   - taskKind
//   - generate(modelKey, ctx) · funció que crida el provider real i retorna text
//   - evaluate(output, modelKey, ctx) · funció async que avalua qualitat ·
//     retorna { ok:boolean, reason?, score? }. Pot ser null per saltar
//     l'avaluació (cas tag-generation).
//   - ctx · context arbitrari passat a generate/evaluate
//   - opts.stopAt · 'primary' | 'fallback' | 'premium' · límit superior
//
// Retorna { output, modelKey, attempts:[{modelKey, evalOk, evalReason}] }
// L'orquestrador real (encara per construir) farà aquesta crida amb proveïdor.
// Aquesta funció és testable: la pots passar generate/evaluate mockejats.
export async function runEscalation({
    taskKind,
    generate,
    evaluate = null,
    ctx = {},
    stopAt = 'premium',
    preferredProvider = null,   // IA-PROVIDER-PREF-001 · prepend al chain si l'usuari té preferència
} = {}) {
    const r = getRouting(taskKind);
    if (!r) throw new Error('runEscalation · unknown taskKind: ' + taskKind);
    const order = [];
    // IA-PROVIDER-PREF-001 · si hi ha preferred-provider, prova primer un
    // model d'aquest provider per a la task (sense duplicar si ja és al chain)
    if (preferredProvider) {
        const preferredModel = pickBestModelForProvider({ providerId: preferredProvider, taskKind });
        if (preferredModel) order.push(preferredModel);
    }
    if (r.primary  && !order.includes(r.primary))  order.push(r.primary);
    if (r.fallback && stopAt !== 'primary' && !order.includes(r.fallback)) order.push(r.fallback);
    if (r.premium  && stopAt === 'premium' && !order.includes(r.premium)) order.push(r.premium);
    const attempts = [];
    const missingKeyProviders = new Set();
    let lastErr = null;
    let anyGenerateSucceeded = false;
    for (const modelKey of order) {
        try {
            const output = await generate(modelKey, ctx);
            anyGenerateSucceeded = true;
            if (!evaluate) {
                attempts.push({ modelKey, evalOk: true });
                return { output, modelKey, attempts };
            }
            const ev = await evaluate(output, modelKey, ctx);
            attempts.push({ modelKey, evalOk: !!ev.ok, evalReason: ev.reason || null, evalScore: ev.score });
            if (ev && ev.ok) {
                return { output, modelKey, attempts };
            }
            // continua la cadena
        } catch (e) {
            lastErr = e;
            // Track per-provider · si totes les claus falten, surface-them al caller
            if (e?.code === 'no-api-key' && e.provider) missingKeyProviders.add(e.provider);
            attempts.push({
                modelKey,
                evalOk:     false,
                evalReason: 'generate-failed: ' + (e?.message || e),
                errorCode:  e?.code || null,
                provider:   e?.provider || null,
            });
        }
    }
    // Cap modèl ha passat l'avaluador · si tenim almenys un output, retornem-lo
    // amb un flag · si tots han fallat en throw, llencem un error informatiu.
    const lastAttempt = attempts[attempts.length - 1];
    if (!lastAttempt) throw new Error('runEscalation · no attempts (chain buida)');
    if (lastErr && !attempts.some(a => a.evalOk) && !anyGenerateSucceeded) {
        // Tots els intents han llançat. Si la causa única és "no-api-key", surface
        // codi específic perquè la UI mostri CTA cap a /settings amb providers.
        if (missingKeyProviders.size && attempts.every(a => a.errorCode === 'no-api-key')) {
            const err = new Error('runEscalation · no API keys configurades · ' + Array.from(missingKeyProviders).join(', '));
            err.code = 'no-api-key';
            err.providers = Array.from(missingKeyProviders);
            err.attempts = attempts;
            throw err;
        }
        const err = new Error('runEscalation · all models failed · last: ' + (lastErr?.message || lastErr));
        err.attempts = attempts;
        throw err;
    }
    return { output: null, modelKey: null, attempts, escalatedExhausted: true };
}
