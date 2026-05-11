// =============================================================================
// TEAMTOWERS SOS V11 — REGISTRY VIEW (PERM-USER-001 sprint E)
// Ruta: /registry
//
// Vista pública de discoverabilitat · llista entries cache local + boto de
// sync amb el permaweb. Cada entry mostra avatar (gradient per DID hash) +
// handle + displayName + bio + chips skills/sectors + badge ✓/⚠ segons
// verifyRegistryEntry. Click → /n/{did} per detall (NodeView fallback).
//
// Decisions @alvaro:
//   1. Funding · wallet SOS prepagat (NO credit card direct)
//   8. Pricing · 0.05€ publish · 0.05€ revoke · verify+discovery FREE
// =============================================================================

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import {
    PUBLIC_REGISTRY_TYPE,
    syncFromPermaweb,
    getCachedRegistry,
    DEFAULT_TTL_MS,
    verifyRegistryEntry,
} from '../core/publicRegistryService.js';

function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

// Gradient per avatar derivat del DID (hash deterministic)
function _gradientForDid(did) {
    if (!did) return 'linear-gradient(135deg,#6366f1,#a855f7)';
    let h1 = 0, h2 = 0;
    for (let i = 0; i < did.length; i++) {
        h1 = (h1 * 31 + did.charCodeAt(i)) % 360;
        h2 = (h2 * 17 + did.charCodeAt(i)) % 360;
    }
    return `linear-gradient(135deg, hsl(${h1},60%,55%), hsl(${h2},60%,45%))`;
}

function _initialsForName(name) {
    if (!name) return '?';
    return name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default class RegistryView {
    constructor() {
        document.title = 'Registre públic · SOS V11';
        this._entries = [];
        this._filter = '';
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
            .rg-hero p  { color:var(--text-muted); font-size:var(--text-sm); margin-top:6px; line-height:1.6; max-width:780px; }
            .rg-stats { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:10px; margin:14px 0 18px; }
            .rg-stat { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:var(--radius-md); padding:10px 14px; box-shadow:var(--shadow-sm); }
            .rg-stat-label { font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; font-weight:600; font-family:var(--font-mono); }
            .rg-stat-value { font-size:1.4rem; font-weight:700; color:var(--text-main); font-family:var(--font-mono); margin-top:4px; }
            .rg-search { display:flex; gap:8px; margin-bottom:1rem; align-items:center; flex-wrap:wrap; }
            .rg-search input { flex:1; min-width:240px; background:var(--bg-elevated); border:1px solid var(--border-default); color:var(--text-main); padding:8px 12px; border-radius:var(--radius-md); font-size:var(--text-sm); outline:none; }
            .rg-search input:focus { border-color:var(--accent-indigo); box-shadow:var(--shadow-focus); }
            .rg-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; }
            .rg-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:var(--radius-lg); padding:14px; text-decoration:none; color:var(--text-main); display:flex; flex-direction:column; gap:10px; box-shadow:var(--shadow-sm); transition:all var(--dur-fast); }
            .rg-card:hover { transform:translateY(-1px); border-color:var(--accent-indigo); }
            .rg-card.revoked { opacity:0.55; border-color:rgba(239,68,68,0.30); }
            .rg-card-head { display:flex; align-items:center; gap:10px; }
            .rg-avatar { width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.95rem; font-weight:800; flex-shrink:0; box-shadow:var(--shadow-sm); }
            .rg-card-info { min-width:0; flex:1; }
            .rg-card-name { font-size:var(--text-sm); font-weight:700; color:var(--text-main); line-height:1.2; }
            .rg-card-handle { font-size:var(--text-xs); color:var(--text-muted); font-family:var(--font-mono); margin-top:2px; }
            .rg-card-bio { font-size:12px; color:var(--text-secondary); line-height:1.45; min-height:32px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
            .rg-card-chips { display:flex; flex-wrap:wrap; gap:4px; }
            .rg-chip { font-size:10px; padding:2px 7px; border-radius:999px; background:rgba(99,102,241,0.10); color:var(--accent-indigo); font-weight:600; }
            .rg-chip.sector { background:rgba(16,185,129,0.10); color:var(--accent-green); }
            .rg-card-foot { display:flex; align-items:center; justify-content:space-between; padding-top:6px; border-top:1px solid var(--border-subtle); font-size:10px; color:var(--text-muted); font-family:var(--font-mono); }
            .rg-badge-verified { color:var(--accent-green); font-weight:700; }
            .rg-badge-unverified { color:var(--accent-orange); font-weight:700; }
            .rg-badge-revoked { color:var(--accent-red); font-weight:700; }
            .rg-empty { text-align:center; padding:3rem 1rem; color:var(--text-muted); border:1px dashed var(--border-default); border-radius:var(--radius-md); }
            .rg-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:var(--bg-panel); border:1px solid var(--border-default); color:var(--text-main); padding:12px 18px; border-radius:var(--radius-md); box-shadow:var(--shadow-lg); font-size:var(--text-sm); font-weight:600; z-index:9999; }
        </style>

        <div class="rg-shell">
            <div class="rg-topbar">
                <span class="rg-title">🌐 Registre públic SOS · permaweb</span>
                <div class="rg-spacer"></div>
                <button class="rg-btn rg-btn-primary" id="rgSyncBtn" title="Refresca des de permaweb · gratis (només lectura)">↻ Sync des de permaweb</button>
            </div>
            <div class="rg-main">
                <header class="rg-hero">
                    <h1>🌐 Registre públic · Permaweb</h1>
                    <p>Catàleg descentralitzat d'operadors SOS · cada entry està signat amb ECDSA P-256 i emmagatzemat al permaweb Arweave (indestructible). Verify és gratis · publica el teu perfil per 0,05€ una sola vegada des de <a href="/identity" data-link style="color:var(--accent-indigo);">/identity</a>. <strong>Discovery i verify són sempre free</strong>.</p>
                </header>
                <div class="rg-stats" id="rgStats"></div>
                <div class="rg-search">
                    <input type="search" id="rgSearch" placeholder="🔍 Cerca per handle · displayName · skill · sector" autocomplete="off">
                </div>
                <div id="rgList" class="rg-grid">
                    <div class="rg-empty">Carregant entries del cache local…</div>
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
            this._render();
        });
    }

    async _loadFromCache() {
        try {
            this._entries = await getCachedRegistry({ maxAge: DEFAULT_TTL_MS * 24 });
        } catch (e) {
            this._entries = [];
            console.warn('[registry] getCachedRegistry failed', e);
        }
        this._render();
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

    _render() {
        const stats = document.getElementById('rgStats');
        const list  = document.getElementById('rgList');
        if (!stats || !list) return;
        const filtered = this._applyFilter(this._entries);
        const verified = filtered.filter(e => e._verified !== false && !e._revoked).length;
        const revoked  = filtered.filter(e => e._revoked).length;
        stats.innerHTML = `
            <div class="rg-stat"><div class="rg-stat-label">Total cache</div><div class="rg-stat-value">${this._entries.length}</div></div>
            <div class="rg-stat"><div class="rg-stat-label">Filtrades</div><div class="rg-stat-value">${filtered.length}</div></div>
            <div class="rg-stat"><div class="rg-stat-label">Verificades</div><div class="rg-stat-value" style="color:var(--accent-green);">${verified}</div></div>
            <div class="rg-stat"><div class="rg-stat-label">Revocades</div><div class="rg-stat-value" style="color:var(--accent-red);">${revoked}</div></div>
        `;
        if (filtered.length === 0) {
            list.innerHTML = '<div class="rg-empty">'
                + (this._entries.length === 0
                    ? 'Cap entry al cache · prem ↻ Sync per descobrir del permaweb'
                    : 'Cap entry coincideix amb el filtre · prova un terme més general')
                + '</div>';
            return;
        }
        list.innerHTML = filtered.map(e => this._cardHtml(e)).join('');
    }

    _applyFilter(entries) {
        if (!this._filter) return entries;
        const q = this._filter;
        return entries.filter(e => {
            const c = e?.content || {};
            const haystack = [
                c.handle, c.displayName, c.bio,
                c.did, c.guardianOf,
                ...(c.skillsDeclared || []),
                ...(c.sectorsExperience || []),
            ].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(q);
        });
    }

    _cardHtml(e) {
        const c = e?.content || {};
        const did = c.did || '';
        const initials = _initialsForName(c.displayName || c.handle || '?');
        const gradient = _gradientForDid(did);
        const skills = (c.skillsDeclared || []).slice(0, 4);
        const sectors = (c.sectorsExperience || []).slice(0, 4);
        const isRevoked = !!e._revoked;
        const verifyStatus = isRevoked
            ? '<span class="rg-badge-revoked">✕ Revocada</span>'
            : (e._verified === false
                ? '<span class="rg-badge-unverified">⚠ No verificada</span>'
                : '<span class="rg-badge-verified">✓ Verificada</span>');
        const cls = isRevoked ? 'rg-card revoked' : 'rg-card';
        const href = '/n/' + encodeURIComponent(e.id);
        return `
            <a class="${cls}" href="${href}" data-link>
                <div class="rg-card-head">
                    <div class="rg-avatar" style="background:${gradient};">${escapeHtml(initials)}</div>
                    <div class="rg-card-info">
                        <div class="rg-card-name">${escapeHtml(c.displayName || 'Operador')}</div>
                        <div class="rg-card-handle">${escapeHtml(c.handle || c.did || '')}</div>
                    </div>
                </div>
                ${c.bio ? `<div class="rg-card-bio">${escapeHtml(c.bio)}</div>` : '<div class="rg-card-bio" style="opacity:0.5;">— sense bio —</div>'}
                <div class="rg-card-chips">
                    ${skills.map(s => `<span class="rg-chip">🧠 ${escapeHtml(s)}</span>`).join('')}
                    ${sectors.map(s => `<span class="rg-chip sector">🌐 ${escapeHtml(s)}</span>`).join('')}
                </div>
                <div class="rg-card-foot">
                    <span>${c.arweaveTxId ? '🌐 ' + c.arweaveTxId.slice(0, 8) + '…' : '(local)'}</span>
                    ${verifyStatus}
                </div>
            </a>
        `;
    }
}
