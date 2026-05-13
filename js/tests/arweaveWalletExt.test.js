// WALLET-AUTH-001 sprint A · tests stand-alone per arweaveWalletService Wander helpers.
// Mock-ing window.arweaveWallet via setArweaveExtensionProvider.
// Ús: node js/tests/arweaveWalletExt.test.js

import * as svc from '../core/arweaveWalletService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== WALLET-AUTH-001 sprint A · arweaveWalletService Wander ===\n');

// ─── Mock provider · simula window.arweaveWallet (Wander) ────────────────
let _connectCalls = 0;
let _disconnectCalls = 0;
let _connected = false;
const mockAddress   = '4Q8m5tEXTFm7N0v2zQ8Yp0hOX-7r9Lc2Y7Q3vUKjGRk';   // 43 chars base64url
const mockPublicKey = 'AAAA-fakeRSAModulus';
const mockProvider = {
    connect: async (perms, appInfo) => {
        _connectCalls++;
        _connected = true;
        return undefined;
    },
    disconnect: async () => {
        _disconnectCalls++;
        _connected = false;
    },
    getActiveAddress: async () => {
        if (!_connected) throw new Error('not connected');
        return mockAddress;
    },
    getActivePublicKey: async () => {
        if (!_connected) throw new Error('not connected');
        return mockPublicKey;
    },
};

// ─── Mock KB · in-memory · per evitar dependencia d'IndexedDB ─────────────
const _kbStore = new Map();
const mockKB = {
    init:   async () => {},
    upsert: async (node) => { _kbStore.set(node.id, node); return node; },
    getNode:async (id)   => _kbStore.get(id) || null,
    deleteNode: async (id) => _kbStore.delete(id),
    query:  async (q) => Array.from(_kbStore.values()).filter(n => !q.type || n.type === q.type),
};
// Injectem via module loader-style · com no podem hot-swap imports a node,
// usem un truc: setem `globalThis._SOS_KB_MOCK` i monkey-patchem dins els
// tests on calgui. Per al servei real, fem el seguiment via setProvider +
// validem que la promesa segueix retornant l'output esperat.
//
// SIMPLIFICACIÓ · com el KB import és dinàmic, en cas de fallar el KB el
// servei warn + segueix (`console.warn`). Aprofitem aquesta tolerància:
// llencem els tests sense KB real i validem que els valors retornats
// per `connectWander` són correctes sense haver de seurar el KB.

// ─── Tests ───────────────────────────────────────────────────────────────

// 1 · isWanderAvailable false sense provider
svc.setArweaveExtensionProvider(null);
t(svc.isWanderAvailable() === false,                                  'A · sense provider · isWanderAvailable false');

// 2 · setArweaveExtensionProvider activa la detecció
svc.setArweaveExtensionProvider(mockProvider);
t(svc.isWanderAvailable() === true,                                   'A · amb mock provider · isWanderAvailable true');

// 3 · WANDER_PERMISSIONS conté els 5 permissions canònics
t(Array.isArray(svc.WANDER_PERMISSIONS) && svc.WANDER_PERMISSIONS.length === 5, 'A · WANDER_PERMISSIONS · 5 entrades');
t(svc.WANDER_PERMISSIONS.includes('ACCESS_ADDRESS'),                  'A · permission · ACCESS_ADDRESS');
t(svc.WANDER_PERMISSIONS.includes('SIGN_TRANSACTION'),                'A · permission · SIGN_TRANSACTION');
t(svc.WANDER_PERMISSIONS.includes('DISPATCH'),                        'A · permission · DISPATCH');

// 4 · connectWander · retorna address + publicKey
const conn = await svc.connectWander();
eq(conn.address,   mockAddress,                                       'B · connectWander · address correcta');
eq(conn.publicKey, mockPublicKey,                                     'B · connectWander · publicKey correcta');
eq(conn.source,    'wander',                                          'B · connectWander · source = wander');
t(typeof conn.connectedAt === 'number' && conn.connectedAt > 0,       'B · connectWander · connectedAt timestamp');
eq(_connectCalls,  1,                                                 'B · provider.connect cridat 1 cop');

// 5 · ARWEAVE_WALLET_EXT_TYPE/ID exportats
t(typeof svc.ARWEAVE_WALLET_EXT_TYPE === 'string',                    'C · ARWEAVE_WALLET_EXT_TYPE exportat');
t(typeof svc.ARWEAVE_WALLET_EXT_ID   === 'string',                    'C · ARWEAVE_WALLET_EXT_ID exportat');

// 6 · disconnectWander · crida provider.disconnect
const ok = await svc.disconnectWander();
eq(ok,             true,                                              'D · disconnectWander · true');
eq(_disconnectCalls, 1,                                               'D · provider.disconnect cridat 1 cop');

// 7 · Sense provider · connectWander llança
svc.setArweaveExtensionProvider(null);
let threw = null;
try { await svc.connectWander(); } catch (e) { threw = e; }
t(threw && /Wander/.test(threw.message),                              'E · sense provider · connectWander llança "Wander not available"');

// 8 · Provider sense `connect` mètode · llança
svc.setArweaveExtensionProvider({ getActiveAddress: () => 'x' });
threw = null;
try { await svc.connectWander(); } catch (e) { threw = e; }
t(threw && /not a function/.test(threw.message),                      'E · provider invàlid · connectWander llança');

// 9 · Provider que rebutja la connect · propaga error
const rejectProvider = {
    connect: () => Promise.reject(new Error('user rejected')),
    getActiveAddress: async () => mockAddress,
};
svc.setArweaveExtensionProvider(rejectProvider);
threw = null;
try { await svc.connectWander(); } catch (e) { threw = e; }
t(threw && /rejected/.test(threw.message),                            'E · user reject · error propagat');

// 10 · Provider sense getActivePublicKey · connectWander OK amb publicKey null
const noKeyProvider = {
    connect: async () => {},
    getActiveAddress: async () => mockAddress,
    // sense getActivePublicKey
};
svc.setArweaveExtensionProvider(noKeyProvider);
const conn2 = await svc.connectWander();
eq(conn2.address,    mockAddress,                                     'F · sense pubKey · address ok');
eq(conn2.publicKey,  null,                                            'F · sense pubKey · publicKey null');

// ─── Sprint A2 · getTurboClientForExtension export + null safety ─────────
// El test real (carregar /vendor/turbo-sdk.js · construir ArconnectSigner ·
// connect a Turbo) requereix browser · aquí validem el contracte i el fail
// path quan no hi ha provider.
t(typeof svc.getTurboClientForExtension === 'function',               'G · getTurboClientForExtension exportat');

// 11 · Sense provider · getTurboClientForExtension retorna null (no throw)
svc.setArweaveExtensionProvider(null);
const clientNull = await svc.getTurboClientForExtension();
eq(clientNull,     null,                                              'G · sense provider · getTurboClientForExtension = null');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
