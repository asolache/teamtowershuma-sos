// =============================================================================
// TEAMTOWERS SOS V11 — EFFICIENCY VIEW (KM-001 sprint E2)
// Ruta: /js/views/EfficiencyView.js · matchea /efficiency
//
// Dashboard de eficiencia IA: lista los efficiency_log que persiste el
// Orchestrator cuando hay context pruning activo. Muestra acumulado de
// tokens "antes" (sin pruning estimado) vs "después" (real con pruning),
// ahorro neto y coste evitado en USD.
//
// Argumento de venta cuantificable para BILL-001 alfa privada · cuadro
// real de "ahorro acumulado" del sistema.
// =============================================================================

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import { renderNavLinksHtml, renderNavGroupedHtml, ensureNavGroupStyle, bindNavGroupDropdowns } from '../core/navService.js';
import { renderExplainerBadge, bindExplainerBadges, ensureExplainerStyle } from '../core/didacticService.js';

// Paleta de costes por provider (mirroring del Orchestrator BASE_PRICING)
// USD per 1M tokens · sirve para extrapolar coste evitado.
const PRICING = {
    anthropic: { input: 3.00,  output: 15.00 },
    openai:    { input: 2.50,  output: 10.00 },
    deepseek:  { input: 0.14,  output: 0.28  },
    gemini:    { input: 0.075, output: 0.30  },
    minimax:   { input: 0.20,  output: 1.10  },
    custom:    { input: 0.0,   output: 0.0   },
};

export default class EfficiencyView {
    constructor() {
        document.title = 'Efficiency · SOS V11';
        this.logs = [];
    }

    async getHtml() {
        await store.init();
        return `
        <style>
            .ef-shell  { height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); display:flex; flex-direction:column; overflow:hidden; }
            .ef-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; flex-wrap:wrap; min-height:48px; box-sizing:border-box; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-shrink:0; flex-wrap:wrap; }
            .ef-logo   { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .ef-logo span { color:var(--accent-indigo); }
            .ef-title  { color:var(--text-secondary); font-weight:500; letter-spacing:0.05em; text-transform:uppercase; font-size:0.78rem; }
            .ef-spacer { flex:1; }
            .ef-link { color:var(--text-secondary); text-decoration:none; font-size:var(--text-xs); font-weight:600; padding:6px 10px; border-radius:var(--radius-sm); transition:all var(--dur-fast); display:inline-flex; align-items:center; gap:4px; white-space:nowrap; }
            .ef-link:hover { color:var(--text-main); background:var(--glass-hover); }
            .ef-link:focus-visible { outline:2px solid var(--accent-indigo); outline-offset:2px; }

            .ef-main   { padding:1.5rem; max-width:1080px; margin:0 auto; flex:1; overflow-y:auto; width:100%; box-sizing:border-box; }
            .ef-hero   { background:linear-gradient(145deg,rgba(6,182,212,0.06),rgba(0,0,0,0)); border:1px solid var(--border-default); border-left:3px solid #06b6d4; border-radius:10px; padding:1.4rem; margin-bottom:1.4rem; }
            .ef-hero h1 { margin:0; color:var(--text-main); font-size:1.3rem; }
            .ef-hero .meta { color:var(--text-secondary); font-size:0.85rem; margin-top:0.3rem; }

            .ef-kpis { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:0.7rem; margin-top:1rem; }
            .ef-kpi  { background:var(--bg-panel); border:1px solid var(--border-default); border-left:3px solid var(--ef-c,#06b6d4); border-radius:8px; padding:0.7rem 0.9rem; }
            .ef-kpi .label { color:var(--text-muted); font-size:0.7rem; font-family:monospace; text-transform:uppercase; letter-spacing:0.05em; }
            .ef-kpi .value { color:var(--text-main); font-size:1.35rem; font-weight:700; margin-top:0.2rem; }
            .ef-kpi .sub   { color:var(--text-secondary); font-size:0.7rem; margin-top:0.15rem; }

            .ef-empty { text-align:center; padding:3rem 1rem; color:var(--text-muted); border:1px dashed #2a2a35; border-radius:8px; }
            .ef-list  { display:flex; flex-direction:column; gap:0.4rem; margin-top:1rem; }
            .ef-row   { display:grid; grid-template-columns: 1.5fr 1fr 1fr 1fr 1.2fr; gap:0.6rem; padding:0.6rem 0.8rem; background:var(--bg-panel); border:1px solid var(--border-default); border-radius:6px; font-size:0.78rem; align-items:center; }
            .ef-row .when     { color:var(--text-secondary); font-family:monospace; font-size:0.72rem; }
            .ef-row .provider { color:var(--accent-indigo); font-family:monospace; }
            .ef-row .tokens   { color:var(--accent-green); font-family:monospace; text-align:right; }
            .ef-row .saved    { color:var(--accent-orange); font-family:monospace; text-align:right; }
            .ef-row .nodes    { color:#7dd3fc; font-family:monospace; text-align:right; }

            .ef-actions { margin-top:1rem; display:flex; gap:0.5rem; }
            .ef-btn { background:var(--bg-elevated); color:var(--text-main); border:1px solid var(--border-default); padding:6px 12px; border-radius:var(--radius-sm); cursor:pointer; font-size:var(--text-xs); font-weight:600; font-family:var(--font-base); line-height:1.3; display:inline-flex; align-items:center; gap:4px; white-space:nowrap; transition:all var(--dur-fast); }
            .ef-btn:hover { background:var(--glass-hover); border-color:var(--accent-indigo); color:var(--text-main); }
            .ef-btn:focus-visible { outline:2px solid var(--accent-indigo); outline-offset:2px; }
            .ef-btn.danger { background:rgba(255,82,82,0.08); border-color:rgba(255,82,82,0.3); color:#ff5252; }
        </style>

        <div class="ef-shell">
            <div class="ef-topbar">
                <a href="/" data-link class="ef-logo">🗼 Team<span>Towers</span></a>
                <span class="ef-title">Efficiency · KM-001 ahorro IA ${renderExplainerBadge('context-pruning', { size: 'xs' })}</span>
                <div class="ef-spacer"></div>
                
            </div>

            <div class="ef-main" id="efMain">
                <p style="color:var(--text-muted);font-size:0.85rem;">Cargando logs…</p>
            </div>
        </div>`;
    }

    async afterRender() {
        ensureExplainerStyle();
        bindExplainerBadges(document);
        await this._load();
        this._render();
        bindExplainerBadges(document);
    }

    async _load() {
        await KB.init();
        const all = await KB.query({ type: 'efficiency_log' });
        this.logs = (all || []).sort((a, b) => (b.content?.timestamp || 0) - (a.content?.timestamp || 0));
        // IA-CONTEXT-001 sprint D · audit logs dels drafts IA del /quality
        const audits = await KB.query({ type: 'ai_audit' }).catch(() => []);
        this.aiAudits = (audits || []).sort((a, b) => (b.content?.createdAt || 0) - (a.content?.createdAt || 0));
    }

    _render() {
        const main = document.getElementById('efMain');
        if (!main) return;

        if (!this.logs.length) {
            main.innerHTML = `
                <div class="ef-hero">
                    <h1 class="mat-hero-h1">🧠 Eficiència <strong>IA</strong></h1>
                    <div class="meta">Aún no hay registros · activa <strong>Context pruning</strong> en <a href="/settings" data-link class="ef-link">/settings</a> y haz una llamada IA (ej. generar un SOP) para ver el primer log.</div>
                </div>
                <div class="ef-empty">
                    <p>0 logs registrados.</p>
                    <p style="font-size:0.78rem;color:#777;">Cuando el pruning está activo, cada llamada al LLM persiste un <code>efficiency_log</code> con tokens · coste · nodos seleccionados/saltados.</p>
                </div>`;
            return;
        }

        // Agregados
        let totalTokens = 0;
        let totalCost   = 0;
        let totalSavedNodes = 0;
        let totalSelectedNodes = 0;
        let avgDeltaTokens = 0;
        for (const l of this.logs) {
            const c = l.content || {};
            totalTokens += Number(c.totalTokens || 0);
            totalCost   += Number(c.costUSD || 0);
            totalSavedNodes    += Number(c.pruning?.skippedCount || 0);
            totalSelectedNodes += Number(c.pruning?.selectedCount || 0);
            avgDeltaTokens     += Number(c.pruning?.deltaTokens || 0);
        }
        avgDeltaTokens = this.logs.length ? Math.round(avgDeltaTokens / this.logs.length) : 0;

        const rowsHtml = this.logs.slice(0, 100).map(l => {
            const c = l.content || {};
            const when = c.timestamp ? new Date(c.timestamp).toLocaleString('es-ES') : '—';
            const p = c.pruning || {};
            return `
                <div class="ef-row">
                    <div class="when">${this._esc(when)}</div>
                    <div class="provider">${this._esc(c.provider || '?')}/${this._esc((c.model || '').slice(0, 12))}</div>
                    <div class="tokens">${c.totalTokens || 0} t · ${(Number(c.costUSD) || 0).toFixed(4)} USD</div>
                    <div class="nodes">${p.selectedCount || 0}/${p.candidatesCount || 0} nodos</div>
                    <div class="saved">${p.deltaTokens >= 0 ? '+' : ''}${p.deltaTokens || 0} t prompt</div>
                </div>`;
        }).join('');

        main.innerHTML = `
            <div class="ef-hero">
                <h1 class="mat-hero-h1">🧠 Eficiència <strong>IA</strong> · ${this.logs.length} crida${this.logs.length === 1 ? '' : 'des'} amb pruning</h1>
                <div class="meta">Cada vez que el pruner selecciona contexto, el sistema mide <strong>cuántos nodos quedaron fuera</strong> (skipped) y <strong>cuántos tokens netos costó el prompt</strong> tras añadir el contexto. Activa o desactiva en <a href="/settings" data-link class="ef-link">/settings</a>.</div>
                <div class="ef-kpis">
                    <div class="ef-kpi" style="--ef-c:#86efac;">
                        <div class="label">Tokens totales</div>
                        <div class="value">${totalTokens.toLocaleString('es-ES')}</div>
                        <div class="sub">acumulado entre todas las llamadas con pruning</div>
                    </div>
                    <div class="ef-kpi" style="--ef-c:#facc15;">
                        <div class="label">Coste real (USD)</div>
                        <div class="value">${totalCost.toFixed(4)} $</div>
                        <div class="sub">~ ${(totalCost * 0.92).toFixed(4)} €</div>
                    </div>
                    <div class="ef-kpi" style="--ef-c:#a5b4fc;">
                        <div class="label">Nodos seleccionados</div>
                        <div class="value">${totalSelectedNodes}</div>
                        <div class="sub">de los inyectados como contexto</div>
                    </div>
                    <div class="ef-kpi" style="--ef-c:#7dd3fc;">
                        <div class="label">Nodos descartados</div>
                        <div class="value">${totalSavedNodes}</div>
                        <div class="sub">no relevantes (token budget · minScore)</div>
                    </div>
                    <div class="ef-kpi" style="--ef-c:#fb923c;">
                        <div class="label">Δ tokens prompt (avg)</div>
                        <div class="value">${avgDeltaTokens >= 0 ? '+' : ''}${avgDeltaTokens}</div>
                        <div class="sub">tokens de contexto añadidos por llamada</div>
                    </div>
                </div>
                <div class="ef-actions">
                    <button class="ef-btn danger" id="efPurge">🗑 Borrar logs</button>
                </div>
            </div>

            <div class="ef-list">
                ${rowsHtml}
                ${this.logs.length > 100 ? `<div style="color:var(--text-muted);font-size:0.78rem;text-align:center;padding:0.5rem;">…${this.logs.length - 100} logs más</div>` : ''}
            </div>

            ${this._renderAiAuditsSection()}`;

        document.getElementById('efPurge')?.addEventListener('click', async () => {
            if (!confirm('Borrar TODOS los logs de eficiencia? Acumulado y datos de comparación se perderán.')) return;
            for (const l of this.logs) {
                await store.dispatch({ type: 'KB_DELETE', payload: { id: l.id } });
            }
            await this._load();
            this._render();
        });
    }

    // IA-CONTEXT-001 sprint D · render audit log dels drafts IA
    _renderAiAuditsSection() {
        const audits = Array.isArray(this.aiAudits) ? this.aiAudits : [];
        if (audits.length === 0) {
            return `
                <div class="ef-hero" style="margin-top:2rem;border-top:1px solid var(--border-default);padding-top:1.4rem;">
                    <h2 style="margin:0 0 6px 0;font-size:1.1rem;color:var(--text-main);">🧠 Drafts IA · audit log</h2>
                    <div class="meta">Encara cap draft generat amb "🧠 Ompli amb IA" del /quality. Quan en facis · cada generació es registra aquí amb modelKey · cost provider · marge SOS · status accepted.</div>
                </div>`;
        }
        // Agregats
        let totalBaseEur = 0;
        let totalMarginEur = 0;
        let totalGrossEur = 0;
        let acceptedCount = 0;
        const byDim = {};
        const byModel = {};
        for (const a of audits) {
            const c = a.content || {};
            const base   = Number(c.totalCostEur || 0);
            const margin = Number(c.marginEur || 0);
            const gross  = Number(c.totalWithMarginEur || (base + margin));
            totalBaseEur   += base;
            totalMarginEur += margin;
            totalGrossEur  += gross;
            if (c.accepted) acceptedCount++;
            const dim = c.dimId || 'other';
            byDim[dim] = (byDim[dim] || 0) + gross;
            // Compta per modelKey de l'attempt accepted (si hi és) sinó el primer
            const modelKey = c.attempts?.find(at => at.evalOk)?.modelKey
                          || c.attempts?.[0]?.modelKey
                          || 'unknown';
            byModel[modelKey] = (byModel[modelKey] || 0) + 1;
        }
        const acceptRate = audits.length ? Math.round(acceptedCount / audits.length * 100) : 0;
        const topDim = Object.entries(byDim).sort((a, b) => b[1] - a[1])[0] || ['—', 0];
        const topModel = Object.entries(byModel).sort((a, b) => b[1] - a[1])[0] || ['—', 0];

        const rowsHtml = audits.slice(0, 30).map(a => {
            const c = a.content || {};
            const when = c.createdAt ? new Date(c.createdAt).toLocaleString('es-ES') : '—';
            const winnerModel = c.attempts?.find(at => at.evalOk)?.modelKey
                              || c.attempts?.[0]?.modelKey
                              || '—';
            const acceptedBadge = c.accepted
                ? '<span style="background:rgba(0,230,118,0.12);color:#00e676;padding:1px 7px;border-radius:999px;font-size:10px;font-weight:700;">✓ Acceptat</span>'
                : '<span style="background:rgba(148,163,184,0.10);color:var(--text-muted);padding:1px 7px;border-radius:999px;font-size:10px;font-weight:700;">— pendent</span>';
            const escapedPreview = this._esc((c.draftPreview || '').slice(0, 80));
            return `
                <div class="ef-row">
                    <div class="when">${this._esc(when)}</div>
                    <div class="provider">${this._esc(c.dimId || '?')} · ${this._esc(winnerModel)}</div>
                    <div class="tokens">${(c.totalWithMarginEur ?? c.totalCostEur ?? 0).toFixed(4)} € ${c.marginEur ? `<span style="color:var(--text-muted);">(+${(c.marginEur).toFixed(4)}€ marge)</span>` : ''}</div>
                    <div class="nodes">${acceptedBadge}</div>
                    <div class="saved" style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapedPreview}</div>
                </div>`;
        }).join('');

        return `
            <div class="ef-hero" style="margin-top:2rem;border-top:1px solid var(--border-default);padding-top:1.4rem;">
                <h2 style="margin:0 0 6px 0;font-size:1.1rem;color:var(--text-main);">🧠 Drafts IA · ${audits.length} generació${audits.length === 1 ? '' : 'ns'}</h2>
                <div class="meta">Cada vegada que cliques <strong>"🧠 Ompli amb IA"</strong> al /quality, queda registrat aquí amb el modelKey usat (escalation chain), cost provider real, marge SOS (5% IA) i status accepted.</div>
                <div class="ef-kpis">
                    <div class="ef-kpi" style="--ef-c:#a855f7;">
                        <div class="label">Cost total brut</div>
                        <div class="value">${totalGrossEur.toFixed(4)} €</div>
                        <div class="sub">provider ${totalBaseEur.toFixed(4)}€ + marge ${totalMarginEur.toFixed(4)}€</div>
                    </div>
                    <div class="ef-kpi" style="--ef-c:#00e676;">
                        <div class="label">Taxa acceptació</div>
                        <div class="value">${acceptRate} %</div>
                        <div class="sub">${acceptedCount} / ${audits.length} drafts</div>
                    </div>
                    <div class="ef-kpi" style="--ef-c:#6366f1;">
                        <div class="label">Top dim · cost</div>
                        <div class="value" style="font-size:1rem;">${this._esc(topDim[0])}</div>
                        <div class="sub">${topDim[1].toFixed(4)} € acumulats</div>
                    </div>
                    <div class="ef-kpi" style="--ef-c:#facc15;">
                        <div class="label">Modèl més usat</div>
                        <div class="value" style="font-size:0.85rem;font-family:var(--font-mono);">${this._esc(topModel[0])}</div>
                        <div class="sub">${topModel[1]} crida${topModel[1] === 1 ? '' : 'des'}</div>
                    </div>
                </div>
            </div>
            <div class="ef-list">
                ${rowsHtml}
                ${audits.length > 30 ? `<div style="color:var(--text-muted);font-size:0.78rem;text-align:center;padding:0.5rem;">…${audits.length - 30} drafts més</div>` : ''}
            </div>`;
    }

    _esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }

    destroy() {}
}
