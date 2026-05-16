// =============================================================================
// TEAMTOWERS SOS V11 — PROMPTS DEBUG VIEW (PROMPT-VIEWER sprint · @alvaro)
// Ruta · /js/views/PromptsDebugView.js  →  /prompts-debug
//
// Vista de transparència total · mostra els prompts EXACTES que la IA reb
// per cada task del flow de creació. L'usuari pot ·
//   - Veure system message · few-shot · user prompt complets
//   - Modificar context (sector · lifecycle · entity · vna_zoom · descripció)
//     per veure com canvia el prompt
//   - Copiar al clipboard per a polir externament
//   - Estimar tokens per task
//
// Pure read-only (no escriu res) · safe a producció.
// =============================================================================

import { TASK_KINDS, SYSTEM_BASE, FEW_SHOT_EXAMPLES, buildPrompt, listTasks, flattenPrompt } from '../core/vnaExpertPrompts.js';
import { CNAE_SECTORS, renderCnaeOptionsHtml, getCnae } from '../core/cnaeCatalog.js';
import { SECTOR_ROLES } from '../core/sectorRoleCatalog.js';

const TPL_VERSION = 'prompts-debug-v1';

const DEFAULT_CTX = Object.freeze({
    name:           'Cooperativa Cures Vall d\'Aro',
    description:    'Cooperativa d\'iniciativa social que ofereix serveis de cura a domicili per a gent gran al Baix Empordà · 12 sòcies treballadores · model SCCL · cicle MVP',
    sector:         'Q',
    lifecycle_stage:'mvp',
    entity_type:    'organization',
    vna_zoom:       'mid',
    project_type:   'founder-coop-tradicional',
    templateId:     'founder-coop-tradicional',
});

export default class PromptsDebugView {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Prompts debug · SOS';
        this._ctx = { ...DEFAULT_CTX };
        this._activeTask = 'classify-and-pick-socs';
    }

    async getHtml() {
        return this._renderShell();
    }

    async afterRender() {
        this._bind();
        this._renderPromptPanel();
    }

    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    _bind() {
        document.querySelectorAll('[data-task]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this._activeTask = e.currentTarget.dataset.task;
                document.querySelectorAll('[data-task]').forEach(b => b.classList.toggle('active', b === e.currentTarget));
                this._renderPromptPanel();
            });
        });
        document.querySelectorAll('[data-ctx]').forEach(el => {
            el.addEventListener('change', (e) => {
                this._ctx[e.currentTarget.dataset.ctx] = e.currentTarget.value;
                this._renderPromptPanel();
            });
            el.addEventListener('input', (e) => {
                if (e.currentTarget.tagName === 'TEXTAREA') {
                    this._ctx[e.currentTarget.dataset.ctx] = e.currentTarget.value;
                    this._renderPromptPanel();
                }
            });
        });
        document.getElementById('pdResetCtx')?.addEventListener('click', () => {
            this._ctx = { ...DEFAULT_CTX };
            this.render();
        });
    }

    _buildContext() {
        // Build per-task context · cada task necessita inputs diferents
        const c = this._ctx;
        const ctx = {
            name: c.name,
            description: c.description,
            sector: c.sector,
            entity_type: c.entity_type,
            project_type: c.project_type,
            lifecycle_stage: c.lifecycle_stage,
            vna_zoom: c.vna_zoom,
        };
        if (this._activeTask === 'classify-and-pick-socs') {
            ctx.candidates = [
                { relpath: 'socs/sectors/' + (c.sector || 'M') + '.md', title: 'Sector ' + (c.sector || 'M'), sector_cnae: c.sector, score: 100, reasons: ['sector exact'] },
                { relpath: 'socs/lifecycle/' + (c.lifecycle_stage || 'mvp') + '.md', title: 'Fase ' + (c.lifecycle_stage || 'mvp'), phase: c.lifecycle_stage, score: 90, reasons: ['lifecycle match'] },
                { relpath: 'socs/la-colla.md', title: 'La Colla · VNA', sos_context: 'critical', score: 80, reasons: ['TT critical'] },
            ];
        } else if (this._activeTask === 'generate-sops-from-soc') {
            ctx.soc = { title: 'La Colla · procés VNA', purpose: 'Consultoria multi-sessió Verna Allee', excerpt: 'Mapatge xarxa de valor del client...' };
            ctx.project_ctx = { name: c.name, description: c.description, sector: c.sector, lifecycle_stage: c.lifecycle_stage, entity_type: c.entity_type };
            ctx.role_kinds = ['founder', 'operations', 'creator', 'reviewer', 'facilitator'];
            const sectorTable = SECTOR_ROLES[String(c.sector || '').toUpperCase()] || SECTOR_ROLES.DEFAULT;
            ctx.sector_role_examples = Object.entries(sectorTable).slice(0, 5).map(([k, v]) => ({ kind: k, name: v.name, description: v.description }));
        } else if (this._activeTask === 'generate-wos-from-sop') {
            ctx.sop = {
                id: 'sop-x', title: 'Facilitar sessió Verna Allee 2h amb client',
                role_ref: 'operations',
                steps: [
                    { id: 's1', label: 'Preparar agenda', deliverable_kind: 'doc', approval_rule: 'manual' },
                    { id: 's2', label: 'Facilitar sessió', deliverable_kind: 'workshop', approval_rule: 'manual' },
                    { id: 's3', label: 'Enviar acta', deliverable_kind: 'comm', approval_rule: 'tdd' },
                ],
            };
            ctx.project_ctx = { name: c.name, description: c.description, sector: c.sector, lifecycle_stage: c.lifecycle_stage, entity_type: c.entity_type };
        } else if (this._activeTask === 'enrich-value-map') {
            ctx.currentTemplate = { roles: [{ id: 'r1', kind: 'founder', name: 'Founder' }], transactions: [], deliverables: [], sops: [] };
        } else if (this._activeTask === 'personalize-canvas' || this._activeTask === 'personalize-pitch') {
            // no extra
        } else if (this._activeTask === 'expand-sop') {
            ctx.roleName = 'Operations'; ctx.sopTitle = 'SOP de ' + c.sector; ctx.deliverable = 'Acta sessió';
        } else if (this._activeTask === 'generate-soc') {
            ctx.sops = [{ id: 'sop-1', role_ref: 'founder', title: 'SOP founder' }];
        }
        return ctx;
    }

    _renderPromptPanel() {
        const panel = document.getElementById('pdPanel');
        if (!panel) return;
        let prompt;
        try {
            prompt = buildPrompt({
                templateId: this._ctx.templateId,
                taskKind: this._activeTask,
                context: this._buildContext(),
            });
        } catch (e) {
            panel.innerHTML = '<div class="pd-err">Error · ' + this._esc(e?.message || String(e)) + '</div>';
            return;
        }

        const flatLen = flattenPrompt(prompt).length;
        const fewShotHtml = (prompt.fewShot || []).map(m => `
            <div class="pd-msg pd-msg-${m.role}">
                <div class="pd-msg-role">[${m.role.toUpperCase()}]</div>
                <pre class="pd-msg-body">${this._esc(m.content)}</pre>
            </div>`).join('');

        panel.innerHTML = `
            <div class="pd-stats">
                <span class="pd-stat-pill">📊 ~${prompt.approxTokens} tokens</span>
                <span class="pd-stat-pill">📏 ${flatLen.toLocaleString()} chars (flat)</span>
                <span class="pd-stat-pill">⚙ task · <strong>${this._esc(this._activeTask)}</strong></span>
                <button class="pd-copy-btn" data-copy-target="pdFlat">📋 Copia tot el prompt</button>
            </div>

            <div class="pd-section">
                <h3>📜 SYSTEM (manifest Agent SOS V11)</h3>
                <pre class="pd-msg-body pd-system">${this._esc(prompt.system)}</pre>
            </div>

            ${fewShotHtml ? `<div class="pd-section">
                <h3>🎓 FEW-SHOT EXAMPLES (template · ${this._esc(this._ctx.templateId || 'none')})</h3>
                ${fewShotHtml}
            </div>` : ''}

            <div class="pd-section">
                <h3>📨 USER (task-specific prompt amb el teu context)</h3>
                <pre class="pd-msg-body pd-user">${this._esc(prompt.user)}</pre>
            </div>

            <textarea id="pdFlat" style="position:absolute;left:-9999px;">${this._esc(flattenPrompt(prompt))}</textarea>
        `;

        // Bind copy button
        panel.querySelector('[data-copy-target]')?.addEventListener('click', (e) => {
            const target = document.getElementById(e.currentTarget.dataset.copyTarget);
            if (!target) return;
            target.select();
            try {
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(target.value).then(() => {
                        e.currentTarget.textContent = '✓ Copiat!';
                        setTimeout(() => { e.currentTarget.textContent = '📋 Copia tot el prompt'; }, 1500);
                    });
                } else {
                    document.execCommand('copy');
                    e.currentTarget.textContent = '✓ Copiat!';
                }
            } catch (_) {}
        });
    }

    _renderShell() {
        const tasks = listTasks();
        return `
        <style>
            .pd-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); padding:14px 18px 4rem; }
            .pd-hero { background:linear-gradient(135deg,rgba(168,85,247,0.18),rgba(99,102,241,0.10)); border:1px solid rgba(168,85,247,0.3); border-radius:10px; padding:1rem 1.4rem; margin-bottom:1rem; }
            .pd-hero h1 { margin:0 0 0.3rem 0; font-size:1.3rem; }
            .pd-hero p  { margin:0; color:var(--text-secondary); font-size:0.88rem; line-height:1.5; }

            .pd-grid { display:grid; grid-template-columns:300px 1fr; gap:14px; align-items:start; }
            @media (max-width: 920px) { .pd-grid { grid-template-columns:1fr; } }

            .pd-side { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem; position:sticky; top:14px; }
            .pd-side h3 { margin:0 0 8px 0; font-size:0.8rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em; }
            .pd-task-btn { display:block; width:100%; text-align:left; padding:7px 10px; margin-bottom:3px; background:transparent; border:1px solid transparent; border-radius:5px; color:var(--text-secondary); cursor:pointer; font-size:0.82rem; font-family:var(--font-base); }
            .pd-task-btn:hover { background:rgba(255,255,255,0.04); color:var(--text-main); }
            .pd-task-btn.active { background:rgba(99,102,241,0.18); color:var(--accent-indigo); border-color:rgba(99,102,241,0.35); font-weight:600; }

            .pd-ctx-field { margin-bottom:0.6rem; }
            .pd-ctx-field label { font-size:0.7rem; color:var(--text-muted); display:block; margin-bottom:3px; text-transform:uppercase; letter-spacing:0.04em; }
            .pd-ctx-field input, .pd-ctx-field select, .pd-ctx-field textarea {
                width:100%; padding:5px 8px; background:var(--bg-dark); color:var(--text-main);
                border:1px solid var(--border-default); border-radius:4px; font-size:0.82rem; font-family:var(--font-base); box-sizing:border-box;
            }
            .pd-ctx-field textarea { min-height:60px; resize:vertical; font-family:var(--font-mono); font-size:0.78rem; }
            .pd-reset { width:100%; padding:6px; background:rgba(255,255,255,0.04); border:1px solid var(--border-default); color:var(--text-secondary); border-radius:5px; cursor:pointer; font-size:0.78rem; margin-top:8px; }
            .pd-reset:hover { background:rgba(99,102,241,0.12); color:var(--accent-indigo); }

            .pd-main { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem 1.2rem; min-height:600px; }
            .pd-stats { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; align-items:center; }
            .pd-stat-pill { background:rgba(255,255,255,0.06); border:1px solid var(--border-default); padding:3px 9px; border-radius:999px; font-size:0.75rem; color:var(--text-secondary); font-family:var(--font-mono); }
            .pd-stat-pill strong { color:var(--accent-indigo); }
            .pd-copy-btn { margin-left:auto; padding:5px 12px; background:linear-gradient(90deg,#3b82f6,#6366f1); border:none; border-radius:6px; color:#fff; font-size:0.78rem; font-weight:600; cursor:pointer; }
            .pd-copy-btn:hover { filter:brightness(1.15); }

            .pd-section { margin-bottom:1.2rem; }
            .pd-section h3 { margin:0 0 8px 0; font-size:0.85rem; color:var(--accent-indigo); }
            .pd-msg { margin-bottom:8px; }
            .pd-msg-role { font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:3px; font-family:var(--font-mono); }
            .pd-msg-body {
                background:rgba(0,0,0,0.4); padding:12px 14px; border-radius:6px; color:#e6e6e6;
                font-family:var(--font-mono); font-size:0.78rem; line-height:1.55; white-space:pre-wrap;
                max-height:540px; overflow-y:auto; border:1px solid var(--border-default); margin:0;
            }
            .pd-system { border-left:3px solid #a855f7; }
            .pd-user { border-left:3px solid #22c55e; }
            .pd-msg-user .pd-msg-body { border-left:3px solid #94a3b8; }
            .pd-msg-assistant .pd-msg-body { border-left:3px solid #6366f1; }
            .pd-err { padding:1rem; background:rgba(239,68,68,0.1); border:1px solid #ef4444; border-radius:6px; color:#fca5a5; }
        </style>

        <div class="pd-shell">
            <div class="pd-hero">
                <h1>🔍 Prompts debug · transparència total IA</h1>
                <p>Veu el prompt EXACTE que la IA reb per cada task del flow de creació. Modifica el context i veuràs com canvia el system + few-shot + user. Copia per polir externament.</p>
            </div>

            <div class="pd-grid">
                <aside class="pd-side">
                    <h3>Task</h3>
                    ${tasks.map(t => `<button class="pd-task-btn ${t === this._activeTask ? 'active' : ''}" data-task="${this._esc(t)}">${this._esc(t)}</button>`).join('')}

                    <h3 style="margin-top:1rem;">Context (edita per veure el canvi)</h3>
                    <div class="pd-ctx-field">
                        <label>Nom projecte</label>
                        <input type="text" data-ctx="name" value="${this._esc(this._ctx.name)}">
                    </div>
                    <div class="pd-ctx-field">
                        <label>Descripció</label>
                        <textarea data-ctx="description">${this._esc(this._ctx.description)}</textarea>
                    </div>
                    <div class="pd-ctx-field">
                        <label>Sector CNAE</label>
                        <select data-ctx="sector">${renderCnaeOptionsHtml({ selected: this._ctx.sector, includeOther: false })}</select>
                    </div>
                    <div class="pd-ctx-field">
                        <label>Fase lifecycle</label>
                        <select data-ctx="lifecycle_stage">
                            ${['idea', 'mvp', 'validation', 'scale'].map(s => `<option value="${s}" ${s === this._ctx.lifecycle_stage ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="pd-ctx-field">
                        <label>Tipus entitat</label>
                        <select data-ctx="entity_type">
                            ${['organization', 'business', 'sos', 'project_internal'].map(s => `<option value="${s}" ${s === this._ctx.entity_type ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="pd-ctx-field">
                        <label>Zoom VNA</label>
                        <select data-ctx="vna_zoom">
                            ${['macro', 'mid', 'micro'].map(s => `<option value="${s}" ${s === this._ctx.vna_zoom ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="pd-ctx-field">
                        <label>Template (few-shot)</label>
                        <select data-ctx="templateId">
                            <option value="">— none —</option>
                            ${Object.keys(FEW_SHOT_EXAMPLES).map(t => `<option value="${t}" ${t === this._ctx.templateId ? 'selected' : ''}>${t}</option>`).join('')}
                        </select>
                    </div>
                    <button id="pdResetCtx" class="pd-reset">↺ Reset al context per defecte</button>
                </aside>

                <main id="pdPanel" class="pd-main">
                    <div style="padding:2rem;text-align:center;color:var(--text-muted);">Carregant prompt...</div>
                </main>
            </div>
        </div>`;
    }

    _esc(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    destroy() {}
}

export { TPL_VERSION };
