// =============================================================================
// TEAMTOWERS SOS V11 — VNA SHAPE EVALUATORS (v158)
// Ruta · /js/core/vnaShapeEvaluators.js
//
// Tests booleans deterministes per al loop d'auto-millora de qualitat ·
// estructura + counts + named-fields per a Value Map · SOCs · SOPs.
//
// API ·
//   evaluateValueMapShape(parsed)  → { ok, score, issues[] }
//   evaluateSocsShape(parsed)      → { ok, score, issues[] }
//   evaluateSopsShape(parsed)      → { ok, score, issues[] }
//
// Cada evaluador retorna ·
//   ok      · bool · gating decision (pots usar com a "passa al següent step")
//   score   · 0-100 · puntuació composta · útil per a regression detection
//   issues  · llista de strings explicant què falta o és invàlid
//
// Filosofia · 100% determinista · sense LLM · executable en CI · ràpid (<10ms).
// =============================================================================

export const SHAPE_EVAL_VERSION = 'v158';

const VALID_ROLE_KINDS         = ['human', 'org', 'ai', 'collective', 'system'];
const VALID_CASTELL_LEVELS     = ['pom_de_dalt', 'tronc', 'pinya', 'laterals', 'mans', 'baixos'];
const VALID_TX_TYPES           = ['tangible', 'intangible'];
const VALID_DELIVERABLE_KINDS  = ['analysis', 'code', 'tests', 'comm', 'doc', 'design', 'review', 'workshop', 'signature', 'data', 'event', 'asset'];
const VALID_APPROVAL_RULES     = ['manual', 'tdd', 'tdd-auto', 'tdd-manual', 'human'];
const VALID_VERIFICATION_KINDS = ['sop-exists', 'tdd', 'manual-review', 'attestation'];
const VALID_PHASES             = ['idea', 'mvp', 'validation', 'scale', 'discover', 'design', 'deliver', 'operate'];

function _isStr(v, minLen = 1) { return typeof v === 'string' && v.trim().length >= minLen; }
function _isArr(v, minLen = 0) { return Array.isArray(v) && v.length >= minLen; }

// ─── Value Map ────────────────────────────────────────────────────────
// Requereix · roles[≥3], transactions[≥3], deliverables[≥3]
// Cada rol · {id, name(≥3), kind∈VALID_ROLE_KINDS, castell_level?}
// Cada tx  · {id, from, to, deliverable, type∈{tangible,intangible}}
// Cada del · {id, name(≥3), kind∈VALID_DELIVERABLE_KINDS}
// Bonus · intangibles_pct ∈ [25%, 50%] · reciprocals ≥ 1
export function evaluateValueMapShape(parsed) {
    const issues = [];
    let pts = 0;
    const max = 100;
    if (!parsed || typeof parsed !== 'object') {
        return { ok: false, score: 0, issues: ['parsed is not an object'] };
    }

    const roles = Array.isArray(parsed.roles) ? parsed.roles : [];
    const txs   = Array.isArray(parsed.transactions) ? parsed.transactions : [];
    const dels  = Array.isArray(parsed.deliverables) ? parsed.deliverables : [];

    // Counts (40pts)
    if (roles.length >= 3) pts += 15; else issues.push('roles · need ≥3, got ' + roles.length);
    if (txs.length   >= 3) pts += 15; else issues.push('transactions · need ≥3, got ' + txs.length);
    if (dels.length  >= 3) pts += 10; else issues.push('deliverables · need ≥3, got ' + dels.length);

    // Roles shape (20pts) · id+name+kind
    const goodRoles = roles.filter(r => r && _isStr(r.id) && _isStr(r.name, 3) && VALID_ROLE_KINDS.includes(r.kind));
    const rolesPct  = roles.length ? goodRoles.length / roles.length : 0;
    pts += Math.round(rolesPct * 20);
    if (rolesPct < 1) issues.push('roles · ' + (roles.length - goodRoles.length) + ' missing id/name/kind');

    // Transactions shape (20pts) · id+from+to+deliverable+type
    const goodTxs = txs.filter(t => t && _isStr(t.id) && _isStr(t.from) && _isStr(t.to) && _isStr(t.deliverable) && VALID_TX_TYPES.includes(t.type));
    const txsPct  = txs.length ? goodTxs.length / txs.length : 0;
    pts += Math.round(txsPct * 20);
    if (txsPct < 1) issues.push('transactions · ' + (txs.length - goodTxs.length) + ' missing required fields');

    // Deliverables shape (10pts)
    const goodDels = dels.filter(d => d && _isStr(d.id) && _isStr(d.name, 3));
    const delsPct  = dels.length ? goodDels.length / dels.length : 0;
    pts += Math.round(delsPct * 10);
    if (delsPct < 1) issues.push('deliverables · ' + (dels.length - goodDels.length) + ' missing id/name');

    // Bonus quality (10pts) · intangibles_pct + reciprocals
    if (goodTxs.length) {
        const intang = goodTxs.filter(t => t.type === 'intangible').length;
        const pct    = intang / goodTxs.length;
        if (pct >= 0.25 && pct <= 0.50) pts += 5;
        else issues.push('intangibles_pct out of [25%,50%] · ' + Math.round(pct * 100) + '%');

        const pairs = new Set();
        let reciprocal = 0;
        goodTxs.forEach(t => {
            const k = t.from + '|' + t.to;
            const rk = t.to + '|' + t.from;
            if (pairs.has(rk)) reciprocal++;
            pairs.add(k);
        });
        if (reciprocal >= 1) pts += 5;
        else issues.push('reciprocal_cycles · need ≥1');
    }

    const score = Math.min(max, pts);
    return { ok: score >= 70 && roles.length >= 3 && txs.length >= 3, score, issues };
}

// ─── SOCs ─────────────────────────────────────────────────────────────
// Requereix · socs[≥2]
// Cada soc · {id, name(≥4), purpose(≥10), phase∈VALID_PHASES, checklist[≥2]}
// Cada checklist item · {id, label(≥10), verification_kind∈VALID_VERIFICATION_KINDS}
export function evaluateSocsShape(parsed) {
    const issues = [];
    let pts = 0;
    if (!parsed || typeof parsed !== 'object') {
        return { ok: false, score: 0, issues: ['parsed is not an object'] };
    }

    const socs = Array.isArray(parsed.socs) ? parsed.socs : [];
    if (socs.length < 2) {
        return { ok: false, score: 0, issues: ['socs · need ≥2, got ' + socs.length] };
    }
    pts += 20;

    // Shape SOCs (50pts)
    const goodSocs = socs.filter(s => s
        && _isStr(s.id)
        && _isStr(s.name, 4)
        && _isStr(s.purpose, 10)
        && VALID_PHASES.includes(s.phase)
        && _isArr(s.checklist, 2)
    );
    const socsPct = goodSocs.length / socs.length;
    pts += Math.round(socsPct * 50);
    if (socsPct < 1) issues.push('socs · ' + (socs.length - goodSocs.length) + ' missing id/name/purpose/phase/checklist≥2');

    // Checklist items shape (20pts) · sample first 3 socs
    let totalItems = 0, goodItems = 0;
    goodSocs.slice(0, 3).forEach(s => {
        (s.checklist || []).forEach(it => {
            totalItems++;
            if (it && _isStr(it.id) && _isStr(it.label, 10) && VALID_VERIFICATION_KINDS.includes(it.verification_kind)) {
                goodItems++;
            }
        });
    });
    const itemsPct = totalItems ? goodItems / totalItems : 0;
    pts += Math.round(itemsPct * 20);
    if (itemsPct < 1) issues.push('checklist items · ' + (totalItems - goodItems) + '/' + totalItems + ' missing id/label/verification_kind');

    // Name specificity (10pts) · no "Procés 1" / "SOC 1" / "Initial step"
    const generic = /^(proc[eé]s|soc|process|paso|step)\s*\d+/i;
    const namedOk = goodSocs.filter(s => !generic.test(s.name)).length;
    if (goodSocs.length) {
        const pct = namedOk / goodSocs.length;
        pts += Math.round(pct * 10);
        if (pct < 1) issues.push('socs · ' + (goodSocs.length - namedOk) + ' have generic names ("Procés N")');
    }

    const score = Math.min(100, pts);
    return { ok: score >= 70, score, issues };
}

// ─── SOPs ─────────────────────────────────────────────────────────────
// Requereix · sops[≥1]
// Cada sop · {id, role_ref, title(verb+obj, ≥6), steps[≥3, ≤6]}
// Cada step · {id, label(≥6), deliverable_kind∈VALID_DELIVERABLE_KINDS, approval_rule∈VALID_APPROVAL_RULES, role_kind∈{human,ai}}
export function evaluateSopsShape(parsed) {
    const issues = [];
    let pts = 0;
    if (!parsed || typeof parsed !== 'object') {
        return { ok: false, score: 0, issues: ['parsed is not an object'] };
    }

    const sops = Array.isArray(parsed.sops) ? parsed.sops : [];
    if (sops.length < 1) {
        return { ok: false, score: 0, issues: ['sops · need ≥1, got 0'] };
    }
    pts += 15;

    // Shape SOPs (35pts)
    const goodSops = sops.filter(s => s
        && _isStr(s.id)
        && _isStr(s.role_ref)
        && _isStr(s.title, 6)
        && _isArr(s.steps, 3)
        && s.steps.length <= 6
    );
    const sopsPct = goodSops.length / sops.length;
    pts += Math.round(sopsPct * 35);
    if (sopsPct < 1) issues.push('sops · ' + (sops.length - goodSops.length) + ' missing id/role_ref/title or steps not in [3,6]');

    // Steps shape (35pts) · all steps of good SOPs
    let totalSteps = 0, goodSteps = 0;
    goodSops.forEach(s => {
        (s.steps || []).forEach(st => {
            totalSteps++;
            if (st
                && _isStr(st.id)
                && _isStr(st.label, 6)
                && VALID_DELIVERABLE_KINDS.includes(st.deliverable_kind)
                && VALID_APPROVAL_RULES.includes(st.approval_rule)
                && (st.role_kind === 'human' || st.role_kind === 'ai')
            ) {
                goodSteps++;
            }
        });
    });
    const stepsPct = totalSteps ? goodSteps / totalSteps : 0;
    pts += Math.round(stepsPct * 35);
    if (stepsPct < 1) issues.push('steps · ' + (totalSteps - goodSteps) + '/' + totalSteps + ' missing id/label/deliverable_kind/approval_rule/role_kind');

    // Title specificity (15pts) · verb+object · no "Setup" / "Initial step" / "Procés N"
    const generic = /^(setup|init(?:ial)?|inici|procés|proceso|process|step|paso)\s*\d*$/i;
    const namedOk = goodSops.filter(s => !generic.test((s.title || '').trim())).length;
    if (goodSops.length) {
        const pct = namedOk / goodSops.length;
        pts += Math.round(pct * 15);
        if (pct < 1) issues.push('sops · ' + (goodSops.length - namedOk) + ' have generic titles');
    }

    const score = Math.min(100, pts);
    return { ok: score >= 70, score, issues };
}

// Helper · run-all per al cycle runner
export function evaluateBundle({ map, socs, sops }) {
    return {
        map:  map  ? evaluateValueMapShape(map)  : null,
        socs: socs ? evaluateSocsShape(socs)     : null,
        sops: sops ? evaluateSopsShape(sops)     : null,
    };
}
