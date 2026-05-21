// =============================================================================
// TEAMTOWERS SOS V11 — MatriuCurriculumView (v163)
// Vista read-only del currículum pedagògic teamtowers-matriu (submodule a
// /knowledge/matriu/). Llista els 11 dominis · permet obrir un domini i veure
// frontmatter (sos_module, competències referenciades, cop_ref). Click a
// competència → carrega fitxer competency.
// Pure read · sense edicions · sense LLM · sense API key.
// =============================================================================

import { KnowledgeLoader } from '../core/KnowledgeLoader.js';

export default class MatriuCurriculumView {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Matriu currículum · SOS';
        this._domains = null;
        this._activeDomain = null;
        this._activeCompetency = null;
    }

    async getHtml() {
        return `
        <div class="container" style="max-width:1200px;margin:0 auto;padding:1.5rem;">
            <header style="margin-bottom:1rem;">
                <h1 style="margin:0;">📚 Matriu currículum</h1>
                <p style="color:var(--text-muted);font-size:0.85rem;margin:6px 0 0;">
                    Currículum pedagògic teamtowers-matriu · 11 dominis · read-only ·
                    <code>knowledge/matriu/</code> (submodule).
                </p>
            </header>
            <div style="display:grid;grid-template-columns:340px 1fr;gap:18px;">
                <aside id="mcDomains"  style="background:var(--bg-elevated);border-radius:8px;padding:12px;font-size:0.85rem;max-height:80vh;overflow:auto;">
                    <div style="color:var(--text-muted);">⏳ carregant dominis…</div>
                </aside>
                <main  id="mcPanel"    style="background:var(--bg-elevated);border-radius:8px;padding:14px;font-size:0.88rem;min-height:60vh;">
                    <div style="color:var(--text-muted);">Selecciona un domini a l'esquerra.</div>
                </main>
            </div>
        </div>`;
    }

    async afterRender() {
        await this._loadDomainList();
    }

    async _loadDomainList() {
        const aside = document.getElementById('mcDomains');
        if (!aside) return;
        try {
            this._domains = await KnowledgeLoader.listMatriuDomains();
        } catch (e) {
            aside.innerHTML = '<div style="color:var(--accent-red);">Error · ' + this._esc(e?.message || String(e)) + '</div>';
            return;
        }
        if (!this._domains || !this._domains.length) {
            aside.innerHTML = '<div style="color:var(--accent-red);">Cap domini trobat · verifica submodule knowledge/matriu.</div>';
            return;
        }
        const statusColor = { complete: '#22c55e', draft: '#f59e0b', stub: '#6b7280', missing: '#ef4444', unknown: '#94a3b8' };
        aside.innerHTML = this._domains.map(d => {
            const c = statusColor[d.status] || statusColor.unknown;
            return `<button data-domain="${this._esc(d.id)}"
                    style="display:block;width:100%;text-align:left;background:transparent;border:0;border-radius:6px;padding:8px 10px;margin-bottom:4px;color:var(--text-primary);cursor:pointer;border-left:3px solid ${c};"
                    onmouseover="this.style.background='rgba(255,255,255,0.04)'" onmouseout="this.style.background='transparent'">
                <div style="font-weight:600;">${this._esc(d.id)}</div>
                <div style="font-size:0.78rem;color:var(--text-secondary);">${this._esc(d.name)}</div>
                <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px;">
                    ${d.sos_module ? '🧩 ' + this._esc(d.sos_module) : '<em>—</em>'} · ${this._esc(d.status)}
                </div>
            </button>`;
        }).join('');
        aside.querySelectorAll('button[data-domain]').forEach(btn => {
            btn.addEventListener('click', () => this._openDomain(btn.dataset.domain));
        });
    }

    async _openDomain(domainId) {
        this._activeDomain = domainId;
        this._activeCompetency = null;
        const panel = document.getElementById('mcPanel');
        if (!panel) return;
        panel.innerHTML = '<div style="color:var(--text-muted);">⏳ carregant ' + this._esc(domainId) + '…</div>';
        const d = await KnowledgeLoader.getMatriuDomain(domainId);
        if (!d) {
            panel.innerHTML = '<div style="color:var(--accent-red);">No s\'ha pogut carregar ' + this._esc(domainId) + '</div>';
            return;
        }
        const fm = d.frontmatter || {};
        const comps = Array.isArray(fm.competencies) ? fm.competencies : [];
        const compsHtml = comps.length
            ? comps.map(c => `<button data-comp="${this._esc(c)}" style="display:inline-block;margin:2px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:4px;padding:3px 8px;font-size:0.78rem;color:var(--text-primary);cursor:pointer;font-family:var(--font-mono);">${this._esc(c)}</button>`).join('')
            : '<em style="color:var(--text-muted);">cap competència referenciada</em>';
        panel.innerHTML = `
            <h2 style="margin:0 0 6px;">${this._esc(fm.name || domainId)}</h2>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:10px;">
                ${this._esc(domainId)} · status <code>${this._esc(fm.status || '—')}</code> · mode <code>${this._esc(fm.mode || '—')}</code> · sos_module <code>${this._esc(fm.sos_module || '—')}</code> · cop_ref <code>${this._esc(fm.cop_ref || '—')}</code>
            </div>
            <div style="background:rgba(59,130,246,0.08);border-radius:6px;padding:10px;margin-bottom:10px;font-size:0.82rem;">
                <strong>Objectiu</strong><br>${this._esc(fm.objective || '(sense objectiu)')}
            </div>
            <div style="margin-bottom:10px;">
                <strong style="font-size:0.85rem;">Competències (${comps.length})</strong><br>
                ${compsHtml}
            </div>
            <div id="mcCompetency"></div>
            <details style="margin-top:12px;">
                <summary style="cursor:pointer;color:var(--text-secondary);font-size:0.82rem;">Body markdown raw</summary>
                <pre style="background:var(--bg-base);padding:10px;border-radius:6px;font-size:0.74rem;white-space:pre-wrap;max-height:50vh;overflow:auto;">${this._esc(d.body || '(buit)')}</pre>
            </details>`;
        panel.querySelectorAll('button[data-comp]').forEach(btn => {
            btn.addEventListener('click', () => this._openCompetency(btn.dataset.comp));
        });
    }

    async _openCompetency(competencyId) {
        this._activeCompetency = competencyId;
        const slot = document.getElementById('mcCompetency');
        if (!slot) return;
        slot.innerHTML = '<div style="color:var(--text-muted);">⏳ carregant ' + this._esc(competencyId) + '…</div>';
        const c = await KnowledgeLoader.getMatriuCompetency(competencyId);
        if (!c) {
            slot.innerHTML = '<div style="color:var(--accent-red);">No trobada · ' + this._esc(competencyId) + '</div>';
            return;
        }
        const fm = c.frontmatter || {};
        const skillSeeds = Array.isArray(fm.skill_seeds) ? fm.skill_seeds : [];
        const sops       = Array.isArray(fm.sops)        ? fm.sops        : [];
        slot.innerHTML = `
            <div style="border-top:1px solid var(--border-default);margin-top:8px;padding-top:8px;">
                <h3 style="margin:0 0 4px;font-size:1rem;">${this._esc(fm.name || competencyId)}</h3>
                <div style="font-size:0.76rem;color:var(--text-muted);margin-bottom:6px;font-family:var(--font-mono);">${this._esc(competencyId)}</div>
                <div style="font-size:0.82rem;margin-bottom:6px;">${this._esc(fm.objective || '(sense objectiu)')}</div>
                <div style="font-size:0.78rem;color:var(--text-secondary);">
                    skill_seeds · ${skillSeeds.length ? skillSeeds.map(s => '<code>' + this._esc(s) + '</code>').join(' · ') : '—'}<br>
                    sops · ${sops.length ? sops.map(s => '<code>' + this._esc(s) + '</code>').join(' · ') : '—'}<br>
                    effort · ${this._esc(fm.effort_estimate_hours || '—')} h · cop_ref · <code>${this._esc(fm.cop_ref || '—')}</code>
                </div>
            </div>`;
    }

    _esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
}
