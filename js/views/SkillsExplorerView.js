// TEAMTOWERS SOS V11 — SKILLS EXPLORER VIEW (SKILL-TAX-002 sprint B)
//
// Ruta: /skills
// Directori complet de les 90 skills del catàleg amb filtres per:
//   - Categoria · soft / hard / meta / care / governance (5)
//   - Audience · fundadors / equip / usuaris / inversors / comunitat (5)
//   - Project type · 12 PROJECT_TYPES de Matriu
//   - Tier · foundation / practitioner / master
//   - Cerca text lliure (id · label · description)
//
// Cada skill card mostra:
//   - id (kebab-case mono) + label (Instrument Serif italic)
//   - Pill categoria amb icon + color
//   - Pill tier
//   - Domain pill
//   - Guardians afins (badges colorats)
//   - Audiences targets (mini badges)
//   - Project types afins (count + first 3)
//   - Description sub

import { store } from '../core/store.js';
import { renderNavLinksHtml, renderNavGroupedHtml, ensureNavGroupStyle, bindNavGroupDropdowns } from '../core/navService.js';
import { SKILL_TAXONOMY, listSkills, SKILL_TIERS } from '../core/skillTaxonomy.js';
import {
    SKILL_CATEGORIES, PUBLIC_AUDIENCES,
    categoryForSkill, skillsByCategory,
    audienceProjectTypesForSkill, skillsForProjectType,
    audiencesForSkill, intangibleValueOfGuardian, topSkillsForGuardian,
    coverageReportExtended,
} from '../core/skillTaxonomyExtension.js';
import { PROJECT_TYPES, PANTHEON_GUARDIANS, getGuardianById } from '../core/critical108Roles.js';
import { renderExplainerBadge, bindExplainerBadges, ensureExplainerStyle } from '../core/didacticService.js';

const GUARDIAN_COLOR = Object.freeze({
    afrodita:'#c25a3a', apolo:'#fbbf24', atenea:'#5a6e4f', demeter:'#8b9a3a',
    dionisio:'#a855f7', hebe:'#ec4899', hefesto:'#9c5a2c', hera:'#2c4a7a',
    hermes:'#22c55e', hestia:'#d4a853', poseidon:'#0e7490', zeus:'#dc2626',
});
const CATEGORY_COLOR = Object.freeze({
    soft:       '#22c55e',
    hard:       '#6366f1',
    meta:       '#a855f7',
    care:       '#ec4899',
    governance: '#fbbf24',
});

function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export default class SkillsExplorerView {
    constructor() {
        document.title = 'Skills · catàleg universal · SOS V11';
        this.filters = { category: '', audience: '', projectType: '', tier: '', search: '' };
    }

    async getHtml() {
        await store.init();
        const params = new URLSearchParams(window.location.search);
        this.filters.category    = params.get('category') || '';
        this.filters.audience    = params.get('audience') || '';
        this.filters.projectType = params.get('projectType') || '';
        this.filters.tier        = params.get('tier') || '';
        this.filters.search      = params.get('q') || '';
        const cov = coverageReportExtended();
        return `
        ${this._renderStyle()}
        <div class="se-shell">
            <div class="se-topbar">
                <a href="/" data-link class="se-logo">🗼 Team<span>Towers</span></a>
                <span class="se-title">🧠 Skills · catàleg universal ${renderExplainerBadge('vna', { size: 'xs' })} ${renderExplainerBadge('folksonomy', { size: 'xs' })} ${renderExplainerBadge('taxonomy', { size: 'xs' })}</span>
                <div class="se-spacer"></div>
                <a href="/learn" data-link class="se-link">📜 Conceptes</a>
                
            </div>

            <div class="se-main">
                <header class="se-hero">
                    <h1 class="mat-hero-h1">90 <strong>skills</strong> · 5 categories · 5 audiències · 12 tipus de projecte</h1>
                    <p class="se-hero-sub">SKILL-TAX-002 · taxonomia universal SOS amb foco al públic potencial Matriu. Compatible amb estàndards externs (ESCO · O*NET · LinkedIn) · pendent de mapping bidireccional al sprint B.</p>

                    <div class="se-stats-row">
                        ${Object.entries(cov.byCategory).map(([cat, count]) => {
                            const meta = SKILL_CATEGORIES[cat];
                            const color = CATEGORY_COLOR[cat] || '#888';
                            return `
                                <button class="se-stat ${this.filters.category === cat ? 'is-active' : ''}" data-cat-toggle="${cat}" style="--se-c:${color};">
                                    <div class="se-stat-icon">${meta.icon}</div>
                                    <div class="se-stat-label">${escapeHtml(meta.label)}</div>
                                    <div class="se-stat-value">${count}</div>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </header>

                <div class="se-filters">
                    <input type="search" id="seSearch" class="se-input" placeholder="🔍 Cercar skill (id · label · domain)" value="${escapeHtml(this.filters.search)}">
                    <select id="seCategory" class="se-input">
                        <option value="">— Tota categoria —</option>
                        ${Object.entries(SKILL_CATEGORIES).map(([id, c]) => `<option value="${id}" ${this.filters.category === id ? 'selected' : ''}>${c.icon} ${escapeHtml(c.label)}</option>`).join('')}
                    </select>
                    <select id="seAudience" class="se-input">
                        <option value="">— Tota audiència —</option>
                        ${PUBLIC_AUDIENCES.map(a => `<option value="${a.id}" ${this.filters.audience === a.id ? 'selected' : ''}>${a.icon} ${escapeHtml(a.label)}</option>`).join('')}
                    </select>
                    <select id="seProjectType" class="se-input">
                        <option value="">— Tot tipus projecte —</option>
                        ${PROJECT_TYPES.map(pt => `<option value="${pt.id}" ${this.filters.projectType === pt.id ? 'selected' : ''}>${escapeHtml(pt.label)}</option>`).join('')}
                    </select>
                    <select id="seTier" class="se-input">
                        <option value="">— Tot tier —</option>
                        ${SKILL_TIERS.map(t => `<option value="${t}" ${this.filters.tier === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
                    </select>
                </div>

                <div class="se-results-meta" id="seResultsMeta"></div>
                <div class="se-grid" id="seGrid"></div>

                <section class="se-section">
                    <h2>🪶 Valors intangibles per guardian Pantheon Work</h2>
                    <p class="se-section-sub">Cada guardian PW reconeix una dimensió intangible específica del valor aportat. Aquests valors guien la categorització de care + governance + soft skills.</p>
                    <div class="se-guardians-grid">
                        ${PANTHEON_GUARDIANS.map(g => {
                            const iv = intangibleValueOfGuardian(g.id);
                            const color = GUARDIAN_COLOR[g.id] || '#888';
                            const top = topSkillsForGuardian(g.id, 3);
                            return `
                                <article class="se-guardian-card" style="--se-c:${color};">
                                    <header class="se-guardian-head">
                                        <span class="se-guardian-name mat-italic">${escapeHtml(g.name)}</span>
                                        <span class="se-guardian-domain">${escapeHtml(g.domain)}</span>
                                    </header>
                                    ${iv ? `
                                        <div class="se-guardian-intang">🪶 <strong>${escapeHtml(iv.primary)}</strong></div>
                                        <div class="se-guardian-secondary">${(iv.secondary || []).map(s => `<span>${escapeHtml(s)}</span>`).join(' · ')}</div>
                                        <div class="se-guardian-recogn">Reconeix valor en · ${(iv.recognizesValueIn || []).join(' · ')}</div>
                                    ` : ''}
                                    ${top.length > 0 ? `
                                        <div class="se-guardian-skills">
                                            <span class="se-guardian-skills-label">Top skills:</span>
                                            ${top.map(s => `<a href="/skills?q=${encodeURIComponent(s.id)}" data-link class="se-skill-pill">${escapeHtml(s.id)}</a>`).join('')}
                                        </div>
                                    ` : ''}
                                </article>
                            `;
                        }).join('')}
                    </div>
                </section>
            </div>
        </div>
        `;
    }

    _renderStyle() {
        return `<style>
            .se-shell { background: var(--bg-dark); color: var(--text-main); min-height: 100%; font-family: var(--font-base, sans-serif); display: flex; flex-direction: column; }
            .se-topbar { display: flex; align-items: center; gap: 1rem; padding: 14px 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; flex-shrink: 0; position: sticky; top: 0; background: rgba(5,5,7,0.95); backdrop-filter: blur(8px); z-index: 10; }
            .se-logo { font-family: monospace; color: var(--text-muted); text-decoration: none; font-size: 0.78rem; }
            .se-logo span { color: #6366f1; font-weight: 700; }
            .se-title { color: var(--text-secondary); font-size: 0.86rem; display: inline-flex; align-items: center; gap: 6px; }
            .se-spacer { flex: 1; }
            .se-link { color: var(--text-muted); text-decoration: none; font-size: 0.85rem; padding: 6px 12px; border-radius: 6px; }
            .se-link:hover { background: var(--glass-hover); color: var(--text-main); }

            .se-main { flex: 1; padding: clamp(20px, 4vw, 36px); max-width: 1280px; margin: 0 auto; width: 100%; box-sizing: border-box; overflow-y: auto; }

            .se-hero { margin-bottom: 24px; padding: 24px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
            .se-hero h1 { font-size: clamp(1.6rem, 3vw, 2.2rem); color: var(--text-main); line-height: 1.05; margin-bottom: 6px; }
            .se-hero-sub { color: var(--text-secondary); font-size: 0.92rem; max-width: 760px; line-height: 1.55; margin-bottom: 18px; }

            .se-stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
            .se-stat { background: var(--glass-hover); border: 1px solid var(--border-default); border-left: 3px solid var(--se-c); border-radius: 8px; padding: 12px 14px; text-align: left; cursor: pointer; transition: background 0.15s, transform 0.15s; color: inherit; font-family: inherit; }
            .se-stat:hover { background: var(--glass-hover); transform: translateY(-1px); }
            .se-stat.is-active { background: rgba(255,255,255,0.1); border-color: var(--se-c); box-shadow: 0 0 0 2px var(--se-c); }
            .se-stat-icon { font-size: 1.2rem; }
            .se-stat-label { font-family: monospace; font-size: 0.7rem; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase; margin-top: 4px; }
            .se-stat-value { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 1.6rem; color: var(--text-main); line-height: 1; margin-top: 4px; }

            .se-filters { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 8px; margin: 18px 0; }
            @media (max-width: 880px) { .se-filters { grid-template-columns: 1fr 1fr; } }
            .se-input { background: var(--bg-elevated); border: 1px solid var(--border-default); color: var(--text-main); padding: 10px 12px; border-radius: 6px; font-size: 0.88rem; outline: none; font-family: inherit; transition: border-color 0.15s; }
            .se-input:focus { border-color: var(--accent-purple); }

            .se-results-meta { font-family: monospace; font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px; }

            .se-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }

            .se-card { background: var(--bg-panel); border: 1px solid var(--border-default); border-left: 3px solid var(--se-c, var(--text-muted)); border-radius: var(--radius-md); padding: 14px 16px; transition: background var(--dur-fast), transform var(--dur-fast); box-shadow: var(--shadow-sm); }
            .se-card:hover { background: var(--glass-hover); transform: translateY(-1px); }
            .se-card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
            .se-card-id { font-family: ui-monospace, monospace; font-size: 0.74rem; color: var(--accent-purple); }
            .se-card-tier { font-family: ui-monospace, monospace; font-size: 0.62rem; padding: 2px 6px; border-radius: 99px; background: var(--glass-hover); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
            .se-card-label { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 1.15rem; color: var(--text-main); line-height: 1.2; margin-bottom: 8px; }
            .se-card-meta { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
            .se-card-pill { font-family: ui-monospace, monospace; font-size: 0.65rem; padding: 2px 8px; border-radius: 99px; background: var(--glass-hover); color: var(--text-secondary); }
            .se-card-pill.cat { color: var(--se-c); border: 1px solid var(--se-c); background: transparent; }
            .se-card-pill.guardian { background: var(--se-g, #888)22; color: var(--se-g); border: 1px solid var(--se-g); }
            .se-card-pill.aud { background: rgba(168,85,247,0.12); color: #c4b5fd; }
            .se-card-desc { font-size: 0.84rem; color: var(--text-secondary); line-height: 1.55; margin-bottom: 8px; }
            .se-card-pt { display: flex; gap: 4px; flex-wrap: wrap; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.08); font-size: 0.72rem; color: var(--text-muted); }
            .se-card-pt-label { font-family: monospace; opacity: 0.7; }
            .se-card-pt-pill { font-family: monospace; font-size: 0.7rem; padding: 1px 6px; border-radius: 4px; background: rgba(99,102,241,0.1); color: var(--accent-indigo); }

            .se-no-results { color: var(--text-muted); padding: 3rem; text-align: center; font-style: italic; grid-column: 1 / -1; }

            .se-section { margin-top: 48px; padding-top: 28px; border-top: 1px solid rgba(255,255,255,0.06); }
            .se-section h2 { color: var(--text-main); font-size: 1.2rem; margin-bottom: 8px; }
            .se-section-sub { color: var(--text-muted); font-size: 0.88rem; max-width: 720px; line-height: 1.55; margin-bottom: 18px; }

            .se-guardians-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
            .se-guardian-card { background: rgba(255,255,255,0.025); border: 1px solid var(--border-default); border-top: 3px solid var(--se-c); border-radius: 8px; padding: 14px 16px; }
            .se-guardian-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
            .se-guardian-name { color: var(--se-c); font-size: 1.4rem; }
            .se-guardian-domain { font-family: monospace; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; }
            .se-guardian-intang { font-size: 0.92rem; color: var(--text-main); margin-bottom: 4px; }
            .se-guardian-secondary { color: var(--text-secondary); font-size: 0.82rem; line-height: 1.55; margin-bottom: 4px; }
            .se-guardian-recogn { color: var(--text-muted); font-size: 0.75rem; line-height: 1.5; font-style: italic; margin-bottom: 8px; }
            .se-guardian-skills { padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.06); display: flex; flex-wrap: wrap; gap: 4px; align-items: baseline; }
            .se-guardian-skills-label { font-family: monospace; font-size: 0.7rem; color: var(--text-muted); }
            .se-skill-pill { font-family: monospace; font-size: 0.72rem; padding: 2px 8px; border-radius: 99px; background: rgba(192,132,252,0.12); color: var(--accent-purple); text-decoration: none; }
            .se-skill-pill:hover { background: rgba(192,132,252,0.24); }
        </style>`;
    }

    async afterRender() {
        ensureExplainerStyle();
        bindExplainerBadges(document);

        const update = () => {
            this.filters.search      = document.getElementById('seSearch')?.value || '';
            this.filters.category    = document.getElementById('seCategory')?.value || '';
            this.filters.audience    = document.getElementById('seAudience')?.value || '';
            this.filters.projectType = document.getElementById('seProjectType')?.value || '';
            this.filters.tier        = document.getElementById('seTier')?.value || '';
            this._renderResults();
            this._syncUrlState();
        };
        document.getElementById('seSearch')?.addEventListener('input', update);
        ['seCategory', 'seAudience', 'seProjectType', 'seTier'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', update);
        });
        // Click stat-card per category toggle
        document.querySelectorAll('[data-cat-toggle]').forEach(el => {
            el.addEventListener('click', () => {
                const cat = el.getAttribute('data-cat-toggle');
                const cur = this.filters.category;
                const sel = document.getElementById('seCategory');
                if (sel) sel.value = (cur === cat) ? '' : cat;
                update();
            });
        });

        this._renderResults();
    }

    _filteredSkills() {
        const f = this.filters;
        const search = f.search.toLowerCase().trim();
        return SKILL_TAXONOMY.filter(s => {
            if (f.category && categoryForSkill(s.id) !== f.category) return false;
            if (f.audience && !audiencesForSkill(s.id).includes(f.audience)) return false;
            if (f.projectType && !audienceProjectTypesForSkill(s.id).includes(f.projectType)) return false;
            if (f.tier && s.tier !== f.tier) return false;
            if (search) {
                const hay = (s.id + ' ' + (s.label || '') + ' ' + (s.description || '') + ' ' + s.domain).toLowerCase();
                if (!hay.includes(search)) return false;
            }
            return true;
        });
    }

    _renderResults() {
        const list = this._filteredSkills();
        const meta = document.getElementById('seResultsMeta');
        if (meta) meta.textContent = list.length + ' / ' + SKILL_TAXONOMY.length + ' skills · ' + this._activeFiltersDescription();
        const grid = document.getElementById('seGrid');
        if (!grid) return;
        if (list.length === 0) {
            grid.innerHTML = '<div class="se-no-results">Cap skill coincideix amb els filtres actuals.</div>';
            return;
        }
        grid.innerHTML = list.map(s => this._renderCard(s)).join('');
    }

    _renderCard(s) {
        const cat = categoryForSkill(s.id);
        const catMeta = SKILL_CATEGORIES[cat];
        const color = CATEGORY_COLOR[cat] || '#888';
        const guardians = (s.guardianAffinity || []).map(gId => ({ id: gId, name: getGuardianById(gId)?.name || gId }));
        const auds = audiencesForSkill(s.id);
        const audsMeta = auds.map(aid => PUBLIC_AUDIENCES.find(a => a.id === aid)).filter(Boolean);
        const pts = audienceProjectTypesForSkill(s.id);
        const ptShort = pts.slice(0, 3).map(id => PROJECT_TYPES.find(pt => pt.id === id)?.label || id);
        return `
            <article class="se-card" style="--se-c:${color};">
                <header class="se-card-head">
                    <span class="se-card-id">${escapeHtml(s.id)}</span>
                    <span class="se-card-tier">${escapeHtml(s.tier)}</span>
                </header>
                <div class="se-card-label">${escapeHtml(s.label)}</div>
                <div class="se-card-meta">
                    <span class="se-card-pill cat">${catMeta?.icon || ''} ${escapeHtml(catMeta?.label || cat)}</span>
                    <span class="se-card-pill">${escapeHtml(s.domain)}</span>
                    ${guardians.map(g => `<span class="se-card-pill guardian" style="--se-g:${GUARDIAN_COLOR[g.id] || '#888'};">⚡ ${escapeHtml(g.name)}</span>`).join('')}
                    ${audsMeta.map(a => `<span class="se-card-pill aud">${a.icon} ${escapeHtml(a.label)}</span>`).join('')}
                </div>
                <p class="se-card-desc">${escapeHtml(s.description || '')}</p>
                ${pts.length > 0 ? `
                    <div class="se-card-pt">
                        <span class="se-card-pt-label">Project types · ${pts.length}/${PROJECT_TYPES.length}:</span>
                        ${ptShort.map(label => `<span class="se-card-pt-pill">${escapeHtml(label)}</span>`).join('')}
                        ${pts.length > 3 ? `<span class="se-card-pt-pill">+${pts.length - 3}</span>` : ''}
                    </div>
                ` : ''}
            </article>
        `;
    }

    _activeFiltersDescription() {
        const f = this.filters;
        const parts = [];
        if (f.category)    parts.push(SKILL_CATEGORIES[f.category]?.label || f.category);
        if (f.audience)    parts.push(PUBLIC_AUDIENCES.find(a => a.id === f.audience)?.label || f.audience);
        if (f.projectType) parts.push(PROJECT_TYPES.find(pt => pt.id === f.projectType)?.label || f.projectType);
        if (f.tier)        parts.push(f.tier);
        if (f.search)      parts.push('"' + f.search + '"');
        return parts.length === 0 ? 'sense filtres' : parts.join(' · ');
    }

    _syncUrlState() {
        const params = new URLSearchParams();
        if (this.filters.category)    params.set('category', this.filters.category);
        if (this.filters.audience)    params.set('audience', this.filters.audience);
        if (this.filters.projectType) params.set('projectType', this.filters.projectType);
        if (this.filters.tier)        params.set('tier', this.filters.tier);
        if (this.filters.search)      params.set('q', this.filters.search);
        const qs = params.toString();
        const newUrl = '/skills' + (qs ? '?' + qs : '');
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', newUrl);
        }
    }

    destroy() { /* nothing */ }
}
