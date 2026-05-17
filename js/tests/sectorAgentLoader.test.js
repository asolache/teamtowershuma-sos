// =============================================================================
// TEAMTOWERS SOS V11 — SECTOR AGENT LOADER + CNAE AUDIT · TDD (v131)
// Ruta · /js/tests/sectorAgentLoader.test.js
//
// Verifica · CNAE-2009 Espanya canonical mapping + 21 sector files + loader
// (NO injecta rols mal-mapejats per evitar contaminació del prompt VNA).
// =============================================================================

import fs from 'node:fs';
import {
    CANONICAL_CNAE_MAPPING, CANONICAL_SECTOR_IDS, ROLE_STATUS_INJECTABLE,
    parseSectorAgentSource, validateSectorAgent, loadSectorAgent, listSectorAgents,
    buildSectorContextBlock, auditCnaeAlignment, getCanonicalCnaeMapping,
    __test_helpers__,
} from '../core/sectorAgentLoader.js';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== SECTOR AGENT LOADER + CNAE AUDIT (v131) ===\n');

// ─── A · canonical CNAE-2009 mapping ────────────────────────────────────
console.log('— A · canonical CNAE-2009 Espanya mapping');
ok('A · 21 sectors A-U',                       CANONICAL_SECTOR_IDS.length === 21);
ok('A · A = Agricultura · 01-03',              CANONICAL_CNAE_MAPPING.A.cnae === '01-03');
ok('A · K = Financieras · 64-66',              CANONICAL_CNAE_MAPPING.K.cnae === '64-66' && CANONICAL_CNAE_MAPPING.K.name.includes('Financieras'));
ok('A · L = Inmobiliarias · 68',               CANONICAL_CNAE_MAPPING.L.cnae === '68' && CANONICAL_CNAE_MAPPING.L.name.includes('Inmobiliarias'));
ok('A · M = Profesionales · 69-75',            CANONICAL_CNAE_MAPPING.M.cnae === '69-75' && CANONICAL_CNAE_MAPPING.M.name.includes('Profesionales'));
ok('A · N = Administrativas · 77-82',          CANONICAL_CNAE_MAPPING.N.cnae === '77-82');
ok('A · P = Educación · 85',                   CANONICAL_CNAE_MAPPING.P.cnae === '85' && CANONICAL_CNAE_MAPPING.P.name === 'Educación');
ok('A · Q = Sanitarias · 86-88',               CANONICAL_CNAE_MAPPING.Q.cnae === '86-88' && CANONICAL_CNAE_MAPPING.Q.name.includes('Sanitarias'));
ok('A · R = Artísticas · 90-93',               CANONICAL_CNAE_MAPPING.R.cnae === '90-93' && CANONICAL_CNAE_MAPPING.R.name.includes('Artísticas'));
ok('A · S = Otros · 94-96',                    CANONICAL_CNAE_MAPPING.S.cnae === '94-96');

// ─── B · ROLE_STATUS_INJECTABLE · constants ────────────────────────────
console.log('\n— B · ROLE_STATUS constants');
ok('B · canonical injectable',                  ROLE_STATUS_INJECTABLE.includes('canonical'));
ok('B · canonical-partial injectable',          ROLE_STATUS_INJECTABLE.includes('canonical-partial'));
ok('B · legacy-scope-overlap injectable',       ROLE_STATUS_INJECTABLE.includes('legacy-scope-overlap'));
ok('B · legacy-mismatch NO injectable',         !ROLE_STATUS_INJECTABLE.includes('legacy-mismatch'));

// ─── C · parseFrontmatter · pure ───────────────────────────────────────
console.log('\n— C · parseFrontmatter');
{
    const sample = `---
sector_id: K
sector_name: "Activitats Financeres"
cnae: "64-66"
tags: [finanzas, banca, seguros]
roles:
  - id: cfo
    name: "CFO"
    castell_level: pom_de_dalt
---
`;
    const { frontmatter, body, roles } = parseSectorAgentSource(sample);
    ok('C · sector_id = K',                    frontmatter.sector_id === 'K');
    ok('C · cnae = "64-66"',                   frontmatter.cnae === '64-66');
    ok('C · tags array',                       Array.isArray(frontmatter.tags) && frontmatter.tags.length === 3);
    ok('C · roles parsejats',                  Array.isArray(roles) && roles.length === 1 && roles[0].id === 'cfo');
    ok('C · role.castell_level capturat',      roles[0].castell_level === 'pom_de_dalt');
}

// ─── D · validateSectorAgent · check canonical ─────────────────────────
console.log('\n— D · validateSectorAgent');
{
    const valid = { frontmatter: { sector_id: 'K', sector_name: 'X', cnae: '64-66', version: 'v131' } };
    ok('D · valid · K · cnae match',           validateSectorAgent(valid).ok);
}
{
    const invalid = { frontmatter: { sector_id: 'K', sector_name: 'X', cnae: '68', version: 'v131' } };
    const v = validateSectorAgent(invalid);
    ok('D · invalid · K amb cnae 68 (L)',      !v.ok && v.errors.some(e => e.includes('cnae mismatch')));
}
{
    const unknown = { frontmatter: { sector_id: 'ZZ', sector_name: 'X', cnae: '99', version: 'v131' } };
    ok('D · unknown sector_id detected',       !validateSectorAgent(unknown).ok);
}

// ─── E · loadSectorAgent · fitxers reals ───────────────────────────────
console.log('\n— E · loadSectorAgent · fitxers reals');
for (const id of ['K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'F']) {
    const a = await loadSectorAgent(id);
    ok('E · ' + id + ' · loaded',              !!a);
    ok('E · ' + id + ' · valid (post-v131 fix)', a.valid);
    if (CANONICAL_CNAE_MAPPING[id]) {
        ok('E · ' + id + ' · cnae match canonical',
           a.frontmatter.cnae === CANONICAL_CNAE_MAPPING[id].cnae);
    }
}

// ─── F · rolesInjectable · evita contaminació ──────────────────────────
console.log('\n— F · rolesInjectable · anti-contaminació');
{
    const kAgent = await loadSectorAgent('K');
    ok('F · K · rolesInjectable=false (legacy-mismatch)',     kAgent.rolesInjectable === false);
    ok('F · K · rolesStatus = legacy-mismatch',                kAgent.rolesStatus === 'legacy-mismatch');
}
{
    const lAgent = await loadSectorAgent('L');
    ok('F · L · rolesInjectable=false (legacy-mismatch)',     lAgent.rolesInjectable === false);
}
{
    const fAgent = await loadSectorAgent('F');
    ok('F · F · rolesInjectable=true (canonical)',             fAgent.rolesInjectable === true);
}
{
    const pAgent = await loadSectorAgent('P');
    ok('F · P · rolesInjectable=true (canonical-partial)',     pAgent.rolesInjectable === true);
    ok('F · P · rolesStatus = canonical-partial',              pAgent.rolesStatus === 'canonical-partial');
}

// ─── G · buildSectorContextBlock · output complementari ───────────────
console.log('\n— G · buildSectorContextBlock · text per al prompt');
{
    const fAgent = await loadSectorAgent('F');
    const block = buildSectorContextBlock(fAgent);
    ok('G · F · bloc inclou sector_name',     block.includes('Construcción'));
    ok('G · F · bloc inclou CNAE F · 41-43',  block.includes('41-43'));
    ok('G · F · bloc inclou rols (injectable)', block.includes('Rols arquetip canonical'));
}
{
    const kAgent = await loadSectorAgent('K');
    const block = buildSectorContextBlock(kAgent);
    ok('G · K · bloc inclou sector_name correct (Financieras)', block.includes('Financieras'));
    ok('G · K · bloc inclou CNAE 64-66',      block.includes('64-66'));
    ok('G · K · bloc NO injecta rols (legacy-mismatch)', !block.includes('Rols arquetip canonical') && block.includes('migrant a v131b'));
}

// ─── H · listSectorAgents · enumeració completa ────────────────────────
console.log('\n— H · listSectorAgents · enumeració');
const all = await listSectorAgents();
ok('H · 21 sectors carregats',                all.length === 21);
ok('H · tots els canonical sectors presents',  CANONICAL_SECTOR_IDS.slice(0, -1).every(id => all.some(a => a.sectorId === id)));   // U vs UV
const mismatch = await listSectorAgents({ statusFilter: 'legacy-mismatch' });
ok('H · 6 fitxers amb legacy-mismatch (K·L·M·N·Q·R)', mismatch.length === 6);

// ─── I · auditCnaeAlignment · CI-friendly ──────────────────────────────
console.log('\n— I · auditCnaeAlignment · CI report');
const report = await auditCnaeAlignment();
ok('I · report.total = 21',                   report.total === 21);
ok('I · report.canonical >= 8',               report.canonical >= 8);
ok('I · report.mismatch = 6',                 report.mismatch === 6);
ok('I · report.errors buit (post-v131)',      report.errors.length === 0);

// ─── J · construction.md orfe ELIMINAT ─────────────────────────────────
console.log('\n— J · neteja · construction.md orfe eliminat');
ok('J · construction.md NO existeix',          !fs.existsSync(new URL('../../knowledge/sectors/construction.md', import.meta.url)));

// ─── K · getCanonicalCnaeMapping accessor ──────────────────────────────
console.log('\n— K · getCanonicalCnaeMapping');
ok('K · accessor retorna mateix mapping',      getCanonicalCnaeMapping() === CANONICAL_CNAE_MAPPING);

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
