// =============================================================================
// TEAMTOWERS SOS V11 — VALUE MAP VIEW  · Sprint 2
// Ruta: /js/views/ValueMapView.js
//
// Sprint 1: canvas D3, nodos arrastrables, aristas tangibles/intangibles,
//           modales nuevo rol/tx, guardar KB, carga sector seed.
// Sprint 2 añade:
//   - Health score por rol (fórmula 4 dimensiones, badge en nodo)
//   - Inspector con edición inline (nombre, nivel, descripción, actor)
//   - Vista ego: filtra canvas al nodo focal + vecinos directos
//   - Banner ego con botón "← Ver red completa"
// =============================================================================

import { store }           from '../core/store.js';
import { KB }              from '../core/kb.js';
import { KnowledgeLoader } from '../core/KnowledgeLoader.js';
import { Orchestrator }     from '../core/Orchestrator.js';
import { t, langSelectorHtml, getLang } from '../i18n.js';

// ─── Constantes visuales ─────────────────────────────────────────────────────
const COLOR_TANGIBLE   = '#00e676';   // accent-green
const COLOR_INTANGIBLE = '#d4a853';   // accent-gold (Claude/Anthropic)
const COLOR_NODE_FILL  = '#1a1a2a';
const COLOR_NODE_STROKE= '#6366f1';   // accent-indigo
const COLOR_NODE_SEL   = '#e040fb';   // accent-purple (seleccionado)
const LABEL_MAX_CHARS  = 22;

// Niveles castelleros → labels UI
// Niveles — las strings vienen de i18n para soportar EN/ES
const CASTELL_LEVELS = {
    pinya:       { get label() { return t('level.pinya'); }, get tooltip() { return t('level.pinya.tip'); } },
    tronc:       { get label() { return t('level.tronc'); }, get tooltip() { return t('level.tronc.tip'); } },
    pom_de_dalt: { get label() { return t('level.pom');   }, get tooltip() { return t('level.pom.tip');   } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid() {
    return 'r' + Math.random().toString(36).slice(2, 9);
}
function truncate(str, n) {
    if (!str) return '';
    return str.length > n ? str.slice(0, n - 1) + '…' : str;
}
function levelLabel(lvl) {
    return CASTELL_LEVELS[lvl] ? CASTELL_LEVELS[lvl].label : lvl;
}
function levelTooltip(lvl) {
    return CASTELL_LEVELS[lvl] ? CASTELL_LEVELS[lvl].tooltip : lvl;
}

// =============================================================================
export default class ValueMapView {

    constructor() {
        document.title = 'Mapa de Valor · SOS V11';
        this._state = {
            projectId:    null,
            roles:        [],       // { id, name, description, castell_level, fmv_usd_h, tags }
            transactions: [],       // { id, from, to, deliverable, type, is_must, frequency, health_hint }
            selectedId:   null,     // id de nodo o arista seleccionado
            dragging:     false,
            d3Sim:        null,
            egoRoleId:    null,
        };
        this._svg   = null;
        this._width  = 0;
        this._height = 0;
    }

    // ══════════════════════════════════════════════════════════════════════════
    async getHtml() {
        await store.init();
        const storeState = store.getState();

        // Leer projectId y sector del query param: /map?project=proj-xxx&sector=N
        const params    = new URLSearchParams(window.location.search);
        const paramPid  = params.get('project');
        const paramSect = params.get('sector');

        const projects  = (storeState.projects || []).filter(p => !p.isArchived);
        const proj      = paramPid
            ? projects.find(p => p.id === paramPid) || null
            : projects[0] || null;

        if (proj) {
            this._state.projectId    = proj.id;
            this._state.roles        = JSON.parse(JSON.stringify(proj.vna_roles        || []));
            this._state.transactions = JSON.parse(JSON.stringify(proj.vna_transactions || []));
            this._state.currentSector = proj.sector_id || paramSect || null;
        } else if (paramPid) {
            // Proyecto nuevo recién creado (aún no tiene datos en store)
            this._state.projectId     = paramPid;
            this._state.currentSector = paramSect || null;
        }

        // Opciones de sector: se poblan dinámicamente en afterRender() con el idioma correcto

        return `
        <style>
            /* ── Layout shell ───────────────────────────────────────── */
            .vmap-shell {
                display: grid;
                grid-template-columns: 220px 1fr 260px;
                grid-template-rows: 48px 1fr;
                height: 100dvh;
                width: 100vw;
                overflow: hidden;
                background: var(--bg-dark);
                font-family: var(--font-base);
            }

            /* ── Topbar ─────────────────────────────────────────────── */
            .vmap-topbar {
                grid-column: 1 / -1;
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 0 16px;
                border-bottom: 1px solid var(--glass-border);
                background: rgba(10,10,15,0.95);
                z-index: 10;
            }
            .vmap-topbar-title {
                font-weight: 900;
                font-size: var(--text-sm);
                color: white;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .vmap-topbar-title span { color: var(--accent-indigo); }
            .vmap-project-name {
                font-size: var(--text-xs);
                color: var(--text-muted);
                font-family: var(--font-mono);
                margin-left: 4px;
            }
            .vmap-topbar-actions { margin-left: auto; display: flex; gap: 8px; }
            .vmap-btn {
                background: transparent;
                border: 1px solid var(--glass-border);
                color: var(--text-secondary);
                padding: 5px 12px;
                border-radius: var(--radius-sm);
                font-size: var(--text-xs);
                font-weight: 700;
                cursor: pointer;
                transition: all var(--duration-fast);
                font-family: var(--font-base);
            }
            .vmap-btn:hover { border-color: var(--accent-indigo); color: white; }
            .vmap-btn-primary {
                background: var(--accent-indigo);
                border-color: var(--accent-indigo);
                color: white;
            }
            .vmap-btn-primary:hover { filter: brightness(1.15); }
            .vmap-btn-save {
                background: linear-gradient(135deg, var(--accent-green), #00b248);
                border: none;
                color: #000;
                font-weight: 900;
            }
            .vmap-btn-save:hover { filter: brightness(1.1); }

            /* ── Panel izquierdo ────────────────────────────────────── */
            .vmap-left {
                border-right: 1px solid var(--glass-border);
                overflow-y: auto;
                padding: 12px;
                background: rgba(10,10,14,0.8);
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .vmap-section-title {
                font-size: var(--text-xs);
                font-weight: 700;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.08em;
                padding: 4px 0;
                border-bottom: 1px solid var(--glass-border);
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .vmap-add-btn {
                font-size: 16px;
                background: transparent;
                border: none;
                color: var(--accent-indigo);
                cursor: pointer;
                padding: 0 2px;
                line-height: 1;
                transition: color var(--duration-fast);
            }
            .vmap-add-btn:hover { color: white; }
            .vmap-role-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 7px 8px;
                border-radius: var(--radius-sm);
                cursor: pointer;
                transition: background var(--duration-fast);
                border: 1px solid transparent;
            }
            .vmap-role-item:hover { background: var(--glass-hover); }
            .vmap-role-item.selected { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.3); }
            .vmap-role-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                flex-shrink: 0;
            }
            .vmap-role-name {
                font-size: var(--text-xs);
                color: var(--text-secondary);
                font-weight: 700;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .vmap-level-badge {
                font-size: 9px;
                padding: 1px 5px;
                border-radius: 3px;
                background: rgba(255,255,255,0.05);
                color: var(--text-muted);
                margin-left: auto;
                flex-shrink: 0;
                font-family: var(--font-mono);
            }
            .vmap-tx-item {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 5px 8px;
                border-radius: var(--radius-sm);
                cursor: pointer;
                transition: background var(--duration-fast);
            }
            .vmap-tx-item:hover { background: var(--glass-hover); }
            .vmap-tx-item.selected { background: rgba(212,168,83,0.12); }
            .vmap-tx-line {
                width: 16px;
                height: 2px;
                flex-shrink: 0;
            }
            .vmap-tx-label {
                font-size: 10px;
                color: var(--text-muted);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            /* ── Canvas central ─────────────────────────────────────── */
            .vmap-canvas {
                position: relative;
                overflow: hidden;
                background: var(--bg-dark);
            }
            #vmap-svg {
                width: 100%;
                height: 100%;
                cursor: grab;
            }
            #vmap-svg:active { cursor: grabbing; }

            /* Toolbar flotante sobre el canvas */
            .vmap-toolbar {
                position: absolute;
                bottom: 16px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 6px;
                background: rgba(10,10,15,0.92);
                border: 1px solid var(--glass-border);
                border-radius: var(--radius-lg);
                padding: 6px 10px;
                z-index: 5;
            }
            .vmap-tool-btn {
                background: transparent;
                border: none;
                color: var(--text-muted);
                font-size: var(--text-sm);
                padding: 4px 8px;
                border-radius: var(--radius-sm);
                cursor: pointer;
                transition: all var(--duration-fast);
                font-family: var(--font-mono);
            }
            .vmap-tool-btn:hover { color: white; background: var(--glass-hover); }

            /* Empty state */
            .vmap-empty {
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 12px;
                pointer-events: none;
                opacity: 0.4;
            }
            .vmap-empty-icon { font-size: 3rem; }
            .vmap-empty-text { font-size: var(--text-sm); color: var(--text-muted); font-family: var(--font-mono); }

            /* Tooltip */
            #vmap-tooltip {
                position: absolute;
                background: rgba(10,10,15,0.97);
                border: 1px solid var(--glass-border);
                border-radius: var(--radius-md);
                padding: 8px 12px;
                font-size: var(--text-xs);
                color: var(--text-secondary);
                pointer-events: none;
                z-index: 20;
                display: none;
                max-width: 220px;
                font-family: var(--font-base);
                line-height: 1.5;
            }

            /* ── Inspector derecho ──────────────────────────────────── */
            .vmap-right {
                border-left: 1px solid var(--glass-border);
                overflow-y: auto;
                padding: 12px;
                background: rgba(10,10,14,0.8);
            }
            .vmap-inspector-empty {
                color: var(--text-muted);
                font-size: var(--text-xs);
                text-align: center;
                margin-top: 40px;
                line-height: 1.8;
                font-family: var(--font-mono);
            }
            .vmap-inspector-title {
                font-size: var(--text-sm);
                font-weight: 900;
                color: white;
                margin-bottom: 12px;
            }
            .vmap-inspector-field {
                margin-bottom: 10px;
            }
            .vmap-inspector-label {
                font-size: var(--text-xs);
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.08em;
                font-weight: 700;
                margin-bottom: 3px;
                font-family: var(--font-mono);
            }
            .vmap-inspector-value {
                font-size: var(--text-xs);
                color: var(--text-secondary);
                line-height: 1.5;
            }
            .vmap-inspector-badge {
                display: inline-block;
                font-size: 9px;
                padding: 2px 7px;
                border-radius: 4px;
                font-weight: 700;
                font-family: var(--font-mono);
            }
            .vmap-tag-list { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
            .vmap-tag { font-size: 9px; padding: 2px 6px; border-radius: 3px; background: rgba(99,102,241,0.15); color: var(--accent-indigo); font-family: var(--font-mono); }
            .vmap-inspector-actions { display: flex; flex-direction: column; gap: 6px; margin-top: 16px; }
            .vmap-inspector-btn {
                width: 100%;
                padding: 7px 12px;
                border-radius: var(--radius-sm);
                font-size: var(--text-xs);
                font-weight: 700;
                cursor: pointer;
                border: 1px solid var(--glass-border);
                background: transparent;
                color: var(--text-secondary);
                transition: all var(--duration-fast);
                font-family: var(--font-base);
                text-align: left;
            }
            .vmap-inspector-btn:hover { background: var(--glass-hover); color: white; }
            .vmap-inspector-btn.danger { border-color: rgba(255,82,82,0.4); color: var(--accent-red); }
            .vmap-inspector-btn.danger:hover { background: rgba(255,82,82,0.1); }

            /* ── Modales ────────────────────────────────────────────── */
            .vmap-modal-bg {
                display: none;
                position: fixed;
                inset: 0;
                z-index: 1000;
                background: rgba(0,0,0,0.65);
                align-items: center;
                justify-content: center;
            }
            .vmap-modal-bg.open { display: flex; }
            .vmap-modal {
                background: var(--bg-elevated);
                border: 1px solid var(--glass-border);
                border-radius: var(--radius-xl);
                padding: 24px;
                width: 440px;
                max-width: 95vw;
                animation: slideUp var(--duration-base) var(--ease-spring);
            }
            .vmap-modal h2 {
                font-size: var(--text-lg);
                font-weight: 900;
                margin: 0 0 4px;
                color: white;
            }
            .vmap-modal-sub {
                font-size: var(--text-xs);
                color: var(--text-muted);
                margin-bottom: 20px;
                font-family: var(--font-mono);
            }
            .vmap-form-group { margin-bottom: 14px; }
            .vmap-form-label {
                display: block;
                font-size: var(--text-xs);
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.08em;
                font-weight: 700;
                margin-bottom: 5px;
            }
            .vmap-form-input {
                width: 100%;
                background: rgba(0,0,0,0.4);
                border: 1px solid var(--glass-border);
                color: white;
                padding: 10px 12px;
                border-radius: var(--radius-md);
                font-family: var(--font-base);
                font-size: var(--text-sm);
                outline: none;
                transition: border-color var(--duration-fast);
                box-sizing: border-box;
            }
            .vmap-form-input:focus { border-color: var(--accent-indigo); }
            .vmap-form-select { font-family: var(--font-base); }
            .vmap-form-textarea { min-height: 60px; resize: vertical; font-family: var(--font-base); }
            .vmap-modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
            .vmap-modal-cancel { background: transparent; border: 1px solid var(--glass-border); color: var(--text-muted); padding: 9px 18px; border-radius: var(--radius-md); cursor: pointer; font-weight: 700; font-size: var(--text-sm); font-family: var(--font-base); }
            .vmap-modal-cancel:hover { color: white; }
            .vmap-modal-confirm { background: var(--accent-indigo); border: none; color: white; padding: 9px 20px; border-radius: var(--radius-md); cursor: pointer; font-weight: 900; font-size: var(--text-sm); font-family: var(--font-base); }
            .vmap-modal-confirm:hover { filter: brightness(1.1); }

            /* Indicador de inicio de mapa (selector modo) */
            .vmap-mode-selector {
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 16px;
                z-index: 4;
                background: rgba(5,5,7,0.92);
                animation: fadeIn 0.4s var(--ease-out);
            }
            .vmap-mode-title {
                font-size: var(--text-xl);
                font-weight: 900;
                color: white;
                margin-bottom: 4px;
            }
            .vmap-mode-subtitle {
                font-size: var(--text-sm);
                color: var(--text-muted);
                margin-bottom: 8px;
                font-family: var(--font-mono);
            }
            .vmap-mode-cards {
                display: flex;
                gap: 14px;
                flex-wrap: wrap;
                justify-content: center;
                max-width: 600px;
            }
            .vmap-mode-card {
                background: rgba(25,25,32,0.9);
                border: 1px solid var(--glass-border);
                border-radius: var(--radius-xl);
                padding: 20px 22px;
                width: 170px;
                cursor: pointer;
                transition: all var(--duration-base) var(--ease-out);
                text-align: center;
            }
            .vmap-mode-card:hover {
                border-color: var(--accent-indigo);
                transform: translateY(-3px);
                box-shadow: var(--shadow-indigo);
            }
            .vmap-mode-card.active {
                border-color: var(--accent-indigo);
                background: rgba(99,102,241,0.12);
                box-shadow: var(--shadow-indigo);
            }
            .vmap-mode-card-icon { font-size: 2rem; margin-bottom: 8px; }
            .vmap-mode-card-title { font-size: var(--text-sm); font-weight: 900; color: white; margin-bottom: 4px; }
            .vmap-mode-card-desc { font-size: var(--text-xs); color: var(--text-muted); line-height: 1.5; }

            /* Selector de sector — fila independiente bajo las cards */
            .vmap-sector-picker-row {
                display: none;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                width: 100%;
                max-width: 500px;
                animation: slideUp 0.25s var(--ease-out);
            }
            .vmap-sector-picker-row.visible { display: flex; }
            .vmap-sector-picker-label {
                font-size: var(--text-xs);
                color: var(--text-muted);
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                font-family: var(--font-mono);
            }
            .vmap-sector-picker-select {
                width: 100%;
                background: rgba(10,10,15,0.95);
                border: 1px solid var(--accent-indigo);
                color: white;
                padding: 10px 14px;
                border-radius: var(--radius-md);
                font-family: var(--font-base);
                font-size: var(--text-sm);
                font-weight: 600;
                outline: none;
                cursor: pointer;
                -webkit-appearance: none;
                appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236366f1' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 14px center;
                padding-right: 36px;
                box-sizing: border-box;
            }
            .vmap-sector-picker-select:focus {
                box-shadow: 0 0 0 2px rgba(99,102,241,0.35);
            }
            .vmap-sector-picker-select option {
                background: #111118;
                color: white;
            }
            .vmap-sector-picker-actions {
                display: flex;
                gap: 10px;
                width: 100%;
            }
            .vmap-sector-picker-actions .vmap-btn {
                flex: 1;
                justify-content: center;
                padding: 10px;
                font-size: var(--text-xs);
            }


            /* ── Panel IA ───────────────────────────────────────────── */
            .vmap-ai-panel {
                position: absolute;
                top: 0; right: 0; bottom: 0;
                width: 340px;
                background: rgba(8,8,12,0.98);
                border-left: 1px solid rgba(224,64,251,0.3);
                z-index: 8;
                display: flex;
                flex-direction: column;
                transform: translateX(100%);
                transition: transform 0.3s var(--ease-out);
            }
            .vmap-ai-panel.open { transform: translateX(0); }
            .vmap-ai-panel-head {
                padding: 14px 16px 10px;
                border-bottom: 1px solid var(--glass-border);
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-shrink: 0;
            }
            .vmap-ai-panel-title {
                font-size: var(--text-sm);
                font-weight: 900;
                color: var(--accent-purple);
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .vmap-ai-panel-close {
                background: transparent;
                border: none;
                color: var(--text-muted);
                font-size: 1.1rem;
                cursor: pointer;
                padding: 2px 6px;
                border-radius: var(--radius-sm);
                line-height: 1;
                transition: color var(--duration-fast);
            }
            .vmap-ai-panel-close:hover { color: white; }
            .vmap-ai-panel-body {
                flex: 1;
                overflow-y: auto;
                padding: 14px 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .vmap-ai-prompt-label {
                font-size: var(--text-xs);
                font-weight: 700;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.08em;
                margin-bottom: 6px;
            }
            .vmap-ai-textarea {
                width: 100%;
                min-height: 100px;
                background: rgba(0,0,0,0.5);
                border: 1px solid rgba(224,64,251,0.25);
                border-radius: var(--radius-md);
                color: white;
                font-family: var(--font-base);
                font-size: var(--text-xs);
                padding: 10px 12px;
                outline: none;
                resize: vertical;
                transition: border-color var(--duration-fast);
                box-sizing: border-box;
                line-height: 1.6;
            }
            .vmap-ai-textarea:focus { border-color: var(--accent-purple); }
            .vmap-ai-tips {
                background: rgba(224,64,251,0.06);
                border: 1px solid rgba(224,64,251,0.15);
                border-radius: var(--radius-md);
                padding: 10px 12px;
            }
            .vmap-ai-tips-title {
                font-size: 9px;
                font-weight: 700;
                color: var(--accent-purple);
                text-transform: uppercase;
                letter-spacing: 0.1em;
                margin-bottom: 6px;
                font-family: var(--font-mono);
            }
            .vmap-ai-tip {
                font-size: var(--text-xs);
                color: var(--text-muted);
                line-height: 1.6;
                margin-bottom: 4px;
                display: flex;
                gap: 6px;
            }
            .vmap-ai-tip::before { content: '→'; color: var(--accent-purple); flex-shrink: 0; }
            .vmap-ai-generate-btn {
                width: 100%;
                background: linear-gradient(135deg, rgba(224,64,251,0.8), rgba(99,102,241,0.8));
                border: none;
                color: white;
                padding: 11px;
                border-radius: var(--radius-md);
                font-weight: 900;
                font-size: var(--text-sm);
                cursor: pointer;
                transition: all var(--duration-fast);
                font-family: var(--font-base);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                flex-shrink: 0;
            }
            .vmap-ai-generate-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
            .vmap-ai-generate-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
            .vmap-ai-spinner {
                width: 14px; height: 14px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                display: none;
            }
            .vmap-ai-status {
                font-size: var(--text-xs);
                color: var(--text-muted);
                font-family: var(--font-mono);
                text-align: center;
                min-height: 16px;
            }
            /* Cards de propuesta */
            .vmap-proposal-section-title {
                font-size: 9px;
                font-weight: 700;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.1em;
                font-family: var(--font-mono);
                margin: 8px 0 6px;
            }
            .vmap-proposal-card {
                background: rgba(20,20,28,0.9);
                border: 1px solid var(--glass-border);
                border-radius: var(--radius-md);
                padding: 10px 12px;
                transition: border-color var(--duration-fast);
            }
            .vmap-proposal-card.accepted  { border-color: rgba(0,230,118,0.4); opacity: 0.6; }
            .vmap-proposal-card.rejected  { border-color: rgba(255,82,82,0.2); opacity: 0.35; }
            .vmap-proposal-card-name {
                font-size: var(--text-xs);
                font-weight: 700;
                color: white;
                margin-bottom: 3px;
            }
            .vmap-proposal-card-desc {
                font-size: 10px;
                color: var(--text-muted);
                line-height: 1.5;
                margin-bottom: 8px;
            }
            .vmap-proposal-card-meta {
                display: flex;
                gap: 5px;
                flex-wrap: wrap;
                margin-bottom: 8px;
            }
            .vmap-proposal-meta-pill {
                font-size: 9px;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: var(--font-mono);
            }
            .vmap-proposal-card-actions {
                display: flex;
                gap: 5px;
            }
            .vmap-prop-btn {
                flex: 1;
                padding: 5px 8px;
                border-radius: var(--radius-sm);
                font-size: 10px;
                font-weight: 700;
                cursor: pointer;
                border: 1px solid var(--glass-border);
                background: transparent;
                transition: all var(--duration-fast);
                font-family: var(--font-base);
            }
            .vmap-prop-btn-accept { color: var(--accent-green); border-color: rgba(0,230,118,0.3); }
            .vmap-prop-btn-accept:hover { background: rgba(0,230,118,0.1); }
            .vmap-prop-btn-edit   { color: var(--accent-indigo); border-color: rgba(99,102,241,0.3); }
            .vmap-prop-btn-edit:hover { background: rgba(99,102,241,0.1); }
            .vmap-prop-btn-reject { color: var(--accent-red); border-color: rgba(255,82,82,0.2); }
            .vmap-prop-btn-reject:hover { background: rgba(255,82,82,0.08); }
            .vmap-ai-bulk-btn {
                width: 100%;
                padding: 9px;
                border-radius: var(--radius-md);
                font-size: var(--text-xs);
                font-weight: 700;
                cursor: pointer;
                border: 1px solid rgba(0,230,118,0.4);
                background: rgba(0,230,118,0.08);
                color: var(--accent-green);
                transition: all var(--duration-fast);
                font-family: var(--font-base);
                flex-shrink: 0;
            }
            .vmap-ai-bulk-btn:hover { background: rgba(0,230,118,0.15); }

            @media (max-width: 900px) {
                .vmap-shell { grid-template-columns: 1fr; grid-template-rows: 48px 1fr; }
                .vmap-left, .vmap-right { display: none; }
                .vmap-ai-panel { width: 100%; }
            }
        </style>

        <!-- ── Layout shell ──────────────────────────────────────────── -->
        <div class="vmap-shell" id="vmapShell">

            <!-- TOPBAR -->
            <div class="vmap-topbar">
                <div class="vmap-topbar-title">
                    <a href="/" data-link style="color:var(--text-muted);text-decoration:none;font-size:var(--text-xs);">← Inicio</a>
                    <span style="color:var(--glass-border);">|</span>
                    🗺 Mapa de <span>Valor</span>
                    <span class="vmap-project-name" id="vmapProjectName">Sin proyecto</span>
                </div>
                <div class="vmap-topbar-actions">
                    <button class="vmap-btn" style="border-color:var(--accent-purple);color:var(--accent-purple);" id="vmapBtnAI">${t('vmap.suggest')}</button>
                    <button class="vmap-btn" id="vmapBtnFit">⊡ ${t('vmap.fit')}</button>
                    <button class="vmap-btn" id="vmapBtnReset">↺ ${t('vmap.reset')}</button>
                    <button class="vmap-btn vmap-btn-save" id="vmapBtnSave">💾 ${t('vmap.save')}</button>
                    <div id="vmapLangSel"></div>
                </div>
            </div>

            <!-- PANEL IZQUIERDO -->
            <div class="vmap-left" id="vmapLeft">
                <div>
                    <div class="vmap-section-title">
                        Roles
                        <button class="vmap-add-btn" id="vmapAddRole" title="Nuevo rol">＋</button>
                    </div>
                    <div id="vmapRoleList"></div>
                </div>
                <div style="margin-top:8px;">
                    <div class="vmap-section-title">
                        Transacciones
                        <button class="vmap-add-btn" id="vmapAddTx" title="Nueva transacción">＋</button>
                    </div>
                    <div id="vmapTxList"></div>
                </div>
            </div>

            <!-- CANVAS CENTRAL -->
            <div class="vmap-canvas" id="vmapCanvas">
                <!-- Selector de modo inicio (visible solo si no hay roles) -->
                <div class="vmap-mode-selector" id="vmapModeSelector">
                    <div class="vmap-mode-title">🗺 ${t('vmap.mode.title')}</div>
                    <div class="vmap-mode-subtitle">${t('vmap.mode.sub')}</div>
                    <div class="vmap-mode-cards">
                        <div class="vmap-mode-card" id="vmapModeBlank">
                            <div class="vmap-mode-card-icon">✏️</div>
                            <div class="vmap-mode-card-title">Desde cero</div>
                            <div class="vmap-mode-card-desc">Canvas vacío. Dibuja cada rol y transacción manualmente.</div>
                        </div>
                        <div class="vmap-mode-card" id="vmapModeSector">
                            <div class="vmap-mode-card-icon">📂</div>
                            <div class="vmap-mode-card-title">Desde sector</div>
                            <div class="vmap-mode-card-desc">Carga roles y transacciones típicos del sector CNAE como punto de partida.</div>
                        </div>
                    </div>

                    <!-- Selector de sector — aparece solo al elegir "Desde sector" -->
                    <div class="vmap-sector-picker-row" id="vmapSectorPickerRow">
                        <div class="vmap-sector-picker-label">Selecciona el sector CNAE</div>
                        <select class="vmap-sector-picker-select" id="vmapSectorPicker">
                            <option value="">— Elige sector —</option>
                        </select>
                        <div class="vmap-sector-picker-actions">
                            <button class="vmap-btn" id="vmapSectorPickerBack">← Volver</button>
                            <button class="vmap-btn vmap-btn-primary" id="vmapSectorPickerConfirm">Cargar sector →</button>
                        </div>
                    </div>
                </div>

                <svg id="vmap-svg"></svg>

                <!-- Tooltip -->
                <div id="vmap-tooltip"></div>

                <!-- Toolbar flotante -->
                <div class="vmap-toolbar">
                    <button class="vmap-tool-btn" id="vmapZoomIn"  title="Zoom +">＋</button>
                    <button class="vmap-tool-btn" id="vmapZoomOut" title="Zoom -">－</button>
                    <span style="color:var(--glass-border);padding:4px 2px;">|</span>
                    <button class="vmap-tool-btn" id="vmapUndo"    title="Deshacer">↩</button>
                    <button class="vmap-tool-btn" id="vmapRedo"    title="Rehacer">↪</button>
                    <span style="color:var(--glass-border);padding:4px 2px;">|</span>
                    <button class="vmap-tool-btn" id="vmapLegend" title="Leyenda">?</button>
                </div>
            </div>

            <!-- INSPECTOR DERECHO -->
            <div class="vmap-right" id="vmapRight">
                <div class="vmap-inspector-empty" id="vmapInspectorEmpty">
    ${t('insp.empty').replace(/\\n/g, '<br>')}
                </div>
                <div id="vmapInspectorContent" style="display:none;"></div>
            </div>

        <!-- ── PANEL IA ───────────────────────────────────────────────── -->
            <div class="vmap-ai-panel" id="vmapAIPanel">
                <div class="vmap-ai-panel-head">
                    <div class="vmap-ai-panel-title">✦ ${t('ai.panel.title')}</div>
                    <button class="vmap-ai-panel-close" id="vmapAIPanelClose">✕</button>
                </div>
                <div class="vmap-ai-panel-body" id="vmapAIPanelBody">

                    <!-- Fase 1: input del usuario -->
                    <div id="vmapAIPhase1">
                        <div class="vmap-ai-prompt-label">${t('ai.prompt.label')}</div>
                        <textarea class="vmap-ai-textarea" id="vmapAIPromptText"
                                  placeholder="Ej: Consultora de 15 personas especializada en transformación digital para pymes industriales. Tenemos un equipo técnico, uno comercial y trabajamos con red de partners freelance..."></textarea>

                        <div class="vmap-ai-tips">
                            <div class="vmap-ai-tips-title">${t('ai.tips.title')}</div>
                            <div class="vmap-ai-tip">Sé específico sobre el sector y tamaño: "clínica privada de 8 especialistas" mejor que "empresa de salud"</div>
                            <div class="vmap-ai-tip">Nombra los actores clave reales: clientes, proveedores, socios, equipos internos</div>
                            <div class="vmap-ai-tip">Menciona el problema o el objetivo: "queremos reducir el tiempo de onboarding" da contexto estratégico</div>
                            <div class="vmap-ai-tip">Incluye lo que ya funciona bien y lo que no: la IA priorizará los intangibles rotos</div>
                            <div class="vmap-ai-tip">No expliques el VNA — describe la realidad operativa y deja que la IA mapee los flujos</div>
                        </div>

                        <div class="vmap-ai-status" id="vmapAIStatus"></div>

                        <button class="vmap-ai-generate-btn" id="vmapAIGenerate">
                            <div class="vmap-ai-spinner" id="vmapAISpinner"></div>
                            <span id="vmapAIBtnText">${t('ai.generate')}</span>
                        </button>
                    </div>

                    <!-- Fase 2: propuestas (oculto hasta que llega respuesta) -->
                    <div id="vmapAIPhase2" style="display:none;">
                        <div id="vmapProposalList"></div>
                        <button class="vmap-ai-bulk-btn" id="vmapAIBulkAccept" style="margin-top:8px;">${t('ai.bulk')}</button>
                        <button class="vmap-ai-generate-btn" id="vmapAIRetry" style="margin-top:6px;background:transparent;border:1px solid var(--glass-border);color:var(--text-muted);">${t('ai.retry')}</button>
                    </div>

                </div>
            </div>

        </div>

        <!-- ── MODAL: Nuevo / Editar Rol ──────────────────────────────── -->
        <div class="vmap-modal-bg" id="modalRole">
            <div class="vmap-modal">
                <h2 id="modalRoleTitle">Nuevo rol</h2>
                <div class="vmap-modal-sub" id="modalRoleSub">Define la actividad como parte del flujo de valor</div>
                <input type="hidden" id="modalRoleId">
                <div class="vmap-form-group">
                    <label class="vmap-form-label">Nombre de la actividad *</label>
                    <input type="text" class="vmap-form-input" id="modalRoleName" placeholder="ej: Generador de demanda">
                </div>
                <div class="vmap-form-group">
                    <label class="vmap-form-label">Nivel
                        <span id="modalRoleLevelTooltip" style="color:var(--accent-gold);font-family:var(--font-mono);margin-left:6px;font-size:9px;text-transform:none;letter-spacing:0;"></span>
                    </label>
                    <select class="vmap-form-input vmap-form-select" id="modalRoleLevel">
                        <option value="pinya">Base operativa</option>
                        <option value="tronc" selected>Núcleo de valor</option>
                        <option value="pom_de_dalt">Cúspide estratégica</option>
                    </select>
                </div>
                <div class="vmap-form-group">
                    <label class="vmap-form-label">Descripción (opcional)</label>
                    <textarea class="vmap-form-input vmap-form-textarea" id="modalRoleDesc" placeholder="¿Qué hace este rol en el flujo de valor?"></textarea>
                </div>
                <div class="vmap-form-group">
                    <label class="vmap-form-label">Actor típico (opcional)</label>
                    <input type="text" class="vmap-form-input" id="modalRoleActor" placeholder="ej: director comercial, cliente, ops">
                </div>
                <div class="vmap-modal-actions">
                    <button class="vmap-modal-cancel" id="modalRoleCancel">Cancelar</button>
                    <button class="vmap-modal-confirm" id="modalRoleConfirm">Añadir al mapa</button>
                </div>
            </div>
        </div>

        <!-- ── MODAL: Nueva / Editar Transacción ─────────────────────── -->
        <div class="vmap-modal-bg" id="modalTx">
            <div class="vmap-modal">
                <h2 id="modalTxTitle">Nueva transacción</h2>
                <div class="vmap-modal-sub">Define el entregable que fluye entre dos roles</div>
                <input type="hidden" id="modalTxId">
                <div class="vmap-form-group">
                    <label class="vmap-form-label">Entregable *</label>
                    <input type="text" class="vmap-form-input" id="modalTxDeliverable" placeholder="ej: Propuesta económica, Feedback de cliente">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div class="vmap-form-group">
                        <label class="vmap-form-label">De (origen) *</label>
                        <select class="vmap-form-input vmap-form-select" id="modalTxFrom"></select>
                    </div>
                    <div class="vmap-form-group">
                        <label class="vmap-form-label">A (destino) *</label>
                        <select class="vmap-form-input vmap-form-select" id="modalTxTo"></select>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div class="vmap-form-group">
                        <label class="vmap-form-label">Tipo</label>
                        <select class="vmap-form-input vmap-form-select" id="modalTxType">
                            <option value="tangible">Tangible (contractual)</option>
                            <option value="intangible">Intangible (informal)</option>
                        </select>
                    </div>
                    <div class="vmap-form-group">
                        <label class="vmap-form-label">Naturaleza</label>
                        <select class="vmap-form-input vmap-form-select" id="modalTxMust">
                            <option value="true">MUST (esperado)</option>
                            <option value="false">EXTRA (voluntario)</option>
                        </select>
                    </div>
                </div>
                <div class="vmap-form-group">
                    <label class="vmap-form-label">Señal de alerta (opcional)</label>
                    <input type="text" class="vmap-form-input" id="modalTxHint" placeholder="¿Qué pasa si esta transacción falla?">
                </div>
                <div class="vmap-modal-actions">
                    <button class="vmap-modal-cancel" id="modalTxCancel">Cancelar</button>
                    <button class="vmap-modal-confirm" id="modalTxConfirm">Añadir al mapa</button>
                </div>
            </div>
        </div>
        `;
    }

    // ══════════════════════════════════════════════════════════════════════════
    async afterRender() {
        var self = this;

        // Selector de idioma
        const langSel = document.getElementById('vmapLangSel');
        if (langSel) langSel.innerHTML = langSelectorHtml();

        // Poblar el select de sectores con el idioma actual
        await this._populateSectorSelect();

        // Repoblar cuando cambia el idioma
        document.addEventListener('sos:lang-changed', function() {
            self._populateSectorSelect();
        });

        // Mostrar nombre del proyecto en topbar
        if (this._state.projectId) {
            const proj = (store.getState().projects || []).find(p => p.id === this._state.projectId);
            if (proj) {
                document.getElementById('vmapProjectName').textContent = proj.nombre || proj.name || this._state.projectId;
            }
        }

        // Cargar D3 dinámicamente desde CDN permitido
        await this._loadD3();
        this._bindTopbar();
        this._bindModeSelector();
        this._bindModals();
        this._renderLists();

        // Si ya hay roles cargados desde el store, montar el grafo directamente
        if (this._state.roles.length > 0) {
            this._hideModeSelector();
            this._mountGraph();
        } else if (this._state.currentSector && this._state.projectId) {
            // Auto-cargar seed del sector si viene del dashboard con sector preseleccionado
            await this._loadSectorSeed(this._state.currentSector);
        }
    }

    // Poblar el <select> de sectores con los nombres en el idioma actual
    async _populateSectorSelect() {
        var sel = document.getElementById('vmapSectorPicker');
        if (!sel) return;
        var current = sel.value;
        // Limpiar y resetear
        sel.innerHTML = '<option value="">— ' + (window.__lang === 'en' ? 'Choose sector' : 'Elige sector') + ' —</option>';
        try {
            // Invalidar caché del índice para que relea con el nuevo idioma
            KnowledgeLoader._cache  && delete KnowledgeLoader._cache['_index.md'];
            KnowledgeLoader._parsed && delete KnowledgeLoader._parsed['_index.md'];
            var sectors = await KnowledgeLoader.listSectors();
            for (var i = 0; i < sectors.length; i++) {
                var s   = sectors[i];
                var opt = document.createElement('option');
                opt.value       = s.id;
                opt.textContent = s.id + ' · ' + s.name;
                sel.appendChild(opt);
            }
        } catch (e) {
            console.warn('[ValueMapView] _populateSectorSelect error:', e);
        }
        // Restaurar selección previa si sigue disponible
        if (current) sel.value = current;
    }

    // ── Cleanup al navegar (SPA teardown) ───────────────────────────────────────
    destroy() {
        if (this._state && this._state.d3Sim) {
            this._state.d3Sim.stop();
            this._state.d3Sim = null;
        }
    }

    // ── Cargar D3 desde CDN ───────────────────────────────────────────────────
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

    // ── Selector de modo inicial ──────────────────────────────────────────────
    _bindModeSelector() {
        var self = this;

        // Card "Desde cero" → lanzar canvas vacío
        document.getElementById('vmapModeBlank') && document.getElementById('vmapModeBlank').addEventListener('click', function() {
            self._hideModeSelector();
            self._mountGraph();
        });

        // Card "Desde sector" → mostrar fila de selector (no cargar aún)
        document.getElementById('vmapModeSector') && document.getElementById('vmapModeSector').addEventListener('click', function() {
            var card = document.getElementById('vmapModeSector');
            var row  = document.getElementById('vmapSectorPickerRow');
            if (!card || !row) return;
            card.classList.add('active');
            var blankCard = document.getElementById('vmapModeBlank');
            if (blankCard) blankCard.style.opacity = '0.4';
            row.classList.add('visible');
            var sel = document.getElementById('vmapSectorPicker');
            if (sel) sel.focus();
        });

        // Botón "← Volver" → ocultar fila, resetear estado
        document.getElementById('vmapSectorPickerBack') && document.getElementById('vmapSectorPickerBack').addEventListener('click', function() {
            var row = document.getElementById('vmapSectorPickerRow');
            if (row) row.classList.remove('visible');
            var card = document.getElementById('vmapModeSector');
            if (card) card.classList.remove('active');
            var blankCard = document.getElementById('vmapModeBlank');
            if (blankCard) blankCard.style.opacity = '';
            var sel = document.getElementById('vmapSectorPicker');
            if (sel) sel.value = '';
        });

        // Botón "Cargar sector →" → cargar seed
        document.getElementById('vmapSectorPickerConfirm') && document.getElementById('vmapSectorPickerConfirm').addEventListener('click', async function() {
            var sel = document.getElementById('vmapSectorPicker');
            var sectorId = sel ? sel.value : '';
            if (!sectorId) {
                if (sel) sel.focus();
                // Shake visual
                var row = document.getElementById('vmapSectorPickerRow');
                if (row) {
                    row.style.outline = '1px solid var(--accent-red)';
                    setTimeout(function() { row.style.outline = ''; }, 1200);
                }
                return;
            }
            var btn = document.getElementById('vmapSectorPickerConfirm');
            if (btn) { btn.textContent = '⏳ Cargando…'; btn.disabled = true; }
            await self._loadSectorSeed(sectorId);
            if (btn) { btn.textContent = 'Cargar sector →'; btn.disabled = false; }
        });
    }

    async _loadSectorSeed(sectorId) {
        const seed = await KnowledgeLoader.getSectorSeed(sectorId);
        if (!seed || seed.roles.length === 0) {
            document.getElementById('vmapSectorPicker').value = '';
            return;
        }
        this._state.roles        = seed.roles.map(r => ({ ...r }));
        this._state.transactions = seed.transactions.map(t => ({ ...t }));
        document.getElementById('vmapProjectName').textContent = seed.sectorName || sectorId;
        this._state.currentSector = sectorId;
        this._hideModeSelector();
        this._renderLists();
        this._mountGraph();
    }

    _hideModeSelector() {
        const sel = document.getElementById('vmapModeSelector');
        if (sel) sel.style.display = 'none';
    }

    // ── Topbar ────────────────────────────────────────────────────────────────
    _bindTopbar() {
        document.getElementById('vmapBtnAI')?.addEventListener('click',     () => this._openAIPanel());
        document.getElementById('vmapBtnFit')?.addEventListener('click',    () => this._fitGraph());
        document.getElementById('vmapBtnReset')?.addEventListener('click',  () => this._restartSim());
        document.getElementById('vmapBtnSave')?.addEventListener('click',   () => this._saveMap());
        document.getElementById('vmapAddRole')?.addEventListener('click',   () => this._openRoleModal());
        document.getElementById('vmapAddTx')?.addEventListener('click',     () => this._openTxModal());
        document.getElementById('vmapZoomIn')?.addEventListener('click',    () => this._zoom(1.25));
        document.getElementById('vmapZoomOut')?.addEventListener('click',   () => this._zoom(0.8));
        document.getElementById('vmapLegend')?.addEventListener('click',    () => this._showLegend());
    }

    // ── D3 Graph ──────────────────────────────────────────────────────────────
    _mountGraph() {
        const canvas = document.getElementById('vmapCanvas');
        const svgEl  = document.getElementById('vmap-svg');
        if (!svgEl || !window.d3) return;

        this._width  = canvas.clientWidth  || 800;
        this._height = canvas.clientHeight || 600;

        const d3 = window.d3;
        d3.select(svgEl).selectAll('*').remove();

        const svg = d3.select(svgEl)
            .attr('width',  this._width)
            .attr('height', this._height);

        // Zoom & pan
        const zoomGroup = svg.append('g').attr('class', 'zoom-group');
        const zoom = d3.zoom()
            .scaleExtent([0.2, 3])
            .on('zoom', (event) => zoomGroup.attr('transform', event.transform));
        svg.call(zoom);
        this._zoomBehavior = zoom;
        this._svg = svg;
        this._zoomGroup = zoomGroup;

        // Defs: marcadores de flecha
        const defs = svg.append('defs');
        ['tangible', 'intangible', 'tangible-sel', 'intangible-sel'].forEach(id => {
            const isSel = id.endsWith('-sel');
            const color = id.includes('tangible') && !id.includes('intangible')
                ? (isSel ? '#a5f3c8' : COLOR_TANGIBLE)
                : (isSel ? '#f0d080' : COLOR_INTANGIBLE);
            defs.append('marker')
                .attr('id', 'arrow-' + id)
                .attr('viewBox', '0 0 10 10')
                .attr('refX', 18)
                .attr('refY', 5)
                .attr('markerWidth', 6)
                .attr('markerHeight', 6)
                .attr('orient', 'auto-start-reverse')
                .append('path')
                .attr('d', 'M2 1L8 5L2 9')
                .attr('fill', 'none')
                .attr('stroke', color)
                .attr('stroke-width', 1.5)
                .attr('stroke-linecap', 'round');
        });

        this._rebuildGraph(zoomGroup);

        // Doble click en canvas vacío → nuevo rol
        svg.on('dblclick.canvas', (event) => {
            if (event.target === svgEl) this._openRoleModal();
        });
    }

    _rebuildGraph(container) {
        if (!window.d3) return;
        const d3 = window.d3;
        const grp = container || this._zoomGroup;
        if (!grp) return;
        try {
        grp.selectAll('.link-group,.node-group').remove();

        const roles = this._state.roles;
        const txs   = this._state.transactions;

        if (roles.length === 0) return;

        // Construir nodos y aristas para D3
        const nodes = roles.map((r, i) => ({
            id:   r.id,
            data: r,
            x:    this._width  / 2 + Math.cos(i / roles.length * 2 * Math.PI) * 200,
            y:    this._height / 2 + Math.sin(i / roles.length * 2 * Math.PI) * 160,
        }));

        // Detectar pares bidireccionales para curvar aristas
        const pairSet = new Set();
        txs.forEach(t => {
            const key = [t.from, t.to].sort().join('__');
            if (pairSet.has(key)) {
                t._bidir = true;
            } else {
                pairSet.add(key);
                t._bidir = false;
            }
        });

        // Filtrar transacciones cuyos roles no existen (evita "node not found" en D3)
        const nodeIds = new Set(roles.map(r => r.id));
        const links = txs
            .filter(t => t.from && t.to && nodeIds.has(t.from) && nodeIds.has(t.to))
            .map(t => ({
                id:     t.id,
                source: t.from,
                target: t.to,
                data:   t,
            }));

        // Fuerza D3
        if (this._state.d3Sim) this._state.d3Sim.stop();
        const sim = d3.forceSimulation(nodes)
            .force('link',   d3.forceLink(links).id(d => d.id).distance(160).strength(0.4))
            .force('charge', d3.forceManyBody().strength(-420))
            .force('center', d3.forceCenter(this._width / 2, this._height / 2))
            .force('collide',d3.forceCollide(52));
        this._state.d3Sim = sim;

        // ── Aristas ───────────────────────────────────────────────────────────
        const linkGroup = grp.append('g').attr('class', 'link-group');

        const linkSel = linkGroup.selectAll('.link')
            .data(links, d => d.id)
            .enter().append('g')
            .attr('class', 'link')
            .attr('data-id', d => d.id)
            .style('cursor', 'pointer')
            .on('click',     (event, d) => { event.stopPropagation(); this._selectItem(d.id, 'tx'); })
            .on('mouseenter',(event, d) => this._showTooltip(event, d.data))
            .on('mousemove', (event)    => this._moveTooltip(event))
            .on('mouseleave',()         => this._hideTooltip());

        linkSel.append('path')
            .attr('class', 'link-path')
            .attr('fill', 'none')
            .attr('stroke-width', 1.5)
            .attr('stroke', d => d.data.type === 'tangible' ? COLOR_TANGIBLE : COLOR_INTANGIBLE)
            .attr('stroke-opacity', 0.7)
            .attr('stroke-dasharray', d => d.data.type === 'intangible' ? '5,4' : null)
            .attr('marker-end', d => 'url(#arrow-' + d.data.type + ')');

        // Label de arista — fondo opaco para legibilidad
        const labelG = linkSel.append('g').attr('class', 'link-label-g');
        labelG.append('rect')
            .attr('rx', 3)
            .attr('fill', 'rgba(5,5,7,0.85)')
            .attr('stroke', d => d.data.type === 'tangible' ? COLOR_TANGIBLE : COLOR_INTANGIBLE)
            .attr('stroke-width', 0.5)
            .attr('stroke-opacity', 0.4);
        labelG.append('text')
            .attr('class', 'link-label-text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', '9px')
            .attr('fill', d => d.data.type === 'tangible' ? COLOR_TANGIBLE : COLOR_INTANGIBLE)
            .attr('fill-opacity', 0.9)
            .style('pointer-events', 'none')
            .text(d => truncate(d.data.deliverable, LABEL_MAX_CHARS));

        // ── Nodos ─────────────────────────────────────────────────────────────
        const nodeGroup = grp.append('g').attr('class', 'node-group');

        const nodeSel = nodeGroup.selectAll('.node')
            .data(nodes, d => d.id)
            .enter().append('g')
            .attr('class', 'node')
            .attr('data-id', d => d.id)
            .style('cursor', 'pointer')
            .call(d3.drag()
                .on('start', (event, d) => {
                    if (!event.active) sim.alphaTarget(0.3).restart();
                    d.fx = d.x; d.fy = d.y;
                })
                .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
                .on('end',  (event, d) => {
                    if (!event.active) sim.alphaTarget(0);
                    d.fx = null; d.fy = null;
                })
            )
            .on('click',    (event, d) => { event.stopPropagation(); this._selectItem(d.id, 'role'); })
            .on('dblclick', (event, d) => { event.stopPropagation(); this._openRoleModal(d.data); });

        // Círculo exterior (nivel)
        nodeSel.append('circle')
            .attr('r', 36)
            .attr('fill', COLOR_NODE_FILL)
            .attr('stroke', d => this._levelColor(d.data.castell_level))
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.7);

        // Círculo interior pequeño
        nodeSel.append('circle')
            .attr('r', 8)
            .attr('fill', d => this._levelColor(d.data.castell_level))
            .attr('fill-opacity', 0.5);

        // Nombre del rol — dos líneas si hace falta
        nodeSel.each(function(d) {
            const g       = d3.select(this);
            const words   = (d.data.name || '').split(' ');
            let  line1 = '', line2 = '';
            if (words.length <= 2) {
                line1 = words.join(' ');
            } else {
                const mid = Math.ceil(words.length / 2);
                line1 = words.slice(0, mid).join(' ');
                line2 = words.slice(mid).join(' ');
            }
            if (line2) {
                g.append('text')
                    .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
                    .attr('y', -7).attr('font-size', '9px').attr('fill', 'rgba(255,255,255,0.9)')
                    .style('pointer-events', 'none').style('user-select', 'none')
                    .text(truncate(line1, 14));
                g.append('text')
                    .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
                    .attr('y', 5).attr('font-size', '9px').attr('fill', 'rgba(255,255,255,0.9)')
                    .style('pointer-events', 'none').style('user-select', 'none')
                    .text(truncate(line2, 14));
            } else {
                g.append('text')
                    .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
                    .attr('y', 0).attr('font-size', '9px').attr('fill', 'rgba(255,255,255,0.9)')
                    .style('pointer-events', 'none').style('user-select', 'none')
                    .text(truncate(line1, 14));
            }
        });

        // Badge de nivel debajo del nodo
        nodeSel.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', 48)
            .attr('font-size', '8px')
            .attr('fill', d => this._levelColor(d.data.castell_level))
            .attr('fill-opacity', 0.7)
            .style('pointer-events', 'none')
            .text(d => levelLabel(d.data.castell_level));

        // Recalcular health badges para todos los nodos
        this._state.roles.forEach(r => {
            const score = this._calcHealthScore(r.id);
            this._updateNodeHealthBadge(r.id, score);
        });

        // Restaurar modo ego si estaba activo
        if (this._state.egoRoleId) {
            setTimeout(() => this._setEgoMode(this._state.egoRoleId), 80);
        }

        // Click en fondo para deseleccionar
        this._svg.on('click.deselect', () => {
            this._selectItem(null, null);
        });

        // ── Tick ──────────────────────────────────────────────────────────────
        sim.on('tick', () => {
            // Actualizar posición de aristas
            linkSel.each((d) => {
                const sx = d.source.x, sy = d.source.y;
                const tx = d.target.x, ty = d.target.y;
                const bidir = d.data._bidir;

                let pathD;
                if (bidir) {
                    // Arista curva para bidireccionales
                    const dx    = tx - sx, dy = ty - sy;
                    const dr    = Math.sqrt(dx * dx + dy * dy) * 0.6;
                    pathD = 'M' + sx + ',' + sy + ' A' + dr + ',' + dr + ' 0 0,1 ' + tx + ',' + ty;
                } else {
                    pathD = 'M' + sx + ',' + sy + ' L' + tx + ',' + ty;
                }
                d3.select('[data-id="' + d.id + '"] .link-path').attr('d', pathD);

                // Posición del label en el midpoint
                const mx = bidir
                    ? sx + (tx - sx) * 0.5 + (ty - sy) * 0.15
                    : (sx + tx) / 2;
                const my = bidir
                    ? sy + (ty - sy) * 0.5 - (tx - sx) * 0.15
                    : (sy + ty) / 2;

                const labelG2 = d3.select('[data-id="' + d.id + '"] .link-label-g');
                const textEl  = labelG2.select('.link-label-text');
                if (!textEl || !textEl.node()) return; // nodo desmontado — skip
                const textStr = textEl.text() || '';
                const tw      = textStr.length * 5.4 + 10;
                const th      = 14;
                labelG2.select('rect')
                    .attr('x', mx - tw / 2).attr('y', my - th / 2)
                    .attr('width', tw).attr('height', th);
                textEl.attr('x', mx).attr('y', my);
            });

            // Actualizar posición de nodos
            nodeSel.attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');
        });
        } catch (err) {
            console.error('[ValueMapView] _rebuildGraph error:', err.message);
            // Limpiar SVG para evitar estado inconsistente
            if (grp) grp.selectAll('*').remove();
            // Mostrar mensaje de error recuperable sin perder datos
            const canvas = document.getElementById('vmapCanvas');
            if (canvas) {
                const existing = canvas.querySelector('.vmap-rebuild-error');
                if (!existing) {
                    const div = document.createElement('div');
                    div.className = 'vmap-rebuild-error';
                    div.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:var(--accent-orange);font-family:var(--font-mono);font-size:var(--text-xs);pointer-events:none;';
                    div.innerHTML = '⚠ Graph render error<br><span style="opacity:.6;font-size:9px;">Data preserved — try reorganizing</span>';
                    canvas.appendChild(div);
                    setTimeout(function() { if (div.parentNode) div.parentNode.removeChild(div); }, 4000);
                }
            }
        }
    }

    // Devuelve el color según nivel castellero
    _levelColor(level) {
        const colors = {
            pinya:       '#00b0ff',  // accent-blue
            tronc:       '#6366f1',  // accent-indigo
            pom_de_dalt: '#e040fb',  // accent-purple
        };
        return colors[level] || '#6366f1';
    }

    // ── Selección de nodo / arista ────────────────────────────────────────────
    _selectItem(id, type) {
        this._state.selectedId = id;

        if (!window.d3) return;
        const d3 = window.d3;

        // Resetear estilos
        d3.selectAll('.node circle:first-child')
            .attr('stroke', d => this._levelColor(d.data.castell_level))
            .attr('stroke-width', 2).attr('stroke-opacity', 0.7);
        d3.selectAll('.link-path')
            .attr('stroke', d => d.data.type === 'tangible' ? COLOR_TANGIBLE : COLOR_INTANGIBLE)
            .attr('stroke-width', 1.5).attr('stroke-opacity', 0.7)
            .attr('marker-end', d => 'url(#arrow-' + d.data.type + ')');

        if (id && type === 'role') {
            // Resaltar nodo seleccionado
            d3.select('[data-id="' + id + '"] circle:first-child')
                .attr('stroke', COLOR_NODE_SEL).attr('stroke-width', 3).attr('stroke-opacity', 1);

            // Resaltar aristas del nodo
            d3.selectAll('.link-path').each(function(d) {
                if (d.source.id === id || d.target.id === id) {
                    d3.select(this)
                        .attr('stroke-opacity', 1)
                        .attr('stroke-width', 2.5)
                        .attr('marker-end', 'url(#arrow-' + d.data.type + '-sel)');
                } else {
                    d3.select(this).attr('stroke-opacity', 0.15);
                }
            });

            // Resaltar items de lista izquierda
            document.querySelectorAll('.vmap-role-item').forEach(el => el.classList.remove('selected'));
            document.querySelector('.vmap-role-item[data-id="' + id + '"]')?.classList.add('selected');

            // Inspector
            const role = this._state.roles.find(r => r.id === id);
            if (role) this._renderRoleInspector(role);

        } else if (id && type === 'tx') {
            d3.select('[data-id="' + id + '"] .link-path')
                .attr('stroke-opacity', 1).attr('stroke-width', 3);

            const tx = this._state.transactions.find(t => t.id === id);
            if (tx) this._renderTxInspector(tx);

        } else {
            this._hideInspector();
            document.querySelectorAll('.vmap-role-item').forEach(el => el.classList.remove('selected'));
        }
    }

    // ── Inspector ─────────────────────────────────────────────────────────────
    _hideInspector() {
        document.getElementById('vmapInspectorEmpty').style.display = 'block';
        document.getElementById('vmapInspectorContent').style.display = 'none';
    }

    // ── Health score ──────────────────────────────────────────────────────────
    // Fórmula: 4 dimensiones x 25 pts = 100 máximo
    //   +25 tiene transacciones entrantes
    //   +25 tiene transacciones salientes
    //   +25 al menos 1 intangible en su red
    //   +25 al menos 1 par recíproco (A→B + B→A implica reciprocidad)
    _calcHealthScore(roleId) {
        const txs   = this._state.transactions;
        const txIn  = txs.filter(t => t.to   === roleId);
        const txOut = txs.filter(t => t.from === roleId);

        let score = 0;
        if (txIn.length  > 0) score += 25;
        if (txOut.length > 0) score += 25;

        const allConnected = txIn.concat(txOut);
        if (allConnected.some(t => t.type === 'intangible')) score += 25;

        // Reciprocidad: existe tx en ambas direcciones con algún vecino
        const neighbors = new Set(txOut.map(t => t.to).concat(txIn.map(t => t.from)));
        for (const nb of neighbors) {
            const hasOut = txOut.some(t => t.to   === nb);
            const hasIn  = txIn.some(t  => t.from === nb);
            if (hasOut && hasIn) { score += 25; break; }
        }

        return Math.min(score, 100);
    }

    _healthColor(score) {
        if (score >= 75) return '#00e676';    // verde
        if (score >= 50) return '#ff9100';    // naranja
        return '#ff5252';                      // rojo
    }

    _healthLabel(score) {
        if (score >= 75) return 'Saludable';
        if (score >= 50) return 'Atención';
        return 'Crítico';
    }

    // ── Inspector de rol — Sprint 2: inline edit + health score + ego btn ─────
    _renderRoleInspector(role) {
        document.getElementById('vmapInspectorEmpty').style.display = 'none';
        const lvlColor = this._levelColor(role.castell_level);
        const score    = this._calcHealthScore(role.id);
        const hColor   = this._healthColor(score);
        const hLabel   = this._healthLabel(score);
        const txIn     = this._state.transactions.filter(t => t.to   === role.id).length;
        const txOut    = this._state.transactions.filter(t => t.from === role.id).length;

        // Actualizar badge de health en el nodo del canvas
        this._updateNodeHealthBadge(role.id, score);

        document.getElementById('vmapInspectorContent').style.display = 'block';
        document.getElementById('vmapInspectorContent').innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <div class="vmap-inspector-title" style="margin:0;">${role.name}</div>
                <span class="vmap-inspector-badge"
                      style="background:${hColor}22;color:${hColor};font-size:10px;padding:3px 8px;"
                      title="Health score: ${score}/100">${score} · ${hLabel}</span>
            </div>

            <div style="background:${hColor}18;border-radius:6px;height:4px;margin-bottom:14px;">
                <div style="background:${hColor};height:4px;border-radius:6px;width:${score}%;transition:width 0.4s;"></div>
            </div>

            <!-- Edición inline: nombre -->
            <div class="vmap-inspector-field">
                <div class="vmap-inspector-label">Nombre de la actividad</div>
                <input class="vmap-inline-input" id="inlRoleName"
                       value="${role.name}"
                       data-field="name" data-role="${role.id}"
                       style="width:100%;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);
                              color:white;padding:6px 8px;border-radius:var(--radius-sm);
                              font-size:var(--text-xs);font-family:var(--font-base);outline:none;">
            </div>

            <!-- Edición inline: nivel -->
            <div class="vmap-inspector-field">
                <div class="vmap-inspector-label">Nivel
                    <span style="color:${lvlColor};font-family:var(--font-mono);font-size:9px;
                                 text-transform:none;letter-spacing:0;margin-left:6px;"
                          title="${levelTooltip(role.castell_level)}">${levelTooltip(role.castell_level)}</span>
                </div>
                <select class="vmap-inline-input" id="inlRoleLevel"
                        data-field="castell_level" data-role="${role.id}"
                        style="width:100%;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);
                               color:white;padding:6px 8px;border-radius:var(--radius-sm);
                               font-size:var(--text-xs);font-family:var(--font-base);outline:none;">
                    <option value="pinya"       ${role.castell_level === 'pinya'       ? 'selected' : ''}>Base operativa</option>
                    <option value="tronc"       ${role.castell_level === 'tronc'       ? 'selected' : ''}>Núcleo de valor</option>
                    <option value="pom_de_dalt" ${role.castell_level === 'pom_de_dalt' ? 'selected' : ''}>Cúspide estratégica</option>
                </select>
            </div>

            <!-- Edición inline: descripción -->
            <div class="vmap-inspector-field">
                <div class="vmap-inspector-label">Descripción</div>
                <textarea class="vmap-inline-input" id="inlRoleDesc"
                          data-field="description" data-role="${role.id}"
                          rows="2"
                          style="width:100%;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);
                                 color:white;padding:6px 8px;border-radius:var(--radius-sm);
                                 font-size:var(--text-xs);font-family:var(--font-base);
                                 outline:none;resize:vertical;box-sizing:border-box;"
                          placeholder="¿Qué hace este rol en el flujo de valor?">${role.description || ''}</textarea>
            </div>

            <!-- Edición inline: actor típico -->
            <div class="vmap-inspector-field">
                <div class="vmap-inspector-label">Actor típico</div>
                <input class="vmap-inline-input" id="inlRoleActor"
                       value="${role.typical_actor || ''}"
                       data-field="typical_actor" data-role="${role.id}"
                       placeholder="ej: director comercial, cliente"
                       style="width:100%;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);
                              color:white;padding:6px 8px;border-radius:var(--radius-sm);
                              font-size:var(--text-xs);font-family:var(--font-base);outline:none;">
            </div>

            <!-- Transacciones -->
            <div class="vmap-inspector-field">
                <div class="vmap-inspector-label">Transacciones</div>
                <div class="vmap-inspector-value">
                    ↙ ${txIn} entrantes · ↗ ${txOut} salientes
                    ${txIn === 0 || txOut === 0 ? '<br><span style="color:var(--accent-orange);font-size:9px;">⚠ Flujo incompleto — añade transacciones</span>' : ''}
                </div>
            </div>

            <div class="vmap-inspector-actions">
                <button class="vmap-inspector-btn" id="inspBtnEgo">◎ Vista ego de este rol</button>
                <button class="vmap-inspector-btn" id="inspBtnAddTx">＋ Añadir transacción</button>
                <button class="vmap-inspector-btn danger" id="inspBtnDelete">✕ Eliminar rol</button>
            </div>`;

        // Guardar al confirmar (Enter en inputs de texto, blur en todos)
        document.querySelectorAll('.vmap-inline-input').forEach(el => {
            const save = () => this._saveInlineField(el.dataset.role, el.dataset.field, el.value);
            el.addEventListener('blur', save);
            if (el.tagName === 'INPUT') {
                el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
            }
            // Select: guardar inmediatamente al cambiar (no necesita blur)
            if (el.tagName === 'SELECT') {
                el.removeEventListener('blur', save);
                el.addEventListener('change', save);
            }
        });

        document.getElementById('inspBtnEgo')?.addEventListener('click',    () => this._setEgoMode(role.id));
        document.getElementById('inspBtnAddTx')?.addEventListener('click',  () => this._openTxModal(role.id));
        document.getElementById('inspBtnDelete')?.addEventListener('click', () => this._deleteRole(role.id));
    }

    // ── Guardar campo inline ──────────────────────────────────────────────────
    _saveInlineField(roleId, field, value) {
        const idx = this._state.roles.findIndex(r => r.id === roleId);
        if (idx < 0) return;
        const trimmed = typeof value === 'string' ? value.trim() : value;
        if (this._state.roles[idx][field] === trimmed) return; // sin cambios
        this._state.roles[idx][field] = trimmed || null;
        // Reconstruir el grafo para reflejar cambios de nombre/nivel
        this._renderLists();
        this._rebuildGraph(this._zoomGroup);
        // Restaurar selección para que el inspector no cierre
        this._selectItem(roleId, 'role');
    }

    // ── Actualizar badge de health en el nodo SVG ─────────────────────────────
    _updateNodeHealthBadge(roleId, score) {
        if (!window.d3) return;
        const color = this._healthColor(score);
        // El badge es un texto adicional en el nodo; si ya existe, actualizarlo
        const nodeG = window.d3.select('.node[data-id="' + roleId + '"]');
        if (nodeG.empty()) return;
        nodeG.selectAll('.health-badge').remove();
        nodeG.append('circle')
            .attr('class', 'health-badge')
            .attr('cx', 26).attr('cy', -26)
            .attr('r', 7)
            .attr('fill', color)
            .attr('fill-opacity', 0.9)
            .attr('stroke', 'var(--bg-dark)')
            .attr('stroke-width', 1.5);
        nodeG.append('text')
            .attr('class', 'health-badge')
            .attr('x', 26).attr('y', -26)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', '7px')
            .attr('fill', '#000')
            .attr('font-weight', '700')
            .style('pointer-events', 'none')
            .text(score);
    }

    // ── Vista ego ─────────────────────────────────────────────────────────────
    // Filtra el canvas para mostrar solo el nodo focal + sus vecinos directos.
    // Los nodos no-vecinos se ocultan (opacity baja), no se eliminan del DOM.
    _setEgoMode(roleId) {
        if (!window.d3) return;
        const d3 = window.d3;

        this._state.egoRoleId = roleId;

        const role      = this._state.roles.find(r => r.id === roleId);
        const txs       = this._state.transactions;
        const neighborIds = new Set(
            txs.filter(t => t.from === roleId || t.to === roleId)
               .map(t => t.from === roleId ? t.to : t.from)
        );
        neighborIds.add(roleId);

        // Atenuar nodos no vecinos
        d3.selectAll('.node').each(function(d) {
            d3.select(this).style('opacity', neighborIds.has(d.id) ? '1' : '0.06');
        });

        // Atenuar aristas no conectadas al focal
        d3.selectAll('.link').each(function(d) {
            const connected = d.source.id === roleId || d.target.id === roleId;
            d3.select(this).style('opacity', connected ? '1' : '0.04');
        });

        // Mostrar banner ego
        this._showEgoBanner(role ? role.name : roleId);
    }

    _clearEgoMode() {
        if (!window.d3) return;
        window.d3.selectAll('.node').style('opacity', '1');
        window.d3.selectAll('.link').style('opacity', '1');
        this._state.egoRoleId = null;
        this._hideEgoBanner();
    }

    _showEgoBanner(roleName) {
        let banner = document.getElementById('vmapEgoBanner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'vmapEgoBanner';
            banner.style.cssText = [
                'position:absolute', 'top:10px', 'left:50%',
                'transform:translateX(-50%)',
                'background:rgba(10,10,15,0.95)',
                'border:1px solid var(--accent-purple)',
                'border-radius:var(--radius-lg)',
                'padding:6px 16px',
                'display:flex', 'align-items:center', 'gap:12px',
                'z-index:6',
                'font-size:var(--text-xs)',
                'color:var(--accent-purple)',
                'font-weight:700',
                'font-family:var(--font-base)',
                'white-space:nowrap',
            ].join(';');
            document.getElementById('vmapCanvas').appendChild(banner);
        }
        banner.innerHTML =
            '<span>◎ Vista ego: ' + roleName + '</span>' +
            '<button id="vmapEgoBack" style="background:transparent;border:1px solid var(--glass-border);' +
            'color:var(--text-muted);padding:3px 10px;border-radius:var(--radius-sm);cursor:pointer;' +
            'font-size:var(--text-xs);font-weight:700;font-family:var(--font-base);">← Ver red completa</button>';
        banner.style.display = 'flex';
        document.getElementById('vmapEgoBack')?.addEventListener('click', () => this._clearEgoMode());
    }

    _hideEgoBanner() {
        const banner = document.getElementById('vmapEgoBanner');
        if (banner) banner.style.display = 'none';
    }



    _renderTxInspector(tx) {
        document.getElementById('vmapInspectorEmpty').style.display = 'none';
        const color   = tx.type === 'tangible' ? COLOR_TANGIBLE : COLOR_INTANGIBLE;
        const typeLabel= tx.type === 'tangible' ? 'Tangible — contractual' : 'Intangible — informal';
        const fromRole = this._state.roles.find(r => r.id === tx.from);
        const toRole   = this._state.roles.find(r => r.id === tx.to);

        document.getElementById('vmapInspectorContent').style.display = 'block';
        document.getElementById('vmapInspectorContent').innerHTML = `
            <div class="vmap-inspector-title">${tx.deliverable || 'Transacción'}</div>

            <div class="vmap-inspector-field">
                <div class="vmap-inspector-label">Tipo</div>
                <div class="vmap-inspector-value">
                    <span class="vmap-inspector-badge" style="background:${color}22;color:${color};">${typeLabel}</span>
                    <span class="vmap-inspector-badge" style="background:rgba(255,255,255,0.05);color:var(--text-muted);margin-left:4px;">${tx.is_must ? 'MUST' : 'EXTRA'}</span>
                </div>
            </div>

            <div class="vmap-inspector-field">
                <div class="vmap-inspector-label">Flujo</div>
                <div class="vmap-inspector-value">
                    <strong>${fromRole ? fromRole.name : tx.from}</strong>
                    <span style="color:${color};margin:0 6px;">→</span>
                    <strong>${toRole ? toRole.name : tx.to}</strong>
                </div>
            </div>

            ${tx.health_hint ? `
            <div class="vmap-inspector-field">
                <div class="vmap-inspector-label">Señal de alerta</div>
                <div class="vmap-inspector-value" style="color:var(--accent-orange);">⚠ ${tx.health_hint}</div>
            </div>` : ''}

            <div class="vmap-inspector-actions">
                <button class="vmap-inspector-btn" id="inspBtnEditTx">✏️ Editar transacción</button>
                <button class="vmap-inspector-btn danger" id="inspBtnDeleteTx">✕ Eliminar</button>
            </div>`;

        document.getElementById('inspBtnEditTx')?.addEventListener('click',   () => this._openTxModal(null, tx));
        document.getElementById('inspBtnDeleteTx')?.addEventListener('click', () => this._deleteTx(tx.id));
    }

    // ── Modales ───────────────────────────────────────────────────────────────
    _openRoleModal(role) {
        const modal   = document.getElementById('modalRole');
        const isEdit  = !!role;
        document.getElementById('modalRoleTitle').textContent   = isEdit ? 'Editar rol'  : 'Nuevo rol';
        document.getElementById('modalRoleConfirm').textContent = isEdit ? 'Guardar'     : 'Añadir al mapa';
        document.getElementById('modalRoleId').value            = isEdit ? role.id        : '';
        document.getElementById('modalRoleName').value          = isEdit ? role.name      : '';
        document.getElementById('modalRoleLevel').value         = isEdit ? (role.castell_level || 'tronc') : 'tronc';
        document.getElementById('modalRoleDesc').value          = isEdit ? (role.description   || '') : '';
        document.getElementById('modalRoleActor').value         = isEdit ? (role.typical_actor || '') : '';
        this._updateLevelTooltip(document.getElementById('modalRoleLevel').value);
        modal.classList.add('open');
        document.getElementById('modalRoleName').focus();
    }

    _updateLevelTooltip(val) {
        document.getElementById('modalRoleLevelTooltip').textContent = levelTooltip(val);
    }

    _bindModals() {
        // Nivel tooltip en tiempo real
        document.getElementById('modalRoleLevel')?.addEventListener('change', e => {
            this._updateLevelTooltip(e.target.value);
        });

        // Modal rol — cancelar
        document.getElementById('modalRoleCancel')?.addEventListener('click', () => {
            document.getElementById('modalRole').classList.remove('open');
        });

        // Modal rol — confirmar
        document.getElementById('modalRoleConfirm')?.addEventListener('click', () => {
            const name   = document.getElementById('modalRoleName').value.trim();
            if (!name) { document.getElementById('modalRoleName').focus(); return; }

            const id     = document.getElementById('modalRoleId').value || uid();
            const level  = document.getElementById('modalRoleLevel').value;
            const desc   = document.getElementById('modalRoleDesc').value.trim();
            const actor  = document.getElementById('modalRoleActor').value.trim();

            const existing = this._state.roles.findIndex(r => r.id === id);
            const roleObj  = { id, name, castell_level: level, description: desc || null, typical_actor: actor || null, fmv_usd_h: null, tags: [] };

            if (existing > -1) {
                this._state.roles[existing] = { ...this._state.roles[existing], ...roleObj };
            } else {
                this._state.roles.push(roleObj);
            }

            document.getElementById('modalRole').classList.remove('open');
            this._renderLists();
            this._rebuildGraph(this._zoomGroup);
        });

        // Cerrar modal con Escape
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                document.getElementById('modalRole')?.classList.remove('open');
                document.getElementById('modalTx')?.classList.remove('open');
            }
        });

        // Modal tx — cancelar
        document.getElementById('modalTxCancel')?.addEventListener('click', () => {
            document.getElementById('modalTx').classList.remove('open');
        });

        // Modal tx — confirmar
        document.getElementById('modalTxConfirm')?.addEventListener('click', () => {
            const deliverable = document.getElementById('modalTxDeliverable').value.trim();
            const from        = document.getElementById('modalTxFrom').value;
            const to          = document.getElementById('modalTxTo').value;
            if (!deliverable || !from || !to || from === to) {
                document.getElementById('modalTxDeliverable').focus();
                return;
            }

            const id      = document.getElementById('modalTxId').value || uid();
            const type    = document.getElementById('modalTxType').value;
            const is_must = document.getElementById('modalTxMust').value === 'true';
            const hint    = document.getElementById('modalTxHint').value.trim();

            const txObj = { id, from, to, deliverable, type, is_must, frequency: 'media', health_hint: hint || null };
            const existing = this._state.transactions.findIndex(t => t.id === id);
            if (existing > -1) {
                this._state.transactions[existing] = { ...this._state.transactions[existing], ...txObj };
            } else {
                this._state.transactions.push(txObj);
            }

            document.getElementById('modalTx').classList.remove('open');
            this._renderLists();
            this._rebuildGraph(this._zoomGroup);
        });
    }

    _openTxModal(presetFrom, tx) {
        if (this._state.roles.length < 2) {
            alert(t('ai.roles.2min'));
            return;
        }
        const modal  = document.getElementById('modalTx');
        const isEdit = !!tx;
        document.getElementById('modalTxTitle').textContent   = isEdit ? 'Editar transacción' : 'Nueva transacción';
        document.getElementById('modalTxConfirm').textContent = isEdit ? 'Guardar'            : 'Añadir al mapa';
        document.getElementById('modalTxId').value            = isEdit ? tx.id        : '';
        document.getElementById('modalTxDeliverable').value   = isEdit ? tx.deliverable : '';
        document.getElementById('modalTxType').value          = isEdit ? tx.type       : 'tangible';
        document.getElementById('modalTxMust').value          = isEdit ? String(tx.is_must) : 'true';
        document.getElementById('modalTxHint').value          = isEdit ? (tx.health_hint || '') : '';

        // Poblar selectores de roles
        const options = this._state.roles.map(r =>
            `<option value="${r.id}">${r.name}</option>`
        ).join('');
        document.getElementById('modalTxFrom').innerHTML = options;
        document.getElementById('modalTxTo').innerHTML   = options;

        if (isEdit) {
            document.getElementById('modalTxFrom').value = tx.from;
            document.getElementById('modalTxTo').value   = tx.to;
        } else if (presetFrom) {
            document.getElementById('modalTxFrom').value = presetFrom;
        }

        modal.classList.add('open');
        document.getElementById('modalTxDeliverable').focus();
    }

    // ── Eliminar ──────────────────────────────────────────────────────────────
    _deleteRole(id) {
        if (!confirm('¿Eliminar este rol y todas sus transacciones?')) return;
        this._state.roles        = this._state.roles.filter(r => r.id !== id);
        this._state.transactions = this._state.transactions.filter(t => t.from !== id && t.to !== id);
        this._state.selectedId   = null;
        this._hideInspector();
        this._renderLists();
        this._rebuildGraph(this._zoomGroup);
    }

    _deleteTx(id) {
        if (!confirm('¿Eliminar esta transacción?')) return;
        this._state.transactions = this._state.transactions.filter(t => t.id !== id);
        this._state.selectedId   = null;
        this._hideInspector();
        this._renderLists();
        this._rebuildGraph(this._zoomGroup);
    }

    // ── Listas panel izquierdo ────────────────────────────────────────────────
    _renderLists() {
        const roleList = document.getElementById('vmapRoleList');
        const txList   = document.getElementById('vmapTxList');
        if (!roleList || !txList) return;

        roleList.innerHTML = this._state.roles.map(r => {
            const color = this._levelColor(r.castell_level);
            const sel   = this._state.selectedId === r.id ? ' selected' : '';
            return `
                <div class="vmap-role-item${sel}" data-id="${r.id}">
                    <div class="vmap-role-dot" style="background:${color};"></div>
                    <div class="vmap-role-name" title="${r.name}">${r.name}</div>
                    <div class="vmap-level-badge" title="${levelTooltip(r.castell_level)}">${r.castell_level === 'pom_de_dalt' ? 'est' : r.castell_level === 'tronc' ? 'nuc' : 'bas'}</div>
                </div>`;
        }).join('') || '<div style="color:var(--text-muted);font-size:var(--text-xs);padding:8px;text-align:center;">Sin roles</div>';

        txList.innerHTML = this._state.transactions.map(t => {
            const color = t.type === 'tangible' ? COLOR_TANGIBLE : COLOR_INTANGIBLE;
            const sel   = this._state.selectedId === t.id ? ' selected' : '';
            return `
                <div class="vmap-tx-item${sel}" data-id="${t.id}">
                    <div class="vmap-tx-line" style="background:${color};${t.type === 'intangible' ? 'background:repeating-linear-gradient(90deg,'+color+' 0,'+color+' 4px,transparent 4px,transparent 7px);' : ''}"></div>
                    <div class="vmap-tx-label" title="${t.deliverable}">${truncate(t.deliverable, 26)}</div>
                </div>`;
        }).join('') || '<div style="color:var(--text-muted);font-size:var(--text-xs);padding:8px;text-align:center;">Sin transacciones</div>';

        // Click en items de lista
        roleList.querySelectorAll('.vmap-role-item').forEach(el => {
            el.addEventListener('click', () => this._selectItem(el.dataset.id, 'role'));
        });
        txList.querySelectorAll('.vmap-tx-item').forEach(el => {
            el.addEventListener('click', () => this._selectItem(el.dataset.id, 'tx'));
        });
    }

    // ── Tooltip ───────────────────────────────────────────────────────────────
    _showTooltip(event, txData) {
        const tip     = document.getElementById('vmap-tooltip');
        const color   = txData.type === 'tangible' ? COLOR_TANGIBLE : COLOR_INTANGIBLE;
        const must    = txData.is_must ? '✓ MUST' : '~ EXTRA';
        const typeStr = txData.type === 'tangible' ? 'Tangible' : 'Intangible';
        tip.innerHTML = `
            <div style="font-weight:700;color:${color};margin-bottom:3px;">${txData.deliverable}</div>
            <div style="font-size:9px;opacity:0.7;">${typeStr} · ${must}</div>
            ${txData.health_hint ? '<div style="font-size:9px;color:var(--accent-orange);margin-top:3px;">⚠ ' + txData.health_hint + '</div>' : ''}
        `;
        tip.style.display = 'block';
        this._moveTooltip(event);
    }

    _moveTooltip(event) {
        const tip    = document.getElementById('vmap-tooltip');
        const canvas = document.getElementById('vmapCanvas');
        const rect   = canvas.getBoundingClientRect();
        const x      = event.clientX - rect.left + 12;
        const y      = event.clientY - rect.top  - 10;
        tip.style.left = x + 'px';
        tip.style.top  = y + 'px';
    }

    _hideTooltip() {
        document.getElementById('vmap-tooltip').style.display = 'none';
    }

    // ── Zoom y utilidades ─────────────────────────────────────────────────────
    _zoom(factor) {
        if (!this._svg || !this._zoomBehavior) return;
        this._svg.transition().duration(200)
            .call(this._zoomBehavior.scaleBy, factor);
    }

    _fitGraph() {
        if (!this._svg || !this._zoomBehavior || !window.d3) return;
        this._svg.transition().duration(400)
            .call(this._zoomBehavior.transform, window.d3.zoomIdentity
                .translate(this._width / 2, this._height / 2)
                .scale(1)
                .translate(-this._width / 2, -this._height / 2));
    }

    _restartSim() {
        if (this._state.d3Sim) {
            this._state.d3Sim.alpha(0.8).restart();
        }
    }

    _showLegend() {
        alert(
            t('legend.title') + '\n\n' +
            t('legend.tangible') + '\n' +
            t('legend.intangible') + '\n\n' +
            t('legend.levels') + '\n' +
            t('legend.pinya') + '\n' +
            t('legend.tronc') + '\n' +
            t('legend.pom')
        );
    }


    // ══════════════════════════════════════════════════════════════════════════
    //  PANEL IA — Sprint 3
    // ══════════════════════════════════════════════════════════════════════════

    _openAIPanel() {
        const panel = document.getElementById('vmapAIPanel');
        if (!panel) return;
        panel.classList.add('open');
        this._resetAIPanel();
        document.getElementById('vmapAIPanelClose')?.addEventListener('click', () => this._closeAIPanel(), { once: true });
        document.getElementById('vmapAIGenerate')?.addEventListener('click',   () => this._runAISuggestion(), { once: true });
        document.getElementById('vmapAIRetry')?.addEventListener('click',      () => { this._resetAIPanel(); this._openAIPanel(); }, { once: true });
        document.getElementById('vmapAIBulkAccept')?.addEventListener('click', () => this._bulkAccept(), { once: true });
    }

    _closeAIPanel() {
        document.getElementById('vmapAIPanel')?.classList.remove('open');
    }

    _resetAIPanel() {
        const phase1 = document.getElementById('vmapAIPhase1');
        const phase2 = document.getElementById('vmapAIPhase2');
        if (phase1) phase1.style.display = 'block';
        if (phase2) phase2.style.display = 'none';
        const status = document.getElementById('vmapAIStatus');
        if (status) status.textContent = '';
        const btn = document.getElementById('vmapAIGenerate');
        if (btn) { btn.disabled = false; document.getElementById('vmapAIBtnText').textContent = t('ai.generate'); }
        const spinner = document.getElementById('vmapAISpinner');
        if (spinner) spinner.style.display = 'none';
        this._aiProposals = { roles: [], transactions: [] };
    }

    async _runAISuggestion() {
        const apiKey = await Orchestrator.getApiKey('anthropic');
        if (!apiKey) {
            document.getElementById('vmapAIStatus').textContent = t('ai.no.key');
            document.getElementById('vmapAIStatus').style.color = 'var(--accent-red)';
            setTimeout(() => { window.navigateTo('/settings'); }, 1800);
            return;
        }

        const freeText   = (document.getElementById('vmapAIPromptText').value || '').trim();
        const hasRoles   = this._state.roles.length > 0;
        const modeLabel  = hasRoles ? t('ai.completing') : t('ai.generating');

        // Estado visual: cargando
        const btn     = document.getElementById('vmapAIGenerate');
        const spinner = document.getElementById('vmapAISpinner');
        const status  = document.getElementById('vmapAIStatus');
        btn.disabled  = true;
        spinner.style.display = 'block';
        document.getElementById('vmapAIBtnText').textContent = modeLabel;
        status.style.color   = 'var(--text-muted)';
        status.textContent   = t('ai.enriching');

        try {
            // Context-First: enriquecer con sector + roles existentes
            const detectedSector = this._state.currentSector || null;
            const ctxResult = await KnowledgeLoader.buildContext({
                sector:      detectedSector,
                freeText:    freeText,
                existingMap: hasRoles ? { roles: this._state.roles, transactions: this._state.transactions } : null,
                includeVna:  true,
                taskContext: hasRoles
                    ? (getLang() === 'en' ? 'Suggest roles and transactions MISSING from the map. Do not repeat existing ones. Be concise.' : 'Sugiere roles y transacciones que FALTAN en el mapa. No repitas los existentes. Sé conciso.')
                    : (getLang() === 'en' ? 'Generate a complete VNA map for the described organization. Minimum 6 roles, minimum 2 per level.' : 'Genera un mapa VNA completo para la organización descrita. Mínimo 6 roles, mínimo 2 por nivel.'),
            });

            status.textContent = t('ai.calling');

            const isEn = getLang() === 'en';
            const systemPrompt = (isEn
                ? 'You are an expert in Value Network Analysis (Verna Allee methodology). Generate a VNA map in strict JSON format.'
                : 'Eres un experto en Value Network Analysis (metodología Verna Allee). Genera un mapa VNA en formato JSON estricto.') + `

RULES:
- Roles = value flow activities, NOT job titles
- Respond ONLY with valid JSON, no markdown blocks, no extra text
- fmv_usd_h always null
- open_question always null
- ids in kebab-case, unique
- ALL role names, descriptions, deliverables and health_hints MUST be written in ${isEn ? 'English' : 'Spanish'}
${hasRoles ? '- DO NOT repeat existing roles: ' + this._state.roles.map(function(r){ return r.id; }).join(', ') : ''}

CONTEXTO:
${ctxResult.systemPrompt}`;

            const userPrompt = freeText
                ? 'Organización: ' + freeText
                : (hasRoles ? 'Completa el mapa con los roles y transacciones que faltan.' : 'Genera un mapa VNA completo para el sector indicado en el contexto.');

            status.textContent = t('ai.processing');

            const result = await Orchestrator.callLLM({
                preferredEngine: 'anthropic',
                systemPrompt,
                userPrompt,
                responseFormat: 'json_object',
                temperature:    0.3,
            });

            const data = result.content;
            const roles = Array.isArray(data.roles)        ? data.roles        : [];
            const txs   = Array.isArray(data.transactions) ? data.transactions : [];

            if (roles.length === 0 && txs.length === 0) {
                status.textContent = t('ai.no.results');
                status.style.color = 'var(--accent-orange)';
                btn.disabled = false;
                spinner.style.display = 'none';
                document.getElementById('vmapAIBtnText').textContent = '✦ Generar mapa de valor';
                return;
            }

            this._aiProposals = { roles, transactions: txs };
            this._renderProposals(roles, txs);

            document.getElementById('vmapAIPhase1').style.display = 'none';
            document.getElementById('vmapAIPhase2').style.display = 'block';

        } catch (err) {
            console.error('[ValueMapView] IA error:', err);
            status.textContent = '❌ Error: ' + err.message;
            status.style.color = 'var(--accent-red)';
            btn.disabled = false;
            spinner.style.display = 'none';
            document.getElementById('vmapAIBtnText').textContent = '✦ Reintentar';
            // Re-bind del botón tras error
            btn.addEventListener('click', () => this._runAISuggestion(), { once: true });
        }
    }

    // ── Renderizar cards de propuesta ─────────────────────────────────────────
    _renderProposals(roles, txs) {
        const list = document.getElementById('vmapProposalList');
        if (!list) return;

        this._proposalState = {};
        roles.forEach(function(r){ this._proposalState[r.id] = 'pending'; }.bind(this));
        txs.forEach(function(t){   this._proposalState[t.id] = 'pending'; }.bind(this));

        let html = '';

        if (roles.length > 0) {
            html += '<div class="vmap-proposal-section-title">Roles sugeridos (' + roles.length + ')</div>';
            roles.forEach(function(r) {
                const lvlColor = this._levelColor(r.castell_level);
                const lvlLbl   = levelLabel(r.castell_level);
                html += '<div class="vmap-proposal-card" id="prop-' + r.id + '">' +
                    '<div class="vmap-proposal-card-name">' + (r.name || r.id) + '</div>' +
                    '<div class="vmap-proposal-card-desc">' + (r.description || '') + '</div>' +
                    '<div class="vmap-proposal-card-meta">' +
                        '<span class="vmap-proposal-meta-pill" style="background:' + lvlColor + '22;color:' + lvlColor + ';">' + lvlLbl + '</span>' +
                        (r.typical_actor ? '<span class="vmap-proposal-meta-pill" style="background:rgba(255,255,255,0.05);color:var(--text-muted);">' + r.typical_actor + '</span>' : '') +
                    '</div>' +
                    '<div class="vmap-proposal-card-actions">' +
                        '<button class="vmap-prop-btn vmap-prop-btn-accept" data-prop-id="' + r.id + '" data-prop-type="role">✓ Aceptar</button>' +
                        '<button class="vmap-prop-btn vmap-prop-btn-edit"   data-prop-id="' + r.id + '" data-prop-type="role-edit">✏ Editar</button>' +
                        '<button class="vmap-prop-btn vmap-prop-btn-reject" data-prop-id="' + r.id + '" data-prop-type="role-reject">✕</button>' +
                    '</div>' +
                '</div>';
            }.bind(this));
        }

        if (txs.length > 0) {
            html += '<div class="vmap-proposal-section-title" style="margin-top:12px;">Transacciones sugeridas (' + txs.length + ')</div>';
            txs.forEach(function(t) {
                const color    = t.type === 'intangible' ? COLOR_INTANGIBLE : COLOR_TANGIBLE;
                const typeLbl  = t.type === 'intangible' ? 'Intangible' : 'Tangible';
                const fromRole = this._state.roles.find(function(r){ return r.id === t.from; });
                const toRole   = this._state.roles.find(function(r){ return r.id === t.to; });
                const fromLbl  = fromRole ? fromRole.name : t.from;
                const toLbl    = toRole   ? toRole.name   : t.to;
                html += '<div class="vmap-proposal-card" id="prop-' + t.id + '">' +
                    '<div class="vmap-proposal-card-name">' + (t.deliverable || t.id) + '</div>' +
                    '<div class="vmap-proposal-card-desc">' + fromLbl + ' → ' + toLbl + '</div>' +
                    '<div class="vmap-proposal-card-meta">' +
                        '<span class="vmap-proposal-meta-pill" style="background:' + color + '22;color:' + color + ';">' + typeLbl + '</span>' +
                        '<span class="vmap-proposal-meta-pill" style="background:rgba(255,255,255,0.05);color:var(--text-muted);">' + (t.is_must ? 'MUST' : 'EXTRA') + '</span>' +
                    '</div>' +
                    '<div class="vmap-proposal-card-actions">' +
                        '<button class="vmap-prop-btn vmap-prop-btn-accept" data-prop-id="' + t.id + '" data-prop-type="tx">✓ Aceptar</button>' +
                        '<button class="vmap-prop-btn vmap-prop-btn-edit"   data-prop-id="' + t.id + '" data-prop-type="tx-edit">✏ Editar</button>' +
                        '<button class="vmap-prop-btn vmap-prop-btn-reject" data-prop-id="' + t.id + '" data-prop-type="tx-reject">✕</button>' +
                    '</div>' +
                '</div>';
            }.bind(this));
        }

        list.innerHTML = html;

        // Bind acciones de cada card
        list.querySelectorAll('.vmap-prop-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                const propId   = e.currentTarget.dataset.propId;
                const propType = e.currentTarget.dataset.propType;
                this._handleProposalAction(propId, propType);
            }.bind(this));
        }.bind(this));
    }

    _handleProposalAction(propId, propType) {
        const props = this._aiProposals;

        if (propType === 'role') {
            const role = props.roles.find(function(r){ return r.id === propId; });
            if (role && !this._state.roles.find(function(r){ return r.id === role.id; })) {
                this._state.roles.push({ fmv_usd_h: null, tags: [], ...role });
            }
            this._markProposal(propId, 'accepted');
            this._renderLists();
            this._rebuildGraph(this._zoomGroup);
        }
        else if (propType === 'role-edit') {
            const role = props.roles.find(function(r){ return r.id === propId; });
            if (role) this._openRoleModal(role);
        }
        else if (propType === 'role-reject') {
            this._markProposal(propId, 'rejected');
        }
        else if (propType === 'tx') {
            const tx = props.transactions.find(function(t){ return t.id === propId; });
            if (tx) {
                var roleIds = new Set(this._state.roles.map(function(r){ return r.id; }));
                var txFrom = tx.from, txTo = tx.to;
                // Match exacto falla — intentar match parcial (trim/lowercase)
                if (!roleIds.has(txFrom) || !roleIds.has(txTo)) {
                    roleIds.forEach(function(rid) {
                        if (rid.toLowerCase().trim() === (txFrom || '').toLowerCase().trim()) txFrom = rid;
                        if (rid.toLowerCase().trim() === (txTo   || '').toLowerCase().trim()) txTo   = rid;
                    });
                }
                if (!roleIds.has(txFrom) || !roleIds.has(txTo)) {
                    var status2 = document.getElementById('vmapAIStatus');
                    if (status2) {
                        status2.style.color = 'var(--accent-orange)';
                        status2.textContent = 'Accept the roles first before adding this transaction.';
                        setTimeout(function() { if (status2) status2.textContent = ''; }, 3000);
                    }
                    return;
                }
                var txFinal = Object.assign({}, tx, { from: txFrom, to: txTo });
                if (!this._state.transactions.find(function(t){ return t.id === txFinal.id; })) {
                    this._state.transactions.push(txFinal);
                }
            }
            this._markProposal(propId, 'accepted');
            this._renderLists();
            if (!this._zoomGroup) { this._mountGraph(); } else { this._rebuildGraph(this._zoomGroup); }
        }
        else if (propType === 'tx-edit') {
            const tx = props.transactions.find(function(t){ return t.id === propId; });
            if (tx) this._openTxModal(null, tx);
        }
        else if (propType === 'tx-reject') {
            this._markProposal(propId, 'rejected');
        }
    }

    _markProposal(propId, state) {
        this._proposalState[propId] = state;
        const card = document.getElementById('prop-' + propId);
        if (card) {
            card.classList.remove('accepted', 'rejected');
            card.classList.add(state);
        }
    }

    _bulkAccept() {
        var self = this;
        var props = self._aiProposals;

        // 1. Añadir roles primero
        props.roles.forEach(function(r) {
            if (self._proposalState[r.id] !== 'rejected' && !self._state.roles.find(function(x){ return x.id === r.id; })) {
                self._state.roles.push({ fmv_usd_h: null, tags: [], castell_level: r.castell_level || 'tronc', ...r });
                self._markProposal(r.id, 'accepted');
            }
        });

        // 2. Construir set de IDs de roles disponibles AHORA (tras añadir los nuevos)
        var availableRoleIds = new Set(self._state.roles.map(function(r){ return r.id; }));

        // 3. Añadir transacciones — solo las que tienen from/to resueltos
        var skipped = 0;
        props.transactions.forEach(function(t) {
            if (self._proposalState[t.id] === 'rejected') return;
            if (self._state.transactions.find(function(x){ return x.id === t.id; })) return;
            // Verificar que los roles existen
            var fromOk = availableRoleIds.has(t.from);
            var toOk   = availableRoleIds.has(t.to);
            if (fromOk && toOk) {
                self._state.transactions.push(t);
                self._markProposal(t.id, 'accepted');
            } else {
                // Intentar match parcial (lower/trim por si acaso)
                var fromMatch = null, toMatch = null;
                availableRoleIds.forEach(function(rid) {
                    if (rid.toLowerCase().trim() === (t.from || '').toLowerCase().trim()) fromMatch = rid;
                    if (rid.toLowerCase().trim() === (t.to   || '').toLowerCase().trim()) toMatch   = rid;
                });
                if (fromMatch && toMatch) {
                    var fixedTx = Object.assign({}, t, { from: fromMatch, to: toMatch });
                    self._state.transactions.push(fixedTx);
                    self._markProposal(t.id, 'accepted');
                } else {
                    skipped++;
                    console.warn('[VNA] tx skipped, missing roles — from:', t.from, 'to:', t.to);
                }
            }
        });

        if (skipped > 0) {
            var status = document.getElementById('vmapAIStatus');
            if (status) {
                status.style.color = 'var(--accent-orange)';
                status.textContent = skipped + ' transaction(s) skipped — roles not found.';
                setTimeout(function() { if (status) status.textContent = ''; }, 4000);
            }
        }

        self._renderLists();
        self._hideModeSelector();
        if (!self._zoomGroup) {
            self._mountGraph();
        } else {
            self._rebuildGraph(self._zoomGroup);
        }
    }

    // ── Guardar en KB ─────────────────────────────────────────────────────────
    async _saveMap() {
        const btn = document.getElementById('vmapBtnSave');
        if (btn) { btn.textContent = '⏳ Guardando…'; btn.disabled = true; }

        try {
            const projectId = this._state.projectId || ('proj-' + uid());
            this._state.projectId = projectId;

            // Serializar mapa como MD para la KB
            const md = KnowledgeLoader.serializeMapToMd(
                { roles: this._state.roles, transactions: this._state.transactions },
                { projectName: document.getElementById('vmapProjectName').textContent, projectId }
            );

            // Persistir en IndexedDB via KB
            await KB.init();
            await KB.saveNode({
                id:         'vna_map_' + projectId,
                type:       'vna_map',
                projectId,
                content:    { roles: this._state.roles, transactions: this._state.transactions },
                md_export:  md,
                updated_at: Date.now(),
            });

            // Actualizar store (para que HomeView lo muestre)
            const storeState = store.getState();
            const existing   = storeState.projects.find(p => p.id === projectId);
            if (existing) {
                await store.dispatch({
                    type:    'UPDATE_PROJECT_INFO',
                    payload: {
                        projectId,
                        updates: {
                            vna_roles:        this._state.roles,
                            vna_transactions: this._state.transactions,
                        }
                    }
                });
            } else {
                await store.dispatch({
                    type:    'CREATE_PROJECT',
                    payload: {
                        id:               projectId,
                        nombre:           document.getElementById('vmapProjectName').textContent || 'Nuevo ecosistema',
                        vna_roles:        this._state.roles,
                        vna_transactions: this._state.transactions,
                    }
                });
            }

            if (btn) { btn.textContent = '✅ Guardado'; }
            setTimeout(() => { if (btn) { btn.textContent = '💾 Guardar'; btn.disabled = false; } }, 2000);

        } catch (err) {
            console.error('[ValueMapView] Error al guardar:', err);
            if (btn) { btn.textContent = '❌ Error'; btn.disabled = false; }
            setTimeout(() => { if (btn) btn.textContent = '💾 Guardar'; }, 3000);
        }
    }
}
