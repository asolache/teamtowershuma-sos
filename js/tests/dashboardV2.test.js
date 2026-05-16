// UX-DASHBOARD-V2 sprint A · smoke test
import { buildFeed, ACTIVITY_KINDS } from '../core/activityFeedService.js';
import { renderNavGroupedHtml, ensureNavGroupStyle } from '../core/navService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };

console.log('\n=== UX-DASHBOARD-V2 · service contracts ===\n');

// Service contracts that DashboardV2View depends on
t(typeof buildFeed === 'function',                       'A · buildFeed available');
t(Array.isArray(ACTIVITY_KINDS),                         'A · ACTIVITY_KINDS array');
t(typeof renderNavGroupedHtml === 'function',            'A · renderNavGroupedHtml available');
t(typeof ensureNavGroupStyle === 'function',             'A · ensureNavGroupStyle available');

// View loads without error
try {
    await import('../views/DashboardV2View.js');
    t(true,                                              'B · DashboardV2View module loads');
} catch (e) {
    t(false,                                             'B · DashboardV2View loads · ' + (e?.message || e));
}

// Verify the view exposes a default export with render method
try {
    const mod = await import('../views/DashboardV2View.js');
    t(typeof mod.default === 'function',                 'B · default export is class');
    const inst = new mod.default();
    t(typeof inst.render === 'function',                 'B · render method present');
    t(typeof inst.destroy === 'function',                'B · destroy method present');
} catch (e) {
    t(false,                                             'B · instantiation · ' + (e?.message || e));
}

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
