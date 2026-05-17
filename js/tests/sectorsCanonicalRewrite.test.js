// =============================================================================
// TEAMTOWERS SOS V11 — SECTORS CANONICAL REWRITE + WIRE-UP · TDD (v131b)
// Ruta · /js/tests/sectorsCanonicalRewrite.test.js
//
// Verifica · 6 sectors rewritten amb contingut canonical (K · L · M · N · Q · R)
// + skill_levels per role + sops_canonical + wire-up al vnaExpertPrompts +
// expertChainOrchestrator + status canonical post-v131b.
// =============================================================================

import fs from 'node:fs';
import { loadSectorAgent, auditCnaeAlignment, buildSectorContextBlock } from '../core/sectorAgentLoader.js';
import { buildPrompt } from '../core/vnaExpertPrompts.js';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== SECTORS CANONICAL REWRITE + WIRE-UP (v131b) ===\n');

// ─── A · 6 sectors crítics ara són canonical ────────────────────────────
console.log('— A · 6 sectors rewritten · status canonical');
for (const id of ['K', 'L', 'M', 'N', 'Q', 'R']) {
    const a = await loadSectorAgent(id);
    ok('A · ' + id + ' · status = canonical (post-v131b)',  a.rolesStatus === 'canonical');
    ok('A · ' + id + ' · rolesInjectable = true',           a.rolesInjectable === true);
    ok('A · ' + id + ' · té roles >= 6',                    (a.roles?.length || 0) >= 6);
}

// ─── B · audit · 0 mismatch post-v131b ────────────────────────────────
console.log('\n— B · audit · zero legacy-mismatch post-v131b');
const report = await auditCnaeAlignment();
ok('B · report.mismatch === 0 (eliminat)',                  report.mismatch === 0);
ok('B · report.canonical >= 14 (J + F + 6 nous + altres)',  report.canonical >= 14);
ok('B · report.errors === 0',                               report.errors.length === 0);

// ─── C · skill_levels declarat per role ────────────────────────────────
console.log('\n— C · skill_levels taxonomy + per-role');
for (const id of ['K', 'L', 'M', 'N', 'Q', 'R']) {
    const raw = fs.readFileSync(new URL('../../knowledge/sectors/' + id + '.md', import.meta.url), 'utf8');
    ok('C · ' + id + '.md · skill_level_taxonomy block', raw.includes('skill_level_taxonomy:'));
    ok('C · ' + id + '.md · junior/mid/senior/principal levels',
       raw.includes('junior:') && raw.includes('mid:') && raw.includes('senior:') && raw.includes('principal:'));
    ok('C · ' + id + '.md · almenys 3 roles tenen skill_levels',
       (raw.match(/skill_levels:/g) || []).length >= 4);   // taxonomy + 3+ roles
}

// ─── D · SOPs canonical per sector ─────────────────────────────────────
console.log('\n— D · sops_canonical block');
for (const id of ['K', 'L', 'M', 'N', 'Q', 'R']) {
    const raw = fs.readFileSync(new URL('../../knowledge/sectors/' + id + '.md', import.meta.url), 'utf8');
    ok('D · ' + id + '.md · sops_canonical block',           raw.includes('sops_canonical:'));
    ok('D · ' + id + '.md · ≥ 4 SOPs declarats',             (raw.match(/^  - id: sop-/gm) || []).length >= 4);
    ok('D · ' + id + '.md · SOPs tenen castell_level',       /^    castell_level: /m.test(raw));
}

// ─── E · J.md actualitzat amb tags tech (post-K migration) ─────────────
console.log('\n— E · J.md · migració K-tech consolidada');
{
    const j = await loadSectorAgent('J');
    ok('E · J · status = canonical',                         j.rolesStatus === 'canonical');
    ok('E · J · tags inclou software/SaaS/IT-consulting',
       (j.frontmatter.tags || []).join(',').includes('software'));
    ok('E · J · canonical_archetypes_source menciona consolidació K legacy',
       (j.frontmatter.canonical_archetypes_source || '').toLowerCase().includes('k'));
}

// ─── F · wire-up · buildPrompt accepta sectorContext ───────────────────
console.log('\n— F · buildPrompt · sectorContext injectat');
const qAgent = await loadSectorAgent('Q');
const qBlock = buildSectorContextBlock(qAgent);
ok('F · buildSectorContextBlock Q · output > 200 chars',     qBlock.length > 200);
ok('F · Q block · inclou Sanitarias + 86-88 + roles',         qBlock.includes('Sanitarias') && qBlock.includes('86-88') && qBlock.includes('Director'));

const promptWithSector = buildPrompt({
    taskKind: 'design-value-map-rich',
    context: {
        name: 'Hospital Test', description: 'Hospital amb urgències i UCI',
        sector: 'Q', vna_zoom: 'mid', sectorContext: qBlock,
    },
});
ok('F · prompt inclou "CONTEXT SECTORIAL CNAE-2009"',         promptWithSector.user.includes('CONTEXT SECTORIAL CNAE-2009'));
ok('F · prompt inclou bloc Q sectorContext',                   promptWithSector.user.includes('86-88'));
ok('F · prompt inclou els rols del sector',                    promptWithSector.user.includes('Director'));

// Sense sectorContext · no afegeix el bloc
const promptNoSector = buildPrompt({
    taskKind: 'design-value-map-rich',
    context: { name: 'X', description: 'd', sector: 'Q', vna_zoom: 'mid' },
});
ok('F · sense sectorContext · no inclou el bloc',              !promptNoSector.user.includes('CONTEXT SECTORIAL CNAE-2009'));

// ─── G · expertChainOrchestrator · wire-up ─────────────────────────────
console.log('\n— G · expertChainOrchestrator · sector loader integrat');
const orchSrc = fs.readFileSync(new URL('../core/expertChainOrchestrator.js', import.meta.url), 'utf8');
ok('G · orchestrator · import sectorAgentLoader',             orchSrc.includes("await import('./sectorAgentLoader.js')"));
ok('G · orchestrator · crida loadSectorAgent(context.sector)', /loadSectorAgent\(context\.sector\)/.test(orchSrc));
ok('G · orchestrator · emet sector-context event',             orchSrc.includes("emit('sector-context'"));
ok('G · orchestrator · injecta sectorContext al phase 5',      orchSrc.includes('c.sectorContext = baseCtx.sectorContext'));

// ─── H · K legacy tech content NO al K.md (post-rewrite) ───────────────
console.log('\n— H · K legacy tech content eliminat de K.md');
{
    const k = await loadSectorAgent('K');
    const rolesNames = (k.roles || []).map(r => r.name || r.id).join(' · ');
    ok('H · K.md · NO conté roles "generador-problema-usuario" (legacy tech)',
       !rolesNames.includes('generador-problema-usuario'));
    ok('H · K.md · conté roles financeres (CFO · CIO · Portfolio · Risk)',
       /CFO|CIO|Portfolio|Risk|Underwriter|Suscriptor/i.test(rolesNames));
}

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
