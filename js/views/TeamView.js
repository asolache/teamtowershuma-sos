// =============================================================================
// TEAMTOWERS SOS V11 — v140 · TEAM VIEW · vista GLOBAL del swarm
// Ruta · /js/views/TeamView.js  →  /team
//
// Vista doble dimensió (cf · wo-team-permissions-view) ·
//   · Aquí · vista GLOBAL · totes les persones amb qui he col·laborat ·
//     llistat per projecte · filter per skill · audit log cross-projects
//   · La per-projecte viu al Project Hub V2 · subtab Equip
//
// Usa · js/core/teamService.js (membres + invitations + audit + RBAC) +
//       js/ui/SubmenuTabs.js (canonical submenu pattern).
// =============================================================================

import { listMembers, listInvitations, listAuditLog, ROLE_CATALOG, ACTION_CATALOG, can } from '../core/teamService.js';
import { renderSubmenuTabs, bindSubmenuTabs, getActiveTabFromUrl } from '../ui/SubmenuTabs.js';
import { store } from '../core/store.js';

const TPL_VERSION = 'team-view-v140';

const TEAM_TABS = Object.freeze([
    { id: 'overview',    label: 'Visió global',  icon: '🧬' },
    { id: 'projects',    label: 'Per projecte',  icon: '📂' },
    { id: 'roles',       label: 'Rols',          icon: '🤲' },
    { id: 'permissions', label: 'Permisos',      icon: '🔐' },
    { id: 'audit',       label: 'Audit log',     icon: '📜' },
]);
const VALID = new Set(TEAM_TABS.map(t => t.id));

export default class TeamView {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Equip · SOS';
        const t = getActiveTabFromUrl('tab', 'overview');
        this._mode = VALID.has(t) ? t : 'overview';
        this._cleanup = null;
    }

    async getHtml() { return this._renderShell(); }

    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    async afterRender() {
        const mount = document.getElementById('teamSubmenu');
        if (mount) {
            this._cleanup = bindSubmenuTabs(mount, (newId) => {
                if (!VALID.has(newId) || newId === this._mode) return;
                this._mode = newId;
                this.render();
            }, { urlParam: 'tab' });
        }
        await this._hydrateBody();
    }

    destroy() { try { this._cleanup?.(); } catch (_) {} }

    _renderShell() {
        return `
        <div style="max-width:1100px;margin:0 auto;padding:20px;font-family:var(--font-base);color:var(--text-main);">
            <div style="margin-bottom:14px;">
                <h1 style="margin:0 0 4px;font-size:1.5rem;">👥 Equip · vista global</h1>
                <div style="color:var(--text-muted);font-size:0.85rem;">Persones del swarm SOS amb qui has col·laborat · rols i permisos cross-projects · audit log.</div>
            </div>

            <div id="teamSubmenu" style="border:1px solid var(--border-default);border-radius:var(--radius-md);overflow:hidden;background:var(--bg-panel);margin-bottom:14px;">
                ${renderSubmenuTabs({ tabs: TEAM_TABS, activeId: this._mode, urlParam: 'tab' })}
            </div>

            <div id="teamBody" style="min-height:300px;">
                <div style="color:var(--text-muted);text-align:center;padding:2rem;">Carregant…</div>
            </div>
        </div>`;
    }

    async _hydrateBody() {
        const body = document.getElementById('teamBody');
        if (!body) return;
        try {
            if (this._mode === 'overview')    body.innerHTML = await this._renderOverview();
            else if (this._mode === 'projects')   body.innerHTML = await this._renderPerProject();
            else if (this._mode === 'roles')      body.innerHTML = this._renderRoles();
            else if (this._mode === 'permissions')body.innerHTML = this._renderPermissionsMatrix();
            else if (this._mode === 'audit')      body.innerHTML = await this._renderAuditLog();
        } catch (e) {
            body.innerHTML = `<div style="color:var(--accent-red);padding:1rem;">Error · ${this._esc(e?.message || String(e))}</div>`;
        }
    }

    // ─── Overview · agregat cross-projects ──────────────────────────────
    async _renderOverview() {
        const projects = store.getState()?.projects || [];
        const byDid = new Map();
        for (const p of projects) {
            const r = await listMembers({ projectId: p.id });
            for (const m of (r.members || [])) {
                const k = m.did;
                if (!byDid.has(k)) byDid.set(k, { did: m.did, name: m.name, email: m.email, projects: [], roles: new Set() });
                const agg = byDid.get(k);
                agg.projects.push(p.id);
                agg.roles.add(m.role);
            }
        }
        const list = Array.from(byDid.values()).sort((a, b) => b.projects.length - a.projects.length);
        if (list.length === 0) {
            return `<div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:24px;text-align:center;color:var(--text-muted);">
                Cap col·laborador encara · convida algú des de qualsevol projecte (subtab Equip → Convidacions).
            </div>`;
        }
        const rows = list.map(p => `
            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px 14px;display:flex;justify-content:space-between;align-items:center;border-left:3px solid var(--accent-indigo);">
                <div>
                    <strong>${this._esc(p.name || p.did)}</strong>
                    <div style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-muted);margin-top:2px;">${this._esc(p.did)}${p.email ? ' · ' + this._esc(p.email) : ''}</div>
                </div>
                <div style="text-align:right;">
                    <div style="color:var(--accent-indigo);font-weight:700;">${p.projects.length} projecte${p.projects.length === 1 ? '' : 's'}</div>
                    <div style="font-size:0.72rem;color:var(--text-muted);">${Array.from(p.roles).join(' · ')}</div>
                </div>
            </div>`).join('');
        return `<div style="display:grid;gap:10px;">
            <div style="color:var(--text-muted);font-size:0.85rem;">${list.length} persona${list.length === 1 ? '' : 's'} al teu swarm</div>
            ${rows}
        </div>`;
    }

    // ─── Per projecte · llistat detallat ────────────────────────────────
    async _renderPerProject() {
        const projects = store.getState()?.projects || [];
        if (projects.length === 0) return '<p style="color:var(--text-muted);">Encara no tens projectes.</p>';
        const blocks = [];
        for (const p of projects) {
            const r = await listMembers({ projectId: p.id });
            const inv = await listInvitations({ projectId: p.id });
            const members = r.members || [];
            const invitations = inv.invitations || [];
            const projName = p.name || p.nombre || p.id;
            blocks.push(`
                <div style="background:var(--bg-panel);border:1px solid var(--border-default);border-radius:var(--radius-md);padding:14px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <h3 style="margin:0;font-size:1rem;">${this._esc(projName)}</h3>
                        <a href="/project/${encodeURIComponent(p.id)}?tab=equip" data-link style="color:var(--accent-indigo);font-size:0.85rem;text-decoration:none;">Obre l'equip del projecte →</a>
                    </div>
                    <div style="color:var(--text-muted);font-size:0.78rem;margin-bottom:8px;">${members.length} membre${members.length === 1 ? '' : 's'} · ${invitations.length} invitació${invitations.length === 1 ? '' : 's'} pendent${invitations.length === 1 ? '' : 's'}</div>
                    ${members.length === 0
                        ? '<div style="color:var(--text-muted);font-size:0.85rem;font-style:italic;">Cap membre encara.</div>'
                        : `<div style="display:flex;flex-wrap:wrap;gap:6px;">${members.map(m => `
                            <span style="background:var(--bg-elevated);border-radius:999px;padding:4px 12px;font-size:0.78rem;">
                                ${this._esc(m.name || m.did.split(':').pop())} · <code style="color:var(--accent-purple);">${this._esc(m.role)}</code>
                            </span>`).join('')}</div>`}
                </div>`);
        }
        return `<div style="display:grid;gap:10px;">${blocks.join('')}</div>`;
    }

    // ─── Rols · catàleg canonical ───────────────────────────────────────
    _renderRoles() {
        const rows = Object.values(ROLE_CATALOG).map(r => `
            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px;border-left:3px solid var(--accent-indigo);">
                <div style="display:flex;justify-content:space-between;align-items:baseline;">
                    <strong>${this._esc(r.label)}</strong>
                    <code style="font-size:0.75rem;color:var(--text-muted);">${this._esc(r.id)}</code>
                </div>
                <div style="color:var(--text-secondary);font-size:0.85rem;margin-top:4px;">${this._esc(r.desc)}</div>
                <div style="font-family:var(--font-mono);font-size:0.78rem;color:var(--accent-green);margin-top:6px;">can · ${this._esc((r.can || []).join(' · ') || '—')}</div>
            </div>`).join('');
        return `<div style="display:grid;gap:8px;">
            <div style="color:var(--text-muted);font-size:0.85rem;">5 rols canonical · personalitzable per projecte a v141+</div>
            ${rows}
        </div>`;
    }

    // ─── Permisos · matriu rol × acció (RBAC) ───────────────────────────
    _renderPermissionsMatrix() {
        const roles = Object.values(ROLE_CATALOG);
        const head = `<tr style="background:var(--bg-panel);">
            <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--border-default);">Permís</th>
            ${roles.map(r => `<th style="padding:10px 12px;border-bottom:1px solid var(--border-default);">${this._esc(r.label)}</th>`).join('')}
        </tr>`;
        const rows = ACTION_CATALOG.map(action => {
            const cells = roles.map(r => {
                const yes = can({ role: r.id, action });
                const hint = (r.can || []).some(p => p.endsWith('.own') && action.startsWith(p.slice(0, -4))) ? '✓ (own)' : (yes ? '✓' : '–');
                return `<td style="text-align:center;padding:8px 12px;border-bottom:1px solid var(--border-default);${yes ? 'color:var(--accent-green);font-weight:700;' : 'color:var(--text-muted);'}">${this._esc(hint)}</td>`;
            }).join('');
            return `<tr><td style="padding:8px 12px;border-bottom:1px solid var(--border-default);"><code>${this._esc(action)}</code></td>${cells}</tr>`;
        }).join('');
        return `<div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.85rem;background:var(--bg-elevated);border-radius:var(--radius-md);overflow:hidden;">
                <thead>${head}</thead>
                <tbody>${rows}</tbody>
            </table>
            </div>
            <p style="color:var(--text-muted);font-size:0.78rem;margin-top:10px;">RBAC base · accions <code>.own</code> requereixen actor==owner. Custom roles + per-WO overrides · v141+.</p>`;
    }

    // ─── Audit log · cross-projects ─────────────────────────────────────
    async _renderAuditLog() {
        const r = await listAuditLog({ limit: 200 });
        const events = r.events || [];
        if (events.length === 0) {
            return `<div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:24px;text-align:center;color:var(--text-muted);">
                Encara no hi ha events d'audit · es registraran automàticament quan afegeixis/treguis membres · canviïs rols · crei invitacions.
            </div>`;
        }
        const rows = events.map(e => {
            const ts = e.ts ? new Date(e.ts).toLocaleString() : '';
            const meta = e.meta ? ' · ' + this._esc(JSON.stringify(e.meta)) : '';
            return `<div style="display:grid;grid-template-columns:160px 1fr;gap:12px;padding:8px 12px;border-bottom:1px solid var(--border-default);font-size:0.85rem;">
                <span style="color:var(--text-muted);font-family:var(--font-mono);font-size:0.75rem;">${this._esc(ts)}</span>
                <span><code style="color:var(--accent-purple);">${this._esc(e.action)}</code> · <strong>${this._esc(e.actor)}</strong>${e.target ? ' → ' + this._esc(e.target) : ''}${e.projectId ? ' <span style="color:var(--text-muted);">(' + this._esc(e.projectId) + ')</span>' : ''}${meta}</span>
            </div>`;
        }).join('');
        return `<div style="background:var(--bg-elevated);border-radius:var(--radius-md);overflow:hidden;">
            <div style="padding:10px 14px;background:var(--bg-panel);border-bottom:1px solid var(--border-default);font-size:0.85rem;color:var(--text-muted);">${events.length} event${events.length === 1 ? '' : 's'} · més recents primer</div>
            ${rows}
        </div>`;
    }

    _esc(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
}

export { TPL_VERSION };
