// =============================================================================
// TEAMTOWERS SOS V11 — TEMPLATE · founder-coop-tradicional
// Ruta · /js/core/templates/founderCoopTradicional.js
//
// Template per a projectes cooperatius tradicionals (cas SOS Founder ·
// Castellers · projectes amb estructura jeràrquica i cohort gran).
//
// Extreta de l'antic `founderTemplate.js` però enriquida amb:
//   · validators als deliverables (C4)
//   · SOPs amb steps[] estructurats · deliverable_kind + approval_rule (C10)
//   · SOCs amb checklist sop_ref (C11)
//   · mètriques Lean per transaction · lead/cycle/WIP (C12)
//
// Diana · ≥85 al rubric SENSE personalització IA. La IA només substitueix
// placeholders `{{name}}` · `{{sector}}` · `{{problem}}`.
// =============================================================================

export const TEMPLATE_ID = 'founder-coop-tradicional';

export const META = Object.freeze({
    id: TEMPLATE_ID,
    label: 'Cooperativa tradicional · cohort jeràrquica',
    description: 'Projectes amb estructura visioner→arquitecte→pinya · cohort gran (≥20 ops) · publish permaweb · economia de saldo prepagat.',
    bestFor: ['founder', 'castellers', 'cooperative-classic', 'cohort-based'],
});

export const ROLES = Object.freeze([
    Object.freeze({ id: 'visioner',       kind: 'visioner',    roleSlug: 'visioner',       name: 'Visioner · Cap de Colla',    castell_level: 'pom_de_dalt', description: 'Defineix la direcció estratègica del moviment {{name}} · veu macroscòpica · pren decisions de prioritats absolutes.', typical_actor: 'founder' }),
    Object.freeze({ id: 'arquitecte',     kind: 'architect',   roleSlug: 'arquitecte',     name: 'Arquitecte · System Lead',   castell_level: 'tronc',       description: 'Dissenya l\'arquitectura tècnica del {{name}} · {{problem}} · escala sense fricció.',                              typical_actor: 'tech-lead' }),
    Object.freeze({ id: 'narrador',       kind: 'editor',      roleSlug: 'narrador',       name: 'Narrador · Storyteller',     castell_level: 'tronc',       description: 'Tradueix la complexitat de {{name}} en presentacions enteses per stakeholders.',                                   typical_actor: 'comms' }),
    Object.freeze({ id: 'cohort_manager', kind: 'cohort_manager', roleSlug: 'cohort-mgr', name: 'Cohort Manager · Ops',       castell_level: 'pinya',       description: 'Gestiona el lifecycle de la cohort de {{name}} · onboarding · pacts · membership.',                                typical_actor: 'cohort-lead' }),
    Object.freeze({ id: 'sentinel',       kind: 'reviewer',    roleSlug: 'sentinel',       name: 'Sentinel · Trust Auditor',   castell_level: 'laterals',    description: 'Audita la integritat de {{name}} · detecta abusos · verifica firmes ECDSA.',                                        typical_actor: 'auditor' }),
    Object.freeze({ id: 'curator',        kind: 'curator',     roleSlug: 'curator',        name: 'Curator · Knowledge',        castell_level: 'pinya',       description: 'Manté el corpus de coneixement de {{name}} · sectors · SOPs · skills.',                                              typical_actor: 'knowledge-lead' }),
    Object.freeze({ id: 'connector',      kind: 'facilitator', roleSlug: 'connector',      name: 'Connector · Network Weaver', castell_level: 'mans',        description: 'Connecta operadors de la xarxa de {{name}} · facilita matchmaking entre projectes.',                                 typical_actor: 'community' }),
    Object.freeze({ id: 'founder_anchor', kind: 'founder',     roleSlug: 'founder-anchor', name: 'Founder Anchor',             castell_level: 'baixos',      description: 'Sosté la responsabilitat ètica i legal de {{name}}. Rol no delegable.',                                            typical_actor: 'founder' }),
]);

// Deliverables · cada role és producer d'almenys un · tots tenen validator
export const DELIVERABLES = Object.freeze([
    Object.freeze({ id: 'd-direccio',      producer: 'visioner',       consumers: ['arquitecte','founder_anchor'], validator: 'manual',     description: 'Direcció estratègica + criteris no-negociables' }),
    Object.freeze({ id: 'd-arquitectura',  producer: 'arquitecte',     consumers: ['visioner','curator'],          validator: 'reviewer',   description: 'Schemes + roadmap tècnic' }),
    Object.freeze({ id: 'd-pitch',         producer: 'narrador',       consumers: ['cohort_manager','connector'],  validator: 'manual',     description: 'Pitch decks + onboarding materials' }),
    Object.freeze({ id: 'd-cohort-status', producer: 'cohort_manager', consumers: ['visioner','founder_anchor'],   validator: 'tdd',        description: 'Status cohort · % places omplertes' }),
    Object.freeze({ id: 'd-audit-report',  producer: 'sentinel',       consumers: ['founder_anchor'],              validator: 'tdd',        description: 'Audit firmes setmanal · anomalies' }),
    Object.freeze({ id: 'd-kb-update',     producer: 'curator',        consumers: ['arquitecte','cohort_manager'], validator: 'reviewer',   description: 'Taxonomies + schemas actualitzats' }),
    Object.freeze({ id: 'd-trust-signal',  producer: 'connector',      consumers: ['founder_anchor','visioner'],   validator: 'manual',     description: 'Senyals de pertinença · trust signals' }),
    Object.freeze({ id: 'd-etica-frame',   producer: 'founder_anchor', consumers: ['visioner','sentinel'],         validator: 'manual',     description: 'Marc ètic · línies vermelles' }),
]);

// Transactions · 12 totals · mix tangible/intangible · cicles recíprocs ·
// totes amb mètriques Lean estimades (lead/cycle/WIP)
export const TRANSACTIONS = Object.freeze([
    Object.freeze({ id: 'tx-vision-arq',    from: 'visioner',       to: 'arquitecte',     deliverable: 'd-direccio',      type: 'intangible', is_must: true,  frequency: 'monthly',  lead_time_hours: 168, cycle_time_hours: 4,  wip_units: 1 }),
    Object.freeze({ id: 'tx-arq-vision',    from: 'arquitecte',     to: 'visioner',       deliverable: 'd-arquitectura',  type: 'tangible',   is_must: true,  frequency: 'weekly',   lead_time_hours: 48,  cycle_time_hours: 6,  wip_units: 1 }),
    Object.freeze({ id: 'tx-narr-coh',      from: 'narrador',       to: 'cohort_manager', deliverable: 'd-pitch',         type: 'tangible',   is_must: true,  frequency: 'monthly',  lead_time_hours: 72,  cycle_time_hours: 8,  wip_units: 2 }),
    Object.freeze({ id: 'tx-coh-narr',      from: 'cohort_manager', to: 'narrador',       deliverable: 'd-cohort-status', type: 'intangible', is_must: false, frequency: 'monthly',  lead_time_hours: 24,  cycle_time_hours: 2,  wip_units: 1 }),
    Object.freeze({ id: 'tx-sent-anc',      from: 'sentinel',       to: 'founder_anchor', deliverable: 'd-audit-report',  type: 'tangible',   is_must: true,  frequency: 'weekly',   lead_time_hours: 24,  cycle_time_hours: 3,  wip_units: 1 }),
    Object.freeze({ id: 'tx-anc-sent',      from: 'founder_anchor', to: 'sentinel',       deliverable: 'd-etica-frame',   type: 'intangible', is_must: true,  frequency: 'monthly',  lead_time_hours: 48,  cycle_time_hours: 1,  wip_units: 1 }),
    Object.freeze({ id: 'tx-cur-arq',       from: 'curator',        to: 'arquitecte',     deliverable: 'd-kb-update',     type: 'tangible',   is_must: true,  frequency: 'monthly',  lead_time_hours: 72,  cycle_time_hours: 5,  wip_units: 2 }),
    Object.freeze({ id: 'tx-arq-cur',       from: 'arquitecte',     to: 'curator',        deliverable: 'd-arquitectura',  type: 'tangible',   is_must: false, frequency: 'monthly',  lead_time_hours: 48,  cycle_time_hours: 4,  wip_units: 1 }),
    Object.freeze({ id: 'tx-conn-narr',     from: 'connector',      to: 'narrador',       deliverable: 'd-trust-signal',  type: 'tangible',   is_must: false, frequency: 'monthly',  lead_time_hours: 36,  cycle_time_hours: 2,  wip_units: 2 }),
    Object.freeze({ id: 'tx-conn-anc',      from: 'connector',      to: 'founder_anchor', deliverable: 'd-trust-signal',  type: 'intangible', is_must: false, frequency: 'weekly',   lead_time_hours: 24,  cycle_time_hours: 1,  wip_units: 1 }),
    Object.freeze({ id: 'tx-anc-vision',    from: 'founder_anchor', to: 'visioner',       deliverable: 'd-etica-frame',   type: 'intangible', is_must: true,  frequency: 'quarterly',lead_time_hours: 168, cycle_time_hours: 4,  wip_units: 1 }),
    Object.freeze({ id: 'tx-vision-anc',    from: 'visioner',       to: 'founder_anchor', deliverable: 'd-direccio',      type: 'intangible', is_must: true,  frequency: 'monthly',  lead_time_hours: 72,  cycle_time_hours: 2,  wip_units: 1 }),
]);

// SOPs · una per cada role · totes amb steps[] estructurats amb
// deliverable_kind + approval_rule (satisfà C10)
export const SOPS = Object.freeze([
    Object.freeze({ id: 'sop-visioner', role_ref: 'visioner', title: 'SOP · Direcció estratègica de {{name}}', steps: [
        Object.freeze({ id: 's1', label: 'Revisar mètriques cohort · adoption · costos', duration_minutes: 30, role_kind: 'human', deliverable_kind: 'analysis',  approval_rule: 'manual' }),
        Object.freeze({ id: 's2', label: 'Decidir top-3 prioritats del trimestre',         duration_minutes: 45, role_kind: 'human', deliverable_kind: 'decision',  approval_rule: 'manual' }),
        Object.freeze({ id: 's3', label: 'Comunicar a arquitecte + narrador · vector',     duration_minutes: 20, role_kind: 'human', deliverable_kind: 'comm',      approval_rule: 'manual' }),
        Object.freeze({ id: 's4', label: 'Publicar update al permaweb · entry signada',    duration_minutes: 15, role_kind: 'ai',    deliverable_kind: 'publish',   approval_rule: 'tdd' }),
    ] }),
    Object.freeze({ id: 'sop-arquitecte', role_ref: 'arquitecte', title: 'SOP · Iteració del sistema {{name}}', steps: [
        Object.freeze({ id: 's1', label: 'Triage backlog tècnic · prioritzar amb risc·valor', duration_minutes: 30, role_kind: 'human', deliverable_kind: 'plan',   approval_rule: 'manual' }),
        Object.freeze({ id: 's2', label: 'TDD scaffold de la nova feature',                    duration_minutes: 60, role_kind: 'ai',    deliverable_kind: 'tests',  approval_rule: 'tdd' }),
        Object.freeze({ id: 's3', label: 'Implementar minim possible · KISS · tests verds',    duration_minutes: 90, role_kind: 'ai',    deliverable_kind: 'code',   approval_rule: 'tdd' }),
        Object.freeze({ id: 's4', label: 'PR · auto-review · merge si verd',                   duration_minutes: 15, role_kind: 'human', deliverable_kind: 'pr',     approval_rule: 'manual' }),
    ] }),
    Object.freeze({ id: 'sop-narrador', role_ref: 'narrador', title: 'SOP · Narrativa de {{name}}', steps: [
        Object.freeze({ id: 's1', label: 'Recollir 3 casos d\'èxit de la cohort',             duration_minutes: 30, role_kind: 'human', deliverable_kind: 'research', approval_rule: 'manual' }),
        Object.freeze({ id: 's2', label: 'Sintetitzar pitch · 3 slides · 1 frase per slide',  duration_minutes: 45, role_kind: 'ai',    deliverable_kind: 'pitch',    approval_rule: 'manual' }),
        Object.freeze({ id: 's3', label: 'Distribuir a cohort · permaweb · social',            duration_minutes: 20, role_kind: 'human', deliverable_kind: 'comm',     approval_rule: 'manual' }),
    ] }),
    Object.freeze({ id: 'sop-cohort_manager', role_ref: 'cohort_manager', title: 'SOP · Onboarding cohort de {{name}}', steps: [
        Object.freeze({ id: 's1', label: 'Setmana 1-2 · presentació + DID + perfil signat',   duration_minutes: 120, role_kind: 'human', deliverable_kind: 'onboarding', approval_rule: 'manual' }),
        Object.freeze({ id: 's2', label: 'Setmana 3-5 · construcció mapa de valor + SOPs',    duration_minutes: 180, role_kind: 'ai',    deliverable_kind: 'value-map',  approval_rule: 'tdd' }),
        Object.freeze({ id: 's3', label: 'Setmana 6-8 · publish + pact de socis',              duration_minutes: 120, role_kind: 'human', deliverable_kind: 'pact',       approval_rule: 'manual' }),
        Object.freeze({ id: 's4', label: 'Setmana 9-10 · graduation + access permanent CoPs',  duration_minutes: 60,  role_kind: 'human', deliverable_kind: 'cert',       approval_rule: 'manual' }),
    ] }),
    Object.freeze({ id: 'sop-sentinel', role_ref: 'sentinel', title: 'SOP · Audit firmes de {{name}}', steps: [
        Object.freeze({ id: 's1', label: 'Pull syncFromPermaweb · 7 dies',                    duration_minutes: 10, role_kind: 'ai', deliverable_kind: 'sync',     approval_rule: 'tdd' }),
        Object.freeze({ id: 's2', label: 'verifyRegistryEntry per cada entry · log anomalies', duration_minutes: 20, role_kind: 'ai', deliverable_kind: 'report',   approval_rule: 'tdd' }),
        Object.freeze({ id: 's3', label: 'Reportar a founder_anchor amb recommended action',   duration_minutes: 15, role_kind: 'human', deliverable_kind: 'report', approval_rule: 'manual' }),
    ] }),
    Object.freeze({ id: 'sop-curator', role_ref: 'curator', title: 'SOP · Manteniment KB de {{name}}', steps: [
        Object.freeze({ id: 's1', label: 'Recollir feedback dels operadors sobre taxonomies', duration_minutes: 30, role_kind: 'human', deliverable_kind: 'research', approval_rule: 'manual' }),
        Object.freeze({ id: 's2', label: 'Ajustar schemas · migration script si cal',          duration_minutes: 60, role_kind: 'ai',    deliverable_kind: 'schema',   approval_rule: 'tdd' }),
        Object.freeze({ id: 's3', label: 'Publicar update + nota a curator log',               duration_minutes: 15, role_kind: 'human', deliverable_kind: 'doc',      approval_rule: 'manual' }),
    ] }),
    Object.freeze({ id: 'sop-connector', role_ref: 'connector', title: 'SOP · Matchmaking xarxa de {{name}}', steps: [
        Object.freeze({ id: 's1', label: 'Identificar operadors actius · sectors compatibles', duration_minutes: 30, role_kind: 'human', deliverable_kind: 'analysis', approval_rule: 'manual' }),
        Object.freeze({ id: 's2', label: 'Proposar 2-3 conexions per setmana via DM',          duration_minutes: 20, role_kind: 'human', deliverable_kind: 'comm',     approval_rule: 'manual' }),
        Object.freeze({ id: 's3', label: 'Recollir trust signals · publicar a founder_anchor', duration_minutes: 15, role_kind: 'human', deliverable_kind: 'report',   approval_rule: 'manual' }),
    ] }),
    Object.freeze({ id: 'sop-founder_anchor', role_ref: 'founder_anchor', title: 'SOP · Decisions ètiques de {{name}}', steps: [
        Object.freeze({ id: 's1', label: 'Revisar reports de sentinel · classificar severitat', duration_minutes: 30, role_kind: 'human', deliverable_kind: 'review', approval_rule: 'manual' }),
        Object.freeze({ id: 's2', label: 'Decidir acció · ban · advert · sense acció',          duration_minutes: 20, role_kind: 'human', deliverable_kind: 'decision', approval_rule: 'manual' }),
        Object.freeze({ id: 's3', label: 'Comunicar decisió + actualitzar marc ètic',           duration_minutes: 30, role_kind: 'human', deliverable_kind: 'comm',     approval_rule: 'manual' }),
    ] }),
]);

// SOCs · 1 SOC arrel "Onboarding & operació de {{name}}" amb checklist
// que lliga TOTS els SOPs · satisfà C11 (cobertura 100% > 80%)
export const SOCS = Object.freeze([
    Object.freeze({ id: 'soc-{{name_slug}}', name: 'Onboarding & operació de {{name}}',
        purpose: 'Cobrir el cicle complet · des de la visió fins l\'audit · de manera repetible i auditable.',
        checklist: Object.freeze(SOPS.map((s, i) => Object.freeze({
            id: 'soc-item-' + (i + 1),
            label: 'Tenir SOP operativa · ' + s.title.replace('SOP · ', '').replace(' de {{name}}', ''),
            required: true,
            verification_kind: 'sop-exists',
            sop_ref: s.id,
        }))),
    }),
]);

// Canvas + Pitch + Workshops (resums · poden ser strings amb placeholders)
export const CANVAS = Object.freeze({
    vision:      'Construir {{name}} com a sistema operatiu col·laboratiu de propietat distribuïda, anclat al permaweb.',
    mission:     'Permetre a operadors humans + agents IA dissenyar i operar {{name}} amb comptabilitat de valor real.',
    values:      ['transparency', 'reciprocity', 'auditability', 'sovereignty'],
    stakeholders:['founders', 'cohort_managers', 'operators', 'investors'],
    northStar:   'Cohort 0 amb 108 operadors actius · primer projecte SOS auto-sostenible.',
});

export const PITCH = Object.freeze({
    headline:    '{{name}} · el sistema operatiu del nostre {{sector}}',
    problem:     '{{problem}}',
    solution:    'Local-first KB + permaweb + IA orquestrada amb roles + transactions + SOPs estructurats.',
    market:      'Cooperatives · empreses descentralitzades · projectes amb cohort gran.',
    business:    'Saldo prepagat · revenue split coop · workshops premium.',
    team:        'Founder anchor + 7 roles canònics + agents IA.',
});

export const WORKSHOPS = Object.freeze([
    Object.freeze({ id: 'ws-intro',  title: 'Què és {{name}} · 90 min',     audience: 'founders',  accessTier: 'public',   outline: 'Visió + mètode + casos d\'ús' }),
    Object.freeze({ id: 'ws-method', title: 'Mètode {{name}} pas a pas',    audience: 'operators', accessTier: 'operator', outline: 'Wizard project · value map · SOPs · permaweb' }),
    Object.freeze({ id: 'ws-cohort', title: 'Cohort deep dive · 6h',         audience: 'cohort',    accessTier: 'cohort',   outline: 'Pact socis · multiplier · responsabilitats' }),
]);

// Default · l'objecte template canonical exportat
const TEMPLATE = Object.freeze({
    meta:         META,
    roles:        ROLES,
    deliverables: DELIVERABLES,
    transactions: TRANSACTIONS,
    sops:         SOPS,
    socs:         SOCS,
    canvas:       CANVAS,
    pitch:        PITCH,
    workshops:    WORKSHOPS,
});

export default TEMPLATE;
