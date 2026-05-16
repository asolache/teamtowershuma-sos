// =============================================================================
// TEAMTOWERS SOS V11 — CREATE LIVE VIEW (AI-DRIVEN sprint UI · PR2)
// Ruta · /js/views/CreateLiveView.js  →  /create-live
//
// Pantalla streaming de creació de projecte ·
//   ESQUERRA (60%) · 4 tabs preview que s'omplen LIVE (Mapa Castell · Mapa
//   Valor · Canvas/Pitch · WOs)
//   DRETA (40%) · Quality gauge amb rubric 12-criteris · cost IA per step ·
//   pipeline progress · log d'events
// Final · CTA bar [Comença sprint Kanban] [Veure mapa] [Veure canvas]
//
// Entrada · sessionStorage 'createLivePayload' { name, description, sector,
// ambition, templateId, entity_type, vna_zoom, generationMode } posat per
// ProjectCreationV2View ABANS de redirigir aquí.
//
// Si no hi ha payload · mostra estat buit + link a /create.
// =============================================================================

import { store } from '../core/store.js';
import { KB } from '../core/kb.js';
import { createProject } from '../core/projectCreationOrchestrator.js';
import { buildAiCallbacks } from '../core/aiDrivenCreationAdapter.js';
import { loadIndex } from '../core/knowledgeIndexService.js';
import { toast } from '../core/uxComponents.js';

const CASTELL_ORDER = ['pom_de_dalt', 'tronc', 'pinya', 'laterals', 'mans', 'baixos'];
const CASTELL_LABEL = {
    pom_de_dalt: 'Pom de dalt · Visió',
    tronc:       'Tronc · Execució',
    pinya:       'Pinya · Suport',
    laterals:    'Laterals · QA',
    mans:        'Mans · Interfície',
    baixos:      'Baixos · Ancoratge',
};

const TAB_KEYS = ['castell', 'mapa', 'canvas', 'wos'];

export default class CreateLiveView {

    constructor() {
        document.title = 'Creant projecte · SOS';
        this._payload = null;
        this._events = [];
        this._costTotal = 0;
        this._costsByStep = new Map();
        this._draft = {
            roles: [], transactions: [], deliverables: [], canvas: null, pitch: null,
            sops: [], socs: [], wos: [], socsSelected: [], score: 0, status: '—', integrity: null,
        };
        this._activeTab = 'castell';
        this._finished = false;
        this._result = null;
    }

    async getHtml() {
        return this._htmlMain();
    }

    async afterRender() {
        // Llegir payload
        try {
            const raw = sessionStorage.getItem('createLivePayload');
            this._payload = raw ? JSON.parse(raw) : null;
        } catch (_) { this._payload = null; }

        // FIX A1 · sessionStorage buit (refresh, deep-link) → redirect /create
        // amb toast d'avís. Abans · pantalla buida encallada.
        if (!this._payload || !this._payload.name) {
            try { toast({ kind: 'warning', text: 'Cal omplir el formulari primer · redirigint a /create', ttl: 3000 }); } catch (_) {}
            this._renderEmpty();
            setTimeout(() => { (window.navigateTo || ((u) => window.location.href = u))('/create'); }, 1500);
            return;
        }

        // Tab switching
        document.querySelectorAll('[data-cl-tab]').forEach(el => {
            el.addEventListener('click', () => {
                this._activeTab = el.getAttribute('data-cl-tab');
                this._renderTabs();
            });
        });
        document.getElementById('clCancelBtn')?.addEventListener('click', () => {
            (window.navigateTo || ((u) => window.location.href = u))('/create');
        });

        // Render header
        document.getElementById('clProjectName').textContent = this._payload.name;
        document.getElementById('clProjectDescr').textContent = this._payload.description || '(sense descripció)';
        document.getElementById('clSector').textContent = this._payload.sector || '—';
        document.getElementById('clAmbition').textContent = this._payload.ambition || 'light';
        document.getElementById('clZoom').textContent = this._payload.vna_zoom || 'mid';
        document.getElementById('clEntityType').textContent = this._payload.entity_type || 'auto';

        // AMBITION BANNER + NARRATIVE (legendary-all-ambitions sprint)
        this._renderAmbitionHero();

        // Llançar pipeline · streaming
        await this._runPipeline();
    }

    // _renderAmbitionHero · personalitza banner + narrativa + budget per ambition
    _renderAmbitionHero() {
        const amb = this._payload.ambition || 'light';
        const profiles = {
            light: {
                icon: '✏️', label: 'LIGHT · ràpid',
                narrative: 'Un projecte funcional en menys d\'1 minut · 1-3 SOCs essencials del knowledge · SOPs mínimes per arrencar. Perfect per validar idees abans d\'invertir més.',
                budget: '~0.005€',
            },
            standard: {
                icon: '⚡', label: 'STANDARD · construcció completa',
                narrative: 'El sweet spot · 4-7 SOCs equilibrats · SOPs amb steps detallats · canvas + pitch personalitzats. Llest per arrencar el primer sprint amb confiança.',
                budget: '~0.015€',
            },
            max: {
                icon: '🏆', label: 'MAX · mega producte',
                narrative: 'L\'experiència total · 8-15 SOCs profunds · SOPs detallades · Work Orders executables al Kanban · canvas + pitch + landing. Operació al complet des del minut 1.',
                budget: '~0.030€',
            },
        };
        const p = profiles[amb] || profiles.light;
        const banner = document.getElementById('clAmbitionBanner');
        if (banner) banner.classList.add('cl-amb-' + amb);
        const icon = document.getElementById('clAmbitionIcon');
        if (icon) icon.textContent = p.icon;
        const lbl = document.getElementById('clAmbitionLabel');
        if (lbl) lbl.textContent = p.label;
        const narr = document.getElementById('clNarrative');
        if (narr) narr.textContent = p.narrative;
        const budget = document.getElementById('clBudget');
        if (budget) budget.textContent = p.budget;
    }

    async _runPipeline() {
        const p = this._payload;

        // Carrega index knowledge per al matcher (no bloca si falla · matcher ho gestiona)
        let knowledgeIndex = null;
        try { knowledgeIndex = await loadIndex({}); } catch (_) {}

        // Adapter IA · només si generationMode='ai-driven'
        let callbacks = {};
        if (p.generationMode === 'ai-driven') {
            callbacks = buildAiCallbacks({
                preferredProvider: p.preferredProvider || null,
                onModelUsed: ({ taskKind, modelKey, cost }) => {
                    this._appendEvent({ step: 'ia-call', status: 'done', taskKind, modelKey, cost });
                },
            });
        }

        try {
            const result = await createProject({
                name:           p.name,
                description:    p.description || '',
                sector:         p.sector || null,
                ambition:       p.ambition || 'light',
                templateId:     p.templateId || null,
                generationMode: p.generationMode || 'template',
                entity_type:    p.entity_type || null,
                vna_zoom:       p.vna_zoom || null,
                creatorHandle:  this._currentHandle(),
                knowledgeIndex,
                ...callbacks,
                onEvent: (e) => this._handleEvent(e),
            });
            this._result = result;
            this._finished = true;

            // FIX bug 5 · sync immediat dels tabs preview amb el result final ·
            // (els events del pipeline arriben ABANS que this._result existeixi ·
            // sense aquesta crida explícita els tabs queden buits per sempre)
            this._draft.roles        = this._result.project?.vna_roles || [];
            this._draft.transactions = this._result.transactions || [];
            this._draft.deliverables = this._result.deliverables || [];
            this._draft.canvas       = this._result.canvas || null;
            this._draft.pitch        = this._result.pitch || null;
            this._draft.sops         = (this._result.sops || []).map(s => s.content || s);
            this._draft.socs         = (this._result.socs || []).map(s => s.content || s);
            this._draft.wos          = (this._result.wos || []).map(w => w.content || w);
            this._draft.socsSelected = this._result.socsSelected || [];
            this._renderTabs();

            // Persist si ok
            if (result.ok) {
                await KB.upsert(result.project);
                for (const r of result.roles) await KB.upsert(r);
                for (const s of result.sops)  await KB.upsert(s);
                for (const s of result.socs)  await KB.upsert(s);
                for (const w of (result.wos || [])) await KB.upsert(w);
                await store.dispatch({ type: 'CREATE_PROJECT', payload: result.project });
                this._renderFinishBar(result);
                toast({ kind: 'success', text: '✓ Projecte creat · ' + result.score + '/100', ttl: 4000 });
            } else {
                this._renderErrorBar(result);
                toast({ kind: 'error', text: '✘ Score sota llindar · ' + result.score, ttl: 5000 });
            }

            // Neteja payload una vegada usat
            sessionStorage.removeItem('createLivePayload');
        } catch (e) {
            this._appendEvent({ step: 'error', status: 'error', error: e?.message || String(e) });
            toast({ kind: 'error', text: '✘ Error creant projecte · ' + (e?.message || e), ttl: 8000 });
        }
    }

    _handleEvent(ev) {
        // Sync el draft amb cada event start/done · perquè els tabs es vagin omplint
        this._appendEvent(ev);

        // Quan match-socs done · render zoom info
        if (ev.step === 'match-socs' && ev.status === 'done') {
            this._renderProgressBar(40);
        }
        if (ev.step === 'generate-sops' && ev.status === 'done') {
            this._renderProgressBar(60);
        }
        if (ev.step === 'generate-wos' && ev.status === 'done') {
            this._renderProgressBar(80);
        }
        if (ev.step === 'validate' && ev.status === 'done') {
            if (typeof ev.score === 'number') this._draft.score = ev.score;
            this._draft.status = ev.rubric_status || (this._draft.score >= 85 ? 'gold' : this._draft.score >= 70 ? 'silver' : this._draft.score >= 50 ? 'bronze' : 'red');
            if (ev.integrityErrors != null) this._draft.integrity = { ok: ev.integrityErrors === 0, errorCount: ev.integrityErrors };
            this._renderQualityGauge();
            this._renderProgressBar(95);
        }
        if (ev.step === 'finish') {
            this._renderProgressBar(100);
        }

        // Cost
        if (typeof ev.cost === 'number' && ev.cost > 0) {
            this._costTotal += ev.cost;
            const k = ev.taskKind || ev.step;
            this._costsByStep.set(k, (this._costsByStep.get(k) || 0) + ev.cost);
            this._renderCostTracker();
        }
    }

    _appendEvent(ev) {
        this._events.push({ ...ev, ts: Date.now() });
        this._renderEventLog();
        this._renderPipelineDots();

        // Sync tabs preview · agafem snapshot del result si està (al final)
        // i de l'estat dels events intermedis
        if (this._result) {
            this._draft.roles = this._result.project?.vna_roles || [];
            this._draft.transactions = this._result.transactions || [];
            this._draft.canvas = this._result.canvas || null;
            this._draft.pitch = this._result.pitch || null;
            this._draft.sops = (this._result.sops || []).map(s => s.content || s);
            this._draft.socs = (this._result.socs || []).map(s => s.content || s);
            this._draft.wos = (this._result.wos || []).map(w => w.content || w);
            this._draft.socsSelected = this._result.socsSelected || [];
            this._renderTabs();
        }
    }

    // ────────────────────────────── RENDER ────────────────────────────────

    _renderEmpty() {
        document.getElementById('clRoot').innerHTML = `
            <div class="cl-empty">
                <h2>No hi ha res a crear</h2>
                <p>Aquesta pantalla només funciona si véns del formulari de creació.</p>
                <a href="/create" data-link class="cl-btn-primary">Vés a /create</a>
            </div>`;
    }

    _renderPipelineDots() {
        const STEPS = [
            { id: 'classify',       label: 'Classify' },
            { id: 'seed',           label: 'Seed' },
            { id: 'personalize',    label: 'Canvas/Pitch' },
            { id: 'match-socs',     label: 'Match SOCs' },
            { id: 'pick-socs-ai',   label: 'IA · Pick SOCs' },
            { id: 'generate-sops',  label: 'IA · SOPs' },
            { id: 'generate-wos',   label: 'IA · WOs' },
            { id: 'validate',       label: 'Validate' },
            { id: 'build-nodes',    label: 'Build nodes' },
            { id: 'finish',         label: 'Finish' },
        ];
        const statusFor = (id) => {
            const evs = this._events.filter(e => e.step === id);
            if (!evs.length) return 'pending';
            if (evs.some(e => e.status === 'error')) return 'error';
            if (evs.some(e => e.status === 'done')) return 'done';
            return 'running';
        };
        const el = document.getElementById('clPipelineDots');
        if (!el) return;
        el.innerHTML = STEPS.map(s => {
            const st = statusFor(s.id);
            return `<div class="cl-dot cl-dot-${st}" title="${s.label}"><span class="cl-dot-icon">${this._iconFor(st)}</span><span class="cl-dot-label">${s.label}</span></div>`;
        }).join('');
    }

    _iconFor(st) {
        if (st === 'done')    return '✓';
        if (st === 'running') return '◐';
        if (st === 'error')   return '✘';
        return '·';
    }

    _renderProgressBar(pct) {
        const el = document.getElementById('clProgressFill');
        if (el) el.style.width = Math.min(100, Math.max(0, pct)) + '%';
        const txt = document.getElementById('clProgressPct');
        if (txt) txt.textContent = Math.round(pct) + '%';
    }

    _renderEventLog() {
        const el = document.getElementById('clEventLog');
        if (!el) return;
        const last = this._events.slice(-12).reverse();
        el.innerHTML = last.map(e => {
            const extras = [];
            if (e.score != null)    extras.push('score ' + e.score);
            if (e.modelKey)         extras.push('model ' + e.modelKey);
            if (e.taskKind)         extras.push('task ' + e.taskKind);
            if (e.count != null)    extras.push('count ' + e.count);
            if (e.selected != null) extras.push('sel ' + e.selected);
            if (typeof e.cost === 'number') extras.push(e.cost.toFixed(4) + '€');
            if (e.error)            extras.push('err ' + e.error);
            return `<div class="cl-evrow cl-ev-${e.status || 'info'}">
                <span class="cl-ev-step">${this._esc(e.step)}</span>
                <span class="cl-ev-status">${this._esc(e.status || '')}</span>
                ${extras.length ? '<span class="cl-ev-extra">· ' + extras.map(x => this._esc(x)).join(' · ') + '</span>' : ''}
            </div>`;
        }).join('');
    }

    _renderQualityGauge() {
        const el = document.getElementById('clQualityScore');
        if (!el) return;
        const s = this._draft.score;
        const stat = s >= 85 ? 'gold' : s >= 70 ? 'silver' : s >= 50 ? 'bronze' : 'red';
        el.innerHTML = `
            <div class="cl-gauge cl-gauge-${stat}">
                <div class="cl-gauge-num">${s}</div>
                <div class="cl-gauge-lbl">${stat}</div>
            </div>
            <div class="cl-gauge-meta">
                ${this._draft.integrity ? (this._draft.integrity.ok ? '✓ integrity' : '✘ ' + this._draft.integrity.errorCount + ' errors') : '...'}
            </div>`;
    }

    _renderCostTracker() {
        const el = document.getElementById('clCostTracker');
        if (!el) return;
        const breakdown = Array.from(this._costsByStep.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => `<div class="cl-cost-row"><span>${this._esc(k)}</span><span>${v.toFixed(4)}€</span></div>`)
            .join('');
        el.innerHTML = `
            <div class="cl-cost-total">${this._costTotal.toFixed(4)}€</div>
            <div class="cl-cost-list">${breakdown || '<div class="cl-cost-row"><span>—</span><span>0€</span></div>'}</div>`;
    }

    _renderTabs() {
        // Tab buttons · active state
        document.querySelectorAll('[data-cl-tab]').forEach(el => {
            const k = el.getAttribute('data-cl-tab');
            el.classList.toggle('active', k === this._activeTab);
            // counter badge
            const count = this._tabCount(k);
            const badge = el.querySelector('.cl-tab-count');
            if (badge) badge.textContent = count > 0 ? String(count) : '';
        });
        const body = document.getElementById('clTabBody');
        if (!body) return;
        if (this._activeTab === 'castell') body.innerHTML = this._htmlTabCastell();
        else if (this._activeTab === 'mapa') body.innerHTML = this._htmlTabMapa();
        else if (this._activeTab === 'canvas') body.innerHTML = this._htmlTabCanvas();
        else if (this._activeTab === 'wos') body.innerHTML = this._htmlTabWos();
    }

    _tabCount(k) {
        if (k === 'castell') return this._draft.roles.length;
        if (k === 'mapa') return this._draft.transactions.length;
        if (k === 'canvas') return this._draft.canvas ? 1 : 0;
        if (k === 'wos') return this._draft.wos.length;
        return 0;
    }

    _htmlTabCastell() {
        const roles = this._draft.roles;
        if (!roles.length) {
            // Skeleton · suggereix què veurà l'usuari quan s'ompli
            return `<div class="cl-skel-castell">
                <div class="cl-skel-hint">🏰 El teu castell de rols apareixerà aquí · jerarquia per nivells (pom_de_dalt → baixos)</div>
                ${CASTELL_ORDER.map(lvl => `
                    <div class="cl-skel-row">
                        <div class="cl-skel-label">${CASTELL_LABEL[lvl]}</div>
                        <div class="cl-skel-pill"></div>
                        <div class="cl-skel-pill" style="width:80px;"></div>
                    </div>`).join('')}
            </div>`;
        }
        const byLevel = {};
        for (const r of roles) {
            const lvl = r.castell_level || 'pinya';
            (byLevel[lvl] = byLevel[lvl] || []).push(r);
        }
        return `
            <div class="cl-castell">
                ${CASTELL_ORDER.map(lvl => `
                    <div class="cl-castell-row">
                        <div class="cl-castell-lbl">${CASTELL_LABEL[lvl]}</div>
                        <div class="cl-castell-roles">
                            ${(byLevel[lvl] || []).map(r => `<span class="cl-role-pill cl-fade-in">${this._esc(r.name || r.id)}</span>`).join('') || '<span class="cl-role-empty">—</span>'}
                        </div>
                    </div>
                `).join('')}
            </div>`;
    }

    _htmlTabMapa() {
        const txs = this._draft.transactions;
        const roles = this._draft.roles;
        if (!txs.length) {
            return `<div class="cl-skel-mapa">
                <div class="cl-skel-hint">📊 El mapa de valor mostrarà aquí les transaccions entre rols · tangibles vs intangibles · mètriques Lean</div>
                <div class="cl-mapa-summary">
                    <span class="cl-pill cl-skel-pulse">— tangibles</span>
                    <span class="cl-pill cl-skel-pulse">— intangibles</span>
                </div>
                ${[1,2,3].map(() => `<div class="cl-skel-tx"></div>`).join('')}
            </div>`;
        }
        const tangibleCount = txs.filter(t => t.type === 'tangible').length;
        const intangibleCount = txs.filter(t => t.type === 'intangible').length;
        return `
            <div class="cl-mapa-summary">
                <span class="cl-pill cl-pill-tangible">${tangibleCount} tangibles</span>
                <span class="cl-pill cl-pill-intangible">${intangibleCount} intangibles</span>
                <span class="cl-pill">${roles.length} rols</span>
                <span class="cl-pill">${this._draft.deliverables?.length || 0} deliverables</span>
            </div>
            <div class="cl-mapa-list">
                ${txs.map(t => `
                    <div class="cl-tx-row cl-fade-in">
                        <span class="cl-tx-from">${this._esc(t.from || '')}</span>
                        <span class="cl-tx-arrow">→</span>
                        <span class="cl-tx-to">${this._esc(t.to || '')}</span>
                        <span class="cl-tx-deliverable">${this._esc(t.deliverable || '')}</span>
                        <span class="cl-pill cl-pill-${t.type || 'tangible'}">${this._esc(t.type || '')}</span>
                        <span class="cl-tx-metric">${t.lead_time_hours || '?'}h LT</span>
                    </div>
                `).join('')}
            </div>`;
    }

    _htmlTabCanvas() {
        const c = this._draft.canvas;
        const p = this._draft.pitch;
        if (!c && !p) {
            return `<div class="cl-skel-canvas">
                <div class="cl-skel-hint">🎨 Canvas + Pitch apareixerà aquí · visió, missió, valors, stakeholders + pitch 6 seccions</div>
                <h3 style="opacity:0.4;">Canvas</h3>
                ${['Visió', 'Missió', 'Valors', 'Stakeholders', 'North Star'].map(l => `
                    <div class="cl-canvas-block">
                        <strong style="opacity:0.5;">${l}</strong>
                        <div class="cl-skel-line"></div>
                        <div class="cl-skel-line" style="width:60%;"></div>
                    </div>`).join('')}
            </div>`;
        }
        return `
            <div class="cl-canvas">
                ${c ? `
                    <h3>Canvas</h3>
                    <div class="cl-canvas-block cl-fade-in"><strong>Visió</strong><p>${this._esc(c.vision || '')}</p></div>
                    <div class="cl-canvas-block cl-fade-in"><strong>Missió</strong><p>${this._esc(c.mission || '')}</p></div>
                    <div class="cl-canvas-block cl-fade-in"><strong>Valors</strong><p>${(c.values || []).map(v => this._esc(v)).join(' · ')}</p></div>
                    <div class="cl-canvas-block cl-fade-in"><strong>Stakeholders</strong><p>${(c.stakeholders || []).map(s => this._esc(s)).join(' · ')}</p></div>
                    <div class="cl-canvas-block cl-fade-in"><strong>North Star</strong><p>${this._esc(c.northStar || '')}</p></div>
                ` : ''}
                ${p ? `
                    <h3>Pitch</h3>
                    <div class="cl-canvas-block cl-fade-in"><strong>Headline</strong><p>${this._esc(p.headline || '')}</p></div>
                    <div class="cl-canvas-block cl-fade-in"><strong>Problem</strong><p>${this._esc(p.problem || '')}</p></div>
                    <div class="cl-canvas-block cl-fade-in"><strong>Solution</strong><p>${this._esc(p.solution || '')}</p></div>
                    <div class="cl-canvas-block cl-fade-in"><strong>Market</strong><p>${this._esc(p.market || '')}</p></div>
                    <div class="cl-canvas-block cl-fade-in"><strong>Business</strong><p>${this._esc(p.business || '')}</p></div>
                ` : ''}
            </div>`;
    }

    _htmlTabWos() {
        const wos = this._draft.wos;
        const sops = this._draft.sops;
        const isAi = (this._payload?.generationMode === 'ai-driven');
        const amb = this._payload?.ambition || 'standard';
        if (!wos.length && !sops.length) {
            // Hint adaptat per ambition · light/macro NO promet WOs perquè no s'inclouen
            const hintByAmb = {
                light: '✏️ MODE LIGHT · SOPs essencials apareixeran aquí. Per a Work Orders executables · puja a STANDARD o MAX (cost més alt · qualitat més detallada).',
                standard: '⚡ MODE STANDARD · SOPs amb steps detallats + Work Orders al Kanban apareixeran aquí.',
                max: '🏆 MODE MAX · SOPs profundes + WOs concrets amb DTD test booleà · llests per arrencar el primer sprint.',
            };
            const hint = isAi ? (hintByAmb[amb] || hintByAmb.standard) : 'Mode template · activa "ai-driven" per generar WOs';
            return `<div class="cl-skel-wos">
                <div class="cl-skel-hint">${hint}</div>
                ${[1,2,3].map(() => `<div class="cl-skel-wo"><div class="cl-skel-line" style="width:70%;"></div><div class="cl-skel-line" style="width:40%;"></div></div>`).join('')}
            </div>`;
        }
        return `
            ${sops.length ? `
                <h4>SOPs · ${sops.length}</h4>
                <div class="cl-sop-list">
                    ${sops.map(s => `
                        <div class="cl-sop-row cl-fade-in">
                            <strong>${this._esc(s.title || s.id || '?')}</strong>
                            <span class="cl-sop-role">@${this._esc(s.role_ref || s.roleId || '?')}</span>
                            <span class="cl-sop-steps">${(s.steps || []).length} steps</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            ${wos.length ? `
                <h4 style="margin-top:14px;">Work Orders · ${wos.length}</h4>
                <div class="cl-wo-list">
                    ${wos.map(w => `
                        <div class="cl-wo-row cl-fade-in">
                            <strong>${this._esc(w.title || w.id)}</strong>
                            <span class="cl-wo-meta">SOP ${this._esc(w.sop_ref || '?')} · ${w.estimated_hours || '?'}h · ${this._esc(w.approval_rule || 'manual')}</span>
                            <p class="cl-wo-desc">${this._esc((w.description || '').slice(0, 200))}</p>
                            ${w.dtd_test ? `<p class="cl-wo-dtd">DTD · ${this._esc(w.dtd_test)}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}`;
    }

    _renderFinishBar(result) {
        const pid = result.project.id;
        const el = document.getElementById('clFinishBar');
        if (!el) return;
        const isGold = result.score >= 85;
        const amb = this._payload?.ambition || 'standard';
        const statusEmoji = isGold ? '🏆' : result.score >= 70 ? '✨' : result.score >= 50 ? '👍' : '🚧';
        // Text adaptat per ambition · MAX gold = "Mega producte legendari"
        let statusText = 'Esborrany';
        if (isGold)              statusText = (amb === 'max') ? 'Mega producte llegendari' : (amb === 'light' ? 'Light brillant' : 'Llegendari');
        else if (result.score >= 70) statusText = (amb === 'max') ? 'Solidesa alta' : 'Sòlid';
        else if (result.score >= 50) statusText = 'Operatiu';

        // Primary CTA · si max amb WOs · Kanban · si no · Mapa de valor
        const hasWos = (result.wos || []).length > 0;
        const primary = hasWos
            ? `<a href="/kanban?project=${encodeURIComponent(pid)}" data-link class="cl-btn-primary cl-btn-hero">⚡ Comença sprint Kanban →</a>`
            : `<a href="/map?project=${encodeURIComponent(pid)}" data-link class="cl-btn-primary cl-btn-hero">📊 Explora el mapa de valor →</a>`;

        el.innerHTML = `
            <div class="cl-finish-info">
                <div class="cl-finish-badge cl-finish-badge-${result.status || 'silver'}">${statusEmoji} ${statusText}</div>
                <div class="cl-finish-meta">
                    <strong>${result.score}/100</strong> · ${result.roles.length} rols · ${result.sops.length} SOPs${hasWos ? ' · ' + result.wos.length + ' WOs' : ''} · <strong>${(result.cost || 0).toFixed(4)}€</strong>
                </div>
            </div>
            <div class="cl-finish-cta">
                ${primary}
                <div class="cl-finish-secondary">
                    ${hasWos ? `<a href="/map?project=${encodeURIComponent(pid)}" data-link class="cl-btn">📊 Mapa</a>` : `<a href="/kanban?project=${encodeURIComponent(pid)}" data-link class="cl-btn">📋 Kanban</a>`}
                    <a href="/quality?project=${encodeURIComponent(pid)}" data-link class="cl-btn">🎯 Qualitat</a>
                    <a href="/hub/${encodeURIComponent(pid)}" data-link class="cl-btn">🏢 Hub</a>
                </div>
            </div>`;
        el.style.display = 'flex';
        if (isGold) el.classList.add('cl-finish-gold');
    }

    _renderErrorBar(result) {
        const el = document.getElementById('clFinishBar');
        if (!el) return;
        el.innerHTML = `
            <div class="cl-finish-info cl-finish-error">
                <strong>✘ Score sota llindar</strong> · ${result.score}/100 ·
                ${result.missing.length} criteris fallits · integritat ${result.integrity?.ok ? '✓' : (result.integrity?.errorCount + ' errors')}
            </div>
            <div class="cl-finish-cta">
                <a href="/create" data-link class="cl-btn">↺ Tornar i ajustar</a>
            </div>`;
        el.style.display = 'flex';
    }

    _currentHandle() {
        try {
            const m = store.getState?.()?.user_identity?.content?.handle;
            return m || null;
        } catch (_) { return null; }
    }

    _esc(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    _htmlMain() {
        return `
        <style>
            .cl-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); padding:14px 18px 80px; }
            .cl-empty { text-align:center; padding:80px 20px; color:var(--text-secondary); }
            .cl-header { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-start; gap:14px; padding-bottom:14px; border-bottom:1px solid var(--border-default); margin-bottom:14px; }
            .cl-header h1 { margin:0 0 4px 0; font-size:1.25rem; }
            .cl-header .cl-descr { color:var(--text-secondary); font-size:0.9rem; max-width:60ch; }
            .cl-header-main { flex:1; min-width:280px; }
            .cl-meta-pills { display:flex; gap:6px; flex-wrap:wrap; align-self:flex-start; }
            .cl-meta-pill { background:rgba(255,255,255,0.04); border:1px solid var(--border-default); border-radius:999px; padding:3px 10px; font-size:0.75rem; }
            .cl-meta-pill strong { color:var(--accent-indigo); }

            /* AMBITION BANNER (legendary-all-ambitions sprint) */
            .cl-ambition-banner { display:inline-flex; align-items:center; gap:8px; padding:6px 14px; border-radius:999px; margin-bottom:8px; font-weight:700; font-size:0.78rem; letter-spacing:0.05em; text-transform:uppercase; }
            .cl-ambition-banner.cl-amb-light    { background:linear-gradient(90deg,rgba(96,165,250,0.18),rgba(59,130,246,0.10)); color:#60a5fa; border:1px solid rgba(96,165,250,0.4); }
            .cl-ambition-banner.cl-amb-standard { background:linear-gradient(90deg,rgba(168,85,247,0.20),rgba(99,102,241,0.10)); color:#c8b3ff; border:1px solid rgba(168,85,247,0.4); }
            .cl-ambition-banner.cl-amb-max      { background:linear-gradient(90deg,rgba(251,191,36,0.20),rgba(245,158,11,0.10)); color:#fbbf24; border:1px solid rgba(251,191,36,0.4); box-shadow:0 0 16px rgba(251,191,36,0.25); }
            .cl-ambition-icon { font-size:1rem; }

            .cl-narrative { margin-top:10px; font-size:0.85rem; color:var(--text-secondary); line-height:1.55; padding:8px 12px; background:rgba(255,255,255,0.025); border-left:3px solid var(--accent-indigo); border-radius:0 6px 6px 0; font-style:italic; }
            .cl-progress-wrap { width:100%; height:4px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden; margin-bottom:14px; position:relative; }
            .cl-progress-fill { height:100%; background:linear-gradient(90deg,#22c55e,#3b82f6); transition:width 0.3s ease; width:0%; }
            .cl-progress-pct { position:absolute; right:6px; top:-18px; font-size:0.7rem; color:var(--text-secondary); font-family:var(--font-mono); }
            .cl-pipeline-dots { display:flex; gap:4px; flex-wrap:wrap; margin-bottom:14px; }
            .cl-dot { display:flex; align-items:center; gap:4px; padding:4px 8px; border-radius:999px; font-size:0.7rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-default); }
            .cl-dot-pending { opacity:0.4; }
            .cl-dot-running { background:rgba(59,130,246,0.18); border-color:#3b82f6; animation:cl-pulse 1.2s infinite; }
            .cl-dot-done { background:rgba(34,197,94,0.18); border-color:#22c55e; }
            .cl-dot-error { background:rgba(239,68,68,0.18); border-color:#ef4444; }
            @keyframes cl-pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
            .cl-dot-icon { font-weight:700; }

            .cl-split { display:grid; grid-template-columns: 1.5fr 1fr; gap:14px; align-items:start; }
            @media (max-width: 980px) { .cl-split { grid-template-columns: 1fr; } }

            .cl-preview { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:10px; overflow:hidden; }
            .cl-tabbar { display:flex; gap:0; border-bottom:1px solid var(--border-default); background:rgba(0,0,0,0.18); }
            .cl-tab { flex:1; background:transparent; border:none; color:var(--text-secondary); padding:10px 12px; cursor:pointer; font-size:0.85rem; border-bottom:2px solid transparent; display:flex; gap:6px; justify-content:center; align-items:center; }
            .cl-tab.active { color:var(--text-main); border-bottom-color:var(--accent-indigo); }
            .cl-tab-count { background:rgba(255,255,255,0.08); border-radius:999px; padding:0 6px; font-size:0.7rem; }
            .cl-tab-body { padding:16px; min-height:340px; max-height:60vh; overflow-y:auto; }
            .cl-empty-tab { padding:36px; text-align:center; color:var(--text-secondary); font-size:0.85rem; }

            /* Skeletons (legendary sprint · espera amb pistes visuals) */
            .cl-skel-hint { padding:10px 14px; background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2); border-radius:8px; color:var(--text-secondary); font-size:0.78rem; margin-bottom:12px; line-height:1.5; }
            .cl-skel-castell .cl-skel-row { display:flex; align-items:center; gap:10px; padding:6px 0; opacity:0.4; }
            .cl-skel-label { width:180px; font-size:0.85rem; color:var(--text-muted); }
            .cl-skel-pill { height:22px; width:120px; background:rgba(255,255,255,0.04); border-radius:6px; }
            .cl-skel-pulse { animation:cl-pulse 1.4s ease-in-out infinite; }
            .cl-skel-tx, .cl-skel-wo { height:42px; background:rgba(255,255,255,0.03); border-radius:6px; margin-bottom:6px; animation:cl-pulse 1.4s ease-in-out infinite; padding:8px 10px; }
            .cl-skel-wo .cl-skel-line { background:rgba(255,255,255,0.06); height:10px; border-radius:3px; margin:4px 0; }
            .cl-skel-canvas .cl-skel-line { background:rgba(255,255,255,0.04); height:9px; border-radius:3px; margin:4px 0; width:100%; animation:cl-pulse 1.6s ease-in-out infinite; }
            @keyframes cl-pulse {
                0%, 100% { opacity:0.35; }
                50%      { opacity:0.7; }
            }

            /* Fade-in quan el draft s'omple */
            .cl-fade-in {
                animation:cl-fade-in 0.4s ease-out;
            }
            @keyframes cl-fade-in {
                from { opacity:0; transform:translateY(4px); }
                to   { opacity:1; transform:translateY(0); }
            }

            .cl-castell .cl-castell-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px dashed rgba(255,255,255,0.06); }
            .cl-castell-lbl { width:180px; font-size:0.85rem; color:var(--accent-indigo); }
            .cl-castell-roles { display:flex; gap:6px; flex-wrap:wrap; flex:1; }
            .cl-role-pill { background:rgba(99,102,241,0.18); border:1px solid rgba(99,102,241,0.35); padding:3px 8px; border-radius:6px; font-size:0.78rem; }
            .cl-role-empty { color:rgba(255,255,255,0.25); font-size:0.78rem; }

            .cl-mapa-summary { display:flex; gap:6px; margin-bottom:12px; flex-wrap:wrap; }
            .cl-pill { background:rgba(255,255,255,0.05); border:1px solid var(--border-default); padding:3px 8px; border-radius:999px; font-size:0.75rem; }
            .cl-pill-tangible { background:rgba(34,197,94,0.15); border-color:#22c55e; }
            .cl-pill-intangible { background:rgba(168,85,247,0.15); border-color:#a855f7; }
            .cl-mapa-list { display:flex; flex-direction:column; gap:4px; }
            .cl-tx-row { display:flex; align-items:center; gap:8px; padding:6px 8px; background:rgba(255,255,255,0.02); border-radius:6px; font-size:0.78rem; flex-wrap:wrap; }
            .cl-tx-from, .cl-tx-to { font-weight:600; }
            .cl-tx-arrow { color:var(--accent-indigo); }
            .cl-tx-deliverable { color:var(--text-secondary); flex:1; }
            .cl-tx-metric { font-family:var(--font-mono); font-size:0.7rem; color:var(--text-secondary); }

            .cl-canvas h3 { margin:14px 0 8px 0; font-size:0.95rem; color:var(--accent-indigo); }
            .cl-canvas h3:first-child { margin-top:0; }
            .cl-canvas-block { margin-bottom:10px; }
            .cl-canvas-block strong { font-size:0.8rem; color:var(--text-secondary); display:block; margin-bottom:2px; }
            .cl-canvas-block p { margin:0; font-size:0.85rem; line-height:1.5; }

            .cl-sop-row, .cl-wo-row { background:rgba(255,255,255,0.03); border:1px solid var(--border-default); padding:8px 10px; border-radius:6px; margin-bottom:6px; }
            .cl-sop-row strong, .cl-wo-row strong { display:block; margin-bottom:2px; font-size:0.85rem; }
            .cl-sop-role, .cl-sop-steps, .cl-wo-meta { font-size:0.72rem; color:var(--text-secondary); font-family:var(--font-mono); }
            .cl-wo-desc { font-size:0.78rem; color:var(--text-secondary); margin:4px 0 2px 0; line-height:1.4; }
            .cl-wo-dtd { font-size:0.72rem; color:#22c55e; margin:2px 0; font-family:var(--font-mono); }

            .cl-side { display:flex; flex-direction:column; gap:12px; }
            .cl-side-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:10px; padding:12px 14px; }
            .cl-side-card h3 { margin:0 0 8px 0; font-size:0.85rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em; }

            .cl-gauge { display:flex; align-items:baseline; gap:10px; }
            .cl-gauge-num { font-size:2.4rem; font-weight:700; line-height:1; }
            .cl-gauge-lbl { font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; }
            .cl-gauge-gold .cl-gauge-num { color:#fbbf24; }
            .cl-gauge-silver .cl-gauge-num { color:#cbd5e1; }
            .cl-gauge-bronze .cl-gauge-num { color:#d97706; }
            .cl-gauge-red .cl-gauge-num { color:#ef4444; }
            .cl-gauge-meta { margin-top:4px; font-size:0.75rem; color:var(--text-secondary); }

            .cl-cost-total { font-size:1.4rem; font-weight:700; color:#22c55e; margin-bottom:6px; font-family:var(--font-mono); }
            .cl-cost-row { display:flex; justify-content:space-between; font-size:0.75rem; font-family:var(--font-mono); padding:2px 0; color:var(--text-secondary); }

            .cl-evrow { display:flex; gap:6px; padding:3px 0; font-size:0.72rem; font-family:var(--font-mono); border-bottom:1px dashed rgba(255,255,255,0.03); }
            .cl-ev-done .cl-ev-status { color:#22c55e; }
            .cl-ev-error .cl-ev-status { color:#ef4444; }
            .cl-ev-start .cl-ev-status { color:#3b82f6; }
            .cl-ev-step { font-weight:600; min-width:90px; }
            .cl-ev-extra { color:var(--text-secondary); }

            .cl-finish-bar { display:none; position:fixed; bottom:0; left:0; right:0; padding:14px 20px; background:rgba(15,16,20,0.96); border-top:1px solid var(--border-default); backdrop-filter:blur(12px); z-index:30; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap; }
            .cl-finish-info { display:flex; flex-direction:column; gap:4px; }
            .cl-finish-badge { display:inline-block; padding:5px 12px; border-radius:999px; font-size:0.82rem; font-weight:700; letter-spacing:0.02em; align-self:flex-start; }
            .cl-finish-badge-gold { background:linear-gradient(90deg,#fbbf24,#f59e0b); color:#000; box-shadow:0 0 24px rgba(251,191,36,0.5); }
            .cl-finish-badge-silver { background:linear-gradient(90deg,#cbd5e1,#94a3b8); color:#000; }
            .cl-finish-badge-bronze { background:linear-gradient(90deg,#d97706,#92400e); color:#fff; }
            .cl-finish-badge-red { background:linear-gradient(90deg,#ef4444,#b91c1c); color:#fff; }
            .cl-finish-meta { font-size:0.82rem; color:var(--text-secondary); font-family:var(--font-mono); }
            .cl-finish-meta strong { color:var(--text-main); }
            .cl-finish-error strong { color:#ef4444; }
            .cl-finish-cta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
            .cl-finish-secondary { display:flex; gap:5px; }
            .cl-btn, .cl-btn-primary { padding:7px 14px; border-radius:6px; border:1px solid var(--border-default); background:rgba(255,255,255,0.04); color:var(--text-main); text-decoration:none; font-size:0.85rem; transition:all 0.15s; }
            .cl-btn-primary { background:linear-gradient(90deg,#3b82f6,#6366f1); border-color:transparent; font-weight:600; }
            .cl-btn-hero { padding:10px 20px; font-size:0.92rem; box-shadow:0 4px 12px rgba(99,102,241,0.4); }
            .cl-btn:hover, .cl-btn-primary:hover { filter:brightness(1.15); transform:translateY(-1px); }
            .cl-finish-gold { animation:cl-celebrate 0.6s ease-out; }
            @keyframes cl-celebrate {
                0%   { transform:translateY(20px); opacity:0; }
                60%  { transform:translateY(-4px); opacity:1; }
                100% { transform:translateY(0); }
            }
        </style>

        <div id="clRoot" class="cl-shell">
            <div class="cl-header" id="clHeader">
                <div class="cl-header-main">
                    <div class="cl-ambition-banner" id="clAmbitionBanner">
                        <span class="cl-ambition-icon" id="clAmbitionIcon">⚡</span>
                        <span class="cl-ambition-label" id="clAmbitionLabel">CREANT…</span>
                    </div>
                    <h1>🚀 Creant <span id="clProjectName">…</span></h1>
                    <div class="cl-descr" id="clProjectDescr">…</div>
                    <div class="cl-narrative" id="clNarrative">Preparant pipeline…</div>
                </div>
                <div class="cl-meta-pills">
                    <span class="cl-meta-pill">sector · <strong id="clSector">—</strong></span>
                    <span class="cl-meta-pill">zoom · <strong id="clZoom">—</strong></span>
                    <span class="cl-meta-pill">entitat · <strong id="clEntityType">—</strong></span>
                    <span class="cl-meta-pill" id="clAmbitionPill">ambition · <strong id="clAmbition">—</strong></span>
                    <span class="cl-meta-pill" id="clBudgetPill">inversió · <strong id="clBudget">—</strong></span>
                    <button id="clCancelBtn" class="cl-btn" style="background:transparent;padding:3px 10px;">cancel·la</button>
                </div>
            </div>

            <div class="cl-progress-wrap">
                <span class="cl-progress-pct" id="clProgressPct">0%</span>
                <div class="cl-progress-fill" id="clProgressFill"></div>
            </div>

            <div id="clPipelineDots" class="cl-pipeline-dots"></div>

            <div class="cl-split">
                <div class="cl-preview">
                    <div class="cl-tabbar">
                        <button class="cl-tab active" data-cl-tab="castell">🏰 Castell <span class="cl-tab-count"></span></button>
                        <button class="cl-tab"        data-cl-tab="mapa">📊 Mapa valor <span class="cl-tab-count"></span></button>
                        <button class="cl-tab"        data-cl-tab="canvas">🎨 Canvas + Pitch <span class="cl-tab-count"></span></button>
                        <button class="cl-tab"        data-cl-tab="wos">⚡ SOPs + WOs <span class="cl-tab-count"></span></button>
                    </div>
                    <div id="clTabBody" class="cl-tab-body">
                        <div class="cl-empty-tab">— Iniciant pipeline... —</div>
                    </div>
                </div>

                <div class="cl-side">
                    <div class="cl-side-card">
                        <h3>Qualitat · rubric</h3>
                        <div id="clQualityScore">
                            <div class="cl-gauge cl-gauge-red"><div class="cl-gauge-num">—</div><div class="cl-gauge-lbl">pending</div></div>
                            <div class="cl-gauge-meta">esperant validate…</div>
                        </div>
                    </div>
                    <div class="cl-side-card">
                        <h3>Cost IA</h3>
                        <div id="clCostTracker">
                            <div class="cl-cost-total">0.0000€</div>
                            <div class="cl-cost-list"></div>
                        </div>
                    </div>
                    <div class="cl-side-card">
                        <h3>Event log (live)</h3>
                        <div id="clEventLog" style="max-height:280px; overflow-y:auto;"></div>
                    </div>
                </div>
            </div>

            <div id="clFinishBar" class="cl-finish-bar"></div>
        </div>`;
    }
}
