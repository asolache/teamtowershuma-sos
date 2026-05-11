# Guia operativa · Stripe + Arweave/Turbo · per a publish real

> Llegit aquesta guia després del `git pull` de l'última Ola.
> Pre-requisits: Node ≥ 18 · `npm test` passa 69/69.

---

## 1. Stripe · funding del wallet personal i de projecte

### 1.1 Fase test (sense diners reals · imprescindible primer)

#### Paso 1 · Compte Stripe
1. Anar a https://dashboard.stripe.com/register
2. Crear compte (gratuït · sense KYC en test mode)
3. Al top-left · veuràs un toggle **"Test mode"** activat (groc)
4. Seguir-ne tota aquesta primera fase **sense desactivar test mode**

#### Paso 2 · Obtenir Publishable Key
1. Sidebar → **Developers → API keys**
2. Copiar la `pk_test_XXXXXXX...` (Publishable key · comença per `pk_test_`)
3. ⚠️ **MAI** copiïs ni usis al SOS la `sk_test_` (Secret key) · només la `pk_test_`

#### Paso 3 · Crear 4 Payment Links de test
1. Sidebar → **Products → + Create product**
2. Per cada un dels 4 trams:

| Producte | Preu |
|---|---|
| `SOS Top-up · 10€ (test)` | 10€ |
| `SOS Top-up · 25€ (test)` | 25€ |
| `SOS Top-up · 50€ (test)` | 50€ |
| `SOS Top-up · 100€ (test)` | 100€ |

3. Per cada un · al panel del producte:
   - Type: **One-time**
   - Currency: **EUR**
   - Save
   - Click **"Create payment link"**
   - Copiar la URL `https://buy.stripe.com/test_XXXXXXX`
4. Es generen 4 URLs · una per tram

#### Paso 4 · Configurar SOS amb les claus + Payment Links
1. Obre el SOS local · `/settings`
2. Card morat **💳 ALPHA-STRIPE-001 · Saldo + plans**
3. Pega la `pk_test_XXX...` al camp "Stripe Publishable Key"
4. Pega les 4 URLs als inputs corresponents
5. Click **💾 Guardar**

#### Paso 5 · Test del flux complet
1. `/wallet` (sense projectId · obre el teu wallet personal)
2. Click `↗ 10€` (preset Stripe)
3. S'obre Stripe Checkout en nova tab
4. Pagar amb la **targeta de prova de Stripe**:
   - Número · `4242 4242 4242 4242`
   - Data · qualsevol futura · ex. `12/30`
   - CVC · qualsevol 3 dígits · ex. `123`
   - ZIP · qualsevol · ex. `08001`
5. Confirmar el pagament
6. Tornar al SOS · veuràs el confirm modal **"He pagat 10€"**
7. Click OK → el topup s'enregistra al wallet (`source='stripe-confirmed'`)
8. Saldo wallet personal · `10€`

### 1.2 Fase producció (diners reals)

#### Pre-requisits abans de live mode
- Compte Stripe verificat (ID document)
- Compte bancari connectat per a payouts (Stripe → tu)
- Tax info completada

#### Migració test → live
1. Dashboard Stripe → toggle "Test mode" → **OFF** (passa a "Live")
2. Crear els mateixos 4 productes + Payment Links en mode live
   - URLs canvien a `https://buy.stripe.com/XXXX` (sense `test_`)
3. Copiar la `pk_live_XXX...`
4. Substituir al `/settings` del SOS
5. Quan algú paga · Stripe et fa payout (descomptat fee Stripe ~1.4% + 0.25€) al teu compte bancari setmanalment

#### Stripe Connect · per a withdrawals dels stakeholders (futur)

Quan un stakeholder vol retirar el seu pie del wallet personal del SOS a credit card o compte bancari, cal **Stripe Connect Express**:
1. Stripe Dashboard → **Connect** → activar Express accounts
2. Cada stakeholder fa onboarding (KYC mínim · només cal email + país)
3. Reps els pagos a tu i fas redistribució als seus comptes Connect
4. Pendent · sprint Stripe-Connect-001 al backlog (~4h)

### 1.3 Quan webhook automàtic estarà disponible (Sprint B futur)

Avui requereix confirmar manualment cada topup. Sprint B + Netlify Function automatitzarà:
1. Stripe envia webhook `checkout.session.completed` a `https://teusos.netlify.app/.netlify/functions/stripe-webhook`
2. Netlify Function valida la signatura amb `sk_test_` (al env, mai al frontend)
3. La función crea un topup al wallet del projecte via API SOS (TBD)
4. Saldo apareix instantàniament sense intervenció manual

Pendent fins que tinguis Netlify deployment.

---

## 2. Arweave / Turbo · per a publish real al permaweb

### 2.1 Quina key signa què

| Concepte | Quina key |
|---|---|
| **DID identitat SOS** | Keypair ECDSA P-256 local (compartit amb `projectIO`) |
| **Signatura entries permaweb** | Mateixa ECDSA P-256 · auto-contained al payload |
| **Pagament a Arweave (Turbo)** | Wallet Arweave separat (Ed25519) · finançat amb tarjeta o ETH/Polygon |

És important · **les dues claus són independents**. La P-256 demostra que ets tu (DID). La wallet Arweave només paga el cost del storage.

### 2.2 Crear wallet Arweave (un sol cop)

#### Opció A · ArConnect (extensió Chrome/Firefox) · més fàcil
1. Instal·lar **ArConnect** des de https://arconnect.io
2. Click extensió · "Create new wallet"
3. Anotar el **seed phrase** de 12 paraules · 🔒 GUARDAR-LO OFFLINE
4. La wallet té un address public `arweave.net/{address}` i una keyfile JSON privada
5. Exportar la keyfile · ArConnect → Settings → "Export wallet"

#### Opció B · arweave.app · web wallet
1. https://arweave.app → "Create wallet"
2. Descarrega keyfile JSON
3. Guarda-la **fora del git** · ⚠️ qui té el JSON té els fons

### 2.3 Finançar la wallet amb Turbo Credits

**Turbo Credits** és el sistema de Ardrive per pagar uploads · suporta credit card directe.

1. Anar a https://turbo-topup.com
2. Connectar la teva wallet Arweave (drag&drop la keyfile o ArConnect)
3. Triar quantitat:
   - **5 USD** = ~10MB d'uploads (1 perfil = ~1KB · 10MB = 10.000 perfils)
   - **20 USD** = ~40MB
4. Pagar amb tarjeta o crypto
5. Els credits queden lligats a la teva wallet Arweave

> Per a un alfa SOS amb pocs perfils · **5 USD** és més que suficient per a mesos.

### 2.4 Configurar SOS amb la keyfile Arweave (sprint pendent)

Avui el `publicRegistryService.publishToPermaweb` usa `TurboFactory.unauthenticated()` que prova carregar credits via redirect a navegador. Per a **publish real seamless**, cal:

**Sprint UI (~1h pendent)** · afegir a `/settings` un nou card:

```
🟣 Arweave / Turbo · per al permaweb
─────────────────────────────────
Keyfile Arweave (JSON)
[Seleccionar fitxer] → carrega + valida

Saldo Turbo · 4.95 USD (~9.7 MB upload disponible)
[↗ Recargar Turbo]

[💾 Guardar]
```

Persistir la keyfile al KB (xifrada amb un passphrase, important).

**Implementació tècnica**:
1. UI fileinput → parse JSON keyfile
2. Validar `n` (modulus RSA) + `kty='RSA'` (Arweave usa RSA-PSS de 4096 bits)
3. Persistir a KB com a `type='arweave_wallet'` (sensitive · marcar al schema)
4. Modificar `publishToPermaweb` · `client = TurboFactory.authenticated({ privateKey: arweaveKeyfile })`
5. Saldo Turbo via `client.getBalance()` mostrat al settings

**Mentre no estigui aquest sprint** · usa `setPermawebMockEnabled(true)` que ja existeix per a tests sense xarxa.

### 2.5 Test de publish real (un cop tinguis keyfile + Turbo credits)

1. `/settings` → ⚠️ desactivar 🧪 Mode test permaweb
2. `/wallet?project=X` → carrega 1€ al wallet del projecte (Stripe test ja val)
3. `/identity` → 🌐 Registre públic → tria projecte X → **🌐 Publicar**
4. Si tot bé:
   - Saldo wallet X passa de 1.00€ a 0.95€
   - Saldo Turbo passa de 5.00 USD a 4.99 USD (~0.01 USD = 0.001MB)
   - `arweaveTxId` real apareix (ex. `7sH3kJk2nfL3a4bC8dEfGhIjKlMnOpQrStUvWxYz`)
5. Click "🔗 Veure tx" → s'obre `https://arweave.net/{txId}` amb el JSON del teu perfil públic
6. Esperar ~2-5 min · Arweave miners confirmen la tx
7. Provar des d'un altre navegador / dispositiu:
   - `/registry` → ↻ Sync → veuràs el teu perfil descobert via GraphQL Arweave
   - Verify ECDSA · ✓ Verificada

---

## 3. Què publicar al permaweb · plà estratègic

> Visió @alvaro · SOS = agent intel·ligent descentralitzat per crear
> xarxes de valor amb agents automatitzant fluxos de valor.

### 3.1 Principis (decideixen què va al permaweb)

| Principi | Implicació |
|---|---|
| **Permanència** | Si necessita ser indestructible (audit · validesa legal · trust) → permaweb |
| **Descobribilitat** | Si altres SOS locals han de poder trobar-lo sense backend central → permaweb |
| **Verificabilitat** | Si la integritat ha de poder ser provada amb una signatura → permaweb |
| **Privacitat** | Si conté dades personals · clau privada · secrets · WO confidencials → MAI permaweb |
| **Cost** | Si es publica sovint i no canvia gairebé mai · al permaweb és barat | Si canvia cada minut · local (KB) o blockchain (gas alt) |

### 3.2 Catàleg de 7 capes a publicar

#### Capa 1 · Identity & Trust ✅ ENTREGAT
- ✅ `public_registry_entry` · perfil públic d'operadors SOS · `/registry`
- ✅ `public_project_entry` · projectes públics · `/opportunities`
- 🟡 `attestation_entry` · pendent · skill attestation signada per altre operador ("@marc valida que @alvaro té vision-strategic")
- 🟡 `coop_registration` · pendent · cooperativa legalment registrada amb CIF + país

**Cost permaweb** · ~$0.0001 per entry (negligible)

#### Capa 2 · Value Network ✅ PARCIAL
- ✅ Pacts signats ECDSA (PACT-001 ja implementat local · permaweb anchor pendent)
- 🟡 `public_soc` · SOC standards de conducta publicades (open source de la teva cultura org)
- 🟡 `public_sop` · SOP plantilles compartides (lib de operativitat reusable)
- 🟡 `value_map_public_snapshot` · snapshot signat d'un mapa de valor en moment X
- 🟡 `pact_anchor` · pact signat amb timestamp permaweb (validesa legal eIDAS)

**Per què publicar pacts?** · El pacte signat existeix local · però publicar un anchor (només el hash signat + timestamp) al permaweb garanteix que ningú pot després negar que el pacte va existir en aquesta data. Triple-entry accounting literal.

#### Capa 3 · Agentic Operations 🟡 NO IMPLEMENTAT
- 🟡 `wo_template` · "recepta" de Work Order reusable amb estimacions cost+temps
- 🟡 `agent_prompt` · system prompt verificat per a agents IA (ex. "Generador SOP del rol")
- 🟡 `agent_persona` · personalitat d'un agent (Genesis Architect · Dharma Ontologist · etc.) publicada perquè altres SOS la puguin usar
- 🟡 `automation_rule` · regla automàtica (ex. "Quan WO arriba a 'ledgered' · publish a /value-accounting")

**Per què aquesta capa és revolucionària** · agents intel·ligents portables. Si jo defineixo un agent que automatitza el "client onboarding" amb un prompt particular i una sèrie de WO templates · publicar-lo al permaweb permet que **qualsevol altre SOS pugui invocar el mateix agent** amb idèntic comportament, sense haver de reescriure'l. La descentralització dels agents intel·ligents.

#### Capa 4 · Marketplace 🟡 PARCIAL
- ✅ `market_item` viu local (MKT-001) · publicar al permaweb pendent
- 🟡 `service_offer` · oferta de servei amb preu + disponibilitat + skills requerides
- 🟡 `join_request` · sol·licitud d'unir-se a un projecte com a stakeholder (signada amb el DID del sol·licitant)
- 🟡 `acceptance` · resposta del owner al join_request

**Per què** · mercat global descentralitzat sense pla­taforma intermediària. Tipus OpenBazaar però amb verificació d'identitat ECDSA i contextual del projecte.

#### Capa 5 · Knowledge Commons 🟡 NO IMPLEMENTAT
- 🟡 `sector_seed_v2` · catàleg knowledge sector signat per autors verificats
- 🟡 `vna_pattern` · patró VNA reusable (com l'sectors A-S actuals però publicats)
- 🟡 `learning_outcome` · resultat d'un workshop signat
- 🟡 `concept_definition` · entrada al glosari `/learn` amb autors

**Per què** · el coneixement sectorial actualment viu a `knowledge/sectors/` dins el repo · publicar-lo al permaweb permet a qualsevol SOS local llegir-lo sense haver de baixar tot el repo · només els sectors que interessin.

#### Capa 6 · Audit & Compliance 🟡 NO IMPLEMENTAT (KEY PER A LEGAL)
- 🟡 `ledger_snapshot_signed` · snapshot del Slicing Pie del projecte amb signatura · publicable mensual
- 🟡 `triple_entry_record` · cada `value_contribution` important pot tenir anchor permaweb
- 🟡 `opentimestamps_anchor` · combinar amb OTS per a validesa legal Bitcoin
- 🟡 `tax_report_esef` · export anyal ESEF + TimestampToken eIDAS

**Per què crítica** · perquè SOS doni validesa fiscal · els auditors han de poder verificar que la comptabilitat **no s'ha tocat retroactivament**. El permaweb + OpenTimestamps Bitcoin (cost 0€ per ancoratge) demostra que la dada existia en aquesta data.

#### Capa 7 · Reputation & Trust Score 🟡 NO IMPLEMENTAT
- 🟡 `reputation_event` · positiu o negatiu signat per altre operador
- 🟡 `endorsement` · "@marc endossa @alvaro per skill X"
- 🟡 `dispute_record` · disputa arbitrada signada per àrbitres (3-de-5 multisig)
- 🟡 `trust_graph_snapshot` · derivat dels endorsements · grafo de confiança

**Per què** · trust descentralitzat real. Sense plataforma central que decideixi qui és confiable · cada SOS local computa el seu propi grafo de confiança a partir dels endorsements signats al permaweb.

### 3.3 Calendari proposat de roll-out

| Fase | Que es publica | Sprint | Cost mensual estimat (100 usuaris actius) |
|---|---|---|---|
| **Fase 1 · alfa privada** | Identity + Project (capes 1-2 mínim) | ✅ ENTREGAT | ~0.05 USD |
| **Fase 2 · alfa pública** | + WO templates + Agent prompts | PERM-AGENT-001 (~6h) | ~0.50 USD |
| **Fase 3 · beta operativa** | + Pact anchors + Ledger snapshots monthly | PERM-LEGAL-001 (~5h) | ~2 USD |
| **Fase 4 · producció Matriu** | + Reputation graph + Trust scoring | PERM-TRUST-001 (~8h) | ~5 USD |
| **Fase 5 · escala** | + Sector knowledge commons + Sponsored agents | PERM-COMMONS-001 (~6h) | ~10 USD |

### 3.4 SOS com a "agent intel·ligent per al teu projecte"

Per a què sigui de veritat un agent · necessita 5 capacitats:

1. **Context permanent** · pot llegir el seu propi historial + el permaweb (capa 5)
2. **Trust verificable** · sap a qui creure (capa 7)
3. **Autonomia d'acció** · WO + automation rules (capa 3)
4. **Memoria col·lectiva** · llegeix knowledge commons descentralitzat (capes 5+6)
5. **Connectivitat federada** · descobreix oportunitats (capa 4)

Quan totes 5 capes estiguin parcialment al permaweb (fase 3-4), el SOS pot:
- Detectar automàticament que un projecte busca skill X que tens · obrir join_request
- Sugerir auto-pacts basats en perfils trust-verificats
- Aplicar automation_rules publicades per altres SOS (ex. "Quan stakeholder rep <100€/mes · auto-buscar més projectes que necessiten les seves skills")
- Maintenir un grafo de trust personal que filtri spam del permaweb
- Federar el ledger del teu projecte amb auditors externs sense backend intermediari

### 3.5 What NOT to publish (defensiu)

| Mai al permaweb | Per què |
|---|---|
| Clau privada ECDSA / Arweave | Compromís fatal de la identitat |
| API keys (Anthropic · OpenAI · Stripe) | Costs incontrolats si se filtren |
| Wallets (saldo · moviments) | Privacitat financera |
| Work Orders amb contingut confidencial | Dades de clients · IP |
| Contributions amb valor real eur | Confidencial fins ledger snapshot consensuat |
| Manifesto SOS amb crítica explícita | Reputational risk |
| Personal data tipus GDPR (email · telèfon) | Legal · dret a l'oblit no aplicable al permaweb |
| Token economy operations (slicing pie diari) | Volatilitat fiscal · només snapshot consensuat mensual |

---

## 4. Recomanació estratègica · prioritzar

Per a **propers 30 dies** · suggereix-ho així:

| Setmana | Tasca | Per què |
|---|---|---|
| **1** | Stripe live keys + 4 Payment Links · 5 EUR personal saldo test | Permet primer publish real |
| **1** | Arweave wallet + 5 USD Turbo credits · `/settings` UI sprint | Sortir del mock |
| **2** | Sprint PERM-LEGAL-001 fase 1 · Pact anchor + Ledger snapshot mensual | Valor fiscal real |
| **3** | Sprint PERM-AGENT-001 · Agent prompts + WO templates al permaweb | Agents portables |
| **4** | Sprint PERM-TRUST-001 fase 1 · Endorsements signats | Trust descentralitzat alpha |

Tot el codi de fons ja existeix · només cal definir cada schema nou (1 fitxer pure helpers per capa) + UI mínima + tests. Cada sprint és incremental, no breaking.

---

*Documento vivo · @alvaro 2026-05-10 · revisar abans de cada Ola.*
