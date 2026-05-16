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

        if (!this._payload || !this._payload.name) {
            this._renderEmpty();
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
            window.location.href = '/create';
        });

        // Render header
        document.getElementById('clProjectName').textContent = this._payload.name;
        document.getElementById('clProjectDescr').textContent = this._payload.description || '(sense descripció)';
        document.getElementById('clSector').textContent = this._payload.sector || '—';
        document.getElementById('clAmbition').textContent = this._payload.ambition || 'light';
        document.getElementById('clZoom').textContent = this._payload.vna_zoom || 'mid';
        document.getElementById('clEntityType').textContent = this._payload.entity_type || 'auto';
        document.getElementById('clGenMode').textContent = this._payload.generationMode || 'ai-driven';

        // Llançar pipeline · streaming
        await this._runPipeline();
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
        if (!roles.length) return `<div class="cl-empty-tab">— Esperant rols del pipeline... —</div>`;
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
                            ${(byLevel[lvl] || []).map(r => `<span class="cl-role-pill">${this._esc(r.name || r.id)}</span>`).join('') || '<span class="cl-role-empty">—</span>'}
                        </div>
                    </div>
                `).join('')}
            </div>`;
    }

    _htmlTabMapa() {
        const txs = this._draft.transactions;
        const roles = this._draft.roles;
        if (!txs.length) return `<div class="cl-empty-tab">— Esperant transaccions... —</div>`;
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
                    <div class="cl-tx-row">
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
        if (!c && !p) return `<div class="cl-empty-tab">— Esperant canvas/pitch... —</div>`;
        return `
            <div class="cl-canvas">
                ${c ? `
                    <h3>Canvas</h3>
                    <div class="cl-canvas-block"><strong>Visió</strong><p>${this._esc(c.vision || '')}</p></div>
                    <div class="cl-canvas-block"><strong>Missió</strong><p>${this._esc(c.mission || '')}</p></div>
                    <div class="cl-canvas-block"><strong>Valors</strong><p>${(c.values || []).map(v => this._esc(v)).join(' · ')}</p></div>
                    <div class="cl-canvas-block"><strong>Stakeholders</strong><p>${(c.stakeholders || []).map(s => this._esc(s)).join(' · ')}</p></div>
                    <div class="cl-canvas-block"><strong>North Star</strong><p>${this._esc(c.northStar || '')}</p></div>
                ` : ''}
                ${p ? `
                    <h3>Pitch</h3>
                    <div class="cl-canvas-block"><strong>Headline</strong><p>${this._esc(p.headline || '')}</p></div>
                    <div class="cl-canvas-block"><strong>Problem</strong><p>${this._esc(p.problem || '')}</p></div>
                    <div class="cl-canvas-block"><strong>Solution</strong><p>${this._esc(p.solution || '')}</p></div>
                    <div class="cl-canvas-block"><strong>Market</strong><p>${this._esc(p.market || '')}</p></div>
                    <div class="cl-canvas-block"><strong>Business</strong><p>${this._esc(p.business || '')}</p></div>
                ` : ''}
            </div>`;
    }

    _htmlTabWos() {
        const wos = this._draft.wos;
        const sops = this._draft.sops;
        const isAi = (this._payload?.generationMode === 'ai-driven');
        if (!wos.length && !sops.length) {
            return `<div class="cl-empty-tab">— ${isAi ? 'Esperant WOs de la IA...' : 'Mode template · activa "ai-driven" per generar WOs'} —</div>`;
        }
        return `
            ${sops.length ? `
                <h4>SOPs · ${sops.length}</h4>
                <div class="cl-sop-list">
                    ${sops.map(s => `
                        <div class="cl-sop-row">
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
                        <div class="cl-wo-row">
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
        el.innerHTML = `
            <div class="cl-finish-info">
                <strong>✓ Projecte creat</strong> · score <strong>${result.score}/100</strong> (${result.status}) ·
                ${result.roles.length} rols · ${result.sops.length} SOPs · ${(result.wos || []).length} WOs ·
                cost <strong>${(result.cost || 0).toFixed(4)}€</strong>
            </div>
            <div class="cl-finish-cta">
                <a href="/kanban?project=${encodeURIComponent(pid)}" data-link class="cl-btn-primary">⚡ Comença sprint Kanban</a>
                <a href="/map?project=${encodeURIComponent(pid)}" data-link class="cl-btn">📊 Mapa de valor</a>
                <a href="/quality?project=${encodeURIComponent(pid)}" data-link class="cl-btn">🎯 Audit qualitat</a>
                <a href="/hub/${encodeURIComponent(pid)}" data-link class="cl-btn">🏢 Hub projecte</a>
            </div>`;
        el.style.display = 'flex';
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
            .cl-meta-pills { display:flex; gap:6px; flex-wrap:wrap; }
            .cl-meta-pill { background:rgba(255,255,255,0.04); border:1px solid var(--border-default); border-radius:999px; padding:3px 10px; font-size:0.75rem; }
            .cl-meta-pill strong { color:var(--accent-indigo); }
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

            .cl-finish-bar { display:none; position:fixed; bottom:0; left:0; right:0; padding:12px 18px; background:rgba(15,16,20,0.94); border-top:1px solid var(--border-default); backdrop-filter:blur(10px); z-index:30; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap; }
            .cl-finish-info { font-size:0.88rem; }
            .cl-finish-info strong { color:#22c55e; }
            .cl-finish-error strong { color:#ef4444; }
            .cl-finish-cta { display:flex; gap:6px; flex-wrap:wrap; }
            .cl-btn, .cl-btn-primary { padding:7px 14px; border-radius:6px; border:1px solid var(--border-default); background:rgba(255,255,255,0.04); color:var(--text-main); text-decoration:none; font-size:0.85rem; }
            .cl-btn-primary { background:linear-gradient(90deg,#3b82f6,#6366f1); border-color:transparent; font-weight:600; }
            .cl-btn:hover, .cl-btn-primary:hover { filter:brightness(1.15); }
        </style>

        <div id="clRoot" class="cl-shell">
            <div class="cl-header">
                <div>
                    <h1>🚀 Creant <span id="clProjectName">…</span></h1>
                    <div class="cl-descr" id="clProjectDescr">…</div>
                </div>
                <div class="cl-meta-pills">
                    <span class="cl-meta-pill">sector · <strong id="clSector">—</strong></span>
                    <span class="cl-meta-pill">ambition · <strong id="clAmbition">—</strong></span>
                    <span class="cl-meta-pill">zoom · <strong id="clZoom">—</strong></span>
                    <span class="cl-meta-pill">entitat · <strong id="clEntityType">—</strong></span>
                    <span class="cl-meta-pill">mode · <strong id="clGenMode">—</strong></span>
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
