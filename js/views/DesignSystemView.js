// =============================================================================
// TEAMTOWERS SOS V11 — DESIGN SYSTEM VIEW (DESIGN-SYSTEM sprint A)
// Ruta · /js/views/DesignSystemView.js  →  /design
//
// Mockup deluxe del Dashboard + arquitectura d'informació proposada +
// component library reutilitzable. Filosofia DRY (sosCopy single source)
// + KISS (1 mount-point per cada widget) + IA-aware (aiFormFeedback wired
// per a tots els forms del sistema).
// =============================================================================

import { label, labelN, applyToNavDestinations, listLabels, TOKENS } from '../core/sosCopy.js';
import { attachAIFormFeedback, renderInlineFeedbackHtml } from '../core/aiFormFeedback.js';
import { formatActivityEvent } from '../core/aiActivityFeedback.js';

// MENU_PROPOSAL · arquitectura d'informació v2 · agrupació clara per
// "viatge del fundador" (Foundation → Execution → Value → Commercial)
// + Discovery + Identity. KISS · max 6 grups · max 5 items per grup.
const MENU_PROPOSAL = Object.freeze([
    { groupKey: 'group.foundation', items: ['canvas', 'pitch', 'pact'] },
    { groupKey: 'group.execution',  items: ['kanban', 'sops', 'map'] },
    { groupKey: 'group.value',      items: ['tokenomics', 'accounting', 'wallet'] },
    { groupKey: 'group.commercial', items: ['proposals', 'invoices', 'market'] },
    { groupKey: 'group.swarm',      items: ['sprint', 'swarm', 'improve'] },
    { groupKey: 'group.discovery',  items: ['opportunities', 'registry', 'matriu'] },
    { groupKey: 'group.identity',   items: ['identity', 'skills', 'learn'] },
]);

// Original menu (pre-v2 · per side-by-side comparison)
const MENU_ORIGINAL = Object.freeze([
    'Inicio', 'Operaciones', 'Conocimiento', 'Mercado & ROI', 'Cuenta',
]);

// BUILD STAMP · canvia a cada deploy per facilitar troubleshooting cache
const BUILD_STAMP = '2026-05-16T18:30 · v98 · LEARN-HUB · /learn unificat · 3 modes (roadmaps/carpetas/cerca) · 10 rols · 69 docs · 71 asserts';

export default class DesignSystemView {

    constructor() {
        document.title = 'Disseny SOS · ' + label('nav.design');
    }

    async getHtml() {
        return this._htmlMain();
    }

    async afterRender() {
        this._bindDemos();
    }

    _bindDemos() {
        // Demo · AI Form Feedback widget en acció
        const fb = attachAIFormFeedback(document.getElementById('dsFbDemo'), { autoFadeOk: 0 });
        if (!fb) return;
        document.getElementById('dsBtnThinking')?.addEventListener('click', () => {
            fb.setThinking({ kind: 'runner-start', sopTitle: 'Setup ledger', iteration: 3, attempt: 1 });
        });
        document.getElementById('dsBtnOk')?.addEventListener('click', () => {
            fb.addEvent({ kind: 'wo-executed', outputLen: 540, attempt: 1, costEur: 0.023 });
            setTimeout(() => fb.addEvent({ kind: 'analyzed', score: 78, enrichments: 4, mentionsCount: 9 }), 300);
            setTimeout(() => fb.setOk('Generat amb èxit · 78/100 quality'), 700);
        });
        document.getElementById('dsBtnError')?.addEventListener('click', () => {
            fb.setError(label('err.ai_failed'));
        });
        document.getElementById('dsBtnClear')?.addEventListener('click', () => fb.clear());
    }

    _htmlMain() {
        const navCount = listLabels().filter(k => k.startsWith('nav.')).length;
        const ctaCount = listLabels().filter(k => k.startsWith('cta.')).length;
        const totalLabels = listLabels().length;

        const menuV2Html = MENU_PROPOSAL.map(g => `
            <div class="ds-group">
                <div class="ds-group-title">${this._esc(label(g.groupKey))}</div>
                <div class="ds-group-items">
                    ${g.items.map(id => {
                        const lbl = label('nav.' + id, id);
                        return `<a href="${this._hrefFor(id)}" data-link class="ds-nav-item">${lbl}</a>`;
                    }).join('')}
                </div>
            </div>
        `).join('');

        // Side-by-side comparison
        const compareBefore = MENU_ORIGINAL.map(l => `<li>${this._esc(l)}</li>`).join('');
        const compareAfter  = MENU_PROPOSAL.map(g => `<li><strong>${this._esc(label(g.groupKey))}</strong> · ${g.items.map(i => label('nav.' + i, i)).join(' · ')}</li>`).join('');

        // Deluxe dashboard mockup · hero + AI panel + cards grid
        const heroBlock = `
            <div class="ds-mockup-hero">
                <div>
                    <div class="ds-mockup-eyebrow">Mockup · arquitectura d'informació v2</div>
                    <h2 class="ds-mockup-title">Bon dia, @alvaro · 3 projectes actius · 85% promig</h2>
                    <div class="ds-mockup-subtitle">El swarm està iterant <em>Setup ledger</em> al projecte <strong>SOS Pilot Cooperatiu</strong>. Costos avui · €0.23 · sense errors.</div>
                    <div class="ds-mockup-cta-row">
                        <a class="ds-btn ds-btn-primary" href="#">⚡ ${this._esc(label('cta.continue'))} swarm</a>
                        <a class="ds-btn" href="#">${this._esc(label('cta.create'))} projecte</a>
                        <a class="ds-btn" href="#">📊 ${this._esc(label('cta.view_detail'))}</a>
                    </div>
                </div>
                <div class="ds-mockup-aibox">
                    <div style="font-size:11px;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">${this._esc(label('state.thinking'))}</div>
                    <div style="font-weight:700;font-size:0.95rem;">🤖 Agent generant deliverable per Setup ledger · iter 3</div>
                    <div style="font-size:0.78rem;color:rgba(255,255,255,0.7);margin-top:4px;font-family:var(--font-mono);">model · gpt-4o-mini · €0.02 · context dels 3 deliverables anteriors</div>
                </div>
            </div>`;

        const cards = `
            <div class="ds-mockup-grid">
                ${this._dashCard('🏢', label('nav.dashboard'), '3 projectes · 85% promig', '#86efac')}
                ${this._dashCard('🛒', label('nav.market'), '12 ofertes · 5 permaweb · 3 ikigai', '#a5b4fc')}
                ${this._dashCard('🤝', 'Trust Score', '4.2 · 7 attestations rebudes', '#fbbf24')}
                ${this._dashCard('🌸', 'Ikigai', '4/4 dimensions · 1 al centre', '#ec4899')}
                ${this._dashCard('🐝', label('nav.sprint'), '5 cicles · 12 enrichments', '#a855f7')}
                ${this._dashCard('💰', label('nav.savings'), '€1,200 vs convencional', '#22c55e')}
            </div>`;

        return `
        <style>
            .ds-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); }
            .ds-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-wrap:wrap; }
            .ds-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .ds-logo span { color:var(--accent-indigo); }
            .ds-main { max-width:1100px; margin:0 auto; padding:1.5rem; }
            .ds-section { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1.2rem 1.4rem; margin-bottom:1.2rem; }
            .ds-section h2 { margin:0 0 0.6rem 0; font-size:1.05rem; }
            .ds-section h3 { margin:0.8rem 0 0.4rem 0; font-size:0.92rem; color:${TOKENS.colors.purple}; }
            .ds-section p { color:var(--text-secondary); line-height:1.55; font-size:0.88rem; margin:0 0 0.6rem 0; }
            .ds-section ul { margin:0; padding-left:1.2rem; color:var(--text-secondary); font-size:0.85rem; line-height:1.6; }
            .ds-grid { display:grid; gap:1rem; }
            .ds-grid-2 { grid-template-columns:1fr 1fr; }
            @media (max-width:680px) { .ds-grid-2 { grid-template-columns:1fr; } }

            /* Mockup hero (deluxe dashboard) */
            .ds-mockup-hero { display:grid; grid-template-columns:1fr 320px; gap:1.5rem; padding:1.5rem; background:linear-gradient(135deg,${TOKENS.colors.primary}25,${TOKENS.colors.purple}20,${TOKENS.colors.ikigai}10); border-radius:10px; border:1px solid ${TOKENS.colors.primary}30; }
            @media (max-width:780px) { .ds-mockup-hero { grid-template-columns:1fr; } }
            .ds-mockup-eyebrow { font-size:10px; text-transform:uppercase; letter-spacing:0.08em; color:${TOKENS.colors.primary}; font-weight:700; font-family:var(--font-mono); }
            .ds-mockup-title { margin:0.4rem 0; font-size:1.6rem; line-height:1.2; }
            .ds-mockup-subtitle { color:var(--text-secondary); font-size:0.92rem; line-height:1.5; max-width:560px; }
            .ds-mockup-cta-row { display:flex; flex-wrap:wrap; gap:8px; margin-top:1rem; }
            .ds-mockup-aibox { background:rgba(0,0,0,0.45); border:1px solid rgba(168,85,247,0.35); border-radius:8px; padding:0.9rem; color:#fff; }
            .ds-mockup-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:0.8rem; margin-top:1rem; }
            .ds-card { background:#0006; border:1px solid var(--border-default); border-radius:8px; padding:0.8rem 1rem; border-left:4px solid; }
            .ds-card-icon { font-size:1.4rem; }
            .ds-card-title { font-weight:700; font-size:0.88rem; margin-top:4px; }
            .ds-card-meta { font-size:0.75rem; color:var(--text-muted); margin-top:3px; font-family:var(--font-mono); }

            /* Buttons (KISS · 2 variants) */
            .ds-btn { display:inline-flex; align-items:center; gap:4px; padding:8px 14px; border-radius:${TOKENS.radii.md}; border:1px solid var(--border-default); background:var(--bg-elevated); color:var(--text-main); font-size:0.82rem; font-weight:600; text-decoration:none; cursor:pointer; transition:all 0.15s; }
            .ds-btn:hover { background:var(--glass-hover); border-color:${TOKENS.colors.primary}; }
            .ds-btn-primary { background:${TOKENS.colors.primary}; border-color:${TOKENS.colors.primary}; color:#fff; }
            .ds-btn-primary:hover { background:#4f46e5; }

            /* Menu proposal (group + items) */
            .ds-group { padding:8px 12px; background:#0006; border-radius:6px; margin-bottom:8px; }
            .ds-group-title { font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:${TOKENS.colors.purple}; font-weight:700; font-family:var(--font-mono); margin-bottom:6px; }
            .ds-group-items { display:flex; flex-wrap:wrap; gap:6px; }
            .ds-nav-item { background:var(--bg-elevated); color:var(--text-main); padding:5px 10px; border-radius:${TOKENS.radii.pill}; font-size:0.78rem; text-decoration:none; border:1px solid var(--border-default); }
            .ds-nav-item:hover { background:var(--glass-hover); border-color:${TOKENS.colors.primary}; }

            /* Comparison columns */
            .ds-compare { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
            @media (max-width:680px) { .ds-compare { grid-template-columns:1fr; } }
            .ds-compare-col h4 { margin:0 0 0.4rem 0; font-size:0.85rem; }
            .ds-compare-col.before { opacity:0.7; }
            .ds-compare-col.after { border-left:3px solid ${TOKENS.colors.success}; padding-left:0.8rem; }

            /* Tokens swatches */
            .ds-tokens { display:flex; flex-wrap:wrap; gap:6px; }
            .ds-token-swatch { padding:6px 10px; border-radius:${TOKENS.radii.md}; color:#000; font-size:11px; font-family:var(--font-mono); font-weight:700; }

            /* Component library demos */
            .ds-demo-row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-top:8px; }
            .ds-chip { padding:3px 10px; border-radius:${TOKENS.radii.pill}; font-size:11px; font-weight:600; font-family:var(--font-mono); }
            .ds-chip-purple { background:${TOKENS.colors.purple}25; color:${TOKENS.colors.purple}; }
            .ds-chip-green { background:${TOKENS.colors.success}25; color:${TOKENS.colors.success}; }
            .ds-chip-red { background:${TOKENS.colors.danger}25; color:${TOKENS.colors.danger}; }

            /* Principles */
            .ds-principle { padding:10px 14px; background:#0006; border-radius:6px; border-left:3px solid ${TOKENS.colors.purple}; margin-bottom:8px; }
            .ds-principle h4 { margin:0 0 4px 0; font-size:0.88rem; color:${TOKENS.colors.purple}; }
            .ds-principle p { margin:0; font-size:0.82rem; color:var(--text-secondary); }

            /* Coverage badges */
            .ds-stats-row { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
            .ds-stat-chip { padding:4px 10px; background:var(--bg-elevated); border:1px solid var(--border-default); border-radius:${TOKENS.radii.pill}; font-size:11px; font-family:var(--font-mono); }
        </style>
        <div class="ds-shell">
            <div class="ds-topbar">
                <a href="/dashboard" data-link class="ds-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Disseny SOS · v2 mockup</span>
                <code style="font-size:10px;color:#22c55e;background:rgba(34,197,94,0.12);padding:2px 8px;border-radius:999px;border:1px solid rgba(34,197,94,0.3);font-family:var(--font-mono);" title="Si veus aquest stamp, el bundle JS és el més recent">🏷 ${BUILD_STAMP}</code>
                <span style="flex:1;"></span>
                <a href="/dashboard" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">← ${this._esc(label('cta.back'))} Dashboard</a>
            </div>

            <div class="ds-main">
                <div class="ds-section">
                    <h2>🎨 SOS Design System v1 · principis</h2>
                    <div class="ds-principle">
                        <h4>📦 DRY · single source of truth</h4>
                        <p>Tot el copy (menús · CTAs · estats · errors · help) viu a <code>sosCopy.js</code>. Cap text duplicat entre views. <strong>${totalLabels}</strong> labels centralitzats · <strong>${navCount}</strong> nav · <strong>${ctaCount}</strong> CTAs.</p>
                    </div>
                    <div class="ds-principle">
                        <h4>🪶 KISS · 1 widget · 1 propòsit</h4>
                        <p>Forms IA-aware reusen <code>attachAIFormFeedback(container)</code> · 1 mount-point · setThinking · addEvent · setOk · setError. Cap view re-implementa feedback IA des de zero.</p>
                    </div>
                    <div class="ds-principle">
                        <h4>🧠 IA-aware UX · feedback humà-llegible</h4>
                        <p>Tots els forms i flows IA mostren <em>què</em> fa l'agent · sobre <em>quin node</em> · amb pulse animation. <code>aiActivityFeedback</code> formata 14+ event kinds.</p>
                    </div>
                    <div class="ds-principle">
                        <h4>🏛 Arquitectura informació · 7 grups</h4>
                        <p>Menus organitzats pel viatge del fundador · Fundació → Execució → Valor → Comercial · plus Swarm · Descobriment · Identitat. Max 5 items per grup.</p>
                    </div>
                </div>

                <div class="ds-section">
                    <h2>🎯 Mockup · Deluxe Dashboard</h2>
                    <p>Hero amb estat actiu de l'agent IA en temps real · CTA contextuals · 6 cards d'snapshot del projecte.</p>
                    ${heroBlock}
                    ${cards}
                </div>

                <div class="ds-section">
                    <h2>🧭 Arquitectura d'informació · menús v2</h2>
                    <p>Agrupació clara per <strong>viatge del fundador</strong> · 7 grups · max 5 items cadascun. Copy human-readable centralitzat a <code>sosCopy.js</code> (DRY).</p>
                    <div class="ds-compare">
                        <div class="ds-compare-col before">
                            <h4>Abans · 5 grups generals</h4>
                            <ul>${compareBefore}</ul>
                            <p style="color:var(--text-muted);font-size:0.78rem;margin-top:0.6rem;">⚠ Mescla idiomes (es/ca/en) · grups genèrics · sense seqüència clara · copy críptic.</p>
                        </div>
                        <div class="ds-compare-col after">
                            <h4>Després · 7 grups per viatge</h4>
                            <ul>${compareAfter}</ul>
                            <p style="color:var(--accent-green);font-size:0.78rem;margin-top:0.6rem;">✓ Català coherent · grups ordenats per cicle · max 5 items · pollejable · KISS.</p>
                        </div>
                    </div>
                    <h3>🎮 Menú v2 · live demo</h3>
                    ${menuV2Html}
                </div>

                <div class="ds-section">
                    <h2>🤖 Demo · AI Form Feedback widget (KISS · DRY)</h2>
                    <p>1 widget reutilitzable per a TOTS els forms IA. Prem els botons per veure els estats:</p>
                    <div class="ds-demo-row">
                        <button class="ds-btn ds-btn-primary" id="dsBtnThinking">🤖 setThinking()</button>
                        <button class="ds-btn" id="dsBtnOk">✓ addEvent + setOk()</button>
                        <button class="ds-btn" id="dsBtnError">✗ setError()</button>
                        <button class="ds-btn" id="dsBtnClear">↺ clear()</button>
                    </div>
                    ${renderInlineFeedbackHtml({ id: 'dsFbDemo' })}
                </div>

                <div class="ds-section">
                    <h2>🧩 Component library · DRY widgets</h2>

                    <h3>Chips · estats compactes</h3>
                    <div class="ds-demo-row">
                        <span class="ds-chip ds-chip-purple">🌸 Ikigai</span>
                        <span class="ds-chip ds-chip-green">✓ ${label('state.done')}</span>
                        <span class="ds-chip ds-chip-red">✗ ${label('state.error')}</span>
                        <span class="ds-chip" style="background:${TOKENS.colors.info}25;color:${TOKENS.colors.info};">${label('state.pending')}</span>
                    </div>

                    <h3>Tokens visuals (sosCopy.TOKENS)</h3>
                    <div class="ds-tokens">
                        ${Object.entries(TOKENS.colors).map(([k, v]) => `<span class="ds-token-swatch" style="background:${v};">${k} · ${v}</span>`).join('')}
                    </div>

                    <h3>Buttons · 2 variants</h3>
                    <div class="ds-demo-row">
                        <button class="ds-btn ds-btn-primary">${label('cta.create')}</button>
                        <button class="ds-btn">${label('cta.cancel')}</button>
                        <button class="ds-btn">${label('cta.generate')}</button>
                    </div>

                    <h3>Stats chips · breakdown</h3>
                    <div class="ds-stats-row">
                        <span class="ds-stat-chip">12 ${label('nav.market').toLowerCase()}</span>
                        <span class="ds-stat-chip" style="color:${TOKENS.colors.success};">🌐 5 permaweb</span>
                        <span class="ds-stat-chip" style="color:${TOKENS.colors.ikigai};">🌸 3 ikigai</span>
                    </div>
                </div>

                <div class="ds-section">
                    <h2>📐 Coverage del copy (audit DRY)</h2>
                    <div class="ds-stats-row">
                        ${['nav.', 'cta.', 'state.', 'hint.', 'err.', 'help.', 'group.', 'empty.'].map(cat => {
                            const count = listLabels().filter(k => k.startsWith(cat)).length;
                            return `<span class="ds-stat-chip" style="color:${TOKENS.colors.primary};">${cat}* · ${count}</span>`;
                        }).join('')}
                        <span class="ds-stat-chip" style="background:${TOKENS.colors.success}20;color:${TOKENS.colors.success};border-color:${TOKENS.colors.success}50;">total · ${totalLabels}</span>
                    </div>
                    <p style="margin-top:0.8rem;">Quan calgui nou copy · afegir clau <code>category.subkey</code> a <code>sosCopy.js</code> · les views consumeixen via <code>label('category.subkey')</code>.</p>
                </div>

                <div class="ds-section">
                    <h2>🛠 Next sprints · evolució</h2>
                    <ul>
                        <li><strong>Apply sosCopy</strong> a TOTES les views existents (~25 fitxers) · substituir text hardcoded per <code>label(...)</code> calls. PR petits per view.</li>
                        <li><strong>Apply aiFormFeedback</strong> als forms que utilitzen IA (canvas wizard · proposals · improve loop · swarm flow · etc) · remoure DOM manual.</li>
                        <li><strong>Menus v2</strong> a navService.js · usar <code>applyToNavDestinations()</code> i restructure dropdowns segons 7 grups.</li>
                        <li><strong>Component extraction</strong> · cards · stats-chips · price-box · etc · a <code>sosComponents.js</code> com a HTML helpers.</li>
                    </ul>
                </div>
            </div>
        </div>`;
    }

    _dashCard(icon, title, meta, color) {
        return `<div class="ds-card" style="border-left-color:${color};">
            <div class="ds-card-icon">${icon}</div>
            <div class="ds-card-title">${this._esc(title)}</div>
            <div class="ds-card-meta">${this._esc(meta)}</div>
        </div>`;
    }

    _hrefFor(id) {
        const map = {
            dashboard: '/home', map: '/map', sops: '/sops', kanban: '/kanban',
            wallet: '/wallet', tags: '/tags', folders: '/folders', mind: '/mind',
            sectors: '/sectors', registry: '/registry', opportunities: '/opportunities',
            market: '/market', efficiency: '/efficiency', path: '/path',
            sprint: '/sprint', savings: '/savings', value: '/value-accounting',
            pact: '/pact', presentation: '/presentation', learn: '/learn',
            skills: '/skills', matriu: '/matriu', identity: '/identity',
            canvas: '/canvas', pitch: '/pitch', tokenomics: '/tokenomics',
            accounting: '/accounting', invoices: '/invoices', proposals: '/proposals',
            lifecycle: '/lifecycle', improve: '/improve', swarm: '/swarm',
            design: '/design',
        };
        return map[id] || '#';
    }

    _esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
