// =============================================================================
// TEAMTOWERS SOS V11 — DOMAIN DETECTOR · LLM FALLBACK (v127)
// Ruta · /js/core/domainDetectorLLM.js
//
// Quan el keyword matcher (`detectDomain`) retorna confidence < 0.4 o null ·
// fem una one-shot call cheap (small-tier · ~0.001€) per inferir el sub-domini
// a partir del context lliure (name + description). El model retorna l'id
// canonical d'un dels packs existents · o "business-generic" si cap matcha.
//
// Filosofia · KISS · 1 call simple · NO escalation · si falla retornem null
// (fallback al catàleg de sector estàndard).
//
// Cost típic · prompt ~250 tokens + output ~30 tokens = ~0.0005€ amb haiku-tier
// = barat com per fer-ho cada projecte nou.
// =============================================================================

import { DOMAIN_IDS, DOMAIN_PACKS, getDomainPack } from './domainDetector.js';

export const DETECTOR_LLM_VERSION = 'v1.0';

const BUSINESS_GENERIC = 'business-generic';

// buildDomainDetectionPrompt · pure · construeix el prompt mínim per a la
// detecció. Inclou l'enumeració de dominis suportats amb 1-frase descriptor
// per a guiatge sense gastar context.
export function buildDomainDetectionPrompt({ name = '', description = '', sector = null } = {}) {
    const domainList = DOMAIN_IDS.map(id => `  · "${id}" · ${DOMAIN_PACKS[id].label}`).join('\n');
    const user = `TASCA · classifica aquest projecte en UN dels dominis sub-sectorials del SOS.

Projecte ·
- Nom · "${name}"
- Descripció · ${description || '(buida)'}
- Sector CNAE · ${sector || '(no especificat)'}

Dominis disponibles ·
${domainList}
  · "${BUSINESS_GENERIC}" · projecte business típic sense sub-domini específic

INSTRUCCIONS ·
- Tria UN sol id de la llista (exacte · case-sensitive).
- Si el projecte combina 2 dominis · tria el dominant (el que defineix més rols).
- Si dubtes o és genèric (SaaS · consultoria · botiga · startup) · tria "${BUSINESS_GENERIC}".
- NO inventis dominis nous.
- NO escriguis res que no sigui el JSON.

Retorna SOLS aquest JSON ·
{ "domain": "<id-exacte-de-la-llista>", "confidence": 0.0-1.0, "reasoning": "1 frase curta" }`;

    const system = `Ets un classificador de dominis organitzacionals. Tries un domini canonical d'una llista tancada. Output JSON pur · res més.`;

    return { system, user };
}

// parseDetectionResponse · pure · parseja la resposta JSON del model
// Defensiu · accepta wrapping codeblocks · text abans/després · etc.
export function parseDetectionResponse(text) {
    if (!text || typeof text !== 'string') return null;
    // Extreu JSON · primer { ... } que matchi
    let json = text.trim();
    const m = json.match(/\{[\s\S]*\}/);
    if (m) json = m[0];
    try {
        const obj = JSON.parse(json);
        if (!obj || typeof obj.domain !== 'string') return null;
        const validIds = [...DOMAIN_IDS, BUSINESS_GENERIC];
        if (!validIds.includes(obj.domain)) return null;
        return {
            domain:     obj.domain,
            confidence: Number(obj.confidence) || 0.5,
            reasoning:  typeof obj.reasoning === 'string' ? obj.reasoning : '',
        };
    } catch (_) { return null; }
}

// detectDomainViaLLM · async · una crida small-tier · retorna detection
// enriquida amb el pack si trobat, o null si business-generic o error.
// `generateWithProvider` · injectable per a tests (default · lazy import
// aiProviderService quan disponible).
export async function detectDomainViaLLM({
    name = '', description = '', sector = null,
    generateWithProvider = null,
    preferredProvider = null,
    fallbackModelKey = null,    // ex 'claude-haiku' · null → adapter tria small-tier
} = {}) {
    if ((!name && !description)) return null;
    let provider = generateWithProvider;
    if (!provider) {
        try {
            const mod = await import('./aiProviderService.js');
            provider = mod.generateWithProvider;
        } catch (_) { return null; }
    }
    if (typeof provider !== 'function') return null;

    const prompt = buildDomainDetectionPrompt({ name, description, sector });
    let text;
    try {
        const res = await provider(fallbackModelKey || 'auto-small', {
            systemPrompt: prompt.system,
            userPrompt:   prompt.user,
            maxOutputTokens: 200,
            temperature:  0.2,
            preferredProvider,
        });
        text = res?.text || '';
    } catch (_) { return null; }

    const parsed = parseDetectionResponse(text);
    if (!parsed) return null;
    if (parsed.domain === BUSINESS_GENERIC) {
        return {
            domain:      BUSINESS_GENERIC,
            label:       'Business genèric · sense sub-domini',
            confidence:  parsed.confidence,
            reasoning:   parsed.reasoning,
            archetypes:  [],
            intangibles: [],
            patterns:    [],
            via:         'llm',
        };
    }
    const pack = getDomainPack(parsed.domain);
    if (!pack) return null;
    return {
        ...pack,
        domain:      parsed.domain,
        confidence:  parsed.confidence,
        reasoning:   parsed.reasoning,
        matchCount:  null,    // n/a · via LLM
        scoreRaw:    null,
        via:         'llm',
    };
}

// detectDomainSmart · combina keyword detector + LLM fallback automàtic
// Estratègia · si keyword detector dóna confidence ≥ threshold (default 0.4) ·
// usa'l (gratis). Si no · invoca LLM (~0.0005€). El resultat porta `via` ·
// "keywords" | "llm" | "none".
export async function detectDomainSmart({
    name = '', description = '', sector = null,
    threshold = 0.4,
    enableLLMFallback = true,
    detectDomain = null,    // injectable per a tests
    generateWithProvider = null,
    preferredProvider = null,
} = {}) {
    const kwFn = detectDomain || (await import('./domainDetector.js')).detectDomain;
    const kw = kwFn({ name, description, sector });
    if (kw && kw.confidence >= threshold) {
        return { ...kw, via: 'keywords' };
    }
    if (!enableLLMFallback) {
        return kw ? { ...kw, via: 'keywords-weak' } : null;
    }
    const llm = await detectDomainViaLLM({ name, description, sector, generateWithProvider, preferredProvider });
    if (llm) return llm;
    if (kw) return { ...kw, via: 'keywords-weak' };   // millor que res
    return null;
}

export const __test_helpers__ = { BUSINESS_GENERIC };
