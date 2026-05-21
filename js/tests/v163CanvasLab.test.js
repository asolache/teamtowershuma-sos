// =============================================================================
// TEAMTOWERS SOS V11 — v163 · Canvas Anchoring Lab · mètriques + UI hooks
// Valida que les mètriques pures distingeixen un canvas anchored/generic
// d'un canvas concret/específic. Sense LLM real · només lògica.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v163 · Canvas Anchoring Lab · mètriques pures ===\n');

const { computeGenericityCount, computeStakeholderDiversityPct, computeCanvasCompletenessPct, GENERIC_VOCAB } =
    await import(path.join(ROOT, 'js/core/canvasLabMetrics.js'));

// ─── A · GENERIC_VOCAB · cobertura mínima 3 idiomes ─────────────────
console.log('— A · GENERIC_VOCAB · cobertura mínima');
ok('A · inclou qualitat (CA)',         GENERIC_VOCAB.includes('qualitat'));
ok('A · inclou innovacion (ES)',       GENERIC_VOCAB.includes('innovacion') || GENERIC_VOCAB.includes('innovación'));
ok('A · inclou excellence (EN)',       GENERIC_VOCAB.includes('excellence'));
ok('A · ≥ 15 paraules mínimes',         GENERIC_VOCAB.length >= 15);

// ─── B · genericityCount · canvas buit / generic / specific ──────────
console.log('\n— B · computeGenericityCount');
const canvasGeneric = {
    mission: 'Aportem qualitat i innovació amb compromís i transparència',
    vision: 'Excel·lència en sostenibilitat',
    values: ['qualitat', 'innovació', 'sinergia'],
};
const canvasSpecific = {
    mission: 'Acompanyem 8 famílies del Pirineu a vendre verdura ecològica setmanal a Barcelona',
    vision: 'Tota la comarca menjant local el 2030',
    values: ['proximitat', 'temporada', 'cura del sòl'],
};
ok('B · canvas generic detecta ≥ 5 paraules',     computeGenericityCount(canvasGeneric) >= 5);
ok('B · canvas specific detecta 0 paraules',      computeGenericityCount(canvasSpecific) === 0);
ok('B · canvas null = 0',                          computeGenericityCount(null) === 0);
ok('B · word boundary · "qualitat" NO matcheja "qualitatiu"',
    computeGenericityCount({ x: 'estudi qualitatiu' }) === 0);

// ─── C · stakeholderDiversityPct ─────────────────────────────────────
console.log('\n— C · computeStakeholderDiversityPct');
const lowDiversity = [
    { stakeholders: ['clients', 'equip', 'inversors'] },
    { stakeholders: ['clients', 'equip', 'inversors'] },
    { stakeholders: ['clients', 'equip', 'inversors'] },
];
const highDiversity = [
    { stakeholders: ['famílies productores', 'consumidors urbans', 'certificadora'] },
    { stakeholders: ['actors-veïns', 'audiència local', 'ajuntament'] },
    { stakeholders: ['mestres', 'famílies sòcies', 'consell rector'] },
];
ok('C · low diversity ≤ 35%',                      computeStakeholderDiversityPct(lowDiversity) <= 35);
ok('C · high diversity = 100% (tots únics)',       computeStakeholderDiversityPct(highDiversity) === 100);
ok('C · array buit retorna 0',                     computeStakeholderDiversityPct([]) === 0);
ok('C · single canvas retorna 0 (cal ≥ 2 mostres)', computeStakeholderDiversityPct([{ stakeholders: ['a'] }]) === 0);

// ─── D · canvasCompletenessPct ──────────────────────────────────────
console.log('\n— D · computeCanvasCompletenessPct');
const canvasFull = {
    ikigai: {
        loves: ['cuidar gent gran'],
        goodAt: ['gestió cooperativa'],
        worldNeeds: ['solitud creixent'],
        paidFor: ['serveis cures domiciliàries'],
    },
    vision: 'Cooperativa de cures referent del Baix Empordà',
    mission: 'Acompanyem amb dignitat',
    values: ['proximitat', 'cooperació'],
    stakeholders: ['usuàries', 'famílies', 'ajuntament'],
};
const canvasPartial = {
    ikigai: { loves: ['x'], goodAt: ['y'] }, // 2/4 ikigai
    vision: 'V',  // <5 chars · invalid
    mission: 'Missió clara aquí',
};
ok('D · canvas full · 100%',                       computeCanvasCompletenessPct(canvasFull) === 100);
// canvasPartial · loves ✓ · goodAt ✓ · mission ✓ · resta no = 3/8 = 38%
ok('D · canvas partial · 38% (3 camps válids/8)',  computeCanvasCompletenessPct(canvasPartial) === 38);
ok('D · canvas null · 0%',                          computeCanvasCompletenessPct(null) === 0);

// ─── E · UI hooks a PromptsDebugView ────────────────────────────────
console.log('\n— E · PromptsDebugView · botó + handler');
const pd = fs.readFileSync(path.join(ROOT, 'js/views/PromptsDebugView.js'), 'utf8');
ok('E · botó pdCanvasLabRun al HTML',              pd.includes('pdCanvasLabRun') && pd.includes('Canvas Anchoring Lab'));
ok('E · botó vincula a _runCanvasLab',             pd.includes("getElementById('pdCanvasLabRun')") && pd.includes('_runCanvasLab'));
ok('E · _runCanvasLab definit',                     pd.includes('async _runCanvasLab'));
ok('E · usa buildPrompt amb personalize-canvas',    /buildPrompt\(\{[\s\S]{0,300}taskKind: 'personalize-canvas'/.test(pd));
ok('E · importa canvasLabMetrics',                  pd.includes('canvasLabMetrics'));
ok('E · render columna generic/divers/complete',    pd.includes('generic↓') && pd.includes('divers↑') && pd.includes('complete↑'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
