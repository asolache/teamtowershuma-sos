// =============================================================================
// TEAMTOWERS SOS V11 — SOPS VIEW (H1.10.4)
// Ruta: /js/views/SopsView.js · /sops?project={id}
//
// Lista, edición inline y regeneración con feedback de los SOPs propios
// de un proyecto cliente (los generados por roleSopGenerator desde el
// inspector del ValueMap en H1.10.2).
//
// Persistencia: type:'sop' con projectId={cliente} y kind='project-role-sop'.
// =============================================================================

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import { renderNavLinksHtml } from '../core/navService.js';

function fmtTs(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const READINESS_COLOR = { 'ready': '#22c55e', 'solid': '#6366f1', 'tier 2': '#ff9100' };

export default class SopsView {
    constructor() {
        document.title = 'SOPs del proyecto · SOS V11';
        this.projectId = null;
        this.project   = null;
        this.sops      = [];
    }

    async getHtml() {
        await store.init();
        const params = new URLSearchParams(window.location.search);
        this.projectId = params.get('project');
        const projects = (store.getState().projects || []).filter(p => !p.isArchived);
        this.project = this.projectId ? projects.find(p => p.id === this.projectId) : null;

        return `
        <style>
            .sv-shell  { height:100dvh; background:var(--bg-0,#050507); color:#e6e6e6; font-family:var(--font-base,sans-serif); display:flex; flex-direction:column; overflow:hidden; }
            .sv-topbar { display:flex; align-items:center; gap:1rem; padding:1rem 1.5rem; border-bottom:1px solid #1a1a22; background:#08080c; flex-shrink:0; }
            .sv-logo   { font-weight:700; color:#fff; text-decoration:none; font-size:1.05rem; }
            .sv-logo span { color:#6366f1; }
            .sv-title  { color:#aaa; font-weight:500; letter-spacing:0.05em; text-transform:uppercase; font-size:0.78rem; }
            .sv-spacer { flex:1; }
            .sv-link   { color:#6366f1; text-decoration:none; font-size:0.85rem; }
            .sv-btn    { background:#1a1a22; color:#e6e6e6; border:1px solid #2a2a35; padding:0.5rem 1rem; border-radius:6px; cursor:pointer; font-size:0.85rem; font-family:inherit; }
            .sv-btn:hover { background:#22222d; }
            .sv-btn-primary { background:#6366f1; border-color:#6366f1; color:#fff; }
            .sv-btn-primary:hover { background:#4f46e5; }
            .sv-btn-warn { background:rgba(212,168,83,0.12); border-color:rgba(212,168,83,0.4); color:#facc15; }
            .sv-btn-danger { background:rgba(255,82,82,0.08); border-color:rgba(255,82,82,0.4); color:#ff5252; }

            .sv-main   { padding:1.5rem; max-width:1300px; margin:0 auto; flex:1; overflow-y:auto; overflow-x:hidden; width:100%; }
            .sv-empty  { text-align:center; padding:3rem 1rem; color:#666; border:1px dashed #2a2a35; border-radius:8px; }
            .sv-grid   { display:grid; grid-template-columns:repeat(auto-fill,minmax(360px,1fr)); gap:1rem; }
            .sv-card   { background:#0e0e14; border:1px solid #1a1a22; border-left:3px solid var(--readiness,#6366f1); border-radius:8px; padding:1rem; cursor:pointer; transition:background 0.15s; }
            .sv-card:hover { background:#13131a; }
            .sv-card h4 { margin:0 0 0.4rem 0; color:#fff; font-size:0.95rem; }
            .sv-card .meta { color:#888; font-size:0.72rem; }
            .sv-card .summary { color:#bbb; font-size:0.78rem; margin:0.5rem 0; line-height:1.4; max-height:3.6em; overflow:hidden; }
            .sv-card .badges { display:flex; gap:0.3rem; flex-wrap:wrap; margin-top:0.4rem; }
            .sv-badge  { font-size:0.65rem; padding:1px 6px; border-radius:8px; background:#1a1a22; color:#bbb; }
            .sv-badge.ready  { background:rgba(34,197,94,0.18); color:#86efac; }
            .sv-badge.solid  { background:rgba(99,102,241,0.18); color:#a5b4fc; }
            .sv-badge.tier2  { background:rgba(255,145,0,0.15); color:#fb923c; }

            .sv-modal  { position:fixed; inset:0; background:rgba(0,0,0,0.78); display:flex; align-items:flex-start; justify-content:center; z-index:1000; padding:2rem 1rem; overflow-y:auto; }
            .sv-modal-inner { background:#0e0e14; border:1px solid #2a2a35; border-radius:10px; padding:1.5rem; width:100%; max-width:780px; }
            .sv-modal h3 { margin:0 0 0.8rem 0; color:#fff; }
            .sv-modal label { display:block; color:#aaa; font-size:0.78rem; margin-top:0.7rem; margin-bottom:0.25rem; }
            .sv-modal input, .sv-modal select, .sv-modal textarea { width:100%; box-sizing:border-box; background:#050507; color:#e6e6e6; border:1px solid #2a2a35; border-radius:5px; padding:0.5rem; font-size:0.85rem; font-family:inherit; }
            .sv-modal textarea { min-height:80px; resize:vertical; }
            .sv-step  { background:#050507; border:1px solid #1a1a22; border-radius:5px; padding:0.6rem; margin-top:0.5rem; }
            .sv-step-row { display:grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap:0.4rem; margin-top:0.3rem; }
            .sv-modal .actions { display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1.2rem; flex-wrap:wrap; }

            /* H1.10.5 · Indicador "IA pensando" reutilizable */
            .sv-thinking { display:inline-flex; align-items:center; gap:0.5rem; color:#a5b4fc; font-size:0.85rem; }
            .sv-thinking .dots { display:inline-flex; gap:3px; }
            .sv-thinking .dots span { width:6px; height:6px; border-radius:50%; background:#a5b4fc; animation:sv-pulse 1.2s infinite ease-in-out; }
            .sv-thinking .dots span:nth-child(2) { animation-delay:0.2s; }
            .sv-thinking .dots span:nth-child(3) { animation-delay:0.4s; }
            @keyframes sv-pulse { 0%,80%,100%{opacity:0.3;transform:scale(0.8);} 40%{opacity:1;transform:scale(1.1);} }

            /* H1.10.5 · Bulk progress UI */
            .sv-bulk-row    { display:flex; align-items:center; gap:0.6rem; padding:0.4rem 0.5rem; border-bottom:1px solid #1a1a22; font-size:0.78rem; }
            .sv-bulk-row .role { flex:1; color:#e6e6e6; }
            .sv-bulk-row .stat { color:#666; font-size:0.72rem; }
            .sv-bulk-icon   { font-size:1rem; width:1.2rem; text-align:center; }
            .sv-progressbar { background:#1a1a22; border-radius:4px; overflow:hidden; height:6px; margin:0.5rem 0; }
            .sv-progressbar > span { display:block; height:100%; background:linear-gradient(90deg,#6366f1,#22c55e); transition:width 0.3s ease; }
        </style>

        <div class="sv-shell">
            <div class="sv-topbar">
                <a href="/" data-link class="sv-logo">🗼 Team<span>Towers</span></a>
                <span class="sv-title">SOPs del proyecto</span>
                <div class="sv-spacer"></div>
                ${renderNavLinksHtml({ active: 'sops', projectId: this.projectId, className: 'sv-link' })}
                ${this.projectId ? `<button class="sv-btn sv-btn-primary" id="svBtnBulkGen" title="Genera SOPs faltantes para todos los roles del proyecto">🤖 Generar todos los SOPs</button>` : ''}
            </div>
            <div class="sv-main" id="svMain"></div>
            <div id="svModalRoot"></div>
        </div>
        `;
    }

    async afterRender() {
        if (!this.projectId || !this.project) {
            document.getElementById('svMain').innerHTML = `
                <div class="sv-empty">
                    <p>Esta vista necesita un proyecto activo: abre <a href="/" data-link class="sv-link">el dashboard</a> y entra en un proyecto, luego pulsa <strong>📋 SOPs del proyecto</strong> en el topbar del mapa.</p>
                </div>`;
            return;
        }
        await this._load();
        this._render();
        document.getElementById('svBtnBulkGen')?.addEventListener('click', () => this._openBulkModal());

        // H1.10.7 · si la URL trae ?focus=sop-id (entrada desde el inspector
        // del Map · botón "📂 Ver SOP"), abrir el detalle de ese SOP.
        const focus = new URLSearchParams(window.location.search).get('focus');
        if (focus && this.sops.some(s => s.id === focus)) this._openDetail(focus);
    }

    destroy() { this._cancelBulk = true; }

    // ─── H1.10.5 · Bulk gen modal ───────────────────────────────────────────
    _openBulkModal() {
        if (!this.project || !Array.isArray(this.project.vna_roles) || this.project.vna_roles.length === 0) {
            alert('El proyecto no tiene roles VNA. Abre el mapa y añade roles primero.');
            return;
        }
        const root = document.getElementById('svModalRoot');
        const close = () => { this._cancelBulk = true; root.innerHTML = ''; };

        const existingByRole = new Set(this.sops.map(s => s.content?.role_ref).filter(Boolean));
        const roles = this.project.vna_roles;
        const missing = roles.filter(r => !existingByRole.has(r.id)).length;
        const skipping = roles.length - missing;

        const rolesHtml = roles.map(r => {
            const existing = existingByRole.has(r.id);
            return `
                <div class="sv-bulk-row" data-bulk-role="${this._esc(r.id)}">
                    <span class="sv-bulk-icon" data-bulk-icon="${this._esc(r.id)}">${existing ? '⏭' : '⏸'}</span>
                    <span class="role">${this._esc(r.name || r.id)}</span>
                    <span class="stat" data-bulk-stat="${this._esc(r.id)}">${existing ? 'ya tiene SOP · skip' : 'pendiente'}</span>
                </div>
            `;
        }).join('');

        root.innerHTML = `
            <div class="sv-modal" id="svBulkBg">
                <div class="sv-modal-inner" style="max-width:680px;">
                    <h3>🤖 Generar SOPs para todos los roles</h3>
                    <p style="color:#aaa;font-size:0.78rem;">Proyecto: <strong>${this._esc(this.project.nombre || this.project.id)}</strong> · ${roles.length} roles · ${skipping} ya con SOP · <strong>${missing} faltantes</strong></p>

                    <div style="margin-top:0.7rem;">
                        <div class="sv-thinking" id="svBulkStatus" style="display:none;">
                            <span>🧠 La IA está pensando</span>
                            <span class="dots"><span></span><span></span><span></span></span>
                            <span id="svBulkPhase" style="color:#aaa;font-size:0.78rem;"></span>
                        </div>
                    </div>

                    <div class="sv-progressbar"><span id="svBulkProgress" style="width:0%;"></span></div>
                    <div id="svBulkSummary" style="color:#aaa;font-size:0.75rem;margin-bottom:0.7rem;">Listo para empezar.</div>

                    <div style="max-height:280px;overflow-y:auto;border:1px solid #1a1a22;border-radius:6px;padding:0.3rem 0.5rem;">
                        ${rolesHtml}
                    </div>

                    <p style="color:#666;font-size:0.72rem;margin-top:0.5rem;">Por defecto se saltan los roles que ya tienen SOP. Cada llamada al LLM tarda 8-25s. Total estimado: ~${Math.max(missing * 12, 5)}s.</p>

                    <div class="actions">
                        <button class="sv-btn" id="svBulkClose">Cerrar</button>
                        <button class="sv-btn sv-btn-warn" id="svBulkCancel" style="display:none;">⏹ Cancelar</button>
                        <button class="sv-btn sv-btn-primary" id="svBulkGo" ${missing === 0 ? 'disabled' : ''}>${missing === 0 ? 'No hay nada que generar' : '▶ Empezar (' + missing + ')'}</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('svBulkClose').addEventListener('click', close);
        document.getElementById('svBulkBg').addEventListener('click', e => { if (e.target.id === 'svBulkBg') close(); });
        document.getElementById('svBulkCancel').addEventListener('click', () => {
            this._cancelBulk = true;
            document.getElementById('svBulkSummary').textContent = '⏹ Cancelando tras el SOP en curso…';
        });
        document.getElementById('svBulkGo').addEventListener('click', () => this._executeBulkGen());
    }

    async _executeBulkGen() {
        this._cancelBulk = false;
        const goBtn  = document.getElementById('svBulkGo');
        const cancel = document.getElementById('svBulkCancel');
        const status = document.getElementById('svBulkStatus');
        const phase  = document.getElementById('svBulkPhase');
        const bar    = document.getElementById('svBulkProgress');
        const summary= document.getElementById('svBulkSummary');
        if (goBtn)   goBtn.style.display   = 'none';
        if (cancel)  cancel.style.display  = 'inline-block';
        if (status)  status.style.display  = 'inline-flex';

        const phases = ['construyendo contexto', 'llamando al LLM', 'validando JSON', 'persistiendo'];
        let phaseIdx = 0;
        const phaseTimer = setInterval(() => {
            phaseIdx = (phaseIdx + 1) % phases.length;
            if (phase) phase.textContent = '· ' + phases[phaseIdx];
        }, 1800);

        try {
            const { generateAllRoleSopsForProject } = await import('../core/roleSopGenerator.js?v=' + Date.now());
            let doneCount = 0, errorCount = 0, skipCount = 0;

            const result = await generateAllRoleSopsForProject({
                project:      this.project,
                existingSops: this.sops,
                isCancelled:  () => this._cancelBulk,
                onProgress: (e) => {
                    const icon = document.querySelector(`[data-bulk-icon="${this._cssEsc(e.role.id)}"]`);
                    const stat = document.querySelector(`[data-bulk-stat="${this._cssEsc(e.role.id)}"]`);
                    if (e.status === 'running') {
                        if (icon) icon.textContent = '⏳';
                        if (stat) stat.textContent = '🧠 generando…';
                        if (phase) phase.textContent = '· rol "' + (e.role.name || e.role.id) + '"';
                    } else if (e.status === 'done') {
                        doneCount++;
                        if (icon) icon.textContent = '✅';
                        if (stat) stat.textContent = (e.result?.readiness || 'solid') + ' · ' + (e.result?.latencyMs || 0) + 'ms';
                    } else if (e.status === 'error') {
                        errorCount++;
                        if (icon) icon.textContent = '❌';
                        if (stat) {
                            stat.textContent = (e.error?.message || 'error').slice(0, 60);
                            stat.style.color = '#fca5a5';
                        }
                    } else if (e.status === 'skipped') {
                        skipCount++;
                        if (icon) icon.textContent = '⏭';
                        if (stat) stat.textContent = 'skip · ya existía';
                    }
                    const pct = Math.round(((e.index + 1) / e.total) * 100);
                    if (bar) bar.style.width = pct + '%';
                    if (summary) summary.textContent = `${doneCount} OK · ${errorCount} errores · ${skipCount} omitidos · ${e.index + 1}/${e.total}`;
                },
            });

            // Persistir todos los SOPs generados como nodos KB
            for (const r of result.generated) {
                const sopId = r.sop.id || ('sop-' + r.roleRef + '-' + r.projectRef);
                await store.dispatch({ type: 'KB_UPSERT', payload: { node: {
                    id:        sopId,
                    type:      'sop',
                    projectId: r.projectRef,
                    content: {
                        ...r.sop,
                        role_ref:    r.roleRef,
                        project_ref: r.projectRef,
                        readiness:   r.readiness,
                        sources:     r.sources,
                        tokens:      r.tokens,
                        latencyMs:   r.latencyMs,
                        generatedAt: Date.now(),
                        kind:        'project-role-sop',
                    },
                    keywords: ['sop', 'project-role-sop', r.roleRef, r.projectRef],
                }}});
            }

            if (status) status.style.display = 'none';
            if (summary) {
                summary.innerHTML = result.cancelled
                    ? `⏹ Cancelado · ${result.generated.length} OK · ${result.errors.length} errores`
                    : `✅ Terminado · ${result.generated.length} SOPs generados · ${result.errors.length} errores · ${skipCount} omitidos`;
            }
            await this._load();
            this._render();
        } catch (err) {
            console.error('[H1.10.5] Bulk error:', err);
            if (summary) summary.innerHTML = `<span style="color:#fca5a5;">Error fatal: ${this._esc(err.message)}</span>`;
        } finally {
            clearInterval(phaseTimer);
            if (cancel) cancel.style.display = 'none';
            if (goBtn) {
                goBtn.style.display = 'inline-block';
                goBtn.disabled = true;
                goBtn.textContent = 'Cerrar para refrescar';
            }
        }
    }

    _cssEsc(str) { return String(str || '').replace(/"/g, '\\"'); }

    async _load() {
        await KB.init();
        this.sops = await KB.query({ type: 'sop', projectId: this.projectId });
        this.sops.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }

    _render() {
        const root = document.getElementById('svMain');
        const head = `
            <div style="margin-bottom:1.2rem;">
                <h2 style="margin:0;color:#fff;font-size:1.2rem;">${this._esc(this.project.nombre || this.project.id)}</h2>
                <p style="color:#aaa;font-size:0.8rem;margin:0.3rem 0 0 0;">${this.sops.length} SOP${this.sops.length === 1 ? '' : 's'} propios del proyecto · sector base ${this._esc(this.project.based_on_sector || this.project.sector_id || '?')}</p>
                <p style="color:#666;font-size:0.78rem;margin-top:0.5rem;">Para generar nuevos SOPs ve al <a href="/map?project=${this.projectId}" data-link class="sv-link">mapa de valor</a>, selecciona un rol y pulsa <em>📋 Generar SOP del rol con IA</em>.</p>
            </div>
        `;
        if (this.sops.length === 0) {
            root.innerHTML = head + `
                <div class="sv-empty">
                    <p>Aún no hay SOPs propios del proyecto.</p>
                    <p style="font-size:0.85rem;color:#888;margin-top:0.5rem;">
                        Cada rol VNA del cliente puede tener su propio SOP que describe sus productos y servicios.
                    </p>
                </div>`;
            return;
        }
        root.innerHTML = head + `<div class="sv-grid">${this.sops.map(s => this._cardHtml(s)).join('')}</div>`;
        root.querySelectorAll('[data-sop]').forEach(card => {
            card.addEventListener('click', () => this._openDetail(card.dataset.sop));
        });
    }

    _cardHtml(node) {
        const c = node.content || {};
        const readiness = (c.readiness || 'solid').replace(' ', '');
        const color = READINESS_COLOR[c.readiness] || '#6366f1';
        const stepCount = (c.steps || []).length;
        const aiSteps   = (c.steps || []).filter(s => s.role_kind === 'ai').length;
        return `
            <div class="sv-card" data-sop="${node.id}" style="--readiness:${color};">
                <h4>${this._esc(c.name || node.id)}</h4>
                <div class="meta">rol: ${this._esc(c.role_ref || '?')} · v${this._esc(c.version || '1.0')} · actualizado ${fmtTs(node.updatedAt)}</div>
                ${c.summary ? `<div class="summary">${this._esc(c.summary)}</div>` : ''}
                <div class="badges">
                    <span class="sv-badge ${readiness}">${this._esc(c.readiness || 'solid').toUpperCase()}</span>
                    <span class="sv-badge">${stepCount} steps</span>
                    ${aiSteps ? `<span class="sv-badge" style="background:rgba(99,102,241,0.18);color:#a5b4fc;">${aiSteps} IA</span>` : ''}
                    ${c.duration_minutes ? `<span class="sv-badge">${c.duration_minutes} min total</span>` : ''}
                </div>
            </div>
        `;
    }

    // ─── Detail / Edit modal ─────────────────────────────────────────────────
    _openDetail(nodeId) {
        const node = this.sops.find(n => n.id === nodeId);
        if (!node) return;
        const c = node.content || {};
        const root = document.getElementById('svModalRoot');
        const close = () => { root.innerHTML = ''; };
        const stepsHtml = (c.steps || []).map((s, i) => `
            <div class="sv-step">
                <input data-step-idx="${i}" data-field="label" type="text" value="${this._esc(s.label || '')}" placeholder="label">
                <div class="sv-step-row">
                    <input data-step-idx="${i}" data-field="role_profile" type="text" value="${this._esc(s.role_profile || '')}" placeholder="role_profile">
                    <select data-step-idx="${i}" data-field="role_kind">
                        <option value="human" ${s.role_kind === 'human' ? 'selected' : ''}>👤 human</option>
                        <option value="ai"    ${s.role_kind === 'ai'    ? 'selected' : ''}>🤖 ai</option>
                    </select>
                    <input data-step-idx="${i}" data-field="duration_minutes" type="number" min="0" step="5" value="${s.duration_minutes || 0}" placeholder="min">
                    <select data-step-idx="${i}" data-field="priority">
                        <option value="low"  ${s.priority === 'low'  ? 'selected' : ''}>low</option>
                        <option value="med"  ${(s.priority === 'med' || !s.priority) ? 'selected' : ''}>med</option>
                        <option value="high" ${s.priority === 'high' ? 'selected' : ''}>high</option>
                    </select>
                </div>
            </div>
        `).join('');

        root.innerHTML = `
            <div class="sv-modal" id="svDetailBg">
                <div class="sv-modal-inner">
                    <h3>${this._esc(c.name || node.id)}</h3>
                    <p style="color:#aaa;font-size:0.78rem;margin:0;">rol: ${this._esc(c.role_ref || '?')} · v${this._esc(c.version || '1.0')} · ${(c.steps || []).length} steps</p>

                    <label>Nombre del SOP</label>
                    <input id="svdName" type="text" value="${this._esc(c.name || '')}">

                    <label>Summary (resumen ejecutivo)</label>
                    <textarea id="svdSummary">${this._esc(c.summary || '')}</textarea>

                    <label>Steps editables</label>
                    <div id="svdSteps">${stepsHtml || '<p style="color:#666;font-size:0.78rem;">Sin steps. Regenera con feedback para añadirlos.</p>'}</div>

                    ${c.regeneration_notes ? `<label>Notas de regeneración previa</label><div style="background:rgba(212,168,83,0.08);border-left:2px solid #d4a853;padding:0.5rem;border-radius:3px;color:#facc15;font-size:0.78rem;">${this._esc(c.regeneration_notes)}</div>` : ''}

                    <div class="actions">
                        <button class="sv-btn sv-btn-danger" id="svdDel">🗑 Borrar</button>
                        <button class="sv-btn sv-btn-warn" id="svdRegen">🔄 Regenerar con feedback</button>
                        <button class="sv-btn" id="svdClose">Cerrar</button>
                        <button class="sv-btn sv-btn-primary" id="svdSave">💾 Guardar cambios</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('svdClose').addEventListener('click', close);
        document.getElementById('svDetailBg').addEventListener('click', e => { if (e.target.id === 'svDetailBg') close(); });
        document.getElementById('svdDel').addEventListener('click', async () => {
            if (!confirm('¿Borrar este SOP? Las WOs ya generadas a partir de él no se borran (siguen referenciando su id).')) return;
            close();
            await store.dispatch({ type: 'KB_DELETE', payload: { id: node.id } });
            await this._load();
            this._render();
        });
        document.getElementById('svdSave').addEventListener('click', async () => {
            const updatedSteps = (c.steps || []).map((s, i) => {
                const labelEl = document.querySelector(`[data-step-idx="${i}"][data-field="label"]`);
                const profEl  = document.querySelector(`[data-step-idx="${i}"][data-field="role_profile"]`);
                const kindEl  = document.querySelector(`[data-step-idx="${i}"][data-field="role_kind"]`);
                const durEl   = document.querySelector(`[data-step-idx="${i}"][data-field="duration_minutes"]`);
                const prioEl  = document.querySelector(`[data-step-idx="${i}"][data-field="priority"]`);
                return {
                    ...s,
                    label:            labelEl ? labelEl.value : s.label,
                    role_profile:     profEl  ? profEl.value  : s.role_profile,
                    role_kind:        kindEl  ? kindEl.value  : s.role_kind,
                    duration_minutes: durEl   ? Number(durEl.value) || 0 : s.duration_minutes,
                    priority:         prioEl  ? prioEl.value  : s.priority,
                };
            });
            const updated = {
                ...node,
                content: {
                    ...c,
                    name:    document.getElementById('svdName').value.trim() || c.name,
                    summary: document.getElementById('svdSummary').value.trim(),
                    steps:   updatedSteps,
                    duration_minutes: updatedSteps.reduce((acc, s) => acc + (Number(s.duration_minutes) || 0), 0),
                    editedAt: Date.now(),
                },
            };
            await store.dispatch({ type: 'KB_UPSERT', payload: { node: updated } });
            close();
            await this._load();
            this._render();
        });
        document.getElementById('svdRegen').addEventListener('click', () => {
            close();
            this._openRegenModal(node);
        });
    }

    // ─── Regenerate with feedback modal ─────────────────────────────────────
    _openRegenModal(node) {
        const c = node.content || {};
        const root = document.getElementById('svModalRoot');
        const close = () => { root.innerHTML = ''; };
        root.innerHTML = `
            <div class="sv-modal" id="svRegenBg">
                <div class="sv-modal-inner">
                    <h3>🔄 Regenerar SOP con feedback</h3>
                    <p style="color:#aaa;font-size:0.78rem;">SOP actual: <strong>${this._esc(c.name || node.id)}</strong> · v${this._esc(c.version || '1.0')}</p>
                    <label>¿Qué quieres mejorar / añadir / corregir?</label>
                    <textarea id="svrFeedback" placeholder="Ejemplos:
- Añade un step IA que verifique calidad del output del paso 3.
- El step de notificación al cliente debería estar antes del cierre.
- Reduce la duración total a menos de 90 minutos.
- Cambia el tono a más operativo, menos consultivo." style="min-height:160px;"></textarea>
                    <div class="actions">
                        <button class="sv-btn" id="svrCancel">Cancelar</button>
                        <button class="sv-btn sv-btn-primary" id="svrGo">🤖 Regenerar</button>
                    </div>
                    <div id="svrPreview"></div>
                </div>
            </div>
        `;
        document.getElementById('svrCancel').addEventListener('click', close);
        document.getElementById('svRegenBg').addEventListener('click', e => { if (e.target.id === 'svRegenBg') close(); });
        document.getElementById('svrGo').addEventListener('click', async () => {
            const feedback = document.getElementById('svrFeedback').value.trim();
            if (!feedback) { alert('Necesitas escribir feedback para regenerar.'); return; }
            await this._executeRegenerate(node, feedback);
        });
    }

    async _executeRegenerate(node, feedback) {
        const preview = document.getElementById('svrPreview');
        preview.innerHTML = `<p style="color:#aaa;margin-top:1rem;">🤖 Regenerando con feedback…</p>`;
        try {
            const { regenerateSopWithFeedback } = await import('../core/roleSopGenerator.js?v=' + Date.now());
            const role = (this.project.vna_roles || []).find(r => r.id === node.content?.role_ref) || { id: node.content?.role_ref };
            const result = await regenerateSopWithFeedback({
                previousSop: node.content,
                role,
                project:     this.project,
                feedback,
                sectorBase:  this.project.based_on_sector || this.project.sector_id,
            });
            this._renderRegenPreview(node, result);
        } catch (err) {
            console.error('[H1.10.4] Error regenerando SOP:', err);
            preview.innerHTML = `<pre style="background:#050507;padding:0.6rem;border-radius:5px;color:#fca5a5;white-space:pre-wrap;font-size:0.78rem;margin-top:1rem;max-height:300px;overflow:auto;">${this._esc(err.message)}</pre>`;
        }
    }

    _renderRegenPreview(originalNode, result) {
        const preview = document.getElementById('svrPreview');
        const sop = result.sop;
        const stepsCount = Array.isArray(sop.steps) ? sop.steps.length : 0;
        preview.innerHTML = `
            <div style="background:#050507;border:1px solid #1a1a22;border-radius:6px;padding:0.8rem;margin-top:1rem;font-size:0.78rem;color:#e6e6e6;">
                <strong style="color:#fff;">Versión propuesta: v${this._esc(sop.version || '?')}</strong>
                ${sop.regeneration_notes ? `<p style="color:#facc15;margin:0.4rem 0;">${this._esc(sop.regeneration_notes)}</p>` : ''}
                <div style="color:#aaa;font-size:0.72rem;">${stepsCount} steps · Tokens ${(result.tokens.prompt_tokens||0)}+${(result.tokens.completion_tokens||0)} · ${result.latencyMs}ms</div>
                <details style="margin-top:0.5rem;"><summary style="cursor:pointer;color:#aaa;">Ver JSON completo</summary>
                    <pre style="background:#000;padding:0.5rem;border-radius:4px;color:#bbb;font-size:0.7rem;max-height:240px;overflow:auto;margin-top:0.4rem;">${this._esc(JSON.stringify(sop, null, 2))}</pre>
                </details>
                <div style="display:flex;gap:0.5rem;margin-top:0.7rem;">
                    <button class="sv-btn" id="svrDiscard">Descartar</button>
                    <button class="sv-btn sv-btn-primary" id="svrAccept">✓ Sustituir versión actual</button>
                </div>
            </div>
        `;
        document.getElementById('svrDiscard').addEventListener('click', () => {
            preview.innerHTML = '';
        });
        document.getElementById('svrAccept').addEventListener('click', async () => {
            const updated = {
                ...originalNode,
                content: {
                    ...originalNode.content,
                    ...sop,
                    role_ref:    originalNode.content.role_ref,    // preservamos identidad
                    project_ref: originalNode.content.project_ref,
                    version:     sop.version || 'v2',
                    sources:     result.sources,
                    tokens:      result.tokens,
                    latencyMs:   result.latencyMs,
                    regeneratedAt: Date.now(),
                },
            };
            await store.dispatch({ type: 'KB_UPSERT', payload: { node: updated } });
            document.getElementById('svModalRoot').innerHTML = '';
            await this._load();
            this._render();
        });
    }

    _esc(str) {
        return String(str ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }
}
