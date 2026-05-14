// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT CANVAS VIEW (CANVAS-WIZARD sprint A)
// Ruta · /js/views/ProjectCanvasView.js  →  /canvas?project={id}
//
// Wizard 5-passes (vision · mission · values · stakeholders · north-star) que
// guia el fundador per definir el projecte ABANS d'engegar pitch · tokenomics
// · accounting · etc. Per cada step:
//   - textarea editable amb validation min/max
//   - botó "🤖 IA draft" · invoca runEscalation amb prompt construit per
//     buildAiPromptForStep · seed + previousSteps com a context
//   - botó "✓ Validar" · persisteix step al project.content.canvas via KB
// Header · progress bar (filled / 5)
// Footer · CTA next-best-action quan 100% (pitch · tokenomics · kanban).
// =============================================================================

import { KB } from '../core/kb.js';
import {
    CANVAS_STEPS,
    buildEmptyCanvas,
    validateCanvasStep,
    applyCanvasStep,
    computeCanvasCompletion,
    applyCanvasToProject,
    buildAiPromptForStep,
} from '../core/projectCanvasService.js';

export default class ProjectCanvasView {

    constructor() {
        document.title = 'Project Canvas · SOS V11';
        try {
            const u = new URL(window.location.href);
            this.projectId = u.searchParams.get('project') || null;
        } catch (_) { this.projectId = null; }
        this.project = null;
        this.canvas  = null;
    }

    async getHtml() {
        if (!this.projectId) {
            return this._htmlNoProject();
        }
        try {
            this.project = await KB.getNode(this.projectId);
        } catch (_) { this.project = null; }
        if (!this.project) {
            return this._htmlNotFound();
        }
        this.canvas = this.project.content?.canvas || buildEmptyCanvas();
        return this._htmlMain();
    }

    async afterRender() {
        if (!this.project) return;
        this._bindSteps();
        this._bindBack();
    }

    _htmlNoProject() {
        return `
        <style>
            .cv-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); padding:2rem; }
            .cv-empty { max-width:600px; margin:4rem auto; text-align:center; background:var(--bg-panel); padding:2rem; border-radius:8px; border:1px solid var(--border-default); }
            .cv-empty a { color:var(--accent-indigo); text-decoration:none; font-weight:600; }
        </style>
        <div class="cv-shell">
            <div class="cv-empty">
                <h1 style="margin-top:0;">🎨 Project Canvas Wizard</h1>
                <p>Aquest wizard defineix vision · mission · values · stakeholders · north-star del teu projecte.</p>
                <p style="color:var(--text-muted);">Cal indicar quin projecte vols editar · <code>?project=&lt;projectId&gt;</code>.</p>
                <p style="margin-top:1.5rem;"><a href="/dashboard" data-link>← Tornar al dashboard</a></p>
            </div>
        </div>`;
    }

    _htmlNotFound() {
        return `
        <style>
            .cv-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); padding:2rem; }
            .cv-empty { max-width:600px; margin:4rem auto; text-align:center; background:var(--bg-panel); padding:2rem; border-radius:8px; border:1px solid var(--border-default); }
        </style>
        <div class="cv-shell">
            <div class="cv-empty">
                <h1 style="margin-top:0;">⚠ Projecte no trobat</h1>
                <p>No s'ha trobat cap projecte amb id <code>${this._esc(this.projectId)}</code>.</p>
                <p style="margin-top:1.5rem;"><a href="/dashboard" data-link style="color:var(--accent-indigo);">← Tornar al dashboard</a></p>
            </div>
        </div>`;
    }

    _htmlMain() {
        const completion = computeCanvasCompletion(this.canvas);
        const projName = this.project.nombre || this.project.name || this.project.id;

        const stepCards = CANVAS_STEPS.map(s => {
            const state = this.canvas.steps[s.id] || { value: '', updatedAt: null };
            const validation = validateCanvasStep(s.id, state.value);
            const isOk = validation.ok;
            const badge = isOk
                ? '<span style="color:#22c55e;font-weight:700;font-size:11px;">✓ omplert</span>'
                : '<span style="color:var(--text-muted);font-size:11px;">— pendent</span>';
            return `
                <div class="cv-card" data-step="${s.id}">
                    <div class="cv-card-head">
                        <span class="cv-card-num">${CANVAS_STEPS.indexOf(s) + 1}</span>
                        <div style="flex:1;min-width:0;">
                            <div class="cv-card-title">${this._esc(s.label)}</div>
                            <div class="cv-card-prompt">${this._esc(s.prompt)}</div>
                        </div>
                        <div>${badge}</div>
                    </div>
                    <textarea class="cv-textarea" data-step-input="${s.id}" rows="4" placeholder="Min ${s.minLength} · max ${s.maxLength} caràcters · escriu o pulsa 🤖 per a draft IA…">${this._esc(state.value)}</textarea>
                    <div class="cv-card-actions">
                        <button class="cv-btn cv-btn-ai" data-step-ai="${s.id}" title="Genera draft amb IA failover">🤖 IA draft</button>
                        <button class="cv-btn cv-btn-save" data-step-save="${s.id}">✓ Validar &amp; desar</button>
                        <span class="cv-step-msg" data-step-msg="${s.id}"></span>
                    </div>
                </div>
            `;
        }).join('');

        const nextActions = completion.percent === 100 ? `
            <div class="cv-next">
                <h3 style="margin:0 0 8px 0;">🚀 Canvas complet · següents passes</h3>
                <a href="/project/${encodeURIComponent(this.projectId)}" data-link class="cv-cta">📋 Hub del projecte</a>
                <a href="/kanban?project=${encodeURIComponent(this.projectId)}" data-link class="cv-cta">📊 Kanban work-orders</a>
                <a href="/pact?project=${encodeURIComponent(this.projectId)}" data-link class="cv-cta">🤝 Pactes</a>
                <a href="/quality?project=${encodeURIComponent(this.projectId)}" data-link class="cv-cta">🎯 Quality score</a>
            </div>
        ` : '';

        return `
        <style>
            .cv-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); }
            .cv-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-wrap:wrap; }
            .cv-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .cv-logo span { color:var(--accent-indigo); }
            .cv-back { color:var(--text-secondary); text-decoration:none; font-size:0.78rem; padding:6px 10px; border-radius:4px; }
            .cv-back:hover { color:var(--text-main); background:var(--glass-hover); }
            .cv-main { max-width:900px; margin:0 auto; padding:1.5rem; }
            .cv-header { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem 1.2rem; margin-bottom:1.2rem; }
            .cv-progress { height:8px; background:#0008; border-radius:4px; overflow:hidden; margin-top:0.6rem; }
            .cv-progress-fill { height:100%; background:linear-gradient(90deg,#6366f1,#22c55e); transition:width 0.4s ease; }
            .cv-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem 1.2rem; margin-bottom:1rem; }
            .cv-card-head { display:flex; align-items:flex-start; gap:12px; margin-bottom:10px; }
            .cv-card-num { width:32px; height:32px; border-radius:50%; background:var(--accent-indigo); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-family:var(--font-mono); flex-shrink:0; }
            .cv-card-title { font-weight:700; font-size:0.95rem; margin-bottom:2px; }
            .cv-card-prompt { font-size:0.78rem; color:var(--text-secondary); line-height:1.45; }
            .cv-textarea { width:100%; box-sizing:border-box; background:#000; color:var(--text-main); border:1px solid var(--border-default); border-radius:4px; padding:8px 10px; font-family:var(--font-base); font-size:0.85rem; line-height:1.5; resize:vertical; }
            .cv-textarea:focus { outline:2px solid var(--accent-indigo); outline-offset:1px; }
            .cv-card-actions { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:8px; }
            .cv-btn { padding:6px 12px; border-radius:4px; border:1px solid var(--border-default); background:var(--bg-dark); color:var(--text-main); font-size:0.78rem; font-weight:600; cursor:pointer; transition:all 0.15s; }
            .cv-btn:hover { background:var(--glass-hover); }
            .cv-btn:disabled { opacity:0.5; cursor:wait; }
            .cv-btn-ai { background:#6366f1; color:#fff; border-color:#6366f1; }
            .cv-btn-save { background:#22c55e; color:#fff; border-color:#22c55e; }
            .cv-step-msg { font-size:11px; color:var(--text-muted); font-family:var(--font-mono); }
            .cv-step-msg.ok { color:#22c55e; }
            .cv-step-msg.err { color:#ef4444; }
            .cv-next { background:linear-gradient(135deg,#6366f120,#22c55e20); border:1px solid #22c55e50; border-radius:8px; padding:1rem 1.2rem; margin-top:1rem; }
            .cv-cta { display:inline-block; margin:4px 6px 4px 0; padding:8px 14px; background:var(--bg-panel); color:var(--text-main); text-decoration:none; border-radius:4px; font-size:0.82rem; font-weight:600; border:1px solid var(--border-default); }
            .cv-cta:hover { background:var(--glass-hover); }
        </style>
        <div class="cv-shell">
            <div class="cv-topbar">
                <a href="/dashboard" data-link class="cv-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Canvas Wizard</span>
                <span style="flex:1;"></span>
                <a href="/project/${encodeURIComponent(this.projectId)}" data-link class="cv-back">← Hub del projecte</a>
            </div>
            <div class="cv-main">
                <div class="cv-header">
                    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;align-items:baseline;">
                        <h1 style="margin:0;font-size:1.35rem;">🎨 ${this._esc(projName)}</h1>
                        <div style="font-family:var(--font-mono);font-size:0.85rem;color:var(--text-secondary);">${completion.filled} / ${completion.total} steps · <strong style="color:var(--text-main);">${completion.percent}%</strong></div>
                    </div>
                    <div class="cv-progress"><div class="cv-progress-fill" style="width:${completion.percent}%;"></div></div>
                    <div style="margin-top:8px;font-size:0.78rem;color:var(--text-muted);line-height:1.5;">Defineix els 5 pilars del projecte abans d'engegar pitch · tokenomics · accounting. La IA pot generar drafts (failover chain) · tu valides.</div>
                </div>

                ${stepCards}

                ${nextActions}
            </div>
        </div>`;
    }

    _bindBack() {
        // data-link gestionat pel router · sense feina aquí
    }

    _bindSteps() {
        for (const step of CANVAS_STEPS) {
            const sid = step.id;
            const ta  = document.querySelector('[data-step-input="' + sid + '"]');
            const saveBtn = document.querySelector('[data-step-save="' + sid + '"]');
            const aiBtn   = document.querySelector('[data-step-ai="' + sid + '"]');
            const msg     = document.querySelector('[data-step-msg="' + sid + '"]');

            if (saveBtn) saveBtn.addEventListener('click', async () => {
                if (!ta) return;
                const val = ta.value || '';
                try {
                    const next = applyCanvasStep(this.canvas, sid, val);
                    this.canvas = next;
                    const updatedProject = applyCanvasToProject(this.project, next);
                    await KB.upsert(updatedProject);
                    this.project = updatedProject;
                    if (msg) { msg.textContent = '✓ desat'; msg.className = 'cv-step-msg ok'; }
                    // Re-render lleuger · actualitzem progress sense innerHTML total
                    this._refreshProgress();
                } catch (e) {
                    if (msg) { msg.textContent = '✗ ' + (e.reason || e.message); msg.className = 'cv-step-msg err'; }
                }
            });

            if (aiBtn) aiBtn.addEventListener('click', async () => {
                if (!ta) return;
                aiBtn.disabled = true;
                const origText = aiBtn.textContent;
                aiBtn.textContent = '⏳ generant…';
                if (msg) { msg.textContent = ''; msg.className = 'cv-step-msg'; }
                try {
                    const { runEscalation } = await import('../core/aiRouterService.js');
                    const prompt = buildAiPromptForStep(sid, {
                        projectName:   this.project.nombre || this.project.name,
                        sector:        this.project.sector_id,
                        description:   this.project.description,
                        previousSteps: this.canvas.steps,
                    });
                    const result = await runEscalation({
                        prompt,
                        taskKind:      'creative-narrative',
                        maxAttempts:   3,
                    });
                    const text = (result && (result.output || result.text || result.result)) || '';
                    if (text && typeof text === 'string') {
                        ta.value = text.trim().slice(0, step.maxLength);
                        if (msg) { msg.textContent = '🤖 draft · revisa i valida'; msg.className = 'cv-step-msg ok'; }
                    } else {
                        if (msg) { msg.textContent = '✗ IA buida'; msg.className = 'cv-step-msg err'; }
                    }
                } catch (e) {
                    console.warn('[canvas] IA failover failed', e);
                    if (msg) { msg.textContent = '✗ IA · ' + (e?.message || 'error'); msg.className = 'cv-step-msg err'; }
                } finally {
                    aiBtn.disabled = false;
                    aiBtn.textContent = origText;
                }
            });
        }
    }

    _refreshProgress() {
        const completion = computeCanvasCompletion(this.canvas);
        const fill = document.querySelector('.cv-progress-fill');
        if (fill) fill.style.width = completion.percent + '%';
        const head = document.querySelector('.cv-header');
        if (head) {
            const meter = head.querySelector('div[style*="font-mono"]');
            if (meter) meter.innerHTML = completion.filled + ' / ' + completion.total + ' steps · <strong style="color:var(--text-main);">' + completion.percent + '%</strong>';
        }
    }

    _esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
