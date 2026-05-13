# Canonical Principles · TeamTowers SOS V11

*Operating principles · @alvaro 2026 · "anota estas claves y sigue con sprints evolucionados"*

These are the **four foundational invariants** every feature in SOS must respect. They guide architectural decisions and code review.

---

## 1️⃣ Tot són nodes (Mind-as-Graph)

Every artefact in SOS is a **typed KB node** with:
- Deterministic `id` (idempotent generators · `personalWalletIdFor`, `projectRegistryEntryIdFor`, `publicEntityIdFor`, `memberIdFor`, etc.)
- Explicit `type` from a closed catalog
- `content` field with whitelist-validated keys
- `keywords[]` for discovery/indexing
- `createdAt` + `updatedAt` timestamps
- **Zero side-effect intangible state** · if it exists in the system, it has a node

**Node types in production:**

| Type | Source service | Purpose |
|---|---|---|
| `user_identity` | identityService | DID + ECDSA P-256 keys |
| `matriu_member` | matriuMemberService | Cohort member profile |
| `cohort_seat` | cohortSeatService | Plaça Cohort 0 (108 total) |
| `swarm_assignment` | swarmMatchmaker | Member ↔ project link |
| `wallet` | walletService | Saldo + movements ledger |
| `value_contribution` | valueAccountingService | Slicing pie input |
| `receipt` | receiptService | Stripe topup invoice |
| `ai_audit` | aiFillService | IA generation cost + outcome |
| `workshop_unlock` | workshopRevenueService | 70/20/10 split record |
| `stripe_claim` | stripeService | Anti-double-spend lock |
| `stripe_connect_account` | stripeConnectService | Seller payout config |
| `subscription_plan` | stripeService | Pla (free/pro/coop/ent) |
| `distribution_rule` | distributionRuleService | 20/80 reserve/stakeholders |
| `public_registry_entry` | publicRegistryService | User permaweb profile |
| `public_project_entry` | publicProjectService | Project permaweb entry |
| `public_work_order_entry` | publicEntityService | WO permaweb entry |
| `public_market_item_entry` | publicEntityService | Market item permaweb |
| `public_workshop_entry` | publicEntityService | Workshop permaweb |
| `sop` | SopsView / roleSopGenerator | Standard Operating Procedure |
| `work_order` | KanbanView / woAssistant | Operational task |
| `role` / `transaction` | ValueMapView | Value map graph |
| `market_item` | marketService | Product/service offering |
| `workshop` | WorkshopsView | Educational session |
| `soc` | pactService | Standard Operating Charter |
| `efficiency_log` | EfficiencyView | Context pruning metrics |

---

## 2️⃣ Tota aportació de valor es comptabilitza

Every value movement creates an auditable record. Zero "hidden" transfers.

**Categories of value tracked:**

| Category | KB type(s) | Wallet impact |
|---|---|---|
| AI costs | `ai_audit` + wallet `consume` | Auto-debit project wallet (PR #28) |
| Permaweb publish | wallet `consume` movement | Debit project wallet |
| Workshop revenue | `workshop_unlock` + paired movements | 70/20/10 split → creator + project + cohort |
| Stripe topup | `receipt` + wallet `topup` | Credit project/personal wallet |
| Stripe Connect sale | (PENDING) `connect_sale` node | Buyer debit + seller credit + SOS platform fee 8% |
| Time contributions | `value_contribution` (type='time') | Slicing pie input · fairValueEur computed |
| Cash contributions | `value_contribution` (type='cash') | Slicing pie input |
| Stakeholder withdrawals | wallet `consume` + personal `topup` | Pool → personal |

**Invariant** · for every wallet `consume` there must be either:
- A counterparty `topup` on another wallet (transfers, splits, payouts), OR
- An audit log node referencing the operation (ai_audit for IA, permaweb entry for publish)

---

## 3️⃣ Stripe + stakeholders pool

When income arrives via Stripe (Connect product sale, workshop unlock, donation, etc.):

1. **Buyer side** · debit from buyer's wallet · `receipt` node generated
2. **Platform fee** · ex. 8% Stripe Connect platform fee · credit to SOS platform wallet
3. **Seller side** · `recordIncomeAndDistribute()` splits via `distribution_rule`:
   - **20% reserve** · stays in project wallet (operating buffer)
   - **80% stakeholders pool** · virtual subdivision · individual stakeholders compute their share via `computeStakeholdersPool()`
4. **Withdrawal** · stakeholder calls `withdrawClaim()` · project wallet `consume` → personal wallet `topup` · paired movements + claim receipt

This is the **slicing pie** distribution model · contribution-weighted ownership.

---

## 4️⃣ Stack tècnic clau

| Pillar | Where | Why |
|---|---|---|
| **IA** | `aiFillService` + `aiRouterService` + `aiProviderService` | Escalation chain · 5 providers · cost auditat + marge SOS |
| **Permaweb** | `publicRegistryService` + `publicProjectService` + `publicEntityService` | Persistència immutable + discovery via Arweave GraphQL · entries firmats ECDSA P-256 |
| **Triple-Entry Accounting (TEA)** | `valueAccountingService` + planned `attestationService` extensions | Cada transacció té · payer · receiver · attestation signada · evita doble comptabilitat |
| **Smart contracts** | Planned · Gnosis Safe integration | Multi-sig per a treasury · vesting · payouts atòmics |

---

## Sprint backlog aligned with principles

### High priority (next sprints)
- ✅ **PR-F (current)** · Stripe Connect platform fee tracking + workshop buyer receipt + TEA attestation hooks
- ⏳ Turbo upload real for secondary entities (sprint A is mock-first)
- ⏳ Triple-entry validation · every wallet movement must have payer/receiver attestation
- ⏳ Stripe Connect product · sub-account record `connect_sale` node when buyer pays seller

### Medium priority
- ⏳ Smart contract integration · Gnosis Safe per project (multi-sig treasury)
- ⏳ Subscription billing · recurring Pro/Coop plan via Stripe (currently manual topup)
- ⏳ Cross-device permaweb sync · resolve signature placement issues

### Foundational (long-term)
- ⏳ Web of Trust scoring · weighted attestations between members
- ⏳ ZK proofs · zero-knowledge attestations for privacy-preserving wallets
- ⏳ Cooperative governance · DAO-like voting via signed attestations

---

## Codi · constants canòniques

Vegeu `js/core/canonicalPrinciples.js` per a les constants exportades (CANONICAL_NODE_TYPES, VALUE_CATEGORIES, etc.) que serveixen com a font de veritat per a validacions a tot el codebase.

---

*Doc viu · evoluciona amb cada sprint. Última actualització · sprint PR-F · 2026.*
