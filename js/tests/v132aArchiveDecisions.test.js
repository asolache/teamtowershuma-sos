// =============================================================================
// TEAMTOWERS SOS V11 — V132a · ARCHIVE FEATURE + DECISIONS + KNOWLEDGE · TDD
// Ruta · /js/tests/v132aArchiveDecisions.test.js
//
// Verifica · archive button restaurat a ProjectsView + Slicing Pie canonical
// + LMS tutorial doc + backlog updated amb decisions @alvaro.
// =============================================================================

import fs from 'node:fs';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v132a · Archive + Decisions + Knowledge ===\n');

// ─── A · Archive button restaurat a ProjectsView ───────────────────────
console.log('— A · ProjectsView · archive/unarchive UI');
const pvSrc = fs.readFileSync(new URL('../views/ProjectsView.js', import.meta.url), 'utf8');
ok('A · _bindArchiveActions definit',                pvSrc.includes('_bindArchiveActions()'));
ok('A · data-archive listener',                       pvSrc.includes('data-archive='));
ok('A · data-unarchive listener',                     pvSrc.includes('data-unarchive='));
ok('A · dispatch ARCHIVE_PROJECT',                    pvSrc.includes("type: 'ARCHIVE_PROJECT'"));
ok('A · dispatch UNARCHIVE_PROJECT',                  pvSrc.includes("type: 'UNARCHIVE_PROJECT'"));
ok('A · confirm dialog menciona contabilitat preserved',
   pvSrc.includes('comptabilitat de valor') && pvSrc.includes('intacta'));
ok('A · CSS proj-card-actions definit',               pvSrc.includes('.proj-card-actions'));
ok('A · CSS proj-action-archive + unarchive',          pvSrc.includes('.proj-action-archive') && pvSrc.includes('.proj-action-unarchive'));
ok('A · _refresh rebind archive actions',              /this\._bindArchiveActions\(\);[\s\S]*?\}\s*$|_refresh[\s\S]*?_bindArchiveActions/.test(pvSrc));
ok('A · render card · botó archive si NOT archived',   pvSrc.includes('📦 Arxivar'));
ok('A · render card · botó unarchive si archived',     pvSrc.includes('↺ Desarxivar'));
ok('A · demo projects NO mostren archive (immutable)', /isDemo \? '' : `<button[^`]*data-archive/.test(pvSrc));

// ─── B · Slicing Pie canonical · Mike Moyer doc ────────────────────────
console.log('\n— B · knowledge/vision/slicing-pie-mike-moyer.md');
const spExists = fs.existsSync(new URL('../../knowledge/vision/slicing-pie-mike-moyer.md', import.meta.url));
ok('B · doc canonical existeix',                       spExists);
if (spExists) {
    const sp = fs.readFileSync(new URL('../../knowledge/vision/slicing-pie-mike-moyer.md', import.meta.url), 'utf8');
    ok('B · cita Mike Moyer + llibre',                  sp.includes('Mike Moyer') && sp.includes('Slicing Pie'));
    ok('B · multiplicadors canonical · cash ×4',         sp.includes('Cash') && sp.includes('×4'));
    ok('B · multiplicadors canonical · hours ×2',        sp.includes('hores') && sp.includes('×2'));
    ok('B · idees ×0',                                   sp.includes('Idees') && sp.includes('×0'));
    ok('B · Phase multipliers extension SOS',            sp.includes('Phase Multipliers'));
    ok('B · fases · idea/MVP/validation/scale/mature',   sp.includes('idea') && sp.includes('MVP') && sp.includes('validation') && sp.includes('scale') && sp.includes('mature'));
    ok('B · alfa bonus @alvaro extension',               sp.includes('alfa') && sp.includes('@alvaro') && sp.includes('bonus'));
    ok('B · Recoupment Day explicat',                    sp.includes('Recoupment'));
    ok('B · referències bibliogràfiques',                sp.toLowerCase().includes('referències') && sp.includes('slicingpie.com'));
    ok('B · status implementació · taula',               sp.includes('Implementació actual') || sp.includes('Status'));
}

// ─── C · LMS tutorial doc educatiu per @alvaro ─────────────────────────
console.log('\n— C · docs/lms-build-vs-openedx-tutorial.md');
const lmsTutExists = fs.existsSync(new URL('../../docs/lms-build-vs-openedx-tutorial.md', import.meta.url));
ok('C · doc educatiu LMS existeix',                    lmsTutExists);
if (lmsTutExists) {
    const lt = fs.readFileSync(new URL('../../docs/lms-build-vs-openedx-tutorial.md', import.meta.url), 'utf8');
    ok('C · constraint hardware Mac mid-2012',          lt.includes('Mac mid-2012') || lt.includes('6GB RAM') || lt.includes('GT 650M'));
    ok('C · 4 opcions A/B/C/D comparades',              lt.includes('Opció') && lt.includes('OpenEdX') && lt.includes('Moodle'));
    ok('C · SCORM + xAPI explicats',                     lt.includes('SCORM') && lt.includes('xAPI'));
    ok('C · scorm-again player recomanat',               lt.includes('scorm-again'));
    ok('C · ~70% LMS ja existeix a SOS',                lt.includes('70%') && lt.includes('neuralPath'));
    ok('C · recomanació · Build hybrid (opció D)',       lt.includes('OPCIÓ D') || lt.includes('Build hybrid') || lt.includes('hybrid'));
    ok('C · timeline v132 → v144 lms sprint plan',       lt.includes('v132') && lt.includes('v141') && lt.includes('v144'));
    ok('C · costos comparatius taula',                   lt.includes('TalentLMS') && lt.includes('LearnDash'));
    ok('C · recursos per aprofundir',                    lt.includes('xAPI spec') || lt.includes('Recursos'));
}

// ─── D · backlog.md amb decisions resoltes + WOs nous ──────────────────
console.log('\n— D · backlog.md · decisions + WOs v132a');
const backlog = fs.readFileSync(new URL('../../docs/backlog.md', import.meta.url), 'utf8');
ok('D · backlog · secció v132a present',               backlog.includes('v132a'));
ok('D · backlog · WHITELIST decision resolved',         backlog.includes('WHITELIST'));
ok('D · backlog · pricing alfa · @alvaro saldo aportació',
   backlog.includes('saldo aportat per @alvaro') || backlog.includes('multiplicador alfa @alvaro'));
ok('D · backlog · LMS · BUILD HYBRID decision',         backlog.includes('BUILD HYBRID'));
ok('D · backlog · wo-archive-project-feature',          backlog.includes('wo-archive-project-feature'));
ok('D · backlog · wo-tokenomics-slicing-pie-canonical', backlog.includes('wo-tokenomics-slicing-pie-canonical'));
ok('D · backlog · wo-phase-multipliers-v141',           backlog.includes('wo-phase-multipliers-v141'));
ok('D · backlog · wo-alfa-bonus-multiplier-v138',       backlog.includes('wo-alfa-bonus-multiplier-v138'));
ok('D · backlog · wo-comms-pre-alpha-decision',         backlog.includes('wo-comms-pre-alpha-decision'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
