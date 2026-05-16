// =============================================================================
// TEAMTOWERS SOS V11 — INVESTOR PITCH VIEW (PITCH-REFRAME-001 sprint B)
// Ruta · /js/views/InvestorPitchView.js  →  /pitch-doc/{projectId}
//
// Document visual sintetitzat AUTOMÀTICAMENT des de canvas + VNA + tokenomics
// + ledger + proposals. L'usuari NO omple seccions · clica "Generate" · IA
// sintetitza · usuari valida text final. Exportable a PDF (window.print).
//
// L'antic /pitch?project=X (formulari 6 caselles) segueix viu per a
// power-users que volen control fine-grain.
// =============================================================================

import { KB } from '../core/kb.js';
import { findProjectByIdAny } from '../core/projectLookup.js';
import {
    buildSynthesisContext, buildHeuristicPitch, synthesizePitch,
} from '../core/pitchSynthesisService.js';
import { formatCostEur } from '../core/aiCostTracker.js';

export default class InvestorPitchView {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Investor Pitch · SOS';
        const path = (typeof window !== 'undefined' && window.location) ? window.location.pathname : '';
        this.projectId = path.replace(/^\/pitch-doc\//, '').replace(/\/$/, '').split('/')[0] || null;
        this._isSynthesizing = false;
        this._project = null;
    }

    // Router pattern · getHtml + afterRender
    async getHtml() {
        const project = this.projectId ? await findProjectByIdAny(this.projectId) : null;
        this._project = project;
        if (!project) return this._renderNotFound();

        const cached = project.content?.investorPitch || null;

        const [canvas, ledger, invoices, proposals, tokenomics, org] = await Promise.all([
            this._loadCanvas(project),
            this._loadByType('ledger_entry', project.id),
            this._loadByType('invoice', project.id),
            this._loadByType('proposal', project.id),
            this._loadTokenomics(project.id),
            project.orgId ? KB.getNode(project.orgId).catch(() => null) : Promise.resolve(null),
        ]);

        this._context = buildSynthesisContext({
            project, canvas, ledger, invoices, proposals, tokenomics, org,
        });

        const initialPitch = cached || buildHeuristicPitch(this._context);
        return this._renderShell({ project, pitch: initialPitch, isCached: !!cached });
    }

    async afterRender() {
        if (this._project) this._bind({ project: this._project });
    }

    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    _renderShell({ project, pitch, isCached }) {
        const stage = this._context.classification?.stage || '—';
        const heuristic = !isCached;
        return `
        <style>
            .ipv-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); }
            .ipv-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-wrap:wrap; }
            .ipv-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .ipv-logo span { color:var(--accent-indigo); }
            .ipv-back { color:var(--text-secondary); text-decoration:none; font-size:0.78rem; padding:6px 10px; border-radius:4px; }
            .ipv-back:hover { color:var(--text-main); background:var(--glass-hover); }

            .ipv-main { max-width:780px; margin:0 auto; padding:1.5rem; }

            .ipv-actions { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:1.2rem; align-items:center; }
            .ipv-btn { padding:8px 16px; border-radius:6px; font-size:0.85rem; font-weight:700; cursor:pointer; border:1px solid var(--border-default); background:var(--bg-panel); color:var(--text-main); }
            .ipv-btn-primary { background:linear-gradient(135deg,#a855f7,#6366f1); color:#fff; border-color:transparent; }
            .ipv-btn-primary:hover { filter:brightness(1.1); }
            .ipv-btn:hover { background:var(--glass-hover); }
            .ipv-btn[disabled] { opacity:0.5; cursor:wait; }
            .ipv-source { margin-left:auto; font-size:0.72rem; color:var(--text-secondary); }
            .ipv-source.heuristic { color:#facc15; }
            .ipv-source.ai { color:#22c55e; }

            .ipv-feedback { padding:10px 14px; border-radius:6px; margin-bottom:1rem; display:none; }
            .ipv-feedback.thinking { display:block; background:linear-gradient(135deg,rgba(168,85,247,0.15),rgba(99,102,241,0.08)); border:1px solid rgba(168,85,247,0.3); color:#d4a8ff; }
            .ipv-feedback.error { display:block; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.4); color:#ef4444; }
            .ipv-feedback.ok { display:block; background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.4); color:#22c55e; }

            .ipv-doc { background:#fff; color:#1a1a1a; padding:3rem 2.5rem; border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.4); font-family:'Helvetica Neue',Arial,sans-serif; line-height:1.7; }
            .ipv-tagline { font-size:1.4rem; font-weight:300; color:#5b5fc0; line-height:1.3; margin-bottom:0.4rem; font-style:italic; }
            .ipv-projname { font-size:2rem; font-weight:800; letter-spacing:-0.02em; margin:0 0 0.3rem 0; color:#1a1a1a; }
            .ipv-stage { display:inline-block; padding:3px 12px; background:#f0f0ff; color:#5b5fc0; font-size:0.72rem; font-weight:700; border-radius:999px; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:1.5rem; }

            .ipv-section { margin-bottom:1.8rem; padding-bottom:1.4rem; border-bottom:1px solid #eee; }
            .ipv-section:last-child { border-bottom:none; }
            .ipv-section-label { font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#888; margin-bottom:0.5rem; }
            .ipv-section-body { font-size:1rem; color:#222; }
            .ipv-section-body[contenteditable="true"] { padding:6px 8px; background:#fffbe8; border-radius:4px; outline:1px dashed #facc15; }

            .ipv-doc-foot { margin-top:1.5rem; padding-top:1rem; border-top:1px solid #eee; font-size:0.72rem; color:#888; display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; }

            @media print {
                .ipv-topbar, .ipv-actions, .ipv-feedback { display:none !important; }
                .ipv-doc { box-shadow:none; padding:1.5cm; }
                body, .ipv-shell { background:#fff !important; }
            }
        </style>
        <div class="ipv-shell">
            <div class="ipv-topbar">
                <a href="/dashboard" data-link class="ipv-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Investor Pitch</span>
                <span style="flex:1;"></span>
                <a href="/pitch?project=${encodeURIComponent(project.id)}" data-link class="ipv-back">↩ Editor avançat</a>
                <a href="/hub/${encodeURIComponent(project.id)}" data-link class="ipv-back">← Project Hub</a>
            </div>

            <div class="ipv-main">
                <div class="ipv-actions">
                    <button class="ipv-btn ipv-btn-primary" data-act="synthesize">🧠 Sintetitzar amb IA</button>
                    <button class="ipv-btn" data-act="edit" title="Activar edició inline">✏️ Editar text</button>
                    <button class="ipv-btn" data-act="save" style="display:none;">💾 Desar</button>
                    <button class="ipv-btn" data-act="print">📄 Exportar PDF</button>
                    <span class="ipv-source ${isCached ? 'ai' : 'heuristic'}" data-src>
                        ${isCached ? '🤖 IA · ' + this._formatTime(pitch.synthesizedAt) : '✏️ Heuristic · clica "Sintetitzar" per a IA'}
                    </span>
                </div>

                <div class="ipv-feedback" data-feedback></div>

                <div class="ipv-doc" data-doc>
                    <div class="ipv-tagline" data-section="tagline">${this._esc(pitch.tagline || '')}</div>
                    <h1 class="ipv-projname">${this._esc(project.nombre || project.name)}</h1>
                    <div class="ipv-stage">${this._esc(stage)}</div>

                    ${this._renderSection('hero',     '', pitch.hero)}
                    ${this._renderSection('problem',  'El problema',  pitch.problem)}
                    ${this._renderSection('solution', 'La solució',   pitch.solution)}
                    ${this._renderSection('traction', 'Tracció',      pitch.traction)}
                    ${this._renderSection('team',     'Equip',        pitch.team)}
                    ${this._renderSection('ask',      'Què demanem',  pitch.ask)}
                    ${this._renderSection('vision',   'La nostra visió', pitch.vision)}

                    <div class="ipv-doc-foot">
                        <span>${this._esc(project.id)}</span>
                        <span>SOS V11 · Investor Pitch</span>
                    </div>
                </div>
            </div>
        </div>`;
    }

    _renderSection(id, label, value) {
        return `
        <div class="ipv-section" data-section-wrap="${id}">
            ${label ? `<div class="ipv-section-label">${this._esc(label)}</div>` : ''}
            <div class="ipv-section-body" data-section="${id}">${this._esc(value || '(pendent)')}</div>
        </div>`;
    }

    _renderNotFound() {
        return `
        <div style="padding:2rem;text-align:center;font-family:var(--font-base);color:var(--text-main);">
            <h1>⚠ Projecte no trobat</h1>
            <p>L'id <code>${this._esc(this.projectId)}</code> no existeix.</p>
            <a href="/dashboard" data-link style="color:var(--accent-indigo);">← Dashboard</a>
        </div>`;
    }

    _bind({ project }) {
        const synthBtn = document.querySelector('[data-act="synthesize"]');
        const editBtn  = document.querySelector('[data-act="edit"]');
        const saveBtn  = document.querySelector('[data-act="save"]');
        const printBtn = document.querySelector('[data-act="print"]');
        const fb       = document.querySelector('[data-feedback]');
        const src      = document.querySelector('[data-src]');

        const setFb = (kind, msg) => {
            if (!fb) return;
            fb.className = 'ipv-feedback' + (kind ? ' ' + kind : '');
            fb.textContent = msg || '';
        };

        synthBtn?.addEventListener('click', async () => {
            if (this._isSynthesizing) return;
            this._isSynthesizing = true;
            synthBtn.disabled = true;
            synthBtn.textContent = '⏳ Sintetitzant...';
            setFb('thinking', '🧠 IA llegint canvas + VNA + tokenomics + ledger + proposals · pot trigar 10-30s...');
            try {
                const result = await synthesizePitch(this._context, { projectId: project.id });
                if (!result.ok) {
                    setFb('error', '✗ ' + (result.reason || 'IA failed') + ' · prova de nou o omple manualment');
                    return;
                }
                this._updateSectionsInDom(result.pitch);
                // Persist al projecte
                project.content = project.content || {};
                project.content.investorPitch = result.pitch;
                try { await KB.upsert(project); } catch (_) {}
                if (src) {
                    src.className = 'ipv-source ai';
                    src.textContent = '🤖 IA · ' + (result.modelKey || 'unknown') + ' · ' + formatCostEur(result.cost || 0);
                }
                setFb('ok', '✓ Sintetitzat amb èxit · ' + (result.source === 'cache' ? 'cache hit (cost 0)' : ('cost ' + formatCostEur(result.cost || 0))));
                setTimeout(() => setFb(null, ''), 5000);
            } catch (e) {
                setFb('error', '✗ Error · ' + (e?.message || e));
            } finally {
                this._isSynthesizing = false;
                synthBtn.disabled = false;
                synthBtn.textContent = '🧠 Sintetitzar amb IA';
            }
        });

        editBtn?.addEventListener('click', () => {
            document.querySelectorAll('[data-section]').forEach(el => {
                el.contentEditable = 'true';
            });
            editBtn.style.display = 'none';
            if (saveBtn) saveBtn.style.display = '';
            setFb('thinking', '✏️ Mode edició actiu · clica "Desar" quan acabis');
        });

        saveBtn?.addEventListener('click', async () => {
            const updated = {};
            document.querySelectorAll('[data-section]').forEach(el => {
                const id = el.getAttribute('data-section');
                updated[id] = (el.textContent || '').trim();
                el.contentEditable = 'false';
            });
            // Merge amb pitch existent
            const existing = project.content?.investorPitch || {};
            const merged = { ...existing, ...updated, editedAt: Date.now() };
            project.content = project.content || {};
            project.content.investorPitch = merged;
            try { await KB.upsert(project); } catch (_) {}
            saveBtn.style.display = 'none';
            if (editBtn) editBtn.style.display = '';
            setFb('ok', '✓ Desat al KB');
            setTimeout(() => setFb(null, ''), 3000);
        });

        printBtn?.addEventListener('click', () => {
            window.print();
        });
    }

    _updateSectionsInDom(pitch) {
        for (const k of ['tagline', 'hero', 'problem', 'solution', 'traction', 'team', 'ask', 'vision']) {
            const el = document.querySelector('[data-section="' + k + '"]');
            if (el && pitch[k]) el.textContent = pitch[k];
        }
    }

    // ── Loaders ────────────────────────────────────────────────────────────

    async _loadCanvas(project) {
        if (project.content?.canvas) return project.content.canvas;
        try {
            const canvases = await KB.query({ type: 'project_canvas' });
            return canvases.find(c => c.projectId === project.id || c.content?.projectId === project.id) || null;
        } catch (_) { return null; }
    }

    async _loadByType(type, projectId) {
        try {
            const all = await KB.query({ type });
            return all.filter(n => n.content?.projectId === projectId || n.projectId === projectId);
        } catch (_) { return []; }
    }

    async _loadTokenomics(projectId) {
        try {
            const all = await KB.query({ type: 'token_design' });
            return all.find(t => t.content?.projectId === projectId) || null;
        } catch (_) { return null; }
    }

    _formatTime(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleString();
    }

    _esc(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    destroy() {}
}
