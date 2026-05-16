// UX-COMPONENTS · tests pure (HTML helpers)
import {
    toast, emptyStateHtml, confirmModalHtml,
    TOAST_HOST_ID, TOAST_CSS_ID,
} from '../core/uxComponents.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== UX-COMPONENTS · uxComponents.js ===\n');

// 1 · Constants
t(typeof TOAST_HOST_ID === 'string',                     'A · TOAST_HOST_ID exported');
t(typeof TOAST_CSS_ID === 'string',                      'A · TOAST_CSS_ID exported');
t(TOAST_HOST_ID !== TOAST_CSS_ID,                        'A · IDs distinct');

// 2 · toast · safe en Node (no document)
const dismiss = toast({ kind: 'success', text: 'Test' });
t(typeof dismiss === 'function',                         'B · toast retorna dismiss fn (Node-safe)');

// 3 · emptyStateHtml · happy path
const empty1 = emptyStateHtml({
    icon: '📭', title: 'Buit', body: 'sense dades',
    ctaLabel: 'Crear', ctaHref: '/new',
});
t(empty1.includes('📭'),                                'C · empty · icon present');
t(empty1.includes('Buit'),                              'C · empty · title');
t(empty1.includes('sense dades'),                       'C · empty · body');
t(empty1.includes('Crear'),                             'C · empty · CTA label');
t(empty1.includes('href="/new"'),                       'C · empty · CTA href');
t(empty1.includes('data-link'),                         'C · empty · router-compat');

// 4 · emptyStateHtml sense CTA
const empty2 = emptyStateHtml({ icon: '·', title: 'X', body: 'Y' });
t(!empty2.includes('href="'),                           'C · sense CTA · no href');

// 5 · emptyStateHtml amb secondary
const empty3 = emptyStateHtml({
    icon: '✨', title: 'T', body: 'b',
    ctaLabel: 'Primary', ctaHref: '/p',
    secondaryLabel: 'Aprèn', secondaryHref: '/learn',
});
t(empty3.includes('Primary'),                           'C · primary present');
t(empty3.includes('Aprèn'),                             'C · secondary present');

// 6 · emptyStateHtml · escape XSS
const xss = emptyStateHtml({
    icon: '·', title: '<script>alert(1)</script>',
    body: '"onerror=" hack',
});
t(!xss.includes('<script>'),                            'C · escapa <script>');
t(!xss.includes('"onerror'),                            'C · escapa cometes (cap onerror= raw)');

// 7 · confirmModalHtml · happy path
const cm = confirmModalHtml({
    title: 'Esborrar?', body: 'Acció irreversible',
    confirmLabel: 'Sí', cancelLabel: 'No',
    danger: true,
});
t(cm.includes('Esborrar?'),                             'D · confirm title');
t(cm.includes('Acció irreversible'),                    'D · confirm body');
t(cm.includes('Sí'),                                    'D · confirm label');
t(cm.includes('No'),                                    'D · cancel label');
t(cm.includes('data-confirm-ok'),                       'D · ok button has data-confirm-ok');
t(cm.includes('data-confirm-cancel'),                   'D · cancel button has data-confirm-cancel');
t(cm.includes('ef4444'),                                'D · danger style · red bg');

// 8 · confirmModalHtml · sense danger · style purple
const cmNice = confirmModalHtml({ title: 'OK?', body: 'b' });
t(cmNice.includes('a855f7') || cmNice.includes('6366f1'), 'D · default · purple gradient');
t(!cmNice.includes('ef4444'),                           'D · default · no red');

// 9 · confirmModalHtml · custom id
const cmId = confirmModalHtml({ id: 'myCustomId', title: 'T', body: 'b' });
t(cmId.includes('id="myCustomId"'),                     'D · custom id applied');

// 10 · No mutation across calls
const a = emptyStateHtml({ icon: 'a', title: 't', body: 'b' });
const b = emptyStateHtml({ icon: 'b', title: 't', body: 'b' });
t(a !== b,                                              'E · distinct calls · distinct output');
t(a.includes('a') && !a.includes(b.match(/aria-hidden="true">b</)?.[0] || 'zzz'), 'E · no cross-contamination');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
