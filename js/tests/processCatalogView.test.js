// PROCESS-CATALOG-001 sprint UI · contract test
let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };

console.log('\n=== PROCESS-CATALOG-001 · ProcessCatalogView ===\n');

try {
    const mod = await import('../views/ProcessCatalogView.js');
    t(typeof mod.default === 'function',                   'A · default class');
    const inst = new mod.default();
    t(typeof inst.getHtml === 'function',                  'A · getHtml present');
    t(typeof inst.afterRender === 'function',              'A · afterRender present');
    t(typeof inst.destroy === 'function',                  'A · destroy present');
    t(typeof mod.TPL_VERSION === 'string',                 'A · TPL_VERSION exported');

    const html = await inst.getHtml();
    t(typeof html === 'string' && html.length > 500,       'B · getHtml returns substantial HTML');
    t(html.includes('Catàleg de processos'),               'B · title present');
    t(html.includes('15 plantilles'),                      'B · 15 templates header');
    t(html.includes('data-filter-type'),                   'B · type filter buttons');
    t(html.includes('data-filter-stage'),                  'B · stage filter buttons');
    t(html.includes('data-template'),                      'B · template cards rendered');
} catch (e) {
    t(false, 'A · loads · ' + (e?.message || e));
}

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
