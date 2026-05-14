// =============================================================================
// TEAMTOWERS SOS V11 — SPRINT VIEW (SWARM-OP-001 sprint A)
// Ruta: /sprint
//
// UI per al sprintOrchestrator · visualitza el backlog · permet a l'usuari
// triggar runs IA per item · historial al KB sprint_run nodes.
//
// Honor SOS · Swarm Operative System · cada execució mou el sistema un pas
// més proper al 100% verd al backlog.
// =============================================================================

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import {
    INITIAL_BACKLOG, summarizeBacklog, prioritizedPendingItems,
    BACKLOG_PRIORITY, BACKLOG_COMPLEXITY,
    runSprintItem, persistSprintRun, queryHistory, pickNextItem,
} from '../core/sprintOrchestrator.js';

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
}

export default class SprintView {
    constructor() {
        document.title = 'Sprint loop · SOS V11';
        this._items   = INITIAL_BACKLOG;
        this._history = [];
        this._filter  = 'all';   // 'all' | 'pending' | 'in_progress' | etc.
    }

    async _loadData() {
        await store.init();
        await KB.init();
        this._history = await queryHistory({ kb: KB, limit: 50 });
    }

    async getHtml() {
        await this._loadData();
        const stats = summarizeBacklog(this._items);
        const queue = prioritizedPendingItems(this._items);
        const next  = queue[0];

        return `
        <style>
            .sp-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); }
            .sp-main  { max-width:1200px; margin:0 auto; padding:1.5rem; }
            .sp-hero  { background:linear-gradient(135deg,rgba(99,102,241,0.10),rgba(168,85,247,0.06)); border:1px solid var(--border-default); border-left:3px solid var(--accent-purple); border-radius:var(--radius-lg); padding:1.4rem; margin-bottom:1.4rem; }
            .sp-hero h1 { margin:0; color:var(--text-main); font-size:1.5rem; letter-spacing:-0.02em; font-weight:900; }
            .sp-hero p  { color:var(--text-secondary); font-size:0.9rem; line-height:1.6; margin-top:8px; max-width:760px; }
            .sp-stats   { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:10px; margin-top:1rem; }
            .sp-stat    { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:var(--radius-md); padding:10px; text-align:center; }
            .sp-stat .val { font-size:1.4rem; font-weight:900; font-family:var(--font-mono); color:var(--text-main); }
            .sp-stat .lbl { font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em; }
            .sp-next   { background:var(--bg-panel); border:1px solid var(--accent-purple); border-radius:var(--radius-lg); padding:1.2rem; margin-bottom:1.4rem; }
            .sp-next h2 { margin:0 0 0.6rem; font-size:1rem; color:var(--accent-purple); letter-spacing:0.05em; text-transform:uppercase; font-weight:800; }
            .sp-grid   { display:grid; grid-template-columns:1.6fr 1fr; gap:1.2rem; }
            @media (max-width:960px) { .sp-grid { grid-template-columns:1fr; } }
            .sp-item   { background:var(--bg-panel); border:1px solid var(--border-default); border-left:3px solid var(--accent-indigo); border-radius:var(--radius-md); padding:1rem 1.1rem; margin-bottom:8px; }
            .sp-item h3 { margin:0; font-size:0.95rem; color:var(--text-main); }
            .sp-item .desc { color:var(--text-secondary); font-size:0.82rem; line-height:1.55; margin-top:6px; }
            .sp-item .meta { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-top:8px; font-size:11px; font-family:var(--font-mono); color:var(--text-muted); }
            .sp-badge  { padding:1px 8px; border-radius:999px; font-weight:700; font-size:10px; letter-spacing:0.04em; }
            .sp-actions { display:flex; gap:6px; flex-wrap:wrap; margin-top:10px; }
            .sp-btn    { background:var(--accent-purple); color:#fff; border:0; padding:5px 12px; border-radius:var(--radius-sm); cursor:pointer; font-size:11px; font-weight:700; }
            .sp-btn.secondary { background:transparent; color:var(--accent-indigo); border:1px solid var(--accent-indigo); }
            .sp-btn:disabled { opacity:0.5; cursor:not-allowed; }
            .sp-side   { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:var(--radius-lg); padding:1rem; }
            .sp-history-item { background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:8px 10px; margin-bottom:6px; font-size:0.78rem; }
            .sp-history-item .head { display:flex; justify-content:space-between; gap:8px; }
            .sp-modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9990; display:flex; align-items:center; justify-content:center; padding:20px; }
            .sp-modal    { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:var(--radius-lg); padding:1.5rem; max-width:820px; width:100%; max-height:84vh; overflow:auto; }
            .sp-modal pre { background:var(--bg-elevated); border:1px solid var(--border-default); border-radius:var(--radius-md); padding:12px; font-size:11px; font-family:var(--font-mono); white-space:pre-wrap; word-break:break-word; color:var(--text-secondary); max-height:60vh; overflow:auto; }
        </style>

        <div class="sp-shell"><div class="sp-main">
            <header class="sp-hero">
                <h1>🐝 Swarm Operative · Sprint loop</h1>
                <p>Honor SOS · Swarm Operative System. Backlog estructurat alineat amb els <a href="#" data-link style="color:var(--accent-indigo);">4 principis canònics</a>. Tria un item · l'agent IA genera el pla d'implementació · històric persistit al KB com a <code>sprint_run</code> nodes (TEA-auditable).</p>
                <div class="sp-stats">
                    <div class="sp-stat"><div class="val">${this._items.length}</div><div class="lbl">Total items</div></div>
                    <div class="sp-stat"><div class="val">${stats.byStatus.pending || 0}</div><div class="lbl">Pending</div></div>
                    <div class="sp-stat"><div class="val">${stats.byStatus.in_progress || 0}</div><div class="lbl">In progress</div></div>
                    <div class="sp-stat"><div class="val">${stats.byStatus.completed || 0}</div><div class="lbl">Completed</div></div>
                    <div class="sp-stat"><div class="val">${this._history.length}</div><div class="lbl">IA runs</div></div>
                    <div class="sp-stat"><div class="val">~${stats.totalPendingHours.toFixed(0)}h</div><div class="lbl">Pending hours</div></div>
                </div>
            </header>

            ${next ? `
            <div class="sp-next">
                <h2>📌 Next up · queue prioritzada</h2>
                <h3 style="margin:0 0 4px;color:var(--text-main);">${esc(next.title)}</h3>
                <div style="color:var(--text-muted);font-size:11px;font-family:var(--font-mono);">id: ${esc(next.id)} · ${esc(next.priority)} · ${esc(next.complexity)}</div>
                <div class="sp-actions">
                    <button class="sp-btn" data-sp-run="${esc(next.id)}" data-sp-kind="draft">🤖 Generar pla IA</button>
                    <button class="sp-btn secondary" data-sp-run="${esc(next.id)}" data-sp-kind="audit">🔍 Audit codebase</button>
                    ${next.complexity === 'XL' ? `<button class="sp-btn secondary" data-sp-run="${esc(next.id)}" data-sp-kind="research">📚 Research</button>` : ''}
                </div>
            </div>` : ''}

            <div class="sp-grid">
                <div>
                    <h2 style="margin:0 0 0.7rem 0;font-size:1rem;color:var(--text-main);font-weight:800;">📋 Backlog complet</h2>
                    ${this._items.map(it => this._renderItem(it)).join('')}
                </div>
                <aside class="sp-side">
                    <h2 style="margin:0 0 0.6rem 0;font-size:0.95rem;color:var(--text-main);">📜 Historial IA</h2>
                    <p style="font-size:11px;color:var(--text-muted);margin:0 0 0.7rem;">Últims ${this._history.length} runs · persistits al KB com a <code>sprint_run</code> nodes.</p>
                    ${this._history.length === 0
                        ? '<div style="color:var(--text-muted);font-style:italic;font-size:12px;">Cap run encara · trigga un item per a començar.</div>'
                        : this._history.slice(0, 30).map(h => this._renderHistory(h)).join('')
                    }
                </aside>
            </div>
            <div id="spModalRoot"></div>
        </div></div>
        `;
    }

    _renderItem(it) {
        const prio = BACKLOG_PRIORITY[it.priority] || {};
        const cx   = BACKLOG_COMPLEXITY[it.complexity] || {};
        const statusColors = { pending:'#3b82f6', in_progress:'#facc15', completed:'#22c55e', blocked:'#ef4444', needs_review:'#a855f7' };
        const stColor = statusColors[it.status] || '#94a3b8';
        return `
            <div class="sp-item" data-sp-item-id="${esc(it.id)}">
                <h3>${esc(it.title)}</h3>
                <div class="desc">${esc(it.description)}</div>
                <div class="meta">
                    <span class="sp-badge" style="background:${stColor}25;color:${stColor};">${esc(it.status)}</span>
                    <span class="sp-badge" style="background:${prio.color}25;color:${prio.color};">${esc(prio.label || it.priority)}</span>
                    <span class="sp-badge" style="background:rgba(99,102,241,0.15);color:var(--accent-indigo);">${esc(it.complexity)} · ${esc(cx.label || '?')}</span>
                    ${(it.principles || []).map(p => `<span style="opacity:0.7;">${esc(p)}</span>`).join(' ')}
                </div>
                ${it.status === 'pending' ? `
                    <div class="sp-actions">
                        <button class="sp-btn" data-sp-run="${esc(it.id)}" data-sp-kind="draft">🤖 Pla IA</button>
                        <button class="sp-btn secondary" data-sp-run="${esc(it.id)}" data-sp-kind="audit">🔍 Audit</button>
                    </div>` : ''}
            </div>
        `;
    }

    _renderHistory(h) {
        const c = h?.content || {};
        const when = c.startTs ? new Date(c.startTs).toLocaleString('es-ES', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' }) : '?';
        const ok = !c.error;
        return `<div class="sp-history-item" data-sp-history-id="${esc(h.id)}" style="cursor:pointer;">
            <div class="head">
                <span style="font-weight:700;">${esc(c.itemId)}</span>
                <span style="color:var(--text-muted);font-family:var(--font-mono);">${esc(when)}</span>
            </div>
            <div style="color:var(--text-muted);font-size:10px;margin-top:2px;">
                ${ok ? '✓' : '✗'} ${esc(c.kind)} · ${esc(c.modelKey || '?')} · ${c.durationMs ? Math.round(c.durationMs/100)/10 + 's' : ''}
            </div>
        </div>`;
    }

    async afterRender() {
        document.querySelectorAll('[data-sp-run]').forEach(btn => {
            btn.addEventListener('click', () => this._handleRun(btn.getAttribute('data-sp-run'), btn.getAttribute('data-sp-kind') || 'draft', btn));
        });
        document.querySelectorAll('[data-sp-history-id]').forEach(el => {
            el.addEventListener('click', () => this._openHistoryDetail(el.getAttribute('data-sp-history-id')));
        });
    }

    async _handleRun(itemId, kind, btn) {
        if (!itemId) return;
        const orig = btn?.textContent;
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Cridant IA…'; }
        try {
            const result = await runSprintItem({ itemId, kind });
            await persistSprintRun({ kb: KB, run: result.run });
            this._showRunOutput(result);
        } catch (e) {
            alert('Run failed: ' + (e?.message || e));
        }
        if (btn) { btn.disabled = false; btn.textContent = orig; }
        this._history = await queryHistory({ kb: KB, limit: 50 });
        // Soft refresh history aside
        const sideHtmlNew = this._history.length === 0
            ? '<div style="color:var(--text-muted);font-style:italic;font-size:12px;">Cap run encara · trigga un item per a començar.</div>'
            : this._history.slice(0, 30).map(h => this._renderHistory(h)).join('');
        const asideHistory = document.querySelector('.sp-side');
        if (asideHistory) {
            const items = asideHistory.querySelectorAll('.sp-history-item');
            const lastEl = asideHistory.querySelector('p + *');
            asideHistory.querySelectorAll('.sp-history-item').forEach(el => el.remove());
            asideHistory.insertAdjacentHTML('beforeend', sideHtmlNew);
            asideHistory.querySelectorAll('[data-sp-history-id]').forEach(el => {
                el.addEventListener('click', () => this._openHistoryDetail(el.getAttribute('data-sp-history-id')));
            });
        }
    }

    _showRunOutput(result) {
        const c = result.run?.content || {};
        const root = document.getElementById('spModalRoot');
        if (!root) return;
        root.innerHTML = `
            <div class="sp-modal-bg" id="spModalBg">
                <div class="sp-modal">
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
                        <h2 style="margin:0;font-size:1.2rem;">🤖 ${esc(c.kind)} · ${esc(c.itemId)}</h2>
                        <code style="color:var(--accent-purple);font-size:11px;">${esc(c.modelKey || '?')} · ${c.durationMs ? Math.round(c.durationMs/100)/10 + 's' : ''}</code>
                    </div>
                    ${c.error ? `<div style="color:var(--accent-red);font-size:12px;margin-bottom:10px;">✗ ${esc(c.error)}</div>` : ''}
                    <pre>${esc(c.output || '(empty)')}</pre>
                    <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end;">
                        <button id="spModalCopy" class="sp-btn">📋 Copiar</button>
                        <button id="spModalClose" class="sp-btn secondary">Tancar</button>
                    </div>
                </div>
            </div>`;
        const close = () => { root.innerHTML = ''; };
        document.getElementById('spModalBg').addEventListener('click', e => { if (e.target.id === 'spModalBg') close(); });
        document.getElementById('spModalClose').addEventListener('click', close);
        document.getElementById('spModalCopy').addEventListener('click', async () => {
            try { await navigator.clipboard.writeText(c.output || ''); document.getElementById('spModalCopy').textContent = '✓ Copiat!'; }
            catch (_) { document.getElementById('spModalCopy').textContent = '✗ falla'; }
        });
    }

    async _openHistoryDetail(historyId) {
        const node = this._history.find(h => h.id === historyId);
        if (!node) return;
        this._showRunOutput({ run: node });
    }
}
