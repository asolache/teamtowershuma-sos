# Backlog review · post-v140 (2026-05-17)

> Snapshot després del merge de v140. Resum executiu de l'estat de tots
> els WOs · evidència que SOS V11 és ALFA-READY en creació de mapes de
> valor + project hub IA-aligned + team/permissions.

## Resum numèric

| Status | Count | % |
|---|---:|---:|
| ✅ done | 20 | 57% |
| 🟡 in-progress (parcial) | 2 | 6% |
| 🟠 pending (claim però aturada) | 2 | 6% |
| 📋 backlog (sense iniciar) | 11 | 31% |
| **Total** | **35** | 100% |

## ✅ DONE recents (sprints v132 → v140)

Nous tancaments confirmats per aquesta revisió ·

| WO | Sprint | Què aporta |
|---|---|---|
| `wo-orchestrator-expert-chain` | v132c+d | expertChainOrchestrator 8 fases + vnaQuickSuggest unificat |
| `wo-submenu-pattern-canonical` | v132j+k | `SubmenuTabs.js` + LearnView migrat + ProjectHubV2 migrat |
| `wo-benchmark-multi-api-compare` | v132g+h | CLI multi-provider 5 APIs (anthropic+openai+gemini+deepseek+minimax) |
| `wo-team-permissions-view` | v140 | `teamService.js` + `TeamView` `/team` + RBAC + audit log |

## 🟡 IN-PROGRESS (parcials · queden coses)

| WO | Què s'ha fet | Què queda |
|---|---|---|
| `wo-project-hub-ia-aligned` | v134+v136 · 6 tabs IA-aligned a `/project/{id}` · grid links per pilar | **Render in-tab** de les vistes (ara segueixen links externs) · necessita `wo-submenu-tabs-v2-sublevel` previ |
| `wo-quality-integration-project-hub` | v137 · Quality al pilar Treballar com a card | **Redirect `/quality`** + treure de navService global + render in-tab del rubric |

## 🟠 PENDING (claim però aturada · pendent verificar)

- `wo-ia-hierarchical-001` · status='pending' del legacy · probable done (IA hierarchical viu)
- `wo-org-entity-001-b` · status='pending' · ORG-ENTITY sprint B (cal verificar dashboard `/org/{id}`)

## 📋 BACKLOG actiu (11 WOs · prioritzats)

### Alta prioritat
- `wo-submenu-tabs-v2-sublevel` · suport 2-nivells (sub-submenu) · **DESBLOQUEJA** in-tab render del Project Hub
- `wo-accounting-v2-redesign` · AccountingView v2 (alineat WalletV2)
- `wo-skills-ecosystem` · Skills page redisseny + ecosistema complet
- `wo-llm-local-train` · LLM local entrenat amb skills + history

### Mitjana prioritat
- `wo-wallet-project-v2-redesign` · Wallet projecte v2
- `wo-wallet-redesign` · Wallet UI redisseny + balance live navbar (potser obsolet · WalletV2 ja existeix)
- `wo-prompt-router-by-tier` · Router IA per cost · TASK_KIND → model tier
- `wo-prompt-eval-loop` · Evaluador automàtic post-IA (parcial · escalation v132c)
- `wo-agent-md-pattern` · agents/*.md (AGENT.md + MCP)
- `wo-permaweb-skills-share` · Skills via Permaweb · swarm distribuit

### Misc
- `wo-project-hub-subtabs` · **[SUPERSEDED v134]** (mantingut per traceability)

## 🎯 Plan natural fins a alfa-glory

| Sprint | Què faríem | Desbloqueja |
|---|---|---|
| v141 | `wo-submenu-tabs-v2-sublevel` · SubmenuTabs v2 (2-nivells) | Render in-tab al Project Hub |
| v142 | `wo-project-hub-ia-aligned` part 2 · render in-tab (Crear/Treballar/Compta) | Hub V3 sense links externs |
| v143 | `wo-quality-integration-project-hub` redirect | Quality 100% contextual |
| v144 | `wo-accounting-v2-redesign` + `wo-wallet-project-v2-redesign` paral·lel | Comptabilitzar 100% |
| v145 | `wo-prompt-router-by-tier` | Cost optimization global |
| v146+ | `wo-skills-ecosystem` + `wo-llm-local-train` | Skills marketplace |

## 🏆 Items post-alfa (audit v134) · 5/7 DONE

| # | Item | Status sprint |
|---|---|---|
| 1 | Pre-thinking clarify | ✅ v135 (`vnaClarify.js`) |
| 2 | Multi-turn gap detection | ✅ v135 (`vnaGapDetector.js`) |
| 3 | Embedding similarity dedup | ✅ v136 (`roleDedup.js`) |
| 4 | Real-time co-creation | ✅ v131+ (ValueMapView accept/reject) |
| 5 | Cross-project pattern mining | 🟢 estàtic ja existeix · runtime post-alfa |
| 6 | xAPI tracking quality | ✅ v136 (`xapiService.js`) |
| 7 | Wiki community moderation | 🟢 post-50-usuaris |

## 📊 Veredicte

**SOS V11 ALFA-READY en creació de mapes de valor.** ·
- Project Hub IA-aligned funcional amb 6 pilars canonical
- Generació de mapa amb clarify + gap detection + dedup + co-creation + escalation rubric
- xAPI audit trail per a evidència empírica
- /team global + per-project amb RBAC fine-grained
- UX coherent · SubmenuTabs canonical · breadcrumb amb next-step CTA

Pendents desitjables (no blockers) · in-tab render dels pilars · accounting/wallet v2 · skills marketplace.

---

*Backlog review · v140 · 2026-05-17. Próxima revisió post-v144.*
