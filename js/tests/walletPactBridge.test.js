// =============================================================================
// TEAMTOWERS SOS V11 — WALLET ↔ PACT BRIDGE + NOTARY · TDD (v124)
// Ruta · /js/tests/walletPactBridge.test.js
//
// Verifica · /wallet i /pact tenen els nous panels v124 ·
//   ─ /wallet · panel "Pacte vigent" + grid "Generar acords"
//   ─ /pact · panel "Wallet del projecte" + panel "Notarització permaweb"
//   ─ ambdós · botons Notaritzar que criden publishToPermaweb
//
// Test estructural · revisa el source code (sense executar la view).
// =============================================================================

import fs from 'node:fs';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== WALLET ↔ PACT BRIDGE + NOTARY (v124) ===\n');

const walletSrc = fs.readFileSync(new URL('../views/WalletView.js', import.meta.url), 'utf8');
const pactSrc   = fs.readFileSync(new URL('../views/PactBuilderView.js', import.meta.url), 'utf8');

// ─── A · WalletView · panel pact + grid legal agents ──────────────────
console.log('— A · WalletView · panel "Pacte vigent" + grid agreements');
ok('A · _renderPactPanel definit',                walletSrc.includes('async _renderPactPanel()'));
ok('A · carrega node pact via KB.getNode',        walletSrc.includes("'::pact::sos-v1'") && walletSrc.includes('KB.getNode(pactId)'));
ok('A · usa pactSummary',                          walletSrc.includes('pactSummary(pact)'));
ok('A · mostra arweaveTxId si notaritzat',        walletSrc.includes('arweaveTxId') && walletSrc.includes('Notaritzat'));
ok('A · CTA crear pacte si no existeix',          walletSrc.includes('+ Crear pacte de socis'));
ok('A · _renderLegalAgentsGrid definit',           walletSrc.includes('_renderLegalAgentsGrid()'));
ok('A · importa LEGAL_AGENTS_CATALOG',             walletSrc.includes('legalAgentsCatalog.js'));

// ─── B · WalletView · notarize handler ────────────────────────────────
console.log('\n— B · WalletView · _notarizePact handler');
ok('B · _notarizePact definit',                    walletSrc.includes('async _notarizePact(pact)'));
ok('B · importa publishToPermaweb',                walletSrc.includes('publishToPermaweb'));
ok('B · passa projectId per descomptar fee',       walletSrc.includes('projectId: this.projectId'));
ok('B · persisteix arweaveTxId post-publish',      walletSrc.includes('pact.content.arweaveTxId = res.arweaveTxId'));

// ─── C · PactBuilderView · panel wallet + notari ───────────────────────
console.log('\n— C · PactBuilderView · panel wallet + notari');
ok('C · _renderWalletPanel definit',               pactSrc.includes('async _renderWalletPanel()'));
ok('C · llegeix wallet via getOrCreateWalletForProject', pactSrc.includes('getOrCreateWalletForProject'));
ok('C · mostra saldo del wallet',                  pactSrc.includes('balanceEur'));
ok('C · _renderNotaryPanel definit',               pactSrc.includes('async _renderNotaryPanel()'));
ok('C · gate · cal signedAll abans de notari',     pactSrc.includes('summary?.signedAll === true'));
ok('C · _handleNotarize · publishToPermaweb',      pactSrc.includes('_handleNotarize()') && pactSrc.includes('publishToPermaweb'));
ok('C · persisteix arweaveTxId al pact post-pub',  pactSrc.includes('this.pact.content.arweaveTxId'));

// ─── D · CTA bidireccional · links cruzats ─────────────────────────────
console.log('\n— D · UX · links bidireccionals');
ok('D · wallet té link /pact?project=',            walletSrc.includes('/pact?project='));
ok('D · pact té link /wallet?project=',            pactSrc.includes('/wallet?project='));
ok('D · ambdós link a /value-accounting (tarta)', walletSrc.includes('/value-accounting?') && pactSrc.includes('/value-accounting?'));

// ─── E · UX · estats visuals · gates · refunds ────────────────────────
console.log('\n— E · UX defensiu · feedback + gates');
ok('E · wallet · estat carregant',                 walletSrc.includes('Comprovant…') || walletSrc.includes('Carregant…'));
ok('E · pact · estat carregant',                   pactSrc.includes('Carregant saldo') || pactSrc.includes('Comprovant estat'));
ok('E · pact · warning si no signed completament', pactSrc.includes('totes les parts hagin signat'));
ok('E · gestió error notarize · alert + reset btn', walletSrc.includes("'🌐 Notaritzar al permaweb'") && walletSrc.includes('btn.disabled = false'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
