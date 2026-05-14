// =============================================================================
// TEAMTOWERS SOS V11 — NEURAL PATH VIEW (NEURAL-PATH-001 sprint B)
// Ruta: /path
//
// Timeline d'activitat nodal de l'usuari + builder de context bundles
// per a alimentar agents IA amb context personalitzat.
//
// Seccions:
//   1. Hero · handle + stats by kind + filter bar
//   2. Timeline · llista last 100 steps amb checkbox per a selecció
//   3. Bundle builder · panel lateral amb nom + intent + audienceId + create
//   4. Bundles existents · llistat + view/copy context string
// =============================================================================

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import {
    NEURAL_PATH_STEP_TYPE, NEURAL_PATH_BUNDLE_TYPE,
    PATH_STEP_KINDS,
    queryStepsForOwner, buildContextBundle, resolveBundleSteps,
    renderBundleAsContextString, summarizeStepsByKind, summarizeStepsByProject,
} from '../core/neuralPathService.js';

function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
}

const KIND_ICON = Object.freeze({
    visit:    '👁',
    edit:     '✏',
    create:   '🆕',
    delete:   '🗑',
    'ai-fill':'🧠',
    publish:  '🚀',
    comment:  '💬',
    sign:     '🔏',
    transfer: '↔',
    apply:    '✓',
});

const KIND_COLOR = Object.freeze({
    visit:    '#94a3b8',
    edit:     '#facc15',
    create:   '#22c55e',
    delete:   '#ef4444',
    'ai-fill':'#a855f7',
    publish:  '#3b82f6',
    comment:  '#94a3b8',
    sign:     '#22c55e',
    transfer: '#a855f7',
    apply:    '#22c55e',
});

export default class NeuralPathView {
    constructor() {
        document.title = 'Path nodal · SOS V11';
        this._ownerHandle = null;
        this._steps = [];
        this._bundles = [];
        this._selectedStepIds = new Set();
        this._kindFilter = 'all';
        this._projectFilter = 'all';
    }

    async _loadData() {
        await store.init();
        await KB.init();
        const identities = await KB.query({ type: 'user_identity' }).catch(() => []);
        this._ownerHandle = identities[0]?.content?.handle || '@alvaro';
        this._steps = await queryStepsForOwner({ kb: KB, ownerHandle: this._ownerHandle, limit: 200 });
        const allBundles = await KB.query({ type: NEURAL_PATH_BUNDLE_TYPE }).catch(() => []);
        this._bundles = allBundles
            .filter(b => b?.content?.ownerHandle === this._ownerHandle)
            .sort((a, b) => (b?.content?.createdAt || 0) - (a?.content?.createdAt || 0));
    }

    async getHtml() {
        await this._loadData();
        const byKind = summarizeStepsByKind(this._steps);
        const byProj = summarizeStepsByProject(this._steps);
        const projectIds = Object.keys(byProj).filter(p => p !== 'no-project').sort();

        return `
        <style>
            .np-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); }
            .np-main  { max-width:1200px; margin:0 auto; padding:1.6rem; }
            .np-hero  { background:linear-gradient(135deg,rgba(168,85,247,0.08),rgba(99,102,241,0.05)); border:1px solid var(--border-default); border-left:3px solid var(--accent-purple); border-radius:var(--radius-lg); padding:1.4rem; margin-bottom:1.4rem; }
            .np-hero h1 { margin:0; color:var(--text-main); font-size:1.5rem; letter-spacing:-0.02em; }
            .np-hero p { color:var(--text-secondary); font-size:0.85rem; line-height:1.55; margin-top:0.5rem; max-width:760px; }
            .np-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:8px; margin-top:1rem; }
            .np-stat  { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:var(--radius-md); padding:8px 10px; text-align:center; }
            .np-stat .val { font-size:1.3rem; font-weight:800; font-family:var(--font-mono); color:var(--text-main); }
            .np-stat .lbl { font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em; }
            .np-grid  { display:grid; grid-template-columns:1fr 320px; gap:1.2rem; }
            @media (max-width:880px){ .np-grid{ grid-template-columns:1fr; } }
            .np-filters { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:0.9rem; }
            .np-filter { background:var(--bg-panel); color:var(--text-secondary); border:1px solid var(--border-default); border-radius:var(--radius-sm); padding:5px 12px; font-size:0.8rem; cursor:pointer; transition:all var(--dur-fast); }
            .np-filter:hover { color:var(--text-main); }
            .np-filter.active { background:var(--accent-purple); color:#fff; border-color:var(--accent-purple); }
            .np-timeline { display:flex; flex-direction:column; gap:6px; }
            .np-step { display:flex; align-items:center; gap:10px; padding:8px 12px; background:var(--bg-panel); border:1px solid var(--border-default); border-left:3px solid var(--step-c,#94a3b8); border-radius:var(--radius-md); cursor:pointer; transition:all var(--dur-fast); }
            .np-step:hover { transform:translateX(2px); border-left-width:5px; }
            .np-step.selected { background:rgba(168,85,247,0.10); border-color:var(--accent-purple); }
            .np-step input[type=checkbox] { cursor:pointer; }
            .np-step .icon { font-size:1.1rem; width:22px; flex-shrink:0; }
            .np-step .body { flex:1; min-width:0; }
            .np-step .summary { color:var(--text-main); font-size:0.86rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
            .np-step .meta { color:var(--text-muted); font-size:11px; font-family:var(--font-mono); margin-top:2px; }
            .np-step .ts { color:var(--text-muted); font-family:var(--font-mono); font-size:11px; flex-shrink:0; min-width:60px; text-align:right; }
            .np-side { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:var(--radius-lg); padding:1rem 1.1rem; position:sticky; top:1rem; align-self:start; }
            .np-side h2 { margin:0 0 0.6rem 0; font-size:1rem; color:var(--text-main); }
            .np-side h3 { margin:1rem 0 0.4rem; font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; }
            .np-side input, .np-side select { width:100%; background:var(--bg-elevated); color:var(--text-main); border:1px solid var(--border-default); border-radius:var(--radius-sm); padding:6px 8px; font-family:inherit; font-size:0.85rem; box-sizing:border-box; }
            .np-side .selcount { display:inline-block; background:rgba(168,85,247,0.15); color:var(--accent-purple); padding:3px 10px; border-radius:999px; font-size:0.75rem; font-weight:700; }
            .np-side .btn { background:var(--accent-purple); color:#fff; border:0; padding:8px 14px; border-radius:var(--radius-sm); cursor:pointer; font-weight:700; font-size:0.85rem; width:100%; }
            .np-side .btn:disabled { opacity:0.5; cursor:not-allowed; }
            .np-bundle { background:var(--bg-elevated); border:1px solid var(--border-default); border-radius:var(--radius-md); padding:8px 10px; margin-top:6px; font-size:0.78rem; }
            .np-bundle .name { color:var(--text-main); font-weight:700; }
            .np-bundle .meta { color:var(--text-muted); font-family:var(--font-mono); font-size:10px; margin-top:2px; }
            .np-bundle .actions { display:flex; gap:6px; margin-top:6px; flex-wrap:wrap; }
            .np-bundle .actions button { background:transparent; color:var(--accent-indigo); border:1px solid var(--accent-indigo); padding:2px 8px; border-radius:6px; cursor:pointer; font-size:10px; font-weight:700; }
        </style>

        <div class="np-shell">
            <div class="np-main">
                <header class="np-hero">
                    <h1>🧠 Path nodal · <code style="color:var(--accent-purple);">${esc(this._ownerHandle)}</code></h1>
                    <p>Historial nodal cronològic · cada visita, edició, generació IA i publicació queden registrades aquí com a steps. Curat un <strong>context bundle</strong> seleccionant steps + intents + audiència, i l'agent IA tindrà context personalitzat al teu CV nodal.</p>
                    <div class="np-stats">
                        <div class="np-stat"><div class="val">${this._steps.length}</div><div class="lbl">Steps totals</div></div>
                        <div class="np-stat"><div class="val">${byKind.visit || 0}</div><div class="lbl">👁 Visits</div></div>
                        <div class="np-stat"><div class="val">${byKind.edit || 0}</div><div class="lbl">✏ Edits</div></div>
                        <div class="np-stat"><div class="val">${byKind['ai-fill'] || 0}</div><div class="lbl">🧠 IA fills</div></div>
                        <div class="np-stat"><div class="val">${byKind.publish || 0}</div><div class="lbl">🚀 Publishes</div></div>
                        <div class="np-stat"><div class="val">${this._bundles.length}</div><div class="lbl">📦 Bundles</div></div>
                    </div>
                </header>

                <div class="np-grid">
                    <div>
                        <div class="np-filters">
                            <button class="np-filter ${this._kindFilter === 'all' ? 'active' : ''}" data-kind="all">tots</button>
                            ${Object.keys(PATH_STEP_KINDS).map(k => `<button class="np-filter ${this._kindFilter === k ? 'active' : ''}" data-kind="${k}">${KIND_ICON[k] || ''} ${k}</button>`).join('')}
                        </div>
                        ${projectIds.length > 0 ? `
                        <div class="np-filters">
                            <span style="color:var(--text-muted);font-size:11px;align-self:center;margin-right:4px;">projecte:</span>
                            <button class="np-filter ${this._projectFilter === 'all' ? 'active' : ''}" data-proj="all">tots</button>
                            ${projectIds.slice(0, 6).map(p => `<button class="np-filter ${this._projectFilter === p ? 'active' : ''}" data-proj="${esc(p)}">${esc(p.slice(0, 16))}…</button>`).join('')}
                        </div>` : ''}
                        <div id="npTimelineBody" class="np-timeline">${this._renderTimeline()}</div>
                    </div>

                    <aside class="np-side">
                        <h2>📦 Bundle builder</h2>
                        <div><span class="selcount" id="npSelCount">${this._selectedStepIds.size} steps</span></div>
                        <h3>Nom</h3>
                        <input id="npBundleName" type="text" placeholder="ex: Landing Q2 · cohort B" maxlength="120">
                        <h3>Intent</h3>
                        <select id="npBundleIntent">
                            <option value="">(cap)</option>
                            <option value="generate-landing">generate-landing</option>
                            <option value="estimate-effort">estimate-effort</option>
                            <option value="audit-quality">audit-quality</option>
                            <option value="onboarding-context">onboarding-context</option>
                            <option value="custom">custom (al meta)</option>
                        </select>
                        <h3>Audience</h3>
                        <select id="npBundleAudience">
                            <option value="">(cap)</option>
                            <option value="fundadors">fundadors</option>
                            <option value="equip">equip</option>
                            <option value="usuaris">usuaris</option>
                            <option value="inversors">inversors</option>
                            <option value="comunitat">comunitat</option>
                        </select>
                        <div style="margin-top:14px;">
                            <button id="npBundleCreate" class="btn" disabled>📦 Crear bundle</button>
                        </div>
                        <h3>Bundles existents (${this._bundles.length})</h3>
                        <div id="npBundlesList">${this._renderBundles()}</div>
                    </aside>
                </div>
            </div>
            <!-- Modal per a copiar el context string -->
            <div id="npBundleModalRoot"></div>
        </div>
        `;
    }

    _renderTimeline() {
        const filtered = this._steps.filter(s => {
            const c = s?.content || {};
            if (this._kindFilter !== 'all' && c.kind !== this._kindFilter) return false;
            if (this._projectFilter !== 'all' && c.projectId !== this._projectFilter) return false;
            return true;
        });
        if (filtered.length === 0) {
            return '<div style="padding:1.2rem;text-align:center;color:var(--text-muted);font-style:italic;">Cap step coincideix amb els filtres.</div>';
        }
        return filtered.slice(0, 100).map(s => {
            const c = s?.content || {};
            const sel = this._selectedStepIds.has(s.id);
            const when = c.ts ? new Date(c.ts).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '?';
            const ref  = c.refType && c.refId ? c.refType + '#' + String(c.refId).slice(0, 24) : (c.route || '·');
            const cost = c.meta && c.meta.costEur ? ' · ' + c.meta.costEur.toFixed(4) + '€' : '';
            return `<div class="np-step ${sel ? 'selected' : ''}" style="--step-c:${KIND_COLOR[c.kind] || '#94a3b8'};" data-step-id="${esc(s.id)}">
                <input type="checkbox" data-step-cb="${esc(s.id)}" ${sel ? 'checked' : ''}>
                <span class="icon">${KIND_ICON[c.kind] || '·'}</span>
                <div class="body">
                    <div class="summary">${esc(c.summary || c.kind + ' · ' + ref)}</div>
                    <div class="meta">${esc(c.kind)} · ${esc(ref)}${cost}${c.projectId ? ' · ' + esc(c.projectId.slice(0, 20)) : ''}</div>
                </div>
                <div class="ts">${esc(when)}</div>
            </div>`;
        }).join('');
    }

    _renderBundles() {
        if (this._bundles.length === 0) {
            return '<div style="color:var(--text-muted);font-style:italic;font-size:0.78rem;padding:6px 0;">Cap bundle encara · selecciona steps i crea\'n un.</div>';
        }
        return this._bundles.map(b => {
            const c = b?.content || {};
            const signed = !!c.signature;
            const pubd   = !!c.arweaveTxId;
            const sigBadge = signed
                ? '<span style="background:rgba(34,197,94,0.15);color:#22c55e;padding:1px 6px;border-radius:6px;font-size:9px;font-weight:700;" title="ECDSA P-256 · TEA-SIGN-001">🔐</span>'
                : '<span style="background:rgba(148,163,184,0.15);color:var(--text-muted);padding:1px 6px;border-radius:6px;font-size:9px;font-weight:700;" title="sense firma">·</span>';
            const pubBadge = pubd
                ? '<span style="background:rgba(99,102,241,0.15);color:var(--accent-indigo);padding:1px 6px;border-radius:6px;font-size:9px;font-weight:700;" title="Permaweb · ' + esc(c.arweaveTxId) + '">🌐</span>'
                : '';
            return `<div class="np-bundle">
                <div class="name">${esc(c.name || b.id)} ${sigBadge}${pubBadge}</div>
                <div class="meta">${c.stepCount || 0} steps · ${esc(c.intent || '—')} · ${esc(c.audienceId || '—')}</div>
                <div class="actions">
                    <button data-bundle-view="${esc(b.id)}">👁 Veure context</button>
                </div>
            </div>`;
        }).join('');
    }

    async afterRender() {
        document.querySelectorAll('[data-kind]').forEach(btn => {
            btn.addEventListener('click', () => {
                this._kindFilter = btn.getAttribute('data-kind');
                this._refreshTimeline();
                this._refreshFilters();
            });
        });
        document.querySelectorAll('[data-proj]').forEach(btn => {
            btn.addEventListener('click', () => {
                this._projectFilter = btn.getAttribute('data-proj');
                this._refreshTimeline();
                this._refreshFilters();
            });
        });
        this._bindStepCheckboxes();
        document.getElementById('npBundleCreate')?.addEventListener('click', () => this._handleCreateBundle());
        document.querySelectorAll('[data-bundle-view]').forEach(btn => {
            btn.addEventListener('click', () => this._handleViewBundle(btn.getAttribute('data-bundle-view')));
        });
    }

    _bindStepCheckboxes() {
        document.querySelectorAll('[data-step-cb]').forEach(cb => {
            cb.addEventListener('change', () => {
                const id = cb.getAttribute('data-step-cb');
                if (cb.checked) this._selectedStepIds.add(id);
                else this._selectedStepIds.delete(id);
                this._refreshSelCount();
                const card = cb.closest('.np-step');
                if (card) card.classList.toggle('selected', cb.checked);
            });
        });
    }

    _refreshFilters() {
        document.querySelectorAll('[data-kind]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-kind') === this._kindFilter);
        });
        document.querySelectorAll('[data-proj]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-proj') === this._projectFilter);
        });
    }

    _refreshTimeline() {
        const body = document.getElementById('npTimelineBody');
        if (body) body.innerHTML = this._renderTimeline();
        this._bindStepCheckboxes();
    }

    _refreshSelCount() {
        const el = document.getElementById('npSelCount');
        if (el) el.textContent = this._selectedStepIds.size + ' steps';
        const btn = document.getElementById('npBundleCreate');
        if (btn) btn.disabled = this._selectedStepIds.size === 0;
    }

    async _handleCreateBundle() {
        const name      = document.getElementById('npBundleName')?.value.trim();
        const intent    = document.getElementById('npBundleIntent')?.value || null;
        const audience  = document.getElementById('npBundleAudience')?.value || null;
        if (!name) { alert('Cal un nom per al bundle'); return; }
        if (this._selectedStepIds.size === 0) { alert('Selecciona almenys 1 step'); return; }
        try {
            let bundle = buildContextBundle({
                ownerHandle: this._ownerHandle,
                name,
                stepIds: Array.from(this._selectedStepIds),
                intent:  intent || null,
                audienceId: audience || null,
            });
            // TEA-SIGN-001 · auto-sign amb ECDSA P-256 si l'usuari té identitat
            try {
                const { getOrCreateIdentity } = await import('../core/identityService.js');
                const { getOrCreateSigningKey } = await import('../core/projectIO.js');
                const { signNode } = await import('../core/nodeSigningService.js');
                const identity = await getOrCreateIdentity();
                const did = identity?.content?.primaryDid || identity?.primaryDid;
                if (did) {
                    const keyMeta = await getOrCreateSigningKey();
                    // Afegir ownerDid + publicJwk al content abans de signar
                    bundle.content.ownerDid  = did;
                    bundle.content.publicJwk = { ...keyMeta.publicJwk };
                    delete bundle.content.publicJwk.d;
                    bundle = await signNode({ node: bundle, privateJwk: keyMeta.privateJwk });
                }
            } catch (e) {
                console.warn('[neural-path] sign failed · bundle persistit sense signatura', e?.message);
            }
            await KB.upsert(bundle);
            this._selectedStepIds.clear();
            await this._loadData();
            const app = document.getElementById('app');
            if (app) { app.innerHTML = await this.getHtml(); await this.afterRender(); }
        } catch (e) {
            alert('Error creant bundle: ' + (e?.message || e));
        }
    }

    async _handleViewBundle(bundleId) {
        try {
            const bundle = this._bundles.find(b => b.id === bundleId);
            if (!bundle) return;
            const resolved = await resolveBundleSteps({ kb: KB, bundle });
            const str = renderBundleAsContextString({ bundle, steps: resolved.steps, extraNodes: resolved.extraNodes });
            const root = document.getElementById('npBundleModalRoot');
            const c = bundle.content || {};
            const isPublished = !!c.arweaveTxId;
            const isSigned    = !!c.signature;
            root.innerHTML = `
                <div id="npModalBg" style="position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9990;display:flex;align-items:center;justify-content:center;padding:20px;">
                    <div style="background:var(--bg-panel);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:1.5rem;max-width:720px;width:100%;max-height:80vh;overflow:auto;color:var(--text-main);">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
                            <h2 style="margin:0;font-size:1.2rem;">📦 ${esc(c.name || bundleId)}</h2>
                            <div style="display:flex;gap:6px;align-items:center;">
                                ${isSigned ? '<span style="background:rgba(34,197,94,0.15);color:#22c55e;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;">🔐 firmat</span>' : ''}
                                ${isPublished ? '<span style="background:rgba(99,102,241,0.15);color:var(--accent-indigo);padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;" title="' + esc(c.arweaveTxId) + '">🌐 publicat</span>' : ''}
                                <code style="color:var(--accent-purple);font-size:11px;">${esc(bundleId)}</code>
                            </div>
                        </div>
                        <div style="color:var(--text-muted);font-size:11px;margin-bottom:10px;font-family:var(--font-mono);">
                            ${c.stepCount} steps · intent: ${esc(c.intent || '—')} · audience: ${esc(c.audienceId || '—')} · resolved: ${resolved.steps.length}/${c.stepCount || 0}${resolved.missing.length ? ' · missing: ' + resolved.missing.length : ''}
                        </div>
                        <pre id="npCtxString" style="background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-md);padding:12px;font-size:11px;font-family:var(--font-mono);white-space:pre-wrap;word-break:break-word;color:var(--text-secondary);max-height:50vh;overflow:auto;">${esc(str)}</pre>
                        <div id="npPublishStatus" style="margin-top:8px;font-size:11px;display:none;"></div>
                        <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end;flex-wrap:wrap;">
                            <button id="npModalCopy" style="background:var(--accent-purple);color:#fff;border:0;padding:8px 16px;border-radius:var(--radius-sm);cursor:pointer;font-weight:700;font-size:11px;">📋 Copiar context</button>
                            <button id="npModalUseAi" style="background:var(--accent-indigo);color:#fff;border:0;padding:8px 16px;border-radius:var(--radius-sm);cursor:pointer;font-weight:700;font-size:11px;">🧠 Usar a /quality</button>
                            ${isPublished
                                ? '<button id="npModalView" style="background:#22c55e;color:#fff;border:0;padding:8px 16px;border-radius:var(--radius-sm);cursor:pointer;font-weight:700;font-size:11px;">🌐 Veure al permaweb</button>'
                                : '<button id="npModalPublish" style="background:#22c55e;color:#fff;border:0;padding:8px 16px;border-radius:var(--radius-sm);cursor:pointer;font-weight:700;font-size:11px;" ' + (isSigned ? '' : 'disabled title="Cal firmar el bundle abans"') + '>🚀 Publicar CV nodal</button>'}
                            <button id="npModalClose" style="background:transparent;color:var(--text-muted);border:1px solid var(--border-default);padding:8px 16px;border-radius:var(--radius-sm);cursor:pointer;font-size:11px;">Tancar</button>
                        </div>
                    </div>
                </div>`;
            const close = () => { root.innerHTML = ''; };
            document.getElementById('npModalBg').addEventListener('click', e => { if (e.target.id === 'npModalBg') close(); });
            document.getElementById('npModalClose').addEventListener('click', close);
            document.getElementById('npModalCopy').addEventListener('click', async () => {
                try { await navigator.clipboard.writeText(str); document.getElementById('npModalCopy').textContent = '✓ Copiat!'; }
                catch (_) { document.getElementById('npModalCopy').textContent = '✗ no s\'ha pogut copiar'; }
            });
            document.getElementById('npModalUseAi').addEventListener('click', () => {
                // NEURAL-PATH-001 sprint B · linkable cap a /quality amb bundleId
                // a la URL · ProjectQualityView ho captura i ho injecta a extraContext.
                const projectFromSteps = resolved.steps.find(s => s?.content?.projectId)?.content?.projectId;
                if (!projectFromSteps) { alert('Cap step del bundle té projectId · no es pot anar a /quality.'); return; }
                const url = '/quality?project=' + encodeURIComponent(projectFromSteps) + '&bundleId=' + encodeURIComponent(bundleId);
                if (typeof window.navigateTo === 'function') window.navigateTo(url);
                else window.location.href = url;
            });
            // PR-J · publish CV nodal al permaweb
            document.getElementById('npModalPublish')?.addEventListener('click', () => this._handlePublishBundle(bundle));
            document.getElementById('npModalView')?.addEventListener('click', () => {
                const tx = bundle.content?.arweaveTxId;
                if (tx) window.open('https://arweave.net/' + encodeURIComponent(tx), '_blank', 'noopener');
            });
        } catch (e) {
            alert('Error: ' + (e?.message || e));
        }
    }

    // PR-J · publish bundle al permaweb · 0,04€ base (×1.5 fee free pla)
    // Sprint A · mock-first · marca arweaveTxId + permawebPublishedAt al
    // node KB. Sprint B · upload Turbo real.
    async _handlePublishBundle(bundle) {
        const status = document.getElementById('npPublishStatus');
        const btn    = document.getElementById('npModalPublish');
        const setStatus = (msg, ok = true) => {
            if (!status) return;
            status.style.display = 'block';
            status.textContent = msg;
            status.style.color = ok ? 'var(--accent-green)' : 'var(--accent-red)';
        };
        try {
            if (!bundle.content?.signature) {
                setStatus('✗ Bundle sense firma · re-crea el bundle (auto-sign requereix identitat)', false);
                return;
            }
            const { canPerform } = await import('../core/planEnforcer.js');
            const { loadCurrentPlan } = await import('../core/stripeService.js');
            const planObj = await loadCurrentPlan().catch(() => null);
            const planId  = planObj?.planId || 'free';
            const op = planId === 'free' ? 'permaweb-publish-paid' : 'permaweb-publish';
            const okPlan = canPerform({ planId, op });
            if (!okPlan.allowed) { setStatus('✗ Pla ' + planId + ' no permet publicar', false); return; }

            const { computePublishCost } = await import('../core/publicEntityService.js');
            const cost = computePublishCost({ kind: 'neural_path_bundle', planId });
            // Detect projecte associat al bundle (primer step amb projectId · fallback __personal_handle__)
            const { resolveBundleSteps } = await import('../core/neuralPathService.js');
            const resolved = await resolveBundleSteps({ kb: KB, bundle });
            const projectId = resolved.steps.find(s => s?.content?.projectId)?.content?.projectId
                || '__personal_' + (bundle.content.ownerHandle || '@alvaro') + '__';

            const { getOrCreateWalletForProject, consumeAndPersist } = await import('../core/walletService.js');
            const wallet = await getOrCreateWalletForProject(projectId);
            const balance = Number(wallet.content?.balanceEur || 0);
            if (balance < cost.totalEur) {
                setStatus('✗ Saldo insuficient · cal ' + cost.totalEur.toFixed(3) + '€ · disponible ' + balance.toFixed(2) + '€ · recarrega a /wallet?project=' + encodeURIComponent(projectId), false);
                return;
            }
            btn.disabled = true; btn.textContent = '⏳ Pagant ' + cost.totalEur.toFixed(3) + '€…';
            const ref = 'bundle-publish-' + bundle.id;
            await consumeAndPersist({
                projectId, amountEur: cost.totalEur, ref,
                source: 'public-bundle-publish',
                note: 'CV nodal · ' + (bundle.content?.name || bundle.id),
            });
            // TURBO-UNIFY-001 · upload real al permaweb · fallback mock txId
            btn.textContent = '⏳ Pujant a Arweave…';
            const now = Date.now();
            let txId, uploadMode = 'mock';
            try {
                const { canonicalizeNode } = await import('../core/nodeSigningService.js');
                const { uploadNodeToTurbo, buildSignedPayload, commonArweaveTags } = await import('../core/turboUploadService.js');
                const canonical = canonicalizeNode(bundle);
                const payload = buildSignedPayload({
                    canonicalString: canonical,
                    signature: bundle.content.signature,
                    signatureFormat: bundle.content.signatureFormat,
                });
                const tags = commonArweaveTags({
                    entryType: 'neural-path-bundle',
                    extra: [
                        { name: 'OwnerHandle', value: bundle.content.ownerHandle || '?' },
                        { name: 'BundleId', value: bundle.id },
                        ...(bundle.content.intent     ? [{ name: 'Intent',   value: bundle.content.intent }] : []),
                        ...(bundle.content.audienceId ? [{ name: 'Audience', value: bundle.content.audienceId }] : []),
                    ],
                });
                const result = await uploadNodeToTurbo({ payload, tags });
                txId = result.txId;
                uploadMode = result.mode;
            } catch (uploadErr) {
                console.warn('[neural-path] turbo upload failed · fallback mock txId', uploadErr?.message);
                txId = 'mock-bundle-' + bundle.id.slice(-12) + '-' + now.toString(36);
                uploadMode = 'mock';
            }
            const updated = { ...bundle, content: { ...bundle.content,
                arweaveTxId: txId,
                permawebPublishedAt: now,
                _cachedAt: now,
                _fromPermaweb: false,
                _mockMode: uploadMode === 'mock',
                _uploadMode: uploadMode,
            }};
            await KB.upsert(updated);
            const txLabel = uploadMode === 'mock' ? '🧪 mock · ' + txId.slice(0, 18) : '✓ ' + txId.slice(0, 18);
            setStatus(txLabel + '… · ' + uploadMode + ' · cost ' + cost.totalEur.toFixed(3) + '€ · re-renderitzant…', true);
            setTimeout(async () => {
                await this._loadData();
                const app = document.getElementById('app');
                if (app) { app.innerHTML = await this.getHtml(); await this.afterRender(); }
            }, 1000);
        } catch (e) {
            console.error('[neural-path] publish failed', e);
            setStatus('✗ ' + (e?.message || 'error desconegut'), false);
            if (btn) { btn.disabled = false; btn.textContent = '🚀 Publicar CV nodal'; }
        }
    }
}
