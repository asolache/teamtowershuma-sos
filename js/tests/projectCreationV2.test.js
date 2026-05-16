// B-UNIFIED-FORM-001 sprint UI · ProjectCreationV2View · contract test
let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };

console.log('\n=== B-UNIFIED-FORM-001 sprint UI · ProjectCreationV2View ===\n');

try {
    const mod = await import('../views/ProjectCreationV2View.js');
    t(typeof mod.default === 'function',                   'A · default class exported');
    const inst = new mod.default();
    t(typeof inst.getHtml === 'function',                  'A · getHtml present');
    t(typeof inst.afterRender === 'function',              'A · afterRender present');
    t(typeof inst.destroy === 'function',                  'A · destroy present');
    t(typeof mod.TPL_VERSION === 'string',                 'A · TPL_VERSION exported');

    // getHtml returns string with form skeleton
    const html = await inst.getHtml();
    t(typeof html === 'string' && html.length > 500,       'B · getHtml returns substantial HTML');
    t(html.includes('pcvName'),                            'B · name input present');
    t(html.includes('pcvDescription'),                     'B · description textarea present');
    t(html.includes('pcvSector'),                          'B · sector input present');
    t(html.includes('data-ambition="light"'),              'B · ambition light option');
    t(html.includes('data-ambition="standard"'),           'B · ambition standard option');
    t(html.includes('data-ambition="max"'),                'B · ambition max option');
    t(html.includes('pcvSubmit'),                          'B · submit button present');
    t(html.includes('pcvCostPreview'),                     'B · cost preview present');
} catch (e) {
    t(false, 'A · loads · ' + (e?.message || e));
}

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
