// =============================================================================
// TEAMTOWERS SOS V11 — KNOWLEDGE LOG SERVICE
// Ruta · /js/core/knowledgeLogService.js
//
// Pure parser + validator del `knowledge/_LOG.md`. Garanteix que cada
// mutació al knowledge/ té entry traçable. IA i humans poden contribuir
// via aquest servei (append-only · cap reescriptura).
//
// Format d'entry (vegeu knowledge/_LOG.md):
//   ## YYYY-MM-DD · IA-{Name} · {status}
//   - what: "..."
//   - why: "..."
//   - files: ["..."]
//   - status: proposed|approved|reverted|rejected
//   - pr: branch-name
//   - alvaro_action_required: merge|revise|none
//   - merged_at: YYYY-MM-DD
// =============================================================================

export const LOG_VERSION = 'v1';

export const VALID_STATUSES = Object.freeze(['proposed', 'approved', 'reverted', 'rejected']);
export const VALID_ALVARO_ACTIONS = Object.freeze(['merge', 'revise', 'none']);

// ─── parseLog · pure · md → [{ entries }] ────────────────────────────────
// Extreu cada bloc "## YYYY-MM-DD · IA-X · status" + camps associats.
export function parseLog(markdownText = '') {
    if (typeof markdownText !== 'string') return [];
    const lines = markdownText.split('\n');
    const entries = [];
    let current = null;

    for (const line of lines) {
        // Header d'entry · ## YYYY-MM-DD · IA-Name · status
        const head = line.match(/^##\s+(\d{4}-\d{2}-\d{2})\s+·\s+(IA-\S+|HUMAN-\S+|@\S+)\s+·\s+(\w+)/);
        if (head) {
            if (current) entries.push(current);
            current = {
                date:   head[1],
                who:    head[2],
                status: head[3].toLowerCase(),
                what:   null,
                why:    null,
                files:  [],
                pr:     null,
                alvaro_action_required: null,
                merged_at: null,
                _raw: [line],
            };
            continue;
        }
        if (!current) continue;
        current._raw.push(line);
        // Camps · "- key: value"
        const kv = line.match(/^\s*-\s+(\w+):\s*(.*)$/);
        if (kv) {
            const key = kv[1].toLowerCase();
            const val = kv[2].trim().replace(/^"|"$/g, '');
            if (key === 'what')   current.what = val;
            else if (key === 'why')  current.why  = val;
            else if (key === 'pr')   current.pr   = val;
            else if (key === 'status') current.status = val.toLowerCase();
            else if (key === 'alvaro_action_required') current.alvaro_action_required = val;
            else if (key === 'merged_at') current.merged_at = val;
            continue;
        }
        // files multi-line · "    - path"
        const fileLine = line.match(/^\s{4,}-\s+(.+)$/);
        if (fileLine && current.files) current.files.push(fileLine[1].trim());
    }
    if (current) entries.push(current);
    return entries.map(e => { delete e._raw; return e; });
}

// ─── validateEntry · pure · retorna { ok, errors[] } ─────────────────────
export function validateEntry(entry) {
    const errors = [];
    if (!entry) return { ok: false, errors: ['entry-null'] };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date || '')) errors.push('date · must be YYYY-MM-DD');
    if (!entry.who || entry.who.length < 3) errors.push('who · required');
    if (!entry.what || entry.what.length < 5) errors.push('what · min 5 chars');
    if (!entry.why || entry.why.length < 5)   errors.push('why · min 5 chars');
    if (!VALID_STATUSES.includes(entry.status)) errors.push('status · must be one of ' + VALID_STATUSES.join('/'));
    if (!Array.isArray(entry.files) || entry.files.length === 0) errors.push('files · must be non-empty array');
    if (entry.status === 'approved' && !entry.merged_at) errors.push('approved · requires merged_at');
    if (entry.alvaro_action_required && !VALID_ALVARO_ACTIONS.includes(entry.alvaro_action_required)) {
        errors.push('alvaro_action_required · invalid · ' + entry.alvaro_action_required);
    }
    return { ok: errors.length === 0, errors };
}

// ─── buildEntry · pure · construeix entry estructurat ────────────────────
export function buildEntry({
    date = null, who = 'IA-Claude',
    what, why, files = [],
    status = 'proposed', pr = null,
    alvaro_action_required = 'merge', merged_at = null,
} = {}) {
    const d = date || new Date().toISOString().slice(0, 10);
    return {
        date: d, who,
        what: what || null, why: why || null,
        files: Array.isArray(files) ? files.slice() : [],
        status, pr,
        alvaro_action_required: status === 'approved' ? null : alvaro_action_required,
        merged_at: status === 'approved' ? (merged_at || d) : null,
    };
}

// ─── formatEntry · pure · structured → markdown block ────────────────────
export function formatEntry(entry) {
    const lines = [];
    lines.push('## ' + entry.date + ' · ' + entry.who + ' · ' + entry.status);
    if (entry.what)   lines.push('- what: "' + entry.what + '"');
    if (entry.why)    lines.push('- why:  "' + entry.why + '"');
    if (entry.files && entry.files.length > 0) {
        lines.push('- files:');
        for (const f of entry.files) lines.push('    - ' + f);
    }
    if (entry.pr)            lines.push('- pr: ' + entry.pr);
    if (entry.alvaro_action_required) lines.push('- alvaro_action_required: ' + entry.alvaro_action_required);
    if (entry.merged_at)     lines.push('- merged_at: ' + entry.merged_at);
    return lines.join('\n');
}

// ─── getStats · pure · estadístiques agregades ───────────────────────────
export function getStats(entries = []) {
    const stats = {
        total: entries.length,
        byStatus: { proposed: 0, approved: 0, reverted: 0, rejected: 0 },
        byWho: {},
        latestDate: null,
        pendingActions: 0,
    };
    for (const e of entries) {
        if (stats.byStatus[e.status] !== undefined) stats.byStatus[e.status]++;
        if (!stats.byWho[e.who]) stats.byWho[e.who] = 0;
        stats.byWho[e.who]++;
        if (!stats.latestDate || e.date > stats.latestDate) stats.latestDate = e.date;
        if (e.status === 'proposed') stats.pendingActions++;
    }
    return stats;
}
