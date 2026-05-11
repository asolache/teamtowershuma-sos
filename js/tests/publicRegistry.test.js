// PERM-USER-001 · tests stand-alone per publicRegistryService.
// Executable a node 19+ amb webcrypto · zero deps · zero network.
//
// Cobreix sprints A+B + parts pures de C+D (sense Turbo SDK real ni
// arweave gateway real · usa mocks injectats).
//
// Ús:
//   node js/tests/publicRegistry.test.js

import * as m from '../core/publicRegistryService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}

async function run() {
    // ── Sprint A · helpers purs ─────────────────────────────────────
    const id1 = m.registryEntryIdFor('did:sos:abc1234');
    t(typeof id1 === 'string' && id1.startsWith('registry-'), 'A · registryEntryIdFor format');
    t(m.registryEntryIdFor('did:sos:abc1234') === id1, 'A · idempotent');

    const jwk = { kty:'EC', crv:'P-256', x:'AAAA', y:'BBBB' };
    const entry = m.buildPublicRegistryEntry({
        did: 'did:sos:abc1234',
        handle: '@alvaro',
        displayName: 'Alvaro Test',
        publicJwk: jwk,
        skillsDeclared: ['vision-strategic'],
        sectorsExperience: ['K'],
    });
    t(entry.type === 'public_registry_entry', 'A · build type correcte');
    t(!('d' in entry.content.publicJwk), 'A · stripPrivateJwkFields');

    const v = m.validatePublicRegistryEntry(entry);
    t(v.valid && v.errors.length === 0, 'A · validate built entry · valid');

    // Defensive · refusa private*
    const badEntry = { ...entry, content: { ...entry.content, wallets: [] } };
    const vBad = m.validatePublicRegistryEntry(badEntry);
    t(!vBad.valid && vBad.errors.some(e => /wallets/.test(e)), 'A · validate refusa wallets');

    // canonicalize omet signature + arweaveTxId
    const signed = { ...entry, content: { ...entry.content, signature: 'X', arweaveTxId: 'Y' } };
    t(m.canonicalizeRegistryEntry(signed) === m.canonicalizeRegistryEntry(entry), 'A · canonicalize omet signature/arweaveTxId');

    // extractPublicFromMatriuMember descarta camps privats
    const member = {
        type: 'matriu_member',
        content: {
            displayName: 'Marc',
            handle: '@marc',
            primaryDid: 'did:sos:abc',
            publicJwk: jwk,
            wallets: [{ address: '0x123' }],
            skillsDeclared: ['vision-strategic'],
        },
    };
    const ex = m.extractPublicFromMatriuMember(member);
    t(ex && ex.content.handle === '@marc', 'A · extract handle');
    t(!('wallets' in ex.content), 'A · extract NO inclou wallets');

    // arweaveTagsForEntry
    const tags = m.arweaveTagsForEntry(entry);
    t(tags.some(t => t.name === 'App-Name' && t.value === 'SOS-V11'), 'A · tag App-Name');
    t(tags.some(t => t.name === 'Entry-Type'), 'A · tag Entry-Type');

    // ── Sprint B · sign + verify amb keypair real ───────────────────
    const pair = await crypto.subtle.generateKey({ name:'ECDSA', namedCurve:'P-256' }, true, ['sign','verify']);
    const privateJwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
    const publicJwk  = await crypto.subtle.exportKey('jwk', pair.publicKey);

    const e2 = m.buildPublicRegistryEntry({
        did: 'did:sos:test-key-real',
        handle: '@alvaro',
        displayName: 'Alvaro Real',
        publicJwk,
    });
    const signed2 = await m.signRegistryEntry({ entry: e2, privateJwk });
    t(typeof signed2.content.signature === 'string' && signed2.content.signature.length > 40, 'B · signature base64 generada');

    const verifyOk = await m.verifyRegistryEntry(signed2);
    t(verifyOk.valid && verifyOk.reason === 'ok', 'B · verify valid');

    const tampered = { ...signed2, content: { ...signed2.content, displayName: 'Tampered' } };
    const verifyBad = await m.verifyRegistryEntry(tampered);
    t(!verifyBad.valid && verifyBad.reason === 'signature-mismatch', 'B · tampered → signature-mismatch');

    // No signature
    const noSig = { ...signed2, content: { ...signed2.content, signature: null } };
    const v3 = await m.verifyRegistryEntry(noSig);
    t(!v3.valid && v3.reason === 'no-signature', 'B · no signature → refuses');

    // arweaveTxId post-publish · firma segueix vàlida
    const withTx = { ...signed2, content: { ...signed2.content, arweaveTxId: 'TX_FAKE' } };
    const v4 = await m.verifyRegistryEntry(withTx);
    t(v4.valid, 'B · arweaveTxId post-publish · firma vàlida');

    // Defensive · sign amb foreign privateJwk
    const otherPair = await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'}, true, ['sign']);
    const otherPriv = await crypto.subtle.exportKey('jwk', otherPair.privateKey);
    let threwForeign = false;
    try { await m.signRegistryEntry({ entry: e2, privateJwk: otherPriv }); }
    catch (e) { threwForeign = /does not match/.test(e.message); }
    t(threwForeign, 'B · sign amb foreign privateJwk → throw');

    // ── Sprint C · exports + pricing ────────────────────────────────
    t(m.PRICING.publishEur === 0.05, 'C · pricing publish 0.05€');
    t(m.PRICING.revokeEur === 0.05,  'C · pricing revoke 0.05€');
    t(m.PRICING.verifyEur === 0,     'C · pricing verify FREE');
    t(m.PRICING.queryEur === 0,      'C · pricing query FREE');
    t(typeof m.publishToPermaweb === 'function', 'C · publishToPermaweb exported');
    t(typeof m.revokeFromPermaweb === 'function', 'C · revokeFromPermaweb exported');
    t(typeof m.setTurboLoader === 'function',     'C · setTurboLoader exported');

    // ── Sprint D · helpers + mock GraphQL ───────────────────────────
    t(typeof m.queryPermawebRegistry === 'function', 'D · queryPermawebRegistry exported');
    t(typeof m.fetchEntryByTxId === 'function',      'D · fetchEntryByTxId exported');
    t(typeof m.applyRevocations === 'function',      'D · applyRevocations exported');
    t(typeof m.cacheToKb === 'function',             'D · cacheToKb exported');
    t(typeof m.getCachedRegistry === 'function',     'D · getCachedRegistry exported');
    t(typeof m.syncFromPermaweb === 'function',      'D · syncFromPermaweb exported');
    t(m.DEFAULT_TTL_MS === 60 * 60 * 1000,           'D · DEFAULT_TTL_MS = 1h');
    t(m.DEFAULT_TTL_BG_MS === 24 * 60 * 60 * 1000,   'D · DEFAULT_TTL_BG_MS = 24h');

    // Mock fetch · simula GraphQL response amb 2 entries + 1 revocation
    const mockEntries = [
        { node: { id:'TX_AAA', owner:{address:'OWNER_A'}, block:{timestamp:1700000000, height:1000}, tags:[{name:'DID',value:'did:sos:aaa'}] } },
        { node: { id:'TX_BBB', owner:{address:'OWNER_B'}, block:{timestamp:1700001000, height:1001}, tags:[{name:'DID',value:'did:sos:bbb'}] } },
    ];
    const mockRevs = [
        { node: { id:'TX_REV', owner:{address:'OWNER_A'}, block:{timestamp:1700002000, height:1002}, tags:[{name:'Revokes',value:'TX_AAA'}] } },
    ];
    let callCount = 0;
    m.setArweaveGateway({
        fetchFn: async (url, opts) => {
            callCount++;
            if (url.includes('graphql')) {
                const body = JSON.parse(opts.body);
                const isRev = body.query.includes('"revocation"');
                return {
                    ok: true,
                    json: async () => ({ data: { transactions: { edges: isRev ? mockRevs : mockEntries } } }),
                };
            }
            // entry body fetch
            const txId = url.split('/').pop();
            const fakeEntry = {
                id: 'registry-' + txId,
                type: 'public_registry_entry',
                content: {
                    kind: 'public-registry-entry',
                    did: 'did:sos:' + txId,
                    displayName: 'Fake ' + txId,
                    publicJwk: jwk,
                    signature: 'FAKESIG',
                    signatureFormat: 'ECDSA-P256-SHA256-base64',
                },
                keywords: [],
                createdAt: 0,
            };
            return {
                ok: true,
                text: async () => JSON.stringify(fakeEntry),
            };
        },
    });

    const descs = await m.queryPermawebRegistry({});
    t(descs.length === 2, 'D · query retorna 2 entries (mock)');
    t(descs[0].txId === 'TX_AAA', 'D · descriptor txId correcte');
    t(descs[0].tags.DID === 'did:sos:aaa', 'D · descriptor tags com object');

    const { entry: fetched } = await m.fetchEntryByTxId('TX_TEST');
    t(fetched && fetched.type === 'public_registry_entry', 'D · fetchEntryByTxId retorna entry');

    // applyRevocations · pura
    const e_aaa = { ...fetched, content: { ...fetched.content, arweaveTxId: 'TX_AAA' } };
    const e_bbb = { ...fetched, content: { ...fetched.content, arweaveTxId: 'TX_BBB' } };
    const revsDesc = [{ tags: { Revokes: 'TX_AAA' } }];
    const filtered = m.applyRevocations([e_aaa, e_bbb], revsDesc);
    t(filtered[0]._revoked === true,  'D · applyRevocations marca TX_AAA revoked');
    t(filtered[1]._revoked !== true,  'D · applyRevocations NO marca TX_BBB');

    console.log('---');
    console.log(pass + ' pass · ' + fail + ' fail');
    if (fail > 0) process.exit(1);
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
