// =============================================================================
// TEAMTOWERS SOS V11 — TEMPLATE · default-balanced
// Ruta · /js/core/templates/defaultBalanced.js
//
// Template genèric · projecte cooperatiu equilibrat sense suposicions sobre
// cohort gran ni estructura jeràrquica · útil quan el classifier no detecta
// cap pattern específic.
//
// 5 roles · 8 transactions · 5 SOPs · 1 SOC · totes les mètriques presents
// per arribar a ≥85 al rubric sense IA.
// =============================================================================

export const TEMPLATE_ID = 'default-balanced';

export const META = Object.freeze({
    id: TEMPLATE_ID,
    label: 'Cooperativa equilibrada · genèric',
    description: 'Estructura plana de 5 roles (founder · operations · creator · reviewer · facilitator) · cicle complet d\'execució + validació · sense suposicions sectorials.',
    bestFor: ['default', 'small-team', 'unknown-sector'],
});

export const ROLES = Object.freeze([
    Object.freeze({ id: 'founder',     kind: 'founder',     roleSlug: 'founder',     name: 'Founder · Ancora del projecte', castell_level: 'pom_de_dalt', description: 'Sosté la responsabilitat de {{name}} · pren decisions estratègiques i ètiques.',                  typical_actor: 'founder' }),
    Object.freeze({ id: 'operations', kind: 'pm',          roleSlug: 'operations',  name: 'Operations · PM',                castell_level: 'tronc',       description: 'Coordina l\'execució diària de {{name}} · prioritza · resol bloquejos.',                              typical_actor: 'pm' }),
    Object.freeze({ id: 'creator',    kind: 'coder',       roleSlug: 'creator',     name: 'Creator · Maker',                castell_level: 'pinya',       description: 'Produeix els lliurables de {{name}} · {{problem}} · feina pràctica.',                                  typical_actor: 'maker' }),
    Object.freeze({ id: 'reviewer',   kind: 'reviewer',    roleSlug: 'reviewer',    name: 'Reviewer · QA',                  castell_level: 'laterals',    description: 'Valida la qualitat dels lliurables de {{name}} · audita resultats.',                                  typical_actor: 'qa' }),
    Object.freeze({ id: 'facilitator',kind: 'facilitator', roleSlug: 'facilitator', name: 'Facilitator · Comunicació',      castell_level: 'mans',        description: 'Manté la cohesió de {{name}} · facilita reunions · documenta decisions.',                            typical_actor: 'community' }),
]);

export const DELIVERABLES = Object.freeze([
    Object.freeze({ id: 'd-strategy',   producer: 'founder',     consumers: ['operations'],            validator: 'manual',   description: 'Direcció estratègica · prioritats trimestre' }),
    Object.freeze({ id: 'd-plan',       producer: 'operations',  consumers: ['creator','reviewer'],    validator: 'reviewer', description: 'Pla d\'execució setmanal · backlog ordenat' }),
    Object.freeze({ id: 'd-artifact',   producer: 'creator',     consumers: ['reviewer'],              validator: 'tdd',      description: 'Artifact lliurat · feature · doc · servei' }),
    Object.freeze({ id: 'd-quality',    producer: 'reviewer',    consumers: ['operations','founder'],  validator: 'tdd',      description: 'Report de qualitat · pass/fail · cobertura' }),
    Object.freeze({ id: 'd-facilitation', producer: 'facilitator', consumers: ['founder','operations'], validator: 'manual', description: 'Acta de reunió · decisions · accions assignades' }),
    Object.freeze({ id: 'd-feedback',   producer: 'facilitator', consumers: ['creator','reviewer'],     validator: 'manual',  description: 'Feedback de l\'equip · senyals de salut' }),
]);

export const TRANSACTIONS = Object.freeze([
    Object.freeze({ id: 'tx-1', from: 'founder',     to: 'operations',  deliverable: 'd-strategy',     type: 'intangible', is_must: true,  frequency: 'monthly',  lead_time_hours: 48,  cycle_time_hours: 2, wip_units: 1 }),
    Object.freeze({ id: 'tx-2', from: 'operations',  to: 'creator',     deliverable: 'd-plan',         type: 'tangible',   is_must: true,  frequency: 'weekly',   lead_time_hours: 24,  cycle_time_hours: 3, wip_units: 2 }),
    Object.freeze({ id: 'tx-3', from: 'operations',  to: 'reviewer',    deliverable: 'd-plan',         type: 'tangible',   is_must: true,  frequency: 'weekly',   lead_time_hours: 24,  cycle_time_hours: 1, wip_units: 1 }),
    Object.freeze({ id: 'tx-4', from: 'creator',     to: 'reviewer',    deliverable: 'd-artifact',     type: 'tangible',   is_must: true,  frequency: 'weekly',   lead_time_hours: 72,  cycle_time_hours: 16,wip_units: 2 }),
    Object.freeze({ id: 'tx-5', from: 'reviewer',    to: 'operations',  deliverable: 'd-quality',      type: 'tangible',   is_must: true,  frequency: 'weekly',   lead_time_hours: 24,  cycle_time_hours: 4, wip_units: 1 }),
    Object.freeze({ id: 'tx-6', from: 'reviewer',    to: 'founder',     deliverable: 'd-quality',      type: 'tangible',   is_must: false, frequency: 'monthly',  lead_time_hours: 48,  cycle_time_hours: 2, wip_units: 1 }),
    Object.freeze({ id: 'tx-7', from: 'facilitator', to: 'founder',     deliverable: 'd-facilitation', type: 'tangible',   is_must: true,  frequency: 'weekly',   lead_time_hours: 24,  cycle_time_hours: 1, wip_units: 1 }),
    Object.freeze({ id: 'tx-8', from: 'facilitator', to: 'creator',     deliverable: 'd-feedback',     type: 'intangible', is_must: false, frequency: 'weekly',   lead_time_hours: 24,  cycle_time_hours: 1, wip_units: 1 }),
    Object.freeze({ id: 'tx-9', from: 'operations',  to: 'facilitator', deliverable: 'd-plan',         type: 'intangible', is_must: false, frequency: 'weekly',   lead_time_hours: 24,  cycle_time_hours: 1, wip_units: 1 }),
]);

export const SOPS = Object.freeze([
    Object.freeze({ id: 'sop-founder', role_ref: 'founder', title: 'SOP · Decisions estratègiques de {{name}}', steps: [
        Object.freeze({ id: 's1', label: 'Revisar mètriques i feedback operations',  duration_minutes: 30, role_kind: 'human', deliverable_kind: 'review',   approval_rule: 'manual' }),
        Object.freeze({ id: 's2', label: 'Decidir prioritats del cicle',              duration_minutes: 30, role_kind: 'human', deliverable_kind: 'decision', approval_rule: 'manual' }),
        Object.freeze({ id: 's3', label: 'Comunicar strategy a operations',           duration_minutes: 15, role_kind: 'human', deliverable_kind: 'comm',     approval_rule: 'manual' }),
    ] }),
    Object.freeze({ id: 'sop-operations', role_ref: 'operations', title: 'SOP · Planificació setmanal de {{name}}', steps: [
        Object.freeze({ id: 's1', label: 'Triage backlog · prioritzar amb risc·valor',duration_minutes: 30, role_kind: 'human', deliverable_kind: 'plan',     approval_rule: 'manual' }),
        Object.freeze({ id: 's2', label: 'Assignar items a creator i reviewer',        duration_minutes: 20, role_kind: 'human', deliverable_kind: 'plan',     approval_rule: 'manual' }),
        Object.freeze({ id: 's3', label: 'Daily standup async · status update',         duration_minutes: 15, role_kind: 'human', deliverable_kind: 'status',   approval_rule: 'manual' }),
        Object.freeze({ id: 's4', label: 'Retrospectiva setmanal · ajustar plà',        duration_minutes: 30, role_kind: 'human', deliverable_kind: 'retro',    approval_rule: 'manual' }),
    ] }),
    Object.freeze({ id: 'sop-creator', role_ref: 'creator', title: 'SOP · Producció de {{name}}', steps: [
        Object.freeze({ id: 's1', label: 'Llegir spec · clarificar dubtes amb operations', duration_minutes: 20, role_kind: 'human', deliverable_kind: 'analysis', approval_rule: 'manual' }),
        Object.freeze({ id: 's2', label: 'TDD scaffold · tests primer',                     duration_minutes: 60, role_kind: 'ai',    deliverable_kind: 'tests',    approval_rule: 'tdd' }),
        Object.freeze({ id: 's3', label: 'Implementar · KISS · tests verds',                duration_minutes: 120,role_kind: 'ai',    deliverable_kind: 'code',     approval_rule: 'tdd' }),
        Object.freeze({ id: 's4', label: 'PR · self-review · push',                         duration_minutes: 15, role_kind: 'human', deliverable_kind: 'pr',       approval_rule: 'manual' }),
    ] }),
    Object.freeze({ id: 'sop-reviewer', role_ref: 'reviewer', title: 'SOP · Quality check de {{name}}', steps: [
        Object.freeze({ id: 's1', label: 'Revisar artifact · run tests',                duration_minutes: 30, role_kind: 'human', deliverable_kind: 'review', approval_rule: 'tdd' }),
        Object.freeze({ id: 's2', label: 'Verificar edge cases · accessibilitat',       duration_minutes: 30, role_kind: 'human', deliverable_kind: 'review', approval_rule: 'manual' }),
        Object.freeze({ id: 's3', label: 'Aprovar o demanar canvis · escriure raons',   duration_minutes: 15, role_kind: 'human', deliverable_kind: 'report', approval_rule: 'manual' }),
    ] }),
    Object.freeze({ id: 'sop-facilitator', role_ref: 'facilitator', title: 'SOP · Facilitació de {{name}}', steps: [
        Object.freeze({ id: 's1', label: 'Recollir senyals · check-in 1:1 ràpid',          duration_minutes: 30, role_kind: 'human', deliverable_kind: 'research', approval_rule: 'manual' }),
        Object.freeze({ id: 's2', label: 'Sintetitzar feedback · acta de reunió',           duration_minutes: 30, role_kind: 'human', deliverable_kind: 'doc',      approval_rule: 'manual' }),
        Object.freeze({ id: 's3', label: 'Compartir acta + accions a founder/operations',   duration_minutes: 15, role_kind: 'human', deliverable_kind: 'comm',     approval_rule: 'manual' }),
    ] }),
]);

export const SOCS = Object.freeze([
    Object.freeze({ id: 'soc-{{name_slug}}', name: 'Cicle bàsic de {{name}}',
        purpose: 'Cobrir el cicle complet d\'execució: estratègia → planificació → producció → revisió → facilitació.',
        checklist: Object.freeze(SOPS.map((s, i) => Object.freeze({
            id: 'soc-item-' + (i + 1),
            label: 'Tenir SOP operativa · ' + s.title.replace('SOP · ', ''),
            required: true,
            verification_kind: 'sop-exists',
            sop_ref: s.id,
        }))),
    }),
]);

export const CANVAS = Object.freeze({
    vision:      'Construir {{name}} com a projecte cooperatiu d\'alta qualitat amb cicle complet.',
    mission:     'Permetre a l\'equip executar {{problem}} amb claredat de rols, SOPs i mètriques.',
    values:      ['transparency', 'craftsmanship', 'accountability'],
    stakeholders:['founder', 'team', 'users'],
    northStar:   'Cicle setmanal estable amb qualitat verificada i feedback recollit.',
});

export const PITCH = Object.freeze({
    headline:    '{{name}} · {{problem}} resolt amb mètode.',
    problem:     '{{problem}}',
    solution:    '5 rols · 9 transaccions · 5 SOPs estructurades · cicle complet d\'execució + validació.',
    market:      'Petits equips cooperatius · projectes de qualsevol sector.',
    business:    'Saldo prepagat · facturació transparent.',
    team:        'Founder + operations + creator + reviewer + facilitator.',
});

export const WORKSHOPS = Object.freeze([
    Object.freeze({ id: 'ws-kickoff', title: '{{name}} · kickoff · 60 min', audience: 'team',     accessTier: 'private',  outline: 'Visió + roles + primeres SOPs' }),
    Object.freeze({ id: 'ws-method',  title: 'Mètode SOS · 90 min',          audience: 'operators', accessTier: 'operator', outline: 'Wizard project · value map · SOPs' }),
]);

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
