# Slicing Pie · Mike Moyer · model tokenòmic canonical de SOS V11

> Knowledge canonical · `knowledge/vision/slicing-pie-mike-moyer.md`
> Font · Mike Moyer · llibre "Slicing Pie · Funding Your Company Without Funds"
> (2012) · website slicingpie.com · TimeFounder framework

## Per què Slicing Pie

Mike Moyer va observar que els acords d'equity entre fundadors d'una startup
gairebé sempre acaben **injustos** perquè ·

1. Es decideixen **abans** de saber qui realment treballarà i quant
2. Es fixen en **percentatges estàtics** (ex. 60/40) que no s'ajusten als canvis reals
3. No diferencien entre **tipus de contribució** (cash, hores, IP, equipament)
4. No reflecteixen el **risc real** que assumeix cada aportador

**Slicing Pie** resol això · cada aportació es converteix a "slices" segons
un **multiplicador de risc** · la tarta es divideix proporcionalment ·
**dinàmicament** · fins el dia de tancament (`Recoupment Day`).

## Multiplicadors canonical Moyer

| Aportació | Multiplicador | Raonament |
|---|---:|---|
| **Cash** | ×4 | Risc màxim · diners líquids · pèrdua total possible |
| **Hores no pagades** | ×2 | Risc alt · cost d'oportunitat (no cobrar nòmina) |
| **Equipament cedit** | ×2 | Risc mig-alt · pèrdua de l'actiu si fracassa |
| **IP / patents** | ×2-4 | Variable · segons exclusivitat i validació prèvia |
| **Idees** | ×0 | NO genera slices · idees sense execució = res |
| **Acords contractuals** | depèn | Compromisos en ferm cobren slices a l'execució |

Fórmula bàsica · `slices_aportació = valor_FMV × multiplicador_risc`

On `valor_FMV` per a hores = `2 × salari_anual_FMV / hores_per_any`.

## Concepts clau

### Fair Market Value (FMV)

Cada hora té un valor de mercat realista. **No és el que cobres** · és el que
**cobraries al mercat obert** pel mateix treball. Senior dev → ~75-100€/h FMV ·
Junior → ~30-45€/h. SOS V11 té catàleg sectorial canonical (`sectorRoleCatalog.js`
+ sector .md `fmv_usd_h` per rol).

### Recoupment Day

Moment en què la startup és **viable** (té revenue o funding suficient per pagar
salaris al FMV). A partir d'aquí ·
- Les hores comencen a pagar-se en cash (multiplicador baixa de ×2 a ×1)
- Les aportacions noves segueixen comptant però amb el risc reduït
- La tarta es **congela** legalment via cap table tradicional (acord pacte de socis)

### Dilution

Si l'usuari surt abans del Recoupment Day · es **diluteix** segons les regles
del pacte. Mai pot quedar-se amb una porció major que la seva contribució real
proporcional. Això evita el problema del "fundador absent que es queda 40%".

## Extensió SOS V11 · "Phase Multipliers" (proposta @alvaro)

Mike Moyer no diferencia entre fases del projecte (pre-seed · MVP · validation ·
scale). Però @alvaro proposa una **extensió tokenomical** ·

| Fase projecte | Phase multiplier | Justificació |
|---|---:|---|
| **idea / pre-seed** | ×1.5 | Risc màxim · zero validació · pioner del concepte |
| **MVP** | ×1.3 | Construcció primer prototip · alt risc tècnic |
| **validation** | ×1.1 | Early signals + churn risk · risc mig |
| **scale** | ×1.0 | Producte validat · risc executiu · multiplicador base |
| **mature** | ×0.8 | Bé establit · contribuir aquí és menys arriscat |

`slices_total = valor_FMV × multiplicador_risc × phase_multiplier`

Exemple · 100h treball mid-tier (50€/h FMV) a fase MVP per a un senior →
`100 × 50 × 2 × 1.3 = 13.000 slices`

A fase scale · mateix treball → `100 × 50 × 2 × 1.0 = 10.000 slices`

### Contribution type extensions

Multiplicadors específics SOS V11 (afegits al canonical Moyer) ·

| Contribució | Multiplicador SOS | Notes |
|---|---:|---|
| **Saldo a wallet (cash)** | ×4 (canonical Moyer) | Diners aportats al wallet del projecte |
| **Hores no pagades** | ×2 (canonical Moyer) | Treball + cost d'oportunitat |
| **Alfa tester saldo (@alvaro)** | ×4 × **bonus alfa** | Saldo del bossillo personal d'@alvaro per a alfa testers · compta com a aportació de valor al projecte ajudat amb el **multiplier alfa** del propi @alvaro (bonus addicional) |
| **Mentoring · advisor hours** | ×1.5 | Hores d'expert · sense compromís continu |
| **Intro a inversor que tanca** | ×3 | High-value · success-fee style |
| **Permaweb anchoring cost** | ×1 | Cost real publicació · sense risk premium |
| **API consum (proxy IA SOS)** | ×0.8 | Cost operatiu · sense risc · si l'usuari paga el seu propi proxy = 0 |

## Decisions canonical SOS V11

1. **Slicing Pie és el model per defecte** als pactes generats a `/pact?project=X`
2. **Phase multipliers** s'apliquen al `valueAccountingService.calculateSlices()` (v131c+)
3. **Recoupment Day** es marca al pacte amb un `exit.trigger` específic ("revenue ≥ €X" o "funding raised ≥ €Y")
4. **Alfa multiplier @alvaro** · documentat aquí · permet que l'aportació de saldo d'@alvaro al projecte ajudat compti com a "contribució amb bonus alfa" (×1.5 sobre el canonical Moyer ×4 = ×6 efectiu) durant alfa
5. **Multi-modal pies (FairShares)** opcional · els projectes amb 3-4 pies de stakeholders poden activar el mode hybrid

## Referències bibliogràfiques

- Moyer, Mike (2012). *Slicing Pie · Funding Your Company Without Funds*. Lake Shark Ventures.
- Moyer, Mike (2014). *Will Work for Pie · Negotiating Pay Through Slicing Pie*. ed. 2.
- Moyer, Mike (2016). *Slicing Pie Handbook*. ed. ampliada.
- Web · slicingpie.com · pizza pie calculator + community forums
- Comparable · FairShares Association · Ridley-Duff, R. (2018). *FairShares Model · Co-operative Economic Theory*

## Implementació actual SOS V11

| Capa | Arxiu | Status |
|---|---|---|
| Constants multiplicadors canonical | `js/core/valueAccountingService.js` `SLICING_PIE_MULTIPLIERS` | ✅ v11.1 |
| Fórmula `fairValueForTime` | `js/core/valueAccountingService.js` | ✅ v11.1 |
| `calculateSlices(contributions)` | `js/core/valueAccountingService.js` | ✅ v11.1 |
| Phase multipliers | `js/core/valueAccountingService.js` | 🟡 PENDENT v141+ |
| Alfa bonus @alvaro | knowledge canonical aquí | 🟡 PENDENT integrar a tokenomics |
| UI explicació al `/value-accounting` | view actual | 🟡 PENDENT v134 |

## Glossari

| Terme | Significat |
|---|---|
| **Slice** | Unitat mínima de contribució. 1 slice ≈ 1€ de valor justificat aportat. |
| **Pie** | Categoria de stakeholders (founders · employees · investors · advisors). |
| **Recoupment** | Moment en què cash retorna i risc baixa. |
| **Dilution** | Reducció proporcional quan algú surt abans del Recoupment. |
| **Phase multiplier** | Extensió SOS V11 · multiplicador segons fase del projecte. |
| **Alfa bonus** | Multiplier addicional per a contribucions d'alfa testers durant pre-alpha · alpha. |

---

*Doc canonical · creat 2026-05-19 com a referència autoritativa de Slicing Pie a SOS V11.
Aquesta doc forma part de `knowledge/vision/` i és consumible pel `KnowledgeLoader` per a
injectar a prompts d'agents de tokenomics.*
