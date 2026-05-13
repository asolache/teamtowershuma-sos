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
            const dim       = q.byDim[d.id] || { score: 0, missing: [] };
            const score     = dim.score || 0;
            const st        = score >= QUALITY_THRESHOLDS.high ? 'high' : (score >= QUALITY_THRESHOLDS.medium ? 'medium' : 'low');
            const color     = statusColor(st);
            const missing   = dim.missing || [];
            // PROJ-QUALITY-001 sprint F · dim exclosa "no aplicable"
            const excluded  = !!dim.excluded;
            const effWeight = typeof dim.effectiveWeight === 'number' ? dim.effectiveWeight : d.weight;
            const weightStr = excluded
                ? `<span class="pq-dim-weight" style="opacity:0.5;text-decoration:line-through;">${d.weight}%</span>`
                : (Math.abs(effWeight - d.weight) > 0.1
                    ? `<span class="pq-dim-weight" title="Pes original ${d.weight}% · efectiu ${effWeight}% per re-balanceig">${effWeight}%<span style="opacity:0.5;font-size:9px;"> (orig ${d.weight}%)</span></span>`
                    : `<span class="pq-dim-weight">${d.weight}%</span>`);

            let bodyHtml;
            if (excluded) {
                bodyHtml = `<div class="pq-dim-done" style="background:rgba(148,163,184,0.10);border-color:rgba(148,163,184,0.30);color:var(--text-muted);">
                    🛑 Marcada com a <strong>no aplicable</strong> per a aquest projecte · els pesos restants s'han re-balancejat
                </div>`;
            } else {
                bodyHtml = missing.length === 0
                    ? `<div class="pq-dim-done">✓ Aquesta capa està completa</div>`
                    : `<ul class="pq-dim-missing">${missing.map(m => `
                        <li class="pq-dim-missing-item">
                            <span class="pq-dim-missing-icon">●</span>
                            <span class="pq-dim-missing-text">${_esc(m.label)}</span>
                            ${m.cta ? `<a class="pq-dim-missing-cta" href="${_esc(m.cta.href)}" data-link>${_esc(m.cta.label)} →</a>` : ''}
                        </li>`).join('')}</ul>`;
            }
            const exclLabel = excluded ? '↩ Marcar com a aplicable' : 'no aplicable';

            return `<section class="pq-dim" id="dim-${_esc(d.id)}" style="${excluded ? 'opacity:0.7;' : ''}">
                <div class="pq-dim-head">
                    <span class="pq-dim-icon">${d.icon}</span>
                    <div class="pq-dim-title" style="${excluded ? 'text-decoration:line-through;' : ''}">${_esc(d.label)}</div>
                    ${weightStr}
                    <span class="pq-dim-score" style="background:${color}18;color:${color};${excluded ? 'opacity:0.5;' : ''}">${score}</span>
                </div>
                <div class="pq-dim-bar"><div class="pq-dim-bar-fill" style="width:${excluded ? 0 : score}%;background:${color};"></div></div>
                ${bodyHtml}
                <div class="pq-dim-foot">
                    ${excluded ? '' : `<button class="pq-dim-aibtn" data-aifill="${_esc(d.id)}" title="Genera un draft amb IA · escalation chain primary→fallback→premium">🧠 Ompli amb IA</button>`}
                    <button class="pq-dim-noapp" data-noapp="${_esc(d.id)}" title="${excluded ? 'Torna a comptabilitzar aquesta capa al score' : 'Marca aquesta capa com a no aplicable · els pesos restants es re-balancegen'}">${exclLabel}</button>
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
        // IA-CONTEXT-001 sprint A · botons "Ompli amb IA" ara fan crides reals
        const { aiFillDim, markAuditAccepted } = await import('../core/aiFillService.js');
        // IA-CONTEXT-001 sprint C · accept aplica el draft al projecte
        const { commitApply } = await import('../core/aiApplyService.js');
        document.querySelectorAll('[data-aifill]').forEach(btn => {
            btn.addEventListener('click', () => this._handleAiFill(btn, aiFillDim, markAuditAccepted, commitApply));
        });
        document.querySelectorAll('[data-noapp]').forEach(btn => {
            btn.addEventListener('click', () => this._toggleDimExclusion(btn.getAttribute('data-noapp')));
        });
    }

    // PROJ-QUALITY-001 sprint F · toggle exclusió de la dim
    async _toggleDimExclusion(dimId) {
        if (!dimId || !this._projectId || !this._project) return;
        const current = Array.isArray(this._project.excludedQualityDims)
            ? this._project.excludedQualityDims.slice()
            : [];
        const idx = current.indexOf(dimId);
        if (idx >= 0) current.splice(idx, 1);
        else           current.push(dimId);
        try {
            const { store } = await import('../core/store.js');
            await store.dispatch({
                type: 'UPDATE_PROJECT_INFO',
                payload: { projectId: this._projectId, updates: { excludedQualityDims: current, updatedAt: Date.now() } },
            });
            this._toast(idx >= 0 ? '✓ "' + dimId + '" tornada a comptabilitzar' : '🛑 "' + dimId + '" marcada com a no aplicable');
            setTimeout(() => {
                try {
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo(window.location.pathname + window.location.search);
                    } else { window.location.reload(); }
                } catch (_) { window.location.reload(); }
            }, 500);
        } catch (e) {
            this._toast('✗ ' + (e?.message || 'error'));
        }
    }

    async _handleAiFill(btn, aiFillDim, markAuditAccepted, commitApply) {
        const dimId = btn.getAttribute('data-aifill');
        if (!dimId || !this._projectId) return;
        const origText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⏳ Generant…';
        let result;
        try {
            result = await aiFillDim({
                projectId: this._projectId,
                dimId,
                maxOutputTokens: 800,
                temperature: 0.4,
            });
        } catch (e) {
            btn.disabled = false;
            btn.textContent = origText;
            if (e?.code === 'no-api-key') {
                this._toast('⚠ Cal API key de ' + (e.provider || 'el provider') + ' · ves a /settings');
            } else {
                this._toast('✗ ' + (e?.message || 'error desconegut'));
            }
            return;
        }
        btn.disabled = false;
        btn.textContent = origText;
        if (!result.draft) {
            this._toast('⚠ Escalation exhausted · cap modèl ha passat l\'evaluator');
            return;
        }
        this._showDraftModal({ dimId, result, markAuditAccepted, commitApply });
    }

    _showDraftModal({ dimId, result, markAuditAccepted, commitApply }) {
        // Backdrop
        const bg = document.createElement('div');
        bg.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9990;display:flex;align-items:center;justify-content:center;padding:20px;';
        const card = document.createElement('div');
        card.style.cssText = 'background:var(--bg-panel);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:1.4rem;max-width:680px;width:100%;max-height:80vh;overflow:auto;color:var(--text-main);';
        const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
        const attemptsHtml = (result.attempts || []).map(a =>
            '<li style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">'
            + (a.evalOk ? '✓' : '✗') + ' ' + escapeHtml(a.modelKey || '?')
            + (a.evalReason ? ' · ' + escapeHtml(a.evalReason) : '')
            + '</li>'
        ).join('');
        const pretty = result.parsedDraft
            ? JSON.stringify(result.parsedDraft, null, 2)
            : (result.draft || '');
        const canApply = !!result.parsedDraft;
        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
                <h2 style="margin:0;font-size:1.2rem;color:var(--text-main);">🧠 Draft IA · dim ${escapeHtml(dimId)}</h2>
                <span style="background:rgba(99,102,241,0.15);color:var(--accent-indigo);padding:2px 10px;border-radius:999px;font-size:11px;font-weight:700;font-family:var(--font-mono);">${escapeHtml(result.modelKey || '?')}</span>
                <span style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);" title="Provider · ${result.totalCostEur.toFixed(4)}€ · Marge SOS ${result.marginPct || 0}% · Total ${(result.totalWithMarginEur || result.totalCostEur).toFixed(4)}€">~${(result.totalWithMarginEur || result.totalCostEur).toFixed(4)}€ · ${result.marginEur ? '+' + result.marginEur.toFixed(4) + '€ marge · ' : ''}${result.contextTokens} tokens</span>
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">📜 Chain d'intents</div>
            <ul style="list-style:none;padding:0;margin:0 0 12px;display:flex;flex-direction:column;gap:2px;">${attemptsHtml}</ul>
            <pre style="background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-md);padding:12px;font-size:12px;font-family:var(--font-mono);white-space:pre-wrap;word-break:break-word;color:var(--text-secondary);max-height:340px;overflow:auto;">${escapeHtml(pretty)}</pre>
            <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end;flex-wrap:wrap;">
                <button class="pq-dim-noapp" id="pqDraftReject">✕ Rebutjar</button>
                <button class="pq-dim-aibtn"  id="pqDraftAccept" ${canApply ? '' : 'disabled'}>${canApply ? '✓ Acceptar i aplicar al projecte' : '✓ Acceptar (no parseable · sols audit)'}</button>
            </div>
            <div id="pqApplyStatus" style="margin-top:10px;font-size:11px;color:var(--text-muted);line-height:1.5;"></div>
        `;
        bg.appendChild(card);
        document.body.appendChild(bg);
        const close = () => bg.remove();
        bg.addEventListener('click', (e) => { if (e.target === bg) close(); });
        document.getElementById('pqDraftReject')?.addEventListener('click', close);
        document.getElementById('pqDraftAccept')?.addEventListener('click', async () => {
            const acceptBtn = document.getElementById('pqDraftAccept');
            const status    = document.getElementById('pqApplyStatus');
            acceptBtn.disabled = true;
            if (canApply) {
                acceptBtn.textContent = '⏳ Aplicant…';
                try {
                    const { store } = await import('../core/store.js');
                    const { KB }    = await import('../core/kb.js');
                    const apply = await commitApply({
                        projectId:   this._projectId,
                        dimId,
                        parsedDraft: result.parsedDraft,
                        store, kb: KB,
                    });
                    await markAuditAccepted(result.auditId).catch(() => {});
                    if (apply.applied) {
                        this._toast('✓ Aplicat · ' + apply.summary);
                    } else {
                        this._toast('🛈 Draft acceptat però sense canvis aplicables · ' + apply.summary);
                    }
                    close();
                    // Refresh score post-apply · re-navigate al mateix /quality
                    setTimeout(() => {
                        try {
                            if (typeof window.navigateTo === 'function') {
                                window.navigateTo(window.location.pathname + window.location.search);
                            } else {
                                window.location.reload();
                            }
                        } catch (_) { window.location.reload(); }
                    }, 600);
                } catch (e) {
                    status.textContent = '✗ ' + (e?.message || 'apply va fallar');
                    status.style.color = 'var(--accent-red)';
                    acceptBtn.disabled = false;
                    acceptBtn.textContent = '✓ Acceptar i aplicar al projecte';
                }
            } else {
                await markAuditAccepted(result.auditId).catch(() => {});
                this._toast('✓ Audit log marcat (draft no parseable · no s\'aplica)');
                close();
            }
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
