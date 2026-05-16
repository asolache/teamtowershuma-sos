// V2-EVOL Fase A · tests del component DeprecatedBanner reutilitzable
// Veure `docs/STUDY-v2-evolution-plan-2026-05-16.md` Fase A.

import { renderDeprecatedBanner, renderCanonicalBadge } from '../core/deprecatedBanner.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== V2-EVOL · DeprecatedBanner ===\n');

// ─── A · banner default ──────────────────────────────────────────────────
const def = renderDeprecatedBanner();
t(typeof def === 'string' && def.length > 100,         'A · retorna string HTML');
t(def.includes('class="sos-depr-banner"'),             'A · classe canonical present');
t(def.includes('role="status"'),                        'A · ARIA role status');
t(def.includes('aria-label='),                          'A · ARIA label · accessibilitat');
t(def.includes('Vista legacy'),                         'A · title default');
t(def.includes('href="/"'),                             'A · canonical path default /');

// ─── B · banner amb params ───────────────────────────────────────────────
const custom = renderDeprecatedBanner({
    canonicalPath:  '/settings-v2',
    canonicalLabel: 'Settings V2',
    reason:         'Settings antic · usa la versió 5 tabs',
    etaSprint:      'sprint legendary',
    title:          'Settings legacy',
});
t(custom.includes('href="/settings-v2"'),               'B · canonicalPath aplicat');
t(custom.includes('Settings V2'),                       'B · canonicalLabel al CTA');
t(custom.includes('Settings antic · usa la versió 5 tabs'), 'B · reason aplicat');
t(custom.includes('sprint legendary'),                  'B · etaSprint aplicat');
t(custom.includes('Settings legacy'),                   'B · title aplicat');

// ─── C · escape HTML · seguretat XSS ─────────────────────────────────────
const xss = renderDeprecatedBanner({
    canonicalPath:  '/x"><script>alert(1)</script>',
    canonicalLabel: '<img src=x onerror=alert(1)>',
    reason:         'A & B < C > D "E"',
    title:          '<<<bad>>>',
});
t(!xss.includes('<script>'),                            'C · script tag escapat');
t(!xss.includes('<img src=x'),                          'C · img tag escapat');
t(xss.includes('A &amp; B &lt; C &gt; D'),              'C · entities escapades');
t(xss.includes('&lt;&lt;&lt;bad&gt;&gt;&gt;'),          'C · title escapat');

// ─── D · router compat · data-link present ───────────────────────────────
t(def.includes('data-link'),                            'D · data-link · router consumeix');

// ─── E · canonical badge ─────────────────────────────────────────────────
const badge = renderCanonicalBadge();
t(typeof badge === 'string',                            'E · badge retorna string');
t(badge.includes('V2 · oficial'),                       'E · label default');
t(badge.includes('background:rgba(34,197,94'),          'E · color verd indicatiu');
t(badge.includes('aria') || badge.includes('title='),   'E · té tooltip/aria explicatiu');

const badgeCustom = renderCanonicalBadge({ label: 'Versió bona' });
t(badgeCustom.includes('Versió bona'),                  'E · label custom aplicat');

// ─── F · null safety als params ─────────────────────────────────────────
const nullBanner = renderDeprecatedBanner({ canonicalPath: null, canonicalLabel: null });
t(typeof nullBanner === 'string',                       'F · params null · cap petar');
t(!nullBanner.includes('null'),                         'F · null no apareix com a string');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
