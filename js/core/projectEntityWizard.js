// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT ENTITY WIZARD (AI-DRIVEN sprint UI · PR3)
// Ruta · /js/core/projectEntityWizard.js
//
// Pure data + helpers per al wizard pre-form "què construeixes?".
// 2 preguntes ·
//   Q1 · entity_type (organization · business · sos · project_internal)
//   Q2 · format (depèn del Q1) · cooperativa/assoc/ONG · SL/SLU/autònom/startup · ...
// Cada combinació suggereix · {entity_type, vna_zoom, ambition, generationMode, sectorHint}
//
// Pure · zero DOM · safe Node + browser. La UI consumeix els llistats i resol
// la suggestion final via `resolveSuggestion(entity_type, format)`.
// =============================================================================

export const WIZARD_VERSION = 'v1.0';

// ── Q1 · 4 cards d'entitat ───────────────────────────────────────────────
export const ENTITY_CARDS = Object.freeze([
    Object.freeze({
        id: 'organization',
        icon: '🏛',
        title: 'Organització',
        subtitle: 'Estructura humana col·lectiva',
        examples: ['cooperativa', 'associació', 'ONG', 'fundació', 'colla', 'matriu'],
        description: 'Persones que s\'agrupen amb un propòsit comú · governança democràtica · valor distribuït.',
    }),
    Object.freeze({
        id: 'business',
        icon: '💼',
        title: 'Negoci',
        subtitle: 'Vector comercial · ingressos · clients',
        examples: ['SL', 'SLU', 'autònom', 'startup', 'PYME'],
        description: 'Entitat que genera ingressos amb productes/serveis · model de negoci · clients.',
    }),
    Object.freeze({
        id: 'sos',
        icon: '🌐',
        title: 'SoS · Sistema Operatiu Sociotècnic',
        subtitle: 'Federació · sistema dins de sistemes',
        examples: ['SOS federat', 'permaweb', 'protocol obert', 'meta-org'],
        description: 'Un SOS dins un altre SOS · capa orquestradora · alta complexitat · descentralitzat.',
    }),
    Object.freeze({
        id: 'project_internal',
        icon: '🧩',
        title: 'Projecte intern',
        subtitle: 'Subprojecte dins d\'una org existent',
        examples: ['feature pack', 'línia de servei', 'pilot', 'spike R&D'],
        description: 'Una iniciativa concreta dins una entitat ja constituïda · no defineix entitat nova.',
    }),
]);

// ── Q2 · formats per entitat (dependent del Q1) ──────────────────────────
export const FORMATS_BY_ENTITY = Object.freeze({
    organization: Object.freeze([
        Object.freeze({ id: 'coop',       title: 'Cooperativa',         hint: 'Capital social · sòcies cooperatives · 1 vot/persona',                vna_zoom: 'mid',    ambition: 'standard' }),
        Object.freeze({ id: 'assoc',      title: 'Associació',          hint: 'Sense ànim de lucre · assemblea general',                              vna_zoom: 'mid',    ambition: 'standard' }),
        Object.freeze({ id: 'ong',        title: 'ONG',                 hint: 'Tercer sector · finançament mixt · impacte social',                    vna_zoom: 'micro',  ambition: 'max'      }),
        Object.freeze({ id: 'fundacio',   title: 'Fundació',            hint: 'Patrimoni dotacional · objectiu d\'interès general',                   vna_zoom: 'macro',  ambition: 'standard' }),
        Object.freeze({ id: 'colla',      title: 'Colla / Matriu',      hint: 'Comunitat de pràctica · castellers · model TT',                        vna_zoom: 'micro',  ambition: 'max'      }),
    ]),
    business: Object.freeze([
        Object.freeze({ id: 'sl',         title: 'SL · Societat Limitada', hint: 'Capital mínim · soci(s) limitada responsabilitat',                  vna_zoom: 'mid',    ambition: 'standard' }),
        Object.freeze({ id: 'slu',        title: 'SLU · SL Unipersonal',  hint: 'SL amb un únic soci',                                                 vna_zoom: 'macro',  ambition: 'light'    }),
        Object.freeze({ id: 'autonom',    title: 'Autònom',               hint: 'Persona física · alta seg. social · règim simplificat',              vna_zoom: 'macro',  ambition: 'light'    }),
        Object.freeze({ id: 'startup',    title: 'Startup',               hint: 'Vector creixement · inversió · vesting',                              vna_zoom: 'micro',  ambition: 'max'      }),
    ]),
    sos: Object.freeze([
        Object.freeze({ id: 'sos_federat', title: 'SoS federat',          hint: 'Múltiples SOS coordinats via permaweb/protocol',                      vna_zoom: 'micro',  ambition: 'max'      }),
        Object.freeze({ id: 'permaweb',    title: 'Permaweb / Arweave',   hint: 'Local-first + ancoratge descentralitzat',                             vna_zoom: 'mid',    ambition: 'max'      }),
        Object.freeze({ id: 'protocol',    title: 'Protocol obert',       hint: 'Standard · governança col·laborativa · interop',                      vna_zoom: 'micro',  ambition: 'max'      }),
    ]),
    project_internal: Object.freeze([
        Object.freeze({ id: 'feature',  title: 'Feature pack',     hint: 'Conjunt de funcionalitats noves dins una app',                              vna_zoom: 'macro',  ambition: 'light'    }),
        Object.freeze({ id: 'service',  title: 'Línia de servei',  hint: 'Nou servei dins una org existent',                                          vna_zoom: 'mid',    ambition: 'standard' }),
        Object.freeze({ id: 'pilot',    title: 'Pilot · R&D',      hint: 'Experiment per validar hipòtesis · curt termini',                           vna_zoom: 'macro',  ambition: 'light'    }),
        Object.freeze({ id: 'spike',    title: 'Spike tècnic',     hint: 'Investigació tècnica · 1-2 setmanes · descart si no aporta',               vna_zoom: 'macro',  ambition: 'light'    }),
    ]),
});

// listFormats · pure · retorna formats per entity_type · [] si invàlid
export function listFormats(entityType) {
    const arr = FORMATS_BY_ENTITY[entityType];
    return arr ? arr.slice() : [];
}

// resolveSuggestion · pure · combina entity_type+format en suggestion ready
// per pre-fill el form de /create. Retorna ·
//   { entity_type, format, vna_zoom, ambition, generationMode, descriptionHint }
//
// Si format no aplica · agafa el primer · si entity_type no existeix · null.
export function resolveSuggestion(entityType, formatId) {
    if (!entityType || !FORMATS_BY_ENTITY[entityType]) return null;
    const formats = FORMATS_BY_ENTITY[entityType];
    const fmt = formats.find(f => f.id === formatId) || formats[0];

    // generationMode default · 'ai-driven' sempre · però respecta light → template
    // PR-J · IA sempre per defecte · si no hi ha API key · fallback a template
    // ho fa el pre-flight check de ProjectCreationV2View
    const generationMode = 'ai-driven';

    const descriptionHint = _buildDescriptionHint(entityType, fmt);

    return {
        entity_type:     entityType,
        format:          fmt.id,
        format_title:    fmt.title,
        vna_zoom:        fmt.vna_zoom,
        ambition:        fmt.ambition,
        generationMode,
        descriptionHint,
    };
}

// _buildDescriptionHint · pure · genera placeholder/hint per al textarea descripció
function _buildDescriptionHint(entityType, fmt) {
    if (entityType === 'organization') {
        return `Construïm una ${fmt.title.toLowerCase()} que [el seu propòsit] · per a [a qui serveix] · operant [com s'organitza]`;
    }
    if (entityType === 'business') {
        return `${fmt.title} que ven [producte/servei] a [client] · model d'ingressos [com] · diferencial [què ens fa únics]`;
    }
    if (entityType === 'sos') {
        return `${fmt.title} que orquestra [N orgs] sota [protocol/marc comú] · valor afegit [perquè federar]`;
    }
    if (entityType === 'project_internal') {
        return `${fmt.title} dins de [org mare] · objectiu [què soluciona] · timing [setmanes/mesos]`;
    }
    return '';
}

// listEntityCards · helper UI
export function listEntityCards() {
    return ENTITY_CARDS.slice();
}
