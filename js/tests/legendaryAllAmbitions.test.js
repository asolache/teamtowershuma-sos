// =============================================================================
// TEAMTOWERS SOS V11 — LEGENDARY ALL AMBITIONS · TDD (PR-K)
// Ruta · /js/tests/legendaryAllAmbitions.test.js
//
// Blinda · els 3 ambitions (light/standard/max) tenen UX llegendària a
// /create-live · banner ambition + narrativa + budget + hint adaptat WOs +
// finish bar narrativa segons ambition.
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

console.log('=== LEGENDARY-ALL-AMBITIONS (PR-K) ===\n');

// ─── A · Ambition banner amb classe diferenciada per ambition ─────────
console.log('— A · ambition banner · 3 estils visuals');
ok('A · classe banner light (cl-amb-light)',    clvSrc.includes('cl-amb-light'));
ok('A · classe banner standard (cl-amb-standard)', clvSrc.includes('cl-amb-standard'));
ok('A · classe banner max (cl-amb-max)',        clvSrc.includes('cl-amb-max'));
ok('A · banner max amb glow daurat',            clvSrc.includes('rgba(251,191,36,0.25)'));
ok('A · banner light amb blau (60a5fa)',        clvSrc.includes('60a5fa'));
ok('A · banner standard amb lila/indigo',       clvSrc.includes('168,85,247') || clvSrc.includes('99,102,241'));

// ─── B · Narrative per ambition · text concret per cada nivell ────────
console.log('\n— B · narrativa adaptada per ambition');
ok('B · light · "validar idees abans d\'invertir"', clvSrc.includes('validar idees'));
ok('B · standard · "sweet spot"',                 clvSrc.includes('sweet spot'));
ok('B · max · "L\'experiència total"',            clvSrc.includes('experiència total'));
ok('B · max · menciona Work Orders + Kanban',     clvSrc.includes('Work Orders executables al Kanban'));

// ─── C · Budget pill amb cost esperat per ambition ────────────────────
console.log('\n— C · budget pill · cost esperat');
ok('C · light · ~0.005€',  clvSrc.includes('~0.005€'));
ok('C · standard · ~0.015€', clvSrc.includes('~0.015€'));
ok('C · max · ~0.030€',     clvSrc.includes('~0.030€'));
ok('C · clBudget id present', clvSrc.includes('clBudget'));
ok('C · clBudgetPill id present', clvSrc.includes('clBudgetPill'));

// ─── D · Hint WOs adaptat per ambition · light NO promet WOs ──────────
console.log('\n— D · WOs hint per ambition · expectatives realistes');
ok('D · light · NO promet WOs · explica upgrade', clvSrc.includes('MODE LIGHT') && clvSrc.includes('puja a STANDARD o MAX'));
ok('D · standard · promet WOs al Kanban',         clvSrc.includes('MODE STANDARD') && clvSrc.includes('Work Orders al Kanban'));
ok('D · max · DTD test booleà',                   clvSrc.includes('MODE MAX') && clvSrc.includes('DTD test'));

// ─── E · Finish bar adaptat per ambition · text + CTA primary smart ──
console.log('\n— E · finish bar · status text + CTA primary intel·ligent');
ok('E · max gold · "Mega producte llegendari"',  clvSrc.includes('Mega producte llegendari'));
ok('E · light gold · "Light brillant"',          clvSrc.includes('Light brillant'));
ok('E · max ≥70 · "Solidesa alta"',              clvSrc.includes('Solidesa alta'));
// Primary CTA condicional · hasWos
ok('E · primary smart · si WOs → Kanban',        clvSrc.match(/hasWos[\s\S]{0,300}Comença sprint Kanban/));
ok('E · primary smart · si NO WOs → Mapa',       clvSrc.match(/Explora el mapa de valor/));

// ─── F · _renderAmbitionHero · 3 profiles complets ─────────────────────
console.log('\n— F · _renderAmbitionHero · 3 profiles definits');
ok('F · profiles light/standard/max al codi', clvSrc.includes('light:') && clvSrc.includes('standard:') && clvSrc.includes('max:') && (clvSrc.match(/icon:/g) || []).length >= 3);
ok('F · profile light icon ✏️', clvSrc.includes("'✏️'"));
ok('F · profile standard icon ⚡', clvSrc.match(/standard:[\s\S]{0,150}'⚡'/));
ok('F · profile max icon 🏆', clvSrc.match(/max:[\s\S]{0,150}'🏆'/));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
