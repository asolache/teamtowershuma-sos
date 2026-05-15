// =============================================================================
// TEAMTOWERS SOS V11 — PRESENCE SERVICE (SOCIAL-LAYER-001 part 2)
// Ruta · /js/core/presenceService.js
//
// Heartbeat-style online presence · cada usuari actualitza el camp
// `lastSeen` del seu node `user_identity` cada N segons mentre l'app
// està oberta. Per a saber si un altre usuari està online · llegim el seu
// `lastSeen` i comparem amb thresholds (2min · 30min).
//
// Local-first · descentralitzat · zero servidor. Quan dos usuaris federen
// via permaweb · el lastSeen es propaga via syncFromPermaweb · presence
// real entre nodes.
//
// Status ·
//   🟢 online   · lastSeen < 2 min
//   🟡 idle     · lastSeen 2-30 min
//   ⚪ offline  · lastSeen > 30 min · null
// =============================================================================

export const HEARTBEAT_INTERVAL_MS = 30 * 1000;          // 30s
export const ONLINE_THRESHOLD_MS   = 2 * 60 * 1000;      // 2 min
export const IDLE_THRESHOLD_MS     = 30 * 60 * 1000;     // 30 min

export const PRESENCE_STATUS = Object.freeze({
    online:  { icon: '🟢', label: 'Online',  color: '#22c55e' },
    idle:    { icon: '🟡', label: 'Idle',    color: '#facc15' },
    offline: { icon: '⚪', label: 'Offline', color: '#94a3b8' },
});

// computePresenceStatus · pure · donat lastSeen ts · retorna status
export function computePresenceStatus(lastSeenMs, { now = null } = {}) {
    const t = (typeof now === 'number') ? now : Date.now();
    if (!lastSeenMs || typeof lastSeenMs !== 'number') return 'offline';
    const ago = t - lastSeenMs;
    if (ago < 0) return 'offline';      // future timestamp · ignore
    if (ago < ONLINE_THRESHOLD_MS) return 'online';
    if (ago < IDLE_THRESHOLD_MS)   return 'idle';
    return 'offline';
}

// formatLastSeen · pure · text human-friendly
export function formatLastSeen(lastSeenMs, { now = null } = {}) {
    const t = (typeof now === 'number') ? now : Date.now();
    if (!lastSeenMs) return 'mai vist';
    const ago = t - lastSeenMs;
    if (ago < 0) return 'futur (rellotge)';
    const min = Math.floor(ago / 60000);
    if (min < 1) return 'just ara';
    if (min < 60) return 'fa ' + min + ' min';
    const hr = Math.floor(min / 60);
    if (hr < 24) return 'fa ' + hr + ' h';
    const days = Math.floor(hr / 24);
    if (days < 30) return 'fa ' + days + ' d';
    return new Date(lastSeenMs).toLocaleDateString();
}

// renderPresencePill · pure · HTML compacte per a UI
export function renderPresencePill(lastSeenMs, { now = null, showLabel = true } = {}) {
    const status = computePresenceStatus(lastSeenMs, { now });
    const meta = PRESENCE_STATUS[status];
    const lastText = lastSeenMs ? formatLastSeen(lastSeenMs, { now }) : '';
    return `<span class="sos-presence-pill" style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:${meta.color}20;color:${meta.color};font-size:0.72rem;font-weight:700;" title="${lastText}">
        <span aria-hidden="true">${meta.icon}</span>${showLabel ? '<span>' + meta.label + '</span>' : ''}${lastSeenMs ? '<span style="opacity:0.7;font-weight:500;">· ' + lastText + '</span>' : ''}
    </span>`;
}

// ── Heartbeat · auto-update lastSeen ──────────────────────────────────────

let _heartbeatTimer = null;
let _ownerHandle = null;

// startHeartbeat · async · marca _ownerHandle i comença l'update periòdic
export async function startHeartbeat({ ownerHandle = null } = {}) {
    if (typeof window === 'undefined') return;
    if (_heartbeatTimer) return;     // already running

    // Best-effort · detecta owner si no es passa
    if (!ownerHandle) {
        try {
            const { KB } = await import('./kb.js');
            const ids = await KB.query({ type: 'user_identity' }).catch(() => []);
            if (ids.length > 0) {
                _ownerHandle = ids[0].content?.handle || null;
            } else {
                const members = await KB.query({ type: 'matriu_member' }).catch(() => []);
                const primary = members.find(m => m && (m.content?.isPrimary || m.isPrimary));
                _ownerHandle = primary?.content?.handle || null;
            }
        } catch (_) {}
    } else {
        _ownerHandle = ownerHandle;
    }

    // Pulse immediate · després cada HEARTBEAT_INTERVAL_MS
    await _pulse();
    _heartbeatTimer = setInterval(_pulse, HEARTBEAT_INTERVAL_MS);

    // Pause heartbeat al hide tab · resume al show
    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') _pulse();
        });
    }
    // Pause al beforeunload · final pulse
    if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => _pulse());
    }
}

async function _pulse() {
    if (!_ownerHandle) return;
    try {
        const { KB } = await import('./kb.js');
        const ids = await KB.query({ type: 'user_identity' }).catch(() => []);
        const me = ids.find(i => i.content?.handle === _ownerHandle) || ids[0];
        if (!me) return;
        const now = Date.now();
        const updated = {
            ...me,
            content: {
                ...me.content,
                lastSeen: now,
            },
            updatedAt: now,
        };
        await KB.upsert(updated);
    } catch (_) {}
}

// stopHeartbeat · cleanup per a tests / SPA destroy
export function stopHeartbeat() {
    if (_heartbeatTimer) {
        clearInterval(_heartbeatTimer);
        _heartbeatTimer = null;
    }
}

// getPresenceFor · async · llegeix presence d'un altre usuari pel handle
export async function getPresenceFor(handle) {
    if (!handle) return { status: 'offline', lastSeen: null, label: 'no handle' };
    try {
        const { KB } = await import('./kb.js');
        const cleanHandle = handle.startsWith('@') ? handle : '@' + handle;
        // Busca user_identity primer · després matriu_member
        const ids = await KB.query({ type: 'user_identity' }).catch(() => []);
        let node = ids.find(i => i.content?.handle === cleanHandle);
        if (!node) {
            const members = await KB.query({ type: 'matriu_member' }).catch(() => []);
            node = members.find(m => m.content?.handle === cleanHandle);
        }
        const lastSeen = node?.content?.lastSeen || null;
        const status = computePresenceStatus(lastSeen);
        return { status, lastSeen, handle: cleanHandle };
    } catch (e) {
        return { status: 'offline', lastSeen: null, error: e?.message };
    }
}

// _resetForTests · sols per a tests
export function _resetForTests() {
    stopHeartbeat();
    _ownerHandle = null;
}
