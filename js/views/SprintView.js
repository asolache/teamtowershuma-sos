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
import { loadBacklog } from '../core/agentBacklogLoader.js';

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
}

// SWARM-RELOC-001 · adapter · YAML WO → SprintView item compatible
// El YAML usa status:'done' i el sprintOrchestrator espera 'completed'.
// Camps mínims que el view + summarizeBacklog necessiten · id · title ·
// status · priority · complexity · description.
function _adaptYamlWoToItem(wo) {
    const statusMap = {
        'done':        'completed',
        'in-progress': 'in_progress',
        'claimed':     'in_progress',
        'pending':     'pending',
        'blocked':     'blocked',
        'cancelled':   'blocked',
    };
    return {
        id:            wo.id,
        title:         wo.title || wo.id,
        description:   wo.description || '',
        status:        statusMap[wo.status] || 'pending',
        priority:      wo.priority || 'medium',
        complexity:    wo.complexity || 'M',
        dependencies:  Array.isArray(wo.dependencies) ? wo.dependencies : [],
        suggestedFiles: [],
        source:        'yaml-backlog',                // marker · UI pot diferenciar
        assignee_kind: wo.assignee_kind || 'ai-any',
        estimated_cost_eur: wo.estimated_cost_eur,
        deliverable_test:   wo.deliverable_test,
    };
}

export default class SprintView {
    constructor() {
        document.title = 'Sprint loop · SOS V11';
        this._items   = INITIAL_BACKLOG;       // fallback inicial
        this._history = [];
        this._filter  = 'all';
        this._yamlAvailable = false;
        this._yamlItems = [];
        this._legacyItems = INITIAL_BACKLOG;
    }

    async _loadData() {
        await store.init();
        await KB.init();
        this._history = await queryHistory({ kb: KB, limit: 50 });

        // SWARM-RELOC-001 · prioritza el backlog modern YAML (docs/backlog.yaml)
        // Falla graceful a INITIAL_BACKLOG si no està disponible.
        try {
            const yamlBacklog = await loadBacklog();
            if (yamlBacklog && Array.isArray(yamlBacklog.work_orders)) {
                this._yamlItems = yamlBacklog.work_orders.map(_adaptYamlWoToItem);
                this._yamlAvailable = this._yamlItems.length > 0;
            }
        } catch (_) {}

        // Si tenim YAML · usem com a font principal · legacy queda de fons
        this._items = this._yamlAvailable ? this._yamlItems : INITIAL_BACKLOG;
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
                <div style="padding:10px 14px;background:${this._yamlAvailable ? 'rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.35)' : 'rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.35)'};border-radius:6px;margin-bottom:0.8rem;font-size:0.85rem;line-height:1.55;">
                    ${this._yamlAvailable
                        ? `✅ <strong>Backlog modern actiu</strong> · ${this._yamlItems.length} WOs llegits des de <a href="https://github.com/asolache/teamtowershuma-sos/blob/main/docs/backlog.yaml" target="_blank" rel="noopener" style="color:#22c55e;font-weight:700;">docs/backlog.yaml</a> via <code>agentBridgeSchema</code>. Vegeu també al Kanban a <a href="/kanban?project=sos-dev-internal" data-link style="color:#22c55e;font-weight:700;">/kanban?project=sos-dev-internal</a> · click <strong>🐝 Swarm mode</strong> per a botons Auto-run per WO. <button id="spSyncKanban" style="margin-left:8px;padding:3px 10px;background:rgba(34,197,94,0.18);color:#22c55e;border:1px solid rgba(34,197,94,0.4);border-radius:4px;font-size:0.78rem;font-weight:700;cursor:pointer;">🔄 Crear WOs al Kanban</button>`
                        : `ℹ️ <strong>SWARM-RELOC-001</strong> · Backlog YAML no disponible · fallback a INITIAL_BACKLOG (legacy). Verifica que <code>docs/backlog.json</code> existeix.`
                    }
                </div>
                <p>Honor SOS · Swarm Operative System. Backlog estructurat alineat amb els <a href="#" data-link style="color:var(--accent-indigo);">4 principis canònics</a>. Tria un item · l'agent IA genera el pla d'implementació · històric persistit al KB com a <code>sprint_run</code> nodes (TEA-auditable).</p>
                <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="sp-btn" id="spAgentLoop" title="Auto-loop · l'agent IA processa el backlog amb TDD fins a verd (cap a budget · cap a iteracions)" style="background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;border:0;">🤖 Run autonomous loop</button>
                </div>
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
        // TDD-AGENT sprint A · autonomous loop launcher
        document.getElementById('spAgentLoop')?.addEventListener('click', () => this._openAgentModal());

        // SWARM-RELOC-001 · sync YAML backlog → KB work_order nodes
        document.getElementById('spSyncKanban')?.addEventListener('click', () => this._syncToKanban());
    }

    async _syncToKanban() {
        const btn = document.getElementById('spSyncKanban');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '⏳ Creant WOs...';
        }
        try {
            const { toast } = await import('../core/uxComponents.js');
            let created = 0, skipped = 0;
            for (const item of this._yamlItems) {
                // Mapping a work_order shape per a KanbanView
                const woId = 'wo-yaml-' + item.id;
                let exists = false;
                try {
                    const e = await KB.getNode(woId);
                    if (e) exists = true;
                } catch (_) {}
                if (exists) { skipped++; continue; }

                const woNode = {
                    id: woId,
                    type: 'work_order',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    content: {
                        projectId: 'sos-dev-internal',
                        title:     item.title,
                        description: item.description,
                        status:    item.status === 'completed' ? 'ledgered' : (item.status === 'in_progress' ? 'in_progress' : 'backlog'),
                        priority:  item.priority || 'medium',
                        complexity: item.complexity || 'M',
                        estimatedHours: BACKLOG_COMPLEXITY[item.complexity]?.hours || 6,
                        assignee: { kind: (item.assignee_kind || 'ai-any').startsWith('ai') ? 'ai' : 'human' },
                        aiCostEur: item.estimated_cost_eur || null,
                        deliverableTest: item.deliverable_test || null,
                        source: 'yaml-backlog',
                        sourceItemId: item.id,
                    },
                    keywords: ['type:work_order', 'project:sos-dev-internal', 'source:yaml-backlog', 'priority:' + (item.priority || 'medium')],
                };
                await KB.upsert(woNode);
                created++;
            }
            toast({
                kind: 'success',
                text: '✓ Sync · ' + created + ' WO(s) creats · ' + skipped + ' ja existents · obre /kanban?project=sos-dev-internal',
                ttl: 6000,
            });
            if (btn) {
                btn.textContent = '✓ ' + created + ' creats';
                setTimeout(() => {
                    window.location.href = '/kanban?project=sos-dev-internal';
                }, 2000);
            }
        } catch (e) {
            const { toast } = await import('../core/uxComponents.js');
            toast({ kind: 'error', text: 'Error: ' + (e?.message || e) });
            if (btn) {
                btn.disabled = false;
                btn.textContent = '🔄 Crear WOs al Kanban';
            }
        }
    }

    // TDD-AGENT sprint A · modal de configuració + run loop autònom
    _openAgentModal() {
        const root = document.getElementById('spModalRoot');
        if (!root) return;
        const dry = (() => {
            try {
                const queue = this._items.filter(it => it.status === 'pending');
                return { queueLength: queue.length };
            } catch (_) { return { queueLength: 0 }; }
        })();
        root.innerHTML = `
            <div class="sp-modal-bg" id="spAgentModalBg">
                <div class="sp-modal">
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
                        <h2 style="margin:0;font-size:1.2rem;">🤖 Autonomous loop · TDD agent</h2>
                        <button id="spAgentClose" class="sp-btn secondary">×</button>
                    </div>
                    <p style="color:var(--text-muted);font-size:0.85rem;line-height:1.5;">
                        L'agent processa el backlog pending (${dry.queueLength} items) amb cadena de fallback IA · evaluator sentinel · cap a budget €. Cada run es persisteix com a <code>sprint_run</code> al KB i pot revisar-se a la columna lateral.
                    </p>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;">
                        <label style="font-size:12px;color:var(--text-secondary);">
                            <div>Budget € (cap dur)</div>
                            <input id="spAgentBudget" type="number" min="0.1" step="0.5" value="2" style="width:100%;padding:6px 8px;background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:6px;color:var(--text-main);font-family:var(--font-mono);" />
                        </label>
                        <label style="font-size:12px;color:var(--text-secondary);">
                            <div>Max iteracions</div>
                            <input id="spAgentMaxIter" type="number" min="1" max="50" value="5" style="width:100%;padding:6px 8px;background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:6px;color:var(--text-main);font-family:var(--font-mono);" />
                        </label>
                        <label style="font-size:12px;color:var(--text-secondary);">
                            <div>Task kind (escalation chain)</div>
                            <select id="spAgentTaskKind" style="width:100%;padding:6px 8px;background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:6px;color:var(--text-main);">
                                <option value="creative-narrative">creative-narrative · Anthropic primary</option>
                                <option value="code-generation">code-generation · DeepSeek primary</option>
                                <option value="quality-audit">quality-audit · DeepSeek-R1</option>
                                <option value="deep-reasoning">deep-reasoning · DeepSeek-R1</option>
                            </select>
                        </label>
                        <label style="font-size:12px;color:var(--text-secondary);">
                            <div>Max intents per item</div>
                            <input id="spAgentMaxAttempts" type="number" min="1" max="5" value="1" style="width:100%;padding:6px 8px;background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:6px;color:var(--text-main);font-family:var(--font-mono);" />
                        </label>
                    </div>
                    <div id="spAgentProgress" style="margin-top:14px;font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);max-height:240px;overflow-y:auto;background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:6px;padding:8px 10px;display:none;"></div>
                    <div id="spAgentSummary" style="margin-top:10px;display:none;"></div>
                    <div style="display:flex;gap:8px;margin-top:14px;justify-content:flex-end;">
                        <button id="spAgentRun" class="sp-btn" style="background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;border:0;">▶ Run loop</button>
                        <button id="spAgentCloseBtn" class="sp-btn secondary">Tancar</button>
                    </div>
                </div>
            </div>
        `;
        const close = () => { root.innerHTML = ''; };
        document.getElementById('spAgentClose').addEventListener('click', close);
        document.getElementById('spAgentCloseBtn').addEventListener('click', close);
        document.getElementById('spAgentModalBg').addEventListener('click', e => { if (e.target.id === 'spAgentModalBg') close(); });
        document.getElementById('spAgentRun').addEventListener('click', () => this._handleAgentRun());
    }

    async _handleAgentRun() {
        const btn       = document.getElementById('spAgentRun');
        const progress  = document.getElementById('spAgentProgress');
        const summary   = document.getElementById('spAgentSummary');
        const budgetEur     = parseFloat(document.getElementById('spAgentBudget').value)        || 2;
        const maxIterations = parseInt(document.getElementById('spAgentMaxIter').value, 10)     || 5;
        const taskKind      = document.getElementById('spAgentTaskKind').value                  || 'creative-narrative';
        const maxAttemptsPerItem = parseInt(document.getElementById('spAgentMaxAttempts').value, 10) || 1;
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Running…'; }
        if (progress) {
            progress.style.display = 'block';
            progress.innerHTML = '· Loop iniciat · budget €' + budgetEur.toFixed(2) + ' · max ' + maxIterations + ' iter · task ' + taskKind + '<br>';
        }
        try {
            const { runUntilGreen, buildAgentRunNode } = await import('../core/backlogAutonomousAgent.js');
            const result = await runUntilGreen({
                items:    this._items,
                budgetEur, maxIterations, taskKind, maxAttemptsPerItem,
                kb:       KB,
                persist:  true,
                onIteration: (ev) => {
                    if (!progress) return;
                    const icon = ev.status === 'green' ? '✓' : '✗';
                    const color = ev.status === 'green' ? '#22c55e' : '#facc15';
                    progress.insertAdjacentHTML('beforeend',
                        `<span style="color:${color};">${icon}</span> #${ev.iteration} <code>${esc(ev.itemId)}</code> · ${ev.modelKey || 'n/a'} · €${ev.costEur.toFixed(4)} · cum €${ev.totalCostEur.toFixed(4)}` +
                        (ev.evalReason ? ` · <span style="color:var(--text-muted);">${esc(String(ev.evalReason).slice(0, 80))}</span>` : '') + '<br>');
                    progress.scrollTop = progress.scrollHeight;
                },
            });
            // Persisteix un node AGENT_RUN_TYPE com a audit-trail TEA del loop
            try {
                await KB.upsert(buildAgentRunNode(result));
            } catch (e) { console.warn('[agent] persist agent-run-node failed', e?.message); }

            if (summary) {
                summary.style.display = 'block';
                const greenList = result.greenItems.map(id => `<code style="color:#22c55e;">${esc(id)}</code>`).join(' · ') || '—';
                const redList   = result.failedItems.map(id => `<code style="color:#facc15;">${esc(id)}</code>`).join(' · ') || '—';
                summary.innerHTML = `
                    <div style="background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:8px;padding:10px 14px;font-size:12px;line-height:1.55;">
                        <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:8px;">
                            <span><strong style="color:#22c55e;">${result.completedCount}</strong> ✓ green</span>
                            <span><strong style="color:#facc15;">${result.failedItems.length}</strong> ✗ red</span>
                            <span><strong>${result.iterationsRun}</strong> iter</span>
                            <span><strong>€${result.totalCostEur.toFixed(4)}</strong> cost</span>
                            ${result.budgetExhausted ? '<span style="color:#facc15;">⚠ budget exhausted</span>' : ''}
                        </div>
                        <div style="color:var(--text-muted);"><strong>Green:</strong> ${greenList}</div>
                        <div style="color:var(--text-muted);"><strong>Red:</strong> ${redList}</div>
                    </div>
                `;
            }
            // Refresca la història al sidebar (queryHistory dispara recàrrega)
            this._history = await queryHistory({ kb: KB, limit: 50 });
        } catch (e) {
            if (progress) progress.insertAdjacentHTML('beforeend', `<span style="color:#ef4444;">✗ ERROR · ${esc(e?.message || e)}</span><br>`);
        }
        if (btn) { btn.disabled = false; btn.textContent = '▶ Run loop'; }
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
            // SWARM-OP-002 · UX més útil quan tots els proveïdors fallen
            const attempts = e?.attempts || [];
            const trace = attempts.length
                ? '\n\nIntents:\n' + attempts.map(a => `  ${a.evalOk ? '✓' : '✗'} ${a.modelKey}${a.evalReason ? ' · ' + a.evalReason : ''}`).join('\n')
                : '';
            const hint = /credit balance|insufficient_quota|http 4[01]\d/i.test(e?.message || '')
                ? '\n\n💡 Solució · obre /settings i configura una API key alternativa (OpenAI · Gemini · DeepSeek · Minimax) · l\'escalation chain agafarà la primera que funcioni.'
                : '';
            alert('Run failed · ' + (e?.message || e) + trace + hint);
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
                    ${Array.isArray(c.attempts) && c.attempts.length > 1 ? `
                        <div style="background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:6px;padding:8px 10px;margin-bottom:10px;font-size:11px;color:var(--text-muted);">
                            <strong style="color:var(--text-secondary);">🔄 Failover chain · ${c.attempts.length} intents:</strong><br>
                            ${c.attempts.map(a => {
                                const ok = a.evalOk;
                                const icon = ok ? '✓' : '✗';
                                const color = ok ? '#22c55e' : '#facc15';
                                const reason = a.evalReason ? ' · ' + esc(String(a.evalReason).slice(0, 90)) : '';
                                return `<span style="color:${color};">${icon} ${esc(a.modelKey)}${reason}</span>`;
                            }).join('<br>')}
                        </div>` : ''}
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
