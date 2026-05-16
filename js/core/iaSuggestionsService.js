// =============================================================================
// TEAMTOWERS SOS V11 — IA SUGGESTIONS SERVICE (UX-CENTRAL-HUB-001 part)
// Ruta · /js/core/iaSuggestionsService.js
//
// Pure helper · detecta patrons al projecte que mereixen una "suggestió
// disruptiva" al Project Hub · cost · KPI · network match · audit gaps.
//
// L'usuari clica "Accept" · l'acció s'executa. L'usuari clica "Dismiss"
// · la suggestió desapareix per a aquesta sessió.
//
// Pure · zero KB · zero DOM · zero crides IA.
// =============================================================================

export const SUGGESTION_KINDS = Object.freeze([
    'cost-savings',       // pots estalviar X canviant tier
    'kpi-alert',          // KPI vermell · cal acció
    'network-match',      // un altre projecte similar · connecta
    'audit-gap',          // ORG audit detecta something
    'lifecycle-stage',    // aconseguit milestone · suggereix proper pas
    'budget-warning',     // budget IA aprop del límit
    'wo-overdue',         // WOs claimed > 7 dies sense complete
    'soc-checklist-stale', // SOC checklist no executat fa temps
]);

export const SUGGESTION_PRIORITY = Object.freeze(['urgent', 'high', 'medium', 'low']);

// ── Builders ───────────────────────────────────────────────────────────────

function _buildSuggestion({ kind, priority = 'medium', title, message, action = null, dismissable = true, payload = {} }) {
    return {
        kind,
        priority,
        title,
        message,
        action,           // { kind: 'navigate'|'mutate'|'modal', href|fn|modalId, label }
        dismissable,
        payload,
        ts: Date.now(),
    };
}

// ── Detectors · pure ──────────────────────────────────────────────────────

// detectCostSavings · si sessió té gastat > X i tier 'critical' usat sovint
// suggereix baixar a 'quality' per a la majoria de tasques.
export function detectCostSavings({ sessionUsdSpent = 0, criticalCallCount = 0, totalCallCount = 0 } = {}) {
    if (totalCallCount === 0) return null;
    const criticalRatio = criticalCallCount / totalCallCount;
    if (sessionUsdSpent < 0.05) return null;     // poc gastat · no cal alerta
    if (criticalRatio < 0.3) return null;        // ja predominantment cheap

    const estSavings = sessionUsdSpent * 0.4;    // ~40% si baixes a quality
    return _buildSuggestion({
        kind: 'cost-savings',
        priority: 'medium',
        title: '💸 Pots estalviar ' + estSavings.toFixed(3) + '$',
        message: 'Has gastat $' + sessionUsdSpent.toFixed(3) + ' aquesta sessió amb tier critical ' + (criticalRatio * 100).toFixed(0) + '% del temps. Baixar a "quality" reduiria el cost ~40% sense pèrdua de qualitat per a tasques no-crítiques.',
        action: { kind: 'modal', modalId: 'ai-tier-config', label: 'Ajustar tier per defecte' },
        payload: { estSavings, sessionUsdSpent, criticalRatio },
    });
}

// detectKpiAlerts · processos amb KPI vermell
export function detectKpiAlerts({ processes = [] } = {}) {
    const out = [];
    for (const proc of processes) {
        if (!proc || proc.status !== 'active') continue;
        const kpis = proc.kpis || [];
        for (const k of kpis) {
            if (k.currentValue == null || k.target == null) continue;
            const ratio = k.currentValue / k.target;
            if (ratio < 0.7) {
                out.push(_buildSuggestion({
                    kind: 'kpi-alert',
                    priority: 'high',
                    title: '⚠ KPI vermell · ' + (proc.label || proc.id),
                    message: k.label + ' · actual ' + k.currentValue + ' < ' + (k.target * 0.7).toFixed(2) + ' (70% target ' + k.target + ')',
                    action: { kind: 'navigate', href: '/process/' + proc.id, label: 'Investigar' },
                    payload: { processId: proc.id, kpiId: k.id, ratio },
                }));
            }
        }
    }
    return out;
}

// detectAuditGaps · des de auditOrg result
export function detectAuditGaps({ orgAudit = null } = {}) {
    if (!orgAudit || !Array.isArray(orgAudit.findings)) return [];
    return orgAudit.findings
        .filter(f => f.level === 'critical' || f.level === 'warning')
        .slice(0, 3)
        .map(f => _buildSuggestion({
            kind: 'audit-gap',
            priority: f.level === 'critical' ? 'urgent' : 'high',
            title: '🔍 ' + f.message,
            message: f.suggestedWo ? 'Suggested action · ' + f.suggestedWo : 'Cal revisió manual',
            action: f.suggestedWo
                ? { kind: 'mutate', fn: 'create-wo-' + f.suggestedWo, label: 'Crear WO de correcció' }
                : null,
        }));
}

// detectBudgetWarning · des de budgetStatus
export function detectBudgetWarning({ budgetStatus: bs = null } = {}) {
    if (!bs || bs.state === 'ok' || bs.state === 'unlimited') return null;
    const priority = bs.state === 'hard' ? 'urgent' : (bs.state === 'over' ? 'high' : 'medium');
    return _buildSuggestion({
        kind: 'budget-warning',
        priority,
        title: '💳 Budget IA · ' + (bs.ratio * 100).toFixed(0) + '%',
        message: 'Has gastat ' + bs.spent + '€ de ' + bs.budget + '€ aquest mes (' + (bs.ratio * 100).toFixed(0) + '%)',
        action: { kind: 'modal', modalId: 'ai-budget-increase', label: 'Augmentar budget' },
        payload: bs,
    });
}

// detectWoOverdue · WOs claimed > N dies sense complete
export function detectWoOverdue({ wos = [], maxAgeMs = 7 * 24 * 3600 * 1000, ts = Date.now() } = {}) {
    const overdue = (wos || []).filter(wo => {
        if (wo.status !== 'claimed' && wo.status !== 'in-progress') return false;
        if (!wo.claimed_at) return false;
        return (ts - wo.claimed_at) > maxAgeMs;
    });
    if (overdue.length === 0) return null;
    return _buildSuggestion({
        kind: 'wo-overdue',
        priority: 'high',
        title: '⏰ ' + overdue.length + ' WO(s) overdue',
        message: overdue.length + ' work order(s) reclamats fa més de 7 dies sense completar',
        action: { kind: 'navigate', href: '/kanban', label: 'Veure Kanban' },
        payload: { count: overdue.length, ids: overdue.map(w => w.id) },
    });
}

// detectNetworkMatch · si el projecte té tags + un altre projecte similar
// és visible · suggerit per a connexió
export function detectNetworkMatch({ project, otherProjects = [], minSharedTags = 2 } = {}) {
    if (!project || !Array.isArray(project.tags)) return null;
    const myTags = new Set(project.tags);
    const matches = otherProjects
        .filter(p => p && p.id !== project.id && Array.isArray(p.tags))
        .map(p => ({
            project: p,
            sharedTags: p.tags.filter(t => myTags.has(t)),
        }))
        .filter(m => m.sharedTags.length >= minSharedTags);
    if (matches.length === 0) return null;
    const best = matches[0];
    return _buildSuggestion({
        kind: 'network-match',
        priority: 'low',
        title: '🔗 Projecte similar · ' + (best.project.nombre || best.project.name),
        message: best.sharedTags.length + ' tags compartits · ' + best.sharedTags.slice(0, 3).join(', '),
        action: { kind: 'navigate', href: '/project/' + best.project.id, label: 'Veure projecte' },
        payload: { matchedProjectId: best.project.id, sharedTags: best.sharedTags },
    });
}

// ── Aggregator · ranking + top N ──────────────────────────────────────────

// buildSuggestionsList · combina tots els detectors · ordena per prioritat ·
// retorna top N (default 3 · per al Project Hub)
//
// args ·
//   context · { aiCostStats, processes, orgAudit, budgetStatus, wos,
//               project, otherProjects }
//   limit · default 3
//   dismissed · array d'IDs/kinds dismissats per a aquesta sessió
//
// Retorna · array de suggestions ordenades per prioritat
export function buildSuggestionsList({
    context = {},
    limit = 3,
    dismissed = [],
} = {}) {
    const all = [];
    const cs = detectCostSavings(context.aiCostStats || {});
    if (cs) all.push(cs);

    all.push(...detectKpiAlerts(context));
    all.push(...detectAuditGaps(context));

    const bw = detectBudgetWarning(context);
    if (bw) all.push(bw);

    const ovd = detectWoOverdue(context);
    if (ovd) all.push(ovd);

    const nm = detectNetworkMatch(context);
    if (nm) all.push(nm);

    // Custom suggestions injected externally
    if (Array.isArray(context.custom)) {
        all.push(...context.custom);
    }

    // Filter dismissed
    const dismissedSet = new Set(dismissed);
    const filtered = all.filter(s => !dismissedSet.has(s.kind) && !dismissedSet.has(s.title));

    // Sort by priority
    const prioRank = { urgent: 4, high: 3, medium: 2, low: 1 };
    filtered.sort((a, b) => (prioRank[b.priority] || 0) - (prioRank[a.priority] || 0));

    return filtered.slice(0, limit);
}
