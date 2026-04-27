// =============================================================================
// TEAMTOWERS SOS V11 — WORKSHOPS VIEW
// Ruta: /js/views/WorkshopsView.js
//
// Gestión de talleres Fent Pinya (y otros formatos):
//   - Listado agrupado por estado: propuesta | agendado | impartido | cobrado
//   - Crear taller (modal)
//   - Cambiar estado (1 click)
//   - Borrar
//
// Persistencia: nodos `type: 'workshop'` en KB (Mind-as-Graph).
// =============================================================================

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';

const STATUSES = [
    { id: 'propuesta', label: 'Propuesta',  color: '#94a3b8', emoji: '📝' },
    { id: 'agendado',  label: 'Agendado',   color: '#6366f1', emoji: '📅' },
    { id: 'impartido', label: 'Impartido',  color: '#22c55e', emoji: '🎯' },
    { id: 'cobrado',   label: 'Cobrado',    color: '#16a34a', emoji: '💶' },
];

// Por defecto cualquier taller nuevo es Fent Pinya. Editable más adelante.
const DEFAULT_TYPE = 'fent-pinya';

function uid() { return 'ws-' + Math.random().toString(36).slice(2, 9) + '-' + Date.now().toString(36); }

function fmtDate(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusMeta(id) {
    return STATUSES.find(s => s.id === id) || STATUSES[0];
}

export default class WorkshopsView {

    constructor() {
        this.workshops = [];
    }

    async getHtml() {
        return `
        <style>
            .ws-shell      { min-height:100dvh; background:var(--bg-0,#050507); color:#e6e6e6; font-family:var(--font-sans,sans-serif); }
            .ws-topbar     { display:flex; align-items:center; gap:1rem; padding:1rem 1.5rem; border-bottom:1px solid #1a1a22; background:#08080c; }
            .ws-logo       { font-weight:700; color:#fff; text-decoration:none; font-size:1.05rem; }
            .ws-logo span  { color:#6366f1; }
            .ws-title      { color:#aaa; font-weight:500; letter-spacing:0.05em; text-transform:uppercase; font-size:0.8rem; }
            .ws-spacer     { flex:1; }
            .ws-btn        { background:#1a1a22; color:#e6e6e6; border:1px solid #2a2a35; padding:0.5rem 1rem; border-radius:6px; cursor:pointer; font-size:0.85rem; }
            .ws-btn:hover  { background:#22222d; }
            .ws-btn-primary{ background:#6366f1; border-color:#6366f1; color:#fff; }
            .ws-btn-primary:hover { background:#4f46e5; }
            .ws-link       { color:#6366f1; text-decoration:none; }

            .ws-main       { padding:1.5rem; max-width:1200px; margin:0 auto; }
            .ws-stats      { display:flex; gap:1rem; margin-bottom:2rem; flex-wrap:wrap; }
            .ws-stat       { background:#0e0e14; border:1px solid #1a1a22; border-radius:8px; padding:0.85rem 1.1rem; min-width:130px; }
            .ws-stat-num   { font-size:1.6rem; font-weight:700; color:#fff; line-height:1; }
            .ws-stat-lbl   { color:#888; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.08em; margin-top:0.4rem; }

            .ws-section    { margin-bottom:2rem; }
            .ws-section-h  { color:#aaa; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:0.6rem; display:flex; align-items:center; gap:0.5rem; }
            .ws-section-h .ws-pill { background:#1a1a22; padding:2px 8px; border-radius:10px; font-size:0.7rem; color:#bbb; }

            .ws-grid       { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1rem; }
            .ws-card       { background:#0e0e14; border:1px solid #1a1a22; border-left:3px solid var(--accent,#6366f1); border-radius:8px; padding:1rem; display:flex; flex-direction:column; gap:0.5rem; }
            .ws-card h4    { margin:0; color:#fff; font-size:1rem; }
            .ws-card .meta { color:#888; font-size:0.78rem; }
            .ws-card .row  { display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; }
            .ws-card .row label { color:#888; font-size:0.7rem; min-width:60px; }
            .ws-card select{ background:#1a1a22; color:#e6e6e6; border:1px solid #2a2a35; border-radius:5px; padding:3px 6px; font-size:0.78rem; }
            .ws-card .actions { display:flex; gap:0.4rem; margin-top:0.5rem; padding-top:0.5rem; border-top:1px solid #1a1a22; }
            .ws-card .actions button { font-size:0.72rem; padding:0.3rem 0.6rem; }
            .ws-card .actions .danger { color:#ff5252; }

            .ws-empty      { text-align:center; padding:3rem 1rem; color:#666; border:1px dashed #2a2a35; border-radius:8px; }

            .ws-modal      { position:fixed; inset:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000; }
            .ws-modal-inner{ background:#0e0e14; border:1px solid #2a2a35; border-radius:12px; padding:1.5rem; width:90%; max-width:480px; }
            .ws-modal h3   { margin:0 0 1rem 0; color:#fff; }
            .ws-modal label{ display:block; color:#aaa; font-size:0.78rem; margin-top:0.7rem; margin-bottom:0.25rem; }
            .ws-modal input, .ws-modal select, .ws-modal textarea { width:100%; box-sizing:border-box; background:#050507; color:#e6e6e6; border:1px solid #2a2a35; border-radius:5px; padding:0.5rem; font-size:0.85rem; font-family:inherit; }
            .ws-modal textarea { min-height:70px; resize:vertical; }
            .ws-modal .actions { display:flex; gap:0.6rem; justify-content:flex-end; margin-top:1.2rem; }
        </style>

        <div class="ws-shell">
            <div class="ws-topbar">
                <a href="/" data-link class="ws-logo">🗼 Team<span>Towers</span></a>
                <span class="ws-title">Workshops · Fent Pinya Ops</span>
                <div class="ws-spacer"></div>
                <a href="/dashboard" data-link class="ws-link">← Dashboard</a>
                <button class="ws-btn ws-btn-primary" id="wsBtnNew">＋ Nuevo taller</button>
            </div>

            <div class="ws-main">
                <div class="ws-stats" id="wsStats"></div>
                <div id="wsBoard"></div>
            </div>

            <div id="wsModalRoot"></div>
        </div>
        `;
    }

    async afterRender() {
        await this._loadWorkshops();
        this._render();
        document.getElementById('wsBtnNew').addEventListener('click', () => this._openModal());
    }

    destroy() {
        // sin sims D3 ni listeners globales — nada que limpiar
    }

    // ─── data ──────────────────────────────────────────────────────────────
    async _loadWorkshops() {
        await KB.init();
        this.workshops = await KB.query({ type: 'workshop' });
        this.workshops.sort((a, b) => (b.content?.date || 0) - (a.content?.date || 0));
    }

    async _saveWorkshop(node) {
        await store.dispatch({ type: 'KB_UPSERT', payload: { node } });
        await this._loadWorkshops();
        this._render();
    }

    async _deleteWorkshop(id) {
        if (!confirm('¿Borrar este taller? La acción es irreversible.')) return;
        await store.dispatch({ type: 'KB_DELETE', payload: { id } });
        await this._loadWorkshops();
        this._render();
    }

    async _changeStatus(id, newStatus) {
        const w = this.workshops.find(x => x.id === id);
        if (!w) return;
        const updated = { ...w, content: { ...w.content, status: newStatus } };
        await this._saveWorkshop(updated);
    }

    // ─── render ─────────────────────────────────────────────────────────────
    _render() {
        this._renderStats();
        this._renderBoard();
    }

    _renderStats() {
        const root = document.getElementById('wsStats');
        if (!root) return;
        const counts = STATUSES.map(s => ({
            ...s,
            count: this.workshops.filter(w => (w.content?.status || 'propuesta') === s.id).length
        }));
        root.innerHTML = counts.map(c => `
            <div class="ws-stat" style="border-left:3px solid ${c.color};">
                <div class="ws-stat-num">${c.count}</div>
                <div class="ws-stat-lbl">${c.emoji} ${c.label}</div>
            </div>
        `).join('') + `
            <div class="ws-stat" style="border-left:3px solid #6366f1;">
                <div class="ws-stat-num">${this.workshops.length}</div>
                <div class="ws-stat-lbl">📚 Total</div>
            </div>
        `;
    }

    _renderBoard() {
        const root = document.getElementById('wsBoard');
        if (!root) return;

        if (this.workshops.length === 0) {
            root.innerHTML = `
                <div class="ws-empty">
                    Aún no hay talleres registrados.<br>
                    Pulsa <strong>＋ Nuevo taller</strong> para crear el primero.
                </div>`;
            return;
        }

        root.innerHTML = STATUSES.map(s => {
            const items = this.workshops.filter(w => (w.content?.status || 'propuesta') === s.id);
            if (items.length === 0) return '';
            return `
                <div class="ws-section">
                    <div class="ws-section-h">
                        ${s.emoji} ${s.label} <span class="ws-pill">${items.length}</span>
                    </div>
                    <div class="ws-grid">
                        ${items.map(w => this._cardHtml(w, s)).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // bind actions
        root.querySelectorAll('[data-ws-status]').forEach(sel => {
            sel.addEventListener('change', e => this._changeStatus(sel.dataset.wsStatus, e.target.value));
        });
        root.querySelectorAll('[data-ws-del]').forEach(btn => {
            btn.addEventListener('click', () => this._deleteWorkshop(btn.dataset.wsDel));
        });
    }

    _cardHtml(w, s) {
        const c = w.content || {};
        const audSize = c.audienceSize ? `${c.audienceSize} pers.` : '—';
        return `
            <div class="ws-card" style="--accent:${s.color};">
                <h4>${this._esc(c.clientName || '(sin cliente)')}</h4>
                <div class="meta">${this._esc(c.type || DEFAULT_TYPE)} · ${this._esc(c.sector || '—')} · ${audSize}</div>
                <div class="meta">📅 ${fmtDate(c.date)}</div>
                ${c.notes ? `<div class="meta" style="color:#aaa;">${this._esc(c.notes)}</div>` : ''}
                <div class="row">
                    <label>Estado</label>
                    <select data-ws-status="${w.id}">
                        ${STATUSES.map(st => `<option value="${st.id}" ${st.id===s.id?'selected':''}>${st.emoji} ${st.label}</option>`).join('')}
                    </select>
                </div>
                <div class="actions">
                    <button class="ws-btn danger" data-ws-del="${w.id}">Borrar</button>
                </div>
            </div>
        `;
    }

    _esc(str) {
        return String(str).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }

    // ─── modal de creación ──────────────────────────────────────────────────
    _openModal() {
        const root = document.getElementById('wsModalRoot');
        if (!root) return;
        const today = new Date().toISOString().split('T')[0];
        root.innerHTML = `
            <div class="ws-modal" id="wsModalBg">
                <div class="ws-modal-inner">
                    <h3>＋ Nuevo taller</h3>
                    <label>Cliente</label>
                    <input id="wsfClient" type="text" placeholder="Ayuntamiento de X / Startup Y / ...">
                    <label>Tipo</label>
                    <select id="wsfType">
                        <option value="fent-pinya" selected>Fent Pinya · Taller base (180 min)</option>
                        <option value="custom">Custom</option>
                    </select>
                    <label>Sector / contexto</label>
                    <input id="wsfSector" type="text" placeholder="consultoría / startup / ayuntamiento / CoP...">
                    <label>Fecha</label>
                    <input id="wsfDate" type="date" value="${today}">
                    <label>Tamaño de audiencia</label>
                    <input id="wsfAud" type="number" min="0" placeholder="ej. 18">
                    <label>Notas</label>
                    <textarea id="wsfNotes" placeholder="objetivo del cliente, sponsor, contactos..."></textarea>
                    <div class="actions">
                        <button class="ws-btn" id="wsfCancel">Cancelar</button>
                        <button class="ws-btn ws-btn-primary" id="wsfSave">Guardar</button>
                    </div>
                </div>
            </div>
        `;
        const close = () => { root.innerHTML = ''; };
        document.getElementById('wsfCancel').addEventListener('click', close);
        document.getElementById('wsModalBg').addEventListener('click', e => { if (e.target.id === 'wsModalBg') close(); });
        document.getElementById('wsfSave').addEventListener('click', async () => {
            const node = {
                id:        uid(),
                type:      'workshop',
                projectId: null,    // se asociará a proyecto cuando exista flujo de cliente
                content: {
                    clientName:   document.getElementById('wsfClient').value.trim() || '(sin cliente)',
                    type:         document.getElementById('wsfType').value,
                    sector:       document.getElementById('wsfSector').value.trim(),
                    date:         new Date(document.getElementById('wsfDate').value).getTime() || Date.now(),
                    audienceSize: parseInt(document.getElementById('wsfAud').value, 10) || null,
                    notes:        document.getElementById('wsfNotes').value.trim(),
                    status:       'propuesta',
                },
                keywords: ['workshop', document.getElementById('wsfType').value],
            };
            close();
            await this._saveWorkshop(node);
        });
    }
}
