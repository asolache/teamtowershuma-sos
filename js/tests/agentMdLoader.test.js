// =============================================================================
// TEAMTOWERS SOS V11 — AGENT.md LOADER · TDD (v122 · wo-agent-md-pattern)
// Ruta · /js/tests/agentMdLoader.test.js
// =============================================================================

import { parseAgentSource, loadAgent, listAgents, validateAgent, __test_helpers__ } from '../core/agentMdLoader.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let pass = 0, fail = 0;
function ok(label, cond, expected = '', got = '') {
    if (cond) { pass++; console.log('✓', label); }
    else {
        fail++;
        const detail = (expected !== '' || got !== '') ? ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})` : '';
        console.log('✗', label + detail);
    }
}

const AGENTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../agents');

console.log('=== AGENT.md LOADER · v122 ===\n');

// ─── A · parseAgentSource · frontmatter + body ────────────────────────
console.log('— A · parseAgentSource · parser bàsic');
{
    const src = `---
id: test-agent
version: v0.1
model_tier: mid
cost_estimate_eur: 0.003
tags: [a, b, c]
---

## Body

Hola món.`;
    const { frontmatter, body } = parseAgentSource(src);
    ok('A · id parsed',                    frontmatter.id === 'test-agent');
    ok('A · version parsed',               frontmatter.version === 'v0.1');
    ok('A · model_tier parsed',            frontmatter.model_tier === 'mid');
    ok('A · cost_estimate_eur is number',  typeof frontmatter.cost_estimate_eur === 'number' && frontmatter.cost_estimate_eur === 0.003);
    ok('A · tags is array de 3',           Array.isArray(frontmatter.tags) && frontmatter.tags.length === 3);
    ok('A · body conté ## Body',           body.includes('## Body'));
    ok('A · body conté text del cos',      body.includes('Hola món'));
}

// ─── B · _parseScalar · types ─────────────────────────────────────────
console.log('\n— B · _parseScalar · types');
const { _parseScalar } = __test_helpers__;
ok('B · "true" → boolean',          _parseScalar('true') === true);
ok('B · "false" → boolean',         _parseScalar('false') === false);
ok('B · "42" → number',             _parseScalar('42') === 42);
ok('B · "0.005" → number',          _parseScalar('0.005') === 0.005);
ok('B · "hello" → string',          _parseScalar('hello') === 'hello');
ok('B · "[a, b]" → array',          JSON.stringify(_parseScalar('[a, b]')) === '["a","b"]');
ok('B · "[]" → empty array',        JSON.stringify(_parseScalar('[]')) === '[]');
ok('B · "\'quoted\'" → string',     _parseScalar("'quoted'") === 'quoted');

// ─── C · loadAgent · llegeix agents reals ──────────────────────────────
console.log('\n— C · loadAgent · 8 agents reals de la cadena');
const CHAIN_AGENTS = [
    'define-product-service',
    'personalize-canvas',
    'personalize-pitch',
    'personalize-landing',
    'design-value-map-rich',
    'generate-socs-from-value-map',
    'generate-sops-with-skills',
    'generate-wos-from-sop',
];
for (const id of CHAIN_AGENTS) {
    const a = await loadAgent(id, { agentsDir: AGENTS_DIR });
    ok('C · ' + id + ' · loaded',           !!a);
    ok('C · ' + id + ' · frontmatter.id matches', a.frontmatter.id === id);
    ok('C · ' + id + ' · body present',     a.body && a.body.length > 200);
}

// ─── D · validateAgent · contracte ─────────────────────────────────────
console.log('\n— D · validateAgent · check del contracte');
for (const id of CHAIN_AGENTS) {
    const a = await loadAgent(id, { agentsDir: AGENTS_DIR });
    const v = validateAgent(a);
    ok('D · ' + id + ' · valid', v.ok, [], v.errors);
}

// invalid · missing model_tier
const badV = validateAgent({ frontmatter: { id: 'x', version: 'v1', routing: 'sop-structured', expected_output: 'json' }, body: 'x'.repeat(60) });
ok('D · invalid (missing model_tier) detectat', !badV.ok && badV.errors.some(e => e.includes('model_tier')));

// invalid tier
const badT = validateAgent({ frontmatter: { id: 'x', version: 'v1', model_tier: 'huge', routing: 'sop-structured', expected_output: 'json' }, body: 'x'.repeat(60) });
ok('D · invalid model_tier detectat', !badT.ok && badT.errors.some(e => e.includes('invalid model_tier')));

// ─── E · listAgents · enumeració ───────────────────────────────────────
console.log('\n— E · listAgents · enumera agents/*.md');
const ids = await listAgents({ agentsDir: AGENTS_DIR });
ok('E · 8 agents llistats',            ids.length === 8, 8, ids.length);
for (const id of CHAIN_AGENTS) {
    ok('E · ' + id + ' present a la llista', ids.includes(id));
}
ok('E · AGENTS.md NO inclós',          !ids.includes('AGENTS'));

// ─── F · CHAIN_PHASES ↔ agents/ paritat ───────────────────────────────
console.log('\n— F · paritat agents/ ↔ CHAIN_PHASES (expertChainOrchestrator)');
const { CHAIN_PHASES } = await import('../core/expertChainOrchestrator.js');
for (const phase of CHAIN_PHASES) {
    ok('F · CHAIN_PHASE ' + phase.taskKind + ' té agent .md',
       ids.includes(phase.taskKind));
}

// ─── G · convenció · cada agent té el seu tier alineat amb promptTierRouter ─
console.log('\n— G · paritat tier · agent.md ↔ promptTierRouter');
const { pickTier } = await import('../core/promptTierRouter.js');
for (const id of CHAIN_AGENTS) {
    const a = await loadAgent(id, { agentsDir: AGENTS_DIR });
    const routerTier = pickTier(id);
    ok('G · ' + id + ' · tier coincideix (router=' + routerTier + ', md=' + a.frontmatter.model_tier + ')',
       a.frontmatter.model_tier === routerTier);
}

// ─── H · AGENTS.md doc present ─────────────────────────────────────────
console.log('\n— H · AGENTS.md doc de convenció');
import fs from 'node:fs';
const agentsDoc = fs.existsSync(path.join(AGENTS_DIR, 'AGENTS.md'));
ok('H · agents/AGENTS.md existeix', agentsDoc);
if (agentsDoc) {
    const docSrc = fs.readFileSync(path.join(AGENTS_DIR, 'AGENTS.md'), 'utf8');
    ok('H · doc menciona "AGENT.md"',         docSrc.includes('AGENT.md'));
    ok('H · doc menciona MCP',                docSrc.includes('MCP'));
    ok('H · doc llista les 8 phases',         CHAIN_AGENTS.every(id => docSrc.includes(id)));
}

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
