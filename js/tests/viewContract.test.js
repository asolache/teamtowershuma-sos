// VIEW-CONTRACT regression · totes les noves vistes han de exposar
// getHtml() + afterRender() segons el router pattern (js/router.js:142-143).
// Bug detectat @alvaro 2026-05-15 · "view.getHtml is not a function".

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };

console.log('\n=== VIEW-CONTRACT · getHtml + afterRender per al router ===\n');

const VIEWS_TO_CHECK = [
    { path: '../views/DashboardV2View.js',  name: 'DashboardV2View' },
    { path: '../views/ProjectHubV2View.js', name: 'ProjectHubV2View' },
    { path: '../views/InvestorPitchView.js', name: 'InvestorPitchView' },
];

for (const v of VIEWS_TO_CHECK) {
    try {
        const mod = await import(v.path);
        t(typeof mod.default === 'function', v.name + ' · default class exportada');
        const inst = new mod.default();
        t(typeof inst.getHtml === 'function',  v.name + ' · té getHtml()');
        t(typeof inst.afterRender === 'function', v.name + ' · té afterRender()');
        t(typeof inst.destroy === 'function',  v.name + ' · té destroy()');
    } catch (e) {
        t(false, v.name + ' · import failed · ' + (e?.message || e));
    }
}

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
