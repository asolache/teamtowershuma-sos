// =============================================================================
// TEAMTOWERS SOS V11 — TIMELINE VIEW (SOCIAL-LAYER-001 sprint UI)
// Ruta · /js/views/TimelineView.js  →  /timeline
//
// Feed public chronologic de TOTA l'activitat al network · attestations ·
// pacts · WOs · ledger · invoices · proposals · permaweb publishes.
//
// Reusa activityFeedService (PR #94) + socialGraphService (aquest sprint).
// Mostra al final stats de la xarxa · top followed · totals.
// =============================================================================

import { KB } from '../core/kb.js';
import { buildFeed, summarizeFeed } from '../core/activityFeedService.js';
import { computeNetworkStats, computeTopFollowed, followCounts } from '../core/socialGraphService.js';
import { emptyStateHtml } from '../core/uxComponents.js';
import { renderSubmenuTabs, bindSubmenuTabs, getActiveTabFromUrl } from '../ui/SubmenuTabs.js';

const FILTER_TABS = Object.freeze([
    { id: 'all',     label: 'Tot',       icon: '📋' },
    { id: 'wos',     label: 'WOs',       icon: '⚡' },
    { id: 'pacts',   label: 'Pactes',    icon: '🤝' },
    { id: 'ledger',  label: 'Ledger',    icon: '💰' },
    { id: 'network', label: 'Network',   icon: '🌐' },
]);
const VALID_FILTERS = new Set(FILTER_TABS.map(f => f.id));

const FILTER_TO_KINDS = Object.freeze({
    all:     null,                                                              // no filter
    wos:     ['wo-claimed', 'wo-ledgered', 'wo-completed', 'wo-pending'],       // WO derivers
    pacts:   ['pact-signed', 'pact-created', 'pact-amended'],
    ledger:  ['ledger-credit', 'ledger-debit', 'invoice-paid', 'invoice-issued'],
    network: ['follow-created', 'attestation-issued'],
});

export default class TimelineView {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Timeline · SOS';
        const urlFilter = getActiveTabFromUrl('filter', 'all');
        this._filterMode = VALID_FILTERS.has(urlFilter) ? urlFilter : 'all';
        this._sortMode = getActiveTabFromUrl('sort', 'chrono') || 'chrono';
        this._meHandle = null;
        this._cleanupFilter = null;
    }

    async getHtml() {
        const [attestations, pacts, wos, ledger, invoices, proposals, members] = await Promise.all([
            KB.query({ type: 'attestation' }).catch(() => []),
            KB.query({ type: 'pact' }).catch(() => []),
            KB.query({ type: 'work_order' }).catch(() => []),
            KB.query({ type: 'ledger_entry' }).catch(() => []),
            KB.query({ type: 'invoice' }).catch(() => []),
            KB.query({ type: 'proposal' }).catch(() => []),
            KB.query({ type: 'matriu_member' }).catch(() => []),
        ]);
        this._meHandle = (members.find(m => m && (m.content?.isPrimary || m.isPrimary))?.content?.handle) || null;

        const fullFeed = buildFeed({
            sources: { attestations, pacts, wos, ledger, invoices, proposals },
            userHandle: this._meHandle,
            limit: 200,                       // pull more · filter applies post-build
            sortBy: this._sortMode,
        });
        // v153 · filter perspectives · WOs / Pacts / Ledger / Network
        const allowedKinds = FILTER_TO_KINDS[this._filterMode];
        const feed = allowedKinds == null
            ? fullFeed.slice(0, 30)
            : fullFeed.filter(e => allowedKinds.some(k => e.kind === k || (e.kind || '').startsWith(k))).slice(0, 30);
        const networkStats = computeNetworkStats(attestations);
        const topFollowed = computeTopFollowed(attestations, { limit: 5 });
        const myCounts = this._meHandle
            ? followCounts({ handle: this._meHandle, attestations })
            : null;

        return this._renderShell({ feed, fullFeedCount: fullFeed.length, networkStats, topFollowed, myCounts });
    }

    async afterRender() {
        // v153 · canonical SubmenuTabs · perspective filter
        const filterMount = document.getElementById('tlvFilter');
        if (filterMount) {
            try { this._cleanupFilter?.(); } catch (_) {}
            this._cleanupFilter = bindSubmenuTabs(filterMount, async (newFilter) => {
                if (!VALID_FILTERS.has(newFilter)) return;
                this._filterMode = newFilter;
                const app = document.getElementById('app');
                if (app) {
                    app.innerHTML = await this.getHtml();
                    await this.afterRender();
                }
            }, { urlParam: 'filter' });
        }
        // Sort buttons (legacy · funcional)
        document.querySelectorAll('[data-sort]').forEach(btn => {
            btn.addEventListener('click', async () => {
                this._sortMode = btn.dataset.sort;
                try {
                    const url = new URL(window.location.href);
                    url.searchParams.set('sort', this._sortMode);
                    window.history.replaceState({}, '', url.toString());
                } catch (_) {}
                const app = document.getElementById('app');
                if (app) {
                    app.innerHTML = await this.getHtml();
                    await this.afterRender();
                }
            });
        });
    }

    destroy() { try { this._cleanupFilter?.(); } catch (_) {} }

    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    _renderShell({ feed, fullFeedCount, networkStats, topFollowed, myCounts }) {
        return `
        <style>
            .tlv-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); padding-bottom:2rem; }
            .tlv-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-wrap:wrap; position:sticky; top:0; z-index:10; }
            .tlv-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .tlv-logo span { color:var(--accent-indigo); }

            .tlv-main { max-width:900px; margin:0 auto; padding:1rem; display:grid; grid-template-columns:1fr 280px; gap:1rem; }
            @media (max-width: 768px) { .tlv-main { grid-template-columns:1fr; } }

            .tlv-section { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem 1.1rem; margin-bottom:0.8rem; }
            .tlv-section h2 { margin:0 0 0.75rem 0; font-size:0.95rem; }

            .tlv-sort { display:flex; gap:6px; margin-bottom:0.7rem; }
            .tlv-sort-btn { padding:5px 12px; border-radius:999px; font-size:0.72rem; font-weight:600; background:var(--bg-dark); color:var(--text-secondary); border:1px solid var(--border-default); cursor:pointer; }
            .tlv-sort-btn.active { background:rgba(99,102,241,0.18); color:#a8b2ff; border-color:rgba(99,102,241,0.4); }

            .tlv-event { padding:0.65rem 0.85rem; border-radius:6px; display:flex; gap:10px; align-items:flex-start; margin-bottom:6px; transition:background 0.15s; }
            .tlv-event:hover { background:var(--glass-hover); }
            .tlv-event .ic { flex-shrink:0; font-size:1.3rem; line-height:1.1; }
            .tlv-event .body .ttl { font-weight:600; font-size:0.88rem; }
            .tlv-event .body .meta { color:var(--text-secondary); font-size:0.72rem; margin-top:2px; }
            .tlv-event .body .summary { color:var(--text-secondary); font-size:0.78rem; margin-top:3px; line-height:1.45; }

            .tlv-stat { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border-default); font-size:0.82rem; }
            .tlv-stat:last-child { border-bottom:none; }
            .tlv-stat .lbl { color:var(--text-secondary); }
            .tlv-stat .val { font-weight:700; color:var(--text-main); font-variant-numeric:tabular-nums; }

            .tlv-handle { color:var(--accent-indigo); text-decoration:none; }
            .tlv-handle:hover { text-decoration:underline; }
        </style>

        <div class="tlv-shell">
            <!-- v153 · canonical SubmenuTabs · perspective filter · topbar custom eliminat -->
            <div id="tlvFilter" style="background:var(--bg-panel);border-bottom:1px solid var(--border-default);">
                ${renderSubmenuTabs({ tabs: FILTER_TABS, activeId: this._filterMode, urlParam: 'filter' })}
            </div>

            <div class="tlv-main">
                <div>
                    <div class="tlv-section">
                        <h2>💬 Activitat recent · ${feed.length} de ${fullFeedCount} events · filtre ${this._esc(this._filterMode)}</h2>
                        <div class="tlv-sort">
                            <button class="tlv-sort-btn ${this._sortMode === 'chrono' ? 'active' : ''}" data-sort="chrono">🕒 Cronològic</button>
                            <button class="tlv-sort-btn ${this._sortMode === 'relevance' ? 'active' : ''}" data-sort="relevance">⚡ Rellevància</button>
                            <a href="/registry" data-link style="margin-left:auto;color:var(--accent-indigo);font-size:0.72rem;text-decoration:none;padding:5px 12px;">→ Registry</a>
                        </div>
                        ${feed.length === 0
                            ? emptyStateHtml({
                                icon: '🌱',
                                title: 'Encara cap activitat',
                                body: 'Quan crees projectes · signes pactes · publiques al permaweb · veuràs activitat aquí en temps real. Comença creant el primer projecte.',
                                ctaLabel: '+ Crear projecte',
                                ctaHref: '/create',
                                secondaryLabel: 'Explora registry',
                                secondaryHref: '/registry',
                            })
                            : feed.map(e => this._renderEvent(e)).join('')}
                    </div>
                </div>

                <aside>
                    ${myCounts ? this._renderMyCounts(myCounts) : ''}
                    ${this._renderNetworkStats(networkStats)}
                    ${this._renderTopFollowed(topFollowed)}
                </aside>
            </div>
        </div>`;
    }

    _renderEvent(e) {
        const actor = e.actorHandle
            ? `<a class="tlv-handle" href="/u/${encodeURIComponent(e.actorHandle.replace(/^@/, ''))}" data-link>${this._esc(e.actorHandle)}</a> · `
            : '';
        return `
        <div class="tlv-event">
            <div class="ic">${e.iconHint || '·'}</div>
            <div class="body">
                <div class="ttl">${this._esc(e.title || e.kind)}</div>
                <div class="meta">${actor}${this._formatRelativeTime(e.ts)} · <span style="opacity:0.7;">${this._esc(e.kind)}</span></div>
                ${e.summary ? `<div class="summary">${this._esc(e.summary)}</div>` : ''}
            </div>
        </div>`;
    }

    _renderMyCounts(c) {
        return `
        <div class="tlv-section">
            <h2>👤 La meva xarxa</h2>
            <div class="tlv-stat"><span class="lbl">Followers</span><span class="val">${c.followers}</span></div>
            <div class="tlv-stat"><span class="lbl">Following</span><span class="val">${c.following}</span></div>
            <div class="tlv-stat"><span class="lbl">Mutual</span><span class="val">${c.mutual}</span></div>
            <a href="/u/${encodeURIComponent((this._meHandle || '').replace(/^@/, ''))}" data-link style="display:inline-block;margin-top:8px;font-size:0.75rem;color:var(--accent-indigo);text-decoration:none;">→ El meu perfil</a>
        </div>`;
    }

    _renderNetworkStats(s) {
        return `
        <div class="tlv-section">
            <h2>🌐 Xarxa SOS</h2>
            <div class="tlv-stat"><span class="lbl">Participants</span><span class="val">${s.totalParticipants}</span></div>
            <div class="tlv-stat"><span class="lbl">Connexions</span><span class="val">${s.totalEdges}</span></div>
            <div class="tlv-stat"><span class="lbl">Parelles mútues</span><span class="val">${s.mutualPairs}</span></div>
        </div>`;
    }

    _renderTopFollowed(top) {
        if (!top || top.length === 0) return '';
        return `
        <div class="tlv-section">
            <h2>⭐ Top seguits</h2>
            ${top.map((it, i) => `
                <div class="tlv-stat">
                    <span class="lbl">${i + 1}. <a class="tlv-handle" href="/u/${encodeURIComponent(it.handle.replace(/^@/, ''))}" data-link>${this._esc(it.handle)}</a></span>
                    <span class="val">${it.count}</span>
                </div>
            `).join('')}
        </div>`;
    }

    _formatRelativeTime(ts) {
        if (!ts) return '';
        const diffMs = Date.now() - ts;
        const min = Math.floor(diffMs / 60000);
        if (min < 1) return 'just ara';
        if (min < 60) return min + ' min';
        const hr = Math.floor(min / 60);
        if (hr < 24) return hr + ' h';
        const days = Math.floor(hr / 24);
        if (days < 30) return days + ' d';
        return new Date(ts).toLocaleDateString();
    }

    _esc(s) {
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    destroy() {}
}

export const TPL_VERSION = 'timeline-v1.0';
