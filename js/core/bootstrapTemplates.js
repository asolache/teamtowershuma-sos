// TEAMTOWERS SOS V11 — PROJECT BOOTSTRAP TEMPLATES (MAT-003 sprint E)
//
// 12 plantillas (una por cada PROJECT_TYPE) que conectan:
//   - sectores SOS (KnowledgeLoader · A..S)
//   - los 12 guardianes Pantheon Work
//   - los 96 roles operativos de la cohort + las 90 skills
//   - el ValueMapView (seed roles + transactions con sequence_order)
//   - el bootstrap de SOPs canónicos del Mètode SOS
//
// Resultado · cuando un fundador reserva su seient con "tipus =
// comunitat-autosuficient", el proyecto creado YA TIENE:
//   - 5 roles preasignados (heredats dels sectors afins)
//   - 6 transactions seqüenciades (phase + sequence_order)
//   - 8 SOPs canònics amb DTD
//   - 4 guardians objectiu (a buscar en l'enjambre)
//   - sectorAffinity per al matchmaker IA
//   - expectedOutcomes amb ranges quantitatius
//
// Helpers:
//   getBootstrapTemplate(typeId)          → plantilla completa
//   bootstrapMapForProject({typeId, projectId, multiplier?}) → seed
//                                          listo para inyectar
//   listAllBootstrapTemplates()           → array de las 12
//   validateBootstrapTemplate(t)          → bool · usado en tests
//   expectedSopsCountFor(typeId)          → {min, max, midpoint}

import { PROJECT_TYPES, PANTHEON_GUARDIANS, getProjectTypeById } from './critical108Roles.js';
import { SKILL_TAXONOMY } from './skillTaxonomy.js';

// 4 fases canónicas del Antigravity Engine (alineadas con detectProjectPhase
// de navService.js)
export const PHASES = Object.freeze(['design', 'build', 'operate', 'ledger']);

// ── 12 plantillas (Object.freeze profundo) ──────────────────────────

function freezeTemplate(t) {
    return Object.freeze({
        ...t,
        sectorAffinity:     Object.freeze(t.sectorAffinity || []),
        requiredGuardians:  Object.freeze(t.requiredGuardians || []),
        bootstrapSops:      Object.freeze(t.bootstrapSops || []),
        valueMapSeed: Object.freeze({
            roles:        Object.freeze((t.valueMapSeed?.roles || []).map(r => Object.freeze({ ...r }))),
            transactions: Object.freeze((t.valueMapSeed?.transactions || []).map(tr => Object.freeze({ ...tr }))),
        }),
        expectedOutcomes: Object.freeze({ ...(t.expectedOutcomes || {}) }),
    });
}

export const PROJECT_BOOTSTRAP_TEMPLATES = Object.freeze([

    // ── 01 · comunitat-autosuficient (hortet · ateneu · cura) ──
    freezeTemplate({
        typeId:            'comunitat-autosuficient',
        sectorAffinity:    ['A', 'N', 'Q'],   // agricultura · cuidados · educació
        requiredGuardians: ['demeter', 'hestia', 'hermes', 'hera'],
        bootstrapSops: [
            { id: 'onboarding-membre',     phase: 'design',  label: "Onboarding de nou membre" },
            { id: 'pacte-fundacional',     phase: 'design',  label: 'Pacte de socis dinàmic' },
            { id: 'gestio-collita',        phase: 'operate', label: 'Gestió de collita setmanal' },
            { id: 'sessions-cura',         phase: 'operate', label: 'Sessions de cura mútua' },
            { id: 'auditoria-trimestral',  phase: 'ledger',  label: 'Auditoria triple-entry trimestral' },
            { id: 'reunio-assemblea',      phase: 'design',  label: 'Assemblea mensual' },
            { id: 'cooperativa-veins',     phase: 'operate', label: 'Cooperació amb cooperatives veïnes' },
            { id: 'distribucio-cistelles', phase: 'operate', label: 'Distribució de cistelles als consumidors' },
        ],
        valueMapSeed: {
            roles: [
                { id: 'pages',                label: 'Pagès / pagesa',           guardianAffinity: ['demeter'] },
                { id: 'consumidor-cistella',  label: 'Consumidor (cistella)',    guardianAffinity: ['hestia'] },
                { id: 'facilitador-comu',     label: 'Facilitador comunitari',    guardianAffinity: ['hermes'] },
                { id: 'tresorera',            label: 'Tresorera',                 guardianAffinity: ['poseidon'] },
                { id: 'custodi-pacte',        label: 'Custodi del pacte',         guardianAffinity: ['hera'] },
            ],
            transactions: [
                { id: 'tx-collita',     from: 'pages',               to: 'consumidor-cistella', deliverable: 'Cistella setmanal',         phase: 'operate', sequence_order: 1, tangible: true,  must: true },
                { id: 'tx-pagament',    from: 'consumidor-cistella', to: 'tresorera',           deliverable: 'Pagament cistella',         phase: 'operate', sequence_order: 2, tangible: true,  must: true },
                { id: 'tx-equity-pages',from: 'tresorera',           to: 'pages',               deliverable: 'Equity slicing pie',         phase: 'ledger',  sequence_order: 3, tangible: true,  must: true },
                { id: 'tx-facilita',    from: 'facilitador-comu',    to: 'pages',               deliverable: 'Sessions de coordinació',    phase: 'operate', sequence_order: 4, tangible: false, must: false },
                { id: 'tx-pacte',       from: 'custodi-pacte',       to: 'tresorera',           deliverable: 'Validació de pacte',         phase: 'design',  sequence_order: 5, tangible: false, must: true },
                { id: 'tx-reputacio',   from: 'consumidor-cistella', to: 'pages',               deliverable: 'Reputació + reconeixement',  phase: 'ledger',  sequence_order: 6, tangible: false, must: false },
            ],
        },
        expectedOutcomes: { sopsCountMin: 8, sopsCountMax: 12, weeksToOperateMin: 4, weeksToOperateMax: 8 },
        narrative: 'Una comunitat que es proveeix a si mateixa: hortet, cura, formació. El valor circula entre productors i consumidors amb pagament i reputació en temps real.',
    }),

    // ── 02 · startup-cooperativa-tradicional ───────────────────
    freezeTemplate({
        typeId:            'startup-coop-tradicional',
        sectorAffinity:    ['K', 'P'],   // tech · finance
        requiredGuardians: ['zeus', 'atenea', 'hera', 'hefesto'],
        bootstrapSops: [
            { id: 'pacte-fundacional',     phase: 'design',  label: 'Pacte fundacional dinàmic' },
            { id: 'roadmap-trimestral',    phase: 'design',  label: 'Roadmap trimestral' },
            { id: 'product-validation',    phase: 'build',   label: 'Validació de producte' },
            { id: 'ronda-prefundadora',    phase: 'operate', label: 'Ronda pre-fundadora' },
            { id: 'governance-cap-table',  phase: 'operate', label: 'Governance + cap table viu' },
            { id: 'auditoria-equity',      phase: 'ledger',  label: "Auditoria d'equity slicing pie" },
        ],
        valueMapSeed: {
            roles: [
                { id: 'fundador-ceo',  label: 'Fundador/a · CEO',           guardianAffinity: ['zeus'] },
                { id: 'fundador-cto',  label: 'Fundador/a · CTO',           guardianAffinity: ['hefesto'] },
                { id: 'pact-keeper',   label: 'Custodi del pacte',           guardianAffinity: ['hera'] },
                { id: 'inversor-pre',  label: 'Inversor pre-fundador',      guardianAffinity: ['poseidon'] },
                { id: 'mentor',        label: 'Mentor estratègic',           guardianAffinity: ['atenea'] },
            ],
            transactions: [
                { id: 'tx-codi',        from: 'fundador-cto',  to: 'fundador-ceo',  deliverable: 'Codi inicial · MVP',            phase: 'build',   sequence_order: 1, tangible: true,  must: true },
                { id: 'tx-hores',       from: 'fundador-ceo',  to: 'fundador-cto',  deliverable: 'Hores de coordinació',          phase: 'design',  sequence_order: 2, tangible: false, must: true },
                { id: 'tx-capital',     from: 'inversor-pre',  to: 'fundador-ceo',  deliverable: 'Capital pre-fundador',          phase: 'operate', sequence_order: 3, tangible: true,  must: true },
                { id: 'tx-equity-cto',  from: 'pact-keeper',   to: 'fundador-cto',  deliverable: 'Equity slicing pie · CTO',      phase: 'ledger',  sequence_order: 4, tangible: true,  must: true },
                { id: 'tx-equity-ceo',  from: 'pact-keeper',   to: 'fundador-ceo',  deliverable: 'Equity slicing pie · CEO',      phase: 'ledger',  sequence_order: 5, tangible: true,  must: true },
                { id: 'tx-mentor',      from: 'mentor',        to: 'fundador-ceo',  deliverable: 'Sessió mentoria estratègica',   phase: 'design',  sequence_order: 6, tangible: false, must: false },
            ],
        },
        expectedOutcomes: { sopsCountMin: 12, sopsCountMax: 18, weeksToOperateMin: 8, weeksToOperateMax: 16 },
        narrative: 'Startup amb pacte de socis dinàmic: el cap table evoluciona amb les aportacions reals (codi · hores · capital). Slicing pie aplicat al fundament.',
    }),

    // ── 03 · empresa-en-transicio (a SCCL · slicing pie aplicat) ──
    freezeTemplate({
        typeId:            'empresa-en-transicio',
        sectorAffinity:    [],   // depèn de l'empresa
        requiredGuardians: ['hera', 'atenea', 'zeus', 'hefesto'],
        bootstrapSops: [
            { id: 'diagnosi-inicial',          phase: 'design',  label: "Diagnòstic de l'estructura actual" },
            { id: 'slicing-pie-historic',      phase: 'design',  label: 'Slicing pie històric retroactiu' },
            { id: 'pacte-cooperatiu',          phase: 'design',  label: 'Nou pacte cooperatiu' },
            { id: 'conversio-juridica',        phase: 'build',   label: 'Conversió jurídica a SCCL' },
            { id: 'governance-circular',       phase: 'operate', label: 'Governance multi-stakeholder' },
            { id: 'comptabilitat-triple',      phase: 'operate', label: "Migració a comptabilitat triple-entry" },
            { id: 'auditoria-anual',           phase: 'ledger',  label: 'Auditoria anual cooperativa' },
        ],
        valueMapSeed: {
            roles: [
                { id: 'fundador-historic',     label: 'Fundador històric',          guardianAffinity: ['zeus'] },
                { id: 'soci-treballador',      label: 'Soci treballador',            guardianAffinity: ['hera'] },
                { id: 'facilitador-transicio', label: 'Facilitador de transició',    guardianAffinity: ['atenea'] },
                { id: 'auditor-extern',        label: 'Auditor extern',              guardianAffinity: ['poseidon'] },
                { id: 'advocat-cooperatiu',    label: 'Advocat cooperatiu',          guardianAffinity: ['hera'] },
            ],
            transactions: [
                { id: 'tx-historic',     from: 'fundador-historic', to: 'soci-treballador',      deliverable: 'Capital històric (retroactiu)', phase: 'design',  sequence_order: 1, tangible: true,  must: true },
                { id: 'tx-slicing',      from: 'facilitador-transicio', to: 'fundador-historic', deliverable: 'Slicing pie aplicat al passat',  phase: 'design',  sequence_order: 2, tangible: false, must: true },
                { id: 'tx-pacte-nou',    from: 'advocat-cooperatiu', to: 'soci-treballador',     deliverable: 'Pacte cooperatiu nou',           phase: 'build',   sequence_order: 3, tangible: false, must: true },
                { id: 'tx-conversio',   from: 'advocat-cooperatiu', to: 'fundador-historic',     deliverable: 'Estatuts SCCL',                  phase: 'build',   sequence_order: 4, tangible: true,  must: true },
                { id: 'tx-equity-nova', from: 'facilitador-transicio', to: 'soci-treballador',   deliverable: 'Equity dinàmic vigent',          phase: 'ledger',  sequence_order: 5, tangible: true,  must: true },
                { id: 'tx-auditoria',   from: 'auditor-extern',     to: 'fundador-historic',     deliverable: 'Auditoria fundacional',          phase: 'ledger',  sequence_order: 6, tangible: false, must: false },
            ],
        },
        expectedOutcomes: { sopsCountMin: 14, sopsCountMax: 20, weeksToOperateMin: 12, weeksToOperateMax: 24 },
        narrative: 'Empresa establerta es transforma a SCCL aplicant slicing pie retroactiu i nou pacte cooperatiu. Lleva més temps però lleva més impacte.',
    }),

    // ── 04 · cooperativa-multistakeholder ──────────────────────
    freezeTemplate({
        typeId:            'cooperativa-multi',
        sectorAffinity:    ['N', 'F', 'Q'],
        requiredGuardians: ['atenea', 'hera', 'hermes', 'hestia'],
        bootstrapSops: [
            { id: 'estatuts-multistakeholder', phase: 'design',  label: 'Estatuts multi-stakeholder' },
            { id: 'matrius-decision',          phase: 'design',  label: 'Matriu de decisions per stakeholder' },
            { id: 'governance-circular',       phase: 'operate', label: 'Governance circular (no jeràrquica)' },
            { id: 'auditoria-anual',           phase: 'ledger',  label: 'Auditoria anual + informe stakeholders' },
            { id: 'assemblea-multi',           phase: 'operate', label: "Assemblea multi-stakeholder anual" },
            { id: 'conflict-mediation',        phase: 'operate', label: "Mediació de conflictes inter-stakeholder" },
        ],
        valueMapSeed: {
            roles: [
                { id: 'soci-consum',       label: 'Soci de consum',          guardianAffinity: ['hestia'] },
                { id: 'soci-treball',      label: 'Soci de treball',         guardianAffinity: ['hera'] },
                { id: 'soci-servei',       label: 'Soci de servei',          guardianAffinity: ['hermes'] },
                { id: 'administrador',     label: 'Administrador rotatiu',   guardianAffinity: ['atenea'] },
                { id: 'auditor',           label: 'Auditor extern',           guardianAffinity: ['poseidon'] },
            ],
            transactions: [
                { id: 'tx-produccio',    from: 'soci-treball',  to: 'soci-consum',     deliverable: 'Producte/servei',         phase: 'operate', sequence_order: 1, tangible: true,  must: true },
                { id: 'tx-pagament',     from: 'soci-consum',   to: 'administrador',   deliverable: 'Pagament cooperatiu',     phase: 'operate', sequence_order: 2, tangible: true,  must: true },
                { id: 'tx-treball',      from: 'soci-treball',  to: 'administrador',   deliverable: 'Hores de treball',        phase: 'operate', sequence_order: 3, tangible: false, must: true },
                { id: 'tx-equity-treb',  from: 'administrador', to: 'soci-treball',    deliverable: 'Equity slicing pie',      phase: 'ledger',  sequence_order: 4, tangible: true,  must: true },
                { id: 'tx-servei',       from: 'soci-servei',   to: 'soci-consum',     deliverable: 'Servei especialitzat',    phase: 'operate', sequence_order: 5, tangible: true,  must: false },
                { id: 'tx-auditoria',    from: 'auditor',       to: 'administrador',   deliverable: 'Auditoria + informe',     phase: 'ledger',  sequence_order: 6, tangible: false, must: true },
            ],
        },
        expectedOutcomes: { sopsCountMin: 12, sopsCountMax: 16, weeksToOperateMin: 8, weeksToOperateMax: 12 },
        narrative: 'Tres tipus de socis (consum · treball · servei) coexisteixen en una governance circular. Slicing pie reparteix segons aportació real de cada stakeholder.',
    }),

    // ── 05 · fundacio-associacio-ong ───────────────────────────
    freezeTemplate({
        typeId:            'fundacio-ong',
        sectorAffinity:    ['N', 'Q', 'F'],
        requiredGuardians: ['atenea', 'hera', 'hestia', 'dionisio'],
        bootstrapSops: [
            { id: 'governanca-patronat',  phase: 'design',  label: 'Governanca del patronat' },
            { id: 'pla-estrategic',       phase: 'design',  label: 'Pla estratègic anual' },
            { id: 'captacio-fons',        phase: 'operate', label: 'Captació de fons' },
            { id: 'gestio-voluntariat',   phase: 'operate', label: 'Gestió de voluntariat' },
            { id: 'informe-impacte',      phase: 'operate', label: "Informe d'impacte trimestral" },
            { id: 'auditoria-comptable',  phase: 'ledger',  label: 'Auditoria comptable' },
        ],
        valueMapSeed: {
            roles: [
                { id: 'patro',             label: 'Patró/a',                  guardianAffinity: ['atenea'] },
                { id: 'president',         label: 'Presidència',              guardianAffinity: ['zeus'] },
                { id: 'voluntari',         label: 'Voluntari/a',              guardianAffinity: ['hestia'] },
                { id: 'donant',            label: 'Donant',                   guardianAffinity: ['poseidon'] },
                { id: 'beneficiari',       label: 'Beneficiari/a',            guardianAffinity: ['hestia'] },
            ],
            transactions: [
                { id: 'tx-donacio',     from: 'donant',     to: 'president',    deliverable: 'Donació',                   phase: 'operate', sequence_order: 1, tangible: true,  must: true },
                { id: 'tx-activitat',   from: 'voluntari',  to: 'beneficiari',  deliverable: 'Activitat solidària',       phase: 'operate', sequence_order: 2, tangible: true,  must: true },
                { id: 'tx-hores',       from: 'voluntari',  to: 'president',    deliverable: 'Hores de voluntariat',      phase: 'operate', sequence_order: 3, tangible: false, must: true },
                { id: 'tx-reputacio',   from: 'president',  to: 'voluntari',    deliverable: 'Reconeixement + reputació', phase: 'ledger',  sequence_order: 4, tangible: false, must: false },
                { id: 'tx-impacte',     from: 'beneficiari',to: 'donant',       deliverable: "Informe d'impacte",         phase: 'ledger',  sequence_order: 5, tangible: false, must: true },
                { id: 'tx-governanca',  from: 'patro',      to: 'president',    deliverable: 'Aprovació del patronat',    phase: 'design',  sequence_order: 6, tangible: false, must: true },
            ],
        },
        expectedOutcomes: { sopsCountMin: 10, sopsCountMax: 14, weeksToOperateMin: 6, weeksToOperateMax: 10 },
        narrative: 'Entitat sense ànim de lucre amb governance robusta. SOS reconeix el valor del voluntariat i el redistribueix com a reputació + accés a CoPs.',
    }),

    // ── 06 · ecosistema-regional-regeneratiu ───────────────────
    freezeTemplate({
        typeId:            'ecosistema-regional',
        sectorAffinity:    ['A', 'N', 'F', 'Q'],
        requiredGuardians: ['demeter', 'hermes', 'hestia', 'dionisio'],
        bootstrapSops: [
            { id: 'mapping-territorial',     phase: 'design',  label: 'Mapping territorial' },
            { id: 'identificacio-actors',    phase: 'design',  label: "Identificació d'actors clau" },
            { id: 'activacions-comunitat',   phase: 'operate', label: 'Activacions comunitàries' },
            { id: 'cooperatives-en-xarxa',   phase: 'operate', label: 'Coordinació de cooperatives' },
            { id: 'informes-impacte',        phase: 'operate', label: 'Informes trimestrals' },
            { id: 'governance-distribuida',  phase: 'operate', label: 'Governance distribuïda territorial' },
            { id: 'auditoria-territorial',   phase: 'ledger',  label: 'Auditoria territorial' },
        ],
        valueMapSeed: {
            roles: [
                { id: 'facilitador-territ',   label: 'Facilitador territorial',     guardianAffinity: ['hermes'] },
                { id: 'cooperativa-membre',   label: 'Cooperativa membre',          guardianAffinity: ['hestia'] },
                { id: 'admin-publica',        label: 'Administració pública',       guardianAffinity: ['atenea'] },
                { id: 'cronista',             label: 'Cronista de la xarxa',        guardianAffinity: ['dionisio'] },
                { id: 'auditor-impacte',      label: "Auditor d'impacte",            guardianAffinity: ['poseidon'] },
            ],
            transactions: [
                { id: 'tx-coop-coop',     from: 'cooperativa-membre',  to: 'cooperativa-membre', deliverable: 'Intercanvi entre cooperatives', phase: 'operate', sequence_order: 1, tangible: true,  must: true },
                { id: 'tx-ajuda-publica', from: 'admin-publica',       to: 'facilitador-territ',deliverable: 'Subvenció territorial',         phase: 'operate', sequence_order: 2, tangible: true,  must: false },
                { id: 'tx-activacio',     from: 'facilitador-territ',  to: 'cooperativa-membre', deliverable: 'Activació trimestral',          phase: 'operate', sequence_order: 3, tangible: false, must: true },
                { id: 'tx-cronica',       from: 'cronista',            to: 'facilitador-territ', deliverable: 'Crònica de la xarxa',          phase: 'operate', sequence_order: 4, tangible: false, must: false },
                { id: 'tx-impacte',       from: 'auditor-impacte',     to: 'admin-publica',     deliverable: 'Informe territorial',           phase: 'ledger',  sequence_order: 5, tangible: false, must: true },
                { id: 'tx-reputacio',     from: 'cooperativa-membre',  to: 'facilitador-territ', deliverable: 'Reputació territorial',         phase: 'ledger',  sequence_order: 6, tangible: false, must: false },
            ],
        },
        expectedOutcomes: { sopsCountMin: 16, sopsCountMax: 22, weeksToOperateMin: 12, weeksToOperateMax: 20 },
        narrative: 'Xarxa de cooperatives en un territori (comarca · biorregió). SOS coordina intercanvis i mesura impacte regeneratiu agregat.',
    }),

    // ── 07 · dao-web3 ──────────────────────────────────────────
    freezeTemplate({
        typeId:            'dao-web3',
        sectorAffinity:    ['K', 'P'],
        requiredGuardians: ['hefesto', 'atenea', 'hera', 'poseidon'],
        bootstrapSops: [
            { id: 'token-genesis',         phase: 'design',  label: 'Token genesis' },
            { id: 'multisig-setup',        phase: 'design',  label: 'Multisig setup (Gnosis Safe)' },
            { id: 'proposal-pipeline',     phase: 'operate', label: 'Pipeline de proposals + voting' },
            { id: 'multisig-execution',    phase: 'operate', label: 'Execució de propostes aprovades' },
            { id: 'token-mint',            phase: 'operate', label: 'Mint de tokens per contribució' },
            { id: 'auditoria-on-chain',    phase: 'ledger',  label: 'Auditoria on-chain pública' },
        ],
        valueMapSeed: {
            roles: [
                { id: 'dev',               label: 'Developer',                 guardianAffinity: ['hefesto'] },
                { id: 'proposer',          label: 'Proposer',                   guardianAffinity: ['atenea'] },
                { id: 'voter',             label: 'Voter (token holder)',       guardianAffinity: ['hera'] },
                { id: 'multisig-signer',   label: 'Multisig signer',            guardianAffinity: ['poseidon'] },
                { id: 'governance-facil',  label: 'Governance facilitator',     guardianAffinity: ['hermes'] },
            ],
            transactions: [
                { id: 'tx-codi',         from: 'dev',              to: 'proposer',          deliverable: 'Pull request · codi', phase: 'build',   sequence_order: 1, tangible: true,  must: true },
                { id: 'tx-proposta',     from: 'proposer',         to: 'voter',             deliverable: 'Proposta on-chain',   phase: 'operate', sequence_order: 2, tangible: true,  must: true },
                { id: 'tx-vot',          from: 'voter',            to: 'multisig-signer',   deliverable: 'Vot ponderat',        phase: 'operate', sequence_order: 3, tangible: false, must: true },
                { id: 'tx-execucio',     from: 'multisig-signer',  to: 'dev',               deliverable: 'Execució + pagament', phase: 'operate', sequence_order: 4, tangible: true,  must: true },
                { id: 'tx-mint',         from: 'multisig-signer',  to: 'dev',               deliverable: 'Mint token reward',   phase: 'ledger',  sequence_order: 5, tangible: true,  must: true },
                { id: 'tx-facilitacio',  from: 'governance-facil', to: 'voter',             deliverable: 'Sessions debat',       phase: 'operate', sequence_order: 6, tangible: false, must: false },
            ],
        },
        expectedOutcomes: { sopsCountMin: 14, sopsCountMax: 20, weeksToOperateMin: 8, weeksToOperateMax: 12 },
        narrative: 'Organització nativa Web3 amb governance on-chain. SOS gestiona la cara off-chain (proposals · debat · cures · cronologia) que els smart contracts no resolen sols.',
    }),

    // ── 08 · plataforma-cooperativa-digital ────────────────────
    freezeTemplate({
        typeId:            'plataforma-cooperativa',
        sectorAffinity:    ['K', 'N', 'P'],
        requiredGuardians: ['hefesto', 'hermes', 'hera', 'hestia'],
        bootstrapSops: [
            { id: 'pacte-plataforma',      phase: 'design',  label: 'Pacte de plataforma multi-rol' },
            { id: 'onboarding-prestador',  phase: 'operate', label: 'Onboarding de prestador' },
            { id: 'matching-prestador-usu',phase: 'operate', label: 'Matching prestador ↔ usuari' },
            { id: 'pagament-cooperatiu',   phase: 'operate', label: 'Pagament cooperatiu' },
            { id: 'governance-algoritmica',phase: 'operate', label: "Auditoria algorítmica trimestral" },
            { id: 'distribucio-equity',    phase: 'ledger',  label: "Distribució d'equity per ús" },
        ],
        valueMapSeed: {
            roles: [
                { id: 'fundador-dev',     label: 'Fundador-developer',         guardianAffinity: ['hefesto'] },
                { id: 'prestador-servei', label: 'Prestador de servei',        guardianAffinity: ['hera'] },
                { id: 'usuari',           label: 'Usuari',                      guardianAffinity: ['hestia'] },
                { id: 'facilita-comu',    label: 'Facilitador de comunitat',    guardianAffinity: ['hermes'] },
                { id: 'auditor-algo',     label: "Auditor algorítmic",          guardianAffinity: ['atenea'] },
            ],
            transactions: [
                { id: 'tx-servei',       from: 'prestador-servei', to: 'usuari',            deliverable: 'Servei prestat',         phase: 'operate', sequence_order: 1, tangible: true,  must: true },
                { id: 'tx-pagament',     from: 'usuari',           to: 'prestador-servei',  deliverable: 'Pagament cooperatiu',    phase: 'operate', sequence_order: 2, tangible: true,  must: true },
                { id: 'tx-fee',          from: 'prestador-servei', to: 'fundador-dev',      deliverable: 'Fee plataforma (baixa)', phase: 'ledger',  sequence_order: 3, tangible: true,  must: true },
                { id: 'tx-equity-prest', from: 'fundador-dev',     to: 'prestador-servei',  deliverable: 'Equity per ús continuat',phase: 'ledger',  sequence_order: 4, tangible: true,  must: true },
                { id: 'tx-comunitat',    from: 'facilita-comu',    to: 'prestador-servei',  deliverable: 'Sessió suport',          phase: 'operate', sequence_order: 5, tangible: false, must: false },
                { id: 'tx-auditoria',    from: 'auditor-algo',     to: 'fundador-dev',      deliverable: "Auditoria algorítmica",  phase: 'ledger',  sequence_order: 6, tangible: false, must: true },
            ],
        },
        expectedOutcomes: { sopsCountMin: 14, sopsCountMax: 18, weeksToOperateMin: 8, weeksToOperateMax: 12 },
        narrative: "Alternativa a plataformes extractives: prestadors són socis, no contractistes. Equity per ús continuat i auditoria algorítmica pública.",
    }),

    // ── 09 · cooperativa-de-cures ──────────────────────────────
    freezeTemplate({
        typeId:            'cooperativa-cures',
        sectorAffinity:    ['N', 'Q'],
        requiredGuardians: ['hestia', 'hera', 'demeter', 'dionisio'],
        bootstrapSops: [
            { id: 'pla-cures-individual',  phase: 'design',  label: "Pla de cures individual" },
            { id: 'sessions-supervisio',   phase: 'operate', label: 'Sessions de supervisió clínica' },
            { id: 'gestio-torns',          phase: 'operate', label: 'Gestió de torns + relleus' },
            { id: 'sessions-respir',       phase: 'operate', label: 'Sessions de respir per cuidadors' },
            { id: 'revisio-trimestral',    phase: 'operate', label: 'Revisió trimestral + ajustaments' },
            { id: 'auditoria-anual',       phase: 'ledger',  label: 'Auditoria anual' },
        ],
        valueMapSeed: {
            roles: [
                { id: 'cuidador-pro',    label: 'Cuidador/a professional',  guardianAffinity: ['hestia'] },
                { id: 'usuari-cura',     label: 'Usuari de cura',           guardianAffinity: ['hera'] },
                { id: 'familia-acomp',   label: 'Família acompanyant',      guardianAffinity: ['hera'] },
                { id: 'supervisor',      label: 'Supervisor clínic',         guardianAffinity: ['atenea'] },
                { id: 'tresorera',       label: 'Tresorera + admin',         guardianAffinity: ['poseidon'] },
            ],
            transactions: [
                { id: 'tx-cura',         from: 'cuidador-pro',  to: 'usuari-cura',  deliverable: 'Hores de cura',           phase: 'operate', sequence_order: 1, tangible: true,  must: true },
                { id: 'tx-pagament',     from: 'familia-acomp', to: 'tresorera',    deliverable: 'Pagament familiar',       phase: 'operate', sequence_order: 2, tangible: true,  must: true },
                { id: 'tx-equity',       from: 'tresorera',     to: 'cuidador-pro', deliverable: 'Salari + equity slicing', phase: 'ledger',  sequence_order: 3, tangible: true,  must: true },
                { id: 'tx-supervisio',   from: 'supervisor',    to: 'cuidador-pro', deliverable: 'Supervisió clínica',      phase: 'operate', sequence_order: 4, tangible: false, must: true },
                { id: 'tx-respir',       from: 'cuidador-pro',  to: 'cuidador-pro', deliverable: 'Sessió respir',            phase: 'operate', sequence_order: 5, tangible: false, must: false },
                { id: 'tx-reputacio',    from: 'usuari-cura',   to: 'cuidador-pro', deliverable: 'Reputació + reconeixement',phase: 'ledger',  sequence_order: 6, tangible: false, must: false },
            ],
        },
        expectedOutcomes: { sopsCountMin: 10, sopsCountMax: 14, weeksToOperateMin: 6, weeksToOperateMax: 10 },
        narrative: 'Cures professionals reconegudes amb dignitat: hores valuades + supervisió + respir + reputació. La cura és treball que mereix slicing pie.',
    }),

    // ── 10 · espai-autogestionat-coliving ──────────────────────
    freezeTemplate({
        typeId:            'espai-autogestionat',
        sectorAffinity:    ['F', 'N'],
        requiredGuardians: ['hestia', 'dionisio', 'hermes', 'hera'],
        bootstrapSops: [
            { id: 'estatuts-assemblea',  phase: 'design',  label: 'Estatuts assemblearis' },
            { id: 'gestio-espai',        phase: 'operate', label: "Gestió de l'espai físic" },
            { id: 'agenda-activitats',   phase: 'operate', label: "Agenda d'activitats" },
            { id: 'assemblea-mensual',   phase: 'operate', label: 'Assemblea mensual' },
            { id: 'auditoria-espai',     phase: 'ledger',  label: "Auditoria de l'espai" },
        ],
        valueMapSeed: {
            roles: [
                { id: 'assemblearí',     label: 'Assemblearí/ària',         guardianAffinity: ['hera'] },
                { id: 'custodi-espai',   label: "Custodi de l'espai",        guardianAffinity: ['hestia'] },
                { id: 'facilita-cura',   label: 'Facilitador de cura',       guardianAffinity: ['dionisio'] },
                { id: 'cronista',        label: 'Cronista cultural',          guardianAffinity: ['dionisio'] },
                { id: 'veins-coop',      label: 'Veïns col·laboradors',       guardianAffinity: ['hermes'] },
            ],
            transactions: [
                { id: 'tx-quota',        from: 'assemblearí',   to: 'custodi-espai',  deliverable: 'Quota mensual',           phase: 'operate', sequence_order: 1, tangible: true,  must: true },
                { id: 'tx-activitat',    from: 'facilita-cura', to: 'assemblearí',    deliverable: 'Activitat cultural',      phase: 'operate', sequence_order: 2, tangible: true,  must: true },
                { id: 'tx-coop-veins',   from: 'veins-coop',    to: 'facilita-cura',  deliverable: 'Col·laboració veïnal',    phase: 'operate', sequence_order: 3, tangible: false, must: false },
                { id: 'tx-cronica',      from: 'cronista',      to: 'assemblearí',    deliverable: "Crònica de l'espai",      phase: 'operate', sequence_order: 4, tangible: false, must: false },
                { id: 'tx-reputacio',    from: 'assemblearí',   to: 'facilita-cura',  deliverable: 'Reputació cultural',      phase: 'ledger',  sequence_order: 5, tangible: false, must: false },
            ],
        },
        expectedOutcomes: { sopsCountMin: 8, sopsCountMax: 12, weeksToOperateMin: 4, weeksToOperateMax: 8 },
        narrative: "Espai autogestionat (CSO · ateneu · coliving) on cada assemblearí aporta i rep. Slicing pie aplicat a hores cuidant l'espai i agenda comuna.",
    }),

    // ── 11 · hub-transicio-sectorial ───────────────────────────
    freezeTemplate({
        typeId:            'hub-transicio',
        sectorAffinity:    ['F', 'A', 'N'],
        requiredGuardians: ['demeter', 'hermes', 'hestia', 'dionisio'],
        bootstrapSops: [
            { id: 'mapping-actors-hub',     phase: 'design',  label: "Mapping d'actors del hub" },
            { id: 'pla-trimestral-hub',     phase: 'design',  label: 'Pla trimestral del hub' },
            { id: 'activacions-hub',        phase: 'operate', label: 'Activacions trimestrals' },
            { id: 'mediacio-cooperatives',  phase: 'operate', label: 'Mediació entre cooperatives' },
            { id: 'informes-impacte-hub',   phase: 'operate', label: 'Informes trimestrals' },
            { id: 'governance-hub',         phase: 'operate', label: 'Governance del hub' },
            { id: 'auditoria-territorial',  phase: 'ledger',  label: 'Auditoria territorial anual' },
        ],
        valueMapSeed: {
            roles: [
                { id: 'facilitador-hub',  label: 'Facilitador del hub',         guardianAffinity: ['hermes'] },
                { id: 'ambaixador',       label: 'Ambaixador territorial',      guardianAffinity: ['hermes'] },
                { id: 'expert-tecnic',    label: 'Expert tècnic sectorial',     guardianAffinity: ['hefesto'] },
                { id: 'cronista-hub',     label: 'Cronista del hub',            guardianAffinity: ['dionisio'] },
                { id: 'coop-membre',      label: 'Cooperativa membre',          guardianAffinity: ['hestia'] },
            ],
            transactions: [
                { id: 'tx-mapping',     from: 'ambaixador',       to: 'facilitador-hub', deliverable: 'Mapping territorial',     phase: 'design',  sequence_order: 1, tangible: false, must: true },
                { id: 'tx-activacio',   from: 'facilitador-hub',  to: 'coop-membre',     deliverable: 'Activació trimestral',    phase: 'operate', sequence_order: 2, tangible: false, must: true },
                { id: 'tx-tecnica',     from: 'expert-tecnic',    to: 'coop-membre',     deliverable: 'Suport tècnic',           phase: 'operate', sequence_order: 3, tangible: false, must: true },
                { id: 'tx-cronica',     from: 'cronista-hub',     to: 'facilitador-hub', deliverable: 'Crònica del hub',         phase: 'operate', sequence_order: 4, tangible: false, must: false },
                { id: 'tx-impacte',     from: 'coop-membre',      to: 'ambaixador',      deliverable: 'Impacte territorial',     phase: 'ledger',  sequence_order: 5, tangible: false, must: true },
                { id: 'tx-reputacio',   from: 'coop-membre',      to: 'facilitador-hub', deliverable: 'Reputació del hub',       phase: 'ledger',  sequence_order: 6, tangible: false, must: false },
            ],
        },
        expectedOutcomes: { sopsCountMin: 14, sopsCountMax: 20, weeksToOperateMin: 12, weeksToOperateMax: 16 },
        narrative: 'Hub que catalitza la transició sectorial (alimentari · energètic · cultural · digital). Coordina actors heterogenis cap a un objectiu de transformació.',
    }),

    // ── 12 · empresa-familiar-relevo ───────────────────────────
    freezeTemplate({
        typeId:            'familiar-relevo',
        sectorAffinity:    [],   // depèn de l'empresa
        requiredGuardians: ['hera', 'zeus', 'atenea', 'hermes'],
        bootstrapSops: [
            { id: 'diagnosi-relevo',      phase: 'design',  label: 'Diagnòstic de relevo' },
            { id: 'slicing-pie-historic', phase: 'design',  label: 'Slicing pie històric retroactiu' },
            { id: 'pla-successio',        phase: 'build',   label: 'Pla de successió detallat' },
            { id: 'governance-noves-gen', phase: 'operate', label: 'Governance multi-generacional' },
            { id: 'sessions-mediacio',    phase: 'operate', label: 'Sessions de mediació intergeneracional' },
            { id: 'auditoria-fiscal',     phase: 'ledger',  label: 'Auditoria fiscal del relevo' },
        ],
        valueMapSeed: {
            roles: [
                { id: 'pare',                label: 'Pare/mare fundador/a',     guardianAffinity: ['zeus'] },
                { id: 'fill-relevista',      label: 'Fill/a relevista',         guardianAffinity: ['hera'] },
                { id: 'soci-treballador',    label: 'Soci/a treballador/a',     guardianAffinity: ['hera'] },
                { id: 'auditor-fiscal',      label: 'Auditor fiscal',            guardianAffinity: ['poseidon'] },
                { id: 'facilita-mediacio',   label: 'Facilitador de mediació',   guardianAffinity: ['hermes'] },
            ],
            transactions: [
                { id: 'tx-historic',         from: 'pare',              to: 'fill-relevista',     deliverable: 'Capital històric',           phase: 'design',  sequence_order: 1, tangible: true,  must: true },
                { id: 'tx-historia-treball', from: 'soci-treballador',  to: 'pare',              deliverable: "Hores històriques",           phase: 'design',  sequence_order: 2, tangible: false, must: true },
                { id: 'tx-pla-successio',    from: 'facilita-mediacio', to: 'fill-relevista',     deliverable: 'Pla de successió validat',   phase: 'build',   sequence_order: 3, tangible: false, must: true },
                { id: 'tx-equity-rel',       from: 'pare',              to: 'fill-relevista',     deliverable: 'Equity transferit',          phase: 'build',   sequence_order: 4, tangible: true,  must: true },
                { id: 'tx-equity-soci',      from: 'fill-relevista',    to: 'soci-treballador',   deliverable: 'Equity slicing pie nou',     phase: 'ledger',  sequence_order: 5, tangible: true,  must: true },
                { id: 'tx-auditoria',        from: 'auditor-fiscal',    to: 'fill-relevista',     deliverable: 'Auditoria fiscal',           phase: 'ledger',  sequence_order: 6, tangible: false, must: true },
            ],
        },
        expectedOutcomes: { sopsCountMin: 12, sopsCountMax: 18, weeksToOperateMin: 12, weeksToOperateMax: 24 },
        narrative: "El relevo intergeneracional fet bé · slicing pie reconeix tot el capital + hores històriques. Pacte transparent que evita conflictes de successió.",
    }),
]);

// ── Helpers puros ────────────────────────────────────────────────────

export function getBootstrapTemplate(typeId) {
    if (typeof typeId !== 'string' || !typeId) return null;
    return PROJECT_BOOTSTRAP_TEMPLATES.find(t => t.typeId === typeId) || null;
}

export function listAllBootstrapTemplates() {
    return PROJECT_BOOTSTRAP_TEMPLATES.slice();
}

export function expectedSopsCountFor(typeId) {
    const t = getBootstrapTemplate(typeId);
    if (!t) return null;
    const min = t.expectedOutcomes.sopsCountMin || 0;
    const max = t.expectedOutcomes.sopsCountMax || 0;
    return { min, max, midpoint: Math.round((min + max) / 2) };
}

export function expectedWeeksToOperateFor(typeId) {
    const t = getBootstrapTemplate(typeId);
    if (!t) return null;
    const min = t.expectedOutcomes.weeksToOperateMin || 0;
    const max = t.expectedOutcomes.weeksToOperateMax || 0;
    return { min, max, midpoint: Math.round((min + max) / 2) };
}

// validateBootstrapTemplate · estructura mínima esperada
export function validateBootstrapTemplate(t) {
    if (!t || typeof t !== 'object') return false;
    if (typeof t.typeId !== 'string' || !t.typeId) return false;
    if (!getProjectTypeById(t.typeId)) return false;
    if (!Array.isArray(t.requiredGuardians) || t.requiredGuardians.length < 1) return false;
    if (!Array.isArray(t.bootstrapSops) || t.bootstrapSops.length < 1) return false;
    if (!t.valueMapSeed) return false;
    if (!Array.isArray(t.valueMapSeed.roles) || t.valueMapSeed.roles.length < 1) return false;
    if (!Array.isArray(t.valueMapSeed.transactions) || t.valueMapSeed.transactions.length < 1) return false;
    // referential integrity · transactions.from / to deben existir como rol
    const roleIds = new Set(t.valueMapSeed.roles.map(r => r.id));
    for (const tr of t.valueMapSeed.transactions) {
        if (!roleIds.has(tr.from) || !roleIds.has(tr.to)) return false;
        if (!PHASES.includes(tr.phase)) return false;
        if (typeof tr.sequence_order !== 'number') return false;
    }
    // requiredGuardians ⊂ los 12
    const guardianIds = new Set(PANTHEON_GUARDIANS.map(g => g.id));
    for (const gId of t.requiredGuardians) {
        if (!guardianIds.has(gId)) return false;
    }
    return true;
}

// bootstrapMapForProject · genera el seed completo listo para inyectar.
// Devuelve · { roles, transactions, sopsBootstrap, requiredGuardians,
//              sectorAffinity, narrative, expectedOutcomes }
//
// Uso típico desde MatriuLandingView modal o desde un wizard de creación:
//   const seed = bootstrapMapForProject({ typeId: 'comunitat-autosuficient', projectId: 'proj-X' });
//   // luego dispatch CREATE_PROJECT + KB_UPSERT con todo el seed.
export function bootstrapMapForProject({ typeId, projectId, multiplier = 1.0 } = {}) {
    const tpl = getBootstrapTemplate(typeId);
    if (!tpl) throw new Error('bootstrapMapForProject · typeId desconocido: ' + typeId);
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('bootstrapMapForProject · projectId requerido (string)');
    }
    // Roles · ID único por proyecto · namespace por projectId
    const roles = tpl.valueMapSeed.roles.map(r => ({
        id:               `${projectId}::role::${r.id}`,
        baseId:            r.id,
        label:             r.label,
        guardianAffinity:  r.guardianAffinity || [],
        projectId,
    }));
    // Transactions · IDs namespaced + remap from/to a roles namespaced
    const transactions = tpl.valueMapSeed.transactions.map(tr => ({
        id:              `${projectId}::tx::${tr.id}`,
        baseId:           tr.id,
        from:            `${projectId}::role::${tr.from}`,
        to:              `${projectId}::role::${tr.to}`,
        deliverable:     tr.deliverable,
        phase:           tr.phase,
        sequence_order:  tr.sequence_order,
        tangible:        tr.tangible === true,
        must:            tr.must === true,
        projectId,
    }));
    // SOPs · IDs namespaced
    const sopsBootstrap = tpl.bootstrapSops.map(sop => ({
        id:        `${projectId}::sop::${sop.id}`,
        baseId:    sop.id,
        label:     sop.label,
        phase:     sop.phase,
        projectId,
        multiplier,   // factor de pago aplicado (×1.5 fundacional Cohort 0)
    }));
    return {
        roles,
        transactions,
        sopsBootstrap,
        requiredGuardians: tpl.requiredGuardians.slice(),
        sectorAffinity:    tpl.sectorAffinity.slice(),
        narrative:         tpl.narrative,
        expectedOutcomes:  { ...tpl.expectedOutcomes },
        typeId:            tpl.typeId,
    };
}

// stats globales · útil para tests + UI dashboard
export function bootstrapStats() {
    return {
        totalTemplates:    PROJECT_BOOTSTRAP_TEMPLATES.length,
        coveredProjectTypes: PROJECT_BOOTSTRAP_TEMPLATES.map(t => t.typeId),
        totalSeedRoles:    PROJECT_BOOTSTRAP_TEMPLATES.reduce((acc, t) => acc + t.valueMapSeed.roles.length, 0),
        totalSeedTransactions: PROJECT_BOOTSTRAP_TEMPLATES.reduce((acc, t) => acc + t.valueMapSeed.transactions.length, 0),
        totalBootstrapSops: PROJECT_BOOTSTRAP_TEMPLATES.reduce((acc, t) => acc + t.bootstrapSops.length, 0),
    };
}
