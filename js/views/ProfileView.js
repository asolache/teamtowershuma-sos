// =============================================================================
// TEAMTOWERS SOS V11 — PROFILE VIEW (PROFILE sprint A)
// Ruta · /js/views/ProfileView.js  →  /u/{handle}
//
// Perfil públic d'usuari · skills + roles + projects + attestations +
// trust score + offerings al market + badges. Shareable amb OG meta.
// =============================================================================

import { KB } from '../core/kb.js';
import {
    buildPublicProfile, computeProfileBadges, shareUrlForProfile,
    normalizeHandle,
} from '../core/profileService.js';

const AVAIL_META = {
    'normal':       { color: '#22c55e', icon: '✓',  label: 'Disponible' },
    'limited':      { color: '#facc15', icon: '⏰', label: 'Limitada' },
    'off':          { color: '#94a3b8', icon: '⏸',  label: 'Pausa' },
};

const TIER_META = {
    master:        { color: '#a855f7', icon: '🏆' },
    practitioner:  { color: '#3b82f6', icon: '⚙' },
    foundation:    { color: '#94a3b8', icon: '·' },
};

export default class ProfileView {

    constructor() {
        document.title = 'Perfil · SOS V11';
        try {
            const path = window.location.pathname || '';
            const m = path.match(/^\/u\/([^\/]+)/);
            this.handle = m ? normalizeHandle(decodeURIComponent(m[1])) : null;
        } catch (_) { this.handle = null; }
        this.profile = null;
    }

    async getHtml() {
        if (!this.handle) return this._htmlNotFound('Sense handle al URL');
        const [members, projects, roles, attestations, marketItems, workshops, sops] = await Promise.all([
            KB.query({ type: 'matriu_member' }).catch(() => []),
            KB.query({ type: 'project'       }).catch(() => []),
            KB.query({ type: 'role'          }).catch(() => []),
            KB.query({ type: 'attestation'   }).catch(() => []),
            KB.query({ type: 'market_item'   }).catch(() => []),
            KB.query({ type: 'workshop'      }).catch(() => []),
            KB.query({ type: 'sop'           }).catch(() => []),
        ]);
        // Project nodes can also come from store · KB.query covers permaweb-published ones
        // For roles, also include 'cohort_manager' kind (created by maxProjectBootstrap)
        this.profile = buildPublicProfile({
            handle: this.handle,
            members: members || [],
            projects: projects || [],
            roles: roles || [],
            attestations: attestations || [],
            marketItems: marketItems || [],
            workshops: workshops || [],
            sops: sops || [],
        });
        return this._htmlMain();
    }

    async afterRender() {
        if (!this.profile) return;
        this._injectOG();
        this._bindShare();
    }

    _htmlNotFound(reason) {
        return `<div style="min-height:100dvh;background:var(--bg-dark);color:var(--text-main);font-family:var(--font-base);padding:2rem;">
            <div style="max-width:600px;margin:4rem auto;text-align:center;background:var(--bg-panel);padding:2rem;border-radius:8px;border:1px solid var(--border-default);">
                <h1>⚠ Perfil</h1>
                <p>${this._esc(reason || 'desconegut')}</p>
                <a href="/dashboard" data-link style="color:var(--accent-indigo);">← Dashboard</a>
            </div></div>`;
    }

    _injectOG() {
        try {
            const p = this.profile;
            const og = {
                title: (p.displayName + ' · Perfil SOS').slice(0, 70),
                description: (p.bio || (p.stats.skills + ' skills · ' + p.stats.projects + ' projects · ' + p.stats.offerings + ' offerings')).slice(0, 200),
                url: window.location.origin + '/u/' + encodeURIComponent(p.handle),
                image: p.avatar || null,
            };
            document.querySelectorAll('meta[data-prof-og="1"]').forEach(m => m.remove());
            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
            const tags = [
                `<meta property="og:title" content="${esc(og.title)}">`,
                `<meta property="og:description" content="${esc(og.description)}">`,
                `<meta property="og:type" content="profile">`,
                `<meta property="og:url" content="${esc(og.url)}">`,
                og.image ? `<meta property="og:image" content="${esc(og.image)}">` : '',
                `<meta name="twitter:card" content="${og.image ? 'summary_large_image' : 'summary'}">`,
                `<meta name="twitter:title" content="${esc(og.title)}">`,
                `<meta name="twitter:description" content="${esc(og.description)}">`,
            ];
            const tmp = document.createElement('div');
            tmp.innerHTML = tags.filter(Boolean).join('\n');
            Array.from(tmp.children).forEach(node => {
                node.setAttribute('data-prof-og', '1');
                document.head.appendChild(node);
            });
            document.title = og.title;
        } catch (_) {}
    }

    _bindShare() {
        const btn = document.getElementById('profShare');
        if (!btn) return;
        btn.addEventListener('click', async () => {
            const url = shareUrlForProfile(this.profile, { absoluteUrl: window.location.origin });
            if (navigator.share) {
                try { await navigator.share({ title: this.profile.displayName, text: this.profile.bio, url }); return; } catch (_) {}
            }
            try {
                await navigator.clipboard.writeText(url);
                btn.textContent = '✓ Enllaç copiat';
                setTimeout(() => { btn.textContent = '🔗 Compartir'; }, 2000);
            } catch (_) { window.prompt('Compartir', url); }
        });
    }

    _htmlMain() {
        const p = this.profile;
        const badges = computeProfileBadges(p);
        const av = AVAIL_META[p.availability] || AVAIL_META.normal;
        const trust = p.trustScore;

        // Hero
        const avatarHtml = p.avatar
            ? `<img src="${this._esc(p.avatar)}" alt="${this._esc(p.displayName)}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid ${av.color};">`
            : `<div style="width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#a855f7);display:flex;align-items:center;justify-content:center;font-size:2.5rem;font-weight:700;color:#fff;border:3px solid ${av.color};">${this._esc(p.displayName.slice(0, 1).toUpperCase())}</div>`;

        const ghost = !p.exists
            ? `<div style="background:#facc1520;border:1px solid #facc1550;border-radius:6px;padding:8px 12px;margin:8px 0;font-size:0.82rem;">
                ⚠ Aquest handle no té node <code>matriu_member</code> registrat encara. Mostrant agregació de mencions al sistema.
              </div>`
            : '';

        // Skills grouped by tier
        const skillsByTier = { master: [], practitioner: [], foundation: [] };
        for (const s of p.skills) {
            (skillsByTier[s.tier] || skillsByTier.foundation).push(s);
        }
        const skillsHtml = p.skills.length === 0
            ? '<div class="prof-empty">Sense skills declarats o derivats encara.</div>'
            : ['master', 'practitioner', 'foundation'].map(tier => {
                const list = skillsByTier[tier];
                if (!list.length) return '';
                const tm = TIER_META[tier];
                return `<div style="margin-bottom:0.8rem;">
                    <div style="font-size:0.75rem;color:${tm.color};font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;font-family:var(--font-mono);">${tm.icon} ${tier} · ${list.length}</div>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;">
                        ${list.map(s => `<span class="prof-skill-chip" style="border-color:${tm.color}50;color:${tm.color};" title="${this._esc(s.domain)} · ${s.source}">${this._esc(s.label)}</span>`).join('')}
                    </div>
                </div>`;
            }).join('');

        // Projects
        const projectsHtml = p.projects.length === 0
            ? '<div class="prof-empty">Cap projecte creat encara.</div>'
            : p.projects.map(pr => `<a href="/project/${encodeURIComponent(pr.id)}" data-link class="prof-card-link">
                <div class="prof-card">
                    <div style="font-weight:700;">🏢 ${this._esc(pr.name)}</div>
                    <div class="prof-card-meta">${this._esc(pr.role)}${pr.sectorId ? ' · sector ' + this._esc(pr.sectorId) : ''}${pr.cohortNumber ? ' · cohort ' + pr.cohortNumber : ''}</div>
                </div>
              </a>`).join('');

        // Offerings (market entries)
        const offeringsHtml = p.offerings.length === 0
            ? '<div class="prof-empty">Cap oferta al market encara. Pots publicar SOPs o crear market_items.</div>'
            : p.offerings.slice(0, 6).map(o => `<a href="/market/${encodeURIComponent(o.id)}" data-link class="prof-card-link">
                <div class="prof-card">
                    <div style="font-weight:700;">${this._esc(o.title)}</div>
                    <div class="prof-card-meta">
                        <span style="color:#86efac;">${this._esc(o.kind)}</span>
                        ${o.priceEur != null ? ' · ' + o.priceEur + ' €' : ''}
                        <span style="color:var(--text-muted);"> · ${this._esc(o.sourceType)}</span>
                    </div>
                </div>
              </a>`).join('') + (p.offerings.length > 6 ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">+ ${p.offerings.length - 6} més…</div>` : '');

        // Roles
        const rolesHtml = p.roles.length === 0
            ? '<div class="prof-empty">Cap role assignat.</div>'
            : p.roles.slice(0, 10).map(r => `<div class="prof-card">
                <div style="font-weight:700;">🧑‍💼 ${this._esc(r.label)}</div>
                <div class="prof-card-meta">${r.primarySkillId ? 'skill · ' + this._esc(r.primarySkillId) : ''}${r.projectId ? ' · projecte ' + this._esc(r.projectId.slice(0, 16)) + '…' : ''}</div>
            </div>`).join('') + (p.roles.length > 10 ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">+ ${p.roles.length - 10} més…</div>` : '');

        // Attestations summary
        const attRcvHtml = p.attestationsReceived.length === 0
            ? '<div class="prof-empty">Cap attestation rebuda encara.</div>'
            : p.attestationsReceived.slice(0, 5).map(a => {
                const c = a.content || {};
                return `<div class="prof-card">
                    <div style="font-weight:700;font-size:0.82rem;">🤝 ${this._esc(c.attestationKind || 'attestation')}</div>
                    <div class="prof-card-meta">de <code>${this._esc((c.attesterHandle || c.attesterDid || '?').slice(0, 24))}</code>${c.statement ? ' · "' + this._esc(String(c.statement).slice(0, 60)) + '…"' : ''}</div>
                </div>`;
            }).join('');

        // Badges
        const badgesHtml = badges.length === 0 ? '' : `<div class="prof-badges">
            ${badges.map(b => `<span class="prof-badge" style="border-color:${b.color}50;color:${b.color};background:${b.color}15;" title="${this._esc(b.description)}">${b.icon} ${this._esc(b.label)}</span>`).join('')}
        </div>`;

        return `
        <style>
            .prof-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); }
            .prof-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-wrap:wrap; }
            .prof-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .prof-logo span { color:var(--accent-indigo); }
            .prof-hero { background:linear-gradient(135deg,rgba(99,102,241,0.18),rgba(168,85,247,0.10)); padding:2rem 1.5rem; border-bottom:1px solid var(--border-default); }
            .prof-hero-inner { max-width:980px; margin:0 auto; display:flex; gap:1.4rem; align-items:center; flex-wrap:wrap; }
            .prof-name { margin:0; font-size:1.8rem; line-height:1.1; }
            .prof-handle { color:var(--text-secondary); font-size:1rem; font-family:var(--font-mono); margin-top:2px; }
            .prof-bio { margin-top:0.6rem; color:var(--text-secondary); line-height:1.55; max-width:600px; }
            .prof-avail-pill { display:inline-flex; gap:4px; align-items:center; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:700; font-family:var(--font-mono); margin-top:8px; }
            .prof-main { max-width:980px; margin:0 auto; padding:1.5rem; display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
            @media (max-width:780px) { .prof-main { grid-template-columns:1fr; } }
            .prof-card-section { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem 1.2rem; }
            .prof-card-section h3 { margin:0 0 0.8rem 0; font-size:0.95rem; }
            .prof-card { background:#0008; border:1px solid var(--border-default); border-radius:5px; padding:8px 12px; margin-bottom:6px; }
            .prof-card-link { text-decoration:none; color:inherit; display:block; }
            .prof-card-link:hover .prof-card { background:var(--glass-hover); }
            .prof-card-meta { font-size:11px; color:var(--text-muted); margin-top:3px; font-family:var(--font-mono); }
            .prof-empty { font-size:0.82rem; color:var(--text-muted); font-style:italic; padding:0.4rem 0; }
            .prof-skill-chip { display:inline-block; background:transparent; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:600; font-family:var(--font-mono); border:1px solid; }
            .prof-stats { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin:1rem 0; max-width:980px; padding:0 1.5rem; }
            @media (max-width:680px) { .prof-stats { grid-template-columns:repeat(3,1fr); } }
            .prof-stat { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:6px; padding:10px; text-align:center; }
            .prof-stat-num { display:block; font-size:1.4rem; font-weight:700; font-family:var(--font-mono); }
            .prof-stat-lbl { display:block; font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-top:2px; }
            .prof-badges { display:flex; flex-wrap:wrap; gap:6px; margin-top:0.8rem; }
            .prof-badge { display:inline-flex; gap:4px; align-items:center; padding:4px 10px; border-radius:999px; border:1px solid; font-size:11px; font-weight:700; font-family:var(--font-mono); }
            .prof-btn { padding:8px 14px; border-radius:4px; border:1px solid var(--accent-indigo); background:var(--accent-indigo); color:#fff; font-size:0.82rem; font-weight:600; cursor:pointer; text-decoration:none; }
            .prof-btn-secondary { background:transparent; color:var(--accent-indigo); }
            .prof-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:0.6rem; }
        </style>
        <div class="prof-shell">
            <div class="prof-topbar">
                <a href="/dashboard" data-link class="prof-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Perfil públic</span>
                <span style="flex:1;"></span>
                <a href="/market" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">🛒 Mercat</a>
                <a href="/dashboard" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">← Dashboard</a>
            </div>
            <div class="prof-hero">
                <div class="prof-hero-inner">
                    ${avatarHtml}
                    <div style="flex:1;min-width:240px;">
                        <h1 class="prof-name">${this._esc(p.displayName)}</h1>
                        <div class="prof-handle">@${this._esc(p.handle)}${p.cohortNumber ? ' · cohort ' + p.cohortNumber : ''}</div>
                        ${p.bio ? `<p class="prof-bio">${this._esc(p.bio)}</p>` : ''}
                        <div class="prof-avail-pill" style="background:${av.color}25;color:${av.color};">${av.icon} ${av.label}</div>
                        ${badgesHtml}
                        <div class="prof-actions">
                            <button class="prof-btn prof-btn-secondary" id="profShare">🔗 Compartir</button>
                            ${p.memberNodeId ? `<a href="/n/${encodeURIComponent(p.memberNodeId)}" data-link class="prof-btn prof-btn-secondary">🔬 Node KB</a>` : ''}
                        </div>
                    </div>
                </div>
            </div>
            ${ghost}
            <div class="prof-stats">
                <div class="prof-stat"><span class="prof-stat-num">${p.stats.skills}</span><span class="prof-stat-lbl">Skills</span></div>
                <div class="prof-stat" style="color:#86efac;"><span class="prof-stat-num">${p.stats.projects}</span><span class="prof-stat-lbl">Projectes</span></div>
                <div class="prof-stat" style="color:#a5b4fc;"><span class="prof-stat-num">${p.stats.roles}</span><span class="prof-stat-lbl">Roles</span></div>
                <div class="prof-stat" style="color:#fb923c;"><span class="prof-stat-num">${p.stats.offerings}</span><span class="prof-stat-lbl">Ofertes</span></div>
                <div class="prof-stat" style="color:${trust.color || '#94a3b8'};"><span class="prof-stat-num">${trust.icon || '·'} ${trust.total.toFixed(1)}</span><span class="prof-stat-lbl">Trust score</span></div>
            </div>
            <div class="prof-main">
                <div class="prof-card-section">
                    <h3>🎯 Skills · ${p.skills.length}</h3>
                    ${skillsHtml}
                </div>
                <div class="prof-card-section">
                    <h3>🏢 Projectes · ${p.projects.length}</h3>
                    ${projectsHtml}
                </div>
                <div class="prof-card-section">
                    <h3>🛒 Ofertes al mercat · ${p.offerings.length}</h3>
                    ${offeringsHtml}
                </div>
                <div class="prof-card-section">
                    <h3>🤝 Trust · ${p.attestationsReceived.length} attestations rebudes · ${p.attestationsSent.length} emeses</h3>
                    ${attRcvHtml}
                </div>
                ${p.roles.length > 0 ? `<div class="prof-card-section" style="grid-column:1/-1;">
                    <h3>🧑‍💼 Roles assignats · ${p.roles.length}</h3>
                    ${rolesHtml}
                </div>` : ''}
            </div>
        </div>`;
    }

    _esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
