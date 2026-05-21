// =============================================================================
// TEAMTOWERS SOS V11 — v152 · HomeView CTA + Project Hub knowledge cleanup + nav cleanup · TDD
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v152 · HomeView CTA + Hub cleanup + Learn cleanup · TDD ===\n');

// ─── A · HomeView · Crear projecte com a card prominent (substitueix Value Map) ─
console.log('— A · HomeView · CTA Crear projecte prominent');
const home = fs.readFileSync(path.join(ROOT, 'js/views/HomeView.js'), 'utf8');
ok('A · card Crear projecte present · href /create',  home.includes('Crear projecte') && home.includes('href="/create"'));
ok('A · card Crear · style accent-indigo (prominent)',home.includes('linear-gradient(135deg,rgba(168,85,247'));
ok('A · NO card Value Map (redundant · viu a project hub)',
                                                       !home.includes('Value Map'));
ok('A · NO card Paper (legacy · redirect mort)',      !/href="\/paper"/.test(home));
ok('A · card Aprendre (substitueix Paper)',            home.includes('Aprendre') && home.includes('href="/learn"'));
ok('A · Team card preservada (post-v140 RBAC)',       home.includes('href="/team"'));

// ─── B · ProjectHubV2 · zone7_Knowledge cleanup ────────────────────────
console.log('\n— B · ProjectHubV2 · zone7 Knowledge net');
const v2 = fs.readFileSync(path.join(ROOT, 'js/views/ProjectHubV2View.js'), 'utf8');
ok('B · zone7 · "Continuar creant" CTA (substitueix VNA)', v2.includes('Continuar creant') &&
                                                            v2.includes('/create-live?project='));
ok('B · zone7 · NO "VNA · Mapa de valor" duplicat',   !/nm: 'VNA'[\s\S]+?ds: 'Mapa de valor'/.test(v2));
ok('B · zone7 · NO Canvas card (ja viu al pilar Crear)', !/nm: 'Canvas'[\s\S]+?ds: '5 pilars'/.test(v2));
ok('B · zone7 · NO SOCs card (ja viu al pilar Treballar)', !/nm: 'SOCs'[\s\S]+?ds: 'Standard Op Concepts'/.test(v2));
ok('B · zone7 · NO Tokenomics card (ja viu al pilar Comptab)', !/nm: 'Tokenomics'[\s\S]+?ds: 'Equity \+ token'/.test(v2));
ok('B · zone7 · preserva Pitch doc · Workshops · Market', v2.includes("nm: 'Pitch doc'") &&
                                                          v2.includes("nm: 'Workshops'") &&
                                                          v2.includes("nm: 'Market'"));

// ─── C · navService · learn-skills eliminat ────────────────────────────
console.log('\n— C · navService · learn-skills duplicate eliminat');
const nav = fs.readFileSync(path.join(ROOT, 'js/core/navService.js'), 'utf8');
ok('C · NO entry learn-skills',                       !nav.includes("id: 'learn-skills'"));
ok('C · skills canonical href = /skills (no ?tab=skills)',
                                                       !nav.includes("href: '/learn?tab=skills'") &&
                                                       /id: 'skills'[\s\S]{0,200}href: '\/skills'/.test(nav));
ok('C · skills label "Skills" amb icon 🤲',           /id: 'skills'[\s\S]{0,100}icon: '🤲'[\s\S]{0,80}label: 'Skills'/.test(nav));

// ─── D · audit doc v152 ────────────────────────────────────────────────
console.log('\n— D · audit doc v152');
const docPath = path.join(ROOT, 'docs/ux/v152-views-merge-audit.md');
ok('D · doc audit existeix',                          fs.existsSync(docPath));
const doc = fs.readFileSync(docPath, 'utf8');
ok('D · llista 4 vistes obsoletes',                   doc.includes('ProjectHubV3PreviewView') &&
                                                       doc.includes('WalletView') &&
                                                       doc.includes('AccountingView') &&
                                                       doc.includes('MobileMockupView'));
ok('D · llista 4 vistes redundants (Tags/Folders/Mind/Sectors)',
                                                       doc.includes('TagsView') && doc.includes('FoldersView') &&
                                                       doc.includes('MindGraphView') && doc.includes('SectorsView'));
ok('D · roadmap v152 + v153+',                         doc.includes('v152') && doc.includes('v153'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
