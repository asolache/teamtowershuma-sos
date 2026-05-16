// =============================================================================
// TEAMTOWERS SOS V11 — LEGENDARY CREATION UX · TDD (PR-G)
// Ruta · /js/tests/legendaryCreationUx.test.js
//
// Blinda l'experiència "wow" del flow de creació · skeletons + fade-in +
// celebració + jerarquia CTA + copy revamped.
// =============================================================================

import fs from 'node:fs';

let pass = 0, fail = 0;
function ok(label, cond, expected = '', got = '') {
    if (cond) { pass++; console.log('✓', label); }
    else {
        fail++;
        const detail = (expected !== '' || got !== '') ? ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})` : '';
        console.log('✗', label + detail);
    }
}

const clvSrc = fs.readFileSync(new URL('../views/CreateLiveView.js', import.meta.url), 'utf8');
const pcvSrc = fs.readFileSync(new URL('../views/ProjectCreationV2View.js', import.meta.url), 'utf8');

console.log('=== LEGENDARY-CREATION-UX (PR-G) ===\n');

// ─── A · Skeleton states als 4 tabs · pistes visuals + animació pulse ─
console.log('— A · Skeletons als 4 tabs · fan visible "el que vindrà"');
for (const tab of ['cl-skel-castell', 'cl-skel-mapa', 'cl-skel-canvas', 'cl-skel-wos']) {
    ok('A · skeleton class ' + tab + ' definit', clvSrc.includes(tab));
}
ok('A · skeleton CSS · animació pulse', clvSrc.includes('@keyframes cl-pulse'));
ok('A · skeleton hint amb pista visual', clvSrc.includes('cl-skel-hint'));
// Hint copy té emojis i descripció del que vindrà
ok('A · castell skeleton menciona "jerarquia per nivells"', clvSrc.includes('jerarquia per nivells'));
ok('A · mapa skeleton menciona "transaccions entre rols"', clvSrc.includes('transaccions entre rols'));
ok('A · canvas skeleton menciona "visió, missió, valors"', clvSrc.includes('visió, missió, valors'));
ok('A · wos skeleton menciona "Kanban"', clvSrc.includes('Kanban'));

// ─── B · Fade-in animation aplicada als items reals ─────────────────────
console.log('\n— B · Fade-in animation quan apareix contingut real');
ok('B · cl-fade-in class declarada', clvSrc.includes('.cl-fade-in'));
ok('B · cl-fade-in keyframes', clvSrc.includes('@keyframes cl-fade-in'));
// Roles + transactions + canvas + sops/wos apliquen fade-in al pintar
const fadeInUsages = (clvSrc.match(/cl-fade-in/g) || []).length;
ok('B · cl-fade-in usat ≥6 vegades (roles+txs+canvas+sops+wos)', fadeInUsages >= 6, '≥6', fadeInUsages);

// ─── C · Finish bar amb badge celebració · gold special treatment ──────
console.log('\n— C · Finish bar · badge + CTA jeràrquic + celebració gold');
ok('C · cl-finish-badge classes (gold/silver/bronze/red)', clvSrc.includes('cl-finish-badge-gold') && clvSrc.includes('cl-finish-badge-silver') && clvSrc.includes('cl-finish-badge-bronze') && clvSrc.includes('cl-finish-badge-red'));
ok('C · badge gold amb box-shadow daurada', clvSrc.includes('rgba(251,191,36,0.5)'));
ok('C · CTA primary "hero" més gran', clvSrc.includes('cl-btn-hero'));
ok('C · CTAs secundaris (Mapa · Qualitat · Hub) separats', clvSrc.includes('cl-finish-secondary'));
ok('C · animació celebració gold', clvSrc.includes('@keyframes cl-celebrate'));
ok('C · text "Llegendari" si score ≥85', clvSrc.includes('Llegendari'));

// ─── D · Hero /create renombrat amb verbs imperatius i pill destacat ──
console.log('\n— D · Hero /create copy revamped · més impactant');
ok('D · headline "Crea el teu projecte amb IA · en 90 segons"', pcvSrc.includes('en 90 segons'));
ok('D · subtítol amb llista d\'entregables', pcvSrc.includes('Roles · mapa de valor · canvas'));
ok('D · pill plantilla activa CSS', pcvSrc.includes('pcv-hero-pill'));
// NO menció a "pipeline · classify → seed" al hero (massa tècnic per a UX final)
ok('D · hero NO té paràgraf llarg "pipeline · classify → seed"', !pcvSrc.match(/h1[\s\S]{0,600}pipeline · classify → seed/));

// ─── E · Pipeline dots i CTAs · accessibilitat + hover micro-int ──────
console.log('\n— E · Microinteraccions · hover translateY al CTA');
ok('E · CTAs hover · translateY animation', clvSrc.includes('translateY(-1px)'));
ok('E · backdrop-filter al finish-bar (glassmorphism)', clvSrc.includes('backdrop-filter'));

// ─── F · Coherencia visual · cl-finish-bar usa flex layout amb info+CTA ─
console.log('\n— F · Layout finish-bar coherent · info esquerra · CTA dreta');
ok('F · finish-info és flex column (badge over meta)', clvSrc.match(/cl-finish-info[\s\S]{0,200}flex-direction:column/));
ok('F · finish-cta align-items center · responsive flex-wrap', clvSrc.includes('flex-wrap:wrap'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
