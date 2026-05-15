// =============================================================================
// TEAMTOWERS SOS V11 — INBOX VIEW (SOCIAL-LAYER-001 sprint inbox)
// Ruta · /js/views/InboxView.js  →  /inbox
//
// Llista de conversacions DM · click obre el thread en chat-style amb
// composer per a respondre. Local-first · descentralitzat.
// =============================================================================

import { KB } from '../core/kb.js';
import {
    listConversations, listThread, buildMessage, markAsRead, countUnread,
} from '../core/messagingService.js';
import { getPresenceFor, renderPresencePill } from '../core/presenceService.js';
import {
    listInvitesForUser, acceptInvite, declineInvite, resolveStatus,
    INVITE_ROLES,
} from '../core/projectInviteService.js';
import { emptyStateHtml, toast } from '../core/uxComponents.js';

export default class InboxView {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Inbox · SOS';
        this._activeThreadId = null;
        this._meHandle = null;
        this._messages = [];
    }

    async getHtml() {
        // Active thread del URL · ?thread=X
        try {
            const url = new URL(window.location.href);
            this._activeThreadId = url.searchParams.get('thread') || null;
        } catch (_) {}

        // Load my handle + all DMs + invites
        const members = await KB.query({ type: 'matriu_member' }).catch(() => []);
        this._meHandle = (members.find(m => m && (m.content?.isPrimary || m.isPrimary))?.content?.handle) || null;
        this._messages = await KB.query({ type: 'direct_message' }).catch(() => []);
        this._invites = await KB.query({ type: 'project_invite' }).catch(() => []);

        if (!this._meHandle) {
            return this._renderNoIdentity();
        }

        const conversations = listConversations(this._messages, this._meHandle);
        const pendingInvites = listInvitesForUser(this._invites, this._meHandle, { onlyPending: true });
        const activeMessages = this._activeThreadId
            ? listThread(this._messages, this._activeThreadId)
            : [];

        return this._renderShell({ conversations, activeMessages, pendingInvites });
    }

    async afterRender() {
        if (!this._meHandle) return;
        this._bindConversations();
        this._bindSend();
        this._bindInviteActions();
        await this._markActiveAsRead();
    }

    _bindInviteActions() {
        document.querySelectorAll('[data-action="invite-accept"]').forEach(btn => {
            btn.addEventListener('click', () => this._acceptInvite(btn.getAttribute('data-id')));
        });
        document.querySelectorAll('[data-action="invite-decline"]').forEach(btn => {
            btn.addEventListener('click', () => this._declineInvite(btn.getAttribute('data-id')));
        });
    }

    async _acceptInvite(inviteId) {
        try {
            const inv = (this._invites || []).find(i => i.id === inviteId);
            if (!inv) throw new Error('Invite not found');
            const updated = acceptInvite(inv, { acceptedByHandle: this._meHandle });
            await KB.upsert(updated);
            toast({ kind: 'success', text: '✓ Has acceptat · ja tens accés al projecte' });
            this.render();
        } catch (e) {
            toast({ kind: 'error', text: 'Error: ' + (e?.message || e) });
        }
    }

    async _declineInvite(inviteId) {
        try {
            const inv = (this._invites || []).find(i => i.id === inviteId);
            if (!inv) throw new Error('Invite not found');
            const updated = declineInvite(inv, { declinedByHandle: this._meHandle });
            await KB.upsert(updated);
            toast({ kind: 'info', text: 'Invitació declinada' });
            this.render();
        } catch (e) {
            toast({ kind: 'error', text: 'Error: ' + (e?.message || e) });
        }
    }

    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    _renderShell({ conversations, activeMessages, pendingInvites = [] }) {
        const unreadTotal = countUnread(this._messages, this._meHandle);
        const inviteCount = pendingInvites.length;
        return `
        <style>
            .ibx-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); padding-bottom:2rem; }
            .ibx-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); }
            .ibx-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .ibx-logo span { color:var(--accent-indigo); }
            .ibx-main { max-width:1100px; margin:0 auto; padding:1rem; display:grid; grid-template-columns:320px 1fr; gap:1rem; }
            @media (max-width: 768px) { .ibx-main { grid-template-columns:1fr; padding:0.6rem; gap:0.6rem; } }

            .ibx-section { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; }
            .ibx-section-head { padding:0.8rem 1rem; border-bottom:1px solid var(--border-default); display:flex; justify-content:space-between; align-items:center; }
            .ibx-section-head h2 { margin:0; font-size:0.95rem; }
            .ibx-section-head .badge { background:rgba(99,102,241,0.18); color:#a8b2ff; padding:1px 8px; border-radius:999px; font-size:0.7rem; font-weight:700; }

            .ibx-conv-list { max-height:65vh; overflow-y:auto; }
            .ibx-conv-item { display:block; padding:0.8rem 1rem; border-bottom:1px solid var(--border-default); text-decoration:none; color:var(--text-main); cursor:pointer; transition:background 100ms; }
            .ibx-conv-item:hover { background:var(--glass-hover); }
            .ibx-conv-item.active { background:rgba(99,102,241,0.18); }
            .ibx-conv-head { display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:3px; }
            .ibx-conv-handle { font-weight:700; font-size:0.88rem; }
            .ibx-conv-time { font-size:0.7rem; color:var(--text-secondary); }
            .ibx-conv-preview { font-size:0.78rem; color:var(--text-secondary); overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
            .ibx-conv-unread { background:#a855f7; color:#fff; padding:1px 7px; border-radius:999px; font-size:0.65rem; font-weight:700; }

            .ibx-thread { display:flex; flex-direction:column; height:calc(100vh - 200px); }
            @media (max-width: 768px) { .ibx-thread { height:auto; min-height:50vh; } }
            .ibx-thread-head { padding:0.8rem 1rem; border-bottom:1px solid var(--border-default); display:flex; align-items:center; gap:10px; }
            .ibx-thread-head h2 { margin:0; font-size:0.95rem; flex:1; }
            .ibx-thread-msgs { flex:1; padding:1rem; overflow-y:auto; display:flex; flex-direction:column; gap:0.5rem; }
            .ibx-msg { max-width:75%; padding:8px 12px; border-radius:12px; font-size:0.88rem; line-height:1.45; word-break:break-word; }
            .ibx-msg.in  { background:var(--bg-dark); align-self:flex-start; border-bottom-left-radius:4px; }
            .ibx-msg.out { background:linear-gradient(135deg,#a855f7,#6366f1); color:#fff; align-self:flex-end; border-bottom-right-radius:4px; }
            .ibx-msg-meta { font-size:0.66rem; color:var(--text-muted); margin-top:3px; opacity:0.7; }
            .ibx-msg.out .ibx-msg-meta { color:rgba(255,255,255,0.7); }

            .ibx-composer { padding:0.8rem 1rem; border-top:1px solid var(--border-default); display:flex; gap:8px; align-items:flex-end; }
            .ibx-composer textarea {
                flex:1; min-height:42px; max-height:120px;
                padding:9px 12px; background:var(--bg-dark); color:var(--text-main);
                border:1px solid var(--border-default); border-radius:6px;
                font-family:var(--font-base); font-size:0.88rem; resize:vertical;
            }
            .ibx-composer button {
                padding:9px 16px; border-radius:6px; border:0;
                background:linear-gradient(135deg,#22c55e,#16a34a); color:#fff;
                font-weight:700; cursor:pointer; min-height:40px;
            }
            .ibx-composer button:hover { filter:brightness(1.1); }
        </style>

        <div class="ibx-shell">
            <div class="ibx-topbar">
                <a href="/home" data-link class="ibx-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Inbox</span>
                <span style="flex:1;"></span>
                <a href="/timeline" data-link style="font-size:0.78rem;color:var(--text-secondary);text-decoration:none;padding:4px 10px;">→ Timeline</a>
            </div>

            <div class="ibx-main">
                <div>
                    ${inviteCount > 0 ? `
                    <div class="ibx-section" style="margin-bottom:0.8rem;border-color:rgba(168,85,247,0.4);">
                        <div class="ibx-section-head" style="background:rgba(168,85,247,0.10);">
                            <h2>🤝 Invitacions pendents · ${inviteCount}</h2>
                        </div>
                        <div style="padding:0.5rem 0.6rem;">
                            ${pendingInvites.map(inv => this._renderInviteCard(inv)).join('')}
                        </div>
                    </div>` : ''}
                <div class="ibx-section">
                    <div class="ibx-section-head">
                        <h2>💬 Converses · ${conversations.length}</h2>
                        ${unreadTotal > 0 ? `<span class="badge">${unreadTotal} sense llegir</span>` : ''}
                    </div>
                    <div class="ibx-conv-list">
                        ${conversations.length === 0
                            ? emptyStateHtml({
                                icon: '💌',
                                title: 'Cap conversa encara',
                                body: 'Quan algú et missatgi · apareixerà aquí. Tu pots iniciar conversa des de qualsevol perfil amb "💬 Missatge".',
                                ctaLabel: 'Explorar gent',
                                ctaHref: '/registry',
                            })
                            : conversations.map(c => this._renderConvItem(c)).join('')}
                    </div>
                </div>
                </div>

                <div class="ibx-section">
                    ${this._activeThreadId && activeMessages.length > 0
                        ? this._renderActiveThread(activeMessages)
                        : `<div style="padding:3rem 2rem;text-align:center;color:var(--text-secondary);">
                            ${conversations.length === 0
                                ? '👈 Inicia una conversa visitant un perfil'
                                : '👈 Selecciona una conversa de la columna esquerra'}
                          </div>`}
                </div>
            </div>
        </div>`;
    }

    _renderInviteCard(inv) {
        const c = inv.content;
        const role = INVITE_ROLES[c.role] || INVITE_ROLES.collab;
        const projectId = c.projectId;
        return `
        <div style="padding:0.7rem 0.85rem;margin-bottom:6px;background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.3);border-radius:6px;" data-invite-id="${this._esc(inv.id)}">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <strong style="font-size:0.85rem;">${this._esc(c.fromHandle)}</strong>
                <span style="font-size:0.7rem;color:var(--text-secondary);">· t'ha convidat a</span>
                <a href="/project/${encodeURIComponent(projectId)}" data-link style="font-size:0.75rem;color:var(--accent-indigo);text-decoration:none;font-family:var(--font-mono);">${this._esc(projectId.slice(0, 24))}</a>
            </div>
            <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;">${this._esc(role.label)} · ${this._esc(role.description)}</div>
            ${c.message ? `<div style="padding:6px 8px;background:var(--bg-dark);border-radius:4px;font-size:0.78rem;font-style:italic;margin-bottom:6px;">"${this._esc(c.message)}"</div>` : ''}
            <div style="display:flex;gap:6px;margin-top:6px;">
                <button data-action="invite-accept" data-id="${this._esc(inv.id)}" style="padding:5px 12px;border-radius:4px;border:0;background:#22c55e;color:#fff;font-size:0.78rem;font-weight:700;cursor:pointer;">✓ Accepta</button>
                <button data-action="invite-decline" data-id="${this._esc(inv.id)}" style="padding:5px 12px;border-radius:4px;border:1px solid var(--border-default);background:transparent;color:var(--text-secondary);font-size:0.78rem;font-weight:600;cursor:pointer;">✕ Decline</button>
                <span style="margin-left:auto;font-size:0.68rem;color:var(--text-muted);align-self:center;">${this._formatTime(inv.createdAt)}</span>
            </div>
        </div>`;
    }

    _renderConvItem(c) {
        const peerClean = (c.peerHandle || '').replace(/^@/, '');
        const time = this._formatTime(c.lastMessage?.createdAt);
        const preview = (c.lastMessage?.content?.text || '').slice(0, 80);
        const isMine = c.lastMessage?.content?.fromHandle === this._meHandle;
        const active = this._activeThreadId === c.threadId ? 'active' : '';
        return `
        <div class="ibx-conv-item ${active}" data-thread-id="${this._esc(c.threadId)}" tabindex="0" role="button">
            <div class="ibx-conv-head">
                <span class="ibx-conv-handle">@${this._esc(peerClean)}</span>
                <span class="ibx-conv-time">${this._esc(time)}</span>
            </div>
            <div class="ibx-conv-preview">${isMine ? '↗ ' : ''}${this._esc(preview)}</div>
            ${c.unreadCount > 0 ? `<div style="margin-top:4px;"><span class="ibx-conv-unread">${c.unreadCount} sense llegir</span></div>` : ''}
        </div>`;
    }

    _renderActiveThread(messages) {
        const first = messages[0];
        const peer = first.content.fromHandle === this._meHandle
            ? first.content.toHandle
            : first.content.fromHandle;
        const peerClean = (peer || '').replace(/^@/, '');
        return `
        <div class="ibx-thread">
            <div class="ibx-thread-head">
                <a href="/u/${encodeURIComponent(peerClean)}" data-link style="text-decoration:none;color:var(--accent-indigo);">@${this._esc(peerClean)}</a>
                <h2 style="margin:0;font-size:0.85rem;color:var(--text-secondary);">·</h2>
                <span style="font-size:0.7rem;color:var(--text-secondary);">${messages.length} missatges</span>
            </div>
            <div class="ibx-thread-msgs" id="ibxThreadMsgs">
                ${messages.map(m => this._renderMsg(m)).join('')}
            </div>
            <form class="ibx-composer" id="ibxComposer" data-peer="${this._esc(peer)}">
                <label for="ibxText" class="sr-only">Missatge</label>
                <textarea id="ibxText" placeholder="Escriu missatge..." maxlength="2000" rows="2"></textarea>
                <button type="submit">📨</button>
            </form>
        </div>`;
    }

    _renderMsg(m) {
        const isMine = m.content.fromHandle === this._meHandle;
        const cls = isMine ? 'out' : 'in';
        const time = this._formatTime(m.createdAt);
        return `
        <div class="ibx-msg ${cls}">
            <div>${this._esc(m.content.text)}</div>
            <div class="ibx-msg-meta">${this._esc(time)}${isMine ? ' · ' + this._esc(m.content.status || 'sent') : ''}</div>
        </div>`;
    }

    _renderNoIdentity() {
        return `
        <div style="padding:3rem 1.5rem;text-align:center;font-family:var(--font-base);color:var(--text-main);min-height:100dvh;background:var(--bg-dark);">
            <div style="font-size:3rem;margin-bottom:1rem;">👤</div>
            <h1 style="margin:0 0 0.6rem 0;font-size:1.4rem;">Inbox requereix identitat</h1>
            <p style="color:var(--text-secondary);max-width:420px;margin:0 auto 1.2rem auto;">Crea el teu DID (ECDSA P-256 local-first) per a enviar i rebre missatges descentralitzats.</p>
            <a href="/identity" data-link style="display:inline-block;padding:9px 16px;border-radius:6px;background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;text-decoration:none;font-weight:700;">Crear identitat →</a>
        </div>`;
    }

    _bindConversations() {
        document.querySelectorAll('[data-thread-id]').forEach(item => {
            item.addEventListener('click', () => {
                const tid = item.getAttribute('data-thread-id');
                window.history.pushState({}, '', '/inbox?thread=' + encodeURIComponent(tid));
                this.render();
            });
        });
    }

    _bindSend() {
        const form = document.getElementById('ibxComposer');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const ta = document.getElementById('ibxText');
            const text = (ta?.value || '').trim();
            if (!text) return;
            const peer = form.getAttribute('data-peer');
            if (!peer) return;
            try {
                const msg = buildMessage({ fromHandle: this._meHandle, toHandle: peer, text });
                await KB.upsert(msg);
                if (ta) ta.value = '';
                toast({ kind: 'success', text: '✓ Enviat' });
                this.render();
            } catch (e) {
                toast({ kind: 'error', text: 'Error: ' + (e?.message || e) });
            }
        });
    }

    async _markActiveAsRead() {
        if (!this._activeThreadId) return;
        const messages = listThread(this._messages, this._activeThreadId);
        for (const m of messages) {
            if (m.content.toHandle === this._meHandle && m.content.status !== 'read') {
                try { await KB.upsert(markAsRead(m)); } catch (_) {}
            }
        }
    }

    _formatTime(ts) {
        if (!ts) return '';
        const diff = Date.now() - ts;
        const min = Math.floor(diff / 60000);
        if (min < 1) return 'ara';
        if (min < 60) return min + 'min';
        const hr = Math.floor(min / 60);
        if (hr < 24) return hr + 'h';
        const days = Math.floor(hr / 24);
        if (days < 7) return days + 'd';
        return new Date(ts).toLocaleDateString();
    }

    _esc(s) {
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    destroy() {}
}

export const TPL_VERSION = 'inbox-v1.0';
