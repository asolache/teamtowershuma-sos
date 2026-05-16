// =============================================================================
// blockchainAnchor.test.js · CERT-001 pas 8 · Phase 2 blockchain stub tests
// =============================================================================

import {
    BLOCKCHAIN_ANCHOR_VERSION, SUPPORTED_NETWORKS, CONTRACT_ADDRESSES,
    computeCanonicalHash,
    prepareAnchorLedgerEntryTx, prepareMintSharesTx, prepareDistributeTx,
    isValidAddress, isValidTxHash,
    buildPolygonTxProof, estimateGasUsd,
    hasPolygonAnchor, getPolygonTxHash,
} from '../core/blockchainAnchorService.js';
import { quickEntry, addProofToEntry } from '../core/ledgerService.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

// ─── A · constants ────────────────────────────────────────────────────────
t(typeof BLOCKCHAIN_ANCHOR_VERSION === 'string',                  'A · version present');
t(SUPPORTED_NETWORKS['polygon-mainnet'].chainId === 137,          'A · polygon mainnet chainId 137');
t(SUPPORTED_NETWORKS['polygon-amoy'].chainId === 80002,           'A · polygon amoy chainId');
t(!SUPPORTED_NETWORKS['polygon-amoy'].production,                 'A · amoy not production');
t(SUPPORTED_NETWORKS['polygon-mainnet'].production,               'A · mainnet production');
t(typeof CONTRACT_ADDRESSES['polygon-amoy'].ledgerRegistry === 'string',
                                                                  'A · contract addr stub present');

// ─── B · isValidAddress / isValidTxHash ──────────────────────────────────
t(isValidAddress('0x' + 'a'.repeat(40)),                          'B · valid address');
t(!isValidAddress('0x' + 'a'.repeat(39)),                         'B · too short rejected');
t(!isValidAddress('0xZZZ'),                                       'B · non-hex rejected');
t(!isValidAddress(null),                                          'B · null rejected');
t(!isValidAddress(123),                                           'B · non-string rejected');
t(!isValidAddress('a'.repeat(40)),                                'B · sense 0x rejected');

t(isValidTxHash('0x' + 'a'.repeat(64)),                           'B · valid txhash 64 hex');
t(!isValidTxHash('0x' + 'a'.repeat(63)),                          'B · txhash 63 rejected');
t(!isValidTxHash(null),                                           'B · null txhash rejected');

// ─── C · computeCanonicalHash ────────────────────────────────────────────
const entry = quickEntry({ projectId: 'p1', debitAccount: 'cash', creditAccount: 'revenue', amount: 500, date: '2026-01-01' });
const hash1 = await computeCanonicalHash(entry);
t(typeof hash1 === 'string',                                      'C · hash string');
t(hash1.startsWith('0x'),                                         'C · hash 0x prefix');
t(hash1.length >= 18,                                             'C · hash length reasonable');

// Determinístic · same entry → same hash
const hash2 = await computeCanonicalHash(entry);
eq(hash1, hash2,                                                  'C · deterministic');

// Different entry → different hash
const entry2 = quickEntry({ projectId: 'p1', debitAccount: 'cash', creditAccount: 'revenue', amount: 999, date: '2026-01-01' });
const hash3 = await computeCanonicalHash(entry2);
t(hash3 !== hash1,                                                'C · diff entries · diff hashes');

let threw = false;
try { await computeCanonicalHash(null); } catch (_) { threw = true; }
t(threw,                                                          'C · null throws');

// ─── D · prepareAnchorLedgerEntryTx ──────────────────────────────────────
const anchorTx = prepareAnchorLedgerEntryTx({ entry, canonicalHash: hash1 });
eq(anchorTx.chainId, 80002,                                       'D · default network amoy');
eq(anchorTx.method, 'anchorLedgerEntry(string,bytes32)',          'D · method name');
eq(anchorTx.value, 0,                                             'D · value 0');
t(anchorTx.args[0] === entry.id,                                  'D · args[0] = entry.id');
t(anchorTx.args[1] === hash1,                                     'D · args[1] = hash');
eq(anchorTx.gasHint, 'low',                                       'D · gas low');
eq(anchorTx.network, 'polygon-amoy',                              'D · network preserved');

// Custom network
const anchorMainnet = prepareAnchorLedgerEntryTx({ entry, canonicalHash: hash1, network: 'polygon-mainnet' });
eq(anchorMainnet.chainId, 137,                                    'D · mainnet chainId');

// Custom address override
const anchorCustom = prepareAnchorLedgerEntryTx({
    entry, canonicalHash: hash1,
    contractAddress: '0x' + 'b'.repeat(40),
});
t(anchorCustom.to === '0x' + 'b'.repeat(40),                      'D · custom contract addr');

// Throws
threw = false;
try { prepareAnchorLedgerEntryTx({}); } catch (_) { threw = true; }
t(threw,                                                          'D · sense entry throws');
threw = false;
try { prepareAnchorLedgerEntryTx({ entry }); } catch (_) { threw = true; }
t(threw,                                                          'D · sense hash throws');
threw = false;
try { prepareAnchorLedgerEntryTx({ entry, canonicalHash: 'no-0x' }); } catch (_) { threw = true; }
t(threw,                                                          'D · bad hash throws');
threw = false;
try { prepareAnchorLedgerEntryTx({ entry, canonicalHash: hash1, network: 'unknown' }); } catch (_) { threw = true; }
t(threw,                                                          'D · unknown network throws');

// ─── E · prepareMintSharesTx ─────────────────────────────────────────────
const validAddr = '0x' + 'a'.repeat(40);
const mintTx = prepareMintSharesTx({
    projectId: 'proj-test', recipientAddress: validAddr, amount: 1000,
});
eq(mintTx.method, 'mint(address,uint256,uint256,bytes)',          'E · ERC-1155 mint method');
eq(mintTx.args[0], validAddr,                                     'E · recipient');
t(typeof mintTx.args[1] === 'string',                             'E · tokenId string (big number safe)');
eq(mintTx.args[2], '1000',                                        'E · amount');
eq(mintTx.args[3], '0x',                                          'E · data empty');
eq(mintTx.gasHint, 'medium',                                      'E · gas medium');

// tokenId determinístic
const mintTx2 = prepareMintSharesTx({ projectId: 'proj-test', recipientAddress: validAddr, amount: 1 });
eq(mintTx.args[1], mintTx2.args[1],                               'E · tokenId determinístic');

// Throws
threw = false;
try { prepareMintSharesTx({ recipientAddress: validAddr, amount: 1 }); } catch (_) { threw = true; }
t(threw,                                                          'E · sense projectId throws');
threw = false;
try { prepareMintSharesTx({ projectId: 'p', recipientAddress: 'bad', amount: 1 }); } catch (_) { threw = true; }
t(threw,                                                          'E · bad address throws');
threw = false;
try { prepareMintSharesTx({ projectId: 'p', recipientAddress: validAddr }); } catch (_) { threw = true; }
t(threw,                                                          'E · sense amount throws');

// ─── F · prepareDistributeTx · Gnosis Safe ──────────────────────────────
const safe      = '0x' + 'c'.repeat(40);
const recipient = '0x' + 'd'.repeat(40);
const distTx = prepareDistributeTx({
    safeAddress: safe, recipientAddress: recipient,
    amountWei: '1000000000000000000', description: 'Distribució mensual',
});
eq(distTx.safe, safe,                                             'F · safe address');
eq(distTx.to, recipient,                                          'F · recipient');
eq(distTx.value, '1000000000000000000',                           'F · amountWei string');
eq(distTx.kind, 'safe-proposal',                                  'F · kind safe-proposal');
t(distTx.description.includes('mensual'),                         'F · description preserved');
t(distTx.gasHint === 'medium',                                    'F · gas medium');

// Description truncated 200
const longDesc = 'x'.repeat(500);
const distLong = prepareDistributeTx({
    safeAddress: safe, recipientAddress: recipient,
    amountWei: 1, description: longDesc,
});
eq(distLong.description.length, 200,                              'F · description truncated 200');

// Throws
threw = false;
try { prepareDistributeTx({ safeAddress: 'bad', recipientAddress: recipient, amountWei: 1 }); } catch (_) { threw = true; }
t(threw,                                                          'F · bad safe throws');
threw = false;
try { prepareDistributeTx({ safeAddress: safe, recipientAddress: 'bad', amountWei: 1 }); } catch (_) { threw = true; }
t(threw,                                                          'F · bad recipient throws');
threw = false;
try { prepareDistributeTx({ safeAddress: safe, recipientAddress: recipient }); } catch (_) { threw = true; }
t(threw,                                                          'F · sense amount throws');

// ─── G · buildPolygonTxProof ─────────────────────────────────────────────
const validTx = '0x' + 'e'.repeat(64);
const proof = buildPolygonTxProof({ txHash: validTx, signerDid: 'did:sos:alvaro' });
eq(proof.kind, 'polygon-txhash',                                  'G · kind polygon-txhash');
eq(proof.value, validTx,                                          'G · value txHash');
eq(proof.signedBy, 'did:sos:alvaro',                              'G · signedBy');
t(typeof proof.signedAt === 'string',                             'G · signedAt ISO');
eq(proof.network, 'polygon-amoy',                                 'G · default network');
t(proof.explorerUrl.includes(validTx),                            'G · explorerUrl inclou txHash');
t(proof.explorerUrl.includes('amoy'),                             'G · explorerUrl amoy');

// Mainnet network
const proofMain = buildPolygonTxProof({ txHash: validTx, network: 'polygon-mainnet' });
t(proofMain.explorerUrl.includes('polygonscan.com'),              'G · mainnet polygonscan');

// Invalid txHash throws
threw = false;
try { buildPolygonTxProof({ txHash: 'bad' }); } catch (_) { threw = true; }
t(threw,                                                          'G · bad txHash throws');

// ─── H · estimateGasUsd ──────────────────────────────────────────────────
eq(estimateGasUsd('low'), 0.001,                                  'H · low 0.001');
eq(estimateGasUsd('medium'), 0.005,                               'H · medium 0.005');
eq(estimateGasUsd('high'), 0.02,                                  'H · high 0.02');
eq(estimateGasUsd('unknown'), 0.005,                              'H · unknown fallback medium');

// ─── I · hasPolygonAnchor / getPolygonTxHash ────────────────────────────
// Entry sense proofs · false
eq(hasPolygonAnchor(entry), false,                                'I · sense proofs · false');
eq(getPolygonTxHash(entry), null,                                 'I · sense proofs · null');

// Add polygon proof manually
const entryWithProof = addProofToEntry(entry, proof);
eq(hasPolygonAnchor(entryWithProof), true,                        'I · amb polygon proof · true');
eq(getPolygonTxHash(entryWithProof), validTx,                     'I · retorna txHash');

// Entry amb proofs d'altres tipus (no polygon) · false
const entryArweave = addProofToEntry(entry, { kind: 'arweave-txid', value: 'AYZ123' });
eq(hasPolygonAnchor(entryArweave), false,                         'I · sols arweave · no polygon');

// Null safe
eq(hasPolygonAnchor(null), false,                                 'I · null · false');
eq(getPolygonTxHash(null), null,                                  'I · null · null');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
