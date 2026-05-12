# Build local del Turbo SDK · Sprint H

> Sprint H · @alvaro 2026-05-10 · bundlar el Turbo SDK localment perquè
> funcioni al browser (les CDNs universal no poden polyfillejar `fs`).

## TL;DR · una sola comanda

```bash
cd /Users/fernando/teamtowershuma-sos
npm run setup:turbo
```

Aquest script:
1. Instal·la `@ardrive/turbo-sdk@1.27.1` i `esbuild` com a devDependencies
2. Genera `vendor/turbo-sdk.js` (~500KB · ESM browser-compatible)
3. Modifica `node_modules` (afegeix-lo a `.gitignore`)

Després de `npm run setup:turbo`:
- L'SOS detecta automàticament el bundle local i l'usa
- Veuràs a console: `[arweaveWalletService] Turbo SDK loaded from LOCAL /vendor/turbo-sdk.js`
- El publish real funciona sense CDN externs

## Què fa internament

`package.json`:
```json
"scripts": {
    "build:turbo": "esbuild node_modules/@ardrive/turbo-sdk/lib/web/index.js --bundle --format=esm --outfile=vendor/turbo-sdk.js --define:process.env.NODE_ENV=\"\\\"production\\\"\" --target=es2022 --platform=browser",
    "setup:turbo": "npm install --save-dev @ardrive/turbo-sdk@1.27.1 esbuild && npm run build:turbo"
}
```

L'`esbuild` resol totes les imports de Node (`fs`, `path`, etc.) amb les versions browser disponibles (o stubs) i genera un únic ESM autocontingut.

## .gitignore

Afegeix:
```
node_modules/
vendor/
```

El `vendor/turbo-sdk.js` és reproduïble · cada operador SOS fa `npm run setup:turbo` un cop al seu repo local. Manté pure local-first runtime · només cal el build step un cop.

## Workflow per al primer publish real

```bash
# 1. Setup (un sol cop)
cd /Users/fernando/teamtowershuma-sos
npm run setup:turbo

# 2. Reinicia el server local (Ctrl+C i tornar a llançar)

# 3. Browser hard refresh (Cmd+Shift+R)

# 4. /settings → asegura keyfile Arweave carregada + saldo Turbo visible

# 5. /settings → DESACTIVA 🧪 Mode test Permaweb

# 6. /identity → 🌐 Publicar
#    - Veuràs status verd
#    - Saldo wallet projecte: -0,05€
#    - Saldo Turbo: -~$0,0001
#    - txId real al arweave.net/{txId}

# 7. Esperar 2-5 min · /registry → ↻ Sync → veuràs el teu perfil
```

## Tamany del bundle

- `vendor/turbo-sdk.js` · ~500KB (no min) · ~200KB (min)
- Es carrega un sol cop · cached pel browser
- Zero impact al startup SOS · només es carrega quan crides publish

## Alternativa · si no vols npm

Si no vols afegir Node tooling al teu workflow local, **el mock mode és perfecte per a testar tot el flux UX**. Quan vulguis fer un publish real:

1. Activa una vegada el bundling (com a dalt) — només cal una vegada
2. OR redirigeix cap a la **Opció B** del backlog: substituir Turbo per `arweave-js` que té web bundle nativament

## Tests post-bundle

```bash
npm test
# 38 + 31 = 69 asserts verds (no test del bundle real · només pure)
```

El bundle no afecta els tests pure (publicRegistry, fundFlow) · només l'integration runtime al browser.

---

*@alvaro · després de fer `npm run setup:turbo` un cop, oblida-te'n · el publish funcionarà.*
