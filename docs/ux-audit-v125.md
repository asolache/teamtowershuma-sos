# UX Audit · TeamTowers SOS V11 · v125

> Audit de les 53 views per detectar inconsistències i preparar standardització.

## Findings · 5 patrons no-estàndard detectats

### 1. Topbar per-view · 14 implementacions diferents

Cada view defineix la seva pròpia barra superior (`.w-topbar` · `.pb-topbar` ·
`.ac-topbar` · `.np-topbar` · `.sv2-topbar` · etc.) amb CSS gairebé idèntic ·
petites variacions (padding · gap · min-height · flex-wrap).

**Consequence** · 14× duplicació CSS · canvi global (ex. nou link · color tema)
requereix tocar 14 fitxers · risc d'oblidar-ne algun.

**Fix v125** · crear `js/core/sosTopbar.js` amb `renderViewTopbar({ icon, title,
projectId, contextLinks[] })` · CSS injectat una sola vegada · views poden
migrar gradualment (no breaking).

### 2. Search trigger · floating mal col·locat

Era `position: fixed; top:12px; right:80px;` · xocava amb pills navbar i amb
els controls de cada view (ex. `/map` "Animar flujo" overlap).

**Fix v125 (FET)** · search ara és una pill dins la navbar
(`.sos-global-nav-search`) · visible a totes les pantalles · mobile = icona ·
desktop = "🔍 Cerca ⌘K" · keyboard ⌘K / `/` continua funcionant igual.

### 3. Botons primaris · 4 estils diferents

- `.w-btn-primary` (verd) · WalletView
- `.pb-btn` (lilà) · PactBuilderView
- `.cl-btn-primary` (indigo) · CreateLiveView
- `<button>` natiu · vàries views legacy

**Recomanació backlog v126** · unificar a `.sos-btn-primary` amb 3 colors
contextuals (accent-green per money · accent-purple per legal · accent-indigo
per actions general) com a tokens DS.

### 4. Empty states · 6 patrons diferents

- "No hi ha res a mostrar" (text pla)
- Card amb icona gran + CTA
- Dashed border amb hint
- Stats-grid amb "0" tot a zero
- Skeleton amb shimmer
- Sense empty state (només llista buida)

**Recomanació backlog v126** · `sosEmptyState({ icon, title, hint, cta })`
component canonical.

### 5. Loading states · inconsistents

Algunes views diuen "Carregant…" altres `⏳` altres skeleton-shimmer altres
spinner CSS · sense pattern.

**Recomanació backlog v126** · `sosLoading({ kind: 'inline'|'skeleton'|'spinner' })`.

## Plan v125 (entregables aquesta nit)

| Sprint | Què | Status |
|---|---|---|
| A | Search → navbar pill (responsive) | ✓ FET |
| B | `sosTopbar.js` component + opt-in helper | ✓ FET |
| C | Backend stripe + crypto top-up backend prep | en curs |
| D | Tests d'estabilitat + paritat | en curs |

## Recomanacions per a v126 (no inclós ara)

1. Migrar 14 views a `sosTopbar` (1-2 sprints) · feature flag per a rollback fàcil
2. Component `sosEmptyState` + `sosLoading`
3. Tokens de buttons unificats al DS
4. Mòbil-first audit · revisar les 53 views a 360px width
5. Accessibilitat · TAB order · ARIA labels · contrast ratios

## KISS commitment

No re-arquitecturem · només afegim un nou helper que **co-existeix** amb les
14 implementacions actuals. Les views poden migrar quan tinguin un sprint
disponible · zero pressió, zero breaking.
