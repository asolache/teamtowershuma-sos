// =============================================================================
// TEAMTOWERS SOS V11 — v134 · Project Hub IA aligned · TDD
// Ruta · /js/tests/v134ProjectHubIaAligned.test.js
//
// Verifica · doc IA-alignment + ProjectHubV3PreviewView refactor (6 tabs
// aligned al menú · 2-nivells de sub-submenu · Quality + Team integrats) +
// 5 noves WOs al backlog · supersedeix wo-project-hub-subtabs.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v134 · Project Hub IA aligned · TDD ===\n');

// ─── A · Doc IA-alignment ──────────────────────────────────────────────
console.log('— A · doc IA-alignment');
const docPath = path.join(ROOT, 'docs/ux/v134-project-hub-ia-alignment.md');
ok('A · doc existeix',                              fs.existsSync(docPath));
const doc = fs.readFileSync(docPath, 'utf8');
ok('A · referencia 5 pilars del menú',              doc.includes('crear · treballar · comptabilitzar · connectar · aprendre') ||
                                                    (doc.includes('Crear') && doc.includes('Treballar') && doc.includes('Comptabilitzar') && doc.includes('Connectar') && doc.includes('Aprendre')));
ok('A · mapping vistes globals → subtabs',          doc.includes('Canvas') && doc.includes('Map') && doc.includes('Wallet'));
ok('A · Tab Equip nou · global + per-project',      doc.includes('Equip') && doc.includes('GLOBAL') && doc.includes('per-projecte'));
ok('A · Permission model RBAC esmentat',            doc.includes('RBAC') && doc.includes('Permission'));
ok('A · Quality integrada a Treballar',             doc.includes('Quality') && doc.includes('Treballar'));
ok('A · Accounting v2 + Wallet v2 redisseny',       doc.includes('v2') && doc.includes('Accounting') && doc.includes('Wallet'));
ok('A · Roadmap v134→v140',                          doc.includes('v134') && doc.includes('v140'));
ok('A · 5 decisions pendents @alvaro',              (doc.match(/^\| [1-5] \|/gm) || []).length >= 5);
ok('A · supersedeix v132i mockup',                   doc.includes('supersedeix v132i') || doc.includes('supersedeix v132i mockup'));

// ─── B · ProjectHubV3PreviewView refactor ──────────────────────────────
console.log('\n— B · ProjectHubV3PreviewView refactor v134');
const v3Src = fs.readFileSync(path.join(ROOT, 'js/views/ProjectHubV3PreviewView.js'), 'utf8');
ok('B · header marca v134',                         v3Src.includes('v134'));

// 6 tabs nivell 1
ok('B · tab 🏠 Hub',                                v3Src.includes("id: 'hub'") && v3Src.includes("icon: '🏠'"));
ok('B · tab 🎨 Crear',                              v3Src.includes("id: 'crear'") && v3Src.includes("icon: '🎨'"));
ok('B · tab 🔨 Treballar',                          v3Src.includes("id: 'treballar'") && v3Src.includes("icon: '🔨'"));
ok('B · tab 💶 Comptabilitzar',                     v3Src.includes("id: 'comptabilitzar'") && v3Src.includes("icon: '💶'"));
ok('B · tab 🔗 Connectar',                          v3Src.includes("id: 'connectar'") && v3Src.includes("icon: '🔗'"));
ok('B · tab 👥 Equip',                              v3Src.includes("id: 'equip'") && v3Src.includes("icon: '👥'"));

// SUBTABS map definit
ok('B · SUBTABS map definit',                       v3Src.includes('const SUBTABS = Object.freeze({'));

// Subtabs Crear
ok('B · subtabs Crear · 4 (Canvas/Pitch/Pact/Presentation)',
                                                    /crear:[\s\S]+?canvas[\s\S]+?pitch[\s\S]+?pact[\s\S]+?presentation/.test(v3Src));
// Subtabs Treballar amb Quality
ok('B · subtabs Treballar · inclou Quality',        /treballar:[\s\S]+?quality/.test(v3Src));
// Subtabs Comptabilitzar
ok('B · subtabs Comptabilitzar · 5 (Wallet/Comptes/Pastís/Factures/Tokenomics)',
                                                    /comptabilitzar:[\s\S]+?wallet[\s\S]+?accounting[\s\S]+?value[\s\S]+?invoices[\s\S]+?tokenomics/.test(v3Src));
// Subtabs Connectar
ok('B · subtabs Connectar · 3 (Pactes/Propostes/Mercat)',
                                                    /connectar:[\s\S]+?pacts-ext[\s\S]+?proposals[\s\S]+?market/.test(v3Src));
// Subtabs Equip
ok('B · subtabs Equip · 4 (Membres/Rols/Permisos/Convidacions)',
                                                    /equip:[\s\S]+?members[\s\S]+?roles[\s\S]+?permissions[\s\S]+?invites/.test(v3Src));

// Dropdown actualitzat
ok('B · dropdown · Aprendre + Sprints + Lifecycle + Settings',
                                                    v3Src.includes("id: 'aprendre'") &&
                                                    v3Src.includes("id: 'sprints'") &&
                                                    v3Src.includes("id: 'lifecycle'") &&
                                                    v3Src.includes("id: 'settings'"));

// 2-nivells routing
ok('B · state _sub (2on nivell)',                   v3Src.includes('this._sub'));
ok('B · URL param sub · getActiveTabFromUrl',       v3Src.includes("getActiveTabFromUrl('sub'"));
ok('B · bind 2on submenu separate cleanup',         v3Src.includes('this._cleanupSub'));
ok('B · _renderSubBody mètode',                     v3Src.includes('_renderSubBody()'));
ok('B · _htmlForSub dispatcher per key',             v3Src.includes('_htmlForSub(key, p)'));

// Nous renders v134
ok('B · _htmlQuality · KPIs + criteris pendents',   v3Src.includes('_htmlQuality(') && v3Src.includes('rubric 12-criteris'));
ok('B · _htmlAccounting · 4 KPI (Actius/Passius/Equity/P&L)',
                                                    v3Src.includes('_htmlAccounting(') && v3Src.includes('Actius') && v3Src.includes('Equity'));
ok('B · _htmlValuePie · Slicing Pie Moyer',         v3Src.includes('_htmlValuePie(') && v3Src.includes('Slicing Pie'));
ok('B · _htmlTeamMembers · llista membres',         v3Src.includes('_htmlTeamMembers('));
ok('B · _htmlTeamRoles · catàleg 5 rols',           v3Src.includes('_htmlTeamRoles(') &&
                                                    v3Src.includes('founder') && v3Src.includes('contributor') && v3Src.includes('viewer'));
ok('B · _htmlTeamPermissions · matriu fine-grained',v3Src.includes('_htmlTeamPermissions(') &&
                                                    v3Src.includes('read.canvas') && v3Src.includes('claim.wos') &&
                                                    v3Src.includes('manage.finances'));
ok('B · _htmlTeamInvites · convidacions',           v3Src.includes('_htmlTeamInvites('));

// ─── C · Backlog · superseded + 5 noves WOs ───────────────────────────
console.log('\n— C · backlog · 5 noves WOs + supersede notice');
const yaml = fs.readFileSync(path.join(ROOT, 'docs/backlog.yaml'), 'utf8');
ok('C · WO original marcada [SUPERSEDED v134]',     yaml.includes('[SUPERSEDED v134]'));
ok('C · wo-project-hub-ia-aligned',                 yaml.includes('wo-project-hub-ia-aligned'));
ok('C · wo-project-hub-ia-aligned menciona 6 tabs',  /wo-project-hub-ia-aligned[\s\S]+?Hub.*Crear.*Treballar.*Comptabilitzar.*Connectar.*Equip/.test(yaml));
ok('C · wo-submenu-tabs-v2-sublevel (2-nivells)',   yaml.includes('wo-submenu-tabs-v2-sublevel'));
ok('C · wo-accounting-v2-redesign',                 yaml.includes('wo-accounting-v2-redesign'));
ok('C · wo-wallet-project-v2-redesign',             yaml.includes('wo-wallet-project-v2-redesign'));
ok('C · wo-quality-integration-project-hub',        yaml.includes('wo-quality-integration-project-hub'));
ok('C · wo-quality menciona redirect /quality',     yaml.includes('Redirect') && yaml.includes('/quality') && yaml.includes('treballar'));
ok('C · wo-team-permissions-view',                  yaml.includes('wo-team-permissions-view'));
ok('C · wo-team · doble · GLOBAL i per-projecte',   yaml.includes('/team') && yaml.includes('per-projecte') && yaml.includes('RBAC'));

// ─── D · backlog.json regenerat ───────────────────────────────────────
console.log('\n— D · backlog.json regenerat');
const bjson = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/backlog.json'), 'utf8'));
const ids = (bjson.work_orders || []).map(w => w.id);
ok('D · json conté wo-project-hub-ia-aligned',      ids.includes('wo-project-hub-ia-aligned'));
ok('D · json conté wo-submenu-tabs-v2-sublevel',    ids.includes('wo-submenu-tabs-v2-sublevel'));
ok('D · json conté wo-accounting-v2-redesign',      ids.includes('wo-accounting-v2-redesign'));
ok('D · json conté wo-wallet-project-v2-redesign',  ids.includes('wo-wallet-project-v2-redesign'));
ok('D · json conté wo-quality-integration-project-hub', ids.includes('wo-quality-integration-project-hub'));
ok('D · json conté wo-team-permissions-view',       ids.includes('wo-team-permissions-view'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
