// =============================================================================
// TEAMTOWERS SOS V11 — WO TEMPLATE SERVICE (WO-AUTO-001 sprint A)
// Ruta · /js/core/woTemplateService.js
//
// El cor del SOS operatiu · templates de WO auto-generades segons cicle ·
// cron (8:30 diari · primer dilluns mes) · esdeveniments (factura cobrada
// · stock < N) · condicions (saldo wallet < 100€).
//
// Permet que SOS "funcioni sol" un cop l'usuari ha definit els seus
// processos.
//
// Pure · zero KB · zero DOM.
// =============================================================================

export const WO_TEMPLATE_TYPE = 'wo_template';
export const WO_TEMPLATE_VERSION = 'v1.0';

export const TRIGGER_KINDS = Object.freeze([
    'cron',          // expressió cron classica · "30 8 * * *"
    'event',         // disparat per event ('invoice-paid' · 'wo-completed:X')
    'condition',     // periodic check d'una condició (saldo wallet < N)
    'manual',        // l'usuari el dispara · template per a one-click
]);

// ── Cron parser minimal · suporta · 5-field cron + presets ────────────────
// Suporta · *  ·  N  · N,M (llista) · N-M (range) · */N (step). NO suporta ·
// L · # · ? · noms de dia/mes (mon · jan). Suficient per al 95% de casos.

export function parseCron(expr) {
    if (typeof expr !== 'string') return null;
    const trimmed = expr.trim();
    // Presets standard
    const PRESETS = {
        '@daily':   '0 0 * * *',
        '@hourly':  '0 * * * *',
        '@weekly':  '0 0 * * 0',
        '@monthly': '0 0 1 * *',
        '@yearly':  '0 0 1 1 *',
    };
    const effective = PRESETS[trimmed] || trimmed;
    const parts = effective.split(/\s+/);
    if (parts.length !== 5) return null;
    return {
        minute:     parts[0],
        hour:       parts[1],
        dayOfMonth: parts[2],
        month:      parts[3],
        dayOfWeek:  parts[4],
        original:   trimmed,
    };
}

// _matchField · pure · comprova si valor matcha pattern cron
function _matchField(pattern, value) {
    if (pattern === '*') return true;
    // Step *​/N
    const stepMatch = pattern.match(/^\*\/(\d+)$/);
    if (stepMatch) {
        const step = parseInt(stepMatch[1], 10);
        return step > 0 && value % step === 0;
    }
    // List · N,M,O
    if (pattern.includes(',')) {
        return pattern.split(',').some(p => _matchField(p.trim(), value));
    }
    // Range · N-M
    const rangeMatch = pattern.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
        const lo = parseInt(rangeMatch[1], 10);
        const hi = parseInt(rangeMatch[2], 10);
        return value >= lo && value <= hi;
    }
    // Numeric exact
    return parseInt(pattern, 10) === value;
}

// cronMatchesDate · pure · retorna true si la data acompleix l'expr cron
export function cronMatchesDate(cronExpr, date = new Date()) {
    const parsed = typeof cronExpr === 'string' ? parseCron(cronExpr) : cronExpr;
    if (!parsed) return false;
    return _matchField(parsed.minute, date.getMinutes())
        && _matchField(parsed.hour, date.getHours())
        && _matchField(parsed.dayOfMonth, date.getDate())
        && _matchField(parsed.month, date.getMonth() + 1)   // 1-12 cron · JS 0-11
        && _matchField(parsed.dayOfWeek, date.getDay());     // 0=sun
}

// ── Builders ───────────────────────────────────────────────────────────────

export function buildEmptyWoTemplate({
    id = null,
    projectId,
    processId = null,
    socId = null,
    label,
    triggerKind = 'cron',
    triggerConfig = {},
    woFactory = {},
    ts = null,
} = {}) {
    if (!projectId) throw new Error('buildEmptyWoTemplate · projectId required');
    if (!label) throw new Error('buildEmptyWoTemplate · label required');
    if (!TRIGGER_KINDS.includes(triggerKind)) {
        throw new Error('buildEmptyWoTemplate · triggerKind invalid · ' + triggerKind);
    }
    if (triggerKind === 'cron' && triggerConfig.cron) {
        const parsed = parseCron(triggerConfig.cron);
        if (!parsed) throw new Error('buildEmptyWoTemplate · cron expression invalid · ' + triggerConfig.cron);
    }
    const now = (typeof ts === 'number') ? ts : Date.now();
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    const tplId = id || ('wotpl-' + slug + '-' + now.toString(36));
    return {
        id: tplId,
        type: WO_TEMPLATE_TYPE,
        projectId,
        processId,
        socId,
        label: label.trim(),
        triggerKind,
        triggerConfig: { ...triggerConfig },     // { cron, event, condition, timezone, ... }
        woFactory: {                             // template per a la WO generada
            titleTpl:        woFactory.titleTpl || (label + ' · {today}'),
            roleId:          woFactory.roleId || null,
            sopId:           woFactory.sopId || null,
            deliverable:     woFactory.deliverable || null,
            estimatedHours:  typeof woFactory.estimatedHours === 'number' ? woFactory.estimatedHours : null,
            priority:        woFactory.priority || 'medium',
            assigneeKind:    woFactory.assigneeKind || 'human',
        },
        enabled: true,
        lastFired: null,            // timestamp de l'última execució
        firedCount: 0,
        version: WO_TEMPLATE_VERSION,
        keywords: ['type:wo_template', 'project:' + projectId, 'trigger:' + triggerKind],
        createdAt: now,
        updatedAt: now,
    };
}

// ── Validators ─────────────────────────────────────────────────────────────

export function validateWoTemplate(tpl) {
    const errors = [];
    if (!tpl || typeof tpl !== 'object') {
        return { ok: false, errors: ['template: must be object'] };
    }
    if (tpl.type !== WO_TEMPLATE_TYPE) errors.push('type: must be ' + WO_TEMPLATE_TYPE);
    if (!tpl.id) errors.push('id: required');
    if (!tpl.projectId) errors.push('projectId: required');
    if (!tpl.label) errors.push('label: required');
    if (!TRIGGER_KINDS.includes(tpl.triggerKind)) errors.push('triggerKind: invalid · ' + tpl.triggerKind);
    if (tpl.triggerKind === 'cron') {
        if (!tpl.triggerConfig?.cron) errors.push('triggerConfig.cron: required for cron trigger');
        else if (!parseCron(tpl.triggerConfig.cron)) errors.push('triggerConfig.cron: invalid expression');
    }
    if (tpl.triggerKind === 'event' && !tpl.triggerConfig?.event) {
        errors.push('triggerConfig.event: required for event trigger');
    }
    if (tpl.triggerKind === 'condition' && !tpl.triggerConfig?.condition) {
        errors.push('triggerConfig.condition: required for condition trigger');
    }
    return { ok: errors.length === 0, errors };
}

// ── WO factory · pure · crea WO instance des de template ─────────────────

function _formatTitle(titleTpl, date) {
    const today = date.toISOString().slice(0, 10);
    const time = date.toISOString().slice(11, 16);
    return titleTpl
        .replace('{today}', today)
        .replace('{time}', time)
        .replace('{month}', String(date.getMonth() + 1).padStart(2, '0'))
        .replace('{year}', String(date.getFullYear()));
}

// generateWoFromTemplate · pure · retorna una WO instance compatible amb
// agentBridgeSchema (validateWorkOrder). NO muta template (el caller
// hauria d'actualitzar lastFired/firedCount).
export function generateWoFromTemplate(tpl, { ts = null, evidenceTag = null } = {}) {
    if (!tpl) throw new Error('generateWoFromTemplate · template required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    const date = new Date(now);
    const f = tpl.woFactory || {};
    const title = _formatTitle(f.titleTpl || tpl.label, date);
    return {
        id:                 'wo-auto-' + tpl.id.replace(/^wotpl-/, '') + '-' + now.toString(36),
        type:               'work_order',
        project_id:         tpl.projectId,
        title,
        description:        'Generada automàticament des de template ' + tpl.id,
        priority:           f.priority || 'medium',
        complexity:         'S',
        status:             'pending',
        assignee_kind:      f.assigneeKind || 'human',
        required_capabilities: [],
        deliverable_test:   f.deliverable ? { kind: 'manual-check', expect: f.deliverable } : null,
        estimated_cost_eur: null,
        soc_ref:            tpl.socId,
        process_ref:        tpl.processId,
        org_ref:            null,
        claimed_by:         null,
        claimed_at:         null,
        completed_at:       null,
        deliverable_uri:    null,
        cost_actual_eur:    null,
        signature:          null,
        tags:               ['auto-generated', 'tpl:' + tpl.id].concat(evidenceTag ? [evidenceTag] : []),
        notes:              tpl.woFactory?.roleId ? 'Rol assignat · ' + tpl.woFactory.roleId : '',
        sourceTemplateId:   tpl.id,
        generatedAt:        now,
    };
}

// ── Trigger evaluator · pure · decideix si cal generar WO ahora ──────────

// shouldFire · pure · per a un template + estat actual · decideix si dispara
//
// args ·
//   tpl   · WO template
//   now   · timestamp (default Date.now())
//   evt   · { kind, name, payload } · event entrant (per a triggerKind=event)
//   ctx   · { conditionEvaluator: fn(condition) => bool } · per a condition
//
// Retorna · { fire:bool, reason:string }
export function shouldFire(tpl, { now = null, evt = null, ctx = {} } = {}) {
    if (!tpl) return { fire: false, reason: 'template null' };
    if (!tpl.enabled) return { fire: false, reason: 'disabled' };
    const ts = typeof now === 'number' ? now : Date.now();

    switch (tpl.triggerKind) {
        case 'cron': {
            const expr = tpl.triggerConfig?.cron;
            if (!expr) return { fire: false, reason: 'no cron expr' };
            const date = new Date(ts);
            if (!cronMatchesDate(expr, date)) return { fire: false, reason: 'cron does not match' };
            // Idempotència · si ja s'ha fet aquesta mateixa minute, no re-dispari
            if (tpl.lastFired && _sameMinute(new Date(tpl.lastFired), date)) {
                return { fire: false, reason: 'already fired this minute' };
            }
            return { fire: true, reason: 'cron match' };
        }
        case 'event': {
            const expectedEvent = tpl.triggerConfig?.event;
            if (!evt) return { fire: false, reason: 'no event provided' };
            if (evt.name !== expectedEvent) return { fire: false, reason: 'event mismatch' };
            return { fire: true, reason: 'event match · ' + expectedEvent };
        }
        case 'condition': {
            const cond = tpl.triggerConfig?.condition;
            if (typeof ctx.conditionEvaluator !== 'function') {
                return { fire: false, reason: 'no conditionEvaluator provided' };
            }
            const ok = ctx.conditionEvaluator(cond);
            return ok ? { fire: true, reason: 'condition true' } : { fire: false, reason: 'condition false' };
        }
        case 'manual':
            return evt && evt.kind === 'manual-trigger'
                ? { fire: true, reason: 'manual trigger' }
                : { fire: false, reason: 'awaiting manual trigger' };
        default:
            return { fire: false, reason: 'unknown triggerKind' };
    }
}

function _sameMinute(d1, d2) {
    return d1.getFullYear() === d2.getFullYear()
        && d1.getMonth() === d2.getMonth()
        && d1.getDate() === d2.getDate()
        && d1.getHours() === d2.getHours()
        && d1.getMinutes() === d2.getMinutes();
}

// markFired · pure · retorna template amb lastFired actualitzat
export function markFired(tpl, { ts = null } = {}) {
    if (!tpl) throw new Error('markFired · tpl required');
    const now = typeof ts === 'number' ? ts : Date.now();
    return {
        ...tpl,
        lastFired: now,
        firedCount: (tpl.firedCount || 0) + 1,
        updatedAt: now,
    };
}

// enable/disable
export function enableTemplate(tpl, { ts = null } = {}) {
    return { ...tpl, enabled: true, updatedAt: ts || Date.now() };
}
export function disableTemplate(tpl, { ts = null } = {}) {
    return { ...tpl, enabled: false, updatedAt: ts || Date.now() };
}

// ── Batch evaluation · scheduler entrypoint ───────────────────────────────

// evaluateTemplates · pure · per a un conjunt de templates · retorna les
// WOs a generar i els templates actualitzats. Idempotent (no duplica si
// ja firat aquest minut).
export function evaluateTemplates(templates = [], { now = null, evt = null, ctx = {} } = {}) {
    const ts = typeof now === 'number' ? now : Date.now();
    const generated = [];
    const updatedTemplates = [];
    for (const tpl of templates) {
        const decision = shouldFire(tpl, { now: ts, evt, ctx });
        if (decision.fire) {
            const wo = generateWoFromTemplate(tpl, { ts });
            generated.push(wo);
            updatedTemplates.push(markFired(tpl, { ts }));
        } else {
            updatedTemplates.push(tpl);
        }
    }
    return { generated, templates: updatedTemplates };
}
