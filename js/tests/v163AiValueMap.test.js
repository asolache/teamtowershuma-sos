// =============================================================================
// SOS V11 · v163.8 · createProject genera VNA REAL amb IA (no template)
//
// PROBLEMA · l'usuari veia "personalize · sector-roles-applied · count 5"
// i acabava amb el mateix mapa genèric (founder/operations/creator/reviewer/
// facilitator) per a TOTS els projectes · només els noms canviaven segons
// sector · les transactions eren totalment template · 0 valor del mapa.
//
// FIX · createProject ara accepta generateValueMap callback · si està
// disponible · l'IA genera roles+transactions des de NAME+DESCRIPTION i
// SUBSTITUEIX els del template. Shape mínim · ≥3 rols i ≥3 transactions ·
// si fail · fallback al template (degrade graceful).
// =============================================================================

import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v163.8 · createProject · ai-value-map ===\n');

const { createProject } = await import(path.join(ROOT, 'js/core/projectCreationOrchestrator.js'));

// ─── A · createProject SENSE generateValueMap · genèric (regressió) ────────
console.log('— A · sense generateValueMap · template genèric');
const events = [];
const r1 = await createProject({
    name: 'PimeData',
    description: 'Consultoria de dades per pimes catalanes',
    onEvent: (e) => events.push(e),
});
ok('A · ok=true',                                   r1.ok === true);
ok('A · 5 rols template genèrics',                   (r1.project?.vna_roles || r1.roles || []).length === 5);
const noAiMapEvent = !events.some(e => e.step === 'ai-value-map');
ok('A · NO emet ai-value-map (callback no injectat)', noAiMapEvent);

// ─── B · amb generateValueMap mock · roles substituïts ───────────────────
console.log('\n— B · amb generateValueMap · roles substituïts');
const events2 = [];
const mockGenMap = async ({ name, description }) => ({
    ok: true,
    roles: [
        { id: 'consultor-data', name: 'Consultor de dades · ' + name,  kind: 'creator' },
        { id: 'data-engineer',  name: 'Data engineer',                   kind: 'creator' },
        { id: 'cap-projecte',   name: 'Cap de projecte',                 kind: 'pm' },
        { id: 'pime-client',    name: 'Pime catalana (client)',          kind: 'beneficiary' },
        { id: 'gerent',         name: 'Gerent · ' + name,                kind: 'founder' },
    ],
    transactions: [
        { id: 'tx-a', from: 'consultor-data', to: 'pime-client',    deliverable: 'Dashboard dades',  type: 'tangible',   is_must: true },
        { id: 'tx-b', from: 'pime-client',    to: 'consultor-data', deliverable: 'Pagament fee',     type: 'tangible',   is_must: true },
        { id: 'tx-c', from: 'data-engineer',  to: 'consultor-data', deliverable: 'ETL pipeline',     type: 'tangible',   is_must: true },
        { id: 'tx-d', from: 'cap-projecte',   to: 'consultor-data', deliverable: 'Confiança equip',  type: 'intangible', is_must: false },
        { id: 'tx-e', from: 'gerent',         to: 'pime-client',    deliverable: 'Reputació pública', type: 'intangible', is_must: false },
    ],
    deliverables: [
        { id: 'd-dash',  name: 'Dashboard dades' },
        { id: 'd-fee',   name: 'Pagament fee' },
        { id: 'd-pipe',  name: 'ETL pipeline' },
    ],
    cost: 0.012,
    score: { score: 82 },
    modelKey: 'mock/test',
});
const r2 = await createProject({
    name:        'PimeData',
    description: 'Consultoria de dades per pimes catalanes',
    generateValueMap: mockGenMap,
    onEvent:     (e) => events2.push(e),
});
// Nota · r.ok depèn d'un rubric ≥85 (Lean metrics · SOPs · deliverables) que
// requereix més que un mapa de roles+tx · aquí validem que el FLOW IA ha
// corregut i el contingut del mapa és IA-generat (la queixa de l'usuari)
ok('B · result té status assignat',                   typeof r2.status === 'string' && r2.status.length > 0);
const aiMapStart = events2.find(e => e.step === 'ai-value-map' && e.status === 'start');
const aiMapDone  = events2.find(e => e.step === 'ai-value-map' && e.status === 'done');
ok('B · emet ai-value-map · start',                  !!aiMapStart);
ok('B · emet ai-value-map · done',                   !!aiMapDone);
ok('B · done · 5 rols',                              aiMapDone?.roles === 5);
ok('B · done · 5 transactions',                       aiMapDone?.transactions === 5);
ok('B · done · score = 82',                           aiMapDone?.score === 82);

const finalRoles = r2.project?.vna_roles || r2.roles || [];
ok('B · roles del result són els IA-generats',       finalRoles.some(r => r.id === 'consultor-data'));
ok('B · roles NO contenen template genèric founder', !finalRoles.some(r => r.id === 'founder'));
const finalTx = r2.transactions || [];
ok('B · transactions són les IA-generades',          finalTx.some(t => t.id === 'tx-a' || /tx-[a-e]/.test(t.id || '')));

// ─── C · si generateValueMap fail · fallback al template ──────────────────
console.log('\n— C · failure de generateValueMap · fallback template');
const events3 = [];
const failGenMap = async () => ({ ok: false, error: 'simulated-failure' });
const r3 = await createProject({
    name:        'TestFail',
    description: 'Test fallback',
    generateValueMap: failGenMap,
    onEvent:     (e) => events3.push(e),
});
ok('C · ok=true (degrade graceful)',                  r3.ok === true);
const fallback = events3.find(e => e.step === 'ai-value-map' && e.status === 'fallback');
ok('C · emet ai-value-map · fallback',                !!fallback);
ok('C · roles tornem a tenir founder (template)',     (r3.project?.vna_roles || r3.roles || []).some(r => r.id === 'founder'));

// ─── D · shape rejection · roles < 3 ─────────────────────────────────────
console.log('\n— D · shape rejection · si IA torna < 3 rols');
const events4 = [];
const tooFewMap = async () => ({
    ok: true,
    roles: [{ id: 'a', name: 'a', kind: 'creator' }, { id: 'b', name: 'b', kind: 'reviewer' }],
    transactions: [{ id: 'tx', from: 'a', to: 'b', deliverable: 'x', type: 'tangible' }],
});
const r4 = await createProject({
    name:        'TestShape',
    description: 'Test shape rejection',
    generateValueMap: tooFewMap,
    onEvent:     (e) => events4.push(e),
});
const fallback2 = events4.find(e => e.step === 'ai-value-map' && e.status === 'fallback');
ok('D · shape rejection · fallback emès',             !!fallback2);
ok('D · fallback reason · shape-rejected',             /shape-rejected/.test(fallback2?.reason || ''));
ok('D · result manté template (5 rols)',              (r4.project?.vna_roles || r4.roles || []).length === 5);

// ─── E · adapter (aiDrivenCreationAdapter) · té generateValueMap ─────────
console.log('\n— E · adapter · buildAiCallbacks exposa generateValueMap');
const { buildAiCallbacks } = await import(path.join(ROOT, 'js/core/aiDrivenCreationAdapter.js'));
const cb = buildAiCallbacks({});
ok('E · callback generateValueMap és funció',         typeof cb.generateValueMap === 'function');
ok('E · callback pickSocs també present (regressió)', typeof cb.pickSocs === 'function');
ok('E · callback generateSops també present',          typeof cb.generateSops === 'function');
ok('E · callback generateWos també present',           typeof cb.generateWos === 'function');

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
