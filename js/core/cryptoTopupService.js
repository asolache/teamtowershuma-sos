// =============================================================================
// TEAMTOWERS SOS V11 — CRYPTO TOPUP SERVICE (v125 · backend prep)
// Ruta · /js/core/cryptoTopupService.js
//
// Backend per a recàrregues del wallet del projecte amb stablecoins (USDC ·
// USDT · DAI) o cripto convertible a stable (BTC · ETH · MATIC · etc · auto-swap
// via DEX aggregator) · sense UI encara (la UI ve a v126).
//
// Estratègia · KISS · 1 fitxer · sense dependències exteres ·
//   ─ catàleg de chains/tokens suportats (USDC@Polygon · USDC@Gnosis · etc)
//   ─ deposit intent · genera adreça + amount + chain · pendent fins detecció
//   ─ price quote · fetch via stub-mode pluggable (real fetch quan v126)
//   ─ confirm intent · valida tx hash + crèdit wallet via walletService.topUpWallet
//   ─ convert quote · per a cripto no-stable · calcula amount equivalent EUR
//
// Tot el state viu al KB · type='crypto_topup_intent' · ningú mai dels keys
// privats · el deposit address és la del usuari (ja existent al seu wallet
// Wander/MetaMask/Gnosis Safe).
// =============================================================================

import { KB } from './kb.js';
import { topUpWallet, persistWallet, getOrCreateWalletForProject } from './walletService.js';

export const CRYPTO_TOPUP_VERSION = 'v1.0';

// ─── Catàleg · chains + tokens suportats ────────────────────────────────
// `stable` · true = tracked 1:1 amb USD/EUR · false = requereix quote
// `decimals` · ERC-20 standard · USDC = 6 · ETH = 18 · WBTC = 8
export const SUPPORTED_TOKENS = Object.freeze({
    // ── Stables on Polygon (favorit · fees baixes) ─────────────────────
    'USDC-Polygon': {
        symbol: 'USDC', chain: 'polygon', chainId: 137,
        stable: true, decimals: 6, peg: 'USD',
        contract: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        rpcCandidates: ['https://polygon-rpc.com', 'https://rpc.ankr.com/polygon'],
        explorerTxBase: 'https://polygonscan.com/tx/',
        gasEstimateUsd: 0.05,
    },
    'USDT-Polygon': {
        symbol: 'USDT', chain: 'polygon', chainId: 137,
        stable: true, decimals: 6, peg: 'USD',
        contract: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        rpcCandidates: ['https://polygon-rpc.com'],
        explorerTxBase: 'https://polygonscan.com/tx/',
        gasEstimateUsd: 0.05,
    },
    'DAI-Polygon': {
        symbol: 'DAI', chain: 'polygon', chainId: 137,
        stable: true, decimals: 18, peg: 'USD',
        contract: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
        rpcCandidates: ['https://polygon-rpc.com'],
        explorerTxBase: 'https://polygonscan.com/tx/',
        gasEstimateUsd: 0.05,
    },
    // ── Stables on Gnosis (cooperative-friendly · 0 gas pràcticament) ──
    'USDC-Gnosis': {
        symbol: 'USDC', chain: 'gnosis', chainId: 100,
        stable: true, decimals: 6, peg: 'USD',
        contract: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83',
        rpcCandidates: ['https://rpc.gnosischain.com'],
        explorerTxBase: 'https://gnosisscan.io/tx/',
        gasEstimateUsd: 0.001,
    },
    'XDAI-Gnosis': {
        symbol: 'xDAI', chain: 'gnosis', chainId: 100,
        stable: true, decimals: 18, peg: 'USD',
        contract: 'native',   // xDAI és la native coin
        rpcCandidates: ['https://rpc.gnosischain.com'],
        explorerTxBase: 'https://gnosisscan.io/tx/',
        gasEstimateUsd: 0.001,
    },
    // ── Cripto convertible (NO stable · quote dinàmic + swap recomanat) ─
    'ETH-Mainnet': {
        symbol: 'ETH', chain: 'ethereum', chainId: 1,
        stable: false, decimals: 18, peg: null,
        contract: 'native',
        rpcCandidates: ['https://eth.llamarpc.com', 'https://rpc.ankr.com/eth'],
        explorerTxBase: 'https://etherscan.io/tx/',
        gasEstimateUsd: 3.50,
        swapHint: 'Convert via Uniswap/1inch → USDC abans del deposit per estalviar fees',
    },
    'WBTC-Polygon': {
        symbol: 'WBTC', chain: 'polygon', chainId: 137,
        stable: false, decimals: 8, peg: null,
        contract: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
        rpcCandidates: ['https://polygon-rpc.com'],
        explorerTxBase: 'https://polygonscan.com/tx/',
        gasEstimateUsd: 0.05,
    },
    'MATIC-Polygon': {
        symbol: 'MATIC', chain: 'polygon', chainId: 137,
        stable: false, decimals: 18, peg: null,
        contract: 'native',
        rpcCandidates: ['https://polygon-rpc.com'],
        explorerTxBase: 'https://polygonscan.com/tx/',
        gasEstimateUsd: 0.02,
    },
});

export const TOKEN_IDS = Object.freeze(Object.keys(SUPPORTED_TOKENS));
export const STABLE_TOKEN_IDS = Object.freeze(TOKEN_IDS.filter(k => SUPPORTED_TOKENS[k].stable));

export function listTokens({ stableOnly = false, chain = null } = {}) {
    let ids = TOKEN_IDS.slice();
    if (stableOnly)  ids = ids.filter(k => SUPPORTED_TOKENS[k].stable);
    if (chain)       ids = ids.filter(k => SUPPORTED_TOKENS[k].chain === chain);
    return ids.map(id => ({ id, ...SUPPORTED_TOKENS[id] }));
}

export function getToken(id) {
    const t = SUPPORTED_TOKENS[id];
    return t ? { id, ...t } : null;
}

// ─── Price quote · pluggable (stub per defecte · real fetch a v126) ─────
// Per a stables · retorna fxRate fix (1 USDC = 0.92 EUR per defecte ·
// configurable via opts.eurUsdRate). Per a no-stable · requereix una
// `priceFetcher` async (mock per defecte retorna preus hardcoded raonables
// per a tests · v126 cablejarà CoinGecko o similar).
const STUB_PRICES_USD = Object.freeze({
    ETH:  3500,
    WBTC: 95000,
    BTC:  95000,
    MATIC: 0.55,
    USDC: 1.0, USDT: 1.0, DAI: 1.0, xDAI: 1.0,
});

export async function quoteToEur({
    tokenId,
    amountToken,
    eurUsdRate = 0.92,
    priceFetcher = null,
} = {}) {
    const t = getToken(tokenId);
    if (!t) throw new Error('quoteToEur · unknown tokenId: ' + tokenId);
    if (!Number.isFinite(amountToken) || amountToken <= 0) throw new Error('quoteToEur · amountToken must be > 0');

    let priceUsd;
    if (t.stable) {
        priceUsd = 1.0;       // assumim peg perfecte · safe per a stables top-tier
    } else if (typeof priceFetcher === 'function') {
        const fetched = await priceFetcher({ symbol: t.symbol, tokenId });
        if (!Number.isFinite(fetched) || fetched <= 0) throw new Error('quoteToEur · priceFetcher returned invalid: ' + fetched);
        priceUsd = fetched;
    } else {
        priceUsd = STUB_PRICES_USD[t.symbol];
        if (!priceUsd) throw new Error('quoteToEur · no stub price for ' + t.symbol + ' · provide priceFetcher');
    }
    const valueUsd = priceUsd * amountToken;
    const valueEur = valueUsd * eurUsdRate;
    return {
        tokenId,
        amountToken,
        priceUsd,
        valueUsd:        Number(valueUsd.toFixed(6)),
        valueEur:        Number(valueEur.toFixed(6)),
        eurUsdRate,
        gasEstimateUsd:  t.gasEstimateUsd || 0,
        gasEstimateEur:  Number(((t.gasEstimateUsd || 0) * eurUsdRate).toFixed(4)),
        netEur:          Number((valueEur - (t.gasEstimateUsd || 0) * eurUsdRate).toFixed(4)),
        stable:          t.stable,
        ts:              Date.now(),
    };
}

// ─── Deposit intent · genera nodo KB amb estat 'pending' ────────────────
export const CRYPTO_INTENT_TYPE = 'crypto_topup_intent';
export const INTENT_STATUSES = Object.freeze(['pending', 'confirmed', 'expired', 'failed']);

export function buildDepositIntent({
    projectId,
    tokenId,
    amountToken,
    depositAddress,
    expectedEur,
    expiryMinutes = 60,
    note = '',
} = {}) {
    if (!projectId)                throw new Error('buildDepositIntent · projectId required');
    if (!tokenId || !SUPPORTED_TOKENS[tokenId]) throw new Error('buildDepositIntent · invalid tokenId');
    if (!Number.isFinite(amountToken) || amountToken <= 0) throw new Error('buildDepositIntent · amountToken > 0');
    if (!depositAddress)           throw new Error('buildDepositIntent · depositAddress required');
    if (!Number.isFinite(expectedEur) || expectedEur < 0) throw new Error('buildDepositIntent · expectedEur >= 0');

    const now = Date.now();
    const id  = 'crypto-intent-' + projectId + '-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const expiresAt = now + (expiryMinutes * 60_000);
    return {
        id,
        type: CRYPTO_INTENT_TYPE,
        content: {
            projectId,
            tokenId,
            amountToken,
            depositAddress,
            expectedEur,
            expiryMinutes,
            expiresAt,
            createdAt: now,
            status: 'pending',
            txHash: null,
            confirmedAt: null,
            confirmedAmountEur: null,
            note,
        },
    };
}

export async function createDepositIntent(args) {
    const node = buildDepositIntent(args);
    await KB.upsert(node);
    return node;
}

export async function listDepositIntents({ projectId = null, status = null } = {}) {
    const all = (await KB.query?.({ type: CRYPTO_INTENT_TYPE })) || [];
    return all.filter(n => {
        if (projectId && n.content?.projectId !== projectId) return false;
        if (status    && n.content?.status    !== status)    return false;
        return true;
    });
}

// expirePendingIntents · marca expired si expiresAt < now · idempotent
export async function expirePendingIntents() {
    const now = Date.now();
    const pending = await listDepositIntents({ status: 'pending' });
    let expired = 0;
    for (const n of pending) {
        if ((n.content?.expiresAt || 0) < now) {
            n.content.status = 'expired';
            await KB.upsert(n);
            expired++;
        }
    }
    return { expired };
}

// ─── Confirm intent · crèdit al wallet ───────────────────────────────────
// txHash · hash de la tx blockchain · per a auditoria (no es verifica RPC
// aquí · v126 cablejarà el RPC verify · ara confiem que el caller ja ha
// validat). En MOCK mode tot passa.
export async function confirmDepositIntent({
    intentId,
    txHash,
    actualAmountToken = null,    // si l'usuari ha enviat exactament l'amount o un altre
    priceFetcher = null,
    eurUsdRate = 0.92,
} = {}) {
    if (!intentId) throw new Error('confirmDepositIntent · intentId required');
    if (!txHash || typeof txHash !== 'string' || txHash.length < 10) {
        throw new Error('confirmDepositIntent · invalid txHash');
    }
    const intent = await KB.getNode(intentId);
    if (!intent || intent.type !== CRYPTO_INTENT_TYPE) throw new Error('confirmDepositIntent · intent not found');
    if (intent.content?.status !== 'pending') throw new Error('confirmDepositIntent · intent not pending (status=' + intent.content?.status + ')');

    // Re-quote si l'amount actual difereix de l'expected (o usar expected si null)
    const amt = Number.isFinite(actualAmountToken) ? actualAmountToken : intent.content.amountToken;
    const quote = await quoteToEur({ tokenId: intent.content.tokenId, amountToken: amt, priceFetcher, eurUsdRate });
    const creditedEur = Number(quote.netEur.toFixed(4));
    if (creditedEur <= 0) throw new Error('confirmDepositIntent · creditedEur <= 0 (gas exceeded value)');

    // Top-up del wallet del projecte
    const wallet  = await getOrCreateWalletForProject(intent.content.projectId);
    const updated = topUpWallet({
        wallet, amountEur: creditedEur,
        source: 'crypto:' + intent.content.tokenId,
        ref:    'crypto-' + txHash.slice(0, 12),
        note:   `${amt} ${intent.content.tokenId} · tx ${txHash}` + (intent.content.note ? ` · ${intent.content.note}` : ''),
    });
    await persistWallet(updated);

    // Marca intent confirmed
    intent.content.status = 'confirmed';
    intent.content.txHash = txHash;
    intent.content.confirmedAt = Date.now();
    intent.content.confirmedAmountEur = creditedEur;
    intent.content.confirmedAmountToken = amt;
    intent.content.priceQuote = quote;
    await KB.upsert(intent);

    return { ok: true, creditedEur, intent };
}

// failDepositIntent · marca failed amb reason · per a auditoria
export async function failDepositIntent({ intentId, reason = '' } = {}) {
    const intent = await KB.getNode(intentId);
    if (!intent || intent.type !== CRYPTO_INTENT_TYPE) throw new Error('failDepositIntent · intent not found');
    intent.content.status = 'failed';
    intent.content.failedAt = Date.now();
    intent.content.failureReason = reason || 'unspecified';
    await KB.upsert(intent);
    return { ok: true };
}

// ─── Helpers UI · agrupació + format ─────────────────────────────────────
export function intentSummary(intent) {
    if (!intent || !intent.content) return null;
    const c = intent.content;
    const tok = getToken(c.tokenId);
    return {
        id:              intent.id,
        projectId:       c.projectId,
        token:           tok?.symbol || c.tokenId,
        chain:           tok?.chain  || 'unknown',
        amountToken:     c.amountToken,
        expectedEur:     c.expectedEur,
        confirmedEur:    c.confirmedAmountEur,
        status:          c.status,
        depositAddress:  c.depositAddress,
        explorerLink:    c.txHash && tok?.explorerTxBase ? (tok.explorerTxBase + c.txHash) : null,
        createdAt:       c.createdAt,
        expiresAt:       c.expiresAt,
        confirmedAt:     c.confirmedAt,
        secondsToExpiry: Math.max(0, Math.floor(((c.expiresAt || 0) - Date.now()) / 1000)),
    };
}

// Pure helpers exposed per a tests/UX
export const __test_helpers__ = { STUB_PRICES_USD };
