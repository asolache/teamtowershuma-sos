// =============================================================================
// TEAMTOWERS SOS V11 — VALUE MAP · DELIVERABLE FLOW ANIMATION PREP · TDD (v123)
// Ruta · /js/tests/mapDeliverableFlowPrep.test.js
//
// Feature @alvaro · /map · prep per a animació de flux d'entregables entre
// rols (no només pulsos genèrics). Inclou ·
//   ─ nodeMap resilient · fallback DOM (cx/cy o translate) si datum no té x/y
//   ─ pulseStyle ∈ 'dot' | 'deliverable' (amb label) | 'glow'
//   ─ pulseNode(id) · API pública per a single-pulse extern (bridge neural)
//   ─ listener sos:neural-step · pulse de node segons step.kind
// =============================================================================

import fs from 'node:fs';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== VALUE MAP · DELIVERABLE FLOW ANIMATION PREP (v123) ===\n');

const vmSrc  = fs.readFileSync(new URL('../views/ValueMapView.js', import.meta.url), 'utf8');
const npSrc  = fs.readFileSync(new URL('../core/neuralPathService.js', import.meta.url), 'utf8');

// ─── A · nodeMap resilient ────────────────────────────────────────────
console.log('— A · _buildNodeMap resilient · fallback DOM');
ok('A · helper _buildNodeMap existeix',           vmSrc.includes('_buildNodeMap(d3)'));
ok('A · llegeix d.x / d.y primer',                vmSrc.includes('Number.isFinite(d.x)'));
ok('A · fallback · cx/cy attribute',              vmSrc.includes("getAttribute('cx')"));
ok('A · fallback · transform translate',          vmSrc.includes('translate'));
ok('A · fallback · id també desde data-id/id',    vmSrc.includes("getAttribute('data-id')"));
ok('A · descarta entrades sense id+x+y',          vmSrc.includes('Number.isFinite(x) && Number.isFinite(y)'));

// ─── B · pulseStyle config ────────────────────────────────────────────
console.log('\n— B · pulseStyle · dot · deliverable · glow');
ok('B · _renderFlowPulse existeix',               vmSrc.includes('_renderFlowPulse(') && vmSrc.includes('pulseStyle'));
ok('B · style dot config',                        vmSrc.includes('dot:') && vmSrc.includes("color: '#a5b4fc'"));
ok('B · style deliverable config',                vmSrc.includes('deliverable:') && vmSrc.includes("color: '#fbbf24'"));
ok('B · style glow config',                       vmSrc.includes('glow:') && vmSrc.includes("color: '#22d3ee'"));
ok('B · deliverable inclou label amb name',       vmSrc.includes('del?.name || transaction.label || transaction.kind'));

// ─── C · pulseNode API pública ───────────────────────────────────────
console.log('\n— C · pulseNode(id) · single ring pulse');
ok('C · mètode pulseNode definit',                vmSrc.includes('pulseNode(nodeId,'));
ok('C · usa _buildNodeMap',                       vmSrc.includes('this._buildNodeMap(d3)'));
ok('C · crea ring sense fill (només stroke)',     vmSrc.includes("attr('fill', 'none')") && vmSrc.includes("'stroke'"));
ok('C · animació · radi creixent + opacity 0',    vmSrc.includes("attr('r', 36)") && vmSrc.includes("attr('opacity', 0)"));
ok('C · returns true/false (silent no-op)',       vmSrc.includes('return false') && vmSrc.includes('return true'));

// ─── D · neural-step bridge ───────────────────────────────────────────
console.log('\n— D · listener sos:neural-step · bridge map ↔ neural path');
ok('D · listener neural registrat a afterRender', vmSrc.includes("window.addEventListener('sos:neural-step'"));
ok('D · color depèn de step.kind (edit/ai-fill/create)',
   vmSrc.includes("step.content.kind === 'edit'") && vmSrc.includes("step.content.kind === 'ai-fill'"));
ok('D · feature flag state.neuralBridge (off per defecte)', vmSrc.includes('state.neuralBridge'));

// ─── E · appendStep emet event ────────────────────────────────────────
console.log('\n— E · neuralPathService emet "sos:neural-step"');
ok('E · CustomEvent dispatched post-upsert',      npSrc.includes("new CustomEvent('sos:neural-step'"));
ok('E · detail = step',                           npSrc.includes('detail: step'));
ok('E · guard typeof window',                     npSrc.includes("typeof window !== 'undefined'"));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
