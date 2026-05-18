# v153 · Plan · Hub "Avui" + TimelineView upgrade

## Diagnosi · estat actual

### Hub `_zone2_Today` (post v150)
**Codi actual** (ProjectHubV2View.js:549) ·
```
🎯 Avui · {N} WOs · cash {€X}    → Kanban
[WO items minimal · title + priority + status]
ó "Cap WO pendent · crea'n una a Kanban"
```

**Limitacions** · Empty data view · no KPIs · no priorities visuals ·
no cash flow chart · no notifications · no due-dates · no upcoming actions.

### TimelineView (post v150)
**Estat** · Funcional · usa `buildFeed` canonical + `socialGraphService` ·
sidebar amb network stats + top followed · empty state amb CTAs ·
sort buttons custom (chrono / relevance).

**Limitacions** · TopBar custom (no canonical) · sort buttons no canonical
(podrien ser SubmenuTabs amb filter perspectives) · cap filtre per tipus
d'event (tots barrejats).

## Plan v153 · 2 movim

### Movim 1 · Hub "Avui" enriquit
KPIs · alerts · cash flow visual · upcoming actions.

| Bloc | Què mostra |
|---|---|
| KPI row | 4 cards · WOs avui · WOs completats setmana · cash setmana · alerts pendents |
| Top 3 WOs prioritaris | Click navega a /kanban?wo=ID · destaca high priority + due dates |
| Cash flow setmanal | Bar visual 7 dies · inflow verd · outflow vermell |
| Upcoming actions | Llistat · pacts to sign · invitacions pendents · quality alerts |

### Movim 2 · TimelineView upgrade
- Treure topbar custom (global nav suficient)
- Sort buttons → SubmenuTabs canonical (Cronològic · Rellevància)
- Afegir filtre perspectives · Tot · WOs · Pacts · Ledger · Network
- Verify event rendering · all 6 derivers (attestations · pacts · wos · ledger · invoices · proposals)

## Cost estimat
- Movim 1 · ~2h codi + tests
- Movim 2 · ~1.5h codi + tests
- Total · 1 sprint · ~50 asserts
