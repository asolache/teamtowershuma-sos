# Pla d'evolució total a V2 · 51 vistes → alfa estable

Aquest document tanca la trilogia d'estudis (`STUDY-project-creation` ·
`STUDY-value-flow-audit` · aquest). Resol la confusió de "quina vista
és la bona" abans d'obrir alfa amb 108 operadors, amb un **camí
executable a 6 fases** que migra les features úniques de cada V1
abans d'esborrar-la i deixa **una sola entrada canónica** per àrea.

---

## 1 · Diagnòstic · l'estat actual al codi

### 1.1 Xifres
- **51 fitxers** de vista (~30.246 LOC)
- **51 rutes** actives al router
- **3 parells V1↔V2 declarats** (Dashboard · Settings · ProjectHub)
- **5 rutes ambígües** al fallback `HomeView` (`/team`, `/paper`, `/lms`, `/focus`, fallback)
- **1 grup d'over-fragmentació** · Invoice + Proposal + ValueAccounting

### 1.2 Per què l'usuari es perd
1. **Settings** té 2 entrades (`/settings` i `/settings-v2`) sense banner clar de quina és l'oficial · ambdues funcionals · cap és superset de l'altra.
2. **Dashboard** té 2 entrades (`/` i `/dashboard`) però `/` carrega V2 i `/dashboard` el legacy · no hi ha redirect.
3. **ProjectHub** ja té V2 com a defecte a `/project/{id}` però V1 continua disponible com a `/project-classic`.
4. **5 alies (`/team`, `/paper`, `/lms`, `/focus`)** tots porten al mateix `HomeView` genèric · semblen botons trencats.

---

## 2 · Decisió arquitectònica clara · V2 és canònica

Per a alfa:
- **V2 = entrada oficial** per a totes les àrees on existeixi.
- **V1 = arxivada amb migració de features úniques abans** d'esborrar.
- **Cap nova feature a V1** des d'avui.
- **Banner de migració** a totes les rutes V1 dirigint a V2 (deprecation visible).

---

## 3 · Inventari de migracions · què cal moure abans d'esborrar V1

### 3.1 Dashboard · DashboardView (2.632 LOC) → DashboardV2View (392 LOC)

**Features úniques de V1 a migrar a V2:**
| Feature V1 | Cost migració | Prioritat |
| --- | ---: | --- |
| Panel KB inline · query/upsert de nodes | 2h | high |
| Member editor amb roles · matriu_member CRUD | 3h | high |
| Onboarding guiat (5 steps) | 2h | medium |
| Health score VNA al hero | 1h | low (ja inferible del project) |
| Founder template invocació | done (a `/create?templateId=founder...`) | — |

**Total · ~8h** · després redirect 301 `/dashboard → /` · esborrar DashboardView.

### 3.2 Settings · SettingsView (813 LOC) ↔ SettingsV2View (420 LOC)

**Features úniques de V1 a migrar a V2 (tabs nous):**
| Feature V1 | Cost migració | Prioritat |
| --- | ---: | --- |
| Stripe config (Payment Links · topup URLs) | 2h | high |
| Manifesto editor (text del projecte fundacional) | 1.5h | medium |
| Plan selector + planEnforcer | 1.5h | high |
| Export/import KB full (vs backup curt de V2) | 1h | medium |
| **Arweave keyfile loader** | ja a /identity (v80) · removible de V1 | — |

**Total · ~6h** · després redirect 301 `/settings → /settings-v2` · esborrar SettingsView.

### 3.3 ProjectHub · ProjectHubView (1.199 LOC) → ProjectHubV2View (637 LOC)

V2 ja és el defecte a `/project/{id}` · V1 viu a `/project-classic`.

**Features úniques de V1 a migrar a V2:**
| Feature V1 | Cost migració | Prioritat |
| --- | ---: | --- |
| Swarm matchmaker (assignar WO ↔ operador) | 3h | high |
| Permaweb publish UI directa | 1.5h | medium (ja a /identity) |
| Seat CRUD (108 places matriu) | 1.5h | medium |
| Cohort matching algorithm | done (al swarmAffinity service) | — |

**Total · ~6h** · després redirect 301 `/project-classic → /project` · esborrar ProjectHubView.

### 3.4 Comptabilitat fragmentada · 3 vistes → 1

**Estat actual** · `InvoiceView` + `ProposalView` + `ValueAccountingView`
totes consumeixen `ledger_entry` · viuen separades · l'usuari ha de
navegar entre 3 pàgines.

**Proposta** · `ProjectFinanceView` (nou · 4 tabs):
- Tab 1 · **Comptabilitat** (ValueAccountingView · Slicing Pie + KPI)
- Tab 2 · **Factures** (InvoiceView)
- Tab 3 · **Propostes** (ProposalView)
- Tab 4 · **Saldo + Wallet** (extracte de WalletView per project)

**Cost · ~10h** · esborrar 3 fitxers · redirect 301 dels 3 paths a `/finance?project=X&tab=...`.

### 3.5 Rutes `/team` `/paper` `/lms` `/focus` → fallback

Tots apunten a `HomeView` genèric · cap context propi. Decisió:
- `/focus` · té sentit com a modus "operadora · una sola WO ara" → vista contextual real (futur)
- `/team` `/paper` `/lms` · sense rationale clar avui · **redirigir a `/home`**.

**Cost · 1h** · canvi al router · pas immediat.

---

## 4 · Pla d'execució · 6 fases · ~37h totals

### Fase A · Setup de la migració (1h)
- Banner deprecation reutilitzable als V1 (component `DeprecatedBanner.js`)
- Decoració al router · cada ruta V1 carrega + injecta el banner
- Documentació breu de la migració a `docs/MIGRATION-V2.md`

### Fase B · Settings consolidat (6h) · **resol la confusió actual de l'usuari**
1. Banner deprecation a `/settings` apuntant a `/settings-v2` (1h)
2. Migrar Stripe config a tab "Pagaments" de V2 (2h)
3. Migrar Plan selector a tab "Plan" de V2 (1.5h)
4. Migrar Export/Import full a tab "Backup" de V2 (1h)
5. Manifesto a "Advanced" (0.5h)
6. Redirect 301 `/settings → /settings-v2` · esborrar `SettingsView.js`

### Fase C · Dashboard consolidat (8h)
1. Banner deprecation a `/dashboard` apuntant a `/` (0.5h)
2. Migrar KB panel inline a una `<details>` collapsible al DashboardV2 zone 5 (2h)
3. Migrar Member editor a `/identity?tab=members` (3h)
4. Migrar Onboarding 5 steps a hero del DashboardV2 quan empty state (2h)
5. Redirect 301 `/dashboard → /` · esborrar `DashboardView.js`

### Fase D · ProjectHub consolidat (6h)
1. Banner deprecation a `/project-classic`
2. Migrar swarm matchmaker a un drawer del HubV2 (3h)
3. Migrar seat CRUD a tab "Matriu" del HubV2 (2h)
4. Redirect 301 `/project-classic → /project` · esborrar `ProjectHubView.js`

### Fase E · Comptabilitat unificada (10h)
1. Crear `ProjectFinanceView.js` · skeleton 4 tabs (1h)
2. Migrar ValueAccountingView a tab Comptabilitat (3h)
3. Migrar InvoiceView a tab Factures (2h)
4. Migrar ProposalView a tab Propostes (2h)
5. Tab Wallet · vista per project del WalletView (1h)
6. Redirects 301 dels 3 paths · esborrar els 3 fitxers (1h)

### Fase F · Neteja rutes ambígües + cleanup final (2h)
1. Redirect `/team` `/paper` `/lms` → `/home` (0.5h)
2. Decidir `/focus` · keep contextual o redirect (0.5h)
3. Verificar `ProcessCatalogView` (òrfena · investigar enllaços reals) (0.5h)
4. Bump build stamp · doc updates (0.5h)

### Fase G (post-alfa · opcional) · refactor de fons
- Fer `BaseV2View` amb la shell comuna (topbar mòbil · zones · skip-link · breadcrumbs · skeleton states).
- Estendre als 40 views restants per UX consistent.

---

## 5 · Mapa de rutes · abans vs després

### Abans (51 rutes · confús)
```
/  /home  /team  /paper  /lms  /focus → 6 entrades · 2 vistes
/dashboard  /  → 2 entrades dashboard
/settings  /settings-v2 → 2 entrades settings
/project/{id}  /project-classic/{id} → 2 entrades hub
/invoices?project=X
/proposals?project=X
/value-accounting?project=X → 3 entrades finance
```

### Després (40-42 rutes · clar)
```
/                 → DashboardV2View (canònic)
/dashboard        → redirect 301 → /
/settings         → SettingsV2View (renombrat de /settings-v2)
/settings-v2      → redirect 301 → /settings (compat)
/project/{id}     → ProjectHubV2View (únic)
/project-classic  → redirect 301 → /project
/finance?project= → ProjectFinanceView (4 tabs)
/invoices         → redirect 301 → /finance?tab=invoices
/proposals        → redirect 301 → /finance?tab=proposals
/value-accounting → redirect 301 → /finance?tab=accounting
/team /paper /lms → redirect 301 → /home
/focus            → keep o redirect (decisió)
```

---

## 6 · Mètrica d'èxit (per a alfa)

| Mètrica | Avui | Objectiu alfa |
| --- | ---: | ---: |
| Vistes totals | 51 | **≤42** |
| LOC total | 30.246 | **≤26.000** (estalvi 14%+) |
| Parells V1/V2 sense decidir | 3 | **0** |
| Rutes ambígües (>1 vista per concept) | 4 grups | **0** |
| Banners deprecation actius | 0 | 0 (totes V1 esborrades) |
| Test coverage de la nav primària | parcial | **smoke per ruta canònica** |

---

## 7 · TDD que validem (no-regressió de la consolidació)

Nous tests:
- `js/tests/routerRedirects.test.js` · cada redirect 301 retorna la vista correcta · ≥10 asserts.
- `js/tests/v2NavCoherence.test.js` · DashboardV2 / SettingsV2 / ProjectHubV2 / ProjectFinance · cada un renderitza sense errors · té els tabs declarats · cap link trencat dins el shell.
- `js/tests/migrationContract.test.js` · cap V1 té enllaços directes des de nav primària · cap `<a href="/dashboard">` sense banner deprecat.

Total nou · ~50 asserts.

---

## 8 · WOs proposades per al backlog

| WO | Fase | Cost | Prioritat |
| --- | --- | ---: | --- |
| `wo-v2-banner-deprecation-001` | A | 1h | high |
| `wo-settings-consolidate-001` | B | 6h | **critical** (UX bug actiu) |
| `wo-dashboard-consolidate-001` | C | 8h | high |
| `wo-project-hub-consolidate-001` | D | 6h | high |
| `wo-finance-consolidate-001` | E | 10h | medium |
| `wo-router-cleanup-001` | F | 2h | medium |
| `wo-base-v2-view-001` | G | 8h (post-alfa) | low |

**Subtotal F-A-B-C-D · ~21h** (alfa privada · setmana 1)
**Total amb E+F · ~37h** (alfa pública · setmana 2)

---

## 9 · Recomanació · per on començar

**Demà · Fase A + Fase B** (7h totals) · resolen el problema concret
que has plantejat avui (settings · "no sé quina usar") **i ja apareix
el camí de migració per a la resta**. Un cop B fet · les altres fases
són còpia del pattern · cost predictible.

L'ordre òptim · A → B → F → C → D → E:
- A · setup banner (1h)
- B · settings (6h) ← resol pain point immediat
- F · neteja rutes ambígües (2h) ← quick win
- C · dashboard (8h) ← vista més vista
- D · hub (6h) ← entrada de projecte
- E · finance (10h) ← UX complexa · l'última

**Mètrica de salut setmanal · si baixem de 51 vistes a 42 sense
trencar tests · estem al camí.**

---

## 10 · TL;DR · contracte amb tu

1. **Decisió ferma · V2 és el camí · V1 té data de caducitat amb migració neta**.
2. **Settings es resolt en sessió única demà** (Fase A+B = 7h).
3. **Tota la consolidació en ~37h distribuïdes en 6 fases · totes amb TDD**.
4. **Pla per a evitar pèrdua de features** · cap V1 s'esborra fins haver migrat les seves features úniques.
5. **Visibilitat constant · banner deprecation a totes les V1 dirigint a V2**.

Si t'agrada · demà entrem amb A+B i tanquem el pain point de settings.
