// =============================================================================
// TEAMTOWERS SOS V11 — TEAMTOWERS PROJECT SEED (TT-SEED-001)
// Ruta · /js/core/projectTeamtowersSeed.js
//
// Seed real del projecte TeamTowers · aprofita els 8 SOCs existents
// (`knowledge/socs/teamtowers-brand.md` · `fent-pinya.md` · `castellers-demo.md`
// · `la-colla.md` · `merchandising.md` · `proyecto-custom.md` · `charla-conferencia.md`
// · `soc-vna-network.md`) com a base per a propostes a clients reals.
//
// Resol feedback usuari · "Los SOC TeamTowers asociarlos al proyecto inicial
// por defecto que te puedo pedir crear como test real y aprovecharlos como
// SOCs para hacer propuestas de ese proyecto".
//
// Pure · zero IA · zero KB. El caller dispatch al KB.
// =============================================================================

export const TT_SEED_VERSION = 'v1.0';

// Els 8 SOCs canònics TeamTowers (refs a knowledge/socs/*.md)
export const TT_SOCS = Object.freeze([
    Object.freeze({ id: 'soc-teamtowers-brand',     name: 'TeamTowers · marca raíz',          file: 'knowledge/socs/teamtowers-brand.md',     role: 'brand-root' }),
    Object.freeze({ id: 'soc-vna-network',          name: 'Red de valor VNA',                  file: 'knowledge/socs/soc-vna-network.md',      role: 'method-root' }),
    Object.freeze({ id: 'soc-fent-pinya',           name: 'Taller Fent Pinya',                file: 'knowledge/socs/fent-pinya.md',           role: 'workshop' }),
    Object.freeze({ id: 'soc-castellers-demo',      name: 'Demos castelleras profesionales',   file: 'knowledge/socs/castellers-demo.md',      role: 'show' }),
    Object.freeze({ id: 'soc-la-colla',             name: 'Proceso VNA La Colla',              file: 'knowledge/socs/la-colla.md',             role: 'consulting' }),
    Object.freeze({ id: 'soc-teamtowers-merchandising', name: 'Merchandising castellero',      file: 'knowledge/socs/teamtowers-merchandising.md', role: 'merch' }),
    Object.freeze({ id: 'soc-proyecto-custom',      name: 'Proyectos a medida',               file: 'knowledge/socs/proyecto-custom.md',      role: 'custom' }),
    Object.freeze({ id: 'soc-charla-conferencia',   name: 'Charla conferencia teatralizada',   file: 'knowledge/socs/charla-conferencia.md',   role: 'talk' }),
]);

// Rols TeamTowers · castell levels diversificats
const TT_ROLES = Object.freeze([
    Object.freeze({ id: 'visioner',     kind: 'visioner',     roleSlug: 'visioner',     name: 'Visioner · Cap de Colla',         castell_level: 'pom_de_dalt', description: 'Defineix la direcció estratègica de TeamTowers · 20+ anys construint cooperativisme participatiu' }),
    Object.freeze({ id: 'consultor',    kind: 'editor',       roleSlug: 'consultor',    name: 'Consultor · La Colla Lead',       castell_level: 'tronc',       description: 'Lidera processos VNA multi-sessió per a clients · adapta mètode Verna Allee al sector del client' }),
    Object.freeze({ id: 'cap_taller',   kind: 'cohort_manager', roleSlug: 'cap-taller', name: 'Cap de Taller · Fent Pinya',      castell_level: 'pinya',       description: 'Coordina tallers Fent Pinya · 10-1000 pax · garanteix experiència segura i transformadora' }),
    Object.freeze({ id: 'caporal',      kind: 'reviewer',     roleSlug: 'caporal',      name: 'Caporal · Quality Auditor',       castell_level: 'laterals',    description: 'Audita la qualitat de cada projecte client · feedback estructurat · iteració' }),
    Object.freeze({ id: 'connector',    kind: 'facilitator',  roleSlug: 'connector',    name: 'Connector · Business Development', castell_level: 'mans',       description: 'Connecta TeamTowers amb empreses · gestiona relació amb clients · genera propostes' }),
    Object.freeze({ id: 'founder_anchor', kind: 'founder',    roleSlug: 'founder-anchor', name: 'Founder Anchor · @alvaro',     castell_level: 'baixos',      description: 'Sosté la responsabilitat ètica i la coherència del mètode · NO delegable' }),
]);

// Deliverables · vinculats al SOC corresponent
const TT_DELIVERABLES = Object.freeze([
    Object.freeze({ id: 'd-direccio',     producer: 'visioner',     consumers: ['consultor', 'founder_anchor'], validator: 'manual',   description: 'Direcció estratègica anual + casos d\'estudi nous',     soc_ref: 'soc-teamtowers-brand' }),
    Object.freeze({ id: 'd-vna-mapa',     producer: 'consultor',    consumers: ['caporal'],                     validator: 'reviewer', description: 'Mapa VNA del client · 7 passos Allee · 3-12 setmanes',  soc_ref: 'soc-la-colla' }),
    Object.freeze({ id: 'd-taller-pinya', producer: 'cap_taller',   consumers: ['connector'],                    validator: 'manual',   description: 'Taller Fent Pinya executat · 8 passos · feedback pax', soc_ref: 'soc-fent-pinya' }),
    Object.freeze({ id: 'd-audit',        producer: 'caporal',      consumers: ['founder_anchor'],              validator: 'tdd',      description: 'Audit de qualitat del client · 3 mèdotes priorit.',     soc_ref: 'soc-vna-network' }),
    Object.freeze({ id: 'd-proposta',     producer: 'connector',    consumers: ['visioner'],                     validator: 'manual',   description: 'Proposta comercial al client · barreja de SOCs aplicables (fent-pinya · la-colla · demo · custom)', soc_ref: 'soc-proyecto-custom' }),
    Object.freeze({ id: 'd-etica',        producer: 'founder_anchor', consumers: ['visioner', 'caporal'],       validator: 'manual',   description: 'Marc ètic · línies vermelles · valors castellers',     soc_ref: 'soc-teamtowers-brand' }),
]);

// Transactions · Lean metrics seedeats
const TT_TRANSACTIONS = Object.freeze([
    Object.freeze({ id: 'tx-vis-cons', from: 'visioner',       to: 'consultor',     deliverable: 'd-direccio',      type: 'intangible', is_must: true,  frequency: 'quarterly', lead_time_hours: 168, cycle_time_hours: 8,  wip_units: 1 }),
    Object.freeze({ id: 'tx-cons-cap', from: 'consultor',      to: 'caporal',       deliverable: 'd-vna-mapa',      type: 'tangible',   is_must: true,  frequency: 'monthly',   lead_time_hours: 168, cycle_time_hours: 24, wip_units: 2 }),
    Object.freeze({ id: 'tx-tal-con',  from: 'cap_taller',     to: 'connector',     deliverable: 'd-taller-pinya',  type: 'tangible',   is_must: true,  frequency: 'weekly',    lead_time_hours: 48,  cycle_time_hours: 4,  wip_units: 3 }),
    Object.freeze({ id: 'tx-cap-anc',  from: 'caporal',        to: 'founder_anchor', deliverable: 'd-audit',        type: 'tangible',   is_must: true,  frequency: 'monthly',   lead_time_hours: 24,  cycle_time_hours: 3,  wip_units: 1 }),
    Object.freeze({ id: 'tx-con-vis',  from: 'connector',      to: 'visioner',      deliverable: 'd-proposta',      type: 'tangible',   is_must: true,  frequency: 'weekly',    lead_time_hours: 48,  cycle_time_hours: 6,  wip_units: 3 }),
    Object.freeze({ id: 'tx-anc-vis',  from: 'founder_anchor', to: 'visioner',      deliverable: 'd-etica',         type: 'intangible', is_must: true,  frequency: 'quarterly', lead_time_hours: 168, cycle_time_hours: 4,  wip_units: 1 }),
    Object.freeze({ id: 'tx-vis-anc',  from: 'visioner',       to: 'founder_anchor', deliverable: 'd-direccio',     type: 'intangible', is_must: true,  frequency: 'monthly',   lead_time_hours: 72,  cycle_time_hours: 2,  wip_units: 1 }),
]);

// SOPs · estructura mínima · 1 per rol clau · steps amb tdd_test (futur · auto)
const TT_SOPS = Object.freeze([
    Object.freeze({ id: 'sop-consultor', role_ref: 'consultor', title: 'SOP · Procés VNA La Colla amb client', steps: [
        Object.freeze({ id: 's1', label: 'Sessió 1 · audit mapa actual', duration_minutes: 120, role_kind: 'human', deliverable_kind: 'audit',  approval_rule: 'manual' }),
        Object.freeze({ id: 's2', label: 'Sessió 2-3 · entrevistes claus', duration_minutes: 240, role_kind: 'human', deliverable_kind: 'research', approval_rule: 'manual' }),
        Object.freeze({ id: 's3', label: 'Sessió 4-5 · síntesi + mapa nou', duration_minutes: 180, role_kind: 'human', deliverable_kind: 'value-map', approval_rule: 'manual' }),
        Object.freeze({ id: 's4', label: 'Sessió 6 · validació + lliurament', duration_minutes: 90,  role_kind: 'human', deliverable_kind: 'cert',    approval_rule: 'manual' }),
    ] }),
    Object.freeze({ id: 'sop-cap-taller', role_ref: 'cap_taller', title: 'SOP · Execució taller Fent Pinya', steps: [
        Object.freeze({ id: 's1', label: 'Pre-taller · validar venue + audiència', duration_minutes: 60, role_kind: 'human', deliverable_kind: 'plan', approval_rule: 'manual' }),
        Object.freeze({ id: 's2', label: 'Taller · 8 passos · 2h core',           duration_minutes: 120, role_kind: 'human', deliverable_kind: 'workshop', approval_rule: 'manual' }),
        Object.freeze({ id: 's3', label: 'Reflexió · 30min opcional',             duration_minutes: 30,  role_kind: 'human', deliverable_kind: 'doc', approval_rule: 'manual' }),
        Object.freeze({ id: 's4', label: 'Feedback · pax + caporal',              duration_minutes: 15,  role_kind: 'human', deliverable_kind: 'report', approval_rule: 'manual' }),
    ] }),
    Object.freeze({ id: 'sop-connector', role_ref: 'connector', title: 'SOP · Proposta comercial', steps: [
        Object.freeze({ id: 's1', label: 'Investigar client · sector + necessitats', duration_minutes: 60, role_kind: 'ai',    deliverable_kind: 'research', approval_rule: 'manual' }),
        Object.freeze({ id: 's2', label: 'Triar SOCs aplicables (1-3)',              duration_minutes: 30, role_kind: 'human', deliverable_kind: 'plan',     approval_rule: 'manual' }),
        Object.freeze({ id: 's3', label: 'Generar proposta amb IA · pricing',        duration_minutes: 45, role_kind: 'ai',    deliverable_kind: 'pitch',    approval_rule: 'manual' }),
        Object.freeze({ id: 's4', label: 'Revisar amb visioner + enviar',            duration_minutes: 20, role_kind: 'human', deliverable_kind: 'comm',     approval_rule: 'manual' }),
    ] }),
    Object.freeze({ id: 'sop-caporal', role_ref: 'caporal', title: 'SOP · Audit qualitat client', steps: [
        Object.freeze({ id: 's1', label: 'Recollir feedback pax + consultor',     duration_minutes: 30, role_kind: 'human', deliverable_kind: 'research', approval_rule: 'manual' }),
        Object.freeze({ id: 's2', label: 'Comparar amb baseline TeamTowers',      duration_minutes: 30, role_kind: 'human', deliverable_kind: 'analysis', approval_rule: 'manual' }),
        Object.freeze({ id: 's3', label: 'Reportar a founder · 3 millores prio.', duration_minutes: 30, role_kind: 'human', deliverable_kind: 'report',   approval_rule: 'manual' }),
    ] }),
]);

// SOC arrel · agrupa TOTS els SOPs amb checklist sop_ref (rubric C11 100%)
const TT_SOCS_PROJECT = Object.freeze([
    Object.freeze({
        id: 'soc-tt-pilot-cycle',
        name: 'Cicle operatiu TeamTowers Pilot',
        purpose: 'Procés operatiu de TeamTowers · des de captació de client fins a lliurament i audit · referenciant els 8 SOCs canònics del knowledge.',
        external_socs_refs: TT_SOCS.map(s => s.id),
        checklist: [
            Object.freeze({ id: 'soc-i1', label: 'SOP consultor operativa · La Colla',    sop_ref: 'sop-consultor',  required: true, verification_kind: 'sop-exists' }),
            Object.freeze({ id: 'soc-i2', label: 'SOP cap_taller operativa · Fent Pinya', sop_ref: 'sop-cap-taller', required: true, verification_kind: 'sop-exists' }),
            Object.freeze({ id: 'soc-i3', label: 'SOP connector operativa · Proposta',    sop_ref: 'sop-connector',  required: true, verification_kind: 'sop-exists' }),
            Object.freeze({ id: 'soc-i4', label: 'SOP caporal operativa · Audit',         sop_ref: 'sop-caporal',    required: true, verification_kind: 'sop-exists' }),
        ],
    }),
]);

// Canvas + Pitch + Workshops mínims · canvas reflecteix els valors castellers reals
const TT_CANVAS = Object.freeze({
    vision:       'Disseminar el cooperativisme participatiu del món casteller a empreses i institucions de qualsevol sector via metodologia VNA + experiències transformadores.',
    mission:      'Acompanyar organitzacions a redissenyar la seva xarxa de valor amb mètode (La Colla) + experiència viscuda (Fent Pinya · Demo · Charla).',
    values:       ['Força · Equilibri · Valor · Seny', 'Pinya invisible · acotxadors al servei', 'Trabajo participativo > trabajo jeràrquic', 'Verna Allee/Pantheon approach'],
    stakeholders: ['Empreses (clients)', 'Organitzacions públiques', 'Universities', 'Cohort SOS · 108 ops'],
    northStar:    'Primer SOS pilot escalable · 150+ clients · 60k+ participants · 22 sectors CNAE coberts amb adaptació real',
});

const TT_PITCH = Object.freeze({
    headline:    'TeamTowers · 20 anys aplicant el cooperativisme casteller a la transformació empresarial',
    problem:     'Les organitzacions tenen jerarquies que limiten valor · processos sense visió de xarxa · gent atrapada en silos.',
    solution:    'Mètode VNA La Colla (consultoria 3-12 setm.) + Tallers Fent Pinya (2h · 10-1000 pax) + Demos · Charles · Custom · Merch. Tot amb valors castellers.',
    market:      '150+ clients (Telefónica · BBVA · Universitats) · 60.000+ participants · sectors CNAE diversos.',
    business:    'Consultoria per hora/proyecte · workshops per pax · custom packages · merchandising upsell.',
    team:        '@alvaro (founder · 20+ anys) + 6 rols casteller (consultor · cap_taller · caporal · connector · founder_anchor) + xarxa partners.',
});

const TT_WORKSHOPS = Object.freeze([
    Object.freeze({ id: 'ws-tt-intro',  title: 'Què és TeamTowers · 90 min',            audience: 'companies', accessTier: 'public',   outline: 'Visió + mètode VNA + casos d\'èxit · obert' }),
    Object.freeze({ id: 'ws-tt-pinya',  title: 'Taller Fent Pinya · 2h core',           audience: 'team',      accessTier: 'operator', outline: 'Experiència immersiva castellera · 8 passos' }),
    Object.freeze({ id: 'ws-tt-colla',  title: 'Procés VNA La Colla · 4-6 setm.',       audience: 'leadership', accessTier: 'private', outline: 'Consultoria profunda · 7 passos Allee/Pantheon' }),
]);

// ─── buildTeamtowersSeed · pure · retorna el projecte llest per persistir ───
export function buildTeamtowersSeed({
    creatorHandle = '@alvaro',
    projectName   = 'TeamTowers · SOS Pilot real',
    projectId     = null,
    ts            = null,
} = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    const id  = projectId || ('proj-tt-pilot-' + now.toString(36));

    const project = {
        id,
        type:        'project',
        nombre:      projectName,
        name:        projectName,
        sector_id:   'N',                       // Consultoría · CNAE N
        projectType: 'teamtowers-real',
        description: 'Projecte real TeamTowers · 20 anys aplicant cooperativisme casteller a empreses. SOS pilot per a propostes a clients · activa els 8 SOCs canònics del knowledge.',
        purpose:     TT_CANVAS.vision,
        creatorHandle,
        templateId:  'teamtowers-real',
        ambition:    'max',
        vna_roles:   TT_ROLES.map(r => ({ id: r.id, name: r.name, roleSlug: r.roleSlug, castell_level: r.castell_level, description: r.description })),
        vna_transactions: TT_TRANSACTIONS.slice(),
        canvas:      TT_CANVAS,
        pitch:       TT_PITCH,
        soc_refs:    TT_SOCS.map(s => s.id),     // referències als 8 SOCs canònics knowledge/socs/*.md
        keywords:    ['type:project', 'teamtowers-real', 'cnae:N', 'pilot', 'soc-rich'],
        createdAt:   now,
        updatedAt:   now,
        isArchived:  false,
    };

    const roleNodes = TT_ROLES.map(r => ({
        id:        r.id + '-' + id,
        type:      'role',
        projectId: id,
        content:   { ...r, projectId: id },
        keywords:  ['type:role', 'projectId:' + id, 'role:' + r.roleSlug, 'teamtowers-real'],
        createdAt: now, updatedAt: now,
    }));

    const sopNodes = TT_SOPS.map(s => ({
        id:        s.id + '-' + id,
        type:      'sop',
        projectId: id,
        content:   { ...s, projectId: id, roleId: s.role_ref + '-' + id },
        keywords:  ['type:sop', 'projectId:' + id, 'roleId:' + s.role_ref + '-' + id, 'teamtowers-real'],
        createdAt: now, updatedAt: now,
    }));

    const socNodes = TT_SOCS_PROJECT.map(s => ({
        id:        s.id + '-' + id,
        type:      'soc',
        projectId: id,
        content:   {
            ...s,
            projectId: id,
            checklist: s.checklist.map(item => ({
                ...item,
                sop_ref: item.sop_ref + '-' + id,
            })),
        },
        keywords:  ['type:soc', 'projectId:' + id, 'teamtowers-real'],
        createdAt: now, updatedAt: now,
    }));

    return {
        version:      TT_SEED_VERSION,
        project,
        roles:        roleNodes,
        sops:         sopNodes,
        socs:         socNodes,
        deliverables: TT_DELIVERABLES.slice(),
        transactions: TT_TRANSACTIONS.slice(),
        canvas:       TT_CANVAS,
        pitch:        TT_PITCH,
        workshops:    TT_WORKSHOPS.slice(),
        socKnowledgeRefs: TT_SOCS,    // els 8 SOCs externs del knowledge/socs/
        stats: {
            roleCount:        TT_ROLES.length,
            transactionCount: TT_TRANSACTIONS.length,
            sopCount:         TT_SOPS.length,
            socCount:         TT_SOCS_PROJECT.length,
            externalSocsRefs: TT_SOCS.length,
        },
    };
}
