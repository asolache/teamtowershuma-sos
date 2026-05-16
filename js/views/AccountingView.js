// =============================================================================
// TEAMTOWERS SOS V11 — ACCOUNTING VIEW (LEDGER-ACCOUNTING sprint A)
// Ruta · /js/views/AccountingView.js  →  /accounting?project={id}
//
// CRUD ledger entries + Balance Sheet + P&L per a un projecte. Reusa
// ledgerService (pure). Mínim viable per a fundadors · sense FX automàtic ·
// sense periodicitat avançada (sols filtre per mes des de la UI).
// =============================================================================

import { KB } from '../core/kb.js';
import { findProjectByIdAny } from '../core/projectLookup.js';
import {
    LEDGER_ENTRY_TYPE, STANDARD_ACCOUNTS,
    accountKindFor,
    buildEmptyLedgerEntry,
    validateLedgerEntry,
    computeBalanceByAccount,
    computePLForPeriod,
    computeBalanceSheet,
    computeLedgerAuditScore, computeEntryAuditState, AUDIT_LEVEL_META, AUDIT_THRESHOLD_EUR,
    addProofToEntry, PROOF_KINDS, signLedgerEntry,
    quickEntry,
} from '../core/ledgerService.js';
import {
    buildLedgerEntryAttestation, buildCertificateHtml,
    buildCoSignRequest,
} from '../core/certificateReportService.js';

export default class AccountingView {

    constructor() {
        document.title = 'Comptabilitat · SOS V11';
        try {
            const u = new URL(window.location.href);
            this.projectId = u.searchParams.get('project') || null;
            this.periodFrom = u.searchParams.get('from') || null;
            this.periodTo   = u.searchParams.get('to')   || null;
        } catch (_) {
            this.projectId = null;
            this.periodFrom = null;
            this.periodTo = null;
        }
        this.project = null;
        this.entries = [];
    }

    async getHtml() {
        if (!this.projectId) return this._htmlNoProject();
        try { this.project = await findProjectByIdAny(this.projectId); } catch (_) { this.project = null; }
        if (!this.project) return this._htmlNotFound();
        try {
            this.entries = await KB.query({ type: LEDGER_ENTRY_TYPE, projectId: this.projectId }) || [];
        } catch (_) { this.entries = []; }
        return this._htmlMain();
    }

    async afterRender() {
        if (!this.project) return;
        this._bindForm();
        this._bindPeriodFilter();
        this._bindAuditActions();
    }

    // CERT-001 pas 2+3+4 · sign entries + add proofs + export certificate
    _bindAuditActions() {
        document.querySelectorAll('[data-sign]').forEach(btn => btn.addEventListener('click', () => this._handleSign(btn.dataset.sign)));
        document.querySelectorAll('[data-add-proof]').forEach(btn => btn.addEventListener('click', () => this._handleAddProof(btn.dataset.addProof)));
        document.querySelectorAll('[data-cosign]').forEach(btn => btn.addEventListener('click', () => this._handleCoSign(btn.dataset.cosign)));
        document.getElementById('acExportCert')?.addEventListener('click', () => this._handleExportCert());
    }

    // CERT-001 pas 5 · counter-party request
    async _handleCoSign(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry) return;
        const handle = window.prompt('Handle del soci a qui demanes la co-firma (p.ex. @bob):', '@');
        if (!handle || handle === '@' || !handle.trim()) return;
        try {
            const requesterDid    = 'did:sos:' + this.projectId;
            const requesterHandle = this.project.creatorHandle || null;
            const coReq = buildCoSignRequest({
                entry, requesterDid, requesterHandle,
                coSignerHandle: handle.trim(),
            });
            await KB.upsert(coReq);
            // Add proof attestation-id (encara pending) per visibilitat
            const updated = addProofToEntry(entry, {
                kind:     'attestation-id',
                value:    coReq.id,
                signedBy: requesterDid,
            });
            await KB.upsert(updated);
            alert('🤝 Co-firma sol·licitada a ' + handle + '. Quan signi des de la seva sessió · l\'attestation passarà a status "signed".');
            window.location.reload();
        } catch (e) {
            alert('Error sol·licitant co-firma · ' + (e?.message || 'desconegut'));
        }
    }

    _handleExportCert() {
        if (!this.project) return;
        try {
            const html = buildCertificateHtml({
                project: this.project, entries: this.entries,
                certifierName: this.project.creatorHandle || null,
                certifierDid:  'did:sos:' + this.project.id,
            });
            const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const w = window.open(url, '_blank');
            if (!w) {
                alert('Cal permetre popups · obre l\'URL manualment:\n' + url);
            }
        } catch (e) {
            alert('Error generant certificat · ' + (e?.message || 'desconegut'));
        }
    }

    async _handleSign(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry) return;
        try {
            const { getOrCreateSigningKey } = await import('../core/projectIO.js');
            const key = await getOrCreateSigningKey(this.projectId);
            if (!key || !key.privateJwk) {
                alert('No s\'ha pogut obtenir la signing key del projecte');
                return;
            }
            const signerDid = 'did:sos:' + (this.projectId);
            let signed = await signLedgerEntry({ entry, privateJwk: key.privateJwk, signerDid });
            // CERT-001 pas 3 · auto-generar attestation + linkar com a proof
            const attestation = buildLedgerEntryAttestation({
                entry: signed,
                attesterDid:    signerDid,
                attesterHandle: this.project.creatorHandle || null,
            });
            await KB.upsert(attestation);
            // Add proof a l'entry · attestation-id
            signed = addProofToEntry(signed, {
                kind:     'attestation-id',
                value:    attestation.id,
                signedBy: signerDid,
            });
            await KB.upsert(signed);
            window.location.reload();
        } catch (e) {
            alert('Error signant · ' + (e?.message || 'desconegut'));
        }
    }

    async _handleAddProof(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry) return;
        const kind = window.prompt('Tipus de proof:\n\n' + PROOF_KINDS.join(' · ') + '\n\nEscriu el tipus:', 'arweave-txid');
        if (!kind || !PROOF_KINDS.includes(kind)) return;
        const value = window.prompt('Valor del proof (txId · attestation id · invoice id · url):', '');
        if (!value) return;
        try {
            const updated = addProofToEntry(entry, { kind, value, signedBy: 'did:sos:' + this.projectId });
            await KB.upsert(updated);
            window.location.reload();
        } catch (e) {
            alert('Error afegint proof · ' + (e?.message || 'desconegut'));
        }
    }

    _htmlNoProject() {
        return `
        <div style="min-height:100dvh;background:var(--bg-dark);color:var(--text-main);font-family:var(--font-base);padding:2rem;">
            <div style="max-width:600px;margin:4rem auto;text-align:center;background:var(--bg-panel);padding:2rem;border-radius:8px;border:1px solid var(--border-default);">
                <h1>📊 Comptabilitat · SOS</h1>
                <p>Cal indicar quin projecte vols editar · <code>?project=&lt;projectId&gt;</code>.</p>
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
        const projName = this.project.nombre || this.project.name || this.project.id;
        const pl = computePLForPeriod(this.entries, { from: this.periodFrom, to: this.periodTo });
        const bs = computeBalanceSheet(this.entries);
        const balances = computeBalanceByAccount(this.entries);
        // CERT-001 · audit score for entire ledger
        const audit = computeLedgerAuditScore(this.entries);
        const auditMeta = AUDIT_LEVEL_META[audit.level] || AUDIT_LEVEL_META.draft;

        // Entries table · ara amb audit state per row (CERT-001 · pas 2 UI)
        const sorted = this.entries.slice().sort((a, b) => (b.content?.date || '').localeCompare(a.content?.date || ''));
        const rows = sorted.length === 0
            ? '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:20px;">Cap entry encara · usa el formulari de sota per a afegir-ne</td></tr>'
            : sorted.map(e => {
                const c = e.content || {};
                const validation = validateLedgerEntry(e);
                const auditState = computeEntryAuditState(e);
                const debitTotal = (c.legs || []).filter(l => l.side === 'debit').reduce((s, l) => s + l.amount, 0);
                const legsDesc = (c.legs || []).map(l => `<code style="font-size:10px;">${this._esc(l.account)}·${l.side[0]}${l.amount.toFixed(2)}</code>`).join(' ');
                // Audit badge per entry
                const lvl = auditState.level;
                const lvlColor = lvl === 'audited' ? '#facc15' : (lvl === 'signed' ? '#22c55e' : '#94a3b8');
                const lvlIcon  = lvl === 'audited' ? '🛡' : (lvl === 'signed' ? '🔐' : '·');
                const lvlBadge = `<span title="${this._esc(lvl)} · ${auditState.proofsCount} proofs${auditState.needsProofs ? ' (necessita ≥2)' : ''}" style="display:inline-flex;align-items:center;gap:3px;padding:1px 6px;border-radius:999px;background:${lvlColor}25;color:${lvlColor};font-size:10px;font-weight:700;font-family:var(--font-mono);">${lvlIcon} ${this._esc(lvl)}</span>`;
                const actionBtns = auditState.signed
                    ? `<button class="ac-btn-mini" data-add-proof="${this._esc(e.id)}" title="Afegir proof">📎</button>
                       <button class="ac-btn-mini" data-cosign="${this._esc(e.id)}" title="Sol·licitar co-signatura d'un altre soci">🤝</button>`
                    : `<button class="ac-btn-mini ac-btn-mini-primary" data-sign="${this._esc(e.id)}" title="Signar entry amb la teva ECDSA key">🔐 Signar</button>`;
                return `
                    <tr>
                        <td style="font-family:var(--font-mono);font-size:11px;">${this._esc(c.date || '')}</td>
                        <td>${this._esc(c.description || '')}</td>
                        <td>${legsDesc}</td>
                        <td style="text-align:right;font-family:var(--font-mono);">${debitTotal.toFixed(2)} ${this._esc(c.currency || 'EUR')}</td>
                        <td>${validation.ok ? '<span style="color:#22c55e;">✓</span>' : '<span style="color:#ef4444;" title="' + this._esc(validation.errors.join(' · ')) + '">⚠</span>'}</td>
                        <td>${lvlBadge}</td>
                        <td style="text-align:right;white-space:nowrap;">${actionBtns}</td>
                    </tr>
                `;
            }).join('');

        // Balance sheet rows
        const bsRow = (b) => `<tr><td style="padding-left:16px;font-family:var(--font-mono);font-size:11px;">${this._esc(b.label || b.account)}</td><td style="text-align:right;font-family:var(--font-mono);">${b.balance.toFixed(2)}</td></tr>`;
        const bsHtml = `
            <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
                <tr><th colspan="2" style="text-align:left;padding:6px 0;border-bottom:1px solid var(--border-default);">Actius</th></tr>
                ${bs.assets.length ? bs.assets.map(bsRow).join('') : '<tr><td style="color:var(--text-muted);padding-left:16px;font-size:11px;">·</td><td></td></tr>'}
                <tr><td style="padding:4px 0;font-weight:700;border-top:1px solid var(--border-default);">Total actius</td><td style="text-align:right;font-family:var(--font-mono);font-weight:700;border-top:1px solid var(--border-default);">${bs.totalAssets.toFixed(2)}</td></tr>
                <tr><th colspan="2" style="text-align:left;padding:14px 0 6px 0;border-bottom:1px solid var(--border-default);">Passius</th></tr>
                ${bs.liabilities.length ? bs.liabilities.map(bsRow).join('') : '<tr><td style="color:var(--text-muted);padding-left:16px;font-size:11px;">·</td><td></td></tr>'}
                <tr><th colspan="2" style="text-align:left;padding:14px 0 6px 0;border-bottom:1px solid var(--border-default);">Capital</th></tr>
                ${bs.equity.length ? bs.equity.map(bsRow).join('') : ''}
                <tr><td style="padding-left:16px;font-size:11px;color:var(--text-muted);">Beneficis acumulats</td><td style="text-align:right;font-family:var(--font-mono);">${bs.retainedEarnings.toFixed(2)}</td></tr>
                <tr><td style="padding:4px 0;font-weight:700;border-top:1px solid var(--border-default);">Total P+C</td><td style="text-align:right;font-family:var(--font-mono);font-weight:700;border-top:1px solid var(--border-default);">${bs.totalLiabilitiesAndEquity.toFixed(2)}</td></tr>
            </table>
            <div style="margin-top:6px;font-size:11px;font-family:var(--font-mono);color:${bs.balanced ? '#22c55e' : '#ef4444'};">${bs.balanced ? '✓ quadrat (A = L + C)' : '✗ no quadrat · diff ' + (bs.totalAssets - bs.totalLiabilitiesAndEquity).toFixed(2)}</div>
        `;

        // P&L card
        const plHtml = `
            <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
                <tr><td>Ingressos</td><td style="text-align:right;font-family:var(--font-mono);color:#22c55e;">${pl.revenue.toFixed(2)}</td></tr>
                <tr><td>Despeses</td><td style="text-align:right;font-family:var(--font-mono);color:#ef4444;">${pl.expenses.toFixed(2)}</td></tr>
                <tr><td style="font-weight:700;border-top:1px solid var(--border-default);padding-top:6px;">Resultat</td><td style="text-align:right;font-family:var(--font-mono);font-weight:700;border-top:1px solid var(--border-default);padding-top:6px;color:${pl.profit >= 0 ? '#22c55e' : '#ef4444'};">${pl.profit.toFixed(2)}</td></tr>
            </table>
            <div style="margin-top:8px;font-size:11px;color:var(--text-muted);">Període · ${this._esc(this.periodFrom || '∞')} → ${this._esc(this.periodTo || 'avui')} · ${this.entries.length} entries</div>
        `;

        // Accounts dropdown options
        const accOpts = STANDARD_ACCOUNTS.map(a => `<option value="${a.id}">${this._esc(a.label)} · ${a.id}</option>`).join('');

        return `
        <style>
            .ac-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); }
            .ac-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-wrap:wrap; }
            .ac-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .ac-logo span { color:var(--accent-indigo); }
            .ac-main { max-width:1200px; margin:0 auto; padding:1.5rem; }
            .ac-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem; }
            @media (max-width:880px) { .ac-grid { grid-template-columns:1fr; } }
            .ac-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem 1.2rem; }
            .ac-card h3 { margin:0 0 0.6rem 0; font-size:0.95rem; }
            table.ac-entries { width:100%; border-collapse:collapse; font-size:0.82rem; }
            table.ac-entries th, table.ac-entries td { padding:6px 8px; text-align:left; border-bottom:1px solid var(--border-default); }
            table.ac-entries th { background:#0008; font-size:11px; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-muted); }
            .ac-form { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:8px; margin-top:8px; }
            .ac-form input, .ac-form select { background:#000; color:var(--text-main); border:1px solid var(--border-default); border-radius:4px; padding:6px 8px; font-family:var(--font-base); font-size:0.82rem; }
            .ac-btn { padding:8px 14px; border-radius:4px; border:1px solid #22c55e; background:#22c55e; color:#fff; font-size:0.82rem; font-weight:600; cursor:pointer; grid-column:1 / -1; }
            .ac-btn:hover { opacity:0.9; }
            .ac-period { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:8px; font-size:0.82rem; }
            .ac-period input { background:#000; color:var(--text-main); border:1px solid var(--border-default); border-radius:4px; padding:4px 6px; }
            .ac-btn-mini { padding:2px 8px; border-radius:3px; border:1px solid var(--border-default); background:var(--bg-dark); color:var(--text-main); font-size:10px; cursor:pointer; }
            .ac-btn-mini:hover { background:var(--glass-hover); }
            .ac-btn-mini-primary { background:#22c55e25; color:#22c55e; border-color:#22c55e50; }
            .mk-stat-chip { padding:3px 8px; border-radius:999px; font-size:11px; font-family:var(--font-mono); }
            .ac-msg { font-size:11px; font-family:var(--font-mono); margin-top:6px; }
            .ac-msg.ok { color:#22c55e; }
            .ac-msg.err { color:#ef4444; }
        </style>
        <div class="ac-shell">
            <div class="ac-topbar">
                <a href="/dashboard" data-link class="ac-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Comptabilitat</span>
                <span style="flex:1;"></span>
                <a href="/project/${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">← Hub</a>
                <a href="/canvas?project=${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">🎨 Canvas</a>
                <a href="/kanban?project=${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">📊 Kanban</a>
            </div>
            <div class="ac-main">
                <h1 style="margin:0 0 1rem 0;font-size:1.35rem;">📊 ${this._esc(projName)} · Comptabilitat</h1>

                <!-- CERT-001 pas 2 · audit certificate card · principal i visible -->
                <div class="ac-card" style="margin-bottom:1rem;border-left:4px solid ${auditMeta.color};background:linear-gradient(135deg,${auditMeta.color}10,transparent);">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
                        <div style="flex:1;min-width:240px;">
                            <h3 style="margin:0;color:${auditMeta.color};">${auditMeta.icon} Certificat de qualitat · ${this._esc(auditMeta.label)}</h3>
                            <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:4px;">${this._esc(auditMeta.description)}</div>
                            <div style="margin-top:6px;height:6px;background:#0008;border-radius:3px;overflow:hidden;">
                                <div style="height:100%;width:${audit.score}%;background:${auditMeta.color};transition:width 0.5s;"></div>
                            </div>
                            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
                                <span class="mk-stat-chip" style="background:#0008;border:1px solid var(--border-default);">📋 ${audit.counts.total} entries</span>
                                <span class="mk-stat-chip" style="background:#0008;color:${audit.ratios.balanced === 1 ? '#22c55e' : '#facc15'};border:1px solid var(--border-default);">⚖ ${audit.counts.balanced}/${audit.counts.total} quadrats</span>
                                <span class="mk-stat-chip" style="background:#0008;color:#22c55e;border:1px solid var(--border-default);">🔐 ${audit.counts.signed} signats</span>
                                <span class="mk-stat-chip" style="background:#0008;color:${auditMeta.color};border:1px solid var(--border-default);">🛡 ${audit.counts.audited} auditats</span>
                                ${audit.counts.needsProofs > 0 ? `<span class="mk-stat-chip" style="background:#0008;color:#facc15;border:1px solid var(--border-default);">⚠ ${audit.counts.needsProofs - audit.counts.audited}/${audit.counts.needsProofs} grans pendents proofs</span>` : ''}
                            </div>
                        </div>
                        <div style="text-align:right;font-family:var(--font-mono);">
                            <div style="font-size:2.4rem;font-weight:700;color:${auditMeta.color};">${audit.score}</div>
                            <div style="font-size:10px;color:var(--text-muted);">SCORE · /100</div>
                            <button class="ac-btn" id="acExportCert" style="margin-top:8px;font-size:11px;background:${auditMeta.color};border-color:${auditMeta.color};color:#000;">📄 Exportar certificat</button>
                        </div>
                    </div>
                    <details style="margin-top:8px;">
                        <summary style="cursor:pointer;font-size:0.78rem;color:var(--text-secondary);">Raons del score · ${audit.reasons.length}</summary>
                        <ul style="margin:6px 0 0 0;padding-left:1.2rem;font-size:0.78rem;line-height:1.6;">
                            ${audit.reasons.map(r => {
                                const c = r.kind === 'positive' ? '#22c55e' : (r.kind === 'penalty' ? '#ef4444' : '#facc15');
                                const ic = r.kind === 'positive' ? '✓' : (r.kind === 'penalty' ? '✗' : '⚠');
                                return `<li style="color:${c};">${ic} ${this._esc(r.text)}</li>`;
                            }).join('')}
                        </ul>
                        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:6px;">Threshold proofs · entries amb total ≥ €${AUDIT_THRESHOLD_EUR} cal mínim 2 proofs (arweave-txid · polygon-txhash · attestation-id · invoice-id · external-doc).</div>
                    </details>
                </div>

                <div class="ac-grid">
                    <div class="ac-card">
                        <h3>📈 P&amp;L · resultat</h3>
                        <div class="ac-period">
                            <label>Des de · <input type="date" id="acFrom" value="${this._esc(this.periodFrom || '')}"></label>
                            <label>Fins a · <input type="date" id="acTo" value="${this._esc(this.periodTo || '')}"></label>
                            <button class="ac-btn" id="acApplyPeriod" style="grid-column:auto;background:var(--accent-indigo);border-color:var(--accent-indigo);">Aplicar</button>
                        </div>
                        ${plHtml}
                    </div>
                    <div class="ac-card">
                        <h3>📋 Balance Sheet · estat patrimonial</h3>
                        ${bsHtml}
                    </div>
                </div>

                <div class="ac-card" style="margin-bottom:1rem;">
                    <h3>➕ Nou apunt · double-entry</h3>
                    <p style="font-size:0.78rem;color:var(--text-secondary);margin:0 0 0.4rem 0;">Cobrament típic · debit <code>cash</code> · credit <code>revenue</code>. Pagament típic · debit <code>expenses</code> · credit <code>cash</code>.</p>
                    <div class="ac-form">
                        <input type="date" id="acFormDate" value="${new Date().toISOString().slice(0, 10)}">
                        <input type="text" id="acFormDesc" placeholder="Descripció · ex 'venda client X'">
                        <select id="acFormDebit"><option value="">— Debit account —</option>${accOpts}</select>
                        <select id="acFormCredit"><option value="">— Credit account —</option>${accOpts}</select>
                        <input type="number" id="acFormAmount" placeholder="Import (positiu)" step="0.01" min="0">
                        <select id="acFormCurrency">
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                        </select>
                        <button class="ac-btn" id="acFormSave">💾 Afegir apunt</button>
                        <div class="ac-msg" id="acFormMsg" style="grid-column:1 / -1;"></div>
                    </div>
                </div>

                <div class="ac-card">
                    <h3>📑 Entries · ${this.entries.length}</h3>
                    <table class="ac-entries">
                        <thead><tr><th>Data</th><th>Descripció</th><th>Legs</th><th style="text-align:right;">Total</th><th>OK</th><th>Cert</th><th></th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
    }

    _bindPeriodFilter() {
        const btn = document.getElementById('acApplyPeriod');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const from = document.getElementById('acFrom')?.value || '';
            const to   = document.getElementById('acTo')?.value   || '';
            const url = new URL(window.location.href);
            if (from) url.searchParams.set('from', from); else url.searchParams.delete('from');
            if (to)   url.searchParams.set('to',   to);   else url.searchParams.delete('to');
            window.location.href = url.toString();
        });
    }

    _bindForm() {
        const saveBtn = document.getElementById('acFormSave');
        if (!saveBtn) return;
        const msg = document.getElementById('acFormMsg');
        saveBtn.addEventListener('click', async () => {
            const date     = document.getElementById('acFormDate')?.value;
            const desc     = document.getElementById('acFormDesc')?.value || '';
            const debit    = document.getElementById('acFormDebit')?.value;
            const credit   = document.getElementById('acFormCredit')?.value;
            const amount   = parseFloat(document.getElementById('acFormAmount')?.value);
            const currency = document.getElementById('acFormCurrency')?.value || 'EUR';
            if (!debit || !credit) { if (msg) { msg.textContent = '✗ falten accounts'; msg.className = 'ac-msg err'; } return; }
            if (debit === credit)  { if (msg) { msg.textContent = '✗ debit i credit han de ser diferents'; msg.className = 'ac-msg err'; } return; }
            if (!amount || amount <= 0) { if (msg) { msg.textContent = '✗ amount > 0 requerit'; msg.className = 'ac-msg err'; } return; }
            try {
                const entry = quickEntry({
                    projectId:    this.projectId,
                    date,
                    description:  desc,
                    debitAccount: debit,
                    creditAccount:credit,
                    amount,
                    currency,
                });
                await KB.upsert(entry);
                if (msg) { msg.textContent = '✓ apunt desat'; msg.className = 'ac-msg ok'; }
                // Re-render lleuger · re-fetch i re-paint
                setTimeout(() => { window.location.reload(); }, 400);
            } catch (e) {
                if (msg) { msg.textContent = '✗ ' + (e?.message || 'error'); msg.className = 'ac-msg err'; }
            }
        });
    }

    _esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
