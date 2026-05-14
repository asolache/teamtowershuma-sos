// =============================================================================
// TEAMTOWERS SOS V11 — PLAN ENFORCER (BIZ-MODEL-001 sprint C)
//
// Service pur · decideix si una operació monetitzada està permesa segons
// el plan actual de l'usuari. Filosofia · saldo prepagat com a unitat
// principal · els plans desbloquegen quotes + UX premium · no bloquegen
// l'ús bàsic.
//
// Decisions @alvaro:
//   - Free plan · KB local + IA amb pròpia API key · zero crides a SOS
//     plataforma · publish/blockchain bloquejat fins upgrade
//   - Pro plan · saldo prepagat consumible · publish/blockchain ok mentre
//     hi hagi saldo
//   - Cooperative · igual que Pro · multiplier Cohort · stake compartit
//   - Enterprise · SLA · self-hosted · cap límit
//
// Filosofia · zero paywall obstrusiu · sols enforce quan l'usuari intenta
// gastar saldo (publish · IA proxy · blockchain). Free pot fer tot el
// local-first sense limit.
// =============================================================================

// Catàleg congelat · permís per operació · plan
//   true  · permès
//   false · bloquejat · cal upgrade
//   null  · permès però amb avís (futur · per a soft-limits)
//
// PUBLISH-SELECT-001 · NOU `permaweb-publish-paid` · els usuaris Free poden
// publicar PAGANT una fee addicional (publicEntityService.PUBLISH_FREE_FEE_MULT
// · default ×1.5 sobre el preu base). El check `permaweb-publish` (no-paid)
// segueix bloquejant per upgrade gratuït.
export const PLAN_PERMISSIONS = Object.freeze({
    free: Object.freeze({
        'permaweb-publish':       false,   // bloqueja sense pagament
        'permaweb-publish-paid':  true,    // OK pagant fee addicional
        'permaweb-revoke':        false,
        'workshop-unlock':        false,
        'ai-via-sos-proxy':       false,
        'gnosis-tx':              false,
        'project-create':         true,
        'workshop-create':        true,
        'sop-create':             true,
        'value-map-edit':         true,
        'ai-via-own-key':         true,    // sempre OK · l'usuari paga directe al provider
        'export-snapshot':        true,
    }),
    pro: Object.freeze({
        'permaweb-publish':       true,
        'permaweb-publish-paid':  true,
        'permaweb-revoke':        true,
        'workshop-unlock':        true,
        'ai-via-sos-proxy':       true,
        'gnosis-tx':              true,
        'project-create':         true,
        'workshop-create':        true,
        'sop-create':             true,
        'value-map-edit':         true,
        'ai-via-own-key':         true,
        'export-snapshot':        true,
    }),
    cooperative: Object.freeze({
        'permaweb-publish':       true,
        'permaweb-publish-paid':  true,
        'permaweb-revoke':        true,
        'workshop-unlock':        true,
        'ai-via-sos-proxy':       true,
        'gnosis-tx':              true,
        'project-create':         true,
        'workshop-create':        true,
        'sop-create':             true,
        'value-map-edit':         true,
        'ai-via-own-key':         true,
        'export-snapshot':        true,
    }),
    enterprise: Object.freeze({
        // Enterprise · totes les operacions permeses · SLA + self-hosted
        'permaweb-publish':       true,
        'permaweb-publish-paid':  true,
        'permaweb-revoke':        true,
        'workshop-unlock':        true,
        'ai-via-sos-proxy':       true,
        'gnosis-tx':              true,
        'project-create':         true,
        'workshop-create':        true,
        'sop-create':             true,
        'value-map-edit':         true,
        'ai-via-own-key':         true,
        'export-snapshot':        true,
    }),
});

export const VALID_OPS = Object.freeze(Object.keys(PLAN_PERMISSIONS.free));

// canPerform · pur · decideix si una operació està permesa segons el planId
//   planId · 'free' | 'pro' | 'cooperative' | 'enterprise' (o null = free)
//   op     · clau de PLAN_PERMISSIONS.{plan}
// Retorna · { allowed:bool, reason:string|null, requiredPlan:string|null }
export function canPerform({ planId = 'free', op } = {}) {
    if (!op) return { allowed: false, reason: 'op-required', requiredPlan: null };
    const safePlanId = PLAN_PERMISSIONS[planId] ? planId : 'free';
    const perms = PLAN_PERMISSIONS[safePlanId];
    if (!(op in perms)) {
        return { allowed: false, reason: 'unknown-op · ' + op, requiredPlan: null };
    }
    if (perms[op]) {
        return { allowed: true, reason: null, requiredPlan: null };
    }
    // Trobar el plan més baix que el permet
    let requiredPlan = null;
    for (const p of ['pro', 'cooperative', 'enterprise']) {
        if (PLAN_PERMISSIONS[p] && PLAN_PERMISSIONS[p][op]) {
            requiredPlan = p;
            break;
        }
    }
    return {
        allowed:  false,
        reason:   'plan-required · ' + safePlanId + ' no permet "' + op + '"',
        requiredPlan,
    };
}

// requirePermission · async · llegeix plan del KB i throws si no permès
//   Defensa contra usage non-authorized des dels services consumibles
//   (publishToPermaweb · recordWorkshopUnlock · etc.)
export async function requirePermission(op, { kb = null, loadPlan = null } = {}) {
    let planId = 'free';
    try {
        if (loadPlan) {
            const p = await loadPlan(kb);
            planId = p?.planId || 'free';
        } else {
            const { loadCurrentPlan } = await import('./stripeService.js');
            const p = await loadCurrentPlan(kb);
            planId = p?.planId || 'free';
        }
    } catch (_) { planId = 'free'; }
    const check = canPerform({ planId, op });
    if (!check.allowed) {
        const err = new Error('plan-required · operació "' + op + '" requereix plan "' + (check.requiredPlan || 'pro') + '" · pla actual: ' + planId);
        err.code         = 'plan-required';
        err.op           = op;
        err.currentPlan  = planId;
        err.requiredPlan = check.requiredPlan;
        throw err;
    }
    return { planId, op };
}

// upgradeUrlForOp · pur · retorna URL on l'usuari pot fer upgrade
// (sprint D futur connectarà amb Stripe subscription).
export function upgradeUrlForOp(op, currentPlan = 'free') {
    const check = canPerform({ planId: currentPlan, op });
    if (check.allowed) return null;
    return '/settings?upgrade=' + encodeURIComponent(check.requiredPlan || 'pro') + '&for=' + encodeURIComponent(op);
}

// planLabel · helper UX
export function planLabel(planId) {
    return ({
        free:        'Free',
        pro:         'Pro · saldo prepagat',
        cooperative: 'Cooperative · USDC + cohort',
        enterprise:  'Enterprise · custom',
    })[planId] || 'Free';
}
