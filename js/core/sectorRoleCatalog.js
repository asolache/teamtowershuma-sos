// =============================================================================
// TEAMTOWERS SOS V11 — SECTOR ROLE CATALOG (SECTOR-ROLE-NAMING sprint)
// Ruta · /js/core/sectorRoleCatalog.js
//
// Catàleg dels 5 rols canònics (founder · operations · creator · reviewer ·
// facilitator) amb NOMS i DESCRIPCIONS adaptats per cada sector CNAE.
//
// Objectiu · que un projecte light/template ja vegi noms específics del
// sector en lloc dels 5 noms genèrics hardcoded sempre iguals. ZERO COST IA.
//
// Si la IA està disponible (mode ai-driven) · aquest catàleg serveix de
// punt de partida i la IA pot polish-ar encara més.
//
// Cada entrada · { name, description, typical_actor }
// Pure · zero deps · safe Node + browser.
// =============================================================================

export const SECTOR_ROLE_CATALOG_VERSION = 'v1.0';

// Helper · estructura interna · 5 rols per sector
function R(name, description, typical_actor) {
    return Object.freeze({ name, description, typical_actor });
}

// CATÀLEG · 19 sectors CNAE + UV + DEFAULT fallback
// Ordre de claus dels rols · founder → operations → creator → reviewer → facilitator
// Coincideix amb defaultBalanced.ROLES (mateix kind set)
export const SECTOR_ROLES = Object.freeze({

    A: {  // Agricultura · ramaderia · silvicultura · pesca
        founder:     R('Pagès Cap',          'Visió agroecològica · planificació anual · decisions sobre cultius i ramat',     'soci treballador / cap d\'explotació'),
        operations:  R('Cap de Camp',         'Coordina sembres · collites · cicles ramaders · logística de comercialització',  'cap d\'operacions'),
        creator:     R('Productor',           'Treball directe a camp · ramat · transformació primària',                        'treballador agrari'),
        reviewer:    R('Tècnic Agrari',       'Validació de qualitat · certificació ecològica · sanitat animal',                'enginyer agrònom / veterinari'),
        facilitator: R('Comunicador Pagès',   'Relació amb cooperatives · DO · clients finals · venda directa',                 'community manager rural'),
    },

    C: {  // Indústria manufacturera
        founder:     R('Director General',    'Estratègia industrial · inversions en planta · obertura de mercats',             'CEO'),
        operations:  R('Cap de Producció',    'Planificació MRP · OEE · qualitat de planta · supply chain',                     'plant manager'),
        creator:     R('Enginyer de Producte','Disseny · prototipatge · industrialització · TIME-to-market',                    'enginyer industrial'),
        reviewer:    R('Cap de Qualitat',     'ISO 9001 · auditories · control de no-conformitats',                             'quality assurance lead'),
        facilitator: R('Key Account Manager', 'Relació amb clients industrials · contractes marc · post-venda',                 'KAM'),
    },

    F: {  // Construcció
        founder:     R('Promotor',            'Visió de cartera d\'obres · finançament · permisos · risc',                       'promotor immobiliari'),
        operations:  R('Cap d\'Obra',         'Planificació de fases · subcontractació · entregues · seguretat',                 'project manager construcció'),
        creator:     R('Encarregat',          'Direcció directa de la quadrilla · materials · mà d\'obra',                       'foreman'),
        reviewer:    R('Tècnic CYM',          'Coordinació seguretat i salut · supervisió tècnica · control econòmic',           'arquitecte tècnic'),
        facilitator: R('Comercial d\'obra',   'Relació amb client final · gestió de canvis · venda d\'extres',                   'comercial'),
    },

    G: {  // Comerç a l'engròs i al detall
        founder:     R('Propietari',          'Visió de l\'oferta · mix de producte · pricing · expansió',                       'amo/sòcia'),
        operations:  R('Cap de Botiga',       'Caixes · estoc · personal · horaris · KPIs diaris',                               'store manager'),
        creator:     R('Visual Merchandiser', 'Disposició de producte · escaparate · packs · promocions',                        'merchandiser'),
        reviewer:    R('Auditor Intern',      'Inventari · mèrmes · seguretat · compliment fiscal',                              'controller'),
        facilitator: R('Customer Success',    'Relació amb clients VIP · post-venda · queixes · fidelització',                   'CS lead'),
    },

    H: {  // Transport i emmagatzematge
        founder:     R('Director de Flota',   'Estratègia de rutes · inversió en vehicles · partnerships',                       'CEO transport'),
        operations:  R('Coordinador d\'Operacions','Planificació diària de rutes · tripulació · combustible · ETA',              'ops manager'),
        creator:     R('Conductor / Mariner', 'Execució de la ruta · documentació de càrrega · safety',                          'driver / sailor'),
        reviewer:    R('Inspector de Trànsit','Manteniment preventiu · ITV · compliment normatiu',                                'fleet auditor'),
        facilitator: R('Atenció al Client',   'Comunicació amb expedidor i receptor · POD · incidències',                        'CS shipping'),
    },

    I: {  // Hostaleria
        founder:     R('Restaurador',         'Concepte gastronòmic · ubicació · inversió · expansió',                           'chef-amo / hotelier'),
        operations:  R('Maître / Cap de Cuina','Coordinació de servei · escandall · staff · qualitat hostalera',                 'maître / executive chef'),
        creator:     R('Cuiner / Cambrer',    'Execució del servei diari · plat / sala',                                          'sous-chef / waiter'),
        reviewer:    R('Cap de Sales',        'Atenció al detall · estàndard de qualitat · reviews online',                       'F&B manager'),
        facilitator: R('Marketing / Events',  'Captació · esdeveniments · partenariats locals · xarxes',                          'event manager'),
    },

    J: {  // Informació i comunicacions (TIC, software, telecom)
        founder:     R('CTO Founder',         'Visió tècnica · arquitectura · stack · roadmap de producte',                       'CTO / tech founder'),
        operations:  R('Product Manager',     'Priorització · roadmap · stakeholders · mètriques producte',                       'PM'),
        creator:     R('Engineering Lead',    'Implementació · code review · arquitectura · mentoring tècnic',                    'staff engineer / tech lead'),
        reviewer:    R('QA Engineer',         'Testing · CI/CD · QA manual i automatitzat · release safety',                      'QA / SDET'),
        facilitator: R('Engineering Manager', 'People management · processos · cerimònies àgils · hiring',                        'EM'),
    },

    K: {  // Finances i assegurances
        founder:     R('Managing Partner',    'Estratègia · captació de fons · regulació · risc reputacional',                    'partner'),
        operations:  R('COO Financer',        'Operativa diària · compliance · ALM · reporting',                                  'COO'),
        creator:     R('Analista Sènior',     'Modelització · valoracions · pricing · papers per al comité',                       'senior analyst'),
        reviewer:    R('Risk & Compliance',   'KYC · AML · auditoria interna · regulació',                                        'compliance officer'),
        facilitator: R('Relationship Manager','Relació amb clients institucionals · onboarding · seguiment',                       'RM'),
    },

    L: {  // Activitats immobiliàries
        founder:     R('CEO Immobiliari',     'Visió de cartera · inversió · sortida · finançament',                              'CEO real estate'),
        operations:  R('Cap d\'Operacions',   'Gestió diària de propietats · lloguers · manteniment',                              'property operations'),
        creator:     R('Asset Manager',       'Valor afegit · reformes · estratègia per propietat',                                'asset manager'),
        reviewer:    R('Due Diligence',       'Anàlisi de risc · valoracions · legal · estructural',                               'DD analyst'),
        facilitator: R('Agent Comercial',     'Captació · venda · lloguer · client final',                                          'real estate agent'),
    },

    M: {  // Activitats professionals · científiques · tècniques (consultoria)
        founder:     R('Managing Partner',    'Visió de la firma · pràctica principal · partner-track · negocis',                  'partner'),
        operations:  R('Director d\'Operacions','Utilization · pricing · pipeline · qualitat lliurable',                            'COO consulting'),
        creator:     R('Consultor Sènior',    'Lead engagement · client delivery · framework propi',                                'senior consultant'),
        reviewer:    R('Methodology Reviewer','Garantia metodològica · peer review · qualitat dels lliurables',                    'QA consulting'),
        facilitator: R('Client Success',      'Relació amb clients · seguiment post-projecte · upsell',                             'CSM consulting'),
    },

    N: {  // Activitats administratives i serveis auxiliars
        founder:     R('Director Comercial',  'Estratègia de serveis · expansió · contractes marc',                                'commercial director'),
        operations:  R('Coordinador General', 'Planificació de serveis · staff · clients actius',                                  'service coordinator'),
        creator:     R('Tècnic de Servei',    'Execució del servei contractat (neteja · seguretat · etc.)',                        'field operative'),
        reviewer:    R('Supervisor de Qualitat','Auditoria del servei · feedback de client · KPIs',                                  'service supervisor'),
        facilitator: R('Comercial de Servei', 'Relació diària amb client · facturació · ampliació de servei',                       'account manager'),
    },

    P: {  // Educació
        founder:     R('Director Pedagògic',  'Visió educativa · línies metodològiques · selecció de professorat',                'principal'),
        operations:  R('Coordinador Acadèmic','Calendaris · horaris · assignacions · estàndards d\'avaluació',                      'academic coordinator'),
        creator:     R('Docent',              'Programació · classes · materials · seguiment individualitzat',                      'teacher'),
        reviewer:    R('Cap d\'Estudis',      'Avaluació de centre · revisió de rendiment · plans de millora',                      'head of studies'),
        facilitator: R('Tutoria de Famílies', 'Relació amb famílies · seguiment de l\'alumne · reunions',                            'family liaison'),
    },

    Q: {  // Activitats sanitàries i serveis socials
        founder:     R('Director Mèdic',      'Visió clínica · cartera de serveis · innovació · acords amb mútues',                'medical director'),
        operations:  R('Cap d\'Admissions',   'Agenda mèdica · ocupació · derivacions · facturació',                                 'practice manager'),
        creator:     R('Facultatiu',          'Atenció directa al pacient · diagnòstic · tractament',                                 'doctor / nurse'),
        reviewer:    R('Cap de Qualitat Assistencial','Protocols · auditoria de casos · seguretat del pacient',                       'clinical QA lead'),
        facilitator: R('Treballador Social',  'Acompanyament psicosocial · derivacions · suport familiar',                            'social worker'),
    },

    R: {  // Arts · oci · entreteniment
        founder:     R('Director Artístic',   'Visió creativa · línia editorial · contractació artística',                            'artistic director'),
        operations:  R('Producció Executiva', 'Pressupost · calendari · contractació · drets',                                        'executive producer'),
        creator:     R('Artista',             'Creació de l\'obra · interpretació · postproducció',                                   'performer / creator'),
        reviewer:    R('Crítica i Dramatúrgia','Lectura · revisió artística · adequació al públic',                                    'dramaturg'),
        facilitator: R('Comunicació & Booking','Premsa · venda d\'entrades · captació d\'esdeveniments',                                'booking agent'),
    },

    S: {  // Altres serveis · cultura · cooperatives ciutadanes
        founder:     R('Sòcia Fundadora',     'Visió comunitària · valor cooperatiu · governança',                                    'founding member / president'),
        operations:  R('Coordinadora',         'Activitats · pressupost · staff · relació amb administracions',                        'general coordinator'),
        creator:     R('Activista / Tallerista','Execució de tallers · serveis a sòcies · projectes vius',                              'volunteer / educator'),
        reviewer:    R('Cap d\'Avaluació',     'Memòria anual · indicadors d\'impacte · reportatge a finançadors',                     'impact manager'),
        facilitator: R('Comunitat & Comms',    'Relació amb la xarxa · campanyes · captació de sòcies',                                'community manager'),
    },

    T: {  // Llars com a empleadores
        founder:     R('Família empleadora',  'Decisions sobre el servei · contractació · pressupost',                                'employer-household'),
        operations:  R('Coordinador d\'Hores','Horaris · vacances · seguretat social',                                                 'household manager'),
        creator:     R('Persona empleada',    'Servei domèstic · cura · neteja · educació',                                            'domestic worker'),
        reviewer:    R('Inspecció Laboral',   'Compliment Conveni · prevenció · drets laborals',                                       'labor inspector'),
        facilitator: R('Mediació',            'Comunicació entre família i persona empleada',                                          'mediator'),
    },

    UV: {  // Organismes internacionals
        founder:     R('Secretari General',   'Visió internacional · diplomacia · agenda',                                            'secretary general'),
        operations:  R('Cap d\'Estat Major',  'Coordinació interdepartamental · pressupost · personal',                                'chief of staff'),
        creator:     R('Diplomàtic',          'Negociació · representació · informes',                                                  'diplomat'),
        reviewer:    R('Inspector General',   'Compliance · auditories · transparència',                                                'inspector general'),
        facilitator: R('Public Affairs',      'Comunicació · stakeholders · ONGs · societat civil',                                    'public affairs officer'),
    },

    // ─── Fallback genèric si el sector no es coneix · noms encara millors que
    // els hardcoded del template default ─────────────────────────────────
    DEFAULT: {
        founder:     R('Fundador',            'Visió · pacte de socis · estratègia',                                                    'founder'),
        operations:  R('Operacions',          'Coordinació diària · prioritats · resolució de bloquejos',                               'operations lead'),
        creator:     R('Productor',           'Execució del lliurable · iteració · qualitat tècnica',                                   'maker / specialist'),
        reviewer:    R('Revisor',              'Audit · feedback · garantia de qualitat',                                                'reviewer / QA'),
        facilitator: R('Facilitador',         'Comunicació · ritual de col·laboració · connexió externa',                              'facilitator'),
    },
});

// Aliases · alguns templates usen kinds lleugerament diferents (pm vs operations)
const KIND_ALIAS = Object.freeze({
    pm:           'operations',
    coder:        'creator',
    qa:           'reviewer',
    founder_anchor:'founder',
    visioner:     'founder',
    architect:    'operations',
    cohort_manager:'facilitator',
    sentinel:     'reviewer',
});

function _resolveKind(kind) {
    if (!kind) return null;
    const k = String(kind).toLowerCase();
    return KIND_ALIAS[k] || k;
}

// getRoleForSector · pure · retorna { name, description, typical_actor } o null
export function getRoleForSector(sectorCnae, kind) {
    const sector = (sectorCnae && SECTOR_ROLES[String(sectorCnae).toUpperCase()]) ? SECTOR_ROLES[String(sectorCnae).toUpperCase()] : SECTOR_ROLES.DEFAULT;
    const k = _resolveKind(kind);
    return sector[k] || sector.founder || null;
}

// adaptRolesBySector · pure · pren un array de roles i retorna còpia amb
// name + description sobrescrits pel catàleg sectorial · preserva tot els
// altres camps (id, kind, castell_level, roleSlug, etc.)
//
// args ·
//   roles · array · cada role amb { id, kind, name, ... }
//   sectorCnae · 'A'..'T' | 'UV' | null
//
// Retorna array nou (no muta input) · els roles que NO tenen kind no es modifiquen.
export function adaptRolesBySector(roles, sectorCnae) {
    if (!Array.isArray(roles)) return [];
    return roles.map(r => {
        if (!r || !r.kind) return r;
        const adapted = getRoleForSector(sectorCnae, r.kind);
        if (!adapted) return r;
        return {
            ...r,
            name:          adapted.name,
            description:   adapted.description,
            typical_actor: adapted.typical_actor,
        };
    });
}

// listSectorCodes · helper UI · llista els CNAE codis suportats
export function listSectorCodes() {
    return Object.keys(SECTOR_ROLES).filter(k => k !== 'DEFAULT');
}
