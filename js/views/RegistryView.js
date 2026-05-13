// =============================================================================
// TEAMTOWERS SOS V11 — REGISTRY VIEW · PERMAWEB INDEX (PERM-USER-001 sprint F)
// Ruta: /registry
//
// Catàleg unificat de tot allò registrable a la permaweb. Mostra:
//   - perfils signats (public_registry_entry · ja operatiu)
//   - projectes públics, workshops, market items, SOPs, work orders
//     (tipus locals visibles · publish a permaweb properament)
// Filtres per tipus + cerca lliure + sync gratuita del permaweb.
//
// Decisions @alvaro:
//   1. Funding · wallet SOS prepagat (NO credit card direct)
//   8. Pricing · 0.05€ publish · 0.05€ revoke · verify+discovery FREE
//   12. UX · una sola vista per veure tot el que es pot publicar a permaweb,
//       distingint visualment real vs mock vs local-encara-no-publicat.
// =============================================================================

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import {
    PUBLIC_REGISTRY_TYPE,
    syncFromPermaweb,
    getCachedRegistry,
    DEFAULT_TTL_MS,
} from '../core/publicRegistryService.js';

function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

function _gradientForKey(key) {
    if (!key) return 'linear-gradient(135deg,#6366f1,#a855f7)';
    let h1 = 0, h2 = 0;
    for (let i = 0; i < key.length; i++) {
        h1 = (h1 * 31 + key.charCodeAt(i)) % 360;
        h2 = (h2 * 17 + key.charCodeAt(i)) % 360;
    }
    return `linear-gradient(135deg, hsl(${h1},60%,55%), hsl(${h2},60%,45%))`;
}

function _initialsForName(name) {
    if (!name) return '?';
    return name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// Catàleg de tipus indexables. Cada entry té:
//   id         · clau interna del filtre
//   label      · text visible
//   icon       · emoji curt per chip i avatar fallback
//   kbType     · type a KB.query (null si encara no hi és)
//   permaweb   · true si ja té flow publish operatiu
//   gradient   · color base avatar fallback
const INDEX_TYPES = [
    { id: 'all',       label: 'Tots',       icon: '🌐', kbType: null,                    permaweb: true  },
    { id: 'profile',   label: 'Perfils',    icon: '👤', kbType: PUBLIC_REGISTRY_TYPE,    permaweb: true  },
    { id: 'project',   label: 'Projectes',  icon: '🚀', kbType: 'project',               permaweb: false },
    { id: 'workshop',  label: 'Workshops',  icon: '🎓', kbType: 'workshop',              permaweb: false },
    { id: 'market',    label: 'Mercat',     icon: '🛒', kbType: 'market_item',           permaweb: false },
    { id: 'sop',       label: 'SOPs',       icon: '📋', kbType: 'sop',                   permaweb: false },
    { id: 'wo',        label: 'Work orders',icon: '⚙️', kbType: 'work_order',            permaweb: false },
];

const TYPE_META = Object.fromEntries(INDEX_TYPES.map(t => [t.id, t]));

// Normalitza qualsevol node KB a una estructura comuna per renderitzar la card.
function _normalize(node, typeId) {
    const c = node?.content || {};
    if (typeId === 'profile') {
        return {
            id:        node.id,
            typeId:    'profile',
            href:      '/n/' + encodeURIComponent(node.id),
            title:     c.displayName || 'Operador',
            subtitle:  c.handle || c.did || '',
            body:      c.bio || '',
            chips:     [
                ...((c.skillsDeclared || []).slice(0, 3).map(s => ({ icon: '🧠', text: s, cls: 'skill' }))),
                ...((c.sectorsExperience || []).slice(0, 3).map(s => ({ icon: '🌐', text: s, cls: 'sector' }))),
            ],
            txId:      c.arweaveTxId || null,
            mock:      typeof c.arweaveTxId === 'string' && c.arweaveTxId.startsWith('MOCK_TX_'),
            revoked:   !!node._revoked,
            verified:  node._verified !== false,
            published: !!c.arweaveTxId,
        };
    }
    if (typeId === 'project') {
        // FOUNDER-001 sprint C · detect template:'founder' o foundational-network
        const isFounderTemplate = c.template === 'founder'
            || c.projectType === 'foundational-network'
            || (c.projectType || node.projectType) === 'foundational-network';
        const founderChips = isFounderTemplate
            ? [{ icon: '🌟', text: 'Founder template', cls: 'founder' }]
            : [];
        return {
            id:        node.id,
            typeId:    'project',
            href:      '/project/' + encodeURIComponent(node.id),
            title:     c.name || 'Projecte',
            subtitle:  c.sector ? `📂 ${c.sector}` : '',
            body:      c.purpose || c.description || '',
            chips:     [...founderChips, ...(c.tags || []).slice(0, 4).map(t => ({ icon: '🏷', text: t, cls: 'tag' }))],
            txId:      c.arweaveTxId || null,
            mock:      false,
            revoked:   false,
            verified:  null,
            published: !!c.arweaveTxId,
            // Founder template flag · usat pel card render per a clone CTA
            isFounderTemplate,
            clonable:  !!(c.templateClonable || isFounderTemplate),
        };
    }
    if (typeId === 'workshop') {
        return {
            id:        node.id,
            typeId:    'workshop',
            href:      '/workshops',
            title:     c.title || 'Workshop',
            subtitle:  c.sector || c.audience || '',
            body:      c.summary || c.description || '',
            chips:     (c.tags || []).slice(0, 3).map(t => ({ icon: '🏷', text: t, cls: 'tag' })),
            txId:      null,
            mock:      false,
            revoked:   false,
            verified:  null,
            published: false,
        };
    }
    if (typeId === 'market') {
        return {
            id:        node.id,
            typeId:    'market',
            href:      '/market',
            title:     c.title || c.name || 'Oferta',
            subtitle:  c.kind || c.category || '',
            body:      c.description || '',
            chips:     (c.tags || []).slice(0, 3).map(t => ({ icon: '🏷', text: t, cls: 'tag' })),
            txId:      null,
            mock:      false,
            revoked:   false,
            verified:  null,
            published: false,
        };
    }
    if (typeId === 'sop') {
        return {
            id:        node.id,
            typeId:    'sop',
            href:      '/sops',
            title:     c.title || c.name || 'SOP',
            subtitle:  c.role || c.sector || '',
            body:      c.purpose || c.description || '',
            chips:     [],
            txId:      null,
            mock:      false,
            revoked:   false,
            verified:  null,
            published: false,
        };
    }
    if (typeId === 'wo') {
        return {
            id:        node.id,
            typeId:    'wo',
            href:      '/kanban',
            title:     c.title || c.name || 'Work order',
            subtitle:  c.status || '',
            body:      c.description || '',
            chips:     [],
            txId:      null,
            mock:      false,
            revoked:   false,
            verified:  null,
            published: false,
        };
    }
    return null;
}

export default class RegistryView {
    constructor() {
        document.title = 'Permaweb Index · SOS V11';
        this._entries = [];      // { ...normalized, typeId }
        this._filter = '';
        this._typeId = 'all';
        this._syncing = false;
    }

    async getHtml() {
        await store.init();
        await KB.init();
        return `
        <style>
            .rg-shell  { height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); display:flex; flex-direction:column; overflow:hidden; }
            .rg-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-shrink:0; flex-wrap:wrap; min-height:48px; box-sizing:border-box; }
            .rg-title  { color:var(--text-secondary); font-weight:600; letter-spacing:0.05em; text-transform:uppercase; font-size:0.78rem; }
            .rg-spacer { flex:1; }
            .rg-btn { background:var(--bg-elevated); color:var(--text-main); border:1px solid var(--border-default); padding:6px 12px; border-radius:var(--radius-sm); cursor:pointer; font-size:var(--text-xs); font-weight:600; font-family:var(--font-base); transition:all var(--dur-fast); display:inline-flex; align-items:center; gap:4px; }
            .rg-btn:hover { background:var(--glass-hover); border-color:var(--accent-indigo); }
            .rg-btn-primary { background:var(--accent-indigo); border-color:var(--accent-indigo); color:#fff; }
            .rg-btn-primary:hover { filter:brightness(1.10); color:#fff; }
            .rg-main { padding:1.5rem; flex:1; overflow-y:auto; max-width:1200px; margin:0 auto; width:100%; box-sizing:border-box; }
            .rg-hero { margin-bottom:1.4rem; }
            .rg-hero h1 { font-size:1.6rem; font-weight:800; letter-spacing:-0.02em; color:var(--text-main); margin:0; }
            .rg-hero p  { color:var(--text-muted); font-size:var(--text-sm); margin-top:6px; line-height:1.6; max-width:820px; }
            .rg-stats { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:10px; margin:14px 0 18px; }
            .rg-stat { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:var(--radius-md); padding:10px 14px; box-shadow:var(--shadow-sm); }
            .rg-stat-label { font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; font-weight:600; font-family:var(--font-mono); }
            .rg-stat-value { font-size:1.4rem; font-weight:700; color:var(--text-main); font-family:var(--font-mono); margin-top:4px; }
            .rg-filters { display:flex; flex-wrap:wrap; gap:6px; margin:0 0 12px; }
            .rg-type-chip { background:var(--bg-elevated); border:1px solid var(--border-default); color:var(--text-secondary); padding:5px 11px; border-radius:999px; font-size:var(--text-xs); font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:5px; transition:all var(--dur-fast); }
            .rg-type-chip:hover { border-color:var(--accent-indigo); color:var(--text-main); }
            .rg-type-chip.active { background:var(--accent-indigo); border-color:var(--accent-indigo); color:#fff; }
            .rg-type-chip .count { opacity:0.7; font-family:var(--font-mono); font-size:10px; }
            .rg-search { display:flex; gap:8px; margin-bottom:1rem; align-items:center; flex-wrap:wrap; }
            .rg-search input { flex:1; min-width:240px; background:var(--bg-elevated); border:1px solid var(--border-default); color:var(--text-main); padding:8px 12px; border-radius:var(--radius-md); font-size:var(--text-sm); outline:none; }
            .rg-search input:focus { border-color:var(--accent-indigo); box-shadow:var(--shadow-focus); }
            .rg-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; }
            .rg-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:var(--radius-lg); padding:14px; text-decoration:none; color:var(--text-main); display:flex; flex-direction:column; gap:10px; box-shadow:var(--shadow-sm); transition:all var(--dur-fast); }
            .rg-card:hover { transform:translateY(-1px); border-color:var(--accent-indigo); }
            .rg-card.revoked { opacity:0.55; border-color:rgba(239,68,68,0.30); }
            .rg-card.mock    { border-color:rgba(168,85,247,0.45); background:linear-gradient(180deg,var(--bg-panel),rgba(168,85,247,0.05)); }
            .rg-card.local   { border-style:dashed; }
            .rg-card-head { display:flex; align-items:center; gap:10px; }
            .rg-avatar { width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:1.05rem; font-weight:800; flex-shrink:0; box-shadow:var(--shadow-sm); }
            .rg-avatar.round { border-radius:50%; font-size:0.95rem; }
            .rg-card-info { min-width:0; flex:1; }
            .rg-card-name { font-size:var(--text-sm); font-weight:700; color:var(--text-main); line-height:1.2; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
            .rg-card-name .type-tag { font-size:9px; padding:2px 6px; border-radius:4px; background:var(--bg-elevated); color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; font-family:var(--font-mono); font-weight:700; }
            .rg-card-handle { font-size:var(--text-xs); color:var(--text-muted); font-family:var(--font-mono); margin-top:2px; }
            .rg-card-bio { font-size:12px; color:var(--text-secondary); line-height:1.45; min-height:32px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
            .rg-card-chips { display:flex; flex-wrap:wrap; gap:4px; }
            .rg-chip { font-size:10px; padding:2px 7px; border-radius:999px; background:rgba(99,102,241,0.10); color:var(--accent-indigo); font-weight:600; }
            .rg-chip.sector { background:rgba(16,185,129,0.10); color:var(--accent-green); }
            .rg-chip.tag    { background:rgba(249,115,22,0.10); color:var(--accent-orange); }
            .rg-card-foot { display:flex; align-items:center; justify-content:space-between; padding-top:6px; border-top:1px solid var(--border-subtle); font-size:10px; color:var(--text-muted); font-family:var(--font-mono); gap:8px; flex-wrap:wrap; }
            .rg-badge-verified   { color:var(--accent-green); font-weight:700; }
            .rg-badge-unverified { color:var(--accent-orange); font-weight:700; }
            .rg-badge-revoked    { color:var(--accent-red); font-weight:700; }
            .rg-badge-mock       { color:#c084fc; font-weight:700; }
            .rg-badge-local      { color:var(--text-muted); font-weight:700; }
            .rg-empty { text-align:center; padding:3rem 1rem; color:var(--text-muted); border:1px dashed var(--border-default); border-radius:var(--radius-md); }
            .rg-hint  { font-size:11px; color:var(--text-muted); margin-top:18px; padding:10px 14px; border:1px dashed var(--border-default); border-radius:var(--radius-md); line-height:1.6; }
            .rg-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:var(--bg-panel); border:1px solid var(--border-default); color:var(--text-main); padding:12px 18px; border-radius:var(--radius-md); box-shadow:var(--shadow-lg); font-size:var(--text-sm); font-weight:600; z-index:9999; }
        </style>

        <div class="rg-shell">
            <div class="rg-topbar">
                <span class="rg-title">🌐 Permaweb Index · SOS</span>
                <div class="rg-spacer"></div>
                <button class="rg-btn rg-btn-primary" id="rgSyncBtn" title="Refresca des de permaweb · gratis (només lectura)">↻ Sync des de permaweb</button>
            </div>
            <div class="rg-main">
                <header class="rg-hero">
                    <h1>🌐 Permaweb Index</h1>
                    <p>Catàleg descentralitzat de tot el contingut SOS registrable a la permaweb. Avui ja són publicables els <strong>perfils</strong> signats des de <a href="/identity" data-link style="color:var(--accent-indigo);">/identity</a> · projectes, workshops, mercat, SOPs i WOs estaran disponibles a la propera onada. Discovery i verify són sempre gratuïts.</p>
                </header>
                <div class="rg-stats" id="rgStats"></div>
                <div class="rg-filters" id="rgFilters"></div>
                <div class="rg-search">
                    <input type="search" id="rgSearch" placeholder="🔍 Cerca per nom · handle · sector · tag" autocomplete="off">
                </div>
                <div id="rgList" class="rg-grid">
                    <div class="rg-empty">Carregant entries del cache local…</div>
                </div>
                <div class="rg-hint">
                    💡 <strong>Llegenda</strong> · les cards amb borda <span style="color:#c084fc;">violeta</span> són publicades en <strong>mode test</strong> (no consumeixen saldo real) · les <span style="color:var(--text-muted);">discontínues</span> existeixen localment però encara no s'han publicat al permaweb. Quan els altres tipus tinguin flow real apareixerà el botó <em>Publica al permaweb</em> a cada vista corresponent.
                </div>
            </div>
        </div>
        `;
    }

    async afterRender() {
        await this._loadFromCache();
        document.getElementById('rgSyncBtn')?.addEventListener('click', () => this._sync());
        document.getElementById('rgSearch')?.addEventListener('input', e => {
            this._filter = e.target.value.toLowerCase().trim();
            this._renderList();
            this._renderStats();
        });
        document.getElementById('rgFilters')?.addEventListener('click', e => {
            const chip = e.target.closest('[data-type-chip]');
            if (!chip) return;
            this._typeId = chip.dataset.typeChip;
            this._renderFilters();
            this._renderList();
            this._renderStats();
        });
    }

    async _loadFromCache() {
        const collected = [];
        for (const t of INDEX_TYPES) {
            if (t.id === 'all') continue;
            try {
                if (t.id === 'profile') {
                    const cached = await getCachedRegistry({ maxAge: DEFAULT_TTL_MS * 24 });
                    for (const e of cached) {
                        const norm = _normalize(e, 'profile');
                        if (norm) collected.push(norm);
                    }
                    continue;
                }
                if (!t.kbType) continue;
                const nodes = await KB.query({ type: t.kbType });
                for (const n of nodes) {
                    const norm = _normalize(n, t.id);
                    if (norm) collected.push(norm);
                }
            } catch (err) {
                console.warn('[registry] load failed for', t.id, err);
            }
        }
        this._entries = collected;
        this._renderFilters();
        this._renderStats();
        this._renderList();
    }

    async _sync() {
        if (this._syncing) return;
        this._syncing = true;
        const btn = document.getElementById('rgSyncBtn');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Sincronitzant…'; }
        try {
            const res = await syncFromPermaweb({ verifyOnSync: true });
            await this._loadFromCache();
            this._toast(`✓ ${res.fetched} entries · ${res.revocations} revocades · ${res.cached} al cache`);
        } catch (e) {
            console.error('[registry] sync failed', e);
            this._toast('✗ Sync ha fallat: ' + (e?.message || 'error desconegut'));
        }
        if (btn) { btn.disabled = false; btn.textContent = '↻ Sync des de permaweb'; }
        this._syncing = false;
    }

    _toast(msg) {
        const t = document.createElement('div');
        t.className = 'rg-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2800);
    }

    _countsByType() {
        const counts = { all: this._entries.length };
        for (const t of INDEX_TYPES) {
            if (t.id === 'all') continue;
            counts[t.id] = this._entries.filter(e => e.typeId === t.id).length;
        }
        return counts;
    }

    _renderFilters() {
        const wrap = document.getElementById('rgFilters');
        if (!wrap) return;
        const counts = this._countsByType();
        wrap.innerHTML = INDEX_TYPES.map(t => {
            const active = t.id === this._typeId ? ' active' : '';
            const flag   = t.permaweb ? '' : ' · 🛈 properament';
            return `<button class="rg-type-chip${active}" data-type-chip="${t.id}" title="${escapeHtml(t.label)}${flag}">
                ${t.icon} ${escapeHtml(t.label)} <span class="count">${counts[t.id] ?? 0}</span>
            </button>`;
        }).join('');
    }

    _applyFilters(entries) {
        let out = entries;
        if (this._typeId && this._typeId !== 'all') {
            out = out.filter(e => e.typeId === this._typeId);
        }
        if (this._filter) {
            const q = this._filter;
            out = out.filter(e => {
                const hay = [e.title, e.subtitle, e.body, ...(e.chips || []).map(c => c.text)]
                    .filter(Boolean).join(' ').toLowerCase();
                return hay.includes(q);
            });
        }
        return out;
    }

    _renderStats() {
        const stats = document.getElementById('rgStats');
        if (!stats) return;
        const filtered = this._applyFilters(this._entries);
        const verified = filtered.filter(e => e.verified === true && !e.revoked).length;
        const mock     = filtered.filter(e => e.mock).length;
        const real     = filtered.filter(e => e.published && !e.mock).length;
        const local    = filtered.filter(e => !e.published).length;
        stats.innerHTML = `
            <div class="rg-stat"><div class="rg-stat-label">Total cache</div><div class="rg-stat-value">${this._entries.length}</div></div>
            <div class="rg-stat"><div class="rg-stat-label">Mostrant</div><div class="rg-stat-value">${filtered.length}</div></div>
            <div class="rg-stat"><div class="rg-stat-label">Permaweb · real</div><div class="rg-stat-value" style="color:var(--accent-green);">${real}</div></div>
            <div class="rg-stat"><div class="rg-stat-label">Permaweb · mock</div><div class="rg-stat-value" style="color:#c084fc;">${mock}</div></div>
            <div class="rg-stat"><div class="rg-stat-label">Local · no publicat</div><div class="rg-stat-value" style="color:var(--text-muted);">${local}</div></div>
            <div class="rg-stat"><div class="rg-stat-label">Verificades</div><div class="rg-stat-value" style="color:var(--accent-green);">${verified}</div></div>
        `;
    }

    _renderList() {
        const list = document.getElementById('rgList');
        if (!list) return;
        const filtered = this._applyFilters(this._entries);
        if (filtered.length === 0) {
            const isEmpty = this._entries.length === 0;
            list.innerHTML = '<div class="rg-empty">'
                + (isEmpty
                    ? 'Cap entry indexada · prem ↻ Sync per descobrir perfils del permaweb o crea contingut local des de les vistes corresponents.'
                    : 'Cap entry coincideix amb el filtre · prova un terme més general o canvia de tipus.')
                + '</div>';
            return;
        }
        list.innerHTML = filtered.map(e => this._cardHtml(e)).join('');
    }

    _cardHtml(e) {
        const meta = TYPE_META[e.typeId] || TYPE_META.profile;
        const initials = _initialsForName(e.title);
        const gradient = _gradientForKey(e.id || e.title);
        let badge;
        if (e.revoked)       badge = '<span class="rg-badge-revoked">✕ Revocada</span>';
        else if (e.mock)     badge = '<span class="rg-badge-mock">🧪 Mock</span>';
        else if (e.published && e.verified !== false) badge = '<span class="rg-badge-verified">✓ Verificada</span>';
        else if (e.published) badge = '<span class="rg-badge-unverified">⚠ No verificada</span>';
        else                 badge = '<span class="rg-badge-local">○ Local</span>';

        const classes = ['rg-card'];
        if (e.revoked) classes.push('revoked');
        if (e.mock)    classes.push('mock');
        if (!e.published) classes.push('local');
        const avatarCls = e.typeId === 'profile' ? 'rg-avatar round' : 'rg-avatar';
        const avatarContent = e.typeId === 'profile' ? escapeHtml(initials) : meta.icon;
        const txLabel = e.txId
            ? (e.mock ? '🧪 ' + e.txId.slice(0, 12) + '…' : '🌐 ' + e.txId.slice(0, 8) + '…')
            : '(local)';

        return `
            <a class="${classes.join(' ')}" href="${e.href}" data-link>
                <div class="rg-card-head">
                    <div class="${avatarCls}" style="background:${gradient};">${avatarContent}</div>
                    <div class="rg-card-info">
                        <div class="rg-card-name">${escapeHtml(e.title)}<span class="type-tag">${escapeHtml(meta.label)}</span></div>
                        <div class="rg-card-handle">${escapeHtml(e.subtitle || '')}</div>
                    </div>
                </div>
                ${e.body ? `<div class="rg-card-bio">${escapeHtml(e.body)}</div>` : '<div class="rg-card-bio" style="opacity:0.5;">— sense descripció —</div>'}
                <div class="rg-card-chips">
                    ${(e.chips || []).map(c => `<span class="rg-chip ${c.cls || ''}">${c.icon || ''} ${escapeHtml(c.text)}</span>`).join('')}
                </div>
                <div class="rg-card-foot">
                    <span>${txLabel}</span>
                    ${badge}
                </div>
            </a>
        `;
    }
}
