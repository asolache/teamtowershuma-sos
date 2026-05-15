// =============================================================================
// TEAMTOWERS SOS V11 — BLOCKCHAIN ANCHOR SERVICE (CERT-001 pas 8 · Phase 2)
// Ruta · /js/core/blockchainAnchorService.js
//
// Bridge layer entre el ledger / pact / tokenomics i la blockchain (Polygon).
// PURE · zero web3 dependencies hardcoded · runner injectable · permet tests
// sense connexió. La implementació real (web3.js · ethers.js) es passa al
// runtime des de la view amb wallet integration (Wander · MetaMask).
//
// Pasos coberts per al fase 2 segons docs/PACT-BLOCKCHAIN-STRATEGY.md:
//
//   ANCHOR · per cada ledger entry significant (≥ THRESHOLD_EUR) · publicar
//     un hash canonical al contracte registry de Polygon · l'event és el
//     proof real triple-entry (polygon-txhash).
//
//   MINT ERC-1155 · per cada share holder (party del pacte) · mint shares
//     proporcionals al valuePointsRaw (slicing pie continu).
//
//   DISTRIBUTE · per a distribució de cash · proposal de transacció a la
//     Gnosis Safe del projecte · els socis amb shares > N% voten on-chain.
//
//   GOVERNANCE · pact amendments necessiten consens via Snapshot o Gnosis
//     Safe vote.
//
// Aquest servei NO conté el codi web3 real · sols les interfícies + helpers
// pure (canonical hash · prepare tx params · validate addresses · etc).
// Les implementacions reals viuran a /js/core/web3/ quan es deployin contracts.
// =============================================================================

import { canonicalizeNode } from './nodeSigningService.js';

export const BLOCKCHAIN_ANCHOR_VERSION = '0.1.0-phase2-stub';

// Networks suportades · Polygon mainnet + Mumbai testnet (per dev)
export const SUPPORTED_NETWORKS = Object.freeze({
    'polygon-mainnet': {
        chainId:    137,
        rpc:        'https://polygon-rpc.com',
        explorer:   'https://polygonscan.com',
        currency:   'MATIC',
        production: true,
    },
    'polygon-amoy': {           // Mumbai testnet successor
        chainId:    80002,
        rpc:        'https://rpc-amoy.polygon.technology',
        explorer:   'https://amoy.polygonscan.com',
        currency:   'MATIC',
        production: false,
    },
});

// Contractes deployats · placeholder addresses · cal substituir al deploy real
// Mantingu·t aquí per a configuració central · l'usuari pot override al runtime.
export const CONTRACT_ADDRESSES = Object.freeze({
    'polygon-mainnet': {
        ledgerRegistry: '0x0000000000000000000000000000000000000000',     // TBD · deploy fase 2
        sliciingPie:    '0x0000000000000000000000000000000000000000',     // ERC-1155
        pactNFT:        '0x0000000000000000000000000000000000000000',     // ERC-1155 tokenId=1
    },
    'polygon-amoy': {
        ledgerRegistry: '0x0000000000000000000000000000000000000000',     // TBD · testnet deploy
        sliciingPie:    '0x0000000000000000000000000000000000000000',
        pactNFT:        '0x0000000000000000000000000000000000000000',
    },
});

// =============================================================================
// CANONICAL HASH · pure · per a anchor de qualsevol node SOS
// =============================================================================

// computeCanonicalHash · pure · keccak256-ish del node canonical
// Per al stub usem SHA-256 (Web Crypto · ja disponible al sistema) · al
// deploy real es substituirà per keccak256 (Polygon native hash).
//
// args · node SOS
// Retorna · async string '0x...' hex
export async function computeCanonicalHash(node) {
    if (!node) throw new Error('node required');
    const canonical = canonicalizeNode(node);
    // Si Web Crypto no disponible (Node test) · simulem amb hash determinístic
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
        const enc = new TextEncoder().encode(canonical);
        const buf = await crypto.subtle.digest('SHA-256', enc);
        return '0x' + Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback determinístic per a tests Node · simple hash
    return '0x' + _simpleHash(canonical);
}

// _simpleHash · fallback per a tests · NO usar en producció
function _simpleHash(s) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < s.length; i++) {
        const ch = s.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

// =============================================================================
// PREPARE TX PARAMS · pure · construeix paràmetres per a wallet send
// La view ho passa a wallet runtime (Wander · MetaMask · etc).
// =============================================================================

// prepareAnchorLedgerEntryTx · pure · retorna tx params per a anchor d'un
// ledger entry al registry contract.
//
// args ·
//   entry           · ledger_entry node
//   canonicalHash   · '0x...' hex computat per computeCanonicalHash
//   network         · 'polygon-mainnet' | 'polygon-amoy'
//   contractAddress · opcional override · default CONTRACT_ADDRESSES[network].ledgerRegistry
//
// Retorna · {
//   chainId, to (contractAddress), method, args, value, network, explorer
// }
//
// L'estil és wallet-agnostic · la view tradueix a ethers/web3 segons wallet.
export function prepareAnchorLedgerEntryTx({
    entry           = null,
    canonicalHash   = null,
    network         = 'polygon-amoy',
    contractAddress = null,
} = {}) {
    if (!entry || !entry.id) throw new Error('entry required');
    if (!canonicalHash || !canonicalHash.startsWith('0x')) throw new Error('canonicalHash (0x...) required');
    const net = SUPPORTED_NETWORKS[network];
    if (!net) throw new Error('unsupported network · ' + network);
    const addr = contractAddress || CONTRACT_ADDRESSES[network]?.ledgerRegistry;
    if (!addr) throw new Error('contract address missing for ' + network);

    return {
        chainId:   net.chainId,
        to:        addr,
        method:    'anchorLedgerEntry(string,bytes32)',
        args:      [entry.id, canonicalHash],
        value:     0,
        network,
        explorer:  net.explorer,
        gasHint:   'low',           // < 0.01 USD a Polygon
    };
}

// prepareMintSharesTx · pure · per ERC-1155 mint de slicing pie shares
//
// args ·
//   projectId · id project (tokenId derivat)
//   recipientAddress · 0x... · de qui rep les shares
//   amount · BigInt-compatible · usar string per a precisió
//   network · default 'polygon-amoy'
//   contractAddress · opcional
export function prepareMintSharesTx({
    projectId        = null,
    recipientAddress = null,
    amount           = null,
    network          = 'polygon-amoy',
    contractAddress  = null,
} = {}) {
    if (!projectId) throw new Error('projectId required');
    if (!recipientAddress || !isValidAddress(recipientAddress)) throw new Error('recipientAddress (0x... 40 hex) required');
    if (amount == null) throw new Error('amount required');
    const net = SUPPORTED_NETWORKS[network];
    if (!net) throw new Error('unsupported network · ' + network);
    const addr = contractAddress || CONTRACT_ADDRESSES[network]?.sliciingPie;
    if (!addr) throw new Error('contract address missing for ' + network);

    // tokenId derivat del projectId · keccak256-like hash → uint256
    const tokenId = _projectIdToTokenId(projectId);
    return {
        chainId:   net.chainId,
        to:        addr,
        method:    'mint(address,uint256,uint256,bytes)',
        args:      [recipientAddress, tokenId, String(amount), '0x'],
        value:     0,
        network,
        explorer:  net.explorer,
        gasHint:   'medium',
    };
}

// prepareDistributeTx · pure · construeix proposal de tx per a Gnosis Safe ·
// distribució de cash segons slicing pie · per a votar on-chain.
//
// args ·
//   safeAddress  · 0x... Gnosis Safe del projecte
//   recipientAddress · 0x... beneficiari
//   amountWei · BigInt-compatible · MATIC wei
//   network · default 'polygon-amoy'
//   description · text breu (proposal metadata)
export function prepareDistributeTx({
    safeAddress      = null,
    recipientAddress = null,
    amountWei        = null,
    network          = 'polygon-amoy',
    description      = '',
} = {}) {
    if (!safeAddress || !isValidAddress(safeAddress))      throw new Error('safeAddress (0x... 40 hex) required');
    if (!recipientAddress || !isValidAddress(recipientAddress)) throw new Error('recipientAddress required');
    if (amountWei == null)                                  throw new Error('amountWei required');
    const net = SUPPORTED_NETWORKS[network];
    if (!net) throw new Error('unsupported network · ' + network);
    return {
        chainId:     net.chainId,
        safe:        safeAddress,
        to:          recipientAddress,
        method:      'transfer (native MATIC)',
        value:       String(amountWei),
        data:        '0x',
        description: String(description).slice(0, 200),
        network,
        explorer:    net.explorer,
        kind:        'safe-proposal',     // executor ha de pujar via Safe SDK
        gasHint:     'medium',
    };
}

// =============================================================================
// VALIDATION · pure
// =============================================================================

// isValidAddress · pure · check d'address EVM (0x + 40 hex)
export function isValidAddress(addr) {
    return typeof addr === 'string' && /^0x[0-9a-fA-F]{40}$/.test(addr);
}

// isValidTxHash · pure · check de tx hash format
export function isValidTxHash(hash) {
    return typeof hash === 'string' && /^0x[0-9a-fA-F]{64}$/.test(hash);
}

// =============================================================================
// LINK PROOF · pure · construeix proof object per addProofToEntry
// =============================================================================

// buildPolygonTxProof · pure · genera proof per a addProofToEntry
//   kind: 'polygon-txhash'
//   value: txHash · ja signat per Polygon nodes
export function buildPolygonTxProof({ txHash, signerDid = null, network = 'polygon-amoy' } = {}) {
    if (!isValidTxHash(txHash)) throw new Error('txHash invalid · cal 0x + 64 hex');
    const net = SUPPORTED_NETWORKS[network];
    return {
        kind:     'polygon-txhash',
        value:    txHash,
        signedBy: signerDid,
        signedAt: new Date().toISOString(),
        network,
        explorerUrl: net ? (net.explorer + '/tx/' + txHash) : null,
    };
}

// =============================================================================
// ESTIMATE COST · pure · estimació USD basat en gas hint
// =============================================================================

// estimateGasUsd · pure · estimat per gas hint · útil per a UI
// (Polygon és barat · però mostrem-ho per transparència)
export function estimateGasUsd(gasHint) {
    const COSTS = {
        low:    0.001,
        medium: 0.005,
        high:   0.02,
    };
    return COSTS[gasHint] || 0.005;
}

// =============================================================================
// INTERNAL · projectId → tokenId mapping
// =============================================================================

function _projectIdToTokenId(projectId) {
    // Simple deterministic mapping · projectId string → uint256
    // Per al stub · sumatori dels char codes · al deploy real keccak256(projectId)
    let hash = 0;
    for (let i = 0; i < projectId.length; i++) {
        hash = (hash * 31 + projectId.charCodeAt(i)) | 0;
    }
    return String(Math.abs(hash));
}

// =============================================================================
// STATUS · per a UI · sap si una entry té anchor on-chain
// =============================================================================

// hasPolygonAnchor · pure · check si l'entry té proof polygon-txhash
export function hasPolygonAnchor(entry) {
    const proofs = entry?.content?.proofs || [];
    return proofs.some(p => p.kind === 'polygon-txhash');
}

// getPolygonTxHash · pure · retorna el primer txHash polygon · null si cap
export function getPolygonTxHash(entry) {
    const proofs = entry?.content?.proofs || [];
    const found = proofs.find(p => p.kind === 'polygon-txhash');
    return found ? found.value : null;
}
