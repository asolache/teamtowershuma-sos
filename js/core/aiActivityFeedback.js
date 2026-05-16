// =============================================================================
// TEAMTOWERS SOS V11 — AI ACTIVITY FEEDBACK (AI-FEEDBACK sprint A)
// Ruta · /js/core/aiActivityFeedback.js
//
// Helpers pure per a convertir log entries i callback events de
// improvementLoopService + swarmParallelFlow a missatges human-readable
// amb { icon, title, detail, nodeRef?, level } per renderitzar a la UI
// mentre l'IA pensa.
//
// La intenció · l'usuari veu en temps real ·
//   - quin SOP / deliverable s'està treballant ara
//   - quina acció (pensant · analitzant · aplicant · etc)
//   - quin node concret afectat
// =============================================================================

// Levels per a colors a la UI · info · ok · warn · err · thinking
export const ACTIVITY_LEVELS = Object.freeze(['info', 'ok', 'warn', 'err', 'thinking']);

const LEVEL_COLORS = Object.freeze({
    info:     '#6366f1',    // indigo
    ok:       '#22c55e',    // green
    warn:     '#facc15',    // amber
    err:      '#ef4444',    // red
    thinking: '#a855f7',    // purple · agent pensant
});

// levelColor · pure · color hex per a level
export function levelColor(level) {
    return LEVEL_COLORS[level] || LEVEL_COLORS.info;
}

// formatActivityEvent · pure · retorna { icon, title, detail, nodeRef?,
// nodeLabel?, level, color, ts? } per qualsevol kind de event.
//
// Coneix events de improvementLoopService + swarmParallelFlow + un kind
// genèric 'message' per UI ad-hoc.
//
// Retorna sempre · { icon, title, detail, level, color }.
// Si kind no reconegut · fallback genèric.
export function formatActivityEvent(event = {}) {
    if (!event || typeof event !== 'object') {
        return _wrap({ icon: '·', title: 'Event invàlid', detail: '', level: 'warn' });
    }
    const k = event.kind || event.type || '';
    switch (k) {

        // ─── improvementLoopService events ────────────────────────────────
        case 'cycle-start':
            return _wrap({
                icon:      '🔁',
                title:     'Iniciant cicle · iter ' + (event.iteration ?? '?'),
                detail:    'SOP origen · ' + (event.sopTitle || event.sopId || '?'),
                nodeRef:   event.sopId,
                nodeLabel: event.sopTitle || event.sopId,
                level:     'info',
            });
        case 'wo-built':
            return _wrap({
                icon:      '🛠',
                title:     'Work order construïda',
                detail:    'WO id · ' + (event.woId || '?') + (event.contextCount ? ' · context dels darrers ' + event.contextCount + ' deliverables' : ''),
                nodeRef:   event.woId,
                level:     'info',
            });
        case 'runner-start':
            return _wrap({
                icon:      '🤖',
                title:     'Pensant…',
                detail:    'Agent generant deliverable per ' + (event.sopTitle || event.sopId || 'WO') + (event.iteration ? ' · iter ' + event.iteration : '') + (event.attempt ? ' · intent ' + event.attempt : ''),
                nodeRef:   event.sopId || event.woId,
                nodeLabel: event.sopTitle,
                level:     'thinking',
            });
        case 'wo-executed':
            return _wrap({
                icon:      '✍️',
                title:     'Deliverable rebut',
                detail:    'Output ' + (event.outputLen ? event.outputLen + ' chars' : 'capturat') + (event.attempt ? ' · intent ' + event.attempt : '') + (event.costEur ? ' · €' + event.costEur.toFixed(4) : ''),
                nodeRef:   event.woId,
                level:     'ok',
            });
        case 'wo-failed':
            return _wrap({
                icon:      '✗',
                title:     'Deliverable rebutjat',
                detail:    'Error · ' + (event.error || 'unknown'),
                nodeRef:   event.woId,
                level:     'err',
            });
        case 'analyzed':
            return _wrap({
                icon:      '🔍',
                title:     'Anàlisi completa',
                detail:    'Score ' + (event.score ?? 0) + '/100 · ' + (event.enrichments ?? 0) + ' enrichments · ' + (event.mentionsCount ?? event.mentions ?? 0) + ' mencions',
                level:     'ok',
            });
        case 'enrichments-applied':
            return _wrap({
                icon:      '🌱',
                title:     'Enrichments aplicats',
                detail:    (event.mutations ?? 0) + ' mutacions al project (tags · evidence · suggestions)',
                level:     'ok',
            });

        // ─── swarmParallelFlow events ──────────────────────────────────────
        case 'level-start': {
            const n = (event.deliverables || event.deliverableIds || []).length;
            return _wrap({
                icon:      '⚡',
                title:     'Level ' + (event.level ?? event.levelIndex ?? '?') + ' · ' + n + ' deliverable' + (n === 1 ? '' : 's') + ' paral·lel',
                detail:    (event.deliverableIds || event.deliverables || []).join(' + ') + (event.roleLabels ? ' · rols ' + event.roleLabels.join(' + ') : ''),
                level:     'info',
            });
        }
        case 'deliverable-start':
            return _wrap({
                icon:      '🤖',
                title:     'Agent treballant · ' + (event.deliverableId || event.id || '?'),
                detail:    (event.roleLabel ? 'Rol · ' + event.roleLabel : '') + (event.upstreamCount ? ' · context ' + event.upstreamCount + ' upstream' : ''),
                nodeRef:   event.deliverableId || event.id,
                nodeLabel: event.roleLabel,
                level:     'thinking',
            });
        case 'deliverable-done':
            return _wrap({
                icon:      '✓',
                title:     'Deliverable entregat · ' + (event.id || '?'),
                detail:    'Level ' + (event.level ?? '?') + (event.costEur ? ' · €' + event.costEur.toFixed(4) : '') + (event.signed ? ' · 🔐 signat' : ''),
                nodeRef:   event.id,
                level:     'ok',
            });
        case 'deliverable-fail':
            return _wrap({
                icon:      '✗',
                title:     'Deliverable fallit · ' + (event.id || '?'),
                detail:    'Level ' + (event.level ?? '?') + ' · ' + (event.error || 'error'),
                nodeRef:   event.id,
                level:     'err',
            });
        case 'budget-exceeded':
            return _wrap({
                icon:      '💸',
                title:     'Budget esgotat',
                detail:    'Cost acumulat €' + (event.totalCostEur || 0).toFixed(4) + ' · stop al pròxim level',
                level:     'warn',
            });

        // ─── generic UI events ─────────────────────────────────────────────
        case 'loop-start':
            return _wrap({
                icon:      '▶',
                title:     'Iniciant loop',
                detail:    (event.iterations || event.maxIterations || '?') + ' iteracions previstes',
                level:     'info',
            });
        case 'loop-end':
            return _wrap({
                icon:      event.ok ? '🎉' : '⚠',
                title:     event.ok ? 'Loop completat' : 'Loop amb errors',
                detail:    (event.iterations || 0) + ' iteracions · ' + (event.totalEnrichments || 0) + ' enrichments · ' + (event.mutations || event.mutationsCount || 0) + ' mutacions · ' + (event.errors || 0) + ' errors',
                level:     event.ok ? 'ok' : 'warn',
            });
        case 'message':
            return _wrap({
                icon:      event.icon || '·',
                title:     event.title || event.text || '·',
                detail:    event.detail || '',
                level:     event.level || 'info',
            });
        case 'error':
            return _wrap({
                icon:      '💥',
                title:     'Error',
                detail:    event.error || event.message || 'desconegut',
                level:     'err',
            });

        // ─── fallback · kind no reconegut ─────────────────────────────────
        default:
            return _wrap({
                icon:      '·',
                title:     k || 'event',
                detail:    _stringifySafe(event),
                level:     'info',
            });
    }
}

// formatActivityEntries · pure · pren array de events i retorna formatted[]
export function formatActivityEntries(events = []) {
    return (Array.isArray(events) ? events : []).map(formatActivityEvent);
}

// summarizeActivity · pure · retorna { thinking, lastOk, lastErr, totalEvents }
// per a un mini-dashboard ràpid.
export function summarizeActivity(events = []) {
    if (!Array.isArray(events) || events.length === 0) {
        return { thinking: null, lastOk: null, lastErr: null, totalEvents: 0 };
    }
    let thinking = null, lastOk = null, lastErr = null;
    for (const e of events) {
        const f = formatActivityEvent(e);
        if (f.level === 'thinking') thinking = f;
        if (f.level === 'ok') lastOk = f;
        if (f.level === 'err') lastErr = f;
    }
    return { thinking, lastOk, lastErr, totalEvents: events.length };
}

// renderActivityEntryHtml · helper · HTML segur per una entry.
// Retorna string HTML amb escape automàtic.
export function renderActivityEntryHtml(entry) {
    if (!entry) return '';
    const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const color = entry.color || LEVEL_COLORS[entry.level] || LEVEL_COLORS.info;
    const pulse = entry.level === 'thinking' ? 'animation:ai-pulse 1.2s infinite ease-in-out;' : '';
    const nodeBadge = entry.nodeRef
        ? `<code style="background:#0006;padding:1px 6px;border-radius:3px;font-size:10px;margin-left:6px;">${esc(String(entry.nodeLabel || entry.nodeRef).slice(0, 30))}</code>`
        : '';
    return `<div class="ai-activity-entry" style="border-left:3px solid ${color};padding:6px 10px;background:#0006;border-radius:3px;margin-bottom:4px;${pulse}">
        <div style="font-weight:700;font-size:0.85rem;color:${color};">${esc(entry.icon)} ${esc(entry.title)}${nodeBadge}</div>
        ${entry.detail ? `<div style="font-size:0.75rem;color:var(--text-secondary,#aaa);margin-top:2px;font-family:var(--font-mono);">${esc(entry.detail)}</div>` : ''}
    </div>`;
}

// CSS keyframes per a thinking pulse · retorna string per injectar al <style>
export const THINKING_PULSE_CSS = `
@keyframes ai-pulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(168,85,247,0.4); }
    50% { opacity: 0.85; box-shadow: 0 0 6px 2px rgba(168,85,247,0.3); }
}`;

// ─── INTERNAL ──────────────────────────────────────────────────────────────

function _wrap({ icon, title, detail, nodeRef, nodeLabel, level }) {
    return {
        icon:      icon || '·',
        title:     title || '',
        detail:    detail || '',
        nodeRef:   nodeRef || null,
        nodeLabel: nodeLabel || null,
        level:     ACTIVITY_LEVELS.includes(level) ? level : 'info',
        color:     LEVEL_COLORS[level] || LEVEL_COLORS.info,
    };
}

function _stringifySafe(obj) {
    try {
        const out = [];
        for (const [k, v] of Object.entries(obj)) {
            if (k === 'kind' || k === 'type') continue;
            if (k === 'ts') continue;
            if (typeof v === 'object') continue;
            out.push(k + '=' + String(v).slice(0, 30));
        }
        return out.join(' · ');
    } catch (_) { return ''; }
}
