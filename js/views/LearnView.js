// TEAMTOWERS SOS V11 — LEARN VIEW (UX-EDU-001 sprint C)
//
// Glosario navegable de los conceptos didácticos del catálogo
// `EDU_CONCEPTS`. Permite leer cualquier concepto fuera de su vista
// asociada · marcar "ya leído" persistente en KB
// (`type='didactic_seen'`) · ver progreso en formación cohort 0.

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import { renderNavLinksHtml, renderNavGroupedHtml, ensureNavGroupStyle, bindNavGroupDropdowns } from '../core/navService.js';
import { EDU_CONCEPTS, listConcepts, ensureExplainerStyle } from '../core/didacticService.js';

const SEEN_NODE_ID = 'sos-didactic-seen';
const SEEN_NODE_TYPE = 'didactic_seen';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Concepts with the same headline (alias) deduplicate by headline + body
function uniqueConcepts() {
    const seenBodies = new Set();
    const out = [];
    for (const c of listConcepts()) {
        const key = (c.headline || '') + '·' + (c.body || '');
        if (seenBodies.has(key)) continue;
        seenBodies.add(key);
        out.push(c);
    }
    return out;
}

async function loadSeenIds() {
    try {
        await KB.init();
        const node = await KB.getNode(SEEN_NODE_ID);
        const ids = node?.content?.seen;
        if (Array.isArray(ids)) return new Set(ids);
        return new Set();
    } catch (_) { return new Set(); }
}

async function saveSeenIds(seenSet) {
    try {
        await KB.init();
        await KB.upsert({
            id: SEEN_NODE_ID,
            type: SEEN_NODE_TYPE,
            content: {
                kind: 'didactic-seen-tracker',
                seen: Array.from(seenSet),
            },
            keywords: ['type:didactic_seen', 'kind:didactic-seen-tracker'],
        });
    } catch (e) { console.warn('[UX-EDU-001 C] saveSeenIds falló:', e); }
}

// Vistas donde aparece cada concepto (back-reference para deep-link)
const CONCEPT_LOCATIONS = Object.freeze({
    'vna':                        [{ path: '/map',        label: '🗺 Mapa de valor' }],
    'value-network-analysis':     [{ path: '/map',        label: '🗺 Mapa de valor' }],
    'triple-entry-accounting':    [{ path: '/savings',    label: '📊 Ahorro' }],
    'slicing-pie':                [{ path: '/market',     label: '🛒 Mercado' }],
    'fair-fractal-tokenomics':    [{ path: '/matriu',     label: '🎓 Matriu landing' }],
    'soc':                        [{ path: '/sops',       label: '📜 SOPs' }],
    'sop':                        [{ path: '/sops',       label: '📜 SOPs' }],
    'dtd':                        [{ path: '/sops',       label: '📜 SOPs · DTD' }],
    'antigravity-engine':         [{ path: '/kanban',     label: '⚡ Kanban' }],
    'context-pruning':            [{ path: '/efficiency', label: '🧠 Eficiencia IA' }, { path: '/settings', label: '⚙ Settings · pruning' }],
    'folksonomy':                 [{ path: '/folders',    label: '📁 Folders' }, { path: '/tags', label: '🏷 Tags' }],
    'taxonomy':                   [{ path: '/folders',    label: '📁 Folders' }, { path: '/tags', label: '🏷 Tags' }],
    'smart-contract':             [{ path: '/matriu#exit', label: '🎓 Matriu · exit model' }],
    'sbt':                        [{ path: '/identity',   label: '👤 Identidad' }],
    'cohort-0':                   [{ path: '/matriu#cohort', label: '🎓 Matriu · cohort 0' }],
    'econom-ia':                  [{ path: '/wallet',     label: '💶 Wallet' }],
    'did':                        [{ path: '/identity',   label: '👤 Identidad · DID' }],
});

export default class LearnView {
    constructor() {
        document.title = 'Aprendre · SOS V11';
        this._seen = new Set();
        this._activeId = null;
        this._search = '';
    }

    async getHtml() {
        await store.init();
        this._seen = await loadSeenIds();
        const concepts = uniqueConcepts();
        const total = concepts.length;
        const seenCount = concepts.filter(c => this._seen.has(c.id)).length;
        const pct = total ? Math.round((seenCount / total) * 100) : 0;

        return `
        <style>
            .lr-shell { background: var(--bg-dark); color: var(--text-main); font-family: var(--font-base, sans-serif); display: flex; flex-direction: column; }
            .lr-topbar { display: flex; align-items: center; gap: 1rem; padding: 14px 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; }
            .lr-logo { font-family: monospace; color: var(--text-muted); text-decoration: none; font-size: 0.78rem; }
            .lr-logo span { color: #6366f1; font-weight: 700; }
            .lr-title { color: var(--text-secondary); font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; font-size: 0.78rem; }
            .lr-spacer { flex: 1; }
            .lr-link { color: var(--text-muted); text-decoration: none; font-size: 0.85rem; padding: 6px 12px; border-radius: 6px; transition: background 0.15s; }
            .lr-link:hover { background: var(--glass-hover); color: var(--text-main); }

            .lr-progress { padding: 18px 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: center; }
            .lr-progress-bar { background: var(--glass-hover); border-radius: 999px; height: 6px; position: relative; overflow: hidden; }
            .lr-progress-fill { background: linear-gradient(90deg, #c084fc, #6366f1); height: 100%; border-radius: 999px; transition: width 0.3s; }
            .lr-progress-meta { display: flex; flex-direction: column; gap: 4px; min-width: 180px; }
            .lr-progress-meta-h { font-family: monospace; font-size: 0.72rem; color: var(--text-muted); letter-spacing: 0.05em; text-transform: uppercase; }
            .lr-progress-meta-v { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 1.6rem; color: var(--text-main); line-height: 1; }
            .lr-progress-stats { font-family: monospace; font-size: 0.72rem; color: var(--accent-purple); }

            .lr-search { padding: 14px 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); }
            .lr-search input { width: 100%; max-width: 480px; background: var(--bg-elevated); border: 1px solid rgba(255,255,255,0.1); color: var(--text-main); padding: 10px 14px; border-radius: 6px; font-size: 0.9rem; outline: none; transition: border-color 0.15s; }
            .lr-search input:focus { border-color: var(--accent-purple); }

            .lr-main { display: grid; grid-template-columns: 320px 1fr; min-height: 0; flex: 1; }
            .lr-side { border-right: 1px solid rgba(255,255,255,0.06); overflow-y: auto; padding: 14px 0; }
            .lr-side-item { display: flex; align-items: center; gap: 10px; padding: 12px 1.5rem; cursor: pointer; transition: background 0.15s; border-left: 2px solid transparent; }
            .lr-side-item:hover { background: var(--glass-hover); }
            .lr-side-item.is-active { background: rgba(192,132,252,0.10); border-left-color: var(--accent-purple); }
            .lr-side-item.is-seen { opacity: 0.7; }
            .lr-side-icon { width: 28px; text-align: center; font-size: 1rem; }
            .lr-side-text { flex: 1; min-width: 0; }
            .lr-side-headline { font-size: 0.86rem; color: var(--text-main); font-weight: 500; }
            .lr-side-id { font-family: monospace; font-size: 0.7rem; color: #555; margin-top: 2px; }
            .lr-side-check { font-family: monospace; font-size: 0.7rem; color: #4ade80; padding: 2px 8px; border: 1px solid #4ade80; border-radius: 999px; }
            .lr-side-empty { padding: 32px 1.5rem; color: #555; font-size: 0.85rem; text-align: center; }

            .lr-content { padding: clamp(20px, 4vw, 48px); overflow-y: auto; }
            .lr-empty { color: #555; padding: 64px 0; text-align: center; }
            .lr-empty h2 { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 1.6rem; color: var(--text-muted); margin-bottom: 0.6rem; }
            .lr-doc { max-width: 720px; }
            .lr-doc-tag { font-family: monospace; font-size: 0.75rem; color: var(--accent-purple); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 1rem; }
            .lr-doc h1 { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-weight: 400; font-size: clamp(2.2rem, 5vw, 3.4rem); line-height: 1.05; color: var(--text-main); letter-spacing: -0.01em; margin-bottom: 1.4rem; }
            .lr-doc-body { font-size: 1.04rem; line-height: 1.7; color: #d1d1dc; max-width: 640px; margin-bottom: 1.6rem; }
            .lr-doc-meta-grid { display: grid; grid-template-columns: 140px 1fr; gap: 12px 24px; padding: 18px; background: var(--glass-hover); border-radius: 10px; margin-bottom: 1.6rem; font-size: 0.85rem; }
            .lr-doc-meta-k { font-family: monospace; color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase; font-size: 0.72rem; align-self: center; }
            .lr-doc-meta-v { color: var(--text-main); }
            .lr-doc-meta-v code { background: rgba(192,132,252,0.10); padding: 2px 8px; border-radius: 4px; color: var(--accent-purple); font-size: 0.85rem; }
            .lr-doc-locs { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
            .lr-doc-loc { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--border-default); border-radius: 6px; color: #c7d2fe; text-decoration: none; font-size: 0.82rem; transition: background 0.15s; align-self: flex-start; }
            .lr-doc-loc:hover { background: rgba(99,102,241,0.10); border-color: #6366f1; }
            .lr-doc-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
            .lr-btn-seen { background: linear-gradient(135deg, #c084fc, #6366f1); color: var(--text-main); border: 0; padding: 12px 22px; border-radius: 999px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: transform 0.15s; }
            .lr-btn-seen:hover { transform: translateY(-1px); }
            .lr-btn-seen.is-done { background: rgba(74,222,128,0.10); border: 1px solid #4ade80; color: #4ade80; }
            .lr-doc-link { color: var(--accent-purple); text-decoration: none; font-size: 0.85rem; }
            .lr-doc-link:hover { text-decoration: underline; }

            @media (max-width: 880px) {
                .lr-main { grid-template-columns: 1fr; }
                .lr-side { border-right: 0; border-bottom: 1px solid rgba(255,255,255,0.06); max-height: 280px; }
            }
        </style>

        <div class="lr-shell">
            <div class="lr-topbar">
                <a href="/" data-link class="lr-logo">🗼 Team<span>Towers</span></a>
                <span style="color:#444;">·</span>
                <span class="lr-title">Aprendre · UX-EDU-001</span>
                <div class="lr-spacer"></div>
                
            </div>

            <div class="lr-progress">
                <div>
                    <div style="font-family:monospace;font-size:0.72rem;color:var(--text-muted);letter-spacing:0.06em;text-transform:uppercase;margin-bottom:8px;">El teu progrés didàctic</div>
                    <div class="lr-progress-bar">
                        <div class="lr-progress-fill" id="lrProgressFill" style="width:${pct}%;"></div>
                    </div>
                    <div class="lr-progress-stats" id="lrProgressStats" style="margin-top:8px;">
                        ${seenCount} / ${total} conceptes llegits · ${pct}%
                    </div>
                </div>
                <div class="lr-progress-meta">
                    <span class="lr-progress-meta-h">Total conceptes</span>
                    <span class="lr-progress-meta-v">${total}</span>
                </div>
            </div>

            <div class="lr-search">
                <input type="search" id="lrSearch" placeholder="Cercar conceptes (ex. vna, slicing, contracte…)">
            </div>

            <div class="lr-main">
                <aside class="lr-side" id="lrSide"></aside>
                <main class="lr-content" id="lrContent">
                    <div class="lr-empty">
                        <h2>Tria un concepte de l'esquerra</h2>
                        <p>Aprèn fent · cada concepte mostra on apareix dins SOS i et permet marcar-lo com a llegit.</p>
                    </div>
                </main>
            </div>
        </div>
        `;
    }

    async afterRender() {
        ensureExplainerStyle();
        this._renderSide();

        document.getElementById('lrSearch')?.addEventListener('input', (e) => {
            this._search = (e.target.value || '').toLowerCase().trim();
            this._renderSide();
        });

        // Auto-focus first concept on initial render
        const concepts = uniqueConcepts();
        if (concepts.length > 0 && !this._activeId) {
            this._activeId = concepts[0].id;
            this._renderContent();
            this._renderSide();
        }
    }

    _filtered() {
        const all = uniqueConcepts();
        if (!this._search) return all;
        return all.filter(c => {
            const hay = (c.id + ' ' + (c.headline || '') + ' ' + (c.body || '')).toLowerCase();
            return hay.includes(this._search);
        });
    }

    _renderSide() {
        const side = document.getElementById('lrSide');
        if (!side) return;
        const list = this._filtered();
        if (list.length === 0) {
            side.innerHTML = `<div class="lr-side-empty">Cap concepte coincideix amb la cerca.</div>`;
            return;
        }
        side.innerHTML = list.map(c => {
            const seen = this._seen.has(c.id);
            const active = this._activeId === c.id;
            return `
                <div class="lr-side-item ${active ? 'is-active' : ''} ${seen ? 'is-seen' : ''}" data-concept="${escapeHtml(c.id)}">
                    <div class="lr-side-icon">${escapeHtml(c.icon || '?')}</div>
                    <div class="lr-side-text">
                        <div class="lr-side-headline">${escapeHtml(c.headline || c.id)}</div>
                        <div class="lr-side-id">${escapeHtml(c.id)}</div>
                    </div>
                    ${seen ? '<span class="lr-side-check">✓ llegit</span>' : ''}
                </div>
            `;
        }).join('');
        side.querySelectorAll('.lr-side-item').forEach(el => {
            el.addEventListener('click', () => {
                this._activeId = el.getAttribute('data-concept');
                this._renderContent();
                this._renderSide();
            });
        });
    }

    _renderContent() {
        const main = document.getElementById('lrContent');
        if (!main) return;
        const c = this._activeId ? EDU_CONCEPTS[this._activeId] : null;
        if (!c) {
            main.innerHTML = `<div class="lr-empty"><h2>Concepte no trobat</h2></div>`;
            return;
        }
        const seen = this._seen.has(c.id);
        const locs = CONCEPT_LOCATIONS[c.id] || [];
        const linkHtml = c.linkRef
            ? `<a href="${escapeHtml(c.linkRef)}" target="_blank" rel="noopener noreferrer" class="lr-doc-link">+ Saber-ne més ↗</a>`
            : '';
        main.innerHTML = `
            <div class="lr-doc">
                <div class="lr-doc-tag">${escapeHtml(c.icon || '?')} ${escapeHtml(c.id)}</div>
                <h1>${escapeHtml(c.headline || c.id)}</h1>
                <p class="lr-doc-body">${escapeHtml(c.body || '')}</p>
                <div class="lr-doc-meta-grid">
                    <div class="lr-doc-meta-k">ID concepte</div>
                    <div class="lr-doc-meta-v"><code>${escapeHtml(c.id)}</code></div>
                    <div class="lr-doc-meta-k">On apareix</div>
                    <div class="lr-doc-meta-v">
                        <div class="lr-doc-locs">
                            ${locs.length === 0
                                ? '<span style="color:var(--text-muted);font-size:0.82rem;">— Encara no integrat en cap vista</span>'
                                : locs.map(l => `<a href="${escapeHtml(l.path)}" data-link class="lr-doc-loc">${escapeHtml(l.label)} →</a>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="lr-doc-actions">
                    <button class="lr-btn-seen ${seen ? 'is-done' : ''}" id="lrBtnSeen">
                        ${seen ? '✓ Marcat com a llegit' : 'Marcar com a llegit →'}
                    </button>
                    ${linkHtml}
                </div>
            </div>
        `;
        document.getElementById('lrBtnSeen')?.addEventListener('click', async () => {
            if (this._seen.has(c.id)) {
                this._seen.delete(c.id);
            } else {
                this._seen.add(c.id);
            }
            await saveSeenIds(this._seen);
            this._renderContent();
            this._renderSide();
            this._renderProgress();
        });
        // Re-link SPA navigation
        main.querySelectorAll('a[data-link]').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.navigateTo) window.navigateTo(a.getAttribute('href'));
            });
        });
    }

    _renderProgress() {
        const concepts = uniqueConcepts();
        const total = concepts.length;
        const seenCount = concepts.filter(c => this._seen.has(c.id)).length;
        const pct = total ? Math.round((seenCount / total) * 100) : 0;
        const fill = document.getElementById('lrProgressFill');
        const stats = document.getElementById('lrProgressStats');
        if (fill)  fill.style.width = pct + '%';
        if (stats) stats.textContent = `${seenCount} / ${total} conceptes llegits · ${pct}%`;
    }

    destroy() { /* nothing to clean */ }
}
