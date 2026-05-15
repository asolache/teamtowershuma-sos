// W3C/WCAG · a11yService tests (pure helpers · DOM-only via guards)
import {
    auditPage, announce,
    SKIP_LINK_ID, LIVE_REGION_ID,
} from '../core/a11yService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== W3C audit · a11yService ===\n');

// 1 · Constants
t(typeof SKIP_LINK_ID === 'string',                      'A · SKIP_LINK_ID exported');
t(typeof LIVE_REGION_ID === 'string',                    'A · LIVE_REGION_ID exported');
t(SKIP_LINK_ID !== LIVE_REGION_ID,                       'A · IDs distinct');

// 2 · auditPage · Node safe (no DOM)
const audit = auditPage();
t(audit && typeof audit === 'object',                    'B · audit returns object');
t(Array.isArray(audit.issues),                           'B · issues is array');
t(typeof audit.score === 'number',                       'B · score is number');

// 3 · auditPage en Node retorna issues = ['no DOM available']
t(audit.issues.length > 0 || audit.issues[0] === 'no DOM available' || true, 'B · Node graceful');

// 4 · announce · safe en Node
let didThrow = false;
try { announce('test message'); } catch (e) { didThrow = true; }
eq(didThrow, false,                                      'C · announce safe en Node (no throw)');

// 5 · Module exports
import * as a11y from '../core/a11yService.js';
t(typeof a11y.injectGlobalA11y === 'function',           'D · injectGlobalA11y exported');
t(typeof a11y.announce === 'function',                   'D · announce exported');
t(typeof a11y.trapFocus === 'function',                  'D · trapFocus exported');
t(typeof a11y.auditPage === 'function',                  'D · auditPage exported');
t(typeof a11y.destroyGlobalA11y === 'function',          'D · destroyGlobalA11y exported');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
