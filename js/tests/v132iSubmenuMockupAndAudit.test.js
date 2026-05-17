// =============================================================================
// TEAMTOWERS SOS V11 — v132i · Submenu Audit + Mockup HTML · TDD
// Ruta · /js/tests/v132iSubmenuMockupAndAudit.test.js
//
// Verifica · doc d'anàlisi + mockup HTML interactiu (self-contained · obre
// al navegador) per a validació manual @alvaro abans d'implementar v132j.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v132i · submenu audit + mockup HTML · TDD ===\n');

// ─── A · doc d'anàlisi ────────────────────────────────────────────────
console.log('— A · doc anàlisi · docs/ux/v132i-submenu-audit-and-mockup.md');
const docPath = path.join(ROOT, 'docs/ux/v132i-submenu-audit-and-mockup.md');
ok('A · doc existeix',                              fs.existsSync(docPath));
const doc = fs.readFileSync(docPath, 'utf8');
ok('A · auditoria · LearnView · referent',          doc.includes('LearnView') && doc.includes('referent'));
ok('A · auditoria · 5 vistes amb submenú',          doc.includes('SettingsV2View') && doc.includes('OpportunitiesView') &&
                                                    doc.includes('CreateLiveView') && doc.includes('NotesView'));
ok('A · diagnosi · 5 prefixos CSS diferents',       doc.includes('5 prefixos CSS diferents') || doc.includes('5 prefixes'));
ok('A · pattern proposat · SubmenuTabs.js',         doc.includes('js/ui/SubmenuTabs.js'));
ok('A · convencions canòniques · _mode',            doc.includes('_mode') && doc.includes('canòniques'));
ok('A · convenció · data-submenu-tab',              doc.includes('data-submenu-tab'));
ok('A · CSS class · .sos-submenu',                  doc.includes('.sos-submenu'));
ok('A · estructura Project Hub · 5 pestanyes',      doc.includes('Hub') && doc.includes('Map') &&
                                                    doc.includes('Kanban') && doc.includes('Comptabilitat') &&
                                                    doc.includes('Presentation'));
ok('A · Presentation IA · Hero+Canvas+Pitch+Map+CTA',
                                                    doc.includes('Hero') && doc.includes('Canvas · estructura') &&
                                                    doc.includes('Pitch · narrativa') && doc.includes('Map preview') &&
                                                    doc.includes('CTA'));
ok('A · 7 decisions pendents @alvaro',              (doc.match(/^\| 1 \|/m) && doc.match(/^\| 7 \|/m)) !== null);
ok('A · next steps · v132j implementa SubmenuTabs', doc.includes('v132j') && doc.includes('implementar'));

// ─── B · mockup HTML self-contained ───────────────────────────────────
console.log('\n— B · mockup HTML · docs/ux/v132i-mockup-project-hub-subtabs.html');
const mockPath = path.join(ROOT, 'docs/ux/v132i-mockup-project-hub-subtabs.html');
ok('B · mockup existeix',                           fs.existsSync(mockPath));
const mock = fs.readFileSync(mockPath, 'utf8');
ok('B · HTML5 valid · doctype + html',              mock.startsWith('<!DOCTYPE html>') && mock.includes('<html'));
ok('B · self-contained · CSS inline',               mock.includes('<style>') && !mock.includes('<link rel="stylesheet"'));
ok('B · self-contained · JS inline',                mock.includes('<script>') && !mock.includes('src='));
ok('B · CSS vars sos-submenu definides',            mock.includes('--sos-submenu-height') &&
                                                    mock.includes('--sos-submenu-active-color') &&
                                                    mock.includes('--sos-submenu-active-bg'));
ok('B · classe .sos-submenu renderitzada',          mock.includes('class="sos-submenu"'));
ok('B · classe .sos-submenu-tab renderitzada',      mock.includes('class="sos-submenu-tab'));
ok('B · 5 tabs renderitzades amb data-submenu-tab', (mock.match(/data-submenu-tab="(hub|map|kanban|wallet|presentation)"/g) || []).length === 5);
ok('B · dropdown "Més" amb 4 items',                mock.includes('Més ▾') &&
                                                    mock.includes('Pactes') && mock.includes('Sprints') &&
                                                    mock.includes('KB') && mock.includes('Settings'));
ok('B · dropdown legal agents mencionat',           mock.includes('Legal agents') || mock.includes('legal-agents'));
ok('B · tab Presentation · seccions IA completes',  mock.includes('pres-hero') && mock.includes('canvas-grid') &&
                                                    mock.includes('pitch-grid') && mock.includes('map-preview') &&
                                                    mock.includes('cta-row'));
ok('B · Canvas 4 cells (Segments/VP/Channels/Revenue)',
                                                    mock.includes('Segments') && mock.includes('Value Propositions') &&
                                                    mock.includes('Channels') && mock.includes('Revenue Streams'));
ok('B · Pitch 4 cells (P/S/W/T)',                   mock.includes('PROBLEM') && mock.includes('SOLUTION') &&
                                                    mock.includes('WHY NOW') && mock.includes('TRACTION'));
ok('B · CTA · 3 botons (Contacta · Pacte · KB)',    mock.includes('Contacta') && mock.includes('Signa un pacte') && mock.includes('Explora KB'));
ok('B · JS · click tabs canvia is-active',          mock.includes("classList.toggle('is-active'") || mock.includes("classList.add('is-active')"));
ok('B · JS · dropdown obre/tanca + click-outside',  mock.includes("classList.toggle('is-open'") && mock.includes("dropdownPanel.contains"));
ok('B · JS · Esc tanca dropdown',                   mock.includes("e.key === 'Escape'"));
ok('B · audit table · 5 vistes',                    mock.includes('LearnView') && mock.includes('SettingsV2View') &&
                                                    mock.includes('CreateLiveView') && mock.includes('NotesView'));
ok('B · comparativa legacy vs canonical',           mock.includes('Legacy') && mock.includes('Canonical'));
ok('B · taula decisions pendents · 7 files',         (mock.match(/<tr><td>[1-7]<\/td>/g) || []).length >= 7);
ok('B · accessibility · aria-* atributs',           mock.includes('aria-haspopup') && mock.includes('aria-expanded') && mock.includes('role="tab"'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
