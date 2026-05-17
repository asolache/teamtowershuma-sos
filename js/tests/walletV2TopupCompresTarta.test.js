// =============================================================================
// TEAMTOWERS SOS V11 — WALLET V2 · TOP-UP + COMPRES + TARTA · TDD (v130)
// Ruta · /js/tests/walletV2TopupCompresTarta.test.js
//
// Verifica que les 3 pestanyes finals (Top-up · Compres · Tarta) tenen
// contingut real · BINGO de WalletV2 complet.
// =============================================================================

import fs from 'node:fs';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== WALLET V2 · TOP-UP + COMPRES + TARTA (v130 · BINGO) ===\n');

const w2Src = fs.readFileSync(new URL('../views/WalletV2View.js', import.meta.url), 'utf8');

// ─── A · Top-up · 3 sub-pestanyes ──────────────────────────────────────
console.log('— A · Top-up · sub-tabs Stripe + Crypto stables + Crypto convertible');
ok('A · _renderTabTopup async amb subs',         /async _renderTabTopup\(main\)[\s\S]*subTabs = \[/.test(w2Src));
ok('A · sub-tab Stripe',                          w2Src.includes("id: 'stripe',") && w2Src.includes('💳'));
ok('A · sub-tab crypto-stable',                   w2Src.includes("id: 'crypto-stable',") && w2Src.includes('Stables'));
ok('A · sub-tab crypto-conv',                     w2Src.includes("id: 'crypto-conv',") && w2Src.includes('Convertible'));
ok('A · CSS w2-sub-tabs · pill style',            w2Src.includes('.w2-sub-tabs') && w2Src.includes('.w2-sub-active'));
ok('A · NO placeholder · sprint v130',            !w2Src.includes('Pestanya Top-up · sprint v130'));

// ─── B · Stripe sub-content ────────────────────────────────────────────
console.log('\n— B · Stripe sub-content · presets + custom amount');
ok('B · _renderTopupStripe definit',              /_renderTopupStripe\(\) \{/.test(w2Src));
ok('B · presets 10/25/50/100/250/500',            w2Src.includes('[10, 25, 50, 100, 250, 500]'));
ok('B · custom amount input id',                  w2Src.includes('w2StripeCustom'));
ok('B · custom btn id',                           w2Src.includes('w2StripeCustomBtn'));
ok('B · validació range 1-10000€',                w2Src.includes("amt >= 1") || /amt < 1 \|\| amt > 10000/.test(w2Src));
ok('B · _stripeCheckout · crida createCheckoutSession',
   /createCheckoutSession/.test(w2Src) && /async _stripeCheckout\(amountEur\)/.test(w2Src));
ok('B · obre URL en nova pestanya',               w2Src.includes("window.open(res.url, '_blank'"));
ok('B · gestiona fallback si edge fn no desplegada',
   w2Src.includes('checkout-create-failed') && w2Src.includes('Payment Links predefinits'));

// ─── C · Crypto stable sub-content ─────────────────────────────────────
console.log('\n— C · Crypto stables · USDC · USDT · DAI · xDAI');
ok('C · _renderTopupCryptoStable definit',        /_renderTopupCryptoStable\(\) \{/.test(w2Src));
ok('C · USDC-Polygon + USDT + DAI + USDC-Gnosis + XDAI',
   w2Src.includes('USDC-Polygon') && w2Src.includes('USDT-Polygon') && w2Src.includes('DAI-Polygon') &&
   w2Src.includes('USDC-Gnosis') && w2Src.includes('XDAI-Gnosis'));
ok('C · tokens-grid amb data-crypto-token',       w2Src.includes('data-crypto-token') && w2Src.includes('w2-tokens-grid'));
ok('C · _cryptoFlow async · quote viva',           /async _cryptoFlow\(tokenId\)/.test(w2Src));
ok('C · _generateCryptoIntent · crida createDepositIntent',
   /createDepositIntent/.test(w2Src) && /async _generateCryptoIntent/.test(w2Src));
ok('C · _confirmCryptoIntent · crida confirmDepositIntent',
   /confirmDepositIntent/.test(w2Src) && /async _confirmCryptoIntent/.test(w2Src));
ok('C · post-confirm · acredita wallet + va a Saldo', /creditedEur/.test(w2Src) && /Veure Saldo/.test(w2Src));

// ─── D · Crypto convertible sub-content ────────────────────────────────
console.log('\n— D · Crypto convertible · ETH · WBTC · MATIC');
ok('D · _renderTopupCryptoConvertible definit',   /_renderTopupCryptoConvertible\(\) \{/.test(w2Src));
ok('D · ETH-Mainnet + WBTC-Polygon + MATIC-Polygon',
   w2Src.includes('ETH-Mainnet') && w2Src.includes('WBTC-Polygon') && w2Src.includes('MATIC-Polygon'));
ok('D · warning NO-STABLE volatilitat',           w2Src.includes('NO-STABLE'));

// ─── E · Compres tab · historial + provider breakdown ──────────────────
console.log('\n— E · Compres · llista cronològica + provider breakdown');
ok('E · _renderTabCompres async',                 /async _renderTabCompres\(main\)/.test(w2Src));
ok('E · filtra topups amb amountEur > 0',         /m\.kind === 'topup' && m\.amountEur > 0/.test(w2Src));
ok('E · breakdown per provider · stripe/crypto/manual/other',
   w2Src.includes("byProvider = { stripe:") && w2Src.includes('crypto:'));
ok('E · llista cronològica · _renderActiveTab',    /w2-purchase-list|w2-purchase-row/.test(w2Src));
ok('E · CSS w2-prov-card + w2-purchase-row',       w2Src.includes('.w2-prov-card') && w2Src.includes('.w2-purchase-row'));
ok('E · NO placeholder · sprint v131',            !w2Src.includes('Pestanya Compres · sprint v131'));

// ─── F · Tarta · embed sintètic ────────────────────────────────────────
console.log('\n— F · Tarta · summary + link a vista completa');
ok('F · _renderTabTarta async',                   /async _renderTabTarta\(main\)/.test(w2Src));
ok('F · gating · requireix projectId',            w2Src.includes('La Tarta requereix un projecte actiu'));
ok('F · usa calculateProjectPie + summarizeProjectPie',
   w2Src.includes('calculateProjectPie') && w2Src.includes('summarizeProjectPie'));
ok('F · KPIs tarta (Membres · Slices · Assignat · Sense)',
   w2Src.includes('Membres') && w2Src.includes('Slices total') && w2Src.includes('Assignat') && w2Src.includes('Sense assignar'));
ok('F · link a /value-accounting?project=X',      w2Src.includes('/value-accounting?project='));
ok('F · NO placeholder · sprint v131',            !w2Src.includes('Pestanya Tarta · sprint v131'));

// ─── G · CSS components v130 ───────────────────────────────────────────
console.log('\n— G · CSS · token cards + sub-tabs + presets');
ok('G · CSS .w2-token-card · stable + conv',      w2Src.includes('.w2-token-card') && w2Src.includes('.w2-token-conv'));
ok('G · CSS .w2-preset · custom checkout style', w2Src.includes('.w2-preset'));
ok('G · responsive mobile · w2-tokens-grid resize',
   /\.w2-tokens-grid \{ grid-template-columns: repeat\(auto-fill, minmax\(140px/.test(w2Src));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
