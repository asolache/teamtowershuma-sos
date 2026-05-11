// TEAMTOWERS SOS V11 — COST TRACKING SERVICE (FUND-FLOW-001 sprint E)
//
// Agrega el consum del wallet d'un projecte en categories operatives:
//   - IA            · LLM crides (Orchestrator · Anthropic/OpenAI/etc.)
//   - PERMAWEB      · publish/revoke al registre públic Arweave
//   - BLOCKCHAIN    · gas Gnosis · pacts onchain (anticipat per PACT-001 sprint D)
//   - STAKEHOLDER   · claims retirats per parties
//   - TRANSFER_OUT  · transferències sortints cap a altres wallets
//   - OTHER         · qualsevol altre consume sense classificació
//
// Funciona derivant del wallet · zero migració de dades necessària.
// Pure helpers · testejables sense KB.

export const COST_CATEGORIES = Object.freeze([
    'ia', 'permaweb', 'blockchain', 'stakeholder', 'transfer-out', 'other',
]);

// classifyMovement · pura · retorna la categoria d'un moviment del wallet
// segons el source / ref / kind. Defensiu · default 'other'.
export function classifyMovement(mv) {
    if (!mv || mv.kind !== 'consume') return null;
    const src = String(mv.source || '').toLowerCase();
    const ref = String(mv.ref    || '').toLowerCase();
    // IA · LLM via Orchestrator
    if (src === 'orchestrator' || /^llm-/.test(ref)) return 'ia';
    // Permaweb · public registry publish/revoke
    if (src === 'public-registry-publish' || src === 'public-registry-revoke' ||
        /^permaweb-/.test(ref)) return 'permaweb';
    // Blockchain · pact onchain · gnosis tx (anticipat)
    if (src === 'gnosis-tx' || src === 'pact-onchain' || /^chain-/.test(ref)) return 'blockchain';
    // Stakeholder claim
    if (src === 'stakeholder-claim' || /:party-/.test(ref)) return 'stakeholder';
    // Transferència sortint
    if (src === 'manual-transfer' || src === 'transfer' || /^transfer-.*:out$/.test(ref)) return 'transfer-out';
    return 'other';
}

// summarizeCostsByCategory · pura · agrega tots els consums d'un wallet
// per categoria. Filtra opcionalment per range temporal.
// Retorna { totals: {ia, permaweb, ...}, count, periodStart, periodEnd }.
export function summarizeCostsByCategory({ wallet, since = null, until = null } = {}) {
    const totals = Object.fromEntries(COST_CATEGORIES.map(c => [c, 0]));
    const counts = Object.fromEntries(COST_CATEGORIES.map(c => [c, 0]));
    if (!wallet || !wallet.content) return { totals, counts, total: 0, totalCount: 0, periodStart: since, periodEnd: until };

    const movs = wallet.content.movements || [];
    const start = since ? Number(since) : 0;
    const end   = until ? Number(until) : Infinity;
    let total = 0, totalCount = 0;

    for (const mv of movs) {
        if (!mv || mv.kind !== 'consume') continue;
        const ts = Number(mv.ts || 0);
        if (ts < start || ts > end) continue;
        const cat = classifyMovement(mv) || 'other';
        const amt = Number(mv.amountEur || 0);
        totals[cat] = (totals[cat] || 0) + amt;
        counts[cat] = (counts[cat] || 0) + 1;
        total      += amt;
        totalCount += 1;
    }
    // Arrodonim a 4 decimals
    for (const c of COST_CATEGORIES) totals[c] = Math.round(totals[c] * 10000) / 10000;
    return {
        totals,
        counts,
        total:      Math.round(total * 10000) / 10000,
        totalCount,
        periodStart: since,
        periodEnd:   until,
    };
}

// PERIOD_PRESETS · helpers per filtres "avui · setmana · mes · all"
export const PERIOD_PRESETS = Object.freeze({
    today: () => {
        const d = new Date();
        d.setHours(0,0,0,0);
        return { since: d.getTime(), label: 'avui' };
    },
    week: () => ({ since: Date.now() - 7 * 24 * 3600 * 1000, label: '7 dies' }),
    month: () => ({ since: Date.now() - 30 * 24 * 3600 * 1000, label: '30 dies' }),
    all: () => ({ since: 0, label: 'tot' }),
});

// CATEGORY_META · per a UI · icona + label + color
export const CATEGORY_META = Object.freeze({
    'ia':           { icon: '🤖', label: 'IA · LLM',         color: '#a855f7' },
    'permaweb':     { icon: '🌐', label: 'Permaweb',         color: '#06b6d4' },
    'blockchain':   { icon: '⛓',  label: 'Blockchain · gas', color: '#fbbf24' },
    'stakeholder':  { icon: '💸', label: 'Claim stakeholder', color: '#10b981' },
    'transfer-out': { icon: '↗',  label: 'Transferència',     color: '#94a3b8' },
    'other':        { icon: '·',  label: 'Altres',            color: '#64748b' },
});

// computeUnifiedCostPanelData · async · helper d'alt nivell per a UI
// retorna {wallet, summaries: {today, week, month, all}, categoryMeta}.
export async function computeUnifiedCostPanelData(projectId) {
    if (!projectId) throw new Error('computeUnifiedCostPanelData requires projectId');
    const { getOrCreateWalletForProject } = await import('./walletService.js');
    const wallet = await getOrCreateWalletForProject(projectId);
    const summaries = {
        today: summarizeCostsByCategory({ wallet, since: PERIOD_PRESETS.today().since }),
        week:  summarizeCostsByCategory({ wallet, since: PERIOD_PRESETS.week().since }),
        month: summarizeCostsByCategory({ wallet, since: PERIOD_PRESETS.month().since }),
        all:   summarizeCostsByCategory({ wallet }),
    };
    return { wallet, summaries, categoryMeta: CATEGORY_META };
}
