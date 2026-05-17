// =============================================================================
// TEAMTOWERS SOS V11 — PROMPT TIER ROUTER (PR-Q · wo-prompt-router-by-tier)
// Ruta · /js/core/promptTierRouter.js
//
// Mapeja cada TASK_KIND al model tier òptim segons criteri cost/quality ·
// - reasoner   · pensament profund · valoria d'estructura (design-value-map-rich)
// - mid        · construcció estàndard (most tasks)
// - small      · text generation simple (landing copy · pitch hooks)
// - tag-gen    · enumeració trivial (no n'usem encara)
//
// Filosofia · "right model per al job · estalvi 30-50% mantenint qualitat
// top a la fase crítica" (KISS · cost-conscious del SYSTEM_BASE).
//
// Pure · zero deps · safe Node + browser.
// =============================================================================

export const TIER_ROUTER_VERSION = 'v1.0';

// Mapping · taskKind → tier · cost-aware
export const TASK_TO_TIER = Object.freeze({
    // ── pensament profund · qualitat top imprescindible · ★ reasoner ★ ──
    'design-value-map-rich':         'reasoner',
    'enrich-value-map':              'reasoner',   // legacy · mateixa intensitat
    'generate-socs-from-value-map':  'reasoner',   // requereix entendre estructures

    // ── construcció estàndard · mid model (cost balanç) ──
    'classify-and-pick-socs':        'mid',
    'generate-sops-from-soc':        'mid',
    'generate-sops-with-skills':     'mid',
    'generate-wos-from-sop':         'mid',
    'generate-soc':                  'mid',
    'expand-sop':                    'mid',
    'define-product-service':        'mid',
    'personalize-canvas':            'mid',
    'personalize-pitch':             'mid',

    // ── text generation simple · small (cost mínim) ──
    'personalize-landing':           'small',
});

// Tier → routing label (per integració amb aiRouterService)
export const TIER_TO_ROUTING = Object.freeze({
    reasoner: 'quality-audit',      // chain · deepseek/r1 → sonnet → opus
    mid:      'sop-structured',     // chain · deepseek/v3 → sonnet → opus
    small:    'creative-narrative', // chain · sonnet → gpt-4o → opus (per quality narrative)
});

// pickTier · pure · retorna el tier per a un taskKind · fallback 'mid'
export function pickTier(taskKind) {
    return TASK_TO_TIER[taskKind] || 'mid';
}

// pickRoutingForTask · pure · retorna el routing key d'aiRouterService que
// es correspon al tier òptim per al taskKind.
// Si callers vol overridejar (per cost extra · o per provider preferit) ·
// el caller agafa el resultat i el sobrescriu manualment.
export function pickRoutingForTask(taskKind) {
    return TIER_TO_ROUTING[pickTier(taskKind)] || 'sop-structured';
}

// estimateCostMultiplier · pure · per UI "veure quant més car és el reasoner"
// vs el mid · per a transparència al /prompts-debug.
export function estimateCostMultiplier(taskKind) {
    const tier = pickTier(taskKind);
    return { reasoner: 5, mid: 1, small: 0.3 }[tier] || 1;
}

// listAllRoutings · helper UI · per a /prompts-debug
export function listAllRoutings() {
    return Object.entries(TASK_TO_TIER).map(([task, tier]) => ({
        task,
        tier,
        routing: TIER_TO_ROUTING[tier],
        costMultiplier: estimateCostMultiplier(task),
    }));
}
