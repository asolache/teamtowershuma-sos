// =============================================================================
// TEAMTOWERS SOS V11 — PROCESS CATALOG VIEW (PROCESS-CATALOG-001 sprint UI)
// Ruta · /js/views/ProcessCatalogView.js  →  /process-catalog
//
// Marketplace de plantilles de procés reusables · 15 templates (5 types ×
// 3 stages) de C2-TEMPLATES-001 (PR #97) · cada un explora canvasFocus ·
// pitchTone · valueFlowEmphasis · roleSuggestions · sopFocus · critical_kpis.
//
// L'usuari pot · veure detall · clonar a un projecte existent · usar com
// a base per a nou projecte (link a /create amb classification pre-seleccionada).
// =============================================================================

import {
    listTemplates, listSimplifiedTypes, listStageGroups,
    SIMPLIFIED_TYPES, STAGE_GROUPS, PROJECT_TEMPLATES,
} from '../core/projectTemplateService.js';
import { emptyStateHtml, toast } from '../core/uxComponents.js';

export default class ProcessCatalogView {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Process Catalog · SOS';
        this._filterType = null;
        this._filterStage = null;
        this._selected = null;
    }

    async getHtml() {
        return this._renderShell();
    }

    async afterRender() {
        this._bind();
    }

    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    _renderShell() {
        const templates = listTemplates();
        const filtered = templates.filter(t => {
            if (this._filterType && t.type !== this._filterType) return false;
            if (this._filterStage && t.stage !== this._filterStage) return false;
            return true;
        });

        return `
        <style>
            .pcat-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); padding-bottom:2rem; }
            .pcat-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); }
            .pcat-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .pcat-logo span { color:var(--accent-indigo); }

            .pcat-main { max-width:1100px; margin:0 auto; padding:1.2rem 1rem; }

            .pcat-hero { background:linear-gradient(135deg,rgba(168,85,247,0.15),rgba(99,102,241,0.08)); border:1px solid rgba(168,85,247,0.3); border-radius:10px; padding:1.2rem 1.4rem; margin-bottom:1rem; }
            .pcat-hero h1 { margin:0 0 0.4rem 0; font-size:1.5rem; }
            .pcat-hero p { margin:0; color:var(--text-secondary); font-size:0.9rem; line-height:1.55; }

            .pcat-filters { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:0.8rem 1rem; margin-bottom:1rem; }
            .pcat-filter-row { display:flex; gap:6px; flex-wrap:wrap; align-items:center; margin-bottom:0.4rem; }
            .pcat-filter-row:last-child { margin-bottom:0; }
            .pcat-filter-label { font-size:0.72rem; color:var(--text-secondary); font-weight:700; text-transform:uppercase; letter-spacing:0.04em; margin-right:6px; min-width:70px; }
            .pcat-pill { padding:4px 10px; border-radius:999px; font-size:0.72rem; font-weight:600; background:var(--bg-dark); color:var(--text-secondary); border:1px solid var(--border-default); cursor:pointer; }
            .pcat-pill:hover { color:var(--text-main); }
            .pcat-pill.active { background:rgba(99,102,241,0.18); color:#a8b2ff; border-color:rgba(99,102,241,0.4); }

            .pcat-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:0.8rem; }
            .pcat-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem 1.2rem; cursor:pointer; transition:all 0.15s; }
            .pcat-card:hover { border-color:var(--accent-indigo); transform:translateY(-2px); }
            .pcat-card .head { display:flex; gap:8px; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; }
            .pcat-card .type-pill { padding:2px 8px; border-radius:4px; font-size:0.65rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; background:rgba(99,102,241,0.18); color:#a8b2ff; }
            .pcat-card .stage-pill { padding:2px 8px; border-radius:4px; font-size:0.65rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; }
            .pcat-card .stage-pill.early { background:rgba(34,197,94,0.18); color:#22c55e; }
            .pcat-card .stage-pill.scaling { background:rgba(250,204,21,0.18); color:#facc15; }
            .pcat-card .stage-pill.consolidated { background:rgba(168,85,247,0.18); color:#c4b5fd; }
            .pcat-card .ttl { font-weight:700; font-size:0.92rem; line-height:1.3; margin-bottom:0.4rem; }
            .pcat-card .focus { font-size:0.78rem; color:var(--text-secondary); line-height:1.5; margin-bottom:0.5rem; }
            .pcat-card .stats { display:flex; gap:6px; font-size:0.68rem; color:var(--text-muted); flex-wrap:wrap; margin-top:0.4rem; }
            .pcat-card .stats span { padding:1px 6px; border-radius:3px; background:rgba(148,163,184,0.1); }

            .pcat-detail { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1.4rem 1.6rem; margin-top:1rem; display:none; }
            .pcat-detail.active { display:block; }
            .pcat-detail h2 { margin:0 0 0.6rem 0; font-size:1.2rem; }
            .pcat-detail h3 { margin:1rem 0 0.4rem 0; font-size:0.92rem; color:#a8b2ff; }
            .pcat-detail .section { margin-bottom:0.8rem; }
            .pcat-detail .section p { margin:0; color:var(--text-secondary); font-size:0.85rem; line-height:1.6; }
            .pcat-detail ul { margin:0.3rem 0 0 1rem; padding:0; }
            .pcat-detail li { font-size:0.85rem; color:var(--text-main); line-height:1.6; }
            .pcat-detail .role-pattern { font-size:0.8rem; color:var(--text-secondary); padding:4px 0; }
            .pcat-detail .actions { display:flex; gap:8px; margin-top:1rem; flex-wrap:wrap; }
            .pcat-detail .btn { padding:8px 14px; border-radius:6px; font-size:0.85rem; font-weight:700; cursor:pointer; border:1px solid var(--border-default); background:var(--bg-dark); color:var(--text-main); text-decoration:none; display:inline-block; }
            .pcat-detail .btn-primary { background:linear-gradient(135deg,#a855f7,#6366f1); color:#fff; border-color:transparent; }
            .pcat-detail .btn-close { background:transparent; }
        </style>

        <div class="pcat-shell">
            <div class="pcat-topbar">
                <a href="/home" data-link class="pcat-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Process Catalog</span>
            </div>

            <div class="pcat-main">
                <div class="pcat-hero">
                    <h1>🗺 Catàleg de processos · ${templates.length} plantilles</h1>
                    <p>Plantilles reusables · 5 tipus de projecte × 3 fases · cada una amb canvas focus · pitch tone · value flow emphasis · roles suggerits · transactions patterns · SOPs prioritaris · KPIs crítics. Click una plantilla per detall · clica "Usar com a base" per crear projecte amb classificació pre-seleccionada.</p>
                </div>

                <div class="pcat-filters">
                    <div class="pcat-filter-row">
                        <span class="pcat-filter-label">Tipus</span>
                        <button class="pcat-pill ${!this._filterType ? 'active' : ''}" data-filter-type="">Tots</button>
                        ${listSimplifiedTypes().map(t => `
                            <button class="pcat-pill ${this._filterType === t.key ? 'active' : ''}" data-filter-type="${t.key}">${this._esc(t.label.split(' ·')[0])}</button>
                        `).join('')}
                    </div>
                    <div class="pcat-filter-row">
                        <span class="pcat-filter-label">Fase</span>
                        <button class="pcat-pill ${!this._filterStage ? 'active' : ''}" data-filter-stage="">Totes</button>
                        ${listStageGroups().map(s => `
                            <button class="pcat-pill ${this._filterStage === s.key ? 'active' : ''}" data-filter-stage="${s.key}">${this._esc(s.label.split(' ·')[0])}</button>
                        `).join('')}
                    </div>
                </div>

                ${filtered.length === 0
                    ? emptyStateHtml({
                        icon: '🔍', title: 'Cap plantilla amb aquests filtres',
                        body: 'Treu un filtre per veure més plantilles · o explora les 15 plantilles disponibles.',
                    })
                    : `<div class="pcat-grid">${filtered.map(t => this._renderCard(t)).join('')}</div>`
                }

                <div class="pcat-detail" id="pcatDetail"></div>
            </div>
        </div>`;
    }

    _renderCard(t) {
        const typeLabel = SIMPLIFIED_TYPES[t.type]?.label || t.type;
        const stageLabel = STAGE_GROUPS[t.stage]?.label || t.stage;
        const roleCount = (t.roleSuggestions || []).length;
        const sopCount = (t.sopFocus || []).length;
        const kpiCount = (t.critical_kpis || []).length;
        return `
        <div class="pcat-card" data-template="${this._esc(t.key)}">
            <div class="head">
                <span class="type-pill">${this._esc(typeLabel.split(' ·')[0])}</span>
                <span class="stage-pill ${t.stage}">${this._esc(stageLabel.split(' ·')[0])}</span>
            </div>
            <div class="ttl">${this._esc(t.canvasFocus.split('·')[0]).slice(0, 80)}...</div>
            <div class="focus">${this._esc(t.valueFlowEmphasis)}</div>
            <div class="stats">
                <span>🧑‍🤝‍🧑 ${roleCount} rols</span>
                <span>📜 ${sopCount} SOPs</span>
                <span>🎯 ${kpiCount} KPIs</span>
            </div>
        </div>`;
    }

    _renderDetail(t) {
        if (!t) return;
        const detail = document.getElementById('pcatDetail');
        if (!detail) return;
        const typeLabel = SIMPLIFIED_TYPES[t.type]?.label || t.type;
        const stageLabel = STAGE_GROUPS[t.stage]?.label || t.stage;
        detail.innerHTML = `
            <h2>📌 ${this._esc(typeLabel)} · ${this._esc(stageLabel)}</h2>

            <div class="section">
                <h3>🎯 Canvas focus</h3>
                <p>${this._esc(t.canvasFocus)}</p>
            </div>

            <div class="section">
                <h3>🌊 Value flow emphasis</h3>
                <p>${this._esc(t.valueFlowEmphasis)}</p>
            </div>

            <div class="section">
                <h3>📣 Pitch tone</h3>
                <p>${this._esc(t.pitchTone)}</p>
            </div>

            <div class="section">
                <h3>🧑‍🤝‍🧑 Roles suggerits</h3>
                <ul>
                    ${(t.roleSuggestions || []).map(r => `<li>${this._esc(r)}</li>`).join('') || '<li class="role-pattern">cap</li>'}
                </ul>
            </div>

            ${(t.transactionPatterns || []).length > 0 ? `
            <div class="section">
                <h3>🔄 Transaction patterns (Verna Allee)</h3>
                <ul>
                    ${t.transactionPatterns.map(p => `
                        <li>${this._esc(p.from)} → ${this._esc(p.to)} · <span style="color:${p.kind === 'tangible' ? '#22c55e' : '#facc15'};">${this._esc(p.kind)}</span> · ${this._esc(p.label)}</li>
                    `).join('')}
                </ul>
            </div>` : ''}

            <div class="section">
                <h3>📜 SOPs prioritaris</h3>
                <ul>
                    ${(t.sopFocus || []).map(s => `<li><code style="font-family:var(--font-mono);font-size:0.78rem;background:var(--bg-dark);padding:1px 6px;border-radius:3px;">${this._esc(s)}</code></li>`).join('') || '<li class="role-pattern">cap</li>'}
                </ul>
            </div>

            <div class="section">
                <h3>🎯 KPIs crítics</h3>
                <ul>
                    ${(t.critical_kpis || []).map(k => `<li>${this._esc(k)}</li>`).join('') || '<li class="role-pattern">cap</li>'}
                </ul>
            </div>

            <div class="actions">
                <a href="/create?template=${encodeURIComponent(t.key)}" data-link class="btn btn-primary">🚀 Usa com a base · Crear projecte</a>
                <button class="btn" data-action="copy-key">📋 Copia template key · ${this._esc(t.key)}</button>
                <button class="btn btn-close" data-action="close">✕ Tanca</button>
            </div>
        `;
        detail.classList.add('active');
        detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this._bindDetailActions(t);
    }

    _bind() {
        // Filter type
        document.querySelectorAll('[data-filter-type]').forEach(btn => {
            btn.addEventListener('click', async () => {
                this._filterType = btn.dataset.filterType || null;
                await this.render();
            });
        });
        // Filter stage
        document.querySelectorAll('[data-filter-stage]').forEach(btn => {
            btn.addEventListener('click', async () => {
                this._filterStage = btn.dataset.filterStage || null;
                await this.render();
            });
        });
        // Card click · open detail
        document.querySelectorAll('[data-template]').forEach(card => {
            card.addEventListener('click', () => {
                const key = card.dataset.template;
                const tpl = PROJECT_TEMPLATES[key];
                if (tpl) {
                    const fullTpl = { key, type: key.split(':')[0], stage: key.split(':')[1], ...tpl };
                    this._selected = fullTpl;
                    this._renderDetail(fullTpl);
                }
            });
        });
    }

    _bindDetailActions(t) {
        document.querySelector('[data-action="close"]')?.addEventListener('click', () => {
            document.getElementById('pcatDetail')?.classList.remove('active');
        });
        document.querySelector('[data-action="copy-key"]')?.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(t.key);
                toast({ kind: 'success', text: 'Template key copiada · ' + t.key });
            } catch (_) {
                toast({ kind: 'error', text: 'Error copiant · clipboard sense permís' });
            }
        });
    }

    _esc(s) {
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    destroy() {}
}

export const TPL_VERSION = 'process-catalog-v1.0';
