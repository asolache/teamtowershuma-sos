// =============================================================================
// TEAMTOWERS SOS V11 — MIND GRAPH VIEW (H8.1)
// Ruta: /js/views/MindGraphView.js · matchea /mind
//
// Vista panorámica del Mind-as-Graph total: TODOS los nodos del KB
// pintados como un grafo D3 force-directed con colores distintos por
// tipo. 3 capas de aristas: parent (jerarquía proyecto), relation
// (campos canónicos sopRef/role_ref/etc.), tag (folksonomía implícita).
//
// Click en nodo → /n/{id}. Filtros: tipo, proyecto, capas de aristas.
// =============================================================================

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import {
    buildGraphFromKb, graphStats, MIND_TYPE_COLORS, colorForType,
} from '../core/mindGraphService.js';
import { renderNavLinksHtml } from '../core/navService.js';

const KIND_LEGEND = [
    { type: 'project',          label: 'Proyectos' },
    { type: 'role',             label: 'Roles VNA' },
    { type: 'transaction',      label: 'Transacciones' },
    { type: 'sop',              label: 'SOPs' },
    { type: 'work_order',       label: 'Work Orders' },
    { type: 'workshop',         label: 'Workshops' },
    { type: 'market_item',      label: 'Mercado' },
    { type: 'ledger_entry',     label: 'Ledger' },
    { type: 'user_identity',    label: 'Identidad' },
    { type: 'smart_folder',     label: 'Folders' },
    { type: 'client_vna_model', label: 'Cliente VNA' },
    { type: 'soc',              label: 'SOC' },
];

export default class MindGraphView {
    constructor() {
        document.title = 'Mind Graph · SOS V11';
        this.allNodes = [];
        this.projects = [];
        this.graph    = { nodes: [], edges: [] };
        this.simulation = null;
        this.filter   = { onlyProjectId: '', minTagWeight: 1, includeTagEdges: true };
    }

    async getHtml() {
        await store.init();
        return `
        <style>
            .mg-shell  { height:100dvh; background:#050507; color:#e6e6e6; font-family:var(--font-base,sans-serif); display:flex; flex-direction:column; overflow:hidden; }
            .mg-topbar { display:flex; align-items:center; gap:1rem; padding:0.8rem 1.5rem; border-bottom:1px solid #1a1a22; background:#08080c; flex-shrink:0; flex-wrap:wrap; }
            .mg-logo   { font-weight:700; color:#fff; text-decoration:none; font-size:1.05rem; }
            .mg-logo span { color:#6366f1; }
            .mg-title  { color:#aaa; font-weight:500; letter-spacing:0.05em; text-transform:uppercase; font-size:0.78rem; }
            .mg-spacer { flex:1; }
            .mg-link   { color:#6366f1; text-decoration:none; font-size:0.85rem; }

            .mg-controls { display:flex; gap:0.5rem; align-items:center; padding:0.5rem 1.5rem; background:#0a0a10; border-bottom:1px solid #1a1a22; flex-shrink:0; flex-wrap:wrap; font-size:0.78rem; color:#aaa; }
            .mg-controls select, .mg-controls input { background:#050507; color:#e6e6e6; border:1px solid #2a2a35; padding:5px 8px; border-radius:5px; font-family:inherit; font-size:0.78rem; outline:none; }
            .mg-controls label { display:flex; gap:5px; align-items:center; cursor:pointer; user-select:none; }

            .mg-main   { flex:1; display:grid; grid-template-columns:1fr 240px; overflow:hidden; }
            @media (max-width:780px) { .mg-main { grid-template-columns: 1fr; } .mg-side { display:none; } }
            .mg-canvas { background:radial-gradient(circle at 50% 50%, #0b0b14 0%, #050507 100%); position:relative; overflow:hidden; }
            .mg-side   { background:#08080c; border-left:1px solid #1a1a22; padding:0.8rem 1rem; overflow-y:auto; }
            .mg-side h3 { font-size:0.78rem; color:#aaa; text-transform:uppercase; letter-spacing:0.05em; margin:0 0 0.4rem 0; font-family:monospace; }
            .mg-legend-row { display:flex; align-items:center; gap:8px; font-size:0.78rem; color:#ddd; margin-bottom:5px; }
            .mg-legend-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; box-shadow:0 0 6px currentColor; }
            .mg-legend-row .count { color:#888; font-family:monospace; font-size:0.7rem; margin-left:auto; }

            .mg-stat-row { display:flex; justify-content:space-between; font-size:0.78rem; color:#aaa; margin:0.3rem 0; }
            .mg-stat-row strong { color:#fff; font-family:monospace; }

            .mg-tooltip { position:absolute; pointer-events:none; background:#0e0e14; border:1px solid #2a2a35; border-radius:6px; padding:8px 10px; font-size:0.78rem; color:#e6e6e6; max-width:280px; z-index:10; display:none; box-shadow:0 4px 16px rgba(0,0,0,0.5); }
            .mg-tooltip .ttype { color:#888; text-transform:uppercase; font-family:monospace; font-size:0.65rem; letter-spacing:0.05em; }
            .mg-tooltip .ttitle { color:#fff; font-weight:600; margin:0.2rem 0; }
            .mg-tooltip .tid { color:#666; font-family:monospace; font-size:0.7rem; word-break:break-all; }

            .mg-empty { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#666; font-size:0.85rem; flex-direction:column; gap:0.5rem; padding:2rem; text-align:center; }
        </style>

        <div class="mg-shell">
            <div class="mg-topbar">
                <a href="/" data-link class="mg-logo">🗼 Team<span>Towers</span></a>
                <span class="mg-title">Mind-as-Graph · vista total</span>
                <div class="mg-spacer"></div>
                ${renderNavLinksHtml({ active: '', className: 'mg-link' })}
            </div>

            <div class="mg-controls">
                <select id="mgProjectFilter" title="Filtrar por proyecto">
                    <option value="">Todo el grafo (KB)</option>
                </select>
                <label><input type="checkbox" id="mgTagEdges" checked> Aristas por tags</label>
                <label>Min weight tags <input type="number" id="mgMinTag" value="1" min="1" max="9" style="width:50px;"></label>
                <span id="mgStatLine" style="margin-left:auto;color:#666;font-family:monospace;font-size:0.72rem;">cargando…</span>
            </div>

            <div class="mg-main">
                <div class="mg-canvas" id="mgCanvas">
                    <svg id="mgSvg" style="width:100%;height:100%;display:block;"></svg>
                    <div class="mg-tooltip" id="mgTooltip"></div>
                    <div class="mg-empty" id="mgEmpty" style="display:none;">
                        <div style="font-size:2rem;">🕸</div>
                        <div>El grafo está vacío. Crea proyectos, SOPs, WOs y vuelve.</div>
                        <a href="/dashboard" data-link class="mg-link">← Dashboard</a>
                    </div>
                </div>
                <aside class="mg-side" id="mgSide">
                    <h3>Tipos de nodo</h3>
                    <div id="mgLegend"></div>
                    <h3 style="margin-top:1.2rem;">Aristas</h3>
                    <div class="mg-stat-row"><span>Parent (jerarquía)</span><strong id="mgEdgeParent">0</strong></div>
                    <div class="mg-stat-row"><span>Relation (refs)</span><strong id="mgEdgeRel">0</strong></div>
                    <div class="mg-stat-row"><span>Tag (folksonomía)</span><strong id="mgEdgeTag">0</strong></div>
                    <h3 style="margin-top:1.2rem;">Cómo navegar</h3>
                    <div style="font-size:0.75rem;color:#aaa;line-height:1.45;">
                        Click en un nodo → abre <code>/n/{id}</code> · arrastra para reorganizar · scroll/pinch para zoom · doble click en canvas para liberar.
                    </div>
                </aside>
            </div>
        </div>`;
    }

    async afterRender() {
        await this._load();
        this._populateProjectFilter();
        this._bindControls();
        await this._loadD3();
        this._rebuildAndDraw();
    }

    destroy() {
        if (this.simulation) { this.simulation.stop(); this.simulation = null; }
    }

    async _load() {
        await KB.init();
        this.allNodes = await KB.getAllNodes();
        this.projects = (store.getState().projects || []).filter(p => !p.isArchived);
    }

    _populateProjectFilter() {
        const sel = document.getElementById('mgProjectFilter');
        if (!sel) return;
        const opts = this.projects.map(p => `<option value="${p.id}">${this._esc(p.nombre || p.id)}</option>`).join('');
        sel.insertAdjacentHTML('beforeend', opts);
    }

    _bindControls() {
        document.getElementById('mgProjectFilter')?.addEventListener('change', e => {
            this.filter.onlyProjectId = e.target.value || '';
            this._rebuildAndDraw();
        });
        document.getElementById('mgTagEdges')?.addEventListener('change', e => {
            this.filter.includeTagEdges = e.target.checked;
            this._rebuildAndDraw();
        });
        document.getElementById('mgMinTag')?.addEventListener('input', e => {
            const v = parseInt(e.target.value, 10);
            this.filter.minTagWeight = isNaN(v) || v < 1 ? 1 : v;
            this._rebuildAndDraw();
        });
    }

    async _loadD3() {
        if (window.d3) return;
        await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js';
            s.onload  = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    _rebuildAndDraw() {
        this.graph = buildGraphFromKb(this.allNodes, {
            onlyProjectId:   this.filter.onlyProjectId || null,
            includeTagEdges: this.filter.includeTagEdges,
            minTagWeight:    this.filter.minTagWeight,
        });
        this._renderLegend();
        this._renderStatLine();
        this._renderGraph();
    }

    _renderLegend() {
        const stats = graphStats(this.graph);
        const legend = document.getElementById('mgLegend');
        if (!legend) return;
        legend.innerHTML = KIND_LEGEND
            .filter(k => stats.byType[k.type] > 0)
            .map(k => {
                const color = colorForType(k.type);
                return `<div class="mg-legend-row"><span class="mg-legend-dot" style="background:${color};color:${color};"></span>${this._esc(k.label)}<span class="count">${stats.byType[k.type]}</span></div>`;
            }).join('') || '<div style="color:#666;font-size:0.75rem;">No hay nodos visibles con los filtros actuales.</div>';

        document.getElementById('mgEdgeParent').textContent = stats.byEdgeKind.parent   || 0;
        document.getElementById('mgEdgeRel').textContent    = stats.byEdgeKind.relation || 0;
        document.getElementById('mgEdgeTag').textContent    = stats.byEdgeKind.tag      || 0;
    }

    _renderStatLine() {
        const s = graphStats(this.graph);
        const line = document.getElementById('mgStatLine');
        if (line) line.textContent = `${s.totalNodes} nodos · ${s.totalEdges} aristas`;
    }

    _renderGraph() {
        const d3 = window.d3;
        const svgEl = document.getElementById('mgSvg');
        const empty = document.getElementById('mgEmpty');
        if (!svgEl || !d3) return;

        if (!this.graph.nodes.length) {
            d3.select(svgEl).selectAll('*').remove();
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';

        const canvas = document.getElementById('mgCanvas');
        const width  = canvas.clientWidth || 800;
        const height = canvas.clientHeight || 600;

        d3.select(svgEl).selectAll('*').remove();
        const svg = d3.select(svgEl).attr('viewBox', `0 0 ${width} ${height}`);

        // Capa zoom
        const g = svg.append('g');
        svg.call(d3.zoom().scaleExtent([0.2, 4]).on('zoom', (e) => g.attr('transform', e.transform)));

        // Defs · marker arrowheads para aristas relation
        const defs = svg.append('defs');
        defs.append('marker').attr('id', 'mg-arrow').attr('viewBox', '0 0 10 10')
            .attr('refX', 9).attr('refY', 5).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
            .append('path').attr('d', 'M0,0 L10,5 L0,10 z').attr('fill', '#6366f1');

        const nodes = this.graph.nodes.map(n => ({ ...n }));
        const links = this.graph.edges.map(e => ({ ...e }));

        // Stop sim previa si existía
        if (this.simulation) this.simulation.stop();

        const sim = d3.forceSimulation(nodes)
            .force('link',    d3.forceLink(links).id(d => d.id).distance(d => d.kind === 'parent' ? 50 : d.kind === 'relation' ? 70 : 110).strength(d => d.kind === 'parent' ? 1 : 0.3))
            .force('charge',  d3.forceManyBody().strength(-180))
            .force('center',  d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide().radius(d => 14 + (d.weight || 1) * 2));

        // Aristas (3 capas con estilos distintos)
        const link = g.append('g').attr('stroke-opacity', 0.6).selectAll('line').data(links).join('line')
            .attr('stroke', d => d.kind === 'parent' ? '#475569' : d.kind === 'relation' ? '#6366f1' : '#7dd3fc')
            .attr('stroke-width', d => d.kind === 'parent' ? 1.5 : d.kind === 'relation' ? 1.2 : 0.6 + (d.weight || 1) * 0.4)
            .attr('stroke-dasharray', d => d.kind === 'tag' ? '3 2' : null)
            .attr('marker-end', d => d.kind === 'relation' ? 'url(#mg-arrow)' : null);

        // Nodos (círculo + label)
        const tooltip = document.getElementById('mgTooltip');
        const node = g.append('g').selectAll('g.mg-node').data(nodes).join('g').attr('class', 'mg-node').style('cursor', 'pointer');

        node.append('circle')
            .attr('r', d => 6 + Math.min(6, (d.weight || 1) * 2))
            .attr('fill', d => d.color)
            .attr('stroke', '#0a0a14').attr('stroke-width', 1.5);

        node.append('text')
            .text(d => (d.label || d.id).slice(0, 22))
            .attr('x', 10).attr('y', 4).attr('font-size', 9.5)
            .attr('fill', '#cbd5e1').attr('font-family', 'system-ui, sans-serif')
            .attr('pointer-events', 'none');

        // Hover tooltip + click navigate
        node
            .on('mouseenter', (event, d) => {
                if (!tooltip) return;
                tooltip.innerHTML = `
                    <div class="ttype">${this._esc(d.type)}</div>
                    <div class="ttitle">${this._esc(d.label || d.id)}</div>
                    <div class="tid">${this._esc(d.id)}</div>
                    ${d.tags && d.tags.length ? `<div style="margin-top:4px;font-size:0.7rem;color:#a5b4fc;">${d.tags.slice(0, 3).map(t => '#' + this._esc(t)).join(' ')}</div>` : ''}
                `;
                tooltip.style.display = 'block';
                tooltip.style.left = (event.offsetX + 12) + 'px';
                tooltip.style.top  = (event.offsetY + 12) + 'px';
            })
            .on('mousemove', (event) => {
                if (!tooltip) return;
                tooltip.style.left = (event.offsetX + 12) + 'px';
                tooltip.style.top  = (event.offsetY + 12) + 'px';
            })
            .on('mouseleave', () => { if (tooltip) tooltip.style.display = 'none'; })
            .on('click', (event, d) => {
                event.stopPropagation();
                if (window.navigateTo) window.navigateTo('/n/' + encodeURIComponent(d.id));
            });

        // Drag
        node.call(d3.drag()
            .on('start', (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
            .on('drag',  (event, d) => { d.fx = event.x; d.fy = event.y; })
            .on('end',   (event, d) => { if (!event.active) sim.alphaTarget(0); /* no soltar fijado */ }));

        // Doble click en canvas → liberar todos
        svg.on('dblclick.unfix', () => {
            nodes.forEach(n => { n.fx = null; n.fy = null; });
            sim.alpha(0.5).restart();
        });

        sim.on('tick', () => {
            link
                .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        this.simulation = sim;
    }

    _esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }
}
