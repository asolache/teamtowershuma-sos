# Audit · vistes per a fusió/eliminació v152

> Inventari de candidates a fusió i vistes obsoletes detectades. Mostra
> redundàncies + propostes concretes.

## Vistes obsoletes · eliminables (4)

| Vista | Status | Acció proposada |
|---|---|---|
| **ProjectHubV3PreviewView** | preview validat post v150 · ProjectHubV2 ja té el layout final | Eliminar fitxer + ruta · `wo-project-hub-ia-aligned` ja DONE |
| **WalletView** (V1 legacy) | redirigit a `/wallet/v2` (v143) · cap consumer extern | Eliminar fitxer · ruta segueix amb redirect canonical |
| **AccountingView** (V1 legacy) | redirigit a `/accounting/v2` (v144) · cap consumer extern | Eliminar fitxer · ruta segueix amb redirect canonical |
| **MobileMockupView** | Demo · no usada en producció · ja té submenu canonical (v151) | Conservar · útil per a UX mockup demo |

## Vistes duplicades · candidates a unificar (3)

| Vistes | Solapament | Proposta |
|---|---|---|
| **TagsView · FoldersView · MindGraphView** | Totes ja viuen com a tabs DINS de LearnView (tab=tags · tab=folders · tab=mind) | Eliminar fitxers standalone · ja són tabs · -3 vistes |
| **SectorsView** | Ja és tab DINS de LearnView (tab=sectors) | Eliminar fitxer standalone · 1 vista |
| **MatriuLandingView · MatriuNetworkView** | Conceptes similars (landing + network del Matriu) · podrien ser tabs d'una sola vista | Conservar 2 (purposes diferents) |

## Vistes "single-purpose" · CORRECTAMENT separades (no fusionar)

ValueMapView · KanbanView · CanvasView · SopsView · PactBuilderView · etc.
Cada una és una vista DOMINI · fusionar-les seria sobre-engineering.

## Total impacte fusió

- **4 vistes obsoletes eliminables** (V1 wallet/accounting · V3 preview · `wo-project-hub-subtabs` SUPERSEDED tags)
- **4 vistes redundants amb tabs LearnView** (Tags · Folders · Mind · Sectors)
- **TOTAL · 8 vistes eliminables** · 57 → 49

## Roadmap d'execució

Sprint v152 fa neteja segura (només `learn-skills` nav + HomeView CTA + audit doc).
Sprint v153+ pot fer les eliminacions reals · cal verificar zero consumers externs.

---

*Audit v152 · 2026-05-21*
