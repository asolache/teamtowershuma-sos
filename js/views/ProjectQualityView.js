// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT QUALITY VIEW (PROJ-QUALITY-001 sprint E)
// Ruta: /quality?project={id}
//
// Vista detall del score qualitat d'un projecte · 5 capes amb missing items
// llistats + cta directa a la vista que desbloca cada pas + stub IA fill-in.
// El project-subnav (paintProjectSubnav) ja porta el cta "📌 Següent"; aquí
// l'usuari té el panel exhaustiu per veure totes les capes alhora.
// =============================================================================

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import {
    computeQualityScore,
    QUALITY_DIMS,
    QUALITY_THRESHOLDS,
    statusColor,
    statusIcon,
} from '../core/projectQualityService.js';
import { suggestNextDim } from '../core/navService.js';

function _esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

export default class ProjectQualityView {
    constructor() {
        document.title = 'Qualitat del projecte · SOS V11';
        this._projectId = null;
        this._project   = null;
        this._quality   = null;
    }

    _readProjectId() {
        const params = new URLSearchParams(window.location.search || '');
        return params.get('project') || null;
    }

    async _loadData() {
        await store.init();
        await KB.init();
        const pid = this._readProjectId();
        this._projectId = pid;
        const state = store.getState();
        this._project = (state.projects || []).find(p => p && p.id === pid) || null;
        if (!this._project) { this._quality = null; return; }
        const [sops, workshops, marketItems] = await Promise.all([
            KB.query({ type: 'sop' }).catch(() => []),
            KB.query({ type: 'workshop' }).catch(() => []),
            KB.query({ type: 'market_item' }).catch(() => []),
        ]);
        this._quality = computeQualityScore(this._project, { sops, workshops, marketItems });
    }

    async getHtml() {
        await this._loadData();
        if (!this._projectId) {
            return this._htmlMissingProject('No s\'ha indicat cap projecte · obre /quality?project={id} des d\'un projecte concret.');
        }
        if (!this._project) {
            return this._htmlMissingProject('No s\'ha trobat el projecte "' + _esc(this._projectId) + '" · pot estar archivat o eliminat.');
        }
        const q       = this._quality || { total: 0, byDim: {}, missing: [], status: 'low' };
        const next    = suggestNextDim(q);
        const color   = statusColor(q.status);
        const icon    = statusIcon(q.status);
        const name    = _esc(this._project.nombre || this._project.name || this._projectId);

        return `
        <style>
            .pq-shell  { min-height: 100dvh; background: var(--bg-dark); color: var(--text-main); font-family: var(--font-base); }
            .pq-main   { padding: 1.5rem; max-width: 1100px; margin: 0 auto; }
            .pq-hero {
                display: flex; gap: 16px; align-items: center; flex-wrap: wrap;
                padding: 20px 22px; border-radius: var(--radius-lg);
                background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.06));
                border: 1px solid var(--border-default); margin-bottom: 20px;
            }
            .pq-hero-title { flex: 1; min-width: 280px; }
            .pq-hero-h1 { font-size: 1.5rem; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.02em; color: var(--text-main); }
            .pq-hero-sub { font-size: var(--text-xs); color: var(--text-muted); font-family: var(--font-mono); }
            .pq-hero-score {
                display: flex; flex-direction: column; align-items: center; gap: 2px;
                padding: 12px 22px; border-radius: var(--radius-md);
                background: var(--bg-panel); border: 1px solid var(--border-default);
            }
            .pq-hero-score-num {
                font-size: 2.4rem; font-weight: 900; font-family: var(--font-mono);
                line-height: 1; color: ${color};
            }
            .pq-hero-score-tot { font-size: 11px; color: var(--text-muted); opacity: 0.7; }
            .pq-hero-score-lbl {
                font-size: 11px; font-weight: 700; padding: 2px 10px;
                border-radius: 999px; background: ${color}18; color: ${color};
            }
            .pq-hero-next {
                display: inline-flex; align-items: center; gap: 8px;
                padding: 8px 14px; border-radius: var(--radius-md);
                background: rgba(99,102,241,0.12); color: var(--text-main);
                border: 1px solid var(--accent-indigo);
                font-size: var(--text-xs); font-weight: 700; text-decoration: none;
            }
            .pq-hero-next:hover { filter: brightness(1.10); }
            .pq-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px; }
            .pq-dim {
                background: var(--bg-panel); border: 1px solid var(--border-default);
                border-radius: var(--radius-lg); padding: 14px 16px;
                box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 10px;
            }
            .pq-dim-head { display: flex; align-items: center; gap: 10px; }
            .pq-dim-icon { font-size: 1.4rem; }
            .pq-dim-title { flex: 1; font-weight: 800; color: var(--text-main); font-size: var(--text-sm); }
            .pq-dim-weight {
                font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);
                background: var(--bg-elevated); padding: 2px 6px; border-radius: 4px;
            }
            .pq-dim-score {
                font-size: 1.2rem; font-weight: 800; font-family: var(--font-mono);
                padding: 4px 10px; border-radius: 6px;
            }
            .pq-dim-bar { height: 6px; border-radius: 3px; background: var(--glass-border); overflow: hidden; }
            .pq-dim-bar-fill { height: 100%; border-radius: 3px; transition: width .5s ease; }
            .pq-dim-missing { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
            .pq-dim-missing-item {
                display: flex; align-items: flex-start; gap: 8px;
                padding: 8px 10px; border-radius: var(--radius-md);
                background: var(--bg-elevated); border: 1px solid var(--border-subtle);
            }
            .pq-dim-missing-icon { font-size: 12px; color: var(--accent-orange); flex-shrink: 0; margin-top: 1px; }
            .pq-dim-missing-text { flex: 1; font-size: 12px; color: var(--text-secondary); line-height: 1.45; }
            .pq-dim-missing-cta {
                font-size: 10px; font-weight: 700; color: var(--accent-indigo);
                text-decoration: none; padding: 3px 8px; border-radius: 999px;
                background: rgba(99,102,241,0.10); flex-shrink: 0;
            }
            .pq-dim-missing-cta:hover { background: rgba(99,102,241,0.20); }
            .pq-dim-done {
                display: flex; align-items: center; gap: 8px;
                padding: 10px 12px; border-radius: var(--radius-md);
                background: rgba(0,230,118,0.06); border: 1px solid rgba(0,230,118,0.25);
                color: #00e676; font-size: var(--text-xs); font-weight: 700;
            }
            .pq-dim-foot { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-top: 4px; }
            .pq-dim-aibtn {
                font-size: 11px; padding: 6px 10px; border-radius: var(--radius-sm);
                background: linear-gradient(135deg, var(--accent-indigo), var(--accent-purple));
                color: #fff; border: 0; cursor: pointer; font-weight: 700;
                font-family: var(--font-base); transition: filter var(--dur-fast);
            }
            .pq-dim-aibtn:hover { filter: brightness(1.10); }
            .pq-dim-aibtn[disabled] { opacity: 0.55; cursor: not-allowed; }
            .pq-dim-noapp {
                font-size: 11px; padding: 6px 10px; border-radius: var(--radius-sm);
                background: transparent; color: var(--text-muted);
                border: 1px solid var(--border-default); cursor: pointer; font-weight: 600;
            }
            .pq-dim-noapp:hover { color: var(--text-main); border-color: var(--text-muted); }
            .pq-empty {
                background: var(--bg-panel); border: 1px dashed var(--border-default);
                border-radius: var(--radius-md); padding: 2.5rem 1.5rem; text-align: center;
                color: var(--text-muted);
            }
            .pq-aitoast {
                position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
                background: var(--bg-panel); border: 1px solid var(--accent-indigo);
                color: var(--text-main); padding: 12px 18px; border-radius: var(--radius-md);
                box-shadow: var(--shadow-lg); font-size: var(--text-sm); font-weight: 600; z-index: 9999;
            }
        </style>

        <div class="pq-shell">
            <div class="pq-main">
                <header class="pq-hero">
                    <div class="pq-hero-title">
                        <h1 class="pq-hero-h1">${name}</h1>
                        <div class="pq-hero-sub">Qualitat detall · 5 capes ponderades · objectiu ≥90 per a alfa Matriu</div>
                    </div>
                    <div class="pq-hero-score">
                        <div class="pq-hero-score-num">${q.total}<span class="pq-hero-score-tot">/100</span></div>
                        <div class="pq-hero-score-lbl">${icon} ${_esc(q.status)}</div>
                    </div>
                    ${next && next.gain > 0
                        ? `<a class="pq-hero-next" href="#dim-${next.dim.id}">📌 Següent · ${next.dim.icon} ${_esc(next.dim.label)} · +${next.gain} pts</a>`
                        : `<a class="pq-hero-next" style="background:rgba(0,230,118,0.10);border-color:#00e676;color:#00e676;" href="/registry" data-link>🌟 Excel·lent · veure xarxa</a>`}
                </header>

                <div class="pq-grid">${this._renderDims(q)}</div>
            </div>
        </div>
        `;
    }

    _renderDims(q) {
        return QUALITY_DIMS.map(d => {
            const dim    = q.byDim[d.id] || { score: 0, missing: [] };
            const score  = dim.score || 0;
            const st     = score >= QUALITY_THRESHOLDS.high ? 'high' : (score >= QUALITY_THRESHOLDS.medium ? 'medium' : 'low');
            const color  = statusColor(st);
            const missing = dim.missing || [];

            const items = missing.length === 0
                ? `<div class="pq-dim-done">✓ Aquesta capa està completa</div>`
                : `<ul class="pq-dim-missing">${missing.map(m => `
                    <li class="pq-dim-missing-item">
                        <span class="pq-dim-missing-icon">●</span>
                        <span class="pq-dim-missing-text">${_esc(m.label)}</span>
                        ${m.cta ? `<a class="pq-dim-missing-cta" href="${_esc(m.cta.href)}" data-link>${_esc(m.cta.label)} →</a>` : ''}
                    </li>`).join('')}</ul>`;

            return `<section class="pq-dim" id="dim-${_esc(d.id)}">
                <div class="pq-dim-head">
                    <span class="pq-dim-icon">${d.icon}</span>
                    <div class="pq-dim-title">${_esc(d.label)}</div>
                    <span class="pq-dim-weight">${d.weight}%</span>
                    <span class="pq-dim-score" style="background:${color}18;color:${color};">${score}</span>
                </div>
                <div class="pq-dim-bar"><div class="pq-dim-bar-fill" style="width:${score}%;background:${color};"></div></div>
                ${items}
                <div class="pq-dim-foot">
                    <button class="pq-dim-aibtn" data-aifill="${_esc(d.id)}" title="Genera un draft amb IA (cost ~150 tokens · sprint F)">🧠 Ompli amb IA</button>
                    <button class="pq-dim-noapp" data-noapp="${_esc(d.id)}" title="Marca aquesta capa com a no aplicable per a aquest projecte (sprint F)">no aplicable</button>
                </div>
            </section>`;
        }).join('');
    }

    _htmlMissingProject(msg) {
        return `<div class="pq-shell"><div class="pq-main">
            <div class="pq-empty">
                <div style="font-size:2.2rem;margin-bottom:8px;">🛈</div>
                <div style="margin-bottom:12px;">${_esc(msg)}</div>
                <a href="/dashboard" data-link style="color:var(--accent-indigo);font-weight:700;">← Tornar al Dashboard</a>
            </div>
        </div></div>`;
    }

    async afterRender() {
        // Stub handlers · UX-only fins que arribi sprint F (ProjectQualityIA)
        document.querySelectorAll('[data-aifill]').forEach(btn => {
            btn.addEventListener('click', () => {
                this._toast('🚧 Ompli amb IA · disponible al sprint F · ~150 tokens per dim · pre-fill amb el corpus KB del sector');
            });
        });
        document.querySelectorAll('[data-noapp]').forEach(btn => {
            btn.addEventListener('click', () => {
                this._toast('🚧 "no aplicable" · disponible al sprint F · pesos rebalancejats per al projecte');
            });
        });
    }

    _toast(msg) {
        const t = document.createElement('div');
        t.className = 'pq-aitoast';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3200);
    }
}
