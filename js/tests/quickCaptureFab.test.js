// UX-BRAIN-001 · QuickCaptureFab · pure helpers + module shape
import {
    renderModalHtml, TABS, FAB_ID, MODAL_ID,
} from '../core/quickCaptureFab.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== UX-BRAIN-001 · quickCaptureFab ===\n');

// Constants
eq(TABS.length, 4,                                       'A · 4 tabs · note/wo/insight/skill');
t(TABS.every(t => t.id && t.icon && t.label && t.type && t.placeholder),
   'A · tabs ben formats');
t(typeof FAB_ID === 'string' && FAB_ID.length > 0,       'A · FAB_ID exported');
t(typeof MODAL_ID === 'string' && MODAL_ID.length > 0,   'A · MODAL_ID exported');
t(FAB_ID !== MODAL_ID,                                   'A · IDs distinct');

// Each tab has correct shape
for (const tab of TABS) {
    t(['note', 'wo', 'insight', 'skill'].includes(tab.id),
       'A · tab id valid · ' + tab.id);
    t(['note', 'work_order', 'insight', 'skill_log'].includes(tab.type),
       'A · tab type maps to valid KB type · ' + tab.type);
}

// renderModalHtml · pure
const html1 = renderModalHtml({ activeTab: 'note' });
t(html1.includes('Captura ràpida'),                      'B · modal title present');
t(html1.includes('aria-modal="true"'),                   'B · aria-modal accessible');
t(html1.includes('role="dialog"'),                       'B · role dialog');
t(html1.includes('role="tablist"'),                      'B · tablist role');
t(html1.includes('data-tab="note"'),                     'B · note tab');
t(html1.includes('data-tab="wo"'),                       'B · wo tab');
t(html1.includes('data-tab="insight"'),                  'B · insight tab');
t(html1.includes('data-tab="skill"'),                    'B · skill tab');
t(html1.includes('sosQuickInput'),                       'B · textarea id present');
t(html1.includes('sosQuickSave'),                        'B · save button');
t(html1.includes('sosQuickCancel'),                      'B · cancel button');

// Default tab pattern (note · placeholder "Quina nota...")
t(html1.includes('Quina nota'),                          'B · default note placeholder');

// Activate WO tab
const html2 = renderModalHtml({ activeTab: 'wo' });
t(html2.includes('Què cal fer?'),                        'B · wo tab placeholder');
t(html2.includes('aria-selected="true"'),                'B · aria-selected toggles');

// With project id
const html3 = renderModalHtml({ activeTab: 'note', currentProjectId: 'proj-test-abc' });
t(html3.includes('projecte'),                            'B · project id mentioned');
t(html3.includes('proj-test-abc'),                       'B · project id rendered');

// XSS escape · maliciós project id
const html4 = renderModalHtml({ activeTab: 'note', currentProjectId: '<script>alert(1)</script>' });
t(!html4.includes('<script>alert(1)</script>'),          'B · XSS escaped from project id');

// Module shape
import * as fab from '../core/quickCaptureFab.js';
t(typeof fab.injectGlobalFab === 'function',             'C · injectGlobalFab exported');
t(typeof fab.destroyGlobalFab === 'function',            'C · destroyGlobalFab exported');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
