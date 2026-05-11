// FUND-FLOW-001 · tests stand-alone (sprint A · C · D pure helpers)
// node js/tests/fundFlow.test.js

import * as ws  from '../core/walletService.js';
import * as drs from '../core/distributionRuleService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}

function run() {
    // ── Sprint A · personal wallet + transfer helpers ──────────────
    t(ws.personalWalletIdFor('@alvaro') === '__personal_alvaro__', 'A · personalWalletIdFor format');
    t(ws.personalWalletIdFor('@MARC') === '__personal_marc__',     'A · personalWalletIdFor lowercase');
    t(ws.personalWalletIdFor() === '__personal_alvaro__',          'A · personalWalletIdFor default @alvaro');
    t(ws.isPersonalWallet('__personal_alvaro__') === true,         'A · isPersonalWallet positive');
    t(ws.isPersonalWallet('proj-x') === false,                     'A · isPersonalWallet negative');
    t(ws.isPersonalWallet(null) === false,                         'A · isPersonalWallet null-safe');

    // ── Sprint C · distribution rule + income split ───────────────
    t(drs.BPS_TOTAL === 10000,                                     'C · BPS_TOTAL 10000');
    t(drs.DEFAULT_RULE.operatingReserveBps === 2000,               'C · default reserve 20%');
    t(drs.DEFAULT_RULE.stakeholdersBps === 8000,                   'C · default stake 80%');

    const id = drs.distributionRuleIdFor('proj-x');
    t(id === 'proj-x::distribution-rule',                          'C · rule id format');

    const rule = drs.buildDistributionRule({ projectId:'proj-x', operatingReserveBps:3000, stakeholdersBps:7000 });
    t(rule.type === 'distribution_rule',                           'C · rule type correcte');
    t(rule.content.operatingReserveBps === 3000,                   'C · custom reserve');

    let threwInvalidSum = false;
    try { drs.buildDistributionRule({ projectId:'p', operatingReserveBps:7000, stakeholdersBps:5000 }); }
    catch (e) { threwInvalidSum = /must be/i.test(e.message); }
    t(threwInvalidSum,                                              'C · build refusa suma > 10000');

    const v1 = drs.validateDistributionRule({ type:'distribution_rule', content:{operatingReserveBps:5000,stakeholdersBps:6000} });
    t(!v1.valid,                                                    'C · validate refusa sum > 10000');

    // Income split
    const split = drs.computeIncomeSplit({ amountEur:100 });
    t(split.reserveEur === 20,                                      'C · 100€ × 20% = 20€');
    t(split.stakeholdersEur === 80,                                 'C · 100€ × 80% = 80€');
    t(split.leftoverEur === 0,                                      'C · no leftover');

    const splitCustom = drs.computeIncomeSplit({ amountEur:50, rule:{operatingReserveBps:1000,stakeholdersBps:5000} });
    t(splitCustom.reserveEur === 5,                                 'C · custom 10% = 5€');
    t(splitCustom.stakeholdersEur === 25,                           'C · custom 50% = 25€');
    t(splitCustom.leftoverEur === 20,                               'C · 40% leftover = 20€');

    const splitZero = drs.computeIncomeSplit({ amountEur:0 });
    t(splitZero.reserveEur === 0 && splitZero.stakeholdersEur === 0, 'C · amount 0 → all zeros');

    // ── computeStakeholdersPool · sumes virtuals ──────────────────
    const empty = ws.computeStakeholdersPool(null);
    t(empty.allocatedEur === 0 && empty.claimableEur === 0,         'C · pool null wallet → zeros');

    const wallet1 = {
        content: {
            balanceEur: 200,
            movements: [
                { kind:'topup',   source:'manual', amountEur:50 },  // NO income
                { kind:'topup',   source:'income', amountEur:100 }, // 80€ a pool (80% default)
                { kind:'topup',   source:'income', amountEur:50 },  // 40€ més
            ],
        },
    };
    const p1 = ws.computeStakeholdersPool(wallet1, 8000);
    t(p1.allocatedEur === 120,                                      'C · pool 80+40 = 120€ (ignore manual topup)');
    t(p1.claimedEur === 0,                                          'C · cap claim encara');
    t(p1.claimableEur === 120,                                      'C · claimable = pool sencer');

    // Amb claims previs
    const wallet2 = {
        content: {
            balanceEur: 70,
            movements: [
                { kind:'topup',   source:'income',             amountEur:100 },  // pool +80
                { kind:'consume', source:'stakeholder-claim',  amountEur:30, ref:'claim-1:party-alice' },
            ],
        },
    };
    const p2 = ws.computeStakeholdersPool(wallet2, 8000);
    t(p2.allocatedEur === 80,                                       'C · pool 80€');
    t(p2.claimedEur === 30,                                         'C · claimed 30€');
    t(p2.claimableEur === 50,                                       'C · claimable = 80-30 = 50€');

    // Diferent ratio (70/30)
    const wallet3 = {
        content: { balanceEur: 100, movements: [{ kind:'topup', source:'income', amountEur:100 }] },
    };
    const p3a = ws.computeStakeholdersPool(wallet3, 7000);
    t(Math.abs(p3a.allocatedEur - 70) < 0.001,                      'C · pool 70% = 70€');
    const p3b = ws.computeStakeholdersPool(wallet3, 5000);
    t(Math.abs(p3b.allocatedEur - 50) < 0.001,                      'C · pool 50% = 50€');

    // ── Sprint D · withdrawClaim · validations ──────────────────────
    // No KB available · només verifiquem que les validacions inicials llencen errors
    let threwNoProj = false;
    Promise.resolve()
        .then(() => ws.withdrawClaim({ partyId:'x', toHandle:'@y', amountEur:1 }))
        .catch(e => { threwNoProj = /projectId/.test(e.message); })
        .then(() => {
            t(threwNoProj, 'D · withdrawClaim sense projectId → throw');
            console.log('---');
            console.log(pass + ' pass · ' + fail + ' fail');
            if (fail > 0) process.exit(1);
        });
}

run();
