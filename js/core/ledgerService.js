// =============================================================================
// TEAMTOWERS SOS V11 — LEDGER SERVICE (LEDGER-ACCOUNTING sprint A)
// Ruta · /js/core/ledgerService.js
//
// Double-entry accounting senzill per a projectes SOS. Cada `ledger_entry`
// té múltiples legs (debit / credit) que sempre quadren (Σdebit = Σcredit).
// Balance sheet i P&L derivats agregant entries.
//
// Pure · zero KB · zero DOM. View consumidora · /accounting?project=X
// (AccountingView · sprint B).
//
// Conceptes ·
//   account · string identifier · cash · bank · revenue · expenses ·
//             receivable · payable · equity · tax-payable · custom-X
//   leg     · { account, side: 'debit'|'credit', amount: number, currency }
//   entry   · { id, type, projectId, content: { date, description, legs[],
//               proof?, tags? } }
//
// Tots els amounts són numbers positius. La direcció es captura a `side`.
// =============================================================================

export const LEDGER_ENTRY_TYPE = 'ledger_entry';

// Standard accounts · suggeriments per a la UI · no és una enum tancada.
// L'usuari pot crear accounts custom amb qualsevol string.
export const STANDARD_ACCOUNTS = Object.freeze([
    { id: 'cash',         label: 'Caixa',              kind: 'asset',     positiveSide: 'debit'  },
    { id: 'bank',         label: 'Banc',               kind: 'asset',     positiveSide: 'debit'  },
    { id: 'wallet',       label: 'Wallet cripto',      kind: 'asset',     positiveSide: 'debit'  },
    { id: 'receivable',   label: 'Cobraments pendents',kind: 'asset',     positiveSide: 'debit'  },
    { id: 'inventory',    label: 'Existències',        kind: 'asset',     positiveSide: 'debit'  },
    { id: 'equity',       label: 'Capital',            kind: 'equity',    positiveSide: 'credit' },
    { id: 'revenue',      label: 'Ingressos',          kind: 'income',    positiveSide: 'credit' },
    { id: 'expenses',     label: 'Despeses',           kind: 'expense',   positiveSide: 'debit'  },
    { id: 'payable',      label: 'Pagaments pendents', kind: 'liability', positiveSide: 'credit' },
    { id: 'tax-payable',  label: 'IVA / impostos',     kind: 'liability', positiveSide: 'credit' },
]);

const STANDARD_BY_ID = new Map(STANDARD_ACCOUNTS.map(a => [a.id, a]));

// accountKindFor · pure · retorna { kind, positiveSide } per account id.
// Per accounts custom (no a STANDARD_ACCOUNTS) · default · asset/debit.
export function accountKindFor(accountId) {
    const std = STANDARD_BY_ID.get(accountId);
    if (std) return { kind: std.kind, positiveSide: std.positiveSide, label: std.label };
    return { kind: 'asset', positiveSide: 'debit', label: accountId };
}

// buildEmptyLedgerEntry · pura · entry-base sense legs.
export function buildEmptyLedgerEntry({ projectId = null, description = '', date = null, ts = null, currency = 'EUR' } = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    const isoDate = date || new Date(now).toISOString().slice(0, 10);
    return {
        id:        'le-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 7),
        type:      LEDGER_ENTRY_TYPE,
        projectId,
        content: {
            date:        isoDate,
            description,
            legs:        [],
            proof:       null,
            tags:        [],
            currency,
        },
        createdAt: now,
        updatedAt: now,
    };
}

// addLeg · pura · immutable · valida side + amount + currency.
export function addLeg(entry, { account, side, amount, currency = null } = {}) {
    if (!account) throw new Error('account required');
    if (side !== 'debit' && side !== 'credit') throw new Error('side must be debit or credit');
    if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0) {
        throw new Error('amount must be positive number');
    }
    const cur = currency || entry.content?.currency || 'EUR';
    const leg = { account, side, amount, currency: cur };
    return {
        ...entry,
        content: {
            ...entry.content,
            legs: [...(entry.content?.legs || []), leg],
        },
        updatedAt: Date.now(),
    };
}

// validateLedgerEntry · pura · retorna { ok, errors[] }
// Checks ·
//  - 2+ legs
//  - tots els legs · side debit/credit, amount > 0, currency present
//  - debit total == credit total (tolerance 0.01 per a floating point)
//  - mateixa currency a tots els legs (per ara · sense FX automàtic)
export function validateLedgerEntry(entry) {
    const errors = [];
    if (!entry || !entry.content) return { ok: false, errors: ['entry-missing-content'] };
    const legs = entry.content.legs || [];
    if (legs.length < 2) errors.push('entry-needs-2-legs');

    let debitTotal = 0, creditTotal = 0;
    const currencies = new Set();
    for (const leg of legs) {
        if (!leg || !leg.account) { errors.push('leg-missing-account'); continue; }
        if (leg.side !== 'debit' && leg.side !== 'credit') errors.push('leg-bad-side · ' + leg.side);
        if (typeof leg.amount !== 'number' || leg.amount <= 0) errors.push('leg-bad-amount');
        if (!leg.currency) errors.push('leg-missing-currency');
        if (leg.side === 'debit')  debitTotal  += leg.amount;
        if (leg.side === 'credit') creditTotal += leg.amount;
        if (leg.currency) currencies.add(leg.currency);
    }
    if (currencies.size > 1) errors.push('mixed-currencies · ' + Array.from(currencies).join(','));
    if (Math.abs(debitTotal - creditTotal) > 0.01) {
        errors.push('legs-not-balanced · debit=' + debitTotal.toFixed(2) + ' credit=' + creditTotal.toFixed(2));
    }
    return { ok: errors.length === 0, errors, debitTotal, creditTotal };
}

// computeBalanceByAccount · pura · agrega legs de TOTS els entries vàlids.
// Retorna Map<account, { debit, credit, balance, kind, positiveSide }>
// balance · positiu si l'account té saldo "natural" (asset amb debit · etc).
// Optionally filtrat per `asOf` (ISO date string · inclou entries amb date <= asOf).
export function computeBalanceByAccount(entries, { asOf = null } = {}) {
    const balances = new Map();
    for (const entry of entries) {
        if (!entry || !entry.content) continue;
        if (asOf && entry.content.date && entry.content.date > asOf) continue;
        const validation = validateLedgerEntry(entry);
        if (!validation.ok) continue;
        for (const leg of entry.content.legs || []) {
            if (!leg || !leg.account) continue;
            const meta = accountKindFor(leg.account);
            const cur = balances.get(leg.account) || {
                account:      leg.account,
                debit:        0,
                credit:       0,
                balance:      0,
                kind:         meta.kind,
                positiveSide: meta.positiveSide,
                label:        meta.label,
            };
            if (leg.side === 'debit')  cur.debit  += leg.amount;
            if (leg.side === 'credit') cur.credit += leg.amount;
            // Balance signat segons positiveSide · per accounts asset (debit positiu)
            // el balance és debit - credit · per liability/income és credit - debit.
            if (meta.positiveSide === 'debit') {
                cur.balance = cur.debit - cur.credit;
            } else {
                cur.balance = cur.credit - cur.debit;
            }
            balances.set(leg.account, cur);
        }
    }
    return balances;
}

// computePLForPeriod · pura · profit & loss per a un període [from, to].
// Retorna { revenue, expenses, profit, byAccount: Map }
export function computePLForPeriod(entries, { from = null, to = null } = {}) {
    let revenue = 0, expenses = 0;
    const byAccount = new Map();
    for (const entry of entries) {
        if (!entry || !entry.content) continue;
        const d = entry.content.date;
        if (from && d < from) continue;
        if (to   && d > to)   continue;
        const validation = validateLedgerEntry(entry);
        if (!validation.ok) continue;
        for (const leg of entry.content.legs || []) {
            const meta = accountKindFor(leg.account);
            if (meta.kind === 'income') {
                // credit augmenta revenue · debit redueix (notes credit / refund)
                const delta = (leg.side === 'credit' ? leg.amount : -leg.amount);
                revenue += delta;
                byAccount.set(leg.account, (byAccount.get(leg.account) || 0) + delta);
            } else if (meta.kind === 'expense') {
                // debit augmenta expense
                const delta = (leg.side === 'debit' ? leg.amount : -leg.amount);
                expenses += delta;
                byAccount.set(leg.account, (byAccount.get(leg.account) || 0) + delta);
            }
        }
    }
    return {
        revenue,
        expenses,
        profit: revenue - expenses,
        byAccount,
    };
}

// computeBalanceSheet · pura · separa balances per kind (asset/liability/equity).
// Retorna { assets, liabilities, equity, totalAssets, totalLiabilitiesAndEquity, balanced }
export function computeBalanceSheet(entries, { asOf = null } = {}) {
    const balances = computeBalanceByAccount(entries, { asOf });
    let assets = [], liabilities = [], equity = [];
    let totalAssets = 0, totalLiabilities = 0, totalEquity = 0;
    for (const b of balances.values()) {
        if (b.kind === 'asset') {
            assets.push(b);
            totalAssets += b.balance;
        } else if (b.kind === 'liability') {
            liabilities.push(b);
            totalLiabilities += b.balance;
        } else if (b.kind === 'equity') {
            equity.push(b);
            totalEquity += b.balance;
        }
    }
    // P&L del període total (sense date filter · all-time)
    const pl = computePLForPeriod(entries, {});
    // Net income afegit a equity (retained earnings implícit)
    const retainedEarnings = pl.profit;
    totalEquity += retainedEarnings;
    const totalLE = totalLiabilities + totalEquity;
    return {
        assets,
        liabilities,
        equity,
        retainedEarnings,
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalLiabilitiesAndEquity: totalLE,
        balanced: Math.abs(totalAssets - totalLE) < 0.01,
    };
}

// quickEntry · helper · construeix un entry simple amb 2 legs (debit/credit)
// per a la majoria de casos d'ús · ex · cobrament · pagament.
export function quickEntry({
    projectId   = null,
    date        = null,
    description = '',
    debitAccount,
    creditAccount,
    amount,
    currency    = 'EUR',
    proof       = null,
    tags        = [],
    ts          = null,
} = {}) {
    if (!debitAccount || !creditAccount) throw new Error('debitAccount + creditAccount required');
    if (typeof amount !== 'number' || amount <= 0) throw new Error('amount must be positive');
    let entry = buildEmptyLedgerEntry({ projectId, description, date, ts, currency });
    entry = addLeg(entry, { account: debitAccount,  side: 'debit',  amount, currency });
    entry = addLeg(entry, { account: creditAccount, side: 'credit', amount, currency });
    entry.content.proof = proof;
    entry.content.tags  = tags.slice();
    return entry;
}

// =============================================================================
// AUDIT-READY · sprint A · proof-of-value-accounting · CERT-001
//
// Funcions per a fer la comptabilitat de valor "certificable" amb:
//   - ECDSA signatures opcionals per entry (signedBy did + signature)
//   - Llista de proofs[] (arweave-txid · polygon-txhash · attestation-id)
//   - Audit score (0-100) amb breakdown de motivs · per QA dashboard
//   - Triple-entry validation rule · si total > THRESHOLD_EUR ≥2 proofs
//
// Pure (excepte signLedgerEntry/verifyLedgerEntry que usen Web Crypto async)
// =============================================================================

export const LEDGER_AUDIT_VERSION = '1.0';

// Threshold per a quan exigir proofs · entries amb total >= aquest valor
// SHAN de tenir ≥2 proofs per ser considerades "auditades".
export const AUDIT_THRESHOLD_EUR = 100;

// PROOF_KINDS · tipus de proves vàlides triple-entry
export const PROOF_KINDS = Object.freeze([
    'arweave-txid',     // permaweb anchor
    'polygon-txhash',   // ERC-1155 anchor (phase 2)
    'attestation-id',   // signed attestation by counter-party
    'invoice-id',       // local invoice link
    'external-doc',     // external document URL
]);

// addProofToEntry · pure · afegeix proof a content.proofs[] (immutable)
// args · { kind, value, signedBy, signedAt? }
// Si proof amb mateix kind + value ja existeix · no duplica.
export function addProofToEntry(entry, proof) {
    if (!entry || !entry.content) throw new Error('entry required');
    if (!proof || typeof proof !== 'object') throw new Error('proof object required');
    if (!proof.kind || !PROOF_KINDS.includes(proof.kind)) {
        throw new Error('proof.kind must be one of ' + PROOF_KINDS.join('|'));
    }
    if (!proof.value || typeof proof.value !== 'string') {
        throw new Error('proof.value (string) required');
    }
    const existing = entry.content.proofs || [];
    const dup = existing.find(p => p.kind === proof.kind && p.value === proof.value);
    if (dup) return entry;     // dedupe · no mut
    const newProof = {
        kind:     proof.kind,
        value:    proof.value,
        signedBy: proof.signedBy || null,
        signedAt: proof.signedAt || new Date().toISOString(),
    };
    return {
        ...entry,
        content: {
            ...entry.content,
            proofs: [...existing, newProof],
        },
        updatedAt: Date.now(),
    };
}

// removeProofFromEntry · pure · per index
export function removeProofFromEntry(entry, index) {
    const proofs = entry?.content?.proofs || [];
    if (index < 0 || index >= proofs.length) throw new Error('proof index out of range');
    return {
        ...entry,
        content: {
            ...entry.content,
            proofs: proofs.filter((_, i) => i !== index),
        },
        updatedAt: Date.now(),
    };
}

// signLedgerEntry · ASYNC · firma l'entry amb ECDSA P-256.
// Reusa nodeSigningService internament (consistent amb resta del sistema).
// Retorna · entry signat amb content.signature + content.signedBy.
//
// NOTE · imports lazy per evitar circular dep · perquè ledgerService és core.
export async function signLedgerEntry({ entry, privateJwk, signerDid } = {}) {
    if (!entry || !entry.content) throw new Error('entry required');
    if (!privateJwk) throw new Error('privateJwk (ECDSA P-256) required');
    if (!signerDid || typeof signerDid !== 'string') throw new Error('signerDid required (did:sos:...)');
    const { signNode } = await import('./nodeSigningService.js');
    // Anclamos signerDid abans de signar · canonical inclou tot el content
    const prep = {
        ...entry,
        content: {
            ...entry.content,
            signedBy:  signerDid,
            // signedAt s'afegeix per la signatura (nodeSigningService ho inclou)
        },
    };
    const signed = await signNode({ node: prep, privateJwk });
    return signed;
}

// verifyLedgerEntry · ASYNC · valida content.signature contra content
// (signature canonical via nodeSigningService.verifyNode).
// Retorna · { ok: bool, reason: string }
export async function verifyLedgerEntry(entry) {
    if (!entry || !entry.content) return { ok: false, reason: 'no-content' };
    if (!entry.content.signature) return { ok: false, reason: 'unsigned' };
    try {
        const { verifyNode } = await import('./nodeSigningService.js');
        const ok = await verifyNode(entry);
        return { ok: !!ok, reason: ok ? 'valid' : 'invalid-signature' };
    } catch (e) {
        return { ok: false, reason: 'verify-throw · ' + (e?.message || 'unknown') };
    }
}

// computeEntryAuditState · pure · retorna estat d'auditoria per a 1 entry
// Retorna · {
//   signed:        bool · té content.signature
//   signedBy:      string|null · DID si signat
//   proofsCount:   int · # proofs[]
//   proofsByKind:  { kind: count }
//   needsProofs:   bool · si total >= AUDIT_THRESHOLD_EUR
//   meetsThreshold: bool · si needsProofs i ≥2 proofs (o no needs)
//   level:         'audited' | 'signed' | 'unsigned'
// }
export function computeEntryAuditState(entry) {
    if (!entry || !entry.content) return { signed: false, signedBy: null, proofsCount: 0, proofsByKind: {}, needsProofs: false, meetsThreshold: false, level: 'unsigned' };
    const c = entry.content;
    const signed = !!c.signature;
    const proofs = c.proofs || [];
    const proofsByKind = {};
    for (const p of proofs) {
        proofsByKind[p.kind] = (proofsByKind[p.kind] || 0) + 1;
    }
    // Total · sumatori legs side debit (sols un costat · l'altre sum=)
    let totalEur = 0;
    for (const leg of c.legs || []) {
        if (leg.side === 'debit') totalEur += (leg.amount || 0);
    }
    const needsProofs = totalEur >= AUDIT_THRESHOLD_EUR;
    const meetsThreshold = needsProofs ? proofs.length >= 2 : true;
    let level = 'unsigned';
    if (signed) level = meetsThreshold ? 'audited' : 'signed';
    return {
        signed,
        signedBy:       c.signedBy || null,
        proofsCount:    proofs.length,
        proofsByKind,
        totalEur,
        needsProofs,
        meetsThreshold,
        level,
    };
}

// computeLedgerAuditScore · pure · agrega audit state per a totes entries
// d'un projecte i retorna un score 0-100 + reasons per a quality cert.
//
// args · entries · array de ledger_entry nodes
// Retorna · {
//   score:         0-100,
//   level:         'gold' | 'silver' | 'bronze' | 'draft',
//   counts:        { total, balanced, signed, audited, withProofs, needsProofs },
//   ratios:        { balanced, signed, audited },
//   reasons:       [{ kind: 'positive'|'warning'|'penalty', text }],
//   thresholdEur:  AUDIT_THRESHOLD_EUR,
// }
export function computeLedgerAuditScore(entries) {
    const out = {
        score:        0,
        level:        'draft',
        counts:       { total: 0, balanced: 0, signed: 0, audited: 0, withProofs: 0, needsProofs: 0 },
        ratios:       { balanced: 0, signed: 0, audited: 0 },
        reasons:      [],
        thresholdEur: AUDIT_THRESHOLD_EUR,
    };
    if (!Array.isArray(entries) || entries.length === 0) {
        out.reasons.push({ kind: 'warning', text: 'Cap entry · auditoria buida' });
        return out;
    }

    let valid = 0, signed = 0, audited = 0, withProofs = 0, needsProofs = 0;
    for (const e of entries) {
        out.counts.total++;
        const vRes = validateLedgerEntry(e);
        if (vRes.ok) {
            valid++;
            out.counts.balanced++;
        }
        const a = computeEntryAuditState(e);
        if (a.signed)       { signed++; out.counts.signed++; }
        if (a.proofsCount > 0) { withProofs++; out.counts.withProofs++; }
        if (a.needsProofs)  out.counts.needsProofs++;
        if (a.level === 'audited') { audited++; out.counts.audited++; }
    }
    const total = out.counts.total;
    out.ratios.balanced = total > 0 ? valid / total : 0;
    out.ratios.signed   = total > 0 ? signed / total : 0;
    out.ratios.audited  = total > 0 ? audited / total : 0;

    // Score · ponderació
    //   balanced · 30 pts (essential)
    //   signed   · 30 pts (cert basics)
    //   audited  · 30 pts (triple-entry needs over threshold)
    //   coverage · 10 pts (≥3 entries · sense gap)
    let score = 0;
    score += 30 * out.ratios.balanced;
    score += 30 * out.ratios.signed;
    score += 30 * out.ratios.audited;
    if (total >= 3) score += 10;
    else if (total >= 1) score += Math.round((total / 3) * 10);

    score = Math.round(Math.max(0, Math.min(100, score)));
    out.score = score;

    // Level segons score
    if (score >= 85)      out.level = 'gold';
    else if (score >= 65) out.level = 'silver';
    else if (score >= 40) out.level = 'bronze';
    else                  out.level = 'draft';

    // Reasons
    if (out.ratios.balanced === 1) out.reasons.push({ kind: 'positive', text: 'Tots els entries quadren (Σdebit=Σcredit)' });
    else                            out.reasons.push({ kind: 'penalty', text: (total - valid) + ' entries no quadrats · revisar' });
    if (out.ratios.signed >= 0.9)   out.reasons.push({ kind: 'positive', text: 'Quasi tots els entries signats amb ECDSA' });
    else if (out.ratios.signed >= 0.5) out.reasons.push({ kind: 'warning', text: 'Sols ' + Math.round(out.ratios.signed * 100) + '% entries signats' });
    else                            out.reasons.push({ kind: 'penalty', text: 'Pocs entries signats · cal ECDSA signature per certificació' });
    if (out.counts.needsProofs > 0) {
        const auditableRatio = out.counts.needsProofs > 0 ? out.counts.audited / out.counts.needsProofs : 0;
        if (auditableRatio === 1) out.reasons.push({ kind: 'positive', text: 'Tots els entries > €' + AUDIT_THRESHOLD_EUR + ' tenen ≥2 proofs' });
        else                      out.reasons.push({ kind: 'warning', text: (out.counts.needsProofs - out.counts.audited) + ' entries > €' + AUDIT_THRESHOLD_EUR + ' sense proofs suficients (cal ≥2)' });
    }
    if (out.counts.withProofs > 0)  out.reasons.push({ kind: 'positive', text: out.counts.withProofs + ' entries amb proofs (triple-entry)' });
    if (total < 3)                  out.reasons.push({ kind: 'warning', text: 'Cobertura mínima · cal ≥3 entries per cert sòlid' });

    return out;
}

// AUDIT_LEVEL_META · pure · meta per a UI display
export const AUDIT_LEVEL_META = Object.freeze({
    gold:    { label: 'Gold', icon: '🥇', color: '#facc15', minScore: 85, description: 'Auditat · signat · ≥85/100 · ready per audit extern' },
    silver:  { label: 'Silver', icon: '🥈', color: '#cbd5e1', minScore: 65, description: 'Bona qualitat · ≥65/100 · cal alguns proofs' },
    bronze:  { label: 'Bronze', icon: '🥉', color: '#f59e0b', minScore: 40, description: 'En marxa · ≥40/100 · revisar signatures' },
    draft:   { label: 'Draft', icon: '✏️', color: '#94a3b8', minScore: 0, description: 'Esborrany · cal balancejar · signar · provar' },
});
