// =============================================================================
// TEAMTOWERS SOS V11 — IMPROVEMENT LOOP VIEW (IMPROVEMENT-LOOP sprint A)
// Ruta · /js/views/ImprovementLoopView.js  →  /improve?project={id}
//
// Kanban de millora contínua · 3 columnes (SOPs · Cycles en curs · Enrichments) ·
// botó '▶ Run next cycle' agafa pròxim SOP (segons pickNextSOP) i executa
// runImprovementCycle amb runEscalation default. Persisteix improvement_cycle
// + updatedProject. Live log + estadístiques (iterations · enrichments · score).
// =============================================================================

import { KB } from '../core/kb.js';
import { findProjectByIdAny } from '../core/projectLookup.js';
import { store } from '../core/store.js';
import {
    IMPROVEMENT_CYCLE_TYPE, IMPROVEMENT_MODEL_TYPE, FOCUS_AREAS,
    defineImprovementModel,
    pickNextSOP,
    runImprovementCycle, runImprovementLoop,
} from '../core/improvementLoopService.js';
import { attachAIFormFeedback, renderInlineFeedbackHtml } from '../core/aiFormFeedback.js';
import { label } from '../core/sosCopy.js';

export default class ImprovementLoopView {

    constructor() {
        document.title = 'Improvement Loop · SOS V11';
        try {
            const u = new URL(window.location.href);
            this.projectId = u.searchParams.get('project') || null;
        } catch (_) { this.projectId = null; }
        this.project = null;
        this.sops    = [];
        this.cycles  = [];
        this.model   = null;
    }

    async getHtml() {
        if (!this.projectId) return this._htmlNoProject();
        try { this.project = await findProjectByIdAny(this.projectId); } catch (_) { this.project = null; }
        if (!this.project) return this._htmlNotFound();
        try { this.sops    = await KB.query({ type: 'sop',                    projectId: this.projectId }) || []; } catch (_) { this.sops = []; }
        try { this.cycles  = await KB.query({ type: IMPROVEMENT_CYCLE_TYPE,   projectId: this.projectId }) || []; } catch (_) { this.cycles = []; }
        try {
            const models = await KB.query({ type: IMPROVEMENT_MODEL_TYPE, projectId: this.projectId }) || [];
            this.model = models.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0] || null;
        } catch (_) { this.model = null; }
        return this._htmlMain();
    }

    async afterRender() {
        if (!this.project) return;
        this._bindRunNext();
        this._bindRunLoop();
        this._bindModelEnsure();
    }

    _htmlNoProject() {
        return `<div style="min-height:100dvh;background:var(--bg-dark);color:var(--text-main);font-family:var(--font-base);padding:2rem;">
            <div style="max-width:600px;margin:4rem auto;text-align:center;background:var(--bg-panel);padding:2rem;border-radius:8px;border:1px solid var(--border-default);">
                <h1>🔁 Improvement Loop</h1><p>Cal indicar projecte.</p>
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
        const sortedCycles = this.cycles.slice().sort((a, b) => (b.content?.iteration || 0) - (a.content?.iteration || 0));
        const lastIter = sortedCycles.length ? (sortedCycles[0].content?.iteration || 0) : 0;
        const totalEnr = sortedCycles.reduce((s, c) => s + ((c.content?.enrichments || []).length), 0);
        const avgScore = sortedCycles.length
            ? (sortedCycles.reduce((s, c) => s + (c.content?.score || 0), 0) / sortedCycles.length)
            : 0;

        // Column 1 · SOPs disponibles (next + already used)
        const usedIds = new Set(this.cycles.map(c => c.content?.sourceSopId).filter(Boolean));
        const sopsHtml = this.sops.length === 0
            ? '<div class="il-empty">Cap SOP encara. Crea\'n des de /kanban o /sops.</div>'
            : this.sops.map(s => {
                const c = s.content || {};
                const used = usedIds.has(s.id);
                return `<div class="il-card ${used ? 'il-card-used' : ''}">
                    <div class="il-card-title">${used ? '✓ ' : '📋 '}${this._esc(c.title || s.id)}</div>
                    <div class="il-card-meta">${this._esc(c.roleId || '')} · ${used ? 'executat' : 'pendent'}</div>
                </div>`;
            }).join('');

        // Column 2 · Latest cycles (running/recent)
        const recentCycles = sortedCycles.slice(0, 5);
        const cyclesHtml = recentCycles.length === 0
            ? '<div class="il-empty">Cap cicle encara · prem "▶ Run next" per començar.</div>'
            : recentCycles.map(c => {
                const cc = c.content || {};
                const statusColor = cc.status === 'completed' ? '#22c55e' : (cc.status === 'failed' ? '#ef4444' : '#facc15');
                const enr = cc.enrichments || [];
                return `<div class="il-card" style="border-left:3px solid ${statusColor};">
                    <div class="il-card-title">Iter ${cc.iteration} · ${this._esc(cc.sourceSopId || '?')}</div>
                    <div class="il-card-meta">
                        <span style="color:${statusColor};font-weight:700;">${this._esc(cc.status)}</span>
                        · score <strong>${cc.score || 0}/100</strong>
                        · ${enr.length} enrichments
                    </div>
                    ${cc.deliverableOutput ? `<div class="il-card-preview">${this._esc(String(cc.deliverableOutput).slice(0, 220))}…</div>` : ''}
                    ${enr.length ? `<div class="il-enrich-chips">${enr.slice(0, 5).map(e => `<span class="il-chip" title="${this._esc(e.reason || '')}">${this._esc(e.kind)}${e.payload ? ' · ' + this._esc(String(e.payload).slice(0, 20)) : ''}</span>`).join('')}</div>` : ''}
                </div>`;
            }).join('');

        // Column 3 · Enrichments aggregated (tags · suggested-next · evidence)
        const allEnrichments = sortedCycles.flatMap(c => c.content?.enrichments || []);
        const allSuggested = sortedCycles.flatMap(c => (c.content?.suggestedNext || []).map(s => ({ ...s, iter: c.content?.iteration })));
        const enrByKind = {};
        for (const e of allEnrichments) {
            if (!enrByKind[e.kind]) enrByKind[e.kind] = [];
            enrByKind[e.kind].push(e);
        }
        const enrichmentsHtml = Object.keys(enrByKind).length === 0
            ? '<div class="il-empty">Cap enrichment encara.</div>'
            : Object.entries(enrByKind).map(([kind, items]) => `<div class="il-card">
                <div class="il-card-title">${this._esc(kind)} · ${items.length}</div>
                <div class="il-enrich-chips">
                    ${items.slice(0, 8).map(e => `<span class="il-chip">${this._esc(String(e.payload || '·').slice(0, 30))}</span>`).join('')}
                </div>
            </div>`).join('')
            + (allSuggested.length ? `<div class="il-card" style="border-left:3px solid var(--accent-indigo);">
                <div class="il-card-title">🔮 Suggested next · ${allSuggested.length}</div>
                <div style="font-size:11px;color:var(--text-secondary);line-height:1.5;">
                    ${allSuggested.slice(0, 5).map(s => `• ${this._esc(s.title)} <span style="color:var(--text-muted);">(iter ${s.iter})</span>`).join('<br>')}
                </div>
            </div>` : '');

        const focusBadges = (this.model?.content?.focusAreas || FOCUS_AREAS.map(f => f.id))
            .map(fid => {
                const fa = FOCUS_AREAS.find(f => f.id === fid);
                if (!fa) return '';
                return `<span class="il-chip" title="${this._esc(fa.label)}">${this._esc(fa.id)}</span>`;
            }).join('');

        return `
        <style>
            .il-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); }
            .il-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-wrap:wrap; }
            .il-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .il-logo span { color:var(--accent-indigo); }
            .il-main { max-width:1300px; margin:0 auto; padding:1.5rem; }
            .il-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:1rem; }
            @media (max-width:680px) { .il-stats { grid-template-columns:repeat(2,1fr); } }
            .il-stat { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:6px; padding:10px; text-align:center; }
            .il-stat-num { display:block; font-size:1.5rem; font-weight:700; font-family:var(--font-mono); }
            .il-stat-lbl { display:block; font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-top:2px; }
            .il-actions { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:1rem; align-items:center; }
            .il-btn { padding:10px 18px; border-radius:4px; border:1px solid var(--accent-indigo); background:var(--accent-indigo); color:#fff; font-size:0.85rem; font-weight:700; cursor:pointer; }
            .il-btn-green { background:#22c55e; border-color:#22c55e; }
            .il-btn:disabled { opacity:0.5; cursor:wait; }
            .il-board { display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem; }
            @media (max-width:980px) { .il-board { grid-template-columns:1fr; } }
            .il-col { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem; min-height:320px; }
            .il-col h3 { margin:0 0 0.6rem 0; font-size:0.9rem; padding-bottom:6px; border-bottom:1px solid var(--border-default); }
            .il-card { background:#0006; border:1px solid var(--border-default); border-radius:5px; padding:8px 12px; margin-bottom:8px; }
            .il-card-used { opacity:0.6; }
            .il-card-title { font-weight:700; font-size:0.85rem; }
            .il-card-meta { font-size:11px; color:var(--text-muted); margin-top:3px; font-family:var(--font-mono); }
            .il-card-preview { font-size:11px; color:var(--text-secondary); margin-top:6px; line-height:1.45; font-style:italic; max-height:80px; overflow:hidden; }
            .il-empty { font-size:0.82rem; color:var(--text-muted); font-style:italic; padding:0.6rem; }
            .il-chip { display:inline-block; background:#6366f120; color:#a5b4fc; padding:2px 7px; border-radius:999px; font-size:10px; font-weight:600; font-family:var(--font-mono); margin:2px 3px 2px 0; }
            .il-enrich-chips { margin-top:6px; }
            /* DESIGN-SYSTEM v2 · feedback widget gestiona els seus propis estils */
        </style>
        <div class="il-shell">
            <div class="il-topbar">
                <a href="/dashboard" data-link class="il-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Improvement · loop continu</span>
                <span style="flex:1;"></span>
                <a href="/lifecycle?project=${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">🌀 Lifecycle</a>
                <a href="/kanban?project=${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">📊 Kanban</a>
                <a href="/swarm?project=${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">🌪 Swarm</a>
            </div>
            <div class="il-main">
                <h1 style="margin:0 0 0.4rem 0;font-size:1.35rem;">🔁 ${this._esc(projName)} · Improvement Loop</h1>
                <p style="color:var(--text-secondary);font-size:0.82rem;margin:0 0 0.6rem 0;">Bucle TDD · pickNextSOP → buildWOFromSOP (amb context dels darrers 3 deliverables) → executar amb agent (runEscalation) → analyzeDeliverable per detectar enrichments + suggested-next → aplicar mutacions al project. Cada iteració alimenta la següent · evolució continuada per model definit.</p>

                <div style="margin-bottom:1rem;font-size:11px;color:var(--text-muted);">
                    Focus areas actius · ${focusBadges}
                </div>

                <div class="il-stats">
                    <div class="il-stat"><span class="il-stat-num">${this.sops.length}</span><span class="il-stat-lbl">SOPs disponibles</span></div>
                    <div class="il-stat"><span class="il-stat-num">${lastIter}</span><span class="il-stat-lbl">Última iter</span></div>
                    <div class="il-stat" style="color:#22c55e;"><span class="il-stat-num">${totalEnr}</span><span class="il-stat-lbl">Enrichments total</span></div>
                    <div class="il-stat"><span class="il-stat-num">${avgScore.toFixed(0)}</span><span class="il-stat-lbl">Score promig</span></div>
                </div>

                <div class="il-actions">
                    <button class="il-btn il-btn-green" id="ilRunNext" ${this.sops.length === 0 ? 'disabled' : ''}>▶ Run next cycle (1)</button>
                    <button class="il-btn" id="ilRunLoop3" ${this.sops.length === 0 ? 'disabled' : ''}>▶▶ Run loop ×3</button>
                    <button class="il-btn" id="ilRunLoop5" ${this.sops.length === 0 ? 'disabled' : ''}>▶▶▶ Run loop ×5</button>
                    <span style="font-size:11px;color:var(--text-muted);margin-left:10px;">Cada cicle costa ~€0.01-0.05 · cap si IA off-line</span>
                </div>

                ${renderInlineFeedbackHtml({ id: 'ilFeedback' })}

                <div class="il-board">
                    <div class="il-col">
                        <h3>📋 SOPs · ${this.sops.length}</h3>
                        ${sopsHtml}
                    </div>
                    <div class="il-col">
                        <h3>🛠 Cicles recents · ${this.cycles.length}</h3>
                        ${cyclesHtml}
                    </div>
                    <div class="il-col">
                        <h3>🌱 Enrichments + suggestions</h3>
                        ${enrichmentsHtml}
                    </div>
                </div>

                <div style="margin-top:1.2rem;font-size:11px;color:var(--text-muted);line-height:1.5;background:var(--bg-panel);padding:0.8rem;border-radius:6px;border:1px solid var(--border-default);">
                    💡 Aquest kanban és <strong>automatitzable</strong> · prem "Run loop ×N" per a múltiples iteracions seqüencials · cada deliverable alimenta el següent (darrers 3 al context). Defineix focusAreas custom al model per a iterar verticalment sobre un pillar concret.
                </div>
            </div>
        </div>`;
    }

    async _bindModelEnsure() {
        if (this.model) return;
        // Auto-crear default model si no existeix · transparent per a l'usuari
        try {
            this.model = defineImprovementModel({ projectId: this.projectId });
            await KB.upsert(this.model);
        } catch (e) { console.warn('[improve] model ensure failed', e); }
    }

    _bindRunNext() {
        const btn = document.getElementById('ilRunNext');
        if (!btn) return;
        btn.addEventListener('click', () => this._runN(1));
    }

    _bindRunLoop() {
        const b3 = document.getElementById('ilRunLoop3');
        if (b3) b3.addEventListener('click', () => this._runN(3));
        const b5 = document.getElementById('ilRunLoop5');
        if (b5) b5.addEventListener('click', () => this._runN(5));
    }

    async _runN(n) {
        if (!this.sops.length) return;
        // DESIGN-SYSTEM v2 · aiFormFeedback widget (DRY · 1 controller fa tot)
        const fb = attachAIFormFeedback(document.getElementById('ilFeedback'), { autoFadeOk: 0 });

        try {
            // Assegura model
            if (!this.model) {
                this.model = defineImprovementModel({ projectId: this.projectId });
                await KB.upsert(this.model);
            }
            // Build runner · runEscalation
            const { runPrompt } = await import('../core/aiRouterService.js');
            const aiRunner = async ({ prompt }) => {
                try {
                    const r = await runPrompt({ prompt, taskKind: 'creative-narrative', maxAttempts: 2 });
                    const output = r?.output || r?.text || r?.result || '';
                    const costEur = (r?.usage && typeof r.usage.estimatedCostEur === 'number') ? r.usage.estimatedCostEur : 0;
                    return { output, costEur, modelKey: r?.modelKey || null };
                } catch (e) { throw new Error('ai-fail · ' + (e?.message || 'unknown')); }
            };

            fb.addEvent({ kind: 'message', icon: '▶', title: label('cta.start') + ' · ' + n + ' cicle(s)', detail: 'model · ' + this.model.id, level: 'info' });

            const result = await runImprovementLoop({
                project:       this.project,
                sops:          this.sops,
                model:         this.model,
                runner:        aiRunner,
                maxIterations: n,
                onActivity:    fb.onActivity(),     // widget gestiona thinking + log auto
                onIteration:   () => {},
            });

            // Persisteix
            for (const c of result.cycles) {
                try { await KB.upsert(c); } catch (e) { console.warn('cycle upsert fail', e); }
            }
            if (result.finalProject && result.finalProject !== this.project) {
                try {
                    await store.dispatch({ type: 'UPDATE_PROJECT', payload: result.finalProject });
                } catch (_) {
                    try { await KB.upsert(result.finalProject); } catch (e) { console.warn('project update fail', e); }
                }
            }

            if (result.ok) fb.setOk(label('state.done') + ' · ' + result.cycles.length + ' cicles');
            else           fb.setWarning('Cicles amb errors · revisa el log');

            setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
            fb.setError(e?.message || label('state.error'));
        }
    }

    _esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
