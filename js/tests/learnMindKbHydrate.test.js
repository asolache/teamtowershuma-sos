// =============================================================================
// TEAMTOWERS SOS V11 — LEARN · MIND TAB · KB HYDRATE FIX · TDD (v123)
// Ruta · /js/tests/learnMindKbHydrate.test.js
//
// Bug @alvaro · /learn?tab=mind no mostrava res (només es veia després de
// prémer botó) · root cause: _renderMindTab llegia store.getState().nodes
// que MAI no ha existit al state (només existeix kbVersion + projects[]).
//
// Fix · v123 · _renderMindTab usa cache this._mindStats i _hydrateMindStats
// llegeix KB.getAllNodes() async post-render · actualitza in place sense
// re-render complet.
// =============================================================================

import fs from 'node:fs';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== LEARN · MIND TAB · KB HYDRATE FIX (v123) ===\n');

const learnSrc = fs.readFileSync(new URL('../views/LearnView.js', import.meta.url), 'utf8');

// ─── A · Importa KB ────────────────────────────────────────────────────
console.log('— A · imports + hydrate hook');
ok('A · importa KB des de core/kb.js',                learnSrc.includes("import { KB } from '../core/kb.js'"));
ok('A · afterRender invoca _hydrateMindStats quan mode=mind',
   learnSrc.includes("if (this._mode === 'mind') this._hydrateMindStats()"));

// ─── B · _renderMindTab · cache + loading state ───────────────────────
console.log('\n— B · _renderMindTab usa cache + loading state');
// _renderMindTab usa this._mindStats (cache) i NO llegeix store.nodes (que mai
// no ha existit). Verifiquem el bloc concret · des de _renderMindTab fins a la
// crida de _ctaFullView('/mind').
const mindBlock = (() => {
    const start = learnSrc.indexOf('_renderMindTab()');
    if (start < 0) return '';
    const end = learnSrc.indexOf("_ctaFullView('/mind'", start);
    return learnSrc.slice(start, end > 0 ? end + 50 : start + 2500);
})();
ok('B · _renderMindTab usa this._mindStats',   mindBlock.includes('this._mindStats'));
ok('B · _renderMindTab NO llegeix store.nodes', !mindBlock.includes('store.getState?.()?.nodes') && !mindBlock.includes('store.getState().nodes'));
ok('B · render té loading state (…)',                 learnSrc.includes('kbStats.loading'));
ok('B · mostra projectes actius del store',          learnSrc.includes('stateProjects.length'));

// ─── C · _hydrateMindStats · llegeix KB.getAllNodes() ─────────────────
console.log('\n— C · _hydrateMindStats async · KB read real');
ok('C · _hydrateMindStats existeix',                  learnSrc.includes('async _hydrateMindStats()'));
ok('C · crida KB.init?.()',                           learnSrc.includes('await KB.init?.()'));
ok('C · crida KB.getAllNodes?.()',                    learnSrc.includes('await KB.getAllNodes?.()'));
ok('C · comptatge per type + kind fallback',          learnSrc.includes('n?.type || n?.kind'));
ok('C · update in place via outerHTML',               learnSrc.includes('card.outerHTML = this._renderMindTab()'));
ok('C · gestiona error · stats.error',                learnSrc.includes('error: e?.message'));

// ─── D · simulació · agregació per type ──────────────────────────────
console.log('\n— D · simulació · agregació per type/kind');
{
    const allNodes = [
        { id: 'p1', type: 'project' },
        { id: 'p2', type: 'project' },
        { id: 's1', type: 'sop' },
        { id: 's2', kind: 'sop' },
        { id: 'w1' },     // unknown
    ];
    const byType = {};
    for (const n of allNodes) {
        const t = n?.type || n?.kind || 'unknown';
        byType[t] = (byType[t] || 0) + 1;
    }
    ok('D · 2 projects',          byType.project === 2);
    ok('D · 2 sop (type + kind)', byType.sop === 2);
    ok('D · 1 unknown',           byType.unknown === 1);
    ok('D · 3 tipus distints',    Object.keys(byType).length === 3);
}

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
