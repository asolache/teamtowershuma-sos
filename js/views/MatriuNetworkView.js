// TEAMTOWERS SOS V11 — MATRIU NETWORK VIEW (MAT-002-I sprint A)
//
// Ruta: /matriu/network
// Directori dels 108 membres del nucli fundacional. Cada plaza
// (`cohort_seat` al KB) es renderitza com a card amb perfil complet ·
// displayName · handle · guardianOf · skillsDeclared · disponibilitat ·
// projectes on participa (com a swarm_assignment o assignedToSeatId).
//
// Reframe @alvaro 2026-05-09: "la Matriu son las personas que tienen
// o no proyectos · y que tienen un perfil de roles y skills".
// Aquesta vista és el primer pas · sprint A. Sprint B unificarà
// cohort_seat + user_identity en un únic nodo `matriu_member`.

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import { renderNavLinksHtml, renderNavGroupedHtml, ensureNavGroupStyle, bindNavGroupDropdowns } from '../core/navService.js';
import { COHORT_0_TOTAL, PANTHEON_GUARDIANS, getGuardianById } from '../core/critical108Roles.js';
import { listSeats } from '../core/cohortSeatService.js';
import { listMatriuMembers, migrateAllToMatriuMembers } from '../core/matriuMemberService.js';
import { renderExplainerBadge, bindExplainerBadges, ensureExplainerStyle } from '../core/didacticService.js';

// Color por guardian (consistent amb la landing /matriu)
const GUARDIAN_COLORS = Object.freeze({
    afrodita:  '#c25a3a',
    apolo:     '#fbbf24',
    atenea:    '#5a6e4f',
    demeter:   '#8b9a3a',
    dionisio:  '#a855f7',
    hebe:      '#ec4899',
    hefesto:   '#9c5a2c',
    hera:      '#2c4a7a',
    hermes:    '#22c55e',
    hestia:    '#d4a853',
    poseidon:  '#0e7490',
    zeus:      '#dc2626',
});

function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export default class MatriuNetworkView {
    constructor() {
        document.title = 'Matriu · Xarxa de membres · SOS V11';
        this.seats = [];
        this.assignments = [];   // swarm_assignment nodes
        this.workOrders = [];    // per a comptar WOs assignats
        this.projects = [];
        this.filters = { search: '', guardian: '', availability: '', hasProject: '' };
    }

    async getHtml() {
        await store.init();
        await KB.init();
        // Sprint B · prioritzar matriu_member si existeixen, fallback a cohort_seat legacy
        this.members = (await listMatriuMembers(KB)) || [];
        this.seats = await listSeats(KB) || [];
        // Si hi ha matriu_members, els fem servir com a "seats" virtuals (mantenint
        // l'API actual del view); altrament usem els seats legacy.
        if (this.members.length > 0) {
            this.seats = this.members.map(m => ({
                id:      m.id,
                type:    'cohort_seat',          // virtual cast per a no canviar el render
                content: { ...m.content },
            }));
            this.usingMembers = true;
        } else {
            this.usingMembers = false;
        }
        const allNodes = await KB.getAllNodes();
        this.assignments = allNodes.filter(n => n?.type === 'swarm_assignment');
        this.workOrders = allNodes.filter(n => n?.type === 'work_order');
        this.projects = (store.getState().projects || []).filter(p => !p.isArchived);
        return this._renderShell();
    }

    _renderShell() {
        const total = COHORT_0_TOTAL;
        const taken = this.seats.length;
        const free = Math.max(0, total - taken);
        const guardiansCovered = new Set(this.seats.map(s => s?.content?.guardianOf).filter(Boolean));
        const skillsCovered = new Set(this.seats.flatMap(s => s?.content?.skillsDeclared || []));

        return `
        ${this._renderStyle()}
        <div class="mn-shell">
            <div class="mn-topbar">
                <a href="/matriu" data-link class="mn-logo">✦ Matriu</a>
                <span class="mn-title">🌐 Xarxa de membres ${renderExplainerBadge('cohort-0', { size: 'xs' })} ${renderExplainerBadge('vna', { size: 'xs' })}</span>
                <div class="mn-spacer"></div>
                <a href="/matriu" data-link class="mn-link" style="background:rgba(42,58,42,0.08);font-weight:600;">📜 Veure el manifest →</a>
                ${renderNavGroupedHtml({ active: '', className: 'mn-link' })}
            </div>

            <div class="mn-main">
                <header class="mn-hero">
                    <h1 class="mat-hero-h1">Els <strong>${taken}</strong> membres del <strong>nucli</strong></h1>
                    <p class="mn-hero-sub">Perfil complet de cada plaça · skills declarades · guardian assignat · projectes on participa. Sprint A · llistat. Sprint B unificarà amb user_identity.</p>

                    ${this.usingMembers
                        ? `<div class="mn-migrate-banner is-done">✓ Schema unificat · ${this.members.length} matriu_members actius</div>`
                        : `<div class="mn-migrate-banner">
                              <span>⚠ Schema legacy · llegint <code>cohort_seat</code>. Migra a <code>matriu_member</code> per a unificar amb identitat (DID + clau ECDSA + wallets).</span>
                              <button class="mn-migrate-btn" id="mnMigrateBtn">🔄 Migrar a matriu_member</button>
                           </div>`
                    }
                    <div class="mn-stats-row">
                        <div class="mn-stat" style="--mn-c:#c084fc;">
                            <div class="mn-stat-label">Places ocupades</div>
                            <div class="mn-stat-value">${taken}/${total}</div>
                        </div>
                        <div class="mn-stat" style="--mn-c:#22c55e;">
                            <div class="mn-stat-label">Places lliures</div>
                            <div class="mn-stat-value">${free}</div>
                        </div>
                        <div class="mn-stat" style="--mn-c:#fbbf24;">
                            <div class="mn-stat-label">Guardians coberts</div>
                            <div class="mn-stat-value">${guardiansCovered.size}/12</div>
                        </div>
                        <div class="mn-stat" style="--mn-c:#c25a3a;">
                            <div class="mn-stat-label">Skills cobertes</div>
                            <div class="mn-stat-value">${skillsCovered.size}</div>
                            <div class="mn-stat-sub">de 90 al catàleg</div>
                        </div>
                    </div>
                </header>

                <div class="mn-filters">
                    <input type="search" id="mnSearch" class="mn-input" placeholder="🔍 Cercar per nom, handle, skill, bio…" value="${escapeHtml(this.filters.search)}">
                    <select id="mnGuardian" class="mn-input">
                        <option value="">— Tots els guardians —</option>
                        ${PANTHEON_GUARDIANS.map(g => `<option value="${g.id}" ${this.filters.guardian === g.id ? 'selected' : ''}>${g.name}</option>`).join('')}
                    </select>
                    <select id="mnAvailability" class="mn-input">
                        <option value="">— Tota la disponibilitat —</option>
                        <option value="high"   ${this.filters.availability === 'high' ? 'selected' : ''}>🟢 Alta</option>
                        <option value="normal" ${this.filters.availability === 'normal' ? 'selected' : ''}>🟡 Normal</option>
                        <option value="low"    ${this.filters.availability === 'low' ? 'selected' : ''}>🔴 Baixa</option>
                    </select>
                    <select id="mnHasProject" class="mn-input">
                        <option value="">— Amb i sense projecte —</option>
                        <option value="yes" ${this.filters.hasProject === 'yes' ? 'selected' : ''}>Amb projecte</option>
                        <option value="no"  ${this.filters.hasProject === 'no'  ? 'selected' : ''}>Sense projecte</option>
                    </select>
                </div>

                <div class="mn-grid" id="mnGrid">${this._renderCards()}</div>

                <div class="mn-empty-cohort">
                    ${this._renderEmptySlots(free)}
                </div>
            </div>
        </div>
        `;
    }

    _renderCards() {
        const filtered = this._filterSeats();
        if (filtered.length === 0) {
            return `<div class="mn-no-results">
                <div style="font-size:2rem;">🔍</div>
                <p>Cap membre coincideix amb els filtres.</p>
                ${this.seats.length === 0 ? '<p style="color:#888;font-size:0.85rem;">Encara no hi ha plaçes registrades · ves a un projecte i clica "⚡ Seed 5 plaçes demo" al panel de l\'enjambre.</p>' : ''}
            </div>`;
        }
        return filtered.map(s => this._renderSeatCard(s)).join('');
    }

    _renderSeatCard(seat) {
        const c = seat.content || {};
        const guardian = c.guardianOf ? getGuardianById(c.guardianOf) : null;
        const guardianColor = GUARDIAN_COLORS[c.guardianOf] || '#888';
        const initials = (c.displayName || seat.id).split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
        const projects = this._projectsForSeat(seat.id);
        const woCount = this.workOrders.filter(w => (w?.content?.assignedToSeatId === seat.id)).length;
        const skills = c.skillsDeclared || [];
        const availIcon = c.availability === 'high' ? '🟢' : c.availability === 'low' ? '🔴' : '🟡';

        return `
            <article class="mn-card" data-seat="${escapeHtml(seat.id)}">
                <header class="mn-card-head" style="--mn-g:${guardianColor};">
                    <div class="mn-card-avatar" style="background:${guardianColor};">${escapeHtml(initials)}</div>
                    <div class="mn-card-id">
                        <div class="mn-card-name mat-italic">${escapeHtml(c.displayName || seat.id)}</div>
                        <div class="mn-card-handle">${escapeHtml(c.handle || seat.id.slice(-12))}</div>
                    </div>
                    ${guardian ? `<span class="mn-card-guardian" style="background:${guardianColor}22;color:${guardianColor};border-color:${guardianColor};" title="Guardian Pantheon Work · ${escapeHtml(guardian.name)}">⚡ ${escapeHtml(guardian.name)}</span>` : ''}
                </header>
                ${c.bio ? `<p class="mn-card-bio">${escapeHtml(c.bio)}</p>` : ''}
                ${skills.length > 0 ? `
                    <div class="mn-card-skills">
                        ${skills.slice(0, 6).map(sk => `<span class="mn-skill">${escapeHtml(sk)}</span>`).join('')}
                        ${skills.length > 6 ? `<span class="mn-skill mn-skill-more">+${skills.length - 6}</span>` : ''}
                    </div>
                ` : ''}
                <footer class="mn-card-foot">
                    <span class="mn-foot-item" title="Disponibilitat">${availIcon} ${escapeHtml(c.availability || 'normal')}</span>
                    <span class="mn-foot-item" title="Projectes assignats">📋 ${projects.length}</span>
                    <span class="mn-foot-item" title="Work Orders assignats">⚡ ${woCount}</span>
                </footer>
                ${projects.length > 0 ? `
                    <div class="mn-card-projects">
                        <span class="mn-projects-label">Projectes:</span>
                        ${projects.slice(0, 3).map(p => `<a href="/project/${encodeURIComponent(p.id)}" data-link class="mn-project-pill">${escapeHtml(p.nombre || p.name || p.id.slice(-12))}</a>`).join('')}
                        ${projects.length > 3 ? `<span style="color:#666;font-size:0.7rem;">+${projects.length - 3}</span>` : ''}
                    </div>
                ` : ''}
            </article>
        `;
    }

    _renderEmptySlots(free) {
        if (free === 0) return '';
        const showCount = Math.min(free, 12);   // mostra max 12 slots buits
        return `
            <div class="mn-empty-section">
                <h3 class="mat-italic">${free} <strong>seients lliures</strong> al nucli</h3>
                <div class="mn-empty-grid">
                    ${Array.from({ length: showCount }).map((_, i) => `
                        <div class="mn-empty-slot">
                            <div class="mn-empty-num">${this.seats.length + i + 1}</div>
                            <a href="/matriu" data-link class="mn-empty-cta">Reservar →</a>
                        </div>
                    `).join('')}
                    ${free > 12 ? `<div class="mn-empty-slot mn-empty-more">+${free - 12} més…</div>` : ''}
                </div>
            </div>
        `;
    }

    _filterSeats() {
        const f = this.filters;
        const search = f.search.toLowerCase().trim();
        return this.seats.filter(s => {
            const c = s.content || {};
            if (f.guardian && c.guardianOf !== f.guardian) return false;
            if (f.availability && (c.availability || 'normal') !== f.availability) return false;
            if (f.hasProject) {
                const projs = this._projectsForSeat(s.id);
                if (f.hasProject === 'yes' && projs.length === 0) return false;
                if (f.hasProject === 'no' && projs.length > 0) return false;
            }
            if (search) {
                const hay = [
                    c.displayName, c.handle, c.bio, c.guardianOf,
                    ...(c.skillsDeclared || []),
                ].filter(Boolean).join(' ').toLowerCase();
                if (!hay.includes(search)) return false;
            }
            return true;
        });
    }

    _projectsForSeat(seatId) {
        // Projectes on aquesta plaza té assignment
        const projectIds = new Set(
            this.assignments
                .filter(a => a?.content?.seatId === seatId)
                .map(a => a.projectId)
        );
        // Projectes amb WOs assignats a aquesta plaza
        for (const w of this.workOrders) {
            if (w?.content?.assignedToSeatId === seatId && w.projectId) {
                projectIds.add(w.projectId);
            }
        }
        return Array.from(projectIds)
            .map(id => this.projects.find(p => p.id === id))
            .filter(Boolean);
    }

    _renderStyle() {
        return `<style>
            .mn-shell { background: #f1ebde; color: #2a3a2a; min-height: 100%; font-family: 'Inter Tight', 'Inter', system-ui, sans-serif; display: flex; flex-direction: column; }
            .mn-topbar { display: flex; align-items: center; gap: 1rem; padding: 16px 1.5rem; border-bottom: 1px solid rgba(42,58,42,0.15); flex-wrap: wrap; flex-shrink: 0; background: rgba(241,235,222,0.95); backdrop-filter: blur(8px); position: sticky; top: 0; z-index: 10; }
            .mn-logo { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; color: #2a3a2a; text-decoration: none; font-size: 1.4rem; }
            .mn-title { color: #5a6e4f; font-size: 0.92rem; display: inline-flex; align-items: center; gap: 6px; font-family: 'Instrument Serif', Georgia, serif; font-style: italic; }
            .mn-spacer { flex: 1; }
            .mn-link { color: #2a3a2a; text-decoration: none; font-size: 0.85rem; padding: 6px 12px; border-radius: 6px; opacity: 0.78; }
            .mn-link:hover { background: rgba(42,58,42,0.06); opacity: 1; }

            .mn-main { flex: 1; padding: clamp(20px, 4vw, 36px); max-width: 1280px; margin: 0 auto; width: 100%; box-sizing: border-box; overflow-y: auto; }
            .mn-hero { margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid rgba(42,58,42,0.1); }
            .mn-hero h1 { font-size: clamp(2rem, 4vw, 3rem); color: #2a3a2a; line-height: 1.05; margin-bottom: 8px; }
            .mn-hero h1 strong { color: #c25a3a; }
            .mn-hero-sub { color: #5a6e4f; font-size: 0.95rem; max-width: 720px; line-height: 1.6; margin-bottom: 22px; }

            .mn-migrate-banner { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.85rem; }
            .mn-migrate-banner:not(.is-done) { background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.45); color: #5a4e1f; }
            .mn-migrate-banner.is-done { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.4); color: #2a4a2a; }
            .mn-migrate-banner code { background: rgba(42,58,42,0.12); padding: 1px 6px; border-radius: 4px; font-size: 0.8em; }
            .mn-migrate-btn { background: #1a1f1a; color: #f1ebde; border: 0; padding: 8px 16px; border-radius: 99px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: transform 0.15s; margin-left: auto; }
            .mn-migrate-btn:hover { transform: translateY(-1px); }
            .mn-migrate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .mn-stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; }
            .mn-stat { background: rgba(255,255,255,0.55); border: 1px solid rgba(42,58,42,0.12); border-left: 3px solid var(--mn-c, #888); border-radius: 10px; padding: 14px 16px; }
            .mn-stat-label { font-family: ui-monospace, monospace; font-size: 0.7rem; color: #5a6e4f; letter-spacing: 0.06em; text-transform: uppercase; }
            .mn-stat-value { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 1.9rem; color: #2a3a2a; line-height: 1; margin-top: 6px; }
            .mn-stat-sub { font-family: monospace; font-size: 0.7rem; color: var(--mn-c); margin-top: 4px; }

            .mn-filters { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 22px; }
            @media (max-width: 720px) { .mn-filters { grid-template-columns: 1fr; } .mn-stats-row { grid-template-columns: 1fr 1fr; } }
            .mn-input { background: rgba(255,255,255,0.7); border: 1px solid rgba(42,58,42,0.18); color: #2a3a2a; padding: 10px 14px; border-radius: 8px; font-size: 0.9rem; outline: none; transition: border-color 0.15s, background 0.15s; font-family: inherit; }
            .mn-input:focus { border-color: #c25a3a; background: #fff; }

            .mn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }

            .mn-card { background: rgba(255,255,255,0.65); border: 1px solid rgba(42,58,42,0.15); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; transition: transform 0.15s, box-shadow 0.15s, background 0.15s; }
            .mn-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(42,58,42,0.12); background: #fff; }
            .mn-card-head { display: grid; grid-template-columns: 48px 1fr auto; gap: 12px; align-items: center; padding-bottom: 8px; border-bottom: 2px solid var(--mn-g, rgba(42,58,42,0.15)); }
            .mn-card-avatar { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-family: 'Inter Tight', sans-serif; font-weight: 700; font-size: 1.05rem; flex-shrink: 0; }
            .mn-card-id { min-width: 0; }
            .mn-card-name { font-size: 1.15rem; color: #2a3a2a; line-height: 1.2; }
            .mn-card-handle { font-family: ui-monospace, monospace; font-size: 0.72rem; color: #888; margin-top: 2px; word-break: break-all; }
            .mn-card-guardian { padding: 3px 9px; border-radius: 99px; font-family: ui-monospace, monospace; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; border: 1px solid; white-space: nowrap; align-self: start; }

            .mn-card-bio { color: #3a4a3a; font-size: 0.85rem; line-height: 1.55; opacity: 0.9; margin: 0; }
            .mn-card-skills { display: flex; gap: 4px; flex-wrap: wrap; }
            .mn-skill { background: rgba(42,58,42,0.06); color: #2a3a2a; padding: 3px 9px; border-radius: 99px; font-family: ui-monospace, monospace; font-size: 0.7rem; }
            .mn-skill-more { background: rgba(194,90,58,0.12); color: #c25a3a; }

            .mn-card-foot { display: flex; gap: 12px; flex-wrap: wrap; padding-top: 8px; border-top: 1px solid rgba(42,58,42,0.08); font-family: ui-monospace, monospace; font-size: 0.74rem; color: #5a6e4f; }
            .mn-foot-item { display: inline-flex; align-items: center; gap: 4px; }

            .mn-card-projects { padding-top: 6px; border-top: 1px dashed rgba(42,58,42,0.1); display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
            .mn-projects-label { font-family: monospace; font-size: 0.7rem; color: #888; }
            .mn-project-pill { background: rgba(194,90,58,0.1); color: #c25a3a; padding: 3px 9px; border-radius: 99px; font-size: 0.74rem; text-decoration: none; border: 1px solid rgba(194,90,58,0.25); transition: background 0.15s; }
            .mn-project-pill:hover { background: rgba(194,90,58,0.2); }

            .mn-no-results { text-align: center; padding: 4rem 1rem; color: #5a6e4f; }

            .mn-empty-section { margin-top: 48px; padding-top: 28px; border-top: 1px dashed rgba(42,58,42,0.2); }
            .mn-empty-section h3 { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 1.6rem; color: #2a3a2a; margin-bottom: 16px; }
            .mn-empty-section h3 strong { color: #c25a3a; }
            .mn-empty-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
            .mn-empty-slot { background: rgba(255,255,255,0.4); border: 2px dashed rgba(42,58,42,0.2); border-radius: 10px; padding: 18px 14px; display: flex; flex-direction: column; align-items: center; gap: 10px; transition: border-color 0.15s, background 0.15s; }
            .mn-empty-slot:hover { border-color: #c25a3a; background: rgba(255,255,255,0.7); }
            .mn-empty-num { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 1.5rem; color: #888; }
            .mn-empty-cta { background: #1a1f1a; color: #f1ebde; padding: 6px 14px; border-radius: 99px; font-size: 0.76rem; font-weight: 600; text-decoration: none; transition: transform 0.15s; }
            .mn-empty-cta:hover { transform: translateY(-1px); }
            .mn-empty-more { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; color: #888; align-items: center; justify-content: center; }
        </style>`;
    }

    async afterRender() {
        ensureExplainerStyle();
        bindExplainerBadges(document);

        const update = () => {
            this.filters.search       = document.getElementById('mnSearch')?.value || '';
            this.filters.guardian     = document.getElementById('mnGuardian')?.value || '';
            this.filters.availability = document.getElementById('mnAvailability')?.value || '';
            this.filters.hasProject   = document.getElementById('mnHasProject')?.value || '';
            const grid = document.getElementById('mnGrid');
            if (grid) grid.innerHTML = this._renderCards();
        };

        document.getElementById('mnSearch')?.addEventListener('input', update);
        document.getElementById('mnGuardian')?.addEventListener('change', update);
        document.getElementById('mnAvailability')?.addEventListener('change', update);
        document.getElementById('mnHasProject')?.addEventListener('change', update);

        // Sprint B · botó migració
        document.getElementById('mnMigrateBtn')?.addEventListener('click', async () => this._handleMigrate());
    }

    async _handleMigrate() {
        const btn = document.getElementById('mnMigrateBtn');
        if (!btn) return;
        btn.disabled = true;
        btn.textContent = '⏳ Analitzant…';
        try {
            // Dry run primer · preview
            const dry = await migrateAllToMatriuMembers(KB, { dryRun: true });
            const msg = `Migració dryRun · resum:\n\n`
                + `· ${dry.stats.seatsCount} cohort_seat\n`
                + `· ${dry.stats.identitiesCount} user_identity\n`
                + `· ${dry.stats.membersGenerated} matriu_member generats\n`
                + `  - ${dry.stats.cohort0Count} al nucli fundacional (cohort 0)\n`
                + `  - ${dry.stats.networkCount} a la xarxa estesa (cohort 99)\n\n`
                + `Aplicar la migració?`;
            if (!confirm(msg)) {
                btn.disabled = false;
                btn.textContent = '🔄 Migrar a matriu_member';
                return;
            }
            btn.textContent = '⏳ Migrant…';
            const real = await migrateAllToMatriuMembers(KB, { dryRun: false });
            alert(`✓ Migració completada · ${real.stats.membersGenerated} matriu_member persistits al KB. Els nodes legacy (cohort_seat / user_identity) continuen per a backwards-compat.`);
            if (window.navigateTo) window.navigateTo(window.location.pathname);
        } catch (err) {
            console.error('[MAT-002-I B] migrate failed:', err);
            alert('Error en la migració: ' + (err?.message || String(err)));
            btn.disabled = false;
            btn.textContent = '🔄 Migrar a matriu_member';
        }
    }

    destroy() { /* nothing */ }
}
