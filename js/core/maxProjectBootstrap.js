// =============================================================================
// TEAMTOWERS SOS V11 — MAX PROJECT BOOTSTRAP (MAX-BOOTSTRAP sprint A)
// Ruta · /js/core/maxProjectBootstrap.js
//
// Genera un projecte SOS "100/100 quality" amb 108 cohort managers · cadascun
// assignat a una skill del SKILL_TAXONOMY (90 skills disponibles + 18 padding
// generalistes per arribar a 108). Pre-omple totes les fases del lifecycle:
// canvas + pitch publicat + tokenomics + ledger entries + 1 invoice paid +
// 1 proposal accepted + workshops + market items. Així el lifecycle dashboard
// mostra 10/10 fases verdes.
//
// Pure · zero KB · zero DOM. El consumidor crida KB.upsert per cada node
// retornat. Reusa · founderTemplate (FOUNDER_ROLES base) + skillTaxonomy +
// projectCanvasService + projectPitchService + tokenomicsService +
// ledgerService + invoiceService + proposalService.
// =============================================================================

import { FOUNDER_PROJECT_DEFAULTS, FOUNDER_TRANSACTIONS, FOUNDER_SOPS, FOUNDER_WORKSHOPS } from './founderTemplate.js';
import { SKILL_TAXONOMY } from './skillTaxonomy.js';
import { buildEmptyCanvas, applyCanvasStep } from './projectCanvasService.js';
import { buildEmptyPitch, applyPitchSection, setPitchTagline, publishPitch } from './projectPitchService.js';
import { buildEmptyTokenDesign } from './tokenomicsService.js';
import { quickEntry } from './ledgerService.js';
import { buildEmptyInvoice, addInvoiceItem, transitionInvoiceStatus, markInvoicePaid, generateInvoiceNumber } from './invoiceService.js';
import { buildEmptyProposal, addDeliverable, setSkillsRequired, transitionProposalStatus } from './proposalService.js';

export const MAX_BOOTSTRAP_VERSION = 'v1.0';
export const TARGET_COHORT_MANAGERS = 108;

// Canvas drafts d'alta qualitat per cada step
const CANVAS_DRAFTS = Object.freeze({
    vision:       'En 10 anys 108 cohort managers + 100k operadors han desplegat valor real cooperatiu via SOS · l\'estàndard mundial post-extractiu.',
    mission:      'Cada cohort manager opera una galàxia de projectes amb skills profundes · transparència radical · entrega 10 onboardings cooperatius < 1h cada setmana.',
    values:       'transparència radical · experimentació > consens · anchoring ètic abans que velocitat · open source by default · economia de saldo prepagat · llinatge fundacional sostingut · post-extractivisme operatiu.',
    stakeholders: 'fundadors guanyen reputació + slicing pie · cohort managers guanyen 108 quotes equitatives + skill mastery · operadors guanyen ingressos reals · clients guanyen serveis cooperatius signats · comunitat guanya open source + permaweb · inversors retorn ètic a 5 anys.',
    'north-star': 'MAU cohort managers que han facturat 1k€ cooperatiu al mes via SOS',
});

// Pitch sections d'alta qualitat
const PITCH_DRAFTS = Object.freeze({
    problem:  'Fundadors cooperatius no tenen eina per dissenyar valor amb transparència real · els playbooks SaaS pressuposen jerarquies extractives i no modelen aportacions equitatives.',
    solution: 'TeamTowers SOS · sistema operatiu col·laboratiu local-first amb roles + transactions + entregables + slicing pie + permaweb federation + swarm IA paral·lel. Coberture 108 skills nuclears amb cohort managers reals.',
    traction: '108 cohort managers actius · 10 PRs merged en una sessió · 2185 tests verds · 90 skills nuclears cobertes · 12 pillars lifecycle complets · 4 capes operatives.',
    team:     '108 cohort managers · cadascun amb 1 skill nuclear de mastery · fundadors anchors ètics + operadors continuus + advisors externs · governança policèntrica.',
    ask:      'Recursos · 50k€ per a pilot enginyeria cooperativa · partners institucionals · primers clients pilots cooperatius · validadors permaweb a llarg termini.',
    vision:   'En 10 anys SOS és l\'estàndard cooperatiu mundial · 100k operadors actius · post-extractivisme operatiu de facto.',
});

// buildMaxQualityProject · pure · retorna múltiples nodes per upsert.
//
// args ·
//   creatorHandle · default founder
//   projectName   · default 'SOS Max · 108 Cohort'
//   sectorId      · default founder
//   ts            · injectable per a tests
//
// Retorna ·
//   {
//     project,           // node project amb canvas anclat
//     canvas,            // canvas complet (5/5)
//     pitch,             // project_pitch publicat (6/6)
//     tokenomics,        // token_design 100/100 quality
//     roles,             // [108 cohort_manager nodes · 1 per skill]
//     sops,              // FOUNDER_SOPS adaptats
//     workshops,         // FOUNDER_WORKSHOPS
//     ledgerEntries,     // 3+ balanced entries (cash inicial, despeses, etc)
//     invoices,          // 1 paid + 1 sent
//     proposals,         // 1 accepted + 1 sent
//     marketItems,       // 2 (1 producte + 1 service)
//     stats,             // { skills, roles, levels, quality, etc }
//   }
export function buildMaxQualityProject({
    creatorHandle = FOUNDER_PROJECT_DEFAULTS.creatorHandle,
    projectName   = 'SOS Max · 108 Cohort',
    sectorId      = FOUNDER_PROJECT_DEFAULTS.sectorId,
    ts            = null,
} = {}) {
    const now = (typeof ts === 'number') ? ts : Date.now();
    const id  = 'proj-max-' + creatorHandle.replace(/^@/, '') + '-' + now.toString(36);

    // 1. Canvas · 5 steps complets
    let canvas = buildEmptyCanvas({ ts: now });
    for (const [stepId, val] of Object.entries(CANVAS_DRAFTS)) {
        canvas = applyCanvasStep(canvas, stepId, val, { ts: now });
    }

    // 2. Project node amb canvas anclat
    const project = {
        id,
        type:          'project',
        nombre:        projectName,
        name:          projectName,
        sector_id:     sectorId,
        subtype_id:    FOUNDER_PROJECT_DEFAULTS.subtypeId,
        projectType:   FOUNDER_PROJECT_DEFAULTS.projectType,
        cohortNumber:  FOUNDER_PROJECT_DEFAULTS.cohortNumber,
        scope:         FOUNDER_PROJECT_DEFAULTS.scope,
        description:   'Projecte SOS Max quality · 108 cohort managers cobrint 90 skills nuclears + 18 generalistes · totes 10 fases lifecycle pre-omplertes per a demo + smoke test.',
        purpose:       'Demostrar el cicle complet SOS amb dades realistes · servir com a baseline per a continuous improvement loops.',
        content: {
            canvas,
            quality_target: 100,
            bootstrapVersion: MAX_BOOTSTRAP_VERSION,
        },
        createdAt:     now,
        updatedAt:     now,
        isArchived:    false,
        creatorHandle,
        vna_roles:     [],    // populated below from cohort managers
        vna_transactions: FOUNDER_TRANSACTIONS.map(t => ({ ...t })),
        vna_flows:     [],
        roles:         [],
        ledger:        [],
        telemetry:     [],
        workOrders:    [],
        tags:          ['max-bootstrap', 'cohort-108', 'lifecycle-complete'].concat(FOUNDER_PROJECT_DEFAULTS.tags.slice()),
    };

    // 3. 108 cohort managers · cada un amb una skill nuclear
    //    Si 90 skills < 108 · padding generalistes de SKILL_TAXONOMY (cycle)
    const roles = [];
    const vnaRoles = [];
    for (let i = 0; i < TARGET_COHORT_MANAGERS; i++) {
        const skill = SKILL_TAXONOMY[i % SKILL_TAXONOMY.length];
        const isPad = i >= SKILL_TAXONOMY.length;
        const roleId = 'cohort-mgr-' + String(i + 1).padStart(3, '0');
        const role = {
            id:        roleId + '-' + id,
            type:      'role',
            content: {
                projectId:        id,
                kind:             'cohort_manager',
                label:            'Cohort Manager #' + (i + 1) + (isPad ? ' (generalist)' : ' · ' + skill.label),
                primarySkillId:   skill.id,
                primarySkillName: skill.label,
                skillDomain:      skill.domain,
                skillTier:        skill.tier,
                isPadding:        isPad,
                createdBy:        creatorHandle,
            },
            keywords:  ['type:role', 'projectId:' + id, 'skill:' + skill.id, 'cohort-manager', 'max-bootstrap'],
            createdAt: now,
            updatedAt: now,
        };
        roles.push(role);
        vnaRoles.push({ id: role.id, label: role.content.label, primarySkillId: skill.id });
    }
    project.vna_roles = vnaRoles;

    // 4. Pitch · 6 seccions + publish
    let pitch = buildEmptyPitch({ projectId: id, tagline: 'OS cooperatiu local-first · 108 cohort managers · post-extractivisme operatiu', lang: 'ca', ts: now });
    for (const [secId, val] of Object.entries(PITCH_DRAFTS)) {
        pitch = applyPitchSection(pitch, secId, val, { ts: now });
    }
    pitch = setPitchTagline(pitch, 'OS cooperatiu local-first · 108 cohort managers · post-extractivisme operatiu', { ts: now });
    pitch = publishPitch(pitch, { projectName, ts: now });

    // 5. Tokenomics · default design (defaults sum 1.0 + vesting bo)
    const tokenomics = buildEmptyTokenDesign({
        projectId:   id,
        name:        'CohortToken',
        symbol:      'COHO',
        totalSupply: 10_800_000,    // 100k per cohort manager · simbolic
        ts:          now,
    });

    // 6. SOPs · base founder · adaptats al projecte
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
        keywords:  ['type:sop', 'projectId:' + id, 'roleId:' + s.roleId, 'max-bootstrap'],
        createdAt: now,
        updatedAt: now,
    }));

    // 7. Workshops · base founder
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
        keywords:  ['type:workshop', 'projectId:' + id, 'audience:' + w.audience, 'tier:' + w.accessTier, 'max-bootstrap'],
        createdAt: now,
        updatedAt: now,
    }));

    // 8. Ledger entries · 3 balanced · cash inicial · despesa · cobrament
    const ledgerEntries = [
        quickEntry({ projectId: id, debitAccount: 'cash',     creditAccount: 'equity',  amount: 5000, date: _isoDate(now, 0),   description: 'Aportació inicial cofundadors', ts: now }),
        quickEntry({ projectId: id, debitAccount: 'expenses', creditAccount: 'cash',    amount:  300, date: _isoDate(now, 7),   description: 'Despeses operatives mes 1',     ts: now + 1 }),
        quickEntry({ projectId: id, debitAccount: 'cash',     creditAccount: 'revenue', amount: 1200, date: _isoDate(now, 14),  description: 'Primer cobrament pilot cooperatiu', ts: now + 2 }),
    ];

    // 9. Invoices · 1 paid (genera 4t ledger entry auto) + 1 sent pending
    let invPaid = buildEmptyInvoice({ projectId: id, client: 'Cooperativa Pilot Pioneer', taxRate: 0.21, currency: 'EUR', ts: now });
    invPaid.content.number = generateInvoiceNumber({ existingInvoices: [], date: _isoDate(now, 5), ts: now });
    invPaid = addInvoiceItem(invPaid, { description: 'Consultoria SOS · 20h', quantity: 20, unitPrice: 80 });
    invPaid = transitionInvoiceStatus(invPaid, 'sent', { ts: now });
    const paidResult = markInvoicePaid(invPaid, { ts: now });
    const invoices = [paidResult.invoice];
    ledgerEntries.push(paidResult.ledgerEntry);

    let invSent = buildEmptyInvoice({ projectId: id, client: 'Cohort Test Inc', taxRate: 0.21, currency: 'EUR', ts: now + 100 });
    invSent.content.number = generateInvoiceNumber({ existingInvoices: invoices, date: _isoDate(now, 20), ts: now + 100 });
    invSent = addInvoiceItem(invSent, { description: 'Workshop foundation · 8h', quantity: 8, unitPrice: 120 });
    invSent = transitionInvoiceStatus(invSent, 'sent', { ts: now + 100 });
    invoices.push(invSent);

    // 10. Proposals · 1 accepted + 1 sent
    let propAcc = buildEmptyProposal({ projectId: id, client: 'Coop Tecnològica',
        summary: 'Disseny i implementació de governança cooperativa amb roles · transactions · entregables clars · slicing pie + onboarding 108 socis · 3 mesos de suport.',
        validUntil: _isoDate(now, 365), currency: 'EUR', ts: now });
    propAcc = addDeliverable(propAcc, { description: 'Workshop fundacional · 8 socis', estimatedHours: 8, price: 720 });
    propAcc = addDeliverable(propAcc, { description: 'Diagnòstic + matriu rols/tx', estimatedHours: 16, price: 1440 });
    propAcc = addDeliverable(propAcc, { description: 'Roll-out cooperatiu + suport 1 mes', estimatedHours: 24, price: 2160 });
    propAcc = setSkillsRequired(propAcc, ['vision-strategic', 'governance-design', 'slicing-pie', 'ownership-allocation']);
    propAcc = transitionProposalStatus(propAcc, 'sent', { ts: now + 200 });
    propAcc = transitionProposalStatus(propAcc, 'accepted', { ts: now + 300 });

    let propSent = buildEmptyProposal({ projectId: id, client: 'Network Pilot DAO',
        summary: 'Implementació pilot DAO governance amb on-chain attestations · workshops trimestrals · setup permaweb federation.',
        validUntil: _isoDate(now, 180), currency: 'EUR', ts: now + 400 });
    propSent = addDeliverable(propSent, { description: 'Setup DAO base + multisig', estimatedHours: 20, price: 1800 });
    propSent = addDeliverable(propSent, { description: 'Permaweb federation node', estimatedHours: 12, price: 1080 });
    propSent = setSkillsRequired(propSent, ['governance-design', 'transparency-protocols']);
    propSent = transitionProposalStatus(propSent, 'sent', { ts: now + 400 });

    const proposals = [propAcc, propSent];

    // 11. Market items · 1 producte + 1 service
    const marketItems = [
        {
            id:        'market-prod-' + id,
            type:      'market_item',
            content:   { projectId: id, kind: 'product', title: 'SOS Cohort Kit', description: 'Kit fundacional 108 cohort managers · plantilles + workshops base.', price: 2400, currency: 'EUR' },
            keywords:  ['type:market_item', 'kind:product', 'projectId:' + id, 'max-bootstrap'],
            createdAt: now, updatedAt: now,
        },
        {
            id:        'market-svc-' + id,
            type:      'market_item',
            content:   { projectId: id, kind: 'service', title: 'Onboarding cooperatiu 1:1', description: 'Sessió 2h · adaptació SOS al teu projecte.', price: 240, currency: 'EUR' },
            keywords:  ['type:market_item', 'kind:service', 'projectId:' + id, 'max-bootstrap'],
            createdAt: now, updatedAt: now,
        },
    ];

    return {
        project,
        canvas,
        pitch,
        tokenomics,
        roles,
        sops,
        workshops,
        ledgerEntries,
        invoices,
        proposals,
        marketItems,
        stats: {
            cohortManagers:  roles.length,
            skillsCovered:   SKILL_TAXONOMY.length,
            sopsCount:       sops.length,
            workshopsCount:  workshops.length,
            ledgerCount:     ledgerEntries.length,
            invoicesCount:   invoices.length,
            proposalsCount:  proposals.length,
            marketItemsCount: marketItems.length,
        },
    };
}

// _isoDate · helper · retorna YYYY-MM-DD a partir d'un ts base + dies
function _isoDate(baseMs, daysOffset) {
    const d = new Date(baseMs + daysOffset * 86400000);
    return d.toISOString().slice(0, 10);
}
