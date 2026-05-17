// =============================================================================
// TEAMTOWERS SOS V11 — LEGAL AGENTS CATALOG (v124 · agents/legal/*.md)
// Ruta · /js/core/legalAgentsCatalog.js
//
// Catàleg dels 10 agents legals · cada un viu a `agents/legal/<id>.md` amb la
// convenció AGENT.md (vegeu agents/AGENTS.md). Aquest fitxer és el registre
// runtime · permet a UI · /pact · /agreements · /wallet llistar tipologies
// d'acords sense fer fs.readdir (web safe · zero-cost).
//
// Cada entry · { id, title, category, binding_level, model_tier, cost_estimate_eur,
//                bestUseCase, requires, notarizationRecommended }
//
// IMPORTANT · si afegeixes un .md a agents/legal/ · afegeix també l'entry aquí
// + actualitza el test legalAgentsCatalog.test.js (paritat).
// =============================================================================

export const LEGAL_AGENTS_VERSION = 'v1.0';

// Categories canòniques (per a filtres UI)
export const LEGAL_AGENT_CATEGORIES = Object.freeze({
    founding:    'Fundacionals · acords entre socis del projecte',
    'pre-deal':  'Pre-deal · LOI · NDA · primeres converses',
    deal:        'Deal · term sheets · investment · binding alt',
    cohort:      'Programes · incubadora · accelerador · membresia',
    commercial:  'Comercials · serveis · clients · partnerships',
    relational:  'Relacionals · advisors · contractors no-deal',
    compensation: 'Compensation · equity · phantom · ESOP',
    contribution: 'Contribution · IP · authorship · contributors',
});

// Nivells de vinculació (descriptius · NO substitueixen counsel local)
export const BINDING_LEVELS = Object.freeze({
    low:    'Compromís moral · cap obligació executable',
    medium: 'Obligació real · però sortida pactada fàcil',
    high:   'Obligació executable · trencament té remei legal',
});

export const LEGAL_AGENTS_CATALOG = Object.freeze([
    {
        id: 'pact-de-socis',
        title: 'Pacte de socis · SOS dinàmic',
        category: 'founding',
        binding_level: 'high',
        model_tier: 'mid',
        cost_estimate_eur: 0.006,
        bestUseCase: 'Acord fundacional · 2-N socis · slicing-pie + vesting + decisions',
        requires: ['parties.identityId', 'project.id', 'clauses (overrides opcional)'],
        notarizationRecommended: true,
        linkedAccounting: true,
        existingService: 'pactService',  // ja existeix · aquest agent és per a generar plantilla
    },
    {
        id: 'nda-mutual',
        title: 'NDA mutual · confidencialitat bilateral',
        category: 'pre-deal',
        binding_level: 'medium',
        model_tier: 'small',
        cost_estimate_eur: 0.001,
        bestUseCase: 'Abans de compartir info sensible · pitch · DD · cohort',
        requires: ['parties[]', 'purpose', 'term_months (default 24)'],
        notarizationRecommended: false,
        linkedAccounting: false,
    },
    {
        id: 'service-agreement',
        title: 'Acord de serveis · DTD test booleà',
        category: 'commercial',
        binding_level: 'high',
        model_tier: 'mid',
        cost_estimate_eur: 0.003,
        bestUseCase: 'Provider professional · deliverables clars · DTD verificable',
        requires: ['provider', 'client', 'deliverables[].dtd_test'],
        notarizationRecommended: true,
        linkedAccounting: true,
    },
    {
        id: 'incubator-membership',
        title: 'Membresia incubadora · 6 mesos · equity light',
        category: 'cohort',
        binding_level: 'medium',
        model_tier: 'mid',
        cost_estimate_eur: 0.004,
        bestUseCase: 'Admissió projecte a la incubadora · serveis ↔ equity ≤10%',
        requires: ['incubator', 'project', 'services_provided[]'],
        notarizationRecommended: true,
        linkedAccounting: true,
    },
    {
        id: 'accelerator-cohort',
        title: 'Cohort accelerador · 12 setmanes · milestones DTD',
        category: 'cohort',
        binding_level: 'high',
        model_tier: 'mid',
        cost_estimate_eur: 0.005,
        bestUseCase: 'Programa accelerador · KPIs setmanals · demo day · equity ≤15%',
        requires: ['accelerator', 'cohort_id', 'project', 'milestones[]'],
        notarizationRecommended: true,
        linkedAccounting: true,
    },
    {
        id: 'advisor-agreement',
        title: 'Acord advisor · scope + equity ≤2%',
        category: 'relational',
        binding_level: 'medium',
        model_tier: 'small',
        cost_estimate_eur: 0.002,
        bestUseCase: 'Advisor extern · 1-20h/mes · equity petit + intros',
        requires: ['advisor.expertise[]', 'project', 'compensation.model'],
        notarizationRecommended: false,
        linkedAccounting: true,
    },
    {
        id: 'equity-grant',
        title: 'Equity grant · phantom / real · vesting',
        category: 'compensation',
        binding_level: 'high',
        model_tier: 'mid',
        cost_estimate_eur: 0.003,
        bestUseCase: 'Concessió d\'equity (real/phantom) a employee/contributor',
        requires: ['grantor', 'grantee', 'grant_type', 'vesting'],
        notarizationRecommended: true,
        linkedAccounting: true,
    },
    {
        id: 'letter-of-intent',
        title: 'Letter of Intent · pre-term-sheet · no vinculant',
        category: 'pre-deal',
        binding_level: 'low',
        model_tier: 'small',
        cost_estimate_eur: 0.001,
        bestUseCase: 'Primera oferta · termes inicials · exclusivitat 30 dies',
        requires: ['proposer', 'target', 'subject', 'proposed_terms'],
        notarizationRecommended: false,
        linkedAccounting: false,
    },
    {
        id: 'term-sheet',
        title: 'Term Sheet · ronda inversió · binding alt',
        category: 'deal',
        binding_level: 'high',
        model_tier: 'reasoner',
        cost_estimate_eur: 0.012,
        bestUseCase: 'Term sheet pre-seed/seed/A · drag · tag · pro-rata · ESOP',
        requires: ['investor', 'company', 'round_size_eur', 'pre_money_valuation_eur'],
        notarizationRecommended: true,
        linkedAccounting: true,
    },
    {
        id: 'ip-assignment',
        title: 'IP Assignment · contributor → projecte',
        category: 'contribution',
        binding_level: 'high',
        model_tier: 'small',
        cost_estimate_eur: 0.001,
        bestUseCase: 'Cessió IP del contributor · scope + prior_ip + moral rights',
        requires: ['contributor', 'project', 'contribution_type'],
        notarizationRecommended: true,
        linkedAccounting: false,
    },
]);

// listLegalAgents · helper UI · retorna catàleg complet o filtrat
export function listLegalAgents({ category = null, binding_level = null } = {}) {
    let agents = LEGAL_AGENTS_CATALOG.slice();
    if (category)       agents = agents.filter(a => a.category === category);
    if (binding_level)  agents = agents.filter(a => a.binding_level === binding_level);
    return agents;
}

// getLegalAgent · helper · retorna l'entry per id (null si no existeix)
export function getLegalAgent(id) {
    return LEGAL_AGENTS_CATALOG.find(a => a.id === id) || null;
}

// listCategoriesWithCount · helper UI · per a sidebar de filtre
export function listCategoriesWithCount() {
    const counts = {};
    for (const a of LEGAL_AGENTS_CATALOG) {
        counts[a.category] = (counts[a.category] || 0) + 1;
    }
    return Object.entries(LEGAL_AGENT_CATEGORIES).map(([id, label]) => ({
        id, label, count: counts[id] || 0,
    }));
}

// estimateCostForBundle · pure · si l'usuari genera 3 documents alhora
export function estimateCostForBundle(agentIds) {
    if (!Array.isArray(agentIds)) return 0;
    return agentIds.reduce((sum, id) => {
        const a = getLegalAgent(id);
        return sum + (a?.cost_estimate_eur || 0);
    }, 0);
}
