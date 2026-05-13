// =============================================================================
// TEAMTOWERS SOS V11 — OPPORTUNITIES VIEW (FUND-FLOW-001 sprint F)
// Ruta: /opportunities
//
// Federation · llistat de projectes públics descobribles via permaweb ·
// cada un porta nom · descripció · sectorId · projectType · skills/sectors
// que busca · stakeholders count · ownerDid · arweaveTxId. Click → detail.
//
// Cache local al KB amb TTL · sync amb permaweb gratis (només GraphQL).
// =============================================================================

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import {
    PUBLIC_PROJECT_TYPE, projectRegistryEntryIdFor,
} from '../core/publicProjectService.js';
// PUBLISH-SELECT-001 sprint A · tabs per a noves entitats públiques
import {
    PUBLIC_WORK_ORDER_TYPE, PUBLIC_MARKET_ITEM_TYPE, PUBLIC_WORKSHOP_TYPE,
} from '../core/publicEntityService.js';
// PR-K · CV nodals · neural_path_bundle publicat al permaweb
import { NEURAL_PATH_BUNDLE_TYPE } from '../core/neuralPathService.js';
// TRUST-001 · trust score badges per a cards
import { computeTrustForBatch, renderTrustBadgeHtml } from '../core/trustScoreService.js';

// Mapeig tab → public type · ORDER importa per a la UI
const TAB_DEFS = Object.freeze([
    { id: 'projects',  type: PUBLIC_PROJECT_TYPE,    icon: '🏛', label: 'Projectes' },
    { id: 'workorders', type: PUBLIC_WORK_ORDER_TYPE, icon: '📋', label: 'Work Orders' },
    { id: 'market',    type: PUBLIC_MARKET_ITEM_TYPE, icon: '🛍', label: 'Productes' },
    { id: 'workshops', type: PUBLIC_WORKSHOP_TYPE,    icon: '🎓', label: 'Workshops' },
    { id: 'cvnodals',  type: NEURAL_PATH_BUNDLE_TYPE, icon: '🧠', label: 'CV nodals' },
]);

function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

function _gradientForId(id) {
    if (!id) return 'linear-gradient(135deg,#6366f1,#a855f7)';
    let h1 = 0, h2 = 0;
    for (let i = 0; i < id.length; i++) {
        h1 = (h1 * 31 + id.charCodeAt(i)) % 360;
        h2 = (h2 * 17 + id.charCodeAt(i)) % 360;
    }
    return `linear-gradient(135deg, hsl(${h1},55%,50%), hsl(${h2},55%,40%))`;
}

export default class OpportunitiesView {
    constructor() {
        document.title = 'Oportunitats · Permaweb · SOS V11';
        this._entriesByTab = { projects: [], workorders: [], market: [], workshops: [], cvnodals: [] };
        this._filter  = '';
        this._syncing = false;
        // PUBLISH-SELECT-001 · activeTab des de URL ?tab=workorders, default projects
        const params = new URLSearchParams(window.location.search || '');
        const tabParam = params.get('tab');
        this._activeTab = TAB_DEFS.find(t => t.id === tabParam) ? tabParam : 'projects';
    }
    // Helper · accés al cache del tab actiu
    get _entries() { return this._entriesByTab[this._activeTab] || []; }

    async getHtml() {
        await store.init();
        await KB.init();
        return `
        <style>
            .op-shell  { height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); display:flex; flex-direction:column; overflow:hidden; }
            .op-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-shrink:0; flex-wrap:wrap; min-height:48px; }
            .op-title  { color:var(--text-secondary); font-weight:600; letter-spacing:0.05em; text-transform:uppercase; font-size:0.78rem; }
            .op-spacer { flex:1; }
            .op-btn    { background:var(--bg-elevated); color:var(--text-main); border:1px solid var(--border-default); padding:6px 12px; border-radius:var(--radius-sm); cursor:pointer; font-size:var(--text-xs); font-weight:600; font-family:var(--font-base); transition:all var(--dur-fast); }
            .op-btn:hover { background:var(--glass-hover); border-color:var(--accent-indigo); }
            .op-btn-primary { background:var(--accent-indigo); border-color:var(--accent-indigo); color:#fff; }
            .op-btn-primary:hover { filter:brightness(1.10); color:#fff; }
            .op-main { padding:1.5rem; flex:1; overflow-y:auto; max-width:1200px; margin:0 auto; width:100%; box-sizing:border-box; }
            .op-hero { margin-bottom:1.4rem; }
            .op-hero h1 { font-size:1.6rem; font-weight:800; letter-spacing:-0.02em; color:var(--text-main); margin:0; }
            .op-hero p  { color:var(--text-muted); font-size:var(--text-sm); margin-top:6px; line-height:1.6; max-width:780px; }
            .op-stats { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:10px; margin:14px 0 18px; }
            .op-stat { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:var(--radius-md); padding:10px 14px; box-shadow:var(--shadow-sm); }
            .op-stat-label { font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; font-weight:600; font-family:var(--font-mono); }
            .op-stat-value { font-size:1.4rem; font-weight:700; color:var(--text-main); font-family:var(--font-mono); margin-top:4px; }
            .op-search { display:flex; gap:8px; margin-bottom:1rem; align-items:center; flex-wrap:wrap; }
            .op-search input { flex:1; min-width:240px; background:var(--bg-elevated); border:1px solid var(--border-default); color:var(--text-main); padding:8px 12px; border-radius:var(--radius-md); font-size:var(--text-sm); outline:none; }
            .op-search input:focus { border-color:var(--accent-indigo); box-shadow:var(--shadow-focus); }
            .op-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:12px; }
            .op-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:var(--radius-lg); padding:14px; text-decoration:none; color:var(--text-main); display:flex; flex-direction:column; gap:10px; box-shadow:var(--shadow-sm); transition:all var(--dur-fast); }
            .op-card:hover { transform:translateY(-1px); border-color:var(--accent-indigo); }
            .op-card-head { display:flex; align-items:center; gap:10px; }
            .op-emblem { width:44px; height:44px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; color:#fff; font-size:1.1rem; font-weight:800; flex-shrink:0; box-shadow:var(--shadow-sm); }
            .op-card-info { min-width:0; flex:1; }
            .op-card-name { font-size:var(--text-md); font-weight:700; color:var(--text-main); line-height:1.2; }
            .op-card-sub { font-size:var(--text-xs); color:var(--text-muted); font-family:var(--font-mono); margin-top:2px; }
            .op-card-desc { font-size:13px; color:var(--text-secondary); line-height:1.45; min-height:36px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; }
            .op-card-chips { display:flex; flex-wrap:wrap; gap:4px; }
            .op-chip { font-size:10px; padding:3px 8px; border-radius:999px; background:rgba(99,102,241,0.10); color:var(--accent-indigo); font-weight:600; }
            .op-chip.sector { background:rgba(16,185,129,0.10); color:var(--accent-green); }
            .op-chip.skill  { background:rgba(168,85,247,0.10); color:var(--accent-purple); }
            .op-card-foot { display:flex; align-items:center; justify-content:space-between; padding-top:6px; border-top:1px solid var(--border-subtle); font-size:10px; color:var(--text-muted); font-family:var(--font-mono); }
            .op-empty { text-align:center; padding:3rem 1rem; color:var(--text-muted); border:1px dashed var(--border-default); border-radius:var(--radius-md); }
            .op-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:var(--bg-panel); border:1px solid var(--border-default); color:var(--text-main); padding:12px 18px; border-radius:var(--radius-md); box-shadow:var(--shadow-lg); font-size:var(--text-sm); font-weight:600; z-index:9999; }
        </style>

        <div class="op-shell">
            <div class="op-topbar">
                <span class="op-title">🚀 Oportunitats · Federation Permaweb</span>
                <div class="op-spacer"></div>
                <button class="op-btn op-btn-primary" id="opSyncBtn">↻ Sync des de permaweb</button>
            </div>
            <div class="op-main">
                <header class="op-hero">
                    <h1>🚀 Oportunitats al permaweb</h1>
                    <p>Descobreix <strong>projectes</strong>, <strong>work orders obertes</strong>, <strong>productes</strong> i <strong>workshops</strong> publicats per altres operadors SOS · ownerDid verificable + signatura ECDSA · <strong>Discovery i verify sempre free</strong> · publish costa 0,02-0,05€ per entitat des del wallet del projecte (Free pla ×1.5 fee).</p>
                </header>
                <!-- PUBLISH-SELECT-001 · tabs per tipus de contingut públic -->
                <div class="op-tabs" style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;border-bottom:1px solid var(--border-default);padding-bottom:6px;">
                    ${TAB_DEFS.map(t => `<button class="op-tab" data-op-tab="${t.id}" style="background:${this._activeTab === t.id ? 'var(--accent-indigo)' : 'transparent'};color:${this._activeTab === t.id ? '#fff' : 'var(--text-secondary)'};border:1px solid ${this._activeTab === t.id ? 'var(--accent-indigo)' : 'var(--border-default)'};padding:6px 14px;border-radius:var(--radius-sm);cursor:pointer;font-size:0.82rem;font-weight:700;font-family:var(--font-base);">${t.icon} ${t.label}</button>`).join('')}
                </div>
                <div class="op-stats" id="opStats"></div>
                <div class="op-search">
                    <input type="search" id="opSearch" placeholder="🔍 Cerca per títol · descripció · sector · skill · status" autocomplete="off">
                </div>
                <div id="opList" class="op-grid">
                    <div class="op-empty">Carregant del cache local…</div>
                </div>
            </div>
        </div>
        `;
    }

    async afterRender() {
        await this._loadFromCache();
        document.getElementById('opSyncBtn')?.addEventListener('click', () => this._sync());
        document.getElementById('opSearch')?.addEventListener('input', e => {
            this._filter = e.target.value.toLowerCase().trim();
            this._render();
        });
        // PUBLISH-SELECT-001 · tabs · canviar entitat type
        document.querySelectorAll('[data-op-tab]').forEach(btn => {
            btn.addEventListener('click', () => this._switchTab(btn.getAttribute('data-op-tab')));
        });
        // PROJ-VERSIONING-001 sprint D · async fetch latest version per card
        // (cache TTL 15min · NO bloca render · update banner inline si latest > current)
        this._checkLatestVersions().catch(e => console.warn('[opportunities] latest check', e?.message));
    }

    // PUBLISH-SELECT-001 · canvi de tab · update URL · re-render header + grid
    async _switchTab(tabId) {
        if (!TAB_DEFS.find(t => t.id === tabId)) return;
        if (this._activeTab === tabId) return;
        this._activeTab = tabId;
        try {
            const url = new URL(window.location.href);
            if (tabId === 'projects') url.searchParams.delete('tab');
            else url.searchParams.set('tab', tabId);
            window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
        } catch (_) {}
        // Re-pinta tabs visualment (sense full re-render)
        document.querySelectorAll('[data-op-tab]').forEach(btn => {
            const isActive = btn.getAttribute('data-op-tab') === tabId;
            btn.style.background = isActive ? 'var(--accent-indigo)' : 'transparent';
            btn.style.color      = isActive ? '#fff' : 'var(--text-secondary)';
            btn.style.borderColor= isActive ? 'var(--accent-indigo)' : 'var(--border-default)';
        });
        this._render();
    }

    async _checkLatestVersions() {
        if (!Array.isArray(this._entries) || this._entries.length === 0) return;
        const { getLatestVersionCached } = await import('../core/publicProjectService.js');
        for (const slot of document.querySelectorAll('[data-update-slot]')) {
            const projectId = slot.getAttribute('data-update-slot');
            const currentVersion = parseInt(slot.getAttribute('data-current-version') || '1', 10);
            const currentTx      = slot.getAttribute('data-current-tx') || '';
            if (!projectId) continue;
            try {
                const latest = await getLatestVersionCached({ projectId });
                if (!latest || !latest.entryVersion) continue;
                if (latest.entryVersion > currentVersion && latest.txId && latest.txId !== currentTx) {
                    slot.style.display = 'inline-flex';
                    slot.innerHTML = `<a href="https://arweave.net/${encodeURIComponent(latest.txId)}" target="_blank" rel="noopener" title="Veure v${latest.entryVersion} a Arweave (gateway)" style="display:inline-flex;align-items:center;gap:3px;padding:1px 7px;border-radius:999px;background:rgba(0,230,118,0.12);color:#00e676;border:1px solid rgba(0,230,118,0.30);font-size:10px;font-weight:800;font-family:var(--font-mono);text-decoration:none;">🆕 v${latest.entryVersion}</a>`;
                }
            } catch (_) { /* silent · gateway pot estar caigut */ }
        }
    }

    async _loadFromCache() {
        // PR-K · carrega cache dels 5 tabs en paral·lel · CV nodals filtrats
        // a sols els publicats (arweaveTxId · ja són públics a la xarxa).
        try {
            const [projects, workorders, market, workshops, cvnodalsRaw] = await Promise.all(
                TAB_DEFS.map(t => KB.query({ type: t.type }).catch(() => []))
            );
            // CV nodals · sols els publicats al permaweb (filtra els privats del propi usuari)
            const cvnodals = (cvnodalsRaw || []).filter(n => !!n?.content?.arweaveTxId);
            this._entriesByTab = {
                projects, workorders, market, workshops, cvnodals,
            };
        } catch (e) {
            this._entriesByTab = { projects: [], workorders: [], market: [], workshops: [], cvnodals: [] };
            console.warn('[opportunities] KB.query failed', e);
        }
        // TRUST-001 · pre-compute trust scores per a tots els ids visibles
        // (1 query global + filtre per id · més eficient que N queries)
        try {
            const allIds = [];
            for (const arr of Object.values(this._entriesByTab)) {
                for (const e of (arr || [])) {
                    if (e?.id) allIds.push(e.id);
                    // Projecte attestation pot referenciar projectId (no entry id)
                    const pid = e?.content?.projectId;
                    if (pid && !allIds.includes(pid)) allIds.push(pid);
                }
            }
            this._trustByAttestedId = await computeTrustForBatch({ kb: KB, attestedIds: allIds });
        } catch (_) { this._trustByAttestedId = {}; }
        this._render();
    }

    async _sync() {
        if (this._syncing) return;
        this._syncing = true;
        const btn = document.getElementById('opSyncBtn');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Sincronitzant…'; }
        try {
            // Reuse el sync mechanism del publicRegistryService però per a projects
            const { queryPermawebRegistry, fetchEntryByTxId } = await import('../core/publicRegistryService.js');
            const descs = await queryPermawebRegistry({ entryType: 'public-project-entry', first: 50 });
            let cached = 0;
            for (const d of descs) {
                try {
                    const { entry } = await fetchEntryByTxId(d.txId);
                    if (entry && entry.type === PUBLIC_PROJECT_TYPE) {
                        await KB.upsert({
                            ...entry,
                            content: { ...entry.content, _cachedAt: Date.now(), _fromPermaweb: true },
                            updatedAt: Date.now(),
                        });
                        cached++;
                    }
                } catch (e) { console.warn('[opportunities] fetch failed', d.txId, e); }
            }
            await this._loadFromCache();
            this._toast(`✓ ${descs.length} oportunitats trobades · ${cached} al cache`);
        } catch (e) {
            console.error('[opportunities] sync failed', e);
            this._toast('✗ Sync ha fallat: ' + (e?.message || 'error'));
        }
        if (btn) { btn.disabled = false; btn.textContent = '↻ Sync des de permaweb'; }
        this._syncing = false;
    }

    _toast(msg) {
        const t = document.createElement('div');
        t.className = 'op-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2800);
    }

    _render() {
        const stats = document.getElementById('opStats');
        const list  = document.getElementById('opList');
        if (!stats || !list) return;
        const filtered = this._applyFilter(this._entries);

        // Stats per tab · projects té sectors+skills, els altres tenen counts per status/kind/tier
        let statsHtml;
        if (this._activeTab === 'projects') {
            const sectors = new Set(); const skills = new Set();
            for (const e of filtered) {
                const c = e?.content || {};
                if (c.sectorId) sectors.add(c.sectorId);
                (c.lookingForSkills || []).forEach(s => skills.add(s));
            }
            statsHtml = `
                <div class="op-stat"><div class="op-stat-label">Total cache</div><div class="op-stat-value">${this._entries.length}</div></div>
                <div class="op-stat"><div class="op-stat-label">Filtrades</div><div class="op-stat-value">${filtered.length}</div></div>
                <div class="op-stat"><div class="op-stat-label">Sectors únics</div><div class="op-stat-value">${sectors.size}</div></div>
                <div class="op-stat"><div class="op-stat-label">Skills demanades</div><div class="op-stat-value">${skills.size}</div></div>
            `;
        } else if (this._activeTab === 'workorders') {
            const skills = new Set(); let openCount = 0;
            for (const e of filtered) {
                const c = e?.content || {};
                (c.lookingForSkills || []).forEach(s => skills.add(s));
                if (c.status === 'backlog' || c.status === 'doing') openCount++;
            }
            statsHtml = `
                <div class="op-stat"><div class="op-stat-label">Total WOs</div><div class="op-stat-value">${this._entries.length}</div></div>
                <div class="op-stat"><div class="op-stat-label">Filtrades</div><div class="op-stat-value">${filtered.length}</div></div>
                <div class="op-stat"><div class="op-stat-label">Obertes</div><div class="op-stat-value" style="color:#22c55e;">${openCount}</div></div>
                <div class="op-stat"><div class="op-stat-label">Skills cercades</div><div class="op-stat-value">${skills.size}</div></div>
            `;
        } else if (this._activeTab === 'market') {
            const kinds = new Set(); let totalEur = 0;
            for (const e of filtered) {
                const c = e?.content || {};
                if (c.kind) kinds.add(c.kind);
                if (typeof c.priceEur === 'number') totalEur += c.priceEur;
            }
            statsHtml = `
                <div class="op-stat"><div class="op-stat-label">Total productes</div><div class="op-stat-value">${this._entries.length}</div></div>
                <div class="op-stat"><div class="op-stat-label">Filtrats</div><div class="op-stat-value">${filtered.length}</div></div>
                <div class="op-stat"><div class="op-stat-label">Tipus</div><div class="op-stat-value">${kinds.size}</div></div>
                <div class="op-stat"><div class="op-stat-label">Valor agregat</div><div class="op-stat-value">${totalEur.toFixed(0)}€</div></div>
            `;
        } else if (this._activeTab === 'workshops') {
            const tiers = new Set();
            for (const e of filtered) {
                const c = e?.content || {};
                if (c.accessTier) tiers.add(c.accessTier);
            }
            statsHtml = `
                <div class="op-stat"><div class="op-stat-label">Total workshops</div><div class="op-stat-value">${this._entries.length}</div></div>
                <div class="op-stat"><div class="op-stat-label">Filtrats</div><div class="op-stat-value">${filtered.length}</div></div>
                <div class="op-stat"><div class="op-stat-label">Tiers</div><div class="op-stat-value">${tiers.size}</div></div>
                <div class="op-stat"><div class="op-stat-label">—</div><div class="op-stat-value">·</div></div>
            `;
        } else if (this._activeTab === 'cvnodals') {
            // PR-K · stats CV nodals · owners únics + intents + signed count
            const owners = new Set(); const intents = new Set(); let signedCount = 0;
            for (const e of filtered) {
                const c = e?.content || {};
                if (c.ownerHandle) owners.add(c.ownerHandle);
                if (c.intent)      intents.add(c.intent);
                if (c.signature)   signedCount++;
            }
            statsHtml = `
                <div class="op-stat"><div class="op-stat-label">CV nodals</div><div class="op-stat-value">${this._entries.length}</div></div>
                <div class="op-stat"><div class="op-stat-label">Filtrats</div><div class="op-stat-value">${filtered.length}</div></div>
                <div class="op-stat"><div class="op-stat-label">Owners únics</div><div class="op-stat-value">${owners.size}</div></div>
                <div class="op-stat"><div class="op-stat-label">🔐 firmats</div><div class="op-stat-value" style="color:#22c55e;">${signedCount}</div></div>
            `;
        }
        stats.innerHTML = statsHtml;

        if (filtered.length === 0) {
            const tabLabel = (TAB_DEFS.find(t => t.id === this._activeTab) || {}).label || this._activeTab;
            list.innerHTML = '<div class="op-empty">'
                + (this._entries.length === 0
                    ? 'Cap ' + tabLabel.toLowerCase() + ' al cache · prem ↻ Sync per descobrir del permaweb · publica des de <a href="/dashboard" data-link style="color:var(--accent-indigo);">Configuració del projecte → Publica continguts</a>'
                    : 'Cap entrada coincideix amb el filtre · prova un terme més general')
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
            // PUBLISH-SELECT-001 · cobertura per a 4 entity types · field set unificat
            const hay = [
                c.name, c.title, c.description, c.sectorId, c.sectorTT, c.projectType,
                c.subtype, c.ownerDid, c.kind, c.status, c.accessTier, c.cnae, c.type,
                ...(c.lookingForSkills || []),
                ...(c.lookingForSectors || []),
                ...(c.tags || []),
                ...(c.deliverables || []),
            ].filter(Boolean).join(' ').toLowerCase();
            return hay.includes(q);
        });
    }

    // PUBLISH-SELECT-001 · render cards segons activeTab
    _cardHtml(e) {
        if (this._activeTab === 'workorders') return this._cardHtmlWorkOrder(e);
        if (this._activeTab === 'market')     return this._cardHtmlMarket(e);
        if (this._activeTab === 'workshops')  return this._cardHtmlWorkshop(e);
        if (this._activeTab === 'cvnodals')   return this._cardHtmlCvNodal(e);
        return this._cardHtmlProject(e);
    }

    _cardHtmlProject(e) {
        const c = e?.content || {};
        const initials = (c.name || c.projectId || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const gradient = _gradientForId(c.projectId || c.ownerDid || '');
        const skills = (c.lookingForSkills || []).slice(0, 3);
        const sectors = (c.lookingForSectors || []).slice(0, 3);
        const tx = c.arweaveTxId;
        // FOUNDER-001 sprint C · detect founder template + clone CTA
        const isFounder = c.template === 'founder' || c.projectType === 'foundational-network';
        const founderBadge = isFounder
            ? `<div style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:rgba(168,85,247,0.15);color:#a855f7;border:1px solid rgba(168,85,247,0.40);font-size:10px;font-weight:700;margin-bottom:4px;">🌟 Founder template</div>`
            : '';
        const cloneBtn = (isFounder && c.templateClonable !== false)
            ? `<a href="/dashboard?wizard=founder" data-link style="background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;padding:4px 10px;border-radius:6px;font-size:10px;font-weight:700;text-decoration:none;">🔄 Clonar founder</a>`
            : '';
        // PROJ-VERSIONING-001 sprint D · version badge inline
        const ver = (typeof c.entryVersion === 'number' && c.entryVersion >= 1)
            ? `<span data-version-badge="${escapeHtml(c.projectId || '')}" style="display:inline-flex;align-items:center;gap:3px;padding:1px 7px;border-radius:999px;background:rgba(99,102,241,0.12);color:var(--accent-indigo);border:1px solid rgba(99,102,241,0.30);font-size:10px;font-weight:800;font-family:var(--font-mono);">v${c.entryVersion}</span>`
            : '';
        const updateSlot = c.projectId
            ? `<span data-update-slot="${escapeHtml(c.projectId)}" data-current-version="${c.entryVersion || 1}" data-current-tx="${escapeHtml(c.arweaveTxId || '')}" style="display:none;"></span>`
            : '';
        // TRUST-001 · badge inline derivat del cache pre-computat
        const trustProj = (this._trustByAttestedId || {})[c.projectId] || (this._trustByAttestedId || {})[e.id];
        const trustBadge = trustProj && trustProj.band !== 'none'
            ? renderTrustBadgeHtml(trustProj, { compact: true })
            : '';
        return `
            <a class="op-card" href="/n/${encodeURIComponent(e.id)}" data-link>
                <div class="op-card-head">
                    <div class="op-emblem" style="background:${gradient};">${escapeHtml(initials)}</div>
                    <div class="op-card-info">
                        ${founderBadge}
                        <div class="op-card-name" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">${escapeHtml(c.name || 'Projecte')}${ver}${updateSlot}${trustBadge}</div>
                        <div class="op-card-sub">
                            ${c.sectorId ? `sector ${escapeHtml(c.sectorId)}` : 'sense sector'}
                            ${c.projectType ? ` · ${escapeHtml(c.projectType)}` : ''}
                            ${typeof c.cohortNumber === 'number' ? ` · cohort ${c.cohortNumber}` : ''}
                        </div>
                    </div>
                </div>
                ${c.description ? `<div class="op-card-desc">${escapeHtml(c.description)}</div>` : '<div class="op-card-desc" style="opacity:0.5;">— sense descripció —</div>'}
                ${(skills.length > 0 || sectors.length > 0) ? `
                <div class="op-card-chips">
                    ${skills.map(s => `<span class="op-chip skill">🧠 ${escapeHtml(s)}</span>`).join('')}
                    ${sectors.map(s => `<span class="op-chip sector">🌐 ${escapeHtml(s)}</span>`).join('')}
                </div>` : ''}
                <div class="op-card-foot">
                    <span>${tx ? '🌐 ' + tx.slice(0, 10) + '…' : '(local)'}</span>
                    <div style="display:flex;align-items:center;gap:6px;">
                        ${cloneBtn}
                        <span>${typeof c.stakeholdersCount === 'number' ? c.stakeholdersCount + ' stakeholders' : ''}</span>
                    </div>
                </div>
            </a>
        `;
    }

    // PUBLISH-SELECT-001 · card per a Work Order
    _cardHtmlWorkOrder(e) {
        const c = e?.content || {};
        const title  = c.title || 'Work Order';
        const status = c.status || 'unknown';
        const statusColor = status === 'backlog' ? '#facc15' : (status === 'doing' ? '#3b82f6' : '#94a3b8');
        const skills = (c.lookingForSkills || []).slice(0, 5);
        const tx = c.arweaveTxId;
        const projectId = c.projectId || e.projectId;
        return `
            <a class="op-card" href="/n/${encodeURIComponent(e.id)}" data-link>
                <div class="op-card-head">
                    <div class="op-emblem" style="background:${_gradientForId(c.workOrderId || e.id)};">📋</div>
                    <div class="op-card-info">
                        <div style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:${statusColor}25;color:${statusColor};border:1px solid ${statusColor}50;font-size:10px;font-weight:700;margin-bottom:4px;">● ${escapeHtml(status)}</div>
                        <div class="op-card-name">${escapeHtml(title)}</div>
                        <div class="op-card-sub">
                            ${projectId ? 'Projecte ' + escapeHtml(String(projectId).slice(0, 16)) + '…' : '(sense projecte)'}
                            ${typeof c.estimatedHours === 'number' ? ' · ~' + c.estimatedHours + 'h' : ''}
                            ${typeof c.fmvPerHour === 'number' ? ' · ' + c.fmvPerHour + '€/h' : ''}
                            ${c.priority ? ` · pri ${escapeHtml(c.priority)}` : ''}
                        </div>
                    </div>
                </div>
                ${c.description ? `<div class="op-card-desc">${escapeHtml(c.description)}</div>` : ''}
                ${skills.length ? `<div class="op-card-chips">${skills.map(s => `<span class="op-chip skill">🧠 ${escapeHtml(s)}</span>`).join('')}</div>` : ''}
                <div class="op-card-foot">
                    <span>${tx ? '🌐 ' + tx.slice(0, 10) + '…' : '(local)'}</span>
                    <span>${c.deadline ? '⏰ ' + new Date(c.deadline).toLocaleDateString() : ''}</span>
                </div>
            </a>
        `;
    }

    // PUBLISH-SELECT-001 · card per a Market item
    _cardHtmlMarket(e) {
        const c = e?.content || {};
        const title = c.title || 'Producte';
        const kind  = c.kind  || 'service';
        const kindIcon = ({ service: '🛠', product: '📦', workshop: '🎓', skill: '🤲', template: '📋', subscription: '🔁' })[kind] || '✦';
        const tx = c.arweaveTxId;
        const projectId = c.projectId || e.projectId;
        return `
            <a class="op-card" href="/n/${encodeURIComponent(e.id)}" data-link>
                <div class="op-card-head">
                    <div class="op-emblem" style="background:${_gradientForId(c.itemId || e.id)};">${kindIcon}</div>
                    <div class="op-card-info">
                        <div style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:rgba(99,102,241,0.12);color:var(--accent-indigo);border:1px solid rgba(99,102,241,0.30);font-size:10px;font-weight:700;margin-bottom:4px;">${escapeHtml(kind)}</div>
                        <div class="op-card-name">${escapeHtml(title)}</div>
                        <div class="op-card-sub">
                            ${projectId ? 'Projecte ' + escapeHtml(String(projectId).slice(0, 16)) + '…' : ''}
                            ${typeof c.priceEur === 'number' ? ' · <strong style="color:#22c55e;">' + c.priceEur + '€</strong>' : ''}
                            ${c.cnae ? ` · CNAE ${escapeHtml(c.cnae)}` : ''}
                        </div>
                    </div>
                </div>
                ${c.description ? `<div class="op-card-desc">${escapeHtml(c.description)}</div>` : ''}
                ${Array.isArray(c.deliverables) && c.deliverables.length ? `<div class="op-card-chips">${c.deliverables.slice(0, 4).map(d => `<span class="op-chip skill">📦 ${escapeHtml(d)}</span>`).join('')}</div>` : ''}
                <div class="op-card-foot">
                    <span>${tx ? '🌐 ' + tx.slice(0, 10) + '…' : '(local)'}</span>
                    <span>${c.savingsCompareTo ? '💰 estalvi ' + escapeHtml(c.savingsCompareTo) : ''}</span>
                </div>
            </a>
        `;
    }

    // PUBLISH-SELECT-001 · card per a Workshop
    _cardHtmlWorkshop(e) {
        const c = e?.content || {};
        const title = c.title || 'Workshop';
        const tier  = c.accessTier || 'public';
        const tierColor = ({ public: '#22c55e', operator: '#3b82f6', matriu: '#a855f7', cohort: '#f59e0b' })[tier] || '#94a3b8';
        const tx = c.arweaveTxId;
        const projectId = c.projectId || e.projectId;
        return `
            <a class="op-card" href="/n/${encodeURIComponent(e.id)}" data-link>
                <div class="op-card-head">
                    <div class="op-emblem" style="background:${_gradientForId(c.workshopId || e.id)};">🎓</div>
                    <div class="op-card-info">
                        <div style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:${tierColor}25;color:${tierColor};border:1px solid ${tierColor}50;font-size:10px;font-weight:700;margin-bottom:4px;">tier · ${escapeHtml(tier)}</div>
                        <div class="op-card-name">${escapeHtml(title)}</div>
                        <div class="op-card-sub">
                            ${c.type ? escapeHtml(c.type) : ''}
                            ${c.sector ? ` · sector ${escapeHtml(c.sector)}` : ''}
                            ${typeof c.audienceSize === 'number' ? ` · ${c.audienceSize} pax` : ''}
                            ${typeof c.priceEur === 'number' ? ' · <strong style="color:#22c55e;">' + c.priceEur + '€</strong>' : ''}
                        </div>
                    </div>
                </div>
                ${c.description ? `<div class="op-card-desc">${escapeHtml(c.description)}</div>` : ''}
                <div class="op-card-foot">
                    <span>${tx ? '🌐 ' + tx.slice(0, 10) + '…' : '(local)'}</span>
                    <span>${c.date ? '📅 ' + new Date(c.date).toLocaleDateString() : ''}</span>
                </div>
            </a>
        `;
    }

    // PR-K · card per a neural_path_bundle publicat al permaweb
    _cardHtmlCvNodal(e) {
        const c = e?.content || {};
        const title  = c.name || 'CV nodal';
        const owner  = c.ownerHandle || '?';
        const intent = c.intent || null;
        const audience = c.audienceId || null;
        const tx     = c.arweaveTxId;
        const signed = !!c.signature;
        const stepCount = c.stepCount || 0;
        const publishedAt = c.permawebPublishedAt;
        // TRUST-001 · trust score del CV nodal (per attestedId = bundleId)
        const trustCv = (this._trustByAttestedId || {})[e.id];
        const trustBadge = trustCv && trustCv.band !== 'none'
            ? renderTrustBadgeHtml(trustCv, { compact: true })
            : '';
        return `
            <a class="op-card" href="/n/${encodeURIComponent(e.id)}" data-link>
                <div class="op-card-head">
                    <div class="op-emblem" style="background:${_gradientForId(owner)};">🧠</div>
                    <div class="op-card-info">
                        <div style="display:flex;gap:4px;align-items:center;margin-bottom:4px;flex-wrap:wrap;">
                            <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:rgba(168,85,247,0.15);color:var(--accent-purple);border:1px solid rgba(168,85,247,0.30);font-size:10px;font-weight:700;">${escapeHtml(owner)}</span>
                            ${signed ? '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 6px;border-radius:999px;background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.30);font-size:10px;font-weight:700;" title="ECDSA P-256 firmat">🔐</span>' : ''}
                            ${trustBadge}
                        </div>
                        <div class="op-card-name">${escapeHtml(title)}</div>
                        <div class="op-card-sub">
                            ${stepCount} steps nodals
                            ${intent ? ` · intent: ${escapeHtml(intent)}` : ''}
                            ${audience ? ` · audience: ${escapeHtml(audience)}` : ''}
                        </div>
                    </div>
                </div>
                <div class="op-card-desc" style="font-size:0.78rem;color:var(--text-muted);">
                    Context bundle publicat · curat com a flux de valor per a agents IA · CV nodal verificable
                </div>
                <div class="op-card-foot">
                    <span>${tx ? '🌐 ' + tx.slice(0, 10) + '…' : '(local)'}</span>
                    <span>${publishedAt ? '📅 ' + new Date(publishedAt).toLocaleDateString() : ''}</span>
                </div>
            </a>
        `;
    }
}
