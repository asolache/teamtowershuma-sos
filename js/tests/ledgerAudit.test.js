// =============================================================================
// ledgerAudit.test.js · LEDGER-CERT sprint A · audit-ready value accounting
// =============================================================================

import {
    LEDGER_AUDIT_VERSION, AUDIT_THRESHOLD_EUR, PROOF_KINDS, AUDIT_LEVEL_META,
    addProofToEntry, removeProofFromEntry,
    computeEntryAuditState, computeLedgerAuditScore,
    quickEntry, buildEmptyLedgerEntry, addLeg,
} from '../core/ledgerService.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

// ─── A · constants + meta ────────────────────────────────────────────────
eq(LEDGER_AUDIT_VERSION, '1.0',                                   'A · version');
eq(AUDIT_THRESHOLD_EUR, 100,                                      'A · threshold €100');
t(PROOF_KINDS.includes('arweave-txid'),                           'A · proof arweave');
t(PROOF_KINDS.includes('polygon-txhash'),                         'A · proof polygon');
t(PROOF_KINDS.includes('attestation-id'),                         'A · proof attestation');
t(PROOF_KINDS.includes('invoice-id'),                             'A · proof invoice');
eq(PROOF_KINDS.length, 5,                                         'A · 5 proof kinds');
t(AUDIT_LEVEL_META.gold && AUDIT_LEVEL_META.gold.minScore === 85, 'A · gold ≥85');
t(AUDIT_LEVEL_META.silver.minScore === 65,                        'A · silver ≥65');
t(AUDIT_LEVEL_META.bronze.minScore === 40,                        'A · bronze ≥40');

// ─── B · addProofToEntry · immutable + dedupe ────────────────────────────
const e1 = quickEntry({ projectId: 'p1', debitAccount: 'cash', creditAccount: 'revenue', amount: 200, date: '2026-01-01' });
eq(e1.content.proofs, undefined,                                  'B · entry sense proofs inicialment');

const e2 = addProofToEntry(e1, { kind: 'arweave-txid', value: 'AYZ123', signedBy: 'did:sos:alvaro' });
eq(e2.content.proofs.length, 1,                                   'B · 1 proof afegit');
eq(e2.content.proofs[0].kind, 'arweave-txid',                     'B · kind correct');
eq(e2.content.proofs[0].value, 'AYZ123',                          'B · value correct');
eq(e2.content.proofs[0].signedBy, 'did:sos:alvaro',               'B · signedBy correct');
t(typeof e2.content.proofs[0].signedAt === 'string',              'B · signedAt ISO');
eq(e1.content.proofs, undefined,                                  'B · immutable · orig sense canvi');

// Dedupe · mateix kind + value · no afegeix
const e2dup = addProofToEntry(e2, { kind: 'arweave-txid', value: 'AYZ123' });
eq(e2dup.content.proofs.length, 1,                                'B · dedupe · still 1 proof');

// Diferent kind · sí afegeix
const e3 = addProofToEntry(e2, { kind: 'attestation-id', value: 'att-xyz' });
eq(e3.content.proofs.length, 2,                                   'B · 2 proofs · kinds diferents');

// Throws
let threw = false;
try { addProofToEntry(null, { kind: 'arweave-txid', value: 'x' }); } catch (_) { threw = true; }
t(threw,                                                          'B · null entry throws');
threw = false;
try { addProofToEntry(e1, null); } catch (_) { threw = true; }
t(threw,                                                          'B · null proof throws');
threw = false;
try { addProofToEntry(e1, { kind: 'unknown', value: 'x' }); } catch (_) { threw = true; }
t(threw,                                                          'B · unknown kind throws');
threw = false;
try { addProofToEntry(e1, { kind: 'arweave-txid' }); } catch (_) { threw = true; }
t(threw,                                                          'B · sense value throws');

// ─── C · removeProofFromEntry ────────────────────────────────────────────
const e3rm = removeProofFromEntry(e3, 0);
eq(e3rm.content.proofs.length, 1,                                 'C · remove · 1 proof remaining');
eq(e3rm.content.proofs[0].kind, 'attestation-id',                 'C · queda attestation');

threw = false;
try { removeProofFromEntry(e3, 99); } catch (_) { threw = true; }
t(threw,                                                          'C · out-of-range throws');

// ─── D · computeEntryAuditState ──────────────────────────────────────────
const smallEntry = quickEntry({ projectId: 'p1', debitAccount: 'cash', creditAccount: 'revenue', amount: 50 });
const smallState = computeEntryAuditState(smallEntry);
eq(smallState.signed, false,                                      'D · small unsigned · signed false');
eq(smallState.needsProofs, false,                                 'D · €50 < threshold · no needs proofs');
eq(smallState.meetsThreshold, true,                               'D · meets (no necessita)');
eq(smallState.level, 'unsigned',                                  'D · level unsigned');

const bigEntry = quickEntry({ projectId: 'p1', debitAccount: 'cash', creditAccount: 'revenue', amount: 500 });
const bigState = computeEntryAuditState(bigEntry);
eq(bigState.needsProofs, true,                                    'D · €500 ≥ threshold · needs proofs');
eq(bigState.meetsThreshold, false,                                'D · sense proofs · no meets');
eq(bigState.level, 'unsigned',                                    'D · unsigned');
eq(bigState.proofsCount, 0,                                       'D · 0 proofs');
eq(bigState.totalEur, 500,                                        'D · totalEur correcte');

// Afegim signature manual + 2 proofs
const bigSigned = {
    ...bigEntry,
    content: {
        ...bigEntry.content,
        signature: 'fake-sig-base64',
        signedBy:  'did:sos:alvaro',
        proofs: [
            { kind: 'arweave-txid', value: 'AYZ1', signedAt: 'now' },
            { kind: 'attestation-id', value: 'att1', signedAt: 'now' },
        ],
    },
};
const auditState = computeEntryAuditState(bigSigned);
eq(auditState.signed, true,                                       'D · signed true');
eq(auditState.signedBy, 'did:sos:alvaro',                         'D · signedBy preserved');
eq(auditState.proofsCount, 2,                                     'D · 2 proofs');
eq(auditState.proofsByKind['arweave-txid'], 1,                    'D · 1 arweave');
eq(auditState.proofsByKind['attestation-id'], 1,                  'D · 1 attestation');
eq(auditState.meetsThreshold, true,                               'D · 2 proofs meets ≥2');
eq(auditState.level, 'audited',                                   'D · level audited (signed + proofs)');

// Signat però sense proofs (entry petita · igualment 'signed' level)
const smallSigned = {
    ...smallEntry,
    content: {
        ...smallEntry.content,
        signature: 'sig',
        signedBy:  'did:sos:alvaro',
    },
};
const sState = computeEntryAuditState(smallSigned);
eq(sState.level, 'audited',                                       'D · small signed · audited (no needs proofs)');

// Big signed amb 1 proof · signed però no audited
const bigSignedOneProof = {
    ...bigEntry,
    content: {
        ...bigEntry.content,
        signature: 'sig',
        proofs: [{ kind: 'arweave-txid', value: 'x', signedAt: 'now' }],
    },
};
const bsState = computeEntryAuditState(bigSignedOneProof);
eq(bsState.level, 'signed',                                       'D · big signed + 1 proof · signed (no audited)');

// Null safe
eq(computeEntryAuditState(null).level, 'unsigned',                'D · null · unsigned');
eq(computeEntryAuditState({}).level, 'unsigned',                  'D · empty · unsigned');

// ─── E · computeLedgerAuditScore · gold scenario ─────────────────────────
const goldEntries = [
    { ...quickEntry({ projectId: 'p1', debitAccount: 'cash', creditAccount: 'equity', amount: 5000, date: '2026-01-01' }),
      content: { ...quickEntry({ projectId: 'p1', debitAccount: 'cash', creditAccount: 'equity', amount: 5000, date: '2026-01-01' }).content,
                 signature: 'sig1', signedBy: 'did:sos:alvaro',
                 proofs: [{ kind: 'arweave-txid', value: 'a1' }, { kind: 'attestation-id', value: 'att1' }] } },
    { ...quickEntry({ projectId: 'p1', debitAccount: 'expenses', creditAccount: 'cash', amount: 300, date: '2026-02-01' }),
      content: { ...quickEntry({ projectId: 'p1', debitAccount: 'expenses', creditAccount: 'cash', amount: 300, date: '2026-02-01' }).content,
                 signature: 'sig2', signedBy: 'did:sos:alvaro',
                 proofs: [{ kind: 'arweave-txid', value: 'a2' }, { kind: 'invoice-id', value: 'inv1' }] } },
    { ...quickEntry({ projectId: 'p1', debitAccount: 'cash', creditAccount: 'revenue', amount: 50, date: '2026-03-01' }),
      content: { ...quickEntry({ projectId: 'p1', debitAccount: 'cash', creditAccount: 'revenue', amount: 50, date: '2026-03-01' }).content,
                 signature: 'sig3', signedBy: 'did:sos:alvaro' } },     // < threshold · no proofs needed
];
const gold = computeLedgerAuditScore(goldEntries);
eq(gold.counts.total, 3,                                          'E · 3 entries');
eq(gold.counts.balanced, 3,                                       'E · 3 balanced');
eq(gold.counts.signed, 3,                                         'E · 3 signed');
t(gold.score >= 85,                                               'E · score ≥85 (gold)');
eq(gold.level, 'gold',                                            'E · level gold');
t(gold.reasons.some(r => r.kind === 'positive'),                  'E · reasons inclou positive');

// ─── F · computeLedgerAuditScore · draft scenario ────────────────────────
const draftEntries = [quickEntry({ projectId: 'p1', debitAccount: 'cash', creditAccount: 'revenue', amount: 500 })];   // unsigned · big sense proofs
const draft = computeLedgerAuditScore(draftEntries);
t(draft.score < 65,                                               'F · unsigned · score < silver');
t(['draft', 'bronze'].includes(draft.level),                      'F · level draft o bronze');
t(draft.reasons.some(r => r.kind === 'penalty' || r.kind === 'warning'), 'F · reasons inclou warnings');

// ─── G · empty entries ───────────────────────────────────────────────────
const empty = computeLedgerAuditScore([]);
eq(empty.score, 0,                                                'G · empty · 0');
eq(empty.level, 'draft',                                          'G · empty · draft level');
t(empty.reasons[0].text.includes('buida'),                        'G · empty reason buida');

eq(computeLedgerAuditScore(null).score, 0,                        'G · null safe');

// ─── H · silver scenario · mid-quality ───────────────────────────────────
const silverEntries = [
    { ...quickEntry({ projectId: 'p1', debitAccount: 'cash', creditAccount: 'revenue', amount: 500, date: '2026-01-01' }),
      content: { ...quickEntry({ projectId: 'p1', debitAccount: 'cash', creditAccount: 'revenue', amount: 500, date: '2026-01-01' }).content,
                 signature: 'sig1', signedBy: 'did:sos:alvaro',
                 proofs: [{ kind: 'arweave-txid', value: 'a1' }, { kind: 'attestation-id', value: 'att1' }] } },
    { ...quickEntry({ projectId: 'p1', debitAccount: 'expenses', creditAccount: 'cash', amount: 200, date: '2026-02-01' }),
      content: { ...quickEntry({ projectId: 'p1', debitAccount: 'expenses', creditAccount: 'cash', amount: 200, date: '2026-02-01' }).content,
                 signature: 'sig2' } },     // signed sense proofs (needs)
    quickEntry({ projectId: 'p1', debitAccount: 'cash', creditAccount: 'revenue', amount: 50 }),   // unsigned petita
];
const silver = computeLedgerAuditScore(silverEntries);
t(silver.score >= 40,                                             'H · silver scenario · ≥40');
t(silver.score < 85,                                              'H · silver scenario · < gold');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
