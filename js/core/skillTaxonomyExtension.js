// TEAMTOWERS SOS V11 — SKILL TAXONOMY EXTENSION (SKILL-TAX-002 sprint A)
//
// Capa universal sobre SKILL_TAXONOMY existent (MAT-003 sprint B · 90
// skills). Afegeix:
//   1. Categorització universal (soft · hard · meta · care · governance)
//      compatible amb taxonomies externes (ESCO · O*NET · LinkedIn skills).
//   2. Audience targeting · mapping skill → quins dels 12 PROJECT_TYPES
//      (Matriu) la consideren rellevant.
//   3. Intangible value per cada un dels 12 guardians Pantheon Work.
//
// Reframe @alvaro 2026-05-09: "estructurar las habilidades en base a una
// taxonomía universal con foco en el público potencial según los tipos
// de proyectos de la matriu". Aquesta extensió és el primer pas.
//
// NO toca SKILL_TAXONOMY frozen · només l'enriqueix per lookup.
// Backwards-compat 100% · sprint A foundational · sprint B (futur)
// integrarà al modal /matriu i a /learn.

import { SKILL_TAXONOMY, listSkills, skillsByDomain } from './skillTaxonomy.js';
import { PROJECT_TYPES, PANTHEON_GUARDIANS } from './critical108Roles.js';

// ── 1. SKILL_CATEGORIES · 5 categories universals ─────────────────────

export const SKILL_CATEGORIES = Object.freeze({
    soft:       { id: 'soft',       label: 'Soft skills',      icon: '💬', desc: 'Comunicació, empatia, treball en equip · transversal a tot rol' },
    hard:       { id: 'hard',       label: 'Hard skills',      icon: '⚙️', desc: 'Coneixement tècnic específic · codi, finance, agricultura, etc.' },
    meta:       { id: 'meta',       label: 'Meta-skills',      icon: '🌀', desc: 'Aprendre a aprendre · pensament sistèmic · adaptació' },
    care:       { id: 'care',       label: 'Care skills',      icon: '💗', desc: 'Cures · mediació · sostenibilitat emocional · sovint invisible' },
    governance: { id: 'governance', label: 'Governance skills', icon: '⚖️', desc: 'Pacte · decisió · slicing · auditoria · custòdia institucional' },
});

// Heurística per a derivar category de domain + tier + guardianAffinity
// existent al SKILL_TAXONOMY · evita duplicar info.
const DOMAIN_TO_CATEGORY = Object.freeze({
    governance: 'governance',
    finance:    'governance',   // contabilidad triple-entry · slicing pie · governance financera
    legal:      'governance',
    tech:       'hard',
    operations: 'hard',
    design:     'hard',
    ecology:    'hard',
    education:  'meta',
    community:  'soft',
    culture:    'soft',
});

// Override per skills específiques on la categorització de domain
// no captura la naturalesa real (sovint care, meta o soft).
const SKILL_CATEGORY_OVERRIDES = Object.freeze({
    'multi-loop-learning':       'meta',
    'pedagogy-cooperativa':      'meta',
    'curriculum-design':         'meta',
    'learning-design':           'meta',
    'knowledge-translation':     'meta',
    'context-pruning':           'meta',
    'kb-curation':               'meta',

    'facilitation':              'soft',
    'meeting-design':            'soft',
    'visual-facilitation':       'soft',
    'storytelling':              'soft',
    'narrative-design':          'soft',

    'conflict-mediation':        'care',
    'conflict-prevention':       'care',
    'conflict-resolution':       'care',
    'cop-stewardship':           'care',
    'cop-facilitation':          'care',
    'mentoring-junior':          'care',
    'onboarding-buddy':          'care',
    'onboarding-design':         'care',
    'relational-intelligence':   'care',
    'territorial-ambassadorship':'care',
    'network-weaving':           'care',
    'ritual-design':             'care',
    'transition-rites':          'care',
    'celebration-curation':      'care',

    'pact-design':               'governance',
    'compliance-cooperative':    'governance',
    'arbitration':               'governance',
    'audit-execution':           'governance',
    'ledger-auditing':           'governance',
    'ownership-allocation':      'governance',
    'decision-facilitation':     'governance',
    'governance-design':         'governance',
    'manifesto-stewardship':     'governance',
});

export function categoryForSkill(skillId) {
    if (typeof skillId !== 'string' || !skillId) return null;
    if (SKILL_CATEGORY_OVERRIDES[skillId]) return SKILL_CATEGORY_OVERRIDES[skillId];
    const skill = SKILL_TAXONOMY.find(s => s.id === skillId);
    if (!skill) return null;
    return DOMAIN_TO_CATEGORY[skill.domain] || 'hard';
}

export function skillsByCategory(categoryId) {
    if (!SKILL_CATEGORIES[categoryId]) return [];
    return SKILL_TAXONOMY.filter(s => categoryForSkill(s.id) === categoryId);
}

// ── 2. Audience targeting · skill → projectTypes afins ────────────────

// Mapping projectType → guardians objectiu (de bootstrapTemplates) +
// skills afins als guardians + skills afins als seus dominis.
// Aquí ho declarem com a regla derivada · mantén consistència amb
// PROJECT_BOOTSTRAP_TEMPLATES sense duplicar.
//
// Alternativa explícita per a casos on l'heuristic no és suficient:
const SKILL_AUDIENCE_OVERRIDES = Object.freeze({
    // skills universals · totes
    'facilitation':              ['comunitat-autosuficient', 'cooperativa-multi', 'fundacio-ong', 'ecosistema-regional', 'plataforma-cooperativa', 'cooperativa-cures', 'espai-autogestionat', 'hub-transicio'],
    'pact-design':               PROJECT_TYPES.map(p => p.id),    // tots els projectes necessiten pacte
    'triple-entry-accounting':   PROJECT_TYPES.map(p => p.id),    // tots
    'slicing-pie':               PROJECT_TYPES.map(p => p.id),    // tots
    // tech afí a digitals
    'smart-contract-development':['startup-coop-tradicional', 'dao-web3', 'plataforma-cooperativa'],
    'devops-cooperative':        ['startup-coop-tradicional', 'dao-web3', 'plataforma-cooperativa'],
    'llm-orchestration':         ['startup-coop-tradicional', 'dao-web3', 'plataforma-cooperativa', 'hub-transicio'],
    // ecology afí a regenerativos
    'regenerative-agriculture':  ['comunitat-autosuficient', 'ecosistema-regional', 'cooperativa-cures'],
    'seed-banking':              ['comunitat-autosuficient', 'ecosistema-regional'],
    'food-systems':              ['comunitat-autosuficient', 'ecosistema-regional', 'cooperativa-cures'],
    'energy-transition':         ['ecosistema-regional', 'hub-transicio', 'comunitat-autosuficient'],
    // care afí a cures
    'conflict-mediation':        ['cooperativa-cures', 'cooperativa-multi', 'fundacio-ong', 'espai-autogestionat', 'comunitat-autosuficient'],
    'cop-stewardship':           ['fundacio-ong', 'cooperativa-cures', 'espai-autogestionat', 'hub-transicio'],
});

// audienceProjectTypesForSkill · puro · si hi ha override, retorna el
// override; sino, deriva per heuristic (skill.domain + bootstrapTemplate.sectorAffinity).
export function audienceProjectTypesForSkill(skillId) {
    if (SKILL_AUDIENCE_OVERRIDES[skillId]) {
        return SKILL_AUDIENCE_OVERRIDES[skillId].slice();
    }
    const skill = SKILL_TAXONOMY.find(s => s.id === skillId);
    if (!skill) return [];
    // Heurística simple · si la skill té domain X, retorna projectTypes
    // que tenen guardians del mateix domain a requiredGuardians (via
    // bootstrap templates · es resol al runtime via call d'inversa).
    // Per a sprint A · només retornem els projectTypes de l'override
    // o tots si està marcat com a tier='foundation' (universal).
    if (skill.tier === 'foundation') return PROJECT_TYPES.map(p => p.id);
    return [];
}

export function skillsForProjectType(typeId) {
    if (!typeId) return [];
    return SKILL_TAXONOMY.filter(s =>
        audienceProjectTypesForSkill(s.id).includes(typeId)
    );
}

// ── 3. Intangible value per cada un dels 12 guardians PW ──────────────

export const INTANGIBLE_VALUE_OF_GUARDIAN = Object.freeze({
    afrodita: Object.freeze({
        primary:   'estètica que sedueix',
        secondary: ['cohesió emocional', 'narrativa que mou', 'producte-mercat-fit'],
        recognizesValueIn: ['disseny que enamora', 'paraules que conecten', 'imatges que vibren'],
    }),
    apolo: Object.freeze({
        primary:   'claredat que orienta',
        secondary: ['prospectiva', 'currículum estructurat', 'predicció informada'],
        recognizesValueIn: ['anàlisi profunda', 'documentació clara', 'transmissió de coneixement'],
    }),
    atenea: Object.freeze({
        primary:   'governança deliberativa',
        secondary: ['estratègia defensiva', 'protecció flux valor', 'civisme'],
        recognizesValueIn: ['decisions difícils', 'destreses pràctiques', 'fer del coneixement acció'],
    }),
    demeter: Object.freeze({
        primary:   'cicles regenerats',
        secondary: ['soberania alimentària', 'cura de la terra', 'biodiversitat'],
        recognizesValueIn: ['hores als camps', 'llavors guardades', 'cooperació amb el lloc'],
    }),
    dionisio: Object.freeze({
        primary:   'transformació ritual',
        secondary: ['cohesió emocional', 'art de la celebració', 'memes vius'],
        recognizesValueIn: ['rituals dissenyats', 'crisis vingudes a maduresa', 'identitat narrativa'],
    }),
    hebe: Object.freeze({
        primary:   'servei jove',
        secondary: ['onboarding net', 'relleu generacional', 'frescor que rejuveneix'],
        recognizesValueIn: ['ajudar el següent a entrar', 'perspectiva nova', 'simplificació'],
    }),
    hefesto: Object.freeze({
        primary:   'forja artesanal',
        secondary: ['eines que perduren', 'infraestructura sòlida', 'especialització profunda'],
        recognizesValueIn: ['codi net', 'sistemes que aguanten', 'manteniment fidel'],
    }),
    hera: Object.freeze({
        primary:   'fidelitat estructural',
        secondary: ['pacte que es compleix', 'aliances institucionals', 'compliance amb significat'],
        recognizesValueIn: ['paraula donada', 'institucions sostingudes', 'rituals legals'],
    }),
    hermes: Object.freeze({
        primary:   'mediació en xarxa',
        secondary: ['interoperabilitat', 'traducció entre mons', 'comerç honest'],
        recognizesValueIn: ['contactes ben fets', 'interfícies que parlen', 'fronteres travessades'],
    }),
    hestia: Object.freeze({
        primary:   'cohesió íntima',
        secondary: ['hospitalitat', 'foc cuidat', 'llar que aculli'],
        recognizesValueIn: ['acollir el nou', 'sostenir el grup', 'cures invisibles'],
    }),
    poseidon: Object.freeze({
        primary:   "audàcia davant l'incert",
        secondary: ['capital posat al risc', 'oràcle de preus', 'decisió disruptiva'],
        recognizesValueIn: ['atrevir-se primer', 'capital líquid arriscat', 'lectura del fons'],
    }),
    zeus: Object.freeze({
        primary:   'soberania visionària',
        secondary: ['autoritat delegada', 'fundació amb sentit', 'última paraula'],
        recognizesValueIn: ['veure abans el conjunt', 'donar rumb', 'sostenir la promesa'],
    }),
});

export function intangibleValueOfGuardian(guardianId) {
    return INTANGIBLE_VALUE_OF_GUARDIAN[guardianId] || null;
}

// topSkillsForGuardian · puro · les skills del catàleg més afins a un
// guardian (filtrades per guardianAffinity) · max N · ordenades per tier
// (master > practitioner > foundation per visibilitat suggerent).
export function topSkillsForGuardian(guardianId, max = 5) {
    if (!guardianId) return [];
    const tierRank = { master: 3, practitioner: 2, foundation: 1 };
    return SKILL_TAXONOMY
        .filter(s => Array.isArray(s.guardianAffinity) && s.guardianAffinity.includes(guardianId))
        .slice()
        .sort((a, b) => (tierRank[b.tier] || 0) - (tierRank[a.tier] || 0))
        .slice(0, max);
}

// ── 4. Sub-categorització per audience · per UI didactica ────────────

// PUBLIC_AUDIENCES · 5 audiències humanes que SOS atén
// (alineat amb FairShares · MAT-003 · amb un focus "humà").
export const PUBLIC_AUDIENCES = Object.freeze([
    { id: 'fundadors',  label: 'Fundadors',     icon: '🏛', desc: "L'iniciador · qui posa la primera pedra · multiplicador ×1.5" },
    { id: 'equip',      label: 'Equip operatiu',icon: '🛠', desc: "Qui executa SOPs · WOs · genera slice de temps continu" },
    { id: 'usuaris',    label: 'Usuaris/Clients', icon: '🤝', desc: "Qui consumeix valor i cogenera amb el seu ús · feedback loop" },
    { id: 'inversors',  label: 'Inversors',     icon: '🌊', desc: "Qui aporta capital líquid · multiplicador risc ×4" },
    { id: 'comunitat',  label: 'Comunitat',     icon: '🌍', desc: "Qui sosté el ecosistema territorial · valor difús" },
]);

// audiencesForSkill · puro · estimació heurística de quines audiències
// trobaran rellevant aquesta skill · per a UI suggerent.
const SKILL_TO_AUDIENCES = Object.freeze({
    // governance + legal · útil per fundadors + comunitat
    'pact-design':              ['fundadors', 'comunitat'],
    'governance-design':        ['fundadors', 'equip'],
    'compliance-cooperative':   ['fundadors', 'comunitat'],
    'arbitration':              ['comunitat'],
    'vision-strategic':         ['fundadors'],
    'ownership-allocation':     ['fundadors', 'inversors'],

    // finance · fundadors + inversors + equip
    'capital-sourcing':         ['fundadors', 'inversors'],
    'exit-mechanism-design':    ['fundadors', 'inversors'],
    'treasury-management':      ['fundadors', 'equip'],
    'triple-entry-accounting':  ['equip', 'fundadors'],
    'slicing-pie':              ['fundadors', 'equip', 'inversors'],

    // tech · equip
    'system-architecture':      ['equip'],
    'smart-contract-development': ['equip', 'inversors'],
    'devops-cooperative':       ['equip'],

    // design · equip + usuaris
    'ux-research':              ['equip', 'usuaris'],
    'service-design':           ['equip', 'usuaris'],
    'narrative-design':         ['equip', 'comunitat'],

    // operations · equip
    'process-architecture':     ['equip', 'fundadors'],

    // community + culture · comunitat
    'facilitation':             ['comunitat', 'equip'],
    'network-weaving':          ['comunitat'],
    'territorial-ambassadorship':['comunitat'],
    'cop-stewardship':          ['comunitat'],
    'ritual-design':            ['comunitat'],
    'storytelling':             ['comunitat', 'usuaris'],

    // ecology · comunitat (territorial)
    'regenerative-agriculture': ['comunitat', 'equip'],
    'seed-banking':             ['comunitat'],
    'biodiversity-stewardship': ['comunitat'],

    // education · usuaris + equip
    'curriculum-design':        ['equip', 'usuaris'],
    'pedagogy-cooperativa':     ['equip', 'usuaris'],
    'mentoring-junior':         ['equip'],

    // care
    'conflict-mediation':       ['comunitat', 'equip'],
    'relational-intelligence':  ['comunitat', 'equip'],
});

export function audiencesForSkill(skillId) {
    if (SKILL_TO_AUDIENCES[skillId]) return SKILL_TO_AUDIENCES[skillId].slice();
    // Heurística per defecte · per category
    const cat = categoryForSkill(skillId);
    if (cat === 'governance') return ['fundadors', 'comunitat'];
    if (cat === 'care')       return ['comunitat', 'equip'];
    if (cat === 'soft')       return ['equip', 'comunitat'];
    if (cat === 'meta')       return ['equip', 'usuaris'];
    return ['equip'];
}

// ── 5. External taxonomy refs · placeholder per import/export ────────

// SKILL_EXTERNAL_REFS · futur sprint B · mapping skill → ESCO/O*NET/
// LinkedIn IDs. Per ara empty placeholder per a no bloquejar build.
export const SKILL_EXTERNAL_REFS = Object.freeze({});

// ── 6. coverageReportExtended · stats per categoria + audience ─────

export function coverageReportExtended() {
    const all = listSkills();
    const byCategory = {};
    for (const cat of Object.keys(SKILL_CATEGORIES)) {
        byCategory[cat] = all.filter(s => categoryForSkill(s.id) === cat).length;
    }
    const byAudience = {};
    for (const aud of PUBLIC_AUDIENCES) {
        byAudience[aud.id] = all.filter(s => audiencesForSkill(s.id).includes(aud.id)).length;
    }
    const byProjectType = {};
    for (const pt of PROJECT_TYPES) {
        byProjectType[pt.id] = skillsForProjectType(pt.id).length;
    }
    return {
        totalSkills:    all.length,
        categories:     SKILL_CATEGORIES,
        byCategory,
        audiences:      PUBLIC_AUDIENCES,
        byAudience,
        projectTypes:   PROJECT_TYPES.length,
        byProjectType,
        guardians:      PANTHEON_GUARDIANS.length,
        intangibleValuesDefined: Object.keys(INTANGIBLE_VALUE_OF_GUARDIAN).length,
    };
}
