# OAuth setup · WALLET-AUTH-001 sprint C

Guia per a configurar el flux OAuth real al SOS · permet a usuaris no-cripto identificar-se ràpidament via GitHub (i Google · Magic-link en sprints futurs).

## Arquitectura

```
Usuari · click "Connect GitHub" al modal "🔑 Identifica't"
   ↓
loginWithGithub() obre popup → /api/oauth-github-init?state=NONCE
   ↓
Edge Function redirigeix a github.com/login/oauth/authorize
   ↓
Usuari autoritza al GitHub
   ↓
GitHub redirigeix a /api/oauth-github-callback?code=X&state=NONCE
   ↓
Edge Function (server-side):
   1. Exchange code → access_token amb CLIENT_SECRET
   2. Fetch /user + /user/emails de GitHub API
   3. Retorna HTML amb postMessage al window.opener
      { provider:'github', userId, login, name, email, avatarUrl }
   ↓
Client (oauthService) escolta postMessage · valida state nonce
   ↓
linkProviderToIdentity() · persisteix a matriu_member.oauthProviders[]
```

⚠ El `access_token` NO surt del servidor · sols dades públiques (login + email) arriben al client.

## Setup pas a pas

### 1 · Crear GitHub OAuth App

1. Vés a https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**
2. Omple:
   - **Application name** · `TeamTowers SOS V11`
   - **Homepage URL** · `https://teamtowershuma.com`
   - **Authorization callback URL** · `https://teamtowershuma.com/api/oauth-github-callback`
3. Click **Register application**
4. Anota el **Client ID** (públic) i genera un **Client Secret** (secret · sols el veuràs una vegada · copia'l immediatament)

### 2 · Configurar Netlify env vars

Vés a Netlify Dashboard → site `sosteamtowers` → **Site configuration** → **Environment variables** → afegeix:

| Key | Value | Scope |
|---|---|---|
| `GITHUB_OAUTH_CLIENT_ID` | `Iv1.xxxxxxxxx` (el teu) | All scopes |
| `GITHUB_OAUTH_CLIENT_SECRET` | `ghp_xxx...` (el teu) | All scopes |
| `OAUTH_REDIRECT_BASE` | `https://teamtowershuma.com` | All scopes |

Trigger redeploy.

### 3 · Test al SOS

1. Obre `https://teamtowershuma.com/identity`
2. Click "🔑 Identifica't" (top dret) → tab **🪪 OAuth**
3. Click **GitHub**
4. Popup s'obre · autoritza
5. Tornar al SOS · veuràs ✓ verd amb el teu username GitHub

### 4 · Verificar al KB

Inspecciona l'indexedDB del navegador:
- Node `matriu-member-primary` ha de tenir:
  ```js
  content: {
    oauthProviders: [{
      provider: 'github',
      userId: 12345,
      login: '@yourlogin',
      name: 'Your Name',
      email: 'you@example.com',
      avatarUrl: 'https://...',
      verifiedAt: 1700000000000,
    }]
  }
  ```

## Google OAuth · pendent (sprint C2)

Mateix patró:
1. Crea OAuth Client a https://console.cloud.google.com → APIs & Services → Credentials
2. Redirect URI · `https://teamtowershuma.com/api/oauth-google-callback`
3. Env vars · `GOOGLE_OAUTH_CLIENT_ID` + `GOOGLE_OAUTH_CLIENT_SECRET`
4. L'Edge Function `oauth-google-init.js` + `oauth-google-callback.js` segueix el mateix patró que GitHub (still TODO)

## Magic-link · pendent (sprint C3)

Necessita servei d'enviar emails (Resend.com o similar):
1. Env var `RESEND_API_KEY`
2. Env var `MAGIC_LINK_SIGNING_KEY` (HMAC secret per signar tokens)
3. Edge Function `oauth-magic-request.js` envia email amb link signat
4. Edge Function `oauth-magic-verify.js` valida HMAC + postMessage al popup

## Debugging

| Símptoma | Causa | Solució |
|---|---|---|
| Popup s'obre i tanca immediat | `GITHUB_OAUTH_CLIENT_ID` no configurat | Comprova env vars al Netlify · trigger redeploy |
| "oauth-state-mismatch" | Possible CSRF · més probable que el popup s'hagi obert dues vegades | Refresh pàgina i intenta de nou |
| "no-access-token" | Client secret incorrecte | Verifica `GITHUB_OAUTH_CLIENT_SECRET` (revoca i regenera si dubtes) |
| Popup blocked | Navegador bloqueja popups | Permet popups per a teamtowershuma.com |

## Seguretat

- ✅ Client secret sols al servidor (Netlify env var)
- ✅ State nonce protegeix de CSRF
- ✅ `access_token` no surt del servidor (només dades públiques)
- ✅ Validació origin del postMessage al client
- ✅ DID local segueix sent l'identificador canònic (OAuth és layer de verificació)
