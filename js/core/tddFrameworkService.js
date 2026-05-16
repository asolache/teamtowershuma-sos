// =============================================================================
// TEAMTOWERS SOS V11 — TDD FRAMEWORK SERVICE (TDD-ALL-LEVELS-001 sprint A)
// Ruta · /js/core/tddFrameworkService.js
//
// Estén TDD a TOTS els nivells · codi · WOs (DTD) · IA · usuari · procés · org.
//
//   1. Codi TDD ✓ (existing)
//   2. WO TDD = DTD ✓ (existing · agentBridgeSchema.deliverable_test)
//   3. IA Response TDD · validators per task kind · NOU
//   4. User Decision TDD · validators per acció crítica · NOU
//   5. Process TDD · KPI tests auto-run (processService.evaluateKpiHealth) ✓
//   6. Org TDD · health metrics agregats · NOU
//
// "Si pot fallar i no es testeja, no existeix." — Verna Allee
//
// Pure · zero KB · zero DOM.
// =============================================================================

export const TDD_LEVELS = Object.freeze([
    'code', 'wo', 'ai-response', 'user-decision', 'process', 'org',
]);

export const VALIDATOR_RESULT_KINDS = Object.freeze([
    'pass',    // tot correcte
    'fail',    // condició no acomplerta · cal acció
    'warn',    // borderline · usuari pot continuar amb avís
    'skip',    // no aplicable en aquest context
]);

// ── 3. IA Response validators ─────────────────────────────────────────────

// validateIaResponse · pure · validador genèric segons task kind.
// Retorna · { kind, reason }
export function validateIaResponse({ output, taskKind, expectedShape = null } = {}) {
    if (!output) return { kind: 'fail', reason: 'output empty' };
    const text = typeof output === 'string' ? output : (output.text || output.output || '');
    if (!text || typeof text !== 'string') return { kind: 'fail', reason: 'output no és text' };
    if (text.length < 5) return { kind: 'fail', reason: 'output massa curt · ' + text.length + ' chars' };

    // Per task kind · expectatives específiques
    switch (taskKind) {
        case 'schema-fill-simple':
        case 'value-map-design':
        case 'quality-audit': {
            // Esperem JSON estricte · prova de parse
            const cleaned = _stripFenced(text);
            try {
                const parsed = JSON.parse(cleaned);
                if (!parsed || typeof parsed !== 'object') return { kind: 'fail', reason: 'no és objecte JSON' };
                if (expectedShape) {
                    for (const key of expectedShape) {
                        if (!(key in parsed)) return { kind: 'fail', reason: 'falta camp · ' + key };
                    }
                }
                return { kind: 'pass', reason: 'JSON vàlid amb shape esperat' };
            } catch (e) {
                return { kind: 'fail', reason: 'JSON parse failed · ' + (e.message || e) };
            }
        }
        case 'tag-generation': {
            // Esperem llista simple · separada per coma o líniea
            const tags = text.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
            if (tags.length === 0) return { kind: 'fail', reason: 'cap tag detectat' };
            if (tags.length > 20) return { kind: 'warn', reason: 'massa tags · ' + tags.length };
            return { kind: 'pass', reason: tags.length + ' tags' };
        }
        case 'creative-narrative':
        case 'summary-short': {
            if (text.length < 30) return { kind: 'warn', reason: 'narrativa curta' };
            return { kind: 'pass', reason: text.length + ' chars' };
        }
        default:
            return { kind: 'pass', reason: 'no specific validation · accepted' };
    }
}

function _stripFenced(text) {
    const fenced = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    return fenced ? fenced[1].trim() : text.trim();
}

// ── 4. User Decision validators · catàleg ─────────────────────────────────

// Cada validator és pure (state) → { kind, reason, hint }.
// La UI els crida abans d'executar una acció crítica.

export const USER_ACTION_VALIDATORS = Object.freeze({

    // delete-project · només si projecte té backup o és buit
    'delete-project': (state) => {
        const { project, hasBackup = false, ledgerEntries = [] } = state || {};
        if (!project) return { kind: 'fail', reason: 'projecte no carregat' };
        if (ledgerEntries.length > 0 && !hasBackup) {
            return {
                kind: 'fail',
                reason: 'projecte amb ledger · cal backup primer',
                hint: 'Exporta el projecte abans d\'esborrar',
            };
        }
        return { kind: 'pass', reason: 'safe to delete' };
    },

    // publish-permaweb · cal saldo, firma valida, contingut minim
    'publish-permaweb': (state) => {
        const { walletBalanceEur = 0, requiredEur = 0.05, hasSignature = false, contentMinLength = 0 } = state || {};
        if (walletBalanceEur < requiredEur) {
            return { kind: 'fail', reason: 'saldo insuficient · ' + walletBalanceEur + '€ < ' + requiredEur + '€' };
        }
        if (!hasSignature) {
            return { kind: 'fail', reason: 'falta firma ECDSA' };
        }
        if (contentMinLength < 100) {
            return { kind: 'warn', reason: 'contingut curt · ' + contentMinLength + ' chars · publica igualment?' };
        }
        return { kind: 'pass', reason: 'ready to publish' };
    },

    // accept-proposal · cal stakeholder mandate i no conflicte
    'accept-proposal': (state) => {
        const { proposal, userHasMandate = false, conflictingPactCount = 0 } = state || {};
        if (!proposal) return { kind: 'fail', reason: 'proposta no carregada' };
        if (!userHasMandate) {
            return { kind: 'fail', reason: 'usuari no té mandat per acceptar' };
        }
        if (conflictingPactCount > 0) {
            return { kind: 'warn', reason: conflictingPactCount + ' pactes en conflicte · revisa abans' };
        }
        return { kind: 'pass', reason: 'safe to accept' };
    },

    // sign-deliverable · cal autoria + content hash present
    'sign-deliverable': (state) => {
        const { deliverable, isAuthor = false, contentHash = null } = state || {};
        if (!deliverable) return { kind: 'fail', reason: 'deliverable no carregat' };
        if (!isAuthor) return { kind: 'fail', reason: 'no ets autor · no pots signar' };
        if (!contentHash) return { kind: 'fail', reason: 'falta content hash per a la firma' };
        return { kind: 'pass', reason: 'safe to sign' };
    },

    // transfer-tokens · cal saldo + receptor valid
    'transfer-tokens': (state) => {
        const { fromBalance = 0, amount = 0, toAddress = null } = state || {};
        if (amount <= 0) return { kind: 'fail', reason: 'quantitat ≤ 0' };
        if (amount > fromBalance) return { kind: 'fail', reason: 'saldo insuficient' };
        if (!toAddress) return { kind: 'fail', reason: 'falta destinatari' };
        return { kind: 'pass', reason: 'safe to transfer' };
    },

    // complete-wo · cal deliverable real + signatura
    'complete-wo': (state) => {
        const { wo, deliverableUri = null, signature = null } = state || {};
        if (!wo) return { kind: 'fail', reason: 'WO no carregada' };
        if (wo.status === 'done') return { kind: 'skip', reason: 'WO ja completed' };
        if (!deliverableUri) return { kind: 'fail', reason: 'falta deliverable_uri' };
        if (!signature) return { kind: 'warn', reason: 'sense firma · audit score baix' };
        return { kind: 'pass', reason: 'safe to complete' };
    },
});

// validateUserAction · helper · busca validator i l'executa
export function validateUserAction(actionKey, state) {
    const v = USER_ACTION_VALIDATORS[actionKey];
    if (!v) return { kind: 'skip', reason: 'no validator for ' + actionKey };
    try {
        return v(state || {});
    } catch (e) {
        return { kind: 'fail', reason: 'validator error · ' + (e.message || e) };
    }
}

// ── 6. Org TDD · health agregat ───────────────────────────────────────────

// auditOrg · pure · agafa org + dades agregades · retorna findings
//
// args ·
//   org           · objecte Organization
//   processes     · array de Process (per agregar KPI health)
//   walletStats   · { balanceEur, monthlySpendEur } (opcional)
//   ledgerStats   · { totalRevenue, totalExpenses, balanceSheet } (opcional)
//
// Retorna · { score:0-100, findings: [{ kind, level, message, suggestedWo? }], state }
export function auditOrg({
    org,
    processes = [],
    walletStats = null,
    ledgerStats = null,
} = {}) {
    const findings = [];
    let score = 100;

    if (!org) return { score: 0, findings: [{ kind: 'fail', level: 'critical', message: 'no org' }], state: 'no-data' };

    // 1. Stakeholders · sum sharePct = 100?
    const shareSum = (org.stakeholders || [])
        .filter(s => typeof s.sharePct === 'number')
        .reduce((acc, s) => acc + s.sharePct, 0);
    if (Math.abs(shareSum - 100) > 0.01 && org.stakeholders?.length > 0) {
        findings.push({
            kind: 'fail',
            level: 'warning',
            message: 'sharePct sum = ' + shareSum + ' (no 100)',
            suggestedWo: 'review-sharePct-allocation',
        });
        score -= 10;
    }

    // 2. Processes · si en té, al menys 1 actiu?
    const activeProcs = processes.filter(p => p && p.status === 'active');
    if (processes.length > 0 && activeProcs.length === 0) {
        findings.push({
            kind: 'fail',
            level: 'critical',
            message: 'tots els processos pausats/deprecated',
            suggestedWo: 'activate-process',
        });
        score -= 25;
    }

    // 3. KPI health agregat
    for (const p of activeProcs) {
        const reds = (p.kpis || []).filter(k => {
            if (k.currentValue == null) return false;
            return k.currentValue < k.target * 0.7;
        });
        if (reds.length > 0) {
            findings.push({
                kind: 'warn',
                level: 'warning',
                message: 'procés "' + p.label + '" · ' + reds.length + ' KPI(s) en vermell',
                suggestedWo: 'improve-process-' + p.id,
            });
            score -= 5 * reds.length;
        }
    }

    // 4. Wallet health
    if (walletStats) {
        if (walletStats.balanceEur < 0) {
            findings.push({
                kind: 'fail',
                level: 'critical',
                message: 'wallet en descobert',
                suggestedWo: 'topup-wallet',
            });
            score -= 20;
        }
    }

    // 5. Ledger health · profit positiu sostingut?
    if (ledgerStats) {
        if (ledgerStats.totalRevenue !== undefined && ledgerStats.totalExpenses !== undefined) {
            if (ledgerStats.totalExpenses > ledgerStats.totalRevenue * 1.2) {
                findings.push({
                    kind: 'warn',
                    level: 'warning',
                    message: 'expenses 20%+ sobre revenue',
                    suggestedWo: 'review-cost-structure',
                });
                score -= 10;
            }
        }
    }

    // 6. Projectes · cap projecte? probable problema
    if ((org.projectIds || []).length === 0) {
        findings.push({
            kind: 'warn',
            level: 'info',
            message: 'org sense cap projecte',
            suggestedWo: 'create-first-project',
        });
        score -= 5;
    }

    score = Math.max(0, Math.min(100, score));
    let state;
    if (score >= 85)      state = 'green';
    else if (score >= 65) state = 'yellow';
    else                  state = 'red';

    return { score, findings, state };
}

// ── 6b · auditor genera WOs compensatòries ─────────────────────────────────

// auditOrgGenerateWos · pure · executa auditOrg + retorna WOs candidates
// per a posar al backlog. El caller decideix quins KB.upsert.
// Max 5 per dia · senil els altres com a "audit-findings" pendents.
export function auditOrgGenerateWos(input, { maxPerDay = 5, ts = null } = {}) {
    const audit = auditOrg(input);
    const now = typeof ts === 'number' ? ts : Date.now();
    const todayKey = new Date(now).toISOString().slice(0, 10);
    const wos = audit.findings
        .filter(f => f.suggestedWo)
        .slice(0, maxPerDay)
        .map((f, i) => ({
            id: 'wo-audit-' + todayKey + '-' + String(i + 1).padStart(2, '0'),
            type: 'work_order',
            project_id: input?.org?.id || 'unknown',
            title: 'Audit · ' + f.message,
            description: 'WO compensatòria generada per org-audit · suggestedWo: ' + f.suggestedWo,
            priority: f.level === 'critical' ? 'critical' : (f.level === 'warning' ? 'high' : 'medium'),
            complexity: 'S',
            status: 'pending',
            assignee_kind: 'human',
            required_capabilities: [],
            tags: ['audit-findings', f.suggestedWo],
            generatedAt: now,
        }));
    return { audit, wos };
}

// ── Aggregator · scoring global del setup TDD ─────────────────────────────

export function computeTddCoverage({
    codeTestsCount = 0,
    aiValidatorsActive = false,
    userValidatorsActive = false,
    processesWithKpis = 0,
    processesTotal = 0,
    orgAuditRan = false,
} = {}) {
    const levels = {
        code:           codeTestsCount > 0,
        wo:             true,         // sempre actiu (DTD baked into schema)
        'ai-response':  aiValidatorsActive,
        'user-decision':userValidatorsActive,
        process:        processesTotal > 0 && (processesWithKpis / processesTotal) >= 0.5,
        org:            orgAuditRan,
    };
    const total = Object.keys(levels).length;
    const active = Object.values(levels).filter(Boolean).length;
    return {
        coverage: Number((active / total).toFixed(3)),
        levels,
        activeCount: active,
        totalCount: total,
    };
}
