# Wallet · Pacts · Notary · Agents legals · v124 plan

> Disseny UX + agents.md per accelerar la incubadora · KISS · DRY · Antigravity.

## Diagnòstic actual

### `/wallet?project=X` · què hi ha
- Saldo del projecte + topups manual (Stripe en sprint C2)
- Ledger de moviments (topup · consume · refund · adjustment)
- Transferències entre wallets (FUND-FLOW)
- Registre d'ingressos amb auto-split (operating reserve · stakeholders pool)
- Comptabilitat unificada agregada per `unifiedAccountingService`

### `/pact?project=X` · què hi ha
- Builder 7-clàusules · slicing-pie · vesting · decisions · exit · conflict · sunset
- Markdown preview + firma ECDSA P-256 via `signPactWithKey`
- `pactService.verifyPactSignature` per validar integritat

### `publicRegistryService.publishToPermaweb` · ja existeix
- Verifica firma → descompta del wallet del projecte → upload via Turbo → txId persistent
- MOCK mode per a tests sense gastar

### Què NO existeix encara
1. **Pont visual `pact ↔ wallet`** · viuen aïllats · l'usuari no veu que el pacte determina la distribució de la tarta dins el wallet
2. **Notarització UI del pacte** · firma funciona, però no hi ha botó "🌐 Notaritzar al permaweb" amb txId visible
3. **Smart contracts locals** · clàusules NO executen res automàtic (cliff vesting · exit triggers · capital calls)
4. **Plantilles d'agreements legals** · només pacte de socis · l'incubadora necessita NDA · advisor · service · IP · equity grant · term sheet · LOI · etc.

## v124 · Què entreguem aquesta nit

### B · Integració UX `/wallet` ↔ `/pact`
- **Wallet · panel "📜 Pacte vigent"** · estat · socis · vesting · botó "Veure pacte" · saldo distribuït per soci segons slicing actual
- **Pact · panel "💼 Wallet del projecte"** · saldo · capital líquid · ingressos acumulats · "Veure wallet"
- **Pact · botó "🌐 Notaritzar al permaweb"** · descompta fee · txId · timestamp · pinned al pact

### C · agents/legal/*.md · plantilles d'agreements
10 agents nous a `agents/legal/` per a generar documents amb IA · cada un amb frontmatter (tier · routing · cost) + body (rol · context · tasca · output schema · restriccions ètiques) ·

| Agent | Cas d'ús | Tier |
|---|---|---|
| `pact-de-socis` | Pacte fundacional projecte · slicing-pie + vesting | mid |
| `nda-mutual` | NDA entre 2-N partits abans de compartir info | small |
| `service-agreement` | Contracte de prestació de serveis · DTD test | mid |
| `incubator-membership` | Acord d'admissió a la incubadora SOS | mid |
| `accelerator-cohort` | Cohort accelerador · 12-setmanes · KPIs | mid |
| `advisor-agreement` | Asesor · equity vs honoraris · scope · termini | small |
| `equity-grant` | Grant d'equity / phantom equity · vesting | mid |
| `letter-of-intent` | LOI · pre-term-sheet · no vinculant | small |
| `term-sheet` | Term sheet inversor → projecte · vinculant | reasoner |
| `ip-assignment` | Cessió IP del contributor al projecte | small |

Cada agent · entrada simple (parts · objecte · termes · jurisdicció) · output JSON estructurat amb clàusules numerades llestes per renderitzar a `.md` notaritzable.

### D · `agents/AGENTS.md` actualitzat
Nova secció "Agents legals" · convenció `agents/legal/<id>.md` · paritat amb un nou registre `LEGAL_AGENTS_CATALOG` a `js/core/legalAgentsCatalog.js`.

### E · Tests TDD
- `legalAgentsCatalog.test.js` · 10 agents existeixen + frontmatter vàlid + tier alineat
- `walletPactBridge.test.js` · `/wallet` mostra pacte vigent · `/pact` mostra wallet
- `pactNotaryFlow.test.js` · botó notaritza · publishToPermaweb · txId visible

## Roadmap proper (no inclós a v124)

- Smart contract local · auto-tick de vesting cliff · exit auto-trigger
- Agent runner · `/agreements?type=X` → IA genera document · prompt-debug per revisar
- DAO governance · multisig executable des del pacte
- Tarta dinàmica amb dades reals (avui mock)

## KISS commitment

No re-arquitecturem res. Reutilitzem:
- `signPactWithKey` (ja ECDSA P-256)
- `publishToPermaweb` (ja Turbo upload + wallet debit + refund-on-fail)
- `agentMdLoader` (parser v122)
- `promptTierRouter` (tier mapping v122)

Afegim **3 fitxers de UI** (botons + panels) + **10 .md agents** + **1 catàleg** + **3 tests**. Total < 1500 LOC.
