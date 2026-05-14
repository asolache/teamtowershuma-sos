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
