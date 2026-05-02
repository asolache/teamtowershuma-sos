// =============================================================================
// TEAMTOWERS SOS V11 — MARKET VIEW (MKT-001 sprint A)
// Ruta: /js/views/MarketView.js · matchea /market
//
// Mercado SOS: catálogo de productos y servicios que las redes de valor
// con propósito intercambian entre sí (red macro tipo SOS Matriu Launch).
// Buscador AJAX (debounce 250ms) sobre título · description · tags · cnae
// · sectorTT. Filtros estructurados por kind, sector TT, visibilidad y
// proyecto. Cuadro de ahorro vs vías convencionales (notaría · contable
// · PM · consultoría) para items con `savingsCompareTo`.
//
// Sprint A: catálogo + buscador + grid + alta básica.
// Pendiente sprints B+C+D: asociación a proyecto · wallet prepago ·
// cuadro comparativo evolucionado.
// =============================================================================

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import {
    buildMarketItem, validateMarketItem, searchMarketItems,
    MARKET_ITEM_KINDS, MARKET_VISIBILITY, computeSaving,
    DEFAULT_CONVENTIONAL_RANGES,
} from '../core/marketService.js';
import { searchCnae, getCnae } from '../core/cnaeSeed.js';

const KIND_LABELS = {
    product:      '📦 Producto',
    service:      '💡 Servicio',
    workshop:     '🎓 Workshop',
    skill:        '🤲 Skill',
    template:     '📋 Plantilla',
    subscription: '🔁 Suscripción',
};

const SAVE_VS_LABELS = {
    notaria:     'Notaría',
    contable:    'Contable',
    pm:          'Project Manager',
    consultoria: 'Consultoría',
};

export default class MarketView {
    constructor() {
        document.title = 'Mercado · SOS V11';
        this.items    = [];
        this.projects = [];
        this.filter   = { text: '', kinds: [], sectorTT: '', visibility: '', projectId: '', cnaes: [] };
        this._searchDebounce = null;
    }

    async getHtml() {
        await store.init();
        return `
        <style>
            .mk-shell  { height:100dvh; background:#050507; color:#e6e6e6; font-family:var(--font-base,sans-serif); display:flex; flex-direction:column; overflow:hidden; }
            .mk-topbar { display:flex; align-items:center; gap:1rem; padding:1rem 1.5rem; border-bottom:1px solid #1a1a22; background:#08080c; flex-shrink:0; }
            .mk-logo   { font-weight:700; color:#fff; text-decoration:none; font-size:1.05rem; }
            .mk-logo span { color:#6366f1; }
            .mk-title  { color:#aaa; font-weight:500; letter-spacing:0.05em; text-transform:uppercase; font-size:0.78rem; }
            .mk-spacer { flex:1; }
            .mk-link   { color:#6366f1; text-decoration:none; font-size:0.85rem; }
            .mk-btn    { background:#1a1a22; color:#e6e6e6; border:1px solid #2a2a35; padding:0.5rem 1rem; border-radius:6px; cursor:pointer; font-size:0.85rem; font-family:inherit; }
            .mk-btn:hover { background:#22222d; }
            .mk-btn-primary { background:#6366f1; border-color:#6366f1; color:#fff; }
            .mk-btn-primary:hover { background:#4f46e5; }

            .mk-search-bar { display:flex; gap:0.5rem; align-items:center; padding:0.8rem 1.5rem; background:#0a0a10; border-bottom:1px solid #1a1a22; flex-shrink:0; flex-wrap:wrap; }
            .mk-search-input { flex:1; min-width:240px; background:#050507; color:#e6e6e6; border:1px solid #2a2a35; padding:8px 12px; border-radius:6px; font-size:0.88rem; font-family:inherit; outline:none; }
            .mk-search-input:focus { border-color:#6366f1; }
            .mk-select { background:#050507; color:#e6e6e6; border:1px solid #2a2a35; padding:7px 10px; border-radius:6px; font-size:0.82rem; font-family:inherit; outline:none; cursor:pointer; }
            .mk-select:hover { border-color:#3a3a45; }
            .mk-pill   { background:rgba(99,102,241,0.12); color:#a5b4fc; padding:3px 10px; border-radius:12px; font-size:0.72rem; font-family:monospace; cursor:pointer; border:1px solid rgba(99,102,241,0.3); }
            .mk-pill:hover { background:rgba(99,102,241,0.25); }
            .mk-pill.active { background:rgba(99,102,241,0.4); color:#fff; border-color:#6366f1; }
            .mk-count  { color:#888; font-size:0.78rem; font-family:monospace; }

            .mk-main   { padding:1.2rem 1.5rem; flex:1; overflow-y:auto; max-width:1400px; margin:0 auto; width:100%; box-sizing:border-box; }
            .mk-empty  { text-align:center; padding:3rem 1rem; color:#888; border:1px dashed #2a2a35; border-radius:8px; margin-top:1.5rem; }
            .mk-grid   { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:1rem; }
            .mk-card   { background:#0e0e14; border:1px solid #1a1a22; border-left:3px solid var(--mk-color,#6366f1); border-radius:8px; padding:0.9rem; cursor:pointer; transition:background 0.15s; display:flex; flex-direction:column; gap:0.4rem; }
            .mk-card:hover { background:#13131a; }
            .mk-card .mk-kind  { font-size:0.7rem; color:#888; font-family:monospace; text-transform:uppercase; letter-spacing:0.05em; }
            .mk-card h4 { margin:0; font-size:0.95rem; color:#fff; }
            .mk-card .mk-desc { color:#bbb; font-size:0.78rem; line-height:1.45; max-height:3.7em; overflow:hidden; }
            .mk-card .mk-meta { color:#888; font-size:0.72rem; font-family:monospace; display:flex; flex-wrap:wrap; gap:0.5rem; }
            .mk-card .mk-price { color:#86efac; font-size:0.95rem; font-weight:700; }
            .mk-card .mk-saving { color:#facc15; font-size:0.72rem; }
            .mk-card .mk-tags  { display:flex; flex-wrap:wrap; gap:3px; margin-top:0.2rem; }
            .mk-card .mk-tag   { font-size:0.62rem; padding:1px 6px; border-radius:8px; background:rgba(99,102,241,0.12); color:#a5b4fc; font-family:monospace; }
            .mk-card .mk-tag.tax { background:rgba(56,189,248,0.12); color:#7dd3fc; }

            .mk-modal { position:fixed; inset:0; background:rgba(0,0,0,0.78); display:flex; align-items:flex-start; justify-content:center; z-index:1000; padding:2rem 1rem; overflow-y:auto; }
            .mk-modal-inner { background:#0e0e14; border:1px solid #2a2a35; border-radius:10px; padding:1.5rem; width:100%; max-width:720px; }
            .mk-modal h3 { margin:0 0 0.8rem 0; color:#fff; }
            .mk-modal label { display:block; color:#aaa; font-size:0.78rem; margin-top:0.7rem; margin-bottom:0.25rem; }
            .mk-modal input, .mk-modal select, .mk-modal textarea { width:100%; box-sizing:border-box; background:#050507; color:#e6e6e6; border:1px solid #2a2a35; border-radius:5px; padding:0.5rem; font-size:0.85rem; font-family:inherit; }
            .mk-modal textarea { min-height:80px; resize:vertical; }
            .mk-modal .row { display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; }
            .mk-modal .actions { display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1.2rem; flex-wrap:wrap; }

            .mk-cnae-suggest { position:relative; }
            .mk-cnae-list { position:absolute; top:100%; left:0; right:0; background:#0e0e14; border:1px solid #2a2a35; border-radius:5px; max-height:240px; overflow-y:auto; z-index:10; display:none; }
            .mk-cnae-list.show { display:block; }
            .mk-cnae-item { padding:6px 10px; cursor:pointer; font-size:0.78rem; border-bottom:1px solid #1a1a22; }
            .mk-cnae-item:hover { background:#13131a; }
            .mk-cnae-item .code { color:#a5b4fc; font-family:monospace; margin-right:6px; }
        </style>

        <div class="mk-shell">
            <div class="mk-topbar">
                <a href="/" data-link class="mk-logo">🗼 Team<span>Towers</span></a>
                <span class="mk-title">Mercado SOS · productos y servicios</span>
                <div class="mk-spacer"></div>
                <a href="/dashboard" data-link class="mk-link">← Dashboard</a>
                <a href="/tags" data-link class="mk-link">🏷 Tags</a>
                <button class="mk-btn mk-btn-primary" id="mkBtnNew">＋ Nueva oferta</button>
            </div>

            <div class="mk-search-bar">
                <input id="mkSearch" class="mk-search-input" type="text" placeholder="Buscar por título · descripción · tags · CNAE · sector…" autocomplete="off">
                <select id="mkKind" class="mk-select" title="Tipo">
                    <option value="">Todos los tipos</option>
                    ${MARKET_ITEM_KINDS.map(k => `<option value="${k}">${KIND_LABELS[k] || k}</option>`).join('')}
                </select>
                <select id="mkVisibility" class="mk-select" title="Visibilidad">
                    <option value="">Toda visibilidad</option>
                    ${MARKET_VISIBILITY.map(v => `<option value="${v}">${v}</option>`).join('')}
                </select>
                <select id="mkSectorTT" class="mk-select" title="Sector TT">
                    <option value="">Todos los sectores TT</option>
                    ${'ABCDEFGHIJKLMNOPQRSTU'.split('').map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
                <select id="mkProject" class="mk-select" title="Proyecto proveedor">
                    <option value="">Todos los proyectos</option>
                </select>
                <span id="mkCount" class="mk-count">cargando…</span>
            </div>

            <div class="mk-main" id="mkMain">
                <p style="color:#888;">Cargando…</p>
            </div>
        </div>

        <div id="mkModalRoot"></div>`;
    }

    async afterRender() {
        await this._load();
        this._populateProjectSelect();
        this._render();
        this._bindFilters();
        document.getElementById('mkBtnNew')?.addEventListener('click', () => this._openCreateModal());
    }

    destroy() {
        if (this._searchDebounce) { clearTimeout(this._searchDebounce); this._searchDebounce = null; }
    }

    async _load() {
        await KB.init();
        this.items = await KB.query({ type: 'market_item' });
        this.items.sort((a, b) => (b.content?.createdAt || b.createdAt || 0) - (a.content?.createdAt || a.createdAt || 0));
        this.projects = (store.getState().projects || []).filter(p => !p.isArchived);
    }

    _populateProjectSelect() {
        const sel = document.getElementById('mkProject');
        if (!sel) return;
        const opts = this.projects.map(p => `<option value="${p.id}">${this._esc(p.nombre || p.id)}</option>`).join('');
        sel.insertAdjacentHTML('beforeend', opts);
    }

    _bindFilters() {
        const search = document.getElementById('mkSearch');
        if (search) {
            search.addEventListener('input', () => {
                if (this._searchDebounce) clearTimeout(this._searchDebounce);
                this._searchDebounce = setTimeout(() => {
                    this.filter.text = search.value;
                    this._render();
                }, 250);
            });
        }
        document.getElementById('mkKind')      ?.addEventListener('change', e => { this.filter.kinds = e.target.value ? [e.target.value] : []; this._render(); });
        document.getElementById('mkVisibility')?.addEventListener('change', e => { this.filter.visibility = e.target.value || ''; this._render(); });
        document.getElementById('mkSectorTT')  ?.addEventListener('change', e => { this.filter.sectorTT  = e.target.value || ''; this._render(); });
        document.getElementById('mkProject')   ?.addEventListener('change', e => { this.filter.projectId = e.target.value || ''; this._render(); });
    }

    _render() {
        const main  = document.getElementById('mkMain');
        const count = document.getElementById('mkCount');
        if (!main) return;

        const filtered = searchMarketItems(this.items, this.filter);
        if (count) count.textContent = filtered.length + ' / ' + this.items.length + (this.items.length === 1 ? ' oferta' : ' ofertas');

        if (!filtered.length) {
            const isEmpty = this.items.length === 0;
            main.innerHTML = `
                <div class="mk-empty">
                    ${isEmpty
                        ? `<p>El Mercado SOS está vacío.</p>
                           <p style="font-size:0.85rem;color:#777;">Publica tu primera oferta · cualquier output del VNA del proyecto puede convertirse en producto/servicio del catálogo.</p>
                           <p style="margin-top:1rem;"><button class="mk-btn mk-btn-primary" id="mkEmptyNew">＋ Nueva oferta</button></p>`
                        : `<p>Sin resultados con los filtros actuales.</p>
                           <p style="font-size:0.85rem;color:#777;">Prueba a relajar el buscador o cambia el sector / tipo.</p>`}
                </div>`;
            document.getElementById('mkEmptyNew')?.addEventListener('click', () => this._openCreateModal());
            return;
        }

        main.innerHTML = `<div class="mk-grid">${filtered.map(it => this._cardHtml(it)).join('')}</div>`;
        main.querySelectorAll('.mk-card').forEach(card => {
            card.addEventListener('click', () => this._openDetailModal(card.dataset.itemId));
        });
    }

    _cardHtml(item) {
        const c = item.content || {};
        const cnaeMeta = c.cnae ? getCnae(c.cnae) : null;
        const kindColor = c.kind === 'service' ? '#a5b4fc' : c.kind === 'workshop' ? '#fbbf24' : c.kind === 'product' ? '#86efac' : c.kind === 'template' ? '#f472b6' : c.kind === 'skill' ? '#7dd3fc' : '#6366f1';
        const saving = computeSaving(item);
        const provider = c.providerProjectId ? this.projects.find(p => p.id === c.providerProjectId) : null;
        const tags = (Array.isArray(c.tags) ? c.tags : []).slice(0, 6);
        return `
            <div class="mk-card" data-item-id="${this._esc(item.id)}" style="--mk-color:${kindColor};">
                <div class="mk-kind">${KIND_LABELS[c.kind] || c.kind}${c.visibility && c.visibility !== 'public' ? ' · 🔒 ' + c.visibility : ''}</div>
                <h4>${this._esc(c.title || item.id)}</h4>
                ${c.description ? `<div class="mk-desc">${this._esc(c.description)}</div>` : ''}
                <div class="mk-meta">
                    ${cnaeMeta ? `<span title="${this._esc(cnaeMeta.name)}">CNAE ${cnaeMeta.code}</span>` : (c.cnae ? `<span>CNAE ${this._esc(c.cnae)}</span>` : '')}
                    ${c.sectorTT ? `<span>sector ${this._esc(c.sectorTT)}</span>` : ''}
                    ${provider ? `<span>· ${this._esc(provider.nombre || provider.id)}</span>` : ''}
                </div>
                <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:auto;">
                    <span class="mk-price">${c.priceEur != null ? c.priceEur + ' €' : '— €'}</span>
                    ${saving ? `<span class="mk-saving" title="${this._esc(saving.vsConvLabel)}: ${saving.vsConvLowEur}-${saving.vsConvHighEur}€">✨ -${saving.savingPct}% vs ${SAVE_VS_LABELS[c.savingsCompareTo] || 'conv.'}</span>` : ''}
                </div>
                ${tags.length ? `<div class="mk-tags">${tags.map(t => `<span class="mk-tag ${t.includes(':') ? 'tax' : ''}">${this._esc(t)}</span>`).join('')}</div>` : ''}
            </div>
        `;
    }

    // ─── Detalle ────────────────────────────────────────────────────────────
    _openDetailModal(itemId) {
        const item = this.items.find(x => x.id === itemId);
        if (!item) return;
        const c = item.content || {};
        const cnaeMeta = c.cnae ? getCnae(c.cnae) : null;
        const saving   = computeSaving(item);
        const provider = c.providerProjectId ? this.projects.find(p => p.id === c.providerProjectId) : null;
        const root = document.getElementById('mkModalRoot');
        const close = () => { root.innerHTML = ''; };
        root.innerHTML = `
            <div class="mk-modal" id="mkDetailBg">
                <div class="mk-modal-inner">
                    <div style="font-size:0.7rem;color:#888;font-family:monospace;text-transform:uppercase;letter-spacing:0.05em;">${KIND_LABELS[c.kind] || c.kind} ${c.visibility && c.visibility !== 'public' ? '· 🔒 ' + c.visibility : ''}</div>
                    <h3 style="margin:0.3rem 0;">${this._esc(c.title || item.id)}</h3>
                    <div style="color:#888;font-size:0.78rem;font-family:monospace;">id: ${this._esc(item.id)}${item.createdAt ? ' · creado: ' + new Date(item.createdAt).toLocaleString('es-ES') : ''}</div>

                    ${c.description ? `<p style="color:#ddd;font-size:0.88rem;line-height:1.5;margin-top:0.8rem;">${this._esc(c.description)}</p>` : ''}

                    <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:0.8rem;font-size:0.8rem;">
                        <div><strong style="color:#86efac;font-size:1.05rem;">${c.priceEur != null ? c.priceEur + ' €' : '—'}</strong></div>
                        ${c.fmvHumanEquivalentEur ? `<div style="color:#aaa;">FMV humano equiv: <strong>${c.fmvHumanEquivalentEur} €</strong></div>` : ''}
                        ${saving ? `<div style="color:#facc15;">✨ Ahorro vs ${this._esc(saving.vsConvLabel)} (rango ${saving.vsConvLowEur}-${saving.vsConvHighEur}€): <strong>${saving.savingEur} € · -${saving.savingPct}%</strong></div>` : ''}
                    </div>

                    <table style="margin-top:1rem;width:100%;border-collapse:collapse;font-size:0.78rem;">
                        ${cnaeMeta ? `<tr><td style="color:#888;padding:4px 0;">CNAE</td><td style="color:#ddd;">${cnaeMeta.code} · ${this._esc(cnaeMeta.name)}</td></tr>` : (c.cnae ? `<tr><td style="color:#888;padding:4px 0;">CNAE</td><td style="color:#ddd;">${this._esc(c.cnae)}</td></tr>` : '')}
                        ${c.sectorTT ? `<tr><td style="color:#888;padding:4px 0;">Sector TT</td><td style="color:#ddd;">${this._esc(c.sectorTT)}</td></tr>` : ''}
                        ${provider ? `<tr><td style="color:#888;padding:4px 0;">Proveedor</td><td style="color:#ddd;"><a href="/n/${this._esc(provider.id)}" data-link class="mk-link">${this._esc(provider.nombre || provider.id)}</a></td></tr>` : ''}
                        ${c.sku ? `<tr><td style="color:#888;padding:4px 0;">SKU</td><td style="color:#ddd;font-family:monospace;">${this._esc(c.sku)}</td></tr>` : ''}
                    </table>

                    ${Array.isArray(c.deliverables) && c.deliverables.length ? `
                        <div style="margin-top:1rem;">
                            <div style="color:#aaa;font-size:0.78rem;margin-bottom:0.3rem;">Entregables:</div>
                            <ul style="font-size:0.82rem;color:#ddd;padding-left:1.2rem;">
                                ${c.deliverables.map(d => `<li>${this._esc(d)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${Array.isArray(c.tags) && c.tags.length ? `
                        <div style="margin-top:1rem;">
                            <div style="color:#aaa;font-size:0.78rem;margin-bottom:0.3rem;">Tags:</div>
                            <div class="mk-tags">${c.tags.map(t => `<span class="mk-tag ${t.includes(':') ? 'tax' : ''}">${this._esc(t)}</span>`).join('')}</div>
                        </div>
                    ` : ''}

                    <div class="actions">
                        <button class="mk-btn" id="mkdClose">Cerrar</button>
                        <a class="mk-btn" data-link href="/n/${encodeURIComponent(item.id)}">📂 Ver nodo</a>
                        <button class="mk-btn mk-btn-primary" id="mkdDelete" style="background:rgba(255,82,82,0.1);color:#ff5252;border-color:rgba(255,82,82,0.4);">Eliminar</button>
                    </div>
                </div>
            </div>`;
        document.getElementById('mkdClose').addEventListener('click', close);
        document.getElementById('mkDetailBg').addEventListener('click', e => { if (e.target.id === 'mkDetailBg') close(); });
        document.getElementById('mkdDelete').addEventListener('click', async () => {
            if (!confirm('¿Eliminar esta oferta del Mercado?')) return;
            await store.dispatch({ type: 'KB_DELETE', payload: { id: item.id } });
            close();
            await this._load();
            this._render();
        });
    }

    // ─── Crear ──────────────────────────────────────────────────────────────
    _openCreateModal() {
        const root = document.getElementById('mkModalRoot');
        const close = () => { root.innerHTML = ''; };
        root.innerHTML = `
            <div class="mk-modal" id="mkCreateBg">
                <div class="mk-modal-inner">
                    <h3>＋ Nueva oferta del Mercado</h3>
                    <p style="color:#888;font-size:0.78rem;margin:0 0 0.6rem 0;">Cualquier output del VNA puede convertirse en producto/servicio. La oferta nace etiquetada (taxonomía + folksonomía) y queda enlazada al proyecto proveedor.</p>

                    <label>Título</label>
                    <input id="mkfTitle" type="text" placeholder="Ej. Mapa de Valor IKEA-style">

                    <label>Descripción</label>
                    <textarea id="mkfDesc" placeholder="Qué entrega · cómo se diferencia · para quién"></textarea>

                    <div class="row">
                        <div>
                            <label>Tipo</label>
                            <select id="mkfKind">
                                ${MARKET_ITEM_KINDS.map(k => `<option value="${k}" ${k==='service'?'selected':''}>${KIND_LABELS[k] || k}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label>Visibilidad</label>
                            <select id="mkfVisibility">
                                ${MARKET_VISIBILITY.map(v => `<option value="${v}" ${v==='public'?'selected':''}>${v}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="row">
                        <div>
                            <label>Precio (€)</label>
                            <input id="mkfPrice" type="number" min="0" step="1" placeholder="495">
                        </div>
                        <div>
                            <label>FMV humano equivalente (€)</label>
                            <input id="mkfFmv" type="number" min="0" step="1" placeholder="opcional">
                        </div>
                    </div>

                    <div class="row">
                        <div class="mk-cnae-suggest">
                            <label>CNAE (autocomplete)</label>
                            <input id="mkfCnae" type="text" placeholder="ej. 7022 o 'consultoría'" autocomplete="off">
                            <div class="mk-cnae-list" id="mkfCnaeList"></div>
                        </div>
                        <div>
                            <label>Sector TT</label>
                            <select id="mkfSectorTT">
                                <option value="">— sin sector TT —</option>
                                ${'ABCDEFGHIJKLMNOPQRSTU'.split('').map(s => `<option value="${s}">${s}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="row">
                        <div>
                            <label>Proyecto proveedor (opcional)</label>
                            <select id="mkfProject">
                                <option value="">— sin proyecto · oferta TT pública —</option>
                                ${this.projects.map(p => `<option value="${p.id}">${this._esc(p.nombre || p.id)}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label>Compara ahorro vs (opcional)</label>
                            <select id="mkfCompareTo">
                                <option value="">— ninguna —</option>
                                ${Object.entries(DEFAULT_CONVENTIONAL_RANGES).map(([k, r]) => `<option value="${k}">${this._esc(r.label)}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <label>Entregables (uno por línea)</label>
                    <textarea id="mkfDeliverables" placeholder="Mapa VNA del proyecto en PDF&#10;Workshop Fent Pinya 2h con todos los stakeholders&#10;..."></textarea>

                    <label>Tags folksonómicos (separados por coma)</label>
                    <input id="mkfTags" type="text" placeholder="b2b, vna, urgente, formacion">

                    <div id="mkfErr" style="color:#fca5a5;font-size:0.78rem;margin-top:0.6rem;display:none;"></div>

                    <div class="actions">
                        <button class="mk-btn" id="mkfCancel">Cancelar</button>
                        <button class="mk-btn mk-btn-primary" id="mkfSave">Publicar</button>
                    </div>
                </div>
            </div>`;
        document.getElementById('mkfCancel').addEventListener('click', close);
        document.getElementById('mkCreateBg').addEventListener('click', e => { if (e.target.id === 'mkCreateBg') close(); });

        // CNAE autocomplete
        const cnaeInput = document.getElementById('mkfCnae');
        const cnaeList  = document.getElementById('mkfCnaeList');
        const sectorSel = document.getElementById('mkfSectorTT');
        const renderCnaeOpts = (q) => {
            const matches = searchCnae(q, 8);
            if (!matches.length) { cnaeList.classList.remove('show'); cnaeList.innerHTML = ''; return; }
            cnaeList.innerHTML = matches.map(m => `<div class="mk-cnae-item" data-code="${m.code}" data-sector="${m.sectorTT || ''}"><span class="code">${m.code}</span>${this._esc(m.name)}${m.sectorTT ? ` <span style="color:#888;">· sector TT ${m.sectorTT}</span>` : ''}</div>`).join('');
            cnaeList.classList.add('show');
            cnaeList.querySelectorAll('.mk-cnae-item').forEach(it => {
                it.addEventListener('click', () => {
                    cnaeInput.value = it.dataset.code;
                    if (it.dataset.sector && !sectorSel.value) sectorSel.value = it.dataset.sector;
                    cnaeList.classList.remove('show');
                });
            });
        };
        cnaeInput.addEventListener('input', () => renderCnaeOpts(cnaeInput.value));
        cnaeInput.addEventListener('focus', () => { if (cnaeInput.value) renderCnaeOpts(cnaeInput.value); });
        cnaeInput.addEventListener('blur',  () => setTimeout(() => cnaeList.classList.remove('show'), 200));

        // Save
        document.getElementById('mkfSave').addEventListener('click', async () => {
            const title    = document.getElementById('mkfTitle').value.trim();
            const desc     = document.getElementById('mkfDesc').value.trim();
            const kind     = document.getElementById('mkfKind').value;
            const visibility = document.getElementById('mkfVisibility').value;
            const priceRaw = document.getElementById('mkfPrice').value;
            const fmvRaw   = document.getElementById('mkfFmv').value;
            const cnae     = document.getElementById('mkfCnae').value.trim() || null;
            const sectorTT = document.getElementById('mkfSectorTT').value || null;
            const projectId = document.getElementById('mkfProject').value || null;
            const compareTo = document.getElementById('mkfCompareTo').value || null;
            const deliverables = document.getElementById('mkfDeliverables').value.split('\n').map(s => s.trim()).filter(Boolean);
            const tagsCsv  = document.getElementById('mkfTags').value;
            const tags = tagsCsv.split(',').map(t => t.trim().toLowerCase().replace(/\s+/g, '-')).filter(Boolean);

            const errEl = document.getElementById('mkfErr');
            const item = buildMarketItem({
                title, kind, description: desc, cnae, sectorTT,
                priceEur: priceRaw === '' ? null : Number(priceRaw),
                fmvHumanEquivalentEur: fmvRaw === '' ? null : Number(fmvRaw),
                providerProjectId: projectId,
                deliverables,
                tags,
                visibility,
            });
            if (compareTo) item.content.savingsCompareTo = compareTo;

            // UX-002 · taxonómicos automáticos
            const taxonomic = [
                'kind:market-item',
                kind ? 'kind:' + kind : null,
                cnae ? 'cnae:' + cnae : null,
                sectorTT ? 'sector:' + sectorTT.toLowerCase() : null,
                visibility ? 'scope:' + visibility : null,
                projectId ? 'project:' + projectId : null,
            ].filter(Boolean);
            item.content.tags = Array.from(new Set([...taxonomic, ...item.content.tags]));
            item.keywords = Array.from(new Set([...(item.keywords || []), ...item.content.tags]));

            const v = validateMarketItem(item);
            if (!v.ok) {
                errEl.textContent = '✗ ' + v.errors.join(' · ');
                errEl.style.display = 'block';
                return;
            }

            await store.dispatch({ type: 'KB_UPSERT', payload: { node: item } });
            close();
            await this._load();
            this._render();
        });
    }

    _esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }
}
