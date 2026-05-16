// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT CREATION V2 (LEGENDARY-001 sprint UI)
// Ruta · /js/views/ProjectCreationV2View.js  →  /create
//
// Form unificat darrere del `projectCreationOrchestrator` legendary ·
// pipeline classify → seed → personalize → validate → persist amb
// qualitat ≥85 (rubric) i integritat cross-layer garantides per TDD.
//
// Query params suportats ·
//   ?templateId=founder-coop-tradicional · ?template=… (alias legacy) ·
//   ?ambition=light|standard|max · ?name=… · ?description=… · ?sector=… ·
//   ?skip-prompt=true (auto-submit · útil per a seeds des de DashboardV2)
// =============================================================================

import { store } from '../core/store.js';
import { KB } from '../core/kb.js';
import {
    createProject, AMBITION_LEVELS,
} from '../core/projectCreationOrchestrator.js';
import { CATALOG } from '../core/projectTemplateCatalog.js';
import { toast } from '../core/uxComponents.js';

export default class ProjectCreationV2View {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Crear projecte · SOS';
        this._isCreating = false;
        // Llegeix query string · suport per a deeplinks des del catàleg ·
        // DashboardV2 seed Castellers · ProcessCatalog plantilles.
        this._presetTemplateId   = null;
        this._presetAmbition     = null;
        this._presetName         = null;
        this._presetDescription  = null;
        this._presetSector       = null;
        this._presetSkipPrompt   = false;
        try {
            if (typeof window !== 'undefined' && window.location) {
                const params = new URLSearchParams(window.location.search);
                const tid = params.get('templateId') || params.get('template') || null;
                // Acceptem només IDs canònics del catàleg
                this._presetTemplateId  = (tid && CATALOG[tid]) ? tid : null;
                // Alias curts populars
                if (!this._presetTemplateId && tid) {
                    if (/founder|coop/i.test(tid)) this._presetTemplateId = 'founder-coop-tradicional';
                    else if (/default|balanced|generic/i.test(tid)) this._presetTemplateId = 'default-balanced';
                }
                this._presetAmbition    = ['light','standard','max'].includes(params.get('ambition')) ? params.get('ambition') : null;
                this._presetName        = params.get('name')        || null;
                this._presetDescription = params.get('description') || null;
                this._presetSector      = params.get('sector')      || null;
                this._presetSkipPrompt  = params.get('skip-prompt') === 'true';
            }
        } catch (_) {}
    }

    async getHtml() {
        return this._renderShell();
    }

    async afterRender() {
        this._bind();
        this._prefillFromUrl();
        this._updateCostPreview();
        // Auto-submit si skip-prompt + name + templateId presents (cas demo seed)
        if (this._presetSkipPrompt && this._presetName && this._presetTemplateId) {
            setTimeout(() => this._submit(), 80);
        }
    }

    _prefillFromUrl() {
        if (this._presetName) {
            const el = document.getElementById('pcvName');
            if (el) el.value = this._presetName;
        }
        if (this._presetDescription) {
            const el = document.getElementById('pcvDescription');
            if (el) el.value = this._presetDescription;
        }
        if (this._presetSector) {
            const el = document.getElementById('pcvSector');
            if (el) el.value = this._presetSector;
        }
        if (this._presetAmbition) {
            const cards = document.querySelectorAll('[data-ambition]');
            cards.forEach(c => c.classList.toggle('active', c.dataset.ambition === this._presetAmbition));
        }
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
            .pcv-field-row { display:flex; gap:10px; flex-wrap:wrap; }
            @media (max-width: 700px) { .pcv-field-row { flex-direction:column; gap:0.6rem; } }
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
                    <h1>🚀 Crea un projecte amb mapa de valor garantit</h1>
                    ${this._presetTemplateId ? `
                        <p>Plantilla pre-seleccionada · <code style="font-family:var(--font-mono);background:rgba(168,85,247,0.2);padding:1px 6px;border-radius:3px;font-size:0.82rem;">${this._esc(this._presetTemplateId)}</code> · pipeline · classify → seed → personalize → validate (rubric 12 criteris + integritat 7 regles) → persist. Qualitat ≥85/100 garantida abans de desar. <a href="/process-catalog" data-link style="color:var(--accent-indigo);">↩ Canviar plantilla</a></p>
                    ` : `
                        <p>Pipeline · classify → seed (template) → personalize → validate (rubric + integritat) → persist. Tots els templates puntuen ≥85/100 abans de desar. Roles + deliverables + transactions Lean + SOPs estructurats + SOC checklist · llestos per a operar. <a href="/process-catalog" data-link style="color:var(--accent-indigo);">📐 Començar des d'una plantilla?</a></p>
                    `}
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

                    <div class="pcv-field pcv-field-row">
                        <div style="flex:1;">
                            <label class="pcv-label" for="pcvGenMode">Mode generació</label>
                            <select id="pcvGenMode" class="pcv-input">
                                <option value="ai-driven">ai-driven · IA crea SOC→SOP→WO (recomanat)</option>
                                <option value="template">template · ràpid offline (sense IA)</option>
                            </select>
                        </div>
                        <div style="flex:1;">
                            <label class="pcv-label" for="pcvEntityType">Tipus d'entitat</label>
                            <select id="pcvEntityType" class="pcv-input">
                                <option value="">auto-detect</option>
                                <option value="organization">Organització · coop · assoc · ONG</option>
                                <option value="business">Negoci · SL · autònom · startup</option>
                                <option value="sos">SoS · sociotècnic federat</option>
                                <option value="project_internal">Projecte intern · subprojecte</option>
                            </select>
                        </div>
                        <div style="flex:1;">
                            <label class="pcv-label" for="pcvVnaZoom">Zoom VNA · detall mapa</label>
                            <select id="pcvVnaZoom" class="pcv-input">
                                <option value="mid">mid · normal (4-7 SOCs)</option>
                                <option value="macro">macro · panoràmic (1-3)</option>
                                <option value="micro">micro · detall (8-15)</option>
                            </select>
                        </div>
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
            { id: 'light',    ic: '✏️', nm: 'Light',     ds: 'Template + 1 IA call cheap · ràpid' },
            { id: 'standard', ic: '⚡', nm: 'Standard',  ds: 'Template + IA enriquit · típic',     active: true },
            { id: 'max',      ic: '🏆', nm: 'MAX',       ds: 'Template + IA full · qualitat top' },
        ];
        return items.map(it => {
            const def = AMBITION_LEVELS[it.id];
            return `
            <div class="pcv-amb-card ${it.active ? 'active' : ''}" data-ambition="${it.id}" tabindex="0">
                <div class="ic">${it.ic}</div>
                <div class="nm">${it.nm}</div>
                <div class="ds">${it.ds}</div>
                <div class="cost">${def.iaCalls} crida${def.iaCalls > 1 ? 'es' : ''} IA · ~${def.costEur.toFixed(3)}€</div>
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
        const def = AMBITION_LEVELS[ambition];
        const el = document.getElementById('pcvCostPreview');
        if (el && def) {
            el.innerHTML = 'Cost estimat · <strong>' + def.costEur.toFixed(4) + ' €</strong> · '
                + def.iaCalls + ' crida' + (def.iaCalls > 1 ? 'es' : '') + ' IA · score ≥85 garantit pel rubric';
        }
    }

    async _submit() {
        if (this._isCreating) return;
        const name = (document.getElementById('pcvName')?.value || this._presetName || '').trim();
        const description = (document.getElementById('pcvDescription')?.value || this._presetDescription || '').trim();
        const sector = (document.getElementById('pcvSector')?.value || this._presetSector || '').trim() || null;
        const ambition = this._selectedAmbition();
        const templateId = this._presetTemplateId || null;
        const entityType = document.getElementById('pcvEntityType')?.value || null;
        const vnaZoom    = document.getElementById('pcvVnaZoom')?.value || null;
        const genMode    = document.getElementById('pcvGenMode')?.value || (ambition === 'light' ? 'template' : 'ai-driven');

        if (!name) {
            toast({ kind: 'error', text: 'El nom és obligatori' });
            document.getElementById('pcvName')?.focus();
            return;
        }
        if (name.length < 3) {
            toast({ kind: 'error', text: 'El nom és massa curt (mínim 3 caràcters)' });
            return;
        }

        // ── AI-DRIVEN streaming · redirigeix a /create-live amb payload ──
        if (genMode === 'ai-driven') {
            try {
                sessionStorage.setItem('createLivePayload', JSON.stringify({
                    name, description, sector, ambition, templateId,
                    entity_type: entityType, vna_zoom: vnaZoom, generationMode: 'ai-driven',
                }));
                window.location.href = '/create-live';
                return;
            } catch (e) {
                console.warn('[ProjectCreationV2] sessionStorage failed · fallback síncron', e);
            }
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

        // Etapes del pipeline legendary · classify · seed · personalize · validate · persist
        const STAGES = ['classify', 'seed', 'personalize', 'validate', 'persist'];
        for (const stg of STAGES) this._renderStep(stg, 'pending', this._labelForStep(stg) + '...');

        try {
            // 1-4 · orchestrator (síncron · etapes ràpides)
            this._renderStep('classify', 'running', this._labelForStep('classify'));
            const result = await createProject({
                name, description, sector, ambition,
                templateId,
                creatorHandle: this._currentHandle(),
            });
            this._renderStep('classify',   'done', this._labelForStep('classify')   + ' · ' + (result.classification?.source || '?'));
            this._renderStep('seed',       'done', this._labelForStep('seed')       + ' · template ' + result.templateId);
            this._renderStep('personalize','done', this._labelForStep('personalize')+ ' · context aplicat');
            this._renderStep(
                'validate',
                result.ok ? 'done' : 'error',
                this._labelForStep('validate') + ' · score ' + result.score + '/100 (' + result.status
                    + ')' + (result.integrity ? ' · integrity ' + (result.integrity.ok ? '✓' : result.integrity.errorCount + ' errors') : '')
            );

            if (!result.ok) {
                toast({
                    kind: 'error',
                    text: '✘ Output sota llindar · score ' + result.score + ' · ' + (result.missing.length || 0) + ' criteris fallits',
                });
                // No persistim si !ok · usuari pot ajustar input i tornar a provar
                this._renderStep('persist', 'skip', this._labelForStep('persist') + ' · skip (score sota llindar)');
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '🚀 Crear projecte'; }
                this._isCreating = false;
                return;
            }

            // 5 · persist · project + role + sop + soc nodes
            this._renderStep('persist', 'running', this._labelForStep('persist'));
            await KB.upsert(result.project);
            for (const r of result.roles) await KB.upsert(r);
            for (const s of result.sops)  await KB.upsert(s);
            for (const s of result.socs)  await KB.upsert(s);
            await store.dispatch({ type: 'CREATE_PROJECT', payload: result.project });
            this._renderStep('persist', 'done', this._labelForStep('persist') + ' · '
                + (1 + result.roles.length + result.sops.length + result.socs.length) + ' nodes');

            toast({
                kind: 'success',
                text: '✓ Projecte creat · ' + name + ' · score ' + result.score + '/100 (' + result.status + ') · '
                    + result.roles.length + ' rols · ' + result.transactions.length + ' tx · '
                    + result.sops.length + ' SOPs · cost ' + (result.cost || 0).toFixed(4) + '€',
                ttl: 6000,
            });
            setTimeout(() => {
                window.location.href = '/hub/' + encodeURIComponent(result.project.id);
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

    _currentHandle() {
        // Best-effort · matriu_member primary o '@anonymous'
        try {
            const me = this._state?.meHandle || null;
            if (me) return me;
        } catch (_) {}
        return '@anonymous';
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
            classify:    'Classificant projecte',
            seed:        'Aplicant template del catàleg',
            personalize: 'Personalitzant amb context',
            validate:    'Validant rubric + integritat',
            persist:     'Desant nodes al KB',
        })[step] || step;
    }

    _esc(s) {
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    destroy() {}
}

export const TPL_VERSION = 'project-creation-legendary-v1.0';
