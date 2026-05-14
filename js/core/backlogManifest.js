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

    // ─────────────────────────────────────────────────────────────────────────
    // PROJECT-LIFECYCLE blueprint · sprint planning multi-PR
    //
    // OBJECTIU · SOS guia un fundador des de la idea fins a la facturació:
    //   1. definir projecte (canvas)         · canvas-wizard
    //   2. presentar (one-pager públic)      · pitch-public
    //   3. organitzar (kanban + WO context)  · ✓ ja existeix (KanbanView)
    //   4. pactar (signatures ECDSA)         · ✓ ja existeix (PactBuilderView)
    //   5. tokenomics                        · tokenomics-designer
    //   6. comptabilitat (ledger)            · ledger-accounting
    //   7. propostes (a clients)             · proposal-generator
    //   8. productes/workshops               · ✓ ja existeix (market_item, workshop)
    //   9. facturació (invoices)             · invoice-billing
    //  10. dashboard de cicle (status %)     · lifecycle-dashboard
    //
    // En paral·lel · millora del swarm (value-flow-schema + swarm-parallel-flow)
    // per que pugui orquestrar el cicle automàticament.
    // ─────────────────────────────────────────────────────────────────────────

    Object.freeze({
        id: 'project-canvas-wizard',
        title: 'Project Canvas Wizard · /canvas?project=X guiat per IA',
        description: 'Wizard 5-passes per a definir un projecte · vision · mission · values · stakeholders · north-star. IA omple drafts (runEscalation failover) · el fundador valida o edita. Persisteix com a content.canvas al node project. Pure logic a projectCanvasService.',
        principles: ['principle-1-nodes', 'principle-2-roles'],
        status: 'completed',
        priority: 'high',
        complexity: 'S',
        dependencies: [],
        testRequirements: ['projectCanvas.test.js · 69 tests · 5-step state machine · validation · IA mock · immutability'],
        suggestedFiles: ['js/core/projectCanvasService.js', 'js/views/ProjectCanvasView.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),

    Object.freeze({
        id: 'project-pitch-public',
        title: 'Project Pitch · one-pager públic /pitch?project=X shareable amb OG meta',
        description: 'Pitch one-pager · 6 seccions (problem · solution · traction · team · ask · vision) · públic per defecte (read-only) · ?edit=1 per autoria. OG meta tags + Twitter cards injectades al head per a previews quan es comparteixen. Slug kebab-case ASCII-safe. Pre-fill auto des de canvas (vision/mission mappats). Publish/unpublish · cal mínim 3 seccions per publicar.',
        principles: ['principle-1-nodes', 'principle-3-stripe-stakeholders'],
        status: 'completed',
        priority: 'high',
        complexity: 'M',
        dependencies: ['project-canvas-wizard'],
        testRequirements: ['projectPitch.test.js · 67 tests · 6-sections validation · OG meta gen · publish/unpublish · slug ASCII safe · prefillFromCanvas (no overwrite) · OG HTML escape'],
        suggestedFiles: ['js/core/projectPitchService.js', 'js/views/ProjectPitchView.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),

    Object.freeze({
        id: 'tokenomics-designer',
        title: 'Tokenomics Designer · /tokenomics?project=X distribució + vesting',
        description: 'Generalitza el patró fairfractal · token name · symbol · totalSupply · decimals · distribution (sliders 6 groups · founders/operators/treasury/community/investors/liquidity · normalize auto) · vesting schedule per group (cliff + linear · simulació mensual). Persisteix com a token_design node. Quality score live 0-100 (penalitza concentració · sense vesting · treasury baix). Integrat al lifecycle.',
        principles: ['principle-4-tea', 'principle-4-smart-contracts'],
        status: 'completed',
        priority: 'high',
        complexity: 'M',
        dependencies: ['project-canvas-wizard'],
        testRequirements: ['tokenomics.test.js · 65 tests · sum=1 invariant · vesting schedule (cliff + linear · monthly) · quality score · normalize · immutability'],
        suggestedFiles: ['js/core/tokenomicsService.js', 'js/views/TokenomicsView.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),

    Object.freeze({
        id: 'ledger-accounting',
        title: 'Ledger Accounting · /accounting?project=X double-entry',
        description: 'CRUD ledger_entry nodes · debit/credit · multi-leg · validation Σdebit=Σcredit (tol 0.01) · mixed currencies refusades · STANDARD_ACCOUNTS (cash/bank/wallet/revenue/expenses/equity/payable/tax). Balance Sheet (assets/liabilities/equity + retained earnings) · P&L per període · accounts custom auto-asset.',
        principles: ['principle-1-nodes', 'principle-3-stripe-stakeholders'],
        status: 'completed',
        priority: 'medium',
        complexity: 'M',
        dependencies: [],
        testRequirements: ['ledger.test.js · 60 tests · validate · balance per account · P&L · balance sheet (A=L+E) · asOf filter · custom accounts · quickEntry helper'],
        suggestedFiles: ['js/core/ledgerService.js', 'js/views/AccountingView.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),

    Object.freeze({
        id: 'proposal-generator',
        title: 'Proposal Generator · /proposals?project=X amb IA + skill matching + PDF',
        description: 'Generador de propostes a clients · brief curt → IA failover (runEscalation amb canvas context) genera draft JSON (summary + deliverables + pricing). Skill matching live · text-match contra SKILL_TAXONOMY · score amb domain bonus. Status state machine (draft/sent/accepted/rejected/expired · transicions validades). Quality score · win rate. Print-css PDF inline detail modal.',
        principles: ['principle-2-roles', 'principle-3-stripe-stakeholders'],
        status: 'completed',
        priority: 'medium',
        complexity: 'M',
        dependencies: ['project-canvas-wizard'],
        testRequirements: ['proposal.test.js · 89 tests · status transitions · skill match (govern + finance) · AI JSON parse (markdown fence + partial skip) · quality score · breakdown winRate'],
        suggestedFiles: ['js/core/proposalService.js', 'js/views/ProposalView.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),

    Object.freeze({
        id: 'invoice-billing',
        title: 'Invoice Billing · /invoices?project=X CRUD + auto-ledger + print',
        description: 'CRUD invoice nodes · client · items · IVA · due date · status (draft/sent/paid/overdue/cancelled · auto-overdue per dueDate < today). markInvoicePaid genera automàticament ledger entry (debit cash · credit revenue + tax-payable). 3-leg amb IVA · 2-leg sense IVA. Print-css per a PDF. computeInvoicesStatusBreakdown integrat al lifecycle dashboard.',
        principles: ['principle-3-stripe-stakeholders'],
        status: 'completed',
        priority: 'medium',
        complexity: 'M',
        dependencies: ['ledger-accounting'],
        testRequirements: ['invoice.test.js · 74 tests · totals IVA · status transitions (terminal/valid) · auto ledger entry integration · breakdown · overdue detection'],
        suggestedFiles: ['js/core/invoiceService.js', 'js/views/InvoiceView.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),

    Object.freeze({
        id: 'lifecycle-dashboard',
        title: 'Project Lifecycle Dashboard · /lifecycle?project=X status % de cada fase',
        description: 'Dashboard a /lifecycle?project=X mostrant completion % per 10 fases agrupades en 4 capes (fundació · execució · valor · comercial). Next-best-action prominent. Items Wave 1 pendents mostrats amb 🔜 (graceful degradation). Reusa canvas + ledger + sops + wos + pacts + market_items + workshops.',
        principles: ['principle-1-nodes'],
        status: 'completed',
        priority: 'high',
        complexity: 'M',
        dependencies: ['project-canvas-wizard', 'ledger-accounting'],
        testRequirements: ['lifecycle.test.js · 56 tests · 10 phases pure · status/completion/nextAction · weighted overall · graceful degradation Wave 1'],
        suggestedFiles: ['js/core/lifecycleService.js', 'js/views/ProjectLifecycleView.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),

    Object.freeze({
        id: 'value-flow-schema',
        title: 'Value Flow schema · DAG roles · transactions · deliverables',
        description: 'Schema ValueFlow node · roles (kind+evaluator) · transactions (from/to/deliverable) · deliverables (DAG). Topological levels (paral·lel per level) · cycle detection via DFS 3-color · estimateFlowComplexity heuristic. Foundation per a swarm-parallel-flow.',
        principles: ['principle-2-roles'],
        status: 'completed',
        priority: 'high',
        complexity: 'S',
        dependencies: [],
        testRequirements: ['valueFlow.test.js · 49 tests · topoSort · cycle detection · DAG validation · immutability · estimateFlowComplexity'],
        suggestedFiles: ['js/core/valueFlowService.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),

    Object.freeze({
        id: 'market-catalog-multi-source',
        title: 'Market catalog · multi-source aggregation + detail view + sellable SOPs',
        description: '/market ara agrega market_item + workshop + sop (flagged market-sellable) a un catàleg unificat amb stats per kind (product/service/workshop/subscription/skill/template/SOP). Nou /market/{id} detail view amb OG meta + share button + accions contactar/perfil/share/node KB. Pure marketCatalogService · fromMarketItem/fromWorkshop/fromSop · filterCatalog · computeCatalogStats · markSopAsSellable helper.',
        principles: ['principle-1-nodes', 'principle-3-stripe-stakeholders'],
        status: 'completed',
        priority: 'high',
        complexity: 'M',
        dependencies: [],
        testRequirements: ['marketCatalog.test.js · 75 tests · 3 source converters · buildCatalog aggregation + visibleProjectIds filter · filterCatalog (kind/source/visibility/price/text/tags/project) · computeCatalogStats · markSopAsSellable immutability + dedupe keyword'],
        suggestedFiles: ['js/core/marketCatalogService.js', 'js/views/MarketView.js', 'js/views/MarketDetailView.js', 'js/router.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),

    Object.freeze({
        id: 'ai-activity-feedback',
        title: 'AI Activity Feedback · human-readable live status quan agent pensa',
        description: 'Helper pure aiActivityFeedback · formatActivityEvent({ kind, ... }) → { icon, title, detail, nodeRef, nodeLabel, level, color } per a UI temps real. Coneix events de improvementLoopService + swarmParallelFlow + genèric (cycle-start · runner-start · wo-executed · analyzed · enrichments-applied · level-start · deliverable-start/done/fail · budget-exceeded · loop-start/end · message · error). Both services ara emeten pre-runner events (runner-start, deliverable-start) amb level=thinking · views mostren mini-box "Pensant…" amb pulse animation + node label · log entries renderitzats amb icon + color border + node badge.',
        principles: ['principle-1-nodes', 'principle-4-tea'],
        status: 'completed',
        priority: 'medium',
        complexity: 'M',
        dependencies: ['improvement-loop', 'swarm-parallel-flow'],
        testRequirements: ['aiActivityFeedback.test.js · 93 tests · 14 event kinds + fallback · levelColor · summarizeActivity · renderActivityEntryHtml escape + thinking pulse · null/empty safe'],
        suggestedFiles: ['js/core/aiActivityFeedback.js', 'js/views/ImprovementLoopView.js', 'js/views/SwarmFlowView.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),

    Object.freeze({
        id: 'improvement-loop',
        title: 'Improvement Loop · TDD WO + feedback agent · kanban millora contínua',
        description: '/improve?project=X · pickNextSOP → buildWOFromSOP amb context dels darrers 3 deliverables → runner (runEscalation) executa TDD-style amb evaluator retry → analyzeDeliverable detecta enrichments (add-tag · evidence-cited · suggest-role) + suggestedNext WOs + score per focusAreas (8 standard · canvas/role/transaction/commercial/accounting/governance/tokenomics/workshop) → applyEnrichmentsToProject muta tags + counters. runImprovementLoop({ maxIterations }) executa N seqüencials acumulant context. Kanban 3-col · SOPs · Cicles recents · Enrichments + suggested-next.',
        principles: ['principle-1-nodes', 'principle-2-roles', 'principle-4-tea'],
        status: 'completed',
        priority: 'high',
        complexity: 'L',
        dependencies: ['max-project-bootstrap', 'tdd-autonomous-agent', 'swarm-parallel-flow'],
        testRequirements: ['improvementLoop.test.js · 101 tests · pickNextSOP · buildWOFromSOP context (darrers 3) · analyzeDeliverable mentions/enrichments/suggested-next/score · applyEnrichmentsToProject immutability · runImprovementCycle TDD retry · runImprovementLoop multi-iter context acumula'],
        suggestedFiles: ['js/core/improvementLoopService.js', 'js/views/ImprovementLoopView.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),

    Object.freeze({
        id: 'max-project-bootstrap',
        title: 'Max Project Bootstrap · 108 cohort managers + 100/100 lifecycle baseline',
        description: 'buildMaxQualityProject({ creatorHandle, projectName, ts }) · pure · genera projecte amb 108 cohort_manager roles (1 per skill nuclear · 90 unique + 18 padding generalistes), canvas 5/5 + pitch 6/6 publicat + tokenomics (COHO 10.8M supply), 3 ledger entries balanced + 2 invoices (1 paid auto-ledger 4t entry) + 2 proposals (1 accepted + 1 sent) + 2 market_items + SOPs + workshops. Lifecycle dashboard ≥85% immediat. Servirà com a baseline per a improvement-loop sprint B.',
        principles: ['principle-1-nodes', 'principle-2-roles'],
        status: 'completed',
        priority: 'high',
        complexity: 'M',
        dependencies: ['project-canvas-wizard', 'project-pitch-public', 'tokenomics-designer', 'ledger-accounting', 'invoice-billing', 'proposal-generator'],
        testRequirements: ['maxProjectBootstrap.test.js · 64 tests · 108 cohort managers (90 unique + 18 padding) · canvas 100% · pitch publicat · tokenomics valid · ledger balanced · invoices/proposals valids · lifecycle ≥60% (mesurat 85%) · determinism'],
        suggestedFiles: ['js/core/maxProjectBootstrap.js', 'js/views/DashboardView.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
    }),

    Object.freeze({
        id: 'swarm-parallel-flow',
        title: 'Swarm Parallel Flow · DAG executor paral·lel sobre ValueFlow · Antigravity capstone',
        description: 'Pillar Antigravity capstone · runValueFlow(flow, { runner, budgetEur, maxRetries, onLevelStart, onDeliverableDone, evaluator, signer }) · cada level del DAG corre en Promise.all · transaction outputs es passen com a context al downstream automàticament · budget guard + retry + cycle detection + log timeline. Vista /swarm?project=X · botó "Run paral·lel" amb live event log · darreres execucions persistides com a swarm_flow_run.',
        principles: ['principle-2-roles', 'principle-4-tea'],
        status: 'completed',
        priority: 'medium',
        complexity: 'L',
        dependencies: ['value-flow-schema', 'tdd-autonomous-agent'],
        testRequirements: ['swarmParallelFlow.test.js · 58 tests · 2-level seq · paral·lel timing (3×40ms < 100ms) · context passing · budget exceeded · retry · cycle detection · signer opcional · callback errors · log timeline · buildSwarmRunNode serialization'],
        suggestedFiles: ['js/core/swarmParallelFlow.js', 'js/views/SwarmFlowView.js'],
        completedAt: '2026-05-14',
        completedPr: 'pending',
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
