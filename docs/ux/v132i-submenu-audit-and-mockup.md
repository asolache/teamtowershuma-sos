# v132i · Submenu Pattern · Anàlisi + Mockup previ a implementació

> Status · ANÀLISI · validació manual @alvaro pendent abans d'implementar v133.
> Mockup HTML viu · `docs/ux/v132i-mockup-project-hub-subtabs.html` ·
> obre al navegador per veure'l interactiu.

## 1 · Auditoria · vistes amb submenú existent

S'han identificat **5 vistes** que ja implementen un submenú/tabs intern,
cadascuna amb una convenció DIFERENT (inconsistència UX a resoldre).

| Vista | Ruta | State | data-attr | CSS class | URL param | Nota |
|---|---|---|---|---|---|---|
| **LearnView** (referent) | `/learn` | `this._mode` | `data-mode` | `.lv-tab` | `?tab=X` + `?mode=X` | 7 modes · roadmaps · carpetas · search · sectors · mind · folders · tags |
| **SettingsV2View** | `/settings` | `this._activeTab` | `data-tab` | inline styles | (?) | 7 tabs · api-keys · ai-defaults · payments · permaweb · theme · backup · manifesto |
| **OpportunitiesView** | `/opportunities` | `this._activeTab` | `data-op-tab` | `.op-tab` (inline) | `?tab=X` | 6 tabs · projects · workorders · market · workshops · cvnodals · users |
| **CreateLiveView** | `/create` | `this._activeTab` | `data-cl-tab` | `.cl-tab` | (?) | 4 tabs · castell · mapa · canvas · wos |
| **NotesView** | `/notes` | (?) | (?) | `.nts-tab` | (?) | Tabs internes de filtre |

### Diagnosi

- **5 prefixos CSS diferents** · `.lv-tab` · `.op-tab` · `.cl-tab` · `.nts-tab` · inline
- **3 data-attrs diferents** · `data-mode` · `data-tab` · `data-op-tab` · `data-cl-tab`
- **2 noms d'estat diferents** · `_mode` · `_activeTab`
- **URL param inconsistent** · uns suporten `?tab=X`, altres no

Conseqüència · cada vegada que un developer (humà o IA) afegeix submenú a una
vista nova, ha d'escollir convenció. Cost cognitiu acumulat per a usuaris i
mantenidors.

## 2 · Pattern canonical proposat (v133)

Component compartit · **`js/ui/SubmenuTabs.js`** · API ·

```js
import { renderSubmenuTabs } from '../ui/SubmenuTabs.js';

// HTML
container.innerHTML = renderSubmenuTabs({
    tabs: [
        { id: 'hub',          label: 'Hub',           icon: '🏠' },
        { id: 'map',          label: 'Map',           icon: '🗺' },
        { id: 'kanban',       label: 'Kanban',        icon: '📋' },
        { id: 'wallet',       label: 'Comptabilitat', icon: '💰' },
        { id: 'presentation', label: 'Presentation',  icon: '🎯' },
    ],
    dropdown: [
        { id: 'pacts',     label: 'Pactes (+ Legal agents)', icon: '📜' },
        { id: 'sprints',   label: 'Sprints',                 icon: '🚀' },
        { id: 'kb',        label: 'KB del projecte',          icon: '🧠' },
        { id: 'settings',  label: 'Settings',                 icon: '⚙' },
    ],
    activeId: this._mode,
    urlParam: 'tab',
});

// Bind
bindSubmenuTabs(container, (newId) => {
    this._mode = newId;
    this._render();
});
```

### Convencions canòniques (TODES les vistes han de seguir-les)

| Aspecte | Convenció |
|---|---|
| **State name** | `this._mode` (no `_activeTab` · més curt · neutre · igual a LearnView) |
| **data-attr** | `data-submenu-tab="<id>"` |
| **CSS class** | `.sos-submenu` (wrapper) · `.sos-submenu-tab` (botó) |
| **URL param** | `?tab=<id>` (lectura + escriptura via history.replaceState) |
| **Active state** | `aria-current="page"` + `.is-active` CSS class |
| **Dropdown** | `.sos-submenu-dropdown` + chevron `▾` + click outside tanca |
| **Keyboard** | ← → mou activeTab · Enter activa · Esc tanca dropdown |
| **Responsive** | Scroll horitzontal a <600px · dropdown agrupa tabs overflow |

### Style tokens · CSS variables compartides

```css
--sos-submenu-height:        44px;
--sos-submenu-tab-padding:   0 14px;
--sos-submenu-active-color:  var(--accent-indigo);
--sos-submenu-active-bg:     rgba(99, 102, 241, 0.12);
--sos-submenu-hover-bg:      var(--bg-elevated);
--sos-submenu-border-bottom: 2px solid var(--accent-indigo); /* active */
```

## 3 · Aplicació al Project Hub (consumidor #1)

Estructura proposada per `/project/:id` ·

```
┌────────────────────────────────────────────────────────────────┐
│ <Project name>                                  [edit] [share] │
├────────────────────────────────────────────────────────────────┤
│ 🏠 Hub  🗺 Map  📋 Kanban  💰 Comptabilitat  🎯 Presentation  ▾Més │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│             <render contextual segons tab activa>              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Tab 5 · Presentation · Arquitectura d'Informació precisa

```
┌─ Hero ────────────────────────────────────────────────────────┐
│ <Project name>                                                 │
│ <tagline · 1 línia>                                            │
│ <descripció breu · 2-3 línies>                                 │
└────────────────────────────────────────────────────────────────┘

┌─ Canvas · estructura ─────────────────────────────────────────┐
│ Segments     │  Value Props │  Channels   │ Revenue Streams   │
│ - segment 1  │  - vp 1      │  - canal 1  │  - revenue 1     │
│ - segment 2  │  - vp 2      │  - canal 2  │  - revenue 2     │
└────────────────────────────────────────────────────────────────┘

┌─ Pitch · narrativa ───────────────────────────────────────────┐
│ PROBLEM     · <text del pitch · seccio 1>                     │
│ SOLUTION    · <text del pitch · seccio 2>                     │
│ WHY NOW     · <text del pitch · seccio 3>                     │
│ TRACTION    · <text del pitch · seccio 4 si existeix>         │
└────────────────────────────────────────────────────────────────┘

┌─ Map preview ─────────────────────────────────────────────────┐
│ <snapshot castell · 6 nivells · roles · transactions count>   │
│                                          [Veure mapa complet →]│
└────────────────────────────────────────────────────────────────┘

┌─ CTA ─────────────────────────────────────────────────────────┐
│  [Contacta]  [Signa un pacte]  [Explora KB]                   │
└────────────────────────────────────────────────────────────────┘
```

### Tab 4 · Comptabilitat + Wallet (del projecte)

Unifica · `ValueAccountingView` (contribucions) + `Wallet` (saldo projecte) ·
una sola vista vertical · top = saldo + flow · bottom = ledger contribucions
+ filtre per membre.

### Dropdown "Més" · Pactes (amb Legal Agents)

Important · el doc generator amb legal agents avui viu com a vista standalone.
Migrar a ser una **subsecció DE PACTES** quan estem editant un pacte ·
"Genera document amb IA legal" → drawer/modal amb el flow legal-agents
actual. Reducció de soroll del menú principal.

## 4 · Mockup HTML interactiu

Fitxer · `docs/ux/v132i-mockup-project-hub-subtabs.html`

Característiques ·
- Self-contained · no depèn de SOS · obre directament al navegador
- Mostra · les 5 tabs + dropdown · tab Presentation amb IA completa
- Interactiu · click tabs canvia contingut · click dropdown obre i tanca
- Comparativa side-by-side · pattern actual (`.lv-tab`) vs pattern canonical
- 3 vistes simulades · 1) Project Hub Mocked · 2) Presentation tab close-up · 3) Audit table

Open · `open docs/ux/v132i-mockup-project-hub-subtabs.html` o servir via
`python3 -m http.server` i navegar.

## 5 · Decisions pendents per a @alvaro (manual validation)

| # | Pregunta | Recomanació | Si NO |
|---|---|---|---|
| 1 | State name `_mode` (com LearnView) o `_activeTab`? | **_mode** · més curt · neutre | Cal migrar LearnView (cost) |
| 2 | Mobile · scroll horitzontal o stacked? | **Scroll** · preserva visibilitat | Stacked = més alt |
| 3 | URL param sempre `?tab=X`? | **Sí** · sharable URLs | Estat es perd a reload |
| 4 | Dropdown · subsecció Pactes inclou Legal Agents drawer? | **Sí** · redueix soroll menú | Mantenir vista standalone /legal-agents |
| 5 | Presentation · seccions fixes o reorderables drag-drop? | **Fixes v133** · reorder v134 | Complexitat L → XL |
| 6 | Canvas section · 4 columns (BMC) o 9 (BMC complet)? | **4 columns** · més llegible mobile | 9 = més info |
| 7 | Pitch section · 4 seccions (P/S/W/T) o N config? | **4 fixes v133** · template v134 | Variabilitat = més work |

## 6 · Next steps · si valides aquesta proposta

1. **v132j** · implementar `js/ui/SubmenuTabs.js` (component pur · test isolated)
2. **v133-1** · migrar LearnView al component (regression-safe · zero canvi visual)
3. **v133-2** · refactor ProjectHubView → ProjectHubV2View amb 5 tabs
4. **v133-3** · implementar Presentation tab amb IA proposta
5. **v133-4** · doc generator legal-agents → subdrawer de Pactes
6. **v134** · auditar i migrar SettingsV2 / Opportunities / CreateLive / Notes

---

*Doc viu · v132i · 2026-05-17. Pendent validació @alvaro.*
