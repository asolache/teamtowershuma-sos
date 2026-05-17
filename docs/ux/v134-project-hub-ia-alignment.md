# v134 · Project Hub · IA aligned to main menu pillars

> Status · PROPOSAL · supersedeix v132i mockup (que tenia ad-hoc 5 tabs sense
> alineació amb el menú principal). Reescriu les decisions del WO
> `wo-project-hub-subtabs` per a coherència UX cross-vistes.

## 1 · La IA del menú principal (font de veritat)

`js/core/navService.js` defineix **5 pilars principals** ·

| Pilar | Verb | Vistes incloses (global level) |
|---|---|---|
| **🎨 Crear** | `create` | canvas · pitch · pact · presentation · process-catalog · projects |
| **🔨 Treballar** | `work` | map · kanban · sops · sprint · swarm · improve · **quality** · lifecycle |
| **💶 Comptabilitzar** | `account` | tokenomics · accounting · wallet · value-accounting · invoices · savings · efficiency |
| **🔗 Connectar** | `connect` | market · proposals · opportunities · matriu · registry · timeline · inbox |
| **🧠 Aprendre** | `learn` | learn (hub) · skills · path · notes · prompts-debug |

Aquesta seqüència `crear → treballar → comptabilitzar → connectar → aprendre`
és la columna vertebral mental de SOS. La IA del Project Hub HA DE seguir-la.

## 2 · El problema actual

`ProjectHubV3PreviewView` (v133) té tabs ad-hoc · `Hub · Map · Kanban · Wallet
· Presentation` · que barreja conceptes de diferents pilars sense
seqüència mental clara. A més · **falta Quality** i **Equip+Permisos**.

## 3 · Proposta v134 · IA aligned

### 6 tabs principals + dropdown "Més"

```
🏠 Hub | 🎨 Crear | 🔨 Treballar | 💶 Comptabilitzar | 🔗 Connectar | 👥 Equip | ▾ Més
```

Cada tab principal alimenta un **2on submenu** de subvistes (component
canonical `SubmenuTabs` reutilitzat · 2 nivells max).

### Mapping vistes globals → subtabs de projecte

| Tab principal | Sub-tabs (component reutilitzat) | Vistes globals reincorporades |
|---|---|---|
| 🏠 **Hub** | (sense sub-tabs · overview) | KPIs · activity stream · alerts |
| 🎨 **Crear** | Canvas · Pitch · Pact · Presentation | `/canvas` · `/pitch` · `/pact` · `/presentation` |
| 🔨 **Treballar** | Map · Kanban · Quality · Sprint · Lifecycle | `/map` · `/kanban` · `/quality` · `/sprint` · `/lifecycle` |
| 💶 **Comptabilitzar** | Wallet · Comptes · Pastís valor · Factures · Tokenomics | `/wallet` (v2) · `/accounting` (v2) · `/value-accounting` · `/invoices` · `/tokenomics` |
| 🔗 **Connectar** | Pactes signats · Propostes · Mercat | (subvistes filtrades del projecte actiu) |
| 👥 **Equip** | Membres · Rols · Permisos · Convidacions | NOVA VISTA (no existeix) |
| ▾ Més | Aprendre (KB) · Sprints · SOPs · Settings · Lifecycle dashboard | (overflow) |

### Filosofia

- **Nivell 1 · pilars verbs** · què estic fent ara (creant · treballant ·
  comptabilitzant...)
- **Nivell 2 · subvistes** · com ho faig dins d'aquest pilar
- **URL sync sempre** · `?tab=treballar&sub=quality` per linkar profundament
- **Coherència 100% amb menú global** · si vols la mateixa funció global
  vs project · t'ho trobes al mateix grup mental

## 4 · Tab 💶 Comptabilitzar · v2 redesign (necessitat explicitada)

Vistes actuals (global) ·
- `AccountingView` · ledger double-entry · força textual · poc UX visual
- `WalletView` (v1) · saldo prepago · sense gràfics · navbar legacy
- `WalletV2View` · ja existeix v2 amb millor UX → **referent · usar com a base**
- `ValueAccountingView` · slicing pie · OK però no integrat

Versió projecte v2 ·
- **Wallet** (sub-tab default) · saldo live + flow setmanal + transferència
  entre projectes · usa WalletV2 com a base
- **Comptes** · ledger compacte amb categories visuals · filter per
  membre/categoria · export CSV
- **Pastís valor** · slicing pie + multiplicadors Moyer · contribucions per
  membre · responsive
- **Factures** · CRUD + IVA + auto-ledger + print PDF
- **Tokenomics** · dissensy token projecte si aplicable

Submenu intern (component canonical reutilitzat) ·
```
💶 Comptabilitzar
   Wallet | Comptes | Pastís valor | Factures | Tokenomics
```

## 5 · Tab 👥 Equip · NOVA VISTA (general + per-projecte)

Dimensió dual ·

### A · Vista GLOBAL `/team` (no existeix avui)
- Llista persones del swarm SOS amb qui he col·laborat
- Filter per projecte · sector · skill · rol exercit
- Permisos GLOBALS de l'usuari sobre els meus projectes ·
  - quins projectes meus pot veure
  - quins pot editar
  - quins WOs pot reclamar
- Audit log · qui ha fet què

### B · Subtab `Equip` dins de cada projecte
- **Membres** · llista de qui hi participa al projecte concret
- **Rols** · founder · ops · contributor · viewer · invited · catàleg
  expandible
- **Permisos in-project** · matriu finament granulada ·
  - read project (canvas · pitch · pact · presentation)
  - edit project (canvas · pitch · pact)
  - claim WOs (kanban · sprint)
  - approve WOs (review status)
  - manage finances (wallet · accounting · invoices)
  - manage members (afegir/treure persones · canviar rols)
- **Convidacions pendents** · email · link · expires
- **Activity per membre** · contribucions · hores · WOs completats

Submenu intern ·
```
👥 Equip
   Membres | Rols | Permisos | Convidacions
```

### Permission Model proposat (Slicing Pie + ACL)

```js
{
    projectId: 'forn-vall',
    members: [
        { did: 'did:sos:alvaro', role: 'founder', joinedAt: 1234, slices: 4500 },
        { did: 'did:sos:maria',  role: 'ops',     joinedAt: 1235, slices: 2300 },
    ],
    roleDefinitions: {
        founder:     { can: ['*'] },
        ops:         { can: ['read.*', 'edit.canvas', 'claim.wos', 'approve.wos.own'] },
        contributor: { can: ['read.*', 'claim.wos'] },
        viewer:      { can: ['read.canvas', 'read.presentation'] },
    },
    invitations: [
        { email: 'pau@vall.com', role: 'contributor', token: 'inv_xyz', expires: 1240 },
    ],
}
```

## 6 · Tab 🔨 Treballar · integració Quality

`ProjectQualityView` existeix com a vista standalone (`/quality`). v134 ·
- Treure de menu principal global → moure a subtab DE PROJECTE
- Conservar el rubric 12-criteris + integritat 7-regles
- Score live alimentat per `runQualityAudit()` cada vegada que canvia el
  mapa o canvas

Submenu intern Treballar ·
```
🔨 Treballar
   Map | Kanban | Quality | Sprint | Lifecycle
```

## 7 · Roadmap d'implementació v134 → v140

| Sprint | Què |
|---|---|
| v134 (avui) | Doc IA + mockup actualitzat + preview view actualitzat + 5 WOs backlog |
| v135 | `js/ui/SubmenuTabs.js` v2 · suport 2-nivells (sub-submenu) |
| v136 | Implementar Tab 🎨 Crear (consolida 4 subvistes existents) |
| v137 | Implementar Tab 🔨 Treballar + integrar Quality |
| v138 | Implementar Tab 💶 Comptabilitzar v2 (redisseny) |
| v139 | Implementar Tab 👥 Equip · MVP (membres + rols catàleg) |
| v140 | Vista global `/team` + permission model complet + audit log |

## 8 · Riscos identificats

| Risc | Mitigació |
|---|---|
| 2-nivells de submenu satura visualment | Sub-submenu només quan tab és actiu · prova UX user-test |
| Quality treta del menu global · usuaris habituats | Redirect `/quality` → `/project/:id?tab=treballar&sub=quality` |
| Tokenomics no aplica a tots els projectes | Sub-tab `Tokenomics` només visible si projecte té token config |
| Team general · scope càrrega global · pot ser lent | Lazy-load · paginar · cache per projecte |

## 9 · Validation manual @alvaro

Mockup actualitzat · `docs/ux/v134-project-hub-mockup.html` · obre al
navegador. Preview viu · `/project-hub-v3-preview` post-merge.

Decisions pendents per validar ·

| # | Pregunta | Recomanació |
|---|---|---|
| 1 | 6 tabs principals + dropdown vs 5 tabs + Equip al dropdown? | **6 tabs** (Equip mereix visibilitat) |
| 2 | Sub-submenu 2-nivells o reusar component pla? | **2-nivells** (component SubmenuTabs v2) |
| 3 | Quality stays a /quality global O només a project hub? | **Project hub-only + redirect global** |
| 4 | Vista global /team com a "identity" o nou pilar? | **Nou pilar** "Equip" al menu principal? |
| 5 | Permission model · RBAC pur o ABAC fine-grained? | **RBAC + role overrides** per a WO claims |

---

*Doc v134 · 2026-05-17 · @alvaro · supersedeix v132i mockup · pendent validació.*
