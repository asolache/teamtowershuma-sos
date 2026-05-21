// =============================================================================
// TEAMTOWERS SOS V11 — v136 · xAPI SERVICE · Tin Can compatible
// Ruta · /js/core/xapiService.js
//
// Item #6 del audit post-alfa (v134) · ALFA+ ·
// Implementació JS dels endpoints xAPI documentats a docs/lms-api-spec-v0.1.md ·
//
// API (TinCan-compatible) ·
//  · recordStatement({ actor, verb, object, result?, context? }) → KB node
//  · listStatements({ agent?, verbId?, objectId?, since?, limit? }) → []
//  · listActivities() → unique object ids
//
// Helpers per a VNA quality tracking (cas d'ús alfa+) ·
//  · recordMapGenerated({ actor, mapId, score, tokens?, ms?, slim? })
//  · recordMapAccepted({ actor, mapId, roleCount, txCount })
//  · recordClarifyAnswered({ actor, mapId, questionsCount, answeredCount })
//  · recordGapFilled({ actor, mapId, gapsCount, addedRoles })
//
// Backend · KB node type='xapi_statement' (mateix backend que altres tipus
// SOS) · agent friendly per a Profile360 audit trail · dashboards quality.
// =============================================================================

export const XAPI_VERSION = 'v136';

// ── xAPI verbs canonical (subset adl.gov · mediatorhouse extension) ────
export const XAPI_VERBS = Object.freeze({
    completed:  { id: 'http://adlnet.gov/expapi/verbs/completed',  display: { en: 'completed',  ca: 'completat'  } },
    attempted:  { id: 'http://adlnet.gov/expapi/verbs/attempted',  display: { en: 'attempted',  ca: 'intentat'   } },
    failed:     { id: 'http://adlnet.gov/expapi/verbs/failed',     display: { en: 'failed',     ca: 'fallat'     } },
    passed:     { id: 'http://adlnet.gov/expapi/verbs/passed',     display: { en: 'passed',     ca: 'aprovat'    } },
    answered:   { id: 'http://adlnet.gov/expapi/verbs/answered',   display: { en: 'answered',   ca: 'respost'    } },
    progressed: { id: 'http://adlnet.gov/expapi/verbs/progressed', display: { en: 'progressed', ca: 'progressat' } },
    // SOS extensions · namespace propi
    generated:  { id: 'https://sos.teamtowershuma.com/xapi/verbs/generated', display: { en: 'generated', ca: 'generat' } },
    accepted:   { id: 'https://sos.teamtowershuma.com/xapi/verbs/accepted',  display: { en: 'accepted',  ca: 'acceptat' } },
    rejected:   { id: 'https://sos.teamtowershuma.com/xapi/verbs/rejected',  display: { en: 'rejected',  ca: 'rebutjat' } },
    clarified:  { id: 'https://sos.teamtowershuma.com/xapi/verbs/clarified', display: { en: 'clarified', ca: 'aclarit'  } },
    gapfilled:  { id: 'https://sos.teamtowershuma.com/xapi/verbs/gapfilled', display: { en: 'gap-filled',ca: 'completat-gap' } },
});

// ── xAPI activity types ────────────────────────────────────────────────
export const XAPI_ACTIVITY_TYPES = Object.freeze({
    course:        'http://adlnet.gov/expapi/activities/course',
    lesson:        'http://adlnet.gov/expapi/activities/lesson',
    assessment:    'http://adlnet.gov/expapi/activities/assessment',
    // SOS extensions
    vnaMap:        'https://sos.teamtowershuma.com/xapi/activities/vna-map',
    valueMap:      'https://sos.teamtowershuma.com/xapi/activities/value-map',
    projectCanvas: 'https://sos.teamtowershuma.com/xapi/activities/canvas',
    projectPitch:  'https://sos.teamtowershuma.com/xapi/activities/pitch',
});

// ── Validation defensiu · TinCan minimum schema ───────────────────────
function _validate(stmt) {
    if (!stmt || typeof stmt !== 'object') return 'statement-required';
    if (!stmt.actor || (!stmt.actor.mbox && !stmt.actor.account && !stmt.actor.openid && !stmt.actor.name && !stmt.actor.did)) {
        return 'actor-required · mbox|account|openid|name|did';
    }
    if (!stmt.verb || typeof stmt.verb.id !== 'string') return 'verb-required · {id, display?}';
    if (!stmt.object || typeof stmt.object.id !== 'string') return 'object-required · {id, definition?}';
    return null;
}

function _genId() {
    // UUID v4-like (TinCan acceptable) · safe sense uuid lib
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    const r = () => Math.floor(Math.random() * 16).toString(16);
    return ('xx-xx-4x-yx-xxxxxx').replace(/x/g, r);
}

// ── recordStatement · persistència opcional al KB ─────────────────────
//
// Args ·
//   actor    · { mbox?, name?, did?, account? }   (almenys una key)
//   verb     · { id, display? }                    (id obligatori · normalment XAPI_VERBS.X)
//   object   · { id, definition? }                 (id obligatori · normalment URL canonical)
//   result?  · { completion?, success?, score?: { scaled }, response?, duration?, extensions? }
//   context? · { instructor?, team?, contextActivities?, extensions? }
//   kb?      · injectable · default · prova de importar './kb.js' · si falla retorna node sense persistir
//
// Retorna ·
//   { ok: true, node: { id, type:'xapi_statement', content: <stmt>, ... } }
//   { ok: false, error: 'invalid-...|kb-failed' }
export async function recordStatement({
    actor, verb, object, result = null, context = null, kb = null, timestamp = null,
} = {}) {
    const stmt = {
        id:        _genId(),
        actor,
        verb,
        object,
        result:    result    || undefined,
        context:   context   || undefined,
        timestamp: timestamp || new Date().toISOString(),
        version:   '1.0.3',         // xAPI spec version
    };
    const err = _validate(stmt);
    if (err) return { ok: false, error: 'invalid · ' + err };

    const node = {
        id:   'xapi-' + stmt.id,
        type: 'xapi_statement',
        content: stmt,
    };

    // Persistència opcional · si kb passat o auto-resoluble
    if (!kb) {
        try { kb = (await import('./kb.js')).KB; } catch (_) { kb = null; }
    }
    if (kb && typeof kb.upsert === 'function') {
        try { await kb.upsert(node); } catch (_) { /* swallow · retorna node sense persistir */ }
    }
    return { ok: true, node, statement: stmt };
}

// ── listStatements · filtre simple · TinCan style ─────────────────────
//
// Args ·
//   agent?     · match contra stmt.actor (mbox o did o name)
//   verbId?    · match exacte stmt.verb.id
//   objectId?  · match exacte stmt.object.id
//   since?     · ISO date string · només statements >=
//   limit?     · default 100
//   kb?        · injectable · sinó intenta import('./kb.js').KB
//
// Retorna · { ok, statements: [...] } (no llança · ok=false si kb fail)
export async function listStatements({
    agent = null, verbId = null, objectId = null, since = null, limit = 100, kb = null,
} = {}) {
    if (!kb) {
        try { kb = (await import('./kb.js')).KB; } catch (_) { kb = null; }
    }
    if (!kb || typeof kb.query !== 'function') {
        return { ok: false, error: 'kb-unavailable', statements: [] };
    }
    let nodes;
    try { nodes = await kb.query({ type: 'xapi_statement' }); }
    catch (e) { return { ok: false, error: 'kb-query-failed · ' + (e?.message || ''), statements: [] }; }
    let stmts = (nodes || []).map(n => n?.content).filter(Boolean);

    if (agent) {
        const a = String(agent).toLowerCase();
        stmts = stmts.filter(s => {
            const ac = s.actor || {};
            return [ac.mbox, ac.did, ac.name, ac.openid].filter(Boolean)
                .some(v => String(v).toLowerCase().includes(a));
        });
    }
    if (verbId)   stmts = stmts.filter(s => s.verb?.id === verbId);
    if (objectId) stmts = stmts.filter(s => s.object?.id === objectId);
    if (since) {
        const sinceTs = new Date(since).getTime();
        if (!isNaN(sinceTs)) stmts = stmts.filter(s => new Date(s.timestamp).getTime() >= sinceTs);
    }
    // Sort desc per timestamp · més recents primer
    stmts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return { ok: true, statements: stmts.slice(0, Math.max(1, limit)) };
}

// ── listActivities · unique object.id de tots els statements ──────────
export async function listActivities({ kb = null } = {}) {
    const r = await listStatements({ limit: 10000, kb });
    if (!r.ok) return { ok: false, error: r.error, activities: [] };
    const seen = new Map();
    for (const s of r.statements) {
        const oid = s.object?.id;
        if (!oid || seen.has(oid)) continue;
        seen.set(oid, s.object);
    }
    return { ok: true, activities: Array.from(seen.values()) };
}

// ═════════════════════════════════════════════════════════════════════
// Helpers SOS · VNA quality tracking (cas d'ús alfa+)
// ═════════════════════════════════════════════════════════════════════

function _actorFrom(actor) {
    if (typeof actor === 'string') {
        // Format · "did:sos:alvaro" o "alice@example.com"
        if (actor.startsWith('did:'))   return { did: actor, name: actor.split(':').pop() };
        if (actor.includes('@'))        return { mbox: 'mailto:' + actor, name: actor.split('@')[0] };
        return { name: actor };
    }
    return actor || { name: 'anonymous' };
}

function _vnaObject(mapId, kind = 'vna-map') {
    return {
        id: 'https://sos.teamtowershuma.com/' + kind + '/' + mapId,
        definition: {
            name: { ca: 'Mapa de valor · ' + mapId },
            type: kind === 'vna-map' ? XAPI_ACTIVITY_TYPES.vnaMap : XAPI_ACTIVITY_TYPES.valueMap,
        },
    };
}

// recordMapGenerated · score 0-100 normalitzat a scaled 0-1 (xAPI spec)
export async function recordMapGenerated({ actor, mapId, score = null, tokens = null, ms = null, slim = false, kb = null }) {
    if (!mapId) return { ok: false, error: 'mapId-required' };
    const result = { completion: true };
    if (typeof score === 'number') result.score = { scaled: Math.max(0, Math.min(1, score / 100)), raw: score, min: 0, max: 100 };
    if (typeof ms === 'number')    result.duration = 'PT' + Math.round(ms / 1000) + 'S';   // ISO 8601 duration
    if (tokens || slim != null) result.extensions = {
        'https://sos.teamtowershuma.com/xapi/ext/tokens': tokens || null,
        'https://sos.teamtowershuma.com/xapi/ext/slim':    slim,
    };
    return recordStatement({
        actor:  _actorFrom(actor),
        verb:   XAPI_VERBS.generated,
        object: _vnaObject(mapId),
        result,
        kb,
    });
}

export async function recordMapAccepted({ actor, mapId, roleCount, txCount, kb = null }) {
    return recordStatement({
        actor:  _actorFrom(actor),
        verb:   XAPI_VERBS.accepted,
        object: _vnaObject(mapId),
        result: { completion: true, success: true, extensions: {
            'https://sos.teamtowershuma.com/xapi/ext/role-count': roleCount,
            'https://sos.teamtowershuma.com/xapi/ext/tx-count':   txCount,
        }},
        kb,
    });
}

export async function recordClarifyAnswered({ actor, mapId, questionsCount, answeredCount, kb = null }) {
    return recordStatement({
        actor:  _actorFrom(actor),
        verb:   XAPI_VERBS.clarified,
        object: _vnaObject(mapId),
        result: { extensions: {
            'https://sos.teamtowershuma.com/xapi/ext/questions': questionsCount,
            'https://sos.teamtowershuma.com/xapi/ext/answered':  answeredCount,
        }},
        kb,
    });
}

export async function recordGapFilled({ actor, mapId, gapsCount, addedRoles, kb = null }) {
    return recordStatement({
        actor:  _actorFrom(actor),
        verb:   XAPI_VERBS.gapfilled,
        object: _vnaObject(mapId),
        result: { completion: true, extensions: {
            'https://sos.teamtowershuma.com/xapi/ext/gaps-detected': gapsCount,
            'https://sos.teamtowershuma.com/xapi/ext/roles-added':   addedRoles,
        }},
        kb,
    });
}

// ── summarizeStatements · pure · agrega per dashboard ────────────────
//
// Retorna · { total, byVerb: { id → n }, avgScore: 0-1 | null,
//             firstAt, lastAt, agents: Set, activities: Set }
export function summarizeStatements(statements = []) {
    const out = { total: statements.length, byVerb: {}, avgScore: null, firstAt: null, lastAt: null, agents: new Set(), activities: new Set() };
    if (!statements.length) return out;
    let scoreSum = 0, scoreN = 0;
    for (const s of statements) {
        const v = s.verb?.id;
        if (v) out.byVerb[v] = (out.byVerb[v] || 0) + 1;
        const aid = s.actor?.mbox || s.actor?.did || s.actor?.name;
        if (aid) out.agents.add(aid);
        if (s.object?.id) out.activities.add(s.object.id);
        const sc = s.result?.score?.scaled;
        if (typeof sc === 'number') { scoreSum += sc; scoreN++; }
        const ts = s.timestamp;
        if (ts) {
            if (!out.firstAt || ts < out.firstAt) out.firstAt = ts;
            if (!out.lastAt  || ts > out.lastAt)  out.lastAt  = ts;
        }
    }
    out.avgScore = scoreN ? +(scoreSum / scoreN).toFixed(3) : null;
    return out;
}
