// =============================================================================
// TEAMTOWERS SOS V11 — ACTIVITY FEED SERVICE (UX-CENTRAL-HUB-001 part)
// Ruta · /js/core/activityFeedService.js
//
// Pure helper · agrega events de múltiples fonts (attestations · pacts ·
// WOs · ledger · cohort) en un feed unificat per al Project Hub redissenyat.
//
// Backend de xarxa social descentralitzada · les peces ja existeixen ·
// aquesta capa les explicita.
//
// Pure · zero KB · zero DOM.
// =============================================================================

export const ACTIVITY_KINDS = Object.freeze([
    'attestation-received',
    'attestation-issued',
    'pact-signed',
    'pact-created',
    'wo-completed',
    'wo-claimed',
    'ledger-entry-added',
    'invoice-paid',
    'proposal-accepted',
    'permaweb-published',
    'cohort-joined',
    'workshop-unlocked',
    'connection-made',          // social · following / trust signal
    'process-activated',
    'soc-approved',
    'org-stakeholder-added',
]);

// 7d default · feed relevance window
const DEFAULT_WINDOW_MS = 7 * 24 * 3600 * 1000;

// ── Builders ───────────────────────────────────────────────────────────────

// _toNumber · pure · accepta number · ISO string · null · undefined ·
// retorna number vàlid o null. Defensiu contra dades amb tsps en formats
// barrejats (ex · ledger té createdAt:1700... · invoices ISO · etc).
function _toNumber(v) {
    if (typeof v === 'number' && isFinite(v)) return v;
    if (typeof v === 'string') {
        // Try ISO date parse
        const parsed = Date.parse(v);
        if (!isNaN(parsed)) return parsed;
        // Try numeric string
        const n = Number(v);
        if (isFinite(n)) return n;
    }
    return null;
}

// _firstValidTs · pure · pren els candidats i retorna el primer ts vàlid ·
// fallback a fallbackTs (ex · Date.now()) si cap és vàlid.
function _firstValidTs(candidates, fallbackTs) {
    for (const c of candidates) {
        const n = _toNumber(c);
        if (n !== null) return n;
    }
    return _toNumber(fallbackTs) || Date.now();
}

// buildActivityEvent · pure · forma estàndard d'un event
export function buildActivityEvent({
    kind,
    ts,
    actorHandle = null,
    targetId = null,           // node id afectat
    targetType = null,         // 'project' | 'pact' | etc
    title = null,
    summary = null,
    relevanceScore = 0.5,      // 0-1 · ranking signal
    iconHint = null,
    href = null,
    payload = {},
}) {
    if (!kind || !ACTIVITY_KINDS.includes(kind)) {
        throw new Error('buildActivityEvent · kind invalid · ' + kind);
    }
    if (typeof ts !== 'number') {
        throw new Error('buildActivityEvent · ts required (number)');
    }
    return {
        kind,
        ts,
        actorHandle,
        targetId,
        targetType,
        title:   title || _defaultTitle(kind, payload),
        summary: summary || null,
        relevanceScore,
        iconHint: iconHint || _defaultIcon(kind),
        href,
        payload,
    };
}

function _defaultTitle(kind, payload) {
    switch (kind) {
        case 'attestation-received': return '✨ Nova atestació rebuda';
        case 'attestation-issued':   return '🤝 Atestació enviada';
        case 'pact-signed':          return '📝 Pacte signat';
        case 'pact-created':         return '📄 Nou pacte creat';
        case 'wo-completed':         return '✅ Work order completat';
        case 'wo-claimed':           return '🐝 WO reclamat per un agent';
        case 'ledger-entry-added':   return '📒 Entrada comptable';
        case 'invoice-paid':         return '💰 Factura cobrada';
        case 'proposal-accepted':    return '✓ Proposta acceptada';
        case 'permaweb-published':   return '🌐 Publicat al permaweb';
        case 'cohort-joined':        return '🌱 Nou membre cohort';
        case 'workshop-unlocked':    return '🎓 Workshop desbloquejat';
        case 'connection-made':      return '🔗 Nova connexió';
        case 'process-activated':    return '⚡ Procés activat';
        case 'soc-approved':         return '✓ SOC aprovat';
        case 'org-stakeholder-added': return '👥 Stakeholder afegit';
        default: return kind;
    }
}

function _defaultIcon(kind) {
    switch (kind) {
        case 'attestation-received': case 'attestation-issued': return '✨';
        case 'pact-signed': case 'pact-created':               return '📝';
        case 'wo-completed':                                    return '✅';
        case 'wo-claimed':                                      return '🐝';
        case 'ledger-entry-added': case 'invoice-paid':         return '💰';
        case 'proposal-accepted':                               return '✓';
        case 'permaweb-published':                              return '🌐';
        case 'cohort-joined':                                   return '🌱';
        case 'workshop-unlocked':                               return '🎓';
        case 'connection-made':                                 return '🔗';
        case 'process-activated':                               return '⚡';
        case 'soc-approved':                                    return '✓';
        case 'org-stakeholder-added':                           return '👥';
        default: return '·';
    }
}

// ── Derivation helpers · des de nodes KB ──────────────────────────────────

// deriveFromAttestations · pure · attestation nodes → activity events
export function deriveFromAttestations(attestations = [], { userHandle = null, ts = Date.now() } = {}) {
    return attestations.map(att => {
        const isRecipient = att.content?.targetHandle === userHandle;
        return buildActivityEvent({
            kind: isRecipient ? 'attestation-received' : 'attestation-issued',
            ts: _firstValidTs([att.createdAt], ts),
            actorHandle: att.content?.attesterHandle || null,
            targetId: att.id,
            targetType: 'attestation',
            summary: att.content?.statement?.slice(0, 120) || null,
            relevanceScore: 0.7,
        });
    });
}

// deriveFromPacts
export function deriveFromPacts(pacts = [], { ts = Date.now() } = {}) {
    return pacts.map(p => buildActivityEvent({
        kind: p.content?.status === 'signed' ? 'pact-signed' : 'pact-created',
        ts: _firstValidTs([p.updatedAt, p.createdAt], ts),
        targetId: p.id,
        targetType: 'pact',
        summary: p.content?.title || p.content?.summary?.slice(0, 120),
        relevanceScore: p.content?.status === 'signed' ? 0.9 : 0.5,
    }));
}

// deriveFromWos · acompleixin estat done o claimed
export function deriveFromWos(wos = [], { ts = Date.now() } = {}) {
    const out = [];
    for (const wo of wos) {
        if (wo.status === 'done' || wo.completed_at) {
            out.push(buildActivityEvent({
                kind: 'wo-completed',
                ts: _firstValidTs([wo.completed_at, wo.updatedAt], ts),
                actorHandle: wo.claimed_by || null,
                targetId: wo.id,
                targetType: 'work_order',
                title: '✅ ' + (wo.title || wo.id),
                summary: wo.description?.slice(0, 120) || null,
                relevanceScore: 0.8,
            }));
        } else if (wo.status === 'claimed') {
            out.push(buildActivityEvent({
                kind: 'wo-claimed',
                ts: _firstValidTs([wo.claimed_at, wo.updatedAt], ts),
                actorHandle: wo.claimed_by || null,
                targetId: wo.id,
                targetType: 'work_order',
                title: '🐝 ' + (wo.title || wo.id),
                relevanceScore: 0.5,
            }));
        }
    }
    return out;
}

// deriveFromLedger
export function deriveFromLedger(entries = [], { ts = Date.now() } = {}) {
    return entries
        .filter(e => e.content?.amount > 0)
        .map(e => buildActivityEvent({
            kind: 'ledger-entry-added',
            ts: _firstValidTs([e.createdAt], ts),
            targetId: e.id,
            targetType: 'ledger_entry',
            summary: e.content?.description?.slice(0, 120) || null,
            relevanceScore: 0.4,
            payload: { amount: e.content.amount, debit: e.content.debitAccount, credit: e.content.creditAccount },
        }));
}

// deriveFromInvoices
export function deriveFromInvoices(invoices = [], { ts = Date.now() } = {}) {
    return invoices
        .filter(i => i.content?.status === 'paid')
        .map(i => buildActivityEvent({
            kind: 'invoice-paid',
            ts: _firstValidTs([i.content?.paidAt, i.updatedAt, i.createdAt], ts),
            targetId: i.id,
            targetType: 'invoice',
            title: '💰 ' + (i.content?.number || 'Factura'),
            summary: (i.content?.client || '') + ' · ' + (i.content?.totals?.gross || 0) + '€',
            relevanceScore: 0.85,
        }));
}

// deriveFromProposals · només accepted
export function deriveFromProposals(proposals = [], { ts = Date.now() } = {}) {
    return proposals
        .filter(p => p.content?.status === 'accepted')
        .map(p => buildActivityEvent({
            kind: 'proposal-accepted',
            ts: _firstValidTs([p.content?.acceptedAt, p.updatedAt, p.createdAt], ts),
            targetId: p.id,
            targetType: 'proposal',
            title: '✓ ' + (p.content?.client || 'Proposta acceptada'),
            relevanceScore: 0.9,
        }));
}

// ── Aggregator · combina N derive · ordena · filtra ──────────────────────

// buildFeed · pure · combina events de varies fonts · ordena · filtra
//
// args ·
//   sources · { attestations, pacts, wos, ledger, invoices, proposals }
//   userHandle · per a relevance signaling
//   limit · max events retornats
//   sortBy · 'relevance' (7d window) | 'chrono' (cronològic)
//   sinceMs · timestamp · filtra events més antics
//
// Retorna · ordered array of activity events
export function buildFeed({
    sources = {},
    userHandle = null,
    limit = 20,
    sortBy = 'relevance',
    sinceMs = null,
    ts = null,
} = {}) {
    const now = typeof ts === 'number' ? ts : Date.now();
    const allEvents = [
        ...deriveFromAttestations(sources.attestations || [], { userHandle, ts: now }),
        ...deriveFromPacts(sources.pacts || [], { ts: now }),
        ...deriveFromWos(sources.wos || [], { ts: now }),
        ...deriveFromLedger(sources.ledger || [], { ts: now }),
        ...deriveFromInvoices(sources.invoices || [], { ts: now }),
        ...deriveFromProposals(sources.proposals || [], { ts: now }),
        ...(sources.custom || []),    // events custom injectats
    ];

    // Filter sinceMs
    let filtered = sinceMs != null
        ? allEvents.filter(e => e.ts >= sinceMs)
        : allEvents;

    // Sort
    if (sortBy === 'chrono') {
        filtered.sort((a, b) => b.ts - a.ts);
    } else {
        // Relevance · within 7d window: combine recency + relevanceScore
        const window = DEFAULT_WINDOW_MS;
        filtered = filtered.map(e => {
            const ageMs = now - e.ts;
            const recency = ageMs <= window ? (1 - ageMs / window) : 0;
            const compositeScore = (e.relevanceScore || 0.5) * 0.6 + recency * 0.4;
            return { ...e, _compositeScore: compositeScore };
        });
        filtered.sort((a, b) => b._compositeScore - a._compositeScore);
    }

    return filtered.slice(0, limit);
}

// ── Stats ──────────────────────────────────────────────────────────────────

export function summarizeFeed(events = []) {
    const byKind = {};
    for (const e of events) {
        byKind[e.kind] = (byKind[e.kind] || 0) + 1;
    }
    return {
        total: events.length,
        byKind,
        oldest: events.length ? Math.min(...events.map(e => e.ts)) : null,
        newest: events.length ? Math.max(...events.map(e => e.ts)) : null,
    };
}
