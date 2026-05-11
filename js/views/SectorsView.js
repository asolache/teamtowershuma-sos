// =============================================================================
// TEAMTOWERS SOS V11 — SECTORS VIEW
// Ruta: /sectors
//
// UX-AUDIT-001 sprint H+ (input @alvaro 2026-05-10): el botó "📚 Knowledge
// Base" del topbar del Dashboard saturava i sortia a totes les vistes ·
// ara és un enllaç dins la categoria "Coneixement" del nav que apunta
// aquí. Vista dedicada amb el catàleg dels 19 sectors A-S amb readiness +
// drill-down a roles i transaccions clau (mateixa lògica que el panell
// lateral del Dashboard, com a pàgina pròpia).
// =============================================================================

import { store } from '../core/store.js';
import { KnowledgeLoader } from '../core/KnowledgeLoader.js';
import { renderNavGroupedHtml, ensureNavGroupStyle, bindNavGroupDropdowns } from '../core/navService.js';

const READINESS_STYLE = Object.freeze({
    'ready':  'background:rgba(16,185,129,0.12);color:var(--accent-green);',
    'solid':  'background:rgba(99,102,241,0.12);color:var(--accent-indigo);',
    'tier 2': 'background:rgba(245,158,11,0.12);color:var(--accent-orange);',
});

const LEVEL_COLORS = Object.freeze({ pinya: '#00b0ff', tronc: '#6366f1', pom_de_dalt: '#a855f7' });
const LEVEL_LABELS = Object.freeze({ pinya: 'Base', tronc: 'Core', pom_de_dalt: 'Strategic' });

function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function(ch) {
        return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch];
    });
}

export default class SectorsView {
    constructor() {
        document.title = 'Sectors · catàleg · SOS V11';
        this._selected = null;
    }

    async getHtml() {
        await store.init();
        return `
        <style>
            .sec-shell { height: 100dvh; background: var(--bg-dark); color: var(--text-main); font-family: var(--font-base); display: flex; flex-direction: column; overflow: hidden; }
            .sec-topbar { display: flex; align-items: center; gap: 1rem; padding: 0.85rem 1.5rem; border-bottom: 1px solid var(--border-default); background: var(--bg-panel); flex-shrink: 0; }
            .sec-logo { font-weight: 700; color: var(--text-main); text-decoration: none; font-size: 1.05rem; }
            .sec-logo span { color: var(--accent-indigo); }
            .sec-title { color: var(--text-secondary); font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; font-size: 0.78rem; }
            .sec-spacer { flex: 1; }
            .sec-link { color: var(--text-secondary); text-decoration: none; font-size: 0.85rem; padding: 6px 12px; border-radius: var(--radius-sm); transition: all var(--dur-fast); }
            .sec-link:hover { color: var(--text-main); background: var(--glass-hover); }

            .sec-main { padding: 1.5rem; flex: 1; overflow-y: auto; max-width: 1200px; margin: 0 auto; width: 100%; box-sizing: border-box; }

            .sec-hero { margin-bottom: 1.6rem; }
            .sec-hero h1 { margin: 0; color: var(--text-main); font-size: 1.6rem; letter-spacing: -0.02em; font-weight: 800; }
            .sec-hero p { color: var(--text-muted); font-size: var(--text-sm); margin-top: 6px; line-height: 1.6; max-width: 720px; }

            .sec-grid { display: grid; grid-template-columns: minmax(280px, 360px) 1fr; gap: 1.4rem; align-items: start; }
            @media (max-width: 900px) { .sec-grid { grid-template-columns: 1fr; } }

            .sec-list { display: flex; flex-direction: column; gap: 6px; }
            .sec-item {
                background: var(--bg-panel);
                border: 1px solid var(--border-default);
                border-radius: var(--radius-md);
                padding: 10px 14px;
                cursor: pointer;
                transition: all var(--dur-fast);
                display: flex; align-items: center; justify-content: space-between; gap: 8px;
                box-shadow: var(--shadow-sm);
            }
            .sec-item:hover { background: var(--glass-hover); border-color: var(--accent-indigo); transform: translateY(-1px); }
            .sec-item.active { border-color: var(--accent-claude); background: rgba(212,168,83,0.06); }
            .sec-item-name { font-size: var(--text-sm); color: var(--text-main); font-weight: 600; }
            .sec-item-meta { color: var(--text-muted); font-size: 11px; font-family: var(--font-mono); margin-top: 2px; }
            .sec-item-badge { font-size: 10px; font-family: var(--font-mono); padding: 3px 10px; border-radius: 999px; font-weight: 700; white-space: nowrap; }

            .sec-detail { background: var(--bg-panel); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 1.2rem; min-height: 240px; box-shadow: var(--shadow-sm); }
            .sec-detail-empty { color: var(--text-muted); font-size: var(--text-sm); text-align: center; padding: 2rem 1rem; font-style: italic; }
            .sec-detail-title { font-size: var(--text-md); font-weight: 700; color: var(--text-main); margin-bottom: 8px; letter-spacing: -0.01em; }
            .sec-detail-meta { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); margin-bottom: 14px; }

            .sec-role-item {
                background: var(--bg-elevated);
                border: 1px solid var(--border-subtle);
                border-left: 3px solid var(--accent-indigo);
                border-radius: var(--radius-sm);
                padding: 8px 12px;
                margin-bottom: 6px;
            }
            .sec-role-name { font-size: var(--text-sm); font-weight: 600; color: var(--text-main); }
            .sec-role-desc { font-size: 12px; color: var(--text-secondary); margin-top: 2px; line-height: 1.45; }
            .sec-role-level { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 3px; }

            .sec-section-h { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.08em; margin: 12px 0 8px; font-weight: 600; }

            .sec-tx-item { display: flex; align-items: center; gap: 8px; padding: 5px 0; font-size: 13px; color: var(--text-secondary); }
            .sec-tx-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        </style>

        <div class="sec-shell">
            <div class="sec-topbar">
                <a href="/" data-link class="sec-logo">🗼 Team<span>Towers</span></a>
                <span class="sec-title">📚 Sectors · catàleg A-S</span>
                <div class="sec-spacer"></div>
                
            </div>

            <div class="sec-main">
                <header class="sec-hero">
                    <h1>📚 Sectors · catàleg de coneixement</h1>
                    <p>19 sectors A-S amb roles i transaccions tipus carregats des de <code>knowledge/sectors/</code>. Cada sector mostra la seva <strong>readiness</strong> (<span style="color:var(--accent-green);">ready</span> · <span style="color:var(--accent-indigo);">solid</span> · <span style="color:var(--accent-orange);">tier 2</span>) segons quantitat de roles/transaccions/patterns i cobertura bilingüe. Fes clic a un sector per veure el seu detall.</p>
                </header>

                <div class="sec-grid">
                    <div class="sec-list" id="secList">
                        <div class="sec-detail-empty">Carregant sectors…</div>
                    </div>
                    <div class="sec-detail" id="secDetail">
                        <div class="sec-detail-empty">Selecciona un sector de la llista per veure els seus roles i transaccions clau.</div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    async afterRender() {
        ensureNavGroupStyle();
        bindNavGroupDropdowns(document);
        await this._loadList();
    }

    async _loadList() {
        const list = document.getElementById('secList');
        if (!list) return;
        const sectors = await KnowledgeLoader.listSectors();
        const self = this;
        list.innerHTML = sectors.map(function(s) {
            const r = s.readiness || 'tier 2';
            const meta = (s.roles || 0) + ' roles · ' + (s.transactions || 0) + ' tx · ' + (s.patterns || 0) + ' patterns';
            const badgeStyle = READINESS_STYLE[r] || READINESS_STYLE['tier 2'];
            return '<div class="sec-item" data-sector="' + escapeHtml(s.id) + '">'
                + '<div>'
                +   '<div class="sec-item-name">' + escapeHtml(s.id) + ' · ' + escapeHtml(s.name) + '</div>'
                +   '<div class="sec-item-meta">' + meta + '</div>'
                + '</div>'
                + '<span class="sec-item-badge" style="' + badgeStyle + '">' + r + '</span>'
                + '</div>';
        }).join('');
        list.querySelectorAll('.sec-item').forEach(function(el) {
            el.addEventListener('click', function() {
                list.querySelectorAll('.sec-item').forEach(function(x) { x.classList.remove('active'); });
                el.classList.add('active');
                self._loadDetail(el.getAttribute('data-sector'));
            });
        });
    }

    async _loadDetail(sectorId) {
        const detail = document.getElementById('secDetail');
        if (!detail) return;
        detail.innerHTML = '<div class="sec-detail-empty">Carregant…</div>';
        const seed = await KnowledgeLoader.getSectorSeed(sectorId);
        if (!seed || (seed.roles || []).length === 0) {
            detail.innerHTML = '<div class="sec-detail-empty" style="color:var(--accent-orange);">Sector encara no carregat · es generarà amb IA quan calgui (tier 2).</div>';
            return;
        }
        let html = '<div class="sec-detail-title">' + escapeHtml(seed.sectorName || sectorId) + '</div>';
        html += '<div class="sec-detail-meta">' + (seed.roles.length) + ' roles · ' + (seed.transactions.length) + ' transaccions</div>';

        html += '<div class="sec-section-h">Roles tipus</div>';
        seed.roles.forEach(function(r) {
            const lvlColor = LEVEL_COLORS[r.castell_level] || '#6366f1';
            const lvlLabel = LEVEL_LABELS[r.castell_level] || r.castell_level || '—';
            const desc = (r.description || '').slice(0, 140);
            html += '<div class="sec-role-item" style="border-left-color:' + lvlColor + ';">'
                + '<div class="sec-role-name">' + escapeHtml(r.name || r.id) + '</div>'
                + (desc ? '<div class="sec-role-desc">' + escapeHtml(desc) + (r.description && r.description.length > 140 ? '…' : '') + '</div>' : '')
                + '<div class="sec-role-level">' + escapeHtml(lvlLabel) + (r.typical_actor ? ' · ' + escapeHtml(r.typical_actor) : '') + '</div>'
                + '</div>';
        });

        html += '<div class="sec-section-h">Transaccions clau</div>';
        seed.transactions.slice(0, 12).forEach(function(t) {
            const color = t.type === 'intangible' ? 'var(--accent-claude)' : 'var(--accent-green)';
            html += '<div class="sec-tx-item">'
                + '<div class="sec-tx-dot" style="background:' + color + ';"></div>'
                + '<div>' + escapeHtml(t.deliverable || t.id) + (t.is_must ? ' <span style="color:var(--text-muted);font-family:var(--font-mono);font-size:10px;">[MUST]</span>' : '') + '</div>'
                + '</div>';
        });
        if (seed.transactions.length > 12) {
            html += '<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:6px;font-family:var(--font-mono);">+' + (seed.transactions.length - 12) + ' transaccions més</div>';
        }
        detail.innerHTML = html;
    }
}
