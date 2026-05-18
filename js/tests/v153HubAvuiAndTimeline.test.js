// =============================================================================
// TEAMTOWERS SOS V11 — v153 · Hub Avui enriquit + TimelineView upgrade · TDD
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v153 · Hub Avui + Timeline upgrade · TDD ===\n');

// ─── A · plan doc ──────────────────────────────────────────────────────
console.log('— A · plan doc');
const planPath = path.join(ROOT, 'docs/ux/v153-hub-avui-timeline-plan.md');
ok('A · plan doc existeix',                          fs.existsSync(planPath));
const plan = fs.readFileSync(planPath, 'utf8');
ok('A · 2 movim · Hub Avui + Timeline',              plan.includes('Movim 1') && plan.includes('Movim 2'));
ok('A · KPI row + cash flow + upcoming actions',     plan.includes('KPI row') && plan.includes('Cash flow'));

// ─── B · Hub _zone2_Today enriquit ─────────────────────────────────────
console.log('\n— B · Hub _zone2_Today enriquit');
const v2 = fs.readFileSync(path.join(ROOT, 'js/views/ProjectHubV2View.js'), 'utf8');
ok('B · 4 KPI cards · WOs/Done/Saldo/Alerts',         v2.includes('hub-today-kpis') &&
                                                       v2.includes('WOs actius') &&
                                                       v2.includes('Done setmana') &&
                                                       v2.includes('Saldo wallet') &&
                                                       v2.includes('Prioritat alta'));
ok('B · Top 3 WOs prioritaris · sort per priority',  v2.includes('hub-today-top3') &&
                                                       v2.includes('PRIO_ORDER') &&
                                                       v2.includes('top3 = '));
ok('B · WO card · click navega a /kanban?wo=ID',     v2.includes('/kanban?project=${projId}&wo='));
ok('B · WO meta · priority + status + due',          v2.includes('class="prio"') &&
                                                       v2.includes('class="status"') &&
                                                       v2.includes('class="due"'));
ok('B · Cash flow setmanal · 7 dies bars',           v2.includes('hub-today-cashflow') &&
                                                       v2.includes('_weeklyFlow') &&
                                                       v2.includes('hub-cf-bars'));
ok('B · _weeklyFlow · 7 días inflow/outflow',         v2.includes('_weeklyFlow(ledger') &&
                                                       v2.includes('inflow += amt') &&
                                                       v2.includes('outflow += Math.abs(amt)'));
ok('B · CSS · accent-green inflow / accent-red outflow',
                                                       v2.includes('.bar-in { background:var(--accent-green)') &&
                                                       v2.includes('.bar-out { background:var(--accent-red)'));

// ─── C · TimelineView upgrade ──────────────────────────────────────────
console.log('\n— C · TimelineView · canonical + filter perspectives');
const tlv = fs.readFileSync(path.join(ROOT, 'js/views/TimelineView.js'), 'utf8');
ok('C · imports SubmenuTabs',                        tlv.includes("from '../ui/SubmenuTabs.js'"));
ok('C · FILTER_TABS · 5 perspectives',                tlv.includes("FILTER_TABS") &&
                                                       /id: 'all'[\s\S]+?id: 'wos'[\s\S]+?id: 'pacts'[\s\S]+?id: 'ledger'[\s\S]+?id: 'network'/.test(tlv));
ok('C · FILTER_TO_KINDS · mapping per filter',        tlv.includes('FILTER_TO_KINDS') &&
                                                       tlv.includes("wos:") &&
                                                       tlv.includes("pacts:") &&
                                                       tlv.includes("network:"));
ok('C · constructor llegeix ?filter URL param',       tlv.includes("getActiveTabFromUrl('filter'"));
ok('C · constructor llegeix ?sort URL param',         tlv.includes("getActiveTabFromUrl('sort'"));
ok('C · feed filtrat per allowedKinds',                tlv.includes('allowedKinds') &&
                                                       tlv.includes('fullFeed.filter('));
ok('C · render tlvFilter mount',                      tlv.includes('id="tlvFilter"'));
ok('C · bindSubmenuTabs amb urlParam filter',         tlv.includes("urlParam: 'filter'"));
ok('C · destroy cleanup',                             tlv.includes('destroy()') && tlv.includes('this._cleanupFilter'));
ok('C · topbar custom ELIMINAT · NO tlv-topbar render',
                                                       !tlv.includes('class="tlv-topbar"'));
ok('C · header · X de N events · filtre actiu',       tlv.includes('Activitat recent · ${feed.length} de ${fullFeedCount}'));
ok('C · sort buttons preservats (legacy compat)',     tlv.includes("data-sort=\"chrono\"") && tlv.includes("data-sort=\"relevance\""));
ok('C · sort persisteix ?sort URL param',             tlv.includes("url.searchParams.set('sort'"));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
