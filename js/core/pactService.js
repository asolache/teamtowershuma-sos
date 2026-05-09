// TEAMTOWERS SOS V11 — PACT SERVICE (PACT-001 sprint A)
//
// Generador y validador de pactos de socios dinámicos · primer
// contrato del Mètode SOS. Compatible con Matriu Fair Fractal y
// con el slicing pie de cualquier proyecto (los 12 tipus PROJECT_TYPES).
//
// Filosofía (input @alvaro 2026-05-09):
//   "Pacto plano, comprensible, vivo. No es un contrato de notaría
//    rellenado por abogado. Es un acuerdo entre personas adultas
//    con cláusulas que el sistema entiende y puede ejecutar (slicing
//    pie automático, exit triggers, distribución de votos)."
//
// Schema canónico de un pacto:
//   {
//     id, type='pact', projectId,
//     content: {
//       version:    'sos-v1',
//       status:     'draft' | 'signed' | 'active' | 'sunset',
//       createdAt, updatedAt,
//       parties:    [{ identityId, displayName, role, contributionType,
//                       initialShare, multiplier?, walletAddress? }, ...],
//       clauses: {
//         object:      string · qué hace el proyecto · 1-3 frases
//         capital:     { totalEur, hasInitialCash, fairFractal }
//         participation: 'slicing-pie' | 'fixed-shares' | 'hybrid'
//         vesting:     { months, cliffMonths, type: 'linear' | 'milestone' }
//         decisions:   { mode: 'consensus' | 'majority' | 'multisig',
//                          quorum }
//         exit:        { trigger, snapshot, formula, payoutWindow }
//         conflict:    { firstPath: 'mediation', secondPath: 'arbitration' }
//         sunset:      { autoIfMetricsBelow, gracePeriodDays }
//       },
//       signatures:  [{ identityId, signedAt, signature, hashSnapshot }, ...]
//     }
//   }

const PACT_TYPE = 'pact';
const PACT_VERSION = 'sos-v1';

// ── Defaults · Fair Fractal alineado ────────────────────────────────

export const DEFAULT_PACT_CLAUSES = Object.freeze({
    object: 'Cooperar entre socis per construir, mantenir i fer créixer aquest projecte segons les regles aquí descrites.',
    capital: Object.freeze({
        totalEur:        0,
        hasInitialCash:  false,
        fairFractal:     true,    // regles Fair Fractal de Matriu
    }),
    participation: 'slicing-pie',
    vesting: Object.freeze({
        months:       24,
        cliffMonths:  6,
        type:         'linear',
    }),
    decisions: Object.freeze({
        mode:    'consensus',
        quorum:  0.66,    // 2/3 dels socis presents
    }),
    exit: Object.freeze({
        trigger:       'mutual-agreement-or-annual-window',
        snapshot:      'on-chain-block-or-keystone-tag',
        formula:       'slicing-pie-fair-market-value',
        payoutWindow:  '24h-after-snapshot',
    }),
    conflict: Object.freeze({
        firstPath:   'mediation',     // facilitador/a comunitari/a
        secondPath:  'arbitration',   // tribunal cooperatiu o arbitre extern
    }),
    sunset: Object.freeze({
        autoIfMetricsBelow:  null,    // ex. { metric: 'monthly-revenue-eur', below: 500 }
        gracePeriodDays:      90,
    }),
});

const VALID_PARTICIPATION = Object.freeze(['slicing-pie', 'fixed-shares', 'hybrid']);
const VALID_DECISION_MODES = Object.freeze(['consensus', 'majority', 'multisig']);
const VALID_VESTING_TYPES  = Object.freeze(['linear', 'milestone', 'cliff-only']);
const VALID_PACT_STATUS    = Object.freeze(['draft', 'signed', 'active', 'sunset']);

// ── Pure helpers ────────────────────────────────────────────────────

function pactIdFor(projectId) {
    if (!projectId) throw new Error('pactIdFor requires projectId');
    return `${projectId}::pact::${PACT_VERSION}`;
}

// validateParty · estructura mínima
function validateParty(p) {
    if (!p || typeof p !== 'object') return false;
    if (typeof p.identityId !== 'string' || !p.identityId) return false;
    if (typeof p.displayName !== 'string' || !p.displayName) return false;
    if (typeof p.role !== 'string' || !p.role) return false;
    if (typeof p.contributionType !== 'string' || !p.contributionType) return false;
    if (typeof p.initialShare !== 'number' || p.initialShare < 0 || p.initialShare > 1) return false;
    return true;
}

export function validateClauses(clauses) {
    if (!clauses || typeof clauses !== 'object') return false;
    if (typeof clauses.object !== 'string' || clauses.object.length < 10) return false;
    if (!VALID_PARTICIPATION.includes(clauses.participation)) return false;
    if (!clauses.vesting || !VALID_VESTING_TYPES.includes(clauses.vesting.type)) return false;
    if (typeof clauses.vesting.months !== 'number' || clauses.vesting.months < 0) return false;
    if (!clauses.decisions || !VALID_DECISION_MODES.includes(clauses.decisions.mode)) return false;
    if (typeof clauses.decisions.quorum !== 'number' || clauses.decisions.quorum < 0 || clauses.decisions.quorum > 1) return false;
    if (!clauses.exit || typeof clauses.exit !== 'object') return false;
    if (!clauses.conflict || typeof clauses.conflict !== 'object') return false;
    return true;
}

export function validatePact(pact) {
    if (!pact || typeof pact !== 'object') return false;
    if (pact.type !== PACT_TYPE) return false;
    if (!pact.projectId || typeof pact.projectId !== 'string') return false;
    if (!pact.content || typeof pact.content !== 'object') return false;
    if (pact.content.version !== PACT_VERSION) return false;
    if (!VALID_PACT_STATUS.includes(pact.content.status)) return false;
    if (!Array.isArray(pact.content.parties) || pact.content.parties.length < 1) return false;
    if (!pact.content.parties.every(validateParty)) return false;
    // Sum of initialShare ≤ 1.0 (resto va a slicing pie dinámico)
    const sum = pact.content.parties.reduce((acc, p) => acc + (p.initialShare || 0), 0);
    if (sum > 1.0001) return false;
    if (!validateClauses(pact.content.clauses)) return false;
    if (!Array.isArray(pact.content.signatures)) return false;
    return true;
}

// buildPactDraft · genera el nodo pact en estado draft listo para
// KB.upsert. NO firma · solo construye estructura.
export function buildPactDraft({ projectId, parties = [], clauses = {}, projectTypeId = null } = {}) {
    if (!projectId || typeof projectId !== 'string') {
        throw new Error('buildPactDraft requires projectId (string)');
    }
    if (!Array.isArray(parties) || parties.length === 0) {
        throw new Error('buildPactDraft requires ≥1 party');
    }
    // Validar parties
    for (const p of parties) {
        if (!validateParty(p)) {
            throw new Error('buildPactDraft · party inválida: ' + JSON.stringify(p));
        }
    }
    // Mergear cláusulas con defaults
    const merged = mergeClauses(DEFAULT_PACT_CLAUSES, clauses);
    if (!validateClauses(merged)) {
        throw new Error('buildPactDraft · clauses no válidas tras merge');
    }
    const now = Date.now();
    const node = {
        id:        pactIdFor(projectId),
        type:      PACT_TYPE,
        projectId,
        content: {
            version:   PACT_VERSION,
            status:    'draft',
            createdAt: now,
            updatedAt: now,
            projectTypeId: projectTypeId || null,
            parties:   parties.map(p => ({ ...p })),
            clauses:   merged,
            signatures: [],
        },
        keywords: [
            'type:pact',
            'kind:partnership-agreement',
            'project:' + projectId,
            'status:draft',
            ...(projectTypeId ? ['projectType:' + projectTypeId] : []),
        ],
    };
    return node;
}

// mergeClauses · puro · merge superficial conservando defaults
export function mergeClauses(defaults, overrides = {}) {
    const out = { ...defaults };
    for (const key of Object.keys(overrides || {})) {
        const ov = overrides[key];
        if (ov && typeof ov === 'object' && !Array.isArray(ov) && defaults[key] && typeof defaults[key] === 'object') {
            out[key] = { ...defaults[key], ...ov };
        } else if (ov !== undefined) {
            out[key] = ov;
        }
    }
    return out;
}

// renderPactMarkdown · puro · genera versión legible en Markdown
// (útil para exportar PDF · futuro)
export function renderPactMarkdown(pact) {
    if (!validatePact(pact)) return '# (pacto inválido)';
    const c = pact.content;
    const partiesMd = c.parties.map((p, i) =>
        `${i + 1}. **${p.displayName}** · ${p.role} · contribució: ${p.contributionType} · participació inicial: ${(p.initialShare * 100).toFixed(1)}%${p.multiplier ? ' · multiplicador ×' + p.multiplier : ''}`
    ).join('\n');
    const sigsMd = c.signatures.length === 0
        ? '_(cap signatura encara · pacte en draft)_'
        : c.signatures.map(s => `- ${s.identityId} · signat ${new Date(s.signedAt).toISOString()}`).join('\n');
    return [
        `# Pacte de socis dinàmic`,
        ``,
        `**Projecte**: ${pact.projectId}`,
        `**Versió**: ${c.version}  ·  **Estat**: ${c.status}`,
        c.projectTypeId ? `**Tipus de projecte**: ${c.projectTypeId}` : '',
        ``,
        `## Objecte`,
        c.clauses.object,
        ``,
        `## Socis (${c.parties.length})`,
        partiesMd,
        ``,
        `## Capital`,
        `- Total inicial: ${c.clauses.capital.totalEur} €`,
        `- Capital líquid inicial: ${c.clauses.capital.hasInitialCash ? 'sí' : 'no'}`,
        `- Regles Fair Fractal: ${c.clauses.capital.fairFractal ? 'sí' : 'no'}`,
        ``,
        `## Participació`,
        `- Mètode: **${c.clauses.participation}**`,
        ``,
        `## Vesting`,
        `- ${c.clauses.vesting.months} mesos · cliff ${c.clauses.vesting.cliffMonths} mesos · tipus ${c.clauses.vesting.type}`,
        ``,
        `## Decisions`,
        `- Mode: **${c.clauses.decisions.mode}** · quòrum ${(c.clauses.decisions.quorum * 100).toFixed(0)}%`,
        ``,
        `## Exit (sortida)`,
        `- Trigger: ${c.clauses.exit.trigger}`,
        `- Snapshot: ${c.clauses.exit.snapshot}`,
        `- Fórmula: ${c.clauses.exit.formula}`,
        `- Finestra de pagament: ${c.clauses.exit.payoutWindow}`,
        ``,
        `## Resolució de conflictes`,
        `- Primer pas: ${c.clauses.conflict.firstPath}`,
        `- Segon pas: ${c.clauses.conflict.secondPath}`,
        ``,
        `## Signatures`,
        sigsMd,
        ``,
        `---`,
        `*Generat per SOS V11 · TeamTowers · ${new Date(c.updatedAt).toISOString()}*`,
    ].filter(Boolean).join('\n');
}

// addSignature · puro · añade signatura a un pacto draft/signed.
// La signatura ECDSA real la calcula el caller con projectIO/identityService
// y se pasa aquí ya formada.
export function addSignature(pact, { identityId, signature, hashSnapshot }) {
    if (!validatePact(pact)) throw new Error('addSignature requires valid pact');
    if (!identityId || !signature || !hashSnapshot) {
        throw new Error('addSignature requires { identityId, signature, hashSnapshot }');
    }
    const already = (pact.content.signatures || []).find(s => s.identityId === identityId);
    if (already) return pact;   // idempotent
    const next = {
        ...pact,
        content: {
            ...pact.content,
            updatedAt: Date.now(),
            signatures: [
                ...(pact.content.signatures || []),
                { identityId, signedAt: Date.now(), signature, hashSnapshot },
            ],
        },
    };
    // Si todos los parties han firmado · status pasa a 'signed'
    const partyIds = next.content.parties.map(p => p.identityId);
    const signedIds = next.content.signatures.map(s => s.identityId);
    const allSigned = partyIds.every(id => signedIds.includes(id));
    if (allSigned && next.content.status === 'draft') {
        next.content.status = 'signed';
        next.keywords = (next.keywords || []).filter(k => k !== 'status:draft').concat(['status:signed']);
    }
    return next;
}

// pactSummary · puro · devuelve resumen para UI cards
export function pactSummary(pact) {
    if (!validatePact(pact)) return null;
    const c = pact.content;
    const sumShare = c.parties.reduce((acc, p) => acc + (p.initialShare || 0), 0);
    return {
        projectId:        pact.projectId,
        version:          c.version,
        status:           c.status,
        partiesCount:     c.parties.length,
        signaturesCount:  c.signatures.length,
        signedAll:        c.parties.length > 0 && c.signatures.length === c.parties.length,
        initialSharePct:  Math.round(sumShare * 100),
        slicingPiePct:    Math.round((1 - sumShare) * 100),
        participation:    c.clauses.participation,
        vestingMonths:    c.clauses.vesting.months,
        decisionMode:     c.clauses.decisions.mode,
        quorumPct:        Math.round(c.clauses.decisions.quorum * 100),
        projectTypeId:    c.projectTypeId,
        createdAt:        c.createdAt,
        updatedAt:        c.updatedAt,
    };
}
