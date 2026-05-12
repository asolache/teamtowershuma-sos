# Stripe verify session · Setup operatiu (BIZ-MODEL-001 sprint A)

Aquesta guia explica com configurar el flow de top-up amb auto-verificació
post-pagament · sense webhooks de servidor i sense secret keys al client.

## Arquitectura

```
User → /wallet → click "💰 +10€"
   ↓
Stripe Payment Link (https://buy.stripe.com/test_...)
   ↓
User completes payment at Stripe (test card 4242 4242 4242 4242)
   ↓
Stripe redirects to success_url:
   https://teamtowershuma.com/wallet?session_id=cs_test_...
   ↓
WalletView.afterRender() detect session_id
   ↓
POST /api/stripe-verify-session { sessionId }
   ↓
Netlify Edge Function calls Stripe API with SECRET_KEY (server-side)
   ↓
{ verified, amountTotal, currency, ... }
   ↓
If verified === true: topUpAndPersist({ amountEur, source: 'stripe-verified' })
   ↓
KB marks session as claimed (avoid double-claim on reload)
   ↓
Toast: "✓ +10€ verificats i aplicats al wallet"
```

## Setup pas a pas

### 1. Stripe Dashboard

1. Crea compte a https://dashboard.stripe.com (mode test inicialment)
2. **Crea Payment Links** un per cada amount preset (10€, 25€, 50€, 100€):
   - **Products** → **Add product** → "Top-up wallet 10€" (price = 10€)
   - **Payment Links** → **New** → tria el producte
   - **After payment** → **Don't show confirmation page** → **Redirect customers to your website**:
     ```
     https://teamtowershuma.com/wallet?session_id={CHECKOUT_SESSION_ID}
     ```
     ⚠️ El placeholder `{CHECKOUT_SESSION_ID}` és LITERAL · Stripe el reemplaça automàticament.
3. Copia la URL del Payment Link (ex. `https://buy.stripe.com/test_abc...`)
4. Repeteix per 25€, 50€, 100€.

### 2. SOS local · `/settings`

Obre `/settings` al SOS:
- Tab **💳 Stripe + plans**
- Enganxa cada Payment Link URL al seu camp (10€ → 25€ → 50€ → 100€)
- (Opcional) Stripe Publishable Key (`pk_test_...` o `pk_live_...`) per a futura
  integració Stripe Elements · NO és necessària per a Payment Links

### 3. Netlify env vars

Al Netlify Dashboard → Site → **Site configuration** → **Environment variables**:
- Add variable:
  - **Key:** `STRIPE_SECRET_KEY`
  - **Value:** `sk_test_...` (mode test) o `sk_live_...` (alfa pública)
- Save · trigger redeploy

⚠️ MAI escrigis la `sk_` al codi · sols a Netlify env vars. La verifica de Stripe es fa
**server-side** via Edge Function · el client mai veu la secret key.

### 4. Test del flow

1. A SOS local · `/wallet` (qualsevol projecte amb wallet)
2. Click "💰 +10€"
3. Stripe Payment Link s'obre · paga amb test card `4242 4242 4242 4242 · 12/34 · 123`
4. Stripe redirigeix · l'URL contindrà `?session_id=cs_test_...`
5. WalletView detecta el param · fa POST a `/api/stripe-verify-session`
6. Edge Function verifica la sessió · retorna `{ verified: true, amountTotal: 1000, currency: 'eur' }`
7. WalletView aplica top-up al wallet · toast verd · saldo augmenta
8. URL es neteja (treu `session_id`) per evitar re-claim

### 5. Debugging

Si el flow falla, mira:
- **Network tab** del browser · request a `/api/stripe-verify-session` · resposta
- **Netlify logs** · Functions → stripe-verify-session → logs
- **Stripe Dashboard** · Logs → API logs (request del GET checkout/sessions)

Errors comuns:
- `STRIPE_SECRET_KEY not configured` · falten env vars al Netlify
- `sessionId invàlid` · el placeholder `{CHECKOUT_SESSION_ID}` no s'està resolent · revisa el Payment Link config
- `verify-failed: ...` · la sessió no està complete o no s'ha pagat · pot ser un cancel·lament

## Tradeoffs de l'aproximació

✅ **Avantatges**
- Zero secret keys al client
- Local-first compatible (l'Edge Function només verifica · el saldo viu al user's KB)
- Idempotent · `stripe_claim` node KB evita doble-cobrament si l'usuari recarrega
- No requereix webhook setup complex · sols Payment Link → success URL

⚠️ **Limitacions**
- Si l'usuari NO torna al SOS post-pagament, el saldo no s'aplica fins que ho faci
  manualment. Solució futura · Stripe webhook que envia email a l'usuari amb un link
  directe `/wallet?session_id=...` (sprint B futur)
- Stripe API rate limit · 100 req/s per compte · no és problema per a alfa
- No funciona en local dev sense Netlify CLI (`netlify dev`) · els Payment Links
  funcionen amb la Live URL · per a local-dev cal mode mock o stripe-cli forwarding

## Backlog post-sprint A

- **Sprint A2** · Migrar a Stripe Webhook + endpoint `/api/stripe-webhook` que
  rep `checkout.session.completed` · genera token signat · usuari pot reclamar
  des de qualsevol device (sprint C2 multi-device sync)
- **Sprint B** · `billingService.js` · margin model 5% IA · 10% permaweb
- **Sprint C** · Plans enforced (free pot publish · pro illimitat)
- **Sprint D** · Turbo Credits auto-compra opt-in
- **Sprint E** · Receipts + Stripe Invoice API per a alfa B2C complianza
