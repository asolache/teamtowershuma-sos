// =============================================================================
// TEAMTOWERS SOS V11 — /prompts-debug · DOMAIN PANEL + OVERRIDE · TDD (v127)
// Ruta · /js/tests/promptsDebugDomainPanel.test.js
//
// Verifica que PromptsDebugView renderitza un panel amb el domini detectat
// quan task=design-value-map-rich · permet override manual via select +
// alternatives suggerides.
// =============================================================================

import fs from 'node:fs';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== /prompts-debug · DOMAIN PANEL + OVERRIDE (v127) ===\n');

const src = fs.readFileSync(new URL('../views/PromptsDebugView.js', import.meta.url), 'utf8');

// ─── A · imports ────────────────────────────────────────────────────────
console.log('— A · imports nous');
ok('A · importa detectDomain',                  src.includes('detectDomain,'));
ok('A · importa detectDomainsMulti',            src.includes('detectDomainsMulti'));
ok('A · importa getDomainPack',                 src.includes('getDomainPack'));
ok('A · importa listDomains',                   src.includes('listDomains'));

// ─── B · _buildContext injecta domainDetection ────────────────────────
console.log('\n— B · _buildContext lògica override + auto-detect');
ok('B · check només per design-value-map-rich',  src.includes("this._activeTask === 'design-value-map-rich'"));
ok('B · override manual via getDomainPack',     src.includes("if (pack) ctx.domainDetection = { ...pack, domain: pack.id, confidence: 1.0, via: 'manual-override' }"));
ok('B · auto · crida detectDomain',             src.includes("const auto = detectDomain({ name: c.name, description: c.description, sector: c.sector })"));
ok('B · cache this._lastDomainDetection',       src.includes('this._lastDomainDetection = ctx.domainDetection || null'));

// ─── C · _renderDomainPanel ────────────────────────────────────────────
console.log('\n— C · _renderDomainPanel HTML');
ok('C · mètode _renderDomainPanel definit',     src.includes('_renderDomainPanel()'));
ok('C · panel mostra ✓ verda si detectat',      src.includes("'✓ '") || src.includes('color:#22c55e'));
ok('C · panel mostra ⚠ groga si no detectat',   src.includes('Sense detecció'));
ok('C · panel mostra arquetip injectats',       src.includes('arquetip injectats al prompt'));
ok('C · panel té select #pdDomainOverride',     src.includes('id="pdDomainOverride"'));
ok('C · option auto · auto-detect',             src.includes('🤖 Auto-detect'));
ok('C · option none · sense detecció',          src.includes('❌ Sense detecció'));
ok('C · optgroup "Override manual"',            src.includes('Override manual'));
ok('C · panel mostra alternatives detectades',   src.includes('Alternatives detectades') || src.includes('data-domain-alt'));

// ─── D · panel renderitzat només per design-value-map-rich ────────────
console.log('\n— D · gating · panel només a design-value-map-rich');
ok('D · _renderDomainPanel cridat condicionalment',
   src.includes("(this._activeTask === 'design-value-map-rich') ? this._renderDomainPanel() : ''"));

// ─── E · handlers · change override + click alt ───────────────────────
console.log('\n— E · handlers');
ok('E · #pdDomainOverride change handler',      src.includes("sel.addEventListener('change'"));
ok('E · update this._ctx.domainOverride',       src.includes('this._ctx.domainOverride = e.target.value'));
ok('E · re-render post override',                src.includes('this._renderPromptPanel()'));
ok('E · alt buttons data-domain-alt handler',    src.includes('data-domain-alt'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
