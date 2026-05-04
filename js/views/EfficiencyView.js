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
import { renderNavLinksHtml } from '../core/navService.js';

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
            .ef-shell  { height:100dvh; background:#050507; color:#e6e6e6; font-family:var(--font-base,sans-serif); display:flex; flex-direction:column; overflow:hidden; }
            .ef-topbar { display:flex; align-items:center; gap:1rem; padding:1rem 1.5rem; border-bottom:1px solid #1a1a22; background:#08080c; flex-shrink:0; flex-wrap:wrap; }
            .ef-logo   { font-weight:700; color:#fff; text-decoration:none; font-size:1.05rem; }
            .ef-logo span { color:#6366f1; }
            .ef-title  { color:#aaa; font-weight:500; letter-spacing:0.05em; text-transform:uppercase; font-size:0.78rem; }
            .ef-spacer { flex:1; }
            .ef-link   { color:#6366f1; text-decoration:none; font-size:0.85rem; }

            .ef-main   { padding:1.5rem; max-width:1080px; margin:0 auto; flex:1; overflow-y:auto; width:100%; box-sizing:border-box; }
            .ef-hero   { background:linear-gradient(145deg,rgba(6,182,212,0.06),rgba(0,0,0,0)); border:1px solid #1a1a22; border-left:3px solid #06b6d4; border-radius:10px; padding:1.4rem; margin-bottom:1.4rem; }
            .ef-hero h1 { margin:0; color:#fff; font-size:1.3rem; }
            .ef-hero .meta { color:#aaa; font-size:0.85rem; margin-top:0.3rem; }

            .ef-kpis { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:0.7rem; margin-top:1rem; }
            .ef-kpi  { background:#0e0e14; border:1px solid #1a1a22; border-left:3px solid var(--ef-c,#06b6d4); border-radius:8px; padding:0.7rem 0.9rem; }
            .ef-kpi .label { color:#888; font-size:0.7rem; font-family:monospace; text-transform:uppercase; letter-spacing:0.05em; }
            .ef-kpi .value { color:#fff; font-size:1.35rem; font-weight:700; margin-top:0.2rem; }
            .ef-kpi .sub   { color:#aaa; font-size:0.7rem; margin-top:0.15rem; }

            .ef-empty { text-align:center; padding:3rem 1rem; color:#666; border:1px dashed #2a2a35; border-radius:8px; }
            .ef-list  { display:flex; flex-direction:column; gap:0.4rem; margin-top:1rem; }
            .ef-row   { display:grid; grid-template-columns: 1.5fr 1fr 1fr 1fr 1.2fr; gap:0.6rem; padding:0.6rem 0.8rem; background:#0e0e14; border:1px solid #1a1a22; border-radius:6px; font-size:0.78rem; align-items:center; }
            .ef-row .when     { color:#aaa; font-family:monospace; font-size:0.72rem; }
            .ef-row .provider { color:#a5b4fc; font-family:monospace; }
            .ef-row .tokens   { color:#86efac; font-family:monospace; text-align:right; }
            .ef-row .saved    { color:#facc15; font-family:monospace; text-align:right; }
            .ef-row .nodes    { color:#7dd3fc; font-family:monospace; text-align:right; }

            .ef-actions { margin-top:1rem; display:flex; gap:0.5rem; }
            .ef-btn { background:#1a1a22; color:#e6e6e6; border:1px solid #2a2a35; padding:0.5rem 1rem; border-radius:6px; cursor:pointer; font-family:inherit; font-size:0.85rem; }
            .ef-btn:hover { background:#22222d; }
            .ef-btn.danger { background:rgba(255,82,82,0.08); border-color:rgba(255,82,82,0.3); color:#ff5252; }
        </style>

        <div class="ef-shell">
            <div class="ef-topbar">
                <a href="/" data-link class="ef-logo">🗼 Team<span>Towers</span></a>
                <span class="ef-title">Efficiency · KM-001 ahorro IA</span>
                <div class="ef-spacer"></div>
                ${renderNavLinksHtml({ active: '', className: 'ef-link' })}
            </div>

            <div class="ef-main" id="efMain">
                <p style="color:#888;font-size:0.85rem;">Cargando logs…</p>
            </div>
        </div>`;
    }

    async afterRender() {
        await this._load();
        this._render();
    }

    async _load() {
        await KB.init();
        const all = await KB.query({ type: 'efficiency_log' });
        this.logs = (all || []).sort((a, b) => (b.content?.timestamp || 0) - (a.content?.timestamp || 0));
    }

    _render() {
        const main = document.getElementById('efMain');
        if (!main) return;

        if (!this.logs.length) {
            main.innerHTML = `
                <div class="ef-hero">
                    <h1>🧠 Eficiencia IA</h1>
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
                <h1>🧠 Eficiencia IA · ${this.logs.length} llamada${this.logs.length === 1 ? '' : 's'} con pruning</h1>
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
                ${this.logs.length > 100 ? `<div style="color:#888;font-size:0.78rem;text-align:center;padding:0.5rem;">…${this.logs.length - 100} logs más</div>` : ''}
            </div>`;

        document.getElementById('efPurge')?.addEventListener('click', async () => {
            if (!confirm('Borrar TODOS los logs de eficiencia? Acumulado y datos de comparación se perderán.')) return;
            for (const l of this.logs) {
                await store.dispatch({ type: 'KB_DELETE', payload: { id: l.id } });
            }
            await this._load();
            this._render();
        });
    }

    _esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }

    destroy() {}
}
