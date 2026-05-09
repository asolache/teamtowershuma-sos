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
} from '../core/pactService.js';
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
        const projects = (store.getState().projects || []);
        this.project = projects.find(p => p.id === this.projectId);
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
            <p style="color:#888;font-size:0.9rem;">Aquesta vista necessita <code>?project={id}</code>.</p>
            <a href="/dashboard" data-link style="color:#c084fc;">← Dashboard</a>
        </div></div>`;
    }

    _htmlError(msg) {
        return `${this._renderStyle()}
        <div class="pb-shell"><div class="pb-empty">
            <div style="font-size:2.4rem;color:#fca5a5;">✘</div>
            <h2 class="mat-hero-h1">${escapeHtml(msg)}</h2>
            <a href="/dashboard" data-link style="color:#c084fc;">← Dashboard</a>
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
                ${renderNavGroupedHtml({ active: '', projectId: p.id, className: 'pb-link' })}
            </div>

            <div class="pb-main">
                <div class="pb-hero">
                    <h1 class="mat-hero-h1">📜 Pacte <strong>de socis</strong> · ${escapeHtml(p.nombre || p.name || p.id)}</h1>
                    <p class="pb-hero-sub">Primer contracte del Mètode SOS · acord viu, no de notari · cada hora, cada euro, cada idea queda registrat i reparteix tarta automàticament.</p>
                    ${exists ? this._renderStatusRow(summary) : this._renderInitForm(projectTypeId)}
                </div>

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
            <p style="color:#aaa;line-height:1.6;margin-bottom:14px;">Encara no hi ha pacte. Crea el draft amb el teu nom com a primer soci · després pots afegir-ne més des de l'editor.</p>
            <div class="pb-init-form">
                <input type="text" id="pbInitName" class="pb-input" placeholder="El teu nom (displayName) ex. Alvaro Solache">
                <input type="text" id="pbInitId" class="pb-input" placeholder="DID o handle (identityId) ex. did:sos:abc">
                <input type="text" id="pbInitRole" class="pb-input" placeholder="Rol al projecte ex. Fundador / CEO">
                <button class="pb-btn" id="pbInitCreate">+ Crear draft del pacte</button>
            </div>
            ${projectTypeId ? `<p style="color:#666;font-size:0.78rem;margin-top:10px;font-family:monospace;">tipus · ${escapeHtml(projectTypeId)}</p>` : ''}
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
                            <td style="font-family:monospace;font-size:0.78rem;color:#888;">${escapeHtml(pt.identityId)}</td>
                            <td>${escapeHtml(pt.role)}</td>
                            <td>${escapeHtml(pt.contributionType)}</td>
                            <td style="text-align:right;font-family:'Instrument Serif',Georgia,serif;font-style:italic;color:#c084fc;font-size:1.1rem;">${(pt.initialShare * 100).toFixed(1)}%</td>
                            <td style="text-align:center;font-family:monospace;color:#fbbf24;">${pt.multiplier ? '×' + pt.multiplier : '—'}</td>
                            <td>${signed ? '<span style="color:#4ade80;font-family:monospace;">✓ ' + new Date(signed.signedAt).toLocaleDateString('ca-ES') + '</span>' : '<button class="pb-btn-sign" data-sign="' + escapeHtml(pt.identityId) + '">Signar</button>'}</td>
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
        `;
    }

    _renderStyle() {
        return `<style>
            .pb-shell { background: #050507; color: #e6e6e6; min-height: 100%; font-family: var(--font-base, sans-serif); display: flex; flex-direction: column; }
            .pb-topbar { display: flex; align-items: center; gap: 1rem; padding: 14px 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; flex-shrink: 0; }
            .pb-logo { font-family: monospace; color: #888; text-decoration: none; font-size: 0.78rem; }
            .pb-logo span { color: #6366f1; font-weight: 700; }
            .pb-title { color: #aaa; font-size: 0.86rem; display: inline-flex; align-items: center; gap: 6px; }
            .pb-spacer { flex: 1; }
            .pb-link { color: #888; text-decoration: none; font-size: 0.85rem; padding: 6px 12px; border-radius: 6px; }
            .pb-link:hover { background: rgba(255,255,255,0.06); color: #fff; }

            .pb-main { flex: 1; padding: clamp(20px, 4vw, 36px); max-width: 1100px; margin: 0 auto; width: 100%; box-sizing: border-box; overflow-y: auto; }
            .pb-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center; gap: 0.6rem; padding: 2rem; }

            .pb-hero { margin-bottom: 24px; padding: 24px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
            .pb-hero h1 { font-size: clamp(1.6rem, 3vw, 2.2rem); color: #fff; line-height: 1.05; margin-bottom: 6px; }
            .pb-hero-sub { color: #aaa; font-size: 0.92rem; max-width: 720px; line-height: 1.55; margin-bottom: 18px; }

            .pb-stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
            .pb-stat { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-left: 3px solid var(--pb-c, #888); border-radius: 8px; padding: 12px 14px; }
            .pb-stat-label { font-family: monospace; font-size: 0.7rem; color: #888; letter-spacing: 0.06em; text-transform: uppercase; }
            .pb-stat-value { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 1.6rem; color: #fff; line-height: 1; margin-top: 4px; }
            .pb-stat-sub { font-size: 0.7rem; color: var(--pb-c); margin-top: 3px; font-family: monospace; }

            .pb-init { background: rgba(192,132,252,0.04); border: 1px dashed rgba(192,132,252,0.3); border-radius: 8px; padding: 18px; }
            .pb-init-form { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 8px; align-items: end; }

            .pb-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
            @media (max-width: 880px) { .pb-grid, .pb-init-form { grid-template-columns: 1fr; } }

            .pb-section { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 18px; margin-bottom: 18px; }
            .pb-section h2 { color: #fff; font-size: 1rem; margin-bottom: 12px; font-weight: 600; }

            .pb-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; align-items: end; }
            .pb-row-stack { grid-template-columns: 1fr; }
            .pb-row label { display: flex; flex-direction: column; gap: 4px; font-size: 0.75rem; color: #888; font-family: monospace; letter-spacing: 0.04em; text-transform: uppercase; }
            .pb-checkbox { flex-direction: row !important; align-items: center !important; gap: 8px !important; text-transform: none !important; padding: 8px 12px; background: rgba(0,0,0,0.3); border-radius: 6px; cursor: pointer; }

            .pb-input { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.12); color: #fff; padding: 10px 12px; border-radius: 6px; font-size: 0.88rem; outline: none; transition: border-color 0.15s; font-family: inherit; }
            .pb-input:focus { border-color: #c084fc; }
            .pb-textarea { resize: vertical; min-height: 60px; font-family: inherit; line-height: 1.55; }
            .pb-hint { color: #666; font-size: 0.75rem; margin-top: 6px; font-family: monospace; }

            .pb-table { width: 100%; border-collapse: collapse; font-size: 0.86rem; }
            .pb-table thead th { padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.12); text-align: left; font-family: monospace; font-size: 0.7rem; color: #888; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; }
            .pb-table tbody td { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #ddd; vertical-align: middle; }

            .pb-add-party { margin-top: 16px; }
            .pb-add-party summary { color: #c084fc; cursor: pointer; padding: 8px 12px; background: rgba(192,132,252,0.06); border-radius: 6px; font-size: 0.85rem; }

            .pb-actions { display: flex; gap: 12px; margin: 24px 0; flex-wrap: wrap; align-items: center; }
            .pb-btn { background: linear-gradient(135deg, #c084fc, #6366f1); color: #fff; border: 0; padding: 10px 18px; border-radius: 6px; font-weight: 700; cursor: pointer; transition: transform 0.15s; font-size: 0.85rem; }
            .pb-btn:hover { transform: translateY(-1px); }
            .pb-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
            .pb-btn-large { padding: 14px 28px; font-size: 0.95rem; }
            .pb-btn-secondary { background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #c084fc; padding: 9px 16px; border-radius: 6px; cursor: pointer; font-size: 0.82rem; }
            .pb-btn-secondary:hover { border-color: #c084fc; }
            .pb-btn-sign { background: rgba(34,197,94,0.12); border: 1px solid #4ade80; color: #4ade80; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.78rem; }
            .pb-btn-sign:hover { background: rgba(34,197,94,0.2); }
            .pb-btn-remove { background: transparent; border: 0; color: #fca5a5; cursor: pointer; font-size: 1rem; opacity: 0.6; }
            .pb-btn-remove:hover { opacity: 1; }

            .pb-markdown { background: #0a0a10; padding: 16px; border-radius: 6px; color: #ddd; font-family: ui-monospace, monospace; font-size: 0.78rem; line-height: 1.6; max-height: 400px; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word; border: 1px solid rgba(255,255,255,0.06); }
        </style>`;
    }

    async afterRender() {
        ensureExplainerStyle();
        bindExplainerBadges(document);
        if (!this.pact) {
            // init form
            document.getElementById('pbInitCreate')?.addEventListener('click', () => this._handleCreate());
            return;
        }
        document.getElementById('pbSaveAll')?.addEventListener('click', () => this._handleSave());
        document.getElementById('pbReset')?.addEventListener('click', () => this._handleReset());
        document.getElementById('pbAddPartyBtn')?.addEventListener('click', () => this._handleAddParty());
        document.querySelectorAll('[data-sign]').forEach(btn => btn.addEventListener('click', (e) => this._handleSign(e.target.dataset.sign)));
        document.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', (e) => this._handleRemoveParty(parseInt(e.target.dataset.remove, 10))));
        document.getElementById('pbCopyMarkdown')?.addEventListener('click', () => this._handleCopyMarkdown());
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
        // PACT-001 sprint B · firma simbólica · sprint C entregará firma ECDSA real
        const sig = 'sym-sign-' + identityId.slice(0, 12) + '-' + Date.now().toString(36);
        const hashSnapshot = 'sha256-snapshot-pending-' + (this.pact.content.updatedAt || Date.now()).toString(36);
        try {
            const next = addSignature(this.pact, { identityId, signature: sig, hashSnapshot });
            await KB.upsert(next);
            if (window.navigateTo) window.navigateTo(window.location.pathname + window.location.search);
        } catch (err) { alert('Error signant: ' + (err?.message || err)); }
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

    destroy() { /* nothing */ }
}
