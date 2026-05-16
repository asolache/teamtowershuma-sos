// SOCIAL-LAYER-001 · InboxView smoke test
let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };

console.log('\n=== SOCIAL-LAYER-001 · InboxView contract ===\n');

try {
    const mod = await import('../views/InboxView.js');
    t(typeof mod.default === 'function',                   'A · default class');
    const inst = new mod.default();
    t(typeof inst.getHtml === 'function',                  'A · getHtml present');
    t(typeof inst.afterRender === 'function',              'A · afterRender present');
    t(typeof inst.destroy === 'function',                  'A · destroy present');
    t(typeof mod.TPL_VERSION === 'string',                 'A · TPL_VERSION exported');
} catch (e) {
    t(false, 'A · loads · ' + (e?.message || e));
}

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
