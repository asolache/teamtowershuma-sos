// =============================================================================
// TEAMTOWERS SOS V11 — SWARM FLOW VIEW (SWARM-PARALLEL sprint A)
// Ruta · /js/views/SwarmFlowView.js  →  /swarm?project={id}[&flow={flowId}]
//
// Llista value flows del projecte + botó "▶ Run flow" que executa el DAG
// paral·lel (runValueFlow) amb runEscalation default · timeline d'events
// live · persisteix swarm_flow_run al KB. Mostra els darrers runs amb expand
// per veure outputs per deliverable.
// =============================================================================

import { KB } from '../core/kb.js';
import {
    VALUE_FLOW_TYPE, buildEmptyValueFlow, addRole, addDeliverable, addTransaction,
    validateValueFlow, topologicalLevels, estimateFlowComplexity,
} from '../core/valueFlowService.js';
import {
    SWARM_RUN_TYPE, runValueFlow, buildSwarmRunNode,
} from '../core/swarmParallelFlow.js';

export default class SwarmFlowView {

    constructor() {
        document.title = 'Swarm flows · SOS V11';
        try {
            const u = new URL(window.location.href);
            this.projectId = u.searchParams.get('project') || null;
        } catch (_) { this.projectId = null; }
        this.project = null;
        this.flows   = [];
        this.runs    = [];
    }

    async getHtml() {
        if (!this.projectId) return this._htmlNoProject();
        try { this.project = await KB.getNode(this.projectId); } catch (_) { this.project = null; }
        if (!this.project) return this._htmlNotFound();
        try { this.flows = await KB.query({ type: VALUE_FLOW_TYPE, projectId: this.projectId }) || []; } catch (_) { this.flows = []; }
        try { this.runs  = await KB.query({ type: SWARM_RUN_TYPE, projectId: this.projectId }) || []; } catch (_) { this.runs  = []; }
        return this._htmlMain();
    }

    async afterRender() {
        if (!this.project) return;
        this._bindCreateDemo();
        this._bindRunButtons();
    }

    _htmlNoProject() {
        return `<div style="min-height:100dvh;background:var(--bg-dark);color:var(--text-main);font-family:var(--font-base);padding:2rem;">
            <div style="max-width:600px;margin:4rem auto;text-align:center;background:var(--bg-panel);padding:2rem;border-radius:8px;border:1px solid var(--border-default);">
                <h1>🌪 Swarm flows</h1><p>Cal indicar projecte.</p>
                <a href="/dashboard" data-link style="color:var(--accent-indigo);">← Dashboard</a>
            </div></div>`;
    }
    _htmlNotFound() {
        return `<div style="min-height:100dvh;background:var(--bg-dark);color:var(--text-main);font-family:var(--font-base);padding:2rem;">
            <div style="max-width:600px;margin:4rem auto;text-align:center;background:var(--bg-panel);padding:2rem;border-radius:8px;border:1px solid var(--border-default);">
                <h1>⚠ Projecte no trobat</h1><a href="/dashboard" data-link style="color:var(--accent-indigo);">← Dashboard</a>
            </div></div>`;
    }

    _htmlMain() {
        const projName = this.project.nombre || this.project.name || this.project.id;

        const flowsHtml = this.flows.length === 0
            ? `<div style="color:var(--text-muted);font-style:italic;padding:1rem;">Cap value flow encara. <button id="swCreateDemo" class="sw-btn">🪄 Crear flow demo (architect → coder + reviewer)</button></div>`
            : this.flows.map(f => {
                const c = f.content || {};
                const validation = validateValueFlow(f);
                const complexity = estimateFlowComplexity(f);
                let levelsCount = 0;
                try { levelsCount = topologicalLevels(f).length; } catch (_) {}
                return `<div class="sw-card" data-flow="${f.id}">
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                        <div>
                            <strong style="font-size:0.95rem;">${this._esc(c.title || f.id)}</strong>
                            <span style="font-size:11px;color:var(--text-muted);margin-left:8px;font-family:var(--font-mono);">
                                ${(c.roles || []).length} roles · ${(c.deliverables || []).length} deliverables · ${levelsCount} levels · complexity ${complexity.score}
                            </span>
                            <span style="font-size:11px;color:${validation.ok ? '#22c55e' : '#ef4444'};margin-left:8px;">${validation.ok ? '✓ valid' : '⚠ ' + validation.errors[0]}</span>
                        </div>
                        <div>
                            <button class="sw-btn sw-btn-run" data-run="${f.id}" ${validation.ok ? '' : 'disabled'}>▶ Run paral·lel</button>
                        </div>
                    </div>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">
                        Roles · ${(c.roles || []).map(r => this._esc(r.kind)).join(' · ') || '—'} ·
                        maxParallel · ${complexity.maxParallel}
                    </div>
                    <div data-runlog="${f.id}" class="sw-runlog"></div>
                </div>`;
            }).join('');

        const sortedRuns = this.runs.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 5);
        const runsHtml = sortedRuns.length === 0
            ? '<div style="color:var(--text-muted);font-style:italic;padding:0.6rem;">Cap execució encara · prem "▶ Run paral·lel" en un flow per començar.</div>'
            : sortedRuns.map(run => {
                const c = run.content || {};
                const okColor = c.ok ? '#22c55e' : '#ef4444';
                const dels = Object.entries(c.results || {});
                return `<details class="sw-run-row">
                    <summary>
                        <span style="color:${okColor};font-weight:700;">${c.ok ? '✓' : '✗'}</span>
                        <span style="margin-left:8px;font-family:var(--font-mono);font-size:11px;">${this._esc((c.startedAt || '').slice(0, 19).replace('T', ' '))}</span>
                        <span style="margin-left:10px;">flow · <code>${this._esc(c.flowId)}</code></span>
                        <span style="margin-left:10px;">${c.levelsExecuted} levels · ${dels.length} deliverables · €${(c.totalCostEur || 0).toFixed(3)} · ${c.durationMs}ms</span>
                    </summary>
                    <div style="padding:10px;background:#0008;border-radius:4px;margin-top:6px;">
                        ${dels.length === 0 ? '<em style="color:var(--text-muted);">sense resultats</em>' : dels.map(([did, r]) => `
                            <div style="border-top:1px solid var(--border-default);padding:6px 0;font-size:11px;">
                                <strong style="color:${r.error ? '#ef4444' : '#22c55e'};">${r.error ? '✗' : '✓'} ${this._esc(did)}</strong>
                                · level ${r.level} · attempts ${r.attempts || 1}
                                ${r.signature ? ' · 🔐 signed' : ''}
                                ${r.costEur ? ' · €' + r.costEur.toFixed(4) : ''}
                                ${r.error ? '<div style="color:#ef4444;font-style:italic;margin-top:3px;">' + this._esc(r.error) + '</div>' :
                                          '<pre style="white-space:pre-wrap;color:var(--text-secondary);font-size:11px;margin:4px 0 0 0;max-height:200px;overflow:auto;">' + this._esc((r.output || '').slice(0, 800)) + '</pre>'}
                            </div>
                        `).join('')}
                    </div>
                </details>`;
            }).join('');

        return `
        <style>
            .sw-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); }
            .sw-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-wrap:wrap; }
            .sw-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .sw-logo span { color:var(--accent-indigo); }
            .sw-main { max-width:1100px; margin:0 auto; padding:1.5rem; }
            .sw-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:0.8rem 1rem; margin-bottom:0.8rem; }
            .sw-btn { padding:8px 14px; border-radius:4px; border:1px solid var(--accent-indigo); background:var(--accent-indigo); color:#fff; font-size:0.82rem; font-weight:600; cursor:pointer; }
            .sw-btn:disabled { opacity:0.5; cursor:not-allowed; }
            .sw-btn-run { background:#22c55e; border-color:#22c55e; }
            .sw-runlog { margin-top:8px; font-family:var(--font-mono); font-size:11px; line-height:1.6; }
            .sw-runlog-entry { padding:3px 8px; border-left:3px solid var(--border-default); background:#0006; margin-bottom:2px; }
            .sw-runlog-entry.ok { border-left-color:#22c55e; color:#22c55e; }
            .sw-runlog-entry.err { border-left-color:#ef4444; color:#ef4444; }
            .sw-runlog-entry.level { border-left-color:var(--accent-indigo); color:var(--accent-indigo); font-weight:700; }
            details.sw-run-row { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:6px; padding:8px 12px; margin-bottom:6px; }
            details.sw-run-row summary { cursor:pointer; font-size:0.85rem; list-style:none; }
            details.sw-run-row summary::-webkit-details-marker { display:none; }
        </style>
        <div class="sw-shell">
            <div class="sw-topbar">
                <a href="/dashboard" data-link class="sw-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Swarm · paral·lel flows</span>
                <span style="flex:1;"></span>
                <a href="/lifecycle?project=${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">🌀 Lifecycle</a>
                <a href="/project/${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">← Hub</a>
            </div>
            <div class="sw-main">
                <h1 style="margin:0 0 0.4rem 0;font-size:1.35rem;">🌪 ${this._esc(projName)} · Swarm flows</h1>
                <p style="color:var(--text-secondary);font-size:0.85rem;margin:0 0 1rem 0;">DAG executor paral·lel · cada level corre amb <code>Promise.all</code> · transaction outputs es passen com a context al downstream. Pillar Antigravity capstone.</p>

                <h3 style="margin:1.2rem 0 0.6rem 0;">🧬 Value Flows · ${this.flows.length}</h3>
                ${flowsHtml}

                <h3 style="margin:1.5rem 0 0.6rem 0;">📜 Darreres execucions · ${this.runs.length} total · top 5</h3>
                ${runsHtml}
            </div>
        </div>`;
    }

    _bindCreateDemo() {
        const btn = document.getElementById('swCreateDemo');
        if (!btn) return;
        btn.addEventListener('click', async () => {
            try {
                let f = buildEmptyValueFlow({ projectId: this.projectId, title: 'Demo · architect → coder + reviewer' });
                f = addRole(f, { id: 'r-arch',     kind: 'architect', label: 'Arquitecte' });
                f = addRole(f, { id: 'r-coder',    kind: 'coder',     label: 'Coder' });
                f = addRole(f, { id: 'r-reviewer', kind: 'reviewer',  label: 'Reviewer' });
                f = addDeliverable(f, { id: 'd-plan',   producer: 'r-arch',     consumers: ['r-coder'], description: 'Pla tècnic detallat amb steps, riscos i contractes entre components.' });
                f = addDeliverable(f, { id: 'd-code',   producer: 'r-coder',    consumers: ['r-reviewer'], description: 'Implementació seguint el pla rebut.' });
                f = addDeliverable(f, { id: 'd-review', producer: 'r-reviewer', consumers: [], description: 'Code review · 3-5 bullet points · issues + millores.' });
                f = addTransaction(f, { id: 'tx1', from: 'r-arch',  to: 'r-coder',    deliverable: 'd-plan' });
                f = addTransaction(f, { id: 'tx2', from: 'r-coder', to: 'r-reviewer', deliverable: 'd-code' });
                await KB.upsert(f);
                window.location.reload();
            } catch (e) {
                alert('Error · ' + (e?.message || 'creant flow demo'));
            }
        });
    }

    _bindRunButtons() {
        document.querySelectorAll('[data-run]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const flowId = btn.dataset.run;
                const flow = this.flows.find(f => f.id === flowId);
                if (!flow) return;
                const logEl = document.querySelector('[data-runlog="' + flowId + '"]');
                btn.disabled = true;
                const origTxt = btn.textContent;
                btn.textContent = '⏳ executant…';
                if (logEl) logEl.innerHTML = '';

                const appendLog = (text, kind = '') => {
                    if (!logEl) return;
                    const div = document.createElement('div');
                    div.className = 'sw-runlog-entry ' + kind;
                    div.textContent = text;
                    logEl.appendChild(div);
                };

                try {
                    const { runEscalation } = await import('../core/aiRouterService.js');
                    const result = await runValueFlow({
                        flow,
                        runner: async ({ prompt, deliverable }) => {
                            try {
                                const r = await runEscalation({ prompt, taskKind: 'creative-narrative', maxAttempts: 2 });
                                const output = r?.output || r?.text || r?.result || '';
                                const costEur = (r?.usage && typeof r.usage.estimatedCostEur === 'number') ? r.usage.estimatedCostEur : 0;
                                return { output, costEur, modelKey: r?.modelKey || null, usage: r?.usage };
                            } catch (e) {
                                throw new Error('runner-fail · ' + (e?.message || 'unknown'));
                            }
                        },
                        budgetEur:         2,
                        maxRetriesPerDel:  1,
                        onLevelStart:      ({ levelIndex, deliverableIds }) => {
                            appendLog('▶ Level ' + levelIndex + ' · ' + deliverableIds.join(' + '), 'level');
                        },
                        onDeliverableDone: ({ id, status, costEur }) => {
                            appendLog((status === 'ok' ? '✓' : '✗') + ' ' + id + (typeof costEur === 'number' ? ' · €' + costEur.toFixed(4) : ''), status === 'ok' ? 'ok' : 'err');
                        },
                    });
                    appendLog(result.ok ? '🎉 FET · ' + result.levelsExecuted + ' levels · €' + result.totalCostEur.toFixed(4) + ' · ' + result.durationMs + 'ms' : '⚠ AMB ERRORS · ' + result.errors.length, result.ok ? 'ok' : 'err');
                    const runNode = buildSwarmRunNode({ result, flowId, projectId: this.projectId });
                    await KB.upsert(runNode);
                    setTimeout(() => window.location.reload(), 1200);
                } catch (e) {
                    appendLog('💥 ' + (e?.message || 'error'), 'err');
                } finally {
                    btn.disabled = false;
                    btn.textContent = origTxt;
                }
            });
        });
    }

    _esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
