// TEAMTOWERS SOS V11 — ARWEAVE WALLET SERVICE (PERM-USER-001 sprint G)
//
// Persisteix la keyfile Arweave (JSON RSA-4096) al KB · valida shape ·
// retorna balance Turbo · suporta publishToPermaweb amb authenticated client.
//
// Avis pre-alfa · 2026-05-10 · la keyfile es persisteix SENSE XIFRAR
// a IndexedDB · qui té accés al navegador té els fons. Abans d'alfa
// pública · cifrar amb passphrase del manifesto SOS (sprint H futur).

export const ARWEAVE_WALLET_TYPE = 'arweave_wallet';
export const ARWEAVE_WALLET_ID   = 'sos-arweave-wallet';   // singleton

// ── Validació JWK Arweave ──────────────────────────────────────────
//
// Arweave usa RSA-PSS 4096-bit · JWK format estàndard amb camps:
//   kty: 'RSA'
//   n  : modulus (base64url)
//   e  : exponent (sempre 'AQAB')
//   d  : private exponent (base64url)
//   p, q, dp, dq, qi: CRT components (opcional · alguns wallets els eliminen)

export function validateArweaveKeyfile(jwk) {
    const errors = [];
    if (!jwk || typeof jwk !== 'object') return { valid: false, errors: ['keyfile must be JSON object'] };
    if (jwk.kty !== 'RSA') errors.push(`kty must be 'RSA' (got '${jwk.kty}')`);
    if (!jwk.n  || typeof jwk.n  !== 'string') errors.push('missing n (modulus)');
    if (!jwk.e  || typeof jwk.e  !== 'string') errors.push('missing e (exponent)');
    if (!jwk.d  || typeof jwk.d  !== 'string') errors.push('missing d (private exponent · keyfile is public-only?)');
    // Tamany aproximat 4096-bit · base64url ~684 chars
    if (jwk.n && jwk.n.length < 500) errors.push('n looks too short for 4096-bit RSA (got ' + jwk.n.length + ' chars)');
    return { valid: errors.length === 0, errors };
}

// addressFromJwk · async · deriva l'address Arweave (SHA-256 del modulus n)
// Format Arweave · 43 chars base64url
export async function addressFromJwk(jwk) {
    if (!jwk || !jwk.n) throw new Error('addressFromJwk requires JWK with n');
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        throw new Error('crypto.subtle no disponible');
    }
    // base64url decode de n
    const nBytes = _base64UrlToBytes(jwk.n);
    const hashBuf = await crypto.subtle.digest('SHA-256', nBytes);
    return _bytesToBase64Url(new Uint8Array(hashBuf));
}

function _base64UrlToBytes(b64url) {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
    if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(padded, 'base64'));
    const binary = atob(padded);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
}

function _bytesToBase64Url(bytes) {
    let b64;
    if (typeof Buffer !== 'undefined') b64 = Buffer.from(bytes).toString('base64');
    else {
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        b64 = btoa(binary);
    }
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ── KB-bound async ──────────────────────────────────────────────────

export async function saveArweaveKeyfile(jwk) {
    const v = validateArweaveKeyfile(jwk);
    if (!v.valid) throw new Error('saveArweaveKeyfile · invalid: ' + v.errors.join(' · '));
    const address = await addressFromJwk(jwk);
    const now = Date.now();
    const node = {
        id:   ARWEAVE_WALLET_ID,
        type: ARWEAVE_WALLET_TYPE,
        content: {
            kind:      'arweave-wallet',
            jwk,                     // ⚠ sense xifrar · pre-alfa
            address,
            savedAt:   now,
            isPrimary: true,
        },
        keywords: ['type:arweave-wallet', 'address:' + address],
        createdAt: now,
        updatedAt: now,
    };
    const { KB } = await import('./kb.js');
    await KB.upsert(node);
    return { address, savedAt: now };
}

export async function getArweaveKeyfile() {
    try {
        const { KB } = await import('./kb.js');
        const node = await KB.getNode(ARWEAVE_WALLET_ID);
        if (node && node.type === ARWEAVE_WALLET_TYPE && node.content?.jwk) {
            return { jwk: node.content.jwk, address: node.content.address, savedAt: node.content.savedAt };
        }
    } catch (_) {}
    return null;
}

export async function clearArweaveKeyfile() {
    try {
        const { KB } = await import('./kb.js');
        await KB.deleteNode(ARWEAVE_WALLET_ID);
        return true;
    } catch (_) { return false; }
}

// ── Turbo Credits balance ──────────────────────────────────────────
//
// NOTA TÈCNICA · 2026-05-10 · El SDK @ardrive/turbo-sdk és Node-targeted
// i importa mòduls built-in (fs, path). Cap CDN universal (jsDelivr,
// esm.sh, unpkg, skypack) pot polyfillejar fs de manera fiable al browser.
//
// Estat actual:
//   - getTurboBalance/getTurboClient FALLEN silenciosament al browser
//   - getArweaveKeyfile + validate + save FUNCIONEN (puro crypto.subtle)
//   - El sprint pendent és bundlejar Turbo SDK localment via esbuild
//     i servir-lo com a /vendor/turbo-bundle.js
//
// MENTRESTANT · el publish real fallarà al browser · només funciona el
// 🧪 Mode test (mock) que ja existeix. Documentar a l'UI.

// Llista de fallbacks · provarem CDNs múltiples · el primer que funcioni
const TURBO_CDN_FALLBACKS = [
    'https://esm.sh/@ardrive/turbo-sdk@1.27.1?bundle&target=es2022',
    'https://esm.sh/@ardrive/turbo-sdk@1.27.1/web',
    'https://cdn.jsdelivr.net/npm/@ardrive/turbo-sdk@1.27.1/lib/web/index.js',
    'https://cdn.skypack.dev/@ardrive/turbo-sdk@1.27.1',
];

// UMD bundle pre-construit · es carrega via <script> tag · funciona al
// browser sense polyfilling fs (té-ho tot inline). Plan B si tot ESM falla.
const TURBO_UMD_BUNDLES = [
    'https://unpkg.com/@ardrive/turbo-sdk@1.27.1/bundles/web.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/@ardrive/turbo-sdk@1.27.1/bundles/web.bundle.min.js',
];

async function _loadTurboUMD() {
    if (typeof document === 'undefined') return null;
    if (window.TurboFactory || (window.turboSdk && window.turboSdk.TurboFactory)) {
        return window.turboSdk || { TurboFactory: window.TurboFactory };
    }
    for (const url of TURBO_UMD_BUNDLES) {
        try {
            await new Promise((resolve, reject) => {
                const existing = document.querySelector(`script[src="${url}"]`);
                if (existing) return resolve();
                const s = document.createElement('script');
                s.src = url;
                s.async = true;
                s.onload = () => resolve();
                s.onerror = (e) => reject(new Error('script onerror ' + url));
                document.head.appendChild(s);
            });
            // Donem temps a què el global aparegui
            for (let i = 0; i < 20; i++) {
                if (window.TurboFactory || (window.turboSdk && window.turboSdk.TurboFactory)) break;
                await new Promise(r => setTimeout(r, 100));
            }
            if (window.TurboFactory || (window.turboSdk && window.turboSdk.TurboFactory)) {
                console.info('[arweaveWalletService] Turbo SDK loaded as UMD from', url);
                return window.turboSdk || { TurboFactory: window.TurboFactory };
            }
        } catch (e) {
            console.warn('[arweaveWalletService] Turbo UMD fail at', url, '·', e?.message);
        }
    }
    return null;
}

async function _tryLoadTurbo() {
    let lastError = null;
    // Intent 0 · bundle local pre-build a /vendor/turbo-sdk.js (sprint H)
    //   Cal `npm install @ardrive/turbo-sdk esbuild --save-dev` i run
    //   `npm run build:turbo` un cop · genera el bundle a /vendor/.
    //   Si existeix, és el camí més fiable · zero deps externes runtime.
    try {
        const mod = await import('/vendor/turbo-sdk.js');
        if (mod && (mod.TurboFactory || mod.default)) {
            console.info('[arweaveWalletService] Turbo SDK loaded from LOCAL /vendor/turbo-sdk.js');
            return mod;
        }
    } catch (e) {
        // Local bundle no present · provem CDNs
    }
    // Intent 1 · ESM imports cascada
    for (const url of TURBO_CDN_FALLBACKS) {
        try {
            const mod = await import(url);
            if (mod && (mod.TurboFactory || mod.default)) {
                console.info('[arweaveWalletService] Turbo SDK loaded from ESM', url);
                return mod;
            }
        } catch (e) {
            lastError = e;
            console.warn('[arweaveWalletService] Turbo SDK CDN fail at', url, '·', e?.message);
        }
    }
    // Intent 2 · UMD via <script> tag (browser-only)
    try {
        const umd = await _loadTurboUMD();
        if (umd) return umd;
    } catch (e) {
        lastError = e;
    }
    throw new Error('No CDN Turbo SDK working from browser (ESM ni UMD) · ' + (lastError?.message || 'unknown') + ' · executa `npm run build:turbo` per al bundle local · o usa 🧪 Mode test mentre tant');
}

export async function getTurboBalance(jwk) {
    if (!jwk) return null;
    try {
        const mod = await _tryLoadTurbo();
        const factory = mod.TurboFactory || mod.default || mod;
        const client  = factory.authenticated
            ? factory.authenticated({ privateKey: jwk, token: 'arweave' })
            : null;
        if (!client) return null;
        const balance = await client.getBalance();
        const winc = Number(balance?.winc || balance || 0);
        const usdEquivalent = winc / 1e12;
        return { winc, usdEquivalent: Math.round(usdEquivalent * 100) / 100 };
    } catch (e) {
        console.warn('[arweaveWalletService] getTurboBalance failed', e?.message);
        return { winc: 0, usdEquivalent: 0, error: e?.message || 'Turbo SDK no carregable al browser' };
    }
}

// ── Helper · authenticated Turbo client ────────────────────────────

export async function getTurboClient(jwk) {
    if (!jwk) return null;
    const mod = await _tryLoadTurbo();
    const factory = mod.TurboFactory || mod.default || mod;
    if (!factory.authenticated) return null;
    return factory.authenticated({ privateKey: jwk, token: 'arweave' });
}

// =============================================================================
// WALLET-AUTH-001 sprint A · ArConnect/Wander extension auto-detect
//
// Permet a l'usuari connectar la seva extensió Wander/ArConnect en 1 click
// (sense haver d'exportar i pujar el JSON keyfile). Per a la fase alfa, ens
// limitem a:
//   - Detectar `window.arweaveWallet` (API estàndard ArConnect/Wander)
//   - Demanar permissions mínims (address + publicKey + signature + dispatch)
//   - Guardar address + publicKey al KB com a node `arweave_wallet_ext`
//   - Exposar `getActiveArweaveContext()` que retorna keyfile o extension
//
// L'upload via Turbo SDK amb signer extern (ArconnectSigner) queda per a
// sprint A2 · cal afegir @dha-team/arbundles al bundle. De moment l'extension
// és per LECTURA (mostrar address + saldo) i el keyfile JSON segueix sent
// el camí canònic per a publishes reals.
// =============================================================================

export const ARWEAVE_WALLET_EXT_TYPE = 'arweave_wallet_ext';
export const ARWEAVE_WALLET_EXT_ID   = 'sos-arweave-wallet-ext';   // singleton

// Permissions canòniques de Wander/ArConnect.
export const WANDER_PERMISSIONS = Object.freeze([
    'ACCESS_ADDRESS',
    'ACCESS_PUBLIC_KEY',
    'SIGN_TRANSACTION',
    'SIGNATURE',
    'DISPATCH',
]);

// Adaptador injectable per a tests · per defecte usa `window.arweaveWallet`
let _walletProvider = null;
export function setArweaveExtensionProvider(p) { _walletProvider = p; }
function _provider() {
    if (_walletProvider) return _walletProvider;
    if (typeof window !== 'undefined' && window.arweaveWallet) return window.arweaveWallet;
    return null;
}

// Detect simple · true si hi ha `window.arweaveWallet` disponible
export function isWanderAvailable() {
    return !!_provider();
}

// Connect · demana permissions i retorna { address, publicKey } o llança
export async function connectWander({ permissions = WANDER_PERMISSIONS, appInfo = { name: 'TeamTowers SOS V11' } } = {}) {
    const w = _provider();
    if (!w) throw new Error('Wander/ArConnect not available · install the extension first');
    if (typeof w.connect !== 'function') throw new Error('arweaveWallet.connect not a function · unexpected provider');
    await w.connect(permissions, appInfo);
    const address   = await w.getActiveAddress();
    let publicKey = null;
    try { publicKey = await w.getActivePublicKey(); } catch (_) { /* optional · some wallets skip */ }
    const now = Date.now();
    const node = {
        id:   ARWEAVE_WALLET_EXT_ID,
        type: ARWEAVE_WALLET_EXT_TYPE,
        content: {
            kind:        'arweave-wallet-ext',
            source:      'wander',
            address,
            publicKey,
            permissions: permissions.slice(),
            connectedAt: now,
            isPrimary:   true,
        },
        keywords:  ['type:arweave-wallet-ext', 'address:' + address, 'source:wander'],
        createdAt: now,
        updatedAt: now,
    };
    try {
        const { KB } = await import('./kb.js');
        await KB.upsert(node);
    } catch (e) {
        // No bloquegem la UI si la cache KB falla · l'usuari segueix amb sessió activa
        console.warn('[arweaveWalletService] persist connection failed', e?.message);
    }
    return { address, publicKey, source: 'wander', connectedAt: now };
}

// Disconnect · revoke permissions i esborra el node KB
export async function disconnectWander() {
    const w = _provider();
    if (w && typeof w.disconnect === 'function') {
        try { await w.disconnect(); } catch (_) {}
    }
    try {
        const { KB } = await import('./kb.js');
        await KB.deleteNode(ARWEAVE_WALLET_EXT_ID);
    } catch (_) {}
    return true;
}

// Recupera la connexió cacheada (sense tornar a demanar permissions)
export async function getWanderConnection() {
    try {
        const { KB } = await import('./kb.js');
        const node = await KB.getNode(ARWEAVE_WALLET_EXT_ID);
        if (node && node.type === ARWEAVE_WALLET_EXT_TYPE && node.content?.address) {
            return {
                address:     node.content.address,
                publicKey:   node.content.publicKey || null,
                source:      node.content.source || 'wander',
                connectedAt: node.content.connectedAt || null,
            };
        }
    } catch (_) {}
    return null;
}

// getActiveArweaveContext · resol l'identitat Arweave activa amb prioritat:
//   1. Extensió Wander cacheada (connectedAt més recent guanya si tots dos hi ha)
//   2. Keyfile JSON al KB
//   3. null
// El consumidor decideix què fer · per a publishes via Turbo SDK necessita jwk
// (en sprint A2 afegirem signer-via-extension).
export async function getActiveArweaveContext() {
    const [ext, kf] = await Promise.all([
        getWanderConnection(),
        getArweaveKeyfile(),
    ]);
    if (ext && kf) {
        // Triem el més recent
        const extAt = ext.connectedAt || 0;
        const kfAt  = kf.savedAt || 0;
        if (extAt >= kfAt) return { source: 'extension', address: ext.address, publicKey: ext.publicKey, jwk: null };
        return { source: 'keyfile', address: kf.address, publicKey: null, jwk: kf.jwk };
    }
    if (ext) return { source: 'extension', address: ext.address, publicKey: ext.publicKey, jwk: null };
    if (kf)  return { source: 'keyfile',   address: kf.address,  publicKey: null, jwk: kf.jwk };
    return null;
}

// WALLET-AUTH-001 sprint A2 · Turbo client via ArconnectSigner (Wander extension)
// El bundle local `/vendor/turbo-sdk.js` exposa ArconnectSigner re-exportat
// d'arbundles. La signer wrap `window.arweaveWallet` per signar transactions
// via l'extensió · zero JWK en memòria · l'usuari aprova cada signatura
// al popup de Wander.
export async function getTurboClientForExtension() {
    const w = _provider();
    if (!w) return null;
    const mod = await _tryLoadTurbo();
    const factory = mod.TurboFactory || mod.default || mod;
    if (!factory || !factory.authenticated) return null;
    const ArconnectSigner = mod.ArconnectSigner || (mod.default && mod.default.ArconnectSigner);
    if (!ArconnectSigner) {
        throw new Error('vendor/turbo-sdk.js no exposa ArconnectSigner · re-bundle amb sprint A2 entry');
    }
    const signer = new ArconnectSigner(w);
    // setPublicKey · ArconnectSigner ho fa lazy al primer sign, però ho avancem
    // per detectar errors aviat (extensió sense permission ACCESS_PUBLIC_KEY)
    if (typeof signer.setPublicKey === 'function') {
        try { await signer.setPublicKey(); } catch (e) {
            throw new Error('ArconnectSigner.setPublicKey failed · ' + (e?.message || 'unknown') + ' · confirma els permissions a Wander');
        }
    }
    return factory.authenticated({ signer, token: 'arweave' });
}
