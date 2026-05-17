// =============================================================================
// TEAMTOWERS SOS V11 — IKIGAI FIX DEFINITIU + HUB LEGENDARY · TDD (PR-L)
// Ruta · /js/tests/ikigaiHubLegendary.test.js
// =============================================================================

import fs from 'node:fs';
import { applyIkigaiToMember, buildEmptyIkigai, applyIkigaiDimension } from '../core/ikigaiService.js';
import { ensureMember } from '../core/profile360Service.js';

let pass = 0, fail = 0;
function ok(label, cond, expected = '', got = '') {
    if (cond) { pass++; console.log('✓', label); }
    else {
        fail++;
        const detail = (expected !== '' || got !== '') ? ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})` : '';
        console.log('✗', label + detail);
    }
}

console.log('=== IKIGAI FIX DEFINITIU + HUB LEGENDARY (PR-L) ===\n');

// ─── A · Ikigai save · verificació + re-intent · codi font Profile360View ─
console.log('— A · Ikigai save handler · verify + retry logic');
const pvSrc = fs.readFileSync(new URL('../views/Profile360View.js', import.meta.url), 'utf8');

ok('A · post-upsert · getNode per verificar', pvSrc.match(/await KB\.getNode\(updated\.id\)/));
ok('A · si verification fail · re-intent upsert', pvSrc.match(/\[ikigai\] verification FAIL.*re-trying upsert/));
ok('A · si encara fail · throw error explícit', pvSrc.match(/persistència no verificada al KB/));
ok('A · render IMMEDIAT (no setTimeout 400ms)', !pvSrc.match(/setTimeout\(.*modal\.remove[\s\S]{0,40}this\.render/));
ok('A · render async/await', pvSrc.match(/await this\.render\(\);.*re-render/));
ok('A · toast success amb "verificat"', pvSrc.match(/verificat al KB/));
ok('A · toast error en cas d\'error', pvSrc.indexOf('Ikigai no s\\\'ha pogut desar') >= 0 || pvSrc.indexOf('Ikigai no s') >= 0);

// ─── B · Ikigai · simulació end-to-end · ensureMember + applyIkigai ──
console.log('\n— B · Ikigai end-to-end · pure flow simulation');
const identityNode = { content: { handle: 'alvaro', displayName: '@alvaro', isPrimary: true, primaryDid: 'did:sos:abc' } };
const { member: m0, created } = ensureMember({ handle: '@alvaro', identityNode });
ok('B · ensureMember crea el node', created === true && m0?.id === 'member-alvaro');
ok('B · member nou té content.ikigai = null', m0.content.ikigai === null);

// Build empty ikigai → apply 1 dim
let working = buildEmptyIkigai();
working = applyIkigaiDimension(working, 'loves', ['cooperative software', 'mentoring']);

// Apply to member
const m1 = applyIkigaiToMember(m0, working);
ok('B · applyIkigaiToMember preserva id', m1.id === m0.id);
ok('B · applyIkigaiToMember escriu content.ikigai', !!m1.content.ikigai);
ok('B · ikigai.dimensions.loves.items 2', m1.content.ikigai.dimensions?.loves?.items?.length === 2);
ok('B · content.handle preserved', m1.content.handle === 'alvaro');
ok('B · updatedAt actualitzat', typeof m1.updatedAt === 'number');

// Simulate KB.upsert + getNode (in-memory fake)
const fakeKB = new Map();
fakeKB.set(m1.id, m1);
const verified = fakeKB.get(m1.id);
ok('B · fake KB · verified.content.ikigai present', !!verified.content.ikigai);
ok('B · verified.content.ikigai.dimensions.loves matches', verified.content.ikigai.dimensions.loves.items[0] === 'cooperative software');

// ─── C · Hub Legendary · _zone0 · stats clau ──────────────────────────
console.log('\n— C · Hub Legendary · _zone0_Legendary present');
const hubSrc = fs.readFileSync(new URL('../views/ProjectHubV2View.js', import.meta.url), 'utf8');

ok('C · _zone0_Legendary method definit', hubSrc.match(/_zone0_Legendary\s*\(/));
ok('C · _zone0 inclòs al render abans de _zone1', hubSrc.match(/_zone0_Legendary[\s\S]{0,200}_zone1_OrgBar/));
ok('C · stats · roles count', hubSrc.includes('hub-leg-stat-lbl') && hubSrc.includes('rols'));
ok('C · stats · WOs progress (in-progress / total)', hubSrc.includes('in-progress / total'));
ok('C · stats · cost IA sessió', hubSrc.includes('cost IA sessió'));
ok('C · stats · canvas + pitch presence', hubSrc.match(/canvas[\s\S]{0,200}pitch/));
ok('C · transactions count', hubSrc.includes('transaccions'));
ok('C · quality badge gold/silver/bronze/red', hubSrc.match(/score >= 85.*'#fbbf24'/));
ok('C · ambition badge ✏️/⚡/🏆', hubSrc.match(/light:[\s\S]{0,20}'✏️'/) && hubSrc.match(/max:[\s\S]{0,20}'🏆'/));

// ─── D · CSS hub-legendary · styling correcte ─────────────────────────
console.log('\n— D · CSS hub-legendary');
ok('D · .hub-legendary gradient bg',     hubSrc.includes('.hub-legendary') && hubSrc.includes('linear-gradient'));
ok('D · .hub-leg-quality border + color', hubSrc.includes('.hub-leg-quality'));
ok('D · .hub-leg-stat hover · translateY', hubSrc.includes('.hub-leg-stat:hover') && hubSrc.includes('translateY(-1px)'));
ok('D · responsive @media 600px',         hubSrc.match(/@media[\s\S]{0,100}max-width:\s*600px[\s\S]{0,200}hub-leg-stats/));

// ─── E · Hub legendary · vision preview amb truncat ───────────────────
console.log('\n— E · vision preview text · truncat a 110 chars');
ok('E · visionShort truncate logic 110',  hubSrc.match(/visionTxt\.length > 110/));
ok('E · vision fallback canvas/purpose/description', hubSrc.match(/canvas\?\.vision \|\| project\.purpose \|\| project\.description/));
ok('E · vision empty hint · "edita el canvas"', hubSrc.includes('edita el canvas'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
