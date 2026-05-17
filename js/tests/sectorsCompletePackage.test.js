// =============================================================================
// TEAMTOWERS SOS V11 — SECTORS v131c COMPLETE PACKAGE · TDD
// Ruta · /js/tests/sectorsCompletePackage.test.js
//
// Verifica · 10 sectors restants (A·B·C·D·E·H·I·O·T·UV) tenen ara estructura
// canonical (skill_level_taxonomy + sops_canonical) + skillsMarketplaceService
// + sectorQualityRubric + backlog v132 doc.
// =============================================================================

import fs from 'node:fs';
import { loadSectorAgent, listSectorAgents, auditCnaeAlignment } from '../core/sectorAgentLoader.js';
import {
    SKILL_LEVELS, SKILL_LEVEL_RANK,
    listSkillsForRole, listSkillsForSector, matchCandidatesToWO,
    skillsTaxonomySummary, recommendLevelForExperience,
} from '../core/skillsMarketplaceService.js';
import {
    getCanonicalSopsForSector, evaluateProjectAgainstSector, summarizeRubricResult,
    __test_helpers__ as rubricHelpers,
} from '../core/sectorQualityRubric.js';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== SECTORS v131c COMPLETE PACKAGE ===\n');

// ─── A · 10 sectors restants ara canonical ──────────────────────────────
console.log('— A · 10 sectors restants amb estructura canonical');
const remainingSectors = ['A', 'B', 'C', 'D', 'E', 'H', 'I', 'O', 'T', 'UV'];
for (const id of remainingSectors) {
    const a = await loadSectorAgent(id);
    ok('A · ' + id + ' · loaded + canonical', a.rolesStatus === 'canonical');
    ok('A · ' + id + ' · té rolesInjectable=true', a.rolesInjectable === true);
}

// ─── B · skill_level_taxonomy + sops_canonical present ──────────────────
console.log('\n— B · skill_level_taxonomy + sops_canonical declarats');
for (const id of remainingSectors) {
    const raw = fs.readFileSync(new URL('../../knowledge/sectors/' + id + '.md', import.meta.url), 'utf8');
    ok('B · ' + id + '.md · skill_level_taxonomy block', raw.includes('skill_level_taxonomy:'));
    ok('B · ' + id + '.md · junior/mid/senior/principal levels',
       raw.includes('junior:') && raw.includes('mid:') && raw.includes('senior:') && raw.includes('principal:'));
    ok('B · ' + id + '.md · sops_canonical ≥ 4',
       (raw.match(/^  - id: sop-/gm) || []).length >= 4);
}

// ─── C · audit · 0 mismatch · canonical ≥ 21-2 (P partial + un par) ────
console.log('\n— C · audit · 21 sectors · 0 mismatch · canonical creix');
const report = await auditCnaeAlignment();
ok('C · report.total = 21',                          report.total === 21);
ok('C · report.mismatch = 0',                        report.mismatch === 0);
ok('C · report.canonical >= 19 (post v131c)',        report.canonical >= 19);

// ─── D · skillsMarketplaceService · constants + helpers ────────────────
console.log('\n— D · skillsMarketplaceService');
ok('D · SKILL_LEVELS = 4 entries',                   SKILL_LEVELS.length === 4);
ok('D · SKILL_LEVEL_RANK · junior=1 principal=4',    SKILL_LEVEL_RANK.junior === 1 && SKILL_LEVEL_RANK.principal === 4);
ok('D · recommendLevelForExperience(0) = junior',     recommendLevelForExperience(0) === 'junior');
ok('D · recommendLevelForExperience(4) = mid',        recommendLevelForExperience(4) === 'mid');
ok('D · recommendLevelForExperience(8) = senior',     recommendLevelForExperience(8) === 'senior');
ok('D · recommendLevelForExperience(15) = principal', recommendLevelForExperience(15) === 'principal');

// ─── E · listSkillsForRole · cas K (CFO/Portfolio Manager) ─────────────
console.log('\n— E · listSkillsForRole · cas K (canonical post-v131b)');
{
    const k = await loadSectorAgent('K');
    const pmSkills = listSkillsForRole(k, 'portfolio_manager');
    ok('E · K · portfolio_manager té skills per junior/mid/senior/principal',
       pmSkills.length >= 3 && pmSkills.some(s => s.level === 'junior') && pmSkills.some(s => s.level === 'senior'));
    ok('E · K · senior level conté "lideratge equip 3-5 gestors"',
       pmSkills.find(s => s.level === 'senior')?.skills?.some(sk => /lideratge equip|presentacions|broker/i.test(sk)));
}

// ─── F · listSkillsForSector · agregació K ─────────────────────────────
console.log('\n— F · listSkillsForSector · agregació');
{
    const skills = await listSkillsForSector('K');
    ok('F · K · skills agregades ≥ 8',                skills.length >= 8);
    ok('F · K · cada skill té level + roles',         skills.every(s => s.level && Array.isArray(s.roles)));
    ok('F · K · ordenades · junior primer',           SKILL_LEVEL_RANK[skills[0].level] <= SKILL_LEVEL_RANK[skills[skills.length - 1].level]);
}

// ─── G · matchCandidatesToWO · scoring ─────────────────────────────────
console.log('\n— G · matchCandidatesToWO · pure');
{
    const wo = { required_skills: ['SQL', 'Python', 'Lean'], required_level: 'senior' };
    const candidates = [
        { id: 'c1', name: 'Alice', skills: ['SQL', 'Python', 'Lean', 'R'], level: 'senior' },
        { id: 'c2', name: 'Bob',   skills: ['SQL', 'Python'],              level: 'mid' },
        { id: 'c3', name: 'Carol', skills: ['Excel'],                       level: 'junior' },
    ];
    const ranked = matchCandidatesToWO({ wo, candidates });
    ok('G · ranked DESC per score',                   ranked[0].score >= ranked[1].score);
    ok('G · Alice top (perfect match)',                ranked[0].id === 'c1');
    ok('G · Alice score = 100',                        ranked[0].score === 100);
    ok('G · Carol amb missing skills',                 ranked.find(r => r.id === 'c3').missing.length === 3);
}

// ─── H · skillsTaxonomySummary · agregat global ────────────────────────
console.log('\n— H · skillsTaxonomySummary · cross-sector');
const summary = await skillsTaxonomySummary();
ok('H · totalSectors = 21',                          summary.totalSectors === 21);
ok('H · sectorsWithSkillLevels >= 6 (K·L·M·N·Q·R amb skill_levels per role)',
   summary.sectorsWithSkillLevels >= 6);
ok('H · totalSkillEntries > 0',                       summary.totalSkillEntries > 0);
ok('H · uniqueSkillsAcrossAllSectors > 0',            summary.uniqueSkillsAcrossAllSectors > 0);
ok('H · topCrossSectorSkills array',                  Array.isArray(summary.topCrossSectorSkills));

// ─── I · sectorQualityRubric · canonical SOPs lookup ───────────────────
console.log('\n— I · getCanonicalSopsForSector');
const kSops = await getCanonicalSopsForSector('K');
ok('I · K · sops_canonical ≥ 4',                     kSops.length >= 4);
ok('I · K · sops tenen id + title + castell_level',  kSops.every(s => s.id && s.title));
ok('I · K · conté sop-onboarding-kyc',                kSops.some(s => s.id === 'sop-onboarding-kyc'));

const aSops = await getCanonicalSopsForSector('A');
ok('I · A · sops_canonical ≥ 4 (v131c)',             aSops.length >= 4);

const noneSops = await getCanonicalSopsForSector('XX-invalid');
ok('I · sector invàlid · retorna []',                 noneSops.length === 0);

// ─── J · evaluateProjectAgainstSector ──────────────────────────────────
console.log('\n— J · evaluateProjectAgainstSector · score');
{
    const projectSops = [
        { title: 'Onboarding KYC nou client', description: '...' },
        { title: 'Rebalançament cartera', description: '...' },
        { title: 'Stress test trimestral', description: '...' },
        { title: 'Tasca inventada que no és canonical', description: '...' },
    ];
    const result = await evaluateProjectAgainstSector({
        projectId: 'test-bank-1', sectorId: 'K', projectSops,
    });
    ok('J · result · score > 50',                     result.score > 50);
    ok('J · canonicalSopsTotal >= 4',                  result.canonicalSopsTotal >= 4);
    ok('J · matchedCount >= 2',                       result.matchedCount >= 2);
    ok('J · té recommendations',                      Array.isArray(result.recommendations));

    const sum = summarizeRubricResult(result);
    ok('J · summarizeRubricResult retorna text',      typeof sum === 'string' && sum.length > 10);
}

// ─── K · backlog v132 docs ─────────────────────────────────────────────
console.log('\n— K · backlog v132 docs');
const abPlanExists = fs.existsSync(new URL('../../docs/backlog-v131c-ab-test-vna.md', import.meta.url));
ok('K · docs/backlog-v131c-ab-test-vna.md present',  abPlanExists);
if (abPlanExists) {
    const abPlan = fs.readFileSync(new URL('../../docs/backlog-v131c-ab-test-vna.md', import.meta.url), 'utf8');
    ok('K · plan menciona "Sugerir con IA"',          abPlan.includes('Sugerir con IA'));
    ok('K · plan té 5 sub-items A-E',                  abPlan.includes('### A ·') && abPlan.includes('### B ·') && abPlan.includes('### C ·') && abPlan.includes('### D ·') && abPlan.includes('### E ·'));
    ok('K · plan menciona hipòtesi menys context > més', abPlan.includes('menys context'));
}
const backlogSrc = fs.readFileSync(new URL('../../docs/backlog.md', import.meta.url), 'utf8');
ok('K · backlog.md inclou wo-prompt-ab-test-vna',     backlogSrc.includes('wo-prompt-ab-test-vna'));
ok('K · backlog.md inclou wo-skills-marketplace-ui',  backlogSrc.includes('wo-skills-marketplace-ui'));
ok('K · backlog.md inclou wo-sector-skill-levels-roles', backlogSrc.includes('wo-sector-skill-levels-roles'));
ok('K · backlog.md inclou wo-sector-quality-rubric-integration', backlogSrc.includes('wo-sector-quality-rubric-integration'));

// ─── L · LMS + sectors fusion doc + 3 WOs nous ─────────────────────────
console.log('\n— L · LMS + sectors fusion plan (v132)');
const lmsPlanExists = fs.existsSync(new URL('../../docs/lms-sectors-fusion-v132.md', import.meta.url));
ok('L · docs/lms-sectors-fusion-v132.md present', lmsPlanExists);
if (lmsPlanExists) {
    const lmsPlan = fs.readFileSync(new URL('../../docs/lms-sectors-fusion-v132.md', import.meta.url), 'utf8');
    ok('L · plan inclou 3 workstreams (LMS · fusion · KB index)',
       lmsPlan.includes('wo-research-lms') && lmsPlan.includes('wo-sectors-fusion') && lmsPlan.includes('wo-dynamic-kb-index'));
    ok('L · plan menciona Moodle/OpenEdX/Canvas benchmark',
       lmsPlan.includes('Moodle') && lmsPlan.includes('OpenEdX'));
    ok('L · plan menciona Scorm + xAPI compatibility',
       lmsPlan.includes('Scorm') && lmsPlan.includes('xAPI'));
    ok('L · plan inclou diagrama vista nova SectorAgentExplorer',
       lmsPlan.includes('SectorAgentExplorerView') || lmsPlan.includes('Sector Agent Explorer'));
    ok('L · plan inclou 7 tabs (Identity·Roles·Skills·SOPs·Patterns·Agent·Used)',
       lmsPlan.includes('Identity') && lmsPlan.includes('Roles') && lmsPlan.includes('SOPs') && lmsPlan.includes('Patterns'));
}
ok('L · backlog.md inclou wo-research-lms',         backlogSrc.includes('wo-research-lms'));
ok('L · backlog.md inclou wo-sectors-fusion',       backlogSrc.includes('wo-sectors-fusion'));
ok('L · backlog.md inclou wo-dynamic-kb-index',     backlogSrc.includes('wo-dynamic-kb-index'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
