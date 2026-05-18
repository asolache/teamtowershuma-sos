# Auditoria pantalles · v151 · submenu pattern canonical

> Audit de quina vista té · té-pero-no-canonical · NO té el submenu pattern.
> Objectiu · migrar totes les vistes amb >1 mode/tab a `SubmenuTabs` canonical
> i col·locar botons d'acció a la dreta del submenu (segons feedback @alvaro).

## 1 · Inventari complet (57 vistes)

### A · Vistes amb canonical `SubmenuTabs` ✅ (7)
- `LearnView` · `/learn` · 7 modes
- `WalletV2View` · `/wallet/v2` · 6 tabs + ctx switcher (v150 fused)
- `AccountingV2View` · `/accounting/v2` · 5 tabs + ctx switcher (v150 fused)
- `TeamView` · `/team` · 5 tabs
- `ProjectHubV2View` · `/project/{id}` · 6 pilars + dropdown
- `ProjectHubV3PreviewView` · `/project-hub-v3-preview` · preview
- `DesignSystemView` · `/design` · demo viu (no usable production)

### B · Vistes amb tabs PROPIS (no canonical · cal migrar) 🟡 (5)
| Vista | Pattern actual | Tabs |
|---|---|---|
| `SettingsV2View` | `.sv2-tab` + `data-tab` | 7 (api-keys · theme · ai · payments · permaweb · manifesto · backup) |
| `OpportunitiesView` | `.op-tab` + `data-op-tab` (inline styles) | 6 (projects · workorders · market · workshops · cvnodals · users) |
| `CreateLiveView` | `.cl-tab` + `data-cl-tab` | 4 (castell · mapa · canvas · wos) |
| `NotesView` | `.nts-tab` + URL `?type=X` | N (per type · dinamic) |
| `MobileMockupView` | `.mm-tab` + `data-mm-screen` | 3 (home · wo · wallet) |

### C · Vistes amb MÚLTIPLES SECCIONS però SENSE tabs (candidates) 🟢 (4-5)
- `ProjectsView` · podria tenir tabs (all · active · archived · drafts)
- `SkillsExplorerView` · podria tenir tabs per tier o domain
- `MarketView` · podria tenir tabs (products · services · workshops · sops)
- `Profile360View` · 8 zones · podrien ser tabs si vol UX més clara
- `ProjectQualityView` · podria tenir tabs (rubric · integrity · history)

### D · Vistes SENSE necessitat de submenu (correctament simples) ✓
HomeView · DashboardV2View · IdentityView · InboxView · ValueMapView · KanbanView · etc.
Aquestes són single-purpose · NO necessiten submenu (afegir-lo seria sobre-engineering).

## 2 · Plan v151 · 5 migracions prioritzades

| # | Vista | Esforç | Impacte |
|---|---|---|---|
| 1 | **SettingsV2View** | S · 7 tabs ja estan declarades | UX consistent + més usat |
| 2 | **OpportunitiesView** | S · 6 tabs ja existeixen | UX consistent + alta freqüència ús |
| 3 | **CreateLiveView** | S · 4 tabs | Flow creació · alta visibilitat |
| 4 | **NotesView** | S · simple | Lleugera |
| 5 | **MobileMockupView** | S · 3 tabs · vista demo | Coherència |

**Botons d'acció** · cadascuna de les vistes té botons (Save · Add · Reset · etc.). El plan és:
- Inclou els botons existents com a slot dret de la barra submenu
- Pattern · `<nav class="sos-submenu">...<div class="actions">...buttons...</div></nav>`
- Reutilitzar el flex layout de `.w2-bar-fused` (v150)

## 3 · Vistes NO migrades (deliberadament) · justificació

- **DesignSystemView** · demo · l'usuari mai naveja en producció
- **ProjectHubV3PreviewView** · preview deprecat post v141+v142 · es pot eliminar
- **Vistes single-purpose** (HomeView · IdentityView · KanbanView · etc.) · 1 sola "vista" · submenu seria afegir soroll

## 4 · Plan d'execució

v151 · migrar 5 vistes a canonical pattern · al mateix sprint per a coherència UX.

Per cada vista:
1. Substituir tabs custom per `renderSubmenuTabs` + `bindSubmenuTabs`
2. Posar botons d'acció existents a la dreta usant pattern fused (com WalletV2/AccountingV2)
3. Actualitzar tests existents (si en tenen) per match nou contract

---

*Auditoria v151 · 2026-05-21. Pre-execució migracions.*
