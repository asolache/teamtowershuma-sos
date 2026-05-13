# Stripe Connect setup · STRIPE-CONNECT-001

Guia per a configurar **doble capa Stripe** al SOS:

- **Capa A** · @alvaro (TeamTowers · plataforma SOS) cobra saldos prepagats als usuaris (existeix ja · `docs/STRIPE-VERIFY-SETUP.md`)
- **Capa B** · cada usuari SOS connecta el seu compte Stripe Express i cobra workshops/productes/projectes des de SOS · la plataforma reté **8%** de platform fee (5% margin SOS + 3% Stripe Connect fee)

## Visió general · flux complet

```
@alvaro · platform owner
   ↓
TeamTowers SOS V11 (web app)
   ├─ Capa A · TOP-UP saldo prepagat al wallet (existeix)
   │   Usuari paga 10€ via Payment Link → wallet SOS · IA + permaweb
   │
   └─ Capa B · MARKETPLACE (nou · sprint A)
       Usuari Bob crea workshop "Onboarding Coop" · preu 25€
       Bob ha connectat el seu Stripe Express account (acct_bob_xxx)
       Buyer Alice clica "Comprar · 25€"
       ↓
       Stripe Checkout amb application_fee = 2€ (8% de 25€)
                       + transfer_data.destination = acct_bob_xxx
       ↓
       Alice paga 25€
       Stripe transfereix net 23€ al compte Bob · 2€ al compte SOS
       Bob veu el saldo arribar al seu Stripe Dashboard
       SOS apunta el revenue split al ledger del workshop
```

## Setup pas a pas

### 1 · Activar Stripe Connect al Dashboard

1. https://dashboard.stripe.com → **Settings** → **Connect**
2. Activa **Express accounts**
3. **Branding** ·  carrega logo TeamTowers + colors + email suport
4. **Onboarding** · l'usuari final veurà aquest branding durant el setup

### 2 · Netlify env vars (mateixos que sprint A)

Ja configurat:
- `STRIPE_SECRET_KEY` · sk_test_... o sk_live_...

⚠ Sense env vars addicionals necessàries · Connect usa la mateixa secret key.

### 3 · Flux d'usuari SOS (Bob)

**Bob connecta el seu compte**:
1. Bob obre `/identity` o `/settings` al SOS
2. Veu card "💳 Stripe Connect · cobra workshops/productes amb la teva pròpia compte"
3. Click "🔗 Connect Stripe Account"
4. Frontend crida `createConnectLink({userHandle:'@bob', email:'bob@x.com'})`
5. Edge Function `/api/stripe-connect-link`:
   - Crida `stripe.accounts.create({type:'express', email:'bob@x.com'})`
   - Crida `stripe.accountLinks.create({account, type:'account_onboarding'})`
   - Retorna `{accountId:'acct_bob_xxx', url:'https://connect.stripe.com/...'}`
6. Frontend persisteix `acct_bob_xxx` al KB · redirigeix Bob al URL
7. Bob omple Stripe Onboarding (legal info · payout bank · ID verification)
8. Retorna a SOS (returnUrl) · frontend crida `syncConnectAccountStatus()`
9. Si `chargesEnabled:true` · UI mostra "✓ Stripe connectat · pots vendre"

**Bob crea un workshop premium**:
1. `/workshops` → crea workshop amb `accessTier: 'cohort'` + `priceEur: 25`
2. Sistema sap que Bob té `acct_bob_xxx` connectat
3. Workshop card mostra botó "Comprar · 25€"

**Alice compra el workshop**:
1. Alice (visitor o usuari SOS) obre `/workshops`
2. Veu workshop de Bob amb botó "🔓 Comprar 25€"
3. Click → `createProductCheckout({sellerAccountId:'acct_bob_xxx', priceEur:25, productName:'Onboarding Coop', metadata:{workshopId, sosUserHandle:'@bob'}})`
4. Edge Function `/api/stripe-checkout-product`:
   - Crea Checkout Session amb `application_fee_amount=200` (8%) + `transfer_data.destination=acct_bob_xxx`
   - Retorna `{url:'https://checkout.stripe.com/c/...'}`
5. Alice paga al Stripe Checkout
6. Stripe processa · transfereix automàticament: 23€ a Bob, 2€ a SOS
7. Alice redirigit a successUrl · workshop_unlock generat al SOS local
8. Bob veu el cobrament al seu Stripe Dashboard

### 4 · Test local (sandbox)

Stripe test cards per a Connect:
- Card: `4000 0027 6000 3184` (3DS Spain test)
- Card: `4242 4242 4242 4242` (simple test)
- Date · qualsevol futura · CVC · qualsevol

⚠ Connect té un mode test separat · al Dashboard activa **Test mode** + **Express test accounts** podem usar dades fictícies a l'onboarding.

## Schema KB

### `stripe_connect_account` (singleton per user local)

```js
{
  id: 'sos-stripe-connect-primary',
  type: 'stripe_connect_account',
  content: {
    userHandle:       '@bob',
    accountId:        'acct_xxx',
    chargesEnabled:   true,
    payoutsEnabled:   true,
    detailsSubmitted: true,
    country:          'ES',
    defaultCurrency:  'eur',
    lastSyncAt:       1700000000000,
  }
}
```

### Workshop amb `priceEur` (afegir al schema workshop content):

```js
{
  type: 'workshop',
  content: {
    ...existents,
    accessTier:    'cohort',
    priceEur:      25.00,
    sellerHandle:  '@bob',         // qui rep el net
    sellerAccountId: 'acct_xxx',   // copiat del KB al crear (denormalitzat per UX)
  }
}
```

## Platform fee model

Per defecte **8%**:
- 5% margin SOS (cobreix infra plataforma)
- 3% absorbeix Stripe Connect fee (~2.5% + 0.25€)

Ajustable per producte (rang 0-50%) via paràmetre `platformFeePct` a `createProductCheckout`.

⚠ La fee del Stripe pagment processing està **absorbida** pel seller (Bob), no per la plataforma. Stripe la dedueix abans del transfer_data.destination. Bob veu 23€ - (0.25€ + 2.5%·25€) = 22.13€ neto.

## Webhooks (sprint A2 futur)

Per a tracking automàtic dels payouts/transfers:
- `account.updated` · estat charges_enabled canvia
- `payment_intent.succeeded` · marca workshop_unlock com a paid
- `transfer.created` · log al ledger del workshop
- `account.application.deauthorized` · seller ha desconnectat · disable products

Pendent · Edge Function `stripe-connect-webhook.js` amb `stripe-signature` header verify.

## Decisions clau pendents @alvaro

1. **Platform fee default** · 8% (proposat) · acceptable?
2. **Seller payouts cadència** · Stripe default 7 dies · configurable a Connect onboarding · deixar default
3. **Multi-seller per workshop?** · No de moment · 1 workshop = 1 seller. Co-authorship futur (sprint Z)
4. **Refund flow** · si Alice refunda · com gestionem el workshop_unlock i el SOS revenue split? · Pendent design

## Tradeoffs

✅ **Avantatges Stripe Connect Express**
- Onboarding gestionat per Stripe (legal · KYC · payout bank)
- Compliance · Stripe assumeix risc PCI-DSS i KYC
- Multi-país automatic (Stripe operatiu a 40+ països)
- Platform fee transferit automàticament · sense reconciliació manual

⚠ **Limitacions**
- Stripe pren 0.25%+0.25€ extra per transfer Connect (per damunt del processing fee)
- Seller necessita compte bancari pròpia
- Geographic restrictions (alguns països no suportats per Connect)
- Onboarding pot ser complex per a usuaris poc tècnics · oferir guia/suport

## Documentació Stripe oficial

- Connect overview · https://stripe.com/docs/connect
- Express accounts · https://stripe.com/docs/connect/express-accounts
- Application fees · https://stripe.com/docs/connect/direct-charges#collecting-fees
- Test mode · https://stripe.com/docs/connect/testing
