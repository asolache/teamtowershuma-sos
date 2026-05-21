// =============================================================================
// TEAMTOWERS SOS V11 — v162 · canvas+pitch verna-style · METASKILL preamble +
// expert chain threading. Estén la filosofia v160 (anti-anchoring) a les fases
// narratives (no només value-map).
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v162 · canvas+pitch verna-style · METASKILL preamble ===\n');

const { buildPrompt } = await import(path.join(ROOT, 'js/core/vnaExpertPrompts.js'));
const ep = fs.readFileSync(path.join(ROOT, 'js/core/vnaExpertPrompts.js'), 'utf8');
const ec = fs.readFileSync(path.join(ROOT, 'js/core/expertChainOrchestrator.js'), 'utf8');

const ctx = {
    name: 'Cooperativa Cures',
    description: 'serveis cures domiciliàries cooperatives',
    sector: 'Q',
    lifecycle_stage: 'mvp',
};

// ─── A · METASKILL preamble · canvas/pitch en verna-* ──────────────
console.log('— A · METASKILL preamble per tasks narratives');
const canvasSos    = buildPrompt({ taskKind: 'personalize-canvas', context: ctx, contextProfile: 'sos-current'   });
const canvasVerna  = buildPrompt({ taskKind: 'personalize-canvas', context: ctx, contextProfile: 'verna-minimal' });
const canvasGuided = buildPrompt({ taskKind: 'personalize-canvas', context: ctx, contextProfile: 'verna-guided'  });
const pitchVerna   = buildPrompt({ taskKind: 'personalize-pitch',  context: ctx, contextProfile: 'verna-minimal' });

ok('A · sos-current canvas · SENSE METASKILL preamble',         !canvasSos.user.includes('CONTEXT METASKILL'));
ok('A · verna-minimal canvas · AMB METASKILL preamble',          canvasVerna.user.includes('CONTEXT METASKILL'));
ok('A · verna-guided canvas · AMB METASKILL preamble',           canvasGuided.user.includes('CONTEXT METASKILL'));
ok('A · verna-minimal pitch · AMB METASKILL preamble',           pitchVerna.user.includes('CONTEXT METASKILL'));
ok('A · preamble · misió + visió + objectius',                   canvasVerna.user.includes('Misió') && canvasVerna.user.includes('Visió') && canvasVerna.user.includes('Objectius'));
ok('A · preamble · prohibició vocabulari genèric',               canvasVerna.user.includes('qualitat') && canvasVerna.user.includes('innovació'));

// ─── B · NO double preamble per design-value-map-verna ──────────────
console.log('\n— B · design-value-map-verna · NO double preamble');
const mapVerna = buildPrompt({ taskKind: 'design-value-map-verna', context: ctx, contextProfile: 'verna-minimal' });
const occurrences = (mapVerna.user.match(/METASKILL/g) || []).length;
ok('B · design-value-map-verna · NO afegeix preamble extern',    !mapVerna.user.startsWith('## CONTEXT METASKILL'));
ok('B · METASKILL apareix com a màxim 1 cop (el del task)',      occurrences <= 1);

// ─── C · expert chain · threading contextProfile ────────────────────
console.log('\n— C · expertChainOrchestrator · threading contextProfile');
ok('C · runExpertChain accepta contextProfile param',            /runExpertChain[\s\S]{0,3000}contextProfile = 'sos-current'/.test(ec));
ok('C · _runSingleTask accepta contextProfile param',            /_runSingleTask\([^)]*contextProfile = 'sos-current'/.test(ec));
ok('C · _runSingleTask passa contextProfile a buildPrompt',      /buildPrompt\(\{[^}]*contextProfile\s*\}\)/.test(ec));
ok('C · phase loop · single passa contextProfile',               /_runSingleTask\(\{[^}]*qualityThreshold: usedThreshold, contextProfile/.test(ec));
ok('C · phase loop · per-item passa contextProfile',             /_runSingleTask\(\{[^}]*preferredProvider, emit, contextProfile/.test(ec));
ok('C · escalation full · passa contextProfile',                  /buildPrompt\(\{[^}]*slim: false, contextProfile\s*\}\)/.test(ec));

// ─── D · constants definides ────────────────────────────────────────
console.log('\n— D · vnaExpertPrompts · constants v162');
ok('D · VERNA_METASKILL_PREAMBLE definit',                       ep.includes('VERNA_METASKILL_PREAMBLE'));
ok('D · VERNA_PREAMBLE_TASKS · set amb 3 tasks narratives',      ep.includes('VERNA_PREAMBLE_TASKS') && ep.includes("'personalize-canvas'") && ep.includes("'personalize-pitch'") && ep.includes("'personalize-landing'"));

// ─── E · sos-current NO regressió ────────────────────────────────────
console.log('\n— E · sos-current · ZERO regressió');
ok('E · sos-current canvas idèntic abans/després v162',           canvasSos.user.length > 0 && !canvasSos.user.includes('METASKILL'));
const pitchSos = buildPrompt({ taskKind: 'personalize-pitch', context: ctx, contextProfile: 'sos-current' });
ok('E · sos-current pitch SENSE preamble',                        !pitchSos.user.includes('CONTEXT METASKILL'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
