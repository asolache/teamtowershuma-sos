// =============================================================================
// TEAMTOWERS SOS V11 — TOKENOMICS VIEW (TOKENOMICS sprint A)
// Ruta · /js/views/TokenomicsView.js  →  /tokenomics?project={id}
//
// Designer interactiu · token info inputs · distribution sliders per group ·
// vesting params per group · preview vesting schedule (text-table quarterly) ·
// quality score live · save → KB + applyTokenDesignToProject.
// =============================================================================

import { KB } from '../core/kb.js';
import {
    TOKEN_DESIGN_TYPE, TOKEN_GROUPS,
    buildEmptyTokenDesign,
    validateTokenDesign,
    setDistributionPct, normalizeDistribution,
    setVestingParams,
    computeVestingSchedule,
    computeQualityScore,
    applyTokenDesignToProject,
    groupMeta,
} from '../core/tokenomicsService.js';

export default class TokenomicsView {

    constructor() {
        document.title = 'Tokenomics · SOS V11';
        try {
            const u = new URL(window.location.href);
            this.projectId = u.searchParams.get('project') || null;
        } catch (_) { this.projectId = null; }
        this.project = null;
        this.design  = null;
    }

    async getHtml() {
        if (!this.projectId) return this._htmlNoProject();
        try { this.project = await KB.getNode(this.projectId); } catch (_) { this.project = null; }
        if (!this.project) return this._htmlNotFound();

        // Try existing token_design for the project
        let designs = [];
        try { designs = await KB.query({ type: TOKEN_DESIGN_TYPE, projectId: this.projectId }) || []; } catch (_) {}
        if (designs.length > 0) {
            // Take the most recent
            this.design = designs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
        } else {
            const projName = this.project.nombre || this.project.name || 'SOSToken';
            this.design = buildEmptyTokenDesign({
                projectId:   this.projectId,
                name:        projName.replace(/[^A-Za-z0-9]/g, '').slice(0, 32) || 'SOSToken',
                symbol:      projName.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'SOS',
            });
        }
        return this._htmlMain();
    }

    async afterRender() {
        if (!this.design) return;
        this._bindInputs();
    }

    _htmlNoProject() {
        return `<div style="min-height:100dvh;background:var(--bg-dark);color:var(--text-main);font-family:var(--font-base);padding:2rem;">
            <div style="max-width:600px;margin:4rem auto;text-align:center;background:var(--bg-panel);padding:2rem;border-radius:8px;border:1px solid var(--border-default);">
                <h1>🪙 Tokenomics</h1>
                <p>Cal indicar projecte · <code>?project=&lt;projectId&gt;</code>.</p>
                <a href="/dashboard" data-link style="color:var(--accent-indigo);">← Dashboard</a>
            </div></div>`;
    }
    _htmlNotFound() {
        return `<div style="min-height:100dvh;background:var(--bg-dark);color:var(--text-main);font-family:var(--font-base);padding:2rem;">
            <div style="max-width:600px;margin:4rem auto;text-align:center;background:var(--bg-panel);padding:2rem;border-radius:8px;border:1px solid var(--border-default);">
                <h1>⚠ Projecte no trobat</h1><p><code>${this._esc(this.projectId)}</code></p>
                <a href="/dashboard" data-link style="color:var(--accent-indigo);">← Dashboard</a>
            </div></div>`;
    }

    _htmlMain() {
        const projName = this.project.nombre || this.project.name || this.project.id;
        const c = this.design.content;
        const validation = validateTokenDesign(this.design);
        const quality = computeQualityScore(this.design);

        // Distribution bars
        const distSum = Object.values(c.distribution).reduce((s, p) => s + p, 0);
        const distRows = TOKEN_GROUPS.map(g => {
            const pct = c.distribution[g.id] ?? 0;
            const pctInt = Math.round(pct * 100);
            const vest = c.vesting[g.id] || { cliffMonths: 0, linearMonths: 0 };
            const tokens = Math.round((c.totalSupply || 0) * pct);
            return `
                <div class="tk-group" data-group="${g.id}">
                    <div class="tk-group-head">
                        <span class="tk-group-color" style="background:${g.color};"></span>
                        <span class="tk-group-label">${g.label}</span>
                        <span class="tk-group-hint">${this._esc(g.hint)}</span>
                        <span class="tk-group-tokens" data-tokens="${g.id}">${tokens.toLocaleString()} · ${pctInt}%</span>
                    </div>
                    <div class="tk-group-controls">
                        <label class="tk-slider-wrap">
                            <span>%</span>
                            <input type="range" data-dist="${g.id}" min="0" max="100" step="0.5" value="${(pct * 100).toFixed(1)}">
                            <input type="number" class="tk-num" data-dist-num="${g.id}" min="0" max="100" step="0.5" value="${(pct * 100).toFixed(1)}">
                        </label>
                        <label class="tk-vest-input">
                            <span>Cliff (m)</span>
                            <input type="number" data-cliff="${g.id}" min="0" max="60" step="1" value="${vest.cliffMonths}">
                        </label>
                        <label class="tk-vest-input">
                            <span>Linear (m)</span>
                            <input type="number" data-linear="${g.id}" min="0" max="120" step="1" value="${vest.linearMonths}">
                        </label>
                    </div>
                </div>
            `;
        }).join('');

        // Vesting schedule preview · quarterly per 5 anys
        const sched = computeVestingSchedule(this.design, { months: 60 });
        const quarters = [0, 3, 6, 12, 24, 36, 48, 60];
        const schedRows = quarters.map(m => {
            const row = sched[m] || { byGroup: {}, totalUnlocked: 0 };
            const tds = TOKEN_GROUPS.map(g => {
                const v = row.byGroup[g.id] || 0;
                const pct = c.totalSupply > 0 ? (v / c.totalSupply * 100) : 0;
                return `<td style="color:${g.color};font-family:var(--font-mono);font-size:11px;text-align:right;" title="${v.toLocaleString()} tokens">${pct.toFixed(1)}%</td>`;
            }).join('');
            const totalPct = c.totalSupply > 0 ? (row.totalUnlocked / c.totalSupply * 100) : 0;
            return `<tr><td style="font-family:var(--font-mono);font-size:11px;">M${m}</td>${tds}<td style="font-family:var(--font-mono);font-size:11px;font-weight:700;text-align:right;">${totalPct.toFixed(0)}%</td></tr>`;
        }).join('');

        const sumColor = Math.abs(distSum - 1) < 0.001 ? '#22c55e' : '#ef4444';
        const sumIcon  = Math.abs(distSum - 1) < 0.001 ? '✓' : '✗';

        return `
        <style>
            .tk-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); }
            .tk-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-wrap:wrap; }
            .tk-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .tk-logo span { color:var(--accent-indigo); }
            .tk-main { max-width:1200px; margin:0 auto; padding:1.5rem; }
            .tk-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem 1.2rem; margin-bottom:1rem; }
            .tk-card h3 { margin:0 0 0.6rem 0; font-size:0.95rem; }
            .tk-info-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:8px; }
            .tk-info-grid label { display:flex; flex-direction:column; gap:3px; font-size:11px; color:var(--text-secondary); }
            .tk-info-grid input { background:#000; color:var(--text-main); border:1px solid var(--border-default); border-radius:4px; padding:6px 8px; font-family:var(--font-mono); font-size:0.85rem; }
            .tk-quality { display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:6px; }
            .tk-quality-score { font-size:2rem; font-weight:700; font-family:var(--font-mono); }
            .tk-quality-meta { flex:1; font-size:0.8rem; line-height:1.45; color:var(--text-secondary); }
            .tk-quality-reasons { font-size:11px; color:var(--text-muted); margin-top:4px; }
            .tk-group { padding:10px 0; border-top:1px solid var(--border-default); }
            .tk-group:first-child { border-top:none; }
            .tk-group-head { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:6px; }
            .tk-group-color { display:inline-block; width:14px; height:14px; border-radius:50%; }
            .tk-group-label { font-weight:700; font-size:0.9rem; }
            .tk-group-hint { font-size:11px; color:var(--text-muted); flex:1; min-width:120px; }
            .tk-group-tokens { font-family:var(--font-mono); font-size:11px; font-weight:700; }
            .tk-group-controls { display:grid; grid-template-columns:2fr 1fr 1fr; gap:8px; align-items:center; }
            @media (max-width:680px) { .tk-group-controls { grid-template-columns:1fr; } }
            .tk-slider-wrap { display:flex; align-items:center; gap:6px; }
            .tk-slider-wrap input[type="range"] { flex:1; }
            .tk-slider-wrap .tk-num { width:60px; }
            .tk-vest-input { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-secondary); }
            .tk-vest-input input { width:60px; background:#000; color:var(--text-main); border:1px solid var(--border-default); border-radius:3px; padding:3px 5px; font-family:var(--font-mono); font-size:11px; }
            .tk-sumbar { display:flex; align-items:center; gap:12px; padding:8px 12px; background:#0008; border-radius:5px; margin-top:8px; }
            .tk-sumbar-icon { font-size:1.2rem; font-weight:700; }
            .tk-sumbar-stack { flex:1; height:8px; background:#0008; border-radius:4px; overflow:hidden; display:flex; }
            .tk-sumbar-seg { height:100%; }
            table.tk-sched { width:100%; border-collapse:collapse; font-size:0.8rem; }
            table.tk-sched th, table.tk-sched td { padding:4px 6px; border-bottom:1px solid var(--border-default); }
            table.tk-sched th { background:#0008; font-size:10px; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-muted); }
            .tk-btn { padding:10px 18px; border-radius:4px; border:1px solid #22c55e; background:#22c55e; color:#fff; font-size:0.85rem; font-weight:700; cursor:pointer; }
            .tk-btn:disabled { opacity:0.5; cursor:not-allowed; background:var(--bg-panel); color:var(--text-muted); border-color:var(--border-default); }
            .tk-msg { font-size:11px; font-family:var(--font-mono); margin-left:10px; }
            .tk-msg.ok { color:#22c55e; }
            .tk-msg.err { color:#ef4444; }
        </style>
        <div class="tk-shell">
            <div class="tk-topbar">
                <a href="/dashboard" data-link class="tk-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Tokenomics</span>
                <span style="flex:1;"></span>
                <a href="/lifecycle?project=${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">🌀 Lifecycle</a>
                <a href="/project/${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">← Hub</a>
            </div>
            <div class="tk-main">
                <h1 style="margin:0 0 1rem 0;font-size:1.35rem;">🪙 ${this._esc(projName)} · Tokenomics</h1>

                <div class="tk-card">
                    <h3>🪪 Identitat del token</h3>
                    <div class="tk-info-grid">
                        <label>Nom (1-32) <input type="text" id="tkName" maxlength="32" value="${this._esc(c.name)}"></label>
                        <label>Símbol (1-12) <input type="text" id="tkSymbol" maxlength="12" value="${this._esc(c.symbol)}"></label>
                        <label>Total supply <input type="number" id="tkSupply" min="1" step="1" value="${c.totalSupply}"></label>
                        <label>Decimals (0-30) <input type="number" id="tkDecimals" min="0" max="30" step="1" value="${c.decimals}"></label>
                    </div>
                </div>

                <div class="tk-card">
                    <h3>🎯 Quality score · live</h3>
                    <div class="tk-quality" style="background:${quality.score >= 75 ? '#22c55e20' : quality.score >= 50 ? '#facc1520' : '#ef444420'};">
                        <div class="tk-quality-score" style="color:${quality.score >= 75 ? '#22c55e' : quality.score >= 50 ? '#facc15' : '#ef4444'};">${quality.score}</div>
                        <div class="tk-quality-meta">
                            <div>${quality.valid ? '✓ Design vàlid' : '✗ Design no vàlid'} · ${validation.errors.length} errors validation</div>
                            ${quality.reasons.length > 0 ? '<div class="tk-quality-reasons">⚠ ' + quality.reasons.map(r => this._esc(r)).join(' · ') + '</div>' : '<div class="tk-quality-reasons">✓ Sense alertes</div>'}
                        </div>
                    </div>
                </div>

                <div class="tk-card">
                    <h3>📊 Distribució · suma ${(distSum * 100).toFixed(1)}%</h3>
                    ${distRows}
                    <div class="tk-sumbar">
                        <span class="tk-sumbar-icon" style="color:${sumColor};">${sumIcon}</span>
                        <span style="font-family:var(--font-mono);font-size:0.85rem;color:${sumColor};">${(distSum * 100).toFixed(1)}% / 100%</span>
                        <div class="tk-sumbar-stack" id="tkStack">
                            ${TOKEN_GROUPS.map(g => `<div class="tk-sumbar-seg" data-seg="${g.id}" style="background:${g.color};width:${(c.distribution[g.id] || 0) * 100}%;" title="${g.label} ${((c.distribution[g.id] || 0) * 100).toFixed(1)}%"></div>`).join('')}
                        </div>
                        <button class="tk-btn" id="tkNormalize" style="padding:4px 10px;font-size:11px;background:var(--accent-indigo);border-color:var(--accent-indigo);">⚖ Normalitzar</button>
                    </div>
                </div>

                <div class="tk-card">
                    <h3>⏳ Vesting schedule · % unlock cumulatiu per checkpoint</h3>
                    <table class="tk-sched">
                        <thead>
                            <tr>
                                <th>Mes</th>
                                ${TOKEN_GROUPS.map(g => `<th style="color:${g.color};text-align:right;">${this._esc(g.label.slice(0, 6))}</th>`).join('')}
                                <th style="text-align:right;">Total</th>
                            </tr>
                        </thead>
                        <tbody id="tkSched">${schedRows}</tbody>
                    </table>
                </div>

                <div style="display:flex;align-items:center;gap:10px;">
                    <button class="tk-btn" id="tkSave" ${validation.ok ? '' : 'disabled'}>💾 Desar token design</button>
                    <span class="tk-msg" id="tkMsg"></span>
                </div>
            </div>
        </div>`;
    }

    _bindInputs() {
        // Token info inputs
        ['tkName', 'tkSymbol', 'tkSupply', 'tkDecimals'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', () => {
                const c = this.design.content;
                if (id === 'tkName')     c.name = el.value;
                if (id === 'tkSymbol')   c.symbol = el.value;
                if (id === 'tkSupply')   c.totalSupply = parseFloat(el.value) || 0;
                if (id === 'tkDecimals') c.decimals = parseInt(el.value, 10) || 0;
                this.design.updatedAt = Date.now();
                this._refresh();
            });
        });

        // Distribution sliders + numeric inputs
        for (const g of TOKEN_GROUPS) {
            const slider = document.querySelector('[data-dist="' + g.id + '"]');
            const num    = document.querySelector('[data-dist-num="' + g.id + '"]');
            const cliff  = document.querySelector('[data-cliff="' + g.id + '"]');
            const linear = document.querySelector('[data-linear="' + g.id + '"]');

            const onPctChange = (raw) => {
                let v = parseFloat(raw);
                if (!isFinite(v)) v = 0;
                v = Math.max(0, Math.min(100, v));
                try {
                    this.design = setDistributionPct(this.design, g.id, v / 100);
                    this._refresh();
                } catch (_) {}
            };
            if (slider) slider.addEventListener('input', () => { if (num) num.value = slider.value; onPctChange(slider.value); });
            if (num)    num.addEventListener('input', () => { if (slider) slider.value = num.value; onPctChange(num.value); });

            if (cliff) cliff.addEventListener('input', () => {
                this.design = setVestingParams(this.design, g.id, { cliffMonths: parseInt(cliff.value, 10) || 0 });
                this._refresh();
            });
            if (linear) linear.addEventListener('input', () => {
                this.design = setVestingParams(this.design, g.id, { linearMonths: parseInt(linear.value, 10) || 0 });
                this._refresh();
            });
        }

        // Normalize button
        const normBtn = document.getElementById('tkNormalize');
        if (normBtn) normBtn.addEventListener('click', () => {
            this.design.content.distribution = normalizeDistribution(this.design.content.distribution);
            this.design.updatedAt = Date.now();
            // Reload page to re-render all controls with normalized values
            // (a partial refresh würde overshoot · més simple full re-render)
            this._renderFull();
        });

        // Save button
        const saveBtn = document.getElementById('tkSave');
        if (saveBtn) saveBtn.addEventListener('click', async () => {
            const validation = validateTokenDesign(this.design);
            if (!validation.ok) {
                this._setMsg('✗ design invàlid · ' + validation.errors.slice(0, 2).join(' · '), 'err');
                return;
            }
            try {
                await KB.upsert(this.design);
                // També apuntar des del project
                const updatedProject = applyTokenDesignToProject(this.project, this.design.id);
                await KB.upsert(updatedProject);
                this.project = updatedProject;
                const quality = computeQualityScore(this.design);
                this._setMsg('✓ desat · quality ' + quality.score + '/100', 'ok');
            } catch (e) {
                this._setMsg('✗ ' + (e?.message || 'error'), 'err');
            }
        });
    }

    _refresh() {
        // Refresh quality + stack + tokens labels + sumbar + schedule sense
        // re-bindar tots els controls. Sols actualitzem textos.
        const c = this.design.content;
        const validation = validateTokenDesign(this.design);
        const quality    = computeQualityScore(this.design);

        // Update tokens labels
        for (const g of TOKEN_GROUPS) {
            const lbl = document.querySelector('[data-tokens="' + g.id + '"]');
            if (lbl) {
                const pct = c.distribution[g.id] ?? 0;
                lbl.textContent = Math.round((c.totalSupply || 0) * pct).toLocaleString() + ' · ' + Math.round(pct * 100) + '%';
            }
            const seg = document.querySelector('[data-seg="' + g.id + '"]');
            if (seg) seg.style.width = ((c.distribution[g.id] || 0) * 100) + '%';
        }

        // Update sumbar text
        const distSum = Object.values(c.distribution).reduce((s, p) => s + p, 0);
        const sumColor = Math.abs(distSum - 1) < 0.001 ? '#22c55e' : '#ef4444';
        const sumIcon  = Math.abs(distSum - 1) < 0.001 ? '✓' : '✗';
        const sumIconEl = document.querySelector('.tk-sumbar-icon');
        if (sumIconEl) { sumIconEl.textContent = sumIcon; sumIconEl.style.color = sumColor; }
        const sumTextEl = document.querySelector('.tk-sumbar > span:nth-child(2)');
        if (sumTextEl) { sumTextEl.textContent = (distSum * 100).toFixed(1) + '% / 100%'; sumTextEl.style.color = sumColor; }

        // Update save button enabled state
        const saveBtn = document.getElementById('tkSave');
        if (saveBtn) saveBtn.disabled = !validation.ok;

        // Update schedule table
        const sched = computeVestingSchedule(this.design, { months: 60 });
        const quarters = [0, 3, 6, 12, 24, 36, 48, 60];
        const tbody = document.getElementById('tkSched');
        if (tbody) {
            tbody.innerHTML = quarters.map(m => {
                const row = sched[m] || { byGroup: {}, totalUnlocked: 0 };
                const tds = TOKEN_GROUPS.map(g => {
                    const v = row.byGroup[g.id] || 0;
                    const pct = c.totalSupply > 0 ? (v / c.totalSupply * 100) : 0;
                    return '<td style="color:' + g.color + ';font-family:var(--font-mono);font-size:11px;text-align:right;" title="' + v.toLocaleString() + ' tokens">' + pct.toFixed(1) + '%</td>';
                }).join('');
                const totalPct = c.totalSupply > 0 ? (row.totalUnlocked / c.totalSupply * 100) : 0;
                return '<tr><td style="font-family:var(--font-mono);font-size:11px;">M' + m + '</td>' + tds + '<td style="font-family:var(--font-mono);font-size:11px;font-weight:700;text-align:right;">' + totalPct.toFixed(0) + '%</td></tr>';
            }).join('');
        }

        // Update quality card · update num + reasons
        const scoreEl = document.querySelector('.tk-quality-score');
        if (scoreEl) {
            scoreEl.textContent = quality.score;
            scoreEl.style.color = quality.score >= 75 ? '#22c55e' : quality.score >= 50 ? '#facc15' : '#ef4444';
        }
        const qBox = document.querySelector('.tk-quality');
        if (qBox) qBox.style.background = quality.score >= 75 ? '#22c55e20' : quality.score >= 50 ? '#facc1520' : '#ef444420';
        const qMeta = document.querySelector('.tk-quality-meta');
        if (qMeta) {
            qMeta.innerHTML = '<div>' + (quality.valid ? '✓ Design vàlid' : '✗ Design no vàlid') + ' · ' + validation.errors.length + ' errors validation</div>' +
                (quality.reasons.length > 0
                    ? '<div class="tk-quality-reasons">⚠ ' + quality.reasons.map(r => this._esc(r)).join(' · ') + '</div>'
                    : '<div class="tk-quality-reasons">✓ Sense alertes</div>');
        }
    }

    _renderFull() {
        const app = document.getElementById('app');
        if (!app) return;
        app.innerHTML = this._htmlMain();
        this._bindInputs();
    }

    _setMsg(text, kind) {
        const msg = document.getElementById('tkMsg');
        if (msg) { msg.textContent = text; msg.className = 'tk-msg ' + (kind || ''); }
    }

    _esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
