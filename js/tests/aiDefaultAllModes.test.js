// =============================================================================
// TEAMTOWERS SOS V11 — IA DEFAULT ALL MODES · TDD (PR-J)
// Ruta · /js/tests/aiDefaultAllModes.test.js
//
// Blinda que · light/standard/max ara TOTS defaulten a 'ai-driven' quan
// no hi ha override explícit · sense API key · fallback graceful a template.
// =============================================================================

import { resolveSuggestion } from '../core/projectEntityWizard.js';
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

console.log('=== IA-DEFAULT-ALL-MODES (PR-J) ===\n');

// ─── A · wizard · TOTS els formats defaulten a ai-driven ────────────
console.log('— A · wizard resolveSuggestion · ai-driven per a tots');
const ENTITIES = ['organization', 'business', 'sos', 'project_internal'];
for (const e of ENTITIES) {
    // Obtenim un format vàlid per cada entity
    const fmt = { organization: 'coop', business: 'autonom', sos: 'sos_federat', project_internal: 'spike' }[e];
    const sug = resolveSuggestion(e, fmt);
    ok('A · ' + e + '/' + fmt + ' → generationMode=ai-driven', sug?.generationMode === 'ai-driven', 'ai-driven', sug?.generationMode);
}

// També amb ambition='light' (autonom té ambition=light)
const sLight = resolveSuggestion('business', 'autonom');
ok('A · business/autonom (ambition=light) · TAMBÉ ai-driven', sLight?.generationMode === 'ai-driven');

// ─── B · ProjectCreationV2View · default ai-driven (codi font) ──────
console.log('\n— B · ProjectCreationV2View default genMode = ai-driven');
const pcvSrc = fs.readFileSync(new URL('../views/ProjectCreationV2View.js', import.meta.url), 'utf8');
// El default ja no és el ternari ambition === 'light' ? 'template' : 'ai-driven'
ok('B · NO usa el vell ternari ambition === light template', !pcvSrc.includes("(ambition === 'light' ? 'template' : 'ai-driven')"));
// Usa 'ai-driven' directe
ok('B · default genMode = ai-driven literal', pcvSrc.match(/genMode\s*=\s*document\.getElementById\([^)]+\)\?\.value\s*\|\|\s*'ai-driven'/));

// ─── C · vna_zoom auto-mapping per ambition ─────────────────────────
console.log('\n— C · vna_zoom auto-mapping (light=macro · std=mid · max=micro)');
ok('C · light → macro mapping', pcvSrc.includes('light:') && pcvSrc.includes("'macro'") && pcvSrc.match(/light:\s*'macro'/));
ok('C · standard → mid mapping', pcvSrc.match(/standard:\s*'mid'/));
ok('C · max → micro mapping', pcvSrc.match(/max:\s*'micro'/));

// ─── D · cards copy revamped · ja no diuen "Template + N IA calls" ──
console.log('\n— D · ambition cards copy no menciona Template');
ok('D · light · IA mínima (no "Template + 1 IA call")', pcvSrc.includes('IA mínima') && !pcvSrc.match(/Light.*Template \+ 1 IA call/));
ok('D · standard · IA equilibrada', pcvSrc.includes('IA equilibrada'));
ok('D · max · IA full · mega producte', pcvSrc.includes('IA full') && pcvSrc.includes('mega producte'));

// ─── E · fallback graceful · hasAnyApiKey pre-flight intacte ────────
console.log('\n— E · pre-flight check hasAnyApiKey segueix actiu');
ok('E · pcv importa hasAnyApiKey dynamic', pcvSrc.includes('hasAnyApiKey'));
ok('E · effectiveGenMode = template fallback', pcvSrc.includes("effectiveGenMode = 'template'"));
ok('E · toast warning quan no key', pcvSrc.includes('Cap API key configurada'));

// ─── F · wizard codi font · sense generationMode condicional ────────
console.log('\n— F · wizard codi font · generationMode fix a ai-driven');
const wizSrc = fs.readFileSync(new URL('../core/projectEntityWizard.js', import.meta.url), 'utf8');
ok('F · wizard NO usa fmt.ambition === light template ternari',
    !wizSrc.includes("fmt.ambition === 'light' ? 'template'") &&
    !wizSrc.includes("ambition === 'light'\\? 'template'"));
ok('F · wizard té generationMode = ai-driven literal', wizSrc.match(/generationMode\s*=\s*['"]ai-driven['"]/));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
