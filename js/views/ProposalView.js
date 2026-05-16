// =============================================================================
// TEAMTOWERS SOS V11 — PROPOSAL VIEW (PROPOSAL-GENERATOR sprint A)
// Ruta · /js/views/ProposalView.js  →  /proposals?project={id}
//
// CRUD propostes · IA brief → draft auto (runEscalation failover) · skill
// matching live · status state machine · print-css per PDF.
// =============================================================================

import { KB } from '../core/kb.js';
import { findProjectByIdAny } from '../core/projectLookup.js';
import { getSkillById } from '../core/skillTaxonomy.js';
import {
    PROPOSAL_TYPE, PROPOSAL_STATUS,
    buildEmptyProposal,
    addDeliverable, removeDeliverable,
    setSkillsRequired,
    validateProposal,
    transitionProposalStatus,
    matchSkillsToBrief,
    computeProposalQuality,
    computeProposalsBreakdown,
    buildAiPromptForProposal,
    applyAIDraftToProposal,
} from '../core/proposalService.js';
import { attachAIFormFeedback, renderInlineFeedbackHtml } from '../core/aiFormFeedback.js';
import { label } from '../core/sosCopy.js';

export default class ProposalView {

    constructor() {
        document.title = 'Propostes · SOS V11';
        try {
            const u = new URL(window.location.href);
            this.projectId = u.searchParams.get('project') || null;
        } catch (_) { this.projectId = null; }
        this.project = null;
        this.proposals = [];
    }

    async getHtml() {
        if (!this.projectId) return this._htmlNoProject();
        try { this.project = await findProjectByIdAny(this.projectId); } catch (_) { this.project = null; }
        if (!this.project) return this._htmlNotFound();
        try { this.proposals = await KB.query({ type: PROPOSAL_TYPE, projectId: this.projectId }) || []; } catch (_) { this.proposals = []; }
        return this._htmlMain();
    }

    async afterRender() {
        if (!this.project) return;
        this._bindCreate();
        this._bindRowActions();
        this._bindBriefMatcher();
    }

    _htmlNoProject() {
        return `<div style="min-height:100dvh;background:var(--bg-dark);color:var(--text-main);font-family:var(--font-base);padding:2rem;">
            <div style="max-width:600px;margin:4rem auto;text-align:center;background:var(--bg-panel);padding:2rem;border-radius:8px;border:1px solid var(--border-default);">
                <h1>📝 Propostes</h1><p>Cal indicar projecte.</p>
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
        const br = computeProposalsBreakdown(this.proposals);
        const sorted = this.proposals.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        const rows = sorted.length === 0
            ? '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:20px;">Cap proposta encara · genera una amb el brief inferior</td></tr>'
            : sorted.map(prop => {
                const c = prop.content || {};
                const meta = PROPOSAL_STATUS[c.status] || PROPOSAL_STATUS.draft;
                const q = computeProposalQuality(prop);
                const actions = [];
                if (c.status === 'draft')                 actions.push(`<button class="pr-btn-sm" data-act="send" data-id="${prop.id}">📤 Enviar</button>`);
                if (c.status === 'sent')                  actions.push(`<button class="pr-btn-sm pr-btn-ok" data-act="accept" data-id="${prop.id}">✓ Accepta</button>`);
                if (c.status === 'sent')                  actions.push(`<button class="pr-btn-sm pr-btn-x" data-act="reject" data-id="${prop.id}">✗ Rebutja</button>`);
                actions.push(`<button class="pr-btn-sm" data-act="view" data-id="${prop.id}">👁 Veure</button>`);
                actions.push(`<button class="pr-btn-sm" data-act="del" data-id="${prop.id}" title="Esborrar">🗑</button>`);
                return `<tr>
                    <td>${this._esc(c.client || '—')}</td>
                    <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;font-size:0.78rem;color:var(--text-secondary);">${this._esc((c.summary || '').slice(0, 80))}…</td>
                    <td style="text-align:right;font-family:var(--font-mono);">${(c.pricing?.total || 0).toFixed(0)} ${this._esc(c.pricing?.currency || 'EUR')}</td>
                    <td><span style="background:${meta.color}25;color:${meta.color};padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;font-family:var(--font-mono);">${meta.icon} ${this._esc(meta.label.toUpperCase())}</span></td>
                    <td style="text-align:right;font-family:var(--font-mono);font-size:11px;color:${q.score >= 75 ? '#22c55e' : q.score >= 50 ? '#facc15' : '#ef4444'};">${q.score}/100</td>
                    <td style="text-align:right;white-space:nowrap;">${actions.join(' ')}</td>
                </tr>`;
            }).join('');

        const statsHtml = `
            <div class="pr-stats">
                <div class="pr-stat"><span class="pr-stat-num">${br.total}</span><span class="pr-stat-lbl">Total</span></div>
                <div class="pr-stat" style="color:#3b82f6;"><span class="pr-stat-num">${br.sent}</span><span class="pr-stat-lbl">Enviades</span></div>
                <div class="pr-stat" style="color:#22c55e;"><span class="pr-stat-num">${br.accepted}</span><span class="pr-stat-lbl">Acceptades</span></div>
                <div class="pr-stat" style="color:#ef4444;"><span class="pr-stat-num">${br.rejected}</span><span class="pr-stat-lbl">Rebutjades</span></div>
                <div class="pr-stat" style="color:#22c55e;"><span class="pr-stat-num">${br.acceptedValue.toFixed(0)}</span><span class="pr-stat-lbl">Guanyat €</span></div>
                <div class="pr-stat"><span class="pr-stat-num">${(br.acceptedRatio * 100).toFixed(0)}%</span><span class="pr-stat-lbl">Win rate</span></div>
            </div>
        `;

        return `
        <style>
            .pr-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); }
            .pr-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-wrap:wrap; }
            .pr-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .pr-logo span { color:var(--accent-indigo); }
            .pr-main { max-width:1200px; margin:0 auto; padding:1.5rem; }
            .pr-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem 1.2rem; margin-bottom:1rem; }
            .pr-stats { display:grid; grid-template-columns:repeat(6,1fr); gap:8px; }
            @media (max-width:780px) { .pr-stats { grid-template-columns:repeat(3,1fr); } }
            .pr-stat { background:#0008; border:1px solid var(--border-default); border-radius:6px; padding:10px; text-align:center; }
            .pr-stat-num { display:block; font-size:1.4rem; font-weight:700; font-family:var(--font-mono); }
            .pr-stat-lbl { display:block; font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-top:2px; }
            .pr-form-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:8px; margin-top:8px; }
            .pr-form-row input, .pr-form-row textarea, .pr-form-row select { background:#000; color:var(--text-main); border:1px solid var(--border-default); border-radius:4px; padding:8px; font-family:var(--font-base); font-size:0.85rem; }
            .pr-brief { width:100%; box-sizing:border-box; background:#000; color:var(--text-main); border:1px solid var(--border-default); border-radius:4px; padding:10px; font-family:var(--font-base); font-size:0.88rem; line-height:1.5; resize:vertical; min-height:90px; margin-top:6px; }
            .pr-skill-matches { display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }
            .pr-skill-chip { background:#6366f120; color:#a5b4fc; padding:3px 9px; border-radius:999px; font-size:11px; font-weight:600; font-family:var(--font-mono); border:1px solid #6366f150; }
            .pr-btn { padding:9px 16px; border-radius:4px; border:1px solid #6366f1; background:#6366f1; color:#fff; font-size:0.85rem; font-weight:700; cursor:pointer; }
            .pr-btn:disabled { opacity:0.5; cursor:wait; }
            .pr-btn-sm { padding:3px 8px; border-radius:3px; border:1px solid var(--border-default); background:var(--bg-dark); color:var(--text-main); font-size:11px; cursor:pointer; }
            .pr-btn-sm:hover { background:var(--glass-hover); }
            .pr-btn-ok { background:#22c55e; border-color:#22c55e; color:#fff; }
            .pr-btn-x { background:#ef4444; border-color:#ef4444; color:#fff; }
            table.pr-rows { width:100%; border-collapse:collapse; font-size:0.82rem; }
            table.pr-rows th, table.pr-rows td { padding:8px; text-align:left; border-bottom:1px solid var(--border-default); }
            table.pr-rows th { background:#0008; font-size:11px; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-muted); }
            /* DESIGN-SYSTEM v3 · feedback ara via aiFormFeedback widget */
            @media print { .pr-topbar, .pr-btn, .pr-btn-sm, button { display:none !important; } body { background:#fff !important; color:#000 !important; } .pr-card { border-color:#ccc !important; background:#fff !important; color:#000 !important; } }
        </style>
        <div class="pr-shell">
            <div class="pr-topbar">
                <a href="/dashboard" data-link class="pr-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Propostes</span>
                <span style="flex:1;"></span>
                <a href="/lifecycle?project=${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">🌀 Lifecycle</a>
                <a href="/invoices?project=${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">🧾 Factures</a>
                <a href="/project/${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">← Hub</a>
            </div>
            <div class="pr-main">
                <h1 style="margin:0 0 1rem 0;font-size:1.35rem;">📝 ${this._esc(projName)} · Propostes</h1>

                ${statsHtml}

                <div class="pr-card" style="margin-top:1rem;">
                    <h3 style="margin:0 0 0.4rem 0;">🤖 Nova proposta · brief + IA</h3>
                    <p style="font-size:0.78rem;color:var(--text-secondary);margin:0 0 0.4rem 0;">Escriu què demana el client · l'IA detectarà skills i generarà un draft (escope · deliverables · pricing). Després pots ajustar i enviar.</p>
                    <div class="pr-form-row">
                        <input type="text" id="prClient" placeholder="Client (nom o entitat)">
                        <input type="date" id="prValidUntil" placeholder="Vàlida fins a">
                        <select id="prCurrency">
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                    <textarea class="pr-brief" id="prBrief" placeholder="Brief · ex 'Necessitem dissenyar la governança cooperativa de la nostra coop tecnològica · 8 socis · sense experiència prèvia · volem decisions consensuades sense bloquejar'"></textarea>
                    <div id="prSkillMatches" class="pr-skill-matches"></div>
                    <div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                        <button class="pr-btn" id="prGenerate">${this._esc(label('cta.generate'))}</button>
                        <button class="pr-btn" id="prCreateManual" style="background:var(--bg-panel);color:var(--text-main);border-color:var(--border-default);">📝 Manual</button>
                    </div>
                    <div style="margin-top:8px;">${renderInlineFeedbackHtml({ id: 'prFeedback' })}</div>
                </div>

                <div class="pr-card">
                    <h3 style="margin:0 0 0.6rem 0;">📑 Propostes · ${this.proposals.length}</h3>
                    <table class="pr-rows">
                        <thead><tr><th>Client</th><th>Summary</th><th style="text-align:right;">Total</th><th>Estat</th><th style="text-align:right;">Quality</th><th></th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
    }

    _bindBriefMatcher() {
        const brief = document.getElementById('prBrief');
        const matchesEl = document.getElementById('prSkillMatches');
        if (!brief || !matchesEl) return;
        let timer = null;
        brief.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                const text = brief.value.trim();
                if (text.length < 15) { matchesEl.innerHTML = ''; return; }
                const matches = matchSkillsToBrief(text, { topN: 8 });
                matchesEl.innerHTML = matches.map(m =>
                    `<span class="pr-skill-chip" title="domain ${m.skill.domain} · tier ${m.skill.tier} · score ${m.score}">${this._esc(m.skill.label)}</span>`
                ).join('');
            }, 400);
        });
    }

    _bindCreate() {
        const genBtn = document.getElementById('prGenerate');
        const manualBtn = document.getElementById('prCreateManual');
        // DESIGN-SYSTEM v3 · widget reutilitzable per a feedback IA i manuals (DRY)
        const fb = attachAIFormFeedback(document.getElementById('prFeedback'), { autoFadeOk: 3500 });
        this._fb = fb;

        const collectInputs = () => ({
            client:     document.getElementById('prClient')?.value.trim() || '',
            brief:      document.getElementById('prBrief')?.value.trim() || '',
            validUntil: document.getElementById('prValidUntil')?.value || null,
            currency:   document.getElementById('prCurrency')?.value || 'EUR',
        });

        if (manualBtn) manualBtn.addEventListener('click', async () => {
            const { client, brief, validUntil, currency } = collectInputs();
            if (!client) { fb.setError('client ' + label('hint.required')); return; }
            if (brief.length < 20) { fb.setError(label('err.too_short').replace('{n}', '20') + ' · brief'); return; }
            try {
                let prop = buildEmptyProposal({ projectId: this.projectId, client, summary: brief, validUntil, currency });
                const matches = matchSkillsToBrief(brief, { topN: 8 });
                prop = setSkillsRequired(prop, matches.map(m => m.skillId));
                await KB.upsert(prop);
                fb.setOk(label('state.done') + ' · afegeix deliverables manualment');
                setTimeout(() => window.location.reload(), 600);
            } catch (e) {
                fb.setError(e?.message || label('state.error'));
            }
        });

        if (genBtn) genBtn.addEventListener('click', async () => {
            const { client, brief, validUntil, currency } = collectInputs();
            if (!client) { fb.setError('client ' + label('hint.required')); return; }
            if (brief.length < 20) { fb.setError(label('err.too_short').replace('{n}', '20') + ' · brief'); return; }
            genBtn.disabled = true;
            const origText = genBtn.textContent;
            genBtn.textContent = '⏳ ' + label('state.thinking');
            try {
                const { runPrompt } = await import('../core/aiRouterService.js');
                const matches = matchSkillsToBrief(brief, { topN: 8 });
                const projectName = this.project.nombre || this.project.name || this.project.id;
                const projectCanvas = this.project.content?.canvas;
                // Mostra thinking · client + brief com a context al usuari
                fb.setThinking({ kind: 'runner-start', sopTitle: 'Proposta · ' + client, iteration: 1 });
                const prompt = buildAiPromptForProposal({ brief, client, projectName, projectCanvas, matchedSkills: matches });
                const result = await runPrompt({ prompt, taskKind: 'creative-narrative', maxAttempts: 3 });
                const raw = (result && (result.output || result.text || result.result)) || '';
                if (!raw) { fb.setError(label('err.ai_failed')); return; }
                let prop = buildEmptyProposal({ projectId: this.projectId, client, summary: brief, validUntil, currency });
                prop = setSkillsRequired(prop, matches.map(m => m.skillId));
                try {
                    prop = applyAIDraftToProposal(prop, raw);
                } catch (e) {
                    console.warn('[proposal] AI parse failed · saved as summary-only', e);
                    fb.setWarning('IA no JSON · desat com a summary · afegeix deliverables manualment');
                }
                await KB.upsert(prop);
                fb.setOk(label('state.done') + ' · ' + prop.content.deliverables.length + ' deliverables');
                setTimeout(() => window.location.reload(), 800);
            } catch (e) {
                console.warn('[proposal] generation failed', e);
                fb.setError(e?.message || label('err.ai_failed'));
            } finally {
                genBtn.disabled = false;
                genBtn.textContent = origText;
            }
        });
    }

    _bindRowActions() {
        document.querySelectorAll('[data-act]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const act = btn.dataset.act;
                const id = btn.dataset.id;
                const prop = this.proposals.find(x => x.id === id);
                if (!prop) return;
                try {
                    if (act === 'send')     { const n = transitionProposalStatus(prop, 'sent');     await KB.upsert(n); }
                    if (act === 'accept')   { const n = transitionProposalStatus(prop, 'accepted'); await KB.upsert(n); }
                    if (act === 'reject')   { const n = transitionProposalStatus(prop, 'rejected'); await KB.upsert(n); }
                    if (act === 'del') {
                        if (!confirm('Esborrar proposta?')) return;
                        if (KB.delete) await KB.delete(id);
                        else { prop.content.status = 'rejected'; await KB.upsert(prop); }
                    }
                    if (act === 'view') {
                        this._showDetail(prop);
                        return;
                    }
                    setTimeout(() => window.location.reload(), 200);
                } catch (e) {
                    alert('Error · ' + (e?.message || 'desconegut'));
                }
            });
        });
    }

    _showDetail(prop) {
        const c = prop.content || {};
        const q = computeProposalQuality(prop);
        const dels = (c.deliverables || []).map(d =>
            `<li>${this._esc(d.description)} · <code>${d.estimatedHours}h · ${d.price.toFixed(2)}€</code></li>`
        ).join('');
        const skills = (c.skillsRequired || []).map(sid => {
            const sk = getSkillById(sid);
            return sk ? `<span class="pr-skill-chip">${this._esc(sk.label)}</span>` : '';
        }).join('');
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;overflow-y:auto;';
        modal.innerHTML = `
            <div style="max-width:720px;background:var(--bg-panel);border:1px solid var(--border-default);border-radius:8px;padding:1.5rem;width:100%;font-family:var(--font-base);color:var(--text-main);max-height:90vh;overflow-y:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                    <h2 style="margin:0;">📝 Proposta · ${this._esc(c.client)}</h2>
                    <div style="display:flex;gap:8px;">
                        <button class="pr-btn-sm" onclick="window.print()">🖨 Print/PDF</button>
                        <button class="pr-btn-sm" id="closeModal">✗ Tancar</button>
                    </div>
                </div>
                <div style="font-size:0.85rem;line-height:1.55;color:var(--text-secondary);margin-bottom:1rem;">${this._esc(c.summary || '')}</div>
                <h4>📋 Deliverables · ${(c.deliverables || []).length}</h4>
                <ul style="font-size:0.85rem;line-height:1.55;">${dels || '<li style="color:var(--text-muted);">cap</li>'}</ul>
                <div style="margin:1rem 0;padding:0.8rem;background:#0008;border-radius:6px;font-family:var(--font-mono);font-size:0.95rem;">
                    💰 Total · <strong>${(c.pricing?.total || 0).toFixed(2)} ${this._esc(c.pricing?.currency || 'EUR')}</strong>
                </div>
                <h4>🎯 Skills</h4>
                <div class="pr-skill-matches" style="margin-bottom:1rem;">${skills || '<span style="color:var(--text-muted);">cap</span>'}</div>
                <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">
                    Estat · ${this._esc(c.status)} · vàlida fins · ${this._esc(c.validUntil || '—')} · quality · ${q.score}/100
                </div>
                ${q.reasons.length ? `<div style="margin-top:6px;font-size:11px;color:var(--text-muted);">⚠ ${q.reasons.map(r => this._esc(r)).join(' · ')}</div>` : ''}
            </div>`;
        modal.addEventListener('click', (e) => { if (e.target === modal || e.target.id === 'closeModal') modal.remove(); });
        document.body.appendChild(modal);
    }

    _esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
