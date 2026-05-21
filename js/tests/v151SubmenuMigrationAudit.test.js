// =============================================================================
// TEAMTOWERS SOS V11 — v151 · submenu pattern · audit + migracions · TDD
// Ruta · /js/tests/v151SubmenuMigrationAudit.test.js
//
// Verifica · doc audit pantalles + 5 migracions a SubmenuTabs canonical ·
// SettingsV2 · Opportunities · CreateLive · Notes · MobileMockup.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v151 · submenu pattern · audit + 5 migracions · TDD ===\n');

// ─── A · doc audit ─────────────────────────────────────────────────────
console.log('— A · doc audit pantalles');
const docPath = path.join(ROOT, 'docs/ux/v151-submenu-pattern-audit.md');
ok('A · doc audit existeix',                       fs.existsSync(docPath));
const doc = fs.readFileSync(docPath, 'utf8');
ok('A · inventari 57 vistes',                       doc.includes('57 vistes'));
ok('A · 5 migracions prioritzades',                 doc.includes('SettingsV2View') &&
                                                    doc.includes('OpportunitiesView') &&
                                                    doc.includes('CreateLiveView') &&
                                                    doc.includes('NotesView') &&
                                                    doc.includes('MobileMockupView'));
ok('A · pattern fused (right side actions)',       doc.includes('slot dret') || doc.includes('a la dreta'));

// ─── B · 5 vistes ara importen SubmenuTabs canonical ──────────────────
console.log('\n— B · 5 vistes imports canonical');
const VIEWS = ['SettingsV2View', 'OpportunitiesView', 'CreateLiveView', 'NotesView', 'MobileMockupView'];
for (const name of VIEWS) {
    const src = fs.readFileSync(path.join(ROOT, 'js/views/' + name + '.js'), 'utf8');
    ok('B · ' + name + ' · importa SubmenuTabs',   src.includes("from '../ui/SubmenuTabs.js'"));
    ok('B · ' + name + ' · usa renderSubmenuTabs',  src.includes('renderSubmenuTabs('));
    ok('B · ' + name + ' · usa bindSubmenuTabs',    src.includes('bindSubmenuTabs('));
}

// ─── C · mount points específics ──────────────────────────────────────
console.log('\n— C · mount points');
const settings = fs.readFileSync(path.join(ROOT, 'js/views/SettingsV2View.js'), 'utf8');
ok('C · SettingsV2 · mount sv2Submenu',             settings.includes('id="sv2Submenu"'));
ok('C · SettingsV2 · class sv2-bar-fused',          settings.includes('class="sv2-bar-fused"'));

const opp = fs.readFileSync(path.join(ROOT, 'js/views/OpportunitiesView.js'), 'utf8');
ok('C · Opp · mount opSubmenu',                     opp.includes('id="opSubmenu"'));
ok('C · Opp · sense old .op-tabs render',           !opp.includes('class="op-tabs"'));

const cl = fs.readFileSync(path.join(ROOT, 'js/views/CreateLiveView.js'), 'utf8');
ok('C · CreateLive · mount clSubmenu',              cl.includes('id="clSubmenu"'));
ok('C · CreateLive · urlParam preview',             cl.includes("urlParam: 'preview'"));

const notes = fs.readFileSync(path.join(ROOT, 'js/views/NotesView.js'), 'utf8');
ok('C · Notes · mount ntsSubmenu',                  notes.includes('id="ntsSubmenu"'));
ok('C · Notes · urlParam type',                     notes.includes("urlParam: 'type'"));
ok('C · Notes · destroy cleanup',                   notes.includes('destroy()') && notes.includes('this._cleanupTabs'));

const mm = fs.readFileSync(path.join(ROOT, 'js/views/MobileMockupView.js'), 'utf8');
ok('C · MobileMockup · mount mmSubmenu',            mm.includes('id="mmSubmenu"'));
ok('C · MobileMockup · urlParam screen',            mm.includes("urlParam: 'screen'"));

// ─── D · backwards-compat · old patterns mantinguts si calen ──────────
console.log('\n— D · backwards-compat · old patterns o ocults');
ok('D · CreateLive · legacy data-cl-tab segueix (binding compat)',
                                                    cl.includes('data-cl-tab]'));
ok('D · Notes · old nts-tabs render ocultat (display:none)',
                                                    notes.includes('class="nts-tabs"') &&
                                                    notes.includes('display:none'));
ok('D · MobileMockup · old mm-tabs ocultat',        mm.includes('class="mm-tabs"') &&
                                                    /class="mm-tabs"[\s\S]{0,80}display:none/.test(mm));
ok('D · SettingsV2 · binding legacy .sv2-tab preservat per externs',
                                                    settings.includes(".sv2-tab').forEach"));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
