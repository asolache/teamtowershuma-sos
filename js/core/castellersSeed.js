// =============================================================================
// TEAMTOWERS SOS V11 — CASTELLERS SEED (CASTELLERS-001 sprint A)
// Ruta · /js/core/castellersSeed.js
//
// Cas real pre-loaded · "Castellers de la Vila de Gràcia" · perfecte per
// a testejar tot SOS · rols clars · transaccions tangibles + intangibles
// · valors comunitaris · processos cíclics.
//
// Pure · zero KB · zero DOM. KB.upsert el fa el caller.
// =============================================================================

import { buildEmptyOrganization, addStakeholder, linkProject, updateStakeholderShares } from './organizationService.js';
import { buildEmptyProcess, linkRole, linkTransaction, linkSoc, addKpi, activateProcess } from './processService.js';
import { buildEmptySoc, addChecklistItem } from './socDualPurposeService.js';
import { buildEmptyResource, linkProcess as linkResourceProcess } from './resourceService.js';

export const CASTELLERS_PROJECT_ID = 'proj-castellers-gracia';
export const CASTELLERS_ORG_ID = 'org-castellers-gracia';

// buildCastellersSeed · pure · retorna tot l'arbre del cas Castellers
//   { org, project, roles, transactions, processes, socs, resources }
export function buildCastellersSeed({ ts = null, creatorHandle = '@alvaro' } = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();

    // ── 1. Organization ──────────────────────────────────────────────────
    let org = buildEmptyOrganization({
        id: CASTELLERS_ORG_ID,
        name: 'Castellers de la Vila de Gràcia',
        legalKind: 'association',
        founderHandle: creatorHandle,
        ts: now,
    });

    // 12 stakeholders representant la colla (numerats per simplicitat)
    const stakeholders = [
        { handle: '@cap-de-colla',    role: 'soci-fundador',    sharePct: 15 },
        { handle: '@cap-de-pinya',    role: 'soci-treballador', sharePct: 12 },
        { handle: '@cap-de-tronc',    role: 'soci-treballador', sharePct: 12 },
        { handle: '@cap-de-pom',      role: 'soci-treballador', sharePct: 10 },
        { handle: '@coord-assajos',   role: 'soci-treballador', sharePct: 8 },
        { handle: '@cap-de-musica',   role: 'soci-treballador', sharePct: 8 },
        { handle: '@responsable-pop', role: 'soci-treballador', sharePct: 7 },
        { handle: '@cap-de-canalla',  role: 'soci-treballador', sharePct: 7 },
        { handle: '@tresorer',        role: 'soci-treballador', sharePct: 6 },
    ];
    // 9 stakeholders + alvaro fundador = 100%
    // alvaro starts at 100% from buildEmptyOrganization · ajustem
    org = updateStakeholderShares(org, { [creatorHandle]: 15 });
    for (const sh of stakeholders) {
        org = addStakeholder(org, { handle: sh.handle, role: sh.role, sharePct: sh.sharePct, ts: now });
    }
    // total alvaro 15 + 9 stakeholders = 15+12+12+10+8+8+7+7+6 + 15 = 100

    // ── 2. Project (dins l'org) ──────────────────────────────────────────
    org = linkProject(org, CASTELLERS_PROJECT_ID, { ts: now });
    const project = {
        id: CASTELLERS_PROJECT_ID,
        type: 'project',
        orgId: org.id,
        nombre: 'Castellers de la Vila de Gràcia · Temporada 2026',
        name: 'Castellers de la Vila de Gràcia · Temporada 2026',
        sector_id: 'culture',
        subtype_id: 'castellers',
        projectType: 'cooperativa-cures',
        description: 'Colla castellera · construcció de castells humans · valors intangibles de compromís · identitat i cohesió que mantenen la pràctica viva.',
        purpose: 'Mantenir i fer créixer la tradició castellera local amb una colla cohesionada i segura.',
        creatorHandle,
        content: { canvas: null, quality_target: 85 },
        vna_roles: [],
        vna_transactions: [],
        vna_flows: [],
        tags: ['castellers', 'tradicio', 'cohesio', 'comunitat', 'castellers-seed'],
        createdAt: now,
        updatedAt: now,
        isArchived: false,
    };

    // ── 3. Roles · 12 (3 pinya · 4 tronc · 3 pom · 2 coordinació) ───────
    const roles = [
        // Pinya · base
        { id: 'castellers-baix-pinya',  label: 'Baix de pinya',        castell_level: 'pinya',       description: 'Suport físic base · els que aguanten el pes de tot el castell' },
        { id: 'castellers-segon-pinya', label: 'Segon de pinya',       castell_level: 'pinya',       description: 'Segona fila de la pinya · sostén els terços' },
        { id: 'castellers-terç-pinya',  label: 'Terç de pinya',        castell_level: 'pinya',       description: 'Tercera fila · pont entre pinya i tronc' },
        // Tronc · cos central
        { id: 'castellers-segon',       label: 'Segon',                castell_level: 'tronc',       description: 'Primer nivell del tronc · estructura del castell' },
        { id: 'castellers-terç',        label: 'Terç',                 castell_level: 'tronc',       description: 'Segon nivell del tronc · equilibri' },
        { id: 'castellers-quart',       label: 'Quart',                castell_level: 'tronc',       description: 'Tercer nivell del tronc · agilitat + coordinació' },
        { id: 'castellers-quint',       label: 'Quint',                castell_level: 'tronc',       description: 'Quart nivell del tronc · tècnica fina' },
        // Pom de dalt · canalla
        { id: 'castellers-dosos',       label: 'Dosos',                castell_level: 'pom_de_dalt', description: 'Pom de dalt · canalla · velocitat de muntada' },
        { id: 'castellers-acotxador',   label: 'Acotxador',            castell_level: 'pom_de_dalt', description: 'Penúltim canalla · coronament' },
        { id: 'castellers-enxaneta',    label: 'Enxaneta',             castell_level: 'pom_de_dalt', description: 'Punta del castell · marca el "fet"' },
        // Coordinació
        { id: 'castellers-cap-colla',   label: 'Cap de colla',         castell_level: 'pom_de_dalt', description: 'Lideratge estratègic · pren decisions castell a fer · seguretat' },
        { id: 'castellers-músics',      label: 'Banda de música',      castell_level: 'pinya',       description: 'Gralla i timbal · timing del castell · presència ritual' },
    ].map(r => ({
        ...r,
        id: r.id + '-' + CASTELLERS_PROJECT_ID,
        type: 'role',
        content: {
            projectId: CASTELLERS_PROJECT_ID,
            kind: 'project_role',
            label: r.label,
            roleSlug: r.id,
            description: r.description,
            castell_level: r.castell_level,
            createdBy: creatorHandle,
        },
        keywords: ['type:role', 'projectId:' + CASTELLERS_PROJECT_ID, 'castell-level:' + r.castell_level, 'castellers-seed'],
        createdAt: now, updatedAt: now,
    }));

    project.vna_roles = roles.map(r => ({ id: r.id, label: r.content.label, roleSlug: r.content.roleSlug }));

    // ── 4. Transactions · 18 (10 tangible · 8 intangible) ────────────────
    const txTemplates = [
        // Tangibles · MUST · entregables verificables
        { id: 'tx-cap-coordina-pinya',    from: 'castellers-cap-colla',   to: 'castellers-baix-pinya',  deliverable: 'Ordre d\'entrada a plaça',           type: 'tangible',   is_must: true,  frequency: 'setmanal' },
        { id: 'tx-pinya-aguanta',         from: 'castellers-baix-pinya',  to: 'castellers-segon',       deliverable: 'Base estable per al tronc',          type: 'tangible',   is_must: true,  frequency: 'setmanal' },
        { id: 'tx-segon-aguanta-terç',    from: 'castellers-segon',       to: 'castellers-terç',        deliverable: 'Plataforma per al següent nivell',   type: 'tangible',   is_must: true,  frequency: 'setmanal' },
        { id: 'tx-terç-aguanta-quart',    from: 'castellers-terç',        to: 'castellers-quart',       deliverable: 'Plataforma',                          type: 'tangible',   is_must: true,  frequency: 'setmanal' },
        { id: 'tx-quart-aguanta-quint',   from: 'castellers-quart',       to: 'castellers-quint',       deliverable: 'Plataforma',                          type: 'tangible',   is_must: true,  frequency: 'setmanal' },
        { id: 'tx-quint-acota',           from: 'castellers-quint',       to: 'castellers-acotxador',   deliverable: 'Plataforma final',                    type: 'tangible',   is_must: true,  frequency: 'setmanal' },
        { id: 'tx-acotxador-enxaneta',    from: 'castellers-acotxador',   to: 'castellers-enxaneta',    deliverable: 'Plataforma per a coronar',           type: 'tangible',   is_must: true,  frequency: 'setmanal' },
        { id: 'tx-enxaneta-corona',       from: 'castellers-enxaneta',    to: 'castellers-cap-colla',   deliverable: 'Aleta marcant el "fet"',             type: 'tangible',   is_must: true,  frequency: 'setmanal' },
        { id: 'tx-music-ritma',           from: 'castellers-músics',      to: 'castellers-cap-colla',   deliverable: 'Tonada al moment exacte (toc d\'inici)', type: 'tangible', is_must: true, frequency: 'setmanal' },
        { id: 'tx-tresorer-quotes',       from: 'castellers-baix-pinya',  to: 'castellers-cap-colla',   deliverable: 'Quotes mensuals socis',              type: 'tangible',   is_must: true,  frequency: 'mensual' },
        // Intangibles · EXTRA · valor invisible pero crucial
        { id: 'tx-confiança-pinya',       from: 'castellers-baix-pinya',  to: 'castellers-enxaneta',    deliverable: 'Confiança radical (jo t\'aguanto)',  type: 'intangible', is_must: true,  frequency: 'setmanal' },
        { id: 'tx-presencia-família',     from: 'castellers-músics',      to: 'castellers-dosos',       deliverable: 'Sensació de comunitat ritual',       type: 'intangible', is_must: false, frequency: 'setmanal' },
        { id: 'tx-acompañament-canalla',  from: 'castellers-cap-colla',   to: 'castellers-enxaneta',    deliverable: 'Mentoria canalla (no-pares-fins-dalt)', type: 'intangible', is_must: true, frequency: 'setmanal' },
        { id: 'tx-correcció-tècnica',     from: 'castellers-cap-colla',   to: 'castellers-baix-pinya',  deliverable: 'Feedback tècnic post-assaig',        type: 'intangible', is_must: true,  frequency: 'setmanal' },
        { id: 'tx-identitat-colla',       from: 'castellers-cap-colla',   to: 'castellers-baix-pinya',  deliverable: 'Narrativa de la colla (qui som)',    type: 'intangible', is_must: false, frequency: 'mensual' },
        { id: 'tx-compromis-temporada',   from: 'castellers-baix-pinya',  to: 'castellers-cap-colla',   deliverable: 'Compromís d\'assistència',            type: 'intangible', is_must: true,  frequency: 'anyal' },
        { id: 'tx-emocio-actuació',       from: 'castellers-enxaneta',    to: 'castellers-baix-pinya',  deliverable: 'Aleta emocional · "ho hem fet"',     type: 'intangible', is_must: true,  frequency: 'setmanal' },
        { id: 'tx-cohesió-vermut',        from: 'castellers-cap-colla',   to: 'castellers-baix-pinya',  deliverable: 'Vermut post-actuació · ritual social', type: 'intangible', is_must: false, frequency: 'setmanal' },
    ].map(tx => ({
        ...tx,
        // ids amb projectId suffix per a uniqueness
        id: tx.id + '-' + CASTELLERS_PROJECT_ID,
        from: tx.from + '-' + CASTELLERS_PROJECT_ID,
        to: tx.to + '-' + CASTELLERS_PROJECT_ID,
    }));

    project.vna_transactions = txTemplates.map(tx => ({ ...tx }));

    // ── 5. Processes · 4 (assajos · actuacions · governance · cohort-learn) ─
    let pAssajos = buildEmptyProcess({
        id: 'proc-assajos-' + CASTELLERS_PROJECT_ID,
        orgId: org.id,
        label: 'Assajos setmanals',
        category: 'ops',
        cycleHint: 'weekly',
        ts: now,
    });
    // Vincular rols essencials d'assajos
    for (const rid of ['castellers-baix-pinya', 'castellers-cap-colla', 'castellers-músics', 'castellers-enxaneta'].map(r => r + '-' + CASTELLERS_PROJECT_ID)) {
        pAssajos = linkRole(pAssajos, rid, { ts: now });
    }
    for (const tid of ['tx-pinya-aguanta', 'tx-correcció-tècnica', 'tx-confiança-pinya'].map(t => t + '-' + CASTELLERS_PROJECT_ID)) {
        pAssajos = linkTransaction(pAssajos, tid, { ts: now });
    }
    pAssajos = addKpi(pAssajos, { id: 'kpi-assist', label: 'Assistència mensual', kind: 'percentage', target: 80 });
    pAssajos = activateProcess(pAssajos, { ts: now });

    let pActuacions = buildEmptyProcess({
        id: 'proc-actuacions-' + CASTELLERS_PROJECT_ID,
        orgId: org.id,
        label: 'Actuacions a plaça',
        category: 'ops',
        cycleHint: 'monthly',
        ts: now,
    });
    pActuacions = addKpi(pActuacions, { id: 'kpi-castells-descarregats', label: 'Castells descarregats / temporada', kind: 'count', target: 10 });
    pActuacions = activateProcess(pActuacions, { ts: now });

    let pGovernance = buildEmptyProcess({
        id: 'proc-governance-' + CASTELLERS_PROJECT_ID,
        orgId: org.id,
        label: 'Assemblees i decisions',
        category: 'governance',
        cycleHint: 'monthly',
        ts: now,
    });
    pGovernance = addKpi(pGovernance, { id: 'kpi-assamblees', label: 'Assamblees/any', kind: 'count', target: 4 });
    pGovernance = activateProcess(pGovernance, { ts: now });

    let pLearn = buildEmptyProcess({
        id: 'proc-learn-' + CASTELLERS_PROJECT_ID,
        orgId: org.id,
        label: 'Onboarding nous castellers',
        category: 'learn',
        cycleHint: 'quarterly',
        ts: now,
    });
    pLearn = addKpi(pLearn, { id: 'kpi-onboardings', label: 'Nous castellers/any', kind: 'count', target: 20 });
    pLearn = activateProcess(pLearn, { ts: now });

    const processes = [pAssajos, pActuacions, pGovernance, pLearn];

    // ── 6. SOCs · 5 (un per procés crític) ──────────────────────────────
    const socAssaig = addChecklistItem(
        addChecklistItem(
            buildEmptySoc({ slug: 'castellers-assaig-tipus', purpose: 'Estructura estàndard d\'un assaig setmanal · 90 minuts · seguretat + tècnica + cohesió', author: creatorHandle, ts: now }),
            { label: 'Escalfament físic 15 min · mobilitat + nucli', verification_kind: 'manual' }
        ),
        { label: 'Práctica per pinyes 30 min · tècnica base', verification_kind: 'manual' }
    );
    const socActuacio = addChecklistItem(
        buildEmptySoc({ slug: 'castellers-actuacio-protocol', purpose: 'Protocol previ + durant + post a una actuació · seguretat absoluta', author: creatorHandle, ts: now }),
        { label: 'Reunió tècnica pre-castell · cap de colla aprova', verification_kind: 'attestation' }
    );
    const socAssemblea = buildEmptySoc({ slug: 'castellers-assemblea', purpose: 'Govern interno · decisions estratègiques anuals', author: creatorHandle, ts: now });
    const socOnboard = addChecklistItem(
        buildEmptySoc({ slug: 'castellers-onboarding', purpose: 'Acompanyar un nou casteller del primer assaig fins a la primera actuació segura', author: creatorHandle, ts: now }),
        { label: 'Setmana 1 · acollida + xerrada de valors', verification_kind: 'evidence-upload' }
    );
    const socSeguretat = buildEmptySoc({ slug: 'castellers-seguretat-canalla', purpose: 'Protocols especials de seguretat per als castellers menors d\'edat', author: creatorHandle, ts: now });

    const socs = [socAssaig, socActuacio, socAssemblea, socOnboard, socSeguretat];

    // Vincular SOCs als processos
    pAssajos = linkSoc(pAssajos, socAssaig.id, { ts: now });
    pActuacions = linkSoc(linkSoc(pActuacions, socActuacio.id, { ts: now }), socSeguretat.id, { ts: now });
    pGovernance = linkSoc(pGovernance, socAssemblea.id, { ts: now });
    pLearn = linkSoc(linkSoc(pLearn, socOnboard.id, { ts: now }), socSeguretat.id, { ts: now });
    const processesLinked = [pAssajos, pActuacions, pGovernance, pLearn];

    // ── 7. Resources · 3 (local d'assaig · gralla · faixa) ──────────────
    let resLocal = buildEmptyResource({
        orgId: org.id,
        kind: 'space',
        label: 'Local d\'assaig · Vila de Gràcia',
        costMonthlyEur: 600,
        capacity: { max: 120, unit: 'users' },
        ts: now,
    });
    resLocal = linkResourceProcess(resLocal, pAssajos.id, { ts: now });
    resLocal = linkResourceProcess(resLocal, pLearn.id, { ts: now });

    let resGralla = buildEmptyResource({
        orgId: org.id,
        kind: 'equipment',
        label: 'Gralla i timbal (banda de música)',
        costMonthlyEur: 0,           // ja comprat
        ts: now,
    });
    resGralla = linkResourceProcess(resGralla, pActuacions.id, { ts: now });

    let resFaixes = buildEmptyResource({
        orgId: org.id,
        kind: 'consumable',
        label: 'Faixes (uniforme casteller)',
        costMonthlyEur: 50,          // reposició mensual
        ts: now,
    });

    const resources = [resLocal, resGralla, resFaixes];
    for (const r of resources) {
        org = { ...org, sharedResourceIds: [...(org.sharedResourceIds || []), r.id] };
    }

    return {
        org,
        project,
        roles,
        transactions: txTemplates,
        processes: processesLinked,
        socs,
        resources,
        stats: {
            stakeholderCount: org.stakeholders.length,
            roleCount: roles.length,
            transactionCount: txTemplates.length,
            processCount: processesLinked.length,
            socCount: socs.length,
            resourceCount: resources.length,
            tangibleTxCount: txTemplates.filter(t => t.type === 'tangible').length,
            intangibleTxCount: txTemplates.filter(t => t.type === 'intangible').length,
        },
    };
}
