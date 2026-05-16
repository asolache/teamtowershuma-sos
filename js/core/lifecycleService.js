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
import { computeBalanceSheet, computePLForPeriod, computeLedgerAuditScore, AUDIT_LEVEL_META, LEDGER_ENTRY_TYPE } from './ledgerService.js';
import { computeInvoicesStatusBreakdown } from './invoiceService.js';
import { computeQualityScore as computeTokenomicsScore, TOKEN_DESIGN_TYPE } from './tokenomicsService.js';
import { computePitchCompletion, PROJECT_PITCH_TYPE } from './projectPitchService.js';
import { computeProposalsBreakdown, PROPOSAL_TYPE } from './proposalService.js';

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
    const relevant = (pitches || []).filter(x => x?.projectId === pid || x?.content?.projectId === pid);
    const href = '/pitch?project=' + encodeURIComponent(pid);
    if (relevant.length === 0) {
        // Fallback al narrative inline · si existeix · partial
        const hasNarrative = !!(project.presentation_narrative_v1 || project.content?.pitch);
        if (hasNarrative) {
            return {
                ...p,
                status:     'partial',
                completion: 0.3,
                detail:     'narrative inline al project · sense node pitch',
                nextAction: 'Crear pitch dedicat per a OG/share',
                href,
            };
        }
        return {
            ...p,
            status:     'pending',
            completion: 0,
            detail:     'Cap pitch encara',
            nextAction: 'Crear pitch públic shareable',
            href,
        };
    }
    // Take most recent · compute completion
    const latest = relevant.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
    const c = computePitchCompletion(latest);
    const published = !!latest.content?.publishedAt;
    let status;
    if (c.filled === c.total && published) status = 'done';
    else if (c.filled >= 3 || published)   status = 'partial';
    else                                    status = 'pending';
    return {
        ...p,
        status,
        completion: published ? Math.max(0.6, c.ratio) : c.ratio * 0.6,
        detail:     c.filled + '/' + c.total + ' seccions' + (published ? ' · 📡 publicat' : ' · draft'),
        nextAction: status === 'done' ? null : (published ? 'Completar seccions restants' : 'Omplir seccions (mín 3) i publicar'),
        href,
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
    const href = '/tokenomics?project=' + encodeURIComponent(pid);
    if (relevant.length === 0) {
        return {
            ...p,
            status:     'pending',
            completion: 0,
            detail:     'Cap token design encara',
            nextAction: 'Dissenyar tokenomics',
            href,
        };
    }
    // Take most recent · compute quality
    const latest = relevant.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
    const q = computeTokenomicsScore(latest);
    const status = q.score >= 75 ? 'done' : (q.score > 0 ? 'partial' : 'pending');
    return {
        ...p,
        status,
        completion: q.score / 100,
        detail:     latest.content?.symbol + ' · supply ' + (latest.content?.totalSupply || 0).toLocaleString() + ' · quality ' + q.score + '/100',
        nextAction: status === 'done' ? null : 'Millorar design (score < 75)',
        href,
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
    // CERT-001 pas 7 · usar audit score complet · no sols balanced
    const audit = computeLedgerAuditScore(entries);
    const auditMeta = AUDIT_LEVEL_META[audit.level] || AUDIT_LEVEL_META.draft;
    // status · done si gold (≥85) · partial si silver/bronze · pending si draft
    let status;
    if (audit.level === 'gold')       status = 'done';
    else if (audit.score >= 40)       status = 'partial';
    else                              status = 'pending';
    return {
        ...p,
        status,
        completion: audit.score / 100,
        detail:     auditMeta.icon + ' ' + auditMeta.label + ' · ' + audit.score + '/100 · ' + audit.counts.signed + '/' + audit.counts.total + ' signats · profit ' + pl.profit.toFixed(0) + '€',
        nextAction: status === 'done' ? null : (audit.counts.signed < audit.counts.total ? 'Signar entries restants' : (audit.counts.needsProofs > audit.counts.audited ? 'Afegir proofs a entries grans' : 'Afegir més entries balanced')),
        href:       '/accounting?project=' + encodeURIComponent(pid),
    };
}

function _phaseProposals(p, proposals, pid) {
    const relevant = (proposals || []).filter(x => x?.projectId === pid);
    const href = '/proposals?project=' + encodeURIComponent(pid);
    if (relevant.length === 0) {
        return {
            ...p,
            status:     'pending',
            completion: 0,
            detail:     'Cap proposta encara',
            nextAction: 'Generar primera proposta amb IA',
            href,
        };
    }
    const br = computeProposalsBreakdown(relevant);
    const status = br.accepted > 0 ? 'done' : (br.total > 0 ? 'partial' : 'pending');
    return {
        ...p,
        status,
        completion: br.accepted > 0 ? Math.min(1, br.acceptedRatio + 0.3) : 0.4,
        detail:     br.accepted + '/' + br.total + ' acceptades · €' + br.acceptedValue.toFixed(0) + ' guanyat',
        nextAction: status === 'done' ? (br.sent > 0 ? 'Tancar propostes pendents' : null) : 'Enviar propostes draft',
        href,
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
    const href = '/invoices?project=' + encodeURIComponent(pid);
    if (relevant.length === 0) {
        return {
            ...p,
            status:     'pending',
            completion: 0,
            detail:     'Cap factura encara',
            nextAction: 'Crear primera factura',
            href,
        };
    }
    const br = computeInvoicesStatusBreakdown(relevant);
    const completion = br.paidRatio;
    const status = completion === 1 ? 'done' : (completion > 0 ? 'partial' : 'pending');
    return {
        ...p,
        status,
        completion,
        detail:     br.paid + '/' + br.total + ' pagades · €' + br.paidAmount.toFixed(0) + ' cobrat de €' + br.totalAmount.toFixed(0),
        nextAction: status === 'done' ? null : 'Cobrar factures pendents',
        href,
    };
}
