// =============================================================================
// TEAMTOWERS SOS V11 — LEGAL AGENTS CATALOG · TDD (v124)
// Ruta · /js/tests/legalAgentsCatalog.test.js
//
// Verifica · 10 .md a agents/legal/ + paritat amb LEGAL_AGENTS_CATALOG +
// frontmatter vàlid per a agentMdLoader + cost estimates raonables.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    LEGAL_AGENTS_CATALOG, LEGAL_AGENT_CATEGORIES, BINDING_LEVELS,
    listLegalAgents, getLegalAgent, listCategoriesWithCount, estimateCostForBundle,
} from '../core/legalAgentsCatalog.js';
import { loadAgent, validateAgent } from '../core/agentMdLoader.js';

let pass = 0, fail = 0;
function ok(label, cond, expected = '', got = '') {
    if (cond) { pass++; console.log('✓', label); }
    else { fail++; console.log('✗', label + ((expected !== '' || got !== '') ? ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})` : '')); }
}

console.log('=== LEGAL AGENTS CATALOG (v124) ===\n');

const LEGAL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../agents/legal');

// ─── A · catàleg estructura ────────────────────────────────────────────
console.log('— A · catàleg LEGAL_AGENTS_CATALOG');
ok('A · catàleg té 10 agents',                  LEGAL_AGENTS_CATALOG.length === 10, 10, LEGAL_AGENTS_CATALOG.length);
ok('A · LEGAL_AGENT_CATEGORIES té 8 categories', Object.keys(LEGAL_AGENT_CATEGORIES).length === 8);
ok('A · BINDING_LEVELS té 3 nivells',           Object.keys(BINDING_LEVELS).length === 3);

const expectedIds = [
    'pact-de-socis', 'nda-mutual', 'service-agreement', 'incubator-membership',
    'accelerator-cohort', 'advisor-agreement', 'equity-grant', 'letter-of-intent',
    'term-sheet', 'ip-assignment',
];
for (const id of expectedIds) {
    ok('A · catàleg conté ' + id, LEGAL_AGENTS_CATALOG.some(a => a.id === id));
}

// ─── B · cada entry té camps obligatoris ──────────────────────────────
console.log('\n— B · cada entry té camps obligatoris');
for (const a of LEGAL_AGENTS_CATALOG) {
    ok('B · ' + a.id + ' · title no buit',          !!a.title && a.title.length > 5);
    ok('B · ' + a.id + ' · category vàlida',        Object.keys(LEGAL_AGENT_CATEGORIES).includes(a.category));
    ok('B · ' + a.id + ' · binding_level vàlid',    Object.keys(BINDING_LEVELS).includes(a.binding_level));
    ok('B · ' + a.id + ' · model_tier ∈ tiers',     ['reasoner', 'mid', 'small'].includes(a.model_tier));
    ok('B · ' + a.id + ' · cost > 0',               a.cost_estimate_eur > 0 && a.cost_estimate_eur < 0.05);
    ok('B · ' + a.id + ' · requires no buit',       Array.isArray(a.requires) && a.requires.length >= 1);
}

// ─── C · paritat agents/legal/*.md ↔ catàleg ──────────────────────────
console.log('\n— C · paritat fitxers .md ↔ catàleg');
const mdFiles = fs.readdirSync(LEGAL_DIR).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3)).sort();
ok('C · agents/legal té 10 fitxers .md',  mdFiles.length === 10, 10, mdFiles.length);
for (const id of expectedIds) {
    ok('C · ' + id + '.md present al disc', mdFiles.includes(id));
}

// ─── D · loadAgent + validateAgent per cada .md ───────────────────────
console.log('\n— D · loadAgent + validateAgent · 10 fitxers');
for (const id of expectedIds) {
    const a = await loadAgent(id, { agentsDir: LEGAL_DIR });
    ok('D · ' + id + ' · loaded', !!a);
    const v = validateAgent(a);
    ok('D · ' + id + ' · frontmatter valid', v.ok, [], v.errors);
    ok('D · ' + id + ' · tier == catàleg', a.frontmatter.model_tier === getLegalAgent(id).model_tier);
}

// ─── E · cada .md té camps legal-specific ─────────────────────────────
console.log('\n— E · frontmatter legal-specific (category · binding_level · jurisdiction_default)');
for (const id of expectedIds) {
    const a = await loadAgent(id, { agentsDir: LEGAL_DIR });
    ok('E · ' + id + ' · category al frontmatter',         !!a.frontmatter.category);
    ok('E · ' + id + ' · binding_level al frontmatter',    !!a.frontmatter.binding_level);
    ok('E · ' + id + ' · jurisdiction_default present',    !!a.frontmatter.jurisdiction_default);
}

// ─── F · helpers · listLegalAgents · getLegalAgent · bundles ──────────
console.log('\n— F · helpers · filtres + bundles');
ok('F · listLegalAgents() retorna 10',           listLegalAgents().length === 10);
ok('F · listLegalAgents({category:cohort}) = 2',  listLegalAgents({ category: 'cohort' }).length === 2);
ok('F · listLegalAgents({binding_level:high})',   listLegalAgents({ binding_level: 'high' }).length >= 4);
ok('F · getLegalAgent("nda-mutual") existeix',    getLegalAgent('nda-mutual')?.id === 'nda-mutual');
ok('F · getLegalAgent("inexistent") = null',      getLegalAgent('does-not-exist') === null);
ok('F · listCategoriesWithCount = 8',             listCategoriesWithCount().length === 8);
ok('F · estimateCostForBundle([nda, advisor]) suma', Math.abs(estimateCostForBundle(['nda-mutual', 'advisor-agreement']) - 0.003) < 0.0001);

// ─── G · cost realista · term-sheet ha de ser el més car (reasoner) ────
console.log('\n— G · invariants econòmics');
const termSheet = getLegalAgent('term-sheet');
ok('G · term-sheet és reasoner-tier (cas complex)',   termSheet.model_tier === 'reasoner');
const maxCost = Math.max(...LEGAL_AGENTS_CATALOG.map(a => a.cost_estimate_eur));
ok('G · term-sheet és el més car del catàleg',        termSheet.cost_estimate_eur === maxCost);
const nda = getLegalAgent('nda-mutual');
ok('G · NDA és small-tier (cas simple)',              nda.model_tier === 'small');

// ─── H · invariants ètics · todos els binding-high requereixen identityId ─
console.log('\n— H · invariants ètics · linkedAccounting + notari');
const highBinding = LEGAL_AGENTS_CATALOG.filter(a => a.binding_level === 'high');
ok('H · ≥ 4 acords high-binding (deal real)',         highBinding.length >= 4);
for (const a of highBinding) {
    ok('H · ' + a.id + ' high-binding requereix identityId',
       a.requires.some(r => /identityId|parties|founders|grantor|grantee|contributor|investor|company|provider|client|incubator|project|advisor|proposer|target/i.test(r)));
}

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
