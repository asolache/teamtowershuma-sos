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
import { taxonomicTagsForProject, taxonomicTagsForRole, mergeTags, buildTag } from '../core/semanticTagger.js';
import { renderNavLinksHtml, renderNavGroupedHtml, ensureNavGroupStyle, bindNavGroupDropdowns } from '../core/navService.js';
import { isTestProject, visibleProjects, archivedProjects } from '../core/projectFilter.js';
import { resolveCurrentMember, summarizeMemberIdentity, computeMemberImpact, groupProjectsByPhase, PHASE_ORDER, AVAILABILITY_META } from '../core/memberPanelService.js';
import { PHASE_META } from '../core/navService.js';
// UX-AUDIT-001 sprint C2 · editor inline del perfil membre
import { buildMatriuMember } from '../core/matriuMemberService.js';
import { SKILL_TAXONOMY } from '../core/skillTaxonomy.js';
// UX-AUDIT-001 sprint B · subtipus de sector + PROJECT_TYPES Matriu per al wizard
import { getSubtypesForSector, buildIaContextHint } from '../core/sectorSubtypes.js';
import { PROJECT_TYPES } from '../core/critical108Roles.js';
// PROJ-QUALITY-001 sprint B · score multidimensional al Dashboard
import { computeQualityScore, QUALITY_DIMS, statusColor as qualityColor, statusIcon as qualityIcon, QUALITY_THRESHOLDS } from '../core/projectQualityService.js';
import { suggestNextDim } from '../core/navService.js';
// PROJ-QUALITY-001 sprint D · onboarding service · 5 passes guiats
import { ONBOARDING_STEPS, computeOnboardingState, onboardingCompletion, nextOnboardingStep } from '../core/dashboardOnboardingService.js';
// FOUNDER-001 sprint B · plantilla founder clonable
import { buildFounderProject, FOUNDER_PROJECT_DEFAULTS } from '../core/founderTemplate.js';

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
                border-bottom: 1px solid var(--border-default);
                background: var(--bg-panel);
                position: sticky; top: 0; z-index: 20; flex-shrink: 0;
            }
            .dash-logo {
                font-size: var(--text-sm); font-weight: 900; color: var(--text-main);
                display: flex; align-items: center; gap: 6px; text-decoration: none;
            }
            .dash-logo span { color: var(--accent-indigo); }
            .dash-topbar-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }
            .dash-btn {
                background: transparent; border: 1px solid var(--border-default);
                color: var(--text-secondary); padding: 6px 12px;
                border-radius: var(--radius-sm); font-size: var(--text-xs);
                font-weight: 600; cursor: pointer; transition: all var(--dur-fast);
                font-family: var(--font-base);
                line-height: 1.2;
            }
            .dash-btn:hover { border-color: var(--accent-indigo); color: var(--text-main); background: var(--glass-hover); }
            .dash-btn:focus-visible { outline: 2px solid var(--accent-indigo); outline-offset: 2px; }
            .dash-btn-primary {
                background: var(--accent-indigo); border-color: var(--accent-indigo); color: #fff;
            }
            .dash-btn-primary:hover { filter: brightness(1.10); color: #fff; }
            .dash-btn-kb {
                border-color: rgba(212,168,83,0.40); color: var(--accent-claude);
            }
            .dash-btn-kb:hover { background: rgba(212,168,83,0.08); color: var(--accent-claude); border-color: var(--accent-claude); }

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
                color: var(--text-main); letter-spacing: -0.5px; margin-bottom: 4px;
            }
            .dash-hero h1 span { color: var(--accent-indigo); }
            .dash-hero-sub { font-size: var(--text-sm); color: var(--text-muted); font-family: var(--font-mono); }

            /* ── PROJ-QUALITY-001 sprint D · Helper Hero unificat ── */
            .dash-helper {
                background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.06));
                border: 1px solid var(--border-default);
                border-radius: var(--radius-lg);
                padding: 22px 24px 18px;
                margin-bottom: 24px;
                box-shadow: var(--shadow-sm);
            }
            .dash-helper-head {
                display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap;
                justify-content: space-between; margin-bottom: 14px;
            }
            .dash-helper-titles { flex: 1; min-width: 280px; }
            .dash-helper-h1 {
                font-size: 1.8rem; font-weight: 800; color: var(--text-main);
                margin: 0 0 6px 0; letter-spacing: -0.02em; line-height: 1.1;
            }
            .dash-helper-h1 strong { color: var(--accent-indigo); }
            .dash-helper-tagline {
                font-size: var(--text-sm); color: var(--text-secondary);
                line-height: 1.5; margin-bottom: 6px;
            }
            .dash-helper-sub {
                font-size: var(--text-xs); color: var(--text-muted);
                font-family: var(--font-mono);
            }
            .dash-helper-actions { display: flex; gap: 8px; flex-shrink: 0; align-items: center; flex-wrap: wrap; }
            .dash-btn-lg { padding: 9px 16px; font-size: var(--text-sm); }
            .dash-btn-ghost {
                background: transparent; color: var(--text-secondary);
                border: 1px solid var(--border-default); padding: 7px 14px;
                border-radius: var(--radius-md); font-size: var(--text-xs); font-weight: 600;
                text-decoration: none; transition: all var(--dur-fast);
                display: inline-flex; align-items: center;
            }
            .dash-btn-ghost:hover { border-color: var(--accent-indigo); color: var(--text-main); }
            .dash-helper-onb {
                display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 10px;
                padding-top: 14px; border-top: 1px solid var(--border-subtle);
            }
            .dash-helper-step {
                display: flex; gap: 10px; align-items: flex-start;
                padding: 10px 12px; border-radius: var(--radius-md);
                background: var(--bg-panel);
                border: 1px solid var(--border-default);
                text-decoration: none; color: var(--text-main);
                transition: all var(--dur-fast);
                position: relative;
            }
            .dash-helper-step:hover { border-color: var(--accent-indigo); transform: translateY(-1px); }
            .dash-helper-step.is-done {
                background: rgba(0,230,118,0.05);
                border-color: rgba(0,230,118,0.25);
                opacity: 0.85;
            }
            .dash-helper-step.is-next {
                background: rgba(99,102,241,0.10);
                border-color: var(--accent-indigo);
                box-shadow: 0 0 0 2px rgba(99,102,241,0.20);
            }
            .dash-helper-step-icon {
                width: 32px; height: 32px; border-radius: 8px;
                display: flex; align-items: center; justify-content: center;
                font-size: 16px; flex-shrink: 0;
                background: var(--bg-elevated); border: 1px solid var(--border-subtle);
            }
            .dash-helper-step.is-done .dash-helper-step-icon {
                background: rgba(0,230,118,0.15); border-color: rgba(0,230,118,0.40);
            }
            .dash-helper-step.is-next .dash-helper-step-icon {
                background: rgba(99,102,241,0.20); border-color: rgba(99,102,241,0.50);
            }
            .dash-helper-step-body { min-width: 0; flex: 1; }
            .dash-helper-step-num {
                font-size: 9px; color: var(--text-muted); font-family: var(--font-mono);
                letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700;
            }
            .dash-helper-step-label {
                font-size: var(--text-xs); font-weight: 800; color: var(--text-main);
                line-height: 1.25; margin: 2px 0 3px;
                display: flex; align-items: center; gap: 6px;
            }
            .dash-helper-step.is-done .dash-helper-step-label { color: #00e676; }
            .dash-helper-step-tick { color: #00e676; font-size: 11px; }
            .dash-helper-step-hint {
                font-size: 10px; color: var(--text-muted); line-height: 1.4;
                margin-bottom: 4px;
            }
            .dash-helper-step-cta {
                font-size: 10px; color: var(--accent-indigo); font-weight: 700;
                margin-top: auto;
            }
            .dash-helper-step.is-done .dash-helper-step-cta { color: var(--text-muted); }
            .dash-helper-progress {
                display: flex; align-items: center; gap: 10px;
                font-size: var(--text-xs); color: var(--text-secondary);
                margin-bottom: 12px; font-weight: 600;
            }
            .dash-helper-progress-bar {
                flex: 1; height: 6px; border-radius: 999px;
                background: var(--border-default); overflow: hidden;
                max-width: 240px;
            }
            .dash-helper-progress-fill {
                height: 100%; border-radius: 999px;
                background: linear-gradient(90deg, var(--accent-indigo), var(--accent-purple));
                transition: width 0.6s ease;
            }
            .dash-helper-progress-pct { font-family: var(--font-mono); color: var(--accent-indigo); font-weight: 800; }
            .dash-helper.is-complete .dash-helper-onb { display: none; }
            .dash-helper-complete-badge {
                display: none; align-items: center; gap: 8px;
                font-size: var(--text-sm); font-weight: 700; color: #00e676;
                padding: 10px 14px; border-radius: var(--radius-md);
                background: rgba(0,230,118,0.08); border: 1px solid rgba(0,230,118,0.30);
                margin-top: 8px;
            }
            .dash-helper.is-complete .dash-helper-complete-badge { display: inline-flex; }

            /* ── UX-DASH-001 · onboarding flow + áreas (legacy · mantingut per compat) ── */
            .dash-section-title { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.12em; font-family: var(--font-mono); margin: 0 0 10px 0; font-weight: 700; }
            .dash-onboard {
                display: grid; grid-template-columns: repeat(auto-fill,minmax(200px,1fr));
                gap: 10px; margin-bottom: 28px;
            }
            .dash-onboard-tile {
                background: var(--bg-panel);
                border: 1px solid var(--border-default); border-left: 3px solid var(--ob-c,#6366f1);
                border-radius: var(--radius-md); padding: 12px 14px; cursor: pointer;
                transition: background 0.15s, transform 0.15s, border-color 0.15s;
                text-decoration: none; color: inherit; display: flex; flex-direction: column; gap: 4px;
            }
            .dash-onboard-tile:hover { background: rgba(99,102,241,0.08); transform: translateY(-1px); border-color: var(--accent-indigo); }
            .dash-onboard-step { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); letter-spacing: 0.08em; text-transform: uppercase; }
            .dash-onboard-title { font-size: 0.92rem; font-weight: 800; color: var(--text-main); line-height: 1.25; }
            .dash-onboard-desc  { font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; }

            .dash-areas {
                display: grid; grid-template-columns: repeat(auto-fill,minmax(160px,1fr));
                gap: 8px; margin-bottom: 28px;
            }
            .dash-area-tile {
                background: var(--bg-panel); border: 1px solid var(--border-default);
                border-radius: var(--radius-md); padding: 10px 12px; cursor: pointer;
                transition: background 0.15s, border-color 0.15s; text-decoration: none; color: inherit;
                display: flex; align-items: center; gap: 10px;
            }
            .dash-area-tile:hover { background: rgba(99,102,241,0.08); border-color: var(--accent-indigo); }
            .dash-area-icon  { font-size: 1.3rem; line-height: 1; }
            .dash-area-label { font-size: 0.85rem; font-weight: 700; color: var(--text-main); }
            .dash-area-hint  { font-size: 0.68rem; color: var(--text-muted); }

            /* ── Stats bar ── */
            .dash-stats {
                display: flex; gap: 16px; margin-bottom: 32px; flex-wrap: wrap;
            }
            .dash-stat {
                background: var(--bg-panel); border: 1px solid var(--border-default);
                border-radius: var(--radius-md); padding: 12px 18px;
                min-width: 120px;
            }
            .dash-stat-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; font-family: var(--font-mono); margin-bottom: 4px; }
            .dash-stat-value { font-size: var(--text-xl); font-weight: 900; color: var(--text-main); font-family: var(--font-mono); }

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
                background: var(--bg-panel);
                border: 1px solid var(--border-default); border-radius: var(--radius-lg);
                padding: 18px 20px; cursor: pointer; text-decoration: none; color: inherit;
                transition: all var(--dur-base) var(--ease-out);
                display: flex; flex-direction: column; gap: 10px;
                position: relative; overflow: hidden;
                box-shadow: var(--shadow-sm);
            }
            .dash-card:hover {
                border-color: var(--accent-indigo);
                transform: translateY(-2px);
                box-shadow: var(--shadow-indigo);
            }
            /* ── PROJ-QUALITY-001 sprint E · card refactor més comprensible ── */
            .dash-card-link { text-decoration: none; color: inherit; display: flex; flex-direction: column; gap: 8px; }
            .dash-card-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
            .dash-card-name {
                font-size: var(--text-sm); font-weight: 900; color: var(--text-main);
                line-height: 1.25; flex: 1; min-width: 0;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .dash-card-score {
                font-size: 0.95rem; font-weight: 900; font-family: var(--font-mono);
                padding: 3px 9px; border-radius: var(--radius-md); flex-shrink: 0;
                display: inline-flex; gap: 4px; align-items: center; min-width: 56px; justify-content: center;
            }
            .dash-card-purpose {
                font-size: 11px; color: var(--text-secondary); line-height: 1.45;
                overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
            }
            .dash-card-purpose-empty { color: var(--text-muted); font-style: italic; }
            .dash-card-meta {
                font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);
                display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
            }
            .dash-card-meta span { display: inline-flex; align-items: center; gap: 3px; }
            .dash-card-tag-demo {
                background: rgba(201,168,83,0.15); color: var(--accent-claude);
                padding: 1px 6px; border-radius: 3px; font-weight: 700; letter-spacing: 0.05em;
            }
            .dash-card-tag-sector {
                background: rgba(99,102,241,0.15); color: var(--accent-indigo);
                padding: 1px 6px; border-radius: 3px; font-weight: 700;
            }
            .dash-card-date-rel { font-style: italic; }
            .dash-card-footer-row {
                display: flex; align-items: center; gap: 6px;
                padding-top: 8px; border-top: 1px solid var(--glass-border);
            }
            .dash-card-next {
                flex: 1; display: inline-flex; align-items: center; gap: 5px;
                padding: 5px 9px; border-radius: var(--radius-sm);
                background: linear-gradient(135deg, rgba(99,102,241,0.10), rgba(168,85,247,0.08));
                border: 1px solid rgba(99,102,241,0.30);
                color: var(--text-main); text-decoration: none;
                font-size: 11px; font-weight: 700; transition: all var(--dur-fast);
                min-width: 0;
            }
            .dash-card-next:hover { border-color: var(--accent-indigo); }
            .dash-card-next-icon { font-size: 13px; }
            .dash-card-next-lbl { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .dash-card-next-gain {
                font-family: var(--font-mono); font-size: 10px; padding: 1px 6px;
                border-radius: 10px; background: rgba(99,102,241,0.20); color: var(--accent-indigo);
            }
            .dash-card-next-done {
                background: rgba(0,230,118,0.08); border-color: rgba(0,230,118,0.30);
                color: #00e676;
            }
            .dash-card-next-done:hover { border-color: #00e676; }
            .dash-card-action-btn {
                background: var(--bg-panel); border: 1px solid var(--border-default);
                color: var(--text-muted); font-size: 13px; padding: 4px 8px;
                border-radius: var(--radius-sm); cursor: pointer; transition: all var(--dur-fast);
                font-family: var(--font-base); font-weight: 700; flex-shrink: 0;
            }
            .dash-card-action-btn:hover { color: var(--accent-red); border-color: rgba(255,82,82,0.4); }
            .dash-card-health-bar { height: 4px; border-radius: 2px; background: var(--glass-border); overflow: hidden; }
            .dash-card-health-fill { height: 100%; border-radius: 2px; transition: width .5s ease; }
            .dash-card-qbar-lbl {
                font-size: 9px; opacity: 0.6; text-align: center;
                margin-top: 2px; line-height: 1;
            }
            .dash-card-qbar { flex-direction: column; }
            .dash-card-qradar { height: auto; padding: 4px 0 2px; }

            /* ── New project card ── */
            .dash-card-new {
                border: 1px dashed rgba(99,102,241,0.25); border-radius: var(--radius-xl);
                padding: 18px 20px; cursor: pointer; color: var(--text-muted);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                gap: 8px; min-height: 120px; transition: all var(--dur-base) var(--ease-out);
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
                border-left: 1px solid var(--border-default);
                background: var(--bg-panel);
                overflow-y: auto;
                display: none;
            }
            .dash-main.kb-open .dash-kb-panel { display: flex; flex-direction: column; }
            .dash-kb-head {
                padding: 14px 16px 10px; border-bottom: 1px solid var(--glass-border);
                display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
            }
            .dash-kb-title { font-size: var(--text-sm); font-weight: 900; color: var(--accent-claude); display: flex; align-items: center; gap: 6px; }
            .dash-kb-close { background: transparent; border: none; color: var(--text-muted); font-size: 1rem; cursor: pointer; padding: 2px 6px; border-radius: var(--radius-sm); }
            .dash-kb-close:hover { color: var(--text-main); }
            .dash-kb-body { flex: 1; overflow-y: auto; padding: 14px 16px; }
            .dash-kb-sector-item {
                display: flex; align-items: center; justify-content: space-between;
                padding: 8px 10px; border-radius: var(--radius-sm); cursor: pointer;
                transition: background var(--dur-fast); margin-bottom: 4px;
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
            .dash-kb-detail-title { font-size: var(--text-sm); font-weight: 900; color: var(--text-main); margin-bottom: 8px; }
            .dash-kb-role-item {
                padding: 7px 10px; border-radius: var(--radius-sm);
                background: rgba(25,25,32,0.8); margin-bottom: 5px;
                border-left: 2px solid var(--accent-indigo);
            }
            .dash-kb-role-name { font-size: var(--text-xs); color: var(--text-main); font-weight: 700; margin-bottom: 2px; }
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
                background: rgba(0,0,0,0.65); align-items: flex-start; justify-content: center;
                /* MODAL-SCROLL-FIX · pantalles petites · permet scroll vertical del backdrop
                   per veure el footer del modal sense quedar tallat. */
                overflow-y: auto; padding: 1rem 0;
            }
            .dash-modal-bg.open { display: flex; }
            .dash-modal {
                background: var(--bg-elevated); border: 1px solid var(--glass-border);
                border-radius: var(--radius-xl); padding: 24px; width: 400px; max-width: 95vw;
                animation: slideUp var(--dur-base) var(--ease-spring);
                /* MODAL-SCROLL-FIX · permet que el modal escrolli internament en lloc
                   de quedar tallat per la viewport. max-height calc per deixar marge. */
                max-height: calc(100dvh - 2rem);
                overflow-y: auto;
                margin: auto;
            }
            .dash-modal h2 { font-size: var(--text-lg); font-weight: 900; margin: 0 0 4px; color: var(--text-main); }
            .dash-modal-sub { font-size: var(--text-xs); color: var(--text-muted); margin-bottom: 20px; font-family: var(--font-mono); }
            .dash-form-group { margin-bottom: 14px; }
            .dash-form-label { display: block; font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; margin-bottom: 5px; }
            .dash-form-input {
                width: 100%; background: var(--bg-elevated); border: 1px solid var(--glass-border);
                color: var(--text-main); padding: 10px 12px; border-radius: var(--radius-md);
                font-family: var(--font-base); font-size: var(--text-sm); outline: none;
                transition: border-color var(--dur-fast); box-sizing: border-box;
            }
            .dash-form-input:focus { border-color: var(--accent-indigo); }
            .dash-modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
            .dash-modal-cancel { background: transparent; border: 1px solid var(--glass-border); color: var(--text-muted); padding: 9px 18px; border-radius: var(--radius-md); cursor: pointer; font-weight: 700; font-size: var(--text-sm); font-family: var(--font-base); }
            .dash-modal-cancel:hover { color: var(--text-main); }
            .dash-modal-confirm { background: var(--accent-indigo); border: none; color: var(--text-main); padding: 9px 20px; border-radius: var(--radius-md); cursor: pointer; font-weight: 900; font-size: var(--text-sm); font-family: var(--font-base); }
            .dash-modal-confirm:hover { filter: brightness(1.1); }

            
            /* ── Hero v2 ── */
            .dash-hero-bg {
                position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0;
            }
            .dash-hero-bg svg { width: 100%; height: 100%; opacity: .04; }
            .dash-hero-inner { position: relative; z-index: 1; }
            .dash-hero { position: relative; margin-bottom: 32px; padding: 28px 0 24px;
                border-bottom: 1px solid var(--glass-border); animation: fadeIn 0.5s var(--ease-out); }
            .dash-hero h1 { font-size: 2.4rem; color: var(--text-main);
                letter-spacing: -0.5px; margin-bottom: 4px; line-height: 1.05; }
            .dash-hero h1 span { color: var(--accent-indigo); }
            /* MAT-002-B · cuando .mat-hero-h1 está activo, el strong/span coge acento Matriu */
            .dash-hero h1.mat-hero-h1 strong { color: var(--mat-tcotta); font-weight: 400; }
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
            .dash-stat-value { font-size: var(--text-xl); font-weight: 900; color: var(--text-main);
                font-family: var(--font-mono); }
            .dash-stat-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
                background: var(--glass-border); }
            .dash-stat-bar-fill { height: 100%; border-radius: 0 2px 2px 0; transition: width .6s ease; }

            /* ── Card v2 ── */
            .dash-card-demo { border-color: rgba(201,168,83,0.4) !important; }
            .dash-card-demo:hover { border-color: rgba(201,168,83,0.8) !important;
                box-shadow: 0 8px 30px rgba(201,168,83,0.15) !important; }

            /* MAT-002-F · Strip Matriu Cohort 0 (skin crema embebido) */
            .dash-matriu-strip { background: linear-gradient(135deg, #f1ebde 0%, #ede5d2 100%); border-radius: var(--radius-xl); padding: 28px 32px; margin: 0 0 32px; color: #2a3a2a; position: relative; overflow: hidden; box-shadow: 0 8px 32px rgba(194,90,58,0.08); }
            .dash-matriu-strip::before { content: ''; position: absolute; top: 0; right: 0; width: 220px; height: 220px; background: radial-gradient(circle, rgba(194,90,58,0.12) 0%, transparent 70%); pointer-events: none; }
            .dash-matriu-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 18px; flex-wrap: wrap; }
            .dash-matriu-title { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-weight: 400; font-size: 1.6rem; color: #2a3a2a; line-height: 1.1; margin: 0; }
            .dash-matriu-title strong { color: #c25a3a; font-weight: 400; }
            .dash-matriu-subtitle { font-size: 0.82rem; color: #5a6e4f; opacity: 0.9; margin-top: 6px; line-height: 1.5; max-width: 540px; }
            .dash-matriu-counter { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: rgba(42,58,42,0.06); border: 1px solid rgba(42,58,42,0.18); border-radius: 999px; font-family: ui-monospace, monospace; font-size: 0.78rem; color: #2a3a2a; }
            .dash-matriu-counter::before { content: '●'; color: #c25a3a; animation: pulse 2s infinite; }
            .dash-matriu-seats { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-top: 4px; }
            .dash-matriu-seat { background: rgba(255,255,255,0.55); border: 1px solid rgba(42,58,42,0.12); border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; cursor: pointer; transition: transform 0.15s, border-color 0.15s, background 0.15s; text-decoration: none; color: inherit; }
            .dash-matriu-seat:hover { transform: translateY(-2px); border-color: rgba(194,90,58,0.45); background: rgba(255,255,255,0.85); }
            .dash-matriu-seat-name { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 1.15rem; color: #2a3a2a; line-height: 1.2; }
            .dash-matriu-seat-meta { font-family: ui-monospace, monospace; font-size: 0.7rem; color: #5a6e4f; opacity: 0.85; letter-spacing: 0.04em; text-transform: uppercase; }
            .dash-matriu-seat-foot { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: auto; }
            .dash-matriu-multiplier { display: inline-flex; align-items: center; padding: 2px 8px; background: rgba(194,90,58,0.12); border: 1px solid rgba(194,90,58,0.4); color: #c25a3a; border-radius: 999px; font-family: ui-monospace, monospace; font-size: 0.7rem; font-weight: 700; }
            .dash-matriu-type-pill { display: inline-flex; align-items: center; padding: 2px 8px; background: rgba(42,58,42,0.06); border: 1px solid rgba(42,58,42,0.2); color: #2a3a2a; border-radius: 999px; font-family: ui-monospace, monospace; font-size: 0.7rem; }
            .dash-matriu-actions { display: flex; gap: 8px; align-items: center; margin-top: 16px; flex-wrap: wrap; position: relative; z-index: 1; }
            .dash-matriu-cta { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; background: #1a1f1a; color: #f1ebde; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 0.85rem; transition: transform 0.15s, box-shadow 0.15s; border: 0; cursor: pointer; }
            .dash-matriu-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(26,31,26,0.25); }
            .dash-matriu-cta-secondary { background: transparent; color: #2a3a2a; border: 1px solid rgba(42,58,42,0.25); padding: 10px 18px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 0.85rem; }
            .dash-matriu-cta-secondary:hover { background: rgba(42,58,42,0.06); }
            .dash-card-demo-badge {
                font-size: 8px; font-family: var(--font-mono); font-weight: 700;
                letter-spacing: .1em; text-transform: uppercase;
                background: rgba(201,168,83,0.15); color: var(--accent-claude);
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
            /* PROJ-QUALITY-001 sprint B · mini-radar 5 dims (EQ-style) */
            .dash-card-qradar {
                display: flex; gap: 4px; align-items: flex-end; height: 28px;
                margin: 4px 0 2px; padding: 2px 0;
            }
            .dash-card-qbar {
                flex: 1; height: 100%;
                background: var(--glass-border); border-radius: 2px;
                display: flex; align-items: flex-end; overflow: hidden;
                cursor: help;
            }
            .dash-card-qbar-fill {
                width: 100%; min-height: 4px;
                border-radius: 2px; transition: height .4s ease;
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
            .dash-empty-title { font-size: var(--text-lg); font-weight: 900; color: var(--text-main);
                text-align: center; }
            .dash-empty-sub { font-size: var(--text-xs); color: var(--text-muted);
                font-family: var(--font-mono); text-align: center; }
            .dash-empty-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;
                margin-top: 8px; }
            .dash-empty-cta {
                background: var(--accent-indigo); border: none; color: var(--text-main);
                padding: 9px 20px; border-radius: var(--radius-md); cursor: pointer;
                font-weight: 900; font-size: var(--text-xs); font-family: var(--font-base);
                transition: filter .2s; text-decoration: none; display: inline-block;
            }
            .dash-empty-cta:hover { filter: brightness(1.12); }
            .dash-empty-cta-ghost {
                background: transparent; border: 1px solid rgba(201,168,83,0.4);
                color: var(--accent-claude); padding: 9px 20px; border-radius: var(--radius-md);
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
            .dash-topbar-web:hover { color: var(--accent-claude); }

            @media (max-width: 768px) {
                .dash-content { padding: 16px; }
                .dash-main.kb-open { grid-template-columns: 1fr; }
                .dash-main.kb-open .dash-kb-panel { display: none; }
            }

            /* ── UX-AUDIT-001 sprint C · Panell del membre ── */
            .dash-member-panel {
                background: var(--bg-panel);
                border: 1px solid var(--border-default);
                border-radius: var(--radius-lg);
                padding: 22px 26px;
                margin-bottom: 28px;
                box-shadow: var(--shadow-sm);
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 18px;
                align-items: start;
            }
            .dash-member-head {
                display: flex;
                align-items: center;
                gap: 16px;
                flex-wrap: wrap;
            }
            .dash-member-avatar {
                width: 56px; height: 56px;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--accent-indigo), var(--accent-purple));
                display: flex; align-items: center; justify-content: center;
                color: #fff; font-size: 1.4rem; font-weight: 800;
                flex-shrink: 0;
                box-shadow: var(--shadow-indigo);
            }
            .dash-member-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
            .dash-member-name { font-size: var(--text-lg); font-weight: 700; color: var(--text-main); letter-spacing: -0.01em; }
            .dash-member-handle { font-size: var(--text-sm); color: var(--text-muted); font-family: var(--font-mono); }
            .dash-member-meta { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 4px; font-size: var(--text-xs); color: var(--text-secondary); }
            .dash-member-meta span { display: inline-flex; align-items: center; gap: 4px; }
            .dash-member-stats {
                display: grid;
                grid-template-columns: repeat(3, minmax(110px, 1fr));
                gap: 12px;
                align-items: stretch;
            }
            .dash-member-stat {
                background: var(--bg-elevated);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-md);
                padding: 10px 14px;
                min-width: 100px;
                text-align: right;
            }
            .dash-member-stat-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; font-family: var(--font-mono); }
            .dash-member-stat-value { font-size: var(--text-lg); font-weight: 700; color: var(--text-main); font-family: var(--font-mono); margin-top: 4px; line-height: 1; }
            .dash-member-actions { grid-column: 1 / -1; display: flex; gap: 10px; margin-top: 4px; flex-wrap: wrap; }
            .dash-member-action {
                font-size: var(--text-xs); font-weight: 600;
                color: var(--text-secondary);
                text-decoration: none;
                padding: 6px 12px;
                border: 1px solid var(--border-default);
                border-radius: var(--radius-sm);
                transition: all var(--dur-fast);
                font-family: var(--font-base);
            }
            .dash-member-action:hover { color: var(--text-main); border-color: var(--accent-indigo); background: rgba(99,102,241,0.06); }
            .dash-member-empty {
                color: var(--text-muted);
                font-size: var(--text-sm);
                font-style: italic;
            }

            /* ── Sprint C2 · editor inline ── */
            .dash-member-edit { grid-column: 1 / -1; padding-top: 14px; border-top: 1px dashed var(--border-default); margin-top: 6px; display: flex; flex-direction: column; gap: 14px; }
            .dash-member-edit-row { display: flex; flex-direction: column; gap: 6px; }
            .dash-member-edit-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; font-family: var(--font-mono); }
            .dash-member-chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
            .dash-member-chip {
                display: inline-flex; align-items: center; gap: 6px;
                padding: 4px 10px;
                background: rgba(99,102,241,0.10);
                border: 1px solid rgba(99,102,241,0.30);
                color: var(--accent-indigo);
                border-radius: var(--radius-full);
                font-size: var(--text-xs);
                font-weight: 600;
            }
            .dash-member-chip button {
                background: none; border: 0; color: inherit; cursor: pointer;
                font-size: 14px; line-height: 1; padding: 0 2px; opacity: 0.65;
            }
            .dash-member-chip button:hover { opacity: 1; color: var(--accent-red); }
            .dash-member-chip-sector { background: rgba(16,185,129,0.10); border-color: rgba(16,185,129,0.30); color: var(--accent-green); }
            .dash-member-edit select, .dash-member-edit input {
                background: var(--bg-elevated);
                border: 1px solid var(--border-default);
                color: var(--text-main);
                padding: 7px 10px;
                border-radius: var(--radius-md);
                font-size: var(--text-sm);
                font-family: var(--font-base);
                outline: none;
                max-width: 320px;
                transition: border-color var(--dur-fast);
            }
            .dash-member-edit select:focus, .dash-member-edit input:focus { border-color: var(--accent-indigo); box-shadow: var(--shadow-focus); }
            .dash-member-avail-group { display: flex; gap: 6px; flex-wrap: wrap; }
            .dash-member-avail-btn {
                padding: 6px 12px;
                border-radius: var(--radius-full);
                background: var(--bg-elevated);
                border: 1px solid var(--border-default);
                color: var(--text-secondary);
                font-size: var(--text-xs);
                font-weight: 600;
                cursor: pointer;
                transition: all var(--dur-fast);
                font-family: var(--font-base);
            }
            .dash-member-avail-btn:hover { color: var(--text-main); border-color: var(--accent-indigo); }
            .dash-member-avail-btn.is-active {
                background: rgba(99,102,241,0.12);
                border-color: var(--accent-indigo);
                color: var(--accent-indigo);
            }
            .dash-member-save-row { display: flex; gap: 8px; align-items: center; margin-top: 6px; }
            .dash-member-save-btn {
                background: linear-gradient(135deg, var(--accent-indigo), var(--accent-purple));
                color: #fff; border: 0;
                padding: 8px 16px;
                border-radius: var(--radius-md);
                font-weight: 700;
                font-size: var(--text-sm);
                cursor: pointer;
                transition: filter var(--dur-fast);
                font-family: var(--font-base);
            }
            .dash-member-save-btn:hover { filter: brightness(1.08); }
            .dash-member-save-cancel { background: transparent; color: var(--text-muted); border: 1px solid var(--border-default); padding: 8px 14px; border-radius: var(--radius-md); cursor: pointer; font-size: var(--text-sm); font-weight: 600; }
            .dash-member-save-cancel:hover { color: var(--text-main); border-color: var(--text-muted); }
            .dash-member-save-status { font-size: var(--text-xs); color: var(--accent-green); font-family: var(--font-mono); }

            /* ── UX-AUDIT-001 sprint C · Phase filter chips ── */
            .dash-phase-bar {
                display: flex; gap: 8px; flex-wrap: wrap;
                margin: 18px 0 20px;
                align-items: center;
            }
            .dash-phase-chip {
                display: inline-flex; align-items: center; gap: 6px;
                padding: 6px 12px;
                border-radius: var(--radius-full);
                font-size: var(--text-xs); font-weight: 600;
                cursor: pointer;
                background: var(--bg-panel);
                border: 1px solid var(--border-default);
                color: var(--text-secondary);
                transition: all var(--dur-fast);
                font-family: var(--font-base);
            }
            .dash-phase-chip:hover { border-color: var(--accent-indigo); color: var(--text-main); }
            .dash-phase-chip.is-active {
                background: rgba(99,102,241,0.12);
                border-color: var(--accent-indigo);
                color: var(--accent-indigo);
            }
            .dash-phase-chip .count {
                font-family: var(--font-mono);
                opacity: 0.7;
            }

            /* ── Phase group header (substitueix sector-label) ── */
            .dash-phase-group { margin-bottom: 28px; animation: slideUp 0.4s var(--ease-out); }
            .dash-phase-label {
                font-size: 11px; font-weight: 700; color: var(--text-muted);
                text-transform: uppercase; letter-spacing: 0.14em;
                font-family: var(--font-mono);
                margin-bottom: 12px;
                display: flex; align-items: center; gap: 8px;
            }
            .dash-phase-label::after { content: ''; flex: 1; height: 1px; background: var(--border-subtle); }
            .dash-phase-label .icon { font-size: 1rem; line-height: 1; }
        </style>

        <div class="dash-shell">

            <!-- PROJ-QUALITY-001 sprint D · Topbar slim · global-nav ja porta logo i nav,
                 aquí només controls utilitaris (Export/Import/Lang). El + Nou Projecte
                 viu a la helper card per evitar duplicació visual. -->
            <div class="dash-topbar">
                <span class="dash-topbar-version">SOS V11 · Value Network Dashboard</span>
                <a href="https://teamtowershuma.com" target="_blank" class="dash-topbar-web">teamtowershuma.com ↗</a>
                <div class="dash-topbar-right">
                    <button class="dash-btn" id="dashBtnExport" title="Descargar snapshot firmado (ECDSA P-256)">💾 Export</button>
                    <button class="dash-btn" id="dashBtnImport" title="Cargar snapshot firmado">📥 Import</button>
                    <input type="file" id="dashImportFile" accept=".json,application/json" style="display:none;">
                    <div id="dashLangSelector"></div>
                </div>
            </div>

            <!-- MAIN -->
            <div class="dash-main" id="dashMain">

                <!-- CONTENT -->
                <div class="dash-content" id="dashContent">

                    <!-- PROJ-QUALITY-001 sprint D · Helper Hero unificat ·
                         capçalera + copies clau + checklist 5 passes guiats +
                         stats inline + cta + Nou Projecte. Substitueix els
                         antics blocs "¿Cómo funciona? 4 pasos" + "Áreas del sistema"
                         per evitar duplicació amb el sub-navbar de projecte +
                         global-nav ja existents. -->
                    <div class="dash-helper" id="dashHelper">
                        <div class="dash-helper-head">
                            <div class="dash-helper-titles">
                                <h1 class="dash-helper-h1">Value <strong>Network</strong> Dashboard</h1>
                                <div class="dash-helper-tagline">Every organization has two structures · this maps the real one.</div>
                                <div class="dash-helper-sub" id="dashHeroSub">Loading projects…</div>
                            </div>
                            <div class="dash-helper-actions">
                                <button class="dash-btn dash-btn-primary dash-btn-lg" id="dashBtnNew" title="Crea o clona un projecte">＋ Nou projecte</button>
                                <a class="dash-btn dash-btn-ghost" href="/map?project=proj-colla-demo-v11" data-link title="Veure el projecte demo Castellers">✦ Veure demo</a>
                            </div>
                        </div>
                        <!-- Onboarding checklist · 5 passes auto-detectats -->
                        <div class="dash-helper-onb" id="dashHelperOnb"></div>
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

        <!-- H1.10.1 · Modal Clonar sector (lo monta dinámicamente _openCloneModal) -->
        <div id="dashCloneRoot"></div>

        <!-- MODAL NUEVO PROYECTO · UX-FUSE-001 wizard unificado · 3 modos -->
        <div class="dash-modal-bg" id="dashModalNew">
            <div class="dash-modal" style="max-width:540px;">
                <h2>＋ Nuevo proyecto</h2>
                <div class="dash-modal-sub">Un solo wizard · 4 caminos según lo que rellenes</div>

                <!-- FOUNDER-001 sprint B · clonar founder template -->
                <div class="dash-form-group" style="background:linear-gradient(135deg,rgba(168,85,247,0.06),rgba(99,102,241,0.04));border:1px solid rgba(168,85,247,0.25);border-radius:8px;padding:0.6rem 0.8rem;margin-bottom:0.8rem;">
                    <label style="display:flex;gap:8px;align-items:center;cursor:pointer;font-size:0.88rem;font-weight:700;color:var(--text-main);">
                        <input type="checkbox" id="newProjFounder" style="cursor:pointer;">
                        <span>🌟 Clonar plantilla <strong>Founder bootstrap</strong></span>
                    </label>
                    <div style="font-size:0.74rem;color:var(--text-muted);margin-top:4px;line-height:1.45;">
                        Genera un projecte amb 9 roles · 12 transactions · 5 SOPs · 3 workshops · presentation IA pre-omplerta. Score automàtic ~85/100 al /quality. Pots adaptar tot després.
                    </div>
                </div>

                <!-- MAX-BOOTSTRAP sprint A · clonar 108-cohort 100/100 demo -->
                <div class="dash-form-group" style="background:linear-gradient(135deg,rgba(34,197,94,0.06),rgba(250,204,21,0.04));border:1px solid rgba(34,197,94,0.25);border-radius:8px;padding:0.6rem 0.8rem;margin-bottom:0.8rem;">
                    <label style="display:flex;gap:8px;align-items:center;cursor:pointer;font-size:0.88rem;font-weight:700;color:var(--text-main);">
                        <input type="checkbox" id="newProjMaxBoot" style="cursor:pointer;">
                        <span>🌟🌟 Clonar <strong>MAX bootstrap</strong> · 108 cohort managers · lifecycle 85%+</span>
                    </label>
                    <div style="font-size:0.74rem;color:var(--text-muted);margin-top:4px;line-height:1.45;">
                        Genera projecte amb <strong>108 cohort managers</strong> (1 per skill nuclear), canvas + pitch publicat + tokenomics + 3 ledger entries balanced + 2 invoices (1 paid auto-ledger) + 2 proposals (1 accepted) + 2 market items + workshops + SOPs. 10 fases lifecycle pre-omplertes per a demo o continuous improvement baseline.
                    </div>
                </div>

                <div class="dash-form-group">
                    <label class="dash-form-label">Nombre del proyecto *</label>
                    <input type="text" class="dash-form-input" id="newProjName" placeholder="e.g. IKEA Madrid · Servicios">
                </div>

                <div class="dash-form-group">
                    <label class="dash-form-label">Sector base (opcional)</label>
                    <select class="dash-form-input" id="newProjSector" style="font-family:var(--font-base);">
                        <option value="">— Vacío · sin sector —</option>
                        ${sectorOptions}
                    </select>
                </div>

                <!-- UX-AUDIT-001 sprint B · subtipus dins del sector (es revela al canviar sector) -->
                <div class="dash-form-group" id="newProjSubtypeGroup" style="display:none;">
                    <label class="dash-form-label">Subtipus dins del sector (opcional · enriqueix prompt IA)</label>
                    <select class="dash-form-input" id="newProjSubtype" style="font-family:var(--font-base);">
                        <option value="">— Genèric del sector —</option>
                    </select>
                    <div id="newProjSubtypeHint" style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;"></div>
                </div>

                <!-- UX-AUDIT-001 sprint B · PROJECT_TYPES Matriu (12) -->
                <div class="dash-form-group">
                    <label class="dash-form-label">Tipus de projecte Matriu (opcional · 12 tipologies de cohort 0)</label>
                    <select class="dash-form-input" id="newProjType" style="font-family:var(--font-base);">
                        <option value="">— Sense tipus Matriu —</option>
                        ${PROJECT_TYPES.map(p => `<option value="${p.id}" title="${p.hint}">${p.num} · ${p.label}</option>`).join('')}
                    </select>
                    <div id="newProjTypeHint" style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;"></div>
                </div>

                <div class="dash-form-group">
                    <label class="dash-form-label">Descripción del cliente (opcional · activa IA)</label>
                    <textarea class="dash-form-input" id="newProjDesc" rows="4"
                        placeholder="Cliente, tamaño, geografía, dolores conocidos, sponsor... Si la rellenas, la IA personaliza nombres, descripciones y actor típico de cada rol al contexto real, y puede añadir 1-3 roles emergentes con prefijo client-."
                        style="font-family:inherit;resize:vertical;min-height:90px;"></textarea>
                </div>

                <div id="newProjModeHint" style="font-size:0.78rem;color:var(--accent-indigo);background:rgba(99,102,241,0.08);border-left:3px solid #6366f1;padding:0.5rem 0.7rem;border-radius:4px;margin:0.5rem 0;">
                    📦 <strong>Vacío</strong> · proyecto sin roles · los añades tú a mano en el mapa.
                </div>

                <div class="dash-modal-actions">
                    <button class="dash-modal-cancel" id="newProjCancel">Cancelar</button>
                    <button class="dash-modal-confirm" id="newProjConfirm">Crear &amp; abrir mapa</button>
                </div>

                <div id="newProjStatus" style="display:none;margin-top:0.6rem;color:#aaa;font-size:0.85rem;"></div>
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
        // FOUNDER-001 sprint C · auto-open wizard amb founder pre-check si
        // arribem amb ?wizard=founder (des de /opportunities clone CTA)
        try {
            const params = new URLSearchParams(window.location.search || '');
            if (params.get('wizard') === 'founder') {
                const modal = document.getElementById('dashModalNew');
                const chk   = document.getElementById('newProjFounder');
                if (modal && chk) {
                    chk.checked = true;
                    chk.dispatchEvent(new Event('change'));
                    modal.classList.add('open');
                    document.getElementById('newProjName')?.focus();
                    // Neteja l'URL · evita re-open al recarregar
                    const u = new URL(window.location.href);
                    u.searchParams.delete('wizard');
                    window.history.replaceState({}, '', u.toString());
                }
            }
        } catch (_) {}
    }

    // ── Render projects v2 ───────────────────────────────────────────────────
    // PROJ-QUALITY-001 sprint D · helper hero · pinta checklist 5 passes
    _renderHelper({ identityNode, projects, qualityById } = {}) {
        const slot = document.getElementById('dashHelper');
        const onb  = document.getElementById('dashHelperOnb');
        if (!slot || !onb) return;
        const state = computeOnboardingState({ identityNode, projects, qualityById });
        const comp  = onboardingCompletion(state);
        const next  = nextOnboardingStep(state);
        if (comp.done === comp.total) slot.classList.add('is-complete');
        else                          slot.classList.remove('is-complete');

        let html = `<div class="dash-helper-progress">
            <span>🎯 Onboarding alfa</span>
            <div class="dash-helper-progress-bar"><div class="dash-helper-progress-fill" style="width:${comp.pct}%;"></div></div>
            <span class="dash-helper-progress-pct">${comp.done}/${comp.total}</span>
        </div>`;

        ONBOARDING_STEPS.forEach((step, idx) => {
            const done   = !!state[step.id];
            const isNext = !done && next && next.id === step.id;
            const cls    = 'dash-helper-step' + (done ? ' is-done' : '') + (isNext ? ' is-next' : '');
            // Pas "project" amb cta #new obre el modal en comptes de navegar
            const isNewProject = step.cta.href === '#new';
            const href = isNewProject ? 'javascript:void(0)' : step.cta.href;
            const dataLink = isNewProject ? '' : 'data-link';
            const dataAction = isNewProject ? 'data-action="new-project"' : '';
            html += `<a class="${cls}" href="${href}" ${dataLink} ${dataAction} title="${step.hint}">
                <div class="dash-helper-step-icon">${done ? '✓' : step.icon}</div>
                <div class="dash-helper-step-body">
                    <div class="dash-helper-step-num">Pas ${idx + 1}${isNext ? ' · ARA' : ''}</div>
                    <div class="dash-helper-step-label">${step.label}${done ? ' <span class="dash-helper-step-tick">✓</span>' : ''}</div>
                    <div class="dash-helper-step-hint">${step.hint}</div>
                    <div class="dash-helper-step-cta">${done ? '✓ Completat' : step.cta.label + ' →'}</div>
                </div>
            </a>`;
        });

        html += `<div class="dash-helper-complete-badge">🌟 Onboarding alfa completat · ja pots dur projectes a la xarxa Matriu</div>`;
        onb.innerHTML = html;

        // Bind cta #new per obrir el modal
        const self = this;
        onb.querySelectorAll('[data-action="new-project"]').forEach(el => {
            el.addEventListener('click', () => {
                const m = document.getElementById('dashModalNew');
                if (m) { m.classList.add('open'); document.getElementById('newProjName')?.focus(); }
            });
        });
    }

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
        const projects = visibleProjects(state.projects);

        // PROJ-QUALITY-001 sprint E · Member panel + Matriu strip retirats del top.
        // L'identitat de l'usuari viu a /identity · la Matriu té el seu landing
        // /matriu i el directori /matriu/network. El Dashboard queda focalitzat
        // a "helper + estadístiques + projectes".

        // PROJ-QUALITY-001 sprint B · pre-càrrega batched de SOPs / workshops / market_items
        // perquè computeQualityScore és pur i necessita les llistes pre-carregades.
        let allSops = [], allWorkshops = [], allMarket = [], allIdentities = [];
        try { allSops       = await KB.query({ type: 'sop' });             } catch (_) {}
        try { allWorkshops  = await KB.query({ type: 'workshop' });        } catch (_) {}
        try { allMarket     = await KB.query({ type: 'market_item' });     } catch (_) {}
        try { allIdentities = await KB.query({ type: 'user_identity' });   } catch (_) {}
        const qualityById = {};
        projects.forEach(function(p) {
            qualityById[p.id] = computeQualityScore(p, { sops: allSops, workshops: allWorkshops, marketItems: allMarket });
        });
        this._qualityById = qualityById;  // cache per altres mètodes (filter chips, tooltip)

        // PROJ-QUALITY-001 sprint D · onboarding helper (5 passes)
        const identityNode = (allIdentities || []).find(n => n && (n.content?.isPrimary || n.isPrimary)) || (allIdentities && allIdentities[0]) || null;
        this._renderHelper({ identityNode, projects, qualityById });

        // Stats v2 · roles + tx + qualitat mitja (substitueix Ecosystem health)
        const totalRoles    = projects.reduce(function(acc, p) { return acc + (p.vna_roles || []).length; }, 0);
        const totalTxs      = projects.reduce(function(acc, p) { return acc + (p.vna_transactions || []).length; }, 0);
        const qualityScores = Object.values(qualityById).map(function(q) { return q.total; });
        const avgQuality    = qualityScores.length > 0 ? Math.round(qualityScores.reduce(function(a, b) { return a + b; }, 0) / qualityScores.length) : null;
        const qStatus       = avgQuality === null ? null : (avgQuality >= QUALITY_THRESHOLDS.high ? 'high' : (avgQuality >= QUALITY_THRESHOLDS.medium ? 'medium' : 'low'));
        const qColor        = qStatus ? qualityColor(qStatus) : 'var(--text-muted)';

        document.getElementById('dashStats').innerHTML =
            '<div class="dash-stat"><div class="dash-stat-label">Projects</div><div class="dash-stat-value">' + projects.length + '</div><div class="dash-stat-bar"><div class="dash-stat-bar-fill" style="width:100%;background:var(--accent-indigo);"></div></div></div>' +
            '<div class="dash-stat"><div class="dash-stat-label">Total roles</div><div class="dash-stat-value">' + totalRoles + '</div><div class="dash-stat-bar"><div class="dash-stat-bar-fill" style="width:' + Math.min(totalRoles * 4, 100) + '%;background:var(--accent-blue);"></div></div></div>' +
            '<div class="dash-stat"><div class="dash-stat-label">Transactions</div><div class="dash-stat-value">' + totalTxs + '</div><div class="dash-stat-bar"><div class="dash-stat-bar-fill" style="width:' + Math.min(totalTxs * 2, 100) + '%;background:var(--accent-green);"></div></div></div>' +
            (avgQuality !== null ? '<div class="dash-stat" title="Mitjana ponderada de Landing+ValueMap+Deliverables+SOPs+Workshops"><div class="dash-stat-label">' + qualityIcon(qStatus) + ' Project quality</div><div class="dash-stat-value" style="color:' + qColor + '">' + avgQuality + '</div><div class="dash-stat-bar"><div class="dash-stat-bar-fill" style="width:' + avgQuality + '%;background:' + qColor + ';"></div></div></div>' : '');

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

        // UX-AUDIT-001 sprint C · Phase chips · counts per phase abans del filtre
        const phaseGroups = groupProjectsByPhase(projects, function(p) {
            return {
                sopsCount:   (p.sops || []).length,
                woBacklog:   ((p.workOrders || []).filter(function(w) { return w.status === 'backlog'; })).length,
                woDoing:     ((p.workOrders || []).filter(function(w) { return w.status === 'doing'; })).length,
                woLedgered:  (p.ledger || []).length,
            };
        });
        const phaseCounts = {
            design:  phaseGroups.design.length,
            build:   phaseGroups.build.length,
            operate: phaseGroups.operate.length,
            ledger:  phaseGroups.ledger.length,
        };
        const activeFilter = this._phaseFilter || 'all';
        const chipsHtml = '<div class="dash-phase-bar">'
            + '<button class="dash-phase-chip ' + (activeFilter === 'all' ? 'is-active' : '') + '" data-phase="all">'
            +   '<span>📋 Tots</span><span class="count">' + projects.length + '</span>'
            + '</button>'
            + PHASE_ORDER.map(function(ph) {
                const m = PHASE_META[ph];
                const c = phaseCounts[ph] || 0;
                const cls = (activeFilter === ph ? ' is-active' : '');
                return '<button class="dash-phase-chip' + cls + '" data-phase="' + ph + '" title="' + m.hint + '">'
                    +   '<span>' + m.icon + ' ' + m.label + '</span><span class="count">' + c + '</span>'
                    + '</button>';
            }).join('')
            + '</div>';

        // PROJ-QUALITY-001 sprint B3 · filtre de qualitat (independent del phase filter)
        const qualityFilter = this._qualityFilter || 'all';
        const qCounts = { high: 0, medium: 0, low: 0 };
        projects.forEach(function(p) {
            const st = qualityById[p.id] ? qualityById[p.id].status : 'low';
            if (qCounts[st] !== undefined) qCounts[st]++;
        });
        const qualityChipsHtml = '<div class="dash-phase-bar" style="margin-top:4px;">'
            + '<button class="dash-phase-chip' + (qualityFilter === 'all' ? ' is-active' : '') + '" data-quality="all" title="Mostra tots els projectes">'
            +   '<span>📋 Qualitat · tots</span><span class="count">' + projects.length + '</span>'
            + '</button>'
            + '<button class="dash-phase-chip' + (qualityFilter === 'high' ? ' is-active' : '') + '" data-quality="high" title="Score ≥ 75">'
            +   '<span>🌟 Alta</span><span class="count">' + qCounts.high + '</span>'
            + '</button>'
            + '<button class="dash-phase-chip' + (qualityFilter === 'medium' ? ' is-active' : '') + '" data-quality="medium" title="Score 50-74">'
            +   '<span>⚠ Mitjana</span><span class="count">' + qCounts.medium + '</span>'
            + '</button>'
            + '<button class="dash-phase-chip' + (qualityFilter === 'low' ? ' is-active' : '') + '" data-quality="low" title="Score < 50">'
            +   '<span>❌ Baixa</span><span class="count">' + qCounts.low + '</span>'
            + '</button>'
            + '</div>';

        // Aplica filtres · primer phase · després qualitat
        let filteredProjects = activeFilter === 'all'
            ? projects
            : (phaseGroups[activeFilter] || []);
        if (qualityFilter !== 'all') {
            filteredProjects = filteredProjects.filter(function(p) {
                return qualityById[p.id] && qualityById[p.id].status === qualityFilter;
            });
        }

        // Agrupar por sector (després del filtre per phase)
        const groups = {};
        filteredProjects.forEach(function(p) {
            const key = p.sector_id || 'general';
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });

        const sectors = await KnowledgeLoader.listSectors();
        const sectorName = function(id) {
            const found = sectors.find(function(s) { return s.id === id; });
            return found ? found.name : (id === 'general' ? 'General' : id);
        };

        let html = chipsHtml + qualityChipsHtml;
        var self = this;

        if (filteredProjects.length === 0) {
            html += '<div class="dash-empty-v2" style="margin-top:1rem;">'
                +   '<div class="dash-empty-icon">📭</div>'
                +   '<div class="dash-empty-title">Cap projecte en aquesta fase</div>'
                +   '<div class="dash-empty-sub">Tria una altra fase als chips o crea un projecte nou.</div>'
                + '</div>';
            document.getElementById('dashProjectList').innerHTML = html;
            this._bindPhaseChips();
            return;
        }

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
                // PROJ-QUALITY-001 sprint E · card refactor · score gran + next-action clar
                const q      = qualityById[p.id] || { total: 0, byDim: {}, missing: [], status: 'low' };
                const hColor = qualityColor(q.status);
                const rel    = self._relativeDate(p.updatedAt || p.createdAt);
                const next   = suggestNextDim(q);

                // Mini-radar · 5 dims com a barres verticals (EQ-style)
                let dimBars = '';
                QUALITY_DIMS.forEach(function(d) {
                    const s = q.byDim[d.id] ? q.byDim[d.id].score : 0;
                    const dimSt = s >= QUALITY_THRESHOLDS.high ? 'high' : (s >= QUALITY_THRESHOLDS.medium ? 'medium' : 'low');
                    const dColor = qualityColor(dimSt);
                    dimBars += '<div class="dash-card-qbar" title="' + d.icon + ' ' + d.label + ' · ' + s + '/100">'
                        +   '<div class="dash-card-qbar-fill" style="height:' + Math.max(s, 4) + '%;background:' + dColor + ';"></div>'
                        +   '<div class="dash-card-qbar-lbl">' + d.icon + '</div>'
                        + '</div>';
                });

                const nameStr = p.nombre || p.name || 'Unnamed';
                const purpose = (p.description || p.projectIdea || '').toString().trim();
                const purposeShort = purpose.length > 90 ? purpose.slice(0, 88) + '…' : purpose;

                // Next-action chip · porta directament a la vista que aporta més punts
                const nextChip = next && next.gain > 0
                    ? '<a class="dash-card-next" href="/quality?project=' + p.id + '" data-link title="Següent acció · veure detall de qualitat">'
                        + '<span class="dash-card-next-icon">' + next.dim.icon + '</span>'
                        + '<span class="dash-card-next-lbl">' + next.dim.label + '</span>'
                        + '<span class="dash-card-next-gain">+' + next.gain + '</span>'
                      + '</a>'
                    : '<a class="dash-card-next dash-card-next-done" href="/quality?project=' + p.id + '" data-link>'
                        + '<span>🌟 Excel·lent</span>'
                      + '</a>';

                html += '<div class="dash-card' + (isDemo ? ' dash-card-demo' : '') + '">' +
                    '<a class="dash-card-link" href="/project/' + p.id + '" data-link title="Obrir el hub del projecte">' +
                        '<div class="dash-card-top">' +
                            '<div class="dash-card-name">' + nameStr + '</div>' +
                            '<div class="dash-card-score" style="background:' + hColor + '18;color:' + hColor + ';" title="Qualitat global · click per detall">' +
                                qualityIcon(q.status) + ' ' + q.total +
                            '</div>' +
                        '</div>' +
                        (purposeShort ? '<div class="dash-card-purpose">' + purposeShort + '</div>' : '<div class="dash-card-purpose dash-card-purpose-empty">— sense descripció —</div>') +
                        '<div class="dash-card-qradar">' + dimBars + '</div>' +
                        '<div class="dash-card-health-bar"><div class="dash-card-health-fill" style="width:' + q.total + '%;background:' + hColor + ';"></div></div>' +
                        '<div class="dash-card-meta">' +
                            '<span>👥 ' + roles + ' roles</span>' +
                            '<span>🔁 ' + txs + ' tx</span>' +
                            (isDemo ? '<span class="dash-card-tag-demo">DEMO</span>' : '') +
                            (sectorId !== 'general' ? '<span class="dash-card-tag-sector">' + sectorId + '</span>' : '') +
                            '<span class="dash-card-date-rel" style="margin-left:auto;">' + rel + '</span>' +
                        '</div>' +
                    '</a>' +
                    '<div class="dash-card-footer-row">' +
                        nextChip +
                        // LIFECYCLE-DASHBOARD sprint A · CTA al dashboard /lifecycle?project=X
                        '<a class="dash-card-action-btn" href="/lifecycle?project=' + p.id + '" data-link title="Lifecycle · 10 fases del projecte · canvas/kanban/comptabilitat/etc">🌀</a>' +
                        '<button class="dash-card-action-btn" data-archive="' + p.id + '" title="Archivar">📦</button>' +
                    '</div>' +
                '</div>';
            });

            // Tarjeta "Nuevo proyecto" al final de cada grupo
            html += '<div class="dash-card-new" id="dashNewInGroup">' +
                '<div class="dash-card-new-icon">＋</div>' +
                '<div class="dash-card-new-label">New project</div>' +
                '</div>';

            html += '</div></div>';
        });

        document.getElementById('dashProjectList').innerHTML = html;

        // UX-AUDIT-001 sprint C · phase chips bind
        this._bindPhaseChips();

        // ── Sección de archivados ────────────────────────────────────────────
        var archived = archivedProjects(state.projects);
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

    // ── UX-AUDIT-001 sprint C · Phase chips binding ───────────────────────────
    _bindPhaseChips() {
        const self = this;
        document.querySelectorAll('.dash-phase-chip').forEach(function(chip) {
            chip.addEventListener('click', function() {
                const phase   = chip.getAttribute('data-phase');
                const quality = chip.getAttribute('data-quality');
                if (phase)   self._phaseFilter   = phase;
                if (quality) self._qualityFilter = quality;
                // Re-render in-place · zero navigateTo
                self._renderProjects();
            });
        });
    }

    // ── UX-AUDIT-001 sprint C · Panell del membre ─────────────────────────────
    async _renderMemberPanel(projects) {
        const wrap = document.getElementById('dashMemberPanel');
        if (!wrap) return;

        let kbNodes = [];
        try { kbNodes = await KB.getAllNodes(); } catch (_) { kbNodes = []; }

        const member = resolveCurrentMember(kbNodes, '@alvaro');
        const id     = summarizeMemberIdentity(member);
        const impact = computeMemberImpact({ projects, kbNodes });
        const avail  = AVAILABILITY_META[id.availability] || AVAILABILITY_META.normal;

        this._memberCache = { member, id, sectorsList: null };

        const initials = (id.displayName || 'OP').split(/\s+/).map(function(w){return w[0];}).join('').slice(0, 2).toUpperCase();

        const editMode = !!this._memberEditOpen;
        const editForm = editMode ? await this._renderMemberEditForm(id) : '';

        wrap.innerHTML = `
            <div class="dash-member-panel">
                <div class="dash-member-head">
                    <div class="dash-member-avatar">${initials}</div>
                    <div class="dash-member-info">
                        <div class="dash-member-name">${this._escapeHtml(id.displayName)}</div>
                        <div class="dash-member-handle">${id.handle ? this._escapeHtml(id.handle) : '@operador-anonim'}</div>
                        <div class="dash-member-meta">
                            <span title="${avail.label}">${avail.icon} ${avail.label}</span>
                            ${id.guardianOf ? `<span>⚡ ${this._escapeHtml(id.guardianOf)}</span>` : ''}
                            ${id.cohortNumber !== null ? `<span>🎓 Cohort ${id.cohortNumber}</span>` : ''}
                            <span>🧠 ${id.skillsCount} skill${id.skillsCount !== 1 ? 's' : ''}</span>
                            <span>🌐 ${id.sectorsCount} sector${id.sectorsCount !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>
                <div class="dash-member-stats">
                    <div class="dash-member-stat">
                        <div class="dash-member-stat-label">Projectes</div>
                        <div class="dash-member-stat-value">${impact.activeProjects}</div>
                    </div>
                    <div class="dash-member-stat">
                        <div class="dash-member-stat-label">Slices</div>
                        <div class="dash-member-stat-value">${impact.totalSlices.toLocaleString('ca-ES')}</div>
                    </div>
                    <div class="dash-member-stat">
                        <div class="dash-member-stat-label">Contribucions</div>
                        <div class="dash-member-stat-value">${impact.totalContributions}</div>
                    </div>
                </div>
                <div class="dash-member-actions">
                    <button class="dash-member-action" id="dashMemberEditBtn">${editMode ? '✕ Tancar editor' : '✏ Editar perfil'}</button>
                    <a href="/matriu/network" data-link class="dash-member-action">🌐 Xarxa Matriu</a>
                    <a href="/skills" data-link class="dash-member-action">🧠 Catàleg skills</a>
                    <a href="/identity" data-link class="dash-member-action">👤 Identitat avançada</a>
                </div>
                ${editForm}
            </div>
        `;

        this._bindMemberPanel();
    }

    // ── UX-AUDIT-001 sprint C2 · editor inline ───────────────────────────────
    async _renderMemberEditForm(id) {
        // Carrega sectors A-S del KnowledgeLoader (cached)
        let sectors = [];
        try { sectors = await KnowledgeLoader.listSectors(); } catch (_) { sectors = []; }
        this._memberCache = this._memberCache || {};
        this._memberCache.sectorsList = sectors;

        const declaredSkills  = id.skills || [];
        const declaredSectors = id.sectors || [];
        const av = id.availability || 'normal';

        // Per esquemes existents amb skill IDs, busquem el label per al chip
        const skillLabel = (sid) => {
            const s = SKILL_TAXONOMY.find(x => x.id === sid);
            return s ? s.label : sid;
        };
        const sectorLabel = (sid) => {
            const s = sectors.find(x => x.id === sid);
            return s ? `${sid} · ${s.name}` : sid;
        };

        // Skills disponibles per afegir (no declarades encara)
        const availableSkills = SKILL_TAXONOMY.filter(s => !declaredSkills.includes(s.id));
        const availableSectors = sectors.filter(s => !declaredSectors.includes(s.id));

        const skillChips = declaredSkills.map(sid =>
            `<span class="dash-member-chip">🧠 ${this._escapeHtml(skillLabel(sid))}<button type="button" data-remove-skill="${this._escapeHtml(sid)}" title="Treure">✕</button></span>`
        ).join('');
        const sectorChips = declaredSectors.map(sid =>
            `<span class="dash-member-chip dash-member-chip-sector">🌐 ${this._escapeHtml(sectorLabel(sid))}<button type="button" data-remove-sector="${this._escapeHtml(sid)}" title="Treure">✕</button></span>`
        ).join('');

        return `
            <div class="dash-member-edit" id="dashMemberEdit">
                <div class="dash-member-edit-row">
                    <div class="dash-member-edit-label">🧠 Skills declarades · ${declaredSkills.length}</div>
                    <div class="dash-member-chips" id="dashMemberSkillChips">
                        ${skillChips || '<span style="color:var(--text-muted);font-size:var(--text-xs);font-style:italic;">Cap skill declarada · afegeix-ne abaix</span>'}
                    </div>
                    <select id="dashMemberSkillAdd">
                        <option value="">+ Afegir skill...</option>
                        ${availableSkills.map(s => `<option value="${this._escapeHtml(s.id)}">${this._escapeHtml(s.label)} · ${this._escapeHtml(s.domain)}</option>`).join('')}
                    </select>
                </div>
                <div class="dash-member-edit-row">
                    <div class="dash-member-edit-label">🌐 Sectors d'experiència · ${declaredSectors.length}</div>
                    <div class="dash-member-chips" id="dashMemberSectorChips">
                        ${sectorChips || '<span style="color:var(--text-muted);font-size:var(--text-xs);font-style:italic;">Cap sector declarat · afegeix-ne abaix</span>'}
                    </div>
                    <select id="dashMemberSectorAdd">
                        <option value="">+ Afegir sector...</option>
                        ${availableSectors.map(s => `<option value="${this._escapeHtml(s.id)}">${this._escapeHtml(s.id)} · ${this._escapeHtml(s.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="dash-member-edit-row">
                    <div class="dash-member-edit-label">📅 Disponibilitat</div>
                    <div class="dash-member-avail-group" id="dashMemberAvail">
                        ${['high','normal','low'].map(k => {
                            const m = AVAILABILITY_META[k];
                            return `<button type="button" class="dash-member-avail-btn ${k === av ? 'is-active' : ''}" data-avail="${k}">${m.icon} ${this._escapeHtml(m.label)}</button>`;
                        }).join('')}
                    </div>
                </div>
                <div class="dash-member-save-row">
                    <button class="dash-member-save-btn" id="dashMemberSave">💾 Guardar canvis</button>
                    <button class="dash-member-save-cancel" id="dashMemberCancel">✕ Cancel·lar</button>
                    <span class="dash-member-save-status" id="dashMemberStatus"></span>
                </div>
            </div>
        `;
    }

    _bindMemberPanel() {
        const self = this;
        // Toggle edit · només es bind aquí (es replaceja amb el panell sencer)
        const editBtn = document.getElementById('dashMemberEditBtn');
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                self._memberEditOpen = !self._memberEditOpen;
                self._memberDraft = null;
                self._renderProjects();
            });
        }
        // Si està obert el form, bind els controls inner
        if (this._memberEditOpen) this._bindMemberPanelEditOnly();
    }

    _bindMemberPanelEditOnly() {
        const self = this;
        // Init draft des del membre actual (si no hi ha)
        const id = this._memberCache?.id || {};
        if (!this._memberDraft) {
            this._memberDraft = {
                skills:       (id.skills || []).slice(),
                sectors:      (id.sectors || []).slice(),
                availability: id.availability || 'normal',
                displayName:  id.displayName || 'Operador',
                handle:       id.handle || '@alvaro',
            };
        }

        // Add skill
        document.getElementById('dashMemberSkillAdd')?.addEventListener('change', function(e) {
            const v = e.target.value;
            if (v && !self._memberDraft.skills.includes(v)) self._memberDraft.skills.push(v);
            self._memberCache.id.skills = self._memberDraft.skills.slice();
            self._memberCache.id.skillsCount = self._memberDraft.skills.length;
            self._refreshEditOnly();
        });
        // Remove skill
        document.querySelectorAll('[data-remove-skill]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const sid = btn.getAttribute('data-remove-skill');
                self._memberDraft.skills = self._memberDraft.skills.filter(function(x){return x !== sid;});
                self._memberCache.id.skills = self._memberDraft.skills.slice();
                self._memberCache.id.skillsCount = self._memberDraft.skills.length;
                self._refreshEditOnly();
            });
        });
        // Add sector
        document.getElementById('dashMemberSectorAdd')?.addEventListener('change', function(e) {
            const v = e.target.value;
            if (v && !self._memberDraft.sectors.includes(v)) self._memberDraft.sectors.push(v);
            self._memberCache.id.sectors = self._memberDraft.sectors.slice();
            self._memberCache.id.sectorsCount = self._memberDraft.sectors.length;
            self._refreshEditOnly();
        });
        // Remove sector
        document.querySelectorAll('[data-remove-sector]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const sid = btn.getAttribute('data-remove-sector');
                self._memberDraft.sectors = self._memberDraft.sectors.filter(function(x){return x !== sid;});
                self._memberCache.id.sectors = self._memberDraft.sectors.slice();
                self._memberCache.id.sectorsCount = self._memberDraft.sectors.length;
                self._refreshEditOnly();
            });
        });
        // Availability
        document.querySelectorAll('[data-avail]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                self._memberDraft.availability = btn.getAttribute('data-avail');
                self._memberCache.id.availability = self._memberDraft.availability;
                self._refreshEditOnly();
            });
        });
        // Save
        document.getElementById('dashMemberSave')?.addEventListener('click', async function() {
            const btn = this;
            const status = document.getElementById('dashMemberStatus');
            btn.disabled = true; btn.textContent = '⏳ Guardant…';
            try {
                const existing = self._memberCache.member;
                let node;
                if (existing) {
                    // Merge in-place · preserva tots els camps no editats
                    node = {
                        ...existing,
                        content: {
                            ...existing.content,
                            skillsDeclared:    self._memberDraft.skills.slice(),
                            sectorsExperience: self._memberDraft.sectors.slice(),
                            availability:      self._memberDraft.availability,
                            updatedAt:         Date.now(),
                        },
                        keywords: Array.from(new Set([
                            'type:matriu-member',
                            'kind:matriu-member',
                            ...(self._memberDraft.skills || []).map(s => 'skill:' + s),
                            ...(self._memberDraft.sectors || []).map(s => 'sector:' + s),
                            'avail:' + self._memberDraft.availability,
                        ])),
                    };
                } else {
                    // Crea de zero
                    node = buildMatriuMember({
                        displayName:       self._memberDraft.displayName,
                        handle:            self._memberDraft.handle,
                        skillsDeclared:    self._memberDraft.skills,
                        sectorsExperience: self._memberDraft.sectors,
                        availability:      self._memberDraft.availability,
                        cohortNumber:      0,
                    });
                }
                await store.dispatch({ type: 'KB_UPSERT', payload: { node } });
                btn.textContent = '✓ Guardat';
                if (status) { status.textContent = '✓ Canvis persistits al KB'; status.style.color = 'var(--accent-green)'; }
                self._memberEditOpen = false;
                self._memberDraft = null;
                setTimeout(function() { self._renderProjects(); }, 600);
            } catch (err) {
                console.error('[sprint C2] save member:', err);
                btn.disabled = false; btn.textContent = '💾 Guardar canvis';
                if (status) { status.textContent = '✗ ' + (err?.message || 'error'); status.style.color = 'var(--accent-red)'; }
            }
        });
        // Cancel
        document.getElementById('dashMemberCancel')?.addEventListener('click', function() {
            self._memberEditOpen = false;
            self._memberDraft = null;
            self._renderProjects();
        });
    }

    // Refresca SOLAMENT el bloc edit (chips + selects + avail) sense
    // re-render del panell sencer · evita race conditions amb el draft.
    async _refreshEditOnly() {
        const editEl = document.getElementById('dashMemberEdit');
        if (!editEl) return;
        const form = await this._renderMemberEditForm(this._memberCache.id);
        // form retorna el wrapper amb id="dashMemberEdit" · reemplaça
        const tmp = document.createElement('div');
        tmp.innerHTML = form;
        const newEdit = tmp.querySelector('#dashMemberEdit');
        if (newEdit) editEl.replaceWith(newEdit);
        // Re-bind només els controls inner del form · NO el editBtn (ja bound)
        this._bindMemberPanelEditOnly();
    }

    _escapeHtml(s) {
        if (s === null || s === undefined) return '';
        return String(s).replace(/[&<>"']/g, function(ch) {
            return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch];
        });
    }

    // ── MAT-002-F · Strip Matriu Cohort 0 ──────────────────────────────────────
    _renderMatriuStrip(projects) {
        const strip = document.getElementById('dashMatriuStrip');
        if (!strip) return;
        const cohort0 = (projects || []).filter(function(p) { return p && p.matriuCohort === 0; });
        if (cohort0.length === 0) { strip.innerHTML = ''; return; }

        const COHORT_TOTAL = 108;
        const seatsTaken = cohort0.length;        // local · cuántas tiene este operador

        // Lookup de bootstrap meta de cada proyecto cohort 0 si está en KB
        // (lazy · no bloqueamos el render si KB no lo tiene)
        const seatCards = cohort0.map(function(p) {
            const typeLabel = p.matriuProjectType || 'Sin tipus';
            const multiplier = p.matriuMultiplier || 1.5;
            const idea = (p.projectIdea || p.description || p.nombre || p.id);
            const ideaShort = String(idea).length > 56 ? String(idea).slice(0, 56) + '…' : String(idea);
            return ''
                + '<a class="dash-matriu-seat" href="/project/' + encodeURIComponent(p.id) + '" data-link>'
                + '<span class="dash-matriu-seat-name">' + (p.nombre || p.name || p.id) + '</span>'
                + '<span class="dash-matriu-seat-meta">' + ideaShort + '</span>'
                + '<span class="dash-matriu-seat-foot">'
                +   '<span class="dash-matriu-multiplier">×' + multiplier + ' fundacional</span>'
                +   (typeLabel !== 'Sin tipus' ? '<span class="dash-matriu-type-pill">' + typeLabel + '</span>' : '')
                + '</span>'
                + '</a>';
        }).join('');

        strip.innerHTML = ''
            + '<div class="dash-matriu-strip">'
            +   '<div class="dash-matriu-head">'
            +     '<div>'
            +       '<h2 class="dash-matriu-title">El teu seient a <strong>Matriu</strong></h2>'
            +       '<div class="dash-matriu-subtitle">Tens ' + seatsTaken + ' projecte' + (seatsTaken !== 1 ? 's' : '') + ' del nucli fundacional. Multiplicador ×1.5 fundacional aplicat. Cada projecte té el seu mapa de valor pre-configurat.</div>'
            +     '</div>'
            +     '<span class="dash-matriu-counter">' + seatsTaken + '/' + COHORT_TOTAL + ' places</span>'
            +   '</div>'
            +   '<div class="dash-matriu-seats">' + seatCards + '</div>'
            +   '<div class="dash-matriu-actions">'
            +     '<a href="/matriu" data-link class="dash-matriu-cta">Tornar a Matriu →</a>'
            +     '<a href="/matriu/network" data-link class="dash-matriu-cta-secondary">🌐 Xarxa de membres</a>'
            +     '<a href="/learn" data-link class="dash-matriu-cta-secondary">Aprendre més ↗</a>'
            +   '</div>'
            + '</div>';
    }

    // ── Topbar ────────────────────────────────────────────────────────────────
    _bindTopbar() {
        const openNewProjectModal = function() {
            document.getElementById('dashModalNew').classList.add('open');
            document.getElementById('newProjName').focus();
        };
        document.getElementById('dashBtnNew')?.addEventListener('click', openNewProjectModal);
        // PROJ-QUALITY-001 sprint D · helper card bind delegat via data-action
        // (es fa a _renderHelper · evita binding orphan si la card no està al DOM)
        // MAT-002-A · botón Cohort 0 Matriu retirado del topbar (UX-AUDIT-001 sprint A2).
        // El método _openMatriuCohortModal sigue disponible y se invoca desde el
        // wizard de New Project + desde la landing /matriu (CTA "Sumar-me a Cohort 0").
        const dashView = this;

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

        // UX-FUSE-001 · el botón "🧬 Clonar sector" se ha fusionado en el
        // wizard "+ Nuevo proyecto" (un solo entry point con 3 caminos).
        // El método _openCloneModal sigue disponible por compat (ej. DevTools).
    }

    // ── H1.10.1 · Modal Clonar sector → cliente con IA ────────────────────────
    async _openCloneModal() {
        const root = document.getElementById('dashCloneRoot');
        if (!root) return;
        const close = () => { root.innerHTML = ''; };
        const sectors = await KnowledgeLoader.listSectors();
        const sectorOptions = sectors.map(s =>
            `<option value="${s.id}">${s.id} · ${s.name} · ${s.readiness}</option>`
        ).join('');

        root.innerHTML = `
            <div class="dash-clone-bg" id="dashCloneBg" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:flex-start;justify-content:center;z-index:1000;padding:2rem 1rem;overflow-y:auto;">
                <div style="background:#0e0e14;border:1px solid #2a2a35;border-radius:10px;padding:1.5rem;width:100%;max-width:620px;color:#e6e6e6;font-family:var(--font-base);">
                    <h3 style="margin:0 0 0.5rem 0;color:#fff;">🧬 Clonar sector → cliente</h3>
                    <p style="color:#aaa;font-size:0.78rem;margin:0 0 1rem 0;">
                        Construye un mapa VNA personalizado para tu cliente partiendo de uno
                        de los 22 sectores CNAE. La IA conserva los IDs base (trazabilidad)
                        y personaliza nombre, descripción y actor típico al contexto real.
                        Puede añadir 1-3 roles emergentes con prefijo <code>client-</code>.
                    </p>

                    <div id="dashCloneStep1">
                        <label style="display:block;color:#aaa;font-size:0.78rem;margin-top:0.7rem;margin-bottom:0.25rem;">Nombre del cliente / proyecto</label>
                        <input id="dashCloneName" type="text" placeholder="Ej. IKEA Madrid · Servicios"
                            style="width:100%;box-sizing:border-box;background:#050507;color:#e6e6e6;border:1px solid #2a2a35;border-radius:5px;padding:0.5rem;font-size:0.85rem;">

                        <label style="display:block;color:#aaa;font-size:0.78rem;margin-top:0.7rem;margin-bottom:0.25rem;">Sector base</label>
                        <select id="dashCloneSector"
                            style="width:100%;box-sizing:border-box;background:#050507;color:#e6e6e6;border:1px solid #2a2a35;border-radius:5px;padding:0.5rem;font-size:0.85rem;">
                            ${sectorOptions}
                        </select>

                        <label style="display:block;color:#aaa;font-size:0.78rem;margin-top:0.7rem;margin-bottom:0.25rem;">Descripción libre del cliente</label>
                        <textarea id="dashCloneDesc" placeholder="Cliente, tamaño, geografía, objetivo, dolores conocidos, sponsor, restricciones..."
                            style="width:100%;box-sizing:border-box;min-height:120px;background:#050507;color:#e6e6e6;border:1px solid #2a2a35;border-radius:5px;padding:0.5rem;font-size:0.85rem;font-family:inherit;"></textarea>

                        <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1.2rem;">
                            <button class="dash-btn" id="dashCloneCancel">Cancelar</button>
                            <button class="dash-btn dash-btn-primary" id="dashCloneGo">🤖 Clonar con IA</button>
                        </div>
                    </div>

                    <div id="dashCloneStep2"></div>
                </div>
            </div>
        `;

        document.getElementById('dashCloneCancel').addEventListener('click', close);
        document.getElementById('dashCloneBg').addEventListener('click', e => { if (e.target.id === 'dashCloneBg') close(); });

        document.getElementById('dashCloneGo').addEventListener('click', async () => {
            const clientName        = document.getElementById('dashCloneName').value.trim();
            const sectorId          = document.getElementById('dashCloneSector').value;
            const clientDescription = document.getElementById('dashCloneDesc').value.trim();
            if (!clientName || !clientDescription) {
                alert('Nombre y descripción del cliente son obligatorios.');
                return;
            }
            await this._executeClone({ sectorId, clientName, clientDescription });
        });
    }

    async _executeClone({ sectorId, clientName, clientDescription, subtypeId, projectType, iaContextHint }) {
        // UX-AUDIT-001 sprint B · si arriba subtype + projectType, els enriquim
        // dins de clientDescription perquè el sectorCloner els incorpori al
        // prompt (zero refactor del cloner). El context-rich descriptor és
        // construit per buildIaContextHint i ja conté tot.
        if (iaContextHint && iaContextHint.trim()) {
            // Enriquim sense duplicar la descripció original (que ja s'ha posat
            // dins del context). Passem context complet com a clientDescription.
            clientDescription = iaContextHint;
        }
        // Persistim els nous camps al projecte un cop el cloner els retorni
        // (al _renderClonePreview > Apply, no aquí · només propaguem).
        this._pendingSubtypeId   = subtypeId   || null;
        this._pendingProjectType = projectType || null;
        // UX-FUSE-001 · si _executeClone se invoca desde el wizard fusionado
        // (sin pasar por _openCloneModal), montamos aquí el overlay de
        // progreso para que el feedback visual funcione igual.
        let step2 = document.getElementById('dashCloneStep2');
        let step1 = document.getElementById('dashCloneStep1');
        if (!step2) {
            const root = document.getElementById('dashCloneRoot');
            if (root) {
                root.innerHTML = `
                    <div class="dash-clone-bg" id="dashCloneBg" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:flex-start;justify-content:center;z-index:1000;padding:2rem 1rem;overflow-y:auto;">
                        <div style="background:#0e0e14;border:1px solid #2a2a35;border-radius:10px;padding:1.5rem;width:100%;max-width:620px;color:#e6e6e6;font-family:var(--font-base);">
                            <h3 style="margin:0 0 0.5rem 0;color:#fff;">🤖 Clonando sector → cliente con IA</h3>
                            <p style="color:#aaa;font-size:0.78rem;margin:0 0 0.6rem 0;">${this._escapeHtml(clientName)} · sector ${this._escapeHtml(sectorId)}</p>
                            <div id="dashCloneStep1" style="display:none;"></div>
                            <div id="dashCloneStep2"></div>
                        </div>
                    </div>`;
                step2 = document.getElementById('dashCloneStep2');
                step1 = document.getElementById('dashCloneStep1');
            }
        }
        if (step1) step1.style.display = 'none';
        if (step2) step2.innerHTML = `
            <p style="color:#aaa;">🤖 Construyendo contexto SOC + sector + descripción cliente…</p>
            <p style="color:#666;font-size:0.78rem;">Llamando al LLM. 10-30 segundos según el sector base.</p>`;

        try {
            const { cloneSectorForClient } = await import('../core/sectorCloner.js?v=' + Date.now());
            const result = await cloneSectorForClient({ sectorId, clientName, clientDescription });
            this._renderClonePreview(result);
        } catch (err) {
            console.error('[H1.10.1] Error clonando:', err);
            if (step2) step2.innerHTML = `
                <p style="color:#ff5252;">No se pudo clonar:</p>
                <pre style="background:#050507;padding:0.6rem;border-radius:5px;color:#aaa;white-space:pre-wrap;font-size:0.78rem;max-height:300px;overflow:auto;">${this._escapeHtml(err.message)}\n\nVerifica tu API key Anthropic en /settings y que netlify dev esté corriendo.</pre>
                <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;">
                    <button class="dash-btn" id="dashCloneRetryCancel">Cerrar</button>
                </div>
            `;
            document.getElementById('dashCloneRetryCancel')?.addEventListener('click', () => {
                document.getElementById('dashCloneRoot').innerHTML = '';
            });
        }
    }

    _renderClonePreview(result) {
        const step2 = document.getElementById('dashCloneStep2');
        if (!step2) return;
        const c = result.cloned;
        const v = result.validation;
        const readinessColor = result.readiness === 'ready' ? '#22c55e'
                              : result.readiness === 'solid' ? '#6366f1'
                              : '#ff9100';

        step2.innerHTML = `
            <div style="background:#050507;border:1px solid #1a1a22;border-radius:6px;padding:0.8rem;font-size:0.82rem;color:#e6e6e6;">
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.7rem;">
                    <span style="background:${readinessColor};color:#fff;padding:2px 10px;border-radius:10px;font-size:0.75rem;font-weight:700;">${result.readiness.toUpperCase()}</span>
                    <span style="color:#aaa;font-size:0.75rem;">${v.roles}r · ${v.txs}tx · ${v.patterns}p · sector base ${result.sectorBase}</span>
                </div>
                <div style="color:#aaa;font-size:0.75rem;margin-bottom:0.5rem;">
                    Tokens: ${(result.tokens.prompt_tokens || 0)} in / ${(result.tokens.completion_tokens || 0)} out · Latencia: ${result.latencyMs} ms
                </div>
                <div style="margin-top:0.5rem;">
                    <strong style="color:#fff;">${this._escapeHtml(c.project_name || c.client_id || 'Sin nombre')}</strong>
                </div>
                ${c.emergent_notes ? `
                    <div style="margin-top:0.6rem;padding:0.5rem;background:rgba(212,168,83,0.08);border-left:2px solid #d4a853;border-radius:3px;color:var(--accent-orange);font-size:0.78rem;">
                        <strong>Emergentes:</strong> ${this._escapeHtml(c.emergent_notes)}
                    </div>
                ` : ''}
                <details style="margin-top:0.7rem;">
                    <summary style="cursor:pointer;color:#aaa;font-size:0.78rem;">Ver mapa completo (JSON)</summary>
                    <pre style="background:#000;padding:0.5rem;border-radius:4px;color:#bbb;font-size:0.7rem;max-height:280px;overflow:auto;margin-top:0.5rem;">${this._escapeHtml(JSON.stringify(c, null, 2))}</pre>
                </details>
            </div>

            ${result.readiness === 'tier 2' ? `
                <p style="color:var(--accent-red);font-size:0.78rem;margin-top:0.6rem;">
                    ⚠ El mapa generado no llega al umbral 'solid'. Puedes guardarlo como
                    <code>draft</code> y enriquecerlo manualmente, o cancelar y reintentar
                    con una descripción más rica del cliente.
                </p>
            ` : ''}

            <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;">
                <button class="dash-btn" id="dashCloneClose2">Cancelar</button>
                <button class="dash-btn dash-btn-primary" id="dashCloneCreate">Crear proyecto cliente</button>
            </div>
        `;

        document.getElementById('dashCloneClose2').addEventListener('click', () => {
            document.getElementById('dashCloneRoot').innerHTML = '';
        });
        document.getElementById('dashCloneCreate').addEventListener('click', async () => {
            await this._persistClonedProject(result);
            document.getElementById('dashCloneRoot').innerHTML = '';
        });
    }

    async _persistClonedProject(result) {
        const c = result.cloned;
        const safeId = (c.client_id || c.project_name || 'cliente')
            .toString().toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
        const projectId = 'proj-' + safeId + '-' + Date.now().toString(36).slice(-5);
        const status    = result.readiness === 'tier 2' ? 'draft' : 'active';

        // 1. Crear proyecto · UX-AUDIT-001 sprint B · adjuntar subtype + projectType
        // si veuen del wizard. Si no n'hi ha, queden null (no breaks res).
        await store.dispatch({
            type: 'CREATE_PROJECT',
            payload: {
                id:               projectId,
                nombre:           c.project_name || c.client_id || 'Cliente clonado',
                sector_id:        c.sector_id || result.sectorBase,
                sectorId:         c.sector_id || result.sectorBase,  // alias per /presentation
                based_on_sector:  c.based_on_sector || result.sectorBase,
                subtypeId:        this._pendingSubtypeId   || null,
                projectType:      this._pendingProjectType || null,
                vna_roles:        Array.isArray(c.roles)        ? c.roles        : [],
                vna_transactions: Array.isArray(c.transactions) ? c.transactions : [],
                patterns:         Array.isArray(c.patterns)     ? c.patterns     : [],
                readinessAtClone: result.readiness,
                cloneStatus:      status,
                createdAt:        Date.now(),
                updatedAt:        Date.now(),
            }
        });
        // Reset pending after consume
        this._pendingSubtypeId   = null;
        this._pendingProjectType = null;

        // 2. Persistir nodo client_vna_model en KB Mind-as-Graph
        // UX-002 · auto-tagging taxonómico del proyecto + agregado de tags
        // por cada rol VNA del cliente clonado, para que `KB.query({keyword:
        // 'role:atencion-cliente'})` devuelva el client_vna_model que lo contiene.
        const projectShape = {
            id:               projectId,
            sector_id:        c.sector_id || result.sectorBase,
            based_on_sector:  c.based_on_sector || result.sectorBase,
            cnae:             c.cnae || null,
        };
        const tagsProject = taxonomicTagsForProject(projectShape);
        const tagsRoles = (c.roles || []).flatMap(r => taxonomicTagsForRole(r, projectShape));
        // UX-002 fase 2 · folksonómicos del LLM: por proyecto + tags libres por rol
        const folksonomyProject = Array.isArray(c.folksonomy) ? c.folksonomy : [];
        const folksonomyRoles   = (c.roles || []).flatMap(r => Array.isArray(r.tags) ? r.tags : []);
        const tagsAll = mergeTags(
            [buildTag('kind', 'client-vna-model'), ...tagsProject, ...tagsRoles],
            [...folksonomyProject, ...folksonomyRoles]
        );

        await store.dispatch({
            type: 'KB_UPSERT',
            payload: { node: {
                id:        'client-vna-' + safeId + '-' + Date.now().toString(36),
                type:      'client_vna_model',
                projectId,
                content: {
                    sectorBase:    c.based_on_sector || result.sectorBase,
                    clientId:      c.client_id || safeId,
                    clientName:    c.project_name || c.client_id,
                    roles:         c.roles || [],
                    transactions:  c.transactions || [],
                    patterns:      c.patterns || [],
                    emergentNotes: c.emergent_notes || '',
                    version:       c.version || 'v1.0',
                    readiness:     result.readiness,
                    sources:       result.sources,
                    tokens:        result.tokens,
                    latencyMs:     result.latencyMs,
                    generatedAt:   Date.now(),
                    tags:          tagsAll,
                },
                keywords: Array.from(new Set(['client_vna_model', c.based_on_sector || result.sectorBase, safeId, ...tagsAll])),
            }}
        });

        // 3. Navegar al ValueMap del nuevo proyecto
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('/map?project=' + projectId);
        } else {
            location.reload();
        }
    }

    _escapeHtml(str) {
        return String(str ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }

    // ── Modal nuevo proyecto ──────────────────────────────────────────────────
    _bindModal() {
        const dashView = this;
        document.getElementById('newProjCancel')?.addEventListener('click', function() {
            document.getElementById('dashModalNew').classList.remove('open');
        });

        // UX-FUSE-001 · hint dinámico que explica el camino que va a tomar
        const refreshModeHint = () => {
            const sector = document.getElementById('newProjSector')?.value || '';
            const desc   = (document.getElementById('newProjDesc')?.value || '').trim();
            const founder = !!document.getElementById('newProjFounder')?.checked;
            const maxBoot = !!document.getElementById('newProjMaxBoot')?.checked;
            const hint   = document.getElementById('newProjModeHint');
            const btn    = document.getElementById('newProjConfirm');
            if (!hint) return;
            // MAX-BOOTSTRAP · prioritat màxima
            if (maxBoot) {
                hint.style.background = 'rgba(34,197,94,0.12)';
                hint.style.borderLeftColor = '#22c55e';
                hint.style.color = '#86efac';
                hint.innerHTML = '🌟🌟 <strong>MAX bootstrap</strong> · 108 cohort managers · canvas + pitch + tokenomics + 3 ledger + 2 invoices (1 paid) + 2 proposals (1 accepted) + 2 market + workshops + SOPs. Lifecycle ≥85% al instant. Ideal per a demo o baseline d\'improvement loop.';
                if (btn) btn.textContent = '🌟🌟 Clonar MAX';
                return;
            }
            // FOUNDER-001 sprint B · si checkbox actiu, salta tota la resta
            if (founder) {
                hint.style.background = 'rgba(168,85,247,0.10)';
                hint.style.borderLeftColor = '#a855f7';
                hint.style.color = '#d8b4fe';
                hint.innerHTML = '🌟 <strong>Founder bootstrap</strong> · clona el manifest SOS · 9 roles + 12 transactions + 5 SOPs + 3 workshops + presentation IA. Sector i descripció seran ignorats. Pots adaptar tot després.';
                if (btn) btn.textContent = '🌟 Clonar founder';
                return;
            }
            if (btn) btn.textContent = 'Crear & abrir mapa';
            if (!sector && !desc) {
                hint.style.background = 'rgba(99,102,241,0.08)';
                hint.style.borderLeftColor = '#6366f1';
                hint.style.color = '#a5b4fc';
                hint.innerHTML = '📦 <strong>Vacío</strong> · proyecto sin roles · los añades tú a mano en el mapa.';
            } else if (sector && !desc) {
                hint.style.background = 'rgba(34,197,94,0.08)';
                hint.style.borderLeftColor = '#22c55e';
                hint.style.color = '#86efac';
                hint.innerHTML = '🌱 <strong>Plantilla del sector</strong> · clona los roles y transacciones del sector base sin gastar tokens IA. Rápido. Editable después.';
            } else if (sector && desc) {
                hint.style.background = 'rgba(168,85,247,0.08)';
                hint.style.borderLeftColor = '#a855f7';
                hint.style.color = '#d8b4fe';
                hint.innerHTML = '🤖 <strong>Cliente personalizado con IA</strong> · la IA personaliza nombres + descripciones del sector al cliente real, añade roles emergentes y emite folksonomy. 10-30s.';
            } else {
                // sector vacío + descripción → tratado como vacío con descripción guardada
                hint.style.background = 'rgba(250,204,21,0.08)';
                hint.style.borderLeftColor = '#facc15';
                hint.style.color = '#facc15';
                hint.innerHTML = '⚠ Para activar la IA necesitas seleccionar un sector base. Sin sector, la descripción se guarda como nota.';
            }
        };
        // UX-AUDIT-001 sprint B · revelar subtipus en seleccionar sector
        const refreshSubtypes = () => {
            const sectorId = document.getElementById('newProjSector')?.value || '';
            const group    = document.getElementById('newProjSubtypeGroup');
            const sel      = document.getElementById('newProjSubtype');
            const hint     = document.getElementById('newProjSubtypeHint');
            if (!group || !sel || !hint) return;
            const subs = sectorId ? getSubtypesForSector(sectorId) : [];
            if (subs.length === 0) {
                group.style.display = 'none';
                sel.innerHTML = '<option value="">— Genèric del sector —</option>';
                hint.textContent = '';
                return;
            }
            group.style.display = '';
            sel.innerHTML = '<option value="">— Genèric del sector —</option>' +
                subs.map(s => `<option value="${s.id}" title="${s.hint}">${s.label}</option>`).join('');
            hint.textContent = '';
        };
        const refreshSubtypeHint = () => {
            const sectorId = document.getElementById('newProjSector')?.value || '';
            const subId    = document.getElementById('newProjSubtype')?.value || '';
            const hint     = document.getElementById('newProjSubtypeHint');
            if (!hint) return;
            const subs = getSubtypesForSector(sectorId);
            const sub  = subs.find(s => s.id === subId);
            hint.textContent = sub ? sub.hint : '';
        };
        const refreshTypeHint = () => {
            const id   = document.getElementById('newProjType')?.value || '';
            const hint = document.getElementById('newProjTypeHint');
            if (!hint) return;
            const t = id ? PROJECT_TYPES.find(p => p.id === id) : null;
            hint.textContent = t ? t.hint : '';
        };
        document.getElementById('newProjSector')?.addEventListener('change', () => { refreshSubtypes(); refreshModeHint(); });
        document.getElementById('newProjSubtype')?.addEventListener('change', () => { refreshSubtypeHint(); refreshModeHint(); });
        document.getElementById('newProjType')?.addEventListener('change',   refreshTypeHint);
        document.getElementById('newProjDesc')?.addEventListener('input',  refreshModeHint);
        // FOUNDER-001 sprint B · toggle founder bootstrap
        document.getElementById('newProjFounder')?.addEventListener('change', refreshModeHint);
        // MAX-BOOTSTRAP sprint A · toggle MAX (108 cohort)
        document.getElementById('newProjMaxBoot')?.addEventListener('change', refreshModeHint);

        document.getElementById('newProjConfirm')?.addEventListener('click', async function() {
            const btn  = this;
            const name        = document.getElementById('newProjName').value.trim();
            const sectorId    = document.getElementById('newProjSector').value || null;
            const subtypeId   = document.getElementById('newProjSubtype')?.value || null;
            const projectType = document.getElementById('newProjType')?.value || null;
            const description = (document.getElementById('newProjDesc').value || '').trim();
            const founderMode = !!document.getElementById('newProjFounder')?.checked;
            const maxBootMode = !!document.getElementById('newProjMaxBoot')?.checked;
            const status      = document.getElementById('newProjStatus');
            if (!name) { document.getElementById('newProjName').focus(); return; }

            // MAX-BOOTSTRAP sprint A · 108-cohort 100/100 demo · prioritat màxima
            if (maxBootMode) {
                btn.disabled = true; btn.textContent = '⏳ Clonant MAX (108)…';
                status.style.display = 'block';
                status.style.color = '#22c55e';
                status.textContent = '🌟🌟 Generant 108 cohort managers + lifecycle complet…';
                try {
                    let creatorHandle = FOUNDER_PROJECT_DEFAULTS.creatorHandle;
                    try {
                        const members = await KB.query({ type: 'matriu_member' });
                        const primary = (members || []).find(m => m && (m.content?.isPrimary || m.isPrimary));
                        if (primary && primary.content?.handle) creatorHandle = primary.content.handle;
                    } catch (_) {}
                    const { buildMaxQualityProject } = await import('../core/maxProjectBootstrap.js');
                    const result = buildMaxQualityProject({ creatorHandle, projectName: name });
                    result.project.nombre = name;
                    result.project.name = name;
                    await store.dispatch({ type: 'CREATE_PROJECT', payload: result.project });
                    // MAX-BOOTSTRAP-FIX · KB.upsert(project) també · les views noves
                    // (canvas · lifecycle · accounting · etc) usen KB.getNode(projectId)
                    // i sense això retornen 'Projecte no trobat'.
                    await KB.upsert(result.project);
                    // Persisteix tots els nodes auxiliars al KB
                    for (const r of result.roles)         await KB.upsert(r);
                    for (const s of result.sops)          await KB.upsert(s);
                    for (const w of result.workshops)     await KB.upsert(w);
                    for (const e of result.ledgerEntries) await KB.upsert(e);
                    for (const i of result.invoices)      await KB.upsert(i);
                    for (const p of result.proposals)     await KB.upsert(p);
                    for (const m of result.marketItems)   await KB.upsert(m);
                    await KB.upsert(result.pitch);
                    await KB.upsert(result.tokenomics);
                    status.style.color = '#22c55e';
                    status.textContent = '✓ MAX clonat · ' + result.stats.cohortManagers + ' cohort managers · ' +
                        result.stats.skillsCovered + ' skills · ' + result.stats.sopsCount + ' SOPs · ' +
                        result.stats.invoicesCount + ' invoices · ' + result.stats.proposalsCount + ' proposals · lifecycle ≥85%';
                    document.getElementById('dashModalNew').classList.remove('open');
                    btn.disabled = false; btn.textContent = 'Crear & abrir mapa';
                    window.navigateTo('/lifecycle?project=' + result.project.id);
                    return;
                } catch (err) {
                    console.error('[MAX-BOOTSTRAP] failed', err);
                    status.style.color = '#ff5252';
                    status.textContent = '✗ Error · ' + (err?.message || 'unknown');
                    btn.disabled = false; btn.textContent = 'Crear & abrir mapa';
                    return;
                }
            }

            // FOUNDER-001 sprint B · clonar founder bootstrap · prioritari · usa
            // el handle de l'usuari actual (matriu_member resolts) o '@alvaro' fallback
            if (founderMode) {
                btn.disabled = true; btn.textContent = '⏳ Clonant founder…';
                status.style.display = 'block';
                status.style.color = 'var(--accent-indigo)';
                status.textContent = '🌟 Generant founder template…';
                try {
                    let creatorHandle = FOUNDER_PROJECT_DEFAULTS.creatorHandle;
                    try {
                        const members = await KB.query({ type: 'matriu_member' });
                        const primary = (members || []).find(m => m && (m.content?.isPrimary || m.isPrimary));
                        if (primary && primary.content?.handle) creatorHandle = primary.content.handle;
                    } catch (_) {}
                    const { project, sops, workshops, stats } = buildFounderProject({ creatorHandle });
                    // El nom escrit per l'usuari prevaleix sobre el default
                    project.nombre = name;
                    project.name   = name;
                    await store.dispatch({ type: 'CREATE_PROJECT', payload: project });
                    // MAX-BOOTSTRAP-FIX · KB.upsert(project) per coherència amb views noves
                    await KB.upsert(project);
                    for (const s of sops)      await KB.upsert(s);
                    for (const w of workshops) await KB.upsert(w);
                    status.style.color = 'var(--accent-green)';
                    status.textContent = '✓ Founder clonat · ' + stats.roles + ' roles · ' + stats.transactions + ' tx · ' + stats.sops + ' SOPs · ' + stats.workshops + ' workshops';
                    document.getElementById('dashModalNew').classList.remove('open');
                    btn.disabled = false; btn.textContent = 'Crear & abrir mapa';
                    window.navigateTo('/project/' + project.id);
                    return;
                } catch (err) {
                    console.error('[FOUNDER-001] clone failed', err);
                    status.style.color = '#ff5252';
                    status.textContent = '✗ ' + (err?.message || 'error inesperat');
                    btn.disabled = false; btn.textContent = 'Crear & abrir mapa';
                    return;
                }
            }

            // UX-AUDIT-001 sprint B · construir hint context-rich per a la IA
            // (només s'usa al camí IA · els altres camins el guarden a project)
            const iaContextHint = buildIaContextHint({
                sectorId, subtypeId, projectType, clientDescription: description,
            });

            // Camino 3: sector + descripción → IA (delegado a flujo existente · ara amb subtype + projectType)
            if (sectorId && description) {
                document.getElementById('dashModalNew').classList.remove('open');
                await dashView._executeClone({
                    sectorId, clientName: name, clientDescription: description,
                    subtypeId, projectType, iaContextHint,
                });
                return;
            }

            btn.disabled = true; btn.textContent = '⏳ Creando…';
            status.style.display = 'block'; status.textContent = '';

            try {
                let vnaRoles = [];
                let vnaTransactions = [];
                let patterns = [];

                // Camino 2: sector + sin descripción → clonar plantilla local sin IA
                if (sectorId && !description) {
                    status.textContent = '🌱 Cargando plantilla del sector ' + sectorId + '…';
                    const seed = await KnowledgeLoader.getSectorSeed(sectorId);
                    if (seed) {
                        vnaRoles        = Array.isArray(seed.roles)        ? JSON.parse(JSON.stringify(seed.roles))        : [];
                        vnaTransactions = Array.isArray(seed.transactions) ? JSON.parse(JSON.stringify(seed.transactions)) : [];
                        patterns        = Array.isArray(seed.patterns)     ? JSON.parse(JSON.stringify(seed.patterns))     : [];
                    }
                }

                const projectId = uid();
                await store.dispatch({
                    type:    'CREATE_PROJECT',
                    payload: {
                        id:               projectId,
                        nombre:           name,
                        sector_id:        sectorId,
                        sectorId:         sectorId,         // alias per compat amb /presentation
                        based_on_sector:  sectorId,
                        // UX-AUDIT-001 sprint B · nous camps Matriu
                        subtypeId:        subtypeId,
                        projectType:      projectType,
                        ia_context_hint:  iaContextHint || null,
                        vna_roles:        vnaRoles,
                        vna_transactions: vnaTransactions,
                        patterns,
                        cloneStatus:      sectorId ? 'active' : 'draft',
                        createdAt:        Date.now(),
                        updatedAt:        Date.now(),
                    }
                });

                document.getElementById('dashModalNew').classList.remove('open');
                btn.disabled = false; btn.textContent = 'Crear & abrir mapa';
                status.style.display = 'none';
                const url = '/map?project=' + projectId + (sectorId ? '&sector=' + sectorId : '');
                window.navigateTo(url);
            } catch (err) {
                console.error('[UX-FUSE-001] Error creando proyecto:', err);
                status.textContent = '✗ ' + err.message;
                status.style.color = '#ff5252';
                btn.disabled = false; btn.textContent = 'Crear & abrir mapa';
            }
        });

        // Inicializa el hint correctamente al primer render
        refreshModeHint();

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') document.getElementById('dashModalNew')?.classList.remove('open');
        });
    }

    // ── Knowledge Base panel ──────────────────────────────────────────────────
    async _loadKBSectors() {
        const sectors = await KnowledgeLoader.listSectors();
        const body    = document.getElementById('dashKBBody');
        if (!body) return;

        // H1.8 · readiness calculado dinámicamente por KnowledgeLoader
        // (≥10 roles, ≥14 tx, ≥4 patterns, bilingüe → 'ready';
        //  ≥6/≥10/≥2 → 'solid'; resto → 'tier 2')
        const READINESS_STYLE = {
            'ready':  'rgba(0,230,118,0.12);color:var(--accent-green)',
            'solid':  'rgba(99,102,241,0.12);color:var(--accent-indigo)',
            'tier 2': 'rgba(255,145,0,0.10);color:var(--accent-orange)',
        };

        let html = '<div style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono);margin-bottom:12px;">Click a sector to preview its roles · readiness calculado por contenido</div>';
        sectors.forEach(function(s) {
            const r = s.readiness || 'tier 2';
            const meta = (s.roles || 0) + 'r · ' + (s.transactions || 0) + 'tx · ' + (s.patterns || 0) + 'p';
            html += '<div class="dash-kb-sector-item" data-sector="' + s.id + '">' +
                '<div class="dash-kb-sector-name">' + s.id + ' · ' + s.name +
                    ' <span style="color:var(--text-muted);font-size:9px;font-family:var(--font-mono);">(' + meta + ')</span></div>' +
                '<span class="dash-kb-sector-badge" style="background:' + READINESS_STYLE[r] + ';">' + r + '</span>' +
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

    // ── MAT-002-A · plantilla Matriu Cohort 0 ──────────────────────────────
    async _openMatriuCohortModal() {
        // Lazy import del builder · sólo se carga al pulsar el botón
        const { buildMatriuCohortProject, MATRIU_COHORT_0, MATRIU_PERKS } =
            await import('../core/matriuTemplate.js?v=' + Date.now());

        let root = document.getElementById('dashMatriuRoot');
        if (!root) {
            root = document.createElement('div');
            root.id = 'dashMatriuRoot';
            document.body.appendChild(root);
        }
        const close = () => { root.innerHTML = ''; };

        const perksHtml = MATRIU_PERKS.map((p, i) => `
            <div style="display:flex;gap:0.5rem;align-items:center;padding:5px 0;font-size:0.8rem;color:#1a1f1a;">
                <span style="color:#22c55e;font-weight:700;">${p.icon}</span>
                <span><strong>${p.label}</strong> · <span style="color:#5a5a5a;">${p.description}</span></span>
                <span style="margin-left:auto;color:#888;font-family:monospace;font-size:0.7rem;">${String(i + 1).padStart(2, '0')}</span>
            </div>
        `).join('');

        root.innerHTML = `
            <div style="position:fixed;inset:0;background:rgba(0,0,0,0.78);display:flex;align-items:flex-start;justify-content:center;z-index:1000;padding:2rem 1rem;overflow-y:auto;font-family:Georgia,'Instrument Serif',serif;" id="dashMatriuBg">
                <div style="background:#f1ebde;border-radius:14px;padding:1.8rem;width:100%;max-width:680px;color:#1a1f1a;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                    <div style="font-family:Georgia,'Instrument Serif',serif;font-style:italic;font-size:0.85rem;color:#5a5a5a;text-transform:uppercase;letter-spacing:0.1em;">cohort 0 · 24/100 places</div>
                    <h2 style="margin:0.3rem 0 0.6rem 0;color:#1a1f1a;font-family:Georgia,'Instrument Serif',serif;font-size:1.7rem;font-style:italic;font-weight:400;">Sigues part del nucli fundacional</h2>
                    <p style="color:#3a3a3a;font-size:0.92rem;line-height:1.5;margin:0 0 1rem 0;">
                        Aquesta plantilla preconfigurada genera al teu KB un projecte complet alineat amb el model Matriu:
                        1 SOC <code>matriu-tokenomic</code> amb les 4 regles Fair Fractal, ${MATRIU_PERKS.length} SOPs (un per cada perk fundacional)
                        i un wallet inicial amb <strong>${MATRIU_COHORT_0.initialCredits} crèdits</strong> de plataforma.
                    </p>

                    <div style="background:rgba(26,31,26,0.04);border-left:3px solid #1a1f1a;border-radius:6px;padding:0.7rem 1rem;margin-bottom:1.2rem;">
                        ${perksHtml}
                    </div>

                    <label style="display:block;color:#5a5a5a;font-size:0.78rem;margin-top:0.7rem;margin-bottom:0.25rem;text-transform:uppercase;letter-spacing:0.05em;font-family:monospace;">El teu nom *</label>
                    <input id="matName" type="text" placeholder="ex. Alvaro Solache"
                        style="width:100%;box-sizing:border-box;background:#fff;color:#1a1f1a;border:1px solid #d4cdb8;border-radius:6px;padding:0.6rem;font-size:0.95rem;font-family:inherit;">

                    <label style="display:block;color:#5a5a5a;font-size:0.78rem;margin-top:0.7rem;margin-bottom:0.25rem;text-transform:uppercase;letter-spacing:0.05em;font-family:monospace;">Handle (opcional)</label>
                    <input id="matHandle" type="text" placeholder="@alvaro"
                        style="width:100%;box-sizing:border-box;background:#fff;color:#1a1f1a;border:1px solid #d4cdb8;border-radius:6px;padding:0.6rem;font-size:0.95rem;font-family:inherit;">

                    <label style="display:block;color:#5a5a5a;font-size:0.78rem;margin-top:0.7rem;margin-bottom:0.25rem;text-transform:uppercase;letter-spacing:0.05em;font-family:monospace;">La teva idea de projecte *</label>
                    <textarea id="matIdea" placeholder="ex. Hortet de la Vall · cooperativa de productores ecològiques al Vallès"
                        style="width:100%;box-sizing:border-box;background:#fff;color:#1a1f1a;border:1px solid #d4cdb8;border-radius:6px;padding:0.6rem;font-size:0.92rem;font-family:inherit;min-height:80px;resize:vertical;"></textarea>

                    <div id="matErr" style="color:#c2392f;font-size:0.78rem;margin-top:0.6rem;display:none;"></div>

                    <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1.2rem;flex-wrap:wrap;">
                        <button id="matCancel" style="background:transparent;border:1px solid #d4cdb8;color:#5a5a5a;padding:0.6rem 1rem;border-radius:6px;cursor:pointer;font-family:inherit;font-size:0.9rem;">Cancel·lar</button>
                        <button id="matCreate" style="background:#1a1f1a;border:1px solid #1a1f1a;color:#f1ebde;padding:0.6rem 1.2rem;border-radius:6px;cursor:pointer;font-family:inherit;font-size:0.9rem;font-weight:700;">Reservar seient · 0 € →</button>
                    </div>
                    <small style="display:block;margin-top:0.6rem;color:#888;font-family:monospace;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;">No requereix KYC ni wallet · escrow de llinatge fins a la cohort</small>
                </div>
            </div>
        `;

        document.getElementById('matCancel')?.addEventListener('click', close);
        document.getElementById('dashMatriuBg')?.addEventListener('click', e => { if (e.target.id === 'dashMatriuBg') close(); });

        document.getElementById('matCreate')?.addEventListener('click', async () => {
            const name   = document.getElementById('matName').value.trim();
            const handle = document.getElementById('matHandle').value.trim();
            const idea   = document.getElementById('matIdea').value.trim();
            const errEl  = document.getElementById('matErr');

            if (!name) { errEl.textContent = '✗ El teu nom és obligatori'; errEl.style.display = 'block'; return; }
            if (!idea) { errEl.textContent = '✗ Descriu la teva idea de projecte'; errEl.style.display = 'block'; return; }
            errEl.style.display = 'none';

            try {
                const out = buildMatriuCohortProject({
                    operatorName:   name,
                    operatorHandle: handle,
                    projectIdea:    idea,
                });
                // 1) Crear proyecto en el store
                await store.dispatch({ type: 'CREATE_PROJECT', payload: out.project });
                // 2) Persistir nodos KB (SOC + 6 SOPs + wallet)
                for (const node of out.kbNodes) {
                    await store.dispatch({ type: 'KB_UPSERT', payload: { node } });
                }
                close();
                if (window.navigateTo) window.navigateTo(out.navigateTo);
            } catch (err) {
                console.error('[MAT-002-A] Error creando plantilla Matriu:', err);
                errEl.textContent = '✗ ' + err.message;
                errEl.style.display = 'block';
            }
        });
    }
}
