// =============================================================================
// TEAMTOWERS SOS V11 — SECTOR ROLE CATALOG · TDD
// Ruta · /js/tests/sectorRoleCatalog.test.js
// =============================================================================

import {
    SECTOR_ROLES, SECTOR_ROLE_CATALOG_VERSION,
    getRoleForSector, adaptRolesBySector, listSectorCodes,
} from '../core/sectorRoleCatalog.js';
import { createProject } from '../core/projectCreationOrchestrator.js';

let pass = 0, fail = 0;
function ok(label, cond, expected = '', got = '') {
    if (cond) { pass++; console.log('✓', label); }
    else {
        fail++;
        const detail = (expected !== '' || got !== '') ? ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})` : '';
        console.log('✗', label + detail);
    }
}

console.log('=== SECTOR-ROLE-CATALOG · TDD ===\n');

// ─── A · 19+ sectors canònics + DEFAULT fallback ──────────────────────
console.log('— A · estructura del catàleg');
const codes = listSectorCodes();
ok('A · catàleg ≥17 sectors (sense DEFAULT)', codes.length >= 17, '≥17', codes.length);
const REQUIRED = ['A', 'C', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'UV'];
for (const c of REQUIRED) ok('A · té sector ' + c, codes.includes(c));
ok('A · DEFAULT fallback present', !!SECTOR_ROLES.DEFAULT);

// Cada sector té els 5 rols canònics
const REQUIRED_KINDS = ['founder', 'operations', 'creator', 'reviewer', 'facilitator'];
for (const c of REQUIRED) {
    for (const k of REQUIRED_KINDS) {
        const r = SECTOR_ROLES[c][k];
        ok('A · sector ' + c + ' · kind ' + k + ' · té name/description/typical_actor',
            !!(r && r.name && r.description && r.typical_actor));
    }
}

// ─── B · noms únics per sector · NO repeteix els 5 genèrics ──────────
console.log('\n— B · noms específics per sector (no genèrics)');
const GENERIC_NAMES = ['Founder', 'Operations · PM', 'Creator · Maker', 'Reviewer · QA', 'Facilitator', 'Facilitator · Comunicació', 'Founder · Ancora del projecte'];
const sectorJ = SECTOR_ROLES.J;
const sectorM = SECTOR_ROLES.M;
const sectorF = SECTOR_ROLES.F;
ok('B · sector J · founder NO és "Founder" genèric', !GENERIC_NAMES.includes(sectorJ.founder.name) && sectorJ.founder.name === 'CTO Founder');
ok('B · sector M · founder NO és "Founder" genèric', !GENERIC_NAMES.includes(sectorM.founder.name) && sectorM.founder.name === 'Managing Partner');
ok('B · sector F · operations és "Cap d\'Obra"', sectorF.operations.name === "Cap d'Obra");
// Names diferents entre sectors
ok('B · J/M tenen founder names diferents', sectorJ.founder.name !== sectorM.founder.name);
ok('B · J/F tenen creator names diferents', sectorJ.creator.name !== sectorF.creator.name);

// ─── C · getRoleForSector · resolució + alies kinds ──────────────────
console.log('\n— C · getRoleForSector · resolució + aliases');
ok('C · J/founder retorna CTO Founder', getRoleForSector('J', 'founder').name === 'CTO Founder');
ok('C · sector invàlid → DEFAULT founder', getRoleForSector('ZZ', 'founder').name === SECTOR_ROLES.DEFAULT.founder.name);
ok('C · sector null → DEFAULT founder', getRoleForSector(null, 'founder').name === SECTOR_ROLES.DEFAULT.founder.name);
// Aliases
ok('C · alias "pm" → operations', getRoleForSector('J', 'pm').name === SECTOR_ROLES.J.operations.name);
ok('C · alias "coder" → creator', getRoleForSector('J', 'coder').name === SECTOR_ROLES.J.creator.name);
ok('C · alias "qa" → reviewer', getRoleForSector('J', 'qa').name === SECTOR_ROLES.J.reviewer.name);
ok('C · alias "founder_anchor" → founder', getRoleForSector('M', 'founder_anchor').name === SECTOR_ROLES.M.founder.name);
ok('C · alias "visioner" → founder', getRoleForSector('R', 'visioner').name === SECTOR_ROLES.R.founder.name);

// ─── D · adaptRolesBySector · transforma array preservant camps ──────
console.log('\n— D · adaptRolesBySector · transforma sense mutar');
const input = [
    { id: 'r1', kind: 'founder',     name: 'Founder',     castell_level: 'pom_de_dalt', roleSlug: 'founder' },
    { id: 'r2', kind: 'pm',          name: 'Operations · PM', castell_level: 'tronc',   roleSlug: 'pm' },
    { id: 'r3', kind: 'coder',       name: 'Creator · Maker', castell_level: 'pinya',   roleSlug: 'coder' },
];
const adapted = adaptRolesBySector(input, 'J');
ok('D · input no mutat (immutable)', input[0].name === 'Founder');
ok('D · adapted[0].name = CTO Founder (sector J)', adapted[0].name === 'CTO Founder');
ok('D · adapted[1].name = Product Manager', adapted[1].name === 'Product Manager');
ok('D · adapted[2].name = Engineering Lead', adapted[2].name === 'Engineering Lead');
ok('D · preserva id', adapted[0].id === 'r1');
ok('D · preserva castell_level', adapted[1].castell_level === 'tronc');
ok('D · preserva roleSlug', adapted[2].roleSlug === 'coder');
ok('D · afegeix description', !!adapted[0].description);
ok('D · afegeix typical_actor', !!adapted[1].typical_actor);

// Sense kind · no es modifica
const adapted2 = adaptRolesBySector([{ id: 'x', name: 'Custom' }], 'J');
ok('D · role sense kind · no es modifica', adapted2[0].name === 'Custom');

// Sector null · fallback DEFAULT
const adapted3 = adaptRolesBySector([{ id: 'r1', kind: 'founder', name: 'Old' }], null);
ok('D · sector null · usa DEFAULT', adapted3[0].name === SECTOR_ROLES.DEFAULT.founder.name);

// ─── E · integració amb createProject mode template ──────────────────
console.log('\n— E · integració · createProject template-mode amb sector');
const rJ = await createProject({ name: 'Test TIC', description: 'app cooperat software', sector: 'J', ambition: 'light' });
const rolesJ = rJ.project.vna_roles;
ok('E · projecte J · ≥1 rol amb name sectorial', rolesJ.some(r => r.name === 'CTO Founder' || r.name === 'Product Manager' || r.name === 'Engineering Lead'));
ok('E · projecte J · NO té "Founder" genèric (overwritten)', !rolesJ.some(r => r.name === 'Founder'));

const rM = await createProject({ name: 'Test Cons', description: 'consultoria cooperativa', sector: 'M', ambition: 'light' });
const rolesM = rM.project.vna_roles;
ok('E · projecte M · té "Managing Partner"', rolesM.some(r => r.name === 'Managing Partner'));
ok('E · projecte M ≠ projecte J names', rolesJ[0].name !== rolesM[0].name);

// Score encara passa el llindar
ok('E · projecte J encara passa rubric ok=true', rJ.ok === true);
ok('E · projecte M encara passa rubric ok=true', rM.ok === true);

// Sense sector · DEFAULT fallback (encara diferent dels hardcoded del template)
const rNo = await createProject({ name: 'Test', description: 'cap descripció', ambition: 'light' });
const rolesNo = rNo.project.vna_roles;
// Els hardcoded de founder-coop-tradicional inclouen "Founder Anchor" amb kind founder_anchor
// El DEFAULT del catàleg diu "Fundador"
ok('E · sense sector · DEFAULT aplicat (no hardcoded original)',
    rolesNo.some(r => r.name === SECTOR_ROLES.DEFAULT.founder.name) ||
    rolesNo.some(r => r.name === SECTOR_ROLES.DEFAULT.operations.name) ||
    rolesNo.some(r => r.name === SECTOR_ROLES.DEFAULT.creator.name));

// ─── F · regressió · rubric encara puntua ≥85 ─────────────────────────
console.log('\n— F · regressió rubric amb sectorial naming');
for (const s of ['J', 'M', 'F', 'I', 'P']) {
    const r = await createProject({ name: 'Test ' + s, description: 'cooperat', sector: s, ambition: 'standard' });
    ok('F · sector ' + s + ' · score ≥85', r.score >= 85, '≥85', r.score);
}

// ─── G · version ──────────────────────────────────────────────────────
ok('G · SECTOR_ROLE_CATALOG_VERSION exportat', typeof SECTOR_ROLE_CATALOG_VERSION === 'string');

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
