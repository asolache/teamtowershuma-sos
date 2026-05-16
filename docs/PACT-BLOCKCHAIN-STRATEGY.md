# PACT · Blockchain Strategy · Decision Tree

**Status** · draft v1 · 2026-05-14
**Authors** · SOS Design Team
**Scope** · plantejament estratègic per a la integració blockchain a SOS · NO és roadmap de codi · sols decisió arquitectural.

## TL;DR

3 opcions analitzades · recomanació · **arrancar amb Permaweb-only** (pacte signat ECDSA · attested) · després **afegir ERC-1155 NFTs** (Polygon · gas baix) per a representar shares slicing pie + governance tokens dels rols · **triple-entry accounting** com a auditoria via Gnosis Safe sols quan hi hagi transaccions econòmiques on-chain reals.

**Filosofia · IA decideix · permaweb recorda · blockchain només quan ha de · per gravar moviments amb valor econòmic real i auditoria pública.**

---

## El que ja tenim ara (post-PR #79)

- ✅ **IA · context-aware** · canvas + tokenomics + ledger + invoices → enriqueix pact draft
- ✅ **Permaweb · metadata immutable** · tots els nodes (project, pact, attestation, invoice, etc) firmables amb ECDSA i pujables a Arweave
- ✅ **ECDSA P-256 native** · cada matriu_member té el seu DID + signing key local-first
- ✅ **Attestations recursives** · Trust score via PageRank
- ✅ **Slicing Pie modeling** · al `value-accounting` (preexistent) + `tokenomics` (nou)
- ❌ **Triple-entry on-chain** · zero · sols local KB
- ❌ **Tokens reals** · sols disseny (token_design node · symbol/supply/distribution/vesting · simbolic)
- ❌ **Treasury multisig** · backlog item (`gnosis-multisig-treasury` · XL · pending)

---

## Què entenem per Triple-Entry Accounting

**Single-entry** · llista de transaccions cronològiques. Ex · "vaig pagar 50€".
**Double-entry** · debit/credit · cada transacció afecta 2 comptes. Ja implementat al `ledgerService`. Ex · cash -50 / expenses +50.
**Triple-entry** · cada transacció té una tercera signatura · un **third trusted party** o **blockchain immutable record** que ho ancla i fa la doble-entry verificable per tercers sense confiança.

Al món Web3 · la blockchain és el "tercer entry". Cada moviment al ledger té · debit + credit + **on-chain tx hash o attestation signed**.

**SOS actual** · cada `ledger_entry` POT tenir un `content.proof` (txHash o invoice id) · ja és quasi triple-entry però el proof local · no extern. Mancat: anchor a una xarxa pública verificable.

---

## 3 OPCIONS · taula comparativa

| Aspecte | Opció A · Permaweb-only | Opció B · ERC-1155 + Permaweb | Opció C · Custom L2 SOS |
|---|---|---|---|
| **Cost setup** | Zero (ja fet) | ~€500 (audit · deploy) | €10k+ (chain bootstrap) |
| **Cost per tx** | €0.01-0.05 (Arweave) | $0.01-0.05 (Polygon gas) | < €0.001 |
| **Latència** | 1-5 min (gateway) | 2-5 sec (Polygon) | <1 sec |
| **Soberania** | Alta (data permanent) | Mitjana (depèn Polygon) | Alta (control total) |
| **Composability DeFi** | Nul·la | Alta (ERC-1155 standard) | Cap (chain nou) |
| **Audit públic** | Yes (Arweave gateway) | Yes (Polygonscan + Arweave) | Yes (block explorer custom) |
| **Triple-entry real** | No (proof local) | Yes (tx hash on-chain) | Yes (tx hash native) |
| **Gnosis Safe support** | N/A | Native | Custom integration |
| **UX cost** | Zero (signing local) | Low (wallet ja existeix) | High (chain bridge) |
| **Recommended phase** | NOW | Phase 2 (3-6 mes) | Phase 4 (1-2 anys) |

---

## OPCIÓ A · Permaweb-only · "what we have"

### Concept

Cada `pact` · `ledger_entry` · `invoice` · `attestation` es signa amb ECDSA local + es puja a Arweave amb tags + txId verificable. **Cap blockchain transaccional**. Triple-entry "soft" · proof és l'Arweave txId que qualsevol tercer pot verificar.

### Pros
- 🚀 **Zero canvis nous** · ja funciona
- 💸 **Cost mínim** (~€0.05 per node publicat al permaweb)
- ⚡ **Simplicitat operativa** · cap wallet UX nou
- 🌍 **Permanència** (Arweave promet 200 anys)

### Cons
- ⚠ **No és triple-entry estricte** · proof Arweave demostra que el doc existia abans del block, NO que la transacció econòmica real va ocórrer
- 💰 **Cap moviment de valor real** on-chain · sols metadata
- 🔒 **No interopera** amb DeFi / staking / DAO governance off-the-shelf

### When to use
- **Fase actual** · primer any de SOS · validar UX + adopció + casos d'ús abans de complicar

### Implementation status
- ✅ Tot fet · `publicEntityService` · `signAttestation` · `verifyAttestation` · etc

---

## OPCIÓ B · ERC-1155 + Permaweb · "phased blockchain entry"

### Concept

**ERC-1155** = standard multi-token (NFT + fungible al mateix contracte). A Polygon (gas ~€0.001) creem:

1. **Pact NFT (token id N)** · representa el pacte signat per tots els socis. Owner = Gnosis Safe multisig del projecte.
2. **Slicing Pie shares (fungible token ids · 1 per party)** · supply ajustable segons % accumulat. Es minten quan algú aporta valor real (via Slicing Pie calculations).
3. **Governance tokens (token id G)** · 1-1 amb roles · vots ponderats per share.
4. **Triple-entry hash anchoring** · per cada `ledger_entry`, un `keccak256(canonicalJSON)` es publica com a event a un contracte registry (Polygon).

**Permaweb encara guarda metadata** (canvas, pitch, attestations, pact body completo, invoices, ikigai, etc) · més barat i permanent que IPFS / on-chain storage.

### Pros
- ✅ **Triple-entry verificable** · qualsevol pot verificar la cadena cronològica al block explorer
- ✅ **Composability** · els slicing pie tokens poden anar a Uniswap, Aave, Sablier (vesting native)
- ✅ **Gnosis Safe** · treasury multisig native · els socis voten al Safe
- ✅ **Auditoria pública** sense permís
- ✅ **Identitat cripto stable** · DID:sos també pot ser un ERC-725 / EOA address

### Cons
- 🔧 **UX wallet** · cal Metamask / WalletConnect · onboarding més fricció
- 💰 **Cost recurrent** · ~€0.01-0.05 per tx anchored
- 🛡 **Audit smart contracts** · necessari abans de deployar (~€500-2000)
- 🌐 **Polygon dependency** · si Polygon cau · backup necessari

### When to use
- **Fase 2 · 3-6 mesos després** quan els primers projectes pilot tinguin necessitat real de · vendre shares, recolzar votacions on-chain, o anchor transactions per a litigis legals.

### What it would look like in code

```js
// js/core/pactBlockchainService.js (FUTURE · no implementar encara)
export async function anchorPactOnPolygon({ pact, signerKey, contractAddress }) {
    const canonicalHash = await keccak256(canonicalizePact(pact));
    const tx = await contract.methods.anchor(pact.id, canonicalHash, pact.content.signaturesRoot)
        .send({ from: signerAddress });
    return { txHash: tx.transactionHash, blockNumber: tx.blockNumber };
}

export async function mintSlicingPieShares({ projectId, partyAddress, amount, contract }) {
    // ERC-1155 mint · tokenId = projectId + ::shares
    const tx = await contract.methods.mint(partyAddress, tokenId, amount, '0x').send(...);
    return { txHash, supplyAfter };
}
```

---

## OPCIÓ C · Custom L2 SOS · "el infinit"

### Concept
Llançar pròpia Layer-2 (basada en OP Stack / Polygon CDK) amb regles natives de slicing pie + governance cooperativa.

### Pros
- 🏛 **Soberania total** · regles consensus alineades amb principis SOS
- 💸 **Gas zero o quasi**

### Cons
- 💸💸💸 **Cost setup massiu** (€10k+ + manteniment)
- 🌐 **Cap composability** · ningú no usa SOS chain
- 🛡 **Securitat** · necessites validadors honestos

### When to use
- **Fase 4 · 1-2 anys mínim** · sols si SOS té milers de projectes i necessita scale + sobirania que cap chain pública dóna.

---

## RECOMANACIÓ · roadmap fasat

### FASE 1 · NOW (PR #79 i continuacions)

**Stack** · IA + Permaweb only
- Continuar enriquint pact generation (acabar PR #79 + extensions)
- Implementar `publishPactToPermaweb` (1 click · signed + uploaded · txId al pact node)
- **Triple-entry "lite"** · cada ledger entry té `content.proofs[]` amb · Arweave txId + signatures dels stakeholders amb shares > N%
- KPI · validar adopció + UX + casos d'ús reals

**No tocar blockchain** · ni Gnosis · ni ERC-1155 · ni res.

### FASE 2 · 3-6 mes (quan algú demani)

**Trigger** · primer projecte pilot demana raise > €10k o vendre/transferir shares.

**Stack** · IA + Permaweb + Polygon (testnet primer · després mainnet)
- Deploy ERC-1155 multitoken contract · 1 per projecte
- Implementar Gnosis Safe creation per projecte
- Pact NFT mint amb canonical hash anchored
- Slicing Pie shares com a fungible tokens
- Triple-entry · cada ledger entry significant (> €100) anchored al registry contract
- KPI · primera transacció on-chain reeixida · multisig payout

### FASE 3 · 6-12 mes (escala)

**Stack** · + DeFi composability
- Sablier per a vesting on-chain (substitueix simulació local)
- Snapshot · votacions ponderades per shares
- Gnosis Safe modules per a auto-payouts segons slicing pie
- Triple-entry COMPLETA · tot moviment econòmic on-chain

### FASE 4 · 1-2 anys (opcional · si necessari)

**Stack** · L2 propi sols si volum justifica
- Migrar des de Polygon a SOS L2
- Conservar tot · Permaweb + IA + DeFi

---

## Docs registrables al Permaweb · catàleg complet

Llista actual + propostes (per a `publishToPermaweb` UI):

| Doc | Existent | Signat amb | Públic per defecte | Use case |
|---|---|---|---|---|
| `project` | ✅ | creatorHandle (member key) | Opt-in | Federation discovery |
| `project_pitch` | ✅ | creator | **Yes** | OG cards · viral share |
| `canvas` snapshot | ⚠ (com a `content.canvas` del project) | creator | Opt-in | Vision lineage public |
| `pact` | ✅ | TOTES les parties (multi-sig logical) | Opt-in (privacy stakeholders) | Legal lineage |
| `token_design` | ✅ (PR #61) | creator | Yes | Token discovery |
| `attestation` | ✅ | attester | Yes | Trust graph |
| `invoice` | ⚠ (només local) | issuer | Opt-in (clients sensibles) | Audit trail |
| `ledger_entry` snapshot mensual | ⚠ | accountant role | Opt-in | Transparency dashboards |
| `proposal` | ⚠ | issuer | Opt-in (clients) | Win-rate audit |
| `workshop` outline | ✅ | facilitator | Yes | Education catalog |
| `sop` | ⚠ (sols si marketSellable) | author | Opt-in | Practice sharing |
| `ikigai` snapshot | ⚠ | self | Opt-in (privacy) | Personal lineage |
| `neural_path_bundle` | ✅ | self | Yes (curated) | Public CV nodal |
| `improvement_cycle` output | ⚠ | self | Opt-in | Learning lineage |
| `swarm_flow_run` | ⚠ | self | Opt-in | Process audit |
| **`pact_amendment`** (FUTUR) | ❌ | parties que modifiquen | Mateixa visibilitat del pact | Evolution legal |
| **`exit_event`** (FUTUR) | ❌ | exiting party + treasury manager | Opt-in | Slicing pie snapshot history |
| **`milestone_attestation`** (FUTUR) | ❌ | role responsible + reviewer | Yes | Progress public |
| **`grant_application`** (FUTUR) | ❌ | applicant | Yes | Funding transparency |

---

## Triple-Entry · concepte pur a SOS

Una `ledger_entry` actual té · `content.legs[]` (debit + credit · double-entry). 

**Triple-entry SOS** afegirà `content.proofs[]` · array de:

```js
{
  kind: 'arweave-txid' | 'polygon-txhash' | 'attestation-id',
  value: 'AYZ...xyz',           // identificador
  signedBy: 'did:sos:alvaro',   // qui ancla
  signedAt: '2026-05-14T...',
}
```

**Fase 1** · sols `attestation-id` + `arweave-txid` (ja podem fer)
**Fase 2** · afegir `polygon-txhash` quan deployment ERC-1155 ja existeix
**Validation rule** · si `legs.total > THRESHOLD_EUR` · ha de tenir mínim 2 proofs.

---

## Recomanació decisió **per a tu, ara**

1. **No mogui's per blockchain encara** · tot OK fase 1
2. **Continua amb el code enhancement** del PR #79 · més contexte per part · més docs llestos per publicació permaweb
3. **Pinta** aquesta strategy doc al backlog com a `pact-blockchain-strategy` (completed = decidit) i `pact-on-chain-anchoring` (pending fase 2)
4. **Mantingues una llista de triggers** · "quan algú demani · raise · transfer shares · governance vote" · trigger fase 2

Així tu i el cofounder podeu mostrar a un advisor cripto aquest doc · i decidir conjuntament amb context complet, sense haver de codificar res abans.

---

## Apèndix · key decisions documented

- **Chain** · Polygon PoS (no zkEVM) per simplicitat i Gnosis Safe native support
- **Standard** · ERC-1155 (no ERC-721) per supply variable i compactness
- **Treasury** · Gnosis Safe · 2-of-N o N-of-M segons project size
- **Permaweb** · Arweave (no IPFS) per permanència >200 anys
- **Identity** · DID:sos local + opcionalment ERC-725 si va on-chain
- **Vesting** · Sablier (Fase 3) · substitueix simulació local
- **Governance** · Snapshot (off-chain · gas zero) per a votacions pacte amendments

---

## Sign-off (placeholder)

| Role | Name | Signed | Notes |
|---|---|---|---|
| Founder anchor | @alvaro | [ ] | |
| Tech lead | TBD | [ ] | |
| Treasury manager | TBD | [ ] | Si existeix |
| Cohort representative | TBD | [ ] | Si Cohort 0 actiu |
