// WALLET-AUTH-001 sprint D · tests stand-alone per identifyModalService
// Ús: node js/tests/identifyModal.test.js

import * as svc from '../core/identifyModalService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== WALLET-AUTH-001 sprint D · identifyModalService ===\n');

// ─── A · renderModalHtml · pur · cap state ─────────────────────────────
t(typeof svc.renderModalHtml === 'function',                          'A · renderModalHtml exportat');

const h1 = svc.renderModalHtml({ activeTab: 'wallet' });
t(typeof h1 === 'string' && h1.length > 200,                          'A · HTML retornat');
t(h1.includes('🔑 Identifica'),                                       'A · títol al modal');
t(h1.includes('data-tab="wallet"'),                                   'A · tab wallet present');
t(h1.includes('data-tab="oauth"'),                                    'A · tab oauth present');
t(h1.includes('data-tab="local"'),                                    'A · tab local present');
t(h1.includes('data-im-overlay'),                                     'A · overlay attribute');
t(h1.includes('data-action="close"'),                                 'A · close button');

// ─── B · tab wallet · sense connexió + sense wander ────────────────────
const hWalletNoWander = svc.renderModalHtml({ activeTab: 'wallet', wanderAvailable: false });
t(hWalletNoWander.includes('Wander no detectat'),                     'B · sense Wander · missatge install');
t(hWalletNoWander.includes('wander.app'),                             'B · link wander.app');

// ─── C · tab wallet · Wander available · botó connect ──────────────────
const hWalletAvail = svc.renderModalHtml({ activeTab: 'wallet', wanderAvailable: true });
t(hWalletAvail.includes('data-action="connect-wander"'),              'C · botó connect-wander');
t(hWalletAvail.includes('🦊'),                                        'C · icona Wander');

// ─── D · tab wallet · Wallet connectada ────────────────────────────────
const hConnected = svc.renderModalHtml({
    activeTab: 'wallet',
    wallet: { address: 'AAAAAAAA-BBBBBBBB-CCCCCCCC-DDDDDDEEEE', source: 'wander', connectedAt: Date.now() },
    wanderAvailable: true,
});
t(hConnected.includes('connectat'),                                   'D · text connectat');
t(hConnected.includes('…'),                                           'D · address truncada (ellipsis)');
t(hConnected.includes('AAAAAAAA-B'),                                  'D · address inici visible');
t(hConnected.includes('DEEEE') || hConnected.includes('DDEEEE'),     'D · address final visible (slice -6)');
t(hConnected.includes('✓'),                                           'D · check mark');

// ─── E · tab OAuth · 3 stubs ───────────────────────────────────────────
const hOauth = svc.renderModalHtml({ activeTab: 'oauth' });
t(hOauth.includes('data-action="oauth-github"'),                      'E · GitHub stub');
t(hOauth.includes('data-action="oauth-google"'),                      'E · Google stub');
t(hOauth.includes('data-action="oauth-magic"'),                       'E · Magic-link stub');
t(hOauth.includes('sprint C futur'),                                  'E · marcat futur');

// ─── F · tab local-first · DID display ─────────────────────────────────
const hLocalNoDid = svc.renderModalHtml({ activeTab: 'local' });
t(hLocalNoDid.includes('sense DID local'),                            'F · sense DID · banner warning');

const hLocalDid = svc.renderModalHtml({
    activeTab: 'local',
    identity: { primaryDid: 'did:sos:abc1234567890def1234567890abc12' },
});
t(hLocalDid.includes('DID local actiu'),                              'F · amb DID · OK');
t(hLocalDid.includes('did:sos:abc12345'),                             'F · DID curt visible');
t(hLocalDid.includes('data-action="copy-did"'),                       'F · copy button');

// ─── G · identifyButtonHtml · trigger ──────────────────────────────────
const btn1 = svc.identifyButtonHtml({ size: 'sm' });
t(btn1.includes('data-open-identify'),                                'G · data-open-identify attribute');
t(btn1.includes('Identifica'),                                        'G · label "Identifica\'t"');
t(btn1.includes('🔑'),                                                'G · icon key');

const btn2 = svc.identifyButtonHtml({ size: 'lg' });
t(btn2.includes('10px 18px'),                                         'G · size lg · padding gran');

// ─── H · ATTACK · HTML escapejat · address malicious ───────────────────
const hAttack = svc.renderModalHtml({
    activeTab: 'wallet',
    wallet: { address: '<img src=x onerror=alert(1)>', source: 'wander' },
});
t(!hAttack.includes('<img src=x'),                                    'H · script escaped');
t(hAttack.includes('&lt;img'),                                        'H · &lt; al output');

// ─── I · _resetIdentifyModal · cleanup test helper ─────────────────────
t(typeof svc._resetIdentifyModal === 'function',                      'I · _resetIdentifyModal export');
// Idempotent · cap throw
svc._resetIdentifyModal();
svc._resetIdentifyModal();
t(true,                                                                'I · idempotent · cap throw');

// ─── J · closeIdentifyModal sense modal · safe ─────────────────────────
svc.closeIdentifyModal();
t(true,                                                                'J · closeIdentifyModal sense DOM · safe');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
