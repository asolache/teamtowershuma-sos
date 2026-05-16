// =============================================================================
// TEAMTOWERS SOS V11 — NOTES VIEW (QUICK-CAPTURE-LIST sprint A)
// Ruta · /js/views/NotesView.js  →  /notes
//
// Llista TOTES les notes capturades amb el FAB (`type:'note'` · `type:'wo'`
// · `type:'insight'` · `type:'skill'`) i permet evolucionar-les a entitats
// SOS · projecte · work_order · deliverable.
//
// Pure render · KB query · cap IA · evolució via CTA que invoca el
// `nodeShareService` o crida directa al store/KB.
// =============================================================================

import { KB } from '../core/kb.js';

const TPL_VERSION = 'notes-v1.0';

const CAPTURE_TYPES = Object.freeze([
    { id: 'note',    icon: '📝', label: 'Notes',     color: '#a8b2ff' },
    { id: 'wo',      icon: '✅', label: 'Work Orders', color: '#22c55e' },
    { id: 'insight', icon: '💡', label: 'Insights',  color: '#facc15' },
    { id: 'skill',   icon: '🤲', label: 'Skills',    color: '#f472b6' },
]);

export default class NotesView {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Notes · SOS';
        this._activeFilter = 'note';
    }

    async getHtml() {
        try {
            const url = new URL(window.location.href);
            const f = url.searchParams.get('type');
            if (f && CAPTURE_TYPES.some(c => c.id === f)) this._activeFilter = f;
        } catch (_) {}

        // Carrega tots els tipus en paral·lel
        const byType = {};
        await Promise.all(CAPTURE_TYPES.map(async c => {
            byType[c.id] = await KB.query({ type: c.id }).catch(() => []);
        }));

        return this._renderShell(byType);
    }

    async afterRender() {
        document.querySelectorAll('[data-action="evolve-to"]').forEach(btn => {
            btn.addEventListener('click', (e) => this._evolveTo(e.currentTarget));
        });
        document.querySelectorAll('[data-action="delete-note"]').forEach(btn => {
            btn.addEventListener('click', (e) => this._deleteNote(e.currentTarget));
        });
    }

    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    _renderShell(byType) {
        const active = CAPTURE_TYPES.find(c => c.id === this._activeFilter) || CAPTURE_TYPES[0];
        const activeNodes = (byType[active.id] || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        return `
        <style>
            .nts-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); padding-bottom:2rem; }
            .nts-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); }
            .nts-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .nts-logo span { color:var(--accent-indigo); }
            .nts-main { max-width:900px; margin:0 auto; padding:1.2rem 1rem; display:flex; flex-direction:column; gap:1rem; }
            .nts-hero { padding:1rem 1.2rem; background:linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.06)); border:1px solid rgba(99,102,241,0.25); border-radius:8px; }
            .nts-hero h1 { margin:0 0 4px 0; font-size:1.3rem; }
            .nts-hero p { margin:0; font-size:0.85rem; color:var(--text-secondary); line-height:1.5; }
            .nts-tabs { display:flex; gap:6px; flex-wrap:wrap; }
            .nts-tab { padding:8px 14px; border-radius:999px; border:1px solid var(--border-default); background:var(--bg-panel); color:var(--text-secondary); cursor:pointer; font-size:0.82rem; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:5px; }
            .nts-tab:hover { color:var(--text-main); }
            .nts-tab.active { color:#fff; background:linear-gradient(135deg,#a855f7,#6366f1); border-color:transparent; }
            .nts-tab .cnt { padding:1px 7px; border-radius:999px; background:rgba(255,255,255,0.18); font-size:0.65rem; }
            .nts-list { display:flex; flex-direction:column; gap:0.6rem; }
            .nts-empty { padding:2.5rem 1rem; text-align:center; color:var(--text-secondary); background:var(--bg-panel); border:1px dashed var(--border-default); border-radius:8px; }
            .nts-card { background:var(--bg-panel); border:1px solid var(--border-default); border-left-width:3px; border-radius:8px; padding:0.85rem 1rem; }
            .nts-card-head { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px; font-size:0.72rem; color:var(--text-secondary); }
            .nts-card-body { font-size:0.92rem; line-height:1.5; white-space:pre-wrap; word-break:break-word; margin-bottom:8px; }
            .nts-card-actions { display:flex; gap:6px; flex-wrap:wrap; }
            .nts-btn { padding:5px 10px; border-radius:6px; border:1px solid var(--border-default); background:transparent; color:var(--text-main); cursor:pointer; font-size:0.74rem; font-weight:600; }
            .nts-btn:hover { background:var(--glass-hover); border-color:var(--accent-indigo); }
            .nts-btn.danger { color:#ef4444; border-color:rgba(239,68,68,0.3); }
            .nts-btn.danger:hover { background:rgba(239,68,68,0.08); border-color:#ef4444; }
            .nts-id { font-family:var(--font-mono); font-size:0.65rem; }
        </style>

        <div class="nts-shell">
            <div class="nts-topbar">
                <a href="/home" data-link class="nts-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Notes & Captures</span>
                <span style="flex:1;"></span>
                <a href="/mind" data-link style="font-size:0.78rem;color:var(--text-secondary);text-decoration:none;padding:4px 10px;">→ Mind graph</a>
            </div>

            <div class="nts-main">
                <div class="nts-hero">
                    <h1>📝 Notes & captures</h1>
                    <p>Tot el que has capturat amb el FAB (➕ flotant). Pots evolucionar qualsevol nota a <strong>projecte</strong>, <strong>work order</strong> o <strong>deliverable</strong> · o eliminar-la si ja no serveix.</p>
                </div>

                <div class="nts-tabs" role="tablist">
                    ${CAPTURE_TYPES.map(c => {
                        const cnt = (byType[c.id] || []).length;
                        const isActive = c.id === active.id;
                        return `<a href="/notes?type=${c.id}" data-link class="nts-tab ${isActive ? 'active' : ''}" role="tab" aria-selected="${isActive}">
                            ${c.icon} ${c.label} <span class="cnt">${cnt}</span>
                        </a>`;
                    }).join('')}
                </div>

                ${activeNodes.length === 0
                    ? `<div class="nts-empty">
                        ${active.icon} Cap ${active.label.toLowerCase()} encara · usa el FAB (➕) per a capturar la primera.
                    </div>`
                    : `<div class="nts-list">${activeNodes.map(n => this._renderNoteCard(n, active)).join('')}</div>`}
            </div>
        </div>`;
    }

    _renderNoteCard(node, type) {
        const text = (node.content?.text || node.content?.body || node.content?.note || '').toString();
        const projectId = node.content?.projectId || null;
        const time = node.createdAt ? new Date(node.createdAt).toLocaleString() : '—';
        const id = node.id || '?';
        return `
        <article class="nts-card" style="border-left-color:${type.color};" data-node-id="${this._esc(id)}">
            <div class="nts-card-head">
                <span>${type.icon} ${time}${projectId ? ' · projecte ' + this._esc(projectId.slice(0, 12)) + '…' : ' · global'}</span>
                <span class="nts-id">${this._esc(id.slice(0, 18))}</span>
            </div>
            <div class="nts-card-body">${this._esc(text || '(sense text)')}</div>
            <div class="nts-card-actions">
                <a href="/n/${encodeURIComponent(id)}" data-link class="nts-btn">🔍 Veure</a>
                <button class="nts-btn" data-action="evolve-to" data-target="project" data-id="${this._esc(id)}" title="Crear un projecte a partir d'aquesta nota">🚀 → Projecte</button>
                <button class="nts-btn" data-action="evolve-to" data-target="work_order" data-id="${this._esc(id)}" title="Crear un WO al kanban">✅ → WO</button>
                <button class="nts-btn" data-action="evolve-to" data-target="deliverable" data-id="${this._esc(id)}" title="Convertir en deliverable">🚚 → Deliverable</button>
                <button class="nts-btn danger" data-action="delete-note" data-id="${this._esc(id)}" title="Eliminar nota">🗑</button>
            </div>
        </article>`;
    }

    async _evolveTo(btn) {
        const target = btn.dataset.target;
        const id = btn.dataset.id;
        if (!target || !id) return;
        // Carregar el node original
        let node = null;
        try { node = await KB.getNode(id); } catch (_) {}
        if (!node) {
            const { toast } = await import('../core/uxComponents.js');
            toast({ kind: 'error', text: 'Nota no trobada' });
            return;
        }
        const text = (node.content?.text || node.content?.body || '').slice(0, 100);

        if (target === 'project') {
            // Deeplink al nou /create amb nom pre-omplert
            const name = text.split('\n')[0].slice(0, 80) || 'Projecte des de nota';
            const url = '/create?name=' + encodeURIComponent(name) + '&description=' + encodeURIComponent(text);
            window.location.href = url;
            return;
        }

        if (target === 'work_order') {
            // Crear WO al kanban (status backlog) · projectId opcional
            const woId = 'wo-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
            const wo = {
                id:        woId,
                type:      'work_order',
                projectId: node.content?.projectId || null,
                content: {
                    title:        text.split('\n')[0].slice(0, 80) || 'WO des de nota',
                    description:  text,
                    status:       'backlog',
                    assignee:     { kind: 'human', id: 'pending' },
                    source:       { fromNoteId: id, evolvedAt: Date.now() },
                },
                keywords: ['type:work_order', 'source:note-evolve', 'fromNoteId:' + id],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            try {
                await KB.upsert(wo);
                const { toast } = await import('../core/uxComponents.js');
                toast({ kind: 'success', text: '✓ WO creada · ' + woId.slice(0, 16) });
                setTimeout(() => { window.location.href = '/kanban'; }, 800);
            } catch (e) {
                const { toast } = await import('../core/uxComponents.js');
                toast({ kind: 'error', text: 'Error · ' + (e?.message || e) });
            }
            return;
        }

        if (target === 'deliverable') {
            const delivId = 'deliv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
            const deliv = {
                id:        delivId,
                type:      'deliverable',
                projectId: node.content?.projectId || null,
                content: {
                    name:        text.split('\n')[0].slice(0, 80) || 'Deliverable des de nota',
                    description: text,
                    status:      'draft',
                    source:      { fromNoteId: id, evolvedAt: Date.now() },
                },
                keywords: ['type:deliverable', 'source:note-evolve', 'fromNoteId:' + id],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            try {
                await KB.upsert(deliv);
                const { toast } = await import('../core/uxComponents.js');
                toast({ kind: 'success', text: '✓ Deliverable creat · ' + delivId.slice(0, 16) });
            } catch (e) {
                const { toast } = await import('../core/uxComponents.js');
                toast({ kind: 'error', text: 'Error · ' + (e?.message || e) });
            }
        }
    }

    async _deleteNote(btn) {
        const id = btn.dataset.id;
        if (!id) return;
        const { confirm, toast } = await import('../core/uxComponents.js');
        const ok = await confirm({
            title: 'Eliminar nota',
            body:  'Aquesta acció és irreversible · la nota desapareixerà del KB local.',
            confirmLabel: 'Sí · eliminar',
            danger: true,
        });
        if (!ok) return;
        try {
            await KB.delete(id);
            toast({ kind: 'success', text: '✓ Nota eliminada' });
            setTimeout(() => this.render(), 400);
        } catch (e) {
            toast({ kind: 'error', text: 'Error · ' + (e?.message || e) });
        }
    }

    _esc(s) {
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    destroy() {}
}

export { TPL_VERSION, CAPTURE_TYPES };
