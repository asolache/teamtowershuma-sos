// =============================================================================
// TEAMTOWERS SOS V11 — CONNECT SALE SERVICE (CANONICAL-001 sprint A)
//
// Tanca el gap identificat al PR-B audit · cada compra via Stripe Connect
// (product checkout) ha de registrar 3 nodes/movements al KB:
//   1. buyer wallet · consume del priceEur (debit)
//   2. SOS platform wallet · topup del feeEur (8% default · category 'connect-platform-fee')
//   3. seller wallet · topup del (priceEur - feeEur) (category 'connect-seller')
//
// + un node `connect_sale` que serveix com a attestation (triple-entry).
//
// Filosofia · alineat amb 4 principis canònics:
//   1. Tot són nodes · connect_sale + 3 wallet movements registrats
//   2. Tota aportació es comptabilitza · 0 transfers ocults
//   3. Stakeholders pool · si el seller té distribution_rule, el seu wallet
//      crida `recordIncomeAndDistribute` automàticament (sprint B)
//   4. TEA · attestation pre-construïda · firmar amb ECDSA opcional (sprint B)
// =============================================================================

import {
    PLATFORM_WALLET_PROJECT_ID, DEFAULT_PLATFORM_FEE_PCT,
} from './canonicalPrinciples.js';

// CONNECT_SALE_TYPE · node type canònic
export const CONNECT_SALE_TYPE = 'connect_sale';

// computeConnectSaleSplit · pure · retorna { priceEur, feeEur, sellerEur, platformFeePct }
// El feeEur s'arrodoneix a 4 decimals · sellerEur = priceEur - feeEur exacte.
export function computeConnectSaleSplit({ priceEur, platformFeePct = DEFAULT_PLATFORM_FEE_PCT } = {}) {
    if (typeof priceEur !== 'number' || !isFinite(priceEur) || priceEur <= 0) {
        throw new Error('computeConnectSaleSplit · priceEur must be > 0');
    }
    if (typeof platformFeePct !== 'number' || platformFeePct < 0 || platformFeePct >= 100) {
        throw new Error('computeConnectSaleSplit · platformFeePct must be in [0, 100)');
    }
    const feeEur = Number((priceEur * (platformFeePct / 100)).toFixed(4));
    const sellerEur = Number((priceEur - feeEur).toFixed(4));
    return { priceEur, feeEur, sellerEur, platformFeePct };
}

// buildConnectSaleNode · pure · construeix el node attestation
// Camps content · totes les dades safe (sense card · sense PII)
//   { sessionId, productId, productTitle, buyerWalletId, sellerWalletId,
//     priceEur, feeEur, sellerEur, platformFeePct, stripeAccountId,
//     timestamp, signatureFormat, signature:null }
export function buildConnectSaleNode({
    sessionId,
    productId,
    productTitle = '',
    buyerWalletId,
    sellerWalletId,
    priceEur,
    platformFeePct = DEFAULT_PLATFORM_FEE_PCT,
    stripeAccountId = null,
    timestamp = Date.now(),
} = {}) {
    if (!sessionId)       throw new Error('buildConnectSaleNode requires sessionId');
    if (!buyerWalletId)   throw new Error('buildConnectSaleNode requires buyerWalletId');
    if (!sellerWalletId)  throw new Error('buildConnectSaleNode requires sellerWalletId');
    if (!productId)       throw new Error('buildConnectSaleNode requires productId');
    const split = computeConnectSaleSplit({ priceEur, platformFeePct });
    return {
        id:   'connect-sale-' + sessionId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 48),
        type: CONNECT_SALE_TYPE,
        content: {
            sessionId,
            productId,
            productTitle: String(productTitle || '').slice(0, 120),
            buyerWalletId,
            sellerWalletId,
            platformWalletId: PLATFORM_WALLET_PROJECT_ID,
            priceEur:        split.priceEur,
            feeEur:          split.feeEur,
            sellerEur:       split.sellerEur,
            platformFeePct:  split.platformFeePct,
            stripeAccountId,
            timestamp,
            signatureFormat: 'ECDSA-P256-SHA256-base64',
            signature:       null,    // TEA · firmar opcional (sprint B)
        },
        keywords: [
            'type:connect-sale',
            'productId:' + productId,
            'buyer:' + buyerWalletId,
            'seller:' + sellerWalletId,
            'session:' + sessionId.slice(0, 20),
        ],
        createdAt: timestamp,
        updatedAt: timestamp,
    };
}

// recordConnectSale · async · executa el flow complet de 3 movements + node
//   { sessionId, productId, productTitle, buyerProjectId, sellerProjectId,
//     priceEur, platformFeePct?, stripeAccountId?, kb, walletApi? }
// Retorna · { sale, buyerMovement, platformMovement, sellerMovement,
//             receipts: [...] }
export async function recordConnectSale({
    sessionId,
    productId,
    productTitle = '',
    buyerProjectId,
    sellerProjectId,
    priceEur,
    platformFeePct = DEFAULT_PLATFORM_FEE_PCT,
    stripeAccountId = null,
    kb = null,
    walletApi = null,         // injectable per a tests
    receiptApi = null,        // injectable per a tests
} = {}) {
    if (!buyerProjectId)  throw new Error('recordConnectSale requires buyerProjectId');
    if (!sellerProjectId) throw new Error('recordConnectSale requires sellerProjectId');
    const split = computeConnectSaleSplit({ priceEur, platformFeePct });

    // 1 · Build attestation node
    const buyerWalletId  = 'wallet-' + buyerProjectId;
    const sellerWalletId = 'wallet-' + sellerProjectId;
    const sale = buildConnectSaleNode({
        sessionId, productId, productTitle,
        buyerWalletId, sellerWalletId,
        priceEur, platformFeePct, stripeAccountId,
    });

    // Default walletApi · usa walletService si no s'injecta
    const wApi = walletApi || await (async () => {
        const w = await import('./walletService.js');
        return {
            consumeAndPersist: w.consumeAndPersist,
            topUpAndPersist:   w.topUpAndPersist,
        };
    })();
    // Default receiptApi · usa receiptService
    const rApi = receiptApi || await (async () => {
        const r = await import('./receiptService.js');
        return { recordReceipt: r.recordReceipt };
    })();

    // 2 · Debit buyer wallet
    const ref = 'connect-sale-' + sessionId.slice(0, 20);
    const buyerMovement = await wApi.consumeAndPersist({
        projectId: buyerProjectId,
        amountEur: split.priceEur,
        ref,
        source: 'connect-buyer',
        note: 'Compra Stripe Connect · ' + (productTitle || productId),
    });

    // 3 · Topup SOS platform wallet amb fee
    const platformMovement = (split.feeEur > 0)
        ? await wApi.topUpAndPersist({
            projectId: PLATFORM_WALLET_PROJECT_ID,
            amountEur: split.feeEur,
            ref,
            source: 'connect-platform-fee',
            note: 'Fee Stripe Connect ' + split.platformFeePct + '% · session ' + sessionId.slice(0, 20),
        })
        : null;

    // 4 · Topup seller wallet amb net
    const sellerMovement = await wApi.topUpAndPersist({
        projectId: sellerProjectId,
        amountEur: split.sellerEur,
        ref,
        source: 'connect-seller',
        note: 'Venda Stripe Connect · ' + (productTitle || productId),
    });

    // 5 · Persist attestation + buyer receipt
    const receipts = [];
    if (kb && typeof kb.upsert === 'function') {
        try { await kb.upsert(sale); } catch (e) { console.warn('[connect-sale] node persist', e?.message); }
    }
    if (rApi && typeof rApi.recordReceipt === 'function') {
        try {
            const receipt = await rApi.recordReceipt({
                topupRef:      ref,
                sessionId,
                amountEur:     split.priceEur,
                currency:      'eur',
                paymentMethod: 'stripe-connect',
                lineItems:     [{ description: productTitle || productId, amountEur: split.priceEur }],
            });
            if (receipt) receipts.push(receipt);
        } catch (e) { console.warn('[connect-sale] receipt persist', e?.message); }
    }

    return { sale, buyerMovement, platformMovement, sellerMovement, receipts };
}
