// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT LIFECYCLE SERVICE (LIFECYCLE-DASHBOARD sprint A)
// Ruta · /js/core/lifecycleService.js
//
// Calcula l'estat de cicle d'un projecte SOS · 10 fases · per cadascuna
// retorna { id, label, status: 'done'|'partial'|'pending'|'na', completion,
// detail, nextAction, href }. Pure · zero KB · zero DOM. La view consum.
//
// Les 10 fases derivades del Project Lifecycle blueprint (commit anterior).
// Reusa · projectCanvasService · ledgerService · projectQualityService.
//
// PRINCIPI · graceful degradation · items pendents (pitch · tokenomics ·
// proposal · invoice) mostren CTA "crear" enlloc de bloquejar.
// =============================================================================

import { computeCanvasCompletion } from './projectCanvasService.js';
import { computeBalanceSheet, computePLForPeriod, LEDGER_ENTRY_TYPE } from './ledgerService.js';

// Lifecycle phases · ordre fix · referent per al dashboard.
export const LIFECYCLE_PHASES = Object.freeze([
    Object.freeze({ id: 'canvas',     label: '🎨 Canvas',        order: 1, kind: 'foundation' }),
    Object.freeze({ id: 'pitch',      label: '📣 Pitch',         order: 2, kind: 'foundation' }),
    Object.freeze({ id: 'kanban',     label: '📊 Kanban',        order: 3, kind: 'execution'  }),
    Object.freeze({ id: 'pacts',      label: '🤝 Pactes',        order: 4, kind: 'execution'  }),
    Object.freeze({ id: 'tokenomics', label: '🪙 Tokenomics',    order: 5, kind: 'value'      }),
    Object.freeze({ id: 'accounting', label: '📒 Comptabilitat', order: 6, kind: 'value'      }),
    Object.freeze({ id: 'proposals',  label: '📝 Propostes',     order: 7, kind: 'commercial' }),
    Object.freeze({ id: 'products',   label: '🛒 Productes',     order: 8, kind: 'commercial' }),
    Object.freeze({ id: 'workshops',  label: '🎓 Workshops',     order: 9, kind: 'commercial' }),
    Object.freeze({ id: 'invoices',   label: '🧾 Facturació',    order: 10, kind: 'commercial' }),
]);

const STATUS_WEIGHTS = { done: 1, partial: 0.5, pending: 0, na: 0 };

// computeProjectLifecycle · pura · principal API.
//
// args ·
//   project       · node project SOS (amb content.canvas si existeix)
//   ledgerEntries · ledger_entry nodes (per accounting + invoices)
//   sops          · sop nodes (per kanban)
//   workOrders    · work_order nodes (per kanban)
//   pacts         · pact nodes
//   workshops     · workshop nodes
//   marketItems   · market_item nodes (productes)
//   proposals     · proposal nodes (sprint pending · null acceptat)
//   invoices      · invoice nodes (sprint pending · null acceptat)
//   tokenomics    · token_design nodes (sprint pending · null acceptat)
//   pitches       · project_pitch nodes (sprint pending · null acceptat)
//
// Retorna ·
//   {
//     phases: [{ id, label, status, completion: 0-1, detail, nextAction,
//                href }, ...],
//     overall: { completion: 0-1, percent: int, doneCount, totalCount },
//     nextBestAction: { phase, href, label },
//   }
export function computeProjectLifecycle({
    project       = null,
    ledgerEntries = [],
    sops          = [],
    workOrders    = [],
    pacts         = [],
    workshops     = [],
    marketItems   = [],
    proposals     = [],
    invoices      = [],
    tokenomics    = [],
    pitches       = [],
} = {}) {
    if (!project || !project.id) {
        return {
            phases: [],
            overall: { completion: 0, percent: 0, doneCount: 0, totalCount: LIFECYCLE_PHASES.length },
            nextBestAction: null,
        };
    }
    const pid = project.id;
    const phases = LIFECYCLE_PHASES.map(p => {
        switch (p.id) {
            case 'canvas':     return _phaseCanvas(p, project);
            case 'pitch':      return _phasePitch(p, project, pitches, pid);
            case 'kanban':     return _phaseKanban(p, sops, workOrders, pid);
            case 'pacts':      return _phasePacts(p, pacts, pid);
            case 'tokenomics': return _phaseTokenomics(p, tokenomics, pid);
            case 'accounting': return _phaseAccounting(p, ledgerEntries, pid);
            case 'proposals':  return _phaseProposals(p, proposals, pid);
            case 'products':   return _phaseProducts(p, marketItems, pid);
            case 'workshops':  return _phaseWorkshops(p, workshops, pid);
            case 'invoices':   return _phaseInvoices(p, invoices, pid);
            default:           return { ...p, status: 'na', completion: 0, detail: 'unknown', nextAction: null, href: null };
        }
    });

    // Overall · weighted average · status weights · done=1, partial=0.5
    const considered = phases.filter(p => p.status !== 'na');
    const sum = considered.reduce((s, p) => s + (STATUS_WEIGHTS[p.status] ?? 0), 0);
    const completion = considered.length ? (sum / considered.length) : 0;
    const doneCount  = phases.filter(p => p.status === 'done').length;

    // Next best action · la primera fase pending o partial (per ordre)
    const nextPhase = phases.find(p => p.status === 'pending' || p.status === 'partial') || null;
    const nextBestAction = nextPhase ? {
        phase:  nextPhase.id,
        label:  nextPhase.nextAction || ('Continuar amb ' + nextPhase.label),
        href:   nextPhase.href,
    } : null;

    return {
        phases,
        overall: {
            completion,
            percent:    Math.round(completion * 100),
            doneCount,
            totalCount: LIFECYCLE_PHASES.length,
        },
        nextBestAction,
    };
}

// computeNextBestAction · helper · retorna sols el next-best (per UX hints
// inline a la topbar o al hub view).
export function computeNextBestAction(args) {
    return computeProjectLifecycle(args).nextBestAction;
}

// ─── HELPERS PER FASE ────────────────────────────────────────────────────

function _phaseCanvas(p, project) {
    const canvas = project.content?.canvas || null;
    if (!canvas) {
        return {
            ...p,
            status:     'pending',
            completion: 0,
            detail:     'Cap canvas definit',
            nextAction: 'Definir vision · mission · values al canvas',
            href:       '/canvas?project=' + encodeURIComponent(project.id),
        };
    }
    const c = computeCanvasCompletion(canvas);
    const status = c.percent === 100 ? 'done' : (c.percent > 0 ? 'partial' : 'pending');
    return {
        ...p,
        status,
        completion: c.ratio,
        detail:     c.filled + '/' + c.total + ' steps · ' + c.percent + '%',
        nextAction: status === 'done' ? null : 'Completar canvas · ' + c.filled + '/' + c.total,
        href:       '/canvas?project=' + encodeURIComponent(project.id),
    };
}

function _phasePitch(p, project, pitches, pid) {
    // Pitch · busquem nodes de tipus project_pitch o presentation_narrative
    // a project.content. Fallback · project.presentation_narrative_v1.
    const relevant = (pitches || []).filter(x => x?.projectId === pid || x?.content?.projectId === pid);
    const hasNarrative = !!(project.presentation_narrative_v1 || project.content?.pitch);
    if (relevant.length === 0 && !hasNarrative) {
        return {
            ...p,
            status:     'pending',
            completion: 0,
            detail:     'Cap pitch encara · Wave 1 pendent',
            nextAction: 'Wave 1 · crear pitch públic',
            href:       null,    // sprint pending · ruta no existeix encara
        };
    }
    const completion = relevant.length > 0 ? 1 : 0.5;
    return {
        ...p,
        status:     completion === 1 ? 'done' : 'partial',
        completion,
        detail:     relevant.length > 0 ? (relevant.length + ' pitch node(s)') : 'narrative inline al project',
        nextAction: completion === 1 ? null : 'Wave 1 · pitch públic shareable',
        href:       null,
    };
}

function _phaseKanban(p, sops, workOrders, pid) {
    const projSops = (sops || []).filter(s => s?.projectId === pid);
    const projWos  = (workOrders || []).filter(w => w?.projectId === pid);
    const total = projSops.length + projWos.length;
    if (total === 0) {
        return {
            ...p,
            status:     'pending',
            completion: 0,
            detail:     'Cap SOP ni WO encara',
            nextAction: 'Crear primer SOP / WO',
            href:       '/kanban?project=' + encodeURIComponent(pid),
        };
    }
    // Heurística · si almenys 3 nodes (SOP + WO) · done. Entre 1-2 · partial.
    const status = total >= 3 ? 'done' : 'partial';
    return {
        ...p,
        status,
        completion: status === 'done' ? 1 : 0.5,
        detail:     projSops.length + ' SOPs · ' + projWos.length + ' WOs',
        nextAction: status === 'done' ? null : 'Afegir més SOPs / WOs (mín 3)',
        href:       '/kanban?project=' + encodeURIComponent(pid),
    };
}

function _phasePacts(p, pacts, pid) {
    const projPacts = (pacts || []).filter(x => x?.projectId === pid);
    if (projPacts.length === 0) {
        return {
            ...p,
            status:     'pending',
            completion: 0,
            detail:     'Cap pacte signat',
            nextAction: 'Construir primer pacte amb stakeholders',
            href:       '/pact?project=' + encodeURIComponent(pid),
        };
    }
    // Mirem si tots tenen ≥1 signature
    const signed = projPacts.filter(x => Array.isArray(x?.content?.signatures) && x.content.signatures.length > 0);
    const completion = signed.length / projPacts.length;
    const status = completion === 1 ? 'done' : (completion > 0 ? 'partial' : 'pending');
    return {
        ...p,
        status,
        completion,
        detail:     signed.length + '/' + projPacts.length + ' pactes signats',
        nextAction: status === 'done' ? null : 'Recollir signatures pendents',
        href:       '/pact?project=' + encodeURIComponent(pid),
    };
}

function _phaseTokenomics(p, tokenomics, pid) {
    const relevant = (tokenomics || []).filter(x => x?.projectId === pid);
    if (relevant.length === 0) {
        return {
            ...p,
            status:     'pending',
            completion: 0,
            detail:     'Cap token design · Wave 1 pendent',
            nextAction: 'Wave 1 · dissenyar tokenomics',
            href:       null,
        };
    }
    return {
        ...p,
        status:     'done',
        completion: 1,
        detail:     relevant.length + ' token design(s)',
        nextAction: null,
        href:       null,
    };
}

function _phaseAccounting(p, ledgerEntries, pid) {
    const entries = (ledgerEntries || []).filter(e => e?.projectId === pid && e?.type === LEDGER_ENTRY_TYPE);
    if (entries.length === 0) {
        return {
            ...p,
            status:     'pending',
            completion: 0,
            detail:     'Cap apunt comptable',
            nextAction: 'Afegir primer apunt double-entry',
            href:       '/accounting?project=' + encodeURIComponent(pid),
        };
    }
    const bs = computeBalanceSheet(entries);
    const pl = computePLForPeriod(entries, {});
    const status = bs.balanced && entries.length >= 3 ? 'done' : 'partial';
    return {
        ...p,
        status,
        completion: status === 'done' ? 1 : Math.min(0.5 + entries.length * 0.1, 0.9),
        detail:     entries.length + ' entries · profit ' + pl.profit.toFixed(2) + ' · ' + (bs.balanced ? '✓ quadrat' : '⚠ no quadrat'),
        nextAction: status === 'done' ? null : 'Afegir més entries (mín 3 · balanced)',
        href:       '/accounting?project=' + encodeURIComponent(pid),
    };
}

function _phaseProposals(p, proposals, pid) {
    const relevant = (proposals || []).filter(x => x?.projectId === pid);
    if (relevant.length === 0) {
        return {
            ...p,
            status:     'pending',
            completion: 0,
            detail:     'Cap proposta encara · Wave 1 pendent',
            nextAction: 'Wave 1 · generar proposta amb IA',
            href:       null,
        };
    }
    return {
        ...p,
        status:     'done',
        completion: 1,
        detail:     relevant.length + ' proposal(s)',
        nextAction: null,
        href:       null,
    };
}

function _phaseProducts(p, marketItems, pid) {
    const relevant = (marketItems || []).filter(x => x?.projectId === pid && (x?.kind === 'product' || x?.content?.kind === 'product'));
    if (relevant.length === 0) {
        return {
            ...p,
            status:     'pending',
            completion: 0,
            detail:     'Cap producte al market',
            nextAction: 'Crear primer producte al market',
            href:       '/market?project=' + encodeURIComponent(pid),
        };
    }
    return {
        ...p,
        status:     'done',
        completion: 1,
        detail:     relevant.length + ' producte(s) al market',
        nextAction: null,
        href:       '/market?project=' + encodeURIComponent(pid),
    };
}

function _phaseWorkshops(p, workshops, pid) {
    const relevant = (workshops || []).filter(x => x?.projectId === pid);
    if (relevant.length === 0) {
        return {
            ...p,
            status:     'pending',
            completion: 0,
            detail:     'Cap workshop programat',
            nextAction: 'Crear primer workshop',
            href:       '/workshops?project=' + encodeURIComponent(pid),
        };
    }
    return {
        ...p,
        status:     'done',
        completion: 1,
        detail:     relevant.length + ' workshop(s)',
        nextAction: null,
        href:       '/workshops?project=' + encodeURIComponent(pid),
    };
}

function _phaseInvoices(p, invoices, pid) {
    const relevant = (invoices || []).filter(x => x?.projectId === pid);
    if (relevant.length === 0) {
        return {
            ...p,
            status:     'pending',
            completion: 0,
            detail:     'Cap factura · Wave 1 pendent',
            nextAction: 'Wave 1 · facturació CRUD',
            href:       null,
        };
    }
    const paid = relevant.filter(x => x?.content?.status === 'paid');
    const completion = paid.length / relevant.length;
    return {
        ...p,
        status:     completion === 1 ? 'done' : 'partial',
        completion,
        detail:     paid.length + '/' + relevant.length + ' factures pagades',
        nextAction: completion === 1 ? null : 'Cobrar factures pendents',
        href:       null,
    };
}
