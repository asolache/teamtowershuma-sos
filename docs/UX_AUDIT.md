# UX Audit · TeamTowers SOS V11

*Audit @alvaro 2026-05-15 · post sprint analysis & design v4 · **19 PRs merged** ·  
actualitzat 2026-05-16 amb cicle final UX-D · UX-C · social · catalog · creation*

## Visió · "API + APP"

L'usuari ha de poder fer servir SOS de 2 formes alhora ·

1. **Com a app** · 5-click rule des de qualsevol pantalla · entry points clars · disrupcions visibles · workflows guiats
2. **Com a API** · qualsevol agent IA (Claude · GPT · Gemini · custom local) pot llegir/escriure WOs via `docs/backlog.yaml` + `agentBridgeSchema`. Backend descentralitzat operatiu.

## Capes UX implementades

### ✅ Capa 0 · Fonaments (operatius)
- **Router** · pattern `getHtml() + afterRender()` · regression test `viewContract.test.js` evita re-introduir el bug
- **Nav** · ?project= a totes les vistes project-scoped (#98)
- **Cost-QA orchestrator** · cache + budget + decision + tier visible

### ✅ Capa 1 · Entry points
| Ruta | View | Estat | UX |
|------|------|-------|-----|
| `/` `/home` | DashboardV2View | ✅ v53 | KISS 4-zones · hero context-aware |
| `/dashboard` | DashboardView (clàssic) | ⚠️ legacy | 2628L · banner "🆕 Home v2" |
| `/project/{id}` | ProjectHubV2View | ✅ v55 (aquest PR) | 8-zones · 5-click · 🛠 advanced tools |
| `/project-classic/{id}` | ProjectHubView (clàssic) | ⚠️ legacy | 1198L · banner "← Hub v2" |
| `/hub/{id}` | ProjectHubV2View | ✅ alias | mateix que /project/ |
| `/pitch-doc/{id}` | InvestorPitchView | ✅ v50 | IA-synth document |

### ⚠️ Capa 2 · Vistes operatives (46 fitxers `js/views/`)

**Grup A · Project-scoped (necessiten ?project=)** · 25 vistes
- Canvas · Pitch · Pact · Presentation
- VNA Map · Kanban · SOPs · Tokenomics
- Accounting · Wallet · Value · Invoices · Proposals
- Lifecycle · Swarm · Improve · Quality
- Market (project-aware) · Workshops · NeuralPath

**Grup B · Globals** · 18 vistes
- Identity · Skills · Sectors · Settings · Design
- Registry · Matriu (landing + network) · Opportunities
- Sprint (swarm orchestrator)
- MindGraph · Folders · Tags
- Profile (/u/{handle}) · MarketDetail (/market/{id})
- MobileMockup · NodeView (/n/{id})

**Grup C · Home/entry** · 3 vistes
- DashboardV2 · Dashboard (clàssic) · Home

## Pain points observats + recomanacions

### 🔴 Alts (prioritat critical)

1. **Dashboard antic 2628L monolític** · ja resolt parcialment amb /home (v53) · l'antic queda backwards-compat
2. **ProjectHubView 1198L** · ja resolt amb V2 default (aquest PR)
3. **Sense progressive disclosure a vistes pesades** · ex Tokenomics · Accounting · ValueMap tenen TANTA densitat que cal scroll i orientació costen molt

### 🟡 Mitjans

4. **Settings disperses** · API keys · tema · provider preferences viuen a vistes diferents
5. **Identity vs Profile (/u/{handle})** · solapament parcial · usuari pot confondre
6. **MatriuLanding · MatriuNetwork** · 2 vistes molt similars
7. **Sprint vs Kanban swarm mode** · SWARM-RELOC pendent (banner ja apunta a backlog YAML)

### 🟢 Baixos (millores)

8. **NodeView genèric `/n/{id}`** · vista detall poc cuidada
9. **MobileMockupView · MindGraphView** · útils per demo · poc pulides per a producció
10. **HomeView legacy `/team /paper /lms`** · alies estranys que apunten a la mateixa vista

## Pla d'evolució UX (proper sprint o nice-to-have)

### Sprint UX-A · Consolidació entry points ✅ COMPLETAT
- ✅ DashboardV2 al `/` `/home` (PR #99)
- ✅ ProjectHubV2 a `/project/` (PR #101)
- ⏳ Eliminar HomeView legacy · redirigir `/team /paper /lms` → `/learn` (low-prio)

### Sprint UX-B · Progressive disclosure a vistes pesades ⏳ PENDENT
- Tokenomics · split en 2 modes (vista quick · vista expert detallada)
- Accounting · top 5 entries + "veure totes"
- ValueMap · cluster filter per defecte (mostra subgraf actiu · "veure tot el VNA")

### Sprint UX-C · Settings unificades ✅ COMPLETAT (PR #103)
- ✅ `/settings-v2` amb 5 tabs · 🔑 API keys · 🎨 Tema · 🤖 IA defaults · 🌐 Permaweb · 💾 Backup

### Sprint UX-D · Mobile-first pass ✅ COMPLETAT (PR #102)
- ✅ Mobile bottom-nav global · 5 destinacions · injectat router · safe-area
- ✅ uxComponents reusables · toast · emptyStateHtml · confirm modal

### Sprint Social · SOCIAL-LAYER-001 ✅ COMPLETAT (PR #105 + #106)
- ✅ socialGraphService · follow/follower derived from attestations
- ✅ TimelineView · /timeline · feed cronològic agregat
- ✅ Follow button al ProfileView · interactiu · KB upsert/delete

### Sprint Creation · B-UNIFIED-FORM-001 ✅ COMPLETAT (PR #104)
- ✅ ProjectCreationV2View · /create · 1 sol form · Plan→Fan-out→Reduce visible
- ✅ Cost preview live · progress steps · classify → canvas → vna → sops
- ✅ Accept ?template= query param via ProcessCatalog (aquest PR)

### Sprint Catalog · PROCESS-CATALOG-001 ✅ COMPLETAT (PR #108)
- ✅ ProcessCatalogView · /process-catalog · 15 plantilles type×stage
- ✅ Filtres type + stage · detall inline · link a /create amb pre-selection

### Sprint Swarm · SWARM-RELOC-001 ✅ COMPLETAT (PR #107)
- ✅ KanbanView · 🐝 Swarm mode toggle · botó Auto-run per WO · /sprint?wo={id}

## Decisions arquitectòniques d'aquest PR

1. **`/project/{id}` ara és V2 (clean)** · l'antic a `/project-classic/{id}`
2. **Zona 8 "Eines avançades"** al V2 hub · `<details>` col·lapsable · 9 power-user actions sense saturar el hub principal
3. **Banner CLÀSSIC** al hub vell · clar visual feedback que és la versió power-user
4. **5 categories pure del routing** queden estables ·
   - `/n/{id}` Node detail
   - `/u/{handle}` Profile
   - `/market/{id}` Market detail
   - `/hub/{id}` `/project/{id}` Project Hub V2
   - `/project-classic/{id}` Project Hub clàssic
   - `/pitch-doc/{id}` Investor pitch

## Tests · garantia evolutiva

| Test | Purpose | Asserts |
|------|---------|---------|
| `viewContract.test.js` | getHtml + afterRender API · 3 nous views | 12 |
| `navServiceProject.test.js` | ?project= a project-scoped views | 103 |
| `dashboardV2.test.js` | DashboardV2View service contracts | 8 |
| `projectHubV2.test.js` | ProjectHubV2View service contracts | 18 |

**Total · 3854+ asserts · 79+ suites verdes. Cap regressió al UX evolutionary path.**

---

*Document viu · actualitzar quan calgui · post nou sprint UX.*
