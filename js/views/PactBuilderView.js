// TEAMTOWERS SOS V11 — PACT BUILDER VIEW (PACT-001 sprint B)
//
// Ruta: /pact?project={projectId}
// UI builder paso-a-paso del primer contrato (pacto de socios
// dinámico). Persiste draft en KB tras cada cambio. Cuando todas las
// parties han firmado, status pasa a 'signed' automáticamente
// (pactService.addSignature lo gestiona).
//
// Estructura · 3 secciones principales:
//   1. Resumen del pacto (estado · resumen UI · markdown preview)
//   2. Editor por cláusulas (objet · capital · participation ·
//      vesting · decisions · exit · conflict · sunset)
//   3. Parties · añadir/quitar socios + initialShare
//
// Persistencia · nodo KB type='pact' id='{projectId}::pact::sos-v1'.

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import { renderNavLinksHtml, renderNavGroupedHtml, ensureNavGroupStyle, bindNavGroupDropdowns } from '../core/navService.js';
import {
    DEFAULT_PACT_CLAUSES, validateClauses, validatePact, mergeClauses,
    buildPactDraft, addSignature, pactSummary, renderPactMarkdown,
    signPactWithKey, verifyPactSignature,
} from '../core/pactService.js';
import {
    buildEnrichedPactDraft, buildAiPromptForPactClauses, applyAIDraftToPact,
} from '../core/pactEnrichmentService.js';
import { attachAIFormFeedback, renderInlineFeedbackHtml } from '../core/aiFormFeedback.js';
import { label } from '../core/sosCopy.js';
import { getOrCreateSigningKey } from '../core/projectIO.js';
import { renderExplainerBadge, bindExplainerBadges, ensureExplainerStyle } from '../core/didacticService.js';

const PACT_NODE_ID_SUFFIX = '::pact::sos-v1';
const VALID_PARTICIPATION = ['slicing-pie', 'fixed-shares', 'hybrid'];
const VALID_DECISION_MODES = ['consensus', 'majority', 'multisig'];
const VALID_VESTING_TYPES = ['linear', 'milestone', 'cliff-only'];

function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export default class PactBuilderView {
    constructor() {
        document.title = 'Pacte de socis · SOS V11';
        this.projectId = null;
        this.project = null;
        this.pact = null;
    }

    async getHtml() {
        await store.init();
        await KB.init();
        const params = new URLSearchParams(window.location.search);
        this.projectId = params.get('project');
        if (!this.projectId) return this._htmlNoProject();
        // BUG-FIX · fallback KB+store via projectLookup (projectes creats per MAX bootstrap
        // viuen al KB · projectes legacy només al store · cal cobrir ambdós)
        const { findProjectByIdAny } = await import('../core/projectLookup.js');
        this.project = await findProjectByIdAny(this.projectId);
        if (!this.project) return this._htmlError('Projecte no trobat: ' + this.projectId);
        // Cargar pact si existe
        const pactId = this.projectId + PACT_NODE_ID_SUFFIX;
        this.pact = await KB.getNode(pactId);
        return this._renderShell();
    }

    _htmlNoProject() {
        return `${this._renderStyle()}
        <div class="pb-shell"><div class="pb-empty">
            <div style="font-size:2.4rem;">📜</div>
            <h2 class="mat-hero-h1">Falta el projecte a la URL</h2>
            <p style="color:var(--text-muted);font-size:0.9rem;">Aquesta vista necessita <code>?project={id}</code>.</p>
            <a href="/dashboard" data-link style="color:var(--accent-purple);">← Dashboard</a>
        </div></div>`;
    }

    _htmlError(msg) {
        return `${this._renderStyle()}
        <div class="pb-shell"><div class="pb-empty">
            <div style="font-size:2.4rem;color:var(--accent-red);">✘</div>
            <h2 class="mat-hero-h1">${escapeHtml(msg)}</h2>
            <a href="/dashboard" data-link style="color:var(--accent-purple);">← Dashboard</a>
        </div></div>`;
    }

    _renderShell() {
        const p = this.project;
        const exists = !!this.pact;
        const summary = exists ? pactSummary(this.pact) : null;
        const projectTypeId = p.matriuProjectType || null;

        return `
        ${this._renderStyle()}
        <div class="pb-shell">
            <div class="pb-topbar">
                <a href="/" data-link class="pb-logo">🗼 Team<span>Towers</span></a>
                <span class="pb-title">📜 Pacte de socis ${renderExplainerBadge('smart-contract', { size: 'xs' })} ${renderExplainerBadge('slicing-pie', { size: 'xs' })}</span>
                <div class="pb-spacer"></div>
                <a href="/project/${encodeURIComponent(p.id)}" data-link class="pb-link">🎛 Panel projecte</a>
                <a href="/value-accounting?project=${encodeURIComponent(p.id)}" data-link class="pb-link">🥧 Tarta</a>
                
            </div>

            <div class="pb-main">
                <div class="pb-hero">
                    <h1 class="mat-hero-h1">📜 Pacte <strong>de socis</strong> · ${escapeHtml(p.nombre || p.name || p.id)}</h1>
                    <p class="pb-hero-sub">Primer contracte del Mètode SOS · acord viu, no de notari · cada hora, cada euro, cada idea queda registrat i reparteix tarta automàticament.</p>
                    ${exists ? this._renderStatusRow(summary) : this._renderInitForm(projectTypeId)}
                </div>

                <!-- v124 · panel wallet · bridge Pact ↔ Wallet (saldo + capital líquid + ingressos) -->
                <div class="pb-section" id="pbWalletPanel" style="background:var(--bg-panel);border:1px solid var(--border-default);border-radius:var(--radius-md);padding:14px 18px;">
                    <h2 style="margin:0 0 10px 0;">💼 Wallet del projecte</h2>
                    <div id="pbWalletBody" style="color:var(--text-muted);font-size:0.85rem;">Carregant saldo…</div>
                </div>

                ${exists ? `
                <!-- v124 · panel notarització permaweb · només si signed -->
                <div class="pb-section" id="pbNotaryPanel" style="background:var(--bg-panel);border:1px solid var(--border-default);border-radius:var(--radius-md);padding:14px 18px;">
                    <h2 style="margin:0 0 10px 0;">🌐 Notarització al permaweb</h2>
                    <div id="pbNotaryBody" style="color:var(--text-muted);font-size:0.85rem;">Comprovant estat…</div>
                </div>` : ''}

                ${exists ? this._renderEditor() : ''}

                ${exists ? `
                <div class="pb-section">
                    <h2>📄 Markdown preview</h2>
                    <pre class="pb-markdown" id="pbMarkdownPreview"></pre>
                    <button class="pb-btn-secondary" id="pbCopyMarkdown">📋 Copiar al clipboard</button>
                </div>
                ` : ''}
            </div>
        </div>
        `;
    }

    _renderStatusRow(summary) {
        const statusColor = summary.status === 'signed' ? '#22c55e' : summary.status === 'active' ? '#c084fc' : '#fbbf24';
        return `
        <div class="pb-stats-row">
            <div class="pb-stat" style="--pb-c:${statusColor};">
                <div class="pb-stat-label">Estat</div>
                <div class="pb-stat-value" style="text-transform:uppercase;font-size:1.4rem;">${escapeHtml(summary.status)}</div>
            </div>
            <div class="pb-stat" style="--pb-c:#c084fc;">
                <div class="pb-stat-label">Socis</div>
                <div class="pb-stat-value">${summary.partiesCount}</div>
            </div>
            <div class="pb-stat" style="--pb-c:${summary.signedAll ? '#22c55e' : '#fbbf24'};">
                <div class="pb-stat-label">Signatures</div>
                <div class="pb-stat-value">${summary.signaturesCount}/${summary.partiesCount}</div>
            </div>
            <div class="pb-stat" style="--pb-c:#c25a3a;">
                <div class="pb-stat-label">Quòrum</div>
                <div class="pb-stat-value">${summary.quorumPct}%</div>
                <div class="pb-stat-sub">${summary.decisionMode}</div>
            </div>
            <div class="pb-stat" style="--pb-c:#5a6e4f;">
                <div class="pb-stat-label">Vesting</div>
                <div class="pb-stat-value">${summary.vestingMonths}m</div>
            </div>
            <div class="pb-stat" style="--pb-c:#fbbf24;">
                <div class="pb-stat-label">Slicing</div>
                <div class="pb-stat-value" style="font-size:1rem;">${escapeHtml(summary.participation)}</div>
            </div>
        </div>
        `;
    }

    _renderInitForm(projectTypeId) {
        return `
        <div class="pb-init">
            <p style="color:var(--text-secondary);line-height:1.6;margin-bottom:14px;">Encara no hi ha pacte. Crea el draft amb el teu nom com a primer soci · després pots afegir-ne més des de l'editor.</p>
            <div class="pb-init-form">
                <input type="text" id="pbInitName" class="pb-input" placeholder="El teu nom (displayName) ex. Alvaro Solache">
                <input type="text" id="pbInitId" class="pb-input" placeholder="DID o handle (identityId) ex. did:sos:abc">
                <input type="text" id="pbInitRole" class="pb-input" placeholder="Rol al projecte ex. Fundador / CEO">
                <button class="pb-btn" id="pbInitCreate">+ Crear draft del pacte</button>
            </div>
            ${projectTypeId ? `<p style="color:var(--text-muted);font-size:0.78rem;margin-top:10px;font-family:monospace;">tipus · ${escapeHtml(projectTypeId)}</p>` : ''}
        </div>
        `;
    }

    _renderEditor() {
        const c = this.pact.content;
        const cl = c.clauses;
        const parties = c.parties;
        return `
        <div class="pb-grid">
            <div class="pb-section">
                <h2>1. Objecte</h2>
                <textarea class="pb-input pb-textarea" id="pbObject" rows="3">${escapeHtml(cl.object)}</textarea>
            </div>

            <div class="pb-section">
                <h2>2. Participació</h2>
                <select class="pb-input" id="pbParticipation">
                    ${VALID_PARTICIPATION.map(v => `<option value="${v}" ${cl.participation === v ? 'selected' : ''}>${v}</option>`).join('')}
                </select>
                <p class="pb-hint">slicing-pie · equity dinàmic · fixed-shares · % fix per soci · hybrid · combinació</p>
            </div>

            <div class="pb-section">
                <h2>3. Capital ${renderExplainerBadge('fair-fractal-tokenomics', { size: 'xs' })}</h2>
                <div class="pb-row">
                    <label>Capital total inicial (€)
                        <input type="number" min="0" step="100" class="pb-input" id="pbCapTotal" value="${cl.capital.totalEur}">
                    </label>
                    <label class="pb-checkbox">
                        <input type="checkbox" id="pbCapHasCash" ${cl.capital.hasInitialCash ? 'checked' : ''}> Capital líquid?
                    </label>
                    <label class="pb-checkbox">
                        <input type="checkbox" id="pbCapFairFractal" ${cl.capital.fairFractal ? 'checked' : ''}> Regles Fair Fractal?
                    </label>
                </div>
            </div>

            <div class="pb-section">
                <h2>4. Vesting</h2>
                <div class="pb-row">
                    <label>Mesos
                        <input type="number" min="0" step="1" class="pb-input" id="pbVestingMonths" value="${cl.vesting.months}">
                    </label>
                    <label>Cliff (mesos)
                        <input type="number" min="0" step="1" class="pb-input" id="pbVestingCliff" value="${cl.vesting.cliffMonths}">
                    </label>
                    <label>Tipus
                        <select class="pb-input" id="pbVestingType">
                            ${VALID_VESTING_TYPES.map(v => `<option value="${v}" ${cl.vesting.type === v ? 'selected' : ''}>${v}</option>`).join('')}
                        </select>
                    </label>
                </div>
            </div>

            <div class="pb-section">
                <h2>5. Decisions</h2>
                <div class="pb-row">
                    <label>Mode
                        <select class="pb-input" id="pbDecMode">
                            ${VALID_DECISION_MODES.map(v => `<option value="${v}" ${cl.decisions.mode === v ? 'selected' : ''}>${v}</option>`).join('')}
                        </select>
                    </label>
                    <label>Quòrum (%)
                        <input type="number" min="0" max="100" step="1" class="pb-input" id="pbDecQuorum" value="${Math.round(cl.decisions.quorum * 100)}">
                    </label>
                </div>
            </div>

            <div class="pb-section">
                <h2>6. Exit</h2>
                <div class="pb-row pb-row-stack">
                    <label>Trigger
                        <input type="text" class="pb-input" id="pbExitTrigger" value="${escapeHtml(cl.exit.trigger)}">
                    </label>
                    <label>Snapshot
                        <input type="text" class="pb-input" id="pbExitSnapshot" value="${escapeHtml(cl.exit.snapshot)}">
                    </label>
                    <label>Fórmula
                        <input type="text" class="pb-input" id="pbExitFormula" value="${escapeHtml(cl.exit.formula)}">
                    </label>
                    <label>Finestra de pagament
                        <input type="text" class="pb-input" id="pbExitWindow" value="${escapeHtml(cl.exit.payoutWindow)}">
                    </label>
                </div>
            </div>

            <div class="pb-section">
                <h2>7. Resolució de conflictes</h2>
                <div class="pb-row">
                    <label>Primer pas
                        <input type="text" class="pb-input" id="pbConflictFirst" value="${escapeHtml(cl.conflict.firstPath)}">
                    </label>
                    <label>Segon pas
                        <input type="text" class="pb-input" id="pbConflictSecond" value="${escapeHtml(cl.conflict.secondPath)}">
                    </label>
                </div>
            </div>
        </div>

        <div class="pb-section">
            <h2>👥 Socis (${parties.length})</h2>
            <table class="pb-table">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>ID (DID/handle)</th>
                        <th>Rol</th>
                        <th>Aportació</th>
                        <th style="text-align:right;">Initial share</th>
                        <th style="text-align:center;">Multiplicador</th>
                        <th>Signat?</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${parties.map((pt, i) => {
                        const signed = c.signatures.find(s => s.identityId === pt.identityId);
                        return `
                        <tr>
                            <td>${escapeHtml(pt.displayName)}</td>
                            <td style="font-family:monospace;font-size:0.78rem;color:var(--text-muted);">${escapeHtml(pt.identityId)}</td>
                            <td>${escapeHtml(pt.role)}</td>
                            <td>${escapeHtml(pt.contributionType)}</td>
                            <td style="text-align:right;font-family:'Instrument Serif',Georgia,serif;font-style:italic;color:var(--accent-purple);font-size:1.1rem;">${(pt.initialShare * 100).toFixed(1)}%</td>
                            <td style="text-align:center;font-family:monospace;color:#fbbf24;">${pt.multiplier ? '×' + pt.multiplier : '—'}</td>
                            <td>${signed ? `<span style="color:#4ade80;font-family:monospace;font-size:0.78rem;" title="${escapeHtml(signed.algorithm || 'symbolic')} · ${escapeHtml(signed.hashSnapshot || '')}">✓ ${new Date(signed.signedAt).toLocaleDateString('ca-ES')} ${signed.algorithm === 'ecdsa-p256-sha256' ? '🔐' : '·'}</span>` : '<button class="pb-btn-sign" data-sign="' + escapeHtml(pt.identityId) + '">Signar</button>'}</td>
                            <td><button class="pb-btn-remove" data-remove="${i}" title="Treure">🗑</button></td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <details class="pb-add-party">
                <summary>+ Afegir soci</summary>
                <div class="pb-row" style="margin-top:10px;">
                    <input type="text" class="pb-input" id="pbAddName" placeholder="Nom · ex. Núria">
                    <input type="text" class="pb-input" id="pbAddId" placeholder="DID/handle · ex. did:sos:def">
                    <input type="text" class="pb-input" id="pbAddRole" placeholder="Rol · ex. CTO">
                    <input type="text" class="pb-input" id="pbAddContrib" placeholder="Aportació · ex. code-and-time">
                    <input type="number" min="0" max="100" step="0.1" class="pb-input" id="pbAddShare" placeholder="Initial share %">
                    <input type="number" min="0" step="0.1" class="pb-input" id="pbAddMultiplier" placeholder="Multiplicador (opt)">
                    <button class="pb-btn" id="pbAddPartyBtn">+ Afegir</button>
                </div>
            </details>
        </div>

        <div class="pb-actions">
            <button class="pb-btn pb-btn-large" id="pbSaveAll">💾 Guardar canvis al pacte</button>
            <button class="pb-btn-secondary" id="pbReset">↺ Reiniciar amb defaults</button>
        </div>

        <!-- PACT-AI sprint A · enriquir des del projecte + IA -->
        <div class="pb-actions" style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border-default);flex-direction:column;align-items:stretch;gap:8px;">
            <div style="font-size:0.78rem;color:var(--text-secondary);">
                ✨ <strong>Connectat amb el projecte</strong> · agafa parties dels rols cohort manager · capital del ledger · vesting del tokenomics · sunset metric dels invoices.
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="pb-btn-secondary" id="pbEnrich" style="background:rgba(34,197,94,0.12);color:#22c55e;border-color:rgba(34,197,94,0.4);">🔮 Enriquir des del projecte</button>
                <button class="pb-btn-secondary" id="pbAiGenerate" style="background:rgba(168,85,247,0.12);color:#a855f7;border-color:rgba(168,85,247,0.4);">${this._esc(label('cta.generate'))} clàusules</button>
            </div>
            ${renderInlineFeedbackHtml({ id: 'pbAiFeedback' })}
        </div>
        `;
    }

    _esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    _renderStyle() {
        return `<style>
            .pb-shell { background: var(--bg-dark); color: var(--text-main); min-height: 100%; font-family: var(--font-base, sans-serif); display: flex; flex-direction: column; }
            .pb-topbar { display: flex; align-items: center; gap: 1rem; padding: 14px 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; flex-shrink: 0; }
            .pb-logo { font-family: monospace; color: var(--text-muted); text-decoration: none; font-size: 0.78rem; }
            .pb-logo span { color: #6366f1; font-weight: 700; }
            .pb-title { color: var(--text-secondary); font-size: 0.86rem; display: inline-flex; align-items: center; gap: 6px; }
            .pb-spacer { flex: 1; }
            .pb-link { color: var(--text-muted); text-decoration: none; font-size: 0.85rem; padding: 6px 12px; border-radius: 6px; }
            .pb-link:hover { background: var(--glass-hover); color: var(--text-main); }

            .pb-main { flex: 1; padding: clamp(20px, 4vw, 36px); max-width: 1100px; margin: 0 auto; width: 100%; box-sizing: border-box; overflow-y: auto; }
            .pb-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center; gap: 0.6rem; padding: 2rem; }

            .pb-hero { margin-bottom: 24px; padding: 24px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
            .pb-hero h1 { font-size: clamp(1.6rem, 3vw, 2.2rem); color: var(--text-main); line-height: 1.05; margin-bottom: 6px; }
            .pb-hero-sub { color: var(--text-secondary); font-size: 0.92rem; max-width: 720px; line-height: 1.55; margin-bottom: 18px; }

            .pb-stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
            .pb-stat { background: var(--glass-hover); border: 1px solid var(--border-default); border-left: 3px solid var(--pb-c, #888); border-radius: 8px; padding: 12px 14px; }
            .pb-stat-label { font-family: monospace; font-size: 0.7rem; color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase; }
            .pb-stat-value { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 1.6rem; color: var(--text-main); line-height: 1; margin-top: 4px; }
            .pb-stat-sub { font-size: 0.7rem; color: var(--pb-c); margin-top: 3px; font-family: monospace; }

            .pb-init { background: rgba(192,132,252,0.04); border: 1px dashed rgba(192,132,252,0.3); border-radius: 8px; padding: 18px; }
            .pb-init-form { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 8px; align-items: end; }

            .pb-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
            @media (max-width: 880px) { .pb-grid, .pb-init-form { grid-template-columns: 1fr; } }

            .pb-section { background: rgba(255,255,255,0.025); border: 1px solid var(--border-default); border-radius: 10px; padding: 18px; margin-bottom: 18px; }
            .pb-section h2 { color: var(--text-main); font-size: 1rem; margin-bottom: 12px; font-weight: 600; }

            .pb-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; align-items: end; }
            .pb-row-stack { grid-template-columns: 1fr; }
            .pb-row label { display: flex; flex-direction: column; gap: 4px; font-size: 0.75rem; color: var(--text-muted); font-family: monospace; letter-spacing: 0.04em; text-transform: uppercase; }
            .pb-checkbox { flex-direction: row !important; align-items: center !important; gap: 8px !important; text-transform: none !important; padding: 8px 12px; background: var(--bg-elevated); border-radius: 6px; cursor: pointer; }

            .pb-input { background: var(--bg-elevated); border: 1px solid var(--border-default); color: var(--text-main); padding: 10px 12px; border-radius: 6px; font-size: 0.88rem; outline: none; transition: border-color 0.15s; font-family: inherit; }
            .pb-input:focus { border-color: var(--accent-purple); }
            .pb-textarea { resize: vertical; min-height: 60px; font-family: inherit; line-height: 1.55; }
            .pb-hint { color: var(--text-muted); font-size: 0.75rem; margin-top: 6px; font-family: monospace; }

            .pb-table { width: 100%; border-collapse: collapse; font-size: 0.86rem; }
            .pb-table thead th { padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.12); text-align: left; font-family: monospace; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; }
            .pb-table tbody td { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #ddd; vertical-align: middle; }

            .pb-add-party { margin-top: 16px; }
            .pb-add-party summary { color: var(--accent-purple); cursor: pointer; padding: 8px 12px; background: rgba(192,132,252,0.06); border-radius: 6px; font-size: 0.85rem; }

            .pb-actions { display: flex; gap: 12px; margin: 24px 0; flex-wrap: wrap; align-items: center; }
            .pb-btn { background: linear-gradient(135deg, #c084fc, #6366f1); color: var(--text-main); border: 0; padding: 10px 18px; border-radius: 6px; font-weight: 700; cursor: pointer; transition: transform 0.15s; font-size: 0.85rem; }
            .pb-btn:hover { transform: translateY(-1px); }
            .pb-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
            .pb-btn-large { padding: 14px 28px; font-size: 0.95rem; }
            .pb-btn-secondary { background: transparent; border: 1px solid rgba(255,255,255,0.15); color: var(--accent-purple); padding: 9px 16px; border-radius: 6px; cursor: pointer; font-size: 0.82rem; }
            .pb-btn-secondary:hover { border-color: var(--accent-purple); }
            .pb-btn-sign { background: rgba(34,197,94,0.12); border: 1px solid #4ade80; color: #4ade80; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.78rem; }
            .pb-btn-sign:hover { background: rgba(34,197,94,0.2); }
            .pb-btn-remove { background: transparent; border: 0; color: var(--accent-red); cursor: pointer; font-size: 1rem; opacity: 0.6; }
            .pb-btn-remove:hover { opacity: 1; }

            .pb-markdown { background: var(--bg-panel); padding: 16px; border-radius: 6px; color: #ddd; font-family: ui-monospace, monospace; font-size: 0.78rem; line-height: 1.6; max-height: 400px; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word; border: 1px solid var(--border-default); }
        </style>`;
    }

    async afterRender() {
        ensureExplainerStyle();
        bindExplainerBadges(document);
        // v124 · panel wallet sempre (existeixi pacte o no)
        this._renderWalletPanel().catch(e => console.warn('[pact] wallet panel', e?.message));
        if (!this.pact) {
            // init form
            document.getElementById('pbInitCreate')?.addEventListener('click', () => this._handleCreate());
            return;
        }
        // v124 · panel notarització · només si pact existeix
        this._renderNotaryPanel().catch(e => console.warn('[pact] notary panel', e?.message));
        document.getElementById('pbSaveAll')?.addEventListener('click', () => this._handleSave());
        document.getElementById('pbReset')?.addEventListener('click', () => this._handleReset());
        document.getElementById('pbAddPartyBtn')?.addEventListener('click', () => this._handleAddParty());
        document.querySelectorAll('[data-sign]').forEach(btn => btn.addEventListener('click', (e) => this._handleSign(e.target.dataset.sign)));
        document.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', (e) => this._handleRemoveParty(parseInt(e.target.dataset.remove, 10))));
        document.getElementById('pbCopyMarkdown')?.addEventListener('click', () => this._handleCopyMarkdown());
        // PACT-AI · enrich + AI generate
        document.getElementById('pbEnrich')?.addEventListener('click', () => this._handleEnrich());
        document.getElementById('pbAiGenerate')?.addEventListener('click', () => this._handleAiGenerate());
        // Render markdown preview
        const md = renderPactMarkdown(this.pact);
        const pre = document.getElementById('pbMarkdownPreview');
        if (pre) pre.textContent = md;
    }

    async _handleCreate() {
        const name = document.getElementById('pbInitName')?.value?.trim();
        const id = document.getElementById('pbInitId')?.value?.trim();
        const role = document.getElementById('pbInitRole')?.value?.trim();
        if (!name || !id || !role) { alert('Tots els camps són obligatoris.'); return; }
        try {
            const draft = buildPactDraft({
                projectId:     this.projectId,
                projectTypeId: this.project.matriuProjectType || null,
                parties: [{
                    identityId:        id,
                    displayName:       name,
                    role,
                    contributionType:  'time-and-vision',
                    initialShare:      0.5,    // default · operador ajusta luego
                    multiplier:        1.5,    // multiplier fundacional Cohort 0
                }],
            });
            await KB.upsert(draft);
            if (window.navigateTo) window.navigateTo(window.location.pathname + window.location.search);
        } catch (err) {
            alert('Error creant draft: ' + (err?.message || err));
        }
    }

    async _handleSave() {
        if (!this.pact) return;
        const c = this.pact.content;
        // Read all editor inputs
        const next = JSON.parse(JSON.stringify(this.pact));    // deep clone
        next.content.clauses.object = document.getElementById('pbObject').value.trim();
        next.content.clauses.participation = document.getElementById('pbParticipation').value;
        next.content.clauses.capital = {
            totalEur:       parseFloat(document.getElementById('pbCapTotal').value) || 0,
            hasInitialCash: document.getElementById('pbCapHasCash').checked,
            fairFractal:    document.getElementById('pbCapFairFractal').checked,
        };
        next.content.clauses.vesting = {
            months:       parseInt(document.getElementById('pbVestingMonths').value, 10) || 0,
            cliffMonths:  parseInt(document.getElementById('pbVestingCliff').value, 10) || 0,
            type:         document.getElementById('pbVestingType').value,
        };
        next.content.clauses.decisions = {
            mode:    document.getElementById('pbDecMode').value,
            quorum:  Math.max(0, Math.min(1, (parseFloat(document.getElementById('pbDecQuorum').value) || 0) / 100)),
        };
        next.content.clauses.exit = {
            trigger:      document.getElementById('pbExitTrigger').value.trim(),
            snapshot:     document.getElementById('pbExitSnapshot').value.trim(),
            formula:      document.getElementById('pbExitFormula').value.trim(),
            payoutWindow: document.getElementById('pbExitWindow').value.trim(),
        };
        next.content.clauses.conflict = {
            firstPath:   document.getElementById('pbConflictFirst').value.trim(),
            secondPath:  document.getElementById('pbConflictSecond').value.trim(),
        };
        next.content.updatedAt = Date.now();
        // Validate before save
        if (!validatePact(next)) { alert('Pacte invàlid · revisa cláusules + suma initialShare ≤ 1.0'); return; }
        try {
            await KB.upsert(next);
            if (window.navigateTo) window.navigateTo(window.location.pathname + window.location.search);
        } catch (err) { alert('Error guardant: ' + (err?.message || err)); }
    }

    async _handleReset() {
        if (!confirm('Reiniciar les cláusules amb els defaults? Les parties es mantenen.')) return;
        const next = JSON.parse(JSON.stringify(this.pact));
        next.content.clauses = mergeClauses(DEFAULT_PACT_CLAUSES, {});
        next.content.updatedAt = Date.now();
        try {
            await KB.upsert(next);
            if (window.navigateTo) window.navigateTo(window.location.pathname + window.location.search);
        } catch (err) { alert('Error: ' + (err?.message || err)); }
    }

    async _handleAddParty() {
        const name = document.getElementById('pbAddName')?.value?.trim();
        const id = document.getElementById('pbAddId')?.value?.trim();
        const role = document.getElementById('pbAddRole')?.value?.trim();
        const contrib = document.getElementById('pbAddContrib')?.value?.trim();
        const shareStr = document.getElementById('pbAddShare')?.value;
        const multStr = document.getElementById('pbAddMultiplier')?.value;
        if (!name || !id || !role || !contrib || !shareStr) { alert('Tots els camps obligatoris excepte multiplicador'); return; }
        const initialShare = (parseFloat(shareStr) || 0) / 100;
        const multiplier = multStr ? parseFloat(multStr) : null;
        const next = JSON.parse(JSON.stringify(this.pact));
        const newParty = {
            identityId: id, displayName: name, role,
            contributionType: contrib,
            initialShare,
        };
        if (multiplier && multiplier > 0) newParty.multiplier = multiplier;
        next.content.parties.push(newParty);
        next.content.updatedAt = Date.now();
        if (!validatePact(next)) { alert('Suma initialShare excedeix 1.0 · revisa els altres socis.'); return; }
        try {
            await KB.upsert(next);
            if (window.navigateTo) window.navigateTo(window.location.pathname + window.location.search);
        } catch (err) { alert('Error: ' + (err?.message || err)); }
    }

    async _handleRemoveParty(index) {
        if (!confirm('Treure aquest soci del pacte?')) return;
        const next = JSON.parse(JSON.stringify(this.pact));
        next.content.parties.splice(index, 1);
        // Filtrar firmas del party removido
        const removedId = this.pact.content.parties[index]?.identityId;
        if (removedId) next.content.signatures = next.content.signatures.filter(s => s.identityId !== removedId);
        next.content.updatedAt = Date.now();
        try {
            await KB.upsert(next);
            if (window.navigateTo) window.navigateTo(window.location.pathname + window.location.search);
        } catch (err) { alert('Error: ' + (err?.message || err)); }
    }

    async _handleSign(identityId) {
        // PACT-001 sprint C · firma ECDSA P-256 real amb la clau del navegador
        // (la mateixa que usa projectIO per snapshots firmats). Una sola clau
        // per dispositiu · si vols firmar com una altra party, has de fer-ho
        // des del seu navegador.
        try {
            const keypair = await getOrCreateSigningKey();
            const { signature, hashSnapshot, publicJwk } = await signPactWithKey({ pact: this.pact, keypair });
            const next = addSignature(this.pact, {
                identityId, signature, hashSnapshot, publicJwk,
                algorithm: 'ecdsa-p256-sha256',
            });
            // Verify just-in-case (sanity)
            const justAdded = next.content.signatures.find(s => s.identityId === identityId);
            const ok = await verifyPactSignature({ pact: next, signatureEntry: justAdded });
            if (!ok) {
                alert('⚠ Signatura inconsistent · no s\'aplicarà.');
                return;
            }
            await KB.upsert(next);
            if (window.navigateTo) window.navigateTo(window.location.pathname + window.location.search);
        } catch (err) {
            console.error('[PACT-001 C] sign falló:', err);
            alert('Error signant: ' + (err?.message || err));
        }
    }

    async _handleCopyMarkdown() {
        if (!this.pact) return;
        const md = renderPactMarkdown(this.pact);
        try {
            await navigator.clipboard.writeText(md);
            alert('✓ Markdown copiat al clipboard.');
        } catch (e) {
            alert('Error copiant: ' + (e?.message || e));
        }
    }

    // ─── PACT-AI sprint A · enriquir des del projecte + IA ────────────────
    async _gatherEnrichContext() {
        // Carrega totes les fonts en paral·lel · defensive
        const [roles, attestations, members, ledger, tokenomics, invoices, marketItems] = await Promise.all([
            KB.query({ type: 'role',             projectId: this.projectId }).catch(() => []),
            KB.query({ type: 'attestation'                                 }).catch(() => []),
            KB.query({ type: 'matriu_member'                               }).catch(() => []),
            KB.query({ type: 'ledger_entry',     projectId: this.projectId }).catch(() => []),
            KB.query({ type: 'token_design',     projectId: this.projectId }).catch(() => []),
            KB.query({ type: 'invoice',          projectId: this.projectId }).catch(() => []),
            KB.query({ type: 'market_item',      projectId: this.projectId }).catch(() => []),
        ]);
        return { roles: roles || [], attestations: attestations || [], members: members || [], ledger: ledger || [], tokenomics: tokenomics || [], invoices: invoices || [], marketItems: marketItems || [] };
    }

    async _handleEnrich() {
        if (!this.pact || !this.project) return;
        const fb = attachAIFormFeedback(document.getElementById('pbAiFeedback'), { autoFadeOk: 4000 });
        try {
            fb.addEvent({ kind: 'message', icon: '🔮', title: 'Llegint context del projecte…', detail: 'roles · ledger · tokenomics · invoices · attestations', level: 'info' });
            const ctx = await this._gatherEnrichContext();
            const draft = buildEnrichedPactDraft({
                project:           this.project,
                canvas:            this.project.content?.canvas,
                tokenomicsDesigns: ctx.tokenomics,
                ledgerEntries:     ctx.ledger,
                roles:             ctx.roles,
                attestations:      ctx.attestations,
                members:           ctx.members,
                invoices:          ctx.invoices,
                marketItems:       ctx.marketItems,
            });
            // Apply enriched clauses + parties al pact actual (no sobreescriu signatures)
            const next = {
                ...this.pact,
                content: {
                    ...this.pact.content,
                    clauses: draft.clauses,
                    // Sols afegim parties noves · no esborrem les que ja hi són
                    parties: this._mergeParties(this.pact.content.parties || [], draft.parties),
                },
                updatedAt: Date.now(),
            };
            this.pact = next;
            await KB.upsert(next);
            fb.setOk('Enriquit · ' + draft.parties.length + ' parties · capital €' + draft.context.capitalSnapshot.equityRaised + ' · vesting ' + draft.clauses.vesting.cliffMonths + 'm+' + draft.clauses.vesting.months + 'm');
            setTimeout(() => window.location.reload(), 1200);
        } catch (e) {
            fb.setError(e?.message || label('state.error'));
        }
    }

    _mergeParties(existing, fromEnrich) {
        const out = (existing || []).slice();
        const existingIds = new Set(out.map(p => p.identityId));
        for (const p of fromEnrich || []) {
            if (!existingIds.has(p.identityId)) out.push(p);
        }
        return out;
    }

    async _handleAiGenerate() {
        if (!this.pact || !this.project) return;
        const fb = attachAIFormFeedback(document.getElementById('pbAiFeedback'), { autoFadeOk: 0 });
        try {
            const ctx = await this._gatherEnrichContext();
            const draft = buildEnrichedPactDraft({
                project:           this.project,
                canvas:            this.project.content?.canvas,
                tokenomicsDesigns: ctx.tokenomics,
                ledgerEntries:     ctx.ledger,
                roles:             ctx.roles,
                attestations:      ctx.attestations,
                members:           ctx.members,
                invoices:          ctx.invoices,
                marketItems:       ctx.marketItems,
            });
            fb.setThinking({ kind: 'runner-start', sopTitle: 'Pacte · ' + (this.project.nombre || this.project.id), iteration: 1 });
            const { runPrompt } = await import('../core/aiRouterService.js');
            const prompt = buildAiPromptForPactClauses(draft);
            const result = await runPrompt({ prompt, taskKind: 'creative-narrative', maxAttempts: 3 });
            const raw = (result && (result.output || result.text || result.result)) || '';
            const applied = applyAIDraftToPact(draft, raw);
            if (!applied.applied) {
                fb.setWarning('IA · ' + (applied.error || 'output no parsejable') + ' · pots refrescar i tornar a provar');
                return;
            }
            // Aplica object + ai notes al pact actual
            const next = {
                ...this.pact,
                content: {
                    ...this.pact.content,
                    clauses: applied.enrichedDraft.clauses,
                    aiNotes: applied.enrichedDraft.aiNotes,
                },
                updatedAt: Date.now(),
            };
            this.pact = next;
            await KB.upsert(next);
            fb.setOk(label('state.done') + ' · clàusules refinades amb IA · revisa abans de signar');
            setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
            console.warn('[pact] AI generate failed', e);
            fb.setError(e?.message || label('err.ai_failed'));
        }
    }

    // v124 · _renderWalletPanel · bridge Pact → Wallet · resum saldo + capital
    // líquid (de capital.totalEur si hasInitialCash) + topup count + link a /wallet
    async _renderWalletPanel() {
        const body = document.getElementById('pbWalletBody');
        if (!body) return;
        try {
            const { getOrCreateWalletForProject, walletStats } = await import('../core/walletService.js');
            const wallet = await getOrCreateWalletForProject(this.projectId);
            const stats = walletStats(wallet);
            const balance = (wallet.content?.balanceEur ?? 0).toFixed(2);
            const cls = this.pact?.content?.clauses?.capital || {};
            const capitalNote = cls.hasInitialCash
                ? `Capital líquid declarat al pacte · <strong>${cls.totalEur || 0}€</strong>`
                : (cls.totalEur ? `Capital intangible declarat · ${cls.totalEur}€ (no líquid)` : 'Capital no definit al pacte');
            body.innerHTML = `
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:10px;">
                    <div style="background:var(--bg-elevated);border-left:3px solid #22c55e;border-radius:6px;padding:8px 10px;">
                        <div style="color:var(--text-muted);font-size:0.7rem;font-family:var(--font-mono);text-transform:uppercase;">Saldo</div>
                        <div style="color:#22c55e;font-size:1.2rem;font-weight:700;font-family:var(--font-mono);">${balance}€</div>
                    </div>
                    <div style="background:var(--bg-elevated);border-left:3px solid #6366f1;border-radius:6px;padding:8px 10px;">
                        <div style="color:var(--text-muted);font-size:0.7rem;font-family:var(--font-mono);text-transform:uppercase;">Recàrregues</div>
                        <div style="color:var(--text-main);font-size:1.2rem;font-weight:700;font-family:var(--font-mono);">${stats.topupCount || 0}</div>
                    </div>
                    <div style="background:var(--bg-elevated);border-left:3px solid #fca5a5;border-radius:6px;padding:8px 10px;">
                        <div style="color:var(--text-muted);font-size:0.7rem;font-family:var(--font-mono);text-transform:uppercase;">Consumit</div>
                        <div style="color:var(--text-main);font-size:1.2rem;font-weight:700;font-family:var(--font-mono);">${(stats.totalConsumed || 0).toFixed(2)}€</div>
                    </div>
                </div>
                <p style="margin:6px 0;">${capitalNote}</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <a href="/wallet?project=${encodeURIComponent(this.projectId)}" data-link class="pb-btn-secondary">💼 Obrir wallet</a>
                    <a href="/value-accounting?project=${encodeURIComponent(this.projectId)}" data-link class="pb-btn-secondary">🥧 Veure tarta</a>
                </div>`;
        } catch (e) {
            body.innerHTML = `<p style="color:var(--accent-red);">Wallet · ${escapeHtml(e?.message || String(e))}</p>`;
        }
    }

    // v124 · _renderNotaryPanel · publishToPermaweb del pact + estat actual
    async _renderNotaryPanel() {
        const body = document.getElementById('pbNotaryBody');
        if (!body) return;
        const arweaveTxId = this.pact?.content?.arweaveTxId || null;
        const publishedAt = this.pact?.content?.publishedAt || null;
        const summary = this.pact ? pactSummary(this.pact) : null;
        if (arweaveTxId) {
            body.innerHTML = `
                <p style="margin:0 0 8px 0;color:#22c55e;">✓ Pacte notaritzat al permaweb</p>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;font-size:0.78rem;">
                    <div><strong>TxId</strong> · <code style="color:var(--accent-indigo);">${escapeHtml(arweaveTxId)}</code></div>
                    ${publishedAt ? `<div><strong>Data</strong> · ${escapeHtml(new Date(publishedAt).toLocaleString('es-ES'))}</div>` : ''}
                </div>
                <p style="margin-top:8px;font-size:0.78rem;">Aquest registre és permanent · qualsevol persona pot verificar la integritat amb la signatura ECDSA i el txId.</p>`;
            return;
        }
        const canNotarize = summary?.signedAll === true;
        body.innerHTML = `
            <p style="margin:0 0 10px 0;">La notarització al permaweb registra una còpia signada del pacte de manera permanent. Útil per a evidència legal · transparència amb stakeholders · verificació pública.</p>
            <p style="margin:0 0 10px 0;font-size:0.78rem;color:var(--text-muted);">Cost estimat · ~0.50€ (descomptat del wallet del projecte) · refund automàtic si l'upload falla.</p>
            ${canNotarize ? `
                <button class="pb-btn" id="pbNotarizeBtn" style="background:#06b6d4;color:#fff;border-color:#06b6d4;">🌐 Notaritzar al permaweb</button>
            ` : `
                <p style="color:var(--accent-orange);font-size:0.82rem;">⚠ Cal que totes les parts hagin signat el pacte abans de notaritzar (actualment ${summary?.signaturesCount || 0}/${summary?.partiesCount || 0}).</p>
            `}`;
        if (canNotarize) {
            document.getElementById('pbNotarizeBtn')?.addEventListener('click', () => this._handleNotarize());
        }
    }

    // v124 · _handleNotarize · publishToPermaweb + persist arweaveTxId
    async _handleNotarize() {
        const btn = document.getElementById('pbNotarizeBtn');
        if (btn) { btn.textContent = '⏳ Notaritzant…'; btn.disabled = true; }
        try {
            const { publishToPermaweb } = await import('../core/publicRegistryService.js');
            const res = await publishToPermaweb({
                entry: this.pact,
                projectId: this.projectId,
            });
            if (res?.arweaveTxId) {
                this.pact.content.arweaveTxId  = res.arweaveTxId;
                this.pact.content.publishedAt  = res.publishedAt || new Date().toISOString();
                await KB.upsert(this.pact);
                alert('✓ Pacte notaritzat\n\nTxId · ' + res.arweaveTxId);
                await this._renderNotaryPanel();
                return;
            }
            throw new Error('publish returned no txId');
        } catch (e) {
            const msg = e?.message || String(e);
            alert('✘ Notarització fallida\n\n' + msg);
            if (btn) { btn.textContent = '🌐 Notaritzar al permaweb'; btn.disabled = false; }
        }
    }

    destroy() { /* nothing */ }
}
