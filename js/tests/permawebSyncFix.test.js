// Regression tests · sync bug 2026-05-13:
//   (1) publishToPermaweb deixa entry sense _cachedAt → getCachedRegistry el filtra
//   (2) fetchEntryByTxId no recompon signature top-level → verify falla cross-device
//
// Ús: node js/tests/permawebSyncFix.test.js

import * as reg  from '../core/publicRegistryService.js';
import * as proj from '../core/publicProjectService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== Sync bugfix · regression tests ===\n');

// ─── FIX 2 · fetchEntryByTxId recompon signature top-level ───────────────
// Simula EL FORMAT EXACTE de publishToPermaweb · canonical content (sense
// signature/arweaveTxId) + signature + signatureFormat al top-level.

reg.setArweaveGateway({
    baseUrl: 'http://mock',
    fetchFn: async (url) => {
        const txId = url.split('/').pop();
        if (url.includes('graphql')) {
            return { ok: true, json: async () => ({ data: { transactions: { edges: [] } } }) };
        }
        // Body amb format real de publishToPermaweb:
        //   { id, type, content (sense sig/tx), keywords, createdAt, signature (top), signatureFormat (top) }
        const fakePublished = {
            id:   'registry-' + txId,
            type: 'public_registry_entry',
            content: {
                kind:        'public-registry-entry',
                did:         'did:sos:' + txId,
                displayName: 'External ' + txId,
                handle:      '@ext',
                publicJwk:   { kty:'EC', crv:'P-256', x:'AAAA', y:'BBBB' },
                // ⚠ signature i arweaveTxId NO inclosos · stripped per canonicalize
            },
            keywords:  ['type:public-registry-entry'],
            createdAt: 1700000000000,
            // top-level signature · com surt del publish real
            signature:       'BASE64SIGFAKE',
            signatureFormat: 'ECDSA-P256-SHA256-base64',
        };
        return {
            ok:   true,
            text: async () => JSON.stringify(fakePublished),
        };
    },
});

const { entry } = await reg.fetchEntryByTxId('TX_PUBLISHED_REAL');
t(entry && entry.type === 'public_registry_entry',                    'A · fetchEntryByTxId retorna entry');
t(entry.content.signature === 'BASE64SIGFAKE',                        'A · signature recomposta dins content (FIX 2)');
eq(entry.content.signatureFormat, 'ECDSA-P256-SHA256-base64',         'A · signatureFormat dins content');
eq(entry.content.arweaveTxId,     'TX_PUBLISHED_REAL',                'A · arweaveTxId omplerta amb tx');
t(!('signature' in entry),                                            'A · top-level signature movida (no duplicat)');

// ─── FIX 2 · idempotència · si ja hi és a content, no la trepitgem ────────
reg.setArweaveGateway({
    baseUrl: 'http://mock',
    fetchFn: async (url) => {
        const txId = url.split('/').pop();
        if (url.includes('graphql')) {
            return { ok:true, json: async () => ({ data:{transactions:{edges:[]}} }) };
        }
        // Format antic · signature DINS content
        return {
            ok:   true,
            text: async () => JSON.stringify({
                id: 'registry-' + txId, type: 'public_registry_entry',
                content: {
                    kind:'public-registry-entry', did:'did:sos:' + txId,
                    handle:'@old', publicJwk:{ kty:'EC', crv:'P-256', x:'AAAA', y:'BBBB' },
                    signature: 'OLD_FORMAT_SIG',
                    signatureFormat: 'ECDSA-P256-SHA256-base64',
                },
                keywords:[], createdAt:0,
            }),
        };
    },
});
const { entry: oldFormat } = await reg.fetchEntryByTxId('TX_OLD_FORMAT');
eq(oldFormat.content.signature, 'OLD_FORMAT_SIG',                     'B · format antic · signature ja dins content · preservada');

// ─── FIX 1 · publishToPermaweb mock no tocs reals · simula via export ───
// Verifiquem que els marcadors _cachedAt + _fromPermaweb + _verified
// són persistits per publishToPermaweb. Com no podem cridar el flow real
// (necessita wallet + crypto.subtle keypair + Turbo), validem que el
// codi insereix els camps · cerca textual al source (resilient · doc d'intent).
import { readFileSync } from 'fs';
const regSource = readFileSync(new URL('../core/publicRegistryService.js', import.meta.url), 'utf8');
t(/_cachedAt:\s+now,/.test(regSource),                                'C · publicRegistryService porta _cachedAt al persist');
t(/_fromPermaweb:\s+true/.test(regSource),                            'C · publicRegistryService porta _fromPermaweb');
t(/_verified:\s+true/.test(regSource),                                'C · publicRegistryService porta _verified post-publish');

const projSource = readFileSync(new URL('../core/publicProjectService.js', import.meta.url), 'utf8');
t(/_cachedAt:\s+now,/.test(projSource),                               'C · publicProjectService porta _cachedAt al persist');
t(/_fromPermaweb:\s+true/.test(projSource),                           'C · publicProjectService porta _fromPermaweb');

// ─── E2E · syncFromPermaweb amb mock fetch que retorna 1 entry publicat
// en format real (signature top-level). Validem que arriba al cache i
// que el _cachedAt es propaga.
reg.setArweaveGateway({
    baseUrl: 'http://mock',
    fetchFn: async (url, opts) => {
        if (url.includes('graphql')) {
            const body = JSON.parse(opts.body);
            // Retorna 1 entry per query primary · cap revocation
            if (body.query.includes('public-registry-entry')) {
                return { ok:true, json: async () => ({ data:{ transactions:{ edges: [{ node:{
                    id: 'TX_SYNC_TEST', owner:{address:'addr'},
                    block:{ timestamp: 1700000000, height: 1500000 },
                    tags:[
                        {name:'App-Name', value:'SOS-V11'},
                        {name:'Entry-Type', value:'public-registry-entry'},
                        {name:'DID', value:'did:sos:sync-test'},
                    ],
                }}] } } }) };
            }
            // No revocations
            return { ok:true, json: async () => ({ data:{transactions:{edges:[]}} }) };
        }
        // Body fetch · format publicat real (sig top-level)
        return {
            ok:   true,
            text: async () => JSON.stringify({
                id:   'registry-sync-test',
                type: 'public_registry_entry',
                content: {
                    kind:'public-registry-entry', did:'did:sos:sync-test',
                    handle:'@sync',
                    publicJwk: { kty:'EC', crv:'P-256', x:'AAAA', y:'BBBB' },
                },
                keywords:[], createdAt:1700000000000,
                signature: 'BASE64SIG_SYNC',
                signatureFormat: 'ECDSA-P256-SHA256-base64',
            }),
        };
    },
});

// verifyOnSync:false per evitar dependència crypto.subtle amb sig fake
const res = await reg.syncFromPermaweb({ verifyOnSync: false });
eq(res.fetched, 1,                                                    'D · syncFromPermaweb · 1 entry fetched');
t(Array.isArray(res.entries) && res.entries[0].content.signature === 'BASE64SIG_SYNC', 'D · sync · signature dins content propagada');
t(res.entries[0].content.arweaveTxId === 'TX_SYNC_TEST',              'D · sync · arweaveTxId omplerta');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
