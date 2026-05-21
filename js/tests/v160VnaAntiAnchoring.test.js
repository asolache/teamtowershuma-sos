// =============================================================================
// TEAMTOWERS SOS V11 — v160 · VNA prompt anti-anchoring (verna-minimal) · TDD
// User: "siempre me da los mismos roles y entregables · over-context · skill
// Claude funcionava bé".
//
// Tests deterministes (sense LLM) que validen ·
// - SYSTEM_BASE_VERNA existeix · zero exemples literals
// - Task 'design-value-map-verna' existeix · metaskill-first
// - Flag contextProfile s'aplica correctament a buildPrompt
// - quickSuggestMap propaga contextProfile · usa el task correcte
// - Botó Anchoring Lab existeix a PromptsDebugView
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v160 · VNA prompt anti-anchoring (verna-minimal) · TDD ===\n');

const ep = fs.readFileSync(path.join(ROOT, 'js/core/vnaExpertPrompts.js'), 'utf8');
const qs = fs.readFileSync(path.join(ROOT, 'js/core/vnaQuickSuggest.js'), 'utf8');
const pd = fs.readFileSync(path.join(ROOT, 'js/views/PromptsDebugView.js'), 'utf8');

// ─── A · SYSTEM_BASE_VERNA exists · anti-anchoring guards ────────────
console.log('— A · SYSTEM_BASE_VERNA · anti-anchoring guards');
ok('A · SYSTEM_BASE_VERNA exportat',                 ep.includes('export const SYSTEM_BASE_VERNA'));
ok('A · ancla en METASKILL',                          ep.includes('ANCORATGE PRIMARI · METASKILL'));
ok('A · 4 PRINCIPIS VNA presents',                    ep.includes('4 PRINCIPIS VNA') && ep.includes('Reciprocitat') && ep.includes('Emergència'));
ok('A · TIPOLOGIES abstractes (no literals)',         ep.includes('TIPOLOGIES DE FLUX') && ep.includes('categories abstractes'));
ok('A · REGLES ANTI-ANCHORING explícites',            ep.includes('REGLES ANTI-ANCHORING'));
ok('A · _castellerPreambleSlots SENSE typical_kinds', /_castellerPreambleSlots[\s\S]{0,300}?l\.id[\s\S]{0,80}?l\.description/.test(ep) &&
                                                       !/_castellerPreambleSlots[\s\S]{0,300}?typical_kinds/.test(ep));

// ─── B · 'design-value-map-verna' task exists ────────────────────────
console.log('\n— B · task design-value-map-verna');
ok('B · task afegit a TASK_KINDS',                     ep.includes("'design-value-map-verna'"));
ok('B · prompt parla de METASKILL',                    /design-value-map-verna[\s\S]{0,3000}METASKILL/.test(ep));
ok('B · prompt suporta needs_clarify',                  ep.includes('needs_clarify'));
ok('B · prompt amb regles anti-plantilla',             /design-value-map-verna[\s\S]{0,5000}REGLES ANTI-PLANTILLA/i.test(ep));
ok('B · prompt amb missing_roles output',              ep.includes('missing_roles'));

// ─── C · buildPrompt contextProfile flag ─────────────────────────────
console.log('\n— C · buildPrompt · flag contextProfile');
ok('C · param contextProfile al signature',           ep.includes("contextProfile = 'sos-current'"));
ok('C · valida valors profile',                        ep.includes("['sos-current', 'verna-minimal', 'verna-guided']"));
ok('C · strip de capes ancoradores en verna-*',        ep.includes('delete effectiveCtx.domainDetection') && ep.includes('delete effectiveCtx.sectorContext') && ep.includes('delete effectiveCtx.currentTemplate'));
ok('C · NO fewShot en verna-*',                        ep.includes('allowFewShot') && ep.includes("contextProfile === 'sos-current'"));
ok('C · usa SYSTEM_BASE_VERNA en verna-*',             /contextProfile === 'verna-minimal' \|\| contextProfile === 'verna-guided'[\s\S]{0,200}SYSTEM_BASE_VERNA/.test(ep));
ok('C · return inclou contextProfile',                 /return \{[\s\S]{0,400}contextProfile[\s\S]{0,200}\}/.test(ep));

// ─── D · quickSuggestMap propaga contextProfile ──────────────────────
console.log('\n— D · quickSuggestMap · propaga contextProfile');
ok('D · param contextProfile al signature',           qs.includes("contextProfile = 'sos-current'"));
ok('D · selecciona task design-value-map-verna',      qs.includes("'design-value-map-verna'"));
ok('D · passa contextProfile a buildPrompt',          qs.includes('contextProfile') && qs.match(/buildPrompt\(\{[^}]*contextProfile/));
ok('D · runValueMapCycle accepta contextProfile',     qs.includes("contextProfile = 'sos-current'") && /runValueMapCycle[\s\S]{0,500}contextProfile/.test(qs));

// ─── E · PromptsDebugView · Anchoring Lab ────────────────────────────
console.log('\n— E · /prompts-debug · VNA Anchoring Lab');
ok('E · botó Anchoring Lab al HTML',                  pd.includes('pdAnchoringLabRun') && pd.includes('VNA Anchoring Lab'));
ok('E · funció _runAnchoringLab definida',            pd.includes('async _runAnchoringLab'));
ok('E · executa 3 perfils × N projectes',              pd.includes("'sos-current', 'verna-minimal', 'verna-guided'") &&
                                                        /PROJECTS\s*=\s*\[/.test(pd));
ok('E · ≥5 projectes diversos',                       (pd.match(/id: '[a-z-]+',\s*name:/g) || []).length >= 5);
ok('E · mètrica fewshot_overlap',                      pd.includes('fewshotOverlapPct'));
ok('E · mètrica cross_project_diversity',              pd.includes('crossProjectDiversity'));
ok('E · mètrica shape eval (v158)',                    pd.includes('evaluateValueMapShape') && pd.includes('avgShapeScore'));
ok('E · taula comparativa renderitzada',               pd.includes('<table') && pd.includes('fewshot↓') && pd.includes('diversity↑'));

// ─── F · functional · buildPrompt amb verna-minimal genera prompt sense exemples ──
console.log('\n— F · buildPrompt · funcional · verna-minimal');
const { buildPrompt, SYSTEM_BASE_VERNA, SYSTEM_BASE, FEW_SHOT_EXAMPLES } = await import(path.join(ROOT, 'js/core/vnaExpertPrompts.js'));

const ctx = {
    name: 'projecte-test',
    description: 'descripció del projecte',
    sector: 'M',
    vna_zoom: 'meso',
    // Capes que el verna-minimal HA D'IGNORAR:
    domainDetection: { domain: 'sports-team', archetypes: [{ name: 'visioner' }, { name: 'arquitecte' }] },
    sectorContext: 'TEXT_QUE_NO_HA_D_APARÈIXER_AL_PROMPT',
    sectorSeed: 'OTHER_TEXT_PROHIBIT',
};

const promptCurrent = buildPrompt({ taskKind: 'design-value-map-verna', context: ctx, contextProfile: 'sos-current' });
const promptVerna   = buildPrompt({ taskKind: 'design-value-map-verna', context: ctx, contextProfile: 'verna-minimal' });

ok('F · verna-minimal usa SYSTEM_BASE_VERNA',          promptVerna.system === SYSTEM_BASE_VERNA);
ok('F · sos-current usa SYSTEM_BASE (no slim)',        promptCurrent.system === SYSTEM_BASE);
ok('F · verna-minimal NO fewShot',                     promptVerna.fewShot.length === 0);
ok('F · verna-minimal user prompt NO conté sectorContext literal',
                                                        !promptVerna.user.includes('TEXT_QUE_NO_HA_D_APARÈIXER_AL_PROMPT'));
ok('F · verna-minimal user prompt NO conté sectorSeed literal',
                                                        !promptVerna.user.includes('OTHER_TEXT_PROHIBIT'));
ok('F · verna-minimal tokens < sos-current tokens',    promptVerna.approxTokens < promptCurrent.approxTokens);

// templateId · few-shot ha de ser ignorat en verna-*
const promptVernaFewShot = buildPrompt({ taskKind: 'design-value-map-verna', context: ctx, contextProfile: 'verna-minimal', templateId: 'founder-coop-tradicional' });
ok('F · verna-minimal IGNORA templateId (no fewShot)',  promptVernaFewShot.fewShot.length === 0);

// ─── G · SYSTEM_BASE_VERNA tokens · ha de ser materialment més curt ──
console.log('\n— G · token budget · SYSTEM_BASE_VERNA');
const vernaTokens = Math.ceil(SYSTEM_BASE_VERNA.length / 4);
const sosTokens   = Math.ceil(SYSTEM_BASE.length / 4);
console.log('  SYSTEM_BASE_VERNA: ~' + vernaTokens + ' tk · SYSTEM_BASE: ~' + sosTokens + ' tk · estalvi: ' + Math.round((1 - vernaTokens/sosTokens)*100) + '%');
ok('G · SYSTEM_BASE_VERNA ≤ 800 tokens',                vernaTokens <= 800);
ok('G · estalvi ≥ 40% vs SYSTEM_BASE',                  (1 - vernaTokens/sosTokens) >= 0.40);

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
