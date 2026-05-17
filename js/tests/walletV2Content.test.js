// =============================================================================
// TEAMTOWERS SOS V11 — WALLET V2 CONTENT · v129 · TDD
// Ruta · /js/tests/walletV2Content.test.js
//
// Verifica contingut REAL (no placeholders) de les 3 pestanyes prioritàries ·
//   💰 Saldo        · hero + KPIs + graf 30d
//   📊 Transaccions · filtres + taula + paginació + CSV
//   📁 Projectes    · grid multi-wallet
// + /ledger alias semàntic + 24 domain packs total.
// =============================================================================

import fs from 'node:fs';
import { DOMAIN_PACKS, DOMAIN_IDS, detectDomain } from '../core/domainDetector.js';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== WALLET V2 CONTENT + DOMAIN PACKS EXPANSION (v129) ===\n');

const w2Src     = fs.readFileSync(new URL('../views/WalletV2View.js', import.meta.url), 'utf8');
const routerSrc = fs.readFileSync(new URL('../router.js', import.meta.url), 'utf8');

// ─── A · Saldo · contingut real (no placeholder) ────────────────────────
console.log('— A · Saldo tab · real content');
ok('A · imports walletService funcs',          w2Src.includes('getOrCreateWalletForProject') && w2Src.includes('walletStats') && w2Src.includes('personalWalletIdFor'));
ok('A · imports unifiedAccountingService',     w2Src.includes('aggregateMovementsForOwner') && w2Src.includes('loadAllAccountingNodes'));
ok('A · _renderTabSaldo · async + carrega wallet', /async _renderTabSaldo\(main\)[\s\S]*await getOrCreateWalletForProject/.test(w2Src));
ok('A · renderitza balance gran + KPIs',       w2Src.includes('w2-kpi-grid') && w2Src.includes('w2-kpi'));
ok('A · 4 KPIs · ingressos · despesa · runway · total', w2Src.includes('Ingressos últims 30d') && w2Src.includes('Despesa últims 30d') && w2Src.includes('Runway') && w2Src.includes('Total recarregat'));
ok('A · runway calculat · saldo/expense30d',   /runway.*Months.*balance \/ last30dExpense|expense30.*\?|balance.*\/.*expense/i.test(w2Src));
ok('A · graf de barres 30 dies',                w2Src.includes('_renderActivityChart') && w2Src.includes('w2-bars-chart') && w2Src.includes('w2-bar-col'));
ok('A · quick actions a Top-up + Transaccions', w2Src.includes('data-w2-tab="topup"') && w2Src.includes('data-w2-tab="transaccions"'));
ok('A · NO té placeholder · sprint v129',       !w2Src.includes('Pestanya Saldo · sprint v129'));

// ─── B · Transaccions · filtres + taula + paginació + CSV ──────────────
console.log('\n— B · Transaccions tab · real content');
ok('B · _renderTabTransaccions async',          /async _renderTabTransaccions\(main\)/.test(w2Src));
ok('B · estat _txFilters inicialitzat',         /_txFilters = \{ kind: 'all', projectId: 'all', period: '30d', search: ''/.test(w2Src));
ok('B · _txPageSize = 50',                      w2Src.includes('this._txPageSize = 50'));
ok('B · filtres · kind + projectId + period + search', w2Src.includes('w2TxKind') && w2Src.includes('w2TxProject') && w2Src.includes('w2TxPeriod') && w2Src.includes('w2TxSearch'));
ok('B · _applyTxFilters · pure',                /_applyTxFilters\(movements\)/.test(w2Src));
ok('B · filtre period · cutoff = Date.now - days', w2Src.includes('parseInt(f.period, 10) * 86400_000'));
ok('B · _renderTxTable · genera <tr> per moviment', /_renderTxTable\(items, projects\)/.test(w2Src));
ok('B · taula amb 6 columnes',                  w2Src.includes('<th>Data</th>') && w2Src.includes('<th>Tipus</th>') && w2Src.includes('<th>Categoria</th>') && w2Src.includes('<th>Projecte</th>') && w2Src.includes('<th>Descripció</th>') && w2Src.includes('Import'));
ok('B · color-coded per kind (topup verd · consume vermell)', w2Src.includes('w2-kind-topup') && w2Src.includes('w2-kind-consume'));
ok('B · paginació · prev/next',                 w2Src.includes('w2TxPrev') && w2Src.includes('w2TxNext'));
ok('B · CSV export · Blob + URL.createObjectURL', w2Src.includes('_exportTxCSV') && w2Src.includes('URL.createObjectURL'));
ok('B · search debounce 250ms',                 w2Src.includes('searchTimer') && w2Src.includes('250'));
ok('B · reset filters · botó w2TxReset',        w2Src.includes('w2TxReset'));
ok('B · NO té placeholder · sprint v129',       !w2Src.includes('Pestanya Transaccions · sprint v129'));

// ─── C · Projectes · grid multi-wallet ─────────────────────────────────
console.log('\n— C · Projectes tab · grid multi-wallet');
ok('C · _renderTabProjectes async',             /async _renderTabProjectes\(main\)/.test(w2Src));
ok('C · agafa projects de store',                w2Src.includes('store.getState()?.projects'));
ok('C · inclou wallet personal',                w2Src.includes('personalWalletIdFor(handle)'));
ok('C · Promise.all per fetching paral·lel',    w2Src.includes('Promise.all(targets.map'));
ok('C · w2-proj-grid CSS class',                w2Src.includes('w2-proj-grid') && w2Src.includes('w2-proj-card'));
ok('C · runway badge color-coded · good/warn/bad', w2Src.includes('w2-runway-good') && w2Src.includes('w2-runway-warn') && w2Src.includes('w2-runway-bad'));
ok('C · current wallet té borda verda',         w2Src.includes('w2-proj-current'));
ok('C · total agregat balance + movements',     w2Src.includes('totalBalance') && w2Src.includes('totalMovements'));
ok('C · cada card té link · /wallet/v2 + /project', w2Src.includes('/wallet/v2?project=') && w2Src.includes('/project/'));
ok('C · NO té placeholder · sprint v129',       !w2Src.includes('Pestanya Projectes · sprint v129'));

// ─── D · /ledger alias semàntic ────────────────────────────────────────
console.log('\n— D · /ledger alias · ledger semàntic');
ok('D · /ledger registrat al router',           /\{ path: '\/ledger'/.test(routerSrc));
ok('D · /ledger usa WalletV2View',              /\/ledger.*WalletV2View/.test(routerSrc));
ok('D · WalletV2 detecta path /ledger → tab transaccions',
   w2Src.includes("path === '/ledger'") && /this\._activeTab = 'transaccions'/.test(w2Src));

// ─── E · Domain packs · expansió massiva ───────────────────────────────
console.log('\n— E · Domain packs · 24 cobreixen tots els sectors');
ok('E · DOMAIN_IDS.length >= 24',                DOMAIN_IDS.length >= 24);
const expectedNewPacks = [
    'food-coop', 'health-clinic', 'hotel-hospitality', 'construction',
    'software-agency', 'coworking', 'ecommerce', 'community-media',
    'housing-coop', 'energy-coop', 'legal-advisory', 'artisan-craft',
    'public-admin', 'ngo-humanitarian',
];
for (const id of expectedNewPacks) {
    ok('E · pack ' + id + ' present',           DOMAIN_PACKS[id] != null);
    ok('E · ' + id + ' té ≥ 6 arquetip',         (DOMAIN_PACKS[id]?.archetypes?.length || 0) >= 6);
}

// ─── F · Detecció · casos reals dels nous packs ───────────────────────
console.log('\n— F · detecció real · casos dels nous packs');
const cases = [
    { name: 'Forn Vall',          desc: 'Forn de pa amb grup de consum local i restaurant cooperatiu associat',     sector: 'C', expect: 'food-coop' },
    { name: 'Clínica Dr. Pérez',  desc: 'Centre de salut amb metge de família i infermera',                            sector: 'Q', expect: 'health-clinic' },
    { name: 'Hotel Petit Mont',   desc: 'Hotel rural amb 12 habitacions a la Cerdanya',                                sector: 'I', expect: 'hotel-hospitality' },
    { name: 'Obres Sant Cugat',   desc: 'Empresa de construcció · rehabilitació · paletes especialitzats',             sector: 'F', expect: 'construction' },
    { name: 'CodeCorp',           desc: 'Startup SaaS amb 5 enginyers software i un product manager',                  sector: 'J', expect: 'software-agency' },
    { name: 'Mola Coworking',     desc: 'Coworking al barri amb 30 membres i community manager',                       sector: 'L', expect: 'coworking' },
    { name: 'EcoTienda',          desc: 'Botiga online D2C de productes ecològics · Shopify · marketplace',            sector: 'G', expect: 'ecommerce' },
    { name: 'Ràdio L\'Hospitalet',desc: 'Ràdio comunitària amb graella oberta i 12 conductors voluntaris',             sector: 'J', expect: 'community-media' },
    { name: 'La Borda',           desc: 'Cooperativa d\'habitatge en cessió d\'ús · cohousing al Poblesec',             sector: 'L', expect: 'housing-coop' },
    { name: 'Som Energia',        desc: 'Cooperativa energètica · comercialitzadora i solar comunitari',               sector: 'D', expect: 'energy-coop' },
    { name: 'Despatx Albert',     desc: 'Despatx d\'advocats amb 4 socis i una gestoria associada',                     sector: 'M', expect: 'legal-advisory' },
    { name: 'Ceràmica Bilbao',    desc: 'Taller de ceràmica artesana · mestra + 2 aprenents',                          sector: 'C', expect: 'artisan-craft' },
    { name: 'Ajuntament de Vic',  desc: 'Ajuntament amb 80 funcionaris i pressupost participatiu',                     sector: 'O', expect: 'public-admin' },
    { name: 'Sida Studi',         desc: 'ONG humanitària · cooperació internacional · programa refugiats',             sector: 'S', expect: 'ngo-humanitarian' },
];
for (const tc of cases) {
    const d = detectDomain({ name: tc.name, description: tc.desc, sector: tc.sector });
    ok('F · "' + tc.name + '" → ' + tc.expect, d?.domain === tc.expect);
}

// ─── G · Coverage sectorial · DOMAIN_PACKS cobreix sectors clau ───────
console.log('\n— G · cobertura sectors CNAE');
const allSectorHints = new Set();
for (const id of DOMAIN_IDS) {
    for (const s of (DOMAIN_PACKS[id].sectorHints || [])) allSectorHints.add(s);
}
const criticalSectors = ['A', 'C', 'F', 'G', 'I', 'J', 'L', 'M', 'O', 'P', 'Q', 'R', 'S', 'D', 'N'];
for (const s of criticalSectors) {
    ok('G · sector CNAE ' + s + ' cobert per algun pack', allSectorHints.has(s));
}

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
