// =============================================================================
// TEAMTOWERS SOS V11 — SECTOR AGENT LOADER (v131)
// Ruta · /js/core/sectorAgentLoader.js
//
// Carrega els 21 fitxers `knowledge/sectors/{LETTER}.md` com a "sector agents"
// que **complementen** el prompt VNA (no el contaminen). Llegeix YAML
// frontmatter + valida amb el mapping canonical CNAE 2009 Espanya.
//
// Pattern · idèntic a `agentMdLoader.js` (v122) · però per a sectors.
//
// API ·
//   loadSectorAgent(sectorId) → { sectorId, frontmatter, body, status }
//   buildSectorContextBlock(sectorId) → string · per a injectar al prompt
//   getCanonicalCnaeMapping() → { A: {...}, B: {...}, ... } · taula referència
//   listSectorAgents({ statusFilter }) → array de tots els sectors
//   validateSectorAgent(agent) → { ok, errors[] }
//
// Filosofia · si `roles_status === 'legacy-mismatch'` · el loader NO injecta
// els rols (per evitar contaminació). Usa el sector_name del frontmatter
// (canonical) i delega rols al domainDetector.
// =============================================================================

export const SECTOR_LOADER_VERSION = 'v131';

// Mapping canonical CNAE-2009 Espanya · font de veritat oficial
export const CANONICAL_CNAE_MAPPING = Object.freeze({
    A: { name: 'Agricultura, Ganadería, Silvicultura y Pesca',                    cnae: '01-03' },
    B: { name: 'Industrias Extractivas',                                          cnae: '05-09' },
    C: { name: 'Industria Manufacturera',                                         cnae: '10-33' },
    D: { name: 'Suministro de Energía Eléctrica, Gas y Vapor',                    cnae: '35'    },
    E: { name: 'Suministro de Agua, Saneamiento y Gestión de Residuos',           cnae: '36-39' },
    F: { name: 'Construcción',                                                    cnae: '41-43' },
    G: { name: 'Comercio al por Mayor y Menor',                                   cnae: '45-47' },
    H: { name: 'Transporte y Almacenamiento',                                     cnae: '49-53' },
    I: { name: 'Hostelería',                                                      cnae: '55-56' },
    J: { name: 'Información y Comunicaciones',                                    cnae: '58-63' },
    K: { name: 'Actividades Financieras y de Seguros',                            cnae: '64-66' },
    L: { name: 'Actividades Inmobiliarias',                                       cnae: '68'    },
    M: { name: 'Actividades Profesionales, Científicas y Técnicas',               cnae: '69-75' },
    N: { name: 'Actividades Administrativas y Servicios Auxiliares',              cnae: '77-82' },
    O: { name: 'Administración Pública y Defensa',                                cnae: '84'    },
    P: { name: 'Educación',                                                       cnae: '85'    },
    Q: { name: 'Actividades Sanitarias y de Servicios Sociales',                  cnae: '86-88' },
    R: { name: 'Actividades Artísticas, Recreativas y de Entretenimiento',        cnae: '90-93' },
    S: { name: 'Otros Servicios',                                                 cnae: '94-96' },
    T: { name: 'Actividades de los Hogares como Empleadores',                     cnae: '97-98' },
    U: { name: 'Organismos Extraterritoriales',                                   cnae: '99'    },
});

export const CANONICAL_SECTOR_IDS = Object.freeze(Object.keys(CANONICAL_CNAE_MAPPING));

// Status canonical per al loader · què fer amb el contingut
//   - 'canonical'              · contingut alineat amb frontmatter · INJECTABLE
//   - 'canonical-partial'      · contingut OK però scope reduït · INJECTABLE amb nota
//   - 'legacy-mismatch'        · contingut és d'un altre sector · NO injectable
//   - 'legacy-scope-overlap'   · contingut té rols solapats amb altre sector · INJECTABLE parcial
//   - null/undefined           · status no declarat · assume 'canonical' (backwards compat)
export const ROLE_STATUS_INJECTABLE = Object.freeze(['canonical', 'canonical-partial', 'legacy-scope-overlap']);

// _parseFrontmatter · KISS · parseja el YAML frontmatter d'un .md
// Els sector .md tenen TOT el contingut com a YAML (entre 2 `---`) ·
// roles[] viuen dins el frontmatter · no després.
// Suport mínim · `key: "value"` · `key: value` · `key: [a, b]`
function _parseFrontmatter(raw) {
    if (typeof raw !== 'string') throw new Error('_parseFrontmatter · raw must be string');
    const lines = raw.split('\n');
    if (lines[0] !== '---') throw new Error('_parseFrontmatter · file does not start with ---');
    const result = {};
    let i = 1;
    let frontmatterRaw = '';
    while (i < lines.length && lines[i] !== '---') {
        const line = lines[i];
        frontmatterRaw += line + '\n';
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
            const key = line.slice(0, colonIdx).trim();
            let val = line.slice(colonIdx + 1).trim();
            // Strip comments
            const cIdx = val.indexOf(' #');
            if (cIdx > 0) val = val.slice(0, cIdx).trim();
            if (val.startsWith('[') && val.endsWith(']')) {
                // Inline array
                const inner = val.slice(1, -1).trim();
                result[key] = inner ? inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')) : [];
            } else if (val === '') {
                result[key] = null;
            } else {
                // Strip quotes
                result[key] = val.replace(/^["']|["']$/g, '');
            }
        }
        i++;
    }
    const body = lines.slice(i + 1).join('\n');
    return { frontmatter: result, body, frontmatterRaw };
}

// _parseRoles · extrau l'array roles del body YAML (millor-effort · KISS · regex-based)
function _parseRoles(body) {
    const roles = [];
    const rolesIdx = body.indexOf('roles:');
    if (rolesIdx < 0) return roles;
    const block = body.slice(rolesIdx);
    // Match `  - id: foo` start of each role
    const regex = /(?:^|\n)  - id: (\S+)([\s\S]*?)(?=\n  - id: |\n[a-z_]+:|$)/g;
    let match;
    while ((match = regex.exec(block)) !== null) {
        const id = match[1].replace(/^["']|["']$/g, '');
        const subBlock = match[2];
        const role = { id };
        const fields = ['name', 'name_en', 'description', 'description_en', 'castell_level', 'fmv_usd_h', 'typical_actor'];
        for (const f of fields) {
            const m = subBlock.match(new RegExp('\\n    ' + f + ': (.+?)(?=\\n)', 's'));
            if (m) {
                let v = m[1].trim().replace(/^["']|["']$/g, '');
                if (f === 'fmv_usd_h') v = (v === 'null' || v === '') ? null : Number(v);
                role[f] = v;
            }
        }
        const tagsM = subBlock.match(/\n    tags: \[([^\]]+)\]/);
        if (tagsM) role.tags = tagsM[1].split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));

        // v131c · parse skill_levels nested block · format ·
        //     skill_levels:
        //       junior: ["skill1", "skill2"]
        //       mid: ["skill3"]
        const slIdx = subBlock.indexOf('    skill_levels:');
        if (slIdx >= 0) {
            role.skill_levels = {};
            const slBlock = subBlock.slice(slIdx);
            const slRegex = /\n      (junior|mid|senior|principal): \[([^\]]*)\]/g;
            let slM;
            while ((slM = slRegex.exec(slBlock)) !== null) {
                const lvl = slM[1];
                const arr = slM[2].split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
                role.skill_levels[lvl] = arr;
            }
        }

        roles.push(role);
    }
    return roles;
}

// parseSectorAgentSource · pure · parseja el raw string del .md
// v131-fix · roles[] viuen dins el frontmatter (no després) · parsegem-los
// des de frontmatterRaw.
export function parseSectorAgentSource(raw) {
    const { frontmatter, body, frontmatterRaw } = _parseFrontmatter(raw);
    const roles = _parseRoles(frontmatterRaw);
    return { frontmatter, body, roles };
}

// validateSectorAgent · check de coherència amb canonical mapping
export function validateSectorAgent(agent) {
    const errors = [];
    if (!agent || !agent.frontmatter) return { ok: false, errors: ['agent missing'] };
    const fm = agent.frontmatter;
    const sectorId = fm.sector_id;
    if (!sectorId) errors.push('sector_id missing');
    if (sectorId && !CANONICAL_CNAE_MAPPING[sectorId] && sectorId !== 'UV') {
        errors.push('sector_id not canonical · ' + sectorId);
    }
    // Canonical check · si sector_id té mapping canonical · cnae HA DE coincidir
    if (sectorId && CANONICAL_CNAE_MAPPING[sectorId]) {
        const expectedCnae = CANONICAL_CNAE_MAPPING[sectorId].cnae;
        if (fm.cnae && fm.cnae !== expectedCnae) {
            errors.push(`cnae mismatch · file=${fm.cnae} canonical=${expectedCnae}`);
        }
    }
    if (!fm.sector_name) errors.push('sector_name missing');
    if (!fm.version) errors.push('version missing');
    return { ok: errors.length === 0, errors };
}

// loadSectorAgent · node fs · llegeix knowledge/sectors/{LETTER}.md
export async function loadSectorAgent(sectorId, { sectorsDir = null } = {}) {
    if (!sectorId || typeof sectorId !== 'string') throw new Error('loadSectorAgent · sectorId required');
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const dir = sectorsDir || path.resolve(process.cwd(), 'knowledge/sectors');
    const file = path.join(dir, sectorId + '.md');
    const raw = await fs.readFile(file, 'utf8');
    const parsed = parseSectorAgentSource(raw);
    const validation = validateSectorAgent(parsed);
    return {
        sectorId,
        ...parsed,
        rolesStatus: parsed.frontmatter.roles_status || 'canonical',
        rolesInjectable: ROLE_STATUS_INJECTABLE.includes(parsed.frontmatter.roles_status || 'canonical'),
        valid: validation.ok,
        validationErrors: validation.errors,
    };
}

// listSectorAgents · enumera tots els sectors al directori
export async function listSectorAgents({ sectorsDir = null, statusFilter = null } = {}) {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const dir = sectorsDir || path.resolve(process.cwd(), 'knowledge/sectors');
    const files = (await fs.readdir(dir)).filter(f => f.endsWith('.md'));
    const agents = await Promise.all(files.map(async f => {
        try { return await loadSectorAgent(f.replace(/\.md$/, ''), { sectorsDir: dir }); }
        catch (_) { return null; }
    }));
    let valid = agents.filter(a => a !== null);
    if (statusFilter) valid = valid.filter(a => a.rolesStatus === statusFilter);
    return valid;
}

// buildSectorContextBlock · pure · genera un bloc de text per a injectar al
// prompt VNA · complementen (no substitueix) el `domainDetection`. Inclou ·
//   - Sector identity (sector_name + cnae)
//   - Roles per casteller level (si rolesInjectable)
//   - Skill levels per role (si skill_levels declarat · v131b)
// Si rolesInjectable=false · només sector identity (anti-contaminació).
export function buildSectorContextBlock(agent) {
    if (!agent) return '';
    const fm = agent.frontmatter || {};
    const sectorName = fm.sector_name || fm.sector_id;
    const cnae = fm.cnae || '?';
    const canonical = CANONICAL_CNAE_MAPPING[fm.sector_id];

    const lines = [];
    lines.push('SECTOR · ' + sectorName + ' (CNAE-2009 ' + fm.sector_id + ' · ' + cnae + ')');
    if (canonical && fm.sector_name !== canonical.name) {
        lines.push('  (canonical CNAE Espanya · ' + canonical.name + ')');
    }
    if (fm.tags && fm.tags.length) {
        lines.push('Sub-temes típics · ' + fm.tags.slice(0, 8).join(' · '));
    }

    if (!agent.rolesInjectable) {
        lines.push('');
        lines.push('NOTA · els rols específics d\'aquest sector s\'estan migrant a v131b · per ara · usa els arquetip detectats pel domainDetector si hi ha match · si no · genera rols nous adaptats al sector específic.');
        return lines.join('\n');
    }

    if (agent.roles && agent.roles.length) {
        lines.push('');
        lines.push('Rols arquetip canonical (per nivell casteller) ·');
        const byLevel = {};
        for (const r of agent.roles) {
            const lvl = r.castell_level || 'unspecified';
            if (!byLevel[lvl]) byLevel[lvl] = [];
            byLevel[lvl].push(r);
        }
        const order = ['pom_de_dalt', 'tronc', 'pinya', 'laterals', 'mans', 'baixos', 'unspecified'];
        for (const lvl of order) {
            if (!byLevel[lvl]) continue;
            lines.push('  [' + lvl + ']');
            for (const r of byLevel[lvl]) {
                lines.push('    · ' + (r.name || r.id) + (r.description ? ' — ' + r.description.slice(0, 100) : ''));
            }
        }
    }
    return lines.join('\n');
}

// auditCnaeAlignment · pure · troba els sectors amb frontmatter incoherent
// Útil per a debugging i CI. Retorna llistat de problemes.
export async function auditCnaeAlignment({ sectorsDir = null } = {}) {
    const agents = await listSectorAgents({ sectorsDir });
    const report = { total: agents.length, canonical: 0, partial: 0, mismatch: 0, errors: [] };
    for (const a of agents) {
        const status = a.rolesStatus;
        if (status === 'canonical')           report.canonical++;
        else if (status === 'canonical-partial') report.partial++;
        else if (status === 'legacy-mismatch') report.mismatch++;
        if (!a.valid) report.errors.push({ sectorId: a.sectorId, errors: a.validationErrors });
    }
    return report;
}

// getCanonicalCnaeMapping · accessor del mapping oficial
export function getCanonicalCnaeMapping() {
    return CANONICAL_CNAE_MAPPING;
}

export const __test_helpers__ = { _parseFrontmatter, _parseRoles };
