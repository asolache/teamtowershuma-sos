// BACKLOG · mock-badge-cards · tests stand-alone per al helper isMockTxId
// Ús: node js/tests/opportunitiesMockBadge.test.js

import { isMockTxId } from '../views/OpportunitiesView.js';

let pass = 0, fail = 0;
function t(cond, msg) { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } }

console.log('\n=== BACKLOG · mock-badge-cards · isMockTxId ===\n');

// A · detecció bàsica
t(isMockTxId('mock-abc123') === true,                                    'A · "mock-…" detected');
t(isMockTxId('mock-')        === true,                                    'A · "mock-" raw detected');
t(isMockTxId('Mock-abc')     === false,                                   'A · case-sensitive · "Mock-" rebutjat');
t(isMockTxId('not-mock')     === false,                                   'A · "not-mock" rebutjat');
t(isMockTxId('arweave-tx-abc') === false,                                 'A · txId real rebutjat');
t(isMockTxId('')             === false,                                   'A · empty string rebutjat');

// B · null/undefined/non-string
t(isMockTxId(null)           === false,                                   'B · null no crash');
t(isMockTxId(undefined)      === false,                                   'B · undefined no crash');
t(isMockTxId(123)            === false,                                   'B · number no crash');
t(isMockTxId({ tx: 'mock-x' }) === false,                                 'B · object no crash');

// C · txIds Arweave-style (43 caràcters base64url) NO són mock
t(isMockTxId('IlxLwUjk5wMNZ7C-cI9aN6OPMlAaiqMHttq-7p5ZsR4') === false,    'C · txId Arweave 43-char no és mock');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
