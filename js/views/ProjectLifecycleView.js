// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT LIFECYCLE VIEW (LIFECYCLE-DASHBOARD sprint A)
// Ruta · /js/views/ProjectLifecycleView.js  →  /lifecycle?project={id}
//
// Vista única que mostra l'estat de cicle d'un projecte SOS · 10 fases ·
// completion % global · next-best-action prominent · CTA per a cada fase ·
// retro-deferred · si una fase és Wave 1 pendent · es mostra amb badge clar.
//
// Reusa · lifecycleService (pure) · KB queries per a entries/sops/wos/etc.
// =============================================================================

import { KB } from '../core/kb.js';
import { LEDGER_ENTRY_TYPE } from '../core/ledgerService.js';
import {
    computeProjectLifecycle,
    LIFECYCLE_PHASES,
} from '../core/lifecycleService.js';

const STATUS_META = {
    done:    { color: '#22c55e', bg: '#22c55e20', icon: '✅', label: 'COMPLETA' },
    partial: { color: '#facc15', bg: '#facc1520', icon: '🟡', label: 'EN CURS'  },
    pending: { color: '#94a3b8', bg: '#94a3b820', icon: '⏳', label: 'PENDENT'  },
    na:      { color: '#64748b', bg: '#64748b20', icon: '·',  label: 'N/A'      },
};

export default class ProjectLifecycleView {

    constructor() {
        document.title = 'Project Lifecycle · SOS V11';
        try {
            const u = new URL(window.location.href);
            this.projectId = u.searchParams.get('project') || null;
        } catch (_) { this.projectId = null; }
        this.project = null;
        this.lifecycle = null;
    }

    async getHtml() {
        if (!this.projectId) return this._htmlNoProject();
        try { this.project = await KB.getNode(this.projectId); } catch (_) { this.project = null; }
        if (!this.project) return this._htmlNotFound();

        // Fetch totes les entitats relacionades · defensive
        const [ledgerEntries, sops, workOrders, pacts, workshops, marketItems, invoices, tokenomics, pitches, proposals] = await Promise.all([
            KB.query({ type: LEDGER_ENTRY_TYPE,   projectId: this.projectId }).catch(() => []),
            KB.query({ type: 'sop',               projectId: this.projectId }).catch(() => []),
            KB.query({ type: 'work_order',        projectId: this.projectId }).catch(() => []),
            KB.query({ type: 'pact',              projectId: this.projectId }).catch(() => []),
            KB.query({ type: 'workshop',          projectId: this.projectId }).catch(() => []),
            KB.query({ type: 'market_item',       projectId: this.projectId }).catch(() => []),
            KB.query({ type: 'invoice',           projectId: this.projectId }).catch(() => []),
            KB.query({ type: 'token_design',      projectId: this.projectId }).catch(() => []),
            KB.query({ type: 'project_pitch',     projectId: this.projectId }).catch(() => []),
            KB.query({ type: 'proposal',          projectId: this.projectId }).catch(() => []),
        ]);

        this.lifecycle = computeProjectLifecycle({
            project: this.project,
            ledgerEntries: ledgerEntries || [],
            sops:          sops          || [],
            workOrders:    workOrders    || [],
            pacts:         pacts         || [],
            workshops:     workshops     || [],
            marketItems:   marketItems   || [],
            invoices:      invoices      || [],
            tokenomics:    tokenomics    || [],
            pitches:       pitches       || [],
            proposals:     proposals     || [],
        });
        return this._htmlMain();
    }

    async afterRender() { /* res necessari · sols data-link gestiona el router */ }

    _htmlNoProject() {
        return `
        <div style="min-height:100dvh;background:var(--bg-dark);color:var(--text-main);font-family:var(--font-base);padding:2rem;">
            <div style="max-width:600px;margin:4rem auto;text-align:center;background:var(--bg-panel);padding:2rem;border-radius:8px;border:1px solid var(--border-default);">
                <h1>🌀 Project Lifecycle</h1>
                <p>Cal indicar quin projecte vols veure · <code>?project=&lt;projectId&gt;</code>.</p>
                <a href="/dashboard" data-link style="color:var(--accent-indigo);">← Tornar al dashboard</a>
            </div>
        </div>`;
    }

    _htmlNotFound() {
        return `
        <div style="min-height:100dvh;background:var(--bg-dark);color:var(--text-main);font-family:var(--font-base);padding:2rem;">
            <div style="max-width:600px;margin:4rem auto;text-align:center;background:var(--bg-panel);padding:2rem;border-radius:8px;border:1px solid var(--border-default);">
                <h1>⚠ Projecte no trobat</h1>
                <p><code>${this._esc(this.projectId)}</code></p>
                <a href="/dashboard" data-link style="color:var(--accent-indigo);">← Tornar al dashboard</a>
            </div>
        </div>`;
    }

    _htmlMain() {
        const lc = this.lifecycle;
        const projName = this.project.nombre || this.project.name || this.project.id;
        const overall = lc.overall;
        const nba = lc.nextBestAction;

        // Group phases by kind
        const byKind = {};
        for (const ph of lc.phases) {
            (byKind[ph.kind] = byKind[ph.kind] || []).push(ph);
        }
        const kindOrder = [
            { key: 'foundation', label: '1 · Fundació',   color: '#6366f1' },
            { key: 'execution',  label: '2 · Execució',   color: '#3b82f6' },
            { key: 'value',      label: '3 · Valor',      color: '#a855f7' },
            { key: 'commercial', label: '4 · Comercial',  color: '#22c55e' },
        ];

        const phaseCard = (ph) => {
            const meta = STATUS_META[ph.status] || STATUS_META.na;
            const completionBar = `<div style="height:4px;background:#0008;border-radius:2px;overflow:hidden;margin-top:6px;"><div style="height:100%;width:${Math.round((ph.completion || 0) * 100)}%;background:${meta.color};transition:width 0.4s;"></div></div>`;
            const cta = ph.href
                ? `<a href="${ph.href}" data-link class="lf-cta">${this._esc(ph.nextAction || ('Anar a ' + ph.label))}</a>`
                : (ph.nextAction ? `<span class="lf-soon" title="Wave 1 pendent · backlog programat">${this._esc(ph.nextAction)} · 🔜</span>` : '');
            return `
                <div class="lf-card" data-phase="${ph.id}" style="border-left:4px solid ${meta.color};">
                    <div class="lf-card-head">
                        <span class="lf-icon">${meta.icon}</span>
                        <div style="flex:1;min-width:0;">
                            <div class="lf-title">${this._esc(ph.label)}</div>
                            <div class="lf-detail">${this._esc(ph.detail)}</div>
                        </div>
                        <span class="lf-badge" style="background:${meta.bg};color:${meta.color};">${meta.label}</span>
                    </div>
                    ${completionBar}
                    <div class="lf-actions">${cta}</div>
                </div>
            `;
        };

        const sections = kindOrder.map(k => {
            const phases = byKind[k.key] || [];
            if (phases.length === 0) return '';
            return `
                <div class="lf-section">
                    <h2 class="lf-section-title" style="border-bottom-color:${k.color};">${k.label}</h2>
                    <div class="lf-grid">${phases.map(phaseCard).join('')}</div>
                </div>
            `;
        }).join('');

        const nbaCard = nba ? `
            <div class="lf-nba">
                <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">⚡ Next best action</div>
                <div style="font-size:1.05rem;font-weight:700;margin-bottom:6px;">${this._esc(nba.label)}</div>
                ${nba.href ? `<a href="${nba.href}" data-link class="lf-nba-cta">→ Anar-hi ara</a>` : '<span style="color:var(--text-muted);font-size:0.82rem;">Wave 1 backlog · pendent</span>'}
            </div>
        ` : `
            <div class="lf-nba lf-nba-done">
                <div style="font-size:1.2rem;font-weight:700;margin-bottom:4px;">🎉 Cicle complet</div>
                <div style="font-size:0.85rem;color:var(--text-secondary);">Totes les fases han arribat a estat 'done' o 'partial'. Continua iterant qualitat.</div>
            </div>
        `;

        return `
        <style>
            .lf-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); }
            .lf-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-wrap:wrap; }
            .lf-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .lf-logo span { color:var(--accent-indigo); }
            .lf-main { max-width:1200px; margin:0 auto; padding:1.5rem; }
            .lf-header { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1.2rem 1.4rem; margin-bottom:1.4rem; }
            .lf-progress-wrap { display:flex; align-items:center; gap:12px; margin-top:0.8rem; }
            .lf-progress { flex:1; height:10px; background:#0008; border-radius:5px; overflow:hidden; }
            .lf-progress-fill { height:100%; background:linear-gradient(90deg,#6366f1,#a855f7,#22c55e); transition:width 0.6s; }
            .lf-progress-text { font-family:var(--font-mono); font-size:0.85rem; color:var(--text-secondary); }
            .lf-nba { background:linear-gradient(135deg,#6366f120,#22c55e20); border:1px solid #6366f150; border-radius:8px; padding:0.9rem 1.2rem; margin-top:1rem; }
            .lf-nba-done { background:linear-gradient(135deg,#22c55e30,#facc1530); border-color:#22c55e80; }
            .lf-nba-cta { display:inline-block; padding:6px 14px; background:var(--accent-indigo); color:#fff; text-decoration:none; border-radius:4px; font-size:0.82rem; font-weight:600; }
            .lf-section { margin-bottom:1.5rem; }
            .lf-section-title { font-size:0.95rem; margin:0 0 0.8rem 0; padding-bottom:6px; border-bottom:2px solid; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em; font-family:var(--font-mono); font-weight:700; }
            .lf-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:0.8rem; }
            .lf-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:6px; padding:0.8rem 1rem; }
            .lf-card-head { display:flex; align-items:flex-start; gap:8px; }
            .lf-icon { font-size:1.1rem; flex-shrink:0; }
            .lf-title { font-weight:700; font-size:0.9rem; }
            .lf-detail { font-size:0.75rem; color:var(--text-muted); margin-top:2px; line-height:1.4; }
            .lf-badge { font-size:9px; font-weight:700; padding:2px 7px; border-radius:999px; font-family:var(--font-mono); letter-spacing:0.04em; flex-shrink:0; }
            .lf-actions { margin-top:8px; }
            .lf-cta { display:inline-block; font-size:0.78rem; color:var(--accent-indigo); text-decoration:none; font-weight:600; padding:4px 8px; border-radius:3px; background:var(--bg-dark); border:1px solid var(--border-default); }
            .lf-cta:hover { background:var(--glass-hover); color:var(--text-main); }
            .lf-soon { font-size:0.75rem; color:var(--text-muted); font-style:italic; }
        </style>
        <div class="lf-shell">
            <div class="lf-topbar">
                <a href="/dashboard" data-link class="lf-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Lifecycle</span>
                <span style="flex:1;"></span>
                <a href="/project/${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">← Hub</a>
            </div>
            <div class="lf-main">
                <div class="lf-header">
                    <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;">
                        <h1 style="margin:0;font-size:1.35rem;">🌀 ${this._esc(projName)}</h1>
                        <div style="font-family:var(--font-mono);font-size:0.85rem;color:var(--text-secondary);">${overall.doneCount} / ${overall.totalCount} fases · <strong style="color:var(--text-main);">${overall.percent}%</strong></div>
                    </div>
                    <div class="lf-progress-wrap">
                        <div class="lf-progress"><div class="lf-progress-fill" style="width:${overall.percent}%;"></div></div>
                        <div class="lf-progress-text">${overall.percent}%</div>
                    </div>
                    <div style="margin-top:8px;font-size:0.78rem;color:var(--text-muted);line-height:1.5;">Project Lifecycle SOS · 10 fases agrupades en 4 capes (fundació · execució · valor · comercial). Items amb 🔜 estan al backlog Wave 1 i es desbloquegen pròxim sprint.</div>
                    ${nbaCard}
                </div>

                ${sections}
            </div>
        </div>`;
    }

    _esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
