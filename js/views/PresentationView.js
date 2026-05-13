// TEAMTOWERS SOS V11 — PRESENTATION VIEW (UX-AUDIT-001 sprint A2)
//
// Vista landing-style del projecte · adapta al tipus de projecte (PROJECT_TYPES).
// Mostra:
//   1. Header amb nom, sector, tipus, guardian (PW), fase
//   2. Hero adapted to projectType (slogan + 1 línia de propòsit)
//   3. Llistat de rols amb les seves transaccions IN/OUT (entregables tangibles
//      i intangibles), SOPs vinculats i SOC si n'hi ha
//   4. Resum de transaccions agrupades per tipus
//   5. CTA · cap a /map per editar · cap a /pact per signar
//
// Llegeix ?project={id}. Read-only. Imprimible. Mobile-friendly.

import { store } from '../core/store.js';
import { KB }    from '../core/kb.js';
import { renderNavGroupedHtml } from '../core/navService.js';
import { getProjectTypeById, getGuardianById } from '../core/critical108Roles.js';
// LANDING-UNIFY-001 · usem aiFillService (escalation chain · 5 providers ·
// marge SOS + audit log) en lloc de Orchestrator.callLLM (Anthropic-only legacy)
// UX-AUDIT-001 sprint F · PUBLIC_AUDIENCES per al selector de la narrativa IA
import { PUBLIC_AUDIENCES } from '../core/skillTaxonomyExtension.js';
import { getSubtypeById } from '../core/sectorSubtypes.js';

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
}

// Hero text per project type · personalitzable per cada plantilla
const HERO_TEXTS = Object.freeze({
    'comunitat-autosuficient':   { tag: 'Comunitat autosuficient',          mantra: 'Hortet · ateneu · cura · transició energètica.',                 cta: 'Sumar-me al col·lectiu' },
    'startup-coop-tradicional':  { tag: 'Startup cooperativa',              mantra: 'Founders que renuncien a VC tradicional · cap-table oberta.',     cta: 'Veure el pacte de socis' },
    'empresa-en-transicio':      { tag: 'Empresa en transició',             mantra: 'Conversió a SCCL · slicing pie aplicat a equips existents.',      cta: 'Iniciar conversió' },
    'cooperativa-multi':         { tag: 'Cooperativa multi-stakeholder',    mantra: 'Consum · treball · serveis · habitatge en una sola entitat.',     cta: 'Sumar-me' },
    'fundacio-ong':              { tag: 'Fundació · ONG',                   mantra: 'Sense repartiment · amb governance complexa i operativa SOP.',     cta: 'Donar suport' },
    'ecosistema-regional':       { tag: 'Ecosistema regional regeneratiu',  mantra: 'Comarcal · biorregional · cooperatives federades.',                cta: 'Federar-me' },
    'dao-web3':                  { tag: 'DAO Web3',                         mantra: 'RegenDAO · ReFi · DAO amb projectes físics.',                      cta: 'Connectar wallet' },
    'plataforma-cooperativa':    { tag: 'Plataforma cooperativa digital',   mantra: 'Alternativa a Uber/Airbnb · governance dels treballadors.',         cta: 'Crear compte' },
    'cooperativa-cures':         { tag: 'Cooperativa de cures',             mantra: 'Cura mental · diversitat funcional · majors · final de vida.',     cta: 'Sumar-me a les cures' },
    'espai-autogestionat':       { tag: 'Espai autogestionat',              mantra: 'Ateneu de barri · co-housing · espais culturals oberts.',          cta: 'Visitar' },
    'hub-transicio':             { tag: 'Hub de transició sectorial',       mantra: 'Alimentari · energètic · cultural · digital sostenible.',          cta: 'Sumar-me al hub' },
    'familiar-relevo':           { tag: 'Empresa familiar en relleu',       mantra: 'Successió ordenada · capital paterno-familiar a cooperatiu.',     cta: 'Iniciar relleu' },
});

export default class PresentationView {
    constructor() {
        document.title = 'Presentació · SOS V11';
        const params = new URLSearchParams(window.location.search);
        this._projectId = params.get('project') || null;
    }

    async getHtml() {
        await store.init();
        await KB.init();

        const projects = store.getState().projects || [];
        const project  = this._projectId ? projects.find(p => p && p.id === this._projectId) : null;

        if (!project) {
            return `
                <div style="max-width:680px;margin:80px auto;padding:2rem;text-align:center;color:var(--text-secondary);">
                    <div style="font-size:3rem;margin-bottom:1rem;">📊</div>
                    <h1 style="margin-bottom:1rem;color:var(--text-main);">Presentació del projecte</h1>
                    <p style="margin-bottom:2rem;">Necessites obrir aquesta vista des d'un projecte concret.</p>
                    <a href="/dashboard" data-link style="color:var(--accent-indigo);text-decoration:underline;">← Tornar al dashboard</a>
                </div>`;
        }

        // KB queries · roles, tx, sops, work_orders, soc
        const [rolesNodes, txNodes, sops, wos, socs] = await Promise.all([
            KB.query({ type: 'role',         projectId: project.id }),
            KB.query({ type: 'transaction',  projectId: project.id }),
            KB.query({ type: 'sop',          projectId: project.id }),
            KB.query({ type: 'work_order',   projectId: project.id }),
            KB.query({ type: 'soc',          projectId: project.id }),
        ]);

        // Fallback · si store té vna_roles/transactions, usar-los
        const roles = (rolesNodes || []).length > 0
            ? rolesNodes.map(n => ({ id: n.id, ...n.content }))
            : (project.vna_roles || []);
        const transactions = (txNodes || []).length > 0
            ? txNodes.map(n => ({ id: n.id, ...n.content }))
            : (project.vna_transactions || []);

        const ptype = project.projectType ? getProjectTypeById(project.projectType) : null;
        const hero  = HERO_TEXTS[project.projectType] || { tag: 'Projecte SOS', mantra: 'Un mapa de valor obert · slicing pie · tarta del projecte.', cta: 'Sumar-me' };
        const guardian = project.guardianId ? getGuardianById(project.guardianId) : null;

        // SOPs per rol
        const sopsByRole = new Map();
        (sops || []).forEach(s => {
            const rid = s?.content?.roleId;
            if (rid) {
                if (!sopsByRole.has(rid)) sopsByRole.set(rid, []);
                sopsByRole.get(rid).push(s);
            }
        });

        // SOC global del projecte
        const projectSoc = (socs || []).find(s => s?.content?.kind === 'project-soc' || !s?.content?.roleId);

        // WOs per rol
        const wosByRole = new Map();
        (wos || []).forEach(w => {
            const rid = w?.content?.roleId;
            if (rid) {
                if (!wosByRole.has(rid)) wosByRole.set(rid, []);
                wosByRole.get(rid).push(w);
            }
        });

        // Tx IN/OUT per rol
        const txByRoleOut = new Map();
        const txByRoleIn  = new Map();
        (transactions || []).forEach(t => {
            const from = t.from || t.source;
            const to   = t.to   || t.target;
            if (from) {
                if (!txByRoleOut.has(from)) txByRoleOut.set(from, []);
                txByRoleOut.get(from).push(t);
            }
            if (to) {
                if (!txByRoleIn.has(to)) txByRoleIn.set(to, []);
                txByRoleIn.get(to).push(t);
            }
        });

        const txTangibles   = (transactions || []).filter(t => (t.kind || t.tipo) === 'tangible' || (t.kind || t.tipo) === 'tangible-physical' || (t.tipo === 'tangible-money'));
        const txIntangibles = (transactions || []).filter(t => (t.kind || t.tipo) === 'intangible');

        // UX-AUDIT-001 sprint F · narrativa IA persistida (si existeix · sobreescriu hero + role descs)
        // LANDING-UNIFY-001 · retro-compat · si està guardat com a string legacy
        // (versions <2026-05) el tractem com a bodyMarkdown · zero pèrdua dades.
        let narrative = project.presentation_narrative_v1 || null;
        if (typeof narrative === 'string') {
            narrative = { bodyMarkdown: narrative, audienceId: null, generatedAt: null, roleDescriptions: {} };
        }
        const heroTitle = (narrative && narrative.heroTitle)  ? narrative.heroTitle  : (project.nombre || project.name || 'Projecte');
        const heroMantra = (narrative && narrative.heroMantra) ? narrative.heroMantra : hero.mantra;
        const heroTag    = (narrative && narrative.heroTag)    ? narrative.heroTag    : hero.tag;
        const narrativeAudience = narrative?.audienceId || null;
        const narrativeAt       = narrative?.generatedAt || null;
        // LANDING-UNIFY-001 · description visible · prioritza la d'al projecte
        // (s'omple amb /quality "Ompli amb IA" landing) · fallback purpose
        const projectDescription = (project.description || project.purpose || '').toString().trim();
        const bodyMarkdown = (narrative && typeof narrative.bodyMarkdown === 'string') ? narrative.bodyMarkdown : null;
        // Subtipus llegit per pintar al meta
        const subtype = (project.sectorId && project.subtypeId) ? getSubtypeById(project.sectorId, project.subtypeId) : null;

        // Cache global · expose project + roles per als handlers async
        this._project       = project;
        this._roles         = roles;
        this._narrative     = narrative;

        return `
        <style>
            .pv-wrap { max-width: 1080px; margin: 0 auto; padding: var(--space-8) var(--space-6); animation: fadeIn 0.4s var(--ease-out); color: var(--text-main); }
            .pv-topbar { display:flex; align-items:center; gap:1rem; padding: 0 0 var(--space-4) 0; border-bottom: 1px solid var(--border-default); margin-bottom: var(--space-8); flex-wrap:wrap; }
            .pv-back { color: var(--text-secondary); text-decoration: none; font-size: var(--text-sm); }
            .pv-back:hover { color: var(--accent-indigo); }
            .pv-hero { padding: var(--space-12) 0 var(--space-8) 0; text-align: center; }
            .pv-hero .pv-tag { display:inline-block; padding: 4px 14px; border: 1px solid var(--accent-indigo); color: var(--accent-indigo); border-radius: var(--radius-full); font-size: var(--text-xs); font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: var(--space-4); }
            .pv-hero h1 { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 900; line-height: 1.1; margin-bottom: var(--space-3); color: var(--text-main); }
            .pv-hero .pv-mantra { font-family: var(--font-serif); font-style: italic; font-size: clamp(1.1rem, 2.5vw, 1.4rem); color: var(--text-secondary); max-width: 720px; margin: 0 auto var(--space-6); }
            .pv-hero .pv-meta { display:flex; gap:var(--space-3); justify-content:center; flex-wrap:wrap; font-size: var(--text-xs); color: var(--text-muted); }
            .pv-hero .pv-meta span { padding: 4px 10px; background: var(--bg-elevated); border-radius: var(--radius-full); border: 1px solid var(--border-default); }
            .pv-section { margin-bottom: var(--space-12); }
            .pv-section-title { font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.15em; color: var(--text-muted); margin-bottom: var(--space-4); border-bottom: 1px solid var(--border-default); padding-bottom: var(--space-2); }
            .pv-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-4); }
            .pv-role-card { background: var(--bg-panel); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: var(--space-6); transition: transform 0.2s, border-color 0.2s; }
            .pv-role-card:hover { transform: translateY(-2px); border-color: var(--accent-indigo); }
            .pv-role-name { font-size: var(--text-lg); font-weight: 800; color: var(--text-main); margin-bottom: var(--space-2); }
            .pv-role-desc { color: var(--text-secondary); font-size: var(--text-sm); margin-bottom: var(--space-4); }
            .pv-role-section { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin: var(--space-3) 0 var(--space-2); font-weight: 700; }
            .pv-tx { display:flex; align-items:flex-start; gap: 0.5rem; padding: 6px 0; font-size: var(--text-sm); color: var(--text-main); border-bottom: 1px dashed var(--border-default); }
            .pv-tx:last-child { border-bottom: 0; }
            .pv-tx-icon { width: 20px; flex-shrink: 0; }
            .pv-tx-tangible   { color: var(--accent-green); }
            .pv-tx-intangible { color: var(--accent-orange); }
            .pv-sop-pill { display:inline-block; padding: 2px 8px; background: rgba(99,102,241,0.12); color: var(--accent-indigo); border-radius: var(--radius-sm); font-size: 0.7rem; margin: 2px 4px 2px 0; }
            .pv-stat-strip { display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-8); }
            .pv-stat { background: var(--bg-elevated); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: var(--space-4); text-align:center; }
            .pv-stat-num { font-size: var(--text-2xl); font-weight: 900; color: var(--accent-indigo); }
            .pv-stat-lbl { font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
            .pv-cta { display:flex; gap: var(--space-3); justify-content:center; padding: var(--space-8); border-top: 1px solid var(--border-default); margin-top: var(--space-12); flex-wrap: wrap; }
            .pv-cta a { padding: 10px 24px; border-radius: var(--radius-full); text-decoration:none; font-weight: 700; font-size: var(--text-sm); }
            .pv-cta-primary { background: var(--accent-indigo); color: white !important; }
            .pv-cta-secondary { background: transparent; color: var(--accent-indigo) !important; border: 1px solid var(--accent-indigo); }
            .pv-print-hide { display:none; }
            @media print {
                body { background: white !important; color: black !important; }
                .pv-topbar, .pv-cta, .pv-print-hide-mobile { display:none !important; }
                .pv-role-card { break-inside: avoid; page-break-inside: avoid; }
            }
            @media (max-width: 720px) {
                .pv-grid { grid-template-columns: 1fr; }
                .pv-hero { padding: var(--space-8) 0 var(--space-6) 0; }
            }
        </style>

        <div class="pv-wrap">
            <div class="pv-topbar pv-print-hide-mobile">
                <a href="/dashboard" data-link class="pv-back">← Dashboard</a>
                <span style="color:var(--text-muted);">·</span>
                <a href="/project/${esc(project.id)}" data-link class="pv-back">🎛 ${esc(project.nombre || project.name || project.id)}</a>
                <span style="color:var(--text-muted);">·</span>
                <a href="/map?project=${encodeURIComponent(project.id)}" data-link class="pv-back">🗺 Editar mapa</a>
                <div style="margin-left:auto;display:flex;gap:0.5rem;align-items:center;">
                    
                    <button id="pvBtnPrint" class="pv-back" style="background:transparent;border:1px solid var(--border-default);padding:6px 12px;border-radius:var(--radius-sm);cursor:pointer;font-size:var(--text-xs);">🖨 Imprimir / PDF</button>
                </div>
            </div>

            <div class="pv-hero">
                <div class="pv-tag">${esc(heroTag)}</div>
                <h1>${esc(heroTitle)}</h1>
                <div class="pv-mantra">${esc(heroMantra)}</div>
                <div class="pv-meta">
                    ${ptype ? `<span>📦 ${esc(ptype.label)}</span>` : ''}
                    ${project.sectorId ? `<span>🏷 ${esc(project.sectorId)}</span>` : ''}
                    ${subtype ? `<span>· ${esc(subtype.label)}</span>` : ''}
                    ${guardian ? `<span>🪶 ${esc(guardian.icon || '✦')} ${esc(guardian.name || guardian.id)}</span>` : ''}
                    ${project.matriuCohort === 0 ? `<span style="border-color:#c25a3a;color:#c25a3a;">✦ Matriu Cohort 0</span>` : ''}
                    ${narrative ? `<span style="border-color:var(--accent-purple);color:var(--accent-purple);" title="Narrativa generada amb IA · audiència ${esc(narrativeAudience || '·')} · ${narrativeAt ? new Date(narrativeAt).toLocaleString() : ''}">🤖 IA · ${esc(narrativeAudience || '·')}</span>` : ''}
                </div>
            </div>

            ${projectDescription || bodyMarkdown ? `
            <!-- LANDING-UNIFY-001 · description + bodyMarkdown generats des de /quality fill IA -->
            <div class="pv-section" style="max-width:760px;margin-left:auto;margin-right:auto;">
                ${projectDescription ? `<p style="font-size:var(--text-md);color:var(--text-main);line-height:1.6;margin:0 0 var(--space-4);">${esc(projectDescription)}</p>` : ''}
                ${bodyMarkdown ? `<div class="pv-body-md" style="color:var(--text-secondary);font-size:var(--text-sm);line-height:1.7;">${this._renderMarkdown(bodyMarkdown)}</div>` : ''}
            </div>` : ''}

            <!-- LANDING-UNIFY-001 · regeneració per audiència · usa escalation chain · BIZ-MODEL marges + audit log -->
            <div class="pv-section pv-print-hide-mobile" style="background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:var(--space-6);">
                <div style="display:flex;gap:var(--space-3);align-items:center;flex-wrap:wrap;">
                    <span style="font-weight:800;color:var(--accent-purple);">🤖 Narrativa IA per audiència</span>
                    <span class="pv-mut" style="font-size:var(--text-xs);color:var(--text-muted);flex:1;min-width:200px;">Regenera la landing adaptant el to a l'audiència triada · usa l'escalation chain (5 providers · cost auditat).</span>
                    <select id="pvAudience" class="pv-back" style="background:var(--bg-panel);color:var(--text-main);border:1px solid var(--border-default);padding:6px 10px;border-radius:var(--radius-sm);font-size:var(--text-xs);">
                        ${PUBLIC_AUDIENCES.map(a => `<option value="${a.id}" ${narrativeAudience === a.id ? 'selected' : ''}>${a.icon} ${esc(a.label)}</option>`).join('')}
                    </select>
                    <button id="pvBtnGenerateNarrative" class="pv-back" style="background:var(--accent-purple);color:var(--text-main);border:0;padding:8px 16px;border-radius:var(--radius-sm);cursor:pointer;font-weight:700;font-size:var(--text-xs);">${narrative ? '↻ Regenerar' : '🤖 Generar'}</button>
                    ${narrative ? `<button id="pvBtnClearNarrative" class="pv-back" style="background:transparent;color:var(--accent-red);border:1px solid var(--accent-red);padding:8px 12px;border-radius:var(--radius-sm);cursor:pointer;font-weight:700;font-size:var(--text-xs);">✕ Esborrar</button>` : ''}
                </div>
                <div id="pvNarrativeStatus" style="margin-top:var(--space-3);font-size:var(--text-xs);color:var(--text-muted);font-family:var(--font-mono);min-height:18px;"></div>
                <div style="margin-top:var(--space-2);font-size:11px;color:var(--text-muted);">
                    Es genera <strong>tota la landing</strong> · hero + description + body + roleDescriptions ·
                    omplible inicialment des de <a href="/quality?project=${encodeURIComponent(project.id)}" data-link style="color:var(--accent-indigo);">📊 /quality → 🎨 Landing → 🧠 Ompli amb IA</a>.
                </div>
            </div>

            <div class="pv-stat-strip">
                <div class="pv-stat"><div class="pv-stat-num">${roles.length}</div><div class="pv-stat-lbl">Rols</div></div>
                <div class="pv-stat"><div class="pv-stat-num">${transactions.length}</div><div class="pv-stat-lbl">Transaccions</div></div>
                <div class="pv-stat"><div class="pv-stat-num" style="color:var(--accent-green);">${txTangibles.length}</div><div class="pv-stat-lbl">Tangibles</div></div>
                <div class="pv-stat"><div class="pv-stat-num" style="color:var(--accent-orange);">${txIntangibles.length}</div><div class="pv-stat-lbl">Intangibles</div></div>
                <div class="pv-stat"><div class="pv-stat-num">${(sops || []).length}</div><div class="pv-stat-lbl">SOPs</div></div>
                <div class="pv-stat"><div class="pv-stat-num">${(wos || []).length}</div><div class="pv-stat-lbl">Work Orders</div></div>
            </div>

            ${projectSoc ? `
                <div class="pv-section">
                    <div class="pv-section-title">📜 SOC · Standard Operating Charter</div>
                    <div style="background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:var(--space-6);font-family:var(--font-serif);font-style:italic;color:var(--text-secondary);line-height:1.7;">
                        ${esc(projectSoc.content?.text || projectSoc.content?.body || projectSoc.content?.charter || 'SOC sense text · obre /pact per editar')}
                    </div>
                </div>
            ` : ''}

            <div class="pv-section">
                <div class="pv-section-title">👥 Rols i entregables</div>
                <div class="pv-grid">
                    ${(roles.length === 0)
                        ? `<div style="grid-column:1/-1;padding:var(--space-8);text-align:center;color:var(--text-muted);">Encara no hi ha rols definits. Obre <a href="/map?project=${encodeURIComponent(project.id)}" data-link style="color:var(--accent-indigo);">el mapa de valor</a> per crear-los.</div>`
                        : roles.map(r => {
                            const out = txByRoleOut.get(r.id) || [];
                            const inn = txByRoleIn.get(r.id)  || [];
                            const rsops = sopsByRole.get(r.id) || [];
                            const rwos  = wosByRole.get(r.id)  || [];
                            // UX-AUDIT-001 sprint F · si hi ha narrativa IA, fa servir la descripció generada
                            const iaDesc = (narrative && narrative.roleDescriptions && narrative.roleDescriptions[r.id]) || null;
                            const showDesc = iaDesc || r.description || '';
                            return `
                            <div class="pv-role-card">
                                <div class="pv-role-name">${esc(r.label || r.name || r.id)}</div>
                                ${showDesc ? `<div class="pv-role-desc">${esc(showDesc)}${iaDesc ? ' <span style="color:var(--accent-purple);font-size:0.7em;">🤖</span>' : ''}</div>` : ''}
                                ${out.length > 0 ? `
                                    <div class="pv-role-section">↗ Entregables (OUT)</div>
                                    ${out.slice(0, 8).map(t => {
                                        const isTan = (t.kind || t.tipo || '').includes('tangible') || (t.tipo === 'tangible-money');
                                        return `<div class="pv-tx ${isTan ? 'pv-tx-tangible' : 'pv-tx-intangible'}"><span class="pv-tx-icon">${isTan ? '◆' : '◇'}</span>${esc(t.label || t.name || t.deliverable || '·')}</div>`;
                                    }).join('')}
                                ` : ''}
                                ${inn.length > 0 ? `
                                    <div class="pv-role-section">↙ Rep (IN)</div>
                                    ${inn.slice(0, 6).map(t => {
                                        const isTan = (t.kind || t.tipo || '').includes('tangible') || (t.tipo === 'tangible-money');
                                        return `<div class="pv-tx ${isTan ? 'pv-tx-tangible' : 'pv-tx-intangible'}"><span class="pv-tx-icon">${isTan ? '◆' : '◇'}</span>${esc(t.label || t.name || t.deliverable || '·')}</div>`;
                                    }).join('')}
                                ` : ''}
                                ${rsops.length > 0 ? `
                                    <div class="pv-role-section">📜 SOPs</div>
                                    <div>${rsops.slice(0, 6).map(s => `<a href="/sops?project=${encodeURIComponent(project.id)}" data-link class="pv-sop-pill">${esc(s.content?.title || s.id)}</a>`).join('')}</div>
                                ` : ''}
                                ${rwos.length > 0 ? `
                                    <div class="pv-role-section">📋 Work Orders</div>
                                    <div style="font-size:var(--text-xs);color:var(--text-muted);">${rwos.length} WO · ${rwos.filter(w => w.content?.status === 'ledgered').length} ledgered</div>
                                ` : ''}
                            </div>`;
                        }).join('')
                    }
                </div>
            </div>

            <div class="pv-cta pv-print-hide-mobile">
                <a href="/map?project=${encodeURIComponent(project.id)}" data-link class="pv-cta-primary">🗺 Editar mapa de valor</a>
                <a href="/pact?project=${encodeURIComponent(project.id)}" data-link class="pv-cta-secondary">📜 Pacte de socis</a>
                <a href="/value-accounting?project=${encodeURIComponent(project.id)}" data-link class="pv-cta-secondary">🥧 Tarta del projecte</a>
            </div>
        </div>`;
    }

    // LANDING-UNIFY-001 · render mínim de markdown · sols #/##/###, **bold**,
    // *italic*, llistes - · paràgrafs separats per \n\n · escapa HTML primer.
    _renderMarkdown(md) {
        if (!md || typeof md !== 'string') return '';
        // 1 · escape HTML
        const escaped = md.replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
        // 2 · process per blocs separats per \n\n
        const blocks = escaped.split(/\n{2,}/);
        const out = blocks.map(block => {
            const trimmed = block.trim();
            if (!trimmed) return '';
            // Headings
            if (trimmed.startsWith('### ')) return '<h3 style="margin:14px 0 6px;color:var(--text-main);font-size:1rem;">' + this._mdInline(trimmed.slice(4)) + '</h3>';
            if (trimmed.startsWith('## '))  return '<h2 style="margin:18px 0 8px;color:var(--text-main);font-size:1.1rem;font-weight:800;">' + this._mdInline(trimmed.slice(3)) + '</h2>';
            if (trimmed.startsWith('# '))   return '<h1 style="margin:22px 0 10px;color:var(--text-main);font-size:1.25rem;font-weight:900;">' + this._mdInline(trimmed.slice(2)) + '</h1>';
            // Llista · totes les línies comencen per "- "
            const lines = trimmed.split('\n');
            if (lines.every(l => /^[-*]\s/.test(l.trim()))) {
                return '<ul style="margin:6px 0;padding-left:1.4em;">' + lines.map(l => '<li>' + this._mdInline(l.trim().replace(/^[-*]\s+/, '')) + '</li>').join('') + '</ul>';
            }
            // Paràgraf normal
            return '<p style="margin:8px 0;">' + this._mdInline(trimmed.replace(/\n/g, '<br>')) + '</p>';
        }).filter(Boolean);
        return out.join('\n');
    }
    _mdInline(s) {
        // bold **x** · italic *x*
        return s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    }

    async afterRender() {
        document.getElementById('pvBtnPrint')?.addEventListener('click', () => {
            window.print();
        });

        // LANDING-UNIFY-001 · generar narrativa IA via aiFillService (escalation
        // chain · 5 providers · marge SOS · audit log) · audienceId opcional.
        document.getElementById('pvBtnGenerateNarrative')?.addEventListener('click', async () => {
            const btn      = document.getElementById('pvBtnGenerateNarrative');
            const status   = document.getElementById('pvNarrativeStatus');
            const audience = document.getElementById('pvAudience')?.value || 'fundadors';
            if (!btn || !this._project) return;
            const audienceMeta = PUBLIC_AUDIENCES.find(a => a.id === audience);
            const orig = btn.textContent;
            btn.disabled = true;
            btn.textContent = '⏳ Generant…';
            if (status) {
                status.style.color = 'var(--text-muted)';
                status.textContent = 'Escalation chain · primary → fallback → premium · ~5-15s.';
            }
            try {
                const { aiFillDim, markAuditAccepted } = await import('../core/aiFillService.js');
                const { commitApply } = await import('../core/aiApplyService.js');
                const result = await aiFillDim({
                    projectId:       this._project.id,
                    dimId:           'landing',
                    audienceId:      audience,
                    maxOutputTokens: 1400,
                    temperature:     0.4,
                });
                if (!result.draft || !result.parsedDraft) {
                    throw new Error('La IA no ha retornat JSON parseable · ' + (result.escalatedExhausted ? 'chain exhaurida' : 'desconegut'));
                }
                const apply = await commitApply({
                    projectId:   this._project.id,
                    dimId:       'landing',
                    parsedDraft: result.parsedDraft,
                    store, kb: KB,
                });
                await markAuditAccepted(result.auditId).catch(() => {});
                if (status) {
                    status.style.color = 'var(--accent-green)';
                    status.innerHTML = `✓ ${apply.applied ? apply.summary : 'aplicat'} · model <code>${esc(result.modelKey || '?')}</code> · ` +
                        `${(result.totalWithMarginEur || result.totalCostEur).toFixed(4)}€ · re-renderitzant…`;
                }
                setTimeout(async () => {
                    const app = document.getElementById('app');
                    if (app) {
                        app.innerHTML = await this.getHtml();
                        await this.afterRender();
                    }
                }, 350);
            } catch (err) {
                console.error('[LANDING-UNIFY-001] generar narrativa:', err);
                if (status) {
                    status.style.color = 'var(--accent-red)';
                    if (err?.code === 'no-api-key') {
                        const provs = (err.providers && err.providers.length) ? err.providers.join(', ') : 'els providers';
                        status.innerHTML = '✗ Falta API key (' + esc(provs) + ') · <a href="/settings" data-link style="color:var(--accent-indigo);text-decoration:underline;">obrir Settings</a>';
                    } else {
                        status.textContent = '✗ ' + ((err?.message || 'error desconegut').slice(0, 200));
                    }
                }
                btn.disabled = false;
                btn.textContent = orig;
            }
        });

        // Esborrar narrativa
        document.getElementById('pvBtnClearNarrative')?.addEventListener('click', async () => {
            if (!this._project) return;
            if (!confirm('Esborrar la narrativa IA? El hero i descripcions tornaran als textos default per projectType.')) return;
            try {
                await store.dispatch({
                    type: 'UPDATE_PROJECT_INFO',
                    payload: {
                        projectId: this._project.id,
                        updates:   { presentation_narrative_v1: null, updatedAt: Date.now() },
                    }
                });
                const app = document.getElementById('app');
                if (app) {
                    app.innerHTML = await this.getHtml();
                    await this.afterRender();
                }
            } catch (err) {
                alert('Error esborrant narrativa: ' + (err?.message || err));
            }
        });
    }
}
