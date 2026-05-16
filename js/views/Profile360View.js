// =============================================================================
// TEAMTOWERS SOS V11 — PROFILE 360 VIEW (PROFILE-360-LEGENDARY-001)
// Ruta · /js/views/Profile360View.js
//   /me              → mode 'me' (privat · tot visible · auto-create member)
//   /u/{handle}      → mode 'public' (filtra per privacy)
//
// 8 zones · Identity · Ikigai 🌸 · Skills 🤲 · Knowledge 🧠 · Reputation 🤝 ·
// Work · Offerings 🛒 · Network 🌐.
//
// Resol bugs · ikigai persistence (auto-create matriu_member si no existeix) ·
// edició inline ikigai sense URL params.
// =============================================================================

import { KB } from '../core/kb.js';
import { store } from '../core/store.js';
import { toast } from '../core/uxComponents.js';
import { buildProfile360, ensureMember, updatePrivacy, PRIVACY_MODES } from '../core/profile360Service.js';
import {
    IKIGAI_DIMENSIONS, buildEmptyIkigai, applyIkigaiDimension,
    applyIkigaiToMember, computeIkigaiCompleteness,
} from '../core/ikigaiService.js';

const TPL_VERSION = 'profile-360-v1.0';

export default class Profile360View {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Perfil · SOS';
        this._mode = 'me';           // 'me' | 'public'
        this._handle = null;          // sempre prefix @
        this._data = null;
    }

    async getHtml() {
        try {
            const path = window.location.pathname;
            if (path === '/me') {
                this._mode = 'me';
                this._handle = await this._resolveMyHandle();
            } else if (path.startsWith('/u/')) {
                this._mode = 'public';
                // FIX ikigai persistence · handle SEMPRE lowercase per a matching
                // case-insensitive amb matriu_member.content.handle (que `ensureMember`
                // sempre desa en lowercase).
                const raw = decodeURIComponent(path.slice(3)).replace(/^@/, '').toLowerCase();
                this._handle = '@' + raw;
                const myHandle = await this._resolveMyHandle();
                if (myHandle && myHandle === this._handle) this._mode = 'me';
            }
        } catch (_) {}

        if (!this._handle) {
            // Si NO tenim handle resolut · però SÍ hi ha identity primary · el
            // fallback al DID ja ha fet feina dins _resolveMyHandle. Si encara
            // és null · realment cap identity exists · mostrem on-boarding.
            const identities = await KB.query({ type: 'user_identity' }).catch(() => []);
            if (!identities || identities.length === 0) {
                return this._renderNoIdentity();
            }
            // Edge · identity sense DID · prevenció (no hauria de passar)
            return this._renderNoIdentity();
        }

        // Carrega totes les fonts en paral·lel
        const [identities, members, projects, roles, attestations, marketItems,
               workshops, sops, ledger, invoices, wos, learnRoles, registryEntries] = await Promise.all([
            KB.query({ type: 'user_identity' }).catch(() => []),
            KB.query({ type: 'matriu_member' }).catch(() => []),
            (async () => (await store.init(), store.getState().projects || []))(),
            KB.query({ type: 'role' }).catch(() => []),
            KB.query({ type: 'attestation' }).catch(() => []),
            KB.query({ type: 'market_item' }).catch(() => []),
            KB.query({ type: 'workshop' }).catch(() => []),
            KB.query({ type: 'sop' }).catch(() => []),
            KB.query({ type: 'ledger_entry' }).catch(() => []),
            KB.query({ type: 'invoice' }).catch(() => []),
            KB.query({ type: 'work_order' }).catch(() => []),
            KB.query({ type: 'learn_role' }).catch(() => []),
            KB.query({ type: 'public_registry_entry' }).catch(() => []),
        ]);

        // Identity propi · primary user_identity
        const identityNode = (identities || []).find(n => n?.content?.isPrimary) || (identities || [])[0] || null;
        // Member del handle · cerca case-insensitive (resol bug · si content.handle
        // és 'Alvaro' i this._handle '@alvaro' · abans no trobava el member).
        let member = (members || []).find(m => {
            const h = (m.content?.handle || '').replace(/^@/, '').toLowerCase();
            return ('@' + h) === this._handle.toLowerCase();
        }) || null;

        // AUTO-CREATE · si mode 'me' i identity sense matriu_member · creem-lo
        // RESOL el bug ikigai persistence · ara hi ha sempre un node on guardar.
        if (this._mode === 'me' && !member && identityNode) {
            const { member: newMember, created } = ensureMember({
                handle: this._handle, identityNode, existingMember: null,
            });
            if (created && newMember) {
                try {
                    await KB.upsert(newMember);
                    member = newMember;
                    console.log('[Profile360] auto-created matriu_member for', this._handle);
                } catch (e) {
                    console.warn('[Profile360] failed to auto-create member', e);
                }
            }
        }

        this._data = buildProfile360({
            handle: this._handle,
            identityNode, member, projects, roles, attestations,
            marketItems, workshops, sops, ledger, invoices, wos,
            learnRoles, registryEntries,
            mode: this._mode,
        });

        return this._renderShell();
    }

    async afterRender() {
        document.querySelectorAll('[data-action="edit-ikigai"]').forEach(b =>
            b.addEventListener('click', () => this._openIkigaiEditor()));
        document.querySelectorAll('[data-action="toggle-privacy"]').forEach(b =>
            b.addEventListener('click', (e) => this._togglePrivacy(e.currentTarget)));
    }

    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    async _resolveMyHandle() {
        // FIX ikigai persistence · SEMPRE lowercase + trim · evita mismatch case
        // entre primary member i identity. + Fallback al DID si handle/displayName
        // són buits (cas usuari amb identity generada però sense editar perfil).
        const norm = (h) => h ? '@' + String(h).trim().replace(/^@/, '').toLowerCase() : null;
        try {
            const members = await KB.query({ type: 'matriu_member' });
            const primary = (members || []).find(m => m?.content?.isPrimary);
            if (primary?.content?.handle) return norm(primary.content.handle);
            // Fallback · qualsevol membre · sense isPrimary
            const any = (members || [])[0];
            if (any?.content?.handle) return norm(any.content.handle);
        } catch (_) {}
        try {
            const identities = await KB.query({ type: 'user_identity' });
            const id = (identities || []).find(n => n?.content?.isPrimary) || (identities || [])[0];
            const h = id?.content?.handle || id?.content?.displayName;
            if (h) return norm(h);
            // FALLBACK ROBUST · si identity existeix però NO té handle/displayName
            // generem un handle estable des del DID · evita que l'usuari quedi
            // bloquejat sense poder editar ikigai (bug original reportat).
            if (id?.content?.primaryDid) {
                const didSlug = String(id.content.primaryDid).replace(/^did:sos:/, '').slice(0, 12);
                return norm('user-' + didSlug);
            }
        } catch (_) {}
        return null;
    }

    _renderNoIdentity() {
        return `
        <div style="min-height:100dvh;background:var(--bg-dark);color:var(--text-main);font-family:var(--font-base);padding:2rem;">
            <div style="max-width:600px;margin:4rem auto;text-align:center;background:var(--bg-panel);padding:2rem;border-radius:8px;border:1px solid var(--border-default);">
                <h1>👤 Perfil</h1>
                <p>Encara no tens identitat creada · ves a <a href="/identity" data-link style="color:var(--accent-indigo);">/identity</a> per generar el teu DID · després torna aquí.</p>
            </div>
        </div>`;
    }

    _renderShell() {
        const d = this._data;
        const isMine = d.mode === 'me';
        const idZ = d.zones.identity;
        return `
        <style>
            .p360-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); padding-bottom:2rem; }
            .p360-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); position:sticky; top:0; z-index:10; }
            .p360-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .p360-logo span { color:var(--accent-indigo); }
            .p360-main { max-width:1100px; margin:0 auto; padding:1.2rem 1rem; display:flex; flex-direction:column; gap:0.85rem; }

            .p360-hero { background:linear-gradient(135deg,rgba(99,102,241,0.18),rgba(168,85,247,0.10)); border:1px solid rgba(99,102,241,0.3); border-radius:10px; padding:1.4rem 1.6rem; display:flex; gap:1.2rem; align-items:flex-start; }
            .p360-avatar { width:84px; height:84px; border-radius:50%; background:linear-gradient(135deg,#a855f7,#6366f1); display:flex; align-items:center; justify-content:center; font-size:2.4rem; flex-shrink:0; }
            .p360-hero-body { flex:1; min-width:0; }
            .p360-hero h1 { margin:0 0 4px 0; font-size:1.55rem; letter-spacing:-0.01em; }
            .p360-hero .handle { font-family:var(--font-mono); color:var(--text-secondary); font-size:0.88rem; }
            .p360-hero .did { font-family:var(--font-mono); color:var(--text-muted); font-size:0.7rem; margin-top:4px; word-break:break-all; }
            .p360-mode-pill { padding:2px 10px; border-radius:999px; font-size:0.7rem; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; }
            .p360-mode-pill.me { background:rgba(34,197,94,0.18); color:#22c55e; border:1px solid rgba(34,197,94,0.35); }
            .p360-mode-pill.public { background:rgba(99,102,241,0.18); color:#a8b2ff; border:1px solid rgba(99,102,241,0.35); }

            .p360-zone { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem 1.1rem; }
            .p360-zone-head { display:flex; align-items:center; gap:8px; margin-bottom:0.75rem; }
            .p360-zone-head h2 { margin:0; font-size:0.95rem; flex:1; }
            .p360-zone-head .privacy { font-size:0.65rem; padding:1px 8px; border-radius:999px; background:rgba(148,163,184,0.15); color:var(--text-muted); }
            .p360-zone-head .actions { display:flex; gap:5px; }
            .p360-btn { padding:5px 12px; border-radius:6px; border:1px solid var(--border-default); background:transparent; color:var(--text-main); cursor:pointer; font-size:0.74rem; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:4px; }
            .p360-btn:hover { background:var(--glass-hover); border-color:var(--accent-indigo); }
            .p360-btn-primary { background:linear-gradient(135deg,#a855f7,#6366f1); color:#fff; border-color:transparent; }

            .p360-pill { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:999px; font-size:0.76rem; background:var(--bg-dark); border:1px solid var(--border-default); margin:2px; }
            .p360-pill.acc { color:#22c55e; border-color:rgba(34,197,94,0.35); background:rgba(34,197,94,0.10); }
            .p360-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:0.6rem; }
            .p360-stat { background:var(--bg-dark); border:1px solid var(--border-default); border-radius:6px; padding:0.7rem 0.85rem; }
            .p360-stat .val { font-size:1.25rem; font-weight:800; line-height:1; }
            .p360-stat .lbl { font-size:0.68rem; color:var(--text-secondary); margin-top:3px; text-transform:uppercase; letter-spacing:0.05em; }

            .p360-iki-bar { height:6px; background:var(--bg-dark); border-radius:3px; overflow:hidden; margin:8px 0; }
            .p360-iki-fill { height:100%; background:linear-gradient(90deg,#ec4899,#22c55e,#3b82f6,#facc15); transition:width 0.3s; }

            .p360-empty { padding:1.2rem; text-align:center; color:var(--text-muted); font-size:0.85rem; font-style:italic; }
        </style>

        <div class="p360-shell">
            <div class="p360-topbar">
                <a href="/home" data-link class="p360-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Perfil</span>
                <span class="p360-mode-pill ${isMine ? 'me' : 'public'}">${isMine ? '🔒 vista privada · /me' : '👁 vista pública · /u/' + this._handle.replace(/^@/, '')}</span>
                <span style="flex:1;"></span>
                ${isMine ? `<a href="/u/${encodeURIComponent(this._handle.replace(/^@/, ''))}" data-link class="p360-btn">👁 Veure pública</a>` : ''}
            </div>

            <div class="p360-main">
                ${this._zoneHero(idZ)}
                ${this._zoneIkigai(d.zones.ikigai, isMine)}
                ${this._zoneSkills(d.zones.skills)}
                ${this._zoneKnowledge(d.zones.knowledge)}
                ${this._zoneReputation(d.zones.reputation)}
                ${this._zoneWork(d.zones.work)}
                ${this._zoneOfferings(d.zones.offerings)}
                ${this._zoneNetwork(d.zones.network)}
            </div>
        </div>`;
    }

    _zoneHero(idZ) {
        if (!idZ) return '';
        const initial = (idZ.displayName || idZ.handle || '?').replace(/^@/, '').charAt(0).toUpperCase();
        return `
        <div class="p360-hero">
            <div class="p360-avatar">${idZ.avatar ? `<img src="${this._esc(idZ.avatar)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : this._esc(initial)}</div>
            <div class="p360-hero-body">
                <h1>${this._esc(idZ.displayName)}</h1>
                <div class="handle">${this._esc(idZ.handle)} ${idZ.cohortNumber ? '· cohort ' + idZ.cohortNumber : ''}</div>
                ${idZ.did ? `<div class="did">${this._esc(idZ.did)}</div>` : ''}
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
                    ${idZ.publicKeyPresent ? '<span class="p360-pill acc">🔐 DID signat</span>' : ''}
                    ${idZ.wanderConnected  ? '<span class="p360-pill acc">🦊 Wander</span>'   : ''}
                    ${idZ.hasKeyfile       ? '<span class="p360-pill acc">📂 Keyfile</span>'   : ''}
                    ${Array.isArray(idZ.wallets) && idZ.wallets.length ? `<span class="p360-pill">💼 ${idZ.wallets.length} wallets</span>` : ''}
                </div>
            </div>
        </div>`;
    }

    _zoneIkigai(z, isMine) {
        if (!z) return this._zonePrivate('ikigai', '🌸 Ikigai');
        if (!z.present) {
            return `
            <div class="p360-zone">
                <div class="p360-zone-head"><h2>🌸 Ikigai · raó de ser</h2></div>
                <div class="p360-empty">${isMine ? 'Encara no has definit el teu ikigai · 4 dimensions per a trobar el centre.' : 'Aquesta persona no ha definit ikigai encara.'}</div>
                ${isMine ? '<div style="text-align:center;"><button class="p360-btn p360-btn-primary" data-action="edit-ikigai">🌸 Definir ikigai</button></div>' : ''}
            </div>`;
        }
        const dims = IKIGAI_DIMENSIONS.map(d => {
            const items = z.ikigai?.dimensions?.[d.id]?.items || [];
            return `
            <div style="border-left:3px solid ${d.color};padding:8px 10px;background:${d.color}10;border-radius:6px;margin-bottom:6px;">
                <div style="font-weight:700;font-size:0.85rem;color:${d.color};">${d.icon} ${this._esc(d.label)}</div>
                <div style="margin-top:5px;">
                    ${items.length === 0 ? '<span style="font-size:0.75rem;color:var(--text-muted);font-style:italic;">pendent</span>'
                                          : items.map(it => `<span class="p360-pill" style="background:${d.color}25;color:${d.color};border-color:${d.color}40;">${this._esc(it)}</span>`).join('')}
                </div>
            </div>`;
        }).join('');
        return `
        <div class="p360-zone">
            <div class="p360-zone-head">
                <h2>🌸 Ikigai · ${z.completePct}% complet</h2>
                ${isMine ? '<div class="actions"><button class="p360-btn" data-action="edit-ikigai">✎ Editar</button></div>' : ''}
            </div>
            <div class="p360-iki-bar"><div class="p360-iki-fill" style="width:${z.completePct}%;"></div></div>
            <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:8px;">${z.filledDims}/4 dimensions · ${z.totalItems} items</div>
            ${dims}
        </div>`;
    }

    _zoneSkills(z) {
        if (!z) return this._zonePrivate('skills', '🤲 Skills');
        if (!z.skills.length) {
            return `<div class="p360-zone"><div class="p360-zone-head"><h2>🤲 Skills</h2></div><div class="p360-empty">Cap skill encara.</div></div>`;
        }
        return `
        <div class="p360-zone">
            <div class="p360-zone-head"><h2>🤲 Skills · ${z.totals.all}</h2></div>
            <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
                ${z.skills.map(s => `<span class="p360-pill ${s.attested ? 'acc' : ''}" title="source · ${s.source}${s.attested ? ' · ' + s.attestationCount + ' attestacions' : ''}">${this._esc(s.id)}${s.attested ? ' ✓×' + s.attestationCount : ''}</span>`).join('')}
            </div>
        </div>`;
    }

    _zoneKnowledge(z) {
        if (!z) return this._zonePrivate('knowledge', '🧠 Knowledge');
        return `
        <div class="p360-zone">
            <div class="p360-zone-head"><h2>🧠 Knowledge</h2></div>
            <div class="p360-grid">
                <div class="p360-stat"><div class="val">${z.workshops.length}</div><div class="lbl">Workshops</div></div>
                <div class="p360-stat"><div class="val">${z.learnRoles.length}</div><div class="lbl">Learn roles</div></div>
                <div class="p360-stat"><div class="val">${z.sectorsExperience.length}</div><div class="lbl">Sectors</div></div>
            </div>
            ${z.sectorsExperience.length ? `<div style="margin-top:8px;display:flex;gap:0.3rem;flex-wrap:wrap;">${z.sectorsExperience.map(s => `<span class="p360-pill">${this._esc(s)}</span>`).join('')}</div>` : ''}
        </div>`;
    }

    _zoneReputation(z) {
        if (!z) return this._zonePrivate('reputation', '🤝 Reputation');
        return `
        <div class="p360-zone">
            <div class="p360-zone-head"><h2>🤝 Reputation</h2></div>
            <div class="p360-grid">
                <div class="p360-stat"><div class="val">${z.attestationsReceived}</div><div class="lbl">Attestations rebudes</div></div>
                <div class="p360-stat"><div class="val">${z.attestationsSent}</div><div class="lbl">Enviades</div></div>
                <div class="p360-stat"><div class="val">${z.followers}</div><div class="lbl">Followers</div></div>
                <div class="p360-stat"><div class="val">${z.following}</div><div class="lbl">Following</div></div>
                <div class="p360-stat"><div class="val">${z.uniqueAttesters}</div><div class="lbl">Unique atts</div></div>
                <div class="p360-stat"><div class="val">${z.rawScore}</div><div class="lbl">Trust score</div></div>
            </div>
        </div>`;
    }

    _zoneWork(z) {
        if (!z) return this._zonePrivate('work', '⚙️ Work');
        const availColor = z.availability === 'available' ? '#22c55e' : z.availability === 'busy' ? '#facc15' : '#ef4444';
        return `
        <div class="p360-zone" style="border-left:3px solid ${availColor};">
            <div class="p360-zone-head"><h2>⚙️ Work · <span style="color:${availColor};">${this._esc(z.availability)}</span></h2></div>
            <div class="p360-grid">
                <div class="p360-stat"><div class="val">${z.projects.length}</div><div class="lbl">Projectes</div></div>
                <div class="p360-stat"><div class="val">${z.wosInProgress.length}</div><div class="lbl">WOs in progress</div></div>
                <div class="p360-stat"><div class="val">${z.wosDone}</div><div class="lbl">WOs done</div></div>
            </div>
            ${z.projects.length ? `<div style="margin-top:10px;display:flex;flex-direction:column;gap:5px;">${z.projects.map(p => `
                <div style="padding:6px 10px;background:var(--bg-dark);border-radius:6px;display:flex;align-items:center;gap:8px;">
                    <a href="/project/${encodeURIComponent(p.id)}" data-link style="flex:1;color:var(--text-main);text-decoration:none;font-size:0.85rem;">🚀 ${this._esc(p.name || p.id)}</a>
                    ${p.castell_level ? `<span class="p360-pill">${this._esc(p.castell_level)}</span>` : ''}
                </div>`).join('')}</div>` : ''}
        </div>`;
    }

    _zoneOfferings(z) {
        if (!z) return this._zonePrivate('offerings', '🛒 Ofertes');
        return `
        <div class="p360-zone">
            <div class="p360-zone-head"><h2>🛒 Ofertes</h2></div>
            <div class="p360-grid">
                <div class="p360-stat"><div class="val">${z.products}</div><div class="lbl">Productes</div></div>
                <div class="p360-stat"><div class="val">${z.workshops}</div><div class="lbl">Workshops</div></div>
                <div class="p360-stat"><div class="val">${z.sops}</div><div class="lbl">SOPs</div></div>
                <div class="p360-stat"><div class="val" style="color:#22c55e;">${z.revenueEur}€</div><div class="lbl">Revenue</div></div>
            </div>
        </div>`;
    }

    _zoneNetwork(z) {
        if (!z) return this._zonePrivate('network', '🌐 Network');
        return `
        <div class="p360-zone">
            <div class="p360-zone-head"><h2>🌐 Network · permaweb</h2></div>
            <div class="p360-grid">
                <div class="p360-stat"><div class="val">${z.permawebReal}</div><div class="lbl">Permaweb entries</div></div>
                <div class="p360-stat"><div class="val">${z.permawebEntries - z.permawebReal}</div><div class="lbl">Mock</div></div>
                <div class="p360-stat"><div class="val">${z.crossSosReach}</div><div class="lbl">Cross-SOS</div></div>
                <div class="p360-stat"><div class="val">${z.tripleEntryProof}</div><div class="lbl">Triple-entry</div></div>
            </div>
            <div style="margin-top:8px;font-size:0.7rem;color:var(--text-muted);font-style:italic;">⚡ Triple-entry · WO pendent · veure <code>wo-triple-entry-accounting-001</code></div>
        </div>`;
    }

    _zonePrivate(id, title) {
        return `<div class="p360-zone"><div class="p360-zone-head"><h2>${this._esc(title)}</h2><span class="privacy">🔒 privat</span></div><div class="p360-empty">Aquesta zona és privada · només visible al propietari.</div></div>`;
    }

    // ── Edita ikigai · inline modal · resol bug persistence amb auto-create ──
    async _openIkigaiEditor() {
        // Garanteix matriu_member · si no existeix · auto-create
        // FIX · case-insensitive match · resol bug ikigai persistence
        let members = await KB.query({ type: 'matriu_member' }).catch(() => []);
        const lcHandle = this._handle.toLowerCase();
        let member = members.find(m => ('@' + (m.content?.handle || '').replace(/^@/, '').toLowerCase()) === lcHandle);
        if (!member) {
            const identities = await KB.query({ type: 'user_identity' }).catch(() => []);
            const identityNode = identities.find(n => n?.content?.isPrimary) || identities[0];
            const { member: nm, created } = ensureMember({ handle: this._handle, identityNode });
            if (nm) {
                await KB.upsert(nm);
                member = nm;
                if (created) toast({ kind: 'info', text: '✓ Auto-creat matriu_member · ikigai es pot guardar ara' });
            } else {
                toast({ kind: 'error', text: 'Cal identitat primer · ves a /identity' });
                return;
            }
        }

        let working = JSON.parse(JSON.stringify(member.content?.ikigai || buildEmptyIkigai()));
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:1rem;overflow-y:auto;';

        const render = () => {
            const c = computeIkigaiCompleteness(working);
            const dimsHtml = IKIGAI_DIMENSIONS.map(d => {
                const items = (working.dimensions[d.id]?.items) || [];
                return `<div style="border-left:4px solid ${d.color};padding:10px 12px;background:${d.color}10;border-radius:6px;margin-bottom:10px;">
                    <div style="font-weight:700;font-size:0.95rem;color:${d.color};">${d.icon} ${d.label}</div>
                    <div style="font-size:0.78rem;color:var(--text-secondary);margin:4px 0 8px;">${d.prompt}</div>
                    <div data-items="${d.id}" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;">
                        ${items.map((it, i) => `<span data-rm="${d.id}:${i}" style="background:${d.color}25;color:${d.color};padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;cursor:pointer;" title="Click per esborrar">${this._esc(it)} ✗</span>`).join('') || '<span style="font-size:11px;color:var(--text-muted);font-style:italic;">cap encara</span>'}
                    </div>
                    <input type="text" data-input="${d.id}" placeholder="Afegir item (Enter)..." style="width:100%;box-sizing:border-box;background:#000;color:var(--text-main);border:1px solid var(--border-default);border-radius:4px;padding:6px 8px;font-size:0.82rem;">
                </div>`;
            }).join('');
            modal.innerHTML = `
            <div style="max-width:760px;width:100%;background:var(--bg-panel);border:1px solid var(--border-default);border-radius:8px;padding:1.5rem;color:var(--text-main);font-family:var(--font-base);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                    <h2 style="margin:0;">🌸 Editar Ikigai</h2>
                    <button data-close style="background:transparent;border:1px solid var(--border-default);color:var(--text-main);padding:6px 12px;border-radius:4px;cursor:pointer;">✗ Tancar</button>
                </div>
                <div style="height:6px;background:#0008;border-radius:3px;overflow:hidden;margin-bottom:1rem;"><div style="height:100%;width:${c.percent}%;background:linear-gradient(90deg,#ec4899,#22c55e,#3b82f6,#facc15);"></div></div>
                <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);margin-bottom:1rem;">${c.filled}/${c.total} dimensions · ${c.totalItems} items</div>
                ${dimsHtml}
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:1rem;">
                    <button data-save style="padding:10px 18px;border-radius:4px;border:1px solid #ec4899;background:#ec4899;color:#fff;font-weight:700;cursor:pointer;">💾 Desar Ikigai</button>
                    <button data-close style="padding:10px 18px;border-radius:4px;border:1px solid var(--border-default);background:transparent;color:var(--text-main);cursor:pointer;">Cancel·lar</button>
                    <span data-msg style="font-size:11px;font-family:var(--font-mono);align-self:center;"></span>
                </div>
            </div>`;
            modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => modal.remove()));
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
            for (const d of IKIGAI_DIMENSIONS) {
                const input = modal.querySelector('[data-input="' + d.id + '"]');
                if (input) input.addEventListener('keydown', (e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    const v = input.value.trim();
                    if (!v) return;
                    const items = ((working.dimensions[d.id]?.items) || []).slice();
                    items.push(v);
                    try { working = applyIkigaiDimension(working, d.id, items); render(); } catch (_) {}
                });
            }
            modal.querySelectorAll('[data-rm]').forEach(chip => chip.addEventListener('click', () => {
                const [dimId, idx] = chip.dataset.rm.split(':');
                const items = ((working.dimensions[dimId]?.items) || []).slice();
                items.splice(parseInt(idx, 10), 1);
                working = applyIkigaiDimension(working, dimId, items);
                render();
            }));
            modal.querySelector('[data-save]')?.addEventListener('click', async () => {
                try {
                    const updated = applyIkigaiToMember(member, working);
                    await KB.upsert(updated);
                    const msg = modal.querySelector('[data-msg]');
                    if (msg) { msg.textContent = '✓ Ikigai desat'; msg.style.color = '#22c55e'; }
                    toast({ kind: 'success', text: '✓ Ikigai desat · persisteix al matriu_member' });
                    setTimeout(() => { modal.remove(); this.render(); }, 400);
                } catch (e) {
                    const msg = modal.querySelector('[data-msg]');
                    if (msg) { msg.textContent = '✗ ' + (e?.message || 'error'); msg.style.color = '#ef4444'; }
                }
            });
        };
        render();
        document.body.appendChild(modal);
    }

    async _togglePrivacy(btn) {
        // Pendent · privacy editor inline · per ara stub
        toast({ kind: 'info', text: 'Privacy editor · pendent · veure /settings (futur)' });
    }

    _esc(s) {
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    destroy() {}
}

export { TPL_VERSION };
