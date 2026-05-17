# Wallet v2 + Accounting integració · Pla d'anàlisi + UX/design total (v128+)

> Mode analista · diagnòstic complet · pla d'implementació estratificat · 4 fases.

## TL;DR · què canvia

1. **`/learn?tab=skills` eliminat** · era un landing duplicat de `/skills` · removed.
2. **`/wallet` migra a v2** · 6 pestanyes (Saldo · Compres · Transaccions · Projectes · Comptabilitat · Cripto/Stripe).
3. **Integració amb `/value-accounting`** · convertim VA en una vista contable del projecte que viu DINS de Wallet v2 quan hi ha projecte actiu.
4. **Multi-wallet dashboard** · veure tots els wallets dels meus projectes en una sola vista · drill-down a cada un.
5. **Transaccions filtrables** · per tipus · projecte · període · estat · cost-center.

---

## 1. Diagnòstic actual · què tenim avui

### Vistes finanseres existents

| View | Ruta | Què mostra | Estat |
|---|---|---|---|
| **WalletView** | `/wallet?project=X` | Saldo + topups + ledger + sec. ingrés + transfer + ajust + comptabilitat unificada | 757 LOC · funcional · disseny dispers (8 seccions sense jerarquia) |
| **ValueAccountingView** | `/value-accounting?project=X` | Slicing pie + pies + targets + memberships | 870 LOC · centrat en equity, no en cash |
| **AccountingView** | `/accounting` | (poc usat · sembla un dashboard genèric) | 431 LOC · candidat a deprecació |
| **InvoiceView** | `/invoice` | Factures emeses/rebudes | OK · no toca v128 |

### Serveis backend disponibles (sòlid base)

- `walletService.js` · saldo · topup · consume · refund · adjust · stats (533 LOC)
- `stripeService.js` · payment links + custom Checkout Session (`createCheckoutSession`) + claim idempotency (389 LOC) — **v125**
- `cryptoTopupService.js` · 8 tokens · 3 chains · quote · intents · confirm (321 LOC) — **v125**
- `unifiedAccountingService.js` · agregador multi-wallet + receipts + AI audits + workshop unlocks (175 LOC)
- `valueAccountingService.js` · slicing pie · targets · membership · pies (443 LOC)

### Què està fet (no començar de zero)

✅ Backend Stripe + crypto **complet** (sprint v125)
✅ Multi-wallet aggregator (`aggregateMovementsForOwner`) ja resol "totes les meves transaccions"
✅ Movements per categoria + kind agregació
✅ Triple-entry (wallet · receipts · ledger) lligats
✅ Bridge Wallet↔Pact (panel pacte vigent) — **v124**

### Què falta o no funciona bé

❌ **`/wallet`** UI dispersa · 8 seccions seguides sense pestanyes · scroll infinit
❌ **No hi ha visualització** dels wallets dels MEUS PROJECTES com a llistat seleccionable
❌ **No hi ha filtres** a transaccions (per type · projecte · període · estat)
❌ **Stripe custom amount UI** · el backend existeix (`createCheckoutSession`) però no hi ha botó
❌ **Crypto top-up UI** · el backend existeix (`cryptoTopupService`) però no hi ha panel
❌ **`/value-accounting`** viu aïllada · l'usuari no veu la relació tarta ↔ cash al wallet
❌ **`/learn?tab=skills`** redundant · només duplica `/skills`

---

## 2. Resposta a les preguntes clau

### Q1 · té sentit que `/wallet` mostri accés als wallets dels meus projectes?

**SÍ · totalment**. És el cas d'ús més freqüent ·
- Power user té 3-7 projectes · cada un amb el seu wallet
- Avui ha d'anar a `/projects → escollir projecte → /wallet?project=X` per cada un
- Amb pestanya "Projectes" al wallet v2 · 1 click per pivotar entre wallets
- Comptabilitat unificada ja l'agrega · només cal exposar el llistat com a clickable

### Q2 · té sentit unir `/wallet` + `/value-accounting`?

**Parcialment SÍ · com a pestanya, no com a substitució**.
- `/value-accounting` té concepte propi (slicing pie · equity dinàmic) molt diferent del cash flow
- Però **mostrar-la com a pestanya dins `/wallet?project=X`** dóna context · "aquí veus el cash · aquí veus la tarta"
- La ruta `/value-accounting?project=X` segueix funcionant (deeplink)
- Wallet v2 inclou una pestanya "🥧 Tarta" que carrega `ValueAccountingView` inline o redirigeix

### Q3 · té sentit la integració total accounting + finances?

**SÍ · però respectant els 2 nivells** ·

| Nivell | Quina pregunta respon | View |
|---|---|---|
| **Cash flow** (operatiu) | Quants € tinc · què s'ha gastat · qui em deu | `/wallet` v2 |
| **Equity / valor** (estratègic) | Qui té quin tros del projecte · quin esforç val | `/value-accounting` |

Els 2 viuen junts amb un toggle clarament marcat. Mateixa estètica (color, tokens) · contextos diferents.

---

## 3. UX/design plan · `/wallet` v2

### Arquitectura · 6 pestanyes + topbar

```
┌─────────────────────────────────────────────────────────┐
│ 🗼 SOS · 💰 Wallet · proj-X    [Personal | Proj-X | ...] │  ← topbar amb selector wallet actiu
├─────────────────────────────────────────────────────────┤
│ 💰 Saldo  📊 Transaccions  🛒 Compres  🥧 Tarta  📁 Projectes  ⚙ Top-up │  ← pestanyes
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [contingut de la pestanya activa]                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Pestanya 1 · **💰 Saldo** (default)

- Hero · balance gran + delta 30d + stats (recàrregues · consumit · refunds)
- 4 KPIs · saldo · ingressos mes · despesa mes · runway (mesos al ritme actual)
- Graf · barres últims 30 dies (income vs expense)
- Quick actions · "+ Recarregar amb Stripe" · "₿ Top-up crypto" · "↗ Transferir"
- Panel "📜 Pacte vigent" (ja existeix de v124) si projectId

### Pestanya 2 · **📊 Transaccions** (la important per a l'usuari)

```
Filtres ·
[Tipus ▾]  [Projecte ▾]  [Període ▾]  [Estat ▾]  [Cercar text]  [Exportar CSV]

Resum visible ·  X moviments · +Y€ · -Z€ · = NetW€

┌────────────┬──────────┬─────────┬────────────────┬──────────┬───────┐
│ Data       │ Tipus    │ Projecte│ Descripció      │ €        │ Estat │
├────────────┼──────────┼─────────┼────────────────┼──────────┼───────┤
│ 17/05 10:23│ topup    │ proj-x  │ Recàrrega 50€  │ +50.00   │ ✓     │
│ 17/05 09:01│ consume  │ proj-x  │ IA · gpt-4o    │  -0.23   │ ✓     │
│ ...        │ ...      │ ...     │ ...            │ ...      │ ...   │
└────────────┴──────────┴─────────┴────────────────┴──────────┴───────┘

Paginació · 50 per pàgina · scroll infinit · click row → detall modal
```

Filtres ·
- **Tipus** · topup · consume · refund · adjustment · transfer-in · transfer-out · income · crypto-deposit · stripe-purchase
- **Projecte** · tots / personal / proj-A / proj-B / ...
- **Període** · avui · 7d · 30d · 90d · any · custom range
- **Estat** · confirmat · pendent · fallit · expirat (per crypto intents)
- **Buscar text** · per descripció / ref

### Pestanya 3 · **🛒 Compres**

Sub-vista de transaccions · només topups (Stripe + crypto) · per a tracking de "què he pagat per recarregar" ·
- Llista cronològica · proveïdor · amount · estat · fee · TxId/SessionId · link de comprovant
- Stripe · session id + factura PDF (si disponible)
- Crypto · txHash + blockchain explorer link
- Total YTD · stats per provider

### Pestanya 4 · **🥧 Tarta** (només si projectId actiu)

Embed o redirect a `/value-accounting?project=X` ·
- Decisió arquitectural · embed via `getHtml()` reusing ValueAccountingView (KISS · menys duplicació)
- Header curt · "Aquesta és la tarta del projecte · cada hora invertida = slices · cada euro reinvertit = slices"
- Acció clau · "Editar targets" + "Veure historia de canvis"

### Pestanya 5 · **📁 Projectes** (multi-wallet dashboard)

```
Els meus wallets ·
  ┌──────────────────────────────────┐  ┌──────────────────────────────────┐
  │ 💰 Personal              152.30€ │  │ 🏢 Lleida FC             50.00€ │
  │ 8 moviments aquest mes           │  │ 23 moviments aquest mes          │
  │ runway ~ 32 mesos                │  │ runway ~ 4 mesos                 │
  │ [Entrar al wallet →]             │  │ [Entrar al wallet →]             │
  └──────────────────────────────────┘  └──────────────────────────────────┘
  ┌──────────────────────────────────┐  ┌──────────────────────────────────┐
  │ 🏢 SOS Cooperativa       12.40€ │  │ + Crear nou projecte             │
  │ 5 moviments aquest mes           │  │   amb el seu wallet              │
  │ ⚠ saldo baix                     │  │                                  │
  │ [Recarregar ràpid +25€]          │  │                                  │
  └──────────────────────────────────┘  └──────────────────────────────────┘

Total agregat · 214.70€ · runway global ~ 18 mesos
```

### Pestanya 6 · **⚙ Top-up** (compra de saldo · Stripe + Crypto)

Sub-pestanyes ·
- **💳 Stripe** · 4 presets (10/25/50/100€) + input custom amount → `createCheckoutSession` → window.open URL
- **₿ Crypto stables** · escull token (USDC-Polygon · USDC-Gnosis · USDT · DAI · xDAI) + amount → genera deposit intent + mostra QR + watch pending
- **🪙 Crypto convertible** · ETH · WBTC · MATIC → mostra preu + quote real-time + warning gas + recomanació de fer swap a USDC abans
- **↗ Transferir** · entre wallets propis · saldo intern (ja existeix · només millor UI)

---

## 4. Pla d'implementació · 4 fases (sprints v128 → v131)

### **Sprint v128** · neteja + scaffold v2 (1 dia · low risk)

- [ ] Eliminar `/learn?tab=skills` · treure de `VALID_MODES` · treure tab button · treure `_renderSkillsTab()`
- [ ] `WalletV2View.js` nou · scaffold amb 6 pestanyes (només esquelet · contingut = "TODO v129")
- [ ] Router · `/wallet/v2` (nou · paral·lel · feature flag) o `/wallet?ui=v2`
- [ ] `WalletView.js` actual segueix funcionant fins migració completa
- [ ] Tests · `walletV2Scaffold.test.js` · pestanyes presents · routing OK

### **Sprint v129** · pestanyes Saldo + Transaccions + Projectes (2-3 dies · core value)

- [ ] **Saldo** · hero + 4 KPIs + graf 30d + quick actions (botons enllaçats a pestanya Top-up)
- [ ] **Transaccions** · filtres · taula · paginació · export CSV
- [ ] **Projectes** · grid de cards multi-wallet · drill-down click
- [ ] Reuse `unifiedAccountingService` per al càlcul · NO duplicar lògica
- [ ] Tests · filtres · sort · paginació · export

### **Sprint v130** · pestanyes Top-up Stripe + Crypto (UI sobre backend v125)

- [ ] **Top-up · Stripe** · presets + custom amount input · crida `createCheckoutSession` · obre URL · post-return verify (`verifyStripeSession`)
- [ ] **Top-up · Crypto stables** · selector token · amount · botó "Generar deposit intent" → mostra address + QR + amount exacte
- [ ] **Top-up · Crypto convertible** · price fetcher · quote viva · gas warning
- [ ] Watch pending intents · refresh cada 30s · estat 'expired' visible
- [ ] Tests · UI flow + handlers + happy path mock

### **Sprint v131** · pestanya Tarta + comptabilitat unificada polida (integració)

- [ ] **Tarta** · embed `/value-accounting` inline · header contextual · link "obrir vista completa"
- [ ] **Compres** · sub-vista de transaccions filtrada a topups · links comprovant
- [ ] Migració · `/wallet` redirigeix a `/wallet/v2` per defecte · vell accessible amb `?ui=legacy`
- [ ] Tests d'integració · navegació entre pestanyes · estat persistent
- [ ] Eliminar `AccountingView.js` (substituït per pestanya Transaccions)

---

## 5. Tokens DS · disseny visual

Reutilitzem la `sosTopbar` canonical de v125. Tokens nous ·

```css
/* Wallet v2 · color-coded per categoria */
--wallet-income:    #22c55e   /* topup · refund · income · positiu */
--wallet-expense:   #ef4444   /* consume · expense · negatiu */
--wallet-transfer:  #6366f1   /* transfer intern · neutral */
--wallet-pending:   #fbbf24   /* intent pending · waiting */
--wallet-failed:    #94a3b8   /* expired · failed · gray */
--wallet-equity:    #c084fc   /* slicing pie · valor intangible */
```

Pestanyes · estil Linear · pill-style amb count badges quan rellevant ·
`[💰 Saldo] [📊 Transaccions · 142] [🛒 Compres · 5] [🥧 Tarta] [📁 Projectes · 4] [⚙ Top-up]`

Mobile · pestanyes scrollables horitzontalment · contingut single-column · KPIs en columna.

---

## 6. Diagrama de relació · vistes finanseres

```
              ┌─────────────────────────┐
              │   /wallet · v2          │  ← Hub central · 6 pestanyes
              │   (cash flow + multi)   │
              └───────┬─────────────────┘
                      │
       ┌──────────────┼─────────────────┐
       │              │                 │
       ▼              ▼                 ▼
  [Saldo]         [Tarta]            [Top-up]
  cash KPIs       /value-accounting   Stripe + Crypto
                  embed
                      │
                      └──→ /value-accounting?project=X (deeplink complet)

  [Transaccions] [Compres] [Projectes]
       │           │          │
       └───────────┴──────────┘
       │
       └─→ unifiedAccountingService.aggregateMovementsForOwner
           ─→ walletService.movements + receipts + aiAudits

  /accounting (DEPRECAT · redirect a /wallet/v2)
  /invoice (manté · sub-domini facturació · vendable a tercers)
```

---

## 7. Q&A · decisions arquitectòniques

### Q · per què mantenir `/value-accounting` separat?
**A** · té lògica pròpia (slicing pie · targets · membership) que NO és cash flow. Embedding al wallet v2 dóna proximitat sense fusionar dos conceptes diferents.

### Q · per què 6 pestanyes i no 3?
**A** · cada pestanya respon a UNA pregunta específica del power user · pas a pas usable amb keyboard (←/→). 3 mega-pestanyes apilarien massa info per pestanya.

### Q · si /wallet ja té projectId, com gestiono pestanya Projectes?
**A** · sempre mostra TOTS els wallets propis (personal + projectes) · la "Tarta" només existeix si l'actiu té projectId. Selector al topbar canvia el wallet actiu.

### Q · cripto convertible val la pena la UX complexa?
**A** · MVP v130 = només stables (USDC/USDT/DAI/xDAI). Convertibles entren a v131 si hi ha demanda real (mètrica · clicks al botó "Crypto convertible" pendents).

### Q · /learn?tab=skills no podem deixar-la com a stub?
**A** · NO. Cada tab té un cost cognitiu. La supressió neta és millor que un redirect mut.

---

## 8. Mètrica d'èxit · 30 dies post-v131

- **Adopció `/wallet/v2`** · 80% del trànsit (legacy fallback < 20%)
- **% Stripe topups** vs manual · objectiu 60%
- **% crypto topups** vs Stripe · objectiu 15% (creixement mes a mes)
- **Time-to-recharge** · < 60 segons des de click "Recarregar" fins saldo actualitzat
- **Transactions filter usage** · ≥ 40% dels usuaris obre filtres en cada sessió

---

## 9. KISS commitment

Reutilitzem ·
- `sosTopbar` (v125)
- `walletService` (existent)
- `stripeService.createCheckoutSession` (v125)
- `cryptoTopupService` (v125)
- `unifiedAccountingService` (existent)
- `valueAccountingService` (existent · embed)

Afegim ·
- 1 view nou (`WalletV2View.js`) · 6 pestanyes
- 1 component (`TransactionsTable.js`) · pure render + filters
- 1 component (`WalletProjectCard.js`) · multi-wallet grid

Treiem ·
- Tab Skills de `LearnView`
- `AccountingView` (deprecat post-v131)

Total · ~1500 LOC nous · ~600 LOC deletats · net delta < 1000 LOC. Migració gradual sense breaking.
