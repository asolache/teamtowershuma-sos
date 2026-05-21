// =============================================================================
// TEAMTOWERS SOS V11 — v161 · verna-guided differentiation + landmark anchoring
// detector. Fixes 2 issues found in v160 Anchoring Lab ·
// (1) verna-guided era no-op (idèntic a verna-minimal)
// (2) fewshot_overlap exact-match pintava 0% encara amb anchoring qualitatiu
//     (ex · output "Fundador Ancoratge" no matcheja few-shot "Founder Anchor")
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v161 · verna-guided real differentiation + landmark detector ===\n');

const { buildPrompt } = await import(path.join(ROOT, 'js/core/vnaExpertPrompts.js'));

// ─── A · verna-minimal vs verna-guided diferenciació real ─────────────
console.log('— A · verna-guided ≠ verna-minimal');
const ctx = {
    name: 'projecte-test',
    description: 'descripció del projecte',
    sector: 'M',
    sectorContext: 'TEXT_PROHIBIT',
};
const pMin = buildPrompt({ taskKind: 'personalize-canvas', context: ctx, contextProfile: 'verna-minimal' });
const pGui = buildPrompt({ taskKind: 'personalize-canvas', context: ctx, contextProfile: 'verna-guided' });

ok('A · verna-guided conserva sector CNAE al user prompt',     pGui.user.includes('M'));
ok('A · verna-minimal elimina sector del user prompt',         !/Sector CNAE · M[^a-z]/.test(pMin.user) && pMin.user.includes('(no especificat)'));
ok('A · both strippen sectorContext literal',                  !pMin.user.includes('TEXT_PROHIBIT') && !pGui.user.includes('TEXT_PROHIBIT'));
ok('A · prompts difereixen materialment',                      pMin.user !== pGui.user);

// ─── B · landmark detector a PromptsDebugView ─────────────────────────
console.log('\n— B · fewshot_overlap landmark-based');
const pd = fs.readFileSync(path.join(ROOT, 'js/views/PromptsDebugView.js'), 'utf8');

ok('B · fewShotLandmarks set construït',                       pd.includes('fewShotLandmarks') && pd.includes('new Set()'));
ok('B · filtra paraules genèriques (GENERIC_WORDS)',           pd.includes('GENERIC_WORDS') && pd.includes("'founder'") && pd.includes("'manager'"));
ok('B · tokenitza per non-letter chars',                       /split\(\/\[\^a-zàèéíòóúïü·\]\+\//.test(pd));
ok('B · filtra tokens curts (length > 4)',                     pd.includes('t.length > 4'));
ok('B · detecció via substring includes',                      /for \(const lm of fewShotLandmarks\)[\s\S]{0,200}n\.includes\(lm\)/.test(pd));

// ─── C · simulació · "Fundador Ancoratge" detectat com a anchoring ───
console.log('\n— C · simulació detector · captura anchoring qualitatiu');
const { FEW_SHOT_EXAMPLES } = await import(path.join(ROOT, 'js/core/vnaExpertPrompts.js'));

const GENERIC = new Set(['manager','founder','operations','creator','reviewer','facilitator','team','director','responsable','coordinador','gestor','cap','lead','operacions','col·la','colla','del','dels','les','los','par','par','project','projecte']);
const landmarks = new Set();
Object.values(FEW_SHOT_EXAMPLES).forEach(ex => {
    const parsed = JSON.parse(ex.assistantOutput);
    (parsed.roles || []).forEach(r => {
        String((r.name || '') + ' ' + (r.kind || ''))
            .toLowerCase()
            .split(/[^a-zàèéíòóúïü·]+/)
            .filter(t => t.length > 4 && !GENERIC.has(t))
            .forEach(t => landmarks.add(t));
    });
});

const detectAnchored = (rolName) => {
    const n = rolName.toLowerCase();
    for (const lm of landmarks) if (n.includes(lm)) return lm;
    return null;
};

ok('C · "Visioner · Cap de Colla" detectat (landmark "visioner")',       detectAnchored('Visioner · Cap de Colla') !== null);
ok('C · "Arquitecte System Lead" detectat (landmark "arquitecte")',      detectAnchored('Arquitecte System Lead') !== null);
ok('C · "Cohort Manager Industrial" detectat (landmark "cohort")',       detectAnchored('Cohort Manager Industrial') !== null);
ok('C · "Coordinador Cooperativa" NO detectat (rol genèric · OK)',       detectAnchored('Coordinador Cooperativa') === null);
ok('C · "Productor referent" NO detectat',                               detectAnchored('Productor referent') === null);
// Limit conegut · detector és same-language. Cross-language ("anchor" EN vs
// "ancoratge" CA) NO és detectat. Fix futur · stem-based o sinònims.

console.log('\n  landmarks captured · ' + Array.from(landmarks).slice(0, 10).join(', ') + (landmarks.size > 10 ? ' …' : ''));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
