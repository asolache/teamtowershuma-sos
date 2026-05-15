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
import {
    IKIGAI_DIMENSIONS, IKIGAI_INTERSECTIONS,
    buildEmptyIkigai, applyIkigaiDimension,
    computeIkigaiCompleteness, computeIntersections,
    applyIkigaiToMember, ikigaiBadge,
} from '../core/ikigaiService.js';
import {
    listPendingCoSignRequests, acceptCoSignRequest,
} from '../core/certificateReportService.js';

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
            const u = new URL(window.location.href);
            this.editIkigai = u.searchParams.get('edit') === 'ikigai';
        } catch (_) { this.handle = null; this.editIkigai = false; }
        this.profile = null;
        this.memberNode = null;
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
        // Keep raw member node for Ikigai edit/persist
        this.memberNode = (members || []).find(m => m && m.id === this.profile.memberNodeId) || null;
        // CERT-001 pas 6 · pending co-sign requests adresses to this user
        this.pendingCoSigns = listPendingCoSignRequests({
            attestations: attestations || [],
            handle:       this.handle,
            did:          this.memberNode?.content?.primaryDid,
        });
        // Read current Ikigai from member node (content.ikigai)
        this.ikigai = (this.memberNode?.content?.ikigai) || buildEmptyIkigai();
        return this._htmlMain();
    }

    async afterRender() {
        if (!this.profile) return;
        this._injectOG();
        this._bindShare();
        this._bindIkigai();
        this._bindCoSignAccept();
        this._bindFollow();
    }

    async _bindFollow() {
        const btn = document.getElementById('profFollow');
        const stats = document.getElementById('profFollowStats');
        if (!btn) return;
        const targetHandle = btn.getAttribute('data-follow-handle');

        // Load my handle + attestations
        const { KB } = await import('../core/kb.js');
        const {
            isFollowing, followCounts, buildFollowAttestation,
        } = await import('../core/socialGraphService.js');
        const { toast } = await import('../core/uxComponents.js');

        const [members, attestations] = await Promise.all([
            KB.query({ type: 'matriu_member' }).catch(() => []),
            KB.query({ type: 'attestation' }).catch(() => []),
        ]);
        const meHandle = (members.find(m => m && (m.content?.isPrimary || m.isPrimary))?.content?.handle) || null;

        // Update stats
        const counts = followCounts({ handle: '@' + targetHandle.replace(/^@/, ''), attestations });
        if (stats) stats.textContent = counts.followers + ' followers · ' + counts.following + ' following';

        if (!meHandle) {
            btn.textContent = '👤 Crea identitat per a seguir';
            btn.disabled = true;
            btn.style.opacity = '0.6';
            btn.addEventListener('click', () => {
                window.location.href = '/identity';
            });
            return;
        }

        // Self?
        if (meHandle.replace(/^@/, '') === targetHandle.replace(/^@/, '')) {
            btn.textContent = '👤 El teu perfil';
            btn.disabled = true;
            btn.style.opacity = '0.7';
            return;
        }

        const alreadyFollowing = isFollowing(meHandle, targetHandle, attestations);
        btn.textContent = alreadyFollowing ? '✓ Following · click per a unfollow' : '+ Follow';
        btn.disabled = false;

        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.textContent = '⏳ Processing...';
            try {
                if (alreadyFollowing) {
                    // Find + delete the follow attestation
                    const followAtt = attestations.find(a =>
                        a.content?.kind === 'follow' &&
                        (a.content?.attesterHandle === meHandle || a.content?.attesterHandle === '@' + meHandle.replace(/^@/, '')) &&
                        (a.content?.targetHandle === '@' + targetHandle.replace(/^@/, '') || a.content?.targetHandle === targetHandle)
                    );
                    if (followAtt) {
                        try { await KB.delete(followAtt.id); } catch (_) {}
                    }
                    toast({ kind: 'success', text: 'Unfollow ' + targetHandle });
                } else {
                    const att = buildFollowAttestation({
                        attesterHandle: meHandle,
                        targetHandle: targetHandle,
                    });
                    await KB.upsert(att);
                    toast({ kind: 'success', text: '✓ Follow @' + targetHandle.replace(/^@/, '') });
                }
                setTimeout(() => window.location.reload(), 1000);
            } catch (e) {
                toast({ kind: 'error', text: 'Error: ' + (e?.message || e) });
                btn.disabled = false;
                btn.textContent = alreadyFollowing ? '✓ Following · click per a unfollow' : '+ Follow';
            }
        });
    }

    // CERT-001 pas 6 · acceptar co-sign requests pendents
    _bindCoSignAccept() {
        document.querySelectorAll('[data-accept-cosign]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const reqId = btn.dataset.acceptCosign;
                const req = (this.pendingCoSigns || []).find(r => r.id === reqId);
                if (!req) return;
                if (!confirm('Acceptaràs i signaràs aquest aval de l\'apunt comptable. La signatura usa la teva ECDSA key local-first. Continuar?')) return;
                try {
                    // Cal la signing key del coSigner · per ara · default = signing key del primer project del user
                    // Heurística simple · busquem el primer project on el handle apareix com a creator
                    const { getOrCreateSigningKey } = await import('../core/projectIO.js');
                    const projects = (this.profile.projects || []);
                    if (projects.length === 0) {
                        alert('No tens cap projecte amb signing key local · no es pot signar.');
                        return;
                    }
                    const projectId = projects[0].id;
                    const key = await getOrCreateSigningKey(projectId);
                    if (!key || !key.privateJwk) {
                        alert('No s\'ha pogut obtenir la signing key.');
                        return;
                    }
                    const accepterDid = this.memberNode?.content?.primaryDid || ('did:sos:' + projectId);
                    const accepterHandle = this.handle;
                    const signed = await acceptCoSignRequest({
                        pendingAttestation: req,
                        accepterDid, accepterHandle,
                        privateJwk: key.privateJwk,
                    });
                    await KB.upsert(signed);
                    alert('✓ Co-signatura emesa correctament · l\'entry té un proof attestation-id real ara.');
                    setTimeout(() => window.location.reload(), 600);
                } catch (e) {
                    alert('Error signant la co-firma · ' + (e?.message || 'desconegut'));
                }
            });
        });
    }

    _bindIkigai() {
        // Edit Ikigai button → open modal
        const editBtn = document.getElementById('profIkigaiEdit');
        if (editBtn) editBtn.addEventListener('click', () => this._openIkigaiEditor());
        // Auto-open si query param
        if (this.editIkigai && this.profile.exists) {
            // Small delay perquè el DOM ja estigui
            setTimeout(() => this._openIkigaiEditor(), 100);
        }
    }

    _openIkigaiEditor() {
        if (!this.memberNode) {
            alert('No es pot editar · cal node matriu_member primer (afegeix-te a /matriu)');
            return;
        }
        // Snapshot mutable per editar al modal
        let working = JSON.parse(JSON.stringify(this.ikigai || buildEmptyIkigai()));
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:1rem;overflow-y:auto;';
        const render = () => {
            const complete = computeIkigaiCompleteness(working);
            const dimsHtml = IKIGAI_DIMENSIONS.map(d => {
                const items = (working.dimensions[d.id]?.items) || [];
                return `<div class="iki-edit-dim" data-dim="${d.id}" style="border-left:4px solid ${d.color};padding:10px 12px;background:${d.color}10;border-radius:6px;margin-bottom:10px;">
                    <div style="font-weight:700;font-size:0.95rem;color:${d.color};">${d.icon} ${this._esc(d.label)}</div>
                    <div style="font-size:0.78rem;color:var(--text-secondary);margin:4px 0 8px;">${this._esc(d.prompt)}</div>
                    <div data-items="${d.id}" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;">
                        ${items.map((it, i) => `<span class="iki-chip" data-rm="${d.id}:${i}" style="background:${d.color}25;color:${d.color};padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;cursor:pointer;" title="Click per esborrar">${this._esc(it)} ✗</span>`).join('') || '<span style="font-size:11px;color:var(--text-muted);font-style:italic;">cap encara</span>'}
                    </div>
                    <input type="text" data-input="${d.id}" placeholder="Afegir item (Enter)..." style="width:100%;box-sizing:border-box;background:#000;color:var(--text-main);border:1px solid var(--border-default);border-radius:4px;padding:6px 8px;font-size:0.82rem;">
                    <div style="font-size:10px;color:var(--text-muted);margin-top:3px;font-family:var(--font-mono);">${items.length}/${d.maxItems}</div>
                </div>`;
            }).join('');
            modal.innerHTML = `
            <div style="max-width:760px;width:100%;background:var(--bg-panel);border:1px solid var(--border-default);border-radius:8px;padding:1.5rem;color:var(--text-main);font-family:var(--font-base);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                    <h2 style="margin:0;">🌸 Editar Ikigai · ${this._esc(this.profile.displayName)}</h2>
                    <button id="ikiClose" style="background:transparent;border:1px solid var(--border-default);color:var(--text-main);padding:6px 12px;border-radius:4px;cursor:pointer;">✗ Tancar</button>
                </div>
                <div style="margin-bottom:0.8rem;font-size:0.82rem;color:var(--text-secondary);line-height:1.55;">
                    Ikigai (生き甲斐 · "raó de ser") · intersecció de 4 dimensions. Omple cadascuna amb items concrets (skills · activitats · temes). Les interseccions et donen passió · professió · vocació · missió · i el centre (Ikigai). <strong>Local-first · es desa al teu matriu_member.</strong>
                </div>
                <div style="height:6px;background:#0008;border-radius:3px;overflow:hidden;margin-bottom:1rem;">
                    <div style="height:100%;width:${complete.percent}%;background:linear-gradient(90deg,#ec4899,#22c55e,#3b82f6,#facc15);transition:width 0.3s;"></div>
                </div>
                <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);margin-bottom:1rem;">${complete.filled}/${complete.total} dimensions · ${complete.totalItems} items</div>
                ${dimsHtml}
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:1rem;">
                    <button id="ikiSave" style="padding:10px 18px;border-radius:4px;border:1px solid #ec4899;background:#ec4899;color:#fff;font-weight:700;cursor:pointer;">💾 Desar Ikigai</button>
                    <button id="ikiClose2" style="padding:10px 18px;border-radius:4px;border:1px solid var(--border-default);background:transparent;color:var(--text-main);cursor:pointer;">Cancel·lar</button>
                    <span id="ikiMsg" style="font-size:11px;font-family:var(--font-mono);align-self:center;"></span>
                </div>
            </div>`;
            // Bind handlers post-render
            const close = () => modal.remove();
            modal.querySelector('#ikiClose')?.addEventListener('click', close);
            modal.querySelector('#ikiClose2')?.addEventListener('click', close);
            modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
            // Per dimension · input Enter + chip click remove
            for (const d of IKIGAI_DIMENSIONS) {
                const input = modal.querySelector('[data-input="' + d.id + '"]');
                if (input) input.addEventListener('keydown', (e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    const val = input.value.trim();
                    if (!val) return;
                    const items = ((working.dimensions[d.id]?.items) || []).slice();
                    items.push(val);
                    try {
                        working = applyIkigaiDimension(working, d.id, items);
                        render();
                    } catch (err) {
                        const msg = modal.querySelector('#ikiMsg');
                        if (msg) { msg.textContent = '✗ ' + (err?.message || 'error'); msg.style.color = '#ef4444'; }
                    }
                });
            }
            modal.querySelectorAll('[data-rm]').forEach(chip => {
                chip.addEventListener('click', () => {
                    const [dimId, idx] = chip.dataset.rm.split(':');
                    const items = ((working.dimensions[dimId]?.items) || []).slice();
                    items.splice(parseInt(idx, 10), 1);
                    working = applyIkigaiDimension(working, dimId, items);
                    render();
                });
            });
            // Save
            modal.querySelector('#ikiSave')?.addEventListener('click', async () => {
                try {
                    const updatedMember = applyIkigaiToMember(this.memberNode, working);
                    await KB.upsert(updatedMember);
                    const msg = modal.querySelector('#ikiMsg');
                    if (msg) { msg.textContent = '✓ Ikigai desat'; msg.style.color = '#22c55e'; }
                    setTimeout(() => { close(); window.location.reload(); }, 400);
                } catch (e) {
                    const msg = modal.querySelector('#ikiMsg');
                    if (msg) { msg.textContent = '✗ ' + (e?.message || 'error'); msg.style.color = '#ef4444'; }
                }
            });
        };
        render();
        document.body.appendChild(modal);
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
        const iki = this.ikigai || buildEmptyIkigai();
        const ikiComplete = computeIkigaiCompleteness(iki);
        const ikiInter = computeIntersections(iki);
        const ikiBadge = ikigaiBadge(iki);

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
                            <button class="prof-btn" id="profFollow" data-follow-handle="${this._esc(p.handle)}" style="background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;border:0;">⏳ Follow...</button>
                            <span id="profFollowStats" style="font-size:0.75rem;color:var(--text-secondary);margin-left:4px;align-self:center;">·</span>
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
                ${(this.pendingCoSigns && this.pendingCoSigns.length > 0) ? `
                <div class="prof-card-section" style="grid-column:1/-1;border:1px solid #facc1560;background:linear-gradient(135deg,#facc1515,transparent);">
                    <h3 style="color:#facc15;">🤝 Co-firmes pendents · ${this.pendingCoSigns.length}</h3>
                    <p style="font-size:0.78rem;color:var(--text-secondary);margin:0 0 0.6rem 0;">Aquestes són sol·licituds que altres socis t'han enviat per a avalar els seus apunts comptables. Si tens la signing key del projecte · pots acceptar i signar.</p>
                    ${this.pendingCoSigns.map(req => {
                        const c = req.content || {};
                        const requester = c.requestedByHandle || c.requestedBy || '?';
                        return `<div class="prof-card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;border-left:3px solid #facc15;">
                            <div style="flex:1;min-width:200px;">
                                <div style="font-weight:700;font-size:0.85rem;">📋 Avalar entry · <code style="font-size:11px;">${this._esc((c.attestedId || '').slice(0, 24))}…</code></div>
                                <div class="prof-card-meta">Sol·licitat per ${this._esc(requester)}${c.issuedAt ? ' · ' + this._esc(c.issuedAt.slice(0, 10)) : ''}</div>
                                ${c.statement ? `<div style="font-size:0.78rem;color:var(--text-secondary);margin-top:4px;font-style:italic;">"${this._esc(String(c.statement).slice(0, 140))}"</div>` : ''}
                            </div>
                            <button class="prof-btn" data-accept-cosign="${this._esc(req.id)}" style="background:#22c55e;border-color:#22c55e;color:#fff;font-size:0.78rem;">✓ Acceptar i signar</button>
                        </div>`;
                    }).join('')}
                </div>
                ` : ''}
                <div class="prof-card-section" style="grid-column:1/-1;border:1px solid ${ikiBadge.color}40;background:linear-gradient(135deg,${ikiBadge.color}08,transparent);">
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:0.6rem;">
                        <h3 style="margin:0;">🌸 Ikigai · raó de ser</h3>
                        <div style="display:flex;gap:8px;align-items:center;">
                            <span style="background:${ikiBadge.color}25;color:${ikiBadge.color};padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;font-family:var(--font-mono);">${ikiBadge.icon} ${this._esc(ikiBadge.label)}</span>
                            ${p.exists ? `<button id="profIkigaiEdit" class="prof-btn prof-btn-secondary" style="font-size:0.78rem;">✎ Editar Ikigai</button>` : ''}
                        </div>
                    </div>
                    ${ikiComplete.filled === 0 ? `
                        <div style="color:var(--text-muted);font-style:italic;font-size:0.85rem;padding:0.4rem 0;">
                            ${p.exists ? 'Encara no has definit el teu Ikigai · prem <strong>✎ Editar</strong> per a començar.' : 'Aquest usuari encara no ha definit el seu Ikigai.'}
                        </div>
                    ` : `
                        <div style="height:6px;background:#0008;border-radius:3px;overflow:hidden;margin-bottom:10px;">
                            <div style="height:100%;width:${ikiComplete.percent}%;background:linear-gradient(90deg,#ec4899,#22c55e,#3b82f6,#facc15);"></div>
                        </div>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:1rem;">
                            ${IKIGAI_DIMENSIONS.map(d => {
                                const items = iki.dimensions?.[d.id]?.items || [];
                                return `<div style="border-left:3px solid ${d.color};padding:6px 10px;background:${d.color}10;border-radius:4px;">
                                    <div style="font-weight:700;color:${d.color};font-size:0.82rem;">${d.icon} ${this._esc(d.label)} <span style="font-family:var(--font-mono);font-size:10px;opacity:0.7;">${items.length}</span></div>
                                    ${items.length ? `<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px;">${items.slice(0, 6).map(it => `<span style="background:${d.color}20;color:${d.color};padding:1px 7px;border-radius:999px;font-size:10px;font-family:var(--font-mono);">${this._esc(it)}</span>`).join('')}${items.length > 6 ? `<span style="color:var(--text-muted);font-size:10px;">+${items.length - 6}</span>` : ''}</div>` : '<div style="font-size:10px;color:var(--text-muted);font-style:italic;">cap encara</div>'}
                                </div>`;
                            }).join('')}
                        </div>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;">
                            ${IKIGAI_INTERSECTIONS.map(i => {
                                const items = ikiInter[i.id] || [];
                                const has = items.length > 0;
                                return `<div style="padding:6px 10px;border:1px solid ${i.color}${has ? '50' : '20'};background:${i.color}${has ? '15' : '05'};border-radius:5px;">
                                    <div style="font-size:0.78rem;font-weight:700;color:${has ? i.color : 'var(--text-muted)'};">${i.icon} ${this._esc(i.label)} <span style="font-family:var(--font-mono);font-size:10px;">${items.length}</span></div>
                                    ${has ? `<div style="font-size:10px;color:${i.color};margin-top:3px;font-family:var(--font-mono);">${items.slice(0, 3).map(x => this._esc(x)).join(' · ')}${items.length > 3 ? '…' : ''}</div>` : `<div style="font-size:10px;color:var(--text-muted);margin-top:3px;font-style:italic;">${this._esc(i.tagline)}</div>`}
                                </div>`;
                            }).join('')}
                        </div>
                    `}
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
