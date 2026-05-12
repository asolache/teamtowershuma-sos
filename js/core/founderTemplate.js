// =============================================================================
// TEAMTOWERS SOS V11 — FOUNDER PROJECT TEMPLATE (FOUNDER-001 sprint A)
//
// Builder pur del **projecte fundacional** del founder/creador de SOS.
// Genera el corpus operatiu d'@alvaro · accessible per a la xarxa via
// publishProjectToPermaweb · clonable per altres operadors com a seed.
//
// Decisions @alvaro:
//   - Founder bootstrap és un projecte sector A (Agricultura/Antifragility)
//     i alhora és el manifest de SOS · auto-referent
//   - Roles · 9 funcions clau del fundador (visió · execució · cohort · etc.)
//   - Transactions · 12 flows que descriuen com el founder fa SOS escalable
//   - 5 SOPs operatius bàsics + 3 workshops base
//   - Tots els camps pre-omplerts amb purpose + presentation_narrative_v1
//     de manera que el `projectQualityService` doni score ≥80 de partida
//
// El projecte resultant es pot publicar a permaweb amb versionat
// (PROJ-VERSIONING-001) · cada update genera una v+1 link to previous.
// =============================================================================

import { taxonomicTagsForProject, taxonomicTagsForRole, mergeTags } from './semanticTagger.js';

export const FOUNDER_PROJECT_DEFAULTS = Object.freeze({
    creatorHandle: '@alvaro',
    sectorId:      'A',                                     // Agricultura del futur · Antifragility
    subtypeId:     'antifragility-org-design',
    projectType:   'foundational-network',                  // Matriu unique type
    cohortNumber:  0,
    scope:         'public',
    multiplier:    1.5,
    tags:          ['founder', 'matriu', 'cohort-0', 'fent-pinya', 'alfa'],
});

// 9 funcions claus del fundador (basat en arquetips Castellers + ops)
export const FOUNDER_ROLES = Object.freeze([
    Object.freeze({ id: 'visioner',       name: 'Visioner · Cap de Colla',   castell_level: 'pom_de_dalt', description: 'Defineix la direcció estratègica del moviment SOS · veu macroscòpica · pren decisions de prioritats absolutes.',                       typical_actor: '@alvaro · founder',                  tags: ['vision','strategy'] }),
    Object.freeze({ id: 'arquitecte',     name: 'Arquitecte · System Lead',  castell_level: 'tronc',       description: 'Dissenya l\'arquitectura tècnica del SOS · KB · permaweb · IA · wallets · fa que el sistema escali sense fricció.',                  typical_actor: 'Tech lead delegat',                  tags: ['architecture','tech'] }),
    Object.freeze({ id: 'narrador',       name: 'Narrador · Storyteller',    castell_level: 'tronc',       description: 'Tradueix la complexitat del SOS en presentacions enteses per stakeholders (inversors · cohort · CoP).',                                typical_actor: 'Bard Narrator agent + humà',         tags: ['comms','narrative'] }),
    Object.freeze({ id: 'matriuger',      name: 'Matriuger · Cohort Ops',    castell_level: 'pinya',       description: 'Gestiona les 108 places de Cohort 0 · onboarding · pacts · onboarding tasks · membership lifecycle.',                                  typical_actor: 'Cohort lead + agents',               tags: ['cohort','ops'] }),
    Object.freeze({ id: 'sentinel',       name: 'Sentinel · Trust Auditor',  castell_level: 'laterals',    description: 'Audita firmes ECDSA · verifica que els publishes al permaweb són legítims · detecta abusos a la xarxa.',                                  typical_actor: 'TDD Auditor agent + delegat humà',   tags: ['security','trust'] }),
    Object.freeze({ id: 'curator',        name: 'Curator · Knowledge Base',  castell_level: 'pinya',       description: 'Manté el corpus de coneixement universal SOS · sectores · SOPs · skills · workshops · taxonomies.',                                     typical_actor: 'Dharma Ontologist agent + humà',     tags: ['knowledge','curation'] }),
    Object.freeze({ id: 'token-econ',     name: 'Token Economist',           castell_level: 'tronc',       description: 'Dissenya l\'economia de saldos · marges Stripe · revenue split coop · pricing IA · workshops premium.',                                 typical_actor: 'Token Economist agent + humà',       tags: ['economics','billing'] }),
    Object.freeze({ id: 'connector',      name: 'Connector · Network Weaver',castell_level: 'mans',        description: 'Posa en contacte projectes de la xarxa · facilita transaccions entre operadors · activa CoPs.',                                         typical_actor: 'Synaptic Weaver agent + humà',       tags: ['network','matchmaking'] }),
    Object.freeze({ id: 'founder-anchor', name: 'Founder Anchor',            castell_level: 'baixos',      description: 'L\'usuari humà que sosté la responsabilitat ètica + legal del SOS. Mai delegable. Aquest rol és el que activa la propietat distribuïda.', typical_actor: '@alvaro · únic',                     tags: ['anchor','founder'] }),
]);

// 12 transactions · flows essencials del moviment SOS
export const FOUNDER_TRANSACTIONS = Object.freeze([
    // Cicles tronc-pinya (estructura)
    Object.freeze({ id:'tx-vision-arq-i',   from:'visioner',   to:'arquitecte',  deliverable:'Direcció estratègica + criteris no-negociables', type:'intangible', is_must:true,  frequency:'mensual' }),
    Object.freeze({ id:'tx-arq-vision-t',   from:'arquitecte', to:'visioner',    deliverable:'Status del SOS · features shipped · roadmap viu',  type:'tangible',   is_must:true,  frequency:'setmanal' }),
    Object.freeze({ id:'tx-narrador-coh-t', from:'narrador',   to:'matriuger',   deliverable:'Pitch decks + onboarding materials per cohort',    type:'tangible',   is_must:true,  frequency:'mensual' }),
    Object.freeze({ id:'tx-coh-narrador-i', from:'matriuger',  to:'narrador',    deliverable:'Feedback dels candidats · què entenen · què no',   type:'intangible', is_must:false, frequency:'mensual' }),
    // Cicles pinya-baixos (ètica)
    Object.freeze({ id:'tx-sentinel-anc-t', from:'sentinel',   to:'founder-anchor', deliverable:'Reports d\'auditoria + anomalies detectades', type:'tangible',   is_must:true,  frequency:'setmanal' }),
    Object.freeze({ id:'tx-anc-sentinel-i', from:'founder-anchor', to:'sentinel', deliverable:'Decisió final sobre abusos · who gets banned',  type:'intangible', is_must:true,  frequency:'mensual' }),
    // Cicles laterals (knowledge)
    Object.freeze({ id:'tx-cur-arq-t',      from:'curator',    to:'arquitecte',  deliverable:'Schemas + taxonomies actualitzades del KB',        type:'tangible',   is_must:true,  frequency:'mensual' }),
    Object.freeze({ id:'tx-arq-cur-t',      from:'arquitecte', to:'curator',     deliverable:'Migration scripts + new node types',               type:'tangible',   is_must:false, frequency:'mensual' }),
    // Economia
    Object.freeze({ id:'tx-tok-coh-t',      from:'token-econ', to:'matriuger',   deliverable:'Pricing taula + revenue split cohort',             type:'tangible',   is_must:true,  frequency:'trimestral' }),
    Object.freeze({ id:'tx-conn-narr-t',    from:'connector',  to:'narrador',    deliverable:'Casos d\'èxit de la xarxa · històries reals',      type:'tangible',   is_must:false, frequency:'mensual' }),
    // Cicles macroscòpics
    Object.freeze({ id:'tx-anc-vision-i',   from:'founder-anchor', to:'visioner', deliverable:'Marc ètic · què es nego a fer · línies vermelles',type:'intangible', is_must:true,  frequency:'trimestral' }),
    Object.freeze({ id:'tx-conn-anc-i',     from:'connector',  to:'founder-anchor', deliverable:'Senyals de pertinença a la xarxa · trust signals', type:'intangible', is_must:false, frequency:'setmanal' }),
]);

// 5 SOPs operatius base · roleId per fixar al curator + onboarding
export const FOUNDER_SOPS = Object.freeze([
    Object.freeze({ id:'sop-found-onboard', roleId:'matriuger',   title:'Onboarding cohort 0 · 10 setmanes',
        steps: [
            'Setmana 1 · presentació individual · DID + perfil signat + Wander connect',
            'Setmana 2 · cohort intro · 108 places explanation · pact de socis',
            'Setmana 3 · primer projecte clonat des de template · sector triat',
            'Setmana 4-6 · construcció mapa de valor + workshops base',
            'Setmana 7-8 · SOPs operatius per rol + saldo prepagat carregat',
            'Setmana 9 · publish del projecte al permaweb · entry verificada',
            'Setmana 10 · graduation · access permanent a CoPs',
        ],
    }),
    Object.freeze({ id:'sop-found-publish', roleId:'arquitecte',  title:'Publish entry al permaweb · checklist',
        steps: [
            'Validar que l\'entry passa validatePublicRegistryEntry (zero camps prohibits)',
            'Verificar firma amb verifyRegistryEntry abans de pagar',
            'Comprovar saldo del wallet del projecte ≥ 0,05€',
            'Si extensió Wander disponible · prefereix-la (sense JWK)',
            'Si keyfile JSON · validar amb addressFromJwk',
            'Pujar amb tags estàndard · App-Name=SOS-V11 + Entry-Type + Version',
            'Confirmar txId + actualitzar entry.content.arweaveTxId + persistir KB',
        ],
    }),
    Object.freeze({ id:'sop-found-audit',   roleId:'sentinel',    title:'Audit firmes setmanal · checklist',
        steps: [
            'Pull syncFromPermaweb dels últims 7 dies',
            'Per a cada entry · verifyRegistryEntry · si fail · log a sentinel-anomalies',
            'Encreuar amb getProjectVersionHistory · detect chains amb version skips',
            'Reportar a founder-anchor amb {entry, reason, recommended action}',
            'Si confirmat abús · revokeFromPermaweb + permaban del DID',
        ],
    }),
    Object.freeze({ id:'sop-found-pricing', roleId:'token-econ',  title:'Revisió trimestral de pricing',
        steps: [
            'Pull costos reals per provider IA · comparar amb routing matrix',
            'Ajustar pesos d\'AI_MODELS pricing al aiRouterService',
            'Calcular marge mig · si <5% · revisar margin model',
            'Proposar canvis a Stripe Payment Links si cal',
            'Publicar canvis com a nova versió del projecte fundacional',
        ],
    }),
    Object.freeze({ id:'sop-found-cohort',  roleId:'visioner',    title:'Decisió de cohort capacity + multiplier',
        steps: [
            'Avaluar adopció cohort actual · % places omplertes',
            'Decidir si obrir nova cohort N+1 · capacitat suggerida',
            'Definir multiplier (cohort 1 = ×1.4 · cohort 2 = ×1.3 · descreixent)',
            'Comunicar via narrador a la xarxa · publish update al permaweb',
            'Actualitzar matriuTemplate.js amb constants noves',
        ],
    }),
]);

// 3 workshops base · clonables per altres founders
export const FOUNDER_WORKSHOPS = Object.freeze([
    Object.freeze({ id:'ws-found-intro',     title:'Què és el SOS · 90 min',          audience:'founders', accessTier:'public',   outline:'Visió + mètode + casos d\'ús · obert' }),
    Object.freeze({ id:'ws-found-method',    title:'Mètode SOS pas a pas · 3h',       audience:'operators', accessTier:'operator', outline:'Wizard project · value map · SOPs · permaweb publish' }),
    Object.freeze({ id:'ws-found-cohort',    title:'Cohort 0 deep dive · 6h',         audience:'cohort',    accessTier:'cohort',   cohortNumber:0, outline:'Pact socis · multiplier · responsabilitats fundacionals' }),
]);

// Camps top-level del projecte fundacional · per a `projectQuality` ≥80
export const FOUNDER_PROJECT_FIELDS = Object.freeze({
    purpose:        'Construir un sistema operatiu col·laboratiu de propietat distribuïda (Slicing Pie + FairShares) que escali la praxi del Fent Pinya a qualsevol sector productiu, anclat al permaweb i amb economia de saldo prepagat transparent.',
    description:    'TeamTowers SOS V11 és un local-first KB + permaweb federation que permet a operadors humans + agents IA dissenyar i operar projectes amb contabilitat de valor real. El founder anchor sosté la responsabilitat ètica i el llinatge fundacional · el sistema mateix és un projecte SOS que demostra el mètode.',
    presentation_narrative_v1: '# SOS · el Sistema Operatiu Col·laboratiu\n\n**Tots tenim dues estructures · aquesta mapeja la real.**\n\nSOS V11 és la plataforma que permet a qualsevol organització dissenyar la seva xarxa de valor amb roles + transactions + entregables · executar work orders amb humans+agents IA · contabilitzar valor amb Slicing Pie + FairShares · i publicar la identitat i els acords al permaweb · sense backend central · sense rendir comptes a ningú.\n\nLa Matriu Cohort 0 (108 places) és l\'epicentre del moviment.',
});

// buildFounderProject · pura · genera el projecte sencer fundacional.
// El consumidor crida `store.dispatch(addProject(...))` per al projecte i
// `KB.upsert` per als SOPs + workshops · després publishProjectToPermaweb.
export function buildFounderProject({
    creatorHandle = FOUNDER_PROJECT_DEFAULTS.creatorHandle,
    projectId     = null,                       // si null · es genera automàticament
    ts            = null,                       // injectable per a tests
} = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    const id = projectId || ('proj-founder-' + creatorHandle.replace(/^@/, '') + '-' + now.toString(36));
    const project = {
        id,
        nombre:        'SOS Founder · Manifest fundacional · ' + creatorHandle,
        name:          'SOS Founder · ' + creatorHandle,
        sector_id:     FOUNDER_PROJECT_DEFAULTS.sectorId,
        subtype_id:    FOUNDER_PROJECT_DEFAULTS.subtypeId,
        projectType:   FOUNDER_PROJECT_DEFAULTS.projectType,
        cohortNumber:  FOUNDER_PROJECT_DEFAULTS.cohortNumber,
        scope:         FOUNDER_PROJECT_DEFAULTS.scope,
        description:   FOUNDER_PROJECT_FIELDS.description,
        purpose:       FOUNDER_PROJECT_FIELDS.purpose,
        presentation_narrative_v1: FOUNDER_PROJECT_FIELDS.presentation_narrative_v1,
        createdAt:     now,
        updatedAt:     now,
        isArchived:    false,
        creatorHandle,
        vna_roles:     FOUNDER_ROLES.map(r => ({ ...r })),
        vna_transactions: FOUNDER_TRANSACTIONS.map(t => ({ ...t })),
        vna_flows:     [],
        roles:         [],
        ledger:        [],
        telemetry:     [],
        workOrders:    [],
        tags:          FOUNDER_PROJECT_DEFAULTS.tags.slice(),
    };
    // Tagger automàtic semàntic
    try {
        const auto = taxonomicTagsForProject({ project });
        if (Array.isArray(auto)) project.tags = mergeTags(project.tags, auto);
    } catch (_) { /* tagger optional */ }

    // SOPs amb projectId + body markdown auto-generat dels steps
    const sops = FOUNDER_SOPS.map(s => ({
        id:        s.id + '-' + id,
        type:      'sop',
        content: {
            projectId: id,
            roleId:    s.roleId,
            title:     s.title,
            body:      s.steps.map((step, i) => (i + 1) + '. ' + step).join('\n\n'),
            steps:     s.steps.slice(),
            createdBy: creatorHandle,
            kind:      'project-role-sop',
        },
        keywords:  ['type:sop', 'projectId:' + id, 'roleId:' + s.roleId, 'founder-bootstrap'],
        createdAt: now,
        updatedAt: now,
    }));

    // Workshops amb projectId + accessTier · alineat WORKSHOPS-FED-001
    const workshops = FOUNDER_WORKSHOPS.map(w => ({
        id:        w.id + '-' + id,
        type:      'workshop',
        content: {
            projectId:    id,
            title:        w.title,
            audience:     w.audience,
            accessTier:   w.accessTier,
            cohortNumber: typeof w.cohortNumber === 'number' ? w.cohortNumber : null,
            outline:      w.outline,
            createdBy:    creatorHandle,
        },
        keywords:  ['type:workshop', 'projectId:' + id, 'audience:' + w.audience, 'tier:' + w.accessTier, 'founder-bootstrap'],
        createdAt: now,
        updatedAt: now,
    }));

    // Mètriques per inspecció ràpida (dashboard)
    const stats = {
        roles:         project.vna_roles.length,
        transactions:  project.vna_transactions.length,
        sops:          sops.length,
        workshops:     workshops.length,
        intangibles:   project.vna_transactions.filter(t => t.type === 'intangible').length,
    };

    return { project, sops, workshops, stats };
}
