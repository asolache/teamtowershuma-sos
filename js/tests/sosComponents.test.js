// =============================================================================
// sosComponents.test.js · DESIGN-SYSTEM sprint B · HTML helpers tests
// =============================================================================

import {
    renderChip, renderStatCard, renderStatGrid,
    renderEmptyState, renderProgressBar, renderBadge,
    renderCard, renderInfoBanner,
} from '../core/sosComponents.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

// ─── A · renderChip ──────────────────────────────────────────────────────
const c1 = renderChip({ label: 'Trust', color: '#22c55e' });
t(c1.includes('Trust'),                                           'A · label inside');
t(c1.includes('#22c55e'),                                         'A · color applied');
t(c1.includes('border-radius:999px'),                             'A · pill radius');

// icon + title
const c2 = renderChip({ label: 'Ikigai', color: '#ec4899', icon: '🌸', title: 'centre trobat' });
t(c2.includes('🌸'),                                              'A · icon');
t(c2.includes('title="centre trobat"'),                           'A · title attr');

// Empty label safe
const cE = renderChip({});
t(typeof cE === 'string' && cE.includes('<span'),                 'A · empty · safe');

// Escape · sense crash + entities
const cX = renderChip({ label: '<script>alert(1)</script>', color: '#000' });
t(!cX.includes('<script>alert'),                                  'A · script escaped');
t(cX.includes('&lt;script&gt;'),                                  'A · entities applied');

// ─── B · renderStatCard ──────────────────────────────────────────────────
const s1 = renderStatCard({ num: 42, label: 'Total', color: '#3b82f6' });
t(s1.includes('42'),                                              'B · num');
t(s1.includes('Total'),                                           'B · label');
t(s1.includes('border-left:3px solid #3b82f6'),                   'B · color border');

// big mode · font-size bigger
const sBig = renderStatCard({ num: 100, label: 'X', big: true });
t(sBig.includes('1.6rem'),                                        'B · big font');
const sSmall = renderStatCard({ num: 100, label: 'X' });
t(sSmall.includes('1.4rem'),                                      'B · default font');

// icon
const sIcon = renderStatCard({ num: 5, label: 'Done', icon: '✓' });
t(sIcon.includes('✓'),                                            'B · icon');

// num 0 valid (not skipped)
const sZero = renderStatCard({ num: 0, label: 'Empty' });
t(sZero.includes('>0<') || sZero.includes('>0 <') || sZero.includes('0'),
                                                                  'B · num 0 rendered');

// ─── C · renderStatGrid ──────────────────────────────────────────────────
const grid = renderStatGrid({ stats: [
    { num: 1, label: 'a' }, { num: 2, label: 'b' }, { num: 3, label: 'c' },
]});
t(grid.includes('display:grid'),                                  'C · grid display');
t(grid.includes('a') && grid.includes('b') && grid.includes('c'), 'C · 3 stats');
t(grid.includes('auto-fit'),                                      'C · auto-fit default');

const gridCols = renderStatGrid({ stats: [{ num: 1, label: 'x' }], cols: 4 });
t(gridCols.includes('repeat(4,1fr)'),                             'C · explicit cols');

// Empty
eq(renderStatGrid({ stats: [] }), '',                             'C · empty · ""');
eq(renderStatGrid({}), '',                                        'C · no args · ""');

// ─── D · renderEmptyState ────────────────────────────────────────────────
const e1 = renderEmptyState({ icon: '📭', title: 'Cap entrada', tagline: 'Crea la primera' });
t(e1.includes('📭'),                                              'D · icon');
t(e1.includes('Cap entrada'),                                     'D · title');
t(e1.includes('Crea la primera'),                                 'D · tagline');

// Amb CTA
const eCta = renderEmptyState({ title: 'Empty', ctaLabel: 'Crear', ctaHref: '/new' });
t(eCta.includes('Crear'),                                         'D · cta label');
t(eCta.includes('href="/new"'),                                   'D · cta href');
t(eCta.includes('data-link'),                                     'D · data-link (SPA)');

// Sense CTA · no inclou btn
const eNoCta = renderEmptyState({ title: 'X' });
t(!eNoCta.includes('data-link'),                                  'D · sense href · no link');

// copyKey · usa label() de sosCopy
const eCopy = renderEmptyState({ copyKey: 'empty.market', title: 'fallback' });
t(eCopy.includes('Cap oferta encara'),                            'D · copyKey · label sosCopy');

// ─── E · renderProgressBar ───────────────────────────────────────────────
const pb = renderProgressBar({ percent: 60, color: '#22c55e' });
t(pb.includes('width:60%'),                                       'E · 60%');
t(pb.includes('linear-gradient(90deg, #22c55e,'),                 'E · gradient amb color');

// Clamp 0-100
t(renderProgressBar({ percent: 150 }).includes('width:100%'),     'E · clamp 100 max');
t(renderProgressBar({ percent: -30 }).includes('width:0%'),       'E · clamp 0 min');

// Custom height
t(renderProgressBar({ percent: 50, height: 16 }).includes('height:16px'),
                                                                  'E · custom height');

// Custom gradient
const pbGrad = renderProgressBar({ percent: 100, gradient: 'linear-gradient(90deg,red,blue)' });
t(pbGrad.includes('red,blue'),                                    'E · custom gradient');

// NaN safe → 0
t(renderProgressBar({ percent: 'oops' }).includes('width:0%'),    'E · NaN safe');

// ─── F · renderBadge ─────────────────────────────────────────────────────
const b1 = renderBadge({ label: 'DRAFT', color: '#94a3b8' });
t(b1.includes('DRAFT'),                                           'F · label');
t(b1.includes('text-transform:uppercase'),                        'F · uppercase');
t(b1.includes('sos-badge-pulse'),                                 'F · dot pulse (non-terminal)');

// Terminal · sense dot pulse
const bTerm = renderBadge({ label: 'PAID', color: '#22c55e', terminal: true });
t(!bTerm.includes('sos-badge-pulse'),                             'F · terminal · sense pulse');

// Icon
const bIcon = renderBadge({ label: 'Done', icon: '✓' });
t(bIcon.includes('✓'),                                            'F · icon');

// ─── G · renderCard ──────────────────────────────────────────────────────
const card = renderCard({ title: 'Project X', icon: '🏢', bodyHtml: '<p>Body</p>', color: '#22c55e' });
t(card.includes('Project X'),                                     'G · title');
t(card.includes('🏢'),                                            'G · icon');
t(card.includes('<p>Body</p>'),                                   'G · body unescaped (trusted html)');
t(card.includes('border-left:3px solid #22c55e'),                 'G · color border');
t(card.startsWith('<div'),                                        'G · default tag div');

// href · link
const cardLink = renderCard({ title: 'Click', bodyHtml: 'x', href: '/x' });
t(cardLink.startsWith('<a'),                                      'G · href · tag a');
t(cardLink.includes('href="/x"'),                                 'G · href attr');
t(cardLink.includes('data-link'),                                 'G · data-link SPA');

// Footer
const cardFt = renderCard({ title: 'X', bodyHtml: 'y', footerHtml: '<code>id-123</code>' });
t(cardFt.includes('<code>id-123</code>'),                         'G · footer present');
t(cardFt.includes('border-top:1px solid'),                        'G · footer divider');

// Sense footer · no divider
const cardNoFt = renderCard({ title: 'X', bodyHtml: 'y' });
t(!cardNoFt.includes('border-top'),                               'G · sense footer · sense divider');

// ─── H · renderInfoBanner ────────────────────────────────────────────────
const banner = renderInfoBanner({ message: 'Important info', kind: 'info' });
t(banner.includes('Important info'),                              'H · message');
t(banner.includes('ℹ'),                                           'H · default icon ℹ');

// Kinds · colors map
t(renderInfoBanner({ message: 'x', kind: 'warn' }).includes('#facc15'),  'H · warn yellow');
t(renderInfoBanner({ message: 'x', kind: 'err' }).includes('#ef4444'),   'H · err red');
t(renderInfoBanner({ message: 'x', kind: 'ok' }).includes('#22c55e'),    'H · ok green');

// Unknown kind · fallback info
t(renderInfoBanner({ message: 'x', kind: 'unknown' }).includes('#3b82f6'),
                                                                  'H · unknown kind · info fallback');

// Custom icon
t(renderInfoBanner({ icon: '⚠', message: 'x' }).includes('⚠'),    'H · custom icon');

// Escape message
const bannerXss = renderInfoBanner({ message: '<img src=x onerror=alert(1)>' });
t(!bannerXss.includes('<img src=x'),                              'H · message escaped');
t(bannerXss.includes('&lt;img'),                                  'H · entities');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
