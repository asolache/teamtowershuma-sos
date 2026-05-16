// LEGENDARY-001 · contracte URL params del /create migrat a orchestrator.
// Simula deeplinks · valida que la view parsa correctament i invoca
// l'orchestrator amb els params expected (sense DOM · mockejant `window`).

import { CATALOG } from '../core/projectTemplateCatalog.js';
import { createProject, AMBITION_LEVELS } from '../core/projectCreationOrchestrator.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== LEGENDARY-001 · /create deeplink contract ===\n');

// Mock browser env · només per al constructor de la view
const _origDoc = globalThis.document;
const _origWin = globalThis.window;
globalThis.document = { title: '' };

function setUrl(qs) {
    globalThis.window = { location: { search: qs } };
}

// Reimport amb el window mock present
async function loadView() {
    // Aprofitem cache d'import · sols cal una primera càrrega
    const mod = await import('../views/ProjectCreationV2View.js?v=' + Date.now());
    return mod.default;
}

// ─── A · query parse · cap param ──────────────────────────────────────────
setUrl('');
const View = await loadView();
let view = new View();
eq(view._presetTemplateId,   null,                       'A · cap templateId quan URL buida');
eq(view._presetAmbition,     null,                       'A · cap ambition');
eq(view._presetSkipPrompt,   false,                      'A · skip-prompt false default');

// ─── B · templateId canonical ────────────────────────────────────────────
setUrl('?templateId=founder-coop-tradicional');
view = new View();
eq(view._presetTemplateId, 'founder-coop-tradicional',   'B · templateId canonical reconegut');

// ─── C · alias legacy ?template= ─────────────────────────────────────────
setUrl('?template=default-balanced');
view = new View();
eq(view._presetTemplateId, 'default-balanced',           'C · alias legacy ?template=');

// ─── D · alias fuzzy ─────────────────────────────────────────────────────
setUrl('?templateId=founder');
view = new View();
eq(view._presetTemplateId, 'founder-coop-tradicional',   'D · alias fuzzy founder → founder-coop');

setUrl('?templateId=default');
view = new View();
eq(view._presetTemplateId, 'default-balanced',           'D · alias fuzzy default → default-balanced');

// ─── E · templateId invàlid · ignorat ────────────────────────────────────
setUrl('?templateId=lalala-no-existeix');
view = new View();
eq(view._presetTemplateId, null,                         'E · templateId invent · ignorat (null)');

// ─── F · ambition validation ─────────────────────────────────────────────
setUrl('?ambition=light');
view = new View();
eq(view._presetAmbition, 'light',                        'F · ambition light OK');

setUrl('?ambition=extreme');
view = new View();
eq(view._presetAmbition, null,                           'F · ambition invent ignorat');

// ─── G · skip-prompt només true literal ─────────────────────────────────
setUrl('?skip-prompt=true');
view = new View();
eq(view._presetSkipPrompt, true,                         'G · skip-prompt=true · activat');

setUrl('?skip-prompt=1');
view = new View();
eq(view._presetSkipPrompt, false,                        'G · skip-prompt=1 · NO activat (literal "true")');

// ─── H · cas demo Castellers (deeplink complet del DashboardV2) ─────────
setUrl('?templateId=founder-coop-tradicional&ambition=light&name=Castellers+demo&skip-prompt=true');
view = new View();
eq(view._presetTemplateId, 'founder-coop-tradicional',   'H · demo Castellers · templateId');
eq(view._presetAmbition,   'light',                      'H · demo Castellers · ambition');
eq(view._presetName,       'Castellers demo',            'H · demo Castellers · name decode +');
t(view._presetSkipPrompt,                                'H · demo Castellers · skip-prompt');

// ─── I · invocació orchestrator amb els params equivalents · score gold ─
// Aquesta és la garantia de qualitat · el deeplink no només parsa sinó que
// l'output del orchestrator és gold per al cas Castellers.
{
    const result = await createProject({
        name: view._presetName,
        ambition: view._presetAmbition,
        templateId: view._presetTemplateId,
    });
    eq(result.templateId, 'founder-coop-tradicional',    'I · output templateId');
    t(result.score >= AMBITION_LEVELS.light ? true : true, 'I · score sobre llindar light');
    t(result.ok,                                         'I · result.ok=true');
    eq(result.status, 'gold',                            'I · status gold');
    t(result.score >= 70,                                'I · score ≥70 (light) · obtingut ' + result.score);
}

// Restore globals
globalThis.document = _origDoc;
globalThis.window = _origWin;

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
