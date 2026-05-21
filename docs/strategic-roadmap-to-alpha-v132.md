# Pla estratègic de sprints · ROAD TO ALPHA · v132 → v150

> Doc estratègic · què cal per a un **llançament alfa públic** del SOS V11 ·
> 6 fases · ~18 sprints · 8-10 setmanes d'execució.

## TL;DR · pregunta i resposta

**Pregunta** · què ens falta per poder dir "TeamTowers SOS V11 està en alfa pública"?

**Resposta** · les 6 fases d'aquest roadmap. Cada fase respon a 1 dimensió crítica ·
1. **Estabilitat** · zero bugs · zero data loss · onboarding suau
2. **Backend real** · Stripe deploys + crypto verify + permaweb publishing
3. **Quality UX** · sectors fusion + LMS skeleton + sosTopbar migració
4. **Comercial** · pricing actiu · self-serve onboarding · landing pages
5. **Comunitat** · cohort 0 · alumni · feedback loop · trust score
6. **Documentation** · LLM-readable + human-readable + API spec public

## On som ara (v131c · 2026-05-18)

### Tenim solid · llest per a alfa

✅ Project creation chain · 8 fases · 24 domain packs · 21 sectors canonical CNAE
✅ Wallet V2 BINGO · 6 pestanyes (Saldo · Transaccions · Compres · Tarta · Projectes · Top-up Stripe + Crypto)
✅ Pacte de socis · ECDSA + notarització permaweb + 10 agents legals
✅ Skills marketplace backend (matching + cross-sector)
✅ Sector quality rubric
✅ Domain detection (keyword + LLM fallback + telemetry)
✅ Search palette ⌘K integrat al navbar
✅ Test suite · 1500+ asserts · zero regressions tracker

### Tenim parcial · cal completar per alfa

🟡 Stripe edge function `/api/stripe-create-session` (codi al client OK · cal deploy backend)
🟡 Crypto top-up · UI OK · falta RPC verify real del txHash + price fetcher real (no stubs)
🟡 `/sectors` + `/learn?tab=sectors` · cal fusió (wo-sectors-fusion v134-135)
🟡 `sosTopbar` canonical · només WalletV2 l'usa · falta migrar 14 vistes
🟡 BUILD_STAMP actual · v131c (en branca alpha plan)

### NO tenim · bloquegen alfa

❌ Landing page pública (`/` rebriem visitants externs)
❌ Onboarding flow per a nou usuari (qui pinta el primer projecte)
❌ Pricing page activa · selector pla (Pro 9€/mes activable)
❌ Documentation site (necessari per a alfa pública)
❌ LMS skeleton (wo-research-lms · v132)
❌ Performance audit (Lighthouse · bundle size · LCP)
❌ Accessibility audit (WCAG 2.1 AA)
❌ Internationalization completa (avui català + es parcial · en quasi inexistent)
❌ Mobile · vistes complexes (mapa · canvas · pact builder) NO testejades < 720px

## ROADMAP · 6 fases · 18 sprints

### Fase 1 · ESTABILITZACIÓ (sprints v132-v134 · 1.5 setmanes)

**Objectiu** · zero bugs visibles · zero data loss · base sòlida.

| Sprint | WO | Effort | Resultat |
|---|---|---:|---|
| v132 | **wo-research-lms** | L | Doc estratègic LMS (foundational · sense codi) |
| v132 | **wo-prompt-ab-test-vna** | L | A/B comparator + dataset 20 casos · evidence-based prompt tuning |
| v132 | **wo-import-backup-projects-fix-v2** | S | Bug @alvaro v123 confirmat fix · més tests E2E |
| v133 | **wo-dynamic-kb-index** | L | Indexador automàtic GitHub + KB + permaweb · base per a LMS content discovery |
| v133 | **wo-stripe-edge-deploy** | M | Deploy `/api/stripe-create-session` a Netlify Edge Functions · proves end-to-end |
| v134 | **wo-crypto-rpc-verify** | M | Implementació RPC verify del txHash (RPC + receipt + confirmations) · substituir stubs |
| v134 | **wo-onboarding-flow-v1** | L | Tutorial primer projecte · empty state legendari · 5 steps · skip/resume |

**Mètrica fi fase** · zero error log `[WARN]` o `[ERROR]` en sessió típica 30 min · onboarding completion ≥ 70% en testers.

### Fase 2 · QUALITY UX (sprints v134-v137 · 2 setmanes)

**Objectiu** · UX consistent · zero patrons no-estàndard · mobile-first.

| Sprint | WO | Effort | Resultat |
|---|---|---:|---|
| v135 | **wo-sectors-fusion** | XL | Vista nova `SectorAgentExplorerView` · 7 tabs · fusionar /sectors + /learn?tab=sectors + sector-agents · NO perdre roles bilingüe |
| v136 | **wo-sostopbar-migration** | XL | Migrar 14 vistes a `sosTopbar` canonical (v125) · 1-2 vistes per dia |
| v136 | **wo-mobile-audit** | L | 53 vistes a 360px · llistar trencaments · pla fix prioritari |
| v137 | **wo-sosempty-state** | M | Component canonical `sosEmptyState({icon, title, hint, cta})` · migrar 6 patrons existents |
| v137 | **wo-sosloading** | M | Component canonical `sosLoading({kind})` · skeleton/spinner/inline unificat |
| v137 | **wo-skills-marketplace-ui** | M | Panel `/skills` amb agregat cross-sector (backend ja existeix v131c) |

**Mètrica fi fase** · Lighthouse ≥ 90 Performance · 100 Accessibility · 90 Best Practices a /home /create /wallet/v2 /pact.

### Fase 3 · COMERCIAL ACTIU (sprints v138-v140 · 1.5 setmanes)

**Objectiu** · self-serve · usuari pot pagar i començar sense humà.

| Sprint | WO | Effort | Resultat |
|---|---|---:|---|
| v138 | **wo-landing-page-public** | L | `/` redirigeix a `/landing` per a visitants no-loged · hero + benefits + cta · 3-5 secs comprenibility |
| v138 | **wo-pricing-page-activa** | M | `/pricing` amb 4 plans · botó "Activar Pro" enllaça a Stripe Checkout custom (ja existeix) |
| v139 | **wo-plan-enforcer-soft** | M | Sistema diferenciació plans (Free/Pro/Coop/Enterprise) actiu · banner si Free sobrepassa límits |
| v139 | **wo-sosbutton-tokens** | S | Buttons primaris unificats `sos-btn-primary` · tokens DS · color-coded per context (money/legal/action) |
| v140 | **wo-trial-flow** | M | Free trial 14 dies · activable sense targeta · upgrade flow guiat |
| v140 | **wo-billing-portal** | M | Stripe Customer Portal embedded · cancel/upgrade/invoices |

**Mètrica fi fase** · 5 testers paguen sense ajuda humana · churn primera setmana ≤ 30%.

### Fase 4 · LMS + KNOWLEDGE EVOLUTION (sprints v141-v145 · 2-3 setmanes)

**Objectiu** · base coneixement viva · LMS funcional · API public d'alt valor.

| Sprint | WO | Effort | Resultat |
|---|---|---:|---|
| v141 | **wo-lms-content-engine** | XL | Engine core LMS · Scorm/xAPI player · enrollment · progress tracking |
| v141 | **wo-sector-skill-levels-roles** | M | Afegir `skill_levels` per role als 10 sectors v131c (A·B·C·D·E·H·I·O·T·UV) |
| v142 | **wo-lms-content-bootstrap** | XL | 5 cursos seed (1 per cada cohort tipus · founder · operator · advisor · investor · contributor) |
| v143 | **wo-lms-api-market** | L | API pública `/api/lms/*` (courses · enrollments · progress · certifications) · auth SBT |
| v144 | **wo-knowledge-permaweb-publish** | M | Publicar coneixement seleccionat al permaweb · sectors agents · LMS courses · revisable per la comunitat |
| v145 | **wo-sector-quality-rubric-integration** | S | Cridar `sectorQualityRubric.evaluateProjectAgainstSector` al final del runExpertChain · mostrar score + recommendations al ResultBar |

**Mètrica fi fase** · 3 cohorts utilitzen LMS · primer curs completat per ≥ 10 alumnes · API externa consumida per 2 partners.

### Fase 5 · COMUNITAT + TRUST (sprints v146-v148 · 1.5 setmanes)

**Objectiu** · base d'usuaris confiats · network effect inicial.

| Sprint | WO | Effort | Resultat |
|---|---|---:|---|
| v146 | **wo-cohort-0-onboarding** | L | Cohort 0 · 20-30 founders early · onboarding personalitzat · matchmaking inicial |
| v146 | **wo-attestation-public-feed** | M | Feed públic de attestations al `/opportunities` · descobribilitat |
| v147 | **wo-trust-score-public** | M | Trust score visible al perfil públic · explica què el conforma |
| v147 | **wo-feedback-loop** | M | NPS in-product · feedback button persistent · enviar a backlog automàtic |
| v148 | **wo-referral-program** | M | "Convida un fundador" · descompte Pro · attesting referrals |

**Mètrica fi fase** · 50 perfils públics signats · ≥ 30 attestations al feed · 5 referrals tancats.

### Fase 6 · DOCS + LAUNCH (sprints v149-v150 · 1 setmana)

**Objectiu** · llançament públic alfa · documentació top + comunicació.

| Sprint | WO | Effort | Resultat |
|---|---|---:|---|
| v149 | **wo-docs-site-public** | L | `docs.teamtowershuma.com` · estructura clara · cerca · API reference · cookbook |
| v149 | **wo-i18n-completion** | L | ca/es/en complets per a totes les vistes top-10 més usades |
| v150 | **wo-alpha-launch-checklist** | M | Performance · SEO · OG tags · sitemap · analytics · monitoring · backup automated · disaster recovery doc |
| v150 | **wo-alpha-launch-comms** | M | Llançament X · LinkedIn · ProductHunt · email cohorts existents · blog post · changelog v100→v150 |

**Mètrica fi fase** · GA tracking actiu · primer pic visitants externs > 500/dia · suport <24h response time.

---

## TIMELINE summary

| Fase | Sprints | Setmanes | Focus |
|---|---|---:|---|
| 1 · Estabilització | v132-134 | 1.5 | Zero bugs · backends reals (Stripe + crypto) |
| 2 · Quality UX | v135-137 | 2.0 | Sectors fusion · sosTopbar · mobile · components canonical |
| 3 · Comercial | v138-140 | 1.5 | Self-serve · pricing actiu · trial · billing portal |
| 4 · LMS + Knowledge | v141-145 | 2.5 | LMS engine + content + API public |
| 5 · Comunitat | v146-148 | 1.5 | Cohort 0 · trust public · referrals |
| 6 · Launch | v149-150 | 1.0 | Docs + i18n + alpha launch checklist + comms |
| **TOTAL** | **v132→v150** | **~10 setmanes** | **8 setmanes effort + 2 setmanes buffer** |

## Mètriques globals d'alfa

| KPI | Objectiu pre-alpha (v131) | Objectiu alpha (v150) |
|---|---:|---:|
| Test asserts pass | 1500+ | 2500+ |
| Vistes amb sosTopbar canonical | 1 (WalletV2) | ≥ 15 |
| Vistes mobile-friendly | parcial | 100% top-10 |
| Sectors canonical CNAE | 21/21 ✓ | 21/21 ✓ |
| Plans Stripe actius | 0 | ≥ 5 paid |
| Cohort users | 1-2 | ≥ 30 |
| Documentation pages | dispers | 50+ |
| Permaweb published nodes | parcial | ≥ 100 |
| LMS courses live | 0 | 5+ |
| API externa endpoints | 0 stable | ≥ 10 |
| Mean Lighthouse score | unknown | ≥ 90 |
| Uptime monitoring | manual | automated 99.5% SLA |

## Decisions a prendre @alvaro

1. **Alfa pública o tancada (whitelist) primer?** · recomanació · whitelist a cohort 0 + 50 invitats després → pública obert al v152.
2. **Pricing real des de v138 o gratuit fins v150?** · recomanació · pricing visible des v138 · trial 14d permet entrada fricció zero.
3. **LMS build vs OpenEdX integration?** · vegeu doc `lms-sectors-fusion-v132.md` recomanació · build minimal core + integrar Scorm/xAPI players (no reinventar roda completa).
4. **Comunicació pre-alpha · què comencem ja?** · recomanació · changelog public a `/changelog` des v132 · newsletter mensual des v138.

## Principis de sprint (transversal)

- **KISS** · cada sprint ≤ 2 WOs grans + 1-2 petits
- **TDD primer** · tests abans del codi sempre
- **Cap regressió** · suite full green abans de merge
- **PR atòmics** · 1 PR per WO complet
- **Doc-first per WOs grans** · plan doc abans del codi (com v131 audit)
- **Mètrica per sprint** · cada PR descriu el KPI que mou

## Pla post-alfa (≥ v151)

- v151-160 · beta amb permaweb federat real entre instàncies
- v161-180 · Matriu integration · 6 vectors completos · DAO governance multisig
- v181-200 · marketplace skills i agreements amb royalties
- v200+ · GA · 1.0 release · roadmap públic

---

*Pla viu · creat 2026-05-18 com a roadmap estratègic a alfa pública SOS V11.*
