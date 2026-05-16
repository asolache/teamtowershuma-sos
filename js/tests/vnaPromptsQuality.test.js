// =============================================================================
// TEAMTOWERS SOS V11 — VNA PROMPTS QUALITY · TDD (PR-M)
// Ruta · /js/tests/vnaPromptsQuality.test.js
//
// Blinda · els prompts ara expliciten Verna Allee methodology · passa CNAE +
// lifecycle + entity a les 3 tasks · sector_role_examples com a inspiració.
// =============================================================================

import { SYSTEM_BASE, buildPrompt } from '../core/vnaExpertPrompts.js';
import { SECTOR_ROLES } from '../core/sectorRoleCatalog.js';

let pass = 0, fail = 0;
function ok(label, cond, expected = '', got = '') {
    if (cond) { pass++; console.log('✓', label); }
    else {
        fail++;
        const detail = (expected !== '' || got !== '') ? ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})` : '';
        console.log('✗', label + detail);
    }
}

console.log('=== VNA-PROMPTS-QUALITY (PR-M) ===\n');

// ─── A · SYSTEM_BASE · Verna Allee methodology explícita ─────────────
console.log('— A · SYSTEM_BASE menciona Verna Allee + 5 principis');
ok('A · "METODOLOGIA VERNA ALLEE" header', SYSTEM_BASE.includes('METODOLOGIA VERNA ALLEE'));
ok('A · "Value Network Analysis"',         SYSTEM_BASE.includes('Value Network Analysis'));
ok('A · "Verna Allee" explícit',           SYSTEM_BASE.includes('Verna Allee'));
ok('A · principi A · ROLES (no jobs)', SYSTEM_BASE.includes('ROLES (no jobs/positions)') && SYSTEM_BASE.includes('rols actius'));
ok('A · principi B · TRANSACTIONS BIDIRECCIONALS', SYSTEM_BASE.includes('TRANSACTIONS BIDIRECCIONALS'));
ok('A · principi C · TANGIBLE vs INTANGIBLE',      SYSTEM_BASE.includes('TANGIBLE vs INTANGIBLE'));
ok('A · principi D · DELIVERABLES amb identitat',  SYSTEM_BASE.includes('DELIVERABLES amb identitat'));
ok('A · principi E · PATTERN RECÍPROC DETECTION',  SYSTEM_BASE.includes('PATTERN RECÍPROC DETECTION'));
ok('A · cita rols orfes (criteri Allee)',          SYSTEM_BASE.includes('cap rol orfe'));
ok('A · cita "deliverable mort"',                  SYSTEM_BASE.includes('deliverable mort'));
ok('A · cita "cicles recíprocs"',                  SYSTEM_BASE.includes('cicles recíprocs'));
ok('A · MARC D\'ANÀLISI prohibeix noms genèrics',  SYSTEM_BASE.includes('MAI usis noms genèrics'));
ok('A · MARC inclou exemples per sector (M · F · J)', SYSTEM_BASE.includes('consultoria M') && SYSTEM_BASE.includes('construcció F') && SYSTEM_BASE.includes('TIC J'));

// ─── B · classify-and-pick-socs · context COMPLET (lifecycle + entity + zoom) ─
console.log('\n— B · classify-and-pick-socs · context ric');
const p1 = buildPrompt({
    taskKind: 'classify-and-pick-socs',
    context: {
        name: 'X', description: 'd', sector: 'J', entity_type: 'organization',
        project_type: 'coop', lifecycle_stage: 'mvp', vna_zoom: 'mid',
        candidates: [{ relpath: 'socs/x.md', title: 'X', sector_cnae: 'J' }],
    },
});
ok('B · prompt menciona "Sector CNAE"',         p1.user.includes('Sector CNAE'));
ok('B · prompt menciona "Fase lifecycle"',      p1.user.includes('Fase lifecycle'));
ok('B · prompt menciona "mvp"',                 p1.user.includes('mvp'));
ok('B · prompt menciona "Tipus entitat"',       p1.user.includes('Tipus entitat'));
ok('B · prompt menciona "Zoom VNA"',            p1.user.includes('Zoom VNA'));
ok('B · prompt invoca rol consultora Verna Allee', p1.user.includes('CONSULTORA VERNA ALLEE SÈNIOR'));
ok('B · prompt criteri Allee · TANGIBLES + INTANGIBLES', p1.user.includes('TANGIBLES com INTANGIBLES'));
ok('B · prompt cita "rols orfes"',              p1.user.includes('rols orfes'));
ok('B · tokens <3500 budget',                   p1.approxTokens < 3500, '<3500', p1.approxTokens);

// ─── C · generate-sops-from-soc · sector_role_examples + Verna Allee ─
console.log('\n— C · generate-sops-from-soc · context VNA + sector inspiration');
const sectorJ = SECTOR_ROLES.J;
const sector_role_examples = Object.entries(sectorJ).slice(0, 5).map(([k, v]) => ({ kind: k, name: v.name, description: v.description }));

const p2 = buildPrompt({
    taskKind: 'generate-sops-from-soc',
    context: {
        name: 'X', soc: { title: 'T', purpose: 'P' },
        project_ctx: { description: 'd', sector: 'J', lifecycle_stage: 'mvp', entity_type: 'organization' },
        role_kinds: ['founder', 'creator'],
        sector_role_examples,
    },
});
ok('C · prompt invoca rol consultora Verna Allee', p2.user.includes('CONSULTORA VERNA ALLEE SÈNIOR'));
ok('C · prompt menciona "Sector CNAE"',  p2.user.includes('Sector CNAE'));
ok('C · prompt menciona "Fase lifecycle" + mvp',  p2.user.includes('Fase lifecycle') && p2.user.includes('mvp'));
ok('C · prompt menciona "Entitat"',  p2.user.includes('Entitat'));
ok('C · prompt inclou rols inspiració del sector',  p2.user.includes('INSPIRACIÓ rols del sector'));
ok('C · prompt cita "CTO Founder" (rol sector J)',  p2.user.includes('CTO Founder'));
ok('C · prompt explicit "NO copia · adapta"',  p2.user.includes('NO copia · adapta'));
ok('C · prompt prohibeix "Step 1"',  p2.user.includes('NO un títol genèric') && p2.user.includes('Step 1'));
ok('C · prompt cita "CADA STEP DIRECTAMENT CONVERTIBLE A WORK ORDER"', p2.user.includes('CADA STEP DIRECTAMENT CONVERTIBLE A WORK ORDER'));
ok('C · tokens <3500 budget',  p2.approxTokens < 3500, '<3500', p2.approxTokens);

// ─── D · generate-wos-from-sop · context CNAE + lifecycle + entity ───
console.log('\n— D · generate-wos-from-sop · context ric + qualitat');
const p3 = buildPrompt({
    taskKind: 'generate-wos-from-sop',
    context: {
        name: 'X',
        sop: { id: 's', title: 'SOP X', role_ref: 'r', steps: [] },
        project_ctx: { description: 'd', sector: 'M', lifecycle_stage: 'validation', entity_type: 'business' },
    },
});
ok('D · prompt menciona "Sector CNAE"',         p3.user.includes('Sector CNAE'));
ok('D · prompt menciona "Fase lifecycle" + validation', p3.user.includes('Fase lifecycle') && p3.user.includes('validation'));
ok('D · prompt menciona "Entitat" + business',  p3.user.includes('Entitat') && p3.user.includes('business'));
ok('D · mode Verna Allee · "quanta de valor"',  p3.user.includes('quanta de valor'));
ok('D · prohibeix WOs genèrics tipus "Setup"',  p3.user.includes('Setup'));
ok('D · cita IKEA workshop com a exemple',      p3.user.includes('IKEA'));
ok('D · tokens <3500 budget',                   p3.approxTokens < 3500, '<3500', p3.approxTokens);

// ─── E · sector_role_examples sempre opcional ───────────────────────
console.log('\n— E · sector_role_examples opcional · fallback graceful');
const p2NoExamples = buildPrompt({
    taskKind: 'generate-sops-from-soc',
    context: {
        name: 'X', soc: { title: 'T' },
        project_ctx: { description: 'd', sector: 'J', lifecycle_stage: 'mvp' },
        role_kinds: ['founder'],
        // sector_role_examples omitted
    },
});
ok('E · sense sector_role_examples · prompt encara genera', p2NoExamples.user.length > 100);
ok('E · sense sector_role_examples · NO mostra "INSPIRACIÓ"',  !p2NoExamples.user.includes('INSPIRACIÓ rols del sector'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
