// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT CREATION V2 (B-UNIFIED-FORM-001 sprint UI)
// Ruta · /js/views/ProjectCreationV2View.js  →  /create
//
// Form unificat IA-driven · 1 sol model per a TOTS els projectes. Tanca el
// cicle B-UNIFIED-FORM-001 (backend a PR #97 · sprint UI aquí).
//
// Pipeline · Plan → Fan-out → Reduce (via unifiedProjectCreationService) ·
//   1. Usuari · nom + descripció + sector (opcional) + ambition (light·standard·max)
//   2. PLAN · classifyProject (~0.002€)
//   3. FAN-OUT · canvas + vna + sops + (tokenomics + workshops si max) paral·lel
//   4. REDUCE · validate coherence
//   5. Persisteix project + drafts → redirect /hub/{newId}
//
// Reusa uxComponents.toast() per a feedback live.
// =============================================================================

import { store } from '../core/store.js';
import { KB } from '../core/kb.js';
import {
    buildCreationPlan, executeCreationPlan, estimatePlanCost,
    AMBITION_LEVELS,
} from '../core/unifiedProjectCreationService.js';
import { toast } from '../core/uxComponents.js';

export default class ProjectCreationV2View {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Crear projecte · SOS';
        this._isCreating = false;
    }

    async getHtml() {
        return this._renderShell();
    }

    async afterRender() {
        this._bind();
        this._updateCostPreview();
    }

    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    _renderShell() {
        return `
        <style>
            .pcv-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); padding-bottom:2rem; }
            .pcv-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); }
            .pcv-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .pcv-logo span { color:var(--accent-indigo); }
            .pcv-back { color:var(--text-secondary); font-size:0.78rem; padding:4px 10px; border-radius:4px; text-decoration:none; }
            .pcv-back:hover { color:var(--text-main); background:var(--glass-hover); }

            .pcv-main { max-width:680px; margin:0 auto; padding:1.5rem 1rem; }

            .pcv-hero { background:linear-gradient(135deg,rgba(168,85,247,0.18),rgba(99,102,241,0.10)); border:1px solid rgba(168,85,247,0.3); border-radius:10px; padding:1.4rem 1.6rem; margin-bottom:1.2rem; }
            .pcv-hero h1 { margin:0 0 0.4rem 0; font-size:1.5rem; }
            .pcv-hero p { margin:0; font-size:0.9rem; color:var(--text-secondary); line-height:1.55; }

            .pcv-form { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:10px; padding:1.3rem 1.5rem; }
            .pcv-field { margin-bottom:1rem; }
            .pcv-label { display:block; font-size:0.82rem; font-weight:700; color:var(--text-main); margin-bottom:6px; }
            .pcv-help  { font-size:0.7rem; color:var(--text-secondary); margin-top:3px; line-height:1.4; }
            .pcv-input, .pcv-textarea, .pcv-select { width:100%; box-sizing:border-box; padding:8px 12px; background:var(--bg-dark); color:var(--text-main); border:1px solid var(--border-default); border-radius:5px; font-family:var(--font-base); font-size:0.88rem; }
            .pcv-input:focus, .pcv-textarea:focus, .pcv-select:focus { outline:2px solid var(--accent-indigo); outline-offset:1px; }
            .pcv-textarea { min-height:80px; resize:vertical; }

            .pcv-ambition-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:0.5rem; }
            @media (max-width: 600px) { .pcv-ambition-grid { grid-template-columns:1fr; } }
            .pcv-amb-card { padding:0.85rem 1rem; border-radius:6px; border:2px solid var(--border-default); cursor:pointer; background:var(--bg-dark); transition:all 0.15s; }
            .pcv-amb-card.active { border-color:var(--accent-indigo); background:rgba(99,102,241,0.10); }
            .pcv-amb-card .ic { font-size:1.4rem; line-height:1; margin-bottom:4px; }
            .pcv-amb-card .nm { font-weight:700; font-size:0.85rem; }
            .pcv-amb-card .ds { font-size:0.7rem; color:var(--text-secondary); margin-top:4px; line-height:1.4; }
            .pcv-amb-card .cost { display:inline-block; margin-top:6px; padding:1px 8px; border-radius:999px; font-size:0.65rem; font-weight:700; background:rgba(99,102,241,0.18); color:#a8b2ff; }

            .pcv-actions { display:flex; gap:8px; align-items:center; margin-top:1.2rem; flex-wrap:wrap; }
            .pcv-btn { padding:9px 18px; border-radius:6px; font-size:0.88rem; font-weight:700; cursor:pointer; border:1px solid var(--border-default); background:var(--bg-panel); color:var(--text-main); }
            .pcv-btn:hover { background:var(--glass-hover); }
            .pcv-btn-primary { background:linear-gradient(135deg,#a855f7,#6366f1); color:#fff; border-color:transparent; }
            .pcv-btn-primary:hover { filter:brightness(1.10); }
            .pcv-btn:disabled { opacity:0.5; cursor:wait; }
            .pcv-cost-preview { margin-left:auto; font-size:0.78rem; color:var(--text-secondary); }
            .pcv-cost-preview strong { color:#facc15; }

            .pcv-progress { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem 1.2rem; margin-top:1rem; display:none; }
            .pcv-progress.active { display:block; }
            .pcv-progress h3 { margin:0 0 0.6rem 0; font-size:0.9rem; }
            .pcv-step { padding:6px 10px; border-radius:4px; font-size:0.82rem; display:flex; gap:8px; align-items:center; margin-bottom:4px; }
            .pcv-step .ic { font-size:1rem; line-height:1; }
            .pcv-step.pending  { color:var(--text-muted); }
            .pcv-step.running  { color:#a8b2ff; background:rgba(99,102,241,0.10); }
            .pcv-step.done     { color:#22c55e; }
            .pcv-step.error    { color:#ef4444; background:rgba(239,68,68,0.10); }
            .pcv-step.skip     { color:var(--text-muted); }
            .pcv-step .meta    { margin-left:auto; font-size:0.7rem; color:var(--text-secondary); }
        </style>

        <div class="pcv-shell">
            <div class="pcv-topbar">
                <a href="/home" data-link class="pcv-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">+ Nou projecte</span>
                <span style="flex:1;"></span>
                <a href="/dashboard" data-link class="pcv-back">↩ Dashboard antic (modal complet)</a>
            </div>

            <div class="pcv-main">
                <div class="pcv-hero">
                    <h1>🚀 Crea un projecte amb IA</h1>
                    <p>1 sol form. L'IA llegirà el teu input · classificarà el projecte · generarà drafts adaptats al tipus + fase (canvas · VNA · SOPs · etc). Tu valides el text final.</p>
                </div>

                <div class="pcv-form">
                    <div class="pcv-field">
                        <label class="pcv-label" for="pcvName">Nom del projecte *</label>
                        <input type="text" id="pcvName" class="pcv-input" placeholder="Ex · Cooperativa Cures Vall d'Aro" maxlength="120" autocomplete="off">
                    </div>

                    <div class="pcv-field">
                        <label class="pcv-label" for="pcvDescription">Descripció (breu)</label>
                        <textarea id="pcvDescription" class="pcv-textarea" placeholder="2-3 frases · qui sou · què feu · per a qui · per què cooperativa..." maxlength="800"></textarea>
                        <div class="pcv-help">Com més clara la descripció · més adaptats seran els drafts IA · l'usuari es classificarà automàticament al tipus i fase de projecte més probables.</div>
                    </div>

                    <div class="pcv-field">
                        <label class="pcv-label" for="pcvSector">Sector (opcional)</label>
                        <input type="text" id="pcvSector" class="pcv-input" placeholder="Ex · cures · tech · agroecologia · habitatge..." maxlength="80" autocomplete="off">
                    </div>

                    <div class="pcv-field">
                        <label class="pcv-label">Nivell d'ambició IA *</label>
                        <div class="pcv-ambition-grid" data-ambition-grid>
                            ${this._renderAmbitionCards()}
                        </div>
                        <div class="pcv-help">Light · projecte buit amb canvas IA · ràpid. Standard · canvas + VNA + SOPs · típic. MAX · tot el lifecycle + tokenomics + workshops · setup complet.</div>
                    </div>

                    <div class="pcv-actions">
                        <button id="pcvCancel" class="pcv-btn">Cancel</button>
                        <button id="pcvSubmit" class="pcv-btn pcv-btn-primary">🚀 Crear projecte</button>
                        <div class="pcv-cost-preview" id="pcvCostPreview">Cost estimat · <strong>—</strong></div>
                    </div>
                </div>

                <div class="pcv-progress" id="pcvProgress">
                    <h3>🧠 IA treballant...</h3>
                    <div id="pcvSteps"></div>
                </div>
            </div>
        </div>`;
    }

    _renderAmbitionCards() {
        const items = [
            { id: 'light',    ic: '✏️', nm: 'Light',     ds: 'Esquelet · canvas IA · ràpid' },
            { id: 'standard', ic: '⚡', nm: 'Standard',  ds: 'Canvas + VNA + 3 SOPs · típic',  active: true },
            { id: 'max',      ic: '🏆', nm: 'MAX',       ds: 'Tot · tokenomics + workshops' },
        ];
        return items.map(it => {
            const def = AMBITION_LEVELS[it.id];
            return `
            <div class="pcv-amb-card ${it.active ? 'active' : ''}" data-ambition="${it.id}" tabindex="0">
                <div class="ic">${it.ic}</div>
                <div class="nm">${it.nm}</div>
                <div class="ds">${it.ds}</div>
                <div class="cost">${def.fanOutSteps.length} steps · ${def.tier} tier</div>
            </div>`;
        }).join('');
    }

    _bind() {
        // Ambition cards · selecció única
        const cards = document.querySelectorAll('[data-ambition]');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                cards.forEach(c => c.classList.toggle('active', c === card));
                this._updateCostPreview();
            });
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
            });
        });
        // Inputs · update cost on change
        ['pcvName', 'pcvDescription', 'pcvSector'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this._updateCostPreview());
        });
        // Cancel · back to home
        document.getElementById('pcvCancel')?.addEventListener('click', () => {
            window.location.href = '/home';
        });
        // Submit
        document.getElementById('pcvSubmit')?.addEventListener('click', () => this._submit());
    }

    _selectedAmbition() {
        const active = document.querySelector('[data-ambition].active');
        return active?.dataset?.ambition || 'standard';
    }

    _updateCostPreview() {
        const ambition = this._selectedAmbition();
        const plan = buildCreationPlan({ name: 'preview', ambition });
        const cost = estimatePlanCost(plan);
        const el = document.getElementById('pcvCostPreview');
        if (el) {
            el.innerHTML = 'Cost estimat · <strong>' + cost.toFixed(4) + ' €</strong> · ' + plan.stepsToRun.length + ' crides IA';
        }
    }

    async _submit() {
        if (this._isCreating) return;
        const name = (document.getElementById('pcvName')?.value || '').trim();
        const description = (document.getElementById('pcvDescription')?.value || '').trim();
        const sector = (document.getElementById('pcvSector')?.value || '').trim() || null;
        const ambition = this._selectedAmbition();

        if (!name) {
            toast({ kind: 'error', text: 'El nom és obligatori' });
            document.getElementById('pcvName')?.focus();
            return;
        }
        if (name.length < 3) {
            toast({ kind: 'error', text: 'El nom és massa curt (mínim 3 caràcters)' });
            return;
        }

        this._isCreating = true;
        const submitBtn = document.getElementById('pcvSubmit');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Generant...';
        }
        const progressEl = document.getElementById('pcvProgress');
        const stepsEl = document.getElementById('pcvSteps');
        if (progressEl) progressEl.classList.add('active');
        if (stepsEl) stepsEl.innerHTML = '';

        // Build plan
        const plan = buildCreationPlan({ name, description, sector, ambition });
        const projectId = 'proj-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) + '-' + Date.now().toString(36);

        // Pre-add classify step
        this._renderStep('classify', 'pending', 'Classificant projecte (type + stage)...');
        plan.stepsToRun.forEach(step => this._renderStep(step, 'pending', this._labelForStep(step) + '...'));

        try {
            const result = await executeCreationPlan(plan, {
                projectId,
                onProgress: ({ step, status, modelKey, cost, classification, reason }) => {
                    let msg = this._labelForStep(step);
                    if (status === 'done') {
                        msg += ' · ' + (modelKey ? modelKey.split('/')[1] || modelKey : '✓') + (cost ? ' · ' + cost.toFixed(4) + '€' : '');
                    } else if (status === 'cache-hit') {
                        msg += ' · cache hit · 0€';
                    } else if (status === 'error' || status === 'blocked') {
                        msg += ' · ' + (reason || status);
                    } else if (status === 'fallback') {
                        msg += ' · fallback (heuristic only)';
                    }
                    this._renderStep(step, status === 'cache-hit' ? 'done' : status, msg);
                },
            });

            if (!result.ok) {
                toast({ kind: 'error', text: 'Generació amb errors · ' + (result.errors || []).map(e => e.step).join(' · ') });
            }

            // Create project node
            const now = Date.now();
            const projectNode = {
                id: projectId,
                type: 'project',
                nombre: name,
                name,
                sector_id: sector,
                description,
                purpose: description,
                aiClassification: result.classification ? {
                    project_type: result.classification.project_type,
                    lifecycle_stage: result.classification.lifecycle_stage,
                    scale: result.classification.scale,
                    dependency_type: result.classification.dependency_type,
                    confidence: result.classification.confidence,
                    classifiedAt: now,
                } : null,
                content: {
                    canvas: null,
                    quality_target: 70,
                    creationDrafts: result.results || null,
                    creationTemplateKey: result.template?.key || null,
                },
                vna_roles: [],
                vna_transactions: [],
                vna_flows: [],
                tags: ['unified-creation', ambition, sector || 'no-sector'],
                createdAt: now,
                updatedAt: now,
                isArchived: false,
            };

            await KB.upsert(projectNode);
            await store.dispatch({ type: 'CREATE_PROJECT', payload: projectNode });

            toast({ kind: 'success', text: '✓ Projecte creat · ' + name + ' · cost real ' + (result.cost || 0).toFixed(4) + '€' });
            setTimeout(() => {
                window.location.href = '/hub/' + projectId;
            }, 1500);
        } catch (e) {
            toast({ kind: 'error', text: 'Error creant projecte · ' + (e?.message || e) });
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '🚀 Crear projecte';
            }
            this._isCreating = false;
        }
    }

    _renderStep(stepId, status, msg) {
        const stepsEl = document.getElementById('pcvSteps');
        if (!stepsEl) return;
        let existing = stepsEl.querySelector('[data-step="' + stepId + '"]');
        const ic = ({
            pending: '○', start: '◐', running: '◐', done: '✓', error: '✗', blocked: '⛔', fallback: '⚠', skip: '–',
        })[status] || '·';
        const html = `<div class="pcv-step ${status}" data-step="${stepId}"><span class="ic">${ic}</span> <span>${this._esc(msg)}</span></div>`;
        if (existing) {
            existing.outerHTML = html;
        } else {
            stepsEl.insertAdjacentHTML('beforeend', html);
        }
    }

    _labelForStep(step) {
        return ({
            classify:   'Classificar (type + stage)',
            canvas:     'Generant canvas',
            vna:        'Generant VNA (roles + tx)',
            sops:       'Generant SOPs base',
            tokenomics: 'Generant tokenomics',
            workshops:  'Generant workshops outline',
            reduce:     'Validant coherence',
        })[step] || step;
    }

    _esc(s) {
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    destroy() {}
}

export const TPL_VERSION = 'project-creation-v2-v1.0';
