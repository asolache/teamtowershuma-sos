// =============================================================================
// TEAMTOWERS SOS V11 — BACKLOG MANIFEST (SWARM-OP-001 sprint A)
//
// Backlog estructurat com a font de veritat per al sprintOrchestrator. Cada
// ítem és un node JS amb id, title, description, principisAlignment,
// testRequirements, status, priority, complexity, dependencies.
//
// "Honor el nom SOS · Swarm Operative System" · els items aquí els pot
// recollir un agent IA + executar autonomament fins que tots quedin verds.
//
// Aquest fitxer es manté manualment per ara (sprint A). Sprint B+ · permet
// que el sistema afegeixi/actualitzi items via UI · convertint el backlog
// en un node KB persistent (type='sprint_backlog_item').
// =============================================================================

export const BACKLOG_STATUS = Object.freeze({
    pending:      'Pendent · candidat per al següent sprint',
    in_progress:  'En curs · branch oberta o PR pending',
    completed:    'Completat · merged a main',
    blocked:      'Bloquejat · falta dependència',
    needs_review: 'Cal revisió humana abans d\'executar',
});

export const BACKLOG_PRIORITY = Object.freeze({
    critical: { level: 4, color: '#ef4444', label: 'Critical' },
    high:     { level: 3, color: '#facc15', label: 'High' },
    medium:   { level: 2, color: '#3b82f6', label: 'Medium' },
    low:      { level: 1, color: '#94a3b8', label: 'Low' },
});

export const BACKLOG_COMPLEXITY = Object.freeze({
    XS: { hours: 0.5, label: 'XS · <1h · trivial' },
    S:  { hours: 2,   label: 'S · ~2h · 1 fitxer' },
    M:  { hours: 6,   label: 'M · ~6h · 2-3 fitxers + tests' },
    L:  { hours: 16,  label: 'L · 2-3 dies · servei nou + UI + tests' },
    XL: { hours: 40,  label: 'XL · setmana · arquitectura · cal humà' },
});

// Backlog inicial · derivat dels pendents del docs/CANONICAL_PRINCIPLES.md
// Format · {id, title, description, principles, status, priority, complexity,
//          dependencies, testRequirements, suggestedFiles}
export const INITIAL_BACKLOG = Object.freeze([
    Object.freeze({
        id: 'gnosis-multisig-treasury',
        title: 'Gnosis Safe multi-sig per a treasury del projecte',
        description: 'Integrar Gnosis Safe SDK · cada projecte té un Safe deployment opcional · payouts via multi-sig amb signatures dels stakeholders amb shares > N%. Tanca el pillar 4 (Smart Contracts) dels principis canònics.',
        principles: ['principle-1-nodes', 'principle-4-smart-contracts'],
        status: 'pending',
        priority: 'high',
        complexity: 'XL',
        dependencies: ['tea-univ-001'],   // necessita TEA universal (ja fet)
        testRequirements: [
            'gnosisSafeService.test.js · deployment + sign + execute flow mock',
            'Plan enforcer · gnosis-tx · ja existeix · validar usat',
        ],
        suggestedFiles: ['js/core/gnosisSafeService.js', 'js/views/SafeView.js'],
    }),
    Object.freeze({
        id: 'subscription-billing-recurring',
        title: 'Subscription billing recurring Pro/Coop via Stripe',
        description: 'Stripe Subscriptions per a plans Pro · Coop · Enterprise (recurrents mensuals/anuals) · substitueix top-up manual amb autocharge · webhook handle invoice.paid → setCurrentPlan + receipt + wallet topup.',
        principles: ['principle-2-comptabilitza', 'principle-3-stripe-stakeholders'],
        status: 'pending',
        priority: 'high',
        complexity: 'L',
        dependencies: [],
        testRequirements: [
            'subscriptionService.test.js · plan upgrade · downgrade · cancellation',
            'Webhook handler · invoice.paid · invoice.payment_failed · customer.subscription.deleted',
        ],
        suggestedFiles: ['js/core/subscriptionService.js', 'netlify/edge-functions/stripe-webhook.js'],
    }),
    Object.freeze({
        id: 'webhook-stripe-connect-postpay',
        title: 'Webhook Stripe Connect · recordConnectSale post-payment confirmed',
        description: 'Configurar webhook a Stripe que dispari recordConnectSale automàticament quan checkout.session.completed amb payment_intent.transfer_data set. Tanca el flow TEA per a connect sales (avui sols disparable manualment).',
        principles: ['principle-2-comptabilitza', 'principle-3-stripe-stakeholders'],
        status: 'pending',
        priority: 'high',
        complexity: 'M',
        dependencies: ['canonical-001'],
        testRequirements: [
            'Edge function stripe-webhook.js · valida signature + dispatch event handlers',
            'connectSale auto-record · idempotent (no double-charge si webhook duplicat)',
        ],
        suggestedFiles: ['netlify/edge-functions/stripe-webhook.js'],
    }),
    Object.freeze({
        id: 'wo-attestation-mock',
        title: 'TTL purge automàtic dels neural_path_step >90 dies',
        description: 'Cron / background sync · purgar steps antics segons PATH_STEP_RETENTION_DAYS=90. Manté el KB lleuger · els bundles ja firmats no es perden (queden com a node independent).',
        principles: ['principle-1-nodes'],
        status: 'completed',
        priority: 'medium',
        complexity: 'S',
        dependencies: ['neural-path-001'],
        testRequirements: [
            'neuralPathService.test.js · purgeOldSteps · respect PATH_STEP_RETENTION_DAYS',
        ],
        suggestedFiles: ['js/core/neuralPathService.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),
    Object.freeze({
        id: 'trust-pagerank',
        title: 'Trust score recursive · PageRank style',
        description: 'El weight d\'una attestation depèn del trust score de l\'attester (recursiu). Power user endorsement val més que un nou usuari. Sprint B del trustScoreService · canvi pure de aggregation.',
        principles: ['principle-1-nodes', 'principle-4-tea'],
        status: 'completed',
        priority: 'medium',
        complexity: 'M',
        dependencies: ['trust-001'],
        testRequirements: [
            'trustScoreService.test.js · iterative scoring · convergence',
            'Edge case · attester sense pròpies attestations (weight 1.0 base)',
        ],
        suggestedFiles: ['js/core/trustScoreService.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),
    Object.freeze({
        id: 'tdd-autonomous-agent',
        title: 'Backlog Autonomous Agent · TDD loop fins a verd',
        description: 'Agent IA que processa WOs/backlog items amb TDD · runUntilGreen({items, evaluator, maxIterations, budgetEur, maxAttemptsPerItem}). Failover chain via runEscalation · evaluator sentinel reusa aiEvaluatorService. UI a SprintView botó "🤖 Run autonomous loop" amb modal config + progress + summary.',
        principles: ['principle-1-nodes', 'principle-2-comptabilitza'],
        status: 'completed',
        priority: 'high',
        complexity: 'L',
        dependencies: ['swarm-op-001'],
        testRequirements: [
            'backlogAutonomousAgent.test.js · 46 tests · runUntilGreen · budget enforce · attempts cap · TDD eval',
            'Cost tracking · estimateCostEur per sprint_run',
        ],
        suggestedFiles: ['js/core/backlogAutonomousAgent.js', 'js/views/SprintView.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),
    Object.freeze({
        id: 'kanban-wo-context-sos',
        title: 'Standard context SOS per a IAs al Kanban',
        description: 'woContextBuilder.js · injecta SOS canonical principles + sector + subtype + roles + transactions + neural path bundle + accounting hints al systemPrompt de cada execució IA al Kanban. Honor el nom SOS.',
        principles: ['principle-1-nodes'],
        status: 'completed',
        priority: 'medium',
        complexity: 'M',
        dependencies: ['swarm-op-001'],
        testRequirements: ['woContextBuilder.test.js · 32 tests · pure builder + integració KanbanView'],
        suggestedFiles: ['js/core/woContextBuilder.js', 'js/views/KanbanView.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),
    Object.freeze({
        id: 'swarm-discovery',
        title: 'Swarm discovery · projectes afins a ProjectHub',
        description: 'swarmAffinityService pure (scoreProjectAffinity · rankAffinity · findGapSkills) + SwarmDiscoveryPanel a ProjectHubView. Combina sector/skill/guardian Jaccard amb trust score recursive (PageRank).',
        principles: ['principle-1-nodes', 'principle-4-tea'],
        status: 'completed',
        priority: 'medium',
        complexity: 'M',
        dependencies: ['trust-pagerank'],
        testRequirements: ['swarmAffinity.test.js · 28 tests · pure scoring + ranking + gap skills'],
        suggestedFiles: ['js/core/swarmAffinityService.js', 'js/views/ProjectHubView.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),
    Object.freeze({
        id: 'conventional-ranges-config',
        title: 'Conventional ranges externalitzats a KB config',
        description: 'DEFAULT_CONVENTIONAL_RANGES editables via node KB type=config. SavingsView llegeix del KB · fallback a defaults. Sprint B · UI editor a SettingsView.',
        principles: ['principle-1-nodes'],
        status: 'completed',
        priority: 'low',
        complexity: 'S',
        dependencies: [],
        testRequirements: ['conventionalRanges.test.js · 23 tests · load · save · validate · fallbacks'],
        suggestedFiles: ['js/core/conventionalRangesService.js', 'js/views/SavingsView.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),
    Object.freeze({
        id: 'market-discovery-fix',
        title: '/market · bug fix filtre coherent + banner cross-link',
        description: 'Items dels projectes no visibles ja no apareixen sense entrada al dropdown. Banner cross-link a /opportunities?tab=market.',
        principles: ['principle-1-nodes'],
        status: 'completed',
        priority: 'medium',
        complexity: 'S',
        dependencies: [],
        testRequirements: [],
        suggestedFiles: ['js/views/MarketView.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),
    Object.freeze({
        id: 'mind-graph-galaxy',
        title: 'Mind-graph · galàxies per sector + capes ceba per tipus (φ àuria) + pseudo-3D',
        description: 'Layout galàctic per al mind-graph · cada sector és una galàxia (centres en espiral Vogel/golden-angle) · dins de cada galàxia els nodes formen capes de ceba per tipus (project → role → sop → market → identity) amb radis seguint la proporció àuria φ. Pseudo-3D via opacitat/escala per cz (depth) sense Three.js.',
        principles: ['principle-1-nodes'],
        status: 'completed',
        priority: 'low',
        complexity: 'M',
        dependencies: [],
        testRequirements: [
            'mindGraphGalaxy.test.js · assignSpatialLayout pure · 44 tests',
        ],
        suggestedFiles: ['js/core/mindGraphService.js', 'js/views/MindGraphView.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),
    Object.freeze({
        id: 'mock-badge-cards',
        title: 'Badge "🧪 mock" visual a cards de /opportunities',
        description: 'Indicador visual a cards quan txId comença per "mock-" (entries locals · no cross-device). Tanca el feedback loop del sync auditing.',
        principles: ['principle-1-nodes'],
        status: 'completed',
        priority: 'low',
        complexity: 'XS',
        dependencies: ['sync-cross-001'],
        testRequirements: [
            'opportunitiesMockBadge.test.js · isMockTxId helper · prefix detect',
        ],
        suggestedFiles: ['js/views/OpportunitiesView.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),
    Object.freeze({
        id: 'opportunities-autosync',
        title: 'Auto-sync periòdic /opportunities (cron 5 min)',
        description: 'En lloc del botó manual ↻ Sync · cron en background que sincronitza les 5 entry types cada N minuts. Reuse syncSchedulerService existent.',
        principles: ['principle-1-nodes', 'principle-2-permaweb'],
        status: 'pending',
        priority: 'low',
        complexity: 'S',
        dependencies: ['sync-cross-001'],
        testRequirements: [
            'syncScheduler · trigger interval configurable',
        ],
        suggestedFiles: ['js/views/OpportunitiesView.js', 'js/core/syncSchedulerService.js'],
    }),
    Object.freeze({
        id: 'webof-trust-ui',
        title: 'Web of Trust scoring UI · llistat attesters per node',
        description: 'Al detail view (/n/{nodeId}) · panel "🤝 Web of Trust" amb llistat d\'attesters · kindWeight badge · statements · verify signatures inline (ECDSA P-256) · PR score per attester. Pure helper buildTrustPanelData a trustScoreService.',
        principles: ['principle-4-tea'],
        status: 'completed',
        priority: 'medium',
        complexity: 'M',
        dependencies: ['trust-pagerank'],
        testRequirements: ['trustScore.test.js · buildTrustPanelData · 15 nous tests · pure data prep'],
        suggestedFiles: ['js/views/NodeView.js', 'js/core/trustScoreService.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),
    Object.freeze({
        id: 'zk-proofs-foundational',
        title: 'ZK proofs · attestations privacy-preserving',
        description: 'Foundational research item · permetre attestations on-chain sense revelar attesterDid (ring signature). Cal investigació sobre llibreries ZK compatibles amb Web Crypto.',
        principles: ['principle-4-tea'],
        status: 'needs_review',
        priority: 'low',
        complexity: 'XL',
        dependencies: ['tea-univ-001'],
        testRequirements: ['Research · ring signature compatibility'],
        suggestedFiles: [],
    }),
    Object.freeze({
        id: 'dao-governance-voting',
        title: 'Cooperative governance · DAO voting via signed attestations',
        description: 'Permetre votacions cooperatives via attestation nodes amb kind=\'vote\' · pondera per slicing pie share · resultats verificables on-chain.',
        principles: ['principle-3-stripe-stakeholders', 'principle-4-smart-contracts'],
        status: 'pending',
        priority: 'medium',
        complexity: 'L',
        dependencies: ['gnosis-multisig-treasury'],
        testRequirements: ['voteService.test.js · weighted tally · quorum'],
        suggestedFiles: ['js/core/voteService.js', 'js/views/VoteView.js'],
    }),
]);

// Helper · stats globals
export function summarizeBacklog(items = INITIAL_BACKLOG) {
    const byStatus = {}, byPriority = {}, byComplexity = {};
    let totalHours = 0;
    for (const it of items) {
        byStatus[it.status]       = (byStatus[it.status] || 0) + 1;
        byPriority[it.priority]   = (byPriority[it.priority] || 0) + 1;
        byComplexity[it.complexity] = (byComplexity[it.complexity] || 0) + 1;
        if (it.status === 'pending' && BACKLOG_COMPLEXITY[it.complexity]) {
            totalHours += BACKLOG_COMPLEXITY[it.complexity].hours;
        }
    }
    return { byStatus, byPriority, byComplexity, totalPendingHours: totalHours, count: items.length };
}

// Helper · prioritzar · retorna items pending ordenats per priority + complexity
export function prioritizedPendingItems(items = INITIAL_BACKLOG) {
    return items
        .filter(it => it.status === 'pending')
        .filter(it => !it.dependencies || it.dependencies.every(d =>
            items.find(x => x.id === d)?.status === 'completed' || items.find(x => x.id === d) === undefined
        ))
        .sort((a, b) => {
            const pa = BACKLOG_PRIORITY[a.priority]?.level || 0;
            const pb = BACKLOG_PRIORITY[b.priority]?.level || 0;
            if (pa !== pb) return pb - pa;   // higher priority first
            // Mateix priority · complexity menor primer (quick wins)
            const ca = BACKLOG_COMPLEXITY[a.complexity]?.hours || 999;
            const cb = BACKLOG_COMPLEXITY[b.complexity]?.hours || 999;
            return ca - cb;
        });
}
