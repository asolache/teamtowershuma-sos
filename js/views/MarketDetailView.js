// =============================================================================
// TEAMTOWERS SOS V11 — MARKET DETAIL VIEW (MARKET-CATALOG sprint A)
// Ruta · /js/views/MarketDetailView.js  →  /market/{id}
//
// Pàgina detail per a qualsevol catalog entry (market_item · workshop · sop
// sellable). Resoldra el node KB, construeix CatalogEntry · mostra rich detail
// amb CTA contactar/share/back, OG meta cards per share.
// =============================================================================

import { KB } from '../core/kb.js';
import {
    fromMarketItem, fromWorkshop, fromSop, shareUrlFor,
} from '../core/marketCatalogService.js';

const KIND_LABEL = {
    product:      '📦 Producte',
    service:      '💡 Servei',
    workshop:     '🎓 Workshop',
    skill:        '🤲 Skill',
    template:     '📋 Plantilla',
    subscription: '🔁 Subscripció',
};

export default class MarketDetailView {

    constructor() {
        document.title = 'Mercado · detail · SOS V11';
        try {
            const path = window.location.pathname || '';
            const m = path.match(/^\/market\/([^\/]+)/);
            this.itemId = m ? decodeURIComponent(m[1]) : null;
        } catch (_) { this.itemId = null; }
        this.node    = null;
        this.entry   = null;
        this.project = null;
    }

    async getHtml() {
        if (!this.itemId) return this._htmlNotFound('Sense id al URL');
        try { this.node = await KB.getNode(this.itemId); } catch (_) { this.node = null; }
        if (!this.node) return this._htmlNotFound('Node ' + this.itemId + ' no trobat al KB');

        // Convertim segons type
        if (this.node.type === 'market_item') this.entry = fromMarketItem(this.node);
        else if (this.node.type === 'workshop') this.entry = fromWorkshop(this.node);
        else if (this.node.type === 'sop') this.entry = fromSop(this.node);
        else return this._htmlNotFound('Type ' + this.node.type + ' no és market entry vàlid');

        if (!this.entry) return this._htmlNotFound('Aquest node no és venable al market');

        // Carrega provider project si existeix
        if (this.entry.providerProjectId) {
            try { this.project = await KB.getNode(this.entry.providerProjectId); } catch (_) {}
        }

        return this._htmlMain();
    }

    async afterRender() {
        if (!this.entry) return;
        this._injectOG();
        this._bindShare();
    }

    _htmlNotFound(reason) {
        return `<div style="min-height:100dvh;background:var(--bg-dark);color:var(--text-main);font-family:var(--font-base);padding:2rem;">
            <div style="max-width:600px;margin:4rem auto;text-align:center;background:var(--bg-panel);padding:2rem;border-radius:8px;border:1px solid var(--border-default);">
                <h1>⚠ No trobat</h1>
                <p style="color:var(--text-muted);">${this._esc(reason || 'desconegut')}</p>
                <a href="/market" data-link style="color:var(--accent-indigo);">← Tornar al mercat</a>
            </div></div>`;
    }

    _injectOG() {
        try {
            const og = {
                title: (this.entry.title + ' · Mercat SOS').slice(0, 70),
                description: (this.entry.description || (KIND_LABEL[this.entry.kind] || this.entry.kind)).slice(0, 200),
                url: window.location.origin + '/market/' + encodeURIComponent(this.entry.id),
                type: 'product',
            };
            document.querySelectorAll('meta[data-mkt-og="1"]').forEach(m => m.remove());
            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
            const tags = [
                `<meta property="og:title" content="${esc(og.title)}">`,
                `<meta property="og:description" content="${esc(og.description)}">`,
                `<meta property="og:type" content="${esc(og.type)}">`,
                `<meta property="og:url" content="${esc(og.url)}">`,
                `<meta name="twitter:card" content="summary">`,
                `<meta name="twitter:title" content="${esc(og.title)}">`,
                `<meta name="twitter:description" content="${esc(og.description)}">`,
            ];
            const tmp = document.createElement('div');
            tmp.innerHTML = tags.join('\n');
            Array.from(tmp.children).forEach(node => {
                node.setAttribute('data-mkt-og', '1');
                document.head.appendChild(node);
            });
            document.title = og.title;
        } catch (_) { /* ignore */ }
    }

    _bindShare() {
        const btn = document.getElementById('mktShare');
        if (!btn) return;
        btn.addEventListener('click', async () => {
            const url = shareUrlFor(this.entry, { absoluteUrl: window.location.origin });
            if (navigator.share) {
                try { await navigator.share({ title: this.entry.title, text: this.entry.description, url }); return; } catch (_) {}
            }
            try {
                await navigator.clipboard.writeText(url);
                btn.textContent = '✓ Enllaç copiat';
                setTimeout(() => { btn.textContent = '🔗 Compartir'; }, 2000);
            } catch (_) {
                window.prompt('Compartir aquest enllaç', url);
            }
        });
    }

    _htmlMain() {
        const e = this.entry;
        const proj = this.project;
        const kindColor = e.kind === 'service' ? '#a5b4fc'
            : e.kind === 'workshop' ? '#fbbf24'
            : e.kind === 'product' ? '#86efac'
            : e.kind === 'template' ? '#f472b6'
            : e.kind === 'skill' ? '#7dd3fc'
            : e.kind === 'subscription' ? '#fb7185'
            : '#6366f1';
        const tagsHtml = (Array.isArray(e.tags) && e.tags.length)
            ? e.tags.map(t => `<span class="mkd-tag">${this._esc(t)}</span>`).join('')
            : '';
        const description = e.description || '';

        // Per workshops · steps/outline. Per sops · steps array.
        const rawC = e.raw?.content || {};
        const steps = Array.isArray(rawC.steps) ? rawC.steps : [];
        const stepsHtml = steps.length
            ? `<div class="mkd-card">
                <h3>📋 Passes / Steps</h3>
                <ol style="padding-left:1.4rem;line-height:1.7;">
                    ${steps.map(s => `<li>${this._esc(String(s))}</li>`).join('')}
                </ol>
            </div>`
            : '';
        const deliverables = Array.isArray(rawC.deliverables) ? rawC.deliverables : [];
        const deliverablesHtml = deliverables.length
            ? `<div class="mkd-card">
                <h3>📦 Entregables</h3>
                <ul style="padding-left:1.4rem;line-height:1.7;">
                    ${deliverables.map(d => `<li>${this._esc(String(d))}</li>`).join('')}
                </ul>
            </div>`
            : '';

        const providerLink = proj
            ? `<a href="/project/${encodeURIComponent(proj.id)}" data-link class="mkd-provider-link">🏢 ${this._esc(proj.nombre || proj.name || proj.id)}</a>`
            : (e.providerProjectId ? `<code>${this._esc(e.providerProjectId)}</code>` : '');

        const handleLink = e.providerHandle
            ? `<a href="/u/${encodeURIComponent(String(e.providerHandle).replace(/^@/, ''))}" data-link class="mkd-provider-link">👤 ${this._esc(e.providerHandle)}</a>`
            : '';

        return `
        <style>
            .mkd-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); }
            .mkd-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-wrap:wrap; }
            .mkd-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .mkd-logo span { color:var(--accent-indigo); }
            .mkd-hero { background:linear-gradient(135deg,${kindColor}25,${kindColor}10); padding:2.5rem 1.5rem 2rem; border-bottom:1px solid var(--border-default); }
            .mkd-hero-inner { max-width:900px; margin:0 auto; }
            .mkd-kind-pill { display:inline-block; background:${kindColor}30; color:${kindColor}; padding:4px 12px; border-radius:999px; font-size:0.78rem; font-weight:700; font-family:var(--font-mono); letter-spacing:0.04em; margin-bottom:1rem; }
            .mkd-title { font-size:2rem; margin:0 0 0.6rem 0; line-height:1.2; }
            .mkd-tagline { font-size:1rem; color:var(--text-secondary); line-height:1.55; max-width:680px; }
            .mkd-price { display:inline-block; padding:8px 16px; background:#0008; border:1px solid ${kindColor}50; border-radius:8px; margin-top:1rem; font-family:var(--font-mono); }
            .mkd-price-num { font-size:1.8rem; font-weight:700; color:${kindColor}; }
            .mkd-price-cur { font-size:0.9rem; color:var(--text-muted); margin-left:4px; }
            .mkd-main { max-width:900px; margin:0 auto; padding:1.5rem; display:grid; grid-template-columns:1fr 280px; gap:1.5rem; }
            @media (max-width:780px) { .mkd-main { grid-template-columns:1fr; } }
            .mkd-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1.2rem 1.4rem; margin-bottom:1rem; }
            .mkd-card h3 { margin:0 0 0.8rem 0; font-size:0.95rem; color:${kindColor}; }
            .mkd-card p { color:var(--text-secondary); line-height:1.6; white-space:pre-wrap; }
            .mkd-meta-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1.2rem; }
            .mkd-meta-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border-default); font-size:0.82rem; }
            .mkd-meta-row:last-child { border-bottom:0; }
            .mkd-meta-key { color:var(--text-muted); font-family:var(--font-mono); font-size:11px; text-transform:uppercase; letter-spacing:0.05em; }
            .mkd-meta-val { color:var(--text-main); font-family:var(--font-mono); font-size:11px; }
            .mkd-tags { display:flex; flex-wrap:wrap; gap:4px; margin-top:8px; }
            .mkd-tag { display:inline-block; background:#0008; color:var(--text-secondary); padding:2px 8px; border-radius:999px; font-size:11px; font-family:var(--font-mono); border:1px solid var(--border-default); }
            .mkd-btn { display:inline-block; padding:10px 18px; border-radius:6px; border:1px solid ${kindColor}; background:${kindColor}; color:#000; font-weight:700; font-size:0.88rem; cursor:pointer; text-decoration:none; }
            .mkd-btn-secondary { background:transparent; color:${kindColor}; }
            .mkd-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:1rem; }
            .mkd-provider-link { color:var(--accent-indigo); text-decoration:none; font-weight:600; }
            .mkd-provider-link:hover { text-decoration:underline; }
            .mkd-source-badge { display:inline-block; background:#0008; color:var(--text-muted); padding:2px 8px; border-radius:6px; font-size:10px; margin-left:8px; font-family:var(--font-mono); }
        </style>
        <div class="mkd-shell">
            <div class="mkd-topbar">
                <a href="/dashboard" data-link class="mkd-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Mercat · detail</span>
                <span style="flex:1;"></span>
                <a href="/market" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">← Mercat</a>
            </div>
            <div class="mkd-hero">
                <div class="mkd-hero-inner">
                    <div class="mkd-kind-pill">${KIND_LABEL[e.kind] || e.kind}<span class="mkd-source-badge">font · ${this._esc(e.sourceType)}</span></div>
                    <h1 class="mkd-title">${this._esc(e.title)}</h1>
                    ${description ? `<p class="mkd-tagline">${this._esc(description.slice(0, 280))}${description.length > 280 ? '…' : ''}</p>` : ''}
                    ${e.priceEur != null
                        ? `<div class="mkd-price"><span class="mkd-price-num">${e.priceEur}</span><span class="mkd-price-cur">${this._esc(e.currency)}</span></div>`
                        : '<div style="margin-top:1rem;color:var(--text-muted);font-style:italic;">Preu sota consulta</div>'}
                </div>
            </div>
            <div class="mkd-main">
                <div>
                    ${description.length > 280 ? `
                        <div class="mkd-card">
                            <h3>📝 Descripció completa</h3>
                            <p>${this._esc(description)}</p>
                        </div>
                    ` : ''}
                    ${stepsHtml}
                    ${deliverablesHtml}
                    <div class="mkd-card">
                        <h3>🔗 Accions</h3>
                        <div class="mkd-actions">
                            ${proj ? `<a href="/project/${encodeURIComponent(proj.id)}" data-link class="mkd-btn">🏢 Contactar projecte</a>` : ''}
                            ${e.providerHandle ? `<a href="/u/${encodeURIComponent(String(e.providerHandle).replace(/^@/, ''))}" data-link class="mkd-btn mkd-btn-secondary">👤 Perfil provider</a>` : ''}
                            <button class="mkd-btn mkd-btn-secondary" id="mktShare">🔗 Compartir</button>
                            <a href="/n/${encodeURIComponent(e.id)}" data-link class="mkd-btn mkd-btn-secondary">🔬 Veure node KB</a>
                        </div>
                    </div>
                </div>
                <div>
                    <div class="mkd-meta-card">
                        <h3 style="margin:0 0 0.8rem 0;font-size:0.85rem;color:${kindColor};">📋 Detalls</h3>
                        <div class="mkd-meta-row"><span class="mkd-meta-key">id</span><span class="mkd-meta-val">${this._esc(e.id).slice(0, 20)}…</span></div>
                        <div class="mkd-meta-row"><span class="mkd-meta-key">tipus</span><span class="mkd-meta-val">${this._esc(e.kind)}</span></div>
                        <div class="mkd-meta-row"><span class="mkd-meta-key">font</span><span class="mkd-meta-val">${this._esc(e.sourceType)}</span></div>
                        <div class="mkd-meta-row"><span class="mkd-meta-key">visibilitat</span><span class="mkd-meta-val">${this._esc(e.visibility)}</span></div>
                        ${e.cnae ? `<div class="mkd-meta-row"><span class="mkd-meta-key">cnae</span><span class="mkd-meta-val">${this._esc(e.cnae)}</span></div>` : ''}
                        ${e.sectorTT ? `<div class="mkd-meta-row"><span class="mkd-meta-key">sector</span><span class="mkd-meta-val">${this._esc(e.sectorTT)}</span></div>` : ''}
                        ${proj ? `<div class="mkd-meta-row"><span class="mkd-meta-key">projecte</span><span class="mkd-meta-val">${providerLink}</span></div>` : ''}
                        ${e.providerHandle ? `<div class="mkd-meta-row"><span class="mkd-meta-key">handle</span><span class="mkd-meta-val">${handleLink}</span></div>` : ''}
                        ${e.updatedAt ? `<div class="mkd-meta-row"><span class="mkd-meta-key">actualitzat</span><span class="mkd-meta-val">${new Date(e.updatedAt).toLocaleDateString('es-ES')}</span></div>` : ''}
                        ${tagsHtml ? `<div style="margin-top:1rem;"><div class="mkd-meta-key" style="margin-bottom:6px;">tags</div><div class="mkd-tags">${tagsHtml}</div></div>` : ''}
                    </div>
                </div>
            </div>
        </div>`;
    }

    _esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
