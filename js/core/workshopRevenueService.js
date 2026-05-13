// =============================================================================
// TEAMTOWERS SOS V11 — WORKSHOP REVENUE SERVICE (WORKSHOPS-FED-001 sprint B)
//
// Service del paywall premium dels workshops · executa el split 70/20/10
// (creator · project · cohort) quan un usuari extern compra l'accés.
//
// Filosofia · Slicing Pie + FairShares · qui posa contingut (creator)
// rep la majoria · qui posa context (project stakeholders) participa ·
// qui posa xarxa (cohort) rep una part per finançar workshops nous +
// activitats d'incubadora.
//
// Casos especials del split:
//   1. Workshop sense cohortNumber · el 10% va al projecte → 70/30/0
//   2. Workshop sense projecte (standalone d'un autor) · el 20% va al
//      creator → 90/0/10 (o 100/0/0 si tampoc té cohort)
//
// PURO · zero side effects al test (split és funció pura). El
// `recordWorkshopUnlock` async sí orquestra dispatch + KB writes.
// =============================================================================

import { personalWalletIdFor, cohortWalletIdFor, getOrCreatePersonalWallet, getOrCreateCohortWallet, getOrCreateWalletForProject, topUpAndPersist, consumeAndPersist } from './walletService.js';

// Default split percentages · alineat amb backlog WORKSHOPS-FED-001
export const DEFAULT_SPLIT = Object.freeze({
    creator: 70,
    project: 20,
    cohort:  10,
});

export const UNLOCK_PRICING = Object.freeze({
    defaultEur: 2.50,
    minEur:     1.00,
    maxEur:     50.00,
});

// computeUnlockSplit · pur · matemàtica del split amb casos especials
//
// Args · { priceEur, creatorHandle?, projectId?, cohortNumber?, split? }
// Retorna · { creatorEur, projectEur, cohortEur, splitPct, fallbackApplied }
//
// fallbackApplied descriu si hem hagut d'aplicar reroute (cohort→project,
// project→creator) perquè algun receptor no estava disponible.
export function computeUnlockSplit({
    priceEur,
    creatorHandle = null,
    projectId     = null,
    cohortNumber  = null,
    split         = DEFAULT_SPLIT,
} = {}) {
    if (typeof priceEur !== 'number' || priceEur <= 0) {
        throw new Error('computeUnlockSplit · priceEur must be positive number');
    }
    if (priceEur > UNLOCK_PRICING.maxEur) {
        throw new Error('computeUnlockSplit · priceEur > maxEur (' + UNLOCK_PRICING.maxEur + ')');
    }
    if (!creatorHandle) {
        throw new Error('computeUnlockSplit · creatorHandle required (almenys el creator rep alguna cosa)');
    }
    const pct = { ...DEFAULT_SPLIT, ...(split || {}) };
    if (Math.abs(pct.creator + pct.project + pct.cohort - 100) > 0.5) {
        throw new Error('computeUnlockSplit · split percentages must sum to 100');
    }
    const fallbackApplied = [];
    const hasProject = !!projectId;
    const hasCohort  = typeof cohortNumber === 'number' && cohortNumber >= 0;

    // Cas 1 · sense cohort · 10% va al projecte (si hi és) sinó al creator
    // Cas 2 · sense projecte · el 20% va al creator
    let creatorPct = pct.creator;
    let projectPct = hasProject ? pct.project : 0;
    let cohortPct  = hasCohort  ? pct.cohort  : 0;
    if (!hasProject && pct.project > 0) {
        creatorPct += pct.project;
        fallbackApplied.push('project-missing → creator');
    }
    if (!hasCohort && pct.cohort > 0) {
        if (hasProject) {
            projectPct += pct.cohort;
            fallbackApplied.push('cohort-missing → project');
        } else {
            creatorPct += pct.cohort;
            fallbackApplied.push('cohort-missing → creator');
        }
    }

    const creatorEur = Number((priceEur * creatorPct / 100).toFixed(6));
    const projectEur = Number((priceEur * projectPct / 100).toFixed(6));
    const cohortEur  = Number((priceEur * cohortPct  / 100).toFixed(6));
    // Defensive · arrodoniment pot deixar dust. Reassignem residual al creator.
    const totalAssigned = creatorEur + projectEur + cohortEur;
    const dust = Number((priceEur - totalAssigned).toFixed(6));
    const creatorFinal = Number((creatorEur + dust).toFixed(6));

    return {
        priceEur,
        creatorHandle,
        projectId,
        cohortNumber,
        creatorEur:  creatorFinal,
        projectEur,
        cohortEur,
        splitPct: { creator: creatorPct, project: projectPct, cohort: cohortPct },
        fallbackApplied,
    };
}

// recordWorkshopUnlock · async · executa el split atòmic (best-effort
// amb refund si fall). El payerId pot ser un projectId o un personal
// wallet. Crida consumeAndPersist al payer i topUpAndPersist als 3
// receptors. Genera un node `workshop_unlock` al KB com a registre.
//
// Args · { workshop:{id, content:{projectId, cohortNumber, createdBy, priceEur?}},
//          payerProjectId, kb, store }
// Retorna · { unlockId, split, persisted }
export async function recordWorkshopUnlock({
    workshop,
    payerProjectId,
    priceEur = null,
    kb = null,
    store = null,
} = {}) {
    if (!workshop || !workshop.content) throw new Error('recordWorkshopUnlock · workshop required');
    if (!payerProjectId)                throw new Error('recordWorkshopUnlock · payerProjectId required');
    const c = workshop.content;
    const creatorHandle = c.createdBy || c.creatorHandle || '@alvaro';
    const finalPrice    = typeof priceEur === 'number' ? priceEur : (typeof c.priceEur === 'number' ? c.priceEur : UNLOCK_PRICING.defaultEur);
    const split = computeUnlockSplit({
        priceEur:      finalPrice,
        creatorHandle,
        projectId:     c.projectId || null,
        cohortNumber:  typeof c.cohortNumber === 'number' ? c.cohortNumber : null,
    });

    // 1. Consume del payer
    const payerBefore = await getOrCreateWalletForProject(payerProjectId);
    if (Number(payerBefore.content.balanceEur) < finalPrice) {
        throw new Error('insufficient-funds · payer ' + payerBefore.content.balanceEur + '€ < preu ' + finalPrice + '€');
    }
    await consumeAndPersist({
        projectId: payerProjectId,
        amountEur: finalPrice,
        kind:      'consume',
        ref:       'workshop-unlock-' + workshop.id,
        source:    'workshop-unlock',
        note:      'unlock workshop ' + (c.title || workshop.id),
    });

    // 2. Top-ups als 3 receptors
    const moves = [];
    // Creator personal wallet
    if (split.creatorEur > 0) {
        await topUpAndPersist({
            projectId: personalWalletIdFor(creatorHandle),
            amountEur: split.creatorEur,
            source:    'workshop-revenue-creator',
            ref:       'workshop-unlock-' + workshop.id,
            note:      'creator revenue · ' + (c.title || workshop.id),
        });
        moves.push({ receiver: 'creator', wallet: personalWalletIdFor(creatorHandle), amountEur: split.creatorEur });
    }
    // Project wallet
    if (split.projectEur > 0 && split.projectId) {
        await topUpAndPersist({
            projectId: split.projectId,
            amountEur: split.projectEur,
            source:    'workshop-revenue-project',
            ref:       'workshop-unlock-' + workshop.id,
            note:      'project revenue · ' + (c.title || workshop.id),
        });
        moves.push({ receiver: 'project', wallet: split.projectId, amountEur: split.projectEur });
    }
    // Cohort wallet
    if (split.cohortEur > 0 && typeof split.cohortNumber === 'number') {
        await getOrCreateCohortWallet(split.cohortNumber);
        await topUpAndPersist({
            projectId: cohortWalletIdFor(split.cohortNumber),
            amountEur: split.cohortEur,
            source:    'workshop-revenue-cohort',
            ref:       'workshop-unlock-' + workshop.id,
            note:      'cohort revenue · ' + (c.title || workshop.id),
        });
        moves.push({ receiver: 'cohort', wallet: cohortWalletIdFor(split.cohortNumber), amountEur: split.cohortEur });
    }

    // 3. Persisteix node `workshop_unlock` per auditoria
    const unlockId = 'workshop-unlock-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    if (kb) {
        try {
            await kb.upsert({
                id:   unlockId,
                type: 'workshop_unlock',
                content: {
                    workshopId:     workshop.id,
                    workshopTitle:  c.title || null,
                    payerProjectId,
                    priceEur:       finalPrice,
                    split,
                    moves,
                    createdAt:      Date.now(),
                },
                keywords:  ['type:workshop-unlock', 'workshop:' + workshop.id, 'payer:' + payerProjectId.slice(0, 20)],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        } catch (e) {
            console.warn('[workshopRevenue] audit log persist failed', e?.message);
        }
    }
    return { unlockId, split, moves, persisted: true };
}

// canUnlockWithoutPaying · pur · helper per UI · retorna true si l'usuari
// té accés gratuït per membership (cohort match o operator/matriu/public).
export function canUnlockWithoutPaying({
    workshop,
    member = null,    // { matriu_member content · cohortNumber, isPrimary, didSigned }
} = {}) {
    if (!workshop || !workshop.content) return false;
    const tier = workshop.content.accessTier || 'public';
    if (tier === 'public') return true;
    if (!member) return false;
    if (tier === 'operator') return !!member.didSigned;     // qualsevol DID signat
    if (tier === 'matriu')   return !!member.matriu;         // qualsevol cohort
    if (tier === 'cohort') {
        return typeof workshop.content.cohortNumber === 'number'
            && member.cohortNumber === workshop.content.cohortNumber;
    }
    return false;
}
