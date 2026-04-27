// =============================================================================
// TEAMTOWERS SOS V11 — DASHBOARD VIEW
// Ruta: /js/views/DashboardView.js
//
// Hub central: lista de proyectos agrupados por sector, crear nuevo proyecto,
// panel de knowledge base inline.
//
// BACKLOG: vista intermedia de detalle de proyecto antes de abrir el mapa.
// =============================================================================

import { store }           from '../core/store.js';
import { KB }              from '../core/kb.js';
import { KnowledgeLoader } from '../core/KnowledgeLoader.js';
import { t, langSelectorHtml } from '../i18n.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid() { return 'proj-' + Math.random().toString(36).slice(2, 9); }

function formatDate(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function healthColor(score) {
    if (score >= 75) return '#00e676';
    if (score >= 50) return '#ff9100';
    return '#ff5252';
}

// Calcula health score agregado de un proyecto (promedio de roles)
function projectHealth(proj) {
    const roles = proj.vna_roles        || [];
    const txs   = proj.vna_transactions || [];
    if (roles.length === 0) return null;

    let total = 0;
    roles.forEach(function(r) {
        let s = 0;
        const txIn  = txs.filter(function(t) { return t.to   === r.id; });
        const txOut = txs.filter(function(t) { return t.from === r.id; });
        if (txIn.length  > 0) s += 25;
        if (txOut.length > 0) s += 25;
        const all = txIn.concat(txOut);
        if (all.some(function(t) { return t.type === 'intangible'; })) s += 25;
        const neighbors = new Set(txOut.map(function(t) { return t.to; }).concat(txIn.map(function(t) { return t.from; })));
        for (const nb of neighbors) {
            if (txOut.some(function(t) { return t.to === nb; }) && txIn.some(function(t) { return t.from === nb; })) { s += 25; break; }
        }
        total += Math.min(s, 100);
    });
    return Math.round(total / roles.length);
}

// =============================================================================
export default class DashboardView {

    constructor() {
        document.title = 'Dashboard · SOS V11';
        this._kbOpen   = false;
        this._kbSector = null;
    }

    async getHtml() {
        await store.init();
        const sectors = await KnowledgeLoader.listSectors();
        const sectorOptions = sectors.map(function(s) {
            return '<option value="' + s.id + '">' + s.id + ' · ' + s.name + '</option>';
        }).join('');

        return `
        <style>
            .dash-shell {
                height: 100dvh;
                width: 100%;
                background: var(--bg-dark);
                font-family: var(--font-base);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            /* ── Topbar ── */
            .dash-topbar {
                display: flex; align-items: center; gap: 12px;
                padding: 0 20px; height: 52px;
                border-bottom: 1px solid var(--glass-border);
                background: rgba(10,10,15,0.97);
                position: sticky; top: 0; z-index: 20; flex-shrink: 0;
            }
            .dash-logo {
                font-size: var(--text-sm); font-weight: 900; color: white;
                display: flex; align-items: center; gap: 6px; text-decoration: none;
            }
            .dash-logo span { color: var(--accent-indigo); }
            .dash-topbar-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }
            .dash-btn {
                background: transparent; border: 1px solid var(--glass-border);
                color: var(--text-secondary); padding: 5px 14px;
                border-radius: var(--radius-sm); font-size: var(--text-xs);
                font-weight: 700; cursor: pointer; transition: all var(--duration-fast);
                font-family: var(--font-base);
            }
            .dash-btn:hover { border-color: var(--accent-indigo); color: white; }
            .dash-btn-primary {
                background: var(--accent-indigo); border-color: var(--accent-indigo); color: white;
            }
            .dash-btn-primary:hover { filter: brightness(1.12); }
            .dash-btn-kb {
                border-color: rgba(212,168,83,0.4); color: var(--accent-gold);
            }
            .dash-btn-kb:hover { background: rgba(212,168,83,0.08); }

            /* ── Main layout ── */
            .dash-main {
                flex: 1;
                display: grid;
                grid-template-columns: 1fr;
                gap: 0;
                overflow: hidden;
                min-height: 0;
                height: 0;
            }
            .dash-main.kb-open { grid-template-columns: 1fr 360px; }

            /* ── Content area ── */
            .dash-content {
                padding: 28px 32px;
                overflow-y: auto;
                overflow-x: hidden;
                height: 100%;
                box-sizing: border-box;
            }

            .dash-hero {
                margin-bottom: 32px;
                animation: fadeIn 0.5s var(--ease-out);
            }
            .dash-hero h1 {
                font-size: var(--text-2xl); font-weight: 900;
                color: white; letter-spacing: -0.5px; margin-bottom: 4px;
            }
            .dash-hero h1 span { color: var(--accent-indigo); }
            .dash-hero-sub { font-size: var(--text-sm); color: var(--text-muted); font-family: var(--font-mono); }

            /* ── Stats bar ── */
            .dash-stats {
                display: flex; gap: 16px; margin-bottom: 32px; flex-wrap: wrap;
            }
            .dash-stat {
                background: rgba(25,25,32,0.7); border: 1px solid var(--glass-border);
                border-radius: var(--radius-md); padding: 12px 18px;
                min-width: 120px;
            }
            .dash-stat-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; font-family: var(--font-mono); margin-bottom: 4px; }
            .dash-stat-value { font-size: var(--text-xl); font-weight: 900; color: white; font-family: var(--font-mono); }

            /* ── Sector group ── */
            .dash-sector-group { margin-bottom: 32px; animation: slideUp 0.4s var(--ease-out); }
            .dash-sector-label {
                font-size: 10px; font-weight: 700; color: var(--text-muted);
                text-transform: uppercase; letter-spacing: 0.12em; font-family: var(--font-mono);
                margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
            }
            .dash-sector-label::after { content: ''; flex: 1; height: 1px; background: var(--glass-border); }

            /* ── Project cards grid ── */
            .dash-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }

            .dash-card {
                background: linear-gradient(145deg, rgba(25,25,32,0.9), rgba(10,10,15,0.95));
                border: 1px solid var(--glass-border); border-radius: var(--radius-xl);
                padding: 18px 20px; cursor: pointer; text-decoration: none; color: inherit;
                transition: all var(--duration-base) var(--ease-out);
                display: flex; flex-direction: column; gap: 10px;
                position: relative; overflow: hidden;
            }
            .dash-card:hover {
                border-color: var(--accent-indigo);
                transform: translateY(-2px);
                box-shadow: var(--shadow-indigo);
            }
            .dash-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
            .dash-card-name { font-size: var(--text-sm); font-weight: 900; color: white; line-height: 1.3; }
            .dash-card-sector-badge {
                font-size: 9px; font-family: var(--font-mono); padding: 2px 7px;
                border-radius: 3px; background: rgba(99,102,241,0.15);
                color: var(--accent-indigo); flex-shrink: 0; font-weight: 700;
            }
            .dash-card-meta {
                font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);
                display: flex; gap: 10px; flex-wrap: wrap;
            }
            .dash-card-meta span { display: flex; align-items: center; gap: 3px; }
            .dash-card-footer {
                display: flex; align-items: center; justify-content: space-between;
                padding-top: 8px; border-top: 1px solid var(--glass-border);
            }
            .dash-card-date { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
            .dash-card-health {
                font-size: 10px; font-weight: 700; font-family: var(--font-mono);
                padding: 2px 7px; border-radius: 3px;
            }
            .dash-card-actions {
                position: absolute; top: 10px; right: 10px;
                display: none; gap: 4px;
            }
            .dash-card:hover .dash-card-actions { display: flex; }
            .dash-card-action-btn {
                background: rgba(10,10,15,0.9); border: 1px solid var(--glass-border);
                color: var(--text-muted); font-size: 10px; padding: 3px 8px;
                border-radius: var(--radius-sm); cursor: pointer; transition: all var(--duration-fast);
                font-family: var(--font-base); font-weight: 700;
            }
            .dash-card-action-btn:hover { color: var(--accent-red); border-color: rgba(255,82,82,0.4); }

            /* ── New project card ── */
            .dash-card-new {
                border: 1px dashed rgba(99,102,241,0.25); border-radius: var(--radius-xl);
                padding: 18px 20px; cursor: pointer; color: var(--text-muted);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                gap: 8px; min-height: 120px; transition: all var(--duration-base) var(--ease-out);
            }
            .dash-card-new:hover { border-color: var(--accent-indigo); color: var(--accent-indigo); background: rgba(99,102,241,0.04); }
            .dash-card-new-icon { font-size: 1.8rem; }
            .dash-card-new-label { font-size: var(--text-xs); font-weight: 700; }

            /* ── Empty state ── */
            .dash-empty {
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                min-height: 320px; gap: 12px; opacity: 0.5;
            }
            .dash-empty-icon { font-size: 3rem; }
            .dash-empty-text { font-size: var(--text-sm); color: var(--text-muted); font-family: var(--font-mono); text-align: center; }

            /* ── Knowledge panel ── */
            .dash-kb-panel {
                border-left: 1px solid var(--glass-border);
                background: rgba(8,8,12,0.98);
                overflow-y: auto;
                display: none;
            }
            .dash-main.kb-open .dash-kb-panel { display: flex; flex-direction: column; }
            .dash-kb-head {
                padding: 14px 16px 10px; border-bottom: 1px solid var(--glass-border);
                display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
            }
            .dash-kb-title { font-size: var(--text-sm); font-weight: 900; color: var(--accent-gold); display: flex; align-items: center; gap: 6px; }
            .dash-kb-close { background: transparent; border: none; color: var(--text-muted); font-size: 1rem; cursor: pointer; padding: 2px 6px; border-radius: var(--radius-sm); }
            .dash-kb-close:hover { color: white; }
            .dash-kb-body { flex: 1; overflow-y: auto; padding: 14px 16px; }
            .dash-kb-sector-item {
                display: flex; align-items: center; justify-content: space-between;
                padding: 8px 10px; border-radius: var(--radius-sm); cursor: pointer;
                transition: background var(--duration-fast); margin-bottom: 4px;
                border: 1px solid transparent;
            }
            .dash-kb-sector-item:hover { background: var(--glass-hover); }
            .dash-kb-sector-item.active { background: rgba(212,168,83,0.08); border-color: rgba(212,168,83,0.2); }
            .dash-kb-sector-name { font-size: var(--text-xs); color: var(--text-secondary); font-weight: 700; }
            .dash-kb-sector-badge {
                font-size: 9px; font-family: var(--font-mono); padding: 2px 6px;
                border-radius: 3px; font-weight: 700;
            }
            .dash-kb-detail { margin-top: 12px; }
            .dash-kb-detail-title { font-size: var(--text-sm); font-weight: 900; color: white; margin-bottom: 8px; }
            .dash-kb-role-item {
                padding: 7px 10px; border-radius: var(--radius-sm);
                background: rgba(25,25,32,0.8); margin-bottom: 5px;
                border-left: 2px solid var(--accent-indigo);
            }
            .dash-kb-role-name { font-size: var(--text-xs); color: white; font-weight: 700; margin-bottom: 2px; }
            .dash-kb-role-desc { font-size: 10px; color: var(--text-muted); line-height: 1.5; }
            .dash-kb-role-level { font-size: 9px; font-family: var(--font-mono); color: var(--accent-indigo); margin-top: 3px; }
            .dash-kb-tx-item {
                padding: 6px 10px; border-radius: var(--radius-sm);
                background: rgba(25,25,32,0.6); margin-bottom: 4px;
                display: flex; gap: 8px; align-items: flex-start;
            }
            .dash-kb-tx-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
            .dash-kb-tx-text { font-size: 10px; color: var(--text-muted); line-height: 1.5; }
            .dash-kb-spinner { text-align: center; padding: 24px; color: var(--text-muted); font-family: var(--font-mono); font-size: var(--text-xs); }

            /* ── Modal nuevo proyecto ── */
            .dash-modal-bg {
                display: none; position: fixed; inset: 0; z-index: 1000;
                background: rgba(0,0,0,0.65); align-items: center; justify-content: center;
            }
            .dash-modal-bg.open { display: flex; }
            .dash-modal {
                background: var(--bg-elevated); border: 1px solid var(--glass-border);
                border-radius: var(--radius-xl); padding: 24px; width: 400px; max-width: 95vw;
                animation: slideUp var(--duration-base) var(--ease-spring);
            }
            .dash-modal h2 { font-size: var(--text-lg); font-weight: 900; margin: 0 0 4px; color: white; }
            .dash-modal-sub { font-size: var(--text-xs); color: var(--text-muted); margin-bottom: 20px; font-family: var(--font-mono); }
            .dash-form-group { margin-bottom: 14px; }
            .dash-form-label { display: block; font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; margin-bottom: 5px; }
            .dash-form-input {
                width: 100%; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border);
                color: white; padding: 10px 12px; border-radius: var(--radius-md);
                font-family: var(--font-base); font-size: var(--text-sm); outline: none;
                transition: border-color var(--duration-fast); box-sizing: border-box;
            }
            .dash-form-input:focus { border-color: var(--accent-indigo); }
            .dash-modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
            .dash-modal-cancel { background: transparent; border: 1px solid var(--glass-border); color: var(--text-muted); padding: 9px 18px; border-radius: var(--radius-md); cursor: pointer; font-weight: 700; font-size: var(--text-sm); font-family: var(--font-base); }
            .dash-modal-cancel:hover { color: white; }
            .dash-modal-confirm { background: var(--accent-indigo); border: none; color: white; padding: 9px 20px; border-radius: var(--radius-md); cursor: pointer; font-weight: 900; font-size: var(--text-sm); font-family: var(--font-base); }
            .dash-modal-confirm:hover { filter: brightness(1.1); }

            
            /* ── Hero v2 ── */
            .dash-hero-bg {
                position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0;
            }
            .dash-hero-bg svg { width: 100%; height: 100%; opacity: .04; }
            .dash-hero-inner { position: relative; z-index: 1; }
            .dash-hero { position: relative; margin-bottom: 32px; padding: 28px 0 24px;
                border-bottom: 1px solid var(--glass-border); animation: fadeIn 0.5s var(--ease-out); }
            .dash-hero h1 { font-size: 2rem; font-weight: 900; color: white;
                letter-spacing: -0.5px; margin-bottom: 4px; line-height: 1.2; }
            .dash-hero h1 span { color: var(--accent-indigo); }
            .dash-hero-sub { font-size: var(--text-sm); color: var(--text-muted);
                font-family: var(--font-mono); margin-top: 6px; }
            .dash-hero-tagline { font-size: var(--text-xs); color: var(--text-muted);
                font-family: var(--font-mono); margin-top: 4px; opacity: .7; }

            /* ── Stats v2 ── */
            .dash-stat { background: rgba(25,25,32,0.7); border: 1px solid var(--glass-border);
                border-radius: var(--radius-md); padding: 12px 18px; min-width: 120px;
                position: relative; overflow: hidden; }
            .dash-stat-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase;
                letter-spacing: 0.1em; font-family: var(--font-mono); margin-bottom: 4px; }
            .dash-stat-value { font-size: var(--text-xl); font-weight: 900; color: white;
                font-family: var(--font-mono); }
            .dash-stat-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
                background: var(--glass-border); }
            .dash-stat-bar-fill { height: 100%; border-radius: 0 2px 2px 0; transition: width .6s ease; }

            /* ── Card v2 ── */
            .dash-card-demo { border-color: rgba(201,168,83,0.4) !important; }
            .dash-card-demo:hover { border-color: rgba(201,168,83,0.8) !important;
                box-shadow: 0 8px 30px rgba(201,168,83,0.15) !important; }
            .dash-card-demo-badge {
                font-size: 8px; font-family: var(--font-mono); font-weight: 700;
                letter-spacing: .1em; text-transform: uppercase;
                background: rgba(201,168,83,0.15); color: var(--accent-gold);
                padding: 2px 6px; border-radius: 2px; flex-shrink: 0;
            }
            .dash-card-health-bar {
                height: 3px; border-radius: 2px; margin-top: 2px;
                background: var(--glass-border); overflow: hidden;
            }
            .dash-card-health-fill { height: 100%; border-radius: 2px; transition: width .5s ease; }
            .dash-card-nodes {
                display: flex; gap: 3px; flex-wrap: wrap; margin-top: 4px;
            }
            .dash-card-node-dot {
                width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
            }
            .dash-card-date-rel {
                font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);
                font-style: italic;
            }

            /* ── Empty state v2 ── */
            .dash-empty-v2 {
                display: flex; flex-direction: column; align-items: center;
                justify-content: center; min-height: 340px; gap: 16px;
                animation: fadeIn .5s var(--ease-out);
            }
            .dash-empty-icon { font-size: 2.5rem; opacity: .5; }
            .dash-empty-title { font-size: var(--text-lg); font-weight: 900; color: white;
                text-align: center; }
            .dash-empty-sub { font-size: var(--text-xs); color: var(--text-muted);
                font-family: var(--font-mono); text-align: center; }
            .dash-empty-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;
                margin-top: 8px; }
            .dash-empty-cta {
                background: var(--accent-indigo); border: none; color: white;
                padding: 9px 20px; border-radius: var(--radius-md); cursor: pointer;
                font-weight: 900; font-size: var(--text-xs); font-family: var(--font-base);
                transition: filter .2s; text-decoration: none; display: inline-block;
            }
            .dash-empty-cta:hover { filter: brightness(1.12); }
            .dash-empty-cta-ghost {
                background: transparent; border: 1px solid rgba(201,168,83,0.4);
                color: var(--accent-gold); padding: 9px 20px; border-radius: var(--radius-md);
                cursor: pointer; font-weight: 700; font-size: var(--text-xs);
                font-family: var(--font-base); transition: all .2s; text-decoration: none;
                display: inline-block;
            }
            .dash-empty-cta-ghost:hover { background: rgba(201,168,83,0.08); }

            /* ── KB mini-map ── */
            .dash-kb-mini-map {
                margin: 10px 0 12px; background: rgba(5,5,7,0.8);
                border-radius: var(--radius-sm); padding: 8px; overflow: hidden;
            }
            .dash-kb-mini-map svg { width: 100%; height: 80px; }

            /* ── Topbar v2 ── */
            .dash-topbar-version {
                font-size: 9px; color: var(--text-muted); font-family: var(--font-mono);
                letter-spacing: .08em; text-transform: uppercase;
            }
            .dash-topbar-sep {
                width: 1px; height: 16px; background: var(--glass-border); flex-shrink: 0;
            }
            .dash-topbar-web {
                font-size: var(--text-xs); color: var(--text-muted); text-decoration: none;
                font-family: var(--font-mono); transition: color .15s;
            }
            .dash-topbar-web:hover { color: var(--accent-gold); }

            @media (max-width: 768px) {
                .dash-content { padding: 16px; }
                .dash-main.kb-open { grid-template-columns: 1fr; }
                .dash-main.kb-open .dash-kb-panel { display: none; }
            }
        </style>

        <div class="dash-shell">

            <!-- TOPBAR -->
            <div class="dash-topbar">
                <a href="/" data-link class="dash-logo">🗼 Team<span>Towers</span></a>
                <div class="dash-topbar-sep"></div>
                <span class="dash-topbar-version">SOS V11</span>
                <a href="https://teamtowershuma.com" target="_blank" class="dash-topbar-web">teamtowershuma.com ↗</a>
                <div class="dash-topbar-right">
                    <a href="/workshops" data-link class="dash-btn">🎯 Workshops</a>
                    <button class="dash-btn dash-btn-kb" id="dashBtnKB">📚 Knowledge Base</button>
                    <button class="dash-btn" id="dashBtnExport" title="Descargar snapshot firmado (ECDSA P-256)">💾 Export</button>
                    <button class="dash-btn" id="dashBtnImport" title="Cargar snapshot firmado">📥 Import</button>
                    <input type="file" id="dashImportFile" accept=".json,application/json" style="display:none;">
                    <button class="dash-btn dash-btn-primary" id="dashBtnNew">＋ New Project</button>
                    <a href="/settings" data-link class="dash-btn">⚙ Settings</a>
                    <div id="dashLangSelector"></div>
                </div>
            </div>

            <!-- MAIN -->
            <div class="dash-main" id="dashMain">

                <!-- CONTENT -->
                <div class="dash-content" id="dashContent">
                    <div class="dash-hero">
                        <div class="dash-hero-bg">
                            <svg viewBox="0 0 800 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                                <line x1="100" y1="60" x2="400" y2="60" stroke="rgba(99,102,241,1)" stroke-width="1"/>
                                <line x1="400" y1="60" x2="700" y2="30" stroke="rgba(99,102,241,1)" stroke-width="1"/>
                                <line x1="400" y1="60" x2="600" y2="90" stroke="rgba(201,168,83,1)" stroke-width="1" stroke-dasharray="4 5"/>
                                <line x1="100" y1="60" x2="250" y2="20" stroke="rgba(201,168,83,1)" stroke-width="1" stroke-dasharray="4 5"/>
                                <circle cx="100" cy="60" r="5" fill="rgba(99,102,241,0.6)"/>
                                <circle cx="400" cy="60" r="7" fill="rgba(99,102,241,0.8)"/>
                                <circle cx="700" cy="30" r="5" fill="rgba(99,102,241,0.5)"/>
                                <circle cx="600" cy="90" r="4" fill="rgba(201,168,83,0.6)"/>
                                <circle cx="250" cy="20" r="4" fill="rgba(201,168,83,0.5)"/>
                                <circle r="2.5" fill="rgba(99,102,241,0.8)"><animateMotion dur="3s" repeatCount="indefinite" path="M100,60 L400,60"/></circle>
                                <circle r="2" fill="rgba(201,168,83,0.7)"><animateMotion dur="4s" repeatCount="indefinite" begin="1s" path="M400,60 L600,90"/></circle>
                            </svg>
                        </div>
                        <div class="dash-hero-inner">
                            <h1>Value <span>Network</span> Dashboard</h1>
                            <div class="dash-hero-sub" id="dashHeroSub">Loading projects…</div>
                            <div class="dash-hero-tagline">Every organization has two structures. This maps the real one.</div>
                        </div>
                    </div>
                    <div class="dash-stats" id="dashStats"></div>
                    <div id="dashProjectList"></div>
                </div>

                <!-- KB PANEL -->
                <div class="dash-kb-panel" id="dashKBPanel">
                    <div class="dash-kb-head">
                        <div class="dash-kb-title">📚 Knowledge Base</div>
                        <button class="dash-kb-close" id="dashKBClose">✕</button>
                    </div>
                    <div class="dash-kb-body" id="dashKBBody">
                        <div class="dash-kb-spinner">Loading sectors…</div>
                    </div>
                </div>

            </div>
        </div>

        <!-- MODAL NUEVO PROYECTO -->
        <div class="dash-modal-bg" id="dashModalNew">
            <div class="dash-modal">
                <h2>New project</h2>
                <div class="dash-modal-sub">Create a new value network map</div>
                <div class="dash-form-group">
                    <label class="dash-form-label">Project name *</label>
                    <input type="text" class="dash-form-input" id="newProjName" placeholder="e.g. ACME Corp · VNA 2025">
                </div>
                <div class="dash-form-group">
                    <label class="dash-form-label">Sector (optional)</label>
                    <select class="dash-form-input" id="newProjSector" style="font-family:var(--font-base);">
                        <option value="">— Select sector —</option>
                        ${sectorOptions}
                    </select>
                </div>
                <div class="dash-modal-actions">
                    <button class="dash-modal-cancel" id="newProjCancel">Cancel</button>
                    <button class="dash-modal-confirm" id="newProjConfirm">Create &amp; open map</button>
                </div>
            </div>
        </div>
        `;
    }

    async afterRender() {
        const sel = document.getElementById('dashLangSelector');
        if (sel) sel.innerHTML = langSelectorHtml();
        await this._renderProjects();
        this._bindTopbar();
        this._bindModal();
        await this._loadKBSectors();
    }

    // ── Render projects v2 ───────────────────────────────────────────────────
    _relativeDate(ts) {
        if (!ts) return '';
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return mins <= 1 ? 'just now' : mins + 'm ago';
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return hrs === 1 ? '1h ago' : hrs + 'h ago';
        const days = Math.floor(hrs / 24);
        if (days < 7) return days === 1 ? 'yesterday' : days + 'd ago';
        return formatDate(ts);
    }

    _levelColor(level) {
        if (level === 'pinya')       return '#00b0ff';
        if (level === 'pom_de_dalt') return '#e040fb';
        return '#6366f1';
    }

    async _renderProjects() {
        const state    = store.getState();
        const projects = (state.projects || []).filter(function(p) { return !p.isArchived; });

        // Stats v2 con health global y barras
        const totalRoles = projects.reduce(function(acc, p) { return acc + (p.vna_roles || []).length; }, 0);
        const totalTxs   = projects.reduce(function(acc, p) { return acc + (p.vna_transactions || []).length; }, 0);
        const healthScores = projects.map(function(p) { return projectHealth(p); }).filter(function(s) { return s !== null; });
        const avgHealth  = healthScores.length > 0 ? Math.round(healthScores.reduce(function(a, b) { return a + b; }, 0) / healthScores.length) : null;
        const hColor     = avgHealth !== null ? healthColor(avgHealth) : 'var(--text-muted)';

        document.getElementById('dashStats').innerHTML =
            '<div class="dash-stat"><div class="dash-stat-label">Projects</div><div class="dash-stat-value">' + projects.length + '</div><div class="dash-stat-bar"><div class="dash-stat-bar-fill" style="width:100%;background:var(--accent-indigo);"></div></div></div>' +
            '<div class="dash-stat"><div class="dash-stat-label">Total roles</div><div class="dash-stat-value">' + totalRoles + '</div><div class="dash-stat-bar"><div class="dash-stat-bar-fill" style="width:' + Math.min(totalRoles * 4, 100) + '%;background:var(--accent-blue);"></div></div></div>' +
            '<div class="dash-stat"><div class="dash-stat-label">Transactions</div><div class="dash-stat-value">' + totalTxs + '</div><div class="dash-stat-bar"><div class="dash-stat-bar-fill" style="width:' + Math.min(totalTxs * 2, 100) + '%;background:var(--accent-green);"></div></div></div>' +
            (avgHealth !== null ? '<div class="dash-stat"><div class="dash-stat-label">Ecosystem health</div><div class="dash-stat-value" style="color:' + hColor + '">' + avgHealth + '</div><div class="dash-stat-bar"><div class="dash-stat-bar-fill" style="width:' + avgHealth + '%;background:' + hColor + ';"></div></div></div>' : '');

        document.getElementById('dashHeroSub').textContent =
            projects.length === 0
                ? 'No projects yet — create your first value map'
                : projects.length + ' active project' + (projects.length !== 1 ? 's' : '') + ' · ordered by sector';

        if (projects.length === 0) {
            document.getElementById('dashProjectList').innerHTML =
                '<div class="dash-empty-v2">' +
                '<div class="dash-empty-icon">🗺</div>' +
                '<div class="dash-empty-title">No value maps yet</div>' +
                '<div class="dash-empty-sub">Start by creating your first project or exploring the demo</div>' +
                '<div class="dash-empty-actions">' +
                '<button class="dash-empty-cta" id="emptyBtnNew">＋ New project</button>' +
                '<a class="dash-empty-cta-ghost" href="/map?project=proj-colla-demo-v11" data-link>✦ View demo map →</a>' +
                '</div></div>';
            document.getElementById('emptyBtnNew')?.addEventListener('click', function() {
                document.getElementById('dashModalNew').classList.add('open');
                document.getElementById('newProjName').focus();
            });
            return;
        }

        // Agrupar por sector
        const groups = {};
        projects.forEach(function(p) {
            const key = p.sector_id || 'general';
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });

        const sectors = await KnowledgeLoader.listSectors();
        const sectorName = function(id) {
            const found = sectors.find(function(s) { return s.id === id; });
            return found ? found.name : (id === 'general' ? 'General' : id);
        };

        let html = '';
        var self = this;
        Object.keys(groups).sort().forEach(function(sectorId) {
            const sProjects = groups[sectorId];
            const label     = sectorName(sectorId);

            html += '<div class="dash-sector-group">' +
                '<div class="dash-sector-label">' + (sectorId !== 'general' ? sectorId + ' · ' : '') + label + '</div>' +
                '<div class="dash-cards">';

            sProjects.forEach(function(p) {
                const isDemo = p.id === 'proj-colla-demo-v11';
                const roles  = (p.vna_roles        || []).length;
                const txs    = (p.vna_transactions || []).length;
                const score  = projectHealth(p);
                const hColor = score !== null ? healthColor(score) : 'var(--text-muted)';
                const hLabel = score !== null ? score + '' : '—';
                const rel    = self._relativeDate(p.updatedAt || p.createdAt);

                // Mini preview de nodos — puntos de color por nivel
                var nodeDots = '';
                (p.vna_roles || []).slice(0, 12).forEach(function(r) {
                    nodeDots += '<div class="dash-card-node-dot" style="background:' + self._levelColor(r.castell_level) + ';opacity:.7;"></div>';
                });

                html += '<a class="dash-card' + (isDemo ? ' dash-card-demo' : '') + '" href="/map?project=' + p.id + '" data-link>' +
                    '<div class="dash-card-top">' +
                        '<div class="dash-card-name">' + (p.nombre || p.name || 'Unnamed') + '</div>' +
                        '<div style="display:flex;gap:4px;align-items:center;flex-shrink:0;">' +
                            (isDemo ? '<div class="dash-card-demo-badge">DEMO</div>' : '') +
                            (sectorId !== 'general' ? '<div class="dash-card-sector-badge">' + sectorId + '</div>' : '') +
                        '</div>' +
                    '</div>' +
                    (nodeDots ? '<div class="dash-card-nodes">' + nodeDots + '</div>' : '') +
                    '<div class="dash-card-meta">' +
                        '<span>' + roles + ' roles</span>' +
                        '<span>' + txs + ' transactions</span>' +
                    '</div>' +
                    '<div style="margin-top:2px;">' +
                        '<div class="dash-card-health-bar">' +
                            '<div class="dash-card-health-fill" style="width:' + (score || 0) + '%;background:' + hColor + ';"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="dash-card-footer">' +
                        '<div class="dash-card-date-rel">' + rel + '</div>' +
                        '<div class="dash-card-health" style="background:' + hColor + '18;color:' + hColor + ';">' + hLabel + '</div>' +
                    '</div>' +
                    '<div class="dash-card-actions">' +
                        '<button class="dash-card-action-btn" data-archive="' + p.id + '">Archive</button>' +
                    '</div>' +
                '</a>';
            });

            // Tarjeta "Nuevo proyecto" al final de cada grupo
            html += '<div class="dash-card-new" id="dashNewInGroup">' +
                '<div class="dash-card-new-icon">＋</div>' +
                '<div class="dash-card-new-label">New project</div>' +
                '</div>';

            html += '</div></div>';
        });

        document.getElementById('dashProjectList').innerHTML = html;

        // ── Sección de archivados ────────────────────────────────────────────
        var archived = (state.projects || []).filter(function(p) { return p.isArchived; });
        var archDiv = document.getElementById('dashArchivedSection');
        if (!archDiv) {
            archDiv = document.createElement('div');
            archDiv.id = 'dashArchivedSection';
            archDiv.style.cssText = 'margin-top:32px;';
            var plEl = document.getElementById('dashProjectList');
            if (plEl && plEl.parentNode) plEl.parentNode.insertBefore(archDiv, plEl.nextSibling);
        }
        if (archived.length === 0) {
            archDiv.innerHTML = '';
        } else {
            var archHtml = '<div style="margin-bottom:12px;display:flex;align-items:center;gap:10px;">' +
                '<button id="dashArchiveToggle" style="background:transparent;border:none;color:var(--text-muted);' +
                'font-size:var(--text-xs);font-family:var(--font-base);cursor:pointer;padding:4px 0;' +
                'display:flex;align-items:center;gap:6px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">' +
                '<span id="dashArchiveChevron">▶</span> Archived (' + archived.length + ')</button></div>' +
                '<div id="dashArchivedList" style="display:none;">';
            archived.forEach(function(p) {
                archHtml += '<div style="display:flex;align-items:center;justify-content:space-between;' +
                    'background:rgba(10,10,15,0.6);border:1px solid var(--glass-border);border-radius:var(--radius-md);' +
                    'padding:12px 16px;margin-bottom:8px;opacity:0.6;">' +
                    '<div>' +
                    '<div style="color:var(--text-secondary);font-weight:700;font-size:var(--text-sm);">🗼 ' + (p.nombre || p.name || 'Unnamed') + '</div>' +
                    '<div style="color:var(--text-muted);font-size:var(--text-xs);font-family:var(--font-mono);margin-top:2px;">' +
                    (p.roles || []).length + ' roles · ' + (p.vna_flows || p.transactions || []).length + ' flows</div>' +
                    '</div>' +
                    '<button data-unarchive="' + p.id + '" style="background:transparent;border:1px solid var(--glass-border);' +
                    'color:var(--text-muted);padding:5px 12px;border-radius:var(--radius-sm);font-size:var(--text-xs);' +
                    'font-weight:700;cursor:pointer;font-family:var(--font-base);">↩ Recover</button>' +
                    '</div>';
            });
            archHtml += '</div>';
            archDiv.innerHTML = archHtml;

            // Toggle collapsed/expanded
            var toggleBtn = document.getElementById('dashArchiveToggle');
            var archList  = document.getElementById('dashArchivedList');
            var chevron   = document.getElementById('dashArchiveChevron');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', function() {
                    var open = archList.style.display === 'block';
                    archList.style.display = open ? 'none' : 'block';
                    chevron.textContent = open ? '▶' : '▼';
                });
            }
        }

        // Bind archive buttons
        document.querySelectorAll('[data-archive]').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                var pid = e.currentTarget.dataset.archive;
                if (confirm('Archive this project? You can recover it from the Archived tab.')) {
                    store.dispatch({ type: 'ARCHIVE_PROJECT', payload: { projectId: pid } })
                        .then(function() {
                            // Esperar a que la persistencia KB termine antes de re-render
                            return store.persistState();
                        })
                        .then(function() {
                            if (window.navigateTo) window.navigateTo('/dashboard');
                            else window.location.replace('/dashboard');
                        });
                }
            });
        });

        // Bind unarchive buttons
        document.querySelectorAll('[data-unarchive]').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                var pid = e.currentTarget.dataset.unarchive;
                store.dispatch({ type: 'UNARCHIVE_PROJECT', payload: { projectId: pid } })
                    .then(function() { return store.persistState(); })
                    .then(function() {
                        if (window.navigateTo) window.navigateTo('/dashboard');
                        else window.location.replace('/dashboard');
                    });
            });
        });

        // Bind "New project" inline card
        document.querySelectorAll('#dashNewInGroup').forEach(function(el) {
            el.addEventListener('click', function() {
                document.getElementById('dashModalNew').classList.add('open');
                document.getElementById('newProjName').focus();
            });
        });
    }

    // ── Topbar ────────────────────────────────────────────────────────────────
    _bindTopbar() {
        document.getElementById('dashBtnNew')?.addEventListener('click', function() {
            document.getElementById('dashModalNew').classList.add('open');
            document.getElementById('newProjName').focus();
        });

        document.getElementById('dashBtnKB')?.addEventListener('click', function() {
            const main = document.getElementById('dashMain');
            main.classList.toggle('kb-open');
        });

        document.getElementById('dashKBClose')?.addEventListener('click', function() {
            document.getElementById('dashMain').classList.remove('kb-open');
        });

        // H1.3 · Export firmado
        document.getElementById('dashBtnExport')?.addEventListener('click', async function() {
            try {
                const { downloadSnapshotJson } = await import('../core/projectIO.js?v=' + Date.now());
                const btn = this; btn.disabled = true; btn.textContent = '⏳ Exportando…';
                const snap = await downloadSnapshotJson();
                btn.textContent = '✓ Exportado · ' + snap.kbNodes.length + ' nodos';
                setTimeout(function() { btn.disabled = false; btn.textContent = '💾 Export'; }, 2500);
            } catch (e) {
                console.error('[H1.3] Export:', e);
                alert('Error exportando: ' + e.message);
                this.disabled = false;
                this.textContent = '💾 Export';
            }
        });

        // H1.3 · Import firmado
        document.getElementById('dashBtnImport')?.addEventListener('click', function() {
            document.getElementById('dashImportFile').click();
        });
        document.getElementById('dashImportFile')?.addEventListener('change', async function(ev) {
            const file = ev.target.files && ev.target.files[0];
            if (!file) return;
            try {
                const { readSnapshotFromFile, importSnapshot } = await import('../core/projectIO.js?v=' + Date.now());
                const snap = await readSnapshotFromFile(file);
                const mode = confirm(
                    'Importar snapshot:\n\n' +
                    '• ' + (snap.kbNodes?.length || 0) + ' nodos\n' +
                    '• firmado el ' + (snap.exportedAt || '?') + '\n\n' +
                    'OK = MERGE (añadir/actualizar sobre lo existente)\n' +
                    'Cancel = REPLACE (borrar todo y restaurar el snapshot)'
                ) ? 'merge' : 'replace';
                const result = await importSnapshot(snap, { mode });
                alert('Importados ' + result.imported + ' nodos en modo ' + result.mode + '.\nRecargando…');
                location.reload();
            } catch (e) {
                console.error('[H1.3] Import:', e);
                alert('Error importando: ' + e.message);
            } finally {
                ev.target.value = '';
            }
        });
    }

    // ── Modal nuevo proyecto ──────────────────────────────────────────────────
    _bindModal() {
        document.getElementById('newProjCancel')?.addEventListener('click', function() {
            document.getElementById('dashModalNew').classList.remove('open');
        });

        document.getElementById('newProjConfirm')?.addEventListener('click', async function() {
            const name     = document.getElementById('newProjName').value.trim();
            const sectorId = document.getElementById('newProjSector').value || null;
            if (!name) { document.getElementById('newProjName').focus(); return; }

            const projectId = uid();
            await store.dispatch({
                type:    'CREATE_PROJECT',
                payload: {
                    id:               projectId,
                    nombre:           name,
                    sector_id:        sectorId,
                    vna_roles:        [],
                    vna_transactions: [],
                    createdAt:        Date.now(),
                    updatedAt:        Date.now(),
                }
            });

            document.getElementById('dashModalNew').classList.remove('open');
            const url = '/map?project=' + projectId + (sectorId ? '&sector=' + sectorId : '');
            window.navigateTo(url);
        }.bind(this));

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') document.getElementById('dashModalNew')?.classList.remove('open');
        });
    }

    // ── Knowledge Base panel ──────────────────────────────────────────────────
    async _loadKBSectors() {
        const sectors = await KnowledgeLoader.listSectors();
        const body    = document.getElementById('dashKBBody');
        if (!body) return;

        // Tier 1 = los que tenemos fichero. Tier 2 = los que KnowledgeLoader infiere.
        const tier1Ids = new Set(['N', 'K', 'Q', 'F', 'R']);

        let html = '<div style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono);margin-bottom:12px;">Click a sector to preview its roles</div>';
        sectors.forEach(function(s) {
            const isTier1 = tier1Ids.has(s.id);
            html += '<div class="dash-kb-sector-item" data-sector="' + s.id + '">' +
                '<div class="dash-kb-sector-name">' + s.id + ' · ' + s.name + '</div>' +
                '<span class="dash-kb-sector-badge" style="background:' +
                    (isTier1 ? 'rgba(0,230,118,0.1);color:var(--accent-green)' : 'rgba(255,145,0,0.1);color:var(--accent-orange)') +
                ';">' + (isTier1 ? 'ready' : 'tier 2') + '</span>' +
            '</div>';
        });
        html += '<div id="dashKBDetail" class="dash-kb-detail"></div>';
        body.innerHTML = html;

        // Bind sector items
        body.querySelectorAll('.dash-kb-sector-item').forEach(function(el) {
            el.addEventListener('click', function() {
                body.querySelectorAll('.dash-kb-sector-item').forEach(function(e) { e.classList.remove('active'); });
                el.classList.add('active');
                this._loadKBSectorDetail(el.dataset.sector);
            }.bind(this));
        }.bind(this));
    }

    async _loadKBSectorDetail(sectorId) {
        const detail = document.getElementById('dashKBDetail');
        if (!detail) return;
        detail.innerHTML = '<div class="dash-kb-spinner">Loading…</div>';

        const seed = await KnowledgeLoader.getSectorSeed(sectorId);
        if (!seed || seed.roles.length === 0) {
            detail.innerHTML = '<div class="dash-kb-spinner" style="color:var(--accent-orange);">Sector not loaded yet — will be generated by AI when needed.</div>';
            return;
        }

        const levelColors = { pinya: '#00b0ff', tronc: '#6366f1', pom_de_dalt: '#e040fb' };
        const levelLabels = { pinya: 'Base', tronc: 'Core', pom_de_dalt: 'Strategic' };

        let html = '<div class="dash-kb-detail-title">' + (seed.sectorName || sectorId) + '</div>';
        html += '<div style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono);margin-bottom:8px;">' + seed.roles.length + ' roles · ' + seed.transactions.length + ' transactions</div>';

        seed.roles.forEach(function(r) {
            const lvlColor = levelColors[r.castell_level] || '#6366f1';
            const lvlLabel = levelLabels[r.castell_level] || r.castell_level;
            html += '<div class="dash-kb-role-item" style="border-left-color:' + lvlColor + ';">' +
                '<div class="dash-kb-role-name">' + (r.name || r.id) + '</div>' +
                (r.description ? '<div class="dash-kb-role-desc">' + r.description.slice(0, 100) + (r.description.length > 100 ? '…' : '') + '</div>' : '') +
                '<div class="dash-kb-role-level">' + lvlLabel + (r.typical_actor ? ' · ' + r.typical_actor : '') + '</div>' +
            '</div>';
        });

        html += '<div style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono);margin:10px 0 6px;">Key transactions</div>';
        seed.transactions.slice(0, 6).forEach(function(t) {
            const color = t.type === 'intangible' ? '#d4a853' : '#00e676';
            html += '<div class="dash-kb-tx-item">' +
                '<div class="dash-kb-tx-dot" style="background:' + color + ';"></div>' +
                '<div class="dash-kb-tx-text">' + (t.deliverable || t.id) + (t.is_must ? ' <span style="color:var(--text-muted);">[MUST]</span>' : '') + '</div>' +
            '</div>';
        });
        if (seed.transactions.length > 6) {
            html += '<div style="font-size:10px;color:var(--text-muted);text-align:center;padding:6px;">+' + (seed.transactions.length - 6) + ' more transactions</div>';
        }

        detail.innerHTML = this._generateMiniMap(seed.roles, seed.transactions) + html;
    }

    // ── Mini-mapa SVG generativo para el KB panel ─────────────────────────────
    _generateMiniMap(roles, txs) {
        if (!roles || roles.length === 0) return '';
        const W = 320, H = 80;
        const count   = Math.min(roles.length, 8);
        const spacing = W / (count + 1);
        const levelColors = { pinya: '#00b0ff', tronc: '#6366f1', pom_de_dalt: '#e040fb' };

        // Posicionar nodos en fila con altura variable por nivel
        var nodes = roles.slice(0, count).map(function(r, i) {
            var y = r.castell_level === 'pom_de_dalt' ? 20 : r.castell_level === 'tronc' ? 40 : 60;
            return { x: spacing * (i + 1), y: y, color: levelColors[r.castell_level] || '#6366f1', id: r.id };
        });

        var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';

        // Aristas
        var drawn = 0;
        txs.slice(0, 10).forEach(function(tx) {
            var from = nodes.find(function(n) { return n.id === tx.from; });
            var to   = nodes.find(function(n) { return n.id === tx.to; });
            if (!from || !to) return;
            var color = tx.type === 'intangible' ? '#c9a84c' : '#4ade80';
            var dash  = tx.type === 'intangible' ? ' stroke-dasharray="3,3"' : '';
            svg += '<line x1="' + from.x + '" y1="' + from.y + '" x2="' + to.x + '" y2="' + to.y + '" stroke="' + color + '" stroke-width="1" stroke-opacity=".5"' + dash + '/>';
        });

        // Nodos
        nodes.forEach(function(n) {
            svg += '<circle cx="' + n.x + '" cy="' + n.y + '" r="5" fill="rgba(10,10,14,0.9)" stroke="' + n.color + '" stroke-width="1.5" stroke-opacity=".7"/>';
        });

        svg += '</svg>';
        return '<div class="dash-kb-mini-map">' + svg + '</div>';
    }
}
